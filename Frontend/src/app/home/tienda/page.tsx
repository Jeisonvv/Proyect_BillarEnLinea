import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tienda",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HomeTiendaPage() {
  return (
    <main className="grid gap-6">
      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Tienda</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Estas en la tienda</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Esta vista se creo para validar la navegacion interna del home y el cambio visual del layout autenticado.
        </p>
      </section>
    </main>
  );
}