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
