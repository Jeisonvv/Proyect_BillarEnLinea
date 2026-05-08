import type { Metadata } from "next";
import { ProductCard } from "@/components/content/user/products";
import { getLandingProducts } from "@/lib/api/public-content";

export const metadata: Metadata = {
  title: "Tienda",
};

export default async function HomeTiendaPage() {
  const products = await getLandingProducts(12);

  return (
    <main className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Tienda</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Catalogo para la comunidad</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Explora la seleccion visible de productos, precios base y disponibilidad aproximada para que el cliente entienda rapido la propuesta de la tienda.
        </p>
      </section>

      {products.items.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {products.items.map((product) => (
            <ProductCard key={product.id} item={product} />
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-7 text-white/64">
          Todavia no hay productos publicados. La tienda quedo lista para mostrarlos cuando aparezcan.
        </section>
      )}
    </main>
  );
}