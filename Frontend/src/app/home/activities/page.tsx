import type { Metadata } from "next";
import { ActivityCard } from "@/components/content/user/activities";
import { getLandingActivities } from "@/lib/api/public-content";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";

const activitiesShareImage = getSocialShareImageUrl(siteConfig.socialImage);

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
        url: activitiesShareImage,
        width: socialImageDimensions.width,
        height: socialImageDimensions.height,
        alt: `Actividades activas en ${siteConfig.name}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Actividades | ${siteConfig.name}`,
    description: "Consulta las actividades de billar activas, revisa premios, valor por número y fechas de sorteo dentro de Billar en Linea.",
    images: [activitiesShareImage],
  },
};

export default async function HomeActivitiesPage() {
  const activities = await getLandingActivities(50);

  return (
    <main className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Actividades</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Accede a las Mejores Oportunidades en Equipamiento de Billar Profesional</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Te damos la bienvenida a nuestra actividad especial, un espacio creado para que los apasionados de las tres bandas aprovechen las mejores oportunidades de adquirir equipo de élite. Nuestra misión es facilitar que cada jugador tenga en sus manos herramientas de calidad mundial mediante dinámicas transparentes y directas.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
        Aprovecha cada actividad vigente para renovar tu taco, mejorar tus accesorios y formar parte de una comunidad que valora la excelencia técnica. Desde tu panel de usuario, tendrás una vista clara y detallada de los incentivos disponibles, el valor de participación y las fechas clave para la entrega de resultados
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