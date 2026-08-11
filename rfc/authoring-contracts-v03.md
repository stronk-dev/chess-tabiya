# RFC: Authoring Contracts (drill-pack v0.3, minimal)

- **Status:** draft
- **Author:** claude (for Marco)
- **Created:** 2026-08-11
- **Design refs:** `design/01-training-model.md`, `design/03-product-breadth.md` B4
- **Exploration gate:** breadth program #2; prerequisite of `rfc/evidence-composer.md`
- **Depends on:** `docs/drill-pack-format.md`, `docs/branch-runtime.md`
- **Parent / amends:** **`rfc/archive/drill-pack-format.md`** (pack schema → v0.3, breaking). **No longer amends `branch-runtime`** — the run-schema and evaluation changes that required it are deferred (see §Deferred).
- **Supersedes / superseded by:** —
- **Planning:** `planning/authoring-contracts-v03/` (once implementing)

## Summary

The **minimum** authored vocabulary that lets claims be grounded and honesty be
computed: anchored claim triggers, a boundary combinator that actually degrades,
and a ref grammar limited to sources that resolve today. Everything whose
encoding cannot yet be pinned honestly is deferred with a stated reason.

## Motivation

Two consecutive reviews (EC-C1..C8, AC-C1..C8) found the same failure: contracts
named at intent level, unpinned at encoding level, on top of a shipped schema I
kept mis-remembering. The correction is scope, not another patch pass. Three
things get specified because their encoding is knowable from the code that
exists; three are deferred because they are not.

## Specification

### 1. Claim triggers (pack v0.3, breaking)

`feedbackClaim` gains a **required** `when`, encoded in the pack schema's own
**key-discriminated** style — *not* the runtime's type-discriminated
`ObjectivePredicate`, which cannot be expressed here without duplicating a
second, differently-spelled vocabulary (AC-C1):

```
when := { simpleTrigger }            // the EXISTING $defs/simpleTrigger, reused verbatim
      | { onCheckpoint: CheckpointId }
      | { atSpineNode: SpineNodeId }
      | { all: [when, ...] } | { any: [when, ...] } | { not: when }
```

Exactly one key per object (`oneOf` with `minProperties/maxProperties: 1`), so
the union cannot self-collide. A claim whose `when` is unsatisfied is never
emitted; `when` is required, which is the breaking change.

### 2. Boundary combinator (pack v0.3) — plyHorizon caps, it does not grant

AC-C4 was right that a union is the permissive reading and contradicts the
degradation contract it claimed to serve. Correct semantics:

> A node is **authored territory** iff
> (`spineNodeIds` contains it **OR** a `fenPredicates` entry matches its
> `transposeKey`) **AND** (`plyHorizon` is absent **OR** its ply ≤ `plyHorizon`).

`plyHorizon` is a **cap on authored reach, not a grant of authority** — being
early in the game does not make off-spine play authored. `fenPredicates`
matching on `transposeKey` is what recognizes a transposition back into book,
satisfying branch-runtime's standing rule that boundaries match by
transpose-key/predicate rather than node identity.

**Deviation from design (declared, not "None"):** `design/BACKLOG.md`'s
degradation row is satisfied by this reading; the earlier union reading would
have violated it. The schema description states the combinator so no
implementer picks another reading.

### 3. Evidence-ref grammar — only what resolves today (AC-C5)

The v0.2 claim that prefixes map one-to-one onto `evidenceTypes` was false in
both directions. v0.3 states the honest mapping:

| Prefix | Resolves to | `sourceKind` |
|---|---|---|
| `rules:<fact>` | runtime rules fact (mate/stalemate/draw/material) | `derived_feature` |
| `pack-claim:<claimId>` | an authored claim in the run's pack | `author_principle` or `hypothesis` (per the claim's own `evidenceTypes`) |
| `pack-checkpoint:<checkpointId>` | an authored checkpoint reached on the path | `author_principle` |
| `engine:<jobId>` | an `evidence.attached` payload (durable event, never the in-memory queue) | `engine_validated` |

`pack:` is **split** into two prefixes because one namespace over two id spaces
sharing a pattern is not deterministically resolvable. `hypothesis` claims
resolve via `pack-claim:` — they are author-sourced, so the composer's
hypothesis-marking rule is live, not dead code.

