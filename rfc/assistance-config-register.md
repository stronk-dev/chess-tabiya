# RFC: AssistanceConfig shared-resource register

- **Status:** draft — research-complete 2026-08-26; pre-review alias correction [[D1627]] applied;
  ready for independent process/buildability review
- **Author:** codex
- **Created:** 2026-08-26
- **Design refs:** none. This is repository process over an already-ruled assistance contract; it
  chooses no preset, permission, disclosure or UX behavior.
- **Exploration gate:** passed by `design/research/assistance-config-shared-resource.md` and
  [[D1581]]. The live type, four historical heads, browser persistence/migration boundary,
  current claimant and exact checker delta are all verified at HEAD.
- **Depends on:** implemented `rfc/archive/shared-resource-registers.md`; RFC-0000 rule 7
- **Parent / amends:** follows up immutable `rfc/archive/shared-resource-registers.md`; amends
  `rfc/README.md` with its register and `tools/register-check.mjs` with the derived reader/check.
  RFC-0000 rule 7 is already generic and is not edited ([[D1628]])
- **Supersedes / superseded by:** —
- **Planning:** `planning/assistance-config-register/`

```tabiya-claims
none
```

## Summary

Register `AssistanceConfig` as the shared persisted contract it already is. The tree half is the
numeric version plus a normalized digest of its closed field domains. The future half is one live
head+1 claim. Guided Hint owns v5; `intent-presets` depends on and exhaustively projects that shape
without claiming it independently.

This RFC changes no assistance value and authorizes no v5 runtime implementation. It makes the
existing v5 intent visible to the same collision/drift machinery that already guards schemas,
migrations and `EVIDENCE_KINDS`.

## Motivation

RFC-0000 rule 7 registers a resource when it is versioned or closed, can be moved incompatibly by
parallel drafts, and crosses a package/schema boundary. `AssistanceConfig` satisfies all three:
runtime exports literal head 4 and nine closed axes; web persists the complete object and migrates
v1-v3; Guided Hint proposes head 5 while presets must add the same field to two exhaustive tables.
The evidence and symbol census are in `design/research/assistance-config-shared-resource.md`.

The defect is active, not hypothetical. Both current RFC claim blocks say `none`, and
`register-check`'s `RESOURCE_NAMES` cannot express `assistance-config`. A second draft could reserve
a different v5 meaning and every governance gate would stay green.

The declaration census does not close this. It records 32 assistance property/string subjects but
omits numeric `version=4`; its token-level producer counts deliberately answer reach, not persisted
shape identity. Importing its output would make the register appear more complete while leaving the
version invisible.

The scope is deliberately process-only: register identity, claims, drift and fixtures. Preset
defaults, permission algebra, v5 migration bytes, UI and hint semantics stay in their product RFCs.

## Specification

### 1. Canonical resource and claim grammar

`tools/register-check.mjs` adds the literal canonical resource `assistance-config` to
`RESOURCE_NAMES`. RFC-0000 rule 7 already defines the predicate and gains no hand-maintained
resource example; the executable resource↔README bijection remains the inventory ([[D1628]]). The
claim grammar adds exactly:

```text
assistance-config | lane <positive integer> | <non-empty changed symbols>
```

Unlike schema lanes, this resource is a **single-writer sequential payload**:

- at most one active RFC may claim it;
- its claim must be exactly `tree head + 1`;
- a bare member claim, same-head claim or skipped head is refused;
- generic C3 declaration↔README set equality still applies.

The stronger rule is required because one browser migrator parses the complete object. A v6
author cannot correctly implement v5→v6 against an unlanded v5 shape, and two v5 authors cannot
both own the same discriminator.

This process RFC itself claims `none`: it changes the register system, not `AssistanceConfig`.
On this RFC's implementation, `hint-distance.md` changes its block atomically to:

```text
assistance-config | lane 5 | AssistanceConfig.version; AssistanceConfig.hintDistance; validV5/migrate v1-v4 to v5
```

`intent-presets.md` retains `none`, names `hint-distance` as the v5 owner/dependency, and updates
its stale “returned to research” prose to “awaiting independent review.” Its product implementation
still adds the exhaustive preset/clamp columns in the v5 landing; dependency is not a second claim.

### 2. Tree derivation is semantic and formatting-insensitive

The register reader builds a workspace TypeScript `Program` with the pinned compiler and resolves
`packages/runtime/src/assistance.ts` through its `TypeChecker`. It locates exactly one exported
`AssistanceConfig` interface and derives:

```ts
interface AssistanceConfigTree {
  readonly head: number;
  readonly fields: Readonly<Record<string, readonly string[]>>;
  readonly digest: string;
}
```

The parser requires:

1. one required readonly property named `version` whose type is one positive integer literal;
2. every other property required and readonly;
3. every other property's **resolved semantic type** a non-empty union containing only unique
   string-literal members;
4. no index signature, method, call/construct signature, inheritance or duplicate property.

Anything else fails with the unsupported node/property named. It is not silently omitted.

