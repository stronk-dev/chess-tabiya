# RFC: Assistance shared-resource catalogue population

- **Status:** draft — author-repaired 2026-09-01 on [[D2450]]–[[D2454]] and [[D2465]]–[[D2467]].
  The document now depends on the generic register engine, adopts three truthful current
  authorities, introduces two atomic future contracts and adds no bespoke checker. Fresh
  independent review is required; implementation is unauthorized.
- **Author:** Codex
- **Created:** 2026-08-26
- **Design refs:** none. This is repository process over already-ruled assistance behavior; it
  chooses no preset, permission, disclosure or UX behavior.
- **Exploration gate:** passed by `design/research/assistance-config-shared-resource.md`,
  `design/research/assistance-shared-resource-boundaries.md`, [[D1581]], [[D2328]] and the sixth
  fresh review
- **Depends on:** accepted and implemented `rfc/shared-resource-register-bootstrap.md`
- **Parent / amends:** adds resource descriptors/registers through the generic engine; does not
  amend its parser, transition reader or canonical-byte authority
- **Supersedes / superseded by:** supersedes every C9/`RESOURCE_NAMES` proposal in earlier revisions
- **Planning:** `planning/assistance-config-register/`

```tabiya-claims
none
```

```tabiya-resource-roots
assistance-config | sequential/typescript_contract@1/adopted | packages/runtime/src/assistance.ts#interface:AssistanceConfig | packages/runtime/src/assistance.ts#interface:AssistanceConfig.member:version.literal
workflow-preference | sequential/typescript_contract@1/adopted | apps/web/src/lib/assistance-preference.ts#function:loadWorkflowPreset | apps/web/src/lib/assistance-preference.ts#function:loadWorkflowPreset/object:version.literal
assistance-permission | member_set/literal_string_union@1/adopted | packages/runtime/src/assistance.ts#type:AssistancePermission | none
assistance-permission-contract | sequential/canonical_resource@1/absent | packages/runtime/src/assistance.ts#export:ASSISTANCE_PERMISSION_CONTRACT_RESOURCE | packages/runtime/src/assistance.ts#export:ASSISTANCE_PERMISSION_CONTRACT_RESOURCE.version
assistance-exchange | sequential/canonical_resource@1/absent | packages/runtime/src/assistance-exchange.ts#export:ASSISTANCE_EXCHANGE_RESOURCE | packages/runtime/src/assistance-exchange.ts#export:ASSISTANCE_EXCHANGE_RESOURCE.version
```

## Summary

This process RFC adds five assistance resources to the generic shared-resource catalogue. It
changes no assistance product bytes:

- `assistance-config` adopts the complete live version-4 config/persistence graph;
- `workflow-preference` adopts the complete live version-1 preference/policy graph;
- `assistance-permission` adopts the current four-member type-union vocabulary;
- `assistance-permission-contract` is a genuinely absent sequential contract for the operations
  that compose effective permission; and
- `assistance-exchange` is a genuinely absent atomic wire/compiler contract.

Vocabulary membership and operation semantics have different lifecycles. A member-only register
cannot represent a same-membership change to `permittedAssistance`, context clamping or pointwise
composition ([[D2453]]).

All projection, claim, collision, digest, staged and first-parent behavior comes from
`shared-resource-register-bootstrap`. This RFC adds descriptor data and README rows only. It does
not add C9, a resource-name branch, a Git reader or a second canonicalization implementation.

## 1. Exact catalogue descriptors

The implementation appends five descriptors to `rfc/shared-resource-catalogue.json`. The generic
schema is authoritative; these sections publish their complete semantic configuration.

### 1.1 Assistance config — adopted sequential TypeScript contract

The profile is `sequential/typescript_contract@1/adopted`, `claimMode: whole_projection`, with
current head derived as literal 4 from `AssistanceConfig.version`. Root selectors are exactly:

```text
packages/runtime/src/assistance.ts#interface:AssistanceConfig
packages/runtime/src/assistance.ts#export:SILENT_ASSISTANCE
apps/web/src/lib/assistance-preference.ts#export:PROFILE_DEFAULTS
apps/web/src/lib/assistance-preference.ts#function:assistanceKey
apps/web/src/lib/assistance-preference.ts#function:validV4
apps/web/src/lib/assistance-preference.ts#function:migrate
apps/web/src/lib/assistance-preference.ts#function:loadAssistance
apps/web/src/lib/assistance-preference.ts#function:saveAssistance
```

The generic TypeScript projection closes transitive types, constants, calls and property edges.
All nine fields/domains, defaults, storage key, JSON parse/stringify, unknown/invalid fallback,
v1–v3 migrations and current load/save behavior enter the adopted semantic digest. The transition
writes one `adopted@4` baseline and changes none of those product selectors. It does not invent
v1–v3 semantic history.

