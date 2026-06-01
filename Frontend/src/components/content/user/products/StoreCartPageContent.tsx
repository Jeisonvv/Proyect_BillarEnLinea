"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  addCartItem,
  ApiError,
  checkoutCart,
  createOrderWompiCheckout,
  getMyCart,
  notifyStoreCartUpdated,
  removeCartItem,
  type CartItem,
  type CartState,
  updateCartItem,
} from "@/lib/api/cart";
import { formatMoney } from "@/components/content/user/shared";

const EMPTY_CART: CartState = {
  items: [],
  totalItems: 0,
  estimatedTotal: 0,
};

type WompiCheckoutConfig = {
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

function buildWompiCheckoutUrl(config: WompiCheckoutConfig) {
  if (!config.checkoutUrl || !config.publicKey || !config.currency || !config.amountInCents || !config.reference) {
    return null;
  }

  const params = new URLSearchParams({
    "public-key": config.publicKey,
    currency: config.currency,
    "amount-in-cents": String(config.amountInCents),
    reference: config.reference,
  });

  if (config.redirectUrl) params.set("redirect-url", config.redirectUrl);
  if (config.expirationTime) params.set("expiration-time", config.expirationTime);
  if (config.signature?.integrity) params.set("signature:integrity", config.signature.integrity);
  if (config.customerData?.email) params.set("customer-data:email", config.customerData.email);
  if (config.customerData?.fullName) params.set("customer-data:full-name", config.customerData.fullName);
  if (config.customerData?.phoneNumberPrefix) {
    params.set("customer-data:phone-number-prefix", config.customerData.phoneNumberPrefix);
  }
  if (config.customerData?.phoneNumber) {
    params.set("customer-data:phone-number", config.customerData.phoneNumber);
  }

  return `${config.checkoutUrl}?${params.toString()}`;
}

function getProductData(item: CartItem) {
  if (!item.product || typeof item.product === "string") {
    return {
      id: "",
      name: "Producto",
      image: null as string | null,
      stock: null as number | null,
      category: null as string | null,
      variantName: null as string | null,
      variantAttributes: [] as string[],
    };
  }

  const selectedVariant = item.variantSku
    ? item.product.variants?.find((variant) => variant.sku === item.variantSku)
    : null;

  const resolvedImage = selectedVariant?.imageUrl ?? item.product.images?.[0] ?? null;
  const variantAttributes = [
    selectedVariant?.color ? `Color: ${selectedVariant.color}` : null,
    selectedVariant?.size ? `Talla: ${selectedVariant.size}` : null,
    selectedVariant?.hand ? `Mano: ${selectedVariant.hand}` : null,
    selectedVariant?.hardness ? `Dureza: ${selectedVariant.hardness}` : null,
  ].filter((value): value is string => Boolean(value));

  return {
    id: item.product._id,
    name: item.product.name,
    image: resolvedImage,
    stock: typeof selectedVariant?.stock === "number"
      ? selectedVariant.stock
      : (typeof item.product.stock === "number" ? item.product.stock : null),
    category: item.product.category ?? null,
    variantName: selectedVariant?.name ?? null,
    variantAttributes,
  };
}

function resolveOrderId(value: { id?: string; _id?: string } | null | undefined) {
  if (!value) return null;
  return value.id ?? value._id ?? null;
}

function getCartItemKey(item: CartItem) {
  const productId = getProductData(item).id;
  if (!productId) return null;
  return `${productId}::${item.variantSku ?? ""}`;
}

function recalculateCartState(items: CartItem[]): CartState {
  const normalized = items
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      ...item,
      subtotal: item.unitPrice * item.quantity,
    }));

  return {
    items: normalized,
    totalItems: normalized.reduce((sum, item) => sum + item.quantity, 0),
    estimatedTotal: normalized.reduce((sum, item) => sum + item.subtotal, 0),
  };
}

function getCartQuantityMap(cart: CartState) {
  const map = new Map<string, number>();

  for (const item of cart.items) {
    const key = getCartItemKey(item);
    if (!key) continue;
    map.set(key, item.quantity);
  }

  return map;
}

function hasCartChanges(left: CartState, right: CartState) {
  const leftMap = getCartQuantityMap(left);
  const rightMap = getCartQuantityMap(right);

  if (leftMap.size !== rightMap.size) {
    return true;
  }

  for (const [key, value] of leftMap.entries()) {
    if (rightMap.get(key) !== value) {
      return true;
    }
  }

  return false;
}

