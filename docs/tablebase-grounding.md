# Tablebase grounding and perfect resistance

Tabiya has two Syzygy paths over the same seven-piece boundary. The authoring path verifies an existing drill pack and emits durable evidence artifacts. The runtime path selects a deterministic tablebase move and records that exact policy as applied. Neither path silently substitutes an engine result for a tablebase fact.

## Verifying an authored draft

Run:

```sh
make verify-draft FILE=content/drafts/<pack>.json
```

The command first applies the living pack schema and semantic lints and requires `objective.grading.assessedBy.kind: "syzygy"`. It then walks the root, every spine node, and every authored deviation with chessops. Positions are queried at seven pieces or fewer; an out-of-range free-FEN deviation anchor becomes an explicit abstention.

The command writes flat sibling artifacts:

- `<stem>.evidence.json`
- `<stem>.sources.json`
- `<stem>.job.json`

Evidence is limited to legality and tablebase-result facts. It never grounds prose or a deviation class. A queried root must exactly match the declared category and piece count; the tool updates only the root declaration's `sourceId` and `retrievedAt`. A learner spine move that worsens the learner-perspective tablebase category is refused, while a category-changing opponent reply is retained with a warning.

The emitted ledger and manifest pass the existing validators and linkage rules and must earn `ledger_verified` through the same `assessmentGrounding` function used by the pack registry. `OFFLINE=1` uses committed per-FEN fixtures, so all six verified endgame drafts exercise the closed loop in CI without network access.

## Perfect tablebase resistance

`perfect_tablebase` is an executable pack-run opponent mode. It is published only when a tablebase provider is configured and is recorded on every selection as `policyModeApplied: "perfect_tablebase"` with the synthetic identity `lichess-tablebase` / `Syzygy (tablebase.lichess.org/standard)` / `7man`.

The interactive provider uses `tablebase.lichess.org/standard` with percent-encoded FENs, one request at a time, identical-request coalescing, a bounded queue, a 512-entry positive LRU, and a 60-second negative cache after upstream failures. Positive facts have no TTL because tablebase results are immutable.

The API reports each move's category for the resulting position's side to move, so selection inverts that category back to the current mover's perspective. It keeps only legal, category-preserving moves, orders winning positions by shortest absolute DTZ and losing positions by longest, and resolves every tie by lexicographically least UCI. Drawn positions use the same UCI tiebreak. The result is a pure function of the position and therefore composes with the fixed-resistance branch reply journal.

Named refusals are part of the contract:

- pack validation rejects a `perfect_tablebase` root above seven pieces;
- deployments without a provider omit the mode from capabilities;
- upstream outage or timeout returns `TABLEBASE_UNAVAILABLE` without committing a substitute move; and
- an over-range runtime position returns `TABLEBASE_OUT_OF_RANGE`.

Pack-free position sessions remain limited to `human_common` and `strong_engine`. Run schema v0.13 and storage migration 18 add the new persisted policy value without rewriting historical events.
