# RFC: Pack capability contract — semantic versions, handshake, deprecation and migration

- **Status:** draft — **returned to author 2026-08-23, on six return-class blockers from independent cross-review** (~65 claims checked, 17 failed). **The mechanism holds and the [[D566]] acceptance test is real, not decorative**: criterion 13's three predicate-bearing documents are exactly `content/shapes/{knight-vs-bishop,maroczy-bind,open-centre}.json`, all inside §7's included roots, and `digest.ts:69` digests every byte with no field filter — so no pack byte and no `packDigest` moved when `pawn_safe_square`'s meaning changed, and a source-region digest is the only thing that would have caught it. Lane 0.30 is genuinely next-free, the claims block joins character-for-character to its register row, and every §7 population count reproduces at HEAD. **What returns it:** (1) **criterion 4 pins a census that is wrong at source** — `BREADTH_CONVENTION_TEXT` has **8** entries at HEAD (`evidence-catalog.ts:183-190`), so prose conventions are **13**, not 12, and `89+60+13+12+17=191` is satisfiable **only by an implementation that drops a convention** ([[D984]]'s class); the wrong figure also sits in the Summary, §2.4 **and the register row**, so the repair must be one commit or it manufactures a body/register split. (2) **No closure argument, and the enumeration is provably open**: `SimpleTrigger` (6 arms, `packages/schema/src/drill-pack/types.ts:82-89`) has **no census row** — while §2.5 names it as one of exactly two twice-interpreted vocabularies whose two sites criterion 6 asserts — and `TransitionExpression` (5) is likewise absent, while `rules_fact` (3) and `fenPredicate` (4) are **double-counted** as standalone vocabularies though they are fields inside other arms. A census that both omits and double-counts is not a closure; the fix is a **procedure over the schema's 52 `$defs`** and the tree's exhaustive `never` switches, not a hand-count. (3) **Four of criterion 4's five terms are arithmetically wrong**, inherited from the derivation: §3a sums to **90** not 89, §3a-ter to **62** not 60, §3f has **16** rows not 17, and the derivation's own prose says 15 where its heading says 16. (4) **Criteria 8 and 16 are mutually unsatisfiable** — C8 requires `packCapabilities` set-equal the registry while C16 + §5.1's [[D509]] rule requires an unsupported capability to be **absent** from the published set, and every deployment carries at least one (`plan_defense`/`human_external` ship `refused`; `ENGINE_MODE=mock` drops the providers, the literal D509 case §5.1 cites as precedent). (5) **§4.4 does not satisfy `claim-semantic-anchors` §7 and its "byte-for-byte" table is false**: §7 dispatches on a `contract` key **per binding object** (`{id:"claim.binding",version:2}`, refusal `CLAIM_BINDING_VERSION_UNSUPPORTED`) while §4.4 supplies a `requires` array at the **sidecar root** (refusal `SIDECAR_CAPABILITY_UNSUPPORTED`) — different granularity, and §7's Stage A keeps one legacy binding running inside a file the V2 parser also reads, which a per-document declaration makes impossible; §7 also *refuses* an explicit `claim.binding@1` where criterion 15 requires **recording** it. §4.4 must adopt §7's per-binding `contract` grammar rather than assert equivalence with it. (6) **`claim.binding` is required by §4.4 and absent from the enumeration** — register it and criterion 4's 191 breaks; don't and §4.3's `unmet` set refuses **every** sidecar declaring it. **Gate F clauses 5 and 6 are NOT tickable on this draft**: clause 5's policy rests on criterion 16, which contradicts criterion 8; §7's population definition — the strongest part of the document — survives intact, but its tripwire omits `content/packs/` and its criterion-4 sibling cannot be satisfied. Non-blocking corrections are applied in place, including **criterion 15's sidecar population 32 → 68** (the drafted glob dropped all 36 candidate sidecars — §7's own defect class recurring inside a criterion) and five citation errors, among them *"refuse-to-serve, not degrade"* attributed to `docs/drill-client.md:16`, **which contains no such string anywhere in the file**. *(Prior line for history: draft — 2026-08-23.)*
- **Author:** claude (drafted from `planning/platform-alignment/f3-derivation.md`, the HEAD derivation of every surface this document versions)
- **Created:** 2026-08-23
- **Design refs:** `design/research/pack-primitive-stability.md` §6 (R6's six-part model); `planning/platform-alignment/plan.md` Gate F clauses 1, 5, 6, 7
- **Exploration gate:** O6.1 approved as [[D995]] and O6.2 ruled as [[D996]]; `planning/platform-alignment/theory-drill/o5-o6-handoff.md:96` reads verbatim `O6.1 + O6.2 approved → F3 may draft` (line corrected from `:100`, a code fence, by cross-review 2026-08-23)
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

#### §4.4 What an evidence sidecar declares — and why the top-level schema string does not move

**This section exists because a customer asked for it and would otherwise be blocked on the day
this RFC is accepted.** `rfc/claim-semantic-anchors.md` §7 defers its entire compatibility story
here: *"F3 must supply the accepted compatibility declaration that distinguishes the old and new
binding semantics while the top-level evidence sidecar remains `tabiya.sourcing.evidence.v1`, or
require a top-level move. This RFC does not choose a competing syntax."* The declaration it needs
was **absent from this RFC's derived scope** (`f3-derivation.md:798-815` lists six in-scope items,
none of them a sidecar declaration, and never mentions `claim-semantic-anchors`). Absorbing it here
is correct rather than expansionist: this RFC's subject is *how an artifact declares which evaluator
semantics its content requires*, and a sidecar's records are evaluated by claim-binding semantics —
the same class of evaluator-versioned meaning §2.2 defines. Splitting that grammar across two
documents would manufacture a second spelling, which is the exact defect §2.1 exists to kill.

