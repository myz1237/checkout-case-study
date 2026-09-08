# ADR 0002: Market and payment-method matrix

**Status:** accepted · 2026-09-08

## Context

Two markets with different currencies and payment habits. The sandbox account exposes more
methods than we want to offer (Google Pay, Sofort), and Flow shows everything the session allows.

## Decision

A `Market` record drives everything per market:

| Market | Currencies | Billing country | Payment methods | Languages |
|---|---|---|---|---|
| Hong Kong | HKD (default), USD | HK | card, applepay | en (default), zh-HK |
| Netherlands | EUR (default), USD | NL | card, ideal (EUR only) | nl (default), en |

Every payment session sends an explicit `enabled_payment_methods` list, filtered by the chosen
currency (iDEAL settles only in EUR). Prices are a separate hard-coded list per currency, not an
FX conversion. Switching market or currency while a session is open discards that session,
because a session is priced in one currency.

Credentials are resolved per market as well (`lib/credentials.ts`): a market can be processed
through its own account / processing channel via `CKO_<MARKET>_*` variables, otherwise it uses
the defaults. Flow is always initialised with the public key of the account that created the
session, and the redirect URLs carry `market=` so the outcome pages query the right account.

## Consequences

- Google Pay is deliberately absent: analytics say the audience is iPhone, and one wallet keeps the demo focused.
- iDEAL is included for NL as the dominant Dutch method; it only appears once the account has it enabled.
- Apple Pay is left out of NL: the account processing NL cannot enrol the domain (Checkout.com rejects the Apple Pay session even though Flow shows the button) and Apple's sandbox does not support the Netherlands. It is a one-line addition once an NL account is enrolled.
- Per-market credentials mirror how merchants run separate entities per region. In this demo it also lets NL run on the shared sandbox (iDEAL enabled) while HK runs on an account that can enrol Apple Pay.
- 3DS is requested in both markets (SCA is mandatory in the EEA; in HK it is cheap insurance and keeps behaviour identical).
