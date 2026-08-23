# Reconciling `roguelike-run-design.md` against `campaign-core` and today's rulings

**Date:** 2026-08-23 · **Author:** claude · **Status:** planning-tier reconciliation, no writes to
`design/`, `rfc/` or code · **Commissioned by:** [[D1091]]/[[D1092]] (RFCs citing zero research),
priced under [[D1230]] (full ask, blockers named, no cuts for document size).

**Subject dossier:** `design/research/roguelike-run-design.md` (611 lines, landed 2026-08-15,
derived at commit `8744adb`).
**Targets:** `rfc/campaign-core.md` (implementing, 620 lines) and `design/06-campaign.md`
(intent, 576 lines) as amended 2026-08-23.

---

## 0. Two corrections to the commissioning frame, made first

**0.1 The dossier is not uncited; the RFC is.** The task states nothing in the repo points at the
dossier. That is false and the correction matters, because it relocates the defect. Ten files
cite it `[V]`:

| Citer | Cites | Nature |
|---|---:|---|
| `design/06-campaign.md:358` | 1 | intent-tier attribution for the whole of §5 |
| `design/research/README.md:129,130,131,149` | 4 | coverage-matrix row + three dossiers naming it as input |
| `design/BACKLOG.md` | 5 | incl. `:1536` (suppressor boss), `:1538` (legibility-not-power), `:1561`, `:1570`, `:1144` |
| `design/research/campaign-intermediate-consequence.md` | 11 | its declared parent |
| `design/research/fun-mechanics-outside-roguelikes.md` | 12 | inherits C1–C10 whole |
| `design/research/conjunction-hypothesis.md` | 2 | R11's statement widened here |
| `planning/campaign/rfc-derivation.md:11` | 1 | named as a drafting input |
| `planning/exploration/log.md:2368`, `planning/work-register.md:209`, `planning/platform-alignment/research-to-execution.md` | 8 | |

**What cites nothing is `rfc/campaign-core.md`.** Its Design refs field
(`campaign-core.md:7-9`) names three `design/` docs and no dossier; a repo-wide grep for
`design/research` in that file returns **zero hits** `[V]`. Its single occurrence of "dossier"
(`:597`) refers to `planning/campaign/rfc-derivation.md`, a planning document. So the join is
broken at exactly one hop: dossier → `design/06` → **✗** → RFC. The derivation names the dossier
once in a list of inputs (`rfc-derivation.md:11`) and the RFC inherits only what `06` §5 had
already transcribed. **That is the mechanism [[D1091]] describes, observed at file resolution:
research reaches intent and stops there.**

**0.2 [[D1094]] does not exist.** A repo-wide grep returns zero hits `[V]`. The recording row is
**[[D1092]]** (`BACKLOG.md:492`), which names `campaign-core` in its list of eight zero-citation
RFCs. Cited correctly below.

---

## 1. Every dossier finding, three ways

Findings are indexed by dossier section. **Reflected** = the substance appears in `campaign-core`
or `design/06`. **Contradicted** = a target document or ruling says otherwise. **Absent** = live,
unsuperseded, and in neither target.

### 1a. Method and framing (§1, §Method)

| # | Finding | `roguelike` cite | `campaign-core` | `design/06` | Verdict |
|---|---|---|---|---|---|
| F1 | Comparison set chosen by *device contributed*, six games | `:43-56` | — | — | **Absent** (immaterial — method) |
| F2 | **Action roguelikes excluded: our encounter is deliberation-bound, not execution-bound**, so minutes-per-node figures do not transfer even directionally | `:57-62` | — | — | **Absent — and now load-bearing** (see §2.5, [[D1042]]) |
| F3 | Every external fact `[P]`; every run-minute claim `[M]`; no per-attempt timing telemetry exists | `:13-25`, `:554-556` | — | — | **Absent** (see §5) |
| F4 | Correction to `campaign-effect-vocabulary` §5a: StS is ≈45–51 nodes, not 51 | `:88-91` | — | — | Reflected nowhere; immaterial |

### 1b. Run bounding — the five devices (§2)

| # | Finding | `roguelike` cite | `campaign-core` | `design/06` | Verdict |
|---|---|---|---|---|---|
| F5 | **Device A — fixed node count. Transfers.** Free, legible, needs no chess truth | `:100` | `:99-102` — `acts: [Act,Act,Act]`, `layers: [Layer,Layer,Layer]`, exactly nine seals | `:406-410` | **Reflected in both** |
| F6 | **Device B — escalating requirement. REFUSED by R4+R9**; manufacturing the ramp is law 8 | `:101`, `:337-346` | `:427-448` refuses eval/grade vocabulary and rewind-count-as-score; never names the escalating economy | `:360-366` | **Reflected in `06`; absent from the RFC's closed refusal list** |
| F7 | **Device C — pursuit clock. REFUSED by the thesis** (a retry price by another name) | `:102` | Time controls deferred, Discharge D4 (`:539`) | `:362-365`, `:186-193` | **Reflected in `06`** |
| F8 | **Device D — in-encounter horizon. Transfers, and already ships** as `authoredBoundary.plyHorizon` | `:103`, `:111-133` | assumed at `:229-231` (a boss is "not horizon-free"); never stated | `:416-428` | **Reflected** |
| F9 | **Device E — player-elected run length** (ITB 2–4 islands, StS three keys). "The cheapest way to serve both *not too long* and *I want more*" | `:104`, `:527-530` | **Refused by construction** — `:99-102` fixes three acts, "v1 is fixed-shape" (`:462-464`) | Not carried | **ABSENT — a named zero-cost device dropped without its cost stated.** Amendment 6 |
| F10 | Census: 36 of 37 packs declare `plyHorizon`, median 12, mean 14.2, range 7–40 | `:113-121` | — | `:416-428`, re-derived to 50/56, median 11 | **Superseded by content** — see §1g |

### 1c. The eight ranked mechanisms (§3)

