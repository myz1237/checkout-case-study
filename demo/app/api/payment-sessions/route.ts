import { NextResponse } from "next/server";
import { priceCart } from "@/lib/cart";
import { CheckoutApiError, createPaymentSession } from "@/lib/checkout-api";
import { credentialsFor } from "@/lib/credentials";
import { isCustomerValid, normalizeCustomer, type Customer } from "@/lib/customer";
import { isCartLines } from "@/lib/guards";
import { getMarket } from "@/lib/markets";
import { buildPaymentSessionRequest } from "@/lib/payment-session";
import { siteOrigin } from "@/lib/site-origin";

type Body = { lines?: unknown; market?: unknown; customer?: unknown };

function parseCustomer(body: Body): Customer | null {
  if (typeof body.customer !== "object" || body.customer === null) return null;
  const { name, email } = body.customer as Record<string, unknown>;
  if (typeof name !== "string" || typeof email !== "string") return null;
  const customer = normalizeCustomer({ name, email });
  return isCustomerValid(customer) ? customer : null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const market = getMarket(body.market);
    if (!isCartLines(body.lines)) {
      return NextResponse.json({ error: "lines_invalid" }, { status: 400 });
    }
    const lines = priceCart(body.lines, market.currency);
    if (lines.length === 0) {
      return NextResponse.json({ error: "cart_empty" }, { status: 400 });
    }
    const customer = parseCustomer(body);
    if (!customer) {
      return NextResponse.json({ error: "customer_invalid" }, { status: 400 });
    }
    const origin = siteOrigin(req);
    const creds = credentialsFor(market.id);
    const request = buildPaymentSessionRequest({
      market: market.id,
      lines,
      currency: market.currency,
      country: market.country,
      paymentMethods: market.paymentMethods,
      customer,
      reference: `ORD-${Date.now()}`,
      origin,
      processingChannelId: creds.processingChannelId,
    });
    const session = await createPaymentSession(creds, request);
    return NextResponse.json({ session, publicKey: creds.publicKey });
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
