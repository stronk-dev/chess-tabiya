# Learner modules implementation return — novelty identity

**Date:** 2026-08-23
**RFC:** `rfc/learner-modules.md` §3a.2–§3a.4 / A18(d)
**Ledger:** D1164

## What is buildable now

The fourteen-field module declaration, exact registered cross-projection deduplication, directed
rules-only subsumption, post-reducer backstop observation, and recorder failure isolation are
buildable as written. The focused checkpoint implements them with permanent fixtures.

## Why position novelty returns

`factIdentity@1` uses `(equivalenceClass, subjectKey)`. For any projection absent from the closed
equivalence table, §3a.2 defines the class as the projection id and the subject key as the full
retained-operand serialization. Most facts that the ordinary modules consume are events, and their
retained operands include `nodeId`, move anchors, or before/after position identity. The same
chess fact recomputed at an ancestor node therefore has different identity bytes by construction.

The current A18(d) wording says only that a repeated fact at the window boundary is dropped. A
fixture can make that pass by giving both facts the same `nodeId`; a real ancestor path cannot.
That would be another instrument sharing the defect's assumption.

## Required amendment

For every projection eligible for novelty reduction, declare one of:

1. a stable equivalence class and exact compared fields that deliberately exclude volatile
   run-location operands while retaining mover/subject/polarity; or
2. `novelty: exempt`, with the reason the fact must remain visible when repeated.

The closure must be set-equal to the projections accepted by modules with `noveltyWindow > 0`.
Fixtures must use two distinct node ids and distinct move anchors; at the boundary the stable fact
drops, one step outside it survives. Positive-event and avoidance-event polarity must remain
different identities.

Until that amendment is accepted, the implementation preserves unregistered facts and reports
`noveltyAbstained: true`. It never claims those facts are new.
