# D1363 — hint-selector production-table preregistration

- **Frozen:** 2026-08-23, before reading any result under the seven-family table
- **Purpose:** discharge the missing research arm identified by
  `codex-hint-distance-review.md` B1/B2
- **Instrument:** `tools/d1363-hint-selector-harness/` (disposable research)
- **Production code:** none

## Question

What reach, family mix and actor-side mix results when the exact seven-family table drafted in
`rfc/hint-distance.md` is evaluated on the already-frozen D1061 engine lines, and how often would
its precedence rule select an opponent action or a later event as the explanation attached to the
root first move?

This instrument does **not** decide that an event is helpful, favorable, causal, interesting, or a
reason for a move. Those are not derivable from temporal occurrence and no such label is emitted.

## Frozen population

Read `planning/evidence-foundation-ux/d1061-bestline-distance-results.json` exactly as committed.
Require 64 unique positions, each with the `depth12` and `movetime100_a` arms. Replay at most the
first four legal plies of each PV. Record the input file SHA-256 and the current runtime source-tree
digest in the result.

No new engine query, pack selection, position replacement or search deepening is permitted. A PV
with fewer than four plies contributes the plies it contains.

## Frozen family adapters and order

Order is the RFC's precedence order. Every candidate retains exact root side, edge side, edge ply,
actor, targets, sign/status, first move and constructor identity.

1. **mate_in_one** — `mateInOne(beforeFen).mates` contains the edge move. Actor and mated-king
   square come from that matched member.
2. **forced_mate** — `forcedMateAfterMove(beforeFen, edgeMove, 4, replyBreadth(...))`; admit only
   `proofStatus === "proved"`. `budget_exhausted` is an abstention and `refuted` is not a candidate.
   Actor is the proof attacker; target is the opposing king square in the child position.
3. **double_attack** — the sealed `rules.tactic.event.double_attack@1` event from
   `localSemanticEvents`; actor/targets are its declared mover and target operands.
4. **fork_survives_reply** — only when the same edge has a double-attack event and
   `forkSurvivesReply(doubleAttack, replyBreadth(...)).matched === true`; actor and targets are the
   exact double-attack operands.
5. **discovered_executed** — the sealed `derived.tactic.discovered_executed@1` event from
   `localSemanticEvents`; actor is the moved screen, targets are its declared target/ray operands.
6. **loose_piece** — every sealed `rules.tactic.event.loose_piece@1` event. Preserve its exact sign;
   do not silently treat `gained`, `lost` and `preserved` as one valence. Actor is the declared
   mover; targets come from the signed before/after loose-piece identities.
7. **promotion_pressure** — each available pawn in `promotionPressureReading(afterFen)` produced
   for the side that just moved. Actor is the pawn and target is its declared promotion square.
   Preserve `passAvailability` and `replyPersistence`; neither is converted to an outcome verdict.

An adapter that cannot extract a typed actor or at least one typed target abstains with
`no_typed_actor` or `no_typed_target`. Constructor exceptions are failures, not empty candidates.

## Frozen selection readings

Report four policies without choosing among them:

1. **RFC-raw:** highest family precedence anywhere in the four-ply window, then earliest ply,
   canonical target, edge UCI.
2. **root-side-only:** same order after excluding candidates whose edge actor differs from the root
   side to move.
3. **root-edge-only:** same order using only ply 1.
4. **root-side-later:** candidates on plies 3 only, reported separately; this is diagnostic of a
   later same-side event, not evidence that the first move caused it.

The report must count RFC-raw selections by `edge_side_relation = root | opponent`. It must also
count how often RFC-raw differs from root-side-only and root-edge-only, with exact position ids.

## Able-to-fail clauses

The result is not allowed to say the draft selector is ready unless all of these hold:

1. Every registered family has at least one permanent positive and one hard-negative fixture,
   either in the runtime suite or added to this disposable harness with the production constructor.
2. No RFC-raw selected row has `edge_side_relation = opponent`. Any non-zero count returns B2 to
   the author; it is not rationalized as an engine-line consequence.
3. Every selected row has an occurrence identity stronger than `{projection id, version}`.
4. The family set exercised by the harness is set-equal to the seven table members; honest zero
   incidence is permitted, an unexercised adapter is not.
5. Integrated selector time (all adapters over a whole line, excluding the already-recorded engine
   search) reports mean, p50, p95 and max for both arms. A p95 above 1,400 ms fails the 1,500-ms
   interactive envelope before transport/rendering overhead; 1,400 ms is the preregistered headroom
   boundary, not a production target.

## Interpretation

- Zero incidence does not refute a family; it refutes claiming population reach from this corpus.
- A passing constructor fixture establishes ability to fire, not usefulness.
- Root-side occurrence still does not establish causality or recommendation.
- No family is added, removed or reordered in response to this run. A changed table requires a new
  preregistration and run.

