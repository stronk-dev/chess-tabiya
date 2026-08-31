# RFC: Skills — concepts earned from play, as a progression surface

- **Status:** draft — 2026-08-23. **Drafted at full depth on the owner's explicit rejection of a
  scope cut** ([[D1232]]): a prior derivation recommended *"do not draft a skills RFC — the first
  visible pixel ships inside the review lane"*, and the owner answered *"well what do you mean no
  rfc at all? does it have the depth we need?"* It did not — that recommendation supplied **one of
  the depth target's five parts, for one game**. **Acceptance is separately gated**: O9
  (`planning/platform-alignment/grounded-coaching/o9-handoff.md`) is ready for the owner and, as
  drafted, covers habit cards, an observation ledger and three modules while **saying nothing about
  credits, marks or tiers** — so ruling O9 alone does not license this document (Open question 6).
  Open question 1 is **acceptance-blocking**.
- **Author:** claude
- **Created:** 2026-08-23
- **Design refs:** `design/01-training-model.md` §"Concepts are cross-cutting tags, not the
  scheduling key" (`:60-65`); `design/03-product-breadth.md:329` (B7 — amendment owed, law 5, Open
  question 9); `design/06-campaign.md:381-386` (the catalogue ruling this document is **not**)
- **Exploration gate:** the owner's commission recorded as [[D1232]]; the drafting mandate
  [[D1093]] does **not** enumerate this lane, and this RFC does not claim that it does
- **Depends on:** `rfc/longitudinal-store.md` (accepted; **100% paper** — zero code at HEAD),
  `rfc/learner-modules.md`, `rfc/move-quality-grades.md`, `rfc/concept-registry.md`; [[D300]]'s
  neutral identity foundation is consumed rather than re-owned (§4)
- **Parent / amends:** — (first RFC in the F9 lane)
- **Supersedes / superseded by:** —
- **Planning:** `planning/skills/` — `full-depth-derivation.md` (769 lines) is the authority for
  every measurement below; `rfc-derivation.md` is superseded **on its crux only** (§2) and remains
  correct elsewhere. Cited here because eight active RFCs cite zero research ([[D1091]]).

```tabiya-claims
none
```

## Summary

This specifies a **skills progression surface**: a named, author-written taxonomy of chess concepts
that a learner **earns by playing**, that **accumulates permanently**, and that is displayed without
ever showing a number about the learner. It answers [[D549]] at the depth the owner asked for —
*"chess.com's skills taxonomy as a progression surface"* — rather than at the depth that was
convenient.

Four findings make it writable today, and all four were missed by the derivation that recommended
against writing it. **Valence is a policy gap, not a mechanism gap**: the evidence contract types
valence as `"none" | "source_required"`, types the authority as a *populatable* ref array, and
validates them with a **biconditional that passes a populated authority today** — no test asserts
emptiness, and five admissible authorities are already enumerated in the prose (§2). **An
authored-valence layer already ships**: 117 authored plans across 25 shapes, 96 of them (82%)
carrying a rules-arithmetic success signature, 21 refused with reasons stated — so the lane needs
*permission to read* an existing procedure, not a new one (§2.4). **A usable taxonomy already
exists** at roughly 36 rows (§3). And **progress can be shown as marks**, a form that already ships
twice and is law-8 clean by construction — an event, no denominator, monotone, unfarmable, linked to
the preserved run (§6).

The document specifies all five parts of the depth target. Where a part cannot be delivered in full
today, the blocker is named and cited — never document size. Two categories of the inherited
five (Openings, Strategy) ship **honestly empty with a stated reason**, because no admissible
authority reaches them yet; that is a deliberate difference from the product being imitated, which
fills them from an undisclosed mechanism.

## Motivation

[[D549]], verbatim:

> **Skills/concepts earned from game review — chess.com's "skills" taxonomy as a progression
> surface (owner, 2026-08-20).** … Owner: *"we need something like THAT too — it can support our
> campaign mode or general progress tracking and gamification."* … **Constraint: a skill is credited
> from detected evidence, never LLM opinion (law 8), so this is downstream of the producer
> registry.**

Four words in that row are the depth target: **taxonomy**, **credited**, **progression**,
**accumulating**. A per-game observation card satisfies none of them — it is one card, once, about
one game, and it is gone next Tuesday. The thing asked for is still there next Tuesday and is *more*
there than it was.

**Why now, and why not earlier.** The lane was priced against a blocker read as structural: that the
evidence catalogue's `valence: "none"` literal meant a skill credit would assert a valence the
producer had refused to declare. §2 shows that reading is inverted. The catalogue's literal is an
**unfilled slot with a compiler-validated filling procedure**, and the procedure has already been
exercised at scale on a different object. That converts the lane from *blocked by architecture* to
*blocked by one owner decision*, which is why this document exists and why Open question 1 is
acceptance-blocking.

**Out of scope, each with a named home and owner** — per [[D1230]], a deferral without a home is not
a deferral:

