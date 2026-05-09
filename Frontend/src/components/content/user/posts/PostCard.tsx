import type { LandingPost } from "@/lib/api/public-content";
import { ShowcaseCard } from "../shared";
import { formatDate } from "../shared/utils";

export function PostCard({ item }: { item: LandingPost }) {
  return (
    <ShowcaseCard
      badge={{ label: "Noticias", tone: "slate" }}
      ctaLabel="Leer cobertura"
      description={item.excerpt ?? "Cobertura, analisis y contexto para seguir el billar nacional e internacional sin perder el hilo de la temporada."}
      eyebrow="Editorial Billar En Linea"
      footer={(item.tags.length > 0 ? item.tags : ["billar", "actualidad"]).slice(0, 3).join(" · ")}
      metrics={[
        { label: "Fecha", value: formatDate(item.publishedAt) },
        { label: "Slug", value: item.slug ?? "Por publicar" },
        { label: "Tags", value: String(item.tags.length > 0 ? item.tags.length : 2) },
      ]}
      secondaryBadge="News"
      title={item.title}
      visual={{
        overline: "Pulso editorial",
        title: item.slug ?? "Nota destacada",
        helper: "Lectura rapida para seguir temporada",
        tone: "stone",
      }}
    />
  );
}