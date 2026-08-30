# RFC: AssistanceConfig shared-resource register

- **Status:** draft — returned by second fresh independent buildability review 2026-08-30 on
  [[D2113]]–[[D2117]]. The two-commit repair survives, but the census requires a post-v5 codec at
  the process-only v4 landing, omits the writer and same-head semantic drift, undercounts the v5
  transition, and has no executable source-graph grammar. Exact return:
  `planning/assistance-config-register/second-fresh-independent-buildability-review-2026-08-30.md`.
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

For this resource, `changed symbols` is machine-readable rather than descriptive prose: one or
more ASCII-sorted unique tokens separated by `; `, each matching
`^[a-z0-9_./-]+\.ts#[A-Za-z_$][A-Za-z0-9_$.]*$`. The transition reader derives these tokens from
the previous and current source trees; no caller supplies a supposedly complete list.

The closed authority census has three roots:

1. every changed `AssistanceConfig` property in
   `packages/runtime/src/assistance.ts#AssistanceConfig.<property>`;
2. the transitive TypeScript declaration closure of the sole runtime codec export
   `packages/runtime/src/assistance-codec.ts#parseAssistanceConfig`; and
3. the transitive import/declaration closure of
   `apps/web/src/lib/assistance-preference.ts#loadAssistance`, the sole production reader of the
   `tabiya.assistance.` namespace.

The census scans every non-test production `.ts`/`.svelte` module under `apps/web/src` and
`packages/runtime/src`. The assistance namespace literal, `assistanceKey` call and raw
`PreferenceStorage.getItem` result may reach AssistanceConfig parsing only inside the named web
root. That root must delegate parsed `unknown` to the one runtime codec export and may contain no
local `value is AssistanceConfig`, version switch or field-domain validation. A second reader,
validator, migrator or codec; an indirect alias around one; or an AssistanceConfig parser outside
the three roots fails source closure before the token comparison. An unimported dead file is not a
production authority and is outside the census. Tests/docs are ignored. Within a root, the token
represents its complete reachable declaration/import closure, so a helper change cannot disappear
behind the unchanged export name. This exact derived set is what C9.6 compares with the prior
claim; the human-readable README change column remains separate.

This process RFC itself claims `none`: it changes the register system, not `AssistanceConfig`.
On this RFC's implementation, `hint-distance.md` changes its block atomically to:

```text
assistance-config | lane 5 | apps/web/src/lib/assistance-preference.ts#loadAssistance; packages/runtime/src/assistance-codec.ts#parseAssistanceConfig; packages/runtime/src/assistance.ts#AssistanceConfig.hintDistance; packages/runtime/src/assistance.ts#AssistanceConfig.version
```

`intent-presets.md` retains `none`, names `hint-distance` as the v5 owner/dependency, and updates
its stale “returned to research” prose to “awaiting the [[D1639]] owner ceiling ruling, then repeat
independent review.” Its product implementation still adds the exhaustive preset/clamp columns in
the v5 landing; dependency is not a second claim.

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

The table is a history, not merely a current-head witness. C9 requires exactly one row for every
integer head `1..registered head`, in ascending order. The process landing is the only bootstrap:
it must publish exactly the four rows above with those four pinned commits. After bootstrap, the
staged checker compares the index with `HEAD` and permits only an exact prefix plus, on a head
advance, one appended row; committed CI compares the current file with its first parent and applies
the same rule. Deletion, rewrite, reorder, duplication or a gap fails even when the final row still
matches the current head.

The repository-governance job's checkout is part of this RFC and sets `fetch-depth: 2`. The
committed checker resolves exactly `HEAD^1` with `git rev-parse --verify`; absence is a named hard
failure whenever `HEAD` is not the repository's root commit. Fixture repositories pass explicit
previous/current snapshots to the pure checker and do not share the production Git fallback. The
staged arm reads `HEAD` plus the index. Neither arm catches a missing Git object as “not a Git
fixture”; `tools/status-parity.mjs`'s current silent catch is a negative example, not a precedent.

