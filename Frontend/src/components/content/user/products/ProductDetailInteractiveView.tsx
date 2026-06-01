"use client";

import { useMemo, useState } from "react";
import { ProductAddToCartButton } from "./ProductAddToCartButton";

type ProductDetailVariant = {
  name: string;
  sku: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  color?: string | null;
  size?: string | null;
  hardness?: string | null;
  hand?: string | null;
};

type ProductDetailInteractiveViewProps = {
  product: {
    id: string;
    name: string;
    brand: string | null;
    category: string | null;
    basePrice: number | null;
    stock: number | null;
    description: string | null;
    images: string[];
    variants: ProductDetailVariant[];
  };
};

type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  kind: "base" | "variant";
};

type AttributeKey = "color" | "size" | "hand" | "hardness";

type SelectedAttributes = Record<AttributeKey, string>;

const ATTRIBUTE_CONFIG: Array<{ key: AttributeKey; label: string }> = [
  { key: "color", label: "Color" },
  { key: "size", label: "Talla" },
  { key: "hand", label: "Mano" },
  { key: "hardness", label: "Dureza" },
];

function formatMoney(value: number | null) {
  if (value === null) return "Consultar precio";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

function splitDescriptionParagraphs(description: string) {
  return description
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function normalizeAttributeValue(value?: string | null) {
  return (value ?? "").trim();
}

function getVariantAttributeValue(variant: ProductDetailVariant, key: AttributeKey) {
  return normalizeAttributeValue(variant[key]);
}

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function ProductDetailInteractiveView({ product }: ProductDetailInteractiveViewProps) {
  const hasVariants = product.variants.length > 0;

  const [manualSelectedSku, setManualSelectedSku] = useState<string>("");
  const [manualMainImage, setManualMainImage] = useState<string | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttributes>({
    color: "",
    size: "",
    hand: "",
    hardness: "",
  });

  const availableAttributes = useMemo(
    () => ATTRIBUTE_CONFIG.filter(({ key }) => product.variants.some((variant) => getVariantAttributeValue(variant, key))),
    [product.variants],
  );

  const isAttributeDriven = hasVariants && availableAttributes.length > 0;

  const allAttributesSelected = useMemo(
    () => availableAttributes.every(({ key }) => selectedAttributes[key].length > 0),
    [availableAttributes, selectedAttributes],
  );

  const resolvedVariantByAttributes = useMemo(() => {
    if (!isAttributeDriven || !allAttributesSelected) {
      return null;
    }

    return product.variants.find((variant) => (
      availableAttributes.every(({ key }) => getVariantAttributeValue(variant, key) === selectedAttributes[key])
    )) ?? null;
  }, [allAttributesSelected, availableAttributes, isAttributeDriven, product.variants, selectedAttributes]);

  const selectedSku = isAttributeDriven
    ? (resolvedVariantByAttributes?.sku ?? "")
    : manualSelectedSku;

  function getAttributeOptions(key: AttributeKey) {
    return getUniqueValues(
      product.variants
        .filter((variant) => {
          return availableAttributes.every((attribute) => {
            if (attribute.key === key) {
              return true;
            }

            const selected = selectedAttributes[attribute.key];
            if (!selected) {
              return true;
            }

            return getVariantAttributeValue(variant, attribute.key) === selected;
          });
        })
        .map((variant) => getVariantAttributeValue(variant, key)),
    );
  }

  function handleAttributeChange(key: AttributeKey, value: string) {
    setManualMainImage(null);
    setSelectedAttributes((prev) => {
      const next: SelectedAttributes = { ...prev, [key]: value };

      for (const attribute of availableAttributes) {
        const selected = next[attribute.key];
        if (!selected) continue;

        const options = getUniqueValues(
          product.variants
            .filter((variant) => {
              return availableAttributes.every((check) => {
                if (check.key === attribute.key) return true;
                const current = next[check.key];
                if (!current) return true;
                return getVariantAttributeValue(variant, check.key) === current;
              });
            })
            .map((variant) => getVariantAttributeValue(variant, attribute.key)),
        );

        if (!options.includes(selected)) {
          next[attribute.key] = "";
        }
      }

      return next;
    });
  }

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.sku === selectedSku) ?? null,
    [product.variants, selectedSku],
  );

  const galleryImages = useMemo(() => {
    const items: GalleryImage[] = [];
    const used = new Set<string>();

    product.images.forEach((src, index) => {
      if (!src || used.has(src)) return;
      used.add(src);
      items.push({
        id: `base-${index}`,
        src,
        alt: `${product.name} ${index + 1}`,
        kind: "base",
      });
    });

    product.variants.forEach((variant) => {
      const src = variant.imageUrl ?? "";
      if (!src || used.has(src)) return;
      used.add(src);
      items.push({
        id: `variant-${variant.sku}`,
        src,
        alt: `${product.name} variante ${variant.name}`,
        kind: "variant",
      });
    });

    return items;
  }, [product.images, product.name, product.variants]);

  const defaultMainImage = galleryImages[0]?.src ?? null;
  const selectedVariantImage = selectedVariant?.imageUrl ?? null;
  const mainImage = selectedVariantImage || manualMainImage || defaultMainImage;

  const thumbnails = galleryImages.filter((image) => image.src !== mainImage);

  const currentPrice = selectedVariant ? selectedVariant.price : product.basePrice;
  const currentStock = hasVariants
    ? (selectedVariant ? selectedVariant.stock : (product.stock ?? 0))
    : (product.stock ?? 0);
  const requiresVariantSelection = hasVariants && !selectedSku;
  const isOutOfStock = hasVariants
    ? (selectedVariant ? currentStock <= 0 : (product.stock !== null && product.stock <= 0))
    : (product.stock !== null && product.stock <= 0);

  return (
    <div className="mt-6 grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
      <section className="grid gap-3">
        {mainImage ? (
          <>
            <div className="overflow-hidden rounded-3xl border border-white/8 bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mainImage} alt={product.name} className="h-105 w-full object-cover" />
            </div>
            {thumbnails.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {thumbnails.slice(0, 8).map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setManualMainImage(image.src)}
                    className="group relative overflow-hidden rounded-2xl border border-white/8 bg-black/30 transition hover:border-[rgba(246,196,79,0.45)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.src} alt={image.alt} className="h-24 w-full object-cover transition duration-300 group-hover:scale-105" />
                    {image.kind === "variant" ? (
                      <span className="absolute left-1.5 top-1.5 rounded-full border border-[rgba(246,196,79,0.42)] bg-[rgba(0,0,0,0.62)] px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[#f6c44f]">
                        Variante
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            {isAttributeDriven ? (
              <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/18 p-4">
                {availableAttributes.map(({ key, label }) => {
                  const options = getAttributeOptions(key);

                  if (options.length === 0) {
                    return null;
                  }

                  return (
                    <div key={key} className="grid gap-2">
                      <p className="text-[0.66rem] uppercase tracking-[0.16em] text-white/52">{label}</p>
                      <div className="flex flex-wrap gap-2">
                        {options.map((option) => {
                          const isSelected = selectedAttributes[key] === option;

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handleAttributeChange(key, isSelected ? "" : option)}
                              aria-pressed={isSelected}
                              className={[
                                "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition",
                                isSelected
                                  ? "border-[rgba(246,196,79,0.76)] bg-[rgba(246,196,79,0.2)] text-[#f6c44f]"
                                  : "border-white/18 bg-black/28 text-white/80 hover:border-[rgba(246,196,79,0.45)] hover:text-white",
                              ].join(" ")}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            
          </>
        ) : (
          <div className="flex h-105 items-center justify-center rounded-3xl border border-white/8 bg-black/30 text-white/46">
            Sin imagen
          </div>
        )}
      </section>

      <section className="grid content-start gap-4">
        {product.category ? (
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">{product.category}</p>
        ) : null}
        
        <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">{product.name}</h1>

        {product.brand ? (
          <p className="text-sm uppercase tracking-[0.18em] text-white/56">Marca: {product.brand}</p>
        ) : null}

        <p className="text-2xl font-semibold text-white">{formatMoney(currentPrice)}</p>

        <p className="text-sm text-white/62">
          {!hasVariants
            ? isOutOfStock
              ? "Sin stock disponible."
              : `${currentStock} disponibles en inventario.`
            : requiresVariantSelection
              ? isOutOfStock
                ? "Producto principal sin stock. Selecciona atributos para probar una variante."
                : `Producto principal: ${currentStock} disponibles. Selecciona atributos solo si quieres una variante.`
              : isOutOfStock
                ? "Sin stock disponible para esta selección."
                : `${currentStock} disponibles en inventario.`}
        </p>

        {product.description ? (
          <div className="grid gap-4 text-sm leading-7 text-white/78">
            {splitDescriptionParagraphs(product.description).map((paragraph, index) => (
              <p key={`${product.id}-description-${index}`}>{paragraph}</p>
            ))}
          </div>
        ) : null}

        <ProductAddToCartButton
          productId={product.id}
          productName={product.name}
          isOutOfStock={isOutOfStock}
          variants={product.variants}
          selectedSku={selectedSku}
          onSelectedSkuChange={setManualSelectedSku}
          hideVariantSelector={isAttributeDriven}
        />
      </section>
    </div>
  );
}
