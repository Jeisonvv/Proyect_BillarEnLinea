import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard administrativo",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HomeAdminPage() {
  return (
    <main className="grid gap-6">
      <section className="rounded-[1.5rem] border border-[rgba(246,196,79,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Estas en el dashboard administrativo</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Esta carpeta queda lista como base para crear las rutas administrativas protegidas por rol.
        </p>
      </section>
    </main>
  );
}