| Deferred | Home | Owner |
|---|---|---|
| Rates, tiers and reference populations (rung 3 of §7) | this RFC's own §7 ladder, upgraded leaf-by-leaf in place | codex, after the store and ≥8 weeks of play |
| The store's implementation and its four additions | `rfc/longitudinal-store.md` + Discharge D2 below | codex |
| The shapes-family opportunity definition | Discharge D3 below | claude |
| The review surface that renders marks in a move list | `planning/review/rfc-derivation.md` → the Review RFC | claude |
| Style metrics and habit cards | `planning/style/rfc-derivation.md` → the F9 style RFC | claude |
| Campaign consumption of marks as unlock keys ([[D297]]) | `rfc/campaign-core.md` Discharge (module unlocks) | codex |

## Specification

### §1 — The depth target, and what this RFC delivers against each part

Source: `design/research/player-analysis-and-skills.md:56-58` (`[V]`, fetched 2026-08-23), `:60`,
`:84-87`. **Unit: parts of the imitated surface; total: 5.**

| # | The depth target | This RFC | Where |
|---|---|---|---|
| 1 | A **taxonomy**: five named categories filled with named concepts | **Delivered, two-tier.** Five inherited category names over ~36 author-written leaves | §3 |
| 2 | A **credit event**: one point per qualifying move, marked in the move list, mechanism undisclosed | **Delivered and strengthened.** A credit requires a declinable alternative, carries its denominator, names its projection ids and versions, and reopens its exact nodes | §5 |
| 3 | A **per-concept progress display**: a counter against a hidden threshold | **Delivered as a mark**, not a counter (§6); **upgraded to a rate with a tier** where measurement permits (§7). The hidden threshold is refused — a hidden threshold is unfalsifiable | §6, §7 |
| 4 | **Accumulation**: permanent, with sequential unlock | **Delivered.** Marks are monotone and unfarmable; unlock is [[D297]]'s knowledge-as-key, ruled wanted by [[D842]] (*"mastered skills OPEN content, never grade the player"*) | §6.3 |
| 5 | **The loop**: progress + unlock, with a peer-compared drill-down alongside | **Delivered minus peer comparison.** Every mark links to the preserved run. Peer comparison is **refused by construction** — the store has no cross-learner read path (`rfc/longitudinal-store.md:442-455`) | §6, §8 |

**Where we deliberately differ, and why** (`player-analysis-and-skills.md:84-87`): *"we may adopt
their category names and their comparison-to-peers framing; we may not adopt a single one of their
credit or score mechanisms as-is, because **none publishes a denominator, a floor, or a re-derivable
rule**."*

| Axis | Imitated surface | This RFC | Reason |
|---|---|---|---|
| Denominator | none anywhere | `credited ÷ declinable opportunities` | *"grindable by volume and by seeking easy positions"*; [[D842]] |
| Detection | undisclosed | registered projection ids + versions, with `occurred_refs` | law 3 |
| Wording | rating-dependent (`Brilliant`/`Great`) | forbidden — *"selection, yes; rendering, never"* | `rfc/learner-rating.md:990`, AC-11 |
| Empty categories | filled anyway | **shipped honestly empty with the reason** | §8 |

**One honest limit on the target itself.** The `[V]` source describes **categories and a point
counter — never a named-concept inventory**. D549's *"filled with named concepts"* is the owner's own
description, not a verified fetch. **The leaf taxonomy is therefore not inheritable** — only the five
category names are (`:84-87` rules them adoptable). Authoring the leaves is owner work under law 8,
and §3 is structured so the owner can do exactly that.

### §2 — Valence: the policy gap

#### §2.1 What the code says, and what it means

| Site | Code | Reading |
|---|---|---|
| `evidence-contract.ts:108` | `readonly valence: "none" \| "source_required";` | a **second value exists**, and it is a pointer, not a verdict |
| `evidence-contract.ts:123` | `readonly valenceAuthority: readonly VersionedEvidenceId[];` | a **populatable** ref array |
| `evidence-contract.ts:551` | `if ((event.valence === "source_required") !== (row.valenceAuthority.length > 0)) fail("EVIDENCE_EVENT_VALENCE_UNBACKED", …)` | a **biconditional**: it fails on *mismatch*, and **passes a populated authority today** |
| `evidence-contract.ts:552-554`, `:598` | authority must be a literal ref naming a **declared projection**, **bound to the same consumer** | two further constraints, both implemented |
| `evidence-contract.test.ts:228` | the only valence test is a **negative** fixture (valence claimed *without* authority) | **no test asserts emptiness** |
| `evidence-catalog.ts` (×2) | `valence: "none"`, `valenceAuthority: Object.freeze([])` — one literal each, applied across all 67 projections | the **unfilled slot** |

