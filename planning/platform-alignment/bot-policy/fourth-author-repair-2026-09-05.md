# Bot policy — fourth author repair

- **Date:** 2026-09-05
- **Scope:** contract-tier repair of [[D2407]]–[[D2411]] after the third fresh independent return
- **Verdict:** repaired for another fresh independent review; no production, schema, migration,
  content, roster or client implementation is authorized
- **Reproduction:** `make bot-policy-fourth-author-repair`

## What changed

The repair keeps the prior 31-arm author contract and adds six executable inversion controls.

1. Tempered Maia masses are normalized before cumulative top-p membership. The actual bot compiler
   now matches the registered production sampler across the complete `0.5/0.3/0.2` distribution;
   the third move is excluded at T=0.8/top-p=0.92.
2. The persisted decision retains the complete time-bearing provider delivery and its delivery
   digest. Its deterministic derivation hashes a separate semantic projection that excludes only
   `requestedAt`, `retrievedAt` and `servedAt`. Moving those clocks changes provenance identity but
   not derivation; changing the response identity changes derivation.
3. `parseBotPolicyEventEnvelope` accepts unknown stored bytes and rederives the decision,
   pre-provider, commit and operation images. It cross-checks duplicated root/profile/seed/source/
   move operands, exact profile identity, provider input digests and positive chosen-move mass before
   returning a newly sealed deep-immutable envelope. Mutation controls cover every deterministic
   decision and operation family. Timing remains range/shape checked and deliberately outside the
   deterministic operation digest.
4. The bot contract imports `ProviderRegistrySnapshot`, `ProviderReleaseReceipt`,
   `ProfileAvailability`, `selectProfileAvailability` and `assertProviderReleaseReceipt` from the
   provider-health author checkpoint. Its four reduced local provider-health declarations are gone,
   and a structural snapshot substitute fails.
5. Global roster projection distinguishes available, conditional and unavailable. Unverified and
   recovering dependencies are conditional; `cached_exact_only` is
   `*_exact_request_required`, demonstrated using a real registry, failure and unrelated exact-cache
   entry. Guarded profiles additionally require the current provider-health release receipt.

## Verification

At this checkpoint:

- retained bot author contract: 31/31 passed;
- fourth repair inversion contract: 6/6 passed;
- both strict TypeScript programs passed;
- provider-health dependency chain passed through its seventh author checkpoint.

The target is enrolled in ordinary governance verification. A fresh reviewer must attack the new
semantic source image, unknown-byte parser and health join before the RFC may be accepted.
