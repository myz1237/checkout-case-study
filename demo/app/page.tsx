"use client";

import { useState } from "react";
import FlowCheckout from "@/components/FlowCheckout";

type Session = Record<string, unknown> & { id: string };

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function startPayment() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payment-sessions", { method: "POST" });
      if (!res.ok) throw new Error(`Could not create payment session (${res.status})`);
      setSession(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <header className="masthead">
        <h1>Tri Case</h1>
        <p className="muted">iPhone cases · Hong Kong & the Netherlands</p>
      </header>

      <section className="panel">
        <h2>Order total: HK$199.00</h2>
        {!session && (
          <button className="btn" onClick={startPayment} disabled={busy}>
            {busy ? "Preparing…" : "Pay"}
          </button>
        )}
        {error && <p className="error">{error}</p>}
        {session && !paymentId && (
          <FlowCheckout
            paymentSession={session}
            onPaymentCompleted={(p) => setPaymentId(p.id)}
            onError={(e) => setError(e.message)}
          />
        )}
        {paymentId && (
          <p className="success">
            Payment approved (synchronous). Payment id: <code>{paymentId}</code>
          </p>
        )}
      </section>
    </main>
  );
}
