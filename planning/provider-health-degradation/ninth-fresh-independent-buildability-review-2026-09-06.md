# Provider health/degradation — ninth fresh independent buildability review

**Verdict:** return the RFC on [[D2869]]–[[D2873]]. The eighth author repair closes its three
named return conditions, but the composed checkpoint still cannot preserve independent operation
authority under ordinary concurrent reads, cache traffic, or provider reconfiguration.

## Reproduced blockers

1. **[[D2869]] Read-only snapshot creation revokes another reader.** `ProviderRegistry.snapshot()`
   always replaces the single `#currentSnapshot` object. Two snapshots at the same monotonic time,
   registry revision and instance state are byte-equal, yet creating the second makes
   `selectProfileAvailability(first, ...)` fail. No health, cache or generation transition occurred.
2. **[[D2870]] Cache application grain is caller-mintable.** `CacheKey` has no issuing authority and
   `ExactCache.put` validates only provider operation/instance/implementation/generation/request.
   A valid external-voice delivery can therefore be inserted and served under forged
   `opponent.maia_inference` / `select` application labels.
3. **[[D2871]] Unrelated cache traffic invalidates a live backoff lease.** A Lichess generation set
   is pinned to the whole registry revision. Inserting an external-voice cache entry advances that
   revision, so the already-acquired Lichess claim can no longer settle even though neither Lichess
   member, its generations, nor its backoff state changed.
4. **[[D2872]] Application settlements bypass the promised strict parser.** `settleOperation`
   accepts structurally assembled settlements and does not enforce exact keys. A success carrying
   an invented field passes, and `local_domain` accepts an arbitrary caller-authored value rather
   than the RFC's sealed `ProviderLocalDomainResult<K>`.
5. **[[D2873]] Implementation changes may reuse a generation and retain the old group claim.**
   `changeGeneration(instance, sameGeneration, newImplementation)` is accepted. Because group
   identity hashes only instance/generation, the new remote→local configuration receives the old
   digest and remains blocked by the predecessor's claim. This contradicts §3 and criterion 22,
   which require behavior-affecting implementation changes to change generation and clear claims.

## Evidence and required repair

`make provider-health-ninth-fresh-review` retains the complete predecessor/repair chain and passes
5/5 independent falsifiers. A passing review target means all five defects reproduce; it is not an
acceptance signal.

The next author repair must replace single-object snapshot currentness with revision/state authority
that concurrent read-only snapshots can share; seal cache keys from the compiled declaration and
exact request; scope group leases to their group generation image rather than unrelated registry
traffic; parse every settlement arm exactly and require the provider-exchange local-domain
authority; and reject any implementation/configuration change that does not produce a distinct
generation identity. Production implementation remains unauthorized.
