import type { LandingTournament } from "@/lib/api/public-content";
import { humanizeToken, formatDate, formatMoney } from "./utils";

export function TournamentCard({ item }: { item: LandingTournament }) {
  return (
    <article className="rounded-[1.55rem] border border-white/10 bg-white/6 p-5 transition duration-300 hover:-translate-y-1 hover:bg-white/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-white/55">{humanizeToken(item.status)}</p>
          <h3 className="mt-3 text-xl font-semibold text-white">{item.name}</h3>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">{humanizeToken(item.format)}</span>
      </div>
      <div className="mt-5 grid gap-3 text-sm text-white/70 md:grid-cols-2">
        <p>{formatDate(item.startDate)}</p>
        <p>{formatMoney(item.entryFee)}</p>
      </div>
      <p className="mt-4 text-sm leading-7 text-white/70">
        {item.maxParticipants ? `${item.maxParticipants} cupos pensados para una jornada bien armada.` : "Agenda competitiva con foco en experiencia, ritmo y comunidad."}
      </p>
    </article>
  );
}
