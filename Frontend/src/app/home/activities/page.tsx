import type { Metadata } from "next";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";
import { ActivitiesBrowserPage } from "@/components/content/user/activities/ActivitiesBrowserPage";

const activitiesShareImage = getSocialShareImageUrl(siteConfig.socialImage);

export const metadata: Metadata = {
  title: "Actividades",
  description: "Consulta las actividades de billar activas, revisa premios, valor por número y fechas de sorteo dentro de Billar en Linea.",
  alternates: {
    canonical: "/home/activities",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/home/activities",
    siteName: siteConfig.name,
    title: `Actividades | ${siteConfig.name}`,
    description: "Consulta las actividades de billar activas, revisa premios, valor por número y fechas de sorteo dentro de Billar en Linea.",
    images: [
      {
        url: activitiesShareImage,
        width: socialImageDimensions.width,
        height: socialImageDimensions.height,
        alt: `Actividades activas en ${siteConfig.name}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Actividades | ${siteConfig.name}`,
    description: "Consulta las actividades de billar activas, revisa premios, valor por número y fechas de sorteo dentro de Billar en Linea.",
    images: [activitiesShareImage],
  },
};

export default async function HomeActivitiesPage() {
  return <ActivitiesBrowserPage />;
}