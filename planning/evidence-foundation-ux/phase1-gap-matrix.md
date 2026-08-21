# Phase 1 — HEAD-derived producer→projection→consumer gap matrix

**Program:** `planning/evidence-foundation-ux/plan.md`, Phase 1 (opened by D717).
**Derived at HEAD `927cd6d`, 2026-08-22.** Every count below is re-derived from the tree, not
copied from a document. Compiled manifest verified by running `make evidence-manifest-check
semantic-evidence-check` at HEAD: digest `1389241a7cced450516034cf91f2fade6296a0be1385a2c5ca67984fe1739adc`,
tuple **20 producers / 126 projections / 25 consumers / 175 bindings + 33 semantic events / 33
eligibility rows / 15 reasons / 1 selection policy** — matching `docs/semantic-evidence.md` exactly.
The pre-F1 conclusion of `design/research/evidence-contract-topology.md` ("no shared pool, no
compiled join") is **superseded**: the compiled join exists. What this pass measures is the D717
distinction — *registered* versus *usable, rendered well, connected to a workflow*.

Ground truth used: `packages/runtime/src/evidence-catalog.ts` (the whole catalogue, read in full),
`packages/runtime/src/evidence-contract.ts`, `packages/runtime/src/semantic-evidence.ts`,
`apps/server/src/evidence-manifest.ts`, `apps/server/src/guidance.ts` (read in full),
`apps/web/src/lib/DrillScreen.svelte`, `CompareView.svelte`, `CheckpointSheet.svelte`,
`GameStoryScreen.svelte`, `ShapePanel.svelte`, and the web sentence renderers
(`structural-sentences.ts`, `transition-sentences.ts`, `corpus-sentences.ts`,
`evidence-sentences.ts`). This is a measurement pass: **nothing was fixed.**

## 1. The chain model and what "consumed" means at HEAD

Chain walked per primitive:
`producer → raw payload → typed projection → retained operands/squares/sign → grounding/exactness →
abstention → runtime availability → manifest registration → consumer eligibility → selection policy
→ renderer/forms → workflow/preset → inspector disposition → bot-policy consumer`.

The 25 registered consumers split into three kinds, and the split is the whole finding:

- **6 machine/author/operator operations** (`authoring.predicate`, `runtime.objective_condition`,
  `runtime.guard_condition`, `opponent.selection`, `runtime.repertoire_scan`,
  `authoring.claim_binding`) — healthy, closed chains.
- **17 learner-facing render operations** — every one renders **raw readings or transport values
  through fixed sentence templates**. None consumes an F2 selection result; none is a module; none
  is activated by a preset. `grep` for the nine R3 module IDs and six workflow IDs over `apps/` and
  `packages/` (excluding tests/tools): **0 hits** — re-verified at HEAD.
- **2 disposed/experimental** (`assistance.arrows` experimental; `research.semantic_selection`
  experimental).

**F2's entire event layer is production-inert.** The only call sites of
`structuralSemanticEvents` / `transitionSemanticEvents` / `localSemanticEvents` /
`selectSemanticEvidence` / `selectLocalSemanticEvidence` outside the runtime package are
`apps/server/src/semantic-evidence-check.ts` (the startup/verify gate) and four disposable research
harnesses (`tools/r2-selection-harness`, `tools/r3-presentation-harness`,
`tools/r7-review-map-harness` ×2). No run, no request handler, no component ever constructs a
semantic event. All 33 eligibility rows target `research.semantic_selection@1` only
(`evidence-catalog.ts:395-403`), exactly as F2 specified — a deliberate disposition (class 9), and
the single largest block standing between the manifest and a learner experience.

## 2. The matrix — registered primitives × chain terminus

Gap classes: **1** collector absent · **2** computed but thrown away · **3** payload loses
operands/squares/sign · **4** sourcing record never reaches runtime · **5** projection registered,
no product consumer accepts it · **6** consumer bypasses F2 selection · **7** renderer exposes raw
transport data · **8** workflow/preset never activates the module · **9** deliberate
experimental/inspector disposition (a decision, counted separately) · **10** dead / cannot-fire
vocabulary. A row can carry a primary class plus noted secondaries; counts in §5 use the primary.

### 2a. The 126 registered projections, grouped (n per group re-counted from the catalogue)

| # | projection group (n) | chain terminus at HEAD | class | evidence anchor |
|---:|---|---|---|---|
| 1 | `rules.structural.predicate.*` (18) + `.result` (1) + `authored.structural_condition.input` (1) | authoring/runtime condition evaluation; closed | — | `evidence-catalog.ts:294-296` |
| 2 | `rules.structural.reading.*` (17 emitting) | full unranked reading printed to `inspector.position_structure` (median 80 obs/position, D542 delivery unchanged) and square-scoped sight; no selection stage | **6** (+7) | `DrillScreen.svelte:911`, `CompareView.svelte:159` |
| 3 | `rules.structural.reading.pawn_count` (1) | `retired` disposition — declared cannot-fire | **9** (residue → class 10, §2c) | `evidence-catalog.ts:158` |
| 4 | `rules.transition.reading.*` (14) | printed whole to `inspector.move_transition`; operands/squares deliberately absent by declared limitation ("not a semantic learner event") | **3** (+6) | `evidence-catalog.ts:169`, `DrillScreen.svelte:920` |
| 5 | `rules.structural.event.*` (11), `rules.transition.event.*` (11) | typed, sealed, operand-preserving — eligible **only** for `research.semantic_selection@1`; never constructed in production (§1) | **9** | `evidence-catalog.ts:395-403`; caller grep §1 |
| 6 | `derived.semantic_avoidance.*` (11) | same research-only terminus; selector never invoked in production | **9** | same |
| 7 | `rules.phase.reading` (1) | rendered ungated above the board: "Detected by Tabiya's phase bands: …"; `undevelopedMinors` operand carried but never rendered anywhere | **7** (+2) | `DrillScreen.svelte:886`, `phase.ts:56-60` |
| 8 | `pack.authored.phase` / `.claim` / `.claim_delivery` (3) | deterministic guidance + checkpoint/terminal sheets; closed, but sheet prose includes raw UCI (§4 L11) | — (7 at one site) | `guidance.ts:74,78`, `CheckpointSheet.svelte:137` |
| 9 | `rules.pivotal.marker` (1) | timeline dot → modal; sentences carry producer terminology and raw percentages (§4 L10) | **7** | `pivotal.ts:121-140`, `DrillScreen.svelte:1146` |
| 10 | `rules.endgame.reading` (1) | only reachable inside the pivotal modal — a learner needs a marker before seeing an endgame reading | **8** | `DrillScreen.svelte:1147` |
| 11 | `theory.shapes.firing` (1) | timeline chip → `ShapePanel`; renders the raw authored trigger AST as spec prose; **no drill door** (D695 holds) | **7** (+8) | `ShapePanel.svelte:25-26` |
| 12 | `recorded.engine.eval`, `recorded.tablebase.result` (2) | deterministic post-provider sentences; tablebase sentence exposes category/DTZ/source id raw (§4 L14) | **7** | `evidence-sentences.ts:186-195` |
| 13 | `live.stockfish.eval` (1) | guard/objective conditions + evidence-ref delivery; ref renders as kind-label "eval evidence recorded." | **3** | `evidence-sentences.ts:163` |
| 14 | `live.stockfish.wdl`, `live.stockfish.pv` (2) | bound to `runtime.evidence_ref`, but the renderer emits only "wdl evidence recorded." / "best line evidence recorded." — values transported and dropped at the sentence layer | **3** | `evidence-sentences.ts:163`, `api.ts:1240` |
| 15 | `live.stockfish.uci_response`, `human.maia.uci_response`, `live.syzygy.probe_result` (3) | opponent selection, operator-only — deliberate | **9** | `evidence-catalog.ts:309` |
| 16 | `live.syzygy.result` / `.category` / `.distance` (3) | guard/objective conditions + ref delivery; closed | — | `evidence-catalog.ts:296` |
| 17 | `human.maia.policy` (1) | on-request inspector panel **inside the play-screen assistance dropdown**, raw UCI + rounded percentages | **7** (disposition is deliberate, placement is not) | `DrillScreen.svelte:826` |
| 18 | `human.maia.event` (1) | evidence-ref delivery ("… evidence recorded." label only) | **3** | `evidence-sentences.ts:163` |
| 19 | `human.explorer.population` (1) | on-request corpus panel, same placement; percentages + game counts | **7** | `DrillScreen.svelte:830`, `corpus-sentences.ts` |
| 20 | `human.explorer.position_stats` (1) | repertoire scan (machine); closed | — | `repertoire.ts` |
| 21 | `theory.opening_identity.record` (1) | build-time sourcing only; runtime admission **refused** (`position-evidence.ts:25`); 0 authored-pack reach (D694 verified current) | **4** | `apps/server/src/position-evidence.ts:25` |
| 22 | `run.record.*` (7) | compare/story/ref delivery; `evidence_ref_resolution` is family-only — 34 fixed sentences, no operands (declared limitation) | **3** | `evidence-sentences.ts:30-65`, `evidence-catalog.ts:243` |
| 23 | `derived.compare.structure_delta` (1) | **screen renders the parameterised sentence; the voice/LLM renderer emits the kind-name placeholder** "A recorded structural observation changed: ${kind}." — the D542-dossier defect 4, now hardened into the registered renderer | **3** | `guidance.ts:60` vs `CompareView.svelte:136` |
| 24 | `derived.compare.engine_trajectory` / `.eval_delta` / `.piece_route` (3) | CompareView raw numbers/strips (8.83 entries/ply unchanged); no selection | **6** (+7) | `CompareView.svelte:135-155` |
| 25 | `derived.story.*` (4) | Review story; private vs public select **different** eight moments (D688 holds); card footer mislabels source (D687 holds); no F2 event enters story (D689 holds — `review.story` accepts zero `*.event.*`) | **6** (+7) | `GameStoryScreen.svelte:14,30`; `service.ts:624`; catalogue row `review.story` |
| 26 | `sourcing.ledger.*` (3) | author-only claim binding — deliberate | **9** | `evidence-catalog.ts:314` |

### 2b. Consumers with a defect of their own

| consumer | defect | class |
|---|---|---|
| `assistance.arrows` | still a shipped 3-state control (`AssistanceSettings.svelte:43`) with 4 schema migrations and no producer; registered `experimental` per D546 | **9** |
| the 9-axis assistance surface | markers/guided/humanSplit/corpus/voice/spoken/boardLighting/arrows/ambient — plumbing axes, not learner intent; 6 technical profiles (`pack/position/imported/match/stream/onramp`), no preset layer; **`academy` sessions still fall through to the source-run profile** (D636-1 holds — `assistance-preference.ts:7-12` has no academy arm while `LIVE_SESSION_KINDS` includes it) | **8** |
| imported-game Story voice | "Narrate grounded moment" appears whenever an LLM provider exists; the `imported` profile's `voice: "authored"` does not govern it (D636-2 holds) | **8** |
| shape→drill handoff | `shapeRecommendations` computes exact `packIds`; Learn renders "Find {packIds[0]}" and calls `navigate("/play")` (D692 holds, `App.svelte:722`) | **8** |
| content activation | tempo windows and key-point matching remain content-starved (D690/D691-adjacent; timing verdicts declared in a handful of the 404 content files) — modules that look broken most of the time | **8** |

### 2c. Dead / cannot-fire vocabulary (class 10), n = 4

1. **`pawn_count` residue** — the reading projection is honestly retired, but the kind survives in
   `STRUCTURAL_FEATURE_KINDS`, as `structure-pawn-count` in `RULES_EVIDENCE_FACTS` with a live
   sentence ("The authored pawn-count condition holds…", `evidence-sentences.ts:54`), and in two
   renderer arms (`structural-sentences.ts:27,54`). The *predicate* legitimately works
   (matcher-only); the observation-renderer arm cannot fire.
2. **`move_irreversibility.castled` reading** — `transition.ts:351` still tests `|Δfile| === 2`,
   so the e1h1-form (all PGN imports via `makeUci`, `pgn-import.ts`) can never fire the reading or
   marker. The F2 **event** layer is fixed (`transition.ts:309` uses `>= 2` and F2 canonicalizes
   castling in event IDs) — D547 is now true only for the reading/marker layer.
3. **`DrillScreen.svelte:910`** — "No rung-0 structural observations in this position." remains
   unreachable: `structure.ts:457` pushes 12 unconditional `piece_count` rows per position.
4. **`packAbsentEvidenceRef`** — sentence-table row built (`evidence-sentences.ts:97-102`); no
   production emitter of the ref exists (repo-wide grep: definition + table build only).
   CompareView renders checkpoint-missed prose from `consequence.checkpointsMissed` directly.

### 2d. Class 2 — computed and thrown away, n = 7 (re-verified by production-caller grep)

`structuralDelta()` (`structure.ts:504`), `vacationReading()` (`structure.ts:517`),
`retrospectivePivot()` (`adaptive.ts:5`), `unauthoredTempoTransition()` (`tempo.ts:289`),
`requestObjectiveEvidence()` (`objective.ts:405`), `renderTransitionSpec()`
(`transition-sentences.ts:27` — a renderer no site calls), and `undevelopedMinors` (computed on
every `classifyPhase` call, now an operand of the declared `rules.phase.reading` payload, rendered
by nothing — the owner's "develops a piece" primitive, still in the tree unused).
**No longer in this class:** `capturedRole` — now consumed by the F2 transition rule events
(`transition.ts:310-312,352`).

### 2e. Class 5 — transported with no accepting consumer, n = 2

1. `concessionRatio` — computed per candidate (`opponent-selector.ts:784`), validated and typed
   through `rest.ts:163-211` and `feedback-policy.ts:38`; zero references in `apps/web/src`.
2. `/capabilities` fields `capabilityDispositions` / `costBasis` / `tempoVerdicts` etc. — absent
   from the web `Capabilities` type (`api.ts`; grep 0 hits), unchanged from D546's finding.

### 2f. Class 1 — required collectors genuinely absent, n = 17

Phase 2's candidate list (from D544, narrowed by D565, and §7c of
`design/research/classifier-coverage-and-noise.md`), re-verified absent at HEAD by symbol grep over
`packages/` and `apps/` (0 production hits for every name):

| collector | nearest existing primitive | note |
|---|---|---|
| hanging piece (attacked, under-defended) | `direct_attack_count` per colour | free arithmetic; strongest as the *negative/avoided* reading (D545) |
| fork / double attack | attack sets | **must not ship on geometry alone** (0.72× measured; needs the material test — D565/R1) |
| absolute pin | `between()` imported by `structure.ts` | a state, not an event |
| skewer | same ray scan | |
| connected pawns / islands / chains | pawn sets | shape library keeps reaching for this vocabulary |
| rook on 7th | rank test | |
| castling-rights state (lost / prevented) | FEN castling field — **still never read as a state** | the `castled` event ≠ the rights state |
| space (central / kingside / queenside) | pawn control counts | needs a declared Tabiya convention |
| weak square / hole | complement of `pawn_safe_square` | |
| bad bishop | `bishop_on_shade` + own-pawn count | needs declared threshold |
| back-rank weakness | — | one-ply enumeration |
| trapped piece | — | one-ply enumeration |
| X-ray | — | ray scan |
| discovered attack | slider_ray event retains the ray but no tactical consequence test | |
| book depth / out-of-book ply | opening table | rung-4 lookup |
| mate-in-N available/missed | engine | exactly grounded |
| move-quality grade (published threshold) | engine delta | admissible only with the number shown beside the word |

Already-computed candidates (`undevelopedMinors`, `capturedRole`, opening identity) are classes
2/–/4 above, not class 1.

## 3. Counts per gap class (primary classification)

| class | meaning | n | membership |
|---:|---|---:|---|
| 1 | collector absent | **17** | §2f table |
| 2 | computed, thrown away | **7** | §2d |
| 3 | operand/sign loss in payload or sentence layer | **5** | transition readings (14 proj. as one defect), evidence-ref family-only resolutions, wdl/pv label-only rendering, maia.event label-only rendering, structure_delta voice placeholder |
| 4 | sourcing record never reaches runtime | **1** | `theory.opening_identity.record` |
| 5 | transported, no accepting consumer | **2** | `concessionRatio`; `/capabilities` disposition fields |
| 6 | consumer bypasses selection | **4** | `inspector.position_structure` (median-80 print), `inspector.move_transition`, `compare.structure_strip` (8.83/ply), `review.story` fixed-priority selection (D689/D690) |
| 7 | renderer exposes raw transport data | **15 leak sites** | §4 |
| 8 | workflow/preset never activates the module | **6** | zero R3 module/workflow IDs in production; no preset layer; academy profile fall-through; Story voice bypass; broken shape→drill handoff; endgame-reading reachability |
| 9 | deliberate disposition (a decision, not a gap) | **40 declarations** | 33 semantic-event projections research-only; `pawn_count` reading retired; `assistance.arrows` experimental; 3 `sourcing.ledger.*` author-only; 3 raw provider-response projections operator-only (minus overlaps) — every one carries an explicit catalogue reason |
| 10 | dead / cannot-fire vocabulary | **4** | §2c |

## 4. Class-7 leak inventory — exact strings and render sites (Phase 4's input)

Ordinary-play surface (`DrillScreen`, ungated or one click from the board):

| # | site | leaking string (verbatim shape) |
|---:|---|---|
| L1 | `DrillScreen.svelte:886` (always on, above the board) | `Detected by Tabiya's phase bands: middlegame.` / `Tabiya's phase bands do not classify this position.` |
| L2 | `DrillScreen.svelte:813` (topbar status) | `{n} evidence waiting` |
| L3 | `DrillScreen.svelte:880` (related-rehearsal link) | `After e2e4:` — raw UCI |
| L4 | `DrillScreen.svelte:897` (trajectory status) | `legA → legB at ply 12; 3 moves produced this position.` |
| L5 | `DrillScreen.svelte:826` (human-split panel, inside the play-screen assistance dropdown) | `maia-1500, rating target 1500: e7e5 34% · c7c5 22% · …` — raw UCI + percentages |
| L6 | `DrillScreen.svelte:830` + `corpus-sentences.ts` (same dropdown) | `From this position: 4210 games. White wins 48.2%, draw …` / `e4 — 210 of 4210 games (5.0%). White wins …` |
| L7 | `DrillScreen.svelte:911` + `structural-sentences.ts` (position column, above the board) | median-80 unranked classifier sentences: `Tabiya's backward-pawn detector matches White's e-file.`; `White's knight on f3 has 5 attack-reachable squares in the current occupancy; check and pins are not evaluated.`; `The line through a1–a8 contains 3 blockers.`; `White's bishop on e3 stands on a dark square.` |
| L8 | `DrillScreen.svelte:920,959` + `transition-sentences.ts` | `White gained 3 enemy-occupied squares. {provenanceNote}` — census prose + provenance note; same sentences repeat in the board-overlay caption |
| L9 | `DrillScreen.svelte:1056` (branch-group creator) | candidate chips as raw UCI: `e2e4 ×` |
| L10 | `DrillScreen.svelte:1146` + `pivotal.ts:121-140` (pivotal modal) | `middlegame → endgame, detected by Tabiya's phase bands.`; `maia-1500's recorded policy split: 34% / 22% / 11% of recorded mass.`; `3 legal moves are available under Tabiya's count convention.` |
| L11 | `CheckpointSheet.svelte:137` (authored commentary) | `Alternative e7e5` — raw UCI as a heading |
| L12 | `theory-presentation.ts:24` (checkpoint theory verdicts) | `Ply 12, Nf3: the pack classifies this as premature-break.` — raw classifier token |
| L13 | `CompareView.svelte:47-49,87,135,148-155` (review) | raw eval numerals `+0.54` / `M+3`; `+3: {score}` grids; raw objective-state tokens (`preserved`, `degraded`, `transitioned`) as cell text; strip attribution `Tabiya structural detector.`; piece routes `wN1: g1 → f3 → e5` |
| L14 | `evidence-sentences.ts:163,186-195,211` (guard prompt grounds, compare timelines) | `wdl evidence recorded.` / `best line evidence recorded.` / `Evidence recorded.`; `Exact tablebase evidence recorded: category win for the side to move; 5 pieces; DTZ 12; source lichess-syzygy.`; plus the 34 family-only condition sentences (`Tabiya's slider-line blocker condition holds at this transition.`) |
| L15 | `ShapePanel.svelte:25-26`; `GameStoryScreen.svelte:30`; `guidance.ts:62,70` | raw authored trigger-AST spec prose (`Tabiya's shape trigger for … matches this position.` + rendered expression); the false card footer `rendered from recorded engine evidence · Tabiya` (D687); voice sentences `Recorded engine evidence changed by +42 cp at offset 3.` / `The recorded evaluation moved +150 cp across this move (stockfish-16, 1200 ms).` |

The two on-request panels (L5, L6) and the reading sections (L7, L8) carry F1's deliberate
"Evidence inspector" headings — the *disposition* is class 9, but their **placement inside the play
column and assistance dropdown**, and the ungated L1–L4 strings, are precisely the owner's
"raw classifier sentences, UCI, percentages and producer terminology leak into ordinary play."

## 5. Ledger spot-check — stale rows found

Stale-rate context: 24 rows spot-checked against HEAD symbols.

| row | verdict at HEAD |
|---|---|
| D542, D543 | **current** — delivery unchanged (full unranked print `DrillScreen.svelte:911`; strip unchanged) |
| D544, D545 | **current** — zero tactical detectors; no sign-scored measurement anywhere |
| D546 | status ✅ correct; its *inventory* is stale as current truth: `capturedRole` now consumed (`transition.ts:310-312,352`); `wdl`/`bestline` now have a declared consumer (`runtime.evidence_ref`) though values still unrendered; `assistance.arrows` now registered experimental |
| D547 | **half-stale** — the F2 `castled` event handles both UCI forms and canonical IDs; the reading/marker layer (`transition.ts:351`) still misses `e1h1`. The row as written overstates the live defect |
| D548 | **half-stale** — "nothing can refuse it" no longer holds (the reading carries a `retired` disposition, `evidence-catalog.ts:158`); the enum/fact-list/renderer residue remains exactly as written |
| D630, D631, D633 | ✅ correct — events verified in catalogue and `transition.ts` |
| D632 | **current** — `dependsOn` in catalogue; check output names the same three shape documents |
| D634 | status ✅ correct; its **conclusion is superseded at HEAD** (pre-F1 baseline) — already flagged by the owner handoff; do not cite as current truth |
| D635 | **current** — six profiles (now incl. `onramp`), nine raw axes, no preset layer |
| D636 | **current, both halves** — no `academy` arm in `assistanceProfile`; Story "Narrate grounded moment" gated only on provider existence |
| D686, D689–D691 | **current** — `review.story` accepts zero `*.event.*` projections (catalogue) |
| D687 | **current** — hard-coded footer at `GameStoryScreen.svelte:30` |
| D688 | **current** — `rank.slice(0,8)` vs `moments.slice(0,8)` (`service.ts:624`) |
| D692 | **current** — `App.svelte:722` still `navigate("/play")` |
| D694 | **current** — runtime refusal intact at `position-evidence.ts:25` |
| D695 | **current** — `ShapePanel.svelte` has no drill door |
| D699 | **current** — `progress.ts:84` excludes imported runs |

Net: 2 half-stale rows (D547, D548), 2 rows whose closed status is right but whose text must not be
read as HEAD truth (D546 inventory, D634 conclusion). 20 of 24 fully current.

## 6. The five gaps whose closure unblocks the most downstream phases

1. **The class-9 wall: 33 production-inert semantic events + zero module vocabulary (class 8).**
   Every consumer phase — F5 modules/presets (Phase 3/5), F6 Review Map, F8 bots, F9 coaching —
   needs the first *production* eligibility rows, named module consumers and policies. This is
   Phase 3's RFC; nothing downstream moves without it, and F2 built it so that only declarations
   are missing, not machinery.
2. **The tactical collector family (class 1: hanging piece, pin/skewer, fork-with-material-test,
   castling-rights state).** The only coverage family competitors ship that Tabiya lacks (D544);
   required by support modules, Review moments, bot explanation and habit tracking alike. Phase 2
   verifies; a collector RFC closes.
3. **Selection-less delivery (classes 6+7).** The measured fix already exists (D543: top-8 lift
   5.29× at 0.48 entries/ply vs shipped 1.003× at 8.83) and needs a policy-bearing consumer, not a
   detector. Closing it is the precondition for Phase 4's board-protected composition and empties
   most of the §4 leak list in the same stroke.
4. **Operand loss at the sentence layer (class 3: family-only refs, kind-label-only wdl/pv/maia
   rendering, the `structure_delta` voice placeholder).** Blocks grounded coaching (F9), honest
   voice rendering, and any square-anchored form; the operands are already in the payloads — this
   is renderer/adapter work against the existing manifest.
5. **Opening identity runtime join (class 4).** The one sourcing-only producer; F7 theory/drill
   joins, Review opening names and book-depth all wait on a position/transposition-keyed runtime
   identity with honest absence (D694/D696).

## 7. Proposed ledger rows (from D718 — proposed here, not written)

- **D718** — Phase-1 gap matrix landed: 17 absent collectors, 7 discarded computations, 5
  operand-loss seams, 15 class-7 leak sites, 4 dead-vocabulary residues; 33 F2 events remain
  production-inert by disposition. (this file)
- **D719** — D547 residual: the reading/marker castling test (`transition.ts:351`) still misses
  `e1h1`-form; the event layer is fixed. Narrow the open row to the reading layer.
- **D720** — D548 residual: retire the `pawn_count` renderer arms and the `structure-pawn-count`
  evidence-fact sentence, or declare them matcher-only in the vocabulary they inhabit.
- **D721** — the voice/screen asymmetry is now a registered renderer
  (`guidance.ts:60` placeholder vs `CompareView.svelte:136` parameterised): the F5/Phase-3 module
  contract must render `structure_delta` operands, not the kind name.
- **D722** — `packAbsentEvidenceRef` has no emitter; either emit it from comparison consequence
  assembly or retire the vocabulary.

## 8. Limits

- Static derivation only: no run was played; provider-on behavior (voice retry path, live guard
  events) is traced through code, not observed.
- Volume figures (median 80 obs/position, 8.83 entries/ply, lift table) are quoted from the D542
  harness corpus measurements, whose *delivery* preconditions were re-verified unchanged at HEAD
  (`structure.ts:457` unconditional rows, unranked print sites); the corpus itself was not re-run.
- Class assignment is single-primary; §2 notes secondaries where a row genuinely carries two.
- The Phase-2 required-collector list is reconstructed from D544/D565 and the classifier dossier's
  §7c because the owner handoff's verbatim list lives outside the repo; Phase 2 should correct
  membership against the handoff before re-deriving.
