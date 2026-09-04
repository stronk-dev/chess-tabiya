# Deflection exact-source check seal — fresh independent review

- **Date:** 2026-09-04
- **Rows:** [[D2536]], [[D2552]], [[D2553]]
- **RFC:** `rfc/semantic-collectors.md` §3.2.1 / C17
- **Gate:** `make semantic-collectors-deflection-seal-fresh-review` — 4/4 plus strict TypeScript
- **Verdict:** accepted for the bounded production implementation

## Live construction proof

The review reconstructed the proposed narrow operation directly from the live manifest,
`compileSemanticEvidenceEvent`, check detector and declared-evidence adapter; it did not import the
author model. On the check-only `Ra8+` line and dual-arm `Bxa7+` line, the narrow operation produced
the same event id, canonical anchor and exact operands as both `tacticalSemanticEvents` and
`localSemanticEvents`. Every narrow result passes the production runtime seal, and its evidence
payload is the operands object by identity.

## Refusal and source boundary

A quiet bait move returns `undefined`; a crossed after-FEN fails canonical edge validation before an
event is minted. The exact-source compiler can therefore retain this one event without invoking the
broad tactical collector, which also emits reply breadth and may emit double attack. Its current
evidence-only field remains the production change to make, not proof that the future call already
works.

## Verdict and next action

D2553's narrow-constructor contract is buildable. Together with the already-reviewed D2552 selector,
it closes the call boundary for D2536 without adding a producer, projection, operand, eligibility,
schema or content change. Implement the constructor, delegate tactical collection to it, retain the
sealed event in exact-source mode, update the three deflection call sites and permanent fixtures, then
rerun every retained author/review gate plus full repository verification.
