import { getJson } from "@/lib/api/client";
import {
  fetchCollection,
  formatError,
  isRecord,
  pickNumber,
  pickRecordArray,
  pickString,
  pickStringArray,
  resolveApiAssetUrl,
  type JsonRecord,
} from "./shared";
import type { LandingProduct, ProductDetail } from "./types";

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
    slug: pickString(record, ["slug"]),
    brand: pickString(record, ["brand"]),
    description: pickString(record, ["description"]),
    category: pickString(record, ["category"]),
    basePrice: pickNumber(record, ["basePrice", "price"]),
    image: resolveApiAssetUrl(images[0] ?? null),
    tags: pickStringArray(record, ["tags"]),
    stock: pickNumber(record, ["stock"]),
  };
}

function normalizeProductDetail(record: JsonRecord): ProductDetail | null {
  const base = normalizeProduct(record);
  if (!base) return null;

  const images = pickStringArray(record, ["images"])
    .map((value) => resolveApiAssetUrl(value))
    .filter((value): value is string => value !== null);

  const variants = pickRecordArray(record, ["variants"]).map((variant) => ({
    name: pickString(variant, ["name"]) ?? "Variante",
    sku: pickString(variant, ["sku"]) ?? "",
    price: pickNumber(variant, ["price"]) ?? 0,
    stock: pickNumber(variant, ["stock"]) ?? 0,
    imageUrl: resolveApiAssetUrl(pickString(variant, ["imageUrl"])),
    color: pickString(variant, ["color"]),
    size: pickString(variant, ["size"]),
    hardness: pickString(variant, ["hardness"]),
    hand: pickString(variant, ["hand"]),
  })).filter((variant) => variant.sku.length > 0);

  const isActive = typeof record.isActive === "boolean" ? record.isActive : true;
  return { ...base, images, isActive, variants };
}

export async function getLandingProducts(limit = 3) {
  return fetchCollection(`/api/products?limit=${limit}`, normalizeProduct, { cache: "no-store" });
}

export async function getProductsByCategory(category: string, limit = 60) {
  return fetchCollection(
    `/api/products?category=${encodeURIComponent(category)}&limit=${limit}`,
    normalizeProduct,
    { cache: "no-store" },
  );
}

export async function getProductDetailBySlug(slug: string): Promise<ProductDetail | null> {
  try {
    const payload = await getJson<{ data?: unknown }>(
      `/api/products/slug/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    if (!isRecord(payload) || !isRecord(payload.data)) return null;
    return normalizeProductDetail(payload.data);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("getProductDetailBySlug error", formatError(error));
    }
    return null;
  }
}

export async function getProductDetailById(id: string): Promise<ProductDetail | null> {
  try {
    const payload = await getJson<{ data?: unknown }>(
      `/api/products/${encodeURIComponent(id)}`,
      { cache: "no-store" },
    );
    if (!isRecord(payload) || !isRecord(payload.data)) return null;
    return normalizeProductDetail(payload.data);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("getProductDetailById error", formatError(error));
    }
    return null;
  }
}

export { normalizeProduct, normalizeProductDetail };
export type { LandingProduct, ProductDetail };

