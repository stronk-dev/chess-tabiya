# F3 HEAD derivation — pack capabilities, compatibility and migration

**Written:** 2026-08-23 · **Derived at:** `73a867e` (`rulings D995-D998`) · **Author:** claude

**What this is:** a pre-RFC derivation for **F3** (`planning/platform-alignment/rfc-graph.md:70`).
It pins what exists in the tree, what the approved contract requires, and what the RFC author must
decide. **It is not the RFC and it does not authorize implementation.**

**Working-tree note:** derived against a tree with uncommitted work in `apps/web/src/lib/`,
`apps/web/src/lib/theme/` and `tools/d872-semantic-tactics-harness/` (codex). Nothing in this
derivation depends on those paths; all counts are re-derived from committed content and
`packages/`/`apps/server/` sources, and every command quoted was run at this tree state.

---

## 0. Licensing — F3 may draft

| Check | Source | Result |
|---|---|---|
| Does D995 approve O6.1? | `design/BACKLOG.md:289` — *"**OWNER RULING 2026-08-23 (O6.1): the six-part capability contract is APPROVED**"*; mirrored `o5-o6-handoff.md:109` — *"**O6.1 — APPROVED** ([[D995]]): the six-part capability model as recommended. **F3 may draft**"* | **YES** |
| Does the handoff's dependency line say F3 may draft? | `o5-o6-handoff.md:100` (fenced consequence block) — `O6.1 + O6.2 approved → F3 may draft` | **YES, verbatim** |
| Is O6.2 ruled? | `o5-o6-handoff.md:111` — *"**O6.2 — RULED AGAINST THE RECOMMENDATION** ([[D996]]): no standing budget, "decide per release.""*; `design/BACKLOG.md:290` | **YES — ruled, against the recommendation** |

**The dependency line says "approved", and D996 declined the recommendation.** That is not a gap:
the line's operative condition is that both questions are *settled*, and the ruling row itself draws
the consequence — *"F3 RFC commissioned same day"* (`design/BACKLOG.md:289`). D996 rules O6.2's
substance (no standing budget; per-release measurement stands) rather than deferring it.

**F3 is licensed to draft.** It is not licensed to: choose UX defaults, add chess primitives, apply
the corpus plan, or lift Gate F (`o5-o6-handoff.md:60`). D560's content hold stays whole ([[D949]]).

---

## 1. The approved contract, quoted

`planning/platform-alignment/theory-drill/o5-o6-handoff.md:52-58`, verbatim:

> Approve R6's six-part model: immutable released artifacts; pack-required/runtime-supported semantic
> capability versions; evaluator semantics versioned independently from JSON fields; one read-only
> migration planner plus explicit applier; deprecation with successor/refusal; and a sacrificial pilot
> covering every **required** 1.0 capability.
>
> F3 may implement this framework before the final pilot list exists. It must not choose UX defaults,
> add chess primitives, apply the corpus plan or lift Gate F.

The longer form each clause derives from is `design/research/pack-primitive-stability.md:151-163`
(R6 §6, six numbered items).

### 1a. The D996 amendment F3 must satisfy

Gate F clause 7 now reads (`planning/platform-alignment/plan.md:54`):

> non-mechanical re-authoring cost is **measured and ruled per release**

**What this asks of F3 mechanically:** the planner's output must be a document an owner can *rule
on at a release boundary* — not a number checked against a standing limit. Concretely that means
the plan must (a) separate mechanical from judgement work, (b) state the judgement population by
exact identity, and (c) **refuse to proceed** until the owner has ruled. The repo already ships
that refusal shape twice; see §4c.

---

## 2. What versioning exists at HEAD

### 2a. The six shared-resource registers (`rfc/README.md`)

Live output of `node tools/register-check.mjs` at `73a867e`:

```
pack-schema: head 0.27; next free 0.30
run-schema: head 0.17; next free 0.19
shape-entry-schema: head 0.3; next free 0.5
principle-entry-schema: head 0.1; next free 0.2
migration: head 25; next bot-policy.md (position behind longitudinal-store) -> longitudinal-store.md
  (position behind learner-rating) -> live-sources.md (position behind campaign-core) ->
  campaign-core.md (position behind bot-policy)
evidence-kinds: 7 members; next n/a; claimed citable_text
register-check: 20 active RFCs, 9 live claims, C1-C6 green
```

| Register | Head | Constant / source of truth | Live claims (claimant) |
|---|---|---|---|
| Pack schema | **0.27** | `packages/schema/src/index.ts:2` `DRILL_PACK_SCHEMA_VERSION = "0.27"`; `schemas/drill_pack.schema.json:3` `$id: urn:chess-tabiya:schema:drill-pack:0.27` | **0.28** `graduation-clearance.md` (accepted); **0.29** `pack-population-provenance.md` (draft). **0.30 free** |
| Run schema | **0.17** | `packages/schema/src/index.ts:1`; `schemas/drill_run.schema.json:3` | **0.18** `bot-policy.md` |
| Shape entry | **0.3** | `packages/schema/src/index.ts:3`; `schemas/shape_entry.schema.json:3` | **0.4** `measurement-records.md` |
| Principle entry | **0.1** | `packages/schema/src/index.ts:8`; `schemas/principle_entry.schema.json:3` | — |
| Evidence kinds | **7 members** | `apps/server/src/sourcing/types.ts:57-66` (`EVIDENCE_KINDS`) | member `citable_text` (`pack-population-provenance.md`) |
| Migration | **25** | `apps/server/src/storage.ts:600` `export const STORAGE_VERSION = 25;` | 4 ordered position-claims (see above) |

