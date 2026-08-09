# RFC-0002 — Immutable Branch and Rewind Runtime

## Status

Proposed.

## Decision

Represent every move as an immutable node in a directed tree rooted at the drill start. Rewind changes the active cursor; the next move forks a new branch.

## Node fields

- node ID;
- parent ID;
- move SAN/UCI;
- complete resulting state hash;
- ply and actor;
- branch ID;
- checkpoint references;
- objective state;
- engine/human evidence references;
- timestamps and clock state.

## Invariants

- old nodes never mutate;
- a branch is a named path, not a copied game;
- full move history remains recoverable;
- rewinding cancels stale analysis jobs;
- branch export produces legal PGN variations;
- comparison aligns nodes by relative ply from fork.

## API sketch

- `POST /runs`
- `POST /runs/{id}/moves`
- `POST /runs/{id}/rewind`
- `POST /runs/{id}/fork`
- `GET /runs/{id}/graph`
- `POST /runs/{id}/compare`
