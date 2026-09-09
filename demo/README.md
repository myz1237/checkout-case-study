# Tri Case — Checkout.com Flow demo

A merchant selling iPhone cases in Hong Kong and the Netherlands. Most visitors are on iPhone,
so the checkout offers a one-touch wallet next to cards, and it must stay PCI compliant without
the merchant ever touching card data.

## Requirement → decision

| Requirement | Decision | Why |
|---|---|---|
| Capture card details securely, stay PCI compliant | **Checkout.com Flow** embedded on the page | Card fields are rendered in Checkout.com iframes, the merchant qualifies for SAQ A, and the checkout stays on our page (no redirect to a hosted page). [ADR 0001](docs/adr/0001-flow-over-hosted-pages.md) |
| Selling in the EU (Netherlands) → PSD2 Strong Customer Authentication | **3DS on every card payment** (`3ds.enabled: true`), both markets | SCA is mandatory for EEA card payments; Flow runs 3DS2 and the issuer decides challenge vs frictionless. Keeping HK identical avoids a second code path; Apple Pay carries its own authentication |
| Mostly iPhone visitors, faster checkout | **Apple Pay via Flow** | Flow renders the Apple Pay button on Safari once the domain is enrolled; no separate wallet integration. [docs/apple-pay.md](docs/apple-pay.md) |
| Works on mobile | One responsive web page | Flow is a responsive web component; the native Mobile SDKs are for apps, not websites |
| Hong Kong and the Netherlands | Market switch → currency, billing country, payment methods, language, **credentials** | HK: card + Apple Pay in HKD or USD. NL: card + iDEAL in EUR, card only in USD (iDEAL settles in EUR). Explicit `enabled_payment_methods` so nothing else on the account leaks in. Each market can process through its own account / processing channel. [ADR 0002](docs/adr/0002-market-payment-matrix.md) |
| No database | Hard-coded catalogue, cart in `localStorage` | Prices are always recomputed on the server from the catalogue; the browser only sends product ids and quantities |

## Saved cards

The card form offers "Save card details for future purchases" (`store_payment_details: collect_consent` on the session). Checkout.com stores the card under a customer keyed by the shopper's email. On the next order with the same email the server looks the customer up (`GET /customers/{email}`), passes `payment_method_configuration.stored_card.customer_id` and allow-lists `stored_card`, and Flow shows the saved card preselected with a one-tap Pay button and no CVV (Flow asks for CVV only where a scheme requires it). Card data never leaves Checkout.com's Vault.

This demo has no login, so anyone who enters an email can pay with the cards saved under it. A real store must put this behind authentication.

## How a payment flows

1. The shopper picks a market, adds cases, enters name and email, and presses **Checkout**. The cart locks.
2. The browser posts product ids, quantities, market and customer to `POST /api/payment-sessions`.
3. The server picks the market's credentials, prices the cart, looks up the customer by email for saved cards, builds the [Payment Session](https://www.checkout.com/docs/payments/accept-payments/accept-a-payment-on-your-website/get-started-with-flow) request (amount, currency, billing country, enabled payment methods, customer, `3ds.enabled`, line items, `display_name`, success/failure URLs) and calls Checkout.com with the secret key.
4. The page mounts Flow with the session, the public key of the account that created it, the selected locale, the brand palette, and the cardholder name pre-filled from the form.
5. Outcome:
   - synchronous (no 3DS challenge, Apple Pay): Flow raises `onPaymentCompleted` and we navigate to `/success?cko-payment-id=…`
   - redirect (3DS challenge, iDEAL): Checkout.com sends the shopper to the `success_url` / `failure_url` we passed, with `cko-payment-id` appended
