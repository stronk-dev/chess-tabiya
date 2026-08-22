# Capability staleness — how stale are the 50 packs against the platform at HEAD?

**Measured:** 2026-08-23 at `73a867e`. Working tree dirty only in `apps/web/` and
`tools/d872-*` (held by another agent); **no file under `content/` was touched by this
measurement**, and `git log --oneline e3c239c..HEAD -- content/` → **0 commits**, so every
corpus number below is also the number the 2026-08-23 audit
(`planning/content-era/state-of-the-corpus.md`) measured one commit earlier. They reproduce
exactly.

**Method:** every figure names the command or `file:line` that produced it. Nothing is
estimated. The commissioning question was the owner's hypothesis:

> *"the packs were written when we had way fewer capabilities to build on."*

**The hypothesis is true about the platform and false about the packs.** Both halves are
measured below, and the distinction is the entire finding.

---

## 0. The answer in one paragraph

Nine platform capabilities landed 2026-08-21/22, after the last pack was authored. **Zero of
the nine can be named by a pack**, because `schemas/drill_pack.schema.json` sets
`"additionalProperties": false` at the root (`:149`) over the 24 top-level properties declared
at `:19-148`, none of which is a module, preset, grade, collector, projection, bot-profile or
capability field. The pack format itself has not
moved: `DRILL_PACK_SCHEMA_VERSION = "0.27"` has been the shipped value since **2026-08-15**
(`43c6c4a`) — *before the last three packs were written* — and the only edit to the schema file
after 2026-08-16 is `75154d6`, a one-word description typo fix. **The 50 packs were authored
against exactly the format that ships at HEAD.** What they under-use is not new capability; it
is capability that already existed when they were written. The re-authoring gain is real but it
is almost entirely one join — 43 claim-record pairs whose evidence is already sitting in the
pack's own sidecar — not a vocabulary upgrade.

---

## 1. What vocabulary the packs actually use

### 1.1 Scope

`ls content/drafts/*.json | grep -v -E '\.(evidence|job|sources|browser)\.json$' | wc -l` →
**50**. This excludes the 96 sidecars and 6 browser fixtures exactly as the audit's census does
(`state-of-the-corpus.md:54-63`; `isPackDocumentName` at `apps/server/src/pack-registry.ts:186-192`).

Authoring dates, from `git log --diff-filter=A` over each of the 50:

| Created | Packs |
|---|---|
| 2026-08-12 | 3 |
| 2026-08-14 | 30 |
| 2026-08-15 | 14 |
| 2026-08-16 | 3 |

Last modification: **40 packs at 2026-08-16**, 10 at 2026-08-21. The commissioning brief's window
is confirmed to the day.

### 1.2 The format's expressive surface

Walking `schemas/drill_pack.schema.json` (v0.27) and collecting every declared property and every
`enum`/`const` member:

| Measure | Count |
|---|---|
| `$defs` types | **52** |
| Distinct declared property names | **171** (276 def-qualified) |
| Enum-bearing properties | 39 |
| Distinct declared enum members | **232** |
| **Total expressive surface** | **403** |

### 1.3 Coverage — what fraction the corpus uses

| Surface | Declared | Used by ≥1 of 50 packs | Coverage |
|---|---|---|---|
| Property names | 171 | 143 | **83.6 %** |
| Enum members | 232 | 129 | **55.6 %** |
| **Combined** | **403** | **272** | **67.5 %** |

Enum matching is `(property-name, value)`, which **over-credits** the shared `kind` discriminator
(a value used at any one `kind` site counts as used at all of them). The 55.6 % is therefore a
ceiling; the true figure is lower. That direction is deliberate — it makes the under-use claim
conservative.

### 1.4 Top-level primitive frequency

| Primitive | Packs (of 50) | | Primitive | Packs |
|---|---|---|---|---|
| `id`,`version`,`title`,`mode`,`phase`,`difficulty`,`start`,`objective`,`concepts`,`planClasses`,`spine`,`checkpoints`,`opponentPolicy`,`feedbackPolicy`,`deviations`,`feedbackClaims`,`provenance` | **50** | | `retryVariants` | **7** |
| `authoredBoundary` | 49 | | `guard` | **6** |
| `shapes` | 38 | | `timingWindows` | **4** |
| | | | `legs` | **3** |
| | | | `variantOf` | **2** |
| | | | `engineCondition`, `legShapes`, `legOpponentPolicy`, `prediction` | **0** |

Reproduces `state-of-the-corpus.md:365-378` exactly.

