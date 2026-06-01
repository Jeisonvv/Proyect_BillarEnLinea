import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductDetailBySlug } from "@/lib/api/public-content";
import { siteConfig } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

function formatMoney(value: number | null) {
  if (value === null) return "Consultar precio";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

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
      images: product.image ? [{ url: product.image }] : undefined,
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

      <div className="mt-6 grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <section className="grid gap-3">
          {product.images.length > 0 ? (
            <>
              <div className="overflow-hidden rounded-3xl border border-white/8 bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.images[0]} alt={product.name} className="h-105 w-full object-cover" />
              </div>
              {product.images.length > 1 ? (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1, 5).map((url, idx) => (
                    <div key={url + idx} className="overflow-hidden rounded-2xl border border-white/8 bg-black/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`${product.name} ${idx + 2}`} className="h-24 w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex h-105 items-center justify-center rounded-3xl border border-white/8 bg-black/30 text-white/46">
              Sin imagen
            </div>
          )}
        </section>

        <section className="grid content-start gap-4">
          {product.category ? (
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">{product.category}</p>
          ) : null}
          <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">{product.name}</h1>
          {product.brand ? (
            <p className="text-sm uppercase tracking-[0.18em] text-white/56">Marca: {product.brand}</p>
          ) : null}
          <p className="text-2xl font-semibold text-white">{formatMoney(product.basePrice)}</p>
          {product.stock !== null ? (
            <p className="text-sm text-white/62">
              {product.stock > 0 ? `${product.stock} disponibles en inventario.` : "Sin stock disponible."}
            </p>
          ) : null}
          {product.description ? (
            <p className="text-sm leading-7 text-white/78">{product.description}</p>
          ) : null}
          
        </section>
      </div>
    </main>
  );
}
