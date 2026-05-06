import { fetchCollection, pickString, pickStringArray, type JsonRecord } from "./shared";
import type { LandingPost } from "./types";

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

export async function getLandingPosts(limit = 3) {
  return fetchCollection(`/api/posts?limit=${limit}`, normalizePost);
}

export { normalizePost };
export type { LandingPost };
