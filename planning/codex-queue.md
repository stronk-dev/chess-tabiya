# Codex queue — rewritten in full 2026-08-16

**Rewritten wholesale, not patched, because two of my last three edits to this file silently
did nothing.** They were scripted string replacements anchored on section headings you had
already rewritten at `a702372`; the anchors stopped matching, the replacements no-opped, and I
committed them with messages describing content that was never in the file. **So you never saw
[[D468]], [[D469]], or the two RFCs accepted since.** That is why the queue looked thin and you
went looking for work elsewhere. Ledgered as [[D478]].

**You were right to stop on `teacher-surface`, and you named both places while I fixed one.**
The Status line *and* Open question 1 both said an owner was waiting. Both now say otherwise
(`224e258` and this wave). Fifth instance of the queue-vs-body failure, ledgered as [[D477]]
with the point that five instances is a **missing instrument**, not a habit: the rule lives in
this file as a lesson and nothing reads it.

---

## 0-HOLD-LIFTED. The Tactical amendment passed independent review — the 42-projection chain is executable

Reviewed 2026-08-22 at both amendment commits and HEAD via a throwaway worktree; all three
instruments green at both points. **Every row D829–D835 + D931 is repaired-as-specified** —
nothing fixed, nothing drifted: the amendment diff touches exactly the seven named boundaries,
and every untouched convention was verified byte-identical. The 14 tests are real contract
fixtures — **each has a flip-a-constant result naming the pre-amendment defect it catches**
(the duo-with-no-edges pair kills the adjacency misreading; the delayed-recapture negative
kills the old window; both checking-move tests kill the clone→false collapse). D931's
invariant — **unavailable is never refuted** — is enforced at the type and in fixtures across
all three surfaces. The final-ten map is faithful: ten ids byte-identical to Appendix A, no
operand dropped, no census downgrade; its one extra fixture is added coverage, not
re-specification.

**Proceed: Tactical final ten → Breadth 18 → Semantic 14 → modules → bots → Review.** The
landing conditions are the ones already in the RFC/map, restated: the boundary harness
graduates to permanent runtime tests (+ the terminal-child and `input_abstained` fixtures),
A1–A18 with the two-population measurement and honest zeros, and A16's ledger-and-log closeout
naming the rows in the landing commit.

## 0-PHASE4-ACCEPTED. `play-composition` is accepted — the screen rebuild is implementable

Accepted 2026-08-22 after cross-review; corrections in place. Your implementation order for it,
with the review's finds carried:

- **The board edge is a closed-form `snap8(min(...))` of viewport + tokens — no
  content-measured term** — replacing the container-query remainder at
  `DrillScreen.svelte:1335/1340/1501`. A seven-viewport numeric exhibit is in §3.1; the token
  assignment there is an existence proof, not a mandate.
- **The stage column's children are a CLOSED LIST.** The review's audit found three unbarred
  insertions you must re-home: the error alert and read-only banner (`:841/:843`), the
  branch-group creator (`:1040`), and — the live one — **the text-move disclosure inside
  `.board-shell` (`Chessboard.svelte:292`), which shrinks the board when opened. Acceptance
  state 16 starts red on it.** Re-home semantics untouched (A12).
- **Do NOT naively remove the `{#key}` at `:928`.** Its second term is the branch-group
  capture-reset; A9 carries the replacement (capture re-asserts via the existing
  `$effect`→`set()` path) and a capture-reset arm. Removing the key correctly is also the
  [[D840]] animation fix — one change, two criteria.
- **16 composition states × 7 viewports, asserted POST-GESTURE, 112 screenshots** on the
  existing `browser.yml` → `make test-browser` path. Pre-gesture coordinate caching is the
  [[D539]] trap; stale-rect probes only as negative controls.
- The 15-leak destination table is normative (§5.2): each leak's removal must land its
  destination rendering in the same pass or the criterion holds it open. The six inspector
  rows the D924 amendment added (inspector 34→40) are part of `learner-modules`' compiled 179.

**Sequencing**: after D566 (still first), 2c, 2d, and `learner-modules` — this is the visible
end of that chain. `semantic-collectors` (Wave-C) is drafting and will slot between the
collector waves and the module amendment (your order items 2 and 5).

## 0-BINDING-ARM-RELEASED. The owner split the content hold — the binding arm is yours NOW

Owner ruling [[D1005]] (2026-08-23) amends [[D949]]: **the binding arm is released; the graduation
arm stays held.** Full scope in `planning/feedback-delivery/stage2-work-order.md` §HOLD SPLIT.

**Why it is worth taking first: the corpus already has the evidence and never joined it.** 764
machine records against **one** claim binding ([[D993]]). Measured on a real pack ([[D1000]]):
`lucena-bridge-convert` shows a learner **1 of its 4 claims — 152 characters** — because
`admittedFeedbackClaimIds` (`authored-feedback.ts:274-280`) strips unbound machine-labelled claims
from the page, while **22 `tablebase_result` records sit unused in that pack's own sidecar**. One
`claimBindings` key, modelled on `philidor-third-rank-hold`'s working example, surfaces all four
(~860 chars) and lifts them from assistance rung 5 to rung 1.

**Take it in this order** (41% of the arm is pure script, 0% needs chess judgement):
1. **The 43 pure joins** — the backing record is already in the pack's own ledger (14 packs).
   Scriptable end to end.
2. **The explorer census** — `make candidate-emit PIPELINE=explorer`, the instrument that ships and
   has **never been run**; it backs the 60 `corpus_observed` claims.
3. **The 8 `engine_validated`** normalizations against the 391 existing `engine_eval` records.
4. **The `claimBindings` keys** themselves, then re-measure: `expression-census` should move
   `backedClaims` off 1 for the first time.

**Do NOT touch** (still held): any `graduationEntry` edit, any `blocking → resolved` transition,
and the 26 stale candidate ledger digests — all ride the graduation arm behind lane 0.28's breaking
change. **Same instruments, different populations**; check which arm a command's population belongs
to before running it.

**Closeout is the content-wave protocol**: flip the rows and append to `planning/content-era/log.md`
**in the shipping commit** (the clause that exists because a content wave once completed invisibly).

## 0-NO-RETIREMENTS. [[D1006]] — `engineCondition`/`legShapes`/`legOpponentPolicy`/`prediction` all STAY

Owner ruling: *"retire NONE. these are still important for bots, ui, etc."* If you see a retirement
recommendation in `planning/content-era/pilot-matrix.md`, it is withdrawn — the correction is
appended at the foot of that file. The census misread "ruled workflow" as "shipped consumer";
`bot-policy`, `campaign-core` and `longitudinal-store` are all accepted and all consume these
families. **Do not delete or deprecate any of the four.**

## 0-THEMING-ACCEPTED. `theming` is accepted — three axes, schemes inherited whole

Accepted 2026-08-22 on the owner's [[D982]] ruling (*"have app theme, board theme, pieces theme.
done."*) after cross-review + restructure + verification (138 claims, 12 corrected). Going in:

- **Three orthogonal axes**: `appTheme`, `boardTheme`, `pieceSet` — each selectable alone.
  **Criterion 13 is the guard**: switch one axis and the other two stay byte-identical. Do not
  reintroduce `--board-light`/`--board-dark` into an app palette; the board axis owns them.
