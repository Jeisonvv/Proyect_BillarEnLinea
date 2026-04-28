import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAMES = ["billar_auth", "auth_token"];

function getAuthToken(request: NextRequest) {
  for (const cookieName of AUTH_COOKIE_NAMES) {
    const token = request.cookies.get(cookieName)?.value;
    if (token) {
      return token;
    }
  }

  return null;
}

export function middleware(request: NextRequest) {
  const authToken = getAuthToken(request);
  const protectedPaths = ["/home", "/dashboard"];
  const { pathname } = request.nextUrl;

  // Si la ruta es protegida y no hay token, redirige a login
  if (protectedPaths.some((path) => pathname.startsWith(path)) && !authToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si está autenticado o la ruta no es protegida, sigue normalmente
  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/dashboard/:path*"]
};
