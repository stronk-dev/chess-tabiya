# Provider-exchange fourth return — author handoff

**State:** author repair completed 2026-08-29; queued for fresh independent buildability review.
Production implementation remains blocked until that review accepts the complete bytes.

**Source review:** `fourth-independent-buildability-review-2026-08-29.md`

## Assigned repairs completed

1. **[[D2034]] — retain source occurrence and exact subject identity.** Every non-local leaf now
   carries its traversal occurrence and provider operation. A closed server resolver binds
   `{consumer projection, pathId, occurrence}` to exact recorded/build/provider subjects. Story's
   before/after evaluation is explicitly two Stockfish occurrences.
2. **[[D2033]] — close availability access and input.** The only public operation is bounded
   `POST /evidence/availability` over an authorized run event. It composes `requireRead`, reveals no
   arbitrary provider digest and rejects crossed operation/path/occurrence subjects.
3. **[[D2032]] — separate local Syzygy domain truth.** The scheduler's closed preflight produces a
   typed `local_domain_result` and separate exact local projection before retained/pending/queue
   work. Only in-domain provider success can carry an acquisition receipt.
4. **[[D2035]] — split clock authorities.** Monotonic milliseconds alone govern wait/execution/TTL;
   validated UTC wall samples alone govern receipts. Descriptors no longer supply `retrievedAt`.
5. **[[D2036]] — preserve dependency direction.** The public subject is run-event only. Module and
   preset policy remains in downstream operations and cannot be imported into provider exchange.

## Required attacks in fresh review

- Compile the same provider projection at two different occurrences and requests, then remove and
  cross each occurrence independently. Equal requests may coalesce only after both obligations
  survive.
- Exercise owner, current grantee, stranger, expired grant, unknown head, duplicate/overflow
  projections and wrong operation/path/occurrence without leaking cache state.
- Pass eight-piece local domain, a receipt-bearing in-domain draw and provider failure through the
  actual generic result union. The local arm must have no acquisition-shaped field at runtime.
- Reverse wall time while advancing monotonic time, then the converse; check deadlines, TTL and
  receipt fields independently. Search the landing for hidden wall-clock reads.
- Reject any `ModuleId`, module registry, preset or workflow-ceiling import from the provider layer.

## Required checkpoint

Run the repository targets without ad-hoc environment overrides:

```sh
make provider-exchange-contract provider-exchange-repeat-review provider-exchange-final-review provider-exchange-fourth-review
make verify
```

Current author result is 9 + 7 + 9 + 5 focused fixtures. Full verification and a fresh independent
review still gate acceptance; no provider, schema, content or learner-surface implementation is
authorized by this handoff.
