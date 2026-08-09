# Suggested repository layout

```text
/apps/web
/apps/server
/packages/chess-core
/packages/drill-schema
/packages/branch-runtime
/packages/feedback
/packages/ui-board
/workers/stockfish
/workers/maia
/workers/corpus
/content/packs
/content/fixtures
/data/parquet
/docs/rfcs
/docs/adrs
/tests/e2e
/tests/packs
/infra/docker
```

## Ownership

- `chess-core`: legal state, PGN/FEN, hashing.
- `drill-schema`: JSON Schema and generated types.
- `branch-runtime`: nodes, forks, rewind, event log.
- `feedback`: evidence packet and comparison.
- workers: UCI lifecycle and caches.
- content: reviewed source-controlled packs.
