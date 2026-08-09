# Feasibility and home-server sizing

## Bottom line

A beefy home server is more than enough for the prototype. Compute is not the limiting factor.

## Interactive workload

One active drill typically needs:

- legal board updates;
- one Maia inference or corpus lookup for an opponent move;
- occasional shallow Stockfish analysis;
- cached feature extraction;
- deeper analysis after a segment.

That is modest.

## Maia

The official Maia-3 release identifies the 5M model as suitable for CPU and chess GUI use. Start there. Benchmark 23M/79M only after the interaction works.

Important tests:

- cold start;
- warm single-position latency;
- batch throughput;
- full 20-ply branch coherence;
- sampling stability by Elo;
- CPU versus available GPU;
- memory per worker.

## Stockfish

Use a small number of threads for interactive checks and a separate deep-analysis pool. Throwing all cores at every move can increase contention and latency.

Suggested initial policy:

- interactive: 1–2 threads, fixed nodes or short time;
- branch review: 2–4 threads, bounded MultiPV;
- offline validation: larger jobs when idle.

## Tablebases

- Five-piece Syzygy is under 1 GB.
- Complete six-piece WDL+DTZ is roughly 150 GB.
- Complete seven-piece Syzygy is around 18.4 TB and is unnecessary for v0.

Use five/six-piece local tables. Query a remote service or rely on Stockfish for larger positions until there is a reason to host seven-piece data.

## Corpus storage

One July 2026 Lichess standard-game archive is 29.1 GB compressed and roughly seven times larger uncompressed. Stream it; do not expand it permanently.

A targeted aggregate can be far smaller than the source:

- position key;
- rating/time-control bucket;
- move counts;
- result counts;
- transition/material tags;
- small sample of source game IDs.

The exact aggregate size depends on deduplication depth and how many plies are indexed. Measure before designing a distributed system.

## Proposed deployment profiles

### Minimal developer profile

- 8 CPU cores;
- 16–32 GB RAM;
- 100 GB free SSD plus optional HDD;
- no GPU;
- 5-piece tables;
- no bulk corpus.

### Comfortable research profile

- 16+ CPU cores;
- 32–64+ GB RAM;
- NVMe working disk;
- 1 TB+ bulk storage;
- optional GPU;
- six-piece tables;
- one or more streamed Lichess months.

The user's described server should comfortably exceed the minimal profile.

## What consumes engineering time

Not compute:

- authoring and reviewing packs;
- branch/compare UX;
- defining stop conditions;
- opponent coherence;
- feature extraction that supports honest explanations;
- regression testing pack claims;
- measuring whether users transfer the concept.
