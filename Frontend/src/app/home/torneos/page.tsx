import type { Metadata } from "next";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";
import { TournamentsBrowserPage } from "@/components/content/user/tournaments/TournamentsBrowserPage";

const pageTitle = "Torneos de billar disponibles en Colombia";
const pageDescription = "Explora torneos de billar disponibles, revisa fechas, cupos e inscripción, y entra al detalle de cada competencia desde la agenda de Billar en Linea.";
const pageUrl = "/home/torneos";
const pageImage = getSocialShareImageUrl(siteConfig.socialImage);

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: pageUrl,
    siteName: siteConfig.name,
    title: pageTitle,
    description: pageDescription,
    images: [
      {
        url: pageImage,
        width: socialImageDimensions.width,
        height: socialImageDimensions.height,
        alt: "Torneos de billar disponibles en Billar en Linea",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [pageImage],
  },
};

export default async function HomeTorneosPage() {
  return <TournamentsBrowserPage />;
}