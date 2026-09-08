/** Hard-coded catalogue. Prices are in minor units per currency. */

export type Currency = "HKD" | "EUR" | "USD";

export const CURRENCIES: Currency[] = ["HKD", "EUR", "USD"];

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (CURRENCIES as string[]).includes(value);
}

export type Product = {
  id: string;
  name: string;
  description: string;
  color: string;
  prices: Record<Currency, number>;
};

export const PRODUCTS: Product[] = [
  {
    id: "moss-silicone",
    name: "Moss Silicone Case",
    description: "Soft-touch silicone with a microfibre lining.",
    color: "#8C9E6E",
    prices: { HKD: 19900, EUR: 2495, USD: 2599 },
  },
  {
    id: "forest-leather",
    name: "Forest Leather Case",
    description: "Full-grain leather that darkens with use.",
    color: "#323416",
    prices: { HKD: 29900, EUR: 3495, USD: 3899 },
  },
  {
    id: "paper-clear",
    name: "Paper Clear Case",
    description: "Slim, yellowing-resistant polycarbonate shell.",
    color: "#FFFFFD",
    prices: { HKD: 14900, EUR: 1795, USD: 1899 },
  },
  {
    id: "tri-grip",
    name: "Tri Grip Case",
    description: "Textured grip with raised camera guard.",
    color: "#5D6B3F",
    prices: { HKD: 24900, EUR: 2995, USD: 3199 },
  },
];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
