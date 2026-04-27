import type { LandingProduct } from "@/lib/api/public-content";
import { humanizeToken, formatMoney } from "./utils";

export function ProductCard({ item }: { item: LandingProduct }) {
  return (
    <article className="rounded-[1.55rem] border border-line bg-[linear-gradient(180deg,rgba(14,20,30,0.96),rgba(8,13,20,0.92))] p-5 shadow-[0_22px_55px_rgba(3,6,10,0.32)] transition duration-300 hover:-translate-y-1">
      <div className="rounded-[1.2rem] border border-[rgba(246,196,79,0.22)] bg-[linear-gradient(135deg,rgba(246,196,79,0.12),rgba(13,110,174,0.12))] p-4">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-accent-soft">{humanizeToken(item.category)}</p>
        <h3 className="mt-3 text-xl font-semibold text-white">{item.name}</h3>
        <p className="mt-4 text-sm leading-7 text-white/72">{item.description ?? "Equipamiento seleccionado para jugadores que exigen precision, presencia y rendimiento."}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-lg font-semibold text-accent-soft">{formatMoney(item.basePrice)}</p>
        <p className="text-sm text-white/60">{item.stock && item.stock > 0 ? `${item.stock} disponibles` : "Stock por confirmar"}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(item.tags.length > 0 ? item.tags : ["premium", "seleccion curada"]).slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full border border-line px-3 py-1 text-xs text-white/68">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
