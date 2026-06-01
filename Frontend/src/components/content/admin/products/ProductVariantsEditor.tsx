"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_INPUT as inputClass } from "@/components/ui/styles";
import { updateProductAdmin, uploadProductImage, type AdminProductVariantInput } from "@/lib/api/admin-products";
import { buildUniqueVariantSku, buildVariantSku } from "@/lib/product-variant-sku";

type FormState = {
  kind: "idle" | "success" | "error";
  message?: string;
};

type DraftVariant = {
  id: string;
  name: string;
  color: string;
  size: string;
  hardness: string;
  hand: string;
  price: string;
  stock: string;
  imageUrl: string;
};

type ProductVariantsEditorProps = {
  productId: string;
  productName: string;
  productCategory?: string | null;
  productBrand?: string | null;
  initialVariants: Array<{
    name: string;
    sku: string;
    price: number;
    stock: number;
    imageUrl?: string | null;
    color?: string | null;
    size?: string | null;
    hardness?: string | null;
    hand?: string | null;
  }>;
};

function toDraftVariant(variant: ProductVariantsEditorProps["initialVariants"][number]): DraftVariant {
  return {
    id: `${variant.sku}-${Math.random().toString(36).slice(2, 8)}`,
    name: variant.name,
    color: variant.color ?? "",
    size: variant.size ?? "",
    hardness: variant.hardness ?? "",
    hand: variant.hand ?? "",
    price: String(variant.price),
    stock: String(variant.stock),
    imageUrl: variant.imageUrl ?? "",
  };
}

function createEmptyVariant(): DraftVariant {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    color: "",
    size: "",
    hardness: "",
    hand: "",
    price: "",
    stock: "0",
    imageUrl: "",
  };
}

