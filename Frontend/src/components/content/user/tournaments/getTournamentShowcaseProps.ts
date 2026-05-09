import type { LandingTournament } from "@/lib/api/public-content";
import type { ShowcaseCardProps } from "../shared";
import { formatDate, formatMoney, humanizeToken } from "../shared/utils";

function getStatusBadgeTone(status: LandingTournament["status"]): NonNullable<ShowcaseCardProps["badge"]>["tone"] {
  switch (status) {
    case "OPEN":
      return "open";
    case "CLOSED":
      return "amber";
    case "IN_PROGRESS":
      return "sky";
    case "FINISHED":
      return "slate";
    case "CANCELLED":
      return "rose";
    default:
      return "neutral";
  }
}

export function getTournamentShowcaseProps(item: LandingTournament, prioritizeImage = false): ShowcaseCardProps {
  const statusLabel = humanizeToken(item.status);
  const seatsLabel = item.maxParticipants !== null
    ? `${Math.max(item.maxParticipants - (item.currentParticipants ?? 0), 0)} cupos disponibles`
    : "Cupos por confirmar";

  return {
    badge: { label: statusLabel, tone: getStatusBadgeTone(item.status) },
    ctaLabel: "Ver torneo",
    description: "",
    eyebrow: "Circuito Billar En Linea",
    href: `/home/torneos/${item.slug}`,
    image: item.image ? {
      src: item.image,
      alt: `Imagen del torneo ${item.name}`,
      fetchPriority: prioritizeImage ? "high" : "auto",
      loading: prioritizeImage ? "eager" : "lazy",
      prioritize: prioritizeImage,
      quality: prioritizeImage ? 68 : 62,
      sizes: "(min-width: 1536px) 470px, (min-width: 1280px) 44vw, (min-width: 768px) 50vw, 100vw",
    } : undefined,
    metrics: [
      { label: "Fecha", value: formatDate(item.startDate) },
      { label: "Inscripción", value: formatMoney(item.entryFee) },
      { label: "Cupos", value: seatsLabel },
    ],
    secondaryBadge: item.image ? "Play" : "Sin foto",
    title: item.name,
    visual: {
      overline: "Torneo destacado",
      title: "",
      tone: "gold",
    },
  };
}