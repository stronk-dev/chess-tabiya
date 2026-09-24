# RFC: Assistance shared-resource catalogue population

- **Status:** implementing 2026-09-24 (process landing complete; D4/D5 are later product claims)
  at the owner's direction to implement ready RFCs without further review rounds (D2 not run).
  Rebased for [[D2454]] onto the implemented collision-core bootstrap: `assistance-config` (adopted
  at v4) and `workflow-preference` (adopted at v1, with the v2 that `intent-presets.md` already
  landed) are two `members` rows read by the existing `string_tuple` reader over present literal
  version tuples, with checked README registers. Previously: generic descriptor/selector repair
  complete 2026-09-01 under [[D2498]]/[[D2499]]
- **Author:** Codex
- **Created:** 2026-08-26
- **Design refs:** none. This is repository process over already-ruled assistance behavior; it
  chooses no preset, permission, disclosure or UX behavior.
- **Exploration gate:** passed by `design/research/assistance-config-shared-resource.md`,
  `design/research/assistance-shared-resource-boundaries.md`, [[D1581]], [[D2328]] and the sixth
  fresh review
- **Depends on:** implemented `rfc/shared-resource-register-bootstrap.md` (catalogue + checker)
- **Parent / amends:** adds two data rows to the generic catalogue; does not amend its parser or
  readers
- **Supersedes / superseded by:** supersedes every C9/`RESOURCE_NAMES` proposal in earlier revisions
- **Planning:** `planning/assistance-config-register/`

```tabiya-claims
none
```

```tabiya-resource-descriptor-source
rfc/shared-resource-registers.json#assistance-config
rfc/shared-resource-registers.json#workflow-preference
```

```tabiya-resource-roots
assistance-config | members/string_tuple@present | packages/runtime/src/assistance.ts#export:ASSISTANCE_CONFIG_VERSIONS | none
workflow-preference | members/string_tuple@present | packages/runtime/src/presets.ts#export:WORKFLOW_PREFERENCE_VERSIONS | none
```

## Summary

Two assistance authorities are shared resources: the persisted `AssistanceConfig` version, and the
persisted workflow-preference version. Both can be changed by more than one product RFC (hint
distance claims config v5; intent presets changed the workflow value), so both need collision
prevention. The implemented bootstrap offers three readers; the smallest honest shape is one literal
version tuple per resource, read by the existing `string_tuple` reader. A product RFC that needs the
next version claims the next member, so two claimants of `assistance_config_v5` collide through the
generic C3 check.

This RFC adds only catalogue data, two literal tuples beside the authorities they name, README
registers and a binding test. It adds no reader, parser branch, Git reader, canonicalizer or
resource-name literal to `tools/register-check.mjs`, and it changes no assistance behavior.

## Active contract and acceptance criteria

1. `rfc/shared-resource-registers.json` gains exactly two `members` rows:
   `assistance-config` → `packages/runtime/src/assistance.ts#ASSISTANCE_CONFIG_VERSIONS` and
   `workflow-preference` → `packages/runtime/src/presets.ts#WORKFLOW_PREFERENCE_VERSIONS`, both
   `string_tuple`. The historical `planning/assistance-config-register/catalogue-additions.v1.json`
   descriptor is retained as evidence only. Its `typescript_contract@1`, `literal_string_union@1`,
   `canonical_resource@1`, `adopted`/`absent` and `whole projection` vocabulary does not exist in the
   implemented bootstrap (its §5 removes it).
2. **Honest adoption.** `assistance-config` records exactly `assistance_config_v4`. Coverage begins
   at the live head, and v1–v3 are migration inputs, not invented landed rows. `workflow-preference`
   records `workflow_preference_v1`, the adopted baseline the web loader still migrates from
   `tabiya.workflow.v1.*`. It also records `workflow_preference_v2`, the sealed value
   `intent-presets.md` landed before this adoption. Each README register says where its coverage
   begins.
3. **Binding.** `packages/runtime/src/assistance-register.test.ts` proves that each tuple is a
   contiguous `<prefix>_v<n>` lineage. It checks that the last config member equals
   `AssistanceConfig.version` and that the last workflow member equals the sealed
   `WorkflowPreferenceV2.version`, whose `assistanceHead` equals the config head. v1 stays landed only
   while the loader still reads it. A version bump without its member, or a member without the bump,
   fails.
