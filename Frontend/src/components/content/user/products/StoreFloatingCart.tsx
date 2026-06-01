"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getMyCart,
  STORE_CART_UPDATED_EVENT,
  type CartState,
  ApiError,
} from "@/lib/api/cart";

const EMPTY_CART: CartState = {
  items: [],
  totalItems: 0,
  estimatedTotal: 0,
};

export function StoreFloatingCart() {
  const pathname = usePathname();
  const isStoreRoute = pathname?.startsWith("/home/tienda") ?? false;
  const [cart, setCart] = useState<CartState>(EMPTY_CART);
  const [isLoading, setIsLoading] = useState(true);

  const loadCart = useCallback(async () => {
    if (!isStoreRoute) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await getMyCart();
      setCart(response.data ?? EMPTY_CART);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setCart(EMPTY_CART);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isStoreRoute]);

  useEffect(() => {
    if (!isStoreRoute) return;

    const frame = window.requestAnimationFrame(() => {
      void loadCart();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isStoreRoute, loadCart]);

  useEffect(() => {
    if (!isStoreRoute) {
      return;
    }

    const handleCartUpdated = () => {
      loadCart();
    };

    window.addEventListener(STORE_CART_UPDATED_EVENT, handleCartUpdated);
    return () => window.removeEventListener(STORE_CART_UPDATED_EVENT, handleCartUpdated);
  }, [isStoreRoute, loadCart]);

  const badgeValue = cart.totalItems > 99 ? "99+" : `${cart.totalItems}`;

  if (!isStoreRoute) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-4 z-70 sm:right-6 lg:right-10">
      <Link
        href="/home/tienda/carrito"
        className="group inline-flex items-center gap-3 rounded-full border border-[rgba(246,196,79,0.38)] bg-[linear-gradient(135deg,rgba(20,24,30,0.94),rgba(16,19,25,0.96))] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(0,0,0,0.42)] transition hover:border-[rgba(246,196,79,0.56)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.48)]"
        aria-label="Ir al carrito"
      >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(246,196,79,0.44)] bg-[rgba(246,196,79,0.2)] text-[#ffe7ac]">
            🛒
          </span>
          <span className="hidden sm:inline">Carrito</span>
          <span className="inline-flex min-w-8 items-center justify-center rounded-full border border-white/14 bg-white/10 px-2 py-1 text-xs text-white/92">
            {isLoading ? "..." : badgeValue}
          </span>
      </Link>
    </div>
  );
}
