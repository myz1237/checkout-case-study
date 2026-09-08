import CheckoutStorage from "@/components/CheckoutStorage";
import PaymentOutcome, { BackLink } from "@/components/PaymentOutcome";
import { getPayment } from "@/lib/checkout-api";
import { isSuccessful, parsePaymentId } from "@/lib/payment-view";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Landing page for every successful outcome. Synchronous payments navigate
 * here from `onPaymentCompleted`; redirect flows (3DS, iDEAL) arrive here via
 * the success_url passed on the payment session. The result is always read
 * back from Checkout.com rather than trusted from the URL.
 */
export default async function SuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const paymentId = parsePaymentId(params["cko-payment-id"]);
  const payment = paymentId ? await getPayment(paymentId) : null;
  const ok = payment !== null && isSuccessful(payment);

  return (
    <main className="page">
      <header className="masthead">
        <h1>Tri Case</h1>
      </header>
      <section className="panel">
        <h2 className={ok ? "success" : "error"}>
          {ok ? "Thank you, your order is confirmed" : "We could not confirm this payment"}
        </h2>
        <PaymentOutcome payment={payment} paymentId={paymentId} />
        <CheckoutStorage action={ok ? "clear" : "unlock"} />
        <BackLink label={ok ? "Continue shopping" : "Back to cart"} />
      </section>
    </main>
  );
}
