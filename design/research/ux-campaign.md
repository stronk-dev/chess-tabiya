# The campaign — a user-perspective UX specification

**Landed:** 2026-08-24 · **Author:** claude · **Scope:** the campaign — acts, floors and layers, the
encounter vocabulary, the deck, earned rewinds, difficulty, the failure state, and what it feels like
to be part-way through a run.

**Commissioned by** the owner's standing instruction for this lane, verbatim: *"we need to go from a
user perspective per feature… what do they expect, what do competitors do, PROPER UX."* Six dossiers
landed in that lane. **The campaign appeared inside `ux-after-the-run.md` §4–§5 and never got a pass
of its own**, while `design/06-campaign.md` is a whole intent document with an implementing RFC
behind it. This is that pass.

**Method — three passes per feature**, in this order and never merged: (1) what a user expects,
stated from the learner's side; (2) what competitors and adjacent prior art actually do, every claim
labelled; (3) what we should do and why it differs, with cost and dependencies. Where the third pass
wants something the intent tier does not carry, it is named as an **owner decision** and not written
(law 5).

**Rulings that bind this dossier.** [[D945]] — rewinds and proactive branching inside the campaign
are **earned**: *"not infinite, not forbidden. it's what allows a weaker player to actually win a
campaign (on lower floors/acts/whatever)."* [[D1300]] — **the failure state is an open owner
decision**, never asked; §7 puts the user-side of it and does not answer it. **ADR-0007** —
progression is unlocked by playing, never purchased, and the satirical ceremony *may not become a
real one*; `CLAUDE.md` rejects XP, streaks and leaderboards as retention levers. [[D1040]] — core
progression grants on any verdict; **winning gates the prestige layer only**. [[D1151]] — progression
is denominated in **the catalogue**. [[D1152]] — the verdict vocabulary is closed at four producers.
[[D1416]] — bot tournaments, leagues and operator accounts are **deferred past 1.0, not refused**.
[[D1230]] — no scope cuts; *"the first visible pixel"* and *"the cheapest real path"* are struck as
reasoning. [[D1130]] — proposed ledger rows are unnumbered and renumber at landing.

**This is research tier.** Nothing here is an RFC and nothing here amends `design/03`, `design/05` or
`design/06` — every recommendation names the RFC or the owner decision that owns it.

**Two evidence bounds, stated before anything rests on them.**

1. **[[D1458]] binds every competitor claim in this dossier.** No product in this repo's competitor
   corpus has ever been driven hands-on; a competitor `[V]` here means *we read the vendor page or
   the source*, never *we used it*.
2. **Every external game fact about a roguelike is `[P]` and says so at its source.**
   `design/research/roguelike-run-design.md:13-18` states its own ceiling: *"This is a **desk
   dossier**… Every external game fact is `[P]` — wikis and community sources, checked in this pass
   against the cited URL, not against a play session"*, and *"Every claim about our own run length in
   minutes is `[M]`"*. `fun-mechanics-outside-roguelikes.md` §11 adds a second-order weakening worth
   carrying: *"a meaningful minority came from search-index snapshots rather than fetched pages
   because the host refused (Fandom returned HTTP 402…)"*. This dossier inherits both labels
   unchanged and never upgrades one.

**Three inherited claims are stale and are corrected in place rather than repeated**, because the
campaign cluster's own dossiers now disagree with each other: `roguelike-run-design.md`'s catalogue
arithmetic runs over a **37-pack** corpus that is now **56** (§1.2); its rank-6 synergy claim was
`[M]` and R11 has since **refuted** it `[V]` (§5.1); and its rank-8 / requirement-5 finding that the
Maia band dial *"is, today, inert"* was **closed 2026-08-15 by `0985fa4`**, verified against a real
Maia engine ([[D91]]) `[V]` (§8.3a).

---

## 0. Five findings, before the features

**0.1 — The campaign has no door, and the product's own map does not contain it.** A
case-insensitive grep for `campaign` over the six other design documents returns **zero** hits in
`design/00-thesis.md`, `01-training-model.md`, `02-product-shape.md`, `03-product-breadth.md`,
`04-content-architecture.md` and `05-in-run-experience.md` `[V]`. `design/03` is the document
`CLAUDE.md` calls *"complete surface map, IA, and B1–B8 gate"*, and the campaign is not a surface in
it. `design/05` is *"the generic board experience beneath every surface: six invariants, five regions
and the assistance ladder"*, and it has never been written against a campaign board.

The client agrees. `apps/web/src/lib/router.ts:22-32` holds **nine** static routes — `/`, `/play`,
`/review`, `/rating`, `/learn`, `/live`, `/create`, `/library`, `/settings` — and **none is
`/campaign`** `[V]`; `keyboard.ts:37-46` holds eight chords and none reaches one `[V]`; and
`api.ts:285` ships `PLANNED_SURFACES` as an **empty array** `[V]`, so there is not even a
coming-soon placeholder. Before any question about what a campaign *feels* like, there is no answer
to **where a learner starts one**, and that is an intent-tier gap, not a build one.

**0.2 — The mechanism is built, correct, and has zero consumers.** Five files ship the campaign:
`packages/runtime/src/campaign-contract.ts` (76 lines), `campaign-state.ts` (258),
`apps/server/src/campaign-validation.ts` (87), `campaign-registry.ts` (117), and
`packages/schema/src/campaign/index.ts` (31) `[V]`. A repo-wide grep for
`campaignRunState|effectiveCampaignModules|campaignModuleInventory|CampaignRunState|prestigeEligible|CAMPAIGN_REWIND_EXHAUSTED`
**outside those files** returns **zero hits** `[V]`. `content/campaigns/` **does not exist**, so
**zero campaigns are authored** `[V]`, and `docs/campaign.md:16-19` states the consequence in its own
words: a deployment with no such directory *"exposes an empty registry rather than fabricated seed
content."* The rulebook is finished and there is no game — which is why every recommendation below is
about a surface that does not exist yet and is therefore still free.

**0.3 — The reward pool is smaller than the design says, one reward can never turn on, and taking
the biggest reward removes four others.** This is the sharpest user-side finding in the dossier and
it is pure arithmetic over shipped tables `[V]`:

- The unlock **type** is ten (`UnlockableModuleId = Exclude<ModuleId, "rules_floor">`,
  `campaign-contract.ts:12`).
- The campaign **context ceiling** is `except("blunder_prevention")` (`presets.ts:48`), and
  `assertCampaignUnlockAllowed` refuses anything outside it (`campaign-contract.ts:45-49`). So the
  **reachable** pool is **nine**, not ten. (The RFC knows this — `campaign-core.md` §5.2 — and calls
  it a candidate.)
- The campaign's `allowedPresets` are `quiet, guided, theory_only, analysis` (`presets.ts:48`).
  Reading their module lists at `presets.ts:31-37`: **`threat_radar` appears in none of them.** It
  appears only in `support`, which the campaign does not allow. And `effectiveCampaignModules`
  intersects with the chosen preset (`campaign-contract.ts:63-76`). **So `threat_radar` is
  unlockable, grantable, and can never turn on.** A learner can be handed it as an act reward and
  nothing will ever happen. Usable pool: **eight**.
- Worse, and this is the trap: under the campaign's default preset `guided` the reachable set is
  `sight_on_request, postcommit_nudge, structure_nudge, guided_hint, compare_coach,
  theory_breadcrumb`. `review_map` and `full_inspector` — the two rewards that will *feel* biggest —
  live only in `analysis`, whose module list is `review_map, compare_coach, theory_breadcrumb,
  full_inspector`. **Switching from Guide-me to Analyze to use a module you earned silently removes
  four other modules you earned** (`sight_on_request`, `postcommit_nudge`, `structure_nudge`,
  `guided_hint`) `[V]`.

The owner's win condition is *"you have built the right combination… You basically build your
coach"* (`design/06:18-21`). At HEAD, the coach a learner builds is intersected with **a dropdown in
a settings panel**, and the build space is not 278,256 loadouts — it is *"pick one of four presets."*

**0.4 — Nothing forces a campaign to differ between runs, and the one guard against that is absent.**
`schemas/campaign.schema.json:85-88` accepts `choices` with `minItems: 1` `[V]`, and
`CAMPAIGN_PATH_WIDTH` — `campaign-core` criterion 15's discriminating warning, the only thing that
names a layer of width 1 — returns **zero hits repo-wide** `[V]`. So a fully linear campaign document
validates silently today. Compose that with `campaign-core` Deviations 4–6 (no offered draft, no
skip, no run-defining opening choice, no player-elected length), the absent loadout, and [[D277]]'s
refutation of synergy, and the RFC's own sentence stands unmitigated: **path choice is the only
run-to-run variance v1 has, and nothing requires a document to supply any.**

**0.5 — The question the whole design hangs on has never been asked.** [[D1300]]: the campaign as
built cannot be lost. `CampaignRunState.status` is `"active" | "completed" | "abandoned"`
(`campaign-state.ts:71`) — **no losing value** `[V]`; the map is forward-only
(`firstUnsealedLayer`, `:110-123`); seals grant rewards on any verdict. That is exactly the shape
`roguelike-run-design.md` §4d called option **(b)** and judged *"strictly weaker — it makes the
campaign a presentation layer over the existing catalogue."* Its requirement 8 was *"an owner ruling
on §4d — failure state or not"*, and it was never put. §7 puts the user-side of it, with options and
consequences, and does not choose.

---

## 1. Verified baseline — what exists at HEAD, in the order a learner would meet it

Everything in this section was read from source in this pass `[V]`.

### 1.1 What a learner can see today

Three strings, and that is the whole campaign surface:

| Where | What ships |
|---|---|
| `AssistanceSettings.svelte:18` | the label `Campaign` in the assistance-profile map |
| `assistance-preference.ts:14` | `campaign: SILENT_ASSISTANCE` — the campaign's device-local default config |
| `RatingScreen.svelte:160` | *"No rated-game result has been recorded. **Rated campaign games** will appear here after they reach a chess-rules result."* |

The third is a promise about a thing that does not exist and is deferred: the Act II rated boss is
`campaign-core` Discharge D1, blocked on `learner-rating` and on the persona/`targetElo`
disjointness ([[D962]]). The sentence is not false — it says *will appear* — but it is the only place
in the shipped product where a learner is told the campaign exists, and it tells them about its most
deferred feature.

### 1.2 The authored document

`schemas/campaign.schema.json` ships and is enforced at runtime by
`apps/server/src/campaign-validation.ts` `[V]`. Shape: exactly **3 acts × 3 layers**, each layer
**1–3 choices**, each choice a node whose `encounter` is `{ kind: "pack", packId }` — the union is
closed at one member. Node options: `suppress?: ModuleId[]`, `reward?: { kind: "module_unlock",
moduleId }`, `boss?: true`.

