import type { Metadata } from "next";
import { StoreCartPageContent } from "@/components/content/user/products/StoreCartPageContent";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";

const cartShareImage = getSocialShareImageUrl(siteConfig.socialImage);

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisa tu carrito, ajusta productos y completa el pago desde Billar en Linea.",
  alternates: {
    canonical: "/home/tienda/carrito",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/home/tienda/carrito",
    siteName: siteConfig.name,
    title: `Carrito | ${siteConfig.name}`,
    description: "Revisa tu carrito, ajusta productos y completa el pago desde Billar en Linea.",
    images: [
      {
        url: cartShareImage,
        width: socialImageDimensions.width,
        height: socialImageDimensions.height,
        alt: `Carrito | ${siteConfig.name}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Carrito | ${siteConfig.name}`,
    description: "Revisa tu carrito, ajusta productos y completa el pago desde Billar en Linea.",
    images: [cartShareImage],
  },
};

export default function StoreCartPage() {
  return <StoreCartPageContent />;
}
