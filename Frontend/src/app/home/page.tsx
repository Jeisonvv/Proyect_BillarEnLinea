import type { Metadata } from "next";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";
import { HomeBrowserPage } from "@/components/content/user/home/HomeBrowserPage";

const homeSocialImage = "/hero_portada.png";
const homeShareImage = getSocialShareImageUrl(homeSocialImage);

export const metadata: Metadata = {
  title: "Inicio",
  description: "Panel principal con torneos, actividades, eventos, noticias y tienda para usuarios autenticados.",
  alternates: {
    canonical: "/home",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/home",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Inicio`,
    description: "Panel principal con torneos, actividades, eventos, noticias y tienda para usuarios autenticados.",
    images: [
      {
        url: homeShareImage,
        width: socialImageDimensions.width,
        height: socialImageDimensions.height,
        alt: `${siteConfig.name} | Inicio`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Inicio`,
    description: "Panel principal con torneos, actividades, eventos, noticias y tienda para usuarios autenticados.",
    images: [homeShareImage],
  },
};

export default async function PageHome() {
  return <HomeBrowserPage />;
}