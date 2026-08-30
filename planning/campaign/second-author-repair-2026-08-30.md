# Campaign core — second author repair receipt

Date: 2026-08-30
Scope: author repair only; no production, schema, migration, official content, archive, or protected
design bytes changed.

## Result

The ten blockers [[D2077]]–[[D2086]] are repaired in `rfc/campaign-core.md` as one campaign
operation boundary:

- `node_committed` atomically owns the seal, act and reward income, unlock, auto-equip, terminal
  projection and durable awards. Completion is derived from the exact nine-layer cursor.
- exact campaign document bytes and digest are durable and restore does not depend on the current
  catalogue;
- module loadout is an event-owned equip/unequip command, while theory and resource rewards use
  their own projections;
- pack capability and theory applicability are named, sealed predecessor authorities rather than
  campaign-local substitutes;
- `RunSession.origin` claims run-schema lane 0.25 and survives Review, export and restore;
- eleven authenticated API operations share revision, idempotency, ownership and closed errors;
- the terminal transition is the only award issuer; and
- the disposable contract fixture is physically separate from the official owner/human-authored
  1.0 campaign obligation.

## Executable evidence

- `make campaign-two-horizon-author-contract`: **25/25 pass**.
- `make campaign-two-horizon-fresh-review`: **0/10 pass**, the intended inversion of the unchanged
  historical blocker assertions.
- The executable model derives terminality after exactly nine selected layers. Supplying a caller
  terminal flag is unnecessary; an early or late marker fails `CAMPAIGN_TERMINAL_CURSOR_MISMATCH`.
- Fault injection at event/fold/award boundaries leaves neither the terminal event nor awards.
- The contract fixture lives at
  `tools/campaign-two-horizon-author-contract/fixtures/campaign-contract.json` and is never an
  official content artefact.

## Remaining gate

Fresh independent buildability review is still required. Acceptance and implementation remain
unauthorized. The official campaign itself remains a human/owner chess-content obligation under
law 8 and is not disguised as a mechanical implementation task.
