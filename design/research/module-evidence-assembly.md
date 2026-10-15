# Module evidence assembly — the missing producer execution join

**Date:** 2026-08-27; dependency reconciliation refreshed 2026-08-30

**Question:** What exact operation must turn authoritative run state and optional providers into
the declared evidence consumed by learner modules?

**Feeds:** D1865, D1870, `rfc/module-registration.md`, `rfc/evidence-presentation.md`

**Instrument:** `tools/d1865-evidence-assembly-harness/` (`make module-evidence-assembly`, 12/12
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

The reconciled non-empty, non-Guided-Hint target expands to **207 exact module-consumer ×
projection pairs** after the owner's affirmative `pawn_safe_square` ruling. At current HEAD, 205
resolve to a compiled projection and two do not:
`derived.explorer.population_summary@1` and `pack.authored.classifier@1`. Guided Hint adds zero
current projections because its measured family×rung disclosure registry does not yet exist.
This target restores owner-ruled `outpost`, replaces the authoring-only opening record with
`theory.opening.current_endpoint@1`, includes the two compiled grade uses, and adds the seven
observed semantic tactics to Nudge, Review and Inspector. `[V]` (`design/BACKLOG.md` D1870 and
D2030; D1865 harness arms 1, 2, 4 and 5)

`pawn_safe_square` is the one-row owner ruling applied on 2026-08-30. It returns only to requested
Sight, producing the confirmed 207-pair image and no other module binding. The harness fails if the
row disappears or widens another module. `[V]` (D1865 harness arm 2;
`rfc/module-registration.md` open question 1)

The same live join finds **117 unique compiled projections** underneath the 205 compiled pairs.
That is the assembler's execution population: collection is once per exact subject/projection,
then independently admitted to every consuming module. Treating 205 pairs as 205 collector calls
would repeat shared chess arithmetic; treating 117 projections as 117 learner bindings would erase
consumer timing and presentation authority. `[V]` (D1865 harness arm 12)

The disposition-transfer prose was materially stale. Intersecting the accepted projection ids
with the live manifest derives **23** dispositions, not 16; the old list named
`rules.phase.reading` even though it has no disposition and omitted eight accepted disposed facts.
The exact 23-member source-derived set is now a permanent harness arm, so binding/disposition
exclusivity no longer relies on a second hand count. `[V]` (D1865 harness arm 10; [[D2044]])

The exact accepted answer-content unions are also derived per module. They range from
`fact + pattern` for Sight and `fact + threat` for Blunder Prevention to the Inspector's nine-kind
union; these values require literal branched capability sets rather than one misleading total
ceiling. `[V]` (D1865 harness arm 11; [[D1868]])

The pre-reconciliation RFC text excluded the registered observed semantic-tactic family
altogether. The author-amended target closes that consumer-side hole explicitly: deflection, attraction,
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
| position-local | 46 | structural/phase/endgame readings over one canonical FEN, including owner-ruled `pawn_safe_square` |
| position-or-edge local | 42 | castling, tactics, square, mobility, pawn and king arithmetic |
| edge-local | 24 | `localSemanticEvents(beforeFen, moveUci, afterFen)` and its exact subcollectors |
| derived after inputs | 64 | grade, compare/story and typed semantic derivations, including 21 observed-tactic consumer pairs |
| optional provider | 11 | Stockfish, Syzygy, Maia and Explorer operations |
| run-local | 9 | recorded move/consequence/checkpoint/pivotal state |
| catalogue-local | 4 | shapes and opening identity |
| recorded-local | 4 | pack-ledger engine/tablebase observations |
| pack-local | 1 | authored claim |
| declared but absent | 2 | Explorer population summary; authored classifier |

The distribution totals 207 confirmed pairs. It refutes two tempting implementations. Running all producers per module repeats
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

1. Set equality from all 207 accepted module pairs to one assembly stage and one pair-keyed
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

## 2026-10-14 — recorded Inspector acquisition is not delivery (D3791/D3792)

**Question:** do the ten already accepted recorded-window successors reach Full Inspector?
This is a bounded current-source measurement, not a refresh of the historical 207-pair census
above. The current accepts and exact adapters exist, but `inspectorSources` acquires only
position, incoming-edge and saved-packet routes; it never invokes `recordedSemanticPath`.
The latter already constructs the ten exact successors from validated recorded boundaries.
`[V]` (`packages/runtime/src/module-query.ts`, `inspectorSources`;
`packages/runtime/src/module-query-sources.ts`, `moduleQuerySourceRoutes`;
`packages/runtime/src/presentation-inspector-adapters.ts`;
`rfc/module-registration.md` §1.3.1; `rfc/recorded-semantic-path.md` §§3/7.)

**Method:** `make inspector-demand-research` bundles three guarded, disposable in-memory
variants of the real query. It edits no application source. Each uses the ten canonical
positive sequences and their ten hard negatives, excluding trade completion because Inspector
does not accept that successor. The acquisition candidate invokes the existing compiler and
selects only emitted events ending at the inspected node on its resolved recorded branch.
The third candidate additionally narrows the acquired pool to Inspector's existing `derived`
family *before reduction*. All retain the real assistance authority, admission, reducers,
registered adapters, strict presentation receipt, exact emitted evidence identity and unchanged
saved run. Fixed fixture results are not all-domain semantic qualification, HTTP/authentication,
native UX or demand-driven acquisition proof. `[V]`
(`tools/d3792-inspector-demand/build.mjs`, `probe.ts`;
`packages/runtime/src/testing/recorded-sequence-fixtures.ts`.)

| Variant | Positive families displayed / tested | Hard-negative false positives / tested |
|---|---:|---:|
| Current production query | 0 / 10 | 0 / 10 |
| Recorded source acquired, existing mixed pool | 0 / 10 | 0 / 10 |
| Same acquisition, derived-family-only reduction | 10 / 10 | 0 / 10 |

In the acquisition candidate, the ten positive queries admit 21–115 facts. Nine requested
successors disappear at the existing 20-fact backstop; contact timing survives that backstop
but its atomic bundle exceeds the remaining mark budget. The focused candidate displays
2–5 facts, 49–137 words, 1–7 marks and no arrows, below the unchanged Inspector limits
20/400/20/8. All displayed target receipts match the compiler's exact emitted evidence,
and every query preserves saved state. Missing overflow-recorder observations in a candidate
without truncation are `null`, not a fabricated admitted count of zero. `[V]`
(`make inspector-demand-research`; the small ignored `.cache/d3792-inspector-demand/*.json`
reports are optional rerun output, not tracked inputs or CI/progress dependencies.)

**Conclusion:** collection alone cannot close D3791. Keep production and executable-pair
statuses unchanged. D3792 needs a bounded Inspector contract that makes each existing family
explicitly inspectable and distinguishes collected-but-budget-limited from source no-witness.
It must preserve admission, source ceilings and current budgets, not choose a global motif
ranking or widen Nudge's single-edge scope. `[M]` This experiment only establishes the
focused-view feasibility on its fixed population; it does **not** justify shipping the
post-acquisition filter as demand-driven collection or declaring every motif useful.

**Author handoff (not accepted production policy):** amend the existing module-registration
Inspector section, rather than open another competing roadmap. Pin the exact request/response
grammar and compatibility before changing parsers; narrow source work before acquisition;
retain mixed available/unavailable/refused outcomes; report source witness separately from
fact/word/mark/arrow truncation; and keep one focused modal with existing board/focus ownership.
Acceptance must include all ten real positive/negative receipts, withheld/disabled zero work,
root/interior/future/sibling/broken-path boundaries, unchanged saved state and budgets, actual
authenticated query/client parsing, and native selection → view → reload → return. Resolve
shared-resource claims before declaring any new wire version. Independent acceptance precedes
implementation; D3791/D3792 remain open. `[M]`

### Individual-fact census — 2026-10-14, D3795/D3796

**Scope/method:** the same opt-in `make inspector-demand-research` now inventories all 75
exact refs from `MODULE_CONSUMER_ACCEPTS.full_inspector`. Actual route metadata separates
24 position, six incoming-edge, ten recorded-window, six saved-packet and 29 dependency-input
refs. Forty have real local/recorded measurements; the remaining 35 are explicitly unmeasured,
not false no-witnesses. Eight existing imported games provide 513 legal edges; eight roots and
three exact mate/stalemate/kings-only controls total 524 positions. Canonical positive/negative
recorded sequences use the real path compiler. Each complete fact is measured alone through
actual source construction, witness filtering, module admission, registered presentation and
unchanged fit. Source receipt identity and saved recorded runs remain unchanged. This is an
isolated pipeline census, not full query/HTTP/UI or semantic qualification. `[V]`
(`tools/d3792-inspector-demand/census.ts`; `tools/r2-selection-harness/imported-sample.pgn`;
`packages/runtime/src/evidence-catalog.ts`, `RECORDED_PATH_SUCCESSOR_REFS`;
`packages/runtime/src/internal/evidence-value-routes.ts`; `module-query.ts`;
`testing/recorded-sequence-fixtures.ts`.)

| Complete source fact | Witnessed instances | Fits alone | Overflows alone |
|---|---:|---:|---:|
| Ray classification | 479 | 261 | 218 |
| Square control | 524 | 0 | 524 |
| Piece destinations reading | 502 | 25 | 477 |
| Piece destinations event | 1,564 | 1,551 | 13 |
| King-zone state | 524 | 25 | 499 |
| Defender-duty set | 521 | 77 | 444 |

All rows are `[V]` from the actual registered `@1` facts and `fitModulePresentation` in the
above command. Events can emit more than one instance per edge. The optional report is a
bounded <64 KiB aggregate in ignored `.cache/d3792-inspector-demand/census.json`; it contains
no raw games, FENs or provider captures and is not a CI/progress input. Other sampled fits
do not establish universal size bounds or usefulness.

**Separate exception and repair:** before the repair all 524 legal-move maps were admitted,
but five valid zero-move maps threw at the square-set adapter. Four newly played both-color
mate/stalemate runs reproduce the actual query exception (terminal roots are rightly refused
and are not valid run fixtures). The accepted adapter lights movable pieces and requires a
nonempty square set. Its witness gate now matches that population, while the complete source
map and adjacent legal positives remain unchanged. The census now witnesses/presents/fits
519 maps, leaves five without that presentation witness, and reports zero adapter refusals.
Focused 206 tests, actual authenticated application/SQLite/foreign-account controls, strict
types and four native desktop/phone move → terminal result → Inspector → return/reload
cases pass. `[V]` (`packages/runtime/src/module-query.test.ts`;
`apps/server/src/terminal-inspector.test.ts`; `tests/browser/drill.spec.ts`;
`make recorded-inspector-check terminal-inspector-browser-check typecheck`.)

**Contract consequence:** family focus helps mixed-pool contention but cannot expose a
complete atomic bundle that exceeds limits on its own. D3792 needs exact bounded detail
presentation as well as pre-acquisition demand and truthful budget-limited state, with
request/response compatibility independently accepted. Enlarging budgets, silently truncating
source operands or calling withheld facts “no witness” does not answer this finding. `[M]`
D3795 closes the bounded research question; D3796 closes the concrete exception only.
D3791/D3792, dependency/provider measurements and whole Inspector qualification remain open.

### Bounded source-member detail — 2026-10-14, D3797/D3798

The existing opt-in `make inspector-demand-research` now type-checks the census/model before
bundling. It runs six closed, disposable source-member constructors over the same 524 real
positions and their emitted destination events: 4,184 genuine source values. These are view
models, **not** production evidence, schemas, registered renderers or presentation receipts.
They retain the complete original source and scope/total/member identity; each displayed row
copies its complete relevant relation and never labels the subset as the whole reading. `[V]`
(`tools/d3792-inspector-demand/detail-model.ts`, `census.ts`, `tsconfig.json`; `Makefile`.)

| Source | Complete modeled members | Bounded batches | Maximum batch words / marks / arrows |
|---|---:|---:|---|
| Ray classification | 5,391 | 1,544 | 119 / 12 / 8 |
| Square control | 154,466 | 19,538 | 125 / 14 / 8 |
| Piece destinations reading | 22,796 | 3,081 | 117 / 14 / 8 |
| Piece destinations event | 14,253 | 2,368 | 189 / 10 / 0 |
| King-zone state | 16,347 | 2,263 | 117 / 13 / 8 |
| Defender-duty set | 13,304 | 1,897 | 181 / 14 / 8 |

All table entries are `[V]` from the above normal command. The 226,557 member representations
are checked in-memory, not recorded to Git. At most eight complete members occupy one batch,
stopping before the actual current Inspector budgets. Concatenated batch ordinals equal the
complete member image with no gaps or duplicates. Source values remain byte-equal. Invalid
ordinals, changed-source keys and counterfeit plans refuse in 25,104 controls. Copied row
data is recursively immutable; plans come only from private admitted constructors. Those
guards establish representation integrity, not a production receipt or semantic authority.

**Usability boundary:** blindly paging through every control is not a satisfactory UI.
Explicit target/color/geometric-versus-legal focus is tested for every square in every reading:
134,144 requests, at most five members, one batch, 90 words, six marks and five arrows.
2,112 requests retain unavailable legal-clone reasons rather than inventing an empty legal set.
Invalid target/color/mode refuse. These are source-specific scopes, not a generic JSON path or
piece-move inference. No pointer/touch/keyboard, actual HTTP or mounted UI is claimed. `[V]`
(`focusControl`, `detailBatch`; `census.ts`, `controlFocus`.)

The additional real en-passant control proves an important limit: `e5d6` is in the actual
complete legal-move map, while the accepted square-control turn clone deliberately clears en
passant and retains no legal-clone controller at d6. The detail explicitly names that clone
limit. Likewise defender duties are geometric, and local non-losing exchange membership is
not whole-position safety or move quality. A focused presentation cannot promote source scope
or exactness. `[V]` (`census.ts`, `epFen`; `square-control.ts`, `turnClone`; `tactics.ts`,
`computeDefenderDutyReading`; `rfc/breadth-collectors.md` §2; `detail-model.ts`.)

Strict typing discovers D3798: the prior census used nonexistent `run.createdAt` for committed
fixture times. It now passes the explicit fixture timestamp and asserts every recorded event
retains it. The original source/admission/fit findings and ten-family reach/negative results
reproduce; source/production code is unchanged. Initial model scope/type mistakes are repaired
before the final frozen run, not hidden by esbuild or longer deadlines. `[V]`
(`census.ts`; the strict first recipe in `make inspector-demand-research`.)

**Author consequence:** `rfc/module-registration.md` §4.11a now holds the bounded **unaccepted**
D3792 draft: explicit source demand, separate wire compatibility, truthful source/budget states,
six literal source-retaining detail views and the no-scope/qualification-promotion rule.
The remaining 35 source suppliers, exact six payload/renderer schemas and closed response/
paging/disclosure grammar are explicit authoring requirements before independent buildability
acceptance. The model must not become a production mint, generic slicer or “derived sentence.”
Other focused views require their own source-backed specification. `[M]` No producer, source
meaning, pack bytes, assistance default, classifier qualification, whole capability or release
state changes. D3791/D3792 stay blocked.

### Remaining Inspector supplier matrix — 2026-10-14, D3799/D3800

This inventories the 35 refs not measured as real local/recorded inputs by D3795; it is not
35 newly delivered sources. `make inspector-demand-research` checks equality against the
existing 75-ref image, records exact factory arms and locates non-test literal callers.
Its ignored report is 42,940 bytes; 28 refs have literal call locators, not reach proofs.
Dynamic pivotal dispatch illustrates why no literal locator does not mean no caller. `[V]`
(`tools/d3792-inspector-demand/source-matrix.ts`; `evidence-catalog.ts`;
`module-query-sources.ts`; `pivotal.ts`, `pivotalMarkerEvidenceItems`.)

The separate opt-in `make inspector-source-contract-research` observes unchanged permanent
factory controls: 37 tests, all 35 refs invoked, 34 with fixture values and opening unavailable.
It writes only route/count/input-key aggregates to an ignored 8,490-byte report. These are
contract executions, not live providers, authenticated Inspector reach or qualification.
`pivotalFixtures` fabricates option-collapse nodes and human distributions; `runFixtures`
adds synthetic checkpoint/objective events and engine fixtures. None establishes legal-play
or real-provider observation. `[V]` (`source-observer.ts`, `vitest.sources.config.ts` beneath
`tools/d3792-inspector-demand/`; `evidence-value-authority.test.ts`, the named fixture builders.)

Keys below are literal factory arms, not caller-authored wire payloads. `moves` means a
contiguous validated list of sealed `run.record.move@1`, never raw UCI or relabelled v2 edges.
Other dependent inputs retain exact declared sealed projections. Authority codes: **P** provider
exchange, **R** recorded path, **A** registered authored provenance, **O** runtime opening identity,
**C** semantic convention. These name consumed authorities; module-registration owns adoption.
All table rows are source-inspected `[V]` against `evidence-factories.ts` and operations below.

| Exact accepted ref | Factory keys | Supplier / scope | Inspector today / authority |
|---|---|---|---|
| `derived.tactic.discovered_executed@1` | `latency,rays` | `discoveredExecutedSemanticEvents`; actual incoming edge | Not acquired; local |
| `derived.tactic.fork_survives_reply@1` | `breadth,doubleAttack` | `forkSurvival`; actual candidate/reply breadth | Not acquired; local |
| `derived.pawn.sequence.contact_timing@1` | `moves` | `pawnContactTimingSemanticEvent`; v1 window | Not acquired; R |
| `derived.pawn.sequence.harassment_pressure@1` | `moves` | `harassmentPressureSemanticEvent`; v1 window | Not acquired; R |
| `derived.tactic.sequence.defender_consequence@1` | `moves` | `defenderConsequenceSemanticEvent`; v1 window | Not acquired; R |
| `live.stockfish.eval@1` | `packet` | Exact-node retained eval attachment | Acquired; legacy P |
| `live.stockfish.wdl@1` | `packet` | Exact-node retained WDL attachment | Acquired; legacy P |
| `live.stockfish.pv@1` | `packet` | Exact-node retained best-line attachment | Acquired; legacy P |
| `human.maia.policy@1` | `page` OR `nodeId,run` | Typed old page or matching recorded opponent selection | Not acquired; legacy P |
| `human.maia.candidate_wdl@1` | `page` | Same page, only candidates carrying WDL | Not acquired; legacy P |
| `human.explorer.population@1` | `page` | Typed old CorpusPage, node/result/committed SAN | Not acquired; legacy P |
| `live.syzygy.result@1` | `packet` | Exact-node retained tablebase attachment | Acquired; legacy P |
| `live.syzygy.category@1` | `packet` | Retained tablebase category fields | Acquired; legacy P |
| `live.syzygy.distance@1` | `packet` | Retained tablebase category/distance fields | Acquired; legacy P |
| `recorded.engine.eval@1` | `ledger` | `recordedReadingEvidence`; sealed sourcing engine record | Not acquired; P |
| `recorded.tablebase.result@1` | `ledger` | Same; sealed sourcing tablebase record | Not acquired; P |
| `theory.shapes.firing@1` | `entries,path` | Registered compiled authored shapes + actual recorded path | Not acquired here; A |
| `derived.pivotal.irreversibility@1` | `branchId,run` | `pivotalMarkerEvidenceItems`; branch transitions | Not acquired here; R |
| `derived.pivotal.phase_change@1` | `branchId,run` | Same; branch phase history, preceding definite phase | Not acquired here; R |
| `derived.pivotal.human_divergence@1` | `branchId,run` | Same; recorded human-common distribution/path | Not acquired here; P |
| `derived.pivotal.option_collapse@1` | `branchId,run` | Same; three same-color decisions, later persistence witness | Not acquired here; R |
| `derived.compare.structure_delta@1` | `branchId,comparison,run` | `compareSources` / strips; exact two-attempt comparison | Not acquired here; local |
| `derived.compare.eval_delta@1` | Same | Same plus matching recorded engine attachments | Not acquired here; P |
| `derived.story.rank@2` | `moments` | Story operation; whole admitted Review moment collection | Not acquired here; Story |
| `derived.opening.deepest_reached@1` | `branchId,run` | Factory abstains; runtime identity source absent | Unavailable; O |
| `derived.tactic.deflection_observed@1` | `captures,check?,duty,exchange,moves` | `deflectionObservedSemanticEvent`; v1 window/dependencies | Not acquired; R |
| `derived.tactic.attraction_observed@1` | `captures,check?,moves` | `attractionObservedSemanticEvent`; v1 window/dependencies | Not acquired; R |
| `derived.tactic.line_blocker_clearance_observed@1` | `exchange,moves` | `lineBlockerClearanceSemanticEvent`; v1 window | Not acquired; R |
| `derived.tactic.square_clearance_observed@1` | `moves` | `squareClearanceObservedSemanticEvent`; v1 window | Not acquired; R |
| `derived.tactic.interference_observed@1` | `duty,exchange,moves` | `interferenceSemanticEvent`; v1 window | Not acquired; R |
| `derived.tactic.check_zwischenzug_observed@1` | `capture,check,exchange,moves` | `checkZwischenzugSemanticEvent`; v1 window | Not acquired; R |
| `derived.tactic.overload_exploitation_observed@1` | `captures,duty,exchange,moves` | `overloadExploitationSemanticEvent`; v1 window | Not acquired; R |
| `derived.tactic.overloaded_defender_response_conflict@1` | `capture,duties` | Factory: actual capture, before-position duties, recapture constraints; no direct production-call locator | Not acquired; local |
| `rules.tactic.consequence.forced_mate_after_move@1` | `beforeFen,breadth,maxAttackerMoves` | Current Hint/Review; sealed reply breadth + bounded horizon | Not acquired here; C |
| `rules.tactic.consequence.forced_mate_after_move@2` | Same | Same operations, exact versioned proof/refutation/unknown | Not acquired here; C |

Supplier anchors: `semantic-evidence.ts` (named sequence/discovered wrappers);
`candidate-population.ts`, `forkSurvival`; `evidence-operations.ts`, `recordedReadingEvidence`
and `positionGuidanceEvidence`; `module-query.ts`, `inspectorSources`, `compareSources`;
`packages/runtime/src/review-evidence.ts`; `compare-strips.ts`; `story.ts`; `hint-distance.ts`;
`pivotal.ts`; and the sole factories in `evidence-factories.ts`. The observer exercises Maia's
page arm, not its alternative run arm, and does not exercise both optional-check arms. `[V]`

Saved packets initiate no live provider request; no matching packet is source absence, not an
empty result. Sourcing records are not run engine attachments. Shapes need actual registered
authored entries. Old provider refs check/digest old bytes, not modern operation-keyed receipts.
Migration holds D3363/D3370/D3373 remain. Ten v1 sequence meanings and recorded v2 successors
remain distinct under accepted §1.3.1; do not duplicate them into one packet or retire v1 by
relabeling. Opening's abstention is a genuine missing runtime source owned by D3376 and
`rfc/installed-opening-evidence.md`, not solved by an ECO/name. `[V]` (`evidence-factories.ts`,
`PROVIDER_PENDING`, `MOVES`, opening factories; `rfc/module-registration.md` §1.3.1.)

**D3800:** position, incoming edge, recorded window, branch, comparison and whole-game sources
need distinct contexts. Option-collapse marks the first low decision after a later same-side
decision remains low; truncating at the marked node removes its witness. One attempt is not a
comparison, and one node is not Story. The unaccepted §4.11a now states these scopes and separates
missing context from successful no-witness. Closed context grammar remains an authoring debt,
not guessed production behavior. `[V]` (`pivotal.ts`, `pivotalMarkerPayloads`; `module-query.ts`;
`story.ts`; amended RFC §4.11a.)

D3799 closes supplier inventory; D3800 repairs the draft premise. Neither closes delivery.
Actual acquisition/legal-path/provider measurements, six exact detail schemas, closed context/
response/disclosure grammar and independent review remain D3792 work. No production code,
pack, default, provider, qualification or release gate changes. These disposable bounded
aggregates stay outside ordinary CI/progress; no raw-data archive or second registry is added.

### Closed Inspector operation author image — 2026-10-14, D3801

The D3792 draft now specifies literal request contexts, strict response alternatives, bounded
source-summary/member paging and the distinct disclosure body. The assistance request uses
the actual exported `RequestedAssistanceV1`, not the draft's nonexistent receipt type name.
Six exact detail refs are separate from the 75 original source topics. Source collection totals,
per-page displayed/deferred counts, selected member ordinals and original source ordinals remain
distinct. An oversized member is `detail_limited`, never a zero-progress successful page. `[V]`
(`rfc/module-registration.md` §4.11a; `assistance-exchange.ts`; `module-query.ts`;
`tools/d3792-inspector-demand/draft-wire.ts`.)

Normal `make inspector-demand-research inspector-source-contract-research` passes strict types,
all existing real-source/model controls and the unchanged 37 factory controls. The disposable
wire instrument exercises all 75 exact source refs against six context kinds: 88 positive
request/range controls and 399 refusals. It rejects mismatched scopes, extra nested fields,
unregistered/unsupported detail refs, same-branch comparison, malformed stamps, invalid ordinal/
continuation/focus and zero-progress/overlapping/inconsistent next ranges. It checks the actual
stage-1 assistance parser and serialized round trips. These are grammar controls, not request
authorization, recorded-prefix correctness, response admission, source execution, new registered
adapters or a production seal. No endpoint uses this tool. `[V]` (same command/tool.)

The server still owes real permitted-prefix reconstruction and supplier acquisition for each
scope. Existing Compare helper selects the latest sibling and uses whole branches; that cannot
stand in for the newly explicit attempt/endpoints. Branch factory signatures likewise do not
by themselves prove arbitrary permitted-prefix supply. Context tests intentionally do not claim
those operations. The six exact payload/factory/renderer schemas, real response/disclosure
controls, source owner migrations and independent acceptance remain before implementation.
`[V]` (`module-query.ts`, `moduleComparisonForSubject`; `evidence-factories.ts`, `pivotalFactory`;
RFC §4.11a.) D3801 closes the bounded authoring prerequisite, not D3792 delivery or 1.0.

D3600's published run is re-read at 38381154879: it still predates D3786's server diagnostics;
the 1,092.9 ms outlier and previously recorded 299.712/598.110 ms mandatory writes supply no
new underlying-cause evidence. Do not repeat that artifact analysis or substitute a local green
replay for a remote repair. Pair timestamped server/transport observations on a newly authorised
published execution before choosing a durability/worker fix. `[V]` (`gh run view --log-failed`;
`design/research/ux-arrival-and-start.md` §§17–18.) No push occurs.

### Six typed detail schemas and temporal/scope controls — 2026-10-14, D3802–D3804

The presentation companion now specifies the six literal view/factory/renderer identities,
closed envelopes and contexts, all eighteen member alternatives, flattening order, readable
subject-qualified templates, neutral component composition and inherited source limitations.
No new producer, registered factory/adapter, component type, API or semantic subject is shipped.
Parent implementing state remains no authority for the unaccepted amendments. `[V]`
(`rfc/evidence-presentation.md` §Draft companion — bounded source-member Inspector detail;
`rfc/module-registration.md` §4.11a.)

Strict opt-in `make inspector-demand-research inspector-source-contract-research` passes typed
member parsing and serialization over the existing real census: 4,184 source values, 226,557
members, all eighteen alternatives observed. Independent reconstruction recovers every complete
ordered ray/duty, controller/target population including empties/unavailability, piece destination
set, all eight event sets and king-zone/shelter/escape operand image. No helper treats a plain
parsed object as admitted evidence. 126 negatives reject extra/missing fields, wrong sources,
duplicates, removals and **still-well-shaped substituted identities**. The latter pass the shape
parser but fail the join to the genuine complete source. This is source fidelity, not an
independent oracle for the collectors' chess semantics, envelope/receipt or native proof. `[V]`
(`tools/d3792-inspector-demand/detail-schema.ts`, `verifyDraftMembers`; `census.ts`.)

Two legally computed curated controls, separate from the fixed corpus population, disprove
overbroad model prose. With White king g1/rook h1 and rights H, `g1h1` is a legal stationary
castle, but the adjacent king escape set is empty. The old “No legal king escape” caption fails;
it now names adjacent legal turn-clone escapes and says this is not every king move. With a
knight b1→a3 under the control's pawn attacks, both local-exchange sets are empty while zeroSafe
is false: the flag means before nonempty AND after empty, not current emptiness. A first test
finds no such event in the fixed eight-game sample and correctly fails; the explicit legal
control is then checked without claiming corpus frequency. The old current-state caption fails
on that control. Later membership captions also fail before repair because they omit the piece
subject. They now retain color and before/after roles/squares on every member. Source data and
predicates remain unchanged. `[V]` (`census.ts`, `castleFen`, `emptyExchangeFen`; `detail-model.ts`;
`king-state.ts`, `escapes`; `mobility.ts`, `pieceDestinationEvents`.)

Optional promoted markers remain literal board markers, never inferred promotion history.
Required king identities also survive empty/unavailable captions. New text costs are measured,
not inherited from D3797's earlier shorter templates:

| Model family | Maximum batch words / marks / conservative arrows |
|---|---|
| Rays | 155 / 12 / 8 |
| Square control | 149 / 14 / 8 |
| Piece destinations | 141 / 14 / 8 |
| Destination changes | 261 / 10 / 0 |
| King zone | 149 / 13 / 8 |
| Defender duties | 283 / 14 / 8 |

Table `[V]` from the same command. Eight-member batches and all 134,144 focused control requests
still fit unchanged current limits; focus maximum is 105 words/six marks/five conservative arrows,
with all 2,112 clone-unavailable reasons retained. These are model estimates, not registered
component-budget receipts. The initial proposed composition is a typed fact statement and neutral
endpoint marks, not arbitrary recommendation arrows. Actual atomic component fit still needs proof.
The ignored <64 KiB aggregate records only counts; no member/source bytes or raw trace is added.

Initial generic type-selector attempts fail strict compilation; explicit typed grouping repairs
them without an unknown/double-assertion escape hatch. Frozen final typing/research passes, along
with 37 unchanged factory controls and D3801's 88 request/range positives/399 refusals. D3802's
bounded schema authoring and D3803/D3804's research-caption defects close only. Real permitted-prefix
suppliers, acquisition/cancellation, production factory/component/envelope/response/native controls
and genuinely independent acceptance remain D3792/source-owner work. No pack, default, live source,
qualification, whole capability/milestone, CI repair or release promotion follows. `[V]` same sources.

### Actual supplier boundaries — 2026-10-14, D3805

`make inspector-supplier-scope-research` creates three genuine legal runtime branches, stores
them through actual file-backed SQLite and reads the parsed production image. It uses the
accepted test-only writer overload: storage/runtime evidence, not authentication. Seven main
path nodes versus four requested prefix nodes establish these boundaries. `[V]`
(`tools/d3792-inspector-demand/supplier-scope.ts`; `apps/server/src/storage.ts`;
`module-query.ts`, `compare.ts`, `recorded-semantic-path.ts`, `pivotal.ts`, `review-evidence.ts`
under `packages/runtime/src/`; normal command terminal success.)

| Existing supplier | Actual observation | D3792 consequence |
|---|---|---|
| Module comparison helper | Chooses newest sibling, not requested peer | A default helper cannot supply explicit peer selection |
| Explicit compareBranches | Both whole recorded tips, not earlier endpoints | Correct branch IDs alone do not bound the comparison |
| Recorded semantic / pivotal | Complete seven-node branch; two pawn-break markers beyond four-node prefix | Selected node/anchor filtering does not establish bounded witnesses |
| Sole Review constructor | Whole tip; extra throughNodeId refuses before storage read | Whole-tip receipt cannot become a bounded subject |
| Genuine event-time replay | Loses current reveal and both later-created alternatives | Historical run state is not current authority plus selected evidence span |

An inherited shared node belongs to the child's actual path despite its creating branch being
Main; use graph membership, not node.branchId equality. A duplicate off-prefix node still refuses
through the original total graph authority: clipping first must not hide it. All reads preserve
stored bytes. An actual sibling write then leaves the main path unchanged, closes current reveal
and retires the old Review subject; a newly issued subject validates. Node/FEN existence alone
is not current source/disclosure authority. `[V]` same tool/code.

Initial import resolution and bundled default content path fail; explicit public source import
and actual installed-registry injection repair the tool, not production. Quiet h3/a6 fails the
non-vacuity control; real legal d4/exd4 contact/capture supplies two markers. A stale-error regexp
fails on the genuine refusal; check its REVIEW_PREFIX_REFUSED code instead. Owned temporary
fixture cleanup runs on failures/success. Failed probes are not source-delivery evidence. `[V]`
same tool's first/refined/final runs.

The unaccepted §4.11a now separates current stored/viewer authority from graph-derived granted
paths, ordered endpoints and complete witness spans. It requires exact source-owner callables,
receiver/cancellation/version contracts and real scope tests—not a filtered DrillRun, latest
sibling, old whole-tip receipt or source retirement. D3805 answers only this boundary question.
Authentication, late/live-source admission, new scope authority, exact-endpoint execution and
production response/native proof remain open. No production, qualification, pack/default,
capability/milestone, remote CI/image or release change. No raw database/run/trace is committed;
the tool emits bounded counts and cleans its own temporary fixture, outside ordinary CI/progress.

### Authenticated recorded-context author model — 2026-10-14, D3813

Normal `make inspector-recorded-context-research` passes strict TypeScript and 44 disposable
controls. It creates three actual accounts with IdentityService's normal scrypt/session path,
an owned file-backed SQLite run and real spectator/participant grants through RunService.
No legacy writer overload or invented principal authorizes the reads. The source fixture has
three legally played branches; seven full main-path nodes remain stored while a four-node
prefix is granted. This proves this model's account/scope behavior, not a production endpoint.
`[V]` (`tools/d3792-inspector-demand/recorded-context.ts`; `apps/server/src/identity.ts`,
`authorization.ts`, `service.ts`, `storage.ts`; normal command terminal result).

| Boundary | Executed control |
|---|---|
| Current authority vs source span | Full canonical run/current reveal retained; no historical replay or partial DrillRun |
| Exact selection | Requested peer wins over newest sibling; inherited nodes work; reordered node arrays yield the same paths |
| Original graph | Duplicate node/branch, missing parent and cycle beyond the requested endpoint refuse before source work |
| Branch/edge contexts | Root lacks an incoming edge; off-branch and too-short endpoints refuse; an endpoint exactly at the fork remains valid |
| Existing local supplier | Actual mobility-event factory receives the selected committed edge and emits four sealed events identical to direct acquisition |
| Account access | Missing/invalid sessions and foreign accounts invoke zero acquisition callbacks; actual grant revocation and logout retire held results |
| Late model receiver | Owner selection, same-path context, effective preference, role, identity and full event-head changes refuse after actual suspension/resumption |
| Cancellation/withholding | Signal reaches acquisition; already-cancelled and closed-feedback requests do zero callback work; cancelled pending results are not returned |

All source reads preserve the complete stored run bytes. The explicit sibling-write control
changes the current head while leaving the requested main path identical; the old request
refuses, the refreshed closed-feedback request remains withheld, and an actual reveal permits
a new exact-prefix read. Grants and sessions are intentionally mutated only within this owned
temporary fixture. Its directory/database are cleaned on success and failure. `[V]` same tool.

An added same-path context mutation first fails with “Missing expected rejection”: the author
model retained a mutable nested context even though its outer selection was frozen. Snapshotting
the exact fields closes that model defect; the new negative remains. Initial type checks also
catch a widened context literal and a non-exported public receipt import; corrections are tool-only.
Final related supplier-scope research and all 37 unchanged factory controls pass. `[V]` same
commands plus `tools/d3792-inspector-demand/supplier-scope.ts`/`vitest.sources.config.ts`.

The draft §4.11a now names proposed server-private resolver/revalidation callables, their exact
input ownership, immutable capture and ordered graph/scope/receiver steps. These remain author
proposals, **not implemented or independently accepted operations**. `[M]` (author synthesis of
the controls above). D3813 closes only this bounded prerequisite; D3792 still owes actual
whole supplier support, source/version admission, completed/imported Review authority, provider
exchange/cancellation and response/component/browser proofs. No providers were configured;
the completed-Review arm explicitly refuses as unmodelled. A generic successful callback is
not evidence that a real provider or whole-branch supplier accepts these scopes. `[V]` tool;
remaining contract obligations in `rfc/module-registration.md` §4.11a.

The callback supplying current selection/preference/cookie is the **disposable owner model**.
The existing server does not know UI changes that are not sent to it. A server implementation
revalidates the stored run/access and original parsed request; the client separately rejects
responses belonging to an old selection/configuration/account or closed Inspector. The draft
must not introduce a global server selection store or present these controls as actual browser
receiver proof. `[M]` (boundary synthesis); `[V]` tool's explicit current callback, no HTTP/client
operation, and `rfc/module-registration.md` §4.11a's separate server/client obligations.

### Exact recorded-prefix and requested-window suppliers — 2026-10-14, D3814/D3815

The previous disposable query's `currentPath.kind === "available"` test is wrong: the actual
total graph resolver returns `resolved`. An added observer inside the **actual candidate query**
first selects Main instead of the active child's inherited node. Changing that discriminant
passes four own/inherited/root/off-path controls over a real stored branched run. Canonical
one-branch figures remain 0/10 baseline, 0/10 acquired and 10/10 family-focused reach with zero
paired-negative reach. Those figures are not evidence of endpoint-correct source scope. `[V]`
(`tools/d3792-inspector-demand/build.mjs`, `scope-selection.ts`; normal
`make inspector-demand-research` predecessor/final results).

`make inspector-recorded-prefix-research` builds guarded in-memory variants of the actual source
compiler; every replacement asserts its unique original anchor and no production file changes.
The unchanged baseline must fail **specifically** on the zero-edge prefix assertion, not an
unrelated build/startup error. A prefix variant retains the full original run/node references,
validates its original branch before extracting the grant and uses the real edge/event factories.
It passes 452 prefixes across 104 legal canonical/hard-negative/color-mirrored/castling runs.
All eleven canonical families have positives. Ninety event occurrences exactly match eligible
complete original-source windows, 7,282 incomplete-continuation receipts remain distinct from
no-witness, and 312 off-prefix duplicate/missing-parent/cycle graphs refuse before preparation.
Three inherited/off-branch/unknown-branch controls pass. `[V]` (`build-prefix.mjs`,
`prefix-source.ts`, `recorded-source-cases.ts`; source `recorded-semantic-path.ts`/`recorded-edge.ts`;
normal command terminal result).

Prefix correctness alone is insufficient for demand-driven Inspector acquisition. The second
variant admits one exact v2 projection and prepares only that family's complete rows ending
at the selected node, before evaluating them. Capture/check preparation is skipped where not
required, while graph and legal-prefix validation remain. Exact event/window/receipt parity
passes across the same 452 requests: 60 emitted occurrences, 304 without a complete window,
92 complete-but-empty and at most five prepared edges. There are 292 capture-free and 324
check-free requests. Older v1 refs are explicitly unsupported by this v2 supplier, not relabelled.
These are algorithm/source controls, not a new production factory or availability promise. `[V]`
(`window-source.ts`, `build-prefix.mjs`; existing evaluator table and source factories).

The same instrument calls actual RunService.importGame over the fixed eight-game PGN sample,
then reads the production parser's stored `sessionKind: imported` runs, alternating learner side.
All 264 source requests (three endpoints × eleven refs × eight games; 513 played edges) exactly
match existing whole-source windows/events at those endpoints and preserve stored bytes. Two
event occurrences emit; rare motifs are not assumed to fire. This uses the accepted test-only
writer overload and an in-memory SQLite database: **not authenticated Review or HTTP/native
Inspector proof**. `[V]` (`window-source.ts`; `tools/r2-selection-harness/imported-sample.pgn`;
`apps/server/src/service.ts`, `storage.ts`; normal command).

The proposed source callable/result/admission order in module-registration §4.11a is author
synthesis `[M]`. It preserves whole-tip callers, gives the targeted source a distinct operation
and non-assignable result union, and maps insufficient history to missing context rather than
no-witness. Inspector's ten admitted successors remain ten; the shared source's eleventh trade
family is not added to that consumer. Prototype identity strings are explicitly research-only;
the generated variants are transpiled experiments, not a proof of proposed production type or
parser correctness. Production source execution, remaining scoped suppliers, live providers,
worker cancellation/performance, receiver/UI and independent acceptance remain open. No raw
run, database, event dump or trace is retained in Git; these tools emit bounded aggregate counts,
outside ordinary CI/progress. No semantic qualification, pack/default, capability or release gate
is promoted.

### Actual recorded Review is not completed-game or Inspector permission — 2026-10-14, D3819

`make inspector-review-scope-research` passes 33 controls across sixteen cases using real
account cookies, local HTTP, file-backed SQLite, actual `createApplication`, source admission
and module-query routes. A uniquely anchored in-memory observer captures the existing private
`#storyContext` only after its original checks; it changes no production source, endpoint or
response. The tool validates the private Review packet and Story-rank evidence, complete
subject/HTTP path agreement and preservation of original imported nodes/evidence prefixes.
Providers are labelled application mocks, not live Stockfish/Maia research. `[V]`
(`tools/d3792-inspector-demand/review-scope.ts`, `review-observer.ts`, `build-review.mjs`;
`apps/server/src/service.ts` #storyContext/assistanceAuthority/moduleQuery;
`packages/runtime/src/review-evidence.ts`, `module-query.ts`).

| Actual case class | Review/source | Outcome | Requested Inspector delivery |
|---|---|---|---|
| Revealed native line, quiet or containing admitted moments | Available | unfinished | Available under analysis preference |
| Actual native checkmate | Available | board_terminal | Available under analysis preference |
| Imported mainline before retry | Available | unfinished or recorded_result | Available under analysis preference |
| Original imported mainline while current retry is undisclosed | Available with complete original moments | Original unfinished or recorded_result | Withheld/409 despite compiled effect |
| Revealed imported retry | Available | Its own unfinished outcome | Available under analysis preference |
| Exact submitted Campaign consequence | Available; empty Story rank in this fixture | unfinished | Withheld/409, no Inspector effect under Campaign kit |
| Unrevealed native/retry, foreign account, unknown branch, unsubmitted Campaign | Refused before private source capture | Not acquired | No source work |

The table is observed behavior, not a new permission rule. An empty admitted source and a
missing source context are distinct. One unfinished native line supplies two actual moments;
the quiet control supplies zero. Both original-import reads after live retry return valid
Review while the actual module route refuses; the compiled effect alone is not delivery.
Foreign access retains privacy/404 and other boundary refusals retain409. `[V]` tool and
accepted `rfc/review-evidence-compiler.md` §4 / `rfc/review-map.md` §§1/4/8.

Author synthesis: the draft context is `recorded_review`, not `completed_review`. Resolve
current read and module authority separately before collecting evidence. Do not force Play's
disclosure flag true, replace the full stored run with a filtered one or infer permission from
a client result/effect. The current source constructor supports the whole admitted branch tip
only. An earlier endpoint still requires an exact source-owner operation, not trimmed whole-tip
moments with a reused receipt. `[M]`; proposal in `rfc/module-registration.md` §4.11a.

The observer is guarded transpiled research, not proof of a proposed production interface,
scope resolver, live provider, browser receiver or semantic qualification. D3819 closes this
bounded prerequisite only; D3792 remains unaccepted and open. Strict tool types and predecessor
wire/context controls are rerun after the draft repair. Initial type/build/source-positive and
request-origin mistakes were corrected in the instrument, not by weakening production checks;
the final actual-source controls are the measurement above. No raw records are retained in Git,
no ordinary CI/progress gate depends on this opt-in instrument, and no release gate is promoted.

### Comparison endpoints must reach every source owner — 2026-10-14, D3820

The unchanged `compareBranches` uses full branch paths. `comparisonFacts` intentionally
recomputes recorded facts from the full run/fork/branch; `structureDeltaEntries` and piece-route
construction also revisit full paths independently of displayed column leaves. Therefore a
cropped display is not scoped source admission. `[V]` (`packages/runtime/src/compare.ts`,
`compare-strip-values.ts`, `evidence-factories.ts` comparisonFacts/Compare factories).

`make inspector-comparison-source-research` builds guarded in-memory variants; every replacement
asserts its unique current source anchor, production files stay unchanged. The unchanged baseline
must fail on the exact requested endpoint, not unrelated startup. A constructor-only prototype
passes 116 controls over 62 endpoint pairs/four legal fixtures (both colors, actual mates and
nonterminal alternatives). It validates original paths before clipping, preserves requested
column order and full-tip output, bounds rows/timelines/checkpoints/evals/lines/outcomes to their
own paths and retains byte-identical original runs. Arity, foreign endpoint, before-own-fork,
duplicate/unknown branch and duplicate/cyclic/missing-later-parent graphs refuse. Fork-only
and unequal-length pairs execute. `[V]` (`tools/d3792-inspector-demand/build-comparison.mjs`,
`comparison-source.ts`; actual runtime commit/fork/rewind and branch-path operations).

The key non-closure is measured rather than inferred: the unchanged structural factory returns
32 observations beyond the constructor's requested endpoints. Source narrowing must happen
before the comparison-wide intersection, not after fact selection. The structural-owner variant
passes 246 controls on the same 62 pairs with 1,020 complete ordered items and no later items.
A separately expressed prefix-population calculation uses current structural readings to check
scope/completeness; it does not establish independent chess-semantic correctness. Whole-tip
structural populations retain that same formula and no empty-population substitute passes. `[V]`
(same tools; `structureDeltaEntries` and `createDerivedCompareStructureDeltaV1Evidence`).

Provider annotations/checkpoints/objective transitions in the fixtures are labelled synthetic
recorded controls, not live Stockfish or authored chess truth. The actual mate outcomes come from
legal production move commits. No account/HTTP/provider/browser permission or new factory type
is tested. The guarded candidate's values are research outputs, not evidence that existing
production v1 factories admit scoped subjects. A first strict check found a wrong type-import
location; it was corrected to the actual export before measurements. `[V]` tools and Make target.

Author synthesis `[M]`: source operations and all consumers need privately admitted exact two-
endpoint inputs, preserving original/current authority separately from their evidence spans.
Recorded-fact verification, structural intersection and piece routes must not reopen whole tips;
new bindings/identity/version obligations need explicit accepted contracts. Existing whole-tip
callers and all 75 Inspector source obligations stand. D3820 closes this bounded prerequisite
only; D3792 remains open/unaccepted. No production, qualification, defaults, packs or release
gate changes. Reports are bounded stdout aggregates; bundles are ignored, and ordinary CI/progress
does not execute this research target.

### Exact earlier recorded-Review source boundary — 2026-10-15, D3824

The disposable `make inspector-review-boundary-research` model passes 292 controls over eight
actual SQLite-backed native/imported games: both learner colors, legal mate/nonterminal paths
and real alternate branches. Imports use actual `RunService.importGame`, not invented PGN
metadata. Forty-eight prefix reads acquire 172 actual position items and 124 actual edge items
through the existing sole factories, with exact bounded node, parent, FEN and move operands.
Eight additional inherited-prefix edge controls retain shared nodes on retry branches. `[V]`
(`tools/d3792-inspector-demand/review-boundary.ts`; `apps/server/src/service.ts` importGame;
`packages/runtime/src/review-evidence.ts`; actual run.record position/edge value routes).

Original full-branch duplicate/cycle/missing-parent material refuses before narrowing, including
damage after the selected endpoint. Unknown/off-path requests, caller outcomes, event-sequence
gaps and missing/foreign import records refuse before source preparation. A real sibling commit
invalidates the old boundary even when its selected path remains unchanged; a backend record
change also invalidates an unfinished early prefix. Spread/JSON/cross-issuer and old whole-tip
receipts do not become owned boundaries. Mutating the original request cannot widen its captured
path. Backend corruption controls are labelled in-memory overrides, not writes to storage. `[V]`
(same model and its refusal/preparation-counter controls).

Early prefixes and retries remain unfinished unless their own admitted path contains an actual
terminal event. A recorded PGN result belongs only to the original imported mainline's full tip;
terminal results retain learner-relative meaning for either color. This uses the existing
imported-mainline extension refusal, not a guess that arbitrary branch tips are immutable.
Existing whole-tip input arity, event-head identity, receipt validity and saved source bytes are
retained. The first model run fails an event-head namespace mismatch; using the existing event
prefix digest repairs it without reinterpreting the old receipt. Strict typing also catches the
initial narrowing/session shape mistakes before the completed measurements. `[V]` (same tool;
`apps/server/src/service.ts` #refuseImportedMainlineExtension).

Author synthesis `[M]`: a new private source-owner boundary must compose with, never replace,
current read and Inspector access. The same draft §4.11a now specifies that callable and its
storage/revalidation/outcome obligations. This model is **not** a permission instrument, current
v1 receipt, scoped Review packet or complete Inspector delivery. Semantic/pivotal/shape/objective/
consequence/engine/Story source computation, exact factory bindings and production identity,
cancellation, HTTP/client/native proof and independent acceptance remain D3792 work. D3824 closes
only its bounded question. No production, source qualification, pack/default or release change;
ignored bundles and bounded stdout stay outside ordinary CI/progress dependencies.

### Pivotal witness scope and shared-node source mismatch — 2026-10-15, D3825/D3826

The opt-in guarded payload-owner model passes 465 controls over 207 prefixes of seven actual
SQLite-backed legal runs. Four current families emit 45 whole-tip markers. Two actual legal
collapse paths come from the first five examined paths in the existing CC0 R2 fixture; no new
corpus download or raw dump is added. An unchanged-source baseline fails the exact root-prefix
assertion. Original graph validation precedes source-side narrowing; duplicate/cyclic/missing
later material refuses even when the requested endpoint is the root. Inherited-prefix, foreign-
endpoint, original full-tip and unchanged saved-byte controls pass. `[V]`
(`tools/d3792-inspector-demand/pivotal-source.ts`, `build-pivotal.mjs`; actual runtime pivotal,
branch-path and SQLite operations; `tools/r2-selection-harness/imported-sample.pgn`).

Four prefix reads contain the displayed collapse anchor but not its later same-side witness.
They must exclude that marker. Filtering only marker nodeIds from a whole-tip list would retain
all four. Scope expectations use current pivotal payloads plus independently expressed witness
membership, not an independent chess-semantic oracle. Synthetic human/strong distribution
controls are written through actual opponent commits; they are not live provider measurements.
All four payload families are covered, but no new scoped mint or source identity is proved. `[V]`
(same tool; `packages/runtime/src/pivotal.ts` pivotalMarkerPayloads/divergence).

The pre-repair actual shared-node retry also proves D3826: both requested branches emit two human-divergence
items, and one item per branch carries an engine identity different from its declared sealed
human-policy input. Payload acquisition scans all selections on path nodes, while the current
factory chooses the latest at that node. Selection metadata is synthetic, but the legal
rewind/fork/commit, storage read and exact sole-factory calls are production operations. Saved
recording bytes remain unchanged. This is a current input-coherence defect, not a population
frequency, live-model finding or a merely proposed future scope risk. `[V]`
(`packages/runtime/src/evidence-factories.ts` pivotalFactory/createHumanMaiaPolicyV1Evidence;
same tool's two actual factory controls).

Author synthesis `[M]`: the same unaccepted Inspector draft now names the private pivotal
source operation and complete-witness obligations. Source/factory occurrence binding and
identity, current permission, real response/native delivery and independent acceptance remain.
D3825 answers its bounded source-scope question; D3826's production repair is now locally
verified. Its permanent predecessor regression fails. The repair uses each
producer-owned marker's retained engine/complete candidate image through the existing closed
human-policy page arm, never a distribution reconstructed from marker values. Actual stored
controls now retain both current node-level populations with zero mismatched declared inputs.
This does not author or accept the separate scoped occurrence authority. `[V]`
(`packages/runtime/src/pivotal.ts`, `evidence-factories.ts`, `pivotal-evidence.test.ts`; same tool).

The first runnable bundle mislocated the existing fixture relative to ignored output; a guarded
source locator fixes only the research bundle. No production supplier/signature, semantic
eligibility, pack, budget/default or release promotion follows from these measurements.

The same audit finds D3827's implementation contradicting accepted value-authority §3.4 and
the manifest: one phase reading instead of two and one legal-move reading instead of three.
Two permanent legal-path regressions fail on the predecessor. The repair retains both definite
phase occurrences across unclear nodes and prior/first/later same-side mobility occurrences,
checking source values against the existing marker detail. The real Review packet retains the
same complete source receipts, while marker payloads/eligibility remain unchanged. `[V]`
(`packages/runtime/src/pivotal-evidence.test.ts`, `evidence-factories.ts`; accepted
`rfc/evidence-value-authority.md` §3.4).

Final local verification: 5,734 software/seven performance cases pass on frozen production bytes.
Governance rejects a duplicate roadmap evidence path; only that duplicate is removed, then normal
governance/content/build/all four browser tiers exit zero: 257 content, 312 smoke/five content/
59 matrix/one packaged-production browser cases, one existing optional Maia skip and zero retries,
with all 112 composition cells. No product source is changed between those results. D3826/D3827
close their accepted grounding defects, not the unaccepted scoped operation, qualifications,
official content or release. `[V]` normal Make outputs and `planning/exploration/log.md`.

## Exact comparison source/input contract — 2026-10-15, D3792

Full Inspector accepts two comparison projections, structural difference and eval difference;
route and trajectory belong to other consumers. Current generic comparison acquisition calls
strips before filtering. The source proposal therefore uses a dedicated two-prefix source and
direct exact factory dispatch, not a second full Compare screen. `[V]`
(`packages/runtime/src/evidence-catalog.ts` MODULE_CONSUMER_ACCEPTS.full_inspector;
`packages/runtime/src/module-query.ts` compareSources; `compare-strips.ts` comparisonStrips).

The unchanged D3820 boundary experiment still reproduces all 32 later structural items when
the legacy factory reopens full branches. With guarded source-side narrowing it retains the
same complete 1,020 structural items over 62 prefix pairs. Added original-event-based eval
checks retain fourteen delta items and pass all 124 column requests. The extended constructor
variant passes 240 controls and the structural variant 370, including original graph, mate-
outcome and saved-byte controls. Eval/checkpoint inputs remain explicitly synthetic. These are
scope checks, not an independent oracle for structural predicates or engine quality. `[V]`
(`tools/d3792-inspector-demand/comparison-source.ts`, `build-comparison.mjs`;
`make inspector-comparison-source-research` normal output, 2026-10-15).

Ten emitted old-arm delta inputs reuse an existing input identity across different requested
endpoint tuples. The arithmetic output remains correct and scope-bounded in the guarded view,
but its legacy mint operands contain the full run, branch and before/after entries—not the
requested two-endpoint scope. This is not a defect in the existing whole-tip contract. It is a
direct falsifier for using that old arm as a scoped source authority. `[V]`
(same instrument's evidenceValueReceipt.inputDigest comparisons;
`packages/runtime/src/evidence-factories.ts` createDerivedCompareEvalDeltaV1Evidence).

Draft synthesis `[M]`: module-registration §4.11a now names a privately admitted runtime source
over the original stored image/two granted prefixes and two new explicit F2 arms. Literal
source scope and actual used occurrences must enter their receipts; equal visible output cannot
erase scope. Old full-tip arms, payloads, conventions and upstream provider holds remain.
Runtime admission, complete input grammar/identity, all other scoped sources, current permission,
actual HTTP/client/native receiver proof and independent acceptance remain unimplemented.

## Pivotal family preparation — 2026-10-15, D3829

The existing four exact factories each called the combined pivotal producer before filtering
one kind. Across the same seven legal fixture runs/28 exact route calls, that prepares phase828,
irreversibility800, legal-count828 and human28. Four permanent actual-factory cases fail on
unrequested phase/irreversibility/legality calls, not loading or empty positive fixtures. `[V]`
(`packages/runtime/src/pivotal-evidence.test.ts`; `pivotal.ts` and `evidence-factories.ts` at
2fd557b9; normal make test-pivotal-grounding predecessor result).

The guarded family-specific model retains all45 emitted items' complete payloads, input values,
value/convention receipts and saved-run images; graph/FEN corruption outcomes also match.
The actual internal implementation then matches those same original images with preparation
phase207, irreversibility200, legal-count207 and human7. Combined whole-tip rendering remains;
the new helper is absent from the package barrel. All105 focused cases/types and the existing
465-control/207-prefix source experiment pass. Only the research bundle forwards its endpoint
through the refactored internal helper; production public inputs gain no endpoint or kind field.
`[V]` (`tools/d3792-inspector-demand/build-pivotal-family.mjs`, `build-pivotal.mjs`;
`packages/runtime/src/pivotal.ts`, `evidence-factories.ts`; normal Make outputs).

These are detector-work and complete-output controls, not whole-app latency, independent chess
qualification or a scoped Inspector source. The final frozen normal gates exit zero:5850 software,
seven performance,257 content,328 browser smoke/five content/59 matrix/one packaged-production
case, one configured optional Maia skip, no retries and112 composition cells. All84 graph/FEN
corruption controls actually refuse. `[V]` normal Make outputs; matrix JSON expected59/skipped0/
unexpected0/flaky0; `planning/exploration/log.md`. D3829 is a
source-preserving implementation under accepted value-authority §3.4, not acceptance of D3792's
different scope/occurrence/access contract. The current whole-tip shared-node distribution
population and its exact retained source images remain unchanged. `[V]` same source/tests;
`rfc/evidence-value-authority.md` §3.4 and `rfc/module-registration.md` draft §4.11a.

## Recorded selection occurrence — 2026-10-15, D3830

Two selections at a shared node can carry identical distributions but distinct event sequences
and origin branches. A new permanent regression fails only on the missing occurrence reference
before the repair (105 other cases pass). The producer now privately retains the literal run,
event sequence, branch, node and move alongside its original engine/candidate image; all106
focused cases and workspace types pass. Current node-level marker populations, public payloads,
v1 receipts and saved run bytes remain unchanged. `[V]` `packages/runtime/src/pivotal.ts`,
`pivotal-evidence.test.ts`; normal `make test-pivotal-grounding` predecessor and candidate results.

The existing disposable prefix experiment additionally exercises four requested families at
207 stored prefixes (828 checks) and matches three repeated selections against their actual
stored events (94 occurrence checks). Wrong run, missing/duplicate sequence, malformed graph,
substituted origin/source, ungranted anchor and copied marker refuse. Original465 controls,
four missing-later-collapse exclusions and zero crossed human distributions remain. The family
A/B experiment freezes both fixture generators at2fd557b9 and retains all45 output images,
84 graph/FEN refusals and prior preparation savings. `[V]`
`tools/d3792-inspector-demand/pivotal-source.ts`, `build-pivotal.mjs`,
`build-pivotal-family.mjs`; normal research Make results.

This identifies source data, not a new factory receipt, current access or proof that a selected
move lies on the requested branch. Shared/inherited node-level observations keep their current
meaning. Scoped Inspector source/factory/access/receiver delivery and independent acceptance
remain D3792 work. `[V]` existing production factory inputs and draft module-registration §4.11a.

Full frozen normal verification/build/all browser tiers exit zero:5851 software, seven
performance,257 content and393 browser passes, one configured optional Maia skip; all59 matrix
cases and112 composition cells pass without retries. `[V]` normal Make results;
`test-results/browser-results.json` expected59/skipped0/unexpected0/flaky0 and
`test-results/composition/receipt.json`; append-only exploration log. These are local checks,
not current-revision GitHub, a calibrated chess detector or full release qualification.

## Pivotal scoped-source contract — 2026-10-15, D3831

The current disposable prefix candidate validates the original graph but originally parses FENs
only after cropping. A new actual stored-run negative requests the root while corrupting the
later original tip's FEN; it fails with "Missing expected exception", not a load/setup failure.
The candidate now parses every original path FEN before extracting a prefix, without computing
unrequested detector families or changing production. All35 new full-path FEN controls pass:
500 source controls/207 prefixes,828 requested-family checks and94 occurrence checks over three
repeated selections. Four missing-later-collapse exclusions and zero crossed policy inputs
remain. `[V]` `tools/d3792-inspector-demand/pivotal-source.ts`, `build-pivotal.mjs`;
normal `make inspector-pivotal-source-research` predecessor and corrected results.

The same frozen-fixture A/B command still preserves45 complete output/input/value/convention
images,84 original graph/FEN refusals and saved bytes over28 factory calls; preparation counts
remain207/200/207/7 rather than828/800/828/28. This is unchanged production, not a newly claimed
speed gain. `[V]` `make pivotal-family-research`, `build-pivotal-family.mjs` at this checkpoint.

The existing unaccepted Inspector amendment now names one proposed scoped constructor and four
exact F2 arms, each with its own complete witnesses. It separates positional prefix scope from
historical event-time cuts and chosen-branch attribution; actual shared-node human observations
retain their origin events, original distributions and current legacy target-band operand.
No source handle or event reference supplies current permission or modern provider authority.
Canonical input scopes, typed production admission/receipts, current receiver/cancellation,
HTTP/native delivery and independent acceptance remain required rather than declared green.
`[V]` `rfc/module-registration.md` §4.11a; current `pivotal.ts`, `evidence-factories.ts`,
`module-query.ts` and `pivotal-evidence.test.ts` at1834494b. No pack or public production changes.

## Recorded Review moment source — 2026-10-15, D3832

The existing storage-boundary model originally validates graph structure, but crops before
parsing a later original FEN. An actual stored-run negative first fails with Missing expected
exception. Parsing the original path before narrowing adds eight refusals;300 boundary checks
retain all48 earlier prefixes,172 actual position items and124 actual edge items. This repairs
only the disposable model. `[V]` `tools/d3792-inspector-demand/review-boundary.ts` and normal
`make inspector-review-boundary-research` predecessor/corrected results.

Two new actual `RunService.importGame`/SQLite cases follow White and Black in resigned losses.
A labelled synthetic cp-zero delivery is admitted by the production provider/payload factories,
stored as actual run evidence and re-read by `reviewDurableEngineStates`. The full real Review
packet/Story correctly derives a last-level moment at an earlier recorded move. Cropping that
Story to each of two earlier node prefixes retains four last-level facts even though the
boundary model correctly says unfinished. The two legacy rank inputs are also identical at
different endpoint scopes. These are counterexamples to scoped reuse, not defects in the
current whole-game operation and not measurements of engine quality. `[V]` same probe;
`testing/review-evidence-fixture.ts`, `review-evidence.ts`, `story.ts`, `evidence-factories.ts`.

The existing rank declaration, recursively resolved only until a real Review adapter, gives
exactly eleven adapters: four pivotal, endgame, shapes, consequence, import result, eval point,
eval delta and mate transition. No new source register is needed. A genuine empty native source
successfully supplies an empty ordering. All25 rank controls pass; both saved imports remain
byte-identical after inspection. `[V]` same probe, `evidence-catalog.ts` and the current adapter
registry. Current source-contract cases37 and authenticated source/effect controls33 also pass;
the latter use labelled application mocks, not live providers. `[V]` normal Make results.

The joint unaccepted contract puts source ownership in Review compiler §4.5 and its exact rank
arm in module-registration §4.11a. It retains current full-tip APIs, records, packets, titles,
ranking convention and public wire, while requiring immutable per-storage admission, complete
scoped source inputs and current access/receiver checks. An early selected move can still use
an explicitly granted whole-game boundary. New typed construction, scope-bound receipts,
permission/cancellation and real HTTP/native delivery remain unimplemented, not established by
these models. `[V]` those draft sections; `apps/server/src/service.ts` current read boundaries.

## Authored shape interval scope — 2026-10-15, D3833

The existing opt-in `make inspector-review-boundary-research` now loads the actual 25 entries
through `ShapeRegistry.loadDefault` and evaluates their triggers on two actual SQLite imports,
one per learner color. The legal line `1.e4 g6 2.d4 Bg7 3.Nf3 Bf8 4.Nc3 Bg7 5.Be2 Bh6`
gives two separate `fianchetto-g7` intervals. Across 22 prefixes the existing sole factory
retains 20 declared items. 124 new controls preserve full-tip parity, empty trigger populations,
bounded endpoints/closure flags, copied/cross-issuer rejection, later-original-FEN refusal before
preparation and unchanged saved imports. The earlier 300 source/25 rank checks remain passing.
`[V]` `tools/d3792-inspector-demand/review-boundary.ts`, `shape-firing.ts`, `evidence-factories.ts`,
`content/shapes/fianchetto-g7.json`, and the command's bounded terminal report.

Filtering complete-game firings by first-node membership retains four future last-node ids.
It also retains eight closed flags where the actual prefix is still open-ended. Clamping the
last id alone would not remove this future knowledge. These counts are deliberately repeated
scope observations, not distinct mistakes, a corpus frequency or a production bug in the current
whole-path helper. The correct bounded value is recomputed over the granted path; a singleton
position match does not assert when the pattern began in the game. `[V]` same controls and
`shapeFirings`' inclusive interval/endpoint rule.

The first two harness runs fail because the new registry loader and schema validator resolve
source-relative assets from the bundled cache location. A conventional esbuild configuration,
called by the unchanged Make target, now uses the production server asset base; no production
source, schema path or validator is rewritten. This is an instrument correction, not a server
defect. No capture file is retained. `[V]` `build-boundary.mjs`, Makefile target and the two
ENOENT results followed by the passing run.

The unaccepted module-registration §4.11a now specifies actual registry records/triggers,
point versus branch scope, recomputation, pending authored-provenance authority and receiver
obligations. Matching a trigger does not establish the entry's strategic prose, a best move or
usefulness. No new scope permission, factory arm/version or production operation follows.
Independent acceptance, registered provenance and actual API/client/native delivery remain
D3792 work. `[V]` that draft and the legacy factory's `registered-authored-provenance` hold.

## Dependent incoming-edge sources — 2026-10-15, D3836

**Bounded prerequisite answered; production unchanged.** Five exact existing Inspector refs
can be acquired without a full candidate population: discovered execution, fork survival,
strict overload response conflict and forced-mate-after-move versions 1 and 2. The disposable
`tools/d3792-inspector-demand/incoming-dependent.ts` uses the actual `run.record.edge@1`
authority after original branch/edge validation, then invokes their unchanged sole factories
with exact same-edge dependencies. It is not an authenticated Inspector operation or a new
source authority. `[V]` that probe, `recorded-edge.ts` and `internal/evidence-value-routes.ts`.

The final run passes **318 controls / 218 source requests**: eight legal fixtures mirrored
for both colors, horizons 1–4 for both mate versions, and two actual SQLite imports with six
selected edges. The import path is the test-writer overload, not a permission proof. Cases
include discovered rays, forks, strict conflict/clear, a pinned recapture, en-passant's captured
target versus landing square, mate and ordinary opening play. Fixtures reuse existing permanent
factory/semantic/mate cases; they are not independently validated strategic lessons. Root absence,
inherited child-branch prefixes, off-branch requests and duplicate/missing-parent/invalid-or-wrong-
FEN original graph material are checked before source acquisition. Original saved play stays
unchanged. `[V]` probe and `make inspector-incoming-dependent-research`.

Successful empty prerequisites remain empty; strict overload's `no_legal_recapture` remains
unavailable, not absence or a conflict. Mate output retains exact v1/v2 shapes and the existing
`proved | refuted | budget_exhausted` domain. The measured population contains proved/refuted
but does **not** exercise default-cap exhaustion. Separate horizon-5 negative controls retain
the unchanged factory refusal; the proposed wire instead refuses that invalid horizon before
work. `[V]` probe, `tactics.ts`, `mate-proof.ts` and `evidence-value-authority.test.ts`.

The measured dependent-stage maximum is approximately **276 ms** at horizon four (31,695
observed nodes), after graph/source-edge admission. This is one process mixing cold/warm calls
over a small fixed population, not full-operation latency, a worst-case bound or a speedup
claim. The current proof engine is synchronous, capped at 250,000 nodes and has no mid-search
AbortSignal. Current receiver/deadline checks and any necessary executor isolation still need
production proof; do not raise budgets on this evidence. Only bounded aggregates print, under
16 KiB; no raw recording or ordinary CI/progress dependency is added. `[V]` probe/Make target
and `mate-proof.ts`.

The experiment exposes a literal draft gap: mate factories require a horizon but the proposed
Inspector request had no parameter for one. §4.11a now requires the closed 1–4 attacker-move
parameter only for those two source refs, binds it to source/collection/disclosure/receiver
identity, and preserves exact-source unavailability. Hint's fixed two-move policy and Review's
engine-distance-plus-one policy remain distinct; Inspector cannot silently borrow either.
The disposable request grammar passes **96 positive / 491 refusal controls**, while the
unchanged source-contract suite passes 37 tests. Request grammar is not response, source/access
or native UI admission. `[V]` `draft-wire.ts`, `hint-distance.ts`, `review-evidence.ts`,
`make inspector-source-contract-research` and the still-unaccepted RFC.

The typed trace wrapper and invariant-backed indexed accesses first fail strict research
compilation, then pass after correction; no production types or private authority were weakened.
Remaining obligations are independent acceptance, exact runtime supplier/context admission,
response/current-request/horizon/cancellation binding, source/version/qualification holds and
actual authenticated/native delivery. This advances five prerequisite contracts, **not**
Inspector, Review, Support or 1.0 completion. `[V]` research compilation and §4.11a.

## Comparison original-position refusal — 2026-10-15, D3842

The independent return is reproduced in the existing disposable comparison experiment:
an original later ordinary-node FEN can survive event replay and graph traversal but fail
the whole structural source. Narrowing to an earlier endpoint must not hide that invalidity.
The initial new negative fails with a missing expected source-construction exception. After
constructor validation, the separate structural-owner negative still fails; after per-column
validation, counting accesses before the outer factory memo exposes one earlier read before
the second invalid column is checked. A detector-cache-miss counter alone falsely reports
zero. `[V]` `tools/d3792-inspector-demand/comparison-source.ts`, `build-comparison.mjs`,
`packages/runtime/src/events.ts` and the successive `make inspector-comparison-source-research`
results. These are corrections to this disposable model, not a claim of a live Inspector route.

The final candidate validates both complete original graph/FEN populations before either prefix
or source read. The existing structural owner prototype likewise validates both originals as
a set before any access, including memo hits. The ordinary no-endpoint Compare control remains
unchanged. An intermediate instrumentation revision incorrectly applied the new validation to
that legacy control; another overbroad fixture assumed terminal replay admitted invalid FENs.
Both assumptions are corrected: terminal outcome replay already validates its referenced FEN.
No parser or production source is weakened. `[V]` the guarded builder, `events.ts`'s
`outcome.reached` handling and the retained negative runs.

Final output: **316 source-construction and470 structural-owner controls**, each over the same
four both-color fixtures/62 prefix pairs. Twelve later-invalid original images are genuinely
replay-admitted; four terminal images are refused by replay instead and are not counted as
source-admitted negatives. Both malformed syntax and parseable kingless positions are covered
on either original column. Every source-refusal control asserts zero outer-memo source reads.
Existing complete populations remain1,020 structural items/fourteen eval deltas, with ten old-arm
scope collisions explicitly retained as evidence of why new typed scope authority is needed.
Saved bytes remain unchanged. Repetitions across builder variants do not add chess positions.
`[V]` the target's bounded stdout and pinned population assertions; no raw capture is retained.

The unaccepted comparison source contract now requires all-original-FEN admission and an
independently retained immutable source snapshot without freezing callers. The prototype proves
the ordering/refusal rule only, not nominal source constructors, mutation isolation, factory
seals, access, current receivers or API/native delivery. Those still require real implementation
after independent acceptance. D3841/D3843 and the explicit supplier authoring remain separate
Inspector work. `[V]` `rfc/module-registration.md` §4.11a and the independent review record.

## Held-source outcome identity — 2026-10-15, D3843

The old proposed type accepts `unavailable/source_version_held` without its dependency. A
compile-time negative marked `@ts-expect-error` therefore fails before repair as an unused
expected error. The corrected closed alternative requires the exact registered pending source
owner; ordinary absence alternatives forbid that field. This is inline draft-wire authoring,
not a new production schema or a permit to convert compilation failures into absence. `[V]`
`tools/d3792-inspector-demand/draft-wire.ts`, the predecessor
`make inspector-source-contract-research` failure and `rfc/module-registration.md` §4.11a.

The actual opening catalogue-membership factory returns `unavailable/artifact_missing` with
dependency `runtime-opening-identity`; its declared hold remains unchanged. Eighteen bounded
controls retain that exact dependency through JSON and the existing disclosure construction,
refuse missing/empty/none/foreign/extra dependencies, dependency-bearing ordinary absence,
unregistered or owner-free sources and source-outcome substitution. Changing returned status
or dependency changes the existing disclosure digest. These controls exercise only the
unavailable branch and receipt metadata, not full response parsing, current access, source
delivery or receipt authority. `[V]` that probe, `evidence-factories.ts`'s opening factories,
`presentationDigest` and the passing existing `make inspector-incoming-dependent-research`.

The unchanged request grammar remains96 positive/491 refusals over75 sources. All318 dependent
incoming-edge controls/218 requests and37 source-contract cases pass. The draft now requires
actual source-owner hold evidence, exact response/receipt outcome equality and distinct missing,
failed and successful-empty results; arbitrary pending metadata is not a universal unavailable
stub. Missing supplier-specific mappings and the complete successor consumer remain D3792/D3841
work. Independent review and actual API/client/native admission still precede delivery. `[V]`
the same targets, `inspector-source-contract-research` and unaccepted RFC clauses.

## Complete-consumer acceptance coverage — 2026-10-15, D3844

D3841's independent return exposes a second boundary in the existing execution compiler.
Inspector declares75 projections; its unchanged isolated census compiles63 bindings and refuses
twelve through nine unregistered provider leaves. Deleting just those twelve from a copied
compiled manifest makes the old compiler approve the remaining63 as the complete consumer.
The new existing-census negative fails `compiled` versus `refused`. This is an internal contract
defect, not a demonstrated HTTP exploit or source outage. `[V]`
`tools/d3403-execution-frontier/audit.test.mjs`, retained current `execution-frontier.json`,
`packages/runtime/src/evidence-binding-execution.ts` and `make provider-execution-census-check`.

A permanent control constructs a valid semantic manifest from the actual declarations with one
Theory shape binding removed: the consumer still accepts four projections, but the old execution
compiler approves three bindings. Three further predecessor failures cover filtered Inspector,
extra projections and duplicate declarations. The production repair requires exactly one
consumer id/version and accepted/bound projection set equality before path work. Multiple
legitimate adapters for the same projection remain supported and all compile; version1 cannot
stand in for version2. The corrected unit fixtures and isolated research explicitly declare
their own projection set rather than borrowing a complete consumer. `[V]`
`evidence-binding-execution.test.ts`, `evidence-binding-execution.ts`, audit and the accepted
`rfc/provider-exchange-and-execution.md` §§1–2;75 focused compiler cases pass.

Actual authenticated local-module controls add missing-binding refusal for all five local
Support modules before preparation/collector work. They separately retain the exact old
policy/latency/unregistered-source failure codes; the first broader run catches three old
synthetic input images at the new coverage guard, so those fixtures gain matching declared
acceptance without relaxing assertions.183 focused runtime/application cases, clean workspace
types and nine census controls pass. The saved complete census remains byte-equal:262/285
projections,495/556 isolated bindings and21/42 complete consumers compile. `[V]`
`apps/server/src/local-module-execution.test.ts`, `packages/runtime/src/module-query.test.ts`,
normal `make local-module-execution-check provider-execution-census-check`.

This fixes the accepted completeness guard only. It neither makes Inspector's missing providers
executable nor authors/accepts D3841's successor image. No bindings are removed in production,
no execution error becomes a normal unavailable result, and source/semantic qualification,
usefulness, content and release gates remain. Full verification follows separately in the log;
the focused evidence above is not a whole-platform proof. `[V]` code diff and unchanged D3792.

## Inspector successor: recorded is not live — 2026-10-15, D3841

The independent follow-up's phrase “modern-source rebase” does not require manufacturing live
exchange evidence for historical packets. Six refused topics (Stockfish eval/WDL/PV and Syzygy
result/category/distance) are currently acquired from the selected node's actual `evidence.attached`
events. `inspectorSources` retains every matching packet occurrence, not a new provider response.
`pivotal.divergence` retains the exact `opponent.move_selected` occurrence and candidates; Compare's
`evidenceOverlay` reads engine-labelled eval events on the recorded path. Separately declared
recorded-source successors could preserve those observations without asserting a provider delivery.
Neither changing the old provider declarations nor fetching a fresh reading would preserve their
historical meaning. `[V]` `packages/runtime/src/module-query.ts:inspectorSources`,
`pivotal.ts:divergence`, `compare.ts:evidenceOverlay`,
`evidence-factories.ts:createDerivedCompareEvalDeltaV1Evidence` and the authorized independent
review's recorded-source refinement.

Requested-node Maia and Explorer pages are a different source path. The current `MaiaPolicyPage`
contains only move/probability rows; it has neither candidate WDL nor the actual final sampled-task
window. The unaccepted `maia-task-source.md` §§1/4 specifies the needed task and node distribution,
but does not durably retain old selection tasks. Explorer already has the sealed
`derived.explorer.inspector_population@1` successor and exact-node authenticated boundary; its
population/sample/recency/committed-membership policy must survive integration. The final twelve-row
successor map must distinguish these origins and explicitly name all dependent versions, not force
every historical topic through a live provider or claim existing narrow records are whole-source
receipts. `[V]` `provider-types.ts:MaiaPolicyPage`, `maia-task-source.md` §§1/3/4,
`evidence-catalog.ts` provider/Explorer declarations and `apps/server/src/inspector-corpus.ts`.

Three other D3841 requirements can be specified independently of that still-open source map:
exact-version consumer closure under the existing eleven module policies, requested-topic absence
without fabricated results for undemanded topics, and source-order admission before bounded whole
component fitting. Current registry/packet/admission/classification explicitly assume version1;
`compileModulePacket`'s admit mode also calls `orderAdmittedFacts`. Reusing that path unchanged would
reorder or truncate the very collection the detail contract must retain. `[V]`
`module-contract.ts:assertClosure`, `module-registry.ts:assertModuleRegistry`,
`module-packets.ts:compileModulePacket`, `module-reducers.ts:admitModuleFacts/orderAdmittedFacts`,
`presentation-consumer-adapters.ts:PRESENTATION_CONSUMER_CLASSES`. These are authoring prerequisites,
not completed production migration, independently cleared clauses or a whole Inspector delivery.

## Recorded Inspector source-image experiment — 2026-10-15, D3841/D3845

This section records the initial twelve-row checkpoint. The later D3846 section below extends
the current requirements image to14 affected/61 unchanged topics, still75+6 refs; old observations
and their bounded scope remain evidence, not a claim that the first map was a complete tuple audit.

Extend the existing opt-in recorded-prefix instrument, not normal CI/progress, with
`tools/d3792-inspector-demand/recorded-origin.ts`. It calls the actual sealed run-head, attachment
digest/resolution and recorded-position authorities over explicit legacy test reports for both
learner colours. Four packet kinds cover six topic obligations. It preserves immutable envelopes,
all original occurrences and identical-payload distinct seqs; wrong head/node/kind/model-source,
changed envelopes and copied subject seals refuse. Equal-FEN distinct branch nodes do not alias;
the same inherited node legitimately retains its packet. These are historical observation
feasibility checks, not real provider samples, new F2 factories, access grants or UI delivery. `[V]`
`make inspector-recorded-prefix-research`, the named probe and existing `run-subject.ts`.

Historical model source assembly must keep requested scope separate from each event's origin
branch. Both eligible shared-prefix requests preserve both stored observations, while a factory
fed the wrong origin refuses. Store the selected head's requested target band separately from
applied engine claims. The source-owned position is constructed internally, not admitted by
comparing a supplied position payload: a distinct valid run can retain identical node/FEN/ply
payloads. Foreign run/head attachment digests still refuse. `[V]` the same probe;
`module-registration.md` D3831 scope contract; `evidence-factories.ts:createRunRecordPositionV1Evidence`.

The independent reviewer finds three defects in the first draft: mixed-up grounding, missing
requested-band operands and missing origin/requested-scope assembly. The real unchanged F1
compiler refuses declared_convention over two recorded_run inputs. Corrected hypothetical
metadata retains recorded_run plus the separate split convention; it must still retain both
recorded leaf requirements, not just the selection. Initial positive experiment failures expose
an undeclared orphan disposition and an incorrect one-leaf expectation; add the explicit isolated
Inspector-only disposition and correct the expected two source requirements without weakening
either compiler guard. This is prospective declaration feasibility, not a registered successor
consumer or real source mint. `[V]` probe, `evidence-contract.ts` grounding/orphan checks,
`evidence-execution.ts` and the dated independent review.

The draft's twelve-row affected-source map replaces each refused topic in its original slot:
six historical packet topics, live node Maia distribution/WDL, accepted Explorer population,
historical divergence, recorded numerical Compare delta and held Story rank. Retain all63 other
refs. New source families/grounding/factories are explicitly proposed upstream; no old source is
rewritten, retired, or upgraded. The map is requirements-only until each source and the complete
consumer actually compile and its API/client adopts them. `[V]` `module-registration.md` exact
affected-source table, `evidence-value-authority.md` draft §2.3a, `maia-task-source.md` draft §4.1.

D3845 is independently observable at the current sole rank factory: `{moments:[]}` successfully
returns `{rank:[]}`, whose value receipt has zero source digests, while its static literal member
declares eleven refs. The successful empty product behavior must survive. A new rank version or
source handle alone cannot supply its missing variable/empty collection lineage; do not invent
eleven absent witnesses, insert an empty derived member, or hide the graph behind a local leaf.
Research only identifies the representability gap; no replacement contract or production fix
is claimed. `[V]` the same probe's separate D3845 diagnostic,
`createDerivedStoryRankV2Evidence`, its actual declaration and F2 §2.2.

Final recorded-origin experiment passes136 historical controls. The requirements inventory is
checked against the actual twelve failing current topics:75 original refs,63 unchanged,75 proposed
topic refs plus six detail refs,81 distinct proposed accepted refs. Deleted-map-row, unknown-old-ref
and duplicate-successor controls refuse. This is not an81-binding executable image: rank@3 stays
held on D3845. The final bounded independent wording recheck clears only the source-map corrections,
including preserving old human@1 bytes separately from new human@2's extended recorded lineage;
full source/callable/supplier contracts and upstream/joint acceptance remain outstanding. `[V]`
same normal target, actual compiler/census and dated independent review.

## Story collection input shapes — 2026-10-15, D3845

The empty-input finding belongs to an already recorded unfinished contract class, not a newly
discovered exploit. The convention implementation's dated receipt and RFC changelog explicitly
defer declared-member validation because Story and other factories use subsets of a static
union. This pass measures the current rank@2 instance only; it does not reopen or claim to fix
all those other routes. `[V]` `rfc/semantic-convention-provenance.md` changelog 2026-09-24(e),
`planning/semantic-convention-provenance/implementation-2026-09-24.md` §Measured, not faked.

Extend the same opt-in `recorded-origin.ts` instrument with18 actual packet/Story compilations:
both learner colours over every0–8-ply prefix of one legal opening line. Ten ranks are empty,
two have one actual evidence input and six have repeated projection occurrences; observed input
counts are0/1/2 and the only emitting family in this bounded line is irreversibility. None equals
the static11-ref member. Every actual moment input survives in receipt order, including repeated
refs, and output order equals the unchanged `rankStoryMoments` operation. This is not coverage of
all eleven families or real provider behavior. `[V]` `make inspector-recorded-prefix-research`,
`tools/d3792-inspector-demand/recorded-origin.ts`, actual `reviewPacketForRun/reviewStoryMoments`.

Existing alternatives do not solve that representation. Actual unchanged F1 refuses an empty
`anyOf` member. A singleton irreversibility input retaining rank's full fact/pattern/evaluation
answer union also refuses widening; reducing the answer image to fact admits that singleton
metadata but loses the aggregate contract. A few measured tuple alternatives cannot establish
a general variable collection. Keep fixed-tuple/alternative guards rather than calling the
union of possible families a literal tuple of actual observations. `[V]` same target's three
prospective declaration controls, `compileEvidenceManifest` and F2 §2.2.

All18 actual values already retain registered `story-rank@1` convention closure, including empty
values. A further six explicitly synthetic provider-state controls (not_requested, pending,
provider_off, both colours) produce the same empty rank while their actual packets retain three
different source-state images; pending and degradation remain visible there. The old pure empty
rank has one input digest across those states, correctly reflecting its identical empty moment
input, not a source-scope/access receipt. A new scoped collection owner must retain the genuine
packet/boundary and source states separately; rank[] alone cannot attest that analysis completed
or no chess opportunity existed. No actual queued job, provider failure or HTTP grant is claimed.
`[V]` same target and existing `ReviewEvidencePacket` state fold/receipt.

These observations settle the research prerequisite, not a replacement derivation grammar.
Explicit collection cardinality, policy authority, actual-instance answer/grounding inheritance,
empty-result semantics and execution planning still require one coherent author contract and
independent review. No new policy-evidence leaf, collector, production projection, registry member,
default, UI or source qualification is introduced by the experiment. `[V]` scoped diff and D3845.

## Pivotal tuple prerequisites — 2026-10-15, D3846

Phase-change@1's fixed declaration names one phase/position pair, while its actual factory retains
before and after pairs. Option-collapse@1 declares one legal-reading/position pair but retains
prior, first-low and confirming-next pairs. Four actual legal fixture cases (both learner colours)
emit one value each with4/6 ordered inputs and matching source-digest multiplicity, versus2 declared
inputs. Both are direct existing Inspector topics and compile through current source execution;
this is different from the twelve upstream execution refusals. `[V]` current `pivotalFactory`,
`evidence-catalog.ts`, existing permanent `pivotal-evidence.test.ts` legal fixtures and the added
`recorded-origin.ts` diagnostic in `make inspector-recorded-prefix-research`.

The unaccepted D3831 proposal cannot preserve those @1 input declarations and simultaneously
promise exact witness closure. Reconcile this through explicit ordered-tuple successors and the
scoped source/consumer/rank image before adoption; do not truncate actual witnesses or give
fixed tuples the rank collection exemption. The complete proposed rebase therefore also needs
these two direct topics, beyond the earlier twelve failure rows. No old payload, calculation,
factory, manifest or current receipt changes in this research. `[V]` D3831 draft table and the
measured source-input arrays above; D3846 records this prerequisite before authoring.

The prospective @2 declarations compile in unchanged F1 with recorded leaf addresses[1]/[3]
for phase and[1]/[3]/[5] for collapse, all operation:null. The probe checks the draft's literal
tuples against the actual factory arrays. The extended source map replaces14 topics (initial12
execution failures plus these2), retains61 others and still proposes75+6 refs; five missing/
unknown/duplicate/wrong-version map controls refuse. An initial draft-row parser selected the
trailing empty cell rather than inputs; correcting that disposable index restores the target
without changing source/compiler behavior. `[V]` final normal prefix research target and probe.

Independent bounded review confirms the correction but finds one dispatch hazard: the old
PIVOTAL_MARKER_ROUTES values all point at @1. The corrected draft reuses only family keys/kind
validation, leaves old map/callers intact and checks exact new scoped route/kind before work.
Final read-only recheck clears that wording, not factories, new bindings, collection grammar
or upstream/joint acceptance. `[V]` existing dated independent review; §2.3b and scoped table.

## Literal factory-input audit — 2026-10-15, D3847/D3848

Before choosing D3845's collection grammar, extend the existing opt-in source-contract target over
the permanent value-authority fixture suite. A guarded in-memory Vitest transform observes the
actual source arguments only after the unchanged sole mint succeeds. It records projection refs
in order, including repeated occurrences; raw digest operands stay null. It retains no payloads
or digests and writes only a capped, ignored compact report. Equal payload bytes cannot recover
projection or occurrence identity. An initial digest-candidate approach was abandoned for exactly
that ambiguity; its candidate ref conflicts are not findings. `[V]` `make inspector-source-contract-research`,
`tools/d3792-inspector-demand/{vitest.sources.config.ts,mint-input-observer.ts,source-observer.ts}`.

The exact pre-repair observation sees120 of121 non-retired derived routes:48 have count conflicts,
nine have ordered-ref conflicts and62 have matching ref shapes. Three have opaque digest inputs
(overlapping two count conflicts); `derived.opening.deepest_reached@1` is held/unobserved. Seven
ref conflicts are the same hint-horizon array reversal. After D3848's correction,48 count/two ref
conflicts remain and69 routes have matching shapes. The remaining ref conflicts are
`derived.material.event.role_asymmetry@1` and `derived.bounded_target.engine_target_policy@1`;
both require fuller operand-contract analysis, not the hint's simple reorder. `[V]` same target's
bounded `literal-input-fixtures.json` output and actual factory/declaration comparisons.

The48 count-conflict routes span semantic avoidance, observed tactical sequences, pawn sequences,
Story, Compare, material, trade, grade, opponent candidate features, bounded targets, pivotal
phase/collapse and endgame method stage. Do not turn that into48 identical fixes: some retain
complete fixed witnesses, some consume real populations, some compute directly from FEN despite
declaring sealed prerequisites, and some include opaque recorded inputs. For example material
role signature and promotion pressure compute directly; Compare structure delta mints without
the declared sealed readings; material role asymmetry retains two signatures rather than one.
The observer reproduces the exact route list instead of maintaining a second live register.
`[V]` same report, `evidence-factories.ts` and `evidence-catalog.ts`.

The current Inspector's static declared derivation-union closure has116 refs and reaches31
conflicting routes. It includes all declaration alternatives, not just executed arms. The proposed
fourteen-row rebase is therefore not complete literal-input closure; its61 retained topics remain
conditional on audit/upstream corrections. This is not31 proven blockers in the future successor
graph, which does not yet exist. The authorized independent reviewer confirms the observer's
bounded soundness and these limits: a successful mint may precede a later operation refusal;
fixture positives do not cover every arm; matching refs do not prove value identity or subject
joins; opaque inputs remain unresolved. No runtime qualification or joint acceptance follows.
`[V]` dated independent Inspector review and the same observer's declared-union traversal.

D3848 is a separate accepted-contract correction, not a proposed collection exemption: hint
horizons declare source then principal variation but minted the opposite ordered receipt.
Seven new permanent family cases fail against the predecessor, then all74 value-authority cases
pass after changing only that source array. Callable arguments, payloads, hint policy and the
order-free convention multiset stay unchanged. Workspace types pass. Semantic validation refresh
retains343 passing cases,81 subjects/zero qualified and53 population receipts; only implementation
bindings change. This does not resolve the remaining50 conflicting routes. `[V]`
`evidence-value-authority.test.ts`, `hintHorizonFactory`, normal focused/typecheck/semantic targets.

### Recorded tactical classes — independent source tracing under D3847

The same authorized reviewer traces four shared classes rather than treating every conflict as
a collection. Main rechecks the named implementations. In the following snapshot, E is exact
`run.record.edge@1`, D defender-duty reading, C capture event, K check event and X legal exchange
(all other refs @1). These are actual @2 factory input sequences, not accepted successor schemas.
`[V]` `evidence-factories.ts:recordedSequenceFactory` and its named @2 registrations.

| Family | Actual ordered inputs per output |
|---|---|
| harassment pressure | E,E |
| defender consequence; square clearance | E,E,E |
| line clearance | E,E,E,X |
| interference | E,E,E,D,X |
| checking zwischenzug | E,E,E,E,C,K,X |
| overload exploitation | E,E,E,D,C,C,C,X |

Multiple emitted targets do not make those per-output tuples variable. Contact timing separately
accepts exactly two or three edges; attraction accepts exactly three or five. Their pure operations
reject other lengths even though the outer input validators are broader. The accepted recorded-path
horizon table already states these finite alternatives. `[V]` `pawn-dynamics.ts:pawnContactTimingSequence`,
`semantic-evidence.ts:attractionOperands`, `rfc/recorded-semantic-path.md` §3.

Deflection and attraction additionally retain capture populations assembled from all captures in
their complete fixed window, ordered by edge. Their variable captures are bounded by that window;
induction/consequence determines optional check evidence. The current occurrence/presence guard
does not establish the exact complete ordered capture population. Future contract reconciliation
must specify eligible occurrences, order, multiplicity, completeness and arm correlation, not an
unrestricted repeated-edge permission. `[V]` `recorded-semantic-path.ts:evaluate`,
`semantic-evidence.ts:exactRecordedSequenceInputs`, actual deflection/attraction factories.

Fork survival retains only double-attack/breadth; strict overload retains duties/capture. Both
declarations additionally name one sealed legal exchange, while their pure operations compute
exchanges across hypothetical replies/recaptures internally. A guessed exchange from the played
edge would not discharge that discrepancy. `[V]` named factories, `tactics.ts:forkSurvivesReply`
and `overloadedDefenderResponseConflict`, `evidence-catalog.ts` corresponding declarations.

The scoped window draft reuses @2 without a schema change; D3836 retains fork/overload's two-input
paths unchanged. Neither resolves these literal declarations. The older recorded-path §4 explicitly
uses set-based membership; that establishes preparation/horizons, not later ordered occurrence
conformance. Reconcile those classes upstream and independently review the exact successor image
before scoped adoption. No new factory/version/grammar is accepted by this tracing. `[V]`
`rfc/module-registration.md` §4.11a, `rfc/recorded-semantic-path.md` §4 and dated independent review.

Main's consumer-image recheck also confirms that review-timed modules deliberately retain both
predecessor @1 and recorded-path @2 refs, placing each successor immediately after its predecessor.
A future reconciliation must preserve those distinct obligations and source semantics; blindly
mapping both to one new ref would collapse the accepted image rather than fix it. No replacement
version names or total are inferred here. `[V]` `evidence-catalog.ts:withRecordedPathSuccessorRefs`
and `MODULE_CONSUMER_ACCEPTS.full_inspector`.

## Material and promotion source reconstruction — 2026-10-15, D3847/D3850

The existing opt-in prefix instrument now tests actual material/count sources before proposing
their successor contracts. Material-role state uses ten non-king counts: P/N/B/R/Q for White,
then Black. The current factory returns twelve sealed piece-count observations including kings;
the ten selected observations reconstruct all existing signature payload fields and source-array
ordering exactly. Across 22 legal edges (both colors, en passant, capture and all four promotion
roles with/without capture) plus four starting/zero-material positions, 48 complete payload comparisons pass.
This is preservation against current code, not an independent oracle for those chess predicates.
`[V]` `make inspector-recorded-prefix-research`, `recorded-origin.ts:signatureFromCounts`,
`material-state.ts`, `STRUCTURAL_READING_FACTORIES`.

Count payloads have no FEN. Genuine counts from initial White/Black-to-move positions have equal
payloads and payload digests, but different existing private authority-input receipts. Seven
missing/extra/duplicate/reordered/king/foreign-position controls refuse. A proposed internal
derivation must bind every count to its exact source FEN, not infer position from equal numbers
or projection refs. The experiment reuses the current private receipt and `evidenceDigest({fen})`
authority shape; it adds no public hash, source wrapper, persisted field or progress dependency.
`[V]` same instrument, `evidence-factories.ts:fenPopulation/authorityShape/authorityDigest`.

Every material-event value retains both complete before/after signatures followed by capture,
promotion, or capture+promotion in that order. All three alternatives occur. Reconstruction from
the ten-count signatures and complete existing capture/promotion sources preserves all 22 complete
event payloads, including closed raw-fact views without the three edge-envelope fields. Prospective signature
@2 with ten repeated count refs and event@2 with those three exact members compile in unchanged
F1; execution preserves signature occurrence addresses[0]/[1], each with ten inputs, on three
local/sync paths. No new value is sealed or factory registered. `[V]` same target's actual event
observations and isolated `compileEvidenceManifest`/`compileProjectionExecution` controls.

D3850 distinguishes source meaning from usefulness: the 22 actual events include four rising,
ten falling and eight unchanged-magnitude role-vector changes. The `increased` flag always equals
strict magnitude rise. This agrees with existing material tests, D3688 literal validation cases
and docs, but contradicts the catalogue's "strictly rising" event sentence. A successor must state
the broader exact change plus its boolean, not filter historical events or turn unweighted count
arithmetic into a material-value/strategic verdict. `[V]` same target, `material-state.test.ts`,
`semantic-validation-literal-sources.ts:roleStateFixtures`, `docs/semantic-evidence.md` D3688,
`evidence-catalog.ts:derivedMaterialOutputs`, `rfc/breadth-collectors.md` §3.6.

The review-requested edge controls also pass: both colors' en passant events retain the actual
victim square (d5/d4), not the move's landing square; 21 substitutions of a genuine cause from
another edge refuse; four quiet/castling edges have empty capture, promotion and material event
populations. These are disposable reconstruction controls, not enforcement by a new production
factory. `[V]` same target, `rawMaterialCause` and the explicit empty-cause cases.

Promotion pressure differs: six actual factory cases retain zero sealed sources while the old
declaration names three predicate inputs. Its pure operation owns FEN-based passed-pawn geometry,
occupancy, pseudo-control and legal pass/reply checks. Existing invalid-turn-clone, no-replies false
and successful empty pawn-list outcomes remain exact. Unchanged F1 refuses simply deleting the
derived member, but admits a separately named computed rules reading with the same payload,
grounding and answer limits under existing `rules.tactic`; it needs no provider or derivation path.
That is evidence for a genuine direct computed source, not permission to disguise rank's variable
historical collection as a local leaf. Source/factory/convention registration, eligibility and
authenticated/UX delivery remain unimplemented/unaccepted. `[V]` same target, `tactics.ts:promotionPressureReading`,
`tactics.test.ts`, current F1 compiler and projection execution.

The draft can therefore propose three separately named successors without changing the old data
or loosening F1's nonempty-derived rule. New promotion source convention identity still requires
explicit treatment: the old derived triple supplied no actual input closure. Its proposed direct
algorithm definition states the pass-clone and bounded reply rule, without changing primary
rule grounding or manufacturing source ancestry. This follows the existing separation between
grounding and convention identity, not blanket demotion of exact rule computations. The claim is
declared before its definition in F2 §2.3c and the existing semantic-conventions register. `[V]`
`evidence-grounding-taxonomy.md` §Why the six convention rows stay position-grounded;
`rfc/semantic-convention-provenance.md` §§2–3; current claim block/register (unaccepted proposal).

Independent read-only review finds no normative blocker within these three proposals and confirms
the added en passant, quiet-empty and wrong-edge controls. Twenty-one wrong-edge substitutions
exercise one refusal path, not 21 distinct classes. The reviewer does not rerun tests or accept
new factories, convention registration, source qualification, remaining D3847 classes, D3845 or
the joint Inspector amendment. `[V]` `planning/learner-modules/inspector-source-independent-review-2026-10-15.md`
§D3847/D3850 material and promotion component.

## Compare and Story negative-selection authority — 2026-10-15, D3847/D3845

Compare's structural difference is not a positive observation alone. It compares the requested
node's complete observation set with its immediate predecessor, then removes identities in the
intersection of both complete post-fork path unions. Every source occurrence and successful
empty family result matters; two endpoint readings or only the emitted observations cannot
establish those negative tests. `[V]` `compare-strip-values.ts:structureDeltaEntries` and the
authorized read-only continuation in the dated Inspector independent review.

The existing comparison research target now reconstructs all observation arrays from the actual
17 exact structural-family factories, retaining seal/ref/FEN authority. Named-structure@2 has a
different payload shape: the closed legacy observation uses only kind, squares and provenanceNote,
while the genuine input retains its id/name. Canonical kind/JSON ordering matches current complete
readings at all 44 distinct FENs examined, including two positive named-structure controls. There
are 392 successful empty family rows across these unique positions; these are recorded local
result rows, not fabricated sealed absence facts. Full selected arrays agree in 126 column reads
(124 from the existing 62 prefix pairs plus two deliberate strict-timing reads). The old selected
values still retain zero sealed input receipts versus 17 declared eligible-family refs. `[V]`
`make inspector-comparison-source-research`, `comparison-source.ts:sourceFeatures`, actual F1
factory receipt observation. This tests reconstruction/scope, not independent chess correctness.

On the fixed 62 pairs, extending the peer removes 72 requested-column node/observation entries.
These are removal incidences, not independent defect classes. A stricter assertion initially
fails: none occurs after an already nonempty peer prefix and beyond the selected observation's
ply. The instrument therefore adds a deliberate legal pair: main Nf3 at ply1 stays fixed; peer
a3/a6 ends at ply2, then reaches Nf3 at ply3. Its two endpoint-pair reads remove ten observations
from that unchanged requested node. Keep those ten separate from the earlier 72. A legal knight
return sequence additionally emits eight repeated-appearance items; a distinct-node pair
with a genuinely absent intervening observation is explicitly pinned. Selection is immediate-
predecessor appearance, including reappearance, not first-ever post-fork occurrence. `[V]` same
target, complete source-owned structural variant: 597 controls plus 316 constructor controls;
the original 1,020-item/four-fixture population and refusal controls remain.

Story's last-level factory instead scans all supplied typed evaluation points and retains only
the selected point. Both-color actual Review packet fixtures establish:

- Four available points versus the selected point alone give equal output/positive source lineage
  but unequal existing raw-input authority. That authority already binds all supplied points;
  the finding is missing declared population/selection lineage, not unbound caller input.
- A later qualifying measured point changes the selection in both cases.
- Three labelled final-node source states per color (not_requested, pending, provider_off) preserve
  different real packet states with equal last-level inputs/selection. Pending/degradation remain
  visible in the packet. These are source-state fixtures, not actual queued jobs/provider outages.
- Empty and all-mate populations produce four successful no-output cases. Two actual legal
  board-terminal losses contain qualifying measurements but produce no last-level Story moment:
  only an eligible `recorded_result` outcome invokes that computation.

`[V]` `make inspector-recorded-prefix-research`, `recorded-origin.ts` final Story controls;
`story.ts:reviewStoryMoments`, `evidence-factories.ts:createDerivedStoryLastLevelV1Evidence`.
Deliveries use existing synthetic parser/seal fixtures; no live engine call, complete-analysis
claim, new factory or provider qualification follows. Actual available points, missing states and
recorded outcome authority must stay separate in any successor's complete selection contract.

The independent reviewer confirms the mechanisms and corrects the scope: piece_route is a
separate complete initial-occupancy/ordered-replay computation, not a current Inspector topic.
Do not add it to the 75-topic migration. Its source closure remains open under D3847 for actual
Compare consumers. The reviewer finds no blocker in the bounded controls, does not rerun tests
and does not accept successor lineage, runtime implementation or the joint amendment. The stale
scoped table's extra eval_delta@1 arm must instead dispatch F2's exact eval_delta@2 contract;
structural and last-level literal schemas were still authoring holds at that checkpoint, not
compiler exceptions. `[V]`
`planning/learner-modules/inspector-source-independent-review-2026-10-15.md` continuation;
`compare-strip-values.ts:recordedPieceRoutes`, F2 §2.3a, current Inspector accepts.

### Population schemas and rejected-delivery review

F2 §2.3d now authors the complete structural and recorded last-level domain images, while
Review §4.5 authors the rank moment-group image. They are proposed source contracts, not new
evidence leaves or permission to bypass the remaining reduction grammar. The structural image
retains both ordered columns, all17 exact family results including successful empties, original
position occurrences and the closed named_structure@2 conversion. A draft-table consistency
control matches the current manifest and refuses a missing family or old named-structure version.
Existing126 reconstructions/392 successful empty rows and597+316 controls still pass. `[V]`
`make inspector-comparison-source-research`; F2 §2.3d; module-registration structural source table.

The independent review returns an incomplete last-level row shape: output state and points
cannot retain a delivered input whose position join fails. The corrected exact row includes
the full plan slot and captured provider state (null for an absent context entry), as well as
position, index, state and points. Both-color probes supply two different genuine synthetic
wrong-FEN deliveries: both fold to unavailable/input_abstained and leave the same last-level
selection, despite different captured delivery inputs. These are two contrasts, not live provider
failures. Every actual packet point is additionally checked against its original full recorded
FEN, exact factory and ordered input receipts. The first probe run incorrectly used positionKey
(the transposition key without clocks) as full FEN and failed; correcting the instrument to read
the original source path makes the normal target pass. `[V]` recorded-origin.ts:packetPoints and
final Story controls; `make inspector-recorded-prefix-research`; review-evidence.ts:pointOf.

The authorized reviewer's final read-only recheck finds that schema inconsistency closed and
the promotion convention's reviewed_text correction sufficient. It does not accept the domain
schemas, remaining reduction grammar or joint Inspector amendment and reruns no tests. Complete
constructors, successor factories, consumer/API/native delivery and source qualification remain
open. `[V]` dated Inspector independent review, population-schema continuation; F2 §§2.3c–d.

## Sequence literal-source replay and coexistence — 2026-10-15, D3847/D3851

The existing window instrument now reinspects genuine emitted derivation inputs and reinvokes
both old factory paths from their genuine sources. It observes 84 **per-recorded-output replays**
across all eleven families, not 84 independent positions/windows or a corpus prevalence sample.
Exact edges retain same-run, contiguous node/FEN/ply joins. Narrative inputs are minted through
the existing path/offset arm, never the Compare sentence arm or relabelled exact edges. All 84
reversed-edge and 84 reversed-narrative-move controls refuse. Factory source-digest lists retain
the actual repeated witnesses in their respective order; this is not proof that an equal digest
establishes a different projection identity. `[V]` `make inspector-recorded-prefix-research`,
`window-source.ts:inspectSequence`, existing unmodified factories and semantic event sources.

The exact observed recorded tuples are below. E=run.record.edge@1, C=capture@1, D=defender-duty
reading@1, K=check@1, X=legal-exchange@1. Powers denote literal repeated occurrences, not a new
metadata grammar. Corresponding narrative replays use path/offset move@1 values in E's slots.

| Family | Actual recorded witnesses | Replay count |
|---|---|---:|
| trade completed | C,C,E,E | 8 |
| contact timing | E,E or E,E,E | 4 |
| harassment pressure | E,E | 2 |
| defender consequence | E,E,E | 18 |
| square clearance | E,E,E | 20 |
| line clearance | E,E,E,X | 4 |
| interference | E,E,E,D,X | 2 |
| checking zwischenzug | E,E,E,E,C,K,X | 2 |
| overload exploitation | E,E,E,D,C,C,C,X | 4 |
| deflection | E³,D,C,X,K or E³,D,C,C,C,X in these fixtures | 6 |
| attraction | E³,C,K or E⁵,C,C in these fixtures | 14 |

`[V]` same target. The two bounded-capture rows describe measured arms, not every legal arm;
at most one capture per legal edge bounds complete populations by the declared 3/5 horizons.
Do not infer a universal capture count from this fixture sample. The shared 52-case population
omitted check-induced deflection, so two additional legal/mirrored cases explicitly cover its
first-edge check. Zwischenzug uses the first-edge capture/second-edge check; attraction's check
uses its third edge. Actual private input authority confirms those joins, the initial-FEN duty
reading, and each exchange's exact target/retained-recapture operand. Trade's captures are checked
against actual edge0/edge1 capture factories and zwischenzug's against edge0: 18 indexed capture
joins. All 18 exchange joins also check FEN/UCI and private authority directly against their
required final window edge, not just the exchange's own fields. These are fixture incidences,
not independent failure classes. This retains the original
104-run/452-window and eight imported-game source experiments; it does not expand their counts.

Twenty-four positive complete capture populations are compared with every capture in their own
window, in edge order. In ten deflection/attraction replays, the current private @2 factory also
accepts an omitted capture and the reversed genuine list with unchanged output payloads. These
are ten replay incidences per mutation, not ten distinct flaws or a public injection exploit.
The source list is incomplete or misordered even though the detector recomputes the same result
from legal anchors. A disposable source-completeness guard accepts 25 complete/quiet-empty cases
and rejects 77 missing/extra/reordered/duplicate cases using existing factory/ref/input authority
and exact payloads. Successful empties remain local result states, not invented chess evidence.
No old factory is changed or new receipt/factory registered. `[V]` same instrument's
`completeCaptureGuard`; rules.transition.event.capture sole factory.

Narrative and recorded full payload populations differ in 42 of 84 replay calls. Eight trade
differences include deliberately different moveAnchors source envelopes; they are not eight
tactical errors. The remaining differences occur in defender consequence, attraction and square
clearance, including their recorded-specific physical castling handling. Preserve independent
source/computation contracts rather than asserting blanket cross-version byte equality. `[V]`
same target's per-family summary; `semantic-evidence.ts` recorded versus narrative operations.

Existing accepted inventory deliberately retains both live source versions. Source/call-site
inspection finds production Review's exact-edge emitter and no in-repo production narrative
sequence emitter; this is a repository observation, not proof about external exported-API users.
D3851 asks whether new delivery should use exact edges only while retaining old APIs/history, or
implement both input pipelines. No retirement, merged topic count or new successor identity is
authorized while that question is open. D3847's finite witness repair and complete-window source
construction remain required either way. `[V]` `recorded-semantic-path.ts`, `module-query-sources.ts`,
call sites of the narrative semantic constructors; `rfc/module-registration.md` §1.3.1 and scoped
window source; `evidence-catalog.ts:withRecordedPathSuccessorRefs`; [[D3851]].

The authorized independent reviewer first identified the missing indexed capture and exchange
checks above, then rechecked their additions read-only after the normal target passed. Both
diagnostic gaps are closed. The review does not rerun tests, authenticate narrative provenance,
make old factories enforce completeness or qualify successors. The next step is exact contract
authoring, not larger fixture counters: literal tuples/finite arms, complete capture populations,
indexed joins and exact callable/consumer/presentation bindings. D3851 decides which distinct
delivery pipelines that image must preserve; structural/last-level schemas and D3845 remain
separate authoring holds. No upstream or joint Inspector acceptance follows. `[V]`
`planning/learner-modules/inspector-source-independent-review-2026-10-15.md` sequence continuation.

## Strict overload's hypothetical authority — 2026-10-15, D3847

The existing incoming-edge instrument now checks the actual strict-overload output receipts:
all four positive emitted conflicts retain exactly initial defender-duty reading then capture,
not a third sealed exchange. Both initial inputs' private authority matches the actual canonical
before-position/edge. The four retained legal recapture positions each have a positive follow-up
capture. Replaying those recaptures from the actual after-position establishes the corresponding
reply FEN; invoking the existing exchange factory there reproduces the nested exchange payload.
All four reply FENs differ from the candidate's before-position. These are fixture incidences
across orthodox/en-passant cases and their mirrors, not an independent chess oracle or frequency
estimate. `[V]` `make inspector-incoming-dependent-research`, `incoming-dependent.ts` overload arm;
`evidence-factories.ts:createDerivedTacticOverloadedDefenderResponseConflictV1Evidence`.

The original target still passes318 controls/218 requests, including two actual imported games/
six selected edges, successful clear results, no-capture source empties, exact en-passant victim
identity and `no_legal_recapture` unavailability. The first added check did not typecheck because
it treated the exchange factory's population as an availability union; correcting the diagnostic
to require its actual one-element population restores the unchanged normal target. No production
or old factory changed. `[V]` same target and actual factory route type.

`overloadedDefenderResponseConflict` recomputes the initial duties from beforeFen today. A new
two-input contract must actually consume the admitted initial duty payload, rather than run that
old helper and append an unused reading. Subsequent duties/exchanges are internally computed
on legally replayed hypothetical recaptures under `overload-conflict@1`, `defence-duty@1` and
`legal-exchange@1`; one guessed played-edge exchange cannot witness that complete computation.
The literal new derivation needs two inputs, not a fabricated exchange collection. This does
not change the algorithm's four clauses, nested operands, recapture-promotion identity, ordering
or abstention precedence. `[V]` `tactics.ts:overloadedDefenderResponseConflict`, existing convention
declarations, D3716's permanent recapture-promotion controls. Fork survival is separate: D3768's
terminal-rule repair still requires coordinated acceptance, not a source-only relabelling.

The first isolated proposed two-input declaration **fails** normal prefix research with
EVIDENCE_DERIVATION_WIDENS: F1 requires a shared input grounding to be inherited, so two
position_rules inputs cannot produce the proposed declared_convention result. The instrument
now preserves that refusal as a negative. Counterfactual position_rules metadata compiles;
that does not establish truthful primary authority. The independent reviewer confirms that
strict overload includes positive-exchange classification, not just geometric duties, and
finds no accepted basis for that relabelling. D3852 owns resolution before adoption. `[V]`
`make inspector-recorded-prefix-research`, `recorded-origin.ts` overload candidate;
`evidence-contract.ts` grounding guard; dated independent review.

The reviewer also corrects the prospective execution assertion: local duty/capture computations
appear in the exact derivationChoices.inputs order, not the non-local sourceRequirements list.
That list is empty. Normal prefix research passes with the unresolved grounding refusal explicit,
18 conditional map replacements/57 retained topics and ten map-corruption controls. No successor
was minted and the counterfactual metadata is not an accepted declaration. Direct calculation
versus sealed-input derivation is the construction-authority question addressed below, not a
reason to weaken the compiler or mint unused witnesses. `[V]` same target;
`evidence-execution.ts` local leaf handling.

The revised proposal uses F2 §2.1's existing **direct computed conventional predicate** category.
The entire capture/duty/recapture calculation is reconstructible from one legal board edge; it
does not accept independent sealed inputs. This is not a computed escape hatch for recorded
Story/Compare populations. The author replaces, rather than retains alongside it, the rejected
derived@2 proposal with `rules.tactic.predicate.overload_conflict@1`. Its primary grounding stays
declared_convention and all three convention contributions are direct. The unchanged F1 compiles
the isolated metadata; its direct-closure computation finds exactly defence-duty@1,
legal-exchange@1 and overload-conflict@1, with no derivation or non-local source requirements.
No new convention or F1 amendment is required by this construction category. `[V]` same normal
prefix target; F2 §2.3e; independent bounded source review.

A disposable pure-edge recipe in the original incoming instrument compares 24 complete old
payload/availability outcomes, including quiet successes, against the existing pure helper.
Three malformed/illegal/mismatched quiet-edge controls refuse before capture lookup while the
old helper's undefined-capture shortcut returns clear; the new factory must validate first.
Four hypothetical capture checks also join exact retained target color/role/square, not just FEN.
The final unchanged incoming/prefix commands and strict tool types pass. An intermediate metadata
typecheck rejected explicit derivation:undefined under exactOptionalPropertyTypes; the prototype
now genuinely omits the property without weakening flags or types. `[V]`
`make inspector-recorded-prefix-research inspector-incoming-dependent-research`;
`incoming-dependent.ts:computedOverload`, `recorded-origin.ts` computed candidate.

The incoming report's timed interval now includes added reconstruction checks. Its maxMs values
are diagnostic wall time, not a fresh measurement of production latency or comparable to the
earlier source-only D3836 cost experiment. The report explicitly labels that limit. `[V]`
`incoming-dependent.ts` report scope and execute timing boundary.

Independent read-only review finds no remaining normative blocker in this bounded revised
component. It does not rerun tests or accept the source, D3852 closure or joint Inspector.
Actual factory/receipt/closure, mutation and pre-work refusals, promoted-recapturer/mixed-candidate
precedence, full consumer/rendering and authenticated/native proof remain. The new map18/57
retains75 topics plus six detail refs as requirements only; no topic is added or retired. `[V]`
`planning/learner-modules/inspector-source-independent-review-2026-10-15.md` computed overload.
