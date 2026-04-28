import { cookies } from "next/headers";
import Link from "next/link";
import { getLandingTournaments } from "@/lib/api/public-content";
import { TournamentCard } from "@/components/content/TournamentCard";

const AUTH_COOKIE_NAMES = ["billar_auth", "auth_token"];

export default async function PageHome() {
  let userName = "";
  const cookieStore = await cookies();
  const authCookie = AUTH_COOKIE_NAMES
    .map((cookieName) => ({ cookieName, value: cookieStore.get(cookieName)?.value ?? null }))
    .find((entry) => entry.value);
  const torneos = await getLandingTournaments();
  console.log("Torneos obtenidos:", torneos);

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
    } catch {}
  }

  return (
    <main className="grid gap-6">
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2>¡Hola, {userName || "visitante"}!</h2>
          <p>Puedes editar este archivo para personalizar tu contenido.</p>
        </div>
        <Link
          className="inline-flex w-fit rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#0b0b0d] transition hover:bg-accent-strong"
          href="/home/crear-torneo"
        >
          Ir al formulario de prueba
        </Link>
      </div>

      <section className="grid gap-4">
        {torneos.items.map((torneo) => (
          <TournamentCard key={torneo.id} item={torneo} />
        ))}
      </section>
    </main>
  );
}