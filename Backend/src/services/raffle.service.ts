import mongoose from "mongoose";
import PaymentTransaction from "../models/payment-transaction.model.js";
import Raffle from "../models/raffle.model.js";
import RaffleNumber, { normalizeRaffleNumberInput } from "../models/raffle-number.model.js";
import RaffleTicket from "../models/raffle-ticket.model.js";
import User from "../models/user.model.js";
import {
  Channel,
  PaymentMethod,
  PaymentPayableType,
  PaymentTransactionStatus,
  RaffleNumberStatus,
  RaffleStatus,
  TicketStatus,
  UserRole,
} from "../models/enums.js";
import { cleanupExpiredRaffleReservations } from "./payment.service.js";
import { assertRaffleSalesOpen, hasRaffleDrawDate, withRaffleSaleClosesAt } from "../utils/raffle-sale-window.js";

export interface ListRafflesParams {
  status?: string;
  page: number;
  limit: number;
}

interface PurchaseRaffleTicketsParams {
  userId?: string;
  numbers?: Array<string | number>;
  channel?: string;
  paymentMethod?: string;
  paymentReference?: string;
  status?: string;
}

interface ActorContext {
  id: string;
  role: UserRole;
}

function isFreeRaffleIdentityDuplicateError(error: unknown) {
  const duplicateError = error as {
    code?: number;
    keyPattern?: Record<string, number>;
    message?: string;
  };

  return duplicateError.code === 11000 && (
    (duplicateError.keyPattern?.raffle === 1 && duplicateError.keyPattern?.participantIdentityDocument === 1)
    || duplicateError.message?.includes("free_raffle_identity_once_per_raffle")
  );
}

function toObjectId(id: string, fieldName: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`${fieldName} inválido.`);
  }

  return new mongoose.Types.ObjectId(id);
}

function getTicketStatus(inputStatus?: TicketStatus) {
  if (!inputStatus) return TicketStatus.RESERVED;

  if (inputStatus !== TicketStatus.RESERVED && inputStatus !== TicketStatus.PAID) {
    throw new Error("Solo se permite crear boletos RESERVED o PAID.");
  }

  return inputStatus;
}

function getPurchaseChannel(inputChannel?: string) {
  if (!inputChannel) return Channel.WEB;

  if (!Object.values(Channel).includes(inputChannel as Channel)) {
    throw new Error("Canal de compra inválido.");
  }

  return inputChannel as Channel;
}

function getPaymentMethod(inputMethod?: string) {
  if (!inputMethod) return undefined;

  if (!Object.values(PaymentMethod).includes(inputMethod as PaymentMethod)) {
    throw new Error("Método de pago inválido.");
  }

  return inputMethod as PaymentMethod;
}

function normalizeWinningNumberInput(value: string | number, totalTickets: number) {
  return String(value ?? "").trim() === ""
    ? undefined
    : String(value);
}

async function getRandomAvailableRaffleNumber(raffleId: mongoose.Types.ObjectId) {
  const availableCount = await RaffleNumber.countDocuments({
    raffle: raffleId,
    status: RaffleNumberStatus.AVAILABLE,
  });

  if (availableCount === 0) {
    throw new Error("No hay números disponibles en esta rifa.");
  }

  const randomOffset = Math.floor(Math.random() * availableCount);
  const randomNumber = await RaffleNumber.findOne({
    raffle: raffleId,
    status: RaffleNumberStatus.AVAILABLE,
  })
    .sort({ numericValue: 1 })
    .skip(randomOffset)
    .select("number")
    .lean();

  if (!randomNumber) {
    throw new Error("No fue posible asignar un número aleatorio para la rifa.");
  }

  return randomNumber.number;
}

function getTicketPriceValue(input: unknown) {
  const ticketPrice = typeof input === "number" ? input : Number(input);

  if (!Number.isFinite(ticketPrice) || ticketPrice < 0) {
    throw new Error("ticketPrice inválido.");
  }

  return ticketPrice;
}

