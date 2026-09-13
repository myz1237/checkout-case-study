import { NextResponse } from "next/server";
import { CheckoutApiError, getPayment, getPaymentActions, refundPayment } from "@/lib/checkout-api";
import { allCredentials, credentialsFor, type Credentials } from "@/lib/credentials";
import { isMarketId, MARKETS, type MarketId } from "@/lib/markets";
import { parsePaymentId } from "@/lib/payment-view";
import { refundableAmount, refundedAmount } from "@/lib/refund";

type Body = { paymentId?: unknown; amount?: unknown; market?: unknown };

/**
 * Staff refund (behind Basic Auth, see proxy.ts): refunds part or all of a captured
 * payment, then waits briefly for Checkout.com to apply it so the page can show the new status.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const paymentId = parsePaymentId(body.paymentId);
  if (!paymentId) return NextResponse.json({ error: "payment_id_invalid" }, { status: 400 });
  const amount = typeof body.amount === "number" && Number.isInteger(body.amount) && body.amount > 0 ? body.amount : null;
  if (!amount) return NextResponse.json({ error: "amount_invalid" }, { status: 400 });

  const candidates: Credentials[] = isMarketId(body.market)
    ? [credentialsFor(body.market)]
    : allCredentials(Object.keys(MARKETS) as MarketId[]);

  try {
    let creds: Credentials | null = null;
    let payment = null;
    for (const c of candidates) {
      payment = await getPayment(c, paymentId);
      if (payment) {
        creds = c;
        break;
      }
    }
    if (!payment || !creds) return NextResponse.json({ error: "payment_not_found" }, { status: 404 });

    const before = await getPaymentActions(creds, paymentId);
    const refundable = refundableAmount(payment, before);
    if (amount > refundable) {
      return NextResponse.json({ error: "amount_exceeds_refundable", refundable }, { status: 400 });
    }

    const refund = await refundPayment(creds, paymentId, amount, `${payment.reference ?? paymentId}-refund`);

    const target = refundedAmount(before) + amount;
    let latest = payment;
    let refunded = refundedAmount(before);
    for (let i = 0; i < 8 && refunded < target; i++) {
      await new Promise((r) => setTimeout(r, 750));
      const [p, actions] = await Promise.all([getPayment(creds, paymentId), getPaymentActions(creds, paymentId)]);
      if (p) latest = p;
      refunded = refundedAmount(actions);
    }
    return NextResponse.json({
      action_id: refund.action_id,
      status: latest.status,
      refunded,
      refundable: Math.max(0, payment.amount - refunded),
      settled: refunded >= target,
    });
  } catch (err) {
    if (err instanceof CheckoutApiError) {
      console.error("refund failed", err.status, err.body);
      return NextResponse.json({ error: "refund_failed", details: err.body }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
