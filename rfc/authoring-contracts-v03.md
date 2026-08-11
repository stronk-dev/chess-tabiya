# RFC: Authoring Contracts (drill-pack v0.3 + evidence identity)

- **Status:** draft
- **Author:** claude (for Marco)
- **Created:** 2026-08-11
- **Design refs:** `design/01-training-model.md` (tempo contract, mistake classes), `design/03-product-breadth.md` B4
- **Exploration gate:** breadth program #2 (reordered 2026-08-11); prerequisite of `rfc/evidence-composer.md`
- **Depends on:** `docs/drill-pack-format.md`, `docs/branch-runtime.md`, `docs/engine-workers.md`
- **Parent / amends:** **`rfc/archive/drill-pack-format.md`** (pack schema → v0.3, breaking) and **`rfc/archive/branch-runtime.md`** (segment identity + evidence-ref grammar + `EvidencePayload.source`)
- **Supersedes / superseded by:** —
- **Planning:** `planning/authoring-contracts-v03/` (once implementing)

## Summary

The authored vocabulary the explanation layer needs and v0.2 does not have:
**claim triggers**, **executable timing-window semantics**, a **boundary
combinator**, a **multi-source evidence-ref grammar**, and **stable segment
identity**. Pure contract work — no composition, no UI.

## Motivation

The evidence-composer review found four contracts assumed-but-absent: claims
are floating sentences with no anchor; `windowOpens`/`luxuryMoveBudget` exist in
the schema but are read by nobody and carry no notion of *which plan* the window
is about; `authoredBoundary` has three members and no combinator; and evidence
refs cover only `rules:`/`pack:`/`engine:`, so any Maia, tablebase, corpus, or
feature claim would be dropped by fail-closed validation. Specifying these
inside the composer would have made an implementing agent invent content
contracts nobody reviewed.

Out of scope: packet composition, feature *extraction* (the composer defines
formulas; this RFC only reserves the ref prefix), all UI.

## Specification

### 1. Claim triggers (pack v0.3, breaking)

`feedbackClaim` gains a **required** `when`:

```ts
when: ObjectivePredicate            // reuses the shipped runtime vocabulary
    | { onWindow: WindowId, verdicts: TimingVerdict[] }
    | { atSpineNode: SpineNodeId }
    | { onCheckpoint: CheckpointId }
    | { all|any: When[] } | { not: When }
```

A claim with no satisfied trigger is never emitted. `when` is required — that
is the breaking change and the reason for a major bump: v0.2's untriggered
claims are exactly the ungrounded-emission hazard ADR-0005 forbids. Migration:
the living fixture's placeholder claim gains `{onWindow: …}`.

### 2. Timing-window semantics (pack v0.3)

`timingWindow` gains `id`, `planMoves`, and `opponentArrival`:

```ts
{ id: WindowId,
  windowOpens: SimpleTrigger, windowCloses: SimpleTrigger,
  luxuryMoveBudget: int >= 0,
  planMoves: MoveMatcher[],        // what "executing the plan" means
  opponentArrival: SimpleTrigger } // what "their threat landed" means
```

`MoveMatcher` = `{uci}` | `{san}` | `{pieceTo: {role, square}}` — enough to say
"the c5 break" or "any rook to the open file" without inventing a plan language.

**All derivations become mechanical** (this is the point of the RFC):

| Quantity | Definition |
|---|---|
| `openedAtPly` | first ply on the branch where `windowOpens` matches |
| `playerReadyAtPly` | first ply ≥ opened where some `planMoves` entry is **legal** |
| `playerExecutedAtPly` | first ply where the player **plays** a `planMoves` entry |
| `opponentArrivedAtPly` | first ply where `opponentArrival` matches |
| `luxuryMovesSpent` | player moves in `[opened, executed)` that are neither a `planMoves` entry nor **forced** (forced = only legal move, or the only legal check-evasion) |
| `verdict` | `in_time` if executed ≤ arrival (or no arrival) · `one_tempo_short` if executed > arrival, `luxuryMovesSpent ≥ 1`, and `executed − arrival ≤ 2` · `missed` if `windowCloses` matched before execution · else `n_a` |

The runtime gains **path-relative trigger evaluation** (`simpleTriggerMatches`
and `evaluateObjectivePredicate` currently hardcode `run.activeCursor.nodeId`),
so a window can be replayed across a branch path rather than only at the cursor.

### 3. Boundary combinator (pack v0.3)

`authoredBoundary` members are a **union**: a node is *authored territory* if
**any** member holds (`spineNodeIds` contains it, its ply ≤ `plyHorizon`, or a
`fenPredicates` entry matches). Stated in the schema description so no
implementer picks the other reading.

**`mixed` is dropped.** The composer's `provenanceMode` becomes two-valued:
`authored` | `instruments_only`. The review was right that `mixed` was
hand-wavy; two honest states beat three fuzzy ones.

### 4. Evidence-ref grammar + payload sources (amends branch-runtime)

Prefixes extend to the full evidence taxonomy, one per `evidenceTypes` value:

`rules:<fact>` · `pack:<claimId|checkpointId>` · `engine:<jobId>` ·
`maia:<nodeId>` · `tb:<nodeId>` · `corpus:<queryId>` · `feature:<featureId>@<ply>`

`EvidencePayload.source` widens from the two-value union to the seven
`evidenceTypes` values. Maia selections gain a ref minted at
`opponent.move_selected` time so human-model claims can resolve at all.

### 5. Stable segment identity (amends branch-runtime)

`Segment` gains `id = "<branchId>:<startCheckpointId>:<endCheckpointId>"` —
deterministic, rewind-stable, and meaningful in a URL. Ordinal/`seq` refs are
not used for scoping (they are not stable across rewind-and-replay).

## Deviations from design

None. `mixed`'s removal simplifies the degradation contract the BACKLOG row
describes without weakening it.

## Acceptance criteria

- Pack schema v0.3 validates a claim with each `when` form and **rejects a
  claim without `when`**; living fixture migrated; archive fixture untouched.
- Timing derivations: fixture branches producing each verdict (`in_time`,
  `one_tempo_short`, `missed`, `n_a`), incl. a `forced` move proving it does
  not count against `luxuryMoveBudget`.
- Path-relative evaluation: a window evaluated on a non-cursor branch path
  yields the same result as when that path was the cursor.
- Boundary: a node inside `plyHorizon` but outside `spineNodeIds` is authored
  (union semantics asserted, since the living fixture's members disagree).
- Ref grammar: constructors + resolvers for all seven prefixes; a Maia-sourced
  claim resolves end to end (the case that was silently undroppable before).
- Segment ids stable across a rewind-and-replay (asserted).
- `ENGINES_REQUIRED=1 make verify` green; `docs/drill-pack-format.md` and
  `docs/branch-runtime.md` amended.

## Open questions

- Whether `MoveMatcher` needs a "any move reaching structure X" form — deferred
  until an authored pack wants it; the three shipped forms cover the tempo
  contract.

## Changelog

- 2026-08-11: created after the evidence-composer review (EC-C1/C2/C3/C4/C7)
  showed these contracts must exist before composition can be specified.
