# Shared candidate packet — D2097–D2104 author repair

- **Date:** 2026-08-30
- **Input:** fresh independent return on the D1977–D1981 repair
- **Verdict:** author repair complete; fresh independent review required
- **Author contract:** `make candidate-packet-second-author-repair` — 8/8 green
- **Historical falsifier:** `make candidate-packet-fresh-review` — 8/8 now red, intended inversion
- **Production:** unchanged and unauthorized

The eight findings reduce to one missing operation boundary. The RFC described a packet/cache but
did not define one scope-safe, constructible, executable and bounded service.

## Repairs

1. [[D2097]]: `CandidatePopulationRequest<S>`, service result and projector now carry one literal
   distributive scope relation; wrong static and runtime pairings refuse.
2. [[D2098]]: the unavailable, wrong-arity provider handoff is removed whole. D10 adds it only after
   provider exchange lands and must use `ProviderEvidenceDelivery<T,K>` exactly.
3. [[D2099]]: one exported product factory accepts manifest plus numeric limits and imports the
   legal authority, collector registry, scheduler and receipt constructors itself. Fault injection
   is module-private and absent from the product graph.
4. [[D2100]]: a thirteen-operation literal registry binds real callables to outputs, dependencies,
   scope and once-per-candidate cardinality. Projection arrays are generated views, not schedulers.
5. [[D2101]]: unique work has max-active, FIFO pending, absolute queue/compile deadlines, overload,
   last-waiter removal and idempotent shutdown; same-key single-flight consumes no second slot.
6. [[D2102]]: scheduler rejection is a typed result and collector failure projection is the closed
   registry-output union.
7. [[D2103]]: v1 carries literal `standard` ruleset through request, packet, key and collector
   context; unsupported/missing values refuse before FEN/job/cache construction.
8. [[D2104]]: the private executor seals exact per-call outcomes and the receipt retains them;
   abstention move/projection/reason is bijective to an unavailable outcome, distinct from
   available-empty.

No runtime, server, web, schema, content, archive or protected-design byte changed. The amendment
does not authorize implementation or claim Support, Review or bot reach.
