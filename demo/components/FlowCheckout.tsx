"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadCheckoutWebComponents,
  type CheckoutError,
  type Component,
  type PayPaymentSessionSuccessfulResponse,
} from "@checkout.com/checkout-web-components";
import { flowAppearance } from "@/lib/flow-appearance";
import type { Translate } from "@/lib/i18n";

type Props = {
  paymentSession: Record<string, unknown>;
  /** Public key of the account that created the session. */
  publicKey: string;
  /** Pre-fills Flow's cardholder name field (shown at the top of the card form). */
  cardholderName?: string;
  /** Flow display language; changing it re-initialises Flow on the same session. */
  locale: string;
  t: Translate;
  onPaymentCompleted: (payment: PayPaymentSessionSuccessfulResponse) => void;
  onError?: (error: CheckoutError) => void;
};

/**
 * Mounts Checkout.com Flow into a div. The component script is fetched at
 * runtime from the Checkout.com CDN by the official loader; nothing that
 * touches card data is bundled or hosted by us.
 *
 * Give it a `key` that includes the session id and locale so a change
 * remounts the component (and its loading state) rather than re-initialising
 * Flow inside a live instance.
 */
export default function FlowCheckout({
  paymentSession,
  publicKey,
  cardholderName,
  locale,
  t,
  onPaymentCompleted,
  onError,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  // Keep latest callbacks without re-mounting Flow when they change.
  const completedRef = useRef(onPaymentCompleted);
  const errorRef = useRef(onError);
  useEffect(() => {
    completedRef.current = onPaymentCompleted;
    errorRef.current = onError;
  }, [onPaymentCompleted, onError]);

  useEffect(() => {
    let component: Component | undefined;
    let cancelled = false;

    (async () => {
      try {
        const checkout = await loadCheckoutWebComponents({
          publicKey,
          environment:
            process.env.NEXT_PUBLIC_CKO_ENVIRONMENT === "production"
              ? "production"
              : "sandbox",
          paymentSession,
          locale,
          appearance: flowAppearance,
          componentOptions: {
            card: {
              displayCardholderName: "top",
              data: cardholderName ? { cardholderName } : undefined,
            },
          },
          onReady: () => {
            if (!cancelled) setStatus("ready");
          },
          onPaymentCompleted: (_c, payment) => {
            if (!cancelled) completedRef.current(payment);
          },
          onError: (_c, error) => {
            if (cancelled) return;
            // Declines are already explained inline by Flow, and the customer can retry there.
            if (error.code === "payment_request_declined") return;
            console.error("Flow error", error);
            errorRef.current?.(error);
          },
        });
        if (cancelled || !containerRef.current) return;
        component = checkout.create("flow");
        component.mount(containerRef.current);
      } catch (err) {
        console.error("Failed to load Flow", err);
        if (!cancelled) setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
      component?.unmount();
    };
  }, [paymentSession, publicKey, cardholderName, locale]);

  return (
    <div className="flow-wrapper">
      {status === "loading" && <p className="muted">{t("loading_payment")}</p>}
      {status === "failed" && <p className="error">{t("flow_failed")}</p>}
      <div ref={containerRef} id="flow-container" />
    </div>
  );
}
