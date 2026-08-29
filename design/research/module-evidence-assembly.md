# Module evidence assembly — the missing producer execution join

**Date:** 2026-08-27; dependency reconciliation refreshed 2026-08-30

**Question:** What exact operation must turn authoritative run state and optional providers into
the declared evidence consumed by learner modules?

**Feeds:** D1865, D1870, `rfc/module-registration.md`, `rfc/evidence-presentation.md`

**Instrument:** `tools/d1865-evidence-assembly-harness/` (`make module-evidence-assembly`, 8/8
arms green under Node 24)

## Verdict

The evidence catalogue is a declaration and admission authority, not an execution graph. The
module RFC currently starts after the missing step: `evidenceForConsumer` filters an array supplied
by its caller, but nothing constructs that array for one module request. `[V]`
(`packages/runtime/src/evidence-contract.ts:evidenceForConsumer`;
`rfc/module-registration.md` §2.5)

The existing `evidencePacket` cannot be promoted unchanged into that role. It collects phase,
basic structural readings, pivotal/endgame facts, matching shapes, authored claims and recorded
engine/tablebase readings. It never calls `localSemanticEvents`, the candidate collector,
Stockfish/Maia/Syzygy/Explorer operations, comparison derivations or story derivations. `[V]`
(`apps/server/src/guidance.ts:116-143`; executable source-negative in the D1865 harness)

The reconciled non-empty, non-Guided-Hint target expands to **206 exact module-consumer ×
projection pairs**. At current HEAD, 204 resolve to a compiled projection and two do not:
`derived.explorer.population_summary@1` and `pack.authored.classifier@1`. Guided Hint adds zero
current projections because its measured family×rung disclosure registry does not yet exist.
This target restores owner-ruled `outpost`, replaces the authoring-only opening record with
`theory.opening.current_endpoint@1`, includes the two compiled grade uses, and adds the seven
observed semantic tactics to Nudge, Review and Inspector. `[V]` (`design/BACKLOG.md` D1870 and
D2030; D1865 harness arms 1, 2, 4 and 5)

`pawn_safe_square` remains a genuine one-row owner fork. The confirmed target excludes it and is
206 pairs; returning it to requested Sight changes only that one pair and yields 207. The harness
executes both images so an author cannot hide the choice inside a total. `[V]` (D1865 harness arm
2; `rfc/module-registration.md` open question 1)

The current RFC text still excludes the registered observed semantic-tactic family altogether.
The reconciled target closes that consumer-side hole explicitly: deflection, attraction,
line/square clearance, interference, check zwischenzug and overload exploitation each bind to
Post-commit Nudge at `postcommit` and to Review Map and Full Inspector at `review`. The two operand
events (`defender_removed`, `defender_duty_relocated`) do not become learner facts. This is the
consumer-side complement of D1067's missing recorded-path compiler, not a substitute for it.
`[V]` (`packages/runtime/src/evidence-catalog.ts:SEMANTIC_WAVE_EVENT_PROJECTION_IDS`; D1865 harness
arm 5)

## Measured assembly population

The table counts consumer/projection **pairs**, not unique projections. Reuse across modules is
intentional and must not cause repeated chess computation. `[V]` (D1865 harness arm 3)

| assembly stage | pairs | existing authority |
|---|---:|---|
| position-local | 45 | structural/phase/endgame readings over one canonical FEN; +1 only if the owner returns `pawn_safe_square` |
| position-or-edge local | 42 | castling, tactics, square, mobility, pawn and king arithmetic |
| edge-local | 24 | `localSemanticEvents(beforeFen, moveUci, afterFen)` and its exact subcollectors |
| derived after inputs | 64 | grade, compare/story and typed semantic derivations, including 21 observed-tactic consumer pairs |
| optional provider | 11 | Stockfish, Syzygy, Maia and Explorer operations |
| run-local | 9 | recorded move/consequence/checkpoint/pivotal state |
| catalogue-local | 4 | shapes and opening identity |
| recorded-local | 4 | pack-ledger engine/tablebase observations |
| pack-local | 1 | authored claim |
| declared but absent | 2 | Explorer population summary; authored classifier |

The distribution totals 206 confirmed pairs; the owner fork changes it to 207 by adding one
position-local pair. It refutes two tempting implementations. Running all producers per module repeats
the same position/edge arithmetic many times. Starting from `evidencePacket.declared` silently
starves at least the edge, provider and most derived stages. `[V]` (same census plus
`apps/server/src/guidance.ts:116-143`)

## Required execution shape

One server-owned operation should assemble evidence for a **request moment**, before F1 consumer
admission. The operation is not a new chess detector. It orchestrates existing authorities and
returns their declared evidence plus typed execution receipts. `[M]`

```text
authoritative request + effective help ceiling
  -> canonical position/edge/history frame
  -> shared local snapshots (once per FEN/edge)
  -> recorded/catalogue/run facts
  -> only requested optional provider operations
  -> declared derived projections over exact inputs
  -> per-module evidenceForConsumer admission
  -> reducer
  -> pair-keyed sealed presentation
```

The frame is timing-specific: `[M]`

