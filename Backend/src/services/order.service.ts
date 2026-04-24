import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { Channel, OrderStatus, PaymentMethod, UserRole } from "../models/enums.js";
import PaymentTransaction from "../models/payment-transaction.model.js";
import { resolveProductSelection } from "../utils/store-inventory.js";
import { getOrderInventoryReservationExpiresAt } from "../utils/order-inventory-reservation.js";

export interface ListOrdersParams {
  status?: string;
  userId?: string;
  page: number;
  limit: number;
}

interface OrderActorContext {
  id: string;
  role: UserRole;
}

interface CreateOrderItemInput {
  productId?: string;
  quantity?: number;
  variantSku?: string;
}

interface CreateOrderInput {
  userId?: string;
  items?: CreateOrderItemInput[];
  channel?: string;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  shippingAddress?: string;
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizeChannel(channel?: string) {
  if (!channel) return Channel.WEB;

  if (!Object.values(Channel).includes(channel as Channel)) {
    throw new Error("Canal del pedido inválido.");
  }

  return channel as Channel;
}

function normalizePaymentMethod(paymentMethod?: string) {
  if (!paymentMethod) return undefined;

  if (!Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
    throw new Error("Método de pago inválido.");
  }

  return paymentMethod as PaymentMethod;
}

function normalizeOrderStatus(status?: string) {
  if (!status) return undefined;

  if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
    throw new Error("Estado de pedido inválido.");
  }

  return status as OrderStatus;
}

async function ensureUserExists(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Usuario no encontrado.");
  }

  const user = await User.findById(userId).select("_id deletedAt").lean();
  if (!user || user.deletedAt) {
    throw new Error("Usuario no encontrado.");
  }

  return new mongoose.Types.ObjectId(userId);
}

function resolveTargetUserId(actor: OrderActorContext, requestedUserId?: string) {
  if (!requestedUserId) return actor.id;

  if (actor.role === UserRole.CUSTOMER && requestedUserId !== actor.id) {
    throw new Error("No puedes crear pedidos para otro usuario.");
  }

  return requestedUserId;
}

async function buildOrderItems(items: CreateOrderItemInput[] | undefined) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Debes enviar al menos un ítem en el pedido.");
  }

  const normalizedItems = items.map((item, index) => {
    const productId = normalizeOptionalString(item.productId);
    const variantSku = normalizeOptionalString(item.variantSku);
    const quantity = Number(item.quantity);

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error(`El ítem ${index + 1} requiere un productId válido.`);
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error(`El ítem ${index + 1} requiere quantity mayor o igual a 1.`);
    }

    return {
      productId,
      quantity,
      ...(variantSku ? { variantSku } : {}),
    };
  });

  const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productsById = new Map(products.map((product) => [String(product._id), product]));

  const orderItems = normalizedItems.map((item, index) => {
    const product = productsById.get(item.productId);
    if (!product) {
      throw new Error(`El producto del ítem ${index + 1} no existe.`);
    }

    const resolved = resolveProductSelection(product, {
      quantity: item.quantity,
      ...(item.variantSku ? { variantSku: item.variantSku } : {}),
    });

    return {
      product: new mongoose.Types.ObjectId(item.productId),
      productName: product.name,
      ...(resolved.variantName ? { variantName: resolved.variantName } : {}),
      ...(item.variantSku ? { variantSku: item.variantSku } : {}),
      quantity: item.quantity,
      unitPrice: resolved.unitPrice,
      subtotal: resolved.subtotal,
      stockAdjustment: {
        productId: item.productId,
        quantity: item.quantity,
        ...(resolved.stockAdjustment.variantSku ? { variantSku: resolved.stockAdjustment.variantSku } : {}),
      },
    };
  });

  return orderItems;
}

type ProductStockAdjustment = {
  productId: string;
  quantity: number;
  variantSku?: string;
  variantName?: string;
};

function buildOrderStockAdjustments(order: {
  items: Array<{
    product: mongoose.Types.ObjectId | string;
    quantity: number;
    variantSku?: string;
    variantName?: string;
  }>;
}) {
  return order.items.map((item) => ({
    productId: String(item.product),
    quantity: item.quantity,
    ...(item.variantSku ? { variantSku: item.variantSku } : {}),
    ...(item.variantName ? { variantName: item.variantName } : {}),
  }));
}

