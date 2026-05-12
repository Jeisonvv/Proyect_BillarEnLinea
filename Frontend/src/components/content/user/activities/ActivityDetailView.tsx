import Image from "next/image";
import Link from "next/link";
import type { ActivityDetail } from "@/lib/api/public-content";
import type { MyActivityNumber, ActivityNumberItem } from "@/lib/api/public-content/activities";
import { formatMoney, humanizeToken } from "../shared/utils";
import { ActivityNumberGrid } from "./ActivityNumberGrid";
import { ActivityFreeParticipate } from "./ActivityFreeParticipate";

function getStatusBadgeClass(status: string | null) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-300/22 bg-emerald-400/12 text-emerald-100";
    case "CLOSED":
      return "border-amber-300/24 bg-amber-400/12 text-amber-100";
    case "DRAWN":
      return "border-violet-300/24 bg-violet-400/12 text-violet-100";
    case "DRAFT":
    default:
      return "border-[rgba(246,196,79,0.24)] bg-[rgba(246,196,79,0.12)] text-[rgba(255,233,174,0.96)]";
  }
}

function formatLongDate(value: string | null) {
  if (!value) return "Por anunciar";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(parsed);
}

function formatShortDate(value: string | null) {
  if (!value) return "Por anunciar";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(parsed);
}

type ActivityDetailViewProps = {
  activity: ActivityDetail;
  initialNumbers?: ActivityNumberItem[];
  myNumbers?: MyActivityNumber[];
};

