# Variant family — RFC derivation

**Lane opened 2026-08-23 by owner ruling [[D1031]]** (`design/BACKLOG.md:372`,
`planning/rfc-drafting-queue.md:618`). Owner, verbatim:

> *"why only 960? the idea was to offer many different variants as we need the campaign mode to be
> interesting and it's also fun to be able play/import/analyse fantasy games or w/e."*

This file is the derivation the lane entry promised. It is **not** an RFC and confers no drafting
authority — see §0.

---

## §0. Licensing — what this lane may and may not do today

**Derivation: licensed. RFC drafting: NOT licensed.** Both halves are load-bearing, and the
distinction is the one [[D951]] was ledgered for (`design/BACKLOG.md:333` — a campaign RFC was
commissioned against a standing gate and caught only by the drafting fork).

| Gate | Where | Status for this lane |
|---|---|---|
| RFC-0000 §Exploration gate — *"Product RFC drafting is **closed** until the vertical slice has passed the continuation gates … or an owner ruling (logged in `planning/exploration/log.md`) opens a specific RFC early"* | `rfc/0000-rfc-process.md:24-31` | **CLOSED for variants.** No owner ruling opens a variant RFC. [[D1031]] opens a *lane* and commissions a *derivation*; it does not say "draft". |
| [[D953]] — *"the campaign-RFC gate is WAIVED — 'draft v1 now'"* | `design/BACKLOG.md:330`, `planning/campaign-research-queue.md:6-10` | **Does not extend here.** D953 names `planning/campaign-research-queue.md`'s R6–R8 gate and `campaign-core` v1. It is campaign-scoped by its own words. |
| `planning/work-register.md:154-172` §4b — *"**Nothing is running on these**"*, entry condition *"one cheap measurement rather than a research programme: **where does the chess coupling actually sit?** … That measurement decides the shape of both rows and **should precede any drafting**"* | `planning/work-register.md:158-168` | **This document discharges that entry condition** (§2, §4). §4b's "deliberately not launched" status is superseded by [[D1031]]. |
| **C14** — *"Variants are a named, published refusal, not an omission … Adopting a chess variant as a minigame **without amending a published capability refusal** — the refusal is category (B) … so changing it is a *documented* act, not a free one"* | `design/research/fun-mechanics-outside-roguelikes.md:128` | **Not a gate on drafting; an obligation on shipping.** C14 requires that any variant RFC amend `apps/server/src/capabilities.ts:133` explicitly. It is discharged by writing the amendment, not by asking permission. (C14 cites `capabilities.ts:105`; at HEAD the row is at **:133** — citation drift, quoted text exact.) |
| Law 1 — *"No implementation before an accepted RFC; no RFC before the exploration gate"* | `CLAUDE.md` §Non-negotiable laws | Holds. Nothing here authorises code. |
| [[D1030]] — the refusal-accountability defect, which **names this lane's own row as an instance** (*"[[D327]]'s Fischer-Random ask sitting as an idea row since 2026-08-16; and `UCI_Chess960` shipped as `disposition: "refused"` … with a **product** rationale … that was never put to the owner as a decision"*) | `design/BACKLOG.md:371` | The reason this derivation exists at all. §7 gap 1 is the owner fork D1030 says was never put. |

**Therefore:** this document may derive, measure, price and recommend. **An owner ruling is
required before any variant RFC is drafted**, and §7 gap 1 is the ruling this lane needs first.

**One disposable probe was run** to produce §4's measurements (RFC-0000 §Exploration gate,
"disposable research harnesses … do not require an RFC"): a throwaway vitest file under
`apps/server/src/`, executed at HEAD `08d6b7d`, **deleted after the run**. Its log entry to
`planning/exploration/log.md` is **owed** — the log was held dirty by a concurrent agent and law 7
makes it append-only, so this derivation records the obligation rather than racing the write. See
§7 gap 20.

---

## §1. The existing research base — what is already measured

Two dossiers carry substantive treatment. Everything else is incidental.

### §1.1 `fun-mechanics-outside-roguelikes.md` §6a — the variant table

