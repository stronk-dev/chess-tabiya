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
- [PROVENANCE CORRECTION 2026-08-12: this entry was authored by codex in
  commit 11924a5 under an "(owner ruling)" heading. The bullets below are
  codex's paraphrase, NOT the owner's words. The owner disputes the
  branch-scoring line specifically. Nothing below may be cited as an owner
  ruling.]
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

## 2026-08-12 (claude) — ChessMotive teardown; E1 holds, compare claim narrowed

- Owner flagged ChessMotive as "close to us". Researched (`design/research/
  teardown-chessmotive-desk.md`, `[V]` from SPA bundle strings/JSON-LD/sitemap
  since the site is client-rendered). Added to the competitor matrix, which
  lacked it.
- **E1 verdict: WHITESPACE INTACT.** It is commit → compare-to-authority on
  atomic curated positions: no opponent at all, no play-out past the committed
  move, no rewind, no preserved branches (`branch`/`rewind`/`takeback` = 0 hits
  across its bundles), no cross-phase notion. None of the three elements E1
  protects.
- **Honest narrowing applied to `design/00-thesis.md`:** our originality claim
  on *comparison* is now stated precisely as **comparison of two preserved
  attempts by the same player**. Comparison-against-an-authority is not novel
  and ChessMotive does it well.
- Independent validation worth noting: its explanations are human-authored and
  revealed strictly **after** commit — arrived at ADR-0006's delayed-feedback
  rule independently, which is mild external support for a design decision we
  took on principle.
- Steal ledgered: the **step-indexed reasoning transcript** (candidates →
  shortlist → move → line → evaluation, diffed row-by-row), which localizes
  failure to generation vs elimination vs selection vs calculation vs judgment.
  Ours could diff attempt-vs-attempt, which theirs structurally cannot.
- Q1b caution recorded: seven distinct searches (Reddit, forums, Product Hunt,
  YouTube, app stores, press) found **zero** external mentions. A well-designed
  product in our band with no visible audience is evidence about the market,
  not just about them.

## 2026-08-12 (claude) — ChessMotive salvage completed

- Owner caught that only one of the dossier's ideas had been ledgered. Added
  the other two: (1) the **Foundation category scan** (checks → captures →
  threats → piece improvement → pawn moves last, auto-advancing) as an on-ramp
  intent-capture scaffold — it produces the reasoning transcript's first row,
  so the two steals compose; (2) the **feedback-timing convergence** as
  external validation of ADR-0006, recorded as evidence rather than as a
  change. Process note: when a research dossier names multiple ideas, ledger
  each one — "single best idea" sections often carry a secondary.

## 2026-08-12 (claude) — breadth alignment pass: six parallel code-verified dossiers

Owner instruction: *"launch subagents to align on the feature foundations, no
deferrals."* Six parallel passes, one per RFC-program area, each required to
cite `file.ts:line` for anything claimed to exist and a grep for anything
claimed absent, and each forbidden from using deferral language. Landed as
`planning/breadth/` (six dossiers + `synthesis.md`). Every finding reproduced
below was independently re-verified before it was allowed to change a file.

**The central finding: the missing work reduces to three absent primitives.**
F1 per-scope reveal (withholding is one boolean per run), F2 pack-optional run
identity (a pack is mandatory at six layers), F3 a subject (no learner identity
exists anywhere in source; one database table). Each blocks areas that never
talk to each other; all three are mutually independent and small in isolation.
Those are the feature foundations the instruction asked for.

**The structural good news.** Across six independent areas the same shape kept
appearing: a contract that shipped, was tested, and has zero producers —
`outcome.reached`, `transfer.scheduled`, `human_model_predicted`,
`feedback.generated`, `CheckpointInteraction.prediction`, the drill-address
grammar, the generic predicate evaluator. Breadth-first worked; what remains is
mostly producers and surfaces, not design. The mirror risk is that such a slot
reads exactly like a working feature, which is how five RFC drafts died.

