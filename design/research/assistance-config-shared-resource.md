# AssistanceConfig as a shared versioned resource

**Question.** Does `AssistanceConfig` meet RFC-0000 rule 7, and if so what is the smallest register
that prevents two assistance/preset documents from silently changing one persisted contract?

**Verdict.** Yes. It satisfies all three rule-7 limbs, and the existing declaration census is not
a substitute for a resource register. Add one single-writer `assistance-config` register whose
landed head and normalized shape digest are derived from the runtime declaration. Guided Hint owns
the sole live v5 claim; `intent-presets` consumes that version through a dependency and does not
open a second claim.

## Method

- Read the rule and implemented register mechanism at `rfc/0000-rfc-process.md:89-95`,
  `rfc/archive/shared-resource-registers.md` §§1-6 and `tools/register-check.mjs`. `[V]`
- Read the runtime declaration/export, browser storage parser/migrations, default projections,
  settings and run consumer at `packages/runtime/src/assistance.ts:4-33`,
  `packages/runtime/src/index.ts:85`, `apps/web/src/lib/assistance-preference.ts:1-59`,
  `apps/web/src/lib/AssistanceSettings.svelte:1-65` and
  `apps/web/src/lib/DrillScreen.svelte:175,377-395`. `[V]`
- Recovered v1-v4 history with `git log --reverse -- packages/runtime/src/assistance.ts` and
  `git show` at `e78e7238`, `f90d0771`, `9e99a541` and `765efb56`. `[V]`
- Ran the shipped declaration instrument on Node 24:
  `make expression-census DECLARATIONS=1 OUT=/tmp/tabiya-assistance-census.json`, then selected
  `namespace == "assistance"`. It reported 32 subjects, 0 consumer-zero, 12 producer-zero and 31
  disposition-missing. `[V]` The command is reproducible; the temporary output is not a product
  artifact.

## Findings

### 1. All three rule-7 limbs hold

**Versioned/closed.** `AssistanceConfig.version` is the literal `4`; its nine non-version fields
are closed string-literal unions. The persisted JSON therefore has one numeric head and 22 allowed
string values across nine axes. `[V]` `packages/runtime/src/assistance.ts:4-15`.

**Parallel writers can collide.** `rfc/hint-distance.md` proposes v5 plus `hintDistance`, while
`rfc/intent-presets.md:724-735` must add that field to both its exhaustive preset projection and
context-clamp tables and its Discharge D4 assigns the v4→v5 migration to the hint landing. They
cannot independently land different v5 shapes. `[V]` This is one owner plus one dependent after
registration, not permission for two same-version claims.

**Cross-package/persisted.** Runtime exports the type and silent value through
`packages/runtime/src/index.ts:85`; web imports them into settings, the run surface and the
preference store. `saveAssistance` serializes the complete object under
`tabiya.assistance.v1.<workflow-context>`, and `loadAssistance` parses/migrates payload versions
1, 2 and 3 to 4 while deliberately retaining that storage-key version. `[V]`
`apps/web/src/lib/assistance-preference.ts:17-59`. The current scope is browser persistence, not a
database schema or run event.

The four historical heads are real, contiguous public payloads: v1 established five axes at
`e78e7238`; v2 added `corpus` at `f90d0771`; v3 added two-state `spoken` at `9e99a541`; v4 replaced
that speech domain and added board lighting, arrows and ambient at `765efb56`. `[V]` The browser
suite has a positive migration fixture for every prior version and a current-value round trip at
`apps/web/src/lib/assistance-preference.test.ts:26-46`.

### 2. The declaration census answers a different question

The census derives the interface's ten property names and 22 **string** members, producing the
measured 32 subjects. It does not emit `version=4` because `assistanceDeclarations` visits string
literal type nodes only (`apps/server/src/declaration-census.ts:199-218`). `[V]`

Its producer/consumer counts are token-level reach indicators, not contract identity. For example,
the common token `version` reports 75 producers and 93 consumers, and values dynamically offered
by `<select>` controls can report zero producers while being reachable. `[V]` This is why its
12 producer-zero result must not be interpreted as twelve dead assistance values. The census is
useful for vocabulary reach; it cannot reserve v5, detect two draft claimants or bind a stored
payload head to its migration path.

### 3. The register must derive semantic shape, not hash a file

A whole-file hash would turn changes to `permittedAssistance` or `reviewingGrant` into false
`AssistanceConfig` version events. A raw interface-slice hash would turn formatting and property
order into version events. `[M]`

The useful tree value is a normalized AST projection:

```text
version = 4
fields = {
  ambient: [off,on],
  arrows: [evidence,off,sight],
  boardLighting: [evidence,legal,off,sight],
  corpus: [off,on_request],
  guided: [live,off],
  humanSplit: [off,on_request],
  markers: [live,off],
  spoken: [browser,off,provider],
  voice: [authored,persona]
}
```

Sort field names and each literal domain, canonicalize, then SHA-256 that projection. `[M]` This
makes comments, whitespace and member ordering invisible while any added/removed field or allowed
value changes the digest. A numeric or non-literal field is refused until the extractor is
explicitly widened; silent omission is worse than a red process check.

### 4. This resource needs a single-writer claim, not parallel numbered lanes

Schema drafts can sometimes claim successive lanes because their tree artifacts and ownership
order are explicit. `AssistanceConfig` has one browser migrator and one complete object shape. A
v6 author cannot safely write a v5→v6 migrator against an unlanded v5 shape, and two independent v5
authors plainly collide. `[M]`

The register should therefore admit at most one live claim and require exactly `head + 1`:

```text
assistance-config | lane 5 | AssistanceConfig.version; hintDistance; v1-v4 migration to v5
```

Guided Hint owns that claim because it introduces the field/domain/version. `intent-presets`
depends on that claim and updates its exhaustive projections in the same landing without claiming
a second head. `[V]` This follows the existing ownership statement in
`rfc/intent-presets.md:724-735,864-872`; it does not choose a new product behavior.

### 5. Exact process delta

The follow-up RFC can remain process-only and bounded: `[M]`

1. add `assistance-config` to `RESOURCE_NAMES` and the claim grammar;
2. derive head + normalized shape from `packages/runtime/src/assistance.ts`;
3. add a README register seeded with landed v1-v4 history and the one v5 claim;
4. extend register checks with: one register section; head/digest equality; exactly one live claim
   at head+1; declaration/register set equality; no unclaimed semantic-shape drift;
5. mutate version, field, literal, formatting and claimant fixtures so each branch proves it can
   fail;
6. change `hint-distance` from `none` to the v5 claim and retain `intent-presets` as `none` plus a
   dependency.

This register does **not** validate UX quality, preset defaults, permission semantics or whether
every old stored value migrates correctly. Those remain product/runtime acceptance criteria. It
only prevents invisible authority/version collisions.

## Exploration-gate decision

**PASS for a narrow process RFC.** `[V]` The question is no longer a GAP: the rule-7 predicate,
current head, full semantic shape, persistence boundary, historical owners, live claimant and
checker delta are all identified at live symbols. No product behavior or chess truth is chosen.

Implementation of v5 remains blocked on the separate hint RFC's independent buildability review
and shared-packet dependency. Registering the claim authorizes no runtime change by itself.
