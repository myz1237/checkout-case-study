# ADR 0002: Market and payment-method matrix

**Status:** accepted · 2026-09-08

## Context

Two markets with different currencies and payment habits. The sandbox account exposes more
methods than we want to offer (Google Pay, Sofort), and Flow shows everything the session allows.

## Decision

A `Market` record drives everything per market:

| Market | Currency | Billing country | Payment methods | Languages |
|---|---|---|---|---|
| Hong Kong | HKD | HK | card, applepay | en (default), zh-HK |
| Netherlands | EUR | NL | card, applepay, ideal | nl (default), en |

Every payment session sends an explicit `enabled_payment_methods` list. Prices are a separate
hard-coded list per currency, not an FX conversion. Switching market while a session is open
discards that session, because a session is priced in one currency.

## Consequences

- Google Pay is deliberately absent: analytics say the audience is iPhone, and one wallet keeps the demo focused.
- iDEAL is included for NL as the dominant Dutch method; it only appears once the account has it enabled.
- 3DS is requested in both markets (SCA is mandatory in the EEA; in HK it is cheap insurance and keeps behaviour identical).
