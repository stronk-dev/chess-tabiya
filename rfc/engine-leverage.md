# RFC: Engine leverage — the instrument has already answered

- **Status:** **implementing 2026-08-16.** Open questions **1 and 9 are owner-ruled**, and
  **3 and 7 are coordinator-closed — all four in the question bodies below**, corrected
  2026-08-16 after codex found 3 and 7 resolved in this line only. Questions 3 and 7 are
  closed on their own stated fallbacks, which is within the standing ruling *"just
  make nice waves… as long as we get them all done"*: **Q3 defers to a named follow-up**
  rather than folding a run-schema change onto three register claims, and **Q7 files
  `stockfish-play`'s identity `refused` with its reason** rather than making the opponent
  engine's identity client-visible. Both are recorded as decisions with reasons, not as
  silence. *History: claude marked this `accepted` prematurely earlier on 2026-08-15 while
  questions 1 and 3 stood, and codex correctly refused to implement it.*
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
  *Every code site in this RFC is cited **by symbol name**; line numbers are advisory.
  They were read at `0c6e139` by the author and **re-checked at `a9c31a6` by cross-review**,
  which is the commit every "verified"/"re-derived" claim below refers to. Locate
  `applyRecordedEngineGuard`, `guardSettings`, `deviationGuardSettings`,
  `evalAt`, `candidateLines`, `#strongEngine`, `#maia`, `#practicalResistance`,
  `resolveStrongEngineProfile`, `parseCorpusResponse`, `parseTablebasePosition`,
  `LichessTablebaseSource`, `enumerate`, `verifyEngineDraft`, `verifySyzygyDraft`,
  `digestDrillPack`, `evidenceSupports`, `authoredPositionPointers`, `publicNodes`,
  `publicEvents`, `engineFeedbackEvent`, `isEngineEvidenceRef`,
  `DECLARED_UNIMPLEMENTED_POLICY_MODES` and `EngineCapabilities.get` by name, not by
  number. **Two symbols the first draft cited do not exist and have been removed:
  `$defs/guard` (the guard block is `properties.guard`) and `whitePerspectiveScore`
  (`perspective: "white"` is a stamped literal, not a normaliser).*
- **Exploration gate:** owner ruling 2026-08-15 — *"engine let's get it to 100% too"*,
  restated and answered as `design/research/engine-layer-capability-audit.md`, whose §6
  ordered gap list is this RFC's scope, and
  `design/research/authoring-vocabulary-completeness.md` §3, whose engine-leverage
  finding is D87. Both dossiers are the entire evidence base; no claim here is new
  research.
- **Depends on:**
  - **D91 — the `SelfElo`/`OppoElo` band regression (audit §0, gap 1). CLOSED, and this
    RFC's §5.1 gate is therefore discharged.** `design/BACKLOG.md` row D91 records
    **CLOSED 2026-08-15 by `0985fa4`**; `planning/work-register.md` §0 strikes the row
    through with the same commit; and the closure is verified in the shipped file —
    `#maia` builds `bandDefaults` for `SelfElo`/`OppoElo` and emits them **before** the
    `Elo` line (`opponent-selector.ts`, `#maia`), the audit's `elo-last` arm, measured
    band-responsive on 12/12 positions, with a **real-Maia** integration test
    (`maia.maia.integration.ts`, added by `0985fa4`) proving bands 1000 and 2400 produce
    different policy vectors. **What §5.1 still owes is the standing guard, not the gate:**
    acceptance criterion 22 keeps asserting that a recorded `wdl` carries an `eloApplied`
    equal to the band the emitted command array actually applied, so the failure cannot
    recur in a new shape. D58 rides the same file and is still open; D60/D70 closed with
    D91. Neither is this RFC's.
  - **D64 — manufactured syzygy provenance. CLOSED 2026-08-15 by `8b1b44d`; the hard
    prerequisite below is DISCHARGED.** *(Corrected 2026-08-15. The body carried
    "NOW BLOCKING" for a day after closure while `planning/codex-queue.md` said the
    opposite — claude's recorded standing error, a resolution living in a queue file while
    the body contradicts it. Codex refused to implement the contradiction, which is the
    guard working.)* The defect was real: **135 of 341 committed syzygy entries were
    manufactured**, across **six packs carrying `ledger_verified`**, because `offlineQuery`
    synthesised `retrievedAt` from a FEN hash and asserted `status: 200` from a URL no
    process contacted (`design/BACKLOG.md` row D64). It was closed the right way — the 135
    records were **re-derived against the live tablebase**, not withdrawn — and claude
    independently re-measured 341 entries with **0** matching the synthesis signature.
    §2.3's tablebase arithmetic reads exactly those records and §2.2 stamps the result into
    the pack document and digests it, so before closure this path would have converted
    manufactured provenance into a digest-certified number (ledgered as **D99**).
    **Now unblocked — but criterion 4 is still scoped to the engine path only**, which was
    the cross-review's remedy while D64 was open. Whether to widen it back to the tablebase
    path is a live decision this correction deliberately does NOT make on its own: it is a
    scope change, and the RFC is owner-blocked regardless. §2's engine path was never
    affected — `verify-draft-engine.json` carries full per-FEN provenance and is the pattern
    D64 named as the one that works.
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
    `perfect_tablebase`. This RFC does not change either mode's selection logic.
    **[cross-review correction]** an earlier draft of this line claimed §3.3's DTZ axis was
    the signal *"its §7a handed off"*. It is not: §7a hands **learner-side grading of
    practical difficulty** (a `practical_difficulty` success condition over
    `humanConcessionMass`/`concessionRatio`) to the vocabulary lane, and this RFC takes
    none of it — §3.5 adds no success-condition arm. The DTZ axis answers the **audit's
    §2c / gap 6** instead (`#practicalResistance` sorts category-preserving replies by
    `localeCompare` and takes `.slice(0, 4)`, so the cut ignores the DTZ the same response
    already carries), and gap 6 is out of scope per §Motivation.
  - `rfc/teacher-surface.md` (*draft, owner-blocked*) — **migration order: REASSIGNED
    2026-08-16.** It formerly claimed migration 21 and this RFC sat behind it at 22. That
    made 22 unlandable: `STORAGE_VERSION` is **20**, and 21 belongs to a draft that is
    owner-blocked until `live-marker-quality` is `implemented`. Codex found this and stopped
    rather than inventing a lane. **The register's own rule decides it — the draft that
    cannot land is the one that renegotiates — so `teacher-surface` moves to 22 and this RFC
    takes 21** (`STORAGE_VERSION` 20→21). `teacher-surface` now claims migration 21 and
    lands behind this RFC. No other overlap: it changes no run or pack schema.
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
- **Parent / amends:** amends `properties.guard` (**not** a `$defs` entry — the guard block
  is declared inline on the pack schema root, `additionalProperties: false`; cross-review
  correction) and `$defs/deviationCost` in the pack schema; amends `EvidenceKind`,
  `EvidenceSource`, the `evidence.attached` payload `kind`/`source` **enums in
  `drill_run.schema.json`**, `$defs/selectionCandidate` and `$defs/selectionEngine` in the
  run schema; amends `StrongEngineProfile`, `parseCorpusResponse`, `publicNodes`,
  `pack-validation`'s second copy of the guard-settings resolution (§3.1) and the
  `verify-draft` writers.
