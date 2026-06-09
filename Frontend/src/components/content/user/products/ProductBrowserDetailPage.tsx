"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductDetailInteractiveView } from "@/components/content/user/products";
import { getProductDetailBySlug } from "@/lib/api/public-content";

export function ProductBrowserDetailPage({ slug }: { slug: string }) {
  const [state, setState] = useState<{
    loading: boolean;
    product: Awaited<ReturnType<typeof getProductDetailBySlug>>;
  }>({ loading: true, product: null });

  useEffect(() => {
    let active = true;

    void getProductDetailBySlug(slug)
      .then((product) => {
        if (!active) return;
        setState({ loading: false, product });
      })
      .catch(() => {
        if (!active) return;
        setState({ loading: false, product: null });
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (state.loading) {
    return <main className="mx-auto w-full max-w-5xl px-5 py-12 md:px-8 md:py-16 text-sm text-white/62">Cargando producto...</main>;
  }

  if (!state.product) {
    return <main className="mx-auto w-full max-w-5xl px-5 py-12 md:px-8 md:py-16 text-sm text-white/62">No encontramos el producto solicitado.</main>;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 md:px-8 md:py-16">
      <Link href="/home/tienda" className="text-sm text-white/62 transition hover:text-white">← Volver a tienda</Link>
      <ProductDetailInteractiveView
        product={{
          id: state.product.id,
          name: state.product.name,
          brand: state.product.brand,
          category: state.product.category,
          basePrice: state.product.basePrice,
          stock: state.product.stock,
          description: state.product.description,
          images: state.product.images,
          variants: state.product.variants,
        }}
      />
    </main>
  );
}
