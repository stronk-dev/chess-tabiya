# The dossier remainder — measured, not estimated

**Date:** 2026-08-23. **Author:** claude. **Commissioned by:** the owner, on a coordinator claim
that the ~50 remaining dossiers are *"mostly teardowns and refusals — genuinely not debt."*
**Corpus snapshot:** working tree at 2026-08-23 21:31:45 (`git status` recorded in §0).

**This is a register, not an intent document** (law 5): it records what exists and what points at
it. It proposes nothing and rules nothing. It supersedes the **counts** — not the method — of
`planning/platform-alignment/research-to-execution.md`, which was written earlier the same day,
before eleven RFCs were drafted, and is stale by exactly those eleven.

---

## 0. The claim, tested

The claim is wrong three ways and right once.

**Wrong (a) — teardowns.** Filing all 14 teardowns as non-debt is unjustified. **Ten of the 14 carry
an explicit adoption recommendation**; eight landed, and **two landed nowhere**
(`teardown-chessigma-desk.md`, `teardown-chessmindai-desk.md` — §6 rows 9 and 10). The four that
recommend nothing are the four **earliest**, dated 2026-08-10/11, written before the protocol asked
the "single best interaction to steal" question. Teardown-ness predicts nothing; the dossier's date
does.

**Wrong (b) — the three hidden measurements.** All three named dossiers really are measurements of
our own system misfiled as competitor intel. But only **one** of the three is unconsumed.
`classifier-coverage-and-noise.md` is read by three RFCs by number;
`semantic-horizon-coverage.md` is read by none. `human-outcome-coverage-depth.md` is the third and
is also unconsumed — its boundary survives only as prose caveats. The correct
measurement-unconsumed count is **2**, and two further files that looked like this bucket
(`maia-band-calibrated-range.md`, `foundation-capability-closure.md`) turned out to be consumed in
shipped code and in a drafted contract respectively. Details in §5.

**Wrong (c) — refusals.** "Refusals are not debt" is **already a ledgered defect.**
`design/BACKLOG.md:1606` **[[D1320]] 🐞** — *"A research refusal is structurally identical to
[[D1037]]'s unruled refusal: a decision made in a tier the owner never reads, foreclosing something
he may have asked for."* Three of the nine refusals below are exactly that shape, and two of them
are additionally superseded by a *passing* experiment nobody built (§3, §6 row 3).

**Right once.** The remainder genuinely shrank today, hard. Eleven RFCs plus the subject test
discharged **eighteen** dossiers that `research-to-execution.md` §4 listed as buildable-with-no-RFC
six hours earlier, including **seven of its top ten owner asks**.

> **The true remaining count is 10 LIVE DEBT and 2 MEASUREMENT-UNCONSUMED — 12 dossiers with no
> execution path — not "~50, mostly teardowns and refusals."** Two of the twelve are teardowns; none
> of the twelve is a refusal.

### `git status` at snapshot

Dirty and untouched by this pass (held by other forks): `design/06-campaign.md`,
`design/BACKLOG.md`, `rfc/campaign-core.md`, `rfc/measurement-records.md`,
`docs/content-sourcing.md`, `docs/drill-client.md`, `docs/evidence-contract.md`, and 18 source files
under `apps/`, `packages/`, `tools/`. Untracked: `planning/review/`, `vendor/`,
`tools/exact-legal-mobility-harness/`, `packages/runtime/src/legal-moves*.ts`,
`planning/exact-legal-mobility/implementation.md`,
`planning/platform-alignment/bot-policy/d1312-guard-composition-plan.md`. **Nothing outside this
file was written, and nothing was committed.** `rfc/return-scheduling.md` landed *during* this pass
(another fork) and is included in the join.

---

## 1. Method — re-derived at HEAD, not inherited

- **Corpus.** `design/research/` holds **117 `.md` files**: 116 dossiers plus `README.md` (the
  coverage matrix, which is infrastructure). Two non-`.md` artifacts are dossier-equivalent
  registers and are joined: `capability-watch.json`, `competitor-matrix.csv`. **Total joined: 118.**
  Six dossiers landed after `research-to-execution.md` and appear in no prior join:
  `engine-composed-band-discriminator.md`, `evidence-to-move-head-screen.md`,
  `evidence-to-move-independent-population.md`, `evidence-to-move-proper-score-repair.md`,
  `generated-bot-route-source.md`, `non-maia-bot-composition.md`.
- **Citation test.** `grep -lF <filename>` across `rfc/*.md` and `rfc/archive/*.md`. **`rfc/README.md`
  is excluded** — it is the lifecycle register, not an RFC; a name in it is a record, not an
  execution path. (`research-to-execution.md` counted it, which is why `stack-selection` and
  `maia-production-band-roster` read as cited there on weaker evidence than they have here.)
  **Result: 74 of 118 cited.**
- **Subject test.** Where no citation exists, the RFC tier was read for *coverage of the subject* —
  the RFC must actually build, or explicitly decide on, the thing the dossier proposes. Keyword
  presence is not coverage. **Eleven dossiers pass with no citation (§2.1); six fail it explicitly,
  three of them by an RFC that names the subject and ejects it.**
- **Teardown rule, applied per file.** For every teardown: did it recommend anything, and did the
  recommendation land? A teardown with an unlanded recommendation is LIVE DEBT, not intel. No file
  is bucketed by filename pattern (§4 and §8.1).
- **The eleven new drafts,** all `- **Status:** draft — 2026-08-23`: `variants`, `recorded-clocks`,
  `famous-games`, `skills`, `live-following`, `review-map`, `casting`, `evidence-move-selector`,
  `enforced-clocks`, `player-style`, `bot-roster`. Plus `return-scheduling` (draft, landed mid-pass).
  `pack-training-forms` does not exist in `rfc/` at snapshot.

---

## 2. The counts

