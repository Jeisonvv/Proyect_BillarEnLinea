import type { Metadata } from "next";
import { getProductDetailBySlug } from "@/lib/api/public-content";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";
import { ProductBrowserDetailPage } from "@/components/content/user/products/ProductBrowserDetailPage";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetailBySlug(slug);

  if (!product) {
    return { title: "Producto no encontrado", robots: { index: false, follow: false } };
  }

  const description = product.description ?? `Producto ${product.name} disponible en la tienda ${siteConfig.name}.`;
  const url = `/home/tienda/${product.slug ?? product.id}`;
  const shareImage = getSocialShareImageUrl(product.image ?? siteConfig.socialImage);

  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      title: product.name,
      description,
      images: [{ url: shareImage, width: socialImageDimensions.width, height: socialImageDimensions.height }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [shareImage],
    },
  };
}

export default async function PublicProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductBrowserDetailPage slug={slug} />;
}
