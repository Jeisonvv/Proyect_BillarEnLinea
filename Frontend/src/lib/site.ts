export const siteConfig = {
  name: "Billar en Linea",
  shortName: "Billar en Linea",
  description:
    "Torneos, eventos, sorteos, noticias y tienda especializada para la comunidad del billar en un solo lugar.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://billarenlinea.com").replace(/\/$/, ""),
  locale: "es_CO",
  socialImage: "/hero_portada.png",
  keywords: [
    "billar en linea",
    "torneos de billar",
    "eventos de billar",
    "sorteos de billar",
    "noticias de billar",
    "tienda de billar",
    "billar nacional",
    "billar internacional",
  ],
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}