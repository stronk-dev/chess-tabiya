# Campaign-mode RFC — HEAD derivation dossier

Derived at HEAD `c93ae83`, 2026-08-22, by claude on assignment. Purpose: pin everything the
future campaign RFC must consume, so its author argues from the tree rather than from memory.
Every citation below was read at this HEAD. "Absent at HEAD" is stated where it applies.
This file is planning tier — it rules nothing; owner-level forks are flagged, not decided.

Companion evidence base: `planning/campaign-synthesis.md` (the file:line assembly behind
`design/06`), `planning/campaign-research-queue.md` (the gate), `design/research/`
dossiers `campaign-effect-vocabulary.md`, `campaign-intermediate-consequence.md`,
`roguelike-run-design.md`, `fun-mechanics-outside-roguelikes.md`, `training-mode-variants.md`.

**The gate, quoted first because it governs everything below**
(`planning/campaign-research-queue.md:4-5`): *"No campaign RFC may be drafted until the
narrowed R6–R8 experiential closure feeds platform R14/O10."* R6–R8 are experiential and are
answered by **owner play only** (D649, `design/06-campaign.md:259-268`): *"External
participant studies are descoped as a permanent posture, not a gap."* This dossier prepares
the draft; it does not license one.

---

## 1. `design/06-campaign.md` in full (443 lines, read whole)

### 1.1 Provenance and status

- Written by claude 2026-08-15 on the owner's rulings, per the RFC-0000 agent rule
  (`design/06-campaign.md:3-7`). *"Nothing here is an RFC. This is intent."* (`:9`).
- The win condition, owner's words (`:18-21`): *"what if you have built the right combination
  of theory/classification/hints which basically allows a noob to play against an IM/GM boss,
  and still win because it has the right help? You basically build your coach."*
- The thing tested is *"the quality of the coach you assembled, not raw playing strength"*
  (`:22-23`) — the campaign exists without the product ever grading a learner's chess.

### 1.2 The six D439/D836 amendments — all landed

`rfc/learner-rating.md:605-608` names them and records the landing: *"all six amendments
landed, [[D836]], with the rewind/R11 collision recorded there as the open question this
RFC's question 11 still holds."* Located in `design/06-campaign.md`:

| # | Amendment | Where landed | Load-bearing sentence |
|---|---|---|---|
| 1 | §5 encounter vocabulary — a boss row bounded by the rules, not `plyHorizon` | `:334-353` (table `:343-348`) | *"one encounter class is NOT bounded by `plyHorizon`, and the map now has TWO verdict producers"* (`:334-336`) |
| 2 | §5 act ladder — acts differ in whether a rated result EXISTS, rated boss Act II only | `:367-382` | *"the acts no longer differ only in decidability — they differ in whether a RATED RESULT exists at all, and the rated boss exists in ACT II ONLY"* (`:367-369`) |
| 3 | §2a difficulty axis — result is a second axis, not a fifth label | `:119-135` | *"the rated axis 'runs orthogonally to the decidability axis rather than alongside it' — which is a second axis"* (`:127-129`) |
| 4 | §2b boss table — exactly one of three bosses can be a rated game | `:157-181` | *"exactly ONE of the three bosses can be that game with a rated result: the middlegame boss"* (`:158-159`) |
| 5 | §5 `plyHorizon` corpus claim refreshed | `:320-332` | *"50 of 56 draft packs declare one, median 11 ply, 30 of them voluntarily"* (`:320-322`), re-derived at `7d15685` |
| 6 | §2c/§5 rewind — landed as the OPEN QUESTION, per the ruling's iff-clause | `:204-211`, `:429-443` | *"as of 2026-08-22 question 11 still stands open, so the tension lands as an open question, per the ruling's own iff-clause"* (`:432-434`) |

Note the amendment-mechanics detail an RFC author needs: amendment 3's second-axis reading is
**derived by claude, owner's to veto** — *"The ruling named the fork 'a fifth label or a
second axis' without choosing; the second-axis reading here is derived by claude from the
ruling's own orthogonality sentence and is the owner's to veto"* (`:130-133`).

### 1.3 The act ladder — two independent differences

Decidability (`:316-320`): *"Act I outcome-measured (`theory_strict`), Act II authored
(`human_common` plus an authored plan), Act III tablebase-measured (`perfect_tablebase` —
literally unbeatable, already shipped, and a stronger climax than anything in the comparison
set)."* Run shape: **9 nodes, three acts of three, ~35–55 minutes** (`:310-314`), argued from
catalogue-consumption (4.1 runs before repetition), the 2.2 agent-hour middlegame bill, and
node-vs-minute parity against Spire.

Result-existence (`:367-382`), with the exact refusals:

| Act | Boss | Rated result? | Refusals (each named twice) |
|---|---|---|---|
| I | opening, `theory_strict` | **No** | R1 (no calibrated band) + structural: `THEORY_NEEDS_AUTHORED_BOUNDARY` + `BOUNDARY_NEEDS_PLY_HORIZON` make `follow_theory` *"incapable of a rules-terminal result"* (`:370-373`) |
| II | middlegame, `human_common` + authored plan | **Yes — the only one** | `plan` mode is *"14 for 14 at ≥21 pieces"* so R5 costs nothing (`:381-382`; mapping is *"an inference, not a schema fact"*, `:170-171`) |
| III | endgame, `perfect_tablebase` | **No** | R1 + R5's floor of 21 against `PERFECT_TABLEBASE_OUT_OF_RANGE`'s seven-piece ceiling (`:373-375`) |

The owned tension, verbatim (`:375-377`): *"So the campaign's climax act is the one act that
cannot carry a rated result — the climax cannot produce the outcome the campaign rates."*

### 1.4 The encounter vocabulary — four sealed shapes (`:343-348`)

