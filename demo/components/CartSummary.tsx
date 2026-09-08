"use client";

import type { Currency } from "@/lib/catalog";
import { cartTotal, formatMoney, type PricedLine } from "@/lib/cart";

type Props = {
  lines: PricedLine[];
  currency: Currency;
  locale: string;
  locked: boolean;
  onQuantity: (productId: string, quantity: number) => void;
};

export default function CartSummary({ lines, currency, locale, locked, onQuantity }: Props) {
  if (lines.length === 0) return <p className="muted">Your cart is empty.</p>;
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
                  <button aria-label={`Decrease ${l.name}`} onClick={() => onQuantity(l.productId, l.quantity - 1)}>−</button>
                  <span aria-label={`${l.name} quantity`}>{l.quantity}</span>
                  <button aria-label={`Increase ${l.name}`} onClick={() => onQuantity(l.productId, l.quantity + 1)}>+</button>
                </>
              )}
            </td>
            <td className="money">{formatMoney(l.lineTotal, currency, locale)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th colSpan={2}>Total</th>
          <th className="money" data-testid="cart-total">{formatMoney(cartTotal(lines), currency, locale)}</th>
        </tr>
      </tfoot>
    </table>
  );
}
