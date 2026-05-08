import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventAdminDetail } from "@/components/content/admin/events";
import { getEventDetailBySlug } from "@/lib/api/public-content";

export const metadata: Metadata = {
  title: "Administrar evento",
  description: "Vista administrativa por evento para ajustar programación y visibilidad.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminEventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventDetailBySlug(slug);

  if (!event) {
    notFound();
  }

  return <EventAdminDetail initialEvent={event} />;
}