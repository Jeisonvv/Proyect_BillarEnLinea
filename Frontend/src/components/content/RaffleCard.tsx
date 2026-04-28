import type { LandingRaffle } from "@/lib/api/public-content";
import { formatDate, formatMoney, humanizeToken } from "./utils";

export function RaffleCard({ item }: { item: LandingRaffle }) {
  return (
    <article className="rounded-[1.45rem] border border-line bg-black/85 p-5 text-stone-100 shadow-[0_28px_60px_rgba(8,10,9,0.22)]">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">{humanizeToken(item.saleStatus ?? item.status)}</span>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-300">{formatMoney(item.ticketPrice)}</span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-white">{item.name}</h3>
      <p className="mt-3 text-sm leading-7 text-stone-300">{item.prize ?? "Premios pensados para mantener activa a la comunidad y premiar su participacion."}</p>
      <p className="mt-5 text-sm text-stone-400">Sorteo: {formatDate(item.drawDate)}</p>
    </article>
  );
}