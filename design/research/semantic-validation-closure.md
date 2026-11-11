# Semantic validation closure — from shape checks to executable authority

**Current boundary — 2026-11-11:** the older checkpoints below are historical. `[V]`

The current writer passes1,928/1,928 canonical cases over89 subjects;24 satisfy their own
required arms. All thirteen original-subject outcome families qualify. The404 added cases
retain all1,524 earlier case receipts and84 other verdicts exactly. Consumer admission,
application reach and ordinary guidance remain separate. Full normal verification of this
coordinated cutover passes20,488 software tests/580files and7 performance tests/fourfiles. `[V]`
(`packages/runtime/src/semantic-validation-receipt.generated.json`,
`packages/runtime/src/semantic-validation-profiles.json`;
`planning/foundation-source-identity/plan.md`)

The shared case-storage migration is independently complete and archived. Its committed
normal software run passes19,320 tests/575files and seven performance tests/four files;
all original cases and semantic receipt fields are preserved. This storage change adds
no qualification. `[V]` (`rfc/archive/semantic-validation-case-storage.md`;
`planning/foundation-source-identity/plan.md` §2026-11-11 D4215/D1)

**Question:** Do the 67 semantic-event declarations' `validation` fields bind independent,
executable evidence that each named chess predicate can both fire and refuse?

**Status:** answered `[V]` at 2026-08-26 HEAD and refreshed at 2026-08-29 HEAD. The answer is
**no for 67/67 declarations**.
Some implementations have substantial unit and research coverage, but none of that coverage is
resolved through the manifest's validation identifiers. The manifest therefore proves declaration
shape, not semantic validity.

**Instrument:** `tools/d1711-semantic-validation-closure/`. The five able-to-fail checks run under
the repository's pinned Node 24 and derive the declaration set directly from the runtime export.

## Result

The register creates all 67 `SemanticEventDeclaration` rows by mapping the event projection list.
For every row it manufactures exactly two strings:

- `semantic-event:<projection>:positive`
- `semantic-event:<projection>:hard-negative`

`compileEvidenceManifest` requires only two non-empty string arrays. Its diagnostic says the event
needs *executable* fixtures, but it does not resolve an id, call an emitter or inspect a chess
position. `[V]` (`packages/runtime/src/evidence-catalog.ts:947-965`;
`packages/runtime/src/evidence-contract.ts:558-577`; D1711 harness tests 1–2)

The only all-event test is generated from the same declaration list. It invents one value for each
declared operand, calls `declareEvidence` directly, and checks that the resulting structural object
compiles. Its negative removes whichever operand happens to be first and checks the generic
`EVIDENCE_EVENT_OPERAND_MISSING` diagnostic. It then regenerates the same 134 labels and compares
the two sets. No production emitter is called to decide whether the named relation is true or
false. `[V]` (`packages/runtime/src/semantic-evidence.test.ts:67-103`; harness test 5)

That means a collector could return the opposite chess result while all register validation checks
remain green, provided its output object still contains the declared fields. `[M]` This is the
semantic analogue of the repo's previously measured green-by-construction instruments: the test
and implementation share the assumption that should have been independently falsified.

## The validation ids have no executable referent

Across all TypeScript/Svelte under `packages/`, `apps/` and `tools/`, none of the 134 concrete
validation labels occurs outside the catalogue/generic-census construction. There is no fixture
registry, resolver or test dispatcher keyed by those ids. Exactly two code paths read the arrays:

1. the compiler checks non-empty strings; and
2. the generic census compares regenerated strings.

Neither resolves or executes a fixture. `[V]` (D1711 harness test 2)

This is stronger and narrower than “the collectors are untested.” Outside the generic census,
**66/67** projection ids are now at least named by an executable runtime or disposable research
test; **27/67** are named in runtime/application tests and **66/67** in research tests, with
overlap. The 2026-08-26 census was 54/67 named and 49/67 research-named; later foundation
instruments increased trace coverage without creating a fixture resolver or changing the semantic
validation verdict.
Literal naming is only a lower-bound trace signal, not proof that the test establishes the event's
semantics. `[V]` (D1711 harness test 3)

The remaining **1/67** not named by another executable test is
`rules.structural.event.king_zone`. `[V]` The full set-equal 67-row mapping, including every runtime
and research test path containing each literal id, is emitted by `make semantic-validation-closure`
(D1711 harness test 3). This must not be interpreted as one known-broken detector: literal naming is
still only trace evidence, and all 67 events remain without a manifest-resolved independent
validation case.

