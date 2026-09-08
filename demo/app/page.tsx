"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import CartSummary from "@/components/CartSummary";
import Logo from "@/components/Logo";
import CurrencySelect from "@/components/CurrencySelect";
import CustomerForm from "@/components/CustomerForm";
import FlowCheckout from "@/components/FlowCheckout";
import LanguageSelect from "@/components/LanguageSelect";
import MarketSwitch from "@/components/MarketSwitch";
import ProductGrid from "@/components/ProductGrid";
import { usePersistentState } from "@/hooks/usePersistentState";
import { addToCart, priceCart, setQuantity, type CartLine } from "@/lib/cart";
import { EMPTY_CUSTOMER, isCustomerValid, normalizeCustomer, type Customer } from "@/lib/customer";
import type { Currency } from "@/lib/catalog";
import { isCartLines, isCheckoutState, isCurrencyCode, isCustomer, isLocale, isMarket, type CheckoutState } from "@/lib/guards";
import { LOCALE_COOKIE, translator, type MessageKey } from "@/lib/i18n";
import { intlLocale, resolveLocale, type LocaleId } from "@/lib/locales";
import { DEFAULT_MARKET, MARKETS, resolveCurrency, type MarketId } from "@/lib/markets";

const NO_CHECKOUT: CheckoutState = { locked: false, session: null, publicKey: null };
const EMPTY_LINES: CartLine[] = [];

export default function Home() {
  const [marketId, setMarketId] = usePersistentState<MarketId>("tricase.market", DEFAULT_MARKET, "local", isMarket);
  const [storedLocale, setStoredLocale] = usePersistentState<string>("tricase.locale", "", "local", isLocale);
  const [storedCurrency, setStoredCurrency] = usePersistentState<string>("tricase.currency", "", "local", isCurrencyCode);
  const [lines, setLines, cartReady] = usePersistentState<CartLine[]>("tricase.cart", EMPTY_LINES, "local", isCartLines);
  const [customer, setCustomer] = usePersistentState<Customer>("tricase.customer", EMPTY_CUSTOMER, "local", isCustomer);
  const [touched, setTouched] = useState(false);
  const [checkout, setCheckout] = usePersistentState<CheckoutState>("tricase.checkout", NO_CHECKOUT, "local", isCheckoutState);
  const requestId = useRef(0);
  const router = useRouter();
  const [error, setError] = useState<{ key: MessageKey; vars?: Record<string, string | number> } | null>(null);
  const [busy, setBusy] = useState(false);
  const [relocking, setRelocking] = useState(false);

  const market = MARKETS[marketId] ?? MARKETS[DEFAULT_MARKET];
  const currency: Currency = resolveCurrency(market, storedCurrency);
  const localeId: LocaleId = resolveLocale(market, storedLocale);
  const locale = intlLocale(localeId);
  const t = translator(localeId);
  const priced = priceCart(lines, currency);
  const locked = checkout.locked && checkout.session !== null;
  const frozen = locked || busy || relocking;
  const customerValid = isCustomerValid(customer);

  useEffect(() => {
    document.cookie = `${LOCALE_COOKIE}=${localeId}; path=/; max-age=31536000; samesite=lax`;
  }, [localeId]);

  async function startCheckout(currencyOverride?: Currency) {
    setTouched(true);
    if (!customerValid) return;
    const id = ++requestId.current;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payment-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          market: market.id,
          currency: currencyOverride ?? currency,
          customer: normalizeCustomer(customer),
        }),
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
    setStoredCurrency(MARKETS[id].currencies[0]);
  }

  /** A session is priced in one currency: mid-checkout the session is recreated in place and Flow remounted. */
  async function changeCurrency(c: Currency) {
    setStoredCurrency(c);
    if (!locked) return;
    setRelocking(true);
    setCheckout(NO_CHECKOUT);
    await startCheckout(c);
    setRelocking(false);
  }

  return (
    <main className="page">
      <header className="masthead">
        <Logo />
        <h1>Tri Case</h1>
        <p className="muted">{t("tagline")}</p>
        <div className="controls">
          <MarketSwitch value={market.id} disabled={busy} t={t} onChange={changeMarket} />
          <CurrencySelect value={currency} options={market.currencies} label={t("currency")} disabled={busy} onChange={changeCurrency} />
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

        {!locked && !relocking && priced.length > 0 && (
          <button className="btn" onClick={() => startCheckout()} disabled={busy || (touched && !customerValid)}>
            {busy ? t("preparing") : t("checkout")}
          </button>
        )}
        {error && <p className="error">{t(error.key, error.vars)}</p>}

        {relocking && <p className="muted">{t("preparing")}</p>}
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