Resolution is semantic rather than syntax-only because the already-specified v5 field is
`"off" | HintRung`, where `HintRung = (typeof HINT_RUNGS)[number]`. The checker must resolve local
and imported aliases, `as const` readonly-tuple indexed access and nested unions to the literal
domain. It then refuses `string`, `unknown`, `any`, `never`, numeric/object members, generics whose
instantiation is not a closed literal set, or a union retaining any non-string-literal residue.
The normalized digest contains the resolved values, not alias names or source spelling: replacing
an inline union with an equivalent alias is formatting-equivalent; changing the tuple behind that
alias is semantic drift.

For the digest, field names and each member domain are sorted, encoded as canonical JSON together
with `head`, hashed with SHA-256 and truncated to the existing register convention's 12 lowercase
hex characters. Comments, whitespace and source ordering therefore do not move the digest;
adding/removing/renaming a field, changing a literal or changing the numeric head does.

The current derived shape is ten properties total: `version: 4` plus nine axes containing 22
string values. These integers are drift tripwires, not a second declaration; the AST projection is
the authority.

### 3. README register

`rfc/README.md` gains:

```text
## Assistance-config register

<!-- register: assistance-config head=4 -->
<!-- contract-digest: assistance-config <derived-12-hex> -->
```

Its **Landed** table has unit `payload head`, total four, recovered from git history:

| head | owner/landing | change |
|---|---|---|
| 1 | adaptive guidance runtime, `e78e7238` | markers, guided, humanSplit, voice |
| 2 | runtime corpus evidence, `f90d0771` | corpus |
| 3 | adoption wave one, `9e99a541` | spoken off/on |
| 4 | polish surfaces, `765efb56` | spoken domain replacement; boardLighting, arrows, ambient |

Historical commit descriptions are facts, not retroactive RFC ownership. The table says so rather
than attributing a version to an archived RFC that did not govern it.

Its **Live claims** table contains the exact Guided Hint lane-5 declaration and no preset claim.
No hand-written “next free” row exists; `register-check` prints it.

`parseRegisterSections` accepts `contract-digest` only for this resource and retains
`schema-digest` for schema resources. A digest of the wrong kind/resource is treated as absent.

### 4. C9 — assistance contract identity

The existing C1-C8 meanings stay byte-for-byte. New check C9 has five arms:

| arm | failure |
|---|---|
| C9.1 | no/multiple AssistanceConfig interface, or unsupported/ambiguous member shape |
| C9.2 | README head differs from the AST-derived numeric version |
| C9.3 | README contract digest is absent or differs while no live claim exists |
| C9.4 | zero-or-more-than-one live claim when code is mid-change, or the sole claim is not head+1 |
| C9.5 | the landed table lacks the current head or a live declaration/register row differs |

“Code is mid-change” means the derived digest differs from the register digest. A live claim may
temporarily explain that difference just as C8 permits claimed schema drift; it never permits a
wrong head line, two claimants or a non-sequential claim. Before a product landing finishes, the
register digest/head and landed table move to the new tree, the live claim row disappears, and the
still-active RFC's block returns to `none` if owner-use validation keeps it unarchived.

C3 remains the authority for declaration/register bijection. C4/C6 are generalized only enough to
include the new numeric-head register; their schema/evidence/migration semantics do not change.
The command's terminal success line becomes `C1-C9 green`.

`derivedOutput` gains an explicit branch rather than falling through its current assumption that
every non-schema/non-migration resource is `evidence-kinds` ([[D1630]]). At the registered
checkpoint it prints:

```text
assistance-config: head 4; next hint-distance.md (lane 5)
```

With no live claimant it prints `next lane 5`; it never reads `.members` from the assistance tree
or parses a lane claim as an evidence member.

### 5. Able-to-fail fixtures

`tools/register-check.test.mjs` supplies source strings/temporary trees for every branch. The
fixture table's unit is **mutation class**; total sixteen:

| # | mutation | required result |
|---|---|---|
| 1 | whitespace/comment/property-order only | digest unchanged |
| 2 | add one literal member | digest changes; unclaimed C9 failure |
| 3 | add one field | digest changes; unclaimed C9 failure |
| 4 | remove/rename one field | digest changes; unclaimed C9 failure |
| 5 | change head 4→5 only | head and digest change; unclaimed failure |
| 6 | optional or mutable property | extractor refusal |
| 7 | non-string domain or index signature | extractor refusal |
| 8 | missing/wrong `contract-digest` | C9 failure |
| 9 | claim lane 4 | C9 failure |
| 10 | claim lane 6 at head 4 | C9 failure |
| 11 | two claimant RFCs, whether same or different lanes | C9 failure |
| 12 | one lane-5 claim and matching README row | pass while tree remains head 4 |
| 13 | replace a direct union with an equivalent local alias | same derived domain and digest |
| 14 | resolve an imported `as const` tuple through `(typeof VALUES)[number]` | exact literal domain; changing one tuple value changes digest |
| 15 | widen one alias/tuple-derived arm to `string` (or leave another non-literal residue) | named extractor refusal |
| 16 | render derived output with/without the lane-5 claimant | exact assistance line; no evidence-kinds fallthrough |

