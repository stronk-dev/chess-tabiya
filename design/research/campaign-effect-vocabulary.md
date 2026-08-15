# Campaign effect vocabulary — what an unlock, reward or modifier can actually BE, counted

**Question (owner, 2026-08-15):** *"A roguelike, every run needs to feel different, with
some choices affecting your build, and cool effects… you're not only taking drill packs on
a run — you want to earn rewinds or other skills, or fork/branch a game, or a modifier to
the pieces… anything we can think of."*

Underneath it: **is there enough of them?** That deserves a number, not reassurance.

**Method.** Everything below is counted against the repo at commit `8744adb`
(2026-08-15), not estimated. Content counts come from a Python walk over
`content/drafts/*.json` (37 canonical pack files, sidecars and the 5 `.browser.json`
fixtures excluded) and `content/shapes/*.json` (25). Vocabulary counts come from the frozen
unions in `packages/schema/src/drill-pack/types.ts`, `packages/runtime/src/*.ts` and
`schemas/drill_pack.schema.json`. Derivations are stated where a number could be
disputed. All such counts are `[V]`. Competitor figures are `[P]`. Two synthesis claims
are `[M]` and marked.

**One sentence.** The perceptual vocabulary is large and under-exposed — **93 distinct
atoms, 49 individually nameable lenses, 34 of them attested in authored content**; the
economic vocabulary is **empty** (8 of 14 meterable operations are unconditionally free,
the shipped achievement surface mints **7 lifetime events**, and `SIMULATE_BUDGET_EXCEEDED`
is declared and never thrown); and the selective vocabulary is **thin where it counts** —
37 packs collapse to **17 distinct encounter tuples**, of which the entire middlegame is
**one pack**. The nine `AssistanceConfig` axes the campaign doc nominates as "the deck's
slot vocabulary" are a **monotone lattice with exactly one maximal element** — the owner's
own "nine boolean toggles is a settings panel" worry, confirmed by counting. The material
for a deck exists; it is one level below where the design is currently looking.

---

## 1. The constraint, tested

Law 8 / ADR-0005 forbids manufacturing chess truth; `AGENTS.md` §Rejected forbids weakened
engines. So no stat buffs, no altered movement, no "+2 damage". Claude's prior read was
that this is *generative* rather than limiting. **Tested against the count: the read holds,
but not for the reason given.**

It is not generative because "consumables and lenses are what a deck-builder is made of"
(true but unearned). It is generative because of one measurement already in the repo:
**the all-assistance-on state is not the best state, it is the unreadable one.** Q8
measured the pulled rung-0 reading at a **median 58 observations per position (max 97), 13
of them unconditional**, and the shipped compare strip at **8.31 entries/ply firing on
99.8% of transitions with lift ≈1.01×** over quiet alternatives
(`design/research/feedback-versus-the-dashboard.md`, ledgered as D78 at
`design/BACKLOG.md:115`) `[V]`.

That is the whole argument. A deck needs **opportunity cost**, and every other game
manufactures it (mana, slots, gold). This product does not have to: the cost of holding
every lens at once is *measured noise*, so a loadout budget is the product refusing to
print 58 observations, not the product withholding a reward. Law 8 does not merely permit
this design — it is the reason the design has an honest cost function at all.

### 1a. What is out of bounds, stated so the boundary is visible

Every effect below is one somebody will propose. Each is refused with its ground.

| Proposed effect | Why it is out of bounds |
|---|---|
| Piece stat buffs / altered movement ("your knight moves like a queen this run") | Changes what chess is. Also un-grounds every oracle at once: the tablebase, Stockfish, Maia and the Lichess corpus all assume standard chess, so the product would have **no** honest evidence source left. `05` §1 invariant 4 |
| A weakened opponent as a reward ("the boss now blunders") | `AGENTS.md` §Rejected — weakened Stockfish samples weaker engine moves and does not model human choice |
| Material odds as a modifier ("start a rook up") | **Not** a law-8 violation — odds are legal chess and the tablebase still grounds them. But it is off-distribution for Maia, which is trained on standard games, so `human_common` and `theory_strict` (3 of 5 modes consume the Maia band, `apps/server/src/engine-band.ts:92-96`) would produce unattributable play. Legal but ungrounded; if ever used, only against `perfect_tablebase` |
| A relic that names the best move | Rung-2 verdict delivered pre-commit. ADR-0006 / `05` §3-forms: *"a best-move arrow is dangerous because it is a rung-2 verdict delivered pre-commit"* |
| An XP / power / rating number derived from play quality | Manufactured skill number. The ChessMonitor finding names the price of refusing this and the repo pays it deliberately (`design/research/quickpass-wintrChess-encroissant-chessmonitor.md`); `docs/return-and-progression.md` states the shipped surface *"presents no mastery percentage"* |
| An "LLM insight card" as a reward | Law 8. The LLM is the mouth, never the source (`05` §3b-i) |
| A "what is your opponent planning" item | R2: **98.7% false positives** with any computed target set (`design/research/move-primitive-computability.md`). Can only ever be an *authored* item on an *authored* node |
| A mid-game difficulty number, or a boss "strength" display | R4 + R9: no oracle. 10.2% of out-of-range positions decided, median &#124;eval&#124; 43 cp; human outcomes die at ply ~20. `05` §1: absence is stated, never simulated |
| A hint economy priced by rarity | ρ(firing rate, FP rate) = **−0.143** (R3). Campaign law 5 — pricing by scarcity prices noise |
| Any purchasable unlock | ADR-0007, `design/BACKLOG.md:413` |