**Normative reading.** `valenceAuthority: []` is an unfilled slot with a documented, enumerated,
compiler-validated filling procedure — **not a refusal**. The refusal in the prose is real and
law-8-grounded, but its form is *"no authority has been admitted yet"*, never *"valence is
forbidden"*: `docs/semantic-evidence.md:41-45` (*"**F2 emits no valence.** A future valenced event
must declare and carry a separately admitted authority"*), and
`rfc/archive/semantic-evidence-selection.md:260-263`.

#### §2.2 The five admissible authorities, and the mechanical admissibility rule

`design/research/selection-sign-and-significance.md:233-236`, canonical:

> **Allowed sources of valence are separate and explicit: an authored claim, a cited theory rule
> with matching antecedents and scope, a disclosed engine-delta convention, a tablebase result, or a
> validated semantic event whose contract includes valence.** Human popularity can establish common
> or unusual, never good or bad.

`EvidenceGrounding` (`evidence-contract.ts:3`) already classifies this, so admissibility is
**mechanical rather than editorial**. **Unit: `EvidenceGrounding` members; total: 9.**

| `grounding` | Admissible as a valence authority | Why | At HEAD |
|---|---|---|---|
| `position_rules` | **yes** | the rules supply the sign | the default (`evidence-catalog.ts:63`) |
| `authored_claim` | **yes** | a human author declared it; law 8 constrains LLMs, not authors | 5 |
| `cited_theory` | **yes**, with matching antecedents and scope | the D530/D531 template | 1 |
| `tablebase_exact` | **yes** | a Syzygy category is a proof | 6 |
| `bounded_search` | **yes**, only with the convention disclosed | *the number is a measurement; the word is a convention* | 10 |
| `declared_convention` | **conditionally** — the convention must be cited | a convention is an authored claim in another hat | 36 |
| `human_model` | **NO** | Maia mass is not authority | 4 |
| `human_corpus` | **NO** | *popularity establishes common or unusual, never good or bad* | 3 |
| `recorded_run` | **NO** | the learner's own history — circular | 11 |

**Normative rule.** A projection may serve as a `valenceAuthority` **iff** its `grounding` is one of
the first five rows. This RFC invents no authority and admits none by itself: Open question 1 rules
whether any may be declared at all.

#### §2.3 The authority that already ships

Measured over `content/shapes/*.json` at HEAD. **Unit: authored plans; total: 117.**

| Quantity | Value |
|---|---:|
| Shapes in the library | 25 |
| Authored plans across them | **117** |
| Plans with a rules-arithmetic `success.signature` | **96 (82%)** |
| Plans left `signature: null` with the reason stated | **21** |
| Plans carrying the literal `RESTATED PLAN.` audit note | **48** |

A plan's `success.signature` **is a valence declaration** — *reaching this state is the achievement
of this plan* — authored by a human, evaluated by rules arithmetic, exposed as the registered
projection `theory.shapes.firing` with `grounding: "authored_claim"` (`evidence-catalog.ts:757`),
loaded and evaluated at `apps/server/src/guidance.ts:121-141`.

**And it already survived the discipline this lane needs** (`planning/content-era/log.md:1983-2005`):
every restatement declares itself with `RESTATED PLAN.`, quotes the original verbatim, and states
what the new census does *not* say; 21 were left null — *"No signature was invented to clear a
null."* The precedent is exact: writing *"distance ≥ 4 means the defence holds"* would be
*"manufacturing a verdict under a census label — ADR-0005 through the content door."*

**Normative consequence.** This lane specifies **no new valence procedure**. It points the existing
one at a second object, and inherits its refusal discipline verbatim: a leaf whose valence cannot be
declared from an admissible authority is **left null with the reason stated**, never filled from a
weaker source.

#### §2.4 What a declaration costs

Three coordinated edits, all validated by machinery that exists:

1. `evidence-catalog.ts` — replace the hard `"none"` with a per-projection lookup defaulting to
   `"none"`, returning `"source_required"` for the admitted set.
2. `evidence-catalog.ts` — replace the hard `Object.freeze([])` with authority refs for those
   projections.
3. Add an adapter binding each authority projection to the eligibility row's consumer, or `:598`
   fails with `EVIDENCE_EVENT_VALENCE_UNBACKED`.

Plus one artefact not in code: the **valence register** (§2.5).

#### §2.5 The valence register

A versioned document, `content/valence/register.json`, one row per admitted declaration:

```
{ projectionId, projectionVersion, authorityId, authorityVersion,
  declarer, declaredAt, scope, basis, note }
```

`basis` is one of the five admissible groundings. `note` carries the `RESTATED PLAN.`-shaped audit
sentence: what was declared, quoting the source. **It is not a shared-resource register** — it
declares no versioned schema and joins no register in `rfc/README.md`; it is content, validated by
the evidence compiler that already exists. Its purpose is that a future reader can see **who said
this is good and on what basis**.

### §3 — The taxonomy

#### §3.1 Two tiers