- **Supersedes / superseded by:** —
- **Planning:** `planning/engine-leverage/` (once implementing)

---

## 0. Register claims — read this before drafting anything adjacent

**This RFC claims three shared, single-writer resources. Saying so loudly is the point
of the registers.**

| Resource | Claim | Shape |
|---|---|---|
| **Pack schema** | **0.23** | Additive. `properties.guard` gains `conditions[]`; new `$defs/engineCondition` (closed four-arm union); `$defs/deviationCost` gains a fourth arm `category`. Every committed pack stays valid; **the version bump alone moves no content digest** — verified: pack documents carry no `$schema`/`schemaVersion` key, and `digestDrillPack` is RFC 8785 over the document (`packages/schema/src/drill-pack/digest.ts`), so the `$id` is not in the hashed bytes. **§2 is the separate case and it does move digests, deliberately — see the row below the table.** **0.19 is frozen shut; 0.22 is `transition-primitives`.** |
| **Run schema** | **0.16** | Stamp + widen. `EvidenceKind` gains `"tablebase"`; `EvidenceSource` gains `"tablebase_exact"`; **the `evidence.attached` `payload.kind` and `payload.source` enums in `drill_run.schema.json` gain the same two values — this is the change that actually forces 0.16, and the TS types alone do not**; `$defs/selectionCandidate` gains optional `wdl` and `scoreCp`; `$defs/selectionEngine` gains optional `searchBound`. No event type is added or removed; no historical row is rewritten. |
| **Migration** | **21** (`STORAGE_VERSION` **20→21**) | **Reassigned 2026-08-16 from 22.** `STORAGE_VERSION` is 20 at HEAD and 21 was held by owner-blocked `teacher-surface`, which now takes 22 — the register's rule is that the draft which cannot land renegotiates. Stamp-only: frozen literals `"0.15"`→`"0.16"`, no data rewrite. The migration-9 freeze lesson applies — **write the literal, never the constant.** |

**If you are drafting in parallel: do not claim pack 0.23, run 0.16, or migration 21.**
Rebase here rather than renumbering unilaterally.

**Digests: two different claims, and an earlier draft ran them together.** The *schema
bump* moves no digest (row above). **§2's stamping does move digests, on purpose** — it
rewrites `pack.deviations[i].cost` in the document, exactly as `assessedBy` is already
rewritten, and the ledger's `packDigest` is recomputed in the same invocation so the two
move together and `EVIDENCE_DIGEST_STALE` stays clean. Every pack whose deviations gain a
bound cost gets a new digest **and a new committed ledger**. That is a content-tier change
landing with this RFC, and §8 splits the two claims into separate criteria rather than
asserting an impossible "no digest moves" over both.

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
  fix. **D91, D60 and D70 are closed** (`0985fa4`, ledgered by `a9c31a6`); D58 is still
  open and belongs to the same file. Specified nowhere here. §5.1's gate on D91 is
  discharged; only its standing guard (criterion 22) remains.
- **D64, the manufactured syzygy provenance.** Not this RFC's to fix — but it **blocks §2's
  tablebase path**, which is a dependency rather than a scope item. See `Depends on:`.
- **D67/D72** (`identityFor` omits `eloApplied`; `sameEngine` ignores it). The audit notes
  the uncomfortable interaction — while every request was pinned at 1500, `sameEngine`'s
  band-indifference was *accidentally correct*. **D91's fix makes D67 live**, which is a
  reason it needs an owner now, and a reason it is not folded in here.
- **`practical_resistance`'s alphabetical `.slice(0, 4)`** (audit gap 6). §3.3 and §3.6 make
  DTZ a recorded, referenceable measurement, which supplies the principled cut that gap needs —
  but changing the selector's candidate cut changes opponent behaviour in the one mode
  that claims to measure difficulty, and it deserves its own acceptance evidence.
- **`searchmoves`, asymmetric `SelfElo`/`OppoElo`, MultiPV on the evidence path, local
  `SyzygyPath`, the `moves=12` cap, the `history` series, per-move `averageRating`.**
  Each gets a **published disposition row** under §6 and no implementation.
- **The compare strip, feedback-claim delivery, `stated_reasoning`.** `feedback-delivery.md`.
- **Any claim about chess quality at any band from any instrument.** See §1.

---

*Template mapping (`rfc/template.md`): **§§1–6 are the Specification section.** The numbered
form rather than a single `## Specification` heading follows the in-flight convention
(`rfc/teacher-surface.md` does the same); the archived RFCs use the literal heading. Every
other template section is present and in order: Status through Planning, Summary, Motivation,
Deviations from design (§7), Acceptance criteria (§8), Open questions, Changelog. Noted by
cross-review so the divergence is a choice, not an omission.*

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
  **derives `cost` per §2.3 and writes it onto `pack.deviations[i]`**, leaving
  `basis: "material"` and `kind: "unmeasurable"` costs untouched.
- The digest is computed **after** the stamp, exactly as `assessedBy` already is, so the
  ledger's `packDigest` covers the derived costs and `EVIDENCE_DIGEST_STALE` keeps its
  existing meaning. Verified against the shipped order: both writers stamp
  `assessedBy.sourceId`/`retrievedAt`, then call `digestDrillPack(pack)`, then build the
  ledger with `packDigest: digest`, then `assertArtifacts` (which calls `evidenceSupports`,
  `check.ts:158`), then `writeFile`. The cost stamp goes in immediately before
  `digestDrillPack`, which puts it inside all three of those.

**Two rules the draft was missing, and without them the binding is not sound.**

1. **Derive only from records this invocation produced.** `verifyEngineDraft` merges: it
   preserves every ledger record whose `kind` is neither `engine_eval` nor
   `position_legality`, which includes `tablebase_result` rows written by an earlier
   pipeline. Deriving a `tablebase`-basis cost from preserved rows would stamp a
   *this-run-measured* claim from measurements this run did not take, and the fresh digest
   would certify it — the stale-record failure the digest exists to catch, arriving from
   inside the writer. **Normative: a stamped cost is derived only from a record pair
   produced by the current invocation.** In practice that means the engine path stamps
   `engine` costs and the syzygy path stamps `tablebase` costs, and neither stamps the
   other's. A deviation whose only candidate pair is preserved gets **no stamp**, and a
   declared machine basis over it is `DEVIATION_COST_UNBACKED` (§2.4).
2. **Contradiction is raised by the writer, not left to the checker.** An earlier draft had
   the pipeline silently overwrite a previously declared machine-basis cost *and* had
   `sourcing-check` raise `DEVIATION_COST_CONTRADICTED` on the difference. Those cannot both
   happen: `verify-draft` runs `evidenceSupports` on the pack it has already rewritten, so
   the checker never sees the authored value and the code could only ever fire on packs
   whose `verify-draft` had not been re-run. **Normative:** when a deviation already
   declares a machine-basis cost, the pipeline compares it to the derived value and
   **throws** on disagreement beyond §2.5's tolerance — the same shape and the same
   unconditional severity as `VERIFY_ASSESSMENT_CONTRADICTED` — and stamps only where no
   machine-basis cost is declared or where the declared one agrees. `sourcing-check`'s
   `DEVIATION_COST_CONTRADICTED` then keeps its real job: catching a pack edited **after**
   its ledger was written, which is the case the digest alone reports as staleness without
   saying which field moved.

