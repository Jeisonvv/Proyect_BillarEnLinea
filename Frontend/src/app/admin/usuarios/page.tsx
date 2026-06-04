import type { Metadata } from "next";
import { UsersAdminPanel } from "@/components/content/admin/users";

export const metadata: Metadata = {
  title: "Administrar usuarios",
  description: "Tabla administrativa para revisar y actualizar usuarios del sistema.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminUsersPage() {
  return <UsersAdminPanel />;
}
