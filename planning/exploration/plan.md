# Exploration — the go/kill job

**This is the repo's entry point.** The job: decide whether the chess phase rehearsal
system (see `design/00-thesis.md`) is worth building, and in what shape. Everything else
in the repo serves the questions below.

Question status ladder:
`💡 posed` → `🔬 researching` → `📊 evidence` (dossier landed, gate statuses updated) →
`✅ settled-go` / `⛔ settled-kill` / `🔁 repositioned`

Companion files: `gates.md` (hypotheses H1–H5, kill criteria K1–K10,
exploration-to-slice gates E1–E5, continuation gates C1–C7), `log.md` (append-only
record). Evidence lands as dossiers in `design/research/`.

## Question ledger

| # | Question | Status | Attached gates |
|---|---|---|---|
| Q1a | Is the integrated rehearsal loop competitively novel? | ✅ settled-go (owner ruling 2026-08-12) | E1 |
| Q1b | Do target learners and coaches recognize and want the problem solved? | 💡 advisory (E2 demoted 2026-08-12; re-gates public push) | E2, K2–K3 |
| Q1c | Does rehearsal improve learning versus simpler formats? | 💡 · requires slice | H1–H4, K1, K4, K8, C2–C4 |
| Q2 | What source, deployment, monetization, and content-rights posture fits? | ✅ settled, **deployment axis amended 2026-08-12 to hosted multi-user** (owner ruling; fires ADR-0004's revisit trigger; AGPL §13 now binds). Other three axes unchanged | — |
| Q3 | Mobile: scope or non-goal? | 💡 | — |
| Q4a | Can authors declare useful phase transitions and timing windows? | 📊 evidence 2026-08-15 — **split verdict**: boundaries yes (32/35 packs, 17 voluntary), timing windows **zero** (0/135 checkpoints). `design/research/authored-transitions-and-features.md` | E3, K7, C6 |
| Q4b | Can deterministic features assist authors reliably? | 📊 evidence 2026-08-15 — reliable wherever the claim is a **census**, absent wherever it is a **judgment** (plans, intent, history, timing). §6 is the predicate roadmap. `design/research/authored-transitions-and-features.md` | K7 |
| Q4c | Can automatic phase/structure recognition support Just Play without pretending certainty? | 💡 · breadth-blocking for Just Play; optional for curated packs | B2, B4 |
| Q5 | Can a runnable human/corpus policy stay coherent over 10–20 plies? | ✅ settled-go (validation-by-use, smoke 2026-08-12; revisit only if drill play contradicts) | H5 supported |
| Q6 | How do we use historical games without the ingestion-first trap? | 💡 | — |
| Q7 | What does a drill pack cost to author? | ✅ answered `[P]` 2026-08-15 — `design/research/pack-authoring-cost.md`; residual named: opening-pack grounding cost and runtime playtest cost are unmeasured (`planning/content-era/`, six-category instrumentation) | K10, K7, C6 |
| Q8 | Can feedback beat "Stockfish labels + prose"? | 💡 | K6, C1 |
| Q9 | Is branch/rewind/compare understandable without branch explosion or comparison overload? | 💡 | E5, K3, C2 |

## Q1 — Novelty, problem value, and learning effect

The brief's desk research says no free/self-hosted workflow combines conceptual opening
rehearsal, multi-move middlegame branching, and practical endgame outcomes with good UX
(`archive/brief-v2/02_MARKET_AND_EXISTING_SOLUTIONS.md`, 28-product matrix). That is a
competitive-whitespace claim, not evidence that learners want the product or that it
improves learning. Q1 is deliberately split so one kind of evidence cannot impersonate
another.

### Q1a — Competitive novelty

- **What settles it:** hands-on teardowns confirming that the integrated loop is absent,
  not merely undocumented.
- **Next actions** (research queue 1–4): benchmark Chess Endgame Training
  latency/branching · verify Noctie's takeback/branch persistence and feedback timing ·
  test Chessable bot-from-course-position on strategic chapters · test Chess.com
  Practice for multi-move redo and color switching.
- **Decision gate:** meaningful whitespace confirmed → Q1a `📊 evidence`; an existing
  product already does the loop well → 🔁 reposition around the residual gap or ⛔.

### Q1b — Learner and coach problem value

- **What settles it:** structured interviews plus a low-fidelity concept test with target
  learners and coaches. Test recognition of the underlying failure (timing, plan execution,
  transition, conversion), current workaround frequency, preference against simpler
  alternatives, and credible intent to repeat the loop. "Would we use it?" is useful owner
  evidence, not market evidence.
- **Decision gate:** repeated problem evidence and preference for the rehearsal interaction
  → Q1b `📊 evidence`; polite interest without a recurring job → reposition or stop before
  building.

### Q1c — Learning effect

- **What settles it:** H1–H4 tests on the vertical slice against line recall, engine-PV
  viewing, one-move retry, and key-move endgame puzzles. Immediate performance alone is
  insufficient; related-position transfer and delayed retention are load-bearing.
- **Ordering:** Q1c cannot gate construction of the slice needed to test it. It gates the
  later product build through C2–C4.

## Q2 — Product posture on four independent axes

The brief's corrected verdict scores "worth building for personal/self-hosted use" 9/10
but "ready-made SaaS business case" 5/10. "Paid vs OSS vs self-hosted" is a false
trichotomy: charging money, publishing source, and operating a hosted service are
independent choices. Decide four axes explicitly:

1. **Source model:** open source, source-available, or proprietary components.
2. **Deployment:** local-only, self-hostable, hosted, or a supported combination.
3. **Monetization:** free/donation-supported, paid hosting, paid support, paid content, or
   another model. Copyleft licenses do not prohibit charging.
4. **Content/data rights:** licenses and provenance for packs, annotations, historical
   PGNs, model weights, and derived datasets—not only application code.

Licensing constrains combinations: Stockfish GPLv3, Maia-3 AGPL-3.0, and Lichess dumps
CC0 according to the cited archive research. Exact obligations depend on distribution,
network deployment, process boundaries, modifications, and the other selected libraries;
legal review belongs before any public or proprietary release
(`archive/brief-v2/08_ENGINE_CORPUS_AND_CONTENT.md`).

- **What settles it:** an owner decision recorded as one choice on each axis, informed by
  competitor pricing/positioning, willingness-to-pay evidence from Q1b, and a dependency /
  content-rights inventory (research queue 10). Q1a/Q1b failure moots most commercial options
  but does not automatically answer whether a personal OSS experiment is worthwhile.
- **Working default until decided:** build-for-self, self-hostable, OSS-compatible
  dependencies, no assumed revenue model. A future paid offering remains possible but is
  not treated as a compatibility requirement that distorts exploration.
- **Owner direction (2026-08-10, logged):** if built, it will be **open source and
  free**, self-hosted on the owner's home servers, low expected usage; engines pushed
  to the browser (WASM) where possible so hosting stays cheap; agent/LLM features must
  run on a self-hosted LLM or cheap provider calls. Explicitly not wanted: paid SaaS,
  or the current fragmentation ("one site for openings, another for endings"). This
  settles the monetization and deployment axes in spirit.
- **Owner ruling (2026-08-12): source model = AGPL-3.0** (matches Maia, closes the
  hosted-fork loophole). Remaining open axis: content/data rights for packs,
  annotations, and derived datasets.

## Q3 — Mobile

The brief excludes mobile-native from v0 three times (scope, vertical slice, non-goals);
client thinking is web-first (chessground). But the brief never examined whether the
*rehearsal loop itself* suits mobile sessions (short, repeatable, tactile) — that's a
product-shape question, not just a scope cut.

- **What settles it:** a UX prototype question — is rewind/branch/compare usable on a
  phone screen, and is mobile-web (PWA) good enough? Deferrable until Q1a/Q1b show evidence.
- **Working default:** web-first, responsive; mobile-native remains a non-goal until an
  explicit reversal here.

## Q4 — Phase transitions at three levels

The brief's own design starts with packs declaring semantic boundaries and lets the
runtime supplement them (`archive/brief-v2/rfcs/RFC-0005-phase-and-trajectory-engine.md`).
Exploration must not turn an optional novel detector into a prerequisite for a curated
v0. Treat three capabilities separately:

### Q4a — Author-declared transitions (slice-blocking)

Hand-author opening→middlegame boundaries, timing windows, stop conditions, and plausible
endgame transitions for 2–3 real packs. The tempo contract
(`archive/brief-v2/04_OPENING_DRILLS.md`) supplies window-open/window-close nodes and a
luxury-move budget. Measure author time, reviewer agreement, exceptions, and custom-code
pressure. This feeds E3, Q7, K7, and C6.

### Q4b — Detector-assisted authoring (helpful, not initially blocking)

Define the smallest deterministic feature set—pawn-structure signatures, material
thresholds, queen exchange, tablebase eligibility, objective events—and test whether it
reduces authoring effort without overriding chess judgment. Compare suggestions against
independent coach labels; record disagreement and allow the detector to abstain.

### Q4c — Automatic recognition for Just Play

Curated packs do not need automatic truth: their authored phase/structure boundaries stay
authoritative and deterministic features may assist. The breadth ruling makes a separate
capability load-bearing for **Just Play**: recognize opening/book state, broad phase,
structure, transition, and candidate learning loci as an uncurated game develops; retrieve
relevant evidence or concepts; expose confidence; and abstain rather than inventing a
lesson. It requires labeled ground truth, inter-reviewer agreement, false-transition costs,
and explicit fallback behavior. Failure blocks B2/B4's Just Play promise but does not
invalidate curated drills.

## Q5 — Opponent long-horizon coherence

The acknowledged hard part: a move predictor can pick plausible single moves while
producing an incoherent 12-ply plan. The brief proposes a policy mixer (corpus
likelihood + Maia likelihood + plan compatibility + objective-preservation guard +
diversity penalty) but explicitly says: benchmark before inventing a complex planner.

- **What settles it:** use the same reviewed positions and deterministic seeds to compare
  runnable policies: Maia-3 model sizes/settings, ChessMimic if its released implementation
  is runnable, a corpus baseline, and weakened Stockfish as the explicit control. Chessformer
  is the architecture underlying Maia-3, not a separate opponent. Any additional model enters
  only after its code, weights, license, hardware needs, and reproducibility are recorded.
  Blind strong reviewers to the policy identity and score plan continuity, tactical sanity,
  objective relevance, diversity, and human plausibility over 10–20 plies. Record latency,
  memory, illegal/failure rate, and variance as well as move-match accuracy.
- **Tooling boundary:** the harness is disposable research tooling, not product code; label
  and log it accordingly.
- **Decision gate:** coherence acceptable on raw Maia-3 → strong go signal; acceptable
  only with the mixer → feasibility cost noted; incoherent regardless → K5 evidence,
  and H5 likely fails → the product's opposition story needs rethink.

## Q6 — Historical games without the ingestion-first trap

Corpus role per the brief: evidence and candidate spines, never automatic lessons.
Staged: Stage 0 = Lichess opening explorer API + curated PGNs (no bulk data); Stage 1 =
one streamed month with filters; Stage 2 = targeted historical slices. Causal integrity
rule for trajectories: no stitching a random endgame onto an opening without a real
transition path or explicit authored jump.

- **What settles it:** demonstrate that Stage 0 can source candidate spines and supporting
  examples for packs A/B/C with acceptable coverage, selection bias, reproducibility, and
  author effort. Record a provenance chain from each position/transition to source games.
  Audit separately the rights to raw move scores, annotations, metadata, model weights, and
  derived aggregates; a PGN obtained from a convenient site is not automatically reusable
  merely because the moves describe a historical game.
- **Next action:** run this as part of Q7 pack authoring. The staged strategy is a working
  hypothesis, not a settled answer; bulk ingestion remains deferred unless Stage 0 fails.

## Q7 — Content-pack authoring cost

The existential cost question: if a reviewed pack takes too long to make, only a handful
will ever exist (K10). The brief's v0 scope: first packs A (Sicilian timing/move order),
B (Carlsbad or IQP plans), C (practical rook endings); 100–200 reviewed
checkpoints/claims total.

- **What settles it:** author one pack end-to-end on paper (no runtime needed): spine,
  checkpoints, tempo windows, accepted alternatives, feedback claims with evidence refs.
  Time it. Recruit a strong reviewer (queue 9) and measure correction rate (feeds C1).
- **Decision gate:** one pack authored + reviewed with a repeatable workflow →
  `📊 evidence` toward C6; cost explodes → K10/K7 evidence.

## Q8 — Feedback depth beyond the dashboard

The anti-pattern is named: "Stockfish: +0.54 / Maia: 31% play Ne5 / LLM: 'Ne5
centralizes the knight'" is a dashboard, not a drill. The brief's alternative: claims
carry evidence refs + uncertainty; timing/tempo events ("the rook move consumed the only
spare tempo") beat eval deltas.

- **What settles it:** write the feedback for one real branch comparison by hand using
  only the evidence vocabulary (features, timing events, objective states) and have the
  Q7 reviewer judge it (C1's ≥80% acceptance bar). Specifically, Q8 depends on Q4a's
  authored semantics and tests whether Q4b's deterministic features add useful evidence;
  it does not depend on Q4c automation.

## Q9 — Branch/rewind/compare UX and branch growth

Branch storage is ordinary engineering; making preserved attempts understandable is a
product risk. The user must know where they are, why branches differ, which checkpoint is
active, and what to compare without facing an analysis-tree cockpit.

- **What settles it before code:** paper or clickable prototypes for desktop and phone,
  tested on representative two-, four-, and eight-branch sessions. Measure unaided task
  completion, time to rewind/fork/switch/compare, branch-origin recall, mistaken destructive
  actions, and comparison comprehension. Test explicit branch budgets, collapsing/grouping,
  semantic labels, and cleanup/archive behavior.
- **Decision gate:** the initial target viewport passes a preregistered comprehension bar →
  E5 evidence; repeated disorientation or comparison overload → simplify the loop before a
  runtime RFC. Q3 separately decides whether phone is an initial target, so phone failure
  can defer mobile without killing desktop.

## Sequencing

**Owner sequencing ruling, 2026-08-11:** the next program is breadth completion,
not pack A, a narrow feedback sidebar, or polish of the existing fixture. Sweep
and implement the complete surface in `design/03-product-breadth.md` with thin,
honest fixtures. Twitch/stream, academy, Position Arena handoff, Just Play,
phase-oriented modes, creation, return/progress, sharing, and every evidence
layer must fit the app shell and reach a real scenario. Content depth follows;
branch scoring/default inclusion and similar optimization follows functional
breadth.

1. **Now:** close the drill-client lifecycle, audit `design/03-product-breadth.md`
   against every archive/backlog surface, and cut a foundations-first RFC
   program across B1–B8. Do not let one mode own the global shell.
2. **Breadth implementation:** make every surface minimally real with explicit
   fixtures and acceptance scenarios. Shared primitives land before their
   consumers; visible entry points do not ship as fake placeholders.
3. **Parallel research:** Q1b/Q1c, Q3/Q4, Q6/Q8/Q9 and the continuation gates
   continue collecting evidence without redefining the breadth order.
4. **After B1–B8:** author catalog depth, then add branch scoring/automatic
   selection, personalization, and flow-specific polish while retaining manual
   control.

## Deferred and dropped

| Item | State | Why | Revival condition |
|---|---|---|---|
| Native Position Arena matchmaking/clocks/moderation | 🟡 deferred depth | External challenge/invite + PGN-return Arena is required by B5; only native infrastructure stays deferred | External Arena use proves demand for native play |
| Bulk corpus ingestion (Stage 1+) | 🟡 deferred; revival condition tested and **not fired** 2026-08-12 | Anonymous explorer access returned 401, but the same request with an owner-supplied operator token returned 200; Stage 0 suffices | Q6 later shows authenticated explorer data insufficient for pack spines |
