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
| Competitor value props: adopt / conflict / not-relevant vs our thesis and posture | Q1a, Q2, Q8, `design/02` | covered `[P]`, 3 claims `[V]` (WhyThisMove, Noctie, Chess Endgame Training) | `competitor-value-props.md` |
| Chess Endgame Training hands-on (latency, branching; owner's "slow/poor UX" report) | Q1a, K9 | covered `[V]` first pass (desktop; mobile/records/hint pending) | `teardown-cet.md` |
| Noctie takeback/branch persistence + feedback timing | Q1a | **GAP** (queue 2) | — |
| Chessable bot-from-course-position on strategic chapters | Q1a | **GAP** (queue 3) | — |
| Chess.com Practice multi-move redo + color switching | Q1a | **GAP** (queue 4) | — |
| Target learner/coach problem interviews + concept preference test | Q1b, E2 | **GAP** | — |
| Learning effect versus simpler formats | Q1c, H1–H4, C2–C4 | **GAP** — requires slice | — |
| Maia-3 capabilities (models, conditioning, sampling) | Q5 | covered `[P]` | `arch/research/source_index.md` R04 |
| Maia-3 plan coherence over 20 plies @ 1600/1800/2000 | Q5, H5, K5 | **GAP** (queue 5) — needs harness | — |
| Maia-3 variants vs ChessMimic (if runnable) vs corpus policy vs weakened-Stockfish control, same positions/seeds | Q5, H5 | **GAP** (queue 6) | — |
| Author-declared transitions/timing windows on reviewed examples | Q4a, Q7, E3 | **GAP** (queue 7) | — |
| Smallest useful deterministic feature set + coach agreement | Q4b, Q8 | **GAP** (queue 8) | — |
| Automatic phase detection value/ground truth | Q4c | deferred unless Q4a/Q4b expose need | — |
| Strong reviewer recruitment for packs A/B/C | Q7, C1 | **GAP** (queue 9) | — |
| Dependency/model/content licensing across source, deployment, monetization, and rights axes 🟡 | Q2, Q6 | **GAP** (queue 10) | — |
| Paid-competitor pricing/positioning | Q2 | **GAP** | — |
| Branch/rewind/compare comprehension at 2/4/8 branches | Q9, E5 | **GAP** | — |
| Historical-game provenance, rights, Stage-0 coverage and bias | Q6, Q7 | **GAP** | — |
| Deliberate-practice evidence base | thesis | covered `[P]` (observational; population skew caveat) | `arch/research/source_index.md` R01 |
| Lichess corpus scale/licensing | Q6 | covered `[P]` | `arch/research/source_index.md` R02 |
| Engine stack (Stockfish UCI, Syzygy sizes) | Q5, arch | covered `[P]` | `arch/research/source_index.md` R03–R06 |
| Forum demand signals | Q1b | covered `[P]` — anecdotes, problem-shape only | `arch/research/forum_signal_log.md` |
