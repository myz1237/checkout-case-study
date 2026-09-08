import Link from "next/link";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function FailurePage({ searchParams }: Props) {
  const params = await searchParams;
  const paymentId = typeof params["cko-payment-id"] === "string" ? params["cko-payment-id"] : null;

  return (
    <main className="page">
      <header className="masthead">
        <h1>Tri Case</h1>
      </header>
      <section className="panel">
        <h2 className="error">Payment failed</h2>
        {paymentId && (
          <p className="muted">
            Payment id: <code>{paymentId}</code>
          </p>
        )}
        <p>
          <Link href="/">Back to shop</Link>
        </p>
      </section>
    </main>
  );
}
