"use client";

import type { Currency } from "@/lib/catalog";
import { cartTotal, formatMoney, type PricedLine } from "@/lib/cart";
import type { Translate } from "@/lib/i18n";

type Props = {
  lines: PricedLine[];
  currency: Currency;
  locale: string;
  locked: boolean;
  t: Translate;
  onQuantity: (productId: string, quantity: number) => void;
};

export default function CartSummary({ lines, currency, locale, locked, t, onQuantity }: Props) {
  if (lines.length === 0) return <p className="muted">{t("cart_empty")}</p>;
  return (
    <table className="cart">
      <tbody>
        {lines.map((l) => (
          <tr key={l.productId}>
            <td>{l.name}</td>
            <td className="qty">
              {locked ? (
                <span>× {l.quantity}</span>
              ) : (
                <>
                  <button aria-label={t("decrease", { name: l.name })} onClick={() => onQuantity(l.productId, l.quantity - 1)}>−</button>
                  <span aria-label={t("quantity", { name: l.name })}>{l.quantity}</span>
                  <button aria-label={t("increase", { name: l.name })} onClick={() => onQuantity(l.productId, l.quantity + 1)}>+</button>
                </>
              )}
            </td>
            <td className="money">{formatMoney(l.lineTotal, currency, locale)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th colSpan={2}>{t("total")}</th>
          <th className="money" data-testid="cart-total">{formatMoney(cartTotal(lines), currency, locale)}</th>
        </tr>
      </tfoot>
    </table>
  );
}