function getNextCartForQuantityChange(baseCart: CartState, item: CartItem, nextQuantity: number) {
  const product = getProductData(item);
  const nextItems = baseCart.items
    .map((entry) => {
      const sameProduct = getProductData(entry).id === product.id;
      const sameVariant = (entry.variantSku ?? "") === (item.variantSku ?? "");

      if (!sameProduct || !sameVariant) {
        return entry;
      }

      return {
        ...entry,
        quantity: Math.max(0, nextQuantity),
      };
    })
    .filter((entry) => entry.quantity > 0);

  return recalculateCartState(nextItems);
}

export function StoreCartPageContent() {
  const [cart, setCart] = useState<CartState>(EMPTY_CART);
  const [syncedCart, setSyncedCart] = useState<CartState>(EMPTY_CART);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [pendingNavigationHref, setPendingNavigationHref] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [isPending, startTransition] = useTransition();
  const cartRef = useRef<CartState>(EMPTY_CART);
  const syncedCartRef = useRef<CartState>(EMPTY_CART);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    syncedCartRef.current = syncedCart;
  }, [syncedCart]);

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const response = await getMyCart();
      const nextCart = response.data ?? EMPTY_CART;
      setCart(nextCart);
      setSyncedCart(nextCart);
      setHasPendingChanges(false);
      setPendingNavigationHref(null);
      setIsUnauthorized(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setIsUnauthorized(true);
        setCart(EMPTY_CART);
        setSyncedCart(EMPTY_CART);
        setHasPendingChanges(false);
        setPendingNavigationHref(null);
      } else {
        setFeedback("No fue posible cargar tu carrito.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadCart();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [loadCart]);

  const syncCartWithBackend = useCallback(async (silent = false) => {
    if (isSyncingRef.current) {
      return true;
    }

    isSyncingRef.current = true;

    try {
      const draft = cartRef.current;
      const currentSynced = syncedCartRef.current;

      if (!hasCartChanges(draft, currentSynced)) {
        setHasPendingChanges(false);
        return true;
      }

      const draftMap = new Map<string, CartItem>();
      for (const item of draft.items) {
        const key = getCartItemKey(item);
        if (!key) continue;
        draftMap.set(key, item);
      }

      const syncedMap = new Map<string, CartItem>();
      for (const item of currentSynced.items) {
        const key = getCartItemKey(item);
        if (!key) continue;
        syncedMap.set(key, item);
      }

      let latest = currentSynced;

      for (const [key, serverItem] of syncedMap.entries()) {
        if (draftMap.has(key)) continue;

        const product = getProductData(serverItem);
        if (!product.id) continue;

        const response = await removeCartItem({
          productId: product.id,
          variantSku: serverItem.variantSku,
        });
        latest = response.data ?? latest;
      }

      for (const [key, draftItem] of draftMap.entries()) {
        const serverItem = syncedMap.get(key);
        const product = getProductData(draftItem);
        if (!product.id) continue;

        if (!serverItem) {
          const response = await addCartItem({
            productId: product.id,
            quantity: draftItem.quantity,
            variantSku: draftItem.variantSku,
          });
          latest = response.data ?? latest;
          continue;
        }

        if (serverItem.quantity !== draftItem.quantity) {
          const response = await updateCartItem({
            productId: product.id,
            quantity: draftItem.quantity,
            variantSku: draftItem.variantSku,
          });
          latest = response.data ?? latest;
        }
      }

      setSyncedCart(latest);
      setCart(latest);
      setHasPendingChanges(false);
      setPendingNavigationHref(null);
      notifyStoreCartUpdated();
      if (!silent) setFeedback(null);
      return true;
    } catch (error) {
      if (!silent) {
        const message = error instanceof ApiError
          ? error.message
          : "No fue posible sincronizar los cambios del carrito.";
        setFeedback(message);
      }
      return false;
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!hasPendingChanges) return;
      if (pendingNavigationHref) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      if (link.target === "_blank") return;
      if (link.hasAttribute("download")) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const nextUrl = new URL(link.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      if (currentPath === nextPath) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingNavigationHref(nextUrl.toString());
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [hasPendingChanges, pendingNavigationHref]);

  const hasItems = cart.totalItems > 0;

  const sortedItems = useMemo(() => {
    return [...cart.items].sort((a, b) => b.subtotal - a.subtotal);
  }, [cart.items]);

  const handleUpdateQuantity = (item: CartItem, nextQuantity: number) => {
    const product = getProductData(item);
    if (!product.id || isPending) return;

    setFeedback(null);
    const nextCart = getNextCartForQuantityChange(cartRef.current, item, nextQuantity);
    cartRef.current = nextCart;
    setCart(nextCart);
    setHasPendingChanges(true);
  };

  const handleRemoveItem = (item: CartItem) => {
    if (isPending) return;

    handleUpdateQuantity(item, 0);

    startTransition(async () => {
      await syncCartWithBackend();
    });
  };

  const handleSaveChanges = () => {
    if (!hasPendingChanges || isPending) return;

    setFeedback(null);

    startTransition(async () => {
      await syncCartWithBackend();
    });
  };

  const handleCancelNavigation = () => {
    setPendingNavigationHref(null);
  };

  const handleConfirmNavigation = () => {
    if (!pendingNavigationHref) return;
    window.location.assign(pendingNavigationHref);
  };

//   const handleClearCart = () => {
//     if (!hasItems || isPending) return;

//     setFeedback(null);
//     cartRef.current = EMPTY_CART;
//     setCart(EMPTY_CART);
//     setHasPendingChanges(true);
//   };

  const handlePay = () => {
    if (!hasItems || isPending) return;

    setFeedback(null);

    startTransition(async () => {
      try {
        const synced = await syncCartWithBackend();
        if (!synced) {
          return;
        }

        const checkoutResponse = await checkoutCart({ channel: "WEB" });
        const orderId = resolveOrderId(checkoutResponse.data?.order);

        if (!orderId) {
          setFeedback("No se pudo preparar el pago: no se encontró el pedido generado.");
          return;
        }

        const wompiResponse = await createOrderWompiCheckout(orderId, "WEB");
        const wompiUrl = buildWompiCheckoutUrl(wompiResponse.data ?? {});

        if (!wompiUrl) {
          setFeedback("No se pudo construir el enlace de pago Wompi.");
          return;
        }

        notifyStoreCartUpdated();
        window.location.assign(wompiUrl);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setIsUnauthorized(true);
          return;
        }

        const message = error instanceof ApiError ? error.message : "No fue posible iniciar el pago.";
        setFeedback(message);
      }
    });
  };

  if (isUnauthorized) {
    return (
      <main className="grid gap-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Carrito</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Inicia sesión para continuar</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
            Debes iniciar sesión para ver tus productos y pagar tu carrito.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/login?reason=tienda"
              className="inline-flex items-center justify-center rounded-full border border-[rgba(246,196,79,0.3)] bg-[rgba(246,196,79,0.16)] px-5 py-2.5 text-sm font-semibold text-[rgba(255,240,194,0.95)] transition hover:bg-[rgba(246,196,79,0.24)]"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/home/tienda"
              className="inline-flex items-center justify-center rounded-full border border-white/14 px-5 py-2.5 text-sm font-medium text-white/78 transition hover:bg-white/8 hover:text-white"
            >
              Volver a tienda
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Carrito</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Tus productos seleccionados</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
              Desde aquí puedes cambiar cantidades, eliminar productos y continuar con tu pago por Wompi.
            </p>
            {hasPendingChanges ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-xs text-[rgba(255,225,145,0.88)]">
                  Tienes cambios locales sin guardar. Guarda tus cambios antes de salir de esta página.
                </p>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isPending}
                  className="inline-flex items-center justify-center rounded-full border border-[rgba(246,196,79,0.3)] bg-[rgba(246,196,79,0.16)] px-4 py-1.5 text-xs font-semibold text-[rgba(255,240,194,0.95)] transition hover:bg-[rgba(246,196,79,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            ) : null}
          </div>
          <Link
            href="/home/tienda"
            className="inline-flex items-center justify-center rounded-full border border-white/14 px-5 py-2.5 text-sm font-medium text-white/78 transition hover:bg-white/8 hover:text-white"
          >
            Seguir comprando
          </Link>
        </div>
      </section>

      {isLoading ? (
        <section className="rounded-3xl border border-white/10 bg-white/4 p-6 text-sm text-white/68">Cargando carrito...</section>
      ) : hasItems ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {sortedItems.map((item, index) => {
              const product = getProductData(item);
              return (
                <article key={`${product.id}-${item.variantSku ?? "default"}-${index}`} className="grid gap-4 rounded-3xl border border-white/10 bg-white/4 p-4 sm:grid-cols-[7rem_minmax(0,1fr)] xl:grid-cols-1">
                  <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/26">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt={product.name} className="h-28 w-full object-cover" />
                    ) : (
                      <div className="flex h-28 items-center justify-center text-xs text-white/46">Sin imagen</div>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">{product.name}</p>
                        {product.category ? (
                          <p className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-white/52">{product.category}</p>
                        ) : null}
                        {product.variantName ? (
                          <p className="mt-1 text-xs text-white/62">Variante: {product.variantName}</p>
                        ) : null}
                        {product.variantAttributes.length > 0 ? (
                          <p className="mt-1 text-xs text-white/56">{product.variantAttributes.join(" · ")}</p>
                        ) : null}
                        {product.stock !== null ? (
                          <p className="mt-1 text-xs text-white/56">Stock: {product.stock > 0 ? product.stock : "agotado"}</p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item)}
                        disabled={isPending}
                        className="rounded-full border border-rose-300/28 bg-rose-500/14 px-3 py-1 text-xs font-medium text-rose-100 transition hover:bg-rose-500/22 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Eliminar
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-full border border-white/14 bg-black/24">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                          disabled={isPending}
                          className="h-9 w-9 text-white/82 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-55"
                          aria-label={`Restar una unidad de ${product.name}`}
                        >
                          -
                        </button>
                        <span className="min-w-9 text-center text-sm text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                          disabled={isPending}
                          className="h-9 w-9 text-white/82 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-55"
                          aria-label={`Sumar una unidad de ${product.name}`}
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-white/54">{formatMoney(item.unitPrice)} c/u</p>
                        <p className="text-sm font-semibold text-white">{formatMoney(item.subtotal)}</p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="self-start rounded-3xl border border-[rgba(246,196,79,0.24)] bg-[rgba(246,196,79,0.08)] p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[rgba(255,231,161,0.82)]">Resumen</p>
            <div className="mt-3 grid gap-2 text-sm text-white/82">
              <div className="flex items-center justify-between gap-3">
                <span>Productos</span>
                <strong className="font-semibold text-white">{cart.totalItems}</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Total estimado</span>
                <strong className="font-semibold text-white">{formatMoney(cart.estimatedTotal)}</strong>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={handlePay}
                disabled={!hasItems || isPending}
                className="inline-flex items-center justify-center rounded-2xl border border-[rgba(246,196,79,0.32)] bg-[rgba(246,196,79,0.18)] px-4 py-3 text-sm font-semibold text-[rgba(255,240,194,0.95)] transition hover:bg-[rgba(246,196,79,0.26)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Sincronizando y preparando pago..." : "Pagar carrito"}
              </button>

              {/* <button
                type="button"
                onClick={handleClearCart}
                disabled={!hasItems || isPending}
                className="inline-flex items-center justify-center rounded-2xl border border-white/14 px-4 py-3 text-sm font-medium text-white/78 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Vaciar carrito
              </button> */}
            </div>
          </aside>
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-white/12 bg-white/3 p-6">
          <p className="text-sm leading-7 text-white/64">Tu carrito está vacío. Agrega productos desde la tienda para poder pagar.</p>
          <div className="mt-4">
            <Link
              href="/home/tienda"
              className="inline-flex items-center justify-center rounded-full border border-[rgba(246,196,79,0.3)] bg-[rgba(246,196,79,0.16)] px-5 py-2.5 text-sm font-semibold text-[rgba(255,240,194,0.95)] transition hover:bg-[rgba(246,196,79,0.24)]"
            >
              Ir a tienda
            </Link>
          </div>
        </section>
      )}

      {feedback ? (
        <section className="rounded-2xl border border-rose-300/24 bg-rose-500/12 p-4 text-sm text-rose-100">{feedback}</section>
      ) : null}

      {pendingNavigationHref ? (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/12 bg-[#11161f] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.45)]">
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[rgba(255,231,161,0.82)]">Cambios Sin Guardar</p>
            <h2 className="mt-2 text-xl font-semibold text-white">¿Deseas salir de esta página?</h2>
            <p className="mt-3 text-sm leading-7 text-white/75">
              Tienes cambios sin guardar en el carrito. Si sales ahora, podrías perder ajustes de cantidad.
            </p>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelNavigation}
                className="rounded-full border border-white/14 px-5 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Seguir editando
              </button>
              <button
                type="button"
                onClick={handleConfirmNavigation}
                className="rounded-full border border-[rgba(246,196,79,0.35)] bg-[rgba(246,196,79,0.2)] px-5 py-2.5 text-sm font-semibold text-[rgba(255,240,194,0.96)] transition hover:bg-[rgba(246,196,79,0.3)]"
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
