# The deferral inventory — every place scope was cut, and where it was supposed to land

**Run:** 2026-08-23, at HEAD `f4d9be1`, by claude, on the owner's question about **hidden
deferrals** — *features that look accepted but were quietly scoped down, so the product reads as
near-1.0 while carrying holes.*

**Corpus:** all **96** RFC documents — `rfc/*.md` (24 active, excluding `README.md` and
`template.md`) plus `rfc/archive/*.md` (72 implemented/superseded). Every file was read in full.
`rfc/withdrawn/` (2 files) is outside the mandate and is not counted.

**What was extracted.** Five classes of scope cut, per `rfc/template.md`'s own section grammar:

| class | where it lives | rows found |
|---|---|---|
| **Discharges rows** — by definition an obligation that survives acceptance | `## Discharges` | **94** (52 open, 42 discharged) |
| **Scope statements** — "out of scope", "not in v1", "deferred", "left to", "a later RFC" | anywhere in the body | **785** |
| **Open questions** left registered at acceptance | `## Open questions` | **223** |
| **Deviations** that narrow or drop something relative to `design/` | `## Deviations from design` | **129** |
| **Weakened criteria** — narrowed, softened or made vacuous during review | `## Changelog` | **69** |
| | **total recorded scope cuts** | **1,300** |

**Method.** Discharges tables were parsed mechanically (uniform 5-column schema across all 27 RFCs
that carry one). The prose classes were extracted by five parallel full-read passes, one per
20-file chunk, into a fixed seven-field row: source RFC, section anchor, kind, what was cut, owner,
destination, surface. Destination existence was then checked against the filesystem at HEAD, and
`OWNER`-owned rows were joined against `planning/platform-alignment/decision-queue.md` by D-id.
The row corpus is reproducible; the classifier's boundary calls are stated where they matter.

**Two structural facts that frame everything below.**

1. **The `## Discharges` mechanism postdates two thirds of the corpus.** It was introduced by
   `archive/rfc-lifecycle-completion.md` §3 (created 2026-08-17, implemented 2026-08-21). **64 of
   the 96 RFCs carry no `## Discharges` section at all** — every one of them archived as
   `implemented` before the convention existed. Whatever those 64 deferred is recorded only as
   prose, and nothing in the repo tracks prose. All 24 active RFCs do carry one.
2. **Nothing in the repo audits the reverse join.** `make work-index` audits *ledger row → lane*.
   Nothing audits *RFC deferral → destination*. `refused-vs-asked.md` §7.1 names this exact
   asymmetry: *"the repo proves every engine option has a disposition and never proves a product
   disposition has an owner."* This document is the first complete pass of that join.

---

## 1. The four counts

| # | question | answer |
|---|---|---|
| **1** | Deferrals with **no destination at all** | **539** of 1,206 prose rows — **45%**. (All 94 Discharges rows name a destination; the register works. The prose does not.) |
| **2** | Deferrals owned by **`OWNER`** that are in **no decision queue** | **163** — 152 of 153 prose rows plus **11 of 11** open `OWNER` Discharges rows. Exactly **one** OWNER-owned prose deferral cites a D-id that `decision-queue.md` holds. |
| **3** | Deferrals whose **destination is a document that does not exist** | **167** — 154 prose rows plus 13 Discharges rows. |
| **4** | Per-surface depth | §6. Ranked; `evidence-platform` 261, `content-packs` 169, `authoring` 158, `drill-loop` 128. |

**Count 3 is the owner's defect, stated exactly.** 167 scope cuts point at a named artifact — an
RFC, an amendment, a matrix, a wave, a ledger row — that **does not exist at HEAD and is on no
queue that would create it**. Sixty-seven of them point at the literal phrase *"a future RFC"*
with no name at all. These are flagged first, in §2.

**A caution on count 1 that does not soften it.** Some of the 539 are principled permanent
refusals — *"no 3D boards"*, *"no LLM-generated lessons"*, *"no weakened Stockfish"* — and those
are the product working. But **the format has no field that distinguishes a permanent refusal from
a deferral nobody scheduled**, so the 539 cannot be split by any instrument. A reader cannot tell
which half a row is in without re-deriving the author's intent. That indistinguishability *is* the
finding: `refused-vs-asked.md` §Addendum ([[D1045]]) already measured the mechanical incentive —
`assertAdvertisedCapabilityDispositions` demands an experiment for every `unmeasured` row and
**nothing at all** for a `refused` one, making "file it as a refusal" the cheapest way to make a
question disappear.

---

## 2. Deferrals pointing at a document that does not exist — 167

### 2.1 The named artifacts, verified absent at HEAD

Each of these is named by an RFC as the place its deferred work lands. Each was checked against the
filesystem. **None exists.**

| named destination | cited by | verified state |
|---|---|---|
| *"a future RFC"* / *"a later RFC"* (unnamed) | 67 rows across 34 RFCs | no name, therefore no file, therefore no queue entry |
| **the grade-family RFC** | `learner-modules` §5, §5.5, OQ3, Discharge D3; `move-quality-grades` D1 | `rfc/grade-family.md` absent; zero inbound references outside the RFCs that defer to it |
| **the Review Map RFC** (D928) | `review-evidence-compiler` §5, §6, D1, OQ; `move-quality-grades` OQ2; `archive/semantic-evidence-selection` §12 | `rfc/review-map.md` absent; F6 has a planning dir (`review-map/`) and no RFC |
| **the Review-successor RFC** | `semantic-collectors` Motivation, D2 | absent; `review-evidence-compiler` is a draft precursor, not the successor |
| **the Phase-B live RFC** (D957) | `live-sources` §2, §6, OQ2, D1 | absent; `planning/live-sources/` holds only `rfc-derivation.md` |
| **the campaign v2 amendment** (D1/D2/D3/D4) | `campaign-core` Discharges D1, D2, D4; §3.5; `theming` D2 | absent; `planning/campaign/` holds `plan.md` + `rfc-derivation.md`, neither an amendment |
| **the future personalization RFC** | `intent-presets` §6, Discharge D2 | absent and unnamed |
| **predicate wave 4** | `archive/predicate-wave-3` §1a, §7 F7, OQ4, OQ10 | `rfc/predicate-wave-4.md` absent; the wave series stopped at 3 |
| **the trajectory-transitions RFC** | `archive/drill-pack-format` Motivation, OQ1 | absent |
| **`trajectory-per-leg-resistance`** (pack lane 0.19) | `archive/validator-integrity` §5 | absent |
| **the intent_capture grading RFC** | `archive/authoring-frictions` §3, OQ6; `archive/predicate-wave-3` §Scope | absent |
| **`content-sourcing-offline-explorer.md`** | `archive/content-sourcing-explorer` §5 | the RFC itself writes *"(unwritten)"* |
| **RFC-6 / shape-layer-parity** | `pack-population-provenance` Motivation | absent |
| **compare-geometry** | `archive/client-surface-floor` §8 | the RFC itself writes *"rfc/compare-geometry.md does not exist"* |
| **the F7 sacrificial-pilot matrix** | `pack-capability-contract` Discharge D2, Motivation | absent; F7 has no RFC |
| **F4 / F6 / F9 / F11 / F12** capability nodes | 43 rows | **five of twelve capability nodes in `rfc-graph.md` have no RFC at all**; F4, F6, F9 and F12 have planning dirs and nothing else |
| **"the content wave"** | `semantic-collectors` D4; `graduation-clearance` OQ3, OQ5; `measurement-records` §8; `feedback-delivery` §0.2 | no content wave is commissioned; `planning/content-era/log.md` records none pending |
| **proposed ledger rows D533 / D957 / D958 / D959 / D1075** | 5 rows | *"proposed, not written"* — invisible to `make work-index` by construction |

**The chain that terminates in nothing, traced.** `runtime-opening-identity` §6 refusal 8 —
*"accuracy-by-opening and player style require the observation store"* → `longitudinal-store`
§Scope — *"no habit cards, skill credits, milestones, tips, or style axes. Those are F6/F9
consumers with their own RFCs"* → **F6 and F9 have no RFCs.** Both of the owner's 2026-08-20 asks
([[D549]] skills, [[D552]] style) sit at the end of that chain. Each hop is individually correct
and cites the next. Independently found by `refused-vs-asked.md` §4.2; reproduced here mechanically.

**A second, shorter one.** `theming` Discharge D2 — cosmetic-reward *gating* is `campaign-core`'s →
`campaign-core` Discharge D4 — *"evidence-dark fun nodes and cosmetic rewards … deferred"* → the
v2 amendment, which does not exist. Two accepted RFCs each correctly hand the same feature to the
other side of a document that was never written.

---

## 3. The Discharges register — 52 open obligations

