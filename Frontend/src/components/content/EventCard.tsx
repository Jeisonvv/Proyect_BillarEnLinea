import type { LandingEvent } from "@/lib/api/public-content";
import { formatDate, formatMoney, humanizeToken } from "./utils";

export function EventCard({ item }: { item: LandingEvent }) {
  return (
    <article className="rounded-[1.45rem] border border-line bg-[linear-gradient(180deg,rgba(10,18,28,0.96),rgba(8,14,22,0.9))] p-5 shadow-[0_22px_50px_rgba(5,8,14,0.3)] transition duration-300 hover:-translate-y-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-accent-soft">{humanizeToken(item.tier)}</span>
        <span className="rounded-full border border-line px-3 py-1 text-xs text-white/70">{humanizeToken(item.status)}</span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-white">{item.name}</h3>
      <p className="mt-3 text-sm leading-7 text-white/70">
        {`${humanizeToken(item.type)}${item.featured ? " destacado" : " curado"} para jugadores, marcas y publico que sigue el billar de cerca.`}
      </p>
      <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/72">
        <span>{formatDate(item.startDate)}</span>
        <span>{formatMoney(item.entryFee)}</span>
        {item.endDate ? <span>hasta {formatDate(item.endDate)}</span> : null}
      </div>
    </article>
  );
}