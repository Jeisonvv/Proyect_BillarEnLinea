"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { parseTagsInput } from "@/components/content/admin/shared";
import { ADMIN_INPUT as inputClass } from "@/components/ui/styles";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  createProductAdmin,
  uploadProductImage,
  type AdminProductVariantInput,
  type CreateAdminProductInput,
  type ProductCategory,
} from "@/lib/api/admin-products";
import { buildUniqueVariantSku, buildVariantSku } from "@/lib/product-variant-sku";

type FormState = { kind: "idle" | "success" | "error"; message?: string };
type FieldErrors = Partial<Record<string, string>>;
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

const initialState: FormState = { kind: "idle" };

export function ProductCreateLab() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<DraftVariant[]>([]);
  const [category, setCategory] = useState<ProductCategory | "">("");
  const [brand, setBrand] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function updateVariant(id: string, key: keyof DraftVariant, value: string) {
    setVariants((prev) => prev.map((variant) => (
      variant.id === id ? { ...variant, [key]: value } : variant
    )));
  }

  function addVariant() {
    setVariants((prev) => [...prev, createEmptyVariant()]);
  }

  function removeVariant(id: string) {
    setVariants((prev) => prev.filter((variant) => variant.id !== id));
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const nameInput = (formRef.current?.elements.namedItem("name") as HTMLInputElement | null)?.value ?? "";
      const result = await uploadProductImage(file, `${nameInput || "producto"}-${Date.now()}`);
      setImages((prev) => [...prev, result.data.url]);
      setState({ kind: "idle" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo subir la imagen.";
      setState({ kind: "error", message });
    } finally {
      setImageUploading(false);
      if (event.target) event.target.value = "";
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleVariantImageChange(variantId: string, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingVariantId(variantId);
    setState({ kind: "idle" });

    try {
      const nameInput = (formRef.current?.elements.namedItem("name") as HTMLInputElement | null)?.value ?? "";
      const variant = variants.find((item) => item.id === variantId);
      const imageName = `${nameInput || "producto"}-${variant?.name || "variante"}-${Date.now()}`;
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const errors: FieldErrors = {};

    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const brand = String(formData.get("brand") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const selectedCategory = String(formData.get("category") ?? "") as ProductCategory;
    const basePriceRaw = String(formData.get("basePrice") ?? "").trim();
    const stockRaw = String(formData.get("stock") ?? "").trim();
    const primaryVariantName = String(formData.get("primaryVariantName") ?? "").trim();
    const primaryColor = String(formData.get("primaryColor") ?? "").trim();
    const primarySize = String(formData.get("primarySize") ?? "").trim();
    const primaryHardness = String(formData.get("primaryHardness") ?? "").trim();
    const primaryHand = String(formData.get("primaryHand") ?? "").trim();
    const tags = parseTagsInput(String(formData.get("tags") ?? ""));
    const isActive = formData.get("isActive") === "on";

    if (!name) errors.name = "El nombre es obligatorio.";
    if (!selectedCategory) errors.category = "Selecciona una categoría.";

    const basePrice = basePriceRaw === "" ? NaN : Number(basePriceRaw);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      errors.basePrice = "El precio base debe ser 0 o mayor.";
    }

    const stock = stockRaw === "" ? undefined : Number(stockRaw);
    if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
      errors.stock = "El stock debe ser un entero ≥ 0.";
    }

    const normalizedVariants: AdminProductVariantInput[] = [];
    const usedSkus = new Set<string>();

    const primaryAttributes = [primaryColor, primarySize, primaryHardness, primaryHand].filter(Boolean);
    const hasPrimaryCharacteristics = primaryVariantName.length > 0 || primaryAttributes.length > 0;

    if (hasPrimaryCharacteristics) {
      if (stock === undefined) {
        errors.stock = "Define el stock para usar características en el producto principal.";
      } else {
        const computedPrimaryName = primaryVariantName
          || primaryAttributes.join(" · ")
          || "Principal";

        const primarySku = buildUniqueVariantSku(
          {
            category: selectedCategory,
            brand,
            productName: name || computedPrimaryName,
            hand: primaryHand,
            color: primaryColor,
            size: primarySize,
            hardness: primaryHardness,
          },
          usedSkus,
        );

        normalizedVariants.push({
          name: computedPrimaryName,
          sku: primarySku,
          price: basePrice,
          stock,
          ...(images[0] ? { imageUrl: images[0] } : {}),
          ...(primaryColor ? { color: primaryColor } : {}),
          ...(primarySize ? { size: primarySize } : {}),
          ...(primaryHardness ? { hardness: primaryHardness } : {}),
          ...(primaryHand ? { hand: primaryHand } : {}),
        });
      }
    }

    if (variants.length > 0) {
      for (const variant of variants) {
        const variantName = variant.name.trim();
        const color = variant.color.trim();
        const size = variant.size.trim();
        const hardness = variant.hardness.trim();
        const hand = variant.hand.trim();
        const imageUrl = variant.imageUrl.trim();

        const computedName = variantName || [color, size, hardness, hand].filter(Boolean).join(" · ");
        if (!computedName) {
          errors.variants = "Cada variante requiere nombre o atributos (color/talla/dureza/mano).";
          break;
        }

        const variantLabel = computedName;

        const price = Number(variant.price);
        if (!Number.isFinite(price) || price < 0) {
          errors.variants = `La variante ${variantLabel} requiere un precio válido.`;
          break;
        }

        const variantStock = Number(variant.stock);
        if (!Number.isInteger(variantStock) || variantStock < 0) {
          errors.variants = "Cada variante requiere stock entero mayor o igual a 0.";
          break;
        }

        const sku = buildUniqueVariantSku(
          {
            category: selectedCategory,
            brand,
            productName: variantName || computedName,
            hand,
            color,
            size,
            hardness,
          },
          usedSkus,
        );

        normalizedVariants.push({
          name: computedName,
          sku,
          price,
          stock: variantStock,
          ...(imageUrl ? { imageUrl } : {}),
          ...(color ? { color } : {}),
          ...(size ? { size } : {}),
          ...(hardness ? { hardness } : {}),
          ...(hand ? { hand } : {}),
        });
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setState({ kind: "error", message: "Revisa los campos marcados antes de continuar." });
      return;
    }

    const payload: CreateAdminProductInput = {
      name,
      category: selectedCategory,
      basePrice,
      isActive,
    };
    if (slug) payload.slug = slug;
    if (brand) payload.brand = brand;
    if (description) payload.description = description;
    if (stock !== undefined) payload.stock = stock;
    if (tags) payload.tags = tags;
    if (images.length > 0) payload.images = images;
    if (normalizedVariants.length > 0) payload.variants = normalizedVariants;

    startTransition(async () => {
      try {
        const result = await createProductAdmin(payload);
        const newSlug = result.data?.slug;
        const id = result.data?._id;
        const target = newSlug ?? id;
        setState({ kind: "success", message: "Producto creado correctamente." });
        if (target) {
          router.push(`/admin/tienda/${target}`);
          router.refresh();
        } else {
          router.push("/admin/tienda");
          router.refresh();
        }
      } catch (error) {
        let message = "No se pudo crear el producto.";
        if (error instanceof ApiError) {
          const data = error.payload as { message?: string } | undefined;
          message = data?.message ?? error.message;
        } else if (error instanceof Error) {
          message = error.message;
        }
        setState({ kind: "error", message });
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Laboratorio de catálogo</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Nuevo producto</h2>
        </div>
        <Link href="/admin/tienda" className="text-sm font-medium text-white/62 transition hover:text-white">
          ← Volver al panel
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Nombre *</span>
          <input
            name="name"
            type="text"
            placeholder="Ej. Taco Predator REVO 12.4mm"
            className={inputClass}
            required
          />
          {fieldErrors.name ? <span className="text-xs text-rose-300">{fieldErrors.name}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Slug (opcional)</span>
          <input
            name="slug"
            type="text"
            placeholder="se genera automáticamente"
            className={inputClass}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Marca</span>
          <input
            name="brand"
            type="text"
            placeholder="Ej. Predator, Aramith"
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Categoría *</span>
          <select
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value as ProductCategory | "")}
            className={inputClass}
            required
          >
            <option value="" disabled className="bg-[#0b0d12]">
              Selecciona una categoría
            </option>
            {PRODUCT_CATEGORIES.map((value) => (
              <option key={value} value={value} className="bg-[#0b0d12]">
                {PRODUCT_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
          {fieldErrors.category ? <span className="text-xs text-rose-300">{fieldErrors.category}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Precio base (COP) *</span>
          <input
            name="basePrice"
            type="number"
            min={0}
            step={1000}
            defaultValue={0}
            className={inputClass}
            required
          />
          {fieldErrors.basePrice ? <span className="text-xs text-rose-300">{fieldErrors.basePrice}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Stock</span>
          <input
            name="stock"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            className={inputClass}
          />
          {fieldErrors.stock ? <span className="text-xs text-rose-300">{fieldErrors.stock}</span> : null}
        </label>

        <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:col-span-2">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Características del producto principal</p>
            <p className="text-xs text-white/52">
              Opcional. Si las completas, el principal también se guardará como variante base para selección por atributos.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <label className="grid gap-1">
              <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Nombre de variante base</span>
              <input
                name="primaryVariantName"
                type="text"
                placeholder="Ej. Principal rojo derecho"
                className={inputClass}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Color</span>
              <input
                name="primaryColor"
                type="text"
                placeholder="Ej. Rojo"
                className={inputClass}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Talla</span>
              <input
                name="primarySize"
                type="text"
                placeholder="Ej. M"
                className={inputClass}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Dureza</span>
              <input
                name="primaryHardness"
                type="text"
                placeholder="S, SS, H, UH"
                className={inputClass}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">Mano</span>
              <select name="primaryHand" className={inputClass}>
                <option value="" className="bg-[#0b0d12]">Selecciona mano</option>
                <option value="Izquierdo" className="bg-[#0b0d12]">Izquierdo</option>
                <option value="Derecho" className="bg-[#0b0d12]">Derecho</option>
              </select>
            </label>
          </div>
        </div>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Descripción</span>
          <textarea
            name="description"
            rows={4}
            placeholder="Detalles del producto, materiales, especificaciones…"
            className={`${inputClass} resize-y`}
          />
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Etiquetas</span>
          <input
            name="tags"
            type="text"
            placeholder="oferta, nuevo, importado (separadas por coma)"
            className={inputClass}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Visible</span>
          <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
            <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 accent-[#f6c44f]" />
            <span className="text-sm text-white/78">Mostrar producto en la tienda</span>
          </span>
        </label>
      </section>

      <section className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Variantes</p>
            <p className="text-xs text-white/58">Configura color, talla, dureza, mano y su SKU/stock/precio.</p>
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="rounded-full border border-[rgba(246,196,79,0.24)] bg-[rgba(246,196,79,0.1)] px-4 py-2 text-xs font-semibold text-[rgba(255,240,194,0.92)] transition hover:bg-[rgba(246,196,79,0.18)]"
          >
            + Agregar variante
          </button>
        </div>

        {variants.length > 0 ? (
          <div className="grid gap-3">
            {variants.map((variant, index) => (
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
                        category,
                        brand,
                        productName: variant.name,
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
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/52">Sin variantes configuradas. Si el producto tiene talla/color/dureza/mano, agrega al menos una variante.</p>
        )}

        {fieldErrors.variants ? <span className="text-xs text-rose-300">{fieldErrors.variants}</span> : null}
      </section>

      <section className="grid gap-2">
        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Imágenes (la primera será la principal)</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(246,196,79,0.18)] file:px-4 file:py-2 file:text-[#f6c44f] hover:file:bg-[rgba(246,196,79,0.28)]"
        />
        {imageUploading ? <span className="text-xs text-white/55">Subiendo imagen…</span> : null}
        {images.length > 0 ? (
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((url, idx) => (
              <div key={url + idx} className="relative overflow-hidden rounded-2xl border border-white/8 bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Imagen ${idx + 1}`} className="h-32 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute right-2 top-2 rounded-full bg-rose-600/80 px-2 py-1 text-[0.62rem] font-semibold text-white transition hover:bg-rose-500"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {state.kind === "error" ? (
        <p className="rounded-2xl border border-rose-300/24 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {state.message}
        </p>
      ) : null}
      {state.kind === "success" ? (
        <p className="rounded-2xl border border-emerald-300/24 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          href="/admin/tienda"
          className="rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/78 transition hover:bg-white/10"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending || imageUploading || uploadingVariantId !== null}
          className="rounded-full bg-[linear-gradient(135deg,#f6c44f,#e0a936)] px-6 py-2.5 text-sm font-semibold text-[#1c160a] shadow-[0_8px_24px_rgba(246,196,79,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creando…" : "Crear producto"}
        </button>
      </div>
    </form>
  );
}
