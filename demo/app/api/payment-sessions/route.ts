import { NextResponse } from "next/server";
import {
  CheckoutApiError,
  createPaymentSession,
  processingChannelId,
} from "@/lib/checkout-api";
import { buildPaymentSessionRequest } from "@/lib/payment-session";

export async function POST(req: Request) {
  try {
    const origin = new URL(req.url).origin;
    const body = buildPaymentSessionRequest({
      amount: 19900,
      currency: "HKD",
      reference: `ORD-${Date.now()}`,
      country: "HK",
      origin,
      processingChannelId: processingChannelId(),
    });
    const session = await createPaymentSession(body);
    return NextResponse.json(session);
  } catch (err) {
    if (err instanceof CheckoutApiError) {
      console.error("payment session failed", err.status, err.body);
      return NextResponse.json(
        { error: "payment_session_failed", details: err.body },
        { status: 502 },
      );
    }
    console.error(err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
