# RFC: Pack capability contract — semantic versions, handshake, deprecation and migration

- **Status:** draft — **six blockers repaired 2026-08-23, ready for re-review.** All six return-class findings are fixed, and three of them dissolved together rather than being patched. **(1) The census is no longer a hand-count.** §3.1 replaces it with `make capability-census`, a **derivation procedure** over four roots — the schema's 52 `$defs`, the tree's exhaustive `never` switches, the named evaluators without a vocabulary, and the manifest by reference — with `CAPABILITY_DECLARATIONS` asserted **set-equal to its output by id**, and the HEAD count baked only as a drift tripwire. That kills blockers (1), (3) and (6) at once: the four wrong terms cannot recur because no arithmetic is asserted; `SimpleTrigger` (6 arms) and `TransitionExpression` (5 nodes) are enumerated by rule 1 rather than omitted; and **`claim.binding` is registered**, so §4.3's handshake admits the sidecar declaration instead of refusing every artifact that names it. **The corrected HEAD figures, re-derived at source:** §3a sums to **90** (not 89), §3a-ter to **62** (not 60), `BREADTH_CONVENTION_TEXT` has **8** entries so conventions are **13** (not 12), §3f has **16** rows (not 17) — primary total **206** including the two omitted unions and `claim.binding`. **(2) Criteria 8 and 16 no longer contradict each other.** §4.2 now publishes the **supported projection** — `reached` ∪ `temporarily_unavailable` — rather than the whole registry, which is what §5.1's [[D509]] rule and §4.3's `unmet` computation already required; publishing everything is now the *named wrong implementation*. Verified premise: **every deployment carries at least one unsupported capability** (`FORMAT_DISPOSITIONS` ships 5 `refused` rows including `plan_defense` and `human_external`). **(3) §4.4 adopts `claim-semantic-anchors` §7's grammar instead of asserting equivalence with it.** The declaration is a `contract` key **per binding object**, not a `requires` array at the sidecar root — because §7's Stage A keeps one legacy binding running *inside a file the V2 parser also reads*, which a per-document declaration cannot express. The second refusal code is **withdrawn**; this seam has one code and it is the consumer's (`CLAIM_BINDING_VERSION_UNSUPPORTED`). F3 supplies the grammar and the registration; §7 keeps the dispatch, the stage timing and the refusal, and this RFC now cites them rather than restating them. **What survived the review untouched and is not disturbed:** the [[D566]] acceptance test is real (criterion 13's three predicate-bearing documents are exactly `content/shapes/{knight-vs-bishop,maroczy-bind,open-centre}.json`, all inside §7's included roots, and `digest.ts:69` digests every byte with no field filter — so nothing shipped would have caught that drift and a source-region digest is the only thing that would), lane 0.30 is genuinely next-free, the claims block joins character-for-character to its register row, and every §7 population count reproduces at HEAD. **Gate F clause 5 was already unblocked by [[D1077]] and clause 6 is unblocked by §7's population definition — the criterion-8/16 contradiction that blocked clause 5's policy is now gone.** *(Prior line for history: draft — returned to author 2026-08-23 on six return-class blockers; before that: draft — 2026-08-23.)*
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
(`f3-derivation.md` §2e). Meanwhile the meanings a pack depends on live in **≥163 pack-facing
vocabulary arms across 32 vocabularies**, 188 manifest projections, **13** conventions whose
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

`BREADTH_CONVENTION_TEXT` (**8** entries — `localNonLosing`, `candidateMajority`, `kingZone`,
`kingShelter`, `materialRole`, `pressureLine`, `squareControl`, `pawnRelations`) and
`SEMANTIC_CONVENTION_TEXT` (5 entries) at `packages/runtime/src/evidence-catalog.ts:182-196` are the
**normative statement** of what **13** collectors assert — including `mate-proof@1`'s 250,000-node cap and `pressure-line@1`'s own
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
resolves through. The requirement records the resolved entry's `id` **and its content digest**, so
a shape edit invalidates the requirement rather than silently re-deciding the pack. This is G24's
remedy and it is the only part of the contract that reaches outside pack bytes.