| timing | authoritative subject | permitted collection |
|---|---|---|
| pre-commit selection | current cursor node + validated selected square | one current-position snapshot, then square-scoped projection |
| at-commit warning | current node + validated legal staged UCI + derived child FEN | staged child readings and bounded local consequence checks; never mutate the run |
| post-commit | mutation result's learner node and exact incoming edge | one before/after edge collection plus the child position snapshot; query before an automatic reply moves the cursor |
| checkpoint/on-request | exact open checkpoint/disclosure boundary | current position/run/catalogue facts and only the requested optional source |
| review/analysis | immutable run prefix and selected node/edge | traverse each distinct node/edge once, add recorded facts, then derive compare/story/grade projections |

Every source must report one of `not_requested`, `available(result)`, `available(no_witness)`,
`unavailable(reason)`, `cancelled`, `stale` or `failed_typed(reason)`. An empty evidence list without
that receipt is not an honest-empty result because it cannot distinguish no chess witness from a
collector that never ran. `[M]`

Provider work is demand-driven and cancellable. Pure local position and edge snapshots are keyed
by canonical subject bytes and shared across every effective module; module reducers consume the
shared declared pool independently. Derived projections run only after their literal inputs are
present and inherit their registered grounding/abstention. `[M]`

No compiled producer-operation authority exists at HEAD. `ProducerDeclaration.implementation` is
a string, while the only executable registry in `evidence-contract.ts` is for consumers. A later
draft proposes an `EvidenceProducerOperation`, but an unimplemented RFC symbol is not an assembly
authority. The module amendment must therefore either depend on that accepted/implemented
authority or own a total projection-to-operation registry itself; it cannot treat manifest
metadata as a callable graph. `[V]` (`packages/runtime/src/evidence-contract.ts:45-55,77-109`;
`rfc/bounded-policy-targets.md` § producer operation proposal)

## Reconciled semantic consumer image

All seven observed projections already carry `fact`, explicit operands, abstention and the four
forms below. The target binding is therefore an admission/presentation decision, not new chess
truth. `[V]`

| consumer | timing | exact projection-form intersection | rows |
|---|---|---|---:|
| `module.postcommit_nudge` | `postcommit` | `list`, `panel`, `lit_squares`, `arrows` | 7 |
| `module.review_map` | `review` | `list`, `panel`, `lit_squares`, `arrows` | 7 |
| `module.full_inspector` | `review` | `list`, `panel`, `lit_squares`, `arrows` | 7 |

Each of the 21 rows needs its own pair-keyed adapter identity. A shared renderer may implement
those adapters, but a consumer-free projection renderer would erase timing, ceiling and seat
authority. No-witness remains honest empty; a broken recorded boundary is a typed assembly
failure and must not be rendered as “no tactic occurred.” `[M]`

## Multi-edge tactics are a separate required stage

`localSemanticEvents` deliberately covers one edge. The semantic-wave operand detectors consume
contiguous recorded anchors across 2–4 moves, while their sealing constructors require one
`run.record.move@1` evidence item per anchor and, depending on the family, exact capture, defender
duty, exchange or check evidence. `[V]`
(`packages/runtime/src/semantic-evidence.ts:844-914`)

Therefore Review needs a recorded-prefix path compiler that: validates byte-equal node/FEN
boundaries; builds the move-evidence chain once; invokes each bounded operand detector; seals only
the exact declared inputs; and emits typed no-witness/broken-boundary results. A Stockfish PV cannot
reuse those recorded-run identities; D1068 correctly requires separately declared hypothetical
horizon projections. `[V]`/`[M]` (D1067, D1068; same source range)

## Able-to-fail closure for the RFC amendment

The author repair should add these falsifiers: `[M]`

1. Set equality from every accepted module pair — 206 confirmed or 207 under the explicit owner
   fork — to one assembly stage and one pair-keyed
   presentation adapter. Removing a stage row must fail.
2. A positive witness for every accepted projection family at every permitted timing; rare
   families may use exact fixtures, but an empty-only corpus result cannot pass.
3. A source-execution receipt proving disabled providers were not called and unavailable providers
   do not erase local evidence.
4. A dedup fixture proving two modules sharing one projection cause one collector invocation but
   two independent consumer admissions.
5. A staged-move fixture proving the child FEN is inspected without committing, followed by one
   exact commit after confirmation.
6. A post-commit fixture proving evidence describes the learner move rather than the automatic
   opponent reply.
7. Recorded semantic-path positives for deflection, attraction, both clearance forms,
   interference, zwischenzug and overload, plus broken-boundary and no-witness negatives; the
   21 consumer bindings are set-equal to the 7×3 table above and exclude both operand events.
8. A Guided Hint fixture that remains red until the measured disclosure registry is non-empty and
   set-equal to its family×rung source registry.

## Consequence for 1.0 ordering

The lawful order is: finish the missing producer/path authorities and shared provider execution;
amend module acceptance to include the evidence intended for learner features; specify this
assembly operation; complete exact pair-keyed presentation; then implement module queries and
seats. Building seats earlier would merely give honest styling to empty packets. `[M]`
