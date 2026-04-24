import mongoose from "mongoose";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { Channel, UserRole } from "../models/enums.js";
import { cleanupExpiredOrderReservations, createOrderService } from "./order.service.js";
import { getStoreDisplayUnitPrice, resolveProductSelection } from "../utils/store-inventory.js";

interface CartActorContext {
  id: string;
  role: UserRole;
}

interface CartItemInput {
  productId?: string;
  quantity?: number;
  variantSku?: string;
}

interface CheckoutCartInput {
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
    throw new Error("Canal del carrito inválido.");
  }

  return channel as Channel;
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

async function getOrCreateCart(userId: string) {
  const userObjectId = await ensureUserExists(userId);
  let cart = await Cart.findOne({ user: userObjectId });

  if (!cart) {
    cart = new Cart({
      user: userObjectId,
      items: [],
      channel: Channel.WEB,
    });
    await cart.save();
  }

  return cart;
}

async function validateCartItemInput(item: CartItemInput, quantityMode: "positive" | "non-negative") {
  const productId = normalizeOptionalString(item.productId);
  const variantSku = normalizeOptionalString(item.variantSku);
  const quantity = Number(item.quantity);

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("El carrito requiere un productId válido.");
  }

  const validQuantity = quantityMode === "positive"
    ? Number.isInteger(quantity) && quantity >= 1
    : Number.isInteger(quantity) && quantity >= 0;

  if (!validQuantity) {
    throw new Error(
      quantityMode === "positive"
        ? "La cantidad debe ser mayor o igual a 1."
        : "La cantidad debe ser mayor o igual a 0.",
    );
  }

  const product = await Product.findById(productId).lean();
  if (!product) {
    throw new Error("Producto no encontrado.");
  }

  if (!product.isActive) {
    throw new Error(`El producto ${product.name} no está disponible para la venta.`);
  }

  resolveProductSelection(product, {
    quantity,
    ...(variantSku ? { variantSku } : {}),
  });

  return {
    productId,
    quantity,
    ...(variantSku ? { variantSku } : {}),
  };
}

function getCartItemUnitPrice(item: any) {
  const product = item.product && typeof item.product === "object" ? item.product : null;
  if (!product) return 0;

  return getStoreDisplayUnitPrice(product, item.variantSku);
}

function mapCartForResponse(cart: any) {
  const items = (cart.items ?? []).map((item: any) => {
    const unitPrice = getCartItemUnitPrice(item);
    const product = item.product && typeof item.product === "object"
      ? {
        _id: item.product._id,
        name: item.product.name,
        category: item.product.category,
        basePrice: item.product.basePrice,
        stock: item.product.stock,
        images: item.product.images ?? [],
        variants: item.product.variants ?? [],
        isActive: item.product.isActive,
      }
      : item.product;

    return {
      ...item,
      product,
      unitPrice,
      subtotal: unitPrice * item.quantity,
    };
  });

  return {
    ...cart,
    items,
    totalItems: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
    estimatedTotal: items.reduce((sum: number, item: any) => sum + item.subtotal, 0),
  };
}

async function loadCartForResponse(userId: string) {
  const userObjectId = await ensureUserExists(userId);
  const cart = await Cart.findOne({ user: userObjectId })
    .populate("items.product")
    .lean({ virtuals: true });

  if (!cart) {
    return {
      user: userObjectId,
      items: [],
      channel: Channel.WEB,
      totalItems: 0,
      estimatedTotal: 0,
    };
  }

  return mapCartForResponse(cart);
}

export async function getMyCartService(userId: string) {
  await cleanupExpiredOrderReservations();
  return loadCartForResponse(userId);
}