## The external-population field overclaims by construction

All 67 declarations carry the identical
`r2-imported-sample@a10a...fa58ec` token. The digest is the retained 108-game/579-decision PGN
**input**, not a per-event result. The corresponding frozen F2 baseline says its manifest contained
33 semantic events. Only **29** current event ids occur in its authored/imported output; **38/67**
current ids do not occur at all. `[V]` (`tools/r2-selection-harness/fixture.json`;
`tools/r2-selection-harness/f2-baseline.json`; D1711 harness test 4)

Four implications are separate:

1. a population digest proves reproducible input bytes, not that a predicate is correct;
2. a zero occurrence cannot supply a positive witness;
3. events added after the 33-event baseline cannot inherit its external-validation claim merely by
   pointing at the same file; and
4. even an observed event needs a result digest joined to its exact predicate/version before the
   observation can serve as a regression authority.

`[M]` Therefore `externalPopulation` is useful provenance but is not a validation certificate. It
must retain both input and result identity and say which event/version was actually evaluated.

## What existing tests genuinely contribute

The repair must preserve rather than discard the strong work already present:

- detector conformance supplies one positive and one hard-negative matcher fixture for all 18 raw
  structural kinds, but explicitly refuses to call those semantic learner events;
- `semantic-evidence.test.ts` has real focused checks after its generic first test for castling
  normalization, independent transition properties, capture class, pawn islands, loose pieces,
  trades, discovered execution, rule events and complete-alternative selection;
- `breadth-semantic.test.ts`, `semantic-tactics.test.ts` and
  `semantic-tactic-sequences.test.ts` exercise many exact/identity-retaining producer paths and
  semantic near-negatives; and
- D872's research suite supplies canonical distinctions, imported prevalence, counterfactual
  boundaries and external Lichess-theme disagreement for selected tactic families.

`[V]` (`design/research/detector-semantic-conformance.md` §§Method–Transition conformance;
the named runtime test files; `design/research/basic-semantic-tactics-stage-0.md` §§6–8)

The defect is that none of these authorities is a checked member of the declaration contract. A
test can be deleted, renamed, stop calling the real emitter, or cease covering a projection while
the manifest continues to advertise the event as validated. `[M]`

## Required contract boundary

Research permits a new validation authority with these properties:

1. **Independent identity.** A validation id resolves through one checked registry to an
   executable case; it is never synthesized from the declaration under test.
2. **Production-emitter execution.** A positive invokes the actual collector/deriver and proves the
   exact projection/version is emitted. A semantic hard negative is a nearby legal position or
   sequence for which that emitter abstains; deleting a payload field remains a separate contract
   shape test.
3. **Total validation profile.** Every event states whether positive, hard negative,
   mirror/orientation, counterfactual, imported-population and external-labelled arms are required,
   present, or inapplicable with a reason. Not every literal state event needs every arm, but silence
   cannot mean either.
4. **Result identity.** Population checks bind predicate/version, input digest, result digest,
   denominator and positive count. A new projection receives no inherited external status.
5. **Set equality and non-vacuity.** Declarations, fixture registry and executed receipts are
   compared in both directions. Each required positive must observe at least one event; each hard
   negative must reach the emitter and observe none. A mutually omitted event fails independently.
6. **Consumer gate.** “Validated” eligibility for a learner module, Review, bot feature, skill or
   longitudinal metric depends on the executed receipt, not the presence of label strings. The raw
   inspector may retain explicitly unvalidated atoms under its separate policy.

`[M]` These requirements do not choose chess truth. They make existing authored, rules-derived,
engine/tablebase and externally labelled authorities executable and prevent the registry from
claiming more than those sources establish.

## Roadmap consequence

This pass does not reopen collector research wholesale and does not authorize implementation.
It inserts one foundation gate before D1710's emitter wiring and Phase 3 module activation:

1. author and independently review a semantic-validation-authority RFC over the existing evidence
   contract;
2. migrate the strongest existing tests into the checked fixture registry without weakening their
   assertions;
3. mark genuinely missing arms as explicit discharges owned by their collector RFC/research wave;
4. run the complete matrix before production admission; then
5. wire D1710's emitters and activate modules only for events whose required profile passes.

