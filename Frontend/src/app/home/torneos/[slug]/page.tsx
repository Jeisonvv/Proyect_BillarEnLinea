import type { Metadata } from "next";
import { getTournamentDetailBySlug } from "@/lib/api/public-content";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";
import { TournamentBrowserDetailPage } from "@/components/content/user/tournaments/TournamentBrowserDetailPage";

type TournamentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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
  const slugLabel = buildSlugFallbackText(slug);

  const title = tournament?.seoTitle?.trim() || tournament?.name || `${slugLabel} | ${siteConfig.name}`;
  const description = tournament?.seoDescription?.trim() || tournament?.shortDescription?.trim() || tournament?.description?.trim() || `Conoce la información del torneo ${slugLabel} en ${siteConfig.name}.`;
  const canonicalUrl = tournament?.slug ? `/home/torneos/${tournament.slug}` : pageUrl;
  const imageUrl = getSocialShareImageUrl(tournament?.image ?? siteConfig.socialImage);

  return {
    title,
    description,
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
          alt: `Imagen oficial de ${title}`,
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
  return <TournamentBrowserDetailPage slug={slug} />;
}
