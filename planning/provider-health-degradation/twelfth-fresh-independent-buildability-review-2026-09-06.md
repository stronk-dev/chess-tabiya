# Provider health/degradation — twelfth fresh independent buildability review

**Date:** 2026-09-06

**Verdict:** return the eleventh repair on [[D2966]]–[[D2971]].

**Scope:** the composed provider-exchange, generation, lease, rate-limit, release-profile and cache
policy boundaries. Every previous review and repair remains retained by the Make dependency chain.

## Findings

1. **[[D2966]] — exchange outcomes are publicly mintable.** `ExchangeAuthority` is exported and
   constructible. A caller can create an invented current request and success without contacting a
   provider; `settle` accepts it and marks the provider available. A WeakSet seal proves only which
   public helper was called, not that provider exchange executed.
2. **[[D2967]] — generation transitions are caller labels.** `changeGeneration` accepts any new
   non-empty string with no configuration/supervisor preimage. Relabeling one Lichess member clears
   a real shared 429 block even when no provider artifact or behavior changed.
3. **[[D2968]] — the composed lease lifecycle regressed.** The public composition has acquire and
   settle but no renew or explicit expire. The predecessor implemented both, yet dependency
   retention does not make them reachable through the replacement authority.
4. **[[D2969]] — longer Retry-After is lost.** The sealed failure vocabulary carries only `reason`.
   A rate limit therefore always projects exactly 60,000 ms; no parsed longer delay can reach the
   group reducer despite three acceptance criteria requiring it.
5. **[[D2970]] — release and test composition are not separated.** A `local_fixture` provider passes
   configuration, snapshot, release issuance and release assertion. The resulting receipt can
   misrepresent test machinery as a release provider.
6. **[[D2971]] — cache policy is unenforced.** A 48-hour exact entry is accepted and remains a hit at
   hour 25, crossing the explicit maximum without an operation-selected TTL authority.

## Required repair

- make provider exchange the only opaque issuer of execution outcomes and keep test injection
  outside the production composition graph;
- accept only a derived generation transition over the complete behavior-affecting preimage;
- restore acquire/renew/settle/expire through the one private group authority;
- carry a validated bounded Retry-After in the exact failure and use `max(60s, upstream)`;
- require a release composition that refuses every `local_fixture` member; and
- bind cache insertion to the operation's declared TTL policy with a hard 24-hour maximum.

`make provider-health-twelfth-fresh-review` retains the complete chain and passes six current
counterexamples plus strict TypeScript. Green means the defects reproduce. No runtime, run-schema,
storage, provider product, content, archive or protected-design byte changed.
