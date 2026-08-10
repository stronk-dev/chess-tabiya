# Exploration log (append-only)

## 2026-08-09 (claude, session 1) — entry zero

- Reorganized the repo from a single frozen brief package into cloud-clicker-style
  tiers, tuned for the exploratory phase. Decisions made with owner:
  - Full seed: structure + BACKLOG ledger + gates + three re-cut design docs.
  - The brief's RFC-0001..0008 and ADR-0001..0006 stay design-tier in `archive/`;
    `rfc/` Active table starts empty by rule (exploration gate in RFC-0000).
- `archive/brief-v2/` verified at import: 58/58 checksums OK, 0 failures.
- Seeded `plan.md` with Q1–Q8 (owner's stated concerns: novelty, paid vs OSS, mobile,
  UX, modern engines, phase detection feasibility, branching feasibility, historical
  games) and distributed the brief's 10-item research queue across them.
- `gates.md` lifted from `archive/brief-v2/14_VALIDATION_AND_KILL_CRITERIA.md`
  unchanged in substance; added the observation that H1–H5 testing presupposes a
  vertical slice, so "build the slice at all" is itself exploration's first decision.
- Next: Q1 hands-on teardowns and Q5 Maia coherence harness are the highest-signal
  starting points (see plan.md §Sequencing).

## 2026-08-10 (codex, review corrections)

- Reconciled the contradictory RFC gate: E1–E5 now gate the first experimental vertical
  slice; C1–C7 gate slice→product. Scoped disposable research harnesses and UX prototypes
  are explicitly allowed before an RFC.
- Split Q1 into competitive novelty (Q1a), learner/coach problem value (Q1b), and learning
  effect (Q1c), so teardowns cannot stand in for demand or transfer evidence.
- Reframed Q2 as four independent axes: source model, deployment, monetization, and
  content/data rights. Copyleft obligations constrain combinations but do not imply
  "cannot charge."
- Split phase work into author-declared transitions (Q4a), detector assistance (Q4b), and
  optional full automation (Q4c); automatic phase detection is no longer load-bearing for
  curated v0.
- Corrected Chessformer from "Maia alternative" to Maia-3 architecture. Q5 now compares
  runnable policies with identical positions/seeds, blinded review dimensions, resource
  measurements, and a weakened-Stockfish control.
- Added Q9 for branch/rewind/compare comprehension and branch growth. Expanded Q6 to test
  Stage-0 corpus coverage, bias, provenance, and separate rights for moves, annotations,
  metadata, weights, and derived data.
- Clarified the evidence convention: `[V]/[P]/[M]` are lightweight combined evidence
  labels; legal risk is separate; research claims may cite living/archive sources as well
  as URLs. No gate status changed—these are protocol corrections, not new evidence.
- Next: execute the revised first wave in `plan.md` §Sequencing and preregister concrete
  thresholds before changing E1–E5.

## 2026-08-10 (claude, session 1 continued)

- **Owner direction on Q2 (posture):** open source and free if built; self-hosted on
  the owner's home servers; browser-run engines (WASM) where possible; agents on a
  self-hosted LLM or cheap provider. No paid SaaS; no phase fragmentation. Recorded in
  `plan.md` Q2; source-model and content-rights axes remain open.
- **DESIGN-GAP escalated — target band:** owner stated the goal as "take a ~1000 player
  to >2000" (stop blundering, great-over-ok moves, applying strategy, reading opponent
  move intent). `design/00-thesis.md` and the archive scope the initial fit at
  1400–2200, explicitly *past* the blunder stage, and exclude a beginner tactics
  curriculum. Options for the owner: (a) widen scope to include a blunder-stopping/
  board-vision layer; (b) keep the 1400–2200 core and treat 1000–1400 as guided
  on-ramp packs (shorter branches, opponent-intent prompts); (c) accept that the
  1000→~1400 leg is mostly tactics volume served well by existing free tools, and our
  product owns the 1400→2000 leg. Thesis unchanged pending ruling.
