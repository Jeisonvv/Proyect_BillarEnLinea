import { ReactNode } from "react";
import { HomeSiteShell } from "@/components/navigation/HomeSiteShell";
import { canAccessAdmin, requireServerSession } from "@/lib/auth/server-session";

export default async function HomeLayout({ children }: { children: ReactNode }) {
  const session = await requireServerSession("/login");

  return <HomeSiteShell canAccessAdmin={canAccessAdmin(session.user.role)} mode="user">{children}</HomeSiteShell>;
}