Its **Live claims** table contains the exact Guided Hint lane-5 declaration and no preset claim.
No hand-written “next free” row exists; `register-check` prints it.

`parseRegisterSections` accepts `contract-digest` only for this resource and retains
`schema-digest` for schema resources. A digest of the wrong kind/resource is treated as absent.

### 4. C9 — assistance contract identity and transition

The existing C1-C8 meanings stay byte-for-byte. New check C9 has six arms:

| arm | failure |
|---|---|
| C9.1 | no/multiple AssistanceConfig interface, or unsupported/ambiguous member shape |
| C9.2 | README head differs from the AST-derived numeric version |
| C9.3 | README contract digest is absent or differs from the AST-derived digest |
| C9.4 | more than one live claim, or the sole claim is not registered head+1 |
| C9.5 | landed heads are not the unique contiguous sequence `1..head`, a pinned bootstrap row differs, or append-only history is violated |
| C9.6 | a head advance does not consume exactly one matching prior claimant into one owner-bound Landed row |

Tree head and digest must always equal the checked register bytes. A live claim reserves only the
registered head+1 owner; it never excuses current-tree drift ([[D1916]]). The legitimate v5 landing
is one atomic commit: runtime head/domain, README head/digest, landed table and claim surfaces all
move together, and the live claim disappears. There is no valid committed midpoint. If owner-use
validation keeps the product RFC active afterward, its block returns to `none`.

Snapshot equality is necessary but not sufficient for that landing ([[D2012]]). C9 also evaluates
the staged/first-parent transition. A head advance is legal only when all of these hold:

1. the previous committed head is exactly `current head - 1` and its tree/register/digest are valid;
2. the previous state contains exactly one declaration/register claimant for the current lane;
3. the current state removes that claim, appends exactly one Landed row and names the same RFC as
   owner; and
4. the complete census-derived assistance source changes are set-equal to the prior claim's exact
   path/symbol tokens. The v5 reservation names
   `assistance-preference.ts#loadAssistance`, `assistance.ts#AssistanceConfig.version`,
   `assistance.ts#AssistanceConfig.hintDistance` and
   `assistance-codec.ts#parseAssistanceConfig`; an unrelated assistance symbol or undeclared path
   fails the transition.

A no-prior-claim, wrong lane, wrong claimant, partial symbol set, rewritten old row or head skip
fails. Adding or withdrawing an unimplemented claim at an unchanged valid head remains a normal C3
declaration/register transition and changes no Landed history. The process RFC's first registration
is a named bootstrap, not a fake head transition: absent previous resource → exact pinned v1-v4
history + exact Guided Hint v5 claim.

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
fixture table's unit is **mutation class**; total twenty-nine:

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
| 12 | unchanged head-4 tree/register plus one lane-5 claim and matching README row | pass |
| 13 | replace a direct union with an equivalent local alias | same derived domain and digest |
| 14 | resolve an imported `as const` tuple through `(typeof VALUES)[number]` | exact literal domain; changing one tuple value changes digest |
| 15 | widen one alias/tuple-derived arm to `string` (or leave another non-literal residue) | named extractor refusal |
| 16 | render derived output with/without the lane-5 claimant | exact assistance line; no evidence-kinds fallthrough |
| 17 | same-head field/member drift plus lane-5 claim | fail head/digest equality; claim cannot mask drift |
| 18 | tree head 5 with register head 4 plus lane-5 claim | fail head equality |
| 19 | complete head-5 snapshot with claim removed | snapshot arms pass; transition arm separately requires row 24 |
| 20 | landed history `[4]`, `[1,3,4]`, duplicate 3 or reordered rows | fail C9.5 |
| 21 | exact pinned v1-v4 bootstrap plus exact Guided Hint v5 claim | pass; changed commit/row/claim fails |
| 22 | head-5 landing with no prior claim, wrong lane or wrong claimant | fail C9.6 |
| 23 | head-5 landing rewrites an older row, skips a head or appends two rows | fail C9.5/C9.6 |
| 24 | prior exact Guided Hint lane-5 claim → head-5 tree/digest + one owner-bound row + no claim | pass |
| 25 | prior claim omits a changed assistance symbol or names `validV5` | fail C9.6/claim grammar |
| 26 | governance checkout lacks `HEAD^1`, or production parent resolution throws | fail closed; never skip the committed arm |
| 27 | exact two-commit governance checkout plus valid prior claim→landing | pass committed C9.5/C9.6 |
| 28 | `loadAssistance` calls a local/direct/indirect `validV5`, or a second production module reads the assistance namespace | fail authority census even when the reported four tokens match |
| 29 | unrelated production `.ts` change or unimported dead helper | unchanged assistance authority set; no false claim requirement |

