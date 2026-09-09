import { redirect } from "next/navigation";
import CheckoutStorage from "@/components/CheckoutStorage";
import Logo from "@/components/Logo";
import { BackLink, OutcomeNotice } from "@/components/PaymentOutcome";
import RefundForm from "@/components/RefundForm";
import type { Currency } from "@/lib/catalog";
import { intlLocale } from "@/lib/locales";
import { loadOutcome, outcomeQuery } from "@/lib/outcome";
import { serverLocale } from "@/lib/server-locale";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Success landing page (sync navigation and success_url redirects); the verdict is read back from Checkout.com, never the URL. */
export default async function SuccessPage({ searchParams }: Props) {
  const [params, { locale, t }] = await Promise.all([searchParams, serverLocale()]);
  const outcome = await loadOutcome(params["cko-payment-id"], params.market);
  if (outcome.kind === "failed") redirect(`/failure?${outcomeQuery(outcome.paymentId, outcome.market)}`);

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
        <div className="brand">
          <Logo size={44} />
          <h1>Tri Case</h1>
        </div>
      </header>
      <section className="panel">
        <h2 className={paid ? "success" : "error"}>{heading}</h2>
        {outcome.kind === "pending" && <p className="muted">{t("pending_note")}</p>}
        <OutcomeNotice outcome={outcome} locale={intlLocale(locale)} t={t} />
        {outcome.kind === "success" && outcome.refund && outcome.refund.refundable > 0 && (
          <RefundForm
            key={outcome.refund.refundable}
            paymentId={outcome.paymentId}
            market={outcome.market}
            currency={outcome.payment.currency as Currency}
            localeId={locale}
            refundable={outcome.refund.refundable}
          />
        )}
        <CheckoutStorage action={paid ? "clear" : "unlock"} />
        <BackLink label={paid ? t("continue_shopping") : t("back_to_cart")} />
      </section>
    </main>
  );
}
