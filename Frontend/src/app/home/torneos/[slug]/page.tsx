import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TournamentDetailView } from "@/components/content/user/tournaments";
import { getTournamentDetailBySlug } from "@/lib/api/public-content";
import { siteConfig } from "@/lib/site";

type TournamentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function buildTournamentDescription(tournament: NonNullable<Awaited<ReturnType<typeof getTournamentDetailBySlug>>>) {
  if (tournament.shortDescription) {
    return tournament.shortDescription;
  }

  if (tournament.description) {
    return tournament.description;
  }

  const locationParts = [tournament.city, tournament.country].filter(Boolean).join(", ");
  const venueLabel = tournament.venueName ?? locationParts;

  if (venueLabel) {
    return `Conoce todos los detalles de ${tournament.name}, un torneo de billar programado en ${venueLabel}.`;
  }

  return `Detalle del torneo ${tournament.name}.`;
}

function buildTournamentKeywords(tournament: NonNullable<Awaited<ReturnType<typeof getTournamentDetailBySlug>>>) {
  return Array.from(
    new Set(
      [
        ...siteConfig.keywords,
        tournament.name,
        tournament.format,
        tournament.city,
        tournament.country,
        tournament.venueName,
        ...tournament.tags,
        tournament.allowedCategories.join(" "),
      ].filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  );
}

export async function generateMetadata({ params }: TournamentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tournament = await getTournamentDetailBySlug(slug);

  if (!tournament) {
    return {
      title: "Torneo no encontrado",
      description: "No encontramos el torneo solicitado en Billar en Linea.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = buildTournamentDescription(tournament);
  const keywords = buildTournamentKeywords(tournament);
  const pageUrl = `/home/torneos/${tournament.slug}`;
  const imageUrl = tournament.image ?? siteConfig.socialImage;

  return {
    title: tournament.name,
    description,
    keywords,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: pageUrl,
      siteName: siteConfig.name,
      title: `${tournament.name} | ${siteConfig.name}`,
      description,
      images: [
        {
          url: imageUrl,
          width: 2000,
          height: 800,
          alt: `Imagen oficial de ${tournament.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${tournament.name} | ${siteConfig.name}`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function TournamentDetailPage({ params }: TournamentPageProps) {
  const { slug } = await params;
  const tournament = await getTournamentDetailBySlug(slug);

  if (!tournament) {
    notFound();
  }

  return <TournamentDetailView tournament={tournament} />;
}