| Encounter class | Object | Bounded by | Sealed by | Ruling |
|---|---|---|---|---|
| Authored encounter (every non-boss node + Act I/III bosses) | pack | `plyHorizon` | `ObjectiveState` from `successConditions`, stored as `sealedState` | D439 |
| Boss game (Act II rated boss only) | `position` session | *"the rules of chess"* | `terminalOutcome` | D439 |
| Prediction encounter (solitaire-chess nodes) | *"a fixed recorded game"* | *"the game's own length"* | *"a prediction-score threshold over `prediction.recorded` events against the human distribution"* | D869 |
| Survival encounter (streak family) | *"an unbounded run"* | *"nothing but failure"* | *"a score threshold over an unbounded run (plies survived / correct count / avoidance streak, each with its declared grounded counter)"* | D886 |

Completeness argument (`:350-353`): the 30-format catalogue in
`design/research/training-mode-variants.md` *"seals every surveyed format under these four
shapes; no format required a fifth, and that closure is the argument the table is complete
for the formats we know."*

Which producer seals a node *"is a property of the node"*; a boss *"may not carry an authored
verdict, because it has a real one"* (`:355-361`). Why the boss is a game, not a horizon-free
pack (`:361-365`): `objective` and `checkpoints` are in the pack schema's top-level
`required` list, so encoding the boss as a game makes the refused input *"absent rather than
ignored."*

### 1.5 D893 — the StS path/architecture ruling (`:92-117`)

The owner's words, quoted in full at `:93-100`: *"in Slay the Spire you choose paths… this
can be one of the choices… or a variant campaign — we DEF want a pure chess campaign (where
basically abilities or evidence consumers are unlocked???). And the nodes you visit to unlock
shit can be puzzles, find best move, find blunder, play out the position and survive for x
turns, the solitaire — ANYTHING we can find that's fun or teaching something… building an
army sounds like a dope extension — not only would that unlock more difficult bosses but it
can be a nice 'prestige' reward. Just like how in Slay the Spire the hero you choose affects
the ENTIRE run and what you can even collect."*

Three structural consequences recorded as intent (`:102-113`):

1. **Node variety is the format catalogue** — any grounded format may be a node type.
2. **The pure-chess campaign is definite; progression currency is evidence consumers** —
   *"modules/abilities unlock as the run advances"*, constrained by D297's knowledge-as-key
   and `design/05`'s honesty policy: *"an unlocked ability is a grounded module, never a
   truth change"* (`:106-110`).
3. **Army-building is a campaign VARIANT in the character-select sense** *"and additionally a
   prestige axis: completing it unlocks harder bosses. It is an extension beside the pure
   campaign, not the spine"* (`:111-113`; D885 adjusted accordingly).

Ordering: *"Composition stays last per [[D717]]'s program order; R6/R7/R8 still gate the
experiential choices"* (`:115-116`).

### 1.6 D869/D870 — solitaire chess and the training-mode-variant family

- **D869** (`design/BACKLOG.md:264`): *"Solitaire Chess becomes both a standalone mode and a
  campaign encounter class."* Mechanism *"already ships dead ([[D860]]): predictions against
  the Maia distribution, law-8-clean scoring by construction, imported master games as the
  free corpus."* Adds the third verdict producer row.
- **D870** (`design/BACKLOG.md:265`): the campaign wants *"a FAMILY of training-mode
  variants, not one"*; the crisp distinction — training-mode variants (ways of engaging
  standard chess) are encounter material; **rule variants (Chess960 etc.) stay parked under
  D327/D328**. Named candidates our evidence uniquely enables: avoid-the-blunder (D718
  negative reading), threat-radar hunt (`threat@1`), hold-under-shrinking-clock (D862),
  play-the-structure (shape library).
- **D886** (`design/BACKLOG.md:318`): verdict shape 4 approved — *"until ruled, all survival
  formats ship authored-bound under shape 1"* was its pre-ruling state; D893(1) approved it.

### 1.7 D873/D887 — the material/board balance law (`:231-241`)

The law, verbatim (`:232-241`): the campaign *"may bend material and position freely: a
reduced-material start on the standard board is a legal chess position, every instrument
works unchanged — the tablebase turns on at ≤7 units — and the Steps-Method tradition
validates the pedagogy. Bending the board geometry or the piece set exits the evidence plane
(no Maia, no explorer, no tablebase, wrong movement model in the collectors), so an
evidence-dark node is marked play, never training, and it may seal no verdict, credit no
skill, and gate no content — but it may pay out cosmetic rewards (piece skins, board
themes)"*. The spirit clause, owner's words: *"we don't need to forget we're learning chess
here."* (`:240-241`). D873's technical basis (`design/BACKLOG.md:325`): *"Smaller boards
break the entire stack (FEN, board, collectors, every instrument assumes 8×8). Fairy pieces
are evidence-dark everywhere."*

### 1.8 The rewind ruling and the failure state (`:391-427`)

- The failure state already ships one scope level down: `ObjectiveState` has six values, only
  three absorbing (verified at HEAD — `packages/runtime/src/trajectory.ts:6`
  `ABSORBING = new Set<ObjectiveState>(["achieved", "failed", "transitioned"])`; the union
  `"active" | "preserved" | "degraded" | "failed" | "achieved" | "transitioned"` at
  `packages/runtime/src/types.ts:4-10`). `degraded` is one-way by validator rule
  (`OBJECTIVE_DEGRADED_IS_ONE_WAY`, `apps/server/src/pack-validation.ts:519`), sealed across
  trajectory legs as `sealedState` (`apps/server/src/pack-orchestrator.ts` follow_theory
  degraded rules at `:560-578`; `TrajectoryLegSpan.sealedState`, `trajectory.ts:15`).
- The intermediate/boss split is a lint rule: `THEORY_ABSORBING_UNSUPPORTED`
  (`pack-validation.ts:507`, *"follow_theory cannot enter an absorbing objective state"*) —
  17 of 37 packs (at measurement time) *"literally cannot end a run"* (`06:408-410`).
- The ruling (`:413-419`): *"a node remembers the branch you SUBMIT. Rewind stays free inside
  an encounter; declaring done is what counts, and the submitted attempt decides both the
  node's sealed verdict and the run. This prices committing, never retrying."* `reveal` is
  the verb to extend (`:418-419`; shipped: `RunService.reveal`,
  `apps/server/src/service.ts:1547-1563`).
