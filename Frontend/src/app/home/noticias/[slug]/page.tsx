import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostDetailBySlug } from "@/lib/api/public-content";
import { siteConfig } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostDetailBySlug(slug);
  if (!post) {
    return { title: "Noticia no encontrada", robots: { index: false, follow: false } };
  }
  const title = post.seoTitle?.trim() || post.title;
  const description = post.seoDescription?.trim() || post.excerpt || `Noticia: ${post.title}`;
  const url = `/home/noticias/${post.slug ?? post.id}`;
  return {
    title,
    description,
    alternates: { canonical: post.canonicalUrl ?? url },
    robots: post.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      locale: siteConfig.locale,
      url,
      title,
      description,
      images: post.ogImageUrl || post.coverImageUrl ? [{ url: post.ogImageUrl ?? post.coverImageUrl ?? "" }] : undefined,
    },
  };
}

function formatDate(value: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function PublicPostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostDetailBySlug(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 md:px-8 md:py-16">
      <Link href="/home/noticias" className="text-sm text-white/62 transition hover:text-white">← Volver a noticias</Link>

      <header className="mt-6">
        {post.category ? (
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">{post.category}</p>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-white md:text-4xl">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/58">
          {post.publishedAt ? <span>{formatDate(post.publishedAt)}</span> : null}
          {post.readingTime ? <span>· {post.readingTime} min de lectura</span> : null}
        </div>
        {post.excerpt ? <p className="mt-4 text-base leading-7 text-white/78">{post.excerpt}</p> : null}
      </header>

      {post.coverImageUrl ? (
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/8 bg-black/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImageUrl} alt={post.title} className="h-auto w-full object-cover" />
        </div>
      ) : null}

      {post.content ? (
        <article className="prose prose-invert mt-8 max-w-none whitespace-pre-line text-[1rem] leading-8 text-white/82">
          {post.content}
        </article>
      ) : null}

      {post.tags.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-[rgba(246,196,79,0.2)] bg-[rgba(246,196,79,0.12)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(255,233,174,0.96)]">{tag}</span>
          ))}
        </div>
      ) : null}
    </main>
  );
}
