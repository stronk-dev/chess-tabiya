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

## Rank-only reduction contract — 2026-10-15, D3845

Current rank contains only ordered node IDs. The actual Story consumer marks rank selection-only;
the Inspector renderer emits only the number of ordered moments. It does not render child scores
or pattern explanations through the rank value. That supports a fact-only successor rather than
giving every realization the full eligible-family answer union. `[V]` evidence-factories.ts:
createDerivedStoryRankV2Evidence; evidence-catalog.ts:SELECTION_ONLY_BINDINGS;
presentation-inspector-adapters.ts:storyRank and inspector.story_rank@1; independent read-only review.

F2 §2.3g/provider §1a now propose the narrow rank-only third derivation arm, existing story-rank@1
ordering authority, complete domain/reduction/convention receipts and finite template/concrete
occurrence split. The constant convention/reported labels describe the ordering computation;
actual children retain their complete weak authority and separate admission. Empty emits one
rank[] value without becoming a source receipt or a complete-analysis diagnosis. These are author
contracts, not production declarations or an independently accepted grammar. `[V]` cited draft
sections and Review §4.5/module-registration's exact proposed rank binding.

The independent review returns two contradictions. The module binding still said weakest-input
grounding despite the explicit ordering-fact rule. More importantly, the first concrete-occurrence
paragraph assumed child input-choice proofs already existed. Current EvidenceValueReceipt has no
such tree; convention members deduplicate/sort refs and their inputs are order-free. The correction
authors new private construction-time input/source sidecars, genuine plan issuance and exact
group/item/element/witness joins, including original leaf authority and nested reductions. Old
receipts are not retrostamped. The final read-only recheck clears those bounded inconsistencies
and the captured-context/provider-health distinction, not source or joint acceptance. `[V]`
evidence-contract.ts:EvidenceValueReceipt; evidence-factories.ts:mintConventionReceipt;
provider §1a revised witness tree; dated Inspector independent review, rank-only continuation.

The normal prefix research target and strict types still pass on unchanged production. They test
the existing scopes/tuples/coverage and old grammar negatives, not the proposed third arm, V2
planners, sidecars or authenticated/native delivery. No extra truth inferred from unchanged counts.
Last-level@2 is a named prerequisite whose exact factory/reduction remains to be authored, not a
new existing source; structural/last-level/vector reductions receive no rank exemption. `[V]`
`make inspector-recorded-prefix-research`; F2 §2.3g acceptance hold and provider §1a.

## Last-level result authority — 2026-10-15, D3847

The current last-level factory emits an ordinary frozen0/1 array; the actual factory wrapper and
route invoker return the body's array unchanged. That makes a private result-array receipt pair
feasible without adding public wrappers or fabricated empty evidence. Its genuine-empty proof
does not currently exist. Current Story iterates the result and later excludes root moments;
the new source must retain the calculation receipt before either operation loses result identity.
`[V]` evidence-factories.ts:factory/createDerivedStoryLastLevelV1Evidence;
internal/evidence-value-routes.ts:invokeEvidenceValueRoute; story.ts:reviewStoryMoments;
independent read-only last-level review.

Existing synthetic source probes now pin the actual learner lower threshold at -101/-100/-99
and +250 for both colors: eight cases. Six qualifying root cases preserve exact complete old
payload and selected node/actual ply, while actual Story emits no root last-level moment. Four
learner-win/draw controls remain empty despite a qualifying score. These add evidence about old
behavior, not tests of the proposed source constructor or sidecar. No absolute ±100 interval,
objective level claim, new engine call or complete-analysis proof follows. `[V]`
`make inspector-recorded-prefix-research`; recorded-origin.ts final Story controls.

F2 §2.3h now authors the exact new story.last_level@1 operation/last-level@2 source-only factory,
complete eligible result/position/point roles and private fresh0/1 result/convention receipt pair.
The source schema explicitly gains the original endpoint result invocation/state and genuine
fact; raw outcome tokens or an arbitrary historical caller arm do not substitute. Result output
identity includes payload plus original wrapper node/ply, with acyclic mint/receipt publication.
Moment assembly retains private lastLevelReduction even for empty/root-excluded output; rank
binds that actually executed context convention, not an invented absent fact. Provider §1a has
two exact source-owner bindings, no automatic reduction permission or new provider work. `[V]`
cited draft sections; Review §4.5 and module-registration's scoped rank binding.

Authorized independent review finds no normative blocker in this bounded image, not component/
joint acceptance. Main catches one naming contradiction (constructor called a reader); the final
read-only recheck confirms distinct collectRecordedLastLevelPopulation and private
readRecordedLastLevelPopulation. No reviewer tests or implementation proof. Direct position input
also means the old eleven-adapter baseline is not a complete new source image. Actual source/
factory/sidecar/witness/planner/admission/API/native work, structural/sequence/opaque/vector
contracts and independent joint acceptance remain open. `[V]` dated Inspector independent review,
last-level continuation; provider §1a; Review successor-closure obligation.

## Structural comparison reduction and caption failures — 2026-10-15, D3847/D3855

The authorized independent reader confirms that current structure_delta@1 has no direct registered
selection-convention ref and supplies zero sealed inputs. Its actual rule is already shipped in
structureDeltaEntries, directly re-read at snapshot673683057b6d744623fe45b9deb54bedf3771a06.
Recover that product rule as landed_contract authority, not position rules or an owner ruling.
Actual recorded positions plus17 families make eighteen eligible roles. Executed empty families
need applied convention authority retained, not an unexecuted-template union. `[V]`
`packages/runtime/src/compare-strip-values.ts:structureDeltaEntries`;
`evidence-factories.ts:createDerivedCompareStructureDeltaV1Evidence`; dated independent review.

The disposable comparison target feeds genuine old factory values through four actual consumer/
render pairs: module.compare_coach, module.full_inspector, compare.structure_strip and
guidance.voice_compare. A White knight reading on f3 has safe:false, actual e7/g7 push attackers
and capture-reach geometry, yet all four captions say no opposing pawn can reach it. A genuine
d3–d4 isolated-pawn match prints "On this attempt after the fork: undefined" in all four. The
first named control wrongly expected a parser exception; actual formatting does not throw, and
the corrected regression pins its emitted undefined string. A first strict-tool type error
required an explicit readonly string-array annotation. These instrument failures are retained;
neither is a production repair. D3855 owns the live bad-caption class. `[V]`
`tools/d3792-inspector-demand/comparison-source.ts`; `make inspector-comparison-source-research`;
`presentation-play-adapters.ts:observationSentence` and all three comparison adapter modules.

F2 §2.3i proposes compare.structure_delta@1/structure_delta@2, complete eighteen-role occurrence
mapping, authenticated invocation/variable-empty-result proofs, selected-branch identity and
relative ply. It preserves legacy conversion/intersection/predecessor/reappearance and old N-way
callers. Its explicit additive namedStructure field retains the selected raw catalogue id/name;
the scoped renderer keeps complete pawn detail. Provider §1a gains only the third exact binding.
The requirement map has20 replacements/55 conditional unchanged topics, still75+6 requirements,
not actual bindings. `[V]` cited RFC sections and presentation/module-registration companions.

Independent review catches a preservation blocker: an exact old@1 projection in the new
convention's authority witnesses would automatically change that predecessor's direct closure.
The corrected proposal has only the verified path/symbol authority witness, with the convention
literal bound only to @2 catalogue semantics. Explicit old-ref/receipt preservation tests remain
required. `[V]` `evidence-convention-closure.ts:deriveProjectionConventionTable`; dated review;
F2 §2.3i. No new convention registration or runtime closure change has occurred.

Both normal prefix/comparison research targets and strict tool types pass:316/597 source controls,
126 reconstructed readings,392 empty family rows, ten strict later-peer suppressions and eight
reappearances; twelve map negatives. They prove existing selection and caption failures, not new
nominal sources, sidecars, convention registration, execution, API/native or joint qualification.
No provider work, raw dump, production change, semantic qualification, content graduation or
release promotion follows. Existing old Compare/voice/strip repair stays open separately. `[V]`
named normal targets and committed assertions; independent re-review status is recorded separately.

## Opaque-source classification and existing method-path discharge — 2026-10-15, D3847/D3856

The existing source observer's exact opaque route set is engine_trajectory@1, compare.eval_delta@1
and theory.endgame.method_stage@1. Only compare.eval_delta belongs to its current Inspector union;
F2 §2.3a already proposes the separate recorded-report delta, not yet implemented. Trajectory is
an old Compare path whose attachment-derived digest establishes neither a modern engine delivery
nor its request. It remains real platform migration work, but is not an Inspector topic. `[V]`
`source-observer.ts` and its ignored compact diagnostic; `evidence-factories.ts:verifiedTrail` and
`createDerivedCompareEngineTrajectoryV1Evidence`; current module manifest and F2 §2.3a.

Method-stage's opaque operand differs: it is exactly evidenceDigest(endgameMethodConvention(ref)),
following the genuine setup and every exact edge in that emitted stage's start-to-trigger prefix.
The factory separately records the selected method convention and inherits the actual setup
convention. This is registered algorithm authority, not a missing provider collector or permission
to create a fake evidence leaf. Its variable-edge declaration still needs D3847 reconciliation;
it currently has no consumer bindings. No whole-source/consumer completion is inferred. `[V]`
`evidence-factories.ts:createTheoryEndgameMethodStageV1Evidence`; `endgame-method-authority.test.ts`;
`evidence-catalog.ts:theory.endgame.method_stage`; existing source observer.

Thirteen new permanent tests call the actual factory, not a duplicate replay oracle: all three
methods in original/color-mirrored positions retain complete stage payload locations, original
ordered prefix receipts and exactly the actual setup/method convention pair. Replaying each
stage prefix reproduces that stage. Another genuine static setup computation at the same FEN
is deliberately accepted: setup is node-free, so a fabricated foreign-run restriction would be
wrong. Actual mixed-run edges, order/gaps/repetition and forged setup/edge values refuse. Corrupt
paths fail before unregistered-convention return and before material-domain exit could hide a
later foreign edge. The complete 108-case normal target includes the existing recorded-path
suite; the existing74-case value-authority gate and workspace types also pass. `[V]`
`make endgame-method-authority-check`; `make evidence-value-authority typecheck`.

This proves F2 D5's existing exact recorded-path obligation and discharges that narrow row;
it does not accept a new source schema, repair variable cardinality, change receipts, qualify a
detector, add advice/eligibility, or supply a native learner journey. D2–D4 and the unaccepted
Inspector/source amendments remain open. The source-scope disposition and structural hold wording
are explicit in F2 §2.3d; independent Inspector-scope review is recorded separately. `[V]` cited
RFC/discharge and canonical `docs/evidence-contract.md` method-path paragraph.

The authorized independent Inspector reviewer directly traces the catalogue and successor map,
confirms these scope distinctions and the corrected structural hold, and finds no false claim.
It performs no tests and explicitly does not review/rule on D5's separate closeout. `[V]` dated
Inspector independent review, Opaque-source Inspector scope section.

The same direct tracing confirms candidate_feature_vector@1 is not an Inspector input or
dependency; its actual binding is opponent.selection@1. Shared collector ancestors do not make
Inspector depend on the vector. Correct the blanket queue prerequisite to reachable sequence
contracts and complete source/adapter closure. Full vector reconciliation stays mandatory at its
actual consumer, and D3853 compatibility still precedes shared packet/helper changes; whole
F2/provider/platform completion is not narrowed. `[V]` independent read-only vector-scope check;
`evidence-catalog.ts` Inspector accepts/opponent binding and existing observer's inInspectorClosure.

### Recorded sequence finite successor contracts

D3847's recorded sequence proposal now uses ten source-only@3 factories and23 literal existing
F1 inputs/anyOf members, not a new variable-reduction grammar. The disposable declaration image
compiles all23 with unchanged F1 and matches all76 actual nontrade positive recorded tuples;
the eight trade outputs keep existing C,C,E,E@2 and stay outside Inspector. Complete capture
populations and indexed duty/check/exchange authority are separate from tuple length/ref checks.
The previously measured25 positive/77 negative capture guards and ten old accepted omissions/
reorders remain; no old factory is changed or new issuer/factory minted. `[V]`
`tools/d3792-inspector-demand/recorded-sequence-contract.ts`; `window-source.ts`;
`make inspector-recorded-prefix-research`; F2 §2.3j.

The first new control assumes simply copying old@2 text loses direct conventions at@3; it fails
because current literal text already retains them. Immediate-predecessor witnessed inheritance
is nontransitive, but that does not establish a real loss here. Correct the claim and test actual
preservation plus eight deliberately stripped-token controls. Existing@1/@2 direct tables remain
equal; new@3 preserves exactly old@2 direct refs without new convention definitions or old witness
changes. The prospective image still declares the old exact grounded/physical recorded semantics,
not narrative substitutions. `[V]` cited normal target and `evidence-convention-closure.ts`.

The successor map now replaces30/conditionally retains45 topics, still75 acquisition obligations
plus six detail refs.32 negative map controls reject dropped/wrong source repairs; these are
requirements, not source availability or compiled new consumer bindings. D3851's narrative scope
choice and full runtime/adapter/current-access/native delivery remain open. `[V]`
`recorded-origin.ts`; `rfc/module-registration.md` affected-source table and scoped window owner.

The authorized independent review confirms exact finite horizons/arms/indexed joins and returns
a source-failure grammar omission: failed C/D/K/X execution could not inhabit the closed window
refusal union. The correction explicitly maps private source-contract/lookup failures to closed
failed outcomes and actual exact-owner holds to unavailable, never malformed graph, source_absent
or successful no_witness. Final bounded wording recheck clears that blocker, not source/joint
acceptance or implementation qualification. Reviewer performs no tests; the new issuer, private
source proof, invocation adoption, presentation and HTTP/native behavior are not exercised by this
old-source research. `[V]` dated Inspector independent review, finite recorded-sequence section;
F2 §2.3j and module-registration recorded-window source-owner/result grammar.

### Recorded ledger source populations and coverage

D3841's two retained ledger topics need different acquisition from selected-node attachments.
Six synthetic reports at one legal board with different half/fullmove clocks yield three engine
and two tablebase readings through legacy recordedReadingsAt, but exactly one of each through
the prospective full-FEN selector. Two saved live attachments suppress all legacy recorded
readings; phase's full-FEN tablebase resolver retains its report. These are measurements of actual
source/filter code using explicitly synthetic report values, not Stockfish/Syzygy computations
or detector correctness evidence. `[V]` `tools/d3792-inspector-demand/ledger-source.ts`;
`apps/server/src/position-evidence.ts`; `apps/server/src/phase-source-composition.ts`;
`make inspector-recorded-prefix-research`.

The same41-control experiment preserves admitted/refused/admitted record ordinals plus matching
abstentions, distinguishes refused-only/abstention-only from genuine verified absence, refuses
malformed/crossed artifacts/FENs/source links and checks both sides. Identical records produce
equal sealed payload digests but retain distinct original ordinals; a digest alone cannot replace
the proposed source occurrence proof. The existing phase snapshot rejects same-full-FEN duplicate
tablebase reports, so it cannot be aliased as Inspector's complete ordered population. That is
an API-domain difference, not an asserted bug in phase's singleton contract. `[V]` cited experiment;
`recorded-reading.ts`; `evidence-factories.ts:recordedFactory`; phase snapshot implementation.

Existing assessmentGrounding immediately rejects non-engine/syzygy grading claims; it is not a
general measurement-source admission function. PackRecord retains a lossy index/assessment state,
not the original manifest/ledger record/disposition image. optionalJson also collapses every
missing, read or parse failure to undefined. The proposal therefore adds separate registry-owned
measurement admission and original sidecar load states while deriving old loader/grading/index/
phase behavior unchanged. The raw synthetic helper demonstrates selection/validation feasibility,
not a validated complete document, installed-source issuer, actual loader error-state combinations
or runtime pack authority. No consumer may use it as a production source constructor. `[V]`
`apps/server/src/pack-registry.ts:optionalJson/fromDocuments`; `sourcing/ledger-validation.ts`;
module-registration §4.11a's new recorded-ledger supplier contract.

The old closed available outcome cannot carry source refusals beside valid facts. The new draft
adds a constant-sized recordedCoverage field to source body/disclosure and one two-topic-only
unavailable reason for refused/abstained zero-fact results.17 parser/count/receipt controls reject
null, extra/wrong-topic/incoherent/negative/fractional coverage and changed source/count digests;
the normal incoming target also executes three exact-topic unavailable-reason controls. This is
grammar/coherence evidence, not source issuance or full response admission. Fixed operational
status is distinct from chess facts, LLM input and budget deferral. `[V]` `ledger-source.ts`;
`draft-wire.ts`; `make inspector-incoming-dependent-research`; module/presentation draft clauses.

The authorized independent reviewer first identifies that mixed facts/status cannot fit the old
wire, then checks the authored source, coverage, receipt and presentation companion. It finds no
remaining normative blocker in this bounded component; no tests, edits, component/source/joint
acceptance or implementation qualification. Actual registry/loader/witness/callable/adapter/current
access/native proof and the complete75+6 source image remain owed, independently of D3851's
narrative scope choice. `[V]` dated Inspector independent review, ledger population correction.

### Opening history and sparse Explorer delivery returns — 2026-10-15

The independent whole-source review finds two remaining contract gaps, not production false
available results. Installed-opening §3 requires complete actual-prefix positions and endpoint
visits, including successful negative lookups, but deepest_reached@1 declares exactly one
endpoint/position input pair. Provider §1a's three proposed reductions do not include history.
The existing runtime factory honestly returns input_abstained; changing a future available
implementation cannot silently change old literal input/receipt meanings. `[V]`
`rfc/installed-opening-evidence.md` §3; `packages/runtime/src/evidence-catalog.ts` deepest_reached;
`packages/runtime/src/evidence-factories.ts:createDerivedOpeningDeepestReachedV1Evidence`;
dated independent Inspector review; [[D3857]].

The new disposable opening-source experiment loads the real installed catalogue, uses actual
legal recorded moves and existing sealed position factories, and passes28 controls. Its nine-node
prefix has seven matched visits, including repeated endpoint keys at later observed plies; this
requires more than the declaration's two literal inputs. Earlier endpoints exclude later nodes,
and a fork excludes sibling nodes. A one-position and a two-position nonopening prefix return
the same successful absent payload while their complete position/lookup images differ. Thus a
future history authority must retain negative rows as well as selected/matched visits; one
selected endpoint or an empty result alone does not establish what was searched. `[V]`
`tools/d3792-inspector-demand/opening-source.ts`; `make inspector-recorded-prefix-research`.

These controls exercise existing catalogue/history functions, not the unbuilt installed-source
issuer, new history factory, execution realization, storage authorization or response admission.
The first probe incorrectly expected the position after e4 to repeat after Black had played e5;
it fails and is corrected to the genuinely repeated e4/e5 position. Initial TypeScript input/
function-signature mistakes are also corrected, not recorded as production bugs. Existing history
folds all three source-unavailable reasons to input_abstained, while the installed-source draft
requires exact missing/invalid/digest status at consumers; the new Inspector mapping must retain
that source-local distinction after migration instead of keeping a permanent version hold. `[V]`
cited experiment; `apps/server/src/opening-catalogue.ts:deepestOpeningReached`;
`rfc/installed-opening-evidence.md` §4; `rfc/module-registration.md` closed source outcomes.

Explorer's actual narrow factory admits complete sparse and zero pages. The current corpus
service handles total<100 before presentation and returns typed below_floor/total; its existing
fact renderer intentionally rejects those totals. The proposed complete Inspector source clause
requires preserving this status, but its closed source outcomes contain neither that status nor
its total. Reusing a >=100 fact renderer fails valid sparse data; provider_failed, source_absent
or generic no_witness loses the promised distinction. The ledger-only coverage field cannot be
borrowed for Explorer. `[V]` `packages/runtime/src/evidence-factories.ts` inspector population;
`apps/server/src/inspector-corpus.ts`; `packages/runtime/src/presentation-consumer-adapters.ts`
consumer.explorer_population; `rfc/module-registration.md` §4.11a; [[D3858]].

Next author exact history construction/retained inputs/admissible execution and post-install
source outcomes in the owning contracts, and an Explorer-only status/receipt/client mapping.
Preserve old source APIs/receipts, all sample floors and D3851's separate unanswered coexistence
choice. These findings do not accept Inspector or establish new source/adaptor/API/native delivery.
The reviewer performs no tests or edits; main's28 controls and normal prefix target are separate
research verification. `[V]` dated independent Inspector review and cited runnable experiment.

The rest of the independent pass finds a coordinated consumer contradiction: Nudge/Review@2
replace only fork while preserving every other exact ref, yet require complete strict execution
preflight. Retained live.stockfish.eval@1, live.stockfish.wdl@1, human_divergence@1 and grade@1
all reach unregistered provider leaves. Four direct actual compiler refusals in the normal
prefix probe confirm this; the draft V2 wrapper cannot make a fixed subtree executable. The
proposal needs an exact complete source/image disposition, not an implicit held-binding plan,
dropped alternative or silently failed whole module. `[V]` [[D3859]]; module-registration's
coordinated direct consumer images; evidence-execution.ts providerOperation; recorded-origin.ts.

Review §4.5 also explicitly says its successor adapter/literal source/state image is unpublished.
Current pivotal adapters hard-bind marker@1, with a four-field parser and exact projection check;
the proposed source needs version2 markers and direct positions. D3841 therefore still owns the
exact scoped adapter IDs/versions/callables/parsers/slots/source/state table. This is acknowledged
remaining mechanical authoring, not a newly failed reduction grammar or completed adapter work.
The rest of the review finds no additional concrete contract gap in its inspected packet,
material, dependent-edge, detail and shape paths; this bounded negative finding is not joint
acceptance or a claim that their future implementations/tests exist. `[V]`
`rfc/review-evidence-compiler.md` §4.5; `packages/runtime/src/review-evidence.ts` pivotal adapters
and sealSourceResult; dated independent review, remaining source pass.

### Opening history and sparse Explorer contract correction

Installed-opening §3a/F2 §2.3k now propose the additive deepest_reached@2 over one genuine
complete root-inclusive recorded prefix and admitted installed source. Every position and
actual matched/negative paired lookup is retained before selection, including repeated keys
and exit/re-entry. New private point-invocation/result membership is explicitly required;
today's empty arrays/digests are not misrepresented as issuance. The reduction has exactly two
eligible templates, exact original occurrence addresses, direct opening-deepest-reached@1
closure and authentic empty result with no invented fact. Output digest excludes its own final
input/convention/reduction receipt. Old history@1 remains unchanged. `[V]` cited draft sections;
`rfc/provider-exchange-and-execution.md` §1a fourth exact binding; [[D3857]].

