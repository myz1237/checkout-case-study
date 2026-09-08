import { redirect } from "next/navigation";
import CheckoutStorage from "@/components/CheckoutStorage";
import { BackLink, OutcomeNotice } from "@/components/PaymentOutcome";
import { intlLocale } from "@/lib/locales";
import { loadOutcome } from "@/lib/outcome";
import { serverLocale } from "@/lib/server-locale";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Landing page for successful outcomes. Synchronous payments navigate here from
 * `onPaymentCompleted`; redirect flows (3DS, iDEAL) arrive via the success_url on
 * the payment session. The result is always read back from Checkout.com, never
 * trusted from the URL: a failed payment is sent to /failure.
 */
export default async function SuccessPage({ searchParams }: Props) {
  const [params, { locale, t }] = await Promise.all([searchParams, serverLocale()]);
  const outcome = await loadOutcome(params["cko-payment-id"]);
  if (outcome.kind === "failed") redirect(`/failure?cko-payment-id=${outcome.paymentId}`);

  const headings = {
    success: "success_title",
    pending: "pending_title",
    missing: "unconfirmed_title",
    not_found: "unconfirmed_title",
    unavailable: "unavailable_title",
  } as const;
  const heading = t(headings[outcome.kind]);
  const paid = outcome.kind === "success" || outcome.kind === "pending";

  return (
    <main className="page">
      <header className="masthead">
        <h1>Tri Case</h1>
      </header>
      <section className="panel">
        <h2 className={paid ? "success" : "error"}>{heading}</h2>
        {outcome.kind === "pending" && <p className="muted">{t("pending_note")}</p>}
        <OutcomeNotice outcome={outcome} locale={intlLocale(locale)} t={t} />
        {/* Paid or pending: the order is placed, drop the cart. Otherwise keep the cart but discard the used session. */}
        <CheckoutStorage action={paid ? "clear" : "unlock"} />
        <BackLink label={paid ? t("continue_shopping") : t("back_to_cart")} />
      </section>
    </main>
  );
}