- **An app theme is a COMPLETE INHERITED SCHEME, applied — not composed.** The 12 contract keys
  are the owner's own registry vocabulary (verified: all 10 schemes there carry all 12). Inherited
  palettes are **byte-exact upstream** and criterion 5b asserts it — [[D988]] is why: a reviewer
  edited `accentTextColor` believing it was ours and broke the verbatim rule while citing it.
  **Never "fix" an inherited value.** Tabiya-origin palettes are gated on WCAG; inherited ones are
  measured and published; `MODE_DEFAULT` must resolve to an `origin: "tabiya"` palette (4(e)).
- **The load-bearing engineering is the skin/paint split**: `chessground.brown.css` fuses square
  color with CSS-painted evidence paint (last-move, dests, selected, premove, check). Board themes
  become skin-only over one shared token-driven interaction-paint stylesheet. **Brush colors are
  NOT in that CSS** — they are chessground's JS `drawable.brushes` defaults
  (`#15781B`/`#882020`/`#003088`/`#e68f00`), a `config()` seam.
- **Two traps the verification caught, already fixed — keep them fixed**: `--shadow` maps to
  `--shadow-color` with geometry derived once (its 7 call sites are `box-shadow:` shorthand
  consumers; a bare color there is invalid CSS), and `DERIVED_TOKENS`
  (`shadow`/`scrim`/`scrim-strong`/`display-font`) is in criterion 1's admitted set or the
  criterion is red forever on 23 `--display-font` uses.
- **[[D983]] ships in the same pass**: the live light-theme WCAG failures — `--muted` → `#6d6960`
  (unconditional) and `--warning` → `#8e6116` (owner-visible candidate), eight small-text sites.
- **Persistence is `tabiya.theme`** — plain validated key, no version machinery ([[D977]]:
  validation IS the migration strategy). Client-only; **claims nothing versioned**.
- Criterion 1 is **red at HEAD** on two phantom tokens ([[D986]]) — that is the starting state.
  Your implementing commit flips D986 and the rows §10's lifecycle map names.

## 0-RATING-ACCEPTED. `learner-rating` is accepted — it HEADS the migration train

Accepted 2026-08-22 after independent cross-review (~80 claims, 14 corrected). Its two table
sets hold the FIRST migration positions (both `position next`), so nothing behind it —
longitudinal-store, bot-policy stamp, campaign-core, live-sources — can land its migration
before yours. Read the review-corrected file; what changed materially:

- **The withholding set grew**: `/reveal` and `/analysis` join `ASSISTANCE_WITHHELD` for rated
  runs, and `POST /rated-games` pins `feedbackPolicy: "attempt_end"` — the review proved a rated
  run could otherwise read live Stockfish lines mid-game through `/reveal` → `/analysis` →
  `/evidence`. AC-5's extension is the regression guard.
- **The void mechanism is event/branch-keyed** (condition 7): all four persisted rewind-family
  paths are covered — `rewind`/`rewindToCheckpoint` via `run.rewound`, `fork`,
  `enterSimulation`, and the group flow's persisted rewind. Do not re-derive it as route-keyed.
- **`BANNED_JUDGEMENTS` is asserted by symbol, never by count** (32 at HEAD and moving); R16
  runs the denylist over the rating's frozen authored copy.
- The five registered opens (3/5/6/8/9) are non-blocking; do not resolve them en passant.
- Your implementing commit flips the rows §12's lifecycle map names ([[D980]]/[[D981]] and the
  addenda rows) and appends the log entry per protocol.

## 0-CAMPAIGN-ACCEPTED. `campaign-core` v1 is accepted — implement at its migration position (fifth)

Accepted 2026-08-22 under the owner's gate waiver ([[D953]]). Read the review-corrected file —
the spend and seal mechanics changed materially from any draft conversation:

- **Spend sites are the four persisted entry points**: rewind (`service.ts:717`), `fork` (`:744`
  — the primary proactive-branching verb the draft missed), `enterSimulation` (`:1396`), and the
  group flow's persisted rewind (`:958`). `simulate()` (`:1312-1391`) spends **nothing** — it is
  a never-persisted scratch run; comparison stays free. The `#campaignCharge` guard is
  server-internal; `CAMPAIGN_REWIND_EXHAUSTED` is the typed refusal with pre-spend disclosure.
- **The seal reads `Node.objectiveState`** (`types.ts:121`) — NOT `TrajectoryLegSpan.sealedState`,
  which does not exist for non-trajectory packs. The campaign verdict is a **new object** in the
  `node_sealed` payload (the shipped `AttemptVerdict` vocabulary is not it).
- **The reward grant rides the seal transaction on ANY verdict** (finishing-not-winning), and
  `CAMPAIGN_BOSS_PLACEMENT` now requires the boss as layer 3's ONLY choice — the review found
  path choice could route around the act boss.
- Economy invariant `CAMPAIGN_ECONOMY_MONOTONE` (act1 ≥ act2 ≥ act3) is verified as the owner's
  ruling encoded exactly — do not "fix" the direction.
- Migration: `campaign_runs`; `campaign_events` at the claimed position **behind bot-policy**
  (fifth). Take it in queue order; `live-sources` sits behind yours.
- Your implementing commit flips the rows §9's lifecycle map names and appends the log entry.

**Protocol note on your in-tree D956**: rows renumber at landing — they are not reserved in
advance. Your working-tree row labeled D956 happened to land as D956 because claude's commit
carried it at exactly that head, but the skip from D953 to D956 was luck, not protocol. Number
from the committed head at the moment your commit lands.

## 0-LIVE-SOURCES-ACCEPTED. `live-sources` Phase A is accepted — implement after campaign-core's migration position

Accepted 2026-08-22 (the owner commissioned this lane the same afternoon — retrieving LIVE
tournament games for import/analysis). Read the review-corrected §3 and §4 before implementing:

- **The migration is real and ordered**: `imported_games.source_kind`'s STRICT CHECK gains
  `'lichess_broadcast'` via a table-rebuild migration at the claimed position **behind
  `campaign-core`** (sixth in the queue). Criterion 11 has both arms: pre-migration INSERT fails,
  post-migration succeeds, unknown kinds still refused. Do not take this before the positions
  ahead of it land.
- **The strip is structural, not token-based**: `sanitizeBroadcastPgn` removes comments, NAGs,
  `;` comments AND bare SAN suffix glyphs — the fixture carries 61 `??`/`?!`/`?` verdicts OUTSIDE
  comments — then `BROADCAST_ANNOTATION_RESIDUE` fail-closed asserts stored movetext contains
  zero of `{ } ; [% $ ! ?`. The six-token vocabulary is evidence the verdict vocabulary is open,
  not the assertion itself.
- The splitter (`splitBroadcastRound`) does no chess validation — the shipped parser stays the
  sole authority; boards import at their first move; the synthesized header-only case is the
  zero-move fixture (criterion 6 as corrected).
- `resolveBroadcastSource` lives beside `resolveImportSource` in `import-source.ts`, sharing the
  module-global serialized fetch queue, 10 s timeout, and the 429/5xx passthrough.
- Fixtures: `tools/d947-broadcast-roundtrip-harness/` (real tournament PGN, 4/4 green at HEAD) —
  promote what the criteria need into permanent tests; the harness itself stays disposable.
- Your implementing commit flips [[D414]]-adjacent residues per §7's lifecycle map and appends
  the log entry per protocol. [[D959]] (paste path stores verbatim) is recorded, out of Phase A
  scope — do not fix it en passant.

## 0-WORK-INDEX — landed; semantic conflict detection is the narrowed residual

`make work-index` now derives open state from `design/BACKLOG.md`, discovers active RFCs and living
route-shaped planning documents, excludes logs/archives and the stale audit inventories, rejects
duplicate ledger ids and fails any open row with no destination. Its first live run found **112**
still-open omissions after the D967/D968 collision repair; `planning/routing-queue.md` assigns all
of them to lawful lanes. [[D952]] is closed and the command is part of `make verify`.