async function applyVariantStockAdjustments(
  adjustments: ProductStockAdjustment[],
  direction: "decrement" | "increment",
) {
  for (const adjustment of adjustments) {
    const product = await Product.findById(adjustment.productId);
    if (!product) {
      throw new Error("Producto no encontrado durante ajuste de stock.");
    }

    if (adjustment.variantSku) {
      const variant = product.variants.find((entry) => entry.sku === adjustment.variantSku)
        ?? (adjustment.variantName
          ? product.variants.find((entry) => entry.name === adjustment.variantName)
          : undefined);
      if (!variant) {
        throw new Error(`Variante ${adjustment.variantSku} no encontrada durante ajuste de stock.`);
      }

      if (direction === "decrement") {
        if (variant.stock < adjustment.quantity) {
          throw new Error(`Stock insuficiente para ${product.name} (${variant.name}).`);
        }

        variant.stock -= adjustment.quantity;
      } else {
        variant.stock += adjustment.quantity;
      }
    } else {
      if (direction === "decrement") {
        if (product.stock < adjustment.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}.`);
        }

        product.stock -= adjustment.quantity;
      } else {
        product.stock += adjustment.quantity;
      }
    }

    await product.save();
  }
}

export async function releaseOrderInventoryReservation(order: {
  _id: mongoose.Types.ObjectId | string;
  items: Array<{
    product: mongoose.Types.ObjectId | string;
    quantity: number;
    variantSku?: string;
    variantName?: string;
  }>;
  inventoryReleasedAt?: Date | null;
}) {
  if (order.inventoryReleasedAt) {
    return false;
  }

  const claimReleasedAt = new Date();
  const claimedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      inventoryReleasedAt: { $exists: false },
    },
    {
      $set: { inventoryReleasedAt: claimReleasedAt },
      $unset: { inventoryReservedUntil: "" },
    },
    {
      new: false,
    },
  ).lean();

  if (!claimedOrder) {
    return false;
  }

  try {
    await applyVariantStockAdjustments(buildOrderStockAdjustments(order), "increment");
  } catch (error) {
    await Order.updateOne(
      {
        _id: order._id,
        inventoryReleasedAt: claimReleasedAt,
      },
      {
        $unset: { inventoryReleasedAt: "" },
        ...(claimedOrder.inventoryReservedUntil
          ? { $set: { inventoryReservedUntil: claimedOrder.inventoryReservedUntil } }
          : {}),
      },
    );

    throw error;
  }

  return true;
}

export async function cleanupExpiredOrderReservations(orderId?: string) {
  const now = new Date();
  const filter: Record<string, unknown> = {
    status: OrderStatus.PENDING,
    inventoryReservedUntil: { $lte: now },
    inventoryReleasedAt: { $exists: false },
  };

  if (orderId) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error("Pedido no encontrado.");
    }

    filter._id = new mongoose.Types.ObjectId(orderId);
  }

  const orders = await Order.find(filter)
    .select("_id items inventoryReservedUntil inventoryReleasedAt")
    .lean();

  if (!orders.length) {
    return 0;
  }

  for (const order of orders) {
    await releaseOrderInventoryReservation(order);
  }

  await PaymentTransaction.updateMany(
    {
      payableType: "ORDER",
      payableId: { $in: orders.map((order) => order._id) },
      status: "PENDING",
    },
    {
      $set: { status: "EXPIRED" },
    },
  );

  return orders.length;
}

export async function ensureOrderInventoryReservation(orderId: string, reservationExpiresAt?: Date) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Pedido no encontrado.");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Pedido no encontrado.");
  }

  if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
    throw new Error("El pedido no admite reserva de inventario.");
  }

  if (order.inventoryReleasedAt) {
    const releasedAt = order.inventoryReleasedAt;
    const claimedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        inventoryReleasedAt: releasedAt,
      },
      {
        ...(reservationExpiresAt
          ? { $set: { inventoryReservedUntil: reservationExpiresAt } }
          : {}),
        $unset: { inventoryReleasedAt: "" },
      },
      {
        new: false,
      },
    );

    if (!claimedOrder) {
      return Order.findById(orderId).orFail(() => new Error("Pedido no encontrado."));
    }

    try {
      await applyVariantStockAdjustments(buildOrderStockAdjustments(order), "decrement");
    } catch (error) {
      await Order.updateOne(
        {
          _id: order._id,
          inventoryReleasedAt: { $exists: false },
        },
        {
          $set: {
            inventoryReleasedAt: releasedAt,
            ...(claimedOrder.inventoryReservedUntil
              ? { inventoryReservedUntil: claimedOrder.inventoryReservedUntil }
              : {}),
          },
          ...(claimedOrder.inventoryReservedUntil
            ? {}
            : { $unset: { inventoryReservedUntil: "" } }),
        },
      );

      throw error;
    }

    delete order.inventoryReleasedAt;
  }

  if (reservationExpiresAt) {
    order.inventoryReservedUntil = reservationExpiresAt;
  } else {
    delete order.inventoryReservedUntil;
  }

  await order.save();
  return order;
}

function mapOrderForResponse(order: any) {
  const user = order.user && typeof order.user === "object"
    ? order.user
    : null;

  return {
    ...order,
    user: user
      ? {
        _id: user._id,
        name: user.name ?? null,
        phone: user.phone ?? null,
        avatarUrl: user.avatarUrl ?? null,
      }
      : order.user,
  };
}

export async function createOrderService(actor: OrderActorContext, data: CreateOrderInput) {
  await cleanupExpiredOrderReservations();

  const targetUserId = resolveTargetUserId(actor, data.userId);
  const userObjectId = await ensureUserExists(targetUserId);
  const orderItems = await buildOrderItems(data.items);
  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const channel = normalizeChannel(data.channel);
  const paymentMethod = normalizePaymentMethod(data.paymentMethod);
  const paymentReference = normalizeOptionalString(data.paymentReference);
  const notes = normalizeOptionalString(data.notes);
  const shippingAddress = normalizeOptionalString(data.shippingAddress);
  const stockAdjustments = orderItems
    .filter((item): item is typeof item & { stockAdjustment: { productId: string; variantSku: string; quantity: number } } => "stockAdjustment" in item)
    .map((item) => item.stockAdjustment);

  await applyVariantStockAdjustments(stockAdjustments, "decrement");

  try {
    const inventoryReservedUntil = !paymentMethod
      ? getOrderInventoryReservationExpiresAt()
      : undefined;

    const orderPayload: Record<string, unknown> = {
      user: userObjectId,
      items: orderItems.map(({ stockAdjustment, ...item }) => item),
      total,
      channel,
      ...(inventoryReservedUntil ? { inventoryReservedUntil } : {}),
    };

    if (paymentMethod) orderPayload.paymentMethod = paymentMethod;
    if (paymentReference) orderPayload.paymentReference = paymentReference;
    if (notes) orderPayload.notes = notes;
    if (shippingAddress) orderPayload.shippingAddress = shippingAddress;

    const order = new Order(orderPayload);
    await order.save();

    const createdOrder = await Order.findById(order._id)
      .populate("user", "name phone avatarUrl")
      .populate("items.product")
      .lean({ virtuals: true });

    return createdOrder ? mapOrderForResponse(createdOrder) : order;
  } catch (error) {
    await applyVariantStockAdjustments(stockAdjustments, "increment");
    throw error;
  }
}

export async function listOrdersService(params: ListOrdersParams) {
  await cleanupExpiredOrderReservations();

  const filter: Record<string, unknown> = {};
  if (params.status) {
    filter.status = normalizeOrderStatus(params.status);
  }

  if (params.userId) {
    if (!mongoose.Types.ObjectId.isValid(params.userId)) {
      throw new Error("Usuario no encontrado.");
    }

    filter.user = new mongoose.Types.ObjectId(params.userId);
  }

  const skip = (params.page - 1) * params.limit;
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name phone avatarUrl")
      .populate("items.product")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .lean({ virtuals: true }),
    Order.countDocuments(filter),
  ]);

  return { orders: orders.map((order) => mapOrderForResponse(order)), total };
}

export async function listMyOrdersService(userId: string) {
  await cleanupExpiredOrderReservations();

  const userObjectId = await ensureUserExists(userId);
  const orders = await Order.find({ user: userObjectId })
    .populate("user", "name phone avatarUrl")
    .populate("items.product")
    .sort({ createdAt: -1 })
    .lean({ virtuals: true });

  return orders.map((order) => mapOrderForResponse(order));
}

export async function getOrderByIdService(id: string, actor: OrderActorContext) {
  await cleanupExpiredOrderReservations(id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Pedido no encontrado.");
  }

  const order = await Order.findById(id)
    .populate("user", "name phone avatarUrl")
    .populate("items.product")
    .lean({ virtuals: true });

  if (!order) {
    throw new Error("Pedido no encontrado.");
  }

  if (actor.role === UserRole.CUSTOMER && String(order.user?._id ?? order.user) !== actor.id) {
    throw new Error("No tienes permiso para ver este pedido.");
  }

  return mapOrderForResponse(order);
}

export async function updateOrderStatusService(id: string, statusInput: string) {
  await cleanupExpiredOrderReservations(id);

  const status = normalizeOrderStatus(statusInput);
  if (!status) {
    throw new Error("Estado de pedido inválido.");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Pedido no encontrado.");
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new Error("Pedido no encontrado.");
  }

  if (status === OrderStatus.PAID && order.inventoryReleasedAt) {
    await ensureOrderInventoryReservation(id);
    const refreshedOrder = await Order.findById(id);
    if (!refreshedOrder) {
      throw new Error("Pedido no encontrado.");
    }

    delete refreshedOrder.inventoryReservedUntil;
    await refreshedOrder.save();
    Object.assign(order, refreshedOrder);
  }

  if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
    if (status !== order.status) {
      throw new Error("No se puede reabrir un pedido cancelado o reembolsado.");
    }
  }

  const shouldRestoreStock =
    (status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED)
    && order.status !== OrderStatus.CANCELLED
    && order.status !== OrderStatus.REFUNDED
    && !order.inventoryReleasedAt;

  if (shouldRestoreStock) {
    await releaseOrderInventoryReservation(order);
  }

  order.status = status;

  if (status === OrderStatus.PAID && !order.paidAt) {
    order.paidAt = new Date();
    delete order.inventoryReservedUntil;
    delete order.inventoryReleasedAt;
  }

  if (status === OrderStatus.DELIVERED && !order.deliveredAt) {
    order.deliveredAt = new Date();
  }

  if ((status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED) && !order.cancelledAt) {
    order.cancelledAt = new Date();
  }

  await order.save();

  const updatedOrder = await Order.findById(order._id)
    .populate("user", "name phone avatarUrl")
    .populate("items.product")
    .lean({ virtuals: true });

  return updatedOrder ? mapOrderForResponse(updatedOrder) : order;
}