The exact Inspector map now replaces31/conditionally retains44 topics, still75+6 requirements,
not executable bindings. Actual missing/invalid/digest-mismatched installed source reasons are
restricted to the three opening topics; corrupt history authority is not an artifact failure.
40 disposable reason/receipt controls exercise exact topic/kind/
extra-field refusal and status-sensitive digests. Existing28 real-catalogue/history controls
remain. These do not construct the new source/factory/receipt or prove real current-source
revalidation/client delivery. `[V]` `draft-wire.ts`; `recorded-origin.ts`; normal prefix/incoming
research targets; module-registration exact map/outcomes; installed-opening §4.

D3858's same closed source wire gains exactly one Explorer-only below_floor outcome carrying
the same admitted source occurrence, total0–99 and canonical population/window. It bypasses
only the >=100 fact renderer, never whole-page/narrow source admission. At100 the existing
fact path remains. Full sourceOutcome correlation binds all fields; no paging/continuation,
fake evidence leaf, provider fallback, LLM input or changes to old corpus API/floors.30 disposable
shape/population/receipt controls include zero/99/100 boundaries, wrong source/topic, duplicate/
unordered population, wrong/reversed dates, extra fields and digest substitutions. The first
TypeScript result cast is corrected to explicit typed construction, not a production bug. `[V]`
`draft-wire.ts`; module-registration sparse Explorer clause; evidence-presentation companion.

The authorized reviewer independently checks each bounded correction against the named source
contracts and finds no normative wording inconsistency. It performs no tests/edits and grants
no source/component/joint acceptance. Real source/invocation/result issuers, V2 realization,
adapters and authenticated/native client proof remain future implementation. D3859's complete
coordinated module image and D3841's exact scoped Review adapter/source/state table remain next;
neither the old eleven baseline nor these proposals supplies them. D3851 is separately unanswered.
`[V]` dated Inspector independent review, D3857/D3858 correction sections.

### Complete module source census and paired grade authority

The current strict execution census traverses every declared input alternative, not only the
fork path.28 disposable controls measure Nudge52 accepted/51 individually executable, Review85/
81 and Hint35/35. Whole Hint compilation succeeds; Nudge fails at grade and Review at grade,
human divergence and its two live Stockfish leaves. The proposed Inspector replacement map is
used solely as a conditional inventory, not module authority: it overlaps one Nudge and18 Review
refs but still leaves grade unresolved. Removing the grade's live alternative yields a passing
counterfactual while changing the accepted contract, so it is explicitly not a repair. Compilation
does not establish literal factory conformance, acquired source authority or UI adoption. `[V]`
`tools/d3792-inspector-demand/module-source.ts`; `evidence-catalog.ts` MODULE_CONSUMER_ACCEPTS;
`evidence-execution.ts:compileProjectionExecution`; `evidence-binding-execution.ts`;
`rfc/module-registration.md` coordinated module successor image; [[D3859]].

The grade declaration has one input in each alternative; the actual factory retains two ordered
before/after input digests.24 actual old-factory positive outputs over explicitly synthetic
engine reports cover both movers, three contexts and all four recorded/live-labelled ref pairs.
All output lanes are recorded;12 pairs cross projection origins. Pure arithmetic matches the
existing grader exactly. These are not Stockfish runs, engine-quality measurements or new source
issuance. The accepted grade §2 instead requires same-lane pairs, and its D2473 changelog already
promises two ordered occurrences. Four observed combinations therefore establish current behavior,
not four obligations for a successor. `[V]` cited module-source experiment;
`evidence-factories.ts:createDerivedGradeMoveQualityV1Evidence`; `grade-reading.ts`;
`rfc/move-quality-grades.md` §2/D2473; [[D3860]].

Actual Nudge and Review acquisition is narrower: latest engine_validated attachment packets at
the actual parent and child; Nudge supplies drill context, Review supplies review/imported_analysis.
Neither currently acquires ledger readings for these module grades. Thus the mixed-source control
does not prove current learner grades use mixed origins. Both wrappers normalize to recorded in
the shared reader, losing the source distinction required by the contract. `[V]`
`postcommit-nudge.ts:postcommitEdgeEvidence`; `review-map.ts:evaluationPacket` and grade decision;
`apps/server/src/service.ts` Review context; independent review's D3859/D3860 source tracing.

The authorized independent reviewer requires a paired successor over two exact same-origin
operands, source-owned actual legal edge/full FENs/occurrence/head/grant/mover/context, and exact
admitted ledger or modern attached-job whole-delivery joins. No new analysis in the read and no
promotion of v1 packets to modern deliveries. F2 §2.3a's report-only Inspector packet projections
expressly exclude grading; using them for new grade words would need a separately authored
meaning and authority, not an automatic map substitution. Existing arithmetic/typed mates/
thresholds/below-threshold-empty/abstention stay; old APIs/receipts stay distinct. Missing new
grade sources must remain source-local, not suppress an entire otherwise useful module. Review
accuracy/evaluation routing also needs an exact disposition. These are required author corrections,
not accepted new sources or completed consumers. `[V]` dated independent review;
`rfc/durable-stockfish-source.md` §4; `rfc/evidence-value-authority.md` §2.3a.

The initial synthetic cp fixture included mateIn:null, which the actual recorded reader rejects;
removing that invalid field produces the24 outputs. The opening fixture also stops pretending the
real position payload contains projectionId: it explicitly constructs the legacy raw helper's
separate envelope after obtaining a genuine sealed position. Existing28 opening controls remain.
Neither correction changes production. `[V]` module-source.ts; opening-source.ts;
`recorded-reading.ts`; normal inspector-recorded-prefix-research target.

### Pre-launch compatibility ruling and exact retirement inventory

Marco answers D3851: “zero legacy required. we are pre launch. make it all right.” This removes
compatibility-only API/helper/dual-pipeline obligations, not detector breadth, truthful source
authority or real current consumers. The owner decision is recorded separately from code delivery;
it does not authorize deleting stored user data, immutable archives or append-only logs. `[V]`
owner reply in this task,2026-10-15; [[D3851]]; exploration log's dated ruling entry.

14 disposable inventory controls map every currently accepted sequence family to one recorded
source, deduplicate first-slot order and assert no nonsequence source disappears. Nudge52→52
retains nine families by replacing its narrative-only slots. Review85→74 retains eleven;
Inspector75→65 retains ten, with six separate detail refs still proposed. Trade is the eleventh
recorded family elsewhere and already has the distinct capture/capture/edge/edge@2 factory; it
is not a Full Inspector topic or an invented eleventh@3 source. The ten other families have real
recorded@2 paths and separately authored@3 tuple repairs. These are conditional inventories,
not compiled complete target consumers or implemented source issuers. `[V]` module-source.ts;
recorded-sequence-contract.ts; evidence-catalog.ts SEMANTIC_EVENT_PROJECTION_REFS;
evidence-factories.ts recorded trade; normal prefix research.

Independent read-only tracing confirms the ten exact Inspector duplicates. Remove obsolete
narrative declarations/factories/invokers/wrappers/exports/adapters together after actual callers
migrate; never rename narrative payloads into recorded authority. Nudge's existing one-edge
supplier does not acquire multi-move windows merely because its accepts list changes: exact
granted-prefix/window semantics must be authored and reviewed. The obsolete vector chain is
server wrapper→runtime operation→sole factory→candidateCollectorResults, with no in-repo
production wrapper caller found. Retire that chain and its obsolete registrations/profile/tests,
not the entire opponent.selection consumer or candidateChildReadings used by current packets.
No frozen old vocabulary is now required. Actual current bot/Hint/pack consumers and source
authority remain. `[V]` dated independent review; candidate-evidence.ts; candidate-feature-vector.ts;
postcommit-nudge.ts; [[D3853]]/[[D3859]].

The initial retirement probe's map inferred only@3 values and rejected adding trade@2 at
TypeScript compilation. Its value type is corrected to string; no production bug or output
meaning changes. Final normal prefix research passes all14 inventory controls and prior
28 module/24 synthetic grade controls. Normal permissioned move-grade-consumer-check passes
127 cases across five files and all workspace types, including zero Svelte errors/warnings.
This is focused verification, not full software/content/browser/remote-CI release proof. `[V]`
cited Make targets and current task outputs.

### Accepted grade pairing repair, not complete modern-source delivery

D3860's immediate discrepancy is already prohibited by accepted move-quality-grades §2 and
D2473, so it is implemented as a bug fix rather than delayed behind a new source contract.
Both manifest alternatives now contain the two actual ordered inputs. The sole factory compares
admitted exact projection identities before the shared reader normalizes payload origins or
arithmetic returns below-threshold silence. Mixed pairs abstain unequal_instrument; both valid
same-origin paths, arithmetic, thresholds and typed mate handling remain. `[V]` evidence-catalog.ts;
evidence-factories.ts grade factory; rfc/move-quality-grades.md §§2/5; [[D3860]].

All26 new permanent controls fail on predecessor7cb81f15, with127 existing focused cases passing.
After repair176 cases across six files pass, including the catalogue and both current consumers.
The focused target now includes the catalogue explicitly. Workspace typecheck then locates a
test-only array/tuple inference error; the literal tuple is corrected without weakening checks.
Final type/full verification is recorded in the exploration log. Disposable source replay now
retains12 valid outputs and refuses12 mixed pairs across both movers/three contexts, with two
declared and actual inputs. Existing module/source and14 retirement controls still pass. `[V]`
grade.test.ts; evidence-catalog.test.ts; make move-grade-consumer-check;
make inspector-recorded-prefix-research; module-source.ts.

Independent read-only diff review finds no narrow concern and runs no tests. This fix does not
make live-labelled historical packets modern provider deliveries, add actual edge/context/grant
authority, register the failed provider leaf or make complete Nudge/Review execution compile.
D3859 and the full current source/adapter image remain open. Canonical semantic receipt refresh
retains343 passing cases/81 subjects/zero fully qualified; metadata changes are not new detector
qualification or public capability versions. `[V]` dated independent review; normal semantic
validation update; source/compiler boundaries cited above.

### Review already has a genuine modern delivery origin

D3859's future grade source need not wait for every queued Stockfish migration. The existing
reviewDeliveryEvidencePayload persists the actual stockfish.position_evaluation@1 delivery;
reviewDurableEngineStates reconstructs it with parsePersistedProviderDelivery, exact node FEN
and the registered whole-source factory. pointOf constructs genuine eval-point evidence from
that source and recorded position. This is already implemented independently of the pending
queued-job resolver, not permission to promote an old scalar packet. `[V]` review-evidence.ts
pointOf/durable engine states/payload builder; evidence-factories.ts eval_point; [[D3859]].

Independent read-only tracing confirms this and narrows its earlier queued-source recommendation.
The existing map does not retain the attachment ordinal, and its selection prefers delivered
evidence over later legacy/unrecoverable rows, not simply the latest attachment. Exact granted
parent/child occurrence/head/source-selection joins still need a contract. Eval points have
declared_convention/measured/reported authority; they cannot silently satisfy the old bounded-
search grade declaration. Current Review grades still read scalars, so modern storage alone is
not grade adoption. The queued-job resolver remains a distinct source origin where actually
needed. No tests, edits or new source acceptance by the reviewer. `[V]` dated independent review;
cited current runtime functions; grade-reading.ts; review-map.ts.

### Source-owned current grades and independent selection/accuracy return — 2026-10-15

The existing modern Review delivery path replays six parent/child pairs across both movers and
depth/time/nodes, using explicitly synthetic UCI scores. Actual serialization/reload and registered
position/eval-point factories admit them. Eighteen engine-version/generation/bound changes refuse
comparability; later scalar reports do not replace the current delivered point. Both node-bound
pairs abstain in the old grade because its scalar instrument cannot represent nodes: D3861.
Original parsed engine manifests already retain profile and requested depth/time budget, so the
offline branch need not invent another collector or use reached depth as its request. `[V]`
tools/d3792-inspector-demand/grade-source.ts; review-evidence.ts; review-points.ts; sourcing/types.ts;
ledger-validation.ts; grade-reading.ts.

Proposed grade §2a/F2 §2.3l now bind two actual same-origin points/readings and their recorded edge
through an owner-issued private source, derived mover/workflow context and exact source selection.
Modern delivery and offline reports retain their distinct instrument authority. Depth/time/nodes
remain typed, constants unchanged; current Review grade/accuracy/graph migrate together. Two
literal alternatives compile in an isolated candidate declaration under unchanged F1, not through
a production grade@2 factory or source issuer.17 conditional retirement controls now measure
Nudge52/Review72/Inspector65 plus six Inspector details: Review drops duplicate scalar eval/WDL
refs while retaining real eval/WDL points and all sequence families. `[V]` cited draft sections;
grade-source.ts; module-source.ts; [[D3851]]/[[D3859]].

Independent read-only review returns two concrete authoring defects. Selecting an eligible pair
per edge can give shared node B two reports (A=X-only, B=Y then X, C=Y-only); pair-only source
results also lose valid individual graph points. The correction fixes source choice per node,
retains both endpoint states independently and never searches another reading to rescue a pair.
Second, source-comparable mate readings may still abstain mate_score_inconsistent; accuracy must
require arithmetic admission, while available below-threshold silence counts. Existing typed-mate
moverWinPercent conversion remains.11 additional controls cover this model and actual pure grade
behavior. The first run had a fixture asserting kind:abstained instead of the actual abstained:true;
correcting that expectation leaves runtime untouched. Final normal prefix target passes71 grade-
source controls,17 retirement controls and all previous controls. Zero real engine measurements,
new issuers, production changes or source qualifications. `[V]` cited disposable target; grade.ts;
grade-reading.ts; review-map.ts; dated independent review record.

Bounded re-review finds both corrections consistent and no additional blocker, not joint acceptance.
The existing value input arm can use the private nominal owner predicate/reader, but mint authority
must explicitly expand the actual retained source image: current authorityShape collapses raw runs
to counts and sealed inputs to payload digests. The draft pins exact head/branch/edge/position,
endpoint selection/states/ordinals/instrument/context and input identities in the existing receipt;
no new repository hash/freshness system. Full current module bindings, scoped Review adapters,
Nudge windows and actual issuer/API/native proof remain open. `[V]` evidence-factories.ts authorityShape;
F2 §2.3l; dated independent review; [[D3841]]/[[D3859]].

### Actual Nudge actors and exact scoped Review source plan — 2026-10-15

The earlier legal arithmetic fixtures use commitMove for every ply, which labels all their
nodes user. They do not by themselves prove Post-commit Nudge's actor eligibility. An additional
disposable probe builds36 real user/opponent-labelled paths over the nine currently accepted
sequence families and both learner colours, using genuine appendOpponentPly events with labelled
synthetic choices.64 actual learner endpoints produce18 witness items covering all nine families
for both learner colours.46 earlier endpoints exclude later completed witnesses. The actual
current one-edge helper emits zero sequence items at these endpoints. This is source feasibility,
not a provider result, automatic-opponent integration or module/UI adoption. `[V]` window-source.ts;
runtime.ts appendOpponentPly; module-query.ts subjectFor; postcommit-nudge.ts; normal prefix target.

The proposed §4.5b keeps the actual user commit before automatic reply and grants only recorded
past windows ending there. It does not reassign a motif completed by the opponent to an earlier
learner move. It specifies exact nine-family horizons, ancestor-specific sources, no caller
narrative/window override, source-state mappings and unchanged presentation/budgets. Independent
read-only review finds those horizons/actor-boundary statements match actual code, not issuance
or acceptance. `[V]` module-registration.md §§2.5.2/4.5b; dated independent review; [[D3859]].

Review §4.5's scoped Story source now has an explicit twelve-row plan:10 node-grain and two
incoming-edge adapters, including the previously omitted position population and all three
pivotal successor refs. It uses existing adapter authority, exact operation/parser/slot/state
joins, the compiler's windowNodes:1 image and private boundary authority distinct from slot IDs.
45 metadata/model controls compare the six root/interior/full plans against existing actual
slot metadata and reject missing position, old pivotal refs, extra WDL, grain changes and missing/
duplicate slots. No new scoped source is acquired by this model. An initial missing test-only
play import fails typecheck and is corrected without a runtime change. `[V]` recorded-origin.ts;
review-evidence.ts reviewPacketSourcePlan; review-evidence-compiler.md §4.5; normal prefix target.

Independent review returns one closed-state omission: a recorded human selection missing its
candidate array cannot become honest-empty merely because no marker emits. The draft now maps
that source to unavailable/input_abstained, distinguishes actual empty arrays/nonmatches, retains
each original selection disposition and refuses corruption. Mixed present/missing at one node
keeps that slot unavailable without erasing other nodes/adapters. Bounded re-review finds no
remaining blocker, not source/joint acceptance. Full current module bindings and real source/
factory/HTTP/native proof remain. `[V]` F2 §2.3a; ReviewAdapterState; dated independent review.

### Retire the unused raw-string Nudge pipeline — D3862

No in-repo production client calls ApiClient.nudge. Actual web seats use modules/query and its
registered presentation; the old GET nudge route/service/runtime packet maintains a second raw
projection-ID sentence renderer and decoder. Under D3851 and the accepted single-query contract,
remove that precursor chain and client parser, retaining postcommitEdgeEvidence/hasKingZoneWitness
and the canonical query/subject/role/disclosure/budget/ancestor behavior. Useful regression
coverage moves to actual typed HTTP receipts, no raw-ID captions, auth/foreign/root/opponent/
unknown subjects, read-only/rating-inert reads and removed-route404. No stored data or detector
family is removed. `[V]` ApiClient; DrillScreen.svelte module-query flow; rest.ts; service.ts;
module-query.ts; postcommit-nudge.ts; apps/server/src/review-map.test.ts; [[D3862]].

Independent read-only diff review finds only that intended obsolete chain removed and no
remaining executable references; it runs no tests. The initial normal focused target has98
runtime passes but all77 HTTP cases hit localhost listen EPERM. Initial normal typecheck is
also blocked by package-manager lockfile write permission. These are retained environment
failures, not product/CI passes. Full normal make verify build is then requested with actual
listener/cache/engine permission; terminal result is recorded in the exploration log. `[V]`
current task command results; dated independent review. New source amendments remain unaccepted.

## D1422 — one ruled ladder, not a source-dependent grading policy (2026-10-15)

D1422 already fixes the current product ladder at2.5/10/15 Win%-points; the current runtime
still uses report5/10/15 and practice2.5/6/14. The source-grade proposal had copied that old
convention@1/context payload into its future@2. Authoring now separates the source change from
the owner-ruled convention change: `rfc/move-quality-grades.md` §4a, its coordinated §2a/F2
§2.3l/module clause and the semantic member claim specify one current convention@2. Private
workflow/source/permission metadata remains context-specific; the proposed public grade payload
and full deterministic sentence do not carry context. Historical meaning@1 is retained, not
another executable pipeline. `[V]` `design/BACKLOG.md` D1422/D3851;
`packages/runtime/src/grade.ts` GRADE_CONVENTION/classFromThresholds;
the cited draft sections (unaccepted, not current behavior).

The unchanged normal `make inspector-recorded-prefix-research` passes28 additional disposable
numerical controls:12 inclusive below/at/above/threshold checks, six integer-cp examples, one
input-clamp example and nine checks over three actual predecessor/model disagreements. The
predecessor is silent for review0→-28, calls drill0→-66 a mistake and drill0→-157 a blunder;
the ruled numerical model gives inaccuracy/inaccuracy/mistake. The existing71 source-feasibility
controls remain separate and retain shipped@1 arithmetic. `[V]`
`tools/d3792-inspector-demand/grade-source.ts` runUnifiedLadderModel/runGradeSourceResearch;
normal target output in this pass. Synthetic scores, zero measured engine quality.

This does not establish grade@2 source issuance, registration, complete payload/renderer byte
identity or authenticated cross-workflow delivery. Criterion4 explicitly requires those actual
positives, retaining permissions/selection rather than relaxing them to make a test pass.
Independent bounded review and full current source/module joint review still precede adoption;
D1422 remains doing. `[V]` cited amendment acceptance boundary and `planning/work-state.json`.

The independent return catches a concrete closure seam: adding a literal convention@2 to the
same-base grade@2 also carries convention@1 from the predecessor's witnessed meaning. Three
actual existing closure controls reproduce the dual-ref result and retain unchanged historical
closure. The amendment now specifies the exact direct-witness replacement and reviewed_text
disclosure; bounded re-review finds no further blocker, not joint acceptance. `[V]`
`tools/d3792-inspector-demand/grade-source.ts` closure diagnostic;
`packages/runtime/src/evidence-convention-closure.ts` deriveProjectionConventionTable;
`planning/learner-modules/inspector-source-independent-review-2026-10-15.md` D1422 section.

## Complete current module image and joint source return — D3863–D3867 (2026-10-15)

The earlier four-consumer migration missed Compare Coach. The actual catalogue has ten
evidence-consuming modules with23/3/7/52/7/4/35/8/85/75 accepted refs, totaling299. The proposed
single-current image conditionally preserves every family at23/3/7/52/7/4/35/8/72/71, totaling282
after duplicate retirement and six Inspector details.38 disposable controls check exact rows,
versions/callables and malformed image mutations. Compare's baseline complete execution refuses
live.stockfish.eval@1; an isolated genuine point+position trajectory declaration compiles two
literal alternatives under unchanged F1. Neither result supplies new source issuers or bindings.
`[V]` tools/d3792-inspector-demand/module-source.ts runWholeCurrentModuleInventory;
normal make inspector-recorded-prefix-research; EVIDENCE_MODULE_IDS/MODULE_CONSUMER_ACCEPTS.

The unaccepted module contract now specifies a sole current registry/callable/adapter recipe,
strict receivers and actual Compare peer selection, not frozen compiler1/2 compatibility helpers.
Compare's proposed trajectory uses genuine source-owned per-node modern/ledger points and
includes a root/fork without inventing a move. It shares only private endpoint selection with
grade. Its piece-route source carries the complete original recorded node/event path, including
zero-edge paths; it is not an opaque witness digest or a fabricated singleton move. These are
authored proposals, not current behavior. `[V]` rfc/module-registration.md D3841 closure;
rfc/evidence-value-authority.md §2.3a; rfc/evidence-presentation.md comparison companion.

Independent joint review returns four concrete blockers: actual piece-route factory has zero
sealed inputs against a declared move (D3864); trade factories retain four inputs against two
declared (D3865); Hint/candidate still use wrong promotion/material sources (D3866); and defender
exposure retains all positive captures against a fixed two-input declaration (D3867). The last
is executed, not only read: legal FEN r3k3/1B6/1n6/2B5/8/8/8/R3K3 w - - 0 1 with c5b6 yields
two positive captures and three sealed inputs; six falsifier controls pass. The282-pair candidate
therefore remains returned, not an accepted final version/ref image. `[V]` cited independent
review; module-source.ts runExposureWitnessDiagnostic; evidence-factories.ts and catalogue.

