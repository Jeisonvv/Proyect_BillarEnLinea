"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { parseTagsInput } from "@/components/content/admin/shared";
import { ADMIN_INPUT as inputClass } from "@/components/ui/styles";
import { absoluteUrl } from "@/lib/site";
import {
  POST_STATUSES,
  createPostAdmin,
  uploadPostImage,
  type CreateAdminPostInput,
  type PostStatus,
} from "@/lib/api/admin-posts";

type FormState = { kind: "idle" | "success" | "error"; message?: string };
type FieldErrors = Partial<Record<string, string>>;

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "noticia"
  );
}

const initialState: FormState = { kind: "idle" };

export function PostCreateLab() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [copiedUrl, setCopiedUrl] = useState<string>("");
  const [imageUploading, setImageUploading] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreviewUrl, setCoverImagePreviewUrl] = useState<string>("");
  const [ogImageUploading, setOgImageUploading] = useState(false);
  const [ogImageUrl, setOgImageUrl] = useState<string>("");
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  const [ogImagePreviewUrl, setOgImagePreviewUrl] = useState<string>("");
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    return () => {
      if (coverImagePreviewUrl) URL.revokeObjectURL(coverImagePreviewUrl);
    };
  }, [coverImagePreviewUrl]);

  useEffect(() => {
    return () => {
      if (ogImagePreviewUrl) URL.revokeObjectURL(ogImagePreviewUrl);
    };
  }, [ogImagePreviewUrl]);

  useEffect(() => {
    return () => {
      galleryPreviewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    };
  }, [galleryPreviewUrls]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (coverImagePreviewUrl) {
      URL.revokeObjectURL(coverImagePreviewUrl);
    }
    setCoverImageFile(file);
    setCoverImagePreviewUrl(URL.createObjectURL(file));
    setState({ kind: "idle" });
  }

  function handleOgImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (ogImagePreviewUrl) {
      URL.revokeObjectURL(ogImagePreviewUrl);
    }
    setOgImageFile(file);
    setOgImagePreviewUrl(URL.createObjectURL(file));
    setState({ kind: "idle" });
  }

  function handleGalleryChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    galleryPreviewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    setGalleryImageFiles(files);
    setGalleryPreviewUrls(files.map((file) => URL.createObjectURL(file)));
    setState({ kind: "idle" });
  }

  async function saveCoverImage() {
    if (!coverImageFile) return;

    setImageUploading(true);
    try {
      const titleInput = (formRef.current?.elements.namedItem("title") as HTMLInputElement | null)?.value ?? "";
      const result = await uploadPostImage(coverImageFile, `${titleInput || "noticia"}-cover`);
      setCoverImageUrl(result.data.url);
      setState({ kind: "idle" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar la imagen.";
      setState({ kind: "error", message });
    } finally {
      setImageUploading(false);
    }
  }

  async function saveOgImage() {
    if (!ogImageFile) return;

    setOgImageUploading(true);
    try {
      const titleInput = (formRef.current?.elements.namedItem("title") as HTMLInputElement | null)?.value ?? "";
      const result = await uploadPostImage(ogImageFile, `${titleInput || "noticia"}-og`);
      setOgImageUrl(result.data.url);
      setState({ kind: "idle" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar la imagen OG.";
      setState({ kind: "error", message });
    } finally {
      setOgImageUploading(false);
    }
  }

  async function saveGalleryImages() {
    if (galleryImageFiles.length === 0) return;

    setGalleryUploading(true);
    try {
      const titleInput = (formRef.current?.elements.namedItem("title") as HTMLInputElement | null)?.value ?? "";
      const uploads = await Promise.all(
        galleryImageFiles.map((file, index) => uploadPostImage(file, `${titleInput || "noticia"}-gallery-${index + 1}`)),
      );
      setGalleryImageUrls(uploads.map((result) => result.data.url));
      setState({ kind: "idle" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudieron guardar las imágenes de galería.";
      setState({ kind: "error", message });
    } finally {
      setGalleryUploading(false);
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setState({ kind: "idle" });
    } catch {
      setState({ kind: "error", message: "No se pudo copiar la URL." });
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const errors: FieldErrors = {};

    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const status = String(formData.get("status") ?? "DRAFT") as PostStatus;
    const category = String(formData.get("category") ?? "").trim();
    const seoTitle = String(formData.get("seoTitle") ?? "").trim();
    const seoDescription = String(formData.get("seoDescription") ?? "").trim();
    const tags = parseTagsInput(String(formData.get("tags") ?? ""));
    const noIndex = formData.get("noIndex") === "on";

    if (!title) errors.title = "El título es obligatorio.";
    if (!seoDescription) errors.seoDescription = "La SEO description es obligatoria.";
    else if (seoDescription.length > 320) errors.seoDescription = "La SEO description no debe exceder 320 caracteres.";
    if (!content) errors.content = "El contenido es obligatorio.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setState({ kind: "error", message: "Revisa los campos marcados antes de continuar." });
      return;
    }

    const payload: CreateAdminPostInput = {
      title,
      excerpt: seoDescription,
      content,
      status,
      noIndex,
    };
    const slug = slugify(title);
    payload.slug = slug;
    if (category) payload.category = category;
    if (coverImageUrl) payload.coverImageUrl = coverImageUrl;
    if (seoTitle) payload.seoTitle = seoTitle;
    if (seoDescription) payload.seoDescription = seoDescription;
    if (ogImageUrl) payload.ogImageUrl = ogImageUrl;
    if (galleryImageUrls.length > 0) payload.galleryImages = galleryImageUrls;
    if (tags) payload.tags = tags;

    payload.canonicalUrl = absoluteUrl(`/home/noticias/${slug}`);

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
          {fieldErrors.seoDescription ? <span className="text-xs text-rose-300">{fieldErrors.seoDescription}</span> : null}
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveCoverImage}
            disabled={!coverImageFile || imageUploading}
            className="rounded-full border border-[#f6c44f]/35 bg-[rgba(246,196,79,0.14)] px-4 py-2 text-sm font-medium text-[#f6c44f] transition hover:bg-[rgba(246,196,79,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {imageUploading ? "Guardando…" : "Guardar imagen de portada"}
          </button>
          {coverImageFile ? <span className="text-xs text-white/55">Archivo listo para subir</span> : null}
        </div>
        {coverImagePreviewUrl ? (
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImagePreviewUrl} alt="Portada previa" className="h-40 w-full object-cover" />
          </div>
        ) : null}
        {coverImageUrl ? (
          <div className="grid gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-100">
            <span>Imagen guardada. URL lista para usar en la noticia.</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                readOnly
                value={coverImageUrl}
                className="min-w-0 flex-1 rounded-xl border border-emerald-300/20 bg-black/20 px-3 py-2 text-xs text-emerald-50 outline-none"
              />
              <button
                type="button"
                onClick={() => copyUrl(coverImageUrl)}
                className="rounded-full border border-emerald-200/30 px-3 py-2 text-xs font-medium text-emerald-50 transition hover:bg-emerald-300/10"
              >
                Copiar URL
              </button>
            </div>
            {copiedUrl === coverImageUrl ? <span className="text-[0.7rem] text-emerald-200">URL copiada.</span> : null}
          </div>
        ) : null}
      </section>

      <section className="grid gap-2">
        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Imagen OG</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleOgImageChange}
          className="text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(246,196,79,0.18)] file:px-4 file:py-2 file:text-[#f6c44f] hover:file:bg-[rgba(246,196,79,0.28)]"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveOgImage}
            disabled={!ogImageFile || ogImageUploading}
            className="rounded-full border border-[#f6c44f]/35 bg-[rgba(246,196,79,0.14)] px-4 py-2 text-sm font-medium text-[#f6c44f] transition hover:bg-[rgba(246,196,79,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ogImageUploading ? "Guardando…" : "Guardar imagen OG"}
          </button>
          {ogImageFile ? <span className="text-xs text-white/55">Archivo listo para subir</span> : null}
        </div>
        {ogImagePreviewUrl ? (
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ogImagePreviewUrl} alt="OG previa" className="h-40 w-full object-cover" />
          </div>
        ) : null}
        {ogImageUrl ? (
          <div className="grid gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-100">
            <span>Imagen OG guardada. URL lista para usar en la noticia.</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                readOnly
                value={ogImageUrl}
                className="min-w-0 flex-1 rounded-xl border border-emerald-300/20 bg-black/20 px-3 py-2 text-xs text-emerald-50 outline-none"
              />
              <button
                type="button"
                onClick={() => copyUrl(ogImageUrl)}
                className="rounded-full border border-emerald-200/30 px-3 py-2 text-xs font-medium text-emerald-50 transition hover:bg-emerald-300/10"
              >
                Copiar URL
              </button>
            </div>
            {copiedUrl === ogImageUrl ? <span className="text-[0.7rem] text-emerald-200">URL copiada.</span> : null}
          </div>
        ) : null}
      </section>

      <section className="grid gap-2">
        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Galería de imágenes</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryChange}
          className="text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(246,196,79,0.18)] file:px-4 file:py-2 file:text-[#f6c44f] hover:file:bg-[rgba(246,196,79,0.28)]"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveGalleryImages}
            disabled={galleryImageFiles.length === 0 || galleryUploading}
            className="rounded-full border border-[#f6c44f]/35 bg-[rgba(246,196,79,0.14)] px-4 py-2 text-sm font-medium text-[#f6c44f] transition hover:bg-[rgba(246,196,79,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {galleryUploading ? "Guardando…" : "Guardar imágenes de galería"}
          </button>
          {galleryImageFiles.length > 0 ? (
            <span className="text-xs text-white/55">{galleryImageFiles.length} archivo(s) listo(s) para subir</span>
          ) : null}
        </div>
        {galleryPreviewUrls.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {galleryPreviewUrls.map((previewUrl, index) => (
              <div key={previewUrl} className="overflow-hidden rounded-2xl border border-white/8 bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt={`Galería ${index + 1}`} className="h-36 w-full object-cover" />
              </div>
            ))}
          </div>
        ) : null}
        {galleryImageUrls.length > 0 ? (
          <div className="grid gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-100">
            <span>{galleryImageUrls.length} imagen(es) de galería guardada(s). URL(s) lista(s) para la noticia.</span>
            <div className="grid gap-2">
              {galleryImageUrls.map((url, index) => (
                <div key={url} className="flex flex-wrap items-center gap-2">
                  <span className="min-w-20 text-[0.7rem] text-emerald-200">Imagen {index + 1}</span>
                  <input
                    readOnly
                    value={url}
                    className="min-w-0 flex-1 rounded-xl border border-emerald-300/20 bg-black/20 px-3 py-2 text-xs text-emerald-50 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyUrl(url)}
                    className="rounded-full border border-emerald-200/30 px-3 py-2 text-xs font-medium text-emerald-50 transition hover:bg-emerald-300/10"
                  >
                    Copiar URL
                  </button>
                </div>
              ))}
            </div>
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
          disabled={isPending || imageUploading || ogImageUploading || galleryUploading}
          className="rounded-full bg-[linear-gradient(135deg,#f6c44f,#e0a936)] px-6 py-2.5 text-sm font-semibold text-[#1c160a] shadow-[0_8px_24px_rgba(246,196,79,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creando…" : "Crear noticia"}
        </button>
      </div>
    </form>
  );
}