`[M]` This ordering avoids putting 67 formally “validated” but semantically unchecked events into
Support, Review, bots, campaign rewards, packs and player-style aggregation—the exact breadth
multiplication the owner asked the foundation to survive.

## Limits

- Literal-id naming is a conservative trace census, not semantic proof; computed families can be
  exercised without repeating their projection id. `[V]`
- This pass did not judge whether every existing chess fixture is correct. It measured whether the
  manifest can prove and retain that judgement. `[V]`
- External Lichess puzzle themes are incomplete labels and cannot be the sole ground truth; D872's
  disagreement posture remains. `[V]` (`basic-semantic-tactics-stage-0.md`)
- No learner UX, module default, pack content or collector implementation changes in this pass.

## 2026-10-08 — actual orientation payload boundary (D3564)

**Reproduction:** `make semantic-validation-matrix` runs the existing opt-in instrument,
including `tools/d1713-semantic-validation-matrix/mirror-boundary.test.ts`. It invokes real
production operations without registering cases or admitting chess authority. Thirteen
checks pass: ten boundary/proposal checks and three existing migration-matrix checks. D3565
corrects one stale counterfactual test title, preserving its composition-only classification.
No raw recording, new controller or canonical CI dependency is introduced. `[V]`

Four legal color/vertical mirror controls cover White castling, Black castling, en passant
and promotion in both directions. The existing input helper recomputes the legal successor,
including the changed fullmove progression. The suspected counter defect is therefore
**refuted**, not queued as another bug. `[V]` (research fixture controls;
`packages/runtime/src/semantic-validation-runner.ts`, `assertSemanticMirrorPartnerInput`)

The actual castling observations retain `before_fen`, `move_uci` and `after_fen`, alongside
their semantic operands. Neither real castling direction can pass the total operand walk:
leaving these fields uncovered fails; declaring identity still fails; isolating each leaf
against each of the five allowed value rules cannot compare it. Removing those three fields
in a disposable diagnostic copy makes the semantic fields compare, but **dropping input
fields is not the proposed product repair**. The bounded census finds the same retained
input fields on thirteen projection kinds within thirty migrated positive edge cases. This
is a measured sample, not a census of all 81 subjects. `[V]` (research tests;
`packages/runtime/src/semantic-validation.ts`, `compareSemanticMirror`)

### Narrow amendment proposal — not accepted behavior

Extend §4.1's closed value vocabulary with `input_before_fen`, `input_move_uci` and
`input_after_fen`. Require a legal, canonical source/partner input pair first. Each raw
operand leaf must exactly equal its own side's declared input field, clocks included;
comparison then uses the same relative input-field identity. Retain every operand key
and continue comparing every other semantic leaf with the existing total walk. `[M]`

The disposable model succeeds in both real castling directions. It refuses corruption of
any input field on either side, clock-only changes, missing or extra operands, a changed
semantic destination or sign, and a crossed partner. These are feasibility controls,
**not independent orientation authority**. No production adapter, arbitrary callback,
ignored field, weakened exactness or new admitted case follows from them. Author amendment
and separate review must settle the closed rules before production parser/runner changes.
After that repair, independent required-arm fixtures are still needed. `[V]` (research
`proposedCompare` controls; `[M]` for the proposed production contract)

### Separately specified repair (D3566)

The accepted RFC already requires partner input checks before either operation. A
predecessor-red permanent test observed one invocation and a target on a missing partner.
The runner now preflights missing/crossed partners and independently corrupted input
fields before either collector. A valid pair still reaches both collectors and the
separate total comparison. All 158 focused foundation tests pass. This closes execution
ordering only; it does not implement the D3564 vocabulary proposal or promote a semantic
verdict. `[V]` (`packages/runtime/src/semantic-validation.test.ts`,
`packages/runtime/src/semantic-validation-runner.ts`, `make evidence-foundation-check`)

## 2026-10-12 — whole-event negative feasibility (D3745)

Accepted validation §3.2 requires each live event root to have a legal same-operation
negative omitting the entire projection. The current runner's `omits` expectation rejects
any target observation. D3687/D3690 already identify four incompatible complete-state
families. This audit adds a fifth, despite its sparse construction. `[V]`
(`rfc/semantic-validation-authority.md` §3.2;
`packages/runtime/src/semantic-validation-runner.ts`, `omits`;
`planning/platform-alignment/semantic-state-negative-contract.md`)

