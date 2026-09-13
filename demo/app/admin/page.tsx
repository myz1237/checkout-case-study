import Logo from "@/components/Logo";
import { PaymentDetailsList } from "@/components/PaymentOutcome";
import RefundForm from "@/components/RefundForm";
import { lookupPayment } from "@/lib/admin";
import type { Currency } from "@/lib/catalog";
import { translator } from "@/lib/i18n";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Staff area (Basic Auth via proxy.ts): look a payment up by order reference or payment id and refund it. */
export default async function AdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const t = translator("en");
  const found = q ? await lookupPayment(q).catch(() => null) : null;

  return (
    <main className="page">
      <header className="masthead">
        <div className="brand">
          <Logo size={44} />
          <div>
            <h1>Tri Case</h1>
            <p className="muted">Staff area · refunds</p>
          </div>
        </div>
      </header>

      <section className="panel">
        <h2>Find a payment</h2>
        <form className="lookup" method="get" action="/admin">
          <label>
            Order reference or payment id
            <input name="q" defaultValue={q} placeholder="ORD-1788919031068 or pay_…" autoComplete="off" />
          </label>
          <button className="btn" type="submit">
            Look up
          </button>
        </form>
        <p className="muted">References appear in the webhook log, the Dashboard and the customer&apos;s confirmation.</p>
      </section>

      {q && !found && (
        <section className="panel">
          <p className="error">No payment matches &ldquo;{q}&rdquo; on any configured account.</p>
        </section>
      )}

      {found && (
        <section className="panel" data-testid="admin-payment">
          <h2>Payment</h2>
          <PaymentDetailsList payment={found.payment} locale="en-HK" t={t} refunded={found.refunded} />
          <p className="muted">Account: {found.market ?? "default"} credentials</p>
          {found.refundable > 0 ? (
            <RefundForm
              key={found.refundable}
              paymentId={found.payment.id}
              market={found.market}
              currency={found.payment.currency as Currency}
              localeId="en"
              refundable={found.refundable}
            />
          ) : (
            <p className="muted">Nothing left to refund on this payment.</p>
          )}
        </section>
      )}
    </main>
  );
}
