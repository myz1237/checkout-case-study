/**
 * The public origin of the storefront, used for the redirect URLs on the payment session.
 * Precedence: explicit SITE_URL env, then proxy headers, then the request URL.
 * `req.url` alone is not enough behind a reverse proxy running `next start`.
 */
export function siteOrigin(req: Request): string {
  const configured = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}
