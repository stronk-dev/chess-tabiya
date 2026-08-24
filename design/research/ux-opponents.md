# UX research — the opponent

**Date:** 2026-08-24
**Author:** claude
**Brief (owner, verbatim):** *"we need to go from a user perspective per feature… what do they
expect, what do competitors do, PROPER UX."* Two further owner asks are the specific subject of this
dossier, both verbatim:

> *"btw how do we even define our bots? are we smart here that we have a set of knobs that determine
> how it consumes evidence, opening/strategy/endgame/piece prefs, whatever… and then a bots/humans
> ELO is just based off of unguided matches?"*

> *"nice bots that play human / with personalities"*

**Why this dossier exists.** Six UX dossiers landed on 2026-08-24 covering arrival, the in-run
screen, the core loop, live/social, after-the-run and settings. **The opponent got a mention in all
six and a pass in none.** It is the one surface the thesis names in its own sentence — *"playing a
normal game against a human-like opponent while truly applying an opening/middlegame/endgame
strategy"* (`design/05-in-run-experience.md:536-538`) `[V]` — and the one with the largest gap
between what has been measured and what a learner can see.

**Its relationship to `ux-arrival-and-start.md`, stated before anything else.** That dossier's
**§4.5** is a thirteen-row competitor table on opponent selection and its **§6 "Feature D — choosing
an opponent"** is a complete pass on *choosing*, with four recommendations D1–D4, landed as
[[D1473]] `[V]`. **This dossier does not re-derive any of it and does not supersede it.** §1 below
inherits D1–D4 by citation and adds only what the arrival frame could not reach — the arrival frame
ends at the first move, and five of the six features here begin after it. The genuinely new material
is: the 1500 derivation (§0.2), the card itself (§2), the identity bar (§3), personality's three
registers and the provenance rule (§5), the bot's own miss as a surface (§6), the cross-session
relationship (§7), and a direct answer to the owner's two bot questions (§8). Where a finding is
inherited, it says so and cites §6.3's D-number.

**Scope.** How a learner **chooses** an opponent, **understands** one before playing it, **knows who
they are playing** during the game, **reads its behaviour** afterwards, and **forms a relationship**
with one across sessions. Bot identity, personas, strength labelling, and the honesty rules that
bound all four.

**Not in scope, with owners named** (per [[D1230]] — a deferral without a home is not a deferral):

| out of scope | home | owner |
|---|---|---|
| the composition grammar and its compiler | `rfc/bot-policy.md` (accepted, implementing) | claude / codex |
| which twelve profiles exist and their literals | `rfc/bot-roster.md` (draft) | claude |
| the proposing route-source layer and its lifecycle | `rfc/bot-route-source.md` (draft) | claude |
| the non-Maia, variant-portable base | `rfc/evidence-move-selector.md` (draft, [[D1271]]) | codex |
| learner rating arithmetic, voids, publication | `rfc/learner-rating.md` (implementing) | claude |
| the learner's own style cards | `rfc/player-style.md` (draft) | claude |
| clocks and time as a difficulty lever | `rfc/recorded-clocks.md`, `rfc/enforced-clocks.md` | claude |
| board layout and the in-run region grid | `rfc/play-composition.md` | codex |
| pack-declared resistance and authored spines | `rfc/pack-training-forms.md` | — |

**Evidence labels** per `design/research/README.md` §House rules. `[V]` — read at the symbol or run
in this pass against HEAD `f95aed8b`, or quoted from a cited primary source. `[P]` — source-backed
but partial, secondary, inherited desk research, or not reproduced hands-on. `[M]` — model knowledge
with no external evidence. One further glyph, borrowed from `rfc/bot-roster.md`: **⊕** marks a
*derivation* — arithmetic or a code path traced end-to-end from facts that are themselves `[V]`.
**Every competitor claim in this dossier is `[P]`** and says so per claim, because the whole corpus
it draws on is desk research: nothing in it was driven hands-on ([[D1458]]).

**Law 5.** This is a research dossier. `design/03-product-breadth.md` and
`design/05-in-run-experience.md` were consumed, not edited. Six places where a recommendation needs
intent to change are collected in §11 as owner decisions.

**Law 8.** This dossier's entire subject *is* the boundary law 8 draws. Nothing here creates chess
truth. §5 is a subtraction exercise — given what has been measured, what is the largest true thing a
bot card may say — and its central recommendation is a mechanism that makes an unmeasured claim
*fail to render* rather than a list of words to avoid.

---

## Verdict

1. **The product ships two opponents and describes neither.** `JustPlayStarter.svelte` offers the
   words *Human-common* and *Strong engine* `[V]`. There is no card, no name, no face, no strength,
   no explanation, and — measured this pass — **zero occurrences of `avatar` anywhere in
   `apps/web/src`** `[V]`.
2. **Just Play silently plays Maia at band 1500, which is not one of the four measured rungs, and
   nobody chose it.** The starter sends no `targetElo`; `appliedTargetElo` falls through to
   `profile.default`; the profile default is Maia's UCI spin default `1500`, which survives because
   it happens to sit inside the configured `[1000, 2400]` clamp. ⊕ from four `[V]` facts (§0.2).
   1500 is a UCI formality, not a product decision, and the learner is never told it.
3. **The better picker already exists and is filed under the wrong word — inherited, not new.**
   [[D1473]] and `ux-arrival-and-start.md` §6.3 D1 established this three days ago: `/rating`'s
   four-rung named picker (*first rung* / *steady* / *testing* / *top measured rung*) with its
   honest footer is the best start form in the app, behind a nav item called **"Record"** `[V]`.
   This dossier confirms it independently and carries it forward rather than re-deriving it.
4. **The catalog is empty, and that is not neglect — the measured bot cannot be expressed.**
   `BOT_POLICY_PROFILES = compileBotPolicyCatalog([])` `[V]` (`bot-policy-catalog.ts:299`). Twelve
   profiles are specified; eight are blocked because `searchBound` cannot express **depth** and four
   more because **nothing populates `candidate.traits`** ([[D1181]]).
5. **The answer to "what does an honest bot card say" is: describe the machinery in the second
   person, and name every absence.** Not an adjective — a consequence. *"Nothing checks its moves
   after it picks them, so the pieces it leaves hanging stay hanging"* is legal, specific, and
   already drafted (`rfc/bot-roster.md` §4) `[V]`. The refusals — *no opening book, no memory of
   your last game, its endgame behaviour has never been measured* — are the most personality-dense
   sentences available to us, because **no competitor prints them** `[P]`.
6. **What turns a rung into a someone is not the bio — it is a record.** O8.2 already licenses a
   third category the product has never built: **observed traits**, *"computed after games,
   descriptive only"* `[V]` (`rfc/bot-policy.md:161`). A sentence like *"Ora has taken the b2 pawn
   in both of your games"* is a fact about one opponent, carries no chess-truth claim, and is
   exactly what a biography pretends to be. **Every input it needs is already persisted.**
7. **The persona filter is a word list, and a law-8 violation needs no banned word.**
   `REFUSED_PERSONA_CLAIM` rejects eight adjectives in `name` and `bio` `[V]`
   (`bot-policy-catalog.ts:173`). A bio reading *"she likes to keep the position closed and grind"*
   passes the filter and is an unmeasured chess claim. The mechanism fix — every card sentence must
   name the layer or the measurement it restates, or it does not render — is this dossier's
   strongest recommendation (§5.3), and it is the same argument `rfc/player-style.md` §6 makes for
   the style lane `[V]`.
8. **The owner's knob frame is right and was already ruled**; five of its six knobs are unmeasured,
   refused on measurement, or measured-and-unshipped (§8.1). **The unguided-matches intuition is
   also right and already specified** — 12,400 engine-vs-engine games over 16 arms with three
   controls (`rfc/bot-roster.md` §6) `[V]` — but it produces a *band-relative* ladder ~480 Elo wide
   at full material, not an anchor to any human pool, and Gate 0 already abstained on a failed
   positive control ([[D1184]]) (§8.2).
9. **The one mechanism that would give a bot a visible opening identity passed all eight of its
   gates and appears in no shipped profile.** [[D1084]]'s generated route source completes 9/12
   branches against guarded Maia's 1/12, with zero pre-completion regressions `[V]`. Its
   learner-facing value is that a bot can honestly say *"it is heading for a specific structure"* —
   the exact clause a refused opening book cannot supply.

---

## 0. The measured baseline — every word the product says about an opponent

### 0.1 The complete inventory

Read at HEAD `f95aed8b` today. This is not a summary; it is the whole set.

| where | exact string a learner can see | source `[V]` |
|---|---|---|
| Just Play starter | label **Opponent**, options **Human-common** and **Strong engine** | `JustPlayStarter.svelte:17` |
| `/rating` picker | **Band 1000 · first rung** / **Band 1400 · steady** / **Band 1800 · testing** / **Band 2200 · top measured rung** | `RatingScreen.svelte` start-card `<select>` |
| `/rating` disclaimer | *"Band labels describe this calibrated Maia ladder. They are not FIDE, Lichess, or Chess.com ratings."* | `RatingScreen.svelte` `.honest` |
| `/rating` header | *"Results against the calibrated human-choice opponent ladder. This record never grades a move or changes what a coach says about it."* | `RatingScreen.svelte` header |
| `/rating` history | opponent column renders **`Band {opponentBand}`** | `RatingScreen.svelte` history table |
| `/rating` marks | *"Beat band 1400 on 12/03/2026"* — bronze / silver / gold pills for 1400 / 1800 / 2200 | `RatingScreen.svelte` `.marks` |
| in-run outcome strip | **`Requested resistance: human_common — the pack's request.`** — the raw internal identifier, rendered verbatim | `outcome-presentation.ts:112` |
| in-run outcome strip | *"Not perfect play."* / *"No opponent move has been played yet."* | `outcome-presentation.ts:120,124` |
| branch groups | *"Fixed resistance: within this group, the same position always receives the same reply."* / *"Varied resistance: each branch faces its own opponent draw."* | `GroupPanel.svelte:57-59` |
| evidence inspector | *"Maia recorded the requested Elo 1800 band as applied."* | `outcome-presentation.ts:96-101`, rendered at `DrillScreen.svelte:1150` |
| drill screen seed menu | option **Recorded human replies** | `DrillScreen.svelte:1060` |

That is eleven strings, and **four of them are unreachable in a normal Just Play session**:

- the two resistance sentences render only when `pack !== undefined` (`DrillScreen.svelte:979`)
  `[V]` — so a Just Play game, which has no pack, **never says anything about its opponent at all**;
- the applied-band sentence renders only inside the **Evidence inspector** modal, in the *Human move
  model* section, after the learner clicks **Load model candidates**, and only when
  `assistancePermission.humanSplit === "free"` (`DrillScreen.svelte:1147-1151`) `[V]`. In the silent
  default profile it is not merely hidden — it is behind an assistance permission the learner has
  not been given.

**So the applied band — the single number that describes the opponent's strength — is classified as
learner assistance.** That is a defensible engineering choice for a *drill* (knowing the band tells
you something about the position) and an indefensible product choice for *play*: in every other
chess product on earth, who you are playing is chrome, not a hint.

### 0.2 The 1500 derivation

Traced end-to-end this pass. Each step `[V]`; the conclusion ⊕.