- Two scheduled consequences (`:421-427`): every seal is path-scoped, so *"rewinding to a
  clean line erases it — that is the thesis working"*; and *"'did this run succeed' is
  computed nowhere: `attempts` is per branch, so a run-level roll-up is the precondition for
  everything else here — the smallest new part, and the first one to build."*
- The open question block (`:429-443`) records the R11 collision without resolving it; until
  the owner rules, *"the submitted-branch text above governs authored encounters, and is
  undefined for the boss-game class"* (`:441-443`).

### 1.9 Standing laws and what escalates

Six laws at `:215-229` (honesty/inventory independence; ADR-0007 by construction; unlocked
hint is a grounded primitive; authored contexts declare/unauthored default; *"Rarity is not
value"* ρ = −0.143; live-surface admission rule). §5's frame (`:297-302`): *"What escalates
here is LEGIBILITY, not power… The power curve is flat by construction."* Models: *"Take ITB
as the structural model, Balatro as the boss model, and Spire only for the map and the
draft"* (`:307-308`). The best mechanism: *"a capability-suppressing boss (Balatro's boss
blind)… law-8-legal by construction — it speaks about the learner's information, never about
chess — and it is what makes the monotone assistance lattice non-monotone"* (`:384-389`).
The deck is a **per-lens loadout with a slot budget over 34 attested lenses** (278,256
five-slot builds), not the nine monotone `AssistanceConfig` axes (`:39-47`).

### 1.10 Corpus caveat riding §5

D440 (`:327-332`): 26 of 56 packs declare `resolveAt: "terminal"`, 25 of those also a
`plyHorizon` (20 at 7–13 ply); *"nothing lints the pair, so this corpus's terminality claims
are unreliable until D440's lint lands."*

---

## 2. The rated-boss seam with `rfc/learner-rating.md` (draft, 2097 lines)

### 2.1 §5.3a — the ruling and its four consequences

The ruling (`rfc/learner-rating.md:546-547`): *"a boss encounter runs to a real terminal
result and rates like any other game. The rating is not relaxed for it; the boss is rebuilt
to meet it."* Concretely (`:553-555`): *"A rated boss is a `position` session created against
a calibrated rung — the object `POST /rated-games` already creates (§10.2) — with the
campaign supplying the start FEN, the side and the band."* Not a horizon-free pack, because
`objective`/`checkpoints` are schema-`required` and an authored objective is R2's first
refused input; as a game the refused input is *"absent"* (`:556-562`).

Four consequences (`:568-603`): (1) a boss is a different object class — two verdict
producers, *"neither is computed from the other"*; briefing copy allowed, authored verdict
not; (2) **Act II only, measured rather than chosen** (the twice-over refusals of §1.3
above, with `PERFECT_TABLEBASE_OUT_OF_RANGE` quoted: *"perfect_tablebase requires a root
with at most seven pieces"* — verified at HEAD, `apps/server/src/pack-validation.ts:1103`);
(3) `plan` mode 14/14 at ≥21 pieces; (4) the R11 collision → open question 11.

### 2.2 The rated-game predicate the boss must satisfy (`:324-347`)

Eight conditions; the campaign-relevant ones: declared rated **at creation, before the first
ply** (R11); `sessionKind === "position"` — *"A campaign boss satisfies this rather than
excepting it… `RunSessionKind` stays the shipped three-member union… no fourth kind is added
here"* (`:329-333`; confirmed at HEAD:
`packages/runtime/src/types.ts:36` `export type RunSessionKind = "pack" | "position" | "imported";`);
`human_common` at one of four rungs (1000/1400/1800/2200, `RATED_OPPONENT_CALIBRATION`,
`:357-376` — file `packages/runtime/src/rating-calibration.ts` is **new at landing, absent
at HEAD**); `eloHonored === true` + pinned container digest; **≥21 pieces**; every
server-routed assistance rung refused for the whole run; *"no `run.rewound` event and
exactly one branch"* (R11, `:341`); reaches `outcome.reached`, no adjudication tablebase
included (R12, §5.4 — a tablebase result is *"a fact about the position under optimal play…
a counterfactual"*, `:635-641`). Failing 7 or 8 **voids** rather than refuses: *"the game is
still played, still stored, still browsable; only its rating contribution disappears"*
(`:344-347`).

### 2.3 The R11 collision — open question 11, both branches pinned

The question (`:2026-2037`): *"Does a rated boss close rewind, or does a rated boss not
exist?"* Three answers, quoted:

| Branch | Consequence for the campaign RFC |
|---|---|
| (a) *"the boss is the one encounter where rewind is closed, and the campaign says so before the first ply"* | Prices this node's experimentation, *"reopens §11.4's tension at a place the learner cannot avoid if they want the rating"*. The RFC must carry the pre-ply disclosure surface and a per-class exception to `06` §5's submitted-branch rule; `06` §2c's conditional amendment (`06:204-211`) then converts from open question to answer. |
| (b) *"a boss is played twice — a free encounter and a separately-entered rated attempt, so nothing is closed and the rating is opt-in per boss"* | *"the only one that touches neither the thesis's 'experimentation without cost' nor R11, and is what the author would recommend if asked"* (`:2036-2037`). The RFC must model a node with two attempt modes (campaign seal from the free encounter, rating from the opt-in game) and decide which one advances the map. |
| (c) *"bosses run to terminal for the campaign's sake and are simply not rated"* | *"keeps the ruling and drops the rating from the campaign entirely"* — the boss row keeps `terminalOutcome` as seal but produces no rating event; the second axis of §2a becomes has-a-result-but-unrated. |

Related open question 7 (`:1997-2002`): if the owner ever rules submitted-path semantics as
(b)-the-path-you-submit, *"this RFC does not follow it"* for rating purposes — the rating
sidesteps via R11's void. So the campaign's submitted-branch seal and the rating's
no-rewind rule are **permanently different predicates**, whichever way Q11 goes.

Status note: the task brief says Q11 *"is being put to the owner separately today"* — the
campaign RFC should be written to absorb any of (a)/(b)/(c) via the table above.

### 2.4 The two-verdict-producers split and the refusal wall the campaign inherits

R2 (`:945`): a rating may never move on *"`ObjectiveState`, `attempts.verdict`,
`successConditions`, `TempoVerdict`, `lineMembership`, `prediction.recorded`"* — i.e. **none
of the campaign's three non-boss seal shapes may ever touch the rating**. R4 (`:947`): no
per-move contribution of any kind. R9 (`:952`): rating never *"purchasable, sellable, or a
gate on content… winning may unlock convenience and variety, never content"* (D334). R15
(`:958`): rating may select what is shown, *"never appear as an input to WHAT IS SAID about
a move"*. Assistance during a rated boss: only the three wire-crossing rungs (`humanSplit`,
`corpus`, `voice`) are refusable server-side; the six browser-rendered axes are *"not
possible, not detectable, and not claimed"* (`:497-503`) — a campaign loadout that includes
browser-side lenses is invisible to R6's enforcement, which the boss disclosure must state.

---

## 3. What a campaign consumes from the accepted stack — the exact seams

| Seam | Status at HEAD | What exists | What the campaign must do |
|---|---|---|---|
| `rfc/intent-presets.md` | **accepted 2026-08-22** | 7-member `WORKFLOW_CONTEXTS` + `ContextContract` registry + `deriveWorkflowContext` (all land with that RFC; **absent at HEAD** — `apps/web/src/lib/assistance-preference.ts:4` still ships the six-member `ASSISTANCE_PROFILES`) | Register the **eighth context** (see below) |
| `rfc/bot-policy.md` | **accepted 2026-08-22** | `RunOpponentPolicy.profile` triple in `run.started` under run-schema 0.18; O8 roster **closed at three profiles** | An encounter names its opponent via `run.opponentPolicy` (see below) |
| `rfc/longitudinal-store.md` | **accepted 2026-08-22** | `decision_class ∈ {played, game, predicted}` in the PK | Prediction encounters land *"with no migration on the day solitaire ships"*; campaign progress needs **new** persistence (see §6) |
| `rfc/learner-modules.md` | accepted (11-module registry) | Closed 11-id union, `ModuleDeclaration` in `evidence-catalog.ts` | The unlockable-abilities pool (see below) |
| `rfc/move-quality-grades.md` | **accepted 2026-08-22** | Practice/report grade ladders, *"claims nothing versioned… consumed by `postcommit_nudge`/`review_map` only"* (`rfc/README.md:16`) | Grades reach a campaign node only through those two modules; a grade as a node seal would be R2/R4 territory |
| `rfc/play-composition.md` | accepted | Closed 16-state composition matrix | **Campaign chrome is explicitly outside it** (see below) |
| Drill-pack format v0.27 | implemented (`docs/drill-pack-format.md:4`) | See gap table below | A pack can express an authored encounter's *interior*; it cannot express the *node* |

### 3.1 `intent-presets` — the eighth context

The discharge row, quoted whole (`rfc/intent-presets.md:444`): *"D3 | Campaign as an eighth
context — `design/06`'s encounter rules compose this contract (a campaign encounter is a
`ContextContract` with encounter-authored ceilings); nothing here forecloses it and nothing
here builds it | `planning/exploration/plan.md` | the campaign RFC's registration |"* — the
discharge condition **is** the campaign RFC.

