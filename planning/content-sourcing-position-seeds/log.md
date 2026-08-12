# Position-seed sourcing — log

Append-only.

## 2026-08-12 — Codex implementation

- Implemented the accepted redesign: the complete puzzle line is legally replayed at emit
  time, its aftermath becomes `start.fen`, the solver becomes `start.side`, and the pack has
  no spine or `start.movesSan`. The opponent therefore moves first and the learner plays the
  consequence rather than solving the source tactic.
- The exact real rows `00008`, `0000D`, and `000Pw` are committed as the eleven-column CI
  fixture. Tests independently replay every move through chessops, derive SAN, assert side
  parity, and search the complete projected browser document for every UCI and SAN move.
- A specification collision surfaced without stopping implementation: §Acceptance 1 asks
  all three named rows to emit, while §4 requires `NbPlays >= 1000`; the real `000Pw` row has
  629 plays. A non-production inspection seam exercises transformation of all three, while
  production emission keeps the quality floor and therefore commits `00008` and `0000D`.
- `puzzle_provenance` is mechanically checked by replaying `solutionUci` from `csvFen` to the
  anchored `/start/fen`; a forged aftermath fails `EVIDENCE_VALUES_INVALID`. It cannot carry
  a template or support prose. The source manifest is CC0, HTTP, headers-only, and linked in
  both directions like every B6a artifact.
- The live path streams the zstd response through Node's `createZstdDecompress` under the
  shared source lock and writes only a small headers metadata record. The committed offline
  path uses the exact row fixture. Terminal aftermaths, odd lines, low-signal rows, invalid
  checkpoint parity, and ambiguous phase tags are rejected or omitted at their specified
  boundary.
- Engine evaluation is opt-in only. Without `--engine-eval` no engine is probed; with it the
  authoring Stockfish profile is depth 22 / Threads 1 / Hash 16 / MultiPV 1 and its effective
  identity/profile travel in the manifest and evidence record.
- Deliberately not built: tactics solving, solution playback, invented continuations,
  authored claims, move grading, theme-description prose, automatic publication, bulk dump
  retention, a Go ingestion lane, or a learner-facing Lichess login. Each is outside B6d or
  would violate the product thesis / grounding law.
