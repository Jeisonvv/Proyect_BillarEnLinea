import type { Metadata } from "next";
import { EventCard } from "@/components/content/user/events";
import { getLandingEvents } from "@/lib/api/public-content";

export const metadata: Metadata = {
  title: "Eventos",
};

export default async function HomeEventosPage() {
  const events = await getLandingEvents(12);

  return (
    <main className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Eventos</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Agenda de eventos</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Explora la programacion visible para la comunidad, revisa el estado operativo de cada fecha y entiende rapido el tono de cada evento.
        </p>
      </section>

      {events.items.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {events.items.map((event) => (
            <EventCard key={event.id} item={event} />
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-7 text-white/64">
          Todavia no hay eventos publicados. Vuelve pronto para ver nuevas fechas y activaciones.
        </section>
      )}
    </main>
  );
}