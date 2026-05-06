import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Redirigiendo a crear torneo",
  description: "Redirección a la nueva ruta administrativa de creación de torneos.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CreateTournamentPage() {
  redirect("/admin/torneos/crear");
}