| # | Mechanism | Rank | `roguelike` cite | State in `campaign-core` | Verdict |
|---|---|---:|---|---|---|
| F11 | **Offered-choice lens draft with a real skip.** "Declining is a move — the skip is what makes the offer a decision rather than a gift." `C(34,3)=5,984` offers | 1 | `:168-184` | `reward?: NodeReward` (`:110`) is **one authored constant per node**. No offer, no menu, no skip | **ABSENT.** The top-ranked, zero-authoring variety driver became a fixed grant. Amendment 3 |
| F12 | **Run-defining opening choice**, incl. Neow's disadvantage-paired-with-reward | 2 | `:186-206` | `startingModules` (`:97`) is a **document** field, not a learner choice — every CampaignRun of a document starts identically | **ABSENT.** Amendment 4 |
| F13 | **Capability-suppressing boss** (Balatro boss blind). "The highest-value mechanism nobody in the repo has proposed yet"; law-8-legal by construction; makes the monotone lattice non-monotone | 3 | `:208-232` | **Fully implemented** — `suppress?: ModuleId[]` (`:110`), §3.3 (`:219-225`), narrowing gate in the §3.2 algebra (`:204-217`), disclosure criterion 7 (`:507-508`) | **Reflected in both** (`06:509-514`). The dossier's own invention, landed end to end |
| F14 | **Advance-visible mutually-exclusive routes** — node shows phase + difficulty-availability label before entry | 4 | `:234-251` | Layer choice exists (`:116-123`); node card states pack title, `suppress`, reward, boss flag (`:415-419`) — **no difficulty-availability label** | **Half-absent.** Amendment 5 |
| F15 | **Consumable with an honest expiry** — the `attempt_end` reveal window already is one; budget it to price **looking, not retrying**, "so it does not touch *experimentation without cost*" | 5 | `:253-267` | Not present. [[D945]] budgets **rewinding and branching** instead | **Contradicted by [[D945]]** — see §2.3. The alternative was never put to the owner |
| F16 | Resource refusal would be a new class needing its own run-log event; `MATCH_LIVE` is the only refusal and it is a *permission* refusal | 5(d) | `:263-266` | **Built exactly as predicted, and landed today** — spec at `:152-168`; code at `packages/runtime/src/campaign-state.ts:85` (`CAMPAIGN_REWIND_EXHAUSTED`), `:219` (thrown at zero balance), `:37`/`:68-71`/`:214-222`/`:250-253` (the `charge_spent` event and fold), commit `e51b5a3` `[V]` | **Reflected.** Note the dossier's grep tokens (`rewindsUsed\|rewindCount\|rewindBudget\|REWIND_`) understate it — **the live vocabulary is `charge`**, so a re-run of the dossier's own census would miss the economy it predicted |
| F17 | **Synergy discovery**, rank conditional on R11; "if it fails, our loadouts are *additive*… a configurable lens set rather than a build" | 6 | `:269-292` | Absent | **SUPERSEDED — R11 refuted** (`conjunction-hypothesis.md`, [[D277]] `BACKLOG:1561`). The dossier pre-named the consequence. **Closed** |
| F18 | **Unlock drip.** Earn side is nearly empty; raw material sits unused: **15 of 49 lenses named by no authored content, 9 of 25 shapes named by no pack** — invisible to `shapeRecommendations`. "Making them *earned* rather than *invisible* is a reframe, not a build" | 7 | `:294-311` | Transformed: module unlocks over ten `UnlockableModuleId` (`:191-201`) | **Half-reflected. The lens/shape half is absent — and [[D1151]] just made it load-bearing.** Amendment 1 |
| F19 | ADR-0007 constraint: "A drip is compatible; a shop is not" | 7(e) | `:310-311` | `:286` cites ADR-0007's unlocked-by-playing; §8.4 refuses rarity tiers (`:442-444`) | **Reflected** |
| F20 | **Persistent difficulty ladder.** Two honest dials only: the Maia band, and **the slot budget (5→3→1), "arguably the *more* honest one, since fewer lenses means more you must see yourself"** | 8 | `:313-335` | Absent entirely | **ABSENT from both.** And the slot-budget dial is a **fourth progression denomination the [[D305]] fork never listed** — see §3 |
| F21 | The Maia band dial is **measured inert**: `#maia` sends `Elo`, then `SelfElo`/`OppoElo` at 1500, byte-identical on 12/12 positions — "the campaign's one honest difficulty dial is, today, inert" | 8(d) | `:327-334` | Not named | **SUPERSEDED — fixed the same day** by commit `43c6c4a` (`opponent-selector.ts:587-596`) `[V]`. **Closed** |
| F21b | `Service.milestones()` mints **exactly 7 kinds, all first-time-only** — "at most 7 events per learner, ever. That is a scrapbook, not a drip" | 7(d) | `:306-308` | **STILL TRUE at HEAD** `[V]` — 7 kinds at `apps/server/src/service.ts:938-942`, dedupe guard at `:939`: `first_attempt`, `first_stable`, `first_objective_achieved`, `first_win`, `first_scheduled_return`, `ten_attempts_one_root`, `first_flip_sides` | **Live and absent.** The earn side is still a scrapbook, and [[D1151]] just made progression depend on it → Amendment 1 |
| F22 | **Escalating numeric economy refused outright rather than imitated.** "A *score* that is really a proxy for nothing is worse than no score" | — | `:337-346` | Partly — §8.3 refuses charge-counts-as-score (`:438-441`) | **Reflected in `06:360-366`** |

### 1d. Where the analogy breaks (§4) — the four findings that matter most

| # | Finding | `roguelike` cite | `campaign-core` | `design/06` | Verdict |
|---|---|---|---|---|---|
| F23 | **§4a — the build does not compound.** "A lens changes what you can see. A chess position does not care what you know." The curve is flat *by construction* | `:372-386` | Mechanism present: an unlock gates an evidence consumer, "availability, never truth" (`:199-201`) | `:361-366` | **Reflected** |
| F24 | **§4b — past a threshold the build's marginal value is *negative*, measured** (D78: median 58 observations/position, 8.31 entries/ply at 1.01× lift). The optimisation is **the smallest sufficient set, not the strongest** | `:388-401` | **Absent.** Nothing in the RFC bounds how many modules may be simultaneously effective; the §3.2 algebra grows inventory monotonically toward the ceiling (`:204-217`) | `:399-404`, `:196-202` | **Reflected in `06`; ABSENT from the RFC.** Amendment 2 |
| F25 | **§4b — the genre is Into the Breach, not Slay the Spire.** "Forcing the Spire metaphor is what produces the proposals law 8 keeps refusing" | `:403-413` | Absent; §1 cites StS explicitly ("the StS gesture", `:121-122`) | `:399-404` | **Reflected in `06`; absent from the RFC** |
| F26 | **§4c — our content decays and a Jaw Worm does not.** 275 deviation notes + 145 checkpoints over 37 packs are **read-once**; the encounter is a thinner object the second time. "This argues for a shorter run, not a longer one" | `:415-431` | Absent | `:406-410` carries only the *consequence* (9 nodes / 24.3%), not the mechanism | **Reflected as a number, absent as a constraint — and [[D1151]] makes it central.** See §3.2 |
| F27 | **§4d — a run that cannot be lost is not a run.** "A sequence of encounters with no failure state is a playlist, not a run. No loadout mechanism fixes this; it is orthogonal to all eight of §3" | `:433-443` | **The RFC is option (b).** Map progression strictly forward (`:125-128`); a node seals "whatever its verdict" (`:145-151`); `module_unlocked` appends "**whatever the verdict**" (`:286`); `status` is `active\|completed\|abandoned` with `completed` = nine seals (`:315`, `:379`) — **no run-level failure exists** | `:516-544` resolves the *scope* (submitted branch) but gives the run no losing condition | **THE HEADLINE. See §3.3 and Amendment 8** |
| F28 | §4d resolution **(a)**: move the priced act from retrying to **declaring done**; failing an act boss **ends the run**. Dossier's own view, flagged as an owner call because it needs a verb the product lacks — *submit* | `:445-460` | **Half-adopted.** The submit verb ships (`:271-304`, `POST …/submit`); the run-ending half does not | `:538-544` adopts the verb; never the run-ending clause | **Half-absent — and the missing half is the half that creates the stake** |
| F29 | §4d resolution **(b)**: no failure state; "honest, cheap, and **strictly weaker** — it makes the campaign a presentation layer over the existing catalogue" | `:454-456` | **This is what shipped** | — | **Adopted by default, never chosen** |
| F30 | **What the loop escalates is LEGIBILITY, not power** — "a smaller promise than Slay the Spire's, and one we can keep" | `:462-469` | Absent | `:361-366` verbatim | **Reflected in `06`** |

