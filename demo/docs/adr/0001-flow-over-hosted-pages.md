# ADR 0001: Flow over Hosted Payments Page, Payment Links or Frames

**Status:** accepted · 2026-09-08

## Context

The brief requires capturing card details on our checkout page while staying PCI compliant.
Checkout.com's PCI guidance lists Flow, Hosted Payments Page, Payment Links and the Mobile SDKs
as the integrations that keep card data away from the merchant (SAQ A). Frames also qualifies for
SAQ A but only covers cards. Most visitors are on iPhone and want a one-touch wallet.

## Decision

Embed **Flow** (Checkout Web Components) on our own page, loaded through the official npm
loader that fetches the component from Checkout.com's CDN at runtime.

## Consequences

- The shopper never leaves our page; card fields are Checkout.com iframes, so we stay at SAQ A.
- Apple Pay, iDEAL and future methods come from the same component, driven by the payment
  session, with no extra front-end integration.
- Hosted Payments Page and Payment Links were rejected because they redirect away from the
  storefront; Frames because it would need separate Apple Pay and iDEAL work.
- The Flow script must never be self-hosted or bundled; the npm package is only a loader.
- Flow cannot be placed inside an iframe or a Shadow DOM.
