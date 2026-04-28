import type { LandingPost } from "@/lib/api/public-content";
import { formatDate } from "./utils";

export function PostCard({ item }: { item: LandingPost }) {
  return (
    <article className="rounded-[1.5rem] border border-line bg-[linear-gradient(180deg,rgba(9,14,22,0.94),rgba(11,18,28,0.9))] p-6 shadow-[0_22px_60px_rgba(5,7,11,0.32)] transition duration-300 hover:-translate-y-1">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-accent-soft">Noticias</span>
        <span className="text-sm text-white/55">{formatDate(item.publishedAt)}</span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-white">{item.title}</h3>
      <p className="mt-4 text-sm leading-7 text-white/72">
        {item.excerpt ?? "Cobertura, analisis y contexto para seguir el billar nacional e internacional sin perder el hilo de la temporada."}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {(item.tags.length > 0 ? item.tags : ["billar", "actualidad"]).slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full border border-line px-3 py-1 text-xs text-white/68">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}