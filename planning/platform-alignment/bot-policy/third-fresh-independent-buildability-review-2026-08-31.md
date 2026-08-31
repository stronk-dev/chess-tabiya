# Bot policy — third fresh independent buildability review

- **Date:** 2026-08-31
- **Reviewer:** codex, independent of the Claude third author repair
- **Input:** `rfc/bot-policy.md` after the D2219–D2226/D2364 repair
- **Verdict:** **returned on D2407–D2411; no catalog, schema, migration, route, roster or client implementation is authorized**
- **Executable reproduction:** `make bot-policy-third-fresh-review` — 5/5 blocker controls pass

## What survived re-review

The repair usefully fixes the eight seams it names. The twelve profile identities carry one exact
model/sampler declaration; pawn classification reads legal board roles rather than UCI prefixes;
the source view retains shared provider deliveries; the public route has a closed result algebra;
the operation distinguishes pre-provider retry identity from first-flight commit identity; and the
catalog/reason/layer vocabulary is closed in the author model.

Those are real improvements. They do not make the RFC buildable yet. Applying the executable model
to the sampler boundary, deterministic image, durable parser and provider-health dependency found
five blockers. Three are dynamic positive controls; the other two join the exact author and
dependency authorities at their declared symbols.

## Blocking findings

### D2407 — top-p is applied before normalization

The RFC specifies reconstruction as `p^(1/T)`, cumulative top-p over that reconstructed
distribution, then final renormalization (`rfc/bot-policy.md:337-349`). The already-landed neutral
foundation does exactly that: it normalizes tempered weights before its cumulative cut
(`apps/server/src/bot-policy-catalog.ts:327-336`).

The author implementation instead accumulates raw powered values and calls `normalized(topP)` only
after truncation (`tools/d1970-bot-policy-author-repair/contract.ts:392-402`). With masses
`0.5/0.3/0.2`, T=0.8 and top-p=0.92, the declared implementation drops the third move while the
author model retains it at positive mass. The 837-cell “positive control” reads two precomputed
summary rows from `results.json`; it never sends that population through `compileBotPolicyExecution`.
It therefore remains green while the implementation it supposedly binds is wrong.

Normalize once before ordering/cumulative membership, or delegate to the landed registered sampler
instead of reimplementing it. The conformance fixture must execute the actual constructor over the
captured rows and compare the entire admitted set/distribution, not only summary values computed
elsewhere.

### D2408 — the deterministic digest includes delivery time

The RFC states that the deterministic decision contains no delivery timestamps
(`rfc/bot-policy.md:880-887`). It also correctly requires the complete admitted delivery to remain
available for provenance. Those are two different projections of one source.

The author model collapses them. `RegisteredBotProviderInput` retains the full delivery
(`contract.ts:163-172`), and `projectBotPolicyDecisionRecord` places that object directly inside the
body hashed as `derivationDigest` (`:448-470`). The shared delivery contains `requestedAt`,
`retrievedAt` and `servedAt` (`shared-provider-contract.ts:82-109`). Identical model/request/payload
bytes reacquired later therefore change the supposedly deterministic derivation and can turn
equivalent concurrent first flights into a conflict.

Keep the complete delivery beside the decision for provenance, but derive one exact semantic
source/payload identity for the deterministic image. A timing mutation with identical semantic
bytes must preserve the derivation digest while a request, actual model, response digest or payload
mutation must change it.

### D2409 — save/reload validates the caller against itself

`saveReloadEnvelope` serializes a caller-provided structural object, recomputes only the operation
digest, then compares the deserialized decision digest string with the same caller's digest string
(`contract.ts:562-569`). It never recomputes the decision image and never requires the sealed
decision constructor.

The executable control changes `decision.chosenMoveUci`, leaves the old derivation and operation
bytes in place, and calls save/reload. The forged move survives; the decision and operation now name
different chosen moves. Provider delivery checks do not protect layers, weights, sources or chosen
move.

Persistence/replay/export need one parser over unknown stored bytes that reconstructs the closed
image, recomputes both digests, cross-checks duplicated operands and only then returns a sealed
envelope. Fixtures must mutate every decision and operation family after serialization.

### D2410 — provider health is copied rather than imported

The RFC and D2364 make the dependency explicit: bot policy imports the exact
`ProviderRegistrySnapshot`, operation result and release receipt and defines no parallel health
enum (`rfc/bot-policy.md:51-55`). The author contract nevertheless declares
`BotProviderInstanceSnapshot`, `BotProviderOperationAvailability`, `BotProviderRegistrySnapshot`
and `BotReleaseReceipt` locally (`contract.ts:572-594`). These reduced copies omit most of the
dependency's state-valid fields and make the author fixture independent of the checkpoint it claims
to test.

The next repair must compile against provider health's exported symbols after that claim-free
checkpoint lands. A copied structural substitute must fail the author/buildability gate.

### D2411 — an exact cache hit becomes global roster availability

Provider health states the boundary plainly: global health never says an exact cache entry applies
to the current request, and clients may not turn `cacheScope:"exact_request"` into a generally
enabled feature (`rfc/provider-health-degradation.md:262-265`).

The bot selector accepts a snapshot with `cached_exact_only`, has no request digest or cache key,
and returns `{kind:"available"}` (`contract.ts:594-613`). The executable control demonstrates that
for the baseline profile. A roster card shown before a position/root exists therefore advertises a
bot from a cache that may contain only some unrelated prior position.

Use an honest conditional/unavailable roster state before a root exists, or resolve availability
after the exact request and return a request-bound receipt. Guarded families need the same rule for
both Maia and Stockfish; a release receipt does not establish a cache hit for a root.

## Required next author round

One repair should close the execution boundary rather than add more summary assertions:

1. reuse or exactly delegate to the normalized registered sampler;
2. split complete provenance delivery from deterministic semantic source identity;
3. parse and rederive durable envelopes from unknown bytes;
4. consume the landed provider-health types without a bot copy; and
5. distinguish global profile readiness from request-bound cached availability.

The next author target must retain the useful 31 existing arms, execute the captured sampler
population through the real constructor, and invert all five controls here. Another fresh
independent review remains mandatory before acceptance or implementation.