### 1.2 Workflow preference — adopted sequential TypeScript contract

The profile is `sequential/typescript_contract@1/adopted`, `claimMode: whole_projection`, with
current head 1 derived from the accepted persisted object grammar. Roots are:

```text
packages/runtime/src/presets.ts#export:PRESET_IDS
packages/runtime/src/presets.ts#type:PresetId
packages/runtime/src/presets.ts#export:WORKFLOW_CONTEXTS
packages/runtime/src/presets.ts#type:WorkflowContextId
packages/runtime/src/presets.ts#interface:WorkflowContextPolicy
packages/runtime/src/presets.ts#export:WORKFLOW_CONTEXT_POLICIES
packages/runtime/src/presets.ts#function:workflowContextPolicy
apps/web/src/lib/assistance-preference.ts#function:workflowKey
apps/web/src/lib/assistance-preference.ts#function:loadWorkflowPreset
apps/web/src/lib/assistance-preference.ts#function:saveWorkflowPreset
```

This includes context-dependent allowed/default presets, open unknown-key handling, invalid-input
fallback, storage key and exact `{ version: 1, preset }` grammar. A future strict v2 is one
`lane 2 | whole projection`. Its before/after graph derives every moved authority—including policy,
lookup, receipt/override types, field/module registries and persistence functions. The former
hand-picked eight-symbol list is not authority ([[D2450]]).

### 1.3 Assistance permission vocabulary — adopted member set

The profile is `member_set/literal_string_union@1/adopted` over
`packages/runtime/src/assistance.ts#type:AssistancePermission`. It records exactly `evidence`,
`free`, `locked_off` and `sight`. Adoption reads the live union directly and adds no tuple or second
vocabulary ([[D2467]]). Future literal additions use member claims; removal is forbidden.

This resource says only which values exist. It makes no operation-semantics claim.

### 1.4 Assistance permission contract — absent sequential atomic resource

The future root is
`packages/runtime/src/assistance.ts#export:ASSISTANCE_PERMISSION_CONTRACT_RESOURCE` and uses
`canonical_resource@1`. Its eventual payload declares the vocabulary ref/digest, complete
`AssistanceContext`, config-clamp fields/order, pointwise-min identity and ordered operands,
`permittedAssistance`/access/context operations, effective field set and authoritative compiler
projections.

This process creates no root bytes. After archive, a product RFC may claim:

```text
assistance-permission-contract | first lane 1 | whole projection
```

Changing `ConfigClamp`, minimum operand order, one permission arm or compiler projection changes
the payload/digest and requires a lane even when vocabulary membership is unchanged
([[D2451]], [[D2453]]).

### 1.5 Assistance exchange — absent sequential atomic resource

The future root is
`packages/runtime/src/assistance-exchange.ts#export:ASSISTANCE_EXCHANGE_RESOURCE` and uses
`canonical_resource@1`. Its eventual payload contains complete request/response variants, config
and permission refs, preset/context refs, module/seat mapping, absence/error states, codec ids and
client/server compiler projections.

Version, payload and digest are one export. A version-only, declarations-only or codec-only
artifact is partial, not absent. Once landed, a missing/renamed root is a regression. The first
lane is the complete payload derived at landing, not the former ten-symbol substitute ([[D2452]]).

## 2. Register images and transition delegation

The process implementation adds generated register sections with exactly:

```text
assistance-config: adopted@4, zero claims
workflow-preference: adopted@1, zero claims
assistance-permission: adopted evidence/free/locked_off/sight, zero claims
assistance-permission-contract: head=absent, zero claims
assistance-exchange: head=absent, zero claims
```

Adoption rows say `coverage begins here` and do not manufacture earlier lanes. Absent sections are
header-only. No product claim appears until this process RFC is archived and a product document is
separately amended/reviewed.

`assertSharedResourceTransition` is the sole time authority. It proves complete/unchanged adoption,
exact selector absence, catalogue/register/ledger/log atomicity, future prior-claim consumption,
fixed-head drift refusal and one-way history. This RFC owns no `HEAD^` code, CI checkout setting or
merge policy.

## 3. Able-to-fail population fixtures

Using the generic engine, the implementation crosses:

1. exact three-resource adoption plus two absent introductions;
2. config adoption changing a default, migration, key, parser or save operation;
3. config adoption with invented v1–v3 rows;
4. workflow adoption omitting policy lookup or context admission;
5. workflow v2 changing transitive authorities while a hand-picked root list stays unchanged;
6. permission union omission/extra/duplicate/computed/broad member;
7. attempted tuple rewrite during union adoption;
8. unchanged permission vocabulary plus changed operation-contract payload;
9. pointwise-min operand swap and omitted ConfigClamp;
10. exact absent permission-contract/exchange roots;
11. version-only, payload-only, digest-only and codec-only partial artifacts;
12. first-lane complete atomic landing and fixed-head nested wire drift;
13. product claim added in the same commit as process introduction;
14. adoption replay or landed-to-absent regression; and
15. a second adopted TypeScript contract plus second atomic absent resource, proving no
    assistance-id branch.

