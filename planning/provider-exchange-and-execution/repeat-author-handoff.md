# Provider-exchange second return — author handoff

**State:** queued for RFC author repair; production implementation remains blocked.

**Source review:** `repeat-buildability-review-2026-08-28.md`

## Assigned repairs

1. **[[D1950]] — retain provider delivery through Maia occurrences.** Replace both bare
   `MaiaPolicyPage` members with the admitted delivery authority and add crossed live/retained,
   generation and receipt-stripping fixtures.
2. **[[D1951]] — make Explorer history request state representable.** Publish a disabled/requested
   union over the provider's literal boolean; [[D1957]] confirms the official API has no history
   width. Cross disabled, empty-reported and populated arms.
3. **[[D1952]] — choose one operation callable contract.** Make descriptor map, exported operations,
   scheduler and application census compile the same context-bearing signature with no public
   scheduler bypass.
4. **[[D1953]] — make subject availability total over source leaves.** Publish exact per-leaf state
   plus derived path satisfaction, or a closed precedence algebra; cross mixed
   recorded/live/retained/unavailable cases.
5. **[[D1954]] — split pending and retained Maia identity.** Name and type the requested-byte
   pending key separately from actual-model/generation retained admission; cross cold and restart
   cases.
6. **[[D1955]] — publish literal Explorer migration operations.** Add closed summary and
   callable signatures retaining the delivery input. [[D1956]] corrects the played-occurrence
   half: `run.record.move@1` is not an exact edge, so route that derivation after
   `recorded-semantic-path`'s `run.record.edge@1` rather than manufacturing a private run authority.
   Cross the summary against a raw-row sentinel and make the deferred exact dependency explicit.

## Required checkpoint

- Preserve the original [[D1871]]–[[D1878]] and [[D1943]]–[[D1944]] repairs.
- Replace—not delete or weaken—the six reproduction arms in
  `tools/d1950-provider-exchange-repeat-review/` with able-to-fail author contract fixtures.
- Add the [[D1956]] dependency arm; the author checkpoint therefore contains seven arms.
- `make provider-exchange-contract` and `make provider-exchange-repeat-review` both pass.
- Return for another buildability review against live production symbols. Do not implement the
  provider layer or downstream collectors before that review.