This is the point of the whole section: **the author is not asked for a number the
instrument has already produced.** `mistake` remains a human judgment nothing can
backfill (`design/BACKLOG.md` row *"Deviation class carries two incompatible jobs"* —
*"`class` remains objective-relative and human-only … no machine reclassifies the author's
judgment"*); `cost` is not, and has never been — the same row is the one that shipped it
*"author-declared … without pretending it is verified."*

### 2.3 The arithmetic

Let `L = pack.start.side`, `sign = L === "white" ? 1 : -1`. Let `after` be the record
supporting `/deviations/{i}/moveUci`, and `before` the record for the deviation's **anchor
position**.

**`before` is resolved by FEN, not by pointer, and the draft had this wrong.** The earlier
text said the anchor pointer is `/start/fen` *"when `at` is `atStart` or a bare `fen`"*,
claiming to mirror `enumerate`. `enumerate` does not do that: it resolves the anchor as
`"spineNodeId" in at ? byNode.get(at.spineNodeId) : "fen" in at ? at.fen : pack.start.fen`
(`verify-draft.ts`, `enumerate`). A bare-`fen` anchor is **its own position**, not the
start, so borrowing `/start/fen`'s record would have compared the post-deviation score
against the *root* and produced a confidently wrong `loss` on every `at: {fen}` deviation.
And a bare-`fen` anchor has **no pointer at all**: `authoredPositionPointers`
(`sourcing/check.ts:197-212`) enumerates `/start/fen`, spine `.../moveUci` and deviation
`.../moveUci` — nothing else — so there is no pointer to match on.

**Normative resolution.** Compute the anchor FEN exactly as `enumerate` does, then take
`before` as a record with `record.anchor.fen === anchorFen` of the required `kind`. Both
writers already emit `anchor: { fen }` on every record, and both key their `answers` map by
FEN, so this matches the data the pipeline actually holds. Where several records share a
FEN they carry identical `values` by construction (one query per unique FEN), so the choice
among them is immaterial; where none does, there is **no binding** and no stamp.

**Preconditions (all required; failure means "no binding", never a default):**
`before` and `after` exist **and were both produced by the current invocation** (§2.2 rule
1); same `kind`; same `sourceId`; for `engine_eval`, equal `engineId`, `engineVersion`,
`depth` **and `multiPv` — matching the shipped backing test in `ledger-validation.ts`,
which already requires `multiPv === 1` and `perspective === "white"` of any `engine_eval`
record admitted as backing**; for `tablebase_result`, both `pieceCount <= 7`.

**Engine path.** Scores are white-perspective: `values.perspective` is stamped `"white"`
literally at production time (`sourcing/position-seeds.ts`, the `values` object), and
`sourcing-check` refuses any other value (`check.ts:246`). *(Cross-review: an earlier draft
attributed this to a helper named `whitePerspectiveScore`, which does not exist in the
repo — there is no normalising function, only the stamped literal and the refusal.)*

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

**Tablebase path — gated on D64.** This arm reads exactly the `tablebase_result` records
that D64 found manufactured on six `ledger_verified` packs, and §2.2 stamps its output into
the pack document and digests it. **It may not land until D64 is closed** (see
`Depends on:`). The clause below is specified now so the fix has a consumer, not so it can
ship first.

`learnerCategory` and `CATEGORY_RANK`
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
     contradiction is the same failure at a finer grain and gets the same severity. Its
     live case is a pack edited *after* its ledger was written — see §2.2 rule 2 for why
     the writer, not the checker, owns the fresh-run case.
   - **`DEVIATION_COST_OUT_OF_RANGE`** (§2.5) is a **`SourcingError` thrown by
     `verify-draft`**, not a `sourcing-check` issue: it can only arise while deriving, and
     a derivation that cannot be represented must stop the pipeline rather than emit a
     record. Named here so all three new codes have a stated tier. **Collision sweep, run
     at `a9c31a6`:** none of the three appears anywhere in `apps/`, `packages/` or `rfc/`;
     `SourcingErrorCode` (`sourcing/types.ts`) and the `runtimeWarning` code space are
     disjoint from them; the only code any sibling draft in flight proposes is
     `POLICY_MASS_INVALID`.
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

`pack-validation.ts:841-858` compares a declared `cost` against the guard settings in force
at the deviation's anchor. Once costs are bound, that warning stops comparing an opinion to
a threshold and starts comparing a **measurement** to a threshold.

**But the two magnitudes are measured over different spans, and the draft claimed more than
that.** A derived cp `cost` is a **one-ply** difference — the anchor position against the
position after the deviation move. `guard.evalSwingCp` is a **two-ply** swing — the previous
node against the *consequence*, i.e. after the opponent has replied (`decisionTriple`,
`guard.ts:62-75`; `centipawnSwing`, `:186-197`). So *"costs 210 cp"* and *"the guard fires at
200 cp"* are not the same quantity, and the warning can be wrong in both directions: a
deviation the opponent punishes further will fire a guard the one-ply cost said it could not
reach, and a deviation the opponent fails to punish will not fire one the cost said it
would. **The honest claim is that the comparison stops being opinion-versus-threshold and
becomes measurement-versus-threshold across a known span mismatch**, which is strictly
better than today and still approximate. Say so in the warning text; do not describe it as
exact.

Two required edits, and no more:

- Widen its `cost.kind` switch to the `category` arm. **Not on `settings.rulesTier`** — an
  earlier draft put it there and that is wrong: a tablebase category regression is not the
  rules tier and never was. A `category` cost reaches the guard exactly when the desugared
  condition list at that anchor contains a `tablebase_category_regression` arm (§3.3), which
  is the arm that would actually fire on it.
- The span mismatch above goes into the message, so the author reading the warning knows
  what was compared.

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

The block is declared inline on the pack schema root as `properties.guard` with
`additionalProperties: false` — **not** as a `$defs` entry, which an earlier draft claimed
in two places. `additionalProperties: false` is why `conditions` has to be added explicitly,
and is also why every committed pack stays valid: none declares it.

```jsonc
"properties": {
 "guard": {
  "type": "object",
  "additionalProperties": false,
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

**Desugaring has three sites, not one, and the draft named one.** `guardSettings`
(`guard.ts`) is the runtime one. `apps/server/src/pack-validation.ts` carries a **second,
independent copy** of the same resolution — `guardBase` plus a local
`deviationGuardSettings` closure (`:813-840`) — and both of the checks that read it break
silently if only the runtime site desugars:

- **`GUARD_CANNOT_REACH_DEVIATION`** (§2.6) resolves `evalSwingCp`/`fireOnMate` from the two
  scalars alone. A pack that declares `conditions: [{kind:"engine_eval_swing", cp:120}]` and
  no `evalSwingCp` would be checked against the default 200 and warned wrongly.
- **`GUARD_DISABLES_EVERYTHING`** (`:810-812`) fires when `rulesTier === false`,
  `evalSwingCp === null` and `fireOnMate === false`. A pack that sets all three off and
  carries `conditions: [{kind:"tablebase_category_regression"}]` disables nothing, and would
  be issued a false refusal.

**Normative: the desugaring is one shared helper, used by all three sites** — `guardSettings`,
`deviationGuardSettings`, and `GUARD_DISABLES_EVERYTHING`'s emptiness test, which becomes
*"the desugared condition list is empty and `rulesTier` is false"*. Acceptance criterion 10
covers the runtime; criterion 10a covers these two.

### 3.2 The five honesty invariants

Read off `applyRecordedEngineGuard`, which is the only condition in the product that has
ever been evaluated against a live engine number. **Every arm of the union must satisfy
all five, and an arm that cannot is refused rather than weakened.**

- **C1 — Reader, not requester.** A condition may only read a measurement **already
  recorded on the run** as an `evidence.attached` payload. It may never cause an
  instrument call. `evalAt` (`guard.ts:170-178`) scans `run.events` in reverse for the
  matching payload; it does not ask for one. This keeps the latency budget out of the
  grading path entirely and is why §3.6 specifies *producers* separately from conditions.

  **Checked arm by arm, and it holds directly.** All four arms read `run.events` through the
  same reverse scan (`evalAt`, generalised over `payload.kind`/`source`); none holds a
  client handle; `applyRecordedEngineGuard` takes `run`, `pack`, an applied node id and the
  applied refs, and no selector, queue or tablebase source is in scope. C2 is what closes
  the indirect route: a missing endpoint makes the condition **silent**, so there is never a
  "fetch it and retry" path for an implementation to add.

  **The coupling C1 does not cover, named rather than denied.** An authored tablebase arm
  makes §3.6's producer *necessary* — the arm is unsatisfiable without it. C1 is a statement
  about the evaluation path, not about total instrument traffic. **Normative consequence:
  the producer's scheduling must not be a function of pack content.** It probes decision
  triples on the piece-count rule alone (§3.6), identically whether or not any pack declares
  a tablebase arm, so a pack cannot buy itself extra instrument calls by declaring
  conditions. That is what keeps the budget statement in §3.6 a property of the deployment
  rather than of the corpus.
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

  **C3 is not self-enforcing, and the cross-review broke it once. Three limits, stated so
  the invariant is not read as stronger than it is:**

  1. **A threshold set at the instrument's own optimality boundary is a verdict wearing a
     measurement's clothes — and the draft shipped one.** `tablebase_dtz_regression` was
     specified with `byAtLeast: <integer 1..500>`. Inside a *decided, category-preserved*
     endgame, `|dtz|` decreases under optimal play, so *"`|dtz|` rose by ≥ 1 across the
     triple"* is, to within a ply, *"you did not play a move on the shortest conversion
     path"* — which is `engine_bestmove`, the arm C3 refuses by name, reachable through a
     scalar the same clause calls a measurement. The subject being a measurement is not
     sufficient; **the threshold has to sit far enough off the boundary that the predicate
     is about the position rather than about the ranking.** `engine_eval_swing` already has
     that property and it is not an accident: its shipped floor is `minimum: 50`, and a
     50 cp swing separates neither a unique move nor the engine's top-*n*. The DTZ arm's
     floor was 1. **Fix, and its limit: the floor is raised to `3..500`**, which is the
     only part that is *derivable* — two plies of optimal play strictly decrease `|dtz|`
     absent a zeroing move, so `byAtLeast ∈ {1, 2}` is exactly the optimality boundary and
     3 is the first value off it. **What is not derivable is where "materially harder to
     convert" begins**, and no measurement in the repo establishes it. Manufacturing that
     number here would itself be a Law 8 violation, so the arm carries an `unmeasured`
     disposition row (§6.3) naming the experiment, and Open question 9 asks the owner for
     the floor. **A reviewer who wants C3 airtight rather than merely improved should
     require the arm to land `refused` in 0.23 and return with the experiment.**
  2. **`guard.overrides[].moveUci` lets an author scope a threshold to a single move**
     (`guardSettings`, `guard.ts:111`), so *"fire the engine condition on `e2e4` and on
     nothing else"* is already expressible. That is an **authored** judgment, which the
     product permits and `mistake` already carries — but combined with C4 the firing cites
     an `engine:` ref, so a surface renders instrument attribution over a discrimination the
     author, not the instrument, made. This is pre-existing (0.23 deliberately does not widen
     `overrides` to the new arms, §Open questions 2) and it is the reason C3 is a constraint
     on *what a condition may read*, never a guarantee that a firing was instrument-decided.
  3. **The tablebase producer must not record `moves[]`.** A Lichess tablebase position
     response carries a per-move `category`/`dtz`/`precise_dtz` array (`TablebaseMove`,
     `tablebase.ts:14`) — a complete ranking of every legal move, i.e. the instrument's
     choice in full. §3.6's payload deliberately records the position scalars only. That
     omission is **normative**, not incidental: recording `moves[]` on the run would put a
     verdict inside an `evidence.attached` payload and hand any future arm a way past C3.
- **C4 — Cited when it fires.** A firing carries the evidence ref of the measurement that
  fired it. `applyRecordedEngineGuard` already does this: it finds the applied
  `engine:`-prefixed ref and emits it as the sole `evidenceRefs` entry
  (`guard.ts:225-226`). A firing whose citing ref cannot be found **does not fire** — the
  existing code already has this shape and it must be preserved for the new arms with
  `tablebase:` refs. **Read the shipped mechanism precisely before generalising it:** the
  ref is drawn from `appliedEvidenceRefs`, the refs of the payload whose application
  *triggered this pass*, not from the `evidence.attached` event the condition read
  (`evalAt` returns the event but its ref is never consulted). A tablebase arm therefore
  fires only on a pass triggered by a `tablebase:` application, which is correct but is a
  narrower guarantee than *"the ref of the measurement that fired it"*. **Normative for the
  generalised loop: select the citing ref from `appliedEvidenceRefs` by the namespace the
  matched arm reads** — `engine:` for the two engine arms, `tablebase:` for the two
  tablebase arms — and fire nothing when that namespace is absent from the trigger.
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
| `tablebase_dtz_regression` | same payload, `values.dtz` / `values.preciseDtz` | **new, §3.6** | **live, with a floor the owner must set** — C3 limit 1; §6.3 carries it `unmeasured` and Open question 9 asks for the floor |

Arm shapes:

```jsonc
{ "kind": "engine_eval_swing", "cp": <integer 50..1000> }
{ "kind": "engine_mate_appears" }
{ "kind": "tablebase_category_regression" }
{ "kind": "tablebase_dtz_regression", "byAtLeast": <integer 3..500> }   // floor raised from 1 by cross-review — C3 limit 1
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
  **Two preconditions make this honest, and the second was added by cross-review.** First,
  the **same-category** rule: a DTZ comparison across a category change is not a distance
  comparison, and it is meaningless where the halfmove clock differs in kind. Second, the
  **floor** (C3 limit 1): `byAtLeast` starts at 3 rather than 1, because at 1 or 2 the
  predicate is *"you left the shortest conversion path"*, which is the tablebase's ranking
  of moves and not a fact about the position. Even at 3 the arm sits nearer that boundary
  than `engine_eval_swing` does to its own; §6.3 files it `unmeasured` and Open question 9
  carries the floor to the owner.
  This is the product's first *"how far from conversion are you"* axis, and it is the
  principled cut the audit's §2c / gap 6 wants for `practical_resistance` — the mode whose
  entire job is difficulty, and whose candidate cut sorts category-preserving replies by
  `localeCompare` and takes `.slice(0, 4)`, ignoring the DTZ the same response already
  carries. **Gap 6 itself is out of scope** (§Motivation); this arm only supplies the axis.

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

**Run schema 0.16 — and the JSON schema moves, not only the TS types.** `EvidenceKind`
(`packages/runtime/src/types.ts:11`, today `"eval" | "wdl" | "bestline"`) gains
`"tablebase"`; `EvidenceSource` (`:12`, today `"engine_validated" |
"human_model_predicted"`) gains `"tablebase_exact"` — the spelling already used by the pack
schema's `feedbackClaim.evidenceTypes` and by `check.ts`'s backing map, so the vocabulary
does not fork. **The draft stopped there and it must not:** `drill_run.schema.json` declares
the same two vocabularies as **closed enums** on the `evidence.attached` payload —
`"kind": {"enum": ["eval","wdl","bestline"]}` and `"source": {"enum":
["engine_validated","human_model_predicted"]}`, inside a `payload` object with
`additionalProperties: false`. Both enums gain the new member, and **that** is the edit that
makes 0.16 a schema version rather than a type-only change. What *is* already permissive is
`values`, which is `{"type":"object","additionalProperties":true}` — so no value shape is
added, and the producer writes `{fen, pieceCount, category, dtz, preciseDtz, sourceId}`.
**`moves[]` is not written** — C3 limit 3, normative.

**Producer.** The runtime already parses and retains DTZ — `TablebasePosition` carries
`dtz` and `TablebaseMove` carries both `dtz` and `preciseDtz`
(`apps/server/src/tablebase.ts:14-15`), and `parseTablebasePosition` keeps them; the
position-level parse is widened to retain `precise_dtz` as well, which is the one line
§3.3's magnitude rule needs. The producer attaches, for each node of a decision
triple with `countFenPieces(fen) <= 7`, one `evidence.attached` event carrying that node's
probe, asynchronously and **never inside the move-commit path** (C1). Refs use a new
namespace `tablebase:<jobId>`, constructed by a `tablebaseEvidenceRef` alongside the shipped
`engineEvidenceRef` (`packages/runtime/src/evidence-ref.ts:84-86`). No run-schema enum
changes for refs: `evidenceRefs` items are `$defs/id`, bare strings.

**The producer's cost, which the draft did not budget.** *"The same asynchronous evidence
path the `eval` payloads already use"* was doing too much work: the `eval` path is the
**engine queue** (`EvidenceExecutor`, FIFO, concurrency 2, rewind-aware cancellation),
while a tablebase probe goes through `LichessTablebaseSource`, which is a different client
with a different shape — **single-flight, a four-deep queue that *rejects* with
`TABLEBASE_UNAVAILABLE` ("Interactive tablebase queue is full") once it is full**, a 512-key
never-expiring success cache, a 60 s negative cache and a 4 s request timeout
(`apps/server/src/tablebase.ts`, `LichessTablebaseSource.probe`/`#drain`). That queue is
**shared with `perfect_tablebase` and `practical_resistance`**, which probe on the
interactive selection path. An unbounded per-node producer would contend with the two
opponent modes that need the same client to answer a move, and would push their rejections
up rather than merely queueing its own.

**Normative, and this is the budget declaration `design/02-product-shape.md:159-180`
requires of anything that adds calls:**

- The producer is **cache-first and best-effort**: a probe rejected for a full queue is
  **dropped, not retried**, and the condition is then silent (C2). A dropped probe is never
  an error surfaced to the learner.
- It **yields to the interactive path**: producer probes are enqueued only when the queue is
  empty, so `perfect_tablebase`/`practical_resistance` never lose a slot to evidence.
- It probes **at most the three nodes of a decision triple, once each**, deduplicated by the
  client's own transpose-keyed cache — so the steady-state marginal cost of a repeated or
  rewound line is zero.
- **Axis 1 (per instrument call):** one tablebase lookup, the design doc's own per-call unit,
  bounded by the shipped 4 s client timeout. **Axis 2 (per selection):** the producer is not
  a selection and adds **zero** calls to any selection, which is what the two bullets above
  buy. §8 carries the benchmark; a measured increase in `TABLEBASE_UNAVAILABLE` on the
  opponent path is a failure of this section, not of the tablebase.

**The disclosure hole, stated so it is not opened.** `publicEvents` withholds *every*
`evidence.attached` event before disclosure (`engineFeedbackEvent`,
`feedback-policy.ts:57-63`, returns true for the event type unconditionally) — so the new
payload is withheld correctly with no change. But `publicNodes` (`:41-55`) filters a
node's `evidenceRefs` using `isEngineEvidenceRef` **only**, so a `tablebase:` ref attached
to a node would leak through it. **Required:** introduce `isMachineEvidenceRef`, covering
the `engine:` and `tablebase:` namespaces, and use it in `publicNodes`. `isEngineEvidenceRef`
stays exported and unchanged for callers that genuinely mean *engine*. An acceptance test
must assert that a run carrying a `tablebase:` node ref exposes no ref through
`publicNodes` before disclosure.

**Verified at `a9c31a6`, and the leak is real as described:** `publicNodes`
(`feedback-policy.ts:41-55`) is
`node.evidenceRefs.filter((reference) => !isEngineEvidenceRef(reference))`, and
`isEngineEvidenceRef` is a literal `startsWith("engine:")` test
(`evidence-ref.ts:88-90`), so a `tablebase:` ref passes straight through.

**`publicNodes` keeps its signature** — `(run: DrillRun) => readonly Node[]`; one predicate
is widened, no parameter is added, no viewer, role or identity is introduced — which is what
keeps this compatible with `live-surface-honesty.md`'s viewer-blindness assertion. Confirmed
against the shipped signature, not inferred.

**And there is a second site, one function down.** `engineFeedbackEvent`
(`feedback-policy.ts:57-63`) is the `publicEvents` barrier. Its first arm withholds
`evidence.attached` unconditionally, which is why the new payload needs no change there —
but its **second** arm barriers `objective.state_changed` on
`event.data.evidenceRefs.some(isEngineEvidenceRef)`, the same narrow predicate. §3.5 says
guard firings do not change objective state, so no arm in 0.23 reaches that path — **but
leaving one of two sibling call sites on the narrow predicate is how the next namespace
leaks.** `isMachineEvidenceRef` replaces `isEngineEvidenceRef` in **both**, and an acceptance
test covers the `objective.state_changed` case as well as the node case.

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

**Verified at `a9c31a6`:** `service.ts` reads `options.evidenceMovetimeMs ??
DEFAULT_STRONG_ENGINE_PROFILE.movetimeMs` and then rejects a non-positive value with a
`TypeError`, so `movetimeMs` is load-bearing outside the opponent path and removing or
nulling it by default would break run construction, not merely a fallback. The claim holds
exactly as written.

`resolveStrongEngineProfile` validates `nodes` as a positive safe integer when non-null.
**Note the shape it must not copy:** the shipped validator runs `positiveInteger` over all
four fields unconditionally, so `nodes` needs the null case handled explicitly rather than
added to that list.
`#strongEngine` emits `go nodes ${nodes}` when `nodes !== null`, and `go movetime
${movetimeMs}` otherwise. The `timeoutMs` floor stays `Math.max(5_000, …)`; at a measured
max of 183.3 ms the 5 s floor is ample, and a node bound has no wall-clock term to scale.
**But the shipped expression is `Math.max(5_000, this.#strongEngineMovetimeMs * 10)`** — it
scales off `movetimeMs`, which is no longer the bound in force. Under `nodes` the timeout
is the constant `5_000`, and that must be written rather than left to a stale multiplier.

**Scope of the switch:** `#strongEngine` only. `enumerate` (the `enumerated` group path),
the evidence executor, `#practicalResistance`'s Maia and tablebase calls, and the authoring
profile are all untouched.

### 4.3 The two-axis latency budget, checked

`design/02-product-shape.md:159-180` splits the budget: the published numbers are **per
instrument call**, and a selection needing several calls carries its own declared,
benchmarked per-selection budget.

- **Per call.** *The design doc names no per-call budget for a strong-engine opponent
  reply*, which the draft passed over. The two candidate lines are *"shallow Stockfish
  feedback < 500 ms"* (right instrument, wrong job) and *"uncached Maia < 500 ms"* (right
  job, wrong instrument); a third, *"cached opponent move perceived-instant"*, does not
  apply to an uncached search. **Both candidates are 500 ms, so the verdict does not turn
  on the choice** — stated rather than quietly resolved. `go nodes 50000`: median 98.0 ms,
  p95 158.4 ms, max 183.3 ms, **0% over 500 ms**, and inside the 250 ms *"board ready"*
  line as well. Passes under either mapping, and improves on the shipped 113.7 ms median.