### 1.5 Condition / rule kinds

The `kind` discriminator declares **74** members across the condition, expression, trigger,
deviation and graduation families. **50 are used, 24 are never used by any pack:**

```
alternate_plan_class, attacked_squares_changed, category, claim,
defended_duties_changed, defended_squares_changed, engine_eval_swing,
engine_mate_appears, out_of_scope, outcome, outpost, passed_pawn, pawn_count,
pawn_safe_square, piece_reach_count, rules_fact, same_root_new_defense,
same_root_other_side, shape_plan, spine_move, structural,
tablebase_category_regression, tablebase_dtz_regression, timing_window
```

Most-used, by occurrence count across the 50: `cp` 157, `feature` 114, `piece_count` 60,
`pieceOnSquare` 51, `all` 43, `owner_ruling` 40, `not` 37, `structural_feature` 35, `terminal` 27,
`engine` 20.

### 1.6 Claim kinds — the whole evidence vocabulary a claim may name

`$defs.feedbackClaim.evidenceTypes` (`schemas/drill_pack.schema.json:1066-1090`) is a **closed
7-member enum**. It is the *only* place a pack names an evidence capability. Across 196 claims:

| `evidenceTypes` member | Claims | Packs | Ladder rung (`design/05-in-run-experience.md:70-77`) |
|---|---|---|---|
| `author_principle` | 82 | 35 | 5 |
| `corpus_observed` | 60 | 31 | 4 |
| `derived_feature` | 43 | 29 | 0 |
| `tablebase_exact` | 37 | 12 | 1 |
| `hypothesis` | 24 | 21 | 5 |
| `engine_validated` | 8 | 3 | 2 |
| **`human_model_predicted`** | **0** | **0** | **3 — the Maia rung, unused** |

`human_model_predicted` has been in the schema since **2026-08-10** (`92e60d3`,
`git log -S'human_model_predicted'`). It is not a new capability the packs missed; it is a
two-day-old capability at authoring time that they declined.

### 1.7 Modes

`mode` (root) and `opponentPolicy.mode` are separate closed enums.

| Root `mode` (4 declared, 4 used) | Packs | | `opponentPolicy.mode` (7 declared, **3 used**) | Packs |
|---|---|---|---|---|
| `line` | 20 | | `human_common` | 28 |
| `plan` | 14 | | `theory_strict` | 20 |
| `outcome` | 13 | | `perfect_tablebase` | 2 |
| `trajectory` | 3 | | **`plan_defense`** | **0** |
| | | | **`practical_resistance`** | **0** |
| | | | **`strong_engine`** | **0** |
| | | | **`human_external`** | **0** |

All seven opponent modes have existed since **2026-08-10** (`92e60d3`). Four have never been used.

### 1.8 Evidence references — the sidecar binding vocabulary

A pack references machine evidence in exactly one other place: `claimBindings[].spans[].assertion.kind`
in its `*.evidence.json` sidecar. The registry is closed at
`apps/server/src/sourcing/claim-binding.ts:16-20` — **15 assertion kinds**, landed **2026-08-16**
(`5a63225`, *"feat: make authored claim backing payable"*) and unchanged in vocabulary since
(`7944ecb` on 2026-08-21 removed 6 lines and added 3, none of them ids).

| Corpus-wide | Value |
|---|---|
| `claimBindings` entries | **1** |
| Assertion kinds used | **4** — `tablebase.category@v1`, `tablebase.pieceCount@v1`, `tablebase.lineUniformCategory@v1`, `tablebase.moveCategory@v1` |
| Assertion kinds **never used** | **11** — `tablebase.dtm@v1`, `tablebase.dtz@v1`, `tablebase.moveCensus@v1`, `tablebase.uniqueMoveOfCategory@v1`, `engine.centipawns@v1`, `engine.depth@v1`, `explorer.total@v1`, `explorer.scorePct@v1`, `explorer.moveSharePct@v1`, `explorer.window@v1`, `explorer.ratingBand@v1` |

**This is the one capability that genuinely arrived at the buzzer** — it landed on 2026-08-16, the
same day the last three packs were created and the day 40 packs were last touched.

### 1.9 Registry references

| Registry | Entries | Referenced by ≥1 pack | Unreferenced |
|---|---|---|---|
| `content/shapes/` | 25 | **21** | `hanging-pawns`, `knight-vs-bishop`, `up-an-exchange`, `vancura` |
| `content/principles/` | 13 | **12** | `activity-has-a-price` |
| `concepts[]` | *no registry* | 168 distinct strings | free-form |

