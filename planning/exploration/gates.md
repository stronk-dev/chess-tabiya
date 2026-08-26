# Gates — hypotheses, kill criteria, continuation gates

Lifted from `archive/brief-v2/14_VALIDATION_AND_KILL_CRITERIA.md` into tracked form.
Statuses change only with evidence linked from `design/research/` or a logged owner
ruling; every change gets a `log.md` entry. Thresholds are provisional and must be
preregistered before a formal test.

What must be tested: not that engines work, but that **whole-sequence rehearsal plus
rewind adds value**.

## Core hypotheses

### H1 — Opening continuation

- **Statement:** Players who drill a line through its first characteristic middlegame
  decision understand and execute the opening better than players who stop at line recall.
- **Test design:** move-order-sensitive Sicilian pack; compare line-recall baseline vs
  continuation drill; measure immediately and after delay on a related position.
- **Status:** untested · **Evidence:** — · **Verdict:** —

### H2 — Branch comparison

- **Statement:** Playing two alternatives produces better explanation and later choice
  than viewing two engine principal variations.
- **Test design:** same position, played-branches condition vs two-PV viewing condition;
  measure explanation quality and later choice.
- **Status:** untested · **Evidence:** — · **Verdict:** —

### H3 — Whole-segment replay

- **Statement:** Redoing 8–20 plies improves timing and plan execution more than
  retrying only the critical move.
- **Test design:** quiet structural pack (Carlsbad or IQP); full-segment replay vs
  one-move retry; measure timing-window failures and plan execution.
- **Status:** untested · **Evidence:** — · **Verdict:** —

### H4 — Outcome drilling

- **Statement:** Repeated conversion/hold/save play improves outcome rate on related
  endgames more than solving key-move puzzles.
- **Test design:** rook-endgame outcome pack; full play-out vs key-move puzzles;
  measure conversion/hold/save rate across variants.
- **Status:** untested · **Evidence:** — · **Verdict:** —

### H5 — Human opponent model

- **Statement:** Corpus/Maia opposition creates more believable and useful branches
  than weakened Stockfish.
- **Test design:** same reviewed positions and deterministic seeds under Maia-3 variants /
  ChessMimic if runnable / corpus policy / weakened-Stockfish control. Reviewers are blind
  to policy identity and score plan continuity, tactical sanity, objective relevance,
  diversity, and human plausibility over 10–20 plies; the harness also records latency,
  memory, failures, and variance (feeds exploration Q5).
- **Status:** untested · **Evidence:** — · **Verdict:** —
- **Scope note added 2026-08-16** (`design/research/coaching-versus-cheating-and-the-band-curve.md`):
  H5 as written compares Maia against weakened Stockfish. The campaign's 1000→2000 curve
  needs a **second, narrower** claim that nothing has tested — that the requested band is a
  **difficulty** lever and not only a **policy** lever. R10 measured that the distribution
  responds to every 100-Elo step inside `[1000, 2400]` and states explicitly that it makes no
  claim about play quality at any band. The missing arm is engine-vs-engine (so no human is
  graded): Maia-vs-Maia, N ≥ 200 games per arm, bands {1000, 1400, 1800, 2200} against a fixed
  band-1400 reference on R5's stratified position set; **pass = monotone score across all four
  arms with non-overlapping 95% CIs.** If it fails, K5's horizon question is moot for the
  campaign because the ladder has no rungs. Ledgered as **D324**.
- **RUN, and the narrower claim is CONFIRMED — 2026-08-16**
  (`design/research/maia-band-outcome-transfer.md`, `tools/d333-band-outcome-harness/`).
  16,660 complete games, band against band, 1,020 per ladder rung. The pre-registered
  criterion **passes exactly as written**: scores **0.3069 / 0.4990 / 0.6304 / 0.7652**
  against the fixed band-1400 reference, monotone, all three adjacent 95% CIs disjoint
  under both naive and opening-clustered intervals `[V]`. **So the requested band IS a
  difficulty lever and not only a policy lever, and the ladder does have rungs.**
  **Two qualifications the criterion could not express, both measured.** (1) *Monotone
  with disjoint CIs* tests **order**, not **scale**; the scale is the transfer ratio and
  it is **0.289 [0.269, 0.309]** over the pack corpus, **0.400 [0.379, 0.421]** on
  full-material positions — 100 band points buy 29–40 real Elo, not 100 (D335). Any dial
  with a positive ratio passes this criterion at sufficient n (D342). (2) A **100-band
  step is real but below the resolution a learner can experience**: 22.1 and 26.9 Elo
  against a ±60 session-scale threshold, so the usable rung is ≈150–208 band points and
  `[1000, 2400]` is five to nine rungs, not fourteen (D336). **H5's main statement is
  untouched** — no Stockfish was run and no branch was graded — and so is **K5**, which is
  about plan coherence over a horizon and is not inspected by an outcome count.
  Consequence for the 1000→2000 curve is escalated as D337.
