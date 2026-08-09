# Engines, corpus and content architecture

## Separation of responsibilities

| Component | Legitimate job | What it must not pretend to know |
|---|---|---|
| Stockfish | objective evaluation, MultiPV, tactical validation, WDL approximation | human naturalness or teaching intent |
| Maia-3 | likely human moves at specified Elo, candidate distribution, fallible opponent play | objective correctness or coherent long-term plan by itself |
| Human-game corpus | empirical frequency, transitions, outcomes and examples | normative best play or causality |
| Syzygy | exact W/D/L and DTZ for supported small endgames | practical difficulty or pedagogy |
| Deterministic feature extractor | measurable board changes | universal strategic meaning |
| Drill pack author | concept, objective, checkpoints, acceptable alternatives, narrative | engine-level tactical certainty without validation |
| LLM renderer | wording and summarization of validated evidence | source-of-truth chess analysis |

## Stockfish role

Stockfish should generally be the **judge**, not the actor.

Use it for:

- shallow interactive move checks;
- deeper asynchronous checkpoint analysis;
- MultiPV branch comparison;
- detecting tactical invalidity in authored packs;
- estimating when a position becomes clearly won/lost;
- validating generated corpus candidates;
- measuring when a tempo loss becomes consequential.

Do not drive a 1600-style opponent merely by lowering Stockfish's skill. Stockfish's weakened mode samples weaker moves from engine candidates; that is not the same as modelling human choice.

## Maia-3 role

Maia-3 is a practical first human model because the released UCI engine supports:

- 5M, 23M and 79M models;
- CPU use for the 5M model;
- separate side-to-move and opponent Elo;
- temperature and top-p sampling;
- MultiPV of likely human moves;
- optional reconstructed move history.

Its WDL values are human-game outcome predictions, not Stockfish evaluations. Preserve that distinction in every schema and UI.

## Long-horizon coherence problem

A move predictor can choose plausible moves one at a time while producing an incoherent 12-ply plan.

The opponent therefore needs a policy layer.

### Proposed policy mixer

For each legal move, combine:

```text
corpus likelihood
+ Maia likelihood
+ pack-defined plan compatibility
+ objective-preservation guard
+ diversity/replay penalty
```

Hard filters may reject:

- immediate tactical collapses outside the intended difficulty;
- moves that abandon the pack's defensive plan for no reason;
- repetitions already overused in the current drill;
- moves that violate a required transition.

This is a design proposal, not a claim that one formula solves human play.

## Corpus scale

Lichess currently publishes more than 8.0 billion standard rated games. July 2026 alone contains about 89.3 million games in a 29.1 GB compressed archive. That is more than enough.

Do not ingest everything for v0.

### Recommended corpus stages

#### Stage 0 — no bulk corpus

Use the Lichess opening explorer/API, curated PGNs, and pack-authored lines.

#### Stage 1 — one recent month

Stream one monthly archive, filter by:

- standard rated games;
- relevant rating bands;
- rapid/classical, optionally blitz later;
- no bots;
- minimum game length;
- sane termination/result metadata.

Emit only position and transition aggregates.

#### Stage 2 — targeted historical slices

Add years or rating/time-control partitions only when a query requires them.

### Storage layout

```text
raw .pgn.zst          retained or disposable
  ↓ stream parser
position transitions  partitioned Parquet
  ↓
DuckDB analytics
  ↓
materialized opening/structure indexes
```

The Lichess site explicitly documents streaming decompression with `zstdcat`, avoiding huge temporary files.

## Position key

Store:

- normalized board state;
- side to move;
- castling rights;
- en-passant state;
- halfmove/repetition context where relevant;
- full move history for branch provenance and Maia history mode.

Do not treat piece placement alone as complete chess state.

## Content is the main asset

### Curated-first pipeline

1. Author selects a concept and representative position.
2. Corpus supplies common continuations and real examples.
3. Stockfish checks tactical/objective claims.
4. Maia/corpus calibrate plausible defenses.
5. Feature extractor records measurable changes.
6. Human review approves the lesson and alternatives.
7. Pack is versioned and regression tested.

### Generated content later

Automatic mining can propose:

- candidate positions with multiple playable plans;
- positions where evaluation remains close but timing differs;
- transitions into target endgames;
- common human errors by rating;
- balanced practice positions.

Generated packs remain unpublished until review or until automated validation has earned trust on a constrained taxonomy.

## Licensing notes

- Stockfish is GPLv3.
- Maia-3 is AGPL-3.0.
- Lichess game dumps are CC0.
- Several convenient chess libraries and UIs use copyleft licenses.

For a private/self-hosted open-source build this is usually compatible with the project's direction. A proprietary hosted product needs explicit legal review and architectural decisions before launch. This package is not legal advice.
