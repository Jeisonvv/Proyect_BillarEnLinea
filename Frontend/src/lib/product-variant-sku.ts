type SkuSeed = {
  category?: string | null;
  brand?: string | null;
  productName?: string | null;
  hand?: string | null;
  color?: string | null;
  size?: string | null;
  hardness?: string | null;
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

function normalizeHandToken(hand?: string | null) {
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

export function buildVariantSku(seed: SkuSeed) {
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

export function buildUniqueVariantSku(seed: SkuSeed, usedSkus: Set<string>) {
  const baseSku = buildVariantSku(seed);
  let candidate = baseSku;
  let suffix = 2;

  while (usedSkus.has(candidate)) {
    candidate = `${baseSku}${suffix}`;
    suffix += 1;
  }

  usedSkus.add(candidate);
  return candidate;
}