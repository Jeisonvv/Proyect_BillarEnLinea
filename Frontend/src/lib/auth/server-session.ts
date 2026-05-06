import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthenticatedUser } from "@/lib/api/auth";

type AuthCookie = {
  cookieName: string;
  value: string;
};

type ServerSession = {
  authCookie: AuthCookie;
  user: AuthenticatedUser;
};

const AUTH_COOKIE_NAMES = ["billar_auth", "auth_token"];
const ADMIN_ROLES = new Set(["ADMIN", "STAFF"]);

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
}

async function getAuthCookie(): Promise<AuthCookie | null> {
  const cookieStore = await cookies();

  return AUTH_COOKIE_NAMES
    .map((cookieName) => ({ cookieName, value: cookieStore.get(cookieName)?.value ?? null }))
    .find((entry): entry is AuthCookie => typeof entry.value === "string" && entry.value.length > 0) ?? null;
}

export function canAccessAdmin(role?: string | null) {
  return typeof role === "string" && ADMIN_ROLES.has(role);
}

export async function getServerSession(): Promise<ServerSession | null> {
  const authCookie = await getAuthCookie();

  if (!authCookie) {
    return null;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
      headers: {
        Cookie: `${authCookie.cookieName}=${authCookie.value}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const session = await response.json();

    return {
      authCookie,
      user: {
        id: session.user?.id,
        name: session.user?.name,
        email: session.user?.email,
        role: session.user?.role,
      },
    };
  } catch {
    return null;
  }
}

export async function requireServerSession(redirectTo = "/login") {
  const session = await getServerSession();

  if (!session) {
    redirect(redirectTo);
  }

  return session;
}

export async function requireAdminServerSession(options?: {
  redirectTo?: string;
  unauthorizedRedirectTo?: string;
}) {
  const redirectTo = options?.redirectTo ?? "/login";
  const unauthorizedRedirectTo = options?.unauthorizedRedirectTo ?? "/home";
  const session = await requireServerSession(redirectTo);

  if (!canAccessAdmin(session.user.role)) {
    redirect(unauthorizedRedirectTo);
  }

  return session;
}
