# Pack capability contract — seventeenth fresh independent buildability review

**Date:** 2026-09-06

**Verdict:** **returned** on [[D3002]]–[[D3008]]

**Authority tested:** `planning/pack-capability-contract/sixteenth-author-repair-2026-09-05.md` and
`tools/d2802-pack-capability-sixteenth-author-repair/model.mjs`

## What the executable review establishes

`make pack-capability-seventeenth-fresh-review` retains the complete predecessor chain and runs
7/7 new able-to-fail counterexamples. The sixteenth repair closes its named request/payload,
canonical-response and transition-mutation seams, but it does not yet establish one durable
provider, retry, lease, clock and batch authority.

1. **[[D3002]] — two success shapes.** The normative `DurableEvidenceSettlement` requires
   `acquisition`; the executable parser and writer require `provider` and reject the declared arm.
2. **[[D3003]] — provider receipts remain structural.** Caller-created availability and failure
   objects pass as the "real" provider-health/exchange authority the RFC says the job layer must
   consume rather than mint.
3. **[[D3004]] — origin and terminal effect cross.** Explicit analysis accepts provider-unavailable
   `settled_empty`; Story and run enrichment accept `settled_unavailable`, reversing the compiled
   table while keeping otherwise valid consumers.
4. **[[D3005]] — validated bytes are discarded.** Retry parsing validates the real stored union
   through the sixteenth layer and then returns the base parser's substituted `{}` basis.
5. **[[D3006]] — provider work starts on stale expiry.** Changing the durable expiry after lease
   load does not stop `requestEvidenceProvider`; the start operation rejoins neither expiry nor the
   database clock.
6. **[[D3007]] — two clocks invert the timeline.** Provider retrieval uses mutable process-global
   time while settlement uses SQLite time. A retrieval timestamp in 2050 commits in a settlement
   recorded by the database in 2026.
7. **[[D3008]] — parent batch authority is unchecked.** Rewriting the parent request, digest and
   job count after lease load does not stop the child from settling successfully.

## Required bounded author repair

The next repair must:

- choose the accepted provider-exchange success field and make prose, parser, writer and replay
  set-equal;
- consume operation-issued provider availability/failure authority rather than structural copies;
- encode origin, consumer and provider-off terminal effect in one exhaustive durable union;
- parse and return the same canonical retry basis bytes;
- begin provider work under a current database-owned lease/expiry comparison;
- use one ordered request/retrieval/settlement clock authority; and
- reload and validate the complete parent batch request, digest, ordinal and count before settling.

Another genuinely fresh independent review is required after that repair. No production pack
schema, migration, queue, storage, provider, route, client, content or corpus byte is authorized by
this return.

## Receipt

- `make pack-capability-seventeenth-fresh-review`: complete predecessor chain green; 7/7 new tests.
- Executable controls: `tools/d3002-pack-capability-seventeenth-fresh-review/`.
- Protected design and `archive/` were not edited.
