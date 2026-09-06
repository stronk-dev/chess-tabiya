# Provider health/degradation — tenth fresh independent buildability review

**Verdict:** return the RFC on [[D2912]]–[[D2915]]. The ninth author repair closes its five named
return conditions, but the composed checkpoint still disagrees with its own exact-cache, current
time and group-shared admission contracts.

## Reproduced blockers

1. **[[D2912]] Conditional cache inventory becomes a false exact hit.** The registry correctly
   reports that some current-generation cache row exists for a failed instance. However,
   `selectProfileAvailability(snapshot, operationId)` accepts neither the request nor its issued
   cache key and nevertheless returns `cached_exact_only`. A second request to the same voice
   instance is therefore advertised as an exact cached result while its atomic cache resolution is
   a miss. The RFC explicitly distinguishes those two states.
2. **[[D2913]] Release currentness omits current monotonic time.** A snapshot issued immediately
   after a timeout is rejected once its retry projection crosses the five-second boundary, as the
   repaired contract requires. A release receipt minted from that snapshot remains accepted at the
   same later state because its assertion accepts no time sample and checks only revision plus
   generations. The receipt outlives the state image that authorized it.
3. **[[D2914]] Shared backoff is absent from operation availability.** After an Explorer 429, the
   Lichess coordinator correctly blocks a tablebase acquire for 60 seconds while a fresh tablebase
   selector reports `requestable_unverified`. The provider registry and coordinator are separate
   authorities with no joined projection, so `/capabilities` cannot truthfully represent whether
   the operation can be admitted now.
4. **[[D2915]] A release receipt rejects itself under ordinary population order.** Receipt issuance
   retains configured generations in provider-declaration snapshot order; currentness validation
   rebuilds the same members in locale-sorted instance order. With Explorer and tablebase
   configured, the untouched freshly issued receipt immediately fails without any transition.

## Evidence and required repair

`make provider-health-tenth-fresh-review` retains the complete predecessor/repair chain and passes
4/4 independent falsifiers. A passing review target means all four defects reproduce; it is not an
acceptance signal.

The next author repair must keep conditional instance cache availability distinct from an atomic
exact-request cache result; require current monotonic state when validating release authority; join
the group coordinator's current admission state into the same operation/capability projection while
keeping instance health separate; and derive receipt issuance and validation from one canonical
generation-image function. Production implementation remains unauthorized.
