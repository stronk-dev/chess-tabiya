# Shared candidate packet third fresh independent review — 2026-08-30

## Verdict

Returned. The D2198–D2201 author repair is present and its maintained contract passes 4/4 plus
typecheck, but two new contradictions make the packet contract unbuildable as written. No
production implementation is authorized.

## D2329 — projection identity is widened and dialect-split

The RFC defines `CandidateCollectorProjection` from arrays such as
`STRUCTURAL_EVENT_PROJECTION_IDS`. In production that array is constructed with `.map()`, so its
element type is `string`; unioning it with literal arrays widens the entire result to `string`.
The author fixture uses a separate three-literal model and therefore does not exercise the real
production type.

The same registry uses bare projection ids from production arrays but literal `@1` strings for
`legal_exchange` and `fork_survival`, while evidence values carry `{ id, version }`. Consequently
the stated output/result/value set-equality has no single identity dialect. Repair requires one
literal versioned-key authority derived from the compiled manifest, used consistently by registry
outputs, results, abstentions and value comparison. A negative must reject an arbitrary string
against the real imported production type.

## D2330 — readings-only is not dependency-closed

The RFC permits `{ events:false, readings:true }` and says scope filters whole declarations before
grouping. But `reading.legal_exchange` depends on `event.transition`, and
`reading.fork_survival` depends on `event.tactical` plus `reading.legal_exchange`. Filtering event
declarations makes both reading operations unexecutable.

Repair must either distinguish hidden dependency execution from retained packet output and derive
a dependency-closed execution plan for every scope, or remove the readings-only scope. Each scope
needs an executable set-equality fixture over planned collectors, retained outputs and excluded
outputs; prose that dependencies are earlier is insufficient.

## Verification

`make candidate-packet-third-author-repair` passes 4/4 plus its TypeScript fixture. The new
`make candidate-packet-third-fresh-review` passes 2/2 plus a current-symbol TypeScript proof that an
unregistered projection string is assignable today. The older red review targets remain preserved
historical falsifiers and are not current regression gates.

No schema, content, archive, production or protected-intent file changed.
