import { redirect } from "next/navigation";
import CheckoutStorage from "@/components/CheckoutStorage";
import { BackLink, OutcomeNotice } from "@/components/PaymentOutcome";
import { loadOutcome } from "@/lib/outcome";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Landing page for failed redirect flows (failure_url). The verdict comes from
 * Checkout.com, not the URL: a payment that actually succeeded is sent to /success.
 * The cart is kept so the customer can retry.
 */
export default async function FailurePage({ searchParams }: Props) {
  const params = await searchParams;
  const outcome = await loadOutcome(params["cko-payment-id"]);
  if (outcome.kind === "success" || outcome.kind === "pending") {
    redirect(`/success?cko-payment-id=${outcome.paymentId}`);
  }

  return (
    <main className="page">
      <header className="masthead">
        <h1>Tri Case</h1>
      </header>
      <section className="panel">
        <h2 className="error">{outcome.kind === "unavailable" ? "We could not check this payment" : "Payment failed"}</h2>
        {outcome.kind === "failed" && (
          <p className="muted">Nothing was charged. Your cart has been kept so you can try again.</p>
        )}
        <OutcomeNotice outcome={outcome} />
        <CheckoutStorage action="unlock" />
        <BackLink label="Back to cart" />
      </section>
    </main>
  );
}
