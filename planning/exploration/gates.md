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
| K5 | Maia/corpus opponents produce incoherent plans over the required horizon | open | — |
| K6 | Explanations remain generic despite curated packs | open | — | **📊 partial evidence FOR firing, 2026-08-15 (`design/research/feedback-versus-the-dashboard.md`):** the feedback is generic on what is **delivered**, not on what is **authored** — 235 deviation notes are bound to named non-spine moves and reach learners, while **0 of 131 feedback claims have any delivery path** and 22.1% of a 202,479-character authored prose corpus cannot reach anyone. **The remedy is delivery, not authoring.** · **📊 second partial evidence FOR firing, 2026-08-16 (`design/research/conjunction-hypothesis.md`, R11):** the *generated* half of the explanation layer cannot be made specific by combining primitives. Over 721 transitions and 19,099 alternatives, the best of 55 conjunctions reaches 35.7% precision and 2.73× discrimination against 69.4% and 12.64× for the best **single** primitive; only 7 of 55 are measurable at all and their median lift is **0.66×**, worse than a random quiet move; no triple of transition primitives reaches 10 witnesses in the whole corpus. **The route out of genericness is not composition** — it is the authored tier K6's first note already identified, plus the rare single primitives (`last_of_role` at 12.64×). **The criterion is not called: this is evidence about one mechanism that was proposed to fix K6, not evidence that curated packs stay generic** — the authored deviation notes still discriminate by construction.
| K7 | Authors cannot reliably encode timing and structure without excessive custom code | open, split by evidence | structure is reliably encodable (`design/research/authored-transitions-and-features.md` §5.1–5.2); **timing is not encodable at all** (§4, two independent attestations, 0/135 usage). The criterion does not fire on a conjunction with one half confirmed working; the timing half is logged as partial kill-criterion evidence |
| K8 | Full-segment replay does not transfer to related positions | open | — |
| K9 | Endgame mode is not materially faster or more usable than Chess Endgame Training | open | — |
| K10 | Pack production cost is so high that only a handful can ever exist | 📊 evidence against firing | `design/research/pack-authoring-cost.md` (2026-08-15): 33 instrumented packs over nine waves, **43.5 agent-min/pack**, tooling friction **11.6%** (9.2% excluding pack A) — under the ~25% build-tooling threshold. **Strengthened 2026-08-15 by grounding wave G1**: the opening grounding bill is now PAID and measured at 10.3 min/pack, making a fully-loaded opening pack ~39.1 min — at or under the Syzygy endgame rate of 40.6, which was the dossier's stated condition for settling this half. Still NOT closed: **runtime playtest cost remains unmeasured since 2026-08-12** (no wave has played a run), and grounding covered *moves* only — prose, plan classes and deviation classes remain ungrounded |

## Exploration-to-slice gate

The first experimental vertical-slice RFC may open when all of the following have reached
`📊 evidence` or better, or when an owner ruling explicitly accepts the remaining risk:

| # | Gate | Owned by | Status | Evidence |
|---|---|---|---|---|
| E1 | Competitive teardown confirms meaningful integrated-loop whitespace | Q1a | **met** (owner ruling 2026-08-12: desk evidence sufficient; reopen if contradicted) | `design/research/teardown-cet.md`, `teardown-noctie-desk.md`, `teardown-chessable-desk.md`, `teardown-chesscom-desk.md` |
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
| C5 | Opponent coherence judged acceptable for ≥80% of branches | unmet | — |
| C6 | Pack authors can create a ~~reviewed~~ pack with a documented, repeatable workflow | 📊 evidence, qualified | nine waves ran the same documented loop with a falling first-run validator error rate (`design/research/pack-authoring-cost.md`). **"reviewed" is struck**: C1's reviewer pass was withdrawn 2026-08-13, so the word describes a stage that no longer exists |
| C7 | Endgame restart and response latency feel effectively instant | unmet | — |

These gate **vertical slice → product build**. They are deliberately later than E1–E5:
the brief assumed a slice would be built to test H1–H5, while E1–E5 decide whether
building that slice is justified at all.


## Breadth gates — **COMPLETE 2026-08-14**: B1–B11 all green, content era open

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
| B3 | Review: manual multi-branch selection, pair/multi compare, replay, deep mode, share/export, **plus branch groups — N candidates forked and played in parallel with resistance held constant** | shipped in full — N-way compare, simulate, prediction rendering, deep analysis, export, **and branch groups (2026-08-14)**. Residual: narrative mode + difference strips (forward-trace orphan, ledgered) |
| B4 | Evidence: authored, Stockfish, Maia, corpus, Syzygy, features, LLM-rendered layers with timing controls | authored ✓, Stockfish ✓, Maia ✓, **corpus/recency ✓ (`runtime-corpus-evidence`)**, structural ✓ (B9), voice seam ✓. True residual: Syzygy runtime rendering + full evidence-bound LLM rendering |
| B5 | Live: Twitch host/chat/overlay, academy roles, external Arena handoff | shipped 2026-08-13 (`live-session-platform`) — roles, board control, spectate, chat voting, academy, Arena two-leg handoff. Native matchmaking stays outside minimal-real scope by design |
| B6 | Create: pack studio/import/review/session-distill produces a validated fixture; corpus mining emits one candidate | shipped — mining (`candidate-emit`) plus studio write path, imports and publication channels. **Correction 2026-08-14 (forward trace): session distillation was claimed here and does NOT exist** — `session_distilled` is a reserved enum with zero producers; re-ledgered (`pack-studio`) |
| B7 | Return: history/resume, progress, concept scheduling, related retry, recommendations | shipped 2026-08-13 (`return-and-progression`) — attempt scheduling, progress, `/learn`, duplicate, related retry. **Correction 2026-08-14 (forward trace): the opt-in recommender was claimed here and does NOT exist** — no route, disclaimed in the canonical doc; re-ledgered as an orphan. Cross-pack concept identity deliberately absent (a studio/B11 contract) |
| B9 | Structural reading: feature predicates computed, authorable and rendered; denial/outpost/diagonal/pressure/discovered-consequence readables with no engine; honest abstention | **shipped 2026-08-14 (`structural-reading`)** — twelve scoped feature predicates, dual readable/authorable role, Pack B graded by structural consequence, closed-by-default disclosure. Rung-0 layer is real |
| B10 | Adaptive guidance: live phase/structure classification in-run, assistance configurable per session context, author-free pivotal detection, endgame steering by named technique | **shipped 2026-08-14 (`adaptive-guidance`)** — attributed phase classification with honest abstention, silent-by-default preferences, passive pivotal markers (two-decision option collapse), disclosure-gated human splits, endgame technique naming, retrospective eval pivots, packet-bound voice seam with deterministic fallback |
| B11 | Reusable shapes: a shape entry attaches wherever its trigger fires; a drill is a generated recipe; one play surface | **shipped 2026-08-14 (`shape-library`)** — shape entries (Carlsbad/IQP/rook-type official), pack references, derived-projection markers in Just Play and drills, the position player, SHAPE_PROSE_CONTAINS_FEN |
| B8 | Platform: desktop shell, responsive/PWA, self-hosted engines/providers, share links, accessibility | deployment shipped incl. the light profile (D5 closed); share links via live platform. Residuals: PWA transformation, settings controls |

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
*"`/settings` remains display-only"* is **stale** — it renders 36 live assistance controls
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
