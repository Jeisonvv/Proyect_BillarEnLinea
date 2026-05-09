import type { LandingRaffle } from "@/lib/api/public-content";
import { ShowcaseCard } from "../shared";
import { formatDate, formatMoney, humanizeToken } from "../shared/utils";

export function RaffleCard({ item }: { item: LandingRaffle }) {
  return (
    <ShowcaseCard
      badge={{ label: humanizeToken(item.saleStatus ?? item.status), tone: item.saleStatus === "ACTIVE" ? "gold" : "amber" }}
      ctaLabel="Ver rifa"
      description={item.prize ?? "Premios pensados para mantener activa a la comunidad y premiar su participacion."}
      eyebrow="Rifas Billar En Linea"
      footer={`Sorteo ${formatDate(item.drawDate)}`}
      metrics={[
        { label: "Numero", value: formatMoney(item.ticketPrice) },
        { label: "Estado", value: humanizeToken(item.status) },
        { label: "Venta", value: humanizeToken(item.saleStatus) },
      ]}
      secondaryBadge="Luck"
      title={item.name}
      visual={{
        overline: "Premio visible",
        title: item.prize ?? "Premio por revelar",
        helper: "Dinamica lista para mover comunidad",
        tone: "gold",
      }}
    />
  );
}