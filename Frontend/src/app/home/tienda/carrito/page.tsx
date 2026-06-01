import type { Metadata } from "next";
import { StoreCartPageContent } from "@/components/content/user/products/StoreCartPageContent";
import { siteConfig } from "@/lib/site";

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
  },
};

export default function StoreCartPage() {
  return <StoreCartPageContent />;
}
