import type { Metadata } from "next";
import { TournamentCard } from "@/components/content/user/tournaments";
import { getLandingTournaments } from "@/lib/api/public-content";

export const metadata: Metadata = {
  title: "Torneos",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function HomeTorneosPage() {
  const tournaments = await getLandingTournaments();

  return (
    <main className="grid gap-6">
      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Torneos</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Torneos disponibles</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Revisa la agenda activa, consulta formatos y entra a cada torneo para conocer sus detalles y avanzar con tu participacion.
        </p>
      </section>

      {tournaments.items.length > 0 ? (
        <section className="grid gap-4">
          {tournaments.items.map((tournament) => (
            <TournamentCard key={tournament.id} item={tournament} />
          ))}
        </section>
      ) : (
        <section className="rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.03] p-6 text-sm leading-7 text-white/64">
          Todavia no hay torneos publicados. Vuelve pronto para ver nuevas fechas y cupos disponibles.
        </section>
      )}
    </main>
  );
}