| Bucket | Count | Share |
|---|---:|---:|
| **DISCHARGED** — findings are in a shipped or drafted RFC | **85** | 72.0% |
| **REFUSAL** — refuted its own hypothesis; correctly built nothing | **9** | 7.6% |
| **INTEL, INERT** — findings genuinely imply no feature | **12** | 10.2% |
| **MEASUREMENT OF OUR SYSTEM, UNCONSUMED** | **2** | 1.7% |
| **LIVE DEBT** — concluded buildable, no RFC in any state | **10** | 8.5% |
| **Total** | **118** | |

Movement since `research-to-execution.md` (same day, earlier): **LIVE DEBT 31 → 10.** Eight
dossiers discharged by the eleven drafts, eleven by the subject test, three reclassified as
refusals that landed after that join; one (`training-mode-variants.md`) moved the other way and is
now sharper debt than it was.

### 2.1 Discharged with no citation — the eleven the subject test caught

No filename citation anywhere in `rfc/`. Discharged anyway; each is a missing citation an RFC owner
should add.

| Dossier | Covering RFC | Evidence |
|---|---|---|
| `interaction-state-correctness.md` | `accessible-board-input.md` (awaiting D3) | `:10` *"Depends on: D537/D538/D573 exact pointer/touch repair (`d208425`)"*; `:29-33` *"The measured 90/90 pointer/touch reading … becomes the **permanent regression floor** … this RFC promotes drag and touch into the permanent gate."* `BACKLOG.md:748-749,169` — D537/D538/D573 ✅ CLOSED 2026-08-21 |
| `endgame-latency-versus-cet.md` | same repair + `gates.md:160` | K9 reads the dossier by path: *"the identical six-pack × five-viewport × click/drag/touch matrix is 90/90 exact."* Its own ask (`:389`) was *"fix the layout, then run one owner session"* — layout fixed; an owner session is not debt. **Residue:** no RFC carries a board/reply **latency budget**; the K9 speed clause lives only in `gates.md` |
| `legal-exchange-prerequisite.md` | `tactical-collectors.md` | `:52` lists *"declared conventions (`legal-exchange@1`, `space@1`, `trapped@1`…)"*, sourced `:15` from *"the predeclared D730 legal-exchange instrument"*; `:138` enforces the dossier's own limit. `BACKLOG.md:259` D814 ✅; `packages/runtime/src/exchange.ts` |
| `grounded-skills-taxonomy.md` | `skills.md` (draft) | `:233-234` *"Fundamentals, Openings, Tactics, Strategy, Endgame. **Navigation only; they carry no credit.**"* — verbatim the dossier's verdict. `:588` *"Only the five category names are adoptable."* `:440-443` ships Openings and Strategy *"empty with the reason stated."* Drafted at full depth on [[D1260]] ⚖️ |
| `time-as-a-difficulty-lever.md` | `enforced-clocks.md` + `recorded-clocks.md` | `enforced-clocks.md:303` *"**Stop-and-fork.** The rewind stops the clock; the fork inherits the forked node's recorded reading"*; `:308-311` *"`clockState` lives on `Node` and is branch-scoped … the run-pooled clock [[D364]] demands be refused would need a new run-level field."* `recorded-clocks.md:291` R2 refuses the pursuit clock. The dossier's exact rule — legal iff the budget resets at the fork — is load-bearing in both |
| `professional-workflow-conformance.md` | `casting.md` + `intent-presets.md` | Streamer half: `casting.md:87` quotes the dossier's ruling — *"[[D705]] ruled the shape: 'coach and streamer need explicit workflow compositions, not new evidence modes.'"* Coach half: `intent-presets.md:74` — *"`academy` — **new seventh context** … which today **falls through** to the run's `sessionKind` profile … proposed as [[D943]]"*, module set `:148`, criterion 11 `:434`. **Both compositions the dossier asked for now have a home** |
| `workflow-default-conformance.md` | `intent-presets.md` | `:81-100` names the two vocabularies production never had — `WORKFLOW_CONTEXTS` (7) and `PRESET_IDS` (`quiet`, `guided`, `theory_only`, `support`, `analysis`) — against the dossier's own baseline at `:40-46` (*"a grep for `preset\|Preset` … returns **zero production hits** … plus a 54-control raw preference matrix the A5 audit measured as the negative baseline"*). `:107-109` types the ∩ algebra so ceilings only narrow |
| `maia-band-calibrated-range.md` | `bot-policy.md` §2.1 + `bot-roster.md` | `bot-policy.md:274` makes *"supported band range (validated via `appliedTargetElo`, `apps/server/src/engine-band.ts`)"* a required base-layer field. `bot-roster.md:127` instantiates the dossier's exact recommendation: *"`bandRange {1000, 2400}` `[V]` (`maia.ts:3-11`)"*. **It is shipped**: `apps/server/src/maia.ts:8-11` carries the attribution verbatim — *"R10 measured the widest interval whose policy trajectory remains ordered … This is a deployment bound"* |
| `llm-renderer-contract.md` | `learner-modules.md` §6.1–6.3 | `:830-850` is the contract — sealed packet → registered per-projection deterministic renderers → optional LLM, with *"`voiceCheck`'s allow-list is derived from the same admitted items"* (`:850`) and the R5 attribution explicit at `:655`. Criteria A12–A14 make it failable |
| `integrated-platform-alignment.md` | `review-evidence-compiler.md` (draft) | The dossier's named missing object is built: `:40-50` *"`compileReviewEvidence` — joins independently available declared evidence by exact run/node/move identity and records a typed state for every source family"*, replacing *"Review's one lossy number"* (`:31-38`). **Residue:** scoped to Review; the four-plane platform compiler (`:241-262`) is broader than what shipped |
| `foundation-capability-closure.md` | `pack-capability-contract.md` §3.1 | Builds the derived-closure machinery the dossier asked for: `:3` replaces the hand-count with *"`make capability-census`, a **derivation procedure** over four roots … with `CAPABILITY_DECLARATIONS` asserted **set-equal to its output by id**"*; §4.2 publishes *"the **supported projection** — `reached` ∪ `temporarily_unavailable`"*. **Residue:** the per-family *tier-where-it-stops* table (`:135-149`'s ordering constraint) is carried by no RFC and no gate |

> **Two of these — `grounded-skills-taxonomy` and (by citation) `longitudinal-style-feedback-contract`
> — are the two dossiers `research-to-execution.md:242` filed as NOTHING.** Both are discharged as of
> today. The "research-queue row that never names the file" defect (R20/R21) is now moot for
> execution and survives only as a traceability bug.

---

## 3. REFUSAL — 9

Research that correctly built nothing. Law 6 wants these visible.

| # | Dossier | The refutation, verbatim | Recorded where |
|---:|---|---|---|
| 1 | `conjunction-hypothesis.md` | `:32` *"**Refuted, and the premise fails before the conclusion does.**"*; `:492-493` *"The hypothesis fails on both populations, and it fails harder on the one that resembles a learner."* | `gates.md`, `campaign-research-queue.md` |
| 2 | `threat-salience-and-human-error.md` | `:16-17` *"**Kill salience-shaped error from the 1.0 bot roster.** All three admission clauses fail."*; `:20-21` *"This is a refusal of one proposed relationship, not of threat collection."* | `gates.md` |
| 3 | `finite-state-bot-route-controller.md` ⚠ | `:6` *"fixed multi-ply experiment complete; candidate controller refused"* — 86.1% fallthrough, 1/12 branches vs a 70% gate | `d1078-route-controller-plan.md` |
| 4 | `monotone-bot-route-controller.md` ⚠ | `:6` *"hash-isolated multi-ply experiment complete; candidate controller refused"* — 1/12 branches, both gates fail | `d1080-monotone-route-plan.md` |
| 5 | `state-directed-bot-profile.md` ⚠ | `:6` *"the candidate route layer is refused at ×4"* — +4.85 pp route progress vs a 10-point gate | `d1073-state-directed-profile-plan.md` |
| 6 | `engine-composed-band-discriminator.md` | `:10` *"**Abstain on the preregistered product verdict; do not fund the game ladder from this screen.**"*; `:23-24` *"This refutes **temperature alone as evidence of band identity on this population**."* | `BACKLOG.md:426` D1163 📊 |
| 7 | `evidence-to-move-head-screen.md` † | `:18` verdict is a **pass** — *"The current registered evidence representation passes its preregistered one-ply screen"* — returned by the chain it opened | `BACKLOG.md:425` D1162 📊 *"BOTH STANDALONE HEADS ARE RETURNED"* |
| 8 | `evidence-to-move-independent-population.md` | `:20` *"**The evidence representation replicates; the fitted diagonal selector does not clear.**"*; `:115-116` *"Return the diagonal fitted head and the pass criterion. Do not implement…"* | `BACKLOG.md:425` D1162 |
| 9 | `evidence-to-move-proper-score-repair.md` | `:90-91` *"**The standalone evidence-to-move base is refused for 1.0 under the declared family.** Do not tune another threshold, hidden layer, interaction or feature-selection pass on these data."* | `BACKLOG.md:1600` D1297 ✅ |

† **Bucket note.** #7's own verdict is affirmative. It is filed here because the two populations it
commissioned refuted it and the ledger returned it; nothing is owed. Its two conformance bugs
(`:81-87`) and the production contract defect (`:92-94`) were repaired in the same pass.

⚠ **[[D1320]] applies to rows 3, 4 and 5.** `BACKLOG.md:1606` — *"the bot refusals are scoped to a
MECHANISM, not the goal … Both were measured against a Maia-weighted base — and the owner FUNDED A
NON-MAIA BASE TODAY ([[D1271]], `rfc/evidence-move-selector.md`), where features ORIGINATE the
distribution rather than multiplying one. The refusals do not cover it."* These three carry a
standing obligation: the selector RFC must state which prior refusals it is and is not bound by.
**Rows 3 and 4 are additionally superseded from the other direction:**
`generated-bot-route-source.md` passed all eight gates at 9/12 branches (`BACKLOG.md:495` D1084 ✅)
— the route-controller refusals refused the *wrong mechanism*, and the right one is LIVE DEBT (§6
row 3).

---

## 4. INTEL, INERT — 12, justified per file

**Not one is filed by filename pattern.** Each row states why its findings imply no feature.

| # | Artifact | Why genuinely inert |
|---:|---|---|
| 1 | `capability-watch.json` | The register itself — 19 capabilities × 22 products. An instrument, maintained by `capability-watch/plan.md`. Makes no build claim |
| 2 | `competitor-matrix.csv` | The 63-product feature matrix. Superseded as the *watch* instrument by the JSON; retained as evidence |
| 3 | `source-index.md` | The living R46+ source register. Law-3 infrastructure |
| 4 | `capability-watch.md` | Verdict `:6-9` is *"use the checked capability-first register"* — a **method** conclusion whose instrument exists. `:90` *"This closes D556's missing instrument and D554's targeted desk/forum arm"* |
| 5 | `competitor-love-hate-sweep.md` | Its four consequences (`:170-177`) change **language and confidence**, never the build: *"D623 changes the uniqueness language"*, *"D624 strengthens, but does not validate, the R3 presets"*, *"D625 reinforces R12's refusal"* |
| 6 | `competitor-value-props.md` | Has a §Synthesis adopt/match list (`:184`), but it is the **input** to `adoption-audit.md` §7, which shipped as `archive/adoption-wave-1.md`. Consumed one hop away |
| 7 | `coverage-gap-sweep.md` | Output is a process queue — `:177` *"Top 5 absent products deserving a full teardown (ranked)"*. All five were torn down (365chess, Chess2Story, ChessMotive, TTT, Chessigma). Queue discharged |
| 8 | `coverage-sweep-2-notability.md` | Same shape (`:226`), same discharge, plus two whole-platform censuses that are reference material |
| 9 | `teardown-cet.md` | Has a headline finding but **frames it as confirmation of what we already ship, not an adoption**: `:28-34` — CET's *"Unfeasible mate"* banner *"is an embryonic form of our `objectiveState` machine … **But it never says *why*** … State-flip detection without teaching: exactly the gap our feedback design (Q8) fills."* Its only output is a bar (`:60-62`), and that bar **is** consumed, by `gates.md:160` K9 |
| 10 | `teardown-chessable-desk.md` | **Recommends nothing** — no adoption section; the file ends at the E1 one-liner (`:49`). Its contribution is a *negative* result, and it is **no longer pointed at by nothing**: `planning/training-methods/rfc-derivation.md:121` — *"§2.3 `teardown-chessable-desk.md` (49 lines) — the one nothing points at"* — consumes `:49`, `:27` and `:32` as the direct argument for our `deviations` array over parallel flashcards |
| 11 | `teardown-noctie-desk.md` | **Recommends nothing.** ⚠ *Incomplete, not inert-by-design:* `teardown-protocols.md:12-13` mandates *"what is its single best interaction we should steal"* and this teardown never answers it. Filed inert because it proposes nothing today; a protocol residue, not a feature residue |
| 12 | `teardown-protocols.md` | A method document — `:5` *"Status: protocols ready, no teardown executed."* Its mandates are process, not product. ⚠ See §7: the mandate it issues is unmet **for itself** |

---

## 5. MEASUREMENT OF OUR SYSTEM, UNCONSUMED — 2

Dossiers measuring **our own behaviour** whose numbers no RFC and no instrument reads.

| # | Dossier | What it measured (verbatim) | What would consume it |
|---:|---|---|---|
| 1 | `semantic-horizon-coverage.md` | `:34-35` *"On depth 12 it reaches **56/64 (87.5%)**; on the production-budget 100-ms arm it reaches **46/64 (71.9%)**"*; `:58-59` *"**mean 329 ms / p50 354 / p95 799 / max 939 ms per searched edge**"*. Verdict `:19-20` — *"the foundation is broad enough … but the primitive does not exist and three tempting shortcuts are false"* | The bestline↔event join primitive (D1067). Its build order `:165-176` names *"Amend `learner-modules` for the four-stage engine-semantic grammar"* and *"Build the recorded path compiler and engine horizon compiler"*. `learner-modules.md` is accepted and carries neither. **The gap is explicitly disowned**: `enforced-clocks.md:277-280` — *"Hint distance is a **ruled but unlanded axis** … a conflict that RFC owns, not this one."* No RFC owns it. Lane only: `d1066-semantic-horizon-plan.md` |
| 2 | `human-outcome-coverage-depth.md` | `:43-45` *"the last ply at which any sampled position clears 400 games is **ply 20** at bands 1400/1600 and **ply 21** at 1800; from ply **27** every sampled position at every band returns **zero games**"*. Verdict `:20-21` — *"the boundary is ply ~20, and it is a boundary of coverage, not of phase"* | A **named refusal** in the evidence contract — its own ask, `:689-690`: *"The honest design move is the same one R4 named: a named refusal, not a silent fallback."* No RFC declares a ply-20 abstention. **The boundary survives only as prose caveats** — `bot-roster.md:399` *"⚠ The explorer reference dies at ply ~20"* and `bot-policy.md:354` (endgame guard left *"a stated unknown on the card"*) — while its **positive** result, the move-level human-outcome oracle (median 9.7 pp; 475/2814 pairs Stockfish cannot separate), is read by nothing: every `wdl` reference in `review-evidence-compiler.md` and `learner-modules.md` is Stockfish WDL, and `learner-rating.md` uses bands, not human outcomes |

### Three corrections to the correction

The task nominated three files for this bucket and two more looked like candidates. **Measured, they
split three-to-two.**

- **`classifier-coverage-and-noise.md` — CONSUMED, so DISCHARGED.** The coordinator's *misfiling* is
  real (it measures us, not a competitor), the conclusion is not. Three RFCs read its numbers:
  `tactical-collectors.md:163` adopts its §5 lift definition as a per-collector acceptance
  measurement, quoting it — *"P(fires on the played move) / P(fires on a legal alternative from the
  same positions)"*; `learner-modules.md:632` reads *"the shipped 1.003×"*; `longitudinal-store.md:727`
  reads *"highest-lift shipped detector family (named_structure 9.96×)"*. **Residue worth a ledger
  row, not a bucket:** its own #1 recommendation (`:651-652`) — *"**Rank by measured discrimination,
  not by census — and make the ranking a shipped table, not a hand-picked list.** This is the
  highest-value change in the dossier and it adds no detector, no content, and no engine call"* —
  has no shipped ranking table in `rfc/` or `packages/runtime/src/`. **The numbers are consumed; the
  instruction is not.**
