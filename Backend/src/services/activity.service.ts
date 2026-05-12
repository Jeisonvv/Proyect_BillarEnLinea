import mongoose from "mongoose";
import PaymentTransaction from "../models/payment-transaction.model.js";
import Activity from "../models/activity.model.js";
import ActivityNumber, { normalizeActivityNumberInput } from "../models/activity-number.model.js";
import ActivityTicket from "../models/activity-ticket.model.js";
import User from "../models/user.model.js";
import {
  Channel,
  PaymentMethod,
  PaymentPayableType,
  PaymentTransactionStatus,
  ActivityNumberStatus,
  ActivityStatus,
  TicketStatus,
  UserRole,
} from "../models/enums.js";
import { cleanupExpiredActivityReservations } from "./payment.service.js";
import { assertActivitySalesOpen, hasActivityDrawDate, withActivitySaleClosesAt } from "../utils/activity-sale-window.js";
import { deleteCloudinaryImageByUrl } from "../utils/cloudinary.js";

export interface ListActivitiesParams {
  status?: string;
  page: number;
  limit: number;
}

interface PurchaseActivityTicketsParams {
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

function isFreeActivityIdentityDuplicateError(error: unknown) {
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

async function getRandomAvailableActivityNumber(activityId: mongoose.Types.ObjectId) {
  const availableCount = await ActivityNumber.countDocuments({
    raffle: activityId,
    status: ActivityNumberStatus.AVAILABLE,
  });

  if (availableCount === 0) {
    throw new Error("No hay números disponibles en esta rifa.");
  }

  const randomOffset = Math.floor(Math.random() * availableCount);
  const randomNumber = await ActivityNumber.findOne({
    raffle: activityId,
    status: ActivityNumberStatus.AVAILABLE,
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

function normalizeActivityPricingData(data: Record<string, unknown>) {
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

export async function createActivityService(data: Record<string, unknown>, createdBy: string) {
  const createdById = toObjectId(createdBy, "createdBy");
  const normalizedData = normalizeActivityPricingData(data);

  const activity = await Activity.create({
    ...normalizedData,
    createdBy: createdById,
    soldTickets: 0,
  });

  const createdActivity = await Activity.findById(activity._id)
    .populate("createdBy", "name")
    .lean({ virtuals: true });

  return createdActivity ? withActivitySaleClosesAt(createdActivity) : activity;
}

export interface UpdateActivityParams {
  name?: string;
  slug?: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  tags?: string[];
  prize?: string;
  prizeImageUrl?: string | null;
  ticketPrice?: number;
  drawDate?: string;
  status?: string;
  imageUrl?: string | null;
}

/**
 * Actualiza una rifa existente. No permite cambiar `totalTickets` ni `soldTickets`
 * (campos estructurales). El status `DRAWN` solo lo asigna el sorteo, no esta función.
 * El `ticketPrice` solo puede modificarse si la rifa todavía no tiene boletos vendidos.
 */
export async function updateActivityService(id: string, data: UpdateActivityParams) {
  const activityId = toObjectId(id, "Activity ID");

  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new Error("Rifa no encontrada.");
  }

  if (data.status !== undefined) {
    if (!Object.values(ActivityStatus).includes(data.status as ActivityStatus)) {
      throw new Error("Estado de rifa inválido.");
    }
    if (data.status === ActivityStatus.DRAWN) {
      throw new Error("El estado DRAWN solo puede asignarse al ejecutar el sorteo.");
    }
    if (activity.status === ActivityStatus.DRAWN) {
      throw new Error("No puedes modificar una rifa que ya fue sorteada.");
    }
    activity.status = data.status as ActivityStatus;
  } else if (activity.status === ActivityStatus.DRAWN) {
    throw new Error("No puedes modificar una rifa que ya fue sorteada.");
  }

  if (data.name !== undefined) {
    const trimmed = String(data.name).trim();
    if (!trimmed) throw new Error("El nombre no puede estar vacío.");
    activity.name = trimmed;
  }

  if (data.slug !== undefined) {
    const trimmed = String(data.slug).trim();
    // Permitir vaciar el slug para que el hook lo regenere desde el nombre.
    activity.slug = trimmed;
  }

  if (data.seoTitle !== undefined) {
    if (data.seoTitle === null || data.seoTitle === "") {
      activity.set("seoTitle", undefined);
    } else {
      activity.set("seoTitle", data.seoTitle);
    }
  }

  if (data.seoDescription !== undefined) {
    if (data.seoDescription === null || data.seoDescription === "") {
      activity.set("seoDescription", undefined);
    } else {
      activity.set("seoDescription", data.seoDescription);
    }
  }

  if (data.tags !== undefined) {
    const cleanTags = Array.isArray(data.tags)
      ? data.tags
          .map((tag) => String(tag).trim())
          .filter((tag) => tag.length > 0)
      : [];
    activity.tags = cleanTags;
  }

  if (data.prize !== undefined) {
    const trimmed = String(data.prize).trim();
    if (!trimmed) throw new Error("El premio no puede estar vacío.");
    activity.prize = trimmed;
  }

  if (data.description !== undefined) {
    if (data.description === null || data.description === "") {
      activity.set("description", undefined);
    } else {
      activity.set("description", data.description);
    }
  }

  if (data.prizeImageUrl !== undefined) {
    if (data.prizeImageUrl === null || data.prizeImageUrl === "") {
      activity.set("prizeImageUrl", undefined);
    } else {
      activity.set("prizeImageUrl", data.prizeImageUrl);
    }
  }

  if (data.imageUrl !== undefined) {
    if (data.imageUrl === null || data.imageUrl === "") {
      activity.set("imageUrl", undefined);
    } else {
      activity.set("imageUrl", data.imageUrl);
    }
  }

  if (data.ticketPrice !== undefined) {
    if (activity.soldTickets > 0) {
      throw new Error("No puedes cambiar el precio de una rifa con boletos vendidos.");
    }
    const nextPrice = getTicketPriceValue(data.ticketPrice);
    activity.ticketPrice = nextPrice;
  }

  if (data.drawDate !== undefined) {
    const parsed = new Date(data.drawDate);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("La fecha del sorteo es inválida.");
    }
    activity.drawDate = parsed;
  }

  await activity.save();

  const updatedActivity = await Activity.findById(activityId)
    .populate("winner", "name avatarUrl")
    .populate("createdBy", "name avatarUrl")
    .lean({ virtuals: true });

  return updatedActivity ? withActivitySaleClosesAt(updatedActivity) : activity.toObject();
}

export async function deleteActivityService(id: string) {
  const activityId = toObjectId(id, "Activity ID");
  await cleanupExpiredActivityReservations(id);

  const activity = await Activity.findById(activityId).select("_id name status imageUrl prizeImageUrl").lean();
  if (!activity) {
    throw new Error("Rifa no encontrada.");
  }

  if (activity.status === ActivityStatus.DRAWN) {
    throw new Error("No se puede eliminar una rifa que ya fue sorteada.");
  }

  const blockingTicket = await ActivityTicket.findOne({
    raffle: activityId,
    status: { $in: [TicketStatus.RESERVED, TicketStatus.PAID, TicketStatus.WINNER] },
  })
    .select("_id status")
    .lean();

  if (blockingTicket) {
    throw new Error("No se puede eliminar una rifa con boletos activos o confirmados.");
  }

  const activityTickets = await ActivityTicket.find({ raffle: activityId }).select("_id").lean();
  const ticketIds = activityTickets.map((ticket) => ticket._id);

  const blockingPayment = ticketIds.length > 0
    ? await PaymentTransaction.findOne({
      payableType: PaymentPayableType.ACTIVITY_TICKET,
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
    ActivityNumber.deleteMany({ raffle: activityId }),
    ActivityTicket.deleteMany({ raffle: activityId }),
    ticketIds.length > 0
      ? PaymentTransaction.deleteMany({
        payableType: PaymentPayableType.ACTIVITY_TICKET,
        payableId: { $in: ticketIds },
      })
      : Promise.resolve({ deletedCount: 0 }),
  ]);

  await Activity.deleteOne({ _id: activityId });

  const [imageDeleted, prizeImageDeleted] = await Promise.all([
    activity.imageUrl ? deleteCloudinaryImageByUrl(activity.imageUrl) : Promise.resolve(false),
    activity.prizeImageUrl ? deleteCloudinaryImageByUrl(activity.prizeImageUrl) : Promise.resolve(false),
  ]);

  return {
    activityId: activity._id,
    activityName: activity.name,
    deletedNumbers: deletedNumbers.deletedCount ?? 0,
    deletedTickets: deletedTickets.deletedCount ?? 0,
    deletedPayments: deletedPayments.deletedCount ?? 0,
    imageDeleted,
    prizeImageDeleted,
  };
}

export async function listActivitiesService(params: ListActivitiesParams) {
  const { status, page, limit } = params;
  const filter: Record<string, unknown> = {};

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;
  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .populate("winner", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    Activity.countDocuments(filter),
  ]);

  return { activities: activities.map((activity) => withActivitySaleClosesAt(activity)), total };
}

export async function getActivityByIdService(id: string) {
  // Acepta ObjectId o slug. Si el id no es un ObjectId válido, intenta resolver por slug.
  let activityId: mongoose.Types.ObjectId;
  if (mongoose.Types.ObjectId.isValid(id)) {
    activityId = new mongoose.Types.ObjectId(id);
  } else {
    const bySlug = await Activity.findOne({ slug: id.trim().toLowerCase() }).select("_id").lean();
    if (!bySlug) {
      throw new Error("Rifa no encontrada.");
    }
    activityId = bySlug._id as mongoose.Types.ObjectId;
  }
  await cleanupExpiredActivityReservations(activityId.toString());

  const activity = await Activity.findById(activityId)
    .populate("winner", "name avatarUrl")
    .populate("createdBy", "name avatarUrl")
    .lean({ virtuals: true });

  if (!activity) {
    throw new Error("Rifa no encontrada.");
  }

  const [availableCount, reservedCount, paidCount, winnerCount] = await Promise.all([
    ActivityNumber.countDocuments({ raffle: activityId, status: ActivityNumberStatus.AVAILABLE }),
    ActivityNumber.countDocuments({ raffle: activityId, status: ActivityNumberStatus.RESERVED }),
    ActivityNumber.countDocuments({ raffle: activityId, status: ActivityNumberStatus.PAID }),
    ActivityNumber.countDocuments({ raffle: activityId, status: ActivityNumberStatus.WINNER }),
  ]);

  return {
    ...withActivitySaleClosesAt(activity),
    numberSummary: {
      available: availableCount,
      reserved: reservedCount,
      paid: paidCount,
      winner: winnerCount,
    },
  };
}

export async function getActivityNumbersService(
  id: string,
  options: { status?: string; page: number; limit: number },
) {
  const activityId = toObjectId(id, "Activity ID");
  await cleanupExpiredActivityReservations(id);
  const activity = await Activity.findById(activityId).select("_id totalTickets drawDate").lean();

  if (!activity) {
    throw new Error("Rifa no encontrada.");
  }

  const filter: Record<string, unknown> = { raffle: activityId };
  if (options.status) {
    filter.status = options.status;
  }

  const skip = (options.page - 1) * options.limit;
  const [numbers, total] = await Promise.all([
    ActivityNumber.find(filter)
      .sort({ numericValue: 1 })
      .skip(skip)
      .limit(options.limit)
      .lean(),
    ActivityNumber.countDocuments(filter),
  ]);

  return {
    activityId: activity._id,
    totalTickets: activity.totalTickets,
    ...(withActivitySaleClosesAt(activity).saleClosesAt ? { saleClosesAt: withActivitySaleClosesAt(activity).saleClosesAt } : {}),
    ...(withActivitySaleClosesAt(activity).saleStatus ? { saleStatus: withActivitySaleClosesAt(activity).saleStatus } : {}),
    total,
    page: options.page,
    limit: options.limit,
    numbers,
  };
}

export async function getActivityNumberOwnersService(
  id: string,
  options: { status?: string; page: number; limit: number },
) {
  const activityId = toObjectId(id, "Activity ID");
  await cleanupExpiredActivityReservations(id);

  const activity = await Activity.findById(activityId)
    .select("_id name totalTickets ticketPrice status winner winnerTicket")
    .populate("winner", "name avatarUrl phone webAuth.email")
    .lean({ virtuals: true });

  if (!activity) {
    throw new Error("Rifa no encontrada.");
  }

  const ownerStatuses = [ActivityNumberStatus.RESERVED, ActivityNumberStatus.PAID, ActivityNumberStatus.WINNER];
  const filter: Record<string, unknown> = {
    raffle: activityId,
    status: options.status ?? { $in: ownerStatuses },
  };

  const skip = (options.page - 1) * options.limit;
  const [numbers, total] = await Promise.all([
    ActivityNumber.find(filter)
      .populate("user", "name avatarUrl phone webAuth.email identityDocument")
      .populate("ticket", "status paymentStatus paymentReference paidAt createdAt")
      .sort({ numericValue: 1 })
      .skip(skip)
      .limit(options.limit)
      .lean(),
    ActivityNumber.countDocuments(filter),
  ]);

  return {
    activity: withActivitySaleClosesAt(activity),
    total,
    page: options.page,
    limit: options.limit,
    appliedStatusFilter: options.status ?? "ASSIGNED_ONLY",
    numbers,
  };
}

export async function getAvailableActivityNumbersService(id: string) {
  const activityId = toObjectId(id, "Activity ID");
  await cleanupExpiredActivityReservations(id);
  const activity = await Activity.findById(activityId).select("_id totalTickets drawDate").lean();

  if (!activity) {
    throw new Error("Rifa no encontrada.");
  }

  const activityMetadata = withActivitySaleClosesAt(activity);

  const numbers = await ActivityNumber.findAvailableByActivity(activityId);

  return {
    activityId: activity._id,
    totalTickets: activity.totalTickets,
    ...(activityMetadata.saleClosesAt ? { saleClosesAt: activityMetadata.saleClosesAt } : {}),
    ...(activityMetadata.saleStatus ? { saleStatus: activityMetadata.saleStatus } : {}),
    availableCount: numbers.length,
    numbers,
  };
}

export async function getMyActivityNumbersService(activityId: string, userId: string) {
  const activityObjectId = toObjectId(activityId, "Activity ID");
  const userObjectId = toObjectId(userId, "User ID");
  await cleanupExpiredActivityReservations(activityId);

  const activity = await Activity.findById(activityObjectId).select("_id totalTickets").lean();
  if (!activity) {
    throw new Error("Rifa no encontrada.");
  }

  const numbers = await ActivityNumber.find({
    raffle: activityObjectId,
    user: userObjectId,
    status: { $in: [ActivityNumberStatus.RESERVED, ActivityNumberStatus.PAID, ActivityNumberStatus.WINNER] },
  })
    .select("number numericValue status reservedUntil paidAt")
    .sort({ numericValue: 1 })
    .lean();

  return {
    activityId: activity._id,
    totalTickets: activity.totalTickets,
    numbers,
  };
}

export async function releaseMyActivityReservationsService(
  activityId: string,
  userId: string,
  numbers?: string[],
) {
  const activityObjectId = toObjectId(activityId, "Activity ID");
  const userObjectId = toObjectId(userId, "User ID");

  await cleanupExpiredActivityReservations(activityId);

  const activity = await Activity.findById(activityObjectId).select("_id totalTickets").lean();
  if (!activity) {
    throw new Error("Rifa no encontrada.");
  }

  const numberFilter: Record<string, unknown> = {
    raffle: activityObjectId,
    user: userObjectId,
    status: ActivityNumberStatus.RESERVED,
  };

  if (Array.isArray(numbers) && numbers.length > 0) {
    const normalized = numbers.map((value) =>
      normalizeActivityNumberInput(value, activity.totalTickets),
    );
    numberFilter.number = { $in: normalized };
  }

  const reservedNumbers = await ActivityNumber.find(numberFilter)
    .select("_id ticket")
    .lean();

  if (reservedNumbers.length === 0) {
    return { released: 0 };
  }

  const numberIds = reservedNumbers.map((entry) => entry._id);
  const ticketIds = Array.from(
    new Set(
      reservedNumbers
        .map((entry) => entry.ticket?.toString())
        .filter((value): value is string => typeof value === "string"),
    ),
  ).map((value) => new mongoose.Types.ObjectId(value));

  await ActivityNumber.updateMany(
    { _id: { $in: numberIds } },
    {
      $set: { status: ActivityNumberStatus.AVAILABLE },
      $unset: { user: "", ticket: "", reservedAt: "", paidAt: "" },
    },
  );

  if (ticketIds.length > 0) {
    await Promise.all([
      ActivityTicket.updateMany(
        { _id: { $in: ticketIds }, status: TicketStatus.RESERVED },
        {
          $set: {
            status: TicketStatus.CANCELLED,
            paymentStatus: PaymentTransactionStatus.VOIDED,
          },
          $unset: { reservedUntil: "" },
        },
      ),
      PaymentTransaction.updateMany(
        {
          payableType: PaymentPayableType.ACTIVITY_TICKET,
          payableId: { $in: ticketIds },
          status: PaymentTransactionStatus.PENDING,
        },
        { $set: { status: PaymentTransactionStatus.VOIDED } },
      ),
    ]);
  }

  return { released: numberIds.length };
}

export async function purchaseActivityTicketsService(
  activityId: string,
  actor: ActorContext,
  params: PurchaseActivityTicketsParams,
) {
  await cleanupExpiredActivityReservations(activityId);
  const activityObjectId = toObjectId(activityId, "Activity ID");
  const activity = await Activity.findById(activityObjectId);

  if (!activity) {
    throw new Error("Rifa no encontrada.");
  }

  if (activity.status !== ActivityStatus.ACTIVE) {
    throw new Error("La rifa no está activa para venta de boletos.");
  }

  assertActivitySalesOpen(activity.drawDate);

  const activityIsFree = activity.ticketPrice === 0;

  if (!activityIsFree && (!params.numbers || params.numbers.length === 0)) {
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

  const requestedNumbers = activityIsFree
    ? [await getRandomAvailableActivityNumber(activityObjectId)]
    : params.numbers;
  const requestedStatus = getTicketStatus(params.status as TicketStatus | undefined);
  const status = activityIsFree ? TicketStatus.PAID : requestedStatus;
  const channel = getPurchaseChannel(params.channel);
  const paymentMethod = getPaymentMethod(params.paymentMethod);

  if (activityIsFree && params.numbers?.length) {
    throw new Error("En rifas gratuitas el número se asigna automáticamente y no debes enviarlo.");
  }

  if (activityIsFree && params.status && requestedStatus !== TicketStatus.PAID) {
    throw new Error("Las rifas gratuitas se confirman automáticamente y no admiten estado RESERVED.");
  }

  if (activityIsFree && (paymentMethod || params.paymentReference)) {
    throw new Error("La rifa es gratuita y no requiere datos de pago.");
  }

  if (activityIsFree) {
    if (!user.identityDocument) {
      throw new Error("El usuario debe tener documento de identidad registrado para participar en rifas gratuitas.");
    }

    const matchingUsers = await User.find({
      identityDocument: user.identityDocument,
      deletedAt: { $exists: false },
    })
      .select("_id")
      .lean();

    const existingFreeTicket = await ActivityTicket.exists({
      raffle: activityObjectId,
      user: { $in: matchingUsers.map((entry) => entry._id) },
      status: { $ne: TicketStatus.CANCELLED },
    });

    if (existingFreeTicket) {
      throw new Error("Ya existe una participación para este documento de identidad en esta rifa gratuita.");
    }
  }

  if (!activityIsFree && status === TicketStatus.PAID && actor.role === UserRole.CUSTOMER) {
    throw new Error("Un cliente no puede marcar una compra como pagada desde este endpoint.");
  }

  const ticketData: Record<string, unknown> = {
    raffle: activityObjectId,
    user: userObjectId,
    numbers: requestedNumbers,
    status,
    channel,
    isWinner: false,
  };

  if (activityIsFree && user.identityDocument) {
    ticketData.participantIdentityDocument = user.identityDocument;
  }

  if (paymentMethod) ticketData.paymentMethod = paymentMethod;
  if (params.paymentReference) ticketData.paymentReference = params.paymentReference;

  let ticket;

  try {
    ticket = await ActivityTicket.create(ticketData);
  } catch (error) {
    if (isFreeActivityIdentityDuplicateError(error)) {
      throw new Error("Ya existe una participación para este documento de identidad en esta rifa gratuita.");
    }

    throw error;
  }

  const createdTicket = await ActivityTicket.findById(ticket._id)
    .populate("user", "name avatarUrl")
    .populate("raffle", "name prize ticketPrice status drawDate")
    .lean();

  if (!createdTicket) {
    throw new Error("Ticket no encontrado.");
  }

  return {
    ...createdTicket,
    activity: hasActivityDrawDate(createdTicket.raffle) ? withActivitySaleClosesAt(createdTicket.raffle) : createdTicket.raffle,
  };
}

export async function drawActivityService(id: string, winningNumberInput: string) {
  const activityId = toObjectId(id, "Activity ID");
  await cleanupExpiredActivityReservations(id);
  const activity = await Activity.findById(activityId);

  if (!activity) {
    throw new Error("Rifa no encontrada.");
  }

  if (activity.status === ActivityStatus.DRAWN) {
    throw new Error("La rifa ya fue sorteada.");
  }

  if (activity.status === ActivityStatus.CANCELLED || activity.status === ActivityStatus.DRAFT) {
    throw new Error("La rifa no está en un estado válido para sorteo.");
  }

  const normalizedWinningNumber = normalizeWinningNumberInput(winningNumberInput, activity.totalTickets);

  if (!normalizedWinningNumber) {
    throw new Error("Se requiere el número ganador.");
  }

  const formattedWinningNumber = normalizeActivityNumberInput(normalizedWinningNumber, activity.totalTickets);

  const winnerNumber = await ActivityNumber.findOne({
    raffle: activityId,
    number: formattedWinningNumber,
  }).lean();

  if (!winnerNumber) {
    throw new Error("El número ganador indicado no existe en esta rifa.");
  }

  const hasPaidOwner = winnerNumber.status === ActivityNumberStatus.PAID && !!winnerNumber.ticket && !!winnerNumber.user;

  const ticketResetOperation = ActivityTicket.updateMany(
    { raffle: activityId, isWinner: true },
    { $set: { isWinner: false, status: TicketStatus.PAID } },
  );

  const updates: Array<Promise<unknown>> = [
    ActivityNumber.updateOne(
      { _id: winnerNumber._id },
      { $set: { status: ActivityNumberStatus.WINNER } },
    ),
    ticketResetOperation,
  ];

  if (hasPaidOwner && winnerNumber.ticket && winnerNumber.user) {
    updates.push(
      ActivityTicket.updateOne(
        { _id: winnerNumber.ticket },
        { $set: { isWinner: true, status: TicketStatus.WINNER } },
      ),
    );
  }

  if (hasPaidOwner && winnerNumber.ticket && winnerNumber.user) {
    updates.push(
      Activity.updateOne(
        { _id: activityId },
        {
          $set: {
            status: ActivityStatus.DRAWN,
            hasWinner: true,
            winnerTicket: winnerNumber.number,
            winner: winnerNumber.user,
          },
        },
      ),
    );
  } else {
    updates.push(
      Activity.updateOne(
        { _id: activityId },
        {
          $set: {
            status: ActivityStatus.DRAWN,
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

  const activityResult = await Activity.findById(activityId)
    .populate("winner", "name avatarUrl phone")
    .populate("createdBy", "name")
    .lean({ virtuals: true });

  return {
    activity: activityResult ? withActivitySaleClosesAt(activityResult) : activityResult,
    hasWinner: hasPaidOwner,
    message: hasPaidOwner
      ? "Sorteo ejecutado correctamente con ganador asignado."
      : "Sorteo ejecutado sin ganador. El número seleccionado quedó registrado como ganador sin usuario asignado.",
  };
}