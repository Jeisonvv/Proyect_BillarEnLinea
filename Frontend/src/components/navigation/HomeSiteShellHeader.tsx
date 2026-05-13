"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { logoutWeb } from "@/lib/api/auth";

const userNavItems = [
  { label: "Inicio", href: "/home" },
  { label: "Torneos", href: "/home/torneos" },
  { label: "Eventos", href: "/home/eventos" },
  { label: "Actividades", href: "/home/activities" },
  { label: "Tienda", href: "/home/tienda" },
  { label: "Noticias", href: "/home/noticias" },
  { label: "Perfil", href: "/home/perfil" },
] as const;

const adminNavItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Torneos", href: "/admin/torneos" },
  { label: "Eventos", href: "/admin/eventos" },
  { label: "Actividades", href: "/admin/activities" },
  { label: "Tienda", href: "/admin/tienda" },
  { label: "Noticias", href: "/admin/noticias" },
] as const;

function isActiveLink(pathname: string, href: string) {
  if (href === "/home") {
    return pathname === "/home";
  }

  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname.startsWith(href);
}

export function HomeSiteShellHeader({
  canAccessAdmin = false,
  isAuthenticated = true,
  mode = "user",
}: {
  canAccessAdmin?: boolean;
  isAuthenticated?: boolean;
  mode?: "user" | "admin";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isAdminMode = mode === "admin";
  const baseUserNavItems = isAuthenticated
    ? userNavItems
    : userNavItems.filter((item) => item.href !== "/home/perfil");
  const visibleNavItems = isAdminMode
    ? adminNavItems
    : canAccessAdmin
      ? [...baseUserNavItems, { label: "Dashboard", href: "/admin" }]
      : baseUserNavItems;

  const closeMobileMenu = () => {
    mobileMenuRef.current?.removeAttribute("open");
  };

  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  function handleLogout() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setLogoutError(null);

    startTransition(async () => {
      try {
        await logoutWeb();
        router.replace("/");
        router.refresh();
      } catch {
        setLogoutError("No fue posible cerrar sesion. Intentalo de nuevo.");
      }
    });
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[rgba(7,9,12,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <Link href={isAdminMode ? "/admin" : "/home"} className="flex items-center gap-3">
            <Image
              src="/logo_en_linea.png"
              alt="Logo de Billar en Linea"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full border border-white/10 bg-black/30 object-cover p-0.5"
            />
            <div>
              <p className="font-display text-2xl leading-none text-white">Billar en Linea</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-white/68 lg:flex" aria-label={isAdminMode ? "Navegacion principal privada" : "Navegacion principal"}>
            {visibleNavItems.map((item) => {
              const isActive = isActiveLink(pathname, item.href);

              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={isActive
                    ? "rounded-full border border-[rgba(246,196,79,0.35)] bg-[rgba(246,196,79,0.14)] px-4 py-2 text-white shadow-[0_0_0_1px_rgba(246,196,79,0.06)]"
                    : "rounded-full px-4 py-2 transition hover:bg-white/8 hover:text-white"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            {isAdminMode ? (
              <Link
                className="rounded-full border border-[rgba(246,196,79,0.24)] bg-[rgba(246,196,79,0.1)] px-4 py-2 text-sm font-medium text-[rgba(255,240,194,0.92)] transition hover:bg-[rgba(246,196,79,0.16)] hover:text-white"
                href="/home"
              >
                Home user
              </Link>
            ) : null}
            {isAuthenticated ? (
              <button
                className="rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/78 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleLogout}
                disabled={isPending}
              >
                {isPending ? "Cerrando..." : "Cerrar sesion"}
              </button>
            ) : (
              <>
                <Link className="rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/78 transition hover:bg-white/8 hover:text-white" href="/login">
                  Entrar
                </Link>
                <Link className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong" href="/register">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>

          <details ref={mobileMenuRef} className="group relative lg:hidden">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-[rgba(255,255,255,0.16)] bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.34),rgba(255,255,255,0.06)_18%,transparent_20%),radial-gradient(circle_at_35%_30%,#fff3a8_0%,#f6c44f_40%,#c88b14_72%,#6f4300_100%)] text-[#241400] shadow-[inset_-8px_-10px_18px_rgba(106,63,0,0.34),inset_10px_10px_16px_rgba(255,248,196,0.22),0_10px_24px_rgba(78,44,0,0.28)] transition duration-300 ease-out hover:scale-[1.03] hover:shadow-[inset_-8px_-10px_18px_rgba(106,63,0,0.3),inset_10px_10px_16px_rgba(255,248,196,0.24),0_14px_28px_rgba(78,44,0,0.32)]">
              <span className="relative block h-5 w-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
                <span className="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current transition duration-300 ease-out group-open:rotate-180" />
                <span className="absolute left-1/2 top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current transition-all duration-300 ease-out group-open:h-0 group-open:opacity-0" />
              </span>
            </summary>
            <div className="pointer-events-none absolute right-4 top-[4.6rem] w-[min(22rem,calc(100vw-2rem))] origin-top-right rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,13,18,0.98),rgba(13,16,22,0.96))] p-4 opacity-0 shadow-[0_30px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl transition duration-300 ease-out translate-y-2 scale-95 group-open:pointer-events-auto group-open:opacity-100 group-open:translate-y-0 group-open:scale-100 sm:right-6">
              <div className="absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(246,196,79,0.8),transparent)] opacity-0 transition duration-500 group-open:opacity-100" />
              <nav className="grid gap-2" aria-label={isAdminMode ? "Navegacion privada movil" : "Navegacion movil"}>
                {visibleNavItems.map((item, index) => {
                  const isActive = isActiveLink(pathname, item.href);

                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={`${isActive ? "border border-[rgba(246,196,79,0.32)] bg-[rgba(246,196,79,0.14)] text-white" : "text-white/78 hover:bg-white/8 hover:text-white"} translate-x-3 rounded-2xl px-4 py-3 text-sm font-medium opacity-0 transition duration-300 ease-out group-open:translate-x-0 group-open:opacity-100`}
                      style={{ transitionDelay: `${90 + index * 45}ms` }}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                <div className="mt-2 grid translate-y-2 gap-2 border-t border-white/8 pt-3 opacity-0 transition duration-300 ease-out group-open:translate-y-0 group-open:opacity-100" style={{ transitionDelay: "280ms" }}>
                  {isAdminMode ? (
                    <Link
                      className="rounded-2xl border border-[rgba(246,196,79,0.24)] bg-[rgba(246,196,79,0.1)] px-4 py-3 text-center text-sm font-medium text-[rgba(255,240,194,0.92)] transition hover:bg-[rgba(246,196,79,0.16)] hover:text-white"
                      href="/home"
                      onClick={closeMobileMenu}
                    >
                      Home user
                    </Link>
                  ) : null}
                  {isAuthenticated ? (
                    <button
                      className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-white/82 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                      onClick={() => {
                        closeMobileMenu();
                        handleLogout();
                      }}
                      disabled={isPending}
                    >
                      {isPending ? "Cerrando..." : "Cerrar sesion"}
                    </button>
                  ) : (
                    <>
                      <Link
                        className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-white/82 transition hover:bg-white/8"
                        href="/login"
                        onClick={closeMobileMenu}
                      >
                        Entrar
                      </Link>
                      <Link
                        className="rounded-2xl bg-accent px-4 py-3 text-center text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong"
                        href="/register"
                        onClick={closeMobileMenu}
                      >
                        Crear cuenta
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </div>
          </details>
        </div>
      </header>

      {logoutError ? (
        <div className="border-b border-white/8 bg-[rgba(7,9,12,0.78)]">
          <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-10">
            <div className="rounded-[1.2rem] border border-[rgba(255,120,96,0.26)] bg-[rgba(120,22,14,0.22)] px-4 py-3 text-sm text-white/88">
              {logoutError}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}