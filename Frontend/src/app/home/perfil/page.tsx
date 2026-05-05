import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HomePerfilPage() {
  return (
    <main className="grid gap-6">
      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Perfil</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Estas en perfil</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Esta ruta queda lista como base para que el usuario pueda ver y modificar sus datos mas adelante.
        </p>
      </section>
    </main>
  );
}