The implementation also runs the real repository and asserts derived head 4, nine axes, 22 values,
the current digest, exact contiguous pinned history and exactly one lane-5 claimant. The explicit
counts are drift tripwires; a future intentional version changes them through the checked
claim-to-landing transition.

### 6. Files and boundaries

Implementation changes exactly these authority classes:

- `tools/register-check.mjs` and `tools/register-check.test.mjs`;
- `.github/workflows/verify.yml` (repository-governance checkout only: `fetch-depth: 2`);
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
4. **Register binding.** C9.2/C9.3 fail on wrong head and wrong/missing digest. C9.5 requires one
   unique contiguous Landed row for every head and refuses mutation classes 20/23.
5. **Single writer and no drift exception.** Same-lane and different-lane two-claim fixtures both
   fail. Lane 4 and lane 6 fail at head 4; one lane 5 passes only with unchanged head-4 tree/register
   bytes. Same-head or head-only drift still fails. A complete head-5 snapshot is accepted only
   when C9.6 proves the prior exact lane-5 claimant, owner-bound appended row and declared symbol
   transition; the symbol set is derived from the closed authority census rather than supplied by
   the caller. Mutation classes 22/25/28 fail and classes 24/29 pass.
6. **Bijection.** Deleting either the Guided Hint declaration or README live row fails C3.
7. **Historical truth.** The four landed rows cite the four commits recovered by `git log -S`; no
   archived RFC is invented as their owner. Bootstrap requires those exact four rows, and later
   staged/first-parent checks permit only prefix-preserving one-head appends.
8. **No product change.** `git diff` contains no runtime/web/schema/storage/content/archive file
   except the two active RFC prose/claim blocks explicitly listed in §6. The governance workflow's
   exact `fetch-depth: 2` change is the sole non-document/checker addition.
9. **Existing registers unchanged.** Every pre-existing C1-C8 fixture remains green and the real
   derived heads/digests for seven existing resources are byte-identical.
10. **Governance/CI.** Node-24 `make verify-governance`, `git diff --check`, the staged
    process-contract hook and CI's governance job pass on committed bytes; success reports C1-C9.
    Mutation 26 proves required parent absence is fatal and mutation 27 crosses the real
    two-commit shape. The workflow file is parsed by scaffold verification so removing or lowering
    its governance `fetch-depth` fails locally before push.
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
15. **Literal claim and source-closure truth ([[D2010]], [[D2038]]).** The sole row names only the
    web `loadAssistance` root, runtime `AssistanceConfig.version`/`.hintDistance` fields and
    `parseAssistanceConfig`. The generated production census is set-equal to those roots and proves
    that `loadAssistance` delegates unknown bytes to the sole runtime codec. A local/direct/indirect
    `validV5`, another assistance-namespace reader or a parallel migration authority fails even
    when a caller reports only the four expected tokens.
16. **Dependent phase truth ([[D2011]]).** Every implementation-owned stale Hint status says
    “awaiting the D1639 owner ruling, then repeat independent review”; nothing claims that review is
    already open or changes the owner table.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Independent process/buildability review re-derives the rule-7 predicate, AST grammar, single-writer rule and exact file boundary | claude | `planning/assistance-config-register/log.md` + corrections/acceptance | |