- **Dossier landed:** `design/research/competitor-value-props.md` (adopt/conflict/
  not-relevant per competitor; 3 claims upgraded to [V] — WhyThisMove, Noctie, Chess
  Endgame Training). Notables: CET is an MIT PWA proving the free/browser posture
  feasible; WhyThisMove's LLM sidebar confirmed but cloud-routed (OpenRouter) — we
  need a local-LLM path; Noctie's per-move color labels are the ADR-0006 anti-pattern;
  Lucas Chess is the cautionary "free integrated but fragmented mode menu" case;
  DecodeChess possibly defunct (403) — explanation-without-drilling may not retain;
  chessfeed.ai's claimed saved-branch exploration overlaps our core mechanic,
  unverified → added to Q1a verification queue.
- **New ledger rows** (owner ideas): LLM concept-anchoring agent for responsive
  trajectories (retrieval anchors, LLM narrates — inside ADR-0005); position/structure
  embeddings; opponent-intent prompts; browser-run engines.
- Next: unchanged (first wave per `plan.md` §Sequencing) + owner ruling wanted on the
  target-band gap.

## 2026-08-10 (claude, session 1 continued — 2)

- **DESIGN-GAP resolved (target band), owner ruling:** option (b) adopted. Thesis
  amended: the product serves the ~1000→2000+ journey — core band 1400–2000+ as
  designed; 1000–1400 via on-ramp packs (same pack object, three knobs: 2–8-ply
  branches, pack-declared immediate blunder-guard overriding the ADR-0006 default,
  principle/threat objectives; opponent-intent checkpoints first-class). Explicitly
  not a tactics trainer. Note for the future drill-pack RFC: the pack format needs a
  per-pack feedback-policy field.
- **New ledger rows:** on-ramp pack lane (📐 at thesis level); anti-opening packs
  (💡) — owner's lived example: White facing the Caro-Kann Advance (3.e5 enticing but
  hard; c5/f6 breaks, Tal Variation 4.h4). Repertoire trainers drill *your* side of
  *your* openings; nothing drills facing an opening the opponent chose. Candidate
  first pack, owner can dogfood. Four owner-supplied demand-signal sources added as
  R46–R49 (`[P]`, unfetched).
- Observation for Q7: the anti-Caro-Advance pack is a strong pack-A alternative or
  companion — move-order/timing sensitive like the brief's Sicilian candidate, but
  backed by the owner's own recurring pain, which makes review and dogfooding cheap.

## 2026-08-10 (claude, session 1 continued — 3)

- **New ledger row (owner idea): prediction checkpoints** — flip the board at pivotal
  moments, predict the opponent's reply, explain why/why not. Assessed as a checkpoint
  interaction (cheap), not a new mode (expensive); graded against Maia's
  level-conditioned distribution + engine validation, which no surveyed competitor
  does. Sparse placement rule to protect the uninterrupted-consequence stage;
  board-flip ergonomics assigned to the Q9 prototype.

## 2026-08-11 (claude, session 1 continued — 4)

