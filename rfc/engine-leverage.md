# RFC: Engine leverage — the instrument has already answered

- **Status:** draft
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-15
- **Design refs:** `design/02-product-shape.md:159-180` (the two-axis latency budget —
  per instrument call vs per selection — checked in §4.3); `design/02-product-shape.md:157-158`
  (the anti-contamination default, which governs when any new number may be shown);
  `design/00-thesis.md` §§70, 93-94 and `AGENTS.md` §Rejected (*"an engine review screen
  with a rewind button"* — the failure shape every clause below is written against);
  `design/04-content-architecture.md` (the authoring scale-up this unblocks).
  **DESIGN-GAP escalated, not edited:** `design/03-product-breadth.md` names no
  engine-condition surface at all, so §3 below has no design-tier parent to specify
  against. That gap is named in Open questions and is the owner's to close.
  *Every code site in this RFC is cited **by symbol name**; line numbers are advisory
  and were read at `0c6e139`. Locate `applyRecordedEngineGuard`, `guardSettings`,
  `evalAt`, `candidateLines`, `#strongEngine`, `resolveStrongEngineProfile`,
  `parseCorpusResponse`, `enumerate`, `verifyEngineDraft`, `verifySyzygyDraft`,
  `evidenceSupports`, `authoredPositionPointers`, `publicNodes`, `isEngineEvidenceRef`,
  `DECLARED_UNIMPLEMENTED_POLICY_MODES` and `EngineCapabilities.get` by name, not by
  number.*
- **Exploration gate:** owner ruling 2026-08-15 — *"engine let's get it to 100% too"*,
  restated and answered as `design/research/engine-layer-capability-audit.md`, whose §6
  ordered gap list is this RFC's scope, and
  `design/research/authoring-vocabulary-completeness.md` §3, whose engine-leverage
  finding is D87. Both dossiers are the entire evidence base; no claim here is new
  research.
- **Depends on:**
  - **D91 — the `SelfElo`/`OppoElo` band regression (audit §0, gap 1).** Not fixed here,
    and it did not need to be: `planning/work-register.md` §0 records it as **implemented,
    pending independent review**, and `#maia` at `0c6e139` now emits the advertised
    `SelfElo`/`OppoElo` defaults **before** `Elo` (`opponent-selector.ts:493-509`) — the
    audit's `elo-last` arm, measured band-responsive on 12/12 positions. §5.1 **may not
    land until that review closes**, because recording a Maia distribution stamped with a
    `targetElo` the request unsent manufactures exactly the false record the engine
    request contract exists to forbid, and it would silently poison the gap-3 experiment's
    own data. D58 and D60/D70 ride the same fix and are likewise not this RFC's.
  - `rfc/archive/engine-request-contract.md` — owns the five obligations (**state**,
    **clear**, **bind**, **bound**, **record**). §4 discharges the **record** obligation
    for the new search bound; §3 discharges it for every condition firing. Its open
    question 2 (*"a node budget is a product change and belongs in an RFC"*) is answered
    in §4.
  - `rfc/archive/deviation-classes.md` (pack 0.21) — owns `mistake` and `cost`, and
    shipped `cost` **author-declared and UNBACKED** by the 2026-08-15 coordinator ruling
    (`design/BACKLOG.md` row *"Bind `/deviations/{i}/cost` to engine evidence"*). §2 is
    where that ruling changes.
  - `rfc/archive/opening-evidence-path.md` (pack 0.20) — owns `assessedBy {kind:"engine"}`
    and the `verify-draft` engine path this RFC extends. It declined the per-deviation
    binding because *"0.20's engine record attaches to the pack ROOT while `cost` is
    per-deviation"*; §2 supplies the per-move linkage that was missing.
  - `rfc/archive/onramp-guard.md` (pack 0.14) — owns `guard` and `immediate_guard`. §3
    **widens** that block rather than opening a second grammar, deliberately (D89).
  - `rfc/archive/resistance-spectrum.md` — owns `practical_resistance` and
    `perfect_tablebase`; §3.4's DTZ axis is the *"how hard is this to convert"* signal
    its §7a handed off. This RFC does not change either mode's selection logic.
  - `rfc/teacher-surface.md` (*draft*) — **migration order only.** It claims migration 21;
    this RFC claims 22 and lands behind it. No other overlap: it changes no run or pack
    schema.
  - `rfc/fixture-realism.md` (*implementing*) — owns the instrument-fed fixture register.
    Audit §0 was a fixture-realism failure (`opponent-selector.test.ts` asserts the
    regression exactly as written; the real-engine suite sends a command shape the
    product does not use). Every acceptance test in §8 that asserts a command array must
    be registered there, not written against a fake client alone.
  - `rfc/live-surface-honesty.md` (*wave 2 draft*) — its acceptance criteria assert that
    `publicRunSnapshot`, `publicNodes` and `publicEvents` **take no viewer, role or
    identity**. §3.6's change to `publicNodes` swaps one ref predicate for a wider one and
    **adds no parameter**, so the two are compatible by construction. Named so a reviewer
    does not have to rediscover it.
  - **`rfc/feedback-delivery.md` (parallel draft) owns D77 / D78 / D79.** §5.2 produces
    the per-move outcome split that D78's compare strip wants. **This RFC ships the
    measurement and its corpus-panel rendering; it does not specify the compare strip,
    claim delivery, or `stated_reasoning`, and must not be read as doing so.**
- **Parent / amends:** amends `$defs/guard` and `$defs/deviationCost` in the pack schema;
  amends `EvidenceKind`, `EvidenceSource`, `selectionCandidate` and `selectionEngine` in
  the run schema; amends `StrongEngineProfile`, `parseCorpusResponse` and the
  `verify-draft` writers.
- **Supersedes / superseded by:** —
- **Planning:** `planning/engine-leverage/` (once implementing)

---

## 0. Register claims — read this before drafting anything adjacent

**This RFC claims three shared, single-writer resources. Saying so loudly is the point
of the registers.**

| Resource | Claim | Shape |
|---|---|---|
| **Pack schema** | **0.23** | Additive. `$defs/guard` gains `conditions[]`; new `$defs/engineCondition` (closed four-arm union); `$defs/deviationCost` gains a fourth arm `category`. Every committed pack stays valid; no content digest moves (`digest.ts` hashes content, not the `$id`). **0.19 is frozen shut; 0.22 is `transition-primitives`.** |
| **Run schema** | **0.16** | Stamp + widen. `EvidenceKind` gains `"tablebase"`; `EvidenceSource` gains `"tablebase_exact"`; `$defs/selectionCandidate` gains optional `wdl` and `scoreCp`; `$defs/selectionEngine` gains optional `searchBound`. No event type is added or removed; no historical row is rewritten. |
| **Migration** | **22** (`STORAGE_VERSION` 21→22) | **Stamp-only, behind `teacher-surface`'s 21.** Frozen literals `"0.15"`→`"0.16"`, no data rewrite — the migration-9 freeze lesson applies: write the literal, never the constant. |

**If you are drafting in parallel: do not claim pack 0.23, run 0.16, or migration 22.**
Rebase here rather than renumbering unilaterally.

**0.23 is contested, and the contest is already resolved.** `planning/work-register.md` §2
puts this RFC in **wave 1** with `rfc/feedback-delivery.md`, and `rfc/vocabulary-wiring.md`
in **wave 2**. `feedback-delivery` states it *"leaves 0.23 free"* and claims no schema
version. `vocabulary-wiring` claims 0.23 for its `plan_signature` leaf but pre-commits, in
its own register block, to renegotiating to **0.24** if a wave-1 draft claims it — which
this one does. **Landing order: `engine-leverage` (0.23) then `vocabulary-wiring` (0.24).**
Its §4 is purely additive and rebases without redesign. Per that draft's own note and this
one's, **`rfc/README.md` is not edited by either draft** — the register rows are the
reviewer's to add.

**What this RFC does NOT claim:** no new opponent mode, no new session kind, no new
token scope, no new table, no new `RunRole`, no new evidence *ref namespace* beyond
`tablebase:` (§3.6), and no change to `EVIDENCE_KINDS` in the authoring-side
`sourcing/types.ts` (the six kinds are unchanged; §2 adds no seventh).

---

## Summary

The engine layer is not short of instruments; it is short of questions. Four instruments
return, inside responses the product already pays for and at zero marginal cost, signals
that no shipped consumer reads — and in two cases that discarded signal is the exact
object a blocked feature needs. Meanwhile **235 machine-validated records sit at the
precise JSON pointer of the field that would consume them, and 0 of 275 deviations
declare a `cost`.**

This RFC specifies four things and one rule. **(1)** `cost` stops being an authored
number: the `verify-draft` pipeline that already rewrites the pack document derives it
from the before/after record pair it already produced, and `sourcing-check` refuses a
declared machine basis that no record supports. **(2)** An **engine-condition surface**
— one grammar, hosted in the existing `guard` block, with five honesty invariants read
off the shipped `guard.evalSwingCp` precedent, of which the sharpest is *a condition may
reference a measurement, never a verdict*. **(3)** `strong_engine` moves to
`go nodes 50000`, the one change here with a fully measured justification: 51/51
reproducible against today's 27.5% score disagreement, **cheaper at the median than the
bound it replaces**, and 84.3% move-preserving. **(4)** Maia's per-move win/draw/loss and
the explorer's per-move outcome split stop being discarded at the parser, each with a
named consumer and an explicit refusal to grade on them yet. **And the rule:** the audit's
definition of 100%, adopted with one addition and one strengthening — a fourth
disposition `unmeasured`, and a machine-enumerated capability register with a test that
fails when an advertised capability has no row.

---

## Motivation

### The finding, in the form that decides the scope

`design/research/authoring-vocabulary-completeness.md` §3 counts six distinguishable
engine outputs and finds **one** referenceable as a condition a pack can be graded by at
play time: `guard.evalSwingCp` / `fireOnMate`, read by `applyRecordedEngineGuard`
(`apps/server/src/guard.ts:199-229`), used by 6 of 37 packs. `assessedBy` is an authored
constant cross-checked once, at pack load, for `/start/fen` only. DTZ/DTM, Maia policy,
explorer win/draw/loss and Stockfish WDL/bestline/top-N have **no condition surface at
all** — `dtz` appears **0 times** across `drill_pack.schema.json`,
`shape_entry.schema.json` and `drill_run.schema.json`.

That is D87. D88 is sharper still, and it is why §2 comes first: `verifyEngineDraft` and
`verifySyzygyDraft` (`apps/server/src/sourcing/verify-draft.ts`) enumerate every authored
position — including, for each deviation, both the **anchor** position and the position
**after** the deviation move (`enumerate`, `:81-86`) — and write one machine-validated
record per position, `supports: [pointer]` (`:270-273`, `:166-173`). Re-derived at
`0c6e139` over `content/drafts/*.evidence.json`: **764 records; 235 anchored to
`/deviations/{i}/moveUci`** (135 `engine_eval` + 100 `tablebase_result`). Every one of
those 135 engine records carries `centipawns` or `mateIn` at `perspective: "white"`,
depth 22, with `engineId` and `engineVersion`. Every one of those 100 tablebase records
carries `category`, `dtz`, `precise_dtz` and `dtm`.

**And `deviation.cost` has exactly one consumer in the entire repo** — the
`GUARD_CANNOT_REACH_DEVIATION` warning at `apps/server/src/pack-validation.ts:841-858`.
Nothing computes it, nothing verifies it, nothing renders it. Zero of 275 deviations
declare one.

The engine has already answered the question. The answer is committed to the repo, next
to the field, at the same pointer. Nothing connects them.

### Why now, and why this scope boundary

The owner's sequencing ruling is content at scale, and
`authoring-vocabulary-completeness.md` §5 ranks the engine-condition gap **6th** by
re-author risk — *"the biggest capability gap and the smallest re-author risk"*, because
a new condition arm and a new evidence kind are additive. That ranking is the scope
boundary: **this RFC must not block the content wave, so everything in it is additive and
nothing in it re-authors an existing pack.** The two gaps that *would* force a re-author
(the unexercised tempo layer; feedback-claim delivery) are not this RFC's — the second is
`feedback-delivery.md`'s, and the first is a content wave, not a format change.

### Explicitly out of scope

- **D91, the audit's §0 band regression, and D58 / D60 / D70 which ride its fix.** A defect
  fix, already landed and pending review; named as a hard prerequisite for §5.1 and
  specified nowhere here.
- **D67/D72** (`identityFor` omits `eloApplied`; `sameEngine` ignores it). The audit notes
  the uncomfortable interaction — while every request was pinned at 1500, `sameEngine`'s
  band-indifference was *accidentally correct*. **D91's fix makes D67 live**, which is a
  reason it needs an owner now, and a reason it is not folded in here.
- **`practical_resistance`'s alphabetical `.slice(0, 4)`** (audit gap 6). §3.4 makes DTZ a
  recorded, referenceable measurement, which supplies the principled cut that gap needs —
  but changing the selector's candidate cut changes opponent behaviour in the one mode
  that claims to measure difficulty, and it deserves its own acceptance evidence.
- **`searchmoves`, asymmetric `SelfElo`/`OppoElo`, MultiPV on the evidence path, local
  `SyzygyPath`, the `moves=12` cap, the `history` series, per-move `averageRating`.**
  Each gets a **published disposition row** under §6 and no implementation.
- **The compare strip, feedback-claim delivery, `stated_reasoning`.** `feedback-delivery.md`.
- **Any claim about chess quality at any band from any instrument.** See §1.

---

## 1. Law 8, stated as a constraint on this specification

Every number this RFC moves is an **instrument measurement about a stated position**.
Nothing here creates a strategic claim, grades a move, or renders an opinion.

Three consequences are load-bearing and are enforced structurally, not by convention:

1. **§3.3 draws the measurement/verdict line and closes the condition union against
   verdicts.** A scalar the instrument emits *about a position* is a measurement. The
   instrument's *choice among moves* is a verdict about chess. `score cp`, `wdl`, `dtz`,
   `policy` mass and explorer outcome counts are the first; `bestmove`, MultiPV **rank**
   and `bestline` are the second, and no condition may reference them.
2. **§5.1 records Maia's `wdl` and refuses to grade on it.** The audit is explicit that
   nothing establishes Maia's `wdl` is calibrated; it establishes only that the
   instrument emits a band-responsive, policy-independent number the product throws away.
   Recording an unvalidated model prediction is honest; conditioning a grade on it is not,
   until the audit's gap 3 runs. §6 gives that state its own disposition (`unmeasured`)
   precisely so it cannot be quietly laundered into a decision.
3. **Every rendered number carries its instrument, its units and its population, and no
   rendered number carries a verdict.** The shipped `CORPUS_GUARD` sentence
   (`apps/web/src/lib/corpus-sentences.ts:3` — *"These counts say what this population
   played, not what is good."*) is the model, and §5.2 extends it rather than inventing a
   second guard.

The anti-pattern named in `AGENTS.md` — *"Stockfish: +0.54 / Maia: 31% / LLM: 'Ne5
centralizes the knight'"* — is a dashboard because the third line is manufactured, and
because the first two are printed unconditionally. This RFC adds no third line, and §5.2
adds no number outside the shipped anti-contamination default
(`design/02-product-shape.md:157-158`): the corpus panel is already gated behind
`permittedAssistance` and `feedbackDeliveryOpen` (`rest.ts`, `route.action === "corpus"`).

---

## 2. `cost` bound to the evidence that already exists (D88)

### 2.1 What a *bound* cost means

> **A deviation's `cost` is bound when a machine-validated record pair in this pack's own
> ledger — one supporting the deviation's anchor pointer, one supporting
> `/deviations/{i}/moveUci`, from the same `sourceId` and the same search bound — yields
> the declared magnitude by the arithmetic in §2.3. A `cost` that is not bound is an
> authored number, and nothing may render it otherwise.**

The `basis` field already carries the distinction and gains teeth rather than a sibling:

| `basis` | Class | Meaning after this RFC |
|---|---|---|
| `engine` | machine | A `engine_eval` record pair backs it. Verified by `sourcing-check`. |
| `tablebase` | machine | A `tablebase_result` record pair backs it. Verified by `sourcing-check`. |
| `material` | rules | Derivable from the FEN pair with no instrument. Verified arithmetically by the checker itself; needs no ledger. |
| `kind: "unmeasurable"` | refusal | The published refusal — state (B) at the row level. Requires a `reason`; today it has 0 users and §2.4 gives it its first. |

### 2.2 The pipeline stamps it; the author stops declaring it

`verifyEngineDraft` and `verifySyzygyDraft` **already rewrite the pack document**
(`writeFile(absolute, ...)` near the end of each, stamping `sourceId` and `retrievedAt`
into `objective.grading.assessedBy`). They therefore already are pack writers, and
extending them is the smallest correct change:

- `enumerate` already returns `parentFen` and `kind: "deviation"` for every deviation
  (`verify-draft.ts:81-86`). For each deviation `i`, the pipeline holds `answers` for both
  `item.parentFen` and `item.fen`.
- After the existing verification passes and before `digestDrillPack`, the pipeline
  **derives `cost` per §2.3 and writes it onto `pack.deviations[i]`**, overwriting any
  previously stamped machine-basis cost and leaving `basis: "material"` and
  `kind: "unmeasurable"` costs untouched **unless** the author declared a machine basis,
  in which case §2.5 applies.
- The digest is computed **after** the stamp, exactly as `assessedBy` already is, so the
  ledger's `packDigest` covers the derived costs and `EVIDENCE_DIGEST_STALE` keeps its
  existing meaning.

This is the point of the whole section: **the author is not asked for a number the
instrument has already produced.** `mistake` remains a human judgment nothing can
backfill (`design/BACKLOG.md`); `cost` is not, and has never been.

### 2.3 The arithmetic

Let `L = pack.start.side`, `sign = L === "white" ? 1 : -1`. Let `before` be the record
supporting the deviation's **anchor pointer** and `after` the record supporting
`/deviations/{i}/moveUci`. The anchor pointer is `/start/fen` when `at` is `atStart` or a
bare `fen`, and the spine node's own `.../moveUci` pointer otherwise — the same resolution
`enumerate` performs, and the same pointer set `authoredPositionPointers`
(`sourcing/check.ts:197-212`) already enumerates.

**Preconditions (all required; failure means "no binding", never a default):**
`before` and `after` exist; same `kind`; same `sourceId`; for `engine_eval`, equal
`engineId`, `engineVersion` and `depth`; for `tablebase_result`, both `pieceCount <= 7`.

**Engine path.** Scores are white-perspective (`values.perspective === "white"`;
`whitePerspectiveScore` normalises at production time).

| `before` | `after` | Derived `cost` |
|---|---|---|
| `centipawns` | `centipawns` | `{kind:"cp", loss: max(0, sign * (before.centipawns - after.centipawns)), basis:"engine"}` |
| `centipawns` | `mateIn`, mate **against** L | `{kind:"mate", against:"learner", basis:"engine"}` |
| `centipawns` | `mateIn`, mate **for** L | no cost is stamped (the deviation improved to a forced mate) |
| `mateIn` for L | `centipawns` | `{kind:"unmeasurable", reason:"a forced mate at the anchor is not comparable to a centipawn score after the deviation"}` |
| `mateIn` against L | anything | no cost is stamped (the anchor was already lost; the deviation is not what cost it) |

"Mate against L" is decided by `mateAgainstLearner` (`guard.ts:180-184`) — white-perspective
`mateIn` sign against the learner colour. **Reuse that function; do not re-derive the sign
convention.** A derived `loss` is clamped to `[0, 30000]` by the shipped schema bound, and
a clamp that binds is an error, not a silent truncation (§2.5, `DEVIATION_COST_OUT_OF_RANGE`).

**Tablebase path.** `learnerCategory` and `CATEGORY_RANK`
(`sourcing/tablebase-category.ts`) already exist and are already used by
`verifySyzygyDraft` to detect spine category regressions. Let `b = learnerCategory(beforeFen, before.category, L)` and
`a = learnerCategory(afterFen, after.category, L)`.

- `CATEGORY_RANK[a] < CATEGORY_RANK[b]` → `{kind:"category", from: b, to: a, basis:"tablebase"}` — **the new fourth `deviationCost` arm** (pack 0.23).
- `a === "loss"` and `before.dtm` present with `after.dtm` present → additionally admissible as `{kind:"mate", against:"learner", basis:"tablebase"}`; the pipeline prefers the `category` arm because it is total (`dtm` is not always published).
- Otherwise no cost is stamped.

The `category` arm's schema:

```jsonc
{ "type": "object",
  "required": ["kind", "from", "to", "basis"],
  "properties": {
    "kind":  { "const": "category" },
    "from":  { "enum": ["win", "loss", "draw", "cursed-win", "blessed-loss"] },
    "to":    { "enum": ["win", "loss", "draw", "cursed-win", "blessed-loss"] },
    "basis": { "const": "tablebase" }
  },
  "additionalProperties": false }
```

`from` and `to` are **learner-relative**, which is what `learnerCategory` returns. The enum
is `ASSESSMENT_CATEGORIES` (`apps/server/src/tablebase.ts:7`) verbatim, in its declared
order — the same five values the pack schema's `assessedBy {kind:"syzygy"}` arm already
spells, so the vocabulary does not fork. Rank comparison is `CATEGORY_RANK`
(`sourcing/tablebase-category.ts:4-14`); a `category` cost whose `from` rank is not
strictly greater than its `to` rank is invalid.

### 2.4 What refuses when the binding is absent

Three refusals at three tiers, each following a shipped precedent rather than inventing
one:

1. **Authoring — `sourcing-check`.** Two new codes in `evidenceSupports`
   (`sourcing/check.ts`), which already walks pack pointers and already emits
   `EVIDENCE_TYPE_UNBACKED` with a `published ? "error" : "warning"` severity split:
   - **`DEVIATION_COST_UNBACKED`** at `/deviations/{i}/cost` — a declared machine basis
     (`engine` or `tablebase`) with no record pair satisfying §2.3's preconditions.
     **Warning on `draft`, error on `published`**, exactly matching `EVIDENCE_TYPE_UNBACKED`.
   - **`DEVIATION_COST_CONTRADICTED`** — the pair exists and the recomputed value differs
     beyond §2.5's tolerance. **Error at every review status.** The precedent is
     `VERIFY_ASSESSMENT_CONTRADICTED`, which `verifyEngineDraft` throws unconditionally
     when the declared root score disagrees with the measured one; a per-deviation
     contradiction is the same failure at a finer grain and gets the same severity.
2. **Capability — `/capabilities`.** `Capabilities` gains
   `costBasis: readonly ("material" | "engine" | "tablebase")[]`, computed exactly as the
   shipped `guardBasis` is (`EngineCapabilities.get` — `["rules"]` or `["rules","engine"]`
   depending on `providers.judge`): `material` always; `engine` when
   `providers.judge !== "none"`; `tablebase` when `providers.tablebase !== "none"`. A
   deployment that cannot verify a basis says so before a client asks.
3. **Surface — no bare number.** Any surface rendering a `cost` renders its basis with it:
   an `engine` cost renders with the `engineId`, `engineVersion` and `depth` from its
   backing record; a `material` cost renders as arithmetic; an `unmeasurable` cost renders
   its `reason`. **A cost with no basis is not rendered at all.** This is the precise half
   of the coordinator ruling that changes: *"no surface may render it as engine-confirmed"*
   becomes *"a surface may render it as engine-confirmed exactly when the ledger backs it,
   and must name the engine when it does."*

### 2.5 Tolerance, and hand-declared costs

The stamped value is canonical. A hand-declared cost — every cost authored before this
pipeline exists — is accepted when it **rounds to the same multiple of 10 cp** as the
measured value; otherwise `DEVIATION_COST_CONTRADICTED`. Mate and category costs must
match exactly. A derived `loss` that would exceed the schema maximum of 30000 raises
`DEVIATION_COST_OUT_OF_RANGE` (error) rather than clamping, because a clamped magnitude is
a false record.

### 2.6 What this does to `GUARD_CANNOT_REACH_DEVIATION`

Nothing structural, and that is the point. `pack-validation.ts:841-858` compares a declared
`cost` against the guard settings in force at the deviation's anchor. Once costs are bound,
that warning stops comparing an opinion to a threshold and starts comparing a
**measurement** to a threshold: *"this deviation costs 210 cp measured at depth 22 and your
guard fires at 200 cp"*. The rule is unchanged, the check is unchanged, and it becomes true.
Do not edit it in this RFC beyond widening its `cost.kind` switch to handle the `category`
arm (a `category` cost reaches the guard when `settings.rulesTier` is true, on the same
footing as `basis: "material"`).

---

## 3. The engine-condition surface (D87)

### 3.1 One grammar, in the block that already has one

`guard.evalSwingCp` is the shipped precedent and this RFC follows its shape rather than
opening a second grammar. **D89 is the reason:** commit `930b367` deleted the corpus's
only `plan_consequence` condition and replaced it with `transition_feature` because two
grammars shipped for one job with no rule for choosing, and the re-author this repo is
trying to prevent had already happened once, silently. A new top-level condition array
next to `guard` would reproduce that exactly.

So: **`guard` gains `conditions[]`**, a closed union, and the two shipped scalar fields
are redefined as shorthands that desugar into it.

```jsonc
"guard": {
  "properties": {
    "evalSwingCp": { … unchanged … },     // shorthand for engine_eval_swing
    "fireOnMate":  { … unchanged … },     // shorthand for engine_mate_appears
    "rulesTier":   { … unchanged … },
    "window":      { … unchanged … },
    "overrides":   { … unchanged … },
    "conditions": {
      "type": "array",
      "maxItems": 8,
      "items": { "$ref": "#/$defs/engineCondition" }
    }
  }
}
```

**Desugaring is normative and load-bearing for backwards compatibility.** A pack that
declares neither `conditions` nor the two scalar fields behaves exactly as today: the
`guardSettings` defaults (`evalSwingCp: 200`, `fireOnMate: true`, `rulesTier: true`)
become the implicit condition list `[{kind:"engine_eval_swing", cp:200},
{kind:"engine_mate_appears"}]`. All 37 authored packs, and the 6 that tune the guard, are
byte-for-byte unaffected. `guard.overrides[]` keeps its existing two fields and its
existing most-specific-wins resolution (`guardSettings`, `guard.ts:100-129`); **per-anchor
overrides of the new arms are deliberately not in 0.23** — see Open questions.

### 3.2 The five honesty invariants

Read off `applyRecordedEngineGuard`, which is the only condition in the product that has
ever been evaluated against a live engine number. **Every arm of the union must satisfy
all five, and an arm that cannot is refused rather than weakened.**

- **C1 — Reader, not requester.** A condition may only read a measurement **already
  recorded on the run** as an `evidence.attached` payload. It may never cause an
  instrument call. `evalAt` (`guard.ts:170-178`) scans `run.events` in reverse for the
  matching payload; it does not ask for one. This keeps the latency budget out of the
  grading path entirely and is why §3.6 specifies *producers* separately from conditions.
- **C2 — Absent means silent, never defaulted.** `applyRecordedEngineGuard` fires only
  when `previousEval !== undefined && consequenceEval !== undefined` (`guard.ts:222`).
  There is no imputed zero, no "assume equal", no last-known value. Every new arm inherits
  this literally: a missing endpoint means the condition does not evaluate, and the
  deployment's inability to produce that measurement is published under §2.4's tier 2
  rather than papered over at evaluation time.
- **C3 — A threshold on a measurement, never a verdict (Law 8).** The author declares a
  comparison against a scalar whose **instrument, units and population are named in the
  record**. The author may not declare a class ("blunder", "inaccuracy", "good"), and no
  instrument output that is itself a *choice among moves* is referenceable. The line, in
  full: `score cp`, `mateIn`, `wdl`, `dtz`/`precise_dtz`, `policy` mass and explorer
  outcome counts are **measurements about a stated position**; `bestmove`, MultiPV **rank**
  and `bestline` are **the instrument's choice**, and are refused as condition subjects
  under §6 with that reason.
- **C4 — Cited when it fires.** A firing carries the evidence ref of the measurement that
  fired it. `applyRecordedEngineGuard` already does this: it finds the applied
  `engine:`-prefixed ref and emits it as the sole `evidenceRefs` entry
  (`guard.ts:225-226`). A firing whose citing ref cannot be found **does not fire** — the
  existing code already has this shape and it must be preserved for the new arms with
  `tablebase:` refs.
- **C5 — Bounded and once.** Every condition is scoped by the authored `guard.window`
  (`insideGuardWindow`) and by `alreadyGenerated`, which refuses a second firing on the
  same node. Unchanged.

### 3.3 The union, and what is deliberately absent from it

`$defs/engineCondition` — a closed `oneOf`. **An arm exists only when a recorded producer
for its measurement exists.** Everything else is published as refused under §6, with the
reason, in the `DECLARED_UNIMPLEMENTED_POLICY_MODES` style (`capabilities.ts:22-25`) —
which the audit correctly identifies as *"the pattern the rest of the layer should copy"*.

| Arm | Reads | Producer | Status in 0.23 |
|---|---|---|---|
| `engine_eval_swing` | `{kind:"eval", source:"engine_validated"}` `values.centipawns` | shipped (`EvidenceExecutor`, `kind:"eval"`) | **live** — desugar target of `evalSwingCp` |
| `engine_mate_appears` | same payload, `values.mateIn` | shipped | **live** — desugar target of `fireOnMate` |
| `tablebase_category_regression` | `{kind:"tablebase", source:"tablebase_exact"}` `values.category` | **new, §3.6** | **live** |
| `tablebase_dtz_regression` | same payload, `values.dtz` / `values.preciseDtz` | **new, §3.6** | **live** |

Arm shapes:

```jsonc
{ "kind": "engine_eval_swing", "cp": <integer 50..1000> }
{ "kind": "engine_mate_appears" }
{ "kind": "tablebase_category_regression" }
{ "kind": "tablebase_dtz_regression", "byAtLeast": <integer 1..500> }
```

Each arm additionally accepts an optional `id` (`$defs/id`) used only in the evidence ref
it emits, so two conditions of the same kind remain distinguishable in a run record.

**Semantics, over the same decision triple `decisionTriple` already builds**
(previous → learner move → consequence, `guard.ts:62-75`):

- `engine_eval_swing` — fires when `centipawnSwing(previous, consequence, L, cp)` is true.
  Unchanged code (`guard.ts:186-197`).
- `engine_mate_appears` — fires when mate against `L` holds at the consequence and not at
  the previous node. Unchanged code.
- `tablebase_category_regression` — fires when `CATEGORY_RANK[learnerCategory(consequence)]
  < CATEGORY_RANK[learnerCategory(previous)]`. This is the endgame analogue of the cp
  swing and it is a **proof**, not a prediction: Syzygy is ground truth, so no validation
  experiment stands between this arm and its use. Requires both probes present with
  categories inside `ASSESSMENT_CATEGORIES`; the five indeterminate values
  `verifySyzygyDraft` already refuses — `syzygy-win`, `maybe-win`, `maybe-loss`,
  `syzygy-loss`, `unknown` — make the condition silent (C2).
- `tablebase_dtz_regression` — fires when both probes carry a non-null DTZ, **both resolve
  to the same learner-relative category**, and `|dtz|` at the consequence exceeds `|dtz|`
  at the previous node by at least `byAtLeast`. Magnitude is `Math.abs(preciseDtz ?? dtz)`,
  the identical metric `#perfectTablebase` already orders by
  (`opponent-selector.ts:616`) — note that `parseTablebasePosition` today keeps
  `precise_dtz` on `TablebaseMove` but **not** on `TablebasePosition`
  (`apps/server/src/tablebase.ts:14-15`), so §3.6's producer must widen the position parse
  to retain it; until it does, the magnitude degrades to `Math.abs(dtz)`.
  **The same-category precondition is what makes this
  honest:** a DTZ comparison across a category change is not a distance comparison, and a
  DTZ comparison is meaningless where the halfmove clock differs in kind. This is the
  product's first *"how far from conversion are you"* axis — the audit's §2c finding that
  `practical_resistance`, the mode whose entire job is *"how hard is this to convert"*,
  reads category only and ignores DTZ.

**Deliberately absent, published as refused (§6):** `human_model_outcome` (Maia `wdl`) —
refused pending the audit's gap 3, because grading on an unvalidated model prediction is
the Law 8 failure this RFC exists to avoid. `human_outcome_share` (explorer per-move
W/D/L) — refused pending run schema 0.16 gaining `corpus_observed` as an `EvidenceSource`
**and** an asynchronous producer that satisfies C1; R9's coverage window (ply ≲ 20 at
≥ 400 games) also means such a condition would be silently inapplicable across most of the
board, which is a reason to design it deliberately rather than quickly. `engine_wdl`
(Stockfish `UCI_ShowWDL`) — refused because `engine_eval_swing` already expresses every
attested case over the same instrument, and a second scalar arm over one instrument is two
grammars for one job (D89). `engine_bestmove` / `engine_multipv_rank` / `engine_bestline` —
refused as **verdicts** under C3; this is Law 8 as a schema constraint rather than a
convention.

### 3.4 Firing, and the record

`applyRulesGuard` and `applyRecordedEngineGuard` keep their signatures and their
`feedbackPolicy !== "immediate_guard"` early return. `applyRecordedEngineGuard` is
generalised to iterate the desugared condition list in **declared order** and fire on the
first match, emitting that condition's citing ref. Firing order is authored, deterministic
and observable — a pack that lists `tablebase_category_regression` before
`engine_eval_swing` gets tablebase-cited feedback when both would fire, and can say so.

Because C4 requires the citing ref, and because the tablebase producer emits refs in a new
namespace, §3.6 is not optional plumbing — it is the thing that makes the two new arms
satisfiable at all.

### 3.5 What this does *not* do

It does not grade. A guard firing generates *feedback*, gated by `feedbackPolicy` and by
`permittedAssistance`; it does not change objective state, does not affect
`successConditions`, and does not touch `objective.grading`. No condition arm here is a
success condition, and no success-condition arm is added — the eight-arm union from pack
0.22 is untouched.

### 3.6 The tablebase evidence producer, and the disclosure hole it must not open

**Run schema 0.16.** `EvidenceKind` (`packages/runtime/src/types.ts:11`) gains
`"tablebase"`; `EvidenceSource` (`:12`) gains `"tablebase_exact"` — the spelling already
used by the pack schema's `feedbackClaim.evidenceTypes` and by `check.ts`'s backing map,
so the vocabulary does not fork. The `evidence.attached` payload's `values` is already
`additionalProperties: true` in `drill_run.schema.json`, so no value shape is added to the
schema; the producer writes `{fen, pieceCount, category, dtz, preciseDtz, sourceId}`.

**Producer.** The runtime already parses and retains DTZ — `TablebasePosition` carries
`dtz` and `TablebaseMove` carries both `dtz` and `preciseDtz`
(`apps/server/src/tablebase.ts:14-15`), and `parseTablebasePosition` keeps them; the
position-level parse is widened to retain `precise_dtz` as well, which is the one line
§3.3's magnitude rule needs. The producer attaches, for each node of a decision
triple with `countFenPieces(fen) <= 7`, one `evidence.attached` event carrying that node's
probe, on the same asynchronous evidence path the `eval` payloads already use — **never
inside the move-commit path** (C1). Refs use a new namespace `tablebase:<jobId>`,
constructed by a `tablebaseEvidenceRef` alongside the shipped `engineEvidenceRef`
(`packages/runtime/src/evidence-ref.ts:84-86`). No run-schema enum changes for refs:
`evidenceRefs` items are `$defs/id`, bare strings.

**The disclosure hole, stated so it is not opened.** `publicEvents` withholds *every*
`evidence.attached` event before disclosure (`engineFeedbackEvent`,
`feedback-policy.ts:57-63`, returns true for the event type unconditionally) — so the new
payload is withheld correctly with no change. But `publicNodes` (`:41-55`) filters a
node's `evidenceRefs` using `isEngineEvidenceRef` **only**, so a `tablebase:` ref attached
to a node would leak through it. **Required:** introduce `isMachineEvidenceRef`, covering
the `engine:` and `tablebase:` namespaces, and use it in `publicNodes`. `isEngineEvidenceRef`
stays exported and unchanged for callers that genuinely mean *engine*. An acceptance test
must assert that a run carrying a `tablebase:` node ref exposes no ref through
`publicNodes` before disclosure. **`publicNodes` keeps its signature** — one predicate is
widened, no parameter is added — which is what keeps this compatible with
`live-surface-honesty.md`'s viewer-blindness assertion.

---

## 4. `strong_engine` → `go nodes 50000` (D35)

### 4.1 Why this is the one change here with a finished argument

D35's ledger row is explicit — *"DO NOT FLIP: only the hash half landed."* The **clear**
obligation shipped with `engine-request-contract`; the wall clock did not.
`#strongEngine` still sends `go movetime ${this.#strongEngineMovetimeMs}` with
`resetSearchState: true` (`opponent-selector.ts:551-561`), default 100 ms
(`DEFAULT_STRONG_ENGINE_PROFILE`, `strong-engine.ts:10-15`).

The audit's arm C measured it on 51 stratified positions, two repeats each, through the
shipped command shape:

| Bound | agree on move | agree on **score** | median / p95 / max | over 500 ms | same move as today |
|---|---:|---:|---:|---:|---:|
| `go movetime 100` (shipped) | 50/51 | **37/51 (72.5%)** | 113.7 / 123.0 / 127.9 ms | 0% | — |
| **`go nodes 50000`** | **51/51** | **51/51** | **98.0 / 158.4 / 183.3 ms** | **0%** | **84.3%** |
| `go depth 12` | 51/51 | 51/51 | 55.6 / 184.5 / 422.0 ms | 0% | 80.4% |
| `go depth 16` | 51/51 | 51/51 | 308.8 / 614.8 / 769.6 ms | **21.6%** | 82.4% |
| `go nodes 200000` | 51/51 | 51/51 | 336.8 / 649.2 / 980.3 ms | **32.4%** | 80.4% |

Two byte-identical requests on a reset engine, same host, same second, disagree on the
score for **14 of 51 positions (27.5%)** today. Every fixed bound is perfectly
reproducible. `go nodes 50000` is the only arm that is simultaneously reproducible,
**cheaper at the median than the bound it replaces**, flat in cost (1.9× median-to-max,
against depth 12's 7.6×), and closest to today's behaviour.

Node-bounding beats depth-bounding not on reproducibility — both give it — but on cost
*shape*: a node budget spends the same work everywhere, while a depth budget spends
whatever the position demands, which is most on exactly the complex middlegames where the
opponent matters most.

### 4.2 The change

`StrongEngineProfile` (`strong-engine.ts:3-8`) gains `nodes: number | null`, default
**50000**. `movetimeMs` **stays** — `RunService`'s evidence path reads
`DEFAULT_STRONG_ENGINE_PROFILE.movetimeMs` as its own default (`service.ts:330`) and must
not be broken by an opponent-side change.

`resolveStrongEngineProfile` validates `nodes` as a positive safe integer when non-null.
`#strongEngine` emits `go nodes ${nodes}` when `nodes !== null`, and `go movetime
${movetimeMs}` otherwise. The `timeoutMs` floor stays `Math.max(5_000, …)`; at a measured
max of 183.3 ms the 5 s floor is ample, and a node bound has no wall-clock term to scale.

**Scope of the switch:** `#strongEngine` only. `enumerate` (the `enumerated` group path),
the evidence executor, `#practicalResistance`'s Maia and tablebase calls, and the authoring
profile are all untouched.

### 4.3 The two-axis latency budget, checked

`design/02-product-shape.md:159-180` splits the budget: the published numbers are **per
instrument call**, and a selection needing several calls carries its own declared,
benchmarked per-selection budget.

- **Per call.** The applicable line is *"shallow Stockfish feedback < 500 ms"*.
  `go nodes 50000`: median 98.0 ms, p95 158.4 ms, max 183.3 ms, **0% over 500 ms**. Passes,
  and improves on the shipped 113.7 ms median.
- **Per selection.** `#strongEngine` is **one call**, so its per-selection budget *equals*
  its per-call budget, and this RFC declares it as such. The design doc requires that
  every per-selection budget be *declared and benchmarked like the per-call ones* — this
  is the declaration, and §8 carries the benchmark.
- The audit's own caveat is carried forward: its latencies were measured on a loaded host
  and are **upper bounds**, comparable within the dossier only. That makes the passing
  result conservative, not optimistic.

### 4.4 The **record** obligation

Converting to a reproducible bound without recording it would trade a *clear* violation
for a *record* violation. `$defs/selectionEngine` (run 0.16) gains optional:

```jsonc
"searchBound": {
  "type": "object",
  "required": ["kind", "value"],
  "properties": {
    "kind":  { "enum": ["nodes", "movetime"] },
    "value": { "type": "integer", "minimum": 1 }
  },
  "additionalProperties": false
}
```

populated by `#strongEngine` from the resolved profile. Historical selections omit it and
are never inferred — the same rule migration 5 applied to `policyModeApplied`. `/capabilities`
publishes the resolved profile already (`policyProfiles.strong_engine`), so the new field
appears there with no further change.

**What this closes.** D35's remaining half; the fifth of five modes becomes reproducible in
its *answer*; and the group reply journal's purity claim — *shipped modes are pure
functions of position and mode* — becomes true for `strong_engine` for the first time.
**What it does not close:** the *record* violations audit §0 opened on the three Maia
modes. Those are D91's, they are landed pending review, and they are not this RFC's.

### 4.5 It changes opponent strength, and that is why it is here

84.3% move-preserving means roughly one opponent reply in six changes. That is a product
change, which is precisely why `engine-request-contract` open question 2 ruled it belonged
in an RFC rather than a defect fix. The cost curve that ruling said was missing is now
supplied, and it says the change is affordable in both directions.

---

## 5. The two discarded signals (audit §3)

Both are emitted at zero marginal cost inside responses the product already pays for. Both
are discarded by a single parser. **This section says what consumes them.**

### 5.1 Maia's per-move win/draw/loss — recorded, rendered, not graded

**Measured:** `wdl` and `score cp` present on **3,456 of 3,456** candidate rows (100.00%);
the `wdl`-best move differs from the `policy`-best move on **120 of 200 probes (60.0%)**;
Spearman ρ(policy, wdl expected score) median **0.558**; **777 of 779** (position, move)
pairs change `wdl` between band 1000 and 2400; median expected-score spread within a probe
**0.191**, and **0.190 in the middlegame** — the phase where R4 says the engine is silent
and R9 says the human corpus has run out.

`candidateLines` (`opponent-selector.ts:234-256`) matches three tokens — `multipv`, `pv`,
`policy` — on lines that carry five. It parses `score cp` and `wdl` and drops them on the
floor.

**Change.** `candidateLines` additionally parses `score cp <n>` and `wdl <w> <d> <l>`.
`SelectionCandidate` (run 0.16) gains optional `scoreCp` (integer) and `wdl`
(`{win, draw, loss}`, each integer 0..1000 — the UCI permille convention the shipped
Stockfish `wdl` executor already emits). `$defs/selectionCandidate` currently has
`additionalProperties: false`, which is why this is a schema claim and not a free
addition.

**Consumers, named:**

1. **`GET /runs/:id/human-split`** returns `selection.candidates` verbatim
   (`rest.ts`, `route.action === "human-split"`), so the distribution reaches the shipped
   human-split panel the moment the candidate carries it — no route change, no new
   surface, and the existing `permittedAssistance` / `humanSplit` gate keeps governing it.
2. **The audit's gap 3.** Recording it inside production selections is what makes the
   validation experiment runnable against real runs rather than a harness. R9's ground
   truth already exists for ply ≤ 20 at ≥ 400 games; nobody has run the comparison.

**Rendering is constrained, and grading is refused.** The human-split panel must label it
as *a model's prediction of human outcomes at a stated band*, never as an outcome, and
never ranked against the policy order. **No condition arm reads it** (§3.3), and §6 gives
it disposition `unmeasured` naming gap 3 as the experiment that would move it. This is the
audit's own sequencing: *"whether it is trustworthy is an unrun experiment."*

**Hard prerequisite, and it is nearly discharged.** While the audit §0 regression stood,
every Maia request was conditioned at 1500 while `eloApplied` recorded the requested band;
recording a `wdl` alongside that record stamps a band-conditioned number with a band it
was not conditioned at — a *record* violation, and one that would silently poison gap 3's
own data. D91's fix has landed (`#maia` now emits the `SelfElo`/`OppoElo` defaults before
`Elo`) and sits **pending independent review** in `planning/work-register.md` §0.
**§5.1 does not land until that review closes**, and acceptance criterion 22 is the
standing guard against the failure recurring in a new shape.

### 5.2 The explorer's per-move outcome split — the middlegame's only real oracle

**Measured (R9):** the split separates **475 of 2,814 (16.9%)** engine-tied move pairs
(|Δcp| < 30) by ≥ 5 pp significantly, max 22.3 pp, with Pearson(cp, score) of −0.079 — it
discriminates precisely where the engine cannot.
`rfc/archive/resistance-spectrum.md` names it as *"the object 'practical difficulty'
actually wants."*

`parseCorpusResponse` (`apps/server/src/corpus.ts:58-66`) reads `mw`, `md`, `mb` off every
move and immediately sums them into `playedCount`. The split never reaches `CorpusResult`.
The authoring parser two directories away already keeps it (`sourcing/explorer.ts`,
`parseStats` — `white`, `draws`, `black`, `averageRating` per move).

**Change — and it is small.** `CorpusResult`'s `stats` arm gains `white`, `draws`, `black`
per move alongside `playedCount` and `sharePct`. `playedCount` and `sharePct` keep their
meaning and their sort order (`b.playedCount - a.playedCount || a.san.localeCompare(b.san)`)
so no existing consumer moves.

**Consumers, named:**

1. **The corpus panel.** `renderCorpusPage` (`apps/web/src/lib/corpus-sentences.ts:16`)
   extends its per-move line with the outcome split as three percentages of that move's own
   games, in the same shape it already uses for the position-level split at `:15`. The
   shipped `CORPUS_GUARD` sentence already carries the Law 8 label and is not duplicated.
   The panel remains behind `permittedAssistance.corpus` and `feedbackDeliveryOpen`.
2. **The authoring ledger.** `ExplorerTemplateValues` in `attachExplorerEvidence`
   (`sourcing/explorer.ts`) currently reduces a move to `playedCount`/`total`/`sharePct`,
   so the **0 `explorer_frequency` records that exist in `content/`** would carry no split
   even if they existed. Its `values` gains `white`, `draws`, `black`. The registered
   template's rendered sentence is **unchanged** — this adds recorded values, not new
   authored prose, and therefore moves no `EVIDENCE_TEMPLATE_CONFLICT` or
   `EVIDENCE_OVERREACH` behaviour.
3. **D78's compare strip** — *"and how did that turn out for people like you"* — is the
   surface that most wants this, and it is **`feedback-delivery.md`'s to specify.** Named
   as a downstream consumer; not specified here.

**Not changed here:** the repertoire gap priority (`repertoire.ts`, `mass = item.mass *
(reply.playedCount / stats.total)`). Making that outcome-aware is a ranking change with its
own evidence burden. Named in Open questions.

**Scope caveat, carried from R9 rather than invented:** this is available only where
explorer coverage is — ply ≲ 20 at ≥ 400 games — and the shipped 100-game abstention floor
resolves 60/40 and nothing finer. The split must never be rendered as more precise than its
sample supports; the existing `no_data_at_band` abstention is the mechanism and it is
unchanged.

### 5.3 Stockfish's `wdl` evidence kind — wired, not deleted

Audit gap 7: `kind: "wdl"` is built end-to-end — `EvidenceExecutor` sets `UCI_ShowWDL` and
parses the triple (`evidence-queue.ts:337`, `:369-382`), `EvidenceKind` includes it, the run
schema admits it, the web sentence layer handles it — with **zero production producers**,
because `rest.ts`'s analysis route rejects anything but `bestline` (*"analysis kind must be
bestline"*).

**Change:** widen that gate to `bestline | eval | wdl`. One condition, and a fully-built,
schema-supported, client-rendered capability stops being a fourth-state ghost. The queue's
existing concurrency, rewind-aware cancellation and staged-result behaviour are unchanged,
and `EvidenceKind` is unchanged.

**No condition arm reads it** (§3.3, D89). This is publication and delivery, not grading.

---

## 6. What "100%" means — the audit's definition, adopted with one addition

### 6.1 Adopted

> *The engine layer is at 100% when every capability its instruments publish is either*
> **(A) reached** *by a request that satisfies all five obligations and feeds a named
> product surface,* **(B) published as deliberately unreached, with the reason,** *or*
> **(C) named as a measured impossibility. And no capability sits in a fourth state —
> silently unused, or used without the record saying so.*

Adopted as written. The layer's honesty apparatus already exists and is good —
`DECLARED_UNIMPLEMENTED_POLICY_MODES` publishes `plan_defense` and `human_external` as
declared-and-refused with machine-checked reasons — and **100% is that pattern applied to
capabilities, not just to modes.**

### 6.2 Improved, in two ways

**Addition — a fourth disposition, `unmeasured`.** The audit's three do not cover the
state this RFC is actually in on Maia's `wdl`: not reached, not refused, not impossible —
**undecided, because the experiment that would decide it has not run.** Filing that under
(B) launders an open question into a decision, which is the exact failure mode the
declared-vs-executable law exists to catch. So the disposition vocabulary is:

| Disposition | Meaning | Obligation |
|---|---|---|
| `reached` | A production request uses it and a named surface consumes it | Name the surface |
| `refused` | Deliberately unreached | Name the reason |
| `unmeasured` | Undecided pending a named experiment | **Name the experiment and its ledger row.** The only disposition carrying an expiry obligation: it must be revisited when the experiment lands or be re-filed as `refused` |
| `impossible` | A measured impossibility | Name the measurement that established it |

**Strengthening — machine-enumerated and gated, not prose.** A definition that lives only
in a dossier reproduces the fourth state one dossier later. So:

- `CAPABILITY_DISPOSITIONS` — a frozen table in `apps/server/src/capabilities.ts`, one row
  per published instrument capability: `{instrument, capability, disposition, reason,
  surface?, experiment?}`.
- `/capabilities` publishes it as `capabilityDispositions`. This also discharges the
  audit's gap 5 in the direction it asked for: the deployment stops knowing its
  instruments' contract without telling the client.
- **A test fails when an advertised capability has no row.** `EngineHealth.options`
  already retains the complete advertised option table (retained since `43c6c4a`), so the
  test enumerates advertised option names per engine and diffs them against the table.
  This is what turns "no fourth silent state" from a claim into a gate, and it is why the
  improvement is worth its cost: the audit's headline defect was found *because* a
  capability measurement returned an impossible zero — machine enumeration is how that
  happens on purpose rather than by luck.

### 6.3 The initial table

Rows this RFC lands, with the disposition it lands them at. This is the register's seed,
not its final contents.

| Instrument | Capability | Disposition | Reason / surface / experiment |
|---|---|---|---|
| Stockfish | `score cp` / `mate` | `reached` | evidence path; `engine_eval_swing`, `engine_mate_appears`; `cost` basis `engine` (§2) |
| Stockfish | `UCI_ShowWDL` | `reached` (§5.3) | analysis route; web sentence layer. No condition arm — D89 |
| Stockfish | `go nodes` | `reached` (§4) | `strong_engine` search bound |
| Stockfish | `bestmove` / MultiPV **rank** / `bestline` | `refused` | **verdicts, not measurements** — C3/Law 8. `bestline` remains reachable as *rendered evidence*, never as a condition subject |
| Stockfish | MultiPV > 1 outside `enumerate` | `refused` | no attested authoring need; the compare strip's ranked-alternatives case is `feedback-delivery.md`'s |
| Stockfish | `searchmoves` | `unmeasured` | would score a named move set in one search — the cheap validator for authored concession sets. Audit gap 8; no experiment run |
| Stockfish | `SyzygyPath` / `SyzygyProbeLimit` | `refused` | the hosted tablebase is the shipped path and its 7-piece refusal is published; in-process probing changes the licence and deployment story |
| Stockfish | `UCI_LimitStrength` / `UCI_Elo` / `Skill Level` | `refused` | weakened Stockfish is rejected doctrine (`AGENTS.md` §Rejected) |
| Stockfish | `nodestime`, `Ponder`, `go mate` | `refused` | no product question asks for them |
| Maia | `policy` mass | `reached` | `candidateLines`; every Maia mode |
| Maia | per-move `wdl` | `reached` as a **record**, `unmeasured` as a **condition** (§5.1) | surface: human-split panel. Experiment: audit gap 3 — validate against R9's ground truth, ply ≤ 20 at ≥ 400 games |
| Maia | per-move `score cp` | `reached` as a record (§5.1) | same surface; no condition arm |
| Maia | `Temperature 0` | `refused` | a modal opponent is a different product (`engine-request-contract` §5) |
| Maia | asymmetric `SelfElo` ≠ `OppoElo` | `unmeasured` | *"you at X against an opponent at Y"* — advertised, never used, never measured; the exact conditioning the product's resistance idea describes. RFC ledger row 5, still open. Newly reachable now that D91 sends the pair explicitly |
| Syzygy | `category` | `reached` | opponent modes; `branchDecidedness`; `tablebase_category_regression` (§3.3) |
| Syzygy | `dtz` / `precise_dtz` | `reached` (§3.3, §3.6) | `tablebase_dtz_regression`; `cost` basis `tablebase` |
| Syzygy | `dtm` | `refused` | not published for every position; the `category` arm is total where `dtm` is not (§2.3) |
| Explorer | position `white`/`draws`/`black` | `reached` | corpus panel |
| Explorer | per-move `white`/`draws`/`black` | `reached` as a **record and a render**, `refused` as a **condition** (§5.2) | surfaces: corpus panel, authoring ledger. Condition refused pending run 0.16 `corpus_observed` + a C1-satisfying producer |
| Explorer | per-move `averageRating` | `unmeasured` | a within-band skew check; kept by the authoring parser, unread at runtime; no experiment run |
| Explorer | monthly `history` series | `refused` | requested and reduced to one string deliberately — R9 measured temporal drift at 0.58 pp, below any threshold a surface could act on. **Stop requesting `history=true` where only the newest month is used** |
| Explorer | `topGames` / `recentGames` / masters DB | `refused` | per-game data has scope and licence questions; `/masters` ruled redundant (`teardown-365chess-desk.md`) |
| Explorer | `moves` beyond 12 | `unmeasured` | the cap is unexamined; no experiment run |
| Supervisor | `EngineHealth.options` | `reached` (§6.2) | `/capabilities` publishes the option table |
| Supervisor | `stockfish-play` identity | `refused` **to remain unpublished — flagged** | the opponent engine's identity is omitted from `capabilities.engines` while its profile is published. RFC ledger row 1, still open; **this row is the ledger's, and the register test will fail on it until it is decided** |
| Supervisor | `EngineRequest.afterCommands` | `refused` | zero production callers by design; the `state` obligation replaced it. Document as reserved or delete |
| — | measured middlegame difficulty against a real human population | `impossible` | R4 (engines silent on undecided positions) + R9 (human games stop at ply ~20). Gap 3 can only ever convert this to *a model's prediction of human outcomes*, which is a weaker and different claim and must be labelled as such wherever it is rendered |

---

## 7. Deviations from design

1. **`design/03-product-breadth.md` names no engine-condition surface.** §3 has no
   design-tier parent. Escalated as a `DESIGN-GAP`, not written — design tier is intent
   tier and this RFC may not author it. Open questions carries it.
2. **`design/02-product-shape.md:159-180`** — no deviation. §4.3 declares
   `strong_engine`'s per-selection budget as equal to its per-call budget, which is the
   declaration the split requires, and benchmarks it in §8.
3. **`design/02-product-shape.md:157-158`** (anti-contamination default) — no deviation.
   Every number §5 exposes is behind an already-shipped assistance gate; none is shown by
   default.
4. **`design/04-content-architecture.md`** — no deviation. Everything is additive; §2's
   `cost` derivation *reduces* authoring burden rather than adding to it.
5. **The 2026-08-15 coordinator ruling that `cost` ships UNBACKED** is superseded, in this
   RFC, in exactly one direction: a cost is UNBACKED **unless** the ledger backs it, and
   the ruling's operative clause (*"no surface may render it as engine-confirmed"*) is
   preserved verbatim for every unbound cost. This is the change the ruling anticipated —
   it named the binding as *"real work neither wave scoped"* — not a reversal of it.

---

## 8. Acceptance criteria

**Register**

1. `DRILL_PACK_SCHEMA_VERSION` is `"0.23"`, `DRILL_RUN_SCHEMA_VERSION` is `"0.16"`, the
   two `$id`s match, and `STORAGE_VERSION` is 22 with a stamp-only migration body written
   with **frozen string literals** (`"0.15"`→`"0.16"`), never the constants.
2. All 37 authored packs and all 6 `*.browser.json` fixtures validate unchanged under
   0.23, and **no committed pack digest moves**.

**§2 — `cost`**

3. `verify-draft` on a pack with deviations stamps a `cost` on every deviation whose
   before/after record pair satisfies §2.3's preconditions, and stamps none where it does
   not. Run twice, the output is byte-identical.
4. Over `content/drafts/`, the stamped run produces **at least one bound `cost` for each
   of the 135 engine-anchored and 100 tablebase-anchored deviation records** where the
   anchor record is also present, and the count of stamped costs is reported.
5. A pack declaring `basis:"engine"` with no backing pair emits `DEVIATION_COST_UNBACKED`
   — **warning** at `reviewStatus: "draft"`, **error** at `"published"`.
6. A pack declaring a cp cost that does not round to the measured value's nearest 10 cp
   emits `DEVIATION_COST_CONTRADICTED` as an **error at every review status**.
7. A derived `loss` above 30000 emits `DEVIATION_COST_OUT_OF_RANGE` rather than clamping.
8. The mate/cp cross cases in §2.3's table are each covered by a fixture, including the
   `unmeasurable` row — which gives that arm its first user in the repo.
9. `/capabilities` reports `costBasis` and it narrows correctly when `providers.judge` or
   `providers.tablebase` is `"none"`.

**§3 — conditions**

10. A pack declaring neither `guard.conditions` nor the two scalar fields produces
    firings **byte-identical** to HEAD across the 6 guard-using packs — the desugaring is
    proven, not asserted.
11. `tablebase_category_regression` fires on a fixture where the learner category
    regresses across the triple, and **does not fire** when either probe is missing,
    indeterminate (`unknown`/`maybe-win`/`maybe-loss`), or above 7 pieces (C2).
12. `tablebase_dtz_regression` fires only when both probes are present, both carry a
    non-null DTZ, and **both resolve to the same learner-relative category**; a fixture
    asserts silence across a category change.
13. Every firing carries the citing evidence ref of the measurement that fired it, and a
    firing whose ref cannot be found does not fire (C4).
14. **`publicNodes` exposes no `tablebase:` ref before disclosure.** A run carrying one
    proves it.
15. A condition arm naming `bestmove`, MultiPV rank or `bestline` is rejected by schema
    validation — the closed union is the enforcement.

**§4 — `go nodes 50000`**

16. `#strongEngine` emits `go nodes 50000` by default, and `go movetime <n>` when `nodes`
    is null. Asserted through the **real-engine** suite, not a fake client alone, and the
    fixture is registered under `fixture-realism.md` — audit §0's lesson.
17. Two identical `strong_engine` selections on a reset engine agree on **both** the best
    move and the score, on the audit's 51-position corpus: **51/51**.
18. Benchmark reported: median, p95 and max per call, and the **declared per-selection
    budget** (§4.3) with its measurement. Zero calls over 500 ms.
19. `selectionEngine.searchBound` appears on every new `strong_engine` selection and is
    absent — never inferred — on historical ones.
20. `service.analysis`'s evidence default still resolves through
    `DEFAULT_STRONG_ENGINE_PROFILE.movetimeMs` and is unaffected.

**§5 — the discarded signals**

21. `candidateLines` parses `score cp` and `wdl` on **100%** of Maia candidate rows in the
    captured fixtures, and `GET /runs/:id/human-split` returns them.
22. **§5.1 does not land while D91's review is open.** A test asserts, through the
    **real-engine** suite, that a recorded `wdl` carries an `eloApplied` equal to the band
    the emitted command array actually applied — the standing guard against the audit §0
    failure recurring in a new shape, and the one the fixture-realism lesson demands.
23. `parseCorpusResponse` carries `white`/`draws`/`black` per move; `renderCorpusPage`
    renders the split; the position-level sentence and the move sort order are unchanged.
24. `explorer_frequency` records carry the split in `values`, with the rendered template
    sentence unchanged and `sourcing-check` clean.
25. `POST /runs/:id/analysis {kind:"wdl"}` and `{kind:"eval"}` are accepted and produce
    payloads; the `wdl` evidence kind has a production producer for the first time.

**§6 — the 100% rule**

26. `/capabilities` publishes `capabilityDispositions` containing every row in §6.3.
27. **A test fails when an engine advertises an option with no disposition row**, driven
    off `EngineHealth.options`. It is expected to **fail today** on the `stockfish-play`
    identity row (§6.3, last-but-two) until that ledger question is decided — and that
    expected failure is the register working, not a defect in it.
28. Every `unmeasured` row names an experiment and a ledger row; a row that does not is a
    test failure.

**Protocol**

29. Archiving this RFC flips its `design/BACKLOG.md` rows (D35, D87, D88 at minimum) 💡→✅
    with one-line summaries **and** appends its entry to `planning/exploration/log.md`, in
    the same commit (`AGENTS.md` RFC completion protocol, both clauses).

---

## Open questions

1. **The design-tier gap is the first one.** `design/03-product-breadth.md` names no
   engine-condition surface, so §3 specifies against a dossier rather than an intent
   document. Should the condition surface be named in `03`, or is `05-in-run-experience.md`
   its home (it is closer to the assistance ladder than to the surface map)? **Owner
   ruling wanted before `accepted`.**
2. **Per-anchor overrides of the new arms.** `guard.overrides[]` carries `evalSwingCp` and
   `fireOnMate` only; 0.23 deliberately does not widen it to the tablebase arms. Is
   pack-level-only right, or does an endgame pack need *"this DTZ threshold at this
   anchor"*? Deferred pending one authored pack that wants it — the repo's own attestation
   bar.
3. **C2's silence is silent.** A condition that does not evaluate because its measurement
   is absent leaves no trace on the run. That is correct for the guard today, but it means
   *"the tablebase was unreachable"* and *"the position was decided"* look identical from
   the record. A `condition.abstained` event would fix it and costs a run schema change
   this RFC declines to add on top of three register claims. Defer to a named follow-up, or
   fold it into 0.16 before `accepted`?
4. **Does the explorer condition arm ever land?** §3.3 refuses it pending run 0.16 gaining
   `corpus_observed` and a C1-satisfying asynchronous producer. R9's window (ply ≲ 20,
   ≥ 400 games) means such a condition is inapplicable across most of the board. Is a
   condition that silently does not apply in the middlegame worth having at all, or is the
   split a **render-only** signal permanently? This RFC assumes the latter until an
   authoring case argues otherwise.
5. **Outcome-aware repertoire gap priority.** `repertoire.ts` weights gaps by frequency
   alone. The split makes *"this gap loses games, that one merely occurs"* expressible. A
   ranking change with its own evidence burden — whose RFC?
6. **Gap 3's result changes §6.3's Maia row either way, and the expiry obligation needs a
   deadline.** `unmeasured` is the only disposition that must be revisited. What forces the
   revisit — a date, a wave boundary, or a test that fails when an `unmeasured` row is
   older than N days?
7. **`stockfish-play`'s identity** (§6.3) is the one row where the register test is
   expected to fail on landing. Publish it (and accept that the opponent engine's identity
   becomes client-visible), or file it `refused` with a reason? RFC ledger row 1 has been
   open since `engine-request-contract`; this RFC surfaces it rather than deciding it.
8. **Does §2's stamping make `verify-draft` a required step for any pack with
   deviations?** Today 5 of 37 packs have no ledger at all. Their deviations can never
   carry a bound cost. Is *"a pack with deviations and no ledger cannot be published"* the
   right rule, and is it this RFC's to make or the content wave's?

---

## Changelog

- 2026-08-15: created. Claims pack schema **0.23**, run schema **0.16**, migration **22**.
