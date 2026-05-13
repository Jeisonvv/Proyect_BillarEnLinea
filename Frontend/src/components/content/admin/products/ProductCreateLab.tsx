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
  type CreateAdminProductInput,
  type ProductCategory,
} from "@/lib/api/admin-products";

type FormState = { kind: "idle" | "success" | "error"; message?: string };
type FieldErrors = Partial<Record<string, string>>;

const initialState: FormState = { kind: "idle" };

export function ProductCreateLab() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [imageUploading, setImageUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const errors: FieldErrors = {};

    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const brand = String(formData.get("brand") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const category = String(formData.get("category") ?? "") as ProductCategory;
    const basePriceRaw = String(formData.get("basePrice") ?? "").trim();
    const stockRaw = String(formData.get("stock") ?? "").trim();
    const tags = parseTagsInput(String(formData.get("tags") ?? ""));
    const isActive = formData.get("isActive") === "on";

    if (!name) errors.name = "El nombre es obligatorio.";
    if (!category) errors.category = "Selecciona una categoría.";

    const basePrice = basePriceRaw === "" ? NaN : Number(basePriceRaw);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      errors.basePrice = "El precio base debe ser 0 o mayor.";
    }

    const stock = stockRaw === "" ? undefined : Number(stockRaw);
    if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
      errors.stock = "El stock debe ser un entero ≥ 0.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setState({ kind: "error", message: "Revisa los campos marcados antes de continuar." });
      return;
    }

    const payload: CreateAdminProductInput = {
      name,
      category,
      basePrice,
      isActive,
    };
    if (slug) payload.slug = slug;
    if (brand) payload.brand = brand;
    if (description) payload.description = description;
    if (stock !== undefined) payload.stock = stock;
    if (tags) payload.tags = tags;
    if (images.length > 0) payload.images = images;

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
            className={inputClass}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Categoría *</span>
          <select name="category" defaultValue="" className={inputClass} required>
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
          disabled={isPending || imageUploading}
          className="rounded-full bg-[linear-gradient(135deg,#f6c44f,#e0a936)] px-6 py-2.5 text-sm font-semibold text-[#1c160a] shadow-[0_8px_24px_rgba(246,196,79,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creando…" : "Crear producto"}
        </button>
      </div>
    </form>
  );
}