[[D487]] remains narrowly open for **semantic ownership conflicts**. The JSON output exposes every
reference, but 119 rows currently have multiple same-priority references and many are legitimate
dependencies. Do not make a fake guard that rejects all mentions; the residual needs literal
primary-owner declarations that distinguish ownership from a dependency citation.

## 0-STAGE2-TOOLING. Binding-wave steps 1–2 are queueable NOW — no owner decision required

The stage-2 work order is landed at `planning/feedback-delivery/stage2-work-order.md` (read it
whole before starting — it re-derived the 98-of-196 withheld count at HEAD by running the shipped
predicate, and re-verified 26 of 36 candidate ledgers digest-stale). Steps 1–2 are code and
planning only; D642's sequence explicitly permits mechanism-building post-Stage-1, and no content
byte moves:

- **Step 1 — build the `blocking → resolved` writer.** It genuinely does not exist at HEAD (no
  `graduation-clear` target, no `clearGraduationEntries` symbol). The spec is pinned in the
  accepted `rfc/graduation-clearance.md` §6.5: exact signature, modeled on the shipped
  `verifyDraft`, **mandatory `digestDrillPack` re-stamp**, cached-census rule. The 26 stale
  digests must NOT be bulk-fixed — their re-stamps ride this writer's step-4 application.
- **Step 2 — the criterion-21(b) per-claim reason lister and the criterion-23 log-trip
  assertion** (both specced to buildability in the work order).

**R1 RULED 2026-08-22 ([[D949]]): the owner holds the WHOLE wave — both arms — until Gate F.**
Content steps 3+ do not start before Gate F passes, full stop. Steps 1–2 (the writer + the two
instruments) remain queued: they are mechanism, not wave, D642 permits them post-Stage-1, and the
accepted `graduation-clearance` §6.5 requires the writer regardless. R2 is also ruled ([[D950]]:
registry may grow, claude authors counterCases under owner veto) and is dormant behind Gate F.

## 0-WIRING-ACCEPTED. `assistance-control-wiring` is accepted — lands FIRST in the assistance pair

Accepted 2026-08-22 after cross-review. Small, dependency-free, and it must land **before**
`intent-presets` per that RFC's §8.2 seam (wiring owns the on-ramp `guided` default until
`ContextContract` subsumes it; single-owner in either order, but this order is the recommended
one). Three things the review changed that you must not miss:

- **The deletion target MOVED.** §2's duplicate named-plan block is NOT in the pivotal dialog —
  your own stage-1 commits relocated it to the inspector's **Recorded-moment section**
  (`data-evidence-consumer="inspector.pivotal_marker"`, `DrillScreen.svelte:1139-1141` at review
  HEAD). The pivotal dialog (`:1206-1214`) contains nothing to delete. Follow the consumer id,
  not line numbers — you are editing that file right now.
- The reveal chain is fully shipped already (`RunApi.reveal` → route `"reveal"` →
  `#refuseWhileMatchLive` → `revealFeedback`); the RFC wires it to the learner control, it does
  not build it. Criterion 5's no-over-refuse is honest: a PAUSED match passes.
- **Your implementing commit flips [[D308]]/[[D309]] and must state the named-plan block's final
  home** — D309's own row text ("pivotal-marker modal") is historically dated.

Criteria 8/11 anchor to exactly two files (`DrillScreen.svelte:1140`, `ShapePanel.svelte:23`) and
two currently-green tests will break when the gate lands (`tests/browser/drill.spec.ts:128`,
`screens.test.ts:321`) — that breakage is the criterion working; update them in the same pass.

## 0-GRADES-ACCEPTED. `move-quality-grades` is accepted — implement after `learner-modules`

Accepted 2026-08-22 after a cross-review that recomputed every constant against fetched sources;
corrections are in the RFC body. **Read §2's constants tables before implementing — three things
changed from any prior conversation about this RFC:**

- **The report ladder is 5/10/15 Win%-points, not 10/20/30.** The taxonomy dossier's gloss was
  wrong by 2× (`Advice.scala` thresholds operate on raw winningChances ∈ [−1,+1]); the dossier
  carries a dated erratum ([[D939]]). The practice ladder 2.5/6/14 was verified correct. All
  fixtures re-derived to four decimals — trust the RFC file, not the dossier's §2b table.
- **The mate arm is the complete fixed-cp three-tier table**, not floor/boundary rules. It
  includes the countermate row (mate→countermate = Blunder, fixture F-MATE-LOST-M). The tiers
  are cp constants, so the mate arm is context-independent by construction.
- **"Zero `voice.ts` changes" is now "one word":** [[D940]] — add `"inaccuracy"` to
  `BANNED_JUDGEMENTS` (`voice.ts:93-97`; `\baccurate\b` cannot match inside "inaccurate"), with
  its own fixture arm. **The flip of D940 rides in your grades implementing commit.**

Also declared: grades **clamp the logistic input** where Lichess feeds it unclamped (F-CLAMP-2
pins the disagreement as ours-by-choice). Sequencing unchanged: grades compile the two ◇ rows
for `postcommit_nudge`/`review_map` and sit **after `learner-modules`** in your order — nothing
else moves.

## 0-PRESETS-ACCEPTED. `intent-presets` is accepted — implement after `learner-modules`, alongside/after grades

Accepted 2026-08-22 after cross-review; corrections in place — **trust the RFC file at HEAD, not
any earlier conversation**. What you need going in:

- **Two new vocabularies to name in code**: seven `WorkflowContextId`s (the six shipped
  `ASSISTANCE_PROFILES` + `academy` — [[D943]]: academy currently falls through to its run's
  `sessionKind` profile and inherits solo defaults; your implementation closes that row) and
  five `PresetId`s promoted from the R3 harness, shipped as `validation: "candidate"` behind
  the owner-use gate. §1's mapping table is normative — every cell was re-derived at HEAD.
- **The compiler is pure and narrowing-only** (§5, with rule 0's typed refusal when
  `input.context` ≠ `input.access.workflowContext`). **The rules floor is universal**:
  `boardLighting` clamp tokens are restricted to `"legal"|"sight"|"evidence"`, each denoting
  `["legal", token]` — the registry invariant is what makes [[D493]] unrepeatable; do not
  reintroduce a per-context `"off"` path. A stored `off` survives ONLY under the ruled §5-rule-4
  exception.
- **Preset apply is a fallback/new-profile write, never a merge** over the three localStorage
  migration branches. Persistence is client-only `tabiya.workflow.v1.*`, version inside the
  value — **claims nothing versioned**; run lane 0.19 is named-and-declined, and criterion 9
  (both arms — (b) is the proactive `quiet → guided` arm the review added) is the standing
  guard whose failure reopens that decision.
- **`deriveWorkflowContext` is ONE runtime symbol imported by client AND server** — criterion 5
  fails the landing as vacuous unless `permittedAssistance` returns different permissions than
  HEAD for match/stream/onramp (sessionKind is declared-and-unread today; that changes here).