- **Mechanical precondition measured 2026-08-20**
  (`design/research/bot-policy.md`, `tools/r11-bot-policy-harness/`). The production sampler had
  **19.84 cp** expected depth-12 loss and **0.39%** mass at ≥250 cp over 837 fixed cells, matching
  the captured production sample at 19.57 cp / 0.36%. A 250 cp guard removed the measured severe
  tail with only 1.27 cp strengthening; pawn ×4 changed its declared move-rate trait +11.97 pp
  without breaching strength or explorer-retention budgets. This establishes mechanically
  separable candidate layers, **not** believable/useful branches. No weakened-Stockfish control or
  blinded 10–20-ply judgement ran, so H5's main statement and verdict remain untouched.
- **Blind packet prepared and integrity-checked 2026-08-20**
  (`planning/platform-alignment/bot-policy/blind-review/`). Fifty-four legal 12-ply branches were
  generated across six roots/three strata; 42 enter the randomized packet (raw Maia, guard 250,
  pawn ×4, weakened-Stockfish negative control). Authored-spine and statistical-book arms both
  refuse before review at 57/72 fallback plies. Zero human judgements exist, so status/verdict stay
  untested; this removes an instrument-preparation blocker, not the human gate.
- **External arm descoped by owner 2026-08-21 (D649).** The 42-branch packet remains available for
  owner use, which may reject an incoherent 1.0 profile but cannot establish the population claim
  in H5/C5. R11's narrower policy-architecture question is mechanically and desk-complete; H5's
  main statement remains untested rather than silently treated as passed.
- **One proposed human-error mechanism refused 2026-08-23**
  (`design/research/threat-salience-and-human-error.md`, D815). On R11's retained population,
  exact attacker-just-moved / stationary-threat-created flags fail all three predeclared gates:
  stationary coverage is 7 positions against a 20-position floor, grouped-CV RMSE worsens 0.477%
  (permutation p .677), and the proposed residual direction holds in only 1/3 bands. Salience-shaped
  error is excluded from the 1.0 bot roster. This does not compare complete branches or establish
  perceived humanness, so H5's statement/status/verdict and C5 remain unchanged.
- **Evidence-head representation screen passes 2026-08-23**
  (`design/research/evidence-to-move-head-screen.md`, D1162/D1271). On 268 held-out positions and
  9,044 legal candidates, evidence-only beats uniform expected move match by
  **0.033734 [0.024141, 0.045075]** and evidence+engine beats engine-only by
  **0.018734 [0.009559, 0.029689]**, with position-level bootstrap and a positive direction in all
  three bands. Secondary cross-entropy, top-choice and safety readings are mixed, and the separate
  Maia context control still abstains. This funds a second preregistered population and multi-ply
  coherence study; it does not compare believable branches or license human-like/Elo/personality
  language, so H5's status/verdict and C5 remain unchanged.
- **Independent evidence-head population formally passes, fitted head returned 2026-08-23**
  (`design/research/evidence-to-move-independent-population.md`, D1162/D1297). On 515 held-out
  decisions from 108 different games, both preregistered mean played-move-probability contrasts
  pass with positive game-bootstrap intervals and no rating-band inversion. But the combined
  head's cross entropy worsens from 2.958 to 6.451, top-choice agreement falls 33.5%→15.8%, and
  >250-cp mass rises 23.0%→43.4%. The representation signal replicates; the diagonal head and its
  non-proper primary gate do not clear. Repair against a proper score and freeze before a third
  untouched population; do not begin multi-ply or alter H5/C5 from this result.
- **Proper-score repair retains signal and fails the standalone safety freeze 2026-08-23**
  (`design/research/evidence-to-move-proper-score-repair.md`, D1297). A conditional-logit repair on
  the already-seen development population fixes the old probability-tail pathology and makes
  combined cross entropy better than engine-only on validation (**2.454 vs 2.488**) and once-read
  confirmation (**2.052 vs 2.528**). Four of five predeclared clauses pass on both folds; the same
  severe-tail clause fails twice: >250-cp mass rises **+1.97 pp** and **+1.34 pp**, above the fixed
  +1-point ceiling. The standalone base is refused, the third population remains untouched, and a
  guard-composed successor requires its own preregistration. This still does not compare complete
  branches or license human-like/Elo/personality language, so H5/C5 remain unchanged.
- **Declared guard composition fails; owner disposition owed for the 1.0 goal 2026-08-23**
  (`design/research/evidence-to-move-guard-composition.md`, D1312). The fixed 250-cp mask admits
  96.6% and 93.5% of observed moves pooled and repairs the severe tail without usually collapsing
  choice (median 24/23 survivors). It does not stabilize the evidence policy: on validation,
  guarded combined cross entropy is **2.313 vs guarded engine 2.294**; on confirmation, the
  1000–1399 band admits **14/17 (82.4%)**, below the predeclared 85% floor. Different clauses fail
  on the two folds, so the cp boundary is not retuned and the reserved third population remains
  unread. This exact mechanism is returned. Per D1320, D1271's standing owner-funded non-Maia goal
  remains until an owner/RFC disposition accepts the refusal or funds a materially different
  family. The registered evidence foundation and Maia-based measured roster remain. H5/C5 remain
  unchanged.
- **Materially different family identified; training gate not met 2026-08-23**
  (`design/research/non-maia-selector-model-family.md`, D1328). Set-dependent choice can condition
  each candidate on the whole variable legal set, unlike both refused per-candidate heads. The
  architecture is admissible but untested in chess here; 515 exposed decisions are a falsification
  set, not a credible training population for the higher-capacity family. A corpus/feature-cost
  census and grouped learning curve must precede any fit, and the reserved third population remains
  sealed. This neither changes H5/C5 nor decides D1271's 1.0 owner fork.
