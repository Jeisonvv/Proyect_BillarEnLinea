import type { LandingEvent } from "@/lib/api/public-content";
import { ShowcaseCard } from "../shared";
import { formatDate, formatMoney, humanizeToken } from "../shared/utils";

export function EventCard({ item }: { item: LandingEvent }) {
  return (
    <ShowcaseCard
      badge={{ label: humanizeToken(item.status), tone: item.status === "LIVE" ? "emerald" : item.status === "FINISHED" ? "slate" : item.status === "CANCELLED" ? "rose" : "sky" }}
      ctaLabel="Ver evento"
      description={`${humanizeToken(item.type)}${item.featured ? " destacado" : " curado"} para jugadores, marcas y publico que sigue el billar de cerca.`}
      eyebrow="Agenda Billar En Linea"
      footer={item.endDate ? `Cierra ${formatDate(item.endDate)}` : undefined}
      href={`/home/eventos/${item.slug}`}
      metrics={[
        { label: "Inicio", value: formatDate(item.startDate) },
        { label: "Acceso", value: formatMoney(item.entryFee) },
        { label: "Tier", value: humanizeToken(item.tier) },
      ]}
      secondaryBadge={item.featured ? "Top" : "Live"}
      title={item.name}
      visual={{
        overline: "Evento destacado",
        title: humanizeToken(item.type),
        helper: item.featured ? "Curaduria visible en portada" : "Fecha lista para comunidad",
        tone: "emerald",
      }}
    />
  );
}