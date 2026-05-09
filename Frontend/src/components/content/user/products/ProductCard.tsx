import type { LandingProduct } from "@/lib/api/public-content";
import { ShowcaseCard } from "../shared";
import { formatMoney, humanizeToken } from "../shared/utils";

export function ProductCard({ item }: { item: LandingProduct }) {
  const tagsLabel = (item.tags.length > 0 ? item.tags : ["premium", "seleccion curada"]).slice(0, 2).join(" · ");

  return (
    <ShowcaseCard
      badge={{ label: humanizeToken(item.category), tone: "sky" }}
      ctaLabel="Ver producto"
      description={item.description ?? "Equipamiento seleccionado para jugadores que exigen precision, presencia y rendimiento."}
      eyebrow="Tienda Billar En Linea"
      footer={tagsLabel}
      metrics={[
        { label: "Precio", value: formatMoney(item.basePrice) },
        { label: "Stock", value: item.stock && item.stock > 0 ? `${item.stock} disponibles` : "Stock por confirmar" },
        { label: "Etiqueta", value: (item.tags[0] ?? "Curado").toUpperCase() },
      ]}
      secondaryBadge="Gear"
      title={item.name}
      visual={{
        overline: "Catalogo curado",
        title: humanizeToken(item.category),
        helper: "Referencia lista para salir a mesa",
        tone: "sky",
      }}
    />
  );
}