- **Fresh-source arm passes; full training gate remains open 2026-08-23**
  (`design/research/non-maia-selector-data-readiness.md`, D1329). A separate June CC0 prefix yields
  50,992 complete games / 3.02m decisions, 100% legal replay and ≥99.9704% rating/time/clock
  coverage. The v1 cell criterion omitted its rating-band set, so no population verdict is assigned;
  v2 freezes 36 roster-derived cells and a 256 MiB range before the next read. Projection
  completeness/cost, owner budget and learning curve remain unmeasured. H5/C5 remain unchanged.
- **Repaired source-size gate passes 2026-08-23** (`design/research/non-maia-selector-data-readiness.md`,
  D1329). The precommitted 256 MiB range yields 827,067 complete games / 48.47m eligible decisions;
  all 36 roster-derived cells clear 10k (minimum 13,809), with zero illegal replays. Source clauses
  1–5 are complete. Projection completeness/cost and owner budget remain open; H5/C5 remain unchanged.

## Kill criteria

**Do not kill because paid products exist.** Kill or radically reposition when evidence
shows any of the following. Evidence for a kill criterion is logged and escalated, never
rationalized away.

| # | Criterion | Status | Evidence |
|---|---|---|---|
| K1 | Opening mode collapses into ordinary spaced repetition | open | — |
| K2 | Users rarely continue past the book boundary | open | — |
| K3 | Users ignore branches and simply restart | open | — |
| K4 | Branch comparison does not improve understanding over engine lines | open | — |
| K5 | Maia/corpus opponents produce incoherent plans over the required horizon | open | — · **not touched by the D324 pass, recorded so it is not read as such (2026-08-16, `maia-band-outcome-transfer.md` §10):** that experiment counted 16,660 game results and inspected no plan. It does establish that band-conditioned opposition differs in **outcome** as well as in policy, which removes one alternative explanation for a future K5 reading, and it establishes that the opponent plays to a natural termination — 13,061 checkmates and **0 ply-cap adjudications in 16,660 games**, mean length 63 plies — so *"the opponent cannot sustain a game"* is not the shape K5 would fire in |
| K6 | Explanations remain generic despite curated packs | open | — | **📊 partial evidence FOR firing, 2026-08-15 (`design/research/feedback-versus-the-dashboard.md`), corrected by the 2026-08-21 Feedback Stage-1 landing measurement:** the feedback is generic on what is **delivered**, not on what is **authored** — 235 deviation notes are bound to named non-spine moves and reach learners. The former zero-delivery baseline is retired. The corpus now has **196 claims: 98 are admitted by the evidence policy and 98 are correctly withheld pending backing**. A real full-spine walkthrough exhausts **50/50 packs** and renders **69/98 admitted claims (18,290/26,735 characters) across 32/50 packs**; the other **29 admitted claims are timing-withheld** because no released reveal occurrence remains in those runs. Delivery is now real but does not settle specificity: the binding wave and the bounded-module/semantic-selection work remain. · **📊 second partial evidence FOR firing, 2026-08-16 (`design/research/conjunction-hypothesis.md`, R11):** the *generated* half of the explanation layer cannot be made specific by combining primitives. Over 721 transitions and 19,099 alternatives, the best of 55 conjunctions reaches 35.7% precision and 2.73× discrimination against 69.4% and 12.64× for the best **single** primitive; only 7 of 55 are measurable at all and their median lift is **0.66×**, worse than a random quiet move; no triple of transition primitives reaches 10 witnesses in the whole corpus. **The route out of genericness is not composition** — it is the authored tier K6's first note already identified, plus the rare single primitives (`last_of_role` at 12.64×). **The criterion is not called: this is evidence about one mechanism that was proposed to fix K6, not evidence that curated packs stay generic** — the authored deviation notes still discriminate by construction.
| K7 | Authors cannot reliably encode timing and structure without excessive custom code | open, split by evidence | structure is reliably encodable (`design/research/authored-transitions-and-features.md` §5.1–5.2); **timing is not encodable at all** (§4, two independent attestations, 0/135 usage). The criterion does not fire on a conjunction with one half confirmed working; the timing half is logged as partial kill-criterion evidence |
| K8 | Full-segment replay does not transfer to related positions | open | — |
| K9 | Endgame mode is not materially faster or more usable than Chess Endgame Training | **OPEN AFTER DEFECT REPAIR — comparative usability awaits owner use; re-measured 2026-08-21** | `design/research/endgame-latency-versus-cet.md` §10 and `design/research/interaction-state-correctness.md` `[V]`. **Speed remains settled and cannot clear K9:** the products use the same tablebase call (30.1 ms ours vs 30.8 ms CET back-to-back), while our restart/rewind/reply budgets pass. The 2026-08-20 usability evidence toward firing was real but defect-caused: 4/90 live cells were exact, 15 submitted a different legal UCI and 71 submitted nothing. D537/D573 are now repaired; the identical six-pack × five-viewport × click/drag/touch matrix is **90/90 exact**, zero wrong and zero missing, and the permanent browser gate asserts the exact request at desktop/tablet/phone. The mechanical firing evidence is stale in the favourable direction and is retained in the dossier rather than erased. Whether the repaired rehearsal loop is materially more usable than CET remains an owner-session question; no stopwatch or automated gesture result can answer it. |
| K10 | Pack production cost is so high that only a handful can ever exist | 📊 evidence against firing | `design/research/pack-authoring-cost.md` (2026-08-15): 33 instrumented packs over nine waves, **43.5 agent-min/pack**, tooling friction **11.6%** (9.2% excluding pack A) — under the ~25% build-tooling threshold. **Strengthened 2026-08-15 by grounding wave G1**: the opening grounding bill is now PAID and measured at 10.3 min/pack, making a fully-loaded opening pack ~39.1 min — at or under the Syzygy endgame rate of 40.6, which was the dossier's stated condition for settling this half. Still NOT closed: **runtime playtest cost remains unmeasured since 2026-08-12** (no wave has played a run), and grounding covered *moves* only — prose, plan classes and deviation classes remain ungrounded |