- **Per selection.** `#strongEngine` is **one call** — verified in the shipped body: a
  single `this.#client.execute` with one `go`, no per-candidate loop — so its per-selection
  budget *equals* its per-call budget, and this RFC declares it as such. The design doc
  requires that every per-selection budget be *declared and benchmarked like the per-call
  ones* — this is the declaration, and §8 carries the benchmark.
- **The other thing this RFC adds calls to is §3.6**, and the draft checked only §4 against
  a design ref it cited for the whole document. §3.6 now carries its own two-axis statement
  (zero added calls per selection; one lookup per call, cache-first, yielding to the
  interactive queue).
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
(`{win, draw, loss}`). `$defs/selectionCandidate` currently has
`additionalProperties: false` — verified, alongside its `required: ["moveUci","rank"]` —
which is why this is a schema claim and not a free addition.

**Do not pin the range at `0..1000`, which the draft did.** The claimed justification —
*"the UCI permille convention the shipped Stockfish `wdl` executor already emits"* — is an
inference about **Stockfish** applied to **Maia**, and nothing committed attests it for
Maia: the harness that produced the 3,456-row measurement deliberately does **not** assume
1000, normalising instead by `total = sum(wdl)`
(`tools/engine-capability-harness/analyze.py`, `score()`), and the committed output
(`out/maia-discarded-outputs.json`) keeps only aggregates, so no raw triple is in the repo
to check. Pinning an unattested encoding in a contract RFC is the failure mode the repo's
own rule warns about — pin encoding, not intent, and defer what cannot be pinned. **So:
`{win, draw, loss}` are non-negative integers with no upper bound asserted, and acceptance
criterion 21a captures the observed triples from a real-Maia run, states the convention they
show, and only then may a later RFC narrow the schema.** If they do sum to 1000 the pin is
free to add; if they do not, a `0..1000` schema would have rejected every production
selection.

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