D3864's bounded raw-path review catches nonexistent RunCreatedEvent/run.created spellings.
The proposal now names actual RunStartedEvent/run.started.data.rootNode; bounded re-review
clears that correction, not implementation or joint acceptance. D3865's already accepted repair
declares C,C,M,M / C,C,E,E and matches repeated refs and receipt digests in order. Real narrative/
recorded-factory assertions fail on predecessor declarations (two failed/153 passed), then the
correct declaration exposes the old event compiler's set deduplication (32 failed/123 passed).
After the occurrence fix,155 focused cases pass; a standalone narrative regression is then
separated from the unchanged captured assertion. Later full-gate outcomes belong to the log.
Unique-ref variable population semantics remain separate source debt, not silently qualified by
this repair. `[V]` make recorded-semantic-path-check; semantic-evidence.ts compileSemanticEvidenceEvent;
evidence-catalog.ts trade declaration; the two permanent runtime test suites; dated review.

D3866's coordinated author correction now covers all four actual candidate slots (fork,
promotion, material signature and material event), with complete F2 source operands and
original retained values. Hint adds the promotion horizon and five current rung@2 refs beside
fork's five; five other families/25 refs remain@1,35 total. One current matrix owns selection,
factory, parser, disclosure and wire identities; no frozen compiler1 API. Independent bounded
review finds no further buildability blocker, runs no tests and does not accept implementation.
`[V]` shared-candidate-evidence-packet §3.1a; hint-distance §3a; module current-image clause;
dated independent D3866 re-review.

The normal prefix target passes39 current-image controls plus ten active-path diagnostic
controls: actual candidateChildReadings still emits the two old sources with zero source
digests; actual localSemanticEvents still emits material asymmetry@1, and Hint's live matrix
still names the old promotion source/compiler1. These passing falsifiers establish the bug
remains in production, not that the amended source pipeline works. D3867 remains the open
joint authoring return; full current refs/versions must be refreshed after it is resolved.
`[V]` module-source.ts runCurrentPacketSourceDiagnostic/runWholeCurrentModuleInventory;
normal make inspector-recorded-prefix-research. Production stays frozen on the verified trade fix.

Seven further D3867 controls replay a Black two-capture counterpart, a White one-capture
case and a White no-capture case through actual legal recorded moves and localSemanticEvents.
The positives retain control followed by every exchange in exact receipt order; the negative
emits no fabricated exposure. This bounds the next source-contract work with both colors and
0/1/2 witnesses, not a claim about maximum arity, complete tactical qualification or a new
reduction/source implementation. `[V]` module-source.ts runExposureWitnessDiagnostic;
normal prefix target, cases black-two/white-one/white-none.

### Defender-exposure complete source and lost availability — D3867/D3868

Two legal checking edges expose a separate current defect. White c5b6 from
`r2k4/1B6/1n6/2B5/8/8/8/R3K3 w - - 0 1` and Black f4g3 from
`3k3r/8/8/8/5b2/6N1/6b1/4K2R b - - 0 1` both reach the helper's
invalid_turn_clone. The actual factory returns empty, local closure publishes no exposure
abstention and the actual wide candidate row loses it too.18 controls distinguish those two
unavailable cases from a genuine available empty. Accepted breadth-collectors §3.5 explicitly
requires this abstention and denominator exclusion; the experiment does not implement them.
`[V]` semantic-evidence.ts defenderExposureOperands/localSemanticEventClosure;
evidence-factories.ts createDerivedTacticDefenderExposureV1Evidence;
module-source.ts runExposureAbsenceDiagnostic; normal prefix target.

The bounded simpler source recipe computes all legal captures on a specified landing square
from raw FEN. Actual legalCaptureMovesTo sorts UCI and includes four promotion choices;
legalExchangeForMove supplies each complete branch/line/stop result. Four both-color cases
with2/2/5/5 captures preserve the exact existing positive exposure payloads. Separate negative
and empty cases retain nonpositive results/context; en passant retains d6 as landing and d5 as
physical captured square.26 calculation controls plus five isolated unchanged-F1 metadata
controls pass; no new source issuer/factory/adoption follows. The proposed reading is
declared_convention/convention/not_applicable, with existing legal-exchange@1 semantics;
the derived exposure has actual fixed [control,completeReading] authority. This is internal
direct arithmetic, not a fifth generic reduction or a manufactured singleton witness.
`[V]` exchange.ts legalCaptureMovesTo/legalExchangeForMove;
module-source.ts runLandingCaptureSourceRecipe; F2 §2.3m authored proposal.

Independent review catches a wrong scope assumption in the first author revision: exposure
is currently accepted **only by Threat**, not Nudge/Review/Inspector. Adding it to Inspector's
31 replacements makes the existing recorded-origin map test fail on an unknown old topic.
The corrected proposal retains that31/44 map, rebases only Threat's actual exposure slot and
updates the shared candidate source/abstention. All-module proposed count stays282; Threat
joins the other five changed consumers@2, four unaffected consumers remain@1. An explicit
actual-catalogue control now forbids phantom exposure consumers. Independent complete joint
acceptance remains owed. `[V]` evidence-catalog.ts MODULE_POSTCOMMIT_EVENTS/current accepted
lists; independent dated review; module-source.ts runWholeCurrentModuleInventory;
recorded-origin.ts checkMap; module-registration current-image clause.

Final independent review clears the Threat-only/selector corrections and the two stale
presentation/opening companions, then accepts the complete coordinated source/module
implementation contract. The first production component is the internal landing-capture
reading: genuine catalogue/closed computed factory/central route, no direct learner binding.
Its25 permanent cases first yield20 predecessor failures, then all pass with99 focused cases.
They check complete enumeration against independent all-destination traversal while reusing
legal-exchange arithmetic; they are not independent arithmetic/tactical qualification.
Source/full-tree/empty-context/convention/input-receipt tests and the factory profile retain
actual values. Exposure@2, actual availability propagation and public current consumer cutover
remain unfinished. `[V]` landing-captures.test.ts; evidence-factories.ts;
evidence-catalog.ts; normal make evidence-value-profile-update/evidence-value-authority;
dated independent final review; owner RFC acceptance notes.

## Whole Inspector readings without drawable witnesses — D3984 (2026-11-02)

The actual65-topic supplier inventory is not itself a complete presentation contract. The
prospective source-adapter audit executes28 local/six dependent/ten recorded-window families
through genuine factories and strict component parsing. At discovery, before D3984 implementation,
its116 tests passed only after the test fixture explicitly separated positive witness construction
from empty constructor refusal.
The old fixture's twelve-value cap can fill with empties before a positive FEN. Neither test
selection nor a larger fixture cap repairs the production source-page boundary. `[V]`
`packages/runtime/src/presentation-inspector-source.test.ts`;
`packages/runtime/src/testing/inspector-presentation-fixture.ts`; ordinary
`make test-software-files TEST_FILES='packages/runtime/src/presentation-inspector-source.test.ts'`.

Seventeen exact whole-reading families have the gap: loose pieces, rays, seventh-rank rooks,
trapping, back-rank state, discovered latency, pass-threats, mate-in-one, space, pawn connectivity,
development, promotion pressure, legal moves, piece destinations, pawn contacts, candidate
majorities and defender duties. Eight are square-set-only, six relation-plus-statement and three
statement-only in the prospective table. Current geometry rejects empty sets/relations; several
fixed templates require a first witness or render an empty string. Sources still retain their
genuine whole-reading occurrence. `[V]` `presentation-inspector-adapters.ts`'s named17 families
and literal Full2 table; `presentation-play-adapters.ts` threat/mate/loose/back-rank schemas;
same116-case audit, including explicit empty refusals.

An empty relation population is not necessarily an empty source. PawnContactsReading contains
contacts, locks, per-pawn passed state and connected-passed pairs independently. Trapping and
pass-threat readings carry distinct in-check abstention variants; piece destinations retain
per-color invalid-turn-clone availability. BackRankReading's `on_back_rank` mode can put the
heavy piece exactly on fileTarget; relation construction rightly refuses a zero-length arrow,
but the positive observation remains. The old caption's unconditional “can reach” also fails
to distinguish already occupying that square. None establishes whole-position safety. `[V]`
`pawn-dynamics.ts` PawnContactsReading; `tactics.ts` TrappedPieceReading/ThreatResult/
BackRankReading; `mobility.ts` ColorPieceDestinations; `presentation-inspector-adapters.ts`
relation, contacts, backRank; `presentation-play-adapters.ts` play.back_rank@1.

Independent accepted-contract review finds no licensed fallback. The source collection/ordinal
must survive; `no_witness` cannot represent an existing reading, `deferred` requires an actual
budget excess, and the six D3802 detail projections cannot masquerade as the original source.
An unowned abstention question likewise cannot replace an evidence-owned component. `[V]`
`rfc/module-registration.md` §4.11a source-order delivery and closed outcomes;
`rfc/evidence-presentation.md` D3802 component composition;
`planning/learner-modules/compiler2-independent-review-2026-11-02.md`, D3984 independent return.

Recommendation: author finite Full2 whole-reading statement/optional-geometry cases, with
actual unavailable state and exact source retention, then independently review before code.
Preserve the17 source refs, all original occurrences, unchanged budgets and ordinary-module
selection. This is rendering/representation repair, not a new collector, relevance heuristic,
safe-move judgement or evidence version. `[M]` author recommendation derived from the bounded
observations above; the companion amendment must make its exact grammar and falsifiers binding.

Follow-through: the finite D3984 amendment was independently accepted before implementation.
All17 actual empty-reading controls first failed, then pass with source-owned text and optional
original geometry; the116-case audit now constructs empty as well as positive readings rather
than expecting empty refusal. Independent review first exposes four rewrite defects (missing
destination convention, two mirrored piece-identity losses and crossed exact source), then
passes423 cases/ten files plus workspace types after their repair. The30-case adversarial file
includes13 original-geometry comparisons and both-color current promotion controls. These are
bounded rendering results, not complete source-page/API/UI or whole D3984 completion. `[V]`
`packages/runtime/src/inspector-whole-reading-presentation.test.ts`;
`packages/runtime/src/inspector-whole-reading-independent.test.ts`;
`planning/learner-modules/compiler2-independent-review-2026-11-02.md`;
`rfc/module-registration.md` §4.11b; `rfc/evidence-presentation.md` D3984 companion.

## Complete recorded-window Nudge captions — D3982 (2026-11-03)

The genuine factory→current Nudge2→registered adapter→atomic fit census covers all eight
multi-ply families: harassment, deflection, attraction, line-blocker clearance, square clearance,
interference, check-zwischenzug and overload exploitation. Both colors and attraction's three-
and five-ply horizons yield18 cells. Every source emits one genuine value and the current
square_set/move_path pair; every complete pair is dropped for exceeding the unchanged one-arrow
ceiling. This is not missing collector output or evidence for increasing budgets. `[V]`
`packages/runtime/src/inspector-occurrence-budget.test.ts`, D3982 census;
`make test-software-files TEST_FILES='packages/runtime/src/inspector-occurrence-budget.test.ts'`
passes10 cases/one file1.27s (session80459).

Separately costed original square-set members retain their complete registered caption and
all its typed operands. All18 fit one fact, at most50 words/two marks and zero arrows. This is
representation feasibility, not authorization to crop the existing registered composition after
rendering. Fixtures own real legal windows but commit all moves as user: they do not prove the
actual learner/opponent post-commit subject, novelty, HTTP or mounted delivery. Long variable
zwischenzug expected-move lists still face the ordinary whole-fact word backstop. `[V]` same
census; `testing/recorded-sequence-window-fixture.ts`; `presentation-inspector-adapters.ts`
sequence builders; `module-policy.ts` Nudge budgets.

The bounded proposal is an explicit Nudge-only no-arrow binding for exactly those eight pairs,
constructed as one complete original square_set and caption. Review/Inspector retain the full
recorded paths. Sources, anchors, exact ownership, selection/reducers and fixed budgets do not
change. It requires independent acceptance of the existing module/presentation contract amendment
and actual actor-labelled delivery controls before implementation/completion. `[M]` proposal
derived from the measured cells above, not a broader usefulness or detector-qualification claim.

Actual actor-labelled delivery follow-through exposes a second boundary, D4058. Real cookie
authentication, SQLite storage, RunService and production module REST queries cover the same18
completed windows with the final mover explicitly made the learner. Every original sequence
value reaches the actual reducer; zero of18 reaches the selected Nudge receipt. Harassment's
selected facts are genuine occupied_attack/slider_ray changes, not fabricated empty evidence.
Earlier learner prefixes do not borrow the later motif, opponent nodes refuse and the stored
run stays byte-identical. `[V]` `apps/server/src/recorded-review-delivery.test.ts`, D3982 group;
normal focused five-file Make run10367 passes1466 cases8.92s (the occurrence-budget,
presentation-inspector-adapters, module-query, recorded-review-delivery and web module-query-response
suites). This is an actual selection census, not delivered sequence UX.

The existing order places exactness before lift/family precedence, then reducers and the two-fact
backstop. Current sequence exactness cannot win those slots merely because its registered caption
now fits. Independent authority inspection confirms current code follows learner-modules §3;
D3715's unaccepted change-witness filter is not sequence priority authority, and D3767 names
analogous grade starvation. The new representation is independently accepted; useful Nudge
selection still requires its own bounded contract, not false closure or an implementation-only
priority change. `[V]` `packages/runtime/src/module-reducers.ts` orderAdmittedFacts/
reduceModulePacket; `rfc/learner-modules.md` §3/3a; `rfc/module-registration.md` §4.5a–c;
`planning/learner-modules/compiler2-independent-review-2026-11-02.md`, D4058 authority inspection.

The independently accepted finite completed-window priority improves the original REST census
from0/18 to16/18. Both overload cases now compete with a genuine deflection over the same legal
three-move example. The existing family order selects deflection first. A follow-up packet
diagnostic (60606) corrects the initial unverified word-budget explanation: critical last_of_role
takes the first slot, leaving one completed-window slot at the fact backstop before presentation.
The missing window is not listed as a presentation word deferral. This is no reason to raise budgets or
drop words. Overload's collector does not require the second duty be lost after relocation,
whereas deflection does; a universal overload→deflection subsumption is therefore unsupported.
`[V]` normal four-file run76789:131pass/2failed8.25s; actual selected-route diff and unchanged
word fitter; `semantic-evidence.ts` overloadExploitationObservedOperands and
recordedDeflectionObservedOperands; independent D4058 coexistence review in the same receipt.

## Recorded move paths still cannot step their board — D3979 (2026-11-03)

The accepted presentation contract says move_path is a numbered list that steps the board,
optionally painting one arrow per ply. The actual Svelte component renders only SAN list items
and convention attribution. It has no selection callback/board, and PresentedEvidence passes
only the component and its sentence. This remains a real delivery gap after arrow-cost and
Nudge repairs; neither a correct arrow budget nor complete prose implements stepping. `[V]`
`rfc/evidence-presentation.md` §3.6; `apps/web/src/lib/evidence/components/MovePathView.svelte`;
`apps/web/src/lib/evidence/PresentedEvidence.svelte`; independent current-duty review in
`planning/learner-modules/compiler2-independent-review-2026-11-02.md`.

The original Inspector-family line constructor receives each retained move's FEN and UCI, uses
them for ply/SAN, then serializes only ply/SAN/UCI. The closed MovePathOperand/parser retains
no starting FEN or exact run/branch/node navigation context. Its current board-line population
is33 full paths after D3982's8 Nudge singleton changes; original source/caption footprints still
cover all41 pairs. A ply number or repeated UCI does not identify one saved branch position.
Recovering navigation by consulting today's active cursor would silently reinterpret inherited,
Compare or historical paths. `[V]` `presentation-inspector-adapters.ts` line/squaresLine/sequence;
`presentation-contract.ts` MovePathOperand/parseMovePath; `presentation-inspector-adapters.test.ts`
complete41-footprint/33-path census (focused32174 passes1804/nine); `branch-path.ts` inherited paths.

Next author a bounded source-retained path/preview scope amendment, not a new collector. It
must specify which exact original position data crosses the component boundary, construction
and received correspondence, and whether selecting a ply is a read-only local preview or an
explicit saved-run action. Original source/disclosure/answer ceilings and retired-view ownership
must survive; do not guess positions from SAN, paint future arrows on today's board or change
the Play cursor as a side effect of inspecting evidence. Actual current callers, keyboard/focus,
same-run/branch/report retirement and returned board-input/viewport controls are then required.
This is a recommendation, not accepted UI/data authority; old parent duties cannot be closed by
adding a click handler without this missing contract. `[M]` bounded proposal from the observed
wire/surface gap; independent next-duty review concurs that contract correction precedes code.

Follow-through: independent current-constructor review accepts evidence-presentation §3.6b's
bounded start-FEN/full-replay/read-only preview contract, with castling normalization preserving
original UCI and exact sealed-item lifetime. It is accepted next work, not implemented/native
delivery or parent completion. `[V]` that clause and the existing compiler2 independent receipt.

**2026-11-04 implementation follow-through:** the original missing-start witness fails on all33
actual current path pairs, then registered construction retains startFen and checks complete
original FEN/UCI replay. The strict receiver and read-only local preview now use the same rules;
the genuine source/caller cohort passes1613/seven9.43s. Actual SQLite/service→JSON→strict
Review/Inspector callers and authenticated REST retain complete original positions, both colors
and inherited paths without saved writes. Repeated board positions have separate complete-FEN
steps in runtime controls; this is not yet a complete actual-caller repeated-path/native cohort.
`[V]` `packages/runtime/src/presentation-move-path.test.ts`,
`packages/runtime/src/presentation-inspector-adapters.test.ts`,
`apps/server/src/recorded-review-delivery.test.ts`,
`apps/web/src/lib/evidence/move-path-callers.test.ts`; normal targeted20497 output.

Independent review finds and accepts the bounded D4059 exact-handler/Close-focus correction.
Actual captured Svelte callbacks are invoked with their connected original controls, including
same-byte replacement and same-owner reopen; detached clicks alone are not a valid falsifier.
Final targeted19/three3.95s also checks the shared browser/main export. The first full software
run reports13460pass/one missing-export failure, not a passing run; correct the omitted export
and repeat complete gates. Native/default-content/qualification and D3979 remain open. `[V]`
`apps/web/src/lib/evidence/move-path.test.ts`, `packages/runtime/src/client.test.ts`, focused47040
and failed full25804 output; existing compiler2 independent review receipt.

## Nudge change selection and distinct Inspector reading/event coverage — D3715/D4060 (2026-11-04)

The current canonical Nudge admits unchanged island states and open-file observations at both
current-subject and ancestor admission, not only on the visible card. Corrected predecessor
controls reproduce five failures/two passes; the first attempt also contained a separate terminal
bare-kings fixture error. A Nudge-local complete-value comparison repairs this without changing
shared postcommitEdgeEvidence, generic witnessedEvidence, any collector, ordering or budget.
All four original legal-move cohorts retain complete source populations, genuine gained/lost
and equal-magnitude changed observations, and d2–f3's real lost king defender. `[V]`
`packages/runtime/src/postcommit-change-witness.test.ts`, normal32687/75929 output;
`postcommit-nudge.ts`, `module-query.ts` current/ancestor assembly; accepted module-registration §4.5a.

The original criterion incorrectly presumed Inspector exposes those exact structural/island
event types. Full Inspector2's closed source topics instead include pawn-connectivity position
readings; position-structure2 and move-transition1 consume different reading families. An actual
reading is not an event receipt. Independent review accepts a bounded preservation clarification:
exact original events remain in factories and Review, while Inspector retains its own complete
original readings. D4060 keeps exact event-query coverage/source-contract reconciliation open
for full1.0; it is not waived or discharged by comparing reading types. `[V]`
`inspector-source-topics.ts`, `reading-evidence.ts`, `review-map.ts` collectRelations;
module-registration §4.5a criterion4 and the existing compiler2 independent D4060 review.

Real storage/service/REST and strict receivers exercise current and ancestor admission, grade
unavailability and preserved saved bytes. The strengthened Review control compares every original
event identity/multiplicity from all nine exact original factories at every selected path edge,
against whole-branch admission and each actual returned row. Its initial stronger version
mistook a whole-branch admission call for one edge; correcting measurement scope, not product
filtering, yields93/three passing cases. Separate mounted actual-service controls preserve
selected text/input/retirement. Two prior seat tests pinned two unchanged counts; current
receipts retain one piece-escape or one loose-piece fact with original Retry/focus semantics,
not a fabricated empty result. `[V]` `apps/server/src/postcommit-change-delivery.test.ts`,
`apps/web/src/lib/screens.test.ts`; normal88316 output. Current inherited-path controls require
the real new branch's feedback reveal, not a disclosure waiver. No source qualification/native
or parent completion follows from this finite source/delivery cohort.

### Original ten-motif Inspector delivery — D3792 (2026-11-04)

The original cohort is the canonical recorded-sequence positives and paired hard negatives,
excluding two-capture trade completion: ten exact@3 families, not a new detector list. Existing
private-supplier tests covered their sources in both colours, but the generic68-topic query
loop did not prove positives reached display; actual browser path coverage reached contact
timing alone. Independent source audit therefore required delivery proof rather than a collector
rewrite. `[V]` `packages/runtime/src/testing/recorded-sequence-fixtures.ts`,
`apps/server/src/inspector-window-source.test.ts`, `apps/server/src/inspector-query.test.ts`,
`apps/web/src/lib/evidence/move-path-callers.test.ts`; compiler2 independent review, D3792 cohort.

The actual Node-worker fixture now optionally registers a learner and sends ordinary JSON through
the cookie-authenticated REST handler, original SQLite/RunService/source-page compiler and strict
browser receiver. It retains its original non-REST callers. Fast test-only password derivation
does not prove production password hashing; this instrument proves session/route authorization.
The original40 cells (ten families × positive/hard-negative × both colours) all reach their
actual selected browser outcome. Every positive retains the original event-digest/component
multiset, complete captions/square chips and source start-FEN/UCI/SAN lines within unchanged
20fact/400word/20mark/8arrow budgets. Hard negatives return genuine no_witness with zero items,
not missing_context, failed or deferred. No automatic provider fetch or saved-play mutation.
`[V]` `apps/web/src/lib/inspector-source-browser.test.ts` and its existing `.test-support.ts`.

Four inherited contact/overload positives retain original creating-branch operands. Two further
journeys select roots and both short prefixes while the later overload witness remains in the
full saved graph; all six demands return missing_context, with no future witness displayed.
Anonymous delivery refuses401 before acquisition. Explicit set equality pins the original ten
families against both canonical populations and the actual recorded-window topic image.
Final61491 normal four-suite run passes168 cases44.28s. Initial6411 stopped20 positive tests at
an unavailable public-barrel test import; corrected52267 passes71 browser cases. Expanded63766
passes165/fails2 because test props replacement removed its query spy; preserving the wrapper
corrects measurement, not source scope. Independent bounded source/oracle review accepts the
corrected cohort. `[V]` same tests, compiler2 independent review and dated exploration log.

