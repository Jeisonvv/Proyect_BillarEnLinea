import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS, type ProductCategory } from "@/lib/api/admin-products";
import { getLandingProducts } from "@/lib/api/public-content";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";

const storeShareImage = getSocialShareImageUrl(siteConfig.socialImage);

const CATEGORY_DESCRIPTIONS: Record<ProductCategory, string> = {
  CUE: "Tacos profesionales y de iniciación.",
  BALL: "Sets de bolas para todas las modalidades.",
  TABLE: "Mesas para hogar y competencia.",
  ACCESSORY: "Tizas, guantes, puentes y más.",
  CLOTHING: "Ropa deportiva y casual de billar.",
  OTHER: "Otros productos del catálogo.",
};

function formatMoney(value: number | null) {
  if (value === null) return "Consultar precio";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

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
  const products = await getLandingProducts(60);

  const featuredByCategory = new Map<ProductCategory, (typeof products.items)[number]>();
  for (const product of products.items) {
    const cat = (product.category ?? "").toUpperCase() as ProductCategory;
    if (PRODUCT_CATEGORIES.includes(cat) && !featuredByCategory.has(cat)) {
      featuredByCategory.set(cat, product);
    }
  }

  const categoriesWithProducts = PRODUCT_CATEGORIES.filter((category) => featuredByCategory.has(category));

  return (
    <main className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Tienda</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Catálogo para la comunidad</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Explora la selección visible de productos por categoría. Cada tarjeta muestra una referencia destacada para que el cliente entienda rápido la propuesta de la tienda.
        </p>
      </section>

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Por categoría</h2>
          <span className="text-sm text-white/56">{categoriesWithProducts.length} categorías disponibles</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoriesWithProducts.map((category) => {
            const featured = featuredByCategory.get(category);
            const label = PRODUCT_CATEGORY_LABELS[category];
            const description = CATEGORY_DESCRIPTIONS[category];
            const href = `/home/tienda/categoria/${category.toLowerCase()}`;

            return (
              <Link
                key={category}
                href={href}
                className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:border-[rgba(246,196,79,0.45)] hover:bg-white/8"
              >
                <div className="relative aspect-4/3 w-full overflow-hidden bg-black/40">
                  {featured?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.image}
                      alt={featured.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-white/46">
                      Sin referencia aún
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full border border-[rgba(246,196,79,0.32)] bg-[rgba(0,0,0,0.55)] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#f6c44f] backdrop-blur">
                    {label}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="text-[0.7rem] uppercase tracking-[0.18em] text-white/48">{description}</p>
                  {featured ? (
                    <>
                      <p className="text-base font-semibold text-white">{featured.name}</p>
                      {featured.brand ? (
                        <p className="text-xs uppercase tracking-[0.16em] text-white/52">{featured.brand}</p>
                      ) : null}
                      <p className="text-sm font-semibold text-white/86">{formatMoney(featured.basePrice)}</p>
                    </>
                  ) : (
                    <p className="text-sm text-white/56">Pronto agregaremos productos en esta categoría.</p>
                  )}
                  <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium text-[#f6c44f] transition group-hover:translate-x-1">
                    Ver categoría →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}