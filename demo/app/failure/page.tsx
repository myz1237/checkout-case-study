import { redirect } from "next/navigation";
import CheckoutStorage from "@/components/CheckoutStorage";
import { BackLink, OutcomeNotice } from "@/components/PaymentOutcome";
import { intlLocale } from "@/lib/locales";
import { loadOutcome, outcomeQuery } from "@/lib/outcome";
import { serverLocale } from "@/lib/server-locale";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Landing page for failed redirect flows (failure_url). The verdict comes from
 * Checkout.com, not the URL: a payment that actually succeeded is sent to /success.
 * The cart is kept so the customer can retry.
 */
export default async function FailurePage({ searchParams }: Props) {
  const [params, { locale, t }] = await Promise.all([searchParams, serverLocale()]);
  const outcome = await loadOutcome(params["cko-payment-id"], params.market);
  if (outcome.kind === "success" || outcome.kind === "pending") {
    redirect(`/success?${outcomeQuery(outcome.paymentId, outcome.market)}`);
  }

  return (
    <main className="page">
      <header className="masthead">
        <h1>Tri Case</h1>
      </header>
      <section className="panel">
        <h2 className="error">{outcome.kind === "unavailable" ? t("failed_check_title") : t("failed_title")}</h2>
        {outcome.kind === "failed" && <p className="muted">{t("failed_note")}</p>}
        <OutcomeNotice outcome={outcome} locale={intlLocale(locale)} t={t} />
        <CheckoutStorage action="unlock" />
        <BackLink label={t("back_to_cart")} />
      </section>
    </main>
  );
}
