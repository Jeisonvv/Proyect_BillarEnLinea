import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActivityDetailView } from "@/components/content/user/activities";
import { getActivityDetailById, getActivityNumbers } from "@/lib/api/public-content";
import { getMyActivityNumbers } from "@/lib/api/public-content/activities";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";

type ActivityPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ActivityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const activity = await getActivityDetailById(slug);

  if (!activity) {
    return {
      title: "Actividad no encontrada",
      description: "No encontramos la actividad solicitada en Billar en Linea.",
      robots: { index: false, follow: false },
    };
  }

  const description =
    activity.seoDescription?.trim() ||
    activity.description?.trim() ||
    (activity.prize ? `Participa por ${activity.prize} en la actividad ${activity.name}.` : `Detalle de la actividad ${activity.name}.`);
  const title = activity.seoTitle?.trim() || activity.name;
  const pageSlug = activity.slug ?? activity.id;
  const pageUrl = `/home/activities/${pageSlug}`;
  const imageUrl = getSocialShareImageUrl(activity.image ?? activity.prizeImage ?? siteConfig.socialImage);

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
          width: socialImageDimensions.width,
          height: socialImageDimensions.height,
          alt: `Imagen de la actividad ${activity.name}`,
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

export default async function HomeActivityDetailPage({ params }: ActivityPageProps) {
  const { slug } = await params;
  const activity = await getActivityDetailById(slug);

  if (!activity) {
    notFound();
  }

  const isFreeActivity = activity.isFree === true || activity.ticketPrice === 0;
  const [numbersResponse, myNumbers] = await Promise.all([
    isFreeActivity ? Promise.resolve(null) : getActivityNumbers(activity.id, 1000),
    getMyActivityNumbers(activity.id),
  ]);

  return (
    <ActivityDetailView
      activity={activity}
      initialNumbers={numbersResponse?.numbers ?? []}
      myNumbers={myNumbers}
    />
  );
}