### 1e. Recommended run shape (§5a)

| # | Finding | `roguelike` cite | `campaign-core` | Verdict |
|---|---|---|---|---|
| F31 | **Nine nodes, three acts of three, 35–55 min** | `:475-476` | `:99-102` exactly | **Reflected** (numbers stale — §1g) |
| F32 | **Acts are `06` §2a's difficulty-availability tiers**: Act I outcome-measured / Act II authored / Act III tablebase-measured. "Stakes escalate in **decidability**, not in numbers" | `:496-511` | **Absent.** `Act { id, layers }` (`:99-101`) carries no phase, no policy, no decidability label; the four validator rules (`:116-120`) check none of it. A valid document is nine opening packs | `06:412-416` carries it as intent | **ABSENT from the RFC.** Amendment 5 |
| F33 | **Per-act composition: 2 encounters + 1 act boss** — "the shape three authors independently wrote" | `:518-520` | **Reflected and linted** — `CAMPAIGN_BOSS_PLACEMENT`, boss is layer 3's only choice (`:116-120`) | **Reflected** |
| F34 | **Route choice: two candidates per non-boss node**, phase-balanced 4/4/4 | `:522-526` | `choices: Node[] // 1..3` (`:104-105`) — **1 is legal**, so a document with no path choice anywhere validates. No minimum lint | **Structurally present, not required.** Amendment 7 |
| F35 | **Elective extension (device E): optional Act IV** gated on something earned in the run, at zero content cost | `:527-530` | Refused by fixed shape | **Absent** — same as F9 |
| F36 | **Loadout: 5 slots over 34 attested lenses ⇒ 278,256 builds**, 3-lens offers after each of 6 non-boss encounters; the 13 unconditional observations excluded as blanks | `:532-535` | **Zero hits** for `lens`, `loadout`, `slot budget`, `34 attested`, `278,256` in the whole RFC `[V]`. The pool is ten modules (`:191-201`) | **ABSENT — and it contradicts standing intent at `06:39-46`.** Amendment 2 |

### 1f. The eight requirements (§5b) — current status

| # | `roguelike:539-549` requirement | Status at HEAD | Disposition |
|---:|---|---|---|
| 1 | Server-held inventory (not localStorage) | **Met in spec** — `campaign_runs`/`campaign_events`, `:373-396`; [[D945]]'s server-held clause `06:237-239` | **Closed** |
| 2 | Per-lens grain below the nine axes | Vocabulary moved (nine axes → eleven modules), gap not closed; `06:39-46` still asserts the per-lens deck | **Live** → Amendment 2 |
| 3 | **2 middlegame packs (3 with route choice)** | **Refuted by content: 16 middlegame packs at HEAD** `[V]` | **Closed** — see §1g |
| 4 | Campaign-scale difficulty-availability label + a human-outcome `DecidednessGround` | Live; `06:48-57` still records the missing fourth ground | **Live** → Amendment 5 |
| 5 | Fix the `#maia` `SelfElo`/`OppoElo` regression | **FIXED** — `opponent-selector.ts:587-596` emits `SelfElo`/`OppoElo` **first**, then `Elo ${eloApplied}`, so the alias write lands last and wins; the value is range-checked by `engine-band.ts:68-90` (`TARGET_ELO_OUT_OF_RANGE`) and the order is pinned by `opponent-selector.test.ts:597-606`. Fixed by commit **`43c6c4a`, 2026-08-15 — the same day the dossier landed**, against the pre-`43c6c4a` shape `[V]` | **Closed.** The dossier's *"the campaign's one honest difficulty dial is, today, inert"* (F21) was true for hours |
| 6 | Fix or delete `arrows` | **STILL INERT** `[V]`. `evidence-catalog.ts:892` disposition `experimental`, reason verbatim: *"D546: migrated preference has no producer and no renderer; F5 or an owner ruling decides activation or retirement."* Only readers are the settings `<select>` (`AssistanceSettings.svelte:64`) and migration validation (`assistance-preference.ts:43,49-51`); `evidence-catalog.test.ts:49-50` **pins the inertness rather than a behavior**. (The `EvidenceForm` named `arrows`, `evidence-contract.ts:6`, is a separate live concept — requirement 6 is about the assistance slot only) | **Live** → Amendment 13 |
| 7 | **Run R11 before pricing any slot budget** | **Run and REFUTED** — best conjunction 35.7%/2.73× vs best single leaf 69.4%/12.64×; 0 of 7 beat their own components ([[D277]], `BACKLOG:1561`) | **Closed — and it closes F17 with it** |
| 8 | **An owner ruling on §4d — failure state or not** | **Never asked.** Not in `design/BACKLOG.md`, not in the decision queue, not in `planning/campaign/plan.md` | **LIVE, and shipped in the meantime** → Amendment 8 |

### 1g. Findings superseded by content growth — re-derived at HEAD `[V]`

The dossier's arithmetic ran over **37 canonical packs at `8744adb`**. At HEAD there are **56**
(`content/drafts/*.json`, packs declaring a `phase`; sidecars excluded — the dossier's own
selection rule, `:123-127`).

| Quantity | Dossier (37 packs) | HEAD (56 packs) `[V]` | Consequence |
|---|---|---|---|
| Packs by phase | op 20 · mg **1** · eg 14 · cross 2 | op 23 · mg **16** · eg 14 · cross 3 | **The middlegame bill is zero.** §5a argument 2 is dead |
| `plyHorizon` declared | 36 of 37 (97.3%) | **50 of 56 (89.3%)**, median **11**, mean **12.8**, range **2–40** | Device D still holds; **the floor moved 7 → 2 ply**, which breaks §2d's "median 12 ⇒ 6 decisions" chain at the short end |
| Median ply by phase | op 11 · mg 8 · eg 24 | op **11** · mg **8** · eg **24** | Unchanged — the medians are robust |
| Deviation notes / checkpoints | 275 / 145 (7.4 dev/pack) | **349 / 209** (6.2 dev/pack) | §4c's decay mechanism holds; per-pack density fell slightly |
| 9 nodes = % of catalogue | 24.3% · **4.1 runs** to repeat | **16.1% · 6.2 runs** | §5a argument 1 weakens |
| 15 nodes = % of catalogue | 40.5% · 2.5 runs | **26.8% · 3.7 runs** | A 15-node run today repeats less often than a 9-node run did at authoring time |

> **Two of the three converging arguments for nine nodes have moved.** Argument 2 (the middlegame
> bill) is refuted outright — 16 middlegame packs exist, so `06:518-520`'s *"Act II is impossible
> today"* framing and the *"2.2 agent-hours"* figure at `06:408-409` are stale, as
> `fun-mechanics-outside-roguelikes.md` already flagged at 11 packs. Argument 1 (catalogue
> exhaustion) is intact in direction and halved in force. **Argument 3 (minutes) is untouched and
> remains `[M]`** — it is now the only surviving quantitative argument for the shape the RFC has
> already implemented, and it is the one the dossier itself said was unmeasured.
>
> The shape is not necessarily wrong. The *stated grounds for it in `design/06` §5 are*, and law 3
> makes that an amendment, not a footnote. **Amendment 9.**