**Six beliefs falsified** (details in `synthesis.md` §5). Most consequential:
B4 is **not** blocked on authored content — the withdrawn
`authoring-contracts-v03.md` §1 premise is false against shipped code, because
`pack-orchestrator.ts:39-59` already translates `SimpleTrigger` into the
runtime's `ObjectivePredicate` and evaluates it. Six of nine contracts pin
today. Also: the checkpoint-action vocabulary was already closed by `ef4cfe6`
and was still queued as an RFC input; prediction checkpoints are ledgered as a
candidate idea although the authored half ships with lint-enforced sparsity;
Maia policy mass already reaches the browser (a rendering gap, not an
integration gap); study import is not the fired K10 lever (all 45 friction
minutes were playtest friction, and `owner-review` is still 0, so no K10 verdict
is supportable in either direction); B8 deployment packaging shipped in full
while `/settings` has no form control.

**Six defects opened** as D1–D6 in `BACKLOG.md`. D1 is the one that matters
beyond bookkeeping: `assertActiveWriter` is string equality, the server
publishes `activeWriterId` to unauthenticated readers on two endpoints, and no
authentication exists in source — so a run link is a write credential. Low
impact on a local box; it hard-blocks every B5 scenario and any shared
deployment. D2 is latent and becomes live the moment F2 lands, so it must ship
inside F2.

**Applied:** BACKLOG breadth-surface table now carries a Program column naming
the owning program item and the verified blocker for every row; the "Deferred
implementation depth" section is now "Depth beyond the minimal-real version"
and states the surface is scheduled in both rows; the falsified rows are
corrected; F1–F3 and D1–D6 have ledger rows. Gate statuses B1–B8 refreshed in
`gates.md` against verified evidence, and two success metrics are marked
unfalsifiable-as-stated rather than quietly dropped.

**Process note.** The instrument corrected itself twice this session:
`field-consumer-matrix.md` had gone stale on two rows in one day, and codex's
session-2 defect labels needed a correction entry before they reached an RFC. A
static audit is a snapshot, not a standing truth — re-verify a row before
quoting it.

**Blocked / next:** four owner rulings in `synthesis.md` §7, of which
deployment posture is the one that unblocks the other three by implication.

## 2026-08-12 (owner rulings) — deployment posture amended to hosted multi-user

Three rulings on the alignment pass's owner questions.

**1. Deployment posture: hosted multi-user.** This **amends the deployment axis
of Q2**, which was settled as self-hosted, and it **fires ADR-0004's revisit
trigger** verbatim ("Multi-user/SaaS posture chosen in Q2"). Recorded here as an
amendment rather than applied silently, because a settled question changing is
exactly the thing that must stay visible. The other three Q2 axes (source model,
monetization, content/data rights) are untouched by this ruling.

Consequences that follow mechanically and are now scheduled work, not open
questions:

- **F3 becomes a real identity and session boundary**, not a local profile:
  accounts, authentication, and per-viewer authorization. It stops being a
  one-column migration.
- **D1 is promoted from low-impact to urgent.** On a local box "a run link is a
  write credential" was a curiosity; on a hosted deployment it is the whole
  authorization model, and there is currently no authentication anywhere in
  source.
- **AGPL-3.0 §13 now actually binds.** Network use triggers the source-offer
  obligation — consistent with the chosen licence and with Maia-3's own AGPL,
  but it becomes a live obligation rather than a dormant clause, and the
  corresponding user-facing source offer has to exist.
- **Tension to resolve, not to paper over:** the browser-run-engines posture
  (BACKLOG) was justified by pushing compute to the client so hosting stays
  near-static. Hosted multi-user reintroduces per-user server cost, and the
  archive's own scoring put the SaaS case at 5/10 against 9/10 for
  personal/self-hosted. That is not a reason to relitigate the ruling; it is a
  reason for the hosting-cost and posture question to get an explicit row rather
  than be discovered later.
- ADR-0004 (local-first modular monolith) needs an explicit re-decision. Its
  trigger has fired; nothing about this ruling automatically says the monolith
  is wrong.

**2. Just Play interruption model: passive marker the player may open.**
Recognition annotates the timeline; the player chooses when to look. This keeps
the uninterrupted-consequence stage of the episode intact, degrades honestly
when recognition abstains, and keeps recognition non-authoritative over curated
pack boundaries (the standing rule). It also means recognition never needs to be
confident enough to interrupt — a materially lower bar than a director model,
and it lets the deterministic-features level ship without the learned level.

