"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/cart";
import type { Currency } from "@/lib/catalog";
import { translator } from "@/lib/i18n";
import { intlLocale, type LocaleId } from "@/lib/locales";
import type { MarketId } from "@/lib/markets";
import { parseRefundAmount } from "@/lib/refund";

type Props = {
  paymentId: string;
  market: MarketId | null;
  currency: Currency;
  localeId: LocaleId;
  refundable: number;
};

/** Refund control for the staff area; posts to the Basic-Auth-protected admin endpoint. */
export default function RefundForm({ paymentId, market, currency, localeId, refundable }: Props) {
  const router = useRouter();
  const t = translator(localeId);
  const locale = intlLocale(localeId);
  const [value, setValue] = useState((refundable / 100).toFixed(2));
  const [state, setState] = useState<{ kind: "idle" } | { kind: "busy" } | { kind: "done"; status: string } | { kind: "error"; message: string }>({ kind: "idle" });

  const minor = parseRefundAmount(value);
  const invalid = minor === null || minor > refundable;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid || minor === null) return;
    setState({ kind: "busy" });
    try {
      const res = await fetch("/api/admin/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, amount: minor, market }),
      });
      const data = (await res.json().catch(() => ({}))) as { status?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setState({ kind: "done", status: data.status ?? "" });
      router.refresh();
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "unknown" });
    }
  }

  return (
    <form className="refund" onSubmit={submit} data-testid="refund-form">
      <h3>{t("refund_title")}</h3>
      <p className="muted">{t("refund_hint", { max: formatMoney(refundable, currency, locale) })}</p>
      <div className="refund-row">
        <label>
          {t("refund_amount")} ({currency})
          <input
            name="refund-amount"
            inputMode="decimal"
            value={value}
            disabled={state.kind === "busy"}
            aria-invalid={invalid}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <button className="btn" type="submit" disabled={invalid || state.kind === "busy"}>
          {state.kind === "busy" ? t("refund_processing") : t("refund_button")}
        </button>
      </div>
      {state.kind === "done" && <p className="success">{t("refund_done", { status: state.status })}</p>}
      {state.kind === "error" && <p className="error">{t("refund_failed", { code: state.message })}</p>}
    </form>
  );
}