**Hard prerequisite — DISCHARGED, and the gate comes off.** While the audit §0 regression
stood, every Maia request was conditioned at 1500 while `eloApplied` recorded the requested
band; recording a `wdl` alongside that record stamps a band-conditioned number with a band
it was not conditioned at — a *record* violation, and one that would silently poison gap 3's
own data. **D91 is closed** (`design/BACKLOG.md` row D91: *"CLOSED 2026-08-15 by
`0985fa4`"*; `planning/work-register.md` §0 strikes the row through with the same commit;
commit `a9c31a6` records *"D91 and D60 closed for real"*). Verified independently for this
review in the shipped file — `#maia` builds `bandDefaults` from the advertised
`SelfElo`/`OppoElo` defaults and emits them **before** the `Elo` line, and `0985fa4` added
`maia.maia.integration.ts`, a **real-Maia** test proving bands 1000 and 2400 produce
different policy vectors through the production command path. **The earlier text held §5.1
behind a review that has since closed; the block is removed.** What remains is acceptance
criterion 22 as a **standing** guard, not a gate: a recorded `wdl` must carry an
`eloApplied` equal to the band the emitted command array actually applied, asserted through
the real-engine suite, so the failure cannot recur in a new shape. Nothing else in this RFC
assumed the old command order — §4 touches `#strongEngine` only, and §4.2's scope list
names `#maia` nowhere.

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