Current normal gates pass13532software/all494files355.22s(no skips), unchanged isolated
performance7/four58.46s, clean types/build/4559authority/375semantic. Real content remains
261pass/60fail/18setup-blocked cases43files32.85s at D3928; later corpus recipes are unreached.
`[V]` normal25828/79202 terminal outputs, recorded in the exploration log. This DOM cohort does not prove
native geometry/reload/return, arbitrary motif usefulness, source qualification, D4060 structural
event-query coverage, all D3979 path callers or whole D3792/full1.0 completion. Default/native
startup remains held at D3928. `[V]` current tests and `planning/codex-queue.md`.

### Genuine empty Nudge recovery — D3713 (2026-11-04)

The legal f3d4 edge from `7k/p7/8/8/8/2P1PN2/6P1/K7 w - - 0 1` supplies the missing
genuine empty control. Canonical query first returns an empty receipt with silent behavior;
actual SQLite/RunService authority and module queries confirm it in both colours. Existing
locked-pawn and pawn-free controls remain populated, never relabelled empty. The stronger
service-returned baseline71245 passes279/fails2 of281: successful delayed Retry removes the
quiet row, leaves focus on BODY and produces zero tablet queue heads. No source payload,
receipt, selection rule or disclosure was edited to make this outcome. `[V]`
`apps/web/src/lib/screens.test.ts` D3713 cases, existing Node-worker fixture and exploration log.

The local repair returns to the existing default Support/More state only after the selected
Nudge settles silent-empty. Focus handoff uses the initiating request's actual parsed packet,
current packet identity, live owner/selection, region eligibility and deliberately retained focus.
Independent review finds two further able-to-fail lifecycle cases: an unresolved request retained
its document listener after unmount (11337), and pointer/touch outer-tab navigation without
focusin allowed focus into hidden Support or after leave-and-return (9537). Their corrections
remove listeners immediately on destroy/supersession and fence recovery by actual region/open
identity and navigation generation. This is ephemeral UI lifetime, not a new evidence identity
or persistent setting. `[V]` `ModuleSeats.svelte`, `DrillScreen.svelte`, those source-bound cases
and compiler2 independent review, D3713.

Final67130 passes401 checks/six files35.01s with clean types. Sixteen actual-service cases cover
desktop/tablet/phone, mirrored tablet success, moved focus, newer More selection, unresolved
unmount, outer navigation and leave-return. They retain exact stored bytes, two UI requests,
no mutation callbacks, no provider work and original populated/failure controls. Independent
bounded source/control review accepts; reviewer execution and main execution are distinguished.
Full normal30607 passes13548software/all494files357.68s(no skips), unchanged performance7/four
57.17s, types/build/4559authority/375semantic, then catches D4061 missing from the queue.
Queue-only correction82988 restores complete governance before actual content fails261pass/
60fail/18setup-blocked cases43files32.51s at D3928; later corpus recipes unreached. `[V]` terminal
outputs recorded in the exploration log. Native geometry/default-content/source
qualification/parent/release are not established by this DOM cohort. D4061 separately owns the
unmeasured preset-removal path; it is not quietly discharged by a silent-packet test. `[V]`
same tests, review receipt, `design/BACKLOG.md` D3713/D4061 and exploration log.

### 2026-11-04 — Settled preset removal and Hint action ownership (D4061/D4062)

Preset removal is a distinct path from a settled empty packet: real Nudge/Hint modules can leave
composition while retaining an absent selected head. The ready-only membership repair restores
existing More/Support and preserves available Hint progress through temporary compilation. A
gated real Hint POST then exposes a second issue: dropping a retired reply leaves its operation
alive. Old question-level IDs also let old cancellation target a reopened learner action. `[V]`
`apps/web/src/lib/preset-change.test.ts`, `GuidedHintSeat.svelte`, `DrillScreen.svelte`.

Independently accepted hint-distance§7a separates per-action delivery identity from unchanged
shared-search identity. Real cookie REST/DrillApi/HintService/scheduler/Mock engine controls show
two action IDs sharing one search; old delayed POST/DELETE cleanup leaves the new waiter alive
and it completes. Same-action retransmission joins; invalid keys acquire zero sources. Run-bound
controller clients and original-action admission prevent wrong-run cleanup and invented cleanup
from malformed/refused replies. Final focused504/eight30.31s and bounded independent review pass;
this is mechanical ownership evidence, not chess strength or native layout. `[V]` same test,
`guided-hint.test.ts`, `session-controller.test.ts`, service/lifetime controls and existing
`planning/learner-modules/compiler2-independent-review-2026-11-02.md` receipt.

Native retry86515 builds but cannot start under existing D3928 corpus grade@i1→@i2 mismatch;
no browser/parent/qualification/release clearance follows. Normal repeat42712 passes all13572
software cases/all495files349.95s, isolated performance7/four56.86s, types/build/4559authority/
375semantic and complete governance. Real content remains261pass/60fail/18setup-blocked cases
43files32.20s; later corpus recipes are unreached. The first full census failure and conventional
test-support boundary correction remain recorded in the log and independent review.
`[V]` `planning/exploration/log.md` and the normal Make terminal results recorded there.

### 2026-11-04 — Repeated-position and inherited preview caller proof (D3979)

The same modern saved game reaches identical SAN/UCI/placement at its first and fifth knight
move, with different full FEN counters. Actual cookie REST incoming-edge requests open each
preview from its original parent and step to its original child; captured emitted callbacks
reconnected after endpoint replacement cannot reopen the retired owner. Contact and overload
source pages also step every original frame across main/inherited branches in both colours,
with all HTTP replies200 and unchanged saved cursor/provider work. `[V]`
`apps/web/src/lib/evidence/move-path-callers.test.ts` and its genuine stored-service fixture.

Active Play cross-tab settings are a separate scope: actual Quiet retires an open source preview;
restoring Analyze does not acquire its source until fresh explicit demand. The test uses the
supported storage event while the modal makes its background menu inert, and checks visible
preset labels, real server authority, old callback rejection and unchanged stored play. Final
75398 passes35/three8.27s;70770 types are clean and independent bounded review accepts. `[V]`
`preset-change.test.ts`, existing compiler2 review and exploration log. Product source is
unchanged since the13572-case full run; that full pool predates these added tests. Actual
historical target/run/branch/health/access and native/default-startup duties remain open.

### 2026-11-04 — Genuine historical notifications and the run-switch failure (D4063)

Historical target/branch/run/provider-health/access×both learner sides now uses actual SQLite,
registered cookie sessions and the original server confirmation/source paths. A second principal
receives a real owner-issued host grant; revocation returns404 before source collection and
confirmation fails until the owner restores it. A real Explorer descriptor receives injected
HTTP401, settling its original ProviderRegistry snapshot; local math can be explicitly confirmed
again independently of that failed provider. `[V]` `inspector-source-browser.test-support.ts` and
`evidence/move-path-callers.test.ts`, actual service/registry methods rather than fabricated props.

Genuine run replacement fails in both colours before repair: the old selected branch is rendered
against the replacement run before the reset effect executes, raising UNKNOWN_BRANCH and leaving
the old modal. Guarding selected-branch membership before calling canonical branchPath fixes the
transient state without catching or weakening canonical graph errors.587/nine57.49s, clean types
and independent bounded review pass; full13591software/all495files361.80s(no skips), performance
7/four58.97s, types/build/4559authority/375semantic/governance pass. Content remains261pass/60fail/
18setup-blocked cases43files33.93s at D3928. `[V]` `HistoricalInspector.svelte`, cited actual cases,
existing compiler2 review and `planning/exploration/log.md` terminal57005.

This proves retirement when observed notifications reach the component. App forwards fresh
capability/access snapshots through its existing workflows; it does not supply continuous
external-change discovery. No missing binding was found in that source trace, and no polling/SSE
contract is invented. Native/default-App proof remains open under D3979. `[V]` `App.svelte`,
`DrillScreen.svelte`, `run-state.ts`, `session-controller.ts` and the cited independent review.

### 2026-11-04 — D4060 is a twelve-source presentation gap

The full event class is eleven STRUCTURAL_EVENT_FAMILIES plus pawn islands, not only the eight
ordinary structural-card families plus islands. Every original exact route accepts the existing
EvidenceEdge `{ beforeFen, moveUci, afterFen }` and validates its legal edge. None of the twelve
is a current Full Inspector topic/local supplier. `[V]` `evidence-catalog.ts` declarations,
`evidence-factories.ts` structuralEventsForEdge/STRUCTURAL_EVENT_FACTORIES/pawn-islands factory,
`internal/evidence-value-routes.ts`, `inspector-source-topics.ts`, `inspector-local-source.ts`.

The extra three are piece_count, direct_attack_count and line_blockers. Their exclusion in
MODULE_POSTCOMMIT_EVENTS is an ordinary Nudge eligibility decision; it is not an established
ban on explicit Advanced Inspector. Reusing that eligibility or postcommitEdgeEvidence would
silently filter the requested original population. The current eight-family structuralEvent
renderer selects after-or-before and omits count/role, so widening its enum cannot deliver the
complete before/after source. An Inspector-only constructor/closed operand parser/renderer is
needed under an independently accepted amendment; existing normal-card policy must stand. `[V]`
`evidence-catalog.ts` MODULE_POSTCOMMIT_EVENTS, `postcommit-nudge.ts`,
`presentation-inspector-adapters.ts` structuralEvent/STRUCTURAL_FAMILIES and source review.

Non-vacuity is source-specific. piece_count always emits twelve color/role states, including
zero; islands always emits two color counts, including0→0. These cannot honestly be tested as
no-witness on a valid edge. Direct-attack populations retain positive geometric counts on a
non-pawn target, with absence represented by null; line blockers retain ordered ray endpoints
and counts including zero. Optional populations may be absent, while a root has missing incoming
context. Preserve original roles, colors, counts, ordered identities, nulls and unchanged values
through whole-occurrence paging; do not manufacture a common empty predicate. `[V]`
`structure.ts` structuralReading, `semantic-evidence.ts` structuralSubject and
structuralSemanticEventPayloads, `evidence-factories.ts` and cited source-owner code.

This research supports an exact source/query/presentation amendment, not new detector/search,
ranking, ordinary unsolicited noise, pack migration or semantic qualification. No new source
implementation is authorized by this dossier. The current closed68-topic/74-pair image needs
independent contract acceptance before expansion. `[V]` `rfc/module-registration.md` §4.11a/§4.11c,
`rfc/evidence-presentation.md` and `design/BACKLOG.md` D4060; next work stays on the existing row.

### 2026-11-04 — Current grade selection and pinned-report presentation loss (D3767/D4064)

This is a synthetic source/delivery/selection experiment, not chess grading validation or a
natural-game prevalence estimate. Replay `make grade-selection-measurement`: the explicit
research target typechecks the instrument and runs173 tests in two files. Its small
regenerable JSON outputs live only under ignored `.cache/`; ordinary CI/progress checks do not
read or require recordings. The maintained evidence is this bounded result and its executable
instrument, not a new hash/freshness system. `[V]` `Makefile` grade-selection-measurement;
`tools/d1865-evidence-assembly-harness/{grade-presentation.test.ts,grade-source-selection.test.ts,grade-offline-fixture.ts,grade-cases.ts}`;
final24608:173/two4.18s, including explicit actual source-origin/requested-bound assertions.

**Grade alone.** The original recorded-source factory, current Nudge2 admission/reducer,
registered full renderer, strict presentation receipt and whole-bundle fit execute unchanged.
Provider cases use genuine typed synthetic delivery attachments through their existing runtime
source owner. Offline cases use an in-memory current synthetic pack and complete original
ledger/manifest through actual PackRegistry/SQLite/RunService ownership; no existing pack,
sidecar, migration or installed-content requirement is changed. Its immediate_guard policy is
legal, and the workflow comes from deriveWorkflowContext over actual server authority (onramp
for this fixture), not a false delayed-policy reveal or an assumed raw pack context. Both movers,
all three loss arms and all three severity classes execute. Provider requested bounds are depth12,
100ms and2000nodes; offline tested bounds are depth12 and100ms. Engine19/generation1 and the
offline Threads1/Hash16/MultiPV1 profile are synthetic fixture inputs. This does not quantify
other engine/version/profile strings or unsupported inputs. `[V]` cited instrument and original
`recorded-grade-source.ts`, `grade.ts`, `recorded-engine-endpoints.ts`, `presentation-contract.ts`,
`module-query.ts` fitModulePresentation.

| Original source class | Cases | Full grade fits alone | Words | Loss |
|---|---:|---:|---:|---|
| provider_delivery |54|54|42–48|none|
| pinned offline_engine |36|16|47–53|20 whole facts dropped solely at words|

For the pinned source, mate-lost inaccuracy is50 words and fits; its mistake/blunder variants
are52 and fail. Mate-allowed variants are51/53/53 and all fail. The20 failures are eight
mate-lost and twelve mate-allowed cells over the two bounds/two movers. Grade admission and
complete source retention succeed before fit; no rival fact is involved. This is **D4064**, a
representation/budget failure distinct from selection starvation. Priority cannot repair an
oversized standalone fact. This source/format proof is not offline pack HTTP/DOM/native proof
or an assertion that every real pack has such an engine report. `[V]` grade-presentation.test.ts
actual payload origin/bound/arm/class, cost and exact dropped.exceeded checks; grade-offline-fixture.ts.

**Canonical selection.** Eighty original-source strata execute actual SQLite, real cookie
authorization and REST modules/query followed by the strict client. Only the password derivation
is a fast stand-in; credential hardening and live engine/coordinator behavior are not measured.
The nine accepted Nudge windows are derived from actual consumer/acquisition and asserted equal
to the eight POSTCOMMIT_OBSERVED_WINDOW_REFS plus trade_completed@2. Contact timing and defender
consequence are not silently imported from Inspector. Original positive paths, both colors,
four critical event classes, inherited endpoints, a quiet edge, actual repeated-grade ancestors,
and missing-before/missing-after/incomparable/below-threshold cases execute. Observational wrappers
delegate the real source owner and compileModulePacket unchanged. The privately issued selected
source must retain original parent/child/branch. Reconstructed admission/order/dedupe/subsumption/
novelty/backstop and complete presentation/fit equal the actual query result and strict received
items/budget, including identities/multiplicity. Stored run bytes remain unchanged. `[V]`
grade-source-selection.test.ts; `recorded-grade-sources.ts` postcommitSources;
`module-query.ts`, `module-packets.ts`, `module-reducers.ts`; `module-query-response.ts`.

There are60 populated grades: eight reach the client (quiet and repeated-quiet strata), while52
survive through novelty but lose at the two-fact backstop. There is no actual post-selection fit
loss in this provider-backed census. Twenty cases honestly have no grade:12 missing_eval,
four unequal_instrument and four comparable available-empty/below-threshold outcomes. The four
terminal checkmate cases deliberately have no final engine report; this is a missing-report
control, not a theorem that a terminal position can never receive a grade. Novelty abstains in
all60 populated-grade cases, including four whose genuine ancestor already has a grade; do not
claim repeated-grade suppression. Source availability, reducer loss and presentation loss are
separate findings. `[V]` same current instrument; original source/factory outcome and stage checks.

**Fit sensitivity, not an implemented policy.** Offering the current grade and first selected
rival alone to the unchanged fit function requires49–73 words in the52 crowded strata. Both
facts fit in28;24 exceed words in either hypothetical order. Putting the grade first merely
changes which whole fact is deferred there. These explicitly labelled pair-fit rows do not
mutate the real selection. Actual critical/window precedence stays unchanged; hypothetical
orders are not permission to override it, increase budgets or hide source operands. `[V]`
grade-source-selection.test.ts hypotheticalPairFitOnly; current module-query.ts fit function.

Six actual cookie REST/strict-client/mounted Svelte controls corroborate both-color quiet-grade
display and overloaded-window/castling grade nonselection, exact complete sentences/items,
no provider calls, no move/rewind mutation and unchanged stored run. The first UI harness read
the Inspector-only status log instead of the module HTTP log; correcting the instrument yields
17/one6.73s, including11 original controls. Chessground is the existing DOM test stand-in;
this is not geometry/native proof. Final broader shared-fixture cohort41684 passes159/four
47.90s; the independent research gate accepts authoring one joint amendment, with no remedy yet
accepted. The existing compiler2 review receipt records that bounded decision. `[V]` `apps/web/src/lib/preset-change.test.ts`;
`inspector-source-browser.test-support.ts` modulesRest/httpCalls; final54577, workspace typecheck22425.

The evidence now supports a joint representation/selection amendment under D3767/D4064 before
production changes. Source/provider/renderer/protocol/default policy remain unchanged. Current
partial measurements do not close either defect, the module parent, native/default-content
D3928/D3979, grading qualification or release. `[V]` accepted module-registration§4.5a and
evidence-presentation contracts, BACKLOG and existing compiler2 independent review receipt.

### 2026-11-04 — Accepted grade remedy: bounded implementation remeasurement

[V] Following independent joint acceptance in the four current RFC clauses, the same explicit
make grade-selection-measurement instrument now strictly typechecks and passes173/two5.03s.
All90 source-owned grade variants retain complete operands and fit the concise Nudge renderer
at8–11 canonical words; every manual report is available whole and byte-equal to the unchanged
renderMoveQualityGrade/Review report. Literal/spread copies refuse the helper, and full Review
items receive no alternate Nudge disclosure. The full-report check rejects the compact summary.

[V] The same80 original source-owned/cookie REST/strict-client strata now deliver40/60 available
grades, compared with8/60 before. The remaining20 grades lose to completed-window/critical
precedence at the two-fact backstop, with zero actual fit drops. All20 no-grade outcomes remain:
12 missing_eval,4 unequal_instrument,4 genuinely available-empty. Quiet/repeated, e-pawn, trade,
harassment, attraction, square clearance, promotion/castling/last-of-role examples contribute
selected grades; the other five measured window setups legitimately fill the earlier slots.
This is the fixed synthetic-score corpus, not a prevalence, detector-quality or engine-quality
estimate. The original research numbers above remain the before measurement.

[V] Eight actual mounted disclosure controls pin default full-text absence, exact manual report,
Escape/focus, true oversized source status, unmount/region/inactive/packet and retained handler
retirement. An independent source review found same-item close/reopen ABA, and the emitted
Svelte handler test caught its latest-value-wrapper variant. Keyed handlers and per-opening
epochs now pass actual retained Open/Close invocation. The existing six cookie REST/current
DrillScreen controls additionally test local report opening/no work and Quiet retirement;
broader focused software1044/eleven15.70s passes. Full gates/final independent implementation
closeout are still in flight; actual native startup remains separately held D3928. Source:
the two grade research tests, evidence/grade-measurement.test.ts, preset-change.test.ts and
the existing compiler2-independent-review-2026-11-02.md receipt. No chess qualification.

### 2026-11-04 — Bounded grade implementation closeout, distinct from consumer acceptance

[V] Independent compiler2 final review accepts D3767/D4064/D3766's bounded selector/summary/report
implementation. Full normal25264 passes13804 software cases/all497 files in370.27s, zero skips;
7 performance/four56.88s; types/build/4667authority77/375semantic/complete governance pass.
Final3027 current test types report0errors0warnings, and the strict instrument passes173/two3.93s.
The pair instrument now records the actual fitter budget.before with exact2facts, rather than
calling a one-fact bundle cost for two facts; no source/ordering/word measurements changed.

[V] Actual12 cookieREST→strict client→selected DrillScreen reports cover provider/offline origins,
all3arms and both colours, pin actual instrument/arm/full text and no extra HTTP/provider/write/
move effects. Stored append-only repeated edges, inherited branches and different runs retain
equal canonical report text while retiring original controls; actual shared-host grant revoke/
restore plus the observed role update retires them too. This is not automatic external discovery.
Six real grade@2→registered rendered-view→voiceCheck controls now prove exact-summary licensing,
wrong-class/empty-grade refusal, no manual/full-report licence from raw operands, and Review's
own full-report licence. Full checker/complete operands and true overflow negatives remain.

[V] The full gate remains nonzero only at actual content261pass/60fail/18setup-blocked43files
33.82s; later corpus recipes were not reached. Native rebuild succeeds, then actual prepare-start
refuses anti-caro-advance-early-c5.json (missinggrade.move_quality@i:2/obsolete@i:1), zero journeys.
No fixture bypass or content migration was applied. D3928/default-native/D3979, qualification,
parents and release stay open. D3765 independent consumer review retains an exact9-cell current
authenticated drill/Nudge + position Review + imported Review source-parity duty at0→−28/−66/
−157; those checks are not substituted by runtime-only fixtures or by the bounded repair.
Sources: current Make outputs25264/3027, the existing compiler2 review receipt, voice.test.ts,
preset-change.test.ts, presentation-inspector-adapters.test.ts and review-map.test.ts.

### 2026-11-04 — Structure's recognition source is never selectable (D4095)

The accepted current point-source cutover exposes a selector defect that acquisition alone cannot
repair. Actual registered ShapeRegistry→SQLite/RunService→strict receiving queries in both colors
admit a positive current firing3 but select `rules.structural.reading.pawn_connectivity@1` instead.
The ordinary cookie REST→DrillApi→mounted Structure seat retains exactly that selected receipt and
sentence. Theory's separate on-request seat selects and displays the genuine firing3 with its
registered attribution. These are synthetic legal paths, not natural-game prevalence or chess
usefulness measurements. `[V]` `apps/server/src/module-shape-source.test.ts` current+ancestor cases;
`apps/web/src/lib/screens.test.ts` “current point-module cookie REST to mounted seats”; normal
focused189/six and mounted309/one execution logs are local `/tmp` instruments, not required assets.

The cause generalizes beyond those samples. Structure's unchanged source list always constructs
`rules.phase.reading@2`; the current original phase factory yields one convention fact even for
`unclear`. `witnessedEvidence` retains that fact. `orderAdmittedFacts` orders convention before
authored, ahead of declared family precedence, while current firing3 is honestly authored.
Neither fact belongs to a current equivalence/subsumption relation. The novelty filter sees
unregistered phase/shape families, explicitly abstains and preserves them. `applyBackstop` keeps
only the first fact before adapters/fit. Thus with normal successful current phase acquisition on valid supported positions, every
successfully admitted authored shape loses to at least phase, whether another exact structural
reading is present or not. Historical firing1
had the same source-risk ordering; this is a pre-existing whole-class delivery problem, not a
reason to change current shape exactness. `[V]` `module-query.ts` sources/witnessedEvidence;
`evidence-factories.ts` createRulesPhaseReadingV2Evidence; `phase.ts` phaseBandReading;
`module-reducers.ts` exactnessOrder/orderAdmittedFacts/FACT_EQUIVALENCE_CLASSES/SUBSUMPTION/
applyPositionNovelty/applyBackstop; `module-policy.ts` structure_nudge; `module-packets.ts`.

