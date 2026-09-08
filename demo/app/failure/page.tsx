import CheckoutStorage from "@/components/CheckoutStorage";
import PaymentOutcome, { BackLink } from "@/components/PaymentOutcome";
import { getPayment } from "@/lib/checkout-api";
import { parsePaymentId } from "@/lib/payment-view";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Landing page for failed redirect flows (failure_url). The cart is kept so the customer can retry. */
export default async function FailurePage({ searchParams }: Props) {
  const params = await searchParams;
  const paymentId = parsePaymentId(params["cko-payment-id"]);
  const payment = paymentId ? await getPayment(paymentId) : null;

  return (
    <main className="page">
      <header className="masthead">
        <h1>Tri Case</h1>
      </header>
      <section className="panel">
        <h2 className="error">Payment failed</h2>
        <p className="muted">Nothing was charged. Your cart has been kept so you can try again.</p>
        <PaymentOutcome payment={payment} paymentId={paymentId} />
        <CheckoutStorage action="unlock" />
        <BackLink label="Back to cart" />
      </section>
    </main>
  );
}