**Change:** widen that gate to `bestline | eval | wdl` (the shipped line is
`if (body.kind !== "bestline") throw invalid("analysis kind must be bestline")`,
`rest.ts:1354`). One condition, and a fully-built, schema-supported, client-rendered
capability stops being a fourth-state ghost. The queue's existing concurrency, rewind-aware
cancellation and staged-result behaviour are unchanged, and **`EvidenceKind` is unchanged
*by this section*** — §3.6 is what adds `"tablebase"` to it, and an earlier draft's bare
*"`EvidenceKind` is unchanged"* read as a contradiction of that.

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
- **The gate must not be vacuous, and as specified it could be.** `EngineHealth.options` is
  **optional** (`readonly options?: readonly EngineOption[]`, `engine-supervisor.ts:64`), and
  `#maia` already guards every read of it with `health.options?.find(...)`. A diff against
  `undefined` is an empty diff, so a run where no engine handshake retained its table would
  **pass by finding nothing** — the vacuous-assertion shape this repo has ledgered before
  (D61). **Normative: the test fails when `options` is absent for an engine the deployment
  claims to have, rather than skipping**, and its failure message says which engine returned
  no table. An enumeration gate that can pass on an empty enumeration is not a gate.

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
| Syzygy | `dtz` / `precise_dtz` **as a recorded measurement** | `reached` (§3.6) | producer payload; `cost` basis `tablebase` (gated on D64) |
| Syzygy | `dtz` **as a condition threshold** | `unmeasured` (§3.3, C3 limit 1) | **The floor is the open part.** `byAtLeast` at 1–2 is the tablebase's own optimality boundary — i.e. `bestmove` in scalar clothing — so the schema floor is 3; where *"materially harder to convert"* begins is unmeasured. Experiment: the DTZ-delta distribution over category-preserving non-optimal learner moves, against the 100 committed `tablebase_result` deviation records (**after D64**). Ledger row: D87. Open question 9 |
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
   tier and this RFC may not author it. Open questions carries it. **Cross-review confirms
   both halves:** the gap is real (`03` carries no engine-condition, `evalSwingCp` or guard-
   block language at all, and neither does `05-in-run-experience.md`), and the escalation is
   correctly *reported* — no `design/` file is touched by this RFC, which is what Law 5
   requires and what an RFC that quietly wrote its own parent would have violated.
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
   two `$id`s match, and `STORAGE_VERSION` is 21 with a stamp-only migration body written
   with **frozen string literals** (`"0.15"`→`"0.16"`), never the constants.