**Note the distinction law 5 does *not* make.** ρ = −0.143 is a measurement about *single
leaves* and about *pricing*. It says nothing about whether a **conjunction** of two
primitives is more informative than either alone. That is §3's central open claim and it is
marked `[M]` there, not smuggled in here.

---

## 2. The counted vocabulary

### 2a. Perceptual — what you can see. **93 atoms, 49 nameable lenses**

Six non-overlapping families. The overlaps are resolved explicitly so the total is not
double-counted.

| # | Family | Count | Source |
|---|---|---:|---|
| 1 | **Structural feature kinds** — `pawn_safe_square`, `outpost`, `backward_pawn`, `isolated_pawn`, `doubled_pawn`, `passed_pawn`, `open_file`, `half_open_file`, `line_blockers`, `direct_attack_count`, `piece_reach_count`, `named_structure`, `bishop_on_shade`, `pawn_count`, `king_opposition`, `piece_count`, `king_zone`, `piece_distance` | **18** | `packages/schema/src/drill-pack/types.ts:325-330` (`STRUCTURAL_FEATURE_KINDS`) |
| 2 | **Transition primitives** — `attacked_squares_changed`, `defended_squares_changed`, `slider_lines_changed`, `escape_squares_changed`, `defended_duties_changed`, `move_irreversibility` | **6** | `types.ts:381-388` (`TRANSITION_FEATURE_KINDS`) |
| 3 | **Other rules/outcome evidence facts** (`RULES_EVIDENCE_FACTS` minus families 1 and 2: 34 − 18 − 6) | **10** | `packages/runtime/src/evidence-ref.ts:1`; the `structure-` slice is asserted equal to family 1 at `packages/runtime/src/structure.test.ts:70` |
| 4 | **Shape entries** | **25** | `ls content/shapes/*.json` |
| 5 | **Derived readings** — pivotal kinds 4 + story-only moment kinds 5 + compare-strip lenses 4 + tempo verdicts 7 + endgame type ids 5 | **25** | `pivotal.ts:10`; `story.ts:8`; `compare-strips.ts:10-15`; `tempo.ts:14-22`; `endgame.ts:6` |
| 6 | **Source-rung switches** (`AssistanceConfig` axes, excl. `version`) | **9** | `packages/runtime/src/assistance.ts:3-14` |
| | **Total distinct perceptual atoms** | **93** | |

Sub-vocabularies that parameterise the above rather than adding to it: `named_structure`
expands to **4** ids (`carlsbad`, `iqp-white`, `iqp-black`, `maroczy-bind`,
`structure.ts:15`); `move_irreversibility` expands to **4** subkinds (`castled`,
`last_of_role`, `pawn_break`, `clock_zeroed`); `FeatureComparison` = 3;
`StructuralExpression` = **7** node kinds; `TransitionExpression` = **5**; the 4 story
moment kinds shared with pivotal are counted once. Endgame techniques (`lucena`,
`philidor`, `vancura`, `endgame.ts:7`) are counted inside family 4 because each carries a
`shapeEntryId` pointing at one of the 25.

**Authored readable content behind family 4, counted:** the 25 shape entries carry **117
plans, 78 `watch` entries and 89 `typicalMistakes` = 284 authored readable items**. **96 of
117 plans (82.1%) carry a real `success.signature`; 21 (17.9%) are honest `null`
abstentions** ("A fortress is an outcome, not a census"). *This supersedes
`design/research/authored-transitions-and-features.md`'s "73% of shape plans (75/103) ship
`signature: null`" — the content improved from 27% signed to 82% signed while the plan
count grew from 103 to 117* `[V]`.

**Of the 93, the 49 that are *individually nameable lenses*** — i.e. things a learner could
be told they now hold — are families 1 + 2 + 4: **18 + 6 + 25 = 49**.

**Attested subset — the honest number.** A lens is only real if authored content ever uses
it. Measured over the 37 packs and 25 shapes:

- **15 of 18** structural kinds are used somewhere. Unused: `pawn_safe_square`,
  `piece_reach_count`, `pawn_count`.
- **3 of 6** transition kinds are used (`slider_lines_changed`, `escape_squares_changed`,
  `move_irreversibility`).