1. `JustPlayStarter` emits `{ fen, side, mode }` and no band (`JustPlayStarter.svelte:4,15`).
2. `startPosition` builds `opponentPolicy: { mode: input.mode }` — `targetElo` absent
   (`session-controller.ts:289`).
3. `#maia` computes `const eloApplied = appliedTargetElo(health, request.policy.targetElo)`
   (`opponent-selector.ts:582`).
4. `appliedTargetElo` resolves `const applied = requested ?? profile.default` (`engine-band.ts:74`).
5. `engineBandProfile` sets `default` to the **advertised UCI spin default**, provided it lies
   inside the effective range (`engine-band.ts:46-50`).
6. The pinned Maia sidecar advertises `option name Elo type spin default 1500 min 0 max 5000` `[V]`
   (quoted at `design/research/maia-band-calibrated-range.md:8-9`, from
   `tools/r4-difficulty-harness/out/maia-availability.json:11`).
7. The configured clamp is `MAIA3_BAND_RANGE = { min: 1000, max: 2400 }` (`maia.ts:11`), so the
   effective range is `[1000, 2400]` and **1500 survives the containment test**.
8. `#maia` therefore emits `setoption name Elo value 1500` (`opponent-selector.ts:592-594`).

⊕ **Every Just Play game against *Human-common* is Maia at band 1500.** 1500 is not one of the four
pre-registered rungs (1000 / 1400 / 1800 / 2200) `[V]` (`rfc/bot-roster.md` §1), it is not a number
anybody in this repo chose, and it is invisible unless the learner opens an assistance modal.

Two further readings of the same code path, both worth stating because they are *good* news:

- The clamp comment in `maia.ts:8-10` is exemplary and should be the model for every card sentence
  in §5: *"R10 measured the widest interval whose policy trajectory remains ordered and whose listed
  mass remains readable. **This is a deployment bound, not a claim that Maia plays at a human rating
  inside the interval.**"* `[V]`
- `TARGET_ELO_REQUIRED` already exists as a `ServerError` for a band-calibrated engine that
  publishes **no** default (`engine-band.ts:76-80`) `[V]`. The mechanism for *refusing to guess a
  band* is shipped; it simply never fires, because Maia's UCI formality supplies a default the
  product then treats as a decision.

### 0.3 What the composition layer holds, and what a learner meets

| specified | shipped to a learner |
|---|---|
| a seven-layer composition grammar with a compiler, digests, and per-layer measurement gates (`rfc/bot-policy.md`, accepted) `[V]` | nothing — `composeBotPolicySelection` has **no production caller** `[V]` (`rfc/bot-route-source.md` Motivation) |
| twelve profiles, three families × four bands, with orthogonality proven by measurement (`rfc/bot-roster.md`) `[V]` | `BOT_POLICY_PROFILES = compileBotPolicyCatalog([])` `[V]` (`bot-policy-catalog.ts:299`) |
| a required `presentation` layer carrying `name` and `bio`, enforced at compile time `[V]` (`compileBotProfile` fails a profile lacking `human_policy_model`, `sampler` **or** `presentation`) | no bot has a name anywhere in the client `[V]` |
| twelve placeholder persona names — *pip, wren, ora, kestrel, bramble, junco, marlow, harrow, thatch, furrow, drover, colter* `[V]` (`rfc/bot-roster.md` §4) | none rendered |
| a proposing route-source layer that passed eight of eight gates `[V]` ([[D1084]]) | in no profile; O8.3 bars one until a multi-game demonstration exists `[V]` |

**The gap is not architecture. It is instances, and a surface.**

---

## 1. Choosing an opponent

### What the user expects

A serious improver arriving at a play screen has one of four intentions, and the picker's job is to
tell them apart:

1. **"Give me a normal game."** No opinion about the opponent; wants to start in one click and get a
   game that is neither a massacre nor a walkover. Expects the product to have chosen sensibly *and
   to say what it chose*.
2. **"Give me something I can beat, so I can practise converting."** Wants a rung *below* them
   deliberately. This is a legitimate training intention and every rung-based picker serves it.
3. **"Give me a wall."** Wants the top of the ladder to see what happens. Expects to lose and
   expects that to be interesting.
4. **"Give me *that one again*."** Has played an opponent before, formed an opinion about it, and
   wants the same one — either for a rematch or to hold resistance constant while trying a different
   plan. This is the intention the rewind-and-branch thesis needs most and the current product
   cannot express at all.

