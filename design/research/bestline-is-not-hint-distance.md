# Bestline collection works; bestline alone is not a hint-distance primitive

**Question:** owner ruling D1061 / D113
**Date:** 2026-08-23
**Instrument:** `tools/d1061-bestline-distance-harness/`
**Status:** provider and code-boundary research complete; RFC needs a semantic target contract

## Verdict

The shipped Stockfish path can produce usable principal variations. On a deterministic 64-position
sample spanning opening, middlegame and cross-phase packs, all **256/256** provider probes returned
fully legal, non-empty PVs. Two independently hash-cleared 100 ms searches agreed on the first move
in **64/64** positions, and the 100 ms arm agreed with fixed depth 12 in **59/64 (92.2%)**. `[V]`
(`planning/evidence-foundation-ux/d1061-bestline-distance-results.json`)

But `beforeFen + movesUci` cannot derive the ruled four-step axis as currently worded. “Square” can
mean origin or destination; “piece” can mean the exact piece or its role; exact piece and origin
square are the same information; and “ply-distance” has no named event or target to measure distance
to. PV length is a search artifact, not a grounded tactical horizon. The engine collector is ready;
the missing primitive is a **selected semantic event on the PV**, with typed actor, target and first
occurrence ply. `[V]` (instrument disclosure census; code path in
`packages/runtime/src/semantic-evidence.ts:920-923`)

Therefore the right foundation is not “store a best move, then ask an LLM to make it vague.” It is a
sealed derivation:

```
versioned Stockfish PV
  + rules/semantic events replayed on each PV edge
  + a declared event selector
  → one typed hint horizon { event, actor, targetSquares, occurrencePly, firstMove }
```

The UI can render cumulative disclosures from that one record. The LLM, if enabled, may paraphrase
the selected stage; it does not select the event, infer the target or choose how vague to be. `[M]`

## 1. Provider measurement

The preregistered population takes 24 opening, all 16 middlegame and 24 cross-phase positions from
the accepted D969 279-position file by stable SHA-256 ordering. Stockfish 18 ran Threads 1, Hash 16,
MultiPV 1 with `ucinewgame` and `Clear Hash` before every probe. Arms were depth 8, depth 12 and two
fresh 100 ms searches. `[V]` (`d1061-bestline-distance-plan.md`; result input digest)

| measure | result | gate | verdict |
|---|---:|---:|---|
| nonterminal legal/non-empty PV | 256/256 | 100% legality | pass |
| depth 8 ↔ depth 12 first move | 65.6% | ≥90% | **fail** |
| 100 ms repeat first move | 100.0% | ≥90% | pass on this machine/sample |
| 100 ms ↔ depth 12 first move | 92.2% | diagnostic | — |

`[V]` (`d1061-bestline-distance-results.json`)

Depth is material evidence identity, not decorative provenance. Depth 8→12 agreement is only 54.2%
on cross-phase rows, 66.7% opening and 81.3% middlegame. A cached hint must retain engine version,
budget and PV; a different budget may produce a different move and therefore a different square,
piece and future event. `[V]` (result `stability.byPhase`)

The 100 ms repeat result is encouraging but bounded. It is one Stockfish build on one machine, with
fresh hash and no concurrency. It establishes that the shipped client default is technically usable;
it does not make the line timeless or authoritatively best. `[M]`

## 2. The four labels do not yet form an axis

For the depth-12 first move, the instrument counts how many current legal moves remain consistent
with each plausible disclosure:

| interpretation | mean candidates remaining | positions where >1 remains |
|---|---:|---:|
| square = origin square | 4.03 | 90.6% |
| square = semantic destination | 1.83 | 57.8% |
| piece = exact piece | 4.03 | 90.6% |
| piece = role (“a knight”) | 8.44 | 95.3% |
| exact move | 1.00 | 0% |

`[V]` (`d1061-bestline-distance-results.json` `disclosure`)

No substitution reading makes “square → piece” reliably increasing. Origin-square and exact-piece
are byte-for-byte the same candidate set. Role reveals less than either square. Destination square
is frequently almost the move already: 42.2% of positions have only one legal move to that semantic
destination. The only coherent interpretation is **cumulative**, not substitutive: stage 2 adds an
actor to stage 1's target square; it does not replace the square with a piece label. `[V]` for the
census; `[M]` for the recommended contract.