- **`maia-band-calibrated-range.md` — CONSUMED IN SHIPPED CODE.** Its recommended bound is not merely
  cited, it is frozen: `apps/server/src/maia.ts:11` — `MAIA3_BAND_RANGE = Object.freeze({ min: 1000,
  max: 2400 })`, with the R10 justification in the comment above it. `bot-roster.md:468`'s *"Adding
  2400, or an interpolated band, must fail a fixture"* is about a band **rung**, a different object
  from the deployment **clamp**; the two are consistent, not contradictory.
- **`foundation-capability-closure.md` — CONSUMED AS METHOD.** `pack-capability-contract.md` §3.1
  builds the derived census the dossier asked for. Only its per-family tier table is unread.

---

## 6. LIVE DEBT — 10, ranked by owner interest

Ranking rule: a dossier whose subject the owner explicitly asked for, that concluded "buildable",
with no RFC, is the top. ⚖️/💡 rows and verbatim quotes from `design/BACKLOG.md`.

| Rank | Dossier | What it says is buildable | The owner's own words / ledger row | Farthest thing pointing at it |
|---:|---|---|---|---|
| 1 | `training-mode-variants.md` | The engagement-format catalogue as campaign **encounter classes** — 30 formats reduced to four verdict shapes, two shipped, one proposed, one flagged | **D870 💡** `:275` — *"shouldn't our campaign mode have more variants like that??? what other novel chess variations there be???"*; **D869 💡** `:274` — *"I really like the idea of 'solitaire chess'… THAT sounds like a variant that fits within our campaign mode and as a separate mode."*; **D1031 💡** `:513`, **D860 💡** `:558`, **D888 💡** `:538` | **Ejected by name today.** `variants.md:667` defers Solitaire — *"Shares no code with the variant axis … its own lane, in parallel"*; `return-scheduling.md:276` *"adds no encounter class"*; `campaign-core.md:115` keeps `encounter.kind` *"closed at one member in v1"*. Two `rfc-derivation.md` files, no RFC |
| 2 | `social-play-and-event-boundary.md` | A real external adapter. `:16` *"The current external handoff is **not yet an adapter**. A host stores an arbitrary HTTPS string…"* — plus provider/challenge/game identity, result retrieval, attribution, bot events | **D947 ⚖️** `:335` — *"where is the stuff like retrieving LIVE games (current tournaments for example) so streamers can cast or anyone can analyse?"*; **D1272 ⚖️** `:457` — *"shit can be separate but integrated."* D555's *"Chess.com's review and human play"* capability | **Fenced today, not built.** `live-following.md:74` — *"Chat bridge, Twitch/YouTube/OAuth integration, editorial delay … **Refused for this RFC, fenced by criterion 12**"*; `casting.md` criterion 12 is also a scope fence. `ArenaLeg`/`externalChallengeUrl` exist only in `archive/live-session-platform.md:667,688` — the opaque-URL status quo the dossier calls "not yet an adapter" |
| 3 | `generated-bot-route-source.md` | A versioned route-source interface. `:10-11` *"A separately identified route source is **the missing bot-policy layer**"*; `:91-98` *"The bot-policy RFC may now specify a versioned route-source interface with: route/repertoire identity, revision, license and transposition key"* | **D810 💡** `:587` — *"we might want an algorithm that reduces the evidence to a move… goal is a proper Elo range of bots that play human-like, with personalities"*; **D1084 ✅** `:495` — *"passes all eight gates … 9/12 versus guarded Maia 1/12"* | **Nothing.** Neither `bot-policy.md` nor `bot-roster.md` contains the string "route source". A ✅ ledger row on a passing experiment with no consumer |
| 4 | `bestline-is-not-hint-distance.md` | Bestline collection as step 1 of the ruled axis, and the missing primitive underneath it — *"a **selected semantic event on the PV**, with typed actor, target and first occurrence ply"* | **D1061 ⚖️** `:389` — *"axis approved; bestline collection is step 1"*; **0 of 764 committed records are `bestline`**. **D1069 🐞** `:401` — the four ruled rungs contradict `learner-modules` §4.8's accepted three-stage `guided_hint` contract | `d1061-bestline-distance-plan.md`. `enforced-clocks.md:476` leaves its criterion 13 *"honestly red until it exists"* |
| 5 | `theory-drill-current-joins.md` | The theory↔drill door. `:10-11` *"Tabiya has enough stable authored identity to build a real theory↔practice loop, but **no learner workflow closes it today**"*; the missing object is *"a typed, abstaining **applicability edge**"* (`:18-19`) | D555's *"Lichess theory/analysis"* capability; **D695 📊** `:618` — F7 needs typed applicability + launch. Defects **D692**, **D693**: the pack ID is dropped by `navigate("/play")` | `research-queue.md`. Deferred twice by name: `longitudinal-store.md:643` *"left to F7's exact join"*, `:475` names *"which drill door"* as future D297 work |
| 6 | `shared-candidate-evidence-packet.md` | A score-free complete-legal-candidate packet **beneath** the vector — and *do not widen* `CandidateFeatureVector`, which fails all three reuse conditions | **D1071 📊** `:403` — cold selection 329 ms mean / 799 p95 vs warm 38.7 mean; shared candidate caching needed **before** UX. **D969 🐞** `:46` | `d1071-shared-candidate-packet-plan.md`. **Partially adopted:** `evidence-move-selector.md:143-146` takes the population finding (*"`coverage = |candidates scored| / |legal moves|` … required to be **exactly 1.0**. Not a threshold — **identity**"*), but the packet itself is that RFC's **Discharge D2** (`:296`), unbuilt |
| 7 | `bounded-policy-targets.md` | Typed target-removal/return facts with **separate authorities** — not one "prophylaxis" detector | **D1023 ✅** `:517` — status reads *"research closed 2026-08-23 by `bounded-policy-targets.md`; **collector RFC drafting unblocked**, consumer selection/presets/bot weights remain downstream"*. Companion **D1025 🐞** | `d1023-bounded-policy-plan.md`. **The row says drafting is unblocked and no draft exists.** Zero RFC hits for D1023, three-ply target removal, or reintroduction; `semantic-collectors.md:226-228`'s horizons are a different object |
| 8 | `theory-knowledge-pipeline.md` | A small provenance compiler with typed keys and a local FTS bundle. `:15` *"**Do not** make the whole Skipper agent a Tabiya dependency, and do not extract its semantic [layer]"* — only the third object is a natural foundation | **D581 💡** `:177` (provenance compiler + SQLite FTS, not a semantic service); **D564 ✅** `:155` (exact+FTS 97.7% recall@5 beats semantic 94.7%) | `knowledge-retrieval/plan.md`, `never-started-lanes.md`. No FTS bundle in any RFC; the only nearby sentence is a **refusal** — `runtime-opening-identity.md:73` *"No LLM, **FTS search** or semantic similarity participates in applicability"*. Its negative half is honoured; its positive half has no home |
| 9 | `teardown-chessigma-desk.md` | **Eight ranked adoption candidates (A–H).** `:351-352` *"Candidates for `adoption-audit.md`, strongest first:"*; `:375` *"is a named entry that composes them. **Strongest cheap adoption in this teardown.**"*; `:326` *"The part worth stealing is not the score — it is the **second axis**"* | `BACKLOG.md:585` — the review-only companion posture, *"structurally our own posture"*. Owner-adjacent, not an owner ask | **Nothing.** In the coverage matrix (`README.md:100`), in no lane, in no RFC. `:405` self-rates one item *"High value, highest risk; **ledger it**, do not fast-track it"* — and that ledgering never happened, so law 4 is unmet for eight candidates |
| 10 | `teardown-chessmindai-desk.md` | Two items. `:164-165` *"Secondary steal: course-position → Maia sparring as a single integrated motion"*; `:191-192` *"Our novelty statement **should lean on** *preserved attempts compared to each other* and *phase trajectory*"* | *"the closest stack neighbor in the entire matrix"* (`:171`); an **ADR-0005 watch item** (`:198`) — the Maia-2 claim *"checks out in code — a rarity worth [recording]"* (`:62`) | **Nothing.** Cited by `adoption-audit.md:68` and `feedback-versus-the-dashboard.md:163` as evidence, never as a lane. The claim-wording change it asks for is a `design/` edit only the owner may make |

