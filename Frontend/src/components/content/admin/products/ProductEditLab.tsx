"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  updateProductAdmin,
  type ProductCategory,
} from "@/lib/api/admin-products";
import { ADMIN_INPUT as inputClass } from "@/components/ui/styles";

type ProductEditLabProps = {
  productId: string;
  initialName: string;
  initialSlug?: string | null;
  initialBrand?: string | null;
  initialDescription?: string | null;
  initialCategory?: string | null;
  initialBasePrice?: number | null;
  initialStock?: number | null;
  initialIsActive: boolean;
  initialTags: string[];
};

type FormState = {
  kind: "idle" | "success" | "error";
  message?: string;
};

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function ProductEditLab({
  productId,
  initialName,
  initialSlug,
  initialBrand,
  initialDescription,
  initialCategory,
  initialBasePrice,
  initialStock,
  initialIsActive,
  initialTags,
}: ProductEditLabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<FormState>({ kind: "idle" });

  const normalizedInitialTags = initialTags.map((tag) => tag.trim()).filter(Boolean);
  const defaultTagsText = normalizedInitialTags.join(", ");
  const initialOffer = normalizedInitialTags.some((tag) => tag.toLowerCase() === "oferta");
  const defaultCategory = PRODUCT_CATEGORIES.includes((initialCategory ?? "") as ProductCategory)
    ? (initialCategory as ProductCategory)
    : "OTHER";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ kind: "idle" });

    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const brand = String(formData.get("brand") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim() as ProductCategory;
    const basePriceRaw = String(formData.get("basePrice") ?? "").trim();
    const stockRaw = String(formData.get("stock") ?? "").trim();
    const tagsRaw = String(formData.get("tags") ?? "");
    const isActive = formData.get("isActive") === "on";
    const isOffer = formData.get("isOffer") === "on";

    if (!name) {
      setState({ kind: "error", message: "El nombre es obligatorio." });
      return;
    }

    if (!PRODUCT_CATEGORIES.includes(category)) {
      setState({ kind: "error", message: "Selecciona una categoría válida." });
      return;
    }

    const basePrice = Number(basePriceRaw);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      setState({ kind: "error", message: "El precio base debe ser 0 o mayor." });
      return;
    }

    const stock = Number(stockRaw);
    if (!Number.isInteger(stock) || stock < 0) {
      setState({ kind: "error", message: "El stock debe ser un entero mayor o igual a 0." });
      return;
    }

    const tagsSet = new Set(parseTags(tagsRaw));
    if (isOffer) {
      tagsSet.add("oferta");
    } else {
      tagsSet.delete("oferta");
    }

    const tags = Array.from(tagsSet);

    startTransition(async () => {
      try {
        await updateProductAdmin(productId, {
          name,
          category,
          basePrice,
          stock,
          isActive,
          tags,
          slug: slug || undefined,
          brand: brand || undefined,
          description: description || undefined,
        });

        setState({ kind: "success", message: "Producto actualizado correctamente." });
        router.refresh();
      } catch (error) {
        let message = "No fue posible actualizar el producto.";

        if (error instanceof ApiError) {
          const payload = error.payload as { message?: string } | undefined;
          message = payload?.message ?? error.message;
        } else if (error instanceof Error) {
          message = error.message;
        }

        setState({ kind: "error", message });
      }
    });
  }

  return (
    <section className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
      <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Edición</p>
      <h3 className="mt-2 text-lg font-semibold text-white">Editar datos del producto</h3>

      <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Nombre</span>
            <input name="name" defaultValue={initialName} className={inputClass} required />
          </label>

          <label className="grid gap-1">
            <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Slug</span>
            <input name="slug" defaultValue={initialSlug ?? ""} className={inputClass} />
          </label>

          <label className="grid gap-1">
            <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Marca</span>
            <input name="brand" defaultValue={initialBrand ?? ""} className={inputClass} />
          </label>

          <label className="grid gap-1">
            <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Categoría</span>
            <select name="category" defaultValue={defaultCategory} className={inputClass}>
              {PRODUCT_CATEGORIES.map((value) => (
                <option key={value} value={value} className="bg-[#0b0d12]">
                  {PRODUCT_CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Precio base (COP)</span>
            <input
              name="basePrice"
              type="number"
              min={0}
              step={1000}
              defaultValue={initialBasePrice ?? 0}
              className={inputClass}
              required
            />
          </label>

          <label className="grid gap-1">
            <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Stock</span>
            <input
              name="stock"
              type="number"
              min={0}
              step={1}
              defaultValue={initialStock ?? 0}
              className={inputClass}
              required
            />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Descripción</span>
          <textarea
            name="description"
            rows={4}
            defaultValue={initialDescription ?? ""}
            className={`${inputClass} resize-y`}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Etiquetas</span>
          <input
            name="tags"
            defaultValue={defaultTagsText}
            placeholder="oferta, nuevo, importado"
            className={inputClass}
          />
        </label>

        <div className="grid gap-2 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/78">
            <input name="isActive" type="checkbox" defaultChecked={initialIsActive} className="h-4 w-4 accent-[#f6c44f]" />
            Visible en tienda
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/78">
            <input name="isOffer" type="checkbox" defaultChecked={initialOffer} className="h-4 w-4 accent-[#f6c44f]" />
            Marcar como oferta
          </label>
        </div>

        <p className="text-xs text-white/52">Oferta se maneja con la etiqueta oferta para destacarlo en el catálogo.</p>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-[linear-gradient(135deg,#f6c44f,#e0a936)] px-5 py-2.5 text-sm font-semibold text-[#1c160a] shadow-[0_8px_24px_rgba(246,196,79,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>

      {state.kind === "success" ? (
        <p className="mt-3 rounded-2xl border border-emerald-300/24 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {state.message}
        </p>
      ) : null}

      {state.kind === "error" ? (
        <p className="mt-3 rounded-2xl border border-rose-300/24 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {state.message}
        </p>
      ) : null}
    </section>
  );
}