- **16 of 25** shapes are named by at least one pack. Nine shapes are named by no pack, so
  they are invisible to `shapeRecommendations`, which filters to shapes packs name
  (`apps/server/src/service.ts:752-771`).

> **Attested lens pool = 15 + 3 + 16 = 34.** This is the number the combinatorics use.

**Two shipped defects that shrink the perceptual surface, both new findings here:**

1. **`arrows` is a fully-plumbed no-op.** The knob is typed, defaulted, persisted,
   migrated and permissioned — and no renderer reads it. `boardOverlays`
   (`apps/web/src/lib/DrillScreen.svelte:290`) emits only `orig`, never `dest`, and
   chessground draws an arrow only with a `dest`. Its only non-plumbing occurrence is the
   `<select>` at `AssistanceSettings.svelte:43`. Contrast `boardLighting`, which has five
   consumer sites. **A whole form axis of `05` §3-forms exists as configuration and not as
   perception.**
2. **Doc-vs-code drift.** `design/research/authored-transitions-and-features.md:45,369`
   states "fifteen feature kinds" and "seven of fifteen have never been used in a pack".
   The code is at **18**. That dossier's unused-surface statistic understates the gap; the
   current figure is **3 of 18 unused across all authored content**.

### 2b. Economic — what you can have N of. **14 meterable operations, 2 real budgets, 0 on the learner's play path**

| # | Operation | Budget today | Source |
|---|---|---|---|
| 1 | `rewind(run, nodeId)` | **none** — any node, any time, unbounded | `packages/runtime/src/runtime.ts:385-414` |
| 2 | `rewindToCheckpoint` | **none** | `runtime.ts:416-430` |
| 3 | `fork(run, nodeId)` | **none** at creation | `runtime.ts:371-374`, `apps/server/src/service.ts:689-706` |
| 4 | duplicate run | **none** | `POST /runs/:id/duplicate`, `apps/server/src/rest.ts:559` |
| 5 | flip sides | **none**; exactly 1 derivation kind (`flip_sides`) | `apps/server/src/storage.ts:102,2240` |
| 6 | tablebase probe | **none** — serialized 1-in-flight, 512-entry cache | `apps/server/src/tablebase.ts:23,29` |
| 7 | engine evidence job | **none** — concurrency 2 | `apps/server/src/evidence-queue.ts:103`, `application.ts:334` |
| 8 | opening-corpus query | **YES** — queue depth 4 → "interactive budget exceeded" | `apps/server/src/corpus.ts:98` |
| 9 | `/simulate` | shape-capped **4 branches × 12 plies**, TTL 10 min. `SIMULATE_BUDGET_EXCEEDED` is **declared and never thrown** | `service.ts:1252-1256`; dead code at `apps/server/src/errors.ts:42`, mapped `rest.ts:532` |
| 10 | disclosure reveal | **none by count** — but the `attempt_end` window **closes on the next committed move** | `packages/runtime/src/feedback.ts:22-30` |
| 11 | voice render | binary capability `none`/`external` | `apps/server/src/capabilities.ts:119`; provider seam `external-voice.ts:12-48` |
| 12 | TTS synthesize | binary | `apps/server/src/external-tts.ts:6-8` |
| 13 | branch-group creation | capped at **8** | `service.ts:843` |
| 14 | compare set | capped at **8** | `packages/runtime/src/compare.ts:15` (`MAX_COMPARISON_BRANCHES`) |

**Eight of fourteen are unconditionally free. Three are shape caps, not budgets. Exactly
one shipped budget touches a learner (the corpus queue), and it is backpressure, not
economy. `SIMULATE_BUDGET_EXCEEDED` proves someone anticipated an economy and left it
unwired.** Grep for `rewindsUsed|rewindCount|rewindBudget|REWIND_` across
`apps/ packages/ schemas/ content/` returns **zero hits**; `apps/server/src/errors.ts` has
no `REWIND_*` code. The only refusal path on rewind or fork is `MATCH_LIVE`
(`service.ts:1648-1653`) — a *permission* refusal, never a *resource* one.

**The currency supply, counted.** The shipped achievement surface is `Service.milestones()`
(`apps/server/src/service.ts:592-597`) and it has **exactly 7 kinds**: `first_attempt`,
`first_stable`, `first_objective_achieved`, `first_win`, `first_scheduled_return`,
`ten_attempts_one_root`, `first_flip_sides`. Every one is `if (!output.some(item =>
item.kind === kind))` — **first-time only**. So the entire earn side of a campaign
economy currently mints **at most 7 events per learner, ever**. That is not a currency; it
is a scrapbook.

