import Link from "next/link";
import type { PaymentDetails } from "@/lib/checkout-api";
import { formatMoney } from "@/lib/cart";
import type { Currency } from "@/lib/catalog";
import { isSuccessful, paymentMethodLabel } from "@/lib/payment-view";

type Props = { payment: PaymentDetails | null; paymentId: string | null };

export default function PaymentOutcome({ payment, paymentId }: Props) {
  if (!paymentId) {
    return <p className="muted">No payment reference was provided.</p>;
  }
  if (!payment) {
    return (
      <p className="muted">
        We could not find payment <code>{paymentId}</code>.
      </p>
    );
  }
  const ok = isSuccessful(payment);
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

export function BackLink({ label }: { label: string }) {
  return (
    <p>
      <Link href="/" className="btn btn-ghost">
        {label}
      </Link>
    </p>
  );
}
