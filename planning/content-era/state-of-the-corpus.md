# State of the corpus — content-tier audit at HEAD

**Measured:** 2026-08-23 at `e3c239c` (working tree clean except concurrent `apps/web/`,
`tools/d872-*` edits held by another agent; no content file was touched by this audit).

**Method:** every number below is produced by a shipped tool or by reading the corpus JSON
directly. Nothing is estimated. Commands are named inline so each row can be re-run.

---

## 0. Licensing status — stated first, per the D951 remedy

This section exists because [[D951]] closed on a dossier whose body carried its gate and whose
summary did not. The gate is stated before the findings.

| Class of content work | Licensed right now? | By what |
|---|---|---|
| **Scale content wave** (new packs at volume, the binding wave, the 92-document apply) | **NO** | [[D560]] hold active (`design/BACKLOG.md:158`); `planning/platform-alignment/plan.md:39-40` rule 5 *"Do not launch a scale content wave"*; [[D949]] *"the binding wave falls under the D560 hold **WHOLE** — hold everything until Gate F"* (`design/BACKLOG.md:303`) |
| **Disposable / sacrificial pilot packs** | **YES — now** | `planning/platform-alignment/plan.md:39` *"authored work is **limited to** disposable/sacrificial pilot packs and already-authorised mechanical repairs"*. The limiting clause is also the licensing clause |
| **Already-authorised mechanical repairs** | **YES — now** | same line, `plan.md:39` |
| **Writer tooling** (`graduation-clearance` §6.5 clearance writer; stage-2 work-order steps 1–2) | **YES — now** | [[D949]] verbatim: *"the writer tooling (work-order steps 1–2) is **mechanism, not wave**, and remains queued under D642's post-Stage-1 allowance"* |
| **Promoting any pack to `content/packs/` (the official shelf)** | **NO** | promotion = graduation = zero `blocking` entries (`apps/server/src/graduation-report.ts:25`); **no document in the corpus has zero blocking entries**. The apply is additionally forbidden by `tools/graduation-clearance-plan.mjs:157-162` (`forbidden: ["schema v0.28 apply", "corpus mutation", "sidecar restamp", "RFC archival"]`) pending clause 7's budget ruling |

### The clause-8 question, resolved

The task asked whether pilot work is a Gate F **prerequisite** or Gate F **blocked**. It is a
prerequisite, and the repo says so three times:

1. `plan.md:39` permits sacrificial pilot packs *under* the hold — it is the one authored-work
   category the hold carves out.
2. [[D560]]'s own text names *"a small **sacrificial** official-pilot corpus exercising every
   required primitive"* as part of **the proof that lifts it** (`design/BACKLOG.md:158`).
3. `design/research/pack-primitive-stability.md:186-188` states it directly: R6 *"does not unlock
   an RFC, lift D560, or authorize pilot content **beyond the already-permitted disposable
   sacrificial set**."*

**So: a disposable, explicitly-labelled sacrificial pilot may be authored today. It may not be
graduated today**, because graduation is clause 7's budget ruling plus the 0.28 apply, both of
which are held. Clause 8's word *official* is the part that waits; the authoring is not.

**One correction to the commissioning brief.** [[D444]] at HEAD is **not** the "unrecorded pass"
class. It is `design/BACKLOG.md:662` — *"`expression-census`'s `backedClaims` double-counts and
never validates … an instrument that reports on a validator without running it is a second opinion
that has never read the case."* A repo-wide search for `unrecorded pass` returns zero hits. The
finding the brief anticipated **does exist** at HEAD (clause 2, §3 below); D444 is simply not its
name. Its nearest true relative is D444's vacuity family and its twin [[D984]].

---

## 1. The corpus as it is

### 1.1 What the 152 draft JSONs actually are

`find content/drafts -name '*.json' | wc -l` → **152**. The number is not 152 packs:

| Kind | Count | Note |
|---|---|---|
| Product pack documents (`<stem>.json`) | **50** | the authored corpus |
| Browser test fixtures (`*.browser.json`) | **6** | `immediate-guard`, `line-boundary`, `outcome-hold`, `outcome-resist`, `stated-reasoning`, `trajectory-legs`; excluded from serving by `isPackDocumentName` (`apps/server/src/pack-registry.ts:186-192`) |
| Evidence ledger sidecars (`*.evidence.json`) | **32** | `tabiya.sourcing.evidence.v1` |
| Sourcing job sidecars (`*.job.json`) | **32** | `tabiya.sourcing.job.v1` |
| Source manifest sidecars (`*.sources.json`) | **32** | `tabiya.sourcing.manifest.v1` |
| **Total** | **152** | 56 pack documents + 96 sidecars |

**18 of the 50 product packs have no evidence ledger at all** (50 − 32). Per
`planning/feedback-delivery/stage2-work-order.md:53-59`, 15 of those 18 hold 39 machine-labelled
claims, so their debt is *a sourcing run plus a ledger plus a binding*.

Whole-corpus scope, as the shipped tools count it (`make graduation-report`):

| Root | Documents | blocking | resolved | accepted | graduable |
|---|---|---|---|---|---|
| `content/drafts` | 56 | **220** | 30 | 43 | 0 |
| `content/candidates` | 36 | **143** | 0 | 0 | 0 (excluded by rule) |
| `content/packs` | **0** | 0 | 0 | 0 | — |
| **Corpus** | **92** | **363** | 30 | 43 | **none** |

