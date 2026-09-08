"use client";

import { useEffect } from "react";

/** Adjusts browser-side cart state from a server-rendered outcome page: "clear" drops cart and session, "unlock" keeps the cart. */
export default function CheckoutStorage({ action }: { action: "clear" | "unlock" }) {
  useEffect(() => {
    try {
      localStorage.removeItem("tricase.checkout");
      if (action === "clear") localStorage.removeItem("tricase.cart");
    } catch {}
  }, [action]);
  return null;
}
