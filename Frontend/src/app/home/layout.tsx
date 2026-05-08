import { ReactNode } from "react";
import { HomeSiteShell } from "@/components/navigation/HomeSiteShell";
import { canAccessAdmin, getServerSession } from "@/lib/auth/server-session";

export default async function HomeLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  return (
    <HomeSiteShell
      canAccessAdmin={canAccessAdmin(session?.user.role)}
      isAuthenticated={Boolean(session)}
      mode="user"
    >
      {children}
    </HomeSiteShell>
  );
}