Both registries were **last touched 2026-08-16** (`git log -- content/shapes/` → `1471ed4`;
`content/principles/` → `5a63225`). Neither has grown since the packs were written.

---

## 2. What exists NOW that they could not have used

Nine capabilities landed after 2026-08-16. `git log --since=2026-08-16 -- packages/ apps/ workers/`
shows **nothing between 2026-08-17 and 2026-08-21** — the log jumps `9b61825` (08-17, a CI pin) to
`a64e6c5` (08-21). All nine land in a two-day burst.

### 2.1 The decider: can a pack reference it?

The test is mechanical, not editorial. `schemas/drill_pack.schema.json:149` sets
`"additionalProperties": false` over the 24 top-level properties declared at `:19-148`. A pack
that names anything outside that closed set **fails `make pack-check`**. The schema contains:

```
grep -ci module|preset|collector|projection|longitudinal|rating|campaign|assistance|capabilit
  schemas/drill_pack.schema.json  →  0 for every term
```

The three apparent hits are collisions: `"degraded"` (`:346`), `"gradeOutpaced"` (`:785`, a
`timingWindow` boolean unrelated to move-quality grades) and `"both"` (`:551`). And:

```
grep -c 'rules\.\|derived\.\|live\.\|recorded\.\|human\.\|theory\.' schemas/drill_pack.schema.json  →  0
```

**The pack schema contains not a single evidence-projection namespace. The two vocabularies are
disjoint sets.**

### 2.2 The nine capabilities

| # | Capability | Available since | Defining file:line | Vocabulary | Pack-referenceable? | Packs using |
|---|---|---|---|---|---|---|
| 1 | **learner-modules** | 2026-08-22 `2a54d05` | `packages/runtime/src/module-contract.ts:3-7` | 11 ids: `rules_floor`, `sight_on_request`, `blunder_prevention`, `threat_radar`, `postcommit_nudge`, `structure_nudge`, `theory_breadcrumb`, `guided_hint`, `compare_coach`, `review_map`, `full_inspector` | **NO** — no schema hook | **0** |
| 2 | **move-quality-grades** | 2026-08-22 `13d6e63` | `packages/runtime/src/grade.ts:3-12`, `:26-48` | 3 classes (`inaccuracy`/`mistake`/`blunder`), 3 arms, 3 contexts, 4 abstention reasons; `grade-convention` v1 | **NO** | **0** |
| 3 | **intent-presets** | 2026-08-22 `3b95ff3` | `packages/runtime/src/presets.ts:5-13` | 7 contexts (`pack`,`position`,`imported`,`match`,`stream`,`academy`,`onramp`) × 5 presets (`quiet`,`guided`,`theory_only`,`support`,`analysis`) = 24 admitted / 11 refused (`:91-92`) | **NO** | **0** |
| 4 | **longitudinal-store** | RFC accepted 2026-08-22 `3a4aade` | **no implementation file** — `rfc/longitudinal-store.md:163-206` only | 2 tables, 3 decision classes | **NO** — and not runtime-existent either | **0** |
| 5 | **bot-policy** | 2026-08-22 `7f97b13` | `apps/server/src/bot-policy-catalog.ts:5-13`, `:238` | 7 layer kinds; **profile roster is empty**: `BOT_POLICY_PROFILES = compileBotPolicyCatalog([])` | **NO** — and `opponentPolicy.mode` remains the same closed 7-member enum from 2026-08-10 | **0** |
| 6 | **tactical collectors** | 2026-08-22 `237d3d7` | `packages/runtime/src/evidence-catalog.ts:151-168` | **30 implemented** (count pinned at `evidence-catalog.test.ts:155-158`); the `fork_allowed` fallback pair never taken; rule-of-the-square verdict withdrawn (`rfc/tactical-collectors.md:757`) | **NO** — and the RFC says so: *"the authorable pack vocabulary is deferred (§2.2)"* (`:861`) | **0** |
| 7 | **breadth collectors** | 2026-08-22 `5d8c7b6` | `packages/runtime/src/evidence-catalog.ts:170-180` | **18**, all compile | **NO** | **0** |
| 8 | **semantic collectors** | 2026-08-21 `7701e46` → 2026-08-22 `c7132a2` | `packages/runtime/src/evidence-catalog.ts:142-148`; `rfc/semantic-collectors.md:697-716` | **14 registered, 12 compile, 2 held** (`derived.pawn.promotion_race_geometry`, `…_tablebase`, asserted absent at `evidence-catalog.test.ts:91`) | **NO** | **0** |
| 9 | **F1 evidence manifest** | 2026-08-21 `2b68103` | `apps/server/src/evidence-manifest-check.ts`; data at `packages/runtime/src/evidence-catalog.ts` | **188 projections, 35 producers, 25 consumers, 210 bindings** (pinned at `apps/server/src/evidence-manifest.test.ts:40`); sha256 digest identity, no version integer (`evidence-contract.ts:617`) | **NO** | **0** |

