"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { addCartItem, ApiError, notifyStoreCartUpdated } from "@/lib/api/cart";
import { formatMoney } from "@/components/content/user/shared";

type ProductVariantOption = {
  name: string;
  sku: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
};

type ProductAddToCartButtonProps = {
  productId: string;
  productName: string;
  isOutOfStock: boolean;
  variants?: ProductVariantOption[];
  selectedSku?: string;
  onSelectedSkuChange?: (sku: string) => void;
  hideVariantSelector?: boolean;
};

export function ProductAddToCartButton({
  productId,
  productName,
  isOutOfStock,
  variants = [],
  selectedSku: controlledSelectedSku,
  onSelectedSkuChange,
  hideVariantSelector = false,
}: ProductAddToCartButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasVariants = variants.length > 0;
  const [internalSelectedSku, setInternalSelectedSku] = useState<string>("");

  const selectedSku = controlledSelectedSku ?? internalSelectedSku;

  const setSelectedSku = (nextSku: string) => {
    if (controlledSelectedSku === undefined) {
      setInternalSelectedSku(nextSku);
    }

    onSelectedSkuChange?.(nextSku);
  };

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.sku === selectedSku) ?? null,
    [selectedSku, variants],
  );

  const variantOutOfStock = hasVariants && selectedSku.length > 0 ? (!selectedVariant || selectedVariant.stock <= 0) : false;
  const disabled = isOutOfStock || isPending || variantOutOfStock;

  const handleAdd = () => {
    if (disabled) {
      return;
    }

    setMessage(null);

    startTransition(async () => {
      try {
        await addCartItem({
          productId,
          quantity: 1,
          ...(selectedSku ? { variantSku: selectedSku } : {}),
        });
        notifyStoreCartUpdated();
        setMessage(`${productName}${selectedVariant ? ` (${selectedVariant.name})` : ""} agregado al carrito.`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.push("/login?reason=tienda");
          return;
        }

        setMessage("No fue posible agregar el producto al carrito.");
      }
    });
  };

  return (
    <div className="grid gap-2">
      {hasVariants && !hideVariantSelector ? (
        <label className="grid gap-2">
          <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Variante</span>
          <select
            value={selectedSku}
            onChange={(event) => {
              setSelectedSku(event.target.value);
              setMessage(null);
            }}
            className="h-11 w-full rounded-2xl border border-white/12 bg-black/28 px-4 text-sm text-white outline-none transition focus:border-[rgba(246,196,79,0.46)]"
          >
            <option value="" className="bg-[#0b0d12] text-white">
              Selecciona una variante
            </option>
            {variants.map((variant) => (
              <option key={variant.sku} value={variant.sku} className="bg-[#0b0d12] text-white">
                {variant.name} · {formatMoney(variant.price)} · {variant.stock > 0 ? `${variant.stock}u` : "Sin stock"}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled}
        className="inline-flex items-center justify-center rounded-2xl border border-[rgba(246,196,79,0.3)] bg-[rgba(246,196,79,0.16)] px-5 py-3 text-sm font-semibold text-[rgba(255,240,194,0.96)] transition hover:bg-[rgba(246,196,79,0.24)] hover:text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        {isPending
          ? "Agregando..."
          : variantOutOfStock || isOutOfStock
              ? "Sin stock"
              : hasVariants && !selectedSku
                ? "Agregar al carrito"
                : "Agregar al carrito"}
      </button>
      {message ? <p className="text-xs text-white/70">{message}</p> : null}
    </div>
  );
}
