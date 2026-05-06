import { fetchCollection, pickNumber, pickString, pickStringArray, resolveApiAssetUrl, type JsonRecord } from "./shared";
import type { LandingProduct } from "./types";

function normalizeProduct(record: JsonRecord): LandingProduct | null {
  const name = pickString(record, ["name", "title"]);
  const id = pickString(record, ["_id", "id"]);

  if (!name || !id) {
    return null;
  }

  const images = pickStringArray(record, ["images"]);

  return {
    id,
    name,
    description: pickString(record, ["description"]),
    category: pickString(record, ["category"]),
    basePrice: pickNumber(record, ["basePrice", "price"]),
    image: resolveApiAssetUrl(images[0] ?? null),
    tags: pickStringArray(record, ["tags"]),
    stock: pickNumber(record, ["stock"]),
  };
}

export async function getLandingProducts(limit = 3) {
  return fetchCollection(`/api/products?limit=${limit}`, normalizeProduct);
}

export { normalizeProduct };
export type { LandingProduct };
