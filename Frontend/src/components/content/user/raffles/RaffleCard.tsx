import type { LandingRaffle } from "@/lib/api/public-content";
import { ShowcaseCard } from "../shared";
import { formatDate, formatMoney, humanizeToken } from "../shared/utils";

function getRaffleBadgeTone(status: string | null) {
  switch (status) {
    case "ACTIVE":
      return "open" as const;
    case "CLOSED":
      return "amber" as const;
    case "DRAWN":
      return "sky" as const;
    case "DRAFT":
    default:
      return "gold" as const;
  }
}

export function RaffleCard({ item }: { item: LandingRaffle }) {
  const ticketLabel = item.isFree || item.ticketPrice === 0 ? "Gratis" : formatMoney(item.ticketPrice);
  const sold = item.soldTickets ?? 0;
  const total = item.totalTickets ?? 0;
  const stockLabel = total > 0 ? `${sold}/${total}` : "—";

  return (
    <ShowcaseCard
      href={`/home/rifas/${item.id}`}
      badge={{ label: humanizeToken(item.status), tone: getRaffleBadgeTone(item.status) }}
      ctaLabel="Ver rifa"
      description={item.prize ?? "Premios pensados para mantener activa a la comunidad y premiar su participación."}
      eyebrow="Rifas Billar En Linea"
      footer={`Sorteo ${formatDate(item.drawDate)}`}
      metrics={[
        { label: "Boleto", value: ticketLabel },
        { label: "Vendidos", value: stockLabel },
        { label: "Venta", value: humanizeToken(item.saleStatus ?? item.status) },
      ]}
      secondaryBadge="Luck"
      title={item.name}
      image={item.image ? {
        src: item.image,
        alt: `Imagen de la rifa ${item.name}`,
      } : item.prizeImage ? {
        src: item.prizeImage,
        alt: `Premio ${item.prize ?? item.name}`,
      } : undefined}
      visual={{
        overline: "Premio visible",
        title: item.prize ?? "Premio por revelar",
        helper: "Dinámica lista para mover comunidad",
        tone: "gold",
      }}
    />
  );
}