What registration requires per that RFC's own machinery:

1. A `"campaign"` member in `WORKFLOW_CONTEXTS` (`:84-88`) and, since `AssistanceProfile`
   becomes a re-export (`:90-92`), an eighth localStorage profile key
   `tabiya.assistance.v1.campaign` grammar-compatible with `assistanceKey`
   (`assistance-preference.ts:15`).
2. A full `ContextContract` row (`:125-131`): `defaultPreset`, `allowedPresets`,
   `moduleCeiling` (stated as the may-never-show complement, `:138-139`), `configClamp`.
   The §3 registry invariant binds it: on `boardLighting` *"the only clamp values any
   `ContextContract` may carry are `"legal" | "sight" | "evidence"`, each denoting the range
   `["legal", token]` — a registry invariant (compile-time test…) refuses
   `"free"`/`"locked_off"` there"* (`:162-165`). An encounter can therefore never darken the
   rules floor, and `rules_floor` *"is never in any complement — it is not assistance"*
   (`:172-174`).
3. A branch in `deriveWorkflowContext(input: { sessionKind, feedbackPolicy, liveKind? })`
   (`:176-187`). **Gap: no input distinguishes a campaign run.** A campaign encounter is a
   `pack` or `position` run (§2.2 — no fourth `RunSessionKind`), and `liveKind` covers only
   live sessions; the derivation needs a new input (or the campaign registers its context by
   an explicit run-creation parameter rather than derivation). This is a real seam decision
   the RFC must make, not covered by intent-presets.
4. The per-encounter ceiling on top: D3's phrase *"encounter-authored ceilings"* means the
   node narrows further inside the campaign contract — consistent with the algebra, which
   *"only narrows"* (`:107-109`), and with `06` §3 law 1 (honesty outer, inventory inner).

### 3.2 `bot-policy` — how an encounter names its opponent

- The persisted seam (`rfc/bot-policy.md:418-431`): *"the persisted `run.started`
  `opponentPolicy` payload widens by the same optional object under the same 0.18 stamp"* —
  `readonly profile?: { readonly id: string; readonly version: number; readonly digest: string }`
  (`:405`), digest checked **at run creation** via `validateOpponentPolicy`
  (`apps/server/src/service.ts:345` per that RFC).
- Rules (`:409-413`): `profile` valid only with `mode: "human_common"` in v1; **mutually
  exclusive** with `targetElo`/`temperature`/`topP` — *"the profile is the single authority
  for band and sampler."*
- So per encounter class: Act I boss = `theory_strict` (no profile possible); Act III boss =
  `perfect_tablebase` (no profile possible); Act II boss and any `human_common` node =
  either bare `targetElo` **or** a profile triple, never both. A rated Act II boss must
  reconcile with learner-rating §3 precondition 3 (four ladder rungs, `eloHonored`); note a
  *profile* is not currently one of the rated predicate's admitted forms — the rated
  predicate reads `targetElo` on a rung, and a profile forbids `targetElo`. **The two
  accepted/draft grammars are disjoint at HEAD; a "persona boss that is also rated" needs
  either a calibrated profile (a rung measurement per profile, bot-policy §7) or the boss
  drops the persona.** Pin this in the RFC.
