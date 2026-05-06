import type { Metadata } from "next";
import { TournamentCreateLab } from "@/components/content/admin/tournaments";

export const metadata: Metadata = {
  title: "Crear torneo",
  description: "Laboratorio interno para subir una imagen a Cloudinary y crear un torneo usando el backend real desde el contexto administrativo.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminCreateTournamentPage() {
  return <TournamentCreateLab />;
}