| Event root, version 1 | Actual local-edge output and construction |
|---|---|
| `rules.structural.event.piece_count` | Twelve role/colour observations, including unchanged/zero counts; unconditional reading and before/after join |
| `rules.structural.event.pawn_islands` | Two colour observations, including unchanged/zero counts; unconditional factory mapping |
| `rules.king.event.zone_state` | Two colour transitions, including empty deltas; unconditional legal-edge mapping |
| `rules.tactic.consequence.reply_breadth` | One reading even at terminal zero replies; single-result factory |
| `rules.square.event.control` | Sparse gained/lost edges, but controller origin is part of identity and pseudo attacks include friendly-occupied targets. A moved physical piece loses origin-bound edges |

The table is source-checked `[V]`: `structure.ts` / `computeStructuralReading`,
`semantic-evidence.ts` / `structuralSemanticEventPayloads`, `king-state.ts` /
`kingZoneEvents`, the three corresponding factories in `evidence-factories.ts`, and
`square-control.ts` / `pseudoFor`, `edgeKey`, `squareControlEvents`, all under
`packages/runtime/src/`. The square-control argument is bounded to the current legal
standard-chess operation: each movable role has nonempty geometric attacks from its
vacated origin; promotions and castling still relocate a physical controller. It is not
a claim about arbitrary variants or merely a report of unchanged controlled destinations.

The disposable `tools/d1713-semantic-validation-matrix/state-boundary.test.ts` invokes
the real production operation and selector. It enumerates all 127 legal successors from
eight positions: initial White/Black (20 each), bare kings (8), en passant (7), promotion
(9), castling (26), bishop (14), queen (23). Every successor retains all five families.
Mate retains zero-pawn counts/islands and a terminal zero-reply observation. A quiet
edge omits the conditional check event, while mate emits it; null moves and a wrong
after-FEN refuse. These are genuine emitter controls, not synthetic empty payloads. `[V]`
(the disposable fixture; `make semantic-validation-matrix`: 97 passing checks/four files)

An earlier run failed because this research fixture expected `legalReplies` rather than
the production `replies`/`count`/`terminal` fields. The fixture was corrected against
`tactics.ts`'s `ReplyBreadth`; no product defect, deadline relaxation or failed-run pass
is claimed. `[V]` (fixture and actual `ReplyBreadth` declaration)

**Repair handoff, not accepted semantics:** reuse D3690's existing author handoff for
all five roots. Property-specific negatives must state precisely what independently
grounded property and operands they falsify; one property cannot qualify the whole
payload. Versioned successors need replay/consumer/content compatibility; a generic
changed-only filter cannot make square-control disappear. Invalid input, unavailable
sources or zero values cannot discharge whole-event omission. `[M]` (repair constraints
and alternatives; no choice or implementation authority)

This audit registers no canonical cases, rewrites no profile and changes no collector,
eligibility or learner permissions. The finite population corroborates code construction,
not exhaustive chess-position coverage. D3745 closes research only; D3687/D3690 retain
the author/review blocker. No protected intent sentence or thesis gate is overturned. `[V]`
(owned change set; existing authority plan and state-negative handoff)

## 2026-10-13 — full registered-case retained-input inventory (D3781)

The October-9 D3564 proposal binds three root spellings, but real collectors also emit
`beforeFen`, `moveUci`, `afterFen` and Check's `triggeringMove`. The existing disposable
mirror instrument now executes all 343 registered cases through their actual operations,
selecting each exact subject/version and retaining target absence. This is execution for
inventory, not independent-authority resolution or qualification. `[V]`
(`tools/d1713-semantic-validation-matrix/mirror-boundary.test.ts`;
`packages/runtime/src/semantic-validation-cases.json`; `rfc/semantic-validation-authority.md` §4.1a)

All 343 invocations complete: 251 edge, 56 recorded-path and 36 bounded-target inputs.
There are 144 absent targets, 495 target observations and 5,443 retained FEN/UCI leaf
occurrences. The registered cases cover 56 of 81 declared subjects; the other 25 are not
observed by this inventory. `[V]` (same instrument; `make semantic-validation-matrix`)

