# Provider health/degradation — eleventh fresh independent buildability review

**Date:** 2026-09-06

## Verdict

Return the tenth repair on [[D2942]]–[[D2949]]. The seven repaired seams survive, but the current
checkpoint still has multiple health authorities, publicly mutable transition paths and an
incomplete operation-facing result. It cannot yet truthfully govern provider availability for
Support, Review, bots, theory, voice or deployment.

## What survived

The request-free cache state is no longer labeled an exact hit; release validation receives a
current monotonic sample; shared group state reaches availability; generation receipt order is
canonical; recovering is retained; missing required coordinators fail; and the snapshot-facing
transient sequence matches 5/15/60 seconds. This review keeps those fixes and attacks the composed
authority around them.

## Fresh returns

1. **[[D2942]] second provider/group map.** `GROUP_BY_INSTANCE` copies four bindings under a
   `Partial<Record<...>>` even though the RFC explicitly requires group membership to derive from
   `PROVIDER_INSTANCE_DECLARATIONS` and refuses a second map. Required-group closure, availability
   and predecessor generation sets can therefore drift under one type-correct declaration change.
2. **[[D2943]] public predecessor mutation authority.** `ProviderRegistry.prior()` exposes the
   entire predecessor registry. Changing its generation to `g2` leaves the wrapper's configured
   generation image at `g1`; a new snapshot reports `g2`, its release receipt reports `g1`, and
   `assertProviderReleaseReceipt` accepts the contradiction.
3. **[[D2944]] crossed coordinator ownership.** `registerCoordinator` is public and checks only the
   group name. A registry with a configured voice provider accepts a coordinator constructed by a
   different registry and uses that foreign object's group state in its own snapshot.
4. **[[D2945]] unchecked generation reset.** Public `coordinator.generationChanged()` clears claim,
   block and transient history without a provider-generation change or registry revision. The test
   converts an active 60-second Lichess block to available at the same time, generation, instance
   image and state revision.
5. **[[D2946]] unsealed settlement truth.** A lease holder supplies a plain caller enum to
   `settle`. The test records a sealed Explorer network failure in health, then independently
   settles the group as `{kind:"success"}` with no request or delivery; tablebase becomes
   requestable immediately. Health and group settlement must consume one exact exchange outcome.
6. **[[D2947]] missing exact-cache operation arm.** The repaired request-free union includes
   `conditional_exact_cache`, but `ProfileAvailability` contains no `cached_exact_only` member and
   no operation maps an atomic cache hit to it. A generic cache `{kind:"hit"}` is not the closed
   operation-availability result criterion 41 requires.
7. **[[D2948]] wrong client/wire authority.** The implementation returns singular `instanceId`
   rather than the RFC's `instanceIds`, and omits the required reason for both temporary blocks
   (`upstream_backoff` versus `group_claimed`) and unavailability (`not_configured` or provider
   failure). Clients cannot preserve the distinction the contract exists to expose.
8. **[[D2949]] clock-domain conflation.** `snapshot(now)` converts its process-local monotonic
   duration directly to civil ISO time. At monotonic 1 ms it publishes
   `1970-01-01T00:00:00.001Z`, contradicting the RFC's separate display-only civil timestamp.

## Executable evidence

`make provider-health-eleventh-fresh-review` retains the full predecessor chain and passes all
eight fresh counterexamples plus repository-compatible TypeScript. The target is part of
`verify-governance`.

## Required repair

One private composition authority must derive provider/group membership from the canonical
declarations, own coordinator construction, hide predecessor mutation and generation reset, and
atomically reduce a sealed provider exchange into both instance health and group state. It must
then expose the exact reason-bearing `ProviderOperationAvailability` wire algebra, including the
request-specific `cached_exact_only` result, and accept separate monotonic and civil clock inputs.
Another genuinely fresh review and the provider-protocol/provider-exchange prerequisites still
precede either runtime or durable implementation checkpoint.