4. **Collision.** A next-version claim is a `members` claim (`assistance-config | members
   assistance_config_v5 | …`). Two claimants of one next version collide. A lane or
   whole-projection claim is refused by the generic grammar (`tools/register-check.test.mjs`).
5. Generic C4/C6 prove every tree member has a Landed row and the head count equals the tuple length.
6. No assistance, preset, preference, web, schema, storage or content behavior changes. The only
   product bytes are the two literal tuples and their doc comments.
7. `make register-check`, `make shared-resource-catalogue` and the runtime software suite prove the
   rows, registers, binding and collision.

### Deferred from the earlier five-resource cut (not registered here)

- **`assistance-permission` vocabulary.** The draft adopted a four-member union. The live
  `AssistancePermission` union has five members (`free`, `locked_off`, `legal`, `sight`,
  `evidence`) and there is no literal tuple to read, so the draft's claim is stale. The first
  product RFC that adds a permission member creates the literal tuple and its catalogue row in that
  landing, as `provider-protocol` did. This RFC adds no second vocabulary copy now ([[D2467]]).
- **`assistance-permission-contract` and `assistance-exchange`.** Both were absent atomic
  `canonical_resource@1` contracts. That reader does not exist, and absent-source admission remains
  [[D3082]]. Their product RFCs (D4) create the present source first, as `provider-protocol` did,
  and add one row through a retained reader or justify a new one on a measured collision.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Generic register engine is accepted/implemented first | shared-resource-register-bootstrap | archived implementing SHA | **2026-09-24** — the catalogue and catalogue-driven checker are implemented; the bootstrap archives in the same series once its three D3 rebases land |
| D2 | Fresh independent review of the population | claude | review receipt plus acceptance/corrections | **2026-09-24 — not run**: the owner directed implementation of ready RFCs without review rounds; criteria 2–5 execute in `assistance-register.test.ts` and `tools/register-check.test.mjs` |
| D3 | Descriptors/registers land without assistance behavior change and verification passes | claude | implementing SHA plus green verification | **2026-09-24** — landing commit on branch `worktree-agent-ad09667cb734eccf8` |
| D4 | Intent presets later claims and lands workflow, permission-contract and exchange lanes | intent-presets.md | register transitions and product receipts | |
| D5 | Hint distance later claims and lands the config-v5 member | hint-distance.md | register transition and product receipt | |

## Open questions

None for the owner. Preset defaults, module composition, disclosure and learner UX remain product
intent/RFC concerns. This document governs shared authority identity and change only.

## Changelog

- 2026-09-24: implemented the process landing (claude) and rebased for [[D2454]], with two
  genuine-defect corrections inline. (1) The draft assumed a generic TypeScript-graph projection
  engine, `literal_string_union@1` and `canonical_resource@1` adapters, `adopted`/`absent`
  lifecycles and staged/first-parent transition readers. None of them exists in the implemented
  `shared-resource-register-bootstrap`, whose §5 removes them. The registration therefore became
  two member tuples over the existing `string_tuple` reader, and the semantic-delta guarantees of
  the draft's TypeScript projections ([[D2450]]–[[D2453]]) are deferred with the removed engine
  rather than faked. (2) The draft adopted workflow v1 as the head, but `intent-presets.md` has
  since landed v2. Both are recorded, and v2 is the head. The draft's four-member permission
  vocabulary is also stale (five live members). Permission vocabulary, permission-contract and
  exchange are deferred to their product landings.
- 2026-09-01: added the complete canonical descriptor candidate; corrected config/workflow version
  selectors to the generic slash grammar and the real persisted workflow object. Generic-engine
  acceptance/implementation and fresh review still gate this process population.
- 2026-09-01: author-repaired the sixth return. Rebased onto the generic engine, replaced C9 with
  five catalogue entries, added honest adoption, split permission vocabulary from operations, made
  exchange atomic and made semantic deltas projection-derived. Fresh review is required;
  implementation remains unauthorized.
- 2026-08-31: sixth fresh review returned the fifth repair on [[D2450]]–[[D2454]].
- 2026-08-31: fifth repair corrected workflow-v1, named exchange absence and one-way history.
- 2026-08-30 and earlier: successive reviews/repairs established the live config/persistence scope
  and fixture population; receipts remain in `planning/assistance-config-register/`.
