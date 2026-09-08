import Link from "next/link";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Landing page for redirect-based outcomes (3DS, iDEAL). Checkout.com appends
 * `cko-payment-id` to the success_url we passed when creating the session.
 */
export default async function SuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const paymentId = typeof params["cko-payment-id"] === "string" ? params["cko-payment-id"] : null;

  return (
    <main className="page">
      <header className="masthead">
        <h1>Tri Case</h1>
      </header>
      <section className="panel">
        <h2 className="success">Payment approved</h2>
        {paymentId ? (
          <p>
            Payment id: <code>{paymentId}</code>
          </p>
        ) : (
          <p className="muted">No payment id was provided.</p>
        )}
        <p>
          <Link href="/">Back to shop</Link>
        </p>
      </section>
    </main>
  );
}
