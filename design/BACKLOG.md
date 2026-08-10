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
