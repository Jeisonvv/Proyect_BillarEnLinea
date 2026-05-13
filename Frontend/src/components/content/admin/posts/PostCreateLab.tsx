"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { parseTagsInput } from "@/components/content/admin/shared";
import { ADMIN_INPUT as inputClass } from "@/components/ui/styles";
import {
  POST_STATUSES,
  createPostAdmin,
  uploadPostImage,
  type CreateAdminPostInput,
  type PostStatus,
} from "@/lib/api/admin-posts";

type FormState = { kind: "idle" | "success" | "error"; message?: string };
type FieldErrors = Partial<Record<string, string>>;

const initialState: FormState = { kind: "idle" };

export function PostCreateLab() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [imageUploading, setImageUploading] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const titleInput = (formRef.current?.elements.namedItem("title") as HTMLInputElement | null)?.value ?? "";
      const result = await uploadPostImage(file, `${titleInput || "noticia"}-cover`);
      setCoverImageUrl(result.data.url);
      setState({ kind: "idle" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo subir la imagen.";
      setState({ kind: "error", message });
    } finally {
      setImageUploading(false);
      if (event.target) event.target.value = "";
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const errors: FieldErrors = {};

    const title = String(formData.get("title") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const excerpt = String(formData.get("excerpt") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const status = String(formData.get("status") ?? "DRAFT") as PostStatus;
    const category = String(formData.get("category") ?? "").trim();
    const seoTitle = String(formData.get("seoTitle") ?? "").trim();
    const seoDescription = String(formData.get("seoDescription") ?? "").trim();
    const canonicalUrl = String(formData.get("canonicalUrl") ?? "").trim();
    const ogImageUrl = String(formData.get("ogImageUrl") ?? "").trim();
    const tags = parseTagsInput(String(formData.get("tags") ?? ""));
    const noIndex = formData.get("noIndex") === "on";

    if (!title) errors.title = "El título es obligatorio.";
    if (!excerpt) errors.excerpt = "El extracto es obligatorio.";
    else if (excerpt.length > 320) errors.excerpt = "El extracto no debe exceder 320 caracteres.";
    if (!content) errors.content = "El contenido es obligatorio.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setState({ kind: "error", message: "Revisa los campos marcados antes de continuar." });
      return;
    }

    const payload: CreateAdminPostInput = {
      title,
      excerpt,
      content,
      status,
      noIndex,
    };
    if (slug) payload.slug = slug;
    if (category) payload.category = category;
    if (coverImageUrl) payload.coverImageUrl = coverImageUrl;
    if (seoTitle) payload.seoTitle = seoTitle;
    if (seoDescription) payload.seoDescription = seoDescription;
    if (canonicalUrl) payload.canonicalUrl = canonicalUrl;
    if (ogImageUrl) payload.ogImageUrl = ogImageUrl;
    if (tags) payload.tags = tags;

    startTransition(async () => {
      try {
        const result = await createPostAdmin(payload);
        const newSlug = result.data?.slug;
        setState({ kind: "success", message: "Noticia creada correctamente." });
        if (newSlug) {
          router.push(`/admin/noticias/${newSlug}`);
          router.refresh();
        } else {
          router.push("/admin/noticias");
          router.refresh();
        }
      } catch (error) {
        let message = "No se pudo crear la noticia.";
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
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Laboratorio editorial</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Nueva noticia</h2>
        </div>
        <Link href="/admin/noticias" className="text-sm font-medium text-white/62 transition hover:text-white">
          ← Volver al panel
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Título *</span>
          <input
            name="title"
            type="text"
            placeholder="Ej. Resultados de la copa nacional 2026"
            className={inputClass}
            maxLength={180}
            required
          />
          {fieldErrors.title ? <span className="text-xs text-rose-300">{fieldErrors.title}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Slug (opcional)</span>
          <input
            name="slug"
            type="text"
            placeholder="se genera automáticamente"
            className={inputClass}
            maxLength={220}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Estado</span>
          <select name="status" defaultValue="DRAFT" className={inputClass}>
            {POST_STATUSES.map((value) => (
              <option key={value} value={value} className="bg-[#0b0d12]">
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Extracto * (máx 320 caracteres)</span>
          <textarea
            name="excerpt"
            rows={3}
            placeholder="Resumen breve para tarjetas y previews."
            className={`${inputClass} resize-y`}
            maxLength={320}
            required
          />
          {fieldErrors.excerpt ? <span className="text-xs text-rose-300">{fieldErrors.excerpt}</span> : null}
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Contenido *</span>
          <textarea
            name="content"
            rows={12}
            placeholder="Cuerpo completo de la noticia (markdown o texto enriquecido)."
            className={`${inputClass} resize-y`}
            required
          />
          {fieldErrors.content ? <span className="text-xs text-rose-300">{fieldErrors.content}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Categoría</span>
          <input
            name="category"
            type="text"
            placeholder="Ej. resultados, comunidad, anuncios"
            className={inputClass}
            maxLength={80}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Etiquetas</span>
          <input
            name="tags"
            type="text"
            placeholder="ranking, élite, copa (separadas por coma)"
            className={inputClass}
          />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">SEO – Título</span>
          <input
            name="seoTitle"
            type="text"
            placeholder="Título alternativo para buscadores"
            className={inputClass}
            maxLength={180}
          />
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">SEO – Descripción</span>
          <textarea
            name="seoDescription"
            rows={3}
            placeholder="Resumen breve para SEO (máximo ≈160 caracteres)"
            className={`${inputClass} resize-y`}
            maxLength={320}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">URL canónica</span>
          <input name="canonicalUrl" type="url" placeholder="https://…" className={inputClass} />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">OG Image URL</span>
          <input name="ogImageUrl" type="url" placeholder="https://…" className={inputClass} />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">No indexar</span>
          <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
            <input name="noIndex" type="checkbox" className="h-4 w-4 accent-[#f6c44f]" />
            <span className="text-sm text-white/78">Excluir esta noticia de buscadores</span>
          </span>
        </label>
      </section>

      <section className="grid gap-2">
        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Imagen de portada</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(246,196,79,0.18)] file:px-4 file:py-2 file:text-[#f6c44f] hover:file:bg-[rgba(246,196,79,0.28)]"
        />
        {imageUploading ? <span className="text-xs text-white/55">Subiendo imagen…</span> : null}
        {coverImageUrl ? (
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImageUrl} alt="Portada" className="h-40 w-full object-cover" />
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
          href="/admin/noticias"
          className="rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/78 transition hover:bg-white/10"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending || imageUploading}
          className="rounded-full bg-[linear-gradient(135deg,#f6c44f,#e0a936)] px-6 py-2.5 text-sm font-semibold text-[#1c160a] shadow-[0_8px_24px_rgba(246,196,79,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creando…" : "Crear noticia"}
        </button>
      </div>
    </form>
  );
}
