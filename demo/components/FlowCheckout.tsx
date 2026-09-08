"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadCheckoutWebComponents,
  type CheckoutError,
  type Component,
  type PayPaymentSessionSuccessfulResponse,
} from "@checkout.com/checkout-web-components";

type Props = {
  paymentSession: Record<string, unknown>;
  /** Pre-fills Flow's cardholder name field (shown at the top of the card form). */
  cardholderName?: string;
  onPaymentCompleted: (payment: PayPaymentSessionSuccessfulResponse) => void;
  onError?: (error: CheckoutError) => void;
};

/**
 * Mounts Checkout.com Flow into a div. The component script is fetched at
 * runtime from the Checkout.com CDN by the official loader; nothing that
 * touches card data is bundled or hosted by us.
 */
export default function FlowCheckout({
  paymentSession,
  cardholderName,
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
          publicKey: process.env.NEXT_PUBLIC_CKO_PUBLIC_KEY ?? "",
          environment:
            process.env.NEXT_PUBLIC_CKO_ENVIRONMENT === "production"
              ? "production"
              : "sandbox",
          paymentSession,
          componentOptions: {
            card: {
              displayCardholderName: "top",
              data: cardholderName ? { cardholderName } : undefined,
            },
          },
          onReady: () => setStatus("ready"),
          onPaymentCompleted: (_c, payment) => completedRef.current(payment),
          onError: (_c, error) => {
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
  }, [paymentSession, cardholderName]);

  return (
    <div className="flow-wrapper">
      {status === "loading" && <p className="muted">Loading payment options…</p>}
      {status === "failed" && (
        <p className="error">Payment options could not be loaded. Please refresh.</p>
      )}
      <div ref={containerRef} id="flow-container" />
    </div>
  );
}