A lower source-risk ordinal is not a judgement of pedagogical significance. That conflation
prevents the module's declared recognition/action intent—“what kind of position” and opening a
cited shape entry—from succeeding. Merely reordering the source array or familyPrecedence cannot
repair an earlier exactness key. Increasing the one-fact budget, filtering rivals in fixtures,
shortening names, promoting authored matches to convention truth, and claiming source coverage
as selected delivery would each evade the demonstrated failure. `[V]` cited exact production
sort and backstop; `module-policy.ts` intent/learnerAction/budgets; accepted
`rfc/module-registration.md` §4.6 and D4082 source-only selection preservation clause.

This establishes the research gate for a separately reviewed, Structure-only deterministic
selection amendment. Authoring must declare the finite recognition families, their relationship
to generic phase/space/connectivity summaries, simultaneous named-structure/setup/authored-match
behavior and existing within-group ties. Preserve actual source risk, all source operands,
nonshape availability, existing ceilings/timing/novelty and 1fact/80word atomic fit. No statistical
ranking, stronger chess claim, new detector or whole-product completion follows. Before acceptance,
run actual full-source stage controls for both colors, named/setup/authored and simultaneous
recognition, no-match and unavailable, generic-only, inherited ancestor and budget-deferral cases.
Trace admitted→ordered→novelty→backstop→fit→strict selected identities; the current four positive
UI cases alone do not prove an amendment. `[M]` bounded remedy recommendation derived from the
verified class proof above; D4095 owns the still-open remedy and executable controls.

### 2026-11-04 — Owned encounter recommendations and a sentence that exceeds its evidence

The recommendation consumer cannot treat storage visibility as personal history. Actual
SQLite.list includes unexpired shared-host grants; a genuine owned multi-branch run and another
person's readable host run first produce the wrong personal count. The accepted async cutover
uses stored owner identity, complete pre-await paging, full original replay/branch paths and
current registry-owned firing3 scans. Original source, whole owned history, account/session,
progress and exact pack records are rechecked around yields. This is bounded source/delivery
proof, not natural prevalence, chess usefulness or play-style inference. `[V]`
`apps/server/src/shape-recommendations-source.test.ts`, `service.ts` shapeRecommendations,
`storage.ts` list/ownerLearnerId and accepted `rfc/module-registration.md` D4082 clause.

Actual controls distinguish per-run dedup from distinct-run counts;13 eligible patterns from
10 displayed; current `present` links/exclusions from `prospective`; unavailable from genuinely
installed-empty; same-count second-page replacement from an unchanged population; and a complete
initial match from a later failed branch. Real cookie/session expiry/logout, signal and mounted
Learn request epochs retain those distinctions. The source-specific outpost pair proves current
explicit-ref truth while its actual absent-ref entry remains a nonmatch, in both colors; this
would not be established by a piece-occupancy positive alone. `[V]` cited source tests;
`progress.test.ts`, `app-shell.test.ts` actual-source recommendation cases; focused35/two and
160/three; final normal software14,241/all516 and7isolated performance/four pass, including types/build/source. Actual content retains60fail/261pass/18setup-blocked and the exact same62 failure headings. Full execution is recorded in `planning/foundation-source-identity/plan.md`.

A separate wording counterexample is real: a projected countable attempt in a registered
prospective pack is correctly not an eligibility exclusion, yet the previous sentence claimed
there was no attempt in every pack/rehearsal naming the pattern. That conclusion is broader than
its operands/policy. D4102's actual fixture first fails; server/client now state the supported
encounter count, with exact sentence parity and unchanged eligibility/DTO/actions. This repair
needs no new judgement, schema or synthetic grounding. `[V]` `progress.test.ts` actual registered
present/prospective/countable source fixture; `progress-response.ts` progressRecommendationSentence;
focused43/three3.00s; independent bounded review in the existing compiler2 receipt.

The new await also exposes an adjacent lifetime class: a different contribution captured before
I/O can remain stale even when the new shape source rechecks correctly. Actual repertoire deletion
while a real scan is held first leaks the deleted recommendation. Reading that synchronous
contribution after successful shape completion/final auth fixes D4098. This does not fix the
repertoire's own pre-existing answered/stale scan semantics (D4099), nor isolate a failed optional
recommendation section from Learn's other usable data (D4101). Source, composition and UX remain
separate obligations. `[V]` actual D4098 HTTP source control; `rest.ts` progress/recommendations;
`repertoire.ts` recommendations; `App.svelte` Learn Promise.all and source plan.

### 2026-11-04 — Remaining recorded style inputs are not candidate/FEN fields

D4076's candidate-role source authenticates the exact legal move and source piece, but contains
no original recorded path index or access grant. R12's early-queen experiment used the zero-based
move-loop index before applying that move, not FEN fullmove counters. A custom/truncated root can
therefore disagree with a FEN-derived index; a genuine arithmetic candidate cannot fill the missing
recorded-context operand. `[V]` `packages/runtime/src/foundation-style-sources.ts` CandidateRoleReading;
`evidence-factories.ts` candidate-role invocation; `tools/r12-player-style-harness/measure.test.ts` recorded move loop; accepted
`rfc/foundation-source-identity.md` §3.8/§3.8a; independent source preflight in the source plan.

D4103 is a distinct missing contract, not missing castling arithmetic. Existing castlingRights
reads exact per-color retained rook-origin rights, including Chess960; current castlingLegality
also considers blockers/check. Neither function chooses the stored color's first decision in an
original recorded prefix. The accepted source row currently names that grain but not the private
input issuer, exact first-decision/pending-endpoint selection or typed absence before the stored
color has a represented decision. `[V]` `packages/runtime/src/castling.ts` castlingRights/
castlingLegality; `rfc/foundation-source-identity.md` §3.8 and its projection plan; independent
source review recorded in `planning/foundation-source-identity/plan.md`.

RecordedReviewBoundary is an existing reusable storage/path boundary: it checks original event
replay, unique creation events, legal edges, stored import identity and current storage before
narrowing the original rooted branch path. It explicitly issues no read/assistance permission.
The actual application owner must compose current account/run access and cancellation, as the
existing recorded-grade source owner does. A generic seal, run.record.position invocation or typed
semantic call cannot replace that composition. This is source analysis, not a new running source,
consumer, learner occurrence or semantic qualification. `[V]` `recorded-review-boundary.ts`,
`evidence-factories.ts` readRecordedPositionInvocation; `apps/server/src/recorded-grade-sources.ts`
RecordedGradeSourceOwner.resolve/read. Bounded §3.8 clarification is under independent review;
its proposed selection semantics are authoring, not observations of current behavior.

### 2026-11-04 — Optional availability and the real first-move gap

D4101 is reproduced through the actual recommendation endpoint: typed503 replaces all Learn with
the page error, while a held genuine200empty delays usable core data. The accepted event-fact
recommender is strictly additive and cannot determine another surface's availability. Independent
review confirms isolating only this section restores that contract; the endpoint still refuses
unavailable whole-source results. The correction uses local pending/ready/unavailable and exact
learner/visit/request ownership, with source-changing repertoire mutations suspending publication
until settled. This is bounded delivery/lifetime proof, not evidence of coaching usefulness or
native accessibility. `[V]` archived `orphan-completion.md` §3; `return-and-progression.md` §12/A9;
`apps/web/src/App.svelte`; actual controls in `app-shell.test.ts`; independent review in the existing
compiler2 receipt; source plan records final gates.

The first retained-button test after reentry ended in valid empty, so it could not falsify an
older callback accidentally adopting a new failed request. The replacement enters a new unavailable
state and invokes the actual captured emitted handler, with a current usable Retry as positive
control. A separate same-visit failure→retry→failure control first starts an unwanted third read;
request-specific callback and deferred-focus ownership repair it. Route/account/unmount and actual
repertoire delete/scan/answer controls retain this distinction. `[V]` `app-shell.test.ts` D4101
cases; `App.svelte` recommendationRetryFor/retryRecommendations; real older-handler red1/144.

D4104 is a producer/receiver mismatch, not missing corpus evidence. The accepted root-no-answer
scan emits empty reply/line, gamesUntilSeen1 and queriesUsed0; the actual cookie response is200,
but the former decoder rejects empty replySan. The corrected explicit assertion fails in34ms,
rather than treating the earlier unresolved helper timeout as the source result. The receiver
now admits only that exact sentinel and refuses near-sentinels; both stored colors reach mounted
starting-position copy, with no blank move slots or sampled-frequency claim. Server/client exact
copy and the mandatory corpus guard agree. This closed-wire consistency check does not authenticate
a root independently; the original scan remains the source. `[V]` `repertoire.ts` root scan and
recommendations; `progress-response.ts`; `shape-recommendations-source.test.ts` parity;
`progress-response.test.ts` negatives; actual both-color API/mounted cases in `app-shell.test.ts`.
D4099 answered/stale-gap semantics remain open.

D4105 is a separate root-summary category error: the actual mounted repertoire list calls the
root a reply above the learner's bound. Both-color controls reproduce that wording2/147, despite
empty reply/line and queriesUsed0. Independent review distinguishes this from a mathematical
error: the accepted model normalizes declared-root mass to1 and derives gamesUntilSeen1. The
correction uses scan-time first-answer wording and retains current answer/stale states; source
arithmetic and ordinary nonroot frequency rendering remain unchanged. Actual root source fields
and answered-e4 control are asserted;207/five pass after repair and bounded review accepts it.
Full final gates are in the source plan. `[V]` archived `repertoire-gap-finding.md` §2 root/mass
rules; `App.svelte` gap-results; `app-shell.test.ts` both-color root and actual answer controls.


### 2026-11-04 — Recorded candidate/rights source boundary

[V] The foundation now has27of28 actual verified source/value factories: original recorded
prefix/decision owners supply exact early-queen candidate indices and first represented stored-
color castling rights. Actual SQLite/RunService controls include pending endpoints, alternative
candidates, custom root/FEN counters,15/16 boundary, promotion source role, Chess960/blocked/
checked/all-false rights, inherited branches and retained account/grant/head/import/abort
retirement (`apps/server/src/recorded-foundation-sources.test.ts`; `rfc/foundation-source-identity.md`
§3.8c). Separate source/ABI and consumer/meaning reviews and final normal software14289/517 plus
performance7/four/build pass. Actual content retains its exact60-failure/62-heading baseline.
These experimental source factories add no actor occurrence, automatic collector, learner/bot
consumer or semantic qualification. Clock is still missing. D4077's runtime/census caller duties,
D4095 selection and D3928 content/native remain open; source inventory is not selected UX delivery.


### 2026-11-05 — Current authored timing and transition sources

[V] Current timing/transition operations now admit complete consumer2 and all original opening,
closing and compiled boundary origins before outer early exits, while acquiring only visited
board leaves. Actual validator-issued pointers, closed authoring/objective purpose, default
resolver propagation, unavailable diagnostics and registered-source retirement are exercised in
`apps/server/src/authored-tempo-transition.test.ts`. Two real registered packs perform owned
SQLite/RunService moves and exact persisted objective/replay with the engine unavailable; these
are source/operation facts, not detector or engine qualification. Separate source and consumer
reviews plus final14304software/518+7performance/four pass. Current type/source/authority/build
and content60fail/261pass/18setup-blocked retain exactly62old headings after two content fixtures
were corrected to genuine issuers. D4106/D4108–D4113 close bounded duties; D4107/authored census,
clock, broader callers, semantic qualification, content/native and whole capability remain open.


## 2026-11-05 — Authored census/witness evidence and receiver faults

The authored census now selects typed original roots from real validator-issued documents and
awaits actual temporary ShapeRegistry dependency admission. Draft source authority survives a
semantic validation refusal where the issuer legitimately captured the schema/static-valid
original; a selected external draft does not become a registered dependency. Plan-consequence
and transition-position roots are counted, with nested structural nodes kept inside their owning
visitor. All five production callers await the report. `[V]` (`apps/server/src/expression-census.ts`;
`apps/server/src/authored-census-source.test.ts`; `shape-check.ts`; `graduation-clearance-corpus.ts`;
`sourcing/graduation-clear-cli.ts`)

Independent review found three authority/receiving failures: unverified caller-claimed corpus
hits could establish satisfiability (D4114), the CLI's cwd slicing lost external-file diagnostics
(D4115), and returned witness-only evaluation failures did not become report faults (D4116).
The repaired actual controls verify false/malformed/real hits, original/copy/retired sources,
legal versus illegal witness moves, all three explicit convention refs, unavailable trigger
populations, and a source failure confined to a custom witness FEN. That last case has successful
corpus and degenerate probes, exactly one fault, the precise external-file receiving error and
no other-file diagnostic. Focused25/three passes5.34s; final normal gates remain in progress.
These are synthetic software/source-boundary observations, not natural prevalence or chess
qualification. `[V]` (`apps/server/src/authored-census-source.test.ts`;
`apps/server/src/expression-satisfiability.test.ts`;
`planning/learner-modules/compiler2-independent-review-2026-11-02.md`)

At the initial review, a separate outer standalone-validator catch mapped thrown operation failures
to FILE_READ_ERROR while safely failing validation (D4117). Its repaired read/JSON versus actual
compiler/source boundary now passes actual file/registry/receiving controls and independent review.
The census loader rejects a thrown admission failure rather than claiming false/no-fire. No complete
authored-content, source-qualification or release inference follows. `[V]` (`apps/server/src/shape-check.ts#checkShapeFile`;
`apps/server/src/shape-validation.ts#validateShapeEntry`)


2026-11-05 final discharge for this bounded slice: D4107/D4114–D4118 close locally after the
independent source/meaning reviews and final normal14318software/all519files447.41s,
7isolated performance/four60.07s, types and actual server/web builds. Source-author11 passes.
Actual content remains60fail/261pass/18setup-blocked43files194.59s, all62 old headings identical.
The new10s regression first failed at506.99s and285.38s full-content readings; it passes after
original-occurrence projection, scoped successful-only reuse and genuine immutable input2 reuse.
The old40.13s pure-matcher cost is not claimed restored. Actual visitor count, positive reference
parity, transient retry, distinct original source handles/root/population/proof and same-byte
registry retirement controls retain source checks and corpus/assertion/deadline scope. D4119
records separate CLI per-file batch cost; D4077/read-only report/clock/caller/qualification/native/
content/release remain open. `[V]` (`apps/server/src/authored-census-source.test.ts`;
`packages/runtime/src/evidence-factories.ts#createAuthoredStructuralConditionInputV2Evidence`;
`planning/foundation-source-identity/plan.md`;
`planning/learner-modules/compiler2-independent-review-2026-11-02.md`)


## Authored legacy/successor literal comparison, 2026-11-05

[V] The accepted report calls real document validators, registry, original sources and the current
dispatcher; all36exact sites and827expected/replayed positions are covered. One-ref experiments
retain standalone/enclosing results and actual trace operands separately. King30/30, backward0/0
and outpost242/7 are site-position changes on this fixed population, not joint migration or general
prevalence. Every author decision remains pending. Exact baseline and permanent alias/replay/
source/admission controls: `rfc/contracts/foundation-authored-convention-sites-v1.json`,
`apps/server/src/authored-convention-migration.test.ts`, `apps/server/src/authored-convention-migration.ts`.
Both independent reviews and final normal14334software/520+7performance/types/build pass;
actual content retains all62previous headings/60failures. Detailed receipts/limits and finite
D4066/D4068/D4069/D4071/D4120–D4122 closeouts are in
`planning/foundation-source-identity/plan.md`. No authored migration/qualification/release claim.


## Retained original clocks before source construction, 2026-11-05

[V] Original same-game legal parser extraction precedes stripping for paste/fetch. Actual SQL32
and account lifecycle retain typed numeric sparse samples and complete original node/session
mapping; unexpected source failures remain retryable null. Both independent reviews found and
then accepted D4123/D4124/D4125 repairs with genuine truncated/extended/fork/JSON/internal-fault
controls. Final14394software/523+7performance passes; current155/two App checks/types/rebuild
cover the disclosure, and actual content retains all62prior failure headings/60failures.
Source28/private actor occurrence/API/readout remain absent, not implied by data retention.
Sources: apps/server/src/recorded-clock-storage.test.ts, recorded-clock-import.test.ts,
packages/runtime/src/recorded-clocks.test.ts and planning/time-controls/implementation-2026-11-05.md.

## Original clock source and actor occurrence checkpoint

[V] Actual SQL-backed original imports now feed private reading1/decision1 factories and the
clock-specific imported/game occurrence. Source28 is implemented; selected-side cannot reattribute
the mover and copied/resealed/retired source values refuse. Separate independent reviews and normal
14434software/524+7performance/types/build pass. Actual content retains all62previous failure
headings;91subjects remain unqualified. Historical consumer/API/strict readout, other six actor
envelopes and native/live timing remain open. Evidence: `apps/server/src/recorded-clock-source.test.ts`,
`packages/runtime/src/recorded-foundation-occurrence.ts` and
`planning/time-controls/implementation-2026-11-05.md`. This is source implementation, not a
player-style, learning-effect, UI or release claim.

## Historical clock consumer delivery checkpoint

[V] The actual original clock source and imported occurrence now reach their explicit historical
consumer, authenticated API, strict receiver and selected Review readout. Complete retained operands
and actual known row/parent/prior/root identities, observed help/access/account/route retirement
and real emitted Retry control are checked. Independent reviews and final14464software/526+
7performance/types/build pass. Actual content retains exactly62previous failure headings;
375semantic cases still qualify0of91subjects. Evidence: `apps/server/src/recorded-clock-delivery.test.ts`,
`apps/web/src/lib/recorded-clock-readout.test.ts`, actual App callback tests in
`apps/web/src/lib/app-shell.test.ts` and `planning/time-controls/implementation-2026-11-05.md`.
Native geometry/release, measured-live/enforced/broadcast and the other actor families remain open.

### 2026-11-05 — Structure recognition proposal, complete-source stage evidence (D4095)

The disposable `make structure-selection-measurement` instrument passes49cases/onefile3.02s and
its dedicated clean TypeScript check. Forty-eight cells cover12setups ×bothcolors ×actual original/
inherited branch subjects, plus the exact current consumer2/seven-ref image check. Every cell
uses real registered shape acquisition, stored legal runs, cookie-authenticated REST and the
strict receiving parser. A test-local reducer stable-partitions the unchanged original comparator
into the proposed recognition/generic groups; no production policy or source filter is changed.
It records/asserts full admission, original within-group order, ancestor novelty, one-fact backstop
and atomic fitted items/budgets. Original saved-run bytes remain unchanged. `[V]`
`tools/d1865-evidence-assembly-harness/structure-selection.test.ts`; normal Make session97136,
local `/tmp/tabiya-structure-selection-research-final.log` (optional local output, not a required
tracked artifact).

Authored occupancy and repeated authored matches become selectable while keeping their original
authored risk. Named IQP and actual Lucena setup facts retain convention risk and win simultaneous
authored matches through the old within-group comparator. Generic-only, unavailable shape source,
material classification positive/null and phase `unclear` preserve their source semantics; no
missing-source state replaces a nonempty generic packet. Genuine100word authored title remains
the selected whole fact but exceeds80words, so fitted output is empty with the existing compact-
detail message and no generic backfill. Actual inherited branches preserve original node identity.
These are synthetic legal source-stage controls, not natural-game prevalence, strategic usefulness,
mounted UI or implementation proof. `[V]` same instrument assertions and actual collector/adapter/
receiver paths cited in the preceding D4095 section.

Initial research runs stopped at wrong harness imports, then4/49cells exposed a false instrument
assumption: the catalogue deliberately defines Maroczy for White only. The repaired both-color
named cells use the independently declared White/Black IQP entries; no detector/convention changed
and no defect is inferred from that intended asymmetry. `[V]` `structure.ts` STRUCTURE_PREDICATES/
STRUCTURE_METADATA; initial/current research logs, same test source.

This discharges the bounded draft's pre-acceptance source-stage evidence requirement only. Both
independent contract/control reviews are pending. D4095 stays open, production order unchanged;
actual shipped policy/forged-summary/old-policy/other-module/critical/UI controls and normal full
gates remain required before closeout. `[M]` execution-scope limit; draft `rfc/learner-modules.md`
§3 Structure recognition amendment and `rfc/module-registration.md` §4.6 companion.

### 2026-11-05 — Structure policy delivered and independently reviewed (D4095/D4139/D4141)

Both reviewers accepted the bounded contract after49/one3.02s, then separately accepted repaired
production/source/actual-selected receiving controls. The prototype now delegates to permanent
`apps/server/src/structure-selection-source.test.ts`: the candidate returns the untouched actual
compiler result; only the former-order comparison remains test-local. Genuine constructor forgery
first fails1/49; original fact ownership plus identical immutable PRIMARY metadata now refuses
false source risk and later mutation. Exact policy/currentconsumer2/closed7ref, old/other policy,
critical and within-group controls preserve the contract. `[V]` those actual tests, module-reducers/
module-registry tests and existing compiler2 independent review receipt.

Actual mounted Structure now retains firing3/source/text/library href, refuses a held successful
response after a real help-ceiling change and atomically defers genuine oversized recognition
without generic backfill. Focused440/five33.96s+clean types pass. First full14519pass/4old-receiver
failures across527files407.40s is repaired without source filtering; all re-digested strict
renderer/binding/convention attacks now execute and refuse. Final69763 normal14523/all527software
411.04s+7performance/four57.28s/types/build/source-author11 pass. Content54848 stays60fail/261pass/
18setup43files166.14s, all62prior failure headings identical. `[V]` screens.test.ts, actual receiver
tests and local Make logs; optional `/tmp` output is not a repository/CI input.

D4095/D4139/D4141 close their finite local units. This is no natural-game prevalence/usefulness
measurement, semantic qualification, native/default/whole-module/parent/release clearance. D3928
content/native remains held. D4140's next original recorded occurrence clause is independently
accepted, not implemented by this policy repair. `[M]` scope; current source plan and ledger.

## 2026-11-09 — D4167 current source-to-consumer cutover map

This is a production code/contract audit, not a natural-game prevalence or chess-meaning study.
The existing 23-row source inventory remains authoritative; five authored-predicate companions
are separate. All eight non-style position snapshots already execute in
`candidate-population.ts::candidateChildReadings` using the original selected child position,
legal map, connectivity and control inputs. Source construction is therefore not uniformly
missing. Exact incoming-edge events and current learner delivery are the gap. `[V]`
`planning/foundation-source-identity/projection-plan.json`, `candidate-population.ts:243–282`,
`internal/candidate-child-reading-routes.ts` and `evidence-factories.ts:814–887`.