- Roster: *"the O8 roster is closed at three profiles"* — Human baseline / Guarded human /
  Pawn-heavy (`:88`, `:237`); campaign personas beyond three are new catalog declarations
  (catalog-local, no table, `:231-253`), not schema work.

### 3.3 `longitudinal-store` — prediction runs and progress events

- `decision_class` CHECK `('played','game','predicted')` in the PK
  (`rfc/longitudinal-store.md:170`, `:181`); `predicted` is *"a decision evidenced by a
  `prediction.recorded` event… whose 'played' edge is the predicted edge"* (`:135-137`);
  *"landing with no migration on the day solitaire ships"* (`:236-237`) — the store is ready
  for D869 the day the pack gate lifts.
- The store is a projection of run events with per-run grain and *"no cross-game total…
  ever stored"* (`:210-216`). **Campaign progress (path position, unlocks, prestige) is not
  run-derived state and cannot live here**; it needs its own tables (§6). What the store
  gives the campaign free: per-family, per-phase, per-class observation rows that a
  module-unlock condition could read (D297 knowledge-as-key over real evidence).

### 3.4 `learner-modules` — the unlockable-abilities pool

The contract already names the campaign as a consumer: *"`id` — one of the closed eleven
(§4). Stable; consumed later by presets (Phase 5) and the campaign registry ([[D893]])"*
(`rfc/learner-modules.md:125-126`).

The 11 ids (`:299-311`): `rules_floor`, `sight_on_request`, `blunder_prevention`,
`threat_radar`, `postcommit_nudge`, `structure_nudge`, `theory_breadcrumb`, `guided_hint`,
`compare_coach`, `review_map`, `full_inspector`.

Unlockable candidates per D893's *"evidence consumers are unlocked"*: **10 of 11** —
`rules_floor` is excluded by construction: it *"registers no `module.rules_floor` evidence
consumer"* (`:325`, registry-only), is *"not assistance"* and never in any ceiling
complement (`intent-presets.md:172-174`); making the rules floor earnable would violate the
floor-and-ceiling token. `blunder_prevention` is Support-only/at-commit (`:303`) and already
excluded from most context complements (`intent-presets.md:144-149`), so its unlock composes
with the narrowest availability. Note the deck itself is the **34-lens loadout**
(`06:44-47`), a different axis from module unlocks; the RFC must keep the two vocabularies
(lens slots vs module abilities) from collapsing into one.

### 3.5 `play-composition` — where campaign chrome lives

Explicit exclusion (`rfc/play-composition.md:104-107`): *"No campaign surfaces (`design/06`
encounters, map, progression) and no Story or Review-map layout beyond their declared
seats."* The 16-state vocabulary is a **closed list**: *"adding or dropping one is a spec
change with a changelog line"* (`:502-505`), and the board-stability criterion holds
*"across all sixteen composition states"* (`:342`). Consequence: the campaign **map/draft/
inventory screens are a new surface outside the play composition** (like Story), and any
in-run campaign chrome (act banner, encounter objective framing, suppressor disclosure)
either seats inside existing regions or amends the closed list — a coordination cost the RFC
must price. Composition order: campaign composition comes **last** (D717, `06:280-284`).

### 3.6 Drill-pack format v0.27 — can a pack express an encounter today?

What it can express (all shipped): start FEN + `start.side`; `objective` with seven
`successConditions` kinds; `authoredBoundary.plyHorizon`; `deviations` with `offObjective`
(the degraded path); `opponentPolicy` incl. per-leg overrides (v0.25,
`docs/drill-pack-format.md:88-92`); trajectory `legs` — the *"2 encounters + 1 act boss"*
shape *"three authors independently wrote"* (`06:410-411`); prediction checkpoints
(`interaction.type: prediction`); `retryVariants` (authoring metadata only —
`RETRY_VARIANTS_NOT_EXECUTABLE`, `docs/drill-pack-format.md:107-108`).

What is **missing at HEAD** for an encounter:

| Missing | Evidence |
|---|---|
| Encounter class / node declaration | No `campaign`, `encounter`, `node`, `act` field anywhere in the schema; grep over `schemas/` and `packages/schema/` finds none |
| Map/graph container above the pack | D303 (`design/BACKLOG.md:924`): `family`/`track`/`curriculum`/`campaign`/`run_set`/`playlist` are *"0 hits repo-wide"* — *"the missing container is `04` §1's Track"* |
| Reward/unlock payload (modules, lenses, cosmetics) | Absent at HEAD; ADR-0007 + D893 constrain its semantics |
| Slot-budget / loadout declaration | Absent at HEAD (the 34-lens loadout has no schema home) |
| Prediction-score threshold seal | v0.9 removed prediction grading: *"recorded policy mass and rank are shown as numbers and never turned into a correctness verdict"* (`docs/drill-pack-format.md:15-17`) — D869's threshold seal is a **new mechanism**, see Gap 5 |
| Unbounded-run survival seal + grounded counters | Absent; `successConditions` all resolve at checkpoint/terminal within a bounded pack |
| Boss game declaration | Deliberately not a pack field — `POST /rated-games` body (`learner-rating.md` §10.2), which itself is **absent at HEAD** (the RFC is draft) |

Also load-bearing: pack-less runs cannot seal — `projectAttempts` forces
`verdict: graded ? verdict(tip.objectiveState) : "open"` (`apps/server/src/progress.ts:127`)
with `graded` requiring a pack with compiled objective rules (`:90`). D303's rule:
*"intermediate nodes may be pack-less; boss nodes may not"* — except the D439 boss, which
seals by `terminalOutcome`, not by `attempts.verdict`.

---

## 4. Campaign-adjacent code at HEAD — mostly absent, pinned exactly

Searched `apps/` and `packages/` (case-insensitive) for campaign, act, encounter, boss,
path, unlock, progression, solitaire, variant, army, prestige.

