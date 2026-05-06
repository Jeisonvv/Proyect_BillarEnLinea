import Link from "next/link";
import { AdminSectionScaffold, formatAdminDate } from "@/components/content/admin/shared/AdminSectionScaffold";
import { getLandingSnapshot } from "@/lib/api/public-content";

export default async function AdminNewsPage() {
  const snapshot = await getLandingSnapshot();
  const posts = snapshot.posts.items;
  const taggedCount = posts.filter((item) => item.tags.length > 0).length;

  return (
    <AdminSectionScaffold
      kicker="Admin noticias"
      title="Ordena lo que sale en contenido"
      description="Revisa las noticias o posts visibles, detecta piezas sin etiquetas y utiliza esta sección como entrada rápida para controlar el pulso editorial del sitio."
      primaryAction={{ label: "Dashboard", href: "/admin" }}
      secondaryAction={{ label: "Home user", href: "/home" }}
      metrics={[
        { label: "Total", value: String(snapshot.totals.posts), helper: snapshot.posts.error ?? "Posts visibles en el snapshot actual." },
        { label: "Con etiquetas", value: String(taggedCount), helper: "Publicaciones con taxonomía cargada." },
        { label: "Muestra", value: String(posts.length), helper: "Noticias revisadas en esta vista administrativa." },
      ]}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Noticias recientes</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Vigilancia editorial</h2>
        </div>
        <Link className="text-sm font-medium text-white/62 transition hover:text-white" href="/home">
          Ir al home user
        </Link>
      </div>

      <div className="grid gap-4">
        {posts.length > 0 ? posts.map((post) => (
          <article key={post.id} className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold text-white">{post.title}</p>
                  <p className="mt-1 text-sm text-white/56">Publicación: {formatAdminDate(post.publishedAt)}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/78">{post.slug ?? "Sin slug"}</span>
              </div>
              <p className="text-sm leading-7 text-white/64">{post.excerpt ?? "Sin extracto disponible."}</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.length > 0 ? post.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[rgba(246,196,79,0.2)] bg-[rgba(246,196,79,0.12)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(255,233,174,0.96)]">{tag}</span>
                )) : (
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/78">Sin etiquetas</span>
                )}
              </div>
            </div>
          </article>
        )) : (
          <p className="rounded-[1.3rem] border border-dashed border-white/10 bg-black/12 px-4 py-4 text-sm leading-7 text-white/62">No hay noticias cargadas todavía.</p>
        )}
      </div>
    </AdminSectionScaffold>
  );
}