**Top tier — five inherited category names**, ruled adoptable at `player-analysis-and-skills.md:84-87`:
Fundamentals, Openings, Tactics, Strategy, Endgame. Navigation only; they carry no credit.

**Leaf tier — ~36 author-written rows**, both halves already grounded in a registered projection:

| Source | Count | Registered projection | Standing |
|---|---:|---|---|
| Registered shapes (`content/shapes/`) | **25** | `theory.shapes.firing` (`authored_claim`) | closed registry; validated against a loaded catalogue |
| Genuinely cross-topic concept ids | **~11** | `attempt_concepts` | free text today; §4 closes it |

**Unit: taxonomy leaves; total ≈ 36.** The owner authors only the **assignment** of leaves to
categories, and the **valence authority** for each leaf. Both are author acts under law 8.

#### §3.2 Why the concept vocabulary is 11 and not 168

Measured at HEAD, correcting [[D300]] (stale — the corpus grew):

| Quantity | [[D300]] | Measured 2026-08-23 |
|---|---:|---:|
| Packs declaring `concepts` | 47 | **50** |
| Concept references | 186 | **199** |
| Distinct concept ids | 156 | **168** |
| Ids in ≥2 packs | 24 | **25** |
| Singletons | 132 | **143 (85%)** |

Of the 25 recurring, **~14 are base/trajectory twins or colour mirrors** — 7 shared only between
`mate-bishop-knight` and its trajectory pack, 3 between the two Carlsbad packs, 2 between the
colour-mirrored opening-principles packs, 2 between the two IQP packs. **Genuine cross-topic
recurrence is ~11**: `advance-chain-base` (6 packs), `break-timing` (3),
`arrangement-before-action` (3), `direct-opposition`, `doubled-c-pawns`, `lever-arrival`,
`opposite-castling-commitment`, `outside-passer`, `plan-continuity-across-phases`,
`problem-bishop-first`, `structure-ends-on-a-recapture`.

**Why the 168 are not the taxonomy, and the reason is arithmetic rather than taste.**
`design/06-campaign.md:384-386` already ruled the analogous case: *"a collection screen over a
namespaced-apart vocabulary would display 156 things nobody can complete."* At 143 singletons, a
skills screen over the raw vocabulary shows 143 skills earnable exactly once, in one pack, forever.

**The names are the right kind.** `advance-chain-base`, `break-timing`, `minority-attack`,
`carlsbad-structure`, `outside-passer`, `castle-before-attacking` — human-meaningful, at exactly
D549's grain, written by human authors. The problem is identity, not vocabulary.

**Growth.** The taxonomy grows by **authoring more packs that reuse existing concept ids** — which
is what §4's registry makes possible. The constraint on this lane is authored content breadth, not
detectors.

#### §3.3 Who authors the grouping

| Option | Cost | Law-8 standing | Verdict |
|---|---|---|---|
| **A. Owner authors** the leaf→category assignment and each leaf's authority | one document, owner-tier | clean — an owner is an author | **adopted** |
| **B. Derive mechanically** from projection families | free | clean | **fails the ask** — yields `derived.semantic_avoidance.*`, detector names, not *"back-rank awareness"* |
| **C. Inherit a published taxonomy** | licensing + citation | clean under `cited_theory` | **top tier only** — nobody publishes a bindable leaf inventory (§1) |

**What law 8 forbids, precisely.** An LLM may not *invent* a chess concept. It may (i) render an
author's grouping, (ii) propose a grouping as a ledger row for the owner to rule, and (iii) perform
**mechanical operations over author-written names** — deduplicating `chain-base` into
`advance-chain-base` is a string judgement. A careless merge becomes a chess judgement, which is
Open question 3.

### §4 — Concept registry dependency ([[D300]] factored, not duplicated)

[[D300]] blocks both this lane and the ruled catalogue. [[D2370]] identifies the registry as a
shared resource, so `concept-registry.md` now owns the neutral identity foundation and this RFC is
its Skills consumer. That split prevents Campaign from waiting on Skills' unrelated valence,
taxonomy and learner-claim rulings, or copying a second registry.

**Today:** `apps/server/src/progress.ts:52-59` —
`resolve(packId, raw) { return { key: \`pack:${packId}#${raw}\`, label: raw } }`. There is **no
registry**: `schemas/drill_pack.schema.json:30-34` constrains `concepts` only to `nonEmptyString` +
`uniqueItems`; the single validator is a **warning-severity** slug lint whose own message says
*"Concept … is pack-local and not slug-shaped"* (`packages/schema/src/drill-pack/lint.ts:390-398`);
`pack-validation.ts` has **zero** concept references; and `docs/drill-pack-format.md` — the
authoring contract — **contains the word "concept" zero times**.

`design/01-training-model.md:60-65` already names the fix and its home: *"**A concept registry — ids
defined once, packs referencing them — is an authoring contract and belongs with the pack studio**,
not with the scheduler."*

**Dependency handoff — four parts, none duplicated here:**