- **Acceptance grid: 5 presets × 7 contexts = 24 admitted pairs, 11 typed refusals** (the
  draft's 19/16 was a counting error the review caught — both sum to 35).
- Opponent policy stays **beside** the preset ([[D938]] seam): pre-fill the roster picker,
  never compose the request. The preset pill slot and disclosure seat are already reserved in
  play-composition's 16 states (state 7).
- Your landing commit closes [[D943]] and records the two counterparty Discharge D1 rows
  (`learner-modules` and `play-composition` both name this RFC's landing as their recording
  site) — flip rows and append the log entry in that commit per protocol.

## 0-PRIORITY-D566. The `pawnSafety` repair is owner-promoted — fix it properly

Owner ruling 2026-08-22 ([[D906]](2)): *"just fix the foundation and then keep it in."*
[[D566]]'s `pawnSafetyOnPosition` defect now gates a learner-facing sight row — `outpost`
returns to `sight_on_request`'s table after the repair lands and the accepted module table is
amended. [[D632]] does **not** close with the code fix: the dependency now reaches 77 authored
occurrences, so its F3/Gate-F truth-set migration and human re-evaluation remain. Fix the predicate at the mechanism (the
pushAttackers/captureAttackers computation), add the counterexample fixtures from D566's own
row, re-run the lift measurement for `pawn_safe_square` and `outpost` post-fix, flip D566, and
record the measured D632 truth-set change without claiming the content migration.

## 0-2D-ACCEPTED. `breadth-collectors` is accepted — implement after 2c lands

Accepted 2026-08-22 on the buildability test after the independent review the plan reserved.
**Read [[D895]] before implementing** — five conventions were repaired with FENs, and the
king-square one changes the mechanism: **pseudo-only manifests BY ABSTENTION** (the checking
side's turn clone is always `OppositeCheck`-invalid; there is no observable legal set that
excludes the king square). The check position `4k3/8/8/8/8/8/8/4R1K1 b` pins both rules. Also:
`pressure-line@1` now requires slider-ray compatibility with the screen removed (the labeled
negative fixture is in the d723 harness and passes); `defender_exposure@1` names its pass-state
device and abstention; the 29/26 count pairing is fixed; asymmetry is the unweighted five-role
magnitude. **[[D896]]**: `reply_breadth@1` is over-declared in Depends-on — name a consumer or
shrink the line while you are in the file. **[[D897]]**: the landing measurement must reproduce
11/125 and 1/45 within B6's 10% or name the §3.4 domain correction.

**Next after that: `rfc/learner-modules.md` is drafted and heads to cross-review** — the
wall-breaker (first production module ids; 179 eligibility rows). Do not take it until the
review lands and it is accepted; when it is, its implementation is the moment the F1/F2
machinery reaches a learner.

## THE BATCH DOCUMENT IS LIVE — `planning/defect-triage.md`

All **289** open rows routed. **Work batches, not rows**: one pass, one test run, one commit
naming the rows it closes ([[D416]]). Take them in the order below; the file has the full
membership, the files each batch touches, and the members flagged as riskier than they look.

**A0 completed 2026-08-16 by re-reading the rows and their current symbols.** The triage's
headline was conservative and its partial list contained an internal count error: **45** routed
rows were fully closed, not 40, and **15** retained a real residue, not 19. D203, D204, D209 and
D210 were fully shipped; D400 was answered/superseded. D204's four emitters are typed — the
remaining legacy schema arm is a different residue — while D240 genuinely lacks the shared
template registry its own remedy requires. Four process rows also closed in the same pass:
D418, D419, D459 and the already-shipped D474. The table header now calls column 3
**Disposition / history (not status)**. **A1 is blocked on status reconciliation:**
`rfc/README.md` calls `graduation-clearance` accepted, while the RFC's governing Status line says
**draft** and explicitly says the second author round *"does not re-declare"* acceptance. That
status mismatch was later reconciled, but implementation then found **[[D503]]**: six entries the
literal classifier assigns to `shape_firing` have no shape reference, while `subject` must resolve
and the writer requires a named shape. `graduation-clearance` is returned on buildability again;
do not implement it or patch D467 outside it until the body supplies an honest subject/predicate.

The implementation half of A1 landed on 2026-08-17: D468, D469, D481, D493, D495, D496 and
D502 are closed and the packaged stack was exercised against its persisted volume.
Graduation-clearance remains returned on D503.

Then: **A1** (returned RFC only) → **A2** (6 —
opponent selection serves the wrong move) → **A3** (5 — disclosure holes on live surfaces) →
**B1** (7 — claim binding and the evidence maps, one file, one live in the corpus) → **B3**
(4 — corpus denominators and fixture contamination; widest downstream effect for the least
work) → **B4** (8 — the gate on the gate; zero runtime risk, cheapest here) → **B8** (6 — the
graduation-emitter residue) → **B5** (8) → **B2** (6, three of which are record-only and
flagged).

**B6 and B7 are listed as traps**, not batches: B6 is mostly owner-tier `DESIGN-GAP:` rows with
one takeable member, B7 is convention with one.

**Queue correction 2026-08-17:** A2 and A3 are routing headings, not executable batches.
A2 contains format work that needs an RFC (D106/D195), measurements (D375/D457), and a behaviour
change whose own row requires a census first (D373). In A3, D232 was already implemented by
`evidence-at-runtime` and is now reconciled; D448/D92 remain teacher-surface-owned, while D259
and D214 specify no mechanical remedy. Do not invent the missing decisions. The next independently
takeable subset is B2's D219/D229/D258/D213, re-derived against the current tree before editing.

**B2 subset landed 2026-08-17:** D219, D229, D258 and D213 are closed. Storage now asserts a
contiguous migration range, the assessment category has one declaration, and one executable run
pins all three authoritative event adjacencies. The record-only B2 rows remain untouched.

**B3 fixture subset landed 2026-08-17:** D227 and D257 are closed. Default catalogue discovery
uses the exported pack-document predicate and excludes `.browser.json`; the browser server names
its six fixtures explicitly. D262 remains a terminology rule, and D211 was already closed.

**B4 takeable residue landed 2026-08-17:** D446 is closed. Q8 verification is side-effect free,
fails when its committed artifact is stale, and refreshes only under explicit `UPDATE_Q8=1`.
D477 overlaps the in-flight shared-resource-registers RFC; D416/D402 are protocol work, not an
unowned code patch. The other B4 rows were already closed.

**B8 takeable members landed 2026-08-17:** D207 and D239 are closed. Missing ledgers no longer
mask machine-labelled claims, and distillation now shares every other emitter's self-validation
refusal. D430's map-duplication half also landed; its vocabulary-removal half remains RFC-owned.
The remaining B8 rows are schema/content work and stay untouched.

**Two findings in that document outrank most of the batches.** `db243f5` edited nineteen defect
rows and **changed column 3 only** — writing *"✅ closed by pack-graduation 0.27"* into the
disposition while leaving column 1 at 🐞/💡. So [[D418]] is exactly right, and **the wave that
fixed the defects performed [[D419]]'s defect while doing it.** The disposition is not
trustworthy either: of the nineteen, 13 shipped, 4 are partial, and **2 (D207, D239) never
started** — which is why they are in a batch rather than in the closable set. Separately, a
**24% stale rate among rows nobody suspected**: 6 full closures out of ~25 sampled on a hunch.

**The content split you can act on is §7.** **27 mechanical rows reduce to five jobs**, three of
which are a shipped `make` target pointed at the corpus: the explorer position-census wave (60
`corpus_observed` claims against **0** backing records — 22 directly attachable, 38 needing a
sidecar first), the tablebase legal-successor census (**0 of 277** choice-bearing positions
censused), the engine pass (8 claims), the fixture relocation, and citation/digest repair.
**Nothing was over-called into it**: where the record is mechanical but the sentence it backs
must be authored, the row was split and the sentence sent to the authored side. Note
`packDigest` re-stamps are done for drafts but **26 of 36 candidate ledgers are digest-stale**,
which no row records — and it must **not** be bulk-fixed, because the `blocking → resolved`
writer does not exist yet.

## 0-F1-RESUME. F1 amendment accepted 2026-08-21 — finish the 25 real bindings

Your return was right on both blockers, and the amendment adopted your choice 1. The second
cross-review then found **the next bypass in the exact spot the last one lived**: rendered items
were unbranded, so `{ evidence: admittedItem, sentences: narrative.groups.flatMap(...) }`
typechecked — [[D662]] one level up. Read the amended §6.1 before resuming:

- **The seal now covers the sentence layer**: sentences exist only as a registered per-projection
  renderer's output over an admitted item, inside a brand-constructed `RenderedEvidenceView` —
  and **the brand is a runtime symbol property** asserted by both `voiceCheck` and provider-body
  assembly, so `as unknown as` double-assertion fails at runtime, not just review.
- **`derived.story.rank@1` is a new declared projection** — `story.rank` reaches `/story`, the
  screen's top-8, and the public shared page; its inputs are now truthful, and `last_level`
  gains `run.record.imported_result@1` (its `learnerLost` gate reads the result tag), flipping
  its grounding to `declared_convention` per §4.3's own mixed-inputs rule.
- **The deterministic Review surfaces have accepts ceilings** (`review.story@1`, compare strips) —
  without them `evidenceForConsumer` would silently drop items and force a choice between
  criterion 7 and criterion 11.
- **Naming is yours to settle** under §5's pre-acceptance rule: the reviewer wrote
  `renderEvidenceItems` in one place and `renderedEvidenceItems` in another — pick one.
- Census is **25**; all four negative fixtures verified genuinely red at your checkpoint;
  criterion 26 is now about base-packet *items*, not projections (`rules.pivotal.marker@1`
  legitimately sits in both accept sets via the timing strip).
- **[[D668]]**: the `declareEvidence` payload forge is deferred to F2 by row — do not solve it
  en passant; bound it with the census as the RFC says.
- **[[D667]]** is registered-not-endorsed: the story title says "Won" to a learner who lost as
  Black in imported games (`story.ts:37`). Criterion 11 preserves bytes — do NOT fix it inside
  F1; it waits on the owner's timing.

**F1 implemented and archived 2026-08-21.** The returns on [[D669]]/[[D670]] ultimately exposed
ten payload/authority collisions through [[D679]]. All twenty-three operations now consume sealed
views; `guidance.packet` and `/analysis` remain correctly classified as producer/acquisition. The
next evidence work is F2/F3, including [[D668]] and [[D660]], not more F1 conversion.

## 0-COMPLETED-2026-08-21. F1 implemented; accessible-board-input awaits owner use

1. **F1 (`rfc/archive/evidence-contract-manifest.md`) — implemented.** The compiled spine and
   inspector relabel ship; future consumers must extend the 23-operation census explicitly.
2. **accessible-board-input** — independent, parallel-safe. The corrected matrix is **150 = 6
   packs × 5 A2 viewports × 5 modes** with the 18 click cells the never-deleted floor; the state
   machine now has `awaiting_promotion`; semantic enumeration **follows `showDests`** ([[D659]] —
   never widen the ceiling from a projection); Alt+C matches on `event.code`. Holds in `awaiting`
   on the owner-run discharge — that does not block implementation, only archival.

**D650 is closed** — the three stale intent residuals are corrected and `make intent-parity`
guards them. **[[D660]]**: when F2 is drafted it must ingest D542/D543 measured lift; the row owns
that seam until then — do not absorb selection into F1.

## 0-PROCESS. Both register RFCs ACCEPTED 2026-08-21 — implement them, RFC-1 first

`rfc/shared-resource-registers.md` and `rfc/rfc-lifecycle-completion.md`, accepted on the
buildability test after a **joint** cross-review (they are one contract). The owner's five
process answers are recorded in their open-question sections with the rulings quoted.

**The seam rule, which the review had to add because neither document stated it: ONE parser,
FIRST LANDER HOSTS.** `status-parity` imports the §Active parser; if you land RFC-2's
instrument before RFC-1's, the parser lives in `status-parity.mjs` and `register-check`
imports it later — never two copies. This is why RFC-1 first is the recommendation, not a
hard order.

- **RFC-1** (`make register-check`): landed half derived from `schemaBuildInfo`, claimed half
  from `tabiya-claims` blocks parsed **with the nested-fence rule** — the review found the
  spec counted RFC-1's own example blocks as claims. Component-wise integer version compare
  (shape-entry `0.3` vs pack `0.27` is the live trap). §6's landing list now includes the
  run-schema row and the seven `EVIDENCE_KINDS` member rows — without them the check is red
  at its own landing. **Discharges [[D653]]** (four live claims currently have no register
  row anywhere) and closes [[D461]]/[[D497]]'s class.
- **RFC-2** (`tools/status-parity.mjs`, six checks P1–P6): the state vocabulary is seven
  tokens with the leading-token grammar (D516: byte-equality would false-positive 9 of 10);
  **P4 reads exactly one thing after the separator** — the `awaiting` pointer; P3 is the two
  owner-ruled set equalities plus a **severable** archive-status clause (retained for now).
  `awaiting` has exactly one live case to fixture against: `feedback-delivery`. Discharge
  rows keep their SHA on archival ([[D654]] is the motivating case).

Both claim **nothing versioned**. The ledger flips ride in your implementing commits and name
their rows ([[D416]]). After these two: the graduation-clearance mechanism + read-only
migration report, then **F1**, per `planning/platform-alignment/execution-queue.md`.

## 0-KILL2. ✅ CLOSED 2026-08-21 — [[D537]]/[[D538]]/[[D573]] exact board interaction

Selection-bound cache invalidation plus compact board-first sizing moved the identical A2 matrix
from 4/90 to **90/90 exact** live click/drag/touch cells. The permanent browser gate hit-tests the
source, remeasures after selection and asserts the exact outgoing UCI for all six served endgames
at desktop/tablet/phone. The failure record below is retained as the queue item's measured premise,
not as current product status.

**Your [[D507]] fix is complete and it is the right shape** — 0 of 64 squares occluded at all
five viewports on all six packs, overflow 64–164 px → **0 px**, and **no length ceiling verified
to 4,000 characters** ([[D540]]), because `max-height: clamp(5.5rem,16dvh,10rem)` + `overflow:auto`
sends growth into the block's own scroll. That is length-**independent**, not length-tolerant.

**A different, pre-existing bug still stops the drill.** Selecting a piece renders `overlayCaption`
(`DrillScreen.svelte:899`) below the board; `.position-column` re-centres and the board rises by
**exactly half the caption height plus margin** — `(caption + 5.6) / 2` reproduces every observed
shift to the pixel, 17–89 px — **and chessground's bounds cache is never invalidated.**

**Proved by controlled flip**: click where e5 is *drawn* → **0 plies**; dispatch a `window resize`
first, **same coordinates** → **2 plies**.

Aiming where squares are drawn, authored first move delivered: **1 of 6** at 1440×1000, **0 of 6**
at 1366×768 and 1280×720. **And two packs deliver a different legal move than the square clicked**
— `mate-k-r-technique` gives `Rh7+`/`Rh8` for `Rh6`; `queen-vs-pawn` gives `Qc6+` for `Qc4+`.
**A wrong move silently played is worse than a click that does nothing**, and this is on the
community drafts [[D502]] now serves.

**Independent of D507** — the schema-example pack shows the same −60 px shift at `4a6ad91`.

**Take [[D538]] in the same pass, and note a fixture list will not fix it.** `442b8a3` genuinely
closed the fixture gap — all six packs at five projections, passing. But re-evaluated **one click
later**, all **eight** `assertRunViewport` clauses pass in **all eighteen** cells, in a state where
up to 32/64 squares are un-hit-testable. **The invariant asserts a resting geometry and the defect
exists only after a gesture.** It needs a post-selection assertion, not more fixtures.

**And read [[D539]] before trusting any playability number, including mine.** Session 1's
*"1 of 6 playable"* was its probe computing coordinates before the gesture — **probe and bug
cancelled**. That is the **second instrument in two days** to return a clean reading by sharing
the defect's own assumption, after the CR1 harness ([[D526]]). Related: [[D541]] —
`philidor-third-rank-hold` is **Black to move** and coordinate probes assumed White at bottom.

## 0-CONTENT. Job A — the only genuinely mechanical content job. ~21 edits.

Full order: `planning/content-wave-work-order.md`. **Read [[D518]] first**: claude reported this
lane as *"27 mechanical rows, five jobs, three of them a shipped `make` target"* and **withdrew
that framing** — the explorer wave is **0 of 60** mechanical, not 22 of 60, because
`attachExplorerEvidence` needs an `EXPLORER_RATIONALE` entry in `provenance.sources` and **0 of 50
packs carry one**. Jobs B and E are blocked on authored judgement. **This is what survives.**

**Job A — provenance-promise repair ([[D470]]).** 20 packs' `provenance.sources` strings promise
data in `provenance.engineValidation`, which `PROVENANCE_EVIDENCE_INLINE` (`pack-validation.ts:867-868`,
severity **error**) forbids the pack from carrying. Plus the `bxc5-recoup` citation in
`anti-caro-advance-early-c5.json` — **present twice**, naming an id that exists nowhere, deleted
2026-08-15. **21 edits, all mechanical, 0 human.**

Sequence: hand-edit → `make pack-check` → `make verify-draft` (**performs the mandatory digest
re-stamp** — `digestDrillPack` canonicalizes the whole document and `EVIDENCE_DIGEST_STALE` is
only a warning, so skipping it drifts silently) → `make sourcing-check`.

**Fold job C in on the same `verify-draft` run**: the engine pass is **7 claims across 2 packs**,
not 8 across 3 — `maroczy-bind-white-squeeze` has no ledger and no `assessedBy`.

**This is a content wave**, so it carries `CLAUDE.md`'s content closeout: ledger rows flipped
**and** an entry appended to `planning/content-era/log.md` **in the shipping commit**.

**Say in the commit message what it does not do: it will not move `backedClaims` off 1.** No
mechanical job in this lane does.

**Also job D — denominator convergence** (code only, not a content wave): [[D519]] measured
`make expression-census` printing **`corpus.packs: 56` alongside `totals.packs: 50` in the same
report**, and `make graduation-report` still reporting **56** via its own inline filter at
`graduation-report.ts:8`. The fixtures were **excluded from discovery, never relocated**.

**And [[D521]] while you are there**: `make graduation-report` **writes `content/accepted-conditions.md`**,
so the headline graduation instrument cannot be run by a reviewer without dirtying the corpus it
measures — exactly [[D446]]'s defect, which you fixed for the Q8 harness at `5c66680`, surviving
in the more load-bearing tool.

## 0-UNBLOCK. `feedback-delivery` Stage 1 — CR1 is fine, the harness is not

**You were right to stop, and criterion 16 was right to be able to fail. The reading was of the
instrument.** Diagnosis at `planning/feedback-delivery/cr1-diagnosis.md`.

**CR1 works.** `common` is never empty — over **44** real spine fork sets its median size is **72**
(min 23, max 94), **0 of 44 empty**; CR1 removes **592 of 5,000** candidate entries corpus-wide and
fires in **41 of 44** fork sets. Positive controls behave: a transposition filters **62/64**,
identical branches **48/48** (CR3's named case). The fork exclusion is implemented exactly as
§4.1 specifies (`node.ply > fork.ply`, `node.id !== fork.id` with `previous` seeded from the fork)
— **not the cause**, and the choice is live: a fork-inclusive reading disagrees on 20/44 sets.

**The defect is `comparisonMeasurement`** (`tools/feedback-delivery-harness/feedback-delivery.test.ts:105-127`):
it gives every column **exactly one ply past the fork**. At one ply the candidate set is
`obs(fork+1) \ obs(fork)` while `common` is dominated by what did **not** change — **the two are
disjoint by construction**, so admission is 100% at every N whatever the filter does. Decomposed:
`|common|` = 70/61/53 at N=2/4/8 with **0 filtered each**.

**Fix the instrument, then re-run criteria 5 and 16.** Re-shaped with multi-ply columns the same
harness gives **N=8 admission 29.4% (depth 8), 27.6% (depth 12)** — criterion 16 does not fire and
Stage 1 is unblocked. ([[D526]].)

Two things to take in the same pass, both measured:

- **[[D528]] — add the empty-column case to CR3.** A column with **zero** plies past the fork makes
  `common = ∅` and silently disables CR1 for the whole comparison. CR3 enumerates degenerate cases
  *"named, not discovered"* and misses this one, and **19 of 44** fork sets have a 1-ply column.
- **[[D527]] — `compare-strips` re-declares its own `observationKey`** instead of reusing
  `structure.ts`'s `observationIdentity`. Reusing the shared one deletes **971 of 5,000** strip
  entries (**−19.4%**) **independent of CR1**, because the local key makes `pawn_safe_square`
  **25.4%** of all candidates. Sibling of [[D430]].

**Context worth carrying: [[D529]] — no authored fork in this corpus is wider than 3 columns**
(38 binary, 6 ternary, **0 at N ≥ 4**) against `MAX_COMPARISON_BRANCHES = 8`, and the median fork's
shortest column runs **2 plies**. So every N ≥ 4 number here is synthetic, **including criterion
16's own threshold** — do not read a re-run at N=8 as a corpus fact.

## 0-KILL. [[D507]] — COMPLETED 2026-08-17

**Measured hands-on 2026-08-16** (`design/research/endgame-latency-versus-cet.md`): at 1440×1000,
**5 of 6 served endgame packs cannot receive their own authored first move**; at **1280×720 and
1366×768, all 64 squares of all 6 are unhittable**. The board overflows `.position-column` by
**64–164 px** and is drawn under the timeline; `.drill-region` does not scroll and
`scrollIntoView` moves it **0 px**.

**The trigger is authored objective length** — **68** chars in the schema example against
**277–444** in the endgame packs. That is why the single pack production served is **0/64
occluded** and the whole corpus is not, and why nothing caught it.

**`assertRunViewport` would fail on all six packs at the very viewports it tests** — its desktop
projections run on the schema-example pack and its compact ones on a pack-less Just Play run.
**Fix the invariant's fixtures in the same pass**, or the next content wave reopens this.
Same shape as [[D482]].

**Related and already in the UX lane:** `.board-frame`'s `calc(100dvh - 34rem)` → the
container-query sizing **already present in the same file's mobile branch**
(`DrillScreen.svelte:1479-1480`) — ~2 lines, and the board roughly doubles ([[D496]]).

**[[D509]] COMPLETED 2026-08-17:** `/capabilities` advertised `perfect_tablebase` and
`practical_resistance` even though both returned **HTTP 503 for every position** under
`ENGINE_MODE=mock`. An empty fixture is now provider absence, and pack start checks the authored
mode before creating a run.

**[[D510]] COMPLETED 2026-08-17:** `/select-move` returned an **untyped HTTP 500** on a
checkmate position under `human_common`. Selector preflight now returns typed `INVALID_REQUEST`
/ HTTP 400 before any policy branch runs. [[D56]]'s family.

**Do not take [[D508]]** — it is a finding, not a defect: CET's endpoint measures **30.8 ms**
against our **30.1 ms** on the same FENs, so there is no speed gap to win and nothing to fix.

**D507 closeout:** long objectives retain their complete text in a bounded scroll region and the
board retains a 192px interaction floor. `assertRunViewport` now runs against all six served
endgame packs at 1280×720, 1366×768, 1440×900, 1440×1000, and 768×1024. The pre-change
regression reproduced a hidden 0px board and then a 90.7px board before the floor held.

## 0-OWNER. COMPLETED 2026-08-17 — two rulings landed 2026-08-16

**[[D502]] — the corpus reaches learners through BOTH channels.** Ship all 56 packs behind a
clear **unreviewed draft** badge, and promote onto an official shelf as clearance lands. The
registry **already carries** `channel: "official" | "community"` and the UI already renders the
badge, so this is wiring, not new surface. **Explicitly NOT by flipping `NODE_ENV`** — [[D481]]
found `PackRegistry.loadDefault` reads `content/drafts/` only when `options.development === true`
and `compose.yaml` never sets it, which is the bug, not the mechanism to use.

**[[D502]] — remove the schema example fixture from the served library.** It is a format
fixture, not content; its own commentary reads *"Schema-only annotation; requires human
review."* It validates the schema in tests and never reaches a user. `content/packs/` currently
holds only `.gitkeep`.

**[[D493]] — one token, and it is a same-day regression, not a ruling.**
`SILENT_ASSISTANCE.boardLighting` was flipped `"legal"` → `"off"` at `f304384` (11:44 today) in a
7-file batch, on the rationale that the constant is *"now silent in all nine fields"* — a claim
about tidiness, not about a learner. **`docs/adaptive-guidance.md:61` still calls `"legal"` the
single named exception to literal off, and all three migration branches in
`assistance-preference.ts` still write it.** Restoring it brings back move dots **and** the
last-move highlight, because `DrillScreen.svelte:882-883` gates `highlightMoves` — run history,
not evidence — on the same `!== "off"`. **Silence over evidence stays; the rules floor was never
on the assistance ladder.**

**Highest impact-per-line in the whole UX audit, take with the above:** `.board-frame`'s
`calc(100dvh - 34rem)` → the container-query sizing **already present in the same file's mobile
branch** (`DrillScreen.svelte:1479-1480`). **~2 lines; the board roughly doubles.** And a
code→sentence map at `SessionController.#fail` — **10 call sites, one choke point** — which
turns out to fix *both* `Run is terminal at node: run-<uuid>:node:4` **and** the fork button that
409s silently ([[D495]]). They are the same event.

Full lane: `planning/ux-work-lane.md`. Entry point for everything: `planning/WORK.md`.

## 0. [[D468]] and [[D469]] — CLOSED 2026-08-17

**Not hypothetical and not scheduled work.** `GRADUATION_RULING_UNCITED` resolves living-tier
paths against `process.cwd()` (`pack-validation.ts:848-851`). All **43** acceptances cite
`planning/exploration/log.md#L1231` (40) or `docs/tablebase-grounding.md` (3). `apps/server/Dockerfile`
copies **only** dist, web dist, schemas and content; `.dockerignore` excludes `.git`. The issue
is **error** severity and `PackRegistry.load` throws `PACK_INVALID` (`pack-registry.ts:252/258`).

**So the first graduated pack carrying an acceptance makes the server fail to boot, and 40 of 56
drafts carry one.** Reproduced with one `cd`: `node apps/server/dist/pack-check.js` on
`anti-caro-advance-early-c5.json` prints *"Pack check passed"* from the repo root and
`ERROR [GRADUATION_RULING_UNCITED]` from a temp directory.

**The framing generalises:** a check whose evidence is excluded by `.dockerignore` is **not a
weaker check in production — it is a different check under an identical code name.**
`graduation-clearance` §3.2c specifies the split: a runtime *shape* rule with a zero-filesystem
budget, and an authoring *admission* rule that may read `.git`. **The `repoRoot` option was
explicitly refused** — one code name with two silent behaviours is the defect, not the fix.

**[[D469]] closed alongside it:** both image jobs now depend on an engine-required `make verify`
release job, so no image is built or pushed from a corpus that fails the repository gate.

## 0b. `rfc/graduation-clearance.md` — RETURNED ON [[D503]]

**You returned this once and you were right to.** The first acceptance was granted on the wrong
test — its four author-call open questions were closed, and **none of the four blockers you
returned was an open question** ([[D473]], recorded as claude's error). The test now applied is
**buildability**: every obligation resolving to a named symbol, command or home. If it still
fails anywhere, return it again — the loop is the check.

- **D464** — `clearance.recordKind`, required iff `kind` is `ledger_record`, enum **transcribed
  from the shipped `EVIDENCE_KINDS`** (`sourcing/types.ts:57`), with criterion 13 asserting
  set-equality so a new evidence kind cannot silently become unexpressible.
- **D465** — all 30 resolved entries walked: **29 resolve, 1 does not**. Eighth kind
  `referent_removed` + `absentIds`, admissible on `resolved` only, refused on `blocking`.
  **Stage B is 29 mechanical + 1 by hand**, not a 30-entry migration.
- **D466** — the writer is `make graduation-clear` → `clearGraduationEntries`, modelled on the
  shipped `verifyDraft` (`verify-draft.ts:323`). **Mandatory `packDigest` re-stamp** —
  `digestDrillPack` canonicalizes the whole document and `EVIDENCE_DIGEST_STALE` is only a
  warning, so skipping it drifts silently. **One-line change at `graduation-report.ts:8`** or
  the new sidecar suffix is counted as a pack.
- **D467** — two rules, two homes, two input budgets, stated as a table. See item 0.

**Correction to carry:** §1.2 named the **wrong join** for two review rounds ([[D471]]).
`uniqueRecord` joins on **FEN** (a claim assertion names a position); `evidenceSupports` joins on
a **JSON pointer** (evidence names a pack node). Corroborated across all 32 ledgers: **764
records, 764 supports pointers, 1:1, zero prose pointers**. The predicate is now written as an
expression rather than prose, which is the actual remedy.

**Criterion 16 touches `.github/workflows/release.yml`** — outside `rfc/`, flagged so it is
scoped in rather than discovered late.

## 0c. `rfc/feedback-delivery.md` — ACCEPTED 2026-08-16, **two-stage landing**

**Do not archive this on stage 1.** Stage 1 ships the delivery surface; stage 2 runs the binding
wave; the RFC stays `implementing` between them and moves to `implemented` only when stage 2's
measurement exists. **Criterion 11's ledger flips ride in STAGE 2's commit** — no row closes on a
day-zero share. Claims **nothing versioned and no migration position**.

Seven things you would otherwise hit cold:

- **`MACHINE_LABELS` is module-private** and `earnedEvidenceTypes` needs it. **Export it; do not
  copy it** — a fourth copy replicates [[D430]]'s dead `explorer_frequency` alternative again.
- **`claimBackings.authorSpans` is two different shapes**: cut segments on the binding arm,
  `[claim.text]` — the **whole sentence** — on the `author_principle` arm, which is **66 of the
  67** day-zero rows.
- **C1(iii) is not a free read.** The reveal loop is
  `for (…) { if (!revealIsReleased(…)) continue; … }` and keeps no reference to the last admitted
  reveal. One assignment inside the loop, not zero.
- **Criterion 6's kill-gate instrument does not exist**, and it must rewind-and-branch **and**
  drive the opponent policy — **14 of 50** packs need the first, **17 of 50** the second. A
  mainline-only harness measures the 19 single-line packs and trips the gate for the wrong reason.
- **`items` sorts by `revealedBy.eventSeq` before `KIND_ORDER`** — `claim: 4` is last *within an
  occurrence*, not globally.
- **A stale pack digest cannot withhold a claim.** `EVIDENCE_DIGEST_STALE` is a CLI warning and
  `validateClaimBindings`' `before` is captured **inside** the per-binding loop. The re-stamp is
  hygiene, not a delivery blocker — do not spend stage 1 on it.
- **Re-running the Q8 harness overwrites its committed artefact** ([[D446]]) and dirties the tree.

**Stage 2 has no owner and cannot start without one** ([[D476]]). `claim-backing` was named for
it and then archived; an archived RFC can own a mechanism's design, not a corpus pass's
execution. **Do not adopt it silently** — commissioning it is claude's to arrange.

## 0d. `rfc/archive/teacher-surface.md` — IMPLEMENTED 2026-08-22

Closed at migration 24 with classroom rosters, assignments, explicit submission consent,
expiring/provenanced grants, scheduled classroom sessions and the bounded reviewer/contest
assistance context. Criteria 7a, 9a and 10g have executable guards; D80, D92, D93, D463 and
D703 are closed. Canonical behaviour is in `docs/classrooms.md`; this section below is retained
as the implementation brief, not executable queue work.

Both places you named now read `accepted`: the Status line at `224e258` and **Open question 1**
in this wave. **Nothing waits on an owner.** The owner confirmed the one narrowing on 2026-08-16 —
`live-marker-quality` §6.2's cost from *"permanently"* to **"for the duration of live play"**,
with the 2026-08-15 record left intact beside it.

Claims **one migration position** (`STORAGE_VERSION + 1`; head **23**) — `ALTER TABLE run_grants
ADD COLUMN granted_via TEXT`, nullable, **no backfill, no CHECK**. Four tables,
`run_grants.expires_at`, `live_sessions.classroom_id`. **No run- or pack-schema change, no new
token scope, no fourth `RunRole`, no new session kind.** Also claims **D92** and **D93**.

**One rule carries the design:** on a terminal, disclosed run with no live session open, a
submission-granted teacher gets **the run host's own table** — never a reviewer tier. `reviewing`
sits in the **role** disjunct and never beside `deliveryOpen`, because `design/05` §3a-i says
*"the run — not the viewer — carries the barrier"*.

**Go straight to these four criteria — each exists because the spec as written passed every
other check:** **7a** counts *statements, not sites* (both promotion sites contain a fresh-grant
`INSERT` as well as an `UPDATE`); **10c's second fixture** (the original was a solo pack, where
every candidate implementation agrees — the [[D444]] shape); **10e's extended loop**, ranging over
the two sides independently and shown failing against the old predicate; and **10g**, which
exists because a reviewer could see strictly *more* than the run's own host — `seatedInContest`
had no time bound and sessions are **closed, never deleted**.

**Do not weaken the `granted_via = 'submission'` conjunct.** Compatibility with
`live-marker-quality` is held by it — **by fixture convention, not by construction** as the author
round claimed. **Criterion 6 there changes in two clauses** (*"non-reviewing spectator"*) at this
RFC's landing.

## 1. A defect batch is coming — this is the real throughput fix

`planning/defect-triage.md` is being written now: a routing pass over all **278 open ledger
rows**, bucketed into batches of 5–15 touching related code, live user-affecting ones first.
**The one-RFC-at-a-time cadence was the bottleneck, not the ledger.** When it lands, **work the
top batch as a batch** — one pass, one test run, one commit naming the rows it closes ([[D416]]).

A guard worth shipping inside any batch: **a status-parity check over every Active row** in
`make verify`, comparing the register cell to the RFC body's `**Status:**` line. That is
[[D477]]'s remedy and it would have caught all five instances.

## 2. Not takeable yet

`learner-rating` (open questions 11 and 12), `measurement-records` (returned to author).
`engine-leverage`, `vocabulary-wiring` and `live-marker-quality` are **implementing** — do not
re-enter them.

## 3. Still do NOT take

**D348** (needs a versioned lane), **D351** (needs an accepted authoring-instrument RFC),
**D104** (not reproduced in 20 isolated runs — your refusal of a speculative patch was correct),
and the schema-shaped rows.

## Discharged this wave

`opponent-contracts` archived at `3276a37` with **[[D457]] correctly left open**;
`dead-vocabulary` shipped at `329c62b`; [[D474]]'s gate flake fixed at `0752638` by caching the
declaration-census source scans — **that row can flip when you next touch the ledger.**

## Protocol reminders

- **The ledger flip rides in the implementing commit**; **the log entry rides in the archiving
  commit**; **name the rows you flip in the subject or body** ([[D416]]). You did this at
  `d77a9f1` the first time it was asked for.
- **`design/BACKLOG.md` is a shared ledger, not an intent doc.** Law 5 protects `design/00`–`06`.
- **[[D419]]: column 3 of the defect table is NOT a status**, and **[[D459]]: the table's own
  header calls it "Status" and is wrong.** Read column 1.
- Cite ledger rows by **row title**, never line number. Locate code by **symbol name**.
- Claude's standing errors, all of which fired again this session: **a resolution in a register
  is not a resolution in the body** (five instances, [[D477]]); **a scripted edit that silently
  no-ops is worse than no edit**, because it ships under a commit message describing content
  that is not there ([[D478]]); **`git add` on shared ledger paths while you have uncommitted
  edits** (four instances); **a line-based grep is not a reading.**

## ⚠ ID COLLISION IN YOUR UNCOMMITTED TREE — 2026-08-22

Your working-tree renumber of the false-independent-review row takes **D869** — but D869 is
already committed at `cac76c4` (the owner's solitaire-chess ruling), together with D870.
**Renumber your row to D871 instead before committing.** Claude claims **D872–D873** for the
fairy-piece/didactic-reduction ideation landing after your commit; the next free block after
that is D874. (Fourth id race — the registered-block rule from the ledger's own process row
applies; this note is the registration.)

## D585 — the ambient "Open assistance" button: wire it or retire it inside the play-composition chrome slice

**(Residue reconciliation 2026-08-22.)** `DrillScreen.svelte:824` renders a chess-piece button
(`aria-label="Open assistance"`, title cycling Thinking…/Waiting for disclosure/A consequence is
ready/Present) whenever `assistance.ambient === "on"` — and it has no `onclick`, link, or expanded
target. It has been dead since the R3 source audit found it (2026-08-20). No document owns it: it
is not one of `play-composition` §5's 15 leak sites (L2/L5/L6 bracket line 824 and skip it),
`assistance-control-wiring` never mentions ambient, and `assistance-controls` (returned draft)
explicitly defers ambient forms. Because `play-composition` is **implementing** and rebuilds this
exact region, do NOT patch it standalone — fold it into the remaining module-seat/vocabulary
cleanup slice: either give the button its real target (the per-seat assistance surface the RFC
composes) or delete it with the rest of the retired chrome, and add one `play-composition`
changelog line naming `:824` as a 16th chrome site so the production-site discipline
(A4/A17-class) stays closed. Flip [[D585]] in the commit that does it.
