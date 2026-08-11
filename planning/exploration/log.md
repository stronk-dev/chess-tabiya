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

## 2026-08-12 (claude, session 1 continued — 11) — blockers resolved, RFCs accepted

- Owner ruled the 4 contested blockers/decisions: spine tree added to pack format
  (DPF-C2); minimal timing-trigger vocabulary frozen now (DPF-C3); **stack = TS
  core + Go workers doctrine** (after scaling analysis + owner pushback for full
  reasoning — memo in `design/research/stack-selection.md`); **Maia =
  containerized UCI sidecar now, ONNX later** (scoped Python exception: worker
  containers only). Client: Svelte 5.
- Remaining 12 blockers author-resolved per the batch proposals (implicit fork,
  read-back replay + per-locus determinism, runtime-owned objective machine with
  evidence-carrying transitions, typed errors + single-writer lease, path-keyed
  tree + transposeKey matching, JobObserver hook, compare contract, living run
  schema + event seq, frozen-baseline fixture split, prediction grading fields,
  RFC 8785 digest, enum feedbackPolicy, deviations rename, URL encoding).
- Both RFCs revised and flipped to **accepted**; planning dirs created
  (`planning/branch-runtime/`, `planning/drill-pack-format/`) with codex-ready
  plans. Phase: foundation specification → foundation implementation.
- Process note (memory saved): owner requires full reasoning visibly delivered
  before decision prompts; analysis now lands as committed memos first.

## 2026-08-12 (claude, session 1 continued — 12) — naming ruling

- **Repo name: `chess-tabiya`; product working name: Tabiya** (owner ruling;
  "drills"/"reprise"/"aftermove" rejected). Web check: no existing chess product
  named Tabiya. Description adopted: "Don't memorize the opening — rehearse the
  game it creates. Play past book against human-like resistance, rewind, branch,
  compare every attempt, and finish what you start."
- README/AGENTS/thesis updated. Directory rename (`mv ~/repos/chess-drills
  ~/repos/chess-tabiya`) left to the owner post-session — note: the Claude
  project memory dir is keyed to the old path and should be renamed alongside
  (~/.claude/projects/-Users-stronk-repos-chess-drills → …-chess-tabiya).

## 2026-08-12 (claude, session 1 continued — 13) — canonical GitHub description

- Owner-refined description locked (use verbatim for the GitHub repo):
  "Don't memorize the opening — rehearse the game it creates: play past book
  against human-like opposition, keep and compare every attempt, and convert
  your positions." ("convert your positions" is the owner's phrasing; replaces
  the explained-twice "drilled to the result / finish what you start" tails.)

## 2026-08-12 (claude, session 1 continued — 14) — owner rulings: sequencing + Q2 closed

- **Foundations first, content last (doctrine):** pack A removed from the
  drill-pack-format acceptance criteria; content phase runs after runtime, engine
  workers, and authoring/playtest tooling exist. E3/Q7/K10 evidence deferred
  accordingly — accepted and noted: measuring authoring cost WITH tooling is the
  fairer test. Pack A spine drafting removed from claude's near-term queue.
- **Q2 fully settled** — content-rights axis closed with the authoring rule:
  original prose only; ideas learned anywhere, cited; annotation text never
  copied (moves/scores are facts; Lichess CC0; deps AGPL-compatible). All four
  axes now ruled: AGPL-3.0 / self-hosted / free / original-prose+CC0-data.
- **Storage:** analysis delivered (SQLite's single-writer model matches the
  event-log workload; event sourcing makes a later Postgres migration mechanical
  — replay the logs). Recommendation on record: storage adapter + SQLite default,
  Postgres binding if a hosted multi-user instance becomes real. Formal moment:
  codex's §5 proposal, owner ratifies.
- Process feedback recorded: do not surface housekeeping (push timing, dir
  names) as owner rulings.

## 2026-08-12 (claude, session 1 continued — 15) — E4 harness built

- Q5 → 🔬. Built the E4 coherence experiment: preregistered protocol with
  decision rules (`design/research/e4-maia-coherence-protocol.md` — 6
  conditions incl. weakened-SF control, 16 roots across Carlsbad/Caro-Advance/
  IQP/rook-endings, automatic proxies + blinded review rubric) and the
  disposable containerized harness (`tools/maia-harness/` — python-in-container
  per the scoped exception; runner validated all 16 roots legal). Awaiting a
  homeserver run (docker build && docker run; ~minutes of compute).
- Honesty flags recorded in the harness README: maia3 CLI entrypoint and UCI
  option names are [P]-level — verify and pin on first run; roots are tabiya
  approximations to refine before the formal preregistered run.

## 2026-08-12 (claude, session 1 continued — 16) — owner correction: no experiment