**The declaration is the same `requires` grammar, in the sidecar's own root:**

```jsonc
// evidence sidecar root — schema string UNCHANGED
"schema": "tabiya.sourcing.evidence.v1",
"requires": [
  { "id": "claim.binding", "version": 2 }
]
```

**The top-level `schema` string does not move, and that is §2.1's rule rather than a concession.**
Version-as-data means an artifact's identity names *what it is*, never *which semantics evaluate
it*. `tabiya.sourcing.evidence.v1` identifies the sidecar format — records, abstentions,
`sourcedAt` — none of which changes when claim-binding semantics change. Moving the identity string
to `.v2` would encode an evaluator version inside a name, reintroducing the `@1`/`@v1`/structured
three-spelling defect §2.1 removes. A sidecar whose *format* changes moves its schema string; a
sidecar whose *evaluator semantics* change declares a requirement.

**Absence, and the one honest difference from §4.1.** §4.1 makes `requires` **required** on a pack,
because absence-is-permissive is the failure mode [[D1058]] refused. That argument does not
transfer unchanged: 32 evidence sidecars are already committed with no `requires` key, so requiring
it would invalidate every one of them on landing. The resolution keeps the refusal without
rewriting history — **absence is a pinned default, not an open question:**

| stage | a sidecar with no `requires` | authority |
|---|---|---|
| before the consumer's Stage B | reads as `claim.binding@1` — an **explicit** default, recorded in the parse result, never inferred from body shape | matches `claim-semantic-anchors` §7's dispatch-by-presence rule byte-for-byte |
| after the consumer's Stage B | **refused** with `SIDECAR_CAPABILITY_UNSUPPORTED` | the consumer's own Stage B deletes the legacy path |

So this RFC supplies the **grammar and the refusal code**; the consuming RFC supplies the **stage
timing** at which absence stops meaning v1. Neither invents the other's half. The refusal joins the
same 422 arm as `PACK_CAPABILITY_UNSUPPORTED` (§4.3), and what refusal *does* is Open question 1's
subject for sidecars exactly as it is for packs.