**Not reserved yet:** `maia:`, `tb:`, `corpus:`, `feature:` — see §Deferred.

### 4. Comparison scoping without new identity (AC-C8)

Segments already carry `startSeq`/`endSeq`, and event seqs are unique and
append-only by construction. Comparison and segment scopes therefore reference
`{branchId, startSeq, endSeq}` — **no new segment id, no uniqueness claim the
shipped `deriveSegments` cannot honor**, and nothing that changes under
rewind-and-replay (a replayed segment is genuinely a different segment on a new
branch, and should address differently).

### 5. Pack version compatibility (AC-C6, pack side)

Making `when` required changes the fixture's digest. Rule: **a pack version
change mints a new pack identity.** The living fixture goes `0.2.0 → 0.3.0`;
runs pinned to the old digest are not served that pack and fall back to plain
PGN export (the existing documented fallback). No dual-version schema
validation, no snapshot rewriting.

## Deferred (with reasons, not omissions)

- **Timing-window semantics** (`planMoves`, `opponentArrival`, luxury accounting,
  verdicts). AC-C2 showed my derivation table had gaps, overlaps, and still left
  `luxuryMoveBudget` unread. The deeper problem: **this vocabulary needs a real
  authored pack to be designed against**, and none exists (content era). Pack A
  (anti-Caro) is where the tempo contract gets its encoding — specifying it
  beforehand is designing in the dark. Windows keep their v0.2 shape and their
  current shipped meaning (checkpoint fires on `windowCloses`).
- **`EvidencePayload.source` widening + run schema 0.5.** Only needed once Maia,
  tablebase, or corpus evidence is actually wired into `evidence.attached`;
  none is today. Deferring avoids breaking a persisted, validated wire format
  for sources that emit nothing.
- **Path-relative trigger evaluation.** AC-C7 correctly sized this as the
  largest item here, sitting in the server's orchestrator and touching public
  runtime API plus ~400 lines of objective tests. It becomes unnecessary in v1:
  claims are emitted and **recorded when their checkpoint fires on the active
  path**, and comparison packets assemble *recorded* claims from both branches
  rather than re-evaluating triggers off-cursor.

## Acceptance criteria

- Pack schema v0.3: validates each `when` form, **rejects a claim without
  `when`**, and rejects a `when` object with two keys (the self-collision case).
- Boundary: a node at ply ≤ `plyHorizon` but off-spine and matching no
  `fenPredicates` entry is **not** authored (the case the union reading got
  wrong); a node matching a `fenPredicates` entry after an off-spine excursion
  **is** authored (transposition-back).
- Ref grammar: constructors + resolvers for the four live prefixes; a
  `pack-claim:` id and a `pack-checkpoint:` id that are string-equal resolve to
  different things (the overload the split fixes).
- Living fixture migrated to `0.3.0` with a triggered claim; archive fixture
  untouched; a run pinned to the old digest still exports plain PGN.
- `ENGINES_REQUIRED=1 make verify` green; `docs/drill-pack-format.md` amended.

## Open questions

None blocking. The deferred items each have a stated trigger: pack A for
timing, a wired non-Stockfish source for the schema widening.

## Acceptance review blockers (2026-08-11 — AC-C1..AC-C8) — RESOLVED

C1 → `when` encoded key-discriminated in the pack's own style, reusing the
existing `simpleTrigger` `$def`, one key per object. C2/C3 → timing semantics
deferred until pack A exists rather than patched a third time. C4 → combinator
corrected to "plyHorizon caps, does not grant", with the deviation declared.
C5 → grammar cut to the four prefixes that resolve today, `pack:` split, the
false `evidenceTypes` mapping withdrawn, `hypothesis` given a live resolution,
`feature:` cycle removed with the deferral. C6 → run-schema widening deferred;
pack-side compatibility stated as version-mints-identity. C7 → path-relative
evaluation deferred, made unnecessary by recorded-claim comparison. C8 → no
new segment id; scope by `{branchId, startSeq, endSeq}`.

## Changelog

- 2026-08-11: created after the evidence-composer review.
- 2026-08-11: adversarial review AC-C1..C8 — **scope cut rather than patched**:
  three contracts specified at encoding level, three deferred with stated
  triggers, boundary semantics corrected, branch-runtime amendment withdrawn.
