import Link from "next/link";
import {
  AdminDeleteItemButton,
  AdminManageLink,
  AdminSectionScaffold,
  formatAdminDate,
  humanizeAdminToken,
} from "@/components/content/admin/shared";
import { getJson } from "@/lib/api/client";
import { normalizePost } from "@/lib/api/public-content/posts";
import { requireAdminServerSession } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

type AdminNewsItem = NonNullable<ReturnType<typeof normalizePost>> & {
  status?: string;
};

export default async function AdminNewsPage() {
  const session = await requireAdminServerSession();
  let posts: AdminNewsItem[] = [];
  let total = 0;
  let errorMessage: string | null = null;

  try {
    const payload = await getJson<{ data?: unknown; pagination?: { total?: unknown } }>(
      "/api/posts/admin/all?page=1&limit=100",
      {
        cache: "no-store",
        headers: {
          Cookie: `${session.authCookie.cookieName}=${session.authCookie.value}`,
        },
      },
    );

    const data = Array.isArray(payload.data) ? payload.data : [];

    posts = data.reduce<AdminNewsItem[]>((acc, item) => {
      if (!item || typeof item !== "object") {
        return acc;
      }

      const record = item as Record<string, unknown>;
      const normalized = normalizePost(record);

      if (!normalized) {
        return acc;
      }

      acc.push({
        ...normalized,
        status: typeof record.status === "string" ? record.status : undefined,
      });

      return acc;
    }, []);

    total = typeof payload.pagination?.total === "number" ? payload.pagination.total : posts.length;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "No se pudieron cargar las noticias del panel.";
  }

  const taggedCount = posts.filter((item) => item.tags.length > 0).length;
  const draftCount = posts.filter((item) => item.status === "DRAFT").length;

  return (
    <AdminSectionScaffold
      kicker="Admin noticias"
      title="Ordena lo que sale en contenido"
      description="Revisa noticias publicadas y borradores, detecta piezas sin etiquetas y usa esta sección para decidir qué contenido pasa a público."
      primaryAction={{ label: "Crear noticia", href: "/admin/noticias/crear" }}
      secondaryAction={{ label: "Home user", href: "/home" }}
      metrics={[
        { label: "Total", value: String(total), helper: errorMessage ?? "Noticias registradas en el panel admin." },
        { label: "Borradores", value: String(draftCount), helper: "Piezas listas para publicarse más adelante." },
        { label: "Con etiquetas", value: String(taggedCount), helper: "Publicaciones con taxonomía cargada." },
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[rgba(246,196,79,0.2)] bg-[rgba(246,196,79,0.12)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(255,233,174,0.96)]">{humanizeAdminToken(post.status ?? "DRAFT")}</span>
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/78">{post.slug ?? "Sin slug"}</span>
                </div>
              </div>
              <p className="text-sm leading-7 text-white/64">{post.excerpt ?? "Sin extracto disponible."}</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.length > 0 ? post.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[rgba(246,196,79,0.2)] bg-[rgba(246,196,79,0.12)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(255,233,174,0.96)]">{tag}</span>
                )) : (
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/78">Sin etiquetas</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <AdminManageLink href={`/admin/noticias/${post.slug ?? post.id}`} />
                <AdminDeleteItemButton
                  deletePath={`/api/posts/${post.id}`}
                  itemLabel="noticia"
                  itemName={post.title}
                  consequences={[
                    "La noticia desaparecerá de la sección pública.",
                    "El slug quedará disponible para otra publicación.",
                  ]}
                  description={
                    <>
                      Vas a eliminar <span className="font-semibold text-white">{post.title}</span>. Esta acción es permanente.
                    </>
                  }
                  successMessage="Noticia eliminada correctamente."
                />
              </div>
            </div>
          </article>
        )) : (
          <p className="rounded-[1.3rem] border border-dashed border-white/10 bg-black/12 px-4 py-4 text-sm leading-7 text-white/62">{errorMessage ?? "No hay noticias cargadas todavía."}</p>
        )}
      </div>
    </AdminSectionScaffold>
  );
}