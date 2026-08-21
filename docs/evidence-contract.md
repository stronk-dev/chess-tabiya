# Evidence contract

Tabiya does not treat “evidence” as one bag of engine output. The production contract is compiled
from one static catalogue in `packages/runtime/src/evidence-catalog.ts` and one server availability
join in `apps/server/src/evidence-manifest.ts`.

The distinction is deliberate:

- A **producer** is an implementation that can emit or abstain: rules, Stockfish, Syzygy, Maia,
  Explorer, shapes, authored claims, or recorded sidecars.
- A **projection** is one versioned meaning retained from that producer. A structural predicate and
  a structural reading are different projections. Stockfish evaluation and principal variation are
  different projections.
- A **consumer** is an operation with a permission and output consequence: an authored condition,
  deterministic guidance, external voice, a board overlay, the evidence inspector, comparison,
  opponent selection, or explicit analysis.
- An **adapter/binding** is an exact producer/projection/consumer edge. It can narrow timing, role,
  session, form, answer content, latency, and budgets; it cannot widen any of them.

There are no wildcard or “latest” bindings. The compiled manifest is sorted, frozen, and identified
by a SHA-256 digest. `/capabilities` returns that digest, current producer availability, and a
consumer-safe binding summary. It never returns engine lines, authored prose, provider secrets, or
corpus rows.

## Honest homes and raw evidence

Every projection is either bound to a consumer or has one explicit disposition:
`inspector_only`, `author_only`, `operator_only`, `experimental`, or `retired`. Every consumer is
likewise bound or explicitly disposed. This is why the migrated `assistance.arrows` preference is
visible as `experimental` even though it has no producer or renderer; omission would hide the very
gap the manifest exists to expose.

Raw structural tables, transition counts, human-model splits, corpus rows, engine lines, and
tablebase detail are **Evidence inspector** material. That label means “inspect the grounded input,”
not “Tabiya recommends this move.” Guidance modules remain a later selection/presentation layer.
Registering evidence does not make it learner-visible and does not create another setting.

## LLM boundary

The external voice renderer is a consumer, never a chess authority. Server guidance first wraps
source-specific values as `DeclaredEvidence`, then derives the exact `guidance.voice@1` view from
the compiled bindings. The provider receives that view and already-grounded deterministic
sentences. Maia candidates, Explorer rows, transition counts, shape plans, engine principal
variations, and recorded engine/tablebase prose do not enter merely because the catalogue knows
they exist.

Provider output still passes the deterministic noun, square, move, judgement, and prescription
checks. Recorded engine/tablebase sentences are appended afterward from frozen renderers. If the
provider fails or is absent, deterministic guidance remains available byte-for-byte.

## Provider-off behavior

Provider availability is runtime state, separate from static capability:

- Stockfish and Maia report `unavailable` when absent.
- Syzygy and Explorer report `honest_empty` where absence or domain limits are a valid empty result.
- Local rules, authored evidence, and recorded sidecars remain available without external services.
- External voice being absent does not make evidence or deterministic guidance absent.

Startup compiles the same aggregate as `make evidence-manifest-check`; an invalid declaration fails
before traffic is served.

## Adding or changing evidence

1. Start with the product operation that needs the information. Do not start with a raw toggle.
2. Add or version the producer projection with its literal semantics, operands, grounding,
   exactness, abstention, answer content, forms, dependencies, and limitations.
3. Add an exact consumer acceptance and adapter whose constraints only narrow both endpoints.
4. Add a producer-off test when any endpoint depends on a provider.
5. Add the production symbol to the 23-operation closure (or deliberately extend that census) and
   run `make evidence-manifest-check` plus `make verify`.
6. If no honest consumer exists, record one explicit disposition. Do not add a wildcard, legacy
   bypass, generic packet renderer, or user-facing primitive switch.

F1 answers eligibility and traceability only. Relevance/lift selection, semantic event valence,
presets, workflows, theory retrieval, and content migration belong to their later RFCs.
