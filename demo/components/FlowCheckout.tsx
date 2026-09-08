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
  publicKey: string;
  cardholderName?: string;
  locale: string;
  t: Translate;
  onPaymentCompleted: (payment: PayPaymentSessionSuccessfulResponse) => void;
  onError?: (error: CheckoutError) => void;
};

/** Mounts Checkout.com Flow; the component script is loaded from the Checkout.com CDN at runtime. Key it by session id and locale so changes remount it. */
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
