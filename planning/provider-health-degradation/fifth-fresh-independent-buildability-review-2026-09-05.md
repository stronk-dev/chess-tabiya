# Provider health/degradation — fifth fresh independent buildability review

**Date:** 2026-09-05

**Verdict:** returned on [[D2753]]–[[D2761]]. Neither implementation checkpoint is authorized.

## What was tested

The review retained every prior author gate, then attacked the fourth repair independently at its
claimed checkpoint and authority boundaries. `make provider-health-fifth-fresh-review` executes
nine reproductions:

1. the checkpoint omits `ProviderRegistrySnapshot`, `ApplicationProviderOutcome`, the
   profile-availability selector and a generation-bound release receipt;
2. changing both local operation lists together passes without a live consumer;
3. a caller mints a sealed text identity for text that was never rendered;
4. crossed delivery provenance and unrelated payload enter an unbounded 513-entry cache;
5. a Maia delivery settles the Stockfish-analysis stage as complete;
6. caller-authored `unverified` state heals to available without a live exchange;
7. an old-generation lease blocks acquisition for a new generation;
8. JSON-round-tripped state authorizes opponent retry without storage; and
9. the cited provider-health author gate was absent from `make verify`.

The ninth finding was repaired in the review itself by enrolling this independent review target in
`verify-governance`; the other eight are RFC/author-contract blockers, not production fixes.

## Consequence

This is the dependency blocking [[D2410]] in concrete form: bot policy cannot import exact provider
health authority because the claim-free checkpoint does not yet publish it. A repair must derive
application closure from committed consumers, make all mints private to their live/storage
authorities, join every delivery/cache/settlement subject, implement the bounded cache and generation
lease behavior, and compose opponent recovery with durable run events. Fresh independent review is
required after that repair.
