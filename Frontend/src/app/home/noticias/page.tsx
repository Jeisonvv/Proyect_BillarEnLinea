import type { Metadata } from "next";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";
import { PostsBrowserPage } from "@/components/content/user/posts/PostsBrowserPage";

const newsShareImage = getSocialShareImageUrl(siteConfig.socialImage);

export const metadata: Metadata = {
  title: "Noticias",
  description: "Sigue las noticias y novedades del billar, con publicaciones recientes, anuncios y contexto editorial dentro de Billar en Linea.",
  alternates: {
    canonical: "/home/noticias",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/home/noticias",
    siteName: siteConfig.name,
    title: `Noticias | ${siteConfig.name}`,
    description: "Sigue las noticias y novedades del billar, con publicaciones recientes, anuncios y contexto editorial dentro de Billar en Linea.",
    images: [
      {
        url: newsShareImage,
        width: socialImageDimensions.width,
        height: socialImageDimensions.height,
        alt: `Noticias de billar en ${siteConfig.name}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Noticias | ${siteConfig.name}`,
    description: "Sigue las noticias y novedades del billar, con publicaciones recientes, anuncios y contexto editorial dentro de Billar en Linea.",
    images: [newsShareImage],
  },
};

export default async function HomeNoticiasPage() {
  return <PostsBrowserPage />;
}