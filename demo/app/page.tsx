"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { LOCALE_COOKIE, translator, type MessageKey } from "@/lib/i18n";
import { intlLocale, resolveLocale, type LocaleId } from "@/lib/locales";
import { DEFAULT_MARKET, MARKETS, type MarketId } from "@/lib/markets";

const NO_CHECKOUT: CheckoutState = { locked: false, session: null, publicKey: null };
const EMPTY_LINES: CartLine[] = [];

export default function Home() {
  const [marketId, setMarketId] = usePersistentState<MarketId>("tricase.market", DEFAULT_MARKET, "local", isMarket);
  const [storedLocale, setStoredLocale] = usePersistentState<string>("tricase.locale", "", "local", isLocale);
  const [lines, setLines, cartReady] = usePersistentState<CartLine[]>("tricase.cart", EMPTY_LINES, "local", isCartLines);
  const [customer, setCustomer] = usePersistentState<Customer>("tricase.customer", EMPTY_CUSTOMER, "local", isCustomer);
  const [touched, setTouched] = useState(false);
  const [checkout, setCheckout] = usePersistentState<CheckoutState>("tricase.checkout", NO_CHECKOUT, "local", isCheckoutState);
  const requestId = useRef(0);
  const router = useRouter();
  const [error, setError] = useState<{ key: MessageKey; vars?: Record<string, string | number> } | null>(null);
  const [busy, setBusy] = useState(false);

  const market = MARKETS[marketId] ?? MARKETS[DEFAULT_MARKET];
  const currency = market.currency;
  const localeId: LocaleId = resolveLocale(market, storedLocale);
  const locale = intlLocale(localeId);
  const t = translator(localeId);
  const priced = priceCart(lines, currency);
  const locked = checkout.locked && checkout.session !== null;
  const frozen = locked || busy;
  const customerValid = isCustomerValid(customer);

  useEffect(() => {
    document.cookie = `${LOCALE_COOKIE}=${localeId}; path=/; max-age=31536000; samesite=lax`;
  }, [localeId]);

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
      if (!res.ok) throw new Error(String(res.status));
      const { session, publicKey } = await res.json();
      if (id === requestId.current) setCheckout({ locked: true, session, publicKey });
    } catch (err) {
      if (id === requestId.current) {
        setError({ key: "session_error", vars: { status: err instanceof Error ? err.message : "network" } });
      }
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
    editCart();
    setMarketId(id);
    setStoredLocale(MARKETS[id].defaultLocale);
  }

  return (
    <main className="page">
      <header className="masthead">
        <h1>Tri Case</h1>
        <p className="muted">{t("tagline")}</p>
        <div className="controls">
          <MarketSwitch value={market.id} disabled={busy} t={t} onChange={changeMarket} />
          <LanguageSelect value={localeId} options={market.locales} label={t("language")} onChange={setStoredLocale} />
        </div>
      </header>

      <ProductGrid
        currency={currency}
        locale={locale}
        disabled={frozen}
        t={t}
        onAdd={(id) => setLines((prev) => addToCart(prev, id))}
      />

      <section className="panel" aria-label={t("cart")}>
        <h2>{t("cart")}</h2>
        {cartReady && (
          <CartSummary
            lines={priced}
            currency={currency}
            locale={locale}
            locked={frozen}
            t={t}
            onQuantity={(id, q) => setLines((prev) => setQuantity(prev, id, q))}
          />
        )}

        {priced.length > 0 && (
          <CustomerForm value={customer} disabled={frozen} showErrors={touched} t={t} onChange={setCustomer} />
        )}

        {!locked && priced.length > 0 && (
          <button className="btn" onClick={startCheckout} disabled={busy || (touched && !customerValid)}>
            {busy ? t("preparing") : t("checkout")}
          </button>
        )}
        {error && <p className="error">{t(error.key, error.vars)}</p>}

        {locked && (
          <>
            <button className="btn btn-ghost" onClick={editCart}>
              {t("edit_cart")}
            </button>
            <FlowCheckout
              key={`${checkout.session!.id}:${localeId}`}
              paymentSession={checkout.session!}
              publicKey={checkout.publicKey!}
              cardholderName={normalizeCustomer(customer).name}
              locale={localeId}
              t={t}
              onPaymentCompleted={(p) =>
                router.push(`/success?cko-payment-id=${encodeURIComponent(p.id)}&market=${market.id}`)
              }
              onError={(e) => setError({ key: "payment_error", vars: { code: e.code } })}
            />
          </>
        )}
      </section>
    </main>
  );
}