**K6 third partial evidence, 2026-08-20.** `design/research/integrated-platform-alignment.md`
finds that the external LLM receives only the deterministic sentence list, the classifier is a
present-position census without the semantic tactical/multi-ply vocabulary the proposed modules
assume, and the current story is evaluation-led rather than a grounded review map. This strengthens
evidence toward firing for the **generated/default delivery path**. K6 is still not called: a
selected, sign-aware detector layer plus cited authored/theory evidence has not yet been built or
tested, so the criterion's “despite curated packs” clause remains unmeasured.

**K6 fourth partial evidence, 2026-08-20.** R1
(`design/research/detection-landscape.md`) tested the tempting “add the missing tactic detectors”
remedy against 50,000 Lichess puzzle records. Cheap fork geometry was 32.3% precise against the
external tag, discovered attack 19.7%, and hanging piece 7.9%; discovered-attack geometry also
fired on 20.48% of legal alternatives to tagged solution moves. The external tags are automatic
and incomplete, so this is not a grader. It is evidence that geometry-only names would preserve
genericness. R2 now tests selection below; the composed learner surface remains untested.

**K6 fifth partial evidence, 2026-08-20.** R2
(`design/research/selection-sign-and-significance.md`) tested selection on 754 authored and 579
stratified imported-game decisions. A predeclared local rule reduced the raw reading from
8.70/11.42 to 0.79/1.03 entries per decision at 93%+ counterfactual specificity and retained
108/108 rare rules events. That is strong evidence against the raw-list mechanism. It is also
evidence toward firing for a second generated shortcut: the most-selected families include
`piece_count`, `bishop_on_shade` and generic changed counts, so rarity alone still produces generic
or trivial output. K6 remains open because semantic eligibility plus the actual bounded modules
have not been reader-tested; R2 explicitly refuses rarity and relation sign as significance or
valence.

**K6 sixth partial evidence, 2026-08-20.** R3's mechanical/desk arm
(`design/research/evidence-presentation.md`) finds the selection bypass in both generated delivery
paths. A selected occupied square reaches a median 2 captions but a tail of **11 captions / 19
marks**, driven in the worst case by eight `line_blockers` plus ineligible/generic count facts.
`evidencePacket()` likewise sends the complete structural list, matching plans and authored text to
the provider with no consumer identity or budget. This is further evidence toward firing for the
current default/generated path and evidence that presentation form alone cannot repair it. K6 stays
open: the disposable module boundary passes mechanical leakage/abstention tests, but eligible
semantic facts and reader comprehension are not yet measured together.

**K6 seventh partial evidence, 2026-08-20.** R5
(`design/research/llm-renderer-contract.md`) rules out another proposed repair: changing the prose
model or adding JSON/fact IDs does not make unselected/generic evidence specific. Both hosted typed
arms returned valid schemas and admitted IDs in 16/16 cases but dropped required citations; one
also dropped a disclosure qualifier. The current sentence seam was provider-dependent: one hosted
snapshot passed 16 fixed cases, while the other asserted false absence and `voiceCheck` accepted
it. A 360M local model failed 15/16 typed cases. This strengthens evidence that the generated path
needs semantic eligibility, bounded modules and deterministic fact-linked forms before prose. K6
remains open because that full path has not been reader-tested against curated packs.

**K6 eighth partial evidence, 2026-08-21.** The first sealed F2→R3 packets make the missing
semantic gate executable rather than hypothetical. Castling, promotion and checkmate fixtures
evaluate **55/55** legal alternatives and retain those three critical exact events, but the cap-two
research policy also selects `occupied_defence` after castling and `direct_attack_count` after
promotion. Both are true and locally distinctive; neither has thereby become worth saying. This is
new evidence toward firing for a default generated path that fills available budget from a broad
eligible pool. It is not evidence that curated authored explanations remain generic and does not
call K6. F5 must compile module-specific semantic eligibility before local selection and permit an
unused budget slot to remain empty; owner use then tests the bounded output.

## Exploration-to-slice gate

The first experimental vertical-slice RFC may open when all of the following have reached
`📊 evidence` or better, or when an owner ruling explicitly accepts the remaining risk:

