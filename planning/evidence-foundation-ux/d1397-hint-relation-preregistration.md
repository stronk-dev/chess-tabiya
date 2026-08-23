# D1397 — relation-safe engine-hint selector preregistration

- **Frozen:** 2026-08-23, before emitting the full D1363 candidate population or reading any
  relation-safe selection result
- **Purpose:** test the smallest perspective/polarity contract that can replace the refuted raw
  precedence in `rfc/hint-distance.md`
- **Instrument:** disposable research under `tools/d1397-hint-relation-harness/`
- **Production code:** none

## Question

After separating direct root transitions, later root-side occurrences and opponent-line
occurrences, how much of the exact seven-family D1363 population remains eligible for an honest
engine-semantic nudge? Which signs survive a family-specific admission table, and how much apparent
reach came from opponent actions or non-helpful loose-piece states?

This instrument does not label a move best, good, causal, preventive, winning or useful. It tests
whether a renderer can make the narrower literal claim encoded by each relation.

## Frozen population and constructors

Re-run the exact D1363 population and adapters without modification: 64 fixed positions, the
committed `depth12` and `movetime100_a` PV arms, at most four legal plies, and the ordered family set
`mate_in_one | forced_mate | double_attack | fork_survives_reply | discovered_executed |
loose_piece | promotion_pressure`.

The D1363 input digest, runtime-source digest and every candidate's occurrence digest must match
the committed result. The D1397 collection pass may add every exact candidate occurrence to the
artifact; it may not add, remove, reorder or reinterpret a constructor.

## Frozen relation grammar

Every candidate receives exactly one relation by legal edge arithmetic:

| relation | exact predicate | eligible for this nudge? | literal claim ceiling |
|---|---|---|---|
| `root_direct` | edge side = root side and ply = 1 | family table below | “after this first move, this event holds” |
| `opponent_line_event` | edge side != root side and ply ∈ {2,4} | **no** | separate future reply/threat module only; no threat label here |
| `root_followup_in_line` | edge side = root side and ply = 3 | family table below | “on your next turn in this searched line, this event holds” |

No relation says the first move **caused** a ply-3 event. No opponent event is renamed a threat,
because occurrence by the opponent does not itself prove an adverse target or intention.

## Frozen family/sign admission

| family | admitted status | exact relation-specific reading |
|---|---|---|
| `mate_in_one` | `exact` | the root-side edge is checkmate |
| `forced_mate` | `proofStatus=proved` | the root-side edge has the bounded proof recorded by its constructor |
| `double_attack` | `gained` | the root-side edge creates the declared double attack |
| `fork_survives_reply` | `matched` | the declared root-side double attack survives every enumerated immediate reply |
| `discovered_executed` | `gained` | the root-side edge executes the declared discovered line |
| `loose_piece` | `lost` only | one of the mover's own previously en-prise pieces is no longer en prise |
| `promotion_pressure` | `passAvailability={available,true}` **and** `replyPersistence={available,true}` | the mover's declared pawn retains a legal promotion after every immediate reply |

`loose_piece:gained` is a self-exposure reading for a post-commit warning; `preserved` is an
unchanged risk. Neither is an engine hint toward the move. A promotion reading with either boolean
false remains a typed passed-pawn reading but does not earn the promotion-horizon nudge.

## Frozen policies

Report without choosing between:

1. **strict-direct:** admitted `root_direct` candidates only.
2. **strict-horizon:** admitted `root_direct` plus `root_followup_in_line` candidates.
3. **refused-opponent:** every `opponent_line_event`, counted by family/status/phase but never
   selected as the root hint.

Within policies 1 and 2 retain D1363 family precedence, then earliest ply, canonical target, edge
UCI and occurrence digest. Report reach, selected family/status/relation, candidate and refusal
counts by phase and engine arm, plus exact position ids.

## Able-to-fail clauses

1. The complete candidate multiset and occurrence digests reproduce D1363 exactly; mismatch stops
   interpretation.
2. Every candidate maps to exactly one of the three relations and every selected candidate is
   root-side.
3. Permanent positives and hard negatives exercise each admission branch, including loose
   gained/lost/preserved and promotion true/false persistence.
4. Injecting a higher-precedence opponent mate/fork candidate cannot change either strict policy.
5. Injecting `loose_piece:gained`, `loose_piece:preserved` or non-persistent promotion candidates
   cannot change either strict policy.
6. No minimum reach is declared. A low or zero result is reported, never repaired by widening the
   signs after inspection.

## Interpretation boundary

A passing result establishes a source-safe occurrence selector, not learner usefulness. The
separate cold/warm/provider-off end-to-end latency gate remains blocked on the shared score-free
candidate/event packet and the sealed disclosure/render path. An RFC may consume D1397 only if it
keeps these identities separate and preserves theory/authored/tablebase fallback when the engine
selector is empty.
