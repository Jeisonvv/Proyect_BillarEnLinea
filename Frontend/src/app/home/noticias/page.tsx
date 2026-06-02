import type { Metadata } from "next";
import { PostCard } from "@/components/content/user/posts";
import { getLandingPosts } from "@/lib/api/public-content";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";

const newsShareImage = getSocialShareImageUrl(siteConfig.socialImage);

export const metadata: Metadata = {
  title: "Noticias",
  description: "Sigue las noticias y novedades del billar, con publicaciones recientes, anuncios y contexto editorial dentro de Billar en Linea.",
  alternates: {
    canonical: "/home/noticias",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/home/noticias",
    siteName: siteConfig.name,
    title: `Noticias | ${siteConfig.name}`,
    description: "Sigue las noticias y novedades del billar, con publicaciones recientes, anuncios y contexto editorial dentro de Billar en Linea.",
    images: [
      {
        url: newsShareImage,
        width: socialImageDimensions.width,
        height: socialImageDimensions.height,
        alt: `Noticias de billar en ${siteConfig.name}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Noticias | ${siteConfig.name}`,
    description: "Sigue las noticias y novedades del billar, con publicaciones recientes, anuncios y contexto editorial dentro de Billar en Linea.",
    images: [newsShareImage],
  },
};

export default async function HomeNoticiasPage() {
  const posts = await getLandingPosts(12);

  return (
    <main className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Noticias</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Cobertura y novedades</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Mantiene al cliente conectado con anuncios, resultados, contexto editorial y movimientos importantes dentro de la comunidad del billar.
        </p>
      </section>

      {posts.items.length > 0 ? (
        <section className="grid gap-4">
          {posts.items.map((post) => (
            <PostCard key={post.id} item={post} />
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-7 text-white/64">
          Todavia no hay noticias publicadas. Esta seccion quedo lista para mostrarlas cuando el contenido llegue.
        </section>
      )}
    </main>
  );
}