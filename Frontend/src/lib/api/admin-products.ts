import { deleteJson, patchJson, postFormData, postJson } from "@/lib/api/client";
import { getJson } from "@/lib/api/client";
import type { CollectionState, LandingProduct } from "./public-content/types";
import { normalizeProduct } from "./public-content/products";
import type { JsonRecord } from "./public-content/shared";

export const PRODUCT_CATEGORIES = ["CUE", "BALL", "TABLE", "ACCESSORY", "CLOTHING", "OTHER"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  CUE: "Tacos",
  BALL: "Bolas",
  TABLE: "Mesas",
  ACCESSORY: "Accesorios",
  CLOTHING: "Ropa",
  OTHER: "Otros",
};

export type AdminProductVariantInput = {
  name: string;
  sku: string;
  price: number;
  stock: number;
  imageUrl?: string;
  color?: string;
  size?: string;
  hardness?: string;
  hand?: string;
};

export type CreateAdminProductInput = {
  name: string;
  category: ProductCategory;
  basePrice: number;
  slug?: string;
  brand?: string;
  description?: string;
  stock?: number;
  images?: string[];
  tags?: string[];
  isActive?: boolean;
  variants?: AdminProductVariantInput[];
};

export type UpdateAdminProductInput = Partial<CreateAdminProductInput>;

export type AdminProductResponse = {
  ok: boolean;
  data: {
    _id?: string;
    slug?: string;
    name?: string;
    brand?: string;
    category?: string;
    basePrice?: number;
    stock?: number;
    description?: string;
    images?: string[];
    tags?: string[];
    isActive?: boolean;
    variants?: AdminProductVariantInput[];
  };
};

export type AdminProductSummary = LandingProduct & { isActive: boolean };

export type DeleteAdminProductResponse = { ok: boolean };

export type AdminProductDetailResponse = AdminProductResponse;

export type AdminProductDetail = AdminProductResponse["data"] & {
  id: string;
};

export type UploadProductImageResponse = {
  ok: boolean;
  data: { url: string; publicId?: string };
};

export async function uploadProductImage(file: File, name?: string): Promise<UploadProductImageResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "billar-en-linea/tienda");
  if (name && name.trim().length > 0) {
    formData.append(
      "publicId",
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    );
  }
  formData.append("tags", "tienda,admin,frontend-lab");
  return postFormData<UploadProductImageResponse>("/api/admin/uploads/images", formData, {
    credentials: "include",
  });
}

export async function createProductAdmin(input: CreateAdminProductInput) {
  return postJson<AdminProductResponse, CreateAdminProductInput>("/api/products", input, {
    credentials: "include",
  });
}

export async function updateProductAdmin(productId: string, input: UpdateAdminProductInput) {
  return patchJson<AdminProductResponse, UpdateAdminProductInput>(`/api/products/${productId}`, input, {
    credentials: "include",
  });
}

export async function deleteProductAdmin(productId: string) {
  return deleteJson<DeleteAdminProductResponse>(`/api/products/${productId}`, {
    credentials: "include",
  });
}

function normalizeAdminProduct(record: JsonRecord): AdminProductSummary | null {
  const base = normalizeProduct(record);
  if (!base) {
    return null;
  }

  return {
    ...base,
    isActive: typeof record.isActive === "boolean" ? record.isActive : true,
  };
}

export async function getAdminProducts(
  limit = 100,
  cookieHeader?: string,
): Promise<CollectionState<AdminProductSummary>> {
  const headers = new Headers();

  if (cookieHeader && cookieHeader.trim().length > 0) {
    headers.set("cookie", cookieHeader);
  }

  try {
    const payload = await getJson<{ data?: unknown; pagination?: { total?: unknown } }>(
      `/api/products/admin/all?page=1&limit=${limit}`,
      { headers, cache: "no-store" },
    );

    const items = Array.isArray(payload.data)
      ? payload.data.map((item) => (item && typeof item === "object" ? normalizeAdminProduct(item as JsonRecord) : null)).filter(
        (item): item is AdminProductSummary => item !== null,
      )
      : [];

    const total = typeof payload.pagination?.total === "number" ? payload.pagination.total : items.length;

    return {
      items,
      total,
      error: null,
    };
  } catch (error) {
    return {
      items: [],
      total: 0,
      error: error instanceof Error ? error.message : "No fue posible cargar los productos del panel.",
    };
  }
}

export async function getAdminProductById(
  productId: string,
  cookieHeader?: string,
): Promise<{ ok: boolean; data: AdminProductDetail | null }> {
  const headers = new Headers();

  if (cookieHeader && cookieHeader.trim().length > 0) {
    headers.set("cookie", cookieHeader);
  }

  const response = await getJson<AdminProductDetailResponse>(`/api/products/admin/${encodeURIComponent(productId)}`, {
    headers,
    cache: "no-store",
  });

  const data = response.data;
  const normalized = data && (data._id || data.slug)
    ? {
        ...data,
        id: data._id ?? data.slug ?? productId,
      }
    : null;

  return { ok: response.ok, data: normalized };
}