**Absent at HEAD:** any symbol named campaign/boss/act/prestige/army/solitaire/unlock; any
XP, currency, level, or progression counter; any map or node graph; any inventory object;
any rewind budget or refusal path; any time control (`clockState` is
`Readonly<Record<string, unknown>>` at `packages/runtime/src/types.ts:124` and
`runtime.ts:57` — an untyped passthrough; `clock_zeroed` is the halfmove-clock transition
subkind, `packages/runtime/src/transition.ts:67,490`); any server-held assistance state
(`AssistanceConfig` is browser localStorage, `assistance-preference.ts:15`); the
`rating-calibration.ts` and `rated_games`/`learner_ratings` objects (learner-rating is
draft).

**What exists that a campaign will touch:**

| Symbol | Location | Relevance |
|---|---|---|
| `RunSessionKind = "pack" \| "position" \| "imported"` | `packages/runtime/src/types.ts:36` | The closed union; boss = `position`, authored encounter = `pack`, prediction encounter = `imported` (+ prediction events) |
| `LIVE_SESSION_KINDS = ["stream", "academy", "match"]` | `types.ts:38` | The live union — campaign is not a live kind and needs none |
| `ObjectiveState` (6 values, 3 absorbing) | `types.ts:4-10`, `trajectory.ts:6` | The shipped failure state (§1.8) |
| `TrajectoryLegSpan.sealedState` + leg reset rules | `trajectory.ts:15`, `pack-orchestrator.ts:552-578` | The seal-across-boundaries mechanism the node seal extends |
| `branchDecidedness` / `DecidednessGround` (3 kinds: `terminal_outcome`, `objective_terminal`, `tablebase`) | `packages/runtime/src/branch-scale.ts:14-24` | The §2a axis's branch-level ancestor; **no human-outcome ground exists** (`06:49-57`) — the fourth ground is new work |
| `prediction.recorded` event (`predictedUci`, `predictedMass`, `predictedRank`, `candidateCount`, `distribution: OpponentSelection`) | `types.ts:227-238` | The solitaire scoring record, shipped |
| The prediction pack gate | `apps/server/src/service.ts:1204` — requires a registered pack with a prediction checkpoint; refuses otherwise | Must be lifted for imported-game prediction runs (D860/D869; `longitudinal-store.md:233`) |
| `shape_encounter` recommendation | `apps/server/src/service.ts:819-836`, `apps/web/src/lib/api.ts:382` | The unlock **detector** (`06:58-61`): rung-0 arithmetic, provenance sentence, *"Nothing gates on it"* |
| `attempts` table, per-branch PK, `AttemptOrigin = "fresh" \| "duplicate" \| "scheduled" \| "in_run_retry"` | `apps/server/src/progress.ts:7`, storage per learner-rating §2 | The attempt history; run-level roll-up **absent** |
| Six shipped consumerless fun-device objects | D297 (`design/BACKLOG.md:918`): `RETRY_VARIANT_KINDS`, `CheckpointInteraction.prediction`, `AssistancePermission.locked_off`, `shapeRecommendations`, `attempt_concepts`, `ObjectiveState.degraded` | The assembly-not-build inventory |
| `RunService.reveal` | `apps/server/src/service.ts:1547-1563` | The verb the submitted-branch seal extends (`06:418-419`) |
| `run_marks`, `run_grants`, live-session machinery | migrations 22, 24 (`rfc/README.md:262-264`) | Witnessed-play option (learner-rating open question 12) if a cohort ever requires it |

(One false-positive class for future grep hygiene: `encountered` as a local variable in
`service.ts:827-833` and prose "unlocks" in `GameStoryScreen.svelte:43` are not campaign
code.)

---

## 5. Variant mechanics feasibility at HEAD

The stack: **chessops 0.15.1** everywhere (`packages/runtime/package.json:14`,
`apps/server/package.json:16`, `packages/schema/package.json:17`),
**@lichess-org/chessground 10.1.1** in the web client (`apps/web/package.json:14`). The one
FEN door: `positionFromFen` → `Chess.fromSetup(parseFen(fen).unwrap()).unwrap()` throwing
`TypeError("Invalid chess FEN…")` (`packages/runtime/src/chess.ts:4-10`); the pack lint
*"parses the start as legal standard chess"* (`docs/drill-pack-format.md:171`), and the
`/fen/` address helper validates the same way (`packages/schema/src/drill-pack/urls.ts:51`).

