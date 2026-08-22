# The sacrificial-pilot matrix — Gate F clause 8

**Derived:** 2026-08-23 at `73a867e`. Working tree carries concurrent `apps/web/`, `tools/d872-*`
edits held by another agent; **no file held by another agent was read for state or written by this
derivation**, and no content file was touched.

**Authority:** owner rulings [[D995]]–[[D998]] (`design/BACKLOG.md:289-292`), landed
2026-08-23 in `planning/platform-alignment/theory-drill/o5-o6-handoff.md`.

**Governing rule:** **O6.3** (`o5-o6-handoff.md:80-86`), ledgered as [[D998]].

**Measurement basis:** `planning/content-era/state-of-the-corpus.md` (measured at `e3c239c`).
`git diff e3c239c..73a867e -- content/ schemas/ packages/schema/` is **empty** — the corpus and the
format have not moved since that audit, so every debt number it reports holds at HEAD unchanged.

---

## 0. Licensing — stated first, per the [[D951]] remedy

| Class of work | Licensed now? | By what |
|---|---|---|
| **Authoring a disposable/sacrificial pilot pack** | **YES — now** | `planning/platform-alignment/plan.md:39`: *"authored work is **limited to** disposable/sacrificial pilot packs and already-authorised mechanical repairs."* **The hold's limiting clause is its licensing clause** |
| **Pilot chess content from grounded sources** | **YES — now** | [[D997]] (`design/BACKLOG.md:291`): *"the sacrificial pilot is sourced from **GROUNDED SOURCES ONLY** — tablebase-exact endgames, explorer-frequency openings, engine-validated evaluations. No authored chess judgement is required of the owner for the pilot, and none may be manufactured"* |
| **Owner chess authoring for the pilot** | **NOT REQUIRED** — and not to be requested | [[D997]], same row |
| **Scale content wave / the binding wave / the 92-document apply** | **NO** | [[D560]] (`design/BACKLOG.md:158`); [[D949]] (`:310`) — *"the binding wave falls under the D560 hold **WHOLE** — hold everything until Gate F"* |
| **Promoting any pilot pack to `content/packs/`** | **NO** | Graduation ⟺ zero `blocking` entries (`apps/server/src/graduation-report.ts:25`); 0 of 92 documents qualify. Additionally forbidden by `tools/graduation-clearance-plan.mjs:157-162` pending clause 7 |

**Law 8 is unchanged** and binds this document: the machine renders validated evidence; it never
creates strategic claims or grades moves. Nothing below authors a chess assertion.

---

## 1. The workflow-consumer census — the load-bearing derivation

O6.3 instruction 1: *"derive requirements from compiled 1.0 workflow consumers, not schema
vocabulary."* This section enumerates every such consumer at HEAD and asks one question of each:
**what does it require of a pack?**

### 1.1 The census result in one sentence

**Almost nothing.** Of the five accepted/implementing consumer sets, **four require zero pack
fields**. The entire pack-facing surface of the compiled 1.0 workflow is one evidence projection
(`pack.authored.claim@1`), one context discriminator (`feedbackPolicy`), and the shipped
authored-feedback delivery projection. Clause 8's *"every required primitive"* is therefore very
much smaller than *"every primitive the schema can express"* — which is exactly [[D998]]'s finding.

### 1.2 `learner-modules` — 11 modules, 181 eligibility rows, **zero pack fields**

Status: **accepted** 2026-08-22 (`rfc/README.md:20`). Compiled surface: `MODULE_IDS`, the frozen
11-id tuple at `packages/runtime/src/module-contract.ts:3-7`.

**Structural finding.** An "eligibility row" in this RFC is *one literal `(projection id, module
consumer id)` pair* (`rfc/learner-modules.md:313-314`, `:917-921`) — not a pack predicate. No pack
primitive, no `engineCondition`, no `legShapes`, no `legOpponentPolicy`, no `phase` field appears
anywhere in its 937 lines. **The "pack fields required" column is empty for all 11 modules**, and
that is a finding, not an omission.

| # | module id | timing / initiative | pack-sourced projections it accepts | rows | cite |
|---|---|---|---|---|---|
| 1 | `rules_floor` | pre_commit, ambient | **none** — registry-only, registers no consumer | 0 | `:301`, `:319-329` |
| 2 | `sight_on_request` | pre_commit, on_request | none (20 `rules.*` readings) | 20 | `:302`, `:925` |
| 3 | `blunder_prevention` | at_commit, Support-only | none (3 `rules.tactic.*`) | 3 | `:303`, `:926` |
| 4 | `threat_radar` | post_commit + Support pre_commit | none (7 tactic ids) | 7 | `:304`, `:927` |
| 5 | `postcommit_nudge` | post_commit, proactive | none (38 event/avoidance ids) | 38 | `:305`, `:928` |
| 6 | `structure_nudge` | post_commit | **`theory.shapes.firing@1`** | 6 | `:306`, `:929` |
| 7 | `theory_breadcrumb` | post_commit, on_request | **`pack.authored.claim@1`**, `theory.shapes.firing@1` | 4 | `:307`, `:930` |
| 8 | `guided_hint` | checkpoint, staged | **`pack.authored.claim@1`** | 7 | `:308`, `:931` |
| 9 | `compare_coach` | checkpoint + review | none (`run.record.*`, `derived.compare.*`) | 8 | `:309`, `:932` |
| 10 | `review_map` | review, automatic | none (`run.record.*`, `recorded.*`) | 48 | `:310`, `:933` |
| 11 | `full_inspector` | review, explicit_mode | `theory.shapes.firing@1`, `pack.authored.classifier@1` | 40 | `:311`, `:934` |

Totals **181 declared / 179 compiled / 2 declared-awaiting** (`:313-316`, `:937`).