- Owner rejected the E4 "experiment" framing ("why do we need this?"). Correct:
  exploration-phase rigor (preregistration, blinded review, decision thresholds)
  does not belong in the build phase. The protocol dossier is deleted. What
  remains: the containerized Maia UCI sidecar (needed by the engine-workers RFC
  regardless) and a smoke runner for eyeballing games. **Q5 is answered by
  validation-by-use during engine-workers implementation** — play it, look,
  tune. E4-as-formal-gate is retired with the rest of the ceremony; the K5
  concern stays real but is handled iteratively.
- Consequence: engine-workers RFC drafting is unblocked now (no harness-result
  precondition).

## 2026-08-12 (claude, session 1 continued — 17) — first lifecycle loop closed

- Verified codex's completion protocol: rfc/archive/branch-runtime.md
  (implemented), planning/archive/branch-runtime/, canonical
  docs/branch-runtime.md indexed, references updated, verify green, archive
  intact. **design → RFC → review → implementation → docs → archive: complete**
  for the product's core mechanic, three days after the repo was reorganized.

## 2026-08-12 (claude, session 1 continued — 18) — Q5 answered by use

- Ran the Maia smoke locally (Docker on the owner's machine; homeserver not
  needed — the 5M model is CPU-fine). 80 games: 16 roots × {Maia-5M@1600/1800/
  2000 with --use-uci-history, weakened-SF control, full-SF ceiling}, 20 plies.
- **Verdict (games read by claude): Maia-3 5M + history conditioning is
  plan-coherent and drill-ready.** Highlights:
  - m2@1800 Carlsbad: Ne5 + f4-f5-f6 storm + Rf3-g3 rook lift — a 10-move plan
    followed through.
  - m2@1800 Caro-Advance: white c4-c5/a4-a5 space plan vs black f6/f5 break
    with Rf7-Qf8-Re8 regroup — both sides on thematically correct plans.
  - m1@1600: played the correct e4 break ONE MOVE EARLY and lost d4 with check
    — exactly the timing mistake-class the product drills.
  - Rook ending: king activation, g4 break, rook behind the passer — real
    technique both sides.
  - Weakened-SF control: individually-fine moves, no story (Bc8, Ra4, Kh1
    noodling) — the H5 premise visible in raw data.
- Consequences: policy-mixer NOT needed for v1 (stays a ledger fallback);
  engine-workers RFC mandates history conditioning; shuffle-index proxy proved
  worthless vs reading games (full-SF scored highest) — dropped. Caveats:
  self-play, 20 plies, 1 game/root — a smoke, not proof; drill play is the
  ongoing validation. Games in tools/maia-harness/out/ (gitignored).
- First-contact fixes: maia3 installs from source (no PyPI), entrypoint
  maia3-uci, /usr/games/stockfish path. Container prebakes the checkpoint.

## 2026-08-12 (claude) — third lifecycle closed

- engine-workers verified implemented + archived (100 tests green with engines
  required, canonical doc indexed, ratified profiles shipped with provenance).
  Opponent stack complete: the runtime can now be played against Maia through
  the full writer-seam contract. Remaining before a playable product: the
  client RFC (drafting now) + deployment packaging (ruled, backlogged).

## 2026-08-12 (owner ruling via claude) — E5 waived

- Owner ruled "A": no low-fi mockup; branch/rewind/compare comprehension is
  answered by using the real UI, iterated in place. E5 marked waived→by-use in
  gates.md. Q9 (branch growth/comprehension tail) stays open, observed during
  the slice. drill-client RFC → accepted; planning dir cut with the
  owner-confirmed foundations-first layer order.

## 2026-08-11 (claude) — theory-sourcing dossier landed

- `design/research/theory-sourcing.md` fills the Q6/Q7 sourcing GAP with
  fetched-license verdicts. Headlines: lichess chess-openings CC0 (3,810 named
  lines — spine-name backbone); Wikibooks opening theory CC BY-SA 4.0 with
  real per-line prose (usable as separated content data, never mixed
  per-paragraph with ours); Lichess puzzle DB CC0 with 6.06M themed puzzles
  (strong on-ramp content seed); Syzygy files copyright-free; CET's credited
  endgame DB has murky provenance → do-not-use (its checkmate DB is GPL but
  derived from CC0 — re-derive ourselves); TWIC/PGN-Mentor/bulk-studies on the
  do-not-use list. Flag: explorer API probes returned 401 on both hostnames —
  investigate before Stage-0 relies on it; CC0 dumps are the fallback.

## 2026-08-11 (claude) — owner idea: forward-branching simulate

- Ledgered: variation-preview via auto-fork + deterministic spine playout →
  grid of resulting-structure mini-boards; previews are real branches
  (enterable/comparable/exportable). Clarified for the owner: branching is
  already fully user-driven (any node, any time) — checkpoints are authored
  interaction points, not gates. UI-RFC follow-up candidate.

