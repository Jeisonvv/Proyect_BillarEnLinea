import Link from "next/link";
import { getLandingTournaments } from "@/lib/api/public-content";
import { TournamentCard } from "@/components/content/user/tournaments";
import { canAccessAdmin, getServerSession } from "@/lib/auth/server-session";

export default async function PageHome() {
  let userName = "";
  let userRole = "CUSTOMER";
  const torneos = await getLandingTournaments();
  const session = await getServerSession();

  if (session) {
    userName = session.user.name || session.user.email || "";
    userRole = session.user.role || "CUSTOMER";
  }

  const hasAdminAccess = canAccessAdmin(userRole);

  return (
    <main className="grid gap-6">
      {hasAdminAccess ? (
        <section className="flex flex-col gap-4 rounded-[1.5rem] border border-[rgba(246,196,79,0.18)] bg-[linear-gradient(135deg,rgba(246,196,79,0.12),rgba(255,255,255,0.03)_38%,rgba(46,113,173,0.08)_100%)] p-5 shadow-[0_24px_60px_rgba(3,8,17,0.22)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="space-y-2">
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Gestion interna</p>
            <h1 className="text-2xl font-semibold text-white sm:text-[2rem]">Panel administrativo</h1>
            <p className="max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
              {userName ? `${userName}, ` : ""}
              accede a la base de trabajo para crear torneos, eventos, registrar jugadores, cargar handicap y seguir ampliando las herramientas del equipo.
            </p>
          </div>

          <Link
            className="inline-flex w-fit items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong"
            href="/admin"
          >
            Ir al dashboard
          </Link>
        </section>
      ) : null}

      <section className="grid gap-4">
        {torneos.items.map((torneo) => (
          <TournamentCard key={torneo.id} item={torneo} />
        ))}
      </section>
    </main>
  );
}