"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import CartSummary from "@/components/CartSummary";
import CustomerForm from "@/components/CustomerForm";
import FlowCheckout from "@/components/FlowCheckout";
import LanguageSelect from "@/components/LanguageSelect";
import MarketSwitch from "@/components/MarketSwitch";
import ProductGrid from "@/components/ProductGrid";
import { usePersistentState } from "@/hooks/usePersistentState";
import { addToCart, priceCart, setQuantity, type CartLine } from "@/lib/cart";
import { EMPTY_CUSTOMER, isCustomerValid, normalizeCustomer, type Customer } from "@/lib/customer";
import { isCartLines, isCheckoutState, isCustomer, isLocale, isMarket, type CheckoutState } from "@/lib/guards";
import { intlLocale, resolveLocale, type LocaleId } from "@/lib/locales";
import { DEFAULT_MARKET, MARKETS, type MarketId } from "@/lib/markets";

const NO_CHECKOUT: CheckoutState = { locked: false, session: null };
const EMPTY_LINES: CartLine[] = [];

export default function Home() {
  const [marketId, setMarketId] = usePersistentState<MarketId>("tricase.market", DEFAULT_MARKET, "local", isMarket);
  const [storedLocale, setStoredLocale] = usePersistentState<string>("tricase.locale", "", "local", isLocale);
  const [lines, setLines, cartReady] = usePersistentState<CartLine[]>("tricase.cart", EMPTY_LINES, "local", isCartLines);
  const [customer, setCustomer] = usePersistentState<Customer>("tricase.customer", EMPTY_CUSTOMER, "local", isCustomer);
  const [touched, setTouched] = useState(false);
  // Same storage as the cart so every tab agrees on whether the checkout is locked.
  const [checkout, setCheckout] = usePersistentState<CheckoutState>("tricase.checkout", NO_CHECKOUT, "local", isCheckoutState);
  const requestId = useRef(0);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const market = MARKETS[marketId] ?? MARKETS[DEFAULT_MARKET];
  const currency = market.currency;
  const localeId: LocaleId = resolveLocale(market, storedLocale);
  const locale = intlLocale(localeId);
  const priced = priceCart(lines, currency);
  const locked = checkout.locked && checkout.session !== null;
  // Nothing that feeds the session may change while it is being created or in use.
  const frozen = locked || busy;
  const customerValid = isCustomerValid(customer);

  async function startCheckout() {
    setTouched(true);
    if (!customerValid) return;
    const id = ++requestId.current;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payment-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, market: market.id, customer: normalizeCustomer(customer) }),
      });
      if (!res.ok) throw new Error(`Could not create payment session (${res.status})`);
      const session = await res.json();
      // Ignore a response that belongs to an earlier attempt (e.g. the market changed meanwhile).
      if (id === requestId.current) setCheckout({ locked: true, session });
    } catch (err) {
      if (id === requestId.current) setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  }

  const editCart = useCallback(() => {
    requestId.current++;
    setBusy(false);
    setCheckout(NO_CHECKOUT);
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
          <MarketSwitch value={market.id} disabled={busy} onChange={changeMarket} />
          <LanguageSelect value={localeId} options={market.locales} onChange={setStoredLocale} />
        </div>
      </header>

      <ProductGrid
        currency={currency}
        locale={locale}
        disabled={frozen}
        onAdd={(id) => setLines((prev) => addToCart(prev, id))}
      />

      <section className="panel" aria-label="Cart">
        <h2>Your cart</h2>
        {cartReady && (
          <CartSummary
            lines={priced}
            currency={currency}
            locale={locale}
            locked={frozen}
            onQuantity={(id, q) => setLines((prev) => setQuantity(prev, id, q))}
          />
        )}

        {priced.length > 0 && (
          <CustomerForm value={customer} disabled={frozen} showErrors={touched} onChange={setCustomer} />
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
              key={`${checkout.session!.id}:${localeId}`}
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
