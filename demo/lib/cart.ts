import { type Currency, findProduct } from "./catalog";

export type CartLine = { productId: string; quantity: number };

export type PricedLine = CartLine & {
  name: string;
  unitPrice: number;
  lineTotal: number;
};

export const MAX_QUANTITY = 10;

export function addToCart(lines: CartLine[], productId: string): CartLine[] {
  const existing = lines.find((l) => l.productId === productId);
  if (!existing) return [...lines, { productId, quantity: 1 }];
  return setQuantity(lines, productId, existing.quantity + 1);
}

export function setQuantity(
  lines: CartLine[],
  productId: string,
  quantity: number,
): CartLine[] {
  const q = Math.min(MAX_QUANTITY, Math.floor(quantity));
  if (q <= 0) return lines.filter((l) => l.productId !== productId);
  return lines.map((l) => (l.productId === productId ? { ...l, quantity: q } : l));
}

/** Resolve lines against the catalogue; unknown products are dropped. */
export function priceCart(lines: CartLine[], currency: Currency): PricedLine[] {
  return lines.flatMap((line) => {
    const product = findProduct(line.productId);
    if (!product || line.quantity <= 0) return [];
    const unitPrice = product.prices[currency];
    return [{ ...line, name: product.name, unitPrice, lineTotal: unitPrice * line.quantity }];
  });
}

export function cartTotal(priced: PricedLine[]): number {
  return priced.reduce((sum, l) => sum + l.lineTotal, 0);
}

export function formatMoney(minor: number, currency: Currency, locale = "en"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(minor / 100);
}
