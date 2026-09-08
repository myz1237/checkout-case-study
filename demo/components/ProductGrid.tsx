"use client";

import { PRODUCTS, type Currency } from "@/lib/catalog";
import { formatMoney } from "@/lib/cart";
import type { Translate } from "@/lib/i18n";
import CaseArt from "./CaseArt";

type Props = {
  currency: Currency;
  locale: string;
  disabled: boolean;
  t: Translate;
  onAdd: (productId: string) => void;
};

export default function ProductGrid({ currency, locale, disabled, t, onAdd }: Props) {
  return (
    <section className="grid" aria-label={t("products")}>
      {PRODUCTS.map((p) => (
        <article key={p.id} className="product">
          <CaseArt color={p.color} title={p.name} />
          <h3>{p.name}</h3>
          <p className="muted">{p.description}</p>
          <div className="row">
            <strong>{formatMoney(p.prices[currency], currency, locale)}</strong>
            <button className="btn btn-small" disabled={disabled} onClick={() => onAdd(p.id)}>
              {t("add")}
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
