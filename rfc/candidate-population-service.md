# RFC: Candidate population service — the runtime that compiles, bounds and serves the packet

- **Status:** **draft — stub. Cut out of `rfc/shared-candidate-evidence-packet.md` on 2026-09-06 and
  not yet written.** This file exists so the execution and cache material removed from that document
  has a named home and a named owner ([[D1230]]), and so the findings raised against it stay routed.
  It specifies nothing yet. Nothing in it authorises implementation.
- **Author:** claude (cut record 2026-09-06); the cut material's original authors are claude and codex
- **Created:** 2026-09-06
- **Design refs:** `design/05-in-run-experience.md` §5 — the rung-0 split this service makes affordable
- **Exploration gate:** inherited from [[D1071]] 📊 and [[D1072]] 🐞, whose dossier is
  `design/research/shared-candidate-evidence-packet.md` and whose executable falsifier is
  `tools/d1071-candidate-packet-harness/`. No new gate is claimed and no new research is opened
- **Depends on:** `rfc/shared-candidate-evidence-packet.md` — that RFC owns the value this service
  compiles and serves; this one owns nothing about what a packet contains
- **Parent / amends:** cut from `rfc/shared-candidate-evidence-packet.md` §6.0/§6.3 and its
  Discharge D11
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-foundation-ux/candidate-packet-cut-plan.md`

```tabiya-claims
none
```

No pack, run, schema, migration, evidence-kinds or campaign lane is touched by a process-local cache
keyed on a content digest. This inherits the packet RFC's `none` on the same ground and for the same
reason ([[D936]]: a catalogue is not a table).

## Summary

`rfc/shared-candidate-evidence-packet.md` was cut to the contract its dependents carry. What came out
of it, and lives here, is everything about **how** the packet is produced and retained rather than
**what** it is: the construction seam, the closed success/cancellation/failure algebra, the yielding
execution model, single-flight, the queue and its bounds, cache admission and eviction, retained-graph
accounting, and the statistics snapshot.

This is a stub. It is deliberately unwritten, per [[D3034]]: the three engines are deferred until
something concrete needs them, and what cannot be justified by a real consumer stays unbuilt. The
packet RFC can be accepted and implemented without this one; a production consumer cannot ship
without it.

## Specification

### §1 — Inherited scope and its rows

Everything below was raised against author models of the packet RFC across fourteen fresh-review
rounds. Each is a real finding about a real model, none of them is production code, and none of them
is something a consumer of the packet waits for. They are recorded here so that writing this RFC
starts from the evidence rather than from scratch.

**Ownership, lifetime and the construction seam.** [[D1900]] — the shared fact cache returned a
consumer-specific view without knowing the consumer. [[D1947]] — `createApplication` was assigned a
service with no caller or route. [[D2099]] — the service had no exported construction boundary.
[[D3010]] — the product factory accepted the authority-injection fields it promised to refuse.
[[D3014]] — the public type erased request-scope correlation. [[D3015]] — the named collector-failure
test boundary did not exist, so collector failure was tested by throwing a prebuilt private error.
[[D1633]] — the RFC promised application injection and two operations but named no production path
that could execute them.

**The result algebra.** [[D1977]] — success, cancellation and failure had no public algebra.
[[D2097]] — request, result and projection scopes were uncorrelated. [[D2102]] — an injected yield
rejection escaped and failure projection reopened as `string`. [[D2937]] — valid non-FEN request
errors were reported as `invalid_fen`. [[D3011]] — the normative text, the prose and the model
defined three incompatible failure unions.

**Cancellation, yielding and single-flight.** [[D1960]] — `AbortSignal` could not interrupt a
synchronous ~1 s compilation. [[D1979]] — "portable macrotask yield" named neither a production
adapter nor a measurable topology. [[D2886]] — a queued job kept its queue deadline after it started.
[[D2936]] — a new caller could join a last-waiter-cancelled job after its controller was irreversibly
aborted. [[D2885]] — the service accepted a genuine receipt for the wrong request.

**Bounds, admission and eviction.** [[D2101]] — unique in-flight compilations escaped the cache
bounds. [[D2681]] — the factual cache key was caller authority. [[D2682]] — admission measured one
graph and could publish another. [[D2889]] — cache limits measured the predecessor graph rather than
the retained receipt. [[D2890]] — a wide-to-narrow projection hit did not refresh LRU recency.
[[D2938]] — cache gauges counted the process-wide manifest once per entry. [[D3016]] — the stats
snapshot drifted from its own closed field count.

**Retained-graph accounting.** [[D2627]] — the weight formula excluded objects the receipt keeps
alive. [[D2657]] — the walk skipped private wrappers the `WeakMap` retains. [[D2658]] — it silently
ignored non-enumerable accessors and symbol-keyed values it was supposed to refuse. [[D2659]] — the
category set-equality check was tautological. [[D2660]] — the measurement had no cache-admission
consumer. [[D2683]] — a frozen packet retained mutable legal values. [[D2841]] — the walker rejected
the private brands every real F1/semantic value carries. [[D3009]] — hidden dependency outcomes were
public on the receipt. [[D3013]] — retained-graph accounting was not the closed graph the RFC
specified.

**The memory envelope.** [[D1579]] — the retained item is not a memory-homogeneous unit; over sixteen
high-legal-count roots, eight event-only packets retained 52.28 MB while the equal-item full-scope
cache retained 91.78 MB. [[D1580]] — no release tier declares a numeric heap/RSS envelope, so a
deterministic cache bound is necessary and does not manufacture release clearance. [[D1632]] — a
naive opponent-cache rekey would collide history-conditioned Maia requests, which is why the packet
key sits *below* the provider and policy keys rather than replacing them.

### §2 — Criteria that moved here with their mechanism

Criteria **13** (single-flight, entry/byte/object bounds, eviction, oversize, FIFO admission and
deadlines), **26** (the public construction seam and the product factory's refusals) and **33**
(closed public support types and the stats snapshot) keep their numbers from
`rfc/shared-candidate-evidence-packet.md` so every existing citation still resolves. Their text is in
`planning/evidence-foundation-ux/candidate-packet-cut-plan.md` and is not restated here until this
RFC is written.

### §3 — What this RFC may not do

It may not restate, amend or re-derive anything in `rfc/shared-candidate-evidence-packet.md` §3–§5:
the packet's shape, its completeness rule, its retention-by-reference rule and its key are that
document's. This service returns that value and bounds its retention; it has no opinion about what is
in it.

It may not be widened back into a fourteen-round contract harness. [[D3034]] is the standing ruling:
review count is not rigour, and a document that manufactures its own blockers is the failure being
repaired.

## Deviations from design

**None.** Nothing is specified yet.

## Acceptance criteria

**None yet.** This is a stub; it has no acceptance surface until it is written. Criteria 13, 26 and
33 are reserved for it and are not asserted here, because a criterion nobody can run red is the
defect class [[D444]], [[D984]] and [[D1274]] name.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Write this RFC, or record that no consumer needs it. It is a stub created by a cut; a stub that is never resolved is a hiding place | codex | `planning/evidence-foundation-ux/candidate-packet-cut-plan.md` | |

## Ledger rows

No new rows. Every row named in §1 is an existing ledger row inherited from
`rfc/shared-candidate-evidence-packet.md` by the 2026-09-06 cut.

## Changelog

- 2026-09-06 — created as a stub by the cut of `rfc/shared-candidate-evidence-packet.md`
  ([[D3034]]'s changed unit of delivery, second application). Carries the execution, cache and
  retained-graph material and its rows. Specifies nothing.