### What left this list today — 18 dossiers

Seven of `research-to-execution.md` §5's **top ten owner asks** are discharged as of this snapshot.

| Was LIVE DEBT | Now | Owner row |
|---|---|---|
| `live-relay-as-drill-source.md` (rank 1) | cited by `casting.md:5`, `live-following.md:58` | D947 ⚖️, D1272 ⚖️ |
| `time-as-a-difficulty-lever.md` (rank 2) | subject test — `enforced-clocks.md:303`, `recorded-clocks.md:291` | D1041 ⚖️ |
| `longitudinal-style-feedback-contract.md` (rank 4, "NOTHING") | cited by `player-style.md` | D552 💡 |
| `grounded-skills-taxonomy.md` (rank 5, "NOTHING") | subject test — `skills.md:233-234` | D549 💡, D1260 ⚖️ |
| `player-style-metrics.md` (rank 6) | cited by `player-style.md` | D551/D552 💡 |
| `maia-production-band-roster` + `stockfish-candidate-guard-probe` + `bot-candidate-sharpness` (rank 7) | cited by `bot-roster.md` | D810 💡 |
| `famous-game-sources-licensing.md` (rank 8) | cited by `famous-games.md` | D1043/D1060 ⚖️ |
| `review-map-and-reentry.md` (rank 9) | cited by `review-map.md` | D550 💡, D1273 ⚖️ |
| `roguelike-run-design.md` (rank 10) | cited by `campaign-core.md` | D305 💡, D1151 ⚖️ |
| `titled-player-training` + `chessable-movetrainer` | cited by `return-scheduling.md` (landed mid-pass) | D862, D864–D866 💡 |
| `interaction-state-correctness`, `endgame-latency-versus-cet`, `professional-workflow-conformance`, `workflow-default-conformance`, `llm-renderer-contract`, `integrated-platform-alignment`, `foundation-capability-closure`, `maia-band-calibrated-range`, `legal-exchange-prerequisite` | subject test (§2.1) | — |

