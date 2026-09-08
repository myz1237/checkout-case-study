"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import CartSummary from "@/components/CartSummary";
import FlowCheckout from "@/components/FlowCheckout";
import MarketSwitch from "@/components/MarketSwitch";
import ProductGrid from "@/components/ProductGrid";
import { usePersistentState } from "@/hooks/usePersistentState";
import { addToCart, priceCart, setQuantity, type CartLine } from "@/lib/cart";
import { DEFAULT_MARKET, MARKETS, type MarketId } from "@/lib/markets";

type Session = Record<string, unknown> & { id: string };
type Checkout = { locked: boolean; session: Session | null };

export default function Home() {
  const [marketId, setMarketId] = usePersistentState<MarketId>("tricase.market", DEFAULT_MARKET);
  const [lines, setLines, cartReady] = usePersistentState<CartLine[]>("tricase.cart", []);
  const [checkout, setCheckout] = usePersistentState<Checkout>(
    "tricase.checkout",
    { locked: false, session: null },
    "session",
  );
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const market = MARKETS[marketId] ?? MARKETS[DEFAULT_MARKET];
  const currency = market.currency;
  const locale = market.defaultLocale;
  const priced = priceCart(lines, currency);
  const locked = checkout.locked && checkout.session !== null;

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payment-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, market: market.id }),
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

  function changeMarket(id: MarketId) {
    // A session is priced in one currency; switching market invalidates it.
    editCart();
    setMarketId(id);
  }

  return (
    <main className="page">
      <header className="masthead">
        <h1>Tri Case</h1>
        <p className="muted">iPhone cases · Hong Kong & the Netherlands</p>
        <MarketSwitch value={market.id} onChange={changeMarket} />
      </header>

      <ProductGrid
        currency={currency}
        locale={locale}
        disabled={locked}
        onAdd={(id) => setLines((prev) => addToCart(prev, id))}
      />

      <section className="panel" aria-label="Cart">
        <h2>Your cart</h2>
        {cartReady && (
          <CartSummary
            lines={priced}
            currency={currency}
            locale={locale}
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

        {locked && (
          <>
            <button className="btn btn-ghost" onClick={editCart}>
              Edit cart
            </button>
            <FlowCheckout
              paymentSession={checkout.session!}
              onPaymentCompleted={(p) => router.push(`/success?cko-payment-id=${encodeURIComponent(p.id)}`)}
              onError={() => setError("Something went wrong with the payment. Please try again.")}
            />
          </>
        )}
      </section>
    </main>
  );
}
