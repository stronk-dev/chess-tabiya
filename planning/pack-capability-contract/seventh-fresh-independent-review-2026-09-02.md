# Pack capability contract — seventh fresh independent buildability review

- **Date:** 2026-09-02
- **Artifact:** `rfc/pack-capability-contract.md` after the seventh author repair
- **Verdict:** return to author on [[D2518]]–[[D2520]]
- **Executable review:** `make pack-capability-seventh-fresh-review` — 3/3
- **Author controls:** `make pack-capability-seventh-author-repair` and the cumulative
  `make pack-capability-author-contract` remain green
- **Production authorization:** none; [[D560]] remains whole

## What survived

The seventh repair closes the exact five seams it was asked to close. The Pack Studio registration
route is real; all 36 parsed run actions and the 48 method/body branches in the author image are
represented; all four group sources are distinct; Position/imported runs no longer impersonate a
pack; and provider-off behavior is read from a consumer rather than copied into a route row. Those
are genuine advances and the author harness reproduces them.

The fresh attack found that the claimed population still stops at the synchronous request layer.
Two production surfaces outside that layer make the contract incomplete.

## Blocking findings

### D2518 — the browser-facing public Story route is outside the external-route image

Production calls `service.publicStory(...)` from two routes:

- `GET /api/shared/:token/story`, the JSON route present in the author image; and
- `GET /shared/:token`, the HTML social card route absent from it.

The second route reaches the identical Story evidence enqueue and can therefore bypass the future
generated operation check while the 58-operation census remains green. It also shares its path with
the live-session join fallback, so its exact router branch/discriminant must be represented rather
than inferred from the service method name. The author test validates selected external literals;
it does not derive or set-equal the external route population as the RFC promises.

### D2519 — provider closure omits the asynchronous evidence worker

`EvidenceJobQueue.#execute` makes two run-owned provider calls that are absent from
`providerCallSites`: `EvidenceExecutor.execute(...)` reaches Stockfish and
`TablebaseSource.probe(...)` reaches Syzygy. The queue is not a detached authoring utility. It is
fed by explicit analysis, automatic post-move evidence, imported-game Story preparation and Story
reads. The proposed provider census ranges over only `rest.ts`, `service.ts` and `guidance.ts`, so a
worker-side provider call can be added or changed without moving the claimed operation image.

The repair needs explicit queued-operation identities carrying the authenticated run/session
source, plus a set-equal census of the evidence-worker gateway population. Counting only the
handler that enqueues a job is not provider-call closure.

### D2520 — request effects cannot represent asynchronous settlement

`POST /runs/:id/analysis` returns HTTP 202 with an `EvidenceJob` after `queue.enqueue(...)`.
Stockfish is called later in `EvidenceJobQueue.#execute`; provider failure is caught and appended to
the queue's failure list. No live HTTP request remains on which to return the RFC's promised
`unavailable → retryable 503 with no write` effect.

This is not merely an implementation-order concern. A provider can be healthy during request
admission and die before worker execution, and a persisted/recovered job may execute in another
process lifetime. The contract needs a two-phase admitted/settled algebra: pre-enqueue refusal or
honest-empty where knowable, and a durable typed job failure/retry/empty outcome after admission.
Story and automatic move evidence need the same treatment. A failed queued provider operation must
not be relabelled as a successful request, and a successful 202 must not claim provider delivery.

## Required next pass

Derive both public Story branches from the production router; add the evidence worker as a closed
provider-operation population; and specify request admission separately from asynchronous job
settlement, including provider loss before enqueue and after 202/restart. Then rerun the existing
58-branch controls plus able-to-fail worker and route negatives.

No schema, capability registry, migration, pack mutation, API enforcement or content implementation
is authorized from this returned draft.
