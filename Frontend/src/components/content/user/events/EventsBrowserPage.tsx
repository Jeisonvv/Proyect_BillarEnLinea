"use client";

import { useEffect, useState } from "react";
import { EventCard } from "@/components/content/user/events";
import { getLandingEvents } from "@/lib/api/public-content";

type BrowserState = {
  loading: boolean;
  error: string | null;
  items: Awaited<ReturnType<typeof getLandingEvents>>["items"];
};

export function EventsBrowserPage() {
  const [state, setState] = useState<BrowserState>({ loading: true, error: null, items: [] });

  useEffect(() => {
    let active = true;

    void getLandingEvents(12)
      .then((result) => {
        if (!active) return;
        setState({ loading: false, error: result.error, items: result.items });
      })
      .catch((error) => {
        if (!active) return;
        setState({
          loading: false,
          error: error instanceof Error ? error.message : "No fue posible cargar los eventos.",
          items: [],
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Eventos</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Agenda de eventos</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Explora la programacion visible para la comunidad, revisa el estado operativo de cada fecha y entiende rapido el tono de cada evento.
        </p>
      </section>

      {state.loading ? (
        <section className="rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-7 text-white/64">Cargando eventos...</section>
      ) : state.items.length > 0 ? (
        <section className="grid gap-4">
          {state.items.map((event) => (
            <EventCard key={event.id} item={event} />
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-7 text-white/64">
          {state.error ? `No fue posible cargar los eventos. ${state.error}` : "Todavia no hay eventos publicados. Vuelve pronto para ver nuevas fechas y activaciones."}
        </section>
      )}
    </main>
  );
}