**Nine of nine are runtime machinery invisible to pack authors.** A pack does not opt into a
collector; the runtime applies the manifest to whatever the pack declares. The one place the two
tiers touch is `feedbackClaim.evidenceTypes` — 7 members, unchanged since 2026-08-10 — and the
sidecar assertion registry — 15 kinds, unchanged since 2026-08-16.

Two of the nine additionally have **no executing vocabulary at all**: `longitudinal-store` has no
source file (`grep -rn -i longitudinal packages/ apps/ workers/ schemas/ content/` → 0 hits), and
`bot-policy`'s profile catalog is literally empty by ruling D970. A pack could not use those even
if the schema had a hook.

---

## 3. The gap, concretely

### 3.1 The capability table

| Capability | Available since | Pack-referenceable? | Packs using (of 50) | What a pack would gain |
|---|---|---|---|---|
| learner-modules (11 ids) | 2026-08-22 | **No** | 0 | Nothing — modules select *themselves* against the manifest |
| move-quality-grades | 2026-08-22 | **No** | 0 | Nothing declarable; grading is a runtime projection |
| intent-presets (7×5) | 2026-08-22 | **No** | 0 | Nothing; the preset is a learner setting, not pack content |
| longitudinal-store | 2026-08-22 (RFC) | **No** | 0 | Nothing; not implemented |
| bot-policy profiles | 2026-08-22 | **No** (roster empty) | 0 | Nothing today; **later**, if a lane widens `opponentPolicy.mode` |
| tactical collectors (30) | 2026-08-22 | **No** (§2.2 deferred) | 0 | Nothing declarable; runtime-applied |
| breadth collectors (18) | 2026-08-22 | **No** | 0 | Same |
| semantic collectors (14) | 2026-08-21/22 | **No** | 0 | Same |
| F1 manifest (188 projections) | 2026-08-21 | **No** | 0 | Same |
| — *pre-existing, pack-referenceable* — | | | | |
| `evidenceTypes.human_model_predicted` | 2026-08-10 | **Yes** | **0** | Rung 3 of the assistance ladder — the Maia human model — currently unreachable from content |
| `opponentPolicy.mode` × 4 unused | 2026-08-10 | **Yes** | **0** | `plan_defense`, `practical_resistance`, `strong_engine`, `human_external` resistance profiles |
| Assertion kinds × 11 unused | 2026-08-16 | **Yes** | **0** | Engine-cp, DTM/DTZ and all five explorer assertions in claim text |
| Condition `kind` × 24 unused | ≤ 2026-08-16 | **Yes** | **0** | Passed pawns, outposts, engine-swing deviations, tablebase regressions, timing-window triggers |
| Declared properties × 28 unused | ≤ 2026-08-16 | **Yes** | **0** | `prediction`, `materialBalance`, `keyPoints`, `stockfishGuardCp`, `phrases`, … |
| Registry entries × 5 unreferenced | ≤ 2026-08-16 | **Yes** | **0** | 4 shapes, 1 principle already authored and sitting idle |

### 3.2 The headline number

**Pack-referenceable capabilities that exist and zero packs use: 147 distinct vocabulary items.**

| Class | Count |
|---|---|
| Schema enum members declared and never used | 103 |
| Schema property names declared and never used | 28 |
| Sidecar assertion kinds declared and never used | 11 |
| Shape-registry entries never referenced | 4 |
| Principle-registry entries never referenced | 1 |
| **Total** | **147** |

Counted coarsely instead — one row per named capability rather than per vocabulary item — the
number is different and more important:

> **Of the nine capabilities that landed after the packs were authored, the number that a pack
> can reference is ZERO. Of the 147 pack-referenceable vocabulary items that zero packs use,
> the number that landed after 2026-08-16 is ZERO** — 11 landed *on* 2026-08-16 (the assertion
> kinds) and the remaining 136 pre-date the first pack.

