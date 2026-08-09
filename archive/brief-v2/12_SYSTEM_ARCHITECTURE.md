# System architecture

## Recommended shape

A **modular monolith with worker processes**, not microservices.

The home-server deployment should be easy to run, inspect and modify.

```text
Web client
  ↕ WebSocket/HTTP
Application server
  ├── drill runtime
  ├── branch graph store
  ├── pack registry
  ├── feedback composer
  ├── corpus query adapter
  └── job queue
        ├── Stockfish workers
        ├── Maia workers
        ├── tablebase adapter
        └── deep-analysis jobs

PostgreSQL or SQLite
Parquet + DuckDB for corpus analytics
Object storage/filesystem for packs and analysis cache
```

## Client

Suggested:

- TypeScript;
- React with Vite or Next.js;
- chessground or another fast board UI, subject to license choice;
- local state for the active branch graph;
- WebSocket for opponent moves and analysis progress;
- PGN variation export.

## Server

Prototype choices:

- Python/FastAPI is fastest for engine orchestration and data work;
- Go or Rust is attractive for a long-lived service and corpus parser;
- a hybrid is reasonable: TypeScript UI, Python control plane, Rust stream processor later.

Avoid optimizing language choice before the drill runtime is validated.

## Core modules

### Pack Registry

Loads, validates, versions and indexes drill packs.

### Session Runtime

Applies legal moves, maintains clocks/objectives, emits events, evaluates stop conditions.

### Position Graph

Immutable nodes with parent pointers and branch metadata.

### Opponent Broker

Selects corpus, Maia, Stockfish or tablebase policy according to phase and pack.

### Evidence Service

Caches Stockfish, Maia, corpus, tablebase and feature-extractor results by position/context.

### Feedback Composer

Produces structured comparison from the pack contract and evidence packet.

### Corpus Index

Queries move/transition statistics and source games.

### Scheduler

Queues exact retries, varied retries and related transfer positions.

## Event model

Suggested events:

```text
run.started
move.committed
opponent.move_selected
checkpoint.reached
objective.state_changed
branch.forked
run.rewound
segment.completed
feedback.generated
outcome.reached
transfer.scheduled
```

Persist events; derive current state. This makes replay, debugging and schema evolution easier.

## Engine process management

- warm worker pools;
- one UCI session per worker;
- bounded concurrent searches;
- cancel stale searches after rewind;
- position/result cache;
- shallow interactive and deep asynchronous queues;
- per-pack deterministic seeds for reproducibility.

## Analysis cache key

Include:

- full position state;
- relevant history/repetition context;
- engine/model version;
- settings such as depth/nodes/Elo/temperature;
- tablebase version/path;
- feature-extractor version.

## Data stores

### Prototype

- SQLite or PostgreSQL for users, packs, runs and branches;
- filesystem for pack source and exports;
- in-memory cache or SQLite cache for one user;
- DuckDB over Parquet for bulk corpus.

### Small alpha

- PostgreSQL;
- Redis only if queues/cache require it;
- MinIO or filesystem for source PGNs and artifacts;
- no Kafka, no distributed services.

## Security

For a local deployment:

- bind privately by default;
- optional local auth;
- sandbox imported PGNs and pack files;
- validate all FEN/PGN and JSON Schema inputs;
- bound engine CPU/memory;
- never pass untrusted text directly to shell commands;
- treat LLM output as untrusted display data.