| Relationship to the case input | Leaf occurrences | Distinct projections |
|---|---:|---:|
| Original three root spellings, equal to the own edge input | 672 | 25 |
| Other root spellings, equal to the own edge input | 313 | 17 |
| Nested leaves equal to a root input value | 34 | 5 |
| Edge-case leaves unequal to root input values | 25 | 6 |
| Recorded-path or bounded-target case inputs | 4,399 | 14 |

Counts overlap at projection level and count repeated observations, not useful facts or
coverage percentages. Nested value equality does not establish frame ownership. Unequal
edge leaves include actual reply/capture/exchange continuation moves, not necessarily bad
data. Non-edge inputs are not coerced into root-edge bindings. `[V]` (instrument's
`retainedInputScope`, exact paths in its generated inventory and actual selected payloads)

**Bounded draft repair:** retain three value kinds with seven exact root spellings. Bind
each leaf to its own legal edge, permit distinct legitimate aliases together, refuse
duplicate/crossed/nested/unlisted paths, and preserve every other payload leaf. Prototype
controls include actual direct/discovered Check pairs and both castling directions,
corrupt inputs/operands and payload immutability. No generic alias inference or omission
rule is proposed. `[V]` (instrument; amended draft §4.1a)

The whole research matrix passes 106 checks/four files. Two intermediate Check controls
failed because my model omitted promoted-piece metadata; the total walk caught that
omission, and the metadata is now retained. An earlier full-console report was truncated
and could not be parsed; its saved bounded inventory was read instead. The final generated
report is 93,369 bytes, contains counts/paths rather than raw FEN/UCI values, stays ignored
under `.cache/`, and is not required by CI or progress checks. `[V]` (instrument, final
`make semantic-validation-matrix` run and ignored generated report)

**Still required, not solved:** independently accept and implement the root grammar;
declare exact nested/continuation and recorded/bounded input relationships; supply the
missing case families and independent orientation/population authorities. The prototype
cannot qualify a collector or make guidance available. Production grammar, canonical
cases, profiles and generated semantic verdicts are unchanged: 343 passed execution
cases do not mean any of the 81 profiles is fully qualified. `[V]` (owned change set,
existing authority plan and generated semantic validation receipt)

## 2026-11-05 — first authority-bearing local orientation candidate

[V] The current generated receipt marks `rules.transition.event.castled@1` unvalidated with
orientation as its only open cell. Accepted semantic-validation-authority Slice B and §4.1a already
provide the local one-edge operation, complete retained-input comparison and total operand walk.
`semantic-validation-orientation.test.ts` executes the mechanics with an injected test resolver;
those fixtures are not canonical authority and cannot simply be promoted.

[V] Independent preflight identifies the smallest genuine case-data lane (D4163). The retained
`semantic-validation-cited-sources.ts` python-chess `is_castling` source establishes castling
membership, but does not define the resulting king square. Total mirrored equality alone can
accept two symmetrically wrong destinations. A new authority must also ground absolute values.
The existing pinned primary `Board.push` implementation chooses the king's c-file destination
for the a-side and g-file for the h-side, with the rank determined by mover color. Verified at:
https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/chess/__init__.py
(`Board.push`, castling branch); raw primary:
https://raw.githubusercontent.com/niklasf/python-chess/3516d7c6c0879af724c2855fac5a304a4ef40949/chess/__init__.py .
This is a literal rules/source observation, not strategic judgement or a move grade.

Planned bounded proof: preserve the four existing cited cases unchanged; register independent
absolute king-destination expectations for both wings/colors; add source-bound color/vertical
orientation pairs with the complete existing walk; prove that a symmetric wrong-destination pair
can satisfy geometry but fails the absolute canonical proposition. Use actual production runner,
original authority resolver and profile references. No injected resolver, invented owner receipt,
new oracle/comparator/case-transform framework or wider variant/recorded/bounded claim. Actual new
case construction/execution and any qualification change are still owed.

## Complete all-square control reference — 2026-11-11

The `direct_attack_count` original-subject family measures128 fixed color/square subjects,
including empty, pawn, king and friendly-occupied targets and explicit zero values. It uses
current-occupancy geometric controllers, including pinned pieces, and stops slider attacks
after the first occupied square. It is different from legal destinations and from the old
structural event's nonpawn-target subset. `[V]` (`packages/runtime/src/square-control.ts`
`pseudoFor`/`grouped`; `packages/runtime/src/semantic-subject-outcomes.ts`
`direct_attack_count`; the retained Python attacker rules in
`packages/runtime/src/semantic-validation-literal-sources.ts` `ATTACK_CITED_SOURCES`)

