"use client";

import { useEffect } from "react";

/**
 * Outcome pages are server-rendered; this tiny client component adjusts the
 * browser-side cart state once we know the result.
 * - "clear": the order is paid, so drop the cart and the locked session.
 * - "unlock": the payment failed, so keep the cart but discard the session.
 */
export default function CheckoutStorage({ action }: { action: "clear" | "unlock" }) {
  useEffect(() => {
    try {
      localStorage.removeItem("tricase.checkout");
      if (action === "clear") localStorage.removeItem("tricase.cart");
    } catch {
      // Storage unavailable; nothing to clean up.
    }
  }, [action]);
  return null;
}
