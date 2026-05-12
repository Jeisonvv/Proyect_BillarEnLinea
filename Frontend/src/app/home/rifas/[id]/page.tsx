import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RaffleDetailView } from "@/components/content/user/raffles";
import { getRaffleDetailById, getRaffleNumbers } from "@/lib/api/public-content";
import { getMyRaffleNumbers } from "@/lib/api/public-content/raffles";
import { siteConfig } from "@/lib/site";

type RafflePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: RafflePageProps): Promise<Metadata> {
  const { id } = await params;
  const raffle = await getRaffleDetailById(id);

  if (!raffle) {
    return {
      title: "Rifa no encontrada",
      description: "No encontramos la rifa solicitada en Billar en Linea.",
      robots: { index: false, follow: false },
    };
  }

  const description =
    raffle.seoDescription?.trim() ||
    raffle.description?.trim() ||
    (raffle.prize ? `Participa por ${raffle.prize} en la rifa ${raffle.name}.` : `Detalle de la rifa ${raffle.name}.`);
  const title = raffle.seoTitle?.trim() || raffle.name;
  const pageSlug = raffle.slug ?? raffle.id;
  const pageUrl = `/home/rifas/${pageSlug}`;
  const imageUrl = raffle.image ?? raffle.prizeImage ?? siteConfig.socialImage;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: pageUrl,
      siteName: siteConfig.name,
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [
        {
          url: imageUrl,
          width: 2000,
          height: 800,
          alt: `Imagen de la rifa ${raffle.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function HomeRaffleDetailPage({ params }: RafflePageProps) {
  const { id } = await params;
  const raffle = await getRaffleDetailById(id);

  if (!raffle) {
    notFound();
  }

  const isFreeRaffle = raffle.isFree === true || raffle.ticketPrice === 0;
  const [numbersResponse, myNumbers] = await Promise.all([
    isFreeRaffle ? Promise.resolve(null) : getRaffleNumbers(id, 1000),
    getMyRaffleNumbers(id),
  ]);

  return (
    <RaffleDetailView
      raffle={raffle}
      initialNumbers={numbersResponse?.numbers ?? []}
      myNumbers={myNumbers}
    />
  );
}