## 2026-08-11 (owner) — first real-engine client walkthrough

- E5 now has by-use evidence. The owner likes the quick fork/rewind mechanic
  and calls the slice a great start worth slow iteration. This validates the
  interaction's promise, not the learning claim.
- Q9 friction: manual compare selection is cumbersome and should default to
  eligible branches; the desktop page scrolls instead of behaving as a fitted
  app shell.
- Q8 gap made visible: with pack A/content and the feedback composer deferred,
  the schema-example drill provides no meaningful theory explanation, LLM
  rendering, engine line, Maia alternatives, or guidance. Branch comparison
  therefore shows difference without explaining consequence. K4 and K6 remain
  open—not failed—because the necessary instructional layer was absent rather
  than tested and rejected.
- Ledgered the concrete follow-up surfaces: checkpoint/compare explanation
  sidebar with selectable validated evidence, compare-all defaults and
  multi-branch overview, and viewport-contained desktop app shell.

## 2026-08-11 (owner ruling) — full product breadth before content

- Corrected the implementation strategy: “content last” never meant one narrow
  pack-shaped vertical slice followed by local polish. It means implement the
  full feature spectrum solidly first, use thin/example fixtures to exercise
  it, then iterate rapidly on authored content.
- Breadth includes far more than the four solo drill modes: Just Play and
  from-position learning; opening/middlegame/endgame/trajectory navigation;
  Twitch/streamer and academy contexts; Position Arena; prediction/simulation;
  review/deep analysis; progress/SRS; sharing; creation/import/review; and the
  complete authored/engine/Maia/corpus/tablebase/LLM evidence stack.
- The UI must accommodate this whole product now. The current pack-picker plus
  single scrolling drill screen is a useful mechanism demo, not an acceptable
  application architecture.
- Branch scoring and automatic compare inclusion are later optimization. First
  every branch can be selected, compared, explained, replayed, and shared
  correctly; then scoring can choose defaults while manual checkboxes remain.
- Landed `design/03-product-breadth.md` as the canonical surface map,
  information architecture, and B1–B8 breadth-completion gate. Earlier
  “deferred because singleplayer first” labels no longer remove Stream,
  Academy, or external-handoff Arena from the product architecture.

## 2026-08-11 (claude) — breadth program reordered by evidence

- Owner accepted the track-check recommendation. Applied: (1) RFC program
  reordered — **Evidence/explanation moves from #4 to #2**, directly after the
  shell, because the walkthrough's own finding (comparison shows difference
  without explaining consequence) points there, because explanation is
  machinery rather than content, and because K4/K6 live there and cheap risks
  are tested early; **Live moves from #6 to last** since none of it is
  validatable by use without other humans and its BACKLOG revival conditions
  still govern. (2) B1–B8 mirrored into `gates.md` — gate truth was split
  across two tiers. (3) The **Lucas Chess failure mode** (free, local,
  all-phases, fragmented into a mode menu with no unifying protocol — our own
  competitor research) named explicitly in both docs as the watch item for
  this strategy: surfaces accumulating while B4 stays unmet IS K6/K4 evidence
  accruing by construction.
- Process note: `design/03-product-breadth.md` was authored by the implementing
  agent, crossing the tier line (RFC-0000 agent rule). Content retained — the
  owner ruled the direction and the doc is honest about not being
  implementation authority — but AGENTS.md gains an explicit law: design tier
  is intent tier; implementers propose via RFC or BACKLOG row.
- Track-check verdict recorded: research complete for this phase, RFC
  discipline holding (3 lifecycles closed, reviews catching real defects),
  walkthrough evidence honest including its negative finding.

## 2026-08-11 (claude) — breadth #2 scope cut after two rejected drafts

- Two consecutive adversarial reviews (EC-C1..C8, AC-C1..C8) rejected my
  drafts for the SAME root cause: contracts named at intent level, unpinned at
  encoding level, over a shipped schema I mis-remembered. Third pass is a
  **scope cut, not another patch**:
  - **Specified** (encoding pinned against real code): claim `when` triggers in
    the pack's own key-discriminated style reusing the existing simpleTrigger
    def; boundary combinator corrected to "plyHorizon caps, does not grant"
    (the union reading was permissive and contradicted the degradation
    contract — AC-C4 was right); ref grammar cut to the four prefixes that
    resolve today with `pack:` split into pack-claim/pack-checkpoint;
    comparison scoped by existing event seqs instead of a minted segment id.
  - **Deferred with stated triggers:** timing-window semantics (needs pack A
    to design against — specifying it blind is how the last two drafts got
    their worst findings); run-schema source widening (nothing non-Stockfish
    is wired to emit); path-relative evaluation (made unnecessary by
    recorded-claim comparison — this was the largest engineering item).
  - Consequence recorded honestly: the "you spent the only spare tempo"
    explanation is a **v2 increment**, not a v1 promise. v1 explains via
    anchored claims + engine evidence + features + objective grounds, which is
    what the walkthrough's finding actually asked for.
