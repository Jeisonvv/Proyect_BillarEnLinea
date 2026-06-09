import type { Metadata } from "next";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  type ProductCategory,
} from "@/lib/api/admin-products";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";
import { ProductCategoryBrowserPage } from "@/components/content/user/products/ProductCategoryBrowserPage";

const CATEGORY_DESCRIPTIONS: Record<ProductCategory, string> = {
  CUE: "Tacos profesionales y de iniciación.",
  BALL: "Sets de bolas para todas las modalidades.",
  TABLE: "Mesas para hogar y competencia.",
  ACCESSORY: "Tizas, guantes, puentes y más.",
  CLOTHING: "Ropa deportiva y casual de billar.",
  OTHER: "Otros productos del catálogo.",
};

type PageProps = { params: Promise<{ category: string }> };

function resolveCategory(value: string): ProductCategory | null {
  const upper = value.toUpperCase() as ProductCategory;
  return PRODUCT_CATEGORIES.includes(upper) ? upper : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const resolved = resolveCategory(category);
  if (!resolved) {
    return { title: "Categoría no encontrada", robots: { index: false, follow: false } };
  }
  const label = PRODUCT_CATEGORY_LABELS[resolved];
  const description = CATEGORY_DESCRIPTIONS[resolved];
  const url = `/home/tienda/categoria/${category.toLowerCase()}`;
  const shareImage = getSocialShareImageUrl(siteConfig.socialImage);

  return {
    title: `${label} | Tienda`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      title: `${label} | Tienda ${siteConfig.name}`,
      description,
      images: [
        {
          url: shareImage,
          width: socialImageDimensions.width,
          height: socialImageDimensions.height,
          alt: `${label} | ${siteConfig.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${label} | Tienda ${siteConfig.name}`,
      description,
      images: [shareImage],
    },
  };
}

export default async function TiendaCategoryPage({ params }: PageProps) {
  const { category } = await params;
  return <ProductCategoryBrowserPage category={category} />;
}