---

## 2. Today's five rulings, read against the dossier

### 2.1 [[D1151]] — progression denominated in THE CATALOGUE

`BACKLOG:421` · `06:368-397`. **The dossier does not contradict it. It adds three things the
ruling did not consider, and one of them changes the ruling's cost.**

| | |
|---|---|
| **Supports** | §4a/§4b (`:372-401`) is the *reason the question exists at all* — the flat power curve is the dossier's finding, and `06:361-366` attributes it. [[D305]]'s framing sentence (*"now that the power curve is flat by construction"*) is this dossier's sentence |
| **Adds (i) — the catalogue is a measured, depleting, completable quantity** | §4c (`:415-431`): authored content is **read-once**. At HEAD, **349 deviation notes and 209 checkpoints over 56 packs** `[V]`. GW2 and Stardew — the ruling's two exemplars — back their collections with content pipelines; ours is 56 packs and a per-pack authoring cost of 28.8/40.6/65.0 minutes (`:165-166`). **The ruling turns `04`'s breadth into the reward; §4c is the measurement of exactly how much reward exists, and it is the reason the dossier argued for a shorter run.** Not in the ledger row, not in `06` §5's ruled paragraph |
| **Adds (ii) — the drip material is already sitting there, invisible** | §3 rank 7 (`:294-311`): **15 of 49 lenses are named by no authored content and 9 of 25 shapes are named by no pack**, so they are invisible to `shapeRecommendations` — "making them *earned* rather than *invisible* is a reframe, not a build". [[D1151]]'s accepted cost is [[D300]] (*"our collection vocabulary is not yet a collection"* — 132 of 156 concepts are singletons, `BACKLOG:1139`), and the ruling's own note lands on the same place: *"today the honest collection is the 25-entry shape library"* (`06:396-397`). **The dossier reached that conclusion nine days earlier from the supply side and named the unnamed remainder.** The implementing RFC's D300 prerequisite should be discharged against the dossier's census, not re-derived |
| **Adds (iii) — a fourth option the fork never offered** | §3 rank 8(c)(ii) (`:321-326`): **the slot budget as an Ascension ladder, 5 → 3 → 1**, described as *"arguably the **more** honest one, since fewer lenses means more you must see yourself"*. That is progression denominated in **a shrinking capability**, and it is none of (a) cadence, (b) history, (c) catalogue. **The owner was given three options where the research supported four** |
| **Contradicts** | Nothing |

**And a citation defect in the row the owner ruled from.** [[D305]] (`BACKLOG:1144`) describes
option (a) as *"close to the option `roguelike-run-design.md` §4d called 'strictly weaker'"*, a
gloss repeated verbatim in `fun-mechanics-outside-roguelikes.md:1569-1571`. Read at source:
§4d's *"strictly weaker"* (`:454-456`) is a judgement about **having no failure state**, not
about any progression denomination — the sentence is *"**(b) No failure state.** …Honest, cheap,
and strictly weaker — it makes the campaign a presentation layer over the existing catalogue."*
The dossier **never called any progression denomination strictly weaker**. A failure-state
judgement was transposed onto a denomination option, and it argued against the option the ruling
kept as the floor.

