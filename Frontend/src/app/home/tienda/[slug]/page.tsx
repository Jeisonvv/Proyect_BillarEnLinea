import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailInteractiveView } from "@/components/content/user/products";
import { getProductDetailBySlug } from "@/lib/api/public-content";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetailBySlug(slug);
  if (!product) {
    return { title: "Producto no encontrado", robots: { index: false, follow: false } };
  }
  const description = product.description ?? `Producto ${product.name} disponible en la tienda Billar en Linea.`;
  const url = `/home/tienda/${product.slug ?? product.id}`;
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
      images: product.image
        ? [{ url: getSocialShareImageUrl(product.image), width: socialImageDimensions.width, height: socialImageDimensions.height }]
        : undefined,
    },
  };
}

export default async function PublicProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductDetailBySlug(slug);
  if (!product) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 md:px-8 md:py-16">
      <Link href="/home/tienda" className="text-sm text-white/62 transition hover:text-white">← Volver a tienda</Link>

      <ProductDetailInteractiveView
        product={{
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          basePrice: product.basePrice,
          stock: product.stock,
          description: product.description,
          images: product.images,
          variants: product.variants,
        }}
      />
    </main>
  );
}
