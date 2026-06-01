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

type VariantSkuSeed = {
  category?: string | undefined;
  brand?: string | undefined;
  productName?: string | undefined;
  hand?: string | undefined;
  color?: string | undefined;
  size?: string | undefined;
  hardness?: string | undefined;
};

function normalizeSkuToken(value: string, maxLength: number) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (!normalized) {
    return "";
  }

  return normalized.slice(0, maxLength);
}

function normalizeHandToken(hand?: string) {
  const normalized = (hand ?? "").trim().toLowerCase();

  if (!normalized) {
    return "";
  }

  if (normalized.startsWith("der")) {
    return "DER";
  }

  if (normalized.startsWith("izq")) {
    return "IZQ";
  }

  return normalizeSkuToken(hand ?? "", 3);
}

function buildVariantSku(seed: VariantSkuSeed) {
  const categoryToken = normalizeSkuToken(seed.category ?? "", 3);
  const brandToken = normalizeSkuToken(seed.brand ?? "", 4);
  const productToken = normalizeSkuToken(seed.productName ?? "", 3);
  const handToken = normalizeHandToken(seed.hand);
  const colorToken = normalizeSkuToken(seed.color ?? "", 2);
  const sizeToken = normalizeSkuToken(seed.size ?? "", 2);
  const hardnessToken = normalizeSkuToken(seed.hardness ?? "", 2);

  const parts = [categoryToken, brandToken, productToken, handToken, colorToken, sizeToken, hardnessToken].filter(Boolean);

  if (parts.length === 0) {
    return "VAR";
  }

  return parts.join("");
}

function ensureUniqueSku(baseSku: string, usedSkus: Set<string>) {
  let candidate = baseSku;
  let suffix = 2;

  while (usedSkus.has(candidate)) {
    candidate = `${baseSku}${suffix}`;
    suffix += 1;
  }

  usedSkus.add(candidate);
  return candidate;
}

function normalizeVariants(
  value: unknown,
  context?: {
    category?: string | undefined;
    brand?: string | undefined;
    name?: string | undefined;
  },
) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("variants debe ser un arreglo.");
  }

  const usedSkus = new Set<string>();

  const variants = value.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`La variante en la posición ${index + 1} es inválida.`);
    }

    const variant = item as Record<string, unknown>;
    const name = normalizeOptionalString(variant.name);
    const sku = normalizeOptionalString(variant.sku);
    const color = normalizeOptionalString(variant.color);
    const size = normalizeOptionalString(variant.size);
    const hardness = normalizeOptionalString(variant.hardness);
    const hand = normalizeOptionalString(variant.hand);
    const imageUrl = normalizeOptionalString(variant.imageUrl);

    const computedName = name || [color, size, hardness, hand].filter(Boolean).join(" · ");
    if (!computedName) {
      throw new Error(`La variante en la posición ${index + 1} requiere name.`);
    }

    const generatedSku = buildVariantSku({
      category: context?.category,
      brand: context?.brand,
      productName: context?.name ?? computedName,
      hand,
      color,
      size,
      hardness,
    });

    const finalSku = ensureUniqueSku((sku ?? generatedSku).toUpperCase(), usedSkus);

    return {
      name: computedName,
      sku: finalSku,
      price: normalizePrice(variant.price, "El precio de la variante"),
      stock: normalizeStock(variant.stock),
      ...(imageUrl ? { imageUrl } : {}),
      ...(color ? { color } : {}),
      ...(size ? { size } : {}),
      ...(hardness ? { hardness } : {}),
      ...(hand ? { hand } : {}),
    };
  });

  return variants;
}

function buildProductPersistencePayload(
  data: Record<string, unknown>,
  partial = false,
  context?: {
    name?: string | undefined;
    brand?: string | undefined;
    category?: string | undefined;
  },
) {
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

  if (data.brand !== undefined) {
    payload.brand = normalizeOptionalString(data.brand);
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
    payload.variants = normalizeVariants(data.variants, {
      name: normalizeOptionalString(data.name) ?? context?.name,
      brand: normalizeOptionalString(data.brand) ?? context?.brand,
      category:
        data.category !== undefined
          ? normalizeCategory(data.category)
          : context?.category,
    });
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

  if (data.slug !== undefined) {
    const slug = normalizeOptionalString(data.slug);
    if (slug) {
      payload.slug = slug;
    }
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
  // Acepta ObjectId o slug. Si el id no es ObjectId válido, intenta resolver por slug.
  let product;
  if (mongoose.Types.ObjectId.isValid(id)) {
    product = await Product.findOne({ _id: id, isActive: true }).lean();
  } else {
    product = await Product.findOne({ slug: id.trim().toLowerCase(), isActive: true }).lean();
  }

  if (!product) {
    throw new Error("Producto no encontrado.");
  }

  return product;
}

export async function getProductBySlugService(slug: string) {
  const product = await Product.findOne({ slug: slug.trim().toLowerCase(), isActive: true }).lean();
  if (!product) {
    throw new Error("Producto no encontrado.");
  }
  return product;
}

export async function getAdminProductByIdService(id: string) {
  let product;
  if (mongoose.Types.ObjectId.isValid(id)) {
    product = await Product.findById(id).lean();
  } else {
    product = await Product.findOne({ slug: id.trim().toLowerCase() }).lean();
  }

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

  const payload = buildProductPersistencePayload(data, true, {
    name: existing.name,
    brand: existing.brand,
    category: existing.category,
  });

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

export async function permanentlyDeleteProductService(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Producto no encontrado.");
  }

  const product = await Product.findByIdAndDelete(id).lean();

  if (!product) {
    throw new Error("Producto no encontrado.");
  }

  return product;
}