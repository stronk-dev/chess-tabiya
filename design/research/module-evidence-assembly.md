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