**No seventh register, and this resolves a conditional claims block elsewhere.** The sidecar is not
one of the six shared-resource registers, and `requires` is a key *inside* an artifact this RFC does
not otherwise version — so nothing here claims a lane beyond the pack-schema 0.30 already declared.
`claim-semantic-anchors`' claims block reads *"Refresh this block if F3's accepted contract makes
that seam a registered resource"* — **it does not**, so that block stays `none`. Stated here so the
refresh is a confirmation rather than an investigation.

**The sidecar stamp is inside the sidecar's own digest**, structurally parallel to §4.1's pack rule:
a requirement cannot drift from the records it describes. It is *not* inside `digestDrillPack` — a
pack and its sidecar are separate artifacts with separate digests, and conflating them would make a
records-only edit churn the pack digest.

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
15. **A sidecar declares its evaluator semantics, and absence is explicit (§4.4).** A sidecar
    carrying `requires: [{id: "claim.binding", version: 2}]` parses as v2 with its schema string
    still reading `tabiya.sourcing.evidence.v1`; a sidecar with no `requires` parses as
    `claim.binding@1` **with the default recorded in the parse result**, not inferred; and a
    sidecar requiring a version the runtime does not publish is refused with
    `SIDECAR_CAPABILITY_UNSUPPORTED` on the 422 arm. Fixture: all **68** committed sidecars
    (every document carrying `schema: "tabiya.sourcing.evidence.v1"` — 32 in `content/drafts/` as
    `*.evidence.json` and 36 in `content/candidates/*/evidence.json`; **0** of which carry a
    `requires` key at HEAD) parse as v1 with the explicit default, and one hand-built
    `claim.binding@3` sidecar is refused. *(Corrected from "32, `git ls-files
    'content/**/*.evidence.json'`" by cross-review 2026-08-23: that glob is a naming-convention
    filter over one of the two content roots and silently drops all 36 candidate sidecars — the
    exact defect class §7 exists to kill, recurring inside a criterion.)*
    *Wrong implementation that passes criteria 1–14 and fails this:* one treating a missing
    `requires` as unversioned-and-permissive — the [[D1058]] failure mode, which is why the default
    must be **recorded** rather than assumed.
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
17. **Instruments stay green.** `make verify` passes with `migration-plan-check` and
    `capability-check` wired in.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Open question 1 — what a capability refusal *does*. **Reframed and ruled by [[D1077]]** 2026-08-23: the question is not what we do to the pack but *why the capability is missing*, and there are exactly two causes (§5.1). Gate F clause 5 is **unblocked** | OWNER | the ruling's landing commit | **discharged 2026-08-23 — [[D1077]], `cc98fcb`** |
| D2 | The sacrificial pilot must exercise every **required** 1.0 capability (O6.1 clause 6). This RFC specifies what "required" means (§3's scope decision); membership is F7's | claude | the pilot matrix's landing commit | |
| D3 | Re-stamping all 92 ledger `packDigest` values after the lane-0.30 churn (§4.1) — rides the graduation arm, which [[D949]] holds until Gate F | codex | the implementing commit | |
| D4 | `EVIDENCE_KINDS` has no version axis (7 members, versioned by membership). Whether capability versions cover evidence kinds or they get their own register | claude | the follow-up RFC's landing commit | |
| D5 | Implementation | codex | the implementing commit | |

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

**⚠ The numbers below are STALE and will renumber at landing.** They were written when the head was
D1071; the head has since passed them — **D1073 is codex's** (bot state-directed profile) and
**D1074–D1076 landed at the `assistance-controls` supersede** (2026-08-23). Per the standing
protocol a proposed row takes the next free id **in the commit that lands it**, never the id it was
drafted with. Re-derive against `design/BACKLOG.md` immediately before landing these.


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
