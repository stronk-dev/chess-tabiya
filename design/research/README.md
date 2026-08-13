# Research — coverage matrix and house rules

Research dossiers land here as `<topic>.md`. This README is the coverage matrix: what
has been researched, how well, and what it feeds. A dossier exists when research lands —
no empty stubs; GAP rows below are the queue.

## House rules

- **Use one lightweight evidence label per factual research claim:**
  - `[V]` — directly checked in the current pass against the cited primary/authoritative
    source, a reproducible measurement, or a hands-on observation;
  - `[P]` — source-backed but partial, secondary, inherited desk research, or not yet
    reproduced hands-on;
  - `[M]` — model knowledge or analysis with no external evidence; unverified.
  These labels intentionally combine evidence basis and verification state for a small
  repo; they are not a complete source taxonomy.
- **Keep legal risk separate:** 🟢/🟡/🔴 may be added where relevant and means legal risk
  only, never evidentiary confidence.
- **Make every factual claim in a dossier traceable.** `[V]` and `[P]` require an inline
  URL or a precise living/archive source reference. Unsupported claims require `[M]`.
  A clearly bounded paragraph or table row may share one citation; repeated glyphs on
  every sentence are not required.
- **No RFC is drafted from a GAP row.** If the area is a gap, run a research pass and
  land the report first (composes with the exploration gate in `rfc/0000-rfc-process.md`).
- **Contradicting a design doc is a feature.** When research overturns design, flag
  `DESIGN-GAP:` in the dossier and escalate via `planning/exploration/log.md`; never
  silently resolve.
- Kill-criterion evidence (see `planning/exploration/gates.md`) is escalated, never
  buried.

## Inherited corpus

The archive's research (`archive/brief-v2/research/`) is **desk research**: product
pages, forums, papers — no standardized hands-on evaluation. Treat every inherited
claim as `[P]` unless a new dossier upgrades it. The package's own caveats:
`archive/brief-v2/research/research_limitations.md`.

- `source-index.md` — living continuation of the archive's R01–R45 (new entries R46+).
- `competitor-matrix.csv` — living copy of `archive/brief-v2/research/competitor_matrix.csv`
  (28 products, 20 columns). Extend/correct here; the archive original is frozen.
- `archive/brief-v2/research/claims_vs_verified.md` and `forum_signal_log.md` — frozen;
  cite as needed.

## Coverage matrix

| Area | Feeds | Status | Report |
|---|---|---|---|
| Competitor landscape (28 products, feature matrix) | Q1a, `design/02` | covered `[P]` — desk only | `competitor-matrix.csv`, `arch/02` |
| ChessMotive (owner-flagged near-competitor) | Q1a, E1, Q8 | covered `[V]` desk — E1 **intact**; narrows our compare claim | `teardown-chessmotive-desk.md` |
| Competitor value props: adopt / conflict / not-relevant vs our thesis and posture | Q1a, Q2, Q8, `design/02` | covered `[P]`, 3 claims `[V]` (WhyThisMove, Noctie, Chess Endgame Training) | `competitor-value-props.md` |
| Chess Endgame Training hands-on (latency, branching; owner's "slow/poor UX" report) | Q1a, K9 | covered `[V]` first pass (desktop; mobile/records/hint pending) | `teardown-cet.md` |
| Noctie takeback/branch persistence + feedback timing | Q1a | covered `[V]`/`[P]` desk pass; residual: takeback ground truth needs hands-on | `teardown-noctie-desk.md` |
| Chessable bot-from-course-position on strategic chapters | Q1a | covered `[V]` desk pass (one-way Chess.com handoff, no tie-back) | `teardown-chessable-desk.md` |
| Chess.com Practice multi-move redo + color switching | Q1a | covered `[V]` desk pass (undo destroys attempts; takeback-branch reported broken) | `teardown-chesscom-desk.md` |
| Target learner/coach problem interviews + concept preference test | Q1b, E2 | **GAP** | — |
| Learning effect versus simpler formats | Q1c, H1–H4, C2–C4 | **GAP** — requires slice | — |
| Maia-3 capabilities (models, conditioning, sampling) | Q5 | covered `[P]` | `arch/research/source_index.md` R04 |
| Maia opponent quality (coherence over 10–20 plies) | Q5 | **answered `[V]`**: 80-game smoke, history-conditioned 5M plays plan-coherent 20-ply continuations with level-appropriate errors; weakened-SF control shows exactly the plan-less noodling Maia avoids | `tools/maia-harness/`, exploration log |
| Maia-3 variants vs ChessMimic (if runnable) vs corpus policy vs weakened-Stockfish control, same positions/seeds | Q5, H5 | **GAP** (queue 6) | — |
| Author-declared transitions/timing windows on reviewed examples | Q4a, Q7, E3 | **GAP** (queue 7) | — |
| Smallest useful deterministic feature set + coach agreement | Q4b, Q8 | **GAP** (queue 8) | — |
| Automatic phase/structure recognition ground truth for Just Play | Q4c, B2, B4 | **GAP** — owner breadth ruling makes honest detection/retrieval/abstention load-bearing for Just Play, while curated packs retain authored boundaries | — |
| ~~Strong reviewer recruitment for packs A/B/C~~ | Q7 | ⛔ **closed 2026-08-13 — not a prerequisite.** Owner ruled no review workflow; packs carry a publication channel (official/community) instead, and C1 is withdrawn. Reopen only as a content-sourcing partnership wanted for its own sake | — |
| Dependency/model/content licensing across source, deployment, monetization, and rights axes 🟡 | Q2, Q6 | **GAP** (queue 10) | — |
| Paid-competitor pricing/positioning | Q2 | **GAP** | — |
| Server/client stack selection (Go vs Node/TS; Svelte vs React vs vanilla; chessground/WASM interop) | branch-runtime RFC, deferred-decisions register | covered `[V]`/`[P]` — recommends TS-everywhere + Svelte 5; flags Maia-3 Python-sidecar question | `stack-selection.md` |
| Branch/rewind/compare comprehension at 2/4/8 branches | Q9, E5 | partial `[V]`, owner n=1 real-engine walkthrough: fork/rewind quick and promising; compare selection cumbersome; scrolling shell odd; comparison-learning value not testable without the deferred instructional layer. Four/eight branches and phone remain GAP | `planning/drill-client/log.md` |
| Theory/pattern sourcing incl. provenance & rights | Q6, Q7, content phase | covered `[V]` — every pack need (skeleton/evidence/prose/positions/grading) has a CC0-or-ours source; do-not-use list included | `theory-sourcing.md` |
| Deliberate-practice evidence base | thesis | covered `[P]` (observational; population skew caveat) | `arch/research/source_index.md` R01 |
| Lichess corpus scale/licensing | Q6 | covered `[P]` | `arch/research/source_index.md` R02 |
| Engine stack (Stockfish UCI, Syzygy sizes) | Q5, arch | covered `[P]` | `arch/research/source_index.md` R03–R06 |
| Forum demand signals | Q1b | covered `[P]` — anecdotes, problem-shape only | `arch/research/forum_signal_log.md` |