**Buildability caveat, load-bearing.** `MODULE_DECLARATIONS` **does not exist** anywhere in
`apps/`, `packages/` or `tools/`; no `module.*` id appears in `EVIDENCE_CONSUMER_IDS`
(`packages/runtime/src/evidence-catalog.ts:98`). The RFC says so itself (`:805-810`: *"the day this
RFC lands, **nothing new renders to a learner**"*). The 11 ids and the contract validator are
compiled; the declarations are not. **This is the strongest single argument for a small pilot:
there is not yet a consumer that could distinguish a rich pack from a thin one.**

**Two `pack.authored.*` projections have no module consumer at all** —
`pack.authored.phase@1` and `pack.authored.claim_delivery@1` (`evidence-catalog.ts:754-755`) appear
in no module's accepts list. `pack.authored.classifier@1`, which `full_inspector` declares at
`rfc/learner-modules.md:585`, **does not exist as a projection in the catalog** (zero hits). Both
are Gate F **clause 3** orphan-disposition rows, not clause 8 rows; routed in §7.

### 1.3 `intent-presets` — 5 × 7, **24 admitted pairs**, two pack-derived contexts

Status: **implementing** 2026-08-22 (`rfc/README.md:28`). Compiled at
`packages/runtime/src/presets.ts`; the grid count is pinned as an invariant at `presets.ts:90-93`
(*"expected 24 admitted and 11 refused pairs"*).

| context (default) | quiet | guided | theory_only | support | analysis | n | pack-derived? |
|---|---|---|---|---|---|---|---|
| `position` (`quiet`) | ✅ | ✅ | ✅ | ✅ | ✅ | 5 | **no — pack-free path** |
| `pack` (`quiet`) | ✅ | ✅ | ✅ | ❌ | ✅ | 4 | **YES** — `sessionKind` |
| `imported` (`quiet`) | ✅ | ✅ | ✅ | ❌ | ✅ | 4 | **no — pack-free path** |
| `match` (`quiet`) | ✅ | ❌ | ❌ | ❌ | ❌ | 1 | no — `liveKind` |
| `stream` (`quiet`) | ✅ | ✅ | ✅ | ❌ | ✅ | 4 | no — `liveKind` |
| `academy` (`guided`) | ✅ | ✅ | ✅ | ❌ | ❌ | 3 | no — `liveKind` |
| `onramp` (`guided`) | ✅ | ✅ | ✅ | ❌ | ❌ | 3 | **YES** — `feedbackPolicy` |

`presets.ts:42-48`; derivation `deriveWorkflowContext` at `presets.ts:106-116`:

```ts
if (input.feedbackPolicy === "immediate_guard") return "onramp";
if (input.liveKind === "stream") return "stream";
if (input.liveKind === "match") return "match";
if (input.liveKind === "academy") return "academy";
return input.sessionKind;   // "pack" | "position" | "imported"
```

**Only 2 of 7 contexts are reachable from a pack byte**: `pack` (any `delayed_checkpoint` pack) and
`onramp` (`feedbackPolicy: "immediate_guard"`). `position` and `imported` are the **pack-free
paths** O6.3 instruction 2 demands, and they are pack-free *by construction* — witnessing them
means running without a pack, not authoring one.

**No admitted pair requires an authored pack.** `pack.authored.claim@1` is the only pack primitive
in the 11-module closure and appears in 2 of 11 modules as one alternative source among four.
`quiet × any` (7 of 24 pairs) consumes `evidence: none`.

**Ceiling redundancy, worth recording:** for all 24 admitted pairs,
`preset.modules ∩ context.moduleCeiling === preset.modules`. Every ceiling-excluded module belongs
only to presets its context already refuses, so the ceiling never bites on an admitted pair.

### 1.4 `move-quality-grades` — two consumer rows, **zero pack requirements**

Status: **implementing** 2026-08-22 (`rfc/README.md:16`). The RFC names exactly two consumers:

| consumer | context | ladder | inputs | empty behaviour | cite |
|---|---|---|---|---|---|
| `postcommit_nudge` | `drill` | `practice` ≥2.5/6/14 Win%-pts | `recorded.engine.eval@1`, `live.stockfish.eval@1` | **`silent`** | `rfc/move-quality-grades.md:258`, `:279`; `rfc/learner-modules.md:453` |
| `review_map` | `review`, `imported_analysis` | `report` ≥5/10/15 Win%-pts | same two | **`stated_absence`** | `:259-260`, `:279`; `rfc/learner-modules.md:549` |

Governing text (`rfc/move-quality-grades.md:39-41`): *"Consumed by `postcommit_nudge` and
`review_map` only … the two declared-awaiting ◇ rows."* Scope (`:17-22`, `:451`): *"no pack/run/
shape-entry/principle-entry schema change"*, *"no server, client, schema, or storage change of any
kind."*

**Requires of a pack: nothing.** Its inputs are engine readings and run records. Abstention is
projection-level and identical for both (`:172-175`): `input_abstained`, `missing_eval`,
`unequal_instrument`, `mate_score_inconsistent`. *"An ungradeable move renders nothing, never a
default grade"* (`:167-169`) — **this is the pilot's abstention cell, and it is provider-shaped,
not pack-shaped.**

### 1.5 The Review lane — requires a **run**, not a pack

"Review lane" is not a formally defined term; its three referents:

| layer | what | status | cite |
|---|---|---|---|
| Product surface | Review and explore — history, resume, replay, rewind/fork, compare, PGN | **shipped in full** (B3) | `design/03-product-breadth.md:57-66`, `:317` |
| Module contract | `review_map` (module #10) | RFC accepted; registry not compiled | `rfc/learner-modules.md:526-551` |
| Planning lane | R7 → **O7 owner ruling** → F6 | **not ruled, not drafted** | `planning/platform-alignment/review-map/plan.md:19-21`; `o7-handoff.md:3-5` |

**Review re-entry, concretely:** *"selecting a moment rewinds to `entryNodeId` and explicitly
creates a `story-reentry` branch"* (`docs/game-import-and-story.md:89`); every moment has
*"Retry from here"* (`o7-handoff.md:58-59`).

| requirement | required? | cite |
|---|---|---|
| a **completed run** (`outcome.reached`) | **yes** | `rfc/learner-modules.md:528-529` |
| a **node/branch graph** with `entryNodeId` | **yes** | `docs/game-import-and-story.md:80,89` |
| checkpoints | **no** — `review_map` accepts no checkpoint projection | `rfc/learner-modules.md:530-536` |
| a longitudinal record | **no** — explicitly excluded until F9 | `rfc/longitudinal-store.md:523`; `o7-handoff.md:87` |
| **any pack field** | **no** | — |
| zero moments legal | **yes** — *"Zero moments is valid"* | `o7-handoff.md:15-16` |

So the Review re-entry cell is witnessed by **playing any pack to a terminal outcome and rewinding**
— it constrains the *pilot run script*, not the *pilot pack set*.

### 1.6 `play-composition` — 16 composition states, **one names a pack field**

Status: **implementing** 2026-08-22 (`rfc/README.md:19`). States table `rfc/play-composition.md:507-524`;
declared closed at `:504-505`.

| # | state | pack requirement |
|---|---|---|
| 1 | calm rest | none |
| 2 | square selected (requested sight) | none |
| 3 | move staged, cue present (at-commit) | none — Support fixture |
| 4 | post-commit nudge / guard present | none — the guard arm is fixture-driven |
| 5 | rail module expanded | none |
| 6 | guided hint at final stage | none |
| 7 | menu/popover open | none |
| **8** | **long objective** | **`objective.summary` exceeding one line at phone width** — the only pack field named in all 16 |
| 9 | evidence-unavailable / honest-empty | none — **provider-off fixture** |
| 10 | inspector open | none |
| 11 | timeline changed (rewind/branch/re-enter) | none — run interaction |
| 12 | compare open | none — two settled attempts |
| 13 | max load | none |
| 14 | terminal / outcome reached | run reaches `outcome.reached` |
| 15 | promotion pending | any position with a back-rank pawn |
| 16 | keyboard/text entry active | none |

Scope clause `:112`: *"**No collector, evidence-catalog, schema or migration work** of any kind."*
Honesty note `:677-684`: the composition is **"preset-inert at landing"**. **No state requires a
`prediction` checkpoint or any checkpoint interaction type** — the word "prediction" does not occur
in the RFC.

### 1.7 The shipped consumer the RFCs do not name — `authored-feedback.ts`

The five RFC consumer sets above are accepted-or-implementing and largely uncompiled. The **actually
shipped** pack-field consumer is the authored-feedback delivery projection, and it reads far more
than the RFCs do:

| pack field | read at | note |
|---|---|---|
| `feedbackPolicy` | `apps/server/src/authored-feedback.ts:122`, `:202` | withholding + context derivation |
| `checkpoints` | `:126`, `:255`, `:265` | |
| `spine` | `:172`, `:288` | |
| `deviations` | `:173` | |
| `planClasses` | `:259`, `:317` | |
| `feedbackClaims` | `:275`, `:306` | admitted/withheld split |
| `objective.type === "follow_theory"` | `:387` | the one distinct objective branch |
| `claimBackings` / `boundClaimIds` | `:277`, `:417` | the binding path |

**`planning/content-era/field-consumer-matrix.md` is stale on exactly these rows.** Built
2026-08-12, it marks `deviations`, `planClasses` and `feedbackClaims` **dead**. All three now have
a shipped consumer. That file carries its own warning (*"this instrument is a snapshot, not a
standing truth"*) — it is honouring it, not failing. **Do not derive pilot requirements from that
matrix**; derive them from the symbols above, which is what O6.3 instruction 1 means.

---

## 2. The retirement verdict for the four zero-witness families

O6.3 instruction 4: mark them *"experimental/retired **unless a ruled workflow actually adopts
them**."* Corpus witnesses were computed structurally over all 404 JSON documents under `content/`,
not by text grep.

| family | pack field path | declared at | evaluated in production? | ruled 1.0 workflow consumer at HEAD? | witnesses | **verdict** |
|---|---|---|---|---|---|---|
| **`engineCondition`** | `guard.conditions[]` | `schemas/drill_pack.schema.json:1001`; ref at `:107` | **YES, deeply** — `apps/server/src/guard-conditions.ts:18-19`, `guard.ts:262-320` (per-arm firing at `:269`, `:302`, `:310-313`), `pack-validation.ts:1038,1067-1079`; capability consumer `runtime.guard_condition` (`capabilities.ts:121`) | **NO.** The only active-RFC mentions are **prohibitions**: `rfc/learner-rating.md:990` (R15) forbids rating reaching `guard-conditions.ts`; `rfc/longitudinal-store.md:473,690` list it in the same no-reach set | **0** | **RETIREMENT CANDIDATE** per O6.3 — no ruled workflow adopts it. **Caveat to the owner:** retiring it retires *shipped, exercised runtime code*, not dead vocabulary |
| **`legShapes`** | `legs[].shapes` | `schemas/drill_pack.schema.json:241` | **NO — validator-only.** Sole reader `pack-validation.ts:1171-1174` (`LEG_SHAPE_LIST_EMPTY`, `LEG_SHAPE_REF_UNLISTED`). **Dropped from the client projection** — `pack-registry.ts:112-119` maps legs to `{id, entryCheckpointId?, branchLengthTarget?, objective}` | **NO** — zero mentions in any active RFC | **0** | **RETIRE.** Zero consumers, zero surface, zero witnesses. The cleanest retirement of the four |
| **`legOpponentPolicy`** | `legs[].opponentPolicy` | `schemas/drill_pack.schema.json:249`; ref at `:240` | **YES** — `packages/runtime/src/trajectory.ts:114-133` (`trajectoryPolicyAt`, with fallback to `run.opponentPolicy`); consumed by `replay.ts:130`, `rest.ts:1307,1324`, `service.ts:2273`; Maia band clamp at `pack-validation.ts:1186-1189` | **NO — and declined explicitly.** `rfc/bot-policy.md:74-80`: *"**no pack lane** (packs keep their existing `opponentPolicy`; a pack-side profile reference is a named future RFC)"* | **0** | **RETIREMENT CANDIDATE.** Behaviour is real but it is a pure fallback-widening; nothing ruled requires per-leg resistance |
| **`prediction`** | `checkpoints[].interaction.type == "prediction"` | `schemas/drill_pack.schema.json:845`, pointer `#/$defs/checkpointInteraction/oneOf/1`; reached from `:905` | **YES, full stack, 7 consumers** — gate `service.ts:1497-1498`, emitter `:1506`, projection `pack-registry.ts:130-135`, route `rest.ts:677,1662`, lint `packages/schema/src/drill-pack/lint.ts:273`, web `screen-model.ts:196-199`, `session-controller.ts:360`, `CheckpointSheet.svelte:80-82` | **CONTESTED — see §2.1** | **0** | **RETIREMENT CANDIDATE WITH A CONDITION.** See §2.1 — this is an owner binary, not a mechanical call |

### 2.1 `prediction` — the precise answer, because it decides a witness

The brief asks whether [[D869]]'s prediction runs and `longitudinal-store`'s
`decision_class: "predicted"` constitute *a ruled workflow adopting the pack-level `prediction`
capability*. **They do not. They are three different mechanisms at three levels.**

| level | what it is | where | status |
|---|---|---|---|
| **Pack-level `prediction`** | an authoring-time declaration on **one checkpoint**; since format 0.9 it carries **no verdict** | `schemas/drill_pack.schema.json:845`; `docs/drill-pack-format.md:15-16` | shipped; **declared by zero packs** |
| **`decision_class: "predicted"`** | a **per-decision row classification** in a durable projection of the run event log | `rfc/longitudinal-store.md:135-137`, DDL `:170`, PK `:181` | **accepted** 2026-08-22 |
| **D869 "prediction runs"** | a proposed **mode + campaign encounter class** needing a *new verdict producer* (prediction-score threshold) | `design/BACKLOG.md:274` | 💡 **owner idea, not ruled** |

**The decisive evidence that the accepted store does not adopt the pack capability** — it asks for
the pack gate to be **removed**:

- `rfc/longitudinal-store.md:232-233`: *"once [[D860]]/[[D869]] **lift the pack gate** …"*
- `planning/campaign/rfc-derivation.md:432`: *"**Must be lifted** for imported-game prediction runs."*
- The store claims **no pack lane** (`longitudinal-store.md:562-566`); `pack_id` is nullable (`:172`).
- Its acceptance fixture AC-2 (`:663-666`) supplies the event bytes **directly** — the store is
  provable with no pack at all.

**The countervailing fact, equally load-bearing.** `prediction.recorded` has exactly **one**
producer in the codebase (`service.ts:1506`), reachable only through the gate at `service.ts:1497`
that reads the pack-declared interaction. **So at HEAD the pack-level interaction is the sole live
path to the event.** Retiring it today, with nothing replacing it, makes `decision_class:
"predicted"` **production-unreachable** — well-formed in the DDL, exercised only by a fixture.

**Verdict, stated as the owner binary it is:**

> **`prediction` is a retirement candidate under O6.3 as written** — no *ruled* workflow adopts the
> pack-level capability; the one accepted consumer adopts the *event* and wants the pack gate gone.
> **Retirement must be sequenced with the gate-lift, not before it**, or an accepted RFC's primary-key
> column loses its only production producer. **If the owner declines retirement** (on the ground that
> it is the only live path), the pilot needs exactly one prediction witness, and §5 prices it at
> near-zero.

**Two stale citations found while resolving this**, both pointing at the gate: `rfc/longitudinal-store.md:233`
and `planning/campaign/rfc-derivation.md:432` cite `apps/server/src/service.ts:1204`; at HEAD that
line is inside branch-group seed validation and the real gate is **`service.ts:1496-1498`**. Routed
in §7.

### 2.2 Two further zero-consumer primitives O6.3 does not name

The same test applied to the rest of the rare-primitive set found two more in the same class. **This
is a finding routed to the owner, not a decision taken here** — O6.3 names four families and this
document does not widen an owner instruction on its own authority.

| primitive | packs | consumer status | class |
|---|---|---|---|
| `retryVariants` | 7 | `pack-validation.ts:1120` (validator) + `pack-check.ts:25` (census) only; **zero readers in `apps/web/src`**; `pack-check` already emits `RETRY_VARIANTS_NOT_EXECUTABLE` — *"nothing in the runtime reads it and it names no referent"* | **fifth retirement candidate** |
| `authoredBoundary` | few | `pack-orchestrator.ts:173,177,340` reads `plyHorizon` and `fenPredicates`; **no `provenanceMode` consumer** | evaluated but half-wired; **not** a retirement candidate |

---

## 3. The Maia / assistance-rung-3 question

The audit records *"assistance-ladder rung 3 (Maia human model): 0 claims in the corpus"*
(`state-of-the-corpus.md` §2.1). The question is whether a consumer requires it.

**Rung 3 verbatim** (`design/05-in-run-experience.md:74`):

> | 3 | **Human model (Maia)** | Predicts what a human at a level plays. Correct as a distribution, misleading as advice, and it must never be dressed as best play | ms, sidecar |

| question | answer | cite |
|---|---|---|
| Is Maia shipped? | **Yes** — real worker | `workers/maia/` (`Dockerfile`, `sidecar.py`, `patches/maia3-uci-policy-mass.patch`); compose service `compose.yaml:27-32`; `deploy/compose.release.template.yaml:23-26`; `Makefile:124` (`ENGINE_MODE=maia`); band range `apps/server/src/maia.ts:11` |
| Is rung 3 **reached** as a producer? | **Yes** — `disposition: "reached"` | `apps/server/src/capabilities.ts:135`: producer `human.maia`, consumers `["inspector.human_split", "opponent.selection"]`; also `:138`, `:139`, `:141` |
| Does an accepted RFC consume a Maia projection? | **Yes, one** — `full_inspector` accepts `human.maia.{policy, candidate_wdl}@1` | `rfc/learner-modules.md:574`, `:934` — *"its D744 `inspector_only` disposition honored: this is its one home"*; mirrored `rfc/play-composition.md:483` |
| Does `bot-policy` require a Maia **claim** in a pack? | **No — and it declines to open one** | `rfc/bot-policy.md:74-80`: *"**no pack lane** … a pack-side profile reference is a named future RFC"*. Its reach/refuse table `:634-637` is entirely sampling and selection |
| What label would a rung-3 **claim** carry? | `human_model_predicted` | `schemas/drill_pack.schema.json:1076-1084` (enum member); rung mapping `apps/server/src/expression-census.ts:39-46` maps it to **3** |
| **Can a rung-3 claim be backed?** | **NO — unbackable by construction** | `apps/server/src/sourcing/claim-binding.ts:170` — the machine-label→kind map has **three** members (`corpus_observed`, `engine_validated`, `tablebase_exact`). `human_model_predicted` is **absent**, so `CLAIM_LABEL_UNEARNED` (`:236`) never fires for it and it can never be ledger-bound |

Stated already at HEAD in an accepted RFC — `rfc/feedback-delivery.md:598-600`:

> *"`human_model_predicted` is in the schema enum, absent from the label→kind map, and **used by zero
> claims**. It is unbackable by construction (D87: no Maia evidence kind exists in `EVIDENCE_KINDS`)
> and moot in practice."*

### Verdict

**No pilot witness is required for rung 3, and none is possible as a claim.**

Rung 3's zero is a **designed zero**, categorically unlike the four primitive families' zeros:

| | four primitive families | rung 3 |
|---|---|---|
| nature of the zero | a **corpus gap** — the field exists and is authorable | a **designed refusal** — the label has no backing kind and no `EVIDENCE_KINDS` member |
| closable by authoring? | yes | **no** — a `human_model_predicted` claim would be an unbacked assertion, i.e. exactly the law-8 violation |

**Rung 3 is nonetheless witnessed at runtime, and the pilot gets it free.** The prediction checkpoint
route calls `selector.select(...)` and records the returned `OpponentSelection` distribution
(`apps/server/src/rest.ts:1668-1685`; `service.ts:1506`). If the owner declines `prediction`'s
retirement (§2.1), the single prediction witness **also exercises rung 3 end-to-end as a
distribution** — the only honest form rung 3 has. Additionally, `legs[].opponentPolicy.targetElo` is
clamped to `MAIA3_BAND_RANGE` at `pack-validation.ts:1186-1189` — rung 3 constraining a pack field
today, as a runtime band, never as a claim.

---

## 4. The smallest covering draft set

O6.3 instruction 5: *"use the smallest existing draft set that reaches all required cells."*

### 4.1 The required-cells table

Every row below is required by a **named compiled consumer symbol**. Rows whose only "consumer" is
the schema or a validator are excluded by O6.3 instruction 1 and appear in §4.4 instead.

| # | cell | required by (symbol) | witnessed by |
|---|---|---|---|
| **Phase / mode — O6.3 instruction 2, mandated explicitly** ||||
| 1 | phase `opening` | O6.3 #2 | `line-boundary` |
| 2 | phase `middlegame` | O6.3 #2 | `immediate-guard` |
| 3 | phase `endgame` | O6.3 #2 | `philidor-third-rank-hold` |
| 4 | phase `cross_phase` | O6.3 #2 | `trajectory-legs` |
| 5 | mode `line` | `pack-registry.ts:124` (`raw.mode === "line" ? [] : spine`) | `line-boundary` |
| 6 | mode `plan` | `authored-feedback.ts:259,317` (planClasses) | `maroczy-bind-white-squeeze` |
| 7 | mode `outcome` | objective state machine | `outcome-hold` |
| 8 | mode `trajectory` | `packages/runtime/src/trajectory.ts:169` | `trajectory-legs` |
| 9 | **pack-free / empty path** | `deriveWorkflowContext` → `position`/`imported` | **no pack — run script** |
| **Workflow context — `presets.ts:106-116`** ||||
| 10 | context `pack` (`delayed_checkpoint`) | `presets.ts:116` | any of 49 |
| 11 | context `onramp` (`immediate_guard`) | `presets.ts:110` | `immediate-guard` |
| **Authored-feedback delivery — `authored-feedback.ts` (shipped)** ||||
| 12 | claims admitted-but-withheld | `:275-277` | `philidor-third-rank-hold` (2) |
| 13 | **claim bound to a record** | `:277`, `:417` (`claimBackings`) | `philidor-third-rank-hold` — **corpus's only one** |
| 14 | zero claims → `stated_absence` (**no-theory**) | `rfc/learner-modules.md:743` | `line-boundary` (0 claims) |
| 15 | `deviations` | `:173` | `philidor-third-rank-hold` |
| 16 | `planClasses` | `:259` | `maroczy-bind-white-squeeze` |
| 17 | `objective.type === "follow_theory"` | `:387` | `line-boundary` |
| **Checkpoint interaction projection — `pack-registry.ts:125-137`** ||||
| 18 | no interaction | `:136` (else-branch) | `outcome-hold` |
| 19 | `intent_capture` | schema + 49 witnesses | `philidor-third-rank-hold` |
| 20 | `stated_reasoning` | `pack-registry.ts:136` | `stated-reasoning` — **corpus's only one** |
| 21 | `prediction` | `service.ts:1497` | **NONE — §2.1 owner binary** |
| **Runtime primitives with a live reader** ||||
| 22 | `guard` | `apps/server/src/guard.ts` | `immediate-guard` |
| 23 | `legs` | `trajectory.ts:114-133` | `trajectory-legs` |
| 24 | `timingWindows` | `pack-orchestrator.ts:245,274`; `apps/web/src/lib/evidence-sentences.ts:112` | `maroczy-bind-white-squeeze` |
| 25 | `variantOf` | `pack-registry.ts:123` → **rendered** `apps/web/src/lib/DrillScreen.svelte:914-917` | `trajectory-mate-bishop-knight` |
| 26 | `shapes` → `theory.shapes.firing@1` | `session-controller.ts:225`; modules 6, 7, 11 | `philidor-third-rank-hold` |
| 27 | `authoredBoundary` | `pack-orchestrator.ts:173,340` | `line-boundary` |
| **Run-shaped cells — constrain the run script, not the pack set** ||||
| 28 | Review re-entry (`story-reentry` branch) | `docs/game-import-and-story.md:89` | any pack played to outcome |
| 29 | abstention (ungradeable → nothing) | `rfc/move-quality-grades.md:167-175` | provider-off run |
| 30 | provider-off / honest-empty | `play-composition.md:517` (state 9) | provider-off run |

**30 required cells. 29 are coverable from existing drafts; 1 (`prediction`) is contested.**

### 4.2 The covering set — 8 documents, total debt 25

Debt = `blocking` + `withheld`, per `state-of-the-corpus.md` §5. Ties broken toward lower debt.

| # | document | phase | mode | debt | cells it uniquely or cheaply covers |
|---|---|---|---|---|---|
| 1 | `content/drafts/line-boundary.browser.json` | opening | line | **0** | 1, 5, 14 (**zero claims**), 17, 27 |
| 2 | `content/drafts/immediate-guard.browser.json` | middlegame | line | **1** | 2, 11 (**onramp context**), 22 (guard) |
| 3 | `content/drafts/outcome-hold.browser.json` | opening | outcome | **1** | 7, 18 |
| 4 | `content/drafts/stated-reasoning.browser.json` | middlegame | line | **1** | 20 — **the corpus's only `stated_reasoning`** |
| 5 | `content/drafts/trajectory-legs.browser.json` | cross_phase | trajectory | **1** | 4, 8, 23 (legs) |
| 6 | `content/drafts/philidor-third-rank-hold.json` | endgame | outcome | **5** | 3, 12, **13 — the corpus's only bound claim**, 15, 19, 26 |
| 7 | `content/drafts/maroczy-bind-white-squeeze.json` | middlegame | plan | **8** | 6, 16, 24 (timingWindows) |
| 8 | `content/drafts/trajectory-mate-bishop-knight.json` | endgame | trajectory | **8** | 25 (variantOf) |
| | **TOTAL** | | | **25** | **29 of 30 cells** |

Every row was **re-verified structurally at `73a867e`** by parsing the documents, not by reading the
audit's tables: phase, mode, `blocking` count, claim count, and the presence of `deviations`,
`planClasses`, `timingWindows`, `shapes`, `variantOf`, `legs`, `retryVariants` and each checkpoint
interaction type. Two redundancies surfaced and are worth recording, because they are the set's slack
if a document is later dropped:

- `philidor-third-rank-hold` also carries **3 `planClasses`** (cell 16) — but not mode `plan`, so it
  cannot replace `maroczy-bind-white-squeeze` for cell 6.
- `trajectory-mate-bishop-knight` also carries **3 `legs`** (cell 23) and 2 `retryVariants`. It cannot
  replace `trajectory-legs.browser.json`, whose irreplaceable cell is phase `cross_phase` (cell 4) —
  only 2 documents in the whole corpus carry that phase.

Plus **two run scripts, no pack**: a `position`-context run (cell 9, 28–30) and a provider-off run
(cells 29–30).

### 4.3 Why this set and not the audit's suggested shape

`state-of-the-corpus.md` §5.3 offers a six-pack shape at **total debt ≈ 35**, plus new authoring for
four families and rung 3. This derivation lands at **debt 25 with one contested witness and no rung-3
authoring**, for three reasons the audit could not use because O6.3 had not yet been ruled:

1. **The 6 browser fixtures are existing drafts and are the cheapest witnesses in the corpus**
   (debt 0–1 each, versus 3 for the cheapest product pack). They live in `content/drafts/`, they are
   **sacrificial by construction**, and — decisively — **they are already wired into the clause-9
   harness** (`playwright.config.ts:22-26`). The audit's §5 tables enumerate only the 50 product
   packs and so never considered them.
2. **`retryVariants` was dropped from required** (§2.2): validator-only, zero web readers, and
   `pack-check` already flags it non-executable. That removes the audit's pressure toward
   `philidor-passive-rook-convert` (debt 9).
3. **Rung 3 needs no witness** (§3) — a designed zero, not a corpus gap.

**Fixture caveat, stated plainly.** The 6 browser fixtures are excluded from directory serving by
`isPackDocumentName` (`apps/server/src/pack-registry.ts:186-192`) and are loadable only via explicit
`DRAFT_PACK_FILES`. That is **correct for a sacrificial pilot** — clause 8's word *official* is the
part that waits for graduation (§0), and nothing here is graduated. If the owner later wants the
pilot on the official shelf, these five become product-pack copies; that is a promotion decision, not
this derivation's.

### 4.4 Cells no draft covers — the leftovers

| cell | why uncovered | disposition |
|---|---|---|
| 21 `prediction` | 0 witnesses corpus-wide; the *only* live path to `prediction.recorded` | **Owner binary, §2.1.** Retire (sequenced with the gate-lift) **or** author one witness (§5) |
| `engineCondition` (`guard.conditions[]`) | 0 witnesses | **Retirement candidate** — no ruled consumer (§2) |
| `legShapes` | 0 witnesses, 0 consumers | **RETIRE** (§2) |
| `legOpponentPolicy` | 0 witnesses | **Retirement candidate** (§2) |
| rung-3 claim (`human_model_predicted`) | unbackable by construction | **Not a cell.** No witness possible or required (§3) |
| `pack.authored.phase@1`, `pack.authored.claim_delivery@1` | projections with no module consumer | Gate F **clause 3** orphans, not clause 8 |
| `pack.authored.classifier@1` | declared in an accepted RFC, **absent from the catalog** | Gate F **clause 3**; routed §7 |

**Not one of these leftovers requires authored chess judgement.** They are retirements, orphan
dispositions, and one owner binary.

---

## 5. The genuinely missing witnesses

**Exactly one cell can require a new pack, and only if the owner declines its retirement.**

### 5.1 Cell 21 — a `prediction` checkpoint witness

| property | value |
|---|---|
| **Needed only if** | the owner declines `prediction`'s retirement (§2.1) |
| **Pack shape** | one checkpoint with `interaction: { type: "prediction" }` (`schemas/drill_pack.schema.json:841-848`); **no `grading` key** — format 0.9 removed it (`docs/drill-pack-format.md:15-16`); ≤2 predictions per segment or `TOO_MANY_PREDICTIONS` fires (`packages/schema/src/drill-pack/lint.ts:273`) |
| **Chess content required** | a start position and a spine. **No strategic claim, no move grade, no authored judgement** — the prediction is scored against the runtime distribution, never against an authored answer. This is why [[D869]] calls the mechanism *"law-8-clean scoring by construction"* (`design/BACKLOG.md:274`) |
| **Grounded source — option A (preferred)** | **explorer-frequency opening line.** `make source-fetch SOURCE=<lichess-explorer-id>` → `make candidate-emit PIPELINE=explorer ARGS='...'` → `make candidate-attach DIR=<dir> PIPELINE=explorer`. Produces `explorer_frequency` / `explorer_position_census` records — **of which the corpus currently holds zero** (`state-of-the-corpus.md` §2.2), so this witness also lands the first explorer record in the repo |
| **Grounded source — option B** | **tablebase-exact endgame.** `make tablebase-walk FILE=<pack.json> ENUMERATE=all` — 341 `tablebase_result` records already exist and the instrument is exercised |
| **Verification** | `make pack-check FILE=<path>`; `make verify-draft FILE=<path> OFFLINE=1` |
| **Authored judgement required?** | **NO.** The position comes from the explorer or the tablebase; the checkpoint is a mechanism declaration; the distribution is produced at runtime by `selector.select` |
| **Bonus coverage** | exercises rung 3 end-to-end as a distribution (§3) and the `/runs/:id/prediction` route, which **no shipped caller can currently reach** — the [[D938]] "unreachable-from-production" shape, still live for this route |

### 5.2 Cells that CANNOT be witnessed from grounded sources — **none**

This derivation found **no cell requiring authored chess judgement**. Recorded explicitly, because
the brief asked for it and because a null answer here is the load-bearing one:

| candidate worry | resolution |
|---|---|
| `plan`-mode packs need strategic authoring | **No new pack needed** — 14 exist; the covering set reuses `maroczy-bind-white-squeeze` |
| A bound claim needs prose that normalizes to a record | **No new pack needed** — `philidor-third-rank-hold` already holds the corpus's only bound claim |
| Rung 3 needs a Maia claim | **Impossible and not required** (§3) — attempting it would be the law-8 violation |
| The four zero-witness families need four authored packs | **[[D998]] is explicit**: they are *"a retirement question, not four authoring jobs"* |

**Nothing is routed to the owner for chess authoring.** Two things are routed to the owner as
**rulings** (§6 steps 1 and 2), which is a different act — and [[D997]] already pre-committed that
the pilot needs no owner authoring.

---

## 6. The build order

Each step names its executor and its landing artifact. Steps 1–2 are owner rulings; everything else
is mechanism.

| # | step | executor | landing artifact | gate |
|---|---|---|---|---|
| **1** | **Rule the four retirement verdicts** (§2). `legShapes` → retire; `engineCondition` and `legOpponentPolicy` → retire or keep-as-experimental; **`prediction` → the §2.1 binary**, with the consequence stated: retiring it before the gate-lift makes `longitudinal-store`'s `predicted` production-unreachable | **owner** | BACKLOG rows + a `capability-watch` disposition per family | O6.3 #4 |
| **2** | **Rule the §2.2 widening**: do `retryVariants` and `authoredBoundary` join the retirement census? O6.3 names four families; this document declines to widen an owner instruction unilaterally | **owner** | BACKLOG row | law 5 |
| **3** | **Declare the pilot set** — the 8 documents of §4.2, named in one file as *the sacrificial pilot*, explicitly labelled disposable per `rfc/0000-rfc-process.md` §Exploration gate | **claude** | `planning/content-era/pilot-set.md` + BACKLOG row | `plan.md:39` |
| **4** | **Author the prediction witness** — **only if step 1 declines retirement.** Grounded-instrument run per §5.1, then `make pack-check` | **grounded-instrument run** (`make source-fetch` / `candidate-emit` / `candidate-attach`, or `make tablebase-walk`) | one new `content/drafts/prediction-checkpoint.browser.json` + its `*.evidence.json` / `*.job.json` / `*.sources.json` sidecars | [[D997]] |
| **5** | **Wire the pilot into the clause-9 harness** — extend `DRAFT_PACK_FILES` at `playwright.config.ts:22-26` from its current 8 documents to include the 3 product packs of §4.2 (and the step-4 witness). **Without this, clause 9 cannot see the pilot at all** (§7 trap 4) | **codex** | `playwright.config.ts` diff | clause 9 |
| **6** | **Run the clause-9 acceptance** — the five checks below | **codex** | `tests/browser/` results + a recorded pass table | clause 9 |
| **7** | **Record the clause-8 proof** — tick `planning/platform-alignment/plan.md:56` with the covering table and the retirement rulings; append the content-era log entry **in the same commit** (CLAUDE.md content-wave closeout) | **claude** | `plan.md` + `planning/content-era/log.md` | clause 8 |
| **8** | **Owner accepts the primitive set** for the first scale wave | **owner** | clause 10 | clause 10 |

### 6.1 The clause-9 acceptance the pilot must pass

Clause 9 (`plan.md:57`): *"pilot packs pass viewport, gesture, assistance, review/re-entry and
abstention checks."*

| check | instrument at HEAD | current state | what the pilot must add |
|---|---|---|---|
| **viewport** | `tests/browser/drill.spec.ts:1103-1113` — 3 projections (1280×720, 1440×900, 768×1024); `play-composition` targets **7** viewports (`rfc/README.md:19`) | shell routes pass; the **full 7×16 / 112-screenshot matrix is explicitly not complete** (`rfc/play-composition.md:3`) | the pilot documents run at every projection; the 16 composition states of §1.6 are the columns |
| **gesture** | `drill.spec.ts:1161` (post-gesture board-rect equality), `:1291` (semantic grid after a keyboard move); D537–D539 passed **90/90** exact live click/drag/touch cells 2026-08-21 (`plan.md:74`) | **component pass, not a pilot pass** | re-run over pilot documents, not over `schemas/` fixtures |
| **assistance** | `permittedAssistance` (`packages/runtime/src/assistance.ts:31-35`) | **`workflowContext` is declared and unread** — `assistance.ts:24` declares it; the body reads only `deliveryOpen`, `seatedInContest`, `role`, `reviewing`. `match`/`stream`/`onramp` get identical permissions | the pilot's `immediate-guard` witness (cell 11) is the **first document that can prove or refute** the onramp ceiling — expect a failure here, and it is the check working |
| **review / re-entry** | `story-reentry` branch (`docs/game-import-and-story.md:89`) | shipped | play a pilot pack to `outcome.reached`, rewind, confirm the branch (cell 28) |
| **abstention** | `rfc/move-quality-grades.md:167-175`; honest-empty state 9 (`play-composition.md:517`) | projection-level, both consumers | a provider-off run over a pilot pack: `stated_absence` / `unavailable_source` render, **no default grade** |

---

## 7. Gaps and traps

1. **The digest-stale trap — do not hand-fix.** 26 of 42 candidate ledgers are digest-stale, **all
   `onramp-*`**, zero non-onramp staleness (`state-of-the-corpus.md` §6.3, re-run at HEAD).
   `EVIDENCE_DIGEST_STALE` is `severity: "warning"`, so `valid` ignores it and a stale digest can
   never withhold a claim — which is why it has survived.
   **`planning/content-wave-work-order.md:570` is binding: *"Until [`make graduation-clear`] lands,
   do not hand-edit graduation entries — including the 26 stale candidate ledgers."*** The clearance
   writer is specified (`rfc/graduation-clearance.md` §6.5, `:137-140`) and **unbuilt**. **None of the
   8 covering documents is an `onramp-*` candidate**, so the pilot never touches this population —
   but a step-4 authoring run **must not** be allowed to restamp a candidate ledger as a side effect.

2. **The [[D949]] hold boundary — where the line is, precisely.** [[D949]]
   (`design/BACKLOG.md:310`) held the binding wave **whole**: *"hold everything until Gate F"*, both
   arms — the mechanical ~96 claim records **and** the 63–94 authored decisions.

   | on the pilot side of the line (licensed) | on the wave side (held) |
   |---|---|
   | Naming 8 existing drafts as the sacrificial pilot | Binding any of the **98 withheld claims** |
   | Authoring **one** prediction witness from a grounded source (§5.1) | Running explorer/tablebase censuses **across the corpus** to retire withheld claims |
   | Its own sidecars for that one witness | Restamping the 32 draft ledgers |
   | Wiring the pilot into the browser harness | Touching the **215 blocking** graduation conditions |
   | Retirement rulings on zero-witness families | The 92-document 0.28 apply |

   **The precise line: the pilot may create evidence *for itself*; it may not retire debt *for the
   corpus*.** The trap is that §5.1's explorer run would produce the corpus's first
   `explorer_frequency` records — and 60 withheld `corpus_observed` claims across 31 packs are
   waiting for exactly that instrument. **Running it once for one new pilot document is the licensed
   act; running it over the 31 packs is the held wave.** Same command, different population. The
   pilot must not become the wave through the back door.

3. **The prohibitions.** `design/00-thesis.md:157-159`: *"**Explicitly not:** a tactics puzzle
   trainer or lesson content."*
   - The `onramp-*` family is **36 puzzle-derived candidate documents** with 143 blocking entries,
     correctly quarantined by rule (`graduation-report.ts:25` excludes `content/candidates`). **No
     covering-set document is drawn from it**, and none may be promoted without the
     play-the-consequence re-cut.
   - **LLM-generated strategic lessons** are guarded mechanically:
     `apps/server/src/evidence-manifest-check.ts:62-64` throws `EVIDENCE_GENERIC_BYPASS` unless
     external voice is bound to the rendered `VoiceEvidenceView`. Law 8 has a CI test. The pilot must
     not weaken it, and §5.1's witness does not — its scoring is against a runtime distribution, not
     against authored prose.

4. **Clause 9 currently cannot see any product pack.** `playwright.config.ts:22-26` seeds exactly 8
   documents: `schemas/drill_pack.example.json`,
   `schemas/fixtures/drill-pack/terminal-outcome.browser.json`, and the 6 `content/drafts/*.browser.json`
   fixtures. **Zero product packs.** Every clause-9-adjacent green in the repo today was measured over
   fixtures, not content. This is why build-order step 5 exists and why it precedes step 6.

5. **The `pack.authored.classifier@1` phantom.** `rfc/learner-modules.md:585` declares
   `full_inspector` accepts it; **it does not exist as a projection** in
   `packages/runtime/src/evidence-catalog.ts` (zero hits repo-wide). An accepted RFC names a consumer
   edge to a projection that was never created. Two sibling projections run the other way —
   `pack.authored.phase@1` and `pack.authored.claim_delivery@1` (`evidence-catalog.ts:754-755`) exist
   with **no module consumer**. All three are Gate F **clause 3** rows (unexplained orphans), not
   clause 8 rows, and they join the 14 open declared-vs-consumed mismatches at
   `planning/platform-alignment/never-started-lanes.md:190-193`.

6. **Two stale gate citations found in accepted documents.** `rfc/longitudinal-store.md:233` and
   `planning/campaign/rfc-derivation.md:432` both cite `apps/server/src/service.ts:1204` as the
   prediction pack gate; at HEAD that line is branch-group seed validation and the real gate is
   **`service.ts:1496-1498`**. `planning/campaign/rfc-derivation.md:121` cites `design/BACKLOG.md:264`
   for [[D869]], which is at `:274`. Cheap to fix; **the second one matters** because an agent
   following the citation to lift the gate would edit the wrong function.

7. **`field-consumer-matrix.md` is stale on three rows and is being cited as current.** It marks
   `deviations`, `planClasses` and `feedbackClaims` **dead**; all three are read by
   `authored-feedback.ts` today (§1.7). The file carries its own re-verify warning and is therefore
   working as designed — but pilot requirements derived from it would be wrong in both directions.
   **O6.3 instruction 1 exists to prevent exactly this**: derive from compiled consumers, at HEAD, by
   symbol.

8. **`CONSTRUCT_UNREACHED` on all 50 product packs.** Five `tempo:*` constructs have zero uses across
   `content/`, so every pack emits five warnings. Any clause-9 run over pilot packs will surface 5×N
   warnings that are **not** pilot defects. Expect them; do not chase them.

9. **The assistance check is expected to fail, and that is the point.**
   `AssistanceContext.workflowContext` is declared and unread (`assistance.ts:24` vs `:31-35`) — the
   D532/D715 "declared-and-unread" defect, moved from `sessionKind` to `workflowContext`. The pilot's
   `onramp` witness (cell 11) is the **first document in the repo that can detect it at runtime**.
   Recording that failure is clause 9 working, not the pilot failing (law 6).

10. **The unrecorded-pass risk now points at clause 8 itself.** Gate F stood at
    **1 pass · 7 fail · 2 unmeasured** in the audit, and its one pass — clause 2, `make register-check`
    green since 2026-08-21 — spent two days recorded as failing. It has since been recorded:
    `planning/platform-alignment/plan.md:49` reads `[x]` with the [[D499]] citation. **Clause 8 is now
    the same shape of risk**: if build-order steps 1–7 land without step 7's log entry, the pilot
    completes invisibly. That is exactly the failure the CLAUDE.md content-wave closeout clause was
    added (2026-08-16) to prevent, and content is the tier that had neither half of a closeout. **Step 7
    ships the `plan.md` tick and the `planning/content-era/log.md` entry in the same commit, or the
    pilot did not land.**

---

## 8. Summary

| question | answer |
|---|---|
| Required cells | **30**, derived from compiled consumer symbols |
| Cells covered by existing drafts | **29** |
| Covering set size | **8 documents**, total debt **25** (5 browser fixtures at debt 0–1, 3 product packs) |
| Plus | 2 pack-free run scripts (`position` context; provider-off) |
| `engineCondition` | **retirement candidate** — no ruled consumer; retiring it retires live runtime code |
| `legShapes` | **RETIRE** — zero consumers, zero surface, zero witnesses |
| `legOpponentPolicy` | **retirement candidate** — `bot-policy` declines a pack lane explicitly |
| `prediction` | **retirement candidate with a condition** — must be sequenced with the D860/D869 gate-lift, or `longitudinal-store`'s `predicted` becomes production-unreachable. **Owner binary** |
| Maia / rung 3 | **no witness required, none possible as a claim** — `human_model_predicted` is unbackable by construction (`claim-binding.ts:170`). Rung 3 is *reached* as a runtime producer |
| Genuinely missing witnesses | **1**, and only conditionally: a `prediction` checkpoint |
| Cells needing owner **chess authoring** | **0** — consistent with [[D997]] |
| Cells needing an owner **ruling** | 2 — the retirement verdicts (§2) and the §2.2 widening |


---

## CORRECTION 2026-08-23 — owner ruling [[D1006]]: retire nothing

The retirement verdicts above (`legShapes` retire outright; `engineCondition`,
`legOpponentPolicy`, `prediction` as candidates) are **withdrawn by owner ruling**: *"retire NONE.
these are still important for bots, ui, etc."*

**The framing error was mine.** This census read O6.3's *"unless a ruled workflow actually adopts
them"* as **compiled, shipped consumers** — a reading that is far too narrow for a platform whose
consumers are mostly accepted RFCs awaiting implementation. `bot-policy` (accepted 2026-08-22) is
the consumer of `legOpponentPolicy`; `campaign-core` (accepted 2026-08-22) of per-leg encounter
structure; `longitudinal-store` (accepted 2026-08-22) of `prediction`. A ruled workflow is ruled
whether or not codex has reached it — measuring only shipped code would retire the roadmap.

**What survives unchanged:** the required-cells table and the 8-document covering set, which never
depended on retirement — only on whether a cell is *required* for clause 8. The conditional
"1 genuinely missing witness" (a `prediction` checkpoint) is now simply **not needed for
retirement reasons**; whether the pilot witnesses it is a coverage question, not a retirement one.