`make semantic-control-source-research` typechecks the disposable research and passes34
checks in2.58s overall. An independent FEN placement decoder and piece-offset/ray arithmetic
compare every root, chosen successor and legal alternative across16 boards/30 selected
moves. Each complete table has128 subjects. Existing successor-board literals are retained;
the external rules library generates only the additional legal inputs, not expected counts.
All complete input UCI/FEN lists are checked before table/event comparisons. `[V]`
(`tools/d1713-semantic-validation-matrix/direct-control-reference.ts`,
`tools/d1713-semantic-validation-matrix/direct-control-reference.test.ts`;
Make target `semantic-control-source-research`)

Boundary controls include a full two-king table with explicit zeros, first friendly blockers,
pawn diagonal attacks versus pushes, starting-position counts, a geometrically attacking
pinned knight whose legal destination is absent, EP, captures and each promotion role.
In the literal bishop/knight board, f3h4 opens the g2 bishop's attack on the queen at d5:
White's control count there changes0→1. This states an attack, not move quality or a forced
material gain. Two forced single-capture cases retain complete128-subject availability
while producing no differing-alternative events. `[V]` (the same research tests and explicit
`PIN`, `BISHOP_KNIGHT`, `only-capture` inputs)

Independent static review found no concrete reference or fixture flaw; execution confirms
finite agreement, not general qualification. The prototype is unregistered. It has no new
cited proposition, profile arm or learner binding. Promotion still needs reviewed source
grounding, genuine wrong-output controls, exact mirrors and all required canonical/profile
proofs. Line-blocker and legal profitable-capture risk references remain separate work. `[V]`
(the research import boundary; current cited-source/profile/consumer registries)


## Complete original-piece ray reference — D1716, 2026-11-11

Normal `make semantic-retained-piece-source-research` typechecks and passes67 checks
in4.68s. Its independent placement decoder, physical relocation map and board-edge ray
arithmetic compare all original pieces × eight signed directions, including inapplicable,
removed and zero states, over62 hand-authored examples and their complete legal alternatives.
The external rules library supplies legal inputs only. Full emitted arrays and invocation
receipt/first-input identity are compared; existing hand-authored sparse rays independently
anchor matching complete-table cells. `[V]`
(`tools/d1713-semantic-validation-matrix/retained-piece-reference.ts`,
`tools/d1713-semantic-validation-matrix/retained-piece-reference.test.ts`)

The boundary checks cover numeric original-square order, both colors/all roles, occupied
interior squares beyond the first blocker, endpoint exclusion, adjacent endpoints, role-before-
border refusal, equal counts with changed membership, moved originals, identical-role capture
replacement, en passant, all four promotions, normal and stationary/crossing castling. A
promotion retains the original pawn subject and becomes a current-role ray where applicable;
its non-comparable original state cannot be treated as a zero baseline. Bare kings retain
16 explicit inapplicable subjects with no differing events. `[V]` (same reference and tests)

This is disposable, unregistered reference preparation. It does not register a cited source,
case/profile arm or consumer and adds no canonical qualification. Legal-input generation,
ray occupancy and a public differing-relation event remain separate meanings. Source citation,
pre-mint fault controls, absolute/mirror/canonical execution and consumer adoption still remain.
`[V]` (unchanged cited-source/profile registries; reference import boundary)


## Complete original-own-piece risk reference — D1716, 2026-11-11

Normal `make semantic-piece-risk-source-research` typechecks and passes79 checks/4.98s.
The independent reference enumerates legal captures and same-landing-square recaptures,
recomputing whole-board material balances at each node with optional stop. Its declared
pawn/knight/bishop/rook/queen/king units are1/3/3/5/9/100, matching `legal-exchange@1`;
these are product-convention units, not engine scores or a strategic judgement. Production
exchange, tactics and lineage helpers do not supply expected results. External Chessops
supplies legal positions/moves only. `[V]`
(`tools/d1713-semantic-validation-matrix/piece-risk-reference.ts`,
`tools/d1713-semantic-validation-matrix/piece-risk-reference.test.ts`;
`packages/runtime/src/exchange.ts` declared convention)