## 4. Implementation boundary and order

The accepted implementation changes only the shared catalogue, generated README registers,
descriptor/population fixtures, development docs and this RFC's ledger/log/roadmap closeout. It
calls the generic engine unchanged.

It does not change `packages/runtime/src/assistance.ts`, `packages/runtime/src/presets.ts`,
`apps/web/src/lib/assistance-preference.ts`, any product claim, runtime behavior, API, schema,
storage, web UX, content, archive or protected design.

Order:

1. generic register engine is accepted, implemented and archived;
2. fresh independent review executes these fifteen population fixtures;
3. implement the five catalogue/register entries without product bytes;
4. run normal `make register-check`, governance and full `make verify`;
5. archive with ledger and append-only exploration-log closeout; and
6. only then may product RFCs claim config v5, workflow v2, permission-contract v1 or exchange v1.

## Historical finding routing

Earlier return rows remain live inputs to this population rather than disappearing with C9:

- [[D1918]] and [[D1920]] retain exact resource coverage and single-authority parsing;
- [[D2037]]/[[D2038]] retain fail-closed committed history and generated source-authority closure;
- [[D2113]], [[D2114]], [[D2115]], [[D2116]] and [[D2117]] retain truthful v4/v5 phase identity, sole reader/writer/key/serializer
  authority, fixed-head drift refusal, complete transition reach and defined TS/Svelte graph
  semantics;
- [[D2190]], [[D2191]], [[D2192]] and [[D2193]] retain consumer reach, transition ownership, able-to-fail product use and
  honest absence;
- [[D2328]] retains first-lane absence without fictional head zero; and
- [[D2355]], [[D2356]], [[D2357]], [[D2358]], [[D2359]] and [[D2360]] retain truthful workflow-v1 semantics, exact adjacent roots, one-way absence,
  permission scope and executable transition behavior.

Those obligations are now discharged through complete generic projections, adoption and atomic
resources. None is closed merely because the bespoke checker was removed.

## Acceptance criteria

1. Five exact descriptors/registers land through the generic engine; no C9, `RESOURCE_NAMES`,
   checker branch, canonicalizer or Git reader is added.
2. Config v4 and workflow v1 are adopted from complete live projections with identical product
   bytes and one honest baseline each.
3. Permission vocabulary adoption reads the live type union and records exactly four members.
4. Permission operations are a distinct sequential atomic contract, giving same-membership changes
   a lawful lane.
5. Exchange has one atomic image whose complete payload detects nested wire/compiler drift.
6. Workflow changes derive from the complete graph; omitted policy/receipt/registry authorities
   cannot stay outside the delta.
7. Exact absence refuses every partial selector population and landed-to-absent transition.
8. All fifteen population fixtures can fail for their named reason.
9. Existing assistance/preset/preference product tests remain byte-identical and green.
10. Normal `make verify` covers snapshot and staged/committed transition checks without bespoke
    user environment commands.
11. [[D2450]]–[[D2454]] and [[D2465]]–[[D2467]] close only after executable criteria pass.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Generic register engine is accepted/implemented first | shared-resource-register-bootstrap | archived implementing SHA | |
| D2 | Fresh independent review executes all fifteen fixtures | claude | review receipt plus acceptance/corrections | |
| D3 | Five descriptors/registers land without product bytes and full verification passes | codex | implementing SHA plus green `make verify` | |
| D4 | Intent presets later claims and lands workflow, permission-contract and exchange lanes | intent-presets.md | register transitions and product receipts | |
| D5 | Hint distance later claims and lands the config-v5 lane | hint-distance.md | register transition and product receipt | |

## Open questions

None for the owner. Preset defaults, module composition, disclosure and learner UX remain product
intent/RFC concerns. This document governs shared authority identity and change only.

## Changelog

- 2026-09-01: author-repaired the sixth return. Rebased onto the generic engine, replaced C9 with
  five catalogue entries, added honest adoption, split permission vocabulary from operations, made
  exchange atomic and made semantic deltas projection-derived. Fresh review is required;
  implementation remains unauthorized.
- 2026-08-31: sixth fresh review returned the fifth repair on [[D2450]]–[[D2454]].
- 2026-08-31: fifth repair corrected workflow-v1, named exchange absence and one-way history.
- 2026-08-30 and earlier: successive reviews/repairs established the live config/persistence scope
  and fixture population; receipts remain in `planning/assistance-config-register/`.