The implementation also runs the real repository and asserts derived head 4, nine axes, 22 values,
the current digest and exactly one lane-5 claimant. The explicit counts are drift tripwires; a
future intentional version changes them together with its claim.

### 6. Files and boundaries

Implementation changes exactly these authority classes:

- `tools/register-check.mjs` and `tools/register-check.test.mjs`;
- `rfc/README.md`;
- claim/status/dependency prose in `rfc/hint-distance.md` and `rfc/intent-presets.md`;
- current-tense fixed register counts in active RFC/register prose ([[D1584]]), rewritten to
  “the registered resources” while explicitly dated historical counts remain untouched;
- `docs/development.md` command output/registered-resource description;
- ledger, planning log and this RFC's closeout records.

It does **not** edit `packages/runtime/src/assistance.ts`, browser storage, presets, settings,
schemas, database migrations, content, or any archive file. If implementation needs one of those,
this RFC is returned rather than widened.

## Deviations from design

None. No design intent changes.

## Acceptance criteria

1. **Rule-7 coverage.** `RESOURCE_NAMES` and the README register set each gain exactly
   `assistance-config`; deleting either fails C6/C9.
2. **Semantic derivation.** The real tree derives head 4, nine axes and 22 string members; the
   normalized digest is stable under mutation-classes 1 and 13, resolves class 14, and changes
   under classes 2-5 and the changed-tuple arm of 14.
3. **Fail closed.** Mutation classes 6-7 and 15 throw a named extractor error; no property or
   non-literal union residue disappears from the normalized shape.
4. **Register binding.** C9.2/C9.3/C9.5 fail on wrong head, wrong/missing digest and missing landed
   head respectively.
5. **Single writer.** Same-lane and different-lane two-claim fixtures both fail. Lane 4 and lane 6
   fail at head 4; one lane 5 passes.
6. **Bijection.** Deleting either the Guided Hint declaration or README live row fails C3.
7. **Historical truth.** The four landed rows cite the four commits recovered by `git log -S`; no
   archived RFC is invented as their owner.
8. **No product change.** `git diff` contains no runtime/web/schema/storage/content/archive file
   except the two active RFC prose/claim blocks explicitly listed in §6.
9. **Existing registers unchanged.** Every pre-existing C1-C8 fixture remains green and the real
   derived heads/digests for seven existing resources are byte-identical.
10. **Governance/CI.** Node-24 `make verify-governance`, `git diff --check`, the staged
    process-contract hook and CI's governance job pass on committed bytes; success reports C1-C9.
11. **Docs/closeout.** Development docs, README status, [[D1581]], exploration log and this RFC's
    plan/log are updated in the implementing commit. Archive remains untouched until all
    discharges close.
12. **No hand-count recurrence.** Current-tense active prose contains no assertion that the live
    register set has six, seven or eight members; [[D1584]] closes while dated historical facts
    remain byte-identifiable as history.
13. **Generic process law stays generic.** `rfc/0000-rfc-process.md` is byte-identical; deleting
    `assistance-config` from `RESOURCE_NAMES` or its README section still fails criteria 1/4, so no
    prose inventory is needed.
14. **Derived output has a typed assistance arm ([[D1630]]).** With the Guided Hint claim it prints
    `assistance-config: head 4; next hint-distance.md (lane 5)`; without one it prints
    `assistance-config: head 4; next lane 5`. Neither path accesses `.members` or uses the
    evidence-kind claim parser.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Independent process/buildability review re-derives the rule-7 predicate, AST grammar, single-writer rule and exact file boundary | claude | `planning/assistance-config-register/log.md` + corrections/acceptance | |
| D2 | Implement C9, register/history, claim transfer, docs and able-to-fail fixtures without product bytes | codex | implementing SHA + green governance output | |
| D3 | Guided Hint v5 product implementation later moves the landed head/digest, removes its live claim and preserves v1-v4 migrations | codex | `hint-distance` implementing SHA/receipt | |

## Open questions

None. Product choices remain in their product RFCs; this document only registers their shared
contract.

## Changelog

- 2026-08-26: pre-review [[D1630]] correction. Added the exact `derivedOutput` branch and fixture;
  the shipped fallback treats every non-schema/non-migration resource as `evidence-kinds` and
  would otherwise crash or misparse the new lane claim.
- 2026-08-26: pre-review [[D1628]] scope correction. Removed the unnecessary RFC-0000 amendment:
  rule 7 is already generic, while `RESOURCE_NAMES` plus the README bijection are the executable
  inventory. Added criterion 13 and removed the process-law file from §6.
- 2026-08-26: pre-review [[D1627]] correction. The syntax-only direct-union extractor would have
  rejected the already-specified v5 `"off" | HintRung` field. Derivation now uses a workspace
  TypeScript `Program`/`TypeChecker`, resolves local/imported and readonly-tuple aliases to their
  semantic literal domains, and fails on any broad/non-literal residue. Added mutation classes
  13-15 and rebound criteria 2-3; no product byte or assistance value changed.
- 2026-08-26: drafted from `design/research/assistance-config-shared-resource.md` and [[D1581]].