**The owner's hypothesis is therefore inverted by the measurement.** The packs are not stale
relative to a platform that grew past them. The platform grew in a direction packs cannot address,
and the vocabulary the packs under-use was already on the shelf when they were written. Staleness
is not the diagnosis; **under-exploitation of a stable format is.**

---

## 4. What a re-authoring pass would actually buy — one pack, before and after

Pack chosen from the audit's low-debt shortlist (`state-of-the-corpus.md:390`):
**`lucena-bridge-convert`** — endgame / `outcome` / v0.1.0, 2 blocking, 4 claims, 3 withheld,
0 bound, 6 sources, debt 5. It is chosen because its structural twin
`philidor-third-rank-hold` holds the corpus's only working binding, so the before/after is not
hypothetical: it is one file copied onto another.

### 4.1 What it declares today

19 of 24 top-level properties. 4 claims:

| Claim id | `evidenceTypes` | Delivered to the learner? |
|---|---|---|
| `lucena-is-won` | `tablebase_exact` | **NO — withheld** |
| `bridge-not-squeeze` | `tablebase_exact`, `author_principle` | **NO — withheld** |
| `distance-decides-scheme` | `tablebase_exact`, `author_principle` | **NO — withheld** |
| `result-not-moves` | `author_principle` | yes |

Its sidecar `lucena-bridge-convert.evidence.json` holds **22 `tablebase_result` records and 1
`position_legality` record** — and **no `claimBindings` key at all** (the key is absent from the
document, not empty).

### 4.2 What the learner sees, and why

`apps/server/src/authored-feedback.ts:274-280`:

```ts
export function admittedFeedbackClaimIds(pack: PackRecord): ReadonlySet<string> {
  return new Set((pack.document.feedbackClaims ?? []).flatMap((claim) =>
    claim.evidenceTypes.every(
      (label) => MACHINE_LABEL_EVIDENCE_KINDS[label] === undefined || pack.boundClaimIds.has(claim.id),
    ) ? [claim.id] : [],
  ));
}
```

and `:306` filters the feedback page to that set. **A machine-labelled claim that is not bound is
removed from the page entirely** — not greyed, not caveated, absent. Today a learner finishing
`lucena-bridge-convert` reads exactly one sentence, the 152-character `result-not-moves` author
principle. The three sentences that state the tablebase facts — the reason the pack exists — are
silently dropped, while the tablebase records that prove them sit in the adjacent file.

### 4.3 What it could declare against the platform at HEAD

Nothing in the pack document changes. One key is added to the sidecar, in the shape
`philidor-third-rank-hold.evidence.json` already ships:

```json
"claimBindings": [
  { "claimId": "lucena-is-won",
    "pointer": "/feedbackClaims/0/text",
    "textSha256": "sha256:…",
    "spans": [
      { "assertion": { "kind": "tablebase.category@v1",  "args": { "fen": "1K6/1P1k4/8/8/8/8/r7/2R5 w - - 0 1" } }, "span": "won"  },
      { "assertion": { "kind": "tablebase.pieceCount@v1", "args": { "fen": "1K6/1P1k4/8/8/8/8/r7/2R5 w - - 0 1" } }, "span": "five" }
    ] } ,
  …
]
```

Three additional assertion kinds it could reach that no pack has ever used: `tablebase.dtm@v1`
and `tablebase.dtz@v1` (to make *"distance decides the scheme"* a cited number rather than a
phrase) and `tablebase.moveCensus@v1` (to back the *"bridge, not squeeze"* exclusion by census
rather than assertion).

### 4.4 What the learner would see differently

**Three sentences appear that are absent today**, each carrying a machine ground the runtime can
render — a jump from 152 characters of delivered prose to ~860, and from rung 5 (self-declared) to
rung 1 (tablebase-exact) on the assistance ladder. The `2` blocking graduation entries are
untouched; this does not graduate the pack.

### 4.5 The honest qualification

**This gain has nothing to do with any capability that landed after 2026-08-16.** Every assertion
kind used above shipped on 2026-08-16, and the identical binding was authored into
`philidor-third-rank-hold` on **2026-08-15** (`sourcedAt: 2026-08-15T20:20:49Z`). The pass being
described is not "re-author against a newer platform." It is **"finish the join that was started
once and never repeated."** Say that plainly: for the pack-declaration surface, a re-authoring pass
against the 2026-08-23 platform buys **very little that a pass against the 2026-08-16 platform
would not have bought**, because the new capabilities are runtime-side and packs declare positions,
conditions and claims.

---