| Family | Current exact source and joins | Operation and consumer consequence |
|---|---|---|
| Opposition | reading@3 is one complete legal-position snapshot with both kings and nullable unobstructed opposition. event@2 consumes ordered before/after reading@3 and exact legal move; stable color-identified king-pair subject; gained/lost/membership_changed; zero or one event | Candidate children retain reading@3. Local semantic closure, Nudge/Review and Full Inspector still request event@1. Holder change is one event, not the old two-color gained/lost pair. Old renderer cannot parse the new complete snapshots |
| Backward pawn | reading@3 retains complete pawn domain, qualifying pawn/stop, controllers, supports, ahead pawns, occupancy, pseudo captures and explicit opposing-color half-open relation. event@2 joins stationary color/square first, then physical mover; gained/lost/membership_changed, no equal-row event | Child reading@3 is real. Shared old event@1 joins by file and uses old observations; new payload cannot be cast into it. Multiple same-file subjects and mover lineage must survive |
| Backward advance | derived.pawn.consequence.backward_pawn_legal_advance@1 consumes original backward@3 plus genuine complete landing_captures@1 at actual resulting FEN/destination | Separate candidate consequence, not the event@2 population or an observed reply. Complete landing input may yield replies:[] when a geometric controller is pinned. No Inspector topic or shared edge operation currently publishes this source |
| Pawn groups | derived.structural.reading.pawn_file_group@1 is one complete connectivity-derived snapshot. event@1 consumes ordered original group snapshots, exact move, color/file subject and full move/capture cause | Child snapshot exists; event operation/delivery absent. Not a one-to-one rewrite of doubled/isolated old boolean events: member changes while booleans stay true are real changes |
| File class | derived.activity.reading.file_state@1 retains all eight files/four exact enum states and pawn memberships. event.file_state@1 emits only enum changes, preserving both complete rows and move/capture cause | Child snapshot exists; current open/half-open events and moved-heavy occupancy are different relations. Same-enum rank/member change is not a file-state event |
| Stationary heavy-piece reveal | derived.activity.event.file_access_revealed@1 consumes each original file-state event; preserves unchanged rook/queen identity and complete nested cause | Missing from actual edge operations/Inspector. Different from derived.activity.event.open_file_occupancy@1, which describes the moving piece. Neither is a legal access/control/quality verdict |
| Pawn islands | rules.structural.event.pawn_islands@2 consumes ordered original connectivity snapshots and exact move; per-color complete partitions; count_gained/count_lost/topology_changed | Actual operation/Inspector still emits two count-only @1 states on every valid edge. @2 emits only changed file partitions, including equal-count topology, excluding rank-only moves. Cannot reuse old sign or no-witness policy |
| Slider rays | rules.transition.event.slider_ray@2 joins original physical piece/direction, actual captures, promotions and both castling relocations; nullable full rays, endpoint, strict interior and ordered blocker identities | Sole value route exists; actual transition/discovered suppliers use target-bearing @1. Board-edge endpoint is not a target. Equal-count blocker replacement matters. @1-derived discovered evidence cannot be relabelled as @2; that distinct target relation needs its own explicit successor analysis |
| Future pawn challenge | derived.square.reading.future_file_challenge@1 is one complete legal-position snapshot under the fixed same-file/future-push convention | Actual child reading exists; no selected Inspector topic or ordinary module binding. Not a forced legal future sequence |
| Capture migration | derived.square.reading.capture_migration_reach@1 is its separate complete snapshot | Actual child reading exists; must remain separate from future-file challenge and not silently broaden outpost exclusion |
| Outpost candidate/occupation | derived.structural.reading.outpost_candidate@1 consumes original control and future-file snapshot; occupied_outpost@1 consumes that original candidate value | Both actual child readings exist; exact candidate also powers current authored outpost predicate@2. No automatic ordinary card, recommendation, survival claim or player-style conclusion |

All rows are verified against `foundation-position-sources.ts`, `foundation-pawn-sources.ts`,
`foundation-slider-sources.ts`, source factories and the original operation dispatch. `[V]`
The seven style rows have separate real Profile/recorded/clock paths and remaining actor/role
obligations in the source plan. They are not forgotten or reimplemented by this map. The five
predicate companions retain their existing authored-population owner. `[V]`
`planning/foundation-source-identity/plan.md`, `rfc/profile-game-facts.md`,
`rfc/profile-choice-facts.md`, `recorded-foundation-sources.ts` and `recorded-foundation-source.ts`.

### Actual consumer boundaries

Full Inspector's current 80-topic/six-detail source image and local suppliers literally include
old backward/opposition/island events. Its full before/after renderer is faithful to those old
payloads, not the new ones. Nudge's exact eight-family @1 change policy is separate from shared
collection; islands currently compares counts only. Review also receives the old full local
closure through postcommitEdgeEvidence. Sight still uses the structural reading contract.
`[V]` `inspector-source-topics.ts`, `inspector-local-source.ts`, `postcommit-nudge.ts`,
`presentation-inspector-adapters.ts`, `module-registration.md` §§4.5a/4.11e and module sources.

The candidate packet already retains current snapshots but its event closure is older. Avoidance
still aggregates family/sign and emits its old derived.semantic_avoidance.*@1 values; it cannot
receive subject-preserving successors by changing an allow-list. The bot policy compiler's
features population is empty; no structural personality/score activation follows from retained
readings. `[V]` `semantic-evidence.ts::localSemanticEventClosure/selectSemanticEvidence`,
`candidate-population.ts`, `bot-policy-compiler.ts`, `rfc/foundation-source-identity.md` D3/D7/D8.

### Bounded implementation order, without losing the rest

1. Independently review explicit Inspector delivery for the seven current edge-event families:
   opposition@2, backward@2, pawn_file_group@1, slider_ray@2, file_state@1,
   file_access_revealed@1 and pawn_islands@2. This closes selected-edge delivery only. It needs
   original complete input acquisition, exact topic/pair replacement and complete typed human
   readouts. It does not need a new provider, public query kind, cache, source schema or ruling.
2. Keep all eight current snapshot readouts and the separate backward-advance consequence as
   explicit remaining D4167 obligations. Complete snapshots with large square/reply populations
   need a concrete whole-source/detail paging contract; a generic raw JSON panel or silently
   cropped single fact is not a solution. This is source presentation work, not absent collectors.
3. Migrate shared local/candidate events under their existing operation owner with exact version,
   sign, identity, population and unavailable semantics. Independently validate current event
   versions, then migrate ordinary Sight/Nudge/Review and subject-safe avoidance under their
   existing owners. Source reach and finite qualification do not themselves choose significance.
4. Bot feature compilation and grounded ordinary support still need explicit consuming policies;
   do not count this Inspector stage as either completion. Authored packs, longitudinal style,
   native/default-App and content/release holds retain their current owners.

Steps 1–4 are delivery sequencing, not a permanent descope or requirement to maintain a legacy
compatibility pipeline. Exact old Inspector tuples must leave that current door when their new
counterparts land; independently owed old ordinary/derived relations stay only until their own
specified cutover. Parent ownership is `shared-candidate-evidence-packet` for source operation,
`module-registration` for demand/consumer and `evidence-presentation` for complete representation.
The coordinated draft must pass independent buildability review before production changes. `[V]`
`rfc/foundation-source-identity.md` §§5/8/D3/D6/D7/D8 and the owner's D3851 pre-launch ruling.


## 2026-11-09 — verified follow-up to the D4167 pre-implementation map

The preceding table records the audited pre-cutover state. Seven selected-edge source paths and
complete typed readouts now execute; three old current Inspector tuples are removed and four new
ones appended (84topics/90Full2/301module pairs). Original payload/ref correspondence is enforced
at construction and receiving; real same-source deferred ordinals are explicitly reachable without
cropping or increasing budgets. Both independent bounded reviews and full14966software/537 plus
7performance/build/source-author11 pass. Required roots98 retain419passing cases/fourqualified;
complete content retains exact62 prior failures. `[V]` foundation-edge-source.ts/test.ts,
foundation-edge-presentation.ts, inspector-query-contract.test.ts,
apps/web/src/lib/inspector-source-browser.test.ts and the existing source plan/review receipt.

D4167 remains doing: the eight snapshot readouts, advance consequence, canonical event closure,
ordinary modules, exact-subject avoidance and bots do not inherit this stage's completion. `[V]`
existing projection-plan.json and actual consumer paths recorded in the pre-cutover table.


## 2026-11-09 — next complete snapshot/advance delivery gate

Independent source/meaning audits confirm all eight non-style snapshots already execute in
candidateChildReadings, each as one whole original value. Selected demand can reuse the literal
legal/connectivity/control/future/candidate joins without invoking the complete candidate compiler.
Backward legal advance is a separate selected incoming-edge source, retaining a complete landing
capture population and its calculated legal opposing-pawn subset, including zero replies. It is
not observed continuation or enumeration of all available advances. `[V]` candidate-population.ts
candidateChildReadings; foundation-position-sources.ts; foundation-pawn-sources.ts;
evidence-factories.ts createDerivedPawnConsequenceBackwardPawnLegalAdvanceV1Evidence;
exchange.ts LegalExchangeResult and LandingCaptureReading.

The actual missing contract is complete usable detail: future/migration populations can exceed a
whole-source prose budget; recursive exchange alternatives cannot be replaced by one chosen line.
Existing inspector-detail.ts supports a closed typed source-order expansion and bounded page,
not arbitrary new kinds. New coordinated drafts shared§3.1c/module§4.11g/presentation§3.10e specify
nine source topics/eight literal text-only details, complete domains and finite branch-path
traversal. Independent acceptance remains required before code. `[V]` actual eight source shapes,
inspectorDetailMembers/buildInspectorDetailPayload and the three draft clauses.

Canonical migration seam, still pending: mintFoundationValue already retains original ordered
source objects in FOUNDATION_VALUE_INPUTS; computed new opposition/backward/island events also
have receipt input digests. compileSemanticEvidenceEvent checks supplied original inputs against
that receipt AND the declared derivation; adding only seven wrapper refs will fail that join.
Use existing original input membership and truthful literal derivation declarations in the later
cutover, not a second provenance store/recomputed copies/renamed old semantic events. Target-
bearing slider1 remains different from physical board-edge ray2. `[V]` evidence-factories.ts
mintFoundationValue/assertPawnFoundationSource and semantic-evidence.ts compileSemanticEvidenceEvent.


## 2026-11-09 — current snapshot/advance delivery and next canonical/ordinary audit

The previous same-day snapshot/advance drafts received both independent buildability acceptances
and bounded implementation reviews. All16 current foundation selected readouts now reach the
actual Inspector:93topics/14details/107Full2/318modulepairs. Complete payloads and source/view
reference correspondence, genuine source membership, lossless full-domain/tree paging and
both-color authenticated REST/strict receiver/emitted DOM controls pass389/four. Full15173software/
539 plus7performance/build/source11 pass; all368prior profile outcomes remain equal after adding8.
Content keeps exact62prior headings. This is local delivery, not qualification or wholeD4167.
`[V]` foundation-snapshot-source.ts/test.ts; foundation-snapshot-presentation.ts;
foundation-snapshot-detail.ts/test.ts; inspector-receiver-independent.test.ts;
inspector-source-browser.test.ts and the existing source plan/review receipt.

Independent code audits identify the next exact consuming boundaries. Sight's SIGHT_SOURCE_ROUTES
still acquires structural@1; sightScope requires payload.squares, so raw new snapshot substitution
would silently lose selected-square results. Nudge postcommitEdgeEvidence uses local closure and
D3715 current/ancestor change witnesses; Review collects that closure per original edge and
intersects REVIEW_SOURCE_KEYS without Nudge's filter. ONE_EDGE_EVENT_REFS also filters version1.
Structure consumes none of the seven edge families; keep its separate7-ref recognition table.
`[V]` module-query-sources.ts; module-query.ts::sightScope/sources/moduleWitnessed;
postcommit-nudge.ts; review-map.ts::collectRelations/admitForReview; module-registry.ts.

Computed opposition2/backward2/islands2 have genuine receipt inputs but no projection.derivation;
only derived-plane projections may declare that metadata. Existing SEMANTIC_EVENT_DECLARATIONS
needs an explicit finite computed-source tuple contract. Existing FOUNDATION_VALUE_INPUTS retains
original ordered before/after inputs; use it, not recomputed equivalent values. Current wrapper
anchor checks name only snake_case operands, and generic allowed-sign checks do not bind the new
payload's actual sign. New current tuples require exact camelCase anchor/sign joins. D4170's
unique-ref bag/set branch is explicitly legacy dependency-family behavior in code; it is recorded
as migration debt, not an observed generic consumer defect. `[V]` evidence-factories.ts;
evidence-contract.ts::compileEvidenceManifest; evidence-catalog.ts::SEMANTIC_EVENT_DECLARATIONS;
semantic-evidence.ts::compileSemanticEvidenceEvent.

Physical ray2 has no target-bearing family field; current discovery consumes original latency1
and slider1 target relations. Keep that distinct internal dependency until a genuine successor
is authored, never relabel or duplicate public pipelines. Avoidance currently groups projection/
version/sign and one event per alternative; that collapses different root subjects and outcomes.
Subject-safe successor needs complete legal alternatives, original root physical identity and
outcome signatures, every per-move subject and truthful missing-vs-empty authority. Wholepayload
hashes include edge/FEN and cannot provide cross-alternative identity. `[V]`
semantic-evidence.ts::discoveredExecutedSemanticEvents/familyKey/selectSemanticEvidence;
evidence-factories.ts::createDerivedTacticDiscoveredExecutedV1Evidence/AVOIDANCE_FACTORIES.

These audits authorize drafting, not unreviewed ordinary significance/default changes. Preserve
existing priorities, budgets, novelty and source meanings. Actual square reach, topology with
unchanged count, unchanged group booleans, moved-vs-stationary file relations, discovery target,
repeated original Review edges and subject collisions need genuine falsifiers in the next cut.
`[V]` existing parent clauses and actual symbol maps above; D4167/D4170 stay owned/open.


### Additional live consumers in the same D4167 reverse closure

Play DrillScreen calls presentPositionStructureEvidence and CompareView calls it for each leaf.
That separate inspector.position_structure@2 acquires16detailed structural reading2 values plus
named_structure2. structuralDetail(cachedStructuralReading(fen).features,kind) retains predecessor
file-level backward observations, maximal-reach occupied outposts and blocker-blind opposition;
operand fidelity did not change definitions. Separate selectedSquareSightEvidence/rawStructure
feeds board.selected_square_sight1, independently of module.sight_on_request1. comparisonStrips
still uses structure_delta1/structure_strip1; COMPARISON_STRUCTURAL_ROUTES deliberately pins17
original reading families for the owned comparison2 population. Its ownership proof is not current
definition adoption. `[V]` DrillScreen.svelte; CompareView.svelte; evidence-factories.ts detailed
structural factories; structural-reading-detail.ts; reading-evidence.ts;
compare-strips.ts; comparison-structural-population.ts.

Support guidance.ts::evidencePacket still reads structuralReading; positionGuidanceEvidence also
mints reading1/firing1 values for actual voice/speech routes, alongside an outstanding raw authored
matchesStructuralExpression caller. These belong in the coordinated consumer inventory before
D4167 closes. Explicit authored refs already use genuine opposition3/backward3/outpost-candidate1
and predicate2 via authored-predicate-population; unreferenced leaves deliberately select
predicate1 under the accepted author-choice contract. Change those only through explicit authored
migration. Original open/half-open pawn-presence relations and pawn_connectivity partitions remain
valid complementary readings; material-count-only uses of structuralReading are not obsolete
semantic consumers. `[V]` guidance.ts; evidence-operations.ts; authored-predicate-population.ts;
structure.ts; source-owned comparison source table and D3309's accepted migration boundary.

This expands the actual reverse-trace checklist inside the already open D4167; it is not a new
feature, automatic latest-version lookup or acceptance of an unwritten ordinary policy. Current
qualified/source/default/content/release states remain as recorded above. `[V]` code paths and
existing accepted parent boundaries cited in this section.


## 2026-11-09 — D4170 actual receipt-order experiment

Disposable input-order.test.ts obtains genuine capture-class events from the current shared local
closure in both colors. Each retains exact original capture/exchange values and receipt vector.
The compiler accepts the original AND reversed vectors with the same event id; missing, duplicate-
instead-of-another and extra inputs refuse.2/2research cases pass in1.70s. No output, semantic
case or chess expectation is manufactured, and no production code is changed. `[V]`
`make semantic-input-order-research`; tools/d1713-semantic-validation-matrix/input-order.test.ts;
semantic-evidence.ts::derivedExchangeSemanticEvents/compileSemanticEvidenceEvent.

The accepted value-authority§2.2 deliberately names declaration-level multisets. This observation
therefore does not prove that every unique-ref declaration should become a fixed tuple, or that
a learner already received a wrong answer. It isolates the separate consuming comparison of the
factory's recorded ordered receipt. Draft§2.2a requires ordinal receipt equality while preserving
legacy declaration-family semantics, variable populations, current payloads/ids and all policies.
Private original object ownership and D4167's new computed-source/anchor/sign contracts remain
separate. The draft needs independent acceptance before implementation. `[V]` existing§2.2,
EvidenceValueReceipt.sourceDigests and draft§2.2a; no new registry or receipt-format proposal.


## 2026-11-09 — receipt repair and genuine normalized-input reader preflight

D4170§2.2a is now independently accepted and its ordinal receipt join is implemented. The same
actual instrument now refuses reversed inputs in both colors; all four research cases pass1.36s.
Permanent86-case source suite also distinguishes genuinely separate equal-digest instances from
original-object identity; legacy wrappers correctly accept those equivalents at the same ordinal.
This does not qualify the known family/sign avoidance claim. `[V]` semantic-evidence.test.ts;
`make semantic-input-order-research`; evidence-value-authority§2.2a; compiler2 review receipt.

The added D4167 source control legally castles White/Black with e1g1/e8g8 aliases into a gained
unobstructed opposition relation. Calling the same original before/after source factory with the
canonical e1h1/e8h8 move yields identical canonical payload and payloadDigest, but a DIFFERENT
inputDigest. Thus a reader cannot recreate original authority from normalized payload spelling.
The six tuple sources' existing sole-mint map membership and ordered receipts establish actual
construction; slider2 separately minted its canonical edge and can check that retained invocation.
Both reviewers independently accept this simpler bounded clarification. No shipped wrapper bug
or source-definition change is claimed. `[V]` input-order.test.ts genuine four-case run above;
evidence-factories.ts::validEdge/foundationEventFactory/mintFoundationValue/edgePopulation;
evidence-value-authority§2.2b and existing compiler2 review receipt.


## 2026-11-09 — seven current constructor boundary and next semantic evidence dependency

The seven-source construction amendment is implemented and independently reviewed. Genuine
predecessor controls fail for all seven source families; 67 new permanent cases cover both colors,
original objects and source copies, counterfactual input substitution (not an avoidance claim),
complete anchor/sign joins, raw castle aliases, physical special moves, null/zero/count/topology
relations, exact computed tuple arity and the pre-cutover ordinary image. Actual normal gates pass
15,301 software/all540 plus seven performance tests, types/build/source-author 11. The seven added
bindings are research declarations, not newly acquired canonical events or ordinary admission.
`[V]` foundation-semantic-event.test.ts; semantic-evidence.ts; evidence-contract.ts; evidence-
factories.ts; semantic-validation.ts; module-registry.ts; current source plan and review receipt.

Both independent next-dependency audits find that source qualification requires actual production
reach as well as cases and a census. A new validation-only helper cannot mark itself direct;
exact_projection_multiset invokes the declared parent and compares retained outputs. New version1
group/file/revelation refs need explicit population mapping before legacy fallback. D1717's current
base-id opposition block must remain for the legacy subject while a separately accepted successor
operation is introduced. This is a future routing requirement, not a currently observed false
qualification: D4167 still blocks all seven. `[V]` semantic-validation-operations.ts::
SEMANTIC_VALIDATION_BLOCKED_FAMILIES/semanticValidationPopulationOperation; semantic-validation-
runner.ts; tools/semantic-validation-build.ts; current 98-subject profiles and review receipt.

There are no existing canonical cases that establish the seven exact new versions. The source
handoffs give fixture requirements and citation leads; they are not automatically retained case
propositions. Required arms are positive, semantic negative, orientation and imported population;
counterfactual/external taxonomy are already inapplicable. Use case-specific independently retained
board/rules facts with the accepted literal convention; do not create owner-authored receipts,
retag old blocker-blind/file/count expectations or use the implementation as its own oracle. Keep
absolute mirror partners and wrong-output controls, actual 579 sampled edges, every occurrence and
failure/abstention, and true caller retention. Ordinary adoption stays separate. `[V]` exact seven
profile rows in semantic-validation-profiles.json; canonical-case register; existing source handoffs;
accepted semantic-validation-authority §§4–5 and both independent dependency reviews.


## 2026-11-09 — shared source operation and exhaustive-case research gate (D4167/D4171–D4173)

The disposable model preserves complete original payloads in two genuine opposite-color capture
edges while sharing required before/after source chains: seven independent collections perform
31 factory invocations; one shared request-local graph performs 20. Both produce seven events;
revelation consumes the same original file-change objects emitted by that graph. Selected backward
source demand executes only its five required calls, even when the available population is empty;
a wrong successor still throws. This is invocation/identity evidence, not latency, application
reach or qualification. `[V]` `make foundation-shared-operation-research`;
`tools/d1713-semantic-validation-matrix/foundation-operation.test.ts` (model only).

D4171 measures the parser refusing all five actual nested input-relative paths: before.fen,
after.fen, fileChange.beforeFen, fileChange.moveUci and fileChange.afterFen. The seven sources
already contain those operands; the current closed input grammar only admits top-level scalars.
A complete new-source walk cannot replace them with ignored fields or generic FEN normalization.
`[V]` same disposable instrument; foundation-position-sources.ts; foundation-pawn-sources.ts;
semantic-validation.ts::MIRROR_INPUT_FIELDS/parseMirrorOperandRules.

D4172 executes a real retained material2 cited proposition with its actual authority resolvers.
A test-only spy adds the SAME genuine target a second time: target count changes from one to two,
while the existing emits case correctly passes its stated minimum-witness claim. This does not
prove false current qualification. It proves that new complete-population propositions need a
stronger exact expectation; symmetric extra events can also agree in a mirror. Preserve all old
witness semantics. `[V]` same instrument; semantic-validation-runner.ts::executeSemanticValidationCase;
immutable cited.python-chess.rule-state.material-v2.en-passant.white and its retained source.

