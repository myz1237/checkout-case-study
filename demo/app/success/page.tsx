import { redirect } from "next/navigation";
import CheckoutStorage from "@/components/CheckoutStorage";
import { BackLink, OutcomeNotice } from "@/components/PaymentOutcome";
import { loadOutcome } from "@/lib/outcome";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Landing page for successful outcomes. Synchronous payments navigate here from
 * `onPaymentCompleted`; redirect flows (3DS, iDEAL) arrive via the success_url on
 * the payment session. The result is always read back from Checkout.com, never
 * trusted from the URL: a failed payment is sent to /failure.
 */
export default async function SuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const outcome = await loadOutcome(params["cko-payment-id"]);
  if (outcome.kind === "failed") redirect(`/failure?cko-payment-id=${outcome.paymentId}`);

  const heading = {
    success: "Thank you, your order is confirmed",
    pending: "Thank you, your payment is being confirmed",
    missing: "We could not confirm this payment",
    not_found: "We could not confirm this payment",
    unavailable: "We could not confirm this payment right now",
  }[outcome.kind];
  const paid = outcome.kind === "success" || outcome.kind === "pending";

  return (
    <main className="page">
      <header className="masthead">
        <h1>Tri Case</h1>
      </header>
      <section className="panel">
        <h2 className={paid ? "success" : "error"}>{heading}</h2>
        {outcome.kind === "pending" && (
          <p className="muted">Your bank has accepted the payment; we will email you when it is final.</p>
        )}
        <OutcomeNotice outcome={outcome} />
        {/* Paid or pending: the order is placed, drop the cart. Otherwise keep the cart but discard the used session. */}
        <CheckoutStorage action={paid ? "clear" : "unlock"} />
        <BackLink label={paid ? "Continue shopping" : "Back to cart"} />
      </section>
    </main>
  );
}
