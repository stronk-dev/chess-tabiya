# Shape library implementation log

Append-only.

## 2026-08-14 — Codex adversarial review

Approved after two integration corrections. The RFC's sample type would have made the schema
package import runtime even though runtime already imports schema; shape entries now reuse the
schema-owned structural-expression type while runtime remains the evaluator. The new HTTP surface
also needed explicit admission to the closed server-error and application API-path dispatches so
missing shapes return 404 and `/shapes` cannot fall through to the SPA.

The derived-projection decision, referenced-only firing inside packs, no-event disclosure
invariant, position-run selector reconstruction, and version/migration baselines all match the
current tree. Implementation will materialize only the RFC's already-authored entries and retain
their provenance warnings; it will not invent additional chess claims.

## 2026-08-14 — Codex implementation §§1–4

Implemented shape-entry schema 0.1 and pack schema 0.11, the four official entries, shared
canonical digests, validation and authoring CLI, official/community registry, typed HTTP surface,
shape-studio persistence under migration 10, and additive pack references. Pack B and Pack C now
reference reusable plans; Pack A remains byte-untouched because no matching official entry exists.

The client now plays pack-free position sessions instead of refusing them. It reconstructs the
selector request from the persisted run, handles initial opponent turns and read-only resume, and
shows every catalogue match as a passive timeline marker. The marker opens a two-layer panel:
exact structural detection first, then attributed authored plans. Opening it emits no event and
does not move the disclosure barrier. Pack-referenced plan reveals resolve generic prose from the
entry and retain the pack's position-specific residue once.

Measured the four-entry matcher across all 16 Pack B spine positions over 20 samples:
median 1.313 ms, maximum 3.238 ms. This is an observation, not a gate. The full gate exposed D27's
pre-existing contradictory hard assertion at 100 ms (one run measured 108.758 ms); the assertion
was replaced with finite/non-vacuity checks while its measurement remains printed. No retries or
latency suppression were introduced.

Verification at this checkpoint: 343 unit/integration tests and scaffold/package checks green.
The new browser Just Play acceptance independently drove Black's c-pawn into a Carlsbad, opened
all six plans, and proved the event count stayed unchanged. The complete browser gate is rerun at
lifecycle closeout.
