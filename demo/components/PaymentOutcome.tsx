import Link from "next/link";
import type { PaymentDetails } from "@/lib/checkout-api";
import { formatMoney } from "@/lib/cart";
import type { Currency } from "@/lib/catalog";
import type { Translate } from "@/lib/i18n";
import type { Outcome } from "@/lib/outcome";
import { paymentMethodLabel } from "@/lib/payment-view";

export function PaymentDetailsList({ payment, locale, t }: { payment: PaymentDetails; locale: string; t: Translate }) {
  const ok = payment.approved;
  return (
    <dl className="details" data-testid="payment-details">
      <dt>{t("status")}</dt>
      <dd className={ok ? "success" : "error"}>{payment.status}</dd>
      <dt>{t("amount")}</dt>
      <dd>{formatMoney(payment.amount, payment.currency as Currency, locale)}</dd>
      <dt>{t("method")}</dt>
      <dd>{paymentMethodLabel(payment)}</dd>
      <dt>{t("reference")}</dt>
      <dd>{payment.reference ?? "—"}</dd>
      <dt>{t("payment_id")}</dt>
      <dd>
        <code>{payment.id}</code>
      </dd>
      {!ok && payment.response_summary && (
        <>
          <dt>{t("reason")}</dt>
          <dd>{payment.response_summary}</dd>
        </>
      )}
    </dl>
  );
}

/** Body shared by the outcome pages for the states that have no payment to show. */
export function OutcomeNotice({ outcome, locale, t }: { outcome: Outcome; locale: string; t: Translate }) {
  switch (outcome.kind) {
    case "missing":
      return <p className="muted">{t("missing_id")}</p>;
    case "not_found":
      return <p className="muted">{t("not_found", { id: outcome.paymentId })}</p>;
    case "unavailable":
      return <p className="muted">{t("unavailable", { id: outcome.paymentId })}</p>;
    default:
      return <PaymentDetailsList payment={outcome.payment} locale={locale} t={t} />;
  }
}

export function BackLink({ label }: { label: string }) {
  return (
    <p>
      <Link href="/" className="btn btn-ghost">
        {label}
      </Link>
    </p>
  );
}