D4173 identifies the remaining typed domains in actual current payloads: file letters reflect
horizontally and half_open_white/half_open_black swap with colors. The present square/color/delta
transform list cannot express these domains. Add only their closed file/file_state transforms;
absolute partners must retain complete operands and canonical source order. Do not choose weaker
symmetry or drop fields to make the case pass. `[V]` same instrument; FileState/PawnFileGroup/
PawnIslandPartition types and current semantic-validation.ts::SemanticMirrorValueRule/transformLeaf.

Both independent design preflights support one shared production helper, real retained Inspector
wrappers, exact source-demand/batch multiset proof, a five-path grammar extension and one closed
emits_exact positive event expectation. Cases still require independent board facts and the
accepted disclosed convention, as in material2; no recording of collector output as an oracle,
owner-store synthesis, old-case retag, ordinary activation or qualification from this model.
The coordinated active-parent draft still needs independent acceptance before implementation.
`[V]` existing compiler2 review receipt; current source plan; actual model and resolver paths above.


### 2026-11-09 — implemented shared source and exact-validation mechanism follow-through

The preceding disposable observations describe the pre-implementation grammar/composition. Both
independent reviewers subsequently accepted the coordinated active-parent amendments and code.
One production graph now supplies retained Inspector events, original input objects and their
existing source key through the runtime-owned validator. The actual579-edge singleton/batch
comparison and both-color nonempty source/API/selected DOM controls pass. Full15,418software/541
and seven performance checks, types/build/source-author11 pass. The five nested paths and typed
file transforms are represented; exact expectations use complete ordered populations and strict
canonical data while old witness cases stay unchanged. `[V]` foundation-edge-source.ts; runtime/
server inspector-local-source.ts; semantic-validation.ts/runner; foundation-edge-source.test.ts;
semantic-validation-current-source.test.ts; inspector-source-browser.test.ts; current source plan
and compiler2 independent review receipt (2026-11-09 shared-operation entries).

The new actual operation executes all579 sampled edges, producing seven imported-population arms
(58 receipts total). This leaves98subjects/419passing cases/four qualified; independent positive,
negative and orientation arms remain required. Opposition's corpus zero is retained as zero, not
a positive witness. D4171 closes representation; D4172/D4173 remain doing for complete independent
source populations/absolute partners. The exact62 prior content failure headings remain, so
D3928/native/content/release stay held. `[V]` generated semantic-validation receipt; literal profiles;
foundation-semantic-event.test.ts; current source plan; actual full gate29029/build-content70181.


### 2026-11-09 — first current-source independent qualification: opposition2

The current opposition event now has46 new canonical source propositions over24 independently
literal legal edges:18 exact complete populations, six genuine whole-family omissions and22
complete ordered mirrors. Both axes,2/4/6 gaps, gained/lost/holder changes, both colors, nulls,
full edge counters and horizontal partners are covered. Primary Python placement/role/color/turn
facts are retained from the pinned source; the already accepted king-opposition-unobstructed1
convention and§3.1 supply geometry/holder/sign. The source does not attribute opposition detection
or strategic value to Python. `[V]` semantic-validation-opposition-sources.ts; registered convention;
https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/chess/__init__.py
(Piece.from_symbol, _clear_board/_set_piece_at, FEN insertion and Board.set_fen).

Real fixed-resolver/source controls inject faults before genuine factory minting: absolute cases
reject symmetric wrong holders/forms/interiors/kings/signs while mirrors still agree. Duplicate/
split populations2 and omission0 fail exact expectations; changed expected arrays fail source
authority before execution. Missing nested FEN/interior walk rules and either/both corrupt clock
fields refuse. No manufactured evidence or resolver supports qualification. `[V]` semantic-validation-opposition.test.ts; both independent source/control/integration review entries in the
existing compiler2 receipt; final clean types/744focused controls.

All419 prior canonical rows remain unchanged;46 append. Actual generation is465/465passing,
98subjects/fivequalified/58populations. Only current opposition2's case arms advance; legacy1 and
other six current families keep their requirements. Final normal15569software/542, seven unchanged
performance/four, types/build/source-author11 pass; exact62 prior content headings remain. This
is source qualification, with full D4167 adoption and D4172/D4173 remaining six-family authority
still open. `[V]` literal cases/profiles/generated receipt; semantic-validation.test.ts and frozen
predecessor guards; current source plan and final61321/build-content35488 records.


## Four current pawn/file families independently qualified — 2026-11-09

[V] The independently reviewed28 literal legal edges now supply220 complete exact/negative/ordered-
mirror propositions for group1/state1/access1/islands2. They preserve physical causes, neighbor
metadata, triple front/rear order, multi-heavy occurrence order, stationary-versus-moving/new
pieces, island count/topology and empty shapes. Review added an actual stationary opposing heavy
on the destinationfile to falsify spurious open→own-half revelation. Expectations are explicitly
assembled board facts plus accepted product arithmetic, never recorded detector output.
Sources: semantic-validation-pawn-file-sources.ts; foundation-source-identity§§3.3/3.5/3.6; retained
primary text/licence in that source.

[V] Actual fixed resolver and production operation execute all220; symmetric wrong facts still
mirror but fail complete absolutes. Duplicate/omit/reordered populations and changed expected
arrays refuse (the latter before dispatch). Both full absolute partners anchor every orientation;
no canonical_set or empty-array scalar leaf claim. All prior465 rows remain unchanged;685/685
cases/98subjects/ninequalified/58censuses. Types/1471focused/full16296software+7performance/build/
source11 pass; exact prior62-heading content hold stays. Sources: semantic-validation-pawn-file.test.ts;
canonical cases/profiles/generated receipts; both independent source/integration entries in the
existing compiler2 receipt; current source plan53112/24235 gates. D4173 closes bounded file-domain
partners only. Backward2/physical-slider2 and all D4167 consumers remain; no ordinary policy,
capability/milestone/content/native/release completion.


## Current backward-pawn source independently qualified — 2026-11-09

[V]40literal full legal edges now supply74 complete exact/negative/orientation propositions for
backward2. Retained primary pseudo-pawn-control facts explicitly include pinned pieces; the accepted
product convention separately supplies narrow qualification, subject joins and membership. Exact
stationary-first/mover order, two same-file pawns, controller/capture arrays, support direction,
all stop occupancies, opponent half-open perspective, four EP losses and promotion's informational
changes are preserved. No final-rank backward pawn is invented. Sources: semantic-validation-backward-sources.ts;
retained primary text/licence; foundation-source-identity§3.2; current source plan.

[V] Actual fixed resolver/operation controls reject symmetric wrong fields even while mirrors agree,
wrong color/file pairing, extra/split/missing/reordered occurrences, quiet false events and changed
full expected arrays (before dispatch). Both independent reviews accept source/control/integration.
Every prior685 record/text prefix remains unchanged;759/759cases/98subjects/tenqualified/58censuses.
Full16596software/all544+7performance/types/build/source11 pass; exact prior62-heading content hold
remains. Sources: semantic-validation-backward.test.ts; canonical cases/profiles/generated receipts;
existing compiler2 review receipt; source plan46302/17592 verification. Physical-slider2 and all
D4167 consumers remain open; no ordinary policy, capability/milestone/content/native/release claim.


## All seven current source families independently qualified — 2026-11-09

[V] Physical-slider2 adds62 literal legal edges/116complete propositions:46exact/16negative/54
orientation. Original root/current ray identities, full near→far occupancy beyond first blocker,
endpoint exclusion, null/empty, moving/same-count/unchanged, capture replacement, all promotions,
standard+three960 castles and EP are exact. Expectations are manually supplied board facts plus
disclosed accepted line-blocker convention, never collector output. Source: semantic-validation-slider-sources.ts;
retained primary physical facts/licence; foundation-source-identity§3.4.

[V] D4174 exposed source-fault masking by legitimate latest-edge retention before qualification.
Real alternate legal inputs now evict before arming each fault; exact counts/helper executions
and a permanent actual retained-value/eviction control preserve production behavior.375source
controls including canonical join,2262focused/seven and full17087software/545+7performance/types/
build/source11 pass. Real fixed-resolver faults cover13symmetric errors, population corruption and
negative emissions, with altered arrays refused before dispatch. Prior759 records/rawprefix stay;
875/875cases/98subjects/elevenqualified/58populations. Exact62-heading content hold stays. Sources:
semantic-validation-slider.test.ts; canonical cases/profiles/generated receipts; existing compiler2
review receipt; source plan66738/39364 verification. All7current sources qualify, not the other87
subjects or legacy slider1. D4172/D4174 close only bounded source/instrument debt; D4167 and current
staged clauses still require coordinated full consumer amendments and implementation.

## Original candidate-owner graph and exact replacement image — 2026-11-09

**Question D4167:** can one finite source graph retain the original root across legal alternatives
and each child's original prerequisites across event and reading outputs, including available
empty event populations? The disposable `candidate-foundation-frame.test.ts` answers this bounded
composition question with the existing factories; it does not construct a production candidate
receipt, issue evidence, select ordinary hints or measure latency. `[V]` instrument, existing
`foundation-edge-source.ts` and `candidate-population.ts::compileLegalPopulation/compileRow`.

The four roots enumerate all29/29/6/15 actual legal alternatives in opposite-color capture,
same-file and castling positions. For exactly six common readings and the current seven event
families, independent composition versus shared ownership has identical complete payloads,
signs and legal edges. Actual route invocations are699→356,699→356,147→80,361→186. The baseline
does not acquire unused root snapshots merely to inflate this comparison. These are route-call
counts; nested helper work, full31-child-reading acquisition and end-to-end time are not measured.
`[V]` instrument; normal `make foundation-shared-operation-research`.

Original legal move members, root legal/connectivity sources and each child's corresponding
sources are retained by reference. Opposition/backward/group/file/island tuples use those exact
objects; revelation uses the exact file-change evidence also published in that edge population.
Both-color quiet populations genuinely emit no current events while retaining all six child
readings. The research-owned pointer guard rejects copied rows, missing inputs, crossed children
and genuinely sealed equal-byte root/child replacements. It models the existing owner's future
handoff, not production authority. Direct events-only execution preserves full event payloads and
required private inputs with no retained readings; readings-only does no root connectivity/event
work. Manual narrowing preserves references but does not test the production receipt projector.
`[V]` same instrument; `internal/evidence-value-routes.ts::readFoundationEventInvocation`.

### Native conditions replace duplicate collectors, not condition capabilities

All83 root/child samples across these complete legal populations compare56 file-condition
booleans each (4,648 comparisons): current group.isolated/doubled, null-group false, and complete
four-state file rows reproduce the old isolated/doubled/open/half-open truth. A specific a3→a4
advance changes the full a-file group while isolation and doubling remain true. A quiet king
move leaves both groups and file states unchanged, produces no such events and still supplies
their true position readings. Therefore membership_changed is not a flag toggle; unchanged
condition feedback must consume its snapshot. It must not be reconstructed as an old preserved
edge event. `[V]` instrument; `foundation-pawn-sources.ts`; `structure.ts` predicates.

The existing candidate vocabulary is44 event keys plus35 reading slots (31child and four edge/
candidate slots). The current ordinary fence is41, a strict subset: candidate-only keys are
trade_completed1, defender_exposure2 and role_asymmetry2. Registration/qualification alone has
not activated the new seven in either output image. `[V]` dedicated instrument audit using the
actual `deriveCandidatePacketProjectionGroups` and `ONE_EDGE_EVENT_REFS`, not a hand-copied count.

The independently audited replacement proposal is42 event keys plus the same35 reading slots:

| Retire from new public canonical outputs | Current replacement / retained meaning |
|---|---|
| backward_pawn1, king_opposition1, pawn_islands1 | exact backward2, unobstructed opposition2, island topology2 |
| isolated_pawn1, doubled_pawn1 | original group1 event/snapshot flags and members; literal flag-change views |
| open_file1, half_open_file1 | original file_state1 event/snapshot enum; exact open or perspective-half-open views |
| structural.line_blockers1 and transition.slider_ray1 | physical slider_ray2 with original root/direction/full interior; no endpoint-as-target claim |
| No prior counterpart | stationary file_access_revealed1; original file-change object retained |

Retain the four other structural families (king_zone, passed_pawn, piece_count, direct_attack_count),
the other12 transitions and19 other event refs. Moving-heavy open_file_occupancy1 is a different
physical cause, not the stationary-access event. Target-bearing slider1 raw evidence remains a
necessary PRIVATE discovery prerequisite: physical2 has no target. New learner execution must not
mint old boolean evidence from current views or run duplicate old/new collectors. These are
proposed dispositions for a coordinated successor, not production retirement. `[V]` current types,
factory dependencies and both independent audits in the existing compiler2 review receipt.

### Required contract scope discovered by following real callers

Changing localSemanticEventClosure immediately changes postcommitEdgeEvidence, candidate packets
and recorded eager acquisition. It cannot be hidden behind an unchanged41-ref declarative fence.
The successor must coordinate exact operation/acceptance/presentation images, literal native
signs/flag witnesses, complete Review populations and Nudge-only selection, private discovery,
recorded exact/eager capture/check parity and all declared typed abstentions. Recorded windows
still use their original11 successors/13 horizons; this source migration is not a window change.
`[V]` `postcommit-nudge.ts`; `recorded-semantic-path.ts`; both independent current caller audits.

Five old incoming Inspector topics (isolated/doubled/open/half-open/line-blockers) remain live;
their actual suppliers/pairs must retire in favor of the existing current topics/views too.
Both Sight paths, Play/Compare panels, both comparisons and guidance/voice/speech still require
the separately traced readout migrations. Full source fidelity does not choose salience or
authorize an ungrounded strategic caption. `[V]` `inspector-source-topics.ts`; existing source-plan
reverse map; `module-query-sources.ts`; `reading-evidence.ts`; comparison/guidance callers.

The nine proposed old public event refs own51 live cases and eight current population arms.
They cannot simply be deleted or retagged to a successor. Preserve original records/authorities
as test-only history while updating live root/profile/declaration/case/population joins together.
The existing frozen retired records remain untouched. Arithmetic would leave824 live cases,
89subjects/elevenqualified/50populations, to VERIFY after actual withdrawal; current truth stays
875/98/eleven/58. The retired wrapper is distinct from still-executed raw slider1 ancestry.
`[V]` dedicated literal image/case audit; semantic-validation-cases/profiles/operations and fixed
registry joins; independent retirement audit in the existing compiler2 review receipt.

Family/sign avoidance still discards subjects before counting moves; this cannot be adapted by
version substitution. Its successor must retain exact root/played/alternative subject states,
all same-move subjects and the full legal denominator. The retired bot vector is not a consumer;
actual Stage-A typed rows still have features:never[]. D1718/D1719 and D3662 remain explicit
mandatory handoffs, not claims discharged by acquisition. `[V]` `semantic-evidence.ts::familyKey/
selectSemanticEvidence`; current avoidance dossier; `bot-policy-compiler.ts`; bot-policy§5a.

Independent review accepts composition research only, with events-only/real-receipt/typecheck
limits recorded; follow-through added direct events-only controls and dedicated typechecks for
BOTH research files. No production graph/API, compiler version, ordinary consumer, case meaning,
pack, milestone or release state changes in this research pass. `[V]` instrument/config/Make
target; existing compiler2 independent review receipt. D4167 remains the whole adoption task.


### Finite total-state extraction probes — 2026-11-09

[V] The separate disposable total-foundation-states.test.ts tests the two missing source-state
extractions without production edits. A research copy of existing private ray algebra preserves
all occupied-piece/eight-direction rows, null versus adjacent-empty, ordered full blockers and
an unchanged ray with no emitted event. All four promotions have explicit current ray domains.
Actual existing sealed loose-piece readings under the exact current turn-clone rule retain
both-false non-king states, real enPrise true→false, invalid root clone even on an empty own-piece
domain, the actual child EP victim versus landing, all promotion roles and White/Black castles.
Complete both-color board domains come from the original legal source FEN; its pieces array is
side-to-move only. Sources: probe; foundation-slider-sources.ts; tactics.ts; legal-moves.ts.

The initial46157 run had33passes/one literal-ray failure: the model spread a Piece's extra
promoted:false into a narrower physical identity. Explicit color/role/square extraction fixes
the MODEL; the literal full expected ray stayed unchanged. Production source shapes did not
change. Final16683 normal make foundation-shared-operation-research strictly typechecks all
three files and passes41 tests/three in1.80s, including the earlier candidate graph/image study.
This is extraction feasibility, not a source factory/receipt ABI, qualification, full graph
consumer, natural prevalence or latency proof. Proposed source ABIs still require review/code.

The new subject-safe-semantic-selection.md draft links the immutable old selection contract and
active parents rather than editing the frozen contract. First/second independent reviews return
finite source/payload/vector/operation and consumer gaps. Repairs now explicitly separate the
seven current-event ordinary pairs from13 subject-safe avoidance families: the latter's26 future
consumer pairs stay held under newD4175, blocked onD1716 with a staged discharge. A source-first
contract cannot claim learner avoidance merely from registration. The current raw source/case
images stay unchanged. Sources: draft; existing compiler2 review receipt; source plan and ledger.


[V] Subsequent round3 review accepts the repaired source-first contract from BOTH independent
source/control and consumer/meaning reviewers. Exact risk identities, comparable played states,
closed complete-set/family validation and census, original source vectors and all13explicit
ordinary holds resolve the returns. This authorizes implementation; it does not implement or
qualify the new sources or deliver ordinary avoidance. D4175 retains26module pairs, fullD4167
retains every reverse consumer. Source: existing compiler2 receipt, round3 decisions; accepted
subject-safe-semantic-selection.md; current foundation plan.

### Review defender-exposure payload size — D4179, 2026-11-11

[V] The shipped exposure factory and its breadth closure agreed on eight positive and eight
quiet canonical exposure edges. The two legal checking controls each produced
`invalid_turn_clone` for exposure while the same closure retained 46 other events. A
family-level empty check would lose this distinction. The largest canonical occurrence was
3,274 JSON bytes. The largest canonical recapture tree had one node.
[Canonical cases](../../packages/runtime/src/semantic-validation-cases.json),
[checking controls](../../packages/runtime/src/defender-exposure-source.test.ts) and
[breadth closure](../../packages/runtime/src/semantic-evidence.ts).

[V] Two mirrored legal stress positions each emitted one exposure with four positive captures,
696 recursive recapture nodes and a 159,151-byte original payload. These are fixture measurements.

| Color | Before FEN | Move |
|---|---|---|
| White | `rN1rkN2/3q4/1n3n2/2B5/b5B1/8/8/R2RK3 w - - 0 1` | `c5b6` |
| Black | `r2rk3/8/8/B5b1/2b5/1N3N2/3Q4/Rn1RKn2 b - - 0 1` | `c4b3` |

To reproduce, play the given move legally and pass the canonical before and after FEN plus UCI
to `invokeEvidenceValueRoute("derived.tactic.defender_exposure@2", edge)`. For each positive
capture, count its top-level `branches` and recurse through each node's `continuation`. Measure
`Buffer.byteLength(JSON.stringify(evidence.payload))`. The positive-capture payload includes
the recursive branches and chosen line under the exchange convention.
[Factory](../../packages/runtime/src/evidence-factories.ts) and
[exchange result](../../packages/runtime/src/exchange.ts).

[V] Review's memo currently retains flattened evidence from `postcommitEdgeEvidence`, which
drops the exposure outcome. The existing dependent incoming-edge Inspector supplier already
retains original target-factory results and distinguishes unavailable from quiet. The ordinary
Inspector occurrence fitter budgets facts, words, marks and arrows. It does not measure JSON bytes.
[Review relations](../../packages/runtime/src/review-map.ts),
[post-commit edge](../../packages/runtime/src/postcommit-nudge.ts),
[dependent Inspector](../../packages/runtime/src/inspector-dependent-source.ts) and
[occurrence fitter](../../packages/runtime/src/module-query.ts).

[V] The White two-target fixture returned a8 then d7 from the direct factory. The breadth
closure returned d7 then a8. The Black fixture returned a1 then d2 in both. Passing a Review
display index to Inspector's factory order would inspect the wrong target.
[Two-target fixtures](../../packages/runtime/src/semantic-validation-cases.json) and
[breadth event ordering](../../packages/runtime/src/semantic-evidence.ts).

Independent design review proposes retaining the original factory ordinal before breadth sorts
its event wrappers. Review would keep its display order. An inspect action would check the factory
ordinal and evidence reference against Inspector's source response before opening its detail key.
The existing source-page contract preserves producer order. [Module registration](../../rfc/module-registration.md)

The returned D4179 amendment needs a bounded mechanical summary tied to the original evidence,
source-specific unavailable state on the selected move and an on-demand detail path for the full
continuation tree. The measured stress positions can verify pagination and transport bounds.

[V] A disposable paging model applied the existing exchange member grammar and renderer to the
White stress occurrence. It reconstructed all four original capture results after serializing
and decoding every page, including exact branch order, chosen moves and stop decisions. The
724 members took 91 pages at up to eight members and the existing 400-word limit. The largest
modeled page was 3,401 JSON bytes and the full traversal was 300,996 bytes. The model included
edge and controller context on every page. It did not measure HTTP envelopes, source acquisition
time or mounted UI behavior. [Existing exchange detail members](../../packages/runtime/src/foundation-snapshot-detail.ts)

The ordinary Inspect action should start with the defender change and the positive capture
options. Focused detail should show a selected capture's exchange line or a selected branch's
immediate continuations without making the learner page through unrelated branches. Keep a
complete original-order traversal for auditing.

[V] The independent caption review raised the pinned-defender case. Two additional legal
mirrored positions each emitted one exposure with two positive captures. Before the move the
knight is pinned on the b-file to its king. Its pseudo-control of the target is present, while
a legal knight move off the pin is unavailable. Review should describe lost geometric coverage
and the hypothetical material exchange. [Square control](../../packages/runtime/src/square-control.ts) ·
[Exposure join](../../packages/runtime/src/internal/defender-exposure.ts)

| Color | Before FEN | Move |
|---|---|---|
| White | `rk6/8/1nB5/2B5/8/8/8/RR2K3 w - - 0 1` | `c5b6` |
| Black | `rr2k3/8/8/8/2b5/1Nb5/8/RK6 b - - 0 1` | `c4b3` |


## Qualified outcome delivery cost — D4223 / D4175, 2026-11-11

All thirteen original-subject outcome families are now qualified. This pass measures the
**existing** application candidate service and real factories before ordinary Support/Review
adoption. The final workload uses the application's actual capacity64 constant, not a copied
configuration. Thirty-four fresh-process positions include sixteen literal boundaries and
18 positions from nine existing imported games;32 are nonterminal and expose773 legal
candidates in total. Each nonterminal position executes all13 factories/admissions once with
a cold service, then three times with the same original receipt. Initialization/PGN replay are
outside timing. These are fixed workload measurements, not a random sample. `[V]`
([instrument](../../tools/d4175-outcome-delivery/measure.ts),
[method and commands](../../tools/d4175-outcome-delivery/README.md),
[88,874-byte report](../../planning/foundation-source-identity/outcome-delivery-cost-2026-11-11.json))

