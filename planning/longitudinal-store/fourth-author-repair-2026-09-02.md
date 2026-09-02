# Longitudinal store — fourth author repair

- **Date:** 2026-09-02
- **Scope:** RFC contract and disposable falsifier only; no product migration, worker, reader,
  consumer or content bytes
- **Rows:** [[D2402]]–[[D2406]]
- **Gate:** fresh independent buildability review still required

## Result

The third fresh return's five findings are repaired as one durable snapshot-operation boundary.

1. Wrong derivation revision atomically deletes prior derived rows, invalidates claims/failures and
   queues the current source head at completion zero. Complete, running, retry-wait and quarantined
   states converge; rollback and rerun are explicit.
2. Replacement storage no longer promises historical cuts. The typed reader accepts only the
   current `requested_seq`; a retained N against current M returns `cut_superseded` without data.
3. Synchronous semantic work moves to a Node worker thread with its own SQLite connection. Lease
   renewal is an in-loop decision checkpoint, not a starvable timer. The implementation gate uses
   the real 80-ply arm and explicit event-loop/route budgets.
4. Shared-run structure facts abstain at revision 1 because their events have no durable actor.
   Single-player structure remains; a later event revision may earn shared attribution.
5. Source digest enters job and claim identity. Invalid snapshots quarantine immediately;
   transient errors back off and exhaust at fixed bounds; unchanged polling/restart cannot reopen
   them, while changed source truth or derivation revision can.

## Executable evidence

`make longitudinal-store-fourth-author-repair` runs the retained 24-arm author suite and 8 new
able-to-fail controls. The new arms cover four-state revision reset, SQLite rollback/commit, the
N→M cut race, worker-thread/checkpoint vocabulary, shared-structure abstention, retry boundaries,
source-digest claim invalidation and closed DDL/status vocabulary.

This is author evidence, not acceptance. Another fresh independent reviewer must reconstruct the
operation and try to falsify it before implementation is lawful.
