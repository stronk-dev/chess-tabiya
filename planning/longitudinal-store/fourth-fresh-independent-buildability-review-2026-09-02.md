# Longitudinal store — fourth fresh independent buildability review

- **Date:** 2026-09-02
- **Reviewer:** codex, independent of the Claude fourth author repair
- **Input:** `rfc/longitudinal-store.md` after the [[D2402]]–[[D2406]] repair
- **Verdict:** **returned on [[D2514]], [[D2515]], [[D2516]] and [[D2517]]; no migration, worker, reader or consumer implementation is authorized**
- **Executable reproduction:** `make longitudinal-store-fourth-fresh-review` — 4/4 blocker controls pass

## What survived re-review

The fourth repair closes the exact five findings it claimed. Revision replacement is now one
atomic invalidation; retained cuts cannot be relabelled as historical snapshots; semantic
projection is assigned to a worker thread with in-loop lease renewal; unattributable shared
structure abstains; and corrupt/transient work has bounded durable failure semantics. The retained
author controls are useful evidence for those properties.

The operation is still not buildable at the production boundary. Joining the new reader and worker
contract to multi-run result cardinality, the application's actual database default, the source
digest authority, and the emitted server artifact found four new seams. The fresh-review harness
tests the live RFC/application/package bytes and an actual pair of SQLite connections; it does not
repeat the author model's claims.

## Blocking findings

### D2514 — the result grain is smaller than the query grain

Both `all_complete` and `runs` may fix several cuts in one transaction. The result union gives
`failed` one `failureCode` and `attempts`, `pending` one optional `retryAt`, and `unavailable` one
reason. That cannot encode two quarantined jobs with different codes or attempt counts, two retry
deadlines, or mixed unavailable causes. The top-level `cuts` array has no status member that could
carry the missing truth.

This is not cosmetic API shape. Skills/style consumers need to distinguish complete history from
specific stale or quarantined runs without attributing one run's failure to every run. Repair with
per-cut status/results plus a deterministic aggregate readiness rule, or narrow the operation to a
single run and add a separate honest aggregate operation. Cross at least mixed failure codes,
retry deadlines, and unavailable causes.

### D2515 — the worker cannot see the default application database

`createApplication()` defaults `databasePath` to `:memory:`. The RFC requires the worker thread to
open its own SQLite connection. Two `DatabaseSync(":memory:")` connections are separate databases;
the executable control creates the job table and row through the HTTP-side connection and observes
an empty schema through the worker-side connection.

Define one shared database identity and transport it to the worker. The in-memory/test posture must
be explicit: use a worker-visible temporary file/shared authority, or disable longitudinal
readiness truthfully. A real provider-free application may not report the worker ready while the
worker is connected to another database.

### D2516 — the source digest has no byte-level authority

`requested_source_digest` is part of invalidation, claim renewal and publication CAS, yet its input
is only described as a “canonical” event prefix plus owner/authorship/match/import inputs. No exact
field image, sort order, encoding, domain/version prefix or shared constructor is declared. The
author model accepts a caller-supplied string and its tests use repeated-character placeholders;
none proves incremental scheduling and rebuild hash the same source bytes.

Add one exported constructor over an exact versioned source image. The seven write operations,
startup reconciliation, worker exact-prefix read and rebuild must all call it. Equivalent object
insertion order must hash identically; changing any consumed authorship/import field must change the
digest; job-state changes must not.

### D2517 — lifecycle and packaging stop at source code

The RFC invokes `application.start()` and `.stop()`, but the shipped application exposes creation
plus `close()`, and `main.ts` calls neither method. `/healthz` always returns `status: "ok"`, so an
unexpected worker exit has no specified observable readiness bytes. Finally, the server build is an
explicit esbuild entrypoint list and does not include `longitudinal-worker-thread.ts`; esbuild does
not materialize a separately addressed `./longitudinal-worker-thread.js` from the stated Worker URL
merely because that string exists in bundled source.

Specify one actual lifecycle over `createApplication`, listener readiness and `close`, including
worker-before-ready and drain-before-storage-close ordering. Define the degraded `/healthz`
projection. Add the worker entrypoint to the production build/package and require a test that runs
the built `dist`/container path, not only TypeScript source under Vitest.

## Required next author round

Treat these as one production snapshot service rather than four patches:

1. make read status match the cardinality of the fixed cut vector;
2. give the worker the exact same durable database identity as HTTP/storage;
3. make one versioned source-image/digest constructor authoritative everywhere; and
4. close startup, readiness, shutdown and emitted-worker packaging over the real application.

Retain the prior 32 author controls and the four fresh-review negatives. Another genuinely fresh
independent buildability review remains mandatory before acceptance or implementation.