| Operation / population | Median | Maximum |
|---|---:|---:|
| Cold acquisition + all13 sources/admission,32 nonterminal positions |395.21ms |650.08ms |
| Same operation,18 imported positions |521.53ms |650.08ms |
| Wide lookup alone,18 imported positions |431.60ms |518.45ms |
| Repeated acquisition + all13 sources/admission,54 imported repeats |84.83ms |133.13ms |
| Existing research selector after three repeats,18 imported positions |183.99ms |273.30ms |

The main operation includes original-receipt/member assertions and instrument overhead.
Post-pass equality checks and payload-size diagnostics are excluded. Selector timing is a
separate warm diagnostic; the selector invokes the families itself, so adding both operation
columns would double-count source work rather than describe an implemented workflow. All
emitted qualified outcome instances pass actual validation admission. `[V]` (same instrument/report)

The separate fresh-process stream runs **one game's32 consecutive decisions**, plies9–40,
with one capacity64 service and naturally warm runtime memos. Source acquisition/admission takes
**17,029.66ms**, including13,463.44ms of wide lookup; the slowest row takes842.59ms. It retains32
receipts with32 misses/zero hits. Sampled RSS rises from193.70MiB before the stream to1545.45MiB
after it. This is source-only execution, not a measured Review request or a cache-owned/leak
estimate. The existing Review contract has a5,000ms total collection budget and500ms optional
source bound. A simple eager insertion of this workload cannot be justified by the warm-cache
numbers; actual collection/budget behavior must be resolved before adoption. `[V]`
(report `reviewBatch`; [Review pagination contract](../../rfc/module-registration.md), “One Review job” paragraph)

The first passes produce2,922 qualified outcome events;2,656 (90.9%) are direct-control/ray
outcomes. One decision's complete outcome payloads occupy1,031,784 JSON bytes, with a largest
single payload of20,244 bytes and a maximum168 events in one decision. These populations remain
inside the measurement worker; only counts are saved. Volume alone does not establish teaching
usefulness. A learner module must retain exact subject/root/played/alternative grounding behind
its bounded view, rather than display this full population. `[V]` (same report/instrument)

Availability controls retain `loose_piece` unavailable in both literal clone-invalid positions
and one imported position; twelve other complete families remain available at the literal
witness. The actual existing **research** selector picks eight unqualified non-outcome facts
across seven positions (promotion, last-of-role, check and captured-zone-defender). Research
eligibility therefore cannot replace exact ordinary-source admission or consumer selection.
This is not a defect in a research-only consumer. All four distinct refused projection IDs
currently have `unvalidated` generated verdicts; the admission helper refuses them before
instance checks. `[V]` (same report; `semantic-validation-receipt.generated.json`; actual
`admitValidatedSemanticInstance` in `semantic-validation-registry.ts`)

Independent readback returned two instrument gaps: a shortened warm prerequisite vector could
escape comparison, and the advertised unavailable witness lacked an explicit assertion. The
repaired instrument checks equal vector lengths before ordinal identities, uses explicit
initialization even for empty populations, pins genuine risk unavailability, and refuses a NaN
selector clock. Final dedicated types and five source/instrument controls pass. The final check also
proves explicit/default imported-fixture equality; the optional
fixture path preserves the research helper's original default. `[V]`
([instrument tests](../../tools/d4175-outcome-delivery/measure.test.ts), current measurement log)

**Next:** D4224 owns actual acquisition/dependency/budget work; D4225 owns reachable-memory and
capacity attribution. Both precede D4175's independently accepted ordinary module/presentation
handoff. All26 family/consumer pairs, original source sharing, literal bounded captions, strict
receiving, assistance/role preflight and real selected API/DOM/voice delivery remain required.
No source, deadline, semantic profile, content/native gate or whole1.0 requirement is waived.


## Qualified outcome memory attribution — D4225, 2026-11-11

The same original32-decision stream now runs in three fresh workers with actual candidate
service capacities1/4/64. Each dispatches all13 real outcome factories and admits emitted
instances. All per-decision family availability/event counts and legal-move counts agree
across capacities. These counts do not prove full semantic payload equality. Forced GC occurs
before/after source work; automatic collections can still occur during work. A held/released
object control checks the observer, then original receipt WeakRefs are sampled after job
boundaries. The real service is read after its retained-GC phase, then released. `[V]`
([method](../../tools/d4175-outcome-delivery/README.md#d4225--retained-memory-attribution),
[instrument](../../tools/d4175-outcome-delivery/measure.ts),
[40,454-byte report](../../planning/foundation-source-identity/outcome-memory-2026-11-11.json))

| Capacity | Live receipt observers after retained GC | Heap with service retained | Heap after service release/GC | Live receipt observers after release |
|---:|---:|---:|---:|---:|
|1 |1 |576.97MiB |556.86MiB |0 |
|4 |4 |629.97MiB |557.12MiB |0 |
|64 |32 |1123.44MiB |557.12MiB |0 |

The table is a post-collection observation of these processes. Live-heap differences support
separating service retention from other remaining allocations, but are not an exhaustive
object-ownership census. After release, RSS still sits around1.36–1.41GiB while the observed
heap is roughly557MiB. Reducing the service cache alone therefore does not explain all
remaining live heap or guarantee an immediate RSS reduction. `[V]` (same report, `cases`)

Independent review caught a crucial observer effect: **constructing** a WeakRef, as well as
dereferencing one, keeps its target alive through the current job. This synchronous instrument
therefore temporarily pins all32 receipts even at capacity1. Its `afterWork` memory and
`workMs` are observer-influenced and cannot compare natural transient peaks, eviction timing
or throughput. Post-job retained/released observations remain useful within their stated
limits. Surviving observers after forced GC would not prove a leak. The report labels were
corrected without changing any measured values. `[V]`
([ECMAScript WeakRef constructor step4](https://tc39.es/ecma262/multipage/managing-memory.html#sec-weak-ref-target),
current instrument and report)

D4225 remains **doing**. The next causal experiment must inspect the actual retained global
memos after service release. Source inspection identifies bounded pure-reading caches in
`fen-memo.ts` and the factory memo in `evidence-factories.ts` as candidates, not proven causes
of the remaining557MiB. No production cache limit, source semantics, profile, deadline or
consumer activation changes in this research checkpoint. `[V]`
([reading cache](../../packages/runtime/src/fen-memo.ts),
[factory memo](../../packages/runtime/src/evidence-factories.ts); D4225)


## Actual global memo interventions — D4225, 2026-11-11

A disposable esbuild plugin appends count/clear closures to the **actual lexical** reading,
factory and parsed-position maps. It preserves every original module prefix byte-for-byte;
production files and source algorithms are unchanged. Memo-probe mode in an uninstrumented bundle refuses missing
hooks before source work. Two fresh workers execute the same32 decisions/all13 source and
admission paths at actual capacity64. Only after service release/collection do they clear
maps in opposite reading/factory orders, then parsed positions. `[V]`
([probe builder](../../tools/d4175-outcome-delivery/build-memo-probe.mjs),
[controls](../../tools/d4175-outcome-delivery/build-memo-probe.test.mjs),
[49,535-byte report](../../planning/foundation-source-identity/outcome-global-memos-2026-11-11.json))

| Intervention order | Owner released | After first clear | After second clear | After parsed-position clear |
|---|---:|---:|---:|---:|
| Readings → factory → parsed positions |557.17MiB |359.59MiB |329.37MiB |325.30MiB |
| Factory → readings → parsed positions |559.27MiB |543.15MiB |331.49MiB |327.42MiB |

All cells are post-job, post-forced-GC **heap-used** observations. The maps initially contain
11,614 pure reading entries across nine families,2,048 factory memo entries and2,545 parsed
positions. Every target must be nonempty before clearing and empty afterward; other map counts
must stay equal, and each next snapshot must join the preceding one. Both workers preserve the
same legal/family availability/event counts. Seven instrument checks, two actual-source builder
guards, dedicated types and both actual-map smoke/full runs pass. `[V]` (same report and
`measure.test.ts`; `make outcome-delivery-cost-check outcome-delivery-memo-smoke`,
`make outcome-delivery-memo-update`)

These are **order-dependent marginal effects**. Shared objects may remain reachable through
both caches, so a drop cannot be labelled exclusive bytes owned by one cache or added across
orders. Unchanged entry counts also do not imply unchanged transitive reachable bytes. The
previous WeakRef-construction/GC limits still apply; transient timing/afterWork data are not
natural-capacity comparisons. `[V]` (same original-map controls and retained/released method)

D4225 remains **doing**. These actual caches explain part of the retained heap, but the
roughly325–327MiB residual is still unassigned. Next sample retained allocation origins,
without storing a heap dump, before choosing a production cache policy. No deadline, source
semantics, ordinary binding, production cache/default or release state changes. `[V]`
(same report; unchanged production source files)


## Retained-allocation sampling — D4225, 2026-11-11

The isolated actual-source worker starts Node's in-process sampler at64KiB intervals after
an actual held/released array control:8,000,016 sampled bytes while held, zero after release
and collection. It executes the same32 decisions/all13 families, releases the service, clears
the actual three memo groups and collects before stopping. A deliberate post-startup failure
must disconnect the real inspector session. Scoped cleanup, count/self-size tests and actual
smoke/full runs pass; the bounded method was independently reviewed. `[V]`
([sampler](../../tools/d4175-outcome-delivery/sampling.ts),
[actual worker/control](../../tools/d4175-outcome-delivery/measure.ts),
[51,014-byte report](../../planning/foundation-source-identity/outcome-live-allocations-2026-11-11.json))

The final post-GC heap is325.66MiB. Sampled retained allocations total303.95MiB, of
which native `add` accounts for273.00MiB and native `set` for27.73MiB.
These are sampled allocation origins, not complete live-heap accounting or retaining roots.
The flattened native frames cannot establish which containers or authority metadata own the
remaining allocations. Bundle/module text is read only after sampling stops; an earlier
instrument image counted its own read and was discarded. `[V]` (same report and worker)

D4225 remains **doing**. Next isolate the native allocation call chains before choosing a
production repair. The report retains only aggregate self sizes/top30 allocation sites;
no raw sampling profile or heap snapshot is saved. Module comments are approximate source
hints. Previous WeakRef/forced-GC limits stand; sampler timings are not production throughput.
No production source, cache/default, deadline, admission or learner binding changes. `[V]`
(same method; D4225)


## Frozen-data verification metadata — D4225, 2026-11-11

Bounded caller context now associates the largest sampled native `add` allocation (256MiB)
with `freezeData` in `evidence-contract.ts`. This is allocation-origin context, not a retaining
root census. A separate disposable build changes exactly that module's known verifier
`const` to `let` and appends one reset closure; production remains unchanged. Neither identity
brands, value receipts nor source/invocation membership are replaced. `[V]`
([guarded builder](../../tools/d4175-outcome-delivery/build-memo-probe.mjs),
[transformation guards](../../tools/d4175-outcome-delivery/build-memo-probe.test.mjs),
[58,251-byte report](../../planning/foundation-source-identity/outcome-immutable-reset-2026-11-11.json))

The actual32-decision workload runs all13 qualified families before releasing the service,
clearing the three actual map groups and collecting. Post-sampling heap is334.63MiB;
another no-op collection and one real non-chess verifier insertion leave it unchanged.
Replacing only the verification WeakSet and collecting reduces it to78.63MiB. The
256.00MiB marginal effect identifies a concrete repair target. It does not prove
exclusive ownership, a strong-key leak, production memory/throughput or complete attribution.
The metadata-phase figures include diagnostic allocations after sampling and must not be
compared directly with the pre-stop325.66MiB figure. `[V]` (same report, `immutablePulse`)

Nine instrument/four builder guards, dedicated types, actual smoke and full worker pass.
Fourteen genuine both-color/special/empty/unavailable source controls preserve original
admission and receipt identity after reset, then re-execute all13 factories with equal full
payloads, exact prerequisite identities, family availability and fresh receipts. Independent
read-only review accepts the bounded diagnostic. The initial full pulse worker timed out;
only the terminal-success retry/reset report supports these results. `[V]`
([actual-source control](../../tools/d4175-outcome-delivery/measure.ts), same report)

D4225 remains doing. D4226 owns specification/review and measurement of a bounded pure
verification memo. It must preserve deep-own-data immutability, source/receipt bytes and
all authority checks; source omission and larger deadlines are not repairs. Other retained
metadata/service caches and D4224 acquisition remain independent work. `[V]` (D4225/D4226)


## Bounded frozen-data verifier candidate — D4226, 2026-11-11

The first65,536-add candidate is rejected: its four exploratory intervals are substantially
slower despite lower retained heap. Those intervals include PGN setup and are explicitly
not source-only proof. A single ordered262,144 proposal pair justified only amending the
finite bound; it establishes no speed or retention result. Both independent reviewers accept
the amended two-generation262,144-add policy and require genuine524,289-live-child rotation
controls. Production changes only the pure verification memo; all authority maps and existing
freeze/digest behavior remain. `[V]`
([accepted RFC](../../rfc/archive/bounded-evidence-verification.md),
[rejected candidate](../../planning/foundation-source-identity/bounded-verifier-cap65536-rejected-2026-11-11.json),
[proposal](../../planning/foundation-source-identity/bounded-verifier-capacity-probe-2026-11-11.json),
[rotation controls](../../packages/runtime/src/evidence-contract.test.ts))

The final ordinary builds compare the exact committed original verifier with the current
candidate, using the same remaining source graph. Separate workers compare all32 complete
packet/foundation/outcome/availability graphs and traversed value receipts. Repeated calls
retain exact original prerequisite identities within each side. Four fresh sequential pairs
alternate order; PGN setup precedes the initial GC/clock. There are no profiler, WeakRef,
map-clear or reset hooks. Forty-two focused controls/types and complete equality pass. `[V]`
([driver](../../tools/d4175-outcome-delivery/compare-verifier.ts),
[controlled ordinary builds](../../tools/d4175-outcome-delivery/build-verifier-comparison.mjs),
[15,731-byte report](../../planning/foundation-source-identity/bounded-verifier-cost-2026-11-11.json))

| Pair/order | Baseline source ms | Candidate source ms | Baseline released heap MiB | Candidate released heap MiB |
|---|---:|---:|---:|---:|
|1/baseline→candidate|18525.4|17707.3|557.45|317.16|
|2/candidate→baseline|18707.5|19103.7|557.45|317.47|
|3/baseline→candidate|18508.1|17430.8|557.45|318.58|
|4/candidate→baseline|19303.2|18010.8|557.14|317.19|

Candidate source time is lower in three pairs and higher in one. Sums are75044.2→72252.6ms
(3.72% lower locally); this is not a portable speed claim. Held heaps are roughly
1123.4–1123.7→883.5–884.9MiB; released heaps are557.1–557.5→317.2–318.6MiB. The roughly239–240MiB
reduction appears in every pair. These are forced-GC observations, not natural peaks, immediate
RSS return, exhaustive ownership or a complete appliance footprint. Source/admission timings
are not API/DOM latency or a solved Review budget. `[V]` (same report)

The canonical writer passes all1928 cases/89subjects with24 qualified. Independent comparison
normalizes exactly11 helper-file additions/operation hashes and63 joined population hashes;
whole stored JSON is otherwise identical, including all461 vectors/cases/externals/verdicts.
The4,341,526B artifact remains under5MiB and compact runtime metadata changes only its matching
receipt SHA. Full frozen-production gates pass20500software/581 and7performance/four, types/build/governance; final stronger cycle/sparse assertions pass42 focused afterward. Both independent reviewers accept finite D4226 archival/closeout. D4224/D4225/D1716 remain open. `[V]`
(same source writer/current generated receipt and independent metadata review)


## Current acquisition attribution — D4224, 2026-11-11

The ordinary source image remains18f199ed. Disposable TS-body instrumentation preserves every
original statement between guarded observers; erasing only observer syntax restores exact
source. Two builds and separate fresh workers retain the normal capacity64 service and all13
families. Active-counter equality compares all32 complete graphs/receipts and original repeated
prerequisite identities. Compiler calls32, legal alternatives1286 and outcome-family calls416
must match actual source counts; real reading compute misses must be nonzero. Four instrument
and two original-source guards/types, actual profiler-failure cleanup, smoke and full run pass.
No production file or source issuer changes. `[V]`
([instrument](../../tools/d4224-acquisition-profile/build.mjs),
[driver](../../tools/d4224-acquisition-profile/run.ts),
[method controls](../../tools/d4224-acquisition-profile/profile.test.ts),
[56,762-byte report](../../planning/foundation-source-identity/acquisition-profile-2026-11-11.json))

Prepared-workload intervals are ordinary18881.2ms, ordinary-source CPU
sample19756.7ms and instrumented/sample21333.0ms.
This is one ordered diagnostic, not a speed comparison. Spans include observer overhead;
CPU leaf samples are approximate attribution, not exact elapsed costs. The ordinary-source
sample separates real function distribution from hot span-wrapper overhead. Raw profiles are
discarded; module comments/callers are hints. `[V]` (same report and driver)

| Diagnostic body | Actual calls | Inclusive ms | Interpretation |
|---|---:|---:|---|
| Cold compiler |32|17010.2| All complete wide acquisitions |
| Local event closure |1286|5762.2| One per legal alternative |
| Child readings |1286|6727.0| One per legal alternative |
| Sole mint |211230|10166.3| Nested in collectors; cannot add to their time |
| Evidence declaration |211230|8817.7| Nested in mint; includes sealing |
| Original piece mapping |3954|44.0| Repetition is real but not a material target here |

Inclusive parents overlap; do not sum this table. The event/child-reading calls are the two
sequential per-row calls in `compileRow`; their disjoint spans total roughly12.5s in THIS
diagnostic. That is not predicted removable time: they may warm required downstream work.
The repeated-lineage cache hypothesis is deprioritized by3954 calls/44.0ms,
not accepted from repetition alone. Packet validation is also called21452 times but totals
only289.5ms diagnostically; call volume is not a hotspot verdict. `[V]` (same report;
[cold row](../../packages/runtime/src/candidate-population.ts))

Ordinary-source sample leaders includefreezeData(15.2%),
canonicalPart(14.2%), weak-memo add(6.8%) and
native digest(5.7%). Sample fractions are aggregated across recursive
contexts using exclusive leaves, never inclusive stacks. High-frequency instrumented digest
self-time is not substituted for this ordinary distribution. `[V]` (same report, `cpuOnly`;
[CPU aggregation](../../tools/d4224-acquisition-profile/cpu.ts))

D4224 remains doing. D4227 asks whether a scoped foundation acquisition can preserve every
required common/total/ray/risk input and thirteen-family result without eagerly materializing
unrequested candidate facts. Current algebra also authenticates collector unavailability;
that must be addressed honestly in any future contract. The first experiment must return only
unadmitted raw data, not forge a wide receipt or skip a claimed source/failure check. Future
full collection must remain available and share original sources through one compiler.
No production optimization, source omission, budget increase or consumer completion follows
from this profile. `[V]` (D4224/D4227;
[actual outcome input/guard](../../packages/runtime/src/semantic-subject-outcomes.ts))


## Scoped required-core feasibility — D4227, 2026-11-11

The disposable instrument appends private-core access to the existing compiler module and a
guarded clone of the actual raw outcome algebra. Original production bodies remain unchanged.
Acquisition calls the real legal enumeration, child application, foundation sources and original
input validators. The raw calculation deliberately does **not** claim a candidate receipt or
unacquired legacy collector-failure image. Actual candidate/factory/invocation readers refuse
its frame/results. Two exact-source restoration/anchor guards and dedicated types pass. `[V]`
([instrument](../../tools/d4227-core-acquisition/build.mjs),
[guards](../../tools/d4227-core-acquisition/build.test.mjs),
[driver](../../tools/d4227-core-acquisition/run.ts))

All48 positions compare complete required root/child graphs and every traversed input receipt,
all13 raw payload/input/population images, and genuine existing factory payloads/populations.
Repeated calculations retain original inputs within each core. This includes16 literal positions
covering both colors, castling, en passant, promotion, forced moves, unavailable risk and two
terminals, plus32 imported-game decisions. There are286 quiet,310 positive and2 unavailable
family results, with26 terminal-family refusals. The full source records23 legacy collector-failure
groups, explicitly outside this raw core's coverage. Matching these required inputs/results is
**not** matching the whole wide packet or granting source/admission authority. `[V]`
([42,214-byte report](../../planning/foundation-source-identity/core-acquisition-2026-11-11.json),
[fixed workload](../../tools/d4175-outcome-delivery/workload.ts))

Both timed arms acquire and calculate all13 raw families, stopping BEFORE outcome mint/admission.
Full uses the normal64-entry application service; core retains32 research frames without
implementing a service/cache. Four fresh-worker pairs alternate order. PGN preparation precedes
the initial GC/clock, and the actual owner is read after held GC before release. `[V]` (same driver/report)

| Pair/order | Full raw source ms | Required core raw source ms | Full held/released heap MiB | Core held/released heap MiB |
|---|---:|---:|---:|---:|
|1/full→core|16923.3|6088.7|881.14/316.90|395.29/187.55|
|2/core→full|16317.4|6262.7|881.10/316.90|395.29/187.55|
|3/full→core|15901.8|6002.5|882.15/317.99|395.31/187.55|
|4/core→full|15540.4|5621.0|882.19/317.99|395.31/187.56|

Required-core acquisition is lower in every local pair; sums are64682.9→23975.0ms. These are
feasibility results for intentionally different collection scopes, **not** a transparent optimizer
of the full packet, portable speed, the prior admitted-event workload, API/DOM responsiveness or
an appliance memory certificate. Forced-GC heaps are not natural peaks/RSS or a root census.
The current full-production path is unchanged. `[V]` (same report)

The experiment supports a scoped-acquisition contract, with two obligations still explicit:
(1) one genuine owner must preserve original shared sources and full event/readings collection
when requested, with declared not-requested/available/unavailable/failure semantics; and
(2) even the raw core's32-decision intervals exceed Review's existing5,000-ms job budget BEFORE
outcome mint/admission. D4224 therefore still needs bounded execution/cancellation and real
application/module performance proof; a slimmer source alone cannot close it. D4225 remaining
full-owner/global-cache costs, D4175 ordinary adoption and D3928 content/native/release remain.
No production implementation, source qualification, lost feature or increased deadline follows
from this experiment. `[V]` (same report; `rfc/module-registration.md` §Review pagination;
`rfc/subject-safe-semantic-selection.md` §§1/6)
