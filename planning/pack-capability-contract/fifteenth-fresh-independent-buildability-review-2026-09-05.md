# Pack capability contract — fifteenth fresh independent buildability review

Date: 2026-09-05

Verdict: **returned** on [[D2771]]–[[D2777]]. No production, schema, migration, content, route,
client, archive or protected-design byte changed.

## What was tested

`make pack-capability-fifteenth-fresh-review` retains the complete predecessor chain and runs six
new executable groups against the fourteenth author model and the RFC's literal SQLite DDL:

1. replay after erasing terminal columns and resurrecting a lease;
2. settlement through a lease expired in 2000;
3. arbitrary values plus crossed provider identity, endpoint and response digest;
4. an objective transition whose from-state and evidence set differ from its request;
5. coordinated rewrite of the current run revision and stored application receipt; and
6. persistence of literal `now` terminal clocks.

All six reproduce. The first group establishes both [[D2771]] and [[D2775]].

## Consequence

The repair improved joins around the values it selects, but the durable protocol is not closed.
Each operation reads a different subset, the provider object still mints its own evidence, and the
receipt authenticates no immutable transition predecessor. Acceptance would therefore authorize a
storage boundary that can convert expired or invented inputs into learner-visible chess evidence
and then replay a rewritten history as valid.

## Required repair

- one exhaustive state-specific parser for every durable job read;
- an internally observed canonical transaction clock and expiry CAS;
- the accepted provider-exchange delivery and kind-specific value parser as the sole success mint;
- an exact objective-request/proposal/evidence-set join;
- an immutable before/after transition record bound to application receipt and current image; and
- negative fixtures for every corrupt row state, crossed source and coordinated rewrite.

Another genuinely fresh review remains mandatory after the repair. Pack schema 0.30, the migration
and D560's held corpus application remain unauthorized.