Every row in a `## Discharges` table is, by the convention's own definition
(`archive/rfc-lifecycle-completion.md` §3), *"an obligation that survives `accepted` and blocks
archival."* **94 rows exist across 27 RFCs; 52 are undischarged at HEAD.** Of the 42 discharged,
**31 are self-discharging rows** in archived RFCs (owner = the RFC itself, destination = "the
implementation commit") — bookkeeping, not deferral. The register is the one part of this system
that works: every row names an owner and a destination. The 13 rows whose destination does not
exist are marked ⚠.

| source RFC | id | the obligation | owner | destination | surface |
|---|---|---|---|---|---|
| `accessible-board-input` | D3 | §11 owner validation run on the owner's devices, logged with device/browser/AT and failures (D649 posture) | `accessible-board-input` | `planning/platform-alignment/log.md` entry | drill-loop (a11y) |
| `bot-policy` | D1 | Stage B: the [[D813]] candidate-evidence adapter over the literal landed tactical/breadth ids — feature-weighted personas beyond the O8.2 roster are blocked until it lands | `planning/evidence-foundation-ux/plan.md` | the Stage-B landing commit | bots |
| `bot-policy` | D2 | The [[D815]] salience measurement (human severe-error mass conditioned on exact threat-just-created / attacker-just-moved classes, behind tactical landing) — no salience-shaped layer may register before it passes; a failed measurement kills the family | claude | dossier in `design/research/` + ledger flip | bots |
| `bot-policy` | D3 | The [[D819]] calibration run for the shipped roster: D333-harness ladder under [[D341]] seeding, ~500–800 games/arm, predeclared distribution bounds; profiles remain `uncalibrated` (A11) until it lands | claude | calibration dossier + the register/ledger flips | bots |
| `bot-policy` | D4 | The human-scale anchor ruling (anchor accounts vs learner-derived Glicko vs stay band-relative) — a cost/policy decision; until ruled, no absolute human Elo is stated anywhere | OWNER | `planning/exploration/log.md` ruling entry | bots |
| `bot-policy` | D5 | Owner-use roster validation via the retained 42-branch blind packet (O8.5) — validates or rejects profiles by use; cannot clear H5/C5 population claims | OWNER | `planning/platform-alignment/bot-policy/` + ledger | bots |
| `breadth-collectors` | D1 | Production-module eligibility for the admitted breadth projections; this RFC deliberately lands them inspector/research-only so significance and workflow policy cannot leak into collectors | `planning/evidence-foundation-ux/plan.md` Phase 3 | the Phase-3 module RFC's landing commit | evidence-platform |
| `campaign-core` | D1 | The Act II rated boss — absorbs [[D945]]'s ruled reading (earned rewinds can win the encounter; ratedness follows R11 unchanged: rated when clean, winnable regardless) as a v2 amendment once `learner-rating` is accepted, resolving the persona/`targetElo` disjo | `planning/campaign/` | the amendment's registration | campaign |
| `campaign-core` | D2 | Prediction (shape 3) and survival (shape 4) encounter classes — each needs a seal mechanism absent at HEAD (the prediction-score threshold must be authored-parameter-shaped and reconciled with format v0.9's no-verdict rule; survival needs grounded counters and | `planning/campaign/` | that amendment's registration | campaign |
| `campaign-core` | D4 | Evidence-dark fun nodes and cosmetic rewards (D887's marked-play class) and time controls (nothing exists to build on — `clockState` is an untyped passthrough) | `planning/campaign/` | that amendment's registration | campaign |
| `campaign-core` | D5 | v1 implementation per this specification, criteria 1–14 | codex | the implementing commits; ledger flips per §9 | campaign |
| `claim-semantic-anchors` | D1 | Name the literal F3 capability/version declaration and top-level ledger compatibility rule | `planning/platform-alignment/` | the F3 RFC refresh commit | evidence-platform |
| `claim-semantic-anchors` | D2 | Resume Feedback Delivery Stage 2 only after Stage B and the six negative fixture classes pass | `feedback-delivery` | the resumed Stage-2 content commit | evidence-platform |
| `claim-semantic-anchors` | D3 | Decide whether opening facts return to claim binding as `sourcing.claim.opening.*` with typed args and a registered renderer, or stay author-attributed | `runtime-opening-identity` | that RFC's projection section | evidence-platform |
| `exact-legal-mobility` | D1 | Compile `legal_moves@1` into the selected-square/requested-sight module under the accepted per-module ceilings | `learner-modules` | module binding commit | evidence-platform |
| `feedback-delivery` | D1 | Binding wave: 63 mandatory pack edits, explorer position-census over 60 `corpus_observed` claims in 31 packs, and tablebase legal-successor pass over 36 `tablebase_exact` claims in 12 packs | `OWNER` | `planning/content-era/log.md` plus criterion-11 ledger flips in the shipping commit | content-packs |
| `intent-presets` | D1 | Owner-use validation of every `candidate` entry (names, labels, promises, defaults, allowedPresets, the Support-offering set) — confirmed/renamed/re-tabled by logged rulings after real sessions; until then candidates ship as candidates | OWNER | the log entries recording the rulings; the commit dropping each `candidate` marker cites its ruling | presets-assistance |
| `intent-presets` | D2 | Server-side per-learner workflow persistence (the personalization era's store) — deferred; localStorage is v1's honest scope. The future RFC claims its own migration position (behind `bot-policy` at HEAD ordering) | `planning/exploration/plan.md` | that RFC's registration | presets-assistance |
| `learner-modules` | D1 | Preset/workflow activation of the ordinary modules — this RFC registers production modules with no preset layer by scope; without Phase 5 they are reachable only by fixtures and the explicit inspector/review surfaces, and the chain's last two links stay open | `planning/evidence-foundation-ux/plan.md` | the Phase-5 preset RFC's landing commit | presets-assistance |
| `learner-modules` | D2 | Board-protected composition seating the declared seat classes across viewports — the D718/D841 rebuild; module contracts make the play-column placement non-conformant but only Phase 4 relocates it | `planning/evidence-foundation-ux/plan.md` | the Phase-4 composition RFC's landing commit | presets-assistance |
| `learner-modules` | D3 | The grade-family projection + versioned per-context convention document ([[D879]]) so the two declared-awaiting rows compile; praise-class refusal and never-rating-conditioned carried into that RFC verbatim | `planning/evidence-foundation-ux/plan.md` | the grade-family RFC's landing commit | presets-assistance |
| `learner-modules` | D4 | **Durable novelty and durable reduction pressure** (reducer amendment 2026-08-23) — §3a.4's novelty is bounded to the current branch's ancestor path by recomputation, and §3a.5's instrument measures pressure over the corpus, not per learner over time. Cross-ru | longitudinal-store | the longitudinal-store implementation commit that adds a module-delivery projection | presets-assistance |
| `live-sources` | D1 | Phase B — the round follower (held stream), the imported-run growth model, move-0 follows, and the [[D411]] lock as a dynamic ceiling-term bit with fail-closed release (§6 rows 1–2); proposed row D957 owns the seam until its RFC exists | claude | `planning/live-sources/` | live-casting |
| `live-sources` | D2 | Casting composition ([[D705]]) — blocked on the owner's B5 justification ruling (Open question 1); proposed row D958 | OWNER | `planning/live-sources/` | live-casting |
| `live-sources` | D3 | The [[D412]] events-row clause in `design/03` — law 5, owner ruling at this RFC's acceptance or severed to its own ruling (Open question 3) | OWNER | `planning/live-sources/` | live-casting |
| `live-sources` | D4 | Phase-A implementation: criteria 1–11 (including the `imported_games` CHECK rebuild migration), the [[D413]] doc edit, and the [[D410]]/[[D412]]-import ledger flips in the implementing commit | codex | `planning/codex-queue.md` | live-casting |
| `longitudinal-store` | D1 | the two durable classes (`learner_observations`, `learner_structure_stats`) enter the account-export and account/per-run deletion inventories required by `archive/portable-account-data.md` and the landed export/deletion docs | `longitudinal-store` (self, at landing) | the landing commit | rating |
| `move-quality-grades` | D1 | Consumer-edge compilation: the two ◇ declared-awaiting rows (`module.postcommit_nudge`, `module.review_map`) bind `derived.grade.move_quality@1` and this projection's `experimental` disposition lifts — learner-modules' registry landing is the edge; until it la | `learner-modules` | the learner-modules implementation commit that compiles the registry (the same commit flips learner-modules' own D3) | review |
| `pack-capability-contract` | D2 | The sacrificial pilot must exercise every **required** 1.0 capability (O6.1 clause 6). This RFC specifies what "required" means (§3's scope decision); membership is F7's | claude | the pilot matrix's landing commit | content-packs |
| `pack-capability-contract` | D3 | Re-stamping all 92 ledger `packDigest` values after the lane-0.30 churn (§4.1) — rides the graduation arm, which [[D949]] holds until Gate F | codex | the implementing commit | content-packs |
| `pack-capability-contract` | D4 | `EVIDENCE_KINDS` has no version axis (7 members, versioned by membership). Whether capability versions cover evidence kinds or they get their own register | claude | the follow-up RFC's landing commit | content-packs |
| `pack-capability-contract` | D5 | Implementation | codex | the implementing commit | content-packs |
| `pack-population-provenance` | D1 | Populate `provenance.corpusEvidence` across all 92 packs — deciding per pack whether its state is `ledger`, `abstained` (with which `ABSTENTION_REASONS` member and detail) or `unsourced`. This is authored judgement about each pack's evidence situation, not a m | **`OWNER`** — commissioning a content wave is an owner act | `planning/content-era/log.md` + the ledger flips, in the shipping commit (`CLAUDE.md` content-wave closeout) | content-packs |
| `pack-population-provenance` | D2 | Job A — the 21 `provenance.sources` string repairs that turn P4 from 20 firings to 0. Already specified and queued; this RFC neither re-specifies nor performs it. | **`planning/codex-queue.md`** §0-CONTENT | the job A shipping commit | content-packs |
| `play-composition` | D1 | Preset activation of the seated modules — this composition builds real seats whose activation semantics are Phase 5's; until that RFC lands the seats are exercised by fixtures and the explicit surfaces, and the chain's last link stays open | `planning/evidence-foundation-ux/plan.md` | the Phase-5 preset RFC's landing commit | drill-loop |
| `play-composition` | D2 | The system-arrow vector producer ([[D546]] form (c), routed here by [[D900]]) — seated modules draw arrows only from retained ordered operands; a producer for system-drawn vectors remains unbuilt and is not declared by this RFC | `planning/evidence-foundation-ux/plan.md` | the RFC or defect fix that lands the producer | drill-loop |
| `play-composition` | D4 | The §2.4 contract seam: `rules.phase.reading@1`, `rules.pivotal.marker@1`, the `pack.authored` classifier token and `derived.compare.*` need `module.full_inspector` `accepts` rows via an Appendix-B amendment to `rfc/learner-modules.md` before their §5.2 (i) de | `planning/evidence-foundation-ux/plan.md` | the learner-modules amendment/implementation commit that compiles the rows | drill-loop |
| `review-evidence-compiler` | D1 | Final Review Map source-local admission/quota/priority policy and learner-facing modules (D928); this RFC lands packet + Story compatibility only | `planning/evidence-foundation-ux/` | Review Map RFC registration/implementation commits | review |
| `review-evidence-compiler` | D2 | Runtime opening items appear only after `runtime-opening-identity.md` lands; absence before then remains explicit | `planning/evidence-foundation-ux/` | opening adapter implementation SHA + packet fixture | review |
| `review-evidence-compiler` | D3 | Learner usefulness of the selected Review moments; external panel work is descoped by D649, so owner-use/public-use evidence updates the gate after the final module exists | OWNER | dated owner-use evidence in `planning/exploration/log.md` | review |
| `runtime-opening-identity` | D1 | Learner-facing theory/Review/module bindings over the three ids; this RFC lands inspector-only | `planning/evidence-foundation-ux/` | binding implementation commit | evidence-platform |
| `runtime-opening-identity` | D2 | Runtime-artifact rights/inventory included in the F12 release proof | `planning/platform-alignment/` | release inventory commit | evidence-platform |
| `semantic-collectors` | D1 | Production-module eligibility for every §3 projection: this RFC lands research/inspector-only by design, and the accepted 175-row module RFC predates every Wave-C id (D921) — the literal-id amendment binding these shipped ids into Support/Review eligibility is | `learner-modules` | the learner-modules amendment commit | evidence-platform |
| `semantic-collectors` | D2 | The engine-Review lane: matrix rows `derived.review.eval_delta@1` / `derived.review.mate_transition@1` (typed C4 contract, stage-0 §12.2), the Story mate-type repair (D917, `story.ts:33/:104`) and the multi-source post-game compiler (D918) — codex's order item | `planning/evidence-foundation-ux/plan.md` | the Review-successor RFC's drafting/landing commits | evidence-platform |
| `semantic-collectors` | D3 | The runtime opening-identity trio: matrix rows `theory.opening.current_endpoint@1`, `theory.opening.catalogue_membership@1`, `derived.opening.deepest_reached@1` (D894/D902 evidence; the C3/F4/F7 handoff) — assigned to the runtime opening RFC exactly as `tactic | `planning/evidence-foundation-ux/plan.md` | the runtime opening RFC's drafting commit | evidence-platform |
| `semantic-collectors` | D4 | Authored-corpus semantic-tactic witnesses: the authored spine holds zero observed-sequence witnesses for every §3.2–§3.5 family and zero overload conflicts — the learner copy of these families cannot be validated until a content wave authors or imports cited c | `planning/evidence-foundation-ux/plan.md` | the content wave's shipping commit | evidence-platform |
| `tactical-collectors` | D1 | Production-module eligibility for every §3 collector — this RFC lands research/inspector-only by design; without promotion these projections join the class-9 wall the gap matrix measured | `planning/evidence-foundation-ux/plan.md` | the Phase-3 RFC's landing commit | evidence-platform |
| `tactical-collectors` | D2 | Learner-facing wiring of the D745 negative reading — ruled admissible post-commit/review; the *wiring* into modules is Phase-3 work over these producers | `planning/evidence-foundation-ux/plan.md` | the Phase-3 RFC's landing commit | evidence-platform |
| `theming` | D1 | Owner picks the shipped roster from the licensed candidate lists — the second piece set, any additional board theme, the `--warning` repair variant, and the olive-square repair choice (Open questions 1–3 resolve here) | OWNER | logged rulings after real sessions, the [[D649]] owner-use gate | theming |
| `theming` | D2 | Cosmetic-reward gating — the campaign consumes these catalogs **by id** as its evidence-dark payout pool ([[D887]]/[[D893]]); nothing here builds earning | `campaign-core.md` | the campaign cosmetics slice's landing commit | theming |
| `theming` | D5 | Felt-quality verification — [[D840]]'s flip rides the owner's own session, plus the inherited play-composition OQ3 echo decision made in that pass | OWNER | the play-session log entry | theming |
| `theming` | D6 | Criterion 10(c) — the assistance compiler does not exist at HEAD ([[D985]]); when it lands under whatever name [[D971]]'s amendment gives it, its input type joins criterion 10(a)'s no-shared-key assertion | `intent-presets.md` | the commit that builds the compiler | theming |

**13 of these 52 point at something absent** ⚠: `campaign-core` D1/D2/D4 (the v2 amendment),
`intent-presets` D2 (the personalization RFC), `learner-modules` D3 (the grade-family RFC),
`move-quality-grades` D1 (chained to it), `pack-capability-contract` D2 (the F7 pilot matrix) and
D4 (an unnamed follow-up), `play-composition` D2 (an unnamed producer RFC) and D4 (a
`learner-modules` Appendix-B amendment that has not been written), `review-evidence-compiler` D1
(the Review Map RFC), `runtime-opening-identity` D2 (the F12 release inventory), `semantic-collectors`
D1 (a `learner-modules` literal-id amendment) and D4 (an uncommissioned content wave), and `theming`
D6 (an assistance compiler [[D985]] records as not existing).

**Three active RFCs declare `Discharges: none` while their prose defers real work**:
`graduation-clearance` (16 prose deferrals, 6 with no destination), `measurement-records` (22 prose
deferrals, 12 with no destination), and `archive/assistance-controls` — whose §Scope table is the
**best-formed** out-of-scope table in the repo, every row naming an owner, and which then declares
no discharges, so nothing tracks any of it.

---

## 4. Deferrals with no destination at all — 539

**539 of 1,206 prose scope cuts (45%) name no successor RFC, no planning document, no ledger row
and no owner.** By kind: 304 scope statements, 113 open questions, 54 weakened criteria, 39
narrowing deviations. By owner: 483 name `nobody` at all; 56 name `OWNER` and then no place for the
ruling to land.

These are the hidden holes in the strict sense — not because each one is wrong, but because
**nothing in the repository can see them.** `make work-index` reads the ledger. `make status-parity`
reads the register. Neither reads a sentence in a Motivation section that says a thing will not be
built. A row here is invisible to every instrument the project has, and stays invisible until
somebody reads the RFC end to end — which is what this pass did, once, by hand.

### 4.1 The full list, grouped by source RFC

Every row below is a place where an RFC cut scope and named **no destination whatsoever** — no
successor RFC, no planning document, no ledger row, no owner. Format: `§anchor [KIND] — what was
cut`. `[W]` marks a criterion weakened during review; `[D]` a narrowing deviation; `[Q]` an open
question left registered at acceptance; `[S]` a scope/out-of-scope statement.

**`graduation-clearance`** (16) — §0.5(a) [S] Doing the grounding work — no engine pass, explorer wave, citation pass or shape authoring lands here; §0.5(b) [S] Curating a subset of packs for promotion, refused by the owner at D162; §0.5(c) [S] Reintroducing a pack review workflow; §0.5(d) [S] Changing what reviewStatus "published" means for severity; §0.5(e) [S] The candidate→draft promotion path; content/candidates is not a graduation subject; §6.6(1) [S] Final ledger_record/claim_bound split of rule-2's 46 entries not printable; left to Stage A; §6.6(2) [S] No mechanism distinguishes an owner ruling from an agent-written one; floor accepted; §6.6(3) [S] A #L anchor into a mutable living-tier doc can drift undetectably at runtime; §6.6(4) [S] The final clearance kind of the sixteen §2.5 shape entries deliberately not assigned here; §3.2a [S] The acceptance back door stays open deliberately — narrowed, not closed, since no second party exists; §4.2 [S] Not re-derived how many of the 43 machine-producible entries sit on the 18 ledger-less packs; Open questions #1 [Q] Moving the six browser fixtures out of content/drafts left to whichever RFC owns D227; Open questions #3 [Q] GRADUATION_RESOLUTION_STALE ships as warning in drafts; error flip deferred to the first content wave; Open questions #5 [Q] Who re-reads the 220 statements for compound conditions; the compound-entry lead is deferred; Changelog 2026-08-17 [W] Criterion 16 withdrawn; release-path admission enforcement now merely inherited via make verify, named a real weakening; Changelog 2026-08-16 (author round) [W] Tightening 3 withdrawn as unpayable — date containment for permanent_property/out_of_scope replaced by an anchor

**`learner-rating`** (16) — Scope boundary [S] Any rating on the campaign map or as a content gate; Scope boundary [S] Rating for imported games; Scope boundary [S] Rating for pack sessions — the authored ply horizon forbids a rules-terminal result; Scope boundary [S] Rating any opponent mode other than a calibrated human_common band; §2 option table [S] A per-material-regime rating considered and declined; one scale, one refusal; §9.1 [S] No backfill and no historical game rated; create-table/index only; §11.3 [S] The worst-case abandonment bound and the open-game lag fix recorded rather than specified; Open questions #2 [Q] Should 11–20 pieces be rated — refused on n=48; defer or run one harness arm; Open questions #3 [Q] Does strong_engine join the ladder; requires its own rung measurement first; Open questions #4 [Q] Three more calibration rungs (1200/1600/2000), or is four enough; Open questions #6 [Q] The human anchor experiment unrun; R7 (no external-scale equivalence) is permanent until it runs; Open questions #7 [Q] Which branch if the owner rules on submitted-path semantics; this RFC would not follow (b); Open questions #8 [Q] Does voiding on rewind price experimentation — owner confirmation of the reading; Open questions #9 [Q] Should a tablebase-exact result seal a rated game as a disclosed adjudication; Changelog 2026-08-16 [W] R6 narrowed to the wire-crossing assistance axes the server can refuse, with the boundary disclosed; Changelog 2026-08-22 [S] void_reason's 'assistance' and 'calibration_retired' values have no specified writer; reported to the acceptor, not fixed

**`archive/learner-identity-and-authorization`** (13) — Motivation Out of scope [S] Password reset, email and account recovery; no mail transport exists; Motivation Out of scope [S] OAuth and external identity providers; Motivation Out of scope [S] MFA, device management and audit log; Motivation Out of scope / §5.3 [S] Lease expiry and heartbeat rejected on merits; Motivation Out of scope [S] Multi-tenant data isolation beyond run ownership; packs stay deployment-global; Motivation Out of scope / §13 [S] Administrative roles of any kind, ruled out by the owner; §12 [S] No rate limiting beyond the per-handle lockout; §12 [S] No TLS opinion; cookie `Secure` assumes a terminator in front; §12 [S] No session revocation UI, device list or sign-out-everywhere; §12 [S] No authorization on packs; §12 [S] No anonymous access of any kind, including read routes; Deviations 2 [D] live-and-platform C1's capability-token authorization model dropped for accounts plus grants; Changelog revision 2 [W] "Not a handle oracle" claim replaced by a single-derivation path with residual work named

**`archive/fixture-realism`** (12) — §6 Follow-on [S] F2 provenance for `tablebase-response.json` and `explorer-response.json` outside verify-draft; §6 Follow-on [S] Retiring the ~111 debt-register refusal codes left to whichever waves touch them; §6 Follow-on [S] `SourcingIssue.code` stays an unregistered bare string with 15 literals; §6 Follow-on [S] Extending F3 discovery beyond refusal codes to other test allowlists after one wave; §6 Deliberately left alone [S] No sweep of the other 94 test files; F1 binds new and touched tests only; §6 Deliberately left alone [S] `ServerErrorCode`'s 61 members recorded as debt rather than pinned to tests; §6 Deliberately left alone [S] Tolerance policy for any other instrument or candidate cap; Open questions 3 [Q] Whether the debt register needs an owner and expiry; recommendation is neither; Open questions 5 [Q] Whether a `docs/` page is needed; owner call; Owner ruling 2026-08-15 [W] E4 floor restated: a real fixture need only exercise reachable sides, not cross the bound; Changelog 2026-08-15 [W] Criterion 7 stops asserting a transcribed 111; register size becomes whatever implementation measures; Changelog 2026-08-15 [W] F2a's "only green resolution is recapture" retracted; it is notification, not a forcing function

**`archive/teacher-surface`** (12) — §Explicitly out of scope [S] no widening of the seven `/progress*` routes; class analytics conspicuously refused; §Explicitly out of scope [S] grading, scoring and any teacher-facing verdict refused; a submission is received, never marked; §6 [S] a fourth `classroom` session kind considered and refused; relation used instead; §6 [S] D307's unshipped per-context assistance *defaults* named and explicitly not claimed; Deviations 3 [D] the defaults half of design/05's per-context promise (D307) stays unshipped; Open questions #3 [Q] assigning a position, shape, branch or repertoire gap refused in v1; Open questions #4 [Q] whether a submission may carry a learner's message; left out to keep consent minimal; Open questions #5 [Q] whether an expiring grant needs a warning; currently silent; Open questions #6 [Q] what the teacher view says when a submitted run's pack version has moved; Open questions #7 [Q] whether 90 days is the right access cap; copied from mintLink without evidence; Open questions #9 [Q] whether the review rail should attach to every host-minted spectator grant; Open questions #10 [Q] whether conjunct two means "finished at least once" or "is finished now"

**`archive/branch-set-scale`** (11) — Motivation (Explicitly out of scope) [S] Any new engine mode, classifier or depth constant, incl. R4's engine-gated decidedness classifier; Motivation (Explicitly out of scope) [S] Deleting a branch, node or event; no such operation is invented; Motivation (Explicitly out of scope) [S] Automatic compare inclusion / default selection; manual checkboxes unchanged; Motivation (Explicitly out of scope) [S] Changing the eight-column comparison cap; §3d [S] Group-size constant not folded into MAX_COMPARISON_BRANCHES; a separate claim not taken; Open questions #2 [Q] Whether a tablebase decidedness fact should become durable evidence.attached; Open questions #3 [Q] Whether eight is the right collapse floor, and whether cap and floor may diverge; Open questions #4 [Q] Behaviour at branch counts beyond the documented 1000-event runtime envelope; Open questions #5 [Q] Whether imported runs should opt out of collapse entirely under the unauthored default; Open questions #6 [Q] Whether save/resist collapsing nothing needs a second affordance beyond manual fold; Open questions #7 [Q] Whether `cursed-win` under a `win` objective belongs in the collapse set

**`archive/claim-backing`** (11) — Scope (Explicitly out of scope) [S] Running the missing instruments; Bucket 2 is a wave, not a specification; §2 [S] Mechanism cannot check a clause's logical form; negation and scope inversion admitted; §3.4a [S] No check that an author-attributed segment actually instantiates the principle it names; Open questions #1 [Q] Whether moveCensus should admit an author-declared move subset (moveSubsetCensus); not taken here; Open questions #2 [Q] Whether a binding belongs in the ledger or a fourth claims.json sidecar; deferred; Open questions #4 [Q] Which Bucket 3 claims get a principle and which get an instrument run; Open questions #5 [Q] Whether the two retired template branches (byte-exact generated prose) come back; Open questions #7 [Q] Who may add a principle entry, and whether the registry gets a `community` channel; Changelog 2026-08-16 (round 2) [W] CLAIM_AUTHORED_SPAN_UNLABELLED withdrawn and struck from criterion 3's refusal list; Changelog 2026-08-16 (round 2) [W] Criterion 11 relaxed from "the five must still fail" to label-refused-but-sentence-deliverable; Changelog 2026-08-16 (round 2) [W] Criterion 13's escalation trigger moved from net label movement to registry concentration

**`archive/opening-evidence-path`** (11) — §Scope boundary [S] no change to deviation classes, the guard, objective types, predicates or condition kinds; §Scope boundary [S] authored prose is not made groundable by this RFC; §5a [S] plan classes, deviation classes and causal prose stay permanently ungroundable; Deviations #1 [D] the engine verify path only warns where the syzygy path refuses a spine regression; Deviations #2 [D] re-measurement is self-imposed, not validator-enforced; weaker than the draft claimed; Open questions #1 [Q] whether the NNUE net identity must be recorded; deferred to implementation; Open questions #2 [Q] whether EVIDENCE_TYPE_UNBACKED should be an error for drafts too; Open questions #3 [Q] whether the depth floor belongs in the format or in the tool; Open questions #6 [Q] dual-instrument claims can never be fully backed; a permanent corpus-half warning ships; Open questions #8 [Q] nothing attests that a named binary ran; named, not taken; Changelog 2026-08-15 (cross-review) [W] criterion 4 narrowed to proving the check fires, not that a false claim is impossible

**`archive/transition-primitives`** (11) — Motivation §3 Scope [S] "does the move force a reply" refused as not mechanical; routed with F9; §7 R1 [S] routing/repositioning delta refused as a detector at a 98.7% false-positive rate; Motivation §3 Scope [S] intent-relative grading blocked — the learner's declared plan is not recorded; §7 R3 [S] multi-move and piece-route claims refused; the grammar takes exactly one transition; R3 ruling header / §5.3 [W] live marker tier dropped entirely; criteria 7 and 11's marker halves superseded; Deviations 2 [D] transition facts not wired to guided mode's shape-entry tips; layers stay separate; Open questions #2 [Q] corrected firing rates for the two target-keyed leaves and the threshold's grounding; Open questions #4 [Q] whether objectives need a "happened anywhere on this branch" quantifier; Open questions #5 [Q] whether a `mover` node should exist for colour-agnostic authoring; Open questions #7 [Q] whether `structuralDelta` is fixed, deleted or left — a public-API decision; Open questions #8 [Q] a correct but pack-uncovered `to: achieved` condition — witness field or warning

**`archive/board-annotation`** (10) — Motivation (Explicitly out of scope) [S] Per-viewer withholding; the 2026-08-12 ruling stands and no viewer parameter is added; §5.3 [S] No per-viewer mark projection; relayed marks are shared and this RFC proposes none; §8 [S] Minting MARK_LIMIT_EXCEEDED declined; every refusal reuses INVALID_REQUEST; Open questions #1 [Q] Whether the PGN should carry relayed marks attributed via Comment.text; own-only for v1; Open questions #2 [Q] Whether marks should be imported from pasted PGN; whose marks they are is unanswered; Open questions #3 [Q] Whether a mark may carry text (DrawShape.label / Comment.text); refused in v1; Open questions #4 [Q] Which other boards get drawing; CompareView is the plausible second, untested; Open questions #6 [Q] Whether relayed marks should appear on the simul wall; cost with no measured want; Open questions #7 [Q] Whether relay must exist without a live session for async teacher review; Changelog 2026-08-16 (cross-review) [W] TabiyaMarks withheld-count dropped from the header; criterion 8 rewritten to a constant clause

**`archive/deviation-classes`** (10) — Motivation Out of scope [S] Ranking or scoring the five deviation classes forbidden; severity stays `offObjective`; Motivation Out of scope [S] No reclassification of any deviation by engine number; Motivation Out of scope [S] No enum value removed or renamed; a rename is a corpus edit plus a UI change; Motivation Out of scope [S] `class` stays single-valued; it is a printed join key; §6 [S] Replay testability of `timingWindowId` is an acceptance test and future affordance, not a validator check; §7 [S] Completeness of a declared `mistake` set is never validated; omission undetectable; §7 [S] Truth of a declared `cost` unchecked; no repo command evaluates a draft pack; Open questions 1 [Q] Whether `cost` becomes required for `tactical_error` in `immediate_guard` packs; Changelog 2026-08-15 [W] Redundancy warning narrowed to `mistake` exactly ["tactical"] so multi-value rows escape it; Changelog 2026-08-15 [W] §4.1/§4.2 no longer claim a sub-threshold cost proves the guard silent

**`archive/engine-leverage`** (10) — Motivation Explicitly out of scope [S] `practical_resistance`'s alphabetical `.slice(0,4)` candidate cut left unchanged; Motivation Explicitly out of scope [S] Any claim about chess quality at any band from any instrument; §3.3 [S] `engine_wdl`, `bestmove`, MultiPV rank and `bestline` refused as condition subjects; §4.2 [S] Node bound applies to `#strongEngine` only; enumerate and authoring profile untouched; Open questions 2 [Q] Whether an endgame pack needs a per-anchor DTZ threshold; deferred pending one authored pack; Open questions 4 [Q] Whether an explorer condition arm ever lands, or the split stays render-only; Open questions 5 [Q] Outcome-aware repertoire gap priority; whose RFC is unassigned; Open questions 6 [Q] What forces revisit of an `unmeasured` disposition — date, wave boundary or failing test; Open questions 8 [Q] Whether a pack with deviations and no ledger may be published; content-wave or RFC call; Changelog 2026-08-15 [W] Criterion 4 narrowed to the engine path; 100 tablebase-anchored records excluded pending D64

**`archive/evidence-at-runtime`** (10) — Motivation / §3.5 [S] Any cross-node arithmetic — swings, losses, deltas, ranks — refused normatively; Open questions 1 [Q] Whether readings are admitted across packs; 158 shared FENs refused, owner call; Open questions 2 [Q] Admitting clock-differing tablebase readings when every record at a key agrees; Open questions 5 [Q] Whether `position_legality` should be admitted; kept refused as rung-0-recomputable; Open questions 7 [Q] Whether the provider receives readings at all; owner may decline §3.8's guarantee; Deviations 2 [D] Supplies recorded score/category only — not WDL, MultiPV, tactics or deep analysis; Deviations 3 [D] design/05 §6 open question 1's open half — rung 0 on request — untouched; Changelog 2026-08-16 [W] Criterion 4 rewritten from fail-then-fix to a regression test after the gate landed elsewhere; Changelog 2026-08-16 [W] Criterion 2 reports the digest-refused set instead of asserting a frozen count; Changelog 2026-08-16 [W] Absence-is-unspeakable claim reduced from a `voiceCheck` guarantee to a structural bound

**`archive/pack-graduation`** (10) — §0.3 [S] none of the grounding work the blockers record is done; debt made legible, not paid; §0.3 [S] curating a subset of packs for promotion refused by the owner by name; §0.3 [S] community packs' registration path untouched beyond one predicate change; §0.3 [S] reintroducing a pack review workflow refused by the 2026-08-13 owner ruling; §0.3(f) [S] candidate->draft promotion path unowned; candidate blockers not read as content debt; §1.3 [S] one-entry-one-condition not machine-enforceable; left to the migration audit and report; Open questions #1 [Q] whether an unmet gate may land with an empty graduable set; Open questions #2 [Q] whether the three perfect_tablebase substitution entries and two provider entries become accepted; Open questions #5 [Q] Stage B's 203-entry hand audit has no testable second pass; Changelog 2026-08-16 (cross-review) [W] criterion 6 restated as end-of-landing-commit freshness rather than a permanent property

**`measurement-records`** (10) — Scope boundary [S] Any change to what a learner sees — no runtime surface, rendering rule or evidenceTypes semantics; Scope boundary [S] No change to tablebase/engine/explorer assertions, EVIDENCE_KINDS, the ledger schema, verify-draft or assessmentGrounding; §3c [S] No observation, satisfiability, FEN/SAN or derived-arithmetic assertion kinds minted; §7 [S] CLAIM_POINTER_REBOUND and CLAIM_BINDING_DUPLICATE deliberately not extended to shape-entry records; Status (R1 narrowing 2026-08-23) [W] Six census.* kinds narrowed to census-check-local; CLAIM_ASSERTION_KINDS untouched and the SourcingIssue.severity widening withdrawn; Open questions #1 [Q] Should packs get the measurements surface or keep claimBindings; deferred to keep pack lane 0.28 free; Open questions #2 [Q] Is `subject` too narrow — sub-expression and corpus-wide readings have no subject; blocker; Open questions #3 [Q] How long CLAIM_ASSERTION_UNDECLARED stays a warning on shape entries; asymmetry named, not resolved; Open questions #4 [Q] Does census.firesInShape@v1 belong at all — undefined for pack subjects, redundant on triggers; Open questions #8 [Q] RATE_TOKEN cannot match an integer percentage; widening it is claim-backing's surface and is not fixed here

**`archive/adaptive-guidance`** (9) — Motivation §3 Scope boundary [S] Band-shaped guided-mode defaults; no learner strength signal exists to band on; Motivation §3 Scope boundary [S] Live engine or tablebase detectors; no rung-1/2 source fires during committed play; Motivation §3 Scope boundary [S] Per-viewer spectator assistance; owner ruled document-don't-engineer for streamed sessions; Motivation §3 Scope boundary [S] Learner-rating-aware or history-aware significance; B7-era personalization and rungs 2–5; §6d [S] No provider implementation, no vendor SDK, no prompt library ships; only the seam; §3e [S] Assistance config deliberately not a pack field, opponentPolicy key, or /settings control; Deviations from design #1 [D] Option collapse redefined to legal-move count; evaluated variant ruled out of this contract entirely; Deviations from design #4 [D] Guided mode ships without design/05 §3b's band-shaped 1000–1400 default (off-by-default instead); Changelog 2026-08-14 (adversarial review) [W] Maia same-move invariance re-scoped: sidecar invariance no longer testable and no longer claimed

**`archive/expression-census`** (9) — §Scope boundary [S] No judgement of chess truth; no engine or tablebase consultation of any kind; §Scope boundary [S] Never writes `content/`; authors no signatures and clears no nulls; Open questions 1 [Q] Whether `FIRES_ON_DEGENERATE` earns error severity; opt-out would need a schema field; Open questions 2 [Q] `FIRES_ON_MAJORITY`'s 50% threshold is uncalibrated; revisit after a wave; Open questions 3 [Q] Whether `content/candidates/` joins the censused corpus; Open questions 4 [Q] CI report job refused for now; needs an owner who reads the artifact; Open questions 5 [Q] How far the refutation rule set grows; the soundness bar is an owner question; Open questions 9 [Q] Whether `.browser.json` fixtures belong in the census corpus; Open questions 10 [Q] When satisfiability refusal reaches pack-hosted expressions; adds a refusal to a shipped gate

**`archive/tempo-vocabulary`** (9) — Motivation §Scope boundary [S] no general claim-trigger field added; feedbackClaims still have no trigger; Motivation §Scope boundary [S] automatic tempo/window detection excluded; every window is authored; Motivation §Scope boundary [S] grading against captured intent not taken; commitment-opened windows substitute; §5d [S] prevent_opponent_plan, transition_to_endgame, save and resist left without type semantics; Deviations 1 [D] `atWindow` does not transfer to Just Play; no transferable trigger added; Deviations 3 [D] the author's day-one readiness sketch (Be3/c3 set) is not encoded as written; Open questions #2 [Q] whether `too_slow` should be ungraded on a forced-release path; Changelog 2026-08-15 [S] unauthored-context `outpaced` default pinned but not consumed; detection stays out of scope; Changelog 2026-08-15 [W] criterion 5's enum binding narrowed from TEMPO_VERDICTS to AUTHORABLE_TEMPO_VERDICTS

**`archive/drill-client`** (8) — Motivation [S] Mobile polish; responsive layout only; Motivation [S] Streamer overlay; Motivation [S] LLM narration; Motivation [S] Authored content; the demo pack is the Najdorf schema fixture; §Execution model [S] In-browser runtime, offline play and browser Stockfish explicitly not built; §Writer lease [S] No lease transfer in v1; documented limitation carried from branch-runtime; Deviations 2 [D] Branch race (two-board alternating play) stays experimental/absent; Open questions #1 [Q] Branch-rail scaling beyond ~6 branches; grouping/cleanup machinery deferred

**`archive/structural-reading`** (8) — Motivation §5 [S] nothing at rung 1 or above — no tablebase, engine, Maia or explorer input; §2b [S] king safety, space, weak square, trapped, hanging, good/bad bishop excluded as verdicts; §4d [S] discovered consequence capped at one ply; a second ply requires a null move; Deviations 2 [D] denial claims scoped to current pawn placement; no permanence claim survives; Deviations 4 [D] pawn-skeleton signature ships as a readable key, never as an authorable equality predicate; Deviations 5 [D] one colour's direct-attack count only; no derived balance, defended or pressure claim; Changelog 2026-08-14 [W] 1 ms latency microbenchmark changed from a brittle gate to a recorded measurement; Changelog 2026-08-14 [W] Pack B grading narrowed to the minority signature; central break and kingside attack ungraded

**`pack-capability-contract`** (8) — Motivation [S] UX defaults; Motivation [S] New chess primitives; Motivation [S] Lifting Gate F; Motivation [S] The 14 F1 declared-vs-consumed mismatch rows; §5 [S] Removal of piece_reach_count scope:"every" deferred because registered_shapes rows are immutable; §7 [S] content/sources/ and content/witnesses/ excluded from the migration population; Deviations from design [D] R6 §6.2 permits declared OR derived capability ids; this RFC requires declaration and demotes derivation to a check; Open questions #2 [Q] Does digest staleness become fatal — deferred rather than answered; the contract does not rely on it

**`archive/adoption-wave-1`** (7) — Motivation (Out of scope) [S] Repertoire gap-finding; Motivation (Out of scope) [S] Open-answer grading; Motivation (Out of scope) [S] What-if steering (audit row 38, honourable mention, not a ledgered row); Motivation (Out of scope) [S] Any social graph, streak, XP or skill score — refused by transformation; Motivation (Out of scope) [S] Native mobile packaging; §2 [S] Re-entry into play is not part of the public shared-card surface; play needs account and grant; Deviations from design [D] Opposite-side ships pack-free: authored objective, grading and spine never flip sides

**`archive/authored-feedback-delivery`** (7) — Summary [S] No reveal endpoint, no per-scope reveal, no new status code, no schema $id bump; §1 [S] Line Drill spine disclosure question deferred with trigger: the first Line Drill pack; §1 [S] planClasses and concepts omitted from projection; they return when intent capture renders; Open questions [Q] Serving authored content back — blocked on per-scope reveal, explicitly not designed here; Open questions [Q] Line Drill spine disclosure — trigger is the first Line Drill pack; Open questions [Q] Whether checkpoints[].label leaks intent — deferred until a pack shows real leakage; Changelog 2026-08-12 [W] Delivery half cut to stop-shipping-only after review showed the reveal path assumed withdrawn infrastructure

**`archive/authoring-frictions`** (7) — Motivation (Explicitly out of scope) [S] Per-leg `shapes` and per-leg `opponentPolicy` on trajectory legs; Motivation (Explicitly out of scope) [S] shapePlan:null ergonomics, Node zstd, theory_strict off-spine consequence, rook-4v3 trigger over-promise, commissioned shape entries; §10 [S] LEG_LENGTH_WITHOUT_TRAJECTORY named only to record it is not shipped; Open questions #1 [Q] Whether 40 is the right branchLengthTarget ceiling; 66-ply single-segment B+N stays impossible; Open questions #3 [Q] Whether `hold` should admit `cursed-win` roots; one table entry and a fifth refusal code; Open questions #4 [Q] Whether one-per-run atStart firing is acceptable; per-branch firing needs another entry point; Open questions #5 [Q] Whether the two surviving isEnd()-based "terminal" definitions should be unified into isTerminal(run,node)

**`archive/client-surface-floor`** (7) — §8 [S] HonestControl refusals for live session detail, pack studio authoring, branch groups ≥4; §8 [S] Service worker, offline cache and native packaging; responsive-only per Q3; §8 [S] F1b binds only assertions this RFC touches; other repo tests not retroactive homework; §6 [S] The 24px-circle spacing-exception analysis for .pivotal-marker explicitly deferred; Open questions #2 [Q] Whether C2's 992×768 / 900×700 board regression needs a max-height landscape escape; Open questions #5 [Q] Whether container-type:size is safe against board overlays, preview outline and .preview-label; Changelog 2026-08-15 (cross-review) [W] C5-3 board-floor assertion scoped to compact tier only; not asserted at ≥720px

**`archive/game-import-and-story`** (7) — Motivation [S] Multi-game import of any kind; Motivation / §2c [S] Chess.com server-side fetch; paste-only, verified against the published API; Motivation / §2 [S] Ingesting third-party engine annotations (lichess [%eval]) as evidence; Motivation / §7 [S] Story-card image rendering; the story payload is a data contract only; Motivation [S] Variant chess; Motivation [S] Review workflows; Deviations [D] `human_divergence` abstains on imported mainlines — an honest narrowing of the detector set

**`archive/line-drill-theory-grading`** (7) — §3 Out of scope [S] Grading a move against an engine's best move; §3 Out of scope [S] Ranking or scoring the five deviation classes; §3 Out of scope [S] FEN-anchored deviations refused under `follow_theory` and untouched elsewhere; §3 Out of scope [S] D5's release compose light profile cited, not fixed; §4b [S] `atAuthoredBoundary: "last_supported"` refused as undecidable at commit time; Deviations 4 [D] `follow_theory` forbids achieved/failed/transitioned; narrower than the runtime transition table; Changelog 2026-08-12 ruling 1 [W] Frontier reading withdrawn for membership; criteria 2/4/7 rewritten onto a fixture shipped content cannot show

**`archive/live-session-platform`** (7) — §2.6 [S] native Arena clocks and matchmaking left as later depth inside this surface; §3.6.4 [S] binding chat votes refused permanently; tally advisory and chat identity unauthenticated; §3.6.2 [S] no scheduler added; vote windows close by lazy re-derivation, never at closesAt; §3.7.4 [S] provider adapter minting challenge URLs (Lichess first) left as later depth; §3.4 [S] Node.actor not widened; run schema keeps no per-ply learner identity; Deviations #1 [D] cohorts and team relays ship as grant set and rotation, not as distinct aggregates; Deviations #2 [D] stream viewers get no client at all, not merely no synchronized client

**`archive/live-surface-honesty`** (7) — §Explicitly out of scope [S] per-viewer withholding untouched; no viewer parameter added to any projection; §Explicitly out of scope [S] SESSION_KINDS read but never widened; no fourth session kind added; Open questions #1 [Q] whether academy gets its own assistance profile; left non-behavioural; Open questions #2 [Q] precedence between stream and onramp profiles unresolved; one line to flip; Open questions #3 [Q] attribution line on the /live wall's per-board summaries left out; Open questions #4 [Q] per-option relayed/member vote breakdown left at window level; Open questions #6 [Q] a session opening mid-run does not refresh the assistance profile; poll fix declined

**`archive/predicate-wave-3`** (7) — §7 F2 [S] structure memory and history predicates refused; the evaluator takes one position; §7 F3 [S] castling-rights leaf refused; it adds no discriminating bits over the shipped proxy; §7 F6 [S] king confinement and king activity refused under rules 1 and 4; §7 F8 [S] a general piece_zone over all roles refused; no filed gap names one; Open questions #2 [Q] whether prospective shape references need their own field rather than one array; Open questions #3 [Q] whether distance-to-nearest-edge should generalise king_zone; a filed gap would reopen it; Open questions #5 [Q] whether F4's disjunctive promotion trigger is a clean hand-off or a lost specification

**`learner-modules`** (7) — §7 [S] Implementation deferred until 2c and 2d land; grade rows and opening join follow at their own pace, honest-empty; Deviations 2 [D] rules_floor registers no evidence consumer, narrowing F1's bound-or-disposed law for that module; Deviations 3 [D] The DESIGN-GAP for the sound form (D880) is honored by refusal, not resolved here; Open questions #2 [Q] Threat radar's pre-commit arm exceeds the literal O4 ruling; conservative fallback is post-commit only if unruled; Changelog 2026-08-23 [W] A9's "facts beyond maxFacts are never admitted" withdrawn; truncation moves after reducers; Changelog 2026-08-22 [W] sight_on_request narrowed by four rows (three 2d readings plus outpost); eligibility totals cut 179/177 → 175/173; Changelog 2026-08-22 [W] §3's "lift can never change membership" over-claim withdrawn; lift may decide which admitted facts fill a scarce budget

**`tactical-collectors`** (7) — §2.3 [S] No new family promoted to criticalEvents; selection policy untouched; §3.5 [S] No ray event family registered at landing; ray deltas measured only as a probe; §3.11 [S] No space event family registered; the delta demoted to a level reading on measured weakness; §3.14 [S] The rule-of-the-square verdict removed as underspecified; outcome words stay with Syzygy; Deviations 2 [D] chess_tradition kept as a citation basis rather than widening the EvidenceGrounding union; Changelog 2026-08-22 [W] A5 repaired so canonical non-vacuity cannot erase honest population absence; authored zeroes predeclared; Changelog 2026-08-22 [W] double_attack ships with no global positive-primary disposition because the authored interval crosses 1.0

**`theming`** (7) — Motivation [S] Hue/brightness sliders and free color config refused (D875: a ceiling, not a floor); Motivation [S] 3D boards, background images, per-context themes and zen mode; §3.3 [S] Inherited palettes are measured and published rather than gated to WCAG AA; Changelog 2026-08-22 (D977) [W] Criterion 11 narrowed to artwork only; the palette arm of the licence criterion removed; Changelog 2026-08-22 (D977) [W] Version wrapper removed from the theme preference; validation-on-load replaces migration machinery; Changelog 2026-08-22 (restructure) [W] Token contract cut 17 → 12; --paper-soft/--panel-soft retired and --display-font dropped from the theme contract; Changelog 2026-08-22 (verification) [W] Criterion 7a's brush-pair count corrected 10 → 6 because the lighting overlay IS the blue brush

**`archive/authored-explanation-surface`** (6) — Motivation (Out of scope) [S] Evidence-bound LLM rendering; capabilities ship llm:"none"; Motivation (Out of scope) [S] Corpus, Syzygy and deterministic-feature layers; no code exists for any; Motivation (Out of scope) [S] FEN-anchored deviations; needs a position-matching contract this RFC does not specify; §3 [S] Per-scope/per-node "has content" flags rejected; pre-reveal per-ply affordances stay withdrawn; Deviations from design #1 [D] Reveal scope derived from play, not author-controlled timing; authors get less control; Deviations from design #2 [D] Pre-reveal timeline affordances implied by design/03's passive-marker model not delivered

**`archive/content-sourcing-syzygy`** (6) — Motivation Out-of-scope #2 [S] Self-hosted Syzygy mirror files; API used instead, no mirror capability claimed; §3.3 [S] Top-n alternatives (MultiPV>1) refused; would need a different parser; §4 [S] No annotations, planClasses, deviations, feedbackClaims, concepts or authoredBoundary emitted — each is a judgment; Deviations 1 [D] Syzygy grounds <=7 pieces only, excluding design/04 §4's batch-1 rook families; Deviations 3 [D] Emitted candidates are spine-less `outcome` packs; design/04 §2d's line-shaped template not followed; Changelog 2026-08-12 [W] Acceptance 20 no longer assigns the pack piece-count correction; replaced by a census test

**`archive/live-marker-quality`** (6) — §Motivation Scope [S] detectors, on-request reading, story/comparison/evidence-packet surfaces, transition grammar, pack schema, new research all excluded; §7 [S] per-kind live marker toggle would need AssistanceConfig version 5 and a migrate arm; not proposed; Open questions #1 [Q] per-kind marker preference deferred, owner-facing, not blocking; Open questions #5 [Q] whether L3's 0.10-firings-per-ply ceiling survives a second admitted kind; revisit later; Open questions #6 [Q] no expiry set for grandfathered unmeasured kinds; recorded as known softness; Changelog 2026-08-15 (cross-review) [W] L3's volume ceiling recorded as currently unverified for the surface it governs

**`archive/pack-optional-runs`** (6) — §Out of scope [S] Just Play entry UI, start form and position player not built; resume refuses position runs; §Out of scope [S] binding POST /select-move to its run deferred; run.opponentPolicy recorded, not enforced; §Out of scope [S] FEN/PGN paste, /drill and /fen routes and duplicate-from-run not specified; §Out of scope [S] deterministic feature and phase recognition excluded; its evidence namespace is a separate contract; §Out of scope [S] per-node reveal of engine evidence impossible on the contiguous event surface; §Out of scope [S] immediate_blunder_guard stays rejected at load; N-way comparison payload untouched

**`archive/trajectory-drill`** (6) — Motivation §3 Scope [S] no trajectory score, completion percentage or leg ranking; Motivation §3 Scope [S] per-leg `phase` labels refused — a word with no consumer; §9c [S] no plan verdict, intent-relative success or timing-window evaluator invented for the middle leg; Deviations 3 [D] grading is per-leg, not "per-phase"; the runtime computes no phase claim; Deviations 4 [D] objectives are replaced rather than transitioned; `transitioned` is never emitted; Deviations 5 [D] the brief's middle "plan verdict" term is not invented; only successConditions grade

**`archive/validator-integrity`** (6) — Motivation §Scope boundary [S] no new predicate, feature or condition kind; no change to compiled rule meaning; Motivation §Scope boundary [S] verify-draft's tablebase queries, assessmentGrounding matching and client rendering untouched; §3e [S] validation exercises compilation only; rules are never evaluated at the root; §3e [S] `progress.ts`'s objectiveRules caller deliberately left unguarded; Changelog 2026-08-15 [W] criterion 11's record equality narrowed to values/sourceId/supports, excluding retrievedAt; Changelog 2026-08-15 [W] criterion 16 relaxed from "nothing moves" to three content files and digests moving

**`longitudinal-store`** (6) — Scope boundary [S] No learner-facing surface: no route, client change, /capabilities entry or inspector panel; Scope boundary [S] No rating input or output in either direction; Scope boundary [S] No LLM anywhere; the schema has no prose column; Deviations from design [D] R13's "measured value + uncertainty" fields made consumer arithmetic instead of columns; Open questions #3 [Q] Who bumps derived_rev; proposal is each changing RFC names the bump in its own criteria; Changelog 2026-08-22 [W] §4.4's "never mix revisions silently" narrowed to its true scope and held by the new AC-11 digest+rev fixture

**`pack-population-provenance`** (6) — Motivation [S] deviationCost — a recorded refusal that changes nothing; §1.2 [S] A pack-side population field refused; the population stays in explorer_position_census; §1.2 [S] A prose-scanning population check refused on an unbounded false-positive rate; §5.3 [S] P3 deliberately does not compare census band/speeds/window to the pack or require two packs to agree; §6 [S] D123's alternative `rationale` sibling field refused; Open questions Q3 [Q] Should citable_text records be re-fetched and re-hashed on a schedule — deferred

**`play-composition`** (6) — Motivation [S] No collector, evidence-catalog, schema or migration work of any kind; §6 [S] Spoken/TTS playback and the read-only follower considered and excluded from the state matrix; Deviations 1 [D] The five design regions are projected into one bounded companion region at tablet/phone, not five concurrent panels; Deviations 2 [D] board_adjacent is bound as a priority contract, not a geographic one; Open questions #1 [Q] The tablet breakpoint at 1023/1024 is claude-chosen, not measured; moves by token if owner use disagrees; Open questions #4 [Q] The inspector's route form (path segment vs modal mode) left to the implementer

**`archive/branch-groups`** (5) — Motivation (Explicitly out of scope) [S] Default compare selection heuristics beyond "the group is the selection"; Motivation (Explicitly out of scope) [S] Live-session group semantics beyond the writer lease; no vote/proposal integration; Motivation (Explicitly out of scope) [S] Group-view layout, animation, band thresholds and gesture mapping left to implementer; §1.3 [S] No add/remove/dissolve operation on a group; membership fixed at creation; Deviations from design #1 [D] Seed-based constant resistance unattainable; only the group-level position-function guarantee is rendered

**`archive/content-sourcing-explorer`** (5) — Motivation (Out of scope) [S] Masters-database queries; a later `ratings`-parameter change; Motivation (Out of scope) [S] Grading moves with frequency; law 8; §3 [S] /difficulty support removed: frequency may never reach minOnlineRapid/maxOnlineRapid; §4 [S] Causal and non-frequency-worded claims cannot be grounded; stay unsupported authored claims; Deviations from design #3 [D] The one supportable authored sentence is generated, not approved; author keeps it or loses the citation

**`archive/content-sourcing-position-seeds`** (5) — Motivation (Out of scope) [S] Grading the learner's play; no source supplies it and no verdict is manufactured; Motivation (Out of scope) [S] Tactic training in any form: solve-the-position, hint reveal, solution playback; Motivation (Out of scope) [S] Lichess theme description prose (AGPL text); Motivation (Out of scope) [S] Bulk retention of the puzzle dump; streamed and discarded; Deviations from design #4 [D] Emitted packs are spine-less, where design/04 §2d and the format centre on a spine

**`archive/drill-pack-format`** (5) — Motivation [S] Natural-language courses; Motivation [S] Storing engine lines; Motivation [S] Engine implementation details; Motivation [S] Replacing PGN as interchange; Open questions #2 [Q] Pack content licensing (Q2 content-rights axis) pending owner decision

**`archive/engine-request-contract`** (5) — §5 Scope boundary [S] The sampler's nondeterminism itself; `Temperature` untouched by design; §5 Scope boundary [S] `seedHonored` stays `false` on Maia; flipping it would make the record less true; §5 Scope boundary [S] Promoting `practical_resistance` to determinism-by-construction; a mode-semantics change; §5 Scope boundary [S] Browser execution locus; server locus assumed; §13 [S] Temperature/TopP defaults, the selection cache key and the movetime budget unchanged

**`archive/engine-workers`** (5) — Motivation [S] Feedback composition; Motivation [S] Corpus; §Seeding [S] Per-locus determinism narrowed: `seedHonored: false`, reproducibility from event log and cache; §Evidence job queue [S] v1 applies no offline evidence; staged results expire with the session; Changelog 2026-08-12 [W] Engine tests skip-with-warning locally; enforcement relocated to CI's ENGINES_REQUIRED=1

**`archive/format-surface`** (5) — §Scope boundary [S] `deviation.planClassId`, additive and deadline-free, deliberately omitted; §4.3 [S] Per-leg `temperature`, `topP`, `stockfishGuardCp` and `seedMode` refused; Open questions 3 [Q] When per-leg tablebase modes are admitted; both directions await one authored pack; Changelog round 2 [W] Criterion 9's exact warning counts replaced by corpus-derived equalities; Changelog round 2 [W] Criterion 1's corpus counts demoted to context; assertion softened to an invariant

**`archive/shape-library`** (5) — Motivation §4 [S] intent-relative grading unchanged; no intent is recorded anywhere; Motivation §4 [S] cross-pack concept identity — unifying `concepts` with entry ids — is a separate contract; Motivation §4 [S] review workflows for entries refused permanently; channel and provenance are the safeguard; §8 [S] position player omits PGN import, shared-URL starts, Arena integration, opponent rating controls; Deviations 4 [D] inside pack runs, firing narrowed to the pack's referenced entries, not the full catalogue

**`archive/shared-resource-registers`** (5) — Motivation [S] `make work-index` BACKLOG routing invariant excluded entirely; §4 [S] giving `EVIDENCE_KINDS` a version identifier deliberately refused; §1 [S] `ABSTENTION_REASONS` not registered until some draft actually claims it; Acceptance criterion 10 [S] D504's test half (missing `principle-entry.test.ts`) left open; only the register half lands; Changelog 2026-08-21 [W] criterion 1 relaxed from byte-identical §RFC-lifecycle pin to "this commit does not touch it"

**`feedback-delivery`** (5) — §Scope [S] no new authored content; the pivotal-marker timing strip stays pinned unmodified; Open questions #2 [Q] whether `renderStructuralObservation` moves into packages/runtime to upgrade narrative and voice; Open questions #6 [Q] whether CR1 survives at N = 8 columns; deferred to criterion 16's measurement; Changelog 2026-08-21 [W] criterion 20 narrowed from a whole-line vocabulary assertion to template-owned byte ranges; Changelog 2026-08-16 [W] criterion 2a's equality replaced by a subset assertion; day-zero run recorded as vacuous

**`archive/authored-consequence-lifecycle`** (4) — §1 [S] Making absorbing objective states globally playable; would change decidedness, comparison, progress, groups; §2.2 [S] Absorbing-non-leaf check scoped to top-level non-trajectory spines only; §2.2 [S] Validator does not infer whether an unauthored move is strategically a consequence; §4 Refusals [S] No feedback anchor inferred, no predicate relocated, no authored chess statement rewritten, no schema lane consumed

**`archive/branch-runtime`** (4) — Motivation / Errors & concurrency [S] Multi-device conflict merge; v1 is single-writer; Implementation doctrine [S] Maia ONNX export tracked as a later optimization (would enable browser Maia); Compare contract (BR-C7) [S] Engine/feature overlays attach later via evidenceRefs; not part of this payload; Compare contract (BR-C7) [S] Comparison requires a common fork node in v1

**`archive/dead-vocabulary`** (4) — Open questions #2 [Q] Whether `producers: 0` with consumers ranks louder than the reverse; deferred to first use; §5 Scope boundary [S] Declaration census is report-only and stays out of `make verify`; §5 Scope boundary [S] No static reachability analysis; never claims a declaration unreachable; Changelog 2026-08-16 [W] Criterion 11 corrected so it no longer demands the D360 ledger flip already made

**`archive/defect-sweep`** (4) — §3 Scope boundary [S] None of the five declared-but-unselectable vocabulary values implemented; §3 Scope boundary [S] plan_defense, practical_resistance and human_external keep their declared-unimplemented status; §3 Scope boundary [S] Committed candidates not rewritten; evidence sidecars pin their pack digests; Deviations 3 [D] `phase` stays optional; "unclassified" is narrower than a design assuming every pack has one

**`archive/evidence-contract-manifest`** (4) — §3 Scope boundaries [S] No chess concepts, tactics, plans or move labels added or graded; §3 Scope boundaries [S] No drill-pack, run, shape-entry or principle-entry schema change; §3 Scope boundaries [S] Neither a provider nor the LLM made mandatory; Changelog 2026-08-21 [W] Criterion 26 corrected from "no base-packet projection" to the narrower "no base-packet item"

**`archive/grounding-pair`** (4) — Motivation Out of scope [S] Prose generation or any new machine-prose crossing for tablebase evidence; Motivation Out of scope [S] Pack promotion; Motivation Out of scope [S] Local Syzygy file probing; nothing ships `.rtbw`/`.rtbz` handling; §1i [S] Hand-authored packs acquire no sidecar requirement; the advisory/strict boundary untouched

**`archive/polish-surfaces`** (4) — §Motivation Out of scope [S] hardware-board integration and native mobile apps excluded; §Motivation Out of scope [S] offline write of any kind refused under the hosted multi-user ruling; §Motivation Out of scope [S] no new evidence source or detector; B4 residuals belong to sibling drafts; §1b [S] settings changes no deployment configuration; providers stay environment-owned

**`archive/portable-account-data`** (4) — §Motivation Out of scope [S] importing an account bundle excluded; no import route, parser or UI ships; §Motivation Out of scope [S] federation, cross-instance identity and account transfer excluded; §Motivation Out of scope [S] no public-run publication state invented; a third dependency predicate awaits future storage; §5 [S] other devices' local preferences and writer ids cannot be cleared; disclosed instead

**`archive/predicate-wave-2`** (4) — §Motivation 3 Scope boundary [S] castling rights and castling history refused; the entry keeps its king-square proxy; §Motivation 3 Scope boundary [S] structure memory refused under rule 1 — a fact about a past position; §Motivation 3 Scope boundary [S] pawn tension and "practically open" centre refused; mobility encodes taste; §Motivation 3 Scope boundary [S] board symmetry test and middlegame–endgame boundary marker refused

**`archive/repertoire-gap-finding`** (4) — §Motivation Out of scope [S] linked-account and bulk game mining excluded permanently under ADR-0003; §Motivation Out of scope [S] card/FSRS scheduling excluded; the explainable attempt ladder stays the scheduler; §Motivation Out of scope [S] chess.com URL fetch excluded; no public per-game contract exists; §Motivation Out of scope [S] no LLM rendering on this surface and no pack-document change

**`archive/resistance-spectrum`** (4) — §7b [S] engine-gated concession classifier measured and still not shipped for three measured reasons; §7d [S] plan_defense and human_external stay declared-unimplemented with checked refusals; Changelog 2026-08-15 (cross-review) [W] candidate cap dropped from eight to four, thinning the difficulty argmax; Changelog 2026-08-15 (cross-review) [W] the sameEngine/eloApplied journal comparison requirement withdrawn entirely

**`archive/vocabulary-wiring`** (4) — Open questions #2 [Q] should `PLAN_SIGNATURE_INLINED` be an error rather than a warning — unmeasured; Open questions #4 [Q] whether the B+N outcome sibling pack should be deleted — a content decision; Open questions #7 [Q] whether `relation: "prospective"` should produce an in-run marker when it arrives; Changelog 2026-08-15 [W] acceptance criterion 10 narrowed because the ledger escalation had already landed

**`breadth-collectors`** (4) — §4 [S] no restriction, activity, weak-square, outpost, pawn-break, king-attack or initiative events; §4 [S] slider coordination, connected-rook and pawn-contact prominence refused as near-background; §4 [S] no longer-than-three-edge tactic search, forced win, sacrifice or mating-net classifier; §4 [S] engine eval/WDL, Maia, explorer, opening identity, theory and authored claims stay separate producers

**`claim-semantic-anchors`** (4) — Motivation §Out of scope [S] new chess collectors, evidence kinds, grading, hint selection and module layout excluded; Motivation §Out of scope [S] LLM prompting/retrieval, bulk claim authoring, the 60 explorer fetches, graduation transitions; Motivation §Out of scope [S] no rule for deciding strategic significance — meaning only, not usefulness; §6 [S] optional LLM paraphrase of sealed clauses deferred; no inference, selection or entailment

**`exact-legal-mobility`** (4) — Status [S] display-layer castling constant unnamed; only two of D1029's three layers land; §4 [S] safe/good/best hover colours refused; exact legality is only their floor; §4 [S] both-colour turn clones, operand-scoped wrappers and destination-only output refused; Changelog 2026-08-23 [W] criterion 12 relaxed: clone/bounded-search sites need a named reason, not set-equality

**`runtime-opening-identity`** (4) — §6 refusal 2 [S] "Out of book" is refused; neither endpoint nor prefix absence owns that convention; §4 [S] No client-supplied arbitrary-history endpoint; the history derivation stays an internal adapter; §1.1 [S] Source refresh is an explicit later update, never an implicit fetch during install, CI or start; Open questions #2 [Q] Defining "out of book", comparing observed history to source move order, and exposing descendant families all deferred

**`archive/content-sourcing-foundation`** (3) — Motivation (Out of scope) [S] Automatic lesson generation from mined material; ADR-0001 / law 8; §1.4 [S] Cross-checkout/cross-machine fetch coordination left as an operator responsibility; Deviations from design #3 [D] --learner-side is a required human input; start.side is not derivable from the source

**`archive/n-way-comparison`** (3) — §Motivation (out of scope) [S] step-indexed reasoning transcript not specified here; §Motivation (out of scope) [S] intent_capture interactions excluded; they carry authored plan classes; Changelog 2026-08-13 (adversarial review) [W] A6 no longer asserts the prediction event appears on the public events page

**`archive/onramp-guard`** (3) — §Motivation Out of scope [S] pre-commit guard form excluded; it is invariant-review material; §Motivation Out of scope [S] no authored on-ramp pack ships; the knob merely exists again; §4 [S] no live out-of-band evaluation, no new evidence-ref kinds, event types, tables or endpoints

**`archive/open-answer-grading`** (3) — §Motivation Out of scope [S] ChessMotive's concrete-calculation row dropped; it needs a both-colours line editor; §Motivation Out of scope [S] no automated assessment of transcript quality and no cross-learner transcript comparison; §Motivation Out of scope [S] authored model transcript to diff against excluded; the axis stays you-vs-you

**`archive/opponent-contracts`** (3) — §2.5 [S] the two out-of-tablebase packs untouched; no authoring refusal added for them; Open questions #3 [Q] practical_resistance's refusal frequency unmeasured; deferred to a follow-up measurement; Open questions #5 [Q] cursed-win replies excluded from drawn roots; flagged unmeasured and deliberately unfixed

**`archive/pack-studio`** (3) — §Out of scope [S] visual/form pack editing not built; the command loop was not the measured bottleneck; §Out of scope [S] automatic candidate selection or ranking, any authoring LLM, and corpus mining excluded; §4b [S] graduation gate stays author-declared; nothing stops an author clearing blockers untruthfully

**`archive/runtime-corpus-evidence`** (3) — Motivation [S] named-opening catalog browsing and any Learn-surface browse UI consume the source later; §10 [S] batch sourcing client, disk cache, retry ladder, sourcing-check and authoring crossing untouched; §10 [S] no run event, evidence kind, schema field or migration for corpus views

**`archive/semantic-evidence-selection`** (3) — §4 [S] no fork, pin, skewer, hanging, prophylaxis, plan, space or move-quality events declared; §4 [S] no valence inferred from sign, rarity, lift, engine prose, Maia or Explorer; Resource claims [S] persisting selected packets would return the RFC to author; no run-schema lane claimed

**`archive/terminal-outcome-events`** (3) — Motivation §Out of scope [S] outcome.reached for resignation, timeout or agreed draw — no such runtime concepts; Motivation / §5 [S] no retroactive emission or backfill; already-terminal stored runs stay withheld forever; Changelog 2026-08-12 [W] criterion 12 reworded from "migration is a no-op" to event-log replay compatibility

**`bot-policy`** (3) — §9 [S] weakened-Stockfish sampling, human-likeness claims and ungrounded persona prose refused; §9 [S] multi-band runtime Maia queries refused on D817's measurement; Open questions #2 [Q] which bands the Human baseline exposes; to be settled at acceptance

**`campaign-core`** (3) — Deviations 1 [D] map fixed at 3 acts × 3 layers × <=3 choices where design/06 is prose; Open questions #2 [Q] owner veto window on the §2a second-axis reading; proceeding on the claude-derived reading; Open questions #3 [Q] whether abandoning an encounter should itself cost charges; shipped as free

**`intent-presets`** (3) — Motivation [S] Any change to authored pack bytes; §6 [S] Run lane 0.19 and a preset.changed event explicitly not claimed; mid-run preset change is not a run event; §8.3 / Ledger D944 [S] Unifying the three role vocabularies is real future work nobody owns yet

**`semantic-collectors`** (3) — Deviations 1 [D] Research timing/answer vocabulary mapped onto the shipped closed unions with no member added; Deviations 4 [D] Mixed-grounding derived rows declare declared_convention, narrower than the matrix's recorded_run/tablebase_exact; Changelog 2026-08-22 [W] C6 drops the harness's 26 and 13 three-edge counts from this RFC's reproduction targets

**`accessible-board-input`** (2) — §4 [S] Assistive grid announces no engine evaluation, detector output, attacks, hints or hidden evidence; §5 [S] Text move entry is a move-input fallback only, never a command console or analysis field

**`archive/assistance-control-wiring`** (2) — Motivation (Out of scope) [S] Detector admission, marker selection, new evidence, learner ratings and any automatic reveal; §3 [S] Rating-driven fade of guided mode not implemented; which shapes a pack loads unchanged

**`archive/assistance-controls`** (2) — Motivation §Scope (out of scope table) [S] New forms — arrows, spoken, ambient — and any new detector; §2.6 [S] Reveal never auto-opens, never pre-fetches split or corpus, adds no keyboard binding

**`archive/defect-batch-2`** (2) — §4 [S] Four committed candidates not regenerated; churn would move digests for zero information; §4 [S] No phase filter control invented for the Learn IA; only an "unclassified" label asserted

**`archive/orphan-completion`** (2) — §2b [S] hand-placed-root fact only named in graduationBlockers; this RFC ships no new lint; §3 [S] cross-learner recommendation claims excluded permanently; no skill or weakness vocabulary

**`archive/outcome-drill-grading`** (2) — §9 [S] per-node "still holding" grading impossible; exactness buys only the root claim; Deviations #4 [D] compiled state machine narrower than the runtime's; global narrowing left as a separate change

**`archive/rfc-lifecycle-completion`** (2) — Motivation [S] the `make work-index` routing invariant excluded — different input, join and failure; §8 [S] declines any judgement on a specific RFC's current lifecycle status

**`archive/social-match`** (2) — §2.3 [S] native clocks and any timed mode refused; needs a wall-clock scheduler; §2.3 [S] resignation and agreed draws as run events not added; the event union stays closed

**`live-sources`** (2) — §5 [S] No relay operation — no push/url/ids/users sync sources, no organiser delay config, no OAuth; Open questions #1 [Q] Justification order — should casting lead, reopening the B5 audience gate; sequences Phase B vs casting

**`move-quality-grades`** (2) — Motivation [S] Persistence of grades anywhere; a grade is never stored; §3 [S] Deeper mate horizons and practice-mode's coerced-mate mapping refused; only three tiers ship

**`0000-rfc-process`** (1) — Changelog 2026-08-09 [S] docs/ tier deferred until code exists; created only by the first implementing change

**`archive/explanation-grounds`** (1) — Motivation [S] Authored claims, timing windows, `provenanceMode`, feedback packets, per-scope reveal, LLM rendering

**`archive/return-and-progression`** (1) — §3 Scope boundary [S] per-move learner attribution excluded; attempts attribute to the run owner

**`review-evidence-compiler`** (1) — §1.1 [S] Legacy rows without engine identity/version stay inspector-readable but abstain from every projection here

---

## 5. Deferrals whose destination is a document that does not exist — 154 prose rows

The 13 Discharges rows are listed in §3. The 154 prose rows follow. Every `destination named`
cell was checked against the filesystem at HEAD; none resolves.

### 5.1 The full list

| # | source RFC | section | kind | what was deferred | owner | destination named | verified state |
|---|---|---|---|---|---|---|---|
| 1 | `archive/adaptive-guidance` | §4e | S | Evaluated "reasonable continuations" option-collapse detector; must arrive as attributed rung-2/3 evidence | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 2 | `archive/adaptive-guidance` | §3d | S | Cross-device assistance preferences; that later RFC owns the migration | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 3 | `archive/assistance-controls` | Open questions #2 | Q | Whether a pack-loaded run sees the whole shape catalogue or only its declared subset | `nobody` | new ledger row ([[D1075]]) | **absent at HEAD** |
| 4 | `archive/authored-explanation-surface` | Motivation (Out of scope) | S | Claim `when:` triggers and therefore feedbackClaims delivery; anchoring is a separate contract | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 5 | `archive/authored-feedback-delivery` | Motivation | S | Serving withheld authored content back; blocked on per-scope reveal existing first | `nobody` | next slice | **absent at HEAD** |
| 6 | `archive/authoring-frictions` | Motivation (Explicitly out of scope) | S | intent_capture's validated-answer slot; needs run event, schema bump, migration, client surface | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 7 | `archive/authoring-frictions` | §3 | S | atStart fires once per run, not per branch; rewind-and-fork re-asking needs a new orchestration entry point | `nobody` | the intent_capture grading RFC | **absent at HEAD** |
| 8 | `archive/authoring-frictions` | Open questions #6 | Q | intent_capture validated-answer slot deferred to a named future RFC, next in sequence | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 9 | `archive/branch-groups` | Motivation (Explicitly out of scope) | S | Opening variants from corpus as a live rung-4 seed source; union closed at four members | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 10 | `archive/branch-runtime` | Motivation | S | Engine/Maia workers, feedback composition, any UI | `nobody` | own RFCs | **absent at HEAD** |
| 11 | `archive/branch-runtime` | Resolved decision and deferred question | Q | clockState semantics (time-pressure dimension) deferred to a future RFC | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 12 | `archive/claim-backing` | Scope (Explicitly out of scope) | S | Authoring the bindings themselves; not one binding is authored here | `nobody` | an authoring pass | **absent at HEAD** |
| 13 | `archive/client-surface-floor` | §8 | S | Compare geometry / eight-way compare desktop overflow (D63); CompareView left unmodified | `nobody` | UNNAMED-FUTURE-RFC (rfc/compare-geometry.md does not exist) | **absent at HEAD** |
| 14 | `archive/client-surface-floor` | §8 | S | Whether the /compare route is viewport-contained | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 15 | `archive/content-sourcing-explorer` | Motivation (Out of scope) / §5 | S | Offline explorer table built from database.lichess.org monthly dumps; carved out entirely | `nobody` | content-sourcing-offline-explorer.md (unwritten) | **absent at HEAD** |
| 16 | `archive/content-sourcing-foundation` | Motivation (Out of scope) | S | Wikibooks/Wikipedia CC BY-SA prose ingestion; a fifth pipeline, unscheduled | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 17 | `archive/content-sourcing-position-seeds` | §3 | S | feedbackClaims, planClasses and deviations left unwritten; the pipeline never will | `nobody` | an author | **absent at HEAD** |
| 18 | `archive/dead-vocabulary` | Open questions #1 | Q | Whether the `runtime:` namespace joins FORMAT_DISPOSITIONS; explicitly not claimed | `nobody` | whichever RFC next edits dispositions.ts | **absent at HEAD** |
| 19 | `archive/dead-vocabulary` | Open questions #3 | Q | Whether authoring-issue codes become a fifth namespace; needs a `PackIssueCode` union | `nobody` | whichever RFC next owns pack-validation.ts | **absent at HEAD** |
| 20 | `archive/dead-vocabulary` | §2 residuals | S | D84 leg (c) revisit until a directed structural primitive exists | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 21 | `archive/deviation-classes` | Header coordinator ruling | S | `cost` ships author-declared and unbacked; binding it to engine evidence left to a later RFC | `claude` | UNNAMED-FUTURE-RFC (own ledger row) | **absent at HEAD** |
| 22 | `archive/drill-client` | Motivation | S | Prediction-checkpoint and intent-capture interactions; schema exists, UI deferred | `nobody` | a follow-up | **absent at HEAD** |
| 23 | `archive/drill-client` | Open questions #2 | Q | Intent-capture and prediction-checkpoint UI await the feedback composer | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 24 | `archive/drill-pack-format` | Motivation | S | Trajectory `transitions` shape | `nobody` | trajectory-transitions follow-up RFC | **absent at HEAD** |
| 25 | `archive/drill-pack-format` | Open questions #1 | Q | Trajectory `transitions` causal-integrity encoding, follow-up not yet drafted | `nobody` | trajectory-transitions RFC | **absent at HEAD** |
| 26 | `archive/engine-leverage` | §3.3 | S | `human_outcome_share` refused pending `corpus_observed` and a C1-satisfying producer | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 27 | `archive/engine-request-contract` | §11 | S | D67's band-indifferent `sameEngine` not fixed; a migration-shaped question for its own RFC | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 28 | `archive/engine-request-contract` | Open questions 2 | Q | Whether `strong_engine` moves from movetime to a fixed depth; changes opponent strength | `nobody` | its own RFC or a ledger row | **absent at HEAD** |
| 29 | `archive/engine-request-contract` | Open questions 5 | Q | Whether already-stored engine evidence needs re-grounding after the reset lands | `OWNER` | its own RFC (a content operation) | **absent at HEAD** |
| 30 | `archive/engine-workers` | Motivation | S | Syzygy adapter and the plan_defense/practical_resistance/perfect_tablebase/human_external modes | `nobody` | follow-up RFCs | **absent at HEAD** |
| 31 | `archive/evidence-contract-manifest` | §3 Scope boundaries | S | Theory scraper, retrieval index or runtime knowledge bundle | `nobody` | F4/F7 | **absent at HEAD** |
| 32 | `archive/evidence-contract-manifest` | §14 | S | Runtime `EvidenceKind` stays the event transport vocabulary until a later schema RFC | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 33 | `archive/evidence-contract-manifest` | §5 / §11 | S | Workflow ceilings, requested presets and future per-kind ceilings are not compiler inputs yet | `nobody` | F5/F11 | **absent at HEAD** |
| 34 | `archive/expression-census` | §3a | S | `structuralIssuesInPack` not widened to the windowClosing and key-point-ground arms | `nobody` | whichever RFC authors the first instance | **absent at HEAD** |
| 35 | `archive/format-surface` | §3.1 | S | `arrows` left `unmeasured`; no directed structural primitive minted (design-tier change) | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 36 | `archive/format-surface` | Open questions 1 | Q | Register completeness unmeasured; a census extension is recommended and not claimed | `nobody` | a follow-up extending `make expression-census` | **absent at HEAD** |
| 37 | `archive/grounding-pair` | Motivation Out of scope | S | Rewriting the six wave-5b drafts' authored text; content tier | `nobody` | the authoring agent's territory | **absent at HEAD** |
| 38 | `archive/line-drill-theory-grading` | §3 Out of scope | S | A theory/idea score; aggregation over verdicts left to a later RFC with a consumer | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 39 | `archive/line-drill-theory-grading` | §3b | S | A frontier shorthand would need a new `frontierNodeIds` field and its own RFC | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 40 | `archive/line-drill-theory-grading` | Deviations 1 | D | design/01's "theory/idea score" not shipped; per-ply verdicts only | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 41 | `archive/onramp-guard` | §1e | S | pin and recapture logic for the en-prise tier left to a future rung-0 widening | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 42 | `archive/onramp-guard` | §1e | S | the 3-unit material floor is fixed in code; changing it needs a future RFC | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 43 | `archive/open-answer-grading` | §3 | S | no product-global synonym table, stemming, lemmatizer, embedding or fuzzy-match layer may be added | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 44 | `archive/opening-evidence-path` | Banner (open question 7 closed) | S | /deviations/{i}/cost ships author-declared and unbacked; binding it left to a later RFC | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 45 | `archive/opening-evidence-path` | Open questions #5 | Q | lifting assessedBy out of grading named, not taken; inert resolveAt wart stays | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 46 | `archive/opening-evidence-path` | Open questions #7 | Q | evidence admission for /deviations/{i}/cost unclaimed by either RFC | `nobody` | design/BACKLOG.md row or a named follow-up RFC | **absent at HEAD** |
| 47 | `archive/outcome-drill-grading` | §3 Scope boundary | S | runtime tablebase client excluded; mid-run probing is an engine/sourcing RFC | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 48 | `archive/pack-graduation` | Open questions #4 | Q | renaming graduationBlockers deferred to any future RFC touching every emitter | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 49 | `archive/polish-surfaces` | §4 | S | no service worker; read-only app-shell cache excluded as scope, left as a later RFC's ceiling | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 50 | `archive/portable-account-data` | §Motivation Out of scope | S | server backup, restore and expiry excluded | `planning/platform-alignment/release-platform/f12-work-order.md` | F12-C | **absent at HEAD** |
| 51 | `archive/portable-account-data` | §3 | S | configured backup-retention sentence unavailable; F12-H refuses 1.0 until it lands | `planning/platform-alignment/release-platform/f12-work-order.md` | F12-C | **absent at HEAD** |
| 52 | `archive/predicate-wave-2` | §1 | S | diagonal and virtual opposition and a raw king_distance leaf refused; enum widens when a plan names one | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 53 | `archive/predicate-wave-3` | §Motivation 4 Scope boundary | S | intent_capture's validated-answer slot not claimed; needs run event, migration and client surface | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 54 | `archive/predicate-wave-3` | §1a | S | pawn_count and piece_reach_count scope:"every" only warned; schema removal deferred to wave 4 | `nobody` | predicate wave 4 | **absent at HEAD** |
| 55 | `archive/predicate-wave-3` | §7 F1 | S | intent-relative grading refused; the declaration is unrecorded and the ceiling is 45% | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 56 | `archive/predicate-wave-3` | §7 F4 | S | transition-predicate grammar refused this wave; specified for a follow-on with a promotion trigger | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 57 | `archive/predicate-wave-3` | §7 F7 | S | pawn colour-complex and pawn-fixedness censuses deferred; six notes measured | `nobody` | predicate wave 4 | **absent at HEAD** |
| 58 | `archive/predicate-wave-3` | §7 F10 | S | practical_difficulty success condition declined; routed to the first draft after resistance-spectrum | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 59 | `archive/predicate-wave-3` | Open questions #4 | Q | registry-sweep tooling for wave 4's schema removals does not exist | `nobody` | predicate wave 4 | **absent at HEAD** |
| 60 | `archive/predicate-wave-3` | Open questions #7 | Q | whether a rung-2 practical_difficulty condition belongs in the vocabulary lane | `OWNER` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 61 | `archive/predicate-wave-3` | Open questions #10 | Q | piece_distance targets cannot name "the passed pawn"; a target predicate left to a later wave | `nobody` | predicate wave 4 | **absent at HEAD** |
| 62 | `archive/resistance-spectrum` | §7c | S | explorer-seeded resistance not built; needs a mode name, pinned window and coverage | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 63 | `archive/resistance-spectrum` | Open questions #4 | Q | whether save packs may require an honored band; deferred to §7a's draft | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 64 | `archive/semantic-evidence-selection` | §4 | S | F3 migration, F4 theory retrieval, F5 presentation, F6 Review Map, F8 bots, F9 metrics unimplemented | `nobody` | F3/F4/F5/F6/F8/F9 RFCs | **absent at HEAD** |
| 65 | `archive/semantic-evidence-selection` | §7 | S | seven non-round-trip structural families refused as learner events at v1; successors need new ids | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 66 | `archive/semantic-evidence-selection` | §12 | S | Compare keeps its raw strip until F6 or a follow-up; D78 stays open | `nobody` | F6 Review Map RFC | **absent at HEAD** |
| 67 | `archive/shape-library` | §5a | S | no store of what markers a learner historically saw; a later SRS/B10 RFC designs it | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 68 | `archive/teacher-surface` | Open questions #2 | Q | teacher-initiated observation requests — a pressure surface; deferred to a follow-up RFC | `OWNER` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 69 | `archive/tempo-vocabulary` | §4.1 | S | fifth `reasoningKeyPoint` ground `{kind:"timing"}` not shipped | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 70 | `archive/tempo-vocabulary` | Open questions #1 | Q | whether a window verdict becomes a persisted event; trigger is the first cross-run consumer | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 71 | `archive/tempo-vocabulary` | Open questions #3 | Q | a `{kind:"timing"}` reasoning ground deferred to whichever RFC next opens that union | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 72 | `archive/transition-primitives` | §7 R2 | S | a `check` leaf refused here as an after-position fact, not a transition property | `nobody` | UNNAMED-FUTURE-RFC (a static wave) | **absent at HEAD** |
| 73 | `archive/transition-primitives` | §7 R7 | S | a static `defended_duties` position leaf refused for this wave on zero attestations | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 74 | `archive/transition-primitives` | §7 R8 | S | `mover`, `mirrored`, `quantified` nodes and region control delta refused on zero attestations | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 75 | `archive/transition-primitives` | Open questions #3 | Q | whether the static `defended_duties` count ships as a position leaf | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 76 | `archive/validator-integrity` | §5 | S | per-leg `opponentPolicy` and `shapes` not shipped; runtime honouring is a run-schema conversation | `nobody` | `trajectory-per-leg-resistance` follow-up RFC (pack 0.19) | **absent at HEAD** |
| 77 | `archive/vocabulary-wiring` | §3c | S | `plan_consequence` deprecated by warning, not removed; removal belongs to a later wave | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 78 | `bot-policy` | Motivation §Out of scope | S | the bot-tournament envelope (D708) deferred to O12/F11 | `nobody` | O12/F11 | **absent at HEAD** |
| 79 | `bot-policy` | Motivation §Out of scope | S | pack-side profile references deferred; packs keep `opponentPolicy` untouched | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 80 | `bot-policy` | §2.6 | S | MemoryPolicy reserved and off; cross-game memory needs its own RFC under O13/F12 | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 81 | `bot-policy` | §2.7 | S | no timing layer, no delays; `guard.endgame_floor` named but unregistered and unmeasured | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 82 | `bot-policy` | Open questions #3 | Q | pack-side profile references explicitly deferred to a future RFC | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 83 | `bot-policy` | Open questions #4 | Q | the endgame floor layer deferred to its own measurement and registration | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 84 | `breadth-collectors` | tabiya-claims note | S | the authorable-pack-vocabulary decision left to a later separate RFC | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 85 | `breadth-collectors` | §3.7 | S | castling-to-more-shelter left as a later derived/module join, not an operand here | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 86 | `campaign-core` | Motivation / Discharge scope | S | the Act II rated boss deferred; needs learner-rating and resolves persona/targetElo disjointness | `planning/campaign/` | the D1 amendment | **absent at HEAD** |
| 87 | `campaign-core` | Motivation | S | prediction and survival encounter shapes deferred — no seal mechanism exists at HEAD | `planning/campaign/` | the D2 amendment | **absent at HEAD** |
| 88 | `campaign-core` | §3.5 | S | what prestige *contains* (army building, cosmetic tiers) deferred; only the gate specified | `planning/campaign/` | the D3 successor amendment | **absent at HEAD** |
| 89 | `campaign-core` | Motivation | S | evidence-dark fun nodes, cosmetic rewards and time controls deferred | `planning/campaign/` | the D4 amendment | **absent at HEAD** |
| 90 | `campaign-core` | §5.3 | S | run-schema lane 0.19 for per-run campaign identity named and declined again | `nobody` | the first RFC needing per-run campaign identity | **absent at HEAD** |
| 91 | `feedback-delivery` | §2.1 | S | an authored `at` anchor on feedbackClaim refused for now — a pack lane plus 196-claim wave | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 92 | `feedback-delivery` | Open questions #3 | Q | whether the strip should report lost observations; deferred behind a measurement | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 93 | `feedback-delivery` | Open questions #4 | Q | what eventually anchors a claim — authored `at`, ledger-derived anchor, or stated_reasoning habit | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 94 | `intent-presets` | §6 | S | Server-side per-learner workflow persistence deferred; localStorage is v1's honest scope | `planning/exploration/plan.md` | the future personalization RFC (D2) | **absent at HEAD** |
| 95 | `learner-modules` | Motivation | S | No new collectors; the two grade-family rows are declared-awaiting, not registered | `nobody` | the grade-family RFC | **absent at HEAD** |
| 96 | `learner-modules` | §4.2 | S | `outpost` held out of requested sight until the D566 pawnSafety foundation repair lands | `codex` | the D566 priority defect fix | **absent at HEAD** |
| 97 | `learner-modules` | §4.2 | S | Exact-mobility sight needs a separate exact projection or operand-scoped admission — a proposed ledger row, not invented here | `nobody` | a proposed ledger row | **absent at HEAD** |
| 98 | `learner-modules` | §4.7 | S | Runtime opening identity stays refused; theory_breadcrumb renders honest-empty until the D743/R8/F7 join lands | `R8/F7` | the D743/R8/F7 runtime join | **absent at HEAD** |
| 99 | `learner-modules` | §4.10 | S | Review-Map moment count deliberately not bounded; moment selection is the Phase-4/R7 lane's contract | `planning/evidence-foundation-ux/plan.md` | the Phase-4/R7 lane | **absent at HEAD** |
| 100 | `learner-modules` | §4.10 | S | review.story is not re-based onto module selection; named follow-up work, not absorbed | `planning/evidence-foundation-ux/plan.md` | the Phase-4/R7 lane | **absent at HEAD** |
| 101 | `learner-modules` | §5 | S | Grade-family projection registration is not this RFC's; two rows stay declared-awaiting | `move-quality-grades` | the grade-family RFC (D899) | **absent at HEAD** |
| 102 | `learner-modules` | §5.5 | S | The versioned per-context grade convention document is the grade-family RFC's to write | `move-quality-grades` | the grade-family RFC | **absent at HEAD** |
| 103 | `learner-modules` | Open questions #3 | Q | The grade convention (Lichess win%-drop vs our own, per-context ladders) belongs to the grade-family RFC | `move-quality-grades` | the grade-family RFC (D3) | **absent at HEAD** |
| 104 | `learner-modules` | Open questions #4 | Q | Review Story re-basing onto module selection named as follow-up work for the Phase-4/R7 lane | `planning/evidence-foundation-ux/plan.md` | the Phase-4/R7 lane | **absent at HEAD** |
| 105 | `learner-rating` | §10a.2a | S | Witnessed-play seam pinned only; nothing implemented until a real cohort exists | `a cohort RFC` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 106 | `learner-rating` | Open questions #5 | Q | Does the rating ever select content; refused in v1, needs its own RFC | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 107 | `live-sources` | §6 | S | Live-follow: the round follower, the imported-run growth model, move-0 follows and the D411 assistance lock | `claude` | proposed row D957 / the Phase-B RFC | **absent at HEAD** |
| 108 | `live-sources` | §6 | S | Casting composition over the stream session and overlay, blocked on the owner's B5 justification ruling | `OWNER` | proposed row D958 | **absent at HEAD** |
| 109 | `live-sources` | §2 | S | Following a board from move 0 is Phase B's growth model, not a requireMoves exception here | `claude` | the Phase-B RFC | **absent at HEAD** |
| 110 | `live-sources` | §3 | S | The paste path keeps storing third-party annotations verbatim; recorded rather than fixed | `nobody` | proposed row D959 | **absent at HEAD** |
| 111 | `live-sources` | Open questions #2 | Q | Facet vs kind for the D411 lock deferred to D957's RFC with the recommendation recorded, not decided | `OWNER` | D957's Phase-B RFC | **absent at HEAD** |
| 112 | `longitudinal-store` | Scope boundary | S | No habit cards, skill credits, milestones, tips or style axes | `nobody` | the F6/F9 consumer RFCs | **absent at HEAD** |
| 113 | `longitudinal-store` | §3 | S | Producers outside the semantic-event set (shape firings, tablebase, clock spend, explorer joins) not ingested at landing | `nobody` | a future rev bump | **absent at HEAD** |
| 114 | `longitudinal-store` | §5.4 | S | No stored cross-game total, credit or tier; belongs to the F9 RFC that can validate it | `F9 RFC` | the F9 RFC | **absent at HEAD** |
| 115 | `longitudinal-store` | §6.1 | S | Six future consumers registered and named but not built here | `F6/F9 lanes` | their own RFCs | **absent at HEAD** |
| 116 | `longitudinal-store` | §9.3 | S | Whether a future importer rebuilds or trusts exported aggregates decided for neither side | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 117 | `longitudinal-store` | §4.3 | S | The crash window between run persist and projection accepted; moving replace into the run transaction left to a future consumer | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 118 | `longitudinal-store` | Open questions #1 | Q | Does theory.shapes join the ingest set in v1 — proposal: no at landing, yes at the first rev bump | `nobody` | the first post-landing rev bump | **absent at HEAD** |
| 119 | `longitudinal-store` | Open questions #2 | Q | Bulk-import scale unmeasured; accept without a cap and let a future rev window or side-table the refs | `nobody` | a future rev | **absent at HEAD** |
| 120 | `measurement-records` | Scope boundary | S | The explorer-side authoring warning (D151) routed to the explorer wave | `the explorer wave` | the explorer wave | **absent at HEAD** |
| 121 | `measurement-records` | Scope boundary | S | Position-anchored claims ruled out of scope in writing; flagged but never re-derivable | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 122 | `measurement-records` | §8 | S | The follow-on content wave (263 residue tokens plus prose authoring) is separate work | `nobody` | a later content wave | **absent at HEAD** |
| 123 | `measurement-records` | §9 | S | D386's position instrument would be a second instrument species and is not built | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 124 | `move-quality-grades` | Motivation | S | Accuracy%/game-level aggregates and the eval graph | `D880/D928` | D928's family-local selector RFC | **absent at HEAD** |
| 125 | `move-quality-grades` | Motivation | S | The mate-in-N availability/"Miss" collector — a separate producer | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 126 | `move-quality-grades` | Open questions #2 | Q | May a grade fire Review-moment selection — deferred to D928's family-local selector RFC | `D928` | D928's selector RFC | **absent at HEAD** |
| 127 | `pack-capability-contract` | Motivation | S | Applying the corpus plan; the D560 content hold stands and the applier writes nothing until it lifts | `nobody` | the hold's graduation arm | **absent at HEAD** |
| 128 | `pack-capability-contract` | Motivation | S | Detector semantics v1 (Gate F clause 4) — a separate document | `nobody` | a separate document | **absent at HEAD** |
| 129 | `pack-population-provenance` | Motivation | S | Anything in the shape-entry or run schema; D103 belongs to RFC-6 | `RFC-6 shape-layer-parity` | RFC-6 (shape-layer-parity) | **absent at HEAD** |
| 130 | `pack-population-provenance` | §7 | S | deviationCost gets no corpus basis; the growth of `unmeasurable` is only a ledger row | `nobody` | proposed row D533 | **absent at HEAD** |
| 131 | `pack-population-provenance` | Open questions Q2 | Q | Should corpusEvidence become required at a later lane — unanswerable until an official shelf exists | `nobody` | whichever RFC first has a non-empty official shelf | **absent at HEAD** |
| 132 | `play-composition` | Motivation | S | Review-map moment selection and the Story re-basing stay in their named lanes | `nobody` | the D901 lane | **absent at HEAD** |
| 133 | `play-composition` | Motivation | S | No theming lane and no animation lane; obligations to them are hooks only | `claude` | the D839/D840 lane (D3) | **absent at HEAD** |
| 134 | `play-composition` | §4.5 | S | The system-arrow vector producer remains unbuilt and is not declared here | `planning/evidence-foundation-ux/plan.md` | the D546/D900 lane (D2) | **absent at HEAD** |
| 135 | `play-composition` | §3.4 | S | The animation preference and felt-quality verification stay with the D840 lane; only the defeat is removed | `claude` | the D839/D840 lane | **absent at HEAD** |
| 136 | `review-evidence-compiler` | §1.2 | S | No WDL delta or grade lands here; any subtraction or threshold must be a later selector's own projection | `Review Map successor` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 137 | `review-evidence-compiler` | §3.2 | S | Adding beforeFen/afterFen as declared operands left to a later pass as a declared manifest delta | `nobody` | a later pass | **absent at HEAD** |
| 138 | `review-evidence-compiler` | §5 | S | eval_pivot keeps the absolute 150-cp convention until the Review Map policy replaces it | `Review Map successor` | the Review Map RFC | **absent at HEAD** |
| 139 | `review-evidence-compiler` | §6 | S | This RFC compiles candidates and does not claim which moments teach best; no universal numeric score | `Review Map successor` | D928 / the Review Map RFC (D1) | **absent at HEAD** |
| 140 | `review-evidence-compiler` | Open questions | Q | D928's final Review Map quotas and priority deliberately not chosen — C4 measured overlap, not usefulness | `Review Map successor` | D928's Review Map RFC | **absent at HEAD** |
| 141 | `runtime-opening-identity` | §6 refusal 6 | S | No book policy; identity never selects a legal move, bots may consume a separate projection later | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 142 | `runtime-opening-identity` | §6 refusal 8 | S | No longitudinal claim — accuracy-by-opening and style need the observation store and their own RFC | `longitudinal-store` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 143 | `semantic-collectors` | Motivation | S | Story mate-type repair and the multi-source post-game Review compiler (D917/D918) cited, not absorbed | `review-evidence-compiler` | the Review successor RFC (D2) | **absent at HEAD** |
| 144 | `semantic-collectors` | Motivation | S | Bot policy (F8), habit aggregation (F9), content work and corpus expansion (Gate F) | `nobody` | F8 / F9 / Gate F | **absent at HEAD** |
| 145 | `semantic-collectors` | §5.1 | S | Habit classification receives zero rows until denominators, sample floors and the longitudinal store exist | `F9` | F9 | **absent at HEAD** |
| 146 | `semantic-collectors` | §3.6 | S | Mate horizons of five-plus attacker moves outside mate-proof@1; need a later versioned proof tree | `nobody` | the D2 lane / a later contract | **absent at HEAD** |
| 147 | `semantic-collectors` | §4 | S | Five of the 20 matrix rows assigned to owning RFCs rather than absorbed | `those RFCs` | the Review successor and the runtime opening RFC | **absent at HEAD** |
| 148 | `semantic-collectors` | Open questions #2 | Q | Deeper mate horizons — an offline budget or a typed engine mate authority; the D2 lane decides | `review-evidence-compiler` | the D2 lane | **absent at HEAD** |
| 149 | `semantic-collectors` | Open questions #3 | Q | Quiet zwischenzugs and all-reply-qualified consequence variants are separately versioned future contracts | `nobody` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 150 | `semantic-collectors` | Open questions #4 | Q | Authorable pack vocabulary for these families deferred exactly as Wave A deferred it | `nobody` | a follow-up claiming the pack lane | **absent at HEAD** |
| 151 | `tactical-collectors` | §3.6 | S | Recorded-run salience operands removed from the threat projection; a later separately grounded derivation | `D815` | D815's future projection | **absent at HEAD** |
| 152 | `tactical-collectors` | §3.10 | S | Generic rook `cutOff` deleted; joining king-mobility/square-control evidence left to a later module | `a later module` | UNNAMED-FUTURE-RFC | **absent at HEAD** |
| 153 | `tactical-collectors` | §3.15 | S | Runtime opening identity deferred to D743/R8/F7 — not an item, projection, criterion or discharge here | `R8/F7` | the later R8/F7 RFC | **absent at HEAD** |
| 154 | `tactical-collectors` | Open questions #2 | Q | The authorable-vocabulary follow-up must claim a pack lane and extend kinds, schema arms and witnesses | `nobody` | a follow-up RFC | **absent at HEAD** |

---

## 6. Deferrals owned by `OWNER` that are in no decision queue — 163

`planning/platform-alignment/decision-queue.md` is the file whose stated purpose is to *"record the
choices evidence cannot make."* It holds **15 numbered rows (O0–O14)** plus an addendum of six
unruled refusals and four late-added rows.

**153 prose deferrals name `OWNER` as the owner. Exactly one cites a D-id the queue holds.** Add
the 11 open `OWNER`-owned Discharges rows — of which the queue holds **zero** — and **163 owner
decisions sit outside the only file that exists to collect them.**

### 6.1 The 11 open `OWNER` Discharges rows, none in the queue

| source RFC | id | the decision the owner owes | destination named | in queue? |
|---|---|---|---|---|
| `accessible-board-input` | D3 | §11 owner validation run on the owner's own devices, logged with device/browser/AT and failures | `planning/platform-alignment/log.md` | no |
| `bot-policy` | D4 | The human-scale anchor: anchor accounts vs learner-derived Glicko vs stay band-relative. Until ruled, **no absolute human Elo is stated anywhere** | `planning/exploration/log.md` ruling entry | no |
| `bot-policy` | D5 | Owner-use roster validation via the retained 42-branch blind packet (O8.5) | `planning/platform-alignment/bot-policy/` | no |
| `feedback-delivery` | D1 | The binding wave — 63 mandatory pack edits, a 60-claim explorer census, a 36-claim tablebase pass. **Commissioning a content wave is an owner act** | `planning/content-era/log.md` | no |
| `intent-presets` | D1 | Owner-use validation of every `candidate` preset — names, labels, promises, defaults, the Support-offering set. Until ruled, **candidates ship as candidates** | the log entries recording the rulings | no |
| `live-sources` | D2 | Casting composition ([[D705]]), blocked on the owner's B5 justification ruling | `planning/live-sources/` | no |
| `live-sources` | D3 | The [[D412]] events-row clause in `design/03` — law 5, owner ruling at acceptance or severed | `planning/live-sources/` | no |
| `pack-population-provenance` | D1 | Populate `provenance.corpusEvidence` across all 92 packs — authored judgement, not a mechanical edit; **what turns P1's 92 warnings into zero** | `planning/content-era/log.md` + ledger flips | no |
| `review-evidence-compiler` | D3 | Learner usefulness of the selected Review moments; external panels descoped by [[D649]], so owner use is the only remaining evidence | dated owner-use evidence in `planning/exploration/log.md` | no |
| `theming` | D1 | Owner picks the shipped roster — second piece set, additional board theme, `--warning` repair, olive-square choice (Open questions 1–3 resolve here) | logged rulings after real sessions | no |
| `theming` | D5 | Felt-quality verification; [[D840]] flips on a real session, not on green tests | the play-session log entry | no |

Nine of the eleven are **validation-by-use** obligations — they resolve only when the owner plays
the thing. That is the correct design (memory: *validation by use, not ceremony*), and it is also
why they are invisible: a queue of decisions is the wrong shape for a queue of sessions, so they
were put in neither.

### 6.2 The 152 prose deferrals naming `OWNER`, grouped by source RFC

Format: `§anchor [KIND] what was cut → destination named`.

**`theming`** (13) — §3.2 [S] Labels and Tabiya-authored value adjustments ship as validation candidates behind the owner-use gate → Discharge D1 / owner-use gate; §3.3 [S] Inherited palettes are measured and published rather than gated to WCAG AA → NONE; §7 [S] The specific second piece set is the owner's pick; the RFC pins only the count and the licence rule → Open question 1; §8 [S] Felt-quality verification is the owner's; D840 flips on a real session, not on green tests → the play-session log entry (D5); §8 [S] Play-composition's post-commit on-board echo question inherited and deferred to the same felt pass → the D5 pass; §9 [S] In-play picker entry is a candidate; v1 ships Settings-only with one link from the board region → Open question 2; Deviations 1 [D] design/03's Settings row does not name appearance; proposed as row B rather than edited here (law 5) → design/03-product-breadth.md; Open questions #1 [Q] Which second piece set and optional third board theme ships — owner pick from the licensed list → Discharge D1; Open questions #2 [Q] In-play picker entry — owner confirms or kills the board-menu entry in use → Discharge D1; Open questions #3 [Q] Does a `slow` animation level exist — v1 ships three, adding a fourth is one constant → Discharge D1; Open questions #4 [Q] Selection-sight has no identity of its own; separating it needs a new brush id — named and declined for v1 → the D5 felt pass; Changelog 2026-08-22 (D977) [W] Criterion 11 narrowed to artwork only; the palette arm of the licence criterion removed → NONE; Changelog 2026-08-22 (D977) [W] Version wrapper removed from the theme preference; validation-on-load replaces migration machinery → NONE

**`learner-rating`** (8) — §2 option table [S] strong_engine as a wider instrument deferred until its own rung is measured → Open questions Q3; §5.3a [S] Six changes owed to design/06-campaign.md named, not acted on (law 5) → design/06-campaign.md; §5.4 [S] Tablebase-exact sealing withdrawn; no adjudication of any kind may seal a rated game → Open questions Q9; Deviations 1 [D] Rated play narrows design/06's [1000,2400] band to [1000,2200], refusing 2400 on D338 → design/06-campaign.md; Open questions #3 [Q] Does strong_engine join the ladder; requires its own rung measurement first → NONE; Open questions #7 [Q] Which branch if the owner rules on submitted-path semantics; this RFC would not follow (b) → NONE; Open questions #8 [Q] Does voiding on rewind price experimentation — owner confirmation of the reading → NONE; Open questions #9 [Q] Should a tablebase-exact result seal a rated game as a disclosed adjudication → NONE

**`archive/authoring-frictions`** (6) — Deviations from design #1 [D] Ledger's requested python-chess walker declined; TypeScript walker ships instead → design/research/stack-selection.md; Deviations from design #3 [D] Cursed-win/blessed-loss design-tier text left unwritten; deliberately not pre-empted → design/01-training-model.md §Outcome types; Open questions #1 [Q] Whether 40 is the right branchLengthTarget ceiling; 66-ply single-segment B+N stays impossible → NONE; Open questions #2 [Q] Whether the owner wants python-chess blessed anyway for authoring tools → design/research/stack-selection.md; Open questions #3 [Q] Whether `hold` should admit `cursed-win` roots; one table entry and a fifth refusal code → NONE; Open questions #4 [Q] Whether one-per-run atStart firing is acceptable; per-branch firing needs another entry point → NONE

**`archive/expression-census`** (6) — §7c [S] `STRUCTURAL_EXPRESSION_UNSATISFIABLE` withheld from `pack-check`'s 38 pack-hosted expression sites → Open question 10; Open questions 1 [Q] Whether `FIRES_ON_DEGENERATE` earns error severity; opt-out would need a schema field → NONE; Open questions 4 [Q] CI report job refused for now; needs an owner who reads the artifact → NONE; Open questions 5 [Q] How far the refutation rule set grows; the soundness bar is an owner question → NONE; Open questions 8 [Q] Whether positive-polarity `NEVER_PRESENT` drops to a warning; changes another RFC's severity → rfc/transition-primitives.md; Open questions 10 [Q] When satisfiability refusal reaches pack-hosted expressions; adds a refusal to a shipped gate → NONE

**`archive/claim-backing`** (5) — §3.10 [S] Eighth `provenance_note` evidenceTypes member for authoring-disclosure claims not claimed → Open question 6 / design/05 §3; Deviations from design #4 [D] Rung-4 and rung-5 content coexisting in one claim not provided for; ladder question left to design amendment → design/05-in-run-experience.md; Open questions #4 [Q] Which Bucket 3 claims get a principle and which get an instrument run → NONE; Open questions #7 [Q] Who may add a principle entry, and whether the registry gets a `community` channel → NONE; Changelog 2026-08-16 (round 2) [W] Criterion 11 relaxed from "the five must still fail" to label-refused-but-sentence-deliverable → NONE

**`archive/engine-leverage`** (5) — Motivation Explicitly out of scope [S] D67/D72 — `identityFor` omits `eloApplied`, `sameEngine` ignores it — need an owner → design/BACKLOG.md D67/D72; Open questions 6 [Q] What forces revisit of an `unmeasured` disposition — date, wave boundary or failing test → NONE; Open questions 7 [Q] `stockfish-play` identity filed `refused`; the underlying publication question stays open → design/BACKLOG.md RFC ledger row 1; Open questions 8 [Q] Whether a pack with deviations and no ledger may be published; content-wave or RFC call → NONE; Open questions 9 [Q] Where "materially harder to convert" begins is unmeasured; DTZ arm carries a binding experiment → design/BACKLOG.md D87 experiment

**`feedback-delivery`** (5) — §0.2 [S] the binding wave (63 pack edits plus two instrument runs) is neither authored nor owned here → planning/content-era/log.md; Deviations 4 [D] design/05 §3a-i given an operational reading and flagged for the owner, not settled → design/05-in-run-experience.md; Deviations 5 [D] simultaneous rung-4/rung-5 rendering flagged for the owner; no design/05 amendment made → design/05-in-run-experience.md; Open questions #5 [Q] the binding wave has no named owner; archived claim-backing cannot own execution → criterion 22's commissioning brief; Open questions #8 [Q] 94 principle-reference provenance decisions (63 mandatory, 31 optional) deferred to the wave → the wave's commissioning brief

**`live-sources`** (5) — §6 [S] Casting composition over the stream session and overlay, blocked on the owner's B5 justification ruling → proposed row D958; Deviations from design [D] The D412 events-row clause is proposed, not landed; it rides acceptance or is severed to its own ruling → design/03-product-breadth.md; Open questions #1 [Q] Justification order — should casting lead, reopening the B5 audience gate; sequences Phase B vs casting → NONE; Open questions #2 [Q] Facet vs kind for the D411 lock deferred to D957's RFC with the recommendation recorded, not decided → D957's Phase-B RFC; Open questions #3 [Q] The D412 design clause — ride this acceptance or sever it to its own ruling → design/03-product-breadth.md

**`archive/assistance-controls`** (4) — §4.3 [S] D532's real per-context ceiling returned; must split or adopt F5's compiled workflow input → rfc/intent-presets.md; Deviations from design (law 5) [S] design/05 §6 Q1 should say it governs unrequested assistance; not written by this RFC → design/05-in-run-experience.md ([[D1076]]); Deviations from design (law 5) [S] design/05 §3-forms should define what "own defaults" means per context → design/05-in-run-experience.md ([[D1076]]); Deviations from design (law 5) [S] design/05 §3b should name guided mode's band source or its learner-rating prerequisite → design/05-in-run-experience.md ([[D1076]])

**`archive/defect-sweep`** (4) — §2a [S] Immediate blunder-guard feedback not implemented; needs judge, threshold vocabulary, interrupting surface → design/BACKLOG.md row 3 (proposed §8); §4d / §8 row 5 [S] `position-seeds` omitting `phase` on ambiguous themes left unfixed → design/BACKLOG.md row 5 (proposed); §5 / §8 row 6 [S] `TABIYA_COOKIE_SECURE` default-true breaking plain-HTTP self-hosters left to a separate row → design/BACKLOG.md row 6 (proposed); Deviations 1 [D] The on-ramp band loses the encoding of its pack-declared blunder-guard knob entirely → design/BACKLOG.md row 3

**`archive/engine-request-contract`** (4) — §9 [S] No `bandRange` configured or shipped; the published refusal is honest and nearly toothless → design/BACKLOG.md ledger row 2; Open questions 5 [Q] Whether already-stored engine evidence needs re-grounding after the reset lands → its own RFC (a content operation); Open questions 6 [Q] Who supplies the Elo range and on what ground; mechanism ships without a number → design/BACKLOG.md ledger row 2; Deviations note [D] D60 satisfied mechanically but materially weak; must not be flipped closed on this RFC alone → design/BACKLOG.md ledger row 2

**`archive/evidence-at-runtime`** (4) — Open questions 1 [Q] Whether readings are admitted across packs; 158 shared FENs refused, owner call → NONE; Open questions 2 [Q] Admitting clock-differing tablebase readings when every record at a key agrees → NONE; Open questions 4 [Q] Whether the `content/packs/` promotion blocks; a scheduling call → rfc/pack-graduation.md; Open questions 7 [Q] Whether the provider receives readings at all; owner may decline §3.8's guarantee → NONE

**`archive/live-marker-quality`** (4) — §7 [S] per-kind live marker toggle would need AssistanceConfig version 5 and a migrate arm; not proposed → NONE; Deviations from design [S] live-surface volume budget and admission bar not written into the intent tier → design/05-in-run-experience.md §3a; Open questions #1 [Q] per-kind marker preference deferred, owner-facing, not blocking → NONE; Open questions #6 [Q] no expiry set for grandfathered unmeasured kinds; recorded as known softness → NONE

**`archive/pack-graduation`** (4) — §0.3 [S] curating a subset of packs for promotion refused by the owner by name → NONE; §0.3 [S] reintroducing a pack review workflow refused by the 2026-08-13 owner ruling → NONE; Open questions #1 [Q] whether an unmet gate may land with an empty graduable set → NONE; Open questions #2 [Q] whether the three perfect_tablebase substitution entries and two provider entries become accepted → NONE

**`archive/board-annotation`** (3) — Deviations from design #1 [D] Ships legs (a) and (b) only; leg (c) left with its named gap and design row unsplit → design/05-in-run-experience.md §3-forms; Open questions #1 [Q] Whether the PGN should carry relayed marks attributed via Comment.text; own-only for v1 → NONE; Open questions #3 [Q] Whether a mark may carry text (DrawShape.label / Comment.text); refused in v1 → NONE

**`archive/client-surface-floor`** (3) — Open questions #2 [Q] Whether C2's 992×768 / 900×700 board regression needs a max-height landscape escape → NONE; Open questions #3 [Q] Whether the Evidence region should also hold WhyBanner and OutcomeContext → design/05-in-run-experience.md §3; Open questions #6 [Q] Whether docs/app-shell.md needs a new section or an edit → docs/app-shell.md

**`archive/drill-pack-format`** (3) — Acceptance criteria [S] Pack A authored end-to-end struck from acceptance; foundations first, content last → the content phase; Open questions #2 [Q] Pack content licensing (Q2 content-rights axis) pending owner decision → NONE; Changelog 2026-08-12 [W] Pack A dropped from acceptance criteria by owner ruling; work retained in the backlog → design/BACKLOG.md / the content phase

**`archive/format-surface`** (3) — §Scope boundary [S] The campaign economy behind D85 not designed; only the dead error code disposed → the campaign work; §3.2 [S] The eight unconditionally-free meterable operations explicitly not disposed → campaign design; Open questions 5 [Q] Server-authoritative opponent policy unowned; needs a ledger row and an owner → design/BACKLOG.md

**`archive/live-surface-honesty`** (3) — §7 corrections 1-3 [S] docs and design wording corrections reported, not made, incl. AssistanceContext.sessionKind unread → docs/live-sessions.md:126; design/05:147; Deviations #3 [D] the stale "same disclosure projection" doc sentence reported rather than corrected → docs/live-sessions.md:126; Open questions #1 [Q] whether academy gets its own assistance profile; left non-behavioural → NONE

**`archive/opening-evidence-path`** (3) — Open questions #2 [Q] whether EVIDENCE_TYPE_UNBACKED should be an error for drafts too → NONE; Open questions #4 [Q] what grounds a plan class; middlegame content stays permanently ungrounded → design/BACKLOG.md; Open questions #6 [Q] dual-instrument claims can never be fully backed; a permanent corpus-half warning ships → NONE

**`archive/opponent-contracts`** (3) — §M2 [S] D369's twelve packs with inert targetElo untouched; owner-gated → design/BACKLOG.md D369; Deviations #2 [D] design's "perfect resistance" wording left unamended; a validation warning attached instead → design/01-training-model.md:84; Open questions #7 [Q] whether orderingBasis deserves a client surface is a design-tier question → design/05-in-run-experience.md

**`archive/predicate-wave-3`** (3) — Deviations #5 [D] the transition category gets no design home; a BACKLOG row proposed, no design edit → design/05-in-run-experience.md §3; Open questions #5 [Q] whether F4's disjunctive promotion trigger is a clean hand-off or a lost specification → NONE; Open questions #7 [Q] whether a rung-2 practical_difficulty condition belongs in the vocabulary lane → UNNAMED-FUTURE-RFC

**`archive/shape-library`** (3) — Motivation §4 [S] generated drill recipes (gate B11's middle clause) not built; needs owner restatement → design/BACKLOG.md (proposed row); Motivation §4 [S] review workflows for entries refused permanently; channel and provenance are the safeguard → NONE; Deviations 2 [D] gate B11's generated-drill-recipe clause dropped pending an owner restatement → design/BACKLOG.md (proposed row)

**`archive/teacher-surface`** (3) — §5.3 [S] live-watching teachers still get no Maia and no corpus; reversal needs an owner ruling → rfc/archive/live-marker-quality.md; Deviations 1 [D] design/03's B5 "shipped" row overstates (no relays); correction reported, not made → §10 / design/BACKLOG.md; Open questions #2 [Q] teacher-initiated observation requests — a pressure surface; deferred to a follow-up RFC → UNNAMED-FUTURE-RFC

**`archive/transition-primitives`** (3) — Open questions #2 [Q] corrected firing rates for the two target-keyed leaves and the threshold's grounding → NONE; Open questions #7 [Q] whether `structuralDelta` is fixed, deleted or left — a public-API decision → NONE; Open questions #8 [Q] a correct but pack-uncovered `to: achieved` condition — witness field or warning → NONE

**`archive/vocabulary-wiring`** (3) — Open questions #4 [Q] whether the B+N outcome sibling pack should be deleted — a content decision → NONE; Open questions #5 [Q] who corrects the 41/50 plan-class count in three design-tier documents → design/BACKLOG.md, design/research/*; Open questions #6 [Q] promoting the third law while its predecessor was never actually promoted → docs/drill-pack-format.md

**`learner-modules`** (3) — §1.12 [S] The `sound` form is deliberately absent — design/05 §3-forms has no sound row and the row is the owner's to write → design/05-in-run-experience.md §3-forms; Deviations 3 [D] The DESIGN-GAP for the sound form (D880) is honored by refusal, not resolved here → NONE; Open questions #2 [Q] Threat radar's pre-commit arm exceeds the literal O4 ruling; conservative fallback is post-commit only if unruled → NONE

**`archive/branch-set-scale`** (2) — Open questions #1 [Q] Whether an `achieved` branch should also collapse once the set is large → content-complete invariant review (design/05:24-29); Open questions #7 [Q] Whether `cursed-win` under a `win` objective belongs in the collapse set → NONE

**`archive/dead-vocabulary`** (2) — §2 residuals [S] Eight unconditionally-free meterable operations left to campaign economy → planning/work-register.md §3; §5 [S] `structuralDelta`/`vacationReading` left alone; reaching them needs a design-tier format construct → the owner's move-primitives question

**`archive/fixture-realism`** (2) — Open questions 5 [Q] Whether a `docs/` page is needed; owner call → NONE; Owner ruling 2026-08-15 [W] E4 floor restated: a real fixture need only exercise reachable sides, not cross the bound → NONE

**`archive/pack-studio`** (2) — Deviations #2 [D] design's strong-player review dropped entirely, replaced by an origin channel → design/03-product-breadth.md §Create; Deviations #3 [D] the shell's Create review queue not honoured; no review capability surface added → design/03-product-breadth.md §Stable application shell

**`archive/resistance-spectrum`** (2) — Deviations #2 [D] practical_resistance misses the sub-500 ms interactive budget; filed owner-level, not engineered away → design/BACKLOG.md row 8.8; Open questions #6 [Q] whether a ~580 ms opponent is acceptable; the budget line may need an axis → design/BACKLOG.md row 8.8

**`campaign-core`** (2) — Open questions #2 [Q] owner veto window on the §2a second-axis reading; proceeding on the claude-derived reading → NONE; Open questions #3 [Q] whether abandoning an encounter should itself cost charges; shipped as free → NONE

**`intent-presets`** (2) — §7 [S] Preset names, labels, promises, defaults and per-context allowances ship as candidates behind an owner-use gate → planning/exploration/log.md; Open questions [Q] Names, promises, defaults and which contexts may offer Support left to owner-use validation rather than acceptance → planning/exploration/log.md

**`measurement-records`** (2) — Scope boundary [S] No lint over Markdown process documents; D161's standing rule is the owner's to place → CLAIM.md-tier guidance or design/research/README.md; Open questions #7 [Q] D161's standing worked-example rule has no home; placing it is a law-5 owner act → CLAIM.md-tier guidance or design/research/README.md

**`move-quality-grades`** (2) — Open questions #1 [Q] Whether the drill ladder's 2.5/6/14 strictness fits our consequence loop — validation by owner play → grade-convention@2; Open questions #3 [Q] Whether full_inspector should also list the grade — an owner call at learner-modules' implementation → rfc/learner-modules.md

**`pack-population-provenance`** (2) — Motivation [S] Which population a pack declares — authored chess judgement; the field is specified, nothing populated → Discharges D1; Open questions Q1 [Q] Which population a pack should declare — deferred permanently and not to an RFC; owner-owned → Discharges D1

**`0000-rfc-process`** (1) — The exploration gate [S] Product RFC drafting closed until vertical-slice continuation gates pass or an owner ruling opens one → planning/exploration/gates.md

**`archive/adaptive-guidance`** (1) — Motivation §3 Scope boundary [S] Per-viewer spectator assistance; owner ruled document-don't-engineer for streamed sessions → NONE

**`archive/branch-groups`** (1) — §1.3 [S] Eight-branch compare ceiling not moved; owner ruling on it still pending → design/BACKLOG.md:158

**`archive/defect-batch-2`** (1) — §3 Out of scope [S] `$defs/provenance` and `$defs/feedbackClaim` stay open; vocabulary must be declared first → design/BACKLOG.md (row proposed in §6)

**`archive/evidence-contract-manifest`** (1) — §10 [S] `assistance.arrows` registered `experimental`; producer-or-retire decision recorded later → F5

**`archive/learner-identity-and-authorization`** (1) — Motivation Out of scope / §13 [S] Administrative roles of any kind, ruled out by the owner → NONE

**`archive/line-drill-theory-grading`** (1) — Changelog 2026-08-12 ruling 1 [W] Frontier reading withdrawn for membership; criteria 2/4/7 rewritten onto a fixture shipped content cannot show → NONE

**`archive/n-way-comparison`** (1) — Changelog 2026-08-13 (adversarial review) [W] A9 downgraded from asserting the B3 gate row to merely proposing it → design/BACKLOG.md

**`archive/polish-surfaces`** (1) — §Motivation Out of scope [S] blunder-only pre-commit lighting deferred behind invariant review, or never ships → design/BACKLOG.md board-lighting row (line 232)

**`archive/portable-account-data`** (1) — Deviations from design [D] design/02's "runs reassign to __legacy" sentence left uncorrected; needs an owner ruling → design/02-product-shape.md

**`archive/rfc-lifecycle-completion`** (1) — §8 [S] declines any judgement on a specific RFC's current lifecycle status → NONE

**`archive/social-match`** (1) — §Proposed ledger rows [S] BACKLOG and gate-row flips left as owner-tier proposals, not made here → design/BACKLOG.md:210-211, gates.md:134

**`archive/tempo-vocabulary`** (1) — Open questions #2 [Q] whether `too_slow` should be ungraded on a forced-release path → NONE

**`bot-policy`** (1) — Open questions #1 [Q] the human-scale anchor: anchor accounts, learner-derived Glicko, or stay band-relative → planning/exploration/log.md ruling entry

**`graduation-clearance`** (1) — §0.5(b) [S] Curating a subset of packs for promotion, refused by the owner at D162 → NONE

**`play-composition`** (1) — Open questions #3 [Q] The post-commit on-board echo permitted but not required at 1.0; rides the D840 felt pass → the D840 lane

---

## 7. Per-surface depth — the "is it deep or shallow" answer

Ranked by total recorded scope cuts. **A surface with a high count is shallower than its accepted
status implies**: the count is the number of times an RFC on that surface said "not here."

| rank | surface | RFC status at HEAD | total cuts | no destination | destination absent | OWNER, unqueued | open questions | weakened criteria | narrowing deviations | open discharges |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **evidence-platform** | 5 active (2 awaiting, 2 implementing, 1 accepted) + 6 archived | **261** | 117 | 43 | 17 | 43 | 19 | 23 | 13 |
| 2 | **content-packs** | 4 active, all draft/accepted-unimplemented | **169** | 81 | 20 | 20 | 26 | 8 | 18 | 7 |
| 3 | **authoring** | no active RFC; 11 archived | **158** | 73 | 26 | 21 | 39 | 8 | 17 | 0 |
| 4 | **drill-loop** | 2 active (1 implementing, 1 awaiting) + 12 archived | **128** | 60 | 13 | 11 | 18 | 4 | 22 | 4 |
| 5 | **bots** | 1 active (`bot-policy`, implementing) + 4 archived | **97** | 27 | 12 | 12 | 19 | 5 | 8 | 5 |
| 6 | **infra-process** | process only | **88** | 42 | 1 | 15 | 18 | 9 | 10 | 0 |
| 7 | **presets-assistance** | 2 active (implementing) + 3 archived | **82** | 24 | 4 | 12 | 11 | 3 | 9 | 6 |
| 8 | **review** | 2 active (1 draft, 1 implementing) + 3 archived | **71** | 25 | 16 | 5 | 13 | 5 | 8 | 4 |
| 9 | **live-casting** | 1 active (`live-sources`, accepted) + 4 archived | **56** | 20 | 4 | 7 | 8 | 0 | 6 | 4 |
| 10 | **campaign** | 1 active (`campaign-core`, implementing) | **37** | 11 | 4 | 6 | 3 | 0 | 3 | 4 |
| 11 | **rating** | 2 active (1 implementing, 1 accepted) | **34** | 19 | 1 | 8 | 9 | 2 | 2 | 1 |
| 12 | **theming** | 1 active (`theming`, awaiting) | **24** | 8 | 2 | 12 | 4 | 4 | 1 | 4 |
| 13 | **account** | no active RFC; 2 archived (implemented) | **25** | 17 | 4 | 3 | 0 | 2 | 1 | 0 |
| 14 | **teacher** | no active RFC; `teacher-surface` implemented | **20** | 12 | 2 | 3 | 11 | 0 | 1 | 0 |
| 15 | **time-controls** | **no RFC has ever existed** | **6** | 2 | 2 | 0 | 1 | 0 | 0 | 0 |
| 16 | **variants** | **no RFC has ever existed** | **2** | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| | **TOTAL** | | **1,300** | 539 | 167 | 163 | 223 | 69 | 129 | 52 |

**How to read the two ends of this table, because they fail in opposite directions.**

- **The top is depth debt.** `evidence-platform` has 261 recorded cuts across eleven RFCs. It is
  the most-specified surface in the repo and simultaneously the one that has said "not here" most
  often. Its own RFCs say why: `tactical-collectors` D1, `breadth-collectors` D1, `semantic-collectors`
  D1 and `runtime-opening-identity` D1 each land **research/inspector-only by design**, with
  production-module eligibility deferred to a Phase-3 RFC. 62 collectors compile; the number that
  reach a learner through a production module is **zero**, and `learner-modules`' own honesty note
  says so: *"modules ship production-registered but preset-inert; nothing new renders to a learner
  at landing."*
- **The bottom is not shallowness — it is absence.** `time-controls` scores 6 and `variants`
  scores 2 **because no RFC has ever been written for either**. You cannot defer from a document
  that does not exist. Both are standing owner asks ([[D327]]/[[D1031]] variants, ruled
  2026-08-23; [[D330]]/[[D355]]/[[D357]]/[[D364]] time controls, ruled 2026-08-23 as [[D1041]]),
  both were refused in code and research prose without an owner ruling, and
  `1.0-capability-map.md` — the file that enumerates the 1.0 surface as 21 capability families —
  **contains no row for either**. A low count in this table can mean a surface is clean or can mean
  it was never scoped; only the status column tells you which.
- **`theming` is the control.** 24 cuts, 12 of them `OWNER`-owned and unqueued — the highest
  owner-ratio of any surface — because the RFC was written *properly*: it enumerates what it
  declines (3D boards, background images, per-context themes, zen mode, hue sliders) with reasons
  and names the owner for each. It is the best-behaved surface in the inventory and the owner has
  still never seen that list. **Correct deferral and visible deferral are different properties**,
  and this repo only ever achieved the first.

**One more count for the depth question.** Of the 24 active RFCs, **zero are `implemented`**: 8
accepted, 7 implementing, 5 draft, 4 awaiting-a-discharge. And **19 of the 23 non-process active
RFCs have no page in `docs/`** — the tier `CLAUDE.md` calls "the canonical description of what
exists."

---

## 8. The honest 1.0 statement

The owner asked for a truthful sentence, unsoftened. Here it is, followed by the arithmetic that
forces each clause.

> **Tabiya is not near 1.0. It is a thoroughly specified, largely unshipped platform: across 96
> RFCs the project has written down 1,300 separate cuts to its own scope, 539 of which name no
> destination at all, 167 of which point at a document that does not exist, and 163 of which are
> decisions only the owner can make that sit in no queue anyone reads — and beneath that paper the
> product has zero published packs, zero collectors reaching a learner through a production module,
> zero of its 24 active RFCs implemented, and no RFC at all for five of its twelve capability
> nodes, for variants, or for time controls.**

Each clause, with its receipt:

| clause | receipt |
|---|---|
| *1,300 recorded scope cuts across 96 RFCs* | §1 table; 1,206 prose rows + 94 Discharges rows, full-read pass over every file |
| *539 name no destination* | §4; 45% of prose rows |
| *167 point at a document that does not exist* | §2, §5; verified against the filesystem at HEAD |
| *163 owner decisions in no queue* | §6; `decision-queue.md` holds one of 153 prose rows and zero of 11 Discharges rows |
| *zero published packs* | `content/packs/` is **an empty directory** at HEAD; the 82 pack documents the graduation pipeline reads sit in `content/drafts/`. `pack-population-provenance` §5.3 measures *"92 packs, all `draft`, 0 published"*, and its §Open questions Q2 then defers a decision to *"whichever RFC first has a non-empty official shelf"* — a condition nothing is scheduled to create |
| *zero collectors reach a learner* | `tactical-collectors` D1, `breadth-collectors` D1, `semantic-collectors` D1, `runtime-opening-identity` D1 all land inspector-only; `learner-modules` §Discharges honesty note: *"preset-inert … nothing new renders to a learner at landing"*; `intent-presets` §7: presets ship as `candidate` |
| *zero of 24 active RFCs implemented* | `rfc/README.md` §Active: 8 accepted, 7 implementing, 5 draft, 4 awaiting |
| *no RFC for five of twelve capability nodes* | `rfc-graph.md` §68–79: F4 (knowledge/theory), F6 (Review Map), F9 (player metrics/coaching), F11 (professional/social), F12 (release platform) have planning directories and no RFC |
| *no RFC for variants or time controls* | grep over all 96: neither surface has ever had one; `1.0-capability-map.md`'s 21 families contain no row for either |

**What the sentence deliberately does not say.** It does not say the work is bad. The specification
quality here is unusually high — the Discharges register is a genuinely good mechanism, `theming`
and `assistance-controls` show the deferral pattern done right, and the reviews that weakened 69
criteria recorded every one of them rather than quietly relaxing a gate. It does not say anyone
concealed anything: **every row in this inventory was written down, in the open, by the agent that
made the cut.**

**The defect is not dishonesty. It is that honesty was recorded in a tier nothing reads.** A
deferral written into a `## Discharges` row is tracked, blocks archival, and shows up in
`status-parity`. The identical deferral written one section earlier, in a Motivation paragraph, is
tracked by nothing at all — and **539 of them were written one section earlier.** The 64 archived
RFCs that predate the register never had the option. That asymmetry, not any individual decision,
is what makes a product with an empty `content/packs/` directory read as near-1.0.

**The cheapest repair is the one already specified and not built.** [[D1038]]'s `make refusal-index`
sits `💡 open` in the ledger: machine-readable refusal blocks reusing the accepted `tabiya-claims`
convention, a required `class: product | technical` field, a build that **fails on any `product`
refusal carrying no `ruledBy: D<n>`**, and `decision-queue.md` **derived rather than hand-written**.
This inventory is the manual, rotting, one-shot version of that instrument's output — and
`never-started-lanes.md`'s own warning applies verbatim: *"this file is hand-made and rots. Do not
quote these numbers tomorrow."*


---

## CORRECTION 2026-08-23 — one clause of the honest-1.0 sentence is false ([[D1135]])

The sentence's clause *"zero of its 24 active RFCs implemented"* is **wrong at HEAD**. Verified:
the active register holds **4 `implemented`** and **4 `awaiting`** (awaiting = implementation
complete, pending a discharge), and **72 RFCs are archived**, which in this repo means implemented
and closed out. The platform has shipped a great deal of machinery.

The other four counts survive scrutiny and are not softened. The corrected sentence:

> Tabiya is not near 1.0. It is a thoroughly specified platform whose machinery largely works and
> whose product largely does not reach a person: across 96 RFCs the project has written down
> **1,300 separate cuts to its own scope**, **539 naming no destination at all**, **167 pointing at
> a document that does not exist**, and **163 owner decisions sitting in no queue anyone reads** —
> and beneath that paper there are **zero published packs**, no collector reaching a learner through
> a production module, and **no RFC at all for five of twelve capability nodes**.

The change is not cosmetic: *"nothing is implemented"* would have been despair, and the true
statement is sharper — the building works, and almost none of it is wired to a user.