1. `concept-registry.md` owns the versioned registry document, schema, compiler and digest.
2. It replaces the pack-scoped resolver with one global `ConceptRef` identity.
3. It widens `same_concept_in_pack` to the cross-pack `same_concept` operation and migrates legacy
   persisted keys atomically.
4. It upgrades lint/publication membership checks and emits the identity-only
   `pack.authored.concept_reference@1` projection.

Skills may consume that compiled `ConceptRef`; it may not parse pack strings, mint labels or carry
a local identity fallback. Skills still owns every semantic layer above identity: category,
valence, opportunity, credit, mark and unlock meaning.

**Why this claims no pack-schema lane, stated so the owner may overrule it.** A registry id already
satisfies `nonEmptyString`, so membership is enforceable by lint and validator without a schema
change. The alternative design — the schema `$ref`ing a registry enum — **is** a pack-schema change,
would claim lane **0.32**, and would take Gate F clause 1 from four pack lanes deep to five. This
RFC takes the no-lane design because it delivers the same identity guarantee, **not** because it is
smaller; Open question 9 puts the choice to the owner with that cost stated.

### §5 — The credit record

A skill credit asserts: *you did X, where X was declinable, more often than a named reference, over
a named window, and someone with standing says X is good.* Every clause is a required field.
**Unit: required fields; total: 12.**

| Field | Why required | Available today |
|---|---|---|
| `skill_id` + version | the taxonomy unit | §3 — new |
| `projection_ids` + versions | law 3; *"old rows are never silently re-meant"* | `learner_observations.projection_id` |
| `valence_authority` ref + version + declarer + date | §2 — *who said X is good* | §2.5 — new |
| `opportunity_definition_id` + version | two rules over one projection are two skills | implicit; **must become explicit** |
| `occurred` / `opportunities` | the rate and its denominator, never separated | present |
| `decisions` | opportunity *density* | present |
| `occurred_refs` / `opportunity_refs` | every number reopens its rows | present |
| **time window** (games + calendar bounds) | floors are meaningless without one | **absent** — only `derived_at`, a derivation timestamp |
| **scope**: phase, time control, opponent band | the tier convention requires all three co-rendered | phase ✓; **time control and band absent** |
| `reference_population_id` + version | `above_reference` is undefined without a pinned distribution | **absent** |
| `floor_id` + measured value | a rate below floor is `insufficient_evidence`, not a small number | **absent, unmeasured** |
| `derived_rev` | versioned recompute | present |

**Architecture, carried verbatim from the accepted store** (`rfc/longitudinal-store.md:489-494`):
rates, floors-cleared, milestones and windows are **consumer arithmetic at read time** over per-run
rows. *"A stored tier would be the first learner-facing number this product ever persisted about a
learner's skill."* **A skill credit is a read-time projection over stored per-run rows plus a
declared valence authority — never a row.** The store has no sentence column, no label column and no
verdict column, and this RFC adds none.

**Four store additions** (Discharge D2 — owner `longitudinal-store`):

1. **Time-control and opponent-band scope** on `learner_observations` or a joinable run dimension.
2. **A calendar anchor per run**, distinct from `derived_at` — `derived_at` moves on every rebuild;
   the game's date does not, and an eight-week early/late split needs the latter.
3. **`theory.shapes` in the ingest set** — the store's own open question 1, and the ingest question
   for the **only shipped family carrying authored valence**.
4. Nothing else. No rates, no tiers, no labels.

### §6 — The mark: parts 3 and 4 delivered without a number

#### §6.1 The form already ships, twice

| | Derived milestones | Durable marks |
|---|---|---|
| Where | `service.ts:938-942`; `GET /progress/milestones` | `learner_marks` (`storage.ts:4615-4622`) |
| Stored? | **no** — recomputed from `progress()` rows at read | yes |
| Kinds | 7 (`first_attempt`, `first_stable`, …) | 3 (bronze/silver/gold) |
| Guarded | `adoption-wave.test.ts:47`: `.not.toMatch(/%\|score\|streak\|rating\|ranking/i)` | the D1151 line |

**Five properties make this law-8 clean by construction**, and each is what a skill credit needs: it
records an **event**, not a trait; it carries **no denominator**, because its denominator is a whole
game; it is **monotone**; it is **unfarmable** (dedupe by kind means repetition earns nothing); and
it **links to the preserved run**, so the claim reopens its own evidence.

#### §6.2 Concept marks

```
kind:       "first_concept:<leafId>"      // leafId ∈ §3's ~36-row taxonomy
occurredAt: the run's end timestamp
sentence:   "First <label> recorded."      // label = the author-written name
link:       { runId, branchId, nodeId }    // nodeId is new, and is the point
authority:  the §2.5 valence-authority ref that makes this leaf creditable
```

**Earned when** (a) the leaf's opportunity rule finds ≥1 legal alternative exhibiting the event
**and** ≥1 declining it, and (b) the played edge exhibits it. Both halves are computable today: the
complete legal-alternative population is implemented and has been run over 261,892 decisions.
**No floor, no reference population, no interval, no store** — a first is an event, not a rate.

