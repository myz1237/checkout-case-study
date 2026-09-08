#!/usr/bin/env node
/**
 * Registers a domain for Apple Pay on the Checkout.com account behind CKO_SECRET_KEY.
 *
 *   npm run enroll-apple-pay -- your-app.vercel.app
 *
 * Flow renders the Apple Pay button only on an enrolled, publicly reachable HTTPS
 * domain. Run this once per domain (sandbox and production are separate accounts).
 */
const domain = process.argv[2]?.trim();
const secretKey = process.env.CKO_SECRET_KEY;
const environment = process.env.NEXT_PUBLIC_CKO_ENVIRONMENT === "production" ? "production" : "sandbox";
const baseUrl = environment === "production" ? "https://api.checkout.com" : "https://api.sandbox.checkout.com";

if (!domain || domain.includes("/") || domain.startsWith("http")) {
  console.error("Usage: npm run enroll-apple-pay -- <domain>   e.g. tri-case.vercel.app (no scheme, no path)");
  process.exit(2);
}
if (!secretKey) {
  console.error("CKO_SECRET_KEY is not set. Put it in .env.local or export it before running.");
  process.exit(2);
}

const res = await fetch(`${baseUrl}/applepay/enrollments`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({ domain }),
});
const body = await res.text();

if (res.ok) {
  console.log(`Enrolled ${domain} for Apple Pay (${environment}).`);
  if (body) console.log(body);
  console.log("Open the site in Safari on an Apple Pay capable device: Flow now shows the Apple Pay button.");
  process.exit(0);
}

console.error(`Enrollment failed: HTTP ${res.status}${body ? ` ${body}` : ""}`);
if (res.status === 401) {
  console.error(
    [
      "",
      "The secret key was rejected for this endpoint. The key must carry the",
      "`vault:apme-enrollment` scope (Dashboard > Developers > Keys > edit the key).",
      "The shared case-study sandbox key does not have it; the account owner has to",
      "grant the scope or enrol the domain from their side.",
    ].join("\n"),
  );
} else if (res.status === 422) {
  console.error("\nThe domain was not accepted. Use the bare host name (no https://, no path).");
}
process.exit(1);
