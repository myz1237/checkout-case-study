# ADR 0003: Apple Pay enrollment blocker

**Status:** accepted · 2026-09-08

## Context

Apple Pay through Flow needs the serving domain enrolled on the Checkout.com account
(`POST /applepay/enrollments`), which needs a secret key with the `vault:apme-enrollment` scope.
The shared case-study sandbox key answers `401` on that endpoint. Apple additionally requires a
public HTTPS domain, an App Store Connect sandbox tester for test cards, and its sandbox does
not cover the Netherlands.

## Decision

Build the integration as if enrollment were in place (Apple Pay enabled on every session,
`display_name` and `items` set so the payment sheet is correct) and ship a one-off script,
`npm run enroll-apple-pay -- <domain>`, that performs the enrollment and explains the scope
problem when it hits `401`. Verify Apple Pay on the Vercel production domain with a sandbox
account we own, for the Hong Kong market.

## Consequences

- No code change is needed when the domain is enrolled; the button appears on Safari.
- Local development never shows Apple Pay; cards and iDEAL are verified locally, Apple Pay on the deployed domain.
- The Netherlands market carries Apple Pay but cannot be exercised with Apple test cards.
