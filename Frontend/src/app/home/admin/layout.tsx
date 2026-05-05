import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

const AUTH_COOKIE_NAMES = ["billar_auth", "auth_token"];
const ADMIN_ROLES = new Set(["ADMIN", "STAFF"]);

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const authCookie = AUTH_COOKIE_NAMES
    .map((cookieName) => ({ cookieName, value: cookieStore.get(cookieName)?.value ?? null }))
    .find((entry) => entry.value);

  if (!authCookie?.value) {
    redirect("/login");
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001"}/api/auth/me`,
      {
        headers: {
          Cookie: `${authCookie.cookieName}=${authCookie.value}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      redirect("/home");
    }

    const session = await response.json();
    const userRole = session.user?.role;

    if (!ADMIN_ROLES.has(userRole)) {
      redirect("/home");
    }
  } catch {
    redirect("/home");
  }

  return children;
}