**Residues inside those discharges, for the record.** `return-scheduling.md:9` answers D864, D865,
D866, D860 — **D867** (`:556`, *"the highest-VALUE Chessable adoption and an ADR-0006 design
prompt"*) is answered by nothing. `variants.md:667` defers D869 solitaire (§6 row 1).
`BACKLOG.md:408` **D1086 🐞** records that D1060's famous-game lift is still absent from
`capabilities.ts:159` even though `famous-games.md` is drafted.

---

## 7. Is the coverage matrix current?

**Yes for content — and "stale by eleven RFCs" is a category error, which is the larger finding.**

| Check | Result |
|---|---|
| Dossier artifacts in `design/research/` | 118 (116 dossiers + `README.md` + 2 registers) |
| Listed in the matrix | **114** |
| **Absent from the matrix** | **4** |
| Last touched | `6ad78c0`, 2026-08-23 — same day; each of the last three commits touches it |
| The six dossiers that landed today | **all present**, added in their own landing commits |

**The four the matrix does not list.** All four are `[V]` measurement or process dossiers; **not one
of the 14 teardowns is missing:**

1. `classifier-coverage-and-noise.md` — read by three RFCs; invisible in the matrix.
2. `endgame-latency-versus-cet.md` — **kill-criterion evidence.** `gates.md:160` K9 reads it; the
   matrix does not list it.
3. `stockfish-candidate-guard-probe.md` — pins depth 8 as the only measured 1.0 request shape; now
   cited by `bot-roster.md`.
4. `teardown-protocols.md` — **the report is confirmed.** The mandate is verbatim at `:8-9`: *"Each
   teardown lands as its own dossier (`teardown-<product>.md`) and updates the **coverage matrix** +
   `gates.md` E1 evidence column."* Reinforced at `:92`: *"Land it in `gates.md` E1 and flip Q1a's
   status accordingly."* **The document that mandates coverage-matrix updates is itself not in the
   coverage matrix.** Note the mandate never names `design/research/README.md` — the string "README"
   does not occur in the file — which is the likeliest reason nobody executed it on the protocol
   itself.

**Why "stale by eleven RFCs" cannot be true.** The matrix's Feeds column names design docs and
question IDs. Across 197 lines it references `rfc/` fourteen times in total, four of them active
RFCs. **The matrix was never an RFC-linkage register and cannot go stale in that dimension.** It
answers *"was it researched"* and never *"did it become anything"* — which is exactly why this join
and `research-to-execution.md` had to be built by hand. A matrix row for all ten LIVE DEBT dossiers
above looks identical to a matrix row for a discharged one.

**What *is* stale by eleven RFCs is `planning/platform-alignment/research-to-execution.md`** — same
day, six hours earlier, and wrong by 21 on the headline number. Its method is sound and reused
here; its counts are superseded by §2.

---

## 8. Structural findings

1. **"Mostly teardowns" inverts the truth about teardowns.** Ten of 14 carry an explicit adoption
   recommendation; eight landed (via `runtime-corpus-evidence`, `game-import-and-story`,
   `repertoire-gap-finding`, `open-answer-grading`, `onramp-guard`, `adoption-wave-1`,
   `longitudinal-store`, `review-map`). Two did not — §6 rows 9 and 10. The four that recommend
   nothing (`teardown-cet`, `teardown-chessable-desk`, `teardown-chesscom-desk`,
   `teardown-noctie-desk`) are the four oldest, written before the protocol asked the question.
   **Teardown-ness predicts nothing; the dossier's date does** — which also means the *next*
   teardown will produce debt by default, and `teardown-protocols.md` has no closeout clause the way
   RFCs and content waves now do.

2. **"Mostly refusals" is a ledgered defect, not a finding.** [[D1320]] `BACKLOG.md:1606` is the
   standing row. Three of the nine refusals here refuse a *mechanism* measured against a
   Maia-weighted base that [[D1271]] replaced today; two are additionally superseded by a **passing**
   experiment (D1084 ✅) whose recommendation nothing carries. **A refusal shelf is only non-debt if
   something re-checks it when the base changes** — which is precisely what `make refusal-index`
   ([[D1038]]) is being widened to do.

3. **The surface/collector asymmetry broke today, in the right direction.**
   `research-to-execution.md:356` found that *"research whose consumer is a product surface … stalls
   at the lane, while research whose consumer is an evidence collector reaches an RFC reliably."*
   The eleven drafts were almost entirely surface RFCs. **The remaining ten have inverted the old
   pattern: seven are evidence infrastructure** (applicability edge, candidate packet, bounded policy
   targets, route source, PV-event primitive, knowledge pipeline) rather than surfaces.

4. **Eleven dossiers are discharged by RFCs that do not cite them** (§2.1) — the mirror of
   `research-to-execution.md:410`'s finding that eight active RFCs cite zero research, and the reason
   a pure citation join over-counts debt by roughly a factor of two. The flow-back defect the
   CLAUDE.md log clause exists to catch is live one tier over: `BACKLOG.md:492` **D1092 🐞** already
   records that `accessible-board-input` cites zero dossiers — and it is the RFC discharging two of
   the eleven.

5. **The sharpest single item is not a teardown or a refusal — it is `training-mode-variants.md`.**
   It carries two verbatim owner quotes, three 💡 rows, and an RFC drafted **today** on its exact
   subject that names its subject and ejects it (`variants.md:667`). A dossier ejected by name from
   the RFC nearest it is more clearly debt than one nobody ever read.

6. **The remainder now fits on one screen.** 10 LIVE DEBT + 2 MEASUREMENT-UNCONSUMED = **12**,
   against 85 discharged, 12 inert and 9 refused. The honest sentence is not *"~50, mostly teardowns
   and refusals"* — it is *"12, mostly evidence infrastructure, two of them teardowns nobody
   mined, and none of them a refusal."*

---

## 9. Appendix — full bucket membership (118)

Reproduce with the two greps in §1 over `rfc/*.md` (excluding `README.md`) and `rfc/archive/*.md`.

**DISCHARGED BY CITATION (74).** Citing RFC in parentheses; `A:` = `rfc/archive/`.

`adoption-audit` (A:adoption-wave-1, A:open-answer-grading, A:repertoire-gap-finding,
A:runtime-corpus-evidence, A:social-match) · `assistance-surface-taxonomy` (intent-presets,
learner-modules, move-quality-grades) · `authored-transitions-and-features` (A:predicate-wave-3,
A:tempo-vocabulary) · `authoring-vocabulary-completeness` (A:engine-leverage, A:format-surface,
A:vocabulary-wiring) · `band-flattery-and-buried-value` (learner-rating, A:assistance-controls) ·
`basic-semantic-tactics-stage-0` (semantic-collectors, tactical-collectors,
review-evidence-compiler) · `bot-candidate-sharpness` (bot-roster) · `bot-policy` (bot-policy,
bot-roster, campaign-core, evidence-move-selector, intent-presets, learner-rating, recorded-clocks,
player-style) · `bounded-reply-semantics` (breadth-collectors, tactical-collectors) ·
`broadcast-and-teacher-surfaces` (A:live-surface-honesty, A:teacher-surface) ·
`campaign-effect-vocabulary` (A:dead-vocabulary, A:format-surface) ·
`campaign-intermediate-consequence` (learner-rating) · `census-hint-false-positives`
(A:expression-census, A:live-marker-quality) · `chessable-movetrainer` (return-scheduling) ·
`claim-semantic-anchors` (claim-semantic-anchors, pack-capability-contract, measurement-records) ·
**`classifier-coverage-and-noise`** (move-quality-grades, tactical-collectors; see §5) ·
`coaching-versus-cheating-and-the-band-curve` (learner-rating) · `competitor-play-ux`
(play-composition) · `decomposed-king-state` (breadth-collectors, tactical-collectors) ·
`detection-landscape` (A:semantic-evidence-selection) · `detector-semantic-conformance`
(A:evidence-contract-manifest, A:semantic-evidence-selection) · `engine-layer-capability-audit`
(A:engine-leverage) · `evidence-contract-topology` (A:evidence-contract-manifest) ·
`evidence-presentation` (intent-presets, learner-modules) · `famous-game-sources-licensing`
(famous-games) · `feedback-versus-the-dashboard` (feedback-delivery) ·
`fun-mechanics-outside-roguelikes` (learner-rating, variants) · `grounded-coaching-aggregation`
(longitudinal-store) · `human-like-opponents` (bot-policy, tactical-collectors) ·
`identity-retaining-mobility` (exact-legal-mobility, breadth-collectors, tactical-collectors) ·
`identity-retaining-three-edge-consequences` (breadth-collectors, tactical-collectors) ·
`league-as-return-loop` (learner-rating, return-scheduling) · `legal-square-denial`
(breadth-collectors, tactical-collectors) · `live-relay-as-drill-source` (casting, live-following) ·
`longitudinal-style-feedback-contract` (player-style) · `maia-band-outcome-transfer` (bot-roster,
bot-policy, learner-rating, A:opponent-contracts) · `maia-endgame-fidelity` (bot-policy,
learner-rating, A:opponent-contracts) · `maia-policy-scalar-stability` (bot-policy,
A:engine-request-contract, A:fixture-realism, A:format-surface) · `maia-production-band-roster`
(bot-roster) · `maia-wdl-versus-human-outcome` (learner-rating, tactical-collectors) ·
`mechanics-by-mode` (A:assistance-control-wiring, A:assistance-controls) ·
`middlegame-evidence-and-style-taxonomy` (breadth-collectors) · `mobile-scope`
(A:client-surface-floor) · `move-primitive-computability` (A:transition-primitives,
A:predicate-wave-3, A:branch-set-scale) · `non-maia-bot-composition` (evidence-move-selector) ·
`objective-lifecycle-diagnosis` (A:authored-consequence-lifecycle) · `pack-authoring-cost`
(A:deviation-classes) · `pack-primitive-stability` (pack-capability-contract) ·
`pawn-conversion-events` (breadth-collectors, tactical-collectors) · `pawn-lever-and-candidate-timing`
(breadth-collectors, tactical-collectors) · `player-analysis-and-skills` (longitudinal-store,
player-style, skills) · `player-style-metrics` (player-style) ·
`practical-difficulty-outside-tablebase` (A:resistance-spectrum, A:branch-set-scale,
A:engine-request-contract) · `quickpass-wintrChess-encroissant-chessmonitor` (learner-rating) ·
`release-platform-audit` (A:portable-account-data) · `review-map-and-reentry` (review-map) ·
`roguelike-run-design` (campaign-core) · `runtime-opening-identity` (runtime-opening-identity,
review-map, player-style, semantic-collectors, review-evidence-compiler) ·
`selection-sign-and-significance` (skills, A:semantic-evidence-selection) ·
`shared-style-atoms-as-bot-traits` (player-style) · `stack-selection` (A:authoring-frictions) ·
`stockfish-candidate-guard-probe` (bot-roster) · `teardown-365chess-desk` (A:runtime-corpus-evidence,
A:engine-leverage) · `teardown-chess2story-desk` (A:game-import-and-story) · `teardown-chessbook-desk`
(A:repertoire-gap-finding) · `teardown-chesscom-desk` (longitudinal-store, review-map) ·
`teardown-chesscom-platform-desk` (A:game-import-and-story) · `teardown-chessmotive-desk`
(A:open-answer-grading) · `teardown-drwolf-desk` (A:onramp-guard) · `teardown-taketaketake-desk`
(A:adoption-wave-1, A:game-import-and-story) · `theory-sourcing` (four A:content-sourcing-*) ·
`titled-player-training` (return-scheduling) · `wave-a-contract-closure` (tactical-collectors) ·
`wave-b-breadth-probe` (breadth-collectors, tactical-collectors).

**DISCHARGED BY SUBJECT TEST (11), no citation — see §2.1.** `endgame-latency-versus-cet` ·
`foundation-capability-closure` · `grounded-skills-taxonomy` · `integrated-platform-alignment` ·
`interaction-state-correctness` · `legal-exchange-prerequisite` · `llm-renderer-contract` ·
`maia-band-calibrated-range` · `professional-workflow-conformance` · `time-as-a-difficulty-lever` ·
`workflow-default-conformance`.

**REFUSAL (9) — §3.** `conjunction-hypothesis` · `engine-composed-band-discriminator` ·
`evidence-to-move-head-screen` · `evidence-to-move-independent-population` ·
`evidence-to-move-proper-score-repair` · `finite-state-bot-route-controller` ·
`monotone-bot-route-controller` · `state-directed-bot-profile` · `threat-salience-and-human-error`.

**INTEL, INERT (12) — §4.** `capability-watch.json` · `capability-watch.md` ·
`competitor-love-hate-sweep` · `competitor-matrix.csv` · `competitor-value-props` ·
`coverage-gap-sweep` · `coverage-sweep-2-notability` · `source-index` · `teardown-cet` ·
`teardown-chessable-desk` · `teardown-noctie-desk` · `teardown-protocols`.

**MEASUREMENT OF OUR SYSTEM, UNCONSUMED (2) — §5.** `human-outcome-coverage-depth` ·
`semantic-horizon-coverage`.

**LIVE DEBT (10) — §6.** `bestline-is-not-hint-distance` · `bounded-policy-targets` ·
`generated-bot-route-source` · `shared-candidate-evidence-packet` · `social-play-and-event-boundary`
· `teardown-chessigma-desk` · `teardown-chessmindai-desk` · `theory-drill-current-joins` ·
`theory-knowledge-pipeline` · `training-mode-variants`.

**Arithmetic:** 74 + 11 = 85 discharged; 85 + 9 + 12 + 2 + 10 = **118**.