**Normative: concept marks extend the DERIVED `milestones()` path and MUST NOT be written to
`learner_marks`.** That table is `mark TEXT NOT NULL CHECK (mark IN ('bronze','silver','gold'))` on
a **STRICT** table — a new kind there is a rebuild migration, and this RFC claims none. The derived
path needs no schema at all. This is the unwritable-record class caught twice this week
([[D1088]]-adjacent), avoided by design rather than by luck.

#### §6.3 How a set of marks reads as progress

**A filled-in taxonomy is the progress display.** ~36 leaves grouped under five category names, each
either *earned on \<date\> — open the game* or *not yet*. The learner's sense of advance is
*"nineteen of the things I can do are things I have now demonstrably done."* The screen **never
computes a nineteen-of-thirty-six percentage** — the same discipline `design/06-campaign.md:381-386`
already requires: *"per-unit mastery marks over a named vocabulary, no number about the learner
anywhere."*

**Sequential unlock (part 4)** is [[D297]]'s knowledge-as-key, ruled wanted by [[D842]]: *"mastered
skills OPEN content, never grade the player."* A mark is a key. **A failed or absent mark MUST NOT
gate campaign advance** — [[D1040]] ruled *"progression is unlocked by PLAYING; WINNING gates the
PRESTIGE layer only"*, and a skills surface that gates the core path has broken a standing ruling.

### §7 — The ladder to rates

A ladder, not a fork: choosing rung 1 does not forgo rung 3, and rung 3 upgrades leaves **in place**.

| Rung | Object | Needs | Available |
|---|---|---|---|
| 1 | **Mark** — *"first minority attack executed"* | §3 taxonomy, §2 valence, the shipped milestone shape | **as soon as Open questions 1–3 are ruled** |
| 2 | **Reading with a denominator** — *"you avoided leaving a piece loose; N% of your legal moves would not have"* | already ruled learner-facing by [[D745]](2), post-commit and review only | run-local today; cross-run needs the store |
| 3 | **Rate with a tier** — `established` → `above_reference` → `distinctive` | floors, reference populations, transfer arms | store + measurement — **≥8 weeks of real play** ([[D1170]]) |

Rung 3 is the differentiator — the denominator is the only defensible reason to build this at all —
and it is the one thing no schedule shortens. **Rungs 1 and 2 are not consolation prizes; they are
the surface.**

### §8 — What this refuses

1. **A skill level.** A number about the learner, refused twice: on [[D1151]]'s reasoning and
   independently on arithmetic grounds. **Selection, yes; rendering, never.**
2. **A hidden threshold.** Unfalsifiable by construction, and the imitated surface's least
   defensible part.
3. **Peer comparison.** The store has **no cross-learner read path by construction**
   (`rfc/longitudinal-store.md:442-455`). The *framing* is adoptable; the mechanism is not.
4. **Filling an empty category from a weaker detector.** Openings and Strategy admit **zero**
   credits today: opening identity establishes *applicability*, not accuracy, and structure/pawn/
   king/activity events are neutral until an outcome or cited-theory join supplies valence. They
   ship **empty with the reason stated**. *"An empty category is not filled from a weaker detector."*
5. **Outcome correlation as a valence authority.** Not among the enumerated five; lift, rarity, Maia
   mass and Explorer frequency are refused by name. Admitting it would be the first time a statistic
   creates a chess judgement in this product. Open question 2, recommended **refused**.
6. **Skills as the catalogue with valence added.** [[D1171]]: the catalogue is lawful **because** it
   claims nothing about the learner; adding valence would destroy it. Two objects, two screens, one
   shared prerequisite (§4).
7. **Inheriting R12's floors.** 25–200 games came from 200 blitz games per account over 59 hours;
   only two opening habits quote measured floors and **neither has a production projection**.
8. **Citing `skills.*@1` as production ids.** They are research vocabulary
   (`tools/r20-skills-taxonomy/registry.ts`, zero hits in `packages/runtime/src`); citing them would
   repeat the [[D921]] placeholder-id defect.

### §9 — Ledger-row lifecycle

| Row | Flips when |
|---|---|
| [[D549]] | this RFC is implemented through rung 1 |
| [[D300]] | `concept-registry.md` lands (registry + resolver + query + lint + migration) |
| [[D1191]] | corrected by this RFC's §2 — already recorded as [[D1220]] |
| [[D1193]] | withdrawn — already recorded as [[D1232]] |
| [[D297]] | when §6.3's unlock binds in `campaign-core` |

## Deviations from design

