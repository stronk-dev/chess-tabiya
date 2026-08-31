# Campaign core — third author repair receipt

- **Date:** 2026-08-31
- **Input:** second fresh independent return [[D2244]]–[[D2252]]
- **Status:** core author repair complete; fresh independent review and dependency landing required
- **Production authorization:** none

## Repaired core

- [[D2244]]: a node pays progression only after a compiler-owned witness proves one committed
  learner move and either an absorbing objective or the exact authored boundary on that branch.
- [[D2245]]: `campaign_run_creations` stores learner/campaign/command identity, normalized operands
  and exact result before a generated run id is needed; creation is one transaction.
- [[D2246]]: `startCampaignEncounterExactlyOnce` atomically creates the play run, writes
  `run.started`/origin, appends `node_entered`, advances revision and sets the active pointer.
- [[D2247]]: active play-run deletion refuses; sealed deletion preserves campaign authority and
  returns a typed unavailable Review projection through export/restore.
- [[D2248]]: `campaignAssistanceAuthority` joins current inventory, loadout, suppression, provider
  state, preset/context/role ceiling and exact run origin into `RunService.queryModules`.
- [[D2252]]: official publication carries typed target learner, envelope, phase/form coverage,
  theory/evidence provenance, dependency availability and digest-bound human review metadata.

## Whole-capability boundary

The core is now explicitly a foundation rather than “complete Campaign.”
`planning/campaign/1.0-closure-map.md` keeps three successors in the 1.0 unit: Act-II full-game boss,
catalogue projection on the pack card, and consequential durable variety. The first two have
existing research/rulings; the third remains research plus owner-ruling work under [[D2251]].

## Executable evidence

`make campaign-two-horizon-author-contract` passes **34/34**: the 25 surviving prior checks and nine
new arms covering participation, create/start rollback, replay/concurrency, deletion degradation,
assistance delivery and official metadata. The historical second-review harness is retained as the
return artifact; its string probes are not treated as the positive author contract.

No production schema, migration, storage, route, runtime, client, CSS, official content, archive or
protected-design byte changed. Full `make verify` passes 1,085 software tests, 2 performance tests
and 172 real-content tests, with schema, build and governance gates green.
