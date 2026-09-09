# Apple Pay

Status: verified end to end on the production Vercel domain for the Hong Kong market (2026-09-09) with a sandbox tester account and an Apple test card.

Apple Pay is enabled on the payment session for the Hong Kong market (see `lib/markets.ts`).
Flow renders the Apple Pay button automatically when all of the following hold:

1. The page is served over HTTPS on a public domain (Apple validates the domain; `localhost` cannot be enrolled).
2. That domain is enrolled on the Checkout.com account: `pnpm enroll-apple-pay <domain>`.
   The secret key used needs the `vault:apme-enrollment` scope.
3. The customer uses Safari on a device with Apple Pay set up. Flow calls `isAvailable()` itself.

No application code changes are needed once the domain is enrolled.

## Sandbox testing constraints

- Apple Pay sandbox testing needs a **sandbox tester account** created in App Store Connect,
  which requires membership of a (paid) Apple Developer Program team. Sign in to the test
  device with that tester account and add the Apple test cards to Wallet.
- Apple's sandbox supports **Hong Kong but not the Netherlands**. Apple Pay can therefore be
  verified end to end for the HK market; the NL market has the button but cannot be exercised
  with Apple test cards.
- The shared case-study sandbox key returns `401` from the enrollment endpoint (missing scope),
  so Apple Pay must be verified with a sandbox account you own.

## What the session already carries

- `display_name: "Tri Case"` so the payment sheet shows the store name, not the account's legal name.
- `items` with the cart lines, so the sheet can list what is being bought.
- `billing.address.country` and `currency` matching the market.

## Why the button can show but the payment still fails

Flow decides whether to show the button from the device alone (Safari with a card in Wallet).
The domain is checked only when the shopper taps it: Checkout.com creates the Apple Pay session
and rejects it (HTTP 422, surfaced by Flow as `payment_method_attempt_failed`) if the account
has not enrolled the domain. Enrol first, then test with a sandbox tester account, never a real card.
