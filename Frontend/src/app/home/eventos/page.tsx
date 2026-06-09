import type { Metadata } from "next";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";
import { EventsBrowserPage } from "@/components/content/user/events/EventsBrowserPage";

const eventsShareImage = getSocialShareImageUrl(siteConfig.socialImage);

export const metadata: Metadata = {
  title: "Eventos",
  description: "Explora los eventos de billar visibles, revisa fechas, acceso y contexto de cada encuentro desde Billar en Linea.",
  alternates: {
    canonical: "/home/eventos",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/home/eventos",
    siteName: siteConfig.name,
    title: `Eventos | ${siteConfig.name}`,
    description: "Explora los eventos de billar visibles, revisa fechas, acceso y contexto de cada encuentro desde Billar en Linea.",
    images: [
      {
        url: eventsShareImage,
        width: socialImageDimensions.width,
        height: socialImageDimensions.height,
        alt: `Eventos disponibles en ${siteConfig.name}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Eventos | ${siteConfig.name}`,
    description: "Explora los eventos de billar visibles, revisa fechas, acceso y contexto de cada encuentro desde Billar en Linea.",
    images: [eventsShareImage],
  },
};

export default async function HomeEventosPage() {
  return <EventsBrowserPage />;
}
