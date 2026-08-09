# Research — coverage matrix and house rules

Research dossiers land here as `<topic>.md`. This README is the coverage matrix: what
has been researched, how well, and what it feeds. A dossier exists when research lands —
no empty stubs; GAP rows below are the queue.

## House rules

- **Provenance, two orthogonal axes, never one glyph:**
  - `[V]` verified against a fetched URL · `[P]` plausible / desk-sourced, unverified
    hands-on · `[M]` model knowledge, no external source.
  - Legal risk 🟢/🟡/🔴 where relevant (only ever legal, never epistemic).
- **Every factual claim carries a URL or an explicit `[M]`.**
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
| Competitor landscape (28 products, feature matrix) | Q1, `design/02` | covered `[P]` — desk only | `competitor-matrix.csv`, `arch/02` |
| Chess Endgame Training hands-on (latency, branching; owner's "slow/poor UX" report) | Q1, K9 | **GAP** (queue 1) | — |
| Noctie takeback/branch persistence + feedback timing | Q1 | **GAP** (queue 2) | — |
| Chessable bot-from-course-position on strategic chapters | Q1 | **GAP** (queue 3) | — |
| Chess.com Practice multi-move redo + color switching | Q1 | **GAP** (queue 4) | — |
| Maia-3 capabilities (models, conditioning, sampling) | Q5 | covered `[P]` | `arch/research/source_index.md` R04 |
| Maia-3 plan coherence over 20 plies @ 1600/1800/2000 | Q5, H5, K5 | **GAP** (queue 5) — needs harness | — |
| Maia-3 vs ChessMimic vs corpus policy, same positions | Q5, H5 | **GAP** (queue 6) | — |
| Attack-arrival/timing metrics on reviewed Sicilian examples | Q4 | **GAP** (queue 7) | — |
| Smallest useful deterministic feature set | Q4, Q8 | **GAP** (queue 8) | — |
| Strong reviewer recruitment for packs A/B/C | Q7, C1 | **GAP** (queue 9) | — |
| Licensing: UI/chess libs, Maia deployment, product posture 🟡 | Q2 | **GAP** (queue 10) | — |
| Paid-competitor pricing/positioning | Q2 | **GAP** | — |
| Deliberate-practice evidence base | thesis | covered `[P]` (observational; population skew caveat) | `arch/research/source_index.md` R01 |
| Lichess corpus scale/licensing | Q6 | covered `[P]` | `arch/research/source_index.md` R02 |
| Engine stack (Stockfish UCI, Syzygy sizes) | Q5, arch | covered `[P]` | `arch/research/source_index.md` R03–R06 |
| Forum demand signals | Q1 | covered `[P]` — anecdotes, problem-shape only | `arch/research/forum_signal_log.md` |
