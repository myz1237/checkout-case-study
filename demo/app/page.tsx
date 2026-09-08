"use client";

import { useCallback, useState } from "react";
import CartSummary from "@/components/CartSummary";
import FlowCheckout from "@/components/FlowCheckout";
import ProductGrid from "@/components/ProductGrid";
import { usePersistentState } from "@/hooks/usePersistentState";
import { addToCart, priceCart, setQuantity, type CartLine } from "@/lib/cart";

type Session = Record<string, unknown> & { id: string };
type Checkout = { locked: boolean; session: Session | null };

const CURRENCY = "HKD";
const LOCALE = "en";

export default function Home() {
  const [lines, setLines, cartReady] = usePersistentState<CartLine[]>("tricase.cart", []);
  const [checkout, setCheckout] = usePersistentState<Checkout>(
    "tricase.checkout",
    { locked: false, session: null },
    "session",
  );
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const priced = priceCart(lines, CURRENCY);
  const locked = checkout.locked && checkout.session !== null;

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payment-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      if (!res.ok) throw new Error(`Could not create payment session (${res.status})`);
      setCheckout({ locked: true, session: await res.json() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  const editCart = useCallback(() => {
    setCheckout({ locked: false, session: null });
    setError(null);
  }, [setCheckout]);

  return (
    <main className="page">
      <header className="masthead">
        <h1>Tri Case</h1>
        <p className="muted">iPhone cases · Hong Kong & the Netherlands</p>
      </header>

      <ProductGrid
        currency={CURRENCY}
        locale={LOCALE}
        disabled={locked}
        onAdd={(id) => setLines((prev) => addToCart(prev, id))}
      />

      <section className="panel" aria-label="Cart">
        <h2>Your cart</h2>
        {cartReady && (
          <CartSummary
            lines={priced}
            currency={CURRENCY}
            locale={LOCALE}
            locked={locked}
            onQuantity={(id, q) => setLines((prev) => setQuantity(prev, id, q))}
          />
        )}

        {!locked && priced.length > 0 && (
          <button className="btn" onClick={startCheckout} disabled={busy}>
            {busy ? "Preparing…" : "Checkout"}
          </button>
        )}
        {error && <p className="error">{error}</p>}

        {locked && !paymentId && (
          <>
            <button className="btn btn-ghost" onClick={editCart}>
              Edit cart
            </button>
            <FlowCheckout
              paymentSession={checkout.session!}
              onPaymentCompleted={(p) => setPaymentId(p.id)}
              onError={(e) => setError(e.message)}
            />
          </>
        )}
        {paymentId && (
          <p className="success">
            Payment approved (synchronous). Payment id: <code>{paymentId}</code>
          </p>
        )}
      </section>
    </main>
  );
}