`ply-distance` is the hard missing operand. Every bestline move has an index, but an index is a
distance only after the product names *what happens there*. “Three plies into the PV” says nothing.
“A fork first appears in three plies” is grounded if a registered fork event actually fires on that
edge. The same applies to overload, clearance, deflection, mating threats, pawn breaks and the
strategic/tactical breadth the owner wants. `[V]` (`EvidencePayload.bestline` contains only search
provenance and `movesUci`; `localSemanticEvents` can compile declared events per exact edge)

## 3. There are three stores, not one collection path

The earlier “0 of 764 records are bestline” claim mixed stores and is stale in count. The current
durable content census is **893** records: 415 `engine_eval`, 341 `tablebase_result`, 59
`position_legality`, 52 `opening_identity`, 26 `puzzle_provenance`, and **zero bestline**. More
importantly, zero is enforced by type: the closed authoring `EVIDENCE_KINDS` has seven members and no
bestline. `[V]` (`apps/server/src/sourcing/types.ts:58-67`; instrument corpus census)

The two other paths are different objects:

- runtime analysis can already enqueue `EvidencePayload.bestline` and persist it as a run
  `evidence.attached` event (`service.ts:1465-1494`; `evidence-queue.ts:426-449`);
- `make engine-walk` is read-only and emits a cp/mate node plus at most one best-move child score;
  it does not emit the full PV or an `EvidencePayload.bestline` (`sourcing/engine-walk.ts:72-88`).

`[V]`

Consequently “run the engine pass” is not an executable content-population instruction today.
Either the hint RFC uses the already-durable runtime event path—which naturally covers Just Play,
imports and arbitrary campaign positions—or a separate sourcing-schema amendment adds a durable
authoring bestline kind. Bulk-authored pack PVs alone cannot serve dynamic positions and would churn
when the engine/budget changes. `[V]` for current reach; `[M]` for the recommendation.

## 4. Required derived primitive

A future RFC should define one projection, named here only as a research placeholder:

```
derived.hint.semantic_horizon@1 {
  engineLineRef;                 // exact engine/version/budget/PV evidence
  eventRef;                      // exact registered semantic event selected on a PV edge
  actor;                         // typed piece identity at the root or event edge
  targetSquares;                 // typed by the selected event, never guessed from prose
  occurrencePly;                 // first edge on which that exact event fires
  firstMove;                     // canonical move identity + semantic destination + SAN display
}
```

Derivation replays the legal PV, compiles registered semantic events for every edge and applies one
declared eligibility/selection policy. It abstains when there is no eligible event, no typed actor or
no typed target. It inherits the weakest grounding in the chain (`bounded_search` here) and cannot
say the PV is objectively forced unless a stronger source such as Syzygy supplies that fact. `[M]`

The four stages then become cumulative and mechanically enforceable:

1. target square(s);
2. target square(s) + actor piece;
3. those + first-occurrence ply distance;
4. those + first move (or the full PV only under a separately higher ceiling).

This is the producer→feature binding the platform was missing. The same classifiers used in Review,
packs and player analysis identify the event; the engine supplies a plausible searched route; the
module/preset/role ceiling decides how much of the sealed record becomes visible. `[M]`

## 5. RFC and implementation order

1. Author the semantic-horizon projection and cumulative stage semantics; do not add four authored
   hint strings to packs.
2. Declare which semantic event families qualify and require typed actor/target operands. Noise
   selection happens before stage rendering.
3. Use runtime `bestline` events as the first collection path and preserve provider unavailability
   as an honest empty state. Do not require bulk content migration for arbitrary-position support.
4. Measure semantic-event coverage over the fixed PV population before choosing defaults. Sparse
   events remain on-request; they do not trigger generic engine-move fallback.
5. Bind the resulting item through preset ∩ workflow ceiling ∩ role ∩ availability. `move` remains
   prohibited wherever a live committing decision's ceiling excludes it.
6. Only after deterministic rendering works may the optional LLM paraphrase the selected stage.

## Limits

- N=64 is a deterministic repository sample, not all chess positions.
- The provider run does not measure learner comprehension or whether a particular stage feels fair.
- No semantic-horizon coverage was claimed here; that requires the projection's closed eligible
  event set first, otherwise a raw 67-family census repeats the noise defect.
- No result grades a move, calls a PV best play in prose, or licenses pre-commit move display.