2. All **37** authored packs and all **7** committed `*.browser.json` fixtures validate
   unchanged under 0.23 — 6 in `content/drafts/` plus `schemas/fixtures/drill-pack/
   terminal-outcome.browser.json`, which the draft's "6" omitted. Re-derived at `a9c31a6`:
   43 pack-shaped documents in `content/drafts/`, of which 6 are `*.browser.json`; 7 carry a
   `guard` block, of which 6 are authored packs — the "6 of 37" the RFC quotes.
2a. **The version bump alone moves no digest**, asserted by digesting every committed pack
   before and after the `$id`/constant change and diffing.
2b. **§2's stamping does move digests, and its criterion is that they move *together*:**
   after `verify-draft` re-runs over `content/drafts/`, every pack whose deviations gained a
   cost has a new digest, its ledger's `packDigest` equals it, and `sourcing-check` reports
   **zero** `EVIDENCE_DIGEST_STALE`. The two claims are separate because they are different
   claims; the draft asserted only the first over both.

**§2 — `cost`**

3. `verify-draft` on a pack with deviations stamps a `cost` on every deviation whose
   before/after record pair satisfies §2.3's preconditions, and stamps none where it does
   not. Run twice, the output is byte-identical.
3a. **No stamp is derived from a preserved record.** A pack whose ledger carries
   `tablebase_result` rows from an earlier pipeline, re-run through `verifyEngineDraft`,
   gains **no** `tablebase`-basis cost (§2.2 rule 1); a declared one is
   `DEVIATION_COST_UNBACKED`.
3b. **A declared machine-basis cost that disagrees beyond tolerance makes `verify-draft`
   throw**, and no rewritten pack is written (§2.2 rule 2). Asserted by re-running the
   pipeline over a pack whose cost was hand-edited.
3c. **A deviation anchored at a bare `fen` binds against that FEN's record, not
   `/start/fen`'s** (§2.3). The fixture uses an `at: {fen}` deviation whose anchor differs
   from the root, and the derived `loss` matches the anchor-to-after difference, not the
   root-to-after one. This is the case the draft got wrong and a passing test would have
   caught.
4. Over `content/drafts/`, the stamped run produces **at least one bound `cost` for each
   of the 135 engine-anchored deviation records** where the anchor record is also present,
   and the count of stamped costs is reported. **The 100 tablebase-anchored records are
   excluded from this criterion until D64 closes** — 135 of 341 committed syzygy entries are
   manufactured, so a criterion demanding costs derived from them would gate this RFC on
   propagating manufactured provenance into pack documents. Re-derived at `a9c31a6`: the
   235/135/100 counts and the 764-record total in §Motivation are all exact.
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
10a. **`pack-validation`'s copy desugars too** (§3.1). A pack declaring
    `conditions: [{kind:"engine_eval_swing", cp:120}]` and no `evalSwingCp` is checked
    against 120, not the default 200, by `GUARD_CANNOT_REACH_DEVIATION`; and a pack with
    `rulesTier:false`, `evalSwingCp:null`, `fireOnMate:false` **plus** a non-empty
    `conditions` list does **not** emit `GUARD_DISABLES_EVERYTHING`. Both fail today against
    the draft as written.
11. `tablebase_category_regression` fires on a fixture where the learner category
    regresses across the triple, and **does not fire** when either probe is missing,
    indeterminate (`unknown`/`maybe-win`/`maybe-loss`), or above 7 pieces (C2).
12. `tablebase_dtz_regression` fires only when both probes are present, both carry a
    non-null DTZ, and **both resolve to the same learner-relative category**; a fixture
    asserts silence across a category change.
12a. **`byAtLeast` below 3 is rejected by schema validation** (C3 limit 1), and a fixture
    asserts that a category-preserved position pair whose `|dtz|` rose by 1 or 2 — the
    ordinary shape of "not on the shortest conversion path" — produces **no firing**. This
    is the adversarial case: without it, the arm is `engine_bestmove` under another name.
12b. **The tablebase producer records no `moves[]`** (C3 limit 3). A test asserts the
    payload's exact key set is `{fen, pieceCount, category, dtz, preciseDtz, sourceId}`.
13. Every firing carries the citing evidence ref of the measurement that fired it, selected
    from `appliedEvidenceRefs` **by the namespace the matched arm reads** (C4), and a firing
    whose ref cannot be found does not fire. A fixture asserts a tablebase arm does **not**
    fire on a pass triggered by an `engine:`-only application.
14. **`publicNodes` exposes no `tablebase:` ref before disclosure**, and **`publicEvents`
    barriers an `objective.state_changed` carrying only a `tablebase:` ref** — both sites of
    the widened predicate (§3.6). A run carrying each proves it. `publicNodes` and
    `publicEvents` still take no viewer, role or identity parameter
    (`live-surface-honesty.md` compatibility).
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
    `DEFAULT_STRONG_ENGINE_PROFILE.movetimeMs` and is unaffected — including its
    positive-safe-integer `TypeError` guard, which a nulled `movetimeMs` would trip at run
    construction rather than at analysis time.
20a. **§3.6's producer adds zero calls to any selection**, and the opponent path's
    `TABLEBASE_UNAVAILABLE` ("queue is full") rate is unchanged with the producer enabled
    against a fixture endgame run. The declared per-call/per-selection budget of §3.6 is
    reported alongside §4's.

**§5 — the discarded signals**

21. `candidateLines` parses `score cp` and `wdl` on **100%** of Maia candidate rows in the
    captured fixtures, and `GET /runs/:id/human-split` returns them.
21a. **The `wdl` encoding is measured, not assumed** (§5.1). A real-Maia run captures raw
    `wdl` triples, the criterion reports their sums, and the schema pins **only** what the
    capture shows. `{win, draw, loss}` ship as non-negative integers; a `0..1000` bound is
    added by a later change **if** the capture supports it. `analyze.py`'s `sum(wdl)`
    normalisation is the reason this is not assumed.
22. **D91's gate is discharged (§5.1); criterion 22 is now a standing guard, not a gate.**
    A test asserts, through the **real-engine** suite, that a recorded `wdl` carries an
    `eloApplied` equal to the band the emitted command array actually applied — the standing
    guard against the audit §0 failure recurring in a new shape, and the one the
    fixture-realism lesson demands.
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
    expected failure is the register working, not a defect in it. **Cross-review check on
    that claim: it is a register working, and only because the expected failure is
    *specific*.** A test that is merely `expected to fail` is a disabled test with extra
    steps; this one names the row, so the day the row is decided the test turns green by
    itself and nobody has to remember. **The landing rule that makes it safe:** the expected
    failure is pinned by row identity (`stockfish-play` identity), so **any other missing
    row is a hard failure**, and the pin is deleted in the same commit that decides the row.
    If it cannot be pinned that narrowly, it is not landed at all.
27a. **The enumeration is not vacuous** (§6.2). A deployment whose `EngineHealth.options` is
    `undefined` for a claimed engine **fails** the test rather than passing on an empty
    diff, and the message names the engine.
28. Every `unmeasured` row names an experiment and a ledger row; a row that does not is a
    test failure.

**Protocol**

