import { NextResponse } from "next/server";
import { describeEvent, isTrackedEvent, verifyWebhook, type WebhookEvent } from "@/lib/webhooks";

/**
 * Receives Checkout.com webhooks. Verifies the Authorization header and the
 * Cko-Signature HMAC before trusting the body, logs the three tracked events,
 * and acknowledges everything else so Checkout.com does not retry.
 */
export async function POST(req: Request) {
  const authHeaderKey = process.env.CKO_WH_AUTH_HEADER_KEY;
  const signatureKey = process.env.CKO_WH_SIGN_KEY;
  if (!authHeaderKey || !signatureKey) {
    console.error("webhook: CKO_WH_AUTH_HEADER_KEY / CKO_WH_SIGN_KEY not set");
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const verdict = verifyWebhook(
    { authorization: req.headers.get("authorization"), signature: req.headers.get("cko-signature") },
    rawBody,
    { authHeaderKey, signatureKey },
  );
  if (!verdict.ok) {
    console.warn(`webhook rejected: bad ${verdict.reason}`);
    return NextResponse.json({ error: `invalid_${verdict.reason}` }, { status: 401 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (isTrackedEvent(event.type)) {
    console.log(`webhook ${describeEvent(event)}`);
    console.log(JSON.stringify(event, null, 2));
  } else {
    console.log(`webhook ignored: ${event.type ?? "unknown"}`);
  }
  return NextResponse.json({ received: true });
}
