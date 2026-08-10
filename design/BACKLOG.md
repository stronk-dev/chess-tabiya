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
| Opponent policy broker (theory_strict…strong_engine modes; policy mixer for coherence) | 📐 · feasibility = exploration **Q5** | `arch/rfcs/RFC-0003` sketch, `arch/08` |
| Objectives & grading (objective state machine: active→preserved/degraded/failed/achieved/transitioned) | 📐 | `arch/rfcs/RFC-0004` sketch, `arch/schemas/drill_run.schema.json` |
| Author-declared phase transitions and timing windows | 📐 · feasibility = exploration **Q4a** | `arch/rfcs/RFC-0005` sketch, `arch/04` |
| Deterministic phase-feature assistance for authors | 📐 · feasibility = exploration **Q4b** | `arch/rfcs/RFC-0005` sketch |
| Fully automatic semantic phase detection | 💡 optional · value = exploration **Q4c** | `arch/rfcs/RFC-0005` sketch |
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

## Open shape questions (💡 = genuinely undecided; owned by exploration)

| Idea | Take | Home |
|---|---|---|
| Source model, deployment, monetization, and content/data rights | Four independent axes; copyleft obligations constrain combinations but do not prohibit charging | exploration **Q2**, `02-product-shape.md` |
| Target learner/coach problem value | Competitive whitespace is insufficient; interview and concept-test the recurring job and preference over simpler workflows | exploration **Q1b**, `planning/exploration/plan.md` |
| Learning effect versus simpler training | Test transfer and delayed retention only after a slice exists; cannot gate construction of its own test instrument | exploration **Q1c**, H1–H4 |
| Mobile (PWA vs native vs non-goal) | Brief excludes native from v0; whether the loop is a strong mobile fit was never examined | exploration **Q3**, `02-product-shape.md` |
| Runnable human-opponent policies (Maia-3 variants, ChessMimic if reproducible, corpus baseline, future released models) | Benchmark identical positions/seeds; Chessformer is Maia-3's architecture, not a separate engine | exploration **Q5**, `arch/research/source_index.md` R41–R42 |
| Branch growth and compare comprehension | Test 2/4/8-branch desktop and phone prototypes; budgets/grouping/cleanup are open | exploration **Q9**, `02-product-shape.md` |
| Branch race UX (two boards, alternating moves) | Tangible divergence but high cognitive load — experimental, optional | `arch/10 §Board swapping` |
| LLM as renderer of validated evidence (never source of truth) | Bounded by ADR-0005; wording/summarization only | `arch/09`, `arch/rfcs/RFC-0006` |
| LLM concept-anchoring agent (self-hosted LLM/provider + search + embeddings) | 💡 owner idea 2026-08-10: when a run derails off the trajectory spine, classify the resulting structure, retrieve the nearest curated concept/pack, switch objective, narrate the transition. Retrieval + deterministic features + engine validation pick the anchor; the LLM only words it — stays inside ADR-0005. Also candidate authoring assistant (drafts stay unpublished until review, per ADR-0001) | Q4b, Q8, `arch/07 §related-position jumps` |
| Position/structure embeddings for related-position retrieval | 💡 the retrieval layer the agent above needs; compare against pawn-structure signatures (Q4b's deterministic features) before adopting learned embeddings | Q4b, Q6 |
| Opponent-intent prompts ("what does their move want; what is the moved piece no longer doing?") | 💡 owner idea 2026-08-10: extend intent capture (currently own-move only, `arch/03 §Commit`) to reading the opponent — prophylaxis/threat-scan checkpoints. Drillable with curated claims + features; strong fit for the sub-1400 blunder-stopping leg | `01-training-model.md`, Q8 |
| Browser-run engines (stockfish WASM; small Maia via web runtime) | 💡 owner posture 2026-08-10: pushes compute to the client, hosting cost → near-static + agent inference; Chess Endgame Training [V] proves the PWA/WASM pattern. Complements ADR-0004, doesn't replace the server workers | Q2, `arch/12`, `research/competitor-value-props.md` |
| On-ramp pack lane (1000–1400) | 📐 designed 2026-08-10 at thesis level: same pack object, three knobs (2–8-ply branches, pack-declared immediate blunder-guard, principle/threat objectives). Adds a per-pack feedback-policy field to the pack format — note for the future drill-pack RFC | `00-thesis.md §Target player` |
| Anti-opening packs — drill *facing* an opening you don't play | 💡 owner idea 2026-08-10, from lived pain: White vs the Caro-Kann — 3.e5 (Advance) is enticing but hard to handle (c5/f6 breaks, Bf5 placement, Tal Variation 4.h4 sharpness). You chose 1.e4; the *opponent* chose the resulting board states and threats you must know. Repertoire trainers drill your side of your openings; nothing drills the defender's/anti side. Strong candidate first pack — owner can dogfood it. Demand signals: R46–R49 | `01-training-model.md`, Q7 candidate pack, `research/source-index.md` R46–R49 |
| Off-spine graceful-degradation contract — how feedback honestly thins out as a run deviates from authored content | 💡 2026-08-11 from owner's deviation question. Deviation handling itself is designed (move classification incl. "interesting deviation — continue and compare"; off-objective branches saved not marked wrong; objective transformation; opponent deviations required; agent re-anchoring). The unwritten part: the UI must visibly downgrade from authored coach-voice to instruments-only (engine/corpus/tablebase) at the authored boundary, and the LLM must not paper over the gap (ADR-0005 pressure is highest off-spine). Needs an explicit section in the future drill-pack RFC | Q4a, Q8, `arch/04 §Stage B`, `arch/09 §off-objective` |
| Prediction checkpoints — flip the board at pivotal moments, predict the opponent's reply, then explain why/why not | 💡 owner idea 2026-08-10. The active form of opponent-intent prompts; solitaire-chess/"guess the move" pedigree with a twist no competitor has: grade the prediction against the **Maia distribution at the opponent's level** ("42% of 1500s play Qb6; the engine's c4 is found by 8%") plus engine validation — three-way honesty (what's likely, what's best, what you feared). Constraints: a checkpoint *interaction*, not a mode; pack-authored, sparse (pivotal moments only — interrupting mid-segment fights the uninterrupted-consequence stage of the episode, `01-training-model.md §3`); explanation obeys ADR-0005 (claims + frequencies rendered, never freestyle LLM). Board-flip optional per checkpoint — perspective-taking gain vs disorientation cost is a Q9 prototype question | `01-training-model.md`, Q8, Q9 |

## Untracked-until-now gaps (💡 batch, 2026-08-11 — surfaced by the "what else is open?" sweep)

| Idea | Take | Home |
|---|---|---|
| Skill/progress model + return loop | The product has no answer to "what does it believe you know?" or "why open it on Tuesday?" — per-concept mastery tracking, the varied-repetition scheduler's *trigger*, and progress display. "Voluntary return to the same concept" is a success metric with no designed mechanism behind it. For a solo OSS tool this decides shelfware vs habit | 💡 → needs a design pass; feeds Q1b |
| Time-pressure dimension | A top-3 loss cause at 1000–2000 (clock panic, time-trouble blunders) and the brief only gestures at "relevant clock or move budget." Are drills ever timed? Is there a time-scramble Outcome Drill variant? Undesigned | 💡 | `01-training-model.md` |
| Pack interop: import Lichess studies / existing repertoires as pack seeds | Potentially the biggest K10 (authoring cost) lever: thousands of curated Lichess studies and ChessDojo sparring positions exist; a study→pack converter that authors then *annotate* (checkpoints, windows, claims) beats blank-page authoring. Also the community on-ramp for contributed content | 💡 | Q7 |
| Open pack format as the ecosystem contribution | The value-to-chess-ecosystem may be the openly-specified drill-pack format + runtime (what PGN/EPD did for games), not our app's user count. Reframes "low expected usage" from weakness to irrelevance: others embed/extend the format. Affects Q2 content-rights axis and the novelty story | 💡 | Q2, `00-thesis.md` candidate amendment |
| Small-n evaluation methodology | The validation design (H1–H4, C2–C4) assumes user cohorts we will not have ("I don't expect much usage"). Honest alternatives: n-of-1 self-experiments with preregistered protocols, coach expert review as the primary quality gate, delayed self-testing. Without this, Q1c/C2–C4 are unfalsifiable theater | 💡 → must be settled before E-gate thresholds are preregistered | `gates.md`, Q1c |

## Deferred (designed or named, deliberately parked — revival conditions in `planning/exploration/plan.md` §Deferred)

| Topic | Status | Home |
|---|---|---|
| Position Arena (human vs human from curated position, two-leg, swap colors) | 📐 deferred | `arch/rfcs/RFC-0007` sketch, `arch/11`, `arch/schemas/position_arena.schema.json` |
| Automatic candidate-pack mining from corpus | 📐 deferred (brief phase 4; unpublished until review) | `arch/08` |
| Personal game-history pack recommender | 📐 deferred (ADR-0003: optional, never identity) | `arch/01 §Why personal history is optional` |
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