**The one genuinely spendable thing that already ships, and nobody has noticed it is one.**
`feedbackDeliveryOpen` for `attempt_end` opens on `feedback.revealed` / `outcome.reached`
and **closes on the next `move.committed`** (`feedback.ts:27`). A reveal buys visibility
until you move again. It is a consumable with a natural, honest expiry, it was built to
stop a Just Play reveal becoming a live engine feed (`05` §3a-i), and it is **thesis-
compatible by construction**: it prices *looking*, not *retrying*, so it does not touch
"experimentation without cost" (`design/00-thesis.md:76-79`). Every other consumable
proposal should be measured against this shape.

### 2c. Selective — what you face. **14 axes declared; 17 instantiated**

| # | Axis | Declared | In runtime | Used in content |
|---|---|---:|---:|---:|
| 1 | Opponent mode | **7** (`schemas/drill_pack.schema.json:881-891`) | **5** (`packages/runtime/src/types.ts:38-45`) | **3** — `theory_strict` 20, `human_common` 15, `perfect_tablebase` 2 |
| 2 | Elo band | unclamped integer in schema; **ruled `[1000, 2400]`** (R10) | distinguishable at 100-Elo steps ⇒ **15** bands | **6** distinct values; **25 of 35 (71%) at 1800** |
| 3 | Phase | **4** (`opening`, `middlegame`, `endgame`, `cross_phase`) | 4 | 4 — 20 / 1 / 14 / 2 |
| 4 | Pack mode | **4** (`line`, `plan`, `outcome`, `trajectory`) | 4 | 4 — 20 / 1 / 13 / 3 |
| 5 | Objective type | **12** (`$defs/objectiveType`) | 12 | **6** — `follow_theory` 17, `win` 10, `play_until_checkpoint` 3, `hold` 3, `run_trajectory` 3, `execute_break` 1 |
| 6 | Outcome family | **4** (`win`/`hold`/`save`/`resist`, `apps/server/src/tablebase.ts:8-13`) | 4 | 3 (`win`, `hold`, `run_trajectory`-wrapped) |
| 7 | Tablebase category | **10**; gradeable subset **5** | 10 | — |
| 8 | Feedback policy | **4** run / **3** pack | 4 | **2** — `delayed_checkpoint` 31, `immediate_guard` 6; **`segment_end` 0** |
| 9 | Seed mode | **3** | 3 | 1 — `per_branch` 35/37 |
| 10 | Side | 2 | 2 | 2 — white 23, black 14 |
| 11 | Deviation class | **5**; mistake tags **3** | 5 | — (275 deviations authored) |
| 12 | `retryVariants` | **5** kinds | **no runtime effect** | 3 kinds, **7 of 37 packs** |
| 13 | Branch-group seeding | **2** (`human_replies` / engine enumerate) | 2 | — |
| 14 | `branchDecidedness` | **3** states × **3** grounds | 3 | — |

**`retryVariants` deserves a flag.** It is the axis whose *name* most sounds like a
roguelike modifier, and the content itself records that it does nothing:
`content/drafts/philidor-passive-rook-convert.json:459` — *"The variants rule has no
encoding … invisible to the runtime."* Five declared kinds, three used, zero effect.

**`save` and `resist` are assessment-identical.** `OBJECTIVE_ASSESSMENT_SETS`
(`tablebase.ts:8-13`) maps both to `["loss", "blessed-loss"]`. They differ in name only, so
the outcome family is **3** distinct assessments wearing 4 labels.

**The number that matters — encounter identity.** Collapsing the 37 packs on the tuple
`(phase, mode, opponentMode, targetElo, objectiveType, feedbackPolicy, side)` gives
**17 distinct encounter tuples**. Two tuples account for 17 packs (9 white + 8 black
`opening / line / theory_strict / 1800 / follow_theory / delayed_checkpoint`); twelve
tuples are singletons.

### 2d. Structural — fork and branch as a reward

The owner names *"fork/branch a game"* as a reward, and scarcity is what would make it one.
Verified against `runtime.ts`:

- **`fork` has no count check, no depth check, no cap.** `appendBranch`
  (`runtime.ts:119-130`) is `getNode` + `nextBranch` + one appended `branch.forked` event.
- **`commitMove` auto-forks** when the cursor already has children (`runtime.ts:299-305`),
  so branching is not even an explicit act.
- **The only "8" in the system is a comparison and grouping ceiling**, never a creation cap
  (`compare.ts:15`, `service.ts:843`, `:979`, `branch-scale.ts:2,5`).

**A restricted version would therefore be a new refusal class.** Every existing refusal in
the runtime is a permission refusal; a budget is the first **resource** refusal and needs
its own event so the run log stays the sole source of truth (`05` §1 invariant 6). The
campaign doc already separates the three things a budget could price
(`design/06-campaign.md:110-115`) and only *how often* collides with the thesis. **Adding
to that: the restriction with the best evidence behind it is not on fork at all — it is on
the `attempt_end` reveal window (§2b), which is already a shipped consumable and prices
looking rather than retrying.**

---