Restricted to the 50 product packs: **215 blocking, 30 resolved, 43 accepted (288 entries)**.
The extra 5 blocking entries sit on the 6 browser fixtures.

### 1.2 Census by phase, mode, version, licence

| Phase | Packs | | Mode | Packs |
|---|---|---|---|---|
| opening | 20 | | `line` | 20 |
| middlegame | 14 | | `plan` | 14 |
| endgame | 14 | | `outcome` | 13 |
| cross_phase | 2 | | `trajectory` | 3 |

| Field | Distribution |
|---|---|
| `version` | `0.1.0` × 47, `0.2.0` × 3 |
| `provenance.reviewStatus` | **`draft` × 50 — no pack is `published`** |
| `provenance.licence` | `CC-BY-SA-4.0` × 43, **absent × 7** |
| `provenance.attribution` | present × 25, absent × 25 |
| `provenance.sources` per pack | min 3, max 13, median 7 |
| `feedbackClaims` | **196 across all 50 packs** (every pack carries claims) |

### 1.3 Graduation state — there is no per-pack state field

Graduation is a derived predicate over typed condition records, not an enum
(`schemas/drill_pack.schema.json:1097-1131`, `$defs.graduationEntry`; states
`blocking | resolved | accepted`, mutually exclusive by `oneOf`). Doctrine:
`docs/pack-graduation.md:9-17`. Graduable ⟺ zero `blocking` entries
(`apps/server/src/graduation-report.ts:25`).

| Blocker state | Count (50 product packs) | Composition |
|---|---|---|
| `blocking` | **215** | the debt |
| `resolved` | 30 | cleared with `{at, by}` |
| `accepted` | 43 | 40 × `owner_ruling` (all the 2026-08-13 `no-review-workflow` condition, citing `planning/exploration/log.md#L1231`), 3 × `permanent_property` (2 × tablebase-provider-availability, 1 × `outside-tablebase-range`) |

**Packs with zero blocking entries: 0 of 50.** Legacy bare-string entries: **0** — the typed
migration is complete. Acceptances are mirrored to `content/accepted-conditions.md`, a generated
page (`graduation-report.ts:56-60`).

### 1.4 Playability — 50 of 50 pass, and the caveat that matters

`make pack-check` over each of the 50 product packs (bundled once, looped):
**50 pass / 0 fail, exit 0 on every file.** There is not one validation error in the corpus.
`make schema-check` is green corpus-wide and R6 recorded 92/92 valid under 0.27.

Failure codes: **none**. Warning codes, by number of packs carrying them:

| Warning code | Packs | Meaning |
|---|---|---|
| `CONSTRUCT_UNREACHED` (`tempo:*` × 5) | **50** | five `tempo` constructs have **zero uses across `content/`** — the D138/`timingWindow` shape again |
| `PLAN_SIGNATURE_INLINED` | 13 | expression duplicates a registered plan signature |
| `RETRY_VARIANTS_NOT_EXECUTABLE` | 7 | *"nothing in the runtime reads it"* |
| `PLAN_CONSEQUENCE_DEPRECATED` | 3 | use `structural_feature` + `plan_signature` leaf |
| `CLAIM_PRINCIPLE_OFF_PHASE` | 4 | principle does not list phase `cross_phase` |
| `GUARD_CANNOT_REACH_DEVIATION` | 2 | declared cost cannot reach any guard threshold in force |

**Playable end-to-end today: all 50.** Mechanically valid ≠ evidentially honest, which is §2.

### 1.5 What `make up` serves — verified against the running server

`Makefile:120` → `docker compose up --build --detach`. Channel is **not** a pack field; it is
assigned by directory of origin at load time — `apps/server/src/pack-registry.ts:358`:

```ts
channel: productionPaths.includes(path) ? "official" as const : "community" as const,
```

`productionPaths` is `content/packs/`. **`content/packs/` contains only `.gitkeep`.**

