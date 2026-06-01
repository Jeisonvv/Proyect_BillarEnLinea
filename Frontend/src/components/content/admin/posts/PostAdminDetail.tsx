"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminDeleteItemButton,
  AdminSectionScaffold,
  formatAdminDate,
  getErrorMessage,
  humanizeAdminToken,
  parseTagsInput,
} from "@/components/content/admin/shared";
import { ADMIN_INPUT as inputClass } from "@/components/ui/styles";
import { POST_STATUSES, updatePostAdmin, type PostStatus } from "@/lib/api/admin-posts";
import type { PostDetail } from "@/lib/api/public-content";

type FeedbackState = {
  kind: "idle" | "success" | "error";
  message?: string;
};

function normalizeCommaTags(value: string | null | undefined) {
  if (!value) return "";
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(", ");
}

function asOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function PostAdminDetail({ initialPost }: { initialPost: PostDetail }) {
  const router = useRouter();
  const [post, setPost] = useState<PostDetail>(initialPost);
  const [feedback, setFeedback] = useState<FeedbackState>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback({ kind: "idle" });

    const formData = new FormData(event.currentTarget);

    const title = asOptionalString(formData.get("title"));
    const slug = asOptionalString(formData.get("slug"));
    const excerpt = asOptionalString(formData.get("excerpt"));
    const content = asOptionalString(formData.get("content"));
    const status = asOptionalString(formData.get("status")) as PostStatus | undefined;
    const category = asOptionalString(formData.get("category"));
    const seoTitle = asOptionalString(formData.get("seoTitle"));
    const seoDescription = asOptionalString(formData.get("seoDescription"));
    const canonicalUrl = asOptionalString(formData.get("canonicalUrl"));
    const coverImageUrl = asOptionalString(formData.get("coverImageUrl"));
    const ogImageUrl = asOptionalString(formData.get("ogImageUrl"));
    const tags = parseTagsInput(asOptionalString(formData.get("tags")) ?? "") ?? [];
    const noIndex = formData.get("noIndex") === "on";

    startTransition(async () => {
      try {
        const result = await updatePostAdmin(post.id, {
          title,
          slug,
          excerpt,
          content,
          status,
          category,
          seoTitle,
          seoDescription,
          canonicalUrl,
          coverImageUrl,
          ogImageUrl,
          tags,
          noIndex,
        });

        const nextSlug = result.data?.slug ?? slug ?? post.slug;
        setFeedback({ kind: "success", message: "Noticia actualizada correctamente." });
        if (nextSlug && nextSlug !== post.slug) {
          router.replace(`/admin/noticias/${nextSlug}`);
        }
        setPost((current) => ({
          ...current,
          title: title ?? current.title,
          slug: nextSlug ?? current.slug,
          excerpt: excerpt ?? current.excerpt,
          content: content ?? current.content,
          status: status ?? current.status,
          category: category ?? current.category,
          seoTitle: seoTitle ?? current.seoTitle,
          seoDescription: seoDescription ?? current.seoDescription,
          canonicalUrl: canonicalUrl ?? current.canonicalUrl,
          coverImageUrl: coverImageUrl ?? current.coverImageUrl,
          ogImageUrl: ogImageUrl ?? current.ogImageUrl,
          tags,
          noIndex,
        }));
        router.refresh();
      } catch (error) {
        setFeedback({ kind: "error", message: getErrorMessage(error, "No se pudo actualizar la noticia.") });
      }
    });
  }

  return (
    <AdminSectionScaffold
      kicker="Admin noticias · edición"
      title={post.title}
      description="Edita el contenido editorial, SEO y visibilidad de la noticia desde una sola vista."
      primaryAction={{ label: "Volver a noticias", href: "/admin/noticias" }}
      secondaryAction={{ label: "Ver vista pública", href: `/home/noticias/${post.slug ?? post.id}` }}
      metrics={[
        { label: "Estado", value: humanizeAdminToken(post.status), helper: "Estado actual de la publicación." },
        { label: "Publicación", value: formatAdminDate(post.publishedAt), helper: "Fecha visible en la sección pública." },
        { label: "Categoría", value: post.category ?? "Sin categoría", helper: "Etiqueta principal del feed." },
        { label: "Lectura", value: post.readingTime ? `${post.readingTime} min` : "—", helper: "Tiempo estimado de lectura." },
      ]}
    >
      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Edición</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Editar noticia</h2>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm text-white/72">
              Título
              <input name="title" defaultValue={post.title} className={inputClass} required maxLength={180} />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white/72">
                Slug
                <input name="slug" defaultValue={post.slug ?? ""} className={inputClass} maxLength={220} />
              </label>
              <label className="grid gap-2 text-sm text-white/72">
                Estado
                <select name="status" defaultValue={post.status ?? "DRAFT"} className={inputClass}>
                  {POST_STATUSES.map((value) => (
                    <option key={value} value={value} className="bg-[#0b0d12]">
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm text-white/72">
              Extracto
              <textarea
                name="excerpt"
                rows={3}
                defaultValue={post.excerpt ?? ""}
                className={`${inputClass} resize-y`}
                maxLength={320}
              />
            </label>

            <label className="grid gap-2 text-sm text-white/72">
              Contenido (Markdown)
              <textarea
                name="content"
                rows={14}
                defaultValue={post.content ?? ""}
                className={`${inputClass} resize-y`}
                required
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white/72">
                Categoría
                <input name="category" defaultValue={post.category ?? ""} className={inputClass} maxLength={80} />
              </label>
              <label className="grid gap-2 text-sm text-white/72">
                Etiquetas
                <input
                  name="tags"
                  defaultValue={normalizeCommaTags(post.tags.join(","))}
                  className={inputClass}
                  placeholder="nacional, comunidad, resultados"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white/72">
                URL portada
                <input name="coverImageUrl" defaultValue={post.coverImageUrl ?? ""} className={inputClass} />
              </label>
              <label className="grid gap-2 text-sm text-white/72">
                URL OG
                <input name="ogImageUrl" defaultValue={post.ogImageUrl ?? ""} className={inputClass} />
              </label>
            </div>

            <label className="grid gap-2 text-sm text-white/72">
              URL canónica
              <input name="canonicalUrl" defaultValue={post.canonicalUrl ?? ""} className={inputClass} />
            </label>

            <label className="grid gap-2 text-sm text-white/72">
              SEO Title
              <input name="seoTitle" defaultValue={post.seoTitle ?? ""} className={inputClass} maxLength={180} />
            </label>

            <label className="grid gap-2 text-sm text-white/72">
              SEO Description
              <textarea
                name="seoDescription"
                rows={3}
                defaultValue={post.seoDescription ?? ""}
                className={`${inputClass} resize-y`}
                maxLength={320}
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/18 px-4 py-3 text-sm text-white/78">
              <input name="noIndex" type="checkbox" defaultChecked={post.noIndex} className="h-4 w-4 accent-[#f6c44f]" />
              No indexar esta noticia
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-sm">
                {feedback.kind !== "idle" ? (
                  <p className={feedback.kind === "error" ? "text-rose-300" : "text-emerald-300"}>{feedback.message}</p>
                ) : (
                  <p className="text-white/46">Puedes editar contenido, SEO y visibilidad desde aquí.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>

        <div className="grid gap-4">
          <section className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] p-5">
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Vista rápida</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Lectura actual</h3>

            {post.coverImageUrl ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/8 bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.coverImageUrl} alt={post.title} className="h-48 w-full object-cover" />
              </div>
            ) : null}

            <p className="mt-4 text-sm text-white/70">{post.excerpt ?? "Sin extracto."}</p>
            <div className="mt-4 rounded-2xl border border-white/8 bg-black/18 p-4 text-sm leading-7 text-white/82">
              {(post.content ?? "Sin contenido").slice(0, 500)}
              {(post.content ?? "").length > 500 ? "..." : ""}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.length > 0 ? post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[rgba(246,196,79,0.2)] bg-[rgba(246,196,79,0.12)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(255,233,174,0.96)]"
                >
                  {tag}
                </span>
              )) : <span className="text-sm text-white/56">Sin etiquetas.</span>}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-rose-400/16 bg-[linear-gradient(180deg,rgba(50,16,22,0.28),rgba(16,10,16,0.32))] p-5">
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-rose-200/82">Zona destructiva</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Eliminar noticia</h2>
            <p className="mt-3 text-sm leading-7 text-white/68">Elimina solo si quieres retirar esta publicación del sitio y del panel.</p>

            <div className="mt-5">
              <AdminDeleteItemButton
                deletePath={`/api/posts/${post.id}`}
                itemLabel="noticia"
                itemName={post.title}
                redirectTo="/admin/noticias"
                consequences={[
                  "La noticia dejará de aparecer en el panel administrativo y en la vista pública.",
                  "La URL pública de la noticia dejará de resolver su detalle.",
                  "Esta acción es definitiva y no se puede deshacer.",
                ]}
                description={
                  <>
                    Vas a eliminar <span className="font-semibold text-white">{post.title}</span>. Verifica que no haya enlaces compartidos antes de continuar.
                  </>
                }
                successMessage="Noticia eliminada correctamente."
              />
            </div>

            <div className="mt-4">
              <Link
                href={`/home/noticias/${post.slug ?? post.id}`}
                className="inline-flex w-full items-center justify-center rounded-full border border-white/12 bg-white/5 px-4 py-2 text-center text-sm font-medium text-white/82 transition hover:bg-white/10"
              >
                Ver vista pública
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AdminSectionScaffold>
  );
}