### §3. The capability enumeration

`CAPABILITY_DECLARATIONS` (`packages/runtime/src/capability/registry.ts`, new) is a closed array.
**Unit: one declaration per capability subject. Total at landing: the census below, asserted by
criterion 4.**

#### §3.1 The census is DERIVED by a procedure, never hand-counted

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
| 4 | **Manifest projections** | absorbed **by reference**; they already carry `{id, version}` | `make evidence-manifest-check` (188 at HEAD) |

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
| Manifest projections | 188 | by reference, unchanged |

**`claim.binding` is a registered capability** (a `verdict_producer` subject, `sourcing/claim-binding.ts`),
which is what makes §4.4's declaration legal: §4.3's `unmet = pack.requires \ runtimeSupported`
refuses every artifact declaring an unregistered capability, so a sidecar requiring `claim.binding`
would have been refused by the draft's own handshake. Registering it does not "break the count"
because **no hand-count is asserted any more** — this is the third blocker the procedure dissolves
rather than patches.

The 188 manifest projections **already carry `{id, version}` records** and are absorbed by reference:
§2.1's parse rule adopts them without rewriting them, and criterion 5 removes the literal that pins
them.

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

`GET /capabilities` gains `packCapabilities`. **It publishes the SUPPORTED projection, not the
whole registry** — `{id, version, disposition}` for every declaration whose capability this
deployment actually carries.

**This was a return-class contradiction and is now resolved.** The drafted criterion 8 required the
response to *set-equal the registry* while criterion 16 and §5.1's [[D509]] rule require an
`unsupported` capability to be **absent** from it. Both cannot hold: **every deployment carries at
least one unsupported capability** — `FORMAT_DISPOSITIONS` ships **5** `refused` rows including
`plan_defense` and `human_external` (`dispositions.ts:25,31`), and `ENGINE_MODE=mock` drops the
providers, which is the literal D509 case §5.1 cites as its own precedent.

**The rule, normative:** `packCapabilities` = the registry's `reached` ∪ `temporarily_unavailable`
rows. `unsupported`, `refused`, `withdrawn` and `deprecated`-without-a-reached-successor are
**absent**. This is not a weakening — it is what makes §4.3's `unmet = pack.requires \
runtimeSupported` compute the right thing with no extra field, which §5.1 already asserted and
criterion 8 contradicted. Publishing the whole registry is now the *named wrong implementation*,
because it makes `unmet` empty for a capability the operator never deployed.

`FORMAT_DISPOSITIONS`' own comment (`packages/schema/src/drill-pack/dispositions.ts:21`) says it is
*"deliberately not part of the deployment capabilities payload"* — which is exactly why no pack can
be checked against it today. This publication is the fix; `FORMAT_DISPOSITIONS` is absorbed as the
`vocabulary_arm` subset (criterion 8).

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

