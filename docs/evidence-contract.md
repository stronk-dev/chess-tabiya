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
source-specific values as `DeclaredEvidence`, admits the exact scope-specific consumer view, then
runs registered per-projection renderers. Both admitted and rendered views carry a private runtime
seal. The provider and `voiceCheck` read the same sealed `{ evidence, sentences }` items; there is
no parallel packet sentence array that either side can widen. Maia candidates, Explorer rows,
transition counts, engine principal variations, and recorded engine/tablebase prose do not enter
merely because the catalogue knows they exist.

Compare and Story use declared `run.record` facts and deterministic `derived.*` projections rather
than trusting parallel prose arrays. Comparison trajectories, structure/timing strips, and recorded
piece routes pass their distinct admitted consumers. Story moments, prominence rank, title, public
share, and card prose are rendered from one admitted `review.story` view; raw Stockfish events are
derivation inputs, not story-delivery evidence. Derived projections enumerate non-empty exact-version inputs and may
not widen their inputs' grounding, exactness, answer content, or abstention. Reasoning review is a
separate non-chess provider request over the learner transcript, key points, and detections; it is
not a voice scope and receives no chess-evidence items.

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
5. Add the production symbol to the operation closure (or deliberately extend that census) and
   run `make evidence-manifest-check` plus `make verify`.
6. If no honest consumer exists, record one explicit disposition. Do not add a wildcard, legacy
   bypass, generic packet renderer, or user-facing primitive switch.

F1's bind stage covers twenty-three production operations. Producer computation and provider
acquisition are deliberately outside that consumer census; authored structural AST inputs and
computed results, evidence-reference resolution, normalized versus delivery claims, Explorer page
versus frontier results, recorded comparison points, sourcing-ledger records, and raw opponent
provider results all retain distinct payload identities. Every registered operation is anchored at
an exported sealed-view consumer rather than at copy or a DOM attribute.

F1 answers eligibility and traceability only. Relevance/lift selection, semantic event valence,
presets, workflows, theory retrieval, and content migration belong to their later RFCs.
