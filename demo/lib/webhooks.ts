import { createHmac, timingSafeEqual } from "node:crypto";

export const WEBHOOK_EVENTS = ["payment_approved", "payment_captured", "payment_declined"] as const;
export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

export type WebhookKeys = { authHeaderKey: string; signatureKey: string };

export type WebhookEvent = {
  id?: string;
  type?: string;
  created_on?: string;
  data?: {
    id?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    response_code?: string;
    response_summary?: string;
    metadata?: { cko_payment_session_id?: string };
  };
};

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Checkout.com signs the raw body with HMAC-SHA256 (hex) using the webhook's signature key. */
export function signWebhook(rawBody: string, signatureKey: string): string {
  return createHmac("sha256", signatureKey).update(rawBody).digest("hex");
}

/** Both checks must pass: the shared Authorization header and the body signature. */
export function verifyWebhook(
  headers: { authorization: string | null; signature: string | null },
  rawBody: string,
  keys: WebhookKeys,
): { ok: true } | { ok: false; reason: "authorization" | "signature" } {
  if (!headers.authorization || !safeEqual(headers.authorization, keys.authHeaderKey)) {
    return { ok: false, reason: "authorization" };
  }
  if (!headers.signature || !safeEqual(headers.signature.toLowerCase(), signWebhook(rawBody, keys.signatureKey))) {
    return { ok: false, reason: "signature" };
  }
  return { ok: true };
}

export function isTrackedEvent(type: unknown): type is WebhookEventType {
  return typeof type === "string" && (WEBHOOK_EVENTS as readonly string[]).includes(type);
}

/** One-line summary for the console. */
export function describeEvent(event: WebhookEvent): string {
  const d = event.data ?? {};
  const amount = typeof d.amount === "number" && d.currency ? `${(d.amount / 100).toFixed(2)} ${d.currency}` : "";
  const outcome = d.response_code ? ` ${d.response_code}${d.response_summary ? ` ${d.response_summary}` : ""}` : "";
  return `${event.type ?? "unknown"} ${d.id ?? "?"} ${d.reference ?? ""} ${amount}${outcome}`.replace(/\s+/g, " ").trim();
}