D481/D502 landed correctly: `loadDefault` no longer gates `content/drafts/` behind
`NODE_ENV=development` (`pack-registry.ts:334-348` — the `development` guard survives only for
explicit `DRAFT_PACK_FILE`), and `schemas/drill_pack.example.json` is gone from the load path
entirely (D502's second ruling, executed). `apps/server/Dockerfile:26,41` ships `content`, and
`tools/verify-packaging.mjs` asserts `.dockerignore` does **not** exclude `content/drafts`.

A production-equivalent server run at HEAD returns:

| Endpoint | Result |
|---|---|
| `GET /packs` | **50 packs**, `channel` = `community` × 50, `reviewStatus` = `draft` × 50 |
| schema example present? | **no** |
| `GET /shapes` | 25, `official` × 25 |

**So: a user today sees 50 packs, every one badged *unreviewed draft* on the community channel,
and an empty official shelf.** D481 is genuinely closed — the failure it named (one schema
fixture, empty product) does not reproduce. What survives is that **zero official packs exist,
and that is now correct-by-construction**: graduation is the only route into `content/packs/`,
and the corpus has zero graduable documents.

Note the arithmetic mismatch that recurs in the ledger: **56 draft documents, 50 served packs.**
Rows that say "all 56" are counting documents; the app serves 50.

---

## 2. Claim backing reality

Run through the shipped predicate — `PackRegistry.loadDefault` → `admittedFeedbackClaimIds` /
`PackRecord.boundClaimIds`, the same path `tools/feedback-delivery-harness` uses — plus
`make expression-census`.

| Measure | At HEAD `e3c239c` | Work order (`stage2-work-order.md:32-38`) | Agrees? |
|---|---|---|---|
| claim-bearing packs | **50** | 50 | ✓ |
| claims | **196** (61,531 chars) | 196 (61,531) | ✓ |
| admitted | **98** (26,735 chars, **43.4%**) | 98 (26,735, 43.4%) | ✓ |
| withheld | **98** (34,796 chars) | 98 (34,796) | ✓ |
| bound | **1** — `philidor-third-rank-hold/philidor-is-drawn` | 1, same id | ✓ |
| `expression-census` `totals.backedClaims` | **1** | 1 | ✓ |
| `expression-census` `totals.populations` | **0** | 0 | ✓ |

**The work order reproduces exactly at HEAD. Nothing moved.**

### 2.1 Withheld claims decomposed by machine label

A claim is withheld iff it carries a machine label (`corpus_observed`, `engine_validated`,
`tablebase_exact`) that is not bound. 97 of 196 claims carry no machine label and can never be
withheld.

| Machine-label set on the withheld claim | Withheld |
|---|---|
| `corpus_observed` only | **54** |
| `tablebase_exact` only | **36** |
| `corpus_observed` + `engine_validated` | **6** |
| `engine_validated` only | **2** |
| **Total** | **98** |

| Label | Claims / packs | Withheld | Assistance-ladder rung (`design/05-in-run-experience.md:70-77`) |
|---|---|---|---|
| `author_principle` | 82 / 35 | 15 | rung 5 — registry-carried, self-declared |
| `corpus_observed` | 60 / 31 | **60 (all)** | rung 4 |
| `derived_feature` | 43 / 29 | 4 | rung 0 |
| `tablebase_exact` | 37 / 12 | 36 | rung 1 |
| `hypothesis` | 24 / 21 | 0 | rung 5 |
| `engine_validated` | 8 / 3 | 8 (all) | rung 2 |
| — | — | — | **rung 3 (Maia human model): 0 claims in the corpus** |

### 2.2 The evidence exists. The bindings do not.

Direct read of the 32 `*.evidence.json` ledgers:

| Record kind | Records |
|---|---|
| `engine_eval` | **391** |
| `tablebase_result` | **341** |
| `position_legality` | **32** |
| **Total** | **764** |
| `explorer_position_census` / `explorer_frequency` | **0** |
| **`claimBindings` entries declared, corpus-wide** | **1** |

**This is the single most important number in the audit.** The corpus holds 764 machine records
across 32 ledgers, and **one** of 196 claims is bound to any of them. The instruments landed; the
join was never made. This is [[D403]]'s *"three mechanisms landed in one day and the corpus uses
them once between them"*, unchanged seven days later.

`backedClaims: 1` and `bound: 1` agree today — and per [[D444]] they agree *"only because the
joined set is a singleton, which is the worst possible reason for two instruments to agree."*
Do not treat their agreement as corroboration.

---

## 3. Gate F, clause by clause

Clauses at `planning/platform-alignment/plan.md:48-57`. Every checkbox in the file is `[ ]`.

| # | Clause | Verdict at HEAD | Evidence / exact missing artifact |
|---|---|---|---|
| **1** | no active RFC holds a drill-pack schema lane | **FAILS** | `node tools/register-check.mjs`: `pack-schema: head 0.27; next free 0.30`. **Two live lanes:** `rfc/README.md:111` — lane **0.28** held by `graduation-clearance.md` (status `accepted`; re-affirmed at `rfc/graduation-clearance.md:2537` *"**Verdict: keep 0.28.**"*); `rfc/README.md:112` — lane **0.29** held by `pack-population-provenance.md` (status `draft`, claim live in the register). **0.30 is claimed by nobody** — it is reserved prospectively for `shape-layer-parity`, which **does not exist as a file at HEAD**. Shipped format is 0.27 (`packages/schema/src/index.ts:2`; `schemas/drill_pack.schema.json:3`) |
| **2** | shared-resource/register state agrees with the tree | **PASSES — AND IT IS UNRECORDED** | `make register-check` → 12/12 tests, then `register-check: 20 active RFCs, 9 live claims, **C1–C6 green**`, exit 0. [[D499]] — the row R6 cited as the blocker — is **`✅ CLOSED 2026-08-21 by shared-resource-registers`** (`design/BACKLOG.md:140`), which is implemented and archived (`rfc/README.md:331`). **See §3a** |
| **3** | a versioned producer→evidence→consumer manifest has no unexplained orphan | **UNMEASURED** | The F1 manifest **exists, is versioned two ways, and is CI-gated**: `apps/server/src/evidence-manifest-check.ts` (per-projection `<id>@<version>` at `:69-70`; whole-manifest `digest` at `:76`), wired into `make verify` via `Makefile:40-42,57`. Its landing register remains historical at 19 producers / 93 projections / 23 consumer ops / 142 bindings; the current executable tuple is **37 / 193 / 25 / 210** (`packages/runtime/src/evidence-catalog.test.ts`). The orphan-disposition mechanism is real and enforced (`assistance.arrows` must keep `disposition.kind === "experimental"`). **But** `planning/platform-alignment/never-started-lanes.md:190-193` records **14 open declared-vs-consumed mismatch rows**, and `plan.md:240-242` records that *"the central producer→consumer join remains unimplemented rather than merely undocumented."* Whether the collectors' deliberately-`inspector_only` projections are *explained* orphans is an owner call, not a mechanical one |
| **4** | detector semantics v1 declares sign, grounding, confidence/abstention and validation | **FAILS** | **No document named or establishing "detector semantics v1" exists at HEAD.** It is listed as an *RFC candidate* at `plan.md:126`. The four properties are split across three collector RFCs: **sign** — under-declared in `tactical-collectors` and `breadth-collectors`, **absent as a field** in `semantic-collectors`; **grounding** — declared in all three; **abstention** — all three; **confidence** — `tactical-collectors.md:172-176` only; **validation** — `semantic-collectors.md:648` states the opposite outright (*"cannot be validated until a content wave authors or imports cited canonical lines"*). The intent-tier list at `design/04-content-architecture.md:59-64` **omits both `sign` and `validation`** |
| **5** | pack capabilities and deprecations have a compatibility policy | **FAILS** | **Absent as a policy.** Only mechanism: a 12-row `FORMAT_DISPOSITIONS` table (`packages/schema/src/drill-pack/dispositions.ts:22`). No pack/runtime capability handshake. **Packs carry no `$schema`, `schemaVersion` or required-capability field — 0 of 92 documents** (R6 `schemaStampedDocuments: 0`; re-verified at HEAD). Deprecations are ad-hoc per-version (`docs/drill-pack-format.md:53,321`). The policy exists only as unbuilt `[M]` proposal at `design/research/pack-primitive-stability.md:151-163` (F3, not drafted) |
| **6** | automatic migration/dry-run passes over every pack and sidecar | **FAILS** | **No tool, no `make` target, no entry point, never run.** `grep -n "migrat" Makefile` → 0 hits. The only `dry-run` string in the tree is a parity assertion *about a design doc* (`tools/intent-parity-harness/registry.mjs:63`). The two `migrate-*.mjs` files are one-off, hard-coded, write-without-dry-run scripts under `planning/archive/`. The nearest instrument declares itself not-a-migration: `tools/r6-pack-stability-harness/README.md:3-4` *"it does not migrate or rewrite content."* R6: **FAIL** (`pack-primitive-stability.md:177`). Note the partial exception — `make graduation-plan` **is** a real read-only dry-run, but only over the graduation-entry migration, not the format |
| **7** | non-mechanical re-authoring cost is measured and within an owner-set budget | **FAILS — half-done, and the missing half is one ruling** | **Exposure is measured.** `make graduation-plan` emits the D642 mechanical-vs-judgement report: *"92 documents / 436 entries; 203 rule suggestions + 17 published hand-table assignments; 0 unclassified; 141 recognised emitter entries; **2 non-template entries requiring judgement**; 30 resolved + 43 accepted backfill; 1 removed-referent special case; 5 fixture transitions"*, with the judgement boundary stated at `tools/graduation-clearance-plan.mjs:189`. [[D949]] adds the claim-side price: *"mechanical ~96-claim records AND the **63–94 authored decisions**"*. **The owner limit is unset.** R6: *"**FAIL** — exposure is measured, owner limit is unset"* (`pack-primitive-stability.md:178`). A ready recommendation is drafted and unruled: `planning/platform-alignment/theory-drill/o5-o6-handoff.md:50-73` — O6.2 recommends **a zero forced semantic-rewrite budget within 1.x** |
| **8** | a small official-pilot set exercises every required primitive and guidance module | **FAILS** | **No pilot set exists.** `content/packs/` holds 0 documents. Four declared primitive families have **zero witnesses corpus-wide**, re-derived at HEAD over all 92 documents: `engineCondition` **0**, `legShapes` **0** (all 4 leg-bearing documents have `legs[].shapes` absent), `legOpponentPolicy` **0** (same), `prediction` **0**. Several more are near-zero: `variantOf` 2 packs, `legs` 3 product packs, `timingWindows` 4, `guard` 6, `retryVariants` 7. **Assistance-ladder rung 3 (Maia human model) has 0 claims.** R6: **FAIL** (`:179`) |
| **9** | pilot packs pass viewport, gesture, assistance, review/re-entry and abstention checks | **UNMEASURED** | Vacuously unmeasurable — clause 8's population is empty, so there is nothing to check. The *board* half of the machinery is proven independently: `plan.md:74` records the D537–D539 interaction-state checks **passed 2026-08-21 at 90/90 exact live click/drag/touch cells** with a permanent browser regression. That is a component pass, not this clause |
| **10** | the owner accepts the resulting primitive set for the first scale wave | **FAILS** | Owner decision not taken. Blocked on 8. [[D697]] (`design/BACKLOG.md:442`) found O6 was one Boolean over two separable questions and split it; the capability-contract half (O6.1) is *"ready now"*, final pilot membership legitimately waits on F5/F7/owner use |

**Tally: 1 passes · 7 fail · 2 unmeasured.**

### 3a. The unrecorded pass — clause 2

**Clause 2 passes at HEAD and three places still record it as failing.**

- `design/research/pack-primitive-stability.md:175` — *"Shared resource/register agrees with tree |
  **FAIL** — D499 and draft `shared-resource-registers` remain open."* Dated **2026-08-20**.
- [[D499]] closed **2026-08-21** (`design/BACKLOG.md:140`); `shared-resource-registers` was
  implemented and archived the same day (`rfc/README.md:331` — *"six derived landed/live
  registers, active-RFC declarations, C1–C6 and `make verify` integration"*).
- `planning/platform-alignment/plan.md:49` still reads `- [ ]`.

`make register-check` has been green since. The R6 dossier is a **dated research finding and
correctly immutable in its own tier** — the defect is that no one propagated the change to the
gate. This is the same shape as the CLAUDE.md flow-back clauses: *work completed, register never
learned.* Recording it costs one line and moves Gate F from 0/10 to 1/10.

A second staleness runs the other way: R6's clause-1 row says `pack-population-provenance`
*"has no live claim until accepted/registered."* At HEAD its 0.29 claim **is** live in the
register (`rfc/README.md:112`, counted among the 9 live claims). **Clause 1 fails harder than
R6 recorded.**

### 3b. The shortest honest path to Gate F

Ordered by dependency. Sizes are relative, not hours.

| Step | Clause | Executor | Size | What it is |
|---|---|---|---|---|
| **0** | 2 | **claude** (one line) | **XS** | **Record the pass.** Tick `plan.md:49` with the D499/`shared-resource-registers` citation and a dated log entry. Free, and it stops the next audit re-deriving it |
| **1** | 10 (O6.1) | **owner** | **XS** | Rule on the O6.1 capability contract — `o5-o6-handoff.md:52-58` says *"ready now"*. **This is the keystone**: it unblocks F3, which is the only route to clauses 5 and 6 |
| **2** | 7 | **owner** | **XS** | Rule on the re-authoring budget. Recommendation drafted at `o5-o6-handoff.md:62-73` (zero forced semantic-rewrite within 1.x). One ruling closes the clause — the measurement half already exists |
| **3** | 5, 6 | **codex** (behind an F3 RFC) | **L** | The capability/deprecation policy **and** the migration ladder. Both are the same RFC (F3). Needs: a pack capability stamp (0 of 92 have one today), a read-only planner over all 92 documents + 96 sidecars, and an explicit applier |
| **4** | 4 | **codex** + research | **L** | Draft detector semantics v1 as a real versioned document. Hardest sub-part is **validation**: `semantic-collectors.md:648` says the corpus cannot supply it until content authors cited canonical lines — a genuine circularity that the sacrificial pilot is the intended way out of |
| **5** | 3 | **codex** | **M** | Dispose or close the 14 declared-vs-consumed mismatch rows so "no unexplained orphan" becomes adjudicable |
| **6** | 1 | **claude/codex** | **M** | Land or return lanes 0.28 and 0.29. 0.28 rides step 3's apply (it is `graduation-clearance`'s own schema change); 0.29 needs `pack-population-provenance` accepted or withdrawn |
| **7** | 8 | **authored chess judgement** (owner) + codex | **M** | Author the sacrificial pilot. **Licensed today** (§0) — it does not have to wait for steps 1–6, and step 4 arguably needs it. Must cover the four zero-witness families and rung 3 |
| **8** | 9 | codex | **S** | Run viewport/gesture/assistance/re-entry/abstention over the pilot. The harness pattern exists (90/90 at 2026-08-21) |
| **9** | 10 | **owner** | **XS** | Accept the primitive set |

**Two things can start this hour with no ruling and no RFC: step 0 (record the clause-2 pass) and
step 7 (author the sacrificial pilot).** Steps 1 and 2 are two owner rulings, both with drafted
recommendations, and together they unblock the entire long tail. The critical path is
**owner ruling → F3 → everything else**, and it is currently idle on the ruling.

---

## 4. What is authorable without violating law 8

Law 8 (ADR-0005, `CLAUDE.md`): LLMs may render validated evidence; they may not create ungrounded
strategic claims or grade moves.

### (a) Mechanical — no chess judgement, licensed now

| Work | Shipped target | Population |
|---|---|---|
| Read-only graduation migration plan | `make graduation-plan` | 92 documents / 436 entries — **already runs clean, 0 unclassified** |
| Pack validation | `make pack-check FILE=…` | 50/50 pass |
| Corpus census | `make expression-census` | 196 claims, 827 positions, 771 transitions |
| Graduation census | `make graduation-report` | writes `content/accepted-conditions.md` |
| Ledger freshness | `make sourcing-check DIR=…` | 26 stale candidate ledgers (§6.4) |
| Digest re-stamp | *(no writer yet)* | `make graduation-clear` is **specified and unbuilt** (`graduation-clearance` §6.5). This is D949's licensed tooling step |
| Draft verification | `make verify-draft FILE=… OFFLINE=1` | per-pack |

### (b) Grounded-derivable — a machine can produce the backing

**All 98 withheld claims are in this class.** None of them is withheld for want of a *new* chess
judgement; each is withheld for want of a record, a census, or prose that normalizes to a record.

| Population | Claims | Packs | What is missing | Shipped instrument |
|---|---|---|---|---|
| `corpus_observed` | **60** | 31 | **Zero explorer records exist** — 0 `explorer_position_census`, 0 `explorer_frequency` in 764 records. The Lichess explorer is shipped and unused for this | `make source-fetch`, `make candidate-emit PIPELINE=explorer`, `make candidate-attach PIPELINE=explorer` |
| `tablebase_exact` | **36** | 12 | 341 `tablebase_result` records **already exist**. Blocker is `CLAIM_CENSUS_INCOMPLETE`: **0 of 277 choice-bearing positions have a full legal-successor census** ([[D110]]) | `make tablebase-walk FILE=… ENUMERATE=all` |
| `engine_validated` | **8** | 3 | 391 `engine_eval` records **already exist**. Blocker is `normalizes`-exact prose — the sentence must restate the record | `make engine-walk FILE=… ENUMERATE=decision` |

**This is the difference the brief asked for.** The owner does not have to author 98 claims. The
mechanical arm is ~96 claim-records ([[D949]]'s figure); the genuinely authored residue is
**63–94 decisions**, and those are decisions about *which* record a sentence rests on and how the
sentence must be worded to normalize — not fresh strategic assertions.

Held whole by D949 until Gate F. Listed here so the size is known, not to start it.

### (c) Genuinely requiring human chess judgement — the owner's queue

| Queue | Count | Source |
|---|---|---|
| **`blocking` graduation entries on the 50 product packs** | **215** | free-text conditions, each needing a citable source or bearing validation. **This is the real number.** |
| …plus candidate documents | 143 | `content/candidates`, all `onramp-*` and family roots |
| **Corpus-wide blocking total** | **358** | |
| Authored decisions priced by the stage-2 work order | **63–94** | [[D949]] |
| Hand-assigned draft classifications in the migration | 17 | `make graduation-plan` |
| Non-template candidate entries requiring judgement | 2 | `make graduation-plan` |
| Removed-referent special case | 1 | `make graduation-plan` |
| Claims that are irreducibly authored (no machine label) | **97** of 196 | 34 `author_principle` only, 31 `derived_feature` only, 24 `+hypothesis`, 8 mixed — all already **admitted**, so this is quality debt, not delivery debt |
| Zero-witness primitive families needing authored content | **4** | `engineCondition`, `legShapes`, `legOpponentPolicy`, `prediction` |
| Assistance-ladder rungs with zero corpus claims | **1** | rung 3 (Maia human model) |

**The real news: 215 blocking conditions on 50 packs, and the pack with the fewest has 2.**
There is no pack one decision away from graduation.

---

## 5. The pilot-set question — evidence, not a decision

Clause 8 wants *a small official-pilot set exercising every required primitive and guidance
module*. **This section does not choose one.** It produces what a ruling would need.

**Debt = `blocking` + `withheld`.** Both are things a human must resolve or a machine run must
retire before the pack is honest. Lower is closer to complete.

### 5.1 Rare-primitive coverage — the constraint that dominates

Most packs are interchangeable on `checkpoints`/`deviations`/`planClasses` (50/50 each). The
scarce primitives decide the set:

| Primitive | Packs carrying it | Named |
|---|---|---|
| `shapes` | 38 | plentiful |
| `retryVariants` | 7 | `queen-vs-pawn-seventh-convert`, `mate-bishop-knight`, `mate-k-q-technique`, `mate-k-r-technique`, `mate-two-bishops`, `philidor-passive-rook-convert`, `trajectory-mate-bishop-knight` |
| `guard` | 6 | `opening-principles-white`, `opening-principles-black`, `opponent-intent-early-queen`, `conversion-up-a-piece`, `mate-k-q-technique`, `mate-k-r-technique` |
| `timingWindows` | 4 | `iqp-white-panov-attack`, `maroczy-bind-white-squeeze`, `dragon-yugoslav-race`, `kid-mar-del-plata-white` |
| `legs` | 3 | `trajectory-qgd-exchange-minority`, `trajectory-caro-advance-chain-bishops`, `trajectory-mate-bishop-knight` |
| `variantOf` | 2 | `philidor-passive-rook-convert`, `trajectory-mate-bishop-knight` |
| `engineCondition`, `legShapes`, `legOpponentPolicy`, `prediction` | **0** | **no pack can supply these — they must be authored new** |

### 5.2 Lowest-debt candidates, by mode

| Pack | Phase | Mode | ver | blocking | claims | withheld | bound | srcs | rare primitives | **debt** |
|---|---|---|---|---|---|---|---|---|---|---|
| `anti-caro-advance-early-c5` | opening | line | **0.2.0** | 2 | 3 | 1 | 0 | 7 | shapes | **3** |
| `anti-caro-advance-c5-race` | opening | line | **0.2.0** | 3 | 2 | **0** | 0 | 3 | — | **3** |
| `kid-classical-black` | opening | line | 0.1.0 | 2 | 3 | 1 | 0 | 6 | shapes | **3** |
| `london-system-white` | opening | line | 0.1.0 | 2 | 3 | 1 | 0 | 5 | shapes | **3** |
| `opening-principles-white` | opening | line | 0.1.0 | 4 | 4 | **0** | 0 | 6 | **guard** | **4** |
| `opening-principles-black` | opening | line | 0.1.0 | 4 | 4 | **0** | 0 | 5 | **guard** | **4** |
| `lucena-bridge-convert` | endgame | outcome | 0.1.0 | **2** | 4 | 3 | 0 | 6 | shapes | **5** |
| `philidor-third-rank-hold` | endgame | outcome | 0.1.0 | 3 | 4 | 2 | **1** | 7 | shapes | **5** |
| `conversion-up-a-piece` | endgame | outcome | 0.1.0 | 5 | 4 | **0** | 0 | 5 | **guard** | **5** |
| `rook-4v3-same-side-hold` | endgame | outcome | **0.2.0** | 5 | 5 | **0** | 0 | 6 | shapes | **5** |
| `trajectory-qgd-exchange-minority` | cross_phase | trajectory | 0.1.0 | 5 | 3 | **0** | 0 | 6 | **legs**+shapes | **5** |
| `queen-vs-pawn-seventh-convert` | endgame | outcome | 0.1.0 | 3 | 4 | 3 | 0 | 8 | **retryVariants**+shapes | **6** |
| `grunfeld-exchange-fianchetto` | middlegame | plan | 0.1.0 | 5 | 5 | 2 | 0 | 9 | shapes | **7** |
| `iqp-black-tarrasch-defence` | middlegame | plan | 0.1.0 | 5 | 4 | 2 | 0 | 9 | shapes | **7** |
| `maroczy-bind-white-squeeze` | middlegame | plan | 0.1.0 | **4** | 6 | 4 | 0 | 11 | **timingWindows**+shapes | **8** |
| `philidor-passive-rook-convert` | endgame | outcome | 0.1.0 | 6 | 4 | 3 | 0 | 7 | **variantOf**+retryVariants+shapes | **9** |
| `trajectory-mate-bishop-knight` | endgame | trajectory | 0.1.0 | 4 | 4 | 4 | 0 | 13 | **legs**+**variantOf**+**retryVariants** | **8** |

### 5.3 Observations a ruling would want

1. **`plan` mode is the expensive mode.** Every one of the 14 `plan` packs has debt ≥ 7; the
   cheapest `line` pack has 3. A pilot that must cover all four modes pays for `plan` whatever
   it picks. Cheapest `plan` packs: `grunfeld-exchange-fianchetto` and
   `iqp-black-tarrasch-defence` (both 7).
2. **`trajectory-mate-bishop-knight` is the only pack carrying three rare primitives at once**
   (`legs` + `variantOf` + `retryVariants`) and it has the largest source list in the corpus (13).
   Debt 8. It is the single highest-coverage-per-pack document.
3. **`trajectory-qgd-exchange-minority` is the cheapest way to reach `legs`** — debt 5 with
   **zero withheld claims**.
4. **Seven packs have zero withheld claims**: `anti-caro-advance-c5-race`, `conversion-up-a-piece`,
   `opening-principles-black`, `opening-principles-white`, `opponent-intent-early-queen`,
   `rook-4v3-same-side-hold`, `trajectory-qgd-exchange-minority`. Their entire remaining debt is
   graduation conditions, not claim binding — the cheapest class of debt to retire.
5. **`philidor-third-rank-hold` holds the corpus's only bound claim.** It is the only document
   that has ever exercised the claim-binding path end-to-end. Any pilot that wants to prove the
   binding path works should include it.
6. **`0.2.0` packs are `anti-caro-advance-early-c5`, `anti-caro-advance-c5-race` and
   `rook-4v3-same-side-hold`** — the three most recently re-authored, and two are lowest-debt.
7. **No subset covers clause 8.** Four primitive families have zero witnesses anywhere. A
   compliant pilot **must** contain newly-authored material regardless of which drafts are
   promoted — which is exactly why the sacrificial-pilot licence (§0) exists.

**A minimal shape suggested by the evidence — not a decision:** one cheap `line`
(`anti-caro-advance-early-c5`, debt 3, v0.2.0), one `outcome` with the bound claim
(`philidor-third-rank-hold`, debt 5), one `trajectory` (`trajectory-mate-bishop-knight`, debt 8,
three rare primitives), one `plan` (`grunfeld-exchange-fianchetto`, debt 7), one `guard` carrier
(`opening-principles-white`, debt 4, zero withheld), one `timingWindows` carrier
(`maroczy-bind-white-squeeze`, debt 8) — **total debt ≈ 35**, plus new authoring for the four
zero-witness families and rung 3. The owner rules; this is the arithmetic.

---

## 6. Gaps and traps

1. **The prohibition traps.** `design/00-thesis.md:157-159`: *"**Explicitly not:** a tactics puzzle
   trainer or lesson content."* The `onramp-*` candidate family is **36 puzzle-derived documents**,
   and their emitter-generated blockers say so out loud — `mechanical-objective-placeholder`
   (*"an author must replace it with this pack's actual teaching objective"*) and
   `authored-teaching-absent` (*"a reviewer must add any chess judgement rather than infer one
   from puzzle metadata"*). **They are correctly quarantined**: `graduation-report.ts:25` excludes
   `content/candidates` from the graduable set by rule. The trap is promoting any of them without
   the play-the-consequence re-cut. 143 blocking entries stand between them and anything.

2. **LLM-generated strategic lessons.** Guarded mechanically, and unusually well:
   `evidence-manifest-check.ts:62-64` throws `EVIDENCE_GENERIC_BYPASS` unless external voice is
   bound to the rendered `VoiceEvidenceView`. Law 8 has a CI test. Keep it.

3. **The digest-stale trap — re-verified at HEAD, unchanged.** Re-ran
   `make sourcing-check` over every candidate directory and every draft pack:

   | Population | Fresh | **Stale** |
   |---|---|---|
   | Candidate ledgers | 16 | **26** |
   | Draft ledgers | 32 | **0** |

   **All 26 stale ledgers are `onramp-*`** — zero non-onramp staleness. The figure in
   `planning/content-wave-work-order.md:153` and `planning/defect-triage.md:430` reproduces
   exactly. **`EVIDENCE_DIGEST_STALE` is `severity: "warning"`**, so `valid` ignores it and a
   stale digest can never withhold a claim — the reason this has survived. **Do not hand-fix
   them**: `content-wave-work-order.md:570` — *"Until [`make graduation-clear`] lands, do not
   hand-edit graduation entries — including the 26 stale candidate ledgers."*

4. **`CONSTRUCT_UNREACHED` on all 50 packs.** Five `tempo:*` constructs have zero uses across
   `content/`. Every pack emits five warnings for vocabulary nothing uses. This is [[D138]]'s
   shape and it is now the corpus's loudest signal-to-noise problem in validator output.

5. **Content quality asserted but unmeasured.** The corpus is **100% mechanically valid and 0.5%
   evidentially bound** (1/196). `make pack-check` passing 50/50 says nothing about whether a
   sentence is true. The only instruments that speak to truth are `graduationBlockers` (215
   blocking, free-text, unenforced) and `claimBindings` (1). **`content/drafts/README.md` says
   *"Move a reviewed pack to `content/packs/` only through the content-era review process"* — and
   there is no review process** (owner ruling 2026-08-13, mirrored into 40 packs as the accepted
   `no-review-workflow` condition).

6. **Two stale-premise documents in the content tier, D524-class.** (a)
   `content/drafts/README.md:7-11` still asserts drafts are development-only and that a review
   process exists — **both made false by D502 and by the 2026-08-13 ruling.** [[D524]]
   (`design/BACKLOG.md:584`) names three documents arguing from the old premise; **this README is
   an unlisted fourth.** (b) `planning/content-era/plan.md:156` cites
   `apps/server/src/pack-validation.ts:87-109` for logic now at `:971-983`, where
   `GRADUATION_REQUIRES_REVIEWERS` no longer exists.

7. **`planning/content-era/plan.md` §2 batch-1 checkboxes are all still unchecked** (`:70-80`) for
   Packs A–D that shipped long ago. Stale checkboxes, not missing work — but they are the content
   tier's own version of the flow-back failure the CLAUDE.md closeout clause exists to prevent.

8. **No K10 verdict was ever logged.** `plan.md:165-172` makes batch 1 done only when *"a written
   K10 verdict is logged in `planning/exploration/log.md`"*. Per-session cost tables exist; the
   verdict does not. Batch 1 is therefore **formally unclosed** despite all four artifacts
   shipping.

9. **The content log has been silent since 2026-08-21.** `planning/content-era/log.md:3839` is the
   last entry (authored-consequence-lifecycle repair). The silence is **correct** — D560 landed
   2026-08-20 and D949 held the wave 2026-08-22 — and it is worth stating that the log correctly
   shows a lane stopped by ruling rather than by neglect.

10. **`RETRY_VARIANTS_NOT_EXECUTABLE` on 7 packs**: *"nothing in the runtime reads it and it names
    no referent."* Seven packs author a primitive the runtime ignores — a shipped-with-no-customer
    case still live in content.

11. **18 of 50 packs have no evidence ledger at all**, 15 of which hold 39 machine-labelled claims.
    They cannot bind anything until a sourcing run creates a ledger. This population is invisible
    in `backedClaims` (which counts bindings, not their absence).

12. **7 of 50 packs carry no `licence`** and 25 carry no `attribution`. For a corpus intended to
    ship under AGPL-3.0 with CC-BY-SA-4.0 content, that is a distribution gap, not a chess gap —
    and it is fully mechanical to close.

---

## 7. Summary of measured state

| Question | Answer at HEAD |
|---|---|
| Served official packs | **0** |
| Served packs total | **50**, all `community`, all badged *unreviewed draft* |
| Pack documents in the corpus | 92 (56 drafts incl. 6 fixtures + 36 candidates) |
| Packs passing `pack-check` | **50 / 50**, zero errors |
| Graduable documents | **0 / 92** |
| Blocking graduation conditions | **215** on product packs; **358** corpus-wide |
| Feedback claims | **196** across 50 packs |
| Admitted / withheld | **98 / 98** (43.4% of prose admitted) |
| Bound claims / `backedClaims` | **1 / 1** |
| Evidence records held | **764** (391 engine, 341 tablebase, 32 legality); **0 explorer** |
| Candidate ledgers digest-stale | **26 / 42** (all `onramp-*`) |
| Gate F | **1 pass · 7 fail · 2 unmeasured** — and the one pass is unrecorded |



*(Routing for the rows this audit produced lives in `planning/content-wave-work-order.md` — this file is a state report, not a route-shaped document; `make work-index` joins on the work order.)*