- **Gap sweep at owner request** ("what else is open before we can judge feasibility/
  novelty/value?"). Five untracked areas added to BACKLOG: skill/progress model +
  return loop; time-pressure dimension; pack interop (Lichess-study→pack conversion as
  a K10 lever); open pack format as the ecosystem contribution; small-n evaluation
  methodology (the existing H/C validation design assumes cohorts we won't have —
  must be resolved before preregistering E-gate thresholds).
- Open owner decision points enumerated for the record: Q2 source-model + content-
  rights axes (concrete license choice); first-wave sequencing commitment; E-gate
  threshold preregistration; pack-A choice (Sicilian vs anti-Caro-Advance); vertical
  slice scope (does it include on-ramp/prediction-checkpoint machinery or core loop
  only — recommendation: core loop only).

## 2026-08-11 (claude, session 1 continued — 5)

- Q1a moved from 💡 to 🔬: wrote `design/research/teardown-protocols.md` — four
  hands-on protocols (Chess Endgame Training, Noctie, Chessable, Chess.com Practice),
  each 30–60 min, testing our five loop stages + latency budgets against observed
  behavior, with a cross-product synthesis table that lands the E1 verdict. The
  feature/strengths desk pass is NOT being repeated — the matrix and value-prop
  dossier already cover it; teardowns exist to upgrade [P]→[V].
- Division of labor: CET needs no account (agent-drivable via browser automation with
  owner's setup, or owner-run); Noctie/Chessable/Chess.com need owner accounts —
  owner runs protocol, agent lands the dossier from notes/screenshots.

## 2026-08-11 (claude, session 1 continued — 5)

- **First hands-on teardown executed** (agent-driven browser session): Chess Endgame
  Training. Dossier: `design/research/teardown-cet.md` ([V] throughout). Headlines:
  the "slow/poor UX" report did NOT reproduce on desktop (API 80–224 ms, replies
  ~150–300 ms after a ~2 s first-reply pacing delay); real-time objective-state
  banners ("Unfeasible mate") exist but never explain WHY — state detection without
  teaching; branching is destructive (replayed futures are replaced, confirmed by
  experiment); what-if mode confirmed. E1 updated to 1/4, whitespace intact.
- K9 recalibrated: our edge over CET cannot be raw speed on desktop — it must be
  preserved attempts + comparison + evidence-backed feedback + variety. (Mobile
  latency still unmeasured; owner's impression may be mobile-specific.)
- Remaining teardowns (Noctie, Chessable, Chess.com Practice) need owner accounts —
  protocols ready in `design/research/teardown-protocols.md`.

## 2026-08-11 (claude, session 1 continued — 6)

- **Q1a → 📊 evidence.** All four E1 sources examined: CET hands-on + three
  desk/experience-mining passes (dossiers: `teardown-noctie-desk.md`,
  `teardown-chessable-desk.md`, `teardown-chesscom-desk.md`). Method note: owner
  challenged whether hands-on was necessary; desk passes with strict absence-labeling
  settled 3 of 4 products. Whitespace confirmed on every product:
  - Noctie: takebacks + live labels, zero public trace of attempt persistence or
    comparison. Residual: takeback ground truth ("does the old line survive?") —
    the ONE remaining hands-on item for E1.
  - Chessable: bot play-out is a one-way handoff to Chess.com with no course
    tie-back; deviation handling converges on the single authored move
    ("soft fail", no explanation). Recall→understanding gap intact.
  - Chess.com: undo destroys the original game; takeback-then-branch reported
    broken by users; a user guide manually reconstructing our loop across three
    surfaces is direct "orchestration is the product" evidence. Their drills ARE
    outcome-graded — so outcome grading alone is not our differentiator;
    attempts + comparison + evidence-backed feedback are.
- Bonus cross-finding for H5/ADR-0002: Chessable's bots are Chess.com engine bots,
  user-described as "3800-rated with random mistakes / hang their queen out of
  nowhere" — field evidence for the weakened-engine critique that motivates Maia.
- E1 stands at effectively-met-with-one-residual. Next E-gates: E2 (interviews,
  needs humans), E4 (Maia harness), E3/Q7 (author pack A on paper).

## 2026-08-12 (claude, session 1 continued — 7)

- **Owner idea: academy mode** (IM/GM-led sessions, player stage voting moves, leader
  snapshotting for branching). Assessed and deferred with owner's own framing
  ("or singleplayer only?") — singleplayer remains the bet: academy is the loop
  performed live (thesis confirmation) but operationally a different product
  (multiplayer machinery + titled-player supply, which the free/self-hosted posture
  cannot recruit; Lichess Studies already provide academy-lite boards). Ledgered
  under Deferred with revival condition.
- Two dividends extracted as live items: (a) session-replayability as a pack-format
  design constraint — session→pack distillation as a Q7/K10 authoring pipeline;
  (b) a manual one-evening academy session (coach + Lichess study + our protocol)
  as a combined E2 interview + Q7 distillation experiment, zero code.

## 2026-08-12 (claude, session 1 continued — 8)

- **Owner idea: Twitch/streamer mode** — materially changes the academy assessment:
  stream video replaces viewer clients (no multiplayer machinery), chat-vote
  aggregation is a trivial known pattern, and streamers are demand rather than
  supply. Re-ledgered as its own row with a weaker revival condition than academy
  (singleplayer loop validated + fun). Also noted as the distribution channel
  matching the free-OSS posture.
- **Underexposed-gems sweep** at owner request (what competitors do well but leave
  buried): Chessable SRS pointed at cards not episodes; Chess.com retry-from-mistake
  trapped in Game Review; Lichess explorer rating-band data undrilled; CET's
  FEN+objective deep links without curriculum; ChessTempo per-theme ratings driving
  nothing; Lichess Studies as session-records without drill semantics; Noctie's
  per-quality feedback configurability. Two new ledger rows (SRS-over-episodes,
  drill-in-a-URL); the rest already covered by existing rows/dossiers. Meta-pattern
  recorded: every competitor has one healthy organ of our product; none has the
  circulatory system.

## 2026-08-12 (claude, session 1 continued — 9) — OWNER RULINGS: gate transition

- **E1 closed as met** (ruling): desk evidence sufficient on the Noctie residual;
  reopen if contradicted later. Q1a → ✅ settled-go.
- **E2 demoted to advisory** (ruling): not slice-blocking for a personal free OSS
  build; re-gates any public push. Q1b stays open as advisory.
- **RFC drafting opened by owner override** (ruling, third option offered was the
  gates-as-foundations bridge; owner chose immediate RFCs): E3/E4/E5 accepted as
  in-flight risk, their experiments folded into implementation — E3 = author pack A
  inside drill-pack-format's acceptance criteria; E4 = Maia harness before any
  opponent-worker RFC; E5 = low-fi prototype before any UI RFC.
- Drafted `rfc/drill-pack-format.md` and `rfc/branch-runtime.md` (both Status:
  draft, awaiting owner acceptance). They mine the archive sketches/schemas and fold
  in every exploration-accumulated constraint: per-pack feedbackPolicy, prediction
  checkpoints, authored-boundary degradation contract, deviation classes,
  on-ramp knobs, drill-in-a-URL, session distillability, objective-state machine
  with why-evidence (the CET lesson), determinism/seeding, latency budgets as
  acceptance targets, deviation-never-blocks invariant.
- Phase relabeled: exploratory → foundation specification (AGENTS.md, README).
  Kill criteria remain live; K10/K5/K3 now get tested inside implementation.
- Next: owner reviews the two drafts → accepted → planning/ dirs + first
  implementation. Parallel: E4 Maia harness, pack A authoring on paper.

## 2026-08-12 (claude, session 1 continued — 10) — OWNER RULINGS: architecture

- **Execution model:** hybrid with **backend capability parity** — every capability
  must run on the backend (full-strength Maia needs the compute; browser model
  downloads never required); browser implementations are negotiated progressive
  enhancements. Written into `rfc/branch-runtime.md` §Execution model.
- **License: AGPL-3.0** (matches Maia, closes hosted-fork loophole). Q2 source-model
  axis resolved; content/data rights remain the last open Q2 axis.
- **Stack constrained:** no Python backend, no Rust; Go or Node/TS, client framework
  (Svelte/React/vanilla) genuinely open — owner wants a real comparison before
  pinning. Stack-selection dossier commissioned (in flight).
- **Review process:** cloud-clicker pattern adopted — adversarial acceptance reviews
  of both draft RFCs commissioned (blocker IDs DPF-C*/BR-C*), owner rules on
  blockers before drafts flip to accepted. Both reviews in flight.
