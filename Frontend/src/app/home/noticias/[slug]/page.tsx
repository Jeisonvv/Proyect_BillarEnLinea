import type { Metadata } from "next";
import { getPostDetailBySlug } from "@/lib/api/public-content";
import { getSocialShareImageUrl, siteConfig, socialImageDimensions } from "@/lib/site";
import { PostBrowserDetailPage } from "@/components/content/user/posts/PostBrowserDetailPage";

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
  const shareImage = getSocialShareImageUrl(post.ogImageUrl ?? post.coverImageUrl ?? siteConfig.socialImage);

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
      images: [{ url: shareImage, width: socialImageDimensions.width, height: socialImageDimensions.height }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
    },
  };
}

export default async function PublicPostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <PostBrowserDetailPage slug={slug} />;
}