## 5. Re-authoring cost — the three-way split

Feeds Gate F clause 7, amended 2026-08-23 to *"measured and ruled per release"* per owner ruling
**D996** (`planning/platform-alignment/plan.md:54`).

### (a) Mechanical / scripted — no chess judgement

| Work | Population | Shipped instrument | State |
|---|---|---|---|
| Backfill `provenance.licence` | **7 packs** | — | needs a script; trivially derivable (43 packs already carry `CC-BY-SA-4.0`) |
| Backfill `provenance.attribution` | **25 packs** | — | same |
| Version stamp `0.1.0` → `0.2.0` | **47 packs** | — | same |
| Graduation-entry migration plan | 92 documents / 436 entries; 203 rule suggestions, 141 recognised emitter entries, 30 resolved + 43 accepted backfill, 5 fixture transitions, **0 unclassified** | **`make graduation-plan`** | **ships and runs clean** |
| Graduation-entry apply | same population | **`make graduation-clear`** | **SPECIFIED AND UNBUILT** (`rfc/graduation-clearance.md` §6.5; `planning/codex-queue.md:192-193`: *"genuinely does not exist at HEAD"*) |
| Validation / census / report | 50 packs | `make pack-check`, `make expression-census`, `make graduation-report`, `make verify-draft`, `make sourcing-check` | all ship |

**Mechanical total: 79 field-level pack edits + a 436-entry migration.** The blocking gap is one
unbuilt writer, and `planning/content-wave-work-order.md:570` forbids hand-editing graduation
entries until it lands.

### (b) Grounded-derivable — a machine can produce the backing

**99 claims carry a machine label; 1 is bound.** Decomposing the 98 unbound label-instances by
whether the record needed is *already in the pack's own sidecar*:

| Machine label | Record already in own ledger — **just the join** | Ledger exists, record kind absent | No ledger at all | Total |
|---|---|---|---|---|
| `tablebase_exact` | **36** | 0 | 0 | 36 |
| `engine_validated` | **7** | 0 | 1 | 8 |
| `corpus_observed` | **0** | 22 | 38 | 60 |
| **Total** | **43** | 22 | 39 | **104** |

*(104 label-instances over 98 claims — six claims carry two machine labels.)*

> **43 of the 104 are pure join.** The evidence exists, in the right file, of the right kind. Across
> **14 packs**. Nothing needs to be fetched, computed or decided; a script that walks each
> `tablebase_result` / `engine_eval` record and emits a `claimBindings` span closes them. This is
> the concrete size of the audit's *"764 machine records and one binding"* — quantified, the join
> that was never made is **43 bindings across 14 packs**.

**61 need a machine run before the join is possible**, and 60 of those are the same run: zero
`explorer_position_census` / `explorer_frequency` records exist anywhere in the corpus
(`state-of-the-corpus.md:224`), so every `corpus_observed` claim is blocked on a Lichess-explorer
fetch that has never been executed for a draft pack.

**Shipped instruments for (b):** `make tablebase-walk FILE=… ENUMERATE=all`,
`make engine-walk FILE=… ENUMERATE=decision`, `make source-fetch`,
`make candidate-emit PIPELINE=explorer`, `make candidate-attach PIPELINE=explorer`. All ship. The
prose-side constraint is that the sentence must *normalize* to the record — `normalizes()` at
`apps/server/src/sourcing/claim-binding.ts:157` — which is the boundary into (c).

### (c) Irreducible human chess judgement

| Queue | Count | Source |
|---|---|---|
| `blocking` graduation entries on the 50 product packs | **215** | free-text conditions each needing a citable source |
| Authored decisions priced by the stage-2 work order | **63–94** | [[D949]] — *which* record a sentence rests on and how it must be worded |
| Claims with no machine label (quality debt, already admitted) | **97** of 196 | not delivery debt |
| Zero-witness primitive families needing new authored content | **4** | `engineCondition`, `legShapes`, `legOpponentPolicy`, `prediction` |
| Assistance rungs with zero corpus claims | **1** | rung 3, `human_model_predicted` |
| Hand-assigned draft classifications in the migration | 17 | `make graduation-plan` |
| Non-template candidate entries requiring judgement | 2 | `make graduation-plan` |

**No instrument exists for (c) and none should.** Law 8 (ADR-0005) forbids one.

### 5.4 The split, summarised