**One.** `design/03-product-breadth.md:329` records **B7 — return** as *shipped 2026-08-13* with
*"Cross-pack concept identity deliberately absent (a studio/B11 contract)"*. §4 lands exactly that
identity, so a skills progression surface **amends a row the intent tier marks shipped**. That
amendment is owner-tier under law 5 and is proposed as a ledger row (Open question 9's neighbour),
**never written into `design/03` by this RFC**.

## Acceptance criteria

1. **The valence register exists and every admitted row names one of the five groundings.** A row
   whose `basis` is `human_model`, `human_corpus` or `recorded_run` fails validation. *A wrong
   implementation that passes:* none — the grounding set is closed at `evidence-contract.ts:3`.
2. **Every admitted valence declaration passes the shipped biconditional.** Fixture: a projection
   with `valence: "source_required"` and a populated, declared, consumer-bound authority validates;
   the same projection with an empty authority fails `EVIDENCE_EVENT_VALENCE_UNBACKED`. **Both arms
   required** — the second is the existing negative fixture at `evidence-contract.test.ts:228` and
   must stay red-when-broken.
3. **No leaf carries a valence from an inadmissible grounding.** An assertion over the register
   joined to `EVIDENCE_ELIGIBILITY_DECLARATIONS`; red if any row's authority resolves to one of the
   three refused groundings.
4. **The taxonomy is exactly the author-written set.** `content/concepts/registry.json` ∪
   `content/shapes/` ids set-equals the leaf column of the taxonomy table; **a leaf naming an id in
   neither fails.** *Unit: leaves; expected total at landing: ≈36* — the criterion asserts
   set-equality, not the count, so authoring more packs does not break it.
5. **Concept identity is global.** Two packs declaring `break-timing` resolve to one key. Fixture:
   two fixture packs, one concept id, one resolved key; **red before §4's resolver lands.**
6. **`same_concept_in_pack` returns cross-pack rows.** Red at HEAD (`AND a.pack_id = ?`), green
   after §4.3. *A wrong implementation that passes:* one that swaps the resolver and leaves the
   query — which is precisely why this is a separate criterion.
7. **Registry membership is enforced at publication.** A pack declaring a non-registry concept id
   fails `make pack-check` at **error** severity. Red at HEAD (warning-severity lint only).
8. **A concept mark is earned exactly once.** Fixture: a run exhibiting the leaf twice produces one
   mark; a second run produces none. Dedupe by kind.
9. **A concept mark is never written to `learner_marks`.** Assertion: `learner_marks.mark` values
   remain set-equal to `{bronze, silver, gold}` after a run earning concept marks. *This is the
   criterion that would have caught the closed-CHECK trap.*
10. **A mark requires a declinable alternative.** Fixture: a forced position exhibiting the leaf
    earns **no** mark (no alternative declined it). *A wrong implementation that passes:* one
    crediting on occurrence alone — the imitated surface's exact defect.
11. **Every mark reopens its evidence.** Each emitted mark's `link.nodeId` resolves to a node whose
    played edge exhibits the leaf's event.
12. **The surface computes no ratio.** Extend the shipped copy guard
    (`adoption-wave.test.ts:47`) to the skills surface: no `%`, `score`, `streak`, `rating`,
    `ranking`, and additionally no `\d+\s*/\s*\d+`.
13. **Empty categories state their reason.** Openings and Strategy render a stated reason string,
    not an empty list and not a zero. Red if either renders a count.
14. **No skill state gates campaign advance.** A grep-able assertion that no campaign progression
    predicate reads a mark or credit. Guards [[D1040]].

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | The rate-and-tier arm (rung 3 of §7): floors measured for the five candidates at 25/50/100/200, reference populations pinned, transfer arms run. Gated on ≥8 weeks of real play ([[D1170]]) — calendar, not effort | claude | `planning/skills/` | |
| D2 | The four store additions of §5: time-control/opponent-band scope, a calendar anchor distinct from `derived_at`, `theory.shapes` in the ingest set, and nothing else — no rates, no tiers, no labels | longitudinal-store | `rfc/longitudinal-store.md` | |
| D3 | The shapes-family **opportunity definition** — the store's own open question 1 names the obstacle: *"a shapes family needs its own opportunity definition, which is not the legal-alternative population."* The largest genuinely new design in this lane | claude | `planning/skills/` | |
| D4 | Rendering marks inside the review move list — the display half of depth-target part 2 | claude | `planning/review/` | |
| D5 | Binding marks as campaign unlock keys ([[D297]]/[[D842]]), without gating advance ([[D1040]]) | codex | `rfc/campaign-core.md` | |
| D6 | The `design/03-product-breadth.md:329` B7 amendment — cross-pack concept identity is that row's one named omission and this lane's prerequisite | OWNER | the ruling's landing commit | |
| D7 | v1 implementation per this specification, criteria 1–14 | codex | the implementing commits; ledger flips per §9 | |

## Open questions

**1. May valence be declared at all? — ACCEPTANCE-BLOCKING.** §2 shows `valenceAuthority: []` is an
unfilled slot with a compiler-validated filling procedure, not a refusal. (a) **Yes**, from the
enumerated five → the lane opens and a skill credit becomes a legitimate object. (b) **No**, keep
`"none"` across all 67 permanently → **this RFC is withdrawn** and D549 is answerable only as the
catalogue. (c) **Yes, but only** `position_rules` and `tablebase_exact` → the five R20 candidates
only; Openings and Strategy stay empty permanently. *This document turns on this question.*

**2. Is "measured outcome correlation" a sixth valence authority?** (a) Admit it under a disclosed
convention → most of the 47 habit-only projections become creditable, and a statistic creates a
chess judgement here for the first time. (b) Refuse → Strategy stays honestly empty until a
cited-theory join exists. **Recommend (b)**, on [[D1171]]'s reasoning.

**3. Who authors the taxonomy, and may claude merge synonyms?** 18 near-duplicate pairs measured at
Jaccard ≥ 0.5 (`advance-chain-base` ~ `chain-base`, `doubled-c-pawns` ~ `doubled-pawns`). (a) Owner
merges → correct, costs owner time. (b) Claude proposes merges as a table, owner ratifies → merging
author-written strings is a string judgement. (c) Leave them → visible duplicates.
**Recommend (b)**, every merge quoting both originals per §2.3's discipline.

**4. Marks now, or rates only?** (a) Ship rung 1 once 1–3 are ruled → a real surface within §4/§6's
small work, upgraded in place. (b) Wait for rung 3 → nothing ships for ≥8 weeks after a store that
has zero lines today. **Recommend (a)**; it is a ladder, not a fork.

**5. May a five-category navigation exist over two honestly-empty categories?** (a) Five, two empty
with a stated reason. (b) Three. (c) Five, filling Openings from cited theory first (gated on the
theory join).

**6. Does O9's ruling extend to credits, marks and tiers?** As drafted it covers habit cards, an
observation ledger and three modules and **says nothing about credits, marks or tiers**. Ruling O9
alone leaves this RFC unlicensed.

**7. Does the store ingest `theory.shapes`, and who writes its opportunity definition?** (a) No at
landing, yes at rev 1 (the store's own proposal) → the authored-valence route defers one rev.
(b) Yes at landing → the opportunity definition must be written first, and nobody has.

**8. [[D1190]] is owed and is a prerequisite for question 4.** [[D1151]] was ruled on the premise
*"the first number this product has ever shown a learner about themselves"*, and `RatingScreen.svelte`
already ships a rating with disclosures and band marks. The ruling may stand; **the ground given for
it was false when given**, and that ground is the reason rates were refused.

**9. Registry membership by lint, or by schema?** §4 takes the lint design, which claims **no pack
lane**. Schema-enforced membership claims lane **0.32** and takes Gate F clause 1 from four pack
lanes deep to five. Stated so the owner may overrule; this RFC does not decide it by preference.

## Ledger rows

Written **unnumbered** per [[D1130]] — ids assigned at landing; head was **D1234** at drafting.

1. 💡 **A concept mark is the shippable full-depth v1, and it is a small extension of shipped code.**
   `milestones()` already produces event records with a run link, dedupes by kind, and is
   copy-guarded. Adding `first_concept:<leafId>` needs no floor, no reference population, no
   interval and **no store** — and must not touch `learner_marks`, whose `mark` column is a closed
   CHECK on a STRICT table.
2. 🐞 **[[D300]] is under-priced everywhere it is called "one injectable class."** Landing it also
   requires dropping `AND a.pack_id = ?` from `same_concept_in_pack` (`storage.ts:2708-2714`) — its
   only product consumer stays pack-scoped otherwise — plus the registry `design/01:60-65` names as
   an authoring contract. And `docs/drill-pack-format.md` documents `concepts` **zero times**.
3. 📊 **The depth target's leaf taxonomy is not inheritable.** The `[V]` source describes categories
   and a point counter, never a named-concept inventory; D549's *"filled with named concepts"* is
   the owner's description, not a verified fetch. Only the five category names are adoptable.
4. 💡 **Law 5: a skills progression surface amends `design/03-product-breadth.md:329`**, a row the
   intent tier marks shipped, whose one named omission is this lane's prerequisite.
5. 🐞 **`rfc/tactical-collectors.md:108-113` binds new-collector authors to `valence: "none"` on a
   stale count** — it says 33 shipped semantic-event declarations; HEAD has 67.
6. 🐞 **`docs/evidence-contract.md:114` defers valence to "a later RFC" and names no RFC.** If
   question 1 is ruled (a), that RFC is this one and the doc needs the pointer.
7. 💡 **Route [[D861]] and [[D865]] out of F9** — both are pack- or position-scoped over shipped
   data and need none of this lane's blockers, yet both are parked behind it.

## Changelog

- 2026-08-23: created, at full depth, on the owner's rejection of a scope cut ([[D1232]]). Drafted
  from `planning/skills/full-depth-derivation.md`; supersedes `planning/skills/rfc-derivation.md` on
  its crux (§2) only.
