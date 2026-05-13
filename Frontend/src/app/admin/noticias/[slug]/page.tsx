import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminDeleteItemButton,
  AdminSectionScaffold,
  formatAdminDate,
  humanizeAdminToken,
} from "@/components/content/admin/shared";
import { getPostDetailBySlug } from "@/lib/api/public-content";

export const dynamic = "force-dynamic";

export default async function AdminPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostDetailBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <AdminSectionScaffold
      kicker="Admin noticias · detalle"
      title={post.title}
      description={post.excerpt ?? "Sin extracto disponible."}
      secondaryAction={{ label: "Volver a noticias", href: "/admin/noticias" }}
      metrics={[
        { label: "Estado", value: humanizeAdminToken(post.status), helper: "Estado actual de la pieza editorial." },
        { label: "Publicación", value: formatAdminDate(post.publishedAt), helper: "Fecha visible para la sección pública." },
        { label: "Categoría", value: post.category ?? "Sin categoría", helper: "Etiqueta principal usada en el feed." },
        { label: "Lectura", value: post.readingTime ? `${post.readingTime} min` : "—", helper: "Tiempo estimado de lectura." },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Vista de lectura</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{post.title}</h2>
          {post.coverImageUrl ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/8 bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverImageUrl} alt={post.title} className="h-56 w-full object-cover" />
            </div>
          ) : null}
          <p className="mt-4 text-sm leading-7 text-white/74">{post.excerpt ?? "Sin extracto."}</p>
          {post.content ? (
            <div className="mt-4 whitespace-pre-line rounded-2xl border border-white/8 bg-black/18 p-4 text-sm leading-7 text-white/82">
              {post.content}
            </div>
          ) : null}
        </article>

        <aside className="grid gap-4">
          <section className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Acciones</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Gestiona esta noticia</h3>
            <div className="mt-4 grid gap-3">
              <Link
                href={`/home/noticias/${post.slug ?? post.id}`}
                className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-center text-sm font-medium text-white/82 transition hover:bg-white/10"
              >
                Ver vista pública
              </Link>
              <AdminDeleteItemButton
                deletePath={`/api/posts/${post.id}`}
                itemLabel="noticia"
                itemName={post.title}
                consequences={[
                  "La noticia desaparecerá de la sección pública.",
                  "El slug quedará disponible para nuevas publicaciones.",
                ]}
                description={
                  <>
                    Vas a eliminar <span className="font-semibold text-white">{post.title}</span>. Esta acción es
                    permanente y no se puede deshacer.
                  </>
                }
                successMessage="Noticia eliminada correctamente."
                redirectTo="/admin/noticias"
              />
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">SEO</p>
            <dl className="mt-3 grid gap-2 text-sm text-white/70">
              <div>
                <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Título SEO</dt>
                <dd className="text-white/86">{post.seoTitle ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Descripción SEO</dt>
                <dd className="text-white/86">{post.seoDescription ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Slug</dt>
                <dd className="text-white/86">{post.slug ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">No indexar</dt>
                <dd className="text-white/86">{post.noIndex ? "Sí" : "No"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Etiquetas</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.length > 0 ? post.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-[rgba(246,196,79,0.2)] bg-[rgba(246,196,79,0.12)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(255,233,174,0.96)]">{tag}</span>
              )) : (
                <span className="text-sm text-white/56">Sin etiquetas.</span>
              )}
            </div>
          </section>
        </aside>
      </div>
    </AdminSectionScaffold>
  );
}