29. Archiving this RFC flips its `design/BACKLOG.md` rows (D35, D87, D88 at minimum) 💡→✅
    with one-line summaries **and** appends its entry to `planning/exploration/log.md`, in
    the same commit (`AGENTS.md` RFC completion protocol, both clauses).

---

## Open questions

1. **The design-tier gap is the first one. OWNER RULED 2026-08-15: BOTH — a rung rule in
   `design/05-in-run-experience.md` and a surface row in `design/03-product-breadth.md`.**
   `design/03` names no engine-condition surface, so §3 specified against a dossier rather
   than an intent document. The owner's ruling splits it deliberately: **`05` states when an
   engine condition may fire and speak** (it is a rung-2 admission question, and `05`
   already owns the rungs, the silence default and the live-surface admission rule), and
   **`03` records that the capability exists on the map** so a user-facing surface is not
   missing from the IA. The coordinator flagged the risk in posing it — gate definitions
   split across two docs is the failure law 5 mirrors `gates.md` to prevent — and the owner
   took it knowingly. **Consequence this RFC must honour: the gate surface stays single.**
   Any gate this creates is written in `05` and mirrored into
   `planning/exploration/gates.md`; `03`'s row is a *map entry*, never a second gate
   definition. Both docs are owner tier and are written by claude on this ruling.

2. **Per-anchor overrides of the new arms.** `guard.overrides[]` carries `evalSwingCp` and
   `fireOnMate` only; 0.23 deliberately does not widen it to the tablebase arms. Is
   pack-level-only right, or does an endgame pack need *"this DTZ threshold at this
   anchor"*? Deferred pending one authored pack that wants it — the repo's own attestation
   bar.
3. **C2's silence is silent. CLOSED 2026-08-15 by the coordinator: DEFER to a named
   follow-up; do NOT fold it into run 0.16.** *(Corrected 2026-08-16 — this resolution was
   first written only in the status line while this body still asked the question. Codex
   refused to implement on exactly that basis and was right; it is claude's recorded
   standing error and this is its fifth catch.)* The reasoning is the question's own: a
   `condition.abstained` event costs a **run schema change on top of three register claims**
   already in flight, and this RFC's landing risk is dominated by the number of shared
   resources it holds, not by the size of any one of them. **The named follow-up is
   `rfc/evidence-at-runtime.md`** (drafting), which owns the general problem of a record
   being absent at a node and must decide what silence means there anyway — folding this in
   costs it nothing and costs this RFC a lane it does not need.
   **The defect stands and is real**: *"the tablebase was unreachable"* and *"the position
   was decided"* remain indistinguishable in the record until that lands. *(Original
   question follows.)* A condition that does not evaluate because its measurement
   is absent leaves no trace on the run. That is correct for the guard today, but it means
   those two outcomes look identical from the record.
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
7. **`stockfish-play`'s identity. CLOSED 2026-08-15 by the coordinator: file it `refused`,
   with the reason recorded in the register row itself.** *(Corrected 2026-08-16 — same
   status-line-only error as question 3; see there.)* Publishing it would make the
   **opponent engine's identity client-visible**, which is a disclosure decision this RFC
   has no evidence for and no mandate to take: nothing in `design/03` or `design/05` asks
   for it, and no authored content wants it. `refused` **with a stated reason** is the
   disposition the register exists to carry — it is not silence, and §6.2's enumeration gate
   still counts the row, so the register test passes honestly rather than by exemption.
   **RFC ledger row 1 stays open**; this closes the disposition, not the underlying
   question, and a later RFC with an actual client need may reverse it cheaply.
   *(Original question follows.)* This is the one row where the register test was expected
   to fail on landing.
8. **Does §2's stamping make `verify-draft` a required step for any pack with
   deviations?** Today 5 of 37 packs have no ledger at all. Their deviations can never
   carry a bound cost. Is *"a pack with deviations and no ledger cannot be published"* the
   right rule, and is it this RFC's to make or the content wave's?
9. **`tablebase_dtz_regression`'s floor. OWNER RULED 2026-08-15: land the arm at
   `byAtLeast` floor **3**, disposition `unmeasured`, with the named experiment binding.**
   This is option (a), the draft's own position, and the reason it is right is the reason
   the question existed: at `byAtLeast` 1–2 the arm sits on the tablebase's **optimality
   boundary**, so it would not be measuring difficulty — it would be issuing a verdict, and
   law 8 binds this RFC as much as it binds the product. **3 is DERIVED, not chosen**: it is
   the first value provably off that boundary. Nothing measures where *"materially harder to
   convert"* begins and this RFC does not invent it — which is exactly what the `unmeasured`
   disposition records. **`unmeasured` is the only disposition that must be revisited**, so
   the experiment named in §6.3 is a binding obligation and question 6's expiry mechanism
   governs it. This instantiates the standing rule that **a measurement can smuggle a
   verdict: the threshold must sit off the instrument's optimality boundary** — here the
   rule is applied rather than restated.

---

## Changelog

- 2026-08-15: created. Claims pack schema **0.23**, run schema **0.16**, migration **21**.
- 2026-08-15: **adversarial cross-review applied in place** (reviewer: claude, not the
  author). Register claims re-derived and confirmed at `a9c31a6`: pack **0.22** and run
  **0.15** are shipped, `STORAGE_VERSION` is **20**, `teacher-surface` holds **21**,
  `vocabulary-wiring` has yielded 0.23 in its own register block, `feedback-delivery` and
  `live-surface-honesty` claim no pack version, and the `rfc/README.md` migration register
  ends at 20 — so 0.23 / 0.16 / 22 are all free. Every additive claim checked against the
  shipped schemas (`guard` is `properties.guard` with `additionalProperties: false`;
  `deviationCost` has three arms; `selectionCandidate` and `selectionEngine` are both
  `additionalProperties: false`; `EvidenceKind`/`EvidenceSource` are closed enums **in the
  JSON schema as well as in TS**). Counts re-derived exactly: 764 records, 235 deviation-
  anchored (135 `engine_eval` + 100 `tablebase_result`), 275 deviations, **0** costs, 37
  packs, 6 guard-tuning packs. **Fixed:** the `tablebase_dtz_regression` floor (C3 was
  porous at `byAtLeast` 1–2, where the arm is `bestmove` in scalar clothing); the missing
  **D64** dependency, which would have laundered manufactured syzygy provenance into
  digest-certified `cost` values; the digest contradiction between criteria 2 and 3/4;
  §2.3's bare-`fen` anchor resolution; §2.2's silent overwrite defeating
  `DEVIATION_COST_CONTRADICTED`; derivation from preserved (not re-measured) records;
  `pack-validation`'s second, un-desugared copy of the guard resolution; the un-budgeted
  §3.6 producer sharing a four-deep single-flight tablebase queue with two opponent modes;
  the omitted `drill_run.schema.json` enum widening; the unattested `wdl` permille pin;
  `publicEvents`'s second narrow-predicate site; the `$defs/guard` and `whitePerspectiveScore`
  citations (neither exists); the `resistance-spectrum` §7a misattribution; two §3.4/§3.3
  cross-references; the D91 gate (**closed by `0985fa4`**, so §5.1's block is removed and
  criterion 22 becomes a standing guard); and the vacuous-when-`options`-is-`undefined`
  register test. **Reported, not fixed:** the design-tier gap remains escalated, and the DTZ
  floor is now Open question 9.
