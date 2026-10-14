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
`apps/server/src/review/source-adapters.ts`; `compare-strips.ts`; `story.ts`; `hint-distance.ts`;
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
