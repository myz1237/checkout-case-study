import Link from "next/link";
import type { PaymentDetails } from "@/lib/checkout-api";
import { formatMoney } from "@/lib/cart";
import type { Currency } from "@/lib/catalog";
import type { Outcome } from "@/lib/outcome";
import { paymentMethodLabel } from "@/lib/payment-view";

export function PaymentDetailsList({ payment }: { payment: PaymentDetails }) {
  const ok = payment.approved;
  return (
    <dl className="details" data-testid="payment-details">
      <dt>Status</dt>
      <dd className={ok ? "success" : "error"}>{payment.status}</dd>
      <dt>Amount</dt>
      <dd>{formatMoney(payment.amount, payment.currency as Currency)}</dd>
      <dt>Payment method</dt>
      <dd>{paymentMethodLabel(payment)}</dd>
      <dt>Order reference</dt>
      <dd>{payment.reference ?? "—"}</dd>
      <dt>Payment id</dt>
      <dd>
        <code>{payment.id}</code>
      </dd>
      {!ok && payment.response_summary && (
        <>
          <dt>Reason</dt>
          <dd>{payment.response_summary}</dd>
        </>
      )}
    </dl>
  );
}

/** Body shared by the outcome pages for the states that have no payment to show. */
export function OutcomeNotice({ outcome }: { outcome: Outcome }) {
  switch (outcome.kind) {
    case "missing":
      return <p className="muted">No payment reference was provided.</p>;
    case "not_found":
      return (
        <p className="muted">
          We could not find payment <code>{outcome.paymentId}</code>.
        </p>
      );
    case "unavailable":
      return (
        <p className="muted">
          We could not retrieve payment <code>{outcome.paymentId}</code> right now. If you were charged, you will
          receive a confirmation email; please do not pay again.
        </p>
      );
    default:
      return <PaymentDetailsList payment={outcome.payment} />;
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
