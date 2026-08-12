# Content sourcing foundation — log

Append-only.

## 2026-08-12 — Codex implementation

- Implemented the candidate artifact triple and a strict `sourcing-check` that validates
  living packs, the closed manifest-origin/licence shapes, bidirectional source linkage,
  derived timestamps, evidence pointers, grounding overreach, and stale pack digests.
- Raw HTTP access is serialized in-process and guarded by an atomic checkout-local lock.
  Existing locks fail closed regardless of age; release compares ownership. Transient
  responses use the specified 60/120/240-second schedule; 4xx responses do not retry.
- P1 consumes a pinned `lichess-org/chess-openings` TSV through chessops and emits the
  six-ply D35 Exchange Variation skeleton after split ply 8. Output is RFC-8785 canonical,
  clock-independent, unpublished, and includes the grounding ledger plus job identity.
- The committed fixture is a deliberately small offline instrument. Full upstream TSV
  bodies remain in gitignored `content/sources/`; no bulk corpus, Syzygy, explorer,
  puzzle ingestion, prose template, authoring UI, publication action, or learner evidence
  rendering was built here because those belong to B6b–d or later program items.
- Proposed living research update (owner/design tier): mark the 2026-08-12
  `lichess-org/chess-openings` re-verification as executable `[V]`, naming pinned commit
  `4b8622759e7ae6f93f011cc6c83a3823401ab45e`, the `eco/name/pgn` TSV header, and the
  successful offline D35 candidate emission; preserve the dossier's existing licence note.
