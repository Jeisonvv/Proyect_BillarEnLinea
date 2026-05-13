import { getJson } from "@/lib/api/client";
import {
  fetchCollection,
  formatError,
  isRecord,
  pickNumber,
  pickString,
  pickStringArray,
  resolveApiAssetUrl,
  type JsonRecord,
} from "./shared";
import type { LandingPost, PostDetail } from "./types";

function normalizePost(record: JsonRecord): LandingPost | null {
  const title = pickString(record, ["title", "name"]);
  const id = pickString(record, ["_id", "id"]);

  if (!title || !id) {
    return null;
  }

  return {
    id,
    title,
    excerpt: pickString(record, ["excerpt", "summary"]),
    slug: pickString(record, ["slug"]),
    publishedAt: pickString(record, ["publishedAt", "createdAt", "updatedAt"]),
    tags: pickStringArray(record, ["tags"]),
  };
}

function normalizePostDetail(record: JsonRecord): PostDetail | null {
  const base = normalizePost(record);
  if (!base) return null;
  return {
    ...base,
    content: pickString(record, ["content"]),
    category: pickString(record, ["category"]),
    coverImageUrl: resolveApiAssetUrl(pickString(record, ["coverImageUrl"])),
    status: pickString(record, ["status"]),
    seoTitle: pickString(record, ["seoTitle"]),
    seoDescription: pickString(record, ["seoDescription"]),
    canonicalUrl: pickString(record, ["canonicalUrl"]),
    ogImageUrl: resolveApiAssetUrl(pickString(record, ["ogImageUrl"])),
    noIndex: typeof record.noIndex === "boolean" ? record.noIndex : false,
    readingTime: pickNumber(record, ["readingTime"]),
  };
}

export async function getLandingPosts(limit = 3) {
  return fetchCollection(`/api/posts?limit=${limit}`, normalizePost);
}

export async function getPostDetailBySlug(slug: string): Promise<PostDetail | null> {
  try {
    const payload = await getJson<{ data?: unknown }>(
      `/api/posts/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    if (!isRecord(payload) || !isRecord(payload.data)) return null;
    return normalizePostDetail(payload.data);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("getPostDetailBySlug error", formatError(error));
    }
    return null;
  }
}

export { normalizePost, normalizePostDetail };
export type { LandingPost, PostDetail };