function normalizeRafflePricingData(data: Record<string, unknown>) {
  const ticketPrice = getTicketPriceValue(data.ticketPrice);
  const explicitIsFree = typeof data.isFree === "boolean" ? data.isFree : undefined;

  if (explicitIsFree === true && ticketPrice > 0) {
    throw new Error("Una rifa gratuita debe tener ticketPrice en 0.");
  }

  if (explicitIsFree === false && ticketPrice === 0) {
    throw new Error("Una rifa con costo debe tener ticketPrice mayor a 0.");
  }

  return {
    ...data,
    ticketPrice,
  };
}

export async function createRaffleService(data: Record<string, unknown>, createdBy: string) {
  const createdById = toObjectId(createdBy, "createdBy");
  const normalizedData = normalizeRafflePricingData(data);

  const raffle = await Raffle.create({
    ...normalizedData,
    createdBy: createdById,
    soldTickets: 0,
  });

  const createdRaffle = await Raffle.findById(raffle._id)
    .populate("createdBy", "name")
    .lean({ virtuals: true });

  return createdRaffle ? withRaffleSaleClosesAt(createdRaffle) : raffle;
}

export async function deleteRaffleService(id: string) {
  const raffleId = toObjectId(id, "Raffle ID");
  await cleanupExpiredRaffleReservations(id);

  const raffle = await Raffle.findById(raffleId).select("_id name status").lean();
  if (!raffle) {
    throw new Error("Rifa no encontrada.");
  }

  if (raffle.status === RaffleStatus.DRAWN) {
    throw new Error("No se puede eliminar una rifa que ya fue sorteada.");
  }

  const blockingTicket = await RaffleTicket.findOne({
    raffle: raffleId,
    status: { $in: [TicketStatus.RESERVED, TicketStatus.PAID, TicketStatus.WINNER] },
  })
    .select("_id status")
    .lean();

  if (blockingTicket) {
    throw new Error("No se puede eliminar una rifa con boletos activos o confirmados.");
  }

  const raffleTickets = await RaffleTicket.find({ raffle: raffleId }).select("_id").lean();
  const ticketIds = raffleTickets.map((ticket) => ticket._id);

  const blockingPayment = ticketIds.length > 0
    ? await PaymentTransaction.findOne({
      payableType: PaymentPayableType.RAFFLE_TICKET,
      payableId: { $in: ticketIds },
      status: { $in: [PaymentTransactionStatus.PENDING, PaymentTransactionStatus.APPROVED] },
    })
      .select("_id status")
      .lean()
    : null;

  if (blockingPayment) {
    throw new Error("No se puede eliminar una rifa con transacciones de pago activas o aprobadas.");
  }

  const [deletedNumbers, deletedTickets, deletedPayments] = await Promise.all([
    RaffleNumber.deleteMany({ raffle: raffleId }),
    RaffleTicket.deleteMany({ raffle: raffleId }),
    ticketIds.length > 0
      ? PaymentTransaction.deleteMany({
        payableType: PaymentPayableType.RAFFLE_TICKET,
        payableId: { $in: ticketIds },
      })
      : Promise.resolve({ deletedCount: 0 }),
  ]);

  await Raffle.deleteOne({ _id: raffleId });

  return {
    raffleId: raffle._id,
    raffleName: raffle.name,
    deletedNumbers: deletedNumbers.deletedCount ?? 0,
    deletedTickets: deletedTickets.deletedCount ?? 0,
    deletedPayments: deletedPayments.deletedCount ?? 0,
  };
}

