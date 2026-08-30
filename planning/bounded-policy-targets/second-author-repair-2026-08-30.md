# Bounded-policy targets — D2105–D2111 second author repair

- **Date:** 2026-08-30
- **Input:** `planning/bounded-policy-targets/fresh-independent-buildability-review-2026-08-30.md`
- **Verdict:** author repair complete; fresh independent review required
- **Production status:** unchanged and unauthorized

## Repaired boundary

1. `declareThreatEvidence(sourceFen)` becomes the sole threat constructor. It computes the unchanged
   `threat@1` payload itself and binds its exact `ThreatPassAnchor` in a private WeakMap, so a
   byte-identical foreign-position item, spread, JSON, cast or generic declaration cannot satisfy
   the named-target join.
2. `TrackedPieceIdentity`, `ObservedPromotionEdge` and the traversal-only `TrackedPieceState` are
   literal. Initial promotion provenance remains refused; only a legal promotion observed on plies
   1–3 changes the tracked role.
3. `BoundedTargetBackgroundService` is an exported concrete runtime class with a private
   constructor, static/named product factory, real `.prototype.submit` and idempotent `close()`.
   Product construction accepts only the manifest and numeric limits; scheduler/fault injection is
   module-private and test-only.
4. The existing 25,000-position candidate cap is joined by a deterministic 100,000-position
   whole-job cap. Global exhaustion discards the whole partial result and advances the FIFO queue.
5. `reintroduced` now requires a same-preparation canonical refutation. A universal requires at
   least one legal reply; only the terminal/no-line negative may retain null.
6. The batch count is the exact sum of candidate-local increments in canonical order. Admission,
   cancellation, failure, close and global-exhaustion snapshots are total.

No provider, ranking, learner sentence, module, bot weight, schema, content or product caller is
added. The three projections remain `inspector_only` until their consumer RFCs authorize delivery.

## Executable author evidence

- `make bounded-target-second-author-repair`: **7/7 green**.
- Maintained contracts: **18 + 5 + 13 green**, including their TypeScript fixtures.
- Historical `make bounded-target-fresh-review`: RFC-shape arms D2106–D2111 now fail as the intended
  inversion; D2105 remains green because it inspects the deliberately unimplemented production
  constructor. It must invert at implementation, not be weakened during authoring.

The maintained run exposed [[D2150]]: D1963, D1997 and D1998 pinned superseded wording/type names.
They now assert the stronger live contract; the original review dossier and fresh-return harness
remain unchanged.

## Next lawful action

A fresh independent reviewer follows source construction through exact join, compiles the declared
service/types, attacks whole-job fairness/counting and verifies shutdown/refutation totality. Only
acceptance after that review authorizes implementation.
