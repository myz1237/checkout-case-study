"use client";

import { PRODUCTS, type Currency } from "@/lib/catalog";
import { formatMoney } from "@/lib/cart";
import CaseArt from "./CaseArt";

type Props = {
  currency: Currency;
  locale: string;
  disabled: boolean;
  onAdd: (productId: string) => void;
};

export default function ProductGrid({ currency, locale, disabled, onAdd }: Props) {
  return (
    <section className="grid" aria-label="Products">
      {PRODUCTS.map((p) => (
        <article key={p.id} className="product">
          <CaseArt color={p.color} title={p.name} />
          <h3>{p.name}</h3>
          <p className="muted">{p.description}</p>
          <div className="row">
            <strong>{formatMoney(p.prices[currency], currency, locale)}</strong>
            <button className="btn btn-small" disabled={disabled} onClick={() => onAdd(p.id)}>
              Add
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
