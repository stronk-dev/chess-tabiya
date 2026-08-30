# Assistance preference, exchange and permission — shared-resource boundaries

**Date:** 2026-08-30

**Question:** Are `WorkflowPreferenceV2`, the staged assistance exchange and
`AssistancePermission` distinct shared resources, and can the current register model represent
them before implementation?

## Method

This is a repository-boundary audit. It reads the live storage functions, runtime exports, current
register parser and both active RFCs; it does not infer production from author fixtures. Claims are
labelled under `design/research/README.md`.

## Current authorities

| candidate | fact at HEAD | boundary verdict |
|---|---|---|
| `workflow-preference` | `[V]` `apps/web/src/lib/assistance-preference.ts:19-39` owns `tabiya.workflow.v1.${context}` plus a literal `{version:1,preset}` parser/writer. Its only callers are tests (`assistance-preference.test.ts:117-125`), so v1 is currently web-local and unused in production. | It becomes shared only when intent-presets embeds the persisted preference grammar in a runtime-exported web/server request. At that point storage and wire are independent readers and one version authority is required. |
| `assistance-exchange` | `[V]` No production `RequestedAssistanceV1`, authoritative/finalized result or parser exists. The names occur only in active RFC/planning/author artifacts. | A new shared resource, not a landed v1. Web and server must agree before the first implementation commit, so the first lane has to be reservable while the landed head is absent. |
| `assistance-permission` | `[V]` `packages/runtime/src/assistance.ts:21` exports the closed four-member union `free | locked_off | sight | evidence`; `packages/runtime/src/index.ts:85` exports it across the package boundary; `permittedAssistance` returns it for every config field. | Already a shared closed vocabulary. Intent-presets proposes `legal`; enforced clocks and other drafts also type clamps against it. It needs member-claim semantics like `evidence-kinds`, not a fabricated numeric version. |
| `assistance-config` | `[V]` `AssistanceConfig.version` is 4 with nine closed fields (`assistance.ts:3-15`); browser storage migrates v1/v2/v3 to v4 (`assistance-preference.ts:40-58`). | Remains the existing, distinct resource owned by `assistance-config-register`; none of the three candidates is another spelling for it. Preference records intent, exchange carries authority stages, permission expresses ceilings, and config is the effective nine-axis value. |

## Rule-7 evaluation

`rfc/archive/shared-resource-registers.md` §1 requires a resource to be versioned or a closed
vocabulary, independently movable by parallel documents, and exported across a package boundary or
schema. `[V]`

- `workflow-preference` satisfies all three at its proposed v2 landing: it has a version, storage
  and exchange can move it independently, and the runtime request crosses web/server.
- `assistance-exchange` satisfies all three at its first landing: it has four versioned stage
  grammars, client/server are independent readers, and it crosses the runtime/web/server boundary.
- `assistance-permission` satisfies all three today: a closed exported union is already consumed by
  runtime callers, while multiple active RFCs propose or consume members.

These are three resources, not one broad “assistance” register. A single head could not say whether
a change migrated durable local bytes, altered a network parser, or merely widened a permission
token; it would force unrelated readers to move together and still fail to identify which protocol
changed. `[V]` This follows from the distinct live/proposed reader sets above.

## The absent-head defect

`tools/register-check.mjs:7-15` lists seven current resources and its register model derives a
landed head for every registered resource. `parseClaimBlock` accepts schema lanes, migration
positions and evidence-vocabulary members; it has no grammar for a resource whose production
symbol is absent. `[V]`

That is safe for resources added after they land and unsafe for a brand-new cross-package wire:
the lane must be reserved before implementation, but the landed half truthfully has no head.
Writing `head=0` would violate the register's own rule that the landed half is derived from the
tree—it would turn absence into a fictional version. Waiting until v1 lands defeats the collision
guard during the only commit where two implementations can disagree. This is [[D2328]]. `[V]`

The required model is explicit:

```text
landed = absent | { head: positive integer, contractDigest: digest }
claim  = first lane 1 | next lane head+1 | members ...
```

For an absent resource, the checker derives `absent` by failing to find its registered version
symbol/contract root; exactly one active `first lane 1` claim is allowed. Landing must atomically
create the symbol/root, change the register to a derived head of 1, and remove the live claim. A
numeric zero is never printed or accepted. Negative fixtures require two first-lane claimants,
an absent resource with no owner but an implementation diff, a head-1 tree with a lingering first
claim, and a missing contract digest all to fail.

Closed vocabularies use member claims instead. `assistance-permission` starts with the literal four
members derived from the exported union, and intent-presets claims only `legal`. It does not receive
an invented head.

## Decision for the RFC queue

The research gate is open for a process amendment to `assistance-config-register` (or a narrowly
renamed successor) that registers four related but distinct resources:

1. existing `assistance-config`, numeric head 4;
2. `workflow-preference`, numeric head 1 with a claimed v2 lane;
3. `assistance-exchange`, landed absent with exactly one first-lane-1 claim; and
4. `assistance-permission`, closed members with a claimed `legal` addition.

The process amendment must land before intent-presets can replace its `none` block with claims.
This ordering is not ceremony: without it, the checker cannot distinguish a reserved first wire
from an implementation that appeared without an owner. `[V]`

No production preference, exchange, permission, schema, content or archive change is authorised by
this dossier.
