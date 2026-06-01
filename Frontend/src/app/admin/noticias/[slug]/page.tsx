import { notFound } from "next/navigation";
import { PostAdminDetail } from "@/components/content/admin/posts";
import { API_BASE_URL, getJson } from "@/lib/api/client";
import { normalizePostDetail } from "@/lib/api/public-content/posts";
import { requireAdminServerSession } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export default async function AdminPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await requireAdminServerSession();
  const { slug } = await params;
  let post = null;

  try {
    const payload = await getJson<{ data?: unknown }>(
      `/api/posts/admin/slug/${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
        headers: {
          Cookie: `${session.authCookie.cookieName}=${session.authCookie.value}`,
          Origin: API_BASE_URL,
        },
      },
    );

    if (payload?.data && typeof payload.data === "object") {
      post = normalizePostDetail(payload.data as Record<string, unknown>);
    }
  } catch {
    post = null;
  }

  if (!post) {
    notFound();
  }

  return <PostAdminDetail initialPost={post} />;
}
