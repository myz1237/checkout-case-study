/** Hard-coded catalogue. Prices are in minor units per currency. */

export type Currency = "HKD" | "EUR";

export type Product = {
  id: string;
  name: string;
  description: string;
  /** Fill colour of the placeholder artwork. */
  color: string;
  prices: Record<Currency, number>;
};

export const PRODUCTS: Product[] = [
  {
    id: "moss-silicone",
    name: "Moss Silicone Case",
    description: "Soft-touch silicone with a microfibre lining.",
    color: "#8C9E6E",
    prices: { HKD: 19900, EUR: 2495 },
  },
  {
    id: "forest-leather",
    name: "Forest Leather Case",
    description: "Full-grain leather that darkens with use.",
    color: "#323416",
    prices: { HKD: 29900, EUR: 3495 },
  },
  {
    id: "paper-clear",
    name: "Paper Clear Case",
    description: "Slim, yellowing-resistant polycarbonate shell.",
    color: "#FFFFFD",
    prices: { HKD: 14900, EUR: 1795 },
  },
  {
    id: "tri-grip",
    name: "Tri Grip Case",
    description: "Textured grip with raised camera guard.",
    color: "#5D6B3F",
    prices: { HKD: 24900, EUR: 2995 },
  },
];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
