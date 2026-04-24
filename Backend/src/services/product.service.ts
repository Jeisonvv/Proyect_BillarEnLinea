import mongoose from "mongoose";
import Product from "../models/product.model.js";
import { ProductCategory } from "../models/enums.js";

export interface ListProductsParams {
  category?: string;
  tag?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface ListAdminProductsParams extends ListProductsParams {
  isActive?: boolean;
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCategory(value: unknown) {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    throw new Error("La categoría del producto es obligatoria.");
  }

  if (!Object.values(ProductCategory).includes(normalized as ProductCategory)) {
    throw new Error("La categoría del producto es inválida.");
  }

  return normalized as ProductCategory;
}

function normalizePrice(value: unknown, fieldName: string) {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    throw new Error(`${fieldName} debe ser un número mayor o igual a 0.`);
  }

  return numericValue;
}

function normalizeStock(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numericValue) || numericValue < 0) {
    throw new Error("El stock de la variante debe ser un entero mayor o igual a 0.");
  }

  return numericValue;
}

function normalizeVariants(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("variants debe ser un arreglo.");
  }

  return value.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`La variante en la posición ${index + 1} es inválida.`);
    }

    const variant = item as Record<string, unknown>;
    const name = normalizeOptionalString(variant.name);
    const sku = normalizeOptionalString(variant.sku);

    if (!name) {
      throw new Error(`La variante en la posición ${index + 1} requiere name.`);
    }

    if (!sku) {
      throw new Error(`La variante en la posición ${index + 1} requiere sku.`);
    }

    return {
      name,
      sku,
      price: normalizePrice(variant.price, "El precio de la variante"),
      stock: normalizeStock(variant.stock),
      ...(normalizeOptionalString(variant.imageUrl) ? { imageUrl: normalizeOptionalString(variant.imageUrl) } : {}),
    };
  });
}

function buildProductPersistencePayload(data: Record<string, unknown>, partial = false) {
  const payload: Record<string, unknown> = {};

  if (!partial || data.name !== undefined) {
    const name = normalizeOptionalString(data.name);
    if (!name) {
      throw new Error("El nombre del producto es obligatorio.");
    }
    payload.name = name;
  }

  if (data.description !== undefined) {
    payload.description = normalizeOptionalString(data.description);
  }

  if (!partial || data.category !== undefined) {
    payload.category = normalizeCategory(data.category);
  }

  if (!partial || data.basePrice !== undefined) {
    payload.basePrice = normalizePrice(data.basePrice, "El precio base");
  }

  if (!partial || data.stock !== undefined) {
    payload.stock = normalizeStock(data.stock ?? 0);
  }

  if (data.images !== undefined) {
    payload.images = normalizeStringArray(data.images);
  }

  if (data.variants !== undefined) {
    payload.variants = normalizeVariants(data.variants);
  }

  if (data.tags !== undefined) {
    payload.tags = normalizeStringArray(data.tags).map((tag) => tag.toLowerCase());
  }

  if (data.isActive !== undefined) {
    if (typeof data.isActive !== "boolean") {
      throw new Error("isActive debe ser booleano.");
    }

    payload.isActive = data.isActive;
  }

  return payload;
}

function buildListFilter(params: ListProductsParams, includeInactive = false) {
  const filter: Record<string, unknown> = includeInactive ? {} : { isActive: true };

  if (params.category) {
    filter.category = params.category;
  }

  if (params.tag) {
    filter.tags = params.tag.toLowerCase();
  }

  if (params.search) {
    filter.$text = { $search: params.search };
  }

  return filter;
}

export async function createProductService(data: Record<string, unknown>) {
  const payload = buildProductPersistencePayload(data);
  return Product.create(payload);
}

export async function listProductsService(params: ListProductsParams) {
  const skip = (params.page - 1) * params.limit;
  const filter = buildListFilter(params);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(params.search ? { score: { $meta: "textScore" }, createdAt: -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return { products, total };
}

export async function listAdminProductsService(params: ListAdminProductsParams) {
  const skip = (params.page - 1) * params.limit;
  const filter = buildListFilter(params, true);

  if (params.isActive !== undefined) {
    filter.isActive = params.isActive;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(params.search ? { score: { $meta: "textScore" }, createdAt: -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return { products, total };
}

export async function getProductByIdService(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Producto no encontrado.");
  }

  const product = await Product.findById(id).lean();
  if (!product) {
    throw new Error("Producto no encontrado.");
  }

  return product;
}

export async function updateProductService(id: string, data: Record<string, unknown>) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Producto no encontrado.");
  }

  const existing = await Product.findById(id);
  if (!existing) {
    throw new Error("Producto no encontrado.");
  }

  const payload = buildProductPersistencePayload(data, true);

  return Product.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true }).lean();
}

export async function deleteProductService(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Producto no encontrado.");
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true, runValidators: true },
  ).lean();

  if (!product) {
    throw new Error("Producto no encontrado.");
  }

  return product;
}