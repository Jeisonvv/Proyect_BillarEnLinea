import type { Metadata } from "next";
import { ActivityCard } from "@/components/content/user/activities";
import { getLandingActivities } from "@/lib/api/public-content";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Actividades",
  description: "Consulta las actividades de billar activas, revisa premios, valor por número y fechas de sorteo dentro de Billar en Linea.",
  alternates: {
    canonical: "/home/activities",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/home/activities",
    siteName: siteConfig.name,
    title: `Actividades | ${siteConfig.name}`,
    description: "Consulta las actividades de billar activas, revisa premios, valor por número y fechas de sorteo dentro de Billar en Linea.",
    images: [
      {
        url: siteConfig.socialImage,
        width: 2000,
        height: 800,
        alt: `Actividades activas en ${siteConfig.name}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Actividades | ${siteConfig.name}`,
    description: "Consulta las actividades de billar activas, revisa premios, valor por número y fechas de sorteo dentro de Billar en Linea.",
    images: [siteConfig.socialImage],
  },
};

export default async function HomeActivitiesPage() {
  const activities = await getLandingActivities(50);

  return (
    <main className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Actividades</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Actividades activas y proximas</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Revisa los premios visibles, el valor por numero y la fecha del sorteo para que el cliente tenga una vista clara desde el sitio autenticado.
        </p>
      </section>

      {activities.items.length > 0 ? (
        <section className="grid gap-4">
          {activities.items.map((activity) => (
            <ActivityCard key={activity.id} item={activity} />
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-7 text-white/64">
          Todavia no hay actividades publicadas. Cuando aparezcan, esta vista quedara lista para mostrarlas.
        </section>
      )}
    </main>
  );
}