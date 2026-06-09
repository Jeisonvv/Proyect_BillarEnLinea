import type { Metadata } from "next";
import { getEventDetailBySlug } from "@/lib/api/public-content";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";
import { EventBrowserDetailPage } from "@/components/content/user/events/EventBrowserDetailPage";

type EventPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function buildSlugFallbackText(slug: string) {
  const normalized = slug.trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return "Evento";
  return normalized.split(" ").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventDetailBySlug(slug);
  const slugLabel = buildSlugFallbackText(slug);

  if (!event) {
    return {
      title: `${slugLabel} | ${siteConfig.name}`,
      description: `Conoce la información del evento ${slugLabel} en ${siteConfig.name}.`,
      alternates: { canonical: `/home/eventos/${slug}` },
    };
  }

  const title = event.seoTitle?.trim() || event.name;
  const description = event.seoDescription?.trim() || event.description?.trim() || `Conoce los detalles del evento ${event.name} en ${siteConfig.name}.`;
  const pageUrl = `/home/eventos/${event.slug ?? slug}`;
  const imageUrl = getSocialShareImageUrl(event.image ?? siteConfig.socialImage);

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: pageUrl,
      siteName: siteConfig.name,
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [
        {
          url: imageUrl,
          width: socialImageDimensions.width,
          height: socialImageDimensions.height,
          alt: `Imagen oficial de ${event.name}`,
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

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
  return <EventBrowserDetailPage slug={slug} />;
}
