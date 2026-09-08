#!/usr/bin/env node
/**
 * Enrols a domain for Apple Pay on the Checkout.com account.
 *   pnpm enroll-apple-pay your-app.vercel.app              # default credentials
 *   pnpm enroll-apple-pay your-app.vercel.app --market NL  # a market's own credentials
 */
const args = process.argv.slice(2);
const marketIdx = args.indexOf("--market");
const market = marketIdx >= 0 ? args[marketIdx + 1]?.toUpperCase() : null;
const domain = args.filter((a, i) => marketIdx < 0 || (i !== marketIdx && i !== marketIdx + 1))[0]?.trim();
const secretKey = market ? process.env[`CKO_${market}_SECRET_KEY`] : process.env.CKO_SECRET_KEY;
const environment = process.env.NEXT_PUBLIC_CKO_ENVIRONMENT === "production" ? "production" : "sandbox";
const baseUrl = environment === "production" ? "https://api.checkout.com" : "https://api.sandbox.checkout.com";

if (!domain || domain.includes("/") || domain.startsWith("http")) {
  console.error("Usage: pnpm enroll-apple-pay <domain>   e.g. tri-case.vercel.app (no scheme, no path)");
  process.exit(2);
}
if (!secretKey) {
  console.error(`${market ? `CKO_${market}_SECRET_KEY` : "CKO_SECRET_KEY"} is not set. Put it in .env.local or export it before running.`);
  process.exit(2);
}

const res = await fetch(`${baseUrl}/applepay/enrollments`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({ domain }),
});
const body = await res.text();

if (res.ok) {
  console.log(`Enrolled ${domain} for Apple Pay (${environment}${market ? `, ${market} credentials` : ""}).`);
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