## 3. The combinatorics, and where the count honestly collapses

### 3a. What "meaningfully different" has to mean

Two run states are meaningfully different if a learner playing the same position would
**see something different or face something different** — not if a field differs in a
struct. Under that definition, three things do not count: a knob no renderer reads, a knob
that only changes wording or voice, and a state no authored content can instantiate. Each
of those removes an order of magnitude below.

### 3b. The collapse, in four steps

**Nominal.** `AssistanceConfig` has nine enum axes with cardinalities 2·2·2·2·2·3·4·3·2 =
**2,304** states. Times opponent mode (5) × band (15 at R10's 100-Elo resolution) × phase
(4) × objective type (12) × side (2) = **16,588,800 nominal run states**.

**Collapse 1 — dead and cosmetic axes.** `arrows` (3) renders nothing (§2a). `voice` (2),
`spoken` (3) and `ambient` (2) change wording, delivery and a 2rem `♟` glyph — form, never
content. Dividing out: **2,304 → 64 content-bearing assistance states**, namely
`markers`(2) × `guided`(2) × `humanSplit`(2) × `corpus`(2) × `boardLighting`(4). Run states:
**460,800**.

**Collapse 2 — the honesty gate has two states, total.** `permittedAssistance`
(`assistance.ts:27-30`) turns entirely on one boolean,
`mayRequestSplit = (role === "solo" || role === "host") && deliveryOpen`. Six of its nine
keys are hardcoded `"free"`; four vary; `sessionKind` is accepted and **never read**. So the
policy layer contributes exactly **2** distinct permission vectors. It is a safety
mechanism, not a variety mechanism, and it was never going to be one.

**Collapse 3 — the axes are monotone, so there are no builds.** Every one of the nine axes
is ordered *off → more*: `off|live`, `off|on_request`, `off|legal|sight|evidence`. No pair
of states trades X for Y. The 64 content-bearing states therefore form a lattice with
**exactly one maximal element** (`markers: live, guided: live, humanSplit: on_request,
corpus: on_request, boardLighting: evidence`).

> **The number of distinct *builds* — mutually incomparable end-states you could be
> aiming at — over the nine axes is 1.** A campaign built on them is a progress bar
> toward all-on. The owner's "nine boolean toggles is a settings panel" is not a worry to
> be reassured about; it is the measured result.
>
> **`DESIGN-GAP:`** `design/06-campaign.md:36-41` states *"The deck's slot vocabulary is
> those nine axes."* That is the one part of the campaign architecture the count refutes.
> The nine axes are the right **honesty** vocabulary and the wrong **deck** vocabulary,
> and `planning/campaign-synthesis.md:661-663` had already half-spotted it ("per-slot
> granularity below the nine fields… is not expressible"). Escalated per the coverage-
> matrix house rule; not resolved here.

**Collapse 4 — content instantiation.** The declared selective product is
5 × 15 × 4 × 12 × 2 = 7,200. Authored content instantiates **17** (§2c). Combining with
collapse 3:

| Level | Count |
|---|---:|
| Nominal run states | 16,588,800 |
| After dead + cosmetic axes | 460,800 |
| After content instantiation (64 × 17) | 1,088 |
| **Meaningfully different run states today** (loadout contributes no choice, collapse 3) | **17** |

**Seventeen. The owner is right to worry, and the worry is precisely located.**

### 3c. Where the count is not collapsed — and it is one level down

The repo already contains a finer vocabulary that is not exposed as a loadout: the **49
individually nameable lenses** of §2a (18 structural + 6 transition + 25 shapes), of which
**34 are attested in authored content**. These are genuinely incomparable — holding
`{outpost, backward_pawn, half_open_file}` is neither a subset nor a superset of
`{passed_pawn, king_opposition, open_file}` — so a slot budget over them produces real
builds:

| Slot budget k | Over all 49 lenses | Over the 34 attested |
|---:|---:|---:|
| 3 | 18,424 | 5,984 |
| 5 | 1,906,884 | **278,256** |
| 7 | 85,900,584 | 5,379,616 |

> **The honest headline: 1 build over the nine axes, 278,256 five-slot builds over the
> attested lens pool.** Same product, same honesty rules, same content, zero new authoring
> — the difference is entirely which grain the inventory is defined at.

**Two honest deductions from that number, stated rather than buried:**

1. **A lens can be in your deck and never speak.** Q8 measured `outpost` — the feature the
   whole rung-0 argument rests on — firing on **2 of 515 positions**. Many of the 18 are
   phase-locked (`king_opposition` never fires in an opening). The effective deck at any
   given node is smaller than 34.
2. **Thirteen observations are unconditional** (12 piece counts + king distance, D78) —
   they fire in every position and carry no information. As deck items they are blanks, and
   a loadout design must exclude them or it is selling filler.

### 3d. Cost of evaluating a loadout

Free, and measured. R1 measured the **whole transition census at 29.06 µs/ply** over 593
spine transitions (`design/research/move-primitive-computability.md`) `[V]`. So arbitrary
conjunctions of the 49 lenses are computable at every ply with no budget pressure. **The
combinatorics are not compute-limited.** (The one outlier is the shipped-and-dead
`structuralDelta` at 1,721 µs/ply, 59× the whole census — a thing to not put in the deck.)

---

## 4. Synergy — authored, emergent, and which one this product can support

A build exists when items compose into more than their sum. Three concrete triples,
graded honestly.

### Triple 1 — authored, and shipped end to end today

- **Lens:** shape entry `carlsbad` (`content/shapes/carlsbad.json`)
- **Predicates:** `backward_pawn(black, file c)` ∧ `half_open_file(white, file c)` — 2 of
  the 18, and they are literally the `success.signature` of the shape's
  `white-minority-attack` plan
- **Opponent:** the QGD-Exchange spine of `content/drafts/carlsbad-minority-attack.json`
  (`human_common` @ 1800, `execute_break`)

The lens names what to aim for; the predicates certify arrival; the opponent's declared
line is the one that produces the structure. Holding the lens without the predicates gives
you a plan name and no confirmation; holding the predicates without the lens gives you two
facts and no plan. **This is `05` §5c's unification working — and it is authored: a human
wrote the join into `carlsbad.json`.**

### Triple 2 — emergent, no author wrote the join

- **Lens:** `passed_pawn` (structural kind 6; appears 98 times across shapes)
- **Predicates:** `king_opposition` ∧ `piece_distance`
- **Opponent:** `perfect_tablebase` in an `endgameReading` of type `pawn`
  (`endgame.ts:21-40`)

Nobody authored "opposition + passed pawn + tablebase". The composition is K+P technique,
and it arises because the *position* satisfies three independent predicates at once. The
tablebase's refusal to err is what makes the pair load-bearing rather than decorative.

### Triple 3 — emergent, and the one with a measurement behind it

- **Lens:** `move_irreversibility`, subkind `pawn_break`
- **Predicate:** pivotal kind `human_divergence` (rung 3, the Maia policy split)
- **Opponent:** `human_common` at a declared band

An irreversible pawn break *at a position where players at your band split three ways* is
close to the definition of a real decision — and neither detector knows the other exists.

**Why this triple matters more than the other two.** R3 measured single primitives at
**89.0% false positives at the observation level** and the shipped irreversibility marker
at **13.4% firing / 79.9% FP** (independently reproduced by Q8). The `human_divergence`
detector requires a genuine Maia split. **If two primitives fire near-independently at
rates p and q, their conjunction fires at ≈pq — the specificity multiplies while each
component stays rung-0/rung-3 honest.** That is the mechanism by which a *deck* beats a
*setting*: the value is in the intersection, which is exactly what a build is.

> **This is the load-bearing claim of §4 and it is `[M]`.** R3 measured single leaves and
> established that *selectivity does not predict usefulness* for them (ρ = −0.143). Nobody
> has measured a conjunction. The conjunction hypothesis is architecturally supported
> (§3d: 29.06 µs/ply, so any conjunction is free to compute) and **empirically unproven**.
> It is the natural R11, and it is cheap: the R3 harness
> (`tools/r3-census-hint-harness/`) already produces the per-leaf firings the pairwise
> analysis would run over.

### The verdict on synergy

**Both, and the split is clean.** Authored synergy is shipped today: the shape library's 96
real signatures are exactly plan→predicate joins a human wrote, and `projectAuthoredFeedback`
already gates them (`apps/server/src/authored-feedback.ts:251`). Emergent synergy is
**architecturally supported and unmeasured**: every lens is a deterministic predicate over
the same FEN, conjunctions cost nothing, and no author has to enumerate the pairs. This
product is unusually well-placed for emergent synergy compared with a card game, where
every interaction has to be designed — here the *position* does the joining.

The honest risk is the mirror of R3's finding: a conjunction can be rare **and** worthless.
Which is why the answer is a measurement, not an assumption.

---

## 5. Run-to-run variance, measured against the content we have

### 5a. The comparison, grounded

Slay the Spire: **3 acts × 17 floors = 51 nodes per run**, and **≈161 relics** in standard
play (4 starter + 32 common + 28 uncommon + 24 rare + 20 boss + 20 shop + 18 event + 2
special) `[P]` — https://slaythespire.wiki.gg/wiki/Map_Locations,
https://slaythespire.wiki.gg/wiki/Relics.

Tabiya today: **37 packs, 17 distinct encounter tuples, 25 shapes, 49 lenses (34
attested)**.

### 5b. The arithmetic, plainly

Take a modest run of **15 nodes** (a 3-act map at 5 nodes per act — well under Spire's 51):

- 15 of 37 packs consumes **40.5%** of the catalogue in one run.
- Two runs consume **81%**. **Three runs exhaust it** with 6 packs to spare.
- If the map is phase-shaped (opening act → middlegame act → endgame act), the acts draw
  from **20 / 1 / 14**. **Every run's middle act is `carlsbad-minority-attack`, every
  time.** A phase-shaped map is not merely thin in the middlegame; it is impossible there.
- A map node needs ≥2 candidates to offer the Spire's route choice. At 15 nodes × 2 that
  is 30 packs; phase-balanced, **10 per phase** — met for openings (20) and endgames (14),
  and short by **9** for the middlegame.

### 5c. What variance costs, in measured agent-minutes

Costs from `design/research/pack-authoring-cost.md` §4 (`[P]`, self-reported clocks,
arithmetic `[V]`): opening **28.8** min/pack, endgame Syzygy-grounded **40.6**, middlegame
(`plan`) **65.0** (n=1), trajectory **97.5**, corpus mean **43.5**. The whole existing
corpus cost **1,434 minutes = 23.9 agent-hours** for 33 instrumented packs.

| Target | Packs needed | Missing | Cost |
|---|---:|---:|---:|
| **One non-repeating phase-balanced 15-node run** (10/10/10) | 30 | 9 middlegame | 9 × 65.0 = **585 min = 9.75 h** |
| **Two-wide route choice at every node of a 15-node run** (as above) | 30 | 9 middlegame | **9.75 h** |
| **Spire parity**: 51 nodes × 2 candidates, phase-balanced (34/34/34) | 102 | 14 op / 33 mid / 20 end | 403 + 2,145 + 812 = **3,360 min = 56 h** |

**Two things fall out of that table.**

1. **A phase-balanced, non-repeating single run costs 9.75 agent-hours.** That is 41% of
   what the entire existing corpus cost, and it is a startlingly small number for the thing
   the owner is worried about.
2. **64% of the Spire-parity bill is middlegame**, which is also the phase R4+R9 proved has
   **no difficulty oracle of either kind** (`design/BACKLOG.md:273`) and the phase with the
   highest measured per-pack cost outside trajectories. The content bottleneck, the
   evidence bottleneck and the cost bottleneck are **the same phase**. That is not a
   coincidence to route around; it is the shape of the problem.

### 5d. But non-repetition is not variance

Fifteen distinct packs make a run *unrepeated*. They do not make it *feel different* — the
owner's actual words were *"some choices affecting your build."* That is the loadout, and
the loadout costs **zero authoring minutes**.

> **The multiplier, stated as arithmetic:** 37 packs × 1 build = 37 run-shapes.
> 37 packs × 278,256 five-slot builds over the attested lens pool = a number whose
> limiting factor is no longer the catalogue.
>
> Content adds runs **linearly at 28.8–65.0 minutes each**. The loadout grain multiplies
> whatever content exists **at zero marginal authoring cost**. Both are needed; only one
> of them is free.

---

## 6. Verdict

### Is there enough raw material for a roguelike today?

**By kind, and the answer differs sharply by kind.**

| Kind | Verdict | The number |
|---|---|---|
| **Perceptual** | **Yes, abundantly, and it is under-exposed** | 93 atoms · 49 nameable lenses · **34 attested** · 284 authored readable items behind the 25 shapes |
| **Economic** | **No. There is no economy at all** | 8 of 14 meterable operations unconditionally free · **7** lifetime milestone events · `SIMULATE_BUDGET_EXCEEDED` declared, never thrown · inventory lives in **localStorage** (`apps/web/src/lib/assistance-preference.ts:1-10`), so nothing can be *earned* |
| **Selective** | **Thin, and thin in a located way** | **17** distinct encounter tuples over 37 packs · **1** middlegame pack · 71% of Elo-bearing packs at 1800 · 0 packs using `strong_engine` or `practical_resistance` · `segment_end` never used |
| **Structural** (fork/rewind as reward) | **Free by construction; scarcity would have to be invented — except in one place** | fork/rewind have exactly one refusal (`MATCH_LIVE`); the `attempt_end` reveal window **already closes on the next committed move** and is the one shipped, thesis-compatible consumable |

### At what scale

**One act, ~15 nodes, non-repeating, is reachable today for 9.75 agent-hours of middlegame
authoring — and it can carry 278,256 distinct five-slot builds without a single new lens
or a single new pack, if the inventory grain moves one level down.**

**Three phase-shaped acts at Spire density is 56 agent-hours away, 64% of it middlegame,
in the phase where difficulty must be authored because no oracle exists.**

### The single highest-leverage addition

> **Per-lens loadout below the nine `AssistanceConfig` axes — an inventory defined over the
> 49 lenses (34 attested) rather than the 9 axes — with a slot budget justified by the
> measured noise floor.**

**Not** more content, **not** more lenses, **not** an economy. The reasoning, against each
alternative:

- **vs. more content.** Content is the *second* bottleneck and it is real (17 tuples, 1
  middlegame pack), but it adds runs linearly at 28.8–65.0 min each, and content without a
  build is a curriculum, not a roguelike. The owner's worry was specifically about
  *choices affecting your build*. The loadout multiplies content; content does not
  multiply the loadout.
- **vs. more lenses.** Forty-nine already exist and **15 of them are used by no authored
  content**. Adding vocabulary before exposing the vocabulary we have is the wrong order,
  and R3 already showed that more census leaves is not more value.
- **vs. an economy.** Gated by R6 and R7, which are explicitly post-session
  (`planning/campaign-research-queue.md`), and the only economy law we have (campaign law
  5, ρ = −0.143) forbids the intuitive pricing scheme. An economy over a loop nobody has
  played since 2026-08-12 is scaffolding.
- **The part not yet named — and it is why this beats the others.** A deck needs
  opportunity cost, and every proposal so far assumed it must be *invented* as artificial
  scarcity, which is exactly what collides with *"experimentation without cost"*
  (`00-thesis.md:76-79`). **It does not have to be invented. It is already measured.** Q8's
  D78 finding — median **58** observations per position, **13** unconditional, compare
  strip at **8.31 entries/ply** with lift **1.01×** — proves the all-on state is the
  *unreadable* state, not the best state. A slot budget is therefore the product refusing
  to print noise, not the product withholding a reward. **That single reframing turns a
  monotone lattice with 1 maximum into a lattice with 278,256 incomparable builds, costs
  zero authoring minutes, touches no honesty rule, prices nothing the thesis sells, and
  needs no new chess truth.**

Second-highest, and it should be said in the same breath because it is cheap: **9
middlegame packs, 9.75 agent-hours**, which is the minimum that makes a phase-shaped map
possible at all.

### What must land alongside it, from the counts above

1. **Server-held inventory.** `AssistanceConfig` lives in browser localStorage keyed by
   `RunSessionKind`. ADR-0007 makes it security-relevant that earned progression is not
   client-editable.
2. **A third input to `permittedAssistance`.** It takes `{sessionKind, deliveryOpen, role}`
   only, and `sessionKind` is dead in the body. Inventory must **intersect with**, never
   override, the policy result — honesty outer, inventory inner (`06` §3 law 1).
3. **Fix or delete `arrows`.** A knob that is typed, persisted, migrated and permissioned
   but renders nothing is the clearest possible example of a slot with no perception behind
   it, and it would be an unlockable that unlocks nothing.
4. **Exclude the 13 unconditional observations** from any lens pool. They fire everywhere
   and are blanks.
5. **Measure the conjunction hypothesis (§4) before pricing anything.** It is the claim the
   whole synergy argument rests on, it is `[M]` today, and the R3 harness already emits the
   data.

---

## 7. Open, and deliberately not answered here

- **R11 (proposed):** does a conjunction of two independent primitives beat either alone on
  R3's T/C/D gate? The one measurement that would convert §4 from `[M]` to `[V]`.
- **Does an unlock persist across campaign runs or reset each run?** Named as the single
  largest fork in the cluster (`planning/campaign-synthesis.md:665-670`) and still owner's.
- **R6/R7/R8** stand unchanged. Nothing here needs the loop to have been felt — every count
  is over artefacts — but the *tuning* of any budget does.

---

## Sources

Repo, at `8744adb`: `packages/runtime/src/{assistance,runtime,structure,transition,tempo,
pivotal,story,compare-strips,endgame,feedback,evidence-ref,branch-scale,voice}.ts`;
`packages/schema/src/drill-pack/types.ts`; `schemas/drill_pack.schema.json`;
`apps/server/src/{service,rest,tablebase,evidence-queue,corpus,capabilities,engine-band,
errors,storage,authored-feedback,external-voice}.ts`; `apps/web/src/lib/{DrillScreen.svelte,
AssistanceSettings.svelte,assistance-preference.ts}`; `content/drafts/*.json` (37),
`content/shapes/*.json` (25).

Dossiers: `pack-authoring-cost.md`, `feedback-versus-the-dashboard.md`,
`census-hint-false-positives.md`, `move-primitive-computability.md`,
`practical-difficulty-outside-tablebase.md`, `human-outcome-coverage-depth.md`,
`maia-band-calibrated-range.md`, `authored-transitions-and-features.md`,
`quickpass-wintrChess-encroissant-chessmonitor.md`.

Design: `00-thesis.md`, `05-in-run-experience.md`, `06-campaign.md`, `BACKLOG.md`,
`planning/campaign-synthesis.md`, `planning/campaign-research-queue.md`.

External `[P]`: [Slay the Spire — Map Locations](https://slaythespire.wiki.gg/wiki/Map_Locations),
[Slay the Spire — Relics](https://slaythespire.wiki.gg/wiki/Relics).
