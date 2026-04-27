import type { Metadata } from "next";
import { HomeContent } from "@/components/landing/home-content";
import { getLandingSnapshot } from "@/lib/api/public-content";
import { siteConfig } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "billar en linea ",
  description:
    "Descubre la portada oficial de Billar en Linea con torneos, eventos, sorteos activos, noticias relevantes del billar y una tienda especializada.",
  keywords: [...siteConfig.keywords],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Billar en Linea | Torneos, eventos, noticias y tienda de billar",
    description:
      "Una landing profesional para mostrar servicios, agenda activa, noticias y tienda especializada alrededor del billar.",
    url: "/",
    images: [
      {
        url: siteConfig.socialImage,
        width: 2000,
        height: 800,
        alt: "Billar en Linea | Portada oficial",
      },
    ],
  },
  twitter: {
    title: "Billar en Linea | Torneos, eventos, noticias y tienda de billar",
    description:
      "Plataforma para descubrir torneos, eventos, sorteos, noticias y productos del mundo del billar.",
    images: [siteConfig.socialImage],
  },
};

export default async function Home() {
  const snapshot = await getLandingSnapshot();

  return <HomeContent snapshot={snapshot} />;
}
