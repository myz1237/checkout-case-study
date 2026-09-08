import { NextResponse } from "next/server";
import { priceCart, type CartLine } from "@/lib/cart";
import {
  CheckoutApiError,
  createPaymentSession,
  processingChannelId,
} from "@/lib/checkout-api";
import { isCustomerValid, normalizeCustomer, type Customer } from "@/lib/customer";
import { getMarket } from "@/lib/markets";
import { buildPaymentSessionRequest } from "@/lib/payment-session";

type Body = { lines?: unknown; market?: unknown; customer?: unknown };

function parseCustomer(body: Body): Customer | null {
  if (typeof body.customer !== "object" || body.customer === null) return null;
  const { name, email } = body.customer as Record<string, unknown>;
  if (typeof name !== "string" || typeof email !== "string") return null;
  const customer = normalizeCustomer({ name, email });
  return isCustomerValid(customer) ? customer : null;
}

function parseLines(body: Body): CartLine[] {
  if (!Array.isArray(body.lines)) return [];
  return body.lines.flatMap((l) => {
    if (typeof l !== "object" || l === null) return [];
    const { productId, quantity } = l as Record<string, unknown>;
    if (typeof productId !== "string" || typeof quantity !== "number") return [];
    return [{ productId, quantity }];
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const market = getMarket(body.market);
    // Amounts are always recomputed from the catalogue; the browser only sends ids and quantities.
    const lines = priceCart(parseLines(body), market.currency);
    if (lines.length === 0) {
      return NextResponse.json({ error: "cart_empty" }, { status: 400 });
    }
    const customer = parseCustomer(body);
    if (!customer) {
      return NextResponse.json({ error: "customer_invalid" }, { status: 400 });
    }
    const origin = new URL(req.url).origin;
    const request = buildPaymentSessionRequest({
      lines,
      currency: market.currency,
      country: market.country,
      paymentMethods: market.paymentMethods,
      customer,
      reference: `ORD-${Date.now()}`,
      origin,
      processingChannelId: processingChannelId(),
    });
    const session = await createPaymentSession(request);
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