export function ActivityDetailView({ activity, initialNumbers = [], myNumbers = [] }: ActivityDetailViewProps) {
  const sold = activity.soldTickets ?? 0;
  const total = activity.totalTickets ?? 0;
  const percent = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
  const ticketLabel = activity.isFree || activity.ticketPrice === 0 ? "Gratis" : formatMoney(activity.ticketPrice);
  const isFree = activity.isFree === true || activity.ticketPrice === 0;
  const isActive = activity.status === "ACTIVE";
  const isDrawn = activity.status === "DRAWN";
  const statusBadgeClass = getStatusBadgeClass(activity.status);
  const heroImage = activity.image ?? activity.prizeImage ?? null;

  return (
    <main className="grid w-full gap-6 py-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,13,18,0.98),rgba(13,17,24,0.96))] shadow-[0_28px_100px_rgba(0,0,0,0.36)]">
        <div className="relative h-80 overflow-hidden border-b border-white/10 bg-black/30 sm:h-96 lg:h-120">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={`Imagen de la actividad ${activity.name}`}
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
              {humanizeToken(activity.status)}
            </span>
            {activity.isFree || activity.ticketPrice === 0 ? (
              <span className="rounded-full border border-emerald-300/24 bg-emerald-400/12 px-3 py-1 text-[0.72rem] font-semibold text-emerald-100 backdrop-blur-sm">
                Actividad gratuita
              </span>
            ) : null}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 xl:p-8">
            <div className="max-w-3xl space-y-4">
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.34em] text-[rgba(246,196,79,0.82)]">Actividades Billar En Linea</p>
              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl xl:text-5xl">{activity.name}</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                {activity.prize ?? "Premio por revelar"}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-3 p-5 sm:p-7 md:grid-cols-2 xl:grid-cols-4 xl:p-8">
          <article className="rounded-[1.45rem] border border-white/8 bg-white/6 p-4">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-white/46">Boleto</p>
            <p className="mt-2 text-lg font-semibold text-white">{ticketLabel}</p>
          </article>
          <article className="rounded-[1.45rem] border border-white/8 bg-white/6 p-4">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-white/46">Vendidos</p>
            <p className="mt-2 text-lg font-semibold text-white">{sold} / {total}</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full bg-[linear-gradient(90deg,rgba(246,196,79,0.9),rgba(49,121,182,0.9))]"
                style={{ width: `${percent}%` }}
              />
            </div>
          </article>
          <article className="rounded-[1.45rem] border border-white/8 bg-white/6 p-4">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-white/46">Sorteo</p>
            <p className="mt-2 text-lg font-semibold text-white">{formatShortDate(activity.drawDate)}</p>
            {activity.saleClosesAt ? (
              <p className="mt-1 text-xs text-white/55">Cierra venta: {formatShortDate(activity.saleClosesAt)}</p>
            ) : null}
          </article>
          <article className="rounded-[1.45rem] border border-white/8 bg-white/6 p-4">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-white/46">Ganador</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {activity.hasWinner
                ? `${activity.winnerTicket ?? "—"}`
                : isDrawn
                  ? "Sin ganador asignado"
                  : "Pendiente"}
            </p>
            {activity.hasWinner && activity.winnerName ? (
              <p className="mt-1 text-xs text-white/55">{activity.winnerName}</p>
            ) : null}
          </article>
        </div>
      </section>

      {/* Cuerpo */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="grid gap-6">
          {isFree ? (
            <ActivityFreeParticipate activity={activity} myNumbers={myNumbers ?? []} />
          ) : (
            <ActivityNumberGrid activity={activity} initialNumbers={initialNumbers} myNumbers={myNumbers} />
          )}

          {/* Descripción */}
          <article className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,18,24,0.96),rgba(9,11,16,0.98))] p-5 sm:p-7">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.82)]">Detalles</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Sobre esta actividad</h2>
            <p className="mt-4 text-sm leading-7 text-white/72 sm:text-base">
              {activity.description?.trim() ||
                `Compra tu número y participa por: ${activity.prize ?? "el gran premio"}. El sorteo se realiza el ${formatLongDate(
                  activity.drawDate,
                )}.`}
            </p>
          </article>

          {/* Premio */}
          {activity.prizeImage ? (
            <article className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,18,24,0.96),rgba(9,11,16,0.98))]">
              <div className="relative h-72 w-full sm:h-96">
                <Image
                  src={activity.prizeImage}
                  alt={`Foto del premio ${activity.prize ?? activity.name}`}
                  fill
                  sizes="(min-width: 1280px) 55vw, 100vw"
                  className="object-contain object-center"
                />
              </div>
              <div className="border-t border-white/10 p-5 sm:p-7">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.82)]">Premio</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{activity.prize ?? "Premio por anunciar"}</h3>
              </div>
            </article>
          ) : null}
        </section>

        {/* Resumen lateral */}
        <aside className="grid gap-4 self-start rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,18,24,0.96),rgba(9,11,16,0.98))] p-5 sm:p-7">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.82)]">Resumen</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Datos rápidos</h2>
            <p className="mt-3 text-sm leading-7 text-white/68">
              {isActive
                ? `Selecciona tus números en la grilla. Cada boleto cuesta ${ticketLabel}.`
                : isDrawn
                  ? "Esta actividad ya fue sorteada. Revisa el ganador en la parte superior."
                  : "La venta de boletos no está abierta en este momento."}
            </p>
          </div>

          <dl className="grid gap-3">
            <div className="flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-white/4 px-4 py-3">
              <dt className="text-xs uppercase tracking-[0.2em] text-white/54">Estado</dt>
              <dd className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] ${statusBadgeClass}`}>
                {humanizeToken(activity.status)}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-white/4 px-4 py-3">
              <dt className="text-xs uppercase tracking-[0.2em] text-white/54">Boleto</dt>
              <dd className="text-sm font-semibold text-white">{ticketLabel}</dd>
            </div>
            <div className="flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-white/4 px-4 py-3">
              <dt className="text-xs uppercase tracking-[0.2em] text-white/54">Disponibles</dt>
              <dd className="text-sm font-semibold text-white">
                {activity.numberSummary
                  ? activity.numberSummary.available
                  : Math.max(0, total - sold)}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-white/4 px-4 py-3">
              <dt className="text-xs uppercase tracking-[0.2em] text-white/54">Sorteo</dt>
              <dd className="text-sm font-semibold text-white">{formatShortDate(activity.drawDate)}</dd>
            </div>
          </dl>

          <Link
            href="/home/activities"
            className="text-center text-xs font-medium text-white/55 transition hover:text-white"
          >
            ← Volver a todas las actividades
          </Link>
        </aside>
      </div>
    </main>
  );
}
