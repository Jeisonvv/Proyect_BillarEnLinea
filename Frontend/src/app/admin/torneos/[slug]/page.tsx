import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TournamentAdminDetail } from "@/components/content/admin/tournaments";
import { getTournamentDetailBySlug } from "@/lib/api/public-content";

export const metadata: Metadata = {
  title: "Administrar torneo",
  description: "Vista administrativa por torneo para actualizar contenido operativo e inscripciones.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminTournamentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tournament = await getTournamentDetailBySlug(slug);

  if (!tournament) {
    notFound();
  }

  return <TournamentAdminDetail initialTournament={tournament} />;
}