Underneath all four sits the expectation that **an opponent is a noun, not an adjective on a
slider**. People say *"I played Nelson"* and *"I lost to Maia 1900"* `[M]` — how players talk is
model knowledge here, and the specific bot name is illustration, not a corpus-backed chess.com fact
(§1 records that chess.com's named roster is **not** in this corpus). They do not say *"I played
difficulty 6"*. A named opponent is rematchable, recommendable, and complainable-about; a slider
position is none of those.

Two further expectations that this product specifically must meet:

- **The opponent is the control variable.** `design/03-product-breadth.md:146-157` states it as
  intent: *"The load-bearing question is the opponent, not the boards… resistance must be **held
  constant** across branches, or the learner is comparing four different opponents and learns
  nothing about their own move"* `[V]`. A learner comparing branches expects to see, in the picker
  or beside it, that they are facing the *same* opponent — which the group panel already says
  (`GroupPanel.svelte:57-59`) but the starter never does.
- **A pack may already have chosen.** When a drill declares its own resistance, the learner expects
  to be *told* rather than asked — and to be told that it was the author's choice, not theirs.
  `outcome-presentation.ts:112` already appends *"— the pack's request"* `[V]`, which is exactly
  right and is rendered in an internal identifier.

### What competitors do

Every claim `[P]`; the corpus is desk-only ([[D1458]]).

- **Chess.com and Lichess both ship a thin opponent-identity bar as the only chrome permitted beside
  the board.** `design/research/competitor-play-ux.md:32` records chess.com live as *"Opponent bar
  (avatar/name/clock) at most"*, and `:173` generalises: *"the only thing that ever sits there is a
  thin opponent-identity bar (chess.com, lichess mobile)"* `[V]/[P]` as the source itself labels it.
  The identity bar is the field's settled answer to *who am I playing*, and it survives even Zen
  Mode's de-cluttering `[P]` (`competitor-play-ux.md:56`).
- **⚠ Chess.com's bot-selection screen is NOT in this corpus, and the intuition that it is a grid of
  character cards is `[M]`.** This is the sharpest competitor finding of the pass and it is a
  negative one. Across both chess.com teardowns, `competitor-play-ux.md`, `competitor-matrix.csv` and
  the love/hate sweep there are **no named bots, no bot bios, no bot avatars, no displayed bot Elo
  labels and no description of the Play Bots picker grid**. `ux-arrival-and-start.md:387-390` already
  says so in terms: *"Nothing in the corpus describes Chessiverse's bot-selection screen… The
  intuition that 'a bot picker is obviously a grid of character cards' is `[M]` and is not evidenced
  here."* `[V]` What **is** evidenced about chess.com's opponents: Komodo became the platform's
  **"Computer1"–"Computer20"** `[V]` desk (`teardown-chesscom-platform-desk.md:125-128`); **Play
  Coach ships four coaches *"each with their own looks and voice"*** with a one-game-per-month free
  ceiling `[V]` desk (`:103-111`); the matrix records the species as unestablished — *"P adaptive AI
  (unspecified)"* and *"P bots"* `[V]` (`competitor-matrix.csv:40,12`); bot games are *"always
  unrated"* and carry a 3/2/1-crown assistance economy `[P]`; and *"Bot Chat personality messages"*
  are **authored scripts** `[V]` (`assistance-surface-taxonomy.md:126`). The practitioner map's
  chess.com column — *"Komodo Skill per bot"*, *"persona presets"*, *"per-bot books of varying
  quality"*, *"Adaptive"* bots, presentation *"avatars/celebrity"* `[P]`
  (`human-like-opponents.md:455-481`) — is the strongest characterisation available and it is a
  dimension map, not a screen description. **No recommendation in this dossier rests on chess.com's
  picker**, and a hands-on teardown of it is the first item in Residuals.
- **Chessiverse is the closest competitor to what this product is trying to build, and its own
  documentation says the personality is mostly discovered rather than controlled.** [[D591]]: *"It
  says it lets neural nets vary, measures thousands of generated games, assigns Guardian→Savage
  labels **after the fact**, and currently does very little to influence that playstyle"* `[P]`
  ([Chessiverse bot article](https://chessiverse.com/articles/how-chessiverse-bots-are-created)).
  Its genuinely controllable layers are narrow: *"candidate curation for suspicious moves, an extreme
  pawn-move heuristic, per-bot human-derived opening repertoires and statistical opening
  frequencies"* `[P]`.
- **Nobody has validated a bot's label against humans.** [[D819]] `[P]`: Stockfish's own PRs admit
  ±100 engine-pool slop, and **maia1 measures 1434–1666 against a target of 1100**. The whole field
  ships numbers on bot cards; none of them is a measured claim about human strength.
- **A named-rung picker is not exotic** — Lichess ships eight Stockfish levels and three Maia bot
  accounts (`maia1`/`maia5`/`maia9`) `[P]`; the corpus records the Maia band mechanism in detail but
  the *product surface* of those accounts is inherited desk research and was not driven hands-on.
- **The closest stack neighbour already ships a banded Maia picker with a stated pedagogy.**
  `design/research/teardown-chessmindai-desk.md` §2 verified ChessMind's marketing claim **against
  its shipped bundle** — a `localMaiaMove-*.js` chunk loading `maia2_rapid.onnx` with `elo_self` and
  `elo_oppo` conditioning tensors, moves **sampled from the policy rather than argmaxed** — and its
  FAQ offers *"six levels conditioned on human rating — roughly 1100, 1300, 1500, 1700, 1900 and
  2000+ Elo — **so there is always an opponent slightly above your own strength**"*. The dossier
  labels this `[V]` from a code read; as a competitor claim in *this* pass it is `[P]`, not
  reproduced. §7 calls it *"the closest stack neighbor in the entire matrix… our exact rating band."*
  Two lessons: the picker's job is to **recommend**, not merely to enumerate; and a six-rung ladder
  is a marketing decision, where our four rungs are the ones whose adjacent intervals are measured
  disjoint.

The transferable pattern, stated once and bounded by what is actually evidenced: **the field's
opponent picker leads with a number, and not one of those numbers has ever been validated against
humans by the party publishing it** `[V]` verdict, four `[V]` constituents
(`human-like-opponents.md:66-70`). 365Chess sells *"Level 1 (ELO ~1300)"* through *"Level 10 (ELO
~2700)"* `[P]`; ChessMind ships six Elo-labelled bands `[P]`; Chessigma offers *"Nine sparring
partners, each with a real repertoire"* and a *"Bot at your level"* whose species and calibration are
**undisclosed** `[P]` (`teardown-chessigma-desk.md:97,99,295-298`). We have the opposite problem —
**measured numbers we refuse to print, and no characters at all.**

### What we should do, and why it differs

**One picker, four rungs, three families, and the honest word at the top.**

1. **Promote `/rating`'s picker into `/play` and delete the two-word `<select>`.** The four named
   rungs are already the measured ladder, already carry a plain-language qualifier
   (*first rung* / *steady* / *testing* / *top measured rung*), and already ship the correct
   disclaimer. `JustPlayStarter`'s two words are a strictly worse form of the same control and
   should not survive.
2. **Never emit an unstated band.** The `TARGET_ELO_REQUIRED` refusal already exists; the fix is to
   stop treating a UCI spin default as a product decision. Either the picker always sends a rung, or
   the product picks one and **prints it**. Recommendation: default to **1400**, the rung the
   measured ladder puts at a score of 0.4990 against its own reference `[V]`
   (`rfc/bot-roster.md` §1), and say so. Once the learner has a published rating, **recommend a rung
   rather than merely enumerating four** — ChessMind's *"always an opponent slightly above your own
   strength"* is the field's pedagogy `[P]` and is one sentence of work. It must be a *suggestion
   beside the four*, never a hidden auto-selection: a silently chosen opponent is the same defect as
   §0.2's silent 1500.
3. **Show family and band as two controls, because they are orthogonal by measurement.** Band shifts
   346.8 Elo across four rungs; family shifts expected loss by **1.36 cp** (guard) and **1.01 cp**
   (trait) — two orders of magnitude below the ~60-Elo session-resolution floor `[V]`
   (`rfc/bot-roster.md` §2). That is a *user-facing* fact, not an implementation detail: it means
   **choosing a personality does not change how hard the game is**, which is precisely the promise a
   difficulty slider cannot make and the reason a roster is worth building.
4. **Make "again" a first-class control.** A learner who has played `ora` should meet a *Play again*
   affordance carrying the record (§7). Today the only cross-session opponent memory in the product
   is the `/rating` history table's `Band 1400` column `[V]`.
5. **Keep `strong_engine` and stop calling it an opponent.** It carries no band and no calibration —
   `policyUsesMaiaBand` correctly excludes it, so its games are recorded and **unrated** `[V]`
   (`rfc/learner-rating.md` §2). It is a *sparring wall*, not a rung, and the picker should place it
   outside the ladder with that stated. `design/01-training-model.md`'s doctrine and `CLAUDE.md`
   §Rejected both refuse weakened Stockfish as the *default* opponent; full-strength Stockfish as an
   explicitly-labelled wall is a different object and is not refused.

**Why this differs from the field.** The genre sorts by a number nobody validated; ours sorts by four
rungs whose adjacent 95% confidence intervals are disjoint over 1,020 games per rung `[V]`
(`rfc/bot-roster.md` §1). The competitive claim is not *more bots* — it is **the only ladder whose
rungs are measured to be distinguishable**, and the picker should say that in one line.

**The constraint this recommendation must clear, stated rather than stepped around.**
`design/00-thesis.md:136` lists **"a generic bot ladder"** under *What it is not* `[V]`. A four-rung
picker in `/play` is a bot ladder, so the recommendation has to earn its exemption or be refused.
Three things make it not the refused object, and all three must actually ship or the refusal
applies:

1. **The ladder is not the product; it is a control variable.** `design/03:146-157` makes resistance
   the thing held constant while the learner varies their own move `[V]`. A rung exists so branches
   are comparable, which is the opposite of a ladder you climb for its own sake.
2. **The rungs are measured, and the generic ones are refused with their numbers** — a 100-point
   grid buys 22.1–26.9 Elo, below the perception floor; band 2400 crosses parity at p = .21; and the
   five-to-nine-rung interpolation is refused **as a method** `[V]` (`rfc/bot-roster.md` §1). A
   product that refuses twenty rungs because it measured them is not shipping a generic ladder.
3. **The card is not a rung.** §2's three registers and §7's relationship half are what make the
   entry an opponent rather than a difficulty setting. **If only item 1 of §1's recommendations
   ships and §§2–7 do not, the result IS the refused object** — a nicer difficulty slider — and this
   dossier's recommendation should be read as failing rather than partially delivered.

That reading is mine and the thesis is intent tier, so §11.1 puts it to the owner rather than
settling it here.

### Cost and dependencies

| item | cost | blocked on |
|---|---|---|
| move the four-rung picker into `/play`, delete the two-word select | small — the component and handler exist (`RatingScreen.svelte` start-card, `App.svelte:390-403`) | nothing |
| always send a band; print it | small | nothing |
| family control | **blocked** — the catalog is empty; family A (4 profiles) is registrable today with zero blockers `[V]` (`rfc/bot-roster.md` §4, criterion 10) | `rfc/bot-roster.md` acceptance |
| all twelve families | blocked on obligations A and B ([[D1181]]) | `searchBound` depth widening; the candidate-classifier registry |
| "play again" | small once §7's record exists | §7 |

---

## 2. Understanding an opponent before you play it — the bot card

### What the user expects

A card is a promise, and a learner reads one to answer four questions in this order:

1. **Will this be a good game for me?** Strength, in a unit they can convert to their own
   experience.
2. **What is it going to do to me?** Not adjectives — *behaviour*. "It will punish a loose piece",
   "it will not know the theory", "it will hang things in complications".
3. **What will I get out of losing?** A card that implies the loss will be *legible* is worth far
   more than one that implies the loss will be *severe*.
4. **Is this thing pretending?** Improvers at 1400–2000 are unusually alert to fake difficulty. They
   have all met a "1200 bot" that plays four perfect moves and then hangs a queen, and they read it
   correctly as a random-noise dial. A card that survives their scepticism is one that **volunteers
   its own limits**.

The fourth is where the entire competitive opportunity sits, and it is the reason a refusal reads as
personality rather than as an apology. *"No opening book — it will not know your Najdorf; it plays
what club players at this rung actually play"* is more informative, more distinctive, and more
trust-building than any adjective, and **no competitor prints a sentence like it** `[P]`.

What a learner does **not** expect, and will punish: a number without a scale, a bio whose claims the
game does not deliver, and a personality name attached to play that feels identical to the rung above
it.

### What competitors do

- **Presentation is the field's differentiator and its weakest link.** The practitioner map's
  Presentation row: Komodo/Dragon — nothing; Chessmaster — *biographies*; Chessiverse —
  *biographies/chat*; chess.com bots — *avatars/celebrity* `[P]`
  (`design/research/human-like-opponents.md:481`). Nobody in the row ties the biography to a measured
  behaviour, and the dossier's own conclusion is the sentence this dossier adopts: **R11's rule,
  *"the model or policy must earn the chess behavior before the avatar names it"*** `[V]`.
- **Chessiverse's public personality page contradicts itself inside one document.** [[D597]]/[[D625]]
  `[P]`: the FAQ says the personality test is a 3–5 minute preference quiz and *explicitly not* based
  on actual playing style; later the same page says it imports up to 100 games, computes 51
  metrics across eight dimensions and matches 30+ archetypes
  ([Chessiverse personality page](https://chessiverse.com/chess-personality)). User feedback finds
  the result fun but jokes that a frequent blunderer was matched to Carlsen `[P]`.
- **Vendors disagree by at least 4× on how much play a stable style profile needs** — Chessiverse
  says 12 games as a floor and *"ideally 50+"*; ChessBase reports 100–200-game Style Reports
  fluctuating significantly, with a natural curve only above 200. **Neither publishes a reproducible
  stability curve** `[P]` ([[D598]]).
- **The perceptual asymmetry — the best single piece of evidence for expectation 4, and it is the
  vendor's own.** [[D592]] `[P]` (`design/research/bot-policy.md:56-61`, same Chessiverse article):
  *"users may call a bot's one-move piece drop **inhuman** even when similarly rated people make
  large errors. Its stated response is to prefer errors **with a mitigating tactical
  circumstance**."* The dossier is careful that this is vendor experience, not a validated
  threshold — but it *"demonstrates why population frequency plus centipawn loss cannot complete a
  human-likeness claim."* **Learners judge where the error sits, not how often it happens.**
- **What bot users actually say, in one sentence** `[P]` Reddit
  (`competitor-love-hate-sweep.md:56-58`): they value *"distinct styles, chosen openings, variety and
  a low-stress alternative to human play"*; they report *"implausible strength, one-move blunders,
  generic/overwritten chat, **weaker middlegame/endgame identity** and accessibility/layout
  defects."* Read as a card brief: **the loved half is exactly what a card promises, and the hated
  half is exactly what a card over-promises.**
- **The one thing every competitor's card gets right:** it is a *card*. A face, a name, a one-line
  handle, a number, and a button. The form is settled and we should not reinvent it `[P]`.

### What we should do, and why it differs

**The honest bot card, answered directly.**

The constraint set is exact. A card may not use *human-like, aggressive, solid, tactical,
positional, tricky, adaptive*, or *plays like* — enforced at compile time against `name` and `bio`
`[V]` (`bot-policy-catalog.ts:173`). It may not state a strength number without a calibration record
for that exact digest `[V]` ([[D819]], `rfc/bot-roster.md` §7). It may not claim human-likeness at
all: H5 is **untested**, *"zero human judgements exist"*, and the 42-branch blind packet is an
owner-use instrument that *"cannot establish the population claim"* `[V]`
(`planning/exploration/gates.md` §H5).

Within that, there are **three legal registers**, and together they are more than enough.

**Register 1 — mechanism, stated as consequence.** Every clause restates a declared layer, in the
second person of the learner's experience. `rfc/bot-roster.md` §4 already drafted these and they are
the best sentences in the repo `[V]`:

> *It plays the moves the largest number of players at that rung play, and nothing checks those moves
> afterwards — so the pieces it leaves hanging stay hanging.*

> *Before it draws, a depth-8 Stockfish search prices every move it was considering and removes
> anything 250 centipawns or more behind its own best candidate: the club moves stay, the one-move
> disasters go.*

> *It reaches for a pawn about twelve moves in a hundred more often than the guarded bot at the same
> rung, and nothing else about how it chooses has changed.*

Read them as a user: the first is a *someone*. It has a flaw you can name and exploit. The second is
a different someone with a different flaw. Neither uses an adjective and neither is a chess-truth
claim — each is a restatement of a declared layer, which is what makes it both legal and specific.
**The mechanism sentence is the personality.**

**Register 2 — a measured rate with its denominator.** Legal only for a trait that cleared the
controlled-trait gate. Exactly one ever has: `pawn_move` ×4, `traitDeltaFraction` **0.1228**, loss
shift **−1.01 cp**, severe-mass rise **0**, explorer retention **0.988** `[V]`
(`rfc/bot-roster.md` §5.1). The card may print *"about twelve pawn moves in a hundred more than the
same profile without the trait"* and may print nothing else in this register.

**Register 3 — declared absence.** This is where the character lives, and it is free:

| card row | sentence | basis |
|---|---|---|
| opening book | *"No opening book. It plays what club players at this rung actually play, which is not always theory."* | refused on measurement — **79.2%** fallthrough on both an authored spine and a frozen 2,519,503-game statistical book against a 25% ceiling `[V]` ([[D621]], `rfc/bot-roster.md` §3.1) |
| memory | *"It does not remember your last game."* | `assertLayer` fails any `memory` layer `[V]` (`bot-policy-catalog.ts`, `memory` branch); O8.3 |
| endgames | *"How this one behaves in an endgame has never been measured."* | the R11 population stops at ply 20; zero endgame cells `[V]` (`rfc/bot-roster.md` §8) |
| band attenuation | *"Below about ten pieces the rung stops meaning much: it buys roughly 0.07 Elo per band point instead of 0.40."* | −468.9 Elo at ≥21 pieces, −145.5 at 11–20, **−72.4** at ≤10 `[V]` (`rfc/bot-roster.md` §7) |
| strength | *"Not calibrated yet. We have not run the games that would let us put a number here."* | [[D819]]; §7's `uncalibrated` row `[V]` |
| information advantage | *"The safety check uses a real engine. That is an advantage over a human at this rung, and it is why it does not hang pieces in one move."* | R11: a bounded Stockfish error guard is an **explicit information advantage** and a hidden guard is refused `[V]` (`rfc/bot-policy.md:186-188`) |

**The shape of the card**, then — three zones, and the third is the one nobody ships:

```
┌──────────────────────────────────────────────────────────┐
│  [face]   WREN                                            │  ← identity: name + art, zero claims
│           Human-policy band 1400 · guarded                │  ← rung, in the honest unit
├──────────────────────────────────────────────────────────┤
│  What it does                                             │  ← register 1: one mechanism sentence
│  Before it moves, a depth-8 engine search removes any     │
│  candidate 250 centipawns behind its own best. The club   │
│  moves stay; the one-move disasters go.                   │
│                                                           │
│  What it doesn't                                          │  ← register 3: the refusals, as a list
│  · No opening book · No memory of your games              │
│  · Endgame behaviour unmeasured · Strength uncalibrated   │
├──────────────────────────────────────────────────────────┤
│  You and Wren                                             │  ← the relationship half (§7) — unbuilt
│  4 games · 1 win, 3 losses · last played Tuesday          │
│  Wren has taken the b2 pawn in 2 of your 4 games.         │  ← observed trait, O8.2-licensed
└──────────────────────────────────────────────────────────┘
```

**Why this differs from the field.** The genre's card leads with a rating nobody validated `[V]`
verdict, and Chessiverse's leads with a style label its own documentation says is *"classified after
generation"* — *"we do very little to influence it. Instead, we measure the output"* `[P]`
([[D591]]). **Ours says less about what kind of player it is and far more about what it will do to
you** — and the sentence that makes it trustworthy, *"we have not measured this"*, is one no
competitor is willing to write.

### The line, stated in one sentence

> **A bot card may describe the machinery and its absences in the language of what the learner will
> experience; it may not describe the bot as a kind of chess player. What makes it a someone is not
> an adjective — it is a specific flaw, a specific refusal, and a record of what it has done to you.**

### Cost and dependencies

| item | cost | blocked on |
|---|---|---|
| card component + register-1/3 content for family A | small — the sentences are drafted (`rfc/bot-roster.md` §4, §7) | `rfc/bot-roster.md` acceptance; family A needs no obligation `[V]` |
| register 2 (trait rate) | small | obligation B — nothing populates `candidate.traits` `[V]` ([[D1181]]) |
| the relationship zone | medium | §7; nothing external |
| calibrated strength row | **~4–5 h of machine time and a preregistration** | [[D1184]] — Gate 0 abstained on a failed positive control `[V]` |

---

## 3. Knowing who you are playing, while you play

### What the user expects

The identity bar. It is the single most settled convention in online chess: a strip above the board
with the opponent's face, name and clock, and a matching strip below with yours. It answers *who,
how strong, how much time* without a click, and it persists — it is the last thing stripped by Zen
modes `[P]` (`competitor-play-ux.md:56`).

Its function is not decoration. It is **the thing that makes a game feel like a game against
somebody** rather than an exercise. Remove it and the same moves feel like a puzzle.

A learner also expects the bar to tell them when the opponent *changes*. This product can change the
opponent mid-run — `flipRun(runId, nodeId, resistance)` takes a resistance argument `[V]`
(`api.ts:1025`) — and a silent substitution of the thing you are playing against is the class of
defect `design/research/ux-settings-and-identity.md` §4 already names in the settings lane.

### What competitors do

- Both incumbents ship the bar and nothing else in that region: *"the only thing that ever sits
  there is a thin opponent-identity bar (chess.com, lichess mobile)"* `[P]`
  (`competitor-play-ux.md:173`).
- Chess.com's desktop layout places opponent identity in the right column stack and offers a setting
  to move player info above/below the board `[P]` (`competitor-play-ux.md:32,47-48`).
- Mobile collapses to a vertical stack with *"the thin opponent identity bar above the board"* `[P]`
  (`competitor-play-ux.md:51-52`).

### What we should do, and why it differs

1. **Ship the identity bar.** Name, art, rung, and — this is the differentiator — **one word of
   family** (`guarded`, `unguarded`, `pawn-forward`). Zero occurrences of `avatar` exist in the
   client today `[V]`; this is greenfield.
2. **Move the applied band out of the assistance modal.** Who you are playing is not a hint. This is
   a genuine intent question because `design/05`'s assistance ladder governs what may be shown when,
   and the band currently sits inside `humanSplit` — an evidence layer. **§11 owner decision 2.**
3. **Replace the raw identifier.** `Requested resistance: human_common` should never reach a screen.
   The sentence the learner needs is *"Wren is answering — band 1400, guarded — because this pack
   asked for it"*, and the *"— the pack's request"* clause already in the code
   (`outcome-presentation.ts:112`) is the right idea in the wrong vocabulary.
4. **Render the resistance sentences in Just Play.** They are gated on `pack !== undefined`
   (`DrillScreen.svelte:979`) `[V]`, which is exactly backwards: the pack-less game is the one with
   no author to explain it. `design/05` §5a makes precisely this argument for pivotal moments —
   *"A curated pack declares its checkpoints. Just Play has no author, so the moments must be
   detected"* `[V]` — and the same reasoning applies to the opponent.
5. **Announce a mid-run opponent change in the bar.** When `flipRun` changes resistance, the bar
   changes and says so once.

### Cost and dependencies

Small, and none of it is blocked. The bar is a new component in a region
`rfc/play-composition.md` owns; the band is already persisted on
`opponentSelection.engine.eloApplied` `[V]` (`outcome-presentation.ts:96-101` reads it), so no schema
work is implied. Item 2 needs an owner ruling before it can land.

---

## 4. Strength — what the number means, and what it may not say

### What the user expects

A learner expects a bot's number to be **their** number: the same scale as their online rapid rating.
That expectation is universal, it is what every competitor's card exploits, and **we cannot meet
it.**

They also expect *monotonicity they can feel* — rung 3 should be visibly harder than rung 2 — and
they expect the number to mean the same thing in every position.

### What competitors do

- **Everybody prints a human-scale number and nobody has validated one** `[P]` ([[D819]]):
  Stockfish's own PRs admit ±100 engine-pool slop; **maia1's published label is 1100 and it measures
  1434–1666**.
- Chess.com bots carry per-bot Komodo Skill settings `[P]`; Lichess ships eight Stockfish levels
  `[P]`; Chessiverse applies *"Elo tricks"* over rigid Maia `[P]` ([[D551]], owner's own reading:
  *"they apply tricks to add behaviours or make higher/lower Elo and unique opening books"*).
- ChessMind prints six Maia-2 bands as round human Elo numbers — *"roughly 1100, 1300, 1500, 1700,
  1900 and 2000+ Elo"* `[P]` (`teardown-chessmindai-desk.md` §2) — with no interval, no calibration
  citation, and rungs 200 points apart. Our own measurement says a **100-point step buys 22.1–26.9
  Elo**, below the ~60-Elo session-resolution floor `[V]`, so a 200-point step is close to the edge
  of perceptibility. Their ladder is smoother-looking and less distinguishable; ours is coarser and
  measured.
- **One competitor did close the human loop, and its method is the one we would have to copy.**
  Chessiverse ran a dense bot-vs-bot ladder for *relative* strength, then **deployed four calibration
  bots on Lichess (833 / 1057 / 1454 / 2009)** to earn real ratings against humans, scaled everything
  else to them, and **recalibrated three times**; self-reported-rating feedback was *tried and
  dropped* `[P]` (`human-like-opponents.md:306-310`,
  [how-chessiverse-ratings-work](https://chessiverse.com/articles/how-chessiverse-ratings-work)). The
  only other closer is **Allie** — online evaluation against 1000–2600 humans, 49 Elo mean skill gap
  `[P]`. *"That is the entire list found in this pass."* This matters for §8.2: the anchor problem
  has exactly one known solution in the field, and it is **anchor accounts on a public server**, not
  arithmetic.
- The field's number is therefore a **product affordance dressed as a measurement**.

### What we should do, and why it differs

**Print the rung, print the compression, and refuse the anchor until it is measured.**

Four facts a learner must be able to reach, all measured:

| fact | value | source |
|---|---|---|
| the whole ladder's width at full material | **479.8 Elo** [454.9, 504.7], band 1000 → 2200 | `[V]` `rfc/learner-rating.md` §2 |
| adjacent rung gaps | 141.6 / 93.4 / 112.5 Elo — all above the ~60-Elo session-resolution floor | `[V]` `rfc/bot-roster.md` §1 |
| what a 100-point step buys | **22.1** and **26.9** Elo — *below* the floor, which is why the ladder has four rungs and not twenty | `[V]` `rfc/bot-roster.md` §1 |
| where the dial stops working | ≤10 pieces: **−72.4** Elo for the whole 1000→2400 span, ~0.07 Elo per band point | `[V]` `rfc/bot-roster.md` §7 |

The last row is the one with real UX consequence and no surface today: **in a reduced endgame, the
rung you chose has almost stopped applying.** `rfc/learner-rating.md` §5.1 already makes this a hard
precondition on the *rating* side — at ≤10 pieces *"the opponent's rating is unidentified"*, so the
update is *"not weak there, it is **undefined**"* `[V]`. A learner grinding a rook ending against
"band 2200" is not facing 2200-strength resistance and should be told, once, in the endgame.

Three concrete recommendations:

1. **Keep `/rating`'s disclaimer verbatim and put it on every opponent surface.** *"Band labels
   describe this calibrated Maia ladder. They are not FIDE, Lichess, or Chess.com ratings."* `[V]` It
   is already the best honest sentence in the client.
2. **Never render `targetElo` as a strength.** [[D344]] already forbids `targetElo` feeding a rating
   update `[V]`; the display rule is the same rule. `outcome-presentation.ts:96-101`'s sentence
   *"Maia recorded the requested Elo 1800 band as applied"* is a **provenance** statement and reads
   as a strength claim to anyone who is not an engineer. Reword to the band vocabulary O8.4 requires:
   *"present the selector as a **human-policy band**, not 'this bot is 1800'"* `[V]`.
3. **When the calibration ladder runs, publish the band-relative figure with its interval and its
   date, and nothing else** `[V]` (`rfc/bot-roster.md` §7). An absolute human-scale Elo stays refused
   until Discharge D5 is ruled — **§11 owner decision 4.**

**Why this differs.** Every competitor answers *how strong is this bot* with a number. We answer it
with a **rung, an interval, and a stated region where the rung stops applying** — which is worse
marketing and the only version that survives a 1600's scepticism.

### Cost and dependencies

Rewording is free. The endgame-attenuation notice is small and depends on a material count already
available. The calibrated number is ~4–5 h of machine time on the D333 host **and** a new
preregistration, because [[D1184]] bars reusing Gate 0's statistic and population `[V]`.

---

## 5. Personality — what may honestly be claimed

### What the user expects

*"Nice bots that play human / with personalities"* is the owner's ask and it is also the learner's.
Decomposed from the user's side, a personality is four things:

1. **A name and a face.** Free. Carries no chess claim.
2. **A predictable tendency** — something it does that another bot doesn't, that you notice within a
   game, and that you can plan against.
3. **A flaw.** The most memorable bots are memorable for what they get wrong. *"It hangs
   everything"* is a personality; *"it is 1300"* is not. `[M]`
4. **Consistency across games.** If it is a someone, it is the same someone next Tuesday.

Note what is *not* on that list: an adjective. Nobody experiences "aggressive"; they experience being
attacked twice in a row and forming the word themselves. **The adjective is the learner's output,
not the product's input** — and that reframing is what makes the eight-word refusal survivable.

### What competitors do

- **Chessiverse's own construction article is the cautionary tale.** [[D591]] `[P]`: it *"lets neural
  nets vary, measures thousands of generated games, assigns Guardian→Savage labels after the fact,
  and currently does very little to influence that playstyle."* Its personalities are **observed**,
  labelled as **controlled**, and sold as **presentation**. `design/research/human-like-opponents.md`
  names this exactly: *"the honesty line every vendor blurs"* `[V]`.
- The one strong practitioner pattern worth importing is **gimmick curation** — Chessiverse's
  extreme pawn-move heuristic `[P]` — which is precisely the shape our own `pawn_move` ×4 trait
  takes, and the only one of ours that passed a gate.
- **Chess.com's "Adaptive" bots** adjust strength in-game `[P]`; Komodo's Auto Skill drifts strength
  during a game `[V]` within `human-like-opponents.md`'s labelling. O8.3 rules our equivalent out:
  cross-game memory is *"opt-in, exportable/deletable learner data… **never a hidden difficulty
  adjustment**"* `[V]`. That refusal is a product position worth stating on the card, not an
  omission to hide.

### What we should do, and why it differs

**5.1 Use O8.2's three categories as three visually distinct zones, because they carry three
different proof obligations.**

| category | definition (O8.2, verbatim) | proof needed | where it renders |
|---|---|---|---|
| **controlled trait** | *"policy intentionally changes and measurement confirms"* | the controlled-trait gate — `traitDeltaFraction ∈ [0.1, 1]`, `|lossShift| ≤ 35 cp`, `severeMassRise ≤ 0.01`, `explorerMatchRetention ≥ 0.9` `[V]` (`bot-policy-catalog.ts`) | the card's *What it does*, with the rate |
| **observed trait** | *"computed after games, descriptive only"* | a denominator and a sample count; **no gate** — it claims nothing about the policy | the card's *You and X* zone, and the post-game screen |
| **presentation** | *"voice/avatar/story, no chess-policy claim"* | none — and none permitted | the name and the art |

The learner-visible payoff: **the same word may be legal in one zone and illegal in another.**
"Grabby" is refused as a controlled trait (no gate passed) and legal as an observed trait if the card
says *"in your 4 games, it captured on b2 3 times out of 3 opportunities"*. That is not a loophole —
it is the difference between a promise and a report, and it is exactly the distinction
`human-like-opponents.md` says every vendor blurs `[V]`.

**A name is free under law 8 and is NOT perceptually neutral, and our own instrument design says
so.** The shipped docs state the legal half plainly: *"It keeps move policy separate from
presentation: **a name, avatar, or bio cannot change a move.**"* `[V]` (`docs/bot-policy.md:5`). But
the blind-review protocol's step 3 is *"show reviewers board replay only, **never bot name, avatar,
chat or policy label**"* `[V]` (`design/research/bot-policy.md:205-218`) — the repo's own instrument
treats the presentation layer as a **contaminant of perception**. Both are true, and the combination
is the design rule: a name cannot change what the bot plays, and it will absolutely change what a
learner believes it played. That is an argument for naming carefully rather than blandly, and it is
a second reason the card's claims must be layer-grounded (§5.3) — the name is doing perceptual work
no measurement checks.

**5.2 Build observed traits. They are licensed, unbuilt, and they are the answer to "personality".**

Measured this pass: `observedTrait` appears **nowhere in `apps/` or `packages/`** — the only
occurrences of the identifier repo-wide are one line in `design/research/human-like-opponents.md`
and one in `design/research/bot-policy.md`, beside O8.2's prose at `rfc/bot-policy.md:161` `[V]`.
Meanwhile every input exists: the run persists each opponent selection with its engine identity and
applied band, and `candidateFeatureVector` (`apps/server/src/candidate-evidence.ts:187`, [[D813]])
already features candidates with declared detector ids `[V]`.

An observed-trait sentence is the cheapest personality in the product and the only one that scales
with the relationship. **Its law-8 safety is structural**: it describes moves the bot played, over
opportunities the bot had, in games the learner played. It grades nobody. It asserts no strategic
claim. It is the [[D345]] exposure-restatement pattern applied to the opponent instead of the
content.

**5.3 Replace the word filter with a provenance rule. This is the strongest recommendation in this
dossier.**

`REFUSED_PERSONA_CLAIM` is a regex over eight words `[V]`. It is necessary and **not sufficient**,
for two reasons that both bite:

- **False negatives.** *"She likes to keep the position closed and grind"* contains none of the eight
  words and is an unmeasured chess claim. `rfc/player-style.md` §6 makes the identical argument for
  the style lane — *"a law-8 violation in this lane need not contain a single banned word: it can
  live in the tier rule, where `voiceCheck` — which inspects sentences — cannot see it"* `[V]` — and
  builds a second enforcement point for exactly that reason. The bot lane has one enforcement point
  and needs the second.
- **False positives.** A bot named *Solid* or a bio using *adaptive* in a non-chess sense fails
  compilation. That is the right default, but it means the filter is doing vocabulary policing rather
  than claim checking.

**The mechanism fix, in one rule:** *every sentence rendered on a bot card carries the id of the
layer or the measurement it restates, and a sentence with no id does not render.* This is not new
machinery — it is the pattern the guard already uses, where `disclosure` **must embed each declared
literal verbatim or compilation fails** `[V]` (`bot-policy-catalog.ts`, `error_guard` branch), and
which `rfc/bot-roster.md` criterion 7 makes failable: *"a guard whose disclosure omits `depth`, `8`
or `250` fails compilation. Fails: a generic 'plays carefully' string"* `[V]`. Generalising that from
the guard's disclosure to the whole card converts law 8 from a review obligation into a compile
error, which is what "fix the mechanism" means here.

**5.4 The route source is the personality nobody has connected to the surface.**

[[D1084]] passed all eight preregistered gates: 9/12 branches completing the target against guarded
Maia's 1/12, 31 progress + 10 preserving selections, **zero pre-completion regressions**, 55 guard
refusals, worst admitted loss 234 cp, and pre-completion fallthrough of **6/72 = 8.3%** against a 25%
ceiling `[V]` (`rfc/bot-route-source.md` §0).

From the user's side that is the difference between *"it plays common club moves"* and *"it is trying
to get its bishop to g2 and its knight to f3, and it will keep trying"*. **A bot heading somewhere is
a bot with intentions**, and intentions are what a learner reads as personality. It is also the only
route to the thesis clause *"truly applying an opening"* that survives measurement, since the
repertoire arm was refused at 79.2% fallthrough `[V]`.

The card sentence it licenses — and this needs care — is about the **mechanism**, not the character:
*"It is playing toward a named setup and will keep choosing moves that get closer to it; when it
gets there, or when the safety check refuses every route move, it goes back to playing common
moves."* Its own dossier's verdict bars anything more: *"This passes the mechanism boundary and
nothing above it… It does not establish that this one three-square target is coherent, human-like,
enjoyable or a personality"* `[V]`.

O8.3 currently bars any shipped profile carrying a route, and the RFC puts the lifting question to
the owner rather than answering it `[V]` (`rfc/bot-route-source.md` §10, Open question 1). **§11 owner
decision 3.**

**5.5 Two personality shapes that are already refused, so nobody re-proposes them.**

| shape | why refused |
|---|---|
| temperature / top-p as a personality dial | **it is a strength dial**: T = 5.0 scored 0.9368 → **+468.3 Elo** [417.9, 536.0] — larger than the entire band range `[V]` (`rfc/bot-roster.md` §5.4) |
| "thinks for a while on hard moves" | `assertLayer` fails any layer declaring `effect: "delay"` `[V]`; [[D820]] defers timing rather than faking it, and *"do not fake it with random delays, which is the uniform-noise mistake in the time domain"* `[V]` |

### Cost and dependencies

| item | cost | blocked on |
|---|---|---|
| three-zone card layout | small | nothing |
| observed traits (first three: capture rate on a named square, castling ply, pawn-move rate) | **medium** — new post-game computation over persisted selections, no new persistence | nothing external; needs a home RFC |
| provenance rule on card sentences | small–medium — extends an existing compile-time pattern | `rfc/bot-roster.md` / `rfc/bot-policy.md` amendment |
| controlled traits beyond `pawn_move` | blocked | obligation B, and the trait screen (Discharge D3) |
| route-source personality | blocked | O8.3 lift (owner), Discharge D1 multi-game demonstration, Discharge D3 route catalogue |

---

## 6. Losing to a bot — what its behaviour is allowed to teach

### What the user expects

The reason to play a bot rather than a human is that the loss should be **legible**. A learner who
loses expects to leave with one of three things: *what I missed*, *what it saw that I didn't*, or
*what it does that I keep walking into*. Anything less and the game was entertainment.

They also expect the opponent's *mistakes* to be informative. Losing to a bot that blundered and then
crushed you teaches nothing and is the single most common complaint against weakened engines `[P]` —
and it is precisely what [[D811]] diagnoses mechanically: *"weakened engines sample eval-noise
uniformly, which reads as drunk, not weak"* `[V]`.

### What competitors do

- **Chess.com's Game Review is the field's answer and it is a funnel, not a lesson** `[P]`: during
  play, nothing; after, a game-over modal leading into Game Review, which *"walks mistakes one at a
  time"* `[P]` (`competitor-play-ux.md:32,63`).
- **No competitor explains the bot's own move.** `human-like-opponents.md` records this as a
  **checked absence**: nobody in the field generates *"post-hoc causal explanations of an engineered
  miss"*; Chessiverse's *"mitigating tactical circumstance"* preference is the nearest practice and
  is *"hand-tuned vendor instinct"* `[P]`. The dossier's own conclusion: *"The differentiator
  survives contact with the field"* `[V]`.

### What we should do, and why it differs

**The differentiator, in the owner's own words** ([[D810]]) `[V]`: *"the bot consumes DECLARED
evidence, so its choice — and its miss — is explainable after the fact. 'It missed your fork because
the knight had just moved' is simultaneously an opponent behaviour and a lesson."*

Three things follow, in strict order of what is legal today:

1. **Ship the bot's own decision record as a surface.** The composition already produces
   `BotPolicyDecisionRecord` with per-candidate mass, guard loss and features `[V]`
   (`bot-policy-catalog.ts:141-165`). Rendering *"it considered your fork square at 3% and the guard
   did not refuse the move it played"* is a **dashboard of the bot's own decision**, which
   `human-like-opponents.md` explicitly places on the legal side of the ADR-0005 line: *"the selector
   consumes evidence to choose the bot's move; nothing in it grades the learner"* `[V]`. **This is
   the one place in the product where a dashboard is not the anti-pattern**, because its subject is
   the machine.
2. **The record is not persisted yet.** `OpponentSelection` carries `moveUci`, `policyModeApplied`,
   `orderingBasis`, `candidates`, `engine` and nothing else; the persisted schema has **no `policy`
   member at all** `[V]` ([[D822]], `rfc/bot-route-source.md` `tabiya-claims` note). So this surface
   rides run-schema lane 0.18 and cannot ship before it.
3. **Do not let the explanation drift into grading the learner.** The sentence *"it missed your
   fork"* is legal. *"You should have played the fork"* is a move grade and belongs to the feedback
   lane's rules, not the opponent's. The seam is one sentence wide and worth naming in the RFC that
   builds it.

**One more thing the loss should carry, and it is cheap:** *the bot did not blunder — here is what it
was not allowed to play.* A guarded profile removed **100% of measured severe mass** at the 250 cp
threshold `[V]`, and its own §6 gap note says the honest response is that the card **states its tail
is truncated at 250 cp** rather than relaxing the test `[V]` (`rfc/bot-roster.md` §6). Telling a
learner *"this opponent cannot hand you a piece; if you are winning, you earned it"* converts a
structural limitation into the most valuable sentence in the after-the-run screen.

### Cost and dependencies

| item | cost | blocked on |
|---|---|---|
| "it cannot blunder above 250 cp" sentence | trivial | `rfc/bot-roster.md` acceptance |
| bot decision record surface | medium | run-schema lane 0.18; a production caller for `composeBotPolicySelection` (there is none `[V]`) |
| feature-grounded miss explanations | large | the Stage-B `features` binding, which is **Discharge D4, owner-owned** `[V]` |

---

## 7. The relationship across sessions

### What the user expects

A returning learner expects an opponent they have played to **remember them in the record, not in the
play**. Concretely:

- a **score**: how many times each of us has won;
- **when we last played**;
- a **rematch** button that puts them back into the same rung and family in one click;
- some sense of **progression** — that beating this one meant something and that there is a next one;
- and, crucially, **no hidden adaptation**. A learner who suspects the bot got quietly harder after
  they won stops trusting every number the product shows. O8.3 already rules this out in terms:
  cross-game memory is *"never a hidden difficulty adjustment"* `[V]`.

The tension is real and worth stating: **players want to be remembered and do not want to be
adjusted.** The resolution is that the memory lives in the *record*, which the learner owns and can
see, and never in the policy.

### What competitors do

- Chess.com bot play records results per bot and gates higher bots behind progress `[P]`.
- `design/research/league-as-return-loop.md` and `design/research/review-map-and-reentry.md` cover the
  return-loop mechanics generally; the *opponent-specific* return loop is not in the corpus, which is
  a genuine gap in the matrix rather than a finding.
- Chessiverse lists repeat-loss repertoire adaptation as **stated future work**, not shipped `[P]`
  (`human-like-opponents.md:479`).
- **The corpus's clearest evidence that hidden adaptation destroys trust is a real user saying so.**
  A long-term Dr. Wolf user with 800+ wins: *"**If the game is actively using AI to adapt to my level
  of play without me increasing difficulty, then it's pointless**"* `[V]` App Store review
  (`teardown-drwolf-desk.md:160-165`), recorded in the same section as the *"astronomical"*
  Advanced→Expert difficulty cliff. Note what the complaint is: not that adaptation is unpleasant,
  but that it **voids the meaning of the result**. That is the same argument O8.3 makes from the
  other direction, and it is why §7's promise is a product feature rather than an apology.
- Chess.com's bot games are *"always unrated"*, with a 3/2/1-crown economy keyed to hints and undos
  `[P]` (`fun-mechanics-outside-roguelikes.md:1185-1187`) — i.e. the field's answer to "did this
  count" is a separate currency, where ours is a void rule on a real rating.

### What we should do, and why it differs

**Everything needed for the relationship half already exists, unassembled.**

| ingredient | state |
|---|---|
| per-game opponent band | persisted; rendered as `Band 1400` in the `/rating` history table `[V]` |
| results and voids | persisted, with void reasons `[V]` (`rfc/learner-rating.md`) |
| permanent marks for beating a rung | **shipped** — bronze / silver / gold for bands 1400 / 1800 / 2200, rendered as *"Beat band 1800 on …"* `[V]` (`RatingScreen.svelte`) |
| a rung ladder with a top | shipped — 2200 is labelled *"top measured rung"* `[V]` |
| a named opponent to attach any of it to | **missing** — the catalog is empty |

So the recommendation is small and mostly re-titling:

1. **Attach the record to a name.** `Band 1400` becomes `Wren · band 1400 · guarded`. Same data.
2. **Give each bot a page**: the card (§2), the head-to-head record, the observed traits (§5.2), and
   a rematch button.
3. **Keep the marks and stop hiding them under "Record".** *"Beat band 1800"* is the single best
   progression object in the product and it lives on a screen named after bookkeeping. The `/rating`
   nav label is the settings dossier's territory (`ux-settings-and-identity.md`) but the *opponent
   ladder* belongs in `/play`.
4. **State the no-adaptation promise on the card, once.** *"It plays the same way whether you are
   winning or losing, and it does not remember your last game."* This is a refusal that reads as a
   feature and it is the direct answer to the field's "Adaptive" bots `[P]`.
5. **Do not build rivalry mechanics on top of an uncalibrated ladder.** A streak against a rung whose
   strength is `uncalibrated` is a fact about games played, not about improvement, and the surface
   must say which it is. `design/research/band-flattery-and-buried-value.md`'s finding on band-tuned
   flattery is the standing warning here `[V]` (`rfc/learner-rating.md` §1).

### Cost and dependencies

Small. No new persistence — `opponentBand` and results are already stored `[V]`. Blocked only on
profiles existing, i.e. on `rfc/bot-roster.md` family A landing.

---

## 8. The owner's two questions, answered directly

### 8.1 *"Are we smart here that we have a set of knobs…?"*

**Yes on the frame, and it was ruled two days after you asked the first version of it.** O8.1
(2026-08-22) specifies a composable stack rather than a knob set, which is stronger, because each
layer declares *inputs, transform/version, fallback, measured strength delta, trait metric and
abstention* `[V]` (`rfc/bot-policy.md:140-156`). A knob is a number; a layer is a number **plus the
measurement that licenses it plus what happens when it cannot act.**

The honest scoreboard of your six knobs, at HEAD:

| your knob | our layer | state |
|---|---|---|
| *how it consumes evidence* | `HumanPolicyModel`; the evidence-to-move selector | Maia ships. The evidence-based base is **funded** ([[D1271]]) and its two standalone heads were **both returned** `[V]` ([[D1162]]) — the representation signal replicates, the selector composition does not yet |
| *opening prefs* | `RepertoirePolicy`; `RouteSourceLayer` | book **refused on measurement** — 79.2% fallthrough on both arms against a 25% ceiling `[V]`. The route source **passed all eight gates** and sits in no profile `[V]` |
| *strategy prefs* | `ControlledTrait[]` | **one** trait has ever passed a gate, and **nothing populates `candidate.traits`**, so a registered trait multiplies by 1 on every candidate `[V]` ([[D1181]]) |
| *endgame prefs* | a phase-conditioned layer | **unmeasured** — the R11 population stops at ply 20; zero endgame cells `[V]` |
| *piece prefs* | `trait.pawn_preference@1` | **the one that works**: +12.28 pp pawn rate, −1.01 cp loss shift `[V]` |
| *strength* | band | four measured rungs, 346.8 Elo, **orthogonal to family by measurement** `[V]` |

**The finding: five of six knobs are unmeasured, refused on measurement, or measured-and-unshipped,
and the catalog is a literal empty array.** The architecture is not the problem and neither is the
research — the roster, the grammar, the compiler and the gates all exist. What is missing is (a) two
type-level obligations that block eight of twelve profiles, and (b) **any surface at all**. That
second half is what this dossier is about: even if all twelve profiles registered tomorrow, a learner
would meet them through a `<select>` with two words in it.

One correction worth making to the framing: **"knobs" implies they compose freely, and two of them
measurably do not.** Temperature is not a personality knob, it is a strength knob worth more Elo than
the whole band range `[V]`; and a trait multiplier cannot reach a move the base model never emitted,
which is why three successive reweighting experiments failed and the fourth — a *proposing* source —
succeeded `[V]` ([[D1084]]). The stack is a pipeline with directions, not a mixing desk.

### 8.2 *"…and then a bots/humans ELO is just based off of unguided matches?"*

**For bots: yes, and it is already specified down to the arm list.** `rfc/bot-roster.md` §6 pins
**12,400 games across 16 arms, ≈4–5 h** on the D333 host, every arm against a common reference (raw
Maia band 1400 at MultiPV 1) `[V]`. It is not naive self-play — it carries three controls a naive
version would omit:

- **C1 null control** (reference vs reference, 800 games) — is the instrument biased?
- **C2 positive control** (T = 5.0, 400 games) — is the instrument blind?
- **N negative control** — weakened Stockfish at band, *"rejected doctrine, retained so the roster
  can be shown to beat it"* `[V]`.

And [[D341]]'s seeding rules are mandatory because the first attempt at this produced **611/611
mirrored pairs with byte-identical move lists, a 50.8% duplicate rate, and a same-band control at
exactly 0.500000 with standard error exactly 0.0** — *"the most confident possible wrong answer"*
`[V]`. Unguided matches give you a number very easily and a *correct* number only with controls.

**Three caveats you should hear before this becomes the plan.**

1. **Unguided matches produce a band-relative ladder, not a human anchor.** The pool is our own
   engines. Nothing in this repo ties band 1400's real strength to any human rating pool `[V]`
   (`rfc/learner-rating.md` §2, "Anchor"). The field's own record is the warning: **maia1's published
   label is 1100 and it measures 1434–1666 — and spans ~230 Elo across time controls against the
   same human pool, so "the bot's Elo" is not even one number** `[V]`
   (`human-like-opponents.md:253,303-304`). **The anchor has exactly one known solution in the
   field**, and it is not arithmetic: Chessiverse deployed **four calibration bots on Lichess
   (833 / 1057 / 1454 / 2009)**, scaled everything else to them, and recalibrated three times `[P]`
   (§4). If Discharge D5 is ever ruled *yes*, that is the shape of the work, plus the standing rule
   that **every verified calibration in the field is time-control-specific — "a '1400' claim must
   name its clock"** `[V]` (`human-like-opponents.md:334-335`), while our own harness plays
   **untimed** engine-vs-engine with no clock anywhere in the opponent path `[V]`.
2. **The ladder is narrow where you want it wide.** ~480 Elo at full material against a 1000→2000
   product journey, and it compresses to **−72.4 Elo** below ten pieces `[V]`. So "unguided matches"
   resolve *which rung a profile sits on*; they cannot manufacture range that the underlying dial
   does not have.
3. **It will not price the personality.** `rfc/bot-roster.md` §6 states this before the run rather
   than after: the guard and trait shift expected loss by 1.36 cp and 1.01 cp, far below what 800
   games can see, so the paired arms *"will return an upper bound, not a null, and must be reported
   as one"* `[V]`. That is the good news restated: **choosing a personality does not change the
   difficulty, and the calibration run is what proves it.**

**For humans: no, not symmetrically — and the asymmetry is deliberate.** A learner's rating comes
from a Glicko-2 update over *their* games against the bot ladder, where assistance and rewinds void
the result but never delete the game `[V]` (`rfc/learner-rating.md`, `RatingScreen.svelte`). Both
numbers therefore live on the same internal scale, and `/rating` already says so: *"They are not
FIDE, Lichess, or Chess.com ratings."* `[V]` The learner's number inherits every limit of the bot
ladder above it, which is why §5.1's precondition refuses the update at ≤10 pieces rather than
weakening it — *"a weak signal is admissible with a wide RD, an undefined opponent rating admits no
update at any RD"* `[V]`.

**Blocking fact for both halves:** Gate 0 already ran on 2026-08-23 and **abstained on a failed
positive control** — the Maia band-identity test had 1400/1600/1800 profiles peaking on human
1600/1800/1800 `[V]`. [[D1184]] requires a **new preregistered statistic and population** before the
gate is reused, and explicitly bars reinterpreting the result or rerunning a duplicate instrument
`[V]`. So the answer to your question is *yes, that is the plan, and the plan is currently
one abstained gate away from being able to start.*

---

## 9. Reconciliation — what this contradicts and what it confirms

### 9.0 Against `ux-arrival-and-start.md` §4.5 and §6 — inherited, not superseded

That dossier landed three days before this one and its §6 is a complete pass on *choosing* an
opponent. The division of labour, stated so no reader has to guess which document owns what:

| its finding | status here |
|---|---|
| §6.3 **D1** — the four-rung `/rating` form is the best start form in the app and is behind the wrong door ([[D1473]]) | **inherited and confirmed independently.** §1 recommendation 1 restates it as a recommendation; §9.2 item 3 and §11.6 carry the IA half |
| §6.3 **D2** — named opponents with a character and no number; band ⊥ family makes a two-axis picker possible | **inherited.** §1 recommendation 3 restates it; §§2 and 5 are the part D2 does not reach — *what the card actually says* |
| §6.3 **D3** — convey difficulty without asserting a rating, via ladder position, family character, and your own result | **inherited and extended.** §4 adds the endgame-attenuation consequence; §7 builds out D3's third device into the relationship half |
| §6.3 **D4** — opponent choice sits beside the preset, never inside it (`rfc/intent-presets.md` §8.1) | **adopted unchanged, not reopened** |
| §6.4 — the roster **picker surface** is *unowned*: `bot-policy` says it is Just Play / `play-composition` work, and `play-composition` stops at the in-run column | **confirmed, and this dossier is the missing content for it** rather than a competing claim on ownership |
| §4.5's thirteen-row competitor table | **the source for most of §§1–4's competitor claims here**, cited per claim rather than restated wholesale |

**What is new here and not in that dossier:** the 1500 derivation (§0.2), the assistance-gating of
the applied band and the pack-gating of the resistance sentences (§0.1), the card's three registers
and the provenance rule (§§2, 5.3), the identity bar (§3), observed traits as the answer to
personality (§5.2), the bot's own miss as a legal surface (§6), the cross-session relationship (§7),
and the direct answers to the owner's two questions (§8). **Where the two dossiers touch, this one
defers.**

### 9.1 Confirmations

| claim | this dossier's independent check |
|---|---|
| [[D1087]] — the shipped bot catalog is a literal empty array | confirmed at `bot-policy-catalog.ts:299` `[V]` |
| [[D1181]] — two unledgered blockers explain the empty catalog | confirmed at the symbol: `searchBound` union and the `candidate.traits` read `[V]` |
| [[D561]] — *"human-like bot play currently has modes and sampling knobs, not a bot personality policy"* | confirmed and **narrowed**: the *policy* now exists as an accepted grammar; what does not exist is a single instance or any surface `[V]` |
| `competitor-play-ux.md`'s opponent-identity-bar finding | confirmed as the transferable pattern, and confirmed absent here — 0 `avatar` occurrences `[V]` |

### 9.2 Corrections and sharpenings

1. **[[D561]]'s framing is now half-stale in our favour.** It says the runtime exposes *"`targetElo`,
   `temperature` and `topP`"* with no policy layer. The layers now exist as an accepted, compiled
   grammar with digests and gates. The row's live half is the *surface*, and it should be re-read as
   a UX defect rather than an architecture one.
2. **The empty catalog is not the learner's biggest problem.** [[D1087]] frames the gap as *"a
   learner picks between two words"*. Measured this pass, the sharper statement is that **a learner
   picks between two words and is then told nothing at all** — the resistance sentences are gated on
   a pack and the applied band is gated behind an assistance permission (§0.1). Registering twelve
   profiles tomorrow would not fix a single one of those three gates.
3. **`/rating` is not a rating screen; it is the opponent picker.** Its start-card is the only
   competent opponent chooser in the product, and it is filed under a nav item that means *history*.
   This crosses into `ux-settings-and-identity.md`'s IA territory and is named here as an owner
   decision rather than resolved.
4. **The band's classification as assistance is a genuine design-tier question, not an oversight.**
   `design/05`'s assistance ladder governs what may be shown when, and `humanSplit` is a legitimate
   member of it. What is wrong is that *the opponent's strength* and *the human-model evidence layer*
   are the same object in the code and should not be the same object in the interface.

### 9.3 `DESIGN-GAP:` the design tier has no opponent section

Stated as a gap rather than resolved, per law 5. Three drafts (`bot-policy`, `bot-roster`,
`bot-route-source`) each open with the same sentence in their own words: *"the bot lane has no
design-tier section; its intent authority is the owner ideation [[D810]]–[[D812]] and the O8
ruling"* `[V]`. `design/03-product-breadth.md` names the opponent in exactly two places — §Just Play
(*"choose a side/position/opponent"*, `:35`) and the Settings surface row (*"opponent/rating"*,
`:294`) `[V]` — and `design/05` names it once, inside the thesis quotation at `:538` `[V]`.

**The product's central promise — "a human-like opponent" — has one line of intent-tier
specification, and it uses a phrase the shipped compiler refuses.** That is not a contradiction to
resolve in a dossier; it is the owner decision in §11.1.

---

## 10. Sequencing, cost and dependency — consolidated

**Wave 1 — nothing is blocked, all of it is small.** Every item here can land against HEAD.

1. Always send a band from Just Play; stop treating Maia's UCI spin default as a product decision.
2. Move `/rating`'s four-rung named picker into `/play`; delete the two-word `<select>`.
3. Render the resistance sentences in Just Play (drop the `pack !== undefined` gate) and replace
   `human_common` with a learner sentence.
4. Ship the opponent identity bar.
5. Put the *"not FIDE, Lichess, or Chess.com"* disclaimer on every opponent surface.
6. Add the endgame-attenuation notice below ten pieces.

**Wave 2 — needs `rfc/bot-roster.md` family A (zero blockers by its own criterion 10).**

7. The bot card, registers 1 and 3 (mechanism + refusals).
8. Names and art for four profiles.
9. Attach the `/rating` record and the marks to a name.
10. The "it cannot blunder above 250 cp" sentence.

**Wave 3 — needs a mechanism decision or a measurement.**

11. Observed traits (§5.2) — no external blocker, needs a home RFC.
12. The provenance rule on card sentences (§5.3) — an amendment to `bot-policy`/`bot-roster`.
13. Register 2 (trait rates) — obligation B.
14. The bot's decision record as a surface (§6) — run-schema lane 0.18.

**Wave 4 — owner rulings and machine time.**

15. Calibrated strength numbers — a new preregistration ([[D1184]]) plus ~4–5 h.
16. Route-source personality — O8.3 lift, Discharge D1, Discharge D3.
17. Absolute human-scale Elo — Discharge D5.

**The shape of the sequencing, stated once:** six of the seventeen items are unblocked, small, and
would take the opponent from *two words and silence* to *a named, described, recorded someone*. None
of the six needs a single new measurement, because **the measurements are done and the sentences are
already drafted.**

---

## 11. Owner decisions this dossier names (intent tier — not taken here)

**11.1 — Does `design/` get an opponent section, and who writes it?**
Three RFC drafts each record the absence and each decline to fix it under law 5. The product's
central promise has one line of intent. *Options:* (a) owner writes a `design/07-the-opponent.md`;
(b) owner rules that `design/03` §Just Play is amended with an opponent paragraph and claude drafts
it on the ruling; (c) the bot lane continues to run on O8 + [[D810]]–[[D812]] as its intent
authority, and the absence is accepted and recorded. *Consequence of (c):* every future bot RFC
repeats the same disclaimer, and no gate in `planning/exploration/gates.md` names the opponent
surface.

**Rider, and it is the sharper half.** `design/00-thesis.md:136` lists **"a generic bot ladder"**
under *What it is not* `[V]`. §1 recommends putting a four-rung picker on the primary play surface,
which is a bot ladder. §1's *"the constraint this recommendation must clear"* argues it is exempt on
three grounds — the rung is a control variable, the generic rungs are refused **with their
measurements**, and §§2–7 make the entry an opponent rather than a setting — **and explicitly states
that if only the picker ships and the card and record do not, the result IS the refused object.**
That reading is claude's and the thesis is intent tier. The owner should either ratify the exemption
with its three conditions or refuse the picker, because *"ship the picker now, the card later"* is
the failure mode the exemption is written to prevent.

**11.2 — Is the opponent's applied band assistance, or is it chrome?**
Today it renders only inside the evidence inspector behind `assistancePermission.humanSplit`. Moving
it to a permanent identity bar changes what `design/05`'s silent profile shows by default.
*Recommendation:* chrome. Who you are playing is not a hint about the position; the *human-model
candidate distribution* is, and they are separable.

**11.3 — May a shipped profile carry a route source?**
O8.3 predates the mechanism and bars it. [[D1084]] passed eight of eight gates. `rfc/bot-route-source.md`
Open question 1 puts this to the owner with a recommendation and does not answer it. *Consequence of
not lifting:* the thesis clause *"truly applying an opening"* has no shipping mechanism, because the
book arm is refused on measurement.

**11.4 — May a card ever show an absolute human-scale Elo?** (Discharge D5, restated here because it
is the question learners will ask first.) *Options:* anchor accounts on a public server; derive from
the learner Glicko pool; or stay band-relative permanently and say so. *Consequence of staying:*
every opponent surface carries the *"not FIDE, Lichess, or Chess.com"* line forever, which is honest
and is a real adoption cost.

**11.5 — Persona naming.** `rfc/bot-roster.md` Open question 1: the twelve placeholder names are
claude's, and **changing a name voids that profile's calibration by digest** `[V]`, so the set must be
chosen *before* the ladder runs. Also its Open question 2: one persona per profile (a rung is a
character) or one per family (the band is a setting shown separately). *Recommendation:* per profile
— a learner returns to *Wren*, not to *guarded, 1400*.

**11.6 — Where does the opponent ladder live in the IA?** The only competent picker is behind a nav
item called "Record". This overlaps `ux-settings-and-identity.md`'s IA lane and
`ux-arrival-and-start.md`'s nine-destination finding, and should be decided once for all three rather
than three times.

---

## 12. Proposed ledger rows — NOT written

Written **unnumbered** per [[D1130]] as amended by [[D1354]]: proposed, id assigned at landing, head
was **D1478** at drafting (`design/BACKLOG.md:1762`). **One governance contradiction, flagged rather
than resolved:** `design/BACKLOG.md:414` records [[D1130]] as **✅ retired 2026-08-23** — *"drafts
may again show provisional numbers when useful, clearly marked proposed/renumber-at-landing"* —
while `planning/rfc-drafting-queue.md:817-834` still presents the unnumbered convention as adopted,
and drafts as recent as 2026-08-24 follow it (`rfc/intent-presets.md:905`) `[V]`. Unnumbered is the
safe intersection of both readings and is what this dossier uses. Per [[D1354]] the rows below are
the coordinator's to land, routed to the durable section that specifies each repair — never to a
`## Ledger rows` section, which `work-index` excludes from durable text by design.

- 🐞 **Just Play silently plays Maia at band 1500, a rung nobody chose and nobody measured.** The
  starter sends no `targetElo`; `appliedTargetElo` falls to `profile.default`; the profile default is
  Maia's UCI spin default `1500`, which survives only because it happens to lie inside the configured
  `[1000, 2400]` clamp. It is not one of the four pre-registered rungs, and it is invisible unless the
  learner opens an assistance modal. `TARGET_ELO_REQUIRED` already exists as the refusal for a
  band-calibrated engine with no default and never fires. ⊕ from `JustPlayStarter.svelte:4,15`,
  `session-controller.ts:289`, `engine-band.ts:46-50,74`, `maia.ts:11`, `opponent-selector.ts:582,592`.
- 🐞 **The opponent's strength is classified as learner assistance.** The applied band reaches a
  learner only inside the evidence-inspector modal, in the *Human move model* section, behind
  `assistancePermission.humanSplit === "free"` and a *Load model candidates* click
  (`DrillScreen.svelte:1147-1151`). In the silent default profile the learner can never discover who
  they are playing. Needs an intent ruling (§11.2) before it can be repaired.
- 🐞 **A Just Play game says nothing about its opponent, ever.** The resistance sentences are gated
  on `pack !== undefined` (`DrillScreen.svelte:979`), which is backwards: the pack-less game is the
  one with no author to explain it — the same argument `design/05` §5a makes for pivotal moments.
- 🐞 **`Requested resistance: human_common` renders a raw internal identifier to learners**
  (`outcome-presentation.ts:112`). The *"— the pack's request"* clause beside it is the right idea in
  the wrong vocabulary.
- 🐞 **The persona filter is a word list, and a law-8 violation needs no banned word.**
  `REFUSED_PERSONA_CLAIM` checks eight adjectives in `name`/`bio` (`bot-policy-catalog.ts:173`).
  *"She likes to keep the position closed and grind"* passes and is an unmeasured chess claim.
  `rfc/player-style.md` §6 builds a second enforcement point for exactly this reason; the bot lane has
  one. **Proposed mechanism:** every card sentence carries the id of the layer or measurement it
  restates, and a sentence with no id does not render — generalising the guard's existing
  `disclosure`-must-embed-its-literals rule from one layer to the whole card.
- 💡 **Observed traits are licensed by O8.2, unbuilt, and are the cheapest personality in the
  product.** `observedTrait` appears nowhere in `apps/` or `packages/` — three prose mentions in
  `rfc/bot-policy.md` and two in dossiers. Every input exists (persisted selections;
  `candidateFeatureVector`, [[D813]]). A sentence like *"Wren has taken the b2 pawn in 2 of your 4
  games"* is law-8-safe by construction: it restates moves the bot played over opportunities it had,
  and grades nobody. Needs a home RFC.
- 📊 **Band and family being orthogonal by measurement is a USER-FACING promise, not an implementation
  note.** 346.8 Elo across four rungs versus 1.36 cp / 1.01 cp for guard and trait means **choosing a
  personality does not change how hard the game is** — a promise no difficulty slider can make, and
  the strongest single reason to build a roster rather than a ladder. It should appear on the picker.
- 📊 **The refusals are the most personality-dense sentences available to us.** *No opening book · no
  memory of your last game · endgame behaviour unmeasured · cannot hand you a piece above 250 cp.*
  Each restates a measurement or a compile-time refusal, each is specific, and no competitor prints
  one. The card's *"What it doesn't"* zone is a differentiator, not an apology.
- 🐞 **The product's only competent opponent picker is filed under "Record."** `/rating`'s four-rung
  named start-card with its honest disclaimer is strictly better than `JustPlayStarter`'s two-word
  `<select>`, and is reachable only through a nav item that means *history*
  (`ShellFrame.svelte:30`). Overlaps the IA lanes in `ux-arrival-and-start.md` and
  `ux-settings-and-identity.md`; should be decided once.
- 💡 **The bot's own decision record is the one legal dashboard in this product.** Rendering *"it
  weighted your fork square at 3%"* has the machine as its subject, not the learner, which
  `human-like-opponents.md` places on the legal side of the ADR-0005 line. `BotPolicyDecisionRecord`
  exists (`bot-policy-catalog.ts:141-165`) and is **not persisted** ([[D822]]); the surface rides
  run-schema lane 0.18.
- 💡 **[[D561]] should be re-read as a UX defect.** Its architectural half is discharged — the layers
  exist as an accepted, compiled grammar with digests and gates. Its live half is that no instance and
  no surface exist, which is a different owner and a different fix.
- 📊 **A four-rung picker on the primary play surface collides with the thesis's "not a generic bot
  ladder", and the exemption has three conditions that must ship together.** `design/00-thesis.md:136`
  `[V]`. The rung is a control variable (`design/03:146-157`), the generic rungs are refused *with
  their measurements* (100-point steps buy 22.1–26.9 Elo; 2400 crosses parity at p = .21; the
  five-to-nine-rung interpolation is refused as a **method**), and the card plus the record are what
  make the entry an opponent. **Shipping the picker without the card produces exactly the refused
  object.** Owner ratification or refusal owed — this is an intent question, not a UX one.
- 📊 **Chess.com's bot-selection screen is not in our corpus, and "a bot picker is obviously a grid
  of character cards" is `[M]`.** No named bots, bios, avatars or displayed bot Elo labels appear in
  either chess.com teardown, the play-UX dossier, the matrix or the love/hate sweep; the matrix
  records the species as unestablished (*"P adaptive AI (unspecified)"*, *"P bots"*).
  `ux-arrival-and-start.md:387-390` already flags the same `[M]` for Chessiverse. Any future RFC that
  cites a chess.com bot roster as precedent is citing model knowledge. First hands-on teardown owed.
- 📊 **The field has exactly one known solution to the anchor problem and it is not arithmetic.**
  Chessiverse deployed four calibration bots on Lichess (833 / 1057 / 1454 / 2009), scaled everything
  to them and recalibrated three times `[P]`; Allie evaluated online against 1000–2600 humans at a
  49-Elo mean skill gap `[P]`. *"That is the entire list."* If Discharge D5 is ever ruled yes, this
  is the shape of the work — and every field calibration is time-control-specific while our harness
  is untimed.
- 📊 **Learners judge where an error sits, not how often one happens — and the only direct evidence
  is the vendor's.** [[D592]] `[P]`: users call a one-move piece drop *inhuman* even when
  similarly-rated people make large errors; Chessiverse's response is to prefer errors *with a
  mitigating tactical circumstance*. This is the user-side twin of [[D811]]'s mechanical finding and
  it is the strongest argument for the guarded family being the **default** opponent rather than an
  option.
- 🐞 **The teardown protocol never asks how a competitor presents its opponent, which is why bots got
  a mention in six UX dossiers and a pass in none.** The three questions in
  `design/research/README.md` are E1 threat, one good feature, and love/hate. A case-insensitive
  search of `teardown-noctie-desk.md` for *bot*, *opponent* and *persona* returns zero hits `[V]`,
  and most of the sweep has the same shape. The one teardown that does answer it —
  `teardown-chessmindai-desk.md` §2, which verified a Maia-2 claim against the shipped bundle — is
  also the one the matrix calls the closest stack neighbour. **Proposed fourth question:** *who does
  this product say you are playing, and what does it claim about them?*
- 📊 **Six unblocked items take the opponent from two words and silence to a named, described,
  recorded someone**, and none of them needs a new measurement (§10 wave 1). The measurements are
  done and the sentences are already drafted in `rfc/bot-roster.md` §4 and §7.

---

## Residuals and limits

1. **Every competitor claim here is `[P]` and inherited.** Nothing in the corpus this dossier draws
   on was driven hands-on ([[D1458]]). The specific claims most in need of a hands-on teardown, in
   priority order: chess.com's bot-selection gallery and per-bot card content; Lichess's level picker
   and the `maia1/5/9` account presentation; Chessiverse's bot detail page; ChessMind's six-band
   picker, which its own teardown calls *"the closest stack neighbor in the entire matrix"*. I did
   **not** verify any of these in a browser in this pass, and the three-question teardown format
   (`design/research/README.md`) would answer them properly. **Two protocols already exist for it**:
   the Noctie protocol (~20 moves at a stated level, logging FENs — `teardown-chessigma-desk.md:457`)
   and the 30-minute hands-on incumbent pass (`competitor-play-ux.md:351-355`).
   **Two corpus hygiene items found in this pass and not repaired here:** Chessiverse has **two
   conflicting rows in `competitor-matrix.csv`** (`:16` and `:58`) that disagree on its human-likeness
   cell, so *"the matrix says"* is ambiguous for the one vendor most relevant to this dossier; and
   `human-like-opponents.md` — the source of much of §§2, 5 and 6 here — is desk-only and **discloses
   a summarizer fabrication incident** on the Chabris numbers, with its own instruction to
   *"spot-check any `[P]` number against its PDF before it becomes load-bearing in an RFC."* I did
   not re-fetch any of its primary sources.
   **A second, structural gap in the matrix:** no teardown in the corpus asks an *opponent-identity*
   question. `teardown-noctie-desk.md`'s four questions are about takebacks, side-by-side comparison
   and review, and a case-insensitive search of it for *bot*, *opponent* and *persona* returns
   **zero hits** `[V]` — and the same shape holds across most of the desk sweep. The teardown protocol's three questions (`design/research/README.md`) do not include
   *how does this product present its opponent*, which is why bots got a mention in six UX dossiers
   and a pass in none. That is a protocol gap, not an oversight by any individual teardown.
2. **No learner has used any of this.** Every "what the user expects" claim in this dossier is `[M]`
   synthesis from the target-player definition (`design/00-thesis.md` §Target player) plus the
   competitor corpus. The product has no usability evidence about opponent selection and no human has
   judged any bot's play — **H5 is untested and zero human judgements exist** `[V]`.
3. **The 42-branch blind packet is prepared, integrity-checked, and unused** `[V]`
   (`planning/platform-alignment/bot-policy/blind-review/`). It is owner-use only and cannot establish
   a population claim, but it *can* reject an incoherent profile — and it is the cheapest available
   check on whether any of §2's card sentences describe play a person actually experiences. It is not
   scheduled.
4. **I did not price the observed-trait computation.** §5.2 asserts every input exists and that the
   work is medium; I traced the persistence and the feature vector but did not write the aggregation,
   and a denominator problem (what counts as an *opportunity* to take on b2) is exactly the class of
   thing `rfc/player-style.md` spends a whole section on for the learner side. That section's
   discipline should be inherited, not re-derived.
5. **Nothing here resolves whether Maia is the right base.** [[D1271]] funded the evidence-to-move
   selector as the variant-portable alternative and its heads were returned twice; whichever base
   wins, §§1–7's surface recommendations are unchanged, because they describe what a card says rather
   than what computes the move.