| D2 | Implement C9, register/history, claim transfer, docs and able-to-fail fixtures without product bytes | codex | implementing SHA + green governance output | |
| D3 | Guided Hint v5 product implementation later moves the landed head/digest, removes its live claim and preserves v1-v4 migrations | codex | `hint-distance` implementing SHA/receipt | |

## Independent-review routing

| finding | blocker | repair owner |
|---|---|---|
| [[D1916]] | lane-5 claim masks same-head v4 digest drift | amend §4, mutation table and criteria 2/4/5 |
| [[D2009]] | repaired in §§3–4 by exact contiguous bootstrap plus append-only staged/first-parent history | repeat independent review |
| [[D2010]] | repaired in §1/criterion 15 by the exact runtime fields and `parseAssistanceConfig` claim | cross-RFC symbol review |
| [[D2011]] | repaired in §1/criterion 16 by the actual D1639-blocked phase | cross-RFC status review |
| [[D2012]] | repaired in §4 by previous-claimant→owner-bound-landing transition semantics | transition-capable repeat review |
| [[D2037]] | repaired in §§3–6/criteria 8/10: governance checks out exactly two commits and required-parent resolution fails closed | fresh independent review |
| [[D2038]] | repaired in §§1/4/criteria 5/15: transition tokens derive from the closed runtime-codec/browser-persistence census | fresh independent review |
| [[D2113]] | bootstrap v4 cannot satisfy post-v5 codec rules without forbidden product edits | author: phase the actual v4 authority and the claimed v5 centralization |
| [[D2114]] | `saveAssistance` is absent from the persistence closure | author: register and correlate every namespace read/write operation |
| [[D2115]] | fixed-head persistence semantics can drift outside the field-domain digest | author: version or digest every authority-closure semantic change |
| [[D2116]] | four claimed tokens omit required defaults, permissions and consumer discharge | author: derive the real v5 transition/consumer closure |
| [[D2117]] | transitive TS/Svelte source closure has no executable graph grammar | author: publish and exercise exact node/edge/change identity |

## Open questions

None. Product choices remain in their product RFCs; this document only registers their shared
contract.

## Changelog

- 2026-08-30: second fresh independent review returned the third repair on [[D2113]]–[[D2117]].
  Current-v4 versus post-v5 authority, the writer, fixed-head semantic drift, the complete v5
  transition and the source-graph algorithm remain open. Prior 7 + 7 + 6 contracts survive; no
  implementation is authorised.
- 2026-08-30: third-return author repair. The governance job now owns an exact two-commit checkout,
  production resolves `HEAD^1` explicitly and missing required history is fatal. Transition tokens
  derive from the closed `AssistanceConfig` fields/runtime-codec/web-persistence source closure;
  callers cannot omit a parallel validator, migration authority or namespace reader. The six-arm
  author contract replaces the four return reproductions. Fresh independent review remains.
- 2026-08-30: fresh independent review returned the repaired draft on [[D2037]]/[[D2038]]. The
  first-parent contract has no CI history and its workflow repair is outside the file boundary;
  the claimed three-token transition can also omit a parallel browser codec because no closed
  assistance-authority census derives the token population. Prior repairs survive.
- 2026-08-28: amended after the second return. Landed heads are exact contiguous append-only
  history; head advancement consumes one prior exact claimant through staged/first-parent checks;
  the v5 claim names only the runtime `AssistanceConfig` fields and `parseAssistanceConfig`; and
  dependent status prose stays at “awaiting D1639 owner ruling, then repeat review.” The 25-arm
  author contract replaces the four review reproductions. Fresh independent review remains.
- 2026-08-27: amended after the D1916 return. Removed the live-claim digest exception: head and
  digest always equal tree authority; a claim only reserves registered head+1. Added crossed
  same-head/head-only drift negatives and atomic next-head/unchanged-reservation positives.

- 2026-08-27: independent review returned C9 on [[D1916]]. A live next-head claim may reserve
  ownership but must never excuse current-tree head/digest drift. Exact return:
  `planning/assistance-config-register/independent-buildability-review-2026-08-27.md`.
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