export async function listRafflesService(params: ListRafflesParams) {
  const { status, page, limit } = params;
  const filter: Record<string, unknown> = {};

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;
  const [raffles, total] = await Promise.all([
    Raffle.find(filter)
      .populate("winner", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    Raffle.countDocuments(filter),
  ]);

  return { raffles: raffles.map((raffle) => withRaffleSaleClosesAt(raffle)), total };
}

export async function getRaffleByIdService(id: string) {
  const raffleId = toObjectId(id, "Raffle ID");
  await cleanupExpiredRaffleReservations(id);

  const raffle = await Raffle.findById(raffleId)
    .populate("winner", "name avatarUrl")
    .populate("createdBy", "name avatarUrl")
    .lean({ virtuals: true });

  if (!raffle) {
    throw new Error("Rifa no encontrada.");
  }

  const [availableCount, reservedCount, paidCount, winnerCount] = await Promise.all([
    RaffleNumber.countDocuments({ raffle: raffleId, status: RaffleNumberStatus.AVAILABLE }),
    RaffleNumber.countDocuments({ raffle: raffleId, status: RaffleNumberStatus.RESERVED }),
    RaffleNumber.countDocuments({ raffle: raffleId, status: RaffleNumberStatus.PAID }),
    RaffleNumber.countDocuments({ raffle: raffleId, status: RaffleNumberStatus.WINNER }),
  ]);

  return {
    ...withRaffleSaleClosesAt(raffle),
    numberSummary: {
      available: availableCount,
      reserved: reservedCount,
      paid: paidCount,
      winner: winnerCount,
    },
  };
}

export async function getRaffleNumbersService(
  id: string,
  options: { status?: string; page: number; limit: number },
) {
  const raffleId = toObjectId(id, "Raffle ID");
  await cleanupExpiredRaffleReservations(id);
  const raffle = await Raffle.findById(raffleId).select("_id totalTickets drawDate").lean();

  if (!raffle) {
    throw new Error("Rifa no encontrada.");
  }

  const filter: Record<string, unknown> = { raffle: raffleId };
  if (options.status) {
    filter.status = options.status;
  }

  const skip = (options.page - 1) * options.limit;
  const [numbers, total] = await Promise.all([
    RaffleNumber.find(filter)
      .sort({ numericValue: 1 })
      .skip(skip)
      .limit(options.limit)
      .lean(),
    RaffleNumber.countDocuments(filter),
  ]);

  return {
    raffleId: raffle._id,
    totalTickets: raffle.totalTickets,
    ...(withRaffleSaleClosesAt(raffle).saleClosesAt ? { saleClosesAt: withRaffleSaleClosesAt(raffle).saleClosesAt } : {}),
    ...(withRaffleSaleClosesAt(raffle).saleStatus ? { saleStatus: withRaffleSaleClosesAt(raffle).saleStatus } : {}),
    total,
    page: options.page,
    limit: options.limit,
    numbers,
  };
}

export async function getRaffleNumberOwnersService(
  id: string,
  options: { status?: string; page: number; limit: number },
) {
  const raffleId = toObjectId(id, "Raffle ID");
  await cleanupExpiredRaffleReservations(id);

  const raffle = await Raffle.findById(raffleId)
    .select("_id name totalTickets ticketPrice status winner winnerTicket")
    .populate("winner", "name avatarUrl phone webAuth.email")
    .lean({ virtuals: true });

  if (!raffle) {
    throw new Error("Rifa no encontrada.");
  }

  const ownerStatuses = [RaffleNumberStatus.RESERVED, RaffleNumberStatus.PAID, RaffleNumberStatus.WINNER];
  const filter: Record<string, unknown> = {
    raffle: raffleId,
    status: options.status ?? { $in: ownerStatuses },
  };

  const skip = (options.page - 1) * options.limit;
  const [numbers, total] = await Promise.all([
    RaffleNumber.find(filter)
      .populate("user", "name avatarUrl phone webAuth.email identityDocument")
      .populate("ticket", "status paymentStatus paymentReference paidAt createdAt")
      .sort({ numericValue: 1 })
      .skip(skip)
      .limit(options.limit)
      .lean(),
    RaffleNumber.countDocuments(filter),
  ]);

  return {
    raffle: withRaffleSaleClosesAt(raffle),
    total,
    page: options.page,
    limit: options.limit,
    appliedStatusFilter: options.status ?? "ASSIGNED_ONLY",
    numbers,
  };
}

export async function getAvailableRaffleNumbersService(id: string) {
  const raffleId = toObjectId(id, "Raffle ID");
  await cleanupExpiredRaffleReservations(id);
  const raffle = await Raffle.findById(raffleId).select("_id totalTickets drawDate").lean();

  if (!raffle) {
    throw new Error("Rifa no encontrada.");
  }

  const raffleMetadata = withRaffleSaleClosesAt(raffle);

  const numbers = await RaffleNumber.findAvailableByRaffle(raffleId);

  return {
    raffleId: raffle._id,
    totalTickets: raffle.totalTickets,
    ...(raffleMetadata.saleClosesAt ? { saleClosesAt: raffleMetadata.saleClosesAt } : {}),
    ...(raffleMetadata.saleStatus ? { saleStatus: raffleMetadata.saleStatus } : {}),
    availableCount: numbers.length,
    numbers,
  };
}

export async function purchaseRaffleTicketsService(
  raffleId: string,
  actor: ActorContext,
  params: PurchaseRaffleTicketsParams,
) {
  await cleanupExpiredRaffleReservations(raffleId);
  const raffleObjectId = toObjectId(raffleId, "Raffle ID");
  const raffle = await Raffle.findById(raffleObjectId);

  if (!raffle) {
    throw new Error("Rifa no encontrada.");
  }

  if (raffle.status !== RaffleStatus.ACTIVE) {
    throw new Error("La rifa no está activa para venta de boletos.");
  }

  assertRaffleSalesOpen(raffle.drawDate);

  const raffleIsFree = raffle.ticketPrice === 0;

  if (!raffleIsFree && (!params.numbers || params.numbers.length === 0)) {
    throw new Error("Debes enviar al menos un número.");
  }

  const targetUserId = params.userId ?? actor.id;
  if (params.userId && actor.role === UserRole.CUSTOMER && params.userId !== actor.id) {
    throw new Error("No puedes comprar boletos para otro usuario.");
  }

  const userObjectId = toObjectId(targetUserId, "User ID");
  const user = await User.findById(userObjectId).select("_id deletedAt identityDocument").lean();
  if (!user || user.deletedAt) {
    throw new Error("Usuario no encontrado.");
  }

  const requestedNumbers = raffleIsFree
    ? [await getRandomAvailableRaffleNumber(raffleObjectId)]
    : params.numbers;
  const requestedStatus = getTicketStatus(params.status as TicketStatus | undefined);
  const status = raffleIsFree ? TicketStatus.PAID : requestedStatus;
  const channel = getPurchaseChannel(params.channel);
  const paymentMethod = getPaymentMethod(params.paymentMethod);

  if (raffleIsFree && params.numbers?.length) {
    throw new Error("En rifas gratuitas el número se asigna automáticamente y no debes enviarlo.");
  }

  if (raffleIsFree && params.status && requestedStatus !== TicketStatus.PAID) {
    throw new Error("Las rifas gratuitas se confirman automáticamente y no admiten estado RESERVED.");
  }

  if (raffleIsFree && (paymentMethod || params.paymentReference)) {
    throw new Error("La rifa es gratuita y no requiere datos de pago.");
  }

  if (raffleIsFree) {
    if (!user.identityDocument) {
      throw new Error("El usuario debe tener documento de identidad registrado para participar en rifas gratuitas.");
    }

    const matchingUsers = await User.find({
      identityDocument: user.identityDocument,
      deletedAt: { $exists: false },
    })
      .select("_id")
      .lean();

    const existingFreeTicket = await RaffleTicket.exists({
      raffle: raffleObjectId,
      user: { $in: matchingUsers.map((entry) => entry._id) },
      status: { $ne: TicketStatus.CANCELLED },
    });

    if (existingFreeTicket) {
      throw new Error("Ya existe una participación para este documento de identidad en esta rifa gratuita.");
    }
  }

  if (!raffleIsFree && status === TicketStatus.PAID && actor.role === UserRole.CUSTOMER) {
    throw new Error("Un cliente no puede marcar una compra como pagada desde este endpoint.");
  }

  const ticketData: Record<string, unknown> = {
    raffle: raffleObjectId,
    user: userObjectId,
    numbers: requestedNumbers,
    status,
    channel,
    isWinner: false,
  };

  if (raffleIsFree && user.identityDocument) {
    ticketData.participantIdentityDocument = user.identityDocument;
  }

  if (paymentMethod) ticketData.paymentMethod = paymentMethod;
  if (params.paymentReference) ticketData.paymentReference = params.paymentReference;

  let ticket;

  try {
    ticket = await RaffleTicket.create(ticketData);
  } catch (error) {
    if (isFreeRaffleIdentityDuplicateError(error)) {
      throw new Error("Ya existe una participación para este documento de identidad en esta rifa gratuita.");
    }

    throw error;
  }

  const createdTicket = await RaffleTicket.findById(ticket._id)
    .populate("user", "name avatarUrl")
    .populate("raffle", "name prize ticketPrice status drawDate")
    .lean();

  if (!createdTicket) {
    throw new Error("Ticket no encontrado.");
  }

  return {
    ...createdTicket,
    raffle: hasRaffleDrawDate(createdTicket.raffle) ? withRaffleSaleClosesAt(createdTicket.raffle) : createdTicket.raffle,
  };
}

export async function drawRaffleService(id: string, winningNumberInput: string) {
  const raffleId = toObjectId(id, "Raffle ID");
  await cleanupExpiredRaffleReservations(id);
  const raffle = await Raffle.findById(raffleId);

  if (!raffle) {
    throw new Error("Rifa no encontrada.");
  }

  if (raffle.status === RaffleStatus.DRAWN) {
    throw new Error("La rifa ya fue sorteada.");
  }

  if (raffle.status === RaffleStatus.CANCELLED || raffle.status === RaffleStatus.DRAFT) {
    throw new Error("La rifa no está en un estado válido para sorteo.");
  }

  const normalizedWinningNumber = normalizeWinningNumberInput(winningNumberInput, raffle.totalTickets);

  if (!normalizedWinningNumber) {
    throw new Error("Se requiere el número ganador.");
  }

  const formattedWinningNumber = normalizeRaffleNumberInput(normalizedWinningNumber, raffle.totalTickets);

  const winnerNumber = await RaffleNumber.findOne({
    raffle: raffleId,
    number: formattedWinningNumber,
  }).lean();

  if (!winnerNumber) {
    throw new Error("El número ganador indicado no existe en esta rifa.");
  }

  const hasPaidOwner = winnerNumber.status === RaffleNumberStatus.PAID && !!winnerNumber.ticket && !!winnerNumber.user;

  const ticketResetOperation = RaffleTicket.updateMany(
    { raffle: raffleId, isWinner: true },
    { $set: { isWinner: false, status: TicketStatus.PAID } },
  );

  const updates: Array<Promise<unknown>> = [
    RaffleNumber.updateOne(
      { _id: winnerNumber._id },
      { $set: { status: RaffleNumberStatus.WINNER } },
    ),
    ticketResetOperation,
  ];

  if (hasPaidOwner && winnerNumber.ticket && winnerNumber.user) {
    updates.push(
      RaffleTicket.updateOne(
        { _id: winnerNumber.ticket },
        { $set: { isWinner: true, status: TicketStatus.WINNER } },
      ),
    );
  }

  if (hasPaidOwner && winnerNumber.ticket && winnerNumber.user) {
    updates.push(
      Raffle.updateOne(
        { _id: raffleId },
        {
          $set: {
            status: RaffleStatus.DRAWN,
            hasWinner: true,
            winnerTicket: winnerNumber.number,
            winner: winnerNumber.user,
          },
        },
      ),
    );
  } else {
    updates.push(
      Raffle.updateOne(
        { _id: raffleId },
        {
          $set: {
            status: RaffleStatus.DRAWN,
            hasWinner: false,
            winnerTicket: winnerNumber.number,
          },
          $unset: {
            winner: 1,
          },
        },
      ),
    );
  }

  await Promise.all(updates);

  const raffleResult = await Raffle.findById(raffleId)
    .populate("winner", "name avatarUrl phone")
    .populate("createdBy", "name")
    .lean({ virtuals: true });

  return {
    raffle: raffleResult ? withRaffleSaleClosesAt(raffleResult) : raffleResult,
    hasWinner: hasPaidOwner,
    message: hasPaidOwner
      ? "Sorteo ejecutado correctamente con ganador asignado."
      : "Sorteo ejecutado sin ganador. El número seleccionado quedó registrado como ganador sin usuario asignado.",
  };
}