/** Public origin for the session's redirect URLs: SITE_URL, then proxy headers, then the request URL. */
export function siteOrigin(req: Request): string {
  const configured = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}
