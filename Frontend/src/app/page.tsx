import type { Metadata } from "next";
import { HomeContent } from "@/components/landing/home-content";
import { getLandingSnapshot } from "@/lib/api/public-content";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const revalidate = 300;

const landingSocialImage = "/hero_portada.png";
const landingTitle = "Billar en Linea — Torneos, Eventos, Rifas y Tienda de Billar";
const landingDescription = "Participa en torneos de billar, sigue eventos, accede a rifas y compra accesorios. Todo en un solo lugar para la comunidad del billar en Colombia.";
const landingSocialTitle = "Billar en Linea | Torneos, eventos, rifas y tienda de billar";
const landingSocialDescription = "Participa en torneos de billar, sigue eventos, accede a rifas y compra accesorios. Todo en un solo lugar para la comunidad del billar en Colombia.";

export const metadata: Metadata = {
  title: landingTitle,
  description: landingDescription,
  keywords: [...siteConfig.keywords],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: landingSocialTitle,
    description: landingSocialDescription,
    url: "/",
    images: [
      {
        url: absoluteUrl(landingSocialImage),
        width: 2000,
        height: 800,
        alt: "Billar en Linea | Portada oficial",
      },
    ],
  },
  twitter: {
    title: landingSocialTitle,
    description: landingSocialDescription,
    images: [absoluteUrl(landingSocialImage)],
  },
};

export default async function Home() {
  const snapshot = await getLandingSnapshot();

  return <HomeContent snapshot={snapshot} />;
}
