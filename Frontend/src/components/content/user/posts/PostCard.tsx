import type { LandingPost } from "@/lib/api/public-content";
import { ShowcaseCard } from "../shared";
import { formatDate, humanizeToken } from "../shared/utils";

export function PostCard({ item }: { item: LandingPost }) {
  const slug = item.slug ?? item.id;
  const imageAlt = item.coverImageUrl ? `Portada de la noticia ${item.title}` : item.title;

  return (
    <ShowcaseCard
      href={`/home/noticias/${slug}`}
      badge={{ label: "Noticias", tone: "slate" }}
      ctaLabel="Leer noticia"
      description={item.excerpt ?? "Cobertura, analisis y contexto para seguir el billar nacional e internacional sin perder el hilo de la temporada."}
      eyebrow="Editorial Billar En Linea"
      footer={(item.tags.length > 0 ? item.tags : ["billar", "actualidad"]).slice(0, 3).join(" · ")}
      metrics={[
        { label: "Fecha", value: formatDate(item.publishedAt) },
        { label: "Lectura", value: item.readingTime ? `${item.readingTime} min` : "1 min" },
        { label: "Sección", value: humanizeToken(item.category ?? "noticias") },
      ]}
      image={item.coverImageUrl ? { src: item.coverImageUrl, alt: imageAlt, loading: "lazy", objectClassName: "object-cover object-center" } : undefined}
      secondaryBadge="News"
      title={item.title}
      visual={{
        overline: "Pulso editorial",
        title: item.category ? humanizeToken(item.category) : "Nota destacada",
        helper: "Lectura rapida para seguir temporada",
        tone: "stone",
      }}
    />
  );
}