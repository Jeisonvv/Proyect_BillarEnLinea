import { ReactNode } from "react";
import { HomeSiteShell } from "@/components/navigation/HomeSiteShell";
import { requireAdminServerSession } from "@/lib/auth/server-session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminServerSession({ redirectTo: "/login", unauthorizedRedirectTo: "/home" });

  return <HomeSiteShell canAccessAdmin mode="admin">{children}</HomeSiteShell>;
}