The full original-own-piece table and emitted arrays match across40 input populations and70
selected moves, each with every legal alternative. The30 non-castle roots are15 independently
scored input pairs; ten additional roots cover both colors of standard, stationary and crossing
castling. Nine focused controls anchor positive8/zero0/negative−8 exchange units, pinned versus
unpinned captures, defended-but-profitable capture, numeric original-square order, genuine EP
victim/landing identities, illegal pinned EP and all four capture-promotion values7/7/13/9.
Two deeper legal exchange chains pin both players' optional-stop decisions: forcing recaptures
would change1→5 and−8→−10, while correct optional stopping retains1 and−8. Each move is
independently checked legal. Root pawn subjects retain their identities through all four
promotions while current roles change.
Uniform true/false and available-empty cases stay distinct from invalid turn clones, which remain
unavailable even with no own non-king pieces. `[V]` (same reference and79 checks)

The first run exposed an instrument error: it expected an acquired legal-map input on an
unavailable invocation. All six invalid-clone controls correctly have no acquired inputs;
the assertion now checks that explicit refusal separately and retains original-first-input
identity on all available cases. No production change was made to satisfy the instrument.
`[V]` (test unavailable branch; `computeSubjectOutcomes` unavailable return)

This remains unregistered source preparation. Cited grounding, real-runner pre-mint faults,
canonical arms/admission, consumer adoption, learning effect and release proof remain separate.
`[V]` (unchanged canonical cited-source/profile/consumer registries)


## Fixed-authority king proofs and multi-output witnesses — D1716/D4219, 2026-11-11

The king sources now have fixed cited-proposition lookup entries. Their independent placement,
coordinate, interior occupancy and turn arithmetic comes from the reviewed literal references;
the retained Python excerpt grounds placement/turn facts, while zone/opposition rules remain
disclosed product conventions. Neither source claims move quality or strategic advantage.
No canonical case part, profile arm, generated receipt or ordinary binding changes. `[V]`
(`packages/runtime/src/semantic-validation-cited-sources.ts`,
`packages/runtime/src/semantic-validation-king-outcome-sources.ts`)

A new nonvacuity guard exposed a real test gap: no existing king-zone canonical first play
produced multiple outputs, so reversing the output array could not test order. It failed1/69
before repair. Explicit both-color split-zone roots distinguish corner/edge/interior outcomes;
split-opposition roots reach different distant-three/five alternatives from the same original
king pair. The18 roots/32 plays produce88 source cases (46 zone,42 opposition), with64 full
population comparisons,26 mirrors and the all-form/holder/nonvacuity guard passing91 checks.
All opposition forms already reached true/false values through the prior complete alternatives;
an initial missing-form hypothesis was refuted rather than turned into a new requirement.
`[V]` (`semantic-validation-king-outcome-sources.ts`, `semantic-validation-king-outcome.test.ts`)

Every source case executes the real registered operation with the fixed resolver and real
runner. Pre-mint faults modify `computeSubjectOutcomes` output before its genuine factory,
covering original identities/colors/parameters, root/played/alternative values, crossed
move-state associations, support membership and both counts, duplicate/drop/reverse outputs.
Each requires real fault invocation and exact expectation-failure code; multi-output and
nonsupporting/different-state guards prevent vacuous mutation tests. Symmetric corruption
inverts the full table and payloads consistently: the real mirror still passes, while BOTH
absolute source partners fail. Invented quiet events and omitted total cells are distinct
controls—the latter shows explicitly that public empty output cannot prove a complete table.
`[V]` (`semantic-validation-king-outcome.test.ts` fixed-authority proof group)

The same checks retain genuine invocation/first-input identity, reject result/value copies and
refuse the currently held ordinary module bindings. Corrupted cited input/arm/span is rejected
by the fixed authority. Four normal software files pass2,966 tests/39.51s, including existing
pawn/cited/authority regressions. Independent readback finds no bounded source/proof blocker;
workspace types and canonical non-change verification pass. All1,524 case results,63
population receipts,eight external receipts and19/89 qualification verdicts remain current.
This is source proof, not canonical qualification, learner adoption or release proof. `[V]`
(same tests; normal `make test-software-files`)


## Fixed-source whole-square control proofs — D1716, 2026-11-11