| Arm | Unit | Count | Instrument state |
|---|---|---|---|
| **(a) mechanical** | pack field edits | **79** | scripts trivial; **`make graduation-clear` unbuilt** |
| | graduation entries | **436** (0 unclassified) | planner ships, applier unbuilt |
| **(b) grounded-derivable** | bindings needing **only the join** | **43** across 14 packs | all instruments ship |
| | bindings needing a machine run first | **61** (60 = one explorer run) | all instruments ship |
| **(c) human judgement** | blocking conditions | **215** | none — correctly |
| | authored decisions | **63–94** | none — correctly |

**The ratio that matters: of 104 machine-label instances, 43 (41 %) are a script away, 61 (59 %)
are a script plus one fetch away, and 0 require a fresh chess judgement.** The genuinely
irreducible arm is the 215 blocking conditions, which a re-authoring pass does not touch and
graduation does.

---

## 6. The timing argument, per surface

The D560/D949 hold exists so the corpus is not authored twice against a moving platform
(`planning/platform-alignment/plan.md:39-40`, rule 5: *"Until Gate F below passes, authored work
is limited to disposable/sacrificial pilot packs and already-authorised mechanical repairs. Do not
launch a scale content wave."*). The question is whether that reasoning still binds every surface.

`node tools/register-check.mjs` at HEAD:

```
pack-schema: head 0.27; next free 0.30
run-schema: head 0.17; next free 0.19
shape-entry-schema: head 0.3; next free 0.5
principle-entry-schema: head 0.1; next free 0.2
register-check: 20 active RFCs, 9 live claims, C1-C6 green
```

`pack-schema head 0.27; next free 0.30` means **0.28 and 0.29 are both claimed and unlanded**.
That is Gate F clause 1 failing (`plan.md:48`). But *claimed* is not *claimed against everything* —
the register names exactly which `$defs` each lane touches, so the verdict is per-surface.

### 6.1 The per-surface verdict

| Pack-facing surface | Status | Evidence | Authoring now |
|---|---|---|---|
| **`$defs.graduationEntry`** | 🔴 **MOVING — breaking** | `graduation-clearance` lane **0.28** (`rfc/README.md:111`): new closed `clearance` object, `.resolved.clearance` **required**, `.accepted.unreachableBecause` **required**, `clearedBy` **withdrawn with its `oneOf` arm**. Two new *required* fields | **PREMATURE.** 288 existing entries migrate; the writer does not exist |
| **`$defs.feedbackClaim.evidenceTypes`** | 🟠 **MOVING — additive** | `pack-population-provenance` lane **0.29** (`rfc/README.md:112`) adds `provenance_note`; `evidence-kinds` claims member `citable_text` (`rfc/README.md:184`) | **PARTLY SAFE.** Existing 6-member usage stays valid; new members only widen |
| **Evidence ledger sidecars** | 🟠 **MOVING — additive** | 0.29 adds `$defs.provenance.corpusEvidence`, a new closed union. `grep corpusEvidence`/`citable_text` → **0 in schema and in `apps/server/src/sourcing/types.ts`** at HEAD. No JSON schema file exists for any sidecar; four formats are TS-typed only (`sourcing/types.ts:53,113`) | **PARTLY SAFE** for existing record kinds; premature for new provenance shapes |
| **`$defs.timingWindow`** | 🟢 **MOVING — widening only** | 0.29 raises `.note` maxLength 400 → 2000 (`schemas/drill_pack.schema.json:786`) | **SAFE.** A pure widening cannot invalidate authored notes |
| **`$defs.checkpoint`** | 🟢 **FROZEN** | `schemas/drill_pack.schema.json:889`. **No live claim.** Last moved by archived `open-answer-grading` (0.15) | **SAFE** |
| **`$defs.deviation`** | 🟢 **FROZEN** | `:1009`. **No live claim.** Last moved by archived `deviation-classes` (0.21) | **SAFE** (caveat: `cost` ships author-declared and unbacked) |
| **`$defs.opponentPolicy` / `legOpponentPolicy`** | 🟢 **FROZEN pack-side** | `:909`, `:240`. **No pack lane.** `bot-policy` holds only **run-schema 0.18** (`rfc/README.md:131`) — a runtime surface | **SAFE** to author `opponentPolicy` blocks. **NOT safe** to assume which bot profiles exist — the roster is empty (`bot-policy-catalog.ts:238`) |
| **`spine` / `objective` / `start` / `planClasses` / `shapes[]` in packs** | 🟢 **FROZEN** | No live claim touches any. Schema file unchanged in vocabulary since **2026-08-15** | **SAFE** |
| **Claim-binding assertion registry** | 🟢 **FROZEN** | `claim-binding.ts:16-20`, 15 kinds, no id added or removed since 2026-08-16 | **SAFE** — and this is the surface §4 and §5(b) need |
| **Shape entries (`content/shapes/`)** | 🟠 **MOVING — additive, unsettled** | `measurement-records` holds **shape-entry lane 0.4** (`rfc/README.md:147`) — one optional `measurements` property. Status **`draft`, returned to author** | **PARTLY SAFE.** Additive, but a returned draft may still change shape |
| **Principle entries (`content/principles/`)** | 🟢 **schema FROZEN** / 🟠 **prose queued** | principle-entry register has **zero live claims** (`rfc/README.md:159-162`), head 0.1. But `plan.md:198` schedules *"reground the 13 principle entries in cited chess tradition"* **after** Gate F | **SAFE structurally; prose will be rewritten** |

### 6.2 What this settles

**Six pack-facing surfaces are frozen at HEAD**: `checkpoint`, `deviation`,
`opponentPolicy`/`legOpponentPolicy`, the `spine`/`objective`/`start`/`planClasses`/`shapes[]`
core, the claim-binding assertion registry, and the principle-entry schema. Authoring against
those is **not premature** — no live lane can invalidate the work.

**Three surfaces are moving additively** (`feedbackClaim.evidenceTypes`, evidence sidecars,
`timingWindow.note`, shape entries): existing authored content stays valid; only *new* vocabulary
is at risk.

**One surface is moving in a breaking direction**: `graduationEntry` under lane 0.28, which makes
two fields required and withdraws `clearedBy`. **Every one of the 288 graduation entries in the
50 packs migrates.**

**So the answer to "is the owner's instinct to author now safe?" is: partly, and the partition is
clean.**

- The work §4 and §5(b) describe — **43 claim bindings across 14 packs, using 4-of-15 assertion
  kinds on a registry frozen since 2026-08-16, written into sidecars whose existing record kinds
  no lane touches** — lands entirely inside the frozen set. Authoring it now cannot be invalidated
  by 0.28 or 0.29.
- Any work that writes or restructures `graduationEntry` — which is the 215-blocking-condition arm,
  the expensive one — is genuinely premature and should wait for 0.28.

**The two are separable, and they are currently held together.** [[D949]] holds *"the WHOLE wave —
both arms — until Gate F"* (`planning/codex-queue.md:200`), and the audit records the licensing
position: disposable/sacrificial pilot packs and already-authorised mechanical repairs are
licensed *now*; a scale wave is not (`state-of-the-corpus.md:18-22`). This document does not
propose lifting anything. It records that **the timing argument is strong for the graduation arm
and weak for the binding arm**, because the binding arm's every dependency has been frozen since
the week the packs were written.

---

## 7. Summary of measured state

| Question | Answer at HEAD `73a867e` |
|---|---|
| Product packs | **50**, authored 2026-08-12 → 2026-08-16 |
| Pack schema version | **0.27**, unchanged since **2026-08-15** (`43c6c4a`) — before the last pack |
| Only post-08-16 schema edit | `75154d6`, a one-word `description` typo fix |
| Format expressive surface | **403** items (171 properties + 232 enum members) |
| Corpus coverage | **272 / 403 = 67.5 %** (properties 83.6 %, enum members 55.6 % — a ceiling) |
| Capabilities landed after 2026-08-16 | **9**, all in the 2026-08-21/22 burst |
| …of those, pack-referenceable | **0 of 9** |
| Pack-referenceable vocabulary items with zero uses | **147** |
| …of those, landing after 2026-08-16 | **0** (11 landed *on* 2026-08-16; 136 pre-date the first pack) |
| Assistance-ladder rung 3 (`human_model_predicted`) | **0 claims**, available since 2026-08-10 |
| Machine-labelled claims / bound | **99 / 1** |
| Bindings that are **only a join** (record already in own sidecar) | **43** across **14 packs** |
| Bindings needing a machine run first | **61** (60 = one never-run explorer fetch) |
| Irreducible human judgement | **215** blocking conditions + **63–94** authored decisions |
| Frozen pack-facing surfaces | **6** — safe to author against today |
| Additively moving | **4** — existing content stays valid |
| Breaking | **1** — `graduationEntry` under lane 0.28 |

---

*This is a measurement document, not a route-shaped one. Rows it produces route through
`planning/content-wave-work-order.md`; `make work-index` joins on the work order. It states no
ruling and lifts no hold.*
