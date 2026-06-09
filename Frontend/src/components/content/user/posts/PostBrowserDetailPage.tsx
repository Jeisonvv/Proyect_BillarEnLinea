"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { defaultSchema } from "hast-util-sanitize";
import { getPostDetailBySlug } from "@/lib/api/public-content";

const markdownSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "iframe"],
  attributes: {
    ...defaultSchema.attributes,
    iframe: ["src", "title", "width", "height", "allow", "allowFullScreen", "frameBorder", "loading", "referrerPolicy", "className"],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https"],
  },
};

function formatDate(value: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
}

function normalizeEmbedSrc(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const isYoutubeEmbed = host.includes("youtube.com") && url.pathname.includes("/embed/");
    if (isYoutubeEmbed) {
      if (!url.searchParams.has("controls")) url.searchParams.set("controls", "1");
      if (!url.searchParams.has("rel")) url.searchParams.set("rel", "0");
    }
    return url.toString();
  } catch {
    return value;
  }
}

export function PostBrowserDetailPage({ slug }: { slug: string }) {
  const [post, setPost] = useState<Awaited<ReturnType<typeof getPostDetailBySlug>>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getPostDetailBySlug(slug)
      .then((result) => {
        if (!active) return;
        setPost(result);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setPost(null);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return <main className="mx-auto w-full max-w-4xl px-5 py-12 md:px-8 md:py-16 text-sm text-white/62">Cargando noticia...</main>;
  }

  if (!post) {
    return <main className="mx-auto w-full max-w-4xl px-5 py-12 md:px-8 md:py-16 text-sm text-white/62">No encontramos la noticia solicitada.</main>;
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 md:px-8 md:py-16">
      <Link href="/home/noticias" className="text-sm text-white/62 transition hover:text-white">← Volver a noticias</Link>

      <header className="mt-6">
        {post.category ? <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">{post.category}</p> : null}
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-white md:text-4xl">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/58">
          {post.publishedAt ? <span>{formatDate(post.publishedAt)}</span> : null}
          {post.readingTime ? <span>· {post.readingTime} min de lectura</span> : null}
        </div>
        {post.excerpt ? <p className="mt-4 text-base leading-7 text-white/78">{post.excerpt}</p> : null}
      </header>

      {post.coverImageUrl ? (
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/8 bg-black/30">
          <img src={post.coverImageUrl} alt={post.title} className="h-auto w-full object-cover" />
        </div>
      ) : null}

      {post.content ? (
        <article className="mt-8 overflow-hidden rounded-3xl border border-white/8 bg-white/4 p-5 text-[1rem] leading-8 text-white/82 md:p-7">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSchema]]}
            components={{
              p: ({ children }) => <p className="mb-5 leading-8 text-white/82 last:mb-0">{children}</p>,
              h1: ({ children }) => <h2 className="mb-4 mt-8 text-2xl font-semibold text-white first:mt-0">{children}</h2>,
              h2: ({ children }) => <h3 className="mb-3 mt-7 text-xl font-semibold text-white first:mt-0">{children}</h3>,
              h3: ({ children }) => <h4 className="mb-3 mt-6 text-lg font-semibold text-white first:mt-0">{children}</h4>,
              ul: ({ children }) => <ul className="mb-5 ml-5 list-disc space-y-2 text-white/82">{children}</ul>,
              ol: ({ children }) => <ol className="mb-5 ml-5 list-decimal space-y-2 text-white/82">{children}</ol>,
              li: ({ children }) => <li className="pl-1">{children}</li>,
              blockquote: ({ children }) => <blockquote className="mb-5 border-l-2 border-[rgba(246,196,79,0.45)] bg-[rgba(246,196,79,0.08)] px-4 py-3 text-white/76">{children}</blockquote>,
              img: ({ src, alt }) => src ? <figure className="my-6 overflow-hidden rounded-3xl border border-white/8 bg-black/30"><img src={src} alt={alt ?? "Imagen de la noticia"} className="h-auto w-full object-cover" /></figure> : null,
              a: ({ href, children }) => <a href={href} className="text-[#f6c44f] underline decoration-[#f6c44f]/40 underline-offset-4 transition hover:text-white">{children}</a>,
              code: ({ children }) => <code className="rounded-md bg-white/8 px-1.5 py-0.5 text-[0.92em] text-white/92">{children}</code>,
              iframe: ({ src, title }) => {
                const safeSrc = normalizeEmbedSrc(typeof src === "string" ? src : undefined);
                if (!safeSrc) return null;
                return <div className="my-6 overflow-hidden rounded-3xl border border-white/8 bg-black/30"><div className="relative w-full pt-[56.25%]"><iframe src={safeSrc} title={typeof title === "string" && title.trim().length > 0 ? title : "Video embebido"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0 h-full w-full" /></div></div>;
              },
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>
      ) : null}
    </main>
  );
}
