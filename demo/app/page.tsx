"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import CartSummary from "@/components/CartSummary";
import CustomerForm from "@/components/CustomerForm";
import FlowCheckout from "@/components/FlowCheckout";
import LanguageSelect from "@/components/LanguageSelect";
import MarketSwitch from "@/components/MarketSwitch";
import ProductGrid from "@/components/ProductGrid";
import { usePersistentState } from "@/hooks/usePersistentState";
import { addToCart, priceCart, setQuantity, type CartLine } from "@/lib/cart";
import { EMPTY_CUSTOMER, isCustomerValid, normalizeCustomer, type Customer } from "@/lib/customer";
import { intlLocale, resolveLocale, type LocaleId } from "@/lib/locales";
import { DEFAULT_MARKET, MARKETS, type MarketId } from "@/lib/markets";

type Session = Record<string, unknown> & { id: string };
type Checkout = { locked: boolean; session: Session | null };

export default function Home() {
  const [marketId, setMarketId] = usePersistentState<MarketId>("tricase.market", DEFAULT_MARKET);
  const [storedLocale, setStoredLocale] = usePersistentState<string>("tricase.locale", "");
  const [lines, setLines, cartReady] = usePersistentState<CartLine[]>("tricase.cart", []);
  const [customer, setCustomer] = usePersistentState<Customer>("tricase.customer", EMPTY_CUSTOMER);
  const [touched, setTouched] = useState(false);
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
  const localeId: LocaleId = resolveLocale(market, storedLocale);
  const locale = intlLocale(localeId);
  const priced = priceCart(lines, currency);
  const locked = checkout.locked && checkout.session !== null;
  const customerValid = isCustomerValid(customer);

  async function startCheckout() {
    setTouched(true);
    if (!customerValid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payment-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, market: market.id, customer: normalizeCustomer(customer) }),
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
    // Each market has its own default language; a switch should not carry the old one over.
    setStoredLocale(MARKETS[id].defaultLocale);
  }

  return (
    <main className="page">
      <header className="masthead">
        <h1>Tri Case</h1>
        <p className="muted">iPhone cases · Hong Kong & the Netherlands</p>
        <div className="controls">
          <MarketSwitch value={market.id} onChange={changeMarket} />
          <LanguageSelect value={localeId} options={market.locales} onChange={setStoredLocale} />
        </div>
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

        {priced.length > 0 && (
          <CustomerForm value={customer} disabled={locked} showErrors={touched} onChange={setCustomer} />
        )}

        {!locked && priced.length > 0 && (
          <button className="btn" onClick={startCheckout} disabled={busy || (touched && !customerValid)}>
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
              cardholderName={normalizeCustomer(customer).name}
              locale={localeId}
              onPaymentCompleted={(p) => router.push(`/success?cko-payment-id=${encodeURIComponent(p.id)}`)}
              onError={() => setError("Something went wrong with the payment. Please try again.")}
            />
          </>
        )}
      </section>
    </main>
  );
}
