# RFC: Preserve explicitly empty recorded human-selection telemetry

- **Status:** draft — D3870; routine resource rebase and independent acceptance remain open; no owner ordering decision needed
- **Author:** Codex
- **Created:** 2026-10-16
- **Design refs:** `design/03-product-breadth.md` evidence/Review surfaces; `design/05-in-run-experience.md` assistance and honest absence
- **Exploration gate:** the independently accepted current-source amendment (2026-10-15) requires the recorded successful-empty arm; D3870 reproduces its rejection at the actual canonical subject boundary. This is a bounded upstream contract repair, not a new detector or product direction.
- **Depends on:** `evidence-value-authority.md` §2.3a; `review-evidence-compiler.md` §4.5; negotiated run-schema and migration registers in `README.md`
- **Parent / amends:** `archive/branch-runtime.md`; `archive/opponent-contracts.md`; existing canonical run selection/storage contract
- **Supersedes / superseded by:** —
- **Planning:** existing `planning/codex-queue.md` until accepted/implementing

```tabiya-claims
none
```

No future schema version or migration number is assigned by this draft. Those resources must
be negotiated and claimed before acceptance; `none` does not authorize a migration-free change.
The existing run-schema claims remain untouched. This draft is not permission to widen a parser.

## Summary

Allow a genuinely recorded `human_common` selection to retain an explicit empty `candidates`
array. Preserve absence as absence, valid entries as reported data, and the actual selected move
as independently required. Coordinate the canonical schema, existing REST write parser and one
stamp-only storage migration. Do not maintain two active read/source pipelines, generate a fake
candidate, rewrite historical events or promote historical reports into current provider proof.

## Measured problem and scope

The canonical `$defs/opponentSelection.candidates` in `schemas/drill_run.schema.json` requires
at least one item for every policy. The accepted F2 source contract requires explicit empty data
to be successful recorded data, distinct from a missing array. The actual
`resolveRunSubject` boundary validates the canonical event image before issuing a subject;
`recorded-inspector-source.test.ts` and `recorded-human-divergence.test.ts` reproduce that refusal.
Ordinary `appendEvents`/`projectRun` alone is not canonical validation and cannot prove this arm.

`apps/server/src/rest.ts#parseOpponentSelection` separately refuses any supplied empty array
before reading its policy. Changing only JSON Schema would leave the real write journey broken.
`SQLiteRunStorage.read` and run-list/count/write queries filter the exact current schema version;
a version change without upgrading both stored stamps can hide existing runs. Existing stamp-only
upgrades in `apps/server/src/storage.ts` show the relevant storage mechanism. These are inspected
code facts, not an engine experiment or evidence that empty telemetry is currently produced.

Out of scope: candidate generation, bot calibration, provider exchange admission, a new opponent
API, move grading, model intent/quality inference, access/assistance changes, a new digest domain,
bulk pack edits and completing the Inspector or Review consumer migration.

## Specification

### 1. One canonical selection shape

Keep `moveUci`, `engine` and `policyModeApplied` required. Keep the existing closed policy
vocabulary, engine fields, candidate-entry validation, ordering-basis restrictions and policy
envelope checks. Keep `candidates` optional and an array when present.

- `policyModeApplied: "human_common"` permits zero or more candidate entries.
- Every other existing policy continues to require at least one entry when the optional array
  is supplied. Missing remains allowed exactly where it is allowed today.
- A present malformed entry, non-array/null, illegal selected move, invalid engine or invalid
  policy envelope is not repaired into an empty array or a missing field.

Implement the cardinality as a policy conditional on the existing shared selection definition;
do not create a shadow selection schema. That definition is also referenced by stored alternative
distributions, so permanent schema tests must exercise every reference site, not only the ordinary
`opponent.move_selected` event. The same explicit-human-empty meaning applies at those shared
sites; no caller receives proof that any candidate move was played or would be chosen.

Shared schema admission is not whole-event replay admission. Preserve `group.created`'s existing
requirement that its distribution covers every seeded member: an empty human distribution must
still refuse for a nonempty seeded group. At the prediction distribution site, valid empty
telemetry retains the existing zero-count/null-mass/null-rank semantics; it is not missing data.

The TypeScript optional array already represents these three states. Do not add a redundant
status field, new event kind, compatibility union or separate telemetry store.

### 2. Existing write path

In the existing `parseOpponentSelection`, parse and validate `policyModeApplied` before enforcing
the above cardinality rule. A valid explicit empty human-common array must survive the existing
opponent-selection write operation, actual runtime legality/application checks, persistence and
reload. Retain all existing authentication, ownership, writer, policy-envelope and move-legality
checks. The parser does not issue modern provider authority and must not permit client-supplied
bot policy envelopes merely because the policy is human_common.
The modern opponent-response parser's nonempty live response requirement is a distinct boundary
and remains unchanged; historical telemetry widening does not authorize an empty live move menu.

### 3. Source/availability consequences

At the genuine source boundary, preserve:

| Recorded input | Recorded-selection source | Historical human-divergence result |
|---|---|---|
| Array absent | `unavailable/source_absent` | Private absent observation; node adapter folds to `unavailable/input_abstained` |
| Explicit `[]` | Available exact recorded event, empty array intact | Completed nonmatch; absent any other missing observation, `honest_empty/no_observation` |
| Valid nonempty array | Available exact recorded event | Unchanged reported-window split predicate |
| Malformed/crossed event or source | Refuse before classification/folding | Never successful empty or no-observation |