**What F3 supplies, and what it does not.** F3 owns the **grammar and the vocabulary**: a `contract`
value is a `CapabilityId` (§2.1's structured `{id, version}`, never a suffix string), and
**`claim.binding` is a registered capability** (§3.1) so §4.3's handshake admits it instead of
refusing every sidecar that names it. F3 does **not** own the dispatch, the stage timing, or the
refusal code — those are §7's, and this RFC now **cites** them rather than restating them. There is
**one** refusal code for this seam, `CLAIM_BINDING_VERSION_UNSUPPORTED`, and it is the consumer's;
`SIDECAR_CAPABILITY_UNSUPPORTED` is **withdrawn from this RFC**, because minting a second code for
one seam is the second-spelling defect §2.1 exists to kill.

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
4. **The census is DERIVED, not asserted as an integer (§3.1).** `make capability-census` enumerates
   subjects from the four roots, and `CAPABILITY_DECLARATIONS` **set-equals its output** — id set,
   not just cardinality. A separate baked baseline reddens when the derived count drifts, and the
   baseline is produced by *running* the procedure, never hand-summed. *Wrong implementation that
   passes a count but fails this:* one hand-maintaining a list that happens to total the baseline.
   *What the returned draft did:* asserted `89+60+13+12+17=191`, of which **four terms were wrong**
   (§3a is 90, §3a-ter is 62, conventions are 13, constant tables are 16) and which **omitted
   `SimpleTrigger` and `TransitionExpression` while double-counting nothing it declared** — so the
   criterion was satisfiable *only* by an implementation that dropped a convention. Fixture: adding a
   `$defs` union with no declaration fails; adding a declaration with no enumerable subject fails.
5. **No version literal survives in an assertion.** A tree-wide check finds zero occurrences of a
   hardcoded `@1`/`@v1` suffix inside a test or checker assertion, including
   `evidence-manifest-check.ts:70`. Red at HEAD; green only when the literal is replaced by data.
6. **Site completeness.** Every capability whose vocabulary has two interpretation sites declares
   both. Fixture: removing the evidence-ref site from `SuccessCondition`'s declaration fails.
7. **Requirement scope.** A pack's derived requirement set draws only from the three
   pack-meaning consumers; a projection outside them can never appear in a `requires` array.
   Fixture in both directions.
8. **`FORMAT_DISPOSITIONS` is absorbed, and `packCapabilities` publishes the SUPPORTED projection
   (§4.2).** All 12 rows appear as `vocabulary_arm` declarations, and `GET /capabilities` returns
   `packCapabilities` = the registry's `reached` ∪ `temporarily_unavailable` rows — **not the whole
   registry**. *Wrong implementations, both named:* publishing an empty array; and publishing every
   declaration including `unsupported`/`refused`, which makes §4.3's `unmet` set compute empty for a
   capability the operator never deployed and silently admits a pack this deployment cannot serve.
   Fixture: with `plan_defense` `refused`, it is absent from `packCapabilities` and a pack requiring
   it is refused. *(This criterion contradicted criterion 16 in the returned draft — both are now
   the same rule stated once in §4.2.)*
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
15. **A sidecar declares its evaluator semantics in the CONSUMER's grammar (§4.4).** A binding
    object carrying `contract: {id: "claim.binding", version: 2}` parses as V2 with the sidecar's
    schema string still reading `tabiya.sourcing.evidence.v1`; a binding object with **no** `contract`
    key follows `claim-semantic-anchors` §7's dispatch-by-presence — legacy path in Stage A, refused
    after Stage B — and **this RFC asserts no default of its own**; any `contract` whose id or version
    is not exactly `claim.binding`/`2` is refused with **`CLAIM_BINDING_VERSION_UNSUPPORTED`**, the
    consumer's code, in **both** stages. Fixture: all **68** committed sidecars (every document
    carrying `schema: "tabiya.sourcing.evidence.v1"` — 32 in `content/drafts/` as `*.evidence.json`
    and 36 in `content/candidates/*/evidence.json`; **0** of which carry a `contract` key at HEAD)
    parse through the Stage-A legacy path, and one hand-built `claim.binding@3` binding is refused.
    Additionally: `claim.binding` **resolves in the registry** (§3.1), so §4.3's handshake admits a
    sidecar declaring it. *Wrong implementations, both from the returned draft:* one declaring
    `requires` at the **sidecar root**, which cannot express §7's Stage A — a single file holding one
    legacy binding while the V2 parser reads the rest; and one minting a second refusal code for this
    seam. *(Corrected from "32" by cross-review 2026-08-23: `git ls-files 'content/**/*.evidence.json'`
    is a filename-convention filter over one of two content roots and drops all 36 candidate
    sidecars — the exact defect class §7 exists to kill, recurring inside a criterion.)*
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
  **§4.2 publishes the supported projection** (`reached` ∪ `temporarily_unavailable`), resolving the
  criterion-8/16 contradiction — verified premise: 5 `refused` rows ship, so every deployment carries
  an unsupported capability. (4) **§4.4 rewritten onto `claim-semantic-anchors` §7's per-binding
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
