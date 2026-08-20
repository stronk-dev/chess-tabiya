# RFC index

Process: `rfc/0000-rfc-process.md`. Template: `rfc/template.md`.

## Active

| RFC | Status | Parent | Implementation |
|---|---|---|---|
| `0000-rfc-process.md` | accepted | — | process |
| `teacher-surface.md` | **accepted 2026-08-16 — ready for implementation.** Both owner questions discharged: the *"ship no deferral"* ruling dissolved Open question 1, and the one narrowing it implied — `live-marker-quality`'s accepted cost from *"permanently"* to **"for the duration of live play"** — was **confirmed by the owner 2026-08-16**. Cross-review corrections landed in the file. **The implementer must be pointed at criteria 7a, 10c's second fixture, 10e's independent loop and 10g** — each exists because the specification as written passed every other check. **Do not weaken the `granted_via = 'submission'` conjunct**: the compatibility with `live-marker-quality` is held by it, *by fixture convention*, not by construction as the author round claimed | — | **claims one migration position** (`STORAGE_VERSION + 1`; head is **23**) — `ALTER TABLE run_grants ADD COLUMN granted_via TEXT`, nullable, no backfill, no CHECK. §4.3's write table is now **seven rows / twelve statements**, counting *statements* rather than sites, because every miscount across three revisions had one shape: a function listed while one of its two statements was not ([[D460]]). Four tables, `run_grants.expires_at`, `live_sessions.classroom_id`; no run- or pack-schema change, no new token scope, no fourth `RunRole`. Also claims **D92** and **D93** |
| `graduation-clearance.md` | **accepted 2026-08-17 by claude as register owner, third author round — on the buildability test.** Returned by the implementer **twice**; this round resolved [[D503]] **as an instance of a class, not as six entries**. The six `shape_firing` packs carry no `shapes` key at all and are **F `unbuilt`**, which is what their own statements say; the real fix is that **three of six kinds join their evidence through a pointer grammar the shipped code enforces and the RFC stated it for one** ([[D523]]) — including a **55-entry class** that could have been migrated with subjects whose predicate can never hold. **The bigger find came from running the predicate rather than reading it** ([[D522]]): for the 16 remaining rule-6 entries the D predicate **already holds today at 2–24 firings each**, so the migration's first run would have **retired sixteen debts by doing nothing**. Ruleset re-published and re-run over all 220: `unbuilt` 29→**35**, `shape` 22→**16**; clearable **173/47**; pack split **28/22**. **Unmoved and worth noting: 0 of 50 packs graduate on instrument runs alone.** Five things the implementer would have hit cold are fixed — `ExpressionCensus` **is not a type in the tree**, `MACHINE_LABELS` **is not the symbol's name**, every `:line` into `sourcing/check.ts` had drifted 4–24 lines, the D predicate costs a **full corpus walk** despite a `FILE=` argument, and `make graduation-clear` **had no recipe**. §3.2c is **half-reversed by [[D468]]'s packaging fix** — the lint stays whole in `validatePackDocument`, and only the `git blame` half splits | — | keeps its **pack schema 0.28** claim while accepted. No migration, run-schema, or shape-entry claim |
| `measurement-records.md` | **returned to author 2026-08-16** (core sound; 3 open questions + D391 block acceptance) | — | claims **shape-entry schema 0.4** only — one optional `measurements` property + three `$defs`. **No pack lane** (0.28 is claimed and held by `graduation-clearance` — corrected 2026-08-16, [[D472]])**, no run schema, no migration.** Splits the record into a normative half the gate may fail on (`textSha256` + span agreement) and a diagnostic half it may never fail on. **Cross-reviewed 2026-08-16: sound in its core, RETURNED TO AUTHOR** — three open questions must be ruled before `accepted`, and sub-expression readings (D391) were promoted to a blocker. The 4-vs-8 refutation **reproduces independently**; qualified in review to *4 errors + 8 one-flag warnings vs 12 indistinguishable failures* |
| `learner-rating.md` | **draft — author round 2026-08-16 implementing two owner rulings; not yet accept-ready.** **R10 REVERSED, not narrowed** ([[D437]]): cross-learner comparison ships as a **cohort standing** over an existing `classrooms` row — no second grouping object, no new role or token scope — with consent **transposed** from `teacher-surface` §2.2's submission shape rather than duplicated, since enrolment authorises addressing and *"does not authorise reading anything at all"*. Three layers, **marks as the default on measurement** (RD ≤ 60 needs ≈34 games, so every rating cell in a new club is empty for weeks); **rank by results, group by rating**, with AC-14 requiring that permuting every member's rating changes the order by zero bytes; the self-cheating limitation stated at **four normative sites** and AC-16 failing if any is missing. **The substantive finding is that R10's own reasoning did not survive** ([[D438]]) — *manufactured number vs record of what happened* contradicts this RFC's §1, and relocating the defect to **provenance** is what made it addressable. **A boss is a full game** ([[D439]]): a `position` session played to `terminalOutcome`, **Act II only** — and Act III, the climax, is the one act that cannot carry a result. **Six changes are owed to `design/06-campaign.md`, named and not written (law 5).** Open questions 11 and 12 newly opened; [[D420]]'s repair was itself incoherent and is re-fixed ([[D442]]), with the clock-closing simulation arm still **unrun** | — | **claims no pack lane, no run schema, no shape-entry** — the rating is a projection over the existing event log. One **migration position** (`STORAGE_VERSION + 1`), landing **behind `teacher-surface`**, create-table only with **no backfill** — and it now carries **two independent table sets**, making it the **fourth claim** on that position though only the third document ([[D423]] addendum). Glicko-2, argued from three repo numbers; 14 named refusals. **Flags that `docs/return-and-progression.md:48-49` currently forbids a learner rating** and asks for a scoped amendment at landing rather than making it |
| `assistance-controls.md` | **draft 2026-08-16 — and TWO OF THE THREE ROWS WERE NOT OWNER QUESTIONS AT ALL.** D307/D308/D309 were bucketed NEEDS-OWNER on their `DESIGN-GAP:` markers; read against `design/05`, two are **defects against a ruling that already shipped**. **D308**: §3a-i says `attempt_end` *"re-closes on the next committed move — the rule that stops a Just Play reveal becoming a live engine feed"*, and **a rule whose job is to bound a reveal presupposes the reveal is reachable**. Four layers implement it — runtime, `RunService.reveal`, the route, `RunApi.reveal` — and **the fifth never wired the switch**: `api.reveal` has exactly two client call sites, both in `App.svelte`, and `RunStateStore` has no `reveal` at all. **D309**: §3b says guided mode *is* the shape library rendered live and `SILENT_ASSISTANCE` sets `guided: "off"` — **the constant and the behaviour disagree**, because the live path reads no `assistance` value anywhere while the gated path is a strict subset. **D307 is split and its row is half wrong**: the defaults claim is a mis-diagnosis — §5 Q4 is marked **RESOLVED** (*"silence is the product's opinion"*), so six identically silent profiles **is** the ruling; only its permission half is genuinely owner-tier, which the row and `teacher-surface` both already say. **One genuine owner question remains and does not block**: does permission vary by session kind at all — priced three ways including *implement it properly*, because a fork offering only "keep the dead field or delete it" omits that option. **⚠ Coordinate: the implementer has `packages/runtime/src/assistance.ts` open** | — | **claims nothing versioned** — verified at HEAD: no lane, no migration position, no route, no error code, `AssistanceConfig.version` stays **4**. No collision with `teacher-surface` (adds two fields to `AssistanceContext`, touches neither existing fields nor the body — landing order free) or `live-marker-quality` (removes one block identified by its own guard expression; the 2026-08-16 *"for the duration of live play"* amendment read and honoured). **Criterion 5 fails at HEAD — that failure IS D309's fix**; criterion 11 is labelled a regression guard **that cannot fail today**, stated plainly so it is never scored as evidence ([[D444]], [[D451]]) |
| `rfc-lifecycle-completion.md` | **draft 2026-08-17 — RFC-2. Admits ONE state and ONE obligation, and visibly refuses three more.** Its admission rule: *a lifecycle state earns its place only when a **named reader takes a different action on it**; an obligation earns its place only when a **named reader can see it undischarged**.* Under it: **`awaiting` admitted** (three readers act differently, and `implementing` actively tells an implementer *there is code to write* when there is none); **`returned to author` refused** — its only reader asks *"may I build this?"* and the answer is identical to `draft`; **`blocked` refused**; and **a state for `engine-leverage`'s unsatisfiable criterion refused**, because RFC-0000 rule 3 already permits amending a not-yet-implemented RFC in place — RFC-1 routed that decision here and it **declined it explicitly**. **The unification that makes it one document: [[D433]] and [[D476]] are the same edge from its two ends** — if Y is blocked by X, Y carries a `## Discharges` row owned by X, and X's archival forces that row discharged or re-homed **mechanically, in the archiving commit**. **Corollary that places every clause: a rule goes where it is read at the moment it binds**, so the archiving clause amends the `"On completion:"` paragraph rather than §Rules. **Cost priced and net prose NEGATIVE** — five documents currently state the wave is unowned; one row replaces them | — | **claims nothing versioned.** Amends RFC-0000 §RFC lifecycle, §Rules (one new rule, [[D478]]) and §Planning docs; plus `rfc/template.md` and one `rfc/README.md` cell. **Numbering seam stated: RFC-1 takes rule 7, this takes 8; reversed if this lands first.** One instrument, no new script — six checks folded into the already-queued `tools/status-parity.mjs`, importing RFC-1's §Active parser per its *share the reader, not the rule*. **P6 is the check `5b65048` would have failed.** Lands `implementing → awaiting` carrying one `## Discharges` row, demonstrating its own mechanism on itself |
| `pack-population-provenance.md` | **draft 2026-08-17 — RFC-5, the largest of the seven, and its new evidence kind is the mechanism the owner's grounding ruling needs.** Through-line: *a pack may state a fact; the format has nowhere to put where the evidence for that fact lives, and nothing refuses a statement whose evidence cannot exist.* Measured over committed `content/`: **92 packs, all `draft`, 0 published; 68 ledgers, 893 records — and ZERO of either explorer kind** against **31 packs labelling 60 claims `corpus_observed`**. **Spot-check 8 of 8 at the symbol, and 3 of 8 rows carried a materially stale claim** — including [[D157]], whose own update is **false at HEAD** (it says a pack *"now carries the position census"*; the pack carries it as a **prose string** and has no `.evidence.json` at all). It also caught itself citing the **retracted** [[D506]] and rewrote both passages before shipping. **Two refusals it makes and argues**: a pack-side population field (the population already lives in the census record, validated against the manifest request URL — a copy would be validated against nothing), and a corpus basis for `deviationCost`. **A prose-scanning population check is refused too**, because *Classical* is a speed in 14 packs and an **opening name** in ≥6, so the false-positive rate is unboundable. **Found: `refusal-coverage.test.ts` has a `has()` helper and no negative counterpart**, so the suite structurally cannot express a negative fixture — criterion 3 adds `lacks()` | — | claims **pack schema 0.29** plus the **`citable_text` member of `EVIDENCE_KINDS`** — which is exactly what [[D530]]/[[D531]] need to reground the 13 principles from `authors_practice` to `chess_tradition`. No run lane, no shape-entry lane, no principle-entry lane, no migration; all five re-verified at the symbol. `tabiya-claims` carried **at landing, not now**, on law-1 grounds, matching `graduation-clearance`. Two `## Discharges` rows. **RFC-6 inherits pack 0.30** and the don't-copy refusal, which bites harder there because `$defs/structuralExpression` is duplicated across both schemas |
| `shared-resource-registers.md` | **draft 2026-08-16 — RFC-1 of the drafting queue, first because it is the only proposed document currently PRODUCING WRONG WORK.** No user consequence; three of four registers are wrong at HEAD and five of the other six proposed RFCs must claim a lane from them. **Rejected both offered mechanisms and split the register in two, because only one half is derivable:** the **landed** half is derived from the tree (`packages/schema/src/index.ts` already exports `schemaBuildInfo`, so half the join is machine-readable today), while the **claimed** half cannot be — pack 0.29 does not exist in the tree, so a purely tree-derived checker reports *"next free 0.28"* and is confidently wrong while `graduation-clearance` holds it. Claims are therefore **declared once** in a `tabiya-claims` block in the RFC that makes them, and `make register-check` joins the halves and fails on disagreement. **The mechanism is already accepted here** — `graduation-clearance` criterion 13 asserts set-equality between its transcribed enum and the shipped `EVIDENCE_KINDS` on verbatim this reasoning. **Found a SIXTH shared resource**: `PRINCIPLE_ENTRY_SCHEMA_VERSION`, unregistered **and** the only one of four with no test binding its constant to its `$id`. So: **six resources, two registers, four missing.** **Two checks are red at HEAD and the RFC says so** | — | **claims nothing versioned** — no schema lane, no migration position, no vocabulary member; criterion 9 asserts all six identifiers byte-identical across the landing. Deliberately does **not** generate `rfc/README.md` (it holds wave orders, pins and rationale that derive from nothing — *check, don't generate*), and deliberately leaves out both queued `make` targets: `status-parity` is lifecycle state not resource state, `work-index` has different inputs, join and failure shape. §7's rule: **share the reader, not the rule.** Removes every hand-written *"next free"* row — computed and printed, never stored, because **a fact you never write cannot go stale** |
| `feedback-delivery.md` | **accepted 2026-08-16 — lands in TWO STAGES, and does not archive on stage 1.** The owner ruling ([[D462]]) is *ship the surface, then run the binding wave before anyone plays*, and its three obligations were **mentioned in an open question and specified nowhere** until this pass. New §0 fixes that: **stage 1** ships the delivery surface, **stage 2** runs the wave, the RFC stays `implementing` between them, and **criterion 11's ledger flips move to stage 2's commit** so no row closes on a day-zero share. **Criterion 21 deliberately demands no percentage** — §3.2 establishes a permanent residue, so a share target would be unsatisfiable by construction; it demands a **named reason for every still-withheld claim**, in two forms, because `validateClaimBindings` **raises nothing for a claim with no binding** and an issue-code-only test would have been unsatisfiable for exactly the 98 claims the wave has not reached. The wave is priced as **three** kinds of work with the pack-edit population (**63 floor / 83 ceiling**) first-class, and because it changes pack bytes it is a **content wave** carrying that closeout. **One thing is left open and named: the binding wave has no owner** ([[D476]]) — `claim-backing` was named for it and then archived. That blocks **stage 2**, not acceptance. Criteria audited at HEAD: **2a passes vacuously** and is now recorded as `vacuous` rather than as a pass; **criterion 6's kill-gate instrument does not exist**; criterion 5's N=4/N=8 columns have no corpus source | — | **claims nothing versioned**, and takes **no migration position** — deliberately, so it does not join [[D423]]'s contest, now two-way after `opponent-contracts` landed. C7 turned out to have **already shipped** (`PackRecord.boundClaimIds` + `claimBackings`), so it adds no field to `PackRecord` at all |

**Three-draft wave, 2026-08-14** — claim order: `repertoire-gap-finding` first, then
`onramp-guard`, then `open-answer-grading`. Shared-resource claims (migrations, pack
schema, ownership pins) land in that order; a draft that cannot land behind its
predecessor renegotiates here.

**Four-draft wave, 2026-08-14** — claim order: `predicate-wave-2` first, then
`corpus-evidence`, `adoption-wave-1`, `social-match`. Shared-resource claims (pack
schema, migrations, ownership pins) land in that order; a draft that cannot land
behind its predecessor renegotiates here.

**Three-draft wave, 2026-08-14 (second)** — claim order: `polish-surfaces` first, then
`orphan-completion`, then `grounding-pair`. Shared-resource claims (migrations, pack
schema, ownership pins) land in that order; a draft that cannot land behind its
predecessor renegotiates here.

The completed breadth batch and its dependency history are kept in the archive
documents and planning logs rather than duplicated in this index.

## Pack-schema-version register

Instituted 2026-08-13 after `pack-studio.md` (then named `pack-studio-and-review.md`) and
`return-and-progression.md` were
both drafted claiming pack schema **0.6**. `DRILL_PACK_SCHEMA_VERSION`
(`packages/schema/src/index.ts:2`) and `schemas/drill_pack.schema.json`'s `$id` are a **shared,
single-writer resource** for exactly the reason a migration number is; claim here before
writing a version into a draft. Unlike a migration, a pack version rebases cheaply — pack
digests are content digests and are unaffected by the `$id`
(`packages/schema/src/drill-pack/digest.ts:58-66`) — so the cost of a collision is a stalled
landing order, not lost data.

| Pack schema | Owner RFC | Status |
|---|---|---|
| 0.3 | `archive/outcome-drill-grading.md` | implemented — `objective.grading`, closed `successConditions` union, closed `objective` |
| 0.4 | `archive/line-drill-theory-grading.md` | implemented — `follow_theory`, the `atAuthoredBoundary` trigger |
| 0.5 | `archive/defect-sweep.md` | implemented — required `start.side`, vocabulary-constant collapse |
| 0.6 | `archive/return-and-progression.md` | implemented — `retryVariants`, typed `concepts` |
| 0.7 | `archive/trajectory-drill.md` | implemented — `legs`, `run_trajectory` |
| 0.8 | `archive/pack-studio.md` | implemented — source-derived channel; `provenance.reviewStatus` narrowed to `schema_example \| draft \| published`; typed `reviewers` removed |
| 0.9 | `archive/n-way-comparison.md` | implemented — prediction `grading` removed; numbers are recorded and rendered without a verdict |
| 0.10 | `archive/structural-reading.md` | implemented 2026-08-13, draft — `$defs/structuralFeature` and `$defs/structuralExpression`, a fourth `fenPredicate` variant, a fifth `successCondition` kind (`structural_feature`), `$defs/file`. No migration: rung-0 facts are never persisted |
| 0.11 | `archive/shape-library.md` | implemented — additive only: optional top-level `shapes` (referenced shape-entry ids) and optional `planClass.shapePlan`. `planClasses` stays fully valid; no committed digest moves (the `$id` is not part of any pack document) |
| 0.12 | `archive/defect-batch-2.md` | implemented — tightening only: `$defs/opponentPolicy` gets `additionalProperties: false` (D22); all committed packs and fixtures validate unchanged; no committed digest moves |
| 0.13 | `archive/predicate-wave-2.md` | implemented — additive: `structuralFeature` gains `bishop_on_shade`, `pawn_count` and `king_opposition`; `structuralExpression` gains `mirrored` and `quantified`; shape-entry schema 0.1 → 0.2 with the same duplicated grammar. No migration; rung-0 facts remain derived |
| 0.14 | `archive/onramp-guard.md` | implemented — additive: `feedbackPolicy` enum gains `immediate_guard`; optional top-level `guard` tuning block |
| 0.15 | `archive/open-answer-grading.md` | implemented — additive: checkpoint `interaction` union gains `stated_reasoning` with grounded key points (closed four-kind union); reconciled behind 0.14 |
| 0.16 | `archive/authoring-frictions.md` | implemented — additive/widening only: `deviationLocation` gains `{atStart}`, `simpleTrigger` gains `atStart`, new `variantOf` (three directional relations), `branchLengthTarget` max 20→40, guard gains `fireOnMate`/`rulesTier`/`window`/`overrides`, `rules_fact` enum gains `draw`, tablebase category enum widens to five determinate values. All committed content remains valid; no content digest moved |
| `archive/expression-census.md` | implemented | `docs/development.md` (the `make expression-census` target) — restored 2026-08-15 by the reconciliation gate, which found `4a893dc` removed its Active row and added no Archive row, so the RFC existed in neither table |
| 0.17 | `archive/tempo-vocabulary.md` | implemented — a timing window is a branch-local ledger: commitment opening, ordered closes, move-set readiness/tolerance, luxury spend, seven verdicts, authored `outpaced` control, and `tempo:` applied evidence. Additive plus removal of the unused checkpoint-local point-pair form; no committed content digest moved |
| 0.18 | `archive/predicate-wave-3.md` | implemented — additive: `plan_consequence` success-condition kind, `king_zone`, `piece_distance`, `piece_count`, `pack.shapes` relation `present`/`prospective`. Ships `pawn_count` and `piece_reach_count scope:"every"` as deprecation WARNINGS (schema removal deferred to wave 4 because `registered_shapes` rows are immutable) |
| 0.20 | `archive/opening-evidence-path.md` | implemented — additive: `$defs/objectiveGrading.assessedBy` gains a third `oneOf` member `kind: "engine"`. Retires `VERIFY_ASSESSMENT_NOT_SYZYGY`; narrows `OBJECTIVE_GRADING_UNSUPPORTED` to legs |
| 0.21 | `archive/deviation-classes.md` | implemented — additive: `mistake` (`plan\|timing\|tactical`) and `cost` on `$defs/deviation`, `moveUci` on `guard.overrides[]`. Ships `cost` author-declared and UNBACKED per the 2026-08-15 coordinator ruling |
| 0.22 | `archive/transition-primitives.md` | implemented — additive: an eighth `successCondition` arm `transition_feature`, a `transitionFeature` `ObjectivePredicate` member, six transition leaves and a `position` bridge node. Widens `RULES_EVIDENCE_FACTS` by six (verified migration-free as a *mechanism* — refs are bare strings, no schema enum). **0.19 is frozen shut**, not free |
| 0.23 | `archive/engine-leverage.md` | implemented 2026-08-20 closeout — `guard.conditions[]`, `$defs/engineCondition`, a fourth `deviationCost` arm; landed at `18d2832` plus `b65bd4e` |
| 0.24 | `archive/vocabulary-wiring.md` | implemented 2026-08-20 closeout — `plan_signature` leaf on `$defs/structuralExpression`, deprecating `plan_consequence`; landed at `caa8afa` plus `e9695cf` |
| 0.25 | `archive/format-surface.md` | implemented 2026-08-16 — per-leg `opponentPolicy` and `shapes` on `$defs/trajectoryLeg` (D96); `$defs/legOpponentPolicy`; `$defs/shapeReference` extracted; `retryVariants` warning and schema-owned dispositions. No run-schema change, no migration |
| 0.26 | `archive/claim-backing.md` | implemented 2026-08-16 — optional ledger-side `claimBindings` key prose by claim id plus text digest, direct prose support is refused, explorer attachment preserves pack bytes, and `feedbackClaim.principles` resolves against the official principle-entry 0.1 registry. `$defs/feedbackClaim` is closed. The content migration linked 82 author-principle claims to 12 used entries and refreshed affected ledger digests; one real Philidor claim is now tablebase-bound without changing its prose |
| 0.27 | `archive/pack-graduation.md` | implemented 2026-08-16 — `provenance.graduationBlockers` entries become objects with `blocking`/`resolved`/`accepted` state, and `provenance` closes `additionalProperties` on its five attested keys. The graduation report, two-root corpus gates, and move-not-copy resolution are executable; the landing corpus honestly has no graduable pack |
| 0.28 | `graduation-clearance.md` | **claimed and held; the RFC is ACCEPTED 2026-08-17** (third author round; D464–D467 and [[D503]] all resolved at named symbols). *Corrected 2026-08-17 — this cell still read "a draft returned to author" while the Active row read `accepted`, which is [[D477]]'s class live inside the register, found by the RFC-5 draft.* No migration, run-schema, or shape-entry claim |
| — | **0.29 is the next free pack lane** | recorded 2026-08-15 after a cross-review found three drafts holding lanes with no register rows — the exact collision class this register exists to prevent  **Corrected 2026-08-16 ([[D461]]): this row still read `0.28` four lines below the row claiming and keeping it, and two Active rows repeated the stale half — the register contradicting itself inside four lines, which is the collision class it exists to prevent.** |

Landing order follows the numbers. A draft that cannot land behind its
predecessor renegotiates here rather than renumbering unilaterally.

**Content-sourcing split, 2026-08-12.** An adversarial review rejected the single
`content-sourcing-pipelines.md` draft and recommended a four-way split; the draft
is deleted, not stubbed, and its content is fully rehomed. **B6a is the
foundation and the other three name it in `Depends on:`** — it ships the artifact
triple (`pack.json` / `evidence.json` / `sources.json`), the fetch manifest, the
deterministic-output rule, the licence and attribution encoding required by the
2026-08-12 content-rights ruling, the `sourcing-check` gate, and the
`chess-openings` line skeleton. The batch landed **B6a → B6b → B6c → B6d**
(reasoning in `archive/content-sourcing-foundation.md` §6). B6d is a **redesign**, not a
rehome: the withdrawn §5 asked the learner to solve the tactic, which
`design/00-thesis.md:70,93-94` rejects.


**Exploration gate opened by owner ruling 2026-08-12** (logged in
`planning/exploration/log.md`): E1 met, E2 advisory, E3/E4/E5 accepted as in-flight
risk with their experiments folded into implementation. Previously: The repo is in the exploratory phase.
The first experimental vertical-slice RFC may be drafted only after the
exploration-to-slice gate in `planning/exploration/gates.md` passes, or an owner ruling
(logged in `planning/exploration/log.md`) opens it early. Product RFCs remain closed until
the slice passes the later continuation gates. See the "Exploration gate" section of
`0000-rfc-process.md`.

**Breadth sequencing ruling, 2026-08-11:** the owner opened design and RFC
planning for the complete B1–B8 product surface in
`design/03-product-breadth.md`. This does not waive RFC review or authorize
unspecified implementation; it supersedes the assumption that the next work is
content for one narrow slice. Breadth RFCs must preserve the global shell and
name the B-gates they complete before code begins.

## Migration register

Instituted 2026-08-12 after two RFCs drafted in parallel both claimed database
migration 2 and `STORAGE_VERSION` 1→2, so neither could land independently. A
migration number is a **shared, single-writer resource**; claim it here before
writing it into a draft.

| Migration | `STORAGE_VERSION` | Owner RFC | Status |
|---|---|---|---|
| 1 | 0→1 | shipped | implemented; **body** rewritten by `archive/pack-optional-runs.md` §8 to stop replaying through `projectRun` (no version change, no new number) |
| 2 | 1→2 | `archive/learner-identity-and-authorization.md` | implemented |
| 3 | 2→3 | `archive/pack-optional-runs.md` | implemented after migration 2 |
| 4 | 3→4 | `archive/terminal-outcome-events.md` | implemented; upgrades ordinary v0.5 snapshots and quarantines pre-producer outcome events. Its body is frozen to literal `"0.6"` by `archive/line-drill-theory-grading.md` §11b so later schema constants cannot mis-stamp rows before migration 5 |
| 5 | 4→5 | `archive/line-drill-theory-grading.md` | implemented — run schema v0.7; adds `policyModeApplied` to `opponent.move_selected.selection`, historical selections migrate to `unknown` and are never inferred |
| 6 | 5→6 | `archive/return-and-progression.md` | implemented — attempts, schedules, progress and position statistics; create-table/index plus one-time backfill. Body corrected 2026-08-16: the backfill selects only the frozen `schema_version = '0.7'`, so quarantined pre-0.5 rows never enter `projectAttempts`. |
| 7 | 6→7 | `archive/pack-studio.md` | implemented — studio drafts, retained playtest bytes, and registered packs |
| 8 | 7→8 | `archive/n-way-comparison.md` | implemented — run schema v0.8, branch origin and prediction event |
| 9 | 8→9 | `archive/live-session-platform.md` | implemented — live-session tables; create-table/index only |
| 10 | 9→10 | `archive/shape-library.md` | implemented — `shape_drafts` and `registered_shapes`; create-table/index plus the pack-style account-deletion tombstone. Run schema stays 0.8 by design (firings are derived projections, never events) |
| 11 | 10→11 | `archive/branch-groups.md` | implemented — run schema v0.9: adds the `group.created` event and widens `policyModeApplied` with `enumerated`. Stamp-only body (frozen literals `"0.8"`→`"0.9"`, no data rewrite exists to do); mandatory because reads filter on the current run-schema version |
| 12 | 11→12 | `archive/game-import-and-story.md` | implemented — run schema v0.10: `sessionKind` gains `imported` (non-pack projection rules unchanged). Creates `imported_games` (one row per imported run: source kind/url, movetext digest, headers, original PGN bytes, licence note) plus the pack-style account-deletion tombstone, and stamps frozen literals `"0.9"`→`"0.10"` (no data rewrite). Landed behind implemented migration 11 |
| 13 | 12→13 | `archive/adoption-wave-1.md` | implemented — creates `public_tokens` + `run_derivations`; literal CHECK strings per the migration-9 freeze lesson |
| 14 | 13→14 | `archive/social-match.md` | implemented — creates `match_states`; rebuilds `live_sessions`, `session_journal`, and `public_tokens` with widened closed vocabularies; no run/pack schema change. Landed behind implemented migration 13 |
| 15 | 14→15 | `archive/repertoire-gap-finding.md` | implemented — creates `repertoires`, `repertoire_moves`, `repertoire_scans`, `repertoire_gap_runs`; create-table/index only, no backfill or rebuild; no run/pack schema change |
| 16 | 15→16 | `archive/onramp-guard.md` | implemented — stamp-only: run schema `"0.10"`→`"0.11"` (`RunFeedbackPolicy` gains `immediate_guard`; no new event type, no data rewrite). Rebased from an initial 15 claim behind `repertoire-gap-finding`'s wave claim #1 |
| 17 | 16→17 | `archive/open-answer-grading.md` | implemented — **stamp-only, no table** (transcripts are run events; run deletion is the retention story); run schema 0.11→**0.12** (`reasoning.recorded` event). Reconciled behind onramp-guard per the pinned wave order |
| 18 | 17→18 | `archive/grounding-pair.md` | implemented — stamp-only: run schema 0.12→**0.13** (`RunOpponentMode`/`PolicyModeApplied` gain `perfect_tablebase`; no new event type, no data rewrite) |
| 19 | 18→19 | `archive/resistance-spectrum.md` | implemented — stamp-only: run schema 0.13→**0.14** (`practical_resistance` applied-record widenings, `eloHonored`/`eloApplied`). No data rewrite; historical group-journal rows compare equal |
| 20 | 19→20 | `archive/engine-request-contract.md` | implemented — stamp-only: run schema 0.14→**0.15** (`SelectionCandidate.offWindow`); D60's narrowing mechanism ships but D60 remains open pending R10 |
**MIGRATION NUMBERS ARE ASSIGNED AT LANDING, NOT AT CLAIM — instituted 2026-08-16, and this
register was wrong until now.** `storage.ts` migrates with `if (migration.version <= version)
continue`, so **a database that reaches N skips every migration numbered below N that lands
afterwards, silently and permanently.** A claimed-but-unlanded number is therefore not a
reservation; it is a hole that the next migration to land will seal shut. Claude created
exactly that hazard on 2026-08-16 by telling `board-annotation` to claim **23** while **22**
(`teacher-surface`) was claimed, owner-blocked and unlanded — its cross-review caught it.

**The rule:** a draft claims a **position in the landing order**, never a number. The number is
taken when the migration actually lands, and it is always `STORAGE_VERSION + 1`. The rows below
record order and history; a row for an unlanded migration is a *claim on the next free slot at
its turn*, not on the integer printed in it. **An implementer who finds the next contiguous
number already taken renegotiates here rather than skipping.** The earlier 21/22 reassignment
was sound for the same reason — the draft that could not land is the one that moved.

| 21 | 20→21 | `archive/engine-leverage.md` | **implemented 2026-08-20 closeout** — landed at `18d2832`; stamp-only run schema 0.15→**0.16**. **Reassigned from 22.** Migration body uses frozen literals, never the moving schema constant |
| 22 | 21→22 | `archive/board-annotation.md` | **implemented 2026-08-16** — creates `run_marks` plus two indexes; create-table/index only, no snapshot rewrite and no run-schema change. `teacher-surface` remains unlanded and therefore takes the next contiguous number at its turn |
| 23 | 22→23 | `archive/opponent-contracts.md` | **implemented 2026-08-16** at `6ba0736`, independently approved and archived after the A10 correction plus D452–D458 follow-ups. Stamp-only run schema 0.16→**0.17**; optional `OpponentSelection.orderingBasis`, historical selections remain absent and are never inferred. Body uses frozen literals. **D457 remains open** pending a newly retained precise-DTZ corpus |

A migration's *number* is the shared resource, but its *body* is shared too: an
already-applied migration still runs on databases that never reached it, so a
schema change can break a migration it did not touch. Record body edits here as
well.

**F3 landed before F2**, decided 2026-08-12 on three grounds: D1 was a
live defect (a run link is a write credential) and the deployment ruling is
hosted multi-user, so identity is a prerequisite to exposing anything at all;
F2's v0.4 snapshot quarantine is simpler to write once ownership columns exist
than the reverse; and F2 is the riskier change (`RunService.create` becomes
async across ~15 call sites), so it should not also carry the migration that
another draft depends on. F2 therefore rebased its migration to 3 and recorded
the dependency explicitly.

Any RFC touching persisted shape adds its row here in the same commit that
drafts the migration.

## Cross-draft ownership pins

Instituted 2026-08-14 after `archive/shape-library.md` and `adaptive-guidance.md`, drafted in
parallel, **both** scoped the minimal Just Play position player — the register-collision
class on an implementation surface instead of a number. Pin: **`archive/shape-library.md` owns the
position player** (it scoped it concretely as its largest surface, and its acceptance test
cannot exist without it); `adaptive-guidance.md` names it in `Depends on:` and ships no
client entry of its own. Landing order follows: shape-library before adaptive-guidance.

Pin, 2026-08-14 (parallel wave): **`archive/adoption-wave-1.md` owns the `public_tokens` table** —
the single trust surface for anonymous capability tokens (hashed 32-byte tokens, closed
typed `scope` CHECK, per-token revocation, uniform 404 non-disclosure, creator-cascade
deletion). `archive/social-match.md` (friend-link tokens, same trust surface) adds its
scopes by widening the CHECK in migration 14, names `archive/adoption-wave-1.md` in
`Depends on:`, and creates no second token table.

## Withdrawn

Kept for the record (RFC-0000: `withdrawn` = abandoned, not superseded). Their
findings are salvaged into content-era BACKLOG rows — read the withdrawal notes
before re-attempting this territory.

| RFC | Why |
|---|---|
| `withdrawn/authoring-contracts-v03.md` | Specified an authored vocabulary with no authored content to design against; three reviews, three variations of that fault |
| `withdrawn/evidence-composer.md` | Prerequisite withdrawn; the packet abstraction proved unnecessary for v1 |

## Archive

| RFC | Status | Canonical docs link |
|---|---|---|
| `archive/branch-runtime.md` | implemented | `docs/branch-runtime.md` |
| `archive/drill-pack-format.md` | implemented | `docs/drill-pack-format.md` |
| `archive/engine-workers.md` | implemented | `docs/engine-workers.md` |
| `archive/drill-client.md` | implemented | `docs/drill-client.md` |
| `archive/app-shell.md` | implemented | `docs/app-shell.md` |
| `archive/explanation-grounds.md` | implemented | `docs/explanation-grounds.md` |
| `archive/authored-feedback-delivery.md` | implemented | `docs/drill-client.md`, `docs/drill-pack-format.md` |
| `archive/authored-explanation-surface.md` | implemented | `docs/explanation-grounds.md` |
| `archive/learner-identity-and-authorization.md` | implemented | `docs/identity-and-authorization.md`, `docs/branch-runtime.md` |
| `archive/pack-optional-runs.md` | implemented | `docs/branch-runtime.md`, `docs/drill-client.md` |
| `archive/terminal-outcome-events.md` | implemented | `docs/branch-runtime.md`, `docs/drill-client.md`, `docs/explanation-grounds.md` |
| `archive/content-sourcing-foundation.md` | implemented | `docs/content-sourcing.md` |
| `archive/content-sourcing-syzygy.md` | implemented | `docs/content-sourcing.md` |
| `archive/content-sourcing-explorer.md` | implemented | `docs/content-sourcing.md` |
| `archive/content-sourcing-position-seeds.md` | implemented | `docs/content-sourcing.md` |
| `archive/outcome-drill-grading.md` | implemented | `docs/outcome-drill-grading.md`, `docs/drill-pack-format.md`, `docs/branch-runtime.md`, `docs/drill-client.md`, `docs/content-sourcing.md` |
| `archive/line-drill-theory-grading.md` | implemented | `docs/drill-pack-format.md`, `docs/branch-runtime.md`, `docs/engine-workers.md`, `docs/drill-client.md`, `docs/explanation-grounds.md`, `docs/outcome-drill-grading.md` |
| `archive/defect-sweep.md` | implemented | `docs/drill-pack-format.md`, `docs/drill-client.md`, `docs/engine-workers.md`, `docs/development.md`, `docs/content-sourcing.md`, `docs/outcome-drill-grading.md` |
| `archive/return-and-progression.md` | implemented | `docs/return-and-progression.md`, `docs/drill-pack-format.md`, `docs/app-shell.md` |
| `archive/trajectory-drill.md` | implemented | `docs/trajectory-drill.md`, `docs/drill-pack-format.md`, `docs/branch-runtime.md`, `docs/drill-client.md` |
| `archive/pack-studio.md` | implemented | `docs/pack-studio.md`, `docs/drill-pack-format.md`, `docs/app-shell.md` |
| `archive/n-way-comparison.md` | implemented | `docs/n-way-comparison.md`, `docs/branch-runtime.md`, `docs/explanation-grounds.md`, `docs/drill-pack-format.md` |
| `archive/live-session-platform.md` | implemented | `docs/live-sessions.md`, `docs/identity-and-authorization.md`, `docs/app-shell.md` |
| `archive/shape-library.md` | implemented | `docs/shape-library.md`, `docs/drill-pack-format.md`, `docs/drill-client.md`, `docs/pack-studio.md` |
| `archive/adaptive-guidance.md` | implemented | `docs/adaptive-guidance.md`, `docs/explanation-grounds.md`, `docs/app-shell.md` |
| `archive/defect-batch-2.md` | implemented | `docs/branch-runtime.md`, `docs/drill-pack-format.md`, `docs/structural-reading.md` |
| `archive/branch-groups.md` | implemented | `docs/branch-groups.md`, `docs/branch-runtime.md`, `docs/engine-workers.md`, `docs/drill-client.md` |
| `archive/game-import-and-story.md` | implemented | `docs/game-import-and-story.md`, `docs/branch-runtime.md` |
| `archive/predicate-wave-2.md` | implemented | `docs/structural-reading.md`, `docs/drill-pack-format.md`, `docs/shape-library.md`, `docs/explanation-grounds.md` |
| `archive/runtime-corpus-evidence.md` | implemented | `docs/runtime-corpus-evidence.md`, `docs/adaptive-guidance.md`, `docs/explanation-grounds.md`, `docs/branch-groups.md` |
| `archive/adoption-wave-1.md` | implemented | `docs/adoption-wave-1.md`, `docs/game-import-and-story.md`, `docs/adaptive-guidance.md`, `docs/return-and-progression.md`, `docs/live-sessions.md` |
| `archive/social-match.md` | implemented | `docs/live-sessions.md`, `docs/identity-and-authorization.md`, `docs/app-shell.md` |
| `archive/repertoire-gap-finding.md` | implemented | `docs/repertoire-gap-finding.md`, `docs/runtime-corpus-evidence.md`, `docs/return-and-progression.md` |
| `archive/onramp-guard.md` | implemented | `docs/drill-pack-format.md`, `docs/drill-client.md`, `docs/branch-runtime.md`, `docs/explanation-grounds.md`, `docs/outcome-drill-grading.md`, `docs/trajectory-drill.md`, `docs/adaptive-guidance.md` |
| `archive/open-answer-grading.md` | implemented | `docs/open-answer-grading.md`, `docs/drill-pack-format.md`, `docs/drill-client.md`, `docs/explanation-grounds.md` |
| `archive/board-annotation.md` | implemented | `docs/board-annotation.md`, `docs/live-sessions.md`, `docs/branch-runtime.md` |
| `archive/polish-surfaces.md` | implemented | `docs/app-shell.md`, `docs/adaptive-guidance.md` |
| `archive/orphan-completion.md` | implemented | `docs/n-way-comparison.md`, `docs/pack-studio.md`, `docs/return-and-progression.md` |
| `archive/grounding-pair.md` | implemented | `docs/tablebase-grounding.md`, `docs/content-sourcing.md`, `docs/engine-workers.md`, `docs/outcome-drill-grading.md` |
| `archive/authoring-frictions.md` | implemented | `docs/drill-pack-format.md`, `docs/tablebase-grounding.md`, `docs/content-sourcing.md`, `docs/outcome-drill-grading.md`, `docs/branch-runtime.md`, `docs/development.md` |
| `archive/validator-integrity.md` | implemented | `docs/drill-pack-format.md`, `docs/trajectory-drill.md`, `docs/outcome-drill-grading.md` |
| `archive/tempo-vocabulary.md` | implemented | `docs/drill-pack-format.md`, `docs/drill-client.md`, `docs/branch-runtime.md`, `docs/explanation-grounds.md`, `docs/outcome-drill-grading.md`, `docs/structural-reading.md` |
| `archive/resistance-spectrum.md` | implemented | `docs/engine-workers.md`, `docs/outcome-drill-grading.md`, `docs/branch-runtime.md`, `docs/drill-pack-format.md` |
| `archive/predicate-wave-3.md` | implemented | `docs/structural-reading.md`, `docs/drill-pack-format.md`, `docs/shape-library.md`, `docs/explanation-grounds.md` |
| `archive/opening-evidence-path.md` | implemented | `docs/engine-grounding.md`, `docs/content-sourcing.md`, `docs/tablebase-grounding.md`, `docs/drill-pack-format.md` |
| `archive/branch-set-scale.md` | implemented | `docs/branch-set-scale.md`, `docs/n-way-comparison.md`, `docs/branch-groups.md` |
| `archive/deviation-classes.md` | implemented | `docs/drill-pack-format.md`, `docs/drill-client.md` |
| `archive/engine-request-contract.md` | implemented | `docs/engine-workers.md`, `docs/branch-runtime.md`, `workers/maia/README.md` |
| `archive/fixture-realism.md` | implemented | `docs/development.md`, `docs/tablebase-grounding.md`, `docs/content-sourcing.md` |
| `archive/client-surface-floor.md` | implemented | `docs/app-shell.md` |
| `archive/live-surface-honesty.md` | implemented | `docs/live-sessions.md`, `docs/adaptive-guidance.md` |
| `archive/pack-graduation.md` | implemented | `docs/pack-graduation.md`, `docs/drill-pack-format.md` |
| `archive/evidence-at-runtime.md` | implemented | `docs/recorded-evidence.md`, `docs/explanation-grounds.md` |
| `archive/opponent-contracts.md` | implemented | `docs/engine-workers.md`, `docs/tablebase-grounding.md`, `docs/branch-runtime.md` |
| `archive/live-marker-quality.md` | implemented | `docs/adaptive-guidance.md` |
| `archive/dead-vocabulary.md` | implemented | `docs/expression-census.md` |
| `archive/engine-leverage.md` | implemented | `docs/engine-workers.md`, `docs/content-sourcing.md`, `docs/drill-pack-format.md`, `docs/explanation-grounds.md` |
| `archive/vocabulary-wiring.md` | implemented | `docs/drill-pack-format.md`, `docs/structural-reading.md` |

## The archive sketches are quarry, not RFCs

`archive/brief-v2/rfcs/RFC-0001..0008` and `archive/brief-v2/adrs/ADR-0001..0006` are
pre-validation decision sketches from the brief. They are design-tier material: future
real RFCs mine them for content and cite them, but nothing in `archive/` has RFC status.
Their topics are tracked as rows in `design/BACKLOG.md`; the ADR decisions are tracked
in that file's Provisional decisions table with revisit triggers.

## Deferred decisions register

Decisions deliberately punted, each with a named owner so defaults are not chosen
silently later.

| Deferred decision | Origin | Owner | Why it matters |
|---|---|---|---|
| Server language | ✅ resolved 2026-08-12: **TS core + Go workers** doctrine (chess-semantics code is TS/shared runtime; self-contained data-format workers are Go; Python only inside Maia sidecar containers) | — | `design/research/stack-selection.md` |
| Client framework | ✅ resolved 2026-08-12: **Svelte 5** + Vite | — | `design/research/stack-selection.md` |
| Client routing | ✅ resolved 2026-08-11: **hand-rolled history-API router** (~100 lines); no SvelteKit migration, no routing dependency | — | `rfc/archive/app-shell.md` AS-C5 |
| SQLite vs PostgreSQL for runs/branches | ✅ resolved 2026-08-12: **SQLite ratified**. PostgreSQL remains a bounded follow-up for multi-host deployment or demonstrated write contention. Ruling and proposal: `planning/archive/branch-runtime/log.md` | — | `docs/branch-runtime.md` |
| Source model, deployment, monetization, and content/data rights | exploration Q2 | Marco | Gates public release; GPL/AGPL obligations constrain combinations but do not prohibit charging |
