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
| K6 | Explanations remain generic despite curated packs | open | — |
| K7 | Authors cannot reliably encode timing and structure without excessive custom code | open | — |
| K8 | Full-segment replay does not transfer to related positions | open | — |
| K9 | Endgame mode is not materially faster or more usable than Chess Endgame Training | open | — |
| K10 | Pack production cost is so high that only a handful can ever exist | open | — |

## Exploration-to-slice gate

The first experimental vertical-slice RFC may open when all of the following have reached
`📊 evidence` or better, or when an owner ruling explicitly accepts the remaining risk:

| # | Gate | Owned by | Status | Evidence |
|---|---|---|---|---|
| E1 | Competitive teardown confirms meaningful integrated-loop whitespace | Q1a | **met** (owner ruling 2026-08-12: desk evidence sufficient; reopen if contradicted) | `design/research/teardown-cet.md`, `teardown-noctie-desk.md`, `teardown-chessable-desk.md`, `teardown-chesscom-desk.md` |
| E2 | Target learners/coaches recognize the problem and choose the rehearsal loop over plausible alternatives in interview or low-fidelity tests | Q1b | **advisory** (owner ruling 2026-08-12: not slice-blocking for a personal OSS build; re-gates any public push) | — |
| E3 | Authors can declare useful opening→middlegame boundaries and timing windows without automatic phase detection | Q4a, Q7 | unmet | — |
| E4 | At least one runnable opponent policy produces sufficiently believable multi-ply resistance for a slice | Q5 | unmet | — |
| E5 | ~~Low-fi prototype before UI~~ **waived by owner ruling 2026-08-12 ("A")**: comprehension is answered by use in the drill-client slice, iterating the real UI | Q9 | **met by use, qualified**: fork/rewind passed; compare selection, app-shell fit, and missing instructional layer define the follow-up | `planning/drill-client/log.md`, `rfc/drill-client.md` |

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
| C6 | Pack authors can create a reviewed pack with a documented, repeatable workflow | unmet | — |
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