The reviewed geometric reference now has one build/test implementation in
`packages/runtime/src/semantic-validation-control-outcome-sources.ts`; the disposable
research path re-exports it. New fixed propositions use the pinned attackers-mask excerpt
for geometric control, not legal capture or safety. Twenty-six roots/40 selected moves
cover both colors, literal capture/EP/promotion populations, starting play, pinned pieces,
opened bishop lines and all standard/stationary/crossing castles. Seventy-four source cases
execute the real fixed authority; canonical/profile arms remain untouched. `[V]`
(new source; `semantic-validation-reference-inputs.ts`; fixed cited-source registry)

Normal focused software passes137 tests/14.86s, workspace types pass, and the original34
research checks still pass/2.31s. Genuine pre-mint faults cover identities, counts, crossed
move-state associations, support, duplicate/drop/reverse output and a consistent+1 offset
which passes mirrors but fails both absolute partners. Forced legal inputs are explicitly
available with128 complete cells and no alternatives. Incorrectly emitting an unsupported
zero-alt event fails the actual negative runner; independent table checks reject missing,
wrong-value and wrong-identity cells even while public output stays empty. Copied evidence
and held ordinary module bindings remain refused. `[V]`
(`semantic-validation-control-outcome.test.ts`; normal Make checks above)

This qualifies neither a canonical profile nor a learner feature. Blocker/risk fixed-source
proofs and the coordinated five-family canonical run remain. `[V]` (unchanged case/profile files)


## Fixed original-piece ray authority — D1716, 2026-11-11

One build/test reference now owns the reviewed placement/lineage/full-ray arithmetic; its
research path re-exports it. Sixty-four population records retain62 literal examples and
add two quiet capture-replacement controls; repeated root FENs are intentional distinct
plays, not extra distinct boards. The148 fixed cited source cases include whole-array
absolutes, every optional mirror state leaf and original alternative UCI associations.
Normal four-file line/control/king/slider regression passes965 checks/21.31s; workspace
types and original67 research checks/4.58s pass. Independent read-only review accepts the
bounded checkpoint. `[V]` (`semantic-validation-line-outcome-sources.ts`,
`semantic-validation-line-outcome.test.ts`; normal Make checks)

Pre-mint faults reject physical identity/direction/value/member-order/support/count and
output mistakes. A mirror-safe simulated bug truncates every ray's blocker membership
to its first blocker, then recomputes counts, relations, groups and support consistently;
both absolute partners reject it although the mirror passes. Capture alternatives cannot
replace a removed original by zero; private total-table controls catch missing domains,
role-as-zero and promoted-pawn current-role loss even when public output stays quiet.
These are measured test failures, not newly found production defects. `[V]` (same test)

Fixed cited registration does not add canonical/profile arms or ordinary consumer eligibility.
Risk-source fixed authority and coordinated five-family qualification remain. `[V]`
(unchanged canonical case/profile/receipt files)


## Fixed own-piece risk authority — D1716, 2026-11-11

One build/test source now owns the reviewed independent material minimax; the disposable
research entry re-exports it. Forty-six complete input populations/82 selected moves retain
all earlier inputs and add both-color deeper optional-stop controls. Ninety-four fixed
cited propositions execute actual operations. Invalid turn clones remain focused unavailable
controls and deliberately produce no semantic-negative proposition. Available empty/uniform
reads remain genuine negative cases. `[V]` (`semantic-validation-risk-outcome-sources.ts`,
`semantic-validation-risk-outcome.test.ts`)

The deeper profit control legally captures9, recaptures1, then could exchange1 for9: forcing
the whole line yields0, but optional stopping retains8. The fixed reference and actual risk
factory both keep the original queen's root risk true. Every prescribed move is checked legal.
This is `legal-exchange@1` arithmetic, not an engine score, recommendation or forced gain.
The first draft's selected Kh1–g1 was rejected as illegal before test execution; Kh1–h2 is
used with the same legal exchange proof and no collector change. `[V]` (same test)

Normal focused software passes200/11.43s, workspace types and original research79/4.41s pass;
the five outcome-proof files together pass1850/39.93s. Genuine pre-mint faults cover original/
current identity, color/role, all state/alternative/support/count/order fields, EP victim versus
landing and promoted current roles. Consistent inversion passes mirrors but fails both absolute
partners. Invented quiet events and corrupted quiet private totals fail their independent controls.
Copy/held-consumer refusal remains. Independent read-only review accepts the bounded source
proof. Canonical/profile/receipt integration and qualification remain the next coordinated step.
`[V]` (same tests and fixed cited-source registry; unchanged canonical/profile/receipt files)