Header at `design/research/fun-mechanics-outside-roguelikes.md:1098`; framing at `:1100-1102`
(*"Lichess ships exactly **eight** official variants … Sorted by the axis that matters to us —
does it change the player's information, or the pieces' power"*). Ten rows, three columns
(`| Variant | Rule, verbatim | Axis |`, `:1104`). All rows `[P]`, checked against the cited page.

| Line | Variant | Axis (verbatim from the dossier) | The owner's four-way frame |
|---|---|---|---|
| `:1106` | **Fog of War** | *"**Removes information.** Powers untouched"* | legibility |
| `:1107` | **Chess960** | *"**Removes memorised information.** Powers untouched"* | legibility |
| `:1108` | **Duck Chess** | *"Adds an obstacle + a second decision"* | legibility (+ move set) |
| `:1109` | **Crazyhouse** | *"Expands the move set"* | power |
| `:1110` | **King of the Hill** | *"Relocates the goal"* | goal |
| `:1111` | **Three-check** | *"Relocates the goal"* | goal |
| `:1112` | **Racing Kings** | *"Relocates the goal"* | goal |
| `:1113` | **Atomic** | *"Inverts evaluation, non-local vision"* | evaluation |
| `:1114` | **Antichess** | *"Inverts evaluation"* | evaluation |
| `:1115` | **Horde** | *"Inverts evaluation"* | evaluation |

**The finding the lane rests on**, `design/research/fun-mechanics-outside-roguelikes.md:1117-1121`:

> *"**The finding.** The three variants at the top of that table — **Fog of War, Chess960, Duck
> Chess** — are *legibility* mechanics, not power mechanics. They are the commercial proof that
> `06` §5's *"what escalates is legibility, not power"* is a real design axis in chess and not a
> consolation prize for lacking a power curve. **Fog of War in particular is the
> capability-suppressing boss, implemented as a rule of chess.**"*

Two rule quotes that are load-bearing downstream:

- `:1107` **Chess960** — *"The only way to castle is to move the King onto the Rook"*. This is the
  published-rule basis for today's [[D1029]] ruling; §4 shows chessops already encodes it.
- `:1106` **Fog of War** — *"Players can see only the squares where their pieces can legally move"*.

### §1.2 What the dossier says the instrument stack costs

The cost is stated **once for the whole class**, not per variant — bullets at `:1123-1143`:

| Line | Claim | Consequence for this lane |
|---|---|---|
| `:1123` | *"**Prices:** nothing. All of them are rule sets, not economies."* | No economic/content cost. Cost is engineering + evidence, nothing else. |
| `:1124-1125` | *"**Rewards:** calculation over recall (960), local vision over global (Fog), a second decision per turn (Duck)."* | 960's product value is stated in the owner's own vocabulary. |
| `:1130-1133` | *"…beyond it sit Syzygy (standard-chess tables), the explorer corpus (standard openings), Maia (trained on standard games) and **every one of the 47 packs**. A variant node has *no* grounded instrument behind it."* | **Overstated for Chess960 — see §4.** Correct for Tiers 2–3. |
| `:1141-1143` | *"**What would kill it:** any *literal* variant adoption. It invalidates the tablebase, the corpus, Maia's band calibration and the whole catalogue at once"* | The dossier's strongest anti-variant claim, and the one §2/§4 partially refute for Tier 1. |
| `:1497-1505` | *"**Literal chess variants** … The literal form is refused; the mechanic is adopted."* Filed as **"Near-miss, resolved by transformation"**, NOT in the §8 refused set (R1/R2/R3, `:1447/:1464/:1481`). | **Variants were never a refusal.** They were a transformation preference. That is the correct reading and it materially lowers the bar D1031 has to clear. |

**The transformation the dossier prefers** (`:1134-1140`): implement Fog of War's *idea* in the
assistance layer as `locked_off` (the suppressor boss), not in the move generator; and Chess960's
*effect* — *"you cannot rely on memorised theory here"* — as the 20 opening packs' `authoredBoundary`.
**Both transformations are already shipped or specified** (`rfc/campaign-core.md:219-221`, the
`suppress: ModuleId[]` boss blind). This lane is therefore not a substitute for them; it is the
question of whether the *literal* form is also worth having, which is exactly what D1031 asks.

### §1.3 `training-mode-variants.md` — the other axis, and where it draws the line

`design/research/training-mode-variants.md:15-18`, verbatim:

> *"**The boundary, kept crisp per [[D870]]**: this dossier catalogues **training-mode variants** —
> different ways of engaging *standard* chess. **Rule variants** (Chess960, crazyhouse, atomic,
> xiangqi/shogi) are a different axis, parked under [[D327]]/[[D328]]; they appear only in §9 as
> 'the other axis', with no design work."*

Its §9 (`:596-606`) restates D327's tiers and is the only place it touches rule variants.
**D1031 merges the two axes back together** — the owner asked for one family. This derivation
therefore covers both, and §5 is where they meet.

Findings carried forward:

| Line | Finding |
|---|---|
| `:22` | *"**Formats are cheap; verdict producers are the scarce thing.**"* Lucas Chess ships ~46 modes from one maintainer; the whole field yields *"exactly **one** genuinely new shape"*. |
| `:29-32` | 21 of 30 catalogued formats seal under the two shipped producers plus [[D869]]'s third; 4 need a fourth; 5 should not be encounters at all. |
| `:367-378` | **Smaller boards**: *"**everything assumes 8×8** … A 5×5 board is not a reduced position but a different game object; every instrument goes dark."* Not pursued. |
| `:380-395` | **Fairy pieces**: no Maia, no explorer, no tablebase, wrong movement model in the collectors. *"The lone instrument is **Fairy-Stockfish** … an eval oracle with no human model behind it."* |
| `:402-407` | The balance law, now [[D887]] and landed at `design/06-campaign.md:259-269`: *"**The campaign may bend material and position freely — those stay grounded chess; bending the board or the piece set exits the evidence plane, and anything evidence-dark is marked play, never training.**"* |
| `:511-517` | **Band-split solitaire** ([[D888]]) — *"which move does each crowd play?"*, grounded in per-band Maia policy mass. *"**Novelty: unique to us by construction.**"* |
| `:573-575` | Best standalone mode #1: *"**Imported-game solitaire** ([[D860]]/[[D869]]) — the mechanism ships dead, the corpus (any PGN) is free, the score is law-8-clean by construction"*. |

### §1.4 Everything else

`design/research/league-as-return-loop.md:49-58,146-147,190` treats the Lichess4545 **Chess960
league** as league-operations evidence (20+20, individual Swiss, 7 rounds; an extra approval gate —
*"we will generally never approve players completely new to Lichess4545 for chess960 only"*). It is
evidence that a 960-only cohort exists and is operationally distinct, not evidence about the mechanic.
`titled-player-training.md:206-219,276` and `assistance-surface-taxonomy.md:129,465,570` treat
**solitaire chess as a method** (Purdy / *Chess Life* point table); the latter records that
chess.com "Solitaire Chess" is *"**not verifiable as a shipped chess.com feature**"* — `[M]` as
feature, `[P]` as format. **Unfilled gap** (`fun-mechanics-outside-roguelikes.md:1627-1628`): the
*Chess Life* Solitaire Chess point table itself, *"worth a primary-source dig"*.

---

## §2. The degradation tiers, re-derived at HEAD

D327's frame (`design/BACKLOG.md:969`): *"**The instrument stack degrades in TIERS, and that is the
useful frame** … a variant should declare which rungs survive it, rather than the product
pretending the ladder is intact."* That frame is correct and is adopted as this lane's spine. Its
three grounded facts, re-measured at HEAD `08d6b7d`:

| D327 claim (2026-08-16) | Measured at HEAD | Verdict |
|---|---|---|
| *"13 files in `packages/runtime/src` import chessops"* | **24 non-test modules** (51 including tests). `grep -rln chessops packages/runtime/src \| grep -v '\.test\.'` | **Stale — nearly doubled.** The coupling grew, but see the next row: it grew in *breadth*, not in *depth*. |
| *"the single coupling point is `positionFromFen` → `Chess.fromSetup(parseFen(fen).unwrap())`"* | **TRUE and unchanged.** `packages/runtime/src/chess.ts:4-10` is 7 lines; `canonicalFen` `:12-14`; `transposeKey` `:16-19`. | **Holds.** The 24 importers import *detectors* (`attacks`, `SquareSet`, `Role`), not construction. One door. |
| *"A `variant` column **already exists** in storage (`storage.ts`)"* | **FALSE — a name collision.** `apps/server/src/storage.ts:4145-4153` puts `variant TEXT` on the **`schedules`** table beside `kind TEXT NOT NULL CHECK (kind IN ('blocked','varied'))`; interface at `:495-496`. It is the spaced-repetition blocked/varied practice variant. | **Refuted.** No chess-variant field exists anywhere. A variant RFC must add one and must not reuse this column. |

### §2.1 What each layer actually assumes

| Layer | Symbol / file:line | Assumes standard chess? | Breaks at |
|---|---|---|---|
| Position construction | `packages/runtime/src/chess.ts:4-10` `positionFromFen` | **Setup-agnostic; ruleset-fixed.** Calls `Chess.fromSetup`, never `setupPosition(rules, …)` | Tier 2 (needs a `Rules` argument). **Tier 1 passes unchanged — measured, §4.** |
| Board geometry | chessops `SquareSet` (64-bit), `parseFen` 8-rank requirement; chessground `files`/`ranks` fixed a–h/1–8 (`@lichess-org/chessground/src/types.ts:109-110`) | **Hard 8×8** | Tier 3, at the first symbol |
| Piece set | chessops `Role` = 6 roles; chessground `roles = ['pawn','knight','bishop','rook','queen','king']` (`types.ts:108`) | **Hard 6 roles** | Fairy pieces, at the first symbol |
| Legal-move enumeration (server) | `apps/server/src/sourcing/legal-moves.ts:10-27` | Takes a `Chess`; emits raw chessops moves | Tier 2 (typed to `Chess`, not `Position`) |
| Legal-move enumeration (client) | `apps/web/src/lib/board-input.ts:200-215` | `positionFromFen` + an e-file castling rewrite at `:205-207` | Tier 2. **960-safe by accident** — the rewrite fires only when `from[0] === "e"` and the rook is on a/h, where it is still correct. |
| Board rendering | `apps/web/src/lib/board-model.ts:64` `chessgroundDests(chess)` — **no opts** | Adds phantom `c1`/`g1` king dests for e-file kings | 960 positions with a king on e1 (§4.4); crazyhouse drops (`dropmode`, `chessground/src/state.ts:82`) |
| Structural / semantic detectors | 24 modules — `structure.ts`, `king-state.ts`, `square-control.ts`, `mobility.ts`, `pawn-dynamics.ts`, `tempo.ts`, `exchange.ts`, `tactics.ts`, `semantic-evidence.ts`, … | **Piece-movement + goal model baked in** | Tier 2 per-variant, differently each time |
| Phase classification | `packages/runtime/src/phase.ts` | Material-count model of opening/middlegame/endgame | Tier 2 (Horde, Crazyhouse, Racing Kings have no such arc) |
| Tablebase | `apps/server/src/tablebase.ts:30`, `sourcing/syzygy.ts:97,105` — URL **hardcoded** `tablebase.lichess.org/**standard**`; **and the provenance validator pins it**: `sourcing/ledger-validation.ts:24` `if (parsed.hostname !== "tablebase.lichess.org" \|\| parsed.pathname !== "/standard") return;` | **Standard only, twice over** | Tier 1 **survives** (960 is standard chess by ply ~20); Tier 2 mostly dies (lichess ships `/atomic` and `/antichess` endpoints, which our ledger validator would *reject*) |
| Opening explorer | `apps/server/src/sourcing/explorer.ts:66-67` — `url.searchParams.set("variant", "standard")`, hardcoded | Parameterised in the API, **fixed in our code** | One-line widening. Lichess carries 960 explorer data. |
| Maia | `workers/maia/sidecar.py`; identity via `opponent-selector.ts:532-538` | **Trained on standard human games.** No variant model exists. | **Tier 1 AND Tier 2.** This is the honest boundary, and 960 does not escape it. |
| Stockfish | `apps/server/src/engine-supervisor.ts:331` passes `spec.options` through verbatim | Ruleset-agnostic *iff* `UCI_Chess960` is set; **no variant support at all beyond that** | Tier 2 needs Fairy-Stockfish, a different binary |
| Pack lint | `docs/drill-pack-format.md:171` — *"parses the start as legal standard chess"* | **Explicit** | Every tier |
| PGN import | `apps/server/src/pgn-import.ts:32-35` | **Explicit refusal** | Every tier (§6) |
| Capability register | `apps/server/src/capabilities.ts:133` — `UCI_Chess960`, `disposition: "refused"`, *"The shipped drill format is standard chess only"* | **Explicit published refusal** | Every tier — C14 |

### §2.2 The tiers, and what the learner still gets

**The product question, per D327: a variant must declare which rungs survive it.** The rung
vocabulary below is `design/06-campaign.md`'s difficulty-availability axis one step over.

| | **Tier 1 — rules-identical, setup differs** | **Tier 2 — move-set / goal / evaluation changes** | **Tier 3 — different game** |
|---|---|---|---|
| **Members** | **Chess960** (only true member). Adjacent: reduced armies / pawns-only ([[D873]]), which are *legal standard positions* and are not variants at all | Crazyhouse, Atomic, Antichess, Horde, Racing Kings, King of the Hill, Three-check, Duck Chess, Fog of War | Westernised xiangqi (9×10), shogi (9×9) ([[D328]]); fairy pieces and smaller boards ([[D873]]) |
| **Board + move gen** | ✅ chessops `Chess`, unchanged (measured §4) | ✅ chessops `variant.ts` ships 7 of them free (§3.3); Duck and Fog ship **nowhere** | ❌ nothing. New game object |
| **Legality / rewind / fork / compare (the branch runtime)** | ✅ intact | ✅ intact for the 7 chessops variants — the runtime is FEN-shaped, not rules-shaped | ⚠️ *in principle* reusable via SFEN / xiangqi-FEN; `Node.fen` + `transposeKey` are the only FEN-shaped types. **Unmeasured.** |
| **Structural detectors** (structure, king-state, square-control, mobility, pawn-dynamics, tempo) | ✅ **all valid** — same pieces, same movement, same king-safety semantics | ❌ break **per-variant and differently each time**: Atomic's king safety is inverted; Antichess has no check at all; Crazyhouse's mobility ignores pockets; Racing Kings forbids check | ❌ none |
| **Phase classification** | ✅ valid | ❌ mostly meaningless (Horde has no opening; Racing Kings has no endgame) | ❌ none |
| **Tablebase (Syzygy)** | ✅ **valid** — a 960 endgame is a standard endgame | ⚠️ Atomic/Antichess have lichess endpoints, but `ledger-validation.ts:24` rejects them | ❌ none |
| **Opening explorer** | ✅ **available** — lichess carries 960 data; one hardcoded param (`explorer.ts:67`) | ⚠️ lichess carries per-variant data for its 8; same one-line widening | ❌ none |
| **Stockfish evaluation** | ✅ **valid** with `UCI_Chess960 true` (option pass-through already generic, `engine-supervisor.ts:331`) | ❌ **wrong, not merely unavailable** — Stockfish scores an atomic position as if it were chess. Needs Fairy-Stockfish. | ❌ none |
| **Maia (human model)** | ❌ **DARK.** Maia is standard-trained; a 960 back rank is out of distribution from move 1 | ❌ dark | ❌ dark |
| **The 47 authored packs** | ❌ inapplicable (they are standard positions) — but they were never a 960 claim | ❌ inapplicable | ❌ inapplicable |
| **Learner rating (Glicko-2)** | ⚠️ arithmetic works; whether a 960 result belongs on the same scale is an **owner fork** (§7 gap 8) | ❌ no calibrated opponent | ❌ no calibrated opponent |
| **WHAT THE LEARNER GETS** | **Evidence: yes.** Grades, engine eval, tablebase, structural reading, explorer. **Bots: strong engine only — no human opponent.** Play, review, rewind, fork, compare: full. **This is a near-complete product.** | **Evidence: no.** No honest grade, no human bot, no tablebase. **What survives is: legal play, rewind, fork, compare, and the learner's own eyes.** Marked play, never training ([[D887]]). | **Evidence: none.** **Board + a bot, if we ship one** — which is exactly what the owner asked for and accepted (*"even if we cannot offer most of the support mechanics"*). Shell reuse is the entire question. |

**The single most important line in this table:** Tier 1 keeps *everything except Maia*. D327 said
so in 2026-08-16 and it is confirmed at HEAD. `fun-mechanics-outside-roguelikes.md:1130-1133`'s
*"A variant node has no grounded instrument behind it"* is **true for Tiers 2–3 and false for
Chess960**, and that error is why the lane sat unrouted for a week.

---

## §3. What ships today that would carry a variant

### §3.1 The session and pack axes

| Axis | Symbol | Values at HEAD | Room for a variant? |
|---|---|---|---|
| `RunSessionKind` | `packages/runtime/src/types.ts:36` | `"pack" \| "position" \| "imported"` | **No new kind needed.** A variant is orthogonal — a 960 game can be `position` (Just Play), `pack`, or `imported`. **A variant is a property of the START, not of the session kind.** This is the cheapest possible finding. |
| `RunStart` | `types.ts:65-68` | `{ fen, side }` | **The natural home.** A `rules`/`variant` field beside `fen`. For Tier 1 it is *not even needed* — the FEN carries it. |
| Pack `phase` | `schemas/drill_pack.schema.json` `properties.phase` | `opening \| middlegame \| endgame \| cross_phase` | Orthogonal. 960 has all four; Racing Kings has none. |
| Pack `mode` | same, `properties.mode` | `line \| plan \| outcome \| trajectory` | Orthogonal, but `line` is theory-shaped and 960 has no theory — that is 960's *point* (`:1138-1140`). |
| Pack lint | `docs/drill-pack-format.md:171` | *"parses the start as legal standard chess"* | Must be widened or must explicitly exclude variant packs. |
| Storage `schedules.variant` | `apps/server/src/storage.ts:4153`, `:495-496` | `blocked \| varied` scheduling | **NOT available.** Name collision (§2). |
| `retryVariants` / `variantOf` | `schemas/drill_pack.schema.json:122`, `properties.variantOf` | `RETRY_VARIANT_KINDS`, 5 authored strings | **NOT available.** Third name collision. Any variant RFC must pick a non-colliding term — **`rules`** is proposed (it is chessops' own word). |

### §3.2 Opponent modes and bot profiles

| Symbol | file:line | Values | Variant behaviour |
|---|---|---|---|
| `RUN_OPPONENT_MODES` | `packages/runtime/src/types.ts:41-48` | `human_common`, `strong_engine`, `theory_strict`, `perfect_tablebase`, `practical_resistance` | **3 of 5 die in Tier 1** and 5 of 5 in Tier 2. `human_common` and `practical_resistance` need Maia; `theory_strict` needs the explorer at book depth (960 has no book). **`strong_engine` and `perfect_tablebase` survive Tier 1.** |
| `PositionOpponentPolicy` | `types.ts:76-78` | restricted to `human_common \| strong_engine` | **Just Play offers exactly two modes, one of which dies in 960.** A 960 Just Play session gets `strong_engine` only, unless the union is widened. This is a real, small, concrete design consequence of D327. |
| Bot profiles | `rfc/bot-policy.md:88,157-159` | Human baseline / Guarded human / Pawn-heavy — **all three Maia-backed** | **All three are unavailable in every tier.** `apps/server/src/bot-policy-catalog.ts:296` ships an empty catalog today (`compileBotPolicyCatalog([])`), so nothing regresses; but the profile roster can never cover variants. |
| Engine identity | `apps/server/src/opponent-selector.ts:532-538` | `perfect_tablebase` → `"Syzygy (tablebase.lichess.org/standard)"` | The string says `/standard`. Honest for 960; a lie for Tier 2. |

### §3.3 What chessops already implements — for free

`chessops@0.15.1` (`packages/runtime`, `packages/schema`, `apps/server`, `apps/web` all pinned).
`node_modules/.pnpm/chessops@0.15.1/.../src/variant.ts` exports **7 variant `Position` subclasses**
plus two constructors. Measured: all 8 rulesets construct and generate legal moves.

| chessops symbol | `Rules` token | Measured `defaultPosition` legal-dest count | Our tier |
|---|---|---|---|
| `Chess` (`src/chess.ts`) | `'chess'` | 20 | **Tier 1 — and this class is already 960-general (§4)** |
| `Crazyhouse` (`variant.ts:7`) | `'crazyhouse'` | 20 | Tier 2 |
| `Atomic` (`:18`) | `'atomic'` | 20 | Tier 2 |
| `Antichess` (`:31`) | `'antichess'` | 20 | Tier 2 |
| `KingOfTheHill` (`:46`) | `'kingofthehill'` | 20 | Tier 2 |
| `ThreeCheck` (`:55`) | `'3check'` | 20 | Tier 2 |
| `RacingKings` (`:66`) | `'racingkings'` | 21 | Tier 2 |
| `Horde` (`:79`) | `'horde'` | 8 | Tier 2 |
| `setupPosition(rules, setup)` (`:91`) | — | the one-line generalisation of `positionFromFen` | — |
| `defaultPosition(rules)` (`:90`) | — | | — |
| `parseVariant(header)` (`src/pgn.ts:614+`) | — | maps PGN `Variant` headers to `Rules` | §6 |
| `lichessRules(variant)` (`src/compat.ts:63`) | — | maps Lichess variant keys to `Rules` | §6 |

**Free**: legal move generation, check/mate/stalemate, SAN, FEN, PGN, and the drop/pocket model for
Crazyhouse, in **8 of the 10 mechanics in §1.1's table**.
**Not free, at any price from this library**: **Duck Chess** and **Fog of War** — `parseVariant`
returns `undefined` for both (measured). Fog of War is not a move-generation change at all (it is
information hiding) and its *idea* is already adopted as the suppressor boss
(`rfc/campaign-core.md:219-221`); Duck Chess would need a bespoke move generator.

**The honest reading of "free":** chessops gives us the **rules** for free and **nothing else**.
Every instrument that makes this product what it is — Maia, Syzygy, the explorer, the collectors —
is a separate, standard-chess-only asset. §1.2's `:1141-1143` killer stands for Tier 2 precisely
because move generation was never the expensive part.

### §3.4 Chessground

`@lichess-org/chessground@10.1.1` (`apps/web/package.json:14`).

| Feature | file:line | Status |
|---|---|---|
| Board geometry | `src/types.ts:109-110` — `files` a–h, `ranks` 1–8 | **Fixed 8×8.** Tier 3 blocker. |
| Piece roles | `src/types.ts:108` — 6 roles | **Fixed.** Fairy-piece blocker. |
| Crazyhouse drops | `src/state.ts:82,164` — `dropmode` | **Ships.** |
| Castling | `src/board.ts:81-100` `tryAutoCastle`, default `autoCastle: true` (`src/state.ts:122`) | **960-correct by construction.** The e-file rewrite at `:90-93` fires only when the destination is *empty*; king-takes-rook has an occupied destination, so it falls through to the rook branch at `:94` and castles correctly. |
| `rookCastles` | — | **Removed in v10.** Present in `chessground@9.2.1` (also in the store, unused). Consequence: **king-takes-rook is now the only castling input chessground supports**, which independently confirms [[D1029]]. |

---

## §4. The Chess960 special case — measured, not argued

**The claim to test:** Chess960 is the only variant where the *rules* are standard and only setup +
castling differ, so the entire detector/evidence stack survives.

**Method:** a disposable vitest probe at HEAD `08d6b7d` against the installed `chessops@0.15.1` and
the shipped `parsePgnMainline`, run and deleted (§0). Results verbatim below.

### §4.1 Does `Chess` already support 960 via `Setup`? — YES

```
--- 960 a-side, king b1 rook a1 :: 1k6/8/8/8/8/8/PPPP4/RK6 w Q - 0 1
  castlingRights(rook squares): [ 0 ]
  b1a1: castlingSide=a  normalized=b1a1  isLegal=true  san=O-O-O
--- 960 h-side, king b1 rook h1 :: 1k6/8/8/8/8/8/4PPPP/1K5R w K - 0 1
  castlingRights(rook squares): [ 7 ]
  b1h1: castlingSide=h  normalized=b1h1  isLegal=true  san=O-O
  b1g1: castlingSide=undefined            isLegal=false
--- Shredder-FEN rights :: 1k6/8/8/8/8/8/4PPPP/1K5R w H - 0 1
  parse ok: true   rights: [ 7 ]   re-emitted FEN: ... w K - 0 1
--- full 960 start :: bbqnnrkr/pppppppp/8/8/8/8/PPPPPPPP/BBQNNRKR w KQkq - 0 1
  parsed OK, castlingRights: [ 5, 7, 61, 63 ]
```

**Findings:**

1. **`Chess.fromSetup` needs no change.** A randomised back rank parses and plays. `positionFromFen`
   (`packages/runtime/src/chess.ts:4-10`) works on 960 FENs **as written, today**.
2. **chessops stores castling rights as a `SquareSet` of ROOK SQUARES**, not `KQkq` flags
   (`src/chess.ts:54,116`). It is 960-general *by data model*, not by a variant flag.
3. **`parseCastlingFen` accepts both dialects** (`src/fen.ts:86-109`): `KQkq` (X-FEN, outermost-rook
   interpretation) and Shredder file letters `A-Ha-h`. Shredder input round-trips to `KQkq` output
   when unambiguous — **lossy in notation, lossless in meaning**, so `canonicalFen` and
   `transposeKey` (`chess.ts:12-19`) stay stable and correct.
4. **A castle in a position where the king does not move at all is handled correctly** (the
   `BBQNNRKR` case: king g1, `kingCastlesTo(white,'h') = g1`, rook h1 → f1).

### §4.2 The castling convention — [[D1029]] matches the library exactly

`design/BACKLOG.md:370` ([[D1029]], today): *"**keep the Chess960-general castling convention**…
king-takes-rook is the only castling notation that survives a randomized back rank. … **move
identity** = king-takes-rook (`e1h1`) … **semantic projection** = the king's destination square …
**display** = SAN `O-O`."*

Measured on the standard board (`4k3/8/8/8/8/8/PPPPPPPP/R3K2R w KQ - 0 1`):

```
  e1g1: castlingSide=h  normalized=e1h1  isLegal=true  san=O-O
  e1h1: castlingSide=h  normalized=e1h1  isLegal=true  san=O-O
  e1c1: castlingSide=a  normalized=e1a1  isLegal=true  san=O-O-O
  e1a1: castlingSide=a  normalized=e1a1  isLegal=true  san=O-O-O
```

`normalizeMove` (`src/chess.ts:614-622`) **converts the standard dialect INTO king-takes-rook** —
king-takes-rook is chessops' canonical internal form, and `isLegal` (`:387`) accepts both.
**D1029 costs nothing to honour and would cost a rewrite to reverse.** `sourcing/legal-moves.ts:10-27`
already emits the canonical form; `board-input.ts:205-207` is the one site that rewrites away from
it, and D1027/D1029 already own removing it (`planning/codex-queue.md:115-145`).

### §4.3 What Chess960 needs — the complete list

| # | Need | Where | Size |
|---|---|---|---|
| 1 | **Amend the published refusal** — `UCI_Chess960` `disposition: "refused"` → `reached` (or `unmeasured`), with a new reason | `apps/server/src/capabilities.ts:133` | 1 line + the C14 documentation act. **This is a decision, not work.** |
| 2 | **Set the engine option.** `spec.options` pass-through is already generic | `apps/server/src/engine-supervisor.ts:331` | config only |
| 3 | **Lift the import refusal** for `Chess960` / `Fischerandom` | `apps/server/src/pgn-import.ts:32-35` | ~3 lines (§6) |
| 4 | **Generate/store a 960 start.** No shipped symbol produces a random 960 back rank; chessops has none either | new — a ~20-line `scharnagl(n)` position generator, or accept a pasted FEN and skip generation entirely for v1 | small |
| 5 | **Declare the variant on the run.** A `rules` field on `RunStart` — or, for 960 only, **nothing at all**, since the FEN is self-describing | `packages/runtime/src/types.ts:65-68` + one storage column | small; **optional for v1** |
| 6 | **`chessgroundDests` opts.** Pass `{ chess960: true }` for 960 runs | `apps/web/src/lib/board-model.ts:64` | 1 line |
| 7 | **Remove the e-file castling rewrite** (already owned by D1027/D1029) | `apps/web/src/lib/board-input.ts:205-207` | already scheduled |
| 8 | **Widen the explorer variant param** (optional — buys 960 opening stats) | `apps/server/src/sourcing/explorer.ts:67` | 1 line |
| 9 | **Suppress the Maia-backed modes** in a 960 session, honestly and visibly | `packages/runtime/src/types.ts:76-78`, `opponent-selector.ts:521-530` | small, but §7 gap 3 |
| 10 | **Pack lint** — either widen *"parses the start as legal standard chess"* or exclude variant packs from packs entirely in v1 | `docs/drill-pack-format.md:171` | design fork |

**Honest cost estimate.** Items 1, 2, 3, 6, 7 are **five one-to-three-line edits plus one owner
decision**. Item 4 is the only genuinely new code and it is ~20 lines (or zero, if v1 accepts pasted
960 FENs). Items 5, 8, 9, 10 are small and partly optional.

**Verdict: yes — Chess960 is plausibly the cheapest real feature in the backlog.** The reason is
structural, not lucky: chessops was written by the Lichess authors for a 960-native server, so the
960 generalisation was *already paid for* by the dependency we chose. What is **not** cheap and must
not be hidden: **Maia goes dark**, so `human_common`, `theory_strict` and `practical_resistance`
are unavailable and Just Play in 960 offers `strong_engine` alone (§3.2). That is a real product
degradation and it is the thing to put in front of the owner (§7 gap 3).

### §4.4 The two 960 defects that exist at HEAD

| Defect | Evidence | Severity |
|---|---|---|
| `board-model.ts:64` calls `chessgroundDests(chess)` with no opts, which appends phantom `c1`/`g1` king destinations for **any** e-file king (measured: default `['a1','d1','f1','h1','c1','g1']` vs `chess960:true` `['a1','d1','f1','h1']`) | measured §4.2 | Latent. Harmless today (standard chess wants them); would offer illegal dests in a 960 position with a king on e1. One-line fix. |
| `sourcing/ledger-validation.ts:24` hard-pins `pathname !== "/standard"` on tablebase provenance | read at HEAD | Latent. Blocks any future variant tablebase endpoint. Irrelevant to 960 (which *is* standard). |

---

## §5. Campaign fit

The accepted vocabulary. `design/06-campaign.md:371-376` — four encounter classes:

| Class | Object | Bounded by | Sealed by |
|---|---|---|---|
| **Authored encounter** | pack | `plyHorizon` | `ObjectiveState` from `successConditions`, stored as `sealedState` |
| **Boss game** (Act II rated boss) | `position` session | the rules of chess | `terminalOutcome` |
| **Prediction encounter** (solitaire nodes, [[D869]]) | a fixed recorded game | the game's own length | a **prediction-score threshold** over `prediction.recorded` events against the human distribution |
| **Survival encounter** ([[D886]]) | an unbounded run | nothing but failure | a **score threshold over an unbounded run** |

`rfc/campaign-core.md:108` closes the enum at **one member in v1**: `encounter: { kind: "pack"; packId: string }`,
with `:115-117` — *"adding `position` (rated boss), `prediction` or `survival` is a schema change
belonging to the Discharge rows."* Deferred shapes 3–4 are **Discharge D2**
(`rfc/campaign-core.md:489`): *"each needs a seal mechanism absent at HEAD (the prediction-score
threshold must be authored-parameter-shaped and reconciled with format v0.9's no-verdict rule;
survival needs grounded counters and an unbounded-run objective), and each **re-cuts its formats as
play-the-consequence, never find-the-tactic**."*

### §5.1 Verdicts

| Candidate | Campaign encounter class? | Standalone mode? | Reasoning |
|---|---|---|---|
| **Chess960** | **YES — as a shape-2 `position` node, or a run modifier.** Not a new class. | **YES — Just Play, primary.** | It is standard chess with a shuffled start. `design/06-campaign.md:259-269` ([[D887]]) permits it outright: *"the campaign may bend **material and position** freely"* — a 960 back rank **is a position**, not a board or piece-set change. It sits **inside the evidence plane**. Blocked only by campaign-core's one-member enum, which D1 already owns for `position`. Also the natural [[D334]] *"variant run"* unlock: *"winning may unlock CONVENIENCE and VARIETY, never CONTENT."* |
| **Solitaire chess** ([[D869]]) | **YES — shape 3, prediction encounter.** Already in the table at `06:375`. | **YES — [[D870]] and [[D869]] both say both.** `training-mode-variants.md:573-575` ranks imported-game solitaire the **best standalone mode**. | Needs the seal (§5.2). |
| **Band-split solitaire** ([[D888]]) | YES — a shape-3 variant | YES | *"unique to us by construction"* (`training-mode-variants.md:511-517`); learner-private per [[D843]]. |
| **Avoid-the-blunder / survival** ([[D870]], [[D886]]) | **YES — shape 4**, deferred at D2 | YES | Grounded counters exist ([[D718]] negative reading, `threat@1`); the unbounded-run objective does not. |
| **Reduced armies / pawns-only** ([[D873]]) | **YES, unrestricted** | YES | `planning/campaign/rfc-derivation.md:457` — *"**Works unchanged** … tablebase turns **on** at ≤7 units"*. **Not a variant.** Legal standard positions. The single highest evidence-per-effort item in the whole family. |
| **King of the Hill / Three-check** | **Conditionally** — as a shape-2 node with `terminalOutcome` only | Marginal | Rules ship free (§3.3). Everything else is dark: no Maia, wrong Stockfish eval, no tablebase. Must be marked **play, never training** ([[D887]]). A boss whose result cannot be rated. |
| **Crazyhouse / Atomic / Antichess / Horde / Racing Kings** | **Only as evidence-dark play nodes** — *"may seal no verdict, credit no skill, and gate no content — but may pay out cosmetic rewards"* (`06:259-269`) | Marginal | Same as above, further out. Stockfish's number is not merely absent but **wrong**, which is worse. |
| **Duck Chess / Fog of War** | **NO — refused in literal form.** | NO | No library support (§3.3); and the *idea* is already adopted as the suppressor boss (`campaign-core.md:219-221`), which is strictly better (`fun-mechanics:1499-1502`). |
| **Fairy pieces / smaller boards** ([[D873]]) | **NO for smaller boards** (breaks at the first symbol). Fairy pieces **only** as marked play, Fairy-Stockfish-adjudicated | NO | `training-mode-variants.md:367-395`. [[D874]]'s transformation — *"you obtain YOUR BISHOP"* (progressive armies) — is the version that stays inside the evidence plane and should be preferred. |
| **Westernised xiangqi / shogi** ([[D328]]) | **NO** | **YES, as a separate evidence-dark mode** — which is what the owner asked for | Nothing survives but board + bot, and the owner **already accepted that trade**. The open question is engineering shape, not desirability. |

### §5.2 Solitaire chess — the scoring source, pinned (law 8)

**Law 8 requires the score come from a measurement, never from a judgement.** The source, named:

| Element | Symbol / source | Status |
|---|---|---|
| **The prediction record** | `prediction.recorded` event; `predictedMass` and `predictedRank` — `packages/runtime/src/types.ts:233-234`; schema `schemas/drill_run.schema.json:390,616` | **Ships.** |
| **The distribution compared against** | **Maia policy mass** at the selected band, recorded per candidate. Capability `Maia / policy mass` — `disposition: "reached"`, *"Recorded on opponent selections"*, `apps/server/src/capabilities.ts:135` | **Ships, reached.** |
| **The second grounding** | **The move actually played in the source game** — comparison-to-actual-game, from the imported PGN mainline | **Ships** via `parsePgnMainline` / `importGame`. |
| **What is NOT the source** | Stockfish `bestmove` / MultiPV rank — `disposition: "refused"`, *"Move verdicts are not condition measurements"* (`capabilities.ts:123`); and any LLM judgement (law 8) | **Refused, correctly.** `design/BACKLOG.md:1333` notes `grading.source: "engine"` *"is not backed — the strong-engine profile ships `multiPv: 1`"*. |

**The wall a prediction seal must cross**, `docs/drill-pack-format.md:15-17`:
> *"Version 0.9 removes prediction `grading`. A prediction interaction carries only `type: prediction`
> and optional `flipBoard`; **recorded policy mass and rank are shown as numbers and never turned
> into a correctness verdict**."*

**This is the whole difficulty of D869 and it must not be papered over.** A prediction-score
threshold *is* turning mass and rank into a verdict. The reconciliation available — and it is
[[D869]]'s own framing (*"law-8-clean by construction"*) — is that the seal compares against
**the move played in the recorded game**, a fact about that game, not an opinion about the move;
Maia's mass then supplies *context* ("the 1500 crowd found it 12% of the time") without ever
grading. **An RFC author must state which of the two is the seal and which is the colour**, and
`campaign-core.md:489` (D2) already demands exactly that reconciliation.

**Second gate:** `apps/server/src/service.ts:1511-1512` requires a **registered pack** carrying an
authored `interaction.type === "prediction"` checkpoint. Imported games — solitaire's natural and
free corpus — therefore **cannot record a prediction today**. That is [[D860]]'s "quadruply dead"
(`design/BACKLOG.md:417`); its cited line `service.ts:1204` has drifted to `:1511`.

---

## §6. Import and analyse — *"play/import/analyse fantasy games"*

### §6.1 What happens today — measured

Probe against the shipped `parsePgnMainline` at HEAD:

```
Variant (absent)      => ACCEPTED  rootFen: rnbqkbnr/... w KQkq - 0 1
Variant Standard      => ACCEPTED
Variant From Position => ACCEPTED
Variant Chess960      => REJECTED: Unsupported PGN variant: Chess960
Variant Crazyhouse    => REJECTED: Unsupported PGN variant: Crazyhouse
Variant Atomic        => REJECTED: Unsupported PGN variant: Atomic
real 960 PGN (valid FEN + SetUp) => REJECTED: Unsupported PGN variant: Chess960
```

The refusal is three lines, `apps/server/src/pgn-import.ts:32-35`:

```ts
const variant = game.headers.get("Variant");
if (variant !== undefined && variant !== "Standard" && variant !== "From Position") {
  throw new PgnImportError(`Unsupported PGN variant: ${variant}`);
}
```

**A fully valid Chess960 PGN — correct `[FEN]`, `[SetUp "1"]`, legal moves — is rejected on the
header alone, even though every downstream symbol would have handled it.** That is the single
highest-value one-file change in this lane.

### §6.2 What chessops offers at the import boundary — measured

```
parseVariant:  Chess960 -> chess    Fischerandom -> chess
               Crazyhouse -> crazyhouse   Atomic -> atomic   Antichess -> antichess
               Horde -> horde   Racing Kings -> racingkings
               King of the Hill -> kingofthehill   Three-check -> 3check
               Duck Chess -> undefined   Xiangqi -> undefined
               Standard -> chess   From Position -> chess
startingPosition({Variant: "Chess960"}) with no FEN header
               => isOk: true, FEN = rnbqkbnr/... (the STANDARD position)
```

**Two findings:**

1. **`parseVariant` maps `Chess960` and `Fischerandom` to `'chess'`** (`src/pgn.ts:614-624`, which
   also accepts `wild/0`–`wild/8a`). chessops itself asserts that **960 is not a separate ruleset**
   — the strongest independent confirmation of §4's claim. Lifting the import refusal for 960 is
   *literally* adding two strings to an allow-list; nothing downstream changes.
2. **A `Variant: Chess960` header with no FEN yields the standard position.** The setup lives in
   the `[FEN]` header, not the variant tag. So an importer must **require `SetUp`/`FEN` for 960**
   and reject a 960 header without one, or it will silently import a standard game. §7 gap 12.

### §6.3 Broadcast / live-sources ingestion

`rfc/live-sources.md:3` (accepted 2026-08-22), Phase A finished-round ingestion.

| Question | Answer | Citation |
|---|---|---|
| Does the broadcast path add its own variant logic? | **No.** `splitBroadcastRound` performs *"**no** chess validation; `parsePgnMainline` remains the sole legality authority"* | `rfc/live-sources.md:98-103` |
| Where does a variant game die? | At **import of the selected board**, not at round fetch — `pgn-import.ts:33-34` → `INVALID_REQUEST` | `rfc/live-sources.md:195-199` |
| Is there a pre-filter on the round? | **No.** No board-list filtering by `Variant`; a variant board survives the split and fails only when the learner picks it | derived from `:98-103` |
| Measured against real broadcasts? | Yes — *"`[Variant "Standard"]` on every game (guard: `pgn-import.ts:32-35`)"*, 20/20 games parsed | `planning/live-sources/rfc-derivation.md:62-64,24` |
| Second ingestion path? | `apps/server/src/live-session.ts:237,241` `importLeg` also calls `parsePgnMainline` (without `requireMoves`) — **same gate, so one fix covers both** | read at HEAD |
| Storage | `imported_games.source_kind TEXT NOT NULL CHECK (source_kind IN ('pgn_paste','lichess_url'))` at `storage.ts:3356`; no variant column | `rfc/live-sources.md:200-211` |

**Consequence:** Lichess runs Chess960 broadcasts (and the Lichess4545 960 league,
`league-as-return-loop.md:49-58`). Today those rounds fetch, split, and then fail per-board with an
opaque message. **Fixing `pgn-import.ts` fixes paste, Lichess-URL, broadcast and Arena-leg import
in one edit** — a strong argument for doing it first and separately.

**Warning for an RFC author:** widening `pgn-import.ts` to Tier 2 variants would *silently* let an
atomic game into `importGame` → `createRun` → the story evidence pass → Stockfish and Maia. The
guard must therefore widen **per-tier and explicitly**, never to "any variant chessops knows".
§7 gap 13.

---

## §7. Gaps — what an RFC author must answer

**Owner-level forks are marked ⚖. Traps are marked ☠.**

| # | Gap | Kind |
|---|---|---|
| 1 | ⚖ **Does the owner accept a Maia-dark Chess960?** In 960 the human-opponent modes are unavailable — Just Play would offer `strong_engine` only. This is the fork [[D1030]] says was never put; `capabilities.ts:133`'s product rationale asserted the answer instead of asking it. **Nothing else in this lane should be drafted before this is ruled.** | ⚖ |
| 2 | ⚖ **Scope of the first variant RFC**: Chess960 alone, or a `rules` axis that admits chessops' 7 at once? Cheap-vs-general. Recommendation §8: 960 alone. | ⚖ |
| 3 | **How is a dark rung *shown*?** D327's own principle — *"a variant should declare which rungs survive it, rather than the product pretending the ladder is intact"* — needs a surface. `design/06-campaign.md`'s difficulty-availability label (measured/authored/neither) is the named precedent. What is the vocabulary and where does it render? | design |
| 4 | **Where does the variant live in the data model?** `RunStart.rules`? A run column? Both? Note `variant` is taken three times (`schedules.variant`, `retryVariants`, `variantOf`) — **`rules` is proposed** as the non-colliding term (it is chessops' own). | schema |
| 5 | **Does a 960 start need generating, or is pasted-FEN enough for v1?** No shipped symbol produces a Scharnagl position; chessops has none. | scope |
| 6 | **X-FEN or Shredder on the wire?** Both parse (§4.1); chessops emits `KQkq` when unambiguous. Pin one for storage and one for display, and record that the round-trip is notation-lossy. | contract |
| 7 | ⚖ **Do 960 packs exist at all in v1**, or is 960 Just-Play-and-import only? The pack lint says *"legal standard chess"* (`docs/drill-pack-format.md:171`) and every one of the 47 packs is standard. | ⚖ |
| 8 | ⚖ **Is a 960 result rated?** Glicko-2's arithmetic works, but the opponent must be measured; with Maia dark there is no calibrated human opponent. `capabilities.ts` already refuses *"rating from authored, engine- or tablebase-adjudicated outcomes"*. Likely answer: **unrated**, and say so. | ⚖ |
| 9 | **Explorer widening**: is 960 opening data wanted (`explorer.ts:67`), given that 960's *point* is having no book? Possibly a deliberate no. | design |
| 10 | ☠ **Law 8 in Tier 2 — the real honesty boundary.** Maia and Stockfish are **standard-chess models**. In atomic, antichess or crazyhouse, Stockfish's cp is not *missing*, it is **wrong**, and rendering it would be the *"Stockfish: +0.54 / Maia: 31%"* dashboard the CLAUDE.md anti-pattern names. Any Tier-2 RFC must **suppress the instruments, not merely caveat them**. | ☠ |
| 11 | ☠ **`00-thesis.md` prohibitions.** A variant must not become "an engine review screen with a rewind button", must not become a tactics trainer, and must be re-cut as **play-the-consequence** (`campaign-core.md:385-389`). | ☠ |
| 12 | ☠ **A `Variant: Chess960` header without a `FEN`/`SetUp` yields the standard position** (measured §6.2). An importer that lifts the guard without requiring the FEN will silently import standard games as 960. | ☠ |
| 13 | ☠ **Do not widen `pgn-import.ts` to "any variant chessops knows".** A Tier-2 game admitted there flows straight into Stockfish/Maia and the story pass (§6.3). Widen per-tier, explicitly. | ☠ |
| 14 | ☠ **C14's documented act.** `capabilities.ts:133` must be *amended with a stated reason*, not quietly deleted (`fun-mechanics:128`). | ☠ |
| 15 | **`ledger-validation.ts:24` pins `/standard`** on tablebase provenance. Irrelevant to 960; a hard blocker for any Tier-2 tablebase. Decide now whether to generalise or to record the pin as intentional. | contract |
| 16 | **Solitaire's seal vs the v0.9 no-verdict rule** (§5.2). Which is the seal — the played move, or Maia's mass? `campaign-core.md:489` (D2) demands the reconciliation. | ⚖/design |
| 17 | **Solitaire's pack gate** (`service.ts:1511-1512`) must be lifted for imported games, which is [[D860]]'s dead mechanism. Independent of every other item here — it could ship alone. | scope |
| 18 | **[[D328]]'s one cheap measurement is still owed**: are `Node.fen` and `transposeKey` the *only* FEN-shaped types in the branch runtime? If yes, xiangqi/shogi is an adapter over SFEN. If the coupling is diffuse, **say out loud that D328 is a second product sharing a shell** (`work-register.md:163-167`). | measurement |
| 19 | **Duck Chess and Fog of War have no library support** (measured §3.3). Fog's idea already ships as the suppressor boss; Duck would need a bespoke generator. Confirm both stay refused in literal form. | scope |
| 20 | **The §4/§6 probe's log entry is owed** to `planning/exploration/log.md` per RFC-0000's harness clause. Not written here — the log was held dirty by a concurrent agent and law 7 makes it append-only. | process |
| 21 | **Citation drift to repair when any of these docs is next edited**: `fun-mechanics:128` and `planning/campaign/rfc-derivation.md:460` cite `capabilities.ts:105` (now **:133**); `design/BACKLOG.md:417` cites `service.ts:1204` (now **:1511**); `planning/campaign/rfc-derivation.md:121,125` cite `BACKLOG.md:264/265` (now **274/275**); [[D327]] says 13 chessops importers (now **24**) and claims a storage `variant` column that **does not exist** in the chess sense. | process |

---

## §8. Recommended sequencing

Ranked by **owner interest × cost × how much of the stack survives**. Owner interest is taken from
the ledger dates and the verbatim asks, not inferred.

| Rank | Item | Owner interest | Cost | Stack surviving | Why here |
|---|---|---|---|---|---|
| **1** | **Chess960** ([[D327]], [[D1031]]) | Named twice, including today's *"why only 960"* — which presupposes 960 | **Lowest in the family.** Five 1–3 line edits + one ~20-line generator (or zero, if v1 accepts pasted FENs) | **Everything except Maia** | The whole detector/evidence stack survives (§2.2, §4). chessops is 960-general *by data model* (§4.1) and today's [[D1029]] already ruled the castling convention the library uses. `work-register.md:169-172`: *"the natural probe for the whole cluster, because it tests the **variant plumbing** without testing the **detector** question at all."* |
| **2** | **Imported-game solitaire** ([[D869]]/[[D860]]) | Owner: *"I really like the idea of 'solitaire chess'… as a separate mode"* | **Low but not trivial** — the mechanism ships dead; the seal is the work (§5.2) | Full — it *is* standard chess | Ranked best standalone mode by the research (`training-mode-variants.md:573-575`); scoring is law-8-clean by construction; corpus is free. **Its blocker is a design reconciliation (gap 16), not engineering.** Independent of every variant question — it could ship before, after, or beside 960. |
| **3** | **Reduced armies / pawns-only** ([[D873]]) | Owner asked, with the balance clause | **Near-zero** — legal standard positions, no code | **Full, and the tablebase turns *on*** below 8 units | `planning/campaign/rfc-derivation.md:457`: *"**Works unchanged**"*. The highest evidence-per-effort item in the entire family, and the *"we don't need to forget we're learning chess here"* clause's best answer. Not a variant at all, which is exactly why it ranks. |
| 4 | **Chess960 broadcast/live import** | Implied by *"play/import/analyse fantasy games"* | Falls out of #1 free (`pgn-import.ts` fixes four paths at once, §6.3) | Full | Sequence as part of #1, not after it. |
| 5 | **Band-split solitaire** ([[D888]]) | Derived, not owner-uttered | Medium — multi-band Maia query is new | Full | *"Unique to us by construction."* Wait for #2's seal. |
| 6 | **King of the Hill, Three-check** (Tier 2, cheapest goal-relocators) | *"all these other variations"* | Rules free (§3.3); **all evidence work** is the cost | Move gen only | Only after gap 3 ships a "which rungs survive" surface, and only as `terminalOutcome` play nodes. |
| 7 | **Crazyhouse, Atomic, Antichess, Horde, Racing Kings** | same | Rules free; evidence is wrong-not-missing (gap 10) | Move gen only | Marked play, never training. Cosmetic rewards only ([[D887]]). |
| 8 | **Westernised xiangqi / shogi** ([[D328]]) | Owner asked, **accepting degraded support** | **Unknown until gap 18 is measured** — weekend adapter or second product | Board + bot only | Take the cheap measurement (gap 18) *now*, independently; it is one afternoon and it decides the shape of the row. Do not draft before it. |
| — | **Fairy pieces** ([[D873]]) | Owner asked | Fairy-Stockfish is a second binary; chessground has 6 fixed roles | **Nothing** | Prefer [[D874]]'s transformation — progressive armies, *"you obtain YOUR BISHOP"* — which stays inside the evidence plane and delivers the same feeling. |
| — | **Smaller boards** | Owner asked | Breaks at the first symbol (`parseFen`, chessground 8×8) | **Nothing** | Refused by `training-mode-variants.md:367-378`. The 8×8 mini-game family is the substitute. |
| — | **Duck Chess, Fog of War (literal)** | Research-surfaced | No library support | — | Fog's *idea* already ships as the suppressor boss (`campaign-core.md:219-221`) — strictly better. Keep both refused in literal form. |

### §8.1 Chess960 vs solitaire vs fairy pieces — the head-to-head the brief asked for

| | Chess960 | Solitaire chess | Fairy pieces |
|---|---|---|---|
| Owner said it | 2026-08-16 ([[D327]]), 2026-08-23 ([[D1031]]) | 2026-08-22 ([[D869]]) — *"I really like the idea"* | 2026-08-22 ([[D873]]) |
| Engineering cost | **~5 small edits + ≤20 new lines** | mechanism ships; seal is new | **second engine binary + new piece model in two libraries** |
| Design cost | one owner fork (gap 1) | **one hard law-8 reconciliation** (gap 16, `campaign-core.md:489`) | the balance law already answers it: evidence-dark |
| Evidence surviving | everything but Maia | **everything** | **nothing** |
| Campaign fit | shape 2 / run modifier — already permitted by [[D887]] | **shape 3, already in the `06:371-376` table** | play-only, seals nothing |
| Novelty vs the field | none — Lichess and chess.com both ship it | **high** — no competitor holds per-candidate multi-band mass | low |
| **Verdict** | **First.** Cheapest, most stack survives, owner named it twice, and its castling convention was ruled today. | **Second, and can run in parallel** — it shares no code with #1 and its blocker is a ruling, not engineering. | **Not now.** Take [[D874]]'s transformation instead. |

**The one-sentence recommendation:** draft **Chess960 alone** as the first variant RFC — after the
owner rules gap 1 — because it is the only member of the family where the entire evidence stack
survives, the shipped dependency already implements it, and today's castling ruling already points
the same way; and run **imported-game solitaire** beside it as an independent lane, because it is
the owner's stated favourite and shares no code with the variant axis at all.

---

## Provenance

Derived at HEAD `08d6b7d` on 2026-08-23. Code claims marked with `file:line` were read at HEAD;
the §4 and §6.2 measurements come from a disposable vitest probe run against the installed
`chessops@0.15.1` and the shipped `parsePgnMainline`, deleted after the run (§0, gap 20).
Research claims carry the dossier's own evidence labels. Nothing here amends a design doc (law 5)
or a ledger row; the obligations this derivation creates are listed as gaps 20–21.
