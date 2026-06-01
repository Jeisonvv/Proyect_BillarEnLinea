import { ApiError, deleteJson, getJson, patchJson, postJson } from "@/lib/api/client";

export const STORE_CART_UPDATED_EVENT = "store-cart-updated";

export type CartItemProduct = {
  _id: string;
  name: string;
  category?: string;
  basePrice?: number;
  stock?: number;
  images?: string[];
  variants?: Array<{
    sku?: string;
    name?: string;
    imageUrl?: string | null;
    price?: number;
    stock?: number;
    color?: string | null;
    size?: string | null;
    hardness?: string | null;
    hand?: string | null;
  }>;
};

export type CartItem = {
  product: CartItemProduct | string;
  quantity: number;
  variantSku?: string;
  unitPrice: number;
  subtotal: number;
};

export type CartState = {
  items: CartItem[];
  totalItems: number;
  estimatedTotal: number;
};

type CartResponse = {
  ok: boolean;
  data: CartState;
};

type CheckoutResponse = {
  ok: boolean;
  data: {
    order: {
      id?: string;
      _id?: string;
    };
    cart: CartState;
  };
};

type OrderWompiCheckoutConfig = {
  checkoutUrl?: string;
  publicKey?: string;
  currency?: string;
  amountInCents?: number;
  reference?: string;
  redirectUrl?: string;
  expirationTime?: string;
  signature?: { integrity?: string };
  customerData?: {
    email?: string;
    fullName?: string;
    phoneNumberPrefix?: string;
    phoneNumber?: string;
  };
};

type OrderWompiCheckoutResponse = {
  ok: boolean;
  data: OrderWompiCheckoutConfig;
};

export type AddCartItemInput = {
  productId: string;
  quantity: number;
  variantSku?: string;
};

export type UpdateCartItemInput = AddCartItemInput;

export type RemoveCartItemInput = {
  productId: string;
  variantSku?: string;
};

export type CheckoutCartInput = {
  channel?: "WEB" | "ADMIN";
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  shippingAddress?: string;
};

export function notifyStoreCartUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(STORE_CART_UPDATED_EVENT));
}

export async function getMyCart() {
  return getJson<CartResponse>("/api/cart", {
    credentials: "include",
  });
}

export async function addCartItem(input: AddCartItemInput) {
  return postJson<CartResponse, AddCartItemInput>("/api/cart/items", input, {
    credentials: "include",
  });
}

export async function updateCartItem(input: UpdateCartItemInput) {
  return patchJson<CartResponse, UpdateCartItemInput>("/api/cart/items", input, {
    credentials: "include",
  });
}

export async function removeCartItem(input: RemoveCartItemInput) {
  return deleteJson<CartResponse>("/api/cart/items", {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function clearCart() {
  return deleteJson<CartResponse>("/api/cart", {
    credentials: "include",
  });
}

export async function checkoutCart(input: CheckoutCartInput = {}) {
  return postJson<CheckoutResponse, CheckoutCartInput>("/api/cart/checkout", input, {
    credentials: "include",
  });
}

export async function createOrderWompiCheckout(orderId: string, channel: "WEB" | "ADMIN" = "WEB") {
  return postJson<OrderWompiCheckoutResponse, { channel: "WEB" | "ADMIN" }>(
    `/api/orders/${encodeURIComponent(orderId)}/wompi/checkout`,
    { channel },
    { credentials: "include" },
  );
}

export { ApiError };