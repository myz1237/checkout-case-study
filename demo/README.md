# Tri Case — Checkout.com Flow demo

A merchant selling iPhone cases in Hong Kong and the Netherlands. Most visitors are on iPhone,
so the checkout offers a one-touch wallet next to cards, and it must stay PCI compliant without
the merchant ever touching card data.

## Requirement → decision

| Requirement | Decision | Why |
|---|---|---|
| Capture card details securely, stay PCI compliant | **Checkout.com Flow** embedded on the page | Card fields are rendered in Checkout.com iframes, the merchant qualifies for SAQ A, and the checkout stays on our page (no redirect to a hosted page). [ADR 0001](docs/adr/0001-flow-over-hosted-pages.md) |
| Mostly iPhone visitors, faster checkout | **Apple Pay via Flow** | Flow renders the Apple Pay button on Safari once the domain is enrolled; no separate wallet integration. [docs/apple-pay.md](docs/apple-pay.md) |
| Works on mobile | One responsive web page | Flow is a responsive web component; the native Mobile SDKs are for apps, not websites |
| Hong Kong and the Netherlands | Market switch → currency, billing country, payment methods, language | HK: card + Apple Pay in HKD. NL: card + Apple Pay + iDEAL in EUR. Explicit `enabled_payment_methods` so nothing else on the account leaks in. [ADR 0002](docs/adr/0002-market-payment-matrix.md) |
| No database | Hard-coded catalogue, cart in `localStorage` | Prices are always recomputed on the server from the catalogue; the browser only sends product ids and quantities |

## How a payment flows

1. The shopper picks a market, adds cases, enters name and email, and presses **Checkout**. The cart locks.
2. The browser posts product ids, quantities, market and customer to `POST /api/payment-sessions`.
3. The server prices the cart, builds the [Payment Session](https://www.checkout.com/docs/payments/accept-payments/accept-a-payment-on-your-website/get-started-with-flow) request (amount, currency, billing country, enabled payment methods, customer, `3ds.enabled`, line items, `display_name`, success/failure URLs) and calls Checkout.com with the secret key.
4. The page mounts Flow with the session, the public key, the selected locale, the brand palette, and the cardholder name pre-filled from the form.
5. Outcome:
   - synchronous (no 3DS challenge, Apple Pay): Flow raises `onPaymentCompleted` and we navigate to `/success?cko-payment-id=…`
   - redirect (3DS challenge, iDEAL): Checkout.com sends the shopper to the `success_url` / `failure_url` we passed, with `cko-payment-id` appended
6. `/success` and `/failure` never trust the URL: they call **Get payment details** server-side and show status, amount, method, reference (and the decline reason from the payment's actions on failure). Success clears the cart; failure keeps it.

## Run it locally

```bash
cd demo
cp .env.example .env.local   # fill in your sandbox keys
npm install
npm run dev                  # http://localhost:3000
```

Environment variables:

| Variable | Used | Notes |
|---|---|---|
| `CKO_SECRET_KEY` | server only | Secret key with the `payment-sessions` scope (add `vault:apme-enrollment` for the Apple Pay script) |
| `CKO_PROCESSING_CHANNEL_ID` | server only | Processing channel the sessions are created on |
| `NEXT_PUBLIC_CKO_PUBLIC_KEY` | browser | Public key with `payment-sessions:pay` and `vault-tokenization` |
| `NEXT_PUBLIC_CKO_ENVIRONMENT` | both | `sandbox` or `production` |

Checks: `npm test` (unit tests for cart, pricing, session request, markets, locales), `npm run lint`, `npm run build`.

## Test it

Any future expiry and any 3-digit CVV. Full list: [Checkout.com test cards](https://www.checkout.com/docs/developer-resources/testing/test-cards).

| Scenario | Card | What you see |
|---|---|---|
| Approved, 3DS frictionless | `4485040371536584` | Straight to the success page |
| Approved, 3DS challenge | `4010061700000021` | Challenge modal (password `Checkout1!`), then the success page |
| 3DS failed | `4243754271700719` | Failure page with "Cardholder failed 3D-Secure authentication", cart kept |
| Declined (insufficient funds) | `4544249167673670` | Flow shows the decline inline; try another card |
| iDEAL (NL market) | pick the test bank on the simulator | Redirect to the bank simulator, then the success page |
| Apple Pay | Safari on an Apple Pay device, enrolled domain | Apple Pay button above the card form |

Switch market with the segmented control (prices, currency and payment methods change) and language with the dropdown next to it (Flow re-renders in `en`, `zh-HK` or `nl`).

## Deploy to Vercel

1. Import the repository; set **Root Directory** to `demo`. Framework preset: Next.js.
2. Add the four environment variables above.
3. After the first production deploy, enrol the production domain for Apple Pay:
   ```bash
   npm run enroll-apple-pay -- <your-project>.vercel.app
   ```
   Preview deployments get a different URL per commit, so only enrol the stable production domain.
4. Success/failure URLs are derived from the request origin, so nothing else changes between local and hosted.

## Known limitations

- **Apple Pay enrollment** needs a secret key with the `vault:apme-enrollment` scope. The shared case-study key returns `401` from the enrollment endpoint; use a sandbox account you own. Sandbox testing needs an App Store Connect sandbox tester and Apple's sandbox covers Hong Kong but not the Netherlands. See [docs/apple-pay.md](docs/apple-pay.md) and [ADR 0003](docs/adr/0003-apple-pay-enrollment.md).
- **iDEAL** must be enabled on the account (Dashboard → Settings → Payment methods → *Available to request*, or via support). The code already sends `ideal` for the NL market; Checkout.com silently drops it until the account has it.
- Flow's Hong Kong locale must be passed as `zh-HK`; the lowercase `zh-hk` shown in the localization docs is ignored.
- Not built (Part 3 optional items left out on purpose): webhooks and refunds. Both need a public URL and would sit naturally on the Vercel deployment.

## Layout

```
app/                Next.js App Router: storefront page, /success, /failure, /api/payment-sessions
components/         ProductGrid, CartSummary, CustomerForm, MarketSwitch, LanguageSelect, FlowCheckout, PaymentOutcome
lib/                catalogue, cart maths, markets, locales, session request builder, Checkout.com API client (+ unit tests)
hooks/              usePersistentState (localStorage / sessionStorage via useSyncExternalStore)
scripts/            enroll-apple-pay.mjs
docs/               apple-pay.md, adr/
```
