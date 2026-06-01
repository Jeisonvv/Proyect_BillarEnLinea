import { ReactNode } from "react";
import { HomeSiteShellHeader } from "@/components/navigation/HomeSiteShellHeader";
import { siteConfig } from "@/lib/site";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/billarenlinea",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.15rem] w-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" />
        <circle cx="12" cy="12" r="4.1" />
        <circle cx="17.45" cy="6.55" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/billarenlineaoficial?locale=es_LA",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.15rem] w-[1.15rem] fill-current">
        <path d="M13.37 21v-7.3h2.44l.37-2.84h-2.81V9.05c0-.82.23-1.38 1.41-1.38H16V5.12c-.53-.07-1.17-.12-2.1-.12-2.08 0-3.5 1.27-3.5 3.61v2.25H8v2.84h2.4V21h2.97Z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@billarenlinea",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.2rem] w-[1.2rem] fill-current">
        <path d="M21.1 8.18a2.95 2.95 0 0 0-2.07-2.08C17.2 5.6 12 5.6 12 5.6s-5.2 0-7.03.5A2.95 2.95 0 0 0 2.9 8.18 30.3 30.3 0 0 0 2.4 12a30.3 30.3 0 0 0 .5 3.82 2.95 2.95 0 0 0 2.07 2.08c1.83.5 7.03.5 7.03.5s5.2 0 7.03-.5a2.95 2.95 0 0 0 2.07-2.08A30.3 30.3 0 0 0 21.6 12a30.3 30.3 0 0 0-.5-3.82ZM10.35 15.2V8.8L15.9 12l-5.55 3.2Z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@billarenlinea",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.15rem] w-[1.15rem] fill-current">
        <path d="M14.67 3c.23 1.93 1.31 3.62 3.06 4.57a5.62 5.62 0 0 0 2.27.67v2.74a8.43 8.43 0 0 1-3.35-.82v5.1a6.24 6.24 0 1 1-6.23-6.24c.3 0 .6.03.89.08v2.84a3.58 3.58 0 1 0 2.92 3.52V3h2.44Z" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/573002211225",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.15rem] w-[1.15rem] fill-current">
        <path d="M12.04 3.2a8.7 8.7 0 0 0-7.53 13.04l-1.15 4.14 4.24-1.11A8.7 8.7 0 1 0 12.04 3.2Zm0 15.81a7.08 7.08 0 0 1-3.61-.99l-.26-.15-2.52.66.67-2.45-.17-.26a7.08 7.08 0 1 1 5.89 3.19Zm3.88-5.31c-.21-.1-1.26-.62-1.45-.7-.19-.07-.33-.1-.47.11-.14.2-.54.7-.67.84-.12.14-.24.16-.45.05-.21-.1-.88-.32-1.68-1.02-.62-.55-1.04-1.22-1.16-1.43-.12-.2-.01-.31.09-.41.09-.09.21-.24.31-.36.1-.12.14-.2.21-.34.07-.14.03-.26-.02-.36-.05-.1-.47-1.13-.65-1.55-.17-.41-.35-.35-.47-.35h-.4c-.14 0-.36.05-.56.26-.19.2-.74.72-.74 1.76 0 1.03.76 2.03.86 2.17.1.14 1.48 2.27 3.58 3.18.5.22.9.35 1.21.45.51.16.98.14 1.34.09.41-.06 1.26-.52 1.44-1.02.18-.5.18-.93.12-1.02-.05-.09-.19-.14-.4-.24Z" />
      </svg>
    ),
  },
] as const;

export function HomeSiteShell({
  children,
  canAccessAdmin = false,
  isAuthenticated = true,
  mode = "user",
}: {
  children: ReactNode;
  canAccessAdmin?: boolean;
  isAuthenticated?: boolean;
  mode?: "user" | "admin";
}) {
  return (
    <>
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-80 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#10110f]"
      >
        Saltar al contenido
      </a>

      <HomeSiteShellHeader canAccessAdmin={canAccessAdmin} isAuthenticated={isAuthenticated} mode={mode} />

      <div id="contenido-principal" className="flex-1 pt-6">
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>

      <footer className="border-t border-white/8 bg-[rgba(7,9,12,0.86)]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
          <div className="space-y-4">
            <p className="font-display text-3xl text-white">{siteConfig.name}</p>
            <p className="max-w-2xl text-sm leading-7 text-white/64 sm:text-base text-center lg:text-left">
              La plataforma de torneos, eventos, actividades y tienda de billar para la comunidad en Colombia.
            </p>
          </div>

          <div className="space-y-4 lg:justify-self-end">
            <div className="space-y-2 text-center lg:text-left">
              <p className="text-xs uppercase tracking-[0.28em] text-white/42">Siguenos</p>
              <p className="text-sm leading-7 text-white/64">
                siguenos en redes sociales para estar al tanto de los torneos, eventos, actividades y novedades de la comunidad del billar en Colombia.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {socialLinks.map((socialLink) => (
                <a
                  key={socialLink.label}
                  href={socialLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Siguenos en ${socialLink.label}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white/72 transition hover:border-white/18 hover:bg-white/9 hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/70 focus:ring-offset-2 focus:ring-offset-[#0b0d10]"
                >
                  {socialLink.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}