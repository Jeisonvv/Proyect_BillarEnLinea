import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetailView } from "@/components/content/user/events";
import { getEventDetailBySlug } from "@/lib/api/public-content";
import { siteConfig } from "@/lib/site";

type EventPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function buildEventDescription(event: NonNullable<Awaited<ReturnType<typeof getEventDetailBySlug>>>) {
  if (event.description) {
    return event.description;
  }

  const locationParts = [event.city, event.country].filter(Boolean).join(", ");
  if (locationParts) {
    return `Conoce todos los detalles de ${event.name}, un evento de billar programado en ${locationParts}.`;
  }

  return `Detalle del evento ${event.name}.`;
}

function buildEventKeywords(event: NonNullable<Awaited<ReturnType<typeof getEventDetailBySlug>>>) {
  const seoTitleKeywords = (event.seoTitle ?? "")
    .split(/[|,]/)
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(
    new Set(
      [
        ...seoTitleKeywords,
        ...siteConfig.keywords,
        event.name,
        event.type,
        event.tier,
        event.city,
        event.department,
        event.country,
        event.organizer,
      ].filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  );
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventDetailBySlug(slug);

  if (!event) {
    return {
      title: "Evento no encontrado",
      description: "No encontramos el evento solicitado en Billar en Linea.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = event.seoTitle?.trim() || event.name;
  const description = event.seoDescription?.trim() || buildEventDescription(event);
  const keywords = buildEventKeywords(event);
  const pageUrl = `/home/eventos/${event.slug}`;
  const imageUrl = event.image ?? siteConfig.socialImage;

  return {
    title,
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
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [
        {
          url: imageUrl,
          width: 2000,
          height: 800,
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
  const event = await getEventDetailBySlug(slug);

  if (!event) {
    notFound();
  }

  return <EventDetailView event={event} />;
}