| Variant class | Runtime at HEAD | What it would require |
|---|---|---|
| **Reduced armies / reduced-material starts** (standard board) | **Works unchanged.** A legal standard FEN; every collector, SEE, engine, explorer works; tablebase turns **on** at ≤7 units (D873); `perfect_tablebase` requires ≤7 (`pack-validation.ts:1103`) | Nothing mechanical. Constraints inherited: R5 refuses **rating** below 21 pieces (unidentified opponent, `learner-rating.md:446-459`), so reduced-army nodes are unrated by construction; D887 lets them seal/credit normally (they are grounded chess) |
| **Smaller boards** | **Broken at the first symbol**: `parseFen` requires 8 ranks; chessground renders 8×8; *"every instrument assumes 8×8"* (D873) | A parallel rules/board/collector stack — out of scope for any near RFC; D887 marks the class evidence-dark anyway |
| **Fairy pieces** | **Broken at the first symbol**: unknown piece letters fail `parseFen`; *"no Maia, no explorer, no tablebase, wrong movement model in the collectors; Fairy-Stockfish is the lone instrument"* (D873) | If ever built: a second move-generation path plus D887's marking — *"play, never training… may seal no verdict, credit no skill, and gate no content — but may pay out cosmetic rewards"* |
| **Rule variants (Chess960 etc.)** | Published capability **refusal** (`UCI_Chess960`, `capabilities.ts:105` per D306); parked under D327/D328 (D870) | Stay parked; Fog-of-war's idea is adopted **in the assistance layer** (the suppressor boss), refused in the move generator (D306) |
| **Solitaire-chess move prediction** | **All primitives ship**: `prediction.recorded` with mass/rank/candidates + Maia `distribution` (`types.ts:227-238`); `importGame` + `imported_games` (migration 12); `decision_class` separates `predicted` from `game` on landing of longitudinal-store | (1) lift the pack gate at `service.ts:1204` for imported runs; (2) a seal mechanism — see Gap 5. **Law 8 note:** scoring is comparison to the actual game's move (`decision_class='game'` rows are the source mainline, movetext-bounded, `longitudinal-store.md:130-137`) and to the recorded human distribution (`OpponentSelection.candidates`, `types.ts:102-108`) — arithmetic over recorded facts, no LLM judgement anywhere in the loop. The data source is the imported PGN (already stored byte-exact with licence note, migration 12 row, `rfc/README.md:237`) plus the Maia policy snapshot per node |
| **Survival/streak formats** | Counters exist as primitives (plies survived = ply count; avoidance = D718 negative reading; threat found = `threat@1`) but **no unbounded-run objective exists**: every shipped objective resolves at checkpoint or terminal within a bounded pack | A new objective/seal shape (D886's *"declared grounded counter"*) — schema + runtime work, not assembly |

---

## 6. Persistence — what campaign state needs and where the registers stand

### 6.1 The registers at HEAD (`rfc/README.md`)

- **Migration register head = 24** (`rfc/README.md:215`; landed rows through 24 =
  `teacher-surface`, `:264`). Rule: *"a draft claims a position in the landing order, never a
  number… always `STORAGE_VERSION + 1`"* (`:253-256`). **Live queue (`:266-273`):**
  1. `learner-rating.md` — position next (two table sets: rating three + standing three);
  2. `longitudinal-store.md` — behind learner-rating;
  3. `bot-policy.md` — behind longitudinal-store (stamp-only run 0.17→0.18).
  **A campaign migration claims the position behind `bot-policy` — fourth in line at best.**
- **Pack-schema head = 0.27** (`:63`); 0.28 claimed-and-kept by `graduation-clearance`
  (`:24`), 0.29 claimed by `pack-population-provenance` with 0.30 inherited by RFC-6
  (`:30`). A campaign pack-field claim queues behind those.
- **Run-schema**: 0.18 claimed by `bot-policy` (`:15`); 0.19 *"named-and-declined"* by
  `intent-presets` with a reopen condition (`:29`). A campaign run event (e.g. an
  encounter-entered marker) would claim 0.19-at-its-turn — but note the learner-rating
  precedent argues **against** run-schema surface for projections (`learner-rating.md
  §9.3`: *"a thing that is not on the object cannot leak from it"*).
- `STORAGE_VERSION` is 24 at this HEAD (re-verified by learner-rating `:1111-1113`); per
  D384/D392, re-derive at landing, never trust a prose integer.

### 6.2 What campaign state exists to persist, and the split precedent

| State | Nature | Where it must live | Precedent |
|---|---|---|---|
| Run-level roll-up ("did this node/run succeed") | Projection of run events | Server table or read-time computation — *"computed nowhere"* today (`06:424-427`); *"the smallest new part, and the first one to build"* | `attempts` (`progress.ts`), rating-as-projection (`learner-rating.md` §9.3) |
| Path position / map state (current node, act, offered draft) | Durable per-learner campaign state, not run-derived | **Server table, new migration** | `repertoires`/`schedules` (migrations 15, 6) |
| Earned inventory (unlocked modules/lenses) | Earned, so **cannot** be client-side: *"`AssistanceConfig` lives in browser localStorage keyed by session kind, so it cannot hold something earned"* (`06:63-65`) | **Server table, new migration**; the client-side layer stays preferences-only (`tabiya.assistance.v1.*`, `tabiya.workflow.v1.*` — the latter *"client-only, version inside the value"*, `rfc/README.md:29`; server-side store deferred to a future personalization RFC, intent-presets Discharge D2) | The localStorage-vs-server split: preferences client-side, earned/consented/measured state server-side (assistance prefs vs `attempts`/`rated_games`) |
| Attempt history per node | Already per-branch in `attempts`; needs node-scoped roll-up | Projection over existing tables + campaign node key | `learner_position_stats` (`storage.ts:2729-2734` per learner-rating `:1095-1096`) |
| Prestige / variant completion | Durable, ADR-0007-constrained | Server table, same migration | none — new |
| Cosmetic rewards (D887 skins/themes) | Earned but presentational | Server-held earn record; client renders | none — new; D839 theming lane is separate (`play-composition.md:108-111`) |

Table discipline to inherit: `STRICT`, literal CHECK strings (migration-9 freeze lesson,
`rfc/README.md:133` per learner-rating `:1220`), `ON DELETE CASCADE` on `learners(id)`
(learner-rating `:1217-1219`), create-table/index only, no backfill (nothing historical is a
campaign run).

---

## 7. Gaps — every question the RFC must answer that HEAD does not

Owner-level forks are marked **[OWNER]**; traps marked **[TRAP]**.

1. **The gate itself.** R6 (count budget), R7 (preset-withheld legibility), R8 (loop worth
   wrapping) are open and answered only by the preregistered owner pilot
   (`planning/platform-alignment/campaign/participant-plan.md`; `06:255-278`). No RFC before
   that closure feeds platform R14/O10 (`campaign-research-queue.md:4-5`).
2. **[OWNER] Open question 11 — rewind at the rated boss.** Three branches pinned in §2.3;
   the RFC must be drafted to absorb any of (a)/(b)/(c). learner-rating's author recommends
   (b) (`learner-rating.md:2036-2037`). Being put to the owner separately.
3. **[OWNER] Second-axis reading of §2a.** Claude-derived from the ruling's orthogonality
   sentence, explicitly *"the owner's to veto"* (`06:130-135`). The RFC should restate the
   fork once and proceed on the second-axis reading unless vetoed.
4. **[OWNER] Prestige-unlocks-harder-bosses vs D334.** D893(3): army-building completion
   *"unlocks harder bosses"*. R9's surviving distinction: *"winning may unlock convenience
   and variety, never content"* (`learner-rating.md:952`). Is a harder boss variety or
   content? ADR-0007 (unlocked by playing) is satisfied either way; the D334 line is not
   obviously. Needs a ruling or an argued reading before the prestige axis is specified.
5. **Prediction-score threshold seal vs the v0.9 no-verdict rule.** Format v0.9: prediction
   numbers are *"never turned into a correctness verdict"* (`docs/drill-pack-format.md:15-17`).
   D869's encounter seal is a threshold over those numbers — a verdict. The reconciliation
   the RFC must write: the threshold is an **authored encounter parameter** (an authored
   objective analogue, law-8-legal like `successConditions`), never a product judgement of
   the move; and it must never reach the rating (R2 lists `prediction.recorded` by name,
   `learner-rating.md:945`). Where the threshold lives (node declaration? pack?) is open —
   see gap 8.
6. **Survival counters need producers.** D886 requires *"each with its declared grounded
   counter"*; avoid-the-blunder needs the D718 negative reading as a counting producer, and
   no unbounded-run objective exists in schema or runtime (§5 table). New seal shape = new
   schema + runtime work; the RFC may defer shapes 3 and 4 (see recommendation).
7. **The run-level roll-up.** *"'did this run succeed' is computed nowhere"* (`06:424-427`).
   First thing to build; decide projection-vs-table.
8. **The node/map object has no home.** No schema container above the pack exists (D303:
   Track missing; §3.6 gap table). The RFC must invent the campaign content object — node
   declarations (encounter class, opponent naming, ceilings, rewards, threshold), map graph,
   acts — and register whatever lanes it claims (§6.1 queue positions).
9. **Server-held inventory.** Absent at HEAD by construction (`06:63-66`); tables + earn
   events + ADR-0007 audit needed. The localStorage precedent explicitly cannot carry it.
10. **The eighth `WorkflowContextId` has no derivation signal.** `deriveWorkflowContext`
    inputs are `{sessionKind, feedbackPolicy, liveKind?}` and none distinguishes a campaign
    run (§3.1 item 3). Either a new derivation input or explicit context declaration at run
    creation — pick one and register it with the intent-presets machinery.
11. **Rated-boss persona collision.** `profile` forbids `targetElo`; the rated predicate
    requires a rung `targetElo` (§3.2). A persona'd Act II boss is unrateable under both
    accepted/draft grammars at HEAD unless a profile is itself rung-calibrated (bot-policy
    §7 gate). Decide: bare-band rated boss (drop persona) or calibrate a profile.
12. **The fourth decidedness ground.** The campaign difficulty axis needs a human-outcome
    ground `DecidednessGround` does not have (`branch-scale.ts:14-17`; `06:49-57`) — a
    promotion of the branch axis to campaign scale plus one new ground kind.
13. **Campaign chrome vs the closed 16-state matrix.** New surface (like Story) or a spec
    change to `play-composition`'s closed list (§3.5); composition last per D717.
14. **Reproducibility caveat on boss modes.** *"only three of the five shipped opponent
    modes are reproducible at all, and `practical_resistance` is scoped to decided
    positions"* (`06:154-156`). Encounter declarations must stay inside the reproducible
    set.
15. **D440 lint.** The corpus's terminality claims are unreliable until the
    `resolveAt: "terminal"`+`plyHorizon` pair is linted (`06:327-332`) — encounter authoring
    inherits the hazard.
16. **Mobile ordering.** `design/research/mobile-scope.md` names the campaign as a reopener:
    *"the mobile ruling may want to come before the map is designed"* (`06:286-289`).
17. **[TRAP] The failure shape.** *"An engine review screen with a rewind button"* is the
    named death (`CLAUDE.md` rejected list; `AGENTS.md` doctrine). A campaign that surfaces
    eval-ish numbers per node trends there; the suppressor boss and legibility framing are
    the antidotes.
18. **[TRAP] The tactics-trainer prohibition.** `design/00-thesis.md:157-159`: *"Explicitly
    not: a tactics puzzle trainer or lesson content."* CC0 puzzles usable only *"re-cut as
    play-the-consequence, never as find-the-tactic"* (CLAUDE.md rejected list, citing thesis
    §§70/93-94). D893's node list includes *"puzzles, find best move, find blunder"* in the
    owner's words — the RFC must re-cut each of those through the four sealed shapes, never
    as find-the-tactic verdicts.
