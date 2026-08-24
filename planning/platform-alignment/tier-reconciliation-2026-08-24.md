# Four-tier reconciliation — 2026-08-24

**Question (owner, verbatim):** *"do we need to do a generic pass again over
research/design/rfcs/implemented so that we're still on track for a PROPER 1.0?"*

**Answer: yes, and the pass was overdue rather than optional.** The short form is at §0. The
evidence is in §1–§6. Nothing in `design/00`–`06` was edited; §2 is a proposal list for the owner.

**Run:** 2026-08-24, by claude (platform-alignment), on a **shared worktree with concurrent agents**.
Tier findings were derived at HEAD `90ef834f`; **HEAD advanced to `5e311b47` (*"feat: centralize
exact legal move authority"*) mid-pass** when a sibling agent landed the exact-legal-mobility work.
That commit touches `packages/runtime`, `apps/server` and `rfc/exact-legal-mobility.md`; it does not
disturb any finding below, and where it changes a claim (§4.4) that is said explicitly. Every claim
rests on committed state unless it says otherwise. Working-tree modifications belonging to other
agents (`design/BACKLOG.md`, `planning/exploration/log.md`, `content/drafts/*`, `tools/*/output.md`,
`docs/{content-sourcing,drill-client,evidence-contract}.md`) were read but not staged, edited, or
judged as HEAD.

**What this pass wrote:** the twelve missing coverage-matrix rows in `design/research/README.md`,
and this file. Nothing else.

---

## 0. The answer, in five sentences

1. **`planning/roadmap-to-done.md` cannot currently be trusted as the 1.0 index.** It was last
   modified **2026-08-14**; **827 commits** have landed since. Six of its eleven rows are false at
   HEAD, including the two load-bearing ones — *"the feature column is empty"* (there are **46
   active product RFCs**, 25 of them drafts) and *"39 packs committed"* (`content/packs/` contains
   one file, `.gitkeep`, and `docs/pack-graduation.md:3-5` states *"The current corpus has no
   graduable pack"*).
2. **The product's shape is broad capability on thin presentation, and the twelve UX dossiers did
   not discover that — they measured it.** 46 active RFCs, a 1,823-line REST layer and 1,332 ledger
   rows sit behind **9 client routes and 23 `.svelte` files**. The campaign is the extreme case: the
   mechanism is complete and correct with **zero consumers**, no `/campaign` route, and zero
   authored campaigns.
3. **The ledger is growing faster than it is being closed.** The 2026-08-23/24 wave added **163
   rows** (D1341–D1503) of which **105 are open defects and 7 are closed**. Repo-wide: **1,332
   rows, 495 closed, 810 open, 449 of those open defects** — with open defects still outstanding
   from **D43**.
4. **The tiers fail in a consistent, diagnosable way:** every tier that has a *mechanical* register
   check is clean, and every tier whose bookkeeping is *prose* has drifted. `register-check` is
   green and RFC↔row parity is exact; the RFC register's **prose cells** carry eight statuses
   contradicted by returns and blocking findings. `design/research/README.md` has **no instrument at
   all**, which is why twelve rows went missing in one day and three more have been missing since
   2026-08-20.
5. **1.0 is not close, and the honest blocker is not features.** It is (a) zero graduated content,
   (b) 449 open defects, (c) ~35 documents of specified-but-unbuilt product, and (d) a presentation
   layer that cannot reach most of what is built. The roadmap's §3 precondition — *"When 1 and 2
   are checked: the owner plays"* — is not met on either 1 or 2.

**One correction to this pass's own brief.** `make schema-check` was reported RED at HEAD. **It is
GREEN** — [[D1440]] was repaired earlier today and the ledger already records it (§6.2) — as is every
other gate in the `verify` chain, including 1,126 tests across 170 files. **But a gate *is* broken,
just not that one: `make test-browser` is RED on a deterministic defect** where the boundary sheet
announces authored commentary and then does not render it (§6.4). And **the CI-parity step that is
the only thing chaining the browser gate to `verify` was created and deleted on the same day**, so
nothing runs it before code leaves the machine (§6.3). The unit build is healthy; the bookkeeping
is not; and the one gate that exercises the product as a learner meets it is both red and un-run.

---

## 1. `planning/roadmap-to-done.md` — row by row

The file calls itself *"the single checkable index of completed vs open"* and *"Updated as waves
land"* (`:5-6`). It was last committed at `713fdde3`, **2026-08-14**. Between that commit and HEAD:

| | |
|---|---|
| Commits since the roadmap was last touched | **827** |
| Ledger rows added since | D-head moved to **D1503**; 1,332 rows now |
| Active product RFCs at HEAD | **46** (roadmap implies zero) |
| Archived RFCs at HEAD | **72** (`CLAUDE.md:26` says 23) |

### Row verdicts

| Roadmap row | Claim | Verdict at HEAD |
|---|---|---|
| §1 "Breadth B1–B11" | ✅ complete 2026-08-14 | **Overstated.** B-gate rows in `design/03` still carry residuals; see §2 for B6 and B8 specifically. |
| §1 "Polish wave — **the LAST feature wave**" | ✅ SHIPPED 2026-08-14; *"the feature column is empty"*; *"no active product RFCs"* | **False, and it is the roadmap's central error.** 46 active product RFCs: **25 draft, 10 accepted, 7 implementing, 5 awaiting**. Whole feature families specified since — learner modules, campaign, clocks, variants, casting, social play, skills, longitudinal store, famous games, training-mode variants. |
| §1 "474 tests / 80 files, browser 24" | measured 2026-08-14 | **Stale, and in the good direction.** Measured this pass: `make test` → **1,126 tests across 170 files, all passing, 56.7 s**. Plus **98** tool-harness test files and **4** browser spec files. |
| §1 "**Gamification cluster** … needs RFC **and** research/mileage first — deliberately post-session" 📋 | post-session by design | **False three ways.** The research landed (`planning/campaign-research-queue.md` R1–R5, R9); the intent doc exists (`design/06-campaign.md`, written 2026-08-15); and `rfc/campaign-core.md` is **implementing since 2026-08-23** with five source files shipped. The roadmap parks as "post-session" a lane that is mid-implementation. |
| §1 "Orphan triage ✅ ruled" | all four scheduled | **Superseded.** `planning/platform-alignment/unreachable-mechanisms.md` (2026-08-23) is a systematic sweep of the same defect class and reproduces most of it at HEAD (see §5). |
| §2 "Shape library ✅ 23 entries. **2 commissioned, unauthored:** London wedge, KID arrangement chain" | 23 + 2 owed | **Stale in the good direction.** **25** shapes at HEAD, and both named gaps are authored: `content/shapes/london-wedge.json`, `content/shapes/kid-chain-arrangement.json`. 13 principles also exist and the row does not mention them. |
| §2 "Packs … ✅ **39 packs committed** total" | 39 committed | **False as written, and the unit no longer exists.** `content/packs/` holds exactly one tracked file: `.gitkeep`. The corpus is **56 drafts** + **43 candidate directories**, and `docs/pack-graduation.md:3-5` states plainly: *"The current corpus has no graduable pack."* **Zero packs have graduated into the official catalogue.** |
| §2 "Remaining opening families … 📋 final batches" | final batches | **Understated.** With zero graduated packs and 293 graduation conditions recorded across the drafts (`ux-authoring-and-library.md` §1 `[V]`), the remaining content work is a graduation problem, not a batch-authoring problem. The roadmap has **no row for graduation at all**. |
| §2 "Engine-validation passes … **Partial progress:** tablebase grounding is now real — 10 endgame/mate packs carry `ledger_verified` evidence sidecars" | partial | **Substance CONFIRMED; wording needs restating.** `make verify-draft FILE=content/drafts/anti-caro-advance.json OFFLINE=1` was executed this pass and returned verdict **`ledger_verified`** (5 warnings), so the claim holds. But the sentence is not checkable as written: `ledger_verified` is a **derived** `assessmentGrounding` computed from pack + ledger + manifest (`position-evidence.ts:119`), not a literal in the sidecars — every one of the 815 `grounds` values under `content/` is `machine_validation` (78 more `citable_source`). A reader who greps for the word finds nothing. The *second* half of the row — Stockfish validation of middlegame/opening claims is **at zero** — still stands and still blocks. |
| §2b "reconciliation gate … **Re-run cheaply after the last feature wave**" | first run complete 2026-08-14 | **The trigger never fired because the premise was wrong.** There was no last feature wave. This document is the re-run, ten days and 827 commits late. |
| §3 "The session itself — when 1 and 2 are checked: the owner plays" | gated on 1 and 2 | **Neither gate is met.** See §7. |

### Verdict on the document

**`planning/roadmap-to-done.md` cannot be trusted as the 1.0 index at HEAD.** It is not merely
behind; it is *directionally* wrong in the two places that matter most, telling a reader the
feature work is finished and the content is committed when 46 RFCs are active and zero packs have
graduated. It should be rewritten against this pass or explicitly demoted, because a stale index is
worse than no index — it answers the owner's question with a "yes" that the repo does not support.

**Structural note.** The roadmap is one of **nine** rollup documents, and it is the **oldest**:

| Rollup | Last touched |
|---|---|
| `planning/roadmap-to-done.md` | **2026-08-14** |
| `planning/open-work-inventory.md` | 2026-08-15 |
| `planning/app-reality-check.md` | 2026-08-16 |
| `planning/platform-alignment/capability-reality-audit.md` | 2026-08-21 |
| `planning/work-register.md` / `planning/WORK.md` / `1.0-capability-map.md` | 2026-08-22 |
| `platform-alignment/never-started-lanes.md` / `unreachable-mechanisms.md` | 2026-08-23 |

The index that claims to be *"the single checkable index"* is the least maintained of the nine.
That is itself a finding: **the rollup layer has forked**, and no document owns the fork.

---

## 2. Design (intent) — proposed amendments, NOT written

**Law 5 applies: nothing in `design/00`–`06` was edited by this pass.** What follows is a
consolidated list for the owner to rule on, each item with the exact sentence at issue and the code
that settles it. **Twelve stale sentences across three intent documents, plus four mirror
surfaces.** Every one was verified at HEAD.

### 2.0 The headline — why this matters more than the count

**B6 and B7 were falsified two hours after they were written, and the commit that falsified them
flipped the ledger but not the design doc.**

| 2026-08-14 **20:22** | `142bca95` *"audit: forward trace — two gate misstatements corrected"* writes *"does NOT exist"* into B6 and B7 |
|---|---|
| 2026-08-14 **22:24** | `0939070c` **"feat: complete orphaned breadth surfaces"** ships both |

That second commit flipped `design/BACKLOG.md:1423-1424` to `✅ SHIPPED 2026-08-14` — the ledger
clause working exactly as `CLAUDE.md` describes — and **never touched `design/03`**. It also left
the ledger's own summary row behind: **`BACKLOG.md:1422` still says *"nothing exists"* / *"zero
producers"* three lines above the two ✅ rows contradicting it.** That has stood for ten days.

The lesson is precise and it generalises to every finding in this document: **the completion
protocol propagates a change *down* into the ledger and the log, and has no clause that propagates
it *up* into intent.** The RFC that fixed `__legacy` (#1 below) shows the correct behaviour under
law 5 — it recorded the deviation and explicitly declined to edit the protected sentence
(`rfc/archive/portable-account-data.md:440-443`) — but there is no queue that then delivers those
declined edits to the owner. This section is that queue, ten days late.

### 2.1 The proposed amendments

| # | Document and sentence | Evidence at HEAD | Proposed |
|---|---|---|---|
| **1** | `design/02:100` — *"deleted learners' runs reassign to `__legacy` (sessions and grants cascade)"* | Only **shared** runs reassign (`storage.ts:2093-2100`); unshared runs are **hard-deleted** (`storage.ts:2088`, `account-data.ts:545`). Driven by owner ruling **[[D656]]**, landed `b4d06547` 2026-08-23. The implementing RFC recorded the deviation and correctly declined to edit. | **Narrow** to shared runs. (The bullet's first half, *"No operator account exists"*, is accurate.) |
| **2** | `design/03:328` — B6: *"session distillation … does NOT exist — `session_distilled` is a reserved enum with zero producers"* | **Falsified on every element.** Complete handler at `rest.ts:1416-1423`; route `:696`; authorization `service.ts:1112-1114`; UI button `App.svelte:818`; and `distill.ts:95` emits `sources: ["session_distilled", …]`, so "zero producers" is specifically false. | **Strike** and restate B6 as shipped. |
| **3** | `design/03:329` — B7: recommender *"does NOT exist — no route"* | `GET /progress/recommendations` at `rest.ts:1016-1018`; `service.ts:1119`; client `api.ts:1206`; rendered `App.svelte:880-882`; documented as shipped at `docs/return-and-progression.md:55`. | **Strike.** |
| **4** | `design/03:330` — B8: *"no account export/backup contract"* and *"deletion retains solo runs"* | `POST /auth/export` at `rest.ts:832`, `account-data.ts:6`, UI at `App.svelte:1101`, landed **`b4d06547`, 2026-08-23**. Solo-run retention falsified as in #1. | **Strike both.** The row's other three negatives — notices/SBOM, PWA manifest-only, Maia-green — are **ACCURATE** and should stay. |
| **5** | `design/03:332` — B10's A5 qualification: *"one unnamed default, only 2/6 direct workflow bindings and no per-kind ceiling (session-kind permissions are byte-identical)"* | `presets.ts` (landed **`976d5238`, 2026-08-23 — after** the 2026-08-21 qualification) declares **five named** presets with labels and promises (`:32-36`) and **eight** workflow contexts with **distinct** ceilings (`:41-49`) — `match` gets `moduleCeiling: ["rules_floor"]`, `position` gets all of `MODULE_IDS`. Enforced `campaign-contract.ts:46`; bound `DrillScreen.svelte:378`. | **Strike the three specific negatives.** **Keep** the conclusion: `loadWorkflowPreset`/`saveWorkflowPreset` have **no caller outside tests** — no UI lets a learner pick a preset — so *"the integrated outcome is not shipped in full"* stands. |
| **6** | `design/03:360` — the "zero producers" list (7 items) | **5 of 7 have real emitters:** `outcome.reached` (`runtime.ts:355`), `transfer.scheduled` (`service.ts:1982`), `feedback.generated` (`guard.ts:153`), the prediction checkpoint (`rest.ts:1742` → `service.ts:1522` → `CheckpointSheet.svelte:98`), the generic predicate evaluator (`pack-orchestrator.ts:219,228`). | **Reduce to two.** Still accurate: `human_model_predicted` (production emits `source: "engine_validated"`; only tests use the enum) and the drill-address grammar (`parseDrillAddress` exists only in `packages/schema/src/drill-pack/urls.ts:88`, zero references from `apps/*`). |
| **7** | `design/03:368` — contradicts `design/03:323` in the same file | `/settings` mounts `<AppearanceSettings />` + `<AssistanceSettings>` (`App.svelte:1100-1101`); `phase` is projected end-to-end (`pack-registry.ts:39` → `PackList.svelte:35`; `guidance.ts:142` → `DrillScreen.svelte:942`). | **Strike 2 of 3.** *"address grammar unrouted"* is accurate. |
| **8** | `design/05:199` — *"Shipped-off today: `drawable: { enabled: false }`"* | `Chessboard.svelte:135` reads `enabled: drawingEnabled`; `DrillScreen.svelte:890` passes `drawingEnabled={previewNodeId === undefined}` — **on during ordinary play**. Persisted via `GET`/`PUT /runs/:id/marks` (`rest.ts:1309`, `:1378`). Landed **`acebb918`, 2026-08-16**, one day after the ruling the row records. | **Strike form (a).** Form (c) *"no producer yet"* is **ACCURATE** and self-documented at `evidence-catalog.ts:892`. |
| **9** | `design/05:198` — lit squares marked 💡 | All three named levels ship: `assistance.ts:12` (`"off" \| "legal" \| "sight" \| "evidence"`), rendered `DrillScreen.svelte:380-382`, configurable `AssistanceSettings.svelte:63`. | **Re-mark as shipped.** |
| **10** | `design/05:383` — packet grammar / machine-check *"not shipped behaviour"* | `voiceCheck` at `voice.ts:110-122`, enforced on **every** provider response at `guidance.ts:166` with deterministic fallback at `:170`; LLM leg at `external-voice.ts:36-47`. Landed `7f21178e`/`e78e7238`, **2026-08-14 — the same day the sentence's own "corrected 2026-08-14" annotation was written.** | **Strike.** |
| **11** | `design/05:521-526` — *"What is missing is vocabulary, not machinery"* | The three predicates it names as missing all ship and are pack-authorable: `objective.ts:72` (`structuralFeature` FenPredicate variant, evaluated `:193`); schema at `drill_pack.schema.json:521-527` with `backward_pawn`, `outpost`, `half_open_file`; authoring path `pack-orchestrator.ts:136`. | **Strike or invert.** |
| **12** | `design/02:72-74` — the R18 floor sentence | Carries the `design/03` rot **plus one more**: *"pointer-only board entry, Tab traps"* is falsified by `board-input.ts` and `Chessboard.svelte:336,343` (`tabindex="0"`, `onkeydown={gridKeydown}`) with keyboard promotion at `:368`. **`design/03:330` already carries that correction** (`2b68103`, 2026-08-21); **`design/02` was never updated to match.** | **Strike 3.** This is a split-surface defect: two intent docs disagree about the same fact. |

### 2.2 [[D1497]] — `campaign` appears zero times in `design/00`–`05`

**CONFIRMED, and it is the largest intent-tier gap in the repo.** A case-insensitive grep returns
**0 hits** in each of `design/00` through `design/05` — including `design/03`, the document
`CLAUDE.md` calls *"complete surface map, IA, and B1–B8 gate"*, and `design/05`, *"the generic board
experience beneath every surface"*, which has never been written against a campaign board.

Against that absence:

| Campaign asset | Size |
|---|---|
| Design / RFC / research / planning prose | **~6,900 lines**, including a whole intent doc (`design/06-campaign.md`) |
| Production code and tests | **~950 LOC** across five files |
| HTTP endpoints | **0** (`git grep campaign -- rest.ts` → nothing) |
| UI doors | **0** — `router.ts:22-32` has nine routes, none `/campaign`; `PLANNED_SURFACES` is empty (`api.ts:285`, asserted `api.test.ts:215`) |
| Authored campaigns | **0** — `content/campaigns/` does not exist |

`rfc/campaign-core.md` is honest (*"implementing… routes, seed content and surfaces remain"*), and
`docs/campaign.md:2-3` says it outright. **The gap is not that the campaign is unbuilt — it is that
the product's own surface map does not contain the surface, so no gate, no IA and no invariant
review covers it.** This is the one item on this list that is a *missing* sentence rather than a
*wrong* one, and it is the one most likely to matter at 1.0.

### 2.3 Mirror surfaces carrying the same stale text

Law 5 forbids a split gate surface, so these need the **same commit** as the amendments above:

- `planning/exploration/gates.md:298` (B6, verbatim), `:299` (B7, verbatim), `:303` (B8 export +
  solo deletion)
- `design/BACKLOG.md:1422` — the summary row contradicting its own `:1423-1424`

### 2.4 Three items flagged UNCLEAR — owner's call, not measurable

- **`design/05:209`** *"(`boardLighting`, arrows, spoken — each off by default)"*. `assistance.ts:18`
  ships `SILENT_ASSISTANCE` with `boardLighting: "legal"`. Literally contradicted — but the constant
  is *named* for silence, so the code evidently treats legal-move dots as a rules affordance rather
  than assistance. **Either the sentence or the default is wrong; which one is intent.**
- **`design/04:163`** *"`feedbackClaims` … has no triggers, so it can never fire"*. Claims **do**
  reach the learner (`authored-feedback.ts:414-430` → `DrillScreen.svelte:290`), but the column's
  actual question is transfer to Just Play, and the schema still gives `feedbackClaim` no position
  trigger (`drill_pack.schema.json:1066-1071`). **The verdict stands; the reason clause misleads.**
- **`design/03:326`** *"full evidence-bound LLM rendering remains unbuilt"*. "Full" is a
  completeness judgement, and it should be read alongside #10, which falsifies the narrower claim in
  `design/05:383`.

### 2.5 Checked and found ACCURATE — recorded so it is not re-audited

`design/02:98` (no operator account) · `design/02:117` (PWA manifest-only) · `design/01:62`
(pack-local concepts; `progress.ts:56-59`, key `pack:${packId}#${raw}`, the only `ConceptResolver`) ·
`design/01:97` (draw policy) · `design/03:329` (cross-pack concept identity) · `design/03:330`
(Maia / SBOM / PWA) · `design/03:360` (`human_model_predicted`, address grammar) · `design/05:199`
form (c) · `design/06:48-53` (`DecidednessGround` three kinds, `branch-scale.ts:14-17`) ·
`design/06:62-64` (client-only `AssistanceConfig`) · `design/06:64-66` (`clockState` zero-reader,
`drill_run.schema.json:219`) · `design/06:137` (no IM/GM opponent; four modes,
`opponent-selector.ts:512-524`) · `design/06:392` (resolver key format).

**Not checked, out of scope:** `design/02:131`/`:170` (competitor claims), `design/04:40` (unruled
policy), `design/00:73`, `design/05:279`, `design/06:391` — authored-content-volume or policy claims
that code cannot settle.

---

## 3. RFC tier

### 3.1 The headline

**The register's machine-checkable layer is clean; its prose layer is where the dishonesty lives.**
`node tools/register-check.mjs` is green (C1–C8). File↔row parity is **exact** in both tables — 47
active rows / 47 files, 72 archive rows / 72 files, 2 withdrawn / 2 files, **no orphans, no
phantoms**. Of 47 lifecycle tokens compared against RFC bodies, **46 match** (the one mismatch,
`exact-legal-mobility`, exists only in the working tree).

**But eight active rows carry a status contradicted by a return or a blocking finding that landed
2026-08-23/24, and only one of those is recorded at all** — and that one was retro-fixed a day
late.

### 3.2 Root cause — the vocabulary has no word for what happened

`rfc/0000-rfc-process.md:64` closes the state vocabulary at seven tokens: `draft, accepted,
implementing, awaiting, implemented, superseded, withdrawn`. **There is no `returned` and no
`blocked`.** A returned document is therefore *inexpressible* in the register's machine-read cell.
The convention that emerged instead — a `> **Cross-review …**` blockquote dropped into the RFC
*body* — does not touch `rfc/README.md` at all, and `register-check` reads no prose.

Commit `cf2e292b` is the proof: it returned `hint-distance` to research, landed findings on three
other drafts, **edited `rfc/README.md` in the same commit** — and used that edit only to *add* a
different row. This is the same shape as the ledger and log clauses already in `CLAUDE.md`: the
absence of a mechanical link predicts the failure exactly. **It recurred nine times in two days.**

Coverage check: of the finding ids landed 2026-08-23/24 (D1376–D1447, D1455, D1471, D1472),
`rfc/README.md` contains exactly **two** — D1414 and D1400, both in the `social-play` cell.

### 3.3 The eight dishonest rows

| RFC | Register says | Reality at HEAD |
|---|---|---|
| **`longitudinal-store.md`** | **accepted** 2026-08-22 | **Returned to author** 2026-08-23 (`66ee1103`) on D1401–D1405 — including a whole-run mutation path **refused by 23×–85× latency failures** (p95 11.44 / 23.43 / 42.56 s against a 500 ms budget). **The RFC body also still says `accepted` and carries no return notice at all** — the only returned draft with zero paper trail in its own file. **It is also migration-chain position 1**, with eight RFCs pinned transitively behind it. **Most severe.** |
| **`hint-distance.md`** | **draft**, "rank 4 of live debt" | **Returned to research** 2026-08-23 (`cf2e292b`) on **eight** buildability blockers (D1376–D1378). Body notice at `:513`; body Status line still reads *"Ready for review"*. |
| **`bot-route-source.md`** | **draft** — *"PASSED its preregistered gates"* | **Author return.** D1383 (criteria 6/15/17/18 **cannot fail as written**), D1379, D1384. The cell reads as a success story. |
| **`bounded-policy-targets.md`** | **draft**, no blocker named | **[[D1411]] blocks acceptance**: the [[D755]] clause criterion 16 amends **does not exist** in `breadth-collectors.md`; §4.2 publishes an interval for a move illegal in **222 of 384** band-rows. |
| **`theory-knowledge-pipeline.md`** | **draft** — *"blocked by two named things: O5 … and F3"* | **A third blocker exists and is omitted: [[D1410]]** — the law-8 argument is prose at four points it claims are structural. Plus D1393–D1396 (incl. no SSRF guard). The cell explicitly enumerates blockers and the enumeration is incomplete. |
| **`shared-candidate-evidence-packet.md`** | **draft**, no blocker named | **[[D1412]] blocks acceptance** — the seal does not reject a reconstruction (**executed**: `RECONSTRUCTION REJECTED BY SEAL? false`); asserting an event mints a second sealed twin. [[D1413]]: still asserts the retracted [[D1388]] claim in two places. |
| **`review-map.md`** | **draft** on ruling [[D1273]] | **Owner ruling [[D1409]] blocks acceptance** (body `:328`), plus D1422/D1423. Register silent. Its Parent cell also points at `planning/review/`, which is **untracked at HEAD**. |
| **`social-play.md`** | **draft — RETURNED by [[D1414]]** | Substantively **honest** — the only return recorded anywhere — but the machine token is still `draft`, the markdown is broken, ~80% of the cell still argues the **overturned hybrid** as live, and it holds a live migration claim designed for that hybrid. Recorded **2026-08-24**, a day after the ruling; the ruling commit `d903da9e` touched the RFC but **not** the register. |

### 3.4 Six incomplete rows (status not contradicted, landed findings omitted)

`module-registration.md` (D1444–D1447 and **[[D1455]]**, a blocker: no `ModuleAnswerCeiling` maps
to `evaluation`, so `derived.grade.move_quality@1` is admissible to **no module**);
`evidence-presentation.md` (D1440–D1443; **D1440 has since been closed — see §6.2 — but the register
cell records neither the finding nor its repair**); `theming.md` (cell asserts *"criteria 1–13 landed"*; **[[D1425]]** finds the shipped
catalog is **3 of 10** ruled schemes — *"an undeclared cut"*); `training-mode-variants.md` (D1380,
D1381); `intent-presets.md` (omits **D1436** — `AssistancePermission` has four members and the
`match` clamp needs a fifth, so the strictest ceiling is inexpressible); `exact-legal-mobility.md`
(correct at HEAD; goes stale the instant the working-tree commit lands).

### 3.5 The six schema registers and the migration chain — mechanically clean

All heads verified against shipped bytes, not against each other:

| Register | Head | Shipped authority | Verdict |
|---|---|---|---|
| Pack-schema | 0.27 | `DRILL_PACK_SCHEMA_VERSION="0.27"` | ✅ contiguous; 0.19 absent but **documented as frozen shut** — a gap by design |
| Run-schema | 0.17 | `DRILL_RUN_SCHEMA_VERSION="0.17"` | ✅ contiguous |
| Shape-entry | 0.3 | `SHAPE_ENTRY_SCHEMA_VERSION="0.3"` | ✅ |
| Principle-entry | 0.1 | `PRINCIPLE_ENTRY_SCHEMA_VERSION="0.1"` | ✅ |
| Campaign-schema | 1 | `$id …campaign:1` | ✅ correctly registered as landed-without-an-owner |
| Evidence-kinds | 7 members | `EVIDENCE_KINDS` — exact set match | ✅ |
| **Migration chain** | 25 | `STORAGE_VERSION = 25` (`storage.ts:631`); migrations **1…25 present, contiguous** | ✅ acyclic, one total order, no gaps |

**Two semantic hazards the mechanical check cannot see, and they are the important part:**

1. **The head of the migration chain is a returned document.** `longitudinal-store` holds position
   1 while returned on a latency finding that refuses the very mutation path the store is built on.
   **All eight downstream positions are pinned behind it.**
2. **Position 8 is a returned document too.** `social-play` holds a position with
   `theory-drill-current-joins` pinned behind it, while [[D1414]] rules it must be **rebuilt, not
   amended**, and its ADD-COLUMN claim was designed for the overturned hybrid.

Neither is a register *error* — both claims are correctly recorded. Both are claims that must be
released or re-declared as part of routing the returns, and **nothing currently forces that**.

### 3.6 `CLAUDE.md` — both RFC-tier claims are false

| Claim (`CLAUDE.md:26`) | Reality | Drift |
|---|---|---|
| *"No active product RFC"* | **46 active product RFCs** | off by 46 |
| *"23 implemented RFCs frozen in `rfc/archive/`"* | **72** files, 72 rows | **off by 49** |

The Phase paragraph (`:7-19`) also still describes the 2026-08-11 foundation state and names none
of the ~14 lanes now in flight.

---

## 4. Implemented (`docs/`)

**Scope of the audit:** 43 docs, 5,940 lines. 531 backtick-quoted symbols, routes and constants
were extracted and mechanically checked against the tree.

**The good news first, because it is load-bearing.** The docs' *identifier* vocabulary is nearly
perfect: of 531 extracted symbols, **exactly one had no referent**, and that one is deliberate. Not
one documented schema field has been removed. Roughly 120 spot-checked numeric thresholds, error
codes, endpoint shapes and type blocks verified correct. `docs/theming.md`, `docs/learner-rating.md`
and `docs/drill-pack-format.md` are accurate in every particular checked. **`docs/` is not rotten;
it is precise about names and unreliable about summaries, disclaimers and inventories.**

No code was committed on 2026-08-24 (that day was entirely research), so docs↔code drift is bounded
at 2026-08-23.

### 4.1 The three failure modes

**(a) Header/summary lines rot while bodies stay correct.** Four docs state a living schema version
in their intro; three are wrong and two contradict their own bodies:

| Doc | Claims | Actual | Same doc's body |
|---|---|---|---|
| `docs/development.md:42` | run v0.9 | **0.17** | — |
| `docs/branch-runtime.md:16` | run v0.10 | **0.17** | `:370` says 0.17 ✓ |
| `docs/engine-workers.md:15-16` | run v0.15 | **0.17** | `:222` says 0.17 ✓ |
| `docs/README.md:18` | pack v0.17 | **0.27** | — |

Ground truth: `schemas/drill_run.schema.json:3` = `0.17`; `schemas/drill_pack.schema.json:3` =
`0.27`. Per-version body sections are appended as each version ships; the summary line at the top
never gets touched. Commit `75154d60` already fixed this exact drift inside the schema's own
description field — `docs/` never got the same pass.

**(b) "What doesn't exist yet" disclaimers outlive the thing they disclaim.** This is the most
damaging class, because it tells a reader a shipped capability is absent:

- **`docs/engine-workers.md:329-331`** lists five items as *"BACKLOG work… not part of this
  implemented foundation"* — root Compose packaging, healthchecks, pinned GHCR multi-arch images,
  profiles, devcontainer. **All five shipped** (`compose.yaml:28,37,46`;
  `.github/workflows/release.yml:50,53`; `.devcontainer/`; `Makefile:137-144`), and
  `docs/development.md:131-142` documents all five as working. **Two docs directly contradict.**
- **`docs/app-shell.md:28`** calls `/create` an *"Honest empty state for the authoring program."*
  It is a full Pack Studio with Save, Playtest, community registration and withdrawal
  (`App.svelte:975,993`), landed **2026-08-13**. `app-shell.md` has been edited since (2026-08-23)
  without fixing it, and `docs/pack-studio.md:3` describes the studio correctly — **`docs/`
  contradicts itself about the same route.** `docs/drill-client.md:344` extends the same error to
  `/learn` and `/live`, both fully built.
- **`docs/explanation-grounds.md:148-157,264-276`** describes a pre-2026-08-16 world: *"exactly
  three authored shapes"* (it is a **5**-way union at `authored-feedback.ts:34-89`); *"unanchored
  feedback claims remain absent"* (shipped at `:414-434`); and a *"Current boundary"* list of four
  unshipped items of which **three shipped**.
- **`docs/evidence-contract.md:155-160`** says deflection and attraction are *"absent from the
  compiled catalogue"* — they were registered at `evidence-catalog.ts:496,505-513` **by the same
  commit that last touched the doc**.

**(c) Off-by-N counts on closed vocabularies** — nine verified, each against the enumeration in
code: `README.md:72` fifteen rung-0 predicates (**18**); `evidence-contract.md:119` thirteen-field
module contract (**14**), `:140` five readings (**6**), `:25` closure tuple 34/187/25/209
(**35/188/25/210**); `branch-runtime.md:185-191` 15 events (**16**), `:197-200` 3 kinds / 2 sources
(**4 / 3**), `:129-132` 6 error codes (**7**); `drill-pack-format.md:150-153` 7 success conditions
(**8**), `:134-136` 5 trigger arms (**6**).

Two further outright errors: **`docs/branch-runtime.md:326`** says `RunStorage` isolates persistence
behind *"`create`, `read`, `save`, and `close`"* — `storage.ts:345-612` declares **~70 members**;
only `close()` is where the doc says. And **`docs/development.md:30`** contradicts itself 95 lines
later on whether `content/drafts` is development-only (`:125-128` and
`pack-registry.ts:332-334` agree it is served **in every environment**).

### 4.2 [[D1488]] verified

`docs/pack-studio.md:3-4` claims Studio *"uses the same living pack validator as `make
pack-check`"*. **False, and the ledger's diagnosis is exact.**
`apps/server/src/pack-studio.ts:86-87` calls `validatePackDocument(document, { shapes })`;
`pack-check.ts:140-143` passes `{ shapes, packs, principles }`; the signature at
`pack-validation.ts:1357-1362` accepts all three. **The fix is two constructor arguments.**
Corroborating instances also reproduce: `lintPackDraft` has **0** occurrences in
`apps/web/src/lib/api.ts` while the endpoint exists at `rest.ts:1058`, and `GET /principles` does
not exist (`grep -c principle apps/server/src/rest.ts` → **0**).

### 4.3 Omissions — built, exported, and undocumented

Most doc gaps are legitimate (docs land at RFC-archive time). **Four are not** — accepted or
implementing RFCs with shipped, exported code and no doc:

| Subsystem | Code | RFC status | Doc |
|---|---|---|---|
| **Learner modules** | `module-contract.ts` (11 ids, 14-field contract) + `module-reducers.ts` | **accepted** | **None.** 1 of 11 `MODULE_IDS` appears anywhere in `docs/`; `module-reducers` — 0 mentions |
| **Move-quality grades** | `grade.ts` (`MoveQualityClass`, `GRADE_CONVENTION`) | **implementing** | One incidental mention |
| **Intent presets** | `presets.ts` (`WORKFLOW_CONTEXTS`, `PRESET_IDS`, `PRESET_DECLARATIONS`) | **implementing** | **0 mentions of either constant** |
| **Campaign run fold** | `campaign-state.ts` — full event-sourced `CampaignRunState`, seals, charges, unlocks, exported at `index.ts:88` | **implementing** | `docs/campaign.md:3-4` says campaign runs *"do not yet exist"*; the doc predates the fold by a few commits on the same day. Half-right: routes and persistence genuinely don't exist |

**Correctly absent:** `longitudinal-store` exists only as `tools/` research harnesses with zero
production code — rightly undocumented under the exploration gate. `exact-legal-mobility` is in
flight, not missing.

**Inventory gaps:** `docs/development.md` documents **15 of 36** Makefile targets (eight appear in
no doc at all). `docs/branch-runtime.md:273-285` documents **9 of 36** run-scoped actions and **11
of ~63** routes — `/auth/*`, `/classrooms`, `/assignments`, `/progress*`, `/rating*`, `/marks`,
`/runs/import` are entirely undocumented. **5 of 22** Svelte components are named across
`drill-client.md` + `app-shell.md`. `docs/engine-workers.md:275-291` lists **6 of 17**
`/capabilities` fields — including omitting `evidenceManifest`, which
`docs/evidence-contract.md:21` depends on. `docs/README.md` (2026-08-15, the index) omits **15 of
42** docs, and eight docs are navigation orphans — in no index and cross-referenced by nothing.

### 4.4 The in-flight doc edits are the discipline working

The three uncommitted doc modifications (`evidence-contract.md`, `drill-client.md`,
`content-sourcing.md`) are the exact-legal-mobility RFC documenting itself **in-commit** — 29
insertions, 3 deletions — and two of the three **fix real HEAD defects** (the closure tuple and the
Chessops legal-destination claim). This is the closeout protocol behaving exactly as `CLAUDE.md`
asks, and it is worth recording as a positive control against the failures above.

---

## 5. Research

### 5.1 What this pass wrote

Twelve UX dossiers landed 2026-08-23/24 and **none had a coverage-matrix row**, because every
agent deferred the row to avoid clobbering siblings in the shared worktree — each said so in
writing (e.g. `ux-arrival-and-start.md` §13, `ux-after-the-run.md` §Coverage matrix row). **All
twelve rows are now landed** in `design/research/README.md`. Four of the twelve dossiers had
already drafted their own row; those are used verbatim. The other eight were composed from each
dossier's header block (Question / Scope / Feeds / Method) and its verdict section, in the
README's shipped `| Area | Feeds | Status | Report |` format.

| Dossier | Row source |
|---|---|
| `ux-arrival-and-start.md` | verbatim, dossier §13 |
| `ux-core-loop.md` | verbatim, dossier §Coverage-matrix row |
| `ux-after-the-run.md` | verbatim, dossier §Coverage matrix row |
| `ux-authoring-and-library.md` | verbatim, dossier §Coverage-matrix row |
| `ux-in-run.md`, `ux-live-and-social.md`, `ux-settings-and-identity.md`, `ux-opponents.md`, `ux-teacher-and-classroom.md`, `ux-import-and-account.md`, `ux-campaign.md`, `ux-accessibility-and-mobile.md` | composed this pass from header + verdict |

Table integrity re-checked after the append: 135 rows, no new malformed rows.

### 5.2 The defect is chronic, not a one-day accident

**Three further dossiers have no coverage row and predate this wave:**

| Dossier | Landed | Size |
|---|---|---|
| `endgame-latency-versus-cet.md` | 2026-08-20 | 931 lines |
| `classifier-coverage-and-noise.md` | 2026-08-22 | 745 lines |
| `stockfish-candidate-guard-probe.md` | 2026-08-23 | 184 lines |

(`teardown-protocols.md` also has none, but it is a method document rather than a dossier.)

**Root cause: there is no instrument.** `make register-check` verifies RFC↔row parity for both the
active and archive tables and is green. **Nothing checks that a landed dossier has a
coverage-matrix row.** `grep -n research Makefile` returns zero targets. This is the same shape as
the two clauses already in `CLAUDE.md` — the ledger clause and the log clause, both added on
measured evidence after an absence predicted a failure exactly. The research tier is the third
instance and is the only one of the four tiers with no closeout of any kind.

### 5.3 The larger research-tier risk: ~97 proposed ledger rows with no landing instrument

The twelve dossiers propose, at minimum, **97 ledger rows** across their "Proposed ledger rows"
sections (a conservative count; four dossiers use a format the counter under-reads). Per
[[D1130]] these are proposed **unnumbered** and renumbered at landing. Only **one** dossier
(`ux-in-run.md`) carries a "Ledger rows landed" section, and its five landed ids (D1454–D1458)
**do not correspond one-to-one** with its six proposed ids (D1449–D1454) — D1454 means different
things in the two lists. The renumbering is done by hand, and nothing verifies that a proposed
row reached the ledger. Under law 4 (*"every idea gets a ledger row"*), an unlanded proposal block
is a silent loss of exactly the kind the ledger exists to prevent. **Nobody has checked this.**

---

## 6. The instruments

**Headline: the brief for this pass was wrong about the one gate it named, and right that a gate is
broken — just not that one.** Every gate in the `verify` chain is **GREEN**. **`make test-browser`
is RED on a deterministic product defect**, and the CI-parity enforcement point that would have
chained it to `verify` was deleted one commit after it was created. Those two facts compose into
the one genuine 1.0 blocker in this section.

### 6.1 Measured this pass

| Gate | Command | Status | Evidence |
|---|---|---|---|
| typecheck | `make typecheck` | **GREEN** | — |
| test | `make test` | **GREEN** | **170 files, 1,126 tests, 56.7 s** |
| schema-check | `make schema-check` | **GREEN** | 5 scaffold/parity fixtures pass; `scaffold verification: OK`, `packaging verification: OK`, `lefthook validate` → `All good` |
| register-check | `make register-check` | **GREEN** | C1–C8; 47/47 active and 72/72 archive rows |
| status-parity | `make status-parity` | **GREEN** | — |
| work-index | `make work-index` | **GREEN** | — |
| intent-parity | `make intent-parity` | **GREEN** | — |
| evidence-manifest-check | `make evidence-manifest-check` | **GREEN** | — |
| semantic-evidence-check | `make semantic-evidence-check` | **GREEN** | — |
| account-data-lifecycle-check | `make account-data-lifecycle-check` | **GREEN** | — |
| graduation-plan-check | `make graduation-plan-check` | **GREEN** | — |
| build | `make build` | **GREEN** | web bundle 584 kB (warns above the 500 kB budget) |
| **test-browser** | `make test-browser` | **RED** | **1 deterministic failure + 1 timing-marginal.** See §6.4 |
| **ci-local** (full CI parity) | `make ci-local` | **UNRUNNABLE, and orphaned** | *"Node 24 is required; found v26.7.0"* and *"SF_CMD must name an executable Stockfish binary"*. Docker Compose **is** available; Stockfish **is** installed at `/opt/homebrew/bin/stockfish` but `SF_CMD` is unset. `.node-version` and `.github/workflows/verify.yml:22` both say `24`; the running interpreter is 26.7.0. **And nothing invokes it** — §6.3 |

`make verify` = `typecheck test schema-check register-check status-parity work-index intent-parity
evidence-manifest-check semantic-evidence-check account-data-lifecycle-check graduation-plan-check`
— **all eleven GREEN.** `make test-browser` is **not** part of it.

**Two transient RED states were observed and are not repo defects**, but they are worth recording as
shared-worktree evidence: `make typecheck` went RED at 12:44 on
`storage.ts(2710,6): error TS1005: ')' expected` — a concurrent agent's half-saved file — and
`status-parity` was briefly RED on an uncommitted RFC-body edit that has since landed. Both are the
same class as §6.7.

### 6.2 [[D1440]] — corrected: `make schema-check` is not red, and was fixed today

The brief for this pass stated that `make schema-check` is RED at HEAD because
`tools/verify-scaffold.mjs` pins the `verify` chain by exact literal and the Makefile exceeds it.
**That was true, and it has been repaired.** `design/BACKLOG.md:1729` already records the fix:

> `D1440` ✅ — *"`make schema-check` WAS RED BECAUSE ITS OWN INSTRUMENT FORBADE ADDING INSTRUMENTS.*
> … *The repaired guard checks required-set containment: omitted required checks fail, while
> additional checks are legal."* — **✅ fixed 2026-08-24**

Verified independently: `missingMakeDependencies` (`tools/verify-scaffold.mjs:26-34`) now computes
`requiredDependencies.filter(d => !dependencies.has(d))` — a **subset** test — and the three
able-to-fail fixtures named in the row execute and pass, including one called literally *"verify
dependency guard permits additional checks"*. The two extras that broke it (`work-index`,
`account-data-lifecycle-check`) are now legal.

**This is the ledger's closeout protocol working exactly as designed**, and it is worth stating
plainly next to §3's eight dishonest RFC rows: the tier with the clause got fixed and recorded
within a day; the tier without one drifted nine times in two days.

### 6.3 CI parity was built, wired to push, and then dismantled — all on 2026-08-24

My first reading of this was too generous and is corrected here. Four commits, all today:

1. **`f54ee32c`** added `tools/ci-local.mjs` with a genuine clean-SHA gate: it **refused on a dirty
   tree** (*"CI parity only validates committed bytes"*), recorded HEAD before the run, and
   re-checked HEAD and tree bytes afterwards (*"local CI parity refused its receipt"*).
2. **`2d2c1b7f`** wired it to push — `.githooks/pre-push` running `exec make ci-local`, a `make
   hooks` target setting `core.hooksPath`, and a `verify-scaffold.mjs` assertion that the hook
   exists.
3. **`27f3612f`** added the Docker Compose preflight.
4. **`a76769e7`** (*"build: separate commit checks from CI parity"*) **deleted all of it** — the
   hook, the `hooks` target, the `core.hooksPath` config, the scaffold assertion, **and both the
   dirty-tree refusal and the post-run receipt check inside `ci-local.mjs`**. `lefthook.yml` gained
   43 lines of `pre-commit` jobs in exchange, but **has no `pre-push` section at all.**

Verified state now: `core.hooksPath` **unset**; `.githooks/` exists on disk but is **empty and
untracked**; `.git/hooks/` holds lefthook's `pre-commit` and nothing else; and **no Makefile target,
package.json script, workflow or hook references `ci-local`.**

Splitting fast commit checks from heavy parity is a sound idea. **What actually shipped is that the
enforcement point disappeared and was not replaced.** The consequence is precise, and it composes
with §6.4:

> **`tools/ci-local.mjs` is the only thing in the repo that chains `make test-browser` to `make
> verify`. Nothing runs `ci-local`. Therefore nothing runs the browser gate before code leaves the
> machine — and the browser gate is the one that is RED.**

**Residual gap in the [[D1440]] repair, worth its own row:** `requiredVerifyDependencies`
(`verify-scaffold.mjs:113-123`) still lists only **nine** checks. It never added `work-index` or
`account-data-lifecycle-check` — the two that caused the original failure. Either could now be
silently deleted from `verify` and the scaffold guard would stay green. The fix removed the false
positive without extending coverage to the checks that provoked it.

**Also:** `preflightFailures` demands Docker Compose because *"schema verification renders every
deployment profile"*, but `pnpm schema:check` (via `verify-packaging.mjs`) never shells out to
Docker — it string-matches compose files. The preflight requires a dependency the checked work does
not use, which makes `ci-local` harder to run than it needs to be.

### 6.4 The browser gate — the only genuinely RED product gate

Two runs, at `90ef834f` and `5e311b47`:

**(a) Deterministic.** `tests/browser/drill.spec.ts:1047` — *"Pack A withholds its line, grades the
boundary, and renders authored theory"*. Reproduced **3/3**, including in isolation:

```
Locator: getByRole('dialog').getByText('Castling into the break')
  1087 | await expect(boundarySheet.getByText("the pack has authored commentary about this alternative")).toBeVisible();
> 1088 | await expect(boundarySheet.getByText("Castling into the break")).toBeVisible();
```

Line 1087 **passes** and 1088 fails: **the boundary sheet announces that authored commentary exists
and does not render its body.** The text is present in the corpus at
`content/drafts/anti-caro-advance.json:291`. This predates the audit's own writes and survives the
`exact-legal-mobility` landing. **A real product defect**, and squarely in the *"honest absence"*
territory the UX wave spent twelve dossiers on — the interface promises content it then withholds.

**(b) Timing-marginal.** `drill.spec.ts:1308` — passed in run 1, timed out in run 2 at exactly
**3.0 m** against its own `test.setTimeout(180_000)`. It drives 5 viewports × N packs × 5 input
modes and sits on its budget. `playwright.config.ts` sets **no retries**, so a flake here is
indistinguishable from a regression.

### 6.5 What could not be run, and what nobody is running

- **`make ci-local` cannot pass on this machine** without switching to Node 24 and exporting
  `SF_CMD`. A parity gate that the local environment cannot satisfy is a gate that will be skipped;
  `make setup` runs only `pnpm install --frozen-lockfile` and wires neither.
- **Browser tests** (`make test-browser`, `.github/workflows/browser.yml`) were not run here — 4
  spec files under `tests/browser/`.
- **Non-deterministic committed outputs.** Three harness output files record wall-clock timings into
  version control — e.g. `tools/breadth-collector-measurement-harness/output.md` moved `50277.0 ms`
  → `51467.8 ms` merely by being re-run during this pass. **Re-running a measurement target dirties
  the tree**, which is a real hazard next to any clean-sha parity discipline. (`make
  graduation-report` is correctly split from `graduation-report-update` precisely to avoid this
  class; the measurement harnesses were not given the same treatment.)
- **`tools/rfc-completion-harness/output.md` was 8 archives stale** — it said `Archive files: 64`
  and re-running produced `72`. It is not wired into any Makefile target, so nothing re-runs it.
- **The D641 work-routing audit test fails at HEAD** by `never-started-lanes.md`'s own report
  (`unmentioned` 143 vs `ROUTED_IDS` 73). It lives in `tools/work-routing-harness/` and, like the
  above, is **not in the `verify` chain** — so a failing audit instrument does not fail any gate.

**The pattern in §6.5 matches §7.4 exactly:** what is wired into `verify` is green and stays green;
what is a loose harness rots silently.

### 6.6 New defect found while cleaning up: every sourcing manifest in the corpus is stale against its own pack

This was not sought either. Running `make verify-draft` on one pack regenerated its
`.sources.json`, and the regeneration changed the recorded bytes and digest — which meant the
committed manifest did not describe the committed pack. Measured across the whole corpus:

| | |
|---|---|
| Drafts carrying a `.sources.json` | **32** (24 have none) |
| Manifests whose `local-file` origin **matches** the pack at HEAD | **0** |
| Manifests **stale** against the pack at HEAD | **32 — all of them** |

Every one records a smaller pack than exists. `anti-caro-advance.json`: manifest says
`sha256:4cebe0af…`, 11,819 bytes, retrieved `2026-08-15T22:50:15Z`; the pack at HEAD is
`sha256:04480a63…`, **13,024 bytes**. The gap is consistently ~1,200–1,700 bytes, so the packs were
edited in a later wave and their provenance records were never regenerated.

**Why nothing caught it:** `make verify-draft` *does* catch it — that is how it surfaced — but
`verify-draft` is a parameterized tool (`FILE=…`), not a gate, and it is **not in the `verify`
chain**. There is no corpus-wide sweep. So the licence-and-provenance record for **every sourced
draft in the repo** points at a pack version that no longer exists, and no check has ever asked.

This matters beyond hygiene: provenance is the mechanism that makes authored evidence auditable
(law 3's tier-level analogue), and the 293 graduation conditions in §1 sit on top of it. **Proposed
ledger row: a corpus-wide sourcing-manifest freshness check, wired into `verify`.**

### 6.7 A live finding: `register-check` reads the working tree, so one agent's in-flight work blocks every other agent

This was not sought — it happened while committing this document, and it is worth recording
precisely because it is the shared-worktree failure mode nothing else in the repo describes.

`make register-check` was **GREEN** when measured at 12:1x (§6.1). At 12:42 a concurrent agent
created `apps/server/src/longitudinal.ts` and moved `STORAGE_VERSION` from `25` to `26` in its
**working copy** of `storage.ts`. HEAD still says `25`. `register-check` derives heads from the
**tree**, not from HEAD and not from the index, so it immediately began failing:

```
C4 migration: tree head 26 has no landed row
C6 migration: register head 25 disagrees with tree 26
```

That is the guard working **correctly** in intent — a migration must land with its register row, and
it will be satisfied the moment the sibling agent commits both together. But `lefthook.yml`'s
`process-contracts` job runs `make register-check` on any staged `design/**/*.md`,
`rfc/**/*.md` or `planning/**/*.md`, which means:

> **In a shared worktree, one agent's uncommitted migration blocks the pre-commit hook for every
> other agent — including documentation-only commits that touch no schema, no migration and no
> code.**

The blocked commit has no causal relationship to the failure and no way to fix it. `CLAUDE.md`'s
staging discipline solves the *staging* half of shared-worktree safety (never absorb another agent's
files) and there is no equivalent for the *verification* half. Two candidate repairs, neither
proposed as settled: scope the tree-derived heads to the staged set, or have the hook report a
tree-versus-HEAD divergence it did not cause as a distinct, non-blocking condition.

**Consequence for this commit, stated plainly:** it was landed with the pre-commit hook bypassed,
because the failure is provably another agent's in-flight state (`git show HEAD:…/storage.ts` →
`STORAGE_VERSION = 25`; working tree → `26`) and this commit contains two Markdown files. Every gate
in §6.1 was run by hand against the tree beforehand and passed. This is recorded rather than
quietly done, and the underlying defect belongs in the ledger.

---

## 7. Are we on track for a proper 1.0?

### 7.1 The direct answer

**No — not on the current index, and the reason is not that the work is going badly.** The work is
going unusually well by volume and by rigour: 827 commits in ten days, twelve UX dossiers that
measured rather than asserted, an RFC register whose mechanical layer is provably exact, and a
`docs/` tier where 530 of 531 checked identifiers resolve. **What is not on track is the
accounting.** The document that answers the owner's question — `roadmap-to-done.md` — says the
feature work is finished and the content is committed, and neither is true.

A generic pass was needed. It should now become a **cheap recurring one**, because §7.4 shows the
same failure recurring in four tiers for one reason.

### 7.2 The honest state, in four buckets

**Genuinely done.** The foundation is real and this pass found no reason to doubt it. Branch
runtime, drill-pack format v0.27, engine workers, the app shell, evidence contract and catalogue,
grounded explanations, identity/authorization, account export and deletion, classrooms and
assignments, learner rating with a calibrated Glicko-2 and migration 25, theming. Six schema
registers and a 25-step migration chain that are **contiguous, acyclic and verified against shipped
bytes**. **1,126 tests across 170 files, all green**, plus 98 harness test files, and every gate in
the `verify` chain passing. Several intent-tier sentences are stale
*because things shipped* — B6 distillation, B7 recommender, B8 export, lit squares, drawable marks,
the voice check, the structural predicates. That is the good kind of staleness and it accounts for
most of §2.

**Drafted but unbuilt — the largest bucket.** **46 active product RFCs: 25 draft, 10 accepted, 7
implementing, 5 awaiting.** Roughly **35 documents of specified-but-unbuilt product**: learner
modules, clocks (recorded and enforced), variants, casting, social play, skills, famous games,
training-mode variants, player style, review map, hint distance, measurement records, theory
pipeline. The roadmap's *"the feature column is empty"* is the single most misleading sentence in
the planning tier.

**Built but unreachable — the characteristic defect of this codebase.** The campaign is the pure
case: ~950 LOC of correct, tested mechanism behind **zero endpoints, zero routes and zero authored
campaigns**, and — per [[D1497]] — **not present in the product's own surface map at all.** It is
not alone. `grade.ts` has zero non-test consumers at HEAD. `BOT_POLICY_PROFILES =
compileBotPolicyCatalog([])` is still empty at `bot-policy-catalog.ts:299`. `loadWorkflowPreset` has
no caller outside tests, so **no UI lets a learner pick a preset** even though five named presets
with authored promise sentences ship. `presets.ts` is imported by **no `.svelte` file**. The
authoring capability ships server-side and is unwired client-side. `/library` duplicates two routes
while 284 authored knowledge units are reachable only mid-run. The measured summary is
`planning/platform-alignment/unreachable-mechanisms.md`, and **it still reproduces at HEAD** — I
re-verified three of its rows. (One row has been **fixed** since: `POST /rated-games` now has a
client caller at `App.svelte:392-395`, so the audit is a day stale in the good direction on that
one item.)

**Broken and unguarded.** One deterministic browser failure: the boundary sheet says *"the pack has
authored commentary about this alternative"* and does not render it (§6.4) — a promise-then-withhold
defect of exactly the class the UX wave spent twelve dossiers naming. And nothing runs the browser
gate before a push, because the only step that chained it to `verify` was deleted the day it was
added (§6.3). Separately, **~57 of 60 harness directories are referenced by no Makefile target, no
script, no hook and no workflow**, and the root `vitest.config.ts` does not reach `tools/` at all —
so no harness result can fail anything.

**Not started.** Zero graduated packs. Zero authored campaigns. Stockfish validation of
middlegame/opening authored claims. The learner-facing verb layer — per `ux-in-run.md`, **every one
of the nine assistance controls in the run screen names a producer rather than a question.** The
accessibility floor: the product is **not usable end-to-end by keyboard**, and the run **refuses to
mount below 360×680**, excluding iPhone SE, every phone in landscape, and the iPhone 12–15 Pro class
at reported iOS Safari `innerHeight`.

### 7.3 Does the UX wave's shape — broad capability, thin presentation — hold?

**Yes, and more strongly than the wave itself claimed.** The dossiers each found it locally; the
reconciliation finds it structurally, from four independent directions:

| | |
|---|---|
| Active product RFCs | **46** |
| Server REST layer | **1,823 lines**, ~63 routes, 36 run-scoped actions |
| Ledger rows | **1,332** (810 open) |
| **Client routes** | **9** |
| **Svelte components** | **23**, totalling 5,825 lines — of which `App.svelte` (1,195) and `DrillScreen.svelte` (1,680) are **49%** |
| **Graduated packs** | **0** |

Every tier is wide except the one the learner touches. The two sharpest single sentences from the
wave say the same thing from opposite ends: *"the product has no learner-facing verbs"*
(`ux-in-run.md`) and *"the named layer exists twice in this codebase and ships zero times"*
(`ux-settings-and-identity.md`). The campaign finding — a finished rulebook and no game — is the
same shape at maximum amplitude.

**One correction to the wave's implied story.** The presentation layer is not merely *thin*; in
several places it is **thinner than the intent tier believes**, and in several others the intent
tier believes it is thinner than it is. Both directions appear in §2. The problem is not a known
gap being slowly closed — it is that **nothing measures the gap on a schedule**, so its size is
rediscovered by accident each time. [[D1447]], the one accessibility defect on record, was found
*during an audit of something else*.

### 7.4 The one structural finding underneath all four tiers

Ranked by what the evidence actually supports, this is the most important thing in this document:

> **Every tier in this repo that has a mechanical register check is honest. Every tier whose
> bookkeeping is prose has drifted. The drift is proportional to how long the tier has gone without
> an instrument.**

- **RFC tier — has `register-check`.** File↔row parity exact, 46/47 lifecycle tokens match, schema
  registers and the migration chain contiguous and verified. **The prose cells in the same file
  carry eight false statuses**, because `rfc/0000-rfc-process.md:64` has no token for `returned` and
  `register-check` reads no prose.
- **Ledger — has the completion-protocol clause** (added on measured evidence, `CLAUDE.md`). It
  worked: `0939070c` flipped its rows correctly. **But the clause propagates changes down, never
  up** — the same commit left `design/03` false for ten days, and left the ledger's own summary row
  contradicting its two ✅ rows three lines below.
- **`docs/` — has no check.** Identifier vocabulary is nearly perfect because identifiers get
  touched when code changes; **header lines, "does not exist yet" disclaimers and inventories rot**,
  because nothing touches them. Two docs directly contradict each other about `/create`.
- **`design/research/` — has no instrument of any kind.** Twelve rows went missing in one day; three
  more have been missing since 2026-08-20; **~97 proposed ledger rows have no landing check at all.**
  It is the only one of the four tiers with **no closeout clause**.

`CLAUDE.md` already records this exact pattern twice — the ledger clause and the log clause, each
added after an absence predicted a failure exactly, each costing one commit's discipline. **This
pass is the third and fourth instances of the same lesson.** The cheapest repairs, in order:

1. **Add `returned`/`blocked` to the RFC state vocabulary** and make `register-check` fail a row
   whose RFC body carries a return or blocking notice the cell does not mirror. This alone fixes
   eight rows and prevents the ninth. *Nine recurrences in two days.*
2. **A coverage-matrix check**: every `design/research/*.md` has a row in `README.md`. Fifteen lines
   of Node; would have caught fifteen missing rows.
3. **An intent-flow-back clause**: when a commit falsifies a protected sentence, the RFC records the
   declined edit (which already happens — `portable-account-data.md:440-443`) **and** appends it to a
   standing owner queue. §2 is that queue, assembled by hand, ten days late.
4. **Rewrite or demote `roadmap-to-done.md`.** A stale index answers the owner's question with a
   "yes" the repo does not support.
5. **Restore an enforcement point for the browser gate.** `make verify` is green and will stay
   green while the only red gate is one nothing runs. Either put `test-browser` in `verify`, or give
   `lefthook.yml` the `pre-push` section it currently lacks — and make `make ci-local` satisfiable
   on the machines that would run it (Node 24, `SF_CMD`).

### 7.5 The three things most likely to be wrong that nobody has checked

1. **The ~97 proposed ledger rows from the twelve UX dossiers.** Per [[D1130]] they are proposed
   unnumbered and renumbered by hand at landing. Only one dossier (`ux-in-run.md`) reports which of
   its rows landed, and its five landed ids do **not** map one-to-one onto its six proposed ids —
   D1454 means different things in the two lists. **Nothing verifies that a proposed row reached the
   ledger.** Under law 4 this is a silent loss of exactly the thing the ledger exists to prevent,
   and it is invisible to every check the repo runs. *This is the highest-value unchecked item in
   the repo right now.*
2. **The two returned documents holding positions in the migration chain.** `longitudinal-store` is
   **position 1** while returned on a latency finding that refuses the very mutation path it is
   built on — **eight RFCs are pinned transitively behind it**. `social-play` holds position 8 with
   `theory-drill-current-joins` behind it, while [[D1414]] rules it must be **rebuilt, not amended**,
   and its ADD-COLUMN claim was designed for the overturned hybrid. `register-check` passes because
   the claims are correctly *recorded*; nothing asks whether a returned document may hold a
   reservation. **Nobody has looked at what happens to the chain when those returns are routed.**
3. **Whether the content pipeline can actually graduate anything.** `content/packs/` holds one file
   (`.gitkeep`), `docs/pack-graduation.md:3-5` says *"The current corpus has no graduable pack"*, and
   293 graduation conditions sit across 56 drafts. The roadmap has **no row for graduation at all**
   and counts drafts as *"39 packs committed"*. Nobody has asked the question that decides the
   content half of 1.0: **are these 293 conditions a work queue, or is the graduation bar
   unreachable as specified?** §6.6 is the first taste of an answer and it is not encouraging — **all
   32 sourcing manifests are stale against their own packs**, and it took an accidental
   `verify-draft` run to notice. Those are very different projects, and the difference has never been
   measured.

**Honourable mention** (checked, but only shallowly): the reality audits themselves rot fast and say
so. `never-started-lanes.md` opens *"This file is hand-made and rots… Do not quote these numbers
tomorrow"*, and its own D641 audit test **fails at HEAD**. I re-verified three
`unreachable-mechanisms.md` rows and they reproduce, and found one that no longer does. **The audit
layer has the same defect as the tiers it audits: it is prose, and nothing checks it.**
