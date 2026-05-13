import Image from "next/image";
import Link from "next/link";
import type { EventDetail } from "@/lib/api/public-content";
import { formatMoney, humanizeToken } from "../shared/utils";

function getStatusBadgeClass(status: EventDetail["status"]) {
  switch (status) {
    case "SCHEDULED":
      return "border-amber-300/24 bg-amber-400/12 text-amber-100";
    case "LIVE":
      return "border-emerald-300/24 bg-emerald-400/12 text-emerald-100";
    case "FINISHED":
      return "border-slate-300/22 bg-slate-300/10 text-slate-100";
    case "CANCELLED":
      return "border-rose-300/24 bg-rose-400/12 text-rose-100";
    default:
      return "border-white/14 bg-black/28 text-white/88";
  }
}

function formatLongDate(value: string | null) {
  if (!value) {
    return "Por anunciar";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(parsed);
}

export function EventDetailView({ event }: { event: EventDetail }) {
  const statusBadgeClass = getStatusBadgeClass(event.status);
  const locationLabel = [event.location, event.city, event.department, event.country].filter(Boolean).join(" · ");

  return (
    <main className="grid w-full gap-6 py-6">
      <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,13,18,0.98),rgba(13,17,24,0.96))] shadow-[0_28px_100px_rgba(0,0,0,0.36)]">
        <div className="relative h-80 overflow-hidden border-b border-white/10 bg-black/30 sm:h-96 lg:h-128">
          {event.image ? (
            <Image
              src={event.image}
              alt={`Imagen del evento ${event.name}`}
              fill
              priority
              sizes="(min-width: 1536px) 55vw, (min-width: 1280px) 58vw, 100vw"
              className="object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(246,196,79,0.18),rgba(13,110,174,0.18),rgba(255,255,255,0.03))]" />
          )}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,12,0.18),rgba(7,9,12,0.34),rgba(7,9,12,0.94))]" />

          <div className="absolute left-5 right-5 top-5 flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.26em] backdrop-blur-sm ${statusBadgeClass}`}>
              {humanizeToken(event.status)}
            </span>
            <span className="rounded-full border border-white/14 bg-black/28 px-3 py-1 text-[0.72rem] font-semibold text-white/88 backdrop-blur-sm">
              {humanizeToken(event.type)}
            </span>
            <span className="rounded-full border border-white/14 bg-black/28 px-3 py-1 text-[0.72rem] font-semibold text-white/88 backdrop-blur-sm">
              {humanizeToken(event.tier)}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 xl:p-8">
            <div className="max-w-3xl space-y-4">
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.34em] text-[rgba(246,196,79,0.82)]">Evento Billar En Linea</p>
              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl xl:text-5xl">{event.name}</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                {event.description ?? "Detalle del evento disponible próximamente."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-5 sm:p-7 xl:p-8">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[1.45rem] border border-white/8 bg-white/6 p-4">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-white/42">Inicio</p>
              <p className="mt-2 text-sm font-medium text-white/88">{formatLongDate(event.startDate)}</p>
            </article>
            <article className="rounded-[1.45rem] border border-white/8 bg-white/6 p-4">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-white/42">Acceso</p>
              <p className="mt-2 text-sm font-medium text-white/88">{formatMoney(event.entryFee)}</p>
            </article>
            <article className="rounded-[1.45rem] border border-white/8 bg-white/6 p-4">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-white/42">Boleteria</p>
              <p className="mt-2 text-sm font-medium text-white/88">{formatMoney(event.ticketPrice)}</p>
            </article>
            <article className="rounded-[1.45rem] border border-white/8 bg-white/6 p-4">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-white/42">Ubicacion</p>
              <p className="mt-2 text-sm font-medium text-white/88">{locationLabel || "Por anunciar"}</p>
            </article>
          </div>

          <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <article className="rounded-[1.7rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.025))] p-5">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.74)]">Resumen</p>
              <div className="mt-4 space-y-4 text-sm leading-7 text-white/72">
                <p>{event.description ?? "Este evento ya tiene su espacio preparado para publicar contexto, agenda y detalles operativos."}</p>
                {event.organizer ? <p><span className="font-semibold text-white">Organiza:</span> {event.organizer}</p> : null}
                {event.grandstandDetails ? <p><span className="font-semibold text-white">Zona de espectadores:</span> {event.grandstandDetails}</p> : null}
                {event.endDate ? <p><span className="font-semibold text-white">Finaliza:</span> {formatLongDate(event.endDate)}</p> : null}
              </div>
            </article>

            <article className="rounded-[1.7rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.025))] p-5">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.74)]">Acciones</p>
              <div className="mt-4 grid gap-3">
                {event.registrationUrl ? (
                  <Link className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong" href={event.registrationUrl} target="_blank" rel="noopener noreferrer">
                    Ir a inscripcion
                  </Link>
                ) : null}
                {event.ticketUrl ? (
                  <Link className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white/82 transition hover:bg-white/8 hover:text-white" href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                    Ver boleteria
                  </Link>
                ) : null}
                {event.streamUrl ? (
                  <Link className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white/82 transition hover:bg-white/8 hover:text-white" href={event.streamUrl} target="_blank" rel="noopener noreferrer">
                    Ver transmision
                  </Link>
                ) : null}
                {event.resultsUrl ? (
                  <Link className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white/82 transition hover:bg-white/8 hover:text-white" href={event.resultsUrl} target="_blank" rel="noopener noreferrer">
                    Ver resultados
                  </Link>
                ) : null}
                <Link className="inline-flex items-center justify-center rounded-full border border-[rgba(246,196,79,0.24)] bg-[rgba(246,196,79,0.1)] px-5 py-3 text-sm font-semibold text-[rgba(255,240,194,0.92)] transition hover:bg-[rgba(246,196,79,0.18)] hover:text-white" href="/home/eventos">
                  Volver a eventos
                </Link>
              </div>
            </article>
          </section>

          {event.prizes.length > 0 ? (
            <section className="rounded-[1.7rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.025))] p-5">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.74)]">Premiacion</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {event.prizes.map((prize) => (
                  <article key={`${prize.position}-${prize.description}`} className="rounded-[1.3rem] border border-white/8 bg-black/18 p-4">
                    <p className="text-sm font-semibold text-white">Puesto {prize.position}</p>
                    <p className="mt-2 text-sm leading-7 text-white/72">{prize.description}</p>
                    {prize.amount !== null ? <p className="mt-3 text-sm font-medium text-[rgba(246,196,79,0.92)]">{formatMoney(prize.amount)}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}