export function ProductVariantsEditor({
  productId,
  productName,
  productCategory,
  productBrand,
  initialVariants,
}: ProductVariantsEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<FormState>({ kind: "idle" });
  const [variants, setVariants] = useState<DraftVariant[]>(() => initialVariants.map(toDraftVariant));
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null);

  const variantsCount = useMemo(() => variants.length, [variants]);

  function updateVariant(id: string, key: keyof DraftVariant, value: string) {
    setVariants((prev) => prev.map((variant) => (
      variant.id === id ? { ...variant, [key]: value } : variant
    )));
  }

  function addVariant() {
    setVariants((prev) => [...prev, createEmptyVariant()]);
    setState({ kind: "idle" });
  }

  function removeVariant(id: string) {
    setVariants((prev) => prev.filter((variant) => variant.id !== id));
    setState({ kind: "idle" });
  }

  function buildPayloadVariants(): AdminProductVariantInput[] {
    const payload: AdminProductVariantInput[] = [];
    const skuSet = new Set<string>();

    for (const variant of variants) {
      const name = variant.name.trim();
      const color = variant.color.trim();
      const size = variant.size.trim();
      const hardness = variant.hardness.trim();
      const hand = variant.hand.trim();
      const imageUrl = variant.imageUrl.trim();

      const computedName = name || [color, size, hardness, hand].filter(Boolean).join(" · ");
      if (!computedName) {
        throw new Error("Cada variante requiere nombre o atributos (color/talla/dureza/mano).");
      }

      const price = Number(variant.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new Error(`La variante ${computedName} requiere un precio válido.`);
      }

      const stock = Number(variant.stock);
      if (!Number.isInteger(stock) || stock < 0) {
        throw new Error("Cada variante requiere stock entero mayor o igual a 0.");
      }

      const sku = buildUniqueVariantSku(
        {
          category: productCategory,
          brand: productBrand,
          productName,
          hand,
          color,
          size,
          hardness,
        },
        skuSet,
      );

      payload.push({
        name: computedName,
        sku,
        price,
        stock,
        ...(imageUrl ? { imageUrl } : {}),
        ...(color ? { color } : {}),
        ...(size ? { size } : {}),
        ...(hardness ? { hardness } : {}),
        ...(hand ? { hand } : {}),
      });
    }

    return payload;
  }

  function handleSave() {
    setState({ kind: "idle" });

    startTransition(async () => {
      try {
        const payloadVariants = buildPayloadVariants();
        await updateProductAdmin(productId, { variants: payloadVariants });
        setState({ kind: "success", message: `Variantes actualizadas para ${productName}.` });
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "No fue posible actualizar las variantes.";
        setState({ kind: "error", message });
      }
    });
  }

  async function handleVariantImageChange(variantId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingVariantId(variantId);
    setState({ kind: "idle" });

    try {
      const variant = variants.find((item) => item.id === variantId);
      const imageName = `${productName || "producto"}-${variant?.name || "variante"}-${Date.now()}`;
      const result = await uploadProductImage(file, imageName);
      updateVariant(variantId, "imageUrl", result.data.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo subir la imagen de la variante.";
      setState({ kind: "error", message });
    } finally {
      setUploadingVariantId(null);
      if (event.target) {
        event.target.value = "";
      }
    }
  }

  return (
    <section className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Variantes</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Editar color, talla, dureza y mano</h3>
          <p className="mt-1 text-xs text-white/56">{variantsCount} variantes configuradas</p>
        </div>

        <button
          type="button"
          onClick={addVariant}
          className="rounded-full border border-[rgba(246,196,79,0.24)] bg-[rgba(246,196,79,0.1)] px-4 py-2 text-xs font-semibold text-[rgba(255,240,194,0.92)] transition hover:bg-[rgba(246,196,79,0.18)]"
        >
          + Agregar variante
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {variants.length > 0 ? variants.map((variant, index) => (
          <article key={variant.id} className="grid gap-3 rounded-2xl border border-white/8 bg-white/4 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/62">Variante {index + 1}</p>
              <button
                type="button"
                onClick={() => removeVariant(variant.id)}
                className="rounded-full border border-rose-300/28 bg-rose-500/14 px-3 py-1 text-[0.68rem] font-semibold text-rose-100 transition hover:bg-rose-500/22"
              >
                Quitar
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-1">
                <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">SKU automático</span>
                <input
                  type="text"
                  value={buildVariantSku({
                    category: productCategory,
                    brand: productBrand,
                    productName,
                    hand: variant.hand,
                    color: variant.color,
                    size: variant.size,
                    hardness: variant.hardness,
                  })}
                  readOnly
                  className={`${inputClass} opacity-80`}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Nombre de variante</span>
                <input
                  type="text"
                  placeholder="Ej. Guante rojo talla M"
                  value={variant.name}
                  onChange={(event) => updateVariant(variant.id, "name", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Precio</span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="Precio *"
                  value={variant.price}
                  onChange={(event) => updateVariant(variant.id, "price", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Stock</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Stock *"
                  value={variant.stock}
                  onChange={(event) => updateVariant(variant.id, "stock", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Color</span>
                <input
                  type="text"
                  placeholder="Ej. Rojo"
                  value={variant.color}
                  onChange={(event) => updateVariant(variant.id, "color", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Talla</span>
                <input
                  type="text"
                  placeholder="Ej. M"
                  value={variant.size}
                  onChange={(event) => updateVariant(variant.id, "size", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Dureza</span>
                <input
                  type="text"
                  placeholder="S, SS, H, UH"
                  value={variant.hardness}
                  onChange={(event) => updateVariant(variant.id, "hardness", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Mano</span>
                <select
                  value={variant.hand}
                  onChange={(event) => updateVariant(variant.id, "hand", event.target.value)}
                  className={inputClass}
                >
                  <option value="" className="bg-[#0b0d12]">Selecciona mano</option>
                  <option value="Izquierdo" className="bg-[#0b0d12]">Izquierdo</option>
                  <option value="Derecho" className="bg-[#0b0d12]">Derecho</option>
                </select>
              </label>
            </div>

            <div className="grid gap-2">
              <label className="grid gap-1">
                <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Imagen de variante</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    void handleVariantImageChange(variant.id, event);
                  }}
                  disabled={uploadingVariantId === variant.id}
                  className="text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(246,196,79,0.18)] file:px-4 file:py-2 file:text-[#f6c44f] hover:file:bg-[rgba(246,196,79,0.28)] disabled:opacity-60"
                />
              </label>

              {uploadingVariantId === variant.id ? (
                <p className="text-xs text-white/55">Subiendo imagen...</p>
              ) : null}

              {variant.imageUrl ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={variant.imageUrl} alt={`Imagen de ${variant.name || "variante"}`} className="h-full w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => updateVariant(variant.id, "imageUrl", "")}
                    className="rounded-full border border-rose-300/28 bg-rose-500/14 px-3 py-1 text-[0.68rem] font-semibold text-rose-100 transition hover:bg-rose-500/22"
                  >
                    Quitar imagen
                  </button>
                </div>
              ) : (
                <p className="text-xs text-white/52">Sin imagen cargada.</p>
              )}
            </div>
          </article>
        )) : (
          <p className="text-sm text-white/56">Este producto no tiene variantes aún.</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-full bg-[linear-gradient(135deg,#f6c44f,#e0a936)] px-5 py-2.5 text-sm font-semibold text-[#1c160a] shadow-[0_8px_24px_rgba(246,196,79,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar variantes"}
        </button>
      </div>

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