6. `/success` and `/failure` never trust the URL: they call **Get payment details** server-side and show status, amount, method, reference (and the decline reason from the payment's actions on failure). A failed payment that lands on `/success` is sent to `/failure` and vice versa; a pending asynchronous payment is treated as placed. Success clears the cart; failure keeps it.

## Run it locally

```bash
cd demo
cp .env.example .env.local   # fill in your sandbox keys
pnpm install
pnpm dev                  # http://localhost:3000
```

Environment variables:

| Variable | Used | Notes |
|---|---|---|
| `CKO_SECRET_KEY` | server only | Secret key with the `payment-sessions` scope (add `vault:apme-enrollment` for the Apple Pay script) |
| `CKO_PROCESSING_CHANNEL_ID` | server only | Processing channel the sessions are created on |
| `NEXT_PUBLIC_CKO_PUBLIC_KEY` | browser | Public key with `payment-sessions:pay` and `vault-tokenization` |
| `NEXT_PUBLIC_CKO_ENVIRONMENT` | both | `sandbox` or `production` |
| `SITE_URL` | server only, optional | Public origin for the redirect URLs when running `next start` behind a proxy; not needed on Vercel or locally |
| `CKO_NL_SECRET_KEY`, `CKO_NL_PROCESSING_CHANNEL_ID`, `CKO_NL_PUBLIC_KEY` | server only, optional | Process the NL market through a different account / processing channel. Set all three or none; HK (and any market without an override) keeps the defaults |
| `CKO_WH_AUTH_HEADER_KEY`, `CKO_WH_SIGN_KEY` | server only | Authorization header value and signature key of the webhook registered in the Dashboard |

## Tests

Everything lives under `tests/`:

| Command | What runs |
|---|---|
| `pnpm test` | Unit tests in `tests/unit/` (Vitest): cart maths, pricing, session request builder, markets, locales, page copy, input guards, credentials, origin resolution, webhook verification |
| `pnpm test:e2e` | End-to-end scenarios in `tests/e2e/` (Playwright, headless Chromium) against a running `pnpm dev`. They make real sandbox payments: card, 3DS challenge / frictionless / failed, decline, saved card, iDEAL via the test bank, market, currency and language switching, outcome pages |
| `pnpm lint`, `pnpm build` | ESLint and a production build |

Before the first e2e run: `pnpm exec playwright install chromium`. Run a single scenario with `pnpm test:e2e customer-3ds`; screenshots land in `tests/e2e/screenshots/`.

## Test it

Any future expiry and any 3-digit CVV. Full list: [Checkout.com test cards](https://www.checkout.com/docs/developer-resources/testing/test-cards).

| Scenario | Card | What you see |
|---|---|---|
| Approved, 3DS frictionless | `4485040371536584` | Straight to the success page |
| Approved, 3DS challenge | `4010061700000021` | Challenge modal (password `Checkout1!`), then the success page |
| 3DS failed | `4243754271700719` | Failure page with "Cardholder failed 3D-Secure authentication", cart kept |
| Declined (insufficient funds) | `4544249167673670` | Flow shows the decline inline; try another card |
| iDEAL (NL market) | bank **TESTNL2A**, then **SUCCESS** (or FAILURE) on the simulator | Redirect to the iDEAL test page, then back to the success (or failure) page |
| Apple Pay | Safari on an iPhone signed in with an App Store Connect sandbox tester, Apple test card in Wallet, HK market | Apple Pay button above the card form; Face ID, then the success page |

Switch market with the segmented control (prices, currency and payment methods change), currency with the first dropdown (each market has its own price list per currency; iDEAL disappears outside EUR; mid-checkout the session is recreated in place) and language with the second: the page copy, Flow, the price format and the outcome pages all follow it (`en`, `zh-HK`, `nl`). Product names stay in English. The choice is mirrored into a cookie so the server-rendered success/failure pages use the same language.

## Webhooks

`POST /api/webhooks` receives Checkout.com webhooks. Every request must carry the `Authorization` header value and a valid `Cko-Signature` (HMAC-SHA256 of the raw body) matching `CKO_WH_AUTH_HEADER_KEY` and `CKO_WH_SIGN_KEY`; anything else is rejected with 401. `payment_approved`, `payment_captured` and `payment_declined` are logged to the server console (Vercel → Logs), other events are acknowledged and ignored.

To register it: Dashboard → Developers → Webhooks → New webhook → URL `https://<your-domain>/api/webhooks`, select the three payment events **from the Gateway category** (the Simulator category only fires for the Dashboard's test button; real payments never match it), set the Authorization header key and copy the signature key into the environment variables. Webhooks are registered per account, so events for the NL market (processed by the shared sandbox) only arrive if that account has the webhook too.

## Deploy to Vercel

1. Import the repository; set **Root Directory** to `demo`. Framework preset: Next.js.
2. Add the four environment variables above.
3. After the first production deploy, enrol the production domain for Apple Pay:
   ```bash
   pnpm enroll-apple-pay <your-project>.vercel.app
   ```
   This uses the default credentials (the HK market). Add `--market NL` to enrol with a market's own credentials.
   Preview deployments get a different URL per commit, so only enrol the stable production domain.
4. Success/failure URLs are derived from the request origin, so nothing else changes between local and hosted.

## Known limitations

- **Apple Pay** is verified end to end for the HK market on the Vercel deployment (domain enrolled, sandbox tester account, Apple test card, payment captured). Enrollment needs a secret key with the `vault:apme-enrollment` scope, which the shared case-study key lacks, and Apple's sandbox covers Hong Kong but not the Netherlands. See [docs/apple-pay.md](docs/apple-pay.md) and [ADR 0003](docs/adr/0003-apple-pay-enrollment.md).
- **iDEAL** must be enabled on the account (Dashboard → Settings → Payment methods → *Available to request*, or via support). The code sends `ideal` for the NL market; Checkout.com silently drops it until the account has it. In this demo the NL market is processed through the shared case-study sandbox (which has iDEAL) via the `CKO_NL_*` override, while HK uses a sandbox account that can enrol Apple Pay.
- **Apple Pay is HK-only in this demo.** The NL account cannot enrol the domain (Flow shows the button, but Checkout.com rejects the Apple Pay session with 422), and Apple's sandbox does not cover the Netherlands. Adding `applepay` back to the NL market is a one-line change once its account has the domain enrolled.
- Flow's Hong Kong locale must be passed as `zh-HK`; the lowercase `zh-hk` shown in the localization docs is ignored.
- Not built (Part 3 optional item left out on purpose): refunds.

## Layout

```
app/                Next.js App Router: storefront page, /success, /failure, /api/payment-sessions, /api/webhooks
components/         ProductGrid, CartSummary, CustomerForm, MarketSwitch, LanguageSelect, FlowCheckout, PaymentOutcome
lib/                catalogue, cart maths, markets, locales, page copy (i18n), credentials, session request builder, Checkout.com API client
hooks/              usePersistentState (Web Storage via useSyncExternalStore)
tests/unit/         Vitest unit tests
tests/e2e/          Playwright scenarios + run-all runner
scripts/            enroll-apple-pay.mjs
docs/               apple-pay.md, adr/
```
