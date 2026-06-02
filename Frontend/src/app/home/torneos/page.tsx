import type { Metadata } from "next";
import { ShowcaseCard } from "@/components/content/user/shared";
import { getTournamentShowcaseProps, ProgressiveTournamentList } from "@/components/content/user/tournaments";
import { getLandingTournaments } from "@/lib/api/public-content";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";

const pageTitle = "Torneos de billar disponibles en Colombia";
const pageDescription = "Explora torneos de billar disponibles, revisa fechas, cupos e inscripción, y entra al detalle de cada competencia desde la agenda de Billar en Linea.";
const pageUrl = "/home/torneos";
const pageImage = getSocialShareImageUrl(siteConfig.socialImage);

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: pageUrl,
    siteName: siteConfig.name,
    title: pageTitle,
    description: pageDescription,
    images: [
      {
        url: pageImage,
        width: socialImageDimensions.width,
        height: socialImageDimensions.height,
        alt: "Torneos de billar disponibles en Billar en Linea",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [pageImage],
  },
};

export default async function HomeTorneosPage() {
  const tournaments = await getLandingTournaments();
  const firstTournaments = tournaments.items.slice(0, 2);
  const remainingTournaments = tournaments.items.slice(2);

  return (
    <main className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Torneos</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Torneos disponibles</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Revisa la agenda activa, consulta formatos y entra a cada torneo para conocer sus detalles y avanzar con tu participacion.
        </p>
      </section>

      {tournaments.items.length > 0 ? (
        <section className="grid gap-4">
          {firstTournaments.map((tournament) => (
            <ShowcaseCard key={tournament.id} {...getTournamentShowcaseProps(tournament, true)} />
          ))}
          <ProgressiveTournamentList tournaments={remainingTournaments} />
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-7 text-white/64">
          Todavia no hay torneos publicados. Vuelve pronto para ver nuevas fechas y cupos disponibles.
        </section>
      )}
    </main>
  );
}