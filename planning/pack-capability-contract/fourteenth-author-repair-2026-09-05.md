# Pack capability contract — fourteenth author repair

- **Date:** 2026-09-05
- **Repairs:** [[D2742]], [[D2743]], [[D2744]], [[D2745]], [[D2746]], [[D2747]]
- **Gate:** `make pack-capability-fourteenth-author-repair` — complete retained chain plus 6/6
- **Verdict:** author repair complete; another genuinely fresh independent review required

## Repair

Run and job leases are now capabilities of one exact application database. An equal row in a
second database cannot accept a lease issued by the first. Settlement loads the running job inside
the transaction, parses the complete provider success, and joins payload kind/source plus
acquisition operation, provider, lease generation and normalized request identity to the stored
request before allocating a sequence or changing durable state.

The success parser represents both literal-null and exact non-null objective proposals. The latter
retains immutable node, move and evidence-reference operands, so close/reopen can reproduce the
same objective event without rerunning a provider or manufacturing judgement.

Consumed replay reparses and rejoins the canonical stored request, settlement and application
receipt on every read. Its receipt is bound to the retained before/after run revisions and exact
event journal. Batch replay accepts only the durable batch id and loads the authoritative run image
inside the storage operation; callers cannot make an obsolete snapshot authoritative.

## Evidence and boundary

Six repair groups independently cross database authority, provider/job identity, non-null objective
success, corrupt consumed storage, floating receipt revisions and stale caller snapshots. The target
retains every predecessor author and adversarial-review target. This is disposable contract-tier
evidence only: it changes no production collector, provider, route, schema, migration, pack or
content byte. Another genuinely fresh independent buildability review still gates acceptance and
implementation.
