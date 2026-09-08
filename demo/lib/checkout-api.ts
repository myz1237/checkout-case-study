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

/** The subset of Get Payment Details we render on the outcome pages. */
export type PaymentDetails = {
  id: string;
  status: string;
  approved: boolean;
  amount: number;
  currency: string;
  reference?: string;
  response_summary?: string;
  source?: { type?: string; scheme?: string; last4?: string; name?: string };
  "3ds"?: { challenged?: boolean; authentication_response?: string };
};

type PaymentAction = { type: string; response_summary?: string; processed_on?: string };

/**
 * Get Payment Details plus, for unsuccessful payments, the decline reason from
 * the latest action (the details endpoint itself carries no response_summary).
 */
export async function getPayment(id: string): Promise<PaymentDetails | null> {
  const path = `/payments/${encodeURIComponent(id)}`;
  try {
    const payment = await request<PaymentDetails>(path, { method: "GET" });
    if (!payment.approved && !payment.response_summary) {
      const actions = await request<PaymentAction[]>(`${path}/actions`, { method: "GET" }).catch(() => []);
      payment.response_summary = actions[0]?.response_summary;
    }
    return payment;
  } catch (err) {
    if (err instanceof CheckoutApiError && err.status === 404) return null;
    throw err;
  }
}
