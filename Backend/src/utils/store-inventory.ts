export interface StoreInventoryVariant {
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export interface StoreInventoryProduct {
  name: string;
  basePrice: number;
  stock: number;
  isActive: boolean;
  variants: StoreInventoryVariant[];
}

export interface StorePurchaseSelection {
  quantity: number;
  variantSku?: string;
}

export interface StoreResolvedSelection {
  variantName?: string;
  unitPrice: number;
  subtotal: number;
  stockAdjustment: {
    quantity: number;
    variantSku?: string;
  };
}

export function resolveProductSelection(
  product: StoreInventoryProduct,
  selection: StorePurchaseSelection,
): StoreResolvedSelection {
  if (!product.isActive) {
    throw new Error(`El producto ${product.name} no está disponible para la venta.`);
  }

  if (!Number.isInteger(selection.quantity) || selection.quantity < 0) {
    throw new Error("La cantidad debe ser un entero mayor o igual a 0.");
  }

  if (product.variants.length > 0) {
    if (!selection.variantSku) {
      throw new Error(`El producto ${product.name} requiere variantSku.`);
    }

    const variant = product.variants.find((entry) => entry.sku === selection.variantSku);
    if (!variant) {
      throw new Error(`La variante ${selection.variantSku} no existe para ${product.name}.`);
    }

    if (selection.quantity > variant.stock) {
      throw new Error(`Stock insuficiente para ${product.name} (${variant.name}).`);
    }

    return {
      variantName: variant.name,
      unitPrice: variant.price,
      subtotal: variant.price * selection.quantity,
      stockAdjustment: {
        quantity: selection.quantity,
        variantSku: variant.sku,
      },
    };
  }

  if (selection.quantity > product.stock) {
    throw new Error(`Stock insuficiente para ${product.name}.`);
  }

  return {
    unitPrice: product.basePrice,
    subtotal: product.basePrice * selection.quantity,
    stockAdjustment: {
      quantity: selection.quantity,
    },
  };
}

export function getStoreDisplayUnitPrice(product: Pick<StoreInventoryProduct, "basePrice" | "variants">, variantSku?: string) {
  if (variantSku) {
    const variant = product.variants.find((entry) => entry.sku === variantSku);
    if (variant) {
      return Number(variant.price ?? 0);
    }
  }

  return Number(product.basePrice ?? 0);
}