**Note the evidence-kinds register carries no number at all** — it is versioned by *membership*,
enforced closed at `apps/server/src/evidence-manifest.ts:83` (*"Sourcing evidence kinds are not
closed over the evidence manifest"*). F3 inherits a register with no version axis.

### 2b. `STORAGE_VERSION` and the migration queue

- Constant: `apps/server/src/storage.ts:600` — `export const STORAGE_VERSION = 25;`
- Contiguity invariant: `storage.ts:602-614`, `assertContiguousMigrationVersions` throws
  `` `Storage migrations must be exactly 1..${storageVersion}; received ${versions.join(",")}` ``
- Queue: `storage.ts:3084-3210`, an `as const` array of 25 named entries applied in array order
  (1 `"add and backfill run summaries"` … 25 `"learner ratings, rated games, periods, standings, and marks"`).
- Loop: `storage.ts:3211-3239`. `if (migration.version <= version) continue`; each migration runs
  inside `BEGIN IMMEDIATE` … `PRAGMA user_version = N` … `COMMIT`. Migration **14** alone uses the
  `rebuildsReferencedTables` path with `PRAGMA foreign_key_check`.
- **Newer-database refusal already exists**: `storage.ts:3078-3082` throws
  `` `Database schema ${version} is newer than supported schema ${STORAGE_VERSION}` ``.
  **This is the only "runtime refuses an artifact it cannot serve" mechanism in the tree — and it is
  on the database, not on packs.** F3's pack-side refusal has a precedent to copy exactly.
- The register's own hard-won rule (`rfc/README.md:265-273`): **numbers are assigned at landing,
  not at claim**; a draft claims a *position in the landing order*. F3 must claim a position, not
  an integer, if it needs a migration at all (see §7).

### 2c. `packDigest` / `digestDrillPack`

| Fact | Pin |
|---|---|
| Implementation | `packages/schema/src/drill-pack/digest.ts:57` `canonicalizeJson` (hand-rolled RFC 8785 JCS), `:62` `digestCanonicalJson` (SHA-256 → `` `sha256:${hex}` ``), `:69` `digestDrillPack` |
| Coverage | **Every byte.** `digestDrillPack(pack) => digestCanonicalJson(pack)` — no field filter, no omission list. `version`, `provenance.reviewStatus`, `graduationBlockers` are all inside. Comment at `:68`: *"Digest of the complete pack document, including its version."* |
| Not covered | The schema `$id`. `rfc/README.md:72-74` — *"pack digests are content digests and are unaffected by the `$id`"*. **A pack-schema version bump moves no digest.** This is the load-bearing asymmetry for §7 |
| Where stored | `EvidenceLedger.packDigest?` — **optional** (`apps/server/src/sourcing/types.ts:112-121`) |
| Hard failure on mismatch | **Exactly one site:** `packages/runtime/src/pack-pgn.ts:190-195` throws `PackRunPgnError("PACK_DIGEST_MISMATCH", …)`. PGN export only |
| Registry behaviour | `apps/server/src/pack-registry.ts:274` **computes** the digest and publishes it as `PackSummary.digest`; it **never compares it** to `ledger.packDigest`. A pack with a stale ledger loads and serves normally |

### 2d. `EVIDENCE_DIGEST_STALE` — the audit's "warning only" claim is **CONFIRMED**

Two production emit sites, byte-identical, both explicitly `"warning"`:

```ts
// apps/server/src/sourcing/check.ts:408 and :468
if (typeof ledger.packDigest === "string") {
  const digest = await digestDrillPack(pack);
  if (digest !== ledger.packDigest) issues.push(issue("EVIDENCE_DIGEST_STALE", "/packDigest", `stored ${ledger.packDigest}; current ${digest}; re-confirm evidence`, "warning"));
}
```

The severity default is `"error"` (`sourcing/ledger-validation.ts:34-41`), so `"warning"` here is a
deliberate fourth argument. `valid` keys off error severity only (`check.ts:433-434`, `:475-476`),
and the non-strict branch **downgrades** errors to warnings — there is **no path anywhere that
upgrades a warning to an error**. `make sourcing-check` exits `0` with it present
(`sourcing/sourcing-check.ts:369-378`). It is authoring-CLI only; it is on no server request path.

**Live measurement at HEAD: 26 of 68 pack/ledger pairs are stale** — all
`content/candidates/onramp-*/pack.json`. (Prose at `design/research/authoring-vocabulary-completeness.md:248,325`
says "11"; that figure is stale.) **26 documents are currently drifting invisibly**, which is the
exact condition F3's contract exists to make refusable.

### 2e. What a pack declares — and what it does not

**Answer to the pinned question: a pack declares NO semantic or schema version of any kind.**

Complete top-level key universe over all 92 pack documents (count = documents carrying the key):

```
92 id  92 version  92 title  92 mode  92 phase  92 start  92 objective
92 opponentPolicy  92 feedbackPolicy  92 checkpoints  92 provenance
78 difficulty   64 spine   50 planClasses   50 feedbackClaims   50 deviations
50 concepts     50 authoredBoundary       38 shapes   7 retryVariants
 7 guard         4 timingWindows           4 legs      2 variantOf
```

That is 24 keys, exactly the JSON Schema's `properties`, under `"additionalProperties": false`.
Grepping all 92 for `schemaVersion|formatVersion|schema_version|format_version|capabilities|capability|$schema|specVersion|packFormat` matches **0 files**. `version` is
`{"$ref": "#/$defs/semver"}` — the pack *content* semver (89 packs at `"0.1.0"`, 3 at `"0.2.0"`).

> **Correction to the commissioning brief and to `CLAUDE.md`:** the shipped format is **v0.27**, not
> v0.2. `docs/drill-pack-format.md` is titled for the living format; `CLAUDE.md`'s "drill-pack format
> v0.2" is a stale reference to the era when the doc was written. This is worth a ledger row.

**A pack is format-version-anonymous.** The reader's `DRILL_PACK_SCHEMA_VERSION` is the only version
in play, and it is never written into or checked against the document. This is [[D576]] verbatim
(`design/BACKLOG.md:172`): *"an automatic migrator cannot select a source format, an older self-host
cannot refuse a newer pack by requirement, and a semantic evaluator change is invisible to the
document."*

**Contrast — the repo already stamps sidecars.** Census of the `schema` key over
`content/drafts/` + `content/candidates/` (314 JSON files):

| `schema` value | documents |
|---|---|
| **(none)** | **92** — exactly the pack-shaped documents |
| `tabiya.sourcing.job.v1` | 74 |
| `tabiya.sourcing.manifest.v1` | 74 |
| `tabiya.sourcing.evidence.v1` | 68 |
| `tabiya.sourcing.priority.v1` | 6 |

**Every sidecar is stamped; no pack is.** The stamping precedent exists — but read §7 before
treating it as a cheap win: **all four sidecar families are frozen at `.v1` and none has ever been
bumped**, and there is exactly **one** production read of any of them —
`apps/server/src/expression-census.ts:77`:

```ts
return value?.schema === "tabiya.sourcing.evidence.v1" && Array.isArray(value.records) ? value as EvidenceLedger : undefined;
```

A hardcoded equality that returns `undefined` on mismatch. **A `.v2` ledger would be treated as
absent, silently — not refused.** That is a deprecation-mechanics defect inherited by anything
built on the sidecar stamp.

### 2f. Everything else that carries a version

| Field | Location | Value |
|---|---|---|
| `DrillRun.schemaVersion` (per-run stamp) | written `packages/runtime/src/runtime.ts:221`, `events.ts:372`; read-filtered `storage.ts:1260`, `:1365` | `"0.17"` |
| `runtimeBuildInfo.runSchemaVersion` | `packages/runtime/src/index.ts:728-731` | `"0.17"` |
| capabilities payload `runSchemaVersion` | `apps/server/src/capabilities.ts:92,363` | `"0.17"` |
| `schemaBuildInfo` | `packages/schema/src/index.ts:11-16` | the four heads |
| shape-entry instance `version` | `content/shapes/*.json` | 8 distinct values, `0.1.0`–`0.3.0` |
| principle instance `version` | `content/principles/*.json` | all 13 at `"0.1.0"` |

**Runs stamp and migrate forward. Packs do neither.** That asymmetry is F3's whole subject.

---

## 3. The evaluator surface that needs semantic versions

**This list is the failure mode.** A capability contract that covers the JSON unions but misses the
predicate implementations behind them versions the *spelling* of a pack and not its *meaning*.

### 3a. Pack-facing vocabulary (what an author writes) — the primary unions

Derived from `schemas/drill_pack.schema.json` (**52 `$defs`**) and
`packages/schema/src/drill-pack/types.ts` at HEAD. **The 14 unions below total 89 arms; §3a-ter adds
15 more vocabularies. Treat 89 as a floor, never as the capability count.**

| Vocabulary | Arms | Members | Where the semantics live | What "changing its meaning" looks like |
|---|---|---|---|---|
| `mode` | 4 | `line`, `plan`, `outcome`, `trajectory` | pack orchestrator / branch runtime | re-routing a mode changes which grader ever runs |
| `objectiveType` | 12 | `reach_structure`, `preserve_plan_window`, `execute_break`, `prevent_opponent_plan`, `transition_to_endgame`, `win`, `hold`, `save`, `resist`, `play_until_checkpoint`, `follow_theory`, `run_trajectory` | objective grading | re-defining `hold` vs `save` silently re-grades every endgame pack |
| `successCondition` | 8 | `reach_checkpoint`, `outcome`, `material_balance`, `rules_fact`, `structural_feature`, `timing_window`, `plan_consequence`, `transition_feature` | condition evaluator | a condition that starts failing closed instead of open flips verdicts |
| `structuralFeature` | **18** | `pawn_safe_square`, `outpost`, `backward_pawn`, `isolated_pawn`, `doubled_pawn`, `passed_pawn`, `open_file`, `half_open_file`, `line_blockers`, `direct_attack_count`, `piece_reach_count`, `named_structure`, `bishop_on_shade`, `pawn_count`, `king_opposition`, `piece_count`, `king_zone`, `piece_distance` | `packages/runtime/src/structure.ts` | **the D566/D632 case — see §3d** |
| `structuralExpression` | 8 nodes | `all`/`any`, `not`, `feature`, `mirrored`, `quantified` (×2 forms), `pieceOnSquare`, `plan_signature` | expression evaluator + expansion seam | quantifier scope changes re-truth every composite |
| `transitionFeature` | 6 | `attacked_squares_changed`, `defended_squares_changed`, `slider_lines_changed`, `escape_squares_changed`, `defended_duties_changed`, `move_irreversibility` | `packages/runtime/src/transition.ts` | A3 already found **every transition family lossy** and 0/3,371 observations with squares |
| `engineCondition` | 4 | `engine_eval_swing`, `engine_mate_appears`, `tablebase_category_regression`, `tablebase_dtz_regression` | guard conditions | **threshold drift re-classifies every guard firing** — and there are **0 witnesses corpus-wide** |
| `deviationCost` | 4 | `cp`, `mate`, `unmeasurable`, `category` | deviation classifier | `cost` ships **author-declared and UNBACKED** (`rfc/README.md` 0.21) |
| `tempoVerdict` | 6 (+`unopened` at runtime = 7) | `open`, `in_time`, `over_budget`, `too_slow`, `outpaced`, `premature` | timing-window ledger | a budget-boundary change re-verdicts every window |
| `opponentPolicy.mode` | 7 | `theory_strict`, `human_common`, `plan_defense`, `practical_resistance`, `perfect_tablebase`, `strong_engine`, `human_external` | `apps/server/src/opponent-selector.ts` | Maia band → result transfer is measured at 0.289–0.400 ([[D333]]); a sampler change moves outcomes |
| `checkpointInteraction` | **3** | `intent_capture`, `prediction`, `stated_reasoning` | checkpoint runtime | see gap **G14** — docs say four |
| `fenPredicate` | 4 variants | `type+value`, `type+square+piece`, `type+mode+white+black`, `type+feature` | FEN predicate evaluator | — |
| `rules_fact` | 3 | `checkmate`, `stalemate`, `draw` | rules tier | tier changes (`rulesTier` exists on `guard`) change facts |
| `feedbackPolicy` | 3 | `delayed_checkpoint`, `segment_end`, `immediate_guard` | feedback delivery | reveal timing is meaning, not presentation |

**Plus** `EVIDENCE_KINDS` — 7 members (`sourcing/types.ts:57-66`), unversioned.

### 3a-ter. The rest of the pack-facing surface — 16 more vocabularies, +60 arms

`ObjectivePredicate` **14** (the compiled IR, `objective.ts:73-104`; switch `:239-335` —
`outsideAuthoredBoundary` at `:290-297` decides whether an unlisted move is a deviation at all) ·
`WindowClosing` **4** / `WindowOpening` **3** / `MoveCondition` **2** (`types.ts:119-133`; `tempo.ts:206-246`,
`:135-156`, `:126-133` — `arrival` is opponent-move-only, `release` learner-move-only) ·
`RETRY_VARIANT_KINDS` **5** (`types.ts:27-33`; **no evaluator**, `refused` at `dispositions.ts:77-82`) ·
`AssessmentCategory` **5** (`types.ts:67`; `tablebase.ts:8-14`) · `ReasoningGround` **4**
(`types.ts:157-161`; `reasoning.ts:49`) · `PACK_PHASES` **4** (`types.ts:24`; authored label whose
detector `classifyPhase` `phase.ts:63` **can disagree with it**) · `RootAssessment` **3**
(`types.ts:296-316`; `pack-validation.ts:167-186`) · `DEVIATION_MISTAKES` **3** (`types.ts:59`) ·
`DeviationLocation` **3** (`types.ts:54-57`) · `GraduationEntry.state` **3** (`types.ts:184-206`) ·
`variantOf.relation` **3** (`types.ts:248-251`) · `seedMode` **3** (`drill_pack.schema.json:928`;
feeds `selectionCacheKey` `opponent-selector.ts:263`) · `ShapeReference.relation` **2**
(`types.ts:274`; `prospective` **disables** plan-signature resolution, `pack-orchestrator.ts:49`) ·
`CHECKPOINT_ACTIONS` **1** (`types.ts:18`).

**The same vocabulary is written out four times.** The 18 structural + 6 transition feature kinds
reappear as prefixed strings in `RULES_EVIDENCE_FACTS` (**34 members**,
`packages/runtime/src/evidence-ref.ts:1-36`), again as 18 `STRUCTURAL_PREDICATE_PROJECTION_IDS` and
18 `STRUCTURAL_READING_PROJECTION_IDS` (`evidence-catalog.ts:111-112`), and again in the schema.
Four copies is four places for a capability version to be right in three of them.

### 3a-bis. Interpretation sites — where a pack's meaning is actually decided

| Union | Type | Predicate switch | Second switch over the same vocabulary |
|---|---|---|---|
| `SuccessCondition` (8) | `packages/schema/src/drill-pack/types.ts:333-369` | `apps/server/src/pack-orchestrator.ts:393-459` (guard `SUCCESS_CONDITION_KIND_UNRECOGNISED` at `:454`) | **evidence-ref derivation `pack-orchestrator.ts:462-520`** |
| `SimpleTrigger` (6) | `types.ts:85-91` | `pack-orchestrator.ts:196-231` | **`compiledOpeningTrigger` `pack-orchestrator.ts:306-357`** |
| `StructuralExpression` (8 nodes) | `types.ts:418-427` | `packages/runtime/src/structure.ts:566-578` | `mirrorExpression` `structure.ts:446-487` |
| `structuralFeature` (18) | `types.ts:372-398` | `matchesStructuralFeature` `structure.ts:489-564` | `structuralFeatureKinds` `structure.ts:673` |
| `TransitionExpression` (5 nodes / 6 features) | `types.ts:429-450` | `transition.ts:451-455`, `:435-449` | `transitionReading` `transition.ts:474-489` |
| `ObjectivePredicate` (**14** IR types) | `packages/runtime/src/objective.ts:73-104` | `evaluateObjectivePredicate` `objective.ts:239-335` | — |
| `EngineCondition` (4) | `types.ts:68-72` | `applyRecordedEngineGuard` `apps/server/src/guard.ts:281-323` | defaults `guard-conditions.ts:15-42` |

**Two switches over one vocabulary is a drift vector, and it exists twice.** A capability that
compiles in the predicate switch and not the evidence-ref switch produces a verdict with no
attribution — silently.

**Three special cases the RFC must not miss:**

- **`plan_signature` is never evaluated** — `structure.ts:567` throws; it must be expanded at
  `pack-orchestrator.ts:78-105` from the shape registry. **A pack's meaning therefore depends on
  `content/shapes/*.json` bytes it does not reference by digest.** This is the clearest case in the
  tree where a *non-pack edit changes a pack's meaning*, and no digest or version notices.
- **`named_structure` has 4 ids defined inline** (`carlsbad`, `iqp-white`, `iqp-black`,
  `maroczy-bind`) at `structure.ts:368-393`. Editing `carlsbad`'s file set re-decides every Carlsbad
  pack from a literal in a runtime source file.
- **`retryVariants` (5 kinds, `types.ts:27-33`) is authorable in the schema and has no evaluator**
  — disposition `refused` at `dispositions.ts:77-82`. 7 packs carry it. **The format admits a
  vocabulary the runtime refuses**, which is precisely the state clause 5 exists to make impossible.

### 3b. The evidence manifest — the surface that already has versions

`make evidence-manifest-check` at HEAD:

```
evidence-manifest-check: 95cea96159a9a468fdb758dbda43fa76f10a935b702417fe76395220f3ae9a72 · 35/188/25/210 core · 67/67/15/1 semantic
```

**35 producers / 188 projections / 25 consumers / 210 bindings; 67 semantic events / 67 eligibility
declarations / 15 reasons / 1 selection policy.** (`state-of-the-corpus.md:246` quotes 19/93/23/142
— that predates the collector landings and is stale by roughly 2×.)

The manifest is CI-gated in `make verify` (`Makefile:40-42,57`) and versions two ways:
per-projection `` `${value.id}@${value.version}` `` (`evidence-manifest-check.ts:69`) and a
whole-manifest `digest` (`:76`). Registry: `packages/runtime/src/evidence-catalog.ts`, compiled
manifest at `:992`; totals asserted at `evidence-catalog.test.ts:51`.

**Reconciling the "30 projections" figure.** `rfc/tactical-collectors.md:3` (*"all 30 projections
compile"*) names one closed sub-list, not the surface: `TACTICAL_COLLECTOR_PROJECTION_IDS` = 30
(`evidence-catalog.ts:152-168`). The 188 decompose as 18 structural predicates + 18 structural
readings + 14 transition readings + 11 structural events + 13 transition events + 11 avoidance +
12 breadth + 9 semantic-wave + the tactical/castling/exchange remainder
(`evidence-catalog.ts:111-148`). Neighbouring closed lists: `BREADTH_COLLECTOR_PROJECTION_IDS` 18,
`SEMANTIC_EVENT_PROJECTION_IDS` 67, `EVIDENCE_PRODUCER_IDS` 35, `CURRENT_CONSUMER_OPERATION_IDS` 23
(+2 non-current = 25). **Three of the 25 consumers decide pack meaning at runtime**:
`authoring.predicate` (`:860`), `runtime.objective_condition` (`:861`), `runtime.guard_condition`
(`:862`) — that trio is the narrowest honest definition of "the evaluator surface a pack depends
on", and F3 should say whether it scopes to those three or to all 188.

### 3c. The semantic-version namespace that already exists — and has never moved

Census of `"<identifier>@<n>"` string literals across `apps/server/src` + `packages`:

| Measure | Value |
|---|---|
| Distinct versioned semantic identifiers | **56** |
| Spelled `name@1` | **40** (`rules.*`, `derived.*`, `run.record.*`, `pack.authored.*`, bare convention ids like `outpost@1`, `threat@1`, `space@1`) |
| Spelled `name@v1` | **16** (`tablebase.*`, `explorer.*`, `engine.*`) |
| Spelled as **structured data** | at least 2 — `GRADE_CONVENTION` (`grade.ts:26-28`: `id: "grade-convention"`, `version: 1`) and the manifest's `{id, version}` projection records |
| **Ever bumped past 1** | **ZERO.** `grep -E '@v?[2-9]'` returns nothing |

**Three incompatible spellings of the same idea, 56 string identifiers, not one increment in the
project's history.** Some are type-level literals — `packages/runtime/src/structure.ts:72`
`readonly basis: "maximal_pawn_reach@1";`.

**Fifteen named convention ids carry the semantics of the collectors**: `space@1`
(`structure.ts:123`), `threat@1` / `trapped@1` / `back_rank_susceptible@1` / `defence-duty@1`
(`tactics.ts:13-17`), `legal-exchange@1` (`exchange.ts:8`), `local-non-losing@1` (`mobility.ts:8`),
`candidate-majority@1` / `race-arrival@1` (`pawn-dynamics.ts:11-12`), `king-zone@1` /
`king-shelter@1` (`king-state.ts:8-9`), `material-role-signature@1` (`material-state.ts:9`),
`development@1` (`phase.ts:21`), `mate-proof@1` (`mate-proof.ts:10`), `grade-convention@1`
(`grade.ts:27`).

**And their meaning lives in frozen prose.** `BREADTH_CONVENTION_TEXT` (7 entries,
`evidence-catalog.ts:182-191`) and `SEMANTIC_CONVENTION_TEXT` (5 entries, `:193-199`) are the
normative statement of what these predicates assert — including `mate-proof@1`'s 250,000-node cap
and `pressure-line@1`'s own P1/N3/B3/R5/Q9 role scale. **Editing that prose without moving to `@2`
is the silent-remeaning failure in its purest form**, and nothing in the tree prevents it.

Worse for F3: at `evidence-manifest-check.ts:70` the version is **not data**:

```ts
const declaredSemanticIds = SEMANTIC_EVENT_PROJECTION_IDS.map((id) => `${id}@1`).sort();
```

All 67 semantic events are pinned at `@1` by a **literal inside the assertion**. Bumping any one of
them reddens `make verify` in a way only an edit to the checker can clear. **The version axis F3 is
asked to build on is, at HEAD, a constant.**

### 3d. The worked example: evaluator drift with zero schema change

[[D566]]/[[D632]] is the case the contract exists to catch, and it already happened.

| Fact | Pin |
|---|---|
| What changed | `pawn_safe_square` semantics repaired to use a disclosed `maximal_pawn_reach@1` basis | `design/BACKLOG.md:162` |
| Schema change | **none** — `structuralFeature` kept all 18 arms; pack schema stayed 0.27 |
| Digest movement | **none** — no pack byte changed, so no `packDigest` moved |
| Version movement | **none** — `rules.structural.predicate.pawn_safe_square@1` is still `@1` (`semantic-evidence-check.ts:28`) |
| Measured truth movement | `outpost` went from **10 observations in 1.56% of positions to 0/643**, and **2/717 played firings to 0/717** (`design/BACKLOG.md:228`) |
| Affected content | **3 documents** carrying the predicate — `content/shapes/{knight-vs-bishop,maroczy-bind,open-centre}.json`, named live by `make semantic-evidence-check`. Text spread is wider: **77 occurrences of `outpost` across 10 files**, 30 of them in 8 draft packs |

**Every mechanism the repo has for noticing change reported "nothing changed", while a predicate's
truth value went to zero across the corpus.** D632 remains open precisely because *"the code repair
is not the F3/Gate-F migration."* F3 that versions only JSON fields would reproduce this exactly.

### 3e. The verdict producers — mostly unidentified

**One of thirteen carries a version.** `GRADE_CONVENTION` (`grade.ts:26-28`) has `id` and `version`
as structured data. The rest have a file and a function and nothing else.

| Verdict producer | Semantics at | Output vocabulary | Identifier? |
|---|---|---|---|
| Move-quality grade `moveQualityGrade` | `packages/runtime/src/grade.ts:151-185`; `classFromThresholds` `:114-123` | `inaccuracy`/`mistake`/`blunder` × 3 arms; 4 abstention reasons | ✅ `grade-convention@1` |
| Objective state machine `evaluateObjective` | `packages/runtime/src/objective.ts:388-403` (**first-match-wins**) + `transitionObjective` `:337` | 6 `ObjectiveState` values | ❌ |
| Objective transition legality `assertObjectiveTransition` | `packages/runtime/src/objective-state.ts:39-50`; table `:3-10` | `failed`/`achieved`/`transitioned` are **absorbing** | ❌ |
| Terminal outcome `terminalOutcome` | `packages/runtime/src/outcome.ts:5-16` | `win`/`loss`/`draw` | ❌ |
| Tempo verdict `evaluateWindow` | `packages/runtime/src/tempo.ts:175-276`; **the ladder is `:252-262`** | 7 verdicts (5 gradeable, 2 declared-ungradeable) | ❌ |
| Unauthored tempo default | `tempo.ts:289-291` + `UNAUTHORED_TEMPO_DEFAULTS` `:49-51` (`outpaced → failed`) | — | ❌ |
| Line verdict `lineMembership` | `packages/runtime/src/line.ts:121-165` | `on_line`/`classified_deviation`/`unknown` | ❌ |
| Trajectory verdict `trajectoryVerdict` | `packages/runtime/src/trajectory.ts:135-176` | leg `entered`/`not_entered`, sealed, `stopped` | ❌ |
| Branch decidedness `branchDecidedness` | `packages/runtime/src/branch-scale.ts:43-77` | `decided`/`undecided`/`unknown` + `admitted`/`shortfall` | ❌ |
| Immediate guard `applyRulesGuard` / `applyRecordedEngineGuard` | `apps/server/src/guard.ts:157-179` / `:281-323` | `feedback.generated` | ❌ |
| Reasoning detection `matchKeyPoints` | `packages/runtime/src/reasoning.ts:38-63` | `detected`/`not_detected` | ⚠ `matcherVersion: 1` in the payload (`runtime/src/types.ts:255-266`) — a **fourth** spelling |
| Claim earning `projectAuthoredFeedback` | `apps/server/src/authored-feedback.ts:282`; `MACHINE_LABEL_EVIDENCE_KINDS` `sourcing/claim-binding.ts:170` | `earnedEvidenceTypes` | ❌ |
| Opponent selection | `apps/server/src/opponent-selector.ts:569-583` | selected move + `orderingBasis` | ❌ |

**Ordering is semantics, and it is invisible.** `evaluateObjective` is first-match-wins with
automatic outcome rules ahead of authored ones (`pack-orchestrator.ts:709`); the tempo ladder's
`premature → outpaced → too_slow → over_budget → in_time` cascade *is* the verdict definition.
Neither can be expressed as a capability version keyed on a JSON field.

### 3f. Constants that decide meaning, and the tables that disagree

| Constant | Value | Pin | Hazard |
|---|---|---|---|
| `GRADE_CONVENTION.constants` | report 5/10/15; practice 2.5/6/14; mate ±999/±700; clamp 1000; logistic 0.00368208 | `grade.ts:26-42` | context-keyed (`drill→practice`, `review→report`, `:43-47`); a threshold edit reclassifies every recorded eval pair |
| `MATERIAL_VALUES` | P1 N3 B3 R5 Q9 **K0** | `objective.ts:28-35` | re-decides every `material_balance` condition; reused by the guard (`guard.ts:51`) |
| `EXCHANGE_PIECE_VALUES` | P1 N3 B3 R5 Q9 **K100** | `exchange.ts:10-17` | **⚠ two king values in one runtime** |
| `pressure-line@1` role scale | a third P/N/B/R/Q table, **in prose** | `evidence-catalog.ts:188` | **⚠ three copies of one scale** |
| Rules-guard material trigger | `<= -3` | `guard.ts:172` | an unnamed magic number deciding when feedback fires |
| Guard defaults | `evalSwingCp = 200`, `fireOnMate = true`, `rulesTier = true` | `guard-conditions.ts:20-29` | **every pack omitting `guard` inherits these** — 85 of 92 documents |
| `CATEGORY_RANK` | 9 entries, loss 0 … win 8 | `sourcing/tablebase-category.ts:4-14` | drives `tablebase_category_regression` |
| `RANK` (branch-scale) | **5 entries**, loss 0, blessed-loss 3, draw 4, cursed-win 5, win 8 | `branch-scale.ts:30` | **⚠ a second, smaller copy of the same ordering** |
| Deviation-cost tolerance | ±10 cp equality; `> 30000` throws | `sourcing/deviation-cost.ts:129`, `:89` | slack in the authored-vs-measured contradiction check |
| Phase bands | endgame ≤13, developed ≥18, opening-undeveloped ≥5, middlegame-undeveloped ≤2 | `phase.ts:16-19` | re-labels every position's phase |
| `MATE_PROOF_NODE_CAP` | `250_000` | `mate-proof.ts:11` | lowering converts `proved`/`refuted` → `budget_exhausted` |
| `GLICKO2_CONSTANTS` | 1500/350/0.06/τ 0.5/173.7178/RD 60/0.25 | `rating.ts:40-50` | re-rates every learner |
| `RATED_OPPONENT_CALIBRATION` | 4 rungs → 1312.4/1500/1622.6/1792.2 | `rating.ts:21-38`, self-checked `:100-112` | **pinned to a named engine digest — a Maia bump invalidates it** |
| `neutralTiebreakKey` | sha256 over first 5 FEN fields + `\0` + uci | `opponent-selector.ts:252-260` | changing the hash inputs changes every "equal" selection |
| Practical-resistance slice | `.slice(0, 4)` | `opponent-selector.ts:770` | a hard cap with no name |
| R2 selection policy | 8 / 0.20 / 0.30 / 2 | `evidence-catalog.ts:977` | — |

### 3g. Other registered vocabularies F3 must decide about

`RULES_EVIDENCE_FACTS` **34** (`evidence-ref.ts:1-36`) · `THEORY_EVIDENCE_FACTS` **1** (`:43-45`) ·
evidence-ref namespaces **7** (`:39-50`) · runtime `EvidenceKind` **4** (`runtime/src/types.ts:11`)
· `EvidenceSource` **3** (`:12`) · sourcing `EVIDENCE_KINDS` **7** · `ABSTENTION_REASONS` **4** ·
`CLAIM_ASSERTION_KINDS` **15** (`claim-binding.ts:15-21`) · `MODULE_IDS` **11**
(`module-contract.ts:3-7`) · `BANNED_JUDGEMENTS` **31** / `PRESCRIPTIVE_VERBS` **23** /
`CHESS_LEXICON` **18** (`voice.ts:93-100`) · `TABLEBASE_CATEGORIES` **10** (`tablebase.ts:6`) ·
`PackLintCode` **19** (`lint.ts:17-36`) · `CensusSubjectKind` **7** (`expression-census.ts:25`) ·
run event union **16** (`runtime/src/types.ts:288-303`) · shape entries **25** · principle entries
**13** (`PrincipleBasis` 3).

- **`FORMAT_DISPOSITIONS`** (12 rows, `dispositions.ts:22`) is the nearest thing to a capability
  table — and its own comment (`:21`) says *"**Deliberately not part of the deployment capabilities
  payload.**"*
- **`CAPABILITY_DISPOSITIONS`** (44 rows, `capabilities.ts:120-165`) is the *other* capability
  table, and the two can disagree ([[D228]]); its `surface` values have an **empty intersection**
  with `SURFACE_IDS` (`capability-reality-audit.md` §1).
- **`BOT_POLICY_PROFILES = compileBotPolicyCatalog([])`** (`bot-policy-catalog.ts:238`) — the
  7-kind `BOT_LAYER_KINDS` vocabulary is declared and **unpopulated in the shipped build**.
- **`FEEDBACK_POLICIES` has 3 members** (`schema/.../types.ts:21`) while `RunFeedbackPolicy` has
  **4** (`runtime/src/types.ts:40`, extra `attempt_end`). A 3-vs-4 arity mismatch across the
  pack/run boundary.
- **Opponent modes: 7 declared in the schema, 5 executable** (`drill_pack.schema.json:913-923` vs
  `RUN_OPPONENT_MODES`). **`assertOpponentModeDispositions` (`dispositions.ts:104-122`) is the one
  place the repo already does capability refusal properly, and F3's handshake should be its
  generalisation.** Its four invariants, each a `TypeError` at module load:

  | Invariant | Error code |
  |---|---|
  | every declared value has **exactly one** disposition row | `OPPONENT_MODE_DISPOSITION_MISSING` |
  | disposition is `reached` **iff** the value is executable | `OPPONENT_MODE_DISPOSITION_INVALID` |
  | a `reached` row must name its implementation `site` | `OPPONENT_MODE_DISPOSITION_SITE_MISSING` |
  | no disposition row may describe an undeclared value | `OPPONENT_MODE_DISPOSITION_UNDECLARED` |

  Read as a capability contract: *declared ↔ supported must be total and bidirectional, and support
  must point at code.* That is O6.1 clauses 2 and 5 already working — on 7 values out of ≥149.

---

## 4. The migration planner — inputs, outputs, and the stop rule

### 4a. The three shipped precedents

| Precedent | Read-only? | Population | Result shape | Failure channel |
|---|---|---|---|---|
| `verifyDraft` (`apps/server/src/sourcing/verify-draft.ts:323`) | **NO — it writes** (`:210`, `:316-319`: pack, ledger, manifest, job) | one `FILE` | `{ pack, ledger, manifest, warnings: readonly string[], paths: {ledger, manifest, job} }` (`:44-50`) | **thrown `SourcingError`** — there is no `valid`/`issues` field. 9 throw sites. Soft failures go to `warnings` |
| `clearGraduationEntries` (`rfc/graduation-clearance.md:2357-2360`) | **specified, unbuilt** — `check?: boolean` is the dry-run | one `FILE` + a shared census | `GraduationTransitionResult` → `<stem>.graduation.json`, `schema: "tabiya.graduation.transition.v1"`, with `transitions[]` **and `held[]`** | **all-or-nothing** (§6.5 step 6): *"If any predicate evaluation raises, the command writes nothing and exits non-zero"* |
| `make graduation-plan` (`Makefile:33`, `tools/graduation-clearance-plan.mjs`) | **YES — genuinely.** Imports only `readdirSync, readFileSync, statSync` (`:3`) | whole corpus, **no `FILE` argument** | `schema: "tabiya.graduation.clearance-plan.v1"`, `mode: "read_only"`, with `hold`, `corpus`, `classifier`, `judgementDebt` | `assertKnownPlan` **throws** when the population drifts (`:192-198`) |

The RFC states the separation of powers explicitly (`graduation-clearance.md:2445-2449`):

> **The reporter and the writer are different commands on purpose** — §2.1's rule is that a checker
> *decides*, and a checker that also rewrites the thing it judges is the rubber stamp in a new costume.

### 4b. `make graduation-plan` — actual output at HEAD

```
# Graduation-clearance migration plan (read only)

Corpus: 92 documents / 436 entries.
Draft classifier: 203 rule suggestions + 17 published hand-table assignments; 0 unclassified.
Candidate inventory: 141 recognised emitter entries; 2 non-template entries requiring judgement.
Existing-state backfill: 30 resolved + 43 accepted; 1 removed-referent special case; 5 fixture transitions.

Judgement boundary: Rules produce reviewable candidate kinds only. They do not choose subject pointers, recordKind, placeholder, blockedBy, absentIds, or acceptance rationale.

D560 hold: no schema, content, sidecar, or archive write was performed.
```

Exit 0.

**The audit's summary is individually right and structurally wrong.** *"203 rules + 17 hand
assignments + 2 judgement entries, 0 unclassified"* merges **two different populations**: 203/17/0
are `Draft classifier` fields over `content/drafts/`; the `2` is a `Candidate inventory` field over
`content/candidates/`, whose peer — *"141 recognised emitter entries"* — the audit drops. An
implementer would try to reconcile `203 + 17 + 2` against one population and fail. The audit also
omits the backfill line and the judgement-boundary statement, which is the sentence that actually
constrains a planner. **F3 must not inherit this conflation.**

### 4c. The refusal-on-drift mechanism — build on this

Two shipped tripwires, both in `make verify`:

```js
// tools/graduation-clearance-plan.mjs:197
if (plan.corpus.documents !== 92) errors.push(`corpus document count changed: ${plan.corpus.documents}`);
// :198
if (errors.length > 0) throw new Error(`Graduation plan refused:\n- ${errors.join("\n- ")}`);
```

```ts
// apps/server/src/semantic-evidence-check.ts:25
if (outpostDocuments.length !== 3) throw new TypeError(`Outpost dependency report expected three affected documents, found ${outpostDocuments.length}`);
```

**This is the mechanism D996's per-release ruling needs.** A plan whose measured population is
baked into an assertion cannot go stale silently: the moment the corpus moves, CI goes red and a
human must re-baseline. F3 should generalise it rather than invent a budget-checking machine.

### 4d. What a rulable plan must contain

Proposed minimum, derived from the three precedents plus D996. **This is a proposal for the RFC
author, not a decision.**

| Section | Content | Precedent |
|---|---|---|
| `mode` | literal `"read_only"` | `graduation-clearance-plan.mjs` |
| `hold` | the active ruling, what is allowed, what is forbidden | same tool's `hold` block |
| `population` | **exact document identities**, not a count, for each root walked — and the roots themselves | §6 gap: "92" is currently a property filter |
| `from` / `to` | source and target capability versions **per capability**, not one format number | O6.1 clause 3 |
| `mechanical[]` | per-document deterministic edits, reproducible | R6 §6.4 |
| `judgement[]` | **the exact population** requiring chess/provenance judgement, by document + pointer + the question | O6.2, §6.5 `held[]` |
| `refusals[]` | documents the target runtime would refuse, with the successor or the reason | O6.1 clause 5 |
| `digestConsequences[]` | which pack digests move and which ledgers need re-stamping | §6.5 step 4 |
| `assertion` | the baked population tripwire | §4c |

**The hard rule, stated as F3 must state it:** *a plan with any unresolved chess or provenance
judgement stops and returns to the owner with the exact population; it never becomes an automatic
content wave.* This is O6.2's own sentence (`o5-o6-handoff.md:71-73`) and it must be a **mechanism**
— a non-zero exit and an empty applier — not prose.

---

## 5. Deprecation and refusal at HEAD

### 5a. How the server refuses today

`PACK_INVALID` (`apps/server/src/errors.ts:16`), 10 production throw sites:

| Site | Condition |
|---|---|
| `pack-registry.ts:145` | first-pass `validatePackDocument` fails |
| `pack-registry.ts:259` | second-pass sibling-aware validation fails (catches `variantOf`) |
| `pack-registry.ts:267` | duplicate pack id, **same channel**, `replaceDuplicates !== true` |
| `pack-studio.ts:111`, `:128` | playtest / register with validation errors |
| `principle-registry.ts:57`, `:65`, `:76` | invalid entry, unknown id, duplicate id |
| `shape-registry.ts:57`, `shape-studio.ts:33` | shape analogues |

Other `pack-registry.ts` throws: `:167` re-throw on non-ENOENT `readdir` failure (**a missing
content directory is not an error** — it returns `[]`); `:336` `TypeError("Draft packs may only be
loaded in development mode")` — a bare `TypeError` with no code; `:380` `PACK_NOT_FOUND` → 404.

**Defect found while deriving — `PACK_INVALID` has no HTTP status.** It appears nowhere in
`errorResponse`'s ladder (`rest.ts:559-661`) and falls through to the terminal `: 500` at `:661`.
Its 422 neighbours (`GRADUATION_BLOCKERS_OUTSTANDING`, `PACK_VERSION_NOT_INCREASING`) are mapped;
it is not. An author POSTing a malformed draft gets a 5xx body carrying a client-error code, and
5xx-keyed retry logic will retry a request that can never succeed. **F3's refusal path is a client
error and must be mapped; this needs a ledger row now.** (For the registry throws the status is
mostly moot — they fire during `PackRegistry.load` at boot and crash startup: the documented
*"refuse-to-serve, not degrade"* semantic, `docs/drill-client.md:16`.)

`details` is **spread flat** into the error object (`rest.ts:664-671`), so the wire shape is
`{"error":{"code":"PACK_INVALID","message":"…","source":"…","issues":[…]}}`. Registry sites filter
`issues` to error severity; `pack-studio.ts` does **not**, so warnings leak there and not here.

### 5b. What a "successor" pointer would need

`FORMAT_DISPOSITIONS` (`packages/schema/src/drill-pack/dispositions.ts:1-17`) already has the field:

```ts
export type FormatDispositionKind = "reached" | "refused" | "retired" | "unmeasured" | "impossible";
export interface FormatDisposition {
  readonly pointer: string; readonly value?: string;
  readonly disposition: FormatDispositionKind; readonly reason: string;
  readonly site?: { readonly module: string; readonly symbol: string };
  readonly successor?: string | null;
  readonly removedAt?: string; readonly experiment?: string;
}
```

Gaps for F3: (a) `successor` is a bare `string | null` with **no type saying what it points at** —
a pointer? a capability id? a version?; (b) the table is keyed on **JSON pointers**, so it cannot
express *"this evaluator's meaning changed"* at all; (c) 12 rows against 89 pack-facing arms + 188
projections; (d) it is explicitly excluded from the deployment capabilities payload (`:21`), so
**no runtime ever publishes it and no pack can ever be checked against it**.

Two deprecations shipped as **authoring warnings with no successor mechanism**: `pawn_count` and
`piece_reach_count scope:"every"` (`rfc/README.md` 0.18 — removal *"deferred to wave 4 because
`registered_shapes` rows are immutable"*), and `plan_consequence` (`docs/drill-pack-format.md:321`
— *"remains readable but is deprecated; author `structural_feature` with `plan_signature` instead"*).
**Both successors exist only in prose.**

### 5c. `channel` and `reviewStatus` vs a refusal

| | `channel` | `reviewStatus` |
|---|---|---|
| Type | `"official" \| "community"`, written out 5× in `pack-registry.ts` (`:42,52,82,239`); shapes have the alias `ShapeChannel` (`shape-registry.ts:10`), packs never got one | `"schema_example" \| "draft" \| "published"` (`packages/schema/src/drill-pack/types.ts:225`) |
| Assigned | `pack-registry.ts:358` — `productionPaths.includes(path) ? "official" : "community"`. `content/packs/` is official; everything else community | authored; sole writer is `pack-studio.ts:125` |
| Type safety at runtime | intact | **lost** — widened to `string` at `pack-registry.ts:41`, `apps/web/src/lib/api.ts:37`; `String(...)` at `:407,:434`; missing status becomes `""` (`pack-studio.ts:17-21`). Nothing downstream can exhaustively switch |
| Gates serving? | **No.** `GET /packs` (`rest.ts:1036-1038`) → `PackRegistry.list()` (`:365-367`) maps every record with no predicate. Community and playtest packs list alongside official | **No.** Not consulted on any request path |
| Gates admission? | Yes — `:264` official shadows same-id community (silent `continue`); `:267` same-channel duplicate throws; `:419` community publish cannot overwrite an official id; `pack-studio.ts:130` → `PACK_ID_RESERVED` (409) | Yes — `pack-validation.ts:971-986`: when `"published"`, every blocking graduation entry raises `GRADUATION_BLOCKING_ON_PUBLISHED` and empty `provenance.sources` raises `GRADUATION_REQUIRES_SOURCES`. Both error severity → `PACK_INVALID` at boot |
| Leak | `:419` sets `#records` conditionally but `#digests` **unconditionally** — a shadowed community pack is unreachable by id yet **still reachable via `byDigest`** (`:385`) | — |

**Both gate admission; neither gates service.** And **all 92 documents are `reviewStatus: "draft"`
— zero `published`** (measured), so the strictest validation gate in the tree **has never fired on
committed content**. F3 cannot assume it works; it must prove it against the pilot.

---

## 6. Gate F clauses 5 and 6 as acceptance targets

Quoted from `planning/platform-alignment/plan.md:52-53`:

> - [ ] pack capabilities and deprecations have a compatibility policy;
> - [ ] automatic migration/dry-run passes over every pack and sidecar;

### Clause 5 — what F3 must ship to tick it

| # | Deliverable | Why it is not optional |
|---|---|---|
| 5.1 | A **capability id namespace** with one pinned spelling | 56 identifiers exist in **two** spellings (`@1` vs `@v1`) — §3c |
| 5.2 | A **pack-side required-capability declaration** | 0 of 92 declare anything — §2e; [[D576]] |
| 5.3 | A **runtime-side supported-capability publication** | `FORMAT_DISPOSITIONS` is explicitly excluded from the payload (`dispositions.ts:21`) |
| 5.4 | A **handshake** that refuses before registration, with a mapped status | `PACK_INVALID` currently returns 500 — §5a |
| 5.5 | **Evaluator semantics versioned independently of JSON fields**, covering ≥149 pack-facing arms (§3a + §3a-ter), the 188 manifest projections, the 12 conventions whose meaning is prose (**G22**), and the 12 unidentified verdict producers (**G3**) | D566/D632 moved truth to zero with no field change — §3d |
| 5.8 | Cover **both** interpretation sites per vocabulary (**G23**) and close over resolved shape entries (**G24**) | a capability certified at one switch and absent at the other is worse than none |
| 5.6 | **Deprecation carries a successor or an explicit refusal**, typed | `successor?: string \| null` points at nothing typed; 3 live deprecations have prose successors only — §5b |
| 5.7 | The version must be **data, not an assertion literal** | `evidence-manifest-check.ts:70` hardcodes `@1` for all 67 semantic events — §3c |

### Clause 6 — and the population problem

**The command that would prove it does not exist.** `grep -n "migrat" Makefile` → **0 hits**. The
only `dry-run` string in the tree is a parity assertion about a design doc
(`tools/intent-parity-harness/registry.mjs:63`). The two `migrate-*.mjs` files are one-off,
hard-coded, write-without-dry-run scripts under `planning/archive/`. The nearest instrument
disclaims the job: `tools/r6-pack-stability-harness/README.md:3-4` — *"it does not migrate or
rewrite content."*

**Proposed command shape** (proposal, not a decision), modelled on `graduation-plan` because that is
the only whole-corpus read-only precedent that is CI-gated:

```
make migration-plan          # no FILE argument — walks the corpus itself, read-only
make migration-plan-check    # node --test + the plan >/dev/null, wired into `make verify`
make migration-apply FILE=…  # the separately-invoked applier, per §4a separation of powers
```

Note the convention to inherit: eleven Makefile recipes carry
`@test -n "$(FILE)" || (echo "Usage: …" >&2; exit 2)`, and read-only tools pair
`node --test <tool>.test.mjs` immediately before the tool.

**"Every pack and sidecar" is undefined at HEAD, and this is the sharpest finding in §6.**
Re-derived by walking the tree:

| Population | Count | In `make graduation-plan`? |
|---|---|---|
| `content/drafts/` pack documents | 56 | ✅ all 56 |
| `content/candidates/*/pack.json` | 36 | ✅ all 36 |
| **"92 documents"** | **92** | ✅ |
| `content/candidates/` sourcing documents | 126 | ❌ |
| `content/shapes/` | 25 | ❌ |
| `content/sources/` | 51 | ❌ |
| `content/principles/` | 13 | ❌ |
| `content/witnesses/` | 1 | ❌ |
| **Total non-sidecar documents** | **308** | 92 of 308 |
| Sidecars (`*.evidence/sources/job.json` in `content/drafts/`) | 96 (32 × 3) | ❌ **zero** |
| Sidecars in `content/candidates/` | 126 | ❌ |
| `git ls-files 'content/**/*.json'` | **353** | |

And **the 92 is a property filter, not a corpus walk**. `tools/graduation-clearance-plan.mjs:92-97`:

```js
function documents(root) {
  return files(root).flatMap((file) => {
    const document = JSON.parse(readFileSync(file, "utf8"));
    return Array.isArray(document?.provenance?.graduationBlockers) ? [{ file, document }] : [];
  });
}
```

It walks **two** of six content roots and keeps only documents already carrying the property being
migrated. Reproduced exactly: drafts 56/56 have `graduationBlockers`, candidates 36/162 do, and
56 + 36 = 92. **A format migration planner copying this shape would silently skip every document
that lacks the thing being added — which, for a capability stamp, is all of them.**
F3 must **define** its population, not inherit the number.

---

## 7. Claims analysis — would F3 claim a pack-schema lane?

**Gate F clause 1 requires that no active RFC holds a drill-pack schema lane.** State at HEAD:

| Lane | Claimant | RFC status | Free? |
|---|---|---|---|
| 0.28 | `graduation-clearance.md` | **accepted** 2026-08-17 (`rfc/graduation-clearance.md:3`); re-affirmed *"**Verdict: keep 0.28.**"* at `:2537` | held |
| 0.29 | `pack-population-provenance.md` | **draft** (`rfc/pack-population-provenance.md:3`) — claim **live** in the register (`rfc/README.md:112`, counted among the 9) | held |
| 0.30 | — | reserved prospectively for `shape-layer-parity`, **which does not exist as a file at HEAD** | **free** |

**So clause 1 fails 2-deep today, and an F3 lane claim makes it 3.**

### The two options, honestly

| | **A — pack-schema lane (0.30)** | **B — sidecar / derived capability manifest** |
|---|---|---|
| Where the stamp lives | a new top-level pack key | a `<stem>.capabilities.json` sidecar, or derived from pack content |
| Clause 1 cost | **+1 lane; clause 1 goes 2 → 3 deep** | **zero** |
| Precedent | none — packs stamp nothing (§2e) | strong — **every** sidecar is stamped (`tabiya.sourcing.*.v1`), 222 documents |
| Is it forced? | `"additionalProperties": false` (`drill_pack.schema.json`) means **an author cannot add a field without a schema change**. If the stamp is *author-written*, A is unavoidable | If the stamp is **derived** from what the pack already contains, no new field is needed |
| Digest coupling | the stamp is inside `digestDrillPack` — it moves the pack digest, and every ledger must be re-stamped (§6.5 step 4). **All 92 packs churn** | sidecar-only; pack bytes untouched; **no digest moves** — but then nothing binds the stamp to the bytes except `packDigest`, which is a **warning** (§2d) and is **already stale on 26 documents** |
| Refusal integrity | the runtime refuses on a field it has read from the digested artifact — cannot be detached | a sidecar can be **absent**, and absence currently means "no ledger" not "refuse": `expression-census.ts:77` returns `undefined` on a schema mismatch (§2e). **A missing capability sidecar would default to permissive** unless F3 makes absence a refusal |
| Version-bump precedent | the pack `$id` bumps routinely (27 landed versions) and **moves no digest** (`rfc/README.md:72-74`) | the four sidecar families are **all still `.v1`**; the stamp has **never once** been used as a version |

**The honest answer to "can it be a sidecar":** yes for the *carrying*, no for the *binding*. A
capability requirement whose absence is permissive is not a requirement, and every mechanism that
would make a sidecar's absence fatal (`EVIDENCE_DIGEST_STALE`, the `expression-census` equality) is
today permissive by construction. Option B is only sound if F3 also converts absence and mismatch
into hard refusals — which is a substantial part of the work either way.

**Third option worth naming, because the fork rule requires it:** the stamp may be **derived, not
declared** — the runtime computes a pack's required capability set from the vocabulary it actually
uses (the arms in §3a it invokes), and refuses when its own supported set does not cover it. That
needs **no pack field, no sidecar, and no lane** — and R6 §6.2 already permits it: *"A pack bundle
declares **or deterministically derives** required capability IDs."* Its cost is that the
derivation function becomes itself a versioned capability, and a derivation bug is silent.

**This is the RFC's central claims question and this dossier does not decide it.** [[D576]] states
the same fork in the ledger: *"R6 must choose a derived bundle/capability contract or a stamped
artifact version before Gate F can claim migration safety."* The trade-off in one line:
**a lane claim buys binding integrity at the price of pushing clause 1 further away; a sidecar or
derivation preserves clause 1 at the price of a requirement that can go missing.**

**Migration position:** if F3 needs a `STORAGE_VERSION` bump it claims a *position in the landing
order*, never an integer (`rfc/README.md:265-273`). Four positions are already queued
(`bot-policy` → `longitudinal-store` → `campaign-core` → `live-sources`). On present evidence F3
likely needs **no migration at all** — packs are files, not rows — which is worth stating explicitly
in the RFC rather than leaving to inference.

---

## 8. Gaps — what the RFC author must answer

**Owner-level forks are marked ⚖. Traps are marked ⚠.**

| # | Gap |
|---|---|
| **G1** ⚖ | **Lane, sidecar, or derivation?** §7. The three options with their costs; [[D576]]'s fork restated. F3 cannot be drafted without this answer and it is not claude's to make |
| **G2** ⚠ | **A contract that versions only JSON fields misses exactly the drift it exists to catch.** D566/D632 moved `outpost` truth from 10 observations to 0/643 with **no schema change, no digest movement, no version increment** (§3d). The [[D523]] class — *grammar stated once, assumed elsewhere*. Every acceptance criterion must be tested against this case: **if F3's mechanism would not have flagged D566, F3 is wrong** |
| **G3** ⚠ | **Twelve of thirteen verdict producers carry no identifier** (§3e). Only `grade-convention@1` is versioned. The objective state machine, transition-legality table, terminal outcome, tempo ladder, line verdict, trajectory verdict, branch decidedness, guard, claim earning and opponent selection have a file and a function and nothing else. **The largest determinants of what a pack means are the least identified things in the tree**, and two of them — first-match rule ordering (`objective.ts:388-403`) and the tempo cascade (`tempo.ts:252-262`) — are *ordering* semantics that no field-keyed version can express |
| **G4** | **Three spellings, one idea.** 40 identifiers use `@1`, 16 use `@v1`, and at least two use structured `{id, version}` (`GRADE_CONVENTION`, the manifest records); reasoning adds a fourth as `matcherVersion: 1` in a payload (§3c, §3e). Pick one and state the migration for the rest |
| **G5** ⚠ | **The version is an assertion literal, not data.** `evidence-manifest-check.ts:70` hardcodes `@1` for all 67 semantic events. No capability can be bumped without editing the checker. Decide where version data lives before designing the handshake |
| **G6** | **Define the clause-6 population.** "Every pack and sidecar" is undefined; the quoted "92" is a property filter over two of six content roots (§6). Is the target 92, 308, 353, or 188 (92 packs + 96 sidecars)? State it, and bake it into the tripwire |
| **G7** | **`make graduation-plan`'s summary conflates two populations** (§4b). 203/17/0 are draft-classifier fields; the 2 is a candidate-inventory field whose peer (141) is routinely dropped. Do not inherit the conflation; consider correcting the audit prose in the same commit |
| **G8** ⚠ | **26 of 68 pack/ledger pairs are stale at HEAD** and nothing fails (§2d). `EVIDENCE_DIGEST_STALE` is `"warning"` at both emit sites and no code path upgrades a warning. Does F3 make digest staleness fatal? If not, the binding it relies on is advisory |
| **G9** 🐞 | **`PACK_INVALID` has no HTTP status and returns 500** (§5a). The refusal path F3 builds on presents a client error as a server error, and 5xx retry logic will retry it forever. **Needs a `design/BACKLOG.md` row independently of F3** |
| **G10** | **`successor` is untyped** (`dispositions.ts:14`, `string \| null`) and `FORMAT_DISPOSITIONS` is keyed on JSON pointers, so it cannot express evaluator-meaning change at all. 12 rows against 89 arms + 188 projections. Extend or replace? |
| **G11** | **Three live deprecations have prose-only successors**: `pawn_count`, `piece_reach_count scope:"every"` (removal deferred because `registered_shapes` rows are immutable), `plan_consequence` → `structural_feature` + `plan_signature`. Each needs a typed successor or an explicit refusal under clause 5 |
| **G12** | **`reviewStatus` has never been exercised.** All 92 documents are `draft`; zero `published`. The `pack-validation.ts:971-986` gate — the strictest in the tree — has never fired on committed content. The sacrificial pilot is the first real test |
| **G13** | **`channel` leaks through `byDigest`** (`pack-registry.ts:419` vs `:385`): a shadowed community pack is unreachable by id but still reachable by digest. Does a capability refusal close the digest route too? |
| **G14** | **`checkpointInteraction` has 3 arms in the shipped schema** (`intent_capture`, `prediction`, `stated_reasoning`) while `rfc/README.md` 0.15 calls it a *"closed four-kind union"*. A counted vocabulary that does not match the schema is the D523 class at the register. Reconcile before enumerating capabilities |
| **G15** | **The pack schema is v0.27, not "v0.2".** `CLAUDE.md` and the commissioning brief both say v0.2. Ledger row + `CLAUDE.md` correction (owner's file — propose, do not edit) |
| **G16** | **`EVIDENCE_KINDS` has no version axis** — 7 members, versioned by membership only, with one live member claim (`citable_text`). Does a capability version cover evidence kinds, or do they get their own? |
| **G17** ⚖ | **What does the applier do with a refused pack?** Refuse-to-serve at boot is the documented semantic (`docs/drill-client.md:16`) and it crashes the server ([[D468]] blast radius). Is a capability refusal a boot failure, a listing exclusion, or a per-request 4xx? Clause 5 is not tickable without this |
| **G18** | **D632 stays open until F3 migrates it.** *"all dependent authored uses still require a truth-set dry run and human re-evaluation"* (`design/BACKLOG.md:228`). D632 is the **first customer** of F3's planner and its acceptance test — the plan must produce the 3 predicate-bearing documents (`knight-vs-bishop`, `maroczy-bind`, `open-centre`) as judgement debt, not mechanical work |
| **G19** | **Reconcile the three lane-adjacent RFCs**: `graduation-clearance` (accepted, unbuilt, 0.28), `pack-population-provenance` (draft, 0.29), `measurement-records` (returned, uncommitted revision). `rfc-graph.md:70` requires F3 to reconcile them and to *"include indirect D566→outpost users"* |
| **G20** | **`assertContiguousMigrationVersions` has no pack-side analogue.** Storage refuses a newer database (`storage.ts:3078-3082`); nothing refuses a newer pack. Copy the mechanism explicitly rather than re-deriving it |
| **G21** | **A derived capability set is itself a versioned capability.** If G1 resolves to derivation, the derivation function's own version must be in the handshake, or the contract has an unversioned root |
| **G22** ⚠ | **The convention *prose* is the semantics.** `BREADTH_CONVENTION_TEXT` (7) and `SEMANTIC_CONVENTION_TEXT` (5) at `evidence-catalog.ts:182-199` are the normative statement of what 12 collectors assert, including `mate-proof@1`'s 250,000-node cap. Editing that prose without moving to `@2` is the G2 failure in its purest form. Does F3 digest the convention text? |
| **G23** ⚠ | **Two switches over one vocabulary, twice.** `SuccessCondition` is interpreted at `pack-orchestrator.ts:393` (predicate) **and** `:462` (evidence refs); `SimpleTrigger` at `:196` **and** `:306`. A capability can compile in one and not the other, producing a verdict with no attribution. Any capability enumeration must cover both sites or it certifies half the surface |
| **G24** ⚠ | **`plan_signature` makes a pack's meaning depend on bytes it does not reference.** Never evaluated (`structure.ts:567` throws); expanded from the shape registry at `pack-orchestrator.ts:78-105`. A `content/shapes/*.json` edit re-decides every dependent pack, and no digest, version or lint notices. Same class: `named_structure`'s 4 inline ids at `structure.ts:368-393`. **Does a pack's capability requirement close over the shape entries it resolves through?** |
| **G25** | **Duplicated constant tables that can drift apart** (§3f): king value 0 (`objective.ts:34`) vs 100 (`exchange.ts:16`) vs a third scale in `pressure-line@1` prose; `CATEGORY_RANK` 9 entries (`tablebase-category.ts:4`) vs `RANK` 5 entries (`branch-scale.ts:30`); admitted-category sets duplicated (`tablebase.ts:9` / `branch-scale.ts:24`). Each duplicate is a place a capability version can be right in one copy and wrong in another |
| **G26** | **`retryVariants` is authorable and has no evaluator** — 5 kinds in the schema (`types.ts:27-33`), disposition `refused` (`dispositions.ts:77-82`), 7 packs carry it. The format admits a vocabulary the runtime refuses: exactly the state clause 5 exists to make impossible. Retire it, or give it a refusal that reaches the author |
| **G27** | **`FEEDBACK_POLICIES` 3 vs `RunFeedbackPolicy` 4** (`attempt_end`), and **opponent modes 7 declared vs 5 executable**. The second is handled properly (`dispositions.ts:104-122` asserts the refusals) and is the model; the first is an unreconciled arity mismatch across the pack/run boundary |
| **G28** | **`BOT_POLICY_PROFILES` compiles from an empty list** (`bot-policy-catalog.ts:238`), so `BOT_LAYER_KINDS` (7) is declared and unpopulated. Is an unpopulated vocabulary a capability at version 1, or is it not a capability yet? The answer sets the rule for every other zero-witness family ([[D998]]'s retirement candidates) |
| **G29** | **`RATED_OPPONENT_CALIBRATION` is pinned to a named engine digest** (`rating.ts:21-38`, self-checked at module load `:100-112`). A Maia bump invalidates it. This is the only *engine-artifact-versioned* capability in the tree and the closest existing analogue to O6.1 clause 1 (immutable released artifacts) — cite it rather than inventing |

---

## 9. Recommended scope cut

**In scope for F3 (the smallest thing that ticks clauses 5 and 6):**

1. The capability id namespace, one spelling, version as **data** — G4, G5.
2. The complete capability enumeration: ≥149 pack-facing arms, the 12 unidentified verdict
   producers (**G3**), the 12 prose conventions (**G22**), and both interpretation sites per
   vocabulary (**G23**).
3. Pack-required / runtime-supported handshake with a **typed refusal** and a mapped status — G9,
   G17. Model the refusal on `assertOpponentModeDispositions` (`dispositions.ts:104-122`), the one
   place the repo already refuses a declared-but-unexecutable capability correctly.
4. `make migration-plan` / `migration-plan-check` / `migration-apply`, read-only planner separate
   from the applier, over a **defined** population with a baked tripwire — G6, §4c, §4d.
5. Typed deprecation with successor-or-refusal, absorbing the three live deprecations and
   `retryVariants` — G10, G11, G26.
6. The D566/D632 regression test as the acceptance criterion — **G2, G18**.

**Out of scope, and say so:** pilot membership (O6.3 / F7); UX defaults; new chess primitives;
the corpus apply (D560/D949 hold it whole); lifting Gate F; detector semantics v1 (clause 4, a
separate document); the 14 F1 declared-vs-consumed mismatch rows (clause 3).

**The one-line test for whether the draft is right:** *would this contract have caught D566?*
