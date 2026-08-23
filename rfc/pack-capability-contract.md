# RFC: Pack capability contract — semantic versions, handshake, deprecation and migration

- **Status:** draft — 2026-08-23
- **Author:** claude (drafted from `planning/platform-alignment/f3-derivation.md`, the HEAD derivation of every surface this document versions)
- **Created:** 2026-08-23
- **Design refs:** `design/research/pack-primitive-stability.md` §6 (R6's six-part model); `planning/platform-alignment/plan.md` Gate F clauses 1, 5, 6, 7
- **Exploration gate:** O6.1 approved as [[D995]] and O6.2 ruled as [[D996]]; `planning/platform-alignment/theory-drill/o5-o6-handoff.md:100` reads verbatim `O6.1 + O6.2 approved → F3 may draft`
- **Depends on:** `archive/evidence-contract-manifest.md` (F1 — the 188-projection manifest this versions), `rfc/graduation-clearance.md` (accepted — lane 0.28, the planner precedent in its §6.5)
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
(`f3-derivation.md` §2e). Meanwhile the meanings a pack depends on live in **≥149 pack-facing
vocabulary arms across 30 vocabularies**, 188 manifest projections, 12 conventions whose semantics
are **frozen prose**, and 13 verdict producers of which **12 carry no identifier at all**.

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
RFC ships a *planner*, and its applier writes nothing until the hold's graduation arm lifts);
lifting Gate F; detector semantics v1 (clause 4 of the gate, a separate document); and the 14 F1
declared-vs-consumed mismatch rows.

## Specification

### §1. The approved contract, quoted

`planning/platform-alignment/theory-drill/o5-o6-handoff.md:52-58`, verbatim:

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
  readonly id: string;       // dotted, lowercase, no version suffix
  readonly version: number;  // integer >= 1
}
```

**The version is a field, never a suffix inside a string literal.** `formatCapability({id, version})`
renders `` `${id}@${version}` `` for display, logs and error messages; `parseCapability` accepts
both shipped spellings (`name@1` and `name@v1`) and returns the structured form. The 56 existing
identifiers migrate by parse, not by rewrite: `tablebase.probe@v1` and `rules.structural.predicate.outpost@1`
both parse to `{version: 1}`.

**Why this and not the majority spelling:** G5. `evidence-manifest-check.ts:70` proves a suffix
spelling puts the version inside assertions, where incrementing it requires editing the checker.
Criterion 5 asserts that no assertion in the tree contains a literal version suffix.

#### §2.2 A capability is keyed on an evaluator, not on a field

A capability names **a unit of meaning that a pack can depend on**. Its subject is one of:

| Subject kind | Example | Why it is a capability |
|---|---|---|
| `vocabulary_arm` | `structuralFeature.outpost` | a pack authors this arm; its truth is decided in code |
| `expression_node` | `structuralExpression.quantified` | quantifier scope decides composite truth |
| `verdict_producer` | `objective.state_machine` | **ordering is semantics** (first-match-wins) and no field expresses it |
| `convention` | `mate-proof` | its normative statement is prose (§2.4) |
| `constant_table` | `grade.thresholds` | a threshold edit reclassifies every recorded pair |
| `projection` | `rules.structural.predicate.outpost` | the manifest's existing 188 |

Keying on evaluators rather than fields is what makes ordering, prose conventions and duplicated
constant tables expressible. A JSON field may map to several capabilities; a capability may be
depended on by several fields.

#### §2.3 The semantics digest — the mechanism that catches D566

Every capability declaration carries a **semantics digest** over the artifacts that define its
meaning:

```ts
export interface CapabilityDeclaration {
  readonly id: string;
  readonly version: number;
  readonly subject: CapabilitySubjectKind;
  readonly sites: readonly CapabilitySite[];   // module + symbol, >= 1, all interpretation sites
  readonly conventionText?: string;            // when the normative statement is prose (§2.4)
  readonly semanticsDigest: string;            // `sha256:...` over the sites' source regions + conventionText
  readonly disposition: CapabilityDisposition; // §5
}
```

`make capability-check` recomputes every `semanticsDigest` from the tree and **fails when a stored
digest does not match its recomputed value at the same version**. The remedy is always one of two
things: revert the meaning change, or increment `version` and record the successor relation (§5).

**This is the D566 test.** `pawn_safe_square`'s semantics were repaired to use a disclosed
`maximal_pawn_reach@1` basis. The pack schema stayed 0.27, no pack byte moved, no `packDigest`
moved, and the projection stayed `@1` — while `outpost` went from 10 observations in 1.56% of
positions to **0 of 643**. Under this contract the edit changes the source region behind
`structuralFeature.pawn_safe_square`, its digest stops matching, and `make verify` goes red until
someone either reverts or bumps to `@2` — at which point every pack requiring `@1` is refused by
§4's handshake and appears in §6's plan as judgement debt. Criterion 13 fixtures exactly this.

#### §2.4 Prose conventions are digested

`BREADTH_CONVENTION_TEXT` (7 entries) and `SEMANTIC_CONVENTION_TEXT` (5 entries) at
`packages/runtime/src/evidence-catalog.ts:182-199` are the **normative statement** of what 12
collectors assert — including `mate-proof@1`'s 250,000-node cap and `pressure-line@1`'s own
P1/N3/B3/R5/Q9 role scale. Editing that prose changes what the predicate means with no code change
at all. Each convention is therefore a capability whose `conventionText` is inside its
`semanticsDigest`: **a prose edit without a version bump reddens CI**, which is G22's remedy.

#### §2.5 Both interpretation sites, or the capability is not covered

`sites` is a **list**, minimum length 1, and the declaration must name **every** site that
interprets the subject. Two vocabularies are interpreted twice today:

| Vocabulary | Predicate switch | Second switch over the same vocabulary |
|---|---|---|
| `SuccessCondition` (8 arms) | `apps/server/src/pack-orchestrator.ts:393-459` | evidence-ref derivation, `pack-orchestrator.ts:462-520` |
| `SimpleTrigger` (6 arms) | `pack-orchestrator.ts:196-231` | `compiledOpeningTrigger`, `pack-orchestrator.ts:306-357` |

A capability that compiles in the predicate switch and not the evidence-ref switch produces a
verdict with no attribution, silently. Criterion 6 asserts site completeness against a registered
census, so a new interpretation site cannot be added without either declaring it or failing.

#### §2.6 Resolved-through artifacts are inside the requirement

`plan_signature` is **never evaluated** — `packages/runtime/src/structure.ts:567` throws — and is
expanded from the shape registry at `pack-orchestrator.ts:78-105`. So a pack's meaning depends on
`content/shapes/*.json` bytes it never references by digest, and a shape edit re-decides every
dependent pack with nothing noticing. `named_structure`'s four inline ids (`carlsbad`, `iqp-white`,
`iqp-black`, `maroczy-bind`, `structure.ts:368-393`) are the same class.

**Rule:** a pack's derived requirement set closes over the shape entries and principle entries it
resolves through. The requirement records the resolved entry's `id` **and its content digest**, so
a shape edit invalidates the requirement rather than silently re-deciding the pack. This is G24's
remedy and it is the only part of the contract that reaches outside pack bytes.

### §3. The capability enumeration

`CAPABILITY_DECLARATIONS` (`packages/runtime/src/capability/registry.ts`, new) is a closed array.
**Unit: one declaration per capability subject. Total at landing: the census below, asserted by
criterion 4.**

| Group | Count | Source of the count |
|---|---|---|
| Pack-facing vocabulary arms (14 primary unions) | **89** | `f3-derivation.md` §3a |
| Pack-facing vocabulary arms (16 further vocabularies) | **60** | §3a-ter |
| Verdict producers | **13** | §3e (12 of them unidentified today) |
| Prose conventions | **12** | `BREADTH_CONVENTION_TEXT` 7 + `SEMANTIC_CONVENTION_TEXT` 5 |
| Constant tables that decide meaning | **17** | §3f |
| Manifest projections | **188** | `make evidence-manifest-check` at HEAD |

The first five groups total **191** and are this RFC's primary obligation. The 188 manifest
projections **already carry `{id, version}` records** and are absorbed by reference: §2.1's parse
rule adopts them without rewriting them, and criterion 5 removes the literal that pins them.

**Scope decision, stated rather than assumed.** Three of the manifest's 25 consumers decide pack
meaning at runtime — `authoring.predicate` (`evidence-catalog.ts:860`),
`runtime.objective_condition` (`:861`), `runtime.guard_condition` (`:862`). A pack's *required* set
is computed over those three consumers only; the other 185 projections are declared capabilities
but are never pack requirements, because no pack can depend on them. Criterion 7 asserts that
separation both ways.

### §4. The pack-side declaration and the handshake

#### §4.1 What a pack declares (lane 0.30)

```jsonc
// pack root, new required key
"requires": [
  { "id": "structuralFeature.outpost", "version": 1 },
  { "id": "objective.state_machine",   "version": 1 }
]
```

`$defs/capabilityRequirement` is a closed object of exactly `id` and `version`. The key is
**required** — a pack with no `requires` is invalid, not permissive. That is the whole reason
[[D1058]] chose the pack over a sidecar: absence must be a refusal, and every sidecar mechanism in
the tree is permissive on absence (`apps/server/src/expression-census.ts:77` returns `undefined` on
a schema mismatch, so a `.v2` ledger reads as *absent* rather than *refused*).

**The stamp is inside `digestDrillPack`.** `packages/schema/src/drill-pack/digest.ts:69` digests
every byte with no field filter, so a requirement cannot drift from the content it describes. The
cost, accepted knowingly by [[D1058]]: **all 92 packs churn their digest** on landing and every
ledger `packDigest` must be re-stamped (§6 plans it).

**The Gate F cost, stated plainly.** Clause 1 requires that *no active RFC holds a drill-pack schema
lane*. Lane 0.28 is held by accepted `graduation-clearance`, 0.29 by draft
`pack-population-provenance`, and this RFC takes 0.30 — **clause 1 goes from two-deep to three, and
the content hold's lift is delayed by that much.** The owner ruled for binding integrity over
speed; this paragraph exists so no later reader mistakes it for an oversight.

#### §4.2 What the runtime publishes

`GET /capabilities` gains `packCapabilities`: the full `CAPABILITY_DECLARATIONS` projection of
`{id, version, disposition}`. `FORMAT_DISPOSITIONS`' own comment
(`packages/schema/src/drill-pack/dispositions.ts:21`) says it is *"deliberately not part of the
deployment capabilities payload"* — which is exactly why no pack can be checked against it today.
This publication is the fix; `FORMAT_DISPOSITIONS` is absorbed as the `vocabulary_arm` subset
(criterion 8).

#### §4.3 The handshake

Modelled on `assertOpponentModeDispositions` (`dispositions.ts:104-122`) — the one place the repo
already refuses a declared-but-unexecutable capability correctly, generalised from 7 values to 191.
Its four invariants become module-load `TypeError`s here too:

| Invariant | Error code |
|---|---|
| every declared capability has **exactly one** registry row | `CAPABILITY_DECLARATION_MISSING` |
| `disposition: "reached"` **iff** the capability is executable | `CAPABILITY_DISPOSITION_INVALID` |
| a `reached` row names at least one implementation `site` | `CAPABILITY_SITE_MISSING` |
| no registry row describes an undeclared capability | `CAPABILITY_UNDECLARED` |

At registration, `PackRegistry` computes `unmet = pack.requires \ runtimeSupported` and, when
non-empty, refuses with `PACK_CAPABILITY_UNSUPPORTED` carrying the exact unmet set. Codex mapped
`PACK_INVALID` to 422 at `apps/server/src/rest.ts:662` (closing [[D1002]]); the new code joins the
same 422 arm — it is a client error and must not present as 5xx, because 5xx-keyed retry logic
retries a request that can never succeed.

**What refusal *does* is Open question 1** — boot failure, listing exclusion or per-request 4xx are
materially different products, and `docs/drill-client.md:16`'s *"refuse-to-serve, not degrade"*
collides with [[D468]]'s blast radius, where one invalid pack crashed the server at boot. Marked
owner-level; clause 5 is not tickable until it is ruled.

### §5. Deprecation: successor or explicit refusal

```ts
export type CapabilityDisposition =
  | { readonly kind: "reached" }
  | { readonly kind: "deprecated"; readonly successor: CapabilityId; readonly reason: string }
  | { readonly kind: "withdrawn"; readonly reason: string; readonly removedAt: string }
  | { readonly kind: "refused"; readonly reason: string; readonly ruledBy: string }
  | { readonly kind: "unmeasured"; readonly experiment: string };
```

Three things this fixes.

**`successor` becomes typed.** `FormatDisposition.successor` is `string | null` today
(`dispositions.ts:14`) with nothing saying what it points at. Here it is a `CapabilityId` and
criterion 9 asserts every `deprecated` successor resolves to a `reached` declaration.

**A refusal costs at least as much as an unmeasured row.** The shipped
`assertAdvertisedCapabilityDispositions` demands an `experiment` for every `unmeasured` disposition
and **nothing at all** for a `refused` one — so filing an open question as a refusal is the cheapest
way to make it stop costing anything, which is literally what happened to the famous-game licence
question ([[D1045]]). Here `refused` requires `ruledBy` naming a ⚖ ledger row, and criterion 10
fails on any refusal without one. This RFC does not repeat the asymmetry it inherited.

**The three prose-only deprecations get typed successors**: `pawn_count`,
`piece_reach_count scope:"every"` (removal deferred because `registered_shapes` rows are
immutable), and `plan_consequence` → `structural_feature` with `plan_signature`. `retryVariants`
(5 kinds, authorable in the schema, **no evaluator**, `refused` at `dispositions.ts:77-82`, carried
by 7 packs) becomes a `refused` disposition with a `ruledBy` — the format admitting a vocabulary
the runtime refuses is precisely the state clause 5 exists to make impossible.

### §6. The migration planner and its applier

Three commands, following the separation of powers `graduation-clearance.md:2445-2449` states
outright — *"a checker that also rewrites the thing it judges is the rubber stamp in a new
costume"*:

```
make migration-plan          # no FILE argument — walks the population itself, read-only
make migration-plan-check    # node --test + the plan >/dev/null, wired into `make verify`
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

**The stop rule, as a mechanism rather than prose:** a plan containing any `judgement[]` entry
**exits non-zero and the applier writes nothing**. O6.2's own sentence is that such a plan *"never
becomes an automatic content wave"*; criterion 11 fixtures a plan with one judgement entry and
asserts both the exit code and the empty applier.

**This is what D996's per-release ruling reads.** The owner declined a standing budget in favour of
deciding per release, so the plan's job is to be *rulable*: mechanical and judgement work separated,
the judgement population named by exact identity, and no way to proceed past it silently.

**The tripwire** generalises the two shipped refusal-on-drift assertions — `graduation-clearance-plan.mjs:197`
(`corpus.documents !== 92`) and `semantic-evidence-check.ts:25` (`outpostDocuments.length !== 3`).
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

### §8. Ledger-row lifecycle mapping

Rows this RFC's implementation flips or feeds, kept here rather than in Discharges because that
table's owner column is a closed vocabulary:

| Row | Disposition at implementation |
|---|---|
| [[D576]] | closed — the derived-vs-stamped fork is ruled ([[D1058]]) and specified in §4.1 |
| [[D632]] | closed — §6's plan produces its three predicate-bearing documents as judgement debt (criterion 13) |
| [[D1003]] | closed — §7 defines the clause-6 population |
| [[D1004]] | closed — §2.1 gives one spelling with version as data |
| [[D1045]] | closed — §5's `refused` requires `ruledBy` |
| [[D1002]] | already closed by codex at `rest.ts:662`; §4.3 cites it |
| [[D228]] | fed — `CAPABILITY_DISPOSITIONS` and `FORMAT_DISPOSITIONS` reconciled by §4.2 |

## Deviations from design

**One.** `design/research/pack-primitive-stability.md` §6.2 permits a pack to *"declare **or
deterministically derive** required capability IDs"*. This RFC requires **declaration** and uses
derivation only to *check* it (criterion 3: the declared set must equal the derived set). Rationale:
[[D1058]] ruled the stamp into the pack for binding integrity, and a purely derived set makes the
derivation function an unversioned root — a derivation bug is silent, where a mismatch between
declared and derived is loud. The derivation is retained as the check, not as the record.

## Acceptance criteria

Each criterion names what a wrong implementation would do to pass it, because a criterion nothing
can fail is the [[D444]] class and one nothing can satisfy is the [[D984]] class.

1. **`CapabilityId` is structured.** `packages/schema/src/capability/types.ts` exports `{id, version}`;
   `parseCapability("x@1")` and `parseCapability("x@v1")` both yield `{id: "x", version: 1}`.
   *Wrong implementation that passes:* one storing `"x@1"` and splitting on demand — refused by
   criterion 5.
2. **The registry is closed and total.** `CAPABILITY_DECLARATIONS` compiles; the four §4.3
   invariants throw at module load. Fixture: a registry with a `reached` row lacking `sites` fails
   with `CAPABILITY_SITE_MISSING`.
3. **Declared equals derived.** For all 92 packs, the `requires` array equals the set derived from
   the vocabulary the pack actually uses, closed over §2.6's resolved entries. Fixture: a pack
   declaring one capability it does not use fails; a pack using one it does not declare fails.
4. **The census is asserted, not assumed.** The registry's counts equal §3's table (89 + 60 + 13 +
   12 + 17 = 191 primary declarations), and the assertion names the unit. *Wrong implementation:*
   one declaring 191 rows of which some are duplicates — the id set must also be 191.
5. **No version literal survives in an assertion.** A tree-wide check finds zero occurrences of a
   hardcoded `@1`/`@v1` suffix inside a test or checker assertion, including
   `evidence-manifest-check.ts:70`. Red at HEAD; green only when the literal is replaced by data.
6. **Site completeness.** Every capability whose vocabulary has two interpretation sites declares
   both. Fixture: removing the evidence-ref site from `SuccessCondition`'s declaration fails.
7. **Requirement scope.** A pack's derived requirement set draws only from the three
   pack-meaning consumers; a projection outside them can never appear in a `requires` array.
   Fixture in both directions.
8. **`FORMAT_DISPOSITIONS` is absorbed and published.** All 12 rows appear as `vocabulary_arm`
   declarations, and `GET /capabilities` returns `packCapabilities`. *Wrong implementation:*
   publishing an empty array — the response must set-equal the registry.
9. **Every `deprecated` successor resolves.** Fixture: a successor pointing at a `withdrawn`
   capability fails.
10. **Every `refused` carries `ruledBy`.** Fixture: a refusal with no `ruledBy` fails; one whose
    `ruledBy` does not resolve to a ⚖ ledger row fails.
11. **The stop rule is a mechanism.** A plan containing one `judgement[]` entry exits non-zero and
    `make migration-apply` writes zero bytes. Fixture asserts both.
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
15. **Instruments stay green.** `make verify` passes with `migration-plan-check` and
    `capability-check` wired in.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Open question 1 — what a capability refusal *does* (boot failure, listing exclusion, or per-request 4xx). Gate F clause 5 is not tickable until this is ruled | OWNER | the ruling's landing commit | |
| D2 | The sacrificial pilot must exercise every **required** 1.0 capability (O6.1 clause 6). This RFC specifies what "required" means (§3's scope decision); membership is F7's | claude | the pilot matrix's landing commit | |
| D3 | Re-stamping all 92 ledger `packDigest` values after the lane-0.30 churn (§4.1) — rides the graduation arm, which [[D949]] holds until Gate F | codex | the implementing commit | |
| D4 | `EVIDENCE_KINDS` has no version axis (7 members, versioned by membership). Whether capability versions cover evidence kinds or they get their own register | claude | the follow-up RFC's landing commit | |
| D5 | Implementation | codex | the implementing commit | |

## Open questions

1. **⚖ OWNER — what does a capability refusal do?** `docs/drill-client.md:16` documents
   *"refuse-to-serve, not degrade"*, and [[D468]] measured that blast radius: one invalid pack
   crashed the server at boot, because `PackRegistry.load` throws during startup. The three
   candidates are boot failure (current semantics, worst blast radius), **listing exclusion** (the
   pack loads but is not served, and appears in a startup report — recommended, since it degrades
   one pack rather than the deployment), and per-request 4xx. Recorded as Discharge D1; clause 5
   waits on it.
2. **Does digest staleness become fatal?** 26 of 68 pack/ledger pairs are stale at HEAD and nothing
   fails — `EVIDENCE_DIGEST_STALE` is `"warning"` at both emit sites
   (`apps/server/src/sourcing/check.ts:408,468`) and no path upgrades a warning. This RFC's binding
   does not depend on it (§4.1 puts the stamp inside the pack digest instead), so the question is
   deferred rather than answered — but a contract relying on an advisory check should say so, and
   this one does not rely on it.
3. **`checkpointInteraction` arity.** The shipped schema has three arms (`intent_capture`,
   `prediction`, `stated_reasoning`) while `rfc/README.md` 0.15 calls it a *"closed four-kind
   union"*. §3's census uses the schema. Reconciling the register text is a one-line fix owned by
   whoever next edits that row.

## Ledger rows

Proposed from committed head **D1071** — renumber at landing; codex lands rows continuously.

- **D1072 (proposed — renumber at landing)** — 🐞 the pack schema is **v0.27**, not "v0.2".
  `CLAUDE.md` §Phase and the F3 commissioning brief both say v0.2, a stale reference to the era the
  doc was written in. `CLAUDE.md` is the owner's file: propose, do not edit.
- **D1073 (proposed — renumber at landing)** — 🐞 **two king values in one runtime**:
  `MATERIAL_VALUES` has K0 (`packages/runtime/src/objective.ts:34`) while `EXCHANGE_PIECE_VALUES`
  has K100 (`exchange.ts:16`), and `pressure-line@1`'s prose carries a third P/N/B/R/Q scale
  (`evidence-catalog.ts:188`). Three copies of one idea, each a place a capability version can be
  right in one copy and wrong in another. Same class: `CATEGORY_RANK` 9 entries
  (`sourcing/tablebase-category.ts:4-14`) vs `RANK` 5 entries (`branch-scale.ts:30`).
- **D1074 (proposed — renumber at landing)** — 🐞 `reviewStatus` has **never been exercised**: all
  92 documents are `draft`, zero `published`, so `pack-validation.ts:971-986` — the strictest gate
  in the tree — has never fired on committed content. Its type safety is also lost at runtime
  (widened to `string` at `pack-registry.ts:41`), and a missing status becomes `""`. The sacrificial
  pilot is its first real test.

## Changelog

- 2026-08-23: created, drafted from `planning/platform-alignment/f3-derivation.md` under
  [[D995]]/[[D996]], with the central lane-vs-sidecar fork ruled by [[D1058]].
