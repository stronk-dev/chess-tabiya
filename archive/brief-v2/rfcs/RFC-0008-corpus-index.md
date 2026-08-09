# RFC-0008 — Corpus Position and Transition Index

## Status

Proposed after vertical slice.

## Input

Streamed Lichess monthly PGN archives.

## Filters

Standard rated, non-bot, selected speeds/ratings, minimum length and valid metadata.

## Aggregate key

- normalized full position state;
- rating bucket;
- time-control bucket;
- optional opening/structure tag.

## Values

- next-move counts;
- result counts;
- transition material/structure tags;
- source game reservoir sample;
- first/last seen;
- confidence metadata.

## Storage

Parquet partitions queried through DuckDB. Materialize only hot opening/pack indexes into the application database.
