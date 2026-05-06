import type { Metadata } from "next";
import Link from "next/link";
import { getLandingSnapshot } from "@/lib/api/public-content";
import { getServerSession } from "@/lib/auth/server-session";

function formatLongDate(value: string | null) {
  if (!value) {
    return "Sin fecha definida";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function humanizeToken(value: string | null) {
  if (!value) {
    return "Sin dato";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const metadata: Metadata = {
  title: "Dashboard administrativo",
  description: "Centro de control para revisar el estado del contenido y entrar a las herramientas internas.",
  robots: {
    index: false,
    follow: false,
  },
};

async function getAdminSessionSummary() {
  const session = await getServerSession();

  if (!session) {
    return {
      name: "Equipo",
      role: "STAFF",
    };
  }

  return {
    name: session.user.name || session.user.email || "Equipo",
    role: session.user.role || "STAFF",
  };
}

export default async function AdminPage() {

  const [{ name, role }, snapshot] = await Promise.all([
    getAdminSessionSummary(),
    getLandingSnapshot(),
  ]);

  const summaryCards = [
    {
      label: "Torneos",
      value: snapshot.totals.tournaments,
      accent: "text-[rgba(246,196,79,0.96)]",
      helper: snapshot.tournaments.error ?? `${snapshot.tournaments.items.filter((item) => item.status === "OPEN").length} con inscripciones abiertas`,
    },
    {
      label: "Eventos",
      value: snapshot.totals.events,
      accent: "text-[rgba(132,224,196,0.96)]",
      helper: snapshot.events.error ?? `${snapshot.events.items.filter((item) => item.status === "SCHEDULED").length} programados`,
    },
    {
      label: "Rifas",
      value: snapshot.totals.raffles,
      accent: "text-[rgba(255,168,119,0.96)]",
      helper: snapshot.raffles.error ?? `${snapshot.raffles.items.filter((item) => item.saleStatus === "ACTIVE").length} activas`,
    },
    {
      label: "Productos",
      value: snapshot.totals.products,
      accent: "text-[rgba(129,181,255,0.96)]",
      helper: snapshot.products.error ?? `${snapshot.products.items.filter((item) => (item.stock ?? 0) <= 5).length} con stock bajo`,
    },
  ];

  const quickActions = [
    {
      href: "/admin/torneos",
      title: "Administrar torneos",
      description: "Entra al tablero de torneos para revisar la agenda, abrir la vista pública y crear nuevos torneos.",
    },
    {
      href: "/admin/eventos",
      title: "Administrar eventos",
      description: "Controla el calendario visible y valida el estado operativo de cada evento.",
    },
    {
      href: "/admin/tienda",
      title: "Administrar tienda",
      description: "Monitorea inventario, stock bajo y la presentación pública del catálogo.",
    },
    {
      href: "/admin/noticias",
      title: "Administrar noticias",
      description: "Sigue el pulso editorial de posts, etiquetas y publicaciones recientes.",
    },
  ];

  const lowStockProducts = snapshot.products.items.filter((item) => (item.stock ?? 0) <= 5).slice(0, 4);

  return (
    <main className="grid gap-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-[rgba(246,196,79,0.16)] bg-[linear-gradient(135deg,rgba(11,13,18,0.98),rgba(16,21,30,0.96)_46%,rgba(10,36,57,0.92)_100%)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.34)] sm:p-6 lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(246,196,79,0.22),transparent_28%),radial-gradient(circle_at_100%_10%,rgba(49,121,182,0.18),transparent_30%),linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.04)_48%,transparent_58%)]" />
        <div className="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div className="space-y-4">
            <p className="text-[0.72rem] uppercase tracking-[0.34em] text-[#f6c44f]">Centro de control</p>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-4xl xl:text-[3.2rem]">
                {name}, aqui tienes una vista rapida del pulso operativo de Billar en Linea.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
                Usa este panel para detectar contenido pendiente, entrar a las herramientas internas y revisar si torneos, eventos, rifas y tienda mantienen ritmo de publicacion.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="rounded-full border border-[rgba(246,196,79,0.28)] bg-[rgba(246,196,79,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(255,244,214,0.94)]">
                Rol {humanizeToken(role)}
              </span>
              <Link
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong"
                href="/admin/torneos/crear"
              >
                Lanzar nuevo torneo
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {summaryCards.map((card) => (
              <article key={card.label} className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.04))] p-4 backdrop-blur-sm">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/48">{card.label}</p>
                <p className={`mt-3 text-3xl font-semibold ${card.accent}`}>{card.value}</p>
                <p className="mt-2 text-sm leading-6 text-white/62">{card.helper}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Accesos directos</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Herramientas para mover el dia</h2>
            </div>
            <Link className="text-sm font-medium text-white/62 transition hover:text-white" href="/home">
              Home user
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5 transition hover:border-[rgba(246,196,79,0.24)] hover:bg-[linear-gradient(180deg,rgba(246,196,79,0.09),rgba(255,255,255,0.03))]"
              >
                <p className="text-lg font-semibold text-white transition group-hover:text-[rgba(255,238,190,0.98)]">{action.title}</p>
                <p className="mt-3 text-sm leading-7 text-white/66">{action.description}</p>
              </Link>
            ))}
          </div>

          <section className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Radar de torneos</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Lo mas reciente en competicion</h3>
              </div>
              <Link className="text-sm font-medium text-white/62 transition hover:text-white" href="/home/torneos">
                Ver todo
              </Link>
            </div>

            <div className="mt-4 grid gap-3">
              {snapshot.tournaments.items.length > 0 ? snapshot.tournaments.items.map((tournament) => (
                <article key={tournament.id} className="rounded-[1.3rem] border border-white/8 bg-black/18 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">{tournament.name}</p>
                      <p className="mt-1 text-sm text-white/56">{formatLongDate(tournament.startDate)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/78">
                        {humanizeToken(tournament.format)}
                      </span>
                      <span className="rounded-full border border-[rgba(246,196,79,0.2)] bg-[rgba(246,196,79,0.12)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(255,233,174,0.96)]">
                        {humanizeToken(tournament.status)}
                      </span>
                    </div>
                  </div>
                </article>
              )) : (
                <p className="rounded-[1.3rem] border border-dashed border-white/10 bg-black/12 px-4 py-4 text-sm leading-7 text-white/62">
                  No hay torneos cargados todavia.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-4 self-start">
          <section className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
            <p className="text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Alertas operativas</p>
            <div className="mt-4 grid gap-3">
              <article className="rounded-[1.25rem] border border-[rgba(129,181,255,0.18)] bg-[rgba(28,53,87,0.28)] p-4">
                <p className="text-sm font-semibold text-white">Productos con stock bajo</p>
                <p className="mt-2 text-sm leading-7 text-white/68">
                  {lowStockProducts.length > 0
                    ? `${lowStockProducts.length} referencias requieren atencion antes de quedarse sin inventario.`
                    : "No hay productos con alerta de stock bajo en el snapshot actual."}
                </p>
              </article>
              <article className="rounded-[1.25rem] border border-[rgba(246,196,79,0.18)] bg-[rgba(77,56,14,0.24)] p-4">
                <p className="text-sm font-semibold text-white">Publicacion de contenido</p>
                <p className="mt-2 text-sm leading-7 text-white/68">
                  {snapshot.posts.total} posts y {snapshot.events.total} eventos visibles. Usa esta vista para notar rapido si el calendario publico se quedo quieto.
                </p>
              </article>
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Inventario sensible</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Reposicion sugerida</h3>
              </div>
              <Link className="text-sm font-medium text-white/62 transition hover:text-white" href="/home/tienda">
                Ir a tienda
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {lowStockProducts.length > 0 ? lowStockProducts.map((product) => (
                <article key={product.id} className="rounded-[1.25rem] border border-white/8 bg-black/18 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{product.name}</p>
                      <p className="mt-1 text-sm text-white/56">{humanizeToken(product.category)}</p>
                    </div>
                    <span className="rounded-full border border-[rgba(255,168,119,0.18)] bg-[rgba(255,168,119,0.12)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(255,212,190,0.94)]">
                      Stock {product.stock ?? 0}
                    </span>
                  </div>
                </article>
              )) : (
                <p className="rounded-[1.3rem] border border-dashed border-white/10 bg-black/12 px-4 py-4 text-sm leading-7 text-white/62">
                  No hay alertas de stock bajo en este momento.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
            <p className="text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Actividad publica</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Eventos</p>
                <p className="mt-2 text-2xl font-semibold text-white">{snapshot.totals.events}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Rifas</p>
                <p className="mt-2 text-2xl font-semibold text-white">{snapshot.totals.raffles}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Posts</p>
                <p className="mt-2 text-2xl font-semibold text-white">{snapshot.totals.posts}</p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}