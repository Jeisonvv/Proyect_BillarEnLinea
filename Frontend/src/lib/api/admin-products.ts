import { deleteJson, patchJson, postFormData, postJson } from "@/lib/api/client";

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
  };
};

export type DeleteAdminProductResponse = { ok: boolean };

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
  return postFormData<UploadProductImageResponse>("/api/uploads/images", formData, {
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
