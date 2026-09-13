import "server-only";
import type { Credentials } from "./credentials";
import type { PaymentSessionRequest } from "./payment-session";
import type { PaymentAction } from "./refund";

const BASE_URL =
  process.env.NEXT_PUBLIC_CKO_ENVIRONMENT === "production"
    ? "https://api.checkout.com"
    : "https://api.sandbox.checkout.com";

export class CheckoutApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`Checkout.com API responded with ${status}`);
  }
}

async function request<T>(creds: Credentials, path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${creds.secretKey}`,
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
  creds: Credentials,
  body: PaymentSessionRequest,
): Promise<PaymentSessionResponse> {
  return request<PaymentSessionResponse>(creds, "/payment-sessions", {
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


/** Get Payment Details, adding the decline reason from the latest action; null when the account does not know the payment. */
export async function getPayment(creds: Credentials, id: string): Promise<PaymentDetails | null> {
  const path = `/payments/${encodeURIComponent(id)}`;
  try {
    const payment = await request<PaymentDetails>(creds, path, { method: "GET" });
    if (!payment.approved && !payment.response_summary) {
      const actions = await request<PaymentAction[] | null>(creds, `${path}/actions`, { method: "GET" }).catch(() => null);
      payment.response_summary = actions?.[0]?.response_summary;
    }
    return payment;
  } catch (err) {
    if (err instanceof CheckoutApiError && err.status === 404) return null;
    throw err;
  }
}

/** All actions on a payment (authorization, capture, refunds…), newest first. */
export async function getPaymentActions(creds: Credentials, id: string): Promise<PaymentAction[]> {
  return (await request<PaymentAction[] | null>(creds, `/payments/${encodeURIComponent(id)}/actions`, { method: "GET" })) ?? [];
}

export type RefundResponse = { action_id: string; reference?: string };

/** Refund part or all of a captured payment; Checkout.com processes it asynchronously (202). */
export function refundPayment(creds: Credentials, id: string, amount: number, reference: string): Promise<RefundResponse> {
  return request<RefundResponse>(creds, `/payments/${encodeURIComponent(id)}/refunds`, {
    method: "POST",
    body: JSON.stringify({ amount, reference }),
  });
}

/** Payments carrying our order reference, newest first (Get payment list). */
export async function findPaymentsByReference(creds: Credentials, reference: string): Promise<PaymentDetails[]> {
  const res = await request<{ data?: PaymentDetails[] } | null>(creds, `/payments?reference=${encodeURIComponent(reference)}`, { method: "GET" });
  return res?.data ?? [];
}

export type CustomerRecord = { id: string; email: string; instruments?: { id: string; type?: string; last4?: string }[] };

/** Checkout.com creates a customer per email automatically; null when this account has none for the address. */
export async function findCustomerByEmail(creds: Credentials, email: string): Promise<CustomerRecord | null> {
  try {
    return await request<CustomerRecord>(creds, `/customers/${encodeURIComponent(email)}`, { method: "GET" });
  } catch (err) {
    if (err instanceof CheckoutApiError && err.status === 404) return null;
    throw err;
  }
}
