import type { Metadata } from "next";
import { TournamentCreateLab } from "@/components/content/TournamentCreateLab";

export const metadata: Metadata = {
  title: "Crear torneo de prueba",
  description: "Laboratorio interno para subir una imagen a Cloudinary y crear un torneo usando el backend real.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CreateTournamentPage() {
  return <TournamentCreateLab />;
}