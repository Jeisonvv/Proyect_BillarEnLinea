import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TournamentDetailView } from "@/components/content/user/tournaments";
import { getTournamentDetailBySlug } from "@/lib/api/public-content";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";

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
  const seoTitleKeywords = (tournament.seoTitle ?? "")
    .split(/[|,]/)
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(
    new Set(
      [
        ...tournament.tags,
        ...seoTitleKeywords,
        ...siteConfig.keywords,
        tournament.name,
        tournament.format,
        tournament.city,
        tournament.country,
        tournament.venueName,
        tournament.allowedCategories.join(" "),
      ].filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  );
}

function buildSlugFallbackText(slug: string) {
  const normalized = slug
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "Torneo";
  }

  return normalized
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: TournamentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tournament = await getTournamentDetailBySlug(slug);
  const pageUrl = `/home/torneos/${slug}`;

  if (!tournament) {
    const slugLabel = buildSlugFallbackText(slug);
    const fallbackTitle = `${slugLabel} | ${siteConfig.name}`;
    const fallbackDescription = `Conoce la información del torneo ${slugLabel} en ${siteConfig.name}.`;
    const fallbackImage = getSocialShareImageUrl(siteConfig.socialImage);

    return {
      title: fallbackTitle,
      description: fallbackDescription,
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        type: "website",
        locale: siteConfig.locale,
        url: pageUrl,
        siteName: siteConfig.name,
        title: fallbackTitle,
        description: fallbackDescription,
        images: [
          {
            url: fallbackImage,
            width: socialImageDimensions.width,
            height: socialImageDimensions.height,
            alt: `Portada de ${siteConfig.name}`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: fallbackTitle,
        description: fallbackDescription,
        images: [fallbackImage],
      },
    };
  }

  const title = tournament.seoTitle?.trim() || tournament.name;
  const description = tournament.seoDescription?.trim() || buildTournamentDescription(tournament);
  const keywords = buildTournamentKeywords(tournament);
  const canonicalUrl = `/home/torneos/${tournament.slug}`;
  const imageUrl = getSocialShareImageUrl(tournament.image ?? siteConfig.socialImage);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: canonicalUrl,
      siteName: siteConfig.name,
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [
        {
          url: imageUrl,
          width: socialImageDimensions.width,
          height: socialImageDimensions.height,
          alt: `Imagen oficial de ${tournament.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
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