export async function addCartItemService(actor: CartActorContext, data: CartItemInput) {
  await cleanupExpiredOrderReservations();
  const cart = await getOrCreateCart(actor.id);
  const item = await validateCartItemInput(data, "positive");
  const index = cart.items.findIndex(
    (entry) => String(entry.product) === item.productId && (entry.variantSku ?? "") === (item.variantSku ?? ""),
  );

  if (index >= 0) {
    const existingItem = cart.items[index];
    if (!existingItem) {
      throw new Error("El producto no existe en el carrito.");
    }

    const nextQuantity = existingItem.quantity + item.quantity;
    await validateCartItemInput({ ...item, quantity: nextQuantity }, "positive");
    existingItem.quantity = nextQuantity;
  } else {
    cart.items.push({
      product: new mongoose.Types.ObjectId(item.productId),
      quantity: item.quantity,
      ...(item.variantSku ? { variantSku: item.variantSku } : {}),
      addedAt: new Date(),
    } as any);
  }

  await cart.save();
  return loadCartForResponse(actor.id);
}

export async function updateCartItemService(actor: CartActorContext, data: CartItemInput) {
  await cleanupExpiredOrderReservations();
  const cart = await getOrCreateCart(actor.id);
  const item = await validateCartItemInput(data, "non-negative");
  const index = cart.items.findIndex(
    (entry) => String(entry.product) === item.productId && (entry.variantSku ?? "") === (item.variantSku ?? ""),
  );

  if (index < 0) {
    throw new Error("El producto no existe en el carrito.");
  }

  const existingItem = cart.items[index];
  if (!existingItem) {
    throw new Error("El producto no existe en el carrito.");
  }

  if (item.quantity === 0) {
    cart.items.splice(index, 1);
  } else {
    existingItem.quantity = item.quantity;
  }

  await cart.save();
  return loadCartForResponse(actor.id);
}

export async function removeCartItemService(actor: CartActorContext, data: Pick<CartItemInput, "productId" | "variantSku">) {
  const cart = await getOrCreateCart(actor.id);
  const productId = normalizeOptionalString(data.productId);
  const variantSku = normalizeOptionalString(data.variantSku);

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("El carrito requiere un productId válido.");
  }

  const initialSize = cart.items.length;
  cart.items = cart.items.filter(
    (item) => !(String(item.product) === productId && (item.variantSku ?? "") === (variantSku ?? "")),
  ) as any;

  if (cart.items.length === initialSize) {
    throw new Error("El producto no existe en el carrito.");
  }

  await cart.save();
  return loadCartForResponse(actor.id);
}

export async function clearCartService(actor: CartActorContext) {
  const cart = await getOrCreateCart(actor.id);
  cart.items = [] as any;
  await cart.save();
  return loadCartForResponse(actor.id);
}

export async function checkoutCartService(actor: CartActorContext, data: CheckoutCartInput) {
  await cleanupExpiredOrderReservations();
  const cart = await getOrCreateCart(actor.id);

  if (!cart.items.length) {
    throw new Error("El carrito está vacío.");
  }

  const checkoutPayload: Record<string, unknown> = {
    items: cart.items.map((item) => ({
      productId: String(item.product),
      quantity: item.quantity,
      ...(item.variantSku ? { variantSku: item.variantSku } : {}),
    })),
    channel: data.channel ?? cart.channel,
  };

  const paymentMethod = normalizeOptionalString(data.paymentMethod);
  const paymentReference = normalizeOptionalString(data.paymentReference);
  const notes = normalizeOptionalString(data.notes);
  const shippingAddress = normalizeOptionalString(data.shippingAddress);

  if (paymentMethod) checkoutPayload.paymentMethod = paymentMethod;
  if (paymentReference) checkoutPayload.paymentReference = paymentReference;
  if (notes) checkoutPayload.notes = notes;
  if (shippingAddress) checkoutPayload.shippingAddress = shippingAddress;

  const order = await createOrderService(actor, checkoutPayload as any);

  cart.items = [] as any;
  cart.channel = normalizeChannel(data.channel ?? cart.channel);
  await cart.save();

  return {
    order,
    cart: await loadCartForResponse(actor.id),
  };
}