19. **[TRAP] No rewind/fork/attempt count as a score axis** — *"that is C1 in scoring
    clothes and the most likely accidental violation in the whole campaign"* (D302,
    `design/BACKLOG.md:923`).
20. **[TRAP] Refused mechanics stay refused** (D306): prestige *multipliers* (invented
    quantity), rarity tiers (ρ = −0.143; `06` §3 law 5), stamina gates (prices playing).
    Adoptable fragments: the reset/retirement, the pity guarantee.
21. **[TRAP] Assistance enforcement ceiling.** Only three assistance rungs are
    server-refusable (`learner-rating.md:497-503`); any campaign claim about "played without
    help" inherits D389's ceiling and must be disclosed, not asserted.

---

## 8. Summary — seams ready vs missing, and the recommended v1 cut

**Ready (assembly):** two-axis honesty/inventory split; `ObjectiveState`/`sealedState`
failure machinery; trajectory 2+1 shape; `prediction.recorded`; `decision_class` grain;
11-module registry with campaign named as consumer; eighth-context registration slot (D3);
`RunOpponentPolicy` naming for all three boss modes; `shape_encounter` detector;
reduced-material variants.

**Missing (build):** run-level roll-up; server-held inventory; node/map content object;
prediction-threshold and survival seal mechanisms; fourth decidedness ground; campaign
chrome surface; campaign context derivation signal; all persistence (fourth migration
position at best).

**Recommended v1 RFC scope:** the pure-chess campaign only (D893's definite half): 9-node/
3-act map over **authored encounters (shape 1) exclusively**, module-unlock progression over
the 10 unlockable ids, run-level roll-up + server inventory tables, eighth-context
registration, submitted-branch seal via `reveal`, suppressor boss as the Act boss mechanism.
**Defer:** the Act II rated boss (absorb Q11's ruling in a named amendment, or ship branch
(b) opt-in if ruled by then); prediction and survival encounter classes (shapes 3–4, each
needing a new seal mechanism); army-building variant and prestige (gap 4's D334 tension);
evidence-dark fun nodes and cosmetics; time controls (nothing exists to build on).