The shared split arithmetic and thresholds do not change. Preserve every per-selection disposition,
including sibling-origin observations at a shared granted anchor. A node with present and absent
telemetry remains unavailable with no published items under Review §4.5; an explicit empty array
alone is not absent. Preserve original event sequence, full current head, actual origin branch,
requested grant, stored target context and exact recorded-position input. No contemporary Maia
request is initiated to fill a hole in history.

### 4. Persistence/version transition

Before acceptance, assign the run-schema lane and a contiguous storage migration position in the
existing registers. Update the exported schema version, schema identity and schema-build metadata
consistently. Do not jump over, consume or renumber another RFC's claim without an explicit
resource-order decision recorded in those RFCs/registers.

The migration from its negotiated immediate predecessor is stamp-only: atomically update
`drill_runs.schema_version` and the top-level `snapshot_json.schemaVersion`. Preserve all other
snapshot fields and every stored event value, including absent arrays, optional masses, selected
moves, provider/bot envelopes, packet attachments and original event ordering. Do not rewrite
event history, create missing candidate fields or call engines. Retain existing account/access,
writer, campaign/import links and durable evidence jobs. The new normal replay/read path is the
single current path; no second legacy source pipeline is introduced.

The versioned migration uses frozen predecessor/successor literals agreed at acceptance, not the
moving current-version constant as its historical selector. It runs in the existing migration
transaction, advances storage version once, and is safe on reopen. A malformed targeted stored
snapshot must fail visibly and roll back rather than be skipped into an unreadable old stamp.
Malformed includes invalid JSON/non-object data, a mismatched embedded predecessor version,
row/document ID disagreement, invalid events and snapshot disagreement with canonical replay.
Validate a candidate with only its in-memory top-level stamp advanced against current canonical
validation/replay, comparing every non-stamp field before any write. Do not copy older migrations'
silent `continue` behavior, reconstruct a different snapshot or discard an invalid field.
Unrelated run versions remain the responsibility of their registered migrations. No new tables,
pack schema, semantic convention or event digest are needed.

## Deviations from design

None intended. This repairs an implemented upstream cardinality constraint that contradicts
the accepted recorded-source absence contract. D3851 requires one correct current pipeline;
it does not authorize deleting real stored data, archive records or logs.

## Acceptance criteria

1. Resource-order decision, exact claims, affected predecessor/successor RFC metadata, register
   and frozen migration numbers agree before implementation. Independent review/owner acceptance
   is recorded; this draft cannot self-accept or borrow the parent amendment's acceptance.
2. Canonical schema positives distinguish human absent/empty/nonempty at every shared definition
   reference site. Negatives retain non-human supplied-empty refusal, malformed entry/engine,
   null/non-array, unsupported policy and illegal envelope restrictions. Tests exercise the
   canonical validator, not a local permissive substitute. Separately retain whole-event seeded
   group coverage refusals, empty prediction semantics and modern live-response empty refusal.
3. A genuine event with explicit human empty telemetry resolves to a sealed full-head subject,
   invokes the real recorded-selection factory and retains the exact empty array/event/context.
   The new human-divergence factory records `nonmatch`, with no manufactured marker/input.
   Existing permanent D3870 refusal controls are replaced by these real positive journeys, not
   deleted without successors. Missing-source and corrupt-source negatives remain.
4. An authenticated existing REST selection write with explicit empty human telemetry persists
   the real legal chosen move. Reload/export preserves the empty field, absent stays absent, and
   other-policy empties/invalid moves/unauthorized clients/forged envelopes still refuse.
5. A real SQLite predecessor fixture containing absent and nonempty telemetry, imports, a bot
   envelope, an evidence attachment and existing relations migrates atomically, remains visible
   to normal exact-version read/list/count/write operations, and preserves all non-stamp JSON.
   Reopen does not migrate twice; each targeted corruption listed in §4, including valid-JSON
   stamp/ID/event/replay mismatches, rolls back without partial stamps on any row.
   New explicit-empty data survives persistence and the existing export/restore journey.
6. Normal focused software gates, schema/storage/application contracts and `make verify build`
   pass without skips, broadened deadlines or disabled assertions. Actual consumer/API/native
   adoption remains separately tracked; source success alone closes neither D3841 nor a milestone.

## Discharges

none

## Open questions

1. **Run-schema/migration order, answered 2026-10-16:** owner: "idk who cares for the order?
   it's not that deep. we are pre launch, it's a chess site..." Routine scheduling/version-slot
   bookkeeping is delegated to engineering, not a further product ruling. Take this small
   correctness repair first, then shift the eight unlanded run-schema reservations one slot,
   preserving feature scope and relative order. The implementer owns the coordinated claimant/
   register/predecessor update before independent acceptance. The current `none` claim does not
   reserve those resources or authorize implementation until that mechanical rebase is applied.
   Do not re-escalate the order to the owner or treat this answer as independent RFC acceptance.

## Changelog

- 2026-10-16: drafted from the actual D3870 canonical-source refusal, independently confirmed
  REST/migration constraints and the accepted F2/Review availability semantics. No resource claim,
  schema/parser/storage implementation, independent acceptance or consumer completion is asserted.
- 2026-10-16: bounded read-only review adds shared-reference replay constraints, concrete targeted
  migration-corruption negatives and the separate modern live-response boundary. Resource ordering
  remains unresolved; the review grants no acceptance and ran no tests.
- 2026-10-16: owner delegates routine pre-launch ordering to engineering. Choose the immediate
  correctness-first rebase above; coordinated resource edits and independent acceptance remain,
  but there is no outstanding owner question about slot order or a new product-scope decision.
