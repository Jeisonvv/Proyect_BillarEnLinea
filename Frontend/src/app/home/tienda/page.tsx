import type { Metadata } from "next";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";
import { StoreBrowserPage } from "@/components/content/user/products/StoreBrowserPage";

const storeShareImage = getSocialShareImageUrl(siteConfig.socialImage);

export const metadata: Metadata = {
  title: "Tienda",
  description: "Explora la tienda de billar, consulta productos visibles, precios y referencias destacadas desde Billar en Linea.",
  alternates: {
    canonical: "/home/tienda",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/home/tienda",
    siteName: siteConfig.name,
    title: `Tienda | ${siteConfig.name}`,
    description: "Explora la tienda de billar, consulta productos visibles, precios y referencias destacadas desde Billar en Linea.",
    images: [
      {
        url: storeShareImage,
        width: socialImageDimensions.width,
        height: socialImageDimensions.height,
        alt: `Tienda de billar en ${siteConfig.name}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Tienda | ${siteConfig.name}`,
    description: "Explora la tienda de billar, consulta productos visibles, precios y referencias destacadas desde Billar en Linea.",
    images: [storeShareImage],
  },
};

export default async function HomeTiendaPage() {
  return <StoreBrowserPage />;
}
