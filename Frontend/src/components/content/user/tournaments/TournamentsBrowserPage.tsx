"use client";

import { useEffect, useState } from "react";
import { ShowcaseCard } from "@/components/content/user/shared";
import { getTournamentShowcaseProps, ProgressiveTournamentList } from "@/components/content/user/tournaments";
import { getLandingTournaments } from "@/lib/api/public-content";

type BrowserState = {
  loading: boolean;
  error: string | null;
  items: Awaited<ReturnType<typeof getLandingTournaments>>["items"];
};

export function TournamentsBrowserPage() {
  const [state, setState] = useState<BrowserState>({
    loading: true,
    error: null,
    items: [],
  });

  useEffect(() => {
    let active = true;

    void getLandingTournaments()
      .then((result) => {
        if (!active) return;

        setState({
          loading: false,
          error: result.error,
          items: result.items,
        });
      })
      .catch((error) => {
        if (!active) return;

        setState({
          loading: false,
          error: error instanceof Error ? error.message : "No fue posible cargar los torneos.",
          items: [],
        });
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.loading) {
    return (
      <main className="grid gap-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Torneos</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Torneos disponibles</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">Cargando torneos...</p>
        </section>
      </main>
    );
  }

  const firstTournaments = state.items.slice(0, 2);
  const remainingTournaments = state.items.slice(2);

  return (
    <main className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Torneos</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Torneos disponibles</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Revisa la agenda activa, consulta formatos y entra a cada torneo para conocer sus detalles y avanzar con tu participacion.
        </p>
      </section>

      {state.items.length > 0 ? (
        <section className="grid gap-4">
          {firstTournaments.map((tournament) => (
            <ShowcaseCard key={tournament.id} {...getTournamentShowcaseProps(tournament, true)} />
          ))}
          <ProgressiveTournamentList tournaments={remainingTournaments} />
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-7 text-white/64">
          {state.error ? `No fue posible cargar los torneos. ${state.error}` : "Todavia no hay torneos publicados. Vuelve pronto para ver nuevas fechas y cupos disponibles."}
        </section>
      )}
    </main>
  );
}