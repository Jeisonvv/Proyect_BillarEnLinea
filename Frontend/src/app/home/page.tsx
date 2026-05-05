import { cookies } from "next/headers";
import Link from "next/link";
import { getLandingTournaments } from "@/lib/api/public-content";
import { TournamentCard } from "@/components/content/TournamentCard";

const AUTH_COOKIE_NAMES = ["billar_auth", "auth_token"];
const ADMIN_ROLES = new Set(["ADMIN", "STAFF"]);

export default async function PageHome() {
  let userName = "";
  let userRole = "CUSTOMER";
  const cookieStore = await cookies();
  const authCookie = AUTH_COOKIE_NAMES
    .map((cookieName) => ({ cookieName, value: cookieStore.get(cookieName)?.value ?? null }))
    .find((entry) => entry.value);
  const torneos = await getLandingTournaments();
 

  if (authCookie?.value) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001"}/api/auth/me`,
        {
          headers: {
            Cookie: `${authCookie.cookieName}=${authCookie.value}`,
          },
          cache: "no-store",
        },
      );

      const session = await res.json();
      userName = session.user?.name || session.user?.email || "";
      userRole = session.user?.role || "CUSTOMER";
    } catch {}
  }

  const canAccessAdmin = ADMIN_ROLES.has(userRole);

  return (
    <main className="grid gap-6">
      {canAccessAdmin ? (
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
            href="/home/admin"
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