- Process lesson: before drafting a contract RFC, read and quote the shipped
  schema/code sections it touches. Both rejections trace to skipping that.

## 2026-08-11 (claude) — breadth #2 rescoped a third time; two RFCs withdrawn

- Third review (R3-C1..C8) proved the scope cut's central deferral dishonest:
  "recorded claims" had no recording site anywhere in the shipped event union,
  so it was off-cursor re-evaluation renamed. Rather than a fourth patch pass,
  **withdrew `authoring-contracts-v03` and `evidence-composer`** (RFC-0000
  `withdrawn`: abandoned, kept for the record).
- Root cause, recorded plainly: I was specifying an **authored vocabulary with
  no authored content to design against**, over a shipped schema built for
  something simpler. Three reviews found variations of that one fault.
- Replacement: `rfc/explanation-grounds.md` — closes the walkthrough finding
  with data the system already produces. Three concrete gaps: (1) objective
  transitions decided by rules facts mint no evidence ref (orchestrator only
  translates `reach_checkpoint`), so "degraded" can render with no reason;
  (2) recorded Stockfish evidence never reaches the compare payload; (3) the
  compare view shows raw state names instead of grounded sentences. Every
  dependency was read in the shipped code before being cited.
- Salvage preserved in a BACKLOG row for the content era: boundary combinator
  ("plyHorizon caps, does not grant"), the `pack:` split, {branchId,startSeq,
  endSeq} scoping, and the recorded-claims trap.
- Honest consequence: B4 stays unmet; v1 explains via grounded objectives and
  engine evidence only. Authored claims, timing windows, and the packet
  abstraction return when pack A gives them something real to encode.

## 2026-08-11 (claude) — explanation-grounds accepted (breadth #2, 4th scoping)

- Review verdict: "the first of the four scopings that is fixable by editing
  rather than withdrawal." §2/§3 confirmed buildable from shipped data; §1
  (objective-type grounding) **cut** for the same root cause as the withdrawn
  RFCs in miniature — unexercised by any shipped pack, and `drawIsAvailable`
  cannot discriminate which draw fired, so the ref was unmintable without a
  runtime change. Deferred to pack A.
- Review found a genuine shipped bug now fixed by this RFC: `RunService.compare`
  applies no withholding gate, so evidence refs travel around the publicEvents
  barrier. The acceptance criterion for it deliberately fails against today's
  code.
- Four RFC-drafting attempts on breadth #2 produced one accepted 3-section RFC.
  Expensive, but every rejection was a real defect caught before implementation,
  and the salvage is preserved in content-era BACKLOG rows.

## 2026-08-11 (claude) — sixth lifecycle closed; withdrawn RFCs filed

- explanation-grounds implemented + archived (standalone canonical doc; codex's
  reasoning — the contract crosses runtime projection, server withholding, and
  client rendering, and keeps the B4/content-era boundary visible in one place
  — endorsed). Six implemented systems; 154 tests + browser suite green.
- Moved the two withdrawn RFCs to `rfc/withdrawn/` with an index section, so
  they stop appearing beside live drafts while staying readable. RFC-0000
  treats `withdrawn` as terminal-but-kept; the directory now reflects that.
- **State of breadth #2: v1 shipped, B4 unmet, and the reason is content.**
  Four drafting attempts established that the authored explanation vocabulary
  (claim triggers, tempo contract, provenance modes) cannot be designed without
  a real pack to design it against. The content era is no longer a deferral;
  it is the unblocker for the next layer.

## 2026-08-11 (owner ruling) — content planned at full breadth

- Owner rejected scoping content to the single opening they had mentioned in
  passing: content is planned across the whole product, not one defense.
  Landed `design/04-content-architecture.md`: unit taxonomy; White and Black
  repertoire spines across e4/d4/flank; **anti-opening packs for every family**
  (the whitespace — nobody drills the side you didn't choose); 10 middlegame
  structure families keyed to the openings that feed them; 7 endgame families
  in convert/hold/save variants with Syzygy ground truth plus corpus-mined real
  1400–2000 endings; 6 launch trajectories; the on-ramp layer including the
  CC0 puzzle DB re-cut as play-the-consequence.
- §7 records why content is the critical path rather than a later phase: the
  four withdrawn/rejected RFC attempts each failed for want of real packs —
  claim triggers, the tempo contract, provenanceMode, and save/resist all need
  authored material to be encoded against.
- Production order deliberately starts with one pack per phase to measure
  authoring cost (Q7/K10) before breadth, with the standing rule that a cost
  blowout is answered by tooling (importers, corpus mining, authoring assist),
  not more hours.
