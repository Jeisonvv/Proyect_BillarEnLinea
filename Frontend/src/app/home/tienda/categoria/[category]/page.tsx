import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  type ProductCategory,
} from "@/lib/api/admin-products";
import { getProductsByCategory } from "@/lib/api/public-content";
import { siteConfig } from "@/lib/site";

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

function formatMoney(value: number | null) {
  if (value === null) return "Consultar precio";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
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
    },
  };
}

export default async function TiendaCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const resolved = resolveCategory(category);
  if (!resolved) notFound();

  const products = await getProductsByCategory(resolved, 60);
  const label = PRODUCT_CATEGORY_LABELS[resolved];
  const description = CATEGORY_DESCRIPTIONS[resolved];

  return (
    <main className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/56">
          <Link href="/home/tienda" className="transition hover:text-white">← Tienda</Link>
          <span>/</span>
          <span className="text-white/82">{label}</span>
        </div>
        <p className="mt-3 text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Categoría</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{label}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">{description}</p>
        <p className="mt-2 text-sm text-white/56">
          {products.items.length} {products.items.length === 1 ? "producto disponible" : "productos disponibles"}
        </p>
      </section>

      {products.items.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.items.map((product) => {
            const href = `/home/tienda/${product.slug ?? product.id}`;
            return (
              <Link
                key={product.id}
                href={href}
                className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:border-[rgba(246,196,79,0.45)] hover:bg-white/8"
              >
                <div className="relative aspect-4/3 w-full overflow-hidden bg-black/40">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-white/46">
                      Sin imagen
                    </div>
                  )}
                  {product.stock !== null && product.stock <= 0 ? (
                    <span className="absolute right-3 top-3 rounded-full border border-rose-300/30 bg-rose-500/20 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-rose-100 backdrop-blur">
                      Agotado
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="text-base font-semibold text-white">{product.name}</p>
                  {product.brand ? (
                    <p className="text-xs uppercase tracking-[0.16em] text-white/52">{product.brand}</p>
                  ) : null}
                  {product.description ? (
                    <p className="line-clamp-2 text-sm text-white/64">{product.description}</p>
                  ) : null}
                  <p className="text-base font-semibold text-white/86">{formatMoney(product.basePrice)}</p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium text-[#f6c44f] transition group-hover:translate-x-1">
                    Ver producto →
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-7 text-white/64">
          Aún no hay productos en esta categoría. Vuelve pronto: estamos curando referencias para mostrarte aquí.
        </section>
      )}
    </main>
  );
}
