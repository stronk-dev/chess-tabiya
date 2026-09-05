# Pack capability contract — sixteenth author repair

**Date:** 2026-09-05
**Scope:** bounded contract repair for [[D2802]]–[[D2808]]; no production, schema, migration,
provider, route, client, pack or content implementation.

## Outcome

The seven sixteenth-review attacks now fail under one composed disposable model:

1. engine identity/search bounds and tablebase FEN/source/piece count join the stored request and
   compiled provider before sealing and settlement;
2. provider response bytes must be the shared RFC-8785 canonical image;
3. retry basis is an exact provider-unavailable, shutdown or expired-lease union;
4. provider-unavailable empty/unavailable terminals carry exact availability and optional real
   failure receipts, with no invented duplicate reason;
5. every durable read re-derives origin→consumer and kind→provider-operation;
6. provider request and retrieval both fall inside the exact database-issued lease; and
7. same-migration SQLite triggers make retained transitions append-only for the application while
   preserving whole-owner cascade deletion.

The prior sixteenth fresh-review fixture is deliberately pinned to its pre-repair schema. This
prevents a later RFC amendment from silently turning a historical red reproducer green before its
successor target runs.

## Executable evidence

```text
make pack-capability-sixteenth-author-repair
  retained predecessor chain: green
  sixteenth fresh falsifiers: 7/7 reproduced against the pre-repair model
  sixteenth repair controls: 7/7 pass
```

Authority:

- `tools/d2802-pack-capability-sixteenth-author-repair/model.mjs`
- `tools/d2802-pack-capability-sixteenth-author-repair/contract.test.mjs`
- `rfc/pack-capability-contract.md` §5.2 and criterion 30

## Boundary

This is author evidence, not implementation. The RFC remains draft pending another genuinely fresh
independent review and its accepted provider-exchange dependency. Pack-schema lane 0.30, the
evidence-job/transition migration and D560's held corpus apply remain unauthorized.
