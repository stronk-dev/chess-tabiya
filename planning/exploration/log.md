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

## 2026-08-12 (claude) — sourcing revision three; D11 given an owner

The four sourcing RFCs were rejected a second time on eight contract-level
blockers and revised again. The substantive closures: the manifest generalized
to `http`/`local-file`/`engine` origins with a two-way linkage rule (which
finally defines "consumed", something `sourcedAt` had been depending on
implicitly); the contradictory licence booleans deleted and derived from
`(basis, spdx)` by a pinned matrix; the stale-lock takeover rewritten as an
actual mutex after a reviewer showed the old one let a resumed holder delete its
replacement's lock; B6c given the `candidate-attach` workflow its acceptance
criteria had assumed; difficulty overreach removed outright; speed and date
grammar pinned from the official Lichess schema; and the ETag no-op tightened to
require an identical emission-job digest.

**The revision's own closing observation was the useful one:** D11 now gated two
RFCs and belonged to none — one paragraph with no assignee, which is how a block
quietly stalls the work behind it. Drafted `rfc/terminal-outcome-events.md` to
own it.

That RFC is small because the pieces were already there, which is the alignment
pass's zero-producer pattern one more time: `outcome.reached` is declared with a
projection case and no emitter, and `position.isEnd()` is already called at
`runtime.ts:274` to refuse the *next* move. Nothing needed inventing — the event
just had to be emitted where the terminal node is created rather than only used
to refuse continuation.

Two decisions inside it worth recording. The `outcome` field was typed as an open
`string`, which is defect D4's shape for the third time in this codebase, so it
is closed to `win|loss|draw` **from the learner's perspective** — the result
cannot be derived without knowing the learner's colour, whereas the terminal
*reason* can always be derived from the persisted FEN, so the payload shape needs
no version bump. And `outcome.reached` discloses feedback under all three
policies, including the delayed ones: a finished run has no remaining decision to
contaminate, which is the entire basis of ADR-0006, so withholding after
termination protects nothing and costs the learner the feedback they just earned.

No backfill for stored runs. They are append-only and the honest statement is
that the defect existed.

## 2026-08-12 (codex) — B6c Gate 0 resolves to unavailable here

- Environment check: `LICHESS_TOKEN` is absent. No credential was printed or persisted.
- One exact canonical anonymous request was made to
  `https://explorer.lichess.org/lichess` with standard-start FEN,
  `ratings=1400,1600,1800`, `speeds=blitz,rapid`, `since=2024-01`,
  `until=2026-07`, `moves=12`, `topGames=0`, `recentGames=0`, and `history=false`.
- Result: HTTP/2 401; `server: nginx`; `content-type: text/html; charset=utf-8`;
  `content-length: 172`; `access-control-allow-headers` includes `Authorization`;
  body prefix is `401 Authorization Required`.
- Implementation follows Branch B: the token-capable client and closed request grammar
  ship, but the committed priority artifact has `status: unavailable`, no rows, and an
  explicit source-unavailable abstention. No band or backend was substituted.
- The pre-ledgered Q6 revival condition is fired. This is not permission to bulk-ingest:
  the follow-up still needs the separately specified streamed-aggregate RFC required by B6c
  §5 and must retain the rejection of ingestion-first.

## 2026-08-12 (codex) — Gate 0 correction after operator token

- The owner supplied a personal Lichess token through gitignored `.env.lichess`; the token
  had no scopes and was treated only as operator-side authoring configuration. It was not
  printed, copied into a URL, written to an artifact, or connected to learner identity.
- The otherwise identical Gate 0 request returned HTTP/2 200 from nginx,
  `content-type: application/json`, `content-length: 1999`, and a one-day public cache
  lifetime. At the standard initial position the response counted 464044240 white wins,
  39886185 draws, and 430620851 black wins. The top three moves were e4, d4, and c4.
- Gate 0 is therefore **Branch A**, superseding the provisional Branch-B conclusion above.
  The Q6 offline-explorer revival condition is not fired: authenticated Stage 0 works.
- “Login with Lichess” remains a separate optional learner-facing integration. The sourcing
  pipeline uses operator/admin configuration and never borrows a learner credential.

## 2026-08-12 (codex) — B6d consequence seeds implemented

- The Lichess puzzle source now emits the position after the complete solution, not a tactic
  to solve. The line is private review evidence and is absent from the served pack; emitted
  candidates are spine-less, opponent-first, and graded only on playing to a checkpoint.
- Exact live rows `00008`, `0000D`, and `000Pw` were replayed independently. The third has
  629 plays, exposing a conflict between the RFC's named-fixture emission criterion and its
  1000-play production floor. The floor was preserved: all three prove transformation, while
  only the two qualifying rows became committed candidates.
- This closes B6d's executable sourcing slice without adding bulk ingestion, tactics UI,
  generated chess prose, learner authentication, or automatic publication.

## 2026-08-12 (codex) — seven breadth lifecycles archived

- After Claude independently reran both gates and approved the implementations, F3, F2,
  D11, and B6a–B6d completed the RFC protocol together. Their RFCs and planning jobs are
  archived; the active RFC table now contains no product RFC.
- Canonical behavior remains system-oriented: identity in
  `docs/identity-and-authorization.md`; pack-optional sessions and terminal outcomes in the
  runtime/client/explanation docs; all four sourcing slices in `docs/content-sourcing.md`.
- Migration register entries 2, 3, and 4 are implemented, with the duplicate draft row for
  migration 4 removed.

## 2026-08-12 (claude) — Outcome Drill grading implemented and archived; D14 closed

Program item #4's first mode landed after three review rounds. Verified
independently rather than on report: `ENGINES_REQUIRED=1 make verify` green at
276 tests across 46 files, and the browser gate run **five** more times at zero
retries, all green.

**D14 is the finding worth keeping.** On the first independent run of the
implementation gate, a browser test failed; four reruns on the unchanged tree
passed. One in five, with `retries` unset and `workers: 1`, so a single flake
fails the suite — and that suite is what every RFC closeout in this session was
verified against, including the seven-RFC batch. A gate that can report either
answer on identical code is not evidence.

It was diagnosed rather than masked, which was the right call and not the
tempting one: the tests were targeting Chessground's **private** `<cg-board>`
element during transient relayout, and now synchronize on the stable public
`aria-label="Chessboard"` wrapper with a visible-geometry requirement.
`retries` is still unset, so the fix had to be demonstrated instead of hidden.
Raising retries would have converted a visible flake into an invisible one.

Recorded because it generalizes: the flake only surfaced because the gate was
re-run by a second party. It fired for me and not for the implementer, on the
same commit.

**Also corrected: a false statement I had written into Pack C's provenance.**
When D12 was ledgered I put "UNPLAYABLE AS AUTHORED — do not publish" into
`provenance.sources`. The encoding landed, the pack was repaired, and that text
became false in the one field whose entire purpose is being true. Replaced with
the historical record. The lesson is narrow and worth holding: a warning written
into content is a claim with a lifetime, and closing the defect it describes is
the moment it becomes a lie.

Defect tally: **10 of 15 closed** (D1, D2, D3, D11, D12, D12a, D12b, D12c, D13,
D14). Open: D4 vocabulary drift, D5 release compose light profile, D6 `phase`
unprojected, D7 deviations unlinted, D9 `start.side`, D10 anonymous engine
provenance.

## 2026-08-12 — CORRECTION to the defect tally in the entry above (claude)

Append-only; the entry above stands. Its closing tally said "10 of 15 closed"
and listed six open defects. Both numbers are wrong and **D8 was omitted
entirely**.

Correct, verified by counting the ledger: **17 defects, 10 closed, 7 open.**
Open is D4 through D10 inclusive —

- D4 action-vocabulary drift
- D5 release compose light profile
- D6 `phase` never projected
- D7 deviations unlinted
- **D8 schema/runtime policy disagreement** (the omitted one)
- D9 optional `start.side`
- D10 anonymous engine provenance

The arithmetic slipped because the D12 family (D12a/D12b/D12c) are three
defects sharing one number, so counting rows and counting numbers give different
answers. Worth noting for whoever writes the next tally: count the rows.

## 2026-08-12 (claude) — Line Drill drafted; my review found one blocker and one owner ruling

Draft at `rfc/line-drill-theory-grading.md`. The membership discipline holds:
three verdicts (`on_line` / `classified_deviation` / `unknown`), severity taken
only from the author's `offObjective` flag and never from ranking the class, and
a new `follow_theory` objective type that structurally **cannot** acquire
`objective.grading` — which is where "membership is not WDL" ends up living in
the schema rather than in prose.

**Blocker I am raising: D15.** The draft states the `theory_strict` request and
the recorded engine as two facts, correctly. But reviewing it I checked the
fallback path and found it emits only a `console.warn` — no event, no run field,
no response, no screen. So in the one mode whose entire subject is theory, the
opponent can stop playing theory mid-drill and nothing the learner or the run
can see records it. It matches the existing `DEGRADED_POLICY_MASS` pattern,
which is why nobody caught it; consistency with an invisible signal is not a
defence for a mode built on that signal.

**Owner ruling needed, not an RFC inference: what does `authoredBoundary` mean?**
The draft found the field is used two different ways and ruled for the *frontier*
reading on the evidence. The evidence is real — under the membership reading the
served example is incoherent, since `najdorf-be3` would sit outside the boundary
while its own descendant `najdorf-b5` sits inside. But the count cuts the other
way: the example lists 2 nodes, and all three authored drafts list every node
(10, 15, 23). So frontier makes three of four packs mis-authored; membership
makes one of four wrong and keeps a paradox. That is a genuine fork about
authoring intent, and an RFC should not settle it by majority of four data
points.

**Two errors in my own brief, both caught by the draft.** I said Pack A has ten
deviations across five classes — it has five across three (`mode: "plan"`); ten
belongs to Carlsbad. And I said the `theory_strict` fallback was "now audible
for pack runs", which is what F2 specified and not what shipped. The second
error is the one that mattered, because it would have let the RFC assume a
signal that does not exist — and instead it produced D15.

## 2026-08-12 (owner rulings) — authoredBoundary is membership; D15 closes inside Line Drill

**1. `authoredBoundary` means membership, not frontier.** The owner overruled the
draft's frontier reading on evidence stronger than the four packs:
`planning/breadth/training-modes.md` already defines authored territory as
"`spineNodeIds` contains it OR a FEN predicate matches", the withdrawn-contract
salvage says the same, three authored packs encode membership, and the Najdorf
case is a lone bad encoding in a `schema_example`. So: `spineNodeIds` is an
explicit membership set, `fenPredicates` grant additional positions,
`plyHorizon` caps both and never grants, and transposing back to a listed
position re-enters authored territory via `transposeKey`. The example is fixed by
listing all five of its supported nodes (it lists two of `najdorf-be3`,
`najdorf-e6`, `najdorf-f3`, `najdorf-b5`, `najdorf-be2`) — not by reinterpreting
the field. If frontier shorthand is wanted later it gets its own
`frontierNodeIds`.

Worth recording as method: the draft ruled from the four packs it could see and
flagged the ruling as its second-riskiest item, which is what surfaced it. The
deciding evidence was in a planning dossier the draft had no reason to read. A
semantics question is a search problem before it is a judgement call.

**2. D15 blocks acceptance and is closed inside the Line Drill RFC.**
`policyModeApplied` (`human_common | strong_engine | theory_strict | unknown`)
joins `opponent.move_selected.selection`: on-spine `theory_strict` records
`theory_strict`, the off-spine fallback records `human_common`, and historical
selections migrate to `unknown` and are **never inferred**. Run schema v0.7,
migration 5 claimed.

This deliberately reverses `outcome-drill-grading`'s refusal of the same field.
That RFC declined it to preserve its no-migration scope and named it the future
path; the owner ruled the migration is worth paying, because the alternative is a
mode about theory carrying a disclaimer where it could carry evidence. A
disclaimer says "we do not know"; `policyModeApplied` makes the run know.

## 2026-08-13 (owner rulings) — no review workflow; predictions show numbers, not verdicts

**1. There is no pack review workflow, and there never was one to build.** Owner:
*"we have them in the fucking repo, NO ONE REVIEWS THIS. I am not opposed to UGC
but then what is this 'reviewing'? WE DON'T NEED ANY OF THIS."*

Packs live in the repository. They ship with honest provenance — Pack A already
says in plain text that its claims are agent-authored and unvalidated — and that
statement *is* the safeguard. A reviewer sign-off gate adds a ceremony no one
performs, and a status nobody can grant is worse than an honest label, because it
implies a check that never happened.

What this strikes:

- the review queue, reviewer roster, sign-off, derived checklist, and the
  `draft → in_review → approved → registered` state machine in
  `rfc/pack-studio-and-review.md`. The write path, studio UI, session
  distillation, imports and versioning all survive — they are what actually
  reduces authoring cost.
- **ADR-0001 (curated-first: reviewed packs before automatic lesson generation)**
  is superseded on its review half. Curated-first survives as *authored, not
  generated*; "reviewed" does not.
- **C1** ("≥80% of reviewed feedback statements accepted by strong reviewers")
  is unmeasurable by construction and is withdrawn as a continuation gate.
- the `graduationBlockers` in all three authored packs that name a reviewer's
  sign-off, and the graduation bar in `planning/content-era/plan.md` §3b.

Recorded honestly: this removes the only mechanism the product had for catching
a wrong authored claim before a learner sees it. What remains is the provenance
label, engine/tablebase validation where material allows it, and use. That is a
real reduction in safety and it is the owner's call to make; law 8 still forbids
manufacturing chess truth, so the constraint that matters most is unaffected.

**2. Prediction checkpoints show the numbers and do not score.** Owner chose
render-the-distribution over any threshold: the learner predicts, then sees where
their move sat — "you said c4; 12% of 1500s play it, 42% play Qb6." No pass/fail.
`minMass` stops being a grading threshold, and `grading.source` has nothing left
to grade. This is the strictest reading of law 8 available and it removes the
question the two threshold readings existed to answer.

**3. Simulated branches are scratch** — discarded unless the learner enters one,
which promotes it to a real branch. `Branch.origin` becomes the promotion marker
rather than a persistence filter.

## 2026-08-13 (claude) — the full idea recorded as breadth: B9, B10, B11

Owner: *"make sure all the breadth is recorded… I want the full idea realized —
from simulations to branches, from drills to classifiers that adjust, from pawn
structures to knight threats."*

`design/03-product-breadth.md` predated everything worked out today, so the
surface map had no home for it. Added three surface sections and three gates,
mirrored into `gates.md` so the gate surface stays unsplit:

- **B9 structural reading** — the rung-0 layer. Feature predicates that are
  simultaneously *readables* for the learner and *authorable conditions* for
  objectives; denial and prophylaxis; discovered consequence; pressure maps;
  structural naming. Ordered **before** B10 and B11 because both depend on it,
  and ahead of much remaining polish for three reasons: it is the only assistance
  that cannot manufacture chess truth, it needs no engine or network, and it
  closes the plan-objective gap that currently leaves two of three authored packs
  with no working objective at all.
- **B10 adaptive guidance** — live classification, assistance configurable per
  session context, author-free pivotal detection (irreversibility, phase change,
  Maia divergence, option collapse — engine eval swing deliberately excluded as a
  primary detector), endgame steering by named technique.
- **B11 reusable shapes** — the owner's reframe. Blocked on the `04` §0 ruling
  *and* on B9, because a shape cannot state its own trigger without feature
  predicates.

The governing rule written into all three: **detection is cheap and cannot be
wrong; significance is judgement and must be attributed.** That single line is
what keeps a strategic classifier from becoming the dashboard `AGENTS.md` names
as the anti-pattern.

Note on ordering: B9 sits alongside the six RFCs already drafted rather than
behind them. Those six close B2/B3/B5/B6/B7 and the open defects; B9 is the first
item that makes the *guidance* better rather than the surface wider, and it is
the cheapest thing in the program.

## 2026-08-14 (owner rulings) — shape library split; Just Play marker default

Two rulings, closing the `design/04` §0 question that blocked B11:

1. **Split.** Reusable knowledge goes to a shared shape library, authored once,
   firing wherever its structural trigger matches — drill or Just Play. Packs
   survive as focused practice referencing the library. Full-merge (packs as
   generated recipes only) explicitly not taken: the hand-crafted drill stays
   first-class. The owner's own framing: the drill pack is a nice focused way
   to practice, but the content it adds must work for Just Play, where all
   content comes together.
2. **Passive marker default.** When the library fires mid-game, the learner sees
   a quiet timeline marker that opens to the shape entry's named plans. No
   interruption, no prescription.

B11 is now unblocked (B9's predicates shipped 2026-08-14, the ruling was the
last dependency). B10 and B11 will be specified together against this content
model.

## 2026-08-14 — Take Take Take desk teardown lands (Q1a/E1)

`design/research/teardown-taketaketake-desk.md` + matrix row. Take Take Take
(taketaketake.com) is the Carlsen-cofounded, VC-backed social chess platform
launched 2026-04-06: real games via a Lichess-powered Play Zone, an LLM-narrated
post-game review, and a Strava-style feed that auto-generates a shareable
key-moments summary of every game ("It even suggests a title").

- **E1: whitespace intact.** Zero loop stages as training interactions — no
  curated positions, no rewind, no preserved branches, no attempt comparison, no
  phase notion. A post-game analyzer with a social layer; their own blog tells
  readers to *imagine* replaying the key position because the product can't.
- **Game-story summaries exist and are the product's spine** — directly relevant
  to the owner's ~8-slides feature idea. Appetite validated by a $9M bet;
  substance unclaimed: nobody ships grounded pivotal states that open back into
  play.
- **ADR-0005 vindicated in the market**: the review is per-move LLM prose over
  Stockfish PV/eval and was publicly documented producing wrong chess on launch
  day ("Almost everything this LLM says about chess is irrelevant or wrong" —
  intermediatemoves.substack.com). The named anti-pattern, shipped, by name.
- Demand signal for Q1b/Q2: a funded competitor now owns "improver" positioning
  (~800–2000 band) with the opposite mechanism.

Next: hands-on residuals (feed-summary anatomy; whether the review board allows
free exploration) if Q1a ever needs them.

## 2026-08-14 (claude, coverage-gap sweep) — surface-by-surface competitor census

- Landed `design/research/coverage-gap-sweep.md`: 11 surface clusters swept against
  the 2024–2026 market per the coverage-limits rule; 10 absent-relevant products
  grounded by fetch and added to `competitor-matrix.csv` as rows 31–40 (Chessbook,
  Chess2Story, ChessEver, Chessido, Chessvia, ChessMind AI, OpeningTrainer,
  Chess Yourself, Chess vs Chat, Chess.com Play Coach). Take Take Take handled by
  its own teardown in the same session.
- Teardown shortlist (ranked): Chess.com Play Coach, Chessbook, ChessMind AI,
  Chess2Story, ChessEver.
- **E1 intact:** no found product ships preserved branch attempts, checkpoint
  rewind with comparison, or phase-trajectory rehearsal. Null results recorded for
  branch groups / parallel candidate play, recovery-as-skill as a run path, and
  live structural naming — three of our newest surfaces have no competitor found.
- Pressure points are adjacent, not central: Play Coach normalizes in-play move
  advice at platform scale (the exact §3a/§3b contrast case); ChessMind AI pairs
  Maia with ungrounded "plans behind the moves" claims (ADR-0005 live test case);
  the fan shelf (ChessEver, taketaketake, Chess2Story) is crowded.
- Blocked/limits: chessplay.io and chessever.com root both 403'd (ChessEver
  grounded via App Store instead); sweep is English/US-only and desk-only.

Next: teardowns for the top-5 shortlist, starting with Play Coach and Chessbook.

## 2026-08-14 (claude, teardowns) — Chess2Story + ChessMind AI desk teardowns

- Landed `design/research/teardown-chess2story-desk.md` and
  `design/research/teardown-chessmindai-desk.md` (coverage-gap sweep shortlist
  items 4 and 3); deepened matrix rows 32 and 36; coverage rows added to the
  research README.
- **Chess2Story — E1 intact, zero loop stages, no opponent object at all.** But
  the sweep's row undersold its grounding: engine analysis selects turning
  points, famous games ship machine-replayed verified scores with cited
  provenance, and the fiction is explicitly quarantined as fiction. It also
  already ships moment cards with a live board that jumps to the position
  ("Click one — the board above jumps there") — read-only navigation.
  **Consequence for the in-flight `rfc/game-import-and-story.md`:** the
  differentiator must be pinned to *the door into play* (moment → position →
  resistance → consequence → rewind), because slides-with-board-sync are taken,
  and "we're grounded, they're freestyle" does not hold against C2S (only
  against TTT). Its no-fiction "coach review" rendering is also a standing
  warning: a story surface without the play door is the named failure shape.
- **ChessMind AI — E1 intact; the closest stack neighbor in the matrix.**
  Bundle-read verified the marketing: Maia-2 runs client-side as ONNX
  (`maia2_rapid.onnx`, elo_self/elo_oppo conditioning, policy sampling) at six
  bands ~1100–2000+ — a Q5 deployment datapoint. Founded by GM Mauricio Flores
  Rios (Chess Structures); GM-authored courses end in board practice vs the AI,
  narrowing the opening→play-out edge; endgame trainer plays out with
  resistance plus a Survival mode. No checkpoint rewind, preserved branches,
  comparison, or phase trajectory anywhere.
- **ADR-0005 live test case: unresolved, not passed.** Review prose is
  server-generated, no LLM named anywhere (bundle's only LLM strings are
  referrer-analytics regexes), and searches for public confabulation caught
  nothing — with ~1k downloads/121 ratings, nobody has looked. Cheap hands-on
  settle available: import one game, transcribe the debrief, check it against
  the board.
- Null results recorded in both dossiers: no third-party coverage of
  Chess2Story exists at all (no reviews/press/founder identity); no
  ChessMind confabulation reports; story bodies and most ChessMind SPA routes
  are client-rendered and unreadable from desk.

Next: remaining shortlist teardowns (Play Coach, Chessbook, ChessEver); optional
hands-on passes — one paid Chess2Story generation, one ChessMind review
transcription — if Q1a or the game-story RFC needs them.

## 2026-08-14 (Codex) — defect batch 2 implemented

- Closed D21 by making validated `segment.completed` events the sole segment truth;
  coincident checkpoints no longer produce phantom derived segments, genuine pre-guard
  zero-length events remain readable, and forged reveal scope is rejected.
- Closed D22 under pack schema 0.12 by making `opponentPolicy` closed and validating the
  complete committed pack corpus. No pack bytes or digests changed.
- Reconciled the stale D23/D24/D27 rows with regressions for honest unclassified phase,
  secure-cookie defaults, and a documented non-gating structural latency envelope.
- Canonical behavior is in `docs/branch-runtime.md`, `docs/drill-pack-format.md`, and
  `docs/structural-reading.md`; lifecycle archived after both verification gates passed.

## 2026-08-14 (claude) — 365Chess teardown: E1 intact; corpus verdict additive-but-unusable; third matrix miss recorded

- Landed `design/research/teardown-365chess-desk.md` (desk, `[V]` raw fetches of
  landing/pricing/trainer/play/endgame/puzzles/explorer/FAQ/ToS/shop/coach/robots.txt;
  site 403s the plain fetch tool, served 200 to a browser UA). Matrix row 42 added;
  README coverage row added.
- **What it is:** the prior held — a 2007-vintage games-database site (365Engage LLC;
  ~4.4M OTB games "updated every week", 220k players, 43k tournaments) whose center is
  the opening explorer (per-move count, last-played year, W/D/B %, cached depth-45–50
  evals), with training bolted on: guess-the-DB-move openings trainer (lookup),
  Stockfish 18 at levels 1–10 "ELO ~1300–2700" (the rejected-list weakened-SF
  opponent), a real-game endgame trainer with DTZ help and win-conversion verdicts
  (genuine play-out, no rewind/branches), Glicko puzzles, and a 258-course store with
  a 4-step memorize-then-flashcard coach. Pay-what-you-choose supporter tier
  (€20–100/yr) gates PGN export, Masters DB, own-database, player explorer.
- **E1 intact.** Lookup-first with disconnected play-out islands; zero of the three
  protected claims. Notable adjacent pressure: a "Play Position" door on every explorer
  node — nineteen years of explorer-with-play-button without a rehearsal loop is mild
  evidence the integration, not the plumbing, is the product.
- **Corpus-source verdict (Q6), under the corrected framing (explorer pipeline works
  via operator auth):** 365chess's master/OTB population is genuinely different from
  our rating-band rows (what-theory-plays vs what-1500s-play — both rung 4, different
  witnesses), but the site is unusable as a source (no API, supporter-gated per-list
  PGN only, robots.txt disallows download endpoints, ToS contains no data license at
  all 🟡) and redundant in practice: the same lila-openingexplorer backend we already
  authenticate to serves a public `/masters` endpoint. If master-line evidence is ever
  wanted, that's the route — a new closed question, new population label.
- **Adoption (design/02 posture):** the one good feature is the per-position evidence
  row — frequency + last-played recency + depth-labelled cached eval per named
  opening; enters through the rung-4 grounded-claims invariant (recency is a cheap
  honest addition to our explorer evidence). Love/hate: loved as an archive (own OTB
  games from decades back, crosstables, cheap), left for having no opponents and for
  corpus noise (duplicate/low-rated games polluting stats `[P]`) — a concrete caution
  that corpus counts inherit corpus hygiene (our min-100 abstention stays).
- **Process finding, recorded in README coverage limits:** third consecutive
  owner-side find. The gap sweep's cluster 10 was exactly this shelf and missed a
  19-year incumbent — novelty-tuned sweeps miss old incumbents, not just new entrants.
- Next: nothing urgent from this dossier; hands-on residuals listed (§9) matter only
  if the Learn-IA named-opening funnel or a `/masters` evidence question activates.
- Correction (same day, same author): the 365Chess matrix row is **row 41**, not 42
  as written above (41 data rows total; header verified 20 columns, row parses clean).

## 2026-08-14 (claude, coverage sweep 2) — notability-method sweep: 14 old-guard/mindshare rows; Lichess + Chess.com censused; E1 intact

- **What landed:** `design/research/coverage-sweep-2-notability.md` — the second
  coverage sweep, method inverted per the 365Chess process finding: enumerate the
  most-used platforms/tools by notability, traffic and community mindshare, then check
  each against the matrix. Every owner-listed old-guard prior was verified rather than
  trusted; several were wrong (chess24 dead 2024-01; ICC alive, relaunched 2024;
  Chessly is Rozman's, not Rosen/Naroditsky's; Magnus Trainer removed 2024-04;
  Everyman consolidated into the New In Chess shop).
- **Matrix:** 14 fetch-grounded absent-relevant products added (CSV lines 43–56):
  chessgames.com, ICC, Chess King Learn/CT-ART, Chessity, ChessKid, Chessly,
  **Dr. Wolf**, Forward Chess, Chessify, ChessMonitor, OpeningTree, En Croissant,
  WintrChess, chessvision.ai. Verdict-only (no row): SCID vs PC, Arena, Nibbler,
  Banksia (GUI shelf proxied by Lucas Chess/ChessBase rows), chesstree.net (no new
  axis), chesspuzzle.net (Cloudflare-blocked, `[P]` only), Shredder (engine-app
  commodity). Matrix correction recorded: ChessBase row understates the 12-app web
  suite (Playchess/tactics/Fritz Online/openings) — `[V]` account.chessbase.com.
- **Lichess and Chess.com censused as whole platforms for the first time** (censuses,
  not teardowns, in the dossier): feature maps against `design/03` surfaces plus
  top-3 loved/hated each with citations. Verdicts: Chess.com deserves a full
  teardown (strongest yes — Game Review re-entry and Coach Practice are load-bearing
  unknowns; its acquisition constellation IS the breadth strategy executed by M&A);
  Lichess deserves a scoped hands-on of studies + learn-from-your-mistakes +
  practice only.
- **E1 intact** after a second, method-inverted sweep. Sharpest pressure found:
  **Dr. Wolf** (Chess.com-owned, 4.8★/27k) ships rewind-and-explain as *unlimited
  undo with spoken explanation* — beloved by beginners, unpreserved, advice-during-play,
  and depth-capped right where our band starts. The "most-hated pain we already
  solve" is chess.com's paywalled read-only review (Trustpilot's dominant complaint);
  the most-loved ecosystem feature we lack is the instant human game against a live
  pool (deliberate — B5 keeps native matchmaking out of scope).
- **Teardown shortlist from this sweep:** Dr. Wolf, Chessly, WintrChess,
  En Croissant, ChessMonitor (+ the two platform verdicts above).
- **Blocked/limits:** Reddit unreachable (login wall + WebSearch domain refusal) — the
  r/chess mindshare angle proxied via alternativeto/substacks/forums/Trustpilot;
  English/US-only; non-English ecosystems still unswept. The two sweeps are
  complements: notability misses new entrants, clusters miss incumbents; the union is
  the real coverage.
- **Next:** nothing urgent; teardown queue above feeds Q1a when picked up.

## 2026-08-14 (Codex) — B3 completed by branch groups

- `branch-groups` completed its lifecycle and moved to `rfc/archive/branch-groups.md`;
  canonical behavior is in `docs/branch-groups.md`.
- B3 is now met: the existing N-way comparison/replay/export surface is joined by
  durable 2–8-candidate groups, four seed sources, fixed/per-branch controlled
  resistance, sequential/lockstep play, semantic zoom, explicit evidence recovery,
  group comparison, and variation-preserving export.
- Final verification on the archived tree: 389 tests across 67 files; Svelte 0/0;
  15 Playwright tests at zero retries, with the opt-in Maia latency case skipped.
- The active `game-import-and-story` draft and concurrent competitor research were
  not changed by this lifecycle.

## 2026-08-14 (claude, teardowns) — Chess.com whole platform + Dr. Wolf: both sweep-2 unknowns resolved, E1 intact twice

- **What landed:** `design/research/teardown-chesscom-platform-desk.md` and
  `design/research/teardown-drwolf-desk.md` — the sweep-2 shortlist's two strongest
  picks, in house format with love/hate sections. Matrix rows deepened (CSV lines 12
  and 49); two coverage rows added to `design/research/README.md`.
- **Chess.com — the Game Review re-entry unknown is resolved: NO.** The only in-review
  interaction is "Retry" — a one-ply guess-the-move exercise ("replay a specific
  position and attempt to find the best move yourself", support 8584089 `[V]`); users
  themselves call it a puzzle in the wrong place. Play re-entry exists only via the
  manual Self-Analysis → Practice-vs-Computer chain — unlinked, attempt-destroying
  (per the 2026-08-11 teardown). Gating verified exact: free = 1 review/day; coach
  explanations Diamond-only at $119.99/yr — Trustpilot's "$120/yr to learn from your
  mistakes" is numerically correct. Constellation verified (Komodo 2018 → integrated;
  Dr. Wolf 2020 → standalone; PMG 2022-12-16 → chess24 + Magnus Trainer killed,
  Everyman absorbed, Chessable/Aimchess standalone): **breadth bought per shelf, loop
  assembled nowhere** — the strongest evidence yet that orchestration is a product
  decision, not a portfolio side effect.
- **Dr. Wolf — the undo semantics are resolved: erase + harvest, never preserve.**
  Undo (unlimited, premium) removes the move; the blunder-guard ("Are you certain?",
  popsci `[V]`) offers retraction *before* the consequence is ever played — inverting
  commit-before-learning, not just attempt preservation. What survives is a
  mistake-review queue of isolated positions ("reviews past moves with you", App
  Store `[V]`) — mined lessons, not comparable attempts. No source describes seeing an
  earlier try again (searches recorded). Band 0–1300/1500 by its designer; "hardly
  benefit" past 1400 (chesstech `[V]`) — the ceiling sits where our band starts.
  Explanation mechanism undisclosed; accuracy complaints on record ("better for him,
  not the player") but no TTT-style confabulation catch.
- **E1: intact after both** — reopen trigger not met. Both products *validate demand*
  on our two entry surfaces: Retry Mistakes monetizes one-ply mistake re-entry at
  $119.99/yr; Dr. Wolf's 4.8★/27k proves rewind-and-explain appetite below our band.
- **Adoption steals recorded:** Chess.com's auto-offered post-game review ritual
  (ours re-enters play, attempts preserved); Dr. Wolf's spoken coach persona via the
  §3a silence default (beloved tone, our timing/grounding) + mistake resurfacing
  upgraded from positions to attempts.
- **RFC-relevant:** the game-import positioning line ("Chess.com's Game Review is
  paywalled and read-only") now carries precise citations: read-only-plus-one-ply-Retry
  `[V]`, 1 free review/day `[V]`, explained review $119.99/yr `[P]` price table.
- **Blocked/limits:** Trustpilot 403 (quotes stay `[P]`); chess.com/membership prices
  JS-hidden (grounded via mobeigi 2025-10 table); Google Play truncates; Retry
  Mistakes tier limits rest on a dated launch blog — hands-on residuals listed in
  both dossiers.
- **Next:** remaining sweep-2 shortlist (Chessly, WintrChess, En Croissant,
  ChessMonitor) + the scoped Lichess hands-on, as Q1a picks them up.

## 2026-08-14 (claude) — BREADTH COMPLETE

The final breadth RFC (`game-import-and-story`) is implemented, verified
independently (399 tests / 69 files, browser 16 at zero retries, spot-checks:
resignation stays the PGN's recorded result with the leaf playable; a chess.com
URL refuses with a teach-the-paste hint; stories are explicit-choice imports),
and archived. **Every gate B1–B11 is green. Zero open defects. No active product
RFCs.**

The standing owner ruling — full breadth, then full content — flips today.
`design/03`'s breadth-complete gate is satisfied: content expansion is now the
main work. What the content era inherits that batch 1 did not have: the shape
library (authored once, fires everywhere), structural predicates as authorable
objectives, drills-as-recipes over the sourcing pipelines, real explorer
priority data (`content/candidates/priority/priority.json`), the studio write
path, the playtest harness, and a 56-row market map with love/hate evidence.

Production order per `design/04` §8, updated for the library: shape entries
first (highest leverage — 10 middlegame structure families + 7 endgame
families), then packs referencing them in explorer-frequency order, then the
on-ramp via position-seeds, trajectories across them, and the long tail via
studio/import tooling. The owner plays when all is done, per their ruling.

## 2026-08-14 (claude) — adoption audit landed (`design/research/adoption-audit.md`)

The synthesis pass `design/02` §Adoption posture called for: every "best steal" /
loved-feature finding across all twelve teardowns, both sweeps, and
`competitor-value-props.md`, checked against the shipped surface (`docs/*`, B1–B11)
and the ledger. No new external research; every claim cites its source dossier or doc.

- **What landed:** 60 features audited — **34 shipped** (12 of them in explicitly
  transformed, invariant-compatible form: undo→fork, live labels→post-commit rail,
  SRS-cards→attempt scheduler, weakness-scan→opt-in recommender, Play-Coach→guided
  mode, …), **7 ledgered** (verified: reasoning transcript, category scan, recency,
  browser engines, blunder-guard encoding, mirror actions, events surface),
  **19 missing** in whole or decisive part.
- **What changed:** the third-shortlist frame was applied per the owner's
  transformation ruling — a conflict with an invariant is a design prompt, not a
  veto. Every collision transformed; **the refusal set came out empty**, including
  the human pool (minimal loved version: friend-link over shipped grants/sessions;
  native matchmaking stays behind B5's revival conditions) and pre-commit
  blunder-guarding (post-commit on-ramp form, already ledgered).
- **Top cheap adoptions:** (1) auto-offered post-game story for *native* runs — all
  detectors ship, story is import-only today, and the ritual is proven at platform
  scale; (2) spoken coach persona over the shipped packet-check seam; (3)
  event-shaped revisitable milestones; (4) flip-sides + one-click mirror retry;
  (5) grounded share card with suggested title.
- **Structural RFC candidates:** runtime corpus/explorer evidence surface (also the
  sharpest weaker-than-incumbent finding — a 2007 PHP site out-ships us on rung 4),
  Chessbook-style repertoire gap-finding, stated-reasoning capture + key-point
  grading, friend-link play.
- **Honesty section:** five places incumbents beat what we ship today — runtime
  corpus evidence, share artifacts, voice/audio, catalog depth (deliberate,
  content-last), mobile/PWA.
- **Proposed:** 12 BACKLOG rows (dossier §7) — owner-tier, not written by this pass.
- **Next:** owner triage of §7 into the ledger; the two shortlists are candidate
  input for content-era-adjacent RFC scheduling.

## 2026-08-14 (owner rulings) — full parallel wave; content wave 2 now; play-at-the-end stands

Everything in parallel: four RFC drafts at once (adoption wave 1; social
match+friend-link; predicate wave 2; runtime corpus evidence), opening-pack
production starts alongside in explorer-priority order, and the owner's
play-at-the-end ruling stands with the invariant review attached to that first
session. Register discipline pre-assigned: drafts claim numbers in the order
predicate-wave-2 → corpus-evidence → adoption-wave-1 → social-match.

## 2026-08-14 (claude) — RFC draft: `rfc/adoption-wave-1.md`

Third draft of the parallel wave (behind predicate-wave-2 and runtime-corpus-evidence
per the pre-assigned register order; neither sibling draft was present in `rfc/` at
drafting time). Specifies the audit's five cheap adoptions (`adoption-audit.md` §4,
BACKLOG rows of 2026-08-14): native-run story ritual (offer-at-terminal, storyable =
terminal `outcome.reached`), grounded share card + deterministic/packet-bound title +
public `story_read` token, spoken delivery (browser SpeechSynthesis) + `external_http`
voice-provider adapter, derived event-shaped milestones on `/learn`, and flip-sides /
one-click mirror as pack-free derived runs (`run_derivations`). Register: migration 14
claimed (create-table only: `public_tokens`, `run_derivations`); 13 recorded as
reserved for corpus-evidence; no pack/run schema claims. Cross-draft pin added:
adoption-wave-1 owns `public_tokens`; social-match extends its scope CHECK, no second
token table. One design deviation called out: opposite-side ships as Just Play from
the same root (authored grades never flip sides). Baseline verified green before
drafting: 399 unit tests / 69 files, 16 ordinary browser tests.

## 2026-08-14 (claude) — Chessbook teardown + three quick passes (sweep picks closed out)

Landed `design/research/teardown-chessbook-desk.md` (full, desk) and
`design/research/quickpass-wintrChess-encroissant-chessmonitor.md` (three quick
passes per the three-question rule); matrix rows updated for all four (CSV lines
31, 52, 54, 55) and two README coverage rows added.

- **Chessbook (E1 intact):** gap-finding mechanics established from the developer's
  own accounts — position/EPD-keyed repertoire graph (transposition-correct by
  construction), gap = uncovered opponent reply prioritized by expected frequency at
  the learner's 200-Elo Lichess band ("you'll see this move in 5% of your games"),
  user-set "1 in N games" coverage target as the stopping rule, one-button "go to
  your biggest gap." Corpus: every non-bullet Lichess game + 10M OTB 2400+. SRS is
  FSRS move-cards (moved *to* FSRS in 2024 — opposite our explainable-ladder ruling;
  their queue-flood complaint is evidence for ours). Own-game scan harvests mistakes
  into quiz cards severed from the game — the Dr. Wolf shape again. **§7 of the
  teardown states the adoption contract for the queued gap-finding RFC** (audit row
  48): six items, incl. where we exceed — a gap resolves into played, preserved
  attempts vs Maia, not a card-add. No opponent play anywhere; every loop stage
  unclaimed.
- **WintrChess (E1 intact):** Stockfish + chess.com-style classification, no prose,
  no re-entry; public reliability complaints (blunder-yet-best, illegal-move claims)
  — the trust lesson our verified-provenance rule answers.
- **En Croissant (E1 intact):** manual workbench; its community independently
  demands eval-bar hiding — external validation of the anti-contamination default;
  repertoire SRS immature; our AGPL/self-host constituency.
- **ChessMonitor (E1 intact) — the honesty question answered:** what users love is
  mostly real-outcome record-keeping (posture-compatible), *but* the marquee,
  Giri-fronted number is a manufactured FIDE-Elo estimate — direct demand-evidence
  for the single number our no-skill-numbers posture refuses. Logged as a named,
  evidenced cost of the posture (not a DESIGN-GAP — owner ruling stands; B7's
  event-milestone bet must compensate and is unproven against this shelf).
- E1 stays **met**; no gates.md change (four E1-intact verdicts, no kill evidence).
  Reddit remains unreachable (standing limitation); chessbook.com is an unreadable
  SPA — grounding via App Store, dev interview/blog, and hands-on reviews.
- **Next:** the gap-finding RFC can now draft against teardown §7 once the runtime
  corpus-evidence surface (its dependency) lands; remaining sweep-2 pick: Chessly;
  scoped Lichess hands-on (studies / learn-from-mistakes / practice) still queued.

## 2026-08-14 (owner rulings) — the Spire map, and progression is never for sale

1. **The map gates its own rewards; the library stays open.** The full catalog
   is always browsable and directly playable — a coach can assign anything, the
   breadth posture holds. The Spire map is a chosen mode with its own unlock
   state: encounters, earned reveals, the ceremony. Slow-drip for those who
   choose the journey; zero paternalism for those who don't.
2. **Progression is never monetized — standing law**, same tier as ADR-0005:
   whatever Q2's still-open monetization axis ever decides (hosting, support),
   no unlock, encounter, path, or ceremony is ever purchasable and no
   progression state is ever for sale. The satirical pack-opening only lands
   because this is load-bearing and visible: the joke IS the promise.

## 2026-08-14 (owner rulings) — orphan triage: all four scheduled; mates packs in

All four offered orphans join the polish wave: narrative mode + difference
strips, session distillation, `perfect_tablebase`, and the recommender. The
events layer (pack nights/cohorts/relays) stays parked behind B5's revival
conditions — the one conscious parking. Theoretical-mates packs join the final
endgame batch. The polish wave is therefore the LAST feature wave: surfaces
(PWA, settings, form slices), the orphan four, and the grounding pair
(`verify-draft`, perfect-play policy).

## 2026-08-14 — the feature roadmap closed; reconciliation delta

**Landed.** The last feature wave: polish-surfaces (`765efb5`),
orphan-completion (`0939070`), grounding-pair (`2fd82be`), all archived. The
features column of `roadmap-to-done.md` is empty. Content: the mates + variants
batch (`06f48fe`) — K+Q, K+R, two bishops, and the Philidor convert sibling,
every spine walked to checkmate, five authored chess errors caught pre-ship by
the tablebase harness. All four then grounded through the brand-new
`make verify-draft` (`0b4caf3`) — a tool built for wave 5b generalizing to
content it had never seen, which is the argument for building it.

**Verified, not accepted.** Gates run personally rather than taken from the
implementer's report: `ENGINES_REQUIRED=1 make verify` 474 tests / 80 files
exit 0; `make test-browser` 24 passed, zero retries. Spot-checked the mates
batch's most load-bearing claim against the tablebase myself — the convert root
really does have exactly one winning move of 21.

**Changed.** The reconciliation gate's delta re-run (`713fdde`) found the
ledger flow-back failure recurring: `2fd82be` flipped the RFC register in-commit
but not the BACKLOG rows it ships. Flipped post-hoc, attributed. Also corrected
a shape-entry count overstated as 24 in two places — two *commissioned*
entries were being counted as *authored*, which is exactly how a content gap
becomes invisible.

**Blocked / owner-facing.** One reverse-trace orphan, triaged: `cursed-win` /
`blessed-loss` ship in code with correct inversion and ranking but flow back to
no design doc, and they contradict `01-training-model.md` §Outcome types — a
Win drill cannot be satisfied in a cursed win under the 50-move rule. Needs a
ruling. So does the deferred B+N mate. Neither blocks anything today.

**Next.** Content only: two commissioned shape entries (London wedge, KID
arrangement chain), Scandinavian wave-4b, and the pass that is still genuinely
at zero — Stockfish validation of middlegame/opening authored claims, which no
tablebase can settle. Then the owner's session and its invariant review.

## 2026-08-15 — Q7 answered; K10 does not fire; the unpaid grounding bill

**Landed.** `design/research/pack-authoring-cost.md` — the Q7/K10 verdict, from
evidence the repo had been generating for four days and never harvesting: 33
instrumented packs across nine waves. **43.5 agent-minutes per pack, tooling
friction 11.6%** (9.2% excluding pack A), under the ~25% threshold that fires
the build-tooling rule. K10 moves from `open` to `📊 evidence against firing`;
Q7 from `🔬 job open` to answered `[P]`; C6 to qualified evidence with the word
"reviewed" struck, since C1's reviewer pass was withdrawn 2026-08-13 and the
gate had been describing a stage that no longer exists.

**The finding under the verdict.** Cost tracks the **grounding bar, not the
format**: opening packs are the cheapest in the corpus (28.8 min/pack) because
they carry *zero* engine validation, while Syzygy-grounded endgames cost 40.6.
So the average that makes K10 look safe is held down by 15 packs that have not
paid their §3b bill. That grounding pass is now a ledger row, and it is the one
piece of work that could move K10 back.

**What the instrument got wrong about itself.** `content-era/plan.md` §1b
predicted the pipeline would be dominated by `owner-review` + `revision`; they
are 5.3% combined, while `encoding` + `research` are 71.9%. And the standing
rule "encoding dominance means the format is wrong" would misfire here —
encoding time is *prose*, not schema fights; waves 3 and 5a record zero of
those. The decision rules need correcting before they are trusted again.

**Blocked / unmeasured.** Runtime playtest cost has not been measured since
2026-08-12 — no wave has played a run since. Pack A's 45 friction minutes were
run-assembly, so the steady-state 9% describes drafting and *static* validation
only. Neither fixed nor still-present: unmeasured. Ledgered.

**Correction of record.** Claude repeatedly stated 41 authored packs, including
in the brief that commissioned this dossier. The true count is 35 — the rest
were `*.evidence/job/sources.json` sidecars and browser fixtures. The dossier
caught it by counting.

**Next.** The Q4a/Q4b author-capability dossier is in flight and is the one that
rules on K7 and the E3 gate; this dossier deliberately did not.

## 2026-08-15 — Q4a/Q4b answered; E3 partially met; the tempo contract is unauthorable

**Landed.** `design/research/authored-transitions-and-features.md` — the second
harvest of the content era's own evidence, over the same 35 packs.

**Q4a, split verdict.** Authors declared phase boundaries reliably **and by
hand**: 32 of 35 packs carry an `authoredBoundary`, **17 of them under no
validator compulsion**, `plyHorizon` equals the deepest spine path in 19 of 32,
and all **6 of 6** cross-phase trajectory leg boundaries fire at the exact ply
the author claimed, verified under the shipped `matchesStructuralExpression`.
That is the half E3 was written to test, and it is met without any detector.

**The other half is zero.** A timing window was declared **0 times across 135
checkpoints** — and it is a refusal, not an oversight. `04-content-architecture.md:228`
*requires* one per opening root; 18 of 18 opening packs have none. Packs A and C
independently recorded that a single `simpleTrigger` cannot express
plan-readiness-as-a-move-set or multi-move drift. And `windowOpens` /
`luxuryMoveBudget` have **no evaluator anywhere** — `pack-orchestrator.ts:64-73`
reduces a window to its close trigger.

**Why that is bigger than a format gap.** *Right plan one move too slow* and
*tension released too early* are named target mistake classes in
`01-training-model.md`. The tempo contract carries thesis weight, and it is
currently unauthorable. E3 → **partially met**; K7 → **open, split by
evidence** (structure encodable, timing not, logged as partial kill-criterion
evidence per law 6). It also corrects how B4 has been carried: blocked on
**vocabulary, not content effort** — no amount of authoring discharges it.

**Q4b lands a sharper boundary than the question asked for.** Deterministic
features assist reliably wherever the authored claim is a **census** (22/25
shape references and 14/14 in-spine structural triggers fire, zero evaluator
errors; the gap→predicate→adoption loop closed inside one day for all five
wave-2 predicates) and assist with **nothing** wherever the claim is a
**judgment** — plans, intent, history, timing. The authors said so themselves:
**75 of 103 shape plans ship `signature: null`**. Seven of fifteen feature kinds
have never appeared in a pack, and all 43 `piece_reach_count` leaves are the
`atLeast 0` existence hack — a missing existence predicate wearing a costume.

**Corrections of record.** The dossier independently re-derived the corpus size
as **35 packs and 23 shapes**, confirming the count claude had been overstating.
And it flagged an apparent contradiction between the B+N wave report and the
shipped `mate-two-bishops.json`; resolved in place — the report was correct
against the 08-14 file, claude fixed the dead condition in `25b4584`, and the
dossier read the fixed version. Both observations true, different versions.

**Next.** Two of nine exploration questions closed in one day from evidence
already on disk. The predicate roadmap (§6, seven items ≥2 attestations) is now
an evidence-ordered queue rather than a wish list.

## 2026-08-15 (evening) — five RFCs drafted, eight authored claims refuted, a research gate held

**Drafted, all cross-review pending except the first.** `authoring-frictions`
(ready for codex, pack 0.16), `tempo-vocabulary` (0.17), `predicate-wave-3`
(0.18 + shape-entry 0.3), `validator-integrity` (claims nothing versioned),
`resistance-spectrum` (run 0.14 / migration 19, rebased by the register writer
after its lane freed). Registers reconciled centrally; no collisions.

**Two RFCs were commissioned and killed the same hour.** Own-game import and the
~8-moment story were already shipped (`docs/game-import-and-story.md`), including
story re-entry branches and PGN export. They were listed as open in
`planning/open-work-inventory.md` — the file written that morning *to be* the
trustworthy list. It now carries a verification pass correcting itself. The
standing lesson, learned twice in one day: **a ledger row is a claim about the
past, not evidence about the present.**

**The content finding that justifies the whole day.** Grounding wave G1 ran the
first engine-validation pass ever performed on opening content — 18 packs, 180
decision positions, 387 engine jobs through the repo's own supervisor. Eight
authored claims refuted, the worst being a **piece blunder in a spine mainline
annotated as an even trade**: after 5.Be3 Bxc5 6.Bxc5 Black has no legal
recapture (verified independently with chessops — zero recaptures on c5), and the
text read *"Material is level again and the position is the receipt."* Refuted
claims were deleted, never replaced by invention; no deviation class was
reclassified, leaving four number-versus-class disagreements visible rather than
papered over.

**The structural finding underneath it.** Two of three phases have **no
evidence-attachment path**: `pack-validation.ts:448` refuses grading on
non-outcome objectives, so opening packs cannot be `ledger_verified` — the same
hole B+N hit from the trajectory side. G1's evidence lives in
`provenance.engineValidation`, which validates only because that object accepts
anything. Honest storage, not grounding.

**Cross-draft catch.** `validator-integrity` found that `authoring-frictions` §8
was about to ship a *new* instance of D32 inside the wave meant to prevent it —
`RULES_EVIDENCE_FACTS` has no bare `"draw"`, so the widened enum would pass
`pack-check` and throw when played. Verified against the shipped file and
corrected before codex reached it.

**Gates.** K10 strengthened: the opening grounding bill is paid at 10.3 min/pack,
fully-loaded 39.1 vs the endgame 40.6 — the trigger does not fire. Still
unmeasured: **runtime playtest cost, because nobody has played a run since
2026-08-12.**

**Held, deliberately.** The owner generated a large campaign/roguelike cluster
and then ruled that it needs research before design. `planning/campaign-research-queue.md`
records R1–R8, split into what can run now and what must wait for the first
session — because the campaign wraps the core loop, and a wrong loop makes the
wrapper wasted work.

## 2026-08-15 (late) — four owner rulings, logged

Recorded here because a cross-review correctly refused to treat one of them as
ratified: they had been applied to RFCs and to `design/BACKLOG.md` but never
written to the append-only log, so no implementing agent could verify them.
That is a process defect in claude's handling, not in the rulings.

**1. Branch-set scale — pruning and collapse, NOT ranking.** *"If you make 9
branches it becomes cumbersome… if 4 are completely lost that is obvious pruning
so it can be hidden from main views but if you expand or w/e ez prune… we don't
want to overload the entire machine with 99 branches of eval AND the user ux."*
The `n-way-comparison` refusal (never ranks, never names a winner) **stands
untouched**. The owner's framing supplied the honest key: *completely lost* is a
**decided** position, and R4 measured that outcome class is exact exactly there.
A decided branch may be collapsed because that states a settled fact; an
undecided branch may never be auto-collapsed because nothing can honestly call it
worse. Decidedness does the work ranking was being asked to do, with no verdict.
Drafting as `rfc/branch-set-scale.md`.

**2. Intent grading — grade the 45%, refuse the rest BY NAME.** The measured
ceiling stands (49 of 75 unmeasurable plan notes are judgment, outcome or
history). Where a declared intent has a census target the run reports whether it
occurred; where it does not, the product **says so** — visible refusal, never
silence. This overturns `predicate-wave-3` F1's "the correct behaviour is
silence"; its cross-review added §5c-bis supplying capability publication, named
refusal and applied record, since the uncovered case previously satisfied 1 of
the declared-vs-executable law's 3 legs.

**3. `outpaced` — authored contexts declare, unauthored contexts default.** A
pack may declare per window whether `outpaced` grades (default ungraded); **Just
Play grades it as a failure**, because entering a race a tempo behind is a real
mistake made earlier and no author is present to say otherwise. The
generalisation is the valuable part and is ledgered as its own row: wherever the
product must choose a semantic, an authored context supplies it and an
unauthored context needs a *stated* default — the two must never collapse into
one global answer.

**4. The human oracle is the next research question (R9).** Human win/draw/loss
counts are the only oracle that exists where engines have no result. Measuring
depth of coverage at 1400/1600/1800 and, decisively, whether positions Stockfish
calls level show **skewed** human results. If level positions all return ~50/50
the oracle adds nothing; if some return 60/40 that skew is the difficulty signal
everything outside endgames needs.

## 2026-08-15 — tempo vocabulary implementation (codex)

- Pack schema 0.17 replaces the unused point-pair timing trigger with a branch-local
  move ledger: commitment opening, move-set readiness, tolerated moves, ordered closes,
  luxury spend, and seven computed verdicts.
- `preserve_plan_window`, `atWindow`, `timing_window` conditions, `tempo:` evidence,
  capability publication, and named validation refusals now execute. Authored windows
  opt `outpaced` into grading; unauthored contexts publish failure as their default.
- E3 remains partially met only because no authored content has yet adopted the new
  object. The vocabulary/detector blocker itself is closed; automatic detection remains
  deliberately out of scope.

## 2026-08-15 (night) — R9: the oracle discriminates but does not reach

**Landed.** `design/research/human-outcome-coverage-depth.md`. The owner ruled
this the next research question this afternoon; it is answered.

**The half that is a yes, with force.** Human win/draw/loss separates positions
Stockfish cannot. At band 1600, 124 positions the engine calls level (|eval|
< 50 cp) span human scores 0.405–0.600, and **Pearson(cp, score) = −0.079** —
the engine explains **under 1%** of the variance in how humans actually do.
Move-level is sharper: among **2,814 move pairs Stockfish cannot separate**
(|Δcp| < 30), **475 (16.9%) are separated by ≥5 pp significantly**, to a maximum
of 22.3 pp. R4's closing hypothesis is confirmed: where the engine has no result,
the human corpus does.

**The half that is a no, and it is not fixable with more data.** Usable coverage
— n ≥ 400, a threshold stated *before* measuring — ends at **ply ~20** at
position level and thins from **ply 12** at move level: mean moves clearing 400
games falls from 10.1 at plies 4–7 to **0.17** at plies 20–23, against ~35 legal
moves. Zero games by ply 27. And every population lever was measured rather than
assumed: whole-database window ×3.51, all six speeds ×1.35, three merged buckets
×3.10, **all three at once ×23.4** — a 23× larger population moves choice-level
coverage from ply 19–21 to **ply 23**. No population setting reaches the
middlegame.

**The structural consequence, now a ledgered defect.** Engines are silent where
positions are undecided (R4); humans are silent past ply ~20 (R9). **Measured
difficulty covers endgames and the first ten moves, and the middlegame between
them has no oracle of either kind.** Every design that assumed a measured
difficulty mid-game — bosses, `practical_resistance` outside endgames, adaptive
scaling — must use **authored** difficulty there and say so. The campaign
cluster's difficulty-availability axis now has a third value, and it is the
common case rather than the exception.

**Instrument discipline, applied unprompted.** The agent found 13 of 17
non-endgame packs are *censored* — their spines end before the data does — so a
naive per-pack median would have reported a property of our corpus rather than of
the explorer. It removed the corpus entirely with a greedy most-popular walk and
landed on the same boundary. It also caught and recorded its own off-by-one join
that had reported 2/154 coverage instead of 133/154. This is the Scandinavian
lesson — check the instrument, not just the reading — applied without being told.

**Two findings that touch shipped code.** The explorer's floor of 100 games
(`explorer.ts:91`) is *exactly* the 60/40 resolution line, while the measured
signal is 2.6 pp mean (4.9 pp p90) and needs n ≥ 400 — defensible as shipped and
for nothing finer. And the on-ramp gap is worse than recorded: band 1000 has
**45–100× fewer games** at plies 12–19, and **all 26 puzzle-derived on-ramp roots
return 0–5 games at every band** — those positions are largely ungroundable by
corpus evidence, not merely mis-banded.

## 2026-08-15 (late) — four rulings; nothing owner-gated remains before codex

**Ruled.** (1) A success condition that never fires on its own pack's line stays
an **error**, with the three-row diagnosis table shipped so a refused author sees
what was checked and where. The refusal is defensible because its corpus is *the
pack's own assertion*; a warning would return this to the `timingWindow` answer —
a subsystem shipped with no enforcement, zero uses across 145 checkpoints, a gate
blocked for months. (2) **`structuralDelta` is fixed, not deleted and not left**:
`transition-primitives` now owns rewriting `evictionChanges` so each FEN is parsed
once rather than 256 `pawnSafety` calls each re-parsing — 43% of its 1721 µs/ply,
density-independent, so it costs 652 µs even on ≤8-piece endgames where the entire
transition census costs 7.5. The exclusion and its module-graph test are
unaffected: **fixing is not consuming.** (3) D51 closes by gating the marker behind
the stronger permission, cost accepted with open eyes — the marker leaves
participants and spectators, and leaves solo play until delivery opens. (4) The
census ships as a **command only**; a non-blocking CI job with no owner becomes
noise, and a gate that fails on coverage would refuse correct-but-uncovered work
at CI instead of at load.

**State.** Six waves landed and verified today; `branch-set-scale` archived and
`deviation-classes` in flight. `transition-primitives` (0.22) and
`expression-census` (nothing versioned) are unblocked by these rulings;
`live-marker-quality` is in cross-review. **Nothing is owner-gated ahead of
codex.** The session-independent research queue is empty — R1–R5 and R9 all
answered, three of them refuting or inverting the assumption they tested.

**Owed, and named so it is not discovered later:** `rfc/README.md` needs the
claim-order note recording that `expression-census` should land **last** of the
in-flight set to absorb the textual rebase rather than impose it.

## 2026-08-15 (codex) — transition primitives implemented

Pack schema 0.22 now has a sibling grammar for committed-edge facts, executable objective rules,
six evidence refs, polarity-aware coverage refusals, and a learner-opened reading in both drills
and Just Play. Three authored packs exercise it, including a negative condition demonstrated by a
legal deviation edge. R3's measured fallback was applied: no live marker or new assistance setting.

The production evaluator was oracle-checked over 634 spine transitions. Landing rates are 37.5%
attacks, 34.1% defences, 54.1% slider lines, 94.0% geometric destinations, 12.1% duty crossings,
and 34.2% irreversibility; median full reading was 51.32 µs per ply. One accepted-RFC premise was
corrected during implementation: the old duty harness counted moved pieces at their new squares,
whereas the specified leaf requires same-square identity. The stricter production semantics remain.

The late owner rulings landed with the implementation: zero pack coverage stays an error with a
three-part diagnosis, and `structuralDelta` now parses each FEN once during its eviction scan while
remaining outside the transition call graph.

## 2026-08-15 (codex) — expression census implementing

The repo now has the read-only instrument rebuilt manually across seven content waves. It walks all
six structural-expression host sites and reports coverage separately from sound, three-valued
satisfiability. The current tree reproduces 43 packs / 694 positions / 159 subjects; a committed
played witness proves the uncovered knight-outpost fan satisfiable without manufacturing coverage.

Cross-review's corrected R1 and R6 are pinned by their nine counterexamples and generated legal
positions. One remaining polarity typo was found in the RFC's degeneracy criterion and corrected:
the empty-set vacuity belongs to `every`, not to its surrounding negation. Shape checking gains
opt-in corpus warnings, probing, and multi-file use; coverage remains outside `make verify`.

## 2026-08-15 (codex) — D56 float32 policy mass fixed

The pinned `chess-tabiya-maia:1e13597` sidecar reproduced the defect with an
eleven-candidate Elo-1500 vector summing to `1.00000000803311`: valid float32
output that the old `1 + 1e-9` guard rejected. The regression now uses that
captured vector. Policy-mass accumulation admits 32 float32 ulps, while a
material excess still refuses by the typed
`PRACTICAL_RESISTANCE_POLICY_MASS_INVALID` code and maps to HTTP 422 instead of
falling through to an unhandled 500. D57–D59 were not bundled; their behavior
requires separate contracts.

## 2026-08-15 (night) — reconciliation over twelve waves; the failure moved one tier up

**The gate ran** for the first time since morning, across the largest delta it has
had: eleven archived RFCs, nine research dossiers, a new design doc, ~25 new
defect rows.

**The headline is a process result, not a defect list.** The 2026-08-14 fix —
making the ledger flip ride in the implementing commit — **worked**: 10 of 11 waves
flowed back correctly. But **the failure moved one tier up**. None of the eleven is
named anywhere in `design/03-product-breadth.md` or `planning/exploration/gates.md`;
the gate surface is now the unmaintained tier. Sharper still: **three gate rows are
stale because the previous delta run's own corrections were never carried into
them** — the 08-14 run verified `comparisonStrips`, `/runs/:id/distill` and
`/progress/recommendations` in code and wrote that into the dossier, while the gate
rows it was verifying still say all three do not exist.

**A design-tier error of claude's, corrected.** `design/06-campaign.md` claimed the
difficulty-availability axis "exists as `branchDecidedness`… each with a named
ground". Verified false on both counts: only `decided` carries a **ground**, the
other two carry a `reason`, and `DecidednessGround` has **no human-outcome kind** —
the very thing R9 established as the openings' oracle. `campaign-synthesis.md` had
stated it correctly, with both qualifiers; the design doc dropped them. This is the
class of error the whole reconciliation discipline exists to catch, committed by the
person running it.

**Ledger integrity, three fixes.** D69 was marked ✅ on the **ruling** — a ruling is
not a fix, `practical-difficulty.ts` is unchanged, and it closes when
`fixture-realism` lands. D35 must **not** flip: `engine-request-contract` closed the
*clear* obligation, not the movetime nondeterminism. And `expression-census` existed
in **neither** register table — its Active row was removed on archive and no Archive
row added, so a shipped RFC was invisible.

**Process change adopted, owner-vetoable.** The completion protocol now requires the
**log entry** in the archiving commit alongside the ledger flip. The evidence is
exact: `engine-request-contract` was the one RFC that flowed back to nothing, and
the only one with no log entry. The absence predicted the failure perfectly, which
is what makes it a guard rather than ceremony.

**Also clean, and worth recording:** the 2026-08-14 escalation is discharged —
cursed-win/blessed-loss now has design-tier text. Flow-back was *better* this wave
than proposed in one case. All nine dossiers have coverage-matrix rows. And the
expression census's first real run found **zero genuinely dead expressions** across
36 zero-firing subjects, with every headline figure reproducing exactly.

**Gate status: both lists non-empty. Done is not declared.**

## 2026-08-15 — D91 Maia band regression repaired

The engine capability audit found that production stated `Elo <requested>` and then reset `SelfElo` and `OppoElo` to 1500; because `Elo` aliases that pair, every recorded band was inert. The production selector now states the two advertised defaults first and the resolved `Elo` alias last. The defaults remain request-scoped state rather than being deleted.

The regression gate uses the production `OpponentSelector` against the pinned real Maia image, not a synthetic client or a hand-shaped engine request. It records 1000 and 2400 as applied, asserts the production command order, and proves the two returned policy vectors differ. `INTEGRATION=maia pnpm test:maia` passed all three integration tests. D91 and the re-opened D60 are ready for independent review and owner-ledger closure; this implementation does not edit the design tier.

## 2026-08-15 (codex) — fixture-realism and client-surface-floor completed

Both already-implemented RFCs completed the acceptance work their first implementation logs had asserted but not demonstrated. Four fixture-realism mutations were run against the real tree and reverted: changing the deployed Maia identity failed the captured-identity test; advancing all 25 shape patch versions left the runtime suite green; a new undisposed `SourcingError` failed whole-tree refusal coverage; and a second marked instrument-fed production function failed the fixture register. Production discovery now ignores real `node_modules` directories rather than depending on pnpm symlinks.

The client surface floor received the same treatment. Reintroduced layout defects made the tablet document 1280 px tall in a 1024 px viewport, put a compact board outside its clipping ancestor, and made the run region scroll; reintroduced `session`, a 16 px pivotal target, and a spectator-only rendered control each failed their guards. The viewer-role guard now checks all rendered markup rather than one condition spelling, while the surviving document-scroll assertion states its desktop/tablet scope in source.

Final gates on the restored tree: `ENGINES_REQUIRED=1 make verify` passed **608 tests / 98 files**, schema and packaging clean, Svelte 0/0; `make test-browser` passed **24 at zero retries**, with only the baseline optional Maia-profile case skipped. Canonical behavior is reconciled in `docs/development.md`, `docs/tablebase-grounding.md`, `docs/content-sourcing.md`, and `docs/app-shell.md`. The RFCs and planning directories are archived. Ledger rows **D47, D54, D61, D62 and D69** close here; D63 remains open because compare geometry was explicitly outside `client-surface-floor`.

**Post-archive gate note:** a second unchanged-tree browser run failed the served-Najdorf walkthrough after its branch move (**23 passed / 1 failed / 1 baseline skip**), while the immediately preceding and following runs passed **24 / 1 skip**. Retries remain unset. This is recorded as D104 rather than rationalized into the two completed viewport/fixture lifecycles.

## 2026-08-15 (night) — three RFCs accepted, D97 ruled, four agents out

**Landed.** Content fix wave F (`41afe00`): D75 fixed one level above where it was
looked for — `rook-4v3-same-side`'s signature was sound, its *trigger* was loose;
firings 41 → 24, and the seven "successes" of `black-sixth-rank-restraint` were all
Philidor positions the loose trigger admitted. **D76's premise was refuted rather than
applied**: `fianchetto-g7` is not g7-specific (its own trigger is
`any[g6/g7, mirrored(files, g6/g7)]`), so the mirrored arm is correct and the entry
*name* was the defect. 26 witnesses added across 12 keys; census `satisfiabilityUnknown`
35 → 24, `unsatisfiable` still 0.

**Accepted** (`f07a320`): `engine-leverage` (pack 0.23 / run 0.16 / migration 22),
`vocabulary-wiring` (pack 0.24), `live-surface-honesty` (nothing versioned) — all
cross-reviewed by an agent that did not write them, fixes applied in the body.
`engine-leverage`'s hard dependency D64 closed in `8b1b44d`, unblocking its criterion 4.
Codex has them in claim order; the review bottleneck that starved the queue has cleared.

**Ledger.** D59 flipped ✅ after independent verification — it had been closed in code by
`43c6c4a` a day earlier, but the commit shipped the fix under the engine-request
contract's *state* obligation without naming the row, so the row stood open. This is the
second instance of the same pattern (a fix landing under a law's name rather than a row's)
and it argues the ledger flip should key on the defect, not the doctrine. D102 and D103
added from wave F; D39/D40 re-verified closed.

**Owner ruling — D97, and it is the third time in this shape.** Offered three ways to
handle the 61 unbacked feedback claims (withhold: 49.0% delivered; deliver with stated
absence: 78.2% nominal but 55.2% once spelled-out cardinals are caught — 28 of the 36
newly delivered carry one, including *"nine win, nine draw"*; tier by label: 79.1%), the
owner refused all three: ***"why not fix them properly?"***

That is the correct reading and it inverts the work. `check.ts` does not merely lack a
prose-preserving path, it **forbids** one — the templates require the supported prose to
be the byte-exact rendered sentence, and the one path that works overwrites the author
outright. So withholding was never deferral. New RFC `claim-backing.md` owns the remedy:
make the debt **payable** by binding an instrument record to authored prose instead of
replacing it. `feedback-delivery` lands behind it and its C6 fork is **dissolved rather
than answered**. Provisionally holds pack 0.26, releasable if the remedy is validator-only.

The standing hazard is named in the drafting brief: the byte-exact rule is not arbitrary —
it is what makes the sentence answerable to the measurement. A remedy that relaxes it
naively lets an author write anything and staple a record to it, which is law 8 failing
from the authoring side rather than the rendering side.

**Owner ruling — campaign.** The run-failure question (*"a run that cannot be lost is a
playlist"*) waits for the intermediate-consequence dossier rather than being settled now.
Ruling on the boss-node price while the intermediate-node question is open is the
collapse the owner flagged when he said bosses-only leaves the intermediate without
consequence.

**Out now:** `format-surface` cross-review · campaign intermediate-consequence dossier ·
middlegame content wave (Act II has exactly one pack today) · `claim-backing` draft.

## 2026-08-15 (late night) — law 8 found failing from the authoring side

**`rfc/claim-backing.md` drafted** — the owner-ruled remedy for D97. It **released pack
0.26**: the fix is validator-and-ledger only. No `$defs` touched, no committed pack byte
changes, no digest moves, no migration, no run schema, and all 68 committed ledgers stay
valid unchanged. Delivery goes **49.0% day zero → 64.5% on already-committed records →
95.4% after the instrument waves, and never 131 of 131** — an acceptance criterion makes
full admission a *failure*, which is the shape law 8 requires.

`EVIDENCE_OVERREACH` is **narrowed, not widened** — claim pointers become unconditionally
forbidden in `record.supports`, removing the two template exemptions at a measured cost of
zero records. The C6 fork is dissolved as the owner ruled: withholding becomes genuine
deferral, so C6′ and C6″ are withdrawn as softeners for a refusal that no longer exists.

**The escalation, and it is the one worth reading.** The draft found — and claude
independently verified — that **the product is manufacturing chess truth in its own
content**. `philidor-passive-rook-convert` asserts *"All twenty-one legal moves were
enumerated and queried: thirteen draw… seven lose… That exclusivity is a machine fact
about this position."* Its ledger holds 25 `tablebase_result` records at **25 distinct
anchor FENs** — a walk *down the spine*, one per position — and **exactly one** anchors at
the root being enumerated. No instrument in this repo produced that breakdown.

The claim is probably *true*. That is not the standard. Law 8 has always been read as a
constraint on **rendering** — the "Stockfish: +0.54 / LLM: 'Ne5 centralizes'" dashboard.
This is the same violation from the **authoring** side, and it is harder to see precisely
because the sentence is well-informed. **D110/D111 are logged as kill-criterion-adjacent
under law 6**: the product exhibiting its own named anti-pattern in its own corpus is
evidence against the thesis's central promise, and it is escalated rather than filed as a
content bug.

**Claude's own error inside this finding, recorded because it is instructive.** A first
sweep reported *23 packs* carrying enumeration assertions. **Wrong, withdrawn.** 22 of the
23 were the **opposite** — the honest disclaimer *"all legal moves were not enumerated"*
that every engine-pass note carries by design. The regex missed the negation, and the
error inverted the meaning of the evidence. Two scopes are now recorded rather than one
being chosen: a phrase-level sweep finds **4 assertions across 3 files**; the drafting
agent's claim-level detector finds **13**. They measure different things and both stand.

Also new: **D112** — `$defs/feedbackClaim` is `additionalProperties: true`, so any future
claim field validates silently unchecked. **Zero `explorer_frequency` records exist
repo-wide**, and several cited engine figures (`+1.09`, `−1.06`, `−1.20`, `−1.70`) appear
in no ledger anywhere in `content/`.

**Process.** Codex archived `fixture-realism` and `client-surface-floor` (`2d0f7be`) with
every red/green demonstration recorded, then **refused the next queue item and was right**:
`engine-leverage`'s body still read *NOW BLOCKING* on D64 while the queue file said
resolved, and the RFC's own open questions say *"before `accepted`"*. Both were claude's
errors — the first is the standing queue-vs-body failure, now caught three times, and the
second was accepting a draft its own text forbids accepting. Acceptance withdrawn in the
status line; four rulings go to the owner.

## 2026-08-15 (very late) — Act II exists; four rulings land; the ledger reaches nobody

**Ten middlegame packs** (`aee7c64`). Every middle act in the corpus was
`carlsbad-minority-attack`; it is now one of eleven, and nine of the ten structure
families in `design/04` §3 have a pack. Every number came from a live instrument run —
Lichess explorer at 1400/1600/1800, rapid+classical, 2023-01..2025-12; chessops censuses;
the shipped structural evaluator; one depth-22 engine walk — and all ten start-position
counts reproduced exactly on re-query. **The tempo layer has its first real use** after
being required by `04` §2d and used by 0 of 20 opening packs: four packs declare a window,
each replayed through `tempo.ts`, and **six declare no window with a measured reason**
rather than by omission. Census: `neverFiresInCorpus` 36 → 30, `inShapeDenominatorEmpty`
40 → 19, `unsatisfiable` still 0.

**The wave turned `make verify` red by being correct**, and refused to fix it — the right
call. `expression-census.test.ts` pinned `black-anchor-the-knight` at 0 firings; the wave
gave it a home and it now fires 7. **D47's class, re-found one instrument over.** Claude
rewrote the test to select subjects **by observation** rather than by name, asserting each
population non-empty so an empty corpus cannot vacuously pass. A content wave editing a
server test until its own output passes is the failure that pin exists to catch, and the
wave not doing it is the protocol working.

**Four owner rulings** (`4e19b95`):

1. **Explorer W/D/B splits are ADMISSIBLE as `corpus_observed`.** All four content authors
   had independently refused them under law 8 — which is *why* five packs carry
   `cost: unmeasurable` and four tempo budgets are authored numbers. Four independent
   refusals of admissible evidence is a boundary that was not written clearly enough, not
   four mistakes. It is written now: **the split may be stated; it may never be converted
   into a move verdict or a quality claim.**
2. **`tablebase_dtz_regression` lands at `byAtLeast` 3, disposition `unmeasured`**, with
   the experiment binding. 3 is *derived* — the first value provably off the tablebase's
   optimality boundary — not chosen.
3. **A node remembers the branch you SUBMIT.** `design/06` §5's premise was half wrong:
   *no resource refusal exists* is true, *no failure state exists* is false. The failure
   state ships one scope down — `ObjectiveState` has six values, three absorbing,
   `degraded` one-way by validator rule and sealed across node boundaries, and the
   intermediate/boss split is **a lint rule** (17 of 37 packs cannot end a run). The
   campaign needed a **scope, not a mechanism**, and one verb closes both holes.
4. **The engine-condition surface gets both homes** — a four-clause rung rule in `05`, a
   map row in `03` that defines nothing — with the rule **mirrored into `gates.md`** so
   the gate surface stays single. Claude flagged the split-gate risk in posing it; the
   owner took it knowingly, and the mirror is the price.

`engine-leverage` is accepted (Q1/Q9 ruled, Q3/Q7 closed on their stated fallbacks) and is
codex's. `format-surface` passed round 2 — the author **declined** the cross-review's §4.3
narrowing while accepting every one of its measurements, and inverted a fixture pair so the
decline is testable.

**The finding that outranks the rest, from chasing an owner question about the LLM.** The
evidence ledger and the run-time packet are **two disconnected worlds**. `content/` holds
**764 machine-validated records** — 391 `engine_eval`, 341 `tablebase_result`, 32
`position_legality` — every one provenance-carrying and digest-bound, and **none of it
reaches a learner**. `evidencePacket` never opens a pack's ledger; `classifyPhase(fen)` and
`structuralReading(fen)` take a FEN and nothing else, so the classifier and the structural
detector **cannot see the engine even in principle**. A run re-derives what the corpus
already proved. Ledgered **D118**, and it reframes the assistance work: the surfaces are
already wired (`VoiceScope` has six values, including the markers), so the gap is evidence,
not plumbing.

**Two claude corrections recorded as rows rather than edits** (D119, D120): the packet
carries **rung 3** as well (human-divergence markers from recorded Maia policy masses), and
the LLM reaches **six** surfaces, not one. Both errors *understated* what ships and would
have sent an implementer to rebuild an existing path.

**Process, twice in one night.** Ledger ids collided **twice** (D116, then D113–D119)
because `design/BACKLOG.md` has no reservation mechanism — ids are assigned by reading the
file, so a row committed between an agent's read and its write collides silently. Renumbered
to D117 and D121–D127. This is a real cost of running 3–4 agents at a time and will recur.

## 2026-08-15 — live-surface-honesty implemented

The live finishing pass shipped six independent assistance preference profiles without
widening the permission ceiling, exact member-versus-relayed vote attribution on both live
surfaces, and the server's full two-to-eight labelled option and 15–600 second window in the
host form. `ENGINES_REQUIRED=1 make verify` passed at 615 tests / 99 files; the zero-retry
browser gate passed 24 with the optional Maia measurement skipped. The browser gate caught one
stale `position` selector after the profile label became `Just Play`; it was corrected rather
than retried. D81, D82, and D83 are closed. Canonical behavior is in `docs/live-sessions.md`
and `docs/adaptive-guidance.md`.

## 2026-08-16 — R11 answered: the conjunction hypothesis is refuted, and the premise failed first

**Verdict: a conjunction of two census primitives does not beat either alone on R3's T/C/D
gate — it is worse on all three axes.** `design/research/conjunction-hypothesis.md`,
`tools/r11-conjunction-harness/`. Measured over **721 spine transitions from 47 packs** and
**19,099 legal alternatives** enumerated from the same parents, on the R3 harness's
`leaves.ts` **unmodified**, so every single-primitive number is R3's re-measured rather than
re-implemented.

Best single leaf:direction: **69.4%** precision, **12.64×** axis-D lift. Best of the 55
conjunctions: **35.7%**, **2.73×**. Only **7 of 55** pairs produce enough co-signalling
witnesses to measure discrimination at all; their **median lift is 0.66×** — worse than a
random quiet move — with 5 of 7 below 1.0×. **Zero conjunctions beat the best single key on
both axes, and zero of the seven beat even their own two components.**

**The finding is the arithmetic, not the ranking.** §4 of `campaign-effect-vocabulary.md`
assumed the conjunction multiplies rarity while informativeness is preserved. Given both
leaves fired, the two *signals* are near-independent (observed precision a median **1.18×**
the independence prediction), so **the false positives multiply at exactly the rate the
specificity does**. Firing is not independent either — median lift **1.136**, 20 of 55
coupled at ≥1.2×, max **5.26×** — because six leaves computed off one attack map are six
views of one object. Triples run the mechanism to its end: **38** ever co-signal anywhere,
the most frequent **6 times in 721**, and **none reaches 10**. A build of three or more
transition primitives is arithmetically empty, not underpowered.

**The `DESIGN-GAP:` is analytic and reaches furthest. A lens read BEFORE the move is
discrimination-inert by construction** — it takes the same value for the played move and for
every alternative from that position, so it can only choose *where the surface speaks*, never
*which move it distinguishes*. All three of §4's worked triples are pre-move conjunctions; so
are the shape library's 96 signed signatures and the boss-by-census mechanism. They are
**selectors**, which is useful and is not synergy. Across 161 such combinations precision
moves a median **+0.1 pp**, and the big gains (`slider_lines_changed:closed ∧ phase:endgame`,
+42.3 pp) are population effects with the within-position also-signalling share **unchanged**.

**The one positive arm was not part of the hypothesis and is about *when* the lens is read.**
Post-move lenses reach **8.77×** max, 25 of 72 beating their own leaf, and turn
`escape_squares_changed:gained` from 0.60× into **6.54×** when the child position has a
passed pawn. Median is still 0.79× and the counts are 12–30, so it is worth an instrument,
not a shipping decision.

**R3's headline holds. 88.7%** observation-level false positives (6.43 observations per ply,
0.73 clearing T∧C) against R3's 89.0%, with ρ(firing rate, FP rate) identical at **−0.143**,
across a corpus 25% larger and with a very different phase mix. **R3's limit 3 is
discharged**: the middlegame is now **105 transitions from 11 packs**, not 18 plies, and it is
the corpus's *least* false-positive phase (86.0%) — the census layer is at its best exactly
where R4 and R9 jointly proved no oracle exists, and still at 86%.

**Population, stated, per the standing attestation that the population decides the answer
before the instrument does.** The primary population is the 721 authored spine transitions —
curated good moves, and therefore the *generous* population for this hypothesis. It still
lost, and swapping to the 17,906 quiet legal alternatives removes its single precision winner
(1 of 51 → 0 of 55). A Maia-policy-weighted alternative population — R3's own limit 4, still
unbuilt — would **shrink** every lift in the dossier rather than grow it, because our
population weights every legal blunder equally and thereby deflates the alternative rate.

**What it changes.** `campaign-effect-vocabulary.md` §4's synergy claim moves from `[M]` to
`[V]`-refuted for the *emergent* half; authored synergy was never the claim under test and is
untouched. `roguelike-run-design.md` §3 rank 6 pre-named the consequence and it now applies:
**loadouts are additive, not synergistic** — do not ship synergy discovery, combination-payoff
unlocks, or any deck framing promising the value is in the intersection. The slot budget keeps
optimising for the smallest sufficient set (Into the Breach's shape), and it can only be
denominated in position lenses, never in transition primitives.

**Gate touched, not called.** `gates.md` K6 carries a second partial-evidence note: the route
out of generic explanation is not composition. The criterion is **not** fired — this is
evidence against one proposed remedy, and the authored deviation notes still discriminate by
construction.

**Ledger, D277–D286, all ten used** — the refutation, the pre-move-inertness rule, the
post-move arm, `last_of_role` at 12.64× as the sharpest primitive in the family, the empty
triple space, the discharged middlegame limit, per-move Maia policy mass as the successor
question, a second-direction confirmation of D257 (three harnesses re-derive "the corpus"
with three different regexes), the reusable method trap, and R11's own missing registration.

**Two process notes.** First, **R11 had no ledger row and no queue row** — the only question in
the campaign series with neither. It was born inside a dossier, and dossiers are not
registers; its statement had to be reconstructed from two sources that ask subtly different
questions, and §2b of the new dossier records the drift and names which reading was tested.
Now registered in `planning/campaign-research-queue.md`. Second, and worth more: **the first
run of the harness reported seven conjunctions with *infinite* discrimination**, caused by
keying pairs alphabetically on one population and by leaf order on the other. That is precisely
the shape of result R11 was hoping for. It is fixed, and the guard is now a rule — canonicalise
combination keys through one function, and never render an infinite ratio; substitute the
rule-of-three bound so a zero denominator prints as a bound and stays visibly suspicious.

## 2026-08-16 — coaching vs cheating, and the 1000→2000 curve

`design/research/coaching-versus-cheating-and-the-band-curve.md` landed against the owner's
two-part brief. Ledger block **D317–D326**; coverage-matrix row added; H5 carries a new scope
note (D324).

**The criterion.** Rung is refuted as the coaching/cheating line — the owner's own win
condition *requires* rung 5 authored counter-theory, and rung-0 all-on is the measured
unreadable state. **Timing is refuted as *sufficient* by the shipped code**: `feedbackDeliveryOpen`
re-closes the reveal window on `move.committed` (`feedback.ts:22-30`) precisely because
post-commit at move *n* is pre-commit for *n+1*, and `events.ts:154-159` already forces
bounded sessions onto authored boundaries and unbounded ones onto the closable window. What
survives is **distance from the answer** — `kind` · `fact` · `ranking` · `move`, read
syntactically off what an item says — giving **"cheating iff `distance === "move"` while a
committing decision still depends on it"**, with a second and separate failure mode
(coaching fails by volume, D78). It is orthogonal to `permittedAssistance` and to
`AssistanceConfig`, and it is **D113 arrived at from the honesty side**: the hint-distance idea
and the campaign's loadout currency are the same object.

**The obstacle is a shipped decision, not a gap.** `capabilities.ts` publishes 36 dispositions
whose recurring predicate is *recording vs grading*, and `bestmove / MultiPV rank / bestline`
is `refused` product-wide on the reason *"Move verdicts are not condition measurements"* — an
answer to whether it may **fire a condition**, used to refuse **display**. So the campaign
cannot hand a learner the move as a reward even after the game, and D113's ladder tops out at
exactly the refused value. That is the dossier's owner question (D318).

**The trajectory.** The product measures neither *played well* nor *run succeeded*; it measures
whether an authored or tablebase-decided objective survived the submitted path. Eight sites
compare a learner move to anything, one emits a verdict and it is an authored lookup; the only
computed learner judgement (`TempoVerdict`) has zero authored users; prediction grading was
deleted at schema 0.8→0.9 and replaced by a record nothing reads; no learner number exists
anywhere, refused in three lines of shipped copy. So *"2000 Elo skills"* is a claim about the
**encounter's configuration**, and the curve can be **declared but never adapted** — with a
named price already on record (ChessMonitor's manufactured FIDE-Elo estimate is its most-loved
number). The resolution is that **full suppression makes the claim true without measuring the
learner**, so the career curve is suppression rather than accumulation, running down the
distance axis at a flat slot count (D325).

**Two content findings that need an authoring decision either way.** The declared *learner*
band is continuous across 1000–2000 (42–58 packs per 100-point bin from 1400) while the
declared *opponent* band is a two-point step function — **30 packs ≤1394, three real packs in
the whole 400-point stretch 1400–1799, 39 at ≥1800**, with 1800 alone accounting for 36 of 45
real authored packs (D322). And the `plyHorizon` act ramp runs **11 → 8 → 24**, so `06` §5's
Act II is the shortest encounter in the corpus (D323).

**Escalations owed to the owner tier, none acted on here.** `06` §1's *"all nine are monotone"*
is wrong as stated — five are; `boardLighting` has a collapsed top and a broken floor, `spoken`
is not a chain, `voice` is substitutive, `arrows` is inert (D326). `permittedAssistance` never
reads its own `sessionKind` input, so the honesty ceiling is parameterised on role and
disclosure state only, although `05` §4 names run kind as one of its four varying axes (D321).
Both are ledger rows rather than design edits, per law 5.

**Good news carried:** the `SelfElo`/`OppoElo` regression that made R10's band range inert was
repaired the same evening at `0985fa4`, with a real-engine integration arm. The band lever
works; nothing has yet measured that it changes the **result** rather than the distribution,
which is now the campaign cluster's cheapest unrun experiment (D324).

## 2026-08-16 — Maia's WDL measured against R9's ground truth: a real signal, and not the oracle

The binding experiment registered in production code — `capabilities.ts:108`,
`{ capability: "per-move wdl", disposition: "unmeasured", experiment: "D87 compare Maia
WDL with R9 ground truth" }` — has been run. It landed as
`design/research/maia-wdl-versus-human-outcome.md` with
`tools/maia-wdl-agreement-harness/`. 1,475 Maia probes and 279 Stockfish depth-12 probes,
against **R9's committed explorer readings reused unchanged** rather than a fresh pull, so
the two dossiers are literally commensurable and no second explorer client exists.

**D236 is confirmed and upgraded.** The WDL sums to 1000 not as an observation over one
run but **by construction** — `_probabilities_to_permille` distributes a largest-remainder
rounding over a softmax (`uci.py:186-193`), verified on 27,330 of 27,330 candidate rows.
The same read settles two things nobody had: `cp_from_wdl` is `win − loss`, so **`score
cp` and `wdl` are one output** and expected score is exactly `0.5 + cp/2000`; and the
frame is the root side to move, taken from `invert_wdl` rather than inferred from
agreement, which would have been circular.

**The verdict is split and the split is the finding.** On the population as a whole —
5,379 human-decided move pairs — Maia's WDL orders them at **72.2%** against explorer play
counts at **76.8%** and Stockfish depth 12 at **84.2%**, with a 50% floor and a **94–99%**
ceiling measured as the ground truth's own cross-band reproducibility. By the null this
dossier preregistered (*beat what is already on the wire*, not *beat chance*) that is a
refusal. **But splitting the population by the ratio of the two moves' play counts inverts
it**: where the counts are within 2× — the half where popularity cannot answer — the WDL
holds **65.1%** while the counts collapse to **54.7%**, and **Maia's own policy head goes
to 34.4%**, significantly *worse* than chance, tightening to 24.9% at a 1.25× ratio. That
is `design/05` rung 4's *popularity is not quality* appearing as a measured inversion
rather than a caution, and it is a live warning for every policy-mass object we ship,
`humanConcessionMass` included.

**It does not reach past ply 20, and the control is what makes that decisive.** Pooled
agreement decays monotonically **81.2 → 75.3 → 68.8 → 61.2 → 47.9%** by ply bucket, the
last being indistinguishable from a coin. If deep pairs were merely noisier every
instrument would decay together — **Stockfish over the identical pairs is flat, 84.8% at
ply 0–3 and 87.7% at 16–19.** What crosses the wall is availability: `wdl` is emitted on
100% of rows at ply 40+ and its within-position spread *grows* from 10.3 pp to 35.9 pp, an
instrument that never abstains and speaks more emphatically the further it gets from any
check. **So `design/06` §2a is unchanged — the middlegame stays authored — and it is now a
measured position rather than an inherited one.** The one live candidate for a fourth
difficulty-availability tier has been tested and did not qualify.

**No `gates.md` change, stated so the absence is auditable.** The evidence touches no
hypothesis, no kill criterion and no continuation gate. What it does touch is the
engine-condition rule mirrored there — clause 3's *binding experiment* — and that rule's
normative text is owner tier (`design/05` §2), so the outcome is recorded here and in the
ledger rather than written into a mirror. Related: it is evidence about **D324** (*the
band moves the distribution; nothing has measured that it moves the result*) from the
outcome side — Maia's band-to-band movement correlates with the human population's at
**Pearson 0.021–0.044, sign agreement 47–52%**, against a real human movement of 1.2–2.2 pp
after sampling noise is subtracted. It does not settle D324, whose arm measures played
games, but it points.

**Two corrections to our own records, both in the safe direction.** The audit's *"explorer
per-move split is fetched and discarded at parse time"* is **stale at HEAD** —
`parseCorpusResponse` keeps it and `corpus-sentences.ts:16-20` renders it, closed by
`engine-leverage`. And the audit's *"WDL spreads 0.191 median expected score"* reads the
whole MultiPV-20 list; on the moves humans play often enough to measure the spread is
**4.9 pp against the human 9.2 pp** — Maia is under-dispersed by half, not over-confident.

Also confirmed live: the Maia command order repaired by `0985fa4` does apply the requested
band (**5,466/5,466** candidate rows identical to an `Elo`-only request), so the primary
arm is the shipped instrument.

**Process finding worth keeping (D294).** The reason this question was answerable at all
is that someone put the experiment in a string in production code, next to the capability
it gated. Three other `unmeasured` capabilities carry named experiments; this is the first
one discharged, and it came back a refusal — which is the field working. Ledgered
**D287–D294**; D295–D296 unspent. The register-row flip is code and belongs to work
cluster B.

## 2026-08-16 — Mechanics × modes: there are not four modes, and the half-integrations moved one layer down

**Landed:** `design/research/mechanics-by-mode.md` (coverage-matrix row added), ledger rows
**D307–D316**, an evidence note under the Lucas-Chess watch item in `gates.md`. Owner brief:
*"making sure we have all the right breadth in mechanics and they're not implemented
half-assed, but fully integrated for the drills vs just play vs coaching/streaming/teaching vs
campaign."*

**The framing was wrong, and finding that out is the result.** The product does not have four
modes with four mechanic sets. `DrillScreen` is mounted at **exactly one place**
(`App.svelte:574`), and driving the real client shows a pack drill and a Just Play game
presenting the **same 18 and 19 controls**, differing only by an inert ambient glyph. Live
**never creates a run** — it wraps one, adds session controls, and neither of its surfaces
renders any authored vocabulary; `session.kind` has four server comparisons of which two are
creation-time guards, and **`academy` — the mode the owner calls *coaching/teaching* — has zero
behavioural consumers anywhere in the code**. Campaign is 0 hits outside disposable harnesses.
So the half-integrations are not *inside* the modes: they are at the **entries** (what a mode may
declare when it starts), in the **content** that fills the shared panels, and in a handful of
**controls that exist on one surface and not the other**. Thirteen are ranked by cost × value.

**Owner check 1 — *"configurable as to what is exposed"*: the config is mode-aware in its
addressing and not in its content.** `permittedAssistance` takes `sessionKind` and **never reads
it** (`assistance.ts:27-30`), so pack, position and imported runs receive byte-identical
permissions — there is no lever to make Just Play more permissive than a curated drill *even if
the owner rules that it should be*, which is what `design/05` §4 asks for. And `loadAssistance`
returns `SILENT_ASSISTANCE` for **all six** profiles, so §3-forms' *"each gets its own defaults"*
is unimplemented: six profiles buy six empty localStorage slots the learner fills by hand, six
times (D307). Two of nine axes drive nothing — `arrows` is typed, migrated, validated,
*permissioned* and read by no renderer (already ledgered, and owned by the accepted
`board-annotation`), and `ambient` is a `<button>` with no `onclick`. **No single surface
configures all nine**: six in `/settings`, six in-run, three overlapping, and the config is read
once at `onMount` (D311). The hard consequence: **`api.reveal` has no call site in the run
screen**, so under the triple-fenced `attempt_end` policy **rungs 3, 4 and 6 are structurally
unreachable during a Just Play game**. The owner's *"gives the FULL toolkit"* is, as shipped,
rung 0 plus a permanently disabled panel until the game ends — and the fix is one button
(D308). It is the highest cost:value item in the audit.

**Owner check 2 — *"it steers you by classifying openings, strategies, endgames"*: aspirational,
with one real exception.** All four non-test consumers of `classifyPhase`, `structuralReading`,
`endgameReading`, `shapeFirings` and `pivotalMarkers` are **renderers**. Nothing selects an
opponent, a band, a position, an objective, a pack, a next node or an assistance rung from a
classification. `shapeRecommendations` ranks shapes you met in your own preserved runs, emits a
`packIds` list — and the client's entry point is `navigate("/play")`, dropping the learner on an
unfiltered grid to find the pack by eye. `PackList` has **0** filters against `03:70-72`'s
*"first-class navigation and filters"*, and `/learn` names the three phases **0** times. The one
genuine steer is **repertoire gap finding**, which really does turn corpus classification into
the position you play next — and even it exposes only the top-ranked gap while the server accepts
any, and its write-back verb has zero client callers, so scanning never converges (D316).

**Guided mode is inverted, and this one contradicts a design section in code.** The mechanism
`05` §3b specifies — the shape library rendered live — **already ships ungated in every mode**
via timeline shape markers, printing §3b's own sentence verbatim; a position run even loads the
**full 25-entry catalogue** where a pack loads only its declared subset. What the switch labelled
*"Named-pattern guidance"* gates is a strictly **smaller duplicate** inside the pivotal-marker
modal that additionally needs an unrelated switch on. So §3a's silence default is violated in
code, and the band-shaping and fading §3b requires have no implementation surface at all (D309).
Related: that same modal is the **only** client call site of `renderEndgameReading`, so B10's
*"endgame steering names a technique"* is reachable only when an unrelated forward detector has
fired (D310).

**Blocked / owed to the owner tier — three `DESIGN-GAP:` flags, none acted on here per law 5.**
(1) `05` §4 and §3-forms require assistance to vary by context and nothing in the code can express
that. (2) **`03:35-39` promises pack-free theory recognition and no document anywhere states why
it is absent** — every export in `line.ts` takes a `DrillPackDefinition`, `compare.ts:300` sets
`theory: null` without one, and the renderer says *"the pack"* in all three sentences. That is the
largest promise/behaviour gap in the product, and it is a `Q4c` research question before it is an
RFC. (3) `05` §3b specifies guided mode as a chosen mode and it ships on by default.

**Concurrent-work note.** The `D317–D326` job (coaching-vs-cheating / the 1000→2000 trajectory) was
in flight against the same code and independently found the `permittedAssistance` `sessionKind`
gap; its log entry names it D321 while this pass carries it inside D307. Two ids for one fact is
the cost of parallel blocks and is recorded here rather than reconciled unilaterally — whichever
lands second should point at the first.

**Method honesty, because the rule is that counts are run.** A first pass reported *"10 authored
packs are silently not served"*; that was a **stale server process from another agent's session**
still bound to the probe port, and the finding is **withdrawn** in the dossier. Re-measured on a
fresh build and a free port: 0 unserved. Eleven prior figures were corrected in the same pass,
including `03:95` overstating the `MATCH_LIVE` refusal list by one verb (compare is *not*
refused), `03:299` being stale (narrative mode ships), `variantOf` now used by two packs, and
`0 of 20` opening timing windows **still exactly 0** — the four windows added this week are all
middlegame, so the `04` §2d gap is untouched.

**Next.** The three cheapest fixes are an afternoon each and unblock the most: a reveal control
in the run screen, a per-profile default table, and a `tablebase:` branch in
`evidence-sentences.ts` — which is the *actual* residual behind B4's Syzygy row, since the other
Syzygy path already ships and is pressable.

## 2026-08-16 — Time as a difficulty lever: the clock clears doctrine and fails measurement

**Landed.** `design/research/time-as-a-difficulty-lever.md` (D330/D331, block **D355–D364**, all ten
used) and the disposable `tools/d355-reading-cost-harness/`. The owner asked *"what if we want to
simulate the time pressure of a GREAT move during 10+0 chess and then give actual time?"*, and D331
was the reason it mattered: time would be the first lever that constrains **the learner** rather
than the product, and it was hypothesised to interlock with the coaching/cheating criterion —
*a hint you do not have time to read is not a hint*, so time pressure would degrade assistance
preferentially near the answer without withholding anything.

**The doctrinal obstacle clears, and the discriminator is mechanical.** `06` §5 refuses *"a pursuit
clock is a retry price by another name"*. Tested against §2c's own criterion — only *how often* you
retry conflicts with `00` §76 — a **run-pooled** clock is exactly the refused object (a rewind budget
with a real-valued counter), and an **attempt-scoped** clock that resets at the fork is not. The
shipped placeholder already picked the safe altitude: `clockState` is declared on **`Node`**
(`types.ts:111`; schema `:265`) and written only from `CommitMoveOptions` (`runtime.ts:57,341`), so a
clock built on the reserved field rewinds with the board automatically and **the refused version
needs a new run-level field**. The ruling is checkable in a diff rather than in prose.

**The hypothesis is refuted, and not narrowly.** Over **43,272 rendered items** from the shipped
renderers (47 packs / 721 transitions / 609 positions, 25 shape entries, 43 real cached explorer
responses, 105 recorded Maia candidate counts): variance in log(words) explained by **distance class**
is **η² = 0.201** over four classes and **0.038** over the three the product may ship, against
**η² = 0.984** for *which renderer printed it*; ρ(distance rank, words) = **−0.046** over all items
and **+0.125** excluding `move`. Reading cost is renderer verbosity, not distance from the answer —
`kind` spans 6 words (phase reading) to 298 (shape panel), `ranking` spans 12 to 230. **And the
ordering inverts where it matters: `move` is the cheapest class the product could ever print**
(median 1 word / 0.3 s against `ranking`'s 63 / 15.9 s), so a clock is a gradient *toward* the
answer. That interlocks with the still-open D317–D326 owner question: under its option (c), where
`move` becomes purchasable pre-commit, a clock is a cheating amplifier.

**The arithmetic delivered the one durable thing.** 600 s over a 40-move reference game — Lichess's
own `initial + 40 × increment` convention, so the denominator is the platform's — is **15.0 s per
learner move**, or **60 words at 238 wpm** (Brysbaert 2019). The all-on rung-0 reading at **one** node
is a median **978 words / 247 s: 16.4× the whole budget**, and reading it at two of a median
encounter's five nodes costs **82% of the entire 600-second game**. What fits is **≈6.6 `fact` items
or 0.94 `ranking` items** — the slot number D78 licensed and never supplied, reached independently of
D78 and **without any clock existing**. The campaign's chosen five-slot loadout costs 45 words / 11.3 s.

**Changed.** Ten ledger rows (D355–D364); the id-block registry line; one coverage-matrix row. The
owner's sentence turns out to read most naturally as a **depicted** clock (*"and then give actual
time"*), which touches no invariant and is one retained field away: `parsePgnMainline` keeps headers
whole (`pgn-import.ts:63`) but drops the per-move `[%clk]` comments at `:54`.

**Blocked / owed to the owner tier — one `DESIGN-GAP:`, not acted on here per law 5.** `06` §5 needs
two amendments: the refused list is one word too broad (the run-pooled clock is the refused object,
not every clock), and *"what escalates is LEGIBILITY, not power"* has no slot for a third kind of
escalation that shrinks the **learner's** capacity while changing neither what the opponent can do
nor what the product will say. The owner question is D364: is time **nothing** (close the cluster,
delete the reserved field, bank the ≈6-item loadout), **a decoration** (the depicted clock —
recommended, cheapest), or **a rule** (the enforced attempt-scoped clock — admissible, but a
run-pooled budget must be refused *in the same ruling*, because the difference is one field's
altitude and nothing today would catch it).

**Three bugs found on the way, all cheap.** `clock_zeroed` ships a renderer sentence
(`transition-sentences.ts:9`) that `irreversibility()` can never produce — **0 firings in 721
transitions** — so the only clock-named renderable string in the product is dead code (D360).
`clockState` has six non-test references, all passthrough, no client sender, no reader, and
`additionalProperties: true`, so the run log will today accept and persist an arbitrary object per
node inside *"the sole source of chess truth"* (D361). And **D78's headline moved**: the all-on state
is a median **78** observations per position on the 47-pack corpus against Q8's 58, while the mean
moved only 57.90 → 62.46 — a bimodal-by-phase distribution whose median sits in the gap (endgame 256
words / 65 s, middlegame 1,199 / 302 s), so the per-phase figures should replace the single median
wherever it is cited (D359).

**Next.** D364 is an owner ruling and it should not be taken before the D317–D326 hint-ladder ruling,
because option (c) there flips the sign of the clock's effect. If (b) is chosen, the work is one
retained field in `pgn-import.ts` plus a renderer and an abstention path (F6). If (a), the deletion
of `clockState` and the two `06` §5 amendments land together.

## 2026-08-16 — Board annotation closes two legs of the arrows ruling

**Landed.** `board-annotation` implements learner-drawn circles and arrows as principal-scoped
sibling-table state, not run evidence. Marks may follow a transposition-keyed position or a
branch visit, can be re-scoped atomically, survive the deliberate board remount and page reload,
export through chessops' `%csl`/`%cal` codec, and relay from the active lease-holder to live viewers
with attribution outside matches. PGN export is own-only and states that constant filter without
measuring another author's marks.

**Isolation and corrections.** `DrillRun`, its event union, grading and evidence packets remain
unchanged; a runtime census and a route-level voice test pin that boundary. Review reconciled D187
into this lifecycle rather than treating parent-owned board state as a prerequisite. Closeout then
caught a real debounce race: a quick move could make a delayed save read the child node. The save
now captures node, branch and scope at gesture time, and parent state updates immediately. Re-scope
also refuses any merge beyond the 64-mark scope bound.

**Verified.** `ENGINES_REQUIRED=1 make verify` passed with 682 tests across 106 files, Svelte 0/0,
schema, scaffold and packaging clean. `make test-browser` passed 24 tests at zero retries; the
optional Maia latency test skipped. D159, D186, D187, D218 and D249 are closed. D158 remains partial:
learner and attributed-human marks ship; system-drawn directed marks still have no honest producer.

## 2026-08-16 — Format surface makes trajectory resistance leg-aware

**Landed.** Pack schema 0.25 adds narrowed per-leg `opponentPolicy` and pack-subset
`shapes`, backed by active-leg resolution on ordinary play, groups, corpus/human-split
context, and the derived resistance projection. The schema package now exports a versioned
`FORMAT_DISPOSITIONS` register; deployment capabilities deliberately do not.

**Honesty fixes.** Practical resistance can no longer record its own name after choosing
alphabetically: partial zero measurement and total abstention are separate typed refusals.
Every `retryVariants` entry carries a pointed non-executable warning, and the dead simulation
budget code is retired. The owner-ruling review kept the nine-axis arrows setting intact and
classified its missing system producer as `unmeasured` rather than deleting it.

**Verified.** `ENGINES_REQUIRED=1 make verify` passed with 688 tests across 107 files,
Svelte 0/0, schema, scaffold and packaging clean. `make test-browser` passed 24 tests at
zero retries; the optional Maia latency test skipped. D57, D85 and D86 close; D84 stays open
as a named measurement gap, and D96 stays partially open only for its bundled
`deviation.planClassId` residue.

## 2026-08-16 — Maia in the endgame: club-player-wrong, and band-blind

**Landed.** `design/research/maia-endgame-fidelity.md` — 1,095 probes, 0 errors, 507
tablebase-probed positions from 11 of the 14 endgame packs, run at the **0.7/0.9**
temperature those packs actually declare rather than the code default. The owner's
question was whether the endgame is where humans and agents diverge most; the
answer splits, and the split is the finding.

**Human-shaped, decisively.** 84 errors across 810 probes, and they land on **6 of 45
positions and 5 distinct moves** — the same move on every repeat. Modal error share
inside a (position, band) cell is **0.95–1.00** against **0.58–0.64** if the erring
move were uniform over the same dropping moves. **All 84 are `win→draw`; zero
`win→loss`, zero `draw→loss`**, where a uniform-random legal move concedes the whole
point on 10.7% of winning and 27.6% of drawn roots. The exemplar: in
`8/3k4/8/8/5K2/8/4P3/8 w` exactly one of ten legal moves throws the win — the pawn
push — and Maia plays it **13 of 18** times against a uniform 10%. And
`argmax(policy)` preserves at the identical rate, so **the errors are the model's
belief, not the unseeded sampler's tail**; lowering temperature would not remove
them.

**Band-blind.** 88.1 / 88.9 / 91.9% at 1100 / 1500 / 1900, **tied on 43 of 45
positions** (sign p = 0.5). Band application was verified per probe against the
D58/D91 confound — 810/810 sent `Elo` after the `SelfElo`/`OppoElo` defaults, and
45/45 positions produced three distinct policy vectors. The dial reaches the model
and moves dropping-mass on 30 of 40 non-tied positions (p = 0.0022) by a mean **4.3
pp** — real, and far too small to change the move played.

**So the mode is sound and the declared band is the fiction.** Twelve packs span
`targetElo` 1150–1900 and none of that span is observable in an endgame (D369).

**Three by-products.** Only **5.1%** of positions on Maia's side of a pack are
decisions at all, against 76.4% on the learner's — twelve packs seat it on an
already-decided side, so its real job is **resistance**, at which it is measurably
good (slowest-losing move 61–69% vs 23% for chance) and which no mode contract
declares or guards (D370). `perfect_tablebase` in a **drawn** root has no DTZ term
and degenerates to lexicographic UCI order (D371). And a correction to claude's
framing: `practical_resistance` is **not** broken — that tolerance defect closed on
2026-08-15 — so it is a live candidate wherever the endgame is decided.

**Method note worth keeping.** Five operationalisations were written into the harness
*before* the run, two exploratory ones added afterwards and disclosed as such, and one
(mechanical "plan conservation") **failed to discriminate and is reported as a
negative**. The judgment word — calling these "the textbook club-player error" — is
flagged inline as judgment; the measurement stands without it.

## 2026-08-16 — Claim backing implemented and archived

Pack schema 0.26 makes authored claim debt payable without rewriting the author's sentence.
Evidence ledgers may now carry claim-id plus text-digest bindings to a closed assertion registry;
direct evidence support for prose is refused across every prose pointer; explorer attachment writes
evidence and bindings while leaving the pack byte-identical. The first real binding backs
`philidor-third-rank-hold/philidor-is-drawn` from its existing tablebase records.

The authored side is explicit rather than disguised as machine evidence: 82 `author_principle`
claims now resolve to 12 used official principle entries, each with provenance and a counter-case.
The largest entry covers 13 claims (15.9%), below the one-third concentration tripwire. D97, D98,
D112, D129, D130, D132–D134, D136, D163–D166, D169, D170, and D172 close. Missing legal-move
censuses, ledgerless packs, unmeasured claims, rendering work owned by `feedback-delivery`, and the
provenance-note vocabulary remain open by name; implementing the mechanism did not manufacture
their evidence.

Final verification: `ENGINES_REQUIRED=1 make verify` passed 695 tests across 109 files with schema
and packaging clean; `make test-browser` passed 24 tests at zero retries, with the optional Maia
measurement skipped. The first unit-gate run exposed one legacy census fixture using the forbidden
direct-prose pointer; replacing it with a real claim binding made the instrument agree with the new
contract.
---

## 2026-08-16 — D333/D324: the band moves the RESULT, at about a third of its own units

**Landed.** `design/research/maia-band-outcome-transfer.md` and
`tools/d333-band-outcome-harness/` (disposable, exploration gate). **16,660 complete games /
1,049,001 Maia forward passes**, 12 arms, band against band, on a 170-position book cut from
the committed pack corpus — paired openings with colours swapped inside every pair, SEs
clustered on the opening, **no engine adjudication of any kind**, 0 voids and 0 ply-cap
terminations in the whole run. 2 h 16 min on 13 pinned single-thread workers.

**The answer is yes, and the number is the transfer ratio.** Every band gap separates, down
to 100 points: 1000v2400 **−289.6 Elo**, 1000v2000 **−260.7**, 1500v1800 **−69.8**,
1500v1600 **−22.1** (p 7.7e-06), 1900v2000 **−26.9** — against a same-band control at
**0.4956 [0.475, 0.517] p = 0.68** and a Temperature positive control at **+468 Elo**.
**D324's pre-registered ladder passes exactly as written** (0.3069 / 0.4990 / 0.6304 /
0.7652 vs a fixed band-1400 reference, monotone, all adjacent CIs disjoint). **H5's
2026-08-16 scope note is therefore confirmed: the requested band is a difficulty lever and
not only a policy lever.** `gates.md` updated.

**And the pass settles the wrong question, which is the finding worth carrying.** *Monotone
with non-overlapping CIs* is a test of **order** — and R10 had already shown the
distribution is ordered. The campaign needed **scale**. The scale is **0.289 [0.269, 0.309]
Elo per band point over the corpus and 0.400 [0.379, 0.421] at full material**: 100 band
points buy **29–40 real Elo, not 100**. Any dial with a positive ratio passes D324's
criterion at sufficient n; this one would have passed at 0.05.

**What that does to D332.** The denominator survives and its units do not. The stated
1000→2000 journey is worth **260.7 Elo [233.3, 291.0]**; the whole usable `[1000, 2400]` is
**289.6**; the most favourable cut available — the full-material ladder from band 1000 to
2200 — is **479.8 [454.9, 504.7]**. The coverage requirement was derived before the run
from D332's own journey over R10's own range (ratio ≥ 1000/1400 = **0.714**), and the
corpus-wide figure reaches 29% of it, the best case 56%. **A learner Elo against Maia bands
is a real measurement on a ~290–480-point axis, not a 1000-point one.** And a **100-band
step is real but not a rung**: 22.1 and 26.9 Elo against a ±60 threshold derived from the
SE of a learner's own 30-game session, so the usable step is **≈150–208 band points** and
the range is five to nine rungs, not fourteen.

**Two edges where the dial stops.** 2000→2400 buys **+28.9 Elo, CI [−16.7, 74.5],
p = 0.21** — R10's bound is on where the band still *reaches* the model, not where it still
*buys difficulty*. And **material, not the declared phase, is what attenuates it**: the
widest gap is worth **−468.9 Elo at ≥21 pieces, −145.5 at 11–20, −72.4 at ≤10**, and a
100-band step is **−28.7/−37.2** at full material with CIs excluding parity against
**−10.1/−4.0** below ten pieces with CIs straddling it. Every low-material pack setting
`human_common` + `targetElo` is turning a dial worth ~7 Elo per 100 points and nothing warns
the author.

**The methodological by-product is bigger than it looks, and it nearly ate the study.**
`maia3-uci` calls `seed_everything(cfg.seed)` at process start with **`--seed` defaulting to
42**, and the shipped ENTRYPOINT passes none — so every Maia sidecar this product has ever
started ran at seed 42, and **two fresh sidecars given the same requests return
byte-identical moves**. The first run of this harness, unseeded across twelve workers,
produced **611 of 611 mirrored pairs with byte-identical move lists**, a 50.8% duplicate
rate, and a same-band control reporting **exactly 0.500 with a standard error of exactly
0.0** — the most confident possible wrong answer, from the one arm whose job was to catch
exactly that. Fixed with a distinct `--seed` per worker and an odd worker count; the whole
run was then re-done from scratch. **This also corrects a reading of R5**: `human_common` is
reproducible **by process replay**, which `rfc/archive/resistance-spectrum.md` open question
1 never costed. R5's mechanism description was right; its conclusion was one step too broad.

**Changed.** Ten ledger rows (D335–D344) and the id-block registry line; D333 ✅, D324 ✅
(passed, framing superseded), D291 ✅ (its WDL half stands and its outcome half is now
measured); one coverage-matrix row; `work-register` §5; `gates.md` H5 (confirmed) and K5
(explicitly *not* touched, recorded so the pass is not misread).

**Blocked / owed to the owner tier — one `DESIGN-GAP:`, not acted on here per law 5.**
`design/06-campaign.md` §2b states the usable band as `[1000, 2400]` and builds the
phase-boss ladder on it with no magnitude. The magnitude now exists — ≈0.40 Elo per band
point at full material, ≈0.29 over the corpus, ≈0.07 below ten pieces — and §2b's endgame
boss being `perfect_tablebase` means the doc is not contradicted, only under-specified. The
owner questions are **D337** (which of the three exits for the 1000→2000 journey) and
**D336** (fix the campaign's rung size at ~150–300 band points).

**Next.** D344 is the one thing that should not wait: whatever implements D332/D365 must
take a **calibrated** opponent rating, stored separately from `targetElo`, because a Glicko
RD narrows on volume rather than validity and will not catch a mis-specified opponent. The
cheap follow-on is D339's lint — warn when a pack's start position is below ~15 pieces and
its `opponentPolicy` is `human_common` with a `targetElo`.

**Not run, and named so it is not assumed.** Nothing here measures a *human* against a band.
The whole study is engine-vs-engine, which is what makes it law-8-clean, and the step from
"band 1800 beats band 1500 by 70 Elo" to "a 1500-rated human would too" has no evidence in
this repo.

## 2026-08-16 — Pack graduation implemented

Pack schema 0.27 replaces free-text graduation blockers with stable, typed `blocking`,
`resolved`, and cited `accepted` conditions. Provenance is closed over its five attested legacy
keys; inline evidence stays sidecar-only. All emitters now produce the typed shape.

The landing report re-derived 56 draft documents (220 blocking / 30 resolved / 43 accepted),
36 candidate documents (143 blocking), zero legacy entries, and zero graduable packs. Candidates
remain schema subjects and are explicitly not graduation subjects. The accepted-condition page is
committed and byte-pinned; the report prints each root separately and no misleading merged blocker
total.

The publication boundary is executable before its first subject: official packs are checked at
strict sourcing severity, draft failures are ratcheted at 18, real-pack promotion is tested with a
published flip plus digest restamp, and duplicate ids across draft/published roots refuse. Every
hardcoded real-pack test path now resolves across both roots.

Verification: `ENGINES_REQUIRED=1 make verify` passed 700 tests across 110 files with schema and
packaging clean; `make test-browser` passed 25 tests at zero retries. No authored pack was promoted.

## 2026-08-16 — Evidence at runtime implemented

The runtime now retains the admissible part of every digest-current pack ledger instead of
discarding it after grounding. Thirty-two packs supply 732 position-keyed readings (391
Stockfish and 341 Syzygy) across 731 per-pack entries and 568 corpus-distinct positions.
The projection is server-local, multi-valued, allow-listed, and network-free; pack wire
projections remain unchanged.

Readings use the existing run-level guidance barrier. Live same-kind evidence wins, Syzygy
halfmove clocks must match, and neither absence nor a cross-node comparison is rendered.
External voice and reasoning providers receive no recorded-reading bytes: their sentence
packet is unchanged and the server appends frozen attributed prose only after rendering.

The coverage limit is now executable rather than implied. Across 497 authored spine
positions, 11,559 legal moves produce 11,464 per-pack-distinct one-ply successors; 10,765
(93.90%) have no recorded reading. Of 372 arrivals at a tablebase-indexed key, 43 are refused
for a different halfmove clock. This closes D118 and the mechanical half of D116 while leaving
rung-4 packet evidence explicitly open under D147.

Verification: `ENGINES_REQUIRED=1 make verify` passed 712 tests across 113 files with Svelte
0 errors / 0 warnings and schema/packaging clean; `make test-browser` passed 24 tests at zero
retries with the optional Maia test skipped. The lifecycle is archived in
`rfc/archive/evidence-at-runtime.md` and `planning/archive/evidence-at-runtime/`.

## 2026-08-16 — Band-flattery surface defects closed

Five schema-neutral defects from the self-surface audit are closed. The shared voice guard now
rejects evidence-absent praise as well as criticism, and pack validation consumes that same
vocabulary instead of maintaining a duplicate. `HonestControl` reasons are visible rather than
screen-reader-only. Human-model splits can be requested directly from the Assistance panel without
enabling or opening pivotal markers; Settings now exposes all nine assistance axes. The grounded
comparison narrative remains opt-in but is placed before the engine-evaluation dashboard.

The on-ramp emitter and all 24 reachable candidate packs no longer claim an opponent near a learner
rating the product does not have; they now ask the learner to play on and compare the consequence.
D393, D394, D396, D397, and D398 are closed.

Verification: `ENGINES_REQUIRED=1 make verify` passed 714 tests across 113 files with Svelte
0 errors / 0 warnings and schema/packaging clean; `make test-browser` passed 24 tests at zero
retries with the optional Maia test skipped. The browser gate explicitly observes an unavailable
control's reason as visible.

`rfc/opponent-contracts.md` was not started: its queue entry says accepted, while its governing
body still says `draft` and leaves owner-facing open question 2 unresolved. That question chooses
between the digest tiebreak and retaining the measured lexicographic bias, so it changes code and
cannot be inferred from the queue banner.

## 2026-08-16 — D401 verified: the contradiction was a column misread, and the flip had already run

**Retraction, and it goes on the permanent record because two ledger rows and a
commit message carried the false claim.** D400 reported that `claim-backing`'s log
entry — *"D97, D98, D112, D129, D130, D132–D134, D136, D163–D166, D169, D170, and
D172 close"* — was contradicted by the ledger, and D401 stated it as *"zero of
those fifteen read ✅."* **That is false, and the log side was the correct one.**

All sixteen read ✅ in **column 1** of `design/BACKLOG.md`, and have since
`3b16127`. The 🔨/💡 glyphs were read out of **column 3, the disposition note**,
where fourteen still carried *"🔨 fixed in `rfc/archive/claim-backing.md` …"* and
two — D97 and D112 — still read *"💡 open"* beside a ✅ status. **The rows disagreed
with themselves; the log never disagreed with the ledger.**

**Why it was invisible, and this is the finding.** The flip ran in `3b16127`,
**69 seconds before** the implementing commit `5a63225`, under the subject *"law:
content waves get the same closeout as RFCs; D367 and D372 closed"* — which names
none of the sixteen. **Eighteen status characters flipped; two named.** A
reverse-trace keyed on the implementing and archiving commits therefore finds
nothing, which is exactly what happened — twice, to two separate passes.
`5b65048` is a pure path rewrite because there was nothing left to flip.

**Two further D400 statements are withdrawn on measurement, and they invert its
conclusion.** `pack-graduation` did **not** flip 13 rows: `db243f5` and `b6b5d9a`
changed **zero** status characters, and D203–D212, D237–D246, D138, D141 and D162
are all still unverified — **it is the worse case, not the counterexample**.
`evidence-at-runtime` flipped **two** rows, not four, and is the batch's only
clean instance. So the cluster's real remainder belongs to `pack-graduation`
(D418), and `claim-backing` — the RFC both passes accused — is the one that did
it right.

**All sixteen observables were re-derived against the shipped tree; fifteen are
closed.** The prose-preserving attach path exists and never writes `pack.json`;
prose pointers raise `EVIDENCE_OVERREACH` with no template exemption;
`$defs/feedbackClaim` is closed; the residual sweep sees word and numeric
ordinals including hyphenated compounds; the authored-span fence narrows to
`author_principle` alone. D170's migration reproduces **exactly** — 82
`author_principle` claims across 35 pack files resolving to 12 entries, largest
15.9%.

**One is changed, and it is a live hole (D417).** D166 claims a rate is refused
inside an author-attributed segment. The shipped guard is decimal-only:
*"f5 scores 90.9% for White"* raises `CLAIM_READING_UNATTRIBUTED`; ***"f5 scores
91% for White"* raises nothing.** The one refusal the routing must not lift is
lifted by dropping a decimal point.

**The protocol finding (D416): this is not a slip, it is a lane split.** Across
the last 25 commits the division is perfectly clean — every `feat:`/`fix:` commit
is untrailered (the implementer's lane), every `ledger:`/`rfc:`/`research:`
commit carries the session trailer (claude's). The completion protocol says the
flip rides *"in the same commit"* — **a sentence only one agent can satisfy.**
The cheap fix, in the same spirit as the log clause the protocol already carries:
**require the closeout commit to name the rows it flips.** One line would have
turned this investigation into a `git log --grep`.

**And a reading rule (D419): the disposition column is not a status.** Three
readers in two days took it for one, and two of them wrote false rows into the
ledger as a result.

## 2026-08-16 — four owner rulings, and a correction to how claude asks

**The correction first, because it changed one of the answers.** Teacher mode was
put to the owner as three options: ship without the Maia split and corpus rungs,
defer with a stated trigger, or hide the absent rungs. The owner: *"why do you not
give option: add them and ship, no deferral… literally covered all options except
**implement properly**."*

That is the **second** time in this session. The C6 fork in `feedback-delivery`
had the same shape — three ways to present an unbacked claim, when what was
missing was the attach path, which `claim-backing` then supplied and the fork
dissolved. **The pattern: claude measures a gap, silently reclassifies it as a
constraint, and asks the owner to choose a way to live with it.** Ledgered as a
process defect with a concrete rule — every fork put to the owner must include
removing the constraint, or state in the prompt why removing it is impossible.

**1. Teacher mode ships complete.** Build the human-model split and the corpus
rungs into the teacher surface. No degraded first version. `teacher-surface` is
cross-reviewed and ready on the mechanics; its Open question 1 is answered by
construction rather than by choosing a subset.

**2. Endgame `targetElo` becomes provenance, not difficulty.** The twelve packs
keep their declared band as a record of **who the pack was authored for**,
explicitly not a resistance setting — the same move as the live-relay clock. The
evidence stands: the band ties on 43 of 45 endgame positions because transfer
tracks pieces remaining (0.40 full material, 0.07 reduced). **The distinction has
to be enforced or it decays back into a knob**, and that enforcement is the work
this ruling creates.

**3. Leaderboards and cross-learner comparison are admitted — R10 reversed, not
narrowed.** *"Add it properly, re-evaluate the refusal and why it was there and
what it unlocks."* The re-evaluation must keep what was right in R10: its
rationale was that we do not prevent self-cheating, and the league study found
that concern **observed rather than theoretical** — 4545's own history records
investigations altering standings across three seasons. So comparison ships with
the limitation **stated**, not pretended away. It unlocks the club and coach
cohort, and makes the honour-roll form a presentation choice rather than a
compromise.

**4. A campaign boss is a full game, not a pack.** Packs cannot be rated —
`plyHorizon` truncation leaves no rules-terminal result and manufacturing one
needs a position verdict law 8 forbids. So a boss runs to a real terminal result
and rates like any other game. **Consequence to design rather than discover:** a
boss becomes a different object from every other encounter, and the first
campaign element required to produce a rules-terminal outcome.

## 2026-08-16 — opponent contracts archived after independent review

`rfc/opponent-contracts.md` completed its lifecycle and moved with its planning record to
the archives. The landed contract publishes measured Maia resistance at mode scope, makes
opponent-mode dispositions total, records `orderingBasis` for new perfect-tablebase
selections, and replaces residual lexical tablebase ties with a position-pure neutral digest
order. Canonical behavior remains documented in `docs/engine-workers.md`,
`docs/tablebase-grounding.md`, and `docs/branch-runtime.md`.

The independent pass found and closed D452–D456 and D458, including the fullmove-counter
instability introduced by the first neutral key and the REST reconstruction gaps. **D457
remains open:** the historical census used rounded `dtz` while runtime uses `preciseDtz`;
the instrument now matches runtime, but no newly retained corpus has validated the old tie
counts. Archival records the shipped contract and does not promote that measurement.

## 2026-08-16 — the persisted development stack exposed a legacy-migration crash

The packaged server failed before binding its port against the existing Docker volume. The
volume contained an attempt-producing v0.4 run that migration 3 had correctly quarantined;
migration 6 nevertheless projected every stored row into the attempts table, where the old
snapshot's absent `sessionKind` became an unbindable SQLite parameter. D479 closes the mismatch
without deleting or rewriting the quarantined run: migration 6 now backfills only its frozen
v0.7 input population, and the migration fixture reproduces the old snapshot shape and learner
move that the prior zero-attempt fixture missed.

The first real registration then exposed D480: the auth gate had already requested `/play`
while signed out, but successful registration only started the history listener and never
reloaded that failed route. The valid cookie therefore appeared broken until refresh. Route
loading now waits for a learner and authentication explicitly loads the current route; the
regression fixes the request ordering rather than relying on response timing.

## 2026-08-16 — A0 reconciled the defect ledger against shipped symbols

The first defect-triage batch re-read every proposed closure before changing column 1. The
triage headline understated the result and its partial list had an internal count mismatch:
45 routed rows are fully closed and 15 retain a named residue, rather than 40 and 19. D203,
D204, D209 and D210 are shipped; D400 is answered and superseded. The residue rewrites now say
only what remains — for example, engine option metadata is retained while honour semantics are
still inferred from presence, and Q8 recomputes while its committed artefact remains stale and
its test still writes into the tree.

Four process rows closed alongside the reconciliation. D418's unaudited pack-graduation block
has now been audited; D419/D459 are addressed by relabelling the third table column
`Disposition / history (not status)`; and D474's declaration-census cache fix had already landed.
The pass changed statuses only after checking the current referent and kept every partial row
open with its title narrowed to the actual residue.

## 2026-08-16 — the packaged catalogue became playable without overstating trust

The owner ruled that committed drafts belong in the learner catalogue now, provided their trust
state is explicit. Packaged operation now loads `content/drafts/` as `community` content in every
environment, labels each entry **unreviewed draft**, and keeps an `official` record when the two
channels reuse an id. The drill-pack schema example remains a validation fixture and is no longer
served. Production packaging includes the draft corpus, closing D481 and D502 without changing
`NODE_ENV` or presenting unreviewed chess claims as reviewed.

The same closeout repairs three first-run regressions measured in the owner's walkthrough. The
rules-floor board lighting is `legal` again (D493), the board uses the dimensions of its actual
layout slot rather than a fixed viewport subtraction (D496), and terminal/live-match failures are
translated into recovery instructions instead of internal run and node identifiers (D495).

Implementation of `graduation-clearance` stopped before mutating content after finding D503: six
blockers classified as `shape_firing` belong to packs with no shape reference, while the accepted
schema requires the subject to resolve and the transition writer can evaluate only a named shape.
The RFC is returned under its own buildability clause; no subject or chess intent was invented.

## 2026-08-16 — packaged admission now carries its cited ruling register

Rebuilding the actual Compose stack after opening the draft catalogue reproduced D468: local
validation resolved accepted-condition citations against `planning/exploration/log.md`, but the
production image did not contain that file and restarted before binding its port. The image now
ships that exact append-only register and packaging verification asserts its presence. This was
not reproducible in the source-tree gates; the packaged-stack check was the evidence instrument.

The same admission census contains three permanent-property references to
`docs/tablebase-grounding.md`; that exact source is packaged and pinned too. Both citation classes
therefore run the same check in the source tree and the production image.

## 2026-08-17 — release publication now waits for the repository gate

D469 closed after the packaged-stack failure demonstrated the cost of treating the push workflow
as independent from verification. The server and Maia build/push jobs now both depend on a
dedicated release job that installs Stockfish and runs `ENGINES_REQUIRED=1 make verify`. The
packaging verifier pins the dependency, so a later workflow edit cannot silently restore the
race between validation and publication.

## 2026-08-17 — the queue's A2/A3 headings were not executable batches

Re-deriving the next queue items against their own defect rows found that A2 mixes format work,
measurements and a behaviour change gated on a census, while A3 mixes teacher-owned work with
rows that state no mechanical remedy. The headings remain useful routing, but treating them as
implementation authorization would require inventing missing decisions.

D232 was stale in the opposite direction. `evidence-at-runtime` already shipped a structural
test that enumerates all four `evidencePacket(` construction sites and requires a preceding
disclosure gate. The ledger now records that closure, and the queue advances only to the
independently takeable B2 subset after rechecking its current referents.

## 2026-08-17 — runtime and storage invariants stopped depending on repetition

The takeable B2 subset closed four rows without changing a learner-facing contract. Storage now
refuses startup unless its migration versions are exactly the ordered range from 1 through
`STORAGE_VERSION`; focused regressions cover a hole, a duplicate and an ordering error. The
five-member assessment category is declared once in the schema package and type-checked where
runtime and server consume it, removing the three-copy drift.

One real checkmating run now pins the three event gaps that emitters keep closed: opponent
selection immediately precedes its committed move, an ending checkpoint immediately precedes
its segment, and a terminal move immediately precedes its outcome. The test documents the
synchronous bracketing without widening the event schema or changing replay semantics.

## 2026-08-17 — browser fixtures left the learner catalogue

Default pack discovery now excludes `*.browser.json` through one exported predicate. The six
fixtures remain available to the zero-retry browser gate only because Playwright injects their
paths explicitly. This closes the gap between the authored-corpus denominator and what the
learner catalogue serves: test documents are test input, not community packs.

The first browser run after the change went red on the immediate-guard and stated-reasoning
fixtures, proving the old suite depended on implicit discovery. After moving all six paths to
the explicit test-server contract, the full browser gate returned to 24 passed at zero retries.

## 2026-08-17 — Q8's committed measurement became a real guard

The Q8 harness no longer writes into the repository during verification. A normal run generates
the report in memory and compares it byte-for-byte with `q8-output.md`; only an explicit
`UPDATE_Q8=1` run refreshes the artifact. The new guard was demonstrated red before refresh: the
committed report said 37 packs and 634 transitions while the current corpus measured 50 and 754.

After the explicit refresh, the ordinary run passed. The artifact's SHA-256 remained
`3996e4476aa181303ae754272f85529c793c2ec49e451960d4b7e19bfdcf8bc2` before and after that ordinary
run, demonstrating that verification now detects drift without causing it.

## 2026-08-17 — the graduation-emitter residue stopped masking its failures

The two independently takeable B8 defects are closed. A missing evidence ledger still reports
`EVIDENCE_READ_ERROR`, but now also reports `EVIDENCE_TYPE_UNBACKED` at every machine-labelled
claim it masks. This makes the size and location of the unbacked population visible instead of
collapsing it into one missing-file error.

Run distillation now validates the completed pack before returning and refuses
`EMITTED_PACK_INVALID`, matching the openings, Syzygy and position-seed emitters. A planted invalid
document proves the refusal path. The machine-label-to-record map was exported and is now consumed
by binding validation, sourcing checks and the expression census; D430 remains open only for its
RFC-owned dead-vocabulary half.

## 2026-08-17 — the endgame board became playable at the measured failing viewports

D507 reproduced against the served corpus rather than the schema-example fixture: the first
1280×720 run rendered Lucena's board at zero size, and the first containment repair left only a
90.7px board. Long authored objectives now keep their complete text in a bounded scroll region;
the short desktop tier tightens that region and spacing so the board retains a 192px interaction
floor without overlapping the timeline.

The browser invariant now requires that floor at every supported viewport and runs against all
six served endgame packs at 1280×720, 1366×768, 1440×900, 1440×1000, and 768×1024. The targeted
zero-retry regression passes across all thirty pack/viewport combinations. D508 remains a finding,
not work: the measured tablebase call is at latency parity with CET, so no speed advantage is
claimed or patched.

## 2026-08-17 — mock capabilities stopped promising unavailable opponents

D509 and D510 close the two opponent-entry failures found by the K9 endgame pass. An empty
`FixtureTablebaseSource` no longer counts as an executable provider, so the packaged mock stack
omits `perfect_tablebase` and `practical_resistance` from `/capabilities`. Pack start now checks
the authored mode before creating a run, preventing an unavailable draft from preserving a
learner move and only then failing.

Opponent selection also validates the fully replayed position before policy dispatch. The two
measured checkmate FENs now return typed `INVALID_REQUEST` / HTTP 400 under `human_common`
instead of letting the mock's bare `TypeError` become `INTERNAL_ERROR`. Focused coverage pins the
empty-versus-populated fixture distinction, capability publication, no-partial-run client path,
and the HTTP refusal grammar.

## 2026-08-17 — CI, development and production converged on one Stockfish contract

Actions run 32010019586 exposed that local verification and CI were exercising different UCI
option surfaces: the host ran Stockfish 18, Ubuntu 24.04 supplied 16, and the Bookworm-based
development and production images supplied 15.1. Moving to Ubuntu 26.04 would not align them; its
runner is preview-only and its package is Stockfish 17. CI now uses the explicit GA Ubuntu 24.04
label while a shared installer pins the official Stockfish 18 commit and checksums independently
of the distro. The devcontainer and both production architectures use that same installer, and
the real-engine handshake test requires version 18. Linux amd64 and arm64 stages were both built
and identified as Stockfish 18.

The same failed run exposed multiplicative work in the declaration-census regression. Four
namespace-disjoint mutations each reran the complete repository census, for five scans including
the baseline. One combined mutation preserves all four namespace assertions with two scans. The
affected test fell from 24.0 s on CI to about 5.5 s locally while retaining its 20 s timeout.
`ENGINES_REQUIRED=1 make verify` passed 754 tests across 116 files, and the zero-retry browser
gate passed 25 tests with one optional Maia test skipped.

## 2026-08-20 — Integrated-platform alignment audit and content-stability warning

The owner widened the evidence-rework question: preserve each competitor's appreciated capability
inside one FOSS/self-hostable platform; settle whether theory hints need retrieval; audit semantic
detectors, human-like bot policy, player classification, post-game review/share, and stop content
growth from outrunning the primitives it depends on.

`design/research/integrated-platform-alignment.md` landed with D555-D562 and a seven-product matrix
extension (63 products total). The code audit found the external LLM receives only deterministic
sentences; there is no retrieval/index layer. The recommended research direction is curated,
licensed, offline ingestion with exact chess-key retrieval first and optional embedding reranking,
while the LLM remains a renderer. The current 18 structural + six transition kinds are a geometric
census without the semantic/multi-ply tactical family the desired UX assumes. Maia opposition has
sampling/mode controls but no separate repertoire/style/error/time personality policy, and player
style has no metric/archetype contract. The current story is too evaluation-led to be the desired
grounded, replayable Review Map.

The audit also measured a stability warning: 42 commits have touched schema/pack code and 61 have
touched content since 2026-08-11; pack schema 0.27 already has two later active claims and all 50
product packs remain drafts. The owner's “foundation is ROCK SOLID before content expands” is
recorded as D560's active content hold; Gate F is the proposed clearance proof. The owner's
one-integrated-FOSS-platform ambition is recorded as D555. The resumable dependency program is
`planning/platform-alignment/plan.md`. Q4c, Q8, K6, E1 and the research coverage matrix now point to
the new evidence. Next work is active-RFC reconciliation and research, not feature implementation
or a broad content wave.

## 2026-08-20 — Skipper reuse corrected: research the builder, not the whole agent

The owner corrected the previous audit's framing: the question was whether Tabiya could reuse the
separate Skipper knowledge-builder pattern from `~/frameworks/monorepo/api_consultant`, not whether
a hint request should scrape the web. D557 now states that question accurately; D563 records the
bottom-up research→design→RFC→implementation sequencing ruling; D564 records the code-audit
verdict.

The whole Skipper executable is not a drop-in dependency: it requires Frameworks identity/auth,
PostgreSQL schema and shared platform packages, and wires video diagnostics, tier/metering,
platform clients, Gateway/MCP, heartbeat and notifications. Its `internal/knowledge` seam is much
cleaner and worth testing: crawler/cache/extraction, scheduler, chunker/embedder, store, hybrid
retrieval and reranker. The generic confidence mapper calls any knowledge-base result `verified`,
which retrieval does not establish and law 8 cannot accept.

`design/research/theory-knowledge-pipeline.md` therefore recommends using current Skipper unchanged
as a disposable research instrument, then extracting a standalone builder/search service only if a
six-arm experiment beats exact chess keys plus full-text search while meeting false-match,
abstention, citation and rebuild gates. A product release would consume an immutable knowledge
bundle; ordinary self-hosters would not inherit Postgres, crawling, embeddings or an agent loop.
The experiment is queued at `planning/platform-alignment/knowledge-retrieval/plan.md`. No product
code, schema, content or deployment changed.

## 2026-08-20 — The integrated 1.0 program now has a bottom-up dependency queue

D563 is now executable as planning rather than only a ruling. `planning/platform-alignment/`
contains a research queue with methods and exit criteria, a decision queue for owner/design
synthesis, an RFC graph that reconciles active documents before creating new ones, an execution
queue from current research through Gate F and release proof, and a capability map covering the
individual loop plus campaign, coach, streamer, human play, tournaments and platform breadth.

The current legal frontier is audit and research: active-RFC truth, capability reality,
interaction-state measurement, the already-queued theory retrieval comparison, bot-policy
research, release-platform/rights research and capability-watch instrumentation. Product feature
RFCs and scale content remain blocked. No design intent, product code, schema or content changed.

## 2026-08-20 — Active-RFC truth audit and four lifecycle closeouts

A0 audited every active product RFC independently of the dirty feedback-delivery implementation.
On a clean extraction of committed `e5a3f3f`, 179 focused tests and 53 Stockfish-required tests
passed; schema/runtime/server typechecks passed; Svelte reported 0 errors/0 warnings; scaffold and
packaging passed.

`live-marker-quality`, `dead-vocabulary`, `engine-leverage` and `vocabulary-wiring` were complete
in code and criteria but had remained `implementing` since 2026-08-15/16 solely for independent
review. They are now archived with their historical register lanes released. D497 and D505 close.
The archive grows from 59 to 63 lifecycle-complete RFCs. This number does not measure integrated
product quality; `planning/platform-alignment/1.0-capability-map.md` owns that proof.

The pass also reconciled `graduation-clearance`'s body status to the register's accepted state and
closed stale D503. It remains unbuilt, as does `teacher-surface`; feedback delivery remains an
accepted two-stage RFC whose current Stage 1 is uncommitted and was not absorbed. Six documents
remain draft/returned. No product code, schema or content changed in this closeout.

## 2026-08-20 — Capability reality audit separated mechanics from integrated proof

A1 traced every row in `planning/platform-alignment/1.0-capability-map.md` through a production
backend/producer, client consumer, real content/workflow instance and current hands-on proof. The
result is `planning/platform-alignment/capability-reality-audit.md`: two proven integrations,
fourteen mechanically present families, four claimed-only families and one absent family. The
classification deliberately does not promote mechanics to learning efficacy, owner-ratified 1.0
scope or official-content readiness.

The strongest correction is favourable but scope-neutral: native two-player match play already
ships and passes the current three-browser pause→branch→resume/authorship/friend-link episode, so
the previous “native play not established” reality was false. R17 still owns whether and how that
capability belongs in 1.0. The strongest architecture gap is the opposite: eight free-text
`CAPABILITY_DISPOSITIONS.surface` values intersect none of the seven canonical `SURFACE_IDS`, and
no client reads the producer field. The promised evidence producer→feature relationship therefore
does not yet exist as a contract.

The audit also re-derived the content floor: zero official packs, 50 served non-browser community
drafts and 25 shape entries. Real drafts legitimately prove runtime/client wiring but cannot clear
Gate F or D560's content hold. R1 detection, R2 selection/significance, R5 renderer evaluation and
R6 pack-stability research are now unblocked by the exact symbol/content inventory. A2 remains the
predecessor for interaction-state guidance research. No product code, schema, content or design
intent changed.

## 2026-08-20 — Detection landscape measured; Q4c producer boundary answered

R1 landed as `design/research/detection-landscape.md` with a disposable external-theme harness.
The current “classifier” is now split into six evidence planes and exact board atoms are separated
from semantic tactic/plan events. The candidate tables name sign, operands, grounding,
exactness/confidence, abstention, cost and allowed consumer/refusal, including the owner's
multi-ply threat and fianchetto/discovered-line examples.

The empirical check replayed 50,000 Lichess puzzle records plus legal counterfactuals. Broad cheap
geometry agreed poorly with semantic tags despite high recall: fork 32.3% precision, pin 39.0%,
discovered attack 19.7%, hanging piece 7.9%. File-mirror invariance passed on 250 records. Lichess's
own source adds consequence/value conditions and leaves overload unimplemented; its automatically
generated, vote-refined tags are therefore an external disagreement set rather than ground truth.

Q4c remains partial and K6 gains evidence toward firing for geometry-only generated explanations.
R1 is done; R2 selection/significance and R3 presentation are still required before any semantic
detector or guidance RFC. D560's content hold remains unchanged. No product implementation or
content changed.

## 2026-08-20 — R2 measured selection/sign and refused rarity as meaning

`design/research/selection-sign-and-significance.md` answers platform-alignment R2 with two
populations and a predeclared disposable instrument. It compares every legal alternative for 754
authored decisions and 579 fixed-ply decisions from 108 rated Lichess games stratified by
Bullet/Blitz/Rapid and three Elo bands.

Local counterfactual admission plus a two-card budget solves the raw-volume problem mechanically:
8.70→0.79 entries/decision authored and 11.42→1.03 imported, with mean specificity rising from
about 18% to above 93%. All 108 checkmate/promotion/castling/last-of-role events survived. The
result transfers; the authored/imported per-kind lift ranking does not transfer unchanged
(Spearman ρ 0.667).

The finding is deliberately split. The selected families are still led by literal material-count,
bishop-shade and generic changed-count facts, so rarity does not establish teaching significance.
And 1,554 alternative-only `avoided` relations establish no good/bad valence. D569-D572 therefore
require semantic eligibility before local selection and prohibit the LLM from selecting, grading
or inferring valence. Q4c remains partial until R3 presentation and reader validation. R2 is done;
R12 research is unblocked; D560's content hold is unchanged. No product implementation or content
changed.

## 2026-08-20 — A2 exact-UCI interaction census landed

`design/research/interaction-state-correctness.md` rechecked K9 and D537-D541 against clean commit
`68b9a98`. The disposable census covers all six served endgame packs at 1440×1000, 1366×768,
1280×720, 768×1024 and 390×844 using stale/live click, drag, emulated touch, resize and hover. It
validates every authored move from the FEN, handles Black orientation, remeasures live board bounds
and compares the exact outgoing `uci` rather than treating any ply as success.

Only 4/90 live gesture cells delivered the authored UCI; 15 delivered another legal UCI and 71
delivered nothing. Stale coordinates succeeded 19/30 while live click succeeded 1/30, reproducing
the probe/bug cancellation, and resize restored 24/24 desktop/tablet cells. At 390×844 five source
squares are covered before selection and every click/drag/touch arm is 0/6; this is new D573 rather
than an extension of stale bounds. K9 remains evidence toward firing, C7 remains unmet, Q3's phone
run-loop floor is now measured unmet, and R3 prototype work is unblocked while its participant exit
remains external. No product implementation or content changed.

## 2026-08-20 — Pack stability re-derived; Gate F remains closed

Platform-alignment R6 landed as `design/research/pack-primitive-stability.md` with a disposable
Git-history/compatibility harness. All 92 current pack documents validate at 0.27, but none identifies
its schema or required capabilities; all 92 also validate under 0.24 despite later principle and
graduation semantics. Syntax admission is therefore not a runtime capability handshake.

The 27-mutation history contains one invalid released schema artifact repaired under the same 0.13
ID, one breaking 20-pack evidence relocation, later 35-pack/13-principle and whole-92-document
rewrite waves, and no reusable migration ladder. Four declared primitive families have zero current
pack witnesses. Mechanical migrations can be planned and replayed; semantic assignments must be
reported as human residue, not inferred. D574-D578 record the defects and architecture obligations.
R6 is answered, but its result is negative: O6 remains blocked by R8/R10, F3 is not yet draftable,
D560 stays active and Gate F remains failed. No product code, schema or content changed.

## 2026-08-20 — R4 tested Skipper and refused semantic extraction for 1.0

The separate-builder question was exercised with a licensed source register, a fixed 144-query gold
set and the actual Frameworks Skipper knowledge path. The corpus contained 55 logical passages and
produced 106 contextual chunks. Exact+FTS reached 97.7% recall@5; contextual hybrid+reranking reached
94.7%, returned an ineligible first result on 8.3% of answerable queries and abstained on 66.7% of
hard negatives. The predeclared semantic gate therefore fails on value and both safety axes.

Atomic source replacement and 12/12 exact-vs-indexed vector controls passed. Skipper chunks do not
carry required licence/revision/span/digests or embedding model identity, so reproducible provenance
and same-dimension model invalidation failed. Running the whole service also required unrelated
Frameworks services, confirming the deployment coupling in execution.

The experiment found a defect in the supposedly deterministic layer too: the free-text key `pawn`
filtered rook-ending questions to the generic pawn-ending source. D579-D581 require typed
applicability predicates and narrow the 1.0 theory candidate to a separate provenance compiler plus
immutable exact/SQLite-FTS bundle. D564 closes negatively; D557 remains the bounded builder need.
R8 now waits only on R3 and O5 still waits on R8/R18. No product code, schema, deployment or authored
chess content changed; D560's hold remains active.

## 2026-08-20 — R3 mechanical presentation research landed; reader exit remains external

`design/research/evidence-presentation.md` audits the shipped assistance paths and lands a
disposable module boundary. Settings expose 54 source/mechanism controls. Over 611 unique
authored-spine positions and 12,236 occupied-square queries, current board lighting reaches a tail
of 11 captions and 19 marks from one selected square because it filters the raw structural census
by square and bypasses R2. `evidencePacket()` independently sends the full structural list,
matching plans and authored text to the LLM provider without a consumer identity or budget.

The synthetic module compiler passes zero/one/many fact, abstention, disclosure, consumer mismatch
and move/PV-leakage tests across rules floor, sight-on-request, post-commit nudge, progressive hint,
compare, theory breadcrumb, Review Map and explicit inspector contracts. These are research
candidates, not product defaults; pre-commit rung-0 sight remains an owner boundary.

Competitor evidence supports progressive intent, guided key moments, Retry before move reveal,
theory↔play links and visual forms bound to an admitted explanation. It does not authorize
Chessiverse's pre-commit grading/guard or Chess.com's engine-review posture. D582-D585 record the
concrete defects; K6 gains a sixth partial finding and B4/Q4c are narrowed.

R3 is mechanical/desk done but not complete. The board remains interaction-invalid under D537/D573,
the in-app browser was unavailable, and no nontechnical participants were in scope. R7, R8 and O4
remain blocked. No product code, schema or content changed; D560 remains active.

## 2026-08-20 — platform R5 renderer evaluation completed

`design/research/llm-renderer-contract.md` measures deterministic, current sentence and typed
module rendering over sixteen fixed synthetic cases and three model snapshots. Deterministic
rendering passed every gate. One hosted sentence snapshot passed the pinned run; another returned a
false absence that `voiceCheck` accepted. Both hosted typed arms returned schema-valid output and
admitted fact IDs in every case while dropping required citations, so structured output binds the
envelope rather than the prose proposition. The 360M local typed arm failed 15/16 cases and the
guard accepted 14 of those failures.

The resulting boundary is narrower than “LLM guidance”: evidence selection, abstention,
permissions, citations, exact values and board forms are deterministic; an LLM may only style an
already-selected module packet after passing a versioned conformance gate, with the deterministic
form as provider-off fallback. D586-D589 record the residual defects and promotion work. R5 is
done, B4/K6 are qualified, O4 now waits on R3, and D560's content hold remains active. No product
implementation or authored chess content changed.

## 2026-08-20 — R12 found individual habits but refused natural player types

`design/research/player-style-metrics.md` measures 16 literal player metrics over 36 non-bot
accounts × 200 blitz games, selected from a fixed 2 GiB prefix of the official July Lichess
database. The cohort contains 261,892 traced learner decisions and uses 2,573,111 legally parsed
same-band games as its opening reference. Raw identities and per-decision traces remain outside the
repository.

Twelve metrics have persistent short-session floors from 25–200 games. Fianchetto-unblock,
forcing-choice, non-pawn-capture and reply-breadth fail. The retained vector re-identifies 35/36
accounts across disjoint halves and passes shuffled-identity/rating controls, but no k=4–12
clustering reaches the ARI 0.70 archetype gate; the best is 0.417. Continuous inspectable habits may
enter O9. Natural types, GM twins and advice are refused.

D597-D604 record source contradictions, denominators, sample persistence and privacy. The first
unblock run was discarded after its 586/586 result exposed an event-conditioned denominator;
corrected incidence is 586/4,473. R12's short-session arm is answered, longitudinal transfer remains
external, R13 still waits on R7, and the identifying-vector result feeds R18. No product code,
schema, content or design intent changed; D560 remains active.

## 2026-08-20 — platform R18 release audit completed mechanically

`design/research/release-platform-audit.md` measures the clean provider-off and engine-on Compose
profiles, live Maia failure, user-data deletion/export, built-image rights/content and a served
Chromium accessibility tree. The provider-off core is real: it needs no cloud secret and a run
survives restart. The present release platform is not 1.0-ready.

The independent failures are portable data exit/deletion, backup/update recovery, safe HTTP/TLS
entry points, provider-health honesty, keyboard/assistive move entry, standard Tab traversal and
distributed notices/SBOM. The optional 5.11 GB Maia image adds a new FOSS/resource blocker: 18
CUDA/NVIDIA packages, 15 proprietary/licence-ref, accompany measured CPU use. D605-D615 record the
findings; R18 makes O13 ready but does not clear F12 or B8's release qualification. Participant
screen-reader/physical-device evidence remains external. No product code, schema, design intent or
authored chess content changed; D560 remains active.

## 2026-08-20 — capability-first competitor watch landed

The 63-product static matrix now feeds `design/research/capability-watch.json`: 21 canonical
representatives, 18 capabilities and 25 evidence rows with separate love/hate missingness,
thesis-compatible transformation, non-copy boundary, producer/consumer status and exact route.
The validator proves aliases do not increase coverage and novel capabilities do.

Eighteen of 25 rows are transformations and only two are direct adopts. More importantly, 18/25
have neither love nor hate checked; vendor feature evidence was not relabelled as user preference.
D556 closes on the instrument. D554 remains the targeted hands-on/forum queue. No product code,
schema, design intent or authored chess content changed; D560 remains active.

## 2026-08-20 — targeted competitor feedback narrowed E1 and completed D554's forum arm

`design/research/competitor-love-hate-sweep.md` searched every previously unchecked product/workflow
signal and reconciled the checked register. It now contains 22 canonical products, 19 capabilities
and 29 evidence rows: 38 of 58 love/hate cells are reported/observed, 20 are explicit targeted-search
misses and none remain unchecked. ChessLabHQ and TryChessLab are now separate identities; Qchess's
structured-thinking workflow is a first-class capability. D626-D627 close.

E1 remains met but narrows materially. Chessiverse Guided Play now claims retained abandoned
continuations, bot-reply replacement/resampling, PGN variations and opening-guide handoff, so rewind,
branches and theory linkage are no longer whitespace individually. The remaining uncontradicted
claim is grounded cross-workflow integration plus preserved N-way consequence comparison, pending
hands-on R3/R7/R8/R11 work. Its intent presets and evidence-shaped theory hints support D619; its
pre-commit move grading remains refused outside explicit Support. No product code, schema, protected
design intent or authored chess content changed; D560 remains active.

## 2026-08-20 — R3's participant workflow artifact became executable

The disposable R3 harness now contains nine evidence modules, five assistance presets and six
workflow ceilings plus a responsive participant artifact. Seventeen synthetic tests prove the
Support-only warning boundary, Theory-only isolation, consumer/timing/budget admission, honest
empty versus unavailable states, suppressive ceilings and a configuration disposition for every
module. D628 closes in the instrument after the prior eight-module contract was found unable to
represent the owner's ruled blunder-prevention boundary.

Headless visual QA exercised Just Play Support at 1440×1000 and post-commit Guided Rehearsal at
390×844. The expected warning/nudge rendered and the phone document stayed at 390 px; one hidden
result container that still painted an empty bar was caught and fixed. This proves buildability,
not comprehension. R3 remains external until 12 nontechnical participants meet the preregistered
workflow/disclosure thresholds. No product code, schema, protected design intent or authored chess
content changed; D560 remains active.

## 2026-08-20 — campaign R6–R8 were reconciled to their real experiential residue

Corrected `planning/campaign-research-queue.md`: the 2026-08-16 fixture run did terminate, fork and
compare, so “nobody has played” was false; what remains is the owner on real content. R6 now tests
only a retry-count denial because rewind location and consequence-before-rewind are settled. R7 now
tests whether a D619-style suppressive module ceiling feels legible/useful, not whether presets,
Theory only or honesty/configuration separation exist. D489 closes in the authoritative queue.

Preregistered the R14 owner pilot over a mechanically selected opening/middlegame/endgame trio and
recorded the current pack digests. It preserves separate R8, R6 and R7 exits and cannot average a
failed loop into a positive campaign verdict. The run remains blocked by D537/D573 exact interaction
and a real compiler-admitted R3 packet; synthetic fixture copy is explicitly insufficient. No
Campaign RFC or product implementation is authorised. No product code, schema, protected design
intent or authored chess content changed; D560 remains active.

## 2026-08-20 — shipped detector kinds received an executable semantic conformance audit

`design/research/detector-semantic-conformance.md` and the disposable D629 harness close a register
over all 18 structural and six transition families at HEAD. The 50-pack / 754-transition run finds
11/18 structural families round-trip between matcher and reader, seven subset/lossy/matcher-only,
and all six transition families lossy. None of 3,371 transition observations retains an affected
square although upstream helpers compute some of those identities. Five generic sinks accept whole
readings without family admission. D629 closes as a research instrument; D630-D633 record the live
operand-erasure, projection, indirect-migration and priority-classifier defects. Gate F remains
closed and no content, schema, product implementation or protected design intent changed.

## 2026-08-20 — the evidence-pool claim received an executable topology audit

`design/research/evidence-contract-topology.md` and the disposable D634 harness trace fourteen
producer paths from computation/source through runtime events, sidecars, refs, packet fields,
sentence admission, standalone routes and client contracts. They terminate in five incompatible
delivery states; only four are renderer-visible. Runtime and sourcing vocabularies have no name
join, eight capability surface labels join none of seven canonical IDs, and production contains
none of the nine R3 module or six workflow IDs. Transition, Maia, Explorer and opening identity do
not enter `EvidencePacket`; generic observations and matched plans enter typed fields but not its
normative LLM sentence source. D634 closes as research, while F1 remains the required compiled
projection/consumer contract. B4 and Gate F remain unmet; no product code, schema, content or
protected design intent changed.

## 2026-08-20 — assistance defaults were traced by learner workflow rather than run kind

`design/research/workflow-default-conformance.md` and the disposable D635 harness prove the six
persisted profiles are technical addresses, not the six intended workflows. They expose 54 raw
Settings controls but one byte-identical unnamed default; only Just Play and generic pack play bind
directly, while Learn is mixed, Review/Analyze inherit the source and Campaign is absent. The
session-kind ceiling remains invariant. Academy has no profile, and Story narration ignores the
imported voice preference (D636). The pass also retracts D311's stale 36-control/three-overlap
claim while retaining its four live residues. F5 now explicitly owns separate workflow/preset
state and mask composition. Participant defaults, campaign and coach/stream choices remain open;
no product implementation, schema, content or protected design intent changed.

## 2026-08-20 — RFC completion truth was re-derived after A0

The disposable D637/D638 harness found that the 63-file archive and its register were not
set-equal: the Archive table held 58 rows, four implemented RFCs appeared only in pack-schema
history and one archive-shaped row was embedded in that history. The register is repaired and the
harness now asserts both Active/root and Archive/filesystem equality, implemented body status,
acceptance-criteria presence, canonical-doc resolution and a planning record.

`planning/platform-alignment/rfc-completion-refresh.md` separates three claims that had been
collapsed: 63 lifecycle-closed records, four current independently reverified RFC implementations,
and two A1-proven integration journeys. No active product RFC is complete: two are accepted/unbuilt,
feedback delivery is accepted with inconsistent dirty Stage-1 records, and six are draft/returned.
The correction changes queue truth but authorises no feature implementation, content wave or
protected design edit. D560 and Gate F remain active.

## 2026-08-20 — research sufficiency was joined to the RFC graph

The D639 harness covers all 19 research, 15 decision and 12 candidate-RFC nodes. It classifies five
research nodes complete, four partial/external, one external-ready and nine blocked. The result
rejects the blanket statement that the whole program still needs more research: F1 evidence
architecture and F12 Choice-C release architecture have enough evidence, but their protected
intent/process gates remain open. F2-F11 each retain a named empirical predecessor.

`planning/platform-alignment/research-sufficiency.md` records which remaining claims require real
learners, coaches, blind bot reviewers, the owner campaign pilot or social operating evidence.
Another repository census cannot substitute for those observations. No RFC was drafted and no
product code, schema, protected design intent or content changed; D560 remains active.

## 2026-08-20 — O1-O4/O13 intent debt was prepared for its authorised writer

The D640 parity harness proves planning and protected intent currently disagree at five boundaries.
`planning/platform-alignment/intent-amendment-handoff.md` gives the owner/Claude exact amendments
for `design/02`-`05`, names what must remain open, and includes the closeout/check protocol. It also
reduces the two process drafts to five owner questions with recommended minimum rulings.

No protected design was edited and D640 stays open. This prepares authority; it does not substitute
for it, accept F1/F12, or loosen the content hold.

## 2026-08-20 — the zero-mention defect residue was routed

The D641 audit joined the current ledger to living non-log planning and active RFCs. Before the
repair, 75 of 355 open ids appeared nowhere on that routing surface. D99 was a stale historical
hazard and is closed; 74 genuine residues now have one primary destination in
`planning/platform-alignment/unrouted-defect-refresh.md`.

This closes omission only. D487 remains open because the other 280 mentions have not been proven
unique, live or non-stale owners, and the future derived `make work-register` must make that state a
verification failure. No feature implementation or content work was authorised.

## 2026-08-20 — graduation-clearance readiness was reconciled with the later content hold

The D642 audit confirmed the accepted 0.28 mechanism is absent and re-derived its migration
population as 56 draft documents / 293 entries plus 36 candidate pack documents / 143 entries. It
also found acceptance criterion 13 names a clearance issue code the RFC's normative table withdrew.

The legal sequence is now explicit: recover Feedback Stage 1, correct that authoring defect, build
the clearance mechanism and read-only migration plan, then expose mechanical versus enumerated
judgement residue before asking the owner to approve any corpus apply under D560. No schema,
product, protected design or authored content changed.

## 2026-08-20 — Feedback Stage 1 was recovered to an honest author return

The interrupted CR1 harness now uses eight-ply deterministic columns and reports N=8 admission at
70/450 (15.6%), not the invalid one-ply 79/79. The false start remains in the measurement and log.
`comparisonStrips` now shares the runtime's canonical observation identity.

An explicit criteria audit then found the accepted RFC cannot satisfy criterion 20 as written:
46 of 67 projected provenance rows contain vocabulary originating in authored principle statements
or counter-cases that C8 requires rendered verbatim. D644 records the reproduced conflict and a
narrow author-correction handoff. Stage 1 remains uncommitted; no content, schema or protected
design changed.

## 2026-08-20 — Feedback Stage 1 reached criterion-complete evidence except for its author conflict

The D643 recovery now maps every Stage-1 acceptance criterion to executable proof or a named
landing obligation. The full-spine driver measures the three populations separately and reaches
42/50 packs, well above the 10% kill gate; eight uncredited replay residues remain named. On the
real 44-fork corpus, CR1 admits 3,463/4,029 candidates (86.0%), still emits on 97.3% of plies and
has 1.017x lift. That satisfies the accepted no-threshold measurement criterion but is negative
evidence about the filter's learner value.

Safety coverage now includes all-policy early-terminal refusal, group seeding, quiescence,
ledger-less fallbacks, expression-census/refusal joins, withheld-flag parity, CR3 degeneracies,
timing-strip identity, rebound withholding, `/voice` and `/speech` byte identity, and earned-only
provenance labels. Stage 1 is still uncommitted: D644 requires the RFC author to correct criterion
20's conflict with verbatim principle provenance, and K6/B4 is updated only in the landing commit.

## 2026-08-20 — feedback reach failures were separated from driver failures

The eight packs not credited by the Stage-1 walkthrough were re-run with the production
plan-signature resolver. All eight still terminate their objective before full authored-spine
coverage under every leaf ordering. D645 records that C1 is genuinely unreachable for this class;
the measured 42/50 reach is the product result, not an incomplete-instrument denominator. The 10%
kill gate remains clear, but the RFC author must disposition the permanently unreachable claims.

## 2026-08-21 — D645 was promoted from feedback residue to foundation defect

The owner rejected deferring the eight packs behind anchors and directed a proper fix now. A new
disposable corpus replay located every absorbing transition: 8/50 packs, ten authored leaf paths,
one to six authored plies hidden, all `achieved`. The result instantiates the already accepted D12b
law — a state that stops play may only occur where play ended — and the thesis's mandatory
consequence rule. It does not reopen runtime semantics.

The same pass found D646: all four `preserve_plan_window` packs duplicate their type-owned verdict
rules, so terminal authored copies can fire only one ply after the actual verdict. The research
dossier selects a bounded repair: remove those duplicates, mark intermediate plan success as
`preserved`, and add executable validation against absorbing non-leaf authored nodes.

## 2026-08-21 — authored consequence lifecycle closed

The bounded repair shipped in the worktree with both recurrence guards. A first re-run exposed and
repaired one masked IQP `transitioned` rule; the second found zero absorbing authored continuations.
Feedback C1 now reaches 50/50 without an anchor or softer predicate. Full verification is 766 tests
across 117 files and browser is 25 passed / one optional skipped.

## 2026-08-21 — Feedback Stage 1 closed its criterion audit

D644 was corrected without changing C8: the deterministic template introduces zero prohibited
chess-judgement tokens across 67 projected rows, while 46 rows retain such vocabulary verbatim
inside explicitly attributed authored principle fields. The negative fixture proves the boundary
by injecting `best` into template-owned text and refusing it.

The landing measurement also replaces the obsolete authored-feedback gate baseline. Of 196 claims,
98 are admitted and 98 are evidence-withheld pending the binding wave. Full authored-spine replay
reaches 50/50 packs and actually renders 69/98 admitted claims; 29/98 remain timing-withheld because
no released reveal occurrence remains. B4/K6 now carry all three populations. This closes Stage 1's
criteria 1–20a, not the RFC: Stage 2 and its content closeout remain under D560.

The criterion-complete tree then passed `make verify` (766 tests / 117 files, type/schema/scaffold/
packaging green), the two disposable Feedback acceptance suites (4/4), the RFC lifecycle audit
(5/5), and `make test-browser` (25 passed / one optional Maia-latency probe skipped). The evidence
and browser gates therefore agree; no aggregate-green shortcut remains in this Stage-1 closeout.

Feedback Stage 1 landed at `a64e6c5`. D526 and D527 close with the implementation; D78 remains open
because the correct filter still emits 7.32 entries/ply at only 1.017x lift on real authored forks.
The RFC stays accepted/implementing until the separately governed Stage-2 binding wave closes.

## 2026-08-21 — root README replaced and its commands exercised

D614 closed: the obsolete “zero open defects” release summary and hand-copied test/content counts
were removed. The root entry point now follows a conventional open-source structure, states the
pre-1.0 status honestly, gives a Docker quick start and real authoring examples, and routes changing
status to the checked gates, ledger, RFC register and implementation docs. All 15 relative links
resolve.

Exercising the examples found D647: `make shape-check` bundled TypeScript into ESM and crashed on a
dynamic `fs` require before reading the shape. Its Makefile target now shares the external-TypeScript
boundary already used by `expression-census`; the Carlsbad pack and shape examples both pass their
respective checks (with the corpus's existing warnings preserved).

## 2026-08-21 — process predecessor owner questions discharged

The owner approved all five recommendations in the platform-alignment handoff: register the
principle-entry schema now; place `tabiya-claims` immediately before `## Summary`; allow
`implementing → awaiting` but not `accepted → awaiting`; retain discharged rows in archives with
their SHA; and enforce both Active/root and Archive/filesystem set equality. D648 records the
ruling. Neither process RFC is accepted by the ruling alone—Claude's HEAD refresh, criterion
reconciliation and cross-review remain the next author action.

## 2026-08-21 — protected intent now mirrors the O1-O4/O13 rulings; four breadth gates re-stated

The law-5 amendment pass (claude on the owner's rulings, per
`planning/platform-alignment/intent-amendment-handoff.md`, D640) landed in `design/02`-`05`.
`design/02` records O13 Choice C as the 1.0 deployment floor (appliance clauses named, hosted
retained without core-journey secrets, source model/monetization still open) and the web-first
responsive PWA target. `design/03` reframes the raw evidence list as the advanced inspector
inventory under O1's compiled producer→evidence→consumer manifest. `design/04` adds the Gate-F
primitive definition and D531 principle-classification ownership. `design/05` adds the
eligibility/selection amendment, manifest-declared forms, the layered O4 configuration model,
guided-mode-as-modules and R5's measured LLM boundary; open questions 1 and 4 are updated as
partially ruled.

Gate mirror changes here: B9 gains its A3 qualification (11/18 structural families round-trip;
zero complete families unconditionally learner-admissible), and the 2026-08-14 "B1-B11 all green"
headline carries a dated correction — B4 (A4), B8 (R18/O13), B9 (A3) and B10 (A5) are negative or
qualified as current integration truth while their historical landings stand. Canonical wording
lives in `design/03` as amended; evidence: `design/research/evidence-contract-topology.md`,
`release-platform-audit.md`, `detector-semantic-conformance.md`,
`workflow-default-conformance.md`.

D649 (owner, 2026-08-21) is folded through: external participant studies are descoped; the
mechanical/desk halves of R3/R9/R11/R15 stand and the owner's own play sessions remain the
validation instrument. R3/R7/R8/R15 product decisions stay open — nothing in this pass answers
them. The D640 BACKLOG row update, the intent-parity-harness rework and `make verify` were outside
this pass's file authority and remain with the closeout owner.

## 2026-08-21 — Exact board interaction repaired; K9 returns to owner-use evidence

D537, D538 and D573 closed in one implementation pass. `Chessboard.svelte` now refreshes
Chessground's cached bounds on the first rendered frame after selection and once after layout
settles. The compact drill layout bounds long objective prose to keep the 192 px board wholly
inside the position region instead of underneath Timeline. A unit test binds selection to redraw;
the permanent browser gate hit-tests the authored source, remeasures after selection and asserts
the exact outgoing UCI for all six served endgames at 1440×1000, 768×1024 and 390×844.

The gate demonstrated a remaining race before passing: a two-frame-only refresh still submitted
`e4c6` for authored `e4c4`; moving the first invalidation to the next rendered frame closed it.
The final-source A2 rerun is **90/90 exact** across six packs × five viewports × live click, drag
and emulated touch, with zero wrong and zero missing requests (SHA-256
`0aa7b90c2830b4d2caf678054cb91201436ebebbae6a79e6cfb97a46387be084`). The 2026-08-20 4/90
baseline remains in the dossier as historical failure evidence.

Consequences: Q3's pointer/touch run-loop floor now passes; C7 is mechanically met but still needs
the owner's feel judgment; K9 returns from defect-caused evidence toward firing to an open
comparative-usability question. R14 no longer waits on board correctness and now waits only on a
real compiler-admitted R3 packet plus the owner's preregistered run. Keyboard/assistive input and
the 720–992 px full-surface gap remain separate F12/R18 work; no accessibility claim was promoted.

Verification after the final helper correction: `make verify` passed **767 tests / 117 files** plus
type, scaffold and packaging checks. The first full browser run deliberately exposed seven older
workflow helpers aiming with pre-selection coordinates; after they were changed to remeasure after
selection/pointer-down, `make test-browser` passed **26 tests**, one optional Maia latency test
skipped, with zero retries.

## 2026-08-21 — Shared-resource declarations and derived registers implemented

Accepted RFC-1 now gives all six shared versioned resources landed/live registers and gives every
active non-process RFC one machine-readable `tabiya-claims` declaration. `make register-check`
derives four schema heads and `$id`s, the migration head, and the evidence vocabulary from the
tree; joins all declarations to register rows; refuses stale, duplicate, missing and integer
migration claims; and computes next lanes without storing them in the index.

The live hand derivation is pack 0.30, run 0.18, shape-entry 0.5, principle-entry 0.2, migration
`teacher-surface` then the two ordered `learner-rating` claims, and evidence member `citable_text`
held with no numeric lane. D376, D385, D423, D447, D461, D498, D499 and D653 close. D384's
register half and D504's register half close; their explicitly excluded collision/history and
missing-schema-test halves remain open.

## 2026-08-21 — RFC lifecycle documentary stage landed awaiting its reader

The lifecycle now admits `awaiting` only after `implementing`, gives every Active RFC an explicit
Discharges section, closes the owner vocabulary, and requires archive commits to clear or re-home
obligations owned by the departing slug. The status grammar preserves Active-cell review history
while making its leading token comparable. The process RFC itself is the bootstrap case:
`awaiting — D1` until P1–P6 exist in the shared parser's companion instrument.

D433, D475, D478 and D460 close on the documentary mechanism. D476 stays open because the binding
wave is now visibly owned by `OWNER` but has not yet been commissioned; naming a missing act is not
performing it.

## 2026-08-21 — Lifecycle parity implemented and RFC discharged

`tools/status-parity.mjs` landed at `7bdbafa`, reusing the Active parser from RFC-1. P1–P6 bind
status tokens, body/cell parity, both filesystem/register set equalities, terminal archive state,
the Discharges grammar, awaiting pointers, archival clearance and the four owner forms. The
pre-archive live run read 9 Active, 65 archived and 6 open obligations, all honest, with P1–P6
green. The lifecycle RFC's D1 records that SHA and the document now archives without an open row.

## 2026-08-21 — graduation clearance gained an executable read-only plan

The D560/D642 legal slice now runs as `make graduation-plan`. It re-derives all 220 draft blocking
entries as 203 ordered-rule suggestions plus the RFC's 17 published hand assignments, inventories
141 of 143 candidate blockers against the nine emitter templates, and names the two non-template
entries rather than defaulting them. The report also exposes the 30 resolved, 43 accepted, one
removed-referent and five fixture-transition obligations as judgment-bearing apply work.

The first run found D658: six hand-table rows use source file stems that differ from their internal
pack ids. The classifier now binds the table to file stem and tests the divergent rook case. The
guard is part of `make verify`. Pack schema remains 0.27 and no pack, sidecar or clearance state was
mutated; schema 0.28, the product writer and the 92-document apply/archive remain held by Gate F.

## 2026-08-21 — amended living intent gained a parity reader

D651 replaces the disposable D640 stale-text detector with six positive contracts over the
owner/Claude amendments in `design/02`–`05` and their gate mirror. The guard verifies the Choice-C
appliance/D649 posture, compiled evidence authority, eligibility-before-selection, workflow/preset
composition, deterministic renderer/optional LLM boundary, and the D560/Gate-F hold. It also keeps
the real open questions open and asserts that amendments follow, rather than erase, history.

The first focused run rejected the old harness's invented “provider wording comprehension” open
question: it appears in neither the approved amendment handoff nor living intent, and D649 descopes
the recruited-participant arm. The product boundary remains strict provider conformance with a
deterministic fallback. `make intent-parity` uses Node's built-in runner, reads protected intent,
byte-checks its derived contract report, writes nothing, and now runs inside `make verify`.
## 2026-08-21 — accessible board input landed and awaits owner use

- `2b68103` landed one validated move controller projected through click, drag, touch, keyboard and
  SAN/UCI text entry, a semantic eight-by-eight grid, native Tab/Shift+Tab traversal and physical
  `Alt+C` comparison.
- The permanent interaction floor is now 150 exact cells (six packs × five viewports × five input
  modes), plus a post-gesture semantic-grid assertion and bidirectional whole-drill focus traversal.
- Two implementation regressions were caught before landing: the collapsed text control first
  intercepted board squares, then its non-overlapping repair reduced short-desktop boards below the
  192px floor. The final adjacent sidecar layout clears both instruments.
- Mechanical discharges D1/D2 are complete. `accessible-board-input` is `awaiting D3` on the
  owner's normal device/browser/assistive-technology validation-by-use session; no code work or
  recruited participant study remains.

## 2026-08-21 — evidence-contract-manifest implemented

- F1 compiled one static evidence contract over 19 producers, 93 exact projections, 23 production
  consumer operations and the explicitly experimental `assistance.arrows` orphan. The runtime
  digest is exposed through capabilities and the same compiler runs at startup and in verification.
- Every registered operation now crosses an exported sealed consumer boundary. The bind stage
  found and corrected ten payload/authority collisions ([[D670]]–[[D679]]) rather than hiding them
  behind casts or source/DOM anchors; provider acquisition and evidence production remain
  deliberately outside the consumer census.
- Deterministic voice, Compare and Story now derive prose from declared items rather than parallel
  sentence arrays. Opponent selection admits raw Maia/Stockfish/Syzygy results before they can
  influence a move. F1 does not select relevance, add presets, activate arrows, or migrate content;
  those remain owned by F2/F3 and [[D668]].
- Verification at closeout: `make verify` green (125 files / 806 tests), manifest check green
  (19 / 93 / 23 / 142 bindings), browser green (28 passed, one optional Maia latency test skipped).

## 2026-08-21 — F2 readiness re-derived and semantic-evidence-selection drafted

The post-F1 gate was read from its predicates rather than the old paired Wave-6B label. F2 is open
after R1/R2/A3, O2/O3 and implemented F1; F3 remains closed on O6 and Gate F. D680 records the
stale readiness join. D660 was corrected against the later R2 transfer result: global lift remains
diagnostic and cannot select learner evidence; the deterministic local legal-alternative
denominator is the admitted mechanism after semantic eligibility.

`rfc/semantic-evidence-selection.md` is now draft. It specifies literal operand-preserving events,
consumer-specific eligibility, independent rules events, a parameterised local selector, honest
empty output and the D668 payload seal. It changes no product code, content, schema, migration,
protected design intent or assistance default. Buildability/cross-review precede acceptance.

## 2026-08-21 — CI failure was a missing census-test budget

GitHub verify run 32515030312 failed one assertion-free way: the producerless-error declaration
census took 5.282 s on Node 24 against Vitest's inherited 5 s timeout. Its neighboring whole-tree
tests already declare 20–30 s and the preceding run completed the same 17-test file. D682 records
the CI defect; the test now carries an explicit 20 s budget. No product behavior changed.

Local verification after the repair is complete: the focused census is 17/17 and full
`make verify` is green at 125 files / 806 tests plus all repository parity/manifest/planner checks.
The next pushed commit supplies the Node-24 GitHub confirmation; this pass did not push.

F2's first buildability read then corrected four specification shortcuts before acceptance:
direct events no longer invent derivation sources; the denominator is the complete legal-
alternative population; critical events cannot widen finite budgets; and the old R2 surface
baseline is not attributed to the new event set. The payload-seal migration is re-derived as 38
direct call lines in fourteen production files.

## 2026-08-21 — D682 runtime-family check and D683 F2 correction

- The failed GitHub expression-census case passes under Node 24/Linux: 17/17 for the file and
  4.244 s for the formerly 5 s-limited whole-tree test. Full local `make verify` remains green at
  125 files / 806 tests. Hosted confirmation waits for a pushed commit.
- F2's second buildability read refused a false direct `avoided` event and then refused an
  unregistered multi-source selector object. Avoidance now uses eleven exact
  `derived.semantic_avoidance.*@1` projections over a complete alternative population, retaining
  the signed base family, supporting events and denominator without valence. The initial boundary
  is pinned to 22 direct plus eleven derived projections. D683 is closed in the draft;
  implementation is still unauthorized.

## 2026-08-21 — Node-24/Linux full-path comparison

The emulated amd64 workflow path passed typecheck and 803/806 tests; the repaired census passed in
4.498 s. Three other default-timeout tests exceeded 5 s only under x86 emulation. The actual native
GitHub run passed all three (`pack-authoring`, `application`, `feedback-delivery`) and failed only
the repaired census, so their budgets were not changed on non-representative timing evidence. A
push-triggered hosted run remains the final D682 confirmation; this pass did not push.

## 2026-08-21 — D682 hosted closeout and D684 F2 reproducibility finding

The owner reported CI green; hosted verify run 32518662865 passed on `fb7a147`, closing D682.
The F2 acceptance read then found its R2 imported input existed only as a deleted `/tmp` file. The
digest and report survive, but the 108-game population cannot be rerun from repository bytes. D684
holds F2 acceptance until a bounded CC0 fixture with origin/digest is retained; saved output alone
is not external validation.

## 2026-08-21 — D684 closed; R2 external arm is reproducible

The official archive's first 16 MiB compressed range reproduced the same 108 selected games, nine
12-game strata, 579 decisions and every original report line after the input digest. The 243 KiB
CC0 fixture, extraction helper and exact origin/range/digest manifest are now retained with the R2
harness. Its 3/3 tests pass without external input. F2's external-validation criterion is buildable.

## 2026-08-21 — F2 accepted

On the owner's direction to continue, `semantic-evidence-selection` is accepted after two
buildability reviews and the D684 fixture repair. Implementation may now be planned. Acceptance
does not choose production assistance modules, thresholds, presets or defaults; those remain F5.

## 2026-08-21 — F2 implementation started

`semantic-evidence-selection` is implementing with a five-unit plan. The first unit is the compiled
manifest extension and negative fixtures; no learner-visible behavior changes in that unit.

## 2026-08-21 — F2 semantic evidence selection implemented

`7944ecb` implements and closes `semantic-evidence-selection`: 22 direct operand-preserving events,
eleven registered denominator-bearing avoidance events, 33 research-only eligibility rows, a
complete deterministic legal-alternative selector, exact source adapters and one compiled manifest
of 20/126/25/175 + 33/33/15/1. The retained baseline covers all 754 authored transitions and 579
CC0 decisions without borrowing the legacy R2 volume claims.

The adapter migration exposed and repaired D685 before closeout. Compare/Story prose is again only
registered renderer output over structured admitted evidence; projection operand names match the
runtime payloads and malformed adapters fail. D572, D630, D631's semantic half, D633, D668, D681
and D685 are closed; D632's dependency report ships while its F3/Gate-F content migration remains
open. F5 is now unblocked on F2 but still owns every learner-visible module, preset and default.

## 2026-08-21 — R3 real-packet handoff after F2

The disposable R3 prototype now consumes three runtime-sealed F2 selections rather than pretending
synthetic F-02 prose is compiler evidence. Castling, promotion and checkmate evaluate all **55/55**
legal alternatives and carry five exact facts, IDs, signs, squares and denominators through a typed
adapter; a forged selection object fails. The adapter adds no grade, valence, best move or PV.

The first contact is also a negative finding, D686: after the critical castling and promotion facts,
the research-wide policy fills its second slot with `occupied_defence` and
`direct_attack_count`. Exact plus distinctive is still not learner-significant. F5 must compile a
module-specific eligibility/refusal set before selection and allow empty budget rather than filling
from the research pool. R3's mechanical/real-packet arms are complete; D649 leaves owner use as the
exit. A requested browser visual recheck was unrun because no browser surface was connected; 19/19
executable harness checks pass, and no visual-pass claim was manufactured.

## 2026-08-21 — R7 current Review Map and competitor audit

The first R7 arm is executable at `tools/r7-review-map-harness/` (4/4). Tabiya's strongest fact is
preserved re-entry: Story rewinds and forks inside the same run, so the source continuation and new
attempt both survive. The current surface is not yet the requested Review Map: `review.story` admits
nine projections and zero F2 semantic/avoidance events; ranking is fixed kind priority plus absolute
recorded-eval delta; each moment has one learning action.

Three defects are ledgered. D687: the PNG stamps every source as recorded engine evidence and keeps
only the first sentence. D688: private Story selects ranked top eight while public Story selects the
chronological first eight. D689: F2 events never enter Story, so its landing did not silently create
attack/defence/structure moments. Current sources isolate the transferable pieces: Chess.com's
guided ritual, Lichess's verdict-hidden retry, Beacon's candidate/reply continuity and Quackmate's
one-moment/share ritual. Engine grades, best-move defaults and ungrounded causal prose remain
refused. The next R7 unit is the same-game three-policy instrument; no F6 RFC is authorized.

## 2026-08-21 — R7 same-mainline policy comparison

The disposable R7 instrument ran current Story, a one-pivot recorded-engine baseline and a narrow
mixed-exact policy over the same eight stratified authored mainlines; five focused checks pass. The
mixed policy applies module eligibility before F2 selection, keeps at most one fact per node and
gives every retained item a retry/branch action. It honestly produces zero on two short games, but
still produces **13 and 16** moments on the 52/60-ply trajectories. D690 records the architectural
result: local evidence selection cannot double as the whole-game Review Map selector. F6 needs a
second declared stage with a game-level budget and honest unused capacity.

The engine baseline exposed a separate reach constraint. Consecutive retained evaluations cover
**20/20 opening** mainlines and **0/13 middlegame, 0/14 endgame and 0/2 cross-phase** mainlines; full
mainline coverage has the same split. D691 records that an engine pivot cannot be a universal Review
prerequisite at HEAD. R7's mechanical and desk arms are complete. O7 still owns the admitted
families, whole-game bound, engine role and shared action/provenance contract; owner use remains the
experiential exit.

## 2026-08-21 — R8 current theory↔drill join audit

The disposable R8 harness pinned the current identity graph over 50 authored draft packs and 25
official shapes. The substrate is substantial: 38 packs carry 44 shape references across 21 shapes,
and 82 claim references name 12 principles. The server already reverse-resolves an encountered
shape to matching pack IDs. The learner workflow fails at the final edges: Learn discards the pack
ID and opens generic `/play`; the reverse query includes three `prospective` references; ShapePanel
has no drill door; Library has no theory catalogue and its pack rows are inert; Review declares no
theory/drill link form. D692, D693 and D695 record those failures.

Opening identity is a different reach gap. The emitter produced 52 cited identity records across
nine unpublished candidates, while the 50 authored draft packs carry zero and the F1 projection is
correctly authoring-only. D694 records the boundary rather than treating the candidate shelf as
runtime evidence. The current-product R8 arm is complete; desk comparison and a disposable
fixed-position applicability prototype are next. Gate F and the content scale hold remain intact.

## 2026-08-21 — R8 competitor transfer and exact applicability prototype

The targeted desk arm separated four useful workflow shapes from their grading assumptions:
Chess.com's adjacent Learn/Practice/Retry doors, ChessTempo's repertoire-branch continuity,
Listudy's in-context comments/hints/reset/analyze controls, and Lichess's open study/practice
substrate. None supplies a law-8-safe middlegame applicability authority; the common transferable
unit is a stable variation/position identity, not “related content.” Sources and refusals are in
`theory-drill-current-joins.md`.

The fixed-position prototype passes 5/5. It resolves `carlsbad` to a versioned theory entry plus two
present pack targets; retains `hanging-pawns` as theory with no relevant pack; excludes prospective
shape refs; permits principle lookup only from an exact anchored claim; and keeps candidate opening
records non-launchable. Every result preserves the source run/node. The opening index adds D696:
52 records map to 49 transposition keys, with three French Advance positions carrying both parent
and Main Line identities. Applicability is a set; display specificity needs a declared rule.

R8's mechanical/desk arms are complete. `theory-drill/o5-o6-handoff.md` makes O5 ready and splits
O6's compatibility/budget decision from final pilot membership. D697 records the former graph cycle:
F3 waited on all of O6 while F7/Gate F/R10 waited downstream on F3. Gate F remains failed and the
content scale hold remains active.

## 2026-08-21 — R11 completion reconciled with the participant descope

R11's mechanical and desk arms are complete: the production sampler reconstruction, five policy
transforms, two refused book arms and the integrity-checked 42-branch packet all stand. D649 had
already moved recruited blind review out of scope while retaining owner use, but the research and
execution queues still treated recruitment as a blocker. D698 records and closes that planning
contradiction.

The population claims remain deliberately unmet: owner use may reject an incoherent profile but
cannot establish H5/C5. O8 is now ready on the narrower evidence the product actually has. Its
handoff recommends one composable policy stack, an honest baseline/guarded/pawn-heavy 1.0 roster,
separate controlled/observed/presentation traits, explicit band calibration and no repertoire,
memory or named style claim until its own evidence exists.

## 2026-08-21 — R13 grounded coaching mechanical/code arm complete

The focused two-test instrument establishes the smallest safe longitudinal card: versioned
identity, occurrence/opportunity, exact source, complete-vs-shown count and exact or honestly empty
pack/theory applicability. Its deterministic Carlsbad example passes; label-only merge, missing
denominator, source-less count, ungrounded action and diagnostic/advice vocabulary refuse.

The current production path cannot populate that contract across games. Imported runs never enter
progress, F2 semantic events do not persist there, existing aggregates drop source rows and
opportunity denominators, and shape recommendations keep run IDs but not firing nodes. The corpus
adds a separate identity defect: 199 concept references contain 25 cross-pack reused raw identities,
while the resolver stores all 199 as pack-scoped keys. D699-D702 own the gaps.

R13's mechanical/code arm is complete and O9 is ready. The handoff recommends a personal-
observation ledger feeding separate Observed habit, Recurring situation and Rehearsal result
modules; deterministic rendering is authoritative and optional LLM prose may only paraphrase the
sealed card. Owner use remains the quality check, not a pretext for inventing a weakness ranking.

## 2026-08-21 — R15/R16 professional workflow conformance complete

The 24-cell live-kind × role × disclosure matrix and current-surface audit pass. Stream and Match
have explicit preference profiles; Academy still maps to Position. Permission ignores live kind:
after disclosure solo/host reach human/corpus evidence while participant/spectator remain locked
and sight-capped. D80's host-seat match asymmetry is reproduced and remains owned by the accepted
Teacher RFC.

The Stream overlay is a shared-state projection with withholding and adapter attribution, 2–8 vote
options and no evidence/provider call. No Twitch/YouTube bridge or editorial delay ships; polling
is transport only. The accepted async Teacher consent contract remains authoritative, while the
queue had incorrectly blocked it behind R15/O11 after D649 descoped recruitment. D703-D705 record
the ownership and scope corrections.

R15/R16's mechanical/code/desk arms are complete and O11 is ready. The handoff recommends explicit
Academy and Stream compositions, the generic bounded adapter boundary, no 1.0 editorial Stream
delay, no per-viewer truth and no class-wide progress/weakness dashboard. R17 is now executable.

## 2026-08-21 — R17 social-play boundary and O12 handoff complete

The current product has two unequal social paths. Native friend play is a complete casual learning
primitive: side-to-move possession, authorship, one-use joining and consensual
pause→rehearse→compare all remain in one run. It has no clocks, ratings, public matchmaking,
resignation/draw verbs, moderation or fair-play enforcement and must not imply them. Position Arena
preserves imported branches but its external half is only an opaque HTTPS string plus manually
pasted PGN; no provider, challenge/game identity or automatic result return exists. D706-D707 own
those boundaries.

Official Lichess OpenAPI 2.0.165 already exposes the expensive competitive substrate: challenge
terms, clocks, FEN input, public seeks, event/game streams, export and bulk pairing, with OAuth and
rate/stream constraints. The disposable R17 harness proves two minimum contracts: a complete
source→provider→returned-run identity, and a local bot event whose entrants carry exact policy
versions and whose games are ordinary Review runs. URL-only and unversioned controls refuse. The
first instrument run found and repaired two checker defects before the result was accepted.

R17's mechanical/code/desk arms are complete. O12 is ready on the costed hybrid recommendation:
retain private native casual matches; implement an optional Lichess-first typed round trip with
manual provider-off fallback; admit a bounded local bot event only after O8/F8; and keep native
public pools, human tournaments, anti-cheat and federation outside 1.0. D708-D710 carry the event,
scope and provider findings. R19 is no longer generic debt; it waits on explicit post-1.0 promotion.

## 2026-08-22 — teacher surface implemented

`teacher-surface` landed at storage migration 24 and moved to the RFC archive. Classrooms now
provide reusable rosters, registered-pack assignments, explicit learner submission consent,
bounded teacher grants, visible revoke/expiry state and scheduled academy sessions. Enrolment
alone remains powerless. The review rail derives from submission provenance + terminal outcome +
no open live session, while an open native-match seat independently caps both players.

The landing also closed D80, D92, D93, D463 and D703. Source guards pin ten grant readers and
thirteen current grant-writing statements (plus the legacy migration distinction), and focused
fixtures cover owner/learner account deletion, expiry, promotion divergence, route-level consent
and post-close seat resolution. Canonical behaviour is in `docs/classrooms.md`; the later
portable-account-data RFC still owns D657's explicitly recorded deletion-policy supersession.

## 2026-08-22 — owner-use rejection of the play experience; the evidence-foundation + UX program opens

The owner used the app and rejected the incumbent play experience in six named defects
(stacked-above-board evidence, board shrinkage, clipped overflow, raw classifier/UCI/percentage
leakage, plumbing-as-assistance, 192 px board as "proof"). Recorded as D717 with the standing
instruction that a UX pass means a dependency audit, not a reskin. Governing distinction:
F1/F2 established authority and mechanics, not completeness or a learner experience. The
bottom-up program (collectors → typed evidence → module bindings → layout/presets) is briefed
at planning/evidence-foundation-ux/plan.md; Phase 1 (HEAD-derived gap matrix) and Phase 2
(collector re-verification) audits commissioned this session. No corpus expansion until Gate F.

## 2026-08-22 — middlegame breadth and style proof burdens separated

The Phase-2 collector audit remains the correct SEE-first implementation wave, but a cross-source
research pass found it was not an exhaustive middlegame ontology. D723-D728 now name the missing
families: square denial/restriction, pawn tension and levers, activity/coordination and file
control, king pressure and material imbalance, and multi-edge persistence. The owner's
`...Bg4, h3, ...Bh5` example is recorded as a mandatory sequence fixture: pawn attack and square
denial occur, the bishop retreats, and the relative queen-line pressure survives; “tempo,”
“prophylaxis,” “forced” and “best” remain refused without their separate evidence joins.

The same pass split player evidence into per-game observations, opportunity-normalized stable
habits, and named personalities. Existing R12 data permits continuous habit cards but not natural
types; D729 requires temporal/time-control transfer, rating separation, intervals and privacy for
each new axis. Phase 2b is added as a disposable-probe/measurement arm before the later additive
collector waves. No production code or content changed.

## 2026-08-22 — first Phase-2b middlegame breadth probe

The disposable D723 harness tested seven predeclared exact/convention facts across 754 authored
spine transitions and 579 decisions from the sealed imported CC0 sample, comparing each played
move with every distinct legal-result alternative. Pawn harassment is the sharpest candidate in
both populations (3.63× authored, 3.18× imported). Generic pawn contact is nearly background
(1.03×/1.19×), and relative line constraints reverse direction (0.74×/1.33×), so neither may be
treated as universally interesting. The owner fixture `...Bg4 h3 ...Bh5` and broken-ray,
changed-target, two-blocker, missing-target and capture-screen negatives pass.

The result advances Phase 2b but does not close it: majority/blockade, coordination/battery, king
shelter, material imbalance, defender manipulation and corpus-scale multi-edge persistence remain.
No production schema, collector, learner text or content changed. A duplicate ledger identifier
introduced by the concurrent ruling commit was corrected: the new owner ruling is D745 and the
earlier layout trace remains D718.

## 2026-08-22 — Phase-2b breadth probe expanded to relationships and sequences

The predeclared instrument expanded from seven to eleven one-edge probes and added a genuine
consecutive-edge census. Newly locked pawn pairs measure 3.89×/2.08× authored/imported lift and
opponent defence-edge loss 2.66×/3.36×. Generic same-color slider alignment measures 0.82×/0.99×:
it is an operand, not a learner-facing “battery” label. The disclosed king-shelter window reverses
from 1.13× authored to 0.72× imported, another reason selection cannot use one global positive
rank.

Across 692 authored branch pairs and 6,883 imported pairs, 19/180 attacked minors immediately
relocated after pawn harassment; only 3/6 retained the same screened valuable-target relation.
D746-D748 record the selection, sequence and defender-identity consequences. The harness now
pins positive/hard-negative fixtures for locking, alignment, shelter and defence edges as well as
the original line relation. Phase 2b remains open only for semantics requiring SEE/search or a
stronger declared convention; no production code or content changed.

## 2026-08-22 — legal local exchange falsifies the pseudo-SEE prerequisite

The predeclared D730 disposable instrument evaluated 39,038 played/legal-alternative edges across
717 authored decisions and 577 decisions from the sealed imported CC0 sample. Legal
recapture-only minimax runs at 0.038–0.041 ms per edge, excludes a pinned recapturer in the named
fixture, preserves an X-ray recapture and finds geometry/exchange disagreements in both
populations. `moved_piece_en_prise` is robustly negative-primary at 0.36× (95% 0.28–0.45)
authored and 0.57× (0.47–0.69) imported. Exchange-filtered double attack rises from geometry's
0.72×/1.00× to 1.72×/1.96×; only the imported interval excludes 1, so the exact event receives no
universal positive-primary disposition.

The result returned the tactical-collectors draft rather than merely changing its implementation.
The audit's pseudo swap admitted pinned recapturers; threat incorrectly declared a pass state total;
trapped-destination exchange was undefined; local fork consequence overclaimed “wins material”;
and gated runtime opening identity made the RFC impossible to complete as one accepted unit. The
amended draft uses `legal-exchange@1`, records exact abstentions and operands, renames the local
fork consequence, splits opening identity back to D743/R8/F7, adds a closed ten-site production
census and corrects Appendix A to 28 projections. D730 is updated and D749–D753 record the fork
and review defects. The RFC remains draft pending independent buildability review; no production
or content code changed, and Phase 2b breadth remains open beyond this prerequisite.

## 2026-08-22 — second Wave-B probe separates useful joins from background truth

The D754 disposable instrument added nine predeclared event probes over the same 717/577 eligible
authored/imported decisions and 19,619/18,842 legal alternatives, with paired-position bootstrap
intervals. Two candidates survive both populations: defender-edge loss joined to a positive legal
exchange on the retained target measures 4.50×/6.52× on per-probe eligible denominators, and increased P/N/B/R/Q role asymmetry
measures 2.47×/4.35×. The broader material-signature event is higher still at 3.84×/5.05× but is
recorded as a selection warning: captures changing inventory are distinctive without being a
useful sentence.

Six plausible chess labels did not earn global presentation. A pawn newly contesting an empty
minor destination is almost exact background (0.96×/0.95×); connected rooks are 0.82×/1.12×;
majority-wing advances 0.76×/0.69×; direct blockaders reverse 0.62×/1.10×; target-bearing slider
coordination reverses 2.19×/0.25× on only 2/1 played positives; and the shelter+king-zone
composite fires on zero authored played edges. They remain exact operands for hover, theory,
phase-specific modules, bot features or opportunity-normalized habits—not default hints.

The shared research exchange implementation now feeds D730 and D754, and D730's focused suite
passes four tests including the second buildability review's paired pin and capture-destination
controls. **Append-only correction to the preceding D730 log entry:** the total is **39,755**
played-plus-alternative edges (717 + 19,619 + 577 + 18,842), not 39,038; the latter accidentally
summed neither the two full populations nor only their alternatives. D754 uses per-probe
denominators: the defender-loss join abstains on 42/717 authored and 32/577 imported played rows,
plus 463/19,619 and 402/18,842 alternatives, because the disclosed pass state is invalid; none of
those abstentions are counted as false. A focused D730 rerun also widened the observed timing band
slightly to 0.038–0.043 ms/edge; this remains feasibility evidence, not a production guarantee.
Those controls tightened the tactical RFC again: a legal along-ray capture of the pinner
must be admitted, and `trapped@1` values capture moves by their own exchange result rather than
post-arrival capturability. D754 and D759–D762 record the outcomes. Phase 2b remains open for
legal per-piece mobility, lever/passer conversion, decomposed king state, forcing-reply/search
semantics and identity-preserving three-edge sequences; no production or content code changed.

## 2026-08-22 — pawn “prevention” splits into legal reach and local safety

D771 corrected the question before measuring it: a pawn attack does not make a bishop or knight
move illegal. The disposable probe instead retains a named minor and the same legal quiet
destination before/after, then asks whether the square changed from locally non-losing to a
positive `legal-exchange@1` capture by the moved pawn. The fixture pins both facts: `...Ne5–g4`
remains legal after `h3`, but the h3-pawn now wins the knight locally; a square already unsafe to a
rook is the hard negative.

Across 717 authored and 577 imported eligible decisions, the stronger safety event measures
**1.00×** (95% 0.76–1.26) and **1.02×** (0.74–1.34). It reduces the geometry event's rate but does
not distinguish played moves from legal alternatives. The disposition is therefore on-demand
square evidence for hover/touch, theory joins, bot features and opportunity-normalized habits—not
a default hint and never “prevented,” intent, force or move quality. Occupied-minor harassment
remains the separate 3.63×/3.18× event. D771 is answered; D772 retains the multi-edge consequence
question. Three focused tests pass; no production or authored content changed.

## 2026-08-22 — three-edge identity works; named tactical causality does not come free

D772 followed exact defender and target identities through move, reply and next move. In 6,775
sealed imported three-ply windows, 29 lose a defender edge first and positively capture the same
retained target third; 26 of those literally capture the exact defender first. Another 13 newly
expose the exact defender to a positive local capture, observe it relocate and lose its former edge,
then positively capture the same target. Four fixtures reject target replacement and locally losing
final captures as well as pinning both positive forms.

The literal sequence vocabulary is therefore feasible and grounded. “Removal,” “deflection,”
“overload,” “forced,” intent and whole-position value are not: observed order does not establish
causality or reply coverage, and local exchange is not evaluation. The intended learner surface is
one compact three-move Review/drill module over retained operands, never three raw strings and never
an LLM-supplied adjective.

The authored corpus contains 0/622 examples. D773 records that permanent sequence work needs
canonical positive/disagreement fixtures before pack adoption; no pack was relabelled. The shared
research population projection now supplies sampled decisions and full paths without a fourth
independent parser. D772's four focused tests and the refactored D771 three-test suite pass; no
production or authored content changed. Phase 2b remains open for pawn lever/passer conversion,
decomposed king state, broader individual mobility and bounded reply/search semantics.

## 2026-08-22 — pawn conversion survives; passer advancement is phase-bound

D774 replaced generic pawn-contact prose with five pinned passed-pawn transitions. The first
fixed-ply run produced a dangerous disagreement: authored packs called passed-pawn advances
18.81× while the imported sample had zero played advances. Rather than publish the authored corpus's
purpose as a universal chess prior, the instrument widened the same sealed games to every mainline
decision and split them into disclosed ply bands.

The robust foundation events are a moved pawn becoming passed (**12.46× / 13.45× / 7.72×**) and a
capture creating that moved passer (**21.18× / 14.45× / 11.58×**) over plies
1–20 / 21–40 / 41+. Passed-pawn advance is 0 played / 1.03× / 3.17×; protected and connected passer
gains become reliable only late at 2.68×/2.73×. Therefore passage creation earns exact identities,
while advancement/protection/connection require phase-aware module eligibility. None permits danger,
winning, quality, intent or plan language.

Three focused fixtures pass, including a blocking adjacent pawn and capture-created connected pair.
D774–D777 record the result and the wider lesson: current packs omit a strong human event and
overrepresent a phase-specific one, so pack coverage cannot define foundation completeness. No
production or authored content changed. Phase 2b remains open for candidate-passers/lever timing,
decomposed king state, broader individual mobility and bounded reply/search semantics.

## 2026-08-22 — king state decomposes; two headline signals reduce to existing joins

D778 measured shelter, adjacent legal escapes, distinct zone attackers/defenders and direct slider
checks separately after the earlier king-exposure conjunction produced zero authored positives. Two
initially strong readings were not accepted at face value. King-zone defender loss measured
6.07×/5.12×/3.94× across imported horizon bands, but became 0.00×/0.07×/0.38× when captures were
excluded: the honest reusable event is capture identity + the captured piece's prior zone-defender
role. King relocation to more shelter reduced chiefly to castling: 10.08×/8.19×/5.31× for the
castling subset versus 0.32×/0.87×/1.57× otherwise. Neither earns a duplicate producer.

Opponent legal-escape reduction, direct slider check and increased zone attackers are uncertain or
background at plies 1–20, then stable at 2.34×/2.19×, 2.67×/2.52× and 1.71×/1.80× in the middle/
later bands. Shelter loss and mover escape gain remain weak/mixed. The disposition is phase-aware
operands plus explicit joins, never “king unsafe,” “exposed,” attack quality or mating-net prose.
D778–D782 record the results. Three focused tests pass over 39 measured one-edge probes in the
program; no production or authored content changed. Phase 2b remains open for candidate-passer/
lever timing, broader individual mobility and bounded reply/search semantics.

## 2026-08-22 — D667 imported story titles become learner-relative

With F1's byte-preservation constraint discharged, the story title now carries the learner side and
applies the same `learnerLost` rule already used by the neighboring outcome projection. The paired
regression fixes the trust leak directly: imported `1-0` renders “Won” for a White learner and “The
turning point” for a Black learner. No evidence semantics or title ranking changed.

## 2026-08-22 — exact mobility lands as infrastructure, not another noisy label

D783 retained exact bishop/knight/rook/queen identities and their before/after legal and
`legal-exchange@1`-non-losing destination sets over 717 authored and 577 sealed imported decisions.
Generic legal restriction is background (0.71×/1.03×); safe reduction is mild (1.14×/1.35×) and
returns to background without captures (0.93×/1.05×). Moved-piece safe gain is stable but modest
(1.20×/1.29×). A zero-safe transition reaches 2.58× imported but remains uncertain authored.

The collector consequence is exact sets and identities for hover/joins, not count-only prose.
“Trapped,” dominated, forced, good and intent remain refused until separate attack and bounded-reply
predicates exist. Three focused fixtures/censuses pass; no production or authored content changed.
Phase 2b now has 45 one-edge probes and remains open only for candidate-passer/lever timing and
bounded reply/search semantics.

## 2026-08-22 — pawn status, lever action and consequence are separated

D788 grounded a deliberately named `candidate-majority@1` convention in historical Stockfish
source, disclosed the omitted backward-pawn classifier, and measured four one-edge events plus three
retained sequences. Executing an existing pawn contact is 9.82× authored / 15.07× imported but is
still only pawn-capture identity. Creating a contact is background (1.03×/.90×). Candidate gain is
2.80×/3.30× and strongest early; advancement fades with horizon.

Across 622/6,775 authored/imported triples, create→reply→same-pawn execution appears 1/45 times and
candidate→passed on the next own move 0/1. The foundation therefore admits exact status/action
operands and retained identities, while refusing break timing, favorable liquidation, breakthrough
and plan prose. Three focused tests pass; no production or authored content changed. Phase 2b now
has 49 one-edge probes and remains open only for bounded reply/search semantics.

## 2026-08-22 — bounded replies close Phase 2b by making “forcing” narrower

D794 enumerated every legal reply over 717 authored and 577 sealed imported decisions plus 38,461
alternatives. Reply breadth is exact but population-shaped (played means 27.08/34.45;
only-reply 5.16%/.52%). Generic positive-capture threats are background (.91×/1.04×) and the same
threat survives every reply only 1/0 times. Meaningful moved-piece double attacks occur 10/29 times;
the RFC's all-reply consequence survives 0/2.

The result admits a shared exact reply/refutation object and refuses “forcing,” unavoidable, best,
winning and deeper inevitability. Four focused tests pass, including positive/refutable fork and
threat controls. The full research pass costs ~.26/.39 ms per candidate edge in the disposable
harness. No production or authored content changed. Phase 2b is complete; next work is reconciling
these residuals into the collector RFC and its executable queue.

## 2026-08-22 — collector architecture reconciled into two explicit waves

The Phase-2b closeout changed the tactical RFC where its own semantics depended on the new evidence:
it now has 30 closed projection ids, including one exact `reply_breadth@1` authority and an exact
check event; threat/fork dispositions carry D794's measured rarity; A5 preserves canonical
non-vacuity without erasing honest population zeroes. Its review packet is refreshed and it remains
draft pending independent buildability review and owner acceptance.

D802–D807 route the remaining positional breadth into a separate 18-projection
`breadth-collectors` draft: exact square controllers/mobility sets, pawn status/events, retained
pawn/defender sequences, material-role state, king operands and open-file occupancy. The split keeps
the Wave-A RFC bounded while ensuring Phase 2b is executable work rather than a dossier shelf. Both
drafts claim no shared versioned resource and land research/inspector-only. Production remains
blocked on acceptance; breadth implementation follows tactical because it consumes legal exchange
and reply breadth. The draft also consumes the existing pawn-contact, passed-pawn, piece-count and
open/half-open-file authorities rather than creating duplicate meanings.

## 2026-08-22 — bot-policy namespace and F8 boundary re-derived

The bot-policy block had reused D669–D679 after F1 already owned those ids. The closed F1 history
keeps its numbers; the bot lane is renumbered to D810–D820 and living research/planning/RFC
citations now distinguish the two. D809 remains open for an executable duplicate-id guard rather
than treating the one-time repair as prevention.

The current first-party Chessiverse mechanism was rechecked and still supports R11's narrower
reading: generated candidates plus a stronger-engine curator, post-hoc observed styles, per-bot and
statistical books, and human-scale anchor bots. A HEAD selector audit then found three concrete F8
seams: the request rejects policy-stack fields (D821), the persisted selection lacks layer/feature/
contribution/calibration identities (D822), and Maia chooses `bestmove` internally while the branch
seed is not honored by generation (D823). `f8-dependency-map.md` routes the bot wave behind O8 and
the two collector landings, while leaving salience/sharpness/multi-band experiments parallel and
campaign independent.

## 2026-08-22 — bot candidate sharpness measured; multi-band Maia feature refused

D816 reused the fixed R9/R11 279-position snapshot, R9's committed explorer counts and R4's
full-legal-move Stockfish depth-12 probe. All engine cells completed; 633/837 position-band cells
have nonzero explorer population and the mapped move list covers a median 99.66% of games. Legal
severe-choice breadth tracks observed severe human mass consistently by band (Spearman
.524/.514/.556); near-best breadth points the other way (−.486/−.481/−.589). Best/second gap is
weaker. The projection is admitted only as a typed opponent-selection distribution with engine
budget and completeness, never as an “only move” label or learner grade. The corpus supports the
opening/cross-phase result; its 35 middlegame cells are weak and it has no explorer-covered endgame
cells, so no broader claim was made.

D817 closed as a measured refusal without duplicating engine work. The earlier sealed Maia/WDL
experiment already compared band-to-band Maia policy movement with human population movement over
1,171–1,283 shared move rows: Pearson .021–.044 and sign agreement 47–52%. Runtime multi-band
queries are removed from F8. D815 remains open behind exact tactical-identity landing; current
`structuralDelta` cannot establish the threat relation its proposed salience experiment claims to
measure, so the first F8 stack excludes it rather than shipping an unmeasured folklore weight.

## 2026-08-22 — joint collector-RFC buildability pass returned and repaired three seams

The 30-id tactical and 18-id breadth drafts were reviewed as one dependency graph. Both appendices
are unique and register-silent, and every Breadth prerequisite resolves to HEAD or Wave A. Three
cross-contract defects blocked acceptance: “consequence” was not a member of the closed manifest
role union (D824); recorded-run salience was attributed to a local rules threat projection without
its input/grounding (D825); and Breadth attempted to add shelter operands to Wave A's closed
castling event (D826).

The drafts now repair all three. Every tactical id has a literal role; a refutable fork is a false
predicate retaining the replies rather than an abstention. Threat emits exact identity only and
D815 remains the later measured recorded-run derivation. Castling shelter is a later join over two
immutable authorities, and king-state keeps conservative convention grounding. Tactical has now
received a separate Codex buildability pass and awaits the owner/Claude acceptance action. Breadth
was originally Codex-authored, so this same-agent pass does not impersonate its required independent
acceptance review; its five-check handoff is recorded in `collector-rfc-joint-review.md`. No
implementation was authorized.

## 2026-08-22 — the D439 campaign amendments land, six days late and honestly

The six changes the boss ruling named on 2026-08-16 are written into design/06-campaign.md
(claude on the ruling, law 5). The doc now owns its sharpest tension in its own voice: the
campaign's climax act cannot carry a rated result. One fork the ruling left open is written
as claude-derived-with-veto-hook (D837), one collision as the open question the ruling's
iff-clause made it (rewind vs R11). Corpus figures re-derived at HEAD rather than copied.
learner-rating Discharge D1 flips in the same commit. Rows D836-D838.

## 2026-08-22 — breadth collectors returned at the payload boundary

The independent buildability review kept the RFC's 18-id scope and silent detector/significance
split, then returned nine seams that the prior name-level dependency census could not see. Two
derived events named authorities whose payloads cannot prove their claim: aggregate
`occupied_defence` cannot represent loss of one exact defender edge, and contact creation cannot
prove execution of a pre-existing pawn contact. Three-edge continuations were described as three
nodes despite containing four board states. Six convention boundaries also admitted different
implementations: legal control on empty/occupied squares, pressure-line colors and retained
identity, pawn relation/rank predicates, en-passant's displaced captured square and half-open-file
color. D851–D859 route one author amendment; no owner product ruling and no implementation were
invented.

## 2026-08-22 — correction: the Breadth return was author-side, not independent

The preceding entry's findings stand, but its review label was false: `breadth-collectors.md` is
Codex-authored and the pass was performed by Codex. The living review/register now call it an
author-side buildability return. D851–D859 still require amendment; Claude's independent review
remains required afterward. D860 records the correction rather than rewriting the append-only log.

## 2026-08-22 — Breadth author amendment answers D851–D859

The Codex-authored draft now pins the nine returned payload seams. Legal control is actual
`allDests()` intersected with pseudo control, so no hypothetical occupant is invented; defender
loss consumes exact pseudo-controller deltas; contact execution consumes before-state contact;
sequence kinds carry literal two-/three-edge and three/four-node horizons. Pressure/pawn predicates
copy their harness boundaries, and en-passant square plus mover-relative half-open-file joins are
explicit. The rows remain open because the same author cannot independently validate its repair;
Claude review is still required before acceptance and implementation.

## 2026-08-22 — correction: Breadth process row renumbered D860→D869

The titled-player/Chessable research lane committed D860–D868 while the Breadth process correction
was landing, creating a duplicate D860. The Breadth row is now D869; its substance is unchanged.
The earlier append-only reference remains as history rather than being rewritten.

## 2026-08-22 — correction: Breadth process row finally assigned D871

The Solitaire Chess ruling landed D869–D870 before the first collision repair committed. The
Breadth process-only row therefore moves once more, from D869 to D871. Both earlier references
remain in this append-only log; the living register and planning pointers now use D871.

## 2026-08-22 — the basic semantic-tactics foundation is opened as Wave C

D872 corrects the earlier scope boundary: overload, defender removal/deflection, interference,
clearance, zwischenzug, mating patterns and promotion threats are not optional “deep” enrichment.
They are basic 1.0 semantic evidence. Waves A/B provide their exact operand substrate; Wave C now
owns the separately falsified consequence semantics, opening/theory adapters and Review engine
operands in `planning/evidence-foundation-ux/wave-c-foundation-closure.md`. F5 may draft its module
architecture after A/B, but full Support/Review acceptance cannot claim semantic breadth while the
admitted Wave-C set is absent. Content remains held behind Gate F and capability negotiation.

## 2026-08-22 — Wave-C Stage 0/1 finds exact basic tactic sequences and no authored witnesses

The external arm measured 250,587 complete Lichess puzzle records plus one rejected truncated tail.
Defender/line themes have median 3–5-ply and p90 5–7-ply solution horizons; quiet/promotion reach a
9-ply p90; several families co-tag 24–30%; overload has zero records because the current upstream
tagger returns false. The exact observed-line arm then passes canonical/hard-negative fixtures and
finds, over 6,775 imported triples, 26 defender removals, 13 relocations, 5 overload exploitations,
23 clearances and 3 interferences; 6,667 quads contain 7 exact check-zwischenzugs. All six families
have zero authored-path witnesses. These numbers prove computability and fixture debt, not force,
intent or value. The counterfactual/live-support arm remains next.

## 2026-08-22 — Wave-C Stage 2 refutes all-reply survival as the tactic-name floor

The complete-one-reply arm finds exact initiations at real scale—authored/imported defender removal
46/87 rows, clearance 24/42 and interference 0/3—but the same retained target survives every legal
reply in only 1 imported removal and zero other cells. Requiring that proof before naming the basic
event would suppress the whole semantic layer. The corrected contract separates exact relation
events from reply-qualified consequences: “removed this defender/cleared this ray/interfered with
this defence” is grounded by retained operands; “persistent/unavoidable under every reply” requires
the rare stronger projection. Support may show the first at its allowed answer distance without
giving a move; the module ceiling governs presentation.

## 2026-08-22 — Wave-C king/promotion arm splits availability, persistence and outcome

Exact mate on the mover's next turn after every legal reply occurs on 4/754 authored edges and
0/579 imported fixed-sample edges. Seventh-rank promotion is available under the disclosed pass
convention on 13 authored and 1 imported edge, but remains legal after every reply on only one
authored edge and zero imported edges. The one persistent case is the existing pawn-breakthrough
pack. D832 therefore has a measured repair path: promotion pressure retains distance/control/
blockers plus exact pass-availability and all-reply flags; an underspecified rule-of-the-square
verdict does not masquerade as outcome, and Syzygy keeps outcome authority in-domain.

## 2026-08-22 — Wave-C opening identity splits live applicability from game history

The pinned five-file catalogue contains 3,810 rows, correcting two living 3,627-row claims. Its
named endpoints are unexpectedly clean—3,810 unique transposition keys, zero ambiguous endpoint
identities—but all-prefix indexing yields 7,854 keys and up to 2,023 descendant opening names at
one prefix. On 108 fixed imported games, named endpoints cover 401/6,991 nodes (5.7%), any catalogue
path covers 527 (7.5%), and the deepest named match is median/p90 ply 4/8. Every game later leaves
its last named endpoint, so a sticky live opening label is stale in 108/108 games. C3 therefore
hands an RFC three separate facts: exact current named endpoint, current catalogue membership, and
retrospective deepest named endpoint reached. Absence of an endpoint is not “out of book,” and
neither FTS nor an LLM may invent applicability.

## 2026-08-22 — external themes validate one exact tactic and refute three aliases

Every positive row for seven Lichess themes plus a deterministic 1/20 tag-negative control was run
through the exact observed-event predicates. Defender removal reaches 1,638/1,642
`capturingDefender` tags (99.8%) with 2.3% control firing. Exact interference is conservative
(37.2%) but highly selective (.1% control); check-zwischenzug reaches 68.5% of broad `intermezzo`
with .6% control firing. Three convenient aliases fail: defender relocation reaches only 4.5% of
`deflection` and .5% of `attraction`, while ray-vacating capture reaches 1.1% of `clearance` and
fires in 3.9% of its tag-negative controls. The source tagger confirms these are different
algorithms, not just thresholds. D902 therefore requires distinct exact names/contracts instead of
loosening a detector to imitate broad generated labels. Upstream still emits zero overload tags,
so overload keeps fixture/corpus authority rather than a fake external oracle.

## 2026-08-22 — the split tactic contracts recover breadth without recovering noise

Three separately retained event contracts were added to the disposable harness and run over the
same positives/control. Defender-duty displacement after bait/check reaches 93.0% of `deflection`
tags with 3.1% control firing; heavy-piece attraction with check/capture follow-through reaches
99.9% with 6/12,094 controls; square vacated for a later slider reaches 98.3% with 2.7% controls.
The attraction negative arm caught the important failure: a first draft reached 100% of tags but
also 19.0% of controls, and only became admissible after restoring the attracted role and actual
consequence. Wave C therefore carries six distinct facts where a shallow taxonomy would carry
three words: duty relocation, exact deflection, ray-blocker clearance, square clearance, exact
attraction and reply-qualified variants. Familiar vocabulary is retained without making one noisy
classifier responsible for every meaning.

## 2026-08-22 — bounded mating nets clear the basic foundation through four

A complete legal-tree instrument fixes the candidate first move, searches future attacker moves,
and requires mate against every defender reply. Deterministic source samples prove 240/240
mate-in-2, 240/240 mate-in-3 and 120/120 mate-in-4 rows; all 600 adjacent deeper controls refute at
the shallower horizon; none hit the 250,000-node cap. Mate-in-4 proof cost is median 635, p90 4,716,
max 87,255 nodes. The five-depth boundary explains its own anomalies: upstream `mateIn5` means
five **or more**, not exact five. Testing 24 of that bucket at depth five proves 19, refutes two
longer lines and abstains three at the cap. D903 admits exact mate-through-four as a basic
versioned primitive and requires proved/refuted/budget-exhausted with retained proof/refutation.
“Mating net” may render that fact; king-zone and escape-count deltas cannot manufacture it.

## 2026-08-22 — correction: bounded mating-net row is D906, not D903

The learner-modules cross-review claimed D903–D905 while the bounded mate instrument was running.
The living mating-net row and Wave-C pointers now use D906. The preceding D903 reference remains as
append-only collision history; no research result or contract changed.

## 2026-08-22 — promotion race keeps exact geometry and refuses a geometric winner

The 12 recorded Syzygy sidecars yield 288 unique FENs, 157 pawn-bearing and 49 pure pawn endings.
The result is the counterexample the vague `ruleOfSquareVerdict` needed: 23 positions with a
side-to-move seventh-rank pawn split 11 win / 1 draw / 11 loss; three immediate legal-promotion
positions include a draw; and a baseline that accounts for side to move, clear paths and initial
double pushes agrees with Syzygy on only 7/10 two-sided races, including two loss→win inversions.
D907 therefore admits exact per-pawn geometry and exact race ordering as description, joins
Syzygy category/DTZ for outcome in range, and abstains on outcome outside it. It does not discard
the primitives: Support can say both pawns are racing or expose distance without claiming the
winner, Review can add the tablebase result, and bots can consume the exact joined authority.

## 2026-08-22 — correction: Wave-C result rows move to D908/D909

The learner-modules ruling claimed D906 and its semantic-reducer follow-up claimed D907 after the
bounded-mate and promotion-race results had already used those identities. The living research rows
and Wave-C pointers move to D908/D909. The earlier D906/D907 log text remains append-only history;
the findings and their evidence do not change.

## 2026-08-22 — Review engine operands are typed facts, not grades

The shipped Stockfish executor was measured on 24 fixed imported transitions at 50/100/200 ms.
Parent+child latency is median 111.6/211.6/411.6 ms, but delta-sign agreement ranges only
63.6–81.8% across budgets and top-eight moment Jaccard .455–.778. That is sufficient for a
source-labelled recorded operand and insufficient to infer a stable editorial grade. Mate stays a
separate type: at 100 ms Stockfish 18 returned mate with the correct winner and exact remaining
distance on 72/72 rows already proved by the complete mate-through-four tree.

The symbol audit found the production failure the types need to prevent. Story maps every mate to
±1000 cp and runs the ordinary 150-cp pivot rule over it (D911), while the post-game pass enqueues
only eval and has no compiled join for the separately declared human, theory, semantic and
tablebase sources (D912). C4 now hands Review a typed point/delta/mate-transition contract; source
overlap, engine-version stability and whole-game selection remain research.

## 2026-08-22 — overload earns its name only after the noisy rule is rejected

The first candidate-time overload predicate asked whether a multi-duty defender's recapture lost
another duty edge. It fired on 52/754 authored and 515/6,991 imported moves—background, not a useful
semantic tactic. Its supposed positive fixture then falsified it: a queen also defended the first
target and could recapture safely, so the observed knight recapture proved only the chosen line.

The repaired event requires sole defence of both named targets and a positive legal exchange on a
retained target after every legal recapture by that defender. It fires on 0 authored and 12
imported moves. D913 therefore splits the basic foundation into the ordinary multi-duty operand,
the exact response conflict and the observed later exploitation. Winning, force against every
opponent reply and engine judgement remain separate authorities.

## 2026-08-22 — Wave C gets an executable producer-to-consumer handoff

Twenty candidate projection rows now retain the complete C5 contract rather than a free-text
surface: producer, operands, grounding, abstention, timing, answer distance, source/workflow
ceilings, three fixture classes and availability. The closure test gives candidate reach of Support
16, Review 20, bots 13, inspector 20, authoring 17 and theory 3. Every pre-commit-requested row is
rules-grounded and none can contain a move, line or evaluation answer.

Habits receive zero rows deliberately. Until opportunities, sample floors, baselines and the
longitudinal store exist, a motif count measures exposure rather than player style. D914 records the
matrix; D915 records the mandatory landing order. The Wave-C collector/source adapters must create
literal production identities before the accepted learner-module RFC or the Review successor can
bind them. Cross-source whole-game selection remains C4/F6 research, not a collector blocker.

## 2026-08-22 — correction: the Wave-C Review/closure block moves to D916–D921

The play-composition draft claimed D910/D911 after the Review engine checkpoint had used the same
two identities. The entire contiguous Wave-C block moves together so its internal references stay
coherent: engine operands D916, Story mate-type defect D917, missing post-game join D918, exact
overload D919, C5 matrix D920 and module-amendment order D921. The earlier D910–D915 log references
remain append-only history; none of the findings, counts or contracts changes.

## 2026-08-22 — the longitudinal blocker is specified as storage, not another classifier

The F9 HEAD audit confirms R13 against the post-F1/F2 tree and turns its logical record into a
buildability handoff. Native attempts preserve exact roots but no semantic observation;
`projectAttempts` still returns empty for imported games; current metrics omit contributing rows
and opportunity denominators; and pack concepts remain pack-scoped. The missing plane therefore
splits into atomic versioned observations and reproducible metric snapshots, never cached prose or
a weakness score.

The rebuild boundary is explicit before authoring: pure rules facts may be recomputed from
preserved events by a version-pinned idempotent job, while external evidence requires a recorded
response/artifact and label/prose joins remain forbidden. Exact theory/drill applicability stays
F7-owned; whole-game Review selection stays F6-owned; module composition stays F5-owned; adaptive
bot memory stays F8-owned under O8's deferral. The store must coordinate a landing-position claim
with `learner-rating` and join portable account export/delete/per-run invalidation in the same
commit. O9 is still the only gate before F9 RFC drafting.

## 2026-08-22 — whole-game Review evidence exposes a WDL perspective defect

The C4 disposable instrument ran Stockfish 18 at 100 ms over 8 deterministic whole imported games:
658 transitions and 661 positions. The production adapter's raw side-to-move WDL correlates .015
with its White-perspective cp and adjacent deltas agree in sign only 49.4%; normalizing WDL to White
raises those to .847 and 68.5%. Raw versus normalized WDL deltas agree only 35.1%, so D927 is a
storage-boundary correctness defect, not a selector preference.

The same run keeps source units separate and finds a semantic fact, exact opening endpoint or
seven-piece tablebase-domain fact beside 19/24 engine top-three moments. D928 therefore gives the
Review successor a typed source-local selector: each family admits and ranks in its own terms, then
declared quotas/priorities compose the final map. Mate is never cp, human likelihood is never chess
quality and DTZ is never advantage magnitude. C4's cross-source overlap arm is answered;
cross-version stability and learner usefulness remain.

## 2026-08-22 — promotion-pressure implementation returned on absence semantics

The D922 amendment correctly removed the ungrounded rule-of-the-square verdict, but the next
implementation read found three incompatible contracts for its replacement flags. The accepted
tactical RFC requires an in-check pass-clone abstention; the executable C5 matrix calls the same
per-pawn reading total; and the research helper returns false when the turn clone is invalid.
Unavailable and refuted would therefore become the same production byte.

D931 returns only this seam. The proposed author repair keeps pawn/path/distance/control geometry
total while making each reply-dependent flag explicitly available or `invalid_turn_clone`; the
matrix and research helper must then share that shape. No production code was written from the
contradiction.

## 2026-08-22 — engine-version stability is measured, not assumed

The C4 harness compared official Stockfish 17.1 and 18 at 100 ms over the same 24 fixed imported
transitions. Cp-delta signs agree 17/22 (77.3%), White-normalized WDL delta signs agree 20/23
(87.0%), and both top-eight moment sets have Jaccard .600. Cp/mate point type agrees 48/48.

This closes the adjacent-release arm while preserving its consequence: engine version and budget
remain stored operands because the identity of a Review moment changes across either. No result is
a grade threshold, and no mate/WDL/cp units are collapsed. Learner usefulness remains the open
C4/F6 arm.

## 2026-08-22 — the last Wave-A meanings are executable, not deep

The ten unimplemented tactical projections were blocked by seven author-contract gaps, not by
expensive chess search. `wave-a-contract-closure.md` grounds the terminology and a disposable
seven-test harness makes the repaired boundaries fail-able: adjacent pawn pairs are not support
chains; branched chains retain two bases; a rook-on-seventh state survives without inventing
`cutOff`; only an immediate capture/recapture pair is `trade_completed@1`; loose-piece deltas
compare mover-owned identities on both sides; discovered execution requires its before-state
latency record; and a checking pawn's invalid pass clone is unavailable rather than false.

The in-place D829–D835/D931 amendment carries those exact repairs into Tactical and the Wave-C
promotion binding. D832 closes through D922's earlier removal of the rule-of-the-square verdict.
Focused instruments pass 7/7 in the new boundary harness and 7/7 across the existing promotion and
consumer-matrix files. Production remains held until an independent buildability review accepts
the amended bytes; Breadth still follows the complete Tactical landing.

## 2026-08-22 — the final-ten production map is explicit

**What landed:** enumerated the compiled-catalogue delta against tactical-collectors Appendix A.
Twenty of thirty identities ship; `rules.transition.event.developed@1` is generated from the
transition family declaration, leaving exactly ten absent ids. Mapped those ten to the accepted
production homes, existing authorities, identity joins, permanent fixtures and focused landing
gates in `planning/tactical-collectors/final-ten-implementation-map.md`.

**What changed:** the independent-review hold no longer hides implementation discovery. Once the
author amendment is accepted, the execution order is state readings, identity-preserving events,
avoidance generalization, manifest/adapters/exports, measurement and closeout. The map also states
the dependency chain plainly: final Wave A → breadth collectors → semantic collectors. The final
semantic wave is ordinary foundation (deflection, clearance, overload and bounded mate evidence),
not an optional advanced tier.

**Blocked:** production remains held only on the independent buildability review required by the
RFC status; this planning pass does not waive it.

**Next:** run that independent review, implement the mapped ten, and immediately open the accepted
breadth collector wave.

## 2026-08-22 — breadth no longer needs a second planning pause

**What landed:** checked the accepted breadth-collectors Appendix A against the compiled catalogue:
all 18 ids are absent, so its implementation remains one closed wave. Added the dependency-safe
five-slice execution plan at
`planning/evidence-foundation-ux/breadth-collectors-implementation.md`, covering control/mobility,
pawn state and sequences, defender consequences, material/king/activity operands, and manifest /
measurement / lifecycle closure.

**What changed:** tactical completion can now flow directly into breadth implementation. The plan
pins every existing authority that must be consumed instead of recomputed, the typed clone
abstentions, identity-retaining sequence boundaries, exact production-site census, learner-surface
silence and all 18 catalogue ids.

**Blocked:** only by the accepted RFC's declared dependency on the complete tactical landing.

**Next:** after the tactical closeout, execute B1–B5 without another research or authoring round,
then open the accepted semantic-collector implementation.

## 2026-08-22 — the basic semantic wave has an execution queue

**What landed:** checked semantic-collectors Appendix A against the compiled catalogue; all 14 ids
remain absent. Added a five-slice implementation plan covering defender duties, observed
deflection/attraction/clearance/interference/zwischenzug, overload, bounded mate proof, promotion
races and manifest/measurement closeout.

**What changed:** “basic tactic” and “cheap computation” are no longer conflated. Most of the wave
is exact state arithmetic or two-to-five-edge recorded joins. Mate is bounded-tree-priced because
the semantic name requires a proof rather than suggestive king-zone geometry; that cost class does
not make mating nets an optional advanced feature. The consumer handoff is also explicit: modules
choose significance/disclosure, while collectors never dump prose or ask an LLM to discover facts.

**Blocked:** production waits on Tactical, Breadth and the D931 independent seam review; there is no
remaining owner question for the 14 registered ids.

**Next:** execute S1–S5 immediately after the two prerequisite collector closeouts, then bind the
landed ids into modules, Review, bots and longitudinal analysis through their separate contracts.

## 2026-08-22 — move-quality-grades accepted after the review that caught a factor of two

**What landed:** `rfc/move-quality-grades.md` accepted (body + register, one commit, parity green).
The cross-review recomputed every constant against fetched sources and found the report ladder
wrong by exactly 2×: the taxonomy dossier glossed `Advice.scala`'s 0.10/0.20/0.30 thresholds as
Win%-points, but they operate on raw winningChances ∈ [−1,+1] — so the ladder is **5/10/15**, not
10/20/30, and every report or imported grade would have been ~one class lenient. The dossier now
carries a dated erratum ([[D939]]); the "4×-stricter practice ladder" was a cross-normalization
artifact (true ratios 2×/1.67×/1.07×). The mate arm's generalizations contradicted three pinned
source cells and are replaced by the complete fixed-cp three-tier table (countermate = Blunder,
F-MATE-LOST-M). *"Zero voice changes"* was false by one word: `BANNED_JUDGEMENTS` lacks
"inaccuracy" ([[D940]], open, one-word fix + fixture arm).

**What changed:** the grades chain (learner-modules → grades → Review) is fully accepted; the only
unwritten document is Phase-5 presets, held deliberately for the eve of the owner's first play
session. Rows D939–D940 landed.

**Blocked:** nothing — grades implement after learner-modules per the queue order.

**Next:** owner should know before playing: report grades will be ~2× more common than the draft
implied; the drill ladder (2.5/6/14) is unchanged and was verified correct.

## 2026-08-22 — play composition shell protects the board

**What landed:** began the accepted `play-composition` implementation and replaced the rejected
content-coupled run layout. `/play/run/:runId` is now a focused full-viewport surface with one run
topbar rather than duplicate global and run chrome. `playBoardEdge(width, height)` is the single
runtime/test authority for the RFC's exact seven viewport sizes and 8-pixel snapping. The stage is
closed over board, fixed timeline strip and compact tablet/phone objective; desktop gets a 336 px
rail, tablet a 176 px band and phone a 48 px rim with overlay sheet. Structure, transition,
human-model and corpus diagnostics moved to the separate Evidence Inspector.

**What changed:** the text-move disclosure no longer adds a board row; errors, read-only state and
branch-group creation are overlays; the keyed Chessground remount is removed in favor of the
existing `board.set()` path plus an explicit reset token. The browser gate now asserts exact board
geometry rather than a 192 px containment floor, remeasures after text/Inspector/objective/sheet
gestures at all seven viewports, and proves one board DOM node survives a committed move. Existing
evidence, repertoire, live-session, endgame-input and match scenarios were reconciled with the
focused run and explicit Inspector. Browser result: 30 passed, one optional Maia latency test
skipped; web typecheck 0 errors/0 warnings; focused unit/component result 30/30.

**Closed:** [[D718]]'s layout/test mechanism and [[D923]]'s internal text-entry/remount/overlay
defects. [[D717]] remains open deliberately: registered module composition, presets and the
remaining ordinary-surface vocabulary are not made complete by a stable shell.

**Blocked:** no shell work is blocked. Module seats wait on their collector/learner-module landing
order; the full 7×16 / 112-screenshot matrix and remaining SAN/producer-vocabulary cleanup are
still obligations of the implementing RFC.

**Next:** compile the learner-module queue after its dependencies, finish the leak-destination
cleanup, and execute every remaining acceptance state before archival. The exact remainder is in
`planning/play-composition/plan.md`.

## 2026-08-22 — the first play vocabulary leaks move behind Inspector

**What landed:** implemented the dependency-free part of `play-composition` §5. Branch-group
candidates now render legality-checked SAN from the displayed FEN. Checkpoint alternatives no
longer fall back to raw UCI when their payload carries no authoritative SAN. A pivotal timeline
mark opens a compact SAN-labelled recorded-moment card; its phase/convention prose and optional
voice live only in the Recorded moment Inspector section. The named-structure card keeps authored
plans, watch items and typical mistakes while trigger ASTs, structural success expressions,
registry ids and provenance move behind its explicit Inspector door.

**What changed:** ordinary play no longer treats diagnostic exactness as the presentation. The
same information remains inspectable; it is not deleted or silently filtered. A reusable
`moveSanFromUci(fen, uci)` refuses malformed and illegal moves rather than displaying UCI as a
fallback. Focused result: web typecheck 0/0, 39 component/unit tests green, and the six affected
browser journeys green (shape, pivotal, theory checkpoint, branch group and line flows).

**Blocked:** the related-pack relation owns only a UCI in the current projection, so ordinary play
now says “After the related move” instead of guessing SAN. Supplying authoritative SAN, plus the
phase/trajectory/compare/tablebase module renderers, remains in the implementing RFC's declared
module/leak work; no schema was invented in this slice.

**Next:** land the module compiler in dependency order, then finish those typed destinations and
the complete composition-state matrix.

## 2026-08-22 — more plumbing leaves the run surface

**What landed:** removed the aggregate “evidence waiting” topbar counter rather than preserving a
producer backlog as learner chrome. Raw trajectory leg ids/states moved from Support into a Run
trajectory Inspector section. Theory verdicts still render the played SAN and authored/unknown
distinction, but no longer print `concept_violation`, `tactical_error` or mistake enum tokens; a
classified alternative now says only that the pack has authored commentary about it.

**What changed:** L2 is removed and the dependency-free portions of L4/L12 are routed. Timeline
marks and the final authored theory module still belong to the module implementation, but ordinary
play no longer waits for those dependencies to stop exposing their internal vocabulary. Web
typecheck is 0/0; 26 focused unit/component tests and the affected authored-theory browser path are
green.

**Next:** continue with compiled module destinations for phase, compare, tablebase and voice; do
not reintroduce raw values as temporary cards while those modules are absent.

## 2026-08-22 — voice refuses invented inaccuracy grades

**What landed:** closed [[D940]] independently of the grade projection. The shared external-voice
guard now treats both `inaccuracy` and `inaccurate` as judgements, so either word is refused when
the admitted rendered evidence contains no matching grade sentence. The focused fixture exercises
both exact violation tokens over an authored, ungraded evidence view.

**What changed:** a provider may still re-voice a grade that the deterministic registered renderer
actually admitted, but it can no longer invent the mildest grade merely because the previous ban
covered `accurate`, `mistake` and `blunder` but missed these two non-substring word-boundary cases.

**Next:** implement `derived.grade.move_quality@1` after its accepted learner-module dependency;
this guard is already global and does not need to be repeated per consumer.

## 2026-08-22 — intent-presets accepted; the last unwritten Phase-5 document exists

**What landed:** `rfc/intent-presets.md` drafted from a HEAD-derivation dossier
(`presets-head-derivation.md`), cross-reviewed, corrected in place, and accepted — body,
register, ledger rows D942–D944 and the plan-row flip in one commit. The owner caught the
process error that commissioned it (D941): holding the draft "for the eve of the first play
session" guaranteed the session could not test it; drafting now and letting play rulings
become the amendment is the coherent form of the freshness instinct.

**What the review caught:** the draft's own acceptance grid summed wrong (24 admitted / 11
refused, not 19/16 — both sum to 35, which is exactly how a wrong count hides); §3's
"structurally impossible" D493-regression claim was false in five of six contexts (the rules
floor is now universal via restricted clamp tokens); a production-registration overclaim;
run-log events claimed that don't exist; one D444-vacuous fixture arm. ~52 claims re-derived,
14 failed. The design/05 algebra quote was verified byte-exact — the misquote class did not
recur.

**What changed:** every document in the D717 program now exists and is accepted. The eight-name
intent shorthand is retired (D942, two-axis conflation); `academy`'s fall-through to solo
defaults is a named defect closing at implementation (D943); the three role vocabularies have a
pinned mapping and an unowned unification row (D944). Storage claims nothing versioned; run
lane 0.19 named-and-declined with a standing reopen criterion.

**Blocked:** nothing. Implementation follows `learner-modules` in the codex order.

**Next:** codex implements; the owner's first session exercises the five candidate presets and
rules on names, defaults and per-context Support — the validation gate is their own use (D649).

## 2026-08-22 — Tactical collector foundation completed and archived

**What landed:** all 30 projections in `archive/tactical-collectors.md` now compile through the
evidence manifest. The last ten add exact pawn connectivity and space readings, rook/promotion
state, immediate trade and identity-preserving loose-piece, pawn-island and discovered-execution
events, including counterfactual avoidance where declared. Returned D829–D835/D931 boundaries are
implemented rather than bypassed; D730–D742, D744, D749, D799, D808 and D922 close with them.

**What changed:** the permanent authored/imported instrument re-ran production code over complete
legal alternatives. The critical sign result reproduces: moved-piece en-prise is below one with
both upper bounds below one (0.25× / 0.49×), while exact double attack is above one in both
populations (1.72× / 1.96×) and only the imported confidence interval excludes one. Capture has no
lift claim. Population zeros for authored trapped pieces, imported unstoppable promotion and
authored all-reply fork remain explicit coverage facts, not weakened predicates.

**Still open:** D743 runtime opening identity belongs to R8/F7. Learner-facing module eligibility,
presets, bots and Review consume these facts only through their own accepted contracts; this wave
adds no raw settings or learner prose.

**Next:** implement the accepted breadth-collector successor, then the accepted semantic collector
wave; module/preset/bot/Review work follows the registered evidence rather than inventing parallel
classifiers.

## 2026-08-22 — correction: Tactical archival waits for Phase 3

The preceding entry overstated lifecycle state: the implementation is complete, but status-parity
P5 correctly refused archival while two learner-module discharges remain open. The RFC is restored
to active `implemented`; all code, fixtures, measurements and ledger closures stand unchanged.

Lifecycle-token clarification: P5 requires an active document with a surviving discharge to use
`awaiting`, so the reconciled token is `awaiting D921`; implementation remains complete.

Further parser clarification: `awaiting` points to the local discharge table rather than the global
ledger, so the valid lifecycle token is `awaiting D1`; D921 remains the global owner.

## 2026-08-22 — portable-account-data accepted; deletion and export are contract, not hope

**What landed:** `rfc/portable-account-data.md` accepted after buildability (D711–D714) and an
independent cross-review (~45 claims re-derived, 5 failed, all corrected in place). The two
material catches: the browser-clearing promise named one localStorage prefix where the shipped
grammars are three — a `tabiya:` clear would have missed writer ids, assistance preferences and
the same-day `tabiya.workflow.v1.*` preset keys, i.e. "clear my data" would have silently kept
most of it — and the §4.3 tombstone journal record was unwritable under `session_journal.kind`'s
closed CHECK with no migration claimed (pinned to the existing `session.closed` kind). The
migration-position queue now names all three pending positions including longitudinal-store's
Discharge-D1 export hand-off.

**What changed:** account export, deletion previews, and identity tombstones have an accepted
contract claiming nothing versioned; teacher-surface's account-deletion clause has its named
successor (F12-B, atomic supersession).

**Blocked:** nothing for acceptance; implementation is queue-ordered work.

**Next:** queue for codex behind the current chain; `assistance-control-wiring`'s review is in
flight and `learner-rating` is unblocked by today's D945/D946 rulings.

## 2026-08-22 — assistance-control-wiring accepted; the deletion target had moved

**What landed:** `rfc/assistance-control-wiring.md` accepted after independent cross-review (~40
claims re-derived, 2 failed, corrected in place). The material catch: §2 sent the implementer to
delete "the pivotal dialog's second named-plan block," but feedback stage 1 had relocated that
block to the inspector's Recorded-moment section — the pivotal dialog contains nothing to
delete, so the RFC as written guaranteed a dead-end implementer return. Fixed with the
grep-stable `data-evidence-consumer` anchor. The D532/D715 scoping was de-staled against
`intent-presets`' same-day acceptance at four sites, and the §8.2 landing-order seam is now
mirrored in §3: wiring lands FIRST and owns the on-ramp `guided` default until `ContextContract`
subsumes it.

**What changed:** the assistance lane is fully specified end to end — wiring (reveal + guided
channel + on-ramp default) then presets (contexts + compiler + floor). Both accepted, both
claiming nothing versioned. The returned parent `assistance-controls.md` now has both halves of
its useful content extracted; what remains of it is a supersession decision, not a draft debt.

**Blocked:** nothing. D308/D309 flip at wiring's implementation commit, which must state the
named-plan block's final home (D309's own wording is historically dated).

**Next:** queue wiring for codex ahead of intent-presets per the landing order; decide the
parent RFC's disposition (supersede-and-archive) in a follow-up pass.

## 2026-08-22 — three rulings, a refused draft, a live round-trip, and the audit that failed its predecessor

**What landed:** (1) Owner rulings D949/D950: the stage-2 binding wave holds WHOLE until Gate F —
the owner chose the strict reading with the play-session consequence stated — and the principle
registry may grow with claude-authored counterCases under owner veto (dormant behind Gate F);
tooling steps 1–2 stay queued as mechanism. (2) The campaign drafting fork REFUSED its own
directive — the campaign lane's owner-grounded gate ("no campaign RFC until R6–R8 experiential
closure") was stated first in the derivation dossier's body and omitted from its summary; the
draft was commissioned from the summary (D951, near-miss, zero bytes written; feedback memory
landed). Waive-or-hold is now the owner's question. (3) The D947 live-sources harness ran 20 real
tournament games through the shipped import path — D414 discharged by execution: broadcast PGN
parses; multi-game bodies are refused whole (the splitter is the first missing piece); evals and
third-party verdicts are dropped at parse but stored verbatim at the record, relocating D410's
trap to `importGame`; the streaming endpoint beats polling decisively (0.24 s TTFB vs 4.6 s).
Derivation dossier at `planning/live-sources/rfc-derivation.md`; D948's routing discharged.
(4) The never-started audit (D952): 143 of 543 open rows unrouted at HEAD, and 55 of D641's 74
"routed" rows were never routed anywhere living — the fourth consecutive audit to re-prove
`make work-index` (D487) is the only durable fix; now priority-queued for codex.

**Blocked:** the wave and the play session behind Gate F (owner's choice); the campaign RFC
behind its waive-or-hold question; live-sources Phase A unblocked and drafting.

**Next:** live-sources RFC draft (Phase A cut); the campaign question to the owner; codex takes
work-index, the writer, and the wiring/presets chain.

## 2026-08-22 — live-sources Phase A accepted; the review found the record unwritable

**What landed:** `rfc/live-sources.md` accepted after cross-review (~49 claims, 6 failed, all
corrected). The two catches that justify the whole review pattern: (1) the drafted record was
**unwritable at HEAD** — `imported_games.source_kind` is a STRICT CHECK closed over
`('pgn_paste','lichess_url')`, so the claimed "no schema change" was false; the RFC now claims
one migration position behind `campaign-core` with criterion 11 pinning both arms. (2) The
sanitizer was beaten by its own fixture: 61 third-party SAN suffix verdicts (`??`/`?!`/`?`) live
OUTSIDE comments in the real broadcast PGN and the drafted comment-strip missed them all —
Lichess's blunder verdicts would have entered storage as authored-looking text, exactly D410's
trap. The strip is now structural (zero `{ } ; [% $ ! ?` in stored movetext). Rows D957–D959
landed (Phase B seam, casting/B5, the paste-path twin of D410 confirmed live).

**What changed:** the live lane the owner commissioned this afternoon is accepted paper end to
end for Phase A: URL grammar → split → pick board → strip-with-assertion → existing import.
Register: 11 live claims, migration order now learner-rating ×2 → longitudinal-store →
bot-policy → campaign-core → live-sources.

**Blocked:** casting on the owner's B5 ruling; Phase B on its own RFC (D957).

**Next:** campaign-core's cross-review is in flight; codex implements Phase A after
campaign-core's migration lands (position order).

## 2026-08-22 — campaign-core accepted: the campaign is paper-real, ten RFCs through the cycle today

**What landed:** `rfc/campaign-core.md` accepted after an independent cross-review (~70 claims
re-derived, 15 findings corrected in place). Three catches carry the day: the §2.2 spend-site
charged a never-persisted scratch mutation (`simulate()`'s map) while missing `RunService.fork`,
the primary proactive-branching verb — the earned-rewind economy would have charged nothing real;
the §4.1 seal read `TrajectoryLegSpan.sealedState`, a record that does not exist for
non-trajectory packs (re-pinned to `Node.objectiveState`, with the campaign verdict pinned as a
new object in the `node_sealed` payload); and no transaction anywhere granted a node's `reward` —
the unlock economy had no income. Also: the boss was dodgeable by path choice (lint tightened to
layer-3-only), `startingModules` had no schema home, five design/06 citations were stale by the
D945 amendment's own line-shift. The suspected economy-direction inversion was REFUTED — act1 ≥
act2 ≥ act3 encodes the owner's more-forgiving-lower-acts exactly. Rows D960–D962 landed;
intent-presets Discharge D3 recorded discharged at `5b52698`.

**What changed:** the day's tally is ten RFCs through draft → adversarial review → acceptance
(presets, grades, wiring, portable-account-data, live-sources, campaign-core, plus the four
accepted earlier in the stretch), the migration queue runs learner-rating ×2 →
longitudinal-store → bot-policy → campaign-core → live-sources, and the owner's three rulings
(earned rewinds, witnessed-play seam, gate waiver) are all encoded in accepted paper.

**Blocked:** campaign implementation on its migration position; rated boss on learner-rating.

**Next:** codex's queue in order; learner-rating is the next draft to push through review now
that D945/D946 resolved its open questions 11/12.

## 2026-08-22 — learner-rating accepted; the review caught a live engine assist inside a rated game

**What landed:** `rfc/learner-rating.md` accepted after its first independent cross-review (~80
claims re-derived, 14 failed, all corrected in place). The center catch: R6's refused-route
enumeration was incomplete — `service.analysis` enqueues engine bestline/eval/wdl behind
`#forWrite` alone and `feedbackDeliveryOpen()` opens `/evidence` on `feedback.revealed`, so a
rated run could read live Stockfish lines mid-game through `/reveal` → `/analysis` →
`/evidence`, routes the withholding set never named. Fixed at the set, the creation pin, and
AC-5. Also corrected: the six-of-nine-axes count was stale at HEAD (v4's `spoken: "provider"`
tier is server-refusable), §10a.3's score orientation was inverted (right conclusion, backwards
premise), and `BANNED_JUDGEMENTS` is now asserted by symbol, never by count. Verified clean: the
Glicko-2 arithmetic end-to-end to four decimals, the event/branch-keyed void mechanism across
all four persisted rewind-family paths, and the witnessed-play seam composing over shipped
`run_grants`. Rows D980/D981 landed; D395 flipped closed with R15/R16 intact (its own flip
condition); addenda applied to D388/D389/D423 and the D332 status note.

**What changed:** the register has NO remaining reviewable draft — every active RFC is accepted
or implementing. The migration train is fully ordered behind learner-rating's two head
positions. The owner's rulings D945/D946 are absorbed and accepted; the rated boss
(campaign-core Discharge D1, carrying D962) becomes buildable when this lands.

**Blocked:** nothing at the paper tier. Everything now flows through codex's queue.

**Next:** codex implements in queue order; claude's next work is review-on-demand, the
assistance-controls parent disposition, and the owner-fork backlog (B5 casting, army-prestige).

## 2026-08-22 — bot-policy compiler and sampler foundation landed without guessing the roster

**What landed:** the F8 catalog compiler and deterministic Maia-distribution primitives. The
compiler rejects duplicate authorities, incomplete-vector transforms without a recorded degraded
path, hidden guards, unmeasured traits, fake delays, memory instances, learner-derived inputs and
unmeasured persona claims. Focused fixtures cover every refusal plus deterministic canonical
digests, top-p top-1 forcing, equal-mass ordering, trait reweighting and the final draw.

**What changed:** two accepted-RFC gaps were made explicit before production policy was invented.
D969 records that the severe-error guard has no authorized Stockfish candidate-pricing request or
typed mate normalization while both plausible shipped mechanisms are currently refused/unmeasured.
D970 records that the accepted RFC left its concrete Maia band roster open even though band is part
of profile identity and mutually exclusive with `targetElo`. The production registry therefore
remains honestly empty; existing `human_common` behavior is byte-untouched.

**Blocked:** guarded/pawn-heavy profiles on D969; every concrete profile and request-seam positive
fixture on D970; the run-schema migration remains behind learner-rating and longitudinal-store as
registered.

**Next:** amend/re-review F8 on those exact contracts, then wire the compiled roster through the
run and selector seams. Independent accepted dependencies continue meanwhile.

## 2026-08-22 — assistance-control-wiring implemented and archived

**What landed:** the missing learner disclosure now runs through `RunStateStore` and
`DrillSessionController` to the existing server mutation. Writable `attempt_end` runs expose one
Support control; the refreshed run opens provider evidence, a second reveal is idempotent, and the
next committed move closes the window. The server remains authoritative for live-match pause
state, and its typed refusal reaches the existing visible alert.

Named-shape guidance now has one owner and one renderer: `guided` gates timeline shape markers,
works with pivotal `markers` off, and opens the attributed `ShapePanel`. The smaller duplicate in
Recorded-moment evidence is gone. Five profile fallbacks remain silent; on-ramp differs only by
`guided: "live"`, while any stored v4 preference wins whole.

**Verification:** 54 focused store/controller/preference/screen tests pass; web typecheck reports
zero errors and zero warnings. Two targeted built-browser journeys pass: a real Carlsbad marker
under `guided: live, markers: off`, and disclosure → provider-control availability → next-move
re-lock. The scoped diff covers all nine RFC implementation families and changes no schema,
route, error code or assistance-config version.

**What changed:** D308, D309 and the split-tracking D716 close; both RFC discharges are dated. The
RFC is archived and its active-register row moved to the archive table in the same commit.

**Next:** intent presets can now consume the single on-ramp default owner; learner-module and
play-composition work can bind named modules to this functioning control path.

## 2026-08-22 — intent-preset vocabulary and context seam checkpoint

**What landed:** the seven workflow contexts, five candidate presets, their eleven-module
closure, and the literal 24-admitted/11-refused context grid now compile in the runtime. Client
and server share `deriveWorkflowContext`; on-ramp has precedence and Academy no longer falls
through to ordinary pack behavior. Candidate preset choices have their own versioned local
preference namespace, separate from the existing raw assistance configuration.

**What changed:** the production assistance context now carries its derived workflow identity,
and the documentation reflects seven contexts and six silent fallbacks. The checkpoint makes no
new assistance promises and does not expose a preset control yet.

**Blocked:** D971 records an omission in the accepted RFC: it gives neither five exact
`AssistanceConfig` projections nor a literal seven-context config-clamp table. The final
compiler, preset pill, footer truth, and D943 ceiling discharge remain blocked rather than being
guessed.

**Next:** amend and re-review those literal tables, then implement the complete 5×7 compiler
fixtures and activate the preset surface.

## 2026-08-22 — move-quality grade projection checkpoint

**What landed:** `grade-convention@1` now carries twelve source-and-date-pinned constants;
`derived.grade.move_quality@1` computes learner-POV win-percentage drops from paired readings
of one engine at one search limit. Report and practice ladders are separate. Mate scores retain
their type and use the cited `mate_lost`/`mate_allowed` table rather than the Story ±1000-cp
coercion. The deterministic renderer always carries the class, operands, drop, threshold tier,
and convention version.

**Verification:** 19 focused grade/catalogue fixtures pass, including every ladder boundary,
the class-changing clamp case, both perspective lanes, all mate tiers, four abstentions,
word-only-render refusal, move-answer widening refusal, and empty-derivation refusal. Runtime
typecheck is green. The evidence manifest compiles at 34 producers / 184 projections / 25
consumers / 207 bindings.

**What changed:** D899, D932 and D933 close at the projection boundary; D879 moves to an
implementation checkpoint. The grade remains explicitly `experimental` and learner-invisible.

**Blocked:** move-quality-grades D1 remains open until learner-modules compiles
`module.postcommit_nudge` and `module.review_map`. The RFC stays implementing rather than
archiving around a producer with no consumer.

**Next:** compile the two module consumers when their policy tables land, then expose the grade
through post-commit and Review composition under the preset/disclosure ceilings.

## 2026-08-22 — learner-rating core and storage checkpoint

**What landed:** the runtime now owns the four measured full-material Maia opponent rungs, an
exact Glicko-2 update, uncertainty widening for empty periods, publication abstention,
abandonment handling and the six disclosures every later rating surface must carry. Migration
25 creates the six rating/standing tables additively.

**Verification:** the six focused rating fixtures reproduce the published Glicko-2 worked
example and repository calibration artifact; fourteen storage fixtures cover fresh and
historical upgrades, including the deliberate no-backfill result; runtime and server typechecks
are green. The migration register now records 25 as landed rather than leaving a live claim.

**What changed:** the arithmetic and durable schema are real, but the application still creates
and shows no ratings. The separate rating documentation says so explicitly, while the existing
return/progression no-rating clauses remain surface-scoped and unchanged.

**Next:** implement rated-game admission and event projection, assistance/rewind voiding, rating
period closure, service routes, cohort standings and the learner surface. In parallel dependency
order, migration 26 is now available to the accepted longitudinal store that powers grounded
opening, structure, style and habit aggregates without feeding the rating.

## 2026-08-22 — learner-rating service and period checkpoint

**What landed:** calibrated rated-game admission, atomic run/declaration persistence,
event-driven sealing and voiding, named assistance refusal, period updates, abandonment
accounting, rating/history routes and the five capability dispositions. A rated game stays
playable after voiding; only its measurement contribution disappears.

**Verification:** 23 focused server fixtures pass across storage, service, REST and capability
projection; server typecheck is green. Positive controls include a rules-terminal Fool's Mate
loss and a twelve-loss period that moves the rating and narrows RD. Negative controls cover an
off-ladder band, low-material start, wrong engine bytes, fork, engine drift, premature reveal,
analysis and guidance, double seal, seal-after-void and cross-learner reads.

**What changed:** the backend can now produce a provisional or publishable band-calibrated
rating without grading a move. No learner UI or cohort computation exists yet, so this remains
an implementation checkpoint rather than RFC closeout. D974 also repairs the stale capability
fixture counts exposed by the focused run.

**Blocked/next:** D973 records that `longitudinal-store` is marked accepted while three clauses
still require answers before implementation. Claude/register owner must reconcile that text;
meanwhile learner-rating can continue through cohort standings, UI composition and remaining
acceptance criteria.

## 2026-08-22 — learner-rating cohort-standing backend checkpoint

**What landed:** the migration-25 standing and mark tables now have their production writers and
reads. Sealed wins mint permanent event-derived marks; a teacher can open or configure one
standing for an existing classroom; and every entry can only be published, hidden or withdrawn
by its own active member. Leaving the classroom removes the entry in the same transaction.

**Verification:** 11 focused storage and standing fixtures pass and the server typecheck is
green. The route fixture rejects a teacher-supplied learner handle before dispatch, then admits
the learner's own publish gesture. Service fixtures cover empty-by-default consent, outsider
indistinguishability, W/D/L split by opponent band, result-only ordering, provisional-rating
absence, permanent marks, withdrawal, membership expiry, and the no-run-data response boundary.

**What changed:** cohort computation is no longer a learner-rating residual. The remaining
product gap is the dedicated classroom standing UI plus the RFC's wider generated acceptance
graph and owner-use arm; the server contract is usable now and does not route standing copy
through evidence or voice.

**Next:** finish the learner-facing composition when its UI dependency is clear. In parallel,
take migration 26 and the accepted longitudinal projection once its stale pre-acceptance question
wording is reconciled, because that store is the foundation for grounded opening, structure,
style and habit views.

## 2026-08-22 — breadth closeout and Wave-C 12/14 checkpoint

**What landed:** the evidence contract now represents a derived projection as either one exact
conjunction or a closed set of alternative conjunctions. The compiler validates every member
independently; the semantic-event declaration must copy the complete set; and the runtime seal
accepts exactly one member and includes its identity in the event digest. This closes the last
implementation return on all 18 breadth projections. It also admits Wave-C deflection, attraction
and bounded forced-mate authority without manufacturing a common source.

**Verification:** 47 focused runtime fixtures pass across the contract, catalogue, breadth,
material, semantic-tactic and mate-proof paths; runtime typecheck is green. Negative controls reject
empty members, duplicate sources, duplicate/set-equal members, missing members, undeclared sources,
partial members and unions. Positive controls cover open and half-open files plus capture-only,
promotion-only and capture-promotion material events.

**What changed:** breadth is implementation-complete and awaits only its separately owned D1
production-module eligibility. Wave-C moves from 9 to 12 of 14 registered projections. D963 is
narrowed rather than closed: exact promotion-race geometry and live-or-recorded Syzygy authority
remain held until their independently reviewed source contract is buildable.

**Next:** land the two promotion-race projections after D931/D963 review, then compile literal
Support/Review eligibility for the completed collector ids. Detection remains silent until those
module and preset contracts select it.

## 2026-08-22 — residue reconciliation applied: 48 rows, none represented by silence

**What landed:** the verified reconciliation packet
(`planning/platform-alignment/residue-reconciliation.md`) applied to the ledger and queues in
one pass. The 42 semantic-collector measurement rows (D724–D903 band + D567/D570): **36 flipped
✅ with the consuming RFC section cited** (their numbers, conventions and refusals were found
near-verbatim in the accepted collector RFC bodies — the flip survives RFC archival, which is
why the ledger-side citation was chosen over reopening three accepted documents), **5 annotated
deliberately-not-flipped** (D803–D806 flip at breadth-collectors' implementation landing per its
own closeout; D903 at learner-modules' landing with the D898 count correction), **1 record-only**
(D800 stands as a feasibility record). The six residue threads: D585 routed into
play-composition's chrome slice (codex-queue paragraph — the dead ambient button is owned by
nobody's leak table); **D698 flipped ✅** (the stale external-review blocker was ledger-only —
R11/O8 wait on nothing external under D649); D301 routed to a small `daily-position` RFC behind
one disposable glyph prototype (drafting-queue entry added); D863 routed to a content-authoring
wave (both "dead" wirings verified live and content-starved); D549/D552 became research-queue
**R20/R21** with their startable desk arms named and their measurement arms honestly blocked on
the store.

**What changed:** every one of the 48 rows now carries either a ✅ citation or a named execution
destination. The hand-audit caveat stands: `make work-index` (D487, codex-queued) is the only
version of this guarantee that survives next week.

**Blocked:** nothing new; the deliberate non-flips wait on their own landing commits.

**Next:** codex takes the D585 fold-in with play-composition; the daily-position glyph prototype
and R20/R21 desk arms are claude-startable.

## 2026-08-22 — learner-rating reading surfaces checkpoint

**What landed:** the authenticated shell now has a dedicated `/rating` measured-record route and
each classroom composes its own consented standing. The rating view renders only server-shaped
publication, fixed disclosures, event-named marks and whole-game result history. It preserves
server abstention: a missing publication creates no point estimate, provisional label or fake
1500. The classroom module preserves server order, prints no rank, keeps rating visibility off by
default, and requires a two-step learner publication gesture whose confirmation repeats the
permanent unwitnessed-games limitation. Record visibility, rating visibility and withdrawal are
separate learner actions; teachers can configure the result window but cannot publish a member.

**Verification:** focused client fixtures cover the API paths, route parser, published and
abstaining rating states, event-mark copy, game history, server-order preservation and informed
standing publication. The web typecheck reports zero errors and zero warnings. No broad suite was
run at this checkpoint.

**What changed:** the learner-facing reading surface is no longer the learner-rating residual.
Rated campaign entry, owner-use and the RFC's remaining generated acceptance graph still prevent
archive; the UI does not pretend otherwise. `/learn` remains rating-free and the standing remains
inside its classroom rather than becoming a global table.

**Next:** return to the next accepted foundation slice that is not waiting on Claude's
semantic-tactics review or unresolved RFC tables.

## 2026-08-22 — executable work index and routing recovery

**What landed:** `make work-index` now parses ledger status, discovers active RFCs and living
route-shaped planning documents, excludes archives/logs and the stale routing inventories, and
fails on duplicate ids or any open row with no destination. `--json` exposes the full join. Its
first repository run found 112 still-open rows with no living destination and a second duplicate-id
incident: learner-module D967/D968 and learner-rating D967/D968. The module blockers retain those
ids; rating moved atomically to D980/D981. `planning/routing-queue.md` assigns every omission to a
named next action and gate rather than making audit prose count as ownership.

**Verification:** the focused Node suite is 4/4, `make work-index` reports 916 ledger rows / 512
open / 512 routed / 0 unrouted, duplicate ids are empty, and `git diff --check` is clean. The target
is wired into `make verify`; no broad suite was rerun for this planning/tooling checkpoint.

**What changed:** D952 closes, D652's hand-copied incident count is removed, D809's namespace guard
is executable, and the omission/duplication half of D487 is implemented. D487 remains narrowly
open: ordinary references do not distinguish ownership from dependency, and 119 rows have multiple
same-priority references. A future conflict guard needs literal primary-owner declarations; failing
every multi-reference row would encode a false invariant.

**Next:** keep the accepted collector/runtime queue moving while Claude reviews the Wave-C contract;
take direct evidence-integrity defects that do not depend on the held promotion-race authorities.

## 2026-08-22 — principle-entry schema guard closes D504

**What landed:** the missing principle-entry schema test now independently binds the exported
`0.1` version to the JSON Schema `$id`, walks the full schema for open object definitions,
validates every registered principle, and pins the shared canonical digest against key-order and
version changes. This closes the schema-test half that shared-resource-registers deliberately left
outside its process scope.

**Next:** continue the accepted bot-policy substrate without registering the D969/D970-blocked
guarded roster or inventing its engine probe/band set.

## 2026-08-22 — schema self-description and F1 ledger reconciliation

**What landed:** the drill-pack schema's human description now follows its exported 0.27 version,
with a derived assertion beside the existing `$id` binding. D663/D665/D666 also move to their true
terminal state after re-verification at the production symbols: reasoning review has a typed
non-evidence HTTP request, detector/authored phases carry distinct exact payloads, and all registered
consumer operations enter through compiled evidence views with bare-payload negative fixtures.

**What changed:** four false-open rows stop competing with real foundation work. D574's historical
schema-identity incident remains open because correcting today's description cannot rewrite a past
artifact; D576/D578 remain contract/RFC work rather than being smuggled into this direct repair.

## 2026-08-22 — bot-policy request seam fails closed before the roster

**What landed:** the selector request grammar now carries an optional exact compiled profile triple,
valid only on `human_common`, mutually exclusive with all three legacy policy authorities, and
verified against a supplied compiled catalog. Profile identity joins the selection cache key. The
production catalog remains empty, so production profile requests are refused rather than silently
playing ordinary Maia under a profile name.

**Verification:** the opponent-selector suite is 41/41 and the server TypeScript project is clean.
Fixtures cover exact acceptance, digest mismatch, wrong mode, all three two-authority collisions,
and cache separation. The RFC/register move to `implementing`; no schema lane or migration is
claimed at this checkpoint because the persisted run seam has not landed.

**Next:** D969/D970 still require Claude/owner amendment before the guarded roster. Continue the
unblocked persisted-profile and typed selection-record work only when its claimed migration order
is free; do not invent the probe, mate score frame, or band list.

## 2026-08-22 — false-open ledger sweep at shipping symbols

**What landed:** nineteen rows move to their actual terminal state. D28's condition-less outcome
grading has a four-objective automatic-rule matrix and a played-mate fixture. D662 and D669–D679
are the implemented F1 author-return boundaries (sealed rendered items, producer/command split,
exact structural/ref/claim/Explorer/trajectory/sourcing/opponent/route/story payloads). D533/D534
are the pinned Stockfish-environment and bounded-census CI fixes; D245/D246 the completed 0.27
graduation corrections; D871 the recorded independent-review correction; D948 the live-lane route
whose recurring omission class is now guarded by `make work-index`.

**Boundary:** this was not a text-match blanket flip. D568 remains open because its broader six-plane
architecture includes downstream selection/module work; D546 remains open because registering the
producerless arrows surface does not give it a producer. Each flipped row already named its own
implemented/closed disposition and was checked at the referenced symbol or permanent fixture.

## 2026-08-22 — D813 candidate evidence reuses the shared collector registry

**What landed:** `derived.opponent.candidate_feature_vector@1` is a typed local producer admitted
only to `opponent.selection@1`. For each legal candidate, `candidateFeatureVector` clones and plays
the edge, requires one finite root-frame Stockfish score with a positive fixed search bound, and
records the existing tactical/breadth child readings and one-edge events as literal `{id,version}`
sources with their structured payloads. Illegal, duplicate, empty, unbounded and unevaluated inputs
fail closed. D813 moves to implemented.

**What changed:** the evidence manifest is now 35 producers / 188 projections / 25 consumers / 210
bindings; the candidate vector has exactly one consumer. The adapter adds no detector, feature
label, learner prose, grade, salience hierarchy, or personality claim. Multi-edge sequence
collectors do not pretend to fire from a one-edge candidate. This opens registered-id classifiers
for future bot traits, but each trait still needs the bot-policy RFC's separate measured admission.

**Verification:** 19 focused candidate/catalogue/manifest tests pass, the server TypeScript project
is clean, and `make evidence-manifest-check` reports the compiled counts above with all producer
paths and bindings closed.

**Next:** D969/D970 still block the guarded production roster. The remaining bot implementation is
the persisted run/profile seam, composed policy-decision record and server-side sampler; none is
silently implied by D813.

## 2026-08-22 — theming accepted after a return: the ruling that proved itself

**What landed:** `rfc/theming.md` accepted after three passes — cross-review, an owner-ordered
RESTRUCTURE, and an independent verification (138 claims, 12 failed). The owner returned the
first draft in one sentence — *"what 'panel'? how hard is it to apply a theme??? ... Like have
app theme, board theme, pieces theme. done."* ([[D982]]) — and the restructure proved the ruling
concretely: the first cross-review had "fixed" a contrast failure by editing `tokyo-night` light's
`accentTextColor`, reasoning that the token was ours, **violating the verbatim rule in the
sentence that cited it** ([[D988]]). The registry carries `#ffffff`. A composed contract cannot
tell you whose value you hold; a scheme inherited whole can. Token surface 17 → 12, every key
read off the owner's own registry (all 10 schemes there carry all 12).

**What the reviews caught:** both color criteria were unsatisfiable as drafted — one demanded a
distance between the brushes and a "lighting overlay" that IS the blue brush (0.0 by identity),
the other imposed WCAG floors nobody had computed (two of four palettes failed). The
verification then caught a criterion red-forever (`--display-font` evicted with 23 live uses) and
an invalid-CSS mapping (`--shadow`'s seven call sites are shorthand consumers). And a real live
defect fell out of the arithmetic: the **shipped** light theme fails WCAG AA today
([[D983]] — `--warning` 1.94:1, small text in eight files), fixed in this RFC rather than
deferred.

**What changed:** the owner's most-repeated ask now has accepted paper. Rows D986–D988 landed;
[[D984]]'s guard generalizes past theming — any numeric criterion ships with the numbers computed
for every value the same RFC ships.

**Blocked:** nothing. Implementation is queue-ordered.

**Next:** codex implements; the inherited-scheme accessibility asymmetry (§3.3) stands as the
ruling's forced consequence and remains the owner's to veto.

## 2026-08-22 — D566 maximal pawn-reach repair and corpus refresh

**What landed:** `pawn_safe_square` now uses the versioned `maximal_pawn_reach@1` convention.
Both direct-file reach and capture migration must be empty before `safe` is true. Permanent
fixtures cover the old capture-only false positive, an unreachable pawn, and blocked routes that
remain conservatively reachable. The evidence catalogue, deterministic sentences and canonical
docs disclose that blockers, capture availability, turn order and move legality are outside the
convention. No move grade, recommendation, permanence or importance claim was added.

**What changed under measurement:** the complete D542 fixed-corpus run passed over 50 packs / 754
transitions / 643 positions / 19,636 legal alternatives. `pawn_safe_square` remains high-volume and
anti-discriminating at 0.88x (79.92% played versus 90.482% alternatives). Dependent `outpost`
moves from 10 to 0 static observations and from 2/717 played firings (1.71x) to 0/717, with 11
alternative firings. The repair makes the predicate honest; it does not make either row suitable
for proactive delivery. D566 closes. The refreshed castling result also re-verifies D547's shipped
fix: all 22 corpus castlings are observed and the former infinite artefact is now a finite 9.72x.

**Boundary:** D632 stays open. Its dependency reaches 77 authored pack/shape/witness occurrences,
so F3/Gate F still owes a truth-set migration and human re-evaluation. The accepted learner-module
table may restore `outpost` only through its already-recorded owner ruling and amendment; this
defect pass does not silently alter that table or claim useful positive coverage from a zero-witness
population.

**Coordination note:** the concurrent theming commit `5289327` swept the correct D566/D547 ledger
and queue edits before these implementation files landed. D989 records the shared-worktree staging
failure; this implementation commit names the split instead of pretending the same-commit closeout
held.

## 2026-08-23 — Theming foundation implemented; owner-use holds remain

**What landed:** appearance is now three independent live axes: 3 application schemes, 2 board
skins, and 2 piece sets, plus None/Fast/Normal movement. The global `tabiya.theme` preference is
unversioned and validates each field independently; device mode is the default, explicit mode wins,
storage events update other tabs, and reduced-motion forces no animation. Settings owns the full
picker while the board carries one link into it. `docs/theming.md` records the runtime contract.

**What changed:** board square paint, interaction/evidence paint, and piece artwork are separate
layers. Switching any axis preserves the Chessground element and position. The layout-bound repair
that previously called `redrawAll()` immediately after each position update was the animation
defeat: Chessground interpolates in JavaScript and the redraw erased its tween. Bounds now refresh
after the configured 120/250 ms movement duration, while selection-triggered layout changes retain
their immediate refresh. The shipped light-theme warning/muted contrast defect and both phantom
tokens are closed, and every artwork file has an exhaustive license/source row.

**Verification:** 33 focused component/theme tests pass; Svelte reports 0 errors and 0 warnings;
the focused browser contract passes 2/2, including stable DOM identity/position across a live
four-axis switch and more than two observed transforms over at least 60 ms after a committed move.
Permanent gates also cover token totality, zero stray colors, authored-palette WCAG floors,
inherited palette byte/measurement pins, CIE76 evidence separation, axis cross-product selection,
assistance/theme separation, and mode-aware install chrome.

**Closeout:** theming D4 and play-composition D3 are discharged; D839, D983, D986, and the D875
floor close. The RFC moves to `awaiting D3`: Claude/owner still owes the protected design/03
Settings-row amendment ([[D987]]). The distinct owner-use felt-quality pass remains D5/[[D840]];
it does not hold the implementation code or its mechanical criteria.

## 2026-08-23 — Campaign authored-contract checkpoint

**What landed:** the first dependency-safe slice of `campaign-core`: a closed three-act campaign
schema; schema-owned generic document types specialized in runtime to the ten unlockable learner
modules; runtime validation for registered pack references, unavoidable final-layer bosses,
unique node ids, non-increasing candidate grants and the campaign-context unlock ceiling; and
`campaign` as the eighth intent/preset context with its own device-local preference namespace.

**Verification:** schema, runtime, server and web typechecks pass. Twenty-five focused tests cover
the closed schema, exact unlock pool, 28/12 context grid, device preferences, and able-to-fail
unknown-pack / boss-placement / economy / ceiling / duplicate-id cases.

**Boundary:** no persistence or play mutation moved. The claimed migration remains behind
`longitudinal-store` and `bot-policy`. [[D1011]] records that longitudinal-store is marked accepted
while its own three clauses require answers before acceptance/implementation; this checkpoint does
not infer those answers. The seed campaign remains a content-registry step so encounter selection
does not masquerade as mechanical schema work.

**Next:** build the campaign registry/seed boundary, then take persistence and the pure event fold
when the two preceding migration positions are lawful.

## 2026-08-23 — Bot-policy composed-selection checkpoint

**What landed:** the pure composed bot stack now executes one compiled profile over a provider
vector: Maia reconstruction/top-p, optional repertoire prior, guard masking with explicit
provider/empty abstention, measured trait weighting, seed+history draw, and the exact explainable
decision record. The incomplete-vector branch records the profile as unapplied and returns the
base model's move without laundering it into profile attribution.

**Two defects closed before integration:** [[D1012]] found that the old final draw restored
provider order after correctly tiebreaking top-p membership; final-mass draw order and considered
rows are now canonical, with a permutation fixture producing byte-identical output. [[D1013]]
found two parameter authorities: profiles could digest one generic map and execute different typed
fields. The compiler now binds all executable layer parameters to the digested literals.

**Verification:** server typecheck and 58 focused catalog/selector tests pass. The production
catalog remains deliberately empty. No profile is advertised and no run/event schema moves.

**Next:** D969 must pin the real Stockfish guard probe and D970 the literal roster. The policy
record then attaches to `OpponentSelection` at run-schema 0.18 after longitudinal-store's lawful
migration turn; this checkpoint does not jump either dependency.

## 2026-08-23 — Campaign registry checkpoint

**What landed:** `CampaignRegistry` validates authored documents against the live pack registry,
retains exact `(campaign id, document version)` records for future pinned runs, computes canonical
digests, rejects duplicate identities, and keeps a missing content directory honestly empty.
`docs/campaign.md` records the boundary: the contract/registry exist; runs, routes, seed content and
surfaces do not.

**Verification:** server typecheck and nine focused campaign validation/registry tests pass,
including two retained versions, digest separation, invalid pack joins, duplicate identity, absent
pinned version and absent-directory behavior.

**Boundary and next:** no encounter ordering was authored under law 8, and no migration moved. Seed
content is its own candidate-content step. Durable campaign state still waits behind
longitudinal-store and bot-policy exactly as the register declares.

## 2026-08-23 — Campaign module-algebra checkpoint

**What landed:** campaign module composition is now one runtime chokepoint. Inventory is the
permanent rules floor plus authored starting modules plus earned unlocks, all constrained by the
campaign workflow ceiling. Effective modules are the exact intersection of that ceiling, earned
inventory, boss suppression and the chosen preset, returned in canonical registry order.

**Refusals:** an unlock outside the campaign ceiling fails with
`CAMPAIGN_UNLOCK_OUTSIDE_CEILING`; attempting to suppress `rules_floor` fails with
`CAMPAIGN_RULES_FLOOR_SUPPRESSED`. A preset cannot expose an unearned module, and boss suppression
cannot add one.

**Verification and boundary:** runtime typecheck and the focused campaign/preset tests pass. This
is pure composition only: it adds no seed encounters, storage, routes or UI and does not advance
the blocked migration position.

## 2026-08-23 — D969 Stockfish candidate-guard mechanism probe

**What landed:** a disposable Stockfish 18 harness compared unrestricted, shared candidate-set and
independent `searchmoves` searches over three positions / thirteen legal candidates at fixed-node
and fixed-depth bounds. The research dossier updates the bot-policy coverage row and narrows D969.

**Finding:** one shared `MultiPV=N searchmoves <candidate...>` request returned every candidate and
is the only measured common comparison frame. Independent fixed-node probes can rate a restricted
candidate above the separately searched unrestricted best. Fixed-node output can also end in
`upperbound`/`lowerbound` despite carrying a score, and a forced-mate set produces typed `mate 1`,
`mate 2`, `mate 3` and `cp 0` together. Score presence is not completeness; mate-to-cp coercion is
not measurement.

**Boundary and next:** D969 remains open. Claude's RFC amendment must choose the bounded request and
typed mate rule, then a real Maia-vector arm must measure exact-completion and latency before any
guarded production profile or capability-disposition change. No production code changed.

## 2026-08-23 — D969 production Maia-vector population

**What landed:** the disposable guard harness now obtains the real `human_common` vector at every
server-discoverable production draft root and prices the exact set in one shared Stockfish 18
search. The final cold run covers 50 roots (20 opening, 14 middlegame, 14 endgame, 2 cross-phase),
958 candidates and five bounds. An earlier instrument version included five browser fixtures while
omitting two cross-phase packs; that run was discarded and production discovery now mirrors the
server filename rule.

**Finding:** node 25k/50k is fast but all-exact on only 16/15 roots and therefore cannot implement
the measured guard. Depth 8/10/12 is exact 50/50. Depth 8 has Stockfish p95/max 105/129 ms and cold
Maia+guard max 499 ms, but changes the depth-12 ≥250 cp mask on 7/49 cp-only roots. Depth 10 has
Stockfish p95/max 404/431 ms, changes 6/49 masks, and reaches 729 ms end-to-end. Depth 12 reaches
1,258 ms per call. One production root mixes cp and mate at every bound.

**Boundary and next:** no production contract changed. D969 now requires the RFC to choose depth 8
or 10, rerun R11's predeclared guard-retention gates at that exact depth, declare the selection
budget, and rule typed mate transitions. Registering a guarded profile before that would reuse a
depth-12 benefit claim for a different instrument.

## 2026-08-23 — D1008 semantic-anchor research closes the claim-binding exploration gate

**What landed:** `design/research/claim-semantic-anchors.md` traces the only validator-green
automatic candidate through the shipped binding contract and compares the missing relation with
the W3C Web Annotation, PROV-O and Nanopublication separations. The implementation proves claim
identity, location, pack scope, record provenance, value equality, token coverage and label
earning; it never represents the clause's subject-predicate-object proposition.

**Verdict:** stronger hashes, selectors or provenance cannot reject “the one common mate” → DTM 1.
The bounded repair is proposition-first: a typed fact backed by declared records, then one
registered deterministic renderer whose complete clause must equal the selected claim clause.
Automatic migration is permitted only on whole-clause equality. Arbitrary legacy prose needs an
explicit reviewed rewrite/annotation; an LLM is downstream phrasing only, never the admission
authority.

**Boundary and next:** no content binding or production contract changed, and the 43-row wave stays
stopped. D1008's research question is answered and the owner's continuing foundation-first
instruction opens a follow-up draft to the implemented claim-backing RFC. It must reuse F1's
projection/rendering authority, coordinate compatibility with F3, migrate the one live Philidor
binding explicitly, and pass six able-to-fail fixtures before Feedback Delivery Stage 2 resumes.

## 2026-08-23 — semantic-claim follow-up drafted

`rfc/claim-semantic-anchors.md` turns the research verdict into a bounded two-stage contract. Stage
A builds 15 typed claim-fact projections, a sealed grouped renderer and the V2 validator; Stage B
rewrites/migrates the one live Philidor binding and deletes the legacy production reader. The
acceptance matrix preserves the exact D1008 counterexample and five independent failure classes.

The draft claims none of the current six shared-resource registers and is intentionally not
accepted: its compatibility clause must name F3's literal capability/version declaration after
that in-flight RFC stabilizes. This is dependency discipline, not an owner question. No content or
production code changed and Feedback Delivery Stage 2 remains stopped.

## 2026-08-23 — D970 Human-baseline roster narrowed to four measured bands

`design/research/maia-production-band-roster.md` reuses the committed D333 outcome run rather
than launching a new engine experiment. The only literal 1.0 roster directly supported by the
pre-registration is `[1000,1400,1800,2200]`: every adjacent score interval is disjoint; the
measured 100-point steps are below learner-session resolution; and the top-range 2000→2400
increment crosses parity. The bands remain model inputs, not human Elo labels, and their
difficulty leverage is explicitly attenuated at ten or fewer pieces.

The pass also found D1014: `compileBotPolicyCatalog` does not prevent one versioned layer identity
from carrying different declarations in different profiles. The handoff therefore uses
band-specific model-layer identities and requires a negative cross-profile fixture. No production
profile or default changed. `planning/platform-alignment/bot-policy/d970-roster-handoff.md`
contains the exact owner/RFC amendment; guarded and pawn-heavy variants remain behind D969.

## 2026-08-23 — bot layer identities are catalog-wide

D1014 is fixed in `compileBotPolicyCatalog`: every repeated layer `id@version` is joined to its
canonical declaration across profiles. Byte-identical shared layers remain legal; changing the
band or any other declared field under the same identity fails compilation. The focused fixture
constructs exactly the D970 hazard (`model.maia3@1` at bands 1500 and 1800) and a positive shared-
layer control. No production roster registered and the D970 owner/RFC amendment remains required.

## 2026-08-23 — portable account data completion reconciled and archived

The accepted RFC had already shipped across `b4d0654`, `942d22e` and `b44d5f3` while its active
status and D605/D606 discharges remained untouched. A completion audit ran nine focused server/
component files (**57 tests**) plus the real Playwright account-lifecycle journey (**1 passed**).
The proofs cover deterministic closed-shape export, password confirmation, exact/stale previews,
private and shared deletion classes, rollback, archived-classroom read-only behavior, Studio
retention warnings, browser clearing and the refreshed R18 destructive fixture.

`rfc/archive/portable-account-data.md` is now implemented; D605, D606, D657 and D711–D714 close;
F12-B and the never-started inventory are reconciled. The RFC's implementation had skipped the
required planning transition, so D1015 records the failure and
`planning/archive/portable-account-data/` reconstructs the actual commit sequence explicitly as a
retrospective record rather than manufacturing a clean history.

## 2026-08-23 — imported-castling residue reconciled

D719 was stale rather than open. Commit `4818d52` had already changed the shared
`irreversibility` primitive from an exact two-file king delta to a delta of at least two and added
one permanent test covering both standard `e1g1` and chessops-imported `e1h1`. The reading and
pivotal planes both consume that primitive, so the defect is closed without a new production
change. The focused transition suite was rerun before the ledger flip.

## 2026-08-23 — ambient assistance now opens Support

D585 is fixed against the already-implemented `polish-surfaces` contract: activating the optional
topbar persona now selects the Support companion and opens the bounded tablet band or phone sheet.
The same action leaves desktop in its existing rail composition, and no evidence, permission or
preset semantics changed. The control names its target through `aria-controls`; the component
fixture proves both the compact seat selection and open state. D311 narrows from four residues to
three.

## 2026-08-23 — promotion-complete tablebase claim validation

D520's cannot-fire is removed. The tablebase walker and claim validator now consume one exact
legal-move enumerator that expands a back-rank pawn destination into queen, rook, bishop and knight
promotions. Both the validator's reachability closure and `tablebase.moveCensus@v1` use those same
successors. A permanent end-to-end claim-binding fixture records every successor of a promotion
position, proves the four distinct UCI promotions and admits the completed census. No pack or
evidence sidecar changed.

## 2026-08-23 — graduation measurement is read-only

D521 is fixed by splitting observation from refresh. `make graduation-report` now computes and
prints the corpus report without writing any file; the checked-in `content/accepted-conditions.md`
page changes only through the explicit `make graduation-report-update` target. A filesystem fixture
proves the default leaves its target absent, the update arm writes the exact generated bytes, and
both arms return the same measurement. No corpus byte changed.

## 2026-08-23 — shared-node branch switching keeps branch identity

D512's cause was below the DOM: `BranchRail` supplied `(nodeId, branchId)`, but `DrillScreen`
dropped the branch id and the client reduced every switch to a node-only rewind. Branch identity
now crosses the client, request parser and service into the already-versioned
`run.rewound.data.branchId`. A named branch is accepted only when the target node lies on its path.
Permanent runtime and REST fixtures select an exact branch while two branches share the root; the
screen keyboard fixture proves the UI no longer discards the id. Existing node-only and checkpoint
rewinds remain compatible.

## 2026-08-23 — absent-checkpoint evidence reaches comparison

D722 is fixed at the boundary specified by the frozen N-way comparison contract. A missed
checkpoint remains a comparative set-membership fact computed by `compareBranches`; the
`CompareView` consequence row now converts that id to the deliberately transient
`pack-absent:<checkpoint>` key and resolves its sentence through the registered evidence renderer.
The key is never persisted into the run. A component fixture proves the production row uses the
authored checkpoint label rather than the former hand-written id-only duplicate.

## 2026-08-23 — D969 guard recalibrated at production candidate depths

The exact R11 population (279 positions / 837 Maia-band cells) was repriced with one shared
Stockfish 18 candidate-set search at fixed depth 8 and 10. Both depths pass the predeclared 250 cp
guard gate and retain pawn ×4; forcing/quiet ×3 remain refused. A second, production-shaped reading
abstains on all 11 mixed mate/cp positions instead of converting mate to a synthetic cp value; the
same verdict holds over 804 cells. Depth 10 changes no gate decision and carries the previously
measured 729 ms cold tail, leaving depth 8 as the sole measured 1.0 candidate. D969 now waits on the
bot-policy amendment declaring depth, budget and mixed-domain fallback, not on further research.

## 2026-08-23 — D815 threat-salience family refused for 1.0

The frozen D815 plan ran against the retained R11 population with exact before/after `threat@1`
identities. After typed exclusions, 193 positions / 570 band cells remained. All three admission
clauses failed: stationary-threat-created covered 7 positions against the 20-position floor; adding
the salience flags worsened grouped-CV RMSE by 0.477% with permutation p .677; and the hypothesized
residual direction was false pooled and present in only one of three bands.

The result kills salience-shaped error from the 1.0 bot roster. It does not remove exact threat
evidence from Support, Review or drill modules, and it does not establish or refute H5/C5's
complete-branch human-likeness claim. `rfc/bot-policy.md` D2 can now close as a measured refusal;
no replacement bot feature is admitted by this run.

## 2026-08-23 — D814 reconciled to the shipped legal-exchange primitive

D814's older bot-foundation row still said static exchange was absent after D730 and the tactical
collector implementation had shipped `legal-exchange@1`. The symbol-level check found the
predicate registered and exported, with production consumers in tactics, mobility and semantic
evidence and permanent two-population measurements already recorded. D814 closes as the duplicate
discovery row; no second evaluator is built.

The human-opponents dossier and coverage matrix now distinguish the historical absence from HEAD.
One author-owned wording correction remains in active `rfc/bot-policy.md`: its measured-foundations
paragraph says "verified absent" immediately before naming Wave A as the shipped answer. That
sentence should be changed during Claude's current amendment; it does not block implementation.

## 2026-08-23 — Learner Modules returned before the reducer guess became product policy

A HEAD audit found a real but unrecorded implementation checkpoint: `2a54d05` ships the exported
module-contract compiler and five focused fixtures while the body/register still read `accepted`
and no implementation plan exists (D1016). It is neither unstarted nor the full 181-row registry.

The next slice is blocked by D1017. The post-review owner ruling made semantic reducers the
mechanism, but the RFC supplies no cross-projection identity, subsumption relation, novelty history
contract or reduction-quality event sink. Its selection step and A9 still specify silent top-N
truncation, contradicting OQ1's required overflow observation. The implementation return names the
minimum typed schema and able-to-fail fixtures Claude must add. No reducer heuristic, consumer row
or production packet was invented in this pass.

## 2026-08-23 — Invalid pack refusals are client errors

D1002 is fixed at the shared REST boundary. `PACK_INVALID` now maps to HTTP 422 and preserves its
typed validation issue details instead of becoming a 500. A direct boundary fixture pins the
status and response body, providing the refusal contract the F3 capability/deprecation path needs.

## 2026-08-23 — Runtime opening identity RFC drafted

The completed D894 measurement now has a bounded implementation contract. The draft keeps exact
current named endpoint, current catalogue-path membership and retrospective deepest endpoint as
three versioned projections. It compiles the already-pinned five-file CC0 source into a canonical
offline artifact and refuses sticky names, descendant guessing, “out of book,” book-policy moves,
theory prose and LLM/FTS applicability.

Author-side buildability review found that the retrospective projection's original input,
`run.record.move@1`, does not carry a FEN. The draft now adds the narrow
`run.record.position@1` fact and obeys F1's mixed-grounding/abstention rules instead of hiding the
position as an undeclared input. It also requires the five pinned CC0 inputs to be vendored so a
clean checkout can reproduce the artifact without a build-time network dependency.

The draft's able-to-fail controls include the two-move-order transposition, a many-descendant
unnamed prefix, live absence after a prior match, exit/re-entry, mixed-artifact refusal, unavailable
source states and runtime-image leakage. D743 advances to drafted; implementation waits on an
independent buildability review. Semantic Collectors D3 should record the drafting SHA after its
concurrent author amendment lands.

## 2026-08-23 — Review evidence compiler RFC drafted

Wave-C C4's typed Review handoff is now an implementation contract rather than two unowned rows.
The draft deletes Story's mate-to-±1000-cp coercion, separates cp delta from mate transition,
normalizes Stockfish WDL to an explicit White perspective, carries engine version/search bound,
and compiles a partial nine-family packet whose pending, failed, absent, off and not-requested
states cannot collapse into one boolean.

The author-side source audit found two narrower defects while tracing the path. Runtime evidence
stores only the engine request id even though C4 measured material cross-version instability
(D1020), and `live.stockfish.eval@1`'s adapter claims to exclude `bestMoveUci` while sealing the
entire values object unchanged (D1021). Both are explicit source-boundary criteria now. The draft
does not invent the final Review Map ranking: D928 remains a discharge because the research proved
source overlap/stability, not which moments learners find useful.

## 2026-08-23 — Exact legal mobility RFC drafted

D904 now has a bounded source contract. `rules.mobility.reading.legal_moves@1` exposes the complete
actual-turn legal map for all six roles while the existing B/N/R/Q `local-non-losing@1` reading
stays convention-grounded. The split lets requested touch/hover sight ask the literal rules
question without laundering safe, good, trapped or recommended destinations into an exact fact.

The source audit found the same legal-move identity independently enumerated across runtime, web
input and server sourcing (D1022). The draft therefore makes one runtime helper authoritative for
evidence, all board input modes and claim/tablebase successor walking, and requires a source census
plus special-move set-equality fixtures for bounded-search loops that genuinely remain local. The
able-to-fail set covers pins/check, standard castling UCI, legal versus king-exposing en-passant,
all four promotions, terminal emptiness, adapter forgeries and modality-ceiling equality. Landing
is inspector-only; Learner Modules owns the explicit requested-sight binding discharge.

## 2026-08-23 — The primitive foundation was re-derived as a chain, not a detector count

The D717 Phase-1 gap matrix was re-run conceptually against current production symbols and the
compiled manifest. Its old 17-missing-collector list is now mostly historical: Waves A/B and the
first 12 Wave-C projections supply the familiar rules, tactical, pawn, king, mobility, exchange and
semantic operands. The live manifest reports 35 producers / 188 projections / 25 core consumers /
210 bindings plus 67 semantic events and eligibility rows.

The closure audit records where each requested family actually stops. Exact legal mobility,
runtime opening identity and the multi-source Review packet are drafted; promotion race is two
registrations short; learner modules are returned on reducer semantics; presets lack exact config
and clamp rows; bot profiles/persistence wait on amendments and storage; and longitudinal habits
have no store. This prevents “a projection exists” from being reported as “Support, Review, bots
and player analysis can use it.”

D558 is corrected rather than left advertising a missing fork/pin/skewer stack that now ships. Its
one genuinely unowned collector residue is split to D1023: research a named-target non-mate 2–3-ply
prevention/prophylaxis query under a declared opponent policy, with horizon, counterfactual and
causal comparison retained. One-reply survival and square-denial measurements show why neither raw
attack geometry nor low reply breadth can answer it. No RFC is authorized until that fixed
experiment exits.

The D1023 experiment is now predeclared rather than left as “do deeper search.” It fixes two named
target families, an opponent-next/answer/opponent-again horizon, and three authorities that may not
be collapsed: complete legal replies, official Stockfish at depth 8 with depth 10 as the stability
control, and Maia's four pre-registered human-policy bands with missing-mass bounds. Ten hard
negatives guard identity loss, refutable force, check/pass misuse, cp/mate coercion, source
instability and strategic-language leakage. The next artifact is the disposable harness; the plan
itself grants no production or RFC authority.

The rules-only D1023 core now runs. Nine focused controls pin immediate preservation/removal,
target movement across the candidate and reply, existential reintroduction versus the stronger
preparation-that-survives-every-defence quantifier, captured-attacker removal, check/pass abstention
and the bounded fact vocabulary. The first failure was useful: the canonical witness was
`...Ra1, Qc1, ...Rxc1`, not the hand-guessed `...Rb8, ...Rxb1`; the test now asserts the actual
identity-retaining line rather than a preferred story. Focused Vitest and runtime typecheck are
green.

The immediate two-population census is now executable and committed as aggregate output. Authored
spines contain 147 named target identities across 116/754 decisions; played moves remove 120/147
(81.63%) against 969/4,870 legal alternatives (19.90%), 4.10× lift. The sealed imported sample
contains 255 identities across 183/579 positions; played removal is 188/255 (73.73%) against
2,309/8,927 alternatives (25.87%), 2.85×. Decomposition matters: captures of the attacker and
movement of the target account for most removals, while exchange neutralization and capture becoming
illegal are the narrower operands useful to downstream explanation. These are immediate threat-
neutralization facts, not inferred prophylaxis.

The census first produced one imported identity loss: `e8h8` castling moved a tracked rook from h8
to f8 as a side effect, while the instrument followed only the king's move fields. The harness now
uses chessops' castling authority to advance both king and rook identities and pins that exact
Lichess witness. Re-run identity loss is zero in both populations and focused Vitest is 9/9. The
full-horizon census and Stockfish/Maia arms remain; no projection has been declared early.

The complete-reply arm now runs the full declared horizon over every material target and distinct
legal result in both populations: 147 played + 4,870 alternatives authored, 255 + 8,927 imported.
No branch reaches the 25,000-node cap (max 2,527; alternative p99 1,979 imported). The result is the
important correction to the immediate lift: 69/120 authored and 130/188 imported played removals
restore the same attacker-to-target positive capture within three plies. Immediate “stopped” is
therefore often temporary. The strong result—one opponent preparation after which every legal
defence still permits the same capture—is rare: 2/120 authored removals (both identities at one
decision) and 0/188 imported. A fixed positive now pins the exact `...Be6, Qb3, <any defence>,
Nxd5` quantifier rather than leaving that non-vacuity claim to a corpus count. This admits useful
exact operands (`removed_now`, `reintroduced_within_3ply`) while arguing against proactive universal
prose. Destination-target and provider-policy arms remain before the research exit.

The destination-target arm now closes the exact half too. It retains the one-edge D771 contract:
the same named bishop/knight can still legally reach the same empty square, but the square changes
from locally non-losing to a positive exchange capture specifically by the moved pawn. It then
tracks that identity through the same three-ply horizon. Reach is 75 targets in 754 authored played
moves and 52 in 579 imported moves (four imported pass-clone abstentions); alternatives contain
1,875 and 1,749 targets. The existential result nearly saturates—75/75 and 50/52 played—but causal
decomposition explains why: 72 and 49 first witnesses move or lose the controlling pawn, trivially
giving the square back. Only 3 and 1 return while that pawn identity remains on its post-candidate
square. No played or alternative destination target has one preparation that survives every legal
defence. Thus the one-edge operand remains useful for requested hover/sight, while complete-reply
search adds no default “stopped their plan” sentence. Stockfish/Maia may still measure which legal
branches their declared policies actually weight; exact existence alone is the wrong selector.

Before launching the provider arms, their horizon language was made executable. “Target execution
within the horizon” had conflated an action with a state: Maia can assign mass to selecting the
target immediately at P1, but after the P1/P2 policy edges the experiment only arrives at P3, the
opponent's second decision state. It cannot claim the target was executed there without an
undeclared fourth ply. D1025 now splits `next_execution_mass` from
`second_opportunity_available_mass`, forbids summing them and leaves actual P3 execution outside
v1. This correction landed before any provider number could inherit the ambiguity.

The provider population is now sealed before source calls. Each corpus contributes 48 pairs by
round-robin over played/alternative × material/destination × detected phase × exact-result strata,
with SHA-256 ordering only inside a stratum. The authored pool has 6,967 eligible pairs across 36
populated strata; imported has 10,983 across 39. The artifact records every stratum's available and
selected count plus the exact source id, FENs, candidate, target identities and exact outcome for
all 96 rows. This means engine/model availability can cause an explicit abstention but cannot swap
in a friendlier position.

The Stockfish arm ran twice and reproduced the same semantic verdict. Stockfish 18, one thread,
16 MiB hash and full legal-root MultiPV at depths 8 and 10 produced 313/313 complete root tables;
every entry reached its requested depth. The neutral platform tiebreak differed from Stockfish's
own tie choice on 5/313 probes, retained explicitly rather than hidden. Across the sealed 96 pairs,
the two depths agree on the `(next execution, second-opportunity availability)` category for 85
(88.54%), below the predeclared 90% gate. Eleven disagreements include two immediate material
execution flips and nine second-opportunity flips. Depth 8 reads 6 immediate executions / 13 second
opportunities; depth 10 reads 4 / 18. The engine-policy prevention arm is therefore refused without
changing the threshold or sample; exact operands remain valid.

The committed provider artifact is compact, not a raw MultiPV dump: it retains per-probe legal-root
count = returned-entry count, min/max reached depth, selected UCI + typed cp/mate score, Stockfish's
own best move, category and latency. Cold 313-probe p50/p90/p99/max is
68.8/356.0/598.4/702.8 ms. Warm latency is recorded as unmeasured rather than simulated because the
semantic arm already failed its stability gate. Maia remains an independent human-policy question.

Execution of the Maia comparison caught a defect in the first provider sample before a model call.
The 48 arbitrary stratified rows per population were individually valid but did not retain the join
needed by the plan's played-versus-alternative delta: most compared different positions or targets.
The defect is sharper for destination denial—the named square/pawn/minor relation is created by the
candidate, so a different candidate usually has no same target at all. D1031 replaces the sample
shape with 16 material anchors carrying played + one hash-selected alternative over the exact same
attacker/victim, plus 16 standalone destination probes per population. Material deltas remain;
destination deltas are inapplicable rather than manufactured. The prior Stockfish run remains a
valid instrument check but its verdict cannot be carried onto the corrected sample without rerun.


## 2026-08-23 — two of codex's own RFCs accepted; one was wrong about the code it was changing

**What landed:** `rfc/exact-legal-mobility.md` and `rfc/runtime-opening-identity.md` accepted
after independent cross-review (corrections applied in place before acceptance). Both were drafted
by codex today; both claim nothing versioned.

**What the review caught.** `exact-legal-mobility` failed 8 of 20 claims, and the center one was a
**false statement about existing behavior**: §1.2 promised the change would "prove public behavior
byte-identical", but chessops emits `e1a1`/`e1h1` for castling and never `e1g1`/`e1c1`, so the web
input layer (which normalizes at `board-input.ts:205-207`) and server sourcing
(`sourcing/legal-moves.ts:12-27`, which does not) **already disagree on every castling move**.
Criterion 7 correctly fails at HEAD. The server-side castling UCI normalization is therefore
**accepted as a deliberate, content-visible behavior change** — one layer is wrong and this fixes
it — with the blast radius measured rather than assumed: exactly one `uci` assertion argument
exists in all committed evidence sidecars (`philidor-third-rank-hold`, `h6h8`, not a castling
move), so **zero committed bindings change validity**. Also: §3's binding route ran through a list
derived from the **pack schema's** `STRUCTURAL_FEATURE_KINDS` and was closed to this projection
(which incidentally proves nothing auto-binds), and criterion 12 was **unsatisfiable by identity**
for the deliberately color-flipped clone enumerators — the [[D984]] class, twice in two days.

`runtime-opening-identity` failed 9 of 22, two blocking: **`vendor/` does not exist**, so its
present-tense claim that a clean checkout rebuilds without a network request was false (the only
reader fetches from GitHub); and criterion 2's shared-parser rule was **unsatisfiable at HEAD**
because `parseRows` is module-private, so a compiler could satisfy it only by duplicating the
parsing the criterion forbids. Criterion 14's 2 ms budget **could not fail** — a linear scan of all
7,854 keys fits inside it.

**What changed:** the register carries two more accepted RFCs, both implementable today with no
unlanded dependency. Neither proposed ledger rows, so none were landed.

**Blocked:** `claim-semantic-anchors` cannot be accepted regardless of draft quality — §7 blocks on
an F3 capability contract that has not landed, and it collides with `measurement-records`' plan to
grow `CLAIM_ASSERTION_KINDS` from 15 to 21; the two cannot both land. `review-evidence-compiler` is
gated on [[D921]]'s Wave-C module amendment, still open.

**Next:** codex implements both; the F3 RFC and the D921 amendment are the two unblocks that free
the remaining pair.

## 2026-08-23 — D1023 provider sample corrected and Stockfish re-derived

The preceding D1023 log entry named its sample-join defect D1031. A concurrent owner/Claude pass
claimed D1031 for the variant-family ruling before this work landed; the bounded-policy defect is
D1032. The duplicate was corrected in the ledger rather than allowing one id to name two jobs.

The corrected sample now has 16 material anchors per population with an executable
played/alternative same-source, same-attacker and same-victim assertion (32 rows), plus 16
standalone destination rows; zero joins fail. Stockfish was rerun rather than carrying the old
verdict forward. On the corrected population, Stockfish 18 depth-8/depth-10 category agreement is
88/96 = 91.67%, clearing the frozen 90% gate; all 308 root tables are complete and every entry
reaches its requested depth. The earlier 85/96 finding remains historical evidence about the
invalid unpaired sample, not the current verdict. Corrected cold p50/p90/p99/max is
72.0/337.0/630.8/735.1 ms.

The paired material arm now supports the comparison the old sample could not. At both depths, the
played candidate reduces immediate engine-policy target selection versus its hash-selected legal
alternative in 9/16 authored anchors and 5/16 imported anchors, increases it in 1/16 each, and ties
in the remainder. Second-opportunity availability is mixed (depth 8 played-minus-alternative:
authored 4 up / 11 same / 1 down; imported 1 / 12 / 3). These deliberately stratified 16-anchor
sets validate the operand and its direction per pair; they are not population-frequency estimates.
The engine-policy arm passes with its depth label retained. Maia remains independent.

## 2026-08-23 — D1023 bounded-policy research complete

The Maia arm ran the corrected 96-row provider sample at bands 1000, 1400, 1800 and 2200 through
the local `maia-5m` service: 2,596 distinct harness requests per pass. The frozen rule is strict:
the root and every expanded second node must retain at least 90% returned probability mass, with no
missing candidate masses. It admits 52/66/77/85 rows by ascending band and refuses the rest. The
lower-band refusal rate is evidence about top-eight coverage, not permission to weaken the gate or
call lower-rated play invalid.

The first aggregate was caught counting positive bounds on refused rows and comparing pairs when
only one side was admitted. Raw row bounds were correct; the summary was not. The published
aggregate now excludes refused rows and compares a material pair only when both sides pass. Among
admitted pairs, played-minus-alternative immediate target-selection direction is up/down/unclear
2/13/3, 3/17/5, 5/17/5 and 4/19/5 across the four bands. Second-opportunity direction is mixed at
4/5/9, 6/7/12, 8/8/11 and 8/9/11. Bands remain separate; neither table is a population prior.

The first full HTTP pass (after a one-row smoke, so up to 36 requests may already have been cached)
measured p50/p90/p99/max 91.0/161.7/279.2/1,185.0 ms. Immediate replay measured
0.4/0.7/1.0/2.7 ms. A true cold-container distribution remains unmeasured and is recorded as such;
the future consumer RFC prices the provider against its workflow rather than inheriting a latency
promise.

`design/research/bounded-policy-targets.md` closes the research gate. The admissible foundation is
several operands, not a classifier: exact removed/preserved/reintroduced/all-defence facts;
depth-labelled Stockfish target policy; and band-labelled Maia lower/upper bounds with typed
unavailability. “Prophylaxis,” plan, intent, force and move quality remain refused without a cited
theory/authored join. D1023 and plan item 2g are closed; the bounded collector RFC is unblocked.

## 2026-08-23 — exact-legal-mobility returned for the D1029 amendment

Implementation began from the accepted RFC and was stopped before landing when the newer owner
ruling D1029 was re-read: castling move identity stays Chess960-safe king-to-rook; semantic
destination is the king's c/g landing square; display stays SAN. The obsolete king-destination UCI
change is not committed.

The correction exposed a larger buildability gap than the original review found. A production
consumer audit identified three additional raw-target assumptions—board last-move highlighting,
comparison piece routes and transition-event operands—plus `canonicalMoveUci`, which currently
rewrites castling identity itself. Fixing only the new legal-move helper would therefore leave four
different visible/data projections disagreeing about where the king went.

The RFC is amended and returned to draft for independent cross-review. It now requires identity,
semantic destination and SAN to be tested separately, includes all four consumers, and adds a
nonstandard Chess960 fixture so an e/a/h-only implementation cannot pass. The non-castling
implementation work remains locally green but is held from closeout until the amendment is
accepted. The audit is `planning/exact-legal-mobility/d1029-consumer-audit.md`.

## 2026-08-23 — runtime-opening source pin failed on first implementation read

Vendoring the five local CC0 inputs exercised `runtime-opening-identity` criterion 1 before any
compiler was written. Four SHA-256 values reproduced. `b.tsv` did not: the accepted D894 README
recorded `310f0997d5a26ac0284e56349b44ff39ce508a53b1a04bfbe57318470844b168`, while a fresh fetch from
the exact pinned commit produced `310f0997d5a26ac6c9abfabac028e47e78f24356a6ba322cfffbf8f5a3f88d25`.
GitHub's contents API identifies the fetched bytes as blob
`c4c7f890f471eb7106df6327356d4f1e3a5a262f`; the older knowledge-retrieval source register and
its executable prepare script independently carry the same corrected SHA. The README is corrected
and D1052 records the false acceptance premise. The downloaded sources remain uncommitted while
the RFC returns for its narrow factual refresh; no compiler is built against an authority known to
be false.

## 2026-08-23 — R20 grounded skills taxonomy desk arm complete

The complete current semantic-event registry was classified through a disposable set-equality
instrument: 67 projections resolve to 47 habit-only facts, 11 Review-only facts, 4 operands
refused as skills and 5 candidate credits. Zero candidates are production-ready. Each candidate
has a literal legal-alternative opportunity denominator, but none has a longitudinal game floor,
cross-time-control stability result or versioned reference distribution. Neutral detector
occurrence is therefore not converted into learner mastery by naming it a skill.

The five candidates are loose-piece avoidance, double-attack conversion, immediate-mate
conversion, discovered execution and promotion completion. Openings and strategy remain honest
empty states for credit: the two measured opening metrics are habits with no production
projection, while current strategy events have neutral valence. The measurement arm is
pre-registered at 25/50/100/200 games with R12 transfer and D345/D603 anti-farming gates, and
remains blocked on the longitudinal-store decisions D973/D1011.

The pass also corrected its input census. The accepted learner-module Appendix B now says 181
declared eligibility rows, 179 intended to compile and two awaiting; the R20 queue's 175-row
premise predated D924. The instrument asserts the authoritative Appendix-B sentence so this count
cannot drift silently again.

## 2026-08-23 — R21 longitudinal style-feedback desk contract complete

An executable set-equality join now covers all twelve persistently retained R12 habit metrics,
their exact inputs/denominators, measured 25–200-game floors, uncertainty/source requirements,
production dependencies and shared bot/style feature atoms. The result is zero production-ready
metrics. Two opening rows need runtime identity and pinned reference artifacts; two castling rows
cannot be reproduced by the accepted store's generic per-decision opportunity denominator; eight
need literal collector/store extensions. Every row still needs early/late and blitz/rapid transfer
beyond R12's 59-hour high-activity sample.

This narrows the standing claim that the store, rather than collectors, was the blocker. The store
is necessary and insufficient for the metrics already measured: its semantic-event ingest excludes
opening identity, clock spend and the R12 configuration/move-role atoms, while its castling grain
measures a different population. No surface RFC is opened against those gaps.

The contract also pins the bot seam the owner asked for. A feature id has one literal meaning, but
the learner and bot consumers share neither state nor proof: a habit passes R12 stability/privacy;
a bot weight separately passes controlled-trait measurement and never reads learner history. The
learner card is deterministic-first and shows value, interval, floor, window, reference version and
exact contributors. An optional LLM may paraphrase one sealed card and may not select, diagnose,
advise, grade, invent an archetype or recommend a move.

## 2026-08-23 — D1062 shared style atoms measured as bot-policy transforms

Five exact R21 atoms were run independently through the accepted R11 controlled-trait gate on
D969's corrected 804-cell population. All five preserve strength, severe-error mass and Explorer
human-match, but none reaches the required ten-point pooled behavior shift at the preregistered ×4
weight. Extended-center pawn is largest at +5.63 points; early queen and exact castling move less
than two; the two fianchetto completion events have only three and six declinable cells. Diagnostic
×8 also fails every atom. Pawn ×4 passes and forcing ×3 fails as able-to-fail controls.

The result separates collector value from bot-profile validity. All five literal atoms remain
needed for longitudinal habits, Review and drill conditions; none may be registered or named as a
global bot personality from this transform. A future broader bot wave must preregister a composed,
phase-scoped or repertoire/stateful mechanism and re-run the full policy gate rather than inherit
validity from the evidence vocabulary.

## 2026-08-23 — D1061 bestline provider measured; hint distance needs a semantic horizon

The owner-ruled hint-distance axis was tested bottom-up before its RFC. Stockfish returned legal,
non-empty PVs in all 256 probes over a fixed 64-position sample; fresh 100 ms searches agreed on
64/64 first moves and agreed with depth 12 on 59/64. Fixed depth 8 versus 12 agrees only 65.6%, so
engine version and budget must remain part of the item identity.

The blocker is meaning, not collection. `beforeFen + movesUci` does not define whether “square” is
origin or destination, whether “piece” is exact identity or role, or what event “ply-distance” is
distance to. The candidate-set census proves the proposed labels are not substitutively monotone.
The research handoff replaces the raw-vagueness idea with a sealed derived primitive: replay the
versioned PV through registered semantic collectors, select one eligible event with typed actor and
target, retain its first occurrence ply and first move, then render cumulative stages. The LLM is
outside selection and derivation.

The pass also corrects the collection premise: durable content now has 893 records, not 764, and
its closed kind union cannot contain bestline. Runtime analysis can persist bestline run events;
`engine-walk` is read-only and does not return a PV. A dynamic runtime path is therefore the first
implementation candidate; authored bestline sidecars would be a separate schema decision.

## 2026-08-23 — D1066 semantic-horizon reach and source split measured

The fixed D1061 PVs were replayed through the sealed semantic event layer and R2's complete-
alternative selection convention after the accepted nudge-family filter. A candidate that admits
only literal actor/target events and disables alternative-only avoidance reaches 56/64 depth-12
lines within four plies (87.5%), passing the preregistered 80% gate. The 100-ms arm reaches 46/64;
among 44 jointly non-empty positions, first projection agrees 37/44 and occurrence ply 39/44.
Engine version and budget therefore remain part of the derived horizon identity.

The reuse gate fails: 115/237 compatibility selections lack one stage target, and the first
depth-12 family is generic `developed` on 11/56 lines. R2 measures distinctiveness, not teaching
value; the hint contract needs its own precedence/refusal table and theory/authored/tablebase
fallback. Cold compile plus selection costs mean 329 ms / p95 799 ms per searched edge, against
mean 38.7 / p95 66.5 ms after cache warmup, so a versioned candidate/event packet shared with bot
policy is now a product dependency rather than an optimization footnote.

The multi-edge arm found 21 square-clearance and one line-blocker-clearance witness in the fixed
depth-12 lines, but no production caller can emit them: the seven sequence constructors are test-
only. Their existing source is `recorded_run`; using them on a Stockfish PV would launder provider
evidence as played history. The handoff therefore requires two adapters and identities: a recorded-
path compiler for Review, and separately declared hypothetical engine-horizon derivations for
Guided Hint. The pass also records the accepted three-stage Guided Hint versus owner-ruled four-
stage contradiction; both RFC/compiler contracts must be amended before implementation.

## 2026-08-23 — D1071/D1072 shared candidate-event packet contract complete

The implemented opponent `CandidateFeatureVector` was falsified as the shared evidence layer. Its
constructor accepts a strict subset—two of twenty legal moves in the fixed opening probe—while the
test calls that population “every legal candidate.” It also reduces a sealed semantic event's
anchor, basis, derivation inputs, stable id and sign to `{source,payload}`, and accepts arbitrary
finite score bytes without consuming a sealed Stockfish item. There are zero production callers.

The replacement contract is a lower, score-free complete legal-candidate event packet. Its
identity is canonical full FEN + legal-convention + evidence-manifest + compiler versions; it
retains original sealed event values and proves set equality with the legal population. Rules
collection stays available with all providers off. Bot scores, semantic PV horizons and Review
opportunity denominators are separate exact joins, so neither UI policy nor engine availability
contaminates the factual cache. Selection-policy identity belongs on the downstream result rather
than the packet. Implementation still needs an accepted RFC and end-to-end cold/warm measurement.

## 2026-08-23 — D1073 state-directed opening profile measured and refused

The stronger follow-up to D1062 replaces a sparse completion event with an exact opening target
potential: own pawn g3/g6, bishop g2/g7 and knight f3/f6, with a candidate firing only when it
reduces the typed occupancy distance. It clears the new coverage gate—80/447 opening cells offer a
guarded progress/non-progress choice—and preserves strength, severe-error mass, Explorer match and
byte-identical non-opening fallthrough.

It still fails controlled reach. A ×4 post-guard weight moves opening route probability only
10.36→15.21% (+4.85 points); diagnostic ×8 reaches +6.83, below the preregistered ten-point gate.
The candidate profile is refused. Two mechanism classes have now failed for different reasons:
global completion atoms are sparse, while an adequately covered phase target is locally effective
but cannot move Maia's concentrated phase-level distribution enough. The next bot experiment must
change mechanism class to a transposition-aware repertoire or multi-ply route controller with
declared adherence/deviation/fallthrough. Increasing the weight again is not a research result.

## 2026-08-23 — D1078 multi-ply route filter measured and refused

A 24-branch local Maia/Stockfish run changed mechanism class from weighting to exact finite-state
filtering. At every controlled opening ply the candidate restricted guarded Maia to moves lowering
the typed g-pawn/bishop/knight target distance; absence fell through explicitly. The route arm
adheres on all 10/10 opportunities, retains every selected move inside Maia's window, adds only
3.82 cp mean loss, creates zero severe moves and adds no repetition.

It cannot sustain the route. Only 2/12 branches expose two opportunities, 62/72 controlled plies
fall through and 1/12 completes. The matched guarded paths contain 23 opportunities in five
multi-opportunity branches while the steered paths contain ten in two: choosing the first route
move changes the later candidate path and usually removes the next step. One branch plays `Nf3`,
falls through until that occupancy is undone, then plays `Nf3` again. Local distance decrease is
not monotone plan continuity.

The shortlist-filter profile is refused. A true route/repertoire layer must declare its own
candidate source and preserve completed subgoals, with Maia and Stockfish recorded as admission or
fallback sources rather than misrepresented as the generator. The narrow next falsifier is a
monotone controller; otherwise the exit is a transposition-aware repertoire, not another weight.

## 2026-08-23 — D1081 correction and D1080 monotone route result

The first D1080 matched control invalidated the provisional D1078 engine numbers: identical
guarded-Maia line ids changed aggregate loss when only the sibling arm changed. The disposable
generator inherited D35's hash-carryover hazard. Every independent best/candidate search now starts
with `ucinewgame`, Clear Hash and a ready barrier. D1078 repeated byte-identically after timestamp
removal (digest `4c0842…`), and D1078/D1080's twelve guarded baseline traces byte-match (`a22c8d…`).
The append-only correction is: D1078 baseline/route loss is **20.31/20.00 cp (−0.31)**, not
18.17/21.99 (+3.82). Its opportunity, fallthrough and 1/12-completion verdict is unchanged.

The corrected monotone controller makes 9 progress and 58 distance-preserving selections, all
inside guarded Maia, but completes only 1/12 branches. It has just one multi-opportunity branch,
two forced regressions where Maia supplies no non-worsening candidate, and nine own-path
opportunities against the matched baseline's 23. Safety passes (13.21 versus 20.31 cp, zero severe,
no added repetition); candidate availability fails. D1080 is refused, closing local weighting,
progress filtering and preservation filtering as route-identity mechanisms. The next honest bot
layer must supply candidates from a versioned transposition-aware route/repertoire source and
record Maia/Stockfish as admission or fallback rather than as the route author.

## 2026-08-23 — the assistance-controls supersede, and R1 resolves a two-RFC collision

**What landed:** `rfc/assistance-controls.md` superseded and archived, with its orphans rehomed in
the same commit rather than deleted by the move. The walk found **(c), not (b)**: three items lived
only in the parent. [[D1074]] — the shape-marker channel renders live to learners with **no row in
the live-surface register**, and it is worse than when the parent flagged it, because
`presets.ts:47-48` now defaults `onramp` and `academy` to `guided`: an unmeasured live surface **on
by default in two contexts**. [[D1075]] — a standing law-4 breach: the parent noticed the
shape-catalogue scope question, correctly declined to answer it, then declined to write the row, so
the archive would have been the moment the idea stopped existing. [[D1076]] — three `design/05`
naming requests routed under law 5 and never actioned, while **both children declare "Deviations
from design: None."**; the sharpest is that the reveal control shipped 2026-08-22, so `design/05`
now reads as prohibiting a surface the product has.

**Ledger discipline, including one row deliberately NOT flipped.** [[D715]] closed — its text was an
instruction to this RFC and both disjuncts happened. [[D532]] left open: `intent-presets` reserves
it for its own landing commit, which has not happened. **[[D307]] amended rather than closed** — its
declared-and-unread defect did not get fixed, it **moved**: `AssistanceContext` now declares *both*
`sessionKind` and `workflowContext` and the body reads **neither**, so the context carries two unread
fields instead of one. Closing it would have scored a live defect as discharged.

**R1 — the `CLAIM_ASSERTION_KINDS` collision is resolved, on this RFC's own evidence.**
`measurement-records` planned to grow the array 15 → 21 while `claim-semantic-anchors` deletes it;
their acceptance criteria were literal contradictions on one symbol. The narrowing was decided by
`measurement-records`' §3b, which names both callers of `validateClaimBindings` and proves neither
can build a census report — so a `census.*` member would never have been evaluated at either site.
Membership bought only the runtime reachability §3b then spent a deferral clause suppressing. The
six kinds are now `census-check`-local; the `SourcingIssue.severity` widening is **withdrawn** with
them, making the claimed surface strictly smaller. Body/register status drift corrected ([[D500]]).
**Still returned** — OQ1–OQ4 are untouched.

**F3 amended twice before review.** §4.4 added the **evidence-sidecar capability declaration**,
because `claim-semantic-anchors` §7 defers its whole compatibility story to F3 and that declaration
was **absent from F3's derived scope** — shipping the derived scope unchanged would have left that
RFC blocked *on the day F3 was accepted*. Then [[D1077]] landed mid-pass: §5.1 makes the owner's
two-state model normative (`unsupported` when not configured at startup, `temporarily_unavailable`
when configured but unreachable), reusing the shipped `ProviderOffBehavior`/`AvailabilityMode` types
and the [[D509]] not-configured-means-not-advertised precedent. **Gate F clause 5 is unblocked.**

**Blocked:** `claim-semantic-anchors` still needs F3 **accepted**, not merely drafted — its
criterion 7 requires the F3 migration plan to exist as an artifact.

**Next:** F3 to cross-review; `measurement-records` still needs the author round OQ1–OQ4 require.

## 2026-08-23 — exact-legal-mobility and runtime-opening-identity accepted after their returns

**What landed:** both RFCs, returned by codex earlier the same day and re-reviewed independently,
are accepted.

`exact-legal-mobility` (22 claims re-derived, 7 failed): the center catch is that **`isLegal`
cannot police the castling dialect** — `isLegal(e1g1)` and `isLegal(e1h1)` are both true and play
to identical successor FENs, so the adapter rule meant to enforce identity accepted a wrong-dialect
payload; conformance is now a normalize-round-trip. **[[D1027]]'s ingest half had been deferred as
"a future UCI join" while it is already the present**: engine `bestmove` is in the other dialect
because `UCI_Chess960` is refused, and 21 castling `moveUci` values sit committed across 13 packs —
two of three inbound populations. Criterion 7 kept its teeth but the amendment had deleted the
red-at-HEAD evidence proving so (restored; the *web* arm is the red one now). [[D1028]] had been
flipped at closeout and fixed nowhere in the body. And the mandatory Chess960 fixture omitted its
own degenerate case: on a shuffled back rank the king castles to the square it already occupies, so
any consumer assuming `from !== to` breaks on the fixture added to catch exactly that class of
assumption.

`runtime-opening-identity` (22 claims, 2 failed): the corrected source pin is confirmed **without
trusting the fetch that produced it** — `git hash-object` reproduces the cited blob id locally, and
the superseded value shares 15 leading hex characters with the true one, which no genuine hash of
different bytes does. Both failures were about the *provenance of the correction* rather than the
correction: an unverified authority had been made load-bearing, and three in-repo witnesses
(including the production path's own manifests) carried the right value all along, so no shipped
byte was ever wrong.

**What changed:** the register holds no returned RFC. Both claim nothing versioned. A residue is
recorded rather than hidden: [[D1029]] names three layers and the mobility RFC names two, kept
honest by criterion 15 making the naming failable.

**Blocked:** nothing on either.

**Next:** codex implements both; mobility's criterion 7 starts **red on the web arm** by design.

## 2026-08-23 — generated bot route source passes after four pre-verdict instrument corrections

**What landed:** D1084's disposable matched 12-branch experiment and
`generated-bot-route-source.md`. A separately identified exact-legal route source completes the
kingside-fianchetto target in **9/12** branches versus paired guarded Maia's **1/12**. It makes 31
progress and 10 preservation selections with zero regressions: 26 retain Maia mass, 15 require the
recorded source/Stockfish tiebreak, 55 candidates are refused, maximum admitted loss is 234 cp,
severe frequency remains zero and repetition does not rise. All eight frozen gates pass.

**What changed:** source → guard → human-policy preference → explicit fallback is now measured
architecture rather than an assumption. It feeds F8 and the shared candidate-packet join, but does
not license a route catalogue, personality or human-like claim. D1095 corrected common randomness,
the generated opportunity denominator, incomplete MultiPV results and chessops-to-orthodox castling
conversion before the favorable verdict was accepted. Earlier D1078/D1080 reach findings stand;
their matched-randomness claim is now bounded. A repeat of the final run produced the same
normalized artifact digest, `6beda443…`.

**Blocked:** product implementation still requires F8's accepted/amended RFC; route instances need
licensed/authored semantics and transposition state. C5 remains unmet pending owner blind use, so
human likeness, coherence and fun are unclaimed.

**Next:** bind D1084 into the F8 author/review pass, then measure a multi-route repertoire/profile
composition rather than another scalar Maia multiplier.

## 2026-08-23 — Compare's empty branch strips fixed at the evidence-snapshot boundary

**What landed:** D1085. `DrillSessionController.compare` now drains every ready staged-evidence
result before requesting the server's immutable branch comparison. The focused core-loop browser
test proves both branches carry recorded-eval dots, structure/timing facts and actual piece routes;
the controller test pins evidence/apply-before-compare ordering.

**What changed:** the product finding was confirmed and the instrument accusation was corrected.
The old ordering called `/compare` before `/evidence`; two engine results attached immediately
afterward and the mounted snapshot never changed. The existing browser assertion was already red on
the empty sparkline children, so this was not a green test over an empty surface. The new assertion
widens the proof to all three strips rather than weakening the existing engine requirement.

**Verification:** `session-controller.test.ts` 21/21; the exact `served Najdorf pack plays,
rewinds, branches, compares, and exports` browser flow 1/1. No broad suite was rerun.

**Next:** the UX composition pass may change how Compare presents these facts; it now receives the
recorded inputs before first paint instead of a stale pre-evidence snapshot.

## 2026-08-23 — Work-index now proves durable ownership, not textual coincidence

**What landed:** D1079/D1083. The route join now ignores RFC metadata, summaries, open questions,
changelogs and ledger-row blocks, and ignores explicitly proposed/not-written ledger sections in
planning documents. Permanent red fixtures cover status-only, changelog-only and proposed-only
mentions.

**What changed:** the stricter reader exposed nineteen genuinely ownerless rows that the old bare
text search called routed. They are now assigned explicitly in `planning/routing-queue.md` to the
semantic collectors, campaign, bot, longitudinal, composition, learner-module, tactical and
research-method lanes. D1130's temporary unnumbered-proposal convention is retired; provisional
numbers remain non-authoritative and cannot satisfy the route check.

**Verification:** `tools/work-index.test.mjs` 6/6; the repository audit reports zero duplicates
and zero unrouted rows after reconciliation.

**Next:** use the corrected executable index to select work; never quote a raw mention census as
proof of ownership again.

## 2026-08-23 — The measured Record can start the games it reports

**What landed:** the client now binds `POST /rated-games` and the `/rating` screen offers one
guided start card over the four calibrated rungs and learner side. It creates a standard-position
run with the existing fixed server policy, persists the writer claim, and opens the normal board.

**What changed:** D1088 narrows rather than closes. The permanently empty Record path is repaired;
the independent Review gaps remain — move-quality grades still have no production caller and the
post-game surface still lacks the full move review/summary this row names. The UI exposes no raw
engine, seed, policy, or FEN settings, and states that Maia bands are not external ratings.

**Verification:** rating API/surface plus Compare-controller focused tests 25/25; web typecheck
reports zero errors and zero warnings. No broad suite was rerun.

**Next:** the F6/O7 Review implementation must compile grades and whole-game moments without
folding them into this rating record or turning the product into an engine-verdict screen.

## 2026-08-23 — Related rehearsal is reachable without inventing a skill dashboard

**What landed:** the client binds `GET /progress/related`; every recorded attempt on Learn can
expand into at most three of the learner's own nearby rehearsals. The module resolves the attempt's
branch root through the run graph and presents only the server's three exact relations: same
position, same pack/different position, or same idea in this pack.

**What changed:** D1141's dead-route count falls again. The separate `/progress/metrics` endpoint
remains operator/reporting-only: its voluntary-return and second-attempt rows are product-success
measurements, not permission to infer mastery, weakness, or a player type. Canonical documentation
now reflects the shipped related expansion and preserves that boundary.

**Verification:** focused API and mounted Learn-surface tests 10/10; web typecheck reports zero
errors and zero warnings. No broad suite was rerun.

**Next:** continue draining accepted, unreachable product verbs. Pack-draft playtest/withdraw and
run simulation are the remaining bounded client bindings; Campaign and Review require their
respective accepted/amended contracts rather than ad-hoc UI.

## 2026-08-23 — Pack Studio's measured playtest loop reaches an author

**What landed:** D1143. The selected-draft action bar now saves and opens a validation-clean draft
as a real private run, and offers withdrawal behind an explicit effect summary and confirmation.
Registration is disabled with the exact local blocker for absent selection, immutable state,
validation failure, or a declared blocking graduation entry.

**What changed:** the client binding exposed a server/RFC contradiction before copying it. The
accepted playtest contract says the server owns run id, safe random seed, and per-run policy; the
route required all three from the caller. The route now rejects client assembly fields, derives
them itself, and returns the canonical run URL. Authors see one Save & playtest action rather than
engine/policy/seed plumbing. D1141 falls to three genuinely uncallable routes.

**Verification:** focused Pack Studio server, API, and mounted author-surface tests 20/20; server
and web typechecks are green with zero Svelte diagnostics. No broad suite was rerun.

**Next:** simulation is the remaining bounded core-loop binding. Reasoning review waits for the
Review contract because its task/provider boundary is already a recorded trust defect; Campaign
still needs its HTTP/application RFC rather than an improvised route family.

## 2026-08-23 — Simulation returned before an empty preview became product UX

**What landed:** D1154 and a symbol-level implementation return for N-way scratch simulation.
The endpoint comparison references nodes that never cross the HTTP boundary, so the only renderer
would show every simulated row as ended. Both preview and promotion also omit pack orchestration,
meaning checkpoint and objective consequences disappear from the demonstration and the real branch.

**What changed:** `/simulate` and `/simulate-enter` are no longer classified as two missing client
calls. They are a returned cross-layer contract with seven concrete repairs: self-contained preview
state, one shared authored-walk derivation, orchestration parity, authored labels, never-silent
truncation/subvariation fields, writer scoping, and one unambiguous batch bound. No misleading UI
was added over the incomplete payload.

**Verification:** the return was re-derived at `RunService.simulate`, `enterSimulation`,
`BranchComparison.NodeRef`, `CompareView`, and `comparisonNode`; the work index remains 573/573
routed with zero orphan rows.

**Next:** Claude amends N-way comparison on this buildability return. Codex resumes it only when
the preview payload and parity rules are accepted; meanwhile the longitudinal/campaign migration
chain remains blocked by D1011's unresolved accepted-RFC questions rather than by missing code.

## 2026-08-23 — Module reducers reached a real-ancestor identity boundary

**What landed:** the learner-module checkpoint widens declarations to the accepted fourteen-field
shape and implements exact registered deduplication, directed rules-only subsumption, bounded
novelty with honest abstention, and loud post-reducer backstops whose recorder cannot affect the
delivered packet.

**What changed:** D1164 returns only the novelty-identity closure to the RFC author. For an
unregistered event, `factIdentity@1` includes `nodeId` and move anchors, so two real ancestor nodes
cannot match. The previous boundary shape could pass only by reusing one node id. The checkpoint
therefore abstains rather than presenting every anchored event as novel.

**Verification:** focused module contract/reducer tests pass and runtime typecheck is green. The
fixtures pin polarity separation, directed checkmate→check subsumption, non-subsumption of passed
and isolated pawns, distinct-node novelty abstention, and recorder-failure byte stability.

**Next:** author the D1164 stable-identity/exemption closure; meanwhile continue the independent
module registry and presentation work without claiming `positionNovelty@1` complete.

## 2026-08-23 — The free engine-composed bot screen abstained before the ladder

**What landed:** D1163's preregistered, zero-engine-call screen replayed 268 positions and wrote
the complete 3×3 Maia and five-profile engine matrices plus paired bootstrap intervals. The roster
now cites this one harness, closing D1183 without duplicate work.

**What changed:** the formal verdict abstains because the Maia positive control did not identify
its own bands: 1400/1600/1800 peaked on human 1600/1800/1800. The directional evidence is still
unanimous: Stockfish argmax and every guarded Boltzmann probe peaked on human 1800. Temperature
reduced move-match magnitude but did not create lower-band identity. D1184 records that the Gate-0
statistic itself must be replaced under a new preregistration before reuse.

**Verification:** the focused harness passed 2/2, pins all four source digests, excludes 11 mixed
mate/cp positions without coercion, uses 10,000 deterministic paired bootstrap samples, and invokes
no engine or network. D1166 remains open because the raw capture is not committed.

**Next:** do not fund the engine-composed game ladder or make human-like/persona/Elo claims from
this family. Continue D1162's evidence-to-move head as the independent variant-portable research
lane, and resume the learner-module integration once D1164 supplies stable novelty identities.

## 2026-08-23 — Compare structure evidence stopped leaking detector identifiers

**What landed:** Compare strips and provider guidance now render the operands actually retained by
`derived.compare.structure_delta@1` — color, role, squares, file, count, shade, form, and zone —
through one deterministic runtime renderer. Learners no longer receive raw identifiers such as
`isolated_pawn` as prose.

**What changed:** D1213 returns the remaining contract mismatch to `learner-modules`. Its A14 asks
for before/after values, but the declared projection retains only the newly appeared observation;
the implementation therefore says `appeared` and does not manufacture a missing baseline.

**Verification:** the focused Compare and guidance suites pass 30/30, and the runtime and server
typechecks are green.

**Next:** the RFC author must either amend A14 to the retained appeared-fact contract or explicitly
widen the projection and derivation. The production module registry remains returned on D1205,
D1206, and D1213; the independent reducers stay available.

## 2026-08-23 — Live projections and imported source tips became non-writing boundaries

**What landed:** `/live/overlay/:runId` now resumes through a projection-only controller. It ignores
an existing browser writer claim, observes the run read-only, and never asks the opponent provider
for a move. Both server move paths also refuse to extend an imported primary mainline at its tip;
rewinding and creating a rehearsal branch remains available.

**What changed:** D1210's two independently shipped defects can no longer compose into a fabricated
move on a followed game. The overlay boundary is stronger than a match-only short circuit: it has no
writer session even for stream sessions. The imported-run guard protects the source object at the
server boundary, so a different client cannot bypass it.

**Verification:** the focused import and controller suites pass 30/30. The controller fixture proves
that a saved writer lease is withheld from the graph request, and the import fixture proves both
move paths refuse at the tip while rewind-and-branch still succeeds. Server and web typechecks are
green.

**Next:** live-source Phase B still needs the followed-source object from D1211; this repair does not
pretend a sealed run can grow. The remaining live-overlay documentation claim is corrected here.

## 2026-08-23 — Campaign event semantics reached the persistence boundary

**What landed:** the migration-independent campaign core now has a pure, exported state fold over
the accepted five-event grammar. It derives path progression, nine-layer completion, charge
inventory, any-verdict module unlocks, and prestige eligibility without adding a score or chess
judgement.

**What changed:** the implementation stopped at two buildability gaps rather than laundering them
into storage: the accepted event grammar cannot express `abandoned`, and its required cursor cannot
represent a fully sealed campaign. D1233/D1234 record the return; the checkpoint takes stored
lifecycle status explicitly and uses a nullable cursor without exposing either as a persistence
contract.

**Verification:** the focused campaign contract/state suite passes 15/15 and the runtime TypeScript
project is clean. Negative fixtures fail non-contiguous streams, unknown/out-of-order nodes,
inactive seals/spends, duplicate grants/seals, forged rewards, exhausted charges, and lifecycle
conflicts.

**Next:** the RFC author pins abandonment authority and the terminal cursor shape. The migration,
routes and campaign surface then resume behind the already ordered longitudinal/bot-policy schema
work; this checkpoint needs no rework whichever of the two explicit lifecycle authorities wins.

## 2026-08-23 — The checked reasoning comparator became reachable

**What landed:** the checkpoint sheet now offers the already-implemented reasoning-review route
when an external language-model provider is configured. It sends only the recorded checkpoint
sequence, renders only the server's checked fixed-frame proposals beside the matching authored
point, and gives empty/error states without changing the durable detections.

**What changed:** D1141 drains from four to five of eight formerly unreachable routes. The client
states the boundary at the control: the provider may select exact learner words, but cannot add a
detection or grade the reasoning. No provider means no control. The two `/simulate` routes remain
returned on D1154; `/progress/metrics` remains intentionally operator-only.

**Verification:** focused API and screen suites pass 25/25 and the web TypeScript project is clean.
The API fixture pins URL encoding and the checkpoint event payload; the surface fixture pins
provider gating, exact occurrence selection, the honesty sentence, and the returned fixed frame.

**Next:** do not expose simulation until the returned N-way payload can resolve scratch nodes and
replays checkpoint/objective state. Continue independent accepted work while that author round and
the collector work proceed.

## 2026-08-23 — Bot trait units and human-model presentation stopped overstating evidence

**What landed:** the bot-policy compiler now names controlled-trait change as a fraction and rejects
non-finite, sub-gate, and above-one values. The human-model inspector separately renders candidate
moves as SAN and distinguishes a requested Elo from a band the recorded engine actually applied.

**What changed:** D1181's unit-check subdefect is closed without pretending its depth-bound or
candidate-trait population blockers are solved. D1264 closes the learner-facing trust leak: a
request no longer reads as engine capability, and UCI transport tokens no longer stand in for chess
notation. No bot profile, personality claim, or rating claim was added.

**Verification:** the focused bot-policy, outcome-presentation and screen suites pass 43/43; server
TypeScript and the Svelte/TypeScript check are clean. Negative fixtures reject `12.28`, keep `0.0312`
below the gate, accept `0.1228`, and show a requested-but-unapplied 1500 band beside `Ke2` rather
than `e1e2`.

**Next:** resume the preregistered D1162 evidence-to-move screen after the concurrently amended
threat producer and adapter agree on one payload contract. The stopped run produced no model result.

## 2026-08-23 — Sourcing fixtures became request-bound captures

**What landed:** the tablebase and Explorer response fixtures now contain real HTTP bodies. Each has
an F2 provenance sidecar carrying the exact GET URL, real retrieval time, response status, transport
digest and byte count, plus the repository-byte identity after the declared terminal-newline transform.
One shared reader verifies both identities before returning the body and its source record.

**What changed:** the old tablebase file was a 243-byte projection of a 6,330-byte response, and the
old 440-byte Explorer file was hand-shaped even though the original 1,626-byte capture survived in
the source cache. Worse, both fixture functions relabelled those bytes as a response to any requested
position. They now refuse a URL mismatch. Tests concerned only with attachment plumbing use an
explicit E1 boundary fake, so no synthetic number is presented as captured chess evidence.

**Verification:** the focused provenance, Syzygy, Explorer, tablebase-walk and refusal-coverage suites
pass 33/33; server TypeScript is clean. The negative fixtures prove a one-byte mutation and a request
substitution both fail with named sourcing errors.

**Next:** W20's “15 literal issue codes” premise is stale: the issue channel now includes dynamic
`PACK_${code}` values and cannot truthfully close by aliasing the existing thrown-error union. Re-scope
that vocabulary before implementation rather than manufacturing a green but incomplete type.

## 2026-08-23 — The branch runtime envelope reached 3,000 events

**What landed:** the original server-bound latency instrument now keeps 2,000- and 3,000-event
snapshots in its measured population and asserts the standing p95 interaction bands. The canonical
runtime documentation records both new rows and lifts the experimental envelope from 1,000 to 3,000
events; sessions above that remain explicitly uncharacterized.

**What changed:** the accepted 99-branch × 20-ply shape no longer exceeds its runtime's own stated
envelope. At 3,000 events, p95 cold replay plus graph transport was 3.984 ms, rewind 4.027 ms, and
implicit fork+commit 6.484 ms on Node 26.7.0/macOS 26.5 arm64. The feared limit did not appear in
runtime mutation or transport on this local instrument.

**Verification:** the focused latency test passes 1/1 after 3 warm-ups and 20 measured samples for
each operation at each of 200, 1,000, 2,000 and 3,000 events. The test now fails if rewind crosses
100 ms p95 or implicit fork+commit crosses 200 ms p95.

**Next:** this does not measure the learner's browser or wide-area transport. If large branch sets
feel slow, measure the rail and browser composition separately rather than attributing the delay to
the runtime fold.

## 2026-08-23 — RFC archival became a two-ended checked transition

**What landed:** status parity now reads prose obligations as well as Discharges, and rejects an
implemented or archived process-era RFC whose Open questions have neither an explicit disposition
nor a living ledger route. A seventh parity rule rejects an RFC archival change that omits either
the shared ledger or the exploration log. The generated work index now reads registered archived
RFCs, exposes those references separately, and never treats immutable text as a living owner.

**What changed:** the archive is no longer a routing blind spot. At landing, 107 open rows retain a
historical reference in an archived RFC, but every one also has a living destination: 0 are
archive-only and 0 are unrouted. `graduation-clearance` can no longer become implemented while an
unrouted prose question survives merely because its Discharges section says `none`; concurrent
authoring also moved exact legal mobility's remaining module binding into an explicit Discharge.

**Verification:** 21 focused parity/index tests pass. The repository instruments report P1–P7
green before the concurrent RFC authoring pass began, and a 1,105-row work index with 623 open, 623 routed,
0 unrouted, and 107 carrying archived references.

**Next:** archived references are diagnostic history, not owners. New work must continue to route
through an active RFC or living planning document, and every future archive transition must update
the ledger and log in the same commit.

## 2026-08-23 — Registered evidence passed its first move-distribution screen

**What landed:** the preregistered D1162 evidence-to-move screen ran over 268 held-out positions and
all 9,044 captured legal candidates. Evidence-only beats uniform expected human-move match by
0.033734 [0.024141, 0.045075]; evidence+engine beats engine-only by 0.018734
[0.009559, 0.029689]. Coverage is 100% and both directions hold in every measured band.

**What changed:** the first attractive pass was not accepted. Audit found a mean-square/variance
error and a position-clustering error in the instrument; both were fixed without changing the
feature plane or verdict rule, and the run was repeated. Construction also exposed a production
threat-abstention payload that violated its own manifest operands; the producer now retains the
declared empty collection and a sealed candidate-vector fixture proves it.

**Verification:** corrected D1162 fixed-population tests pass 2/2 in 278.7 s; the separate D1163
Maia context replay passes 2/2 on the same four digests; focused tactics and candidate-evidence
tests pass 19/19. The corrected result supersedes the provisional output.

**Next:** this is a representation pass only. Secondary cross-entropy, top-choice and engine-safety
readings are mixed, every evidence arm selected the maximum ridge penalty, and H5/C5 remain unmet.
Run the already-required second preregistered population, then multi-ply coherence, before any
production, human-like, Elo or personality claim.

## 2026-08-23 — Independent evidence population replicated signal and rejected the fitted head

**What landed:** D1162's second preregistered population ran on 571 unique, non-overlapping
positions from 108 rated Lichess games across three speeds, three rating bands and plies 8–48.
Stockfish 18 returned a set-exact depth-12 score for every one of 19,172 legal candidates. After
the declared mixed mate/cp exclusion, all four arms shared 515 decisions / 17,359 candidates.

**What changed:** the formal mean-probability gate passes strongly: evidence−uniform is 0.104498
[0.081307, 0.129304], combined−engine is 0.078447 [0.056700, 0.101782], and no rating band
inverts. The head is nevertheless returned rather than promoted. Combined cross entropy is 6.451
against engine-only 2.958, top-choice agreement falls 33.5%→15.8%, expected loss rises 167→251 cp,
and >250-cp mass rises 23.0%→43.4%. The non-proper primary rewarded a distribution that puts high
mass on a subset and nearly zero on many other observed moves. D1297 records the gate defect.

**Verification:** the preregistration was committed separately at `633f541`; its synthetic
controls pass 1/1 before the population arm. The full arm passes 2/2 in 413.41 s from a clean clone
of that commit, isolated from the concurrent semantic-collector implementation. The committed PGN
and first-screen Stockfish digests match; all 571 engine/generated legal sets are identical; folds
and 10,000-sample intervals cluster by game.

**Next:** use the two seen populations only for replacement-model development. Replace the
diagonal heuristic and mean-probability clearance with a proper-score gate, freeze the model, and
evaluate on later untouched games from the surviving R2 source prefix. Do not start the multi-ply
packet or implement the selector until that gate passes; H5/C5 remain unmet.

## 2026-08-23 — The proper-score repair retained signal and refused the standalone selector

**What landed:** D1297's bounded conditional-logit development ran over the already-exposed 515
decisions / 108 games / 17,359 candidates. It compared only the declared raw and
projection-balanced transforms and ridge grid, selected on fold 3, then read fold 4 once. The
machine-readable results, compact report, research dossier and optimizer audit are committed
together; no third-population game was selected or read.

**What changed:** the model fixes the old probability pathology and retains the representation
signal. Combined cross entropy beats engine-only on validation (2.454 vs 2.488) and confirmation
(2.052 vs 2.528); top-choice and expected-loss budgets pass. The standalone freeze still fails:
severe mass rises +1.97 and +1.34 percentage points, above the independently fixed +1-point ceiling
on both folds. The evidence/combined full-development fits also hit the declared 80-iteration cap
above the numerical stopping target, so no coefficient vector is promoted.

**Verification:** the analytic-gradient and monotone-choice controls pass; the full bounded arm
passes 2/2 in 150.40 s and reproduces the earlier aggregate readings. Cache digest, representation
commit, raw-input digests and model-output digests are recorded in the JSON result.

**Next:** do not tune this standalone family again and do not spend the reserved third population.
Preregister a distinct composition using the already-measured, disclosed 250-cp `ErrorGuard`, with
observed-human-move exclusion as an explicit adverse measure and guarded-engine as the identical-mask
control. H5/C5 and all human-like, Elo, personality and multi-ply claims remain blocked.

## 2026-08-23 — The declared guard composition failed on two different clauses

**What landed:** D1312 composed the fixed proper-score selector with R11's disclosed, inclusive
250-cp guard. The plan and able-to-fail fixture were committed before the result. Guarded engine is
the identical-mask control; excluded observed moves stay explicit refusals; the reserved third
population was neither selected nor read.

**What changed:** the guard repairs the severe tail and usually leaves broad choice (median 24 and
23 surviving legal moves). Pooled observed-move survival passes at 96.6% and 93.5%. The selector is
still unstable: validation guarded-combined cross entropy is 2.313 against guarded-engine 2.294,
while confirmation reverses strongly to 1.862 against 2.250 but admits only 14/17 low-band human
moves (82.4%, floor 85%). Different clauses reject the two folds, so this exact composition is
returned and cannot be boundary-tuned on these data.

**Verification:** the guard boundary/renormalization/empty-mask fixture and measured arm pass 3/3
with one unrelated full D1297 arm skipped in 20.71 s. The JSON records every group, model digest,
removed mass, survivor count and optimizer diagnostic.

**Next:** D1320 corrects the product consequence without changing the result: research has refuted
this mechanism, not overruled D1271's owner-funded non-Maia goal. The selector RFC must present the
owner fork—accept the 1.0 refusal or authorize a materially different research family. The evidence
foundation continues unchanged for Support, Review, drills and longitudinal analysis.

## 2026-08-23 — Non-Maia model-family survey separated architecture from data readiness

**What landed:** D1328 compared the two refused evidence selectors against primary work on
set-dependent choice, set architectures and current human chess policies. It names one materially
different family: a candidate policy conditioned on the complete, unordered legal-move set. The
survey also freezes seven prerequisites covering compact registered projections, set equivariance,
legal-set closure, proper loss, declared context, separate safety and no explanation laundering.

**What changed:** “try a bigger model” is no longer an executable next step. The 515 exposed human
decisions can falsify compact mechanisms but do not ground training a higher-capacity interaction
model; the surveyed chess-policy programmes use sequential population data and declared context,
with Otter alone reporting 6.1 billion training positions. The next bounded generation is a
data-readiness census and grouped learning curve. No model was fitted and the reserved third
population was not opened.

**Next:** amend `rfc/evidence-move-selector.md` with the model/data contract and the priced owner
fork: fund the census, defer the training programme beyond 1.0 while the measured Maia-3 roster
ships, or explicitly refuse the non-Maia 1.0 goal. H5/C5 remain unchanged.

## 2026-08-23 — Fresh-source census passed mechanics and caught an undefined cell gate

**What landed:** D1329's aggregate-only harness measured a fixed 16 MiB prefix from the June 2026
Lichess CC0 standard dump, separate from every July selector population. It found 50,992 complete
games and 3.02m eligible decisions; all 50,818 eligible non-bot finished games replay legally.
Ratings cover 100% and clocks/time controls 99.9704%. Synthetic controls prove missing values remain
missing. Output contains counts/digests only—no game, player, position or move identity.

**What changed:** the source is not the immediate blocker. The preregistration's fifth gate was: it
said “preregistered rating cells” without listing them. D1162's 1000–2199 reading passes all 27
cells; an all-emitted-bands reading fails several edge cells. No interpretation was selected after
the fact. V2 now freezes 36 cells derived from the production roster and a 256 MiB final range.

**Next:** run that fixed range, then the outcome-blind producer projection/cost arm after the
collector implementation stabilizes. A model fit, learning-curve generation and the owner compute
budget all remain downstream; the reserved D1297 population remains sealed.

## 2026-08-23 — Repaired selector source-size gate passed all 36 cells

**What landed:** the precommitted 256 MiB June range streamed 1.92 GB without retaining corpus
records. It contains 827,067 complete games / 48.47m eligible decisions; 823,782 eligible games
replay legally with zero failures. Rating coverage is 100%, clock/time-control coverage 99.9481%.

**What changed:** all 36 frozen 1000–2599 × bullet/blitz/rapid × ply-window cells exceed the 10k
floor; the minimum is 13,809 at 2200–2599 rapid opening. Source clauses 1–5 are complete. The
chronological range proves availability and pipeline mechanics, not month-wide representativeness.

**Next:** measure outcome-blind producer success/cardinality/time/bytes after the collector wave
stabilizes, then price 10k/100k/1m and ask the owner for a budget. No model fit is authorized and the
reserved D1297 population remains sealed.

## 2026-08-23 — Four-draft wave landed, and the register learned to count its own schemas

**What landed:** four RFC drafts, written concurrently and each verified at HEAD —
`social-play.md` (`4dbb624`), `training-mode-variants.md` (`05f8c80`), `hint-distance.md`
(`85a0584`) and `bot-route-source.md` (`a8f1a76`). Ranks 1–4 of [[D1330]]'s live debt. Fourteen
findings landed as ledger rows D1341–D1354, each routed to the spec section that owns it.

**What changed, and the one that matters beyond this wave:** `schemas/campaign.schema.json` has
shipped since `976d523` carrying a versioned `$id`, loaded and validated at runtime, **with no
register, no version constant, and no owning RFC** — and `register-check` could not notice,
because its schema set was a hand-written list of four filenames. Every check agreed because
every check read the same list; C4 skipped an unregistered resource outright. The schema set is
now derived from `schemas/`, keyed by the slug in each `$id`, and **C7** refuses a schema with no
register resource, an `$id` that is not a versioned tabiya urn, or a register whose schema has
left the tree. C2 gained an arity clause, without which `lane 1` would have read as *above*
`0.27` on the pack schema. The campaign register is open, and its landed row records
**no owning RFC** rather than back-attributing one.

**What was blocked and is not:** the prediction encounter gate was dead in both clauses (0 of 56
pack documents carry a prediction interaction); `training-mode-variants` lifts it. The
`live.stockfish.pv@1` projection declares *"never a guidance binding"* and `learner-modules` §4.8
binds it in two guidance presets — the instance is repaired by `hint-distance`, the class is
[[D1343]] and open, because `limitations` is a machine-readable field the machine reads only for
length.

**What went wrong in our own process:** three of the four drafts shipped a `## Ledger rows`
section inside the RFC and touched `design/BACKLOG.md` not at all. Deferring ids under a four-way
race was right; leaving nobody to land them was not. Reconciled here as [[D1354]], with the
standing clause added to `planning/rfc-drafting-queue.md`.

**Next:** cross-review the four fresh drafts independently, then ranks 5–10 of [[D1330]] —
`theory-drill-current-joins`, `shared-candidate-evidence-packet`, `bounded-policy-targets`,
`theory-knowledge-pipeline` and the two desk teardowns. Four owner decisions remain drafted and
waiting in `planning/decision-queue.md`, the failure state ([[D1300]]) first.

## 2026-08-23 — Exact Guided Hint selector failed perspective and latency gates

**What landed:** D1363's preregistered instrument replayed the exact seven-family
`hint-distance` table over the fixed 64-position D1061 population and both stored engine arms from
a clean extraction. The result records every selected occurrence identity, phase/family/side mix,
constructor fixtures and selector timing; no engine, network or LLM call occurred.

**What changed:** the RFC's raw precedence is refuted rather than merely unmeasured. It selects an
opponent edge in 28/72 non-empty rows, including 18 opening rows, while the packet would disclose
the root side's first move. The candidate pool itself is 78 opponent / 72 root; `loose_piece`
accounts for 130/150 candidates and 58/72 selections. Root-side filtering reduces reach to 30/64
depth-12 and 22/64 at 100 ms but does not establish causality or benefit. Depth-12 selector-only
p95 is 1,595.9 ms against the frozen 1,400-ms headroom, before engine/transport/rendering.

**Next:** keep `rfc/hint-distance.md` returned. Preregister per-family perspective/polarity and a
closed relation to the root action, then consume D1071's shared score-free packet and measure
cold/warm/provider-off end to end through the sealed disclosure packet and deterministic renderer.
Theory/authored/tablebase adapters remain independently available when the engine arm abstains.

## 2026-08-23 — Relation-safe Guided Hint selection measured the honest-empty majority

**What landed:** D1397 projected every one of D1363's 150 exact occurrences through a
preregistered three-relation grammar and family/sign admission table. The 115-ms focused suite
passes 2/2, including permanent opponent-precedence and disallowed-sign injections. The projection
recomputes no chess truth and changes no production code.

**What changed:** only 35/150 occurrences are eligible. The strict-direct selector reaches 10/64
positions in both engine arms; allowing a later root-side event in the exact searched line reaches
16/64 at depth 12 and remains 10/64 at 100 ms. Immediate family/status/relation agrees 10/10 across
arms, while all six extra later-line positions are depth-only. Refusals are 78 opponent events, 16
self-exposure-created loose-piece events, 20 preserved self-risk events and one non-persistent
promotion. The seven-family ladder is therefore a sparse supplemental module, not universal help.

**Next:** Claude may amend the RFC's perspective/sign table from D1397, but acceptance still waits
for D1071's shared candidate/event packet, a sealed rung disclosure path and cold/warm/provider-off
end-to-end measurement. Independent theory, authored and tablebase modules provide grounded
fallback; silence remains correct when none is available. Owner use later judges usefulness.

## 2026-08-23 — Live-debt ranks 5–8 drafted; one draft returned; three shipped defects fail silent

**What landed:** four RFCs — `theory-drill-current-joins` (`1f31dfe`), `shared-candidate-evidence-packet`
(`3a291ab`), `bounded-policy-targets` (`2549ce6`) and `theory-knowledge-pipeline` (`de59c8a`) —
plus the corrections that close [[D1330]]'s list. Ranks 9 and 10 were **struck**: the Chessigma
teardown was routed the day it landed (six ledger rows in its own commit, a `capability-watch`
route, four RFCs), and rank 10 double-counted rank 5. **0 of 14 teardowns are live debt, not 2.**

**What was returned:** `rfc/hint-distance.md`, on eight buildability blockers from codex plus two
structural findings from cross-review. Its central primitive survives — *a useful hint is a semantic
event on a searched line, not a PV with some moves hidden* — but the redaction is declared rather
than built (the payload carries the answer move at every rung), *an event appears in the PV* is not
a reason for the learner's first move, four of its seven eligible families are readings or
predicates rather than events, and its measured reach is **4 of 64**, not the 31–56/64 band
[[D1352]] recorded. That row was the coordinator's and is corrected as [[D1376]].

**Three shipped defects that fail silent, all verified at the line.** `evaluatedAlternatives`
cannot differ from `legalAlternatives` on the main path, and the unevaluated case selects two
families the complete population rejects — a failure that *strengthens* the claim a learner sees
([[D1385]]). `offWindow`, whose whole meaning is *exclude from measurement*, is accepted as caller
input on an ingested selection ([[D1389]]). And the attribution gate reads `binding.spans` while
`claim-semantic-anchors` replaces that shape without naming the licence reader once, so
`ATTRIBUTION_MISSING` would stop firing for every machine-bound claim ([[D1393]]).

**What changed in the instruments:** C7 derives the schema set from `schemas/` and C8 refuses an
undeclared schema edit by digest — the second added because cross-review showed the first did not
force a schema-editing RFC to declare a lane.

**What went wrong in our own process:** the shared worktree cost real work. The coordinator swept
codex's in-flight ledger rows into one commit and a fork's draft into another; a fork's
`checkout-index` clobbered another fork's register row. All were recovered by their owners.
Pathspec-limited commits and content-hash staging are now the practice, and [[D1381]] adds the
missing clause: shared **code sites** must be pinned the way ledger ids already are, after two
drafts commissioned the same day lifted the same gate and claimed the same repair.

**Next:** the `hint-distance` redraft is gated on a selector exploration pass; the four owner
decisions in `planning/decision-queue.md` remain, [[D1300]] first. `work-index` carries 12 unrouted
rows belonging to the `hint-distance` and `bot-route-source` review lanes.
## 2026-08-23 — Longitudinal projection cost frozen before measurement

**What landed:** D1405 preregisters a clean-extraction cost instrument over the fixed 108-game,
6,991-ply imported sample. It measures terminal 20/40/80-ply whole-prefix mutations on eight fixed
paths per arm, 25 complete bulk-import games, exact legal-alternative/event/reference volume and
the cumulative replay counts implied by running the same projection after every move.

**What changed:** the longitudinal-store return now has an executable research gate rather than a
general warning about quadratic work. The existing 500 ms post-move server-side envelope is the
frozen refusal boundary. This first pass is explicitly a lower bound: committed
`localSemanticEvents` cannot construct the 21 population/path families identified by B2, so the
repaired constructor registry must repeat the same measurement before implementation.

**Next:** land the disposable harness, run the binding arms from a clean extraction, publish the
research dossier and route the measured write schedule back into the RFC author round.

## 2026-08-23 — D1405 smoke run corrected the byte instrument before binding

**What happened:** the first shared-tree smoke arm completed but was discarded as required. It
exposed that the draft harness priced one stored reference per emitted alternative event, while
the RFC schema stores one decision reference per projection-family row. That would overstate
storage and answer a different question.

**What changed:** the preregistration now separates the complete event population (count plus
canonical digest, which proves the compiler workload) from the actual store projection (one
opportunity/occurrence decision ref per family row). The four fixed timing arms are also executed
sequentially and write separate receipts before a pure aggregation pass, so a long bulk arm cannot
erase completed evidence. Population sizes, the 500 ms boundary and the 20→80 shape gate did not
move.

**Next:** commit the corrected instrument, then generate all four quotable receipts from a clean
extraction of that commit.

## 2026-08-24 — Both CI failures reproduced and routed to clean-SHA parity

**What landed:** exact inspection of GitHub Actions runs 32670024753 (`make verify`) and
32670024735 (`make test-browser`) at `f0d5460`, including the uploaded Playwright traces. D1435
records the process defect. Five deterministic failures were repaired without weakening their
claims: the phantom theme token, `derivationAnyOf` fixture construction, two Svelte/browser test
races, and the shape-marker test's wrong assistance primitive. The declaration-census assertions
remain unchanged but have a 60 s machine envelope instead of 20 s.

**What changed:** the failures were not hidden CI-only behavior. The exact workflow commands can
catch them locally; they simply were not both run at the final committed SHA after shared
manifest/UI changes. One browser failure was environment-sensitive because its 500 ms animation
sampler started before opening and filling the move form. Local Node is v26.7.0 while CI pins Node
24, and the repo's `engines` range does not enforce parity. The live capability snapshot remains
owned by the concurrent collector pass: its expected count moved 184→188 while the dirty catalog
has already moved to 189, so it cannot be truthfully pinned until that pass freezes.

**Next:** add one Node/pnpm-pinned clean-extraction local CI command that runs both workflow
bodies and records the commit id. After the collector pass lands, reconcile the capability
snapshot once and run that command on the resulting commit before any push.

## 2026-08-24 — D1405 refuses synchronous whole-run longitudinal projection

**What landed:** the clean-extraction 20/40/80-ply and 25-complete-game arms, canonical aggregate,
research dossier and coverage/ledger routing. Every receipt names commit `0d4e27f`, the same PGN
digest and the same compiler/source digest; the aggregator refuses mixed receipts.

**What changed:** native p95 is 11.44/23.43/42.56 seconds against 500 ms — 23×/47×/85× over.
Exact all-mutation replay work grows 50,385→816,142 evaluated edges. The 25-game rebuild takes
738.8 seconds (0.0338 games/s) before database work. Whole-run replay after a move is refused;
incremental new-decision append remains a candidate but needs its own latency distribution, while
complete rebuild/import projection moves to bounded background work.

**Boundary:** this is a lower bound. The committed one-edge compiler cannot produce the 21
complete-population/recorded-path families in review blocker B2, and the run excludes database
transactions and concurrency. The repaired constructor registry must repeat the arms.

**Correction:** the CI process row referenced as D1435 in the immediately preceding append-only
entry collided with the preset amendment while both writers were active. Its permanent ledger id
is **D1444**; the earlier log bytes are retained rather than edited.

**Next:** Claude can now amend the longitudinal-store write schedule and keep the RFC returned for
its other six blockers. Codex returns to D1444's clean-SHA CI parity gate after the manifest pass
freezes its capability count.

## 2026-08-24 — D1440 scaffold guard admits stronger verification chains

**What landed:** the scaffold verifier now treats `verify` prerequisites as a required set instead
of an exact ordered string. Missing targets and missing required checks fail; extra checks are
legal. Three able-to-fail fixtures run inside `pnpm schema:check` before the live verifier.

**What changed:** adding `work-index` and `account-data-lifecycle-check` had made the stronger
verification chain fail its own stale guard. That closed-list assumption is removed rather than
updated to a new closed list, so the next instrument does not reproduce the defect.

**Correction:** concurrent ledger work assigned D1444 to the module-layer finding after the CI row
had taken that number. The CI parity defect's permanent id is **D1448**. Earlier append-only log
references remain unchanged.

**Next:** D1448 adds the clean-commit, Node-24/pnpm-11.18 parity entry point that runs both workflow
bodies and reports the exact commit it validated.

## 2026-08-24 — D1448 local CI parity gate implemented

**What landed:** `make ci-local` pins Node 24 and pnpm 11.18.0, requires the same executable
Stockfish contract as verify CI, refuses any tracked or untracked working-tree change, runs the
frozen install plus `make verify` and `make test-browser`, then rechecks HEAD and the tree before
printing a commit-addressed PASS receipt. `.node-version` makes the required runtime discoverable.

**What changed:** focused-suite success can no longer be presented as CI parity. On the current
shared tree the command refuses for the correct three reasons — Node 26, dirty concurrent bytes
and no `SF_CMD` — before running anything. Unit fixtures pin both the clean preflight and the
combined refusal; the scaffold verifier's own fixtures remain in the schema-check chain.

**Next:** run the first binding receipt from a clean Node-24 extraction with checksum-pinned
Stockfish. D1448 stays implementing until that full command passes; any failure belongs to the
exact commit named by the run rather than to the shared working tree.

## 2026-08-24 — D1448 first clean-commit run refuses a stale manifest snapshot

**What happened:** `make ci-local` ran from an isolated extraction of commit `f54ee32c`, under
Linux, Node 24, pnpm 11.18.0 and checksum-pinned Stockfish 18. Frozen install and the complete
typecheck passed. The test phase reported 1,097 passes and 14 failures, so no PASS receipt was
issued.

**What changed:** one failure is semantic and locally catchable: the committed capability fixture
still expects 34 producers / 184 projections / 207 bindings / 65 events and eligibility, while
the committed compiler returns 35 / 188 / 210 / 67. The concurrent collector pass already edits
both the fixture and catalogue in the shared tree, so this run records the stale committed seam
without staging or overwriting that work.

**Boundary:** the other thirteen failures are 5-second timeouts from running an amd64 container
under ARM emulation, not assertion failures. The timed-out cases completed at roughly 5.03–5.83
seconds and the census suite took 67.58 seconds. This emulated run is useful for the deterministic
snapshot mismatch but is not a native performance receipt.

**Next:** after the collector pass freezes and commits its manifest, make a fresh extraction of
that commit and run parity natively. D1448 remains implementing until both workflow bodies pass
and the command prints the commit-addressed receipt.

## 2026-08-24 — D1448 checking workflow corrected after pre-push overreach

**What changed:** the ad-hoc repository `pre-push` hook is removed and the local
`core.hooksPath` override is unset. It had coupled every push to Node 24, a clean shared tree,
Stockfish, Docker Compose, the full unit suite and the browser suite. That is not a useful Git
hook contract and was not authorized by the requirement for locally reproducible CI.

The repository now uses pinned Lefthook with one `pre-commit` hook. It always checks the staged
diff, selects a workspace-specific typecheck only when that workspace has staged source, runs
the process registers only for staged design/RFC/planning changes, and runs fast scaffold/config
fixtures for affected infrastructure files. The complete verification and browser bodies remain
explicit commands: `make check` for the current working tree and `make ci-local` for the pinned
CI toolchain. Neither command is attached to push.

**Measured result:** the first over-broad hook passed but took 77.39 seconds, because it ran the
whole workspace typecheck and deployment packaging. After splitting by staged workspace and
removing packaging from commit time, the same staged infrastructure change passed in 0.27
seconds; unrelated process and workspace jobs were visibly skipped.

**Next:** run the explicit Node-24/Stockfish/Compose/browser parity command end to end. D1448
remains implementing until it passes; push behavior is restored independently of that receipt.

## 2026-08-24 — exact legal mobility implemented; requested-sight binding remains

**What landed:** one exact actual-turn move authority now serves runtime commits, web input,
server sourcing, engine candidates, semantic alternatives and simple move counts. The exact
`rules.mobility.reading.legal_moves@1` projection is registered inspector-only with a strict
adapter. The permanent census classifies all fourteen original enumerators as eight migrated roots
and six named local searches.

**What changed:** castling no longer overloads one `to` field with three meanings. Runtime events
store Chess960-safe king-to-rook identity, board/ARIA/Compare/transition consumers use the king's
semantic landing square, and display remains SAN `O-O`/`O-O-O`. Standard-UCI engine and authored
pack bytes and Lichess Explorer bytes have named source dialects and an explicit recorded
conversion boundary. Promotion q/r/b/n now comes from the same explicit authority in every input
mode.

**What the implementation pass caught:** the checkpoint's green census asserted 7/7 against the
accepted RFC's 8/6 contract and had never edited two required destination consumers. The repaired
fixtures pin the 8/6 split, standard and Chess960 castling (including a king destination equal to
its origin), en-passant, four promotions, stored runtime identity, board highlight, Compare route,
transition operands and SAN.

**Still open:** RFC Discharge D1. `learner-modules` owns the requested-square-sight binding and its
assistance ceiling. This implementation registers the exact operand but deliberately reveals no
new learner-facing hint or proactive move list.

## 2026-08-24 — longitudinal-store return amended; refused implementation removed

**What changed:** the RFC and register now agree that `longitudinal-store` is draft and awaiting
independent re-review. The amendment replaces the one-edge/all-events fiction with a set-equal
constructor registry: 46 one-edge families, 13 complete-population avoidance families, and eight
recorded-path families explicitly deferred until they have a declinable opportunity denominator.
It also replaces node-id refs with typed move/prediction identities, derives immutable
`observed_at` from `run.started.at`, binds the revision to both output and registry digests, and
resolves all three previously acceptance-blocking open questions.

**Measured consequence retained:** D1405's 11.44/23.43/42.56-second p95 at 20/40/80 plies rules
out semantic whole-run replay in a request. The amended schedule writes only a durable job
watermark on mutation, processes bounded event intervals in a worker, and reserves complete
projection for imports, close and authoritative rebuild. The uncommitted synchronous migration
and projection implementation was removed from the shared tree rather than left as plausible code.

**New finding:** `prediction.recorded` carries no actor even though `recordPrediction` permits a
non-owner writer. D1510 records why revision 1 must treat shared-run predictions as honest absence
until a run-schema amendment provides durable attribution.

**Next:** independent buildability review of the amendment. If accepted, implement the three-table
job-backed design and first run the preregistered all-adapter one-decision latency arm; if it misses
500 ms p95, native projection stays background-only. No content, habit, style, Review or campaign
consumer may read partial rows.

## 2026-08-24 — D1405b refuses synchronous single-decision longitudinal projection

**What landed:** the preregistered 72-position / 144-observation arm ran from committed extraction
`68cd2320` inside the repository's genuine Node 24.10.0 build image. Its prototype registry is
set-equal to all 67 semantic event ids: 46 one-edge and 13 complete-population families measured,
eight path families declared deferred. The full receipt, harness and coverage-matrix update are
committed artifacts.

**Result:** combined p50/p95 is 589.8/959.9 ms overall; opening p95 786.7 ms, middlegame 1,027.0 ms,
endgame 499.5 ms, against the pre-existing 500 ms envelope. SQLite publish is 0.242 ms p95; the
collector is the cost. The earlier accidental arm64 run under a Homebrew path labelled `node@24`
was discarded when the binary reported Node 26.7.0; no number from it is cited.

**What changed:** the amended RFC no longer leaves native incremental projection conditional.
Revision 1 writes only the durable job watermark on a request and projects every semantic decision
in bounded background work. Final production adapters rerun the instruments for worker throughput
and batch sizing, not to regain an interactive path without a later RFC and new gate.

**Next:** independent buildability re-review can now judge a fully selected schedule. On acceptance,
implementation begins with the durable job/state table and request-path reachability refusal before
any collector code.

## 2026-08-24 — learner-rating AC-7 narrows the publishable bracket

**What ran:** the AC-7 method was preregistered before its first result, then 2,000 deterministic
trials ran in each of 78 cells: thirteen true BCS points, logistic / slope-matched Thurstone /
fixed-20%-draw response families, and both 12-game count-closing and 3-game clock-closing weekly
schedules. Every period called the shipped `glicko2Update`; no duplicate estimator was used. The
source and result digests reproduced exactly in the repository's Node 24.10.0 arm64 image.

**Result:** only grid points 1450, 1550, 1650 and 1750 clear ≥90% empirical coverage in every
model-arrival cell with all 2,000 trials reaching RD ≤ 60. Per the frozen rounding rule, the
supported publication bracket is **1500–1800 BCS**, not the provisional model-derived
[1006, 2098]. In the slow arm, clearing cells become publishable in 17–20 periods at p50 and
18–23 at p90. Tail cells can remain unpublishable through the 104-period cap. One
1750/draw-floor/count-closing cell is reported borderline at 90.1% coverage with an 88.7% Wilson
lower bound; it cannot widen the bracket and this run narrows it.

**What changed:** `GLICKO2_CONSTANTS`, learner-facing disclosure copy and a cheap source-sealed CI
receipt move together. Applying the narrower bracket exposed D1511: `bounded` previously returned
the raw interpolated point and was honest only because the old bracket lay outside the measured
rungs; boolean saturation also carried no direction. Bounds are now explicit at the measured edge,
and saturation is typed high/low at the server authority. D980, D420 and D442 close on the retained
receipt; the full Monte Carlo rerun remains an explicit expensive target, not a normal verification
step.

**Still open:** this validates only BCS interval coverage and readiness. It does not human-anchor
the scale, establish opponent humanity, detect cheating, complete rated campaign entry or discharge
owner-use validation.

## 2026-08-24 — learner-rating AC-11 becomes an actual build boundary

**What landed:** rating is no longer re-exported from the general `@chess-tabiya/runtime` barrel;
its six real consumers use the explicit `@chess-tabiya/runtime/rating` subpath. A TypeScript-resolved
graph walks the seven rendering roots named by AC-11 — guard, guard conditions, voice, outcome
presentation, feedback, objective and claim binding — and refuses reachability to or from
`rating.ts`. The test includes an injected-edge positive control, so an empty graph cannot pass.

**What the first run caught:** splitting the barrel was insufficient. Web outcome presentation
imported the broad API type file solely for `HumanSplitPage`; that API file legitimately imports
`RatingPublication`, creating a type-only but real path back to rating. The presentation function
now accepts the exact two-field structural input it reads, removing that hidden connection rather
than teaching the graph to ignore type imports.

**Second arm:** four materially different rating states produce different rating-publication bytes
but byte-identical guard events, public feedback, objective/outcome text and sealed voice evidence.
`make learner-rating-isolation-check` runs both arms and is a required `make verify` dependency.
D1512 closes; this is the executable basis on which D395's earlier closure now rests.

## 2026-08-24 — learner-rating AC-10 generated one-result invariant

**What landed:** the fork integration case now tries to seal the already-voided run and proves the
storage authority refuses it, with zero sealed games and zero rated-game increments. A fast-check
property generates 250 sequences of up to 30 win/loss/draw seals and fork/rewind/abandon voids over
one run, then asserts one record, at most one sealed result and exact agreement with the learner's
`ratedGames` counter. This discharges AC-10's generated arm instead of relying on the primary-key
argument alone.

## 2026-08-24 — full-1.0 roadmap rebuilt from vertical capability chains

**What landed:** [[D1504]] closes with a replacement rather than a row-by-row refresh. The roadmap
now has fourteen owned capabilities, each held to evidence, state, production API, experience,
defaults, content, verification and release. Its machine registry assigns all 46 active product
RFCs exactly once, all twelve UX dossiers, all 569 stable UX item ids, every current client route,
and twenty API-family obligations. `make roadmap-check` enforces the joins and is part of
`make verify`; `planning/WORK.md` is reduced to navigation and completion protocol.

**What changed:** “implemented” can no longer mean one layer exists. The unit of completion is the
whole collector→fact→selection→state→application API→opinionated UX→content→release chain. The
execution program freezes evidence/content contracts before broad authoring, then lands durable
state and production APIs, rebuilds the client around journeys/presets, graduates content, and
finishes with release-artifact journeys plus owner use.

**New finding:** [[D1532]]. `/rated-games`, `/rating`, `/rating/history`, `/marks`, and cohort
standing are implemented in `rest.ts`, but absent from `application.ts:isApiPath`; the deployed
application routes them to static handling. Direct REST tests and client callers therefore
overstated production reach. The roadmap now distinguishes implemented from application-routed and
requires production-boundary/container tests for advertised families.

**Still open:** the map makes the work visible; it does not make the product complete. Current
release blockers include unfinished evidence/claim/module contracts, zero graduated packs,
campaign with no API/route/content, an empty bot roster, incomplete longitudinal storage and
Review, 569 UX items at mixed states, and deployment/backup/upgrade/licensing proof.

## 2026-08-24 — browser CI split by contract and castling-note join repaired

**What failed:** GitHub browser run `32730112523` reached Pack A's classified castling deviation,
rendered the theory verdict, and omitted its authored alternative note. The retained Playwright
trace showed the server response contained the note. The client compared the pack's standard-UCI
`e1g1` with the runtime's Chess960-safe `e1h1` as raw strings, so the supporting-note join failed.

**What landed:** checkpoint authored-item selection is now a framework-free function that
normalizes both spellings with `exactMoveIdentity` at the parent position. Its synthetic contract
covers the two castling encodings and a same-move/wrong-class negative. The Svelte screen consumes
that function. The real-pack browser scenario now asserts the semantic `Alternative move` item and
non-empty note rather than pinning the mutable sentence *"Castling into the break"*.

**CI/test contract:** [[D1533]] records the wider debt. Required browser checks are split into
named product-journey, real-content-integration and responsive/accessibility matrix commands;
GitHub runs them as separate steps, `make test-browser-ci` composes them locally, and scaffold
verification refuses workflow/local-parity drift. `docs/testing.md` names what each tier proves and
what it may not substitute for. Results: 23 smoke journeys passed with one optional Maia check
skipped, 4 content integrations passed, 7 interaction matrices passed, and `make verify` passed
1,129 tests across 171 files plus every process/schema/manifest gate. [[D1507]] closes; production
boundary, container, migration and release proof remain open under [[D1533]] and capability 14.

## 2026-08-24 — rating families cross the production application boundary

**What failed:** the REST handler implemented `/rated-games`, `/rating`, `/rating/history`,
`/marks`, and `/cohorts/:id/standing`, but `createApplication` did not classify any of them as API
paths. The deployed server therefore served SPA fallback bytes while direct REST tests stayed green.

**What landed:** `application.ts:isApiPath` admits all five families. The regression starts the real
application HTTP server, registers a learner, requests all five paths, and asserts REST-layer JSON
for successful reads and routed not-found cases. This closes [[D1532]] and changes the learner-model
API dimension from broken to partial: existing rating surfaces are reachable, while longitudinal
and full profile APIs remain absent.

**Verification:** the focused application suite passes 5/5. The machine roadmap reclassifies the
four registered prefixes as `live`; `make roadmap-check` must now fail if a future edit removes
their application allow-list entries. Container/release-image reachability remains a separate
capability-14 obligation rather than being inferred from this process-level server test.

## 2026-08-24 — runtime opening identity lands end to end

**What landed:** `44637013` compiles the pinned five-file CC0 Lichess chess-openings source into a
canonical private runtime artifact with 3,810 unique endpoints, 7,854 path keys and maximum
descendant count 2,023. The runtime exposes exact current endpoint, path membership, recorded
position and retrospective deepest-reached as four separately typed inspector-only projections.
The application loads once, starts honestly when the artifact is missing/invalid/mismatched,
publishes the exact producer state through `/capabilities`, and routes
`GET /opening-identity?fen=&ply=` through the production API boundary.

**What changed:** opening identity is no longer sourcing-only data that the runtime fetches and
discards. Review, theory, bot and longitudinal work now have a stable evidence source, but none was
silently bound: runtime-opening D1 retains learner/module bindings and D2 retains the F12 rights
inventory. `semantic-collectors.md` D3 is discharged at the landing SHA.

**Negative result:** criterion 6 was false as accepted. The pinned catalogue does name the position
after `1.e4` as `B00 King's Pawn Game`, while that same key has 2,023 descendants. D1534 amends the
criterion into two independent fixtures: the named maximum-fan-out key, and the genuinely unnamed
304-descendant key after `1.d4 Nf6 2.c4 e6`. The compiler caught the false absence before product
bytes encoded it.

**Verification:** strict engine-required `make verify` passed 1,141 tests across 174 files and every
schema/process/manifest/roadmap gate. Source/compiler closure, malformed/duplicate/digest failures,
transpositions, stale carry on imported game 0, exit/re-entry, renderer vocabulary, full-corpus
latency, application routing and typed unavailability have dedicated tests. A real production
image was built and served `A00 Amar Opening`; it contains the compiled artifact and contains
neither `vendor/` nor any TSV file.

## 2026-08-24 — the exhaustive 1.0 UX inventory becomes persistent assignment state

**What failed:** [[D1523]] showed that `work-index` proves only that a ledger id appears in a living
document. It cannot distinguish assignment from citation. [[D1528]] measured the consequence over
the twelve UX dossiers: 569 distinct items, 507 live, and 452 outside any queue a worker read.

**What landed:** [[D1535]] adds `planning/work-items-1.0.json`, a set-equal per-item join over the
exhaustive UX index. Every item retains its source section and digest, capability, capability owner,
lifecycle state and explicit capability-queue assignment. The guard refuses missing/extra ids,
source drift, duplicate ids, wrong owners, live unassigned work and closed work retaining a live
assignment. Initial state is 312 queued, 98 owner-blocked, 97 RFC-blocked, 38 complete and 24
retired — 569/569 registered and zero unassigned. The historical ledger `work-index` remains for
its narrower citation/route question; it is no longer treated as assignment proof.

**Verification:** `make work-item-check roadmap-check work-index status-parity register-check`
passes. The machine roadmap now names the item registry and its prefix-to-source join, and the
governance capability stays honestly partial because generic non-UX ledger rows do not yet carry
the same lifecycle state.

## 2026-08-24 — learner-facing truth boundary closes eight queued defects

**What landed:** [[D1536]] removes eight instances where internal representation escaped or was
mistaken for identity. Resume uses the controller's recovery mapping. Story evaluations name their
White-side perspective and render pawn units; story kinds and attempt verdicts use exhaustive
learner vocabulary. Repertoire population is a readable Lichess source/rating/speed/date
disclosure. Rating and cohort screens share one band formatter. Requested and applied resistance
modes use one complete learner vocabulary rather than ids such as `human_common`.

**The non-copy repair:** comparison routes now track the occupant that actually moved rather than
joining routes on the last square string. A regression moves a knight onto c3, captures it with a
pawn, then advances that pawn; the knight ends on c3 and the pawn continues to c4. Castling,
en-passant removal and promotion retain the same identity model.

**Flow-back:** ATR-a1/a2/a4/a7/a8/a9, CLP-a4 and OPP-a2 move from buildable to complete in the
persistent 1.0 registry. It now reports 499 live / 304 queued / 46 complete, still zero unassigned.
The broader bot-persona provenance row [[D1502]] remains open; replacing a raw resistance id does
not pretend to solve the card or roster.

**Verification:** exact CI parity passed under the repository-pinned Node 24, pnpm 11.18.0 and
Stockfish 18: 1,148/1,148 unit and integration tests; all type, build, schema, process, manifest,
opening, rating, graduation and packaging checks; 23 product browser journeys (one optional live
Maia latency probe skipped), 4 real-content integrations and 7 responsive/accessibility matrices.

## 2026-08-24 — the full 1.0 plan becomes executable and CI gains test ownership

**What failed:** the rebuilt roadmap covered fourteen capabilities and assigned all 569 UX items,
but its readable counts were already one commit stale and its execution program was prose. A
capability assignment prevented loss without telling a worker what dependency had to land next.
At the same time, required `make verify` put software contracts, repository governance,
real-corpus compatibility and the graduation planner's exact mutable population behind one job
name. That made a changed authoring census look like a software regression.

**What landed:** [[D1537]] refreshes the rollup to 304 queued / 46 complete and removes the repaired
raw-cp/enum Review claim. [[D1539]] adds nine machine-readable dependency milestones spanning work
truth, foundation RFCs, the evidence-to-consumer spine, stable board/presets, durable state,
production APIs, every full learner/professional journey, official content and release proof.
Roadmap rule R10 refuses cycles, unknown dependencies, missing next actions/exits and any 1.0
capability absent from the execution graph.

[[D1538]] splits the required non-browser gate into `verify-software`, `verify-governance` and
`verify-content`. The 16 files that intentionally consume committed corpus bytes are excluded from
the 159-file software suite and owned by the content suite; `test-tier-check` refuses a new
`content/drafts`, `content/packs` or `content/candidates` reader that is not assigned there. No
test was deleted: 985 software + 163 content = the same 1,148. The read-only graduation population
guard remains available as `make graduation-plan-check`, but it is no longer a required product-CI
dependency. Browser smoke, real-content journeys and interaction matrices remain separately named.

**Verification:** exact local parity under Node 24.19.0, pnpm 11.18.0 and Stockfish 18 passed:
985/985 software tests, 163/163 real-content tests, every schema/build/manifest/rating/governance
gate, 23 browser smoke journeys (one optional live-Maia latency probe skipped), 4/4 real-content
browser integrations and 7/7 responsive/accessibility matrices. `local CI parity PASS` was emitted
after the final matrix.

## 2026-08-24 — imported mainline trust and lifted-refusal truth repair

**What landed:** [[D1540]] gives imported runs one shared recorded-mainline identity. Story and the
branch-collapse reducer both call it, so branch zero can no longer be auto-folded merely because a
recorded imported loss is an objective shortfall. The negative fixture creates nine branches,
makes every one a shortfall, leaves the imported mainline inactive/unpinned/uncompared and proves
that another losing branch collapses while the game the learner imported remains visible.

[[D1541]] repairs two startup-enforced capability statements that contradicted owner rulings.
Stockfish `UCI_Chess960` and Explorer per-game/masters retrieval now report `unmeasured`, name the
accepted implementation/fixture work required, and no longer claim the product refuses them.
This does not implement either draft RFC early: the variants and famous-game fetch paths remain
with their owning documents, and [[D1086]] stays partial because `topGames=0` is unchanged until
that contract is accepted.

**Verification:** runtime/server typechecks and the 18 focused tests pass. The full exact gate
passed 987/987 software tests, builds and compiled manifests before the work-index correctly
refused the two still-open rows; this same-commit closeout resolves that process failure, followed
by a clean governance rerun.

## 2026-08-24 — refusal vocabulary becomes closed and test-visible

**What failed:** the fixed-refusal census found constructor calls and object literals but not the
members of the closed `ServerErrorCode` and `SourcingErrorCode` unions. `SourcingIssue.code` was
not closed at all. A refusal could therefore be declared as supported behavior without ever being
emitted or directly exercised, while the coverage gate still passed.

**What landed:** [[D1542]] adds a typed `SourcingIssueCode`, closes every sourcing issue producer
against it, and maps the open-ended pack-validator namespace through a typed `PACK_INVALID`
envelope that preserves the underlying validator code in its message. The coverage census now
joins all three declared vocabularies with emitted codes. A unit fixture proves declared-only
members are discovered; the first real run exposed `ENGINE_ASSESSMENT_UNGROUNDED`, and a strict
publication-boundary integration now exercises that refusal directly instead of adding it to the
accepted-debt fixture.

**Verification:** server typecheck and 36 focused sourcing/refusal tests pass. Full exact repository
verification follows this closeout in the same checkpoint.

## 2026-08-25 — the first 1.0 execution milestone closes on a source-sealed receipt

**What landed:** [[D1543]] turns the full-1.0 registry into a deterministic status artefact rather
than another hand-written summary. `planning/roadmap-1.0.receipt.json` records all nine dependency
milestones, fourteen capabilities, eight completion dimensions, 46 RFC assignments, 569 UX-item
states and the route/API reach split. It carries digests of the roadmap, item registry, RFC
register, UX index, router and the two production API boundaries.

**Failure semantics:** `make roadmap-check` now distinguishes an upstream source change from
internal receipt corruption and fails both. Its two negative fixtures prove those arms; ordinary
verification checks but never rewrites the receipt. A deliberate `make roadmap-receipt` is the
only update path.

**Flow-back:** the `release-truth` milestone is complete: software, governance, real-content and
the three browser contracts are separately named; mutable graduation population is outside the
required product gate; all live 1.0 UX work is assigned; and the status answer is sealed to its
authorities. [[D1505]] also closes at its actual mechanism boundary: `AGENTS.md` already requires a
same-commit proposed intent amendment whenever shipped reality falsifies protected intent, while
the individual stale sentences remain owned by their own amendment rows.

**Verification:** receipt unit tests, roadmap R1-R10 and the 1,348-row work index are green; full
repository governance follows before commit.

## 2026-08-25 — arrival, catalogue and opponent entry become one usable workflow

**What landed:** the first executable 1.0 UX wave closes the arrival/catalogue defects rather than
adding another settings surface. Home now states the rehearsal loop, provides direct first-run and
phase-thread doors, and reports due/open work. The pack summary carries authored objectives and
concepts; Play provides phase, band, search and sort controls; cards lead with the objective and
translate storage modes into actions. The primary full-game entry now sends one of four named Maia
rungs into `opponentPolicy.targetElo`, keeps strong-engine play distinct, and names the rating limit.

**Tracking correction:** first use exposed [[D1544]] — `work-items-1.0.json` could not advance an
item without rewriting its source dossier. The stable item now retains `sourceState` separately
from its execution `state`; completion requires a date and evidence string, and sync preserves
lawful progress. The 1.0 receipt therefore records this wave as completed work rather than leaving
its items queued forever.

**Verification:** server/web typechecks and 62 focused projection, catalogue, screen, controller,
and shell tests pass. The in-app browser had no available browser instance, so no manual visual
verdict is claimed; the repository browser and full verification gates remain required before the
checkpoint lands.

## 2026-08-25 — the full gate finds a terminal suffix hidden by random generation

The first full software pass found [[D1546]] after 74 generated cases: a legal post-rewind move
emitted the required `branch.forked` → `move.committed` sequence and then correctly emitted
`outcome.reached`. The property had accidentally specified the entire event list rather than its
ordering invariant. It now asserts the exact two-event prefix and admits only the chess-rules
terminal suffix. The focused property file and the complete 993-test software tier pass; governance
is rerun after the same-commit ledger closeout.

## 2026-08-25 — local verification owns its pinned toolchain

[[D1547]] closes the shell-contract gap exposed while verifying the first 1.0 UX wave. The
Makefile now selects Homebrew's pinned Node 24 and Stockfish 18 installations when present,
retains PATH and `SF_CMD` fallbacks for other platforms, and enables the required-engine arm from
`make verify` itself. README and development documentation now state the same exact command rather
than teaching callers to reconstruct CI with `PATH=...`, `SF_CMD=...`, or
`ENGINES_REQUIRED=1` prefixes.

Plain `make test-browser` passed 34 required journeys with the optional live Maia latency probe
skipped and zero retries. Its first run usefully found stale accessible-name assertions left by
the arrival/catalogue redesign; those tests now bind to the new headings, FEN disclosure, pack
action, selected-rating corpus scope, and honest unknown-phase copy. Plain `make verify` selected
Node 24 and Stockfish, passed all 993 software tests, then stopped at the deliberately open D1547
row; the row was closed and the complete gate rerun.

## 2026-08-25 — Review sharing and re-entry stop changing the evidence story

**What landed:** [[D687]] and [[D688]] close at their recorded depth. One runtime reducer selects
the ranked eight moments and restores chronology for both the private client and public share.
The downloadable card no longer drops every sentence after the first or launders all facts into
an engine label: it renders the complete admitted packet, resolves each leaf grounding through
the compiled evidence manifest, lists the sources, and expands vertically for longer packets.
The same provenance is visible beside the selected private moment.

The primary Story action now claims the writer lease for the current device before rewind and
fork, so opening a review away from the device that played the game no longer makes re-entry throw.
The browser journey deliberately deletes its local writer id before taking that action.

**Contract return:** [[D1548]] records why the implementing intent-presets RFC still cannot be
built truthfully: an absent preference and an explicit all-off preference arrive at the compiler
as the same value. Preset implementation remains returned until the contract carries presence;
this unrelated accepted Review repair did not invent that missing policy.

**Verification:** the runtime selection/provenance fixtures, the dynamic-card fixtures, and the
server public-share contract pass together. Full browser and repository gates follow this
closeout before commit.

## 2026-08-25 — Compare becomes a payoff instead of an evidence inventory

**What landed:** [[D1464]] closes as one vertical Compare wave. The surface now begins with one
fork board showing the recorded candidate arrows together, followed by each move's SAN, actor and
the learner's own branch intent. The aligned projection states recorded-node sharing separately
from chess-position re-convergence, shows learner-relative material, and carries resistance and
authored-line context through to each consequence. The deterministic grounded narrative is open
before the engine graphics. Four visible “Evidence inspector” labels are replaced with learner
questions/facts while their machine consumer ids remain intact.

**Correction:** [[D1549]] records and repairs a stale premise in the UX dossier. There was no
shared per-position material primitive: runtime read only the active cursor and Group Panel had a
private FEN counter. `materialBalanceAt` is now the one authority used by runtime, Group Panel and
Compare, with both learner perspectives pinned.

**Residual:** [[D1465]] narrows but stays open. Resistance, source labels and piece identity are
fixed; the deliberately withheld mid-run comparison still needs one region-level explanation,
and the always-present rewind control still conflicts with the consequence-timed offer.

**Verification:** 35 focused objective, Group Panel and Compare component tests pass, including a
fixture where two distinct recorded nodes share a `transposeKey`; full browser and repository
gates follow before the checkpoint is committed.

## 2026-08-25 — The first rehearsal demonstrates the loop instead of describing it

**What landed:** the no-history Home action now selects the designated short consequence pack and
starts an ordinary persisted `startPack` run. The existing Support seat carries a four-step guide
derived solely from recorded events: decide in stated silence, play until a consequence boundary,
rewind to the original decision, finish a genuinely forked alternative, then compare the two
preserved attempts. The guide stores only the run id so it survives reload; it creates no tutorial
run type, evidence, grade, or chess claim. Its rewind action cannot exist before a checkpoint,
segment, guard, or outcome event, and its compare action cannot exist before the second branch has
its own consequence boundary.

The pack-less objective no longer leads with an internal absence. It truthfully says that nothing
is authored and names the product promise: the position is read as play creates moments worth
returning to. Every timeline rewind preview now says that the current attempt survives before the
learner confirms it. [[D494]] narrows to preset naming only; ARR-a1, ARR-a3, ARR-a22, ARR-a23,
CLP-a10 and CLP-a17 close in the executable 1.0 registry.

**Verification:** 32 focused guide/screen/shell tests and the complete typecheck pass. The required
browser suite passes 35/35 with the optional Maia latency probe skipped; its new first-user journey
checks the real persisted run, guide reload, and unchanged board rectangle. The seven-projection
composition matrix, mobile regions, semantic board, full Tab traversal, and all served endgame
interaction projections remain green. Full repository verification passes 1,000 software tests,
164 content tests, all schema/build/packaging checks, 1,354 routed ledger rows, the 569-item work
registry and every roadmap/register/status/intent parity gate.

## 2026-08-25 — Withheld comparison means no machine result in any field

**What landed:** [[D1550]] closes the disclosure leak in mid-run comparison. The comparison
payload now carries one typed `machineFeedback` authority. Its withheld server projection removes
machine evidence and lines, filters machine references from public objective timelines, and nulls
the derived consequence summary score that previously survived those filters. Compare admits its
trajectory, sparkline, score summary and machine consumer only when that authority is available.

**Boundary retained:** this is a policy-enforcement repair, not the learner-facing abstention
module. [[D1465]] and CLP-c2 still own the one region-level explanation for why machine comparison
is unavailable; CLP-c2 remains blocked on the draft evidence-presentation RFC.

**Verification:** the 44 focused runtime/server/client comparison tests pass, including negative
response and rendered-surface fixtures. The complete workspace typecheck reports zero errors and
zero Svelte warnings. The browser suite passes all 35 required journeys with only the optional
live Maia latency probe skipped. Full repository verification passes 1,001 software tests, 164
content tests, build/schema/packaging checks, 1,355 routed ledger rows, and every register,
roadmap, status, intent and test-tier gate.

## 2026-08-25 — Client tests stop pinning the Svelte implementation

**What landed:** [[D1449]] narrows. App/runtime unit suites no longer open `.svelte` files and
assert private `$state` declarations, class-expression strings, duplicated prose or literal CSS.
The same contracts now run at their behavioral boundary: mounted Settings proves all eight
contexts and every unavailable voice control's visible reason; the live shape and recorded-reading
workflows prove their copy appears once in the correct surface; mounted DrillScreen and the browser
matrix prove compact-region reach; the browser measures permanent target boxes at the supported
mobile projections; adaptive guidance is tested through its reducers and permissions.

**Residual retained:** source inspection still exists in explicitly named research/governance
harnesses, and the compiled evidence manifest still names client file paths as consumer
implementations. Those are the remaining half of [[D1449]]; this wave does not misreport them as
behavioral proof or close the row.

**Verification:** 47 focused app/runtime tests and the complete workspace typecheck pass with zero
Svelte errors or warnings. The exact browser-CI entrypoint passes 24 stable journeys (one optional
live Maia probe skipped), 4 real-content integrations and all 7 responsive/accessibility matrix
tests. Full repository verification passes 995 software tests, 164 content tests, build/schema/
packaging checks, 1,355 routed ledger rows, and every register, roadmap, status, intent and test-tier
gate.

## 2026-08-25 — Evidence consumers become callable contracts

**What landed:** [[D1449]] narrows again. The manifest gate no longer opens twenty-three named
source files and searches for strings that merely resemble consumer anchors. Runtime, server and
web now register the actual callable for every current consumer operation. The catalogue records
that callable's exported name, and `make evidence-manifest-check` requires exact operation-id set
equality, version 1, uniqueness, a declaration for every registration, and exact
declaration-to-callable-name equality. Removing or renaming an operation now fails at its exported
boundary rather than succeeding because stale text remains in a file; behavior remains covered by
the operation's own tests.

The producer/acquisition direction remains explicitly outside the consumer census. The former
source-grep assertion around external voice was not treated as proof of data flow: existing
guidance tests exercise the sealed rendered view and reject a forged sentence paired with admitted
evidence. Research and governance harnesses may still inspect source when topology is their stated
subject; they remain the only residual in D1449 and may not substitute for behavioral tests.

**Verification:** the complete workspace typecheck passes with zero Svelte errors or warnings.
The callable-registry and sealed-guidance focused suite passes 23 tests, including able-to-fail
fixtures for missing, duplicate, renamed, future-version and non-callable registrations. The
compiled manifest check passes with all twenty-three production operation bindings present.

**Count correction:** [[D1551]] fixes two stale hand-written summaries discovered while checking
that output. The executable tuple is 37 producers / 193 projections / 25 consumers / 210 bindings,
plus 67 semantic events / 67 eligibility rows / 15 refusal reasons / one policy; the prior
35/189 figures were not retained merely because the unaffected consumer/binding counts still
matched.

## 2026-08-25 — Pre-commit process checks use the staged snapshot

**What landed:** [[D1509]] closes. Lefthook's process-contract job no longer runs five governance
tools against the shared working tree. One runner materializes the complete Git index into an
isolated temporary directory and runs register, status, work, roadmap and intent parity there.
Ordinary `make` targets keep their working-tree semantics, so developers can still inspect work in
progress without making another worker's unstaged migration or RFC bytes part of a commit gate.

**Verification:** the permanent Git fixture stages one tracked value, then writes a conflicting
unstaged value and an untracked file; the snapshot contains only the staged value. The runner's
target set is exact, Lefthook validation passes, and scaffold verification now fails if the hook is
changed back to a working-tree command.

## 2026-08-25 — Evidence digest freshness gates graduation

**What landed:** [[D1508]] closes with a corrected subject and a fail-closed publication boundary.
The stale field is the evidence ledger's `packDigest`, not a source manifest. The graduation report
now recomputes every paired digest, exposes fresh/stale/invalid counts, withholds any stale or
unreadable pair that would otherwise be graduable, and exits non-zero for that condition. Drafts
without a ledger remain possible; strict sourcing still decides whether their claims require one.
Real-content CI separately refuses a stale pair under `content/packs/`, so moving a file between
catalogue roots cannot evade the report.

**Current evidence:** the full read-only census finds 68 pairs: 42 fresh, 26 stale, 0 invalid. The
original 32/32 claim is stale in both artifact name and value: all 32 flat draft pairs are fresh;
the 26 mismatches are candidates that remain blocked for independent authoring reasons. No ledger
was re-stamped by this change. A synthetic blocker-free pack is withheld while stale, admitted
after re-confirmation, and withheld again when its ledger is malformed.

## 2026-08-25 — Pack Studio reaches validator parity for shared vocabularies

**What landed:** the AUT-a2 arm of [[D1488]] closes. Pack Studio now supplies the principle registry
and its live pack registry to every validation path: unsaved lint, stored draft views, playtest, and
registration. The command-line and web authoring paths can no longer disagree about unknown or
off-phase principles, unknown sibling packs, or unproven `variantOf` relations.

**Verification:** one focused test exercises all four formerly unreachable codes —
`CLAIM_PRINCIPLE_UNKNOWN`, `CLAIM_PRINCIPLE_OFF_PHASE`, `VARIANT_PACK_UNKNOWN`, and
`VARIANT_RELATION_UNPROVEN` — and the server typecheck passes. The remaining [[D1488]] work is the
unsaved-buffer client wiring; `GET /principles` remains new surface and still needs the RFC boundary
identified by the complete UX index rather than being smuggled in as a trivial route.

## 2026-08-25 — Unsaved Pack Studio bytes reach the validator

**What landed:** AUT-a1 narrows [[D1488]] to its RFC-bound principle surface. The client now debounces
the selected mutable pack's editor bytes for 300 ms and calls the existing lint route without a
save. A generation fence discards superseded replies. Invalid JSON is identified locally and makes
no request; network failure is presented separately from a valid negative lint result; Save remains
available for incomplete drafts while Save & playtest requires the current buffer to be clean.

**Verification:** the API fixture pins the encoded route, POST method, and exact unsaved document
body. The mounted application fixture proves initial lint, changed-buffer lint, disabled playtest,
zero save calls while typing, and zero server calls for malformed JSON. The focused 17-test API and
shell suite passes, and Svelte typecheck reports zero errors and zero warnings. AUT-a4 still owns
human grouping of incomplete-versus-wrong diagnostics; this change does not call raw validator rows
a finished authoring UX.

## 2026-08-25 — Retired pawn-count readings fail closed at presentation

**What landed:** [[D720]] and the residual [[D548]] close without deleting the authored predicate.
`pawn_count` remains a deprecated matcher for existing pack expressions, while emitted evidence uses
`piece_count` with role `pawn`. The catalogue, source adapter, consumer admission, and guidance path
already retired it; the last learner renderer now refuses the impossible observation instead of
turning it into a sentence.

**Verification:** a negative fixture proves a forged `pawn_count` observation cannot render, and a
positive fixture preserves the authored-expression sentence. The ordinary fourteen emitted
structural kinds retain their valence/claim-boundary sweep.

## 2026-08-25 — Campaign path-width posture becomes executable

**What landed:** campaign-core criterion 15 now runs in the authored-document validator.
Every non-boss layer offering only one choice emits `CAMPAIGN_PATH_WIDTH`; the mandatory
single-choice boss layer never does. The diagnostic is a warning, so deliberately linear teaching
campaigns remain valid as the accepted contract requires.

**Verification:** the linear fixture names exactly act 1 layers 1 and 2 without an error, while the
width-3 seed emits no path-width warning. The focused seven-test campaign-validation suite and the
server typecheck pass. AUT-a17 and [[D1552]] close on those executable fixtures.

## 2026-08-25 — Studio validation becomes author-facing instead of schema-shaped

**What landed:** continuous pack lint now filters discriminated unions at the shared validator, so
the CLI and Studio both report only the arm selected by the document's `kind` or `type`. Studio
separates missing required fields from wrong values and warnings, shows all ten top-level required
fields as a checklist, and derives the displayed pack-format version from the schema constant. The
shape editor now renders failures from create, save, lint/probe, and register; a successful lint
also replaces the stale saved validation shown beside the editor.

**Verification:** actual 8-arm success-condition and 18-arm structural-feature fixtures each reduce
to one selected-arm missing-field error. Four focused files pass 80 tests; schema, server, and Svelte
typechecks pass with zero Svelte warnings. AUT-a4, AUT-a5, AUT-a6, and [[D1553]] close.

## 2026-08-25 — Graduation conditions become the Studio's third column

**What landed:** Pack Studio projects graduation conditions from the current unsaved editor bytes,
showing the blocking/discharged count and each condition's stable id, state, and statement. Legacy
and malformed entries render as blocking. The column is explicitly per-draft; the corpus-wide
graduation report remains its own instrument.

**Verification:** a mounted Studio fixture begins at one blocking and one discharged condition,
changes the condition state in the textarea without saving, and reaches zero blocking and two
discharged. The focused 14-test web pair and Svelte typecheck pass. AUT-a8 and [[D1554]] close.

## 2026-08-25 — Distillation asks the author what the rehearsal is

**What landed:** a completed run now opens a required title form before creating a distilled pack.
The client trims the author-supplied title, sends it with the run and active branch, and navigates
only after the server returns the blocked draft. Request failures stay visible on the run.

**Verification:** a mounted application fixture commits a checkmating move, opens the host-only
distillation form, enters a title, and proves the exact title, generated pack id, and active branch
reach `distillRun` before `/create` opens. Together with the form fixture, 13 focused tests pass and
the web package typecheck is clean. AUT-a7 and [[D1555]] close.

## 2026-08-25 — The principle registry reaches the application boundary

**What landed:** the existing official principle registry now has a public, id-sorted
`GET /principles` summary route and a typed browser client method. The application router names the
path explicitly, so a deployed server cannot silently serve the SPA document in its place. The
canonical shell documentation also stops describing the shipped Studio as an empty state and does
not pre-empt the owner's pending decision about `/library`.

**Verification:** a real `createApplication` server returns JSON summaries with stable catalogue
fields in sorted order, and the browser API's complete-surface fixture proves the `/principles`
request. The focused application, registry, and browser API suites pass 18 tests; server and web
typechecks are clean. AUT-a3, AUT-a18, and [[D1556]] close.

## 2026-08-25 — Lichess Study imports retain moves, not somebody else's prose

**What landed:** fetched Study PGN is parsed and re-emitted before repertoire parsing or storage.
The sanitizer removes game and move comments, NAGs, and comment-encoded board drawings while
preserving headers and every mainline/variation move. The stored source note states the operation.

**Verification:** a fixture containing chapter prose, mainline and variation comments, symbolic and
numeric glyphs, and a `%cal` drawing retains both branches and none of the annotations. The focused
nine-test import suite and server typecheck pass. AUT-a15 and [[D1557]] close.

## 2026-08-25 — Studio exposes dead vocabulary and unsupported policy declarations

**What landed:** the public shape and principle summaries now count the served packs that reference
each entry. The count normalises both accepted shape-reference forms and de-duplicates repeated
references inside one pack. The Create route groups zero-use principles, zero-use shapes, and policy
modes the runtime declares unavailable, retaining each declared reason and making clear that unused
does not mean invalid.

**Verification:** a pure vocabulary fixture proves per-pack de-duplication; production application
tests prove both catalogues carry derived counts; and a mounted `/create` test proves an author sees
only zero-use entries plus the unsupported-mode reason. Sixty-one focused tests pass, with server and
web typechecks clean. AUT-a12 and [[D1558]] close.

## 2026-08-25 — Provenance becomes a structured authoring step

**What landed:** Studio edits provenance in the unsaved pack buffer through explicit whole-pack
postures. Authors can record references and CC-BY-SA credit notices without hand-editing the JSON;
mixed or unsupported existing bytes are preserved and called out. The UI also states that credited
CC0 remains unsupported by the checker and refuses the tempting per-paragraph and automatic-rewrite
models.

**Verification:** pure fixtures prove unrelated provenance survives edits, source ids are
de-duplicated, credits receive the wholesale licence, clearing credits requires an explicit posture
change, and unsupported bytes remain an honest third state. A mounted Studio test selects the
CC-BY-SA posture, adds a credit, and reads the resulting unsaved textarea bytes. Seventeen focused
tests pass and the web typecheck is clean. AUT-a13, AUT-a16, and [[D1559]] close; [[D1394]] remains
open under the theory-knowledge pipeline.

## 2026-08-25 — Null shape signatures become an explicit authoring choice

**What landed:** Shape Studio distinguishes structural success, a missing signature, and a
deliberate refusal to grade one position. The refusal path requires a reason before it can replace
an expression or fill an unfinished plan, then keeps that note editable beside the JSON.

**Verification:** pure fixtures prove all three states, required-note refusal, preservation of
unrelated bytes, and that a refusal-note edit cannot overwrite a structural plan. A mounted Studio
test fills the reason, chooses the null signature, and verifies the exact unsaved shape bytes and
honesty copy. Seventeen focused tests pass and the web typecheck is clean. AUT-a24 and [[D1560]]
close; AUT-a25 still owns structural expression authoring.

## 2026-08-25 — Pack registry fields become meaning-bearing pickers

**What landed:** the existing principle summary now includes its statement at the public production
boundary. Studio projects every shape field (pack and trajectory legs) and every feedback-claim
principle field as catalogue choices, retaining shape relation and writing the unsaved pack buffer.

**Verification:** pure fixtures cover legacy and relational shape forms, both shape scopes,
per-claim principle additions/removals, and unrelated-byte retention. Production application tests
require the principle statement. A mounted Studio test chooses a shape, changes it to prospective,
selects a principle after reading its statement, and verifies exact JSON bytes. Nineteen focused
web tests and thirteen registry/application tests pass; server and web typechecks are clean.
AUT-a11 and [[D1561]] close.

## 2026-08-25 — The Create chooser stops pretending its board decision is settled

**What changed:** AUT-a9 moved from queued to owner-blocked. Its own source requires owner decision
4—whether authoring funds a board—before the position door can be specified. No partial chooser was
built. [[D1562]] records the state mismatch; the expression builder AUT-a25 remains executable.

## 2026-08-25 — Owner resolves the cross-surface 1.0 bundle

**Rulings:** full authoring includes a shared board and community workflow ([[D1563]]); evidence
producers must supply the operands needed by every promised support module rather than postponing
arrows/highlights behind presentation ([[D1564]]); campaign separates run-scoped drip-fed tools from
persistent rewards ([[D1565]]); and the recommended bot, Review, accessibility and appearance
directions are approved ([[D1566]]). Public matchmaking is returned for a no-chat-specific cost
derivation instead of inheriting a generic moderation objection ([[D1567]]).

## 2026-08-25 — Arrow activation split into evidence retention and typed rendering

Re-derived `module-registration.md` §6 and `evidence-presentation.md` D4/D5 against the compiled
catalogue after owner ruling [[D1564]]. The documents' shared statement that no vector producer
exists is materially over-broad: threat moves, controller edges, defender duties, slider rays,
piece destinations, move anchors and observed tactic relations already retain ordered identities
and declare the `arrows` form. They lack a typed one-fact relation-overlay renderer and an applied
`effectiveArrows` clamp. The six legacy transition families remain a different defect: their
payloads lose the square identities a square or relation component needs.

**Changed:** [[D1568]] records the class and routes both halves to the two active RFCs. Arrow
activation is no longer an owner question or an optional future source. Existing exact relations
must render through the sealed evidence item; missing transition and staged-hint operands remain
producer obligations with able-to-fail coverage, not honest-empty excuses.

**Next:** finish the two RFC amendments, take them through independent buildability review, then
implement the producer→relation→module→board path in dependency order.

## 2026-08-25 — Generic hint-target wrapper refused during cross-document audit

Reading `hint-distance.md` against the new module amendment found that the proposed
`derived.guidance.hint_target@1` would repeat a defect the older RFC had already ruled out. Hint
families do not share derivation inputs or answer-content images, so one shared derived projection
cannot truthfully represent them under `evidence-contract.ts`'s per-member widening rule. The
actual family list also remains research-returned by [[D1376]]–[[D1378]].

**Changed:** [[D1569]] records the correction. `module-registration` consumes a literal,
set-equal `HINT_HORIZON_PROJECTION_IDS` registry only after `hint-distance`'s relation-safe and
sealed-disclosure gates settle its members. No wildcard and no generic wrapper enters the
manifest. The mistake was caught in authoring, before any production type or content depended on
it.

## 2026-08-26 — Shared candidate packet returned to buildability and measured at full roots

Re-ran the D1071 packet falsifier at HEAD, then enumerated every exact legal child at all 64 fixed
D1061 roots with the full `localSemanticEvents` closure. The original architectural verdict holds:
bot selection, guided hints and Review need one complete score-free legal-candidate population, and
the shipped callback/vector paths do not provide it. The drafting state did not yet define a
buildable implementation.

**Measured:** legal moves p50/p95/max 35/47/50; retained semantic events
3,779/5,482/5,803; structural JSON 5.13/7.44/7.88 MB; cold compile
614/863/922 ms. The sweep observed only 41 of 67 declared event projections, including missing
basic rare families such as checkmate and promotion, so a fixed corpus cannot serve as the emitted
schema. The instrument and deterministic receipt live in
`tools/d1071-candidate-packet-harness/buildability-envelope.test.ts` and
`planning/evidence-foundation-ux/d1573-candidate-packet-envelope.json`; the dossier is
`design/research/shared-candidate-packet-buildability.md`.

**Changed:** [[D1570]]–[[D1576]] are specified in the packet's buildability amendment. The RFC now
pins the exact F1 tuple and operator bindings, retains literal packet/engine evidence in scored
joins, injects one per-process population service, uses immutable scope projections and a dual
8-entry/56,000-retained-item LRU, derives the event closure from code with per-member able-to-fail
fixtures, and names the runtime/server migration. One node-free
`live.stockfish.position_eval@1` becomes the engine-score source for hypothetical candidates;
Review derives its node-scoped point from that source plus `run.record.position@1`, so neither path
invents a node id or creates a second score authority.

**Next:** independent cross-review of both amended RFCs; record the Node-24 same-work latency,
heap/RSS and cache receipt; then accept and implement the packet before any hint, bot or Review
consumer builds its own denominator.

## 2026-08-26 — Transition identity audit replaced a six-emitter rewrite with a measured hand-off

Walked all 754 committed corpus edges and compared the legacy count-only transition readings with
the newer `transitionSemanticFacts` layer. The legacy surface remains lossy—3,373 observations and
zero square vectors—but all 5,314 semantic facts retain their family minimum subject/move
identities. The five geometry families reconstruct the old count keys edge by edge; the independent
rule events reconstruct the four legacy irreversibility leaves when the compatibility priority is
applied explicitly. The executable receipt lives in
`tools/d1577-transition-event-handoff/transition-event-handoff.test.ts` and
`planning/evidence-foundation-ux/d1577-transition-event-handoff.json`; the dossier is
`design/research/transition-event-handoff.md`.

**Changed:** [[D1577]] records that no six-producer rewrite is required. The presentation and
module-registration drafts now route all five geometry event families through literal relation
adapters into post-commit nudge and Review while leaving legacy pack predicates intact. [[D1578]]
records the en-passant endpoint correction: raw `capture@1` cannot locate the captured pawn, but
the already-admitted `derived.exchange.capture_class@1` carries both victim and landing squares,
so a new capture producer would duplicate authority.

**Next:** independently cross-review the two amended drafts, then implement the event-form,
relation-adapter and module-admission hand-off rather than modifying the old transition readings.

## 2026-08-26 — Node-24 packet receipt falsified equal-item cache weight

Ran the amended candidate packet's exact event-only and event+reading shapes under Node 24.19.0 in
fresh Vitest workers, forcing GC before and after each retained-cache measurement. The same
50-legal-move witness compiles cold in 972.32 ms and reads warm in 0.011 ms with an identical
packet id. The receipt explicitly cites D1071's strict-subset falsifier and D1573's Node-26 sweep as
different measurements rather than laundering either into this pair.

**Measured:** eight event-only stress packets retain 37,804 events, 52.20 MB structural JSON,
52.28 MB heap and a 224.41 MB fresh-process RSS delta. The equal-item full-scope control still
passes 44,433/56,000 while retaining 91.78 MB heap and a 293.27 MB RSS delta. Its added 6,629
readings cost 4.31× an event per incremental heap item and 2.00× per structural byte. The first
conservative repair rounds that coefficient up: `events + 5×readings` retains six mixed roots at
52,975 weight, 51.22 MB structural JSON, 67.17 MB heap and 259.95 MB RSS. All cache bounds and the
same-id assertion pass. The executable negative/control/repair arms and receipt are under
`tools/d1071-candidate-packet-harness/` and
`planning/evidence-foundation-ux/d1579-candidate-packet-node24-envelope.json`.

**Changed:** [[D1579]] returns the RFC's equal-item unit and amends it to typed weighted retention,
keeping the bad formula as an able-to-fail control. [[D1580]] records that O13/F12 declare semantic
resource tiers but no numeric heap/RSS ceiling; the mechanism may be bounded and implemented, but
neither this research nor the RFC manufactures a release-pass threshold.

**Next:** independent cross-review of the completed buildability/cache amendment. On acceptance,
implement the one packet/service and re-run this exact Node-24 receipt over production symbols;
F12 separately owes the numeric appliance-tier gate.

## 2026-08-26 — Hint-distance rebuilt from the measured selector and sealed at the wire boundary

Rebuilt `rfc/hint-distance.md` after the D1363/D1397 relation-safe selector work. The document now
uses the measured seven-family/status table and exact search, packet and source-occurrence
identities; separates one operator-only horizon per family from one learner disclosure per
family×rung; and specifies physical omission of higher-rung bytes. The learner interaction is one
per-decision **Hint / A little more** action while `AssistanceConfig.hintDistance` is an Advanced
or preset ceiling. Engine-semantic Hint, theory breadcrumb, structure nudge and tablebase/endgame
presentation remain separate modules, so one unavailable source cannot silence the others.

**Corrected during self-review:** the first rebuild put `RenderedEvidenceView` in a REST response.
That cannot work: F1's symbol/private-`WeakSet` seal is process-local and disappears in JSON.
[[D1582]] records the defect. The server now retains admission, rendering, provider input and voice
checking in-process, then emits a closed digest-checked delivery receipt containing only the
selected rung's learner bytes; the browser validates the wire contract and never claims an F1
seal. [[D1581]] separately records that the two RFCs changing versioned `AssistanceConfig` have no
shared-resource register.

**Next:** run the independent buildability review in
`planning/evidence-foundation-ux/hint-distance-rebuild-review-handoff.md`. Implementation remains
blocked on that decision, the accepted/implemented shared candidate packet, the AssistanceConfig
register, and the integrated Node-24 production-path latency receipt.

## 2026-08-26 — AssistanceConfig register gate passed; one hint statement corrected

Audited `AssistanceConfig` against all three RFC-0000 rule-7 limbs, its v1-v4 git history, runtime
export, browser persistence/migrations and both live RFCs meeting at v5. The Node-24 declaration
census reports 32 assistance subjects with no consumer-zero rows, but its own implementation proves
it is not the resource authority: it extracts string members only, omits numeric `version=4`, and
token-level producer/consumer counts intentionally overcount common literals.

**Verdict:** the narrow process exploration gate passes. The register should derive head 4 and a
format/order-insensitive digest from the normalized interface shape; it permits one live claim at
exactly head+1. Guided Hint owns v5 because it introduces `hintDistance`; `intent-presets` consumes
that version through its existing Discharge D4 and does not open a competing claim. The evidence is
in `design/research/assistance-config-shared-resource.md`; [[D1581]] is research-complete, not
implementation-authorised.

**Correction:** the hint rebuild said theory-only was “not a new preset id.” `theory_only` is
already exported in `PRESET_IDS` with a `rules_floor + theory_breadcrumb` module set and broad
workflow admission. [[D1583]] records and corrects the sentence before independent review; the
source-separation architecture is unchanged.

**Next:** draft the process-only AssistanceConfig register RFC with able-to-fail version, shape,
formatting and claimant fixtures. Runtime v5 still waits on independent hint/packet review.
## 2026-08-26 — Module-registration returned on end-to-end buildability

An independent code-grounded review returned `rfc/module-registration.md` before acceptance with
seven blockers ([[D1585]]–[[D1591]]). The draft's central direction stands—typed modules over one
evidence pool—but its answer-distance order is false, explorer narrowing retains candidate moves,
the reducer has no branded reseal into rendering, and no named server-to-client module operation
exists. The role intersection also removes `rules_floor` from a match participant, the staged-move
guard lacks a five-input controller protocol, and one sight-ceiling premise names projections not
in its own table. The review lives at
`planning/learner-modules/module-registration-cross-review.md`. No production, protected design,
schema, migration or content bytes moved.

## 2026-08-26 — Campaign persistence stopped on the two-horizon ruling

Re-read `campaign-core` and its landed runtime checkpoint against the later owner ruling [[D1565]].
The checkpoint preserves useful run-local machinery, but the accepted contract cannot deliver the
ruled product: its preset intersection can remove an earned module from actual play, its reward
union can express modules only, and its prestige section explicitly says it adds no persistence.
The validator also proves registration but not that a reward can matter after acquisition or at a
later boss. Finally, `prestigeEligible` is true after one achieved node because it never requires
completion.

**Verdict:** return the RFC at the persistence boundary, retaining the schema/registry/fold work.
[[D1592]]–[[D1597]] route the missing cross-run authority, owned-versus-equipped algebra, broader
collectible vocabulary, path-sensitive later-use proof and prestige denominator. The prior
[[D1233]]/[[D1234]] state-fold returns still stand, and [[D1515]] remains research-owned rather
than silently answered. The exact return is
`planning/campaign/two-horizon-return.md`; no protected design, production code, schema, migration
or content bytes changed.

## 2026-08-26 — R12 failure-resource search narrowed to inventory availability

Ran a primary-source and executable research pass on [[D1515]] rather than drafting the missing
failure contract. Blades and Fate separate the consequence from the player-elected resource spend;
Fate also demonstrates why a short buffer needs a second carried state. Hades supplies the opposite
control—failure increases resilience. Productive-failure and competence-frustration research bound
the learning claim without being treated as game-UX proof.

The disposable Node-24 harness exhaustively ran all 512 achieved/failed patterns over the accepted
3×3 campaign. Global HP(3) completes 46 and carries Act-I loss into Act III; act HP(2) completes 64
and keeps the failed verdict as debit authority; shared rewind charges preserve access but still
price early experimentation. Act-reset availability over acquired tools is the only tested
candidate that preserves all educational paths, removes cross-act carry, adds no second number and
makes the learner's consequence choice the debit authority. [[D1598]]/[[D1599]].

**Gate state:** research-complete, owner-blocked—not RFC-ready. [[D1600]] asks what follows when no
tool is available to rest: recovery route (recommended), carried act-level strain, or a completely
nonterminal exhaustion/prestige consequence. No counts, thresholds, copy or felt-quality claim are
licensed. The dossier is `design/research/campaign-failure-resource.md`; the instrument and receipt
are `tools/d1515-failure-resource-harness/`.

## 2026-08-26 — Bot roster returned before an empty catalogue became a checkbox

Independently reviewed `rfc/bot-roster.md` against D969, the shipped catalogue/composer and the
later owner ruling [[D1566]]. The measured four-band × three-family product survives, and the
persona-grain fork is closed at one persistent persona per profile. The draft is not buildable yet.

The guard accepts a bare caller-owned centipawn loss, so it cannot express or verify D969's mixed
cp/mate abstention, exact rows, shared candidate set, depth, perspective or provider identity. On
guard abstention the composer continues into pawn reweighting even though that family was measured
only after a successful guard. Trait ids remain free strings, and the composer still has no
production caller. The draft also compares cp with Elo to claim strength orthogonality, then asks
same-family non-model layers to be byte-identical while assigning every profile a different persona
layer. Finally, neither the combined Maia+guard budget nor [[D1566]]'s Play picker, card and
always-visible identity has an implementing home.

**Verdict:** returned on [[D1601]]–[[D1609]]; exact repairs and resume order are in
`planning/bot-roster/buildability-return-2026-08-26.md`. [[D1610]]/[[D1611]] retain only the genuine
owner choices—final names/assets and the new-learner default. No production, protected-design,
schema or migration bytes changed; the catalogue remains empty rather than falsely complete.

## 2026-08-26 — longitudinal-store independent re-review returns the background foundation

Independently re-reviewed the 2026-08-24 `longitudinal-store` amendment against the current
semantic catalogue, storage transactions, run-event identity, import record and supported hosted
topology. The original architecture improvements survive: measured request-path refusal, per-run
phase/class grain, immutable observation time, typed refs, paired revision digests, honest absence
for unattributable shared predictions, and authoritative rebuild.

The RFC remains draft. Six contract gaps are recorded as [[D1612]]–[[D1617]] and detailed in
`planning/longitudinal-store/independent-rereview-2026-08-26.md`: the exact constructor/base joins
exist only in a disposable timing harness; `running` jobs have no safe claim/reclaim/CAS protocol
and their promised closed failure code is free text; the worker has no pinned snapshot cut;
interval processing does not preserve the family-independent decision denominator; seven distinct
production run-write SQL paths are not a closed scheduling boundary; and imported source-game
moves are observed games, not evidence that the learner played them. No migration or production
projection code was started. Next: author amendment, fold the superseded two-table/synchronous
sections into one contract, refresh the migration register, and independently re-review again.

## 2026-08-26 — stale evidence routes reconciled against shipped symbols

Re-derived ten routed evidence defects before assigning implementation. D520 already shares the
promotion-complete exact legal-move authority and its validator fixture covers queen, rook, bishop
and knight promotion. D851–D859 were repaired in the accepted breadth contract and landed in
`5d8c7b6f`: exact legal/pseudo control, controller-edge defender loss, pre-state contact execution,
kind-specific retained horizons, pressure identity, literal pawn predicates, candidate-majority
boundaries, en-passant captured-square retention and mover-relative open-file occupancy all have
production symbols and discriminating fixtures.

The ledger still described those nine rows as open and the routing queue still instructed a worker
to implement seven of them plus D520. [[D1618]] records the class. All ten ledger states are now
truthful and the completed routing instructions are removed; no product behavior changed.

## 2026-08-26 — provenance editor rejoins the theme contract

The normal unit gate caught one committed non-network failure while verifying the evidence-route
reconciliation: `PackProvenanceEditor.svelte` referenced the nonexistent `--panel-raised` token and
used a fallback that silently flattened the intended raised surface to paper. [[D1619]] replaces it
with the declared `--surface` token. The existing theme test enumerates every CSS variable reference
against the palette and derived-token registries, so another fallback cannot hide the same class.

## 2026-08-26 — one population guard and the discarded-ledger row closed

Implemented [[D264]] under the archived `evidence-at-runtime` criterion that already required the
population disclosure to have one authority. Runtime now exports the sole `CORPUS_GUARD`; both the
web Explorer renderer and server repertoire scan/recommendation paths consume it, and their tests
compare output to the shared value. This removes the punctuation fork without adding a judgement.

The same symbol audit re-derived [[D142]] as shipped rather than open: `PackRecord.positionEvidence`
retains the digest-gated, multi-valued ledger index, preserves duplicate clock-sensitive records,
suppresses stale and unstamped ledgers, yields to live evidence and stays off the wire. Stale routing
rows for D142, D663/D665/D666, D671–D678 and D722 are removed under [[D1618]]; all were already
closed by their archived implementation contracts.

## 2026-08-26 — D143 crosses the engine/tablebase partition without collapsing it

Preregistered and ran the whole committed Syzygy population through the exact Stockfish authoring
profile. The input is 341 records deduplicated to 288 FENs (108 win / 107 loss / 73 draw); both fresh
Stockfish 18 runs completed and all 288 score-type/value/depth/best-move observations repeated
byte-for-byte. The alternating mating-line perspective control passes.

For the 272 non-terminal positions, every one of 210 decisive readings has the correct
side-to-move sign. The sixteen terminals remain typed—five `mate 0` losses and eleven `cp 0`
draws. Exact draws top out at 21 cp and the nearest decisive cp is 135, so the preregistered ±25 cp
screen separates this fixed population 288/288. That passes the follow-up criterion and does not
license production normalization: the dossier keeps Syzygy W/D/L/DTZ/DTM separate from bounded,
versioned cp/mate and routes Review, grades, bots and packs to source-local rules.

[[D143]] is closed as a research gap; no corpus ledger or production evidence contract was widened.
The dossier is `design/research/engine-tablebase-corroboration.md`; raw receipts are under
`planning/d143-engine-tablebase-corroboration/`; the disposable instrument is
`tools/d143-engine-tablebase-corroboration-harness/`.

## 2026-08-26 — pack-capability contract returns on the dependency and digest foundations

Independently re-reviewed the repaired F3 draft before lane-0.30 implementation. The six prior
repairs survive, including the consumer-owned claim-binding grammar and the two-cause availability
ruling, but the draft remains unbuildable without inventing core semantics. [[D1620]]–[[D1626]]
record the exact gaps.

The mandatory pack `requires` array has no capability dependency/applicability graph, so neither
under- nor over-stamping can be refused as criterion 3 promises. The actual D566 repair changed the
`pawnSafetyOnPosition` helper while its structural switch branch remained a call: module + symbol
source regions therefore either miss the change or invalidate all eighteen arms together. The
declared semantic-disposition type cannot represent the `unsupported` and
`temporarily_unavailable` states criteria 8/16 branch on, and no total mapping exists from the two
shipped registries. The census supplies counts but not reproducible subject identity, and the
suffix-version ban has no precise legacy/API/test boundary.

The named live instruments also moved: `make evidence-manifest-check` is now
37/193/25/210 (semantic 67/67/15/1), and `FORMAT_DISPOSITIONS` is 7 reached / 3 refused / 1 retired /
1 unmeasured—not five refused. Later lifecycle audits remain unresolved: F7 and the evidence-kind
follow-up do not exist, while several obligations sit outside checked Discharges ownership.

The RFC and active register now say returned; the executable queue forbids implementation; the
exact amendment order is in
`planning/pack-capability-contract/independent-rereview-2026-08-26.md`. No schema, corpus,
production or protected-design bytes changed. No new owner ruling is needed, and [[D560]] remains
whole.

## 2026-08-26 — AssistanceConfig register is buildable before independent review

The pre-review of `rfc/assistance-config-register.md` found and corrected three process defects
without implementing the register. [[D1627]] replaces a syntax-only union walker—which would have
rejected Guided Hint's already-specified `"off" | HintRung` alias—with a TypeChecker-normalized
semantic-domain contract and able-to-fail local/imported/readonly-tuple fixtures. [[D1628]] keeps
RFC-0000's rule 7 generic instead of adding a prose inventory beside the executable resource set.
[[D1630]] gives `derivedOutput` an explicit assistance branch rather than falling through the
evidence-kind shape and reading members that do not exist.

The adjacent product seam remains open and owned. [[D1629]] records that the runtime interface and
the browser's hand-written parser/migrations can still drift while C9 is green. `hint-distance`
now requires one pure runtime v1-v5 codec consumed by web plus a TypeChecker-derived persistence
matrix over every field/domain member, missing/extra/unknown values, all legacy migrations and a
non-off v5 round trip. That correction changes no product byte and does not widen this process RFC.

The research dossier, coverage matrix, active register, routing and planning records now agree:
the process RFC has sixteen mutation classes and fourteen acceptance criteria, claims no product
resource itself, and is ready for independent D1 review. Normal governance is green after
refreshing the roadmap receipt; implementation remains forbidden until that review accepts it.

## 2026-08-26 — shared candidate packet returns before bots, hints and Review build on it

Independently reviewed the [[D1570]]–[[D1580]] buildability/cache amendment against the shipped
manifest compiler, legal-move authority, candidate collector, application composition and opponent
provider path. The lower architecture survives: one provider-free complete legal-candidate
population with separate bot/hint/Review joins remains the right foundation, and the Node-24
equal-item falsifier/typed-weight receipt remains valid evidence. The document is not buildable yet.

[[D1631]]–[[D1636]] record six independent blockers. Insufficient-material positions can be
game-terminal while retaining legal moves, contradicting the packet's zero-terminal and complete-set
criteria. The proposed final bot-cache key drops move history even though Maia receives
`position fen … moves …`. The RFC promises application injection into bot and semantic operations
that do not exist and are absent from its implementation table. Its literal derived projection
fails the shipped single-input grounding rule. Moving only the twenty child readings loses the
separately-derived legal-exchange and fork-survival inputs. Finally, the shared engine source is
White-perspective while the bot vector labels it root-side without defining a conversion or loss.

The RFC/register and Phase-2h plan now say returned. The exact amendment order is in
`planning/evidence-foundation-ux/shared-candidate-packet-independent-review-2026-08-26.md`. No
production, schema, content, design-intent or concurrent Wave-C harness byte changed; implementation
waits for author amendment and another independent review.

## 2026-08-26 — F1 admitted/rendered views receive a real process-local seal

The Guided Hint buildability pass re-ran the archived F1 trust claim at the runtime symbol and found
[[D1637]]: `ConsumerEvidenceView` and `RenderedEvidenceView` asserted only a non-exported symbol.
That rejects a fresh structural literal, but object spread copies enumerable symbol properties, so
spreading a legitimate view and replacing `items` recreated the D662 evidence/prose side channel.

Both constructors now register their frozen result in distinct private `WeakSet`s and both exported
assertions require membership as well as the symbol and shape. Permanent fixtures refuse spread
copies at the consumer and rendered layers, a spread passed back through `renderEvidenceItems`, JSON
round-trips and the existing declared-evidence cast forge. `docs/evidence-contract.md` records the
actual boundary. The ordinary `make test` gate passes 184 files / 1,192 tests; no schema, content,
manifest declaration, design-intent or concurrent semantic-harness byte changed.

## 2026-08-26 — Guided Hint returns at the author checkpoint

Re-derived the rebuilt Guided Hint document against the shipped F1 compiler, module vocabulary,
AssistanceConfig/preset algebra, evidence queue and run/client types. The measured selector and
five byte-redacted learner rungs survive, but [[D1638]]–[[D1643]] prevent a trustworthy production
path. Voice fallback and search-source absence share one ambiguous state; the five-rung ceiling has
no owner-approved preset/context table or representable permission type; the operator horizon is
structurally forgeable; its literal F1 graph widens measured/mixed-grounding inputs and invents
`pattern` answer content for source families that do not carry it; `move` is not a module-answer
ceiling token; and pending/reset behavior invents identities without a poll/cancel/stale protocol.

This is an author checkpoint, not the independent D1 review. The RFC/register and Phase-2h plan say
returned, and `planning/evidence-foundation-ux/hint-distance-author-checkpoint-2026-08-26.md` gives
the exact repair order. [[D1639]] is the one owner choice: total preset/context maximum rungs.
Everything else is technical author work after the returned shared packet supplies its amended
authority types. No implementation, schema, content, design-intent or concurrent Wave-C harness byte
changed in this checkpoint.

## 2026-08-26 — Review evidence compiler returns at the author checkpoint

Traced `rfc/review-evidence-compiler.md` through the shipped manifest compiler, Story projection,
`RunService.#ensureStoryEvidence`, queue/executor, engine supervisor and REST response. The typed
node-free position evaluation, separate cp/mate domains, partial family states and refusal of raw
provider dumps remain the right foundation. The production contract is not buildable yet.

[[D1644]]–[[D1651]] record eight blockers. White-WDL is a read-time normalization misdeclared as a
second node-bound live source. The optional mate-proof link has no declared position authority.
Idempotence repairs `enqueueProducer` while production Story uses `queue.enqueue`. Constructor-held
engine identity can go stale across a restart. Story's `last_level` loses its learner-perspective
conversion. The F1-sealed packet has no named server-local consumer or closed JSON termination.
Eval+WDL for every imported node has no progressive retained-work bound. Finally, exact recorded
position identity is used to upgrade measured engine confidence, which violates the weakest-input
derivation rule.

This is the RFC author's buildability checkpoint, not its required independent review. The RFC,
active register, Phase-2e plan, routing queue and 1.0 Review capability now say returned; the exact
repair order and able-to-fail fixtures are in
`planning/evidence-foundation-ux/review-evidence-compiler-author-checkpoint-2026-08-26.md`. No
production, schema, content, protected design or concurrent semantic-harness byte changed.

## 2026-08-26 — bounded policy targets returns at independent buildability review

Re-derived `rfc/bounded-policy-targets.md` against the committed D1023 artifacts, the F1 compiler,
exact legal-move authority, production Maia request/history identity, evidence manifest and server
composition. The research verdict survives: exact named-target removal/return and its separate
quantifiers are useful primitives; the destination-denial arm remains a measured negative; no
intent, plan, prophylaxis, significance or move-quality claim is earned.

[[D1652]]–[[D1658]] return the implementation contract. The Stockfish source already contains an
interpreted target category; the run-node Maia page cannot identify hypothetical/history-conditioned
queries; the six catalogue declarations are not literal; the provider file has no executable
operation/composition path; root completeness compares two counts from the same response; registered
threat/exchange inputs would be recomputed outside their sealed authority; and up to two Stockfish
depths plus nine Maia calls per target have no bounded scheduling/cache protocol. Existing [[D1390]]
and [[D1647]] remain prerequisites for truthful latency and same-exchange provider identity.

The RFC and active register now say returned; routing and the 1.0 evidence capability name the exact
repair. The independent dossier is
`planning/bounded-policy-targets/independent-buildability-review-2026-08-26.md`. No production,
schema, content, protected design or concurrent Wave-C/review byte changed.

## 2026-08-26 — intent-presets D971 amendment returns at independent re-review

Traced the amended preset/config/clamp tables through runtime persistence, module contracts,
DrillScreen, server permissions, `/capabilities`, browser speech state and Campaign reach. The
closed preset/context vocabularies and shipped workflow key survive; the compiler and surface
contract do not yet.

[[D1659]] finds the first-use no-op: `loadAssistance` returns complete `SILENT_ASSISTANCE` when no
key exists, and rule 4 interprets all nine fallback fields as explicit choices, so Guided, Support
and Analysis compile back to Quiet. [[D1660]] records the one owner choice: named presets cannot
truthfully coexist with a global higher raw override; choose literal named presets plus
Custom/Advanced, or visible per-preset modifications. [[D1661]] records the module/config bypass in
both directions. [[D1662]] records the undefined availability input across provider, browser and
pending state. [[D1663]] records the lifecycle contradiction between a deferred module consumer,
criterion-9 delivery logging and claimed counterparty discharge. Existing [[D1437]]/[[D1500]] keeps
Campaign's guided default unreachable.

The RFC/register, routing and 1.0 Support capability now say returned. Exact repair and falsifiers:
`planning/intent-presets/independent-amendment-rereview-2026-08-26.md`. No production, protected
design, schema, content or concurrent UX/review byte changed.

## 2026-08-26 — evidence presentation returns at independent buildability review

Traced `rfc/evidence-presentation.md` through the shipped F1 seals, generic renderer registry,
manifest projection declarations, learner/operator dispositions and the actual claim/citation
payloads. The thirteen-component vocabulary remains the right missing layer beneath forms and
module seats, and the one-fact/no-local-chess rules survive. The proposed trust boundary does not.

[[D1664]]–[[D1672]] record nine blockers. Production renderers consume unknown payloads through
casts, so manifest strings cannot prove a visual operand came from admitted evidence. Convention
metadata is caller-writable; citation has no passage; enum values remain plain strings; abstention
has no closed state vocabulary; structured documents are neither schema-bound nor byte-preserving;
coverage incorrectly includes machine/retired/operator projections; chart range is caller-owned;
and the full landing still depends on owner-tier intent plus returned module/hint contracts.

The RFC and active register now say returned, with exact repair and falsifiers in
`planning/platform-alignment/evidence-presentation/independent-buildability-review-2026-08-26.md`.
No production, protected design, schema, content or concurrent Claude review/harness byte changed.

## 2026-08-26 — D1664 sealed component-adapter feasibility pass

Ran a disposable five-arm harness over the real F1 admission path for
`pack.authored.claim_delivery@1`. A registered projection-specific adapter can produce a
process-local component seal bound by evidence object identity, terminate in a closed
digest-bearing JSON receipt, and acquire a new client-local seal only through an exact parser.
Literal, spread and JSON copies; cross-evidence pairing; text tampering; extra fields; direct
unparsed JSON; and an unregistered projection all refuse as intended.

[[D1673]] records the positive result and its limit: the registered adapter remains trusted code,
so this does not rescue `evidence-presentation`'s manifest-string coverage claim. Each projection
family still needs an exact constructor and operand-retention negatives, and the real route/seat
remains D1588 work. Dossier: `design/research/sealed-component-adapter.md`; instrument:
`tools/d1664-component-adapter-harness/` (5/5 green). No production or protected-design byte changed.

## 2026-08-26 — variants full-family amendment returns at independent re-review

Re-derived `rfc/variants.md` against the current branch runtime, chessops variant/move types, PGN
normalization, opponent parser, evidence queue, campaign seal and release composition. The prior
review's six repairs survive. The widened Tier-2 implementation premise does not.

[[D1674]]–[[D1682]] record nine blockers. Runtime commits and terminals are standard-`Chess` and
Crazyhouse drops are explicitly refused; Chess960 behavior has no durable origin identity;
`parseVariant` erases the Standard-versus-960 distinction needed by the setup guard;
Fairy-Stockfish has no packaged operation and its drop moves cannot cross the selector; evidence
jobs carry no rules identity; declared rungs and admission contexts have no typed authorities;
evidence-dark campaign nodes cannot use the current pack seal; and one criterion is green only
because the schema has no semantic field to test.

The RFC/register, routing and 1.0 social/campaign capabilities now say returned. Exact repair and
falsifiers: `planning/variants/independent-rereview-2026-08-26.md`. No production, protected design,
schema, content or concurrent Claude review/harness byte changed.

## 2026-08-26 — D1674 rules-aware runtime scope becomes executable

Ran a five-arm disposable harness against the pinned chessops and shipped runtime. Chessops accepts
and serializes a legal Crazyhouse `P@e4` drop; the current run refuses the pocket start and rejects
the drop as malformed. A King-of-the-Hill White win over the same board is a standard-chess draw,
so normal-move support cannot stand in for rules-correct terminal projection.

The AST census replaces [[D1674]]'s 181 textual occurrences with 159 production call sites across
32 files: 146 position, 11 legal-move, and 2 terminal calls. [[D1683]] records the important split:
nine play/input/export/opponent authorities must become rules-aware, while 23 standard-pack and
evidence readers need an exhaustive standard-only/suppressed disposition. A blind parser rewrite
would legalize play and manufacture variant chess evidence. Dossier:
`design/research/variant-runtime-boundary.md`; instrument:
`tools/d1674-variant-runtime-harness/` (5/5 green). No production, schema, content, protected-design
or concurrent Claude review/harness byte changed.

## 2026-08-26 — D1675/D1676 setup identity and import semantics measured

Ran five executable arms over the pinned chessops PGN parser and the production importer. The
library collapses 20 Standard/from-position/Chess960 aliases plus missing Variant to `chess` and
never reads `SetUp`. Production therefore accepts `From Position` without FEN as the ordinary
initial game, while rejecting a Chess960 PGN that supplies both `SetUp "1"` and FEN.

[[D1684]] records the minimum non-lossy identity: `rules + setupFamily`, with five families. A
same-FEN control proves that Standard and Chess960 admission can require different Maia,
Stockfish-960 and explorer capability, so current/later FEN bytes cannot recreate the fact.
Workflow origin remains a separate axis for [[D1680]] rather than being overloaded into the chess
identity. Dossier: `design/research/variant-setup-identity.md`; instrument:
`tools/d1675-setup-identity-harness/` (5/5 green). No production, schema, content,
protected-design or concurrent Claude review/harness byte changed.

## 2026-08-26 — D1678 run-evidence operation boundary measured

AST-censused the run-derived evidence request surface instead of assuming the asynchronous queue
was the boundary. There are 15 production calls: eight in `DrillRunService` and seven direct in
REST, spanning queue jobs, selector/enumeration, tablebase, corpus and local evidence packets.
`EvidenceJobInput`, `SelectMoveRequest` and `RunStart` all omit the measured rules/setup identity.

[[D1686]] records the contract consequence: operation-set-equal capability compilation must cover
all 15 calls, while provider internals and offline sourcing remain separately declared. [[D1685]]
records the independent standard-chess defect found in the same pass: prediction selects from
client-supplied start/history and persists mass/rank on the active node without a subject join.
Dossier: `design/research/variant-evidence-operation-boundary.md`; instrument:
`tools/d1678-evidence-operation-harness/` (3/3 green). No production, schema, content,
protected-design or concurrent Claude review/harness byte changed.

## 2026-08-26 — D1679 rules-aware producer capability measured

Compiled a literal three-subject matrix over the current evidence catalogue rather than copying
F1's landing headline. The manifest now contains 37 producers / 193 projections / 25 consumers /
210 bindings. Every producer is classified for Standard, Chess960 and Tier-2 evidence-dark
subjects, and additions fail set equality until classified.

[[D1688]] records the architectural result: computation, learner admission and absence semantics
are independent. A rules-capable Fairy opponent must not authorize learner evidence; a missing
Standard provider is honest-empty while a wrong-domain Maia or detector request is suppressed;
and all twelve derived producers inherit their exact inputs rather than laundering capability.
Producer rows remain defaults beneath projection dispositions and consumer bindings, which is
necessary for mixed producers such as `run.record`. [[D1687]] corrects mutable planning prose that
still treated the historical 19-producer landing population as current.

Dossier: `design/research/variant-producer-capability.md`; instrument:
`tools/d1679-rules-capability-harness/` (6/6 green). No production, schema, content,
protected-design or concurrent Claude review/harness byte changed.

## 2026-08-26 — D1588/D1590 module delivery and staging boundary measured

The returned module-registration draft referred to an existing run/evidence response that does
not exist. An executable census finds 36 closed run actions and no module operation; the async
evidence page carries only producer-job results. [[D1689]] supplies the author boundary: one
timing-discriminated module query whose server derives the subject and whose closed wire is parsed
through the sealed component adapter before an occupied seat.

The input side is smaller than the draft implied. Click, drag, touch, keyboard-grid and SAN/UCI
text all emit one exact controller candidate after promotion. A generation-token coordinator
passes risk, empty, unavailable, revise/restore, stale-response and exact-once-confirm arms across
all five modes ([[D1690]]). The pass also finds two trust/subject seams: the board announces
“Move committed” before the server mutation resolves ([[D1691]]), and post-commit packets must
capture the learner node returned by the move before automatic opponent play advances the cursor
([[D1692]]).

Dossier: `design/research/module-delivery-and-staging-boundary.md`; instrument:
`tools/d1588-module-delivery-harness/` (9/9 green). No production, schema, content,
protected-design or concurrent Claude review/harness byte changed.

## 2026-08-26 — D1585/D1586/D1587/D1589/D1591 module semantic closure measured

Turned five independent-review returns into able-to-fail contract prototypes instead of asking an
implementer to choose semantics. Eight Node-24 arms establish that answer content branches across
theory, evaluation and move disclosure; Sight's literal 22-row manifest set derives exactly
`fact + pattern`, with rook-on-seventh as its sole pattern witness; and a population-summary
payload can retain Explorer context while making SAN, UCI and committed-move identity
unrepresentable.

The same pass executes the reducer bridge through the real F1 seals: survivors are re-admitted for
the exact same consumer through `evidenceForConsumer`, a dropped sentinel reaches none of
deterministic/provider/voice bytes, and a spread-forged subset fails. Match's only permitted module
now has a measured role repair shape—`rules_floor` admits the seated participant while the context
ceiling still excludes all guidance. Dossier: `design/research/module-registry-semantic-closure.md`;
instrument: `tools/d1585-module-semantic-closure/` (8/8 green).

The RFC stays returned. These results require author amendment and repeat review, and [[D1164]]'s
exact set-equal stable novelty-identity matrix remains open. No production, protected design,
schema, content or concurrent Claude review/harness byte changed.

## 2026-08-26 — D1164 module novelty identity closure measured

Derived the proactive accepts rather than preserving the RFC's hand count. The post-commit module
contains 43 projections, not 38; structure adds six; theory adds three unique rows because shape
firing overlaps. The possible identity registry is therefore 52 exact ids. Every member now has a
stable compared-field declaration or one explicit exemption (edge-scoped move grade), and the
checker forbids node/event ids, all FEN spellings, move/UCI anchors, shape node anchors and source
retrieval time from novelty identity.

Eight executable arms prove distinct-node equality, changed-subject inequality, positive versus
avoidance polarity, grade preservation, optional-union canonicality and closure set equality. The
pass also finds [[D1694]]: `theory_breadcrumb` is declared on request but assigned a three-node
suppression window in contradiction with the same section's repeat-request guarantee. Active
closure is 49 under window 0, or 52 only after an initiative amendment; the instrument records
both and chooses neither.

Dossier: `design/research/module-novelty-identity-closure.md`; instrument:
`tools/d1164-novelty-identity-harness/` (8/8 green). No production, protected design, schema,
content, RFC status or concurrent Claude review/harness byte changed.

## 2026-08-26 — D1612–D1617 longitudinal-store contract closure measured

Turned all six independent re-review returns into one ten-arm executable author handoff. The exact
constructor registry contains 67 literal versioned rows and rejects a count-preserving swap of two
valid avoidance bases. The durable job protocol adds generation, token, worker and expiry;
simultaneous claims, expiry/reclaim, stale publication, crash-before/after publish, retry and closed
failure-code arms all behave distinctly.

The snapshot cut now means the validated contiguous run-event prefix through claimed N, with a
publication CAS that can publish N and reopen pending M when a newer request arrives. Independent
phase/class decision denominators make late-first opportunity, later no-opportunity, retry, phase
change and complete rebuild agree. The storage scheduling set is exactly seven real operations,
and imported rows remain observed-only unless a durable non-empty learner assertion exists.

Dossier: `design/research/longitudinal-store-contract-closure.md`; handoff:
`planning/longitudinal-store/author-repair-handoff-2026-08-26.md`; instrument:
`tools/d1612-longitudinal-contract-harness/` (10/10 green). No migration, production schema,
protected design, RFC status, player-profile consumer, content or concurrent Claude byte changed.

## 2026-08-26 — D1602–D1604 bot guard and dependent trait contract measured

Converted the bot-roster buildability return's guard and trait requirements into a ten-arm
Node-24 instrument. One sealed receipt now binds the root, history, exact legal candidate set,
Stockfish 18 identity, Threads 1, Hash 16, cleared state, MultiPV/searchmoves, fixed depth 8,
root-side score domain and elapsed time. Candidate loss is derived inside the receipt; provider-off,
deadline, missing/duplicate, bounded, mixed-domain, wrong-root/history and forged inputs abstain.

The only measured trait is registered as `pawn_move@1` and derived from the shipped exact-legal
board boundary. Ordinary moves, captures and promotions are positive; castling/non-pawns are hard
negatives. A guard abstention now necessarily abstains the dependent pawn trait and preserves the
base human-policy mass. D1606 is only half answered: the dedicated request operands are pinned,
but the exact Maia-plus-guard production chain still needs a combined-budget measurement.

Dossier: `design/research/bot-guard-and-trait-contract.md`; author handoff:
`planning/bot-roster/guard-trait-author-repair-2026-08-26.md`; instrument:
`tools/d1602-bot-guard-contract-harness/` (10/10 green). No RFC was amended or accepted, no
production profile was registered, and no concurrent D872/review byte was touched.

## 2026-08-26 — D1605/D1606 bot production route and budget boundary measured

The seven-arm production census finds only three of twelve required operations at HEAD: the server
parser validates a profile, the cache key retains it, and human-common acquires a Maia vector. Run
types/schema, both create contracts, both request builders, the non-test selector, persisted
selection, capabilities and card cannot carry the profile. `composeBotPolicySelection` still has
one production occurrence—its definition.

The present browser round trip is also the wrong authority: authenticated `/select-move` accepts
caller FEN/history/policy/seed and the browser echoes the selection into the run mutation. Extending
that pass-through would make profile choice client-authoritative and retain D233's evidence leak.
The author handoff therefore specifies one run-bound atomic select+append operation with active-node
CAS and request idempotency; raw Maia evidence queries do not inherit persona transforms.

Re-derived the committed D969 combined depth-8 population rather than rerunning a disposable
chain: 50 roots, 958 exact candidates, sequential p50/p95/max 209.085/286.796/499.1 ms. The author
input proposes 400 ms worry, 500 ms intervention and a 500-ms optional-guard opportunity window;
the exact release route under expected concurrency remains the completion receipt.

Dossier: `design/research/bot-production-route-and-selection-budget.md`; handoff:
`planning/bot-roster/production-route-author-repair-2026-08-26.md`; instrument:
`tools/d1605-bot-route-boundary-harness/` (7/7 green). No production/RFC/schema byte or concurrent
Claude path changed.

## 2026-08-26 — D1601/D1607 bot axes and grounded card compiler measured

Replaced the roster's false cp-versus-Elo “orthogonality” with three independently declared
projections: model band, behavior family and display identity. The family projection is byte-equal
across bands while model and persona differ; baseline, guarded and pawn-forward family projections
remain distinct. No structural criterion assumes a zero strength effect—exact-digest calibration
must measure it.

The eight-arm card compiler accepts a profile plus an optional matching calibration receipt and no
caller sentence. It renders registered Maia/sampler mechanics, guard and abstention scope, the
guard-dependent +12.28-point pawn measurement, no book, no cross-game memory, endgame/clock scope
and calibration/absence with source ids. Decorative name/avatar/tagline is a separate display slot
and reaches no behavior statement. Wrong-digest calibration, malformed family layers, wrong bands
and caller prose fail.

Dossier: `design/research/bot-policy-axes-and-card-grounding.md`; handoff:
`planning/bot-roster/card-axis-author-repair-2026-08-26.md`; instrument:
`tools/d1601-bot-card-contract-harness/` (8/8 green). D1610/D1611 remain owner decisions; no RFC,
profile, product copy, schema or concurrent Claude byte changed.

## 2026-08-26 — D1608 opponent-experience RFC drafted

Drafted the bounded learner-facing owner for the bot roster after the research, route and grounded
card gates were all available. The RFC makes the exact 4×3 Play picker, grounded card and fixed
in-run identity bar one indivisible acceptance outcome; exact-digest resume/rematch,
provider/degraded states, 320×568/keyboard behavior and a full release journey are included.

The route deliberately consumes the server-owned atomic opponent operation from the D1605 research
rather than widening public `/select-move` with a client-selected profile. Strong engine remains a
separate sparring wall. Raw model/profile ids stay out of ordinary Play, and opponent identity is
chrome independent of assistance ceilings.

`rfc/opponent-experience.md` remains draft. D1610 (final twelve identities/art), D1611 (first-run
default; RFC recommends baseline 1400) and independent cross-review block acceptance. The RFC
claims no shared resource and no product/schema byte was changed.

## 2026-08-26 — Bot policy and roster production-safety author amendment

Folded the three measured D1601–D1609 repair handoffs into `bot-policy.md` and `bot-roster.md`.
`bot-policy` returned from implementing to draft because the installed compiler is not a safe
production path: the live composer still trusts bare loss/trait fields and the browser performs a
run-unbound `/select-move` followed by an echoed selection append.

The amended authority is one server-owned atomic opponent operation. It derives exact run root,
history, seed and profile; consumes a sealed `stockfish-guard@1` whole-candidate receipt and a
registered `pawn_move@1` legal-board view; makes pawn weighting depend on guard success; persists
move and decision together under cursor/idempotency guards; and feeds capability/card projections
from the same compiled profile. The release operating contract is p95 at or below 400 ms healthy,
above 500 ms intervention, with a 500-ms optional-guard opportunity deadline and baseline Play
preserved.

The roster no longer compares centipawns with Elo or calls family strength-orthogonal. Band,
family and display are separately declared; exact-digest calibration reports the actual family
effect. Hand-written behavior copy is replaced by a closed source-bearing card compiler. All
twelve profiles remain the 1.0 outcome; partial catalogue registration, permanent
`uncalibrated`, placeholder identities and a hidden Maia-1500 default cannot count as completion.

Both RFCs remain draft pending independent cross-review. D1610/D1611 remain owner decisions and
the exact release-concurrency/calibration/observability receipts remain implementation discharges.
No catalogue profile, schema, migration or production byte changed in this author round.

## 2026-08-26 — Campaign two-horizon progression contract measured

Closed the mechanical author inputs behind [[D1592]]–[[D1597]] without resuming the returned
campaign implementation. The authority census finds one campaign reward kind and eleven module
ids at HEAD, but no runtime theory-passage authority and no server-readable appearance catalog.
Recorded those dependency faults as [[D1695]]/[[D1696]], the owed campaign-schema lane-2 claim as
[[D1697]], and the absence of any durable title/modifier/skip-start/variant reward registry as
[[D1698]].

The research contract separates owned, equipped, ready/resting, encounter-suppressed, source-
available and effective state; a preset transition cannot mutate ownership or equipment, and every
ineffective owned item carries one exact reason. The proposed run reward union is module unlock,
bundle-pinned theory unlock and the existing typed campaign-resource grant—not a generic tool id.
A path diagnostic follows every acquisition through every reachable continuation and requires a
later consumer plus a later boss consumer, while claiming structural opportunity only.

The durable horizon uses an idempotent completed-run award keyed by learner, pinned campaign, run
and reward, with owned inventory projected from award history. The minimum grounded 1.0 classes are
completion/prestige marks and shared-catalog cosmetics; broader meta rewards remain an explicit
product choice. Prestige now has the exact completed nine-layer denominator, abandonment is an
event authority, and terminal cursors are discriminated rather than overloaded `null`.

Nine Node-24 arms pass in `tools/d1592-two-horizon-harness/`. Dossier:
`design/research/campaign-two-horizon-contract.md`; author handoff:
`planning/campaign/two-horizon-author-repair-2026-08-26.md`. [[D1600]] remains owner-blocked; no
RFC, schema, migration, production route, content or UI byte was changed.

## 2026-08-26 — Shared candidate packet return closed at the contract layer

Re-derived [[D1631]]–[[D1636]] against the current legal-move authority, F1 compiler, semantic
collectors, candidate adapter, application root and opponent selector. The lower primitive
survives, but one correction changes its type: a variable heterogeneous packet cannot truthfully be
one F1 derived evidence projection. The literal RFC tuple fails `EVIDENCE_DERIVATION_WIDENS`; the
repair is an operator-only sealed compilation receipt retaining original declared values, while F1
continues to bind each constituent to its actual consumer.

The contract now separates complete legal rows from game adjudication and separates factual,
provider and policy cache identities, preserving Maia's exact history-shaped request. The first
landing is narrowed to the compiler/cache/service, the real research semantic-selection operation,
the legacy candidate adapter and a bounded existing final selector cache. No live bot, hint,
Review, REST or application injection is claimed before its consumer RFC lands.

The code-derived closure is 47 one-edge event identities plus 22 reading identities, including the
two features the returned migration dropped: conditional legal exchange and fork survival. Typed
Stockfish scores remain White-perspective at source; a separate root projection handles both colors,
cp loss and mate relations, abstaining on mixed domains or measurement mismatch.

Nine Node-24 arms pass in `tools/d1631-candidate-packet-repair-harness/`. Dossier:
`design/research/shared-candidate-packet-contract-closure.md`; author handoff:
`planning/evidence-foundation-ux/shared-candidate-packet-author-repair-2026-08-26.md`. The RFC remains
returned pending Claude author amendment and fresh independent buildability review; no RFC,
production, schema, content or UI byte changed.

## 2026-08-26 — Semantic validation labels separated from executable chess evidence

Closed [[D1711]] by running the complete 67-event register through a new disposable validation
authority census. Every declaration manufactures one `positive` and one `hard-negative` string
from its own projection id. The compiler checks only non-empty strings; the generic all-event test
constructs arbitrary complete operands, removes the first operand for its negative, and regenerates
the same expected labels. None of the 134 labels resolves to an independent fixture or dispatcher.

The audit does not erase real testing: 54 event ids are named outside the generic census (27 by
runtime/application tests, 49 by research tests, with overlap), while 13 have no independent named
executable witness. The manifest nevertheless binds none of those tests. Its shared external token
is also only an input identity: the retained R2 baseline compiled 33 events and observes 29 current
ids, leaving 38 current ids absent while all 67 claim the same token.

Phase 3 now requires an independently authored/reviewed semantic-validation-authority contract:
production-emitter positives, genuine semantic hard negatives, total per-event applicability for
mirror/counterfactual/imported/external arms, and exact input+result receipts. Five Node-24 arms pass
in `tools/d1711-semantic-validation-closure/`. Dossier:
`design/research/semantic-validation-closure.md`; handoff:
`planning/evidence-foundation-ux/semantic-validation-author-repair-2026-08-26.md`. No production,
schema, content or UI byte changed.

## 2026-08-26 — Bounded target provider/derivation return closed at the contract layer

Re-derived [[D1390]], [[D1647]] and [[D1652]]–[[D1658]] against the shipped F1 compiler, legal-move
authority, threat/exchange evidence, engine supervisor, evidence queue, Maia selector and actual
server composition. D1023's chess findings survive; the proposed implementation unit does not. The
buildable dependency is three layers: exact local target derivation, shared generic provider
exchange receipts/scheduler, then target-policy composition. All three remain required for 1.0.

The Stockfish source becomes a node-free complete legal-root table with same-exchange actual
identity; target categories are derived separately. The Maia source carries a discriminated
history-conditioned versus exact-FEN request and never invents counterfactual node ids. Legal-root
completeness is set equality against the shipped authority, whose castling identity is `e1a1/e1h1`,
not hand-written destination UCI. Named targets retain and join the registered threat and exchange
items rather than recomputing them.

The pass reproduced two shared manifest defects: an `exact` confidence over a `reported` provider
input compiles today, and `derived.grade` advertises `sync` despite live Stockfish input. It also
confirmed there is no bounded-target production operation and current engine execution returns
anonymous lines rather than a same-exchange identity receipt.

Nine Node-24 arms pass in `tools/d1652-bounded-target-repair-harness/`. Dossier:
`design/research/bounded-policy-target-contract-closure.md`; author handoff:
`planning/bounded-policy-targets/author-repair-2026-08-26.md`. The RFC remains returned pending
Claude author split/amendment and fresh review; no RFC, production, schema, content or UI byte
changed.

## 2026-08-26 — Wave-C promotion-race pair closed at the contract layer

Re-derived the two held `semantic-collectors` ids ([[D963]]) against the shipped pawn evidence,
promotion helpers, exact legal moves, recorded/live tablebase shapes and F1 compiler. The existing
functions were not merely unregistered: raw-FEN geometry calls mutually contesting a2/b7 pawns an
unopposed race although both are `passed:false`, and the tablebase helper accepts a result from a
different same-piece-count position because its source carries no FEN ([[D1699]]).

The compileable graph is now literal. Geometry derives from the sealed complete pawn-contact
reading and retains opposing passed pawns with clear forward paths. Outcome also retains the exact
legal-move map and uses `anyOf` over same-FEN recorded tablebase or a new node-free live Syzygy
position receipt. Provider/outside/input absence stays unavailable and geometry never acquires
outcome words.

The pass corrected the preceding bounded-provider handoff too: `derived.pawn` mixes local geometry
with `[sync, interactive]` outcome alternatives, so one producer-wide scalar cannot be made truthful
by setting it to the slowest input ([[D1700]]). F1 needs projection/member-effective availability
and latency, or separate provider-backed producer ids. The shared provider layer now covers
Stockfish, Maia and Syzygy.

Six Node-24 arms pass in `tools/d1699-promotion-race-contract-harness/`. Dossier:
`design/research/promotion-race-contract-closure.md`; author handoff:
`planning/evidence-foundation-ux/promotion-race-author-repair-2026-08-26.md`. No RFC, production,
schema, content or UI byte changed; 13/14 waits on author amendment/review and 14/14 additionally
waits on the shared provider/F1 prerequisite.

## 2026-08-26 — Manifest-wide execution and confidence contract measured

Expanded every literal derivation in the shipped F1 catalogue rather than repairing only the held
promotion and bounded-target rows. The 37-producer / 193-projection graph contains 46 derived
projections, 96 direct derivation members and 99 fully expanded executable paths. Equal current
latency/source profiles cannot be collapsed because their exact derivation choices remain the
admission and confidence authority.

The census confirms three live contract defects. Eight shipped derived projections advertise
`local/sync` while their paths require Stockfish. Ten bindings across seven projections escape the
provider fallback check because it tests only the immediate producer; nine say consumer-wide
available and one unavailable without a binding-path consequence. Forty-nine immediate derivation
members discard `reported` confidence. Correcting the graph reaches a four-projection fixed point:
candidate vector, story last-level, story rank and story title ([[D1701]], [[D1702]]).

The repair is generated path metadata over the existing literal derivation graph, sticky reported
confidence and binding-level unsatisfied-source behavior. Producer metadata remains the own local
operation. `dependsOn` remains the semantic/migration graph and is not conjoined with mutually
exclusive derivation alternatives. This supplies the generic F1 amendment needed before the shared
Stockfish/Maia/Syzygy provider exchange and dependent Review, bot and promotion work.

Three Node-24 arms pass in `tools/d1700-evidence-execution-harness/`, including exact current-count
assertions and a red-shape confidence fixture. Dossier:
`design/research/evidence-execution-and-confidence-closure.md`; author handoff:
`planning/evidence-foundation-ux/f1-execution-metadata-author-repair-2026-08-26.md`. No RFC,
production, schema, content or UI byte changed.

## 2026-08-26 — Explorer source truth closed before consumer expansion

Audited the live and authoring Lichess Explorer paths as the fourth shared evidence provider. The
existing runtime `CorpusResult` is not a source receipt: it omits normalized-position and transport
identity, can be relabelled to arbitrary nodes/moves, accepts illegal/duplicate/impossible move
rows, starts its four-second budget only after queue dispatch, disagrees with manifest abstentions,
and drops fetched average-rating/opening/history fields. A separate source/selection defect turns
every valid population below 100 into absence before consumers can choose their own denominator
([[D1703]]–[[D1709]]).

The buildable contract is one node-free `human.explorer.position_page@1` receipt over exact request,
raw-response digests, validated bounded rows, listed/unlisted mass and cache provenance. Authoring
and interactive clients share normalization/validation/receipt truth while retaining different
scheduler/cache policies. Theory gets a move-free derived summary; played-move Review facts join
the source separately to recorded position/move; repertoire preserves unlisted mass; bots and
longitudinal analysis require their own admitted projections. Popularity never grades or
recommends a move.

Seven Node-24 arms pass in `tools/d1703-explorer-source-contract-harness/`. Dossier:
`design/research/explorer-source-contract-closure.md`; author handoff:
`planning/evidence-foundation-ux/explorer-source-author-repair-2026-08-26.md`. The shared provider
handoffs now name Stockfish, Maia, Syzygy and Explorer. No active RFC, production, schema, content
or UI byte changed.

## 2026-08-26 — Compiled evidence reclassified by deepest executable root

Closed [[D1710]] by joining the 193-projection F1 catalogue to constructors, non-test callers,
operation roots and sealed outputs. The manifest splits 93 current-consumer / 67 research-only /
33 unbound. That binding result overstates execution in two exact ways: the current-admitted
`derived.opponent.candidate_feature_vector@1` has zero production callers, and none of the 67
semantic projections reaches a live application operation.

The semantic set is now partitioned without residue: 45 can reach only the operator selector, 11
more can reach only `localSemanticEvents` behind the unused candidate helper, and 11 multi-edge
families stop at isolated constructors. This reproduces [[D1067]], [[D1072]], [[D1386]] and
[[D1633]] as one manifest-wide class rather than creating duplicate defects. It also finds the two
unbound bounded predicates—mate-through-four and overloaded-defender conflict—remain helper-only.

Phase 3 is re-gated on real operations: the complete one-edge packet, a recorded-run path compiler,
and emitted-item activation checks. The author handoff requires a generated execution-disposition
receipt so future catalogue growth cannot repeat the compiler-equals-product error. Five Node-24
arms pass in `tools/d1710-producer-execution-harness/`. Dossier:
`design/research/producer-execution-closure.md`; handoff:
`planning/evidence-foundation-ux/producer-execution-author-repair-2026-08-26.md`. No RFC,
production, schema, content or UI byte changed.

## 2026-08-26 — D1711 append-position correction (D1712)

The D1711 closeout entry exists earlier in this file because its context patch matched a prior
same-day closeout sentence rather than the previous EOF. Law 7 forbids moving or deleting that
history. This tail entry records that D1711 followed D1710 and routes [[D1712]] to a staged-diff
guard requiring future exploration-log additions to occur strictly after the committed EOF.

## 2026-08-26 — Append-only log position is now enforced (D1712)

Closed [[D1712]] at the process boundary. `staged-process-contracts` enumerates staged
`planning/**/log.md` paths, reads the previous bytes from `HEAD` and the proposed bytes from the
index, and accepts only when the latter begins with the former. A middle insertion and deletion
both fail; a strict tail append passes. The pre-commit glob now includes the guard's own source and
test, so changing the checker cannot skip the checker. The historical D1711 middle insertion and
its tail correction remain untouched as incident evidence.

## 2026-08-26 — Semantic-validation migration depth measured (D1713)

Published the set-equal 67-event migration matrix behind [[D1711]]. Existing authorities split
32 emitter positives / 35 missing, 5 emitter semantic negatives / 11 source-only / 51 missing,
zero emitter orientation cases / four source-only, and one emitter counterfactual / five
lower-layer. Imported output observes 23 current event roots; eight tactic families have external
disagreement evidence; fourteen events have no authority in any measured arm. The matrix pins each
populated cell to an exact file, test title and authority level, so predicate, composition,
population and external evidence cannot be laundered into event validation. The D1711 author
handoff now carries classed migration work packages. No production, RFC, schema, content or UX byte
changed.

## 2026-08-26 — Authority-empty semantic events executed (D1714–D1717)

Exercised all fourteen D1713 authority-empty ids on exact legal positions, sequences and complete
alternative populations. Five local families now have emitter-level positive/negative witnesses;
two sequence families have valid positive constructors but only lower-predicate negatives pending
the D1710 production operation. All seven avoidance ids mechanically emit and refuse, but the pass
found the relation is not valid: selector aggregation retains only projection/sign and drops the
subject. Exact `a4b5` loses isolated-pawn(a), gains isolated-pawn(b), and is still labelled as
isolated-pawn avoidance because all 41 alternatives preserve the a-file subject ([[D1716]]).

The same search found blocker-blind distant opposition in a nearly full-material opening: king e1
versus king e7 counts despite intervening pieces, refuting a living phase-lock claim ([[D1717]]).
Defect witnesses were deliberately excluded from the validation matrix. Its live totals are now
39 emitter positives, 10 emitter negatives, 13 source-only negatives and seven no-valid-authority
rows. [[D1715]] corrected the handoff's six-versus-seven avoidance miscount. No RFC, production,
schema, content, pack or learner-UX byte changed.

## 2026-08-26 — Avoidance subject/outcome grammar closed (D1718–D1719)

Replayed 754 authored and 579 imported decisions through the production complete-alternative
selector and projected every retained avoidance event onto a total thirteen-family root-subject
grammar. The current top-two policy emits 790 avoidance facts. Played children retain the broad
family in 491, the exact projected condition key in 455, and the family only on another subject in
36; the latter is the measured class behind the isolated-a → isolated-b false generic wording.

The pass found a second data-loss boundary: the selector deduplicates by family/sign/move before it
seals `alternativeEvents`. One exact legal edge emits twelve distinct preserved direct-attack
subjects and retains at most one for that move, so no downstream filter can recover complete
subject denominators ([[D1719]]). The author handoff requires new `@2` identities, root-domain
state evaluation, subject-first distinct-move counting, literal played/alternative values and
perspective without valence. `king_opposition` remains held on [[D1717]], and all avoidance remains
research-only pending [[D1711]] validation plus [[D1710]] production emission. No production, RFC,
schema, content, pack or learner-UX byte changed.

## 2026-08-26 — King-opposition source boundary measured (D1717)

Triangulated the mechanical definition against three instructional sources and executed the
shipped predicate over 754 authored plus 579 imported decisions. The current blocker-blind
convention emits 90 observations; 61 have an empty line between the kings and 29 have an occupied
intervening square. Authored positions split 73 current / 61 unobstructed / 12 blocked; imported
positions split 17 / 0 / 17. The authored corpus happens to concentrate opposition in endgames,
but the false imported observations span opening, middlegame, endgame and unclear phases, so phase
is consumer relevance rather than source truth.

The successor handoff requires unobstructed reading/event/avoidance `@2` identities, an explicit
authored-predicate convention, deliberate migration of eight leaves across two content documents,
and D1711 executable validation before learner admission. The prior campaign research
generalization was corrected. No production, RFC, schema, content, pack or learner-UX byte changed.

## 2026-08-26 — Convention provenance closure audited (D1722)

Derived all 42 projections labelled `declared_convention` from the compiled manifest: ten carry a
machine-readable convention operand, sixteen name a version-like convention only in prose and
sixteen do neither. Twenty-seven already have consumers and two reach the external story voice. A
second dependency pass found eighteen convention-dependent projections under another scalar
grounding—twelve source/sibling rows and six derived compositions—including backward-pawn and
king-opposition predicates/readings labelled exact position rules while their events are labelled
conventional.

Two executable controls make the contract defect able to fail. The compiler accepts rewriting the
meaning of `backward_pawn@1` without a version change, and it rejects truthful convention grounding
on `square_clearance_observed@1` because a single-grounding derivation must repeat its input
grounding even when the composition adds `observed-window@1`. The author handoff requires one
compiled convention registry, direct and per-path transitive refs, semantic version enforcement and
sealed module/provider disclosure. It explicitly keeps raw ids in Advanced rather than recreating
the rejected evidence dump. No production, RFC, schema, content, pack or learner-UX byte changed.

## 2026-08-26 — Backward-pawn source and payload boundary measured (D1723)

Triangulated the shipped relation against Chess.com's term reference, Chess Programming Wiki's
computational definition and historical Stockfish source. The concept is stable but executable
definitions differ, so Tabiya's narrow support-plus-pawn-controller rule is retained as a declared
convention rather than presented as universal rules truth.

The fixed 754 authored + 579 imported decisions contain 403 file observations representing 404
exact pawn subjects. Every current reading has an empty square list. Only 251 subjects have an
empty stop; 153 are occupied (8 own / 145 enemy), while 99 are isolated, 305 have an adjacent pawn
ahead, 145 are on a half-open file and seven can capture an enemy pawn immediately. The successor
keeps the broad static fact but retains exact pawn/stop/support/controller/occupancy operands;
legal advance and legal opponent pawn capture become separate projections. Five authored leaves in
three documents require explicit v1/v2 migration after D1722 convention provenance and before
D1711 validation, D1718 avoidance or learner modules. No production, RFC, schema, content, pack or
learner-UX byte changed.

## 2026-08-26 — Square denial and outpost family separated (D1724)

Triangulated FIDE attack semantics, Chess.com's term boundary and a historical classical Stockfish
outpost evaluator, then reconstructed the shipped `outpost` predicate over the fixed populations.
Current pawn control, same-file future challenge and capture-migration reach answer different
questions; candidate square, occupied outpost and strategic use are also distinct states.

Across 611 authored / 577 imported positions, the shipped maximal convention leaves 0 / 17
occupied outposts. The same-file convention yields 9 / 43 and retains 162 / 383 candidates that
only hypothetical capture migration refuses. Across 754 + 579 decisions and every legal
alternative, pawn control newly hitting an occupied piece discriminates at 3.17× / 3.23×; generic
reach overlap is 1.14× / 1.36×, while future-file-candidate removal is 9.83× / 16.77× but has only
4 / 8 played positives. The successor keeps exact pawn/square/piece/basis operands, splits
candidate/occupied/use, and refuses “prevents,” forced retreat, value or intent without another
evidence plane. D632's live authoring count is corrected from stale 77 to 23 expressions in three
shape documents; all still require dry-run plus human basis review. No production, RFC, schema,
content, pack or learner-UX byte changed.

## 2026-08-26 — D1724 transition provenance corrected (D1725)

A live-symbol reread found D1724's outpost split is new but its initial statement that
move-created denial was missing was false. `rules.pawn.event.dynamics` already emits
`minor_harassed` with exact pawn/minor identity; `derived.pawn.sequence.harassment_pressure`
retains the bishop reply and pressure line; D771 already measured empty-square legal/local-safety.
D1724's broader all-non-pawn event has different scope, explaining its 3.17× / 3.23× result versus
the prior minor-only 3.63× / 3.18×. The handoff now reuses existing collectors and routes delivery
through D1710; only shared current-control identity or genuinely new roles remain candidate source
work. No production, RFC, schema, content, pack or learner-UX byte changed.

## 2026-08-26 — Legacy reading to identity-rich successor closure measured (D1726/D1727)

Joined all 18 structural feature kinds and all 14 transition reading leaves to the compiled
producer/consumer graph, live web operation and returned module-registration table. All 17 emitted
structural readings are live in inspector/sight; eight richer structural successors have zero
consumers. All 14 legacy transition leaves have an identity-rich event successor, but every
successor is research-only. The current web renders the legacy rows directly.

Across 611 authored / 577 imported positions, raw structural width is 63.89 mean / 80 median / 102
max and 80.80 / 84 / 106. Five inventory families contribute 33,225/39,035 (85.12%) and
40,980/46,621 (87.90%) facts. The returned module draft would preserve the inversion: ordinary
sight receives every legacy row while exact mobility, king state and material-role identity remain
full-inspector-only. The pass also reproduced two named-structure payload shapes under one
projection: prose-only in inspector/sight, id+name+prose in guidance. The handoff keeps authored
predicates stable, seals pattern identity, activates D1710/D1711 operations and replaces ordinary
presentation with question-bound rich sources. No production, RFC, schema, content, pack or
learner-UX byte changed.

## 2026-08-26 — Exact isolated/doubled pawn identity measured (D1728/D1729)

Derived exact pawn-file groups from shipped `pawnConnectivityReading` and proved them set-equal to
both legacy predicates across 18,912 fixed color/file cells. Isolated file rows collapse 163→180
authored and 369→408 imported pawn subjects; 17/39 are simultaneously doubled. No tripled corpus
case exists, but a `c3,c4,c5` fixture retains all three.

Across committed edges, exact membership changes while file truth stays true in 18 authored and
9 imported events; 28/77 authored and 49/109 imported isolated+doubled group changes exclude the
mover. The v1 event's “identity-preserving” claim is therefore false. The handoff derives an exact
group reading/event with `membership_changed`, preserves pack predicates, and refuses
weakness/value/plan. No production, RFC, schema, pack, content or learner UX changed.

## 2026-08-26 — Line evidence relevance and blocker identity measured (D1730/D1731)

Executed the legacy board-edge blocker reading, exact target-ray and discovered readers, slider-ray
edge events, discovered execution and both observed clearance sequences over the fixed
authored/imported populations. Raw blocker rows are 11,556/41,115 (28.11%) authored and
29,075/93,323 (31.16%) imported structural facts, yet the endpoint is a board edge rather than a
chess target. Exact target-bearing sources already ship but stop before ordinary consumers.

The transition event compares only blocker-array lengths. Exact reconstruction finds 109 authored
and 126 imported count-preserving blocker-set changes that v1 drops entirely. The handoff versions
that inventory event with `membership_changed`, preserves target-bearing ray/discovered/clearance
authorities, and makes relevance a selected module query rather than a new universal collector.
No production, RFC, schema, pack, content or learner UX changed.

## 2026-08-26 — Exact file state and stationary heavy-piece access measured (D1732/D1733)

Derived open and color-relative half-open files from exact pawn connectivity and proved both
legacy predicate truth sets over every fixed authored/imported before/after position. Across
643/1,152 unique positions the source sees 1,758/577 open states, 604/1,877 half-open states and
552/1,222 rook/queen occupancies on eligible files.

The shipped moved-heavy event fires 19/26 played times at 1.40×/1.24×. Its explicitly excluded
stationary case—pawn movement/capture newly revealing the file to a retained rook/queen—fires
27/35 times at 2.43×/3.83×. The handoff derives exact file-state change from the D1728 pawn source,
adds a separate stationary-access event and refuses activity/control/value language without
another join. No production, RFC, schema, pack, content or learner UX changed.

## 2026-08-26 — Pawn-island transition identity measured (D1734/D1735)

Compared exact occupied-file partitions from the shipped pawn-connectivity source across all 754
authored and 579 imported committed edges. V1 emits exactly two count rows per move. Its
1,472/1,092 `preserved` rows split into 1,445/1,057 genuinely unchanged relations and 27/35
equal-count topology changes that the payload cannot express; 36/66 further relations change
count. Changed islands affect the non-moving side 24/54 times.

The handoff versions exact before/after islands with `topology_changed`, stops emitting unchanged
semantic events, reuses the D1728 pawn authority, preserves authored count conditions and refuses
weakness/value/plan. No production, RFC, schema, pack, content or learner UX changed.

## 2026-08-26 — Evidence source-repair handoffs dependency-ordered (D1736)

Consolidated sixteen evidence author handoffs into one six-stage authoring wave: shared convention
and execution provenance; exact source identities/events; real production operations; independent
semantic validation; subject-first avoidance denominators; then ordinary-module migration. The
packet recommends one living source-identity amendment over seven competing edits to the same
manifest/runtime files, while preserving each dossier as semantic authority. No RFC was accepted,
no production or content byte changed, and module/UX activation remains downstream.

## 2026-08-26 — Declared 1.0 evidence source identity closed as a research inventory (D1737/D1738)

Composed the existing set-equal receipts for 37 producer roots / 193 projections, 18 structural
families, 14 transition leaves, 30 tactical ids, 18 breadth ids and 67 semantic events into one
thirty-family 1.0 source basis. Fourteen families have a landed source boundary, seven require a
versioned repair and nine have a researched/specifiable source contract that is not landed. No row
remains an unowned source-semantics question. This supersedes the 2026-08-24 closure's claim that
bounded 2–3-ply prevention was still a research gap and adds the previously omitted style atoms and
variant rules identity.

The pass does not claim product closure: sixteen source families still need production work, and
real operations, independent semantic validation, subject-safe avoidance, module selection,
presets and UX remain separate gates. Its executable anti-drop check also caught D1738: the
consolidated repair wave named only six of sixteen program handoffs literally. The wave now carries
all sixteen exact paths plus its two downstream readers once each. No production, RFC, schema,
pack, content or learner UX changed.

## 2026-08-26 — Non-landed evidence sources received exact execution owners (D1739)

Rechecked the D1737 result as an execution graph rather than only a research inventory. Its first
order implied the shared D1736 wave owned all sixteen non-landed/repair families; it directly owns
twelve. Bounded targets, cited theory and variant rules identity retain their separate living
owners. The seven literal player-style contracts had research definitions but no exact author
handoff, so the queue could still have dropped them.

Added the style-foundation handoff: two exact fianchetto configurations, three per-candidate
move/ply facts, game-level castling eligibility and typed clock-spend inputs, with no thresholds,
style prose, storage or personality claim. D1736 now consumes seventeen literal program handoffs.
The executable receipt assigns exactly one living owner to all sixteen non-landed families and
keeps the three sibling RFC lanes explicit. No production, RFC, schema, pack, content or learner
UX changed.

## 2026-08-26 — Required software CI timing instruments stabilized (D1740)

Two consecutive GitHub software-contract runs failed the same single-call opening-catalogue
microbenchmark at 55.12/55.66 microseconds against a 50-microsecond ceiling, while one then two
full-application boundary tests crossed Vitest's generic five-second unit timeout under runner
contention. The lookup check now keeps the 50-microsecond p95 and population-scaling negatives but
amortizes scheduler/timer noise over bounded 100-call samples. The production-boundary suite now
declares a fifteen-second integration budget; its assertions and real server boundary are
unchanged.

The affected two-file suite passed five consecutive runs (40/40 assertions). The exact GitHub
software command, `make verify-software`, then passed 1,026 tests across 168 files plus workspace
typechecks, schema/scaffold/packaging checks, compiled evidence manifests, production builds,
opening-catalogue verification, account lifecycle and rating isolation. Full local-CI closeout
remains D1448 and is not claimed by this repair.

The surrounding required tiers also passed before commit: repository governance (1,545 ledger
rows / 968 open / zero unrouted; 569 registered work items), real-content compatibility (166/166),
browser smoke (24 passed / one optional skipped), real-content browser integration (4/4), and the
responsive/accessibility interaction matrix (7/7). These are verification receipts for the
checkpoint, not a claim that D1448's clean committed-byte `make ci-local` discharge is complete.

## 2026-08-26 — Local CI entrypoint and performance tier repaired (D1800/D1801)

The first full `make ci-local` attempt after D1740 refused under ambient Node 26 even though the
repository's Node 24 executable was installed. The Make entrypoint now invokes the pinned
executable directly, and the wrapper prepends that executable's directory to every pnpm and Make
child environment. A unit fixture and scaffold contract refuse either half disappearing. The
ordinary command now needs no shell prefix and still installs no pre-push hook.

That repair exposed a second false signal: the unchanged opening-catalogue 50-microsecond p95
contract passed under pinned Node 24 alone but measured 102.72 microseconds while sharing Vitest's
pool with 167 unrelated files. It now runs as one required, single-worker performance tier after
the 1,025 generic software tests. Test-tier and scaffold checks refuse undeclared performance
files, re-entry into the generic pool, or removal from `verify-software`.

The final ordinary `make ci-local` reached `local CI parity PASS`: Node 24, pnpm 11.18.0, 1,025
generic software tests, one isolated performance contract at the unchanged ceiling, all
type/build/schema/evidence/governance checks, 166 real-content tests, 24 browser smoke tests (one
optional Maia test skipped), four browser content tests and seven responsive/accessibility matrix
tests. D1448 remains open pending a committed-byte or GitHub-green receipt rather than being
closed from an uncommitted working-tree run.

## 2026-08-26 — Learner-rating acceptance closure (D1807–D1810)

Re-derived all eighteen accepted learner-rating criteria against production records, routes,
components and executable tests. Seven are complete, seven have only partial/example authority,
three are missing and rated Campaign remains dependency-blocked. The sharpest gap is AC-8: no
Maia value-head diagnostic exists in the rated record or STRICT table, so the promised
diagnostic-only cross-check needs an owned migration amendment. AC-12's test covers only the seven
disclosure constants while the actual screen authors a larger copy set including “Beat band.”
AC-18 is inexpressible without played-control and calibration-coverage identities.

No production, migration, RFC, intent or archived bytes changed. The dossier routes the three
contract gaps back to learner-rating authoring and keeps AC-13–AC-16's population-level test debt
explicit rather than crediting current examples as total invariants.

## 2026-08-26 — Learner-rating cohort population invariants (D1809 partial)

Strengthened the already-authorized AC-14/15 behavior at the production service/storage boundary.
A paired 120-game population gives two learners identical results while their calibrated opponent
rungs drive materially different ratings; the standing remains ordered only by results and
handle. Equivalent rated games remain byte-equal across classroom membership/publication, two
open classrooms cannot aggregate one another, and the response negative now names forbidden
rank/percentile/mean/z-score plus run/evidence identities.

The focused eight-test cohort suite passes under repository Node 24. D1809 remains open rather
than being over-closed: no source-reachability guard yet proves every standing member is
self-created, and no total registry yet enumerates every multi-learner rendering site that owes the
unwitnessed-games limitation.

## 2026-08-26 — Standing self-publication becomes a reachability invariant (D1809 partial)

Added a production-source closure test for AC-13. Across every non-test server TypeScript source,
exactly one call may reach `publishStandingMember`, it lives in the authenticated service method
and its payload takes `learnerId` from `principal.learnerId`. Exactly one SQL insertion authority
may write `standing_members`. A future teacher/import/classroom derivation or raw-SQL bypass now
fails the ordinary software suite rather than relying on review.

D1809 stays open only on AC-16's all-multi-learner-rendering registry, which is intentionally
coupled to D1808's missing sealed copy registry rather than implemented as a second hand-written
site list.

## 2026-08-26 — Authored rate laundering closed without banning counts (D417)

The claim-binding guard now refuses rates written as decimal values, integer percentages, numeric
`percent` phrases, or spelled-number `percent` phrases inside author-attributed segments. Negative
fixtures preserve ordinary authored counts such as `91 games` and `44,467,486 times`; the repair
therefore enforces the ruled rate/count distinction rather than treating every integer as machine
output.

The focused claim-binding suite passes. `feedback-delivery` criterion 19 intentionally recorded the
old hole and said it must flip when D417 lands, but no executable criterion fixture exists; D1811
routes that documentary reconciliation to the RFC author instead of weakening production behavior
to preserve stale accepted prose. The corpus's `anti-scandinavian-white/just-take-it` claim remains
for the separately owned claim-binding content wave, where its 74% measurement can receive its real
explorer assertion rather than being rewritten or laundered as judgement.

## 2026-08-26 — Claim-backing writer and census agree on explicit validated state (D431/D444/D445)

`PackRegistry.fromDocuments` now records explicit `self_declared` backing rows for admitted
non-machine claims instead of making delivery infer them from a missing map entry. Machine-labelled
claims remain absent unless a validating binding exists, and the unverified community/playtest
constructors remain empty. A derived-feature-only production fixture binds the writer and reader.

The expression census now validates each ledger and its claim bindings before reporting backing.
Per-evidence-label counts retain attribution, while the headline total is a set of unique
`(pack, claim)` identities. One dual-labelled explorer+engine fixture counts once overall and once
under each relevant label; corrupting only its text digest reduces backing to zero.

D445 was refuted rather than patched. Repeated instrument text is rejected by the earlier
unique-occurrence rule as `CLAIM_SPAN_AMBIGUOUS`, before `authorSegments` can consume a range. The
ambiguity fixture now also proves the validated result is empty. The suspicious `indexOf`
therefore has no observable misattribution under the shipped invariant.

## 2026-08-26 — Lichess import strips third-party grading defensively (D410)

The Lichess game export now requests `comments=false` as well as `evals=false` and
`literate=false`, then independently parses and re-serializes the returned PGN through the same
annotation stripper used for studies. A hostile-response fixture injects prose grading, `%eval`,
NAGs and annotated SAN while ignoring the request flags; none reaches the resolved import bytes.
The licence note states that annotations were stripped.

This closes the shipped Lichess URL boundary, not the manual-paste boundary in D959 and not a
future broadcast-round adapter that does not yet exist. That adapter must reuse the same stripping
boundary. During the preceding D428 pass, the archived RFC was found to have explicitly declined
the required production-code choice; its missing successor is now concretely queued rather than
implemented without an accepted contract.

## 2026-08-26 — Real move interpolation is browser-proven (D840)

The theme-system implementation already supplied explicit normal, fast and reduced-motion
animation configuration, while the play-composition board path retained one outer board instance
and delayed its layout redraw until the configured interpolation completed. The missing piece was
an interaction-level witness: configuration and stable-instance tests could both pass while the
pieces still teleported.

A browser test now commits `e2e4`, waits for the real opponent reply and observes Chessground's
live `piece.anim` state at the stable board boundary. The observer intentionally follows replacement
of Chessground's inner surface during `redrawAll()`; watching the old inner element produced a false
negative even while the visual interpolation ran. The focused stable-instance plus animation pair
passes, and the full browser gate passes 36 tests with only the optional Maia latency test skipped.
D840 is closed on executable interaction evidence rather than configuration inspection.

## 2026-08-26 — Four no-ruling accessibility defects close (D1447 partial)

Keyboard activation now reaches requested square sight only when the board controller enters
`origin_selected`; moving the semantic cursor remains silent, preserving the assistance ceiling.
The phone companion's Support, Branches and Actions controls expose mutually exclusive
`aria-pressed` state, every pack action includes its authored title in its accessible name, and the
drill keyboard map uses the already-shipped height-bounded scrolling dialog pattern.

Focused component coverage proves the requested-sight transition, tab state and unique pack name.
A browser fixture at the supported 360×680 floor proves the keyboard map remains inside the
viewport with scrolling enabled. Work items A11-a1, A11-a2, A11-a10, A11-a13 and the duplicate
INR-a5 obligation are complete. D1447 remains open only for the separate owner choice to activate
or retire the currently inert `arrows` assistance ceiling.

## 2026-08-26 — Shell and mobile accessibility floors close

Five no-ruling client defects now have executable closure. The skip link targets a focusable
content boundary without nesting the route-owned `<main>` landmarks. A closed title map names all
fourteen route families and the live router updates `document.title`. Mobile status uses a clipped
live region rather than `display:none`; this re-derivation also corrects the dossier's stale site,
because play composition moved the active-run status from ShellFrame into DrillScreen. ShellFrame
now uses the same safe pattern for the non-run shell context.

Board appearance and text-move controls enforce the 24 CSS-pixel target floor. Assistance
checkboxes render in aligned rows rather than above their captions; D484 remains open only for the
larger presets/defaults/Advanced workflow. Component tests cover titles and skip targeting, while
the 390×844 browser matrix measures route-title transitions, visible-live-region semantics, touch
target boxes and checkbox layout. Work items A11-a3, A11-a4, A11-a6, A11-a8 and A11-a11 are
complete.

## 2026-08-26 — Opening compiler unit contract is decoupled from corpus scale (D1812)

The exact software gate exposed a compiler contract crossing Vitest's generic five-second budget
under parallel load. The test rebuilt all 3,810 pinned openings three times even though the
production artifact's population, bytes, loader and lookup performance are independently checked.

The compiler unit contract now uses five valid, distinct one-row TSV sources and a complete
five-file compiler closure. It retains every semantic assertion: enumeration-order invariance,
digest sensitivity to changed source meaning, malformed-row refusal, duplicate-endpoint refusal,
missing-source refusal and undeclared-compiler refusal. Its focused runtime is 11 ms; the
full-corpus build/check and isolated performance gates are unchanged.

## 2026-08-26 — Navigation and named-structure keyboard continuity closes

Three more no-ruling accessibility defects close. After the initial page load, asynchronous route
navigation focuses the new view's heading only after its data settles, so title and focus now move
together. The named-structure overlay is a labelled modal dialog: it focuses its heading, closes on
Escape and restores the exact timeline marker that opened it. Opening its evidence inspector remains
a forward transition and deliberately does not bounce focus back to the marker.

Visible shortcut badges remain available to sighted keyboard users, while Fork, Compare,
Replay/Pause, Export and Rewind now expose action-only accessible names. Focused component tests and
real browser journeys prove route-heading focus plus ShapePanel focus, Escape and restoration.
Work items A11-a5, A11-a7 and A11-a9 are complete; the shared trap/inert and shortcut-reachability
items remain separate and open.

## 2026-08-26 — Drill keyboard ownership becomes continuous (D1492 / A11-a12)

The shortcut break was one over-broad predicate: buttons, links, text entry and the board were all
treated as the same kind of target. The handler now preserves text editing and board-grid ownership,
and preserves native Space activation on buttons, links and summaries, while the non-conflicting
drill commands work from ordinary controls. Alt+C no longer has a second hidden focus guard. Escape
returns focus to the drill shortcut region, and the keyboard map states the boundary.

The shell no longer arms its `g` navigation chord inside the semantic board. Timeline arrows now
work while a ply is focused, move focus with the preview, and expose one roving ply stop rather than
one stop per move. Checkpoints no longer swallow Escape and state why the modal is deliberately not
dismissible. A new keyboard-owner unit fixture plus component and browser interaction tests cover
the boundaries. A11-a12 is complete; the separate shared focus-trap/inert obligation remains open.

## 2026-08-26 — Catalogue bypass, one keyboard map and shared hidden geometry close

Play now offers a focus-visible bypass that moves focus directly to the position catalogue. A real
Chromium check caught that fragment scrolling alone did not focus a `tabindex=-1` target, so the
link performs the promised focus transfer explicitly rather than relying on browser variance.

Shell and drill help now wrap one KeyboardGuide over one workspace/rehearsal shortcut registry;
either entry point exposes the complete map and the two copies cannot drift. Always-hidden and
responsive-hidden geometry moved into one imported accessibility stylesheet. A whole-client source
census rejects deprecated `clip: rect()` and any duplicate `clip-path: inset(50%)` implementation
outside that utility. A11-a14, A11-a15 and A11-a18 are complete.

## 2026-08-26 — One modal boundary closes the client-wide focus leak (D1492 / A11-a16)

Every `aria-modal=true` dialog now uses one action that makes all background branches inert and
owns circular Tab and Shift+Tab traversal. Claims are reference-counted, so an overlapping or
chained dialog cannot re-enable background content when the first boundary closes; pre-existing
inert state is restored exactly. Escape remains the owning workflow's decision rather than being
hidden inside the generic boundary.

A pure DOM contract proves both directions, restoration and overlapping claims. Mounted drill
fixtures prove ordinary controls sit below an inert ancestor while Shape and keyboard dialogs are
open. A real Chromium fixture at the supported phone floor proves the background is inert and the
single-focusable keyboard dialog wraps focus rather than leaking into the page. A11-a16 and D1492
are complete.

## 2026-08-26 — Accessibility automation gains a real device tier and finds D1813

The browser configuration now has explicit desktop Chromium and Pixel 7 projects. Project-level
grep keeps the full journey suite single-run while the mobile-labelled matrix uses the imported
device profile, including its mobile user agent, touch points and coarse pointer instead of a
desktop browser resized to phone width.

An axe-core WCAG A/AA gate scans the authenticated position catalogue, Settings and a live
rehearsal. Its first run found a serious keyboard defect: the long Objective `<h1>` owned its own
overflow while route focus made it programmatically-only. Scrolling moved to a labelled focusable
region and the heading remains the route-focus target. A11-a19 and D1813 close. A11-a30 narrows to
forced-colors/color-scheme emulation and broader live-region state coverage; the device, project,
Escape/modal, scanner and keyboard-unit arms now ship.

## 2026-08-26 — Board semantics survive system display preferences (D1494)

The theming acceptance contract now includes the signal it previously omitted: an occupied move
destination is the capture indicator, and its repaired 55% ring clears the same ΔE floor on every
shipped board square. The gate no longer treats hue separation as sufficient. Last move and check
carry inset geometry in ordinary rendering, while forced-colors mode projects destinations,
captures, premoves, history, selection and check onto distinct system-color outline geometries.

The global accessibility stylesheet now has meaningful color-scheme, reduced-motion,
increased-contrast and forced-colors branches. Themed hard-coded white declarations were replaced
with palette tokens and the source sweep learned to reject that missed named-color class. A real
Chromium journey starts from the device dark preference, selects an actual Chessground move,
activates forced colors and proves the destination/capture/check projections, then proves the CSS
motion floor. A11-a17 and A11-a20 through A11-a24 complete. D1460's policy question about an OS
motion override and D1461's broader token-driven interaction-paint defect remain open by name.

## 2026-08-26 — The real phone owns its target floor and companion boundary

The touch-target finding was stale in the favorable direction: Appearance and both text-move
controls already carried explicit 24px minimums, while the old guard still only regexed two
timeline rules. The Pixel 7 project now measures those three controls plus Sign out in rendered
CSS under real touch/coarse-pointer semantics. A11-a25 closes on behavior rather than another
source estimate.

The compact companion now becomes modal only while it is open at phone width. The shared boundary
is updateable, so the same DOM remains an ordinary landmark on tablet and desktop but owns dialog
semantics, focus, background inertness and circular Tab on a phone. Escape closes the drawer and
restores the exact region tab that opened it. Unit tests prove inactive→active→inactive ownership;
the Pixel 7 journey proves the composed behavior. A11-a28 closes. A11-a27 remains open because a
landscape iPad's smaller vertical dimension—not the rail subtraction alone—physically caps an
unoccluded square board; changing that composition requires a deliberate layout contract, not a
one-line breakpoint fiction.

## 2026-08-26 — Opening performance gate stops comparing query mixes (D1814)

Exact `make verify` caught the isolated opening lookup test failing its relative arm while the
product budget passed comfortably: 26.1 µs p95 against 50 µs. Inspection showed the supposed
population-scaling comparison ran a 100-query slice and the 6,991-query set against the same full
catalogue maps. Its 2× ratio measured which positions were queried and timer noise; it never varied
catalogue size. That false arm is removed. The unchanged contract still loads the complete artifact
under 250 ms and measures 55,928 lookup pairs across its 3,810 endpoints and 7,854 membership keys
under the unchanged 50 µs p95 ceiling in the isolated single-worker performance tier.

## 2026-08-26 — Live regions announce changed facts, not whole panels (D1815 / A11-a30)

The remaining accessibility-harness arm found a product defect while adding coverage: comparison
marked the complete multi-board grid as live, while rehearsal guides, guard cards and deletion
previews placed interactive or unchanged content inside live regions. A change could therefore
replay boards, buttons and whole panels instead of announcing the changed fact.

One atomic text-only `StatusAnnouncement` now owns compound announcements. Visible shell status,
guides, guard actions, deletion cards, Why context and comparison boards remain outside it; the
five simple inline regions are atomic `role=status` text containers. Component fixtures cover the
conditional guide, deletion and comparison shapes. The real browser matrix mutates the catalogue
count, loads an account-deletion preview, enters a rehearsal, scans every rendered live region for
atomic text-only semantics, and repeats the mobile path under the Pixel 7 device project. All nine
matrix cases pass. A11-a30 and D1815 close; owner screen-reader use remains the distinct A11-c1
release discharge rather than being inferred from DOM automation.

## 2026-08-26 — Phone comparison keeps both consequences without a horizontal hunt (D1816)

A real Pixel 7 run reproduced A11-a29's Compare failure at the product boundary: the two aligned
branch cards retained their 15-rem column floors, so the second consequence lived to the right of
the first. Compact Compare now stacks complete cards, evidence strips and results while preserving
the same aligned-ply selector and vertical reading order. The first geometry run still found nine
pixels of root overflow; its offender receipt isolated Chessground file-coordinate paint inside
the near-detail cards, so those cards own their paint and the Compare scroller is vertical-only.

The permanent mobile fixture creates, rewinds and branches an actual schema-example run, opens
Compare, and proves both cards stay inside the surface, the second follows the first vertically,
and Compare plus each aligned region has no hidden horizontal content. A second Pixel 7 route pass
proves Home, Play, Review, Learn, Live list, Create, Library and Settings own their main width and
do not clip controls outside a deliberately scrollable rail. A11-a29 remains open for conditional
live-session/overlay, Shape, Cohort, Group and qualitative per-surface work; its broad no-media-query
premise is now narrowed by rendered evidence rather than repeated from the dossier.

## 2026-08-26 — Phone live overlay contains the board's painted coordinates (D1817)

The next A11-a29 production-bundle journey entered a real academy session rather than inspecting
the empty Live route. Its studio already collapsed to one column with every control inside the
Pixel 7 viewport. The overlay also stacked the board before its copy card, but the scroll boundary
still owned six pixels of hidden horizontal content. An offender receipt identified only
Chessground's file-coordinate elements, whose glyphs paint outside the board box; a half-rem inset
reduced rather than removed the defect, while the final one-rem centred inset retains the labels
and removes the overflow.

The permanent fixture now proves the complete run-to-session-to-overlay path, including the
session controls, board and copy bounds, vertical reading order, and zero hidden horizontal
content. A separate real named-shape journey proves the dialog and every action fit at Pixel 7 and
that Escape closes it and restores the exact board marker. No Shape CSS changed: the earlier
absence of a dedicated media query was not itself a rendered defect. D1817 closes. A11-a29 remains
open for Cohort, Group, and qualitative per-surface findings.

## 2026-08-26 — Phone Cohort and Group stop hiding work sideways (D1818 / D1819 / TCH-a21)

The last two conditional A11-a29 geometry paths ran as complete Pixel 7 journeys. Cohort's
48-rem table reproduced the already-ledgered TCH-a21 sideways hunt. Phone width now renders the
same server-ordered entries as complete learner cards while desktop keeps the semantic table;
record, opponent-band, marks and rating fields stay together rather than being dropped for fit.

The Group journey found a more fundamental failure before it reached geometry. “Branch group”
opened from the modal Actions drawer, and the creator then instructed the learner to capture moves
on the board outside that drawer. The drawer correctly left the board inert, so the creator could
never collect two candidates and its submit stayed disabled. Opening this board-dependent tool now
closes the phone drawer. The fixture captures three legal candidates, crosses the resulting
checkpoint, opens Branches and proves complete candidate cards and controls stack vertically with
no panel or canvas overflow. D1818, D1819 and TCH-a21 close. A11-a29 remains open only for the
qualitative per-surface findings that geometry and reachability measurements cannot discharge.

## 2026-08-26 — Settings separates player choices from deployment diagnostics

The next support slice removes deployment internals from the Settings identity without hiding
them. The route is now titled Settings and has a sticky labelled index over Appearance, Playing,
Account and About. Provider identities, run-schema/policy facts and surface availability live in
About this deployment; the eight disabled external-voice controls all reference one visible
provider-off explanation there instead of repeating it inside every workflow fieldset.

The resolved theme now retains the device reduced-motion fact rather than only its derived `none`
animation value. Piece movement uses the ordinary honest-control boundary: when the OS override is
active, the ineffective select is disabled and the reason is visible. The production-bundle test
changes the media preference after selecting Fast and proves the live disclosure. The global
native-control reset also includes `select`, closing the long-standing font mismatch. SET-a6,
SET-a10 through SET-a13, and SET-a16 complete; presets and the primitive-heavy Playing surface
remain owned by their returned contracts rather than being improvised in this slice.

## 2026-08-26 — Theme-source closure removes the sweep's blind spots (D1433)

The settings audit's color findings were re-derived before editing. Four queued instances had
already moved in the favorable direction: checkbox labels are aligned rows, accent-backed text
uses `--on-accent`, focus and selection no longer mix toward hard white, and repertoire controls
no longer force white backgrounds. SET-a17 through SET-a20 close on current source evidence rather
than being misreported as work performed in this commit.

The remaining normal-mode leaks were live. Game Story and the board's semantic/text-input layers
used `Canvas` and `CanvasText`, so their colors followed the operating system instead of the
selected Tabiya palette. They now consume `--ink`, `--muted`, `--line`, and `--panel`; OS system
colors remain only in the forced-colors accessibility projection where they are the correct
authority.

The permanent sweep now scans CSS as well as Svelte, detects named and CSS system colors, and has
no component-by-name exemption. Legitimate literal authorities are enumerated instead of hiding
the whole theme directory. `interaction-paint.css` remains one explicit temporary authority owned
by D1461/SET-c1; this pass does not bypass its accepted-RFC requirement. Finally, the board-paint
contrast test derives Brown's dark square from the actual embedded SVG overlay and Olive's from
its declared gradient, eliminating the hand-entered `#c0ae91` shadow specification. SET-a21,
SET-a22, SET-a23, and D1433 close; D1461 remains open by name.

## 2026-08-26 — Native controls gain one product-wide visual authority

The shell contained 240 native-control occurrences and reconstructed their usable styling in
component scopes; its only global control rule was `font: inherit`. `theme/controls.css` now owns
the baseline once for text inputs, selects, textareas, action buttons, checkboxes and radios:
product tokens, minimum target height, borders, radii, placeholder color, focus, hover, disabled
and native accent behavior. Local component CSS remains responsible for layout and intentional
variants rather than being deleted in a risky mechanical sweep.

The former global font, focus and selection fragments were removed from `App.svelte`. A source
contract proves the shared layer is imported once at the application boundary and covers every
native family; a production-browser Settings fixture proves select, password and button share the
font and minimum-height floor, text controls share a ground, and checkboxes receive size and the
theme accent. SET-a15 and SET-a24 close.

## 2026-08-26 — Appearance previews the real composed chess surface (D1463)

Appearance previously changed five selectors without showing their combined result. It now pairs
scoped product chrome with the real Chessground component: the chosen palette visibly supplies
paper, panel, ink, muted, line, accent and on-accent, while the board uses typed local board/piece
overrides that do not mutate the document theme.

The preview position carries all six piece roles in both colors, a checked king, last-move paint,
preselected legal destinations and four shapes using the complete registered brush set. The
production-browser contract verifies the palette bytes, local board/piece attributes, all twelve
role/side combinations, check, history, destination and shape layers. The first rendered pass also
removed the board's redundant text-move disclosure from the miniature and tightened ambiguous
label queries instead of accepting a test that happened to find the first "Board". SET-a1 through
SET-a4, SET-a26 and D1463 close; the separate named-Looks decision remains open.

## 2026-08-26 — Settings first paint and palette disclosure become truthful

Two smaller audit findings close after the preview wave. The inherited-palette warning now sits
on the selected app-theme control and lists each measured pair and ratio; the detached page-level
details block is gone, so the warning cannot be mistaken for a general property of every theme.

Assistance Settings no longer initializes all eight workflows to silence and replaces them after
mount. Each profile loads its validated device-local preference into component state before the
first render. A no-tick component fixture seeds Just Play with evidence lighting and live markers
and proves both values exist on initial paint. SET-a5 and SET-a8 close; the raw workflow matrix and
permission-aware controls remain separately owned by SET-a14/SET-a7 and their active RFC work.

## 2026-08-26 — Compare separates learner meaning from evidence inspection

The play-composition implementation advanced without pretending the returned module registry was
ready. Compare now opens on the learner's recorded decisions: SAN, actor, intent, material,
position/path convergence and concise objective consequences. Raw objective-state tokens, engine
scores, detector-attributed structural rows, piece routes, source sentences and resistance records
move behind one explicit Evidence inspector. The underlying objective timelines still validate
their evidence references eagerly, so hiding raw records from the summary does not weaken the
grounding contract.

The inspector is modal, viewport-bounded and returns focus to its exact invoker. The component
suite pins the clean/inspector split and provider-withheld arm; the real content journey opens the
Najdorf comparison and inspects its records; the mobile matrix proves the inspector stays inside
the viewport. D910 remains implementing because module seats and the full 112-cell screenshot
matrix are still open.

## 2026-08-26 — Integration-strength tests receive explicit budgets

The full software gate exposed two semantic contracts that were incorrectly borrowing Vitest's
generic five-second unit timeout: the committed-draft boundary loads the complete real pack
registry, and the rated-result property creates and migrates 250 fresh SQLite stores while
exploring conflicting seal/void histories. Their populations and assertions remain unchanged;
the tests now declare 15-second and 20-second integration budgets. Performance remains governed
by the isolated performance tier, and neither retries nor reduced property coverage were added.
D1820 closes.

## 2026-08-26 — Graduation non-vacuity exception narrows to four entries

The already-landed graduation writer exempted four pack ids from its non-vacuity refusal so the
RFC's four measured stale Syzygy blockers could make their first transition. That was one identity
component short: a second `assessment_grounded` blocker in any exempt pack inherited the exception.
The exemption now names the exact four `packId/entryId` pairs. All four real positive arms remain
executable, while a same-pack second blocker raises `GRADUATION_CLEARANCE_VACUOUS` before the pack,
ledger, or transition receipt changes. D1821 closes; no schema or corpus byte moved under D560.

## 2026-08-26 — Real-content contracts receive an integration-tier ceiling

The required content tier produced five independent failures at Vitest's exact five-second unit
default only under the full parallel corpus population. Focused executions retained their semantic
results. `vitest.content.config.ts` now declares one 30-second deadlock ceiling for this integration
tier. No test population, assertion, worker count or retry changed, and product latency remains in
the separately isolated performance tier. D1822 closes pending the exact full-gate rerun.

The exact rerun completed green: 1,044 software contracts, one isolated performance contract and
171 real-content contracts, plus type, build and every repository-governance check. The content tier
completed its full 16-file population in 58.93 seconds without retries or reduced coverage.

## 2026-08-26 — Terminal evidence leaves the ordinary outcome dialog

The attempt-complete sheet rendered every engine/tablebase sentence directly beneath the learner's
outcome and authored commentary. That was `play-composition` L14's raw-evidence dump on one of the
highest-attention moments in the run. The sheet now keeps the outcome and next actions concise and
offers a deliberate “Inspect recorded evidence” action only when records exist. The exact records
render in the full Evidence Inspector; leaving it returns to the still-open terminal sheet. Focused
web contracts pass 39/39 and the production-browser terminal/review/share journey passes. D1823
closes; module selection and the complete composition matrix remain open.

## 2026-08-26 — Branch-runtime latency leaves the parallel software pool

The full gate found the server-bound latency contract still among generic software tests. Its
unchanged four event populations perform 552 loopback HTTP/SQLite operations and assert 100/200 ms
p95 envelopes; under 173-file contention one rewind p95 reached 106.4 ms while its median was
8.0 ms. The file now carries the repository's `-performance.test.ts` identity and is declared in
the single-worker performance tier. The population and thresholds are unchanged, the tier guard
reports two isolated performance files, and both contracts pass. D1824 closes.

## 2026-08-26 — Ordinary play translates evidence into learner vocabulary

The accepted play-composition vocabulary law now reaches Branches, branch groups, Support,
checkpoints and objective-change announcements. Raw objective/result enums, provider versions,
selector bookkeeping and phrases such as “policy distribution,” “diagnostic reading” and
“post-commit guard” no longer occupy the ordinary workflow. One shared vocabulary describes
objective progress, candidate source, requested/played resistance and the learner action.

The evidence was not discarded: Inspector's Attempt conditions section retains the detailed root
assessment, engine identity and per-ply resistance record. A production-browser Outcome Drill
journey proves both halves at the same checkpoint—provider identity is absent from its ordinary
dialog, then present after the deliberate Inspector action. D1825–D1827 close; module selection and
the complete play-composition matrix remain open.

## 2026-08-27 — Objective changes and run chrome stop exposing analysis plumbing

The next accepted play-composition slice closes five related vocabulary leaks. Objective-change
banners now render deterministic summaries by grounded evidence family instead of source labels,
detector prose or engine/tablebase transport strings; Inspector receives a dedicated Objective
change section carrying the exact original records. Matching authored/detected phases collapse to
one readable label, while a real mismatch names drill focus and current position separately.

Text move entry says chess notation while preserving both accepted input grammars. Compare calls
preview lines and synchronized positions what they are instead of exposing `simulated` and `ply`.
The bounded reveal is presented as temporary support and retains the same recorded disclosure and
next-move re-close behavior. Focused type/component checks pass 27/27; production-browser reveal,
objective-change, real-content compare, stable-board and mobile-composition journeys pass. D1828–D1832
close; module seating and the complete 112-image matrix remain open.

## 2026-08-27 — Successful play-composition evidence becomes a CI artifact

The accepted A8 contract could not be met by the shipped tooling: Playwright used only its list
reporter and browser CI uploaded report paths only on failure. The job now emits an HTML report and
uploads it plus raw test results on every outcome; scaffold verification pins both requirements.

The composition matrix now attaches six named post-gesture states at all seven required viewports:
calm rest, selected-square sight, assistance menu, long objective, Inspector and text/keyboard
entry. Every gesture preserves the exact calm board rectangle, producing 42/112 report cells.
Dynamic and module-dependent states remain open and are not represented by substitute fixtures.
The pass also exposed D1835: Chessground can visually clear a selected square while the Support
caption retains the prior selection, so selection clearing is the next state-2 repair. D1833 closes;
D1834 remains implementing.

## 2026-08-27 — Every currently reachable composition state has retained evidence

The matrix now executes real post-commit guard, terminal, promotion, rewind → fork → re-entry and
Compare paths at all seven viewports, taking successful coverage from 42 to 77 of 112 cells. These
are the eleven states the current application can honestly reach. The remaining five—move-staged
cue, expanded module, final guided hint, honest-empty module and max module load—depend exactly on
the returned learner-module/emission layer and remain uncounted.

The new state-11 path found two product-state failures. Selected-square Support outlived visible
Chessground deselection; Chessboard now reports the settled square or absence and commit/history
operations clear it. At 768×1024, the branch summary and Compare control intercepted visible branch
cards. The tablet band now separates identity, horizontally scrollable cards and actions into three
columns, and the test performs both pointer branch switches without force. D1835 and D1836 close;
D1834 remains implementing only on the five named module-dependent columns.

## 2026-08-27 — Compare now exits back into the complete rehearsal loop

Six queued core-loop items close together because their production boundary is one journey. The
fork dialog now asks what the learner is trying before an optional short name; absent names project
as the first played SAN move plus that intent. The Timeline derives both the parent continuation
and alternatives at the actual fork rather than trusting each branch's creation root. Catalogue
cards state a declared or derived consequence horizon before start and the run keeps it visible.
Compare can start the same fork position as a distinct run at a learner-selected human-like rung,
while preserving the compared attempts and keeping the applied rung visible.

The first browser execution caught a non-root identity error: the rail showed the alternative, but
Timeline grouped only branches whose own `forkNodeId` matched and therefore omitted the parent
continuation. A pure projection now constructs the complete fork group; its non-root unit fixture
and the full catalogue → run → rewind → intent fork → Timeline → Compare → new run browser journey
pass. CLP-a12/a13/a14/a15/a16/a18 and D1838 close. D1837 separately corrects IMP-a1/a2/a4 from
queued to RFC-blocked: a picker without durable selected-game and omission identity would lose its
truth on reload/export.

## 2026-08-27 — Opponent choice and resistance disclosure stop impersonating ratings

The current opponent surfaces now share one honest vocabulary. Just Play presents four explicit
human-model rungs and keeps the strong engine outside that ladder; every human-model surface says
the rung is not a FIDE, Lichess or Chess.com rating. Requested and applied resistance render in
packless play as well as authored drills, and the visible/announced run status retains the selected
rung. At the measured ≤10-piece boundary, Support discloses that changing the Maia rung has very
little effect because endgame choices converge.

Focused projection/component checks and a production browser journey cover explicit rung 1800,
packless Support, the exact shared disclaimer and the low-material limit. OPP-a1/a3/a6/a7/a8/a10
and D1839 close. Named personas, adaptive play, opponent cards and tournaments remain untouched
behind their returned contracts; this wave makes the current selector truthful rather than
pretending those later systems already exist.

The complete browser rerun also falsified an earlier selected-square fix: its first execution
passed and its unchanged second execution retained the caption. Recomputing the pointer coordinate
failed five of five, ruling out the initial test-layout hypothesis. Chessground's select callback
can precede its mouse-up clearing when pieces are draggable; Chessboard now publishes the settled
selection after its existing two layout frames and resets the shared input controller when empty.
The focused journey then passed five consecutive executions. D1840 closes as a product-state race,
not a retried-away CI flake.

Making resistance visible in packless play also brought an existing OutcomeContext contrast defect
into the live-rehearsal axe scan: 12.48 px muted text resolved to 4.47:1 against the mixed panel,
below WCAG AA's 4.5:1 floor. The context now uses the primary ink token without changing its panel
or hierarchy. D1841 closes on the automated matrix rather than exempting the new sentences.

## 2026-08-27 — Account exit exposes the interoperable artifact and its limits before action

The accepted portable-account journey now distinguishes its two exports at the point of use. The
account JSON is explicitly a Tabiya archive for safekeeping and inspection: Tabiya cannot import it
and other chess products do not read it. Account links to Library, where every visible game offers a
direct standard-PGN download without first opening the run; opening remains the path for selecting
particular branches.

Deletion also states its boundary before the learner asks for a destructive preview. Library names
shared read-only history and operator-backup retention beside per-run deletion; Account names
collaborator, publication and backup retention before account preview. The production browser
journey downloads a run PGN and the account archive, hard-deletes an owned run and observes its 404,
then deletes the account and proves the current browser's durable keys are gone. IMP-a18/a19/a22/a23
and D1842 close together because they are one honest account-exit path rather than four labels.

## 2026-08-27 — Academy proposals become a complete two-person gesture

The live studio no longer stops after a learner proposes a UCI move. It names the proposing handle,
and an open proposal gives the host explicit Play proposal and Decline actions. Playing acquires the
ordinary run lease before invoking the existing resolver, preserving possession rather than creating
a coach-only mutation bypass; the same action refreshes the session projection so the resolved state
is visible immediately.

A production browser journey creates separate host and participant accounts, grants the participant
through a session invitation, records their proposal, verifies the host sees the participant's handle,
and applies the move through the real route. TCH-a5 and the central-gesture half of D1480 close. D1480
remains open for the separate classroom identity residual: submission rows still omit learner, pack and
assignment identity; missing submissions remain invisible; learner assignment cards name no teacher.

## 2026-08-27 — Classroom work becomes a roster, not an anonymous inbox

The second professional-workflow slice closes the classroom half of D1480. Teacher cards now join
each assignment to every active learner and render factual act states — not submitted, submitted with
access, revoked or expired, and withdrawn — with the learner, pack title, assignment date, teacher
note and review link kept together. No evaluation, score or teacher-authored product verdict enters
the grid. The same cards label advisory due dates overdue without writing to the learner scheduler.

Learn now loads the pack catalogue on direct entry; this corrects the dossier's claim that packs were
already loaded on both assignment surfaces. Matching hosted runs are offered through one dated,
branch-counted selector instead of an unbounded row of bare buttons. Before mutation, a consent card
names the active teachers, the 90-day default, this-run-only scope and the recorded evidence/reveal
visibility. After submission, the service derives displayed teacher handles from current `runRole`,
so direct revoke, withdrawal or expiry cannot leave a stale watcher name. Revocation is explicitly a
future-read boundary, never an undo.

Focused server/component tests bind the joins and revocation case. A production three-account browser
journey creates a classroom, invites and accepts two learners, assigns a real pack, starts and shares one
learner's run, and verifies the teacher sees that learner as submitted and the other as not submitted.
TCH-a1/a2/a3/a12/a13/a14/a15/a16/a17/a18 complete; TCH-a33 remains open only for its multi-account
standing/read-symmetry arm, while classroom, assignment and academy browser coverage now exists.

## 2026-08-27 — Review absence gets a reason and the standing says what it is

The server now projects a closed `reviewRail` state beside the existing permission boolean. For a
spectator it distinguishes an incomplete attempt, an open live session, a direct share that was not
an assignment submission, and the fully open submitted-review case. The run surface renders those
facts as read-access boundaries; it no longer asks a teacher to infer policy from missing controls or
discover it through an `ASSISTANCE_WITHHELD` response. Service fixtures make each state reachable,
and component plus production-spectator journeys bind the client copy to the server state.

The classroom standing now explains self-publication before its first action and says that teachers
manage the window but never publish or appear. Event marks visibly name the beat-band event and date
instead of hiding the verb in a hover title, and an interval without a point estimate renders no
pseudo-rating. The existing three-account production journey now opens a standing, publishes one
learner, and proves the non-publishing learner can read that entry. This closes the missing browser
coverage without deciding whether that read symmetry is desirable; TCH-b2 remains the owner decision.

TCH-a20/a22/a24/a25/a26/a27/a33 complete. D1482 remains open for its separate read-symmetry ruling
and the persisted abandonment-toggle amendment; neither was smuggled into this defect pass.

## 2026-08-27 — The simul wall gains facts without a coach verdict

The session summary now carries the active node's `objectiveState` beside its existing board facts.
Wall cards render the seated handle whose turn it is, the pause timestamp, last committed move time
or an honest none state, the objective state, lease holder and ply count. The source order remains
unchanged. No evaluation, “struggling” label or inferred urgency is computed, and the surface says
that boundary explicitly.

The server route fixture binds objective and activity bytes; a component fixture exercises a paused
match with named seats; and the production academy journey returns through `/live` and observes the
empty-move, side-to-move and objective states before reopening its overlay. TCH-a4/a7/a8/a9 close.
D1479 remains open only for the owner choice to adopt elapsed-time ordering and the broader doctrine;
this pass does not make that product decision through a sort function.

## 2026-08-27 — A classroom session keeps its classroom identity

The live-session read model now joins its persisted `classroomId` to the classroom's current name
for both the session wall and the opened studio. The projection is membership-scoped: an active
teacher or learner sees the classroom identity, while an outside spectator who can read the run
receives no classroom name. The client renders the joined name rather than asking it to infer or
cache classroom identity from a separately loaded list.

The server fixture exercises teacher, learner and outside-spectator reads through both `/sessions`
and `/sessions/:id`; component fixtures bind the name on the wall and in the studio. TCH-a10 is
complete.

The adjacent studio identity gap closes in the same surface without inventing a teacher-only tool:
raw kind/control tokens become player-facing names, and each live kind explains its actual workflow.
Academy in particular names board handoff, attributed proposals and marks, and the preserved
rewind/branch/compare/return loop already available through the shared board. Component and
production-browser assertions keep that explanation attached to the academy route. TCH-a11 is
complete.

## 2026-08-27 — Board reclaim becomes a deliberate coach interrupt

The live studio now exposes the already-shipped host reclaim operation without turning it into the
cheapest way to coach. While a learner holds the board, the host first sees the factual cost and a
two-step confirmation naming that learner: reclaim ends their active learning turn, but their line
stays in the branch rail and nothing is deleted. A vote or proposal remains the named lower-cost
nudge. Cancel performs no request; confirm creates the host's device writer, invokes the existing
atomic reclaim and refreshes both possession and its journal.

The focused component fixture proves the first click and cancellation are inert before the exact
`reclaim` call. The production two-account journey exercises the full possession protocol: host
offer, participant navigation, explicit participant device claim, learner-specific confirmation,
host reclaim, and the existing proposal flow afterwards. TCH-a28 is complete.

## 2026-08-27 — Classroom consent precedes creation and acceptance

The classroom section now explains its consent model before presenting the Create control:
teachers may assign packs and schedule sessions, but membership alone never grants run access.
Pending invitation cards resolve the inviting classroom member's handle and invitation time, then
state what the learner or teacher role authorises and what it does not before Accept or Decline.
After acceptance, the invitation-only projection disappears rather than becoming permanent roster
metadata on the list surface.

The authenticated route fixture proves the invited learner receives the named inviter and that an
active member no longer receives invitation data. A component fixture binds explanation, identity,
permissions and refusal copy; the production two-learner classroom journey observes those facts
before either learner accepts. TCH-a29 is complete.

## 2026-08-27 — The compact watcher disclosure is bound to live grants

TCH-a31's source finding became stale when TCH-a3 added `grantedTeacherHandles`: the archived
teacher-surface contract routes the compact answer to the `/learn` submitted-run card, and that
card now names every teacher whose current run grant resolves. The remaining obligation was proof,
not another surface. The production classroom journey now shrinks the learner to 390 pixels after
sharing, verifies the named watcher remains visible inside the viewport, and retains the existing
revocation path. No fourth compact run tab was introduced. TCH-a31 is complete.

## 2026-08-27 — Assignment hand-in joins the outcome ritual

A completed run now loads the learner's assignment context directly and offers each matching open
assignment inside the terminal sheet. The offer names the classroom, assigning teacher and literal
teacher note. Review sharing opens in the same modal rather than behind it and repeats the current
teacher recipients, 90-day window, recorded moves plus opened evidence/reveals, one-run boundary,
and non-retroactive revocation. Confirmation invokes the existing submission operation; no second
consent model or run grant path was added.

A focused terminal-sheet fixture proves review and cancellation are inert before confirmation. The
production two-account journey creates the classroom and assignment, completes the assigned terminal
pack, shares from the outcome sheet and observes the named submission in the teacher roster. TCH-a19
is complete.

## 2026-08-27 — The classroom competitor record gains a real desk baseline

The empty classroom shelf now has a six-product primary-source teardown. The old single category
split into four: synchronous teaching rooms (Chess.com/ChessKid), managed learner administration
(Lichess/ChessKid), curriculum diagnostics (Chessity), and academy operating systems
(Chess.Run/ChessPlay). Tabiya's consent-bounded submission of one preserved attempt is a fifth job
none of those sources claims; E1 remains intact at source-absence level.

The pass does **not** discharge the hands-on claim. No competitor was driven, and the advertised
browser skill was unavailable on disk, so current step count, geometry, friction and reliability
remain open under [[D1458]]. TCH-a32 stays queued with an exact two-account protocol instead of
being closed by vendor pages. [[D1483]] is narrowed from empty coverage to that residual.

Two owner-scope questions surfaced and are ledgered rather than smuggled into implementation:
[[D1844]] asks whether 1.0 serves institution-managed minors and therefore owes custodian/recovery/
release/audit/safeguarding authority; [[D1845]] asks whether “one FOSS platform” includes academy
billing/payroll/white-label CRM or ends at the complete rehearsal classroom. R58–R64 preserve the
source boundary and love/hate searches.

## 2026-08-27 — F12-C becomes a buildable storage-recovery contract

O13's ruled appliance floor and R18's D608 finding now have an active RFC rather than a roadmap
sentence. `rfc/storage-backup-recovery.md` specifies a closed, verified backup bundle; SQLite online
backup over a stopped HTTP service; independent integrity and foreign-key checks; read-only refusal
before touching future/unsupported storage; automatic pre-upgrade snapshots; staged migrations and
restores; destructive replacement confirmation; explicit compatibility; and production-image,
Compose, Make and multi-architecture recovery drills.

The draft refuses two tempting checkbox implementations: copying only the live database while WAL
may hold committed bytes, and calling an old image a rollback plan after a forward-only migration.
The last-known-good path is the verified pre-upgrade database plus the image declared compatible
with it. Its two operator defaults are explicit rather than left for implementation: maintenance is
a separate Compose overlay requiring an absolute backup directory, and the immutable full source
SHA is the recovery revision identity. No product byte lands before owner acceptance; independent
buildability review remains.

## 2026-08-27 — F12-A defines three safe network postures and closes over the Node adapter

`rfc/safe-deployment-profiles.md` turns the release audit's contradictory Compose defaults into
three explicit, non-composable workflows: zero-configuration loopback HTTP for one host, an
internal-CA HTTPS appliance for LAN devices, and publicly trusted/file-certificate HTTPS for a
hosted installation. The two HTTPS profiles place a pinned FOSS Caddy edge in front of an
unpublished application socket; exact public origin, Host/forwarded-header trust, secure host-only
cookies, CSP, secrets, readiness and failure behavior are one contract rather than environment
folklore.

The source audit widened F12-A by two defects before drafting. The Node adapter buffers every
request without a byte limit ([[D1846]]) and converts every response stream into one complete
`ArrayBuffer` ([[D1847]]). The RFC therefore assigns every route an ingress budget and requires
backpressured/cancellable response streaming through the real rendered proxy. Proxy-only limits and
header-presence tests cannot close either defect. The draft is registered and roadmap-owned; no
product byte lands before independent buildability review and owner acceptance.

## 2026-08-27 — F12-D joins live provider truth to the implemented evidence manifest

The F1 drafting hold in the release work order was stale: `evidence-contract-manifest` is
implemented and archived. `rfc/provider-health-degradation.md` now specifies the missing operational
half without creating a second evidence registry. One six-provider runtime authority consumes UCI
handshakes and real HTTP/request outcomes; F1's four provider-backed producers derive availability
from that snapshot, while external voice and TTS remain renderer dependencies rather than chess
evidence.

The source pass widened D609 by one concrete cache defect ([[D1848]]). `OpponentSelector` retains an
unbounded process-lifetime promise map, omits engine/model generation from the key, and returns
cached and live selections in the same shape. The RFC makes cache-only service exact-request scoped,
bounds and generation-keys provider caches, and requires acquisition receipts. Cache hits never
heal provider health.

The deadline and degradation rules close the user-facing failure, not just `/capabilities`: Maia's
60-second wait is removed; queue, retry and provider work share one compiled F1 consumer budget;
provider loss pauses before an opponent move and offers retry/change rather than silently switching
to Stockfish or a random move; no-data/out-of-domain, provider-off and exact-cache states remain
distinct. Lichess 429 handling follows its published one-at-a-time/full-minute rule. The draft is
registered and roadmap-owned; independent buildability review and owner acceptance precede product
implementation.

## 2026-08-27 — F12-E splits distribution truth from the blocked content-bundle join

The release child was “partly blocked” because it combined two unlike dependencies. E1 can be
specified now: immutable image/workflow inputs, a FOSS CPU Maia image, resource envelopes,
SBOM/notices/corresponding source, signatures/attestations and native amd64/arm64 proof. E2 still
depends on F3/F4 to decide the final rights-cleared runtime content bundle. The split prevents one
future chess-content join from holding every release-supply-chain repair hostage.

`rfc/verifiable-runtime-distribution.md` gives E1 a closed release set and three honest tiers. Core
must fit a 512 MiB hard / 384 MiB peak envelope; CPU must fit 2 GiB hard / 1,843 MiB peak; all server
caches compose inside 96 MiB retained JS heap, finally supplying [[D1580]] with a falsifiable release
predicate. Accelerated packaging is optional and, if published, names its exact hardware/runtime/
licence/resource matrix; it can never enter the default CPU layers or support an unqualified
all-FOSS claim.

The source audit added two defects before drafting. Both Dockerfiles resolve mutable bases or
dependency repositories despite their final output digest ([[D1849]]), and write-capable GitHub
Actions use movable major tags even though GitHub identifies full commit SHAs as the sole immutable
reference ([[D1850]]). E1 freezes those materials, generates per-platform SPDX inventories from
the pushed digests, signs image indexes, attests image/SBOM/release subjects, and verifies the set in
a clean job before publication.

The present Maia weight basis remains deliberately red. The pinned model card labels its paper and
then points elsewhere for code/weights; the RFC refuses to infer a licence for the exact weight
bytes. D1 requires an explicit upstream statement or model replacement/removal before the required
CPU tier can ship. E1 uses a loader-traced temporary content allow-list and excludes jobs,
candidates, sidecars, planning prose and local paths; E2 must later replace it with F3/F4's compiled
bundle. Independent buildability review and owner acceptance remain before implementation.

## 2026-08-27 — Convention provenance becomes a first-class evidence contract

D1722's completed research is now a draft implementation contract rather than an author handoff.
`rfc/semantic-convention-provenance.md` separates a fact's primary grounding from the exact
definition, threshold or observed-window convention that made it true; compiles direct and
path-specific transitive convention closure; seals that closure through deterministic and external
voice rendering; and keeps raw ids in Advanced while ordinary modules get optional “How this was
detected” disclosure.

The draft is total over the measured migration population: 42 projections currently labelled
`declared_convention` plus the 18 other-grounding dependencies found by the executable D1722
census. It explicitly refuses same-version meaning rewrites and treats opposition v1/v2 as the
permanent negative control. No production, content or schema byte moved.

One process dependency is stated rather than bypassed: conventions are a seventh shared resource,
but the implemented claim grammar knows six. The RFC therefore claims `none` while draft and may
not be accepted until the register/checker and its claim block carry the exact reviewed initial
member set. This prevents the convention registry from becoming another unregistered private list.

## 2026-08-27 — D1722 publishes the exact initial convention membership

The disposable D1722 harness now pins the registry seed at 39 members: 23 identities already in
production and 16 identities assigned to existing unversioned meanings. It rejects the tempting
regex shortcut by explicitly excluding proof-serialization and reducer-version tokens, binds each
assigned identity to live projection witnesses, and keeps grade context as an operand of
`grade-convention@1` rather than an invalid pseudo-version.

The pass also found [[D1851]]: D667 made Story titles learner-relative, but the compiled projection
still declares White-relative result verbs. The defect is ledgered and the RFC refuses to freeze
that stale sentence into `story-title@1`. The exact-member acceptance obligation is discharged;
the remaining process dependency is extending the shared-resource grammar/checker and replacing
the draft's `none` claim before independent acceptance.

## 2026-08-27 — The convention register gets its own process boundary

`rfc/semantic-convention-register.md` now owns the last pre-acceptance dependency for D1722. It
adds a distinct sorted `id@version` claim grammar, collision identity per member, set equality to
the executable 39-member census and a narrowly bounded pre-landing state: the runtime source may be
absent only while the landed set is empty and a valid live claim exists. That lets governance land
before product code without weakening the no-implementation-before-accepted-RFC law.

The process RFC depends on `assistance-config-register` for C9 and therefore owns C10 rather than
creating a numbering collision. It changes no runtime, evidence, schema, storage, content, web or
archive bytes. [[D1852]] records the missing register as a separate process defect; independent
review is the next action.

## 2026-08-27 — D1851 Story-title authority reconciled

The one production defect found by the convention census is closed under the already-implemented
F1/D667 contract. `derived.story.title@1` no longer tells renderers/reviewers that imported-result
verbs are White-relative while `suggestTitle` computes them from the learner's side. The regression
checks both sides of the same `1-0` result and pins the compiled manifest wording to
learner-relative. No title behavior changed; the authority now describes the shipped behavior.

## 2026-08-27 — CI time bomb reproduced and closed

The full software tier, run before the Story-authority checkpoint, failed the live-session public
join contract locally exactly as CI would: expected 200, received 404. The fixture fixed
`LiveSessionService` at 2026-08-13 but left `SQLiteRunStorage` on wall time; its default 14-day link
therefore crossed expiry on 2026-08-27. [[D1853]] binds both components to one injected clock. The
repair changes no production expiry rule and keeps the public page, wrong-redeemer, one-use and
exhaustion assertions intact.

## 2026-08-27 — shared provider/execution RFC drafted

Converted the measured D1652–D1658 and D1699–D1709 author-repair handoffs into
`rfc/provider-exchange-and-execution.md`. The draft keeps F1 execution paths, reported-confidence
inheritance, Stockfish/Maia/Syzygy/Explorer receipts and one bounded scheduler in a shared
foundation while refusing private collector adapters or learner-facing semantics. It is not
accepted and no product implementation is authorised until an independent buildability review
rechecks the literal operations and able-to-fail fixtures against HEAD. Next: run governance, then
route the draft for independent review while continuing only already-accepted foundation work.

## 2026-08-27 — learner-module registry return repaired for repeat review

Applied the D1585–D1591 and D1689–D1694 executable closures to
`rfc/module-registration.md`: branched answer capabilities, move-free Explorer theory input,
authority-preserving reducer resealing, a closed module query operation, one five-mode staged-move
handshake, exact sight/novelty closures and post-commit node ordering. The repair also found and
recorded D1854/D1855 before implementation: F1 eligibility is semantic-event-only, and one F1
selection policy cannot own ten consumers. The amended contract leaves research eligibility and
selection byte-identical; module declarations, consumers and adapters own admission, while the
existing reducer algorithm becomes a typed module-local policy. Next: governance verification and
repeat independent buildability review; no module implementation is authorised before acceptance.

## 2026-08-27 — evidence-presentation return repaired from the executable seal harness

Amended `rfc/evidence-presentation.md` on D1664–D1673. The contract now follows the tested
F1-admission → exact projection/consumer adapter → owner-bound process seal → closed digest wire →
strict client parser/new seal path, with family-specific retained-operand negatives instead of
treating manifest strings as types. Convention metadata derives from same-exchange provider or
registered semantic receipts; citation content is bound; enum state is vocabulary-coupled;
abstention has a request lifecycle; structured documents are schema-coupled read-only viewers;
coverage is split across ordinary learner, Inspector and author/operator binding populations; and
chart scale is registered rather than caller-controlled. D1856/D1857 record two draft defects
closed in the pass. The RFC remains unaccepted and splits landing into a real current-consumer
checkpoint followed by module/hint/arrow composition; neither empty coverage nor plain-JSON
compatibility can satisfy it. Re-derived the live manifest at 37/193/25/210 and `make schema-check`
green. Next: repeat independent buildability review while work continues on other lawful 1.0 nodes.

## 2026-08-27 — Guided Hint technical return repaired; owner ceiling table isolated

Amended `rfc/hint-distance.md` on D1638/D1640–D1643. The operator horizon now accepts and retains
the actual sealed Stockfish root table, selected PV row, candidate-packet views and source
occurrence instead of trusting digest strings. One literal seven-family declaration matrix owns
the mixed F1 derivations and refuses pattern/ranking/evaluation/PV widening. Optional voice
failure preserves the deterministic available hint while search absence is a separate typed
state. Existing run bytes now derive one event-head/cursor/disclosure-boundary stamp for
idempotent POST/poll/cancel/restart and stale-result refusal; no fictional run revision or
committed-move counter is introduced.

The cross-document pass found [[D1858]] (module query invented that same run revision) and
[[D1859]] (the nominally branched `move` capability also granted ranked moves); both RFC contracts
are corrected before implementation. [[D1639]] is deliberately not guessed: the document now
contains a concrete proposed five-preset/eight-context/role table and an able-to-fail criterion,
but remains draft until the owner confirms or changes those product values. Next: governance and
roadmap receipts, then continue repairing the shared candidate-packet prerequisite while the owner
ceiling ruling remains isolated.

## 2026-08-27 — shared candidate-packet return repaired across bots, hints and Review

Amended `rfc/shared-candidate-evidence-packet.md` on D1631–D1636. The factual population remains
complete in insufficient-material, fifty-move and repetition states; only checkmate/stalemate own
zero rows. Packet, provider and final-policy caches now carry separate complete identities, keeping
Maia history/model/generation above the provider-free packet. The implementation surface names the
actual semantic-selection and candidate-feature operations, `OpponentSelector` consumption,
application injection, cancellation and the bounded final cache rather than stopping at manifest
anchors.

The F1 tuple now compiles three scope-discriminated `anyOf` members over one legal-move authority,
the complete event closure and the complete 20+2 reading closure; legal exchange and fork survival
cannot disappear during migration. The engine seam retains reusable White-perspective evidence and
derives explicit root-side cp/mate comparison and loss, including Black roots and mixed-domain
abstention. The pass found [[D1860]]: that node-free Stockfish source was outside the newer shared
provider catalogue, so `provider-exchange-and-execution` now owns it as its fifth typed operation
on the same scheduler/receipt. Both RFCs remain draft pending repeat independent review. Next:
verify governance/roadmap receipts, checkpoint these amendments, then continue the next lawful 1.0
dependency without waiting on the separate Guided Hint owner table.

## 2026-08-27 — bounded-target return split into three buildable 1.0 layers

Applied `planning/bounded-policy-targets/author-repair-2026-08-26.md` without partially accepting the
returned monolith. `rfc/bounded-policy-targets.md` now owns only one synchronous derivation operation
and three literal local projections over retained threat, legal-exchange and exact-legal-move items.
It cannot recompute the source predicates, accept a caller child-FEN, collapse the two bounded
quantifiers or turn a partial traversal into a false negative.

The shared provider draft retains generic node-free Stockfish/Maia receipts, same-exchange identity
and the bounded scheduler. New `rfc/bounded-target-policy-composition.md` owns only the two reported
joins: a depth-stable Stockfish category and one-band Maia bounds with mass/denominator refusal.
[[D1861]] records the split as a landing boundary rather than a scope cut: all three layers remain
required for 1.0, and no Support, Review, pack, bot or longitudinal binding lands from these drafts.
Next: run governance/receipt checks, checkpoint the author work, then route all three documents for
independent review while continuing accepted implementation work.

## 2026-08-27 — evidence-presentation repeat review returns the current-population join

Repeat-reviewed `rfc/evidence-presentation.md` against the live compiled manifest and the D1673
seal harness. Six original repairs hold, but acceptance remains blocked. The manifest has 210
bindings and 117 non-machine consumer/projection pairs across 20 consumers; only the authored-claim
pair has an executable component mapping, so the proposed coverage command would check a product
mapping the RFC never specifies. [[D1862]] requires a set-equal mapping or bounded set-equal
consumer-family splits rather than 116 implementer choices.

The [[D1668]] lifecycle repair also still permits `pending` combined with any terminal absence and
reintroduces a nonexistent node revision instead of the shared event-head/cursor/disclosure stamp.
[[D1672]] remains open because checkpoint A itself adds the component layer while its owner-only
design amendment is still blank. Exact return:
`planning/platform-alignment/evidence-presentation/repeat-buildability-review-2026-08-27.md`.
Next: run governance, checkpoint the return, and continue another lawful 1.0 dependency while the
author/owner discharges these three boundaries.

## 2026-08-27 — module-registration repeat review reaches the missing production join

Repeat-reviewed `rfc/module-registration.md` after the D1585–D1591, D1689–D1694 and
D1854/D1855/D1858/D1859 amendment. All 25 disposable repair arms pass: eight semantic closure,
nine route/staging feasibility and eight novelty-identity tests. The original returns are
substantively repaired.

The production trace returns the RFC again on [[D1863]]–[[D1869]]. The server forbids the
browser-local preset/config it cannot derive; §2.5 still invokes the projection-only string
renderer that the component contract deletes; `declaredEvidence` has no timing-complete assembly
operation; pre/at-commit threat and prevention delivery have no logged boundary despite the RFC's
`none` claim; the legacy `assistance.arrows` consumer has no non-bypassing binding purpose; the
eleven new capability sets are unstated; and semantic request fields remain raw strings without
authoritative membership checks. Dependencies on the returned preset/presentation/hint/provider
contracts remain real, not availability arms.

Exact return: `planning/learner-modules/repeat-buildability-review-2026-08-27.md`. The remaining
owner choice is narrow: whether the outpost ruling also returns `pawn_safe_square` to requested
Sight. Next: update the RFC register/roadmap receipt, verify governance, checkpoint the return and
continue another foundation dependency without implementing around it.

## 2026-08-27 — module evidence assembly measured; semantic tactics consumer gap found

- Expanded the nine non-empty, non-Guided-Hint learner modules into all 186 declared
  consumer/projection pairs in `tools/d1865-evidence-assembly-harness/`; 5/5 arms pass on Node 24.
- Measured 184 pairs resolving at HEAD and two explicit absent dependencies. Guided Hint still has
  no disclosure projection until its measured family×rung registry exists.
- Verified the live guidance packet is only a partial assembler: it does not execute edge
  semantics, candidate/provider operations, compare/story derivations or the future hint compiler.
- Landed `design/research/module-evidence-assembly.md` with a timing-specific, deduplicated
  producer-execution shape and able-to-fail closure for the RFC amendment.
- Found [[D1870]]: the registered observed semantic tactics (deflection, attraction, both clearance
  forms, interference, zwischenzug and overload exploitation) are absent from every learner-module
  acceptance set. This joins [[D1067]]'s missing path compiler to an equally missing consumer.
- Next: author must repair module registration around [[D1863]]–[[D1870]] and the accepted
  provider/path dependencies; no module UI implementation is honest before this join closes.

## 2026-08-27 — recorded semantic path compiler gets an RFC owner

- Drafted `rfc/recorded-semantic-path.md` from the completed D1067/D1068 source audit, D1710
  execution census and D1865 module-assembly census.
- The contract covers the eleven existing multi-edge projection ids through thirteen exact
  2/3/4/5-edge evaluator rows. It derives anchors only from `branchPath`, constructs exact sealed
  move/event inputs, evaluates every start/family window and distinguishes emitted, evaluated
  no-witness, insufficient continuation and whole-path refusal.
- The draft explicitly handles fork ancestry, deterministic dedup/digest, shared one-edge work and
  an authenticated server operation. It adds no detector, storage, schema, prose or UI.
- D1068 remains a hard boundary: a Stockfish PV cannot mint recorded-run identities. Hypothetical
  hint horizons require separately registered provider-derived evidence.
- Completion is able to fail: compiler code alone enters `awaiting`; the RFC cannot become
  implemented until deleting a real Review/module/longitudinal consumer call fails a production
  fixture. D1870 continues to own learner admission/presentation.
- Next: independent buildability review before acceptance; no implementation is authorized from
  the first draft.

## 2026-08-27 — provider exchange RFC returned on eight buildability blockers

- Independently reviewed the full provider-exchange RFC, its four exploration dossiers and the
  production F1, capability, engine, Maia, Explorer and Syzygy boundaries.
- Preserved the shared-provider direction: compiled execution paths, one bounded scheduler,
  same-exchange receipts, node-free Stockfish evaluation and source-truth-first Explorer parsing
  remain the correct foundation for Support, Review, bots and drills.
- Returned implementation on [[D1871]]–[[D1878]]: the global capability route cannot express
  request-bound cached satisfaction; cache provenance contradicts receipt retention; Maia
  occurrence drops history; legal-root MultiPV conflicts with a live refusal and omits bounded
  score negatives; Explorer lacks a literal payload; source-absence aggregation is undefined; the
  scheduler's request/result types do not exist; and actual engine generation is required before
  the exchange that discovers it.
- Exact return:
  `planning/provider-exchange-and-execution/independent-buildability-review-2026-08-27.md`.
- Next: author amendment in the review's dependency order, then repeat independent review. No
  provider foundation implementation is authorised from the current draft.

## 2026-08-27 — theory↔drill current joins returned on nine buildability blockers

- Independently reviewed the full theory↔drill RFC against the implemented opening catalogue,
  pack/principle types, Learn recommendation projection, REST/client routes and durable derivation
  storage/export boundaries.
- Preserved the exact applicability direction, `present`-only targeting, all-target reachability,
  server-atomic launch and the refusal to invent an evidence `link` rendering.
- Returned implementation on [[D1879]]–[[D1887]]: the opening reference type is undefined; the
  type-level law-8 seal contradicts required payloads; the principle union cannot express two
  acceptance fixtures; client input can forge provenance; Library has no durable source; the
  launch has no wire contract; derivation validity is not structural; Learn drops its firing
  anchor; and progression effects are unruled.
- Re-derived a stale dependency in the process: runtime opening identity is implemented now, so
  its applicability and Review criteria must execute rather than remain deferred/red.
- Exact return:
  `planning/platform-alignment/theory-drill/independent-buildability-review-2026-08-27.md`.
- Next: author amendment in the review's dependency order, one owner/product ruling for [[D1887]]
  unless living intent already settles it, then repeat independent buildability review.

## 2026-08-27 — theory knowledge pipeline returned on eleven buildability blockers

- Independently reviewed the complete offline theory-builder RFC against the live evidence
  compiler/collectors, sourcing client and licence checker, voice boundary, ignored source store,
  release topology and the official CC/SPDX/SQLite contracts.
- Preserved the measured direction: a separate allow-listed offline compiler, exact applicability
  before lexical selection, one immutable local artifact, honest-empty absence, no vector service
  and no request-time scraping.
- Returned implementation on [[D1888]]–[[D1898]]: the passage type loses applicability origin;
  manifest metadata is mistaken for an executor and FEN cannot ground event/path motifs; multi-key
  set algebra is undefined; timestamps make bundle identity nondeterministic; clean checkouts lack
  citation proof bytes; a quotation string cannot seal attribution; licence and source lifecycle
  rules are incomplete; the fetch contract leaves rebinding/redirect authority open; raw FTS input
  and order are undefined; and principle citations do not join to complete attribution.
- Refreshed one stale dependency: runtime opening identity and both catalogue projections now ship,
  so those ground paths must execute rather than remain `key_ground_missing` by default.
- Exact return:
  `planning/platform-alignment/knowledge-retrieval/independent-buildability-review-2026-08-27.md`.
- Next: author amendment in the review's dependency order, O5 product-direction ruling and F3
  dependency discharge, then repeat independent buildability review.

## 2026-08-27 — evidence-move selector returned; projection census frozen

- Reconciled the active selector RFC with the complete D1162→D1297→D1312→D1328/D1329 evidence
  chain. The RFC and register had stopped at the first pass even though both the proper standalone
  head and its fixed-guard composition were later refused by their preregistered gates.
- Returned implementation on [[D1899]]. Legal-set coverage, fitted-not-authored provenance and the
  shared candidate evidence plane survive; the diagonal/conditional-logit implementation body does
  not. The owner-funded non-Maia goal remains open under [[D1320]], not silently killed by research.
- Froze D1329's projection/cost arm before reading it: five hash-selected positions in each of 36
  cells, exact legal closure, genuine Stockfish-18 depth-2 root scores, separate engine/projection
  timing, conservative whole-operation success, aggregate-only output and 8/16/32-field compact
  cardinality budgets. No model is fitted and the reserved third population remains unread.
- Next: implement and run the disposable projection instrument, report its cost without inventing
  an owner budget, then present the priced set-dependent-programme disposition.

## 2026-08-27 — D1329 projection gate failed before model work

- Ran the frozen 36-cell projection/cost arm over the pinned June-2026 CC0 prefix: five
  minimum-hash positions per rating × speed × ply-window cell, 180 positions and 5,664 exact legal
  candidates. Selection did not read the played move; committed results retain aggregates only.
- Corrected the instrument before accepting its verdict: the first receipt divided successful
  positions by sampled positions, while the preregistered gate names sampled legal candidates.
  V2 counts every legal candidate in an all-or-nothing failed root and writes the failed receipt
  before checking verdict consistency. The threshold and fixed sample did not change.
- The candidate-weighted result is **5,347/5,664 = 94.403%**, failing the frozen ≥99% projection
  gate. All 317 failed candidates belong to 11 roots containing a Stockfish mate score; the shipped
  candidate adapter accepts finite centipawns only. This is D195/D1636 measured at population
  scale, not a semantic-collector failure, and no mate-to-cp conversion was invented.
- Generic evidence flattening over the 169 completed positions produced 2,370 names / 3,376,630
  non-zero scalars / 249,314,807 encoded bytes and took 101.474 seconds versus 1.463 seconds for
  the fixed depth-2 engine roots. Linear planning cost at 1m decisions is 166.788 projection hours
  and 1,373.920 GiB; a cardinality-only 16-field cap remains 1,027.276 GiB.
- No model was fitted, no owner budget was invented or requested, and the reserved D1297
  confirmation population remains unread. Next: land typed cp/mate candidate scores and a
  registered projection-balanced compact model view, then rerun this exact census before any
  learning curve.

## 2026-08-27 — shared candidate packet returned on runtime admission and execution

- Repeated the independent buildability review after the [[D1631]]–[[D1636]] amendment. The
  focused harness passes 10/10: terminal/adjudication separation, three cache identities, the
  47-event/22-reading closure and White-to-root score algebra survive, and the literal amended
  scope-wide F1 tuple now compiles. The original D1634 static blocker is closed rather than carried.
- Returned the RFC on four narrower blockers. The factual cache returns a consumer-specific view
  without a defined consumer/request ([[D1900]]); general declared evidence cannot witness the
  scope-specific runtime derivation member criterion 22 claims ([[D1901]]); the “real” bot path is
  reachable only through a test-created profile while the production catalogue is empty
  ([[D1902]]); and per-candidate child evaluation replaces D969/D1329's measured one-root operation
  without a whole-set execution budget ([[D1903]]).
- The shared provider dependency also remains returned on [[D1871]]–[[D1878]], including undefined
  scheduler request/result types and impossible requested-versus-actual generation identity. No new
  row duplicates those findings.
- Exact return:
  `planning/evidence-foundation-ux/shared-candidate-packet-repeat-review-2026-08-27.md`.
- Next: repair the packet admission boundary and narrow first landing, reconcile the engine source,
  then repeat review after the provider contract is independently accepted.
## 2026-08-27 — bounded target local layer returned on repeat buildability review

- Repeated the independent review after the provider/policy split. The original D1023 exact
  removal/return result, separate quantifiers, destination negative and inspector-only posture
  survive.
- Extended the D1652 repair harness to 11/11 with the amended three-row F1 image and a literal
  source/pass-position control. The image correctly fails `EVIDENCE_DERIVATION_WIDENS`: two rows
  claim `position_rules/exact` over convention-grounded/convention-exact inputs ([[D1904]]).
- Returned the RFC because the threat/pass source retains only the opponent-turn exchange FEN and
  loses the original candidate-source FEN ([[D1905]]); capped traversal has no closed typed
  abstention result ([[D1906]]); captured-attacker and identity-loss rules conflict ([[D1907]]);
  the normative operation names a nonexistent evidence-item type ([[D1908]]); and its `local/sync`
  execution class has no production latency or whole-set multiplication gate ([[D1909]]).
- Exact return:
  `planning/bounded-policy-targets/repeat-independent-buildability-review-2026-08-27.md`.
- Next: amend the evidence strengths and chronology authority first, then close the result type and
  measure production cost before another independent review.

## 2026-08-27 — provider health returned on topology, state, F1 and persistence

- Independently reviewed the D609/D1848 provider-health draft against the production engine
  topology, F1 consumer types, opponent cache and persisted run event. The desired behavior—honest
  live/cache/domain/failure distinctions and no silent substitution—survives.
- Added a disposable six-arm buildability harness. It proves that two independent Stockfish
  instances collapse into one health key ([[D1910]]); absent/unverified states are not total across
  snapshot and mode APIs ([[D1911]]); and F1 has no field for the voice/TTS dependencies the draft
  assigns it ([[D1912]]).
- Returned the draft on three additional closure failures: the receipt is not a discriminated
  success/failure/fallback result ([[D1913]]); receipts promised to Review/export necessarily alter
  persisted `opponent.move_selected` despite a `none` claim ([[D1914]]); and cache-only health can
  survive expiry/eviction of the last valid entry ([[D1915]]).
- Exact return: `planning/provider-health-degradation/independent-buildability-review-2026-08-27.md`.
- Next: amend provider instance identity and the total state algebra before the compiler/persistence
  repairs, then repeat review and rerun R18.

## 2026-08-27 — AssistanceConfig register returned on one false-green

- Independently reviewed the process-only assistance register. Rule-7 eligibility, semantic alias
  resolution, one next-head writer, factual v1-v4 history and the product-byte boundary survive.
- Added a disposable three-arm harness. It proves the proposed C9 accepts a changed v4 digest when
  the unchanged head 4 has the reserved lane-5 claimant ([[D1916]]). A future claim may reserve
  ownership; it cannot authorize current-head drift.
- The same harness reproduced the browser parser's unknown-field acceptance and type/parser split,
  but those are already exactly owned by [[D1629]] in Guided Hint and were not duplicated or used to
  widen this process RFC.
- Exact return: `planning/assistance-config-register/independent-buildability-review-2026-08-27.md`.
- Next: remove the claim-based drift exception, add crossed atomic-landing fixtures, repeat the
  focused review, then implement the register before v5/presets.

## 2026-08-27 — Semantic-convention register returned on lineage and authority

- Independently reviewed the process-only semantic-convention register and added a disposable
  three-arm falsifier.
- The exact-ref collision rule accepts simultaneous `space@2` and `space@3` claims, so one semantic
  lineage has no sequential writer or per-id head ([[D1917]]).
- The proposed tree reader erases definition, limitations, authority and disclosure, so it cannot
  detect the same-version meaning rewrite its C10 prose claims ([[D1918]]). The identity register
  must state that boundary honestly; the product RFC's durable previous-release authority owns the
  semantic bytes.
- The only machine-readable 39-member seed is a private constant inside a disposable research test,
  while C10 specifies no durable import/parser and its file boundary names no seed artifact
  ([[D1919]]).
- Corrected by row, not in owner/product prose: seven resources are registered at HEAD, so semantic
  conventions would be the eighth ([[D1920]]).
- Exact return:
  `planning/semantic-convention-register/independent-buildability-review-2026-08-27.md`.
- Next: author amendment, repeat focused review, then implementation after the assistance register
  predecessor lands.

## 2026-08-27 — Semantic convention provenance returned on runtime truth and durability

- Independently reviewed the product-side D1722 successor with a six-arm disposable falsifier.
- The manifest declares possible derivation paths, but a live evidence value retains no input values
  or selected member and is frozen before admission; it cannot receive the promised path-specific
  receipt ([[D1921]]).
- Exact adapters validate operand key names, not values: a forged `unregistered@999` convention is
  sealed today, and the proposed instance-key list does not define extractors for current operand
  shapes ([[D1922]]).
- The draft publishes 39 identities but zero literal definition/limitation/authority/disclosure
  declarations, leaving law-8 chess truth for an implementer to invent ([[D1923]]).
- `voiceCheck` accepts a provider response that drops a required limitation ([[D1924]]); a normal
  repo-local previous snapshot can be changed beside the definition it polices ([[D1925]]); and the
  run schema persists neither convention nor projection receipts despite the stated Review/history
  guarantee ([[D1926]]).
- Exact return:
  `planning/semantic-convention-provenance/independent-buildability-review-2026-08-27.md`.
- Next: source-backed declaration authoring and value-level closure first, then immutable semantic
  history, durable receipt claims and provider completeness before repeat review.

## 2026-08-27 — recorded semantic path returned on source and identity authority

- Independently reviewed the D1067 recorded-run compiler against the live branch resolver,
  run-record adapter, semantic seal, convention dependency and CI/performance contract.
- A five-arm disposable harness proves `branchPath` can silently truncate a missing-parent chain
  and choose a non-leaf from node-array order ([[D1927]]), while a semantic sequence accepts
  unrelated move receipts and retains the same event id (the operation-level reproduction of
  [[D1921]]).
- Returned the draft because `run.record.move@1` is narrative rather than the exact edge receipt it
  claims ([[D1928]]); the result digest names convention heads but contains no convention closure
  ([[D1929]]); and the relative baseline has no absolute consumer budget or deterministic CI split
  ([[D1930]]).
- Preserved the central positive result: deriving semantic declarations that include
  `run.record.move@1` yields exactly the named eleven projections, and their thirteen horizons match
  the shipped operand functions. The compiler remains the correct shared operation after repair.
- Exact return:
  `planning/recorded-semantic-path/independent-buildability-review-2026-08-27.md`.
- Next: strict path and exact edge authority first; coordinate value/convention provenance with the
  already-returned semantic-convention RFC, measure consumer envelopes, amend, then repeat review.

## 2026-08-27 — recorded-path eager fan-out refused; window arithmetic survives

- Preregistered and executed D1930 over twelve fixed imported paths at each of 20/40/80 plies,
  three measured call-cold repetitions after warmup, with legal replay, one local semantic compile
  per edge and all thirteen window rows at every start.
- Total p95 is 399.7/826.3/1,434.0 ms against the existing 500 ms synchronous envelope. The
  40/80-ply arms refuse synchronous full-path compilation.
- The decomposition changes the repair: validation remains below 0.6 ms and all thirteen bounded
  windows cost only 52.3/101.8/184.9 ms. Full `localSemanticEvents` preparation consumes about 88%
  of total p95.
- Added [[D1931]] rather than calling the sequence foundation slow: measure one canonical per-edge
  packet or the exact recorded-edge/capture/check/duty/exchange source closure, then amend around
  the winning execution shape. Generic CI receives exact work counts; timing stays in the pinned
  performance tier.
- Dossier: `design/research/recorded-semantic-path-cost.md`; instrument and raw results:
  `tools/d1930-recorded-path-cost-harness/`,
  `planning/recorded-semantic-path/d1930-cost-results.{json,md}`.

## 2026-08-27 — recorded-path exact source closure restores synchronous execution

- Preregistered and ran D1931 against D1930's identical fixed population, rerunning the eager
  control and alternating execution order rather than comparing against yesterday's clock.
- Exact source closure passed the semantic gate on every path: sorted event ids, all receipt bytes
  and final result digest are byte-equal to full local fan-out.
- Total p95 fell from 397.5/803.6/1,391.2 ms to 64.7/129.7/212.7 ms at 20/40/80 plies. All exact
  arms pass 500 ms; no pending/background concession is needed for recorded sequence compilation.
- The author repair is now literal: one transition compile and one direct checked check declaration
  per edge, plus the same recorded-edge/duty/exchange authorities. Eager full local fan-out stays
  refused, while Node-24/release timing remains an implementation discharge.
- Dossier updated: `design/research/recorded-semantic-path-cost.md`; instrument and results:
  `tools/d1931-recorded-path-source-harness/`,
  `planning/recorded-semantic-path/d1931-source-closure-results.{json,md}`.

## 2026-08-27 — recorded path and edge authority become executable

- Extended the disposable D1927 return harness with a total graph-derived resolver, exact-edge and
  exact-version candidates; all eleven original/candidate arms pass.
- The resolver is node-array-order independent and refuses missing parent, cycle, duplicate id and
  multiple same-branch tips before any chess detector runs.
- A shipped-runtime fork closes [[D1932]]: its shared ancestral edge has one identity across both
  descendant requests only when requested branch and relative offset remain path/window context.
- The exact source is a new `run.record.edge@1` machine authority over run plus actual parent/child
  record. Narrative `run.record.move@1` remains unchanged.
- Replacing the source under the eleven current `@1` sequence outputs would mutate declared
  provenance in place. The RFC amendment must add v2 successors and route future
  Review/module/longitudinal consumers to them explicitly.
- The migration exposed [[D1933]]: the exported semantic inventory and two server checks erase
  versions or hard-code `@1`. The exact authority must become `VersionedEvidenceId[]`; a separately
  named family view may collapse versions only for deliberate analysis.
- Dossier: `design/research/recorded-path-authority.md`; instrument:
  `tools/d1927-recorded-path-review-harness/authority-candidate.test.ts`.

## 2026-08-27 — Semantic-convention value authority becomes executable

- Extended the disposable D1921 return harness from six reproduced failures to fourteen total
  arms. The candidate seals canonical derivation-member identity plus an exact multiset of nested
  input-value digests; same-output alternative paths differ, input order is canonical, repeated
  projection values remain distinct, and spread/JSON/plain-object forgeries fail.
- Derived the complete instance-varying population from the live manifest: fourteen projections,
  not three. Typed extractors cover twelve string arms, one two-ref arm and structured grade
  identity/context, and are set-equal to that population.
- Found and ledgered [[D1934]]: `exactObject` never rejects extra payload keys, so fixed projections
  can smuggle undeclared convention refs or arbitrary caller data. Exact key-set equality now
  precedes extraction/sealing in the amended contract.
- Amended the product RFC: provider limitations are deterministic rather than omission-checked;
  same-version semantics use append-only staged + first-parent history; Review/history claims
  run-schema lane 0.24 with durable validation/re-sealing and honest legacy absence.
- D1923's 39 source-grounded literal declarations and the returned process-register reconciliation
  remain before repeat independent review. Dossier:
  `design/research/semantic-convention-value-authority.md`.

## 2026-08-27 — Semantic-convention register return repaired

- Published the one stable 39-member seed at
  `planning/semantic-convention-register/initial-members.json`; the D1722 census now reads it and
  future C10 is specified to read the same bytes. The private disposable constant is gone.
- Repaired lineage ownership: collision identity is base id, new ids start at `@1`, existing ids
  claim exactly landed head+1, and crossed concurrent/skipped/backward cases are explicit
  falsifiers.
- Narrowed the member projection honestly to identity. Same-version semantic immutability is owned
  by the product RFC's append-only staged/first-parent history rather than a checker that erases the
  fields it claimed to protect.
- Corrected every resource count to eight. The process RFC remains draft pending repeat review and
  its assistance-register predecessor; no checker/product implementation is authorized yet.

## 2026-08-27 — Semantic-convention declaration source recovery closes D1923

- Published one literal 39-row migration artifact, set-equal to the stable convention member seed.
  Every row carries a definition, mandatory limitations and resolvable projection/implementation
  witnesses; the disposable D1923 harness passes 4/4.
- Found and repaired two shipped-identity rows whose original witnesses established meaning but not
  the literal versioned ref (D1935).
- Refuted the draft authority union for shipped recorded, bounded-search and product-composition
  meanings. Added migration-only `landed_contract` authority tied to immutable snapshot `62a5731f`;
  it cannot establish new chess truth (D1936).
- D1923 is closed at the authoring tier. D1924–D1926 execution, the process predecessor and repeat
  independent review still block product-RFC acceptance; no production byte is authorized.

## 2026-08-27 — Convention persistence gets an origin trust boundary

- Extended the product falsifier to 21 passing arms: deterministic limitations, append-only
  history and the durable-receipt core now execute beside exact value/operand contracts.
- Found D1937 by tracing the live run event: it stores no semantic payload graph or signed event
  chain, so unkeyed receipt digests can be rewritten self-consistently.
- Amended the candidate/RFC to sign the canonical receipt envelope with an Ed25519 installation
  key. Verification precedes historical resealing; recomputed-digest mutation and unknown origins
  fail typed, v1 remains readable under v2, and legacy absence stays empty.
- Cross-install signer trust is explicit by fingerprint rather than silently accepting a
  self-asserted export key. Process-register reconciliation and repeat review remain before
  acceptance; production remains untouched.

## 2026-08-27 — Assistance register D1916 return repaired

- Removed the false-green in C9: a future lane reservation can never excuse present-tree head or
  digest drift.
- The disposable crossed candidate passes 7/7. Same-head and head-only mutation fail despite a
  lane-5 claim; unchanged head 4 plus its next-head reservation and a complete atomic head-5
  landing are the only positive controls.
- The RFC remains draft pending repeat independent review. No runtime, web, schema, storage or
  content byte changed; D1629 remains the Guided Hint product codec obligation.

## 2026-08-28 — Software-tier worker cap removes false timeout cascade

- The permissioned Node-24 `make verify` run removed the sandbox listener error but exposed 37
  unrelated 5–30 second timeouts across schema compilation, corpus traversal, SQLite, semantic
  selection and Stockfish. The unbounded software config saw 14 available workers; 1,021/1,058
  tests still passed and the run took 170.79 seconds.
- Re-ran the complete tier with four workers: 175/175 files and 1,058/1,058 tests passed in 14.56
  seconds. This is a whole-tier comparison, not a selected-file retry.
- `vitest.software.config.ts` now owns the four-worker cap; the performance tier remains isolated at
  one worker. D1938 is closed pending the final standard-command/full-verify rerun.

## 2026-08-28 — Standard verification command closes D1938

Plain `make verify`, with no invocation-time environment or parameter overrides, passed under the
repository-configured Node 24/Stockfish/Docker toolchain: 1,058 software tests, 2 performance tests,
171 real-content tests, all workspace typechecks, packaging/build, evidence contracts and every
governance/status/roadmap/docs/staged-process gate. D1938 is closed on the command contributors and
CI actually run.

## 2026-08-28 — Provider-exchange independent return repaired

- Repaired [[D1871]]–[[D1878]] in `rfc/provider-exchange-and-execution.md` without touching
  production: stable occurrence-addressed path ids; separate global reach and exact subject
  satisfaction; immutable acquisition plus discriminated live/retained delivery; complete
  required/optional source-absence aggregation; a closed five-operation scheduler protocol;
  requested-versus-actual engine identity; literal Explorer domain results; history-preserving Maia
  occurrences; and exact-only Stockfish legal-root scores.
- Added `make provider-exchange-contract` as the repository-owned entry point for the disposable
  eight-arm falsifier. It passes 8/8 without invocation-time environment overrides.
- The author pass found and repaired four additional type-level holes before handoff: repeated
  derivation occurrence aliasing ([[D1939]]), operation/request cross-pairing ([[D1940]]),
  contradictory zero-population W/D/L ([[D1941]]) and implied Maia top-k completeness ([[D1942]]).
- Landed the evidence dossier and repeat-review handoff. The RFC remains draft; production is still
  forbidden until repeat independent buildability review.

## 2026-08-28 — Candidate-packet repeat return repaired without an aggregate evidence shortcut

- Repaired [[D1900]]–[[D1903]]: the shared cache now owns one neutral process-sealed receipt; only
  the real semantic-selection composition lands; the empty production bot roster gains no test-only
  traversal; and the held bot join uses one complete legal-root provider exchange rather than N
  child searches.
- Re-derived the implemented F1 quantifier instead of trusting the earlier green manifest fixture.
  Each derivation member is a conjunction, while one legal position emits only a subset of the
  possible 47 event and 22 reading identities. Logged and repaired [[D1945]]–[[D1946]] by deleting
  the aggregate packet projection, adapter and future-only bindings. Exact retained values keep
  their existing F1 identities; the packet is an internal execution container, not evidence.
- Repaired the provider join's [[D1943]]–[[D1944]] follow-ups: legal-root scores now retain a
  root-side cp/mate-outcome frame, and F1 source payloads retain the complete delivery/acquisition
  envelope.
- Added `make candidate-packet-contract`; 7/7 packet arms and 8/8 provider arms pass through normal
  repository-owned targets. Updated the research coverage, RFC register and repeat-review handoff.
  Both RFCs remain draft; production is forbidden until fresh independent buildability review.

## 2026-08-28 — Candidate-packet composition-root correction

- The preceding packet entry's “real semantic-selection composition” is specifically
  `apps/server/src/semantic-evidence-check.ts`. A source trace found `createApplication` has no
  semantic-selection caller or route; injecting the service there would be a dormant anchor
  ([[D1947]]).
- Removed `application.ts` from the first-landing surface. The semantic executable constructs the
  service/operation it actually calls; application ownership waits for the first concrete Support,
  Review or bot route. The focused packet target now passes 8/8.

## 2026-08-28 — Pack-capability dependency/digest foundation falsified successfully

- Added the disposable D1620-D1625 closure instrument behind the repository-owned
  `make pack-capability-closure` entry point; it passes 7/7 without invocation-time environment or
  parameter overrides.
- An AST-token site plus declared transitive dependency edges detects the exact D566 helper-only
  change: `pawn_safe_square` and dependent `outpost` invalidate, while unrelated `isolated_pawn`
  does not. Literal and absence selectors derive the exact requirement set and reject both missing
  inherited requirements and unrelated extra stamps.
- Current format/instrument dispositions map losslessly onto a semantic-status axis; deployment
  reachability remains a separate axis, with transient unavailability limited to configured
  providers. No runtime, schema, pack or content byte changed.
- Annotated census roots distinguish five failure classes including count-preserving id swaps, and
  the typed suffix rule refuses current-authority strings without banning compatibility fixtures.
  The RFC author amendment now carries the exact named-root inventory and existing lifecycle
  destinations. This is not independent acceptance; lane 0.30 and corpus application remain
  unauthorised pending repeat review.

## 2026-08-28 — Bounded-target repeat return repaired and reclassified background

- Repaired [[D1904]]–[[D1909]] in `rfc/bounded-policy-targets.md` without touching production. The
  three F1 rows now inherit `declared_convention/convention`; named targets retain the sealed
  original `legal_moves@1` authority across the threat pass; immediate outcomes and operation
  evidence/abstention are closed unions; observed attacker/victim captures precede unexplained
  identity loss; and every normative input uses a literal `DeclaredEvidence<T>` projection alias.
- Added stable `make bounded-target-contract` and `make bounded-target-census` entry points. The
  repair contract passes 14/14; the exhaustive census passes 11/11 and writes its execution receipt.
- The census measured source-position maxima of 111 authored and 333 imported target×candidate
  pairs. Whole-position maxima were 1,305.12 ms and 993.43 ms; one valid call reached 753.88 ms.
  This refuses request-thread `sync`: the RFC now declares `local/background`, cancellation, a
  512-pair ceiling and permanent cold/warm tail gates.
- Landed `design/research/bounded-target-execution-closure.md` and a fresh repeat-review handoff.
  The RFC remains draft, and the production-symbol census remains an implementation discharge;
  no Support, Review, bot, pack, schema or content byte changed.

## 2026-08-28 — Provider-exchange repeat buildability return

- Re-derived the amended provider contract against the shipped F1 compiler, serialized UCI
  boundary, Maia caller, both Explorer authorities and the Syzygy source. The shared-provider
  architecture survives, but implementation remains unauthorised.
- Recorded [[D1950]]–[[D1955]]: both Maia occurrences strip the delivery receipt; Explorer history
  has an unreachable `not_requested` arm; operation exports have context-versus-signal signatures;
  mixed-source path availability has no total state algebra; Maia pending and retained keys are
  conflated; and the two Explorer migration projections have no literal payload/callable contract.
- Added the disposable six-arm reproduction instrument behind the stable
  `make provider-exchange-repeat-review` entry point and linked the exact repeat return from the RFC
  register. No production, schema, pack, content or protected intent byte changed.

## 2026-08-28 — Provider-exchange second author repair and Explorer source correction

- Repaired [[D1950]]–[[D1955]] with sealed Maia delivery inputs, one descriptor execution shape,
  per-leaf subject availability plus a total path reduction, separate pending/retained identities,
  and a literal Explorer summary/internal-provenance/wire projection.
- The repair exposed [[D1956]]: an exact played-move occurrence cannot derive from narrative
  `run.record.move@1`; it is ordered after `recorded-semantic-path`'s exact `run.record.edge@1`
  rather than manufacturing a provider-private run authority.
- A primary-source check rejected the first width-shaped history repair ([[D1957]]). The official
  Lichess operation exposes boolean `history` only, matching the two live URL builders. The amended
  request now has disabled/requested arms and distinguishes requested-empty from not-requested.
- `make provider-exchange-contract` remains 8/8 green and the crossed author target is now 7/7.
  This is an author checkpoint, not independent acceptance; production remains blocked on repeat
  review.

## 2026-08-28 — Shared-candidate packet second repeat buildability return

- Re-derived the amended packet against the actual Make entry point, application call graph, F1
  runtime seals, synchronous semantic collectors and exact mobility types. The neutral packet,
  complete legal denominator, no-F1-aggregate repair and one-root bot table survive.
- Recorded [[D1958]]–[[D1961]]: the replacement first consumer is a hard-coded verify-only CLI; the
  promised process receipt has only an erased `unique symbol` brand; `AbortSignal` cannot interrupt
  a synchronous 0.6–1.1 second compiler without a yielding/worker execution model; and exact
  convention/version/abstention authorities are widened to unchecked scalars.
- Added the disposable four-arm reproduction behind the stable
  `make candidate-packet-repeat-review` entry point and routed the exact author repair. No
  production, schema, pack, content or protected intent byte changed. Implementation remains
  unauthorised pending amendment and another independent review.

## 2026-08-28 — Bounded-target second repeat buildability return

- Re-derived the amended local target contract against the private `threats()` pass mutation,
  exchange identity, standard-FEN provenance, actual D1023 algorithm, JavaScript event loop and
  published per-item operation type. The local/provider/policy split, convention grounding,
  source-position authority and inspector-only posture survive.
- Recorded [[D1962]]–[[D1968]]: duplicated pass transform; unavailable initial promotion
  provenance; impossible `target_captured`; no actual background/cancellation topology; no
  set-owning operation for the 512-pair limit; uncorrelated request/result union; and a payload that
  admits contradictory witness truth.
- `make bounded-target-contract` passed 14/14, `make bounded-target-repeat-review` passed five
  runtime/source arms plus its crossed typecheck, and `make bounded-target-census` passed 11/11 over
  the full populations in 169.65 seconds. Counts and pair maxima remained stable; timing again
  confirmed background classification. No production, schema, pack, content or protected intent
  byte changed. Implementation remains unauthorised pending amendment and another review.

## 2026-08-28 — Bounded-target second repeat author repair

- Applied the [[D1962]]–[[D1968]] return without reopening the local/provider/policy boundary. The
  draft now assigns threat passing to one exported anchor, drops ungrounded initial promotion
  provenance and unreachable `target_captured`, and turns unexplained identity loss into abstention.
- Replaced duplicated booleans and arbitrary nullable arrays with a three-arm return algebra and
  fixed move tuples. Replaced the generic per-item request/result unions with one source-position
  batch owning the set-equal target authorities and complete legal candidates before enforcing 512.
- Made `background` executable in the contract: one active/eight queued, exact-key deduplication,
  portable cooperative yield every 64 nodes, cancellation checks during work and no partial
  publication. `make bounded-target-contract` passes 18 runtime/source plus five crossed compile
  controls. `make bounded-target-census` passed 11/11 again in 171.44 seconds with semantic counts
  and 111/333 pair maxima unchanged. This remains an author checkpoint; production waits for fresh
  independent review.

## 2026-08-28 — Shared-candidate packet second repeat author repair

- Applied the [[D1958]]–[[D1961]] return under the owner's foundation-first sequencing. The packet
  may land as a deliberately unused lower primitive, but the verify CLI is no longer called a
  product consumer and D9/D10/1.0 feature receipts remain open.
- Replaced the erased-brand-only claim with a private `WeakMap` constructor/assertion authority and
  an asserted wide→narrow projector that remints a recognized receipt while retaining exact member
  references. Replaced synchronous whole-packet cancellation prose with code-derived collector
  groups, a portable yield after every group and last-waiter cancellation during work.
- Narrowed move convention/compiler version to exported literal types and abstention to a generated
  projection→reason union set-equal to declarations. `make candidate-packet-contract` passes 11
  runtime/source and three crossed compile controls; the four-arm prior return instrument is red on
  all four obsolete assumptions. This is an author checkpoint; production waits for fresh
  independent review.

## 2026-08-28 — Review evidence compiler author repair and shared WDL dependency

- Repaired [[D1644]]–[[D1651]] without reducing full 1.0 Review: node-free WDL normalization and
  exact recorded occurrences; forced-mate v2 joined through `run.record.edge@1`; one production
  bounded progressive coordinator; a named server-only packet consumer plus closed parsed JSON;
  learner-side Story compatibility; and measured/reported confidence throughout.
- The dependency trace found [[D1969]]: the shared fixed-bound Stockfish result carried typed score
  but no WDL. The provider RFC now retains validated raw side-to-move WDL from the same completed
  exchange, keeping the five-operation census and refusing a second Review engine authority.
- `make review-evidence-author-contract` passes 6/6 crossed author arms and
  `make provider-exchange-contract` passes 9/9 including malformed WDL controls. Both RFCs remain
  draft and unimplemented pending fresh independent review; final Review Map selection remains
  separately open rather than being hidden in this compiler.

## 2026-08-28 — Bot-policy production amendment independent return

- Re-derived the D1601–D1609 author amendment against the newer shared provider and candidate
  packet contracts, the current Maia selector, runtime event sequence, writer lease and SQLite
  save boundary. The measured layer stack, guard-dependent pawn trait, server-owned route and
  grounded-card direction survive.
- Recorded [[D1970]]–[[D1976]]: private provider/guard paths fork the one provider scheduler;
  bounded Maia mass is called legal-complete; sealed authorities become open durable strings; a
  node-only precondition cannot make an awaited operation atomic or idempotent; request/timing
  bytes contradict the derivation's byte-determinism claim; base-provider failure promises a move
  without a distribution; and Stage B duplicates the shared packet plus all-legal score join.
- Added the seven-arm reproduction behind the stable `make bot-policy-independent-review` target
  and routed a dependency-ordered author handoff. No profile, provider operation, production route,
  schema, migration, content or protected intent byte changed. Implementation remains
  unauthorised pending amendment and fresh independent review.

## 2026-08-28 — Shared-candidate packet final independent buildability return

- Re-derived the [[D1958]]–[[D1961]] author repair against its public operation signatures,
  acceptance/implementation boundary, Node event-loop promise, scope projector and the live
  loose-piece collector path. The complete score-free population, private receipt authority,
  literal conventions and foundation-first zero-consumer landing survive.
- Recorded [[D1977]], [[D1978]], [[D1979]], [[D1980]] and [[D1981]]: no closed service result/error
  algebra; held provider integration required by foundation acceptance; unnamed production yield;
  impossible crossed scope projections admitted by the public type; and declared collector
  unavailability erased into the same empty array as a factual hard negative.
- Added the five-arm reproduction behind `make candidate-packet-final-review` and routed a literal
  author repair order. No production, schema, content, pack or protected intent byte changed.
  Implementation remains unauthorised pending amendment and another fresh independent review.

## 2026-08-28 — Pack-capability repeat independent buildability return

- Re-derived the [[D1620]]–[[D1626]] author amendment against the actual shape/principle version
  schemas, F1 projection declaration, strict AJV pack compilers, shipped disposition registries,
  resolved shape content and the draft claim-anchor dependency. The prior graph/site/state direction,
  D566 falsifier, planner split and D560 hold survive.
- Recorded [[D1982]]–[[D1992]]: the namespace rejects its own ids; integer versions cannot carry
  resolved semver; the complete applicability authority and F1 bridge are absent; 20 refusals lack
  lawful `ruledBy` mappings; required schema annotations are unknown under strict AJV; criterion 15
  forms a dependency cycle; several roots are not representable sites; declaration disposition
  vocabularies conflict; resolved shapes omit embedded evaluator dependencies; and `requires` has no
  canonical byte form.
- Added the eleven-arm reproduction behind `make pack-capability-repeat-review`. No production,
  schema, content, pack or protected intent byte changed. Lane 0.30 remains unauthorised pending
  author repair and another fresh independent review.

## 2026-08-28 — Bounded-target final independent buildability return

- Re-derived the [[D1962]]–[[D1968]] author repair against the process-sealed evidence type, live F1
  catalogue constructor, existing consumer-only operation census and D1023 algorithm. The pass
  anchor, observation-only identity, reachable outcome union, complete-set batch and fixed return
  algebra survive.
- Recorded [[D1993]]–[[D1999]]: deduplicated work has no waiter cancellation semantics; request and
  input digests have no byte authority; the live catalogue forces local producers to `sync`; the
  named producer-operation census does not exist; `exchange_neutralized` contradicts the evaluator
  refusal; service failures/defaults and the production yield remain open; and exact node/yield
  gates have no visited-position convention.
- Added the seven-arm reproduction behind `make bounded-target-final-review`; the 18-arm author
  contract remains green. No production, schema, content, pack or protected intent byte changed.
  Implementation remains unauthorised pending author repair and another fresh review.

## 2026-08-28 — Provider-exchange final independent buildability return

- Re-derived the [[D1950]]–[[D1956]] and [[D1969]] author repairs against the live engine
  supervisor/evidence executor, Explorer guard/parsers, Syzygy source, F1 boundary and both shipped
  canonicalization implementations. The sealed delivery, history split, per-leaf availability,
  pending/retained identity split, narrow Explorer summary and one score+WDL exchange survive.
- Recorded [[D2000]]–[[D2008]]: success results lose operation correlation; receipts are open and
  not operation/provider-mapped; coalesced deadlines and waiter settlement are undefined; the
  promised retention entry bound is absent; Syzygy outside-domain has no result arm; Explorer
  mistakes `CORPUS_GUARD` prose for a suitability predicate; Stockfish command/WDL state and
  iterative output selection lack one authority; and provider digests have no shared canonical,
  domain-separated byte registry.
- Added the nine-arm reproduction behind `make provider-exchange-final-review` and routed a
  dependency-ordered author handoff. Both earlier author targets remain green. No production,
  schema, pack, content or protected intent byte changed. Provider implementation and its Review,
  bot, theory and collector consumers remain unauthorised pending repair and fresh review.

## 2026-08-28 — AssistanceConfig register repeat independent return

- Re-derived the [[D1916]] amendment against the live register checker, four pinned historical
  assistance commits and the exact Guided Hint/preset bytes the process RFC would edit. The
  current-head/digest repair, TypeChecker extraction, 4/9/22 tree census, single-writer direction
  and product-byte boundary survive.
- Recorded [[D2009]]–[[D2012]]: C9 admits erased/gapped Landed history; the v5 claim names a
  `validV5` validator its owner forbids; the required preset status rewrite ignores D1639's open
  owner ruling; and a snapshot-only atomic head-5 state cannot prove the prior sole claimant.
- Added stable Make targets for the seven-arm D1916 author contract and four-arm repeat review, and
  routed the exact author repair. No runtime, web, schema, storage, content, archive or protected
  design byte changed. C9, assistance v5 and the dependent semantic register remain blocked.

## 2026-08-28 — Semantic-convention register repeat independent return

- Re-derived the [[D1917]]–[[D1920]] amendment against the live seven-resource checker, its required
  assistance predecessor, the stable seed/declaration artifacts, product compiler/history contract
  and the empty-to-39 landing transition. Base-id serialization, identity-only scope and the exact
  39-member source population survive.
- Recorded [[D2013]]–[[D2018]]: dependency order makes this resource ninth; snapshot C10 cannot
  prove the previous claimant; the literal AST reader conflicts with JSON expansion; history has no
  named artifact or production check; unbounded decimal refs alias under JavaScript `number`; and
  the seed/live-claim invariant has no pre/post-landing phase guard.
- Added stable `make semantic-register-contract` and `make semantic-register-repeat-review` targets,
  the six-arm reproduction and an exact author handoff. No runtime, web, schema, storage, content,
  archive or protected design byte changed. C10 and the semantic product RFC remain unauthorised.

## 2026-08-28 — AssistanceConfig register second-return author repair

- Replaced snapshot-only history with exact pinned v1–v4 bootstrap rows plus prefix-preserving
  staged/first-parent appends. A head advance now consumes one prior exact claimant and binds its
  RFC identity and set-equal path/symbol changes to one new Landed row.
- Corrected the future v5 claim to the two runtime `AssistanceConfig` fields and the single
  `parseAssistanceConfig` codec; the process implementation will describe Guided Hint as awaiting
  the D1639 owner ruling and then repeat review, never as already review-ready.
- Replaced the four review reproductions with seven able-to-fail author fixtures while preserving
  the seven D1916 checks. No runtime, web, schema, storage, content, archive or protected design byte
  changed. Fresh independent review still gates C9 implementation and claim transfer.

## 2026-08-28 — Semantic-convention register second-return author repair

- Corrected the dependency-relative count to resource nine and reused C9's staged/first-parent
  claimant-to-landing transition for the exact 39-member handoff. Safe-integer parsing now precedes
  every lineage/head operation; seed equality has explicit zero-landed and post-landing phases.
- Reconciled product construction: one checked generator transforms the reviewed declaration JSON
  into the literal runtime array and compares all semantic fields. Canonical semantic history now
  has an exact JSONL path, four-field row, checker, stable Make targets and governance/CI boundary.
- Found and recorded [[D2019]]: a history row cannot atomically embed its own landing commit hash.
  The row retains ref/semantic/registry/owner; staged/first-parent Git history supplies the
  introducing commit. Seven author fixtures plus the 19 prior contracts pass. No production,
  schema, storage, web, content, archive or protected design byte changed; fresh reviews remain.

## 2026-08-29 — Provider-exchange third-return author repair

- Repaired [[D2000]]–[[D2008]] without implementing the provider layer: operation-distributive
  results; exact provider/requested/actual receipt maps sealed by one scheduler-private constructor;
  scheduler-minted per-waiter deadlines, last-waiter abort and deterministic entry/weight retention;
  an explicit standard-chess Syzygy outside-domain arm; and disclosure-only Explorer population.
- Removed caller-authored Stockfish command digests. Both engine operations now publish exact
  descriptor-owned option/position/go/reset images, generation isolation and one task-bounded
  same-line score/WDL reducer for iterative UCI output.
- Published one six-domain provider digest registry with exact canonical JSON, UTF-8/domain-prefix
  bytes and closed request/pending/actual/response/path images. Replaced all nine review
  reproductions with able-to-fail author fixtures while preserving both earlier provider contracts.
  No production, schema, pack, content or protected intent byte changed; fresh independent review
  still gates implementation and its Review, bot, theory and collector consumers.

## 2026-08-29 — Provider-digest decimal self-review

- Found [[D2020]] after the first full gate but before commit: a safe-integer-only canonicalizer
  could not represent Maia's own decimal temperature/top-p request identity. Corrected the contract
  to RFC 8785 finite-number serialization and extended the author fixture across decimal mutation,
  negative zero and reordered keys. This remains RFC authoring only; fresh review still gates code.

## 2026-08-29 — Authoritative board-move announcement repair

- Closed [[D1691]] across the shared five-mode input path. Move candidates now announce as staged;
  only a successful authoritative run mutation produces the committed receipt. Rejection, network
  failure and stale settlement cannot emit success, and the rendered board is restored from the
  authoritative position on failure.
- Added pointer, keyboard-grid and text-input rejection fixtures plus a session-controller failure
  receipt. Click, drag and touch already share the pointer commit path, so the repair does not create
  per-mode policy. Updated `docs/drill-client.md`; no pack, content, schema, archive or protected
  intent byte changed.

## 2026-08-29 — Own-game clock-retention queue correction

- Reproduced [[D2021]] before taking `IMP-a6`: changing the Lichess request to `clocks=true` cannot
  retain clocks because the same path immediately replaces every annotated move node with `{ san }`.
  The queued one-word task would have passed its URL assertion while still losing every reading.
- Corrected the research and exhaustive UX inventory, and routed request + extract-before-strip +
  typed persistence + account export/delete joins as one `recorded-clocks` unit. No production,
  storage, schema, content, archive or protected intent byte changed.

## 2026-08-29 — Live-viewer evidence-ceiling repair

- Closed [[D448]] / `LIV-a18`: the raw evidence page now preserves honest empty before disclosure
  and, once evidence exists, applies the same role/workflow/live/review ceiling as the other
  guidance routes. Participant and non-reviewing spectator grants cannot read queued engine values.
- Added a production HTTP fixture over one real staged engine result: the host receives it while
  both narrower roles receive `ASSISTANCE_WITHHELD`. Updated `docs/live-sessions.md`; no schema,
  storage, content, archive or protected intent byte changed.

## 2026-08-29 — Signed-in live vote participation

- Closed the browser-participation arm of [[D315]] / `LIV-a11`. Every signed-in session viewer
  can now cast or change an open advisory vote; the client sends only session, window and choice,
  never the adapter-only external voter key, and adopts the server-returned tally.
- Added a spectator component contract covering the callable option group, exact three-argument
  request, confirmation and updated count. Corrected the living research, gate watch note,
  implementation index and live-session docs; rotation, spectator links, close/grant controls and
  academy-specific behaviour remain explicitly open.

## 2026-08-29 — Spectator watch links reach every live kind

- Closed the spectator-link arm of [[D315]] / `LIV-a12`. A host can mint a distinct watch link
  from Stream, Academy or Match without overloading a player-seat invitation; the request fixes
  the role to spectator and supplies no match seat.
- The result states that the viewer signs in as themselves and that the token is single-use,
  expires after 14 days and grants read-only spectator access. A host component contract binds
  the request and rendered limits; rotation, vote close/grant controls and academy-specific
  behaviour remain open.

## 2026-08-29 — Live creation and rotation become an executable workflow

- Closed `LIV-a3` and `LIV-a4`: the host supplies the session title, creation exposes pending and
  failure states, and title/rotation/match prerequisites disable submission with attached reasons.
  The rejection fixture uses a named learner who lacks write access so the error path can fail for
  the same reason as production.
- Closed [[D315]]'s rotation-mechanics arm for already-granted members. Creation de-duplicates and
  sends the ordered `rotationHandles`; detail renders the authoritative order/current cursor and
  the host can advance it. The test first caught the board-policy select failing to transition the
  mounted form, so the control now uses an explicit typed change transition.
- Participant grant management remains open: a new member cannot be added to a run from this
  screen before entering the rotation. Product-choice composition, eligibility and anonymous
  viewer scope remain open under [[D1470]].

## 2026-08-29 — Live access and poll lifecycle close their client gaps

- Closed [[D315]]'s remaining generic-live mechanics. The host can grant/update participant or
  spectator access and revoke non-host access from one **Session access** region; every operation
  uses the ordinary run writer and refreshes the authoritative session detail. This also removes
  the missing-grant prerequisite from rotation setup.
- Added the missing vote-close client operation and host workflow. A host may record no applied
  option or one declared option; copy and confirmation state that this is advisory metadata and
  never plays a move. The host component contract crosses role update and close-with-option.
- [[D315]] stays open only for an academy-specific workflow/default/module composition; it no
  longer advertises generic server-complete/client-absent mechanics.

## 2026-08-29 — Broadcast overlay uses authored objective language

- Closed [[D2022]] / `LIV-a5` / `LIV-a6`: replaced the overlay's raw objective-state headline with
  the authored pack objective, or an explicit no-objective sentence. All six runtime states have
  fixed secondary status copy and one branch no longer renders as “1 branches.”
- Added a pure projection table covering all states and absence. The complete browser suite then
  exposed four stale generated-title assumptions and one stale read-only tally assertion; after
  making each journey submit the title it expected and target the vote action, all 58 required
  desktop/mobile checks passed (one optional Maia latency probe skipped).

## 2026-08-29 — Live audience output reuses the overlay projection

- Closed `LIV-a7`, `LIV-a8`, `LIV-a9`, `LIV-a10` and `LIV-a15` under [[D2023]].
- The host now receives a selectable/copyable OBS browser-source URL, the source-cookie and in-OBS
  sign-in instructions, transparent-background guidance, and an inline **See what your audience
  sees** iframe of the exact `/live/overlay/:runId` route.
- The interface states that board moves are never delayed and sends live-game delay to streaming
  software; poll duration is named as a different control. Stream copy leads with commit →
  consequence → rewind → fork → compare, the overlay calls branches preserved attempts, and match
  invitation copy names pause-by-consent plus mainline preservation.
- Software verification passed at 1,068 tests before closeout. Browser, content, governance and the
  complete repository gate remain the landing checkpoint.

## 2026-08-29 — Live creation becomes a guided workflow

- Closed `LIV-a1` and `LIV-a2` under [[D2024]]. The ordinary surface now names Teach/Coach, Stream
  rehearsal, native friend match and Position Arena as four outcomes instead of requiring the user
  to infer a product from `kind × boardControl`.
- Each workflow applies a valid default. Advanced board handoff preserves the lower-level
  host-directed, free-claim, rotation and match primitives only where the combination is valid.
- Added snapshot-derived `RunSummary.recordedMoveCount` without changing persisted summary JSON.
  Native-match cards now refuse non-position and already-played runs with a visible reason before
  submission; the server's existing authority remains the race-safe final check.
- Focused verification passed at 1,071 software tests. Browser and the complete repository gate
  remain the landing checkpoint.

## 2026-08-29 — Guided Hint cannot become an engine-PV feed

- Closed `INR-a9` and narrowed [[D1455]] without claiming that the returned module route now ships.
  The runtime module compiler's progressive answer contract is `pattern → fact → move`; stage 3
  may expose one admitted move and cannot admit a principal variation.
- `live.stockfish.pv@1` remains available to the explicit Analyze/runtime-evidence consumer. A
  negative compiler fixture pairs admitted evidence with `principal_variation` answer content and
  must fail `MODULE_ANSWER_WIDENS`, so moving the leak from the stage table into an accepts row does
  not bypass the boundary.
- The remaining D1455 closure is still [[D1569]]'s measured horizon registry and sealed production
  rung compiler. This checkpoint narrows an executable contract; it does not pretend that the
  learner-facing hint module is implemented.

## 2026-08-29 — Public arrival reaches a real rehearsal instead of a password wall

- Closed `IMP-a24` and `IMP-a25`, and narrowed [[D1485]] without deciding the separate guest-run
  identity question. Anonymous visitors now receive the product thesis, four-step rehearsal loop,
  evidence boundary, and the real searchable pack catalogue served by the already-public pack and
  capability endpoints.
- Choosing a pack creates no guest learner or run. The client retains that pack id in memory,
  moves focus to an honest registration/sign-in handoff, and starts the exact selected pack only
  after authentication succeeds. Starting and persistence therefore retain the existing identity
  and authorization boundary.
- Public story cards now link to `/play` and name the action as rehearsing positions in Tabiya.
  Component coverage proves anonymous catalogue access and intent retention; the production
  browser journey crosses anonymous arrival → selection → registration → real board.

## 2026-08-29 — Permanent story links gain an honest lifetime and a visible off-switch

- Closed `IMP-a26`, [[D2025]], and [[D2026]] without inventing an expiry policy. The implemented
  storage contract remains explicit: a `story_read` URL does not expire and remains readable by
  anyone holding it until the host revokes it or deletes their account.
- Story now loads the shipped share-management projection, lists active and revoked records with
  creation time, and exposes revoke beside every active link. The copy says revocation blocks
  future reads but cannot recall copies already saved elsewhere.
- Clipboard write is best effort after token creation. Permission denial leaves the public URL
  visible and reports manual-copy guidance instead of rejecting the click handler. The complete
  browser suite crosses UI mint → anonymous read → UI revoke → generic 404 and passes 60 journeys.

## 2026-08-29 — Import states what it keeps and why it refuses a game

- Closed `IMP-a3`, `IMP-a7`, and `IMP-a10`, and narrowed [[D1486]] without claiming the remaining
  multi-game, variation-preservation, or clock-retention work. Before submission, Review now says
  that the original PGN—including names, tags, comments, and annotations—enters durable storage,
  account export, and the existing deletion/backup boundary.
- The server remains the parsing authority. A client projection turns its typed source and parser
  failures into distinct one-game, mainline-only, variant, size, length, empty-game,
  starting-position, illegal-move, parse, lookup, timeout, and unsupported-source guidance while
  preserving an unknown server message.
- Chess.com guidance now asks for one completed-game PGN rather than an analysis tree with
  variations. The browser journey first proves the production multi-game refusal, then imports a
  valid game. `IMP-a1`, `IMP-a2`, and `IMP-a6` remain RFC-blocked; `IMP-a16` and `IMP-a27` remain
  partial because their other storage-start surfaces have not shipped.

## 2026-08-29 — Shared candidate packet answers its final five-operation return

- Author-repaired `shared-candidate-evidence-packet.md` on [[D1977]]–[[D1981]] without authorising
  implementation. One discriminated ready/cancelled/failed result and literal service options now
  cover invalid FEN, non-terminal truncation, collector failure, invariant failure, waiter
  cancellation and cache publication.
- The scheduler is no longer “portable” by assertion: `messageChannelMacrotaskYield`, default-four
  and maximum-eight collector groups, an independently scheduled timer abort, per-group work and
  total yield overhead are named acceptance bytes. Scope projection is the same partial order in
  its generic type and runtime check.
- Collector groups now distinguish available-empty from unavailable, with `loose_piece`'s
  `invalid_turn_clone` as the permanent control. The held Stockfish score join remains a type-only
  seam; all score/loss/provider behavior is enumerated on D10 and earns no foundation acceptance.
  The five ledger rows remain open until a fresh independent review accepts the amended contract.

## 2026-08-29 — Bounded targets close the background-operation contract

- Author-repaired `bounded-policy-targets.md` on [[D1993]]–[[D1999]] without authorising
  implementation. Exact request/result digests now use domain-separated shipped canonical bytes;
  duplicate calls share one job while cancellation remains waiter-local and only the final waiter
  stops underlying work.
- Made `local/background` representable through an explicit checked producer-latency matrix and
  specified the missing producer-operation registry/call-site census. The exact post-candidate
  `legal-exchange-for-move@1` result is retained instead of being simultaneously required and
  forbidden.
- Closed service defaults, failed/cancelled exits, no-publication cleanup and
  `bounded-target-visited-positions@1`, including root, terminal, identity-loss, repeated-position,
  cap and yield boundaries. Under [[D2029]], this RFC and the candidate-packet RFC now require one
  dependency-free `cooperative-yield.ts:messageChannelMacrotaskYield` rather than two schedulers.
- The dedicated final-review falsifier now tests the repaired contract. Fresh independent review
  still gates implementation; the seven ledger findings remain open until that review accepts it.

## 2026-08-29 — Compare gives recorded evaluations one aligned home

- Closed `CLP-a5`: the opt-in Compare inspector now renders recorded engine values once, in an
  accessible table whose rows are shared ply offsets and whose columns are branches. Missing values
  are explicit. The duplicate per-branch sparklines, repeated trajectory lists and deepest-score
  summaries were removed; machine-withheld comparisons still render no evaluation surface.
- Reconciled two already-shipped arrival items the persistent work register still called queued:
  `ARR-a4` is the production first-rehearsal fallback on Home, and `ARR-a24` is [[D1463]]'s composed
  Appearance preview. The roadmap receipt moved with the three item states.
- Routed [[D2030]] into the learner-module plan before implementation: runtime opening identity,
  the repaired outpost dependency and the shipped move-grade projection must refresh the compiled
  table, while the separate `pawn_safe_square` owner choice remains open. No module declaration or
  protected design intent changed.

## 2026-08-29 — Compare stops drawing one shared position as several boards

- Closed `CLP-a21` and [[D2031]] against the archived N-way comparison contract. The visible
  aligned row now consumes the runtime's exact `ComparisonRow.groups` partition: one cell names
  every attempt still occupying that recorded node, while ended branches remain visible as
  explicit absence cells.
- Added a three-branch nested-fork fixture whose first aligned row is `[[X,Y],[Z]]`; it requires
  two position cells, one shared marker and no absent branch. Production browser comparisons pin
  the two- and three-attempt shared-fork rendering, so prose alone cannot satisfy the contract.
- The Evidence inspector deliberately remains branch-columnar: evaluation, source attribution
  and recorded facts belong to each attempt even while the visible chess position is shared.

## 2026-08-29 — Semantic validation becomes an executable authority draft

- Refreshed the D1711 and D1713 research through repository-owned
  `make semantic-validation-closure semantic-validation-matrix` targets. The substantive defect is
  unchanged: all 67 declarations still manufacture 134 non-resolving validation labels. Later
  foundation harnesses moved literal trace coverage from 54/67 to 66/67, so the dossier, coverage
  matrix and ledger now state the current fact rather than preserving the older count.
- Drafted `rfc/semantic-validation-authority.md` from the completed exploration gate. It separates
  a total six-arm profile, data-only cases, closed production operations and generated receipts;
  binds implementation/input/result identity; and makes research-only visibility distinct from
  learner eligibility. All 67 events require emitter positives, semantic negatives, mirrored cases
  and current imported-population execution; only avoidance/reply-breadth require a complete-
  alternative arm, and external labels remain disagreement evidence.
- The measured migration remains honest debt: 39 emitter positives and 10 emitter negatives can be
  migrated after acceptance, 13 predicate-only negatives still need elevation, zero event-level
  orientation cases exist, and seven avoidance events remain withheld on D1716/D1717. No product,
  collector, consumer or content byte changed; fresh independent buildability review gates
  implementation.

## 2026-08-29 — Provider exchange returns on composed rather than isolated contracts

- Ran all three stable provider author targets green, then added the independent
  `make provider-exchange-fourth-review` composition check. It reproduces three blockers that the
  earlier fixtures could not see because they tested each layer alone.
- [[D2032]] shows that the locally computed Syzygy `outside_domain` value cannot inhabit a success
  arm that always requires captured provider response bytes and an acquisition receipt. [[D2033]]
  records the missing run/provider authorization and crossed-operation contract on subject
  availability. [[D2034]] shows that projection-only unique source requirements collapse two exact
  uses of the same provider, already visible in Story's before/after evaluation shape.
- Returned `provider-exchange-and-execution` without changing production, schema, pack, content or
  protected intent bytes. Review, bots, theory and provider-backed collectors remain blocked from
  creating private substitutes; the repair order is occurrence identity, access/binding, then
  local-versus-provider Syzygy outcomes.

## 2026-08-29 — Provider exchange fourth return is author-repaired

- Replaced the three fourth-review reproductions with able-to-fail author contracts. Non-local
  leaves now retain occurrence and mapped operation, while a closed server resolver binds each leaf
  to an exact recorded/build/provider subject. The current Story before/after evaluation is an
  explicit two-Stockfish-occurrence migration rather than a hypothetical test only.
- Closed the API/provenance split: public availability is a bounded `requireRead`-authorized
  run-event operation with no arbitrary provider-digest probe; Syzygy outside-domain is a local
  preflight result before cache/queue admission and structurally carries no acquisition or cache
  fields. Live in-domain results keep the original same-exchange receipt rule.
- Author self-review found and repaired [[D2035]]/[[D2036]] before handoff. Separate monotonic and
  wall authorities govern deadlines versus receipts, and descriptors cannot stamp retrieval time.
  Removing the module subject avoids reversing the foundation dependency into not-yet-landed
  modules/presets; those consumers apply their own ceilings downstream.
- All four focused targets pass at 9 + 7 + 9 + 5. Production, schema, pack, content and protected
  intent remain unchanged; fresh independent review still gates implementation.

## 2026-08-29 — Promotion-race collectors stop accepting undeclared and crossed evidence

- Reconciled the held `semantic-collectors` promotion pair with the executable D1699/D1700
  research. The previously accepted text still allowed raw-FEN participant recomputation and a
  piece-count-only Syzygy join, even though the harness proves an a2/b7 false race and a category
  borrowed from another four-piece position.
- Geometry now derives only from a sealed complete pawn-contact reading and retains exact declared
  passed-pawn identities. Outcome now derives from exact legal moves plus one same-FEN recorded or
  live Syzygy delivery. The local outside-domain fact, provider absence and missing input remain
  separate; no pawn-specific provider authority is permitted.
- Updated the disposable harness to the honest `no_opposing_passed_clear_paths` vocabulary and
  strengthened the RFC with an explicit six-arm promotion criterion. The original twelve compiled
  projections are unchanged. Fresh independent review gates geometry; the repaired but still-draft
  provider contract additionally gates the outcome projection and 14/14 closeout.

## 2026-08-30 — Gate-F capability contract second return is author-repaired

- Repaired all eleven repeat-review blockers [[D1982]]–[[D1992]] at specification tier. Capability
  ids and versions now have one exact algebra; applicability and F1/resolved-content sources have
  complete generated authorities; constant roots are representable; strict schema annotations use
  one compiler authority; and `requires` is canonical artifact data rather than set-only prose.
- Re-derived all 20 shipped `refused` rows instead of copying their label. The typed migration now
  distinguishes lawful product refusal, negative evidence, unmeasured work, unanswered decisions,
  missing implementation, withdrawal, an owner-reversed active row and a split deprecation/active
  row. No implementer is asked to manufacture the missing authority.
- Broke the F3/claim-anchor cycle: F3 registers only a generic structured identity; the later
  sidecar RFC owns fields, dispatch, migration and refusal codes after F3 acceptance. Focused author
  contracts pass at 7/7 and 11/11. Production, schema, packs, content and protected intent remain
  untouched; fresh independent review and the [[D560]] corpus hold still gate lane 0.30.

## 2026-08-30 — Learner-module evidence assembly is reconciled to the current foundation

- Re-ran the complete non-hint module/evidence join through the repository-owned
  `make module-evidence-assembly` target. The stale 186-pair image is replaced by 206 confirmed
  pairs: 204 compiled and two honestly absent. The unresolved `pawn_safe_square` ruling is an
  explicit one-pair fork producing 207 rather than a hidden assumption.
- Folded in the landed dependency facts from [[D2030]]: requested Sight retains owner-ruled
  `outpost`; Theory Breadcrumb consumes runtime `theory.opening.current_endpoint@1` and rejects the
  authoring-only provenance record; both grade uses are compiled.
- Executed [[D1870]]'s consumer closure as an exact 7×3 matrix. Deflection, attraction, both
  clearance forms, interference, check zwischenzug and overload exploitation each bind to
  Post-commit Nudge, Review Map and Full Inspector; the two lower-level operand events remain out.
- Confirmed the execution gap itself still stands. The manifest stores producer implementation
  strings and the compiled contract has no producer-operation registry; the live guidance packet
  remains a partial assembler. The refreshed dossier requires typed source receipts, exact
  timing subjects, shared collection and distinct no-witness/unavailable/broken-boundary outcomes.
- Eight able-to-fail arms pass. No production, schema, content, pack, protected intent or returned
  RFC byte changed. Next: the module author consumes this handoff after the recorded-path/provider
  dependencies are accepted; implementation remains unauthorized until fresh review.

## 2026-08-30 — AssistanceConfig process register returns on CI and source closure

- Fresh-review reproduction keeps every prior D1916/D2009–D2012 repair intact, then crosses the
  promised committed transition through the actual governance job. [[D2037]] fires: the checkout is
  shallow, `HEAD^1` is not guaranteed, and the RFC's exact file boundary excludes the workflow
  change required to make its first-parent contract executable.
- [[D2038]] fires at the other end of the transition. The author model accepts a caller-projected
  changed-symbol list and has no closed assistance codec/persistence authority census. A parallel
  browser `validV5` can therefore be added outside the three reported tokens while criterion 15
  claims it is refused.
- Returned `assistance-config-register` rather than implementing a false-green C9. Four executable
  reproductions pass through `make assistance-register-final-review`; prior author targets remain
  separate. No runtime, web, schema, storage, content, archive or protected intent byte changed.
- Next: author derives the complete authority population from production import/source roots and
  adds fail-closed first-parent acquisition to CI scope; fresh review then gates C9 implementation,
  the semantic-convention register, durable convention receipts and recorded semantic paths.

## 2026-08-30 — AssistanceConfig third-return repair closes both specified seams

- [[D2037]] is repaired at the author-contract tier: C9's exact implementation boundary includes
  the governance checkout at `fetch-depth: 2`, production explicitly resolves `HEAD^1`, and absent
  required history is fatal rather than silently dropping the committed arm.
- [[D2038]] is repaired at the author-contract tier: the claim transition derives its complete
  source delta from the `AssistanceConfig` fields, runtime codec and browser persistence-reader
  closure. The v5 reservation is four tokens, and an omitted parallel validator, migration or
  namespace reader fails even when a caller reports only the expected tokens.
- Six author arms replace the four return reproductions behind
  `make assistance-register-final-review`. No product, schema, storage, content, archive or
  protected intent byte changed. Fresh independent review remains the next gate; C9 implementation
  and the semantic-convention successor remain unauthorised until acceptance.

## 2026-08-30 — Semantic-validation authority becomes buildable at the author tier

- Re-ran D1711/D1713: 67 current declarations still manufacture 134 labels with zero executable
  referents; only 39 have emitter positives, ten emitter negatives and none emitter-level mirrors.
- The fresh buildability self-audit recorded [[D2039]]–[[D2043]]: no named population traversal,
  unrepresentable abstention, an ambiguous mirror map, child-operation validation without
  application-retention proof, and a frozen landing count conflicting with the held promotion-race
  event.
- The amended RFC now binds the authenticated 108-game/579-decision CC0 fixture to edge, path and
  complete-alternative traversals; uses a closed completed/unavailable result; defines a total
  mirror leaf walk; requires direct application reach or exact projection-multiset retention; and
  derives root count from the live catalogue.
- `make semantic-validation-author-contract` passes 6/6 and both source instruments remain green.
  No product, schema, content, collector or protected intent byte changed. Fresh independent review
  remains mandatory before Slice A implementation.

## 2026-08-30 — Learner-module dependency image reaches the measured 206-pair target

- Author-amended [[D1870]]/[[D2030]] in `module-registration`: Theory Breadcrumb now consumes the
  runtime opening endpoint and permanently refuses the authoring provenance record; requested Sight
  restores owner-ruled `outpost`; both grade uses compile.
- Added the seven observed semantic tactics to Post-commit Nudge, Review Map and Full Inspector —
  21 pair-keyed consumer rows — while keeping defender operand events out of learner meaning.
- The exact non-hint image is 206 declared / 204 compiled / 2 awaiting. `pawn_safe_square` is one
  isolated non-blocking owner fork producing 207/205 if later ruled in.
- `make module-evidence-assembly` passes 9/9 and now checks the RFC against the source-derived
  population. The broader [[D1863]]–[[D1869]] production-join returns remain open; no product,
  schema, collector, seat or protected intent byte changed.

## 2026-08-30 — Learner-module production join repaired at the author tier

- Author-amended all seven repeat-review returns [[D1863]]–[[D1869]] without declaring acceptance:
  typed untrusted requested-help input with server re-clamping; exact pair/form presentation;
  total producer assembly with typed receipts; real pre-/at-commit disclosure accounting; raw
  arrow-consumer retirement without losing the Advanced clamp; literal capability sets; and
  authoritative square/UCI/checkpoint/rung validation before producer work.
- The owner-confirmed source join derives 117 unique compiled projections beneath 205 compiled
  consumer pairs, within a 207 declared / 2 exact-awaiting image. `pawn_safe_square` is exactly one
  requested-Sight pair.
  Assembly executes by projection/subject once; admission and presentation remain consumer-specific.
- [[D2044]] records the stale disposition authority: 23 accepted projections carry dispositions,
  not 16, and the old list named one false member while omitting eight live members. The permanent
  instrument now derives the exact transfer set from the accepted image and manifest.
- `make module-evidence-assembly` passes 12/12. No registry, route, collector, schema, content,
  archive or protected intent byte changed. Fresh independent review is the next gate.
## 2026-08-30 — intent-presets author repair closes the returned authority gaps

**What landed:** `rfc/intent-presets.md` was author-amended on D1659–D1663 and D1437/D1500.
The owner ruled D1660: named workflows remain literal and opinionated; explicit lower/off choices
may narrow them; any higher raw choice remains configurable but is visibly Custom/Advanced. The
repair adds a typed preference/migration receipt, a single field→module/form effect authority, a
closed server/browser availability receipt, authoritative Campaign entry/resume and two honest
implementation checkpoints. `make intent-presets-author-contract` passes 7/7.

**What changed:** first-use Guided/Support/Analyze can no longer be specified as a silent legacy
fallback; raw switches cannot recreate absent modules or hide wider help under a named pill;
Campaign's actual default/key becomes reachable; zero rendered deliveries cannot discharge module
activation. D1660 is closed by ruling; the technical rows remain author-amended pending review.

**Blocked/next:** fresh independent buildability review. If accepted, implement Checkpoint A and
verify it before Checkpoint B binds real registered module delivery and disclosure logging.

## 2026-08-30 — evidence-presentation repeat-return author repair

**What landed:** the author tier now has a mechanically set-equal plan over the 117 live visual
consumer/projection pairs: 110 exact adapters, six explicit producer-operand repairs and one
selection-only visual-binding removal. The plan names exact parsers, retained paths, component
outputs, live forms and retention assertions. `fact_statement` becomes the sealed fourteenth
component for deterministic recorded/declaration-bound prose without turning it into an authored
claim or a generic text escape hatch.

**What changed:** pending evidence can no longer simultaneously claim a terminal absence. The
presentation lifecycle now shares the provider/module event-head, cursor and disclosure-boundary
decision stamp and rejects each stale dimension independently; it invents no node revision.
`make presentation-binding-census` and `make evidence-presentation-author-contract` are green.

**Blocked/next:** fresh independent buildability review and owner-only [[D1672]] remain before
acceptance. The six producer contracts named by [[D2046]]/[[D2047]] must gain exact operands before
their adapters can land; [[D2048]] removes its false visual forms. No implementation, content,
archive or protected-design byte changed in this author pass.

## 2026-08-30 — bot-policy seven-return author repair

Repaired [[D1970]]–[[D1976]] in `rfc/bot-policy.md` and recorded the author checkpoint at
`planning/platform-alignment/bot-policy/author-repair-2026-08-30.md`. The bot contract now consumes
the shared Maia/Stockfish deliveries, separates returned mass from legal-set equality, seals a
closed set-equal decision derivation, separates deterministic bytes from its request/timing
envelope, rechecks node/branch/event head after provider work, commits no move without Maia, and
consumes one shared candidate packet in Stage B. `make bot-policy-author-contract` is the able-to-
fail checkpoint; fresh independent review and both shared dependencies still gate implementation.
No product/schema/migration/content or protected-design byte changed.

## 2026-08-30 — longitudinal-store six-return author fold

Folded [[D1612]]–[[D1617]] into one normative `rfc/longitudinal-store.md` contract and published
the exact 67-row constructor artifact. The repaired boundary now includes safe durable claims,
exact event-prefix/CAS publication, independent phase/class denominators, all seven transactional
run-write sites, and observed-only imported mainlines pending subject provenance. The prior
two-table synchronous shape is explicitly non-normative history. `make longitudinal-store-author-
contract` is the able-to-fail checkpoint; fresh independent review still gates implementation.
No production schema/migration/worker/API/client/content or protected-design byte changed.

## 2026-08-30 — pack-capability fresh independent return

Independently reviewed the D1982–D1992 author repair and returned `pack-capability-contract` on
[[D2050]]–[[D2054]]. The compatibility regex/version criterion contradicts shipped identities and
the public union; the applicability graph still lacks independent authored bytes and its keyword
cannot map enum members; two evaluator roots remain prose; and `AGENTS.md` is misclassified as
protected intent. `make pack-capability-fresh-review` reproduces all five. No lane-0.30 schema,
pack, digest, product, content or protected-design byte changed; the D560 hold remains whole.

## 2026-08-30 — campaign-core two-horizon author repair

Folded [[D1592]]–[[D1597]], [[D1233]]/[[D1234]] and the measured [[D1695]]–[[D1698]] boundary
into the returned `campaign-core` contract. Run rewards are now typed module/theory/rewind-resource
acquisitions; presets cannot mutate ownership/equipment; authored consumers are checked mirrors of
runtime registries; every reward needs later and boss opportunity on every continuation; prestige
uses the exact completed denominator; abandonment is event-owned; and durable marks/shared-catalog
cosmetics use one idempotent award log with the full account/appliance lifecycle. The RFC now owns
the complete 1.0 Campaign journey and stable-board/access criteria rather than a backend reducer
plus hidden route. `make campaign-two-horizon-author-contract` passes 19/19. Fresh independent
review and named dependencies still gate schema, migration, content, API and UI implementation;
[[D1600]] remains the explicit failure-policy hold.

## 2026-08-30 — pack-capability D2050–D2055 author repair

Repaired the five fresh-review blockers and recorded [[D2055]], found while making applicability
executable: finite literal pointers cannot cover recursive structural/transition expressions or a
reused `$ref`. The RFC now uses one shipped-compatible structured ID/version grammar, total
member-array annotations and schema-aware finite-instance traversal. The independent author
artifact seals the current 103 enums / 300 enum members, 15 discriminated unions / 73 members,
14 unconditional roots and five resolved-reference sites by schema, inventory, mapping and
expanded-authority digests; its public-ID transform is collision-checked and leaves no mapping
choice to implementation. Exact transition/opponent symbols and the protected-design Stockfish
refusal anchor replace prose/agent-guide authorities.

`make pack-capability-closure` passes 7/7, `make pack-capability-repeat-review` 11/11 and
`make pack-capability-fresh-review` 6/6. This is author repair only: fresh independent review still
gates acceptance, lane-0.30 schema/migration/product/corpus work remains forbidden, and [[D560]]
stays whole.

## 2026-08-30 — provider-exchange fresh independent return

Freshly reviewed the D2032–D2036 provider-exchange author repair and returned the RFC on
[[D2056]]–[[D2062]]. The prior occurrence, authorization, local-domain and clock repairs survive,
and all earlier 9 + 7 + 9 + 5 contract arms remain green. The new seven-arm reproduction shows that
structural provider deliveries cannot meet the runtime-forgery criterion; run-head/recorded-item
digests have no byte authority; retention TTL admits absolute and sliding implementations; engine
endpoint/cache identity contains arbitrary strings; the five promised traversals have no named
production door; the Syzygy local projection names both its inner fact and envelope as payload;
and Maia request/application bounds are unspecified.

The exact return is
`planning/provider-exchange-and-execution/fresh-independent-buildability-review-2026-08-30.md` and
`make provider-exchange-fresh-review` passes 7/7 as a blocker reproduction. No provider, schema,
migration, content or learner-surface implementation changed; downstream RFCs remain forbidden
from creating private provider authorities.

## 2026-08-30 — longitudinal-store fresh independent return

Freshly reviewed the D1612–D1617 folded longitudinal-store repair and returned it on
[[D2063]]–[[D2069]]. The earlier six repairs survive, and the author contract remains 10/10 green.
The new seven-arm reproduction proves that the durable key drops semantic sign; the claimed cut
cannot both equal and trail the requested high-water; rebuild can resurrect deleted behavior under
`__legacy`; edge opportunity/share semantics are non-normative; the reader has no exact type; the
four-table DDL promises unnamed indexes and permits corrupt fact ranges at a stale version receipt;
and no production worker lifecycle drains the queue.

The exact return is
`planning/longitudinal-store/fresh-independent-buildability-review-2026-08-30.md`; `make
longitudinal-store-fresh-review` passes 7/7 as a blocker reproduction. No migration, worker,
storage implementation, consumer, content or protected-design byte changed.

## 2026-08-30 — pack-capability second fresh independent return

Re-reviewed the D2050–D2055 pack-capability repair at its landing boundaries and returned it on
[[D2070]]–[[D2076]]. The prior 7 + 11 + 6 arms remain green. The new seven-arm reproduction proves
the required stamp cannot land without the held 92-pack rewrite; judgement-bearing migration plans
are both required to fail and wired into green verify; implementation changes the raw schema the
author artifact seals; the 373-member source/helper dependency closure is unauthored; the new
requirement grammar enters its own applicability walk; one declaration per subject cannot retain
deprecated+active versions; and public ids change under a semantic no-op `oneOf` reorder.

The exact return is
`planning/pack-capability-contract/second-fresh-independent-review-2026-08-30.md`; `make
pack-capability-second-fresh-review` passes 7/7. No schema, capability registry, pack, digest,
migration application, content or protected-design byte changed.

## 2026-08-30 — campaign-core fresh independent return

Re-reviewed the two-horizon campaign repair as one production landing and returned it on
[[D2077]]–[[D2086]]. The prior 19 author/model arms remain green; the new ten-arm reproduction
proves the final seal forbids its own mandatory trailing events, equipment has no durable mutation,
campaign document bytes are not pinned, resource rewards have no charge-fold effect, consumer
closure depends on unnamed returned pack/theory foundations, a module ceiling is applied to unlike
reward families, Review/export trigger the declined origin seam, the route/command family is
incomplete, durable awards have no production issuer, and the test seed is not an authored 1.0
campaign.

The exact return is `planning/campaign/fresh-independent-buildability-review-2026-08-30.md`;
`make campaign-two-horizon-fresh-review` passes 10/10. No schema, migration, campaign content,
storage, endpoint, award, UI or protected-design byte changed.

## 2026-08-30 — bot-policy fresh independent return

Re-reviewed the D1970–D1976 bot-policy repair against the actual shared provider contracts and the
ruled 4×3 roster, and returned it on [[D2087]]–[[D2096]]. The author checkpoint remains green; the
new ten-arm reproduction proves the durable receipt has no non-circular storage home, three profile
ids cannot encode twelve band/family identities, the author fixture forks the shared delivery and
cp/mate score types, the sealed record accepts caller-authored policy outcomes, idempotency omits
writer/derivation operands, mandatory Stockfish contradicts baseline availability, Stage B's
all-legal feature rows cannot compose with bounded Maia, the guard compares against the best
returned rather than best legal move, and below-floor fallback relies on a selected move absent from
the Maia payload.

The exact return is
`planning/platform-alignment/bot-policy/fresh-independent-buildability-review-2026-08-30.md`;
`make bot-policy-fresh-review` passes 10/10. No run schema, migration, provider, selector, roster,
storage, UI, content or protected-design byte changed.

## 2026-08-30 — shared-candidate packet fresh independent return

Re-reviewed the D1977–D1981 packet repair as the common evidence-population foundation and returned
it on [[D2097]]–[[D2104]]. The prior 11 + 4 + 5 checks remain green; the new eight-arm reproduction
proves request/result and wide-projection scopes are uncorrelated, the provider-free landing
requires a wrong-arity provider type absent from production, the public service has no exported
construction boundary, projection ids do not define callable collector groups, unique in-flight
jobs bypass both cache bounds, injected scheduler rejection escapes the result algebra, FEN-only
requests cannot enforce the standard/variant refusal, and receipt identity omits the unavailable
collector results that created abstentions.

The exact return is
`planning/evidence-foundation-ux/shared-candidate-packet-fresh-independent-review-2026-08-30.md`;
`make candidate-packet-fresh-review` passes 8/8. No runtime packet/cache, provider handoff, selector,
schema, content, learner surface or protected-design byte changed.

## 2026-08-30 — bounded-policy targets fresh independent return

Re-reviewed the D1993–D1999 bounded-target repair as the exact local counterfactual foundation and
returned it on [[D2105]]–[[D2111]]. The prior semantic, type, cancellation and digest repairs
survive. The new seven-arm reproduction proves the retained threat cannot be joined to its source
position, the registered background service is an erased interface with no runtime callable, the
tracked identity payload type is undeclared, per-candidate limits permit 12.8 million positions in
one admitted batch, the non-universal positive return admits no refutation, product construction
can replace the scheduler and has no shutdown, and batch result counts have no aggregation rule.

The exact return is
`planning/bounded-policy-targets/fresh-independent-buildability-review-2026-08-30.md`; `make
bounded-target-fresh-review` passes 7/7 as a blocker reproduction. The stale
`bounded-target-repeat-review` target was repaired under [[D2112]] to assert the current repaired
contract rather than require old defects. No runtime collector, evidence declaration, scheduler,
consumer, schema, content, learner surface or protected-design byte changed.

## 2026-08-30 — AssistanceConfig register second fresh independent return

Re-reviewed the D2037/D2038 assistance-register repair against the actual v4 browser persistence
code and the already-specified v5 product transition, and returned it on [[D2113]]–[[D2117]]. The
two-commit/fail-closed parent repair survives. The new five-arm reproduction proves the process-only
landing requires a runtime codec that does not exist while forbidding product changes, the
persistence closure omits `saveAssistance`, fixed-head key/migration/parser drift does not move the
resource digest, the four-token v5 claim omits required defaults/permissions and its consumer
discharge, and the promised transitive TS/Svelte closure has no executable graph grammar.

The exact return is
`planning/assistance-config-register/second-fresh-independent-buildability-review-2026-08-30.md`;
`make assistance-register-second-fresh-review` passes 5/5. The prior 7 + 7 + 6 targets remain
green. No C9 checker, workflow, register, claim, runtime, web, schema, content, archive or protected
design byte changed.

## 2026-08-30 — expression-census content-gate stabilization

Full verification exposed [[D2118]]: the declaration opt-in/read-only test performed three fresh
whole-corpus censuses inside a 30-second test and timed out at 36.4 seconds. A clean tier rerun then
timed out nine unrelated corpus files and drained for 295 seconds, proving unbounded file workers
were multiplying the same synchronous corpus work. The content tier now has a fixed two-worker
pool; the test snapshots tracked content/schema/package bytes around the two existing module
reports and crosses omitted versus explicit `declarations:false` on an isolated empty corpus. The
separate 60-second whole-corpus determinism contract remains intact; no timeout was raised and no
product/content byte changed.

The bounded rerun passes 16 files / 172 tests in 173.84 seconds. [[D2119]] records the remaining
efficiency debt separately: repeated immutable corpus setup/import dominates the stable tier and
needs one read-only shared authority without weakening isolation or test-tier truth.

## 2026-08-30 — Module-registration fresh independent return

Fresh-reviewed the D1863–D1869 author amendment from four real production boundaries: module
request, collector execution, F1 binding and rendered seat. The owner-confirmed 207-pair acceptance
image remains internally consistent and the prior 12-arm assembly harness stays green, but the
image is not yet an executable join. [[D2120]]–[[D2126]] record seven independent blockers: no
literal callable population behind the claimed 117-projection plan; no compiler for all mandatory
F1 binding fields/forms; no enforcement for words or marks after presentation fan-out; unbounded,
unpaged whole-run Review; no `solo`/`learner` role projection; an unrepresentable per-family
Inspector empty state; and no exact input DAG for 64 derived pair occurrences.

The exact return is
`planning/learner-modules/fresh-independent-buildability-review-2026-08-30.md`; `make
module-registration-fresh-review` passes 7/7 as a blocker reproduction. No module declaration,
consumer, binding, assembler, route, presenter, seat, runtime behavior, schema, content, archive or
protected-design byte changed.

## 2026-08-30 — Intent-presets fresh independent return

Fresh-reviewed the D1659–D1663/D1437/D1500 author amendment through the real localStorage writers,
the returned module-delivery contract and the returned Campaign owner. The repair correctly
distinguishes unset, explicit, migrated and invalid preference states, but the resulting compiler
still cannot represent one end-to-end authoritative request. [[D2127]]–[[D2134]] record eight
blockers: an undefined v2 field type; duplicated uncorrelated preset identity; client-only versus
server-authoritative compilation; higher Custom values whose modules remain absent; suppression
records missing requested/effective/reason; effects with no source-dependency join; live legacy
writers outside the migration census; and an undefined Campaign receipt owned by a returned RFC.

The exact return is
`planning/intent-presets/fresh-independent-buildability-review-2026-08-30.md`; `make
intent-presets-fresh-review` passes 8/8 and the prior seven author arms remain green. No v2 key,
compiler, permission clamp, campaign receipt, pill/footer, module activation, production, schema,
content, archive or protected-design byte changed.

## 2026-08-30 — Evidence-presentation fresh independent return

Fresh-reviewed the D1862/D1668 author amendment against the live 117-pair census, component form
capabilities, current consumer declarations and the recorded sentences checkpoint A must preserve.
The pair set and abstention lifecycle repairs survive, but they are not an executable adapter
population. [[D2135]]–[[D2140]] record six blockers: no component→form assignment; no literal
visual-consumer classification; a scope fence that forbids six required operand repairs plus one
binding removal; no fact-statement renderer registry; no abstention question/reason population;
and an uncounted `run.record.consequence` operand gap for learner outcome or plies/objective state.

The exact return is
`planning/platform-alignment/evidence-presentation/fresh-independent-buildability-review-2026-08-30.md`;
`make evidence-presentation-fresh-review` passes 6/6 and the prior five author arms plus lifecycle
typecheck remain green. [[D1672]]'s owner-tier component-layer mirror still blocks acceptance. No
component, adapter, wire receipt, label, surface, manifest, schema, content, archive or protected
design byte changed.

## 2026-08-30 — Semantic-collectors promotion amendment fresh independent return

Fresh-reviewed only the held D1699/D1700 promotion pair against the runtime evidence seal, the
literal F1 graph, and the draft provider source shapes. The measured a2/b7 false-positive and the
recorded/live same-FEN requirement remain valid, but the repaired boundary cannot yet implement
them truthfully. [[D2141]], [[D2142]] and [[D2143]] record three blockers: pawn-contact evidence is sealed by a
shape-only adapter that accepts fabricated passed rows; the outcome's retained `source` has no
declared discriminated type or total recorded/live mapping; and the graph omits the sole local
tablebase-domain fact while promising a distinct grounded outside-domain abstention.

The exact return is
`planning/evidence-foundation-ux/semantic-collectors-promotion-fresh-review-2026-08-30.md`;
`make semantic-collectors-promotion-fresh-review` passes 3/3. The original twelve implemented
Wave-C projections remain accepted and untouched. Neither promotion id landed; no provider,
schema, content, archive or protected-design byte changed.

## 2026-08-30 — Exact pawn-contact source sealing

Closed the shipped half of [[D2141]] at the shared evidence boundary. `rules.pawn.reading.contacts@1`
no longer earns an exact seal from five matching property names: its adapter now requires the exact
field set, recomputes `pawnContactsReading(fen)`, and compares the complete canonical payload before
declaration. Negative fixtures cross extra fields, a mismatched FEN, false passed status, false
blockers, a forged pawn identity and an absent FEN. The promotion-amendment review instrument was
updated so it continues to fail only on the still-live constructor bypass. The amendment remains
returned on that constructor identity plus [[D2142]] and [[D2143]]; no promotion projection, schema,
content, archive or protected-design byte changed.

## 2026-08-30 — Declared-evidence value-authority audit

Opened and completed [[D2144]]'s research arm after D2141 exposed a class boundary. The executable
population contains 74 public generic object adapters across four different trust models; 50 have
compiled consumer bindings. Twenty rules/position-exact adapters accept caller payloads after only
operand-name checks, twelve of those are bound, and three bound derived/position-exact rows make
the immediate exact position population fifteen. Four same-key false readings receive seals but
have no consumer today; an impossible `e2e4`/unchanged-FEN/`rook_captured` castling-loss event is
sealed and admitted to `research.semantic_selection@1`. The repaired pawn-contact recomputation is
the working negative control.

The result narrows rather than sensationalizes the risk: current missing bindings protect several
readings, but Phase 3 exists to remove that protection. The successor contract must distinguish
computed, derived, recorded/provider and authored value authorities before ordinary modules,
Review, bots, packs or longitudinal state consume the facts. D1934's extra-key repair remains
necessary and insufficient. `make evidence-seal-audit` passes 4/4. No producer, projection,
binding, schema, content, archive or protected-design byte changed.

## 2026-08-30 — Rules/position-exact grounding taxonomy

Completed [[D2145]]'s 20/20 review before drafting the value-authority contract. The initial
finding narrowed: convention dependence does not by itself make a position computation inexact.
Nine rows are literal rule totals; six are complete rule computations that retain
`position_rules/exact` while gaining direct convention closure; phase and named-structure are
product classifiers; endgame, pivotal markers and structural predicate results combine unlike
authorities and require split or derived identities. Twelve of the twenty already have consumer
bindings.

The executable review is set-equal to the live generic-adapter population and pins the 9/6/2/3
partition plus the bound subset. It also exposes why metadata-only relabelling is insufficient:
named-structure declares only `provenanceNote` while its real payload carries id/name/provenance;
endgame attaches uncited technique candidates to a material class; pivotal combines rule, run and
human-model facts; structural-result can be minted apart from its authored input. The successor
must compose with semantic-convention provenance rather than invent a second registry. `make
evidence-seal-audit` passes 4/4. No production projection, adapter, binding, schema, content,
archive or protected-design byte changed.

## 2026-08-30 — Evidence value-authority RFC drafted

Drafted `rfc/evidence-value-authority.md` from [[D2144]]/[[D2145]] after the exploration gate closed.
The contract does not patch the impossible castling event alone: it removes all 74 root-exported
caller-payload adapters through four authority shapes (computed, derived, sealed source receipt and
registered authored authority), one package-private mint and a set-equal migration. It preserves
the 9 literal + 6 exact-under-convention distinctions, versions/reclassifies phase and named
structure, and splits endgame, pivotal and structural-result authorities before factory assignment.

The draft is explicitly dependency-blocked on semantic-convention provenance, provider exchange
and semantic-validation authority. Its 24 criteria forbid compatibility payload adapters, generic
mint APIs, uncited endgame-technique rendering, mixed pivotal grounding and caller-supplied derived
output. A disposable author contract re-derives 74 adapters, the 20-row partition, all nine
successor ids, all four factory shapes, dependency/CI closure and claims-none reasoning; `make
evidence-value-authority-author-contract` passes 5/5. No implementation, production projection,
adapter, binding, schema, content, archive or protected-design byte changed.

## 2026-08-30 — Evidence mint-route census correction

Corrected [[D2144]]'s first population boundary before review and recorded the class as [[D2146]].
The original adapter-name regex required the `Evidence` suffix and therefore missed the bound
generic `declareEvidenceReferenceResolution` export: 74/50 corrects to 75 generic adapters / 51
bound. Expanding all sixteen specialized/dynamic operations produces 116 further branches, so the
complete production boundary is 191 mint routes over 187 distinct projection ids. Four projections
have duplicate routes; six of the 193 manifest projections have no route, of which only retired
pawn-count is intentionally factory-less.

The successor RFC now requires a literal 191-route migration, duplicate collapse and a factory plus
independent profile for every non-retired final projection. Honest emptiness is represented by an
explicit typed unavailable result, not absence of a factory. This correction also replaces an
impossible cross-module capability claim with one runtime-owned mint module and narrows the private
receipt to what it can prove: verified input/source digests at construction plus payload-digest
coherence at consumption. No production projection, adapter, binding, schema, content, archive or
protected-design byte changed.

## 2026-08-30 — Literal evidence mint-route receipt and execution-reach correction

Landed D2146's checked-in 191-row author receipt at
`planning/evidence-foundation-ux/evidence-value-authority-route-map.json`. Every current route now
names its old operation, exact projection, target projection-specific factory symbol, factory
shape, authority inputs, dependency, manifest producer implementation, disposition, bindings and
production use sites. The joined population remains 191 routes / 187 current projections / four
duplicate projections / six no-route declarations, and the author contract refuses unresolved
authority-input placeholders. `make evidence-value-authority-route-map` and `make
evidence-value-authority-author-contract` pass.

The first execution pass was wrong and is retained as [[D2147]] rather than silently overwritten.
It counted only `adapter(...)` calls, missed callback use such as
`.map(declareNamedStructureEvidence)`, and falsely reported 25 export-only routes including 19 bound
rows. The replacement parses imports, aliases, namespaces and identifier/callback use once per
production source file. It finds 184 used routes and seven export-only routes. Two unused routes
are redundant Maia/Syzygy paths whose projections are live through `declareLivePacketEvidence`;
the other five are unbound inspector-only foundations. Zero bound projections lack a production
mint use, and the receipt now fails if that set becomes non-empty. No production evidence,
projection, binding, schema, content, archive or protected-design byte changed.

## 2026-08-30 — Provider-exchange D2056–D2062 author repair

Repaired the seven seams from the fresh independent provider-exchange return without changing
production code. The RFC now requires scheduler-owned runtime seals for acquisition, delivery and
local-domain values; one branded run-prefix/evidence-item/subject digest authority resolved only
inside an authorized run; absolute non-refreshing retained TTL; closed endpoint, engine and cache
identity images; five named process-local operator CLI traversals; one whole sealed Syzygy local
payload; and refuse-only Maia request/application semantics tied to live engine authorities.

The new `make provider-exchange-author-repair` contract passes 7/7. The earlier 9 + 7 + 9 + 5
provider contracts remain green. The historical `make provider-exchange-fresh-review` reproduction
now fails all seven arms, which is the intended inversion; it was not weakened or rewritten. Exact
repair and verification are recorded in
`planning/provider-exchange-and-execution/author-repair-2026-08-30.md`. The RFC remains draft,
implementation remains forbidden, and a new independent buildability review is next. No provider,
schema, pack, content, archive or protected-design byte changed.

## 2026-08-30 — Semantic-collectors promotion D2141–D2143 author repair

Repaired the held promotion pair at RFC tier. Geometry now asserts and retains the exact sealed
pawn-contact producer/projection/version through one input/output derivation receipt. Outcome now
has a whole-item recorded/live source union with total mappings, plus a third literal
geometry/tablebase-domain path and a closed available/outside-domain/provider/input result algebra.
The local-domain request digest must reproduce from the geometry FEN; provider failure never
becomes declared chess evidence.

`make semantic-collectors-promotion-author-repair` passes 3/3 and the original
`make promotion-race-contract` research controls pass 6/6. The historical fresh-return harness now
inverts D2142/D2143; its D2141 arm still inspects the deliberately unimplemented disposable helper,
which is recorded rather than weakened. Exact handoff:
`planning/evidence-foundation-ux/semantic-collectors-promotion-author-repair-2026-08-30.md`.
Projections 13–14 remain held for fresh review, and the outcome additionally waits on accepted and
implemented provider exchange. No production collector, projection, adapter, binding, schema,
pack, content, archive or protected-design byte changed.

## 2026-08-30 — AssistanceConfig register D2113–D2117 author repair

Repaired the returned process RFC without changing product bytes. The register now derives one
phase-aware TS/Svelte authority graph over the AssistanceConfig shape, legacy/runtime codec,
migrations, shared storage key, reader, writer, serializer, constructors, permissions and Advanced/
run projections. Bootstrap validates the actual v4 local migrator; v5 must delete it for the sole
runtime codec. Graph bytes join contract identity, so key/default/parser/serializer/consumer drift
cannot hide at a fixed head.

The live v5 reservation expands from four guessed symbols to the exact ten-node graph delta,
including `saveAssistance`, `SILENT_ASSISTANCE`, `permittedAssistance`, the Advanced projection and
both deleted legacy operations. `make assistance-register-second-author-repair` passes 8/8; the
historical `make assistance-register-second-fresh-review` now fails all five arms, the intended
inversion. Exact receipt:
`planning/assistance-config-register/fourth-return-author-repair-2026-08-30.md`. Fresh independent
review still gates implementation; no runtime, web, schema, storage, content, archive or protected
design byte changed.

The first maintained-suite run also found [[D2148]]: D2009 and D2037 still asserted the obsolete
four-token claim and therefore rejected the stronger contract. Their current-state fixtures now
assert the ten-node TS/Svelte delta; 7 + 6 + 8 maintained arms pass. The separate D2113 historical
return harness remains unchanged and red 5/5, preserving the able-to-fail evidence rather than
turning it into a permanent normal-gate failure.

## 2026-08-30 — Shared candidate packet D2097–D2104 author repair

Rebuilt the returned packet boundary as one scope-safe, constructible and bounded service. Request,
result and projection now share one literal generic scope; the unavailable provider handoff is
removed whole; the product factory fixes legal/collector/scheduler authorities; thirteen callable
registry declarations own outputs/dependencies/cardinality; unique jobs have bounded FIFO admission,
absolute deadlines and idempotent shutdown; scheduler/collector failures are closed; standard rules
identity is explicit; and exact sealed collector outcomes authorize each abstention.

`make candidate-packet-second-author-repair` passes 8/8 and the unchanged historical
`make candidate-packet-fresh-review` now fails all eight arms, the intended inversion. Exact receipt:
`planning/evidence-foundation-ux/shared-candidate-packet-second-author-repair-2026-08-30.md`.
Implementation, Support/Review/bot consumption and provider behavior remain unauthorized pending
fresh review and downstream RFCs. No production, schema, content, archive or protected-design byte
changed.

The maintained final-review target initially rejected the stronger scope-correlated signature
because it still required a non-generic `CandidatePopulationResult`. [[D2149]] records the test
contract defect: the current-state assertion now requires `CandidatePopulationResult<S>`, while
the separate historical eight-arm return remains unchanged and red by design.

## 2026-08-30 — Bounded-policy targets D2105–D2111 author repair

Repaired the returned local target-policy operation without touching production. Threat evidence
now has one FEN-owning constructor whose private pass-anchor authority distinguishes byte-identical
foreign positions; tracked source/promotion/traversal types are literal; the registered producer is
one exported concrete service with fixed scheduling and idempotent shutdown; candidate work is
joined to a deterministic 100,000-position whole-job cap; and return/refutation plus batch-count
semantics are total.

`make bounded-target-second-author-repair` passes 7/7. Maintained 18 + 5 + 13 contracts and their
TypeScript fixtures pass. Historical RFC-shape arms D2106–D2111 invert; D2105 correctly stays green
against unimplemented production and must invert on implementation. Exact receipt:
`planning/bounded-policy-targets/second-author-repair-2026-08-30.md`. Fresh review still gates
implementation; no provider, consumer, schema, content, archive or protected-design byte changed.

The maintained pass found [[D2150]]: D1963/D1997/D1998 pinned superseded prose and the unsafe old
options type. Their current-state assertions now require the stronger source, identity and fixed-
scheduler limits contract; historical review evidence remains unchanged.

## 2026-08-30 — Bot policy D2087–D2096 second author repair

Repaired the returned bot operation as one boundary rather than ten local patches. One event now
owns a non-circular decision+operation envelope; the catalog has twelve exact family×band
identities; the disposable bot contract imports the provider author's exact shared delivery and
cp/mate authority; a sealed run-root legal map keeps baseline available without optional Stockfish;
the guard references the best all-legal row and abstains honestly on mate/mixed domains; one sealed
compiler owns all transforms and sampling; pre-provider and commit identities cover every write
operand; Stage B retains the bounded Maia intersection; and below-floor pages use the declared
seeded sampler.

`make bot-policy-author-contract` passes 11/11 and `make provider-exchange-author-repair` passes
8/8. The unchanged historical `make bot-policy-fresh-review` fails all ten blocker assertions, the
intended inversion. The first author run found and fixed a canonicalization defect: hashing an input
object rather than an explicit image made the mere presence of a previous envelope alter the
pre-provider digest. Exact receipt:
`planning/platform-alignment/bot-policy/second-author-repair-2026-08-30.md`. Fresh review still
gates implementation; no production, schema, migration, endpoint, storage, roster, content,
archive or protected-design byte changed.

## 2026-08-30 — Campaign core D2077–D2086 second author repair

Repaired the returned campaign contract as one atomic operation boundary rather than ten local
patches. Final-node terminality is derived from the exact nine-layer route; one event and database
transaction own the seal, both income sources, unlock, auto-equip, terminal state and durable
awards. Campaign definition bytes/digest survive catalogue removal, module/theory/resource
families have separate projections, loadout is writable, consumer compilation names its pack and
theory authorities, Review/export/restore use exact run origin, and the authenticated journey is an
eleven-operation revision/idempotency family. The physical disposable fixture is distinct from the
human/owner-authored official 1.0 campaign obligation.

`make campaign-two-horizon-author-contract` passes 25/25. The unchanged historical
`make campaign-two-horizon-fresh-review` fails all ten old blocker assertions, the intended
inversion. Exact receipt: `planning/campaign/second-author-repair-2026-08-30.md`. Fresh review still
gates acceptance and implementation; no production, schema, migration, official content, archive
or protected-design byte changed.

## 2026-08-30 — Longitudinal store D2063–D2069 second author repair

Repaired the returned personal-observation foundation as one durable projection operation.
Semantic and base-family source signs now survive registry, admission, keys and reads; a second
literal artifact pins every runtime sign subset. Opportunity, occurrence and alternative share now
come from the complete real legal-edge/event population with duplicate, all/none/mixed, forced and
unavailable arms. SQLite persists immutable claimed N apart from requested M and executes the
publication CAS. Account deletion durably suppresses rebuild for retained shared runs instead of
resurrecting behavior under `__legacy`. Literal DDL names four tables, one run disposition, five
indexes and closed row invariants. One authenticated snapshot union serves future style, skills,
Review and campaign consumers; one bounded provider-free worker and once traversal own production
reach.

`make longitudinal-store-author-contract` passes 19/19. The unchanged historical
`make longitudinal-store-fresh-review` fails all seven old blocker assertions, the intended
inversion. Exact receipt: `planning/longitudinal-store/second-author-repair-2026-08-30.md`. Fresh
review still gates acceptance and implementation; no production migration, worker, API, consumer,
content, archive or protected-design byte changed.

## 2026-08-30 — Longitudinal final-registry cost discharge

Ran the preregistered D1405 and D1405b instruments through `make longitudinal-store-cost` against
committed final-registry inputs. Complete-prefix p95 was 13.08 / 26.45 / 47.29 seconds at 20 / 40 /
80 plies. The 25-game arm evaluated 50,586 edges across 1,750 plies and took 828.04 seconds. The
single-decision arm measured 531.5 ms p50 / 872.2 ms p95 overall and 902.7 ms p95 in middlegames;
SQLite publication was 0.128 ms p95. The preregistered verdict is
`REFUSE_NATIVE_INCREMENTAL`: collection/legal-alternative expansion owns the failure, not storage.

Revision 1 therefore keeps reads on stored transaction-fixed snapshots and all projection work in
the bounded background worker. Moving it into a request requires a later RFC and new
preregistration. Canonical receipts are
`planning/longitudinal-store/d1405-longitudinal-cost-results.{json,md}` and
`planning/longitudinal-store/d1405b-single-decision-results.json`. The measurement aggregator now
removes successful intermediate arm fragments so its ordinary Make target leaves no scratch-file
residue.

## 2026-08-30 — Pack capability D2070–D2076 author repair

Repaired the second fresh return as one staged schema/capability operation. D560 forbids the held
92-pack apply, while D1058 forbids a permissive missing stamp; the contract now resolves both with
an internal 0.27 reader limited to the exact author-sealed path+raw-digest catalogue population and
a required-stamp 0.30 reader for every new/external document. The legacy arm and allowlist retire
with the later atomic corpus apply; no 93rd member is legal.

Plan shape now remains green with honest judgement debt while a separate readiness gate blocks the
applier. A six-operation author patch produces the exact 83,841-byte 0.30 schema image. The
applicability artifact adds base schema-member authority, seven interpreter-root families,
transitive TypeScript symbol closure and exact metadata exclusions. Declaration identity is
subject+version with retained acyclic history. Stable public ids use semantic
owner/discriminator/member and distinguish the two `kind=quantified` forms by `over.files` versus
`over.squares`, never by branch ordinal.

`make pack-capability-closure` passes 7/7, repeat review 11/11, fresh review 6/6 and the repaired
second-fresh contract 7/7. Exact receipt:
`planning/pack-capability-contract/third-author-repair-2026-08-30.md`. This is author repair only:
no schema, production registry, pack, sidecar, digest, content, archive or protected-design byte
changed. Fresh independent review still gates acceptance and implementation; D560 still gates the
corpus apply.

## 2026-08-30 — Theory↔drill current-join author repair

Repaired [[D1879]]–[[D1886]] after the independent buildability return. Applicability now consumes
the literal implemented opening payload instead of inventing a runtime/server type; bare principles
and anchored claim occurrences are distinct; raw routes are replaced by closed theory actions;
Library direct starts and source-bound launches are disjoint contexts; and Learn retains exact
run/branch/node/ply firing anchors rather than reducing provenance to run ids.

The launch wire is now literal and server-authoritative: the client supplies only a target id in an
authenticated source path, the server re-reads and authorizes the source, recomputes the complete
applicability result, and atomically persists the exact selected identity/target. Durable
derivations are a discriminated union guarded by both a SQL kind/presence check and a fail-closed
canonical-union parser. Cross-source and malformed persisted rows are named negative fixtures.

[[D1887]] remains deliberately owner-pending. The recommendation is that only a completed
countable attempt satisfies a theory/shape recommendation, exactly like direct pack start; merely
opening or abandoning the run changes no progression. `make theory-drill-author-contract` is the
positive author gate. Fresh independent review and all implementation remain blocked until the
owner ruling is recorded.

## 2026-08-30 — Module-registration D2120–D2126 second author repair

Converted the returned module-delivery boundary from prose populations into generated,
digest-sealed 117-row execution and 205-row binding artifacts. Locked the new author fixture to the
existing D1865 acceptance image, and specified the missing post-adapter budget, immutable Review
paging, total role join, family-partitioned Inspector empty state and derived-input DAG contracts.
`make module-registration-author-contract` passes 7/7 and `make module-evidence-assembly` passes
13/13. No production code changed and no implementation is authorized; fresh independent review
is next. Receipt: `planning/learner-modules/second-author-repair-2026-08-30.md`.

## 2026-08-30 — Module-registration callable-plan correction

The first author artifact used one coarse operation per producer, which named real symbols but
could not emit several assigned projections (for example castling legality through
`castlingRights`, and all tactic rows through `loosePieceReading`). Replaced it with
projection-specific operation selection, runtime-imported all 117 callables, and added positive
witnesses for all eight source families through deterministic local, Stockfish, Syzygy, Maia and
Explorer seams. The strengthened author target is 9/9 green; the earlier 7/7 log line records the
pre-correction checkpoint and is intentionally not edited under the append-only rule.

## 2026-08-30 — Intent-presets D2127–D2134 second author repair

Repaired the fresh buildability return around one staged preference authority. The v2 receipt now
has a closed nine-field image, strict parser, canonical serializer and first-load seal; preset
identity derives once from it. Browser code constructs untrusted intent, the server re-derives
context/access/providers/modules/effects and seals the result, and the browser may only narrow its
local speech channel. Advanced/Custom carries explicit module deltas; every narrowing has typed
requested/effective/reason bytes.

Effect/source dependencies derive from the exact 205 binding rows and 117-operation DAG, preserving
AND/OR alternatives, honest no-witness and mixed-family output. All v1 writers retire in the
implementation checkpoint. Campaign remains a registered but declared-awaiting context until
accepted and implemented `campaign-core` exports its exact authority; the other seven contexts may
phase but cannot claim eight-context completion.

`make intent-presets-author-contract` passes 7/7 and
`make intent-presets-second-author-repair` passes 8/8. This is author repair only; fresh independent
review still gates acceptance and production. Receipt:
`planning/intent-presets/second-author-repair-2026-08-30.md`.

## 2026-08-30 — Evidence-presentation D2135–D2140 second author repair

Replaced the old form-copy census as executable authority with exact pair/form targets and named
composition member mappings. All 20 consumers now resolve through real source+operation anchors;
two backend operations are classified as non-presentational. The truthful pre-repair population is
112 pairs (104 adaptable, seven operand-repair occurrences, one selection-only removal), not 117
learner/operator widgets.

A bounded six-operation Checkpoint P now owns the catalogue/source corrections and must yield
111/111 adaptable presentation pairs before component migration. Fact-statement renderer ids,
variants, operands, templates and forms are set-equal to exact fact targets. Abstention questions
and terminal reasons are set-equal to every non-removal adapter. Consequence now retains both
terminal/outcome and nonterminal/plies/objective-state arms.

`make evidence-presentation-author-contract` passes 5/5 plus lifecycle typecheck and
`make evidence-presentation-second-author-repair` passes 6/6. This is author repair only; fresh
review and owner-only [[D1672]] still gate acceptance. Receipt:
`planning/platform-alignment/evidence-presentation/second-author-repair-2026-08-30.md`.

## 2026-08-30 — Pack-capability third fresh independent return

Returned `pack-capability-contract.md` on [[D2152]]–[[D2156]] after applying its sealed transition
and tracing every claimed authority to literal bytes. The proposed 0.30 post-image drops the
already-owned 0.28 graduation and 0.29 provenance additions; its 373-row applicability authority
contains only counts and opaque digests; fourteen unconditional meaning roots lack module-qualified
sites; external `chessops` behavior cannot participate in the semantic digest; and the withdrawn
lifecycle arm cannot retain the successor its own prose promises.

The staged legacy-catalogue admission, structured identity, plan/readiness split and two-state
availability model survive. `make pack-capability-third-fresh-review` passes 5/5 as the executable
return. No schema, registry, pack or product bytes changed, and the [[D560]] corpus hold remains
whole. Exact review:
`planning/pack-capability-contract/third-fresh-independent-review-2026-08-30.md`.

## 2026-08-30 — Evidence-presentation third fresh independent return

Returned `evidence-presentation.md` on [[D2157]]–[[D2163]] after tracing exact adapter operands,
renderer variants and empty-state rows rather than accepting registry counts. Named structures and
citations remain unconstructible; fact templates can print raw ids; two consequence consumers lack
the nonterminal arm; abstention drops authority and source distinctions while contradicting silent
claims; and `count_with_denominator` has no real consumer.

The component vocabulary, sealed wire, exact form assignment and three-checkpoint landing survive.
`make evidence-presentation-third-fresh-review` passes 7/7. No production or protected-design byte
changed; [[D1672]] remains owner-only. Exact review:
`planning/platform-alignment/evidence-presentation/third-fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Module-registration second fresh independent return

Returned `module-registration.md` on [[D2164]]–[[D2170]] after executing its generated artifacts
against the authorities they claim to derive from. Binding fields are local copies; callable names
have no typed invocation/extraction; all derived subjects are stamped as edges; nine DAG inputs are
unowned; Guided Hint passes at zero; presentation adapter ids are invented; and two broad smokes do
not prove 117 row outputs.

The eleven-module product model, staged-move protocol, atomic budgets, bounded Review paging and
seat architecture survive. `make module-registration-second-fresh-review` passes 7/7. No product,
schema or protected-design byte changed. Exact review:
`planning/learner-modules/second-fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Intent-presets second fresh independent return

Returned `intent-presets.md` on [[D2171]]–[[D2178]] after following the repaired types through the
module authority, storage reload and actual named-preset gesture. The preset source graph depends
on returned/incomplete artifacts; two compiler APIs remain; v2 erases unset/migrated identity;
named selection preserves Custom deltas; browser readiness is read twice; Custom can exclude the
mandatory rules floor; invalid recovery has no typed record; and the shared preference/wire/
permission resources claim no register.

The five preset candidates, context ceilings, server-authority direction and explicit Campaign
refusal survive. `make intent-presets-second-fresh-review` passes 8/8. No product, schema, content,
archive or protected-design byte changed. Exact review:
`planning/intent-presets/second-fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Promotion collectors second fresh independent return

Returned only `semantic-collectors.md` projections 13–14 on [[D2179]]–[[D2183]]. The repaired
producer/id/version check still cannot prove the exact adapter ran; the recorded tablebase adapter
seals keys rather than chess values; the available outcome drops the legal-map item grounding its
promotion arrays; a valid no-race state becomes `input_abstained`; and `promotionWithCheck` has no
declared check authority.

The descriptive/outcome split, same-FEN join, local-domain arm and provider-failure separation
survive. The original twelve Wave-C projections remain implemented and unopened.
`make semantic-collectors-promotion-second-fresh-review` passes 5/5 while the preserved 3/3 author
and 6/6 research contracts remain green. Exact review:
`planning/evidence-foundation-ux/semantic-collectors-promotion-second-fresh-review-2026-08-30.md`.

## 2026-08-30 — Provider exchange second fresh independent return

Returned `provider-exchange-and-execution.md` on [[D2184]]–[[D2189]] after following the repaired
receipt and subject types through one real multi-position run, the live engine identity, raw
response capture and the promised operator traversal. A run head cannot select a node/edge
occurrence; three engine digest brands have no byte authority; descriptors can pair typed payload A
with captured response B; Explorer status/ETag are not acquired; all five traversal positives stop
at scheduler results; and the new closed cross-package provider protocol has no register.

The D2056–D2062 seals, prefix digests, absolute TTL, endpoint/cache identities, Syzygy envelope and
Maia application rules survive. `make provider-exchange-second-fresh-review` passes 6/6. No
production, schema, content, archive or protected-design byte changed. Exact review:
`planning/provider-exchange-and-execution/second-fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — AssistanceConfig register third fresh independent return

Returned `assistance-config-register.md` on [[D2190]]–[[D2193]] after applying its proposed graph
grammar to the actual Svelte script operations and the full v5 consumer handoff. Both current
configuration writers use a generic computed key the grammar forbids; the exact v5 claim omits the
in-run hint consumer and preset/clamp columns; the node vocabulary cannot represent the
intermediate import/call/alias closure it promises; and its two scan roots exclude the rest of the
production workspace.

The phase-aware v4/v5 split, shared read/write key, fixed-head identity and central-codec intent
survive. `make assistance-register-third-fresh-review` passes 4/4. No production, workflow,
register, schema, content, archive or protected-design byte changed. Exact review:
`planning/assistance-config-register/third-fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Semantic-validation authority fresh independent return

Returned `semantic-validation-authority.md` on [[D2194]]–[[D2197]] after tracing case inputs,
current evidence mint routes, fixture authorship and mirror non-vacuity. Three referenced protocol
types are undefined; one passing projection can admit values from unverified alternate mint routes;
missing chess expectations are assigned to codex without an oracle/citation/owner receipt; and a
mirror pair can pass with zero target events and no event-level pairing.

The authenticated population, completed/unavailable split, typed mirror leaf rules, application
retention and live-root cardinality repairs survive. `make semantic-validation-fresh-review`
passes 4/4. No production, schema, content, archive or protected-design byte changed. Exact review:
`planning/semantic-validation-authority/fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Shared candidate packet second fresh independent return

Returned `shared-candidate-evidence-packet.md` on [[D2198]]–[[D2201]] after following its repaired
factory and callable registry into the current runtime. The public factory accepts a manifest that
the collectors do not use; available-empty outcomes have no projection identity; the thirteen-row
registry supplies `operation` where its own declaration requires `collect(context)`; and memo,
stats and receipt-reference protocol types are undefined.

The complete-population purpose, provider-free split, bounded admission, single-flight, explicit
standard ruleset and exact-reference retention survive. `make candidate-packet-second-fresh-review`
passes 4/4. No production, schema, content, archive or protected-design byte changed. Exact review:
`planning/evidence-foundation-ux/shared-candidate-packet-second-fresh-independent-review-2026-08-30.md`.

## 2026-08-30 — Bounded-policy targets second fresh independent return

Returned `bounded-policy-targets.md` on [[D2202]]–[[D2205]] after tracing its repaired source anchor
and service through current evidence construction. The public manifest is unused by adapters and
identities; `ThreatPassAnchor` has no declaration; the three new projection values have no exact
constructors/receipts; and the exported service's request/result protocol remains private.

The measured local value, source-bound intent, complete-set batch, bounded background execution,
total quantifiers and shutdown semantics survive. `make bounded-target-second-fresh-review` passes
4/4. No production, schema, content, archive or protected-design byte changed. Exact review:
`planning/bounded-policy-targets/second-fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Verifiable runtime distribution fresh independent return

Returned `verifiable-runtime-distribution.md` on [[D2206]]–[[D2209]] after tracing its release
manifest through generation, image construction, About/API and the native CPU journey. The manifest
is an unregistered multi-reader protocol; embedding it creates an image-digest cycle; FOSS
eligibility has no closed licence policy; and the CPU resource gate can measure a synthetic bot
while the production roster is empty.

The multi-architecture signed appliance, CPU-only Maia split, numerical resource tiers, native
proof, SBOM/filesystem reconciliation and authoring-file exclusion survive. `make
runtime-distribution-fresh-review` passes 4/4. No workflow, production, image, schema, content,
archive or protected-design byte changed. Exact review:
`planning/verifiable-runtime-distribution/fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Storage backup/recovery fresh independent return

Returned `storage-backup-recovery.md` on [[D2210]]–[[D2213]] after tracing the lock lifetime,
staged replacement, bundle reservation and operator stdout contract. Startup both double-acquires
and shows a preflight→HTTP gap; upgrade omits the WAL/SHM quarantine restore already requires;
backup-id digest input/collision behavior is undefined; and the closed CLI receipt has no type.

The verified online backup, staged migration/restore, historical inventory, destructive
confirmation and production-image recovery drills survive. `make storage-backup-fresh-review`
passes 4/4. No production, storage, workflow, schema, content, archive or protected-design byte
changed. Exact review:
`planning/storage-backup-recovery/fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Safe-deployment profiles fresh independent return

Returned `safe-deployment-profiles.md` on [[D2214]]–[[D2218]] after tracing operator inputs,
appliance client setup, Caddy's forwarded-header authority, the live REST route population and the
release proof output. The config file and file-certificate arm have no closed union; appliance TLS
trust has no hostname-resolution path; proxy-only trust has no enforceable internal/egress network
graph; 34 explicit unsafe-method branches plus generic actions have no budget manifest; and the
deployment receipt has no protocol.

The three-profile split, loopback-safe default, exact-origin boundary, secure-cookie posture,
bounded Node reader and stream-preserving writer survive. `make safe-deployment-fresh-review`
passes 5/5. No production, Compose, Caddy, workflow, schema, content, archive or protected-design
byte changed. Exact review:
`planning/safe-deployment-profiles/fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Bot-policy second fresh independent return

Returned the D2087–D2096-amended `bot-policy.md` on [[D2219]]–[[D2226]] after applying its green
author model to the actual profile, provider, capability, persistence and client boundaries. The
model accepts three incompatible sampler parameter sets and never runs the captured control;
implements pawn classification as an `a2` prefix; strips the admitted provider delivery into copied
digests; reads live provider state without depending on provider health; leaves the public route
result untyped; calls a cross-package catalog local; leaves three decision-vocabulary holes; and
cannot compare provider bytes on the no-provider-call replay path.

The twelve family×band roster, optional all-legal guard, bounded Maia population, compiler-owned
seeded draw, event-embedded decision and Stage-B packet join survive. `make
bot-policy-second-fresh-review` passes 8/8; the earlier author target remains green 11/11, now
correctly classified as insufficient evidence. No production, schema, migration, provider, route,
roster, UI, content, archive or protected-design byte changed. Exact review:
`planning/platform-alignment/bot-policy/second-fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Longitudinal-store second fresh independent return

Returned the D2063–D2069-amended `longitudinal-store.md` on [[D2227]]–[[D2232]] after applying its
folded store/worker contract to the current phase classifier, eligible-run population, measured
projection duration, upgrade path and SQL ownership boundary. The store rejects the legitimate
`unclear` phase; the live fold omits decision/root derivation; its 30-second lease is shorter than
the measured 47.29-second 80-ply p95; `all_complete` can hide jobless runs; untouched pre-upgrade
runs receive no required job; and valid learner/run foreign keys are not bound to each other.

The repaired sign identity, complete-population algebra, immutable claim cut, deletion suppression,
literal DDL, typed reader and provider-free worker survive. `make
longitudinal-store-second-fresh-review` passes 6/6; the earlier author target remains green 19/19,
now correctly classified as incomplete evidence. No production, migration, worker, consumer,
schema, content, archive or protected-design byte changed. Exact review:
`planning/longitudinal-store/second-fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Bot-roster fresh independent return

Returned the D1601–D1609-amended `bot-roster.md` on [[D2233]]–[[D2237]] after tracing the roster
through its now-returned policy dependency, profile/calibration identities, experiment arithmetic,
distribution verdict and behavior-trait reach. Display-only persona bytes invalidate unchanged
behavior calibration; the table is 17 arms / 13,200 games rather than 16 / 12,400; the distribution
tests name no executable bounds; and twelve persistent identities still reduce to three behavior
policies while eight proposed traits and all Stage-B evidence have no path into a profile.

The measured four bands, guarded-pawn dependency, grounded card direction, atomic-route requirement
and honest uncalibrated posture survive. `make bot-roster-fresh-review` passes 5/5;
`BOT_POLICY_PROFILES` remains empty. No policy, profile, provider, schema, route, client, asset,
calibration, content, archive or protected-design byte changed. Exact review:
`planning/bot-roster/fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Opponent-experience fresh independent return

Returned `opponent-experience.md` on [[D2238]]–[[D2242]] after joining it to the returned policy/
roster, accepted play composition, persisted run identity and account-data posture. The draft adds a
bar exactly where composition says nothing may sit, invents a second incompatible phone sheet,
cannot render a withdrawn historical persona from id/version/digest, exposes availability as raw
reason strings and promises analytics without a sink or lifecycle.

The complete picker + grounded card + visible identity outcome, exact-profile create/resume intent,
strong-wall separation and accessibility direction survive. [[D2243]] keeps excluded bot
tournaments, relationship/history and observed traits visible in the 1.0 program. `make
opponent-experience-fresh-review` passes 5/5. No production, server, schema, route, client, CSS,
asset, telemetry, content, archive or protected-design byte changed. Exact review:
`planning/opponent-experience/fresh-independent-buildability-review-2026-08-30.md`.
## 2026-08-30 — Campaign-core second fresh independent return

Returned `campaign-core.md` on [[D2244]]–[[D2252]] after joining its repaired atomic terminal
operation to the actual play-run lifecycle and the complete 1.0 intent. The most consequential
finding is executable from the prose: an untouched non-absorbing root may submit as `open`, and the
contract awards the same progression whatever the verdict, so nine start→submit gestures with zero
chess moves can complete the campaign.

The same pass found that create idempotency is scoped behind the unknown run id, encounter start is
not one cross-aggregate transaction, ordinary run deletion can orphan campaign state, and no named
assistance operation consumes the earned loadout. Four scope findings keep the owner-ruled boss
game, catalogue progression, consequential durable rewards and typed official-curriculum contract
inside the 1.0 program rather than disappearing behind “v2.” `make campaign-second-fresh-review`
passes 9/9. The D2077–D2086 repairs survive; no schema, migration, route, client, CSS, content,
archive or protected-design byte changed. Exact review:
`planning/campaign/second-fresh-independent-buildability-review-2026-08-30.md`.
## 2026-08-30 — Social-play fresh independent return

Returned `social-play.md` on [[D2253]]–[[D2260]]. The native-first direction survives, but the
shared run has one `start.side` and records only that side as `actor: "user"`; re-projecting those
bytes for the second learner cannot produce correct progress, Review, Story, longitudinal or rating
perspectives. The two-rating-row problem was known; the same identity defect existed across the
rest of the learning loop and was not priced.

The pass also found host-side pre-seating without learner acceptance, a join preview that omits the
terms being accepted, an agreed-draw event with no proposal protocol, uncoordinated run/session/clock
terminal authorities, required-but-unruled rematch, missing timed-pause clock semantics and a
free-form variant string where `rules + setupFamily + start` is required. [[D1567]] remains the
public-pool decision and now explicitly retains the no-chat cost question without pretending no chat
means no abuse boundary. `make social-play-fresh-review` passes 8/8. No schema, migration, route,
client, CSS, archive or protected-design byte changed. Exact review:
`planning/platform-alignment/social-play/fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Professional workflow 1.0 closure audit

Re-ran the coach/classroom/streamer/casting join after the August 29 Live finishing pass. The old
“almost no UX” verdict is stale: the roster grid, named consent, proposal actions, wall timing,
classroom identity, OBS instructions, audience preview, voting and watch links now render. The
remaining failure is composition, not absence of primitives.

Returned `casting.md` on [[D2261]] because it owns only a live-followed-game projection while the
roadmap assigns it ordinary Stream rehearsal and the whole professional capability. Ledgered the
missing streamer privacy state ([[D2262]]), consent-bounded Review Submission context ([[D2263]]),
bounded co-teacher live authority ([[D2264]]) and scheduled-session admission join ([[D2265]]).
Existing rows retain the Academy compiler/default gap, owner-configurable delayed votes, source
liveness and provider bridge. `make professional-closure-audit` passes 7/7. No production, schema,
migration, archive or protected-intent byte changed. Exact dossier:
`design/research/professional-workflow-1.0-closure.md`.

## 2026-08-30 — Live-following fresh independent return

Returned `live-following.md` on [[D2266]]–[[D2276]] after joining its August 23 model to current
dependency states, production evidence routes, account lifecycle and the landed Live UX research.
The central direction survives: a source grows, rehearsal copies do not, unknown liveness fails
closed and the product computes no engine evaluation while the real game is live.

The proposed records cannot implement that direction. Pushes retain no divergence or snapshot
identity, cuts retain no source/push receipt, and ordinary imported runs therefore cannot derive
`sourceGameLive` or supersession. The only-off-while-connected predicate re-locks a positively
finished game when its terminal stream closes. The four historical refusal doors omit today's
evidence/analysis/corpus/voice/reasoning operations, and there is no typed follower API or complete
discover→follow→copy→rehearse→release browser journey. Clock storage, rules identity, ownership,
export/delete/retention and atomic push admission are also absent; the required prefix-revision
measurement remains unrun.

`make live-following-fresh-review` passes 11/11. No production, schema, migration, API, client,
content, archive or protected-intent byte changed. Exact return:
`planning/live-sources/live-following-fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Live-sources Phase-A acceptance withdrawn

Fresh review returned the accepted `live-sources.md` on [[D2277]]–[[D2285]]. Its real-PGN harness
and strip-before-storage direction remain valid. Its supposedly finished-only boundary does not:
the RFC explicitly admits an ongoing `Result "*"` board to ordinary `importGame`, which then
unconditionally enqueues Story engine evidence, while Phase A has no round-status check or
`sourceGameLive` guard. That is the exact live-assistance bypass Phase B was created to prevent.

The same pass found duplicated/unregistered request and source-kind unions, an untyped unstable
board picker, a splitter proved only on friendly `[Event]`-first fixtures, a whole-round clock
criterion where production sanitizes one game, no upstream resource budget, stale returned
dependencies/migration predecessor, no safe non-Standard admission, and a browser form that would
remain unreachable or falsely promise verbatim stored bytes. `make live-sources-fresh-review`
passes 9/9. No production, schema, migration, API, client, content, archive or protected-intent
byte changed. Exact return:
`planning/live-sources/live-sources-fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Recorded-clocks fresh independent return

Returned `recorded-clocks.md` on [[D2286]]–[[D2295]]. The depicted-clock direction remains
grounded: a retained `[%clk]` reading is a recorded fact. The proposed delivery is not buildable.
It drops the extractor's ply identity before persistence, names no operation that carries stored
readings into imported nodes/API/client modules, defines no time-control parser, and promises
retroactive parsing without an actor, transaction or retry state. Its “measured” learner-spend arm
promotes arbitrary non-monotonic client timestamps to thinking time, and its legacy quarantine
retains values outside the type readers are told to trust.

The fresh corpus pass changed the evidence: the cited finished-round fixture contains **902 clock
annotations across 10 games, but only 9 games contain any clock annotation**. The RFC's whole-round
aggregate therefore masks a finished selected board with no readings; its coverage headline and
single-game criterion are false at their required grain. The paste sample reproduces 108/108 games,
6,991 annotations and 108 simple time-control headers. `make recorded-clocks-fresh-review` passes
11/11. No production, schema, migration, API, client, content, archive or protected-intent byte
changed. Exact review:
`planning/time-controls/recorded-clocks-fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Enforced-clocks fresh independent return

Returned `enforced-clocks.md` on [[D2296]]–[[D2307]]. The required real-clock direction and the
per-context assistance ceiling survive, but the amended RFC still says timed games both rate and do
not rate. Its abandonment mechanism flags only on a future read, so a game that is genuinely
abandoned may never end; expiry and move commit have no atomic deadline contract.

The deeper join fails too. Existing terminal consumers recognize `outcome.reached`, not the proposed
`clock.flagged`; that event stores a learner-relative result even though a native match has two
learner perspectives; native pause clears its only timestamp without preserving clock basis; and no
root/two-side/increment/recovery reducer is specified. The FIDE 6.9 arm names a helper chessops does
not export and uses two fixtures that cannot distinguish exact possible-legal-series semantics from
a naive material shortcut. The RFC also defers the owner-ruled bot move-time consequence and leaves
timed-drill, solo-pause and campaign reward semantics open while claiming review readiness.

`make enforced-clocks-fresh-review` passes 12/12. No production, schema, migration, API, client,
content, archive or protected-intent byte changed. Exact review:
`planning/time-controls/enforced-clocks-fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Native-ratings fresh independent return

Returned `native-ratings.md` on [[D2308]]–[[D2323]]. Its central correction survives: one shared
game stores a color-oriented result and each participant score is a projection. The proposed writer
does not implement that correction—resignation and flag equate the losing side with the winner—and
the SQL accepts contradictory lifecycle/rating records, a rated bot, one learner in both colors,
mismatched encounter/game participants and one game in two encounters.

The migration also conflates game truth with rating eligibility, cascades away an opponent's shared
history, leaves existing attempt updates/joins learner-blind, weakens branch integrity and omits
rules/setup/time-control/calibration from rating identity. Existing native matches backfill to empty
contest aggregates because no general game is created. No typed API/client match→result→two-rating
journey exists, and the tournament fixture proves arbitrary inserts rather than entrant/pairing/
result/standing semantics. The closed-human-pool publication policy remains unmeasured.

`make native-ratings-fresh-review` passes 16/16. No production, schema, migration, API, client,
content, archive or protected-intent byte changed. Exact review:
`planning/native-ratings/native-ratings-fresh-independent-buildability-review-2026-08-30.md`.

## 2026-08-30 — Rating-pool identifiability research

Discharged [[D2323]] with a committed five-arm instrument over the shipped `glicko2Update`, recorded
in `design/research/glicko-pool-identifiability.md` and reproduced by
`make rating-pool-research`. Identical closed-pool results preserve a +200 initial translation
exactly; 32 finite stochastic runs moved the centroid only -18.426 to +15.342, so the established
limitation is additive location non-identifiability, not the draft's unbounded-drift wording.

The proposed zero/non-zero direct calibrated-bot fraction is also refuted as the publication grain.
Direct shares of 0.99%, 4.76% and 16.67% left 98.428, 46.897 and 3.188 points of mean translation.
Zero-direct-anchor learners connected to an anchored learner inherited calibration, while an
equally active disconnected component retained the full 200-point ambiguity. Added [[D2324]]–
[[D2326]]: graph-level calibration reach, precise terminology, and the remaining owner/RFC decision
between local-pool and cross-pool publication claims. No exploration gate changed state and no
production, schema, migration, API, client, content, archive or protected-intent byte changed.

## 2026-08-30 — Pack-capability fourth author repair

Repaired [[D2152]]–[[D2156]] at the author-contract boundary. The schema authority now serializes
exact 0.27→0.28→0.29→0.30 post-images rather than leapfrogging the two accepted predecessor lanes.
The cumulative target has 397 semantic vocabulary members—24 more than the legacy 373—and the
applicability artifact publishes every source identity literally with deterministic checked
expansion. Fourteen unconditional roots, their dependencies and sixteen constant/convention roots
are module-qualified and resolution-checked. `chessops@0.15.1` plus exact integrity/manifest/lock
identity is now a semantic source. Withdrawal is a typed successor versus explicit no-successor
union, with planner traversal, wrong-subject and cycle controls.

`make pack-capability-author-contract` passes the maintained 7 + 11 + 6 + 7 arms and the new
five-seam contract. No production schema, runtime, API, pack, content, archive or protected-intent
byte changed; [[D560]] remains whole. The RFC stays draft pending fresh independent review. Receipt:
`planning/pack-capability-contract/fourth-author-repair-2026-08-30.md`.

## 2026-08-30 — Semantic-validation D2194–D2197 author repair

Repaired the fresh independent return without implementing the validator. The RFC now closes all
eight operation/input grains and exact case refs, makes the value-authority sole-factory receipt a
conjunct of execution and learner admission, refuses Codex-authored chess expectations without an
independent oracle/source/owner receipt, and makes mirror pairing non-empty, canonical, unique and
order-independent before scalar comparison.

`make semantic-validation-author-contract` passes 11/11. The RFC remains draft awaiting another
independent review; production, schema, content, archive, consumer eligibility and protected intent
are unchanged. Receipt:
`planning/semantic-validation-authority/author-repair-d2194-d2197-2026-08-30.md`.
