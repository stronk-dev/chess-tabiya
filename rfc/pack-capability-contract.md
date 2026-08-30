# RFC: Pack capability contract — semantic versions, handshake, deprecation and migration

- **Status:** draft — **fourth author repair complete 2026-08-30; fresh independent review
  required.** [[D2152]]–[[D2156]] are repaired by cumulative 0.27→0.28→0.29→0.30 post-images, a
  literal 397-member target inventory plus checked generator, module-qualified evaluator and
  constant sites, lockfile-resolved external semantic sources, and typed withdrawal successor /
  no-successor arms. Receipt:
  `planning/pack-capability-contract/fourth-author-repair-2026-08-30.md`.
  No schema, registry, pack or digest implementation is authorised; the D560 hold stays whole.
- **Author:** claude (drafted from `planning/platform-alignment/f3-derivation.md`, the HEAD derivation of every surface this document versions)
- **Created:** 2026-08-23
- **Design refs:** `design/research/pack-primitive-stability.md` §6 (R6's six-part model); `planning/platform-alignment/plan.md` Gate F clauses 1, 5, 6, 7
- **Exploration gate:** O6.1 approved as [[D995]] and O6.2 ruled as [[D996]]; `planning/platform-alignment/theory-drill/o5-o6-handoff.md:96` reads verbatim `O6.1 + O6.2 approved → F3 may draft` (line corrected from `:100`, a code fence, by cross-review 2026-08-23)
- **Depends on:** `archive/evidence-contract-manifest.md` (F1 — the compiled manifest this versions), `rfc/graduation-clearance.md` (accepted — lane 0.28, the planner precedent in its §6.5). **Followed by, never imports:** draft `rfc/claim-semantic-anchors.md`, which may adopt F3's generic identity only after F3 is accepted.
- **Parent / amends:** — (this is F3 in `planning/platform-alignment/rfc-graph.md:70`)
- **Supersedes / superseded by:** —
- **Planning:** `planning/platform-alignment/` (`f3-derivation.md`)

```tabiya-claims
pack-schema | lane 0.30 | requires (new, required array of capability requirement objects on the pack root); $defs/capabilityRequirement (new, closed object: id, version)
```

## Summary

A pack today declares **no version of any kind** — not of the format it was written against, not
of the evaluator semantics its conditions depend on. Measured over all 92 pack documents: 24
top-level keys under `"additionalProperties": false`, and a grep for
`schemaVersion|formatVersion|capabilities|$schema|specVersion|packFormat` matches **0 files**
(`f3-derivation.md` §2e). Meanwhile the meanings a pack depends on live in **≥163 pack-facing
vocabulary arms across 32 vocabularies**, **193** core-manifest projections, **13** conventions whose
semantics are **frozen prose**, and 13 verdict producers of which **12 carry no identifier at all**.

*(Counts corrected at the six-blocker repair, 2026-08-23: the pack-facing arm floor is **163**
across 32 vocabularies once the two omitted parent unions are counted, and the conventions are
**13**, not 12. §3.1 replaces every hand-count with a derivation procedure — these figures are a
tripwire baseline, not the contract's definition.)*

This RFC specifies the contract that binds those two facts together: a **capability** is a named,
versioned, digest-bound unit of evaluator meaning; a pack **declares the capability versions it
requires**; the runtime **publishes what it supports**; and a handshake refuses, before
registration, any pack whose requirements the runtime cannot meet. It adds a read-only
**migration planner** separate from its applier, and a typed **deprecation** mechanism where every
withdrawn capability carries a successor or an explicit refusal.

The one-line test this document must pass: **would it have caught [[D566]]?** That drift changed
`pawn_safe_square`'s meaning and took `outpost`'s measured truth from 10 observations to **0 of
643** — with no schema change, no digest movement and no version increment. Every mechanism the
repo had for noticing change reported "nothing changed". §2.3's semantics digest is the answer, and
criterion 13 is that exact case as a regression test.

Claims **pack-schema lane 0.30**, per owner ruling [[D1058]].

## Motivation

`design/research/pack-primitive-stability.md` §6 states the six-part model the owner approved as
[[D995]]. This RFC is that model made executable. Three findings from the derivation set its shape.

**First: the version axis F3 was asked to build on is, at HEAD, a constant.** 56 distinct versioned
semantic identifiers exist in **three incompatible spellings** — 40 as `name@1`, 16 as `name@v1`,
at least 2 as structured `{id, version}` — and **not one has ever been bumped past 1**
(`f3-derivation.md` §3c). Worse, at `apps/server/src/evidence-manifest-check.ts:70` the version is
not data at all:

```ts
const declaredSemanticIds = SEMANTIC_EVENT_PROJECTION_IDS.map((id) => `${id}@1`).sort();
```

All 67 semantic events are pinned at `@1` by a literal inside an assertion. Bumping any one of them
reddens `make verify` in a way only an edit to the checker can clear. A contract cannot be built on
a version that no mechanism can increment.

**Second: a contract that versions JSON fields misses exactly the drift it exists to catch.** This
is not hypothetical. [[D566]]/[[D632]] already happened, and §2.3 exists because of it.

**Third: the largest determinants of a pack's meaning are the least identified things in the
tree.** Of 13 verdict producers, only `moveQualityGrade` carries an identifier
(`grade-convention@1`, `packages/runtime/src/grade.ts:26-28`). The objective state machine,
transition-legality table, terminal outcome, tempo ladder, line verdict, trajectory verdict, branch
decidedness, both guards, claim earning and opponent selection have a file and a function and
nothing else. Two of them are **ordering** semantics — `evaluateObjective`'s first-match-wins rule
(`objective.ts:388-403`) and the tempo cascade (`tempo.ts:252-262`) — which no field-keyed version
can express. §2.2 keys capabilities on **evaluator identity** rather than on JSON fields precisely
so that ordering is expressible.

**Out of scope, explicitly.** Pilot membership (O6.3 / F7's job); UX defaults; new chess
primitives; applying the corpus plan (the [[D560]] content hold stands whole per [[D949]] — this
RFC ships a *planner* and a sealed 0.27→0.30 transition, while its applier writes nothing until the
hold's graduation arm lifts);
lifting Gate F; detector semantics v1 (clause 4 of the gate, a separate document); and the 14 F1
declared-vs-consumed mismatch rows.

## Specification

### §1. The approved contract, quoted

`planning/platform-alignment/theory-drill/o5-o6-handoff.md:54-61`, verbatim:

> Approve R6's six-part model: immutable released artifacts; pack-required/runtime-supported semantic
> capability versions; evaluator semantics versioned independently from JSON fields; one read-only
> migration planner plus explicit applier; deprecation with successor/refusal; and a sacrificial pilot
> covering every **required** 1.0 capability.
>
> F3 may implement this framework before the final pilot list exists. It must not choose UX defaults,
> add chess primitives, apply the corpus plan or lift Gate F.

Clause 6 (the pilot) is F7's to satisfy; this RFC specifies what the pilot must cover, not which
packs comprise it.

### §2. What a capability is

#### §2.1 One namespace, one spelling, version as data

```ts
// packages/schema/src/capability/types.ts (new)
export interface CapabilityId {
  readonly id: string;
  readonly version: CapabilityVersion;
}

export type CapabilityVersion =
  | { readonly kind: "integer"; readonly value: number }
  | { readonly kind: "semver"; readonly value: string };
```

`CAPABILITY_ID_PATTERN` is
`^[A-Za-z][A-Za-z0-9_-]*(?:[.:][A-Za-z0-9][A-Za-z0-9_-]*)*$`. The final repetition is optional:
one-segment ids are part of the shipped compatibility inventory (`mate-proof`, `pressure-line`,
`candidate-majority`). The same grammar preserves the
mixed-case and colon-separated legacy families already shipped (`structuralFeature.outpost`,
`error.SIMULATE_BUDGET_EXCEEDED`, `assistance:arrows`) while excluding whitespace, slash and every
`@` suffix. Case is significant; migration never lowercases an existing identity. New ids use
lowercase dotted form by convention, enforced by the declaration authoring helper, while the public
parser accepts the complete compatibility grammar above.

**The version is structured data, never a suffix inside `id`.** Integer versions are safe integers
`>= 1`. Semver is the exact pack-format semver grammar already exported by the schema package,
normalized to three numeric components with no leading zero and no prerelease/build arm. Generated
`shape.<id>` / `principle.<id>` capabilities use `{kind:"semver", value: entry.version}`; ordinary
evaluator/projection capabilities use `{kind:"integer", value:N}`. No numeric coercion exists
between arms. `capabilityKey` renders the collision-free internal key
`<id>@i:<integer>` or `<id>@s:<semver>`; display may use the shorter legacy spelling only for an
integer compatibility value.

`parseLegacyCapability` accepts exactly the shipped `name@1` / `name@v1` forms and returns an
integer arm. `parseCapabilityRequirement` accepts only the structured object. Thus
`tablebase.probe@v1` and `rules.structural.predicate.outpost@1` migrate without rewriting historical
bytes, while shape version `0.1.3` round-trips without an invented integer encoding. A string with a
semver suffix is not a legacy capability and is refused rather than guessed.

**Why this and not the majority spelling:** G5. `evidence-manifest-check.ts:70` proves a suffix
spelling puts the version inside assertions, where incrementing it requires editing the checker.
Criterion 5 asserts the narrower typed-authority boundary below; exact legacy-wire fixtures remain
legal.

#### §2.1a Structured authority versus legacy wire values

The implementation migrates **authority**, not historical bytes. New capability declarations,
requirements, successors, provider bindings and binding contracts use `CapabilityId`. Existing
persisted/API payload versions remain readable through their owning schema/version parser; an old
run, evidence packet or sidecar is never rewritten merely because this contract lands. Sidecar
schema names such as `tabiya.sourcing.evidence.v1` are artifact-schema identifiers, not capability
identifiers, and are outside this migration.

The compiler check is type-directed, not a grep. A suffix literal matching `@N` or `@vN` is illegal
when its contextual type is `CapabilityId`/`CapabilityKey`, when it initializes a capability field,
or when it is passed to the current-id assertion API. Tests may contain the exact old bytes only
through `legacyCapabilityFixture(value)`, which calls `parseLegacyCapability` and marks it as compatibility
input. Disposable research output and prose are outside the production scan. New writers emit
structured data; legacy readers remain for the lifetime of the artifact schema that introduced the
string. Criterion 5 fixtures all three cases: forbidden current authority, permitted named legacy
wire input, and an unrelated versioned schema string.

#### §2.2 A capability is keyed on an evaluator, not on a field

A capability names **a unit of meaning that a pack can depend on**. Its subject is one of:

| Subject kind | Example | Why it is a capability |
|---|---|---|
| `vocabulary_arm` | `structuralFeature.outpost` | a pack authors this arm; its truth is decided in code |
| `expression_node` | `structuralExpression.quantified` | quantifier scope decides composite truth |
| `verdict_producer` | `objective.state_machine` | **ordering is semantics** (first-match-wins) and no field expresses it |
| `convention` | `mate-proof` | its normative statement is prose (§2.4) |
| `constant_table` | `grade.thresholds` | a threshold edit reclassifies every recorded pair |
| `projection` | `rules.structural.predicate.outpost` | a projection in the compiled F1 manifest |
| `resolved_reference` | `shape.maroczy-bind` | referenced content bytes and version decide expansion |
| `assistance_surface` | `assistance.arrows` | a declared surface may remain unmeasured/refused independently of a pack union |
| `error_contract` | `error.SIMULATE_BUDGET_EXCEEDED` | retirement of a public error is versioned meaning |

Keying on evaluators rather than fields is what makes ordering, prose conventions and duplicated
constant tables expressible. A JSON field may map to several capabilities; a capability may be
depended on by several fields.

#### §2.3 The semantics digest — the mechanism that catches D566

Every capability declaration carries a **semantics digest** over the artifacts that define its
meaning:

```ts
export type CapabilitySubjectKind =
  | "vocabulary_arm"
  | "expression_node"
  | "verdict_producer"
  | "convention"
  | "constant_table"
  | "projection"
  | "resolved_reference"
  | "contract_identity"
  | "assistance_surface"
  | "error_contract";

export interface CapabilityDeclaration {
  readonly id: string;
  readonly version: CapabilityVersion;
  readonly subject: CapabilitySubjectKind;
  readonly sources: readonly CapabilityMeaningSource[]; // >= 1; subject-appropriate authority
  readonly dependsOn: readonly CapabilityId[];           // acyclic; digest closes transitively
  readonly conventionText?: string;            // when the normative statement is prose (§2.4)
  readonly semanticsDigest: string;            // `sha256:...` over source images + dependencies + conventionText
  readonly disposition: SemanticDisposition;  // §5; one vocabulary throughout
}
```

`CapabilityMeaningSource` is closed. AST-backed subjects use `CapabilitySite`; F1 projections and
resolved content use their own existing canonical authorities instead of pretending to be named
TypeScript declarations:

```ts
export type CapabilityMeaningSource =
  | { readonly kind: "schema_member"; readonly sourceIdentity: SchemaMemberIdentity }
  | { readonly kind: "ast"; readonly site: CapabilitySite }
  | { readonly kind: "f1_projection"; readonly projection: CapabilityId }
  | { readonly kind: "resolved_content"; readonly registry: "shape" | "principle"; readonly entryId: string }
  | { readonly kind: "package_dependency"; readonly package: string; readonly version: string;
      readonly integrity: string; readonly lockfile: string; readonly lockfileKey: string };

export type CapabilitySite =
  | { readonly kind: "symbol"; readonly module: string; readonly symbol: string }
  | { readonly kind: "discriminant_arm"; readonly module: string; readonly owner: string;
      readonly property: string; readonly value: string };
```

`module` is a repository-relative POSIX path. A symbol site selects exactly one named declaration;
an arm site selects exactly one equality arm inside the named owner. Zero or multiple matches fail.
The canonical source image is JCS over the domain tag `tabiya.capability.site.v1`, the site record,
and the ordered TypeScript token stream `(SyntaxKind name, token text)` with trivia excluded. Sites
sort by their JCS image; dependencies sort by id. Each dependency contributes its full semantics
digest, cycles fail, and imports/helpers/constants participate only through an explicit site or
dependency. Before the registry is generated, every §3.1 named root is exported as the literal
symbol listed there; inline/property/prose descriptions are not legal sites. The TypeScript package
and lockfile are part of the repository toolchain; changing the
extractor format requires a new site-image domain tag rather than silently moving every digest.

A `package_dependency` source is the exact package name, every workspace manifest specifier that
reaches the source closure, and the lockfile's resolved version plus integrity. It attaches
automatically when TypeScript symbol-reference closure reaches an import from that package; local
AST bytes do not pretend to contain external chess behavior. At author HEAD the authority contains
`chessops@0.15.1`, integrity
`sha512-hQDwv90AFkrPEsRJBebh3ZE+xDga25TCCv4lavNT2plZmd33UKNFYaZsE+7rafMbnBRrDEWUVsSYFqY3qCIGZw==`,
joined to all four exact manifest pins and `pnpm-lock.yaml#chessops@0.15.1`. Version, integrity,
manifest or lock-key drift changes the source image; an unresolved or multiply resolved lock entry
fails generation. This is the external half of D566: changing chess truth through a dependency
upgrade cannot preserve a capability digest at the same version.

Every closed-vocabulary declaration also carries its exact `schema_member` source. That source is
necessary but not sufficient for an interpreted member: the checked `meaningAuthority` in
`rfc/contracts/pack-capability-applicability-v1.json` adds every interpreter entry site and closes
each site through TypeScript symbol references, including imported helpers and constant tables.
The seven multi-site/root families are author-owned rows in that artifact, not implementation
choices. The compiler set-equals those roots against the exhaustive-switch census: a new switch,
missing second site, unresolved symbol or reachable helper omitted from closure fails. An unused
same-name symbol is unreachable and contributes nothing. A helper-only mutation therefore moves
the dependent digest; a mutation outside the referenced symbol graph does not.

An `f1_projection` source resolves one exact `ProjectionDeclaration` from
`PRIMARY_EVIDENCE_MANIFEST`. Its source image is JCS over the domain
`tabiya.capability.f1-projection.v1` and that declaration's id/version, role, plane, payload type,
semantics, operands, signs, grounding, exactness, confidence, abstention, answer content, forms,
limitations, disposition, `dependsOn`, literal derivation and compiled execution paths. Its
capability dependencies are generated from the declaration's `dependsOn` and every derivation
member. This is the complete F1→F3 bridge; no `CapabilitySite` or copied manifest digest is
invented.

A `resolved_content` source resolves the exact registry entry, includes its canonical content
digest and structured semver arm, and adds the semantic dependencies described in §2.6. A source
kind inconsistent with `subject` fails `CAPABILITY_SOURCE_KIND_INVALID`; zero sources fails
`CAPABILITY_SOURCE_MISSING`.

`make capability-check` recomputes every `semanticsDigest` from the tree and **fails when a stored
digest does not match its recomputed value at the same version**. The remedy is always one of two
things: revert the meaning change, or increment `version` and record the successor relation (§5).

**This is the D566 test.** `pawn_safe_square`'s semantics were repaired to use a disclosed
`maximal_pawn_reach@1` basis. The pack schema stayed 0.27, no pack byte moved, no `packDigest`
moved, and the projection stayed `@1` — while `outpost` went from 10 observations in 1.56% of
positions to **0 of 643**. Under this contract the edit changes the `pawnSafetyOnPosition` symbol
site declared by `structuralFeature.pawn_safe_square`; dependency closure also invalidates
`structuralFeature.outpost` while leaving an unrelated structural arm unchanged. Its digest stops
matching, and `make verify` goes red until
someone either reverts or bumps to `@2` — at which point every pack requiring `@1` is refused by
§4's handshake and appears in §6's plan as judgement debt. Criterion 13 fixtures exactly this.

#### §2.4 Prose conventions are digested

`BREADTH_CONVENTION_TEXT` (**8** entries — `localNonLosing`, `candidateMajority`, `kingZone`,
`kingShelter`, `materialRole`, `pressureLine`, `squareControl`, `pawnRelations`) and
`SEMANTIC_CONVENTION_TEXT` (5 entries) at `packages/runtime/src/evidence-catalog.ts:182-196` are the
**normative statement** of what **13** collectors assert — including `mate-proof@1`'s 250,000-node cap and `pressure-line@1`'s own
P1/N3/B3/R5/Q9 role scale. Editing that prose changes what the predicate means with no code change
at all. Each convention is therefore a capability whose `conventionText` is inside its
`semanticsDigest`: **a prose edit without a version bump reddens CI**, which is G22's remedy.

#### §2.5 Both interpretation sites, or the capability is not covered

For AST-backed subjects, `sources` is a **list**, minimum length 1, and the declaration must name
**every** site that interprets the subject. Subject-specific F1 and resolved-content sources follow
§2.3 instead of inventing AST sites. Two vocabularies are interpreted twice today:

| Vocabulary | Predicate switch | Second switch over the same vocabulary |
|---|---|---|
| `SuccessCondition` (8 arms) | `apps/server/src/pack-orchestrator.ts:393-459` | evidence-ref derivation, `pack-orchestrator.ts:462-520` |
| `SimpleTrigger` (6 arms) | `pack-orchestrator.ts:196-231` | `compiledOpeningTrigger`, `pack-orchestrator.ts:306-357` |

A capability that compiles in the predicate switch and not the evidence-ref switch produces a
verdict with no attribution, silently. Criterion 6 asserts site completeness against a registered
census, so a new interpretation site cannot be added without either declaring it or failing.

**Both vocabularies in this table are registered capabilities**, which the returned draft did not
guarantee: `SimpleTrigger` appeared here — with criterion 6 asserting **both** of its sites — while
appearing in no census list, so the draft required site-completeness for a capability it never
declared. §3.1's rule 1 enumerates it (6 arms) and rule 2 enumerates its two sites, so the assertion
now has a row to assert against.

#### §2.6 Resolved-through artifacts are inside the requirement

`plan_signature` is **never evaluated** — `packages/runtime/src/structure.ts:567` throws — and is
expanded from the shape registry at `pack-orchestrator.ts:78-105`. So a pack's meaning depends on
`content/shapes/*.json` bytes it never references by digest, and a shape edit re-decides every
dependent pack with nothing noticing. `named_structure`'s four inline ids (`carlsbad`, `iqp-white`,
`iqp-black`, `maroczy-bind`, `structure.ts:368-393`) are the same class.

**Rule:** a pack's derived requirement set closes over the shape entries and principle entries it
resolves through. Each resolved entry is a generated capability (`shape.<id>` or `principle.<id>`)
whose capability version is the entry's `{kind:"semver", value:entry.version}` arm and whose
semantics digest contains the entry's canonical content digest.

Content bytes are not the closure. `resolvedCapabilityDependencies(entry)` walks every typed
semantic expression in the validated entry—the shape trigger, plan trigger/success signature,
principle applicability/counter-case expressions and nested shape/principle references—and maps
each discriminant/value through the same generated `CAPABILITY_APPLICABILITY` authority as a pack.
It then closes transitively through referenced entries and evaluator dependencies. Unknown semantic
nodes, a reference cycle or an expression with no applicability row fail generation. The generated
resolved declaration stores that exact dependency list, so `shape.maroczy-bind` depends on
`structuralFeature.outpost`, which depends on `structuralFeature.pawn_safe_square`; a helper-only
D566 change therefore invalidates the resolved shape even when the pack reaches outpost only through
that reference.

Editing bytes without moving the entry version fails `capability-check`; moving the version changes
the pack's derived requirement. Editing a depended-on evaluator changes the closed digest and
requires the evaluator version transition first. This preserves the ruled `{id, version}` pack
grammar rather than hiding a third field in one requirement family. This is G24's remedy and it is
the only part of the contract that reaches outside pack bytes.

#### §2.7 Applicability is a literal graph

`CAPABILITY_APPLICABILITY` is the single checked mapping from authored/default pack state to direct
capabilities. It is versioned and included in the registry digest; neither the planner nor the pack
loader may reproduce it.

```ts
type PackSelector =
  | { readonly kind: "always" }
  | { readonly kind: "schema_member"; readonly sourceIdentity: SchemaMemberIdentity }
  | { readonly kind: "literal"; readonly pointer: string; readonly equals: string | number | boolean }
  | { readonly kind: "absent"; readonly pointer: string }
  | { readonly kind: "resolved"; readonly pointer: string; readonly registry: "shape" | "principle" };

interface CapabilityApplicability {
  readonly selector: PackSelector;
  readonly capability: CapabilityId;
}
```

`SchemaMemberIdentity` is the canonical `{schemaPointer, member}` object from §3.1. A
`schema_member` selector is evaluated by walking the finite parsed pack and the resolved drill-pack
schema together: resolve local `$ref`; descend into the instance through the matching object,
array and selected `oneOf` branch; and emit the mapped capability whenever the visited schema node
has the exact `schemaPointer` and the instance scalar equals `member`. A repeated `$ref` therefore
matches at every instance site, and recursive `structuralExpression` / `transitionExpression`
values match at any authored depth without an unbounded pointer grammar. The walker tracks the
finite **instance path**, not visited schema identities, so revisiting a recursive `$ref` at a new
instance child is required. `literal` is retained only for star-free, non-vocabulary defaults;
closed schema vocabulary rows may not use it. This closes [[D2055]].

The complete **author authority** is
`rfc/contracts/pack-capability-applicability-v1.json` (SHA-256
`acad66f3f236ed8d7f6f5995567a7797477229873d8ff17a983ddccf6d5d1320`). It freezes the legacy and
target schema digests, target-transition artifact, traversal and public-id algorithms, the literal
target source inventory, exact coverage counts, the expanded mapping digest, all module-qualified
unconditional and constant sites, every resolved-reference selector, the seven interpreter-root
families, the lockfile-resolved external sources and the metadata exclusions. The
implementation-generated image
is `packages/schema/src/capability/applicability.generated.ts`; it must expand to the authority's
digests rather than becoming its own authority. The author artifact defines **exactly three independently enumerable sets**:

1. every closed member in the sidecar's source inventory emits a `schema_member` selector and the
   structured capability carried by its stable member row;
2. `PACK_ALWAYS_CAPABILITIES` is a literal table of the unconditional evaluators/defaults from the
   13 named evaluator roots plus `guard.defaults`; every member names its AST source; and
3. the five literal shape/principle reference sites in the artifact emit one `resolved` selector.

At author HEAD the cumulative sealed 0.30 schema has **106 enum nodes / 321 enum members** plus
**16 discriminated `oneOf` nodes / 76 branch members**: 397 mapped closed-vocabulary members and 0
exclusions. The increase from the legacy 373 is the 24-member semantic surface contributed by the
accepted 0.28/0.29 graduation and provenance lanes; using the legacy inventory here is itself a
lane-leap defect. The
canonical source inventory digest is
`f645ee0e677a9fa3aa340b0ba4f76d7a4d66eb997255c711116bcae6fbf14257`; applying
the stable v2 expansion yields 397 collision-free public mappings with digest
`a4b424ee765f4ae556f399895f90de5a5d469722214d753c2ac53fc4d8fd86a7`; joining those rows to the 14
always rows and five resolved-reference rows yields expanded-authority digest
`88f34288f4098ed8a28cf5d3f4c0562fba45a48d52fdf7994879c004ca078c65`.

`closed-schema-members-v1` walks object keys in lexical order and records every scalar member of an
`enum`. It also records a discriminated `oneOf` when every branch has exactly one direct property
whose schema carries `const` and that property name is common to all branches; its source pointer is
the `oneOf` owner and each `const` is a member. Rows sort by JCS of `{schemaPointer,member}`.
`stable-schema-member-v2` derives an identity from the semantic owner, discriminator and member,
never from container position. The owner is the nearest root property or terminal `$defs` key. A
`oneOf` branch contributes its unique discriminator property plus `const` value; its numeric array
index contributes nothing. When sibling branches intentionally share that discriminator (the two
`structuralExpression.kind="quantified"` forms), the branch's closed structural discriminator is
added—`over.files` versus `over.squares`—and absence or ambiguity fails rather than falling back to
an ordinal. Remaining property tokens and the exact scalar member are encoded with
the compatibility grammar and joined at integer version 1. Moving an owner deeper under `$defs`,
reordering branches or moving the schema file preserves identity; renaming the owner,
discriminator or member is a semantic rename and must use §5's successor path. Collision is a hard
`CAPABILITY_IDENTITY_COLLISION`, never a suffix chosen by the implementer. These exact algorithms,
The artifact now publishes all 397 source identities literally. The deterministic
`tools/d2152-pack-capability-author-repair/contract.mjs` generator maps each through the algorithm
above, proves collision freedom, recomputes both digests, and compares the checked-in bytes without
writing under `make pack-capability-author-repair`. Thus the authority is neither 397 hand-written
decisions nor an opaque count: every input row is reviewable, and the mapping has no implementer
choice left open.

`make capability-applicability` regenerates bytes; `make capability-applicability-check` compares
without writing. The sidecar authority replaces the earlier proposed schema keywords: the target
schema contains only validation grammar, while this reviewed artifact owns capability mappings,
meaning roots and exclusions. Every closed schema member, default-bearing absent field and resolved
reference is therefore mapped or explicitly excluded. A schema member, interpreter root,
always-root or reference added without changing the independent author artifact fails; a generated
row with no independent source fails `CAPABILITY_APPLICABILITY_ORPHAN`. The ordered generated image
participates in the registry digest, so selector drift cannot hide behind stable declarations.

Capability metadata is outside the stamped population by exact authority. The target-transition
artifact excludes `/properties/requires`, `/$defs/capabilityRequirement` and
`/$defs/capabilityVersion`; the instance walker skips `/requires` before selector evaluation. No
member of a requirement tuple can emit a capability. Removing or widening any exclusion changes
both author-artifact digests and fails the post-image contract.

Pointers use RFC 6901 with `*` as the only extension, matching exactly one array/object segment per
star. A literal selector matches the scalar at every expanded pointer; an absent selector is legal
only at a star-free pointer and matches when that property is omitted; `always` owns unconditional
state-machine/default semantics; `resolved` emits the generated content capability described in
§2.6. Duplicate selectors are legal only when they select different capabilities.

Requirement derivation is one algorithm: evaluate every selector against the parsed pack, add its
direct capability, expand `dependsOn` transitively, reject a missing dependency or cycle, resolve
shape/principle references (including §2.6's embedded semantic dependencies), then canonicalize the
unique `{id, version}` set under §4.1. The authored `requires` array must byte-equal that canonical
result after parsing; set equality alone is insufficient. The minimum executable fixture includes:

- `/objective/successConditions/*/feature/kind == "outpost"` →
  `structuralFeature.outpost`, whose dependency is `structuralFeature.pawn_safe_square`;
- absent `/guard` → `guard.defaults`;
- `always` → `objective.state_machine`;
- a shape reference → the exact generated `shape.<id>` capability.

Removing the helper dependency under-stamps and fails; adding `isolated_pawn` to the example
over-stamps and fails. That pair is the non-vacuous criterion-3 control required by [[D1620]].

### §3. The capability enumeration

`CAPABILITY_DECLARATIONS` (`packages/runtime/src/capability/registry.ts`, new) is a closed array.
**Unit: one declaration per `(capability subject, version)`.** `CAPABILITY_HISTORIES` groups those
declarations by subject, retains obsolete versions, and names exactly one current version. Total at
landing is the census below, asserted by criterion 4; historical rows are additional checked
members, never replacements hidden from the census.

#### §3.1 The census is derived from checked roots, never inferred from syntax alone

The census has four independently checked authorities. A declaration is not one of them; it must
set-equal their union.

1. **Pack schema vocabularies.** The independently reviewed applicability artifact maps every
   scalar member of every `enum` and discriminated `oneOf` beneath the semantic pack schema. The
   author sidecar stores the source-inventory and expanded-mapping digests rather than placing
   capability metadata inside the schema it stamps. `member` is the exact JSON scalar;
   `sourceIdentity` is the stable semantic-owner/discriminator/member identity from §2.7. Mapping
   and exclusion sets are disjoint and their union set-equals the source inventory. A missing
   member, duplicate, wrong identity, non-member scalar or unknown artifact field fails before
   declarations are compared. At the cumulative sealed 0.30 authority all 397 semantic members are
   mapped and none excluded; the three target metadata subtrees are excluded before enumeration,
   not counted as semantic members.
2. **Interpreter sites.** The implementation owns a literal `PACK_INTERPRETER_ROOTS` list of the
   pack-evaluation modules named by §3a-bis of `planning/platform-alignment/f3-derivation.md`.
   Every exhaustive arm in those roots carries `@tabiya-capability-interpreter <sourceIdentity>`.
   An annotated identity absent from the schema/named roots is an orphan; a schema identity with no
   interpreter is either a typed `refused` declaration or a census failure.
3. **Named evaluators and tables.** These are literal normative rows below, not a count copied from
   planning. Each row declares its exact AST sites.
4. **F1 projections.** Core projections are generated through §2.3's literal `f1_projection`
   bridge. The capability id/version is the projection id/version; the source image is derived from
   the complete manifest declaration and compiled execution paths, and semantic/derivation inputs
   become typed capability dependencies. Pack requirements may select only projections bound to
   `authoring.predicate`, `runtime.objective_condition`, or `runtime.guard_condition`; the rest
   remain capabilities but cannot appear in a pack stamp.

Schema `sourceIdentity` is canonical JCS over `{schemaPointer, member}`. Capability ids are a
separate stable public name mapped one-to-one from that identity. Therefore swapping two public ids
without swapping their source identities fails with `CAPABILITY_IDENTITY_MISMATCH`, even when the
cardinality is unchanged. The census separately diagnoses `SCHEMA_CAPABILITY_UNANNOTATED`,
`CAPABILITY_INTERPRETER_ORPHAN`, `CAPABILITY_NAMED_ROOT_MISSING`,
`CAPABILITY_DECLARATION_EXTRA`, and `CAPABILITY_IDENTITY_MISMATCH`.

All pack-schema readers still import `packages/schema/src/ajv.ts`, which exports one
`createStrictAjv2020(options?)` factory with
`strict:true`; F3 registers no custom schema keywords. A capability key in the schema is therefore
an unknown-keyword error. The applicability sidecar has its own JSON schema and closed parser, and
the compiler joins it to the pack schema by stable source identity. This keeps schema validation
strict while preventing implementation metadata from changing the post-image or entering its own
applicability population.

**Literal named evaluator roots (13):**

| capability id | evaluator/site authority |
|---|---|
| `grade.move_quality` | `moveQualityGrade`, `classFromThresholds` |
| `objective.state_machine` | `evaluateObjective`, `transitionObjective` |
| `objective.transition_legality` | `assertObjectiveTransition`, `OBJECTIVE_TRANSITION_TABLE` |
| `outcome.terminal` | `terminalOutcome` |
| `tempo.window` | `evaluateWindow` |
| `tempo.unauthored_default` | `UNAUTHORED_TEMPO_DEFAULTS` and its consumer |
| `line.membership` | `lineMembership` |
| `trajectory.verdict` | `trajectoryVerdict` |
| `branch.decidedness` | `branchDecidedness` |
| `guard.immediate` | `applyRulesGuard`, `applyRecordedEngineGuard` |
| `reasoning.key_point_match` | `matchKeyPoints` |
| `claim.earning` | `projectAuthoredFeedback` and `MACHINE_LABEL_EVIDENCE_KINDS` |
| `opponent.selection` | `OpponentSelector`, `neutralTiebreakKey` |

The author artifact module-qualifies every site. It records the current private
`packages/runtime/src/objective-state.ts#ALLOWED_TRANSITIONS` directly; AST identity does not
require an export and inventing `OBJECTIVE_TRANSITION_TABLE` would only create an unused alias.
Likewise private `classFromThresholds` and `evaluateWindow` are exact named declarations, while
`OpponentSelector` and `neutralTiebreakKey` remain their existing exported declarations. Every site
must resolve to exactly one declaration and every dependency must be reachable from a production
reader under `make capability-site-check`; an unused alias or prose range does not satisfy a row.

**Literal constant/convention roots (16):**

Every row below is backed by exact module-qualified sites in the author artifact. Existing named
constants are used directly. Where meaning is currently inline—guard defaults, deviation
tolerance, the practical-resistance four-candidate slice, and selection validation—the enclosing
named production function/class is the source rather than a fictional future constant. A later
extraction changes the source image and requires the normal version transition. `make
capability-site-check` requires one declaration and a production reader; creating an unused alias
does not satisfy the site.

| capability id | table/site authority |
|---|---|
| `grade.thresholds` | `packages/runtime/src/grade.ts#GRADE_CONVENTION` |
| `material.objective_values` | `MATERIAL_VALUES` |
| `exchange.piece_values` | `EXCHANGE_PIECE_VALUES` |
| `pressure_line.role_scale` | `BREADTH_CONVENTION_TEXT`, `pressureLines`, `harassmentPressureSequence` |
| `guard.material_trigger` | `applyRulesGuard` |
| `guard.defaults` | `baseGuardConditionSettings` |
| `tablebase.category_rank` | `CATEGORY_RANK` |
| `branch.category_rank` | `packages/runtime/src/branch-scale.ts#RANK` |
| `deviation.cost_tolerance` | `apps/server/src/sourcing/deviation-cost.ts#comparable` |
| `phase.bands` | `classifyPhase` plus its four exported threshold constants |
| `mate_proof.node_cap` | `MATE_PROOF_NODE_CAP` |
| `rating.glicko2` | `GLICKO2_CONSTANTS` |
| `rating.opponent_calibration` | `RATED_OPPONENT_CALIBRATION` |
| `opponent.neutral_tiebreak` | `neutralTiebreakKey` |
| `opponent.practical_slice` | `OpponentSelector` (the private practical-resistance method is inside the class source image) |
| `selection.semantic_policy` | `compileEvidenceManifest` |

The following historical arithmetic is retained only as derivation history and landing-tripwire
input. It is not the normative enumeration procedure.

#### §3.1a Historical derivation and baseline

**This section was returned by cross-review and is rewritten.** The drafted census was a hand-count
that both **omitted** and **double-counted**, and asserting its integer made criterion 4 satisfiable
*only by a wrong implementation* — the [[D984]] class this RFC's own criteria preamble names. The
repair is not a corrected integer. **It is a procedure**, because a list plus a self-consistency
assertion is not a closure argument.

**`make capability-census` enumerates capability subjects mechanically**, from four roots, and
`CAPABILITY_DECLARATIONS` must set-equal its output:

| # | Root | Rule | Mechanically enumerable from |
|---|---|---|---|
| 1 | **Closed vocabularies** | every closed union or enum a pack can author, **including nested value vocabularies**, each a distinct subject | the schema's **52 `$defs`** (`schemas/drill_pack.schema.json`) joined to `packages/schema/src/drill-pack/types.ts` |
| 2 | **Exhaustive switches** | every `switch` whose default asserts `never` interprets a vocabulary; each is a *site*, and a vocabulary with no declaration is a census failure | the tree's `never` exhaustiveness checks |
| 3 | **Named evaluators without a vocabulary** | verdict producers, prose conventions, constant tables — meaning that is not a union | §3e (13), the two convention tables (13), §3f (16) |
| 4 | **Manifest projections** | absorbed **by reference**; they already carry `{id, version}` | `make evidence-manifest-check` (**193** core at the 2026-08-28 amendment) |

**The unit, stated because the drafted census mixed two of them silently:** one declaration per
**capability subject**, where a nested value vocabulary is its own subject. `successCondition`'s
`rules_fact` arm and the `rules_fact` value vocabulary (`checkmate`/`stalemate`/`draw`) are **two**
subjects, not one double-count — the arm decides *which evaluator runs*, the value vocabulary decides
*what it concludes*, and either can change meaning without the other. The same holds for
`SimpleTrigger`'s `fenPredicate` arm and the `fenPredicate` variant vocabulary. The drafted table
counted the nested vocabularies while omitting their parent unions, which is what made it incoherent
rather than merely wrong.

**Two parent unions the drafted census omitted entirely**, both now enumerated by rule 1:

| Vocabulary | Arms | Type | Why the omission mattered |
|---|---|---|---|
| `SimpleTrigger` | **6** | `types.ts:85-91` | **§2.5 asserts site-completeness for it** — the draft required both its interpretation sites while never declaring the capability, so criterion 6 asserted a row criterion 4 forbade |
| `TransitionExpression` | **5** nodes | `types.ts:445-450` | its two sites are in the derivation's §3a-bis; the arm list never carried it |

**Baseline at HEAD, baked as a tripwire — not as the definition.** Following §7's population idiom
and the two shipped refusal-on-drift assertions, the procedure's output count is asserted so drift
reddens CI, and the baseline is **re-derived by running the procedure at implementation**, never
hand-summed:

| Group | HEAD | Correction from the returned draft |
|---|---|---|
| Primary unions (§3a) | **90** | was 89 — the 14 rows sum to 90 (4+12+8+18+8+6+4+4+6+7+3+4+3+3) |
| Further vocabularies (§3a-ter) | **62** | was 60 — the 16 rows sum to 62 (14+4+3+2+5+5+4+4+3+3+3+3+3+3+2+1); the derivation's prose also says "15 more vocabularies" against its own heading's 16 |
| Parent unions omitted | **+11** | `SimpleTrigger` 6 + `TransitionExpression` 5 |
| Verdict producers (§3e) | **13** | unchanged — verified |
| Prose conventions | **13** | was 12 — `BREADTH_CONVENTION_TEXT` is **8** entries at HEAD (`evidence-catalog.ts:182-196`), not 7, plus `SEMANTIC_CONVENTION_TEXT` 5 |
| Constant tables (§3f) | **16** | was 17 — §3f has 16 rows |
| `claim.binding` (§4.4) | **+1** | required by §4.4 and absent from the drafted census; see below |
| **Primary total** | **206** | was "191" |
| Core-manifest projections | **193** | by reference; re-derived 2026-08-28 |

**`claim.binding` is a registered `contract_identity` capability** whose exact AST source is the
new exported `CLAIM_BINDING_CAPABILITY_ID` constant in the generic capability registry. It imports
no sidecar parser or consumer behaviour. Registering it does not "break the count"
because **no hand-count is asserted any more** — this is the third blocker the procedure dissolves
rather than patches.

The core manifest's **193** projections at the 2026-08-28 amendment already carry `{id, version}`
records and are absorbed by reference:
§2.1's parse rule adopts them without rewriting them, and criterion 5 removes the literal that pins
them.

The executable amendment baseline is `37/193/25/210 core` and `67/67/15/1 semantic`, produced by
`make evidence-manifest-check` on 2026-08-28. These are separate producer/projection/consumer/binding
and event/projection/consumer/provider counts; none is the subject-census size or pack-requirement
scope. The implementation records the command output as one tripwire artifact rather than copying
the totals into another register.

**Scope decision, stated rather than assumed.** Three of the manifest's 25 consumers decide pack
meaning at runtime — `authoring.predicate` (`evidence-catalog.ts:860`),
`runtime.objective_condition` (`:861`), `runtime.guard_condition` (`:862`). A pack's *required* set
is computed over those three consumers only; the other 185 projections are declared capabilities
but are never pack requirements, because no pack can depend on them. Criterion 7 asserts that
separation both ways.

### §4. The pack-side declaration and the handshake

#### §4.1 What a pack declares (lane 0.30)

```jsonc
// 0.30 pack root, required key
"requires": [
  { "id": "objective.state_machine",   "version": { "kind": "integer", "value": 1 } },
  { "id": "structuralFeature.outpost", "version": { "kind": "integer", "value": 1 } },
  { "id": "shape.maroczy-bind",         "version": { "kind": "semver",  "value": "0.1.3" } }
]
```

`$defs/capabilityRequirement` is a closed object of exactly `id` and `version`; `version` is a
closed discriminated union matching §2.1. The key is
**required** — a pack with no `requires` is invalid, not permissive. That is the whole reason
[[D1058]] chose the pack over a sidecar: absence must be a refusal, and every sidecar mechanism in
the tree is permissive on absence (`apps/server/src/expression-census.ts:77` returns `undefined` on
a schema mismatch, so a `.v2` ledger reads as *absent* rather than *refused*).

The array is canonical artifact data, not merely a mathematical set. Duplicate `capabilityKey`
tuples fail `PACK_CAPABILITY_DUPLICATE`. Order is bytewise ascending NFC `id`; equal ids order
integer versions before semver, integers numerically, and semver by its three numeric components.
`canonicalCapabilityRequirements` rejects non-canonical input order at parse/validation boundaries;
all writers call the same function before `digestDrillPack`. The JSON schema sets
`uniqueItems:true` as a cheap structural guard, while the semantic validator owns tuple identity
and ordering. A reordered or duplicate equivalent set is invalid rather than allowed to change a
pack digest. Planner output and authored `requires` compare canonical arrays byte-for-byte.

#### §4.1a The cumulative 0.27→0.28→0.29→0.30 transition is a closed compatibility reader

The D560 hold makes a same-commit 92-pack rewrite illegal today; making `requires` optional would
make absence permissive forever. The transition therefore has two real schemas and no heuristic
legacy mode:

- `urn:chess-tabiya:schema:drill-pack:0.30` requires `requires` and is the only schema accepted for
  newly authored, uploaded, Studio-written or API-submitted packs;
- the 0.27 reader accepts an unstamped document **only** when its repository-relative path and raw
  SHA-256 are members of the author-sealed 92-document legacy catalogue population; and
- an unstamped document outside that exact allowlist fails `PACK_CAPABILITY_STAMP_REQUIRED`. A
  changed legacy byte fails `PACK_LEGACY_IMAGE_MISMATCH`; neither condition falls back to generic
  0.27 validation.

`rfc/contracts/pack-capability-schema-transition-v1.json` (artifact v2; SHA-256
`dc5df2689f1a27cce83096d294f9134088420ec6dad0b18392e7f1da2cb5ab75`) seals the legacy schema,
the sorted path+raw-digest population (`92`, digest
`933eeecd0aee6e50b2a595b62bfc22485ba8a4d2dc945a5b4efdd9cf35fca849`), and three ordered
owner-qualified stages. The exact post-images are: 0.28 = 84,113 canonical bytes / SHA-256
`c4132e4c9268a964d229323e0b6ec8dfc8723b976bd272f0b56dbe5003fcfafe`; 0.29 = 85,581 bytes /
`55c0095dfe381cfd5750cd4c6bdb71d2f80337f6c22616419cba798a3368a605`; and 0.30 = 87,000 bytes /
`f7818f5ea08dd6c63efb422508174baa07868e3e11cd91a60891f151df0f25db`. Each stage's source digest
is the prior stage's target digest. Implementation applies the stages in order and verifies every
post-image; it cannot skip, regenerate or amend predecessor authority. The final target contains
typed graduation clearance, `corpusEvidence`, the widened timing note, `provenance_note`,
`citable_text`, and required capability declarations.

The compatibility arm is repository-catalogue-only. The server never accepts a caller-supplied
path as proof of legacy membership. `PackRegistry` supplies an internal catalogue identity after
reading the sealed file, and every other entry point selects 0.30. The migration applier replaces
all 92 files and dependent digests atomically after the D560 budget decision. The same commit then
deletes the 0.27 reader and allowlist; adding a 93rd legacy digest is forbidden. This is a bounded
transition, not a second permanent format.

**The 0.30 stamp is inside `digestDrillPack`.** `packages/schema/src/drill-pack/digest.ts:69` digests
every byte with no field filter, so a requirement cannot drift from the content it describes. The
cost, accepted knowingly by [[D1058]]: **all 92 packs churn their digest** when the held migration
is applied and every ledger `packDigest` must be re-stamped (§6 plans it). The software transition
lands first without changing those legacy bytes.

**The Gate F cost, stated plainly.** Clause 1 requires that *no active RFC holds a drill-pack schema
lane*. Lane 0.28 is held by accepted `graduation-clearance`, 0.29 by draft
`pack-population-provenance`, and this RFC takes 0.30 — **clause 1 goes from two-deep to three, and
the content hold's lift is delayed by that much.** The owner ruled for binding integrity over
speed; this paragraph exists so no later reader mistakes it for an oversight.

#### §4.2 What the runtime publishes

`GET /capabilities` gains `packCapabilities`. **It publishes the SUPPORTED projection, not the
whole registry** — `{id, version, disposition}` for every declaration whose capability this
deployment actually carries.

**The rule, normative:** `packCapabilities` publishes configured declarations whose semantic
disposition is `active` or `deprecated`. Each row includes its current deployment reachability:
`supported` or, for a configured provider only, `temporarily_unavailable`. A capability that is
not configured is `unsupported` for this deployment and is absent. A semantic `refused`,
`withdrawn`, `unmeasured` or `impossible` declaration is also absent. The current format register
maps **7 reached / 3 refused / 1 retired / 1 unmeasured** into that semantic axis; those values are
not deployment states.

At registration, `runtimeSupported` means the configured active/deprecated identity set; transient
provider health does not remove an identity from it. At operation time, the same published row's
reachability determines whether execution proceeds or returns the typed retryable failure in
§5.1. Publishing the whole semantic registry remains the named wrong implementation because it
makes an unconfigured/refused capability appear satisfiable.

`FORMAT_DISPOSITIONS`' own comment (`packages/schema/src/drill-pack/dispositions.ts:21`) says it is
*"deliberately not part of the deployment capabilities payload"* — which is exactly why no pack can
be checked against it today. This publication is the fix, but the rows do not acquire one false
subject kind. `/opponentPolicy/mode` values are `vocabulary_arm`; `/retryVariants` is a
`vocabulary_arm`; `/legs/*/opponentPolicy` and `/legs/*/shapes` are resolved-reference/evaluator
capabilities; `assistance:arrows` is an assistance-surface capability; and
`error:SIMULATE_BUDGET_EXCEEDED` is a retired error-contract capability. A literal mapping table in
the registry covers all 12 rows and criterion 8 rejects the shortcut that labels every row
`vocabulary_arm`.

#### §4.3 The handshake

Modelled on `assertOpponentModeDispositions` (`dispositions.ts:104-122`) — the one place the repo
already refuses a declared-but-unexecutable capability correctly, generalised to the derived
pack-requirement projection rather than to a hand-copied registry cardinality.
Its four invariants become module-load `TypeError`s here too:

| Invariant | Error code |
|---|---|
| every declared capability has **exactly one** registry row | `CAPABILITY_DECLARATION_MISSING` |
| semantic disposition `active` **iff** the capability is executable | `CAPABILITY_DISPOSITION_INVALID` |
| an `active` row names at least one subject-appropriate meaning `source` | `CAPABILITY_SOURCE_MISSING` |
| no registry row describes an undeclared capability | `CAPABILITY_UNDECLARED` |

At registration, `PackRegistry` computes `unmet = pack.requires \ runtimeSupported` and, when
non-empty, refuses with `PACK_CAPABILITY_UNSUPPORTED` carrying the exact unmet set. Codex mapped
`PACK_INVALID` to 422 at `apps/server/src/rest.ts:662` (closing [[D1002]]); the new code joins the
same 422 arm — it is a client error and must not present as 5xx, because 5xx-keyed retry logic
retries a request that can never succeed.

**What refusal *does* is RULED — see §5.1** ([[D1077]]). The question was reframed: the three
candidates this RFC first offered (boot failure, listing exclusion, per-request 4xx) all described
*what we do to the pack* and skipped *why the capability is missing*, which is what decides it.
`unmet` therefore resolves into two states by cause — `unsupported` (not configured at startup;
refused here, at registration, with the pack excluded from the listing and the boot surviving, per
[[D468]]'s blast radius) and `temporarily_unavailable` (configured but unreachable; **not** resolved
at registration, because it may reappear). `planning/archive/drill-client/log.md:49`'s
*"refuse-to-serve, not degrade"* holds for the first and is wrong for the second. **Gate F clause 5
is unblocked.** (Source corrected from `docs/drill-client.md:16` by cross-review 2026-08-23 — that
file contains no such string; the derivation's `f3-derivation.md:578` carries the same miscite.)

#### §4.4 Compile-time handoff to the later evidence-sidecar consumer

**Normative dependency boundary.** F3 exports only the generic structured `CapabilityId` algebra,
registers the identity `claim.binding`, and proves that the identity round-trips through the generic
registry. It makes **zero** changes to the evidence-sidecar schema, parser, binding-object grammar,
stage dispatch, migration or refusal codes. In particular, F3 does not add a `contract` key and does
not import production code, fixtures or behaviour from the draft `claim-semantic-anchors` RFC.
That consumer RFC follows accepted F3 and owns all such behaviour. This direction breaks the
returned dependency cycle: F3 supplies a compile-time primitive; the later consumer adopts it.

The remainder of this section records the returned design shape only as **non-normative derivation
history**. It is retained to stop the rejected root-level declaration and duplicate error-code
forms from being proposed again; none of it is an F3 implementation criterion.

**Historical reason this seam was examined.** `rfc/claim-semantic-anchors.md` §7 defers its compatibility story
here: *"F3 must supply the accepted compatibility declaration that distinguishes the old and new
binding semantics while the top-level evidence sidecar remains `tabiya.sourcing.evidence.v1`, or
require a top-level move. This RFC does not choose a competing syntax."* The declaration it needs
was **absent from this RFC's derived scope** (`f3-derivation.md:798-815` lists six in-scope items,
none of them a sidecar declaration, and never mentions `claim-semantic-anchors`). Absorbing it here
is correct rather than expansionist: this RFC's subject is *how an artifact declares which evaluator
semantics its content requires*, and a sidecar's records are evaluated by claim-binding semantics —
the same class of evaluator-versioned meaning §2.2 defines. Splitting that grammar across two
documents would manufacture a second spelling, which is the exact defect §2.1 exists to kill.

**The declaration is a `contract` key on each BINDING OBJECT — the consumer's own grammar, adopted
rather than paralleled.** The returned draft put a `requires` array at the *sidecar root* and
asserted it matched `claim-semantic-anchors` §7 *"byte-for-byte"*. **That claim was false and the
cross-review disproved it at source.** §7 dispatches per binding object:

```jsonc
// evidence sidecar — schema string UNCHANGED at the root
"schema": "tabiya.sourcing.evidence.v1",
"claimBindings": [
  { "claimId": "...", "pointer": "...", "spans": [], "textSha256": "...",
    "contract": { "id": "claim.binding", "version": 2 } }
]
```

**Why the root-level form was not merely different but unusable.** §7's Stage A *"continues"* the one
committed legacy binding (`philidor-third-rank-hold.evidence.json`) **through its existing path
inside a file the V2 parser also reads**. A per-document declaration cannot express that: the
document is v1 or v2, so Stage A's mixed state is unrepresentable and §7's two-stage migration
collapses into one. Three further divergences the draft's table hid:

| | `claim-semantic-anchors` §7 (the consumer, authoritative) | the returned draft's §4.4 |
|---|---|---|
| granularity | **per binding object** | per document (sidecar root) |
| refusal code | `CLAIM_BINDING_VERSION_UNSUPPORTED` | `SIDECAR_CAPABILITY_UNSUPPORTED` (a second code for one seam) |
| explicit `claim.binding@1` | **refused in both stages** — *"any `contract` whose id or version is not exactly `claim.binding`/`2`"* | criterion 15 required it **recorded** |
| absence | legacy path in Stage A; refused after Stage B | *"reads as `claim.binding@1`"* |

**What F3 supplies, and what it does not.** F3 owns only the **generic grammar and vocabulary**:
`claim.binding` is a registered `CapabilityId` (§3.1). It does **not** own a sidecar field, dispatch,
stage timing or refusal code. The names below belong solely to the later consumer proposal and are
not imported into F3 production code.

**Absence is the consumer's rule, unmodified.** F3 states no default. §7's dispatch-by-presence
governs: no `contract` key → the legacy path during Stage A, `CLAIM_BINDING_VERSION_UNSUPPORTED`
after Stage B. The draft's *"explicit pinned default"* table is **struck** — it contradicted §7's
refusal of an explicit `claim.binding@1` and would have required the consumer to accept a version it
refuses in both stages. The 68 committed sidecars carrying no `contract` key therefore remain valid
through Stage A **by the consumer's rule**, not by a default this RFC invents.

**Why the §4.1 absence-is-refusal argument does not transfer, stated honestly.** A pack's `requires`
is required because absence-is-permissive is the failure mode [[D1058]] refused. A binding object's
`contract` is *not* required, because §7 makes absence **meaningful** (legacy) in Stage A and
**refused** after Stage B — presence-dispatch already supplies the refusal [[D1058]] wanted, at a
different point in time. The two artifacts differ in kind, and the honest statement is that F3
defers to the consumer here rather than that the rules coincide.

**No seventh register, and this resolves a conditional claims block elsewhere.** The sidecar is not
one of the six shared-resource registers, and `contract` is a key *inside* an artifact this RFC does
not otherwise version — so nothing here claims a lane beyond the pack-schema 0.30 already declared.
`claim-semantic-anchors`' claims block reads *"Refresh this block if F3's accepted contract makes
that seam a registered resource"* — **it does not**, so that block stays `none`. Stated here so the
refresh is a confirmation rather than an investigation.

**The sidecar stamp is inside the sidecar's own digest**, structurally parallel to §4.1's pack rule:
a requirement cannot drift from the records it describes. It is *not* inside `digestDrillPack` — a
pack and its sidecar are separate artifacts with separate digests, and conflating them would make a
records-only edit churn the pack digest.

### §5. Lifecycle: successor, evidence, decision or lawful refusal

```ts
export type SemanticDisposition =
  | { readonly kind: "active" }
  | { readonly kind: "deprecated"; readonly successor: CapabilityId; readonly reason: string }
  | { readonly kind: "withdrawn"; readonly reason: string; readonly removedAt: string;
      readonly successor: CapabilityId }
  | { readonly kind: "withdrawn"; readonly reason: string; readonly removedAt: string;
      readonly successor: null; readonly noSuccessor: WithdrawalRefusal }
  | { readonly kind: "refused"; readonly reason: string; readonly authority: RefusalAuthority }
  | { readonly kind: "refuted"; readonly reason: string; readonly evidenceRef: string }
  | { readonly kind: "unmeasured"; readonly experiment: string }
  | { readonly kind: "pending_decision"; readonly decisionRef: string }
  | { readonly kind: "unimplemented"; readonly implementationRef: string }
  | { readonly kind: "impossible"; readonly reason: string };

export type RefusalAuthority =
  | { readonly kind: "owner_ruling"; readonly ledgerRow: string }
  | { readonly kind: "protected_intent"; readonly document: string; readonly anchor: string }
  | { readonly kind: "accepted_rfc"; readonly document: string; readonly criterion: string };

export type WithdrawalRefusal =
  | { readonly kind: "no_migration_exists"; readonly reason: string }
  | { readonly kind: "replacement_refused"; readonly authority: RefusalAuthority };

export type DeploymentReachability =
  | { readonly kind: "supported" }
  | { readonly kind: "unsupported" }
  | { readonly kind: "temporarily_unavailable"; readonly providerId: string; readonly retryAfterMs?: number };

export interface CapabilityDeploymentBinding {
  readonly capability: CapabilityId;
  readonly availability: "local" | "recorded" | "provider" | "build_time";
  readonly configured: boolean;
  readonly providerId?: string;
}

export interface CapabilityHistory {
  readonly subjectId: string;
  readonly declarations: readonly CapabilityDeclaration[]; // one per exact version
  readonly current: CapabilityId;
}
```

`CapabilityDeclaration` identity is `(subjectId, version)`, not subject alone. Histories retain
deprecated and withdrawn declarations so an old pack requirement resolves as known-obsolete rather
than unknown. Exactly one declaration equals `current`; it must be `active`. Every deprecated row
has one successor in the same history. A withdrawn row has exactly one of two compile-time shapes:
a typed successor, or `successor:null` plus a typed `noSuccessor` refusal. Bare omission is
unrepresentable. Successor edges from both deprecated and withdrawn rows are acyclic, strictly
advance within the same subject and version arm, and following them terminates at `current`.
`migrationPlanForRequirement` follows either kind of edge; a no-successor row becomes typed
judgement/refusal debt rather than disappearing. Mixed integer/semver histories are forbidden for
one subject. The registry crosses 1→2, 1→2→3, withdrawal with successor, lawful withdrawal without
successor, missing refusal, duplicate current, cross-subject successor and cycle fixtures.

The projection from non-refused shipped vocabulary is total and checked:

| shipped disposition | semantic disposition |
|---|---|
| `reached` | `active` |
| `retired` | `withdrawn` |
| `unmeasured` | `unmeasured` |
| `impossible` | `impossible` |

Legacy `refused` is deliberately **not** a semantic mapping rule. It is a provisional source label
whose meaning is recovered by exact row identity through `LEGACY_REFUSED_MIGRATION`; an unknown
legacy refusal fails `CAPABILITY_REFUSAL_MIGRATION_MISSING`. This prevents an absent implementation,
unanswered decision or negative measurement from being laundered into product intent.

`unsupported` and `temporarily_unavailable` are never semantic dispositions. The first is derived
from `configured: false`; the second is computed only for a configured `provider` binding whose
health probe/request failed. A local, recorded or build-time binding entering the transient state is
a module-load error.

Three things this fixes.

**`successor` becomes typed and historical.** `FormatDisposition.successor` is `string | null`
today (`dispositions.ts:14`) with nothing saying what it points at. Here it is a `CapabilityId`;
criterion 9 asserts every `deprecated` successor resolves to the next retained declaration and
that the chain terminates at the one active current declaration.

**A refusal costs at least as much as an unmeasured row.** The shipped
`assertAdvertisedCapabilityDispositions` demands an `experiment` for every `unmeasured` disposition
and **nothing at all** for a `refused` one — so filing an open question as a refusal is the cheapest
way to make it stop costing anything, which is literally what happened to the famous-game licence
question ([[D1045]]). Here `refused` requires either a resolving owner-ruling row or an exact anchor
in protected intent. Research findings use `refuted`; work that has not shipped uses
`unimplemented`; unanswered product choices use `pending_decision`. Criterion 10 checks the
authority and the total migration below. This RFC does not repeat the asymmetry it inherited.

**The three prose-only deprecations get typed successors**: `pawn_count`,
`piece_reach_count scope:"every"` (removal deferred because `registered_shapes` rows are
immutable), and `plan_consequence` → `structural_feature` with `plan_signature`. `retryVariants`
(5 kinds, carried by 7 packs) is not flattened: its catalogue arm is `deprecated` in favour of
`variantOf`, while its scheduler arm is `active` under [[D1327]].

#### §5a Total migration of the 20 legacy refused rows

This table is normative input to `LEGACY_REFUSED_MIGRATION`. It reviews every refused row present in
`CAPABILITY_DISPOSITIONS` (17) and `FORMAT_DISPOSITIONS` (3) at drafting HEAD. A source row may split
when one old label covered two meanings; no implementer chooses a state while translating it.

| legacy identity | semantic destination | existing authority |
|---|---|---|
| Stockfish `bestmove / MultiPV rank / bestline` | `unimplemented` | [[D1061]] approved the hint-distance move/PV axis; [[D318]] records the stale blanket refusal |
| Stockfish `MultiPV > 1 outside enumerate` | `pending_decision` | [[D1037]] refusal audit; no owner ruling exists |
| Stockfish `SyzygyPath / SyzygyProbeLimit / SyzygyProbeDepth / Syzygy50MoveRule` | `pending_decision` | [[D1037]]; hosted-vs-local deployment is not product intent |
| Stockfish `UCI_LimitStrength / UCI_Elo / Skill Level` | `refused` | protected intent `design/06-campaign.md` §2b, “weakened Stockfish is rejected doctrine” |
| Stockfish `nodestime / Ponder / go mate` | `pending_decision` | [[D1037]]; absence of a current question is not refusal authority |
| Stockfish `Debug Log File / NumaPolicy` | `pending_decision` | [[D1037]]; operator diagnostics are a deployment choice |
| Stockfish `Move Overhead` | `unmeasured` | [[D1049]] separates depicted/measured time from unsupported prediction |
| Stockfish `EvalFile / EvalFileSmall` | `pending_decision` | [[D1037]]; no owner ruling exists |
| Maia `band-conditioned resistance` | `refuted` | `design/research/maia-endgame-fidelity.md` §6 and `maia-band-outcome-transfer.md` §7 |
| Maia `Temperature 0` | `pending_decision` | [[D1037]]; the earlier “different product” statement has no owner authority |
| Glicko-2 `rating from authored, engine- or tablebase-adjudicated outcomes` | `refused` | accepted `rfc/learner-rating.md` R2/R12 |
| Glicko-2 `rating as an input to what is said about a move` | `refused` | accepted `rfc/learner-rating.md` R15/AC-11 |
| Glicko-2 `cross-learner comparison outside a joined cohort` | `active` | [[D437]] reversed the refusal and approved cohort standing |
| Syzygy `dtm` | `unmeasured` | [[D87]] tablebase-condition experiment family; partial publication is not refusal |
| Explorer `monthly history` | `refuted` | `design/research/explorer-source-contract-closure.md` §107 |
| Supervisor `stockfish-play identity` | `pending_decision` | [[D1037]]; client exposure has no owner ruling |
| Supervisor `EngineRequest.afterCommands` | `withdrawn` | request-scoped state is the shipped successor; source reason already records replacement |
| format `plan_defense` | `unimplemented` | `DECLARED_UNIMPLEMENTED_POLICY_MODES`; no selector exists |
| format `human_external` | `unimplemented` | `DECLARED_UNIMPLEMENTED_POLICY_MODES`; no selector exists |
| format `retryVariants` | split: catalogue `deprecated` → `variantOf`; scheduler `active` | [[D1327]] narrowly lifts the scheduler read and retains the catalogue successor |

The implementation resolves protected-intent anchors against an allow-listed immutable/living
intent inventory, ledger rows by exact id, evidence references by repository path plus anchor, and
implementation references by named symbol or ledger row. A dangling reference fails. Crucially,
the migration does not edit either legacy source table in place; it compiles their identities into
the new registry and leaves source cleanup to the separately checked migration plan.

#### §5.1 Unavailability has exactly two causes — RULED [[D1077]]

This RFC originally asked *what a refusal does* and offered three answers (boot failure, listing
exclusion, per-request 4xx). The owner refused the framing: all three describe **what we do to the
pack** and none names **why the capability is missing**, which is what should decide it. Verbatim:

> *"during runtime capas can get missing right... or reappear? like at least we should be flexible
> like that. so it would be a 'temporarily unavailable' if it's a runtime issue or outright
> unsupported if the server is started without the capa outright... other than that how can a capa
> ever be missing? the operator configures it or not."*

**Normative. A required capability is unmet in exactly one of two states, distinguished by cause:**

| State | Cause | Knowable | May reappear? | The pack is |
|---|---|---|---|---|
| **`unsupported`** | not configured at startup — the operator did not deploy it | at boot, statically | no, not without a restart | honestly unavailable **on this deployment**, and says so |
| **`temporarily_unavailable`** | configured, but currently unreachable — a provider is down, a sidecar process died | only at request time | **yes** — this is the flexibility the ruling asks for | retryable; the run is not destroyed |

**There is no third cause, and that completeness argument is the owner's own:** *"the operator
configures it or not."* A capability is deployed or it is not; if it is deployed it is reachable or
it is not. Any future proposal for a third state is therefore a proposal to change the deployment
model, and must say so.

**Reuse the shipped vocabulary — do not build parallel machinery.** `ProviderOffBehavior`
(`"available" | "honest_empty" | "unavailable"`) and `AvailabilityMode`
(`"local" | "recorded" | "provider" | "build_time"`) already exist at
`packages/runtime/src/evidence-contract.ts:9,11`, and the two ruled states map onto them rather than
beside them: a capability whose `AvailabilityMode` is `provider` is the only kind that can enter
`temporarily_unavailable` at all — `local` and `build_time` capabilities are either compiled in or
absent, so for them `unsupported` is the *only* reachable unmet state. That asymmetry falls out of
the shipped types and is asserted by criterion 16.

**The precedent to follow is [[D509]], not a new mechanism.** `/capabilities` once advertised
`perfect_tablebase` and `practical_resistance` while both returned **HTTP 503 for every position**,
because `ENGINE_MODE=mock` wired an empty fixture. It closed 2026-08-17 by making *an empty fixture
provider absence*, so both modes **disappear from `/capabilities`** rather than being advertised and
failing. That is exactly state (a): not configured means not advertised. §4.2's `packCapabilities`
publication inherits it — **an `unsupported` capability is absent from the published set, not
present-and-marked** — so `unmet = pack.requires \ runtimeSupported` (§4.3) already computes the
right thing with no new field.

**What each state does, now derivable rather than chosen:**

- **`unsupported`** is a *static deployment fact*, so it is knowable before any request and the
  honest response is at registration: `PACK_CAPABILITY_UNSUPPORTED` on the 422 arm (§4.3), the pack
  excluded from the served listing with the unmet set named in the startup report. It does **not**
  fail the boot — [[D468]] measured that blast radius (one invalid pack crashed the server) and the
  ruling's *"honestly unavailable on this deployment"* is a statement the deployment must survive
  making.
- **`temporarily_unavailable`** is *transient and may reappear*, so it must **not** be resolved at
  registration — a pack refused at boot for a provider that returns two minutes later would be
  wrongly unavailable for the process's lifetime. It is a per-request condition on the 503 arm,
  retryable, and the run survives it.

The operation boundary is shared and typed. Before an operation appends any run event or mutates
run state, `requireCapabilities(operationId, requiredIds)` reads the current deployment projection.
A transient miss returns HTTP 503 with
`{code:"PACK_CAPABILITY_TEMPORARILY_UNAVAILABLE", operationId, capabilities, retryable:true,
retryAfterMs?}`. It appends no event, advances no cursor/revision and preserves the idempotency key,
so retry after provider recovery continues the same run. Boot without a configured provider takes
the static 422/listing-exclusion path instead. Criteria cover boot absence, death after
registration, recovery in-process, and the impossible local/build-time transient.

**Gate F clause 5 — what it now needs, stated because it was blocked on this question.** Clause 5
(*"pack capabilities and deprecations have a compatibility policy"*) is **unblocked**: the policy is
§5's disposition union plus this section's two states. It is tickable when the disposition union,
the two-state resolution and criterion 16 land — no further ruling is owed.

### §6. The migration planner and its applier

Three commands, following the separation of powers `graduation-clearance.md:2457-2458` states
outright — *"a checker that also rewrites the thing it judges is the rubber stamp in a new
costume"*:

```
make migration-plan          # no FILE argument — walks the population itself, read-only
make migration-plan-check    # validates deterministic shape/content; wired into `make verify`
make migration-apply-ready   # refuses judgement debt; invoked only at the authorized apply gate
make migration-apply FILE=…  # the separately-invoked applier
```

The plan is `schema: "tabiya.capability.migration-plan.v1"`, `mode: "read_only"`, with:

| Section | Content |
|---|---|
| `hold` | the active ruling, what is allowed, what is forbidden |
| `population` | **exact document identities**, per root, plus the roots walked (§7) |
| `from` / `to` | source and target versions **per capability**, never one format number |
| `mechanical[]` | per-document deterministic edits |
| `judgement[]` | the exact population needing chess or provenance judgement, by document + pointer + question |
| `refusals[]` | documents the target runtime would refuse, with successor or reason |
| `digestConsequences[]` | which pack digests move and which ledgers need re-stamping |
| `assertion` | the baked population tripwire |

`migration-plan` and `migration-plan-check` succeed for empty, mechanical-only and
judgement-bearing plans when the plan is complete, canonical and internally valid. Ordinary CI
therefore reports judgement debt without treating its honest existence as malformed software.
`migration-apply-ready` is the stop gate: any `judgement[]` entry exits non-zero. The applier first
runs that exact readiness predicate and writes nothing on failure. O6.2's own sentence is that such
a plan *"never becomes an automatic content wave"*; criterion 11 crosses empty, mechanical and
judgement plans, distinct shape/readiness exit codes, and zero writes.

The first software landing emits all 92 frozen legacy documents as mechanical target rows but does
not apply them. The later D560-authorized invocation may apply only when `judgement[]` is empty and
the plan's source population still equals the sealed legacy image. A stale byte or added document
invalidates the plan before readiness is considered.

**This is what D996's per-release ruling reads.** The owner declined a standing budget in favour of
deciding per release, so the plan's job is to be *rulable*: mechanical and judgement work separated,
the judgement population named by exact identity, and no way to proceed past it silently.

**The tripwire** generalises the two shipped refusal-on-drift assertions — `graduation-clearance-plan.mjs:197`
(`corpus.documents !== 92`) and `semantic-evidence-check.ts:26` (`outpostDocuments.length !== 3`).
A plan whose measured population is baked into an assertion cannot go stale silently: the moment
the corpus moves, CI reddens and a human re-baselines.

### §7. The population — defined, not inherited

Gate F clause 6 requires *"automatic migration/dry-run passes over every pack and sidecar"*, and
that population is **undefined at HEAD**. `make graduation-plan`'s "92 documents" is a **property
filter over two of six content roots**, keeping only documents that already carry the property
being migrated (`tools/graduation-clearance-plan.mjs:92-97`). A capability planner copying that
shape would silently skip every document lacking the thing being added — which, for a capability
stamp, is all 92 of them.

**Definition.** The population is every document the contract can refuse or migrate, walked
exhaustively with **no property filter**:

| Root | Documents at HEAD |
|---|---|
| `content/drafts/` pack documents | 56 |
| `content/candidates/*/pack.json` | 36 |
| `content/drafts/` sidecars (`*.evidence/sources/job.json`) | 96 |
| `content/candidates/` sourcing documents | 126 |
| `content/shapes/` (resolved through, §2.6) | 25 |
| `content/principles/` (resolved through, §2.6) | 13 |
| **Total** | **352** |

`content/sources/` (51) and `content/witnesses/` (1) are **excluded and the exclusion is stated**:
neither is resolved through by a pack's meaning, so neither can carry a capability requirement.
Criterion 12 bakes all six counts into the tripwire.

### §8. Lifecycle effects are checked discharges

The former prose-only row mapping is withdrawn. D5–D11 in the Discharges register below own every
implementation effect with a literal ledger row and landing record; `verify-draft` checks that
register. There is no second lifecycle table.

## Deviations from design

**One.** `design/research/pack-primitive-stability.md` §6.2 permits a pack to *"declare **or
deterministically derive** required capability IDs"*. This RFC requires **declaration** and uses
derivation only to *check* it (criterion 3: the declared set must equal the derived set). Rationale:
[[D1058]] ruled the stamp into the pack for binding integrity, and a purely derived set makes the
derivation function an unversioned root — a derivation bug is silent, where a mismatch between
declared and derived is loud. The derivation is retained as the check, not as the record.

## Fresh-return author obligations (2026-08-30) — discharged by this amendment

This live RFC owns the next author pass; the review rows are not free-floating defects:

- [[D2050]] — replace the public ID regex and every parser/criterion positive with one inventory-
  complete base-id grammar and the structured integer/semver result.
- [[D2051]] — publish the complete applicability mapping as reviewed author bytes plus digest,
  rather than asking implementation to create its own authority.
- [[D2052]] — make the strict schema keyword represent every member of a multi-value enum (or
  normalize to annotated const branches), with missing/duplicate/wrong-member negatives.
- [[D2053]] — replace both prose evaluator roots with exact exported symbols and live-reader checks.
- [[D2054]] — point weakened-Stockfish refusal at its protected-design anchor rather than treating
  `AGENTS.md` as protected intent.
- [[D2055]] — replace finite literal pointers for recursive/reused vocabularies with schema-aware
  member selectors evaluated over the finite pack instance.

The author pass inverts `make pack-capability-fresh-review`, preserves the prior 7 + 11 arms and
requests another independent review. It does not implement lane 0.30 or touch corpus bytes.

## Second-fresh-return author obligations (2026-08-30) — discharged by this amendment

This live RFC owns the seven new return seams:

- [[D2070]] — make schema/stamp/corpus landing atomic or specify a real versioned compatibility
  transition that can keep both implementation and content gates green.
- [[D2071]] — separate plan-shape verification from apply-readiness refusal.
- [[D2072]] — publish author-owned post-migration schema bytes or an exact patch/post-image digest.
- [[D2073]] — publish complete member→source/dependency authority, including helpers, tables and
  multiple interpretation sites.
- [[D2074]] — exclude capability metadata from semantic applicability by an exact independent
  authority so the stamp never derives from itself.
- [[D2075]] — define retained per-version declarations, one current version and acyclic successor
  history.
- [[D2076]] — replace schema-ordinal public ids with stable authored/discriminator identities.

This author pass inverts `make pack-capability-second-fresh-review`, preserves the previous
7 + 11 + 6 arms, runs full verification and requests another independent review. It does not
implement lane 0.30 or mutate corpus bytes; the staged authority exists solely so a later accepted
implementation can land without violating D560.

## Third fresh independent return (2026-08-30)

The third fresh buildability review returned this RFC on [[D2152]], [[D2153]], [[D2154]],
[[D2155]] and [[D2156]]. The exact evidence and
repair obligations are in
`planning/pack-capability-contract/third-fresh-independent-review-2026-08-30.md`; the executable
reproducer is `make pack-capability-third-fresh-review` (5/5).

1. The sealed 0.27→0.30 patch must become a legal cumulative transition containing the already-owned
   0.28 and 0.29 post-images, or serialize behind their exact accepted patches. It may not discard
   predecessor claims or invalidate its own source digest by landing after them.
2. The 373 applicability decisions must exist as literal checked rows, or as the output of a
   deterministic generator with a complete independently recomputable source inventory and digest.
3. All unconditional meaning roots and convention tables need exact module-qualified symbol sites
   and transitive dependencies, with zero/multiple matches failing.
4. External packages that contribute chess semantics—including `chessops`—must be exact
   lockfile-resolved meaning sources inside the semantics digest.
5. A withdrawn declaration must retain a typed successor when one exists, and the planner must
   follow that edge; lawful no-successor withdrawal remains explicit and cycle-safe.

This is an author return, not an implementation checkpoint. The D560 corpus hold remains whole and
fresh independent review is required after repair.

## Fourth author repair (2026-08-30) — D2152–D2156

The five third-review blockers are repaired without implementing any schema or product byte:

- [[D2152]] — the transition artifact is now a three-stage cumulative authority with exact 0.28,
  0.29 and 0.30 source/post-image digests and owner documents. The final image asserts every
  predecessor field before admitting the capability stamp.
- [[D2153]] — the applicability artifact publishes its complete 397-row target source inventory;
  `make pack-capability-author-repair` deterministically expands it, proves identity collision
  freedom and recomputes both mapping digests.
- [[D2154]] — all 14 unconditional rows, their dependencies and all 16 constant/convention rows use
  exact repository-relative `module#symbol` sites. The author contract fails zero or multiple
  declarations.
- [[D2155]] — `package_dependency` is a first-class meaning source. The authority pins
  `chessops@0.15.1`, its exact integrity, lock key and four workspace manifest specifiers, with an
  able-to-fail upgrade fixture.
- [[D2156]] — withdrawal is a closed successor/no-successor union; the planner follows successor
  edges and retains typed refusal debt when no migration exists.

The repaired author contract preserves the prior 7 + 11 + 6 + 7 arms and adds five able-to-fail
controls. The historical third-review reproducer is not rewritten. Fresh independent review still
gates acceptance and implementation; [[D560]] still holds the 92-pack apply.

## Acceptance criteria

Each criterion names what a wrong implementation would do to pass it, because a criterion nothing
can fail is the [[D444]] class and one nothing can satisfy is the [[D984]] class.

1. **`CapabilityId` is structured.** `packages/schema/src/capability/types.ts` exports `{id, version}`;
   `parseLegacyCapability("x@1")` and `parseLegacyCapability("x@v1")` both yield
   `{id: "x", version: {kind: "integer", value: 1}}`. The same parser crosses the real
   one-segment (`mate-proof@1`), dotted (`tablebase.probe@v1`), colon
   (`assistance:arrows@1`) and mixed-case (`error.SIMULATE_BUDGET_EXCEEDED@1`) families; it rejects
   whitespace, slash, empty segments, semver suffixes and a second `@`.
   *Wrong implementation that passes:* one storing `"x@1"` and splitting on demand — refused by
   criterion 5.
2. **The registry is closed and total.** `CAPABILITY_DECLARATIONS` compiles; the four §4.3
   invariants throw at module load. Fixture: an `active` AST-backed declaration lacking a source
   fails with `CAPABILITY_SOURCE_MISSING`; an F1-backed declaration with its subject-appropriate
   projection source passes without inventing an AST site. Every schema vocabulary member carries
   its base schema-member source plus every interpreter root and transitive symbol dependency named
   by the author authority; helper-only edits in structural, transition and objective families move
   the intended closed digest, while unused and unreachable same-name symbols do not.
3. **Declared equals applicable closure.** For all 92 packs, `requires` set-equals §2.7's selector
   result plus transitive dependencies and resolved entries. The outpost/default fixture derives
   exactly `guard.defaults`, `objective.state_machine`, `structuralFeature.outpost` and
   `structuralFeature.pawn_safe_square`; omitting the helper and adding unrelated
   `structuralFeature.isolated_pawn` fail with distinct under/over-declaration diagnostics.
   A three-level nested structural expression and the same `$defs` member reached through two root
   references both derive their exact schema-member capability; an equal scalar attached to a
   different schema identity does not. Marking recursive schema identities visited globally (and
   thereby skipping the nested instance) fails the positive control.
4. **The census has independent roots (§3.1).** `make capability-census` rejects an unannotated
   schema union, orphan interpreter, missing named evaluator, extra declaration and
   count-preserving swapped public ids with the five named error codes. It set-equals identities,
   not cardinality. The 13 evaluator and 16 table rows in §3.1 are executable inputs, not prose
   counts. A separately generated baseline reddens on movement.
   The sidecar fixture includes a three-member enum and rejects one missing member, a duplicate,
   a wrong semantic owner/discriminator/member identity, a non-member scalar and an unknown
   sidecar field. Strict AJV rejects any capability keyword added to the pack schema.
5. **Version literals have a typed boundary (§2.1a).** A current authority initialized from
   `"x@1"` fails; `legacyCapabilityFixture("x@1")` parses and passes; an unrelated exact schema
   string such as `tabiya.sourcing.evidence.v1` passes. The check uses TypeScript contextual types
   and call identity, not a tree-wide grep. Existing wire artifacts remain readable and new
   capability writers emit structured data.
6. **Site completeness.** Every capability whose vocabulary has two interpretation sites declares
   both. Fixture: removing the evidence-ref site from `SuccessCondition`'s declaration fails.
7. **Requirement scope.** A pack's derived requirement set draws only from the three
   pack-meaning consumers; a projection outside them can never appear in a `requires` array.
   Fixture in both directions.
8. **Semantic and deployment state do not alias (§4.2/§5).** All 12 `FORMAT_DISPOSITIONS` rows and
   every `CAPABILITY_DISPOSITIONS` row map through the total table in §5, retaining `retired` and
   `impossible`. `GET /capabilities` publishes configured `active`/`deprecated` rows with a separate
   `supported`/`temporarily_unavailable` reachability. An unconfigured capability is absent and a
   refused capability cannot be made supported by provider health. The format-row fixture also
   proves assistance, error and resolved-reference rows retain their actual subject kinds instead
   of being coerced to `vocabulary_arm`.
9. **Every history resolves.** Declarations are unique by subject+version; each history retains old
   rows and has exactly one active current declaration. Fixtures cross 1→2, 1→2→3, withdrawal with
   a successor, lawful `successor:null` plus typed refusal, bare/missing refusal, duplicate current,
   cross-subject successor, mixed version arms and a cycle. The migration planner follows a
   withdrawn successor and emits explicit debt for the lawful no-successor arm.
10. **Every legacy refusal migrates, and every semantic refusal has authority.** The exact 20-row
    source population in §5a set-equals `LEGACY_REFUSED_MIGRATION`; deleting, adding or renaming a
    legacy row without a migration entry fails. Fixtures separately prove: missing mapping fails;
    an owner-ruling authority whose row is not ⚖ fails; a protected-intent authority whose document
    or anchor is not in the allow-listed intent inventory fails; an accepted-RFC authority whose
    document is not accepted or whose criterion does not resolve fails; and `pending_decision`,
    `unimplemented`, `unmeasured` and `refuted` cannot be encoded as `refused`. The reversed
    cross-learner row must compile `active`, while `retryVariants` must compile its two destinations.
11. **Plan shape and apply readiness are different mechanisms.** Empty, mechanical-only and
    judgement-bearing complete plans all pass `migration-plan-check`; only the last fails
    `migration-apply-ready`, and `make migration-apply` then writes zero bytes. Fixtures assert all
    exit codes and prove ordinary `make verify` stays green while honest judgement debt exists.
12. **The population is baked.** `make migration-plan` refuses when any of §7's six counts moves.
    Fixture: a temporary seventh document in `content/shapes/` reddens the plan.
13. **The D566 regression — the criterion this RFC exists for.** A fixture reproduces the
    `pawn_safe_square` semantics change at a pinned `@1`: `make capability-check` **fails** on the
    digest mismatch; bumping the declaration to `@2` clears it; and `make migration-plan` then lists
    the three predicate-bearing documents (`content/shapes/{knight-vs-bishop,maroczy-bind,open-centre}.json`)
    in `judgement[]`, not in `mechanical[]`. *Wrong implementation that passes criteria 1–12 and
    fails this:* any contract keyed on JSON fields.
14. **Convention prose is inside the digest.** Editing one character of `BREADTH_CONVENTION_TEXT`
    without a version bump reddens `make capability-check`.
15. **The claim-binding handoff is compile-time only (§4.4).** `claim.binding` resolves through the
    generic registry as a structured `CapabilityId`, and a generic round-trip fixture preserves both
    integer and semver arms. The F3 implementation diff contains zero additions to the evidence
    sidecar schema/parser, zero `contract`-field dispatch and zero occurrence of
    `CLAIM_BINDING_VERSION_UNSUPPORTED`; importing any production module or fixture from draft
    `claim-semantic-anchors` fails the dependency-boundary check. The later consumer RFC owns its
    field, stage migration and refusal code after F3 acceptance. *Wrong implementation from the
    returned draft:* one that implements a draft consumer while pretending to supply only a generic
    primitive, creating a circular acceptance dependency.
16. **Unavailability resolves to exactly one of two states, by cause ([[D1077]], §5.1).** An
    `unsupported` capability is **absent** from `/capabilities`' `packCapabilities` set (the
    [[D509]] rule), so a pack requiring it is refused at registration with
    `PACK_CAPABILITY_UNSUPPORTED` on the 422 arm and excluded from the listing **without failing
    the boot**; a `temporarily_unavailable` capability is present in the published set but
    unreachable at request time, answers on the 503 arm, is **retryable**, and does not destroy the
    run. Asserted asymmetry: for a capability whose `AvailabilityMode` is `local` or `build_time`,
    `temporarily_unavailable` is **unreachable** — only `provider` capabilities can enter it.
    *Wrong implementation that passes criteria 1–15 and fails this:* one resolving both states at
    registration, which makes a pack permanently unavailable for the process lifetime because a
    provider was down for two minutes — the precise flexibility the ruling exists to preserve.
17. **Instruments stay green.** `make verify` passes with shape-only `migration-plan-check`,
    `capability-census` and `capability-check` wired in; CI invokes the same Make targets.
18. **The staged schema transition is exact and temporary ([[D2070]]–[[D2074]], [[D2152]]).**
    Applying the three owner-qualified patches to the committed 0.27 schema produces the sealed
    0.28, 0.29 and 0.30 bytes/digests in order. The final image contains every predecessor field and
    a required `requires` key; deleting any graduation/provenance member fails before the 0.30
    stage is considered. Exactly the sealed 92 path+raw-digest catalogue files may enter the
    internal 0.27 reader; an edited member, a 93rd file, any upload/API document without a stamp,
    or caller-supplied path fails. `/requires` and its two grammar definitions emit zero
    applicability rows. Branch reorder and `$defs` relocation preserve stable ids; a real member
    rename changes identity and requires a successor. After all 92 migrate, one fixture proves the
    legacy reader/allowlist are deleted together.
19. **Author authorities are inspectable and externally closed ([[D2153]]–[[D2155]]).**
    `make pack-capability-author-repair` recomputes the cumulative target, its literal 397-member
    source inventory, all 397 public mappings and both mapping digests; removing one row fails.
    Every unconditional/dependency/constant site is `module#symbol` and resolves exactly once.
    Every external package reached by semantic AST closure contributes exact manifest pins and a
    lockfile-resolved version+integrity source; mutating the `chessops` version or integrity fails.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Open question 1 — what a capability refusal *does*. **Reframed and ruled by [[D1077]]** 2026-08-23: the question is not what we do to the pack but *why the capability is missing*, and there are exactly two causes (§5.1). Gate F clause 5 is **unblocked** | OWNER | the ruling's landing commit | **discharged 2026-08-23 — [[D1077]], `cc98fcb`** |
| D2 | The sacrificial pilot must exercise every **required** 1.0 capability. Membership and proof are owned by the existing F7 node and Phase-8 Gate-F procedure | `planning/platform-alignment/rfc-graph.md` F7 | `planning/platform-alignment/execution-queue.md` Phase 8 proof commit | |
| D3 | Re-stamp every affected evidence-ledger `packDigest` after lane-0.30 churn; the planner derives the population. [[D949]] holds application until Gate F | codex | the implementing/apply commit | |
| D4 | `EVIDENCE_KINDS` remains the checked membership register in `rfc/README.md`; it is provenance vocabulary, not evaluator semantics. An evaluator over a kind gets its own capability | `archive/shared-resource-registers.md` | this amendment | **discharged 2026-08-28** |
| D5 | Implement the registry, census, checks, handshake, sealed 0.27 compatibility reader, 0.30 schema and planner without applying the held corpus plan | codex | the implementing commit | |
| D6 | Close [[D576]] when declared-vs-derived pack requirements ship | codex | the implementing commit | |
| D7 | Close [[D632]] when D566 dependants appear as judgement debt | codex | the implementing commit | |
| D8 | Close [[D1003]] when the no-property-filter migration population ships | codex | the implementing commit | |
| D9 | Close [[D1004]] when structured capability authority and legacy readers ship | codex | the implementing commit | |
| D10 | Close [[D1045]] when the total migration and typed refusal-authority checks ship | codex | the implementing commit | |
| D11 | Reconfirm already-closed [[D1002]] remains on the 422 client-error arm | codex | the implementing commit | |
| D12 | Feed [[D228]] with the total semantic-disposition mapping and separate reachability projection | codex | the implementing commit | |
| D13 | Preserve [[D1508]]: draft digest drift remains advisory; any otherwise-graduable stale pair and every published stale pair fail content CI | `graduation-report` / real-content CI | **already implemented under [[D1508]]** | **discharged before this amendment** |
| D14 | Correct the 0.15 `checkpointInteraction` register from four to three members | codex | this amendment | **discharged 2026-08-28** |

## Open questions

1. **⚖ RULED 2026-08-23 by [[D1077]] — and the ruling REFRAMED the question rather than picking
   an option.** This RFC had asked which of boot failure, listing exclusion or per-request 4xx a
   refusal should be. The owner's answer: all three describe *what we do to the pack* and skip the
   thing that decides it — **why the capability is missing.** Verbatim: *"during runtime capas can
   get missing right... or reappear? like at least we should be flexible like that. so it would be
   a 'temporarily unavailable' if it's a runtime issue or outright unsupported if the server is
   started without the capa outright... other than that how can a capa ever be missing? the
   operator configures it or not."* The ruled two-state model is now normative in **§5.1**; the
   closing observation is load-bearing and is stated there as the model's completeness argument —
   **there is no third cause.** Discharge D1 is discharged; **Gate F clause 5 is unblocked** (see
   §5.1's closing paragraph for what it now needs).
2. **RESOLVED by existing [[D1508]] policy.** Draft digest drift remains an authoring warning, while
   `make graduation-report` withholds stale pairs from graduation and real-content CI fails every
   published stale pair. This capability contract neither weakens nor duplicates that policy; D13
   names the existing owner.
3. **RESOLVED in this amendment.** `rfc/README.md` 0.15 now matches the shipped three-member
   `checkpointInteraction` union (`intent_capture`, `prediction`, `stated_reasoning`); D14 records
   the correction.

## Ledger rows

Proposed from committed head **D1234** (verified immediately before this commit; [[D1130]]'s
unnumbered convention is **retired** — codex's semantic-route fix landed, so a proposed id can no
longer manufacture a route for an unrelated landed row).

- **D1235 (proposed — renumber at landing)** — 🐞 the pack schema is **v0.27**, not "v0.2".
  `CLAUDE.md` §Phase and the F3 commissioning brief both say v0.2, a stale reference to the era the
  doc was written in. `CLAUDE.md` is the owner's file: propose, do not edit.
- **D1236 (proposed — renumber at landing)** — 🐞 **two king values in one runtime**:
  `MATERIAL_VALUES` has K0 (`packages/runtime/src/objective.ts:34`) while `EXCHANGE_PIECE_VALUES`
  has K100 (`exchange.ts:16`), and `pressure-line@1`'s prose carries a third P1/N3/B3/R5/Q9 scale
  (`evidence-catalog.ts:188`). Three copies of one idea, each a place a capability version can be
  right in one copy and wrong in another. Same class: `CATEGORY_RANK` 9 entries
  (`sourcing/tablebase-category.ts:4-14`) vs `RANK` 5 entries (`branch-scale.ts:30`).
- **D1237 (proposed — renumber at landing)** — 🐞 `reviewStatus` has **never been exercised**: all
  92 documents are `draft`, zero `published`, so `pack-validation.ts:971-986` — the strictest gate
  in the tree — has never fired on committed content. Its type safety is also lost at runtime
  (widened to `string` at `pack-registry.ts:41`), and a missing status becomes `""`. The sacrificial
  pilot is its first real test.
- **D1238 (proposed — renumber at landing)** — 🐞 **the F3 derivation's own census is wrong in four
  terms and omits two parent unions**, and the returned draft inherited every error verbatim:
  `f3-derivation.md` §3a sums to **90** not 89, §3a-ter to **62** not 60 (and its §3a prose says
  *"15 more vocabularies"* against its own heading's 16), §3f has **16** rows not 17, and the
  conventions are **13** not 12 because `BREADTH_CONVENTION_TEXT` has **8** entries. `SimpleTrigger`
  (6 arms) and `TransitionExpression` (5 nodes) appear in §3a-bis's interpretation-site table and in
  **no arm list at all**. **The transmissible lesson is not the arithmetic**: a derivation that hands
  an RFC a hand-summed integer hands it an unfalsifiable one, and the RFC asserted it as a criterion
  — [[D984]]'s class, arriving through the derivation channel. Derivations should hand over a
  *procedure* and a measured baseline, never a total.

## Changelog

- 2026-08-30 (**D2152–D2156 fourth author repair**): replaced the illegal direct 0.27→0.30 patch
  with exact cumulative 0.28/0.29/0.30 stages; published the literal 397-member target inventory
  and checked generator; module-qualified all unconditional, dependency and constant/convention
  sites; admitted lockfile-resolved external semantic sources; and made withdrawal successor versus
  no-successor a typed, planner-visible union. `make pack-capability-author-repair` is the new
  five-arm positive contract. Fresh independent review remains required; no implementation or
  corpus bytes changed.
- 2026-08-30 (**third fresh independent return**): returned on [[D2152]]–[[D2156]]. The sealed
  0.30 target omits the already-owned 0.28/0.29 schema changes; the 373-row applicability authority
  contains no rows or checked generator; fourteen unconditional meaning entries are bare symbols;
  external chess dependencies cannot participate in semantic digests; and withdrawn declarations
  cannot encode their promised successor. Exact return:
  `planning/pack-capability-contract/third-fresh-independent-review-2026-08-30.md`.
  `make pack-capability-third-fresh-review` passes 5/5. No implementation is authorised.
- 2026-08-30 (**D2070–D2076 author repair**): replaced the impossible atomic corpus landing with a
  byte-sealed two-schema transition. Only the exact 92 committed 0.27 catalogue documents may use
  the internal legacy reader; every new/external 0.30 document requires a stamp, and the legacy arm
  retires with the held apply. Split plan validity from apply readiness; published an ordered
  author patch and exact 0.30 post-image; added schema-member plus transitive interpreter meaning
  authority; excluded the complete capability-metadata subtree; made declaration history
  subject+version keyed with one acyclic current chain; and replaced ordinal ids with semantic
  owner/discriminator identities, including the two quantified structural forms. The maintained
  7 + 11 + 6 arms and repaired 7-arm contract pass. Fresh independent review still gates
  acceptance and implementation.
- 2026-08-30 (**second fresh independent return**): returned on [[D2070]]–[[D2076]]. Required
  stamps cannot land apart from the held 92-pack rewrite; judgement-bearing plan output is both
  required red and verify-green; the old raw schema digest cannot survive required annotations and
  `requires`; no author source/dependency closure exists for 373 AST-backed members; capability
  metadata derives capabilities from itself; one declaration per subject cannot retain old+new
  versions; and `oneOf` ordinals make public ids move under semantic no-op reorder. Exact return:
  `planning/pack-capability-contract/second-fresh-independent-review-2026-08-30.md`.
- 2026-08-30 (**D2050–D2055 author repair**): widened the compatibility grammar to shipped
  one-segment ids and made the legacy criterion return `CapabilityVersion`; published the complete
  digest-sealed applicability authority; replaced object annotations with total member arrays;
  named exact transition/opponent sites; moved weakened-Stockfish authority to protected design;
  and replaced finite vocabulary pointers with schema-aware traversal after the repair found the
  recursive-expression under-stamp class. The prior 7 + 11 arms and the repaired 6-arm contract
  pass. Fresh independent review still gates acceptance and implementation.
- 2026-08-30 (**fresh independent return**): returned on [[D2050]]–[[D2054]]. The compatibility
  regex rejects real one-segment shipped ids and criterion 1 contradicts the structured version
  union; the generated applicability authority still has no independent mapping bytes and its
  single-object keyword cannot express per-enum-member mappings; two named evaluator roots remain
  non-symbol prose; and `AGENTS.md` is not a protected-intent authority. Reproduction:
  `make pack-capability-fresh-review`. No schema, pack, registry or product byte changed.
- 2026-08-30 (**second-return author repair**): repaired [[D1982]]–[[D1992]] without implementing
  lane 0.30. Published the exact compatibility id regex and integer/semver version algebra; replaced
  the partial applicability examples with one generated schema/always/reference authority and
  exclusions artifact; gave F1 and resolved content subject-specific source/digest rules; named all
  constant roots; routed both annotations through one strict AJV factory; and canonicalized
  `requires` tuples and bytes. The 20 legacy refusals now have a total identity-keyed migration that
  distinguishes refusal, refutation, unmeasured, pending-decision, unimplemented, withdrawn,
  active and deprecated states. F3's claim-binding seam is compile-time only, leaving all sidecar
  behavior to the downstream RFC after acceptance. `make pack-capability-repeat-review` is now an
  eleven-arm positive author contract. Fresh independent review and the [[D560]] hold remain.
- 2026-08-28 (**seven-blocker independent-return amendment**): [[D1620]]–[[D1622]] now have an
  executable 7-arm disposable falsifier behind `make pack-capability-closure`: literal/absence
  selectors and dependency closure derive exact requirements; AST-token symbol/arm sites catch the
  helper-only D566 change at exact grain; and semantic status cannot alias deployment reachability.
  [[D1623]] gains annotated schema/interpreter roots, literal 13-evaluator/16-table inventories and
  five distinct negative census controls. [[D1624]] is re-derived at `37/193/25/210 core`,
  `67/67/15/1 semantic`, and format `7 reached / 3 refused / 1 retired / 1 unmeasured`.
  [[D1625]] now bans suffix strings only at typed current-authority sites while preserving named
  compatibility fixtures and unrelated artifact-schema ids. [[D1626]] now points F7, evidence-kind
  membership and digest freshness at existing authorities; all seven ledger effects are checked
  Discharges, and the anonymous checkpoint correction landed in the register. Repeat independent
  buildability review remains required; no production or corpus implementation is authorised.
- 2026-08-23 (**six-blocker repair**, post-return): (1) **§3.1 replaces the hand-counted census with
  `make capability-census`, a derivation procedure** over the schema's 52 `$defs`, the tree's
  exhaustive `never` switches, the named evaluators without a vocabulary, and the manifest by
  reference; `CAPABILITY_DECLARATIONS` is asserted **set-equal by id** to its output and the HEAD
  count is baked only as a drift tripwire. This dissolves three blockers together — the four wrong
  arithmetic terms cannot recur because no arithmetic is asserted, the two omitted parent unions
  (`SimpleTrigger` 6, `TransitionExpression` 5) are enumerated by rule, and **`claim.binding` is
  registered** so §4.3's handshake stops refusing every sidecar that names it. (2) **Counts corrected
  at source**: §3a **90**, §3a-ter **62**, conventions **13** (`BREADTH_CONVENTION_TEXT` is 8
  entries), constant tables **16**; primary total **206**. Summary and §2.4 updated to match. (3)
  **§4.2 publishes the supported projection** (that repair's reached/transient formulation), resolving
  the criterion-8/16 contradiction. The repair's copied claim of **5** refused format rows was later
  corrected by the 2026-08-28 amendment to the executable **3**. (4) **§4.4 rewritten onto
  `claim-semantic-anchors` §7's per-binding
  `contract` grammar**; the root-level `requires` form is withdrawn because §7's Stage A keeps a
  legacy binding inside a file the V2 parser also reads, which a per-document declaration cannot
  express; `SIDECAR_CAPABILITY_UNSUPPORTED` is withdrawn so the seam has one refusal code and it is
  the consumer's; the invented *"explicit pinned default"* is struck because §7 refuses an explicit
  `claim.binding@1` in both stages. (5) Criteria **4, 8 and 15** rewritten to match, each naming the
  returned draft's own behaviour as its wrong implementation. §2.5 now states that both vocabularies
  it asserts site-completeness for are declared — the draft asserted criterion 6 against a capability
  criterion 4 forbade.
- 2026-08-23: created, drafted from `planning/platform-alignment/f3-derivation.md` under
  [[D995]]/[[D996]], with the central lane-vs-sidecar fork ruled by [[D1058]].
- 2026-08-23 (scope amendment, pre-review): added **§4.4, the evidence-sidecar declaration**, and
  acceptance criterion 15. **Reason: a cross-document block that acceptance would not have
  cleared.** `rfc/claim-semantic-anchors.md` §7 defers its entire compatibility story to "the
  accepted F3 declaration", and its criterion 7 needs the F3 migration plan to exist as an
  artifact — but the sidecar declaration was **absent from this RFC's derived scope**
  (`f3-derivation.md:798-815`, which never mentions that RFC), so shipping the derived scope
  unchanged would have left `claim-semantic-anchors` blocked **on the day this RFC was accepted**.
  Caught by `planning/platform-alignment/rfc-disposition-packet.md` §3.3 while this draft was still
  in motion. §4.4 also resolves that RFC's conditional claims block to `none` by stating that the
  seam does **not** become a registered resource.
- 2026-08-23 (cross-review): five citation/measurement corrections applied in place; **six
  return-class blockers reported, not fixed** (see the reviewer's report). Corrected here:
  (1) the exploration-gate line cite `o5-o6-handoff.md:100` → `:96` (`:100` is a code fence; the
  `rfc/README.md` Active row carries the same wrong line and is not this reviewer's file to edit);
  (2) §1's quote range `:52-58` → `:54-61` (the drafted range excluded the second quoted paragraph);
  (3) §5.1's *"refuse-to-serve, not degrade"* re-sourced from `docs/drill-client.md:16` — which
  contains no such string anywhere in the file — to `planning/archive/drill-client/log.md:49`;
  (4) §6's *"rubber stamp in a new costume"* cite `graduation-clearance.md:2445-2449` → `:2457-2458`;
  (5) §6's tripwire cite `semantic-evidence-check.ts:25` → `:26` (`:25` is the definition, `:26` the
  assertion); and (6) **criterion 15's sidecar population 32 → 68** — the drafted
  `git ls-files 'content/**/*.evidence.json'` is a filename-convention filter that matches only the
  `content/drafts/` naming and drops all 36 `content/candidates/*/evidence.json` sidecars; 68
  documents carry `schema: "tabiya.sourcing.evidence.v1"` at HEAD, 0 with a `requires` key.
- 2026-08-23 (owner ruling, pre-review): **[[D1077]] reframed and ruled Open question 1.** Added
  **§5.1** (unavailability has exactly two causes — `unsupported` when not configured at startup,
  `temporarily_unavailable` when configured but unreachable, with the owner's completeness argument
  that there is no third cause), rewrote §4.3's refusal paragraph onto it, added acceptance
  criterion 16, and discharged D1. The ruled model reuses the shipped `ProviderOffBehavior` /
  `AvailabilityMode` types and the [[D509]] not-configured-means-not-advertised precedent rather
  than adding parallel machinery. **Gate F clause 5 is unblocked** and needs no further ruling.