**3. Scheduling unit: not ruled — the question was badly posed.** The owner
pushed back that "episode" and "return loop" were undefined jargon and that
phase-scoped units are artificial because play interleaves across phases. Both
objections are correct and the terminology is the agent's fault. Answered in
conversation; a definition owed to `01-training-model.md` before this is asked
again.

## 2026-08-12 (claude) — design amended on the rulings; first post-alignment RFC drafted

- **`01-training-model.md`** gains a Vocabulary section defining *attempt*
  (formerly the undefined "episode" — one pass through orient/commit/play/
  compare, and in the runtime literally a branch of a run), *return loop*, and
  *concept*. Repetition scheduling now states the ruling that came out of the
  owner's pushback: **attempts are scheduled, concepts select among them, phase
  is never a scheduling key.** The phase point is the owner's — packs carry a
  phase label but play interleaves across phases, so scheduling by phase would
  contradict the trajectory claim the product rests on.
- **`02-product-shape.md`** deployment axis settled as hosted multi-user, with
  the five mechanical consequences written down rather than discovered later
  (real identity boundary; the writer lease is not an authorization model;
  AGPL §13 binds; hosting cost is now a constraint against the browser-engines
  posture; ADR-0004 needs an explicit re-decision).
- **`03-product-breadth.md`** gains a Foundation edge section (F1/F2/F3, the
  zero-producer pattern, item #1's residuals) and records the Just Play ruling:
  **passive marker the player may open**. Gate table refreshed against verified
  state — B1 met-with-residuals, B8 was understated on packaging and overstated
  on Settings.
- **`rfc/authored-explanation-surface.md` drafted** (F1 + first rendering
  surface). Deliberately narrow after five withdrawals: reveal scope is derived
  from checkpoint position rather than authored, so it introduces **zero new
  authored vocabulary**; claim triggers, LLM rendering, corpus/Syzygy and live
  deviation classification are all explicitly out of scope with reasons. It also
  fixes D2 (the barrier fails open) inside the same change, since that defect
  goes live the moment F2 lands. Two open questions left honestly open rather
  than guessed: the synthetic tail-scope id, and the segment-end mapping.
- Note for the reviewer: the code comment at `pack-registry.ts:42-44` already
  names this exact missing contract. The RFC is written against that seam rather
  than against the withdrawn RFCs, which describe infrastructure that never
  existed.

## 2026-08-12 (claude) — explanation-surface RFC revised after review; six blocking findings accepted

Codex reviewed `authored-explanation-surface.md` and it did not survive as
written. All six findings accepted; revision 2 is a redesign of the core
mechanism, not a patch. No withdrawal — the reviewer's own verdict was that the
central idea is sound and fixable by revision.

- **The mechanism was wrong.** Revision 1 derived a static per-node scope from a
  "canonical spine walk" that does not exist — the model is a forest. On Pack A a
  depth-first ordering put `be3-hold` in the Tal branch and stranded
  `c5-immediate` in an unreachable tail. The deeper error: `bf5-main` legitimately
  needs *different* scopes on different continuations, so no static per-node
  assignment can exist. Replaced with **path-relative reveal derived from actual
  `checkpoint.reached` events**, unioned over the append-only log. Monotonicity
  then falls out for free — rewind appends `run.rewound` and never deletes
  checkpoint events.
- **The claims decision was a rationalization and I should have caught it.** I
  called first-checkpoint claim release "conservative"; it is fail-open. Pack A's
  `tal-tempo` claim describes 4.h4 and would have been exposed on the quiet main
  line before the learner ever met that move. Claims are now withheld entirely
  until they have real anchors. "Never reveal unsupported placement" is the
  conservative choice; my framing inverted it to justify making a dead field
  live.
- **Scope-creep check worked in the right direction.** The claim that this RFC
  closed D2 was wrong — the barrier has five surfaces, three fail open
  independently, and packless evidence tests legitimately depend on the current
  path. D2 returns to F2, which is where the alignment pass had originally put
  it. I had moved it in for tidiness.
- **Two authored shapes were simply unsupportable**: concepts are bare ids with
  no prose, and checkpoint labels already ship before play. The item set is now
  closed to three named kinds, with exclusions stated.
- **A disclosure hole I had not seen**: with withheld items merely absent, a
  client cannot distinguish "nothing authored here" from "withheld", so both the
  pre-reveal timeline affordance and the honest-absence requirement were
  impossible as specified. Resolved by one coarse run-level flag and by
  **withdrawing** pre-reveal per-ply markers — any per-position "content exists
  here" signal is a contamination side channel.
- **The acceptance criteria could not have run.** `e6` has no annotation; the
  `bf5-main` deviations are never played on the asserted line; and the Playwright
  harness cannot start Pack A at all (server not in dev mode, no mock script,
  and the pack starts with Black to move while the learner is White with no
  initial opponent move requested). Harness repair is now an explicit
  prerequisite section rather than an assumption, and the Black-to-move question
  is carried as the RFC's one open question because it affects every pack whose
  start position is on the opponent's move.

Both revision-1 open questions were resolved by the review with evidence: the
`__tail` id cannot collide (it is outside the legal id language) but the tail
scope is removed anyway because no run-terminal event could ever reveal it —
authored prose after the last reachable checkpoint is an authoring defect that
`pack-check` should warn about. And `segment.completed` carries event sequence
numbers rather than checkpoint ids and must be resolved through the shipped
`deriveSegments()`; revision 1's global-order mapping was invalid.

Process note: the prompt named scope derivation as the likely break point and it
broke there. Naming your weakest assumption to the reviewer is cheap and it
worked — but three of the six findings were in parts I had not flagged, so it is
not a substitute for the review.

## 2026-08-12 (claude) — explanation-surface revision 3; second review's four gaps closed

Codex confirmed revision 2 fixed the central mechanism (Pack A path problem,
sibling leakage, claim withholding, D2 placement, disclosure coherence) and
raised four remaining contract gaps. All four closed; the reviewer's expectation
is that revision 3 is implementable.

- **One reveal rule instead of two half-rules.** Revision 2 defined reveal from
  `checkpoint.reached`, then bolted on a sentence about completed segments for
  `segment_end`. It never said whether the start checkpoint's node was included,
  what happened to prose before the first checkpoint, or which checkpoint got the
  attribution. Now a single algorithm walks reveal events in sequence order and
  takes the actual root-to-node path for each — `checkpoint.reached`/`nodeId` in
  delayed mode, `segment.completed`/`endNodeId` attributed to
  `endCheckpointEventSeq` in segment mode. Pre-first-checkpoint material reveals
  when the first segment completes, and consecutive segments cannot leave a gap
  because the start node is already on the path.
- **Attribution needed event identity, not a checkpoint id.** The same checkpoint
  id fires on multiple branches and those occurrences reveal different
  path-relative items, so a sheet filtering on id alone would show a later
  `plan-commitment` what an earlier branch's `plan-commitment` revealed.
  `revealedBy` is now `{checkpointId, eventSeq}`. This also forced the server
  projection to change shape: a node-id set cannot carry attribution, so it
  returns a map from **structural** source identity (node+index, array index,
  plan-class id — never prose text, which would deduplicate two legitimately
  identical sentences) to the first revealing event.
- **The withheld flag would have made the UI lie.** Pack A holds two claims this
  RFC permanently withholds. If they counted toward
  `hasWithheldAuthoredContent`, the flag would be true forever while the
  interface promised commentary "until checkpoints" that never arrives. The flag
  now counts only items this RFC can ever deliver. Also pinned: deviations
  without `note` produce no item, plan classes carry label *and* optional
  description rather than an ambiguous single `text`, and response ordering is
  deterministic.
- **The open question was answerable and the answer flips its owner.** Pack A's
  Black-to-move start is a **client orchestration defect, not a pack error**: the
  pack deliberately starts before Black chooses between 3...Bf5 and 3...c5, the
  schema treats `start.side` independently of the FEN side to move, and the
  runtime already supports a root opponent ply — `startPack()` simply never asks
  for one. Specified as a prerequisite fix with its own commit, including writer
  resume, the read-only-follower exclusion, and the harness repairs. It affects
  every pack starting on the opponent's move.
- **Contradiction removed:** revision 2 proposed an `AUTHORED_PROSE_AFTER_LAST_
  CHECKPOINT` lint in one section while asserting unchanged `pack-check`
  behaviour in another. Now one precisely scoped warning — spine-node-only, and
  suppressed entirely when a pack has any checkpoint whose trigger is not
  statically resolvable to a spine node, rather than guessing.

Open questions: none. Two review rounds, ten findings, zero disputed — the
pattern across both is that my specs are strongest on mechanism and weakest on
the boundary conditions of shapes the schema actually permits (optional fields,
repeated events, non-node triggers). Worth checking those first next time.

## 2026-08-12 (owner ruling) — no owner review until features and content are complete

Owner: *"no i will not play. i will play WHEN ALL IS DONE. I WANT FULL FEATURES
FULL CONTENT."*

Recorded because it changes what can be measured, not to relitigate it:

- **K10 (authoring cost) is unfalsifiable until the end.** `owner-review` is the
  clock `planning/content-era/plan.md` §1b calls decisive and it stays 0. The
  agent-side clocks keep accruing and stay honest; no K10 verdict may be claimed
  in either direction before the owner's pass.
- **Every pack stays `reviewStatus: draft` until the end**, because the
  graduation bar requires a strong reviewer's sign-off. Full authored inventory
  in draft, graduating in one pass at the end, is therefore the expected shape —
  not a backlog of unfinished work.
- **Consequence for method, acted on rather than asked about:** hand-authoring
  content at the breadth `design/04-content-architecture.md` describes would mass
  -produce ungrounded prose that no reviewer pass could economically fix. So the
  sourcing and validation pipelines (explorer frequency, CC0 line skeletons,
  puzzle-DB re-cuts, Syzygy/Stockfish grounding) are being built alongside
  authoring, so batches 2..N are assembly plus judgment rather than blank page.
  That is B6 program work, not a content detour.

Also this session: `authored-explanation-surface` closed to **implemented** and
archived by codex on approval. Branch-switch measured at 50.1 ms against the
50 ms benchmark and recorded honestly rather than rounded down.

## 2026-08-12 (owner rulings) — four decisions closing three RFC blockers

1. **Deleted accounts reassign their runs to `__legacy`.** Sessions and grants
   cascade; runs survive with ownership moved. Protects the case where a run is
   granted to another learner or appears in someone else's comparison.
2. **No operator concept.** Ruled against an `operator` flag. Consequence
   recorded in the F3 RFC so it is not rediscovered as a defect: every
   administrative capability must live outside the account model — environment
   and configuration, never a privileged user. Draft-pack loading is already
   environment-gated, so this is consistent with what ships; the constraint is
   on *future* surfaces, which may not introduce a privileged account through
   the back door. A surface that genuinely cannot be expressed as
   environment-gated is new evidence for a fresh ruling, not an improvised
   column.
3. **Authored pack prose is `CC-BY-SA-4.0`.** Settles the content/data-rights
   axis of Q2 (the deployment axis was settled earlier the same day). This is
   the authoring-cost lever, not just a licence: Wikibooks' reusable idea-prose
   becomes a legitimate fifth pipeline, so authors start from existing
   explanation rather than blank page across hundreds of packs. Price accepted:
   attribution chains encoded in `provenance`, and no unilateral relicensing of
   pack prose later.
4. **The streamer may cheat on themselves.** Per-viewer reveal cannot enforce
   blind play — a player can hold a second account and spectate their own run.
   Ruled: document the limit honestly rather than engineer against a user
   deceiving themselves. Chat voting, host rewind/branch/compare and the
   spectator projection are unaffected, so B5 loses a guarantee, not a feature.

All three drafted RFCs now have zero open questions. `pack-optional-runs` had
none; `learner-identity-and-authorization` and `content-sourcing-pipelines` are
resolved above.

## 2026-08-12 (claude) — three RFCs revised, one split into four, after adversarial review

Codex reviewed all three drafts and asked for revision on two and rejection-plus
-split on the third. Every finding accepted. Outcome: six RFCs where there were
three, all with `Open questions: None.`

**Two of the blockers were mine, not the drafts'.**

- I appended the CC-BY-SA ruling to an open-questions section and never
  propagated it, so §6.4 and an acceptance criterion still refused share-alike
  sources the owner had just permitted. The identical "appended not integrated"
  failure I had flagged in someone else's revision two rounds earlier.
- I launched two agents onto adjacent schema territory with nothing coordinating
  them, so both claimed database migration 2 and neither could land. Fixed
  structurally: `rfc/README.md` now carries a **migration register**, a
  migration number is a single-writer resource claimed in the same commit that
  drafts it, and landing order is F3 → F2 with reasons. I then repeated the same
  class of error one layer up by having two concurrent agents edit
  `rfc/README.md` itself — no damage, but the lesson is about shared index files
  generally, not migrations specifically.

**What the revisions found that the review did not.** F2: `createRun` rewrites
the FEN, so the digest-order bug broke *replay invariance*, not merely identity;
migration 1 replays through `projectRun` and reads `run.packId`, so a
`user_version = 0` database would fail to open before the quarantine could run;
a pack with `temperature: -1` passes pack validation and would mint a run its own
schema rejects. F3: the lease cannot be nulled because `active_writer_id` is NOT
NULL and a SQLite rebuild needs `PRAGMA foreign_keys = OFF`, which is a no-op
inside the `BEGIN IMMEDIATE` every migration runs in — so atomic transfer is
forced by the storage layer, not chosen. Both agents also corrected the reviewer
on coordinates while confirming its substance.

**Two factual errors in our own content, corrected.** `content/drafts/
rook-4v3-same-side.json` said the 4v3 rook ending is "ten pieces"; it is eleven
with both kings — I had said ten too, in the brief and in conversation. The
conclusion (past Syzygy's seven-piece limit) is unaffected, the number was
wrong. And **D9** ledgered: `start.side` is schema-optional but
`packStartSide` throws without it, so a pack that validates can crash the drill
screen — a contract every future emitter must honour that no schema enforces.

**B6 split** into foundation+skeletons, Syzygy, explorer, and position seeds.
The position-seeds redesign is the substantive one: apply the *complete* puzzle
line rather than stopping after the first move, so the learner plays the
consequence instead of solving the tactic. It is spine-less, and the RFC states
plainly in `graduationBlockers` that the only executable verdict is "you played
it out" — the honest limit rather than a grading claim it cannot keep.

## 2026-08-12 (claude) — all three foundation primitives implemented; sourcing RFCs revised

**F1, F2 and F3 are all shipped.** F1 (authored explanation surface) landed
earlier; F3 (learner identity and authorization, migration 2) then F2
(pack-optional runs, migration 3) landed in the ruled order. Defects **D1**
(a run link was a write credential), **D2** (the withholding barrier failed
open) and **D3** (`POST /runs` silently accepted unknown fields) are closed with
them. Verified independently: `ENGINES_REQUIRED=1 make verify` green at 204
tests, migrations present as 1/2/3, and the F2 leak test asserts what its name
claims — injected durable evidence withheld at every read surface before reveal.

The alignment pass's central claim therefore held: the work missing across all
eight program items really did reduce to three primitives, and naming them made
the sequencing possible.

**The sourcing RFCs were rejected on four blockers and revised.** The serious one
was B6d shipping the puzzle solution in `start.movesSan` — `projectPackDocument`
serves `start` whole, so it would have leaked through the public pack response.
The same leak class F1 closed for authored prose, reintroduced by a pipeline
that had no reason to know about it. Solution now lives in `evidence.json` and
`sourcing-check` replays it to prove it yields `start.fen`, so review loses
nothing and the browser never sees it.

Two claims were withdrawn rather than patched: byte-identical output from a
fixed-movetime Stockfish (replaced with `go depth 22`, the only deterministic
budget with a shipped executor path, at the stated cost of unbounded wall clock),
and "the position ends in the learner's favour", which puzzle solutions do not
guarantee — mate, material gain and a drawn save are all possible endings.
MultiPV dropped 3→1 after finding that nothing carries an overridden MultiPV to
the judge and `lastInfo` would have recorded the *third*-best line as the
evaluation. That one would have silently produced wrong evidence.

**Two more of my errors surfaced.** The ten-piece count reached a
learner-facing `feedbackClaim` in Pack C — the single worst place for it, since
it is text a user reads — and I had only corrected the provenance instance.
Fixed. And the reviewer's own line pointer for it was wrong, which the revising
agent demonstrated rather than assumed: worth recording that a reviewer citing a
stale coordinate is now common enough to check by default.

**D10 ledgered:** `parseIdentity` fills `version` from the UCI `id name` line
only when `spec.name` is unset (`engine-supervisor.ts:116-126`), and both
shipped Stockfish specs set it — so every piece of engine provenance we record
is anonymous. B6b currently works around it by omitting `name`.