Six validator rules fire, all with authored-facing messages `[V]`:
`CAMPAIGN_BOSS_PLACEMENT` (*"each act must end in one unavoidable boss as the final layer's sole
choice"*), `CAMPAIGN_NODE_ID_DUPLICATE`, `CAMPAIGN_ENCOUNTER_PACK_UNKNOWN`,
`CAMPAIGN_UNLOCK_OUTSIDE_CEILING` (on both `reward.moduleId` and `startingModules`), and
`CAMPAIGN_ECONOMY_MONOTONE` (*"campaign grants must be non-increasing from act1 through act3"*).
`CAMPAIGN_PATH_WIDTH` is **absent** (§0.4).

The corpus a campaign would draw on, re-counted in this pass `[V]`: **56 canonical pack
documents** in `content/drafts/` (files declaring a top-level `phase`, sidecars excluded) — **23
opening / 16 middlegame / 14 endgame / 3 cross_phase**. So the middlegame bill that
`roguelike-run-design.md` §5a priced at **2.2 agent-hours** and called *"the price of Act II existing
at all"* is discharged by content: Act II is now possible, which the design's own 2026-08-23
grounds-refresh already recorded (`design/06:412-430`).

**But every pack a campaign could reference today is a draft with an open blocker, and that is a
campaign problem specifically.** `content/packs/` holds **only `.gitkeep`** — zero official packs —
so `PackRegistry.loadFromContent` registers all 56 from `content/drafts/` at
`channel: "community"` (`pack-registry.ts:329-360`) `[V]`. **55 of the 56 carry
`provenance.graduationBlockers`, and all 55 carry at least one blocker in state `blocking`** `[V]`
(the most common by far is `no-review-workflow`, `accepted`, on 40 of them). `CAMPAIGN_ENCOUNTER_PACK_UNKNOWN`
joins each node to the live registry, so a nine-node campaign validates today — over nine
ungraduated drafts.

**And the learner is already told.** `PackList.svelte:36` renders `reviewStatus === "draft"` as the
literal string **`unreviewed draft`** `[V]`, and `pack-authoring.test.ts:623-627` asserts that drafts
load **in production mode** at `channel: "community"`, `reviewStatus: "draft"` `[V]`. So every node
of the first campaign would carry that badge, on the surface most likely to be shown to someone as
*the product*. That is a content-readiness fact, not a design one, and it belongs in the sequencing
rather than in a screen — but a campaign whose every node reads *unreviewed draft* is a launch
decision someone should make deliberately rather than discover.

### 1.3 The economy, as code

`campaign-state.ts` folds five event kinds — `node_entered`, `node_sealed`, `charge_earned`,
`charge_spent`, `module_unlocked` — into `CampaignRunState` `[V]`. The rules the fold enforces:

- **Income is verdict-blind and once per node.** `charge_earned` requires the node to be sealed
  (`CAMPAIGN_CHARGE_GRANT_INVALID`), refuses a second grant for the same node
  (`CAMPAIGN_CHARGE_ALREADY_EARNED`), and requires `amount === document.economy.actGrants[act]`
  exactly (`:203-212`). Nothing in the grant path reads the verdict.
- **Spend requires an active encounter and a positive balance.** `charge_spent` refuses when the run
  is not the active campaign encounter, and refuses at zero with `CAMPAIGN_REWIND_EXHAUSTED`
  (`:214-222`).
- **The balance is a projection.** `balance = startingCharges + earned − spent` (`:249-253`); there
  is no balance column to drift.
- **Grants are non-increasing by act**, enforced at authoring time, not run time.

**The shipped refusal message, verbatim, because it is the string a learner would meet:**
`CampaignStateError` prefixes the code (`:88-95`), so the message is

> `CAMPAIGN_REWIND_EXHAUSTED: campaign rewind balance is zero`

`[V]`. That is an internal error id followed by a bare statement of shortage, with no statement of
what earns the next one. §6 is largely about that one string.

### 1.4 The seal, the cursor, and what the map will not let you do

- `node_sealed` refuses a node outside the first unsealed layer (`CAMPAIGN_NODE_OUT_OF_ORDER`), a
  node already sealed (`CAMPAIGN_NODE_ALREADY_SEALED`), and a run that is not the node's active
  encounter (`CAMPAIGN_NODE_NOT_ACTIVE`) `[V]`. So **the map is strictly forward and a sealed node
  can never be re-entered** — which `rfc/return-scheduling.md` §12 cites as the reason a repetition
  mechanic inside a campaign node is *"unimplementable by that contract"* `[V]`.
- The verdict vocabulary is `achieved | failed | transitioned | open`, mapped 1:1 from the submitted
  branch tip's `ObjectiveState` (`campaign-state.ts:9`). **`failed` is a shipped, reachable node
  verdict today.** That matters for §7: *a node can already be failed; what a failed node costs is
  the open question.*
- `prestigeEligible` is `seals.length > 0 && every seal.verdict === "achieved"` (`:129-132`) `[V]` —
  [[D1040]]'s gate, a pure read over seals, touching no progression term.
- `status` is `"active" | "completed" | "abandoned"`, `completed` meaning the cursor ran out
  (`:243-247`) `[V]`.

### 1.5 The module algebra

`campaignModuleInventory` = permanent `rules_floor` ∪ `startingModules` ∪ earned unlocks, each
checked against the ceiling. `effectiveCampaignModules` = **campaign ceiling ∩ inventory ∩ ¬suppressed
∩ preset**, in canonical module order, with `CAMPAIGN_RULES_FLOOR_SUPPRESSED` refusing a suppressor
that would remove the floor `[V]`. §0.3's three arithmetic facts all fall out of the fourth term.

### 1.6 Two open blockers that reach the campaign — one of which needs correcting

**[[D1437]], and its stated harm is not the harm.** `deriveWorkflowContext` (`presets.ts:107-116`)
ends in `return input.sessionKind`, and `RunSessionKind` is `"pack" | "position" | "imported"`
(`types.ts:36`), so it **can never return `"campaign"`** `[V]` — the row is right about that. But the
row says campaign encounters would *"inherit the wrong assistance ceiling."* Checked at HEAD: the
campaign's `moduleCeiling` is `except("blunder_prevention")` and **the `pack` context's is byte-identical**
(`presets.ts:42, 48`), as are its `allowedPresets` `[V]`. **The two contexts differ in exactly two
things: `defaultPreset` (`guided` versus `quiet`) and the localStorage key.** So the real consequence
is narrower and more user-visible than the row states:

> A campaign encounter that silently compiles as a `pack` run does not lose a ceiling. It **starts
> Quiet instead of Guide-me**, and it reads and writes `tabiya.assistance.v1.pack` rather than
> `tabiya.assistance.v1.campaign` — so the learner's campaign preference is stored under a key no run
> ever reads.

A campaign whose entire premise is *build your coach* opening with assistance silent is a worse
first impression than a wrong ceiling would be, and it is a different fix. Proposed as a correction
row in §12.

**[[D1445]], and its campaign-specific consequence nobody has stated.** `MODULE_ANSWER_IMAGE`
(`module-contract.ts:129-136`) maps every ceiling to a **singleton** — `fact: ["fact"]`,
`principal_variation: ["principal_variation"]` — and `ModuleAnswerCeiling` has **no `evaluation`
member** `[V]`. The general defect is that the ceiling reads as a lattice and is not one. **The
campaign-specific consequence is that its progression currency is not ordered.** The campaign sells
a ladder of evidence consumers; if a "higher" module does not include what a "lower" one showed, then
unlocking is not accumulation, and the learner's mental model — *each unlock adds to the last* — is
false at the type level. Whatever fixes D1445 decides whether the campaign's currency is a ladder or
a set, and that is a product question, not a typing question.

---

## 2. Feature — starting a campaign: what "roguelike" promises, and what it threatens

### 2.1 What a user expects

Someone who has played any roguelike expects five things, in this order, and each one is a promise
*and* a threat:

| The promise | The threat riding on it |
|---|---|
| **This has an ending.** A run is a bounded thing you can finish tonight | *…of unknown length.* The genre's most common complaint is the run that outlasts the evening |
| **I will build something.** The run's identity is mine, not the designer's | *…that I must grind to unlock.* Every roguelike ships content locked behind prior runs |
| **I can lose.** That is where the tension comes from | *…and lose my progress with it* |
| **The next run differs.** RNG, drafts, a different character | *…or it does not, and I have seen this* |
| **It is a game.** Play, not homework | *…so it will waste my time with ceremony* |

A learner who is *not* a roguelike player brings a shorter and sharper expectation: **this is the
part of the app where the chess is arranged for me.** They expect to be told what they are about to
do, roughly how long it takes, and what happens if they are not good enough. That third question is
the one this product currently cannot answer (§7).

### 2.2 What competitors and prior art do

**Nothing in the chess corpus is a run, and the matrix does not even have a column for it.**
`design/research/competitor-matrix.csv` carries **20 columns** across **64 products**, and **not one
column is about progression, a campaign, a run, a path or a level** `[V]`; a grep over the whole file
for `roguelike|slay the spire|balatro|into the breach|campaign|progression` returns **zero hits**
`[V]`. Progression appears only as *absence*, in the "Main gap" column — *"No preserved multi-branch
**curriculum**"* (Noctie), *"No **curriculum**, branch attempts, checkpoint feedback"* (Chess From
Position), *"content locked to courses"* (Chessable), *"**User must assemble curriculum**"* (Lichess),
*"No integrated **phase curriculum**"* (Maia platform).

Across those 64 products the only campaign-shaped things are three, and none of them is a run `[V]`:

| Shape | Instances | What it actually is |
|---|---|---|
| **A linear course** | Chessable, ChessMood (*"Y in **programs**"*), Chess King (*"CT-ART levels 2-10"*, 130+ courses), Chessly, ChessMind AI (*"56-69 GM courses"*) | ordered content, unlocked by paying and consumed in sequence |
| **A daily queue** | Chessigma (*"(paid) daily drill queue"*), Chessable's review debt, Dr. Wolf's *"isolated-position review queue"* | a backlog, not a path |
| **A gamification layer beside the loop** | Chessly (*"XP/achievement gamification"*), Chessity (*"diplomas"* + Chessto), ChessKid (Stars/Gems), **ChessMotive (XP, badges, streak, leaderboard, "motive coins", a collection, forge plates)** `[V]` | a retention skin the repo already refuses; ChessMotive's teardown calls it *"orthogonal to the loop"* |

**And the sharpest single quote in the teardown set is about exactly our structure.**
`teardown-chessmotive-desk.md:70-76` `[V]`: positions carry a validated `phase` field, *"**But there
is no cross-phase or trajectory notion at all**… Nothing carries an opening into its middlegame or a
middlegame into its endgame. **Phase is a filter label, not a journey.**"* That is the gap the act
ladder fills, stated by a competitor's teardown rather than by us.

**The traditional chess progression's failure state is redo, not lose.** Yusupov grades 12 exercises
per chapter with partial credit and a pass mark (e.g. 15 of 31), and *"below it, redo the chapter"*
`[P]` (`titled-player-training.md` §1.3). Its transfer note is the important half and is already
recorded: *"the pass mark judges **this pack's attempt set**"*, not the learner `[P]`/`[V]`. Strong
players tolerate structured progression well — **but only when the threshold judges the material and
not the person**, which is the same line the campaign already draws.

**The roguelike set, all `[P]`** (`roguelike-run-design.md` §2a, checked against wiki URLs, not
played):

