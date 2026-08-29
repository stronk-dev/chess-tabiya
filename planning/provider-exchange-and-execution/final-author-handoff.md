# Provider-exchange third return — author handoff

**State:** author repair completed 2026-08-29; queued for fresh independent buildability review.
Production implementation remains blocked until that review accepts the complete bytes.

**Source review:** `final-independent-buildability-review-2026-08-28.md`

## Assigned repairs

1. **[[D2000]]/[[D2001]] — close the mapped exchange.** Make success/failure distributive by
   operation and give the scheduler one operation-keyed private receipt constructor with exact
   provider/requested/actual identity maps.
2. **[[D2002]]/[[D2003]] — close scheduler resource ownership.** Scheduler-minted waiter deadlines,
   waiter-local settlement, last-waiter abort, exact dedup/admission ordering, positive retention
   weights, explicit entry cap and deterministic eviction.
3. **[[D2004]] — represent Syzygy domain abstention.** One discriminated result must separate
   outside-domain from provider/transport failure and chess outcomes.
4. **[[D2005]] — remove false source suitability.** Preserve `CORPUS_GUARD` only as the shared
   disclosure; sample acceptance belongs to a literal named consumer projection.
5. **[[D2006]]/[[D2007]] — make Stockfish request and response deterministic.** Descriptor-owned
   exact commands/digest, mandatory WDL option/reset behavior and one iterative output reducer.
6. **[[D2008]] — publish the digest registry.** Exact domain tags, canonical images, encodings and
   prefixes for every provider/path identity.

## Required checkpoint

- Preserve [[D1871]]–[[D1878]], [[D1943]]–[[D1944]], [[D1950]]–[[D1957]] and [[D1969]].
- Replace—not delete or weaken—the nine arms in
  `tools/d2000-provider-exchange-final-review/` with crossed author-contract fixtures.
- Run `make provider-exchange-contract`, `make provider-exchange-repeat-review`,
  `make provider-exchange-final-review` and `make verify`.
- Return the complete bytes for a fresh independent buildability review. Do not implement the
  provider layer or dependent Review/bot/collector work before acceptance.
