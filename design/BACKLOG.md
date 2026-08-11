# Design Backlog — the Topic Ledger

Every idea gets a row the moment it's uttered. Statuses:
`💡 candidate` (mentioned, not designed) → `📐 designed` (has a home in a design doc or
archive section) → `🔬 researched` (coverage-matrix row ✅ in `research/README.md`) →
`📜 RFC` (spec'd/implementing) → `⛔ rejected` (with reason, kept for the record).

Rules: **an idea missing from this ledger is a process bug** · **do NOT RFC from a
candidate row** (and per `rfc/0000-rfc-process.md`, not from any row until the
exploration gate opens). Honesty note: everything marked 🔬 below rests on the archive's
**desk research** — provenance effectively `[P]` until Phase-0 hands-on work upgrades it
(`archive/brief-v2/research/research_limitations.md` is the package's own accounting).

Archive homes are cited as `arch/NN §…` = `archive/brief-v2/NN_….md`.

## Core systems (designed in the brief, awaiting exploration → RFCs)

| Topic | Status | Home |
|---|---|---|
| Drill pack format (modes, objectives, checkpoints, provenance, evidence types) | 📐🔬 | `arch/rfcs/RFC-0001` sketch + `arch/schemas/drill_pack.schema.json` |
| Branch runtime (immutable graph, fork/rewind/compare, event-sourced runs) | 📐🔬 | `arch/rfcs/RFC-0002` sketch, `arch/05`, `arch/schemas/drill_run.schema.json` |
| Line Drill — opening recall → ideas → cross the book boundary → first-plan fork | 📐🔬 | `arch/04`, `01-training-model.md` |
| Plan Drill — 8–20-ply segments, rewind, branch comparison | 📐🔬 | `arch/05`, `01-training-model.md` |
| Outcome Drill — win/hold/save/resist, WDL-preserving grading | 📐🔬 | `arch/06`, `01-training-model.md` |
| Trajectory Drill — causal opening→middlegame→endgame spines, causal-integrity rule | 📐 | `arch/07` |
| Opponent policy broker (theory_strict…strong_engine modes; policy mixer for coherence) | 📐 · feasibility = exploration **Q5** · implemented 2026-08-12 (run schema v0.4 typed selection payload; minimal maia3 policy-exposure patch in the sidecar) | `docs/engine-workers.md`; rationale in `rfc/archive/engine-workers.md`; `arch/rfcs/RFC-0003` sketch, `arch/08` |
| Objectives & grading (objective state machine: active→preserved/degraded/failed/achieved/transitioned) | 📐 | `arch/rfcs/RFC-0004` sketch, `arch/schemas/drill_run.schema.json` |
| Author-declared phase transitions and timing windows | 📐 · feasibility = exploration **Q4a** | `arch/rfcs/RFC-0005` sketch, `arch/04` |
| Deterministic phase-feature assistance for authors | 📐 · feasibility = exploration **Q4b** | `arch/rfcs/RFC-0005` sketch |
| Automatic phase/structure recognition and re-anchoring | 💡 · required for Just Play B2/B4, not authoritative over curated pack boundaries · feasibility = exploration **Q4c** | `03-product-breadth.md`, `arch/rfcs/RFC-0005` sketch |
| Tempo contract / timing windows (window opens/closes, luxury-move budget) | 📐 · validation = exploration **Q4a/Q4b** | `arch/04`, `arch/09` |
| Evidence-backed feedback (claims + evidence refs + uncertainty; timing events over eval deltas) | 📐 · quality = exploration **Q8** | `arch/rfcs/RFC-0006` sketch, `arch/09`, `arch/schemas/feedback_packet.schema.json` |
| Engine integration — Stockfish judge, Maia workers, Syzygy adapter, responsibility table | 📐🔬 | `arch/08`, `arch/12` |
| Corpus position/transition index (staged Lichess ingestion, Parquet + DuckDB) | 📐 · Stage-0 coverage/provenance/rights = exploration **Q6** | `arch/rfcs/RFC-0008` sketch, `arch/08`, `arch/13` |
| System architecture — local-first modular monolith + UCI workers | 📐 (ADR-0004) | `arch/12` |
| UX: branching/rewind surface, compare mode, keyboard-first, latency budgets | 📐 · comprehension/growth = exploration **Q9** | `arch/10`, `02-product-shape.md` |
| Anti-contamination defaults (hide eval/labels until checkpoint) | 📐 (ADR-0006) | `arch/10`, `arch/09` |
| Content authoring workflow + pack production cost | 📐 · cost = exploration **Q7** | `arch/product/content_pack_authoring.md` |
| v0 content scope — packs A (Sicilian timing) / B (Carlsbad or IQP) / C (rook endings) | 📐 | `arch/implementation/v0_content_inventory.md` |
| Vertical slice (deterministic mock opponent, acceptance scenario) | 📐 · drafting gated by E1–E5 | `arch/implementation/vertical_slice_spec.md` |
| Benchmark plan (latency + coherence measurement) | 📐 | `arch/implementation/benchmark_plan.md` |
| Validation protocol — H1–H5, kill criteria, continuation gates | 📐 → **lifted into living tier** | `planning/exploration/gates.md` |

## Breadth-first product surfaces (owner-ratified 2026-08-11)

These are one product, not optional bolt-ons behind a one-pack drill screen.
Each must reach a minimal real end-to-end workflow before content depth and
branch-scoring polish become the main work. Canonical matrix:
`03-product-breadth.md`.

| Surface | Breadth requirement | Home |
|---|---|---|
| Just Play — normal/from-position play with branch-and-learn as the game develops | Pack-optional runs, phase/structure recognition, honest dynamic evidence, rewind/fork/compare/replay | `03-product-breadth.md` |
| Phase-oriented product discovery | Opening/early game, middlegame, endgame, and trajectory navigation exists independently of catalog size | `03-product-breadth.md`, `01-training-model.md` |
| Streamer/Twitch mode | Real host board + chat voting + overlay + rewind/branch/compare scenario | `03-product-breadth.md` |
| Academy/coached sessions | Host/participant/spectator roles, voting/proposals, replay and session-to-pack distillation | `03-product-breadth.md`, `arch/11` |
| Position Arena | Real external challenge/invite + two-leg/PGN return workflow before native matchmaking depth | `03-product-breadth.md`, `arch/11`, `arch/rfcs/RFC-0007` |
| Learn/return system | History/resume, progress, episode/concept SRS, related retries, optional recommendations | `03-product-breadth.md`, `01-training-model.md` |
| Episode/concept SRS | Schedule whole rehearsal episodes and related-position retries rather than memorized moves | B7, `03-product-breadth.md`, `01-training-model.md §Repetition` |
| Optional personal-history recommender | Recommend relevant packs/positions without making game import mandatory or restoring the rejected v1 identity | B7, ADR-0003, `03-product-breadth.md` |
| Create/curate system | Pack studio, study/repertoire/game/session imports, provenance, review and regression workflow | `03-product-breadth.md`, `arch/product/content_pack_authoring.md` |
| Automatic candidate-pack mining | Real corpus pipeline emits unpublished candidates into the author/review workflow; never auto-publishes lessons | B6, `03-product-breadth.md`, `arch/08` |
| Share/spectate/deep links | Drill/run URLs, read-only projections, export/import and spectator-safe views | `03-product-breadth.md` |
| Drill-in-a-URL | Address a FEN/objective or pack/run directly for coaches, forums, stream sessions, and handoff between contexts | B8, `03-product-breadth.md` |
| Full evidence/explanation surface | Authored + Stockfish + Maia + corpus/history + Syzygy + features + evidence-bound LLM, timing controlled | `03-product-breadth.md`, `arch/09` |
| Full-spectrum application shell | Play/Learn/Review/Live/Create/Library/Settings with shared board/run/branch/evidence primitives | `03-product-breadth.md`, `02-product-shape.md` |

## Open shape questions (💡 = genuinely undecided; owned by exploration)

| Idea | Take | Home |
|---|---|---|
| Source model, deployment, monetization, and content/data rights | Four independent axes; copyleft obligations constrain combinations but do not prohibit charging | exploration **Q2**, `02-product-shape.md` |
| Target learner/coach problem value | Competitive whitespace is insufficient; interview and concept-test the recurring job and preference over simpler workflows | exploration **Q1b**, `planning/exploration/plan.md` |
| Learning effect versus simpler training | Test transfer and delayed retention only after a slice exists; cannot gate construction of its own test instrument | exploration **Q1c**, H1–H4 |
| Mobile (PWA vs native vs non-goal) | Brief excludes native from v0; whether the loop is a strong mobile fit was never examined | exploration **Q3**, `02-product-shape.md` |
| Runnable human-opponent policies (Maia-3 variants, ChessMimic if reproducible, corpus baseline, future released models) | Benchmark identical positions/seeds; Chessformer is Maia-3's architecture, not a separate engine | exploration **Q5**, `arch/research/source_index.md` R41–R42 |
| Branch growth and compare comprehension | Owner n=1 walkthrough 2026-08-11: fork/rewind is quick and promising, but manual compare selection is cumbersome and the current comparison lacks enough instruction to judge learning value. Test default-all selection, 2/4/8-branch overview, grouping/cleanup, and phone separately | exploration **Q9**, `02-product-shape.md`, `planning/drill-client/log.md` |
| Branch race UX (two boards, alternating moves) | Tangible divergence but high cognitive load — experimental, optional | `arch/10 §Board swapping` |
| LLM as renderer of validated evidence (never source of truth) | Bounded by ADR-0005; wording/summarization only. Owner walkthrough confirmed its absence is conspicuous: the next feedback slice must actually render validated authored/engine/Maia/corpus evidence instead of stopping at generic evidence chips | Q8, `arch/09`, `arch/rfcs/RFC-0006`, `planning/drill-client/log.md` |
| LLM concept-anchoring agent (self-hosted LLM/provider + search + embeddings) | 💡 owner idea 2026-08-10: when a run derails off the trajectory spine, classify the resulting structure, retrieve the nearest curated concept/pack, switch objective, narrate the transition. Retrieval + deterministic features + engine validation pick the anchor; the LLM only words it — stays inside ADR-0005. Also candidate authoring assistant (drafts stay unpublished until review, per ADR-0001) | Q4b, Q8, `arch/07 §related-position jumps` |
| Position/structure embeddings for related-position retrieval | 💡 the retrieval layer the agent above needs; compare against pawn-structure signatures (Q4b's deterministic features) before adopting learned embeddings | Q4b, Q6 |
| Opponent-intent prompts ("what does their move want; what is the moved piece no longer doing?") | 💡 owner idea 2026-08-10: extend intent capture (currently own-move only, `arch/03 §Commit`) to reading the opponent — prophylaxis/threat-scan checkpoints. Drillable with curated claims + features; strong fit for the sub-1400 blunder-stopping leg | `01-training-model.md`, Q8 |
| Deployment packaging — root compose.yaml (server + healthchecked Maia sidecar), GHCR multi-arch images pulled by digest, compose profiles (light vs engines), devcontainer sharing the same toolchain (kills the machine-lacks-stockfish class of gate failures) | 📐 ruled 2026-08-12 alongside the docker-required ruling; scheduled for the client/vertical-slice era | rulings in `planning/archive/engine-workers/log.md` |
| Browser-run engines (stockfish WASM; small Maia via web runtime) | 💡 owner posture 2026-08-10: pushes compute to the client, hosting cost → near-static + agent inference; Chess Endgame Training [V] proves the PWA/WASM pattern. Complements ADR-0004, doesn't replace the server workers | Q2, `arch/12`, `research/competitor-value-props.md` |
| On-ramp pack lane (1000–1400) | 📐 designed 2026-08-10 at thesis level: same pack object, three knobs (2–8-ply branches, pack-declared immediate blunder-guard, principle/threat objectives). Adds a per-pack feedback-policy field to the pack format — note for the future drill-pack RFC | `00-thesis.md §Target player` |
| Content architecture — full-breadth map (both colours, chosen + faced openings, 10 structure families, 7 endgame families, trajectories, on-ramp) | 📐 designed 2026-08-11 on owner ruling: content is planned at product breadth, not one defense | `04-content-architecture.md` |
| Anti-opening packs — drill *facing* an opening you don't play | 💡 owner idea 2026-08-10, from lived pain: White vs the Caro-Kann — 3.e5 (Advance) is enticing but hard to handle (c5/f6 breaks, Bf5 placement, Tal Variation 4.h4 sharpness). You chose 1.e4; the *opponent* chose the resulting board states and threats you must know. Repertoire trainers drill your side of your openings; nothing drills the defender's/anti side. Strong candidate first pack — owner can dogfood it. Demand signals: R46–R49 | `01-training-model.md`, Q7 candidate pack, `research/source-index.md` R46–R49 |
| Authored explanation vocabulary — claim `when` triggers, timing-window semantics (planMoves/opponentArrival/luxury accounting), authored-boundary provenanceMode, feedback-packet abstraction, non-Stockfish evidence refs | ⛔→💡 **withdrawn from v1 2026-08-11 after three failed reviews; moved to the CONTENT ERA.** Root cause: an authored vocabulary with no authored content to design against. Trigger to revive: pack A exists and needs to express a tempo contract. The reviews' salvage is preserved in the withdrawn RFCs: boundary must be "plyHorizon caps, does not grant"; `pack:` must split per id space; comparison scopes by {branchId,startSeq,endSeq}; recorded-claims requires a real recording site or it is off-cursor re-evaluation renamed | `rfc/authoring-contracts-v03.md`, `rfc/evidence-composer.md` (both withdrawn), Q7 |
| Breadth #2 split history | 📜 RFC 2026-08-11. The composer review found claim triggers, executable window semantics, a boundary combinator, and a multi-source ref grammar all assumed-but-absent; they became a prerequisite amendment RFC rather than implementer improvisation | `rfc/authoring-contracts-v03.md`, `rfc/evidence-composer.md` |
| Off-spine graceful-degradation contract — how feedback honestly thins out as a run deviates from authored content | 💡 2026-08-11 from owner's deviation question. Deviation handling itself is designed (move classification incl. "interesting deviation — continue and compare"; off-objective branches saved not marked wrong; objective transformation; opponent deviations required; agent re-anchoring). The unwritten part: the UI must visibly downgrade from authored coach-voice to instruments-only (engine/corpus/tablebase) at the authored boundary, and the LLM must not paper over the gap (ADR-0005 pressure is highest off-spine). Needs an explicit section in the future drill-pack RFC | Q4a, Q8, `arch/04 §Stage B`, `arch/09 §off-objective` |
| Forward-branching "simulate" — at a spine node with N variations, auto-fork N branches, walk each authored line to its end, render a grid of mini-boards showing the resulting structures | 💡 owner idea 2026-08-11. Cheap by construction: spine playout is deterministic (no engine), previews are REAL branches in the run graph (enter one and keep playing vs the opponent; compare; export all free). Pairs with the explain-sidebar: sidebar explains, simulate shows. Candidate for the follow-up UI RFC alongside prediction checkpoints | `01-training-model.md` Stage A, `rfc/archive/drill-client.md`-follow-up, Q9 |
| Step-indexed reasoning transcript (steal from ChessMotive) | 💡 2026-08-12. Capture the learner's reasoning as structured rows — candidates generated → shortlist → chosen move → concrete line → objective vs practical evaluation — then diff row-by-row. Localizes failure to **generation vs elimination vs selection vs calculation vs judgment** instead of one "wrong move" verdict. Composes with our intent-capture checkpoints and, unlike theirs, could diff attempt-vs-attempt rather than only vs an authority. Cheap: structured data, no engine | `01-training-model.md`, Q8, prediction-checkpoint row |
| Prediction checkpoints — flip the board at pivotal moments, predict the opponent's reply, then explain why/why not | 💡 owner idea 2026-08-10. The active form of opponent-intent prompts; solitaire-chess/"guess the move" pedigree with a twist no competitor has: grade the prediction against the **Maia distribution at the opponent's level** ("42% of 1500s play Qb6; the engine's c4 is found by 8%") plus engine validation — three-way honesty (what's likely, what's best, what you feared). Constraints: a checkpoint *interaction*, not a mode; pack-authored, sparse (pivotal moments only — interrupting mid-segment fights the uninterrupted-consequence stage of the episode, `01-training-model.md §3`); explanation obeys ADR-0005 (claims + frequencies rendered, never freestyle LLM). Board-flip optional per checkpoint — perspective-taking gain vs disorientation cost is a Q9 prototype question | `01-training-model.md`, Q8, Q9 |
| Checkpoint/compare explanation sidebar with selectable evidence layers | 💡 owner walkthrough 2026-08-11: reveal the authored theory claim and objective change, Stockfish best line/evaluation, Maia chosen move plus plausible alternatives/policy mass, and historical-game evidence after commitment; let the user control layers. An LLM may connect and phrase only this validated bundle. This is the missing theory tie-in—anti-contamination governs timing, not permanent absence | Q8, ADR-0005/0006, `research/competitor-value-props.md` §WhyThisMove, future feedback RFC |
| Compare defaults and multi-branch overview | 💡 owner walkthrough 2026-08-11: eligible branches should be checked by default; repeated manual pair selection is cumbersome. Define when “all” is useful, how pairwise runtime comparisons feed a 3+ branch surface, and when to graduate to the simulate grid | Q9, forward-branching simulate row, follow-up UI RFC |
| Viewport-contained desktop app shell | 💡 owner walkthrough 2026-08-11: the drill currently scrolls like a document. Fit the primary desktop experience into a stable app shell (navigation/sidebar + board/content + branch/feedback rail), with deliberate internal overflow and a separately designed responsive/mobile fallback | Q9, `02-product-shape.md`, follow-up UI RFC |

## Untracked-until-now gaps (💡 batch, 2026-08-11 — surfaced by the "what else is open?" sweep)

| Idea | Take | Home |
|---|---|---|
| Skill/progress model + return loop | The product has no answer to "what does it believe you know?" or "why open it on Tuesday?" — per-concept mastery tracking, the varied-repetition scheduler's *trigger*, and progress display. "Voluntary return to the same concept" is a success metric with no designed mechanism behind it. For a solo OSS tool this decides shelfware vs habit | 💡 → needs a design pass; feeds Q1b |
| Time-pressure dimension | A top-3 loss cause at 1000–2000 (clock panic, time-trouble blunders) and the brief only gestures at "relevant clock or move budget." Are drills ever timed? Is there a time-scramble Outcome Drill variant? Undesigned | 💡 | `01-training-model.md` |
| Pack interop: import Lichess studies / existing repertoires as pack seeds | Potentially the biggest K10 (authoring cost) lever: thousands of curated Lichess studies and ChessDojo sparring positions exist; a study→pack converter that authors then *annotate* (checkpoints, windows, claims) beats blank-page authoring. Also the community on-ramp for contributed content | 💡 | Q7 |
| Open pack format as the ecosystem contribution | The value-to-chess-ecosystem may be the openly-specified drill-pack format + runtime (what PGN/EPD did for games), not our app's user count. Reframes "low expected usage" from weakness to irrelevance: others embed/extend the format. Affects Q2 content-rights axis and the novelty story | 💡 | Q2, `00-thesis.md` candidate amendment |
| Small-n evaluation methodology | The validation design (H1–H4, C2–C4) assumes user cohorts we will not have ("I don't expect much usage"). Honest alternatives: n-of-1 self-experiments with preregistered protocols, coach expert review as the primary quality gate, delayed self-testing. Without this, Q1c/C2–C4 are unfalsifiable theater | 💡 → must be settled before E-gate thresholds are preregistered | `gates.md`, Q1c |

## Deferred implementation depth (surfaces remain in breadth architecture)

| Topic | Status | Home |
|---|---|---|
| Native Position Arena matchmaking/clocks/moderation (external handoff remains a breadth requirement) | 📐 deferred depth | `arch/rfcs/RFC-0007` sketch, `arch/11`, `arch/schemas/position_arena.schema.json` |
| Bulk corpus ingestion (Stage 1+: streamed months, historical slices) | 📐 deferred | `arch/08`, `arch/13` |

## Provisional decisions (the archive ADRs — held, with revisit triggers)

Not accepted RFC-tier decisions; they predate validation. Treated as standing defaults
until their trigger fires or an owner ruling changes them.

| ADR | Decision | Revisit trigger |
|---|---|---|
| ADR-0001 | Curated-first content: reviewed packs before automatic lesson generation | C6 met and mining quality proven |
| ADR-0002 | Stockfish is judge, not default opponent | H5 fails in *both* directions (weakened SF also beats Maia/corpus on believability) |
| ADR-0003 | Personal history optional; core drills work without imports | Standing — protects against the v1 identity error |
| ADR-0004 | Local-first modular monolith + workers | Multi-user/SaaS posture chosen in Q2 |
| ADR-0005 | No LLM as chess source of truth | Standing law (AGENTS.md §7); owner override only |
| ADR-0006 | Delayed feedback in Plan Drills (until checkpoint/segment end) | H3/K4 evidence shows delayed feedback hurts rather than helps |

## Rejected (⛔ — kept for the record; see also AGENTS.md §Rejected)

| Idea | Why |
|---|---|
| v1 identity: personal game-analysis AI coach (mine games → weaknesses → episodes) | `arch/CHANGE_FROM_V1.md` — legitimate adjacent product, not this one; caused the v1 brief's comparison and kill-signal errors |
| Mandatory game import as entry point | Same source; drifts back into personalized analysis |
| Bulk-ingestion-first data strategy | `arch/08` — Stage 0 (explorer API + curated PGNs) suffices; billions of games are not a prerequisite |
| LLM-generated strategic lessons as content | ADR-0005 rationale: fluent but shallow/hallucinated coaching |
| Weakened Stockfish as default opponent | `arch/08` — samples weaker engine moves; does not model human choice |
| "Paid products exist" as a kill signal | `arch/02` — v1's calibration error; real kill criteria live in `gates.md` |
