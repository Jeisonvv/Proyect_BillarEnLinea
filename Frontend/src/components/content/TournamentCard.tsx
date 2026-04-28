import Image from "next/image";
import Link from "next/link";
import type { LandingTournament } from "@/lib/api/public-content";
import { formatDate, formatMoney, humanizeToken } from "./utils";

export function TournamentCard({ item }: { item: LandingTournament }) {
  const statusLabel = humanizeToken(item.status);
  const formatLabel = humanizeToken(item.format);
  const seatsLabel = item.maxParticipants
    ? `${item.maxParticipants} cupos disponibles`
    : "Cupos por confirmar";
  const detailHref = `/home/torneos/${item.slug}`;

  return (
    <Link
      aria-label={`Ver detalle del torneo ${item.name}`}
      className="group block rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(246,196,79,0.7)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d12]"
      href={detailHref}
    >
      <article className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,18,24,0.96),rgba(9,11,16,0.98))] shadow-[0_18px_60px_rgba(0,0,0,0.34)] transition duration-300 hover:-translate-y-2 hover:border-[rgba(246,196,79,0.3)] hover:shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,196,79,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(13,110,174,0.18),transparent_24%)] opacity-80 transition duration-300 group-hover:opacity-100" />

        <div className="relative xl:grid xl:grid-cols-[minmax(0,0.95fr)_minmax(25rem,0.85fr)]">
          <div className="relative h-52 overflow-hidden border-b border-white/10 bg-black/30 sm:h-60 lg:h-72 xl:h-full xl:min-h-[24rem] xl:border-b-0 xl:border-r xl:border-white/10">
            {item.image ? (
              <Image
                src={item.image}
                alt={`Imagen del torneo ${item.name}`}
                fill
                sizes="(min-width: 1536px) 42vw, (min-width: 1280px) 44vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover object-center transition duration-700 group-hover:scale-105 xl:object-[center_18%]"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(246,196,79,0.16),rgba(13,110,174,0.16),rgba(255,255,255,0.04))]" />
            )}

            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,14,0.08),rgba(8,10,14,0.2),rgba(8,10,14,0.92))]" />

            <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
              <span className="rounded-full border border-emerald-300/22 bg-emerald-400/12 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.26em] text-emerald-100 backdrop-blur-sm">
                {statusLabel}
              </span>
              <span className="rounded-full border border-white/14 bg-black/28 px-3 py-1 text-[0.72rem] font-semibold text-white/88 backdrop-blur-sm">
                {formatLabel}
              </span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 xl:px-6 xl:pb-6">
              <div className="max-w-[16rem] rounded-[1.4rem] border border-white/10 bg-black/28 p-3 backdrop-blur-md xl:max-w-[18rem] xl:p-4">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-white/48">Torneo destacado</p>
                <p className="mt-2 text-sm leading-6 text-white/82">Competencia diseñada para ritmo alto, comunidad y jornadas con identidad.</p>
              </div>
            </div>
          </div>

          <div className="relative p-5 xl:flex xl:flex-col xl:justify-between xl:p-7 2xl:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.72)]">Circuito Billar En Linea</p>
                <h3 className="mt-3 text-[1.45rem] font-semibold leading-tight text-white xl:max-w-[18ch] xl:text-[1.7rem]">{item.name}</h3>
              </div>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/6 text-center text-[0.62rem] uppercase tracking-[0.24em] text-white/46">
                {item.image ? "Play" : "Sin foto"}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:mt-6">
              <div className="rounded-[1.3rem] border border-white/8 bg-white/6 p-3">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-white/42">Fecha</p>
                <p className="mt-2 text-sm font-medium text-white/88">{formatDate(item.startDate)}</p>
              </div>

              <div className="rounded-[1.3rem] border border-white/8 bg-white/6 p-3">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-white/42">Inscripción</p>
                <p className="mt-2 text-sm font-medium text-white/88">{formatMoney(item.entryFee)}</p>
              </div>

              <div className="rounded-[1.3rem] border border-white/8 bg-white/6 p-3">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-white/42">Cupos</p>
                <p className="mt-2 text-sm font-medium text-white/88">{seatsLabel}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between xl:mt-6">
              <p className="max-w-[24rem] text-sm leading-7 text-white/68 xl:text-[0.98rem]">
                Una propuesta competitiva con puesta visual fuerte, ritmo claro y ambiente de club.
              </p>
              <span className="rounded-full border border-[rgba(246,196,79,0.26)] bg-[rgba(246,196,79,0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(246,196,79,0.92)] transition duration-300 group-hover:bg-[rgba(246,196,79,0.14)]">
                Ver torneo
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}