| # | Gate | Owned by | Status | Evidence |
|---|---|---|---|---|
| E1 | Competitive teardown confirms meaningful integrated-loop whitespace | Q1a | **met, narrowed** (owner ruling 2026-08-12: desk evidence sufficient; 2026-08-20 Guided Play now preserves abandoned continuations as branches and links theory, so rewind/branches/theory handoff are no longer whitespace individually. No checked competitor yet establishes Tabiya's full grounded cross-workflow integration or preserved N-way consequence comparison; reopen on hands-on contradiction) | `design/research/teardown-cet.md`, `teardown-noctie-desk.md`, `teardown-chessable-desk.md`, `teardown-chesscom-desk.md`, `design/research/integrated-platform-alignment.md`, `design/research/competitor-love-hate-sweep.md` |
| E2 | Target learners/coaches recognize the problem and choose the rehearsal loop over plausible alternatives in interview or low-fidelity tests | Q1b | **advisory** (owner ruling 2026-08-12: not slice-blocking for a personal OSS build; re-gates any public push) | — |
| E3 | Authors can declare useful opening→middlegame boundaries and timing windows without automatic phase detection | Q4a, Q7 | **partially met — implementation complete, content proof pending** | `design/research/authored-transitions-and-features.md` (2026-08-15): **boundary half MET** — 32/35 packs carry an `authoredBoundary`, 17 with no validator compulsion, and 6/6 trajectory leg boundaries fire at the exact ply the author claimed. Pack 0.17 now ships executable path-relative timing windows, all seven verdicts, and named checkpoint/objective consumers without automatic detection. The remaining gate is content-tier: authored packs must adopt and exercise the new object. |
| E4 | At least one runnable opponent policy produces sufficiently believable multi-ply resistance for a slice | Q5 | unmet | — | **R4 note 2026-08-15 (`design/research/practical-difficulty-outside-tablebase.md`): status unchanged (unmet), but `practical_resistance` is now known to be bounded to DECIDED positions — so E4 will be met by `human_common`/`perfect_tablebase` in v1, or not at all.**
| E5 | ~~Low-fi prototype before UI~~ **waived by owner ruling 2026-08-12 ("A")**: comprehension is answered by use in the drill-client slice, iterating the real UI | Q9 | **met by use, qualified**: fork/rewind passed; compare selection, app-shell fit, and missing instructional layer define the follow-up | `planning/drill-client/log.md`, `rfc/drill-client.md` | **Compare-scale evidence added 2026-08-15** (`design/research/mobile-scope.md`): the 8-column board band measures 2010 px — **1.85 screens of horizontal pan at 1280×720** and 5.88 at 390 px — so *"compare selection cumbersome"* is joined by compare **layout** overload at N>2 on every viewport, desktop included. No status change.

**Owner override 2026-08-12** (logged): RFC drafting opened with E1 met, E2 advisory, and E3/E4/E5 accepted as in-flight risk — their experiments run during implementation as validation (E3 inside the pack-format RFC via pack A; E4 via the Maia-harness before the opponent-worker RFC; E5 via low-fi prototype before the UI RFC). This gate originally decided whether the vertical slice was worth specifying. It does not
claim that the learning hypotheses are proven. Disposable research harnesses and UX
prototypes may be created before it under `rfc/0000-rfc-process.md` §Exploration gate.

## Continuation gates

Continue from vertical slice to product build when all of:

| # | Gate | Status | Evidence |
|---|---|---|---|
| C1 | ~~≥80% of reviewed feedback statements accepted by strong reviewers~~ | ⛔ **withdrawn 2026-08-13 (owner ruling): no review workflow exists or will.** Unmeasurable by construction — there are no reviewers. What replaces it as a quality signal: honest provenance labels, engine/tablebase validation where material allows, and use | — |
| C2 | Users complete and compare branches in a majority of Plan Drill sessions | unmet | — |
| C3 | Second-attempt objective performance improves meaningfully | unmet | — |
| C4 | Delayed related-position performance beats the baseline format | unmet | — |
| C5 | Opponent coherence judged acceptable for ≥80% of branches | unmet; external arm out of 1.0 scope | `design/research/bot-policy.md` `[V]` completes the mechanical screen; the integrity-checked 42-branch blind packet/key/scorecard remain for owner use. D649 descopes recruited review, so the population denominator remains zero and no “human-like” clearance may be claimed. |
| C6 | Pack authors can create a ~~reviewed~~ pack with a documented, repeatable workflow | 📊 evidence, qualified | nine waves ran the same documented loop with a falling first-run validator error rate (`design/research/pack-authoring-cost.md`). **"reviewed" is struck**: C1's reviewer pass was withdrawn 2026-08-13, so the word describes a stage that no longer exists |
| C7 | Endgame restart and response latency feel effectively instant | mechanically met; owner feel untested | `design/research/endgame-latency-versus-cet.md` + `interaction-state-correctness.md` `[V]`: restart/rewind/reply budgets pass and the repaired exact-UCI floor is 90/90 live gestures with zero wrong/missing. “Feels effectively instant” still requires the owner's real-content session; automation clears the broken-surface blocker, not the experiential clause. |

These gate **vertical slice → product build**. They are deliberately later than E1–E5:
the brief assumed a slice would be built to test H1–H5, while E1–E5 decide whether
building that slice is justified at all.


## Breadth gates — **COMPLETE 2026-08-14**: B1–B11 all green, content era open

**Correction 2026-08-21 (claude on the O1-O4/O13 rulings; headline retained as history):** the
2026-08-14 landing stands as what shipped then, but it is no longer current integration truth.
B4 (A4), B8 (R18/O13), B9 (A3) and B10 (A5) carry dated negative or qualified re-audits in the
rows below, mirrored from `design/03-product-breadth.md` as amended 2026-08-21.

## Breadth gates (B1–B8) — mirrored from `design/03-product-breadth.md`

Owner ruling 2026-08-11: implement the full feature spectrum solidly with
thin/example fixtures before content depth. Canonical definitions live in the
design doc; statuses are tracked here with every other gate so the gate surface
is not split. Program order (amended by evidence): shell → **evidence/
explanation** → session contexts → mode breadth → review → create → return →
live.

| # | Gate | Status |
|---|---|---|
| B1 | Shell and entry: stable Play/Learn/Review/Live/Create/Library/Settings routes; resume works | shipped — shell, routes, resume; `phase` projected (D6 closed by `defect-sweep`). Residual: `/settings` remains display-only |
| B2 | Solo modes: Just Play + Line/Plan/Outcome/Trajectory each complete one fixture run | **shipped in full 2026-08-14** — all four drill modes plus the Just Play position player (`shape-library`); the justPlay/fromPosition capability rows are live |
| B3 | Review: manual multi-branch selection, pair/multi compare, replay, deep mode, share/export, **plus branch groups — N candidates forked and played in parallel with resistance held constant** | **mechanically shipped in full.** N-way compare, simulate, prediction rendering, deep analysis, export, branch groups, difference strips and deterministic Story narrative all ship. **R7 qualification 2026-08-21:** the residual is selection/action quality, not missing surface: `review.story` admits 0 F2 semantic events, each moment has only re-entry, private/public top-eight policies disagree and the social card can misstate its source (D687-D689). Same-mainline measurement adds that local cap-one fact selection still creates 13/16 moments on long trajectories, while retained engine pivots reach 20/20 opening and 0/29 middlegame/endgame mainlines (D690-D691). |
| B4 | Evidence: authored, Stockfish, Maia, corpus, Syzygy, features, LLM-rendered layers with timing controls | authored ✓, Stockfish ✓, Maia ✓, **corpus/recency ✓ (`runtime-corpus-evidence`)**, structural mechanics ✓ (B9), voice seam ✓. **Feedback Stage 1 (2026-08-21):** **98/196 evidence-admitted, 98/196 evidence-withheld; 69/98 admitted claims render across 32/50 packs and 29/98 remain timing-withheld**. **F1/F2 update (2026-08-21):** the compiled contract now closes at **20 producers / 126 projections / 25 consumers / 175 bindings**, plus 33 operand-preserving semantic events, 33 research eligibility rows, 15 reasons and one complete-local-population policy. Exact source adapters and one rendering authority ship. The first three R3 packets evaluate **55/55 alternatives** and preserve fact IDs/squares into the prototype, while D686 shows research-wide eligibility still admits generic spare-cap facts. R5 keeps deterministic rendering normative and optional LLM prose post-selection. **Hint-selector qualification (2026-08-23):** raw precedence selects an opponent edge in 28/72 non-empty rows; the relation-safe table admits 35/150 occurrences and reaches only 16/64 depth-12 / 10/64 100-ms positions. Its depth-12 selector-only p95 is 1,596 ms before engine/transport/rendering. Perspective/sign research is closed; the current Guided Hint RFC remains returned pending shared-packet E2E measurement, sealed disclosure and owner use. Residual: Feedback Stage 2 + F5's module-specific eligibility/presets/defaults + owner-use validation; F2 deliberately grants no product-module admission |
| B5 | Live: Twitch host/chat/overlay, academy roles, external Arena handoff | mechanically shipped 2026-08-13 (`live-session-platform`) — roles, board control, spectate, chat voting, academy, Arena two-leg handoff. **R15/R16 qualification 2026-08-21:** the overlay uses shared run/session state only, states withholding, attributes relayed votes and supports 2–8 options; no Twitch/YouTube bridge or editorial delay ships. Academy still has no explicit assistance profile and inherits Position. **R17 qualification 2026-08-21:** native friend play is a complete casual learning path but has no clock/rating/public pool/fair-play claim; Arena's opaque URL/manual PGN lacks provider/challenge/game identity and automatic return. Official Lichess APIs supply the competitive substrate. O11 owns professional compositions; O12 is ready on a hybrid private-native + optional provider-round-trip recommendation. Native public matchmaking remains outside 1.0 unless the owner reverses that scope |
| B6 | Create: pack studio/import/review/session-distill produces a validated fixture; corpus mining emits one candidate | shipped — mining (`candidate-emit`) plus studio write path, imports and publication channels. **Correction 2026-08-14 (forward trace): session distillation was claimed here and does NOT exist** — `session_distilled` is a reserved enum with zero producers; re-ledgered (`pack-studio`) |
| B7 | Return: history/resume, progress, concept scheduling, related retry, recommendations | shipped 2026-08-13 (`return-and-progression`) — attempt scheduling, progress, `/learn`, duplicate, related retry. **Correction 2026-08-14 (forward trace): the opt-in recommender was claimed here and does NOT exist** — no route, disclaimed in the canonical doc; re-ledgered as an orphan. Cross-pack concept identity deliberately absent (a studio/B11 contract) |
| B9 | Structural reading: feature predicates computed, authorable and rendered; denial/outpost/diagonal/pressure/discovered-consequence readables with no engine; honest abstention | **shipped 2026-08-14 (`structural-reading`)** — twelve scoped feature predicates, dual readable/authorable role, Pack B graded by structural consequence, closed-by-default disclosure. Rung-0 layer is real. **Qualified 2026-08-21 by A3 (`design/research/detector-semantic-conformance.md`, 2026-08-20):** only 11/18 structural families round-trip (seven subset/lossy/matcher-only), all six transition families lossy, 0/3,371 transition observations retain squares, and zero complete families are unconditionally admitted as learner events under O2's eligibility bar. Machinery stands; the learner-event projection does not yet |
| B10 | Adaptive guidance: live phase/structure classification in-run, assistance configurable per session context, author-free pivotal detection, endgame steering by named technique | **mechanically shipped; workflow/default qualification open.** Attributed phase classification, silent raw preferences, pivotal markers, gated human splits, endgame naming, eval pivots and deterministic voice seam exist. **A5:** six profiles expose 54 mechanism controls but only one unnamed default; permissions are byte-identical across run kinds; only 2/6 intended workflows bind directly; Academy and Story bypass expected addressing. Thus “configurable” is true only at the mechanism layer, not yet as opinionated workflow presets/ceilings |
| B11 | Reusable shapes: a shape entry attaches wherever its trigger fires; a drill is a generated recipe; one play surface | **mechanically shipped 2026-08-14 (`shape-library`). R8 qualification 2026-08-21:** 38/50 draft packs carry 44 shape references across 21/25 shapes and the server reverse-resolves encountered shapes to pack IDs, but the learner action discards that ID, includes prospective references, and ShapePanel/Library/Review expose no exact theory↔drill handoff (D692-D695). Reuse exists in storage/runtime; the end-to-end learning workflow does not. |
| B8 | Platform: desktop shell, responsive/PWA, self-hosted engines/providers, share links, accessibility | **mechanically shipped, release-qualified by R18.** The light profile completes/persists a rehearsal without cloud secrets and share links ship. Accessible-board-input (`2b68103`) repairs the former pointer-only board with one controller, five input modes, a 150-cell permanent matrix and a semantic post-gesture grid; owner device/browser/AT validation remains D3. The 1.0 platform floor is still unmet independently: no account export/backup contract; deletion retains solo runs; Maia loss leaves green capabilities and hangs an uncached request; distributed notices/SBOM are absent; the 5.11 GB Maia image carries proprietary-labelled CUDA dependencies; PWA remains manifest-only. `design/research/release-platform-audit.md` `[V]`; O13/F12 own the release floor. |

**B4 corroboration note, 2026-08-26:** D143 now crosses the committed ledger partition in a
research instrument: two Stockfish-18/depth-22 runs over all 288 Syzygy FENs repeat 288/288
observations and agree with exact W/D/L throughout. The preregistered ±25 cp screen separates this
fixed population, but B4 does not gain a scalar normalization: cp/mate and W/D/L/DTZ/DTM remain
typed, source-local operands, and cross-version/independent-population validation is still absent.

**Watch item — the Lucas Chess failure mode:** breadth without unifying depth
produces a mode menu, not a product (our own competitor research named this
case). If surfaces accumulate while B4 stays unmet, that is K6/K4 evidence
accruing by construction — escalate rather than continue.

**Watch-item evidence, 2026-08-16 (`design/research/mechanics-by-mode.md`), and it
splits.** *Against* the failure mode, decisively: there is **no mode menu**. `DrillScreen`
is mounted at exactly one place (`App.svelte:574`) and a pack drill and a Just Play game
present the **same 18/19 controls**, measured hands-on; Live never creates a run of its own;
the rung-0 lens layer is pack-independent and in fact *wider* without a pack. The unifying
protocol Lucas Chess lacks is the thing this product actually has. *For* it, on a narrower
axis: the failure has moved from *surfaces without depth* to **capabilities without entry
points** — simulate has two complete server verbs and zero client bytes (its specified
acceptance test was never written); `duplicate` and `schedule` have no client caller; the
live audience cannot cast a vote from a browser; and **rungs 3, 4 and 6 are structurally
unreachable during a Just Play game** because no reveal control exists in the run screen.
That last one is B4-adjacent and is the row to watch: the evidence *layers* are built, but
in the product's widest mode they cannot be opened while playing. Thirteen such gaps are
ranked in the dossier; **no gate definition is changed by this note.**

**Two gate-row corrections owed to `design/03` (owner tier — escalated, not edited here,
and deliberately not applied to this mirror so the surface stays single):** B1/B8's residual
*"`/settings` remains display-only"* is **stale** — it renders 54 live assistance controls
across six contexts, measured hands-on; and B4's *"Syzygy runtime rendering"* residual is
**over-broad** — the `branch-decidedness` → `BranchRail.svelte:75` path ships and is
pressable, and the true residual is a single missing `tablebase:` branch in
`evidence-sentences.ts:143`. Also `03:299`'s B3 residual (narrative mode + difference
strips) is stale: both ship and both render.

## Engine-condition rule — mirrored from `design/05-in-run-experience.md` §2

Added 2026-08-15 by claude on the owner's ruling. The owner ruled the
engine-condition surface's home to be **both** `design/05` (the rung rule) and
`design/03` (a map row); this mirror is what keeps the gate surface single, per law 5.
`03`'s row is a map entry and defines nothing. The normative text lives in `05`.

1. A condition may only reference a reading a **recorded producer** actually emits.
2. A threshold must sit **off its instrument's optimality boundary** — a trigger point
   coinciding with what the instrument calls optimal is a verdict, not a measurement.
3. A threshold nothing measures is marked **`unmeasured`** and carries a **binding
   experiment**; it is the one disposition that must be revisited.
4. **Silence remains the default.** A condition firing does not license speaking, and
   *failing* a measurement demotes while *lacking* one does not.

Worked instance: `tablebase_dtz_regression`'s `byAtLeast` floor of **3** is derived from
clause 2 (the first value provably off the tablebase's optimality boundary) and carries
clause 3's `unmeasured` disposition, because nothing measures where *"materially harder
to convert"* begins. Owner-ruled 2026-08-15.

## Success metrics (measurement vocabulary for the above)

- **Learning:** second-attempt objective achievement; related-position performance;
  timing-window failure reduction; endgame conversion/hold/save rate across variants;
  ability to state the correct plan without engine terms; retention after several days.
- **Product:** % of users who fork ≥1 branch; % who compare branches; useful replays
  before abandonment; time from pack selection to first move; restart/rewind latency;
  session completion; voluntary return to the same concept.
- **Content quality:** coach agreement with objective and accepted alternatives; factual
  error rate in feedback; frequency of "both moves fine, explanation forced" cases;
  opponent coherence rating; manual fixes per generated candidate pack.

**Measurability audit (2026-08-12 alignment pass).** Two metrics above are
currently unfalsifiable, which makes any verdict resting on them theater:

- *"voluntary return to the same concept"* — still unfalsifiable, but for a
  narrower reason than when this audit was written. **F3 supplied the learner
  subject**, so that half is closed. What remains absent: cross-pack concept
  identity (`concepts` exists only in the JSON schema and is unique within one
  pack) and any episode-attempt record. Measurable when B7's attempt record and
  a concept registry land.
- *"second-attempt objective achievement"* — **corrected 2026-08-13: this is now
  stale.** Pack A became gradable via its `offObjective` deviation and boundary
  checkpoint (`apps/server/src/pack-orchestrator.ts:171-211`). The metric needs
  an honest denominator rather than a caveat: only packs where
  `objectiveRules(pack).length > 0` can contribute, or an ungraded pack silently
  counts as a failure to improve. `return-and-progression.md` specifies it.

Recorded rather than quietly dropped: a success metric with no mechanism behind
it is exactly the small-n evaluation problem already ledgered in `BACKLOG.md`.

---

## Gate rulings mirrored 2026-08-23 (claude on the owner's rulings, law 5)

**This section exists because the gate surface was SPLIT.** Four owner rulings changed gate state
and none had reached this file — which is the canonical gate document, so a reader here would have
been told the campaign gate is shut and the content hold is whole. **Both false, by owner ruling.**
Law 5 requires gate definitions to be mirrored so the gate surface is never split; that requirement
was unmet from the moment each ruling landed until now.

- **[[D949]] — the content hold is ACTIVE and covers the binding wave WHOLE.** The owner chose the
  strict reading over the recommended split, accepting that the first play session waits behind
  Gate F. *(Superseded in part by D1005 below — read them together.)*
- **[[D1005]] — the hold is SPLIT: the binding arm is RELEASED, the graduation arm stays held.**
  Amends D949 on measurement that did not exist when it was made: the binding arm's dependencies
  have been frozen since the packs were written, it is 41% pure script and 0% chess judgement, and
  one pack goes from 1 of 4 claims to 4 of 4. The graduation arm remains held behind lane 0.28's
  breaking change. **The line: the binding arm may retire binding debt, never graduation state.**
- **[[D953]] — the campaign-RFC gate is WAIVED.** `planning/campaign-research-queue.md`'s *"no
  campaign RFC may be drafted until the narrowed R6–R8 experiential closure"* no longer holds. R6's
  design half was ruled the same day ([[D945]], earned rewinds); R7/R8 remain open and experiential,
  and the v1 RFC's play-derived amendments are their landing site.
- **[[D1093]] — the drafting mandate.** The owner's *"make sure we have all the DEPTH and BREADTH"*
  plus the per-lane rulings ([[D1031]] variants, [[D1041]] time controls, [[D1060]] famous games)
  constitute the owner ruling RFC-0000's exploration gate requires. **Product-surface RFCs in those
  ruled lanes may be drafted.** Three RFCs cite this as their licence; it belongs here.

**Gate F itself** (`planning/platform-alignment/plan.md`) is unchanged by these except clause 7,
amended on [[D996]] to *"measured and ruled per release"*, and clause 2, recorded as passing on
[[D992]].