Combined with **[[D1190]]** (`BACKLOG:432` — *"I framed [[D1151]] to the owner on a false premise…
`RatingScreen.svelte` already renders a learner rating"*), **[[D305]] was put to the owner with a
stale premise, a transposed citation, and one option missing.** The conclusion may still be
right; the ground under it is now unreliable on three counts rather than one. **Amendment 10.**

> **Direct answer to the commissioning question — was the catalogue ruling made without evidence
> the dossier held? Yes, on three counts:** the catalogue's measured finiteness and read-once
> decay (§4c), the already-counted invisible remainder that a catalogue drip would draw on
> (§3 rank 7), and a fourth denomination the fork omitted (§3 rank 8). **None contradicts the
> ruling.** The first sharpens its accepted cost, the second cheapens its prerequisite, the third
> was the owner's to see and did not reach him.

### 2.2 [[D1040]] — unlocked by playing; winning gates prestige only

`BACKLOG:373` · `campaign-core:235-267`, `:297-304`. **Supported. And it does not settle what the
RFC now reads it as settling.**

| | |
|---|---|
| **Supports** | §3 rank 7(e) (`:310-311`): *"ADR-0007 — unlocked by playing, never purchased. A drip is compatible; a shop is not."* The genre evidence in rank 7(a) (`:296-298`) is **playing-denominated in three of four systems**: StS unlocks cards by *playing* a character; Hades' Mirror of Night spends darkness gathered in runs; Balatro's joker and deck unlocks. The one arguable exception is ITB's achievement Coins. The dossier's twin-clause evidence is thinner than `fun-mechanics` §3/D2's four-system sweep — **cite `fun-mechanics-outside-roguelikes.md:234-266` for the twin clause, not this dossier** |
| **Adds — and this is the escalation** | The dossier separates two things [[D1040]] does not. **Granting a node's reward on a failed seal** (rank 7 / ADR-0007) and **whether a failed act boss ends the run** (§4d, `:445-453`) are *orthogonal*: §4d(a) proposes both simultaneously — the reward is granted, and the run ends. `campaign-core` collapses them: `:286` grants "whatever the verdict" **and** `:125-128` advances the map on any seal. **[[D1040]] ruled the first. The RFC's changelog (`:607-620`) and §4.1's RULED paragraph (`:297-304`) present the pair as ruled.** The run's un-loseability is not owner-ruled by anything |
| **Contradicts** | Nothing |

**Correction to a premise still standing in the ledger.** [[D304]] (`BACKLOG:1143`) argues its
twin clause *"matters now because `06` §5's accepted ruling gives the campaign a failure state"*.
It does not. `06:538-544` gives a **node** a sealed verdict via the submitted branch; the run
gets no losing condition, and `campaign-core:315` confirms — `active | completed | abandoned`,
with `completed` = nine seals. **The urgency argument under D304 rested on a failure state that
was never built.** D304 is correctly closed by [[D1040]] regardless.

### 2.3 [[D945]] — the earned rewind/branching economy

`06:213-239` · `campaign-core:130-187`. **Partly contradicted by the dossier — and the dossier
held a cheaper alternative that was never put to the owner.**

| | |
|---|---|
| **Contradicts** | §3 rank 5 (`:253-267`) proposes budgeting the **`attempt_end` reveal window** — already shipped, opens on reveal and closes on the next committed move (`packages/runtime/src/feedback.ts:22-30`) — and states the reason explicitly: *"you have an economy that prices **looking, not retrying** — so it does not touch 'experimentation without cost'."* [[D945]] budgets **rewinding and proactive branching**: precisely the quantity `06` §2c (`:186-193`) had isolated as *"the only real conflict with the thesis"*. **The dossier's design refuses the collision; the ruling accepts it and prices it.** The ruling is the owner's and stands (`06:213-216` verbatim); the dossier's alternative was **never offered as an option** — it appears in no ledger row and in no question put to the owner |
| **Supports** | §3 rank 5(d) (`:263-266`) predicted the mechanism's shape exactly: no rewind budget of any kind exists repo-wide, and a *resource* refusal is a **new class needing its own run-log event**. `campaign-core:152-168` builds it — `CAMPAIGN_REWIND_EXHAUSTED`, HTTP 409, `charge_spent` appended in the same transaction. **Reflected without ever being cited** |
| **Supports** | §3 rank 8 (`:321-326`) reaches for the same instinct — scarcity-as-ladder — from the other side, and reaches the same conclusion as [[D945]]'s act scaling: the honest ladder is *fewer capabilities*, not *harder numbers*. `campaign-core:145-151`'s `CAMPAIGN_ECONOMY_MONOTONE` lint (act1 ≥ act2 ≥ act3) is that shape |
| **Adds** | §5b requirement 8 and R6 gate exactly this question, and both remain open. `campaign-core:171-176` handles it correctly with `validation: "candidate"` — *"cheap to change and impossible to change silently"*. **No amendment owed here; the device is right.** But the reveal-budget alternative deserves a ledger row so the owner can see the option that was not shown. **Amendment 11** |

### 2.4 [[D1152]] — the survival/streak verdict producer, closing the vocabulary at four

`BACKLOG:536` · `06:451-478`, `:444`. **The dossier is silent on the ruling and adds one
unnoticed consequence.**

| | |
|---|---|
| **Supports / contradicts** | Neither. The dossier surveys no survival format |
| **Adds — verdict shape 4 punctures the run-bounding argument** | §2b device D (`:103`) is one of only **two** surviving bounding devices, and its whole force is *"the **encounter** cannot trail off, so the run cannot either"*. A survival encounter is bounded by **"nothing but failure"** (`06:444`). So shape 4 is the one encounter class device D does not bound, and the run's minute envelope stops being the sum of its `plyHorizon`s. **Neither `06` §5 nor `campaign-core` records this.** It is not urgent — shape 4 is deferred at `campaign-core:537` (Discharge D2) — but the discharge row should carry it, because the natural first survival node is *"survive as long as you can"* and the dossier's §2d arithmetic silently assumes a horizon. **Amendment 12** |
| **Adjacent caution, stated once and not overclaimed** | §2b device C (`:102`) refuses a **pursuit clock** as *"a retry price by another name"*. A survival encounter is not a pursuit clock — its pressure is internal to the encounter, not a run-level meter — but it is the closest thing in the design to one, and shape 4's implementing RFC should say why the two differ rather than leave the resemblance unexamined |

### 2.5 [[D1042]] — the surface-scoped balance law; campaign unrestricted

`BACKLOG:375` · `06:271-306`. **Supported; the dossier supplies the filter the ruling does not
have.**

| | |
|---|---|
| **Supports** | The ruling's *"a variant campaign is a **different campaign**, not a setting on the standard one"* (`06:293-299`) is the same structural instinct as §3 rank 2 (`:186-206`) — ITB's squads are **capability sets, not power levels**, and the run has an identity before the first encounter. The dossier's rank 2 is the mechanism the new-hero analogy names |
| **Adds — the import filter** | §1's exclusion criterion (`:57-62`): action roguelikes are excluded because **our encounter is deliberation-bound, not execution-bound** — *"a chess ply is a decision, not an input, so their minutes-per-node figures do not transfer even directionally."* [[D1042]] opens the campaign to *"as crazy as we want to"* and supplies no test for which imports transfer. **This is that test**, and it is cheap to state |
| **Adds — the law-8 floor survives the licence** | Device B's refusal (`:101`, `:337-346`) is a **law-8** matter, not a variant matter. `06:302-306` says the §3 laws still bind inside every campaign, which covers it — but a future variant-campaign author reading *"as crazy as we want"* is exactly the reader who reaches for Balatro's 300 → 50,000 ante ladder, the single cleanest device in the comparison set and the one the dossier says *"say it plainly and do not build a chess-legal imitation of it"* |
| **Adds — variant campaigns multiply the §4c decay bill** | Each variant campaign is a different campaign needing its own content, against a 56-pack catalogue whose per-pack cost is 28.8–65.0 minutes (`:165-166`) |
| **Contradicts** | Nothing |

---

## 3. [[D305]]'s three answers, re-read against the dossier

### 3.1 Does the dossier carry its own version of the fork?

**No — and that is the finding.** [[D305]] is sourced to
`fun-mechanics-outside-roguelikes.md:1545-1611` (§10), which is a genuine three-way owner
question. `roguelike-run-design.md` asks a **different** owner question, at §4d and §5b
requirement 8: *failure state or not* (`:445-460`, `:548`). The two dossiers each raised one
owner-facing fork. **One was asked and ruled today. The other was never asked, and the campaign
shipped one of its two answers.**

### 3.2 What the dossier holds about the catalogue option that the ruling should have known

Three items, detailed in §2.1: **§4c** (the catalogue is finite, read-once, and measured — 349
deviation notes / 209 checkpoints over 56 packs at HEAD), **§3 rank 7** (15 of 49 lenses and 9 of
25 shapes are already-counted, currently invisible drip material), and **§3 rank 8(c)(ii)** (the
shrinking slot budget as a fourth denomination). None contradicts [[D1151]].

### 3.3 §4d and the "strictly weaker" claim — what it actually says

The earlier note is **half right and its half-rightness matters**. §4d(b) (`:454-456`) does say
*"strictly weaker"*, and it does mention the catalogue — but the option it is judging is **"no
failure state"**, and the phrase it uses is *"it makes the campaign a **presentation layer over
the existing catalogue**"*.

Read against what shipped, that sentence stops being a judgement about a rejected option and
becomes a **description of `campaign-core` as specified**:

| §4d(b), the option the dossier called strictly weaker | `campaign-core` at HEAD |
|---|---|
| "The run is a bounded curated sequence" | `acts: [Act,Act,Act]`, `layers: [Layer,Layer,Layer]`, nine seals, forward-only (`:99-102`, `:125-128`) |
| "…and the replay driver is entirely the loadout" | There is no loadout (F36). The replay driver is the authored `reward` chain (`:110`) and path choice (`:121-123`) |
| "It makes the campaign a presentation layer over the existing catalogue" | [[D1151]] denominates progression **in the catalogue** (`06:368-375`) |
| Its alternative, §4d(a): "Failing an act boss ends the run" | Not built. A failed boss seal advances the map like any other (`:145-151`, `:286`) |

**So the option the dossier judged strictly weaker is the one that shipped, without the owner
decision the dossier's own requirement 8 demanded** — and [[D1151]] independently moved the
product toward the same shape by denominating progression in the catalogue. Neither step was
wrong on its own. **Nobody has looked at them together, and the dossier's §4d says what the
combination is.**

This is not an argument for adding a failure state. It is an argument that `06` §5 currently
carries the dossier's *"a run that cannot be lost is a playlist, not a run"* framing at
`:516-522` **while describing a run that cannot be lost** — the passage resolves the
conflation (*no resource refusal: true; no failure state: false*) at the **node** scope and
leaves the **run** scope exactly where §4d found it. An intent document should not carry both.

---

## 4. The run architecture — dossier vs `06` §5 vs `campaign-core`

| Element | `roguelike-run-design.md` §5a | `design/06` §5 (as amended today) | `campaign-core` (implementing) | Divergence |
|---|---|---|---|---|
| **Nodes** | 9, from three converging arguments (`:475-495`) | 9, arguments transcribed (`:406-410`) | 9 — `[Act,Act,Act]` × `[Layer,Layer,Layer]` (`:99-102`) | Shape agrees. **Two of three stated arguments are stale** (§1g) |
| **Acts** | Difficulty-availability tiers; decidability escalates (`:496-511`) | Same, verbatim (`:412-416`) | `Act { id, layers }` — **no phase, no policy, no label; no validator rule** (`:99-101`, `:116-120`) | **Act semantics absent from the RFC.** A nine-opening-pack document validates |
| **Layers / path choice** | 2 candidates per non-boss node, 4/4/4 phase-balanced (`:522-526`) | Not specified numerically | `choices: Node[] // 1..3` (`:104-105`); only the boss layer is linted to exactly 1 | **1 is legal.** The [[D893]] StS gesture the RFC cites (`:121-123`) is optional in its own schema |
| **Node types** | One class — the authored pack encounter | Four verdict producers (`:439-444`) | **Closed at one member**: `encounter: { kind: "pack" }` (`:108`), Discharges D1/D2 for the rest | Deliberate v1 cut, named. **No divergence** |
| **Boss** | Act I `theory_strict` · Act II `human_common` + plan · Act III `perfect_tablebase` (`:502-504`) | Same (`:412-416`), with the rated-boss/Act-II amendments (`:492-507`) | *"ordinary registered packs"* with `suppress` (`:224-225`); rated boss deferred (`:227-231`, Discharge D1) | **The per-act opponent policy is nowhere in the RFC.** Mitigated — policy is the pack's (`run.opponentPolicy`, bot-policy) — but nothing binds an act's boss to its phase's instrument |
| **Suppressor** | The dossier's own proposal, rank 3 (`:208-232`) | `:509-514` | `suppress?: ModuleId[]`, §3.3, disclosure criterion 7 | **Full agreement.** The dossier's best idea, landed |
| **Economy** | Rank 5: budget *reveals*, not rewinds (`:253-267`) | [[D945]]: earned rewinds/branching, act-scaled (`:213-239`) | `CampaignEconomy`, four spend seams, monotone lint, candidate numbers (`:130-187`) | **Contradicted by owner ruling** (§2.3). Ruling wins; the alternative was never shown |
| **Progression currency** | 5-slot loadout over 34 lenses ⇒ 278,256 builds (`:532-535`) | `06:39-46` — per-lens loadout with a slot budget, still standing intent | **Ten `UnlockableModuleId`** (`:191-201`); zero occurrences of `lens`/`loadout`/`slot` | **Live intent-vs-implementation split.** `06` §1 and `campaign-core` §3.1 describe different objects |
| **Progression denomination** | §3 rank 8: shrinking slot budget as ladder (`:321-326`) | [[D1151]]: the catalogue (`:368-397`) | **Absent** — no collection surface, no what's-missing mark; §7 node cards state pack title, suppress, reward, boss (`:415-419`) | **The ruling landed in intent today and has no RFC seam.** Amendment 1 |
| **`prestigeEligible`** | No dossier position | [[D1040]] via `campaign-core` | `every sealed node's verdict === "achieved"` (`:246`), three pinned properties (`:256-267`) | Clean. **No dossier conflict** |
| **Run bound** | Device A + device E (elective Act IV) (`:100`, `:104`, `:527-530`) | Device A only | Device A only, fixed-shape (`:462-464`) | **Device E dropped silently** |
| **Failure** | §4d(a): failing an act boss ends the run (`:445-453`) | Node-scope only (`:538-544`) | **None** — forward-only, any-verdict (`:125-128`, `:145-151`, `:286`) | **§4d(b) by default** (§3.3) |
| **Marginal-value ceiling** | §4b: smallest sufficient set; all-on is unreadable (`:388-401`) | `:399-404` | **Absent** — inventory grows monotonically toward the ceiling (`:204-217`) | **The measured reason a build has a cost is not in the RFC** |

---

## 5. What the dossier priced that the RFC does not

`campaign-core`'s fourteen acceptance criteria (`:477-530`) cover schema, economy, isolation,
disclosure, typing, sealing, determinism, registration, composition and migration hygiene.
**None touches run length, repetition, failure feel, or content decay.** The dossier priced all
four.

| Cost / risk | Dossier | Where it should have reached the RFC | Present? |
|---|---|---|---|
| **Run length in minutes** — 3–6 min per opening/middlegame encounter, 6–10 per endgame; 9 nodes = 35–55 min | `:135-156` | An acceptance criterion or a candidate parameter | **No.** No criterion mentions time |
| **The minutes figure is `[M]` end to end** and the cheapest upgrade is *one owner run with a clock* — a 30-minute exercise | `:19-25`, `:554-556` | The instrument exists: `planning/platform-alignment/campaign/participant-plan.md` (`06:326-332`) | **No.** Still unmeasured |
| **Catalogue exhaustion** — repetition arrives in N runs; the run-size table is a repetition budget | `:148-153`, `:415-431` | A named cost against the fixed 9-node shape, now newly load-bearing under [[D1151]] | **No** |
| **Content decays and is read-once** — the second visit to a pack is a thinner object | `:415-431` | The reason the catalogue is the scarce resource | **No** |
| **Failure feel** — "a run that cannot be lost is a playlist" | `:433-443` | An owner question (requirement 8) | **No — never asked** |
| **Authoring cost per pack** — opening 28.8 / endgame 40.6 / middlegame **65.0** min | `:165-166` | The seed-fixture and route-choice costs | **No.** `plan.md` line 7 commissions "the seed campaign" unpriced |
| **The rank-4 cost warning** — the one mechanism costing content (2.2–9.75 agent-hours) delivers the least per hour | `:250`, `:362-364` | Sequencing | **No** |
| ~~The Maia band dial is measured inert~~ (§5b req 5) | `:327-334` | Act II's boss band | **Moot — fixed `43c6c4a`** `[V]` |
| **Repetition and the loadout's variance burden** — with a fixed catalogue the loadout must carry more variance than in any of the six comparison games; **R11's refutation removes the mechanism that was supposed to do it** | `:428-431`, `:288-292` + [[D277]] | The v1 replay-driver argument | **No.** With no loadout (F36) and no synergy (F17 refuted), **the RFC's only run-to-run variance is path choice — which its own schema allows to be zero** (F34) |

> **The compounded finding.** The dossier's replay argument was: content decays, so the *loadout*
> carries the variance. R11 refuted the synergy half; `campaign-core` did not build the loadout
> half; and path choice — the remaining source — has no minimum. **A v1 campaign document is
> permitted to have literally no run-to-run variance.** That is not a rule violation, and it may
> be the right v1 cut; it is currently an unstated one. **Amendment 7.**

---

## 6. The [[D334]]/[[D304]] history, and what the dossier's evidence supports

| Step | Record | Dossier's bearing |
|---|---|---|
| **[[D304]] proposed** the ADR-0007 twin clause: *unlocked by playing, never by **winning*** | `BACKLOG:1143`, sourced to `fun-mechanics` §3/D2 (`:234-266`) — My City, Pandemic Legacy, Dicey Dungeons, Balatro's Mr. Bones (*"Lose 5 runs"*, 105 of 150 jokers on run one), Dungeon World | **The four-system sweep is `fun-mechanics`', not this dossier's.** `roguelike-run-design.md` §3 rank 7(a) (`:296-298`) contributes a **fourth-of-a-datapoint set**: StS unlocks by *playing* a character, Hades' Mirror of Night, Balatro's joker/deck unlocks, ITB's achievement Coins — playing-denominated in 3 of 4 |
| **[[D334]]** — the fork: D893(3)'s *"unlocks harder bosses"* vs D304's *"never by winning"*. Held `campaign-core` Discharge D3 | `campaign-core:538` | The dossier takes no position on prestige |
| **[[D1040]] ruled** 2026-08-23: *progression unlocked by **playing**; **winning** gates the **prestige** layer only* | `BACKLOG:373`; `campaign-core:235-267`, `:297-304`, `:607-620` | **Supported.** ADR-0007 constraint at `:310-311` — "a drip is compatible; a shop is not" — and 3-of-4 genre evidence at `:296-298`. Nothing in the dossier argues for a winning-gated core path |
| **[[D1150]]** — D304 re-asked hours after D1040 ruled it; owner: *"huh how are we here again"* | `BACKLOG:420` | Not a dossier matter |
| **The ruled shape** — reward granted on `failed` seals; `prestigeEligible` = every seal `achieved` | `campaign-core:286`, `:246` | **Supported by the dossier's genre evidence**, and it is the shape §3 rank 7 assumed |

**The one thing the dossier's evidence does *not* underwrite.** D1040's ruling is about **what
gates progression**. `campaign-core` reads it as also settling **whether the run can be lost**
(§2.2). The dossier's §4d(a) shows these are separable — its own proposal grants the reward *and*
ends the run on a failed act boss. **The dossier supports the ruled shape and does not support
the un-loseable map the RFC ships alongside it.**

**And one premise to retire.** [[D304]]'s stated urgency — *"this matters now because `06` §5's
accepted ruling gives the campaign a failure state"* — is false at both target documents
(§2.2). The row is closed; the sentence should not be inherited by the prestige amendment.

---

## 7. Amendments owed

Twelve, each with its citation, its owner, and its disposition. **Claude-on-a-ruling** items are
transcriptions of already-ruled or already-measured material; **OWNER** items require a decision
nobody has made.

| # | Amendment | To | Citation | Owner | Why now |
|---:|---|---|---|---|---|
| **1** | **Give [[D1151]] an RFC seam.** `campaign-core` has no collection surface, no what's-missing mark, and its §7 node-card vocabulary is a closed list (`:415-419`) that cannot express one. Add a Discharge row naming the catalogue-progression surface and the [[D300]] vocabulary prerequisite, and cite the dossier's supply-side census (**15 of 49 lenses, 9 of 25 shapes unnamed**, `:294-311`) so the prerequisite is discharged against a count rather than re-derived | `rfc/campaign-core.md` | `06:368-397`, `roguelike:294-311`, `BACKLOG:421`, `BACKLOG:1139` | **claude on [[D1151]]** | A ruling landed in intent today with no implementation seam, while the RFC is implementing |
| **2** | **Resolve the loadout/module split.** `06:39-46` states the deck is a per-lens loadout with a slot budget over 34 lenses (278,256 builds); `campaign-core:191-201` makes it ten modules, with zero occurrences of `lens`, `loadout` or `slot` `[V]`. Either `06` §1 is superseded by [[D893]]'s evidence-consumer currency and should say so, or the RFC is missing an object its design authority requires. **Carry §4b's measured ceiling with it** (`:388-401`): the RFC has no bound on simultaneously-effective modules, and D78 measured the all-on state as the unreadable one | `design/06` §1 **and/or** `rfc/campaign-core.md` | `06:39-46`, `campaign-core:191-201`, `:204-217`, `roguelike:388-401`, `:532-535` | **OWNER** (which object is the deck) — claude may draft the reconciliation, not choose | Two live documents describe different progression objects; the RFC is being built |
| **3** | **Record the offer/skip absence with its cost.** The dossier's rank-1 mechanism — an offered menu with a real skip, at zero authoring minutes — became one authored constant per node (`:110`). Add a Deviations-from-design entry or a Discharge row saying so | `rfc/campaign-core.md` | `roguelike:168-184` | claude on measured evidence | v1 may be right to cut it; §4's "Deviations from design" (`:462-472`) claims *"None other"* and this is another |
| **4** | **Same for the run-defining opening choice** (rank 2). `startingModules` (`:97`) is a document constant, so every CampaignRun of a document starts identically — the cheapest variety device in the genre, at zero cost | `rfc/campaign-core.md` | `roguelike:186-206` | claude on measured evidence | Same |
| **5** | **The act ladder is intent-only.** `06:412-416` makes acts the difficulty-availability tiers; `campaign-core`'s `Act` (`:99-101`) carries no phase, no policy and no label, and none of its four validator rules checks one. Either add the rule or state that act semantics are authoring convention in v1. **Carry rank 4's advance-visible label with it** (`:234-251`) and `06:48-57`'s missing human-outcome `DecidednessGround` | `rfc/campaign-core.md` | `06:412-416`, `:48-57`, `:86-90`, `campaign-core:99-101`, `:116-120`, `roguelike:234-251`, `:496-511` | **claude on [[D439]]/`06` §2a** for the statement; **OWNER** if the lint is wanted | A nine-opening-pack document validates today and would contradict the design's central "stakes escalate in decidability" claim |
| **6** | **Device E — the elective extension.** `:104` and `:527-530` name player-elected run length as one of only two surviving bounding devices and *"the cheapest way to serve both 'not too long' and 'I want more'"* — the owner's exact framing (`:3-5`). The fixed shape (`:462-464`) drops it without naming it | `rfc/campaign-core.md` (Deviations or Discharge) | `roguelike:104`, `:527-530` | claude on measured evidence | The owner's own question had two halves; v1 answers one |
| **7** | **Path choice has no minimum.** `choices: Node[] // 1..3` (`:104-105`); only the boss layer is linted. With no loadout (Am. 2), no synergy ([[D277]]) and a fixed catalogue (§1g), path choice is the **only** run-to-run variance — and a valid document may have none | `rfc/campaign-core.md` | `campaign-core:104-105`, `:116-123`, `roguelike:428-431`, `BACKLOG:1561` | claude on measured evidence | Either lint a minimum or state the v1 posture |
| **8** | **Ask the §4d question, or record that it is answered.** `roguelike:548` requirement 8 — *"An owner ruling on §4d — failure state or not"* — was never put to the owner and does not exist as a ledger row. `campaign-core` ships option (b), the one the dossier called *"strictly weaker"* (`:454-456`). Either (i) put the question, or (ii) record in `06` §5 that v1 is deliberately option (b), and **fix `06:516-522`**, which currently carries *"a run that cannot be lost is a playlist, not a run"* while describing a run that cannot be lost | `design/BACKLOG.md` (new row) **and** `design/06` §5 | `roguelike:433-460`, `:548`, `06:516-544`, `campaign-core:125-128`, `:145-151`, `:286`, `:315` | **OWNER** for the question; **claude on [[D1040]]** for the record-and-fix half | The dossier's second owner-facing fork. Its sibling ([[D305]]) was asked and ruled today; this one shipped by default |
| **9** | **Refresh `06` §5's stale grounds.** *"24.3% of the catalogue / 4.1 runs before repetition"* (`:406-410`) and *"the middlegame bill is 2.2 agent-hours"* (`:408-409`) were derived over **37 packs with 1 middlegame pack**. At HEAD: **56 packs, 16 middlegame**; 9 nodes = **16.1% / 6.2 runs**; 15 nodes = **26.8% / 3.7 runs**; the middlegame bill is **zero** `[V]`. Two of three arguments for nine nodes have moved. **The shape may stand; its stated grounds may not** (law 3) | `design/06` §5 | `06:406-410`, `roguelike:475-495`, this document §1g | **claude on measured evidence** (`06` §5 already carries a precedent correction of exactly this shape at `:418-428`) | An intent document is arguing from refuted numbers while an RFC implements the conclusion |
| **10** | **Correct [[D305]]'s stated ground.** The row (`BACKLOG:1144`) glosses option (a) as *"close to the option `roguelike-run-design.md` §4d called 'strictly weaker'"*. §4d's judgement is about **having no failure state**, not about any denomination. With [[D1190]] already owing a premise correction, the ruling's ground is unreliable on three counts (stale premise, transposed citation, missing fourth option — §2.1) | `design/BACKLOG.md` [[D305]]/[[D1190]] rows; `06:368-397`'s rationale | `BACKLOG:1144`, `:432`, `roguelike:454-456`, `:321-326` | **claude on [[D1190]]**'s standing debt (the conclusion stands; the ground is corrected) | [[D1190]] already owes a re-put; this adds two items to the same correction |
| **11** | **Ledger the reveal-budget alternative.** Rank 5 (`:253-267`) proposes budgeting the shipped `attempt_end` window — pricing *looking, not retrying*, explicitly designed not to touch *"experimentation without cost"*. It has no ledger row and was not among the options behind [[D945]]. Law 4 | `design/BACKLOG.md` (new row) | `roguelike:253-267`, `06:213-239` | claude on measured evidence | Not a challenge to [[D945]] — a row so the option is visible when the candidate numbers are re-tabled at R6 |
| **12** | **Note shape 4's effect on the run bound.** A survival encounter is bounded by *"nothing but failure"* (`06:444`), so it is the one class device D (`roguelike:103`) does not bound, and the run's minute envelope stops being the sum of its horizons. Add to Discharge D2 | `rfc/campaign-core.md:537` | `06:444`, `:451-478`, `roguelike:103` | claude on [[D1152]] | Cheapest possible fix, at the row that will build it |
| **13** | **`arrows` — decide it.** §5b requirement 6: *"a slot with no perception behind it would be an unlockable that unlocks nothing."* Still inert at HEAD `[V]`: `evidence-catalog.ts:892` disposition `experimental`, and `evidence-catalog.test.ts:49-50` **pins the inertness**. The dossier's concern is now sharper than when written — under [[D1151]] a catalogue entry that can never be met is a permanently incomplete collection, and the reason on file already names its resolver: *"F5 or an owner ruling"* | `design/BACKLOG.md` [[D546]] row; the F5 lane | **OWNER** (activate or retire), per the disposition's own wording | Cheap now; under a catalogue denomination it becomes a visible hole |
| **14** | **Repair `campaign-core`'s stale `learner-modules` citations** — off by ~181 lines after §3a was inserted 2026-08-23. `campaign-core.md:74` and `:192` cite `learner-modules.md:299-311` for the eleven-module table, which now resolves to a reducer heading; the table is at **`learner-modules.md:480-492`** (§4, caption *"total: **11**"* at `:477-478`). `campaign-core.md:193` cites `:325` for `rules_floor` registering no evidence consumer; that claim now lives at **`:506`** (and `:887`) `[V]` | `rfc/campaign-core.md` | claude on measured evidence | The RFC's ten-member unlock type is derived from a table its citation no longer points at, and criterion 5 (`:499-502`) tests against it |

### Closed rather than amended

| Finding | Why closed |
|---|---|
| **F17 / §5b req 7 — synergy discovery and R11** | Run and **refuted** (`conjunction-hypothesis.md`, [[D277]] `BACKLOG:1561`): best conjunction 35.7%/2.73× vs best single leaf 69.4%/12.64×; 0 of 7 beat their own components. The dossier pre-named the consequence at `:288-292`. **Do not ship synergy discovery** |
| **§5b req 3 — 2 middlegame packs / "Act II is impossible today"** | Refuted by content: **16 middlegame packs at HEAD** `[V]` |
| **§5b req 1 — server-held inventory** | Met in spec (`campaign-core:373-396`), ruled by [[D945]] (`06:237-239`) |
| **F21 / §5b req 5 — the inert Maia band dial** | **Fixed by `43c6c4a` on 2026-08-15, the same day the dossier landed** `[V]`. `opponent-selector.ts:587-596` orders the band defaults before the `Elo` alias; `engine-band.ts:68-90` range-checks; `opponent-selector.test.ts:597-606` pins the order. The dossier's most alarming shipped-state finding had a lifetime measured in hours, and **no document recorded the closure** — the same one-hop join failure as §0.1, in the other direction |
| **F10 — the 36/37 plyHorizon census** | Superseded by `06:416-428`'s re-derivation and by §1g's HEAD recount |
| **F15 — the reveal consumable as *the* economy** | Superseded as the economy by [[D945]] (owner ruling). Survives as an option → Amendment 11 |
| **F4 — the ≈45–51 StS node correction** | Immaterial; nothing turns on it |

---

## 8. Blockers

| Blocker | Cite | Effect |
|---|---|---|
| **Amendments 2, 5 (lint half) and 8 (question half) are OWNER-tier** and cannot be written by claude under law 5 | `CLAUDE.md` law 5, RFC-0000 agent rule | Three of twelve wait on a ruling; nine are transcription |
| **`campaign-core` is being implemented by codex right now** | `planning/campaign/plan.md`, `planning/campaign/state-fold-return.md` | Amendments 3, 4, 6, 7, 12 touch only Deviations/Discharge prose; Amendments 1, 2, 5 touch the schema and would land mid-implementation. **Sequencing is the author's call, not this document's** |
| **`rfc/` holds active forks** and `design/` was untouched at this document's start | `git status` at start: no `design/`, `rfc/` or `planning/campaign/` path dirty | This document writes only `planning/campaign/roguelike-reconciliation.md`. **No amendment above has been applied** |
| **Two author returns already stand against `campaign-core`** — [[D1233]]/[[D1234]] (`abandoned` has no event authority; `cursor` has no null representation) | `planning/campaign/state-fold-return.md` | Amendment 8's record-half interacts with [[D1233]]: if the run gains a losing condition, `status` needs a fourth value and an event kind — the same closed-enum question, answered once |
| **Minutes remain `[M]`** and the instrument exists but has not been run | `roguelike:19-25`, `:554-556`, `06:326-332` | Argument 3 is the last surviving quantitative ground for the nine-node shape (§1g), and it is unmeasured. **One owner run with a clock converts it `[V]`** |
