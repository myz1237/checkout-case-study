import "server-only";
import type { PaymentSessionRequest } from "./payment-session";

const BASE_URL =
  process.env.NEXT_PUBLIC_CKO_ENVIRONMENT === "production"
    ? "https://api.checkout.com"
    : "https://api.sandbox.checkout.com";

function secretKey(): string {
  const key = process.env.CKO_SECRET_KEY;
  if (!key) throw new Error("CKO_SECRET_KEY is not set");
  return key;
}

export function processingChannelId(): string {
  const id = process.env.CKO_PROCESSING_CHANNEL_ID;
  if (!id) throw new Error("CKO_PROCESSING_CHANNEL_ID is not set");
  return id;
}

export class CheckoutApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`Checkout.com API responded with ${status}`);
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new CheckoutApiError(res.status, body);
  return body as T;
}

/** The subset of the Payment Session response the browser needs to mount Flow. */
export type PaymentSessionResponse = {
  id: string;
  payment_session_token: string;
  payment_session_secret: string;
  _links: Record<string, { href: string }>;
};

export function createPaymentSession(
  body: PaymentSessionRequest,
): Promise<PaymentSessionResponse> {
  return request<PaymentSessionResponse>("/payment-sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
