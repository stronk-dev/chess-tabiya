# Evidence jobs

Queued engine and tablebase evidence is durable. Admission, lease, retry, settlement, staged
results and consumption are rows in the application database, so an admitted analysis survives a
restart, a provider outage has a durable terminal outcome instead of a lost promise, and
applying a result is replay-safe. Public exact-batch terminal status remains missing (D3426);
durable settlement is not yet a learner-visible completion receipt.
Contract: `rfc/evidence-job-durability.md`.

## Storage (migration 27)

| Table | Meaning |
|---|---|
| `evidence_job_batches` | one admitted batch per `(run, origin, idempotency key)`: the canonical `evidence_batch_request@1` bytes, their digest and `job_count` (1–16) |
| `evidence_jobs` | one row per batch member; eight states (`admitted`, `running`, `retry_wait`, `settled_success`, `settled_empty`, `settled_unavailable`, `cancelled`, `consumed`) with lease owner/expiry/generation, retry basis, settlement, result sequence and application receipt |
| `evidence_result_sequences` | the per-run never-reused result counter; cancellation never rewinds it |
| `evidence_run_transitions` | the retained before/after run images of every application, append-only by trigger; only a whole-run (or whole-job) cascade removes a row |

Every read of a job row goes through one exhaustive parser (`apps/server/src/evidence-jobs.ts`):
state-specific columns are required or forbidden, the origin→consumer and kind→operation maps are
re-derived, stored JSON must be the canonical (RFC-8785) image of its parsed value, and every
receipt is re-joined to its job. A row that fails is `EVIDENCE_JOB_CORRUPT`, never best effort.

## Origins

| Origin | Owner | Key | Provider-off terminal |
|---|---|---|---|
| `explicit_analysis` | `POST /runs/:id/analysis` → `RunService.enqueueEvidence` | the caller's canonical-UUID `Idempotency-Key` | `settled_unavailable` |
| `story_completion` | superseded — no production owner since `rfc/review-evidence-compiler.md` §4.1 (import and story reads use the Review coordinator over the provider exchange); the vocabulary member and row parser remain | SHA-256 of `{story_evidence@1, branchId, terminalNodeId, chunk}` | `settled_empty` |
| `run_enrichment` | learner move, opponent ply, group seeds | `run_enrichment@1:<nodeId>` | `settled_empty` |

An equal key with equal bytes replays the stored batch and ids; the same key with different bytes
is `IDEMPOTENCY_CONFLICT` and writes nothing. Internal producers derive their plan only when their
key is absent. Enrichment batches commit in the same transaction as the run mutation that created
their nodes; rewind cancels the pruned nodes' admitted, running, retrying and staged jobs in the
rewind's own commit and keeps terminal rows as audit history.

## Calculation client

The run store retains one canonical UUID per literal ordered node request until a validated
admission arrives. Transport or receipt failure retains the key for explicit retry; a later
intentional calculation rotates it after acknowledgement. Actual authenticated HTTP/SQLite and
built-browser response-loss controls prove that the same canonical admission replays one batch
and its job ids. No automatic retry or browser persistence is introduced; changed canonical
server request operands retain the existing `IDEMPOTENCY_CONFLICT` behavior.

The ordinary calculation client validates the existing HTTP `202` receipt's complete ordered
batch/job/position/kind join before tracking it. Explicit pending jobs survive unrelated mutations
and automatic result application; only their own engine `bestline` attachment at the declared node
consumes them. Support remains pending while those exact jobs await delivery and releases its
control on completion. This client state is not a durable job-status API: settled-unavailable and
cancelled rows still have no public exact-batch status receipt, and root-only outstanding analysis
cannot yet be reconstructed after reload (D3426). No empty page or timeout is treated as a result.

## Worker

`EvidenceJobQueue` binds to the store when `RunService` is constructed. On bind it returns every
expired lease to `retry_wait` and resumes admitted work. Each claim increments the lease generation;
provider work starts only under a live lease, retrieval is stamped on the store clock and must fall
inside the lease, and settlement re-checks the exact lease tuple before allocating a sequence. A
stale, expired or cross-database lease settles nothing. Shutdown returns in-flight leases to
`retry_wait`. Provider unavailability retries under the composed policy (application: four claims,
five seconds apart) and then takes the origin's terminal effect; no absence ever mints evidence.

Cancellation releases the worker's logical concurrency slot without waiting for a provider or
objective upgrader to acknowledge abort. Shutdown returns each live exact lease to `retry_wait`
before releasing its flight and resolving `close()`. If storage cannot accept that transition,
the durable row remains authoritative for lease-expiry recovery; shutdown does not fabricate a
settlement. Late success or rejection cannot write evidence, disturb a surviving job, or settle a
replacement lease generation, including after the database reopens under the same worker name.
Provider transports still own physical I/O cancellation: freeing a logical slot does not prove a
remote request stopped. Run `make evidence-worker-lifetime-check` for the real SQLite cancellation,
shutdown, reopen and stalled-upgrader controls plus workspace typechecking.

## Stockfish result admission

The queued Stockfish executor selects a completed, unbounded main-line iteration, not the last
UCI token match. Depth jobs require the requested depth; movetime jobs use the greatest completed
depth with latest-arrival ties. Score, WDL and PV are never assembled across iterations, and the
task must end at its first `bestmove`. An alternate MultiPV line cannot supply the position's
evidence. Invalid output follows the existing unavailable settlement and attaches no chess fact.

This gateway still stores narrow durable packets. Its terminating selection is independent of the
PV's first move and remains preserved. Migration to whole shared provider deliveries requires the
separate D3373 source contract; this repair does not claim that migration or rewrite old evidence.
Run `make queued-stockfish-check` for the executor, durability and authoring controls.

## Application

`POST /runs/:id/evidence {resultSeq}` runs one storage transaction over the CAS-owned run: it
appends `evidence.attached`, the stored objective proposal's `objective.state_changed` (derived once
at settlement, never re-run), and — for `immediate_guard` runs — the registered recorded guard's
`feedback.generated` suffix; it retains the before/after images and marks the job `consumed` with an
`evidence_application_receipt@2`. Repeating the request returns the stored result without appending;
a tampered receipt, range, image or trigger set fails as corrupt.