| Game | Run shape | Reported length |
|---|---|---|
| Slay the Spire | 3 acts, Act 1 *"spans 15 rooms"*, ≈45–51 nodes | 45–70 min (community-reported) |
| Balatro | 8 antes × 3 blinds = 24 blinds | ~30 min, community consensus, *"treat as indicative"* |
| Hades | 4 biomes, ≈60–70 short chambers | 20–40 min |
| Into the Breach | 2–4 islands (**player's choice**) + final hive, each mission 3–5 turns | ~1 h `[M]` |
| FTL | 8 sectors, 19–24 beacons each | 1–2 h `[M]` |
| Monster Train | 8 rings + boss | 45–60 min `[M]` |

**Not one of them can tell you how long the run will be.** Every figure in that column is a community
estimate, because the length depends on RNG, on how much the player explores, and on execution.

### 2.3 What we should do, and why it differs

**Recommendation 1 — say the run's length before it starts, in minutes, and mean it.** This is the
single most differentiating thing the campaign can do at its front door, and it is available to us
and to nobody in §2.2, because **our envelope is computable**. `roguelike-run-design.md` §2b calls the
per-encounter horizon **device D** and finds it already shipped; `rfc/training-mode-variants.md` §5.3
closes the arithmetic for the widened vocabulary: *"the envelope arithmetic is therefore total again:
sum of `plyHorizon` over authored nodes, plus anchor count over prediction nodes, plus `maxPlies`
over survival nodes"* `[V]`. So a campaign document knows its own ply envelope at validation time.

The honest form of the claim, and it must stay honest: **plies are computable, minutes are not.**
There is still no per-attempt timing telemetry — `durationMs|elapsedMs|thinkTime` returns one hit,
inside a test's own stopwatch `[V]` (`roguelike-run-design.md:19-25`). So the start screen should
state what it knows — *"nine positions, about 110 plies"* — and state the minute figure only once one
owner run with a clock exists. That run is a 30-minute exercise and it converts the most load-bearing
`[M]` in the whole campaign design.

**Recommendation 2 — the front door refuses the four things the threat column expects, explicitly and
once.** Not as a manifesto; as four short true statements on the start screen:

- *Nothing here is bought.* (ADR-0007, by construction — there is no purchase path to disclaim, which
  is why saying it costs nothing.)
- *Finishing a position pays you whether you win it or not.* (§1.3's verdict-blind income and
  [[D1040]]'s any-verdict grant, both shipped rules, stated to the learner.)
- *You keep every attempt.* (The thesis's own promise, and the one thing no competitor's retry does —
  *"Preserved attempts anywhere on the platform: none found"* `[V]`,
  `teardown-chesscom-platform-desk.md` via `ux-after-the-run` §3.2.)
- And, once §7 is ruled: *what losing costs.*

**Recommendation 3 — the campaign needs a place in `design/03`'s IA before it needs a screen.** §0.1
is an intent-tier gap and it is the correct order of work: a route, a home-surface entry and a
relationship to `/play` and `/learn` are decisions the breadth document owns, and the RFC explicitly
does not own them (`campaign-core` §7: the map is *"a new surface outside the play composition… its
visual design is explicitly deferred"*, [[D717]]). **Named as an owner decision, not written here.**

**Recommendation 4 — decide the learner-facing noun.** *Campaign* is the internal word and it carries
a military metaphor into a product about rehearsal. The design's own better sentence is available:
`design/06:463-469` names what escalates as **legibility** — *"you can see this"*. Whatever the noun,
it should not promise power. Owner decision (§11).

### 2.4 Cost and dependencies

| Item | Cost | Depends on |
|---|---|---|
| A `/campaign` route and a home entry | small — nine static routes exist; adding a tenth is mechanical | **`design/03` must place the surface first** (§0.1, law 5) |
| Ply envelope on the start screen | trivial — computable at validation from the document | `training-mode-variants` §5.3's total arithmetic |
| Minute envelope | **one owner run with a clock** | nothing else; it is the cheapest `[M]`→`[V]` upgrade in the campaign |
| The four statements | strings | the fourth waits on [[D1300]] |

---

## 3. Feature — the map: acts, layers, and choosing where to go

### 3.1 What a user expects

A map. Nodes with icons that mean something. A choice with visible consequences. A route they can
plan two steps ahead. A boss at the end of each act, visible from the start of it. And — the
expectation that will hurt us — **that the icons predict the difficulty**, because in every roguelike
they do.

They also expect a **back button**, or at least that a wrong turn is survivable. The shipped contract
gives them neither: forward-only, one seal per layer, no re-entry (§1.4).

### 3.2 What prior art does

- **Hades shows the reward before the door** — each door displays the god's symbol, so the player
  chooses *which family* of boon they are walking into and forgoes the other `[P]`
  (`roguelike-run-design.md` rank 4). The dossier's finding is the transferable part: *"opportunity
  cost built from **advance information**, which is what separates a choice from a coin flip."*
- **Slay the Spire's map fork** and **FTL's sector choice** are the same device with less
  information `[P]`.
- **Balatro's boss blind debuffs the player instead of gaining power**, and *"Boss Blinds must always
  be played"* `[P]` (rank 3). `design/06:529-534` already adopts this as the campaign's difficulty
  mechanism, and `campaign-core`'s `CAMPAIGN_BOSS_PLACEMENT` already makes the act boss layer 3's
  **only** choice — the same unavoidability, enforced by a lint.
- **Into the Breach lets the player elect the run's length** — liberate 2–4 islands `[P]`. The
  dossier calls this *"the cheapest way to serve both 'not too long' and 'I want more'"*; it is
  `campaign-core` Deviation 6, dropped.

### 3.3 What we should do

**3.3a — The node card's four obligations are internal facts, and a learner needs four different
ones.** `campaign-core` §7 requires each card to state *"encounter pack title, `suppress` list,
reward, boss flag."* Read that as a learner: a pack slug, a list of module ids, another module id,
and a boolean. The four questions actually being asked at a map node are:

| The learner asks | Answerable from | Shipped? |
|---|---|---|
| *What kind of chess is this?* | the pack's `phase` + its objective type (convert / hold / save / resist, `design/01`) | yes, in the pack |
| *How long?* | `authoredBoundary.plyHorizon` — 50 of 56 packs declare one, median 11 ply `[V]` (`design/06:436-448`) | yes |
| *What does it take away?* | `suppress` | yes, and criterion 7 already makes disclosure failable |
| *What do I get, and will I be able to use it?* | `reward` **∩ the current preset** | **no** — §0.3 |

The fourth is the one that needs work and it is the same defect as §0.3: a card that promises
`threat_radar` is promising nothing, and a card that promises `full_inspector` is promising something
that costs four other modules to switch on. **A node card must state the reward's effect, not its
id**, and it must be truthful about whether the effect is currently reachable.

**3.3b — The difficulty-availability label is the map's honest differentiator, and it should be
rendered in the learner's words.** `design/06` §2a rules that a node carries a *difficulty
availability* label — measured-by-outcome / measured-by-tablebase / authored / none — *"not a
difficulty number… The ramp has a documented hole, and the product says so rather than inventing a
number across it."* That is a genuinely unusual thing for a chess product to say out loud, and it is
squandered if it renders as its enum. Proposed renderings, as a first draft for the RFC that owns the
frozen template (`rfc/review-map.md` §7's pattern):

| Label | What it means to the learner |
|---|---|
| measured by outcome | *"We know how this goes because we can see what players at your band actually did here."* |
| measured by tablebase | *"This one is solved. There is a right answer and it can be checked."* |
| authored | *"No instrument can grade this position. A person wrote what matters here, and says so."* |
| none | *"Nothing is claimed about this position's difficulty."* |

The fourth is invariant 5 of `design/05` (*absence is stated, never simulated*) at the exact moment
the learner is choosing where to spend twenty minutes.

**3.3c — The act ladder is legible and should be said as a sentence, once.** Acts escalate in
**decidability**, not in numbers: Act I `theory_strict` (the only boss whose difficulty is
outcome-measured), Act II `human_common` plus an authored plan, Act III `perfect_tablebase`
(`design/06:432-448`). To a learner that reads as: *"first, what people did; then, what an author
says; then, what is provably true."* No competitor can make that sentence, and it is the campaign's
best single line of copy. `roguelike-run-design.md:507-511` says why it is not decoration: *"the
stakes escalate in **decidability**, not in numbers… the final boss of a chess roguelike being
*literally unbeatable if you err* is a stronger climax than anything the comparison set has — and it
already ships."*

**One measured problem with the ladder, and the map will expose it.**
`design/research/coaching-versus-cheating-and-the-band-curve.md` §4d `[V]` re-derived the per-phase
horizons at 11 → 8 → 24 ply, so **Act II is the *shortest* act**, and its verdict is the one to
carry: *"Either the act structure or the middlegame horizons are wrong."* From the learner's side a
three-act run whose middle act is its briefest sags exactly where it should thicken. Act III being
longest is right — a climax belongs there — but Act II being shorter than Act I is not a choice
anyone made; it is what the authored horizons happen to say. Composing the map means either
authoring longer middlegame horizons or giving Act II more nodes, deliberately.

**3.3d — Act III is literally unbeatable, and the learner must be told before entering, not after
losing.** `perfect_tablebase` plays perfectly and is already used by two packs `[V]`
(`design/06:145-150`). `design/06:506-511` calls it *"a stronger climax than anything in the
comparison set"* — and it is, **only if disclosed**. An undisclosed unbeatable opponent is the single
most credibility-destroying thing this product could ship: a learner who loses nine times to a
perfect endgame and is never told it was perfect has been misled about their own chess, which is a
law-8-adjacent harm even though no move was graded. The disclosure belongs on the node card and in
the encounter's own briefing copy — which a boss node **may** carry (`design/06:500-511`: briefing
copy reaches no update, so it is admissible; an authored *verdict* is not).

**3.3e — Say that declaring done is irreversible, before it is done.** The submit verb seals the node,
and `campaign-core` §1 states the rule: *"No node re-entry after seal."* Nothing in the specified
surface says so. Roguelike players expect finality; learners do not, and a learner who submits an
unfinished line to "see what happens" has spent a node. The affordance is currently specified as
*"Declare done"* in the in-run strip (`campaign-core` §7) with no confirmation and no statement of
consequence. **One sentence in the affordance, not a modal:** *"This locks the node and moves the map
on. Your attempts are kept."* Both halves are true — seals are append-only and every branch survives
(`campaign-core` §4.3).

**3.3e-bis — The product has three words for the same thing and the learner needs one.** [[D945]]
says *"floors/acts/whatever"*; the schema says **layer**; `design/06` and the roguelike dossier say
**node** and **floor** interchangeably; `campaign-core` §1 pins **`CampaignRun`** against the code's
**run**, which is a naming collision it solved for code and not for copy. A learner meets three
objects — the whole thing, the third of it, and the one position — and each needs exactly one word.
*Layer* is an implementation word (it exists because a layer holds alternatives) and should not
survive into the surface. Recommended for the frozen-template table rather than decided here.

**3.3f — Land `CAMPAIGN_PATH_WIDTH`.** §0.4. It is criterion 15 of an accepted-then-implementing RFC,
it is a warning rather than an error by deliberate choice, and it is the only mechanism that would
tell an author *"this campaign is the same every time."* Its absence is a defect against the RFC, not
a design question.

### 3.4 Cost and dependencies

| Item | Cost | Depends on |
|---|---|---|
| Node card content | medium — needs the pack's phase/objective/horizon joined into the card | the card vocabulary is a **closed list** (`campaign-core` §7); widening it is a spec change with a changelog line |
| Difficulty-availability rendering | small — four frozen templates | `design/06` §2a's fourth ground (human-outcome `DecidednessGround`) **does not exist** (`design/06:48-57`) — until it does, Act I's label has no producer |
| Act III disclosure | strings, in briefing copy | none |
| Irreversibility copy | one string | none |
| `CAMPAIGN_PATH_WIDTH` | one validator rule + criterion 15's fixture | already specified |

---

## 4. Feature — the encounter, and being part-way through one

### 4.1 What a user expects

**That the run waits.** Every roguelike in §2.2 saves mid-run and resumes where you left it; that is
so universal it is invisible until it is missing. A learner who closes the tab three nodes into a
campaign expects to come back to three nodes in.

They also expect the encounters to *vary in kind*, not only in position — and that expectation is
about to be met, because `rfc/training-mode-variants.md` widens `encounter.kind` from one member to
three (`prediction` and `survival`), with the rated boss as a fourth deferred shape.

### 4.2 What prior art does

- Mid-run persistence is universal and unremarked in the roguelike set `[P]`.
- **The chess-side analogue of "part-way through" is the correspondence game and the SRS queue**, and
  the one measured lesson from the queue is that a backlog becomes a debt: Chessable's own docs warn
  to *"avoid endlessly repeating material that you are not able to master as this will end up
  occupying all of your study time"*, and ship a support article titled *"I constantly have too many
  moves to review. Can I adjust this?"* `[V]` (`chessable-movetrainer.md`, via `ux-after-the-run`
  §6.2). A campaign that accumulates unfinished runs would rebuild that debt in a new shape.

### 4.3 What we should do

**4.3a — Being part-way through is precisely the state the product cannot hold, and that is a
sequencing fact worth stating loudly.** `docs/campaign.md:32-33`, verbatim: *"Storage remains ordered
behind the accepted longitudinal-store and bot-policy migrations. Until that queue is lawful, **no
rewind charge, unlock, seal, or active campaign pointer is persisted**"* `[V]`. `campaign-core` §6
holds the fifth migration position. So the campaign's entire mid-run state is behind two other RFCs'
migrations, and no amount of UX design changes that. Everything below is a specification for when it
lands.

**4.3b — Resume returns to the map, not to the board.** The map is where the run's state is legible —
cursor, seals, inventory, balance — and the board is where one encounter is. A learner returning
after four days needs to re-read the run before re-entering it. This also gives the balance its
natural home (§6.3).

**4.3c — At most one active run, and the product should say why.** `campaign-core` §6 enforces one
active `CampaignRun` per campaign id with typed `CAMPAIGN_RUN_ACTIVE_EXISTS`. The user-side reading
is a feature, not a limit: **the campaign cannot accumulate a backlog.** Say it — *"One run at a
time. Finish it or abandon it."* — because it is the structural difference from the SRS debt in
§4.2, and it is free.

**4.3d — Four encounter kinds read as four different games; the map must say which before entry.**
Post-`training-mode-variants` the vocabulary is: an **authored encounter** (a pack, bounded by
`plyHorizon`, sealed by an `ObjectiveState`); a **prediction encounter** (a fixed recorded game,
sealed by agreement with the move actually played); a **survival encounter** (an unbounded run,
sealed by a score threshold over a declared grounded counter, capped by `maxPlies` as a *stop, not a
success condition*); and the deferred **boss game**. `design/06:459-464` holds the table; [[D1152]]
closed it at four producers. To a learner these are: *play it out*, *guess what happened*, *last as
long as you can*, and *play a whole game*. **The verb is the card's headline**, not the kind's id.

One consequence worth flagging for the map: a survival node's contribution to the envelope is
`maxPlies`, which an author is instructed to set *"far above the threshold"* so the encounter feels
unbounded (`training-mode-variants` §5.3). So §2.3's honest run length will over-state on any run
containing one. The fix is presentational — state survival nodes' contribution as *"up to"* — and it
should be decided before the first survival node ships, not after.

**4.3e — Abandonment is a user question, not bookkeeping.** `campaign-core` open question 3 asks
whether leaving a node unsealed and returning later should price anything, and ships the free
reading. That is the right default, and the user-side half is missing: **a learner who leaves an
encounter has to be told what happened to it.** Today the answer is *"nothing — it is still your
active encounter"*, which is correct and needs one sentence to be legible.

### 4.4 Cost and dependencies

| Item | Cost | Depends on |
|---|---|---|
| Any mid-run state at all | **blocked** | `rfc/longitudinal-store.md` and `rfc/bot-policy.md` migrations, then `campaign-core`'s fifth position |
| Resume-to-map | small once persisted | `GET /campaigns/active` (specified, not built) |
| Encounter-kind headlines | strings | `training-mode-variants` acceptance |
| Survival envelope presentation | small | decide before the first survival node exists |

---

## 5. Feature — the deck: what you carry, and the boss that takes it away

### 5.1 What a user expects

A **deck**: things you collect, that combine, that make you stronger, and that make this run
different from the last one. That is four expectations and **three of them are false here**, each for
a measured reason:

1. *Things you collect* — **true**, and it is the campaign's currency ([[D893]]: evidence consumers).
2. *That combine* — **refuted, and by more than a margin.** R11 ran over 721 spine transitions and
   19,099 legal alternatives `[V]` (`design/research/conjunction-hypothesis.md:30-58`, [[D277]]):
   the best single leaf reaches **69.4%** precision, the best of 55 pairwise conjunctions reaches
   **35.7%**; only 7 of 55 pairs are measurable for discrimination and their **median lift is 0.66×
   — worse than not looking**; and of 165 triples, **38 ever produce three simultaneous signals
   anywhere in the corpus, the most frequent 6 times in 721 transitions**, so *"a build assembled
   from three or more transition primitives has no witnesses to be right about."* The dossier's
   instruction is explicit and binds any campaign surface: ***"should not ship a synergy-discovery
   mechanism, an unlock that pays off 'in combination', or any deck framing that promises the value
   is in the intersection."***
   **And one structural finding underneath it constrains what a deck can ever promise:** *"a lens
   read on the position **before** the move is discrimination-inert by construction"* — it buys
   **targeting**, not discrimination `[V]`. A loadout selects what you look at. It cannot tell you
   whether what you are about to play is good, and no number of slots changes that.
3. *That make you stronger* — **false by construction.** `design/06:359-366`: *"What escalates here
   is LEGIBILITY, not power… A lens changes what you can see; a position does not care what you
   know."*
4. *That make this run different* — **not in v1.** §0.4.

### 5.2 What prior art does

- **Slay the Spire's card reward offers 1 of 3, or skip**; Balatro lets you skip a Small or Big Blind
  for a Tag `[P]`. `roguelike-run-design.md` ranks this **first of eight** at **zero authoring
  minutes**, on the reasoning that *"declining is a move — the skip is what makes the offer a
  decision rather than a gift."* It is `campaign-core` Deviation 4, dropped.
- **Neow's four blessings** include *a real disadvantage paired with a stronger reward* `[P]`, ranked
  second at zero cost — *"the run has an identity before the first encounter."* Deviation 5, dropped.
- **Into the Breach's squads are capability sets, not power levels** `[P]`. The dossier's main
  conceptual claim is that **ITB, not Spire, is our structural model**, with Balatro for bosses —
  because *"more lenses is monotone **bad** past a threshold"*, measured: median 58 observations per
  position, compare strip at 8.31 entries/ply with lift ≈1.01× `[V]`
  (`feedback-versus-the-dashboard.md`). **The optimisation is the smallest sufficient set, not the
  strongest set.**
- **Balatro's boss blinds debuff the player** `[P]` — *"they do not raise the enemy's stats, they
  debuff the player"* — adopted as the suppressor, and ranked third at zero authoring minutes with
  the note that it is *"the highest-value mechanism nobody in the repo has proposed yet."*
- **Two chess-native precedents matter more than any of those, and both are in
  `fun-mechanics-outside-roguelikes.md` §6** `[P]`:
  - **Lichess's Fog of War is the capability-suppressing boss implemented as a rule of chess.** The
    dossier's reading is the load-bearing one: Fog of War, Chess960 and Duck Chess are *"**legibility**
    mechanics, not power mechanics… the commercial proof that `06` §5's 'what escalates is legibility,
    not power' is a real design axis in chess and not a consolation prize."* And its transformation is
    **mandatory rather than preferred** — take the idea, not the rules, because a literal variant
    *"invalidates the tablebase, the corpus, Maia's band calibration and the whole catalogue at
    once."* Which is exactly what our suppressor does: it withholds *sight*, not squares.
  - **Shotgun King is the best mechanic in the chess-indie set and it is elective.** Between floors,
    a choice of two card combos, **each granting one upgrade to you and one to the enemy** `[P]`. The
    dossier calls it *"Neow's third blessing as the **core loop**… it makes the build non-monotone
    without any boss taking anything away"*, and gives the exact transformation: *"take this lens,
    and the rest of this act plays at +200 Elo"* — a cost denominated in a **corpus-grounded band**,
    not an invented stat. **It is a third way to break the monotone lattice, and unlike the
    suppressor it is elective, so it produces no resentment.** Two named killers: 35 of 47 packs
    hard-code band 1800, and R10 found the band trajectory doubles back above ≈2500, so any "+200"
    must be **clamped, visibly**.
- **Lichess Practice is the progression display to copy** `[P]`: five categories, *"no XP, no badges
  and no currency at all, only per-unit mastery marks"* — against ChessKid's Stars-and-Gems economy.
  The dossier's verdict: *"**The adoptable design is Lichess Practice's, not ChessKid's**."*

### 5.3 What we should do

**5.3a — Say plainly, in the product, that the reward is sight and not strength.** The copy problem
is real: *"you can now see X"* has to feel like a reward in a genre where rewards make numbers go up.
The answer is **demonstration, not announcement**. An unlock banner is a promise; the module firing
on the board the learner just played is the thing itself. Recommended shape: when a node grants a
module, the unlock is shown **on the position that just ended**, with the module's own grounded
output rendered live — *"here is what this would have said about the move you played."* That costs
one render of an existing consumer against a preserved run, and it converts an abstraction into an
observation. It is also the only unlock ceremony that cannot inflate, because its content is whatever
the module honestly produces — which may be nothing, and saying nothing is then honest too.

**5.3b — The unlock ceremony must tell the truth about whether the module is switched on.** §0.3.
A reward the learner cannot see is worse than no reward, and the failure is silent. The unlock
statement needs a third clause after *what it is* and *what it does*: **whether it is currently
active under your preset, and what switching costs.** Concretely, for the `full_inspector` case:
*"Analyze mode uses this. Switching to Analyze turns off four things you have already earned."*
That sentence is unpleasant, which is the point — it is the honest description of the shipped
algebra, and if it reads badly the algebra should change rather than the copy.

**5.3c — The suppressor boss is the riskiest gesture in the design and needs three rules.** It is the
mechanism that makes the monotone assistance lattice non-monotone (`design/06:529-534`) and it is
law-8-legal by construction — *"it speaks about the learner's information, never about chess."* But
from the learner's side it is a product **taking something away**, and no chess *trainer* does that
— though Lichess's Fog of War does, as a rule of chess, which is the precedent above. Three rules:

1. **Disclosed before entry, by name and by effect.** Criterion 7 already makes card disclosure
   failable; the user-side addition is that the card names the *effect*, not the module id.
2. **Attributed to the boss, never to the learner.** *"This position is played without the structure
   nudge"* — a property of the encounter. Never *"you have lost"* anything.
3. **Restoration is visible at the boss's end.** Suppression is encounter-scoped
   (`campaign-core` §3.3); a learner who is not shown the modules coming back will believe they were
   taken permanently. One line on the seal.

**And a fourth rule with a shipped reason behind it: the suppression sentence must not be the
honesty sentence.** `fun-mechanics-outside-roguelikes.md` §2a `[V]` found the capability suppressor
already ships end to end as the *honesty* gate — `AssistancePermission = "free" | "locked_off" |
"sight" | "evidence"`, producer `permittedAssistance`, refusal `ASSISTANCE_WITHHELD`, and an honest
UI sentence at `DrillScreen.svelte:717-720` — and derived the constraint: a boss suppression *"must
not be a fourth field on `permittedAssistance`… putting a game rule inside it would make a campaign
decision indistinguishable from an honesty decision, and **the learner would be told a lie in the
shape of a truth**."* `campaign-core` §3.2 keeps them separate in the algebra (honesty outer,
inventory inner). **The surface must keep them separate in words too**: *"this cannot honestly be
shown here"* and *"this boss is playing without it"* are different sentences and must never share a
template.

**5.3c-bis — The honest shape of the whole curve is inverted, and saying so out loud makes the
campaign better rather than smaller.** `coaching-versus-cheating-and-the-band-curve.md` §4d `[V]`
found that the owner's own "2000-Elo run" idea is expressible in this product **only inverted**:
> *"The curve is **suppression, not accumulation**. You begin with your coach and you end alone."*

That is a real, coherent, chess-shaped arc that no competitor offers, and it composes with everything
already ruled: the power curve is flat, so the only thing that can change across a run is how much
you are being shown; unlocks widen what is *available*; suppression narrows what is *active*; and the
climax is a position you read with less help than you started with. It is also the opposite of the
shape the RFC's unlock schedule implies, which accumulates modules toward Act III. **The two are not
compatible as felt experiences** — one ends with the most help you have ever had, the other with the
least — and nothing in the cluster has noticed they are both being built. Named as an owner decision
(§11), because it is a question about what the campaign *is*, not about a screen.

**5.3d — The deck the design wants is not the deck the RFC ships, and the gap should be visible to
whoever builds the surface.** `design/06:39-46` specifies a per-lens loadout with a slot budget over
**34 attested lenses** yielding **278,256 five-slot builds at zero authoring cost**; `campaign-core`
ships `reward?: NodeReward` — one authored constant per node, no menu, no skip — and records it as
Deviation 4 with the honest note that *"v1 may be right to cut it… but the cut is a deviation from
the design's highest-ranked variety driver."* A third, independent number supports the loadout's
size: the 10+0 reading-budget arithmetic derives **≈6 items per move** at 15 s and 238 wpm `[V]`
(`design/research/time-as-a-difficulty-lever.md` §4c), which is *"the same order as the campaign's
chosen five-slot loadout."* So the design's slot count has two independent grounds and the shipped
mechanism has none of the variety. **Not a recommendation to reopen v1** — it is a note that the
surface being designed is a surface for an unlock schedule, and should not be drawn as if it were a
deck-builder.

**5.3e — The ceremony rules from `ux-after-the-run` §4.3 apply and are not repeated here**, but one
of them is load-bearing enough to restate: **the act-end screen must look the same whether the act
was swept or failed at every node**, because `campaign-core` §4.1 grants rewards on any verdict by
[[D1040]]'s ruling, and *"if the act-end screen celebrates harder for `achieved` seals, it has
reintroduced winning-gates-progression through presentation."*

### 5.4 Cost and dependencies

| Item | Cost | Depends on |
|---|---|---|
| Demonstrated unlock | medium — render one module's output against a preserved run | the module consumers; **[[D1445]] blocks the grade-shaped ones** |
| Preset-truth clause | strings + reading `effectiveCampaignModules` | none |
| Suppression rules | strings | criterion 7 exists |
| Fixing `threat_radar` | either add `support`-family reachability to the campaign contract, or remove it from the pool | a `ContextContract` candidate re-table (`campaign-core` §5.2's device) — **owner-visible, since Support in a campaign is an assistance question** |

---

## 6. Feature — earned rewinds. How to communicate them without feeling punitive

**This is the centre of the dossier, per the [[D945]] ruling, and it is the mechanic that makes the
campaign winnable by a weak player.**

### 6.1 What a user expects

**A currency.** Lives, hearts, energy, tickets, coins. The schema is universal and it has three
beats: you have some, they run out, you wait or you pay. **A counter in the corner of a board
activates that schema instantly**, before any copy is read.

Two things make the schema wrong here, and both must be defeated by design rather than by
disclaimer:

1. **There is no pay branch and never will be.** ADR-0007; `campaign-core` §2.5 — charges are *"not
   purchasable, not sellable, not convertible."* So the UI must not have the *shape* of a store: no
   timer, no "get more", no second currency, no bundle.
2. **The scarcity is not a punishment for failing.** Income is verdict-blind (§1.3, `[V]` in the
   fold): *"a failed seal still funds the next attempt at the next node."* **A learner who fails
   every node earns exactly as many rewinds as one who wins every node.** This is the most important
   fact the surface has to convey and no shipped string conveys it.

And the chess-specific prior is worse than neutral. In the chess corpus, **rewind is metered as a
business model** — chess.com and Dr. Wolf both `[V]` (`ux-core-loop.md` §4). So the learner's trained
association is not "roguelike resource"; it is **paywall**.

### 6.2 What competitors do

**Nobody earns a rewind through play.** `ux-core-loop.md` §4 states the finding and its limit
plainly: *"No product in the corpus grants retries as a reward. The nearest analogues are outside
chess — Hades' Death Defiance, StS potions"* `[P]`, and *"we are designing an interaction with **no
observed precedent in the surveyed corpus**, so the competitor pass cannot validate it. It can only
tell us the learner's prior, and the prior is 'paywall'."* The absence claim carries
`design/research/README.md` coverage limit 1: the matrix is a snapshot, not a watch.

**But outside chess the design space has been explored to both ends, deliberately, by two games that
took opposite positions on this exact question** `[P]`
(`fun-mechanics-outside-roguelikes.md` §4, F1–F2):

- **Braid made rewind explicitly *not* a resource, and its designer said why.** Jonathan Blow:
  *"I wanted to find out what happens when you design a game where rewind is not a resource, and
  there's not a death challenge gating the game."* The dossier's verdict is the one to carry: *"**The
  value here is evidentiary, not mechanical** — it is the strongest outside support this repo has for
  its own most-questioned invariant, and it is worth citing in `06` §2c the next time a budget is
  proposed."*
- **Prince of Persia: The Sands of Time metered it — one Sand Tank per rewind — and the dossier keeps
  it as the named referent for the refused design**: *"Collides with C1, head on. This is exactly the
  rewind budget `06` §2c refuses."*

So the honest statement is not *"no precedent"*; it is **precedent on both sides, from outside chess,
with the refused version having a name.** [[D945]] chose a third position — metered, but with income
that cannot be failed out of — and the presentation problem is precisely that the learner's schema
recognises Sands of Time and not the income clause. **That is the whole design problem of §6.3 in one
sentence.**

**And the one place a chess competitor has already built our idea prices help taken, not attempts
made.** Chess.com's bot crowns: 3 for a win with no help, 2 with 1–3 hints/undos, 1 with 4+ `[P]`
([[D302]]). `fun-mechanics-outside-roguelikes.md` §6c calls this *"our 'assistance rungs used at
submission' axis converted from an invention into an adoption"* — and attaches the warning that
matters most here: ***"Chess.com's crowns are read as a score."*** They are three symbols on a bot's
card and players treat them as a rating of themselves. A `⟲ N` beside a board will be read the same
way, which is §6.3 R7's argument arriving from a competitor rather than from first principles.
[[D302]]'s constraint is the binding one: *"no count of rewinds, forks or attempts may ever be an
axis."*

And the general evidence on imposed structure says to expect a split verdict: Ariely & Wertenbroch
(2002) found externally imposed evenly-spaced deadlines beat self-set ones (M = 88.76 vs 85.67,
t(97) = 3.03, p = .003) **and** that structure made people work more and **enjoy it less** (liking
22.1 / 28.12 / 37.9, p < .001) `[V]` (`league-as-return-loop.md` §5.4). A rewind economy is imposed
structure. Design the copy for the enjoyment half.

### 6.3 The answer

**In one sentence: a rewind is not communicated as a balance at all. It is communicated as the thing
a node paid you for finishing — the income event is the interface, and the number is only its
receipt.**

The deeper reason this works is about **attribution**, and it is the whole answer to "without feeling
punitive." *A resource feels punitive when its loss is attributed to the learner's error.* Rewind
charges are not spent by failing — they are spent by **a gesture the learner chooses**. Every piece
of copy must keep the attribution on the gesture (*you chose to go back*) and never on the outcome
(*you lost the position*). And because income is verdict-blind, there is exactly one clause that
defuses the entire currency schema in three words: **win or lose.**

Eight rules follow. The first six sharpen or endorse work already in the lane; **rules 7 and 8 are
new and are the ones I would defend hardest.**

**R1 — never show a bare number as the primary. Show the rule, with the number as its receipt.**

> `⟲ 3` — *"Three earned rewinds. Every position you finish pays another — win or lose."*

Two sentences, both checkable against §1.3's fold. It converts a scarcity meter into a **rhythm**:
finish a node, get a rewind. That is the difference between *you are running out* and *keep going*,
and it costs one string.

**R2 — the earn event is loud; the spend event is quiet.** From `ux-core-loop.md` R3, which states the
mechanism exactly: *"A meter is loud when it decrements. An income is loud when it increments. Both
render the same integer; only the second is a reward."* Spending shows the new balance without
ceremony.

**R3 — the counter is never on screen at the moment of the mistake**, and I extend the lane's rule:
**nor during an encounter's first attempt.** A learner who has just blundered and sees *"1 rewind
left"* has been charged emotionally as well as mechanically; a learner who sees the counter before
they have needed one has been told the encounter is metered before they know what it is.

**R4 — the refusal names the income, not the shortage.** The shipped string is
`CAMPAIGN_REWIND_EXHAUSTED: campaign rewind balance is zero` `[V]` (§1.3) — an internal error id and
a bare shortage, which is exactly the *"bare refusal"* `ux-core-loop.md` R3 forbids and exactly the
new class `campaign-effect-vocabulary.md` flagged (the only shipped refusal path is `MATCH_LIVE`, a
*permission* refusal). Replace with a fact and a path:

> *"No rewinds left in this campaign. Finishing this position earns one — however it goes."*

`HonestControl` is the right shipped pattern to carry it (`Timeline.svelte:87` is the existing
instance) `[V]`.

**R5 — the learner-facing noun is the design's word, not the schema's.** `design/06` says **earned
rewinds**; the code says `charges` in five event kinds and one projection field `[V]`. *Charges* is a
game-currency word that activates the store schema; *earned rewinds* says what it is and where it
came from. (Endorsing `ux-after-the-run` §5.3 recommendation 5.)

**R6 — disclose the scope at both boundaries, once each.** The economy is campaign-scoped by ruling
(`design/06:223-228`), and **the learner cannot tell a campaign board from a drill board.** A learner
who learns *rewind costs something* inside a campaign will carry that belief into drill packs, where
rewind is free and is the entire thesis. So: the first rewind **inside** a campaign says what it
cost, once; the first rewind **outside** one says *"Rewinding here costs nothing. Every attempt is
kept."*, once. The second string is a drill-surface change that can land independently and should,
because it protects an invariant rather than decorating a mechanic. (Endorsing `ux-after-the-run`
§5.3 recommendation 4 and `ux-core-loop.md` R4.)

**R7 — NEW: the balance lives on the MAP; the board sees it only inside the offer.** `campaign-core`
§7 seats `⟲ N` in the in-run strip in the rail — *"the same seat family `postcommit_nudge` uses."*
That is the **coaching** seat. Three reasons to move it:

- **A number seated beside a board is read as a score of the game in progress.** [[D302]]'s
  constraint — no count of rewinds, forks or attempts may ever be an axis — is about verdicts, and a
  persistent counter beside the board reintroduces the same reading through presentation, which is
  the failure mode `ux-after-the-run` §4.3 identified for the act-end screen.
- **Putting an economy counter in the coaching seat teaches the learner that the coach is metered.**
  The one thing the campaign must not do is make the assistance feel priced; ADR-0007 and
  `design/06` §3 law 1 both keep honesty and inventory apart, and seating a currency where the
  post-commit nudge appears collapses them visually even though the algebra keeps them separate.
- **A persistent counter is disclosure at every moment except the one that matters.**
  `campaign-core` criterion 4 requires the balance be visible *before* the first spend. That is
  satisfied **better** by putting it inside the rewind offer itself:

  > `Rewind and branch` — *"spends 1 of your 3 earned rewinds"*

  which is disclosure at the point of decision, and which composes with `ux-core-loop.md` R1's ruling
  that the rewind affordance appears when the consequence closes rather than sitting there always.
  The map then carries the standing balance and the income rule, where a learner reads run-scoped
  state anyway (§4.3b).

This is a **change to a specified surface**, so it is offered to `campaign-core`'s amendment lane and
to criterion 4's re-reading, not asserted.

**R8 — NEW: name the carry-forward, because the shipped economy quietly prices early
experimentation.** `CAMPAIGN_ECONOMY_MONOTONE` enforces `actGrants` non-increasing act1 ≥ act2 ≥ act3
`[V]`, which is the ruling's *"lower floors are more forgiving"*. The balance carries forward across
acts (`balance = startingCharges + earned − spent`, one projection over the whole run) `[V]`. Put
those two together from the learner's side:

> **The resource gets scarcer exactly as the encounters get harder, and the balance is one pool. So a
> rewind spent in Act I is a rewind unavailable at the Act III boss — and the rational play is to
> experiment less early.**

That is the opposite of what the thesis wants from a rehearsal product, and it is nobody's error: it
is what the two shipped rules jointly imply, and no document has said it. Three dispositions exist
and the choice is the owner's (§11): keep one pool and accept that early frugality is rewarded; reset
the balance per act, so Act I's charges cannot be hoarded and Act I is genuinely free; or grant
*increasing* by act, reading *"lower floors are more forgiving"* as *"you need fewer rewinds where the
chess is easier"* — which is the same sentence read the other way and which the shipped lint would
have to invert.

**What must never appear**, each with its ground: a timer or regeneration clock (ADR-0007 and
`06` §2c — a clock whose budget survives a rewind *is* the refused pursuit clock,
`time-as-a-difficulty-lever.md` §1's discriminator); a "get more" affordance; a second currency; a
rewind count in any verdict, seal payload, export or module sentence (`campaign-core` criterion 13);
and any comparison of one learner's frugality with another's (`CLAUDE.md`'s leaderboard refusal,
and [[D1416]] defers leagues rather than opening them).

### 6.4 Cost and dependencies

| Item | Cost | Depends on |
|---|---|---|
| R1, R3, R4, R5 | strings on a surface that does not exist yet | the campaign UI |
| R2 | an earn moment in the seal flow | `POST /campaigns/:id/nodes/:id/submit` (specified, not built) |
| R6's second half | **a string on the drill surface**, landable today | nothing — and it should land first |
| R7 | a placement decision | `campaign-core` §7 + criterion 4's re-reading |
| R8 | an owner ruling and possibly a lint inversion | `CAMPAIGN_ECONOMY_MONOTONE` |
| Any of it enforcing | **blocked** — the guard `RunService.#campaignCharge` does not exist and no charge is persisted | the migration queue (§4.3a) |

---

## 7. Feature — losing. The user side of [[D1300]], put and not answered

### 7.1 What a user expects

**That the run can end.** It is the genre's defining promise and its defining threat, and the
expectation is precise in four parts: losing **ends the run**; losing **does not delete what you
unlocked**; losing is **fast to retry**; and the game **tells you what ended it**. All four are
load-bearing, and the second is the one every surveyed system protects.

**A learner who is not a roguelike player expects something different and it matters more.** In a
*learning* product, "you have failed, start over" is read as *"you are not good enough for this
content"* — which is precisely the failure mode the repo has already documented from the other side:
WoW's raid attunement, *"This strategy has largely been phased out"*, removed across four patches
`[P]` ([[D304]]).

### 7.2 What prior art does

**Losing is a legitimate unlock currency in almost every system surveyed** — the most consistent
finding in the whole genre sweep, across four unrelated systems `[P]` ([[D304]]): *My City* drips on
game count (24 games / 8 chapters / 3 per chapter); *Pandemic Legacy* **advances after two failed
attempts regardless**; *Dicey Dungeons* unlocks *"regardless if you win or not"*; **Balatro's Mr.
Bones unlocks on "Lose 5 runs"**, and Balatro ships **105 of 150 jokers available on the first run**;
*Dungeon World* makes a 6-or-lower the **XP trigger**.

**In chess, almost nothing ends — with one family of exceptions, and it is the useful one.**
Chessable's lapse resets a move to level 1 — *"If you get things wrong, you are back to the
beginning"* `[V]` — but removes no content. Yusupov's pass mark sends you back to **redo the
chapter** `[P]`. The traditional chess failure state is **repeat**, and repeat is exactly what the
campaign contract forbids inside a node (`return-scheduling` §12) `[V]`.

**The exception is the puzzle-format family, which bounds a run four different ways**
(`fun-mechanics-outside-roguelikes.md` §6b) `[P]`: Puzzle Rush ends on **3 strikes** or a clock;
Puzzle Streak ends on **one** miss; proof games end on an **exactness** constraint — *"the one
bounding device in the whole survey that is neither a clock nor a life count"*, and the dossier notes
our `plyHorizon` already is a move budget. And **Puzzle Storm is called the most sophisticated scoring
design in the survey** for one reason worth quoting exactly:

> *"an error costs **what you had accumulated**, not a life."*

A combo bar builds (+3 s at 5 moves rising to +10 s at 30) and a miss spends the accumulation rather
than a life. That is a failure shape neither §4d option carries, and it is the only one in the whole
survey that is **continuous** — the run degrades by a real amount rather than losing a discrete
token. It becomes Option E in §7.5.

### 7.3 Where the question actually stands, verified

- `design/06:536-543` settled 2026-08-15 that a failure state **is supposed to exist**: *"No
  **resource refusal** exists: true. No **failure state** exists: false."*
- `roguelike-run-design.md` §4d put two resolutions and called them *"an **owner decision, not a
  ruling**"*, with requirement 8 being *"an owner ruling on §4d — failure state or not."* It was
  never asked ([[D1300]]).
- **What shipped is option (b)** — `status: "active" | "completed" | "abandoned"`, forward-only,
  grant-on-any-verdict `[V]` — which §4d itself judged *"honest, cheap, and **strictly weaker** — it
  makes the campaign a presentation layer over the existing catalogue."*
- [[D1040]] does **not** cover it. It ruled what *gates progression*; **granting-on-failure and
  run-ending are separable**, and the RFC's ruled paragraph presents them as one settled pair.

### 7.4 The question, decomposed — because it looks like one decision and is three

**(i) Can a node be failed?** — **Already yes, and shipped.** `verdict: "failed"` is a reachable
member of the seal vocabulary `[V]` (§1.4). Nothing needs deciding.

**(ii) Does failing end the run?** — the actual open question.

**(iii) What survives the ending?** — the second open question, and the one that decides whether
losing is *tolerable* rather than merely *real*.

**A fourth question that looks like part of this one is already ruled, and separating it clears the
ground.** `campaign-intermediate-consequence.md` §6 put *"which of the learner's branches is the one
that seals?"* as an owner fork with three options — (a) whichever branch you are standing on when you
leave, (b) **the branch you submit**, (c) all of them, *"listed only so it can be refused explicitly
rather than arrived at by accident, **because it is the option every scarcity proposal so far has
drifted toward**"*. `design/06:558-564` ruled **(b)**, and its reason is the one that keeps the
thesis intact: *"This prices **committing**, never **retrying**."* So the failure question is not
about which attempt counts — that is settled — it is only about what the counted attempt's verdict
*costs*.

### 7.5 Six options for (ii), with their consequences. I do not pick.

A–D are the shapes the cluster has already named; **E and F are new to this dossier** — E from the
puzzle-format survey, F from the intermediate-consequence dossier's surviving proposal, which was
written for a different question and answers this one too.

**Option A — no run failure. (What ships.)** The run always reaches nine seals; the record carries
the verdicts.

- *For the learner:* nothing is ever taken away; a weak player always reaches Act III; there is never
  a "start over" moment. Maximally kind, and the kindness is real.
- *Cost:* no stake. §4d's own judgement — *"a sequence of encounters with no failure state is a
  playlist, not a run."* The suppressor boss has nothing to threaten with; the earned economy prices
  a resource whose exhaustion costs the learner nothing beyond the current encounter.
- **The sharpest argument against A is the owner's own sentence.** [[D945]] exists *"to allow a
  weaker player to actually **win** a campaign."* Under A, "win" means "finish", which every player
  does, and the ruling's central word loses its referent. If A is chosen, D945's stated purpose needs
  a new one.
- *Serves:* the weak player, maximally. The strong player gets no run at all.

**Option B — the act boss ends the run.** (§4d's option (a): rewind stays free inside an encounter;
what is priced is *declaring done*; failing an act boss ends the run.)

- *For the learner:* three real moments of stake per run, each announced in advance (the boss is
  layer 3's only choice by lint, and its card discloses its suppression). The earned economy becomes
  exactly what D945 says it is — **the thing that lets a weak player survive a boss they could not
  otherwise beat** — and every earlier decision about spending a charge acquires weight.
- *Cost:* the run ends two-thirds of the way through for the player who most wanted the last act, and
  the retry cost is the whole run (~35–55 min `[M]`, and that estimate's only surviving ground is the
  one marked `[M]` — `design/06:412-430`).
- *Available mitigation, already ruled:* [[D1151]] denominates progression in **the catalogue**, so a
  lost run still added what it met. [[D304]]'s proposed form is the sentence to hold: **the run can be
  lost; the catalogue can never be locked.**
- *Serves:* both, if (iii) is generous. Fails the weak player badly if (iii) is not.

**Option C — a run-scoped failure budget: the run ends after N failed seals, not on any one.**
(Pandemic Legacy's shape `[P]`.)

- *For the learner:* one bad node is not fatal; three are. The run degrades **legibly**, which is the
  tension roguelikes actually sell, without a single-point cliff at the boss.
- *Cost:* a second counter. Two economies on screen is the shape that reads as a game with a HUD, and
  a failed-seal count is the closest thing to a score the campaign would ever have. It is not
  literally refused — [[D302]] refuses counts of *rewinds, forks or attempts* as axes, and this
  counts outcomes — but it is adjacent enough that it should be ruled with that in view.
- *Note:* C with N = ∞ **is** A, and C with N = 1 at boss nodes only **is** B. It is the general form,
  which is either an argument for it or an argument that it hides the real choice.

**Option D — the run does not end; the run gets harder.** Failed seals raise suppression on later
nodes.

- *For the learner:* a losing run becomes visible struggle rather than a stop, and it is the only
  option that turns failure into **content**.
- *Cost:* it is adaptive difficulty in the **punitive** direction — the product responding to failure
  by taking away sight. That inverts D945's purpose exactly: weak players get less help precisely
  when they need more. It also needs a producer nothing computes today, and it moves suppression from
  an authored constant to a derived one, which the closed node-card vocabulary cannot disclose.
- *Honest note:* the **inverse** — failure *lifts* suppression, or grants extra charges — is the more
  defensible learning design, is ADR-0007-compatible (it is unlocked by playing), and is a different
  proposal that nobody has put. It belongs beside D as its mirror. It also collides with a named
  failure: Dr. Wolf's adaptivity is **undisclosed** (*"Whether the 'Are you certain?' guard fires on
  every blunder or **adaptively**"* is an open question in its own teardown `[V]`), and
  `ux-core-loop.md` D5 records the rule that follows — *"the learner moves the ladder, never the
  product. Dr. Wolf's hidden adaptivity is the named failure."* Any version of D or its inverse must
  therefore be **announced**, which is most of what makes it expensive.

**Option E — a continuous cost: failing spends what the run accumulated, rather than ending it.**
(Puzzle Storm's shape, §7.2 `[P]`: *"an error costs what you had accumulated, not a life."*)

- *For the learner:* the run degrades by a real amount instead of losing a discrete token, so there
  is no cliff and no counter — and the thing spent is already in the design. **The obvious currency
  is earned rewinds**, which makes the two open questions one mechanism: a failed seal costs charges
  rather than ending the run, and a learner who fails repeatedly arrives at the boss with nothing
  left, which is a real consequence that never blocks them from *reaching* the boss.
- *Cost, and it is the serious one:* it **breaks the verdict-blind income clause** that §6.3's entire
  answer to "without feeling punitive" rests on. The moment failing costs charges, the counter *is*
  a punishment for playing badly, the attribution moves from the gesture to the outcome, and *win or
  lose* stops being sayable. **E buys tension with exactly the thing that makes the economy
  humane.**
- *Also:* it re-prices retrying by the back door, which is [[D302]]'s and §4d option (c)'s named
  drift — `campaign-intermediate-consequence.md` §6 lists *"the node seals the worst branch you
  produced"* only so it can be refused explicitly, *"because it is the option every scarcity proposal
  so far has drifted toward."*

**Option F — the intermediate node sets the boss's terms, and only the boss can end the run.**
(`campaign-intermediate-consequence.md` §4's surviving proposal, M2 + M9, answering the owner's own
*"i kinda don't like it if all the intermediate is without consequence"*.)

- *The shape, verbatim:* *"An intermediate node **seals** a verdict — `preserved` or `degraded`, both
  non-fatal, both one-way — and the act boss **reads the seal**. **The boss decides the run; the
  intermediate node decides the terms on which you meet the boss.**"* Its natural payload is already
  the campaign's own mechanism: **who chooses the boss's capability suppression.** A clean act lets
  the learner remove or pick one suppression; a degraded act lets the boss pick.
- *For the learner:* every node matters and no node is fatal, which is the exact combination the
  expectation in §7.1 wants. It also gives the suppressor boss a *reason* rather than an authored
  constant, which is what turns it from a difficulty spike into a consequence.
- *Cost:* it presumes an answer to (ii) — it is B with the intermediate nodes made meaningful, so it
  composes with B and C and not with A. And the dossier is honest that it is the second-best idea in
  its own list: *"**The honest recommendation is M2 for v1 and M1 as the thing the design grows
  into**"*, M1 being carried board state (Into the Breach's Power Grid), which is more chess-native
  and *"collapses the map — linear by construction."*
- *Free-standing note:* it requires **nothing new** beyond the run-level roll-up. *"Not required by
  this proposal: any budget, counter, currency, refusal class, clock or new economy of any kind.
  That is the point of it."*

### 7.6 Three options for (iii) — what survives the ending

These are independent of (ii) and each already has a shipped analogue:

| | What it means | Where it stands |
|---|---|---|
| **Unlocks persist across runs** | earned modules carry into the next run | StS/Balatro meta-progression `[P]`; ADR-0007-safe (earned by playing). **Not what ships**: `campaignRunState.unlocked` folds from that run's events only `[V]` |
| **Unlocks are run-scoped** | each run rebuilds its coach from the document's `startingModules` | what ships `[V]`; it is also the only version where the *build* is a run-level decision at all |
| **The catalogue persists; the inventory does not** | what you *met* is permanent, what you *carried* is not | **the only one already ruled** — [[D1151]] denominates progression in the catalogue, and it composes with either of the above |

### 7.7 Four properties that should hold whatever is chosen

Offered as the dossier's contribution to the ruling rather than as part of it:

1. **Losing never locks content.** [[D304]]'s surviving half; the WoW attunement precedent `[P]`; and
   [[D1040]]'s core-path rule already forbids winning from gating progression, so a *loss* gating it
   would be the same rule broken from the other side.
2. **The ending states which node ended it and offers the preserved run.** A door, not a wall — the
   product's one differentiator (*"Nobody in the matrix re-enters play from the explanation"* `[V]`,
   `ux-after-the-run` §0.2). The run-end screen of a lost campaign should be the most re-enterable
   screen in the product.
3. **The catalogue diff renders identically on a lost run and a won one.** `ux-after-the-run` §4.3's
   invariance rule, and the reason is structural: rewards are granted on any verdict, so a screen
   that celebrates harder for `achieved` has reintroduced winning-gates-progression through
   presentation.
4. **The possibility of ending is announced before the boss, not discovered at it.** If a run can
   end, the node that can end it must say so on its card — and the node-card vocabulary is a **closed
   list** (`campaign-core` §7) that today cannot say it. So option B or C implies a card-vocabulary
   amendment, and that should be priced into the ruling rather than discovered after.

### 7.8 One more thing to put with the question: **"abandoned" is not "lost"**

`status: "abandoned"` ships `[V]` and is the state a learner reaches by walking away. If run failure
is added, the product has **two** non-completed endings and needs two different words — one for *you
stopped* and one for *it stopped you*. Today it has one word, and it is the bookkeeping one. A
learner who returns to find their campaign marked `abandoned` after a bad night will read it as a
verdict.

---

## 8. Feature — difficulty: the weak player, the strong player, and what actually scales

### 8.1 What a user expects

A slider, or a ladder they climb. Ascension 1–20, Heat, Covenant 0–10 — *"the single biggest 'worth
replaying' device"* in three of the six comparison games, producing hundreds of hours **with
modifiers, not content** `[P]` (`roguelike-run-design.md` rank 8). In chess specifically they expect
the difficulty to be an **opponent rating**, because that is what difficulty means everywhere else in
the category.

### 8.2 What prior art does, and what we cannot copy

**Balatro's escalating requirement — 300 chips at Ante 1 to 50,000 at Ante 8, a ~166× climb `[P]` —
is the cleanest run-bounding device in the set and is refused by measurement**, not taste: R4 and R9
jointly find measured difficulty exists only on **two islands that do not touch** (decided endgames
and roughly the first ten moves), with **10.2%** of out-of-range positions decided and *more search
depth making it worse* (5.8% at depth 16) `[V]`. Manufacturing a number across the middlegame hole is
law 8. `roguelike-run-design.md`'s instruction is the right one: *"Say it plainly and do not build a
chess-legal imitation of it."*

**The pursuit clock is refused for a different reason and the discriminator is now exact.** A clock
is the refused pursuit clock **iff its budget survives a rewind** `[V]`
(`time-as-a-difficulty-lever.md` §1) — and the shipped placeholder is already on the right side by
construction, because `clockState` hangs off **`Node`**, which is path- and branch-scoped, so it
rewinds with the board. *The refused version is not expressible in the field that exists.* Worth
noting because it applies to the earned economy too: **the campaign's charge balance is run-scoped
and therefore does survive a rewind**, which is precisely why [[D945]] is an amendment to the thesis's
scope rather than a free addition — and why §6's copy has to work.

### 8.3 What we should do

**8.3a — There are exactly two honest dials, and the claim that one of them is broken is stale.**
`roguelike-run-design.md` rank 8 names them: **(i)** the Maia band, ruled `[1000, 2400]`, a
corpus-grounded *human* ladder; and **(ii)** the slot budget (5 → 3 → 1), *"arguably the more honest
one, since fewer lenses means more you must see yourself."* That dossier records dial (i) as
**inert** — *"every Maia request currently runs at band 1500… **The campaign's one honest difficulty
dial is, today, inert**"* — and its §5b requirement 5 is *"Fix the `#maia` `SelfElo`/`OppoElo`
regression."*

**That was closed on 2026-08-15 by `0985fa4` ([[D91]]), and the closure was verified against a real
engine** — the ledger records codex adding *"a **real-Maia** test proving bands 1000 and 2400 produce
different policy vectors"* `[V]`. Confirmed independently at HEAD in this pass:
`apps/server/src/opponent-selector.ts:593-601` (read at committed HEAD `f95aed8b`, since another
agent holds an uncommitted edit above these lines in the shared worktree) emits the
`SelfElo`/`OppoElo` defaults **first**, then
`setoption name Elo value ${eloApplied}`, so the requested band is applied last and wins `[V]`. **The
campaign's one honest difficulty ladder is live.** Anyone reading `roguelike-run-design.md` rank 8 or
requirement 5 will conclude otherwise, and that dossier's own requirements table is now three rows
stale (3 discharged by content, 5 by the fix, 7 run and refuted).

Two live caveats on the band that a campaign must respect: **35 of 47 packs hard-code band 1800**
`[V]`, so a band ladder is an authoring change rather than a switch; and **R10 found the band
trajectory doubles back above ≈2500**, so any offered band shift must be **clamped, visibly**
(`fun-mechanics-outside-roguelikes.md` §6e).

**8.3b — There is no per-learner difficulty at all, and the reason is structural rather than
missing.** This is the sharpest constraint on the whole section and it is already measured.
`coaching-versus-cheating-and-the-band-curve.md:325` `[V]`:

> ***"An unmeasured learner cannot be matched. The curve can only be *declared*, never *adapted*."***
> ***"Every roguelike calibrates to the player; this one can calibrate only to the content. A 1000
> and a 1900 walking the same map meet the same nodes."***

`actGrants` is a property of the authored **document** (§1.3), so every learner of a given campaign
gets the same income; [[D945]]'s *"lower floors/acts/whatever"* is served by the act axis, and the
*"weaker player"* half of the same sentence has **no mechanism**. Three honest options exist and none
is written: a **declared** difficulty choice at run start (the learner moves the ladder — which is
`ux-core-loop.md` D5's rule, *"the learner moves the ladder, never the product"*, with Dr. Wolf's
hidden adaptivity as the named failure); **separate campaign documents at different generosities**,
which the shipped architecture already supports since `CampaignRun` pins `(id, version)`; or nothing,
and the campaign is a fixed course that some learners will find trivial and others impossible.
Flagged, not chosen (§11).

**One consequence of "declared, never adapted" that the map should carry:** because the same nodes
meet every learner, **difficulty is a property of the document, and the document should say which
learner it was written for.** That is a start-screen sentence, it is honest, and it is the thing a
rating-shaped product would never have to say.

**8.3c — What a strong player needs is not a stronger opponent, and that is forced rather than
chosen.** Above Maia's 2400 there is only `strong_engine`, *"not a strong human but a different
species"*, and weakened Stockfish is refused doctrine `[V]` (`design/06:137-143`). So the campaign's
replay axis must be **suppression breadth and slot scarcity**, not opponent strength: *the same
board, spoken in a less complete language.* That is the Into-the-Breach reading and it is the only
ladder available. It is also the honest one — `time-as-a-difficulty-lever.md` derives ≈6 readable
items per move at 15 s `[V]`, so a descending slot budget is a real constraint on a real budget, not
a decoration.

**8.3d — And the strong player's boredom is a content problem, not a difficulty problem.** Our packs
carry **finite authored readable content — 275 deviation notes and 145 checkpoints** `[V]`
(`roguelike-run-design.md` §4c) — so *"once you have read a pack's deviation notes, the encounter is
a different, thinner object: the surprise is spent even though the position is not."* At the current
corpus, nine nodes consume **16.1%** of 56 packs, giving **6.2 runs before repetition** `[V]`
(`design/06:412-430`). **The campaign's replay ceiling is authored-content decay, and no difficulty
tuning moves it.** Anyone promising indefinite replay from a modifier ladder is promising something
the content cannot fund.

### 8.4 Cost and dependencies

| Item | Cost | Depends on |
|---|---|---|
| Confirming the band dial | **one engine probe** | nothing; it is the cheapest open item here |
| Slot-budget ladder | zero authoring | **the loadout does not exist in v1** (`campaign-core` Deviation 4) |
| Per-learner generosity | a run-start choice + a candidate parameter | owner decision (§11) |
| More runs before repetition | content | the 56-pack corpus |

---

## 9. Feature — coming back to a run you are part-way through

### 9.1 What a user expects

To be reminded. A badge, a mail, a "your run is waiting". That is the category's whole return
apparatus.

### 9.2 What is actually available to us

**Nothing outbound.** A term census over `apps/` and `packages/` returns **zero** hits for `notify`,
`notification`, `email`, `webpush`, `reminder` `[V]` (`league-as-return-loop.md` §4). And **the return
loop and the campaign do not touch**: `rfc/return-scheduling.md` §12 refuses *"a repetition mechanic
inside a campaign node"* on the ground that `campaign-core` forbids node re-entry after seal, *"so it
is unimplementable by that contract"* `[V]`. Cycles live in `/learn` and Just Play. **A campaign node,
once sealed, never comes back.**

So the entire question reduces to: *what does the learner find when they arrive?*

### 9.3 What we should do

**9.3a — The active run is the first thing on the home surface, and it states its remainder.** This
is where §2.3's computable envelope pays off a second time and it produces the sentence no roguelike
can write:

> *"Three positions left — about 40 plies."*

Every game in §2.2 would have to guess. We can compute it from the document, because device D is
shipped and `training-mode-variants` §5.3 closed the arithmetic for the two new kinds. Once one owner
run with a clock exists, the same line carries minutes.

**9.3b — Do not build a campaign streak, and the evidence against it is stronger than the doctrine.**
`CLAUDE.md` and `return-scheduling` §12 both refuse streaks by name; the structural reason is that
**a streak measures attendance, not learning**. Three measured findings back it:

- **A Chessable author on Chessable's own mechanism** — GM Ikeda: ***"XP and daily streaks don't
  improve chess strength."*** `[V]` (`chessable-movetrainer.md`), and that dossier's own mining list
  ranks streaks/XP/leaderboards **last, deliberately**.
- **The largest preregistered test of scheduled-obligation return loops found nothing.** Kizilcec et
  al. 2020 PNAS, ~250,000 students across 247 courses: week-one activity moved, **completion did not**
  (β = 0.89 pp, 95% CI −0.22 to 1.99, P = 0.115) `[V]`; Baker/Evans/Dee 2016 (n = 18,043) found a
  scheduling nudge produced **−4.8 pp treatment-on-treated on certificate attainment against a 9.3%
  control rate** `[V]` (`league-as-return-loop.md` §5).
- **What *is* supported is spacing, and we already ship it.** Ariely & Wertenbroch's effect survives
  only as spacing, not as commitment or self-imposition — and the dossier's conclusion is the one to
  carry: ***"We already built the lever the evidence supports and were about to be talked out of it
  by a lever the evidence does not… Making the spacing feel imposed — not adding a person — is what
  the evidence licenses."*** `[V]`

The lawful substitute exists in the repo's own transformation of Chessigma's day-streak — *"a counter
of attempts finished, not days visited"* `[V]`/`[M]` (`teardown-chessigma-desk.md` §7-H) — and inside
a campaign that counter is already **the map itself**. **The map is the progress display. It does not
need a second one.**

**9.3c — The campaign is a fourth denomination waiting to be mis-built.**
`league-as-return-loop.md:324-331` `[V]` enumerates what a flat-power product can denominate progress
in: **(a) cadence and completion**, **(b) the learner's own history**, **(c) the catalogue**, and a
fourth it identifies and refuses — **(d) another person's expectation**, *"the only one of the four
that cannot be shipped for a single learner."* [[D1151]] ruled **(c)**. The campaign will attract (d)
harder than any other surface, because a run is the natural unit of a competition, and [[D1416]]
defers bot tournaments and leagues rather than refusing them — which means the pressure is scheduled,
not closed. **Whoever builds the campaign should know that (d) is the deferred thing and (c) is the
ruled thing**, and that the honest interim answer to *"how am I doing"* on a campaign surface is the
catalogue diff and nothing else.

**9.3d — One run at a time is a feature; say it at the moment it binds.** §4.3c. The place it becomes
visible is when a learner tries to start a second campaign: `CAMPAIGN_RUN_ACTIVE_EXISTS` is typed and
its user-side text should offer the two real doors — *resume* or *abandon* — rather than reporting a
conflict.

### 9.4 Cost and dependencies

All of §9 is blocked on the same thing as §4: nothing about a run is persisted until the migration
queue is lawful (`docs/campaign.md:32-33`) `[V]`.

---

## 10. What this dossier does not establish

- **I did not play a campaign, because none exists** — `content/campaigns/` is absent and no route
  reaches one `[V]`. Every claim about how the campaign *feels* is analysis, not observation.
- **R6, R7 and R8 remain open and experiential.** R6 (does a *count* budget on retries preserve or
  destroy punishment-free experimentation?) is the direct experiential test of §6, and it is narrowed
  to exactly that residue. R7 (is a withheld module legible and interesting or merely frustrating?)
  is the direct test of §5.3c's suppressor. R8 (is the loop worth wrapping?) gates the whole build.
  No participant studies ([[D649]]); the instrument is owner play.
- **Minutes are `[M]` end to end.** No per-attempt timing telemetry exists `[V]`. §2.3, §7.5's retry
  cost and §9.3a's minute variant all rest on it, and one owner run with a clock converts all three.
- **Every roguelike fact is `[P]`** and is inherited from a desk dossier that says so; **every
  competitor `[V]` means a page was read, not a product used** ([[D1458]]).
- **§8.3a's HEAD confirmation is a code read.** The `[V]` for the band dial being live rests on
  [[D91]]'s recorded real-Maia test, not on a probe I ran; my own contribution is confirming the
  shipped ordering at HEAD.
- **The six failure-state options in §7.5 are not costed in engineering terms.** They are costed in
  what a learner experiences, which is this dossier's remit; the build cost belongs to
  `campaign-core`'s successor amendment.
- **I did not re-derive the numbers I inherit from sibling dossiers**, except the pack corpus and the
  module algebra. D78's noise floor, R3's ρ = −0.143, R4/R9's oracle limits, R10's band and R11's
  refutation are all cited, not re-run.

**Where the load-bearing `[P]`s are, named rather than buried.** The entire prior-art basis for the
map, the draft, the suppressor boss and the failure state (§2.2, §3.2, §5.2, §7.2) is desk-sourced
wiki material, and a minority of it came through **search-index snapshots** rather than fetched pages
because the hosts refused — Fandom returned HTTP 402 — which affects the Into the Breach, Dishonored
and several Balatro figures specifically. The Chessable, Yusupov, chess.com and Lichess comparisons
in §2.2, §4.2, §5.2, §6.2 and §7.2 are fetched-page `[V]` under D1458's ceiling, which is weaker than
it reads. Two named claims that could not be verified anywhere and are used for nothing: Chessable's
*"up to 95%"* retention figure has **no citation found on any fetched page**, and the *Chess Life*
Solitaire Chess point table was unreachable.

**No recommendation in §6 or §7 rests on a competitor's effectiveness claim.** The Braid and Sands of
Time precedents (§6.2) are used for **what was designed and why the designer said so**, never for
whether it worked; the chess.com crowns finding is used for **how players read a counter**, which is
a report of reception, not of efficacy. Everything else rests on our own shipped code, our own
measurements, and the learner's *prior* — the one thing desk research establishes reliably.

---

## 11. Owner decisions this dossier surfaces

Each is stated as a question with its options, per [[D1230]]; none is answered here.

**O-CAMP-1 — the failure state ([[D1300]]).** Does failing end a campaign run, and if so where?
Options A–F at §7.5, decomposed into three separable questions at §7.4, with what-survives options at
§7.6 and four properties that should hold either way at §7.7. **This is the decision the campaign's
whole tension depends on and it has never been put.**

**O-CAMP-2 — what survives a run** (§7.6). Persist unlocks across runs, keep them run-scoped (what
ships), or persist only the catalogue (the one already ruled). Independent of O-CAMP-1 and cheaper to
answer.

**O-CAMP-3 — one pool or per-act reset for earned rewinds** (§6.3 R8). The shipped combination —
carry-forward balance plus non-increasing grants — makes early experimentation rationally expensive,
which no document has stated. Three dispositions given.

**O-CAMP-4 — where the balance lives** (§6.3 R7). The rail beside the board, as specified, or the
map with the offer carrying it at the point of decision. A `campaign-core` §7 / criterion 4 question.

**O-CAMP-5 — `threat_radar`, and whether Support belongs in a campaign** (§0.3). It is unlockable and
can never turn on. Either the campaign's `allowedPresets` widen to reach it, or it leaves the pool.
This is an assistance question, not a bug, because Support is at-commit blunder prevention and the
campaign context deliberately excludes it.

**O-CAMP-6 — the campaign's place in the IA and its learner-facing name** (§2.3 R3, R4). `design/03`
does not contain the campaign at all; this is intent tier and law 5 makes it the owner's.

**O-CAMP-7 — does the run accumulate help or lose it?** (§5.3c-bis.) The RFC's unlock schedule ends
the run with the most help the learner has ever had; the measured reading of the assistance axes says
the only coherent curve is the inverse — *"You begin with your coach and you end alone"* `[V]`. Both
are being designed and they are different experiences. This is a question about what the campaign is,
not about a screen.

**O-CAMP-8 — is difficulty declared per document, or chosen by the learner at run start?** (§8.3b.)
*"An unmeasured learner cannot be matched. The curve can only be declared, never adapted"* `[V]`, so
the only honest options are a learner-set dial, parallel campaign documents at different
generosities, or a fixed course. Adaptive difficulty is refused by `ux-core-loop.md` D5, with Dr.
Wolf as the named failure.

---

## 12. Proposed ledger rows (unnumbered per [[D1130]]; renumber at landing — head was D1478 at drafting)

- **The campaign is absent from the product's own map.** `campaign` appears **zero** times in
  `design/00` through `design/05`, including `03`'s complete surface map and `05`'s in-run contract;
  `router.ts` has nine static routes and none is `/campaign`; `PLANNED_SURFACES` is empty. An
  implementing RFC exists for a surface the IA does not contain `[V]`.
- **`threat_radar` is an unearnable-in-practice reward: it is in the campaign's unlock pool and in
  none of the campaign's four allowed presets**, and `effectiveCampaignModules` intersects with the
  preset — so it can be granted and can never turn on. Usable pool is **eight**, not the ten the RFC
  types `[V]`.
- **Switching preset to use an earned module removes other earned modules.** Guide-me → Analyze gains
  `review_map` and `full_inspector` and loses `sight_on_request`, `postcommit_nudge`,
  `structure_nudge`, `guided_hint` `[V]`. The unlock ceremony must state this or the reward is a lie
  by omission.
- **[[D1437]] correction: the campaign ceiling is byte-identical to `pack`'s.** The two contexts
  differ only in `defaultPreset` (`guided` vs `quiet`) and the preference key, so an unreachable
  context does not lose a ceiling — it **starts Quiet instead of Guide-me** and writes a preference
  key no run reads `[V]`. Narrower harm, different fix, more user-visible.
- **[[D1445]]'s campaign consequence: the progression currency is not ordered.** The campaign sells a
  ladder of evidence consumers over a ceiling that is an exact-match singleton map, so "unlock" is not
  accumulation and the learner's model of the reward is false at the type level `[V]`.
- **`CAMPAIGN_PATH_WIDTH` is absent at HEAD** — zero hits repo-wide — so `campaign-core` criterion 15
  is unmet and a fully linear campaign document validates silently, while path choice is the only
  run-to-run variance v1 has `[V]`.
- **The shipped exhaustion string is an error id plus a bare shortage** —
  `CAMPAIGN_REWIND_EXHAUSTED: campaign rewind balance is zero` — which is exactly the bare refusal
  `ux-core-loop.md` R3 forbids; the fix names the income `[V]`.
- **The carry-forward balance prices early experimentation.** One run-scoped pool plus non-increasing
  act grants means a rewind spent in Act I is unavailable at the Act III boss, so the rational play is
  to experiment least where the product most wants experimentation `[V]`. O-CAMP-3.
- **The only shipped sentence about the campaign describes its most deferred feature.**
  `RatingScreen.svelte:160` promises *"Rated campaign games"*; the rated boss is Discharge D1, blocked
  on `learner-rating` and on the persona/`targetElo` disjointness `[V]`.
- **Every pack a campaign could contain today is an ungraduated draft.** `content/packs/` holds only
  `.gitkeep`, so all **56** canonical packs register from `content/drafts/` as `community` channel;
  **55 carry `provenance.graduationBlockers` and all 55 carry at least one blocker in state
  `blocking`** `[V]`. A nine-node campaign validates over nine of them. The surface most likely to be
  shown as *the product* has no graduated content to put in it.
- **`roguelike-run-design.md`'s §5b requirements table is three rows stale, and it is the document
  every campaign design reads.** Requirement 3 (2 middlegame packs) is discharged by content;
  requirement 5 (*"Fix the `#maia` SelfElo/OppoElo regression"*) was closed 2026-08-15 by `0985fa4`
  and verified against a real Maia engine ([[D91]]); requirement 7 (*"Run R11"*) ran and **refuted**
  the synergy claim it was protecting ([[D277]]). Its rank-8 sentence *"The campaign's one honest
  difficulty dial is, today, inert"* is false at HEAD and re-confirmed inverted in the shipped file
  `[V]`. Only requirements 1, 2, 4, 6 and **8 (the failure-state ruling, [[D1300]])** stand. A dossier
  whose stale rows all read as blockers will keep stopping work that is not blocked.
- **A campaign surface will attract the one progression denomination the repo has refused.**
  `league-as-return-loop.md` names four — cadence, learner history, catalogue, and **another person's
  expectation**, *"the only one of the four that cannot be shipped for a single learner"* `[V]`.
  [[D1151]] ruled the catalogue; [[D1416]] **defers** leagues and bot tournaments rather than refusing
  them, so the fourth is scheduled rather than closed, and a run is the natural unit it would attach
  to. Worth a row before someone reads the deferral as a licence.
- **The unlock curve and the suppression curve are opposite experiences and both are being designed.**
  `campaign-core`'s schedule accumulates modules toward Act III; the measured reading of the
  assistance axes is that the only coherent arc is *"suppression, not accumulation — you begin with
  your coach and you end alone"* `[V]`. Nobody has noticed they conflict. O-CAMP-7.
