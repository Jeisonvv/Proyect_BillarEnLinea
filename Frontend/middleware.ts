import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth_token")?.value;
  const protectedPaths = ["/home", "/dashboard"];
  const { pathname } = request.nextUrl;

  // Si la ruta es protegida y no hay token, redirige a login
  if (protectedPaths.some((path) => pathname.startsWith(path)) && !authToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Si está autenticado o la ruta no es protegida, sigue normalmente
  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/dashboard/:path*"]
};
