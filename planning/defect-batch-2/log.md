# Defect Batch 2 implementation log

Append-only.

## 2026-08-14 — Codex implementation review

Approved after one blocking correction. The proposed event-authoritative segment projection
would have trusted arbitrary node and branch metadata on a public `appendEvents` input, allowing
a forged `segment.completed` to widen `segment_end` authored-feedback scope. The RFC now requires
exact checkpoint-event correspondence, ordering, and adjacency while preserving genuine
pre-guard zero-length segment events. Git archaeology confirms the pre-guard producer shape;
D22 is latent against the committed corpus, and D23/D24/D27 are genuinely stale ledger rows.

## 2026-08-14 — D21 segment authority

`deriveSegments` now projects only validated `segment.completed` events. Both projection and
derivation require exact referenced checkpoints, strict sequence order, ending-checkpoint
adjacency, and matching branch/node metadata. Tests cover the original coincident-checkpoint
regression at runtime and orchestrator levels, a literal pre-guard zero-length event accepted by
the authored-feedback path, forged metadata refusal, and a fast-check 1:1 invariant. The focused
44-test slice and workspace typecheck passed.

## 2026-08-14 — D22 pack policy closure

Pack schema 0.12 closes `opponentPolicy`, leaving only the two explicitly deferred legacy open
objects. A dedicated negative fixture proves an invented `maiaModel` key fails at
`/opponentPolicy`; the corpus test discovers and validates the living fixture, browser fixture,
all draft packs, and every emitted candidate pack. The first test run exposed that
`content/candidates/priority/` is a metadata directory rather than a candidate; discovery now
includes only directories containing `pack.json`. All 28 schema tests and workspace typecheck
passed, with no content bytes changed.

## 2026-08-14 — Stale-row residuals

D23's actual product risk is pinned in the browser: a null-phase summary remains visible and
renders `unclassified`; the existing emitter parity tests remain unchanged. D24 now has both a
pure exact-spelling environment parser test and an omitted-option identity test proving `Secure`
is the default. D27's quiet/load measurements, non-gating rationale, 100 ms investigation
tripwire, and visible-output command are canonical in `docs/structural-reading.md`. The focused
20-test server slice and the zero-retry browser case passed. The browser edit also replaced an
old `schema example` text selector that became ambiguous once the injected fixture honestly used
the same review-status label.
