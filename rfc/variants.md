# RFC: Variants — per-surface admission, declared rungs, and Chess960 as the v1 member

- **Status:** draft — **returned to author 2026-08-23; independent cross-review re-derived 97 claims
  and failed 27, of which six are return-class.** The mechanism is sound and most of it is now
  *measured* rather than argued: `startingPosition({Variant:"Chess960"})` really does return the
  standard position (run at 0.15.1), the `chessgroundDests` refutation holds across 8904 driven
  gestures with zero mismatches, castling rights really are a `SquareSet` of rook squares, and the
  claims decision `none` is correct at source. **What returns it:** (1) **Open question 1 argues a
  fork the owner has already closed** — [[D1153]] ruled *"don't accept the Maia-dark gap — compose a
  bot that does not depend on Maia"*, the commissioned research returned the same day ([[D1160]],
  `design/research/non-maia-bot-composition.md:511-514`), and its recommendation is not in this
  document; OQ1's *"the mechanism is fully determined either way"* is false — the ruled direction
  costs a new `BotPolicyInput` member, a cp→mass base layer, a sampler and a positive control
  (`:505`), none of it budgeted. (2) **Criterion 5 has no mechanism and does not close the trap it
  names** — `availableModes()` takes no position argument, [[D1161]]'s named remedy
  `policyUsesMaiaBand` is **dead code**, and two paths hardcode `human_common` regardless of the
  run's policy, so a 960 FEN still reaches Maia. (3) **The far end is worse than "goes dark"** —
  measured over all 960 arrangements, the pinned sidecar raises **0** and silently deletes **all**
  castling rights in **858**, then `uci.py:443-444` bare-`return`s and answers `go` from a **stale
  board**. (4) **§5's amendment describes machinery that does not exist** — all 44 disposition rows
  are static literals. (5) **Criterion 2 is unsatisfiable by identity** ([[D984]]) — a 960 start FEN
  *is* a legal standard-chess position under the only predicate the lint has, so no 960 fixture can
  make its refusal fire. (6) **The corrected criterion 12 is not failable** — see its own note. Every
  other finding is repaired in place. *(Prior line for history: draft — 2026-08-23.)*
- **Author:** claude (drafted from `planning/variants/rfc-derivation.md`)
- **Created:** 2026-08-23
- **Design refs:** `design/06-campaign.md` §3 (the surface-scoped balance law, [[D1042]], at
  `:271-306`); the encounter-class table is **`design/06-campaign.md:439-444`, in §5** — corrected by
  cross-review from `§3 :371-376`, which was right when `rfc-derivation.md:363` was written at 14:26
  and moved twice the same afternoon (`:371-376` at HEAD is [[D1151]]'s catalogue ruling);
  `design/00-thesis.md` (the play-the-consequence identity and the tactics-trainer prohibition);
  `CLAUDE.md` law 8
- **Exploration gate:** opened for this lane by owner ruling [[D1093]] (*"make sure we have all the
  DEPTH and BREADTH"*), which together with [[D1031]] (the variant lane is a family) and [[D1042]]
  (the balance law) is the ruling RFC-0000 §Exploration gate requires. Recorded as a row so this
  document need not infer its own licence.
- **Depends on:** `rfc/exact-legal-mobility.md` (accepted 2026-08-23 — [[D1029]]'s king-takes-rook
  move identity, which this RFC consumes rather than re-argues); `rfc/live-sources.md` (accepted —
  the broadcast ingestion path this RFC's import fix also serves)
- **Parent / amends:** amends the published capability refusal at `apps/server/src/capabilities.ts:133`
  and the import guard at `apps/server/src/pgn-import.ts:32-35`
- **Supersedes / superseded by:** —
- **Planning:** `planning/variants/`

```tabiya-claims
none
```

## Summary

This RFC does two separable things.

**It states the admission law as a per-surface matrix** ([[D1042]]), so that "do we support
variant X" stops being a question with one answer. The same variant is refused in a drill pack,
optional in Just Play, accepted on import and analysis, and legitimate as a campaign run-modifier.
That structure — not a permitted-variants list — is the durable content here, and it is what lets
every later variant be admitted or refused without re-litigating the law.

**And it ships exactly one member: Chess960**, in Just Play and import only. Chess960 is the sole
variant where the rules *are* standard chess and only the starting arrangement differs, so every
detector, the phase model, Syzygy, the explorer and Stockfish all survive intact — measured, not
assumed (§3). The cost is unusually low because `chessops` was written for a 960-native server:
castling rights are already stored as a set of **rook squares** rather than `KQkq` flags, and
`normalizeMove` already converts the standard castling dialect *into* king-takes-rook, so
[[D1029]]'s ruling this morning is the form the library already uses internally.

**The honest cost, stated in the Summary because it must not be discovered later: Maia goes dark.**
Maia is trained on standard human games and a randomised back rank is out of distribution from move
one. Three of the five opponent modes depend on it, so a Chess960 Just Play session offers
`strong_engine` alone. That is a real product degradation, and whether it is acceptable is Open
question 1 — the fork [[D1030]] found was asserted rather than asked.

> **CROSS-REVIEW 2026-08-23 — RETURN-CLASS (1), and it rewrites this paragraph.** Two claims here
> fail at source. **(a) "It is not repairable by any work in this RFC" is false, and the owner has
> ruled it must be repaired.** [[D1153]], verbatim: *"well we just need 'bot capas'? Like don't we
> have special bots that consume evidence and shit? So we can make some that don't consume
> maia-produced evidence?"* — i.e. **don't accept the gap; compose a bot that does not depend on
> Maia.** The commissioned research returned the same day ([[D1160]],
> `design/research/non-maia-bot-composition.md`, 631 lines) and its recommendation is on file at
> `:511-514`: *"960 ships with an engine-composed opponent, disclosed and labelled uncalibrated,
> with the human-likeness measurement (§5) commissioned in parallel and its result binding on what
> the card may say."* Engine choice, `:551-553`: **Stockfish for Tier 1**, Fairy-Stockfish is a
> Tier-2 dependency. This document predates that return and does not carry it. **(b) The mechanism
> is NOT "fully determined either way"** (Open question 1): the ruled direction is priced at `:505`
> as one new `BotPolicyInput` member, a cp→mass base layer with its own sampler and positive
> control, and a `historyCapability` widening — none of which §3.6 budgets. **(c) The degradation is
> understated, not overstated** — see §3.7's note: the failure is a silently stale board answering
> `go`, not weak play.

Claims nothing versioned: no pack-schema lane (960 packs are deferred, §6), and no run-schema lane
(a Chess960 FEN is self-describing, §3.4).

## Motivation

`apps/server/src/capabilities.ts:133` ships `UCI_Chess960` as `disposition: "refused"` with the
reason *"The shipped drill format is standard chess only"*. That is a **product** judgement, it is
enforced at startup, and it was never put to the owner — the pattern [[D1030]]/[[D1037]] name, where
a refusal recorded in an artifact nobody reads forecloses a standing ask. The ask is standing:
[[D327]] (2026-08-16) *"what if I want in just play all these variations as well? if we're going to
add packs with ie fischer random or all these other variations"*, and [[D1031]] (2026-08-23)
*"why only 960? the idea was to offer many different variants…"*.

The research base was equally stranded. `design/research/fun-mechanics-outside-roguelikes.md`
§6a ranks Chess960 in the top three variants alongside Fog of War and Duck Chess as **legibility
mechanics** rather than power mechanics — *"the commercial proof that `06` §5's 'what escalates is
legibility, not power' is a real design axis in chess"* — with its reward named as **calculation
over recall**. That dossier is one of the 31 [[D1095]] found that concluded "worth building" and
had no RFC in any state.

The same dossier carries a sentence this RFC must correct rather than inherit:
*"A variant node has no grounded instrument behind it"* (`:1130-1133`). That is **true for Tiers 2
and 3 and false for Chess960**, and the derivation identifies it as the reason the lane sat
unrouted for a week.

## Specification

### §1 — The admission law is per-surface, not per-variant

Owner ruling [[D1042]], verbatim:

> *"again like for drill packs these are kinda useless right... but for normal play it should be an
> option if people want to do that... heck we can even do analysis on played/imported wierd games????
> and again for campaign mode, like unlocking a new hero in slay the spire changes the entire run
> structure, we can have these kind of weird campaign variations and more... we can go full game/fun
> with the campaign... as crazy as we want to... as long as the 'educational' run is the main one."*

**The normative matrix.** Admission is a property of the (variant, surface) pair. The same variant
appears in every row with a different answer:

| Surface | Admission | Why |
|---|---|---|
| **Drill packs** | **Standard chess only** | A drill's value is what the evidence stack can say about it. Where the detectors are dark, a drill teaches nothing it can ground — the owner's *"kinda useless"* |
| **Just Play** | **Any variant, as an option** | Play needs legality, not evidence |
| **Import / analysis** | **Accepted** | A played or imported game is a record of something that happened; refusing to read it asserts nothing and loses data |
| **Campaign** | **As far as we like** | A variant campaign is a **new-hero unlock** in the Slay-the-Spire sense — it changes the entire run structure, not a setting on the standard one |

*(Cross-review 2026-08-23: the campaign cell read **"Unrestricted, subject to §2"**. `design/06-campaign.md:291`
reads **"As far as we like"**, and §2.3 admits Tier 1 only — so the qualifier resolved the owner's
*"as crazy as we want to"* down to *Chess960 only*, **inside the cell that states the law**. That is
the same error criterion 12 was rewritten to prevent: a criterion may bound what we ship; it may
never bound what the owner has ruled — and neither may the law's own restatement. v1's shipped
member set is §2.3's business, not §1's. The other three rows join the design table exactly.)*

**The single constraint, normative:** the educational standard-chess run remains the MAIN one. A
variant campaign is an alternate character, never a replacement spine, and `design/06-campaign.md`
§3's laws bind inside every campaign — **an evidence-dark node seals no verdict wherever it sits.**

**What this replaces.** Any per-variant permit/refuse framing in earlier notes is superseded. There
is no "supported variants" list at product level; there is an admission matrix, and a variant's row
is filled in by measuring which rungs survive it (§2).

### §2 — Tiers, and the declared-rungs rule

[[D327]]'s frame, adopted as normative: *"the instrument stack degrades in TIERS… a variant should
declare which rungs survive it, rather than the product pretending the ladder is intact."*

| | **Tier 1** — rules identical, setup differs | **Tier 2** — move-set, goal or evaluation changes | **Tier 3** — different game |
|---|---|---|---|
| Members | **Chess960** (only true member) | Crazyhouse, Atomic, Antichess, Horde, Racing Kings, King of the Hill, Three-check | Xiangqi, shogi ([[D328]]); fairy pieces, non-8×8 boards ([[D873]]) |
| Move generation | ✅ `Chess`, unchanged | ✅ `chessops` ships 7 free | ❌ nothing |
| Branch runtime (rewind/fork/compare) | ✅ intact | ✅ intact — it is FEN-shaped, not rules-shaped | ⚠️ unmeasured ([[D328]], Open question 4) |
| Structural detectors | ✅ **all valid** | ❌ break per-variant, differently each time | ❌ none |
| Phase classification | ✅ valid | ❌ mostly meaningless | ❌ none |
| Tablebase | ✅ valid — a 960 endgame is a standard endgame | ⚠️ endpoints exist; our validator pins `/standard` | ❌ none |
| Stockfish | ✅ valid with `UCI_Chess960` | ❌ **wrong, not missing** | ❌ none |
| Maia | ❌ **dark** | ❌ dark | ❌ dark |
| **What the learner gets** | Evidence, grades, tablebase, explorer, full branch runtime. **Bots: `strong_engine` only** | Legal play, rewind, fork, compare, and their own eyes. **Marked play, never training** | Board and a bot, if one exists |

**§2.1 The declared-rungs obligation.** Every admitted variant declares, as data, which instrument
rungs survive it. A rung that does not survive is **suppressed, not caveated** — the surface does
not render it at all.

**§2.2 The Tier-2 honesty rule, and why it is stricter than "unavailable".** In Atomic, Antichess
or Crazyhouse, Stockfish's centipawn number is not missing — it is **wrong**, computed by a
standard-chess evaluator over a position whose rules it does not implement. A wrong number carries
the full authority of a right one. Rendering it would produce exactly the *"Stockfish: +0.54 /
Maia: 31%"* dashboard `CLAUDE.md` names as the anti-pattern this product must not become, with the
aggravation that the number is also false. **Tier 2 therefore suppresses the instruments rather
than annotating them**, and no Tier-2 surface may display an engine evaluation, a grade, a Maia
mass, or a tablebase verdict.

**§2.3 What v1 admits.** Tier 1 only. Tiers 2 and 3 are deferred behind Discharges D2 and D3; §2's
vocabulary exists now so that those RFCs argue from it rather than reinvent it.

### §3 — Chess960: measured, not argued

**§3.1 The library already implements it.** `chessops@0.15.1` stores castling rights as a
`SquareSet` of **rook squares**, not `KQkq` flags (`chessops/src/chess.ts:54,116`), so `Chess` is
960-general *by data model* rather than by a variant flag. `positionFromFen`
(`packages/runtime/src/chess.ts:4-10`) parses a randomised back rank and plays it **unchanged**.
`parseCastlingFen` (`src/fen.ts:86-110`) accepts both the `KQkq` X-FEN dialect and Shredder file
letters, round-tripping to `KQkq` when unambiguous — **lossy in notation, lossless in meaning**, so
`canonicalFen` and `transposeKey` (`chess.ts:12-19`) stay stable. Measured at 0.15.1 by cross-review:
`HFhf → KQkq`, `AHah → KQkq`, and the Shredder and `KQkq` spellings of one position yield an
**identical `transposeKey`**. The "when unambiguous" qualifier is load-bearing and correct —
`makeCastlingFen` (`fen.ts:270-289`) emits `K`/`Q` only for the *outermost* rook (`:278,:280`), so an
inner-rook right re-serialises as its own file letter (`R1R1K3` with the right on c1 → `C`) and never
collides with the a1 case. Round-tripping is idempotent.

**§3.2 The castling convention is the library's own.** `normalizeMove`
(`chessops/src/chess.ts:614-622`) converts the standard dialect **into** king-takes-rook:
`normalizeMove(e1g1) → e1h1`. King-takes-rook is chessops' canonical internal form and `isLegal`
accepts both dialects. [[D1029]]'s ruling therefore costs nothing to honour and would cost a
rewrite to reverse. This RFC **consumes** that ruling and adds nothing to it; `exact-legal-mobility`
owns the identity/projection/display split.

**§3.3 Independent confirmation from the other direction.** `parseVariant`
(`chessops/src/pgn.ts:615-674`; `Chess960` at `:618`, `Fischerandom` at `:624`, the shared
`return 'chess'` at `:637`) maps **`Chess960` and `Fischerandom` to `'chess'`** — the library
asserts that 960 is not a separate ruleset at all. That is the strongest available confirmation
that **Chess960 is not really a variant**.

*(Cross-review 2026-08-23 — the sentence originally continued "…that Tier 1 has **exactly one
member**", and **the same function refutes that half**. Run at 0.15.1, `parseVariant` returns
`'chess'` for sixteen spellings across more than one setup family: `chess`, `chess960`, `chess 960`,
`standard`, `from position`, `classical`, `normal`, `fischerandom`, `fischerrandom`,
`fischer random`, and **`wild/0`–`wild/8`, `wild/8a`** — the FICS/Lichess shuffle family, which is
Tier 1 by this RFC's own definition (rules identical, setup differs). The claim that survives is the
one actually needed: 960 is not a separate ruleset. Whether Tier 1 has one member or a dozen is not
settled by `parseVariant`, and §2's "only true member" cell should read "the only member v1 ships".)*

**§3.4 A Chess960 run needs no new persisted field.** The FEN carries the arrangement and the
castling rights; `transposeKey` and `canonicalFen` are stable across the notation round-trip
(§3.1). This RFC therefore claims **no run-schema lane**. Open question 3 records the condition
under which that changes: a Tier-2 variant is *not* self-describing (the rules are not in the FEN),
so the first Tier-2 RFC claims a lane for a `rules` field. **The term is `rules`** — chessops' own
word — because `variant` is taken three times already (`schedules.variant` at
`apps/server/src/storage.ts:4153`, an unconstrained nullable label sitting **beside** the
spaced-repetition `kind` column; `retryVariants` at `packages/schema/src/drill-pack/types.ts:256`;
`variantOf` at `:246`). [[D327]]'s claim that a chess-variant `variant` column already
exists is refuted ([[D1035]]).

*(Cross-review 2026-08-23, two corrections. **(a)** The parenthetical read *"which is the
spaced-repetition blocked/varied column"* — false: that is `kind` at `storage.ts:4152`
(`CHECK (kind IN ('blocked','varied'))`). `variant` at `:4153` is `variant TEXT,` — nullable, no
CHECK, `ScheduleRow.variant: string | null` (`storage.ts:496`), caller-supplied and passed through
REST unvalidated (`rest.ts:1535`). The naming argument survives; its stated reason did not. **(b)**
The nearest real collision for the proposed term is not listed: a `rules:` **evidence-ref namespace**
already ships and means something else (e.g. `"rules:material"`, `apps/server/src/guard.ts:173`;
`"rules:draw"`), alongside `rulesTier` and the `"rules_fact"` kind (`drill-pack/types.ts:236,349`).
No column or exported type named `rules` exists, so the term is free — but D2 should say which
`rules` it means.)*

**§3.5 The board layer needs no change, and this corrects the derivation.**
`chessgroundDests` (`chessops/src/compat.ts:26-44`) takes a **two-condition branch** at `:32` —
`!opts?.chess960` **and** the king is on the e-file — and then appends a phantom `c1`/`g1`
destination **only if** the a1/h1 rook square is itself already a legal destination (`:35-38`).
That last test gates the *push*, not the branch. A king on the e-file can reach a1/h1 **only** as a
castling move, so the push is gated on the castling rook actually sitting there *and* on that
castle being legal right now — which also guarantees c1/g1 is empty, which is precisely what makes
chessground's `:90-93` rewrite resolve to the right rook. In Chess960 the king's castling
destination is fixed at the c- or g-file by rule, so whenever a phantom is appended its output is
**correct**, in 960 as in standard chess. The derivation's §4.4 recorded this as a latent defect;
verified at source, it is not one, and the cost list loses an item.

*(Cross-review 2026-08-23 — conclusion CONFIRMED and now measured, stated conditions CORRECTED. The
paragraph originally listed the rook-square test as a third branch condition. Driven at 0.15.1 over
all 960 arrangements: with the king on the e-file the branch fired **204/204**, and a phantom was
appended in exactly **102** — those with a rook on a1/h1. Correctness was measured rather than
argued: 960 arrangements × 2 board fillings × 2 colours = **8904 king-destination gestures** driven
end-to-end through chessground's real `baseMove`/`tryAutoCastle` and diffed against chessops after
`normalizeMove`+`play` — **240 phantoms, 0 mismatches, 0 phantoms `normalizeMove` could not map to a
legal move**. The probes that could have broken it do not: king on e1 with the a-side rook on b1/c1/d1
→ branch fires, nothing pushed, dests are the raw king-takes-rook set; king e1 rook h1 with castling
blocked → h1 leaves the legal set and the phantom `g1` goes with it. Proposed row D1122 keeps its
conclusion and needs the same rewording.)*

**A completeness gap the refutation exposes, not a correctness one.** In 960 with the king on e1 and
the rooks **off** a1/h1, chessops itself accepts the familiar two-square gesture —
`normalizeMove(e1c1) = e1b1`, `isLegal` true — but `chessgroundDests` never offers `c1`, so the board
withholds a gesture the rules layer would take. Related nuance from `castlingSide`
(`chess.ts:606-612`): the standard dialect is recognised only when `|delta| === 2` **or** the
destination holds an own piece (`:609`), so §3.2's "isLegal accepts both dialects" holds wherever a
two-square gesture exists — a 960 king on f1 has no standard-dialect `g1` (delta 1 reads as a normal
king move). Neither is a defect in this RFC; both are owed a ledger row. Two consequences worth pinning:

- With the king off the e-file — the common 960 case — the branch never fires and the king's
  destinations are the raw king-takes-rook set, which chessground's `tryAutoCastle`
  (`@lichess-org/chessground@10.1.1/src/board.ts:81-108` — cross-review corrected from `:81-100`,
  which stops mid-function) castles correctly because it reads a rook
  at an **occupied** destination and skips its own e-file rewrite (`:90-93`, guarded on
  `!state.pieces.has(dest)` — this sub-pin is exact). Driven through the exported `baseMove`
  (`:110-125`): standard `e1×h1 → Kg1/Rf1` and `e1×a1 → Kc1/Rd1`; 960 `Kb1×a1 → Kc1/Rd1`,
  `Kg1×h1 → Kg1/Rf1` (king stays put), `Ke1×d1 → Kc1/Rd1`, `Ke1×f1 → Kg1/Rf1`.
- The familiar two-square king gesture in standard chess is what those phantom destinations
  preserve, so they must **not** be removed globally. `rookCastles` is absent from
  `@lichess-org/chessground@10.1.1` (verified: no occurrence in the shipped package), but the
  destinations serve the *board's accepted gesture*, not that removed option.

**§3.6 What Chess960 actually requires.**

| # | Obligation | Home | Size |
|---|---|---|---|
| 1 | Amend the published refusal with a stated reason (§5) | `apps/server/src/capabilities.ts:133` | **not 1 line — see §5's return-class note; the mechanism §5 describes does not exist** |
| 2 | Set `UCI_Chess960` on the engine spec; option pass-through is already generic | `apps/server/src/engine-supervisor.ts:330-332` | **not "config" — it changes the castling dialect for STANDARD runs too; see below** |
| 3 | Lift the import refusal for `Chess960`/`Fischerandom`, with the FEN requirement (§4) | `apps/server/src/pgn-import.ts:32-35` **and the uncounted clone at `apps/server/src/repertoire-pgn.ts:42`** | ~3 lines × 2 sites |
| 4 | Accept a pasted 960 FEN as a Just Play start | existing start path | none — v1 generates nothing |
| 5 | Suppress the Maia-backed opponent modes for a 960 start, visibly (§3.7) | `packages/runtime/src/types.ts:76-78`, `apps/server/src/opponent-selector.ts:515-524` | **not "small" — no per-position mode gate exists; see §3.7's note** |
| 6 | Widen the explorer `variant` param — **optional, and v1 declines it** (Open question 2) | `apps/server/src/sourcing/explorer.ts:67` | 1 line in the URL builder (`ExplorerQuery` carries no `variant` field, so a caller-controlled value also touches the type and `normalizeExplorerQuery` `:54-62`) |

Items 1–3 and 5 are v1. Item 4 is deliberately *nothing*: a Scharnagl start generator is real new
code and v1 does not need it, because a pasted FEN reaches every downstream symbol already —
**confirmed**, `service.ts:244` uses the same `Chess.fromSetup(parseFen(...))` the pack lint does, and
`imported_games` (`storage.ts:4386-4396`) has no variant column and no CHECK a 960 import violates.

> **CROSS-REVIEW 2026-08-23 — item 2 is not "config", and the consequence is repo-wide.**
> `#spec.options` is set once per engine **process** at handshake (`engine-supervisor.ts:330-332`),
> and one Stockfish process serves every run. Measured on the shipped **Stockfish 18** (which does
> advertise `option name UCI_Chess960 type check default false`, confirming [[D1160]]): on the
> standard position `r3k2r/8/8/8/8/8/8/R3K2R w KQkq -`, the MultiPV lines carry `e1c1`/`e1g1` with the
> option **false** and `e1a1`/`e1h1` with it **true**. So enabling it flips the castling dialect of
> every engine `bestmove` and PV **for standard runs as well**. That is a blast radius, and it cuts
> the RFC's way: king-takes-rook is exactly the move identity [[D1029]] ruled and
> `exact-legal-mobility` accepted, and that RFC's cross-review recorded engine `bestmove` as *already
> in the other dialect* precisely because `UCI_Chess960` was refused. Item 2 therefore **discharges a
> named residue of a same-day accepted RFC** — but it must be stated and its consumers swept, not
> priced as a config line. Alternative if the sweep is unwanted: a second Stockfish spec for 960.

> **CROSS-REVIEW 2026-08-23 — item 3 misses a second, byte-identical guard.** `repertoire-pgn.ts:42`
> runs `if(variant!==undefined&&variant!=="Standard"&&variant!=="From Position")` inside
> `parseRepertoirePgn`, a **separate parser** (own `parsePgn`, own `startingPosition`) driving
> repertoire import from both pasted PGN and Lichess *study* URLs (`repertoire.ts:81`). After the v1
> edit as scoped, importing a 960 **game** works while importing a 960 **repertoire** still fails with
> a different error class. Either widen both or state that repertoire import stays standard-only in
> v1. (`sourcing/openings.ts:47` also calls `parsePgn` with no `Variant` check at all; offline
> sourcing, out of scope, but it is not covered by the guard either.)

**§3.7 Maia goes dark, and the surface says so.** `RUN_OPPONENT_MODES`
(`packages/runtime/src/types.ts:41-47`, declared in the order `human_common`, `strong_engine`,
`theory_strict`, `perfect_tablebase`, `practical_resistance`) has five members. In a Chess960 start,
`human_common`, `practical_resistance` and `theory_strict` are unavailable — **all three because they
route through Maia**: `availableModes()` gates `human_common`/`theory_strict` on Maia health and
`practical_resistance` on Maia **and** the tablebase (`opponent-selector.ts:519,522`), and each is
served by `#maia` (`:621,:625` / `:678` / `:782`). `strong_engine` and `perfect_tablebase`
survive. `PositionOpponentPolicy` (`types.ts:76-78`) restricts Just Play to
`human_common | strong_engine`, so **a Chess960 Just Play session offers `strong_engine` alone.**

Per §2.1 this is declared rather than discovered: the start surface states which opponent modes the
chosen start supports and why the others are absent, using the same *availability* vocabulary
`design/06-campaign.md` uses for difficulty labels. It does not offer a mode and fail later.

> **CROSS-REVIEW 2026-08-23 — RETURN-CLASS (2) and (3). Criterion 5 has no mechanism, and the
> failure it guards against is worse than this section says.**
>
> *Corrected in place:* §3.7 said `theory_strict` fails for want of **opening-book depth**. At source
> it is gated on **Maia health** (`opponent-selector.ts:519`) like the other two; the book-depth
> reason is a separate true fact that is not the mechanism. And `PositionOpponentPolicy` is a
> compile-time `interface`, not a runtime guard — "suppress visibly" has no runtime home at that pin.
>
> *Return-class, not fixed:*
> **(a) There is no per-position mode gate anywhere in the codebase.** `availableModes()`
> (`opponent-selector.ts:515-524`) takes **no position argument** — it is a function of engine health
> alone. Criterion 5 ("absent from a 960 start's **offered set**") has nothing to attach to; the
> obligation is a new parameter and a new predicate, not the "small" of §3.6 item 5.
> **(b) [[D1161]]'s named remedy is dead code.** `policyUsesMaiaBand` (`engine-band.ts:92-96`) has
> **zero call sites** in production or test — repo-wide grep returns only its own definition and
> prose. Suppressing "at `policyUsesMaiaBand`" suppresses nothing; the real request-construction site
> is `#maia` → `positionCommand` (`opponent-selector.ts:576-614`, FEN out at `:604`).
> **(c) Four paths reach Maia without consulting any offered set, two of them hardcoding
> `human_common` regardless of the run's policy** — `rest.ts:1354-1358` (`GET /runs/:id/human-split`,
> the human-commonality **evidence** path, gated only on assistance permission and
> `providers.opponent !== "none"`) and `service.ts:1201-1204` (`human_replies` group seeding);
> `rest.ts:1221` (`POST /select-move`) and `:1738` (`POST /runs/:id/prediction`) take the mode
> straight from the request body, and `rest.ts` contains **no** `availableModes`/`validatePolicy`
> call at all. **A 960 run offering `strong_engine` alone still sends its 960 FEN to Maia.**
> **(d) The far end is not "weak play" and not even "silent castling corruption".** At the pinned
> SHA (`workers/maia/Dockerfile:3` → `1e13597…`) `maia3/uci.py:422` builds `chess.Board(fen)` with no
> `chess960=True`. Measured over all **960** Chess960 start positions on the resolved python-chess:
> **0 raise**; **858** lose *all* castling rights, **84** lose some, **18** are unaffected, **0**
> fabricate rights — `clean_castling_rights` masks to `BB_A1|BB_H1`/`BB_A8|BB_H8` and requires the
> king on e1/e8. Then `uci.py:443-444` does a bare `return` when a replayed history move is illegal,
> leaving `self.board` at the **previous position** with no error channel — and `opponent-selector.ts`
> waits only for `bestmove`, which it duly receives, **for a different position**. The board even
> self-reports `Status.BAD_CASTLING_RIGHTS` and nobody asks. Suppression must therefore be at
> **request construction** and must cover the **evidence** paths, not the offered set.
>
> *Incidental, outside this RFC:* `workers/maia/Dockerfile:19` pins `python-chess==1.999`, a shim
> distribution requiring `chess` with **no version constraint**, so the parser this whole trap turns
> on is unpinned despite `workers/maia/README.md:11` presenting it as a pin.

### §4 — Import: one allow-list entry, and its silent-wrong twin

**§4.1 The refusal.** `apps/server/src/pgn-import.ts:32-35` rejects any `Variant` header other than
`Standard` or `From Position`. A fully valid Chess960 PGN — correct `[FEN]`, `[SetUp "1"]`, legal
moves — is rejected **on the header alone**, though every downstream symbol would have handled it.

**§4.2 One edit serves the live import paths.** `parsePgnMainline` is the legality authority for
learner game import: pasted PGN and Lichess-URL import both resolve through `resolveImportSource`
(`apps/server/src/import-source.ts:60`) into the **single** call at `service.ts:799`, and `importLeg`
(`apps/server/src/live-session.ts:237,241`) is the second. `splitBroadcastRound`
(`rfc/live-sources.md:98-103`) becomes a third when that accepted RFC is implemented. Widening the
guard once serves all of them. Lichess runs Chess960 broadcasts, which today fetch, split, and then
fail per-board with an opaque message.

*(Cross-review 2026-08-23: this paragraph claimed **"the sole legality authority for four paths"** and
**"widening the guard once serves all four"**. Both fail. (a) Paste and Lichess-URL are not two call
sites — they are one, behind `resolveImportSource`. (b) `splitBroadcastRound` **does not exist at
HEAD**: zero occurrences in `apps/`, `packages/`, `tools/`, `tests/`. It is an accepted-but-unimplemented
symbol, so it is a future path, not a current one. (c) **"Sole" is already false**, and §3.6 item 3 now
carries the reason: `repertoire-pgn.ts:42` is a byte-identical clone of the same guard inside a separate
parser. `live-sources.md:102`'s *"`parsePgnMainline` remains the sole legality authority"* — the
[[D523]] one-authority discipline — is untrue at HEAD for that reason, which is worth a ledger row on
its own.)*

**§4.3 The trap, and the rule that closes it.** `startingPosition({Variant: "Chess960"})`
(`chessops/src/pgn.ts:697-703`) with no
FEN header returns **the standard position** — measured. The arrangement lives in `[FEN]`, not in
the variant tag. **Normative: a `Chess960`/`Fischerandom` header without a `FEN`/`SetUp` pair is
REFUSED, not defaulted.** Without this rule, lifting the guard silently imports standard games
labelled as 960, and every detector downstream reads the mislabel as truth.

*(Cross-review 2026-08-23 — **CONFIRMED, re-run at 0.15.1**. `startingPosition(new Map([["Variant",
"Chess960"]]))` returns `Ok` with FEN `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`:
`parseVariant` → `'chess'` at `:698`, then `defaultPosition(rules)` at `:702`. Silent, no throw. Same
for `Fischerandom`. Contrast `Duck Chess`, which returns `Err(PositionError: ERR_VARIANT)` at `:699`
— the trap exists **only** for the spellings this RFC is admitting, which is what makes the normative
refusal load-bearing rather than defensive. Proposed row D1123 stands as written. Confirmed alongside
it, and worth stating because it is free: `parsePgnMainline` already records castling in the
king-takes-rook form — `parseSan` emits `e1h1`/`e1a1`, so `makeUci(move)` at `pgn-import.ts:52`
satisfies `exact-legal-mobility`'s conformance predicate for imported 960 castling with no extra
work.)*

**§4.4 The guard widens per-tier, explicitly.** It must not widen to "any variant `chessops` knows".
A Tier-2 game admitted at import flows into `importGame` → `createRun` → the story evidence pass →
Stockfish and Maia, which is §2.2's prohibition reached through the back door. v1 adds exactly two
strings.

*(Cross-review 2026-08-23 — **"exactly two strings" needs its comparison discipline stated, and the
number is arguable.** The guard is a **case-sensitive exact match** on the raw header
(`pgn-import.ts:33`), while §3.3's evidence base — `parseVariant` — **lowercases** and accepts
sixteen Tier-1-or-standard spellings. Adding literally `"Chess960"` and `"Fischerandom"` leaves
`Fischerrandom`, `Fischer Random`, `Chess 960`, lowercase forms, and the whole `wild/0`–`wild/8a`
family refused — while the RFC's own §3.3 argues they are standard chess. That is defensible as a
conservative allow-list, but it must be a **stated** choice, not an accident of two string literals:
either (i) match `parseVariant(header) === 'chess'` and rely on §4.3's `FEN`/`SetUp` requirement to
carry the real safety, or (ii) name a closed lowercase set and say why the other spellings are out.
Note (i) is the option that keeps `[Variant "From Position"]` — already accepted today — from being
the loophole that (ii) leaves open: a 960 game exported under that tag imports at HEAD, unguarded by
§4.3's rule. Criterion 9 inherits whichever is chosen.)*

### §5 — The capability refusal is amended, not deleted

`capabilities.ts:133` currently reads `UCI_Chess960`, `disposition: "refused"`, reason *"The shipped
drill format is standard chess only"*.

**The refusal is amended with a stated reason and a ruling reference**, never quietly removed —
`design/research/fun-mechanics-outside-roguelikes.md:128` records it as a *published* refusal, and
a published refusal that vanishes without an act is how a decision loses its history.

Under [[D1077]]'s two-state model — *not configured at startup → outright unsupported; configured
but unreachable → temporarily unavailable* — Chess960 support is a **deployment fact**: it is
configured or it is not. The row must carry the ruling reference so the amendment is
traceable to [[D1093]]/[[D1031]] rather than appearing as an unexplained flip.

> **CROSS-REVIEW 2026-08-23 — RETURN-CLASS (4). The sentence removed here described machinery that
> does not exist.** It read: *"The disposition therefore becomes `reached` on a deployment whose
> engine spec sets the option (§3.6 item 2)."* At source, **every one of the 44 rows in
> `CAPABILITY_DISPOSITIONS` (`capabilities.ts:120-165`) is a static string literal** — no ternary, no
> `??`, no variable, no call appears in any `disposition:` position, and the frozen array is passed
> through untouched at `:359`. Recounted: **17 `reached` / 19 `refused` / 7 `unmeasured` / 1
> `impossible`**, matching [[D1077]]'s figures exactly. What *is* computed from runtime state in this
> file is a pointedly different set — `providers()` `:232-264`, `surfaces()` `:266-278`, `policyModes`
> `:337-346`, the Maia band `:324-332`. Dispositions are excluded by design.
>
> **Three consequences the author must resolve.** (a) A deployment-conditional disposition is **new
> code**, not §3.6 item 1's *"1 line + the documented act"*. (b) The startup gate
> `assertAdvertisedCapabilityDispositions` (`:167-188`) checks that an advertised option **has a
> row** — it is indifferent to the row's *kind* (`:180`) — so shipping item 2 without item 1 diverges
> **silently**: the engine runs with `UCI_Chess960` set while the published table still says
> `refused`, and nothing detects it. (c) Because of (b), **criterion 10 passes on a lie**: flipping
> the literal to `reached` satisfies *"disposition is no longer `refused`"* on a deployment that never
> sets the option. Three honest exits, all cheap, none chosen here: make the row `unmeasured` with the
> §3.6-item-2 handshake as its named `experiment`; or extend `assertAdvertisedCapabilityDispositions`
> to assert kind-vs-spec agreement at boot (which is what [[D1077]]'s "configured or not" actually
> asks for and is the only one that makes criterion 10 failable); or flip it statically and say
> plainly that the table describes the reference deployment. Note also that
> `apps/server/src/strong-engine.ts:54-58` sets only `Threads`, `Hash`, `MultiPV` — `UCI_Chess960`
> appears nowhere in the repo outside `capabilities.ts:133`.

### §6 — What v1 defers, and to whom

| Deferred | Why | Home |
|---|---|---|
| **Chess960 drill packs** | **§1 already settles this as law, not as a deferral: drill packs are standard chess only on owner ruling [[D1042]].** Whether Tier 1 counts as "standard chess" for that law is the owner's to say — see Open question 5. **No engineering blocker exists** (cross-review; the three the row previously asserted all fail at source — see below) | Open question 5, then Discharge D1 if admitted |
| **Tiers 2 and 3** | §2.2's suppression rule must ship before any surface can host them | Discharges D2, D3 |
| **Solitaire chess** ([[D869]]) | Shares no code with the variant axis; its blocker is the law-8 seal reconciliation `campaign-core.md:489` (D2) already demands, not engineering | its own lane, running in parallel |
| **Reduced armies / pawns-only** ([[D873]]) | **Not a variant** — legal standard positions, full evidence, and the tablebase turns *on* below 8 units. The highest evidence-per-effort item in the family, and it needs nothing from this RFC | its own lane |
| **A `rules` field and a Scharnagl generator** | Neither is needed for a pasted-FEN 960 start (§3.4, §3.6) | Discharge D2 claims the lane when Tier 2 arrives |
| **Duck Chess and Fog of War in literal form** | No library support at any price (`parseVariant` returns `undefined` for both — **confirmed at 0.15.1**, along with Xiangqi, Shogi and Bughouse, via `default: return;` at `pgn.ts:671-672`). Fog's *idea* already ships better as the suppressor boss (`rfc/campaign-core.md:219-221`) | refused, recorded |

> **CROSS-REVIEW 2026-08-23 — RETURN-CLASS (5). The drill-pack row asserted three blockers and all
> three fail at source.** This matters more than a wrong reason, because [[D327]] — quoted in this
> RFC's own Motivation — asked for exactly this: *"if we're going to add **packs** with ie fischer
> random or all these other variations"*. The derivation reserved it as an owner fork
> (`rfc-derivation.md:515`, gap 7 ⚖, *"Do 960 packs exist at all in v1"*). Deferring it on reasoning
> that does not hold is the [[D1030]] pattern reproduced inside the document written to correct it,
> and it is [[D1230]]'s test failed: **a cut needs a real blocker.**
>
> **(a) The pack lint does not block a 960 pack — it already admits one.** `lintDrillPack`'s start
> check is `startPosition(pack.start.fen)` = `Chess.fromSetup(parseFen(fen).unwrap()).unwrap()`
> (`packages/schema/src/drill-pack/lint.ts:172-173`, called at `:296`, error `INVALID_START_FEN` at
> `:299-303`). Run at 0.15.1: `bqnbnrkr/pppppppp/8/8/8/8/PPPPPPPP/BQNBNRKR w HFhf -` and its `KQkq`
> spelling both parse as **legal standard `Chess` positions**. That is not an accident — it is this
> RFC's own §3.1/§3.3 thesis. `docs/drill-pack-format.md:171` is quoted correctly; it simply does not
> mean what the row needs it to mean.
>
> **(b) A 960 pack therefore needs no pack-schema lane.** §3.4's argument — a 960 FEN is
> self-describing, the arrangement and the castling rights are both in the FEN — applies verbatim to
> `pack.start.fen`. Nothing in the pack schema changes.
>
> **(c) The Gate F sentence is wrong twice.** Gate F clause 1 is
> `planning/platform-alignment/plan.md:48`, verbatim: *"no active RFC holds a drill-pack schema
> lane"* — **a Boolean whose threshold is zero**, red continuously since `graduation-clearance` booked
> 0.28. It does not count depth; the depth framing is a *schedule* proxy narrated in
> `design/BACKLOG.md:390` ([[D1058]]), and compressing it into "clause 1 counts lane depth" converts a
> scheduling argument into a threshold the clause does not contain. And the count is stale: **four**
> lanes are held, not three — `famous-games.md:14` booked **0.31** at 17:59:58, eighteen minutes after
> this RFC landed at 17:41:40, and `node tools/register-check.mjs` prints `pack-schema: head 0.27;
> next free 0.32`. The two rows are now in open contradiction inside one table: `rfc/README.md:35`
> says this RFC keeps clause 1 *"at three lanes rather than four"*, `:38` says famous-games *"takes
> Gate F clause 1 from three pack lanes deep to four"*. Whatever the acceptor decides, one of those
> rows is wrong.
>
> **(d) "All 50 authored packs are standard" needs its exclusion stated.** `content/packs/` is empty;
> `content/drafts/` holds **56** pack documents. 50 is reached only by excluding six
> `*.browser.json` fixture packs — which the validator's own corpus rule does **not** exclude
> (`packJsonFiles`, `apps/server/src/pack-check.ts:44-55`, filters only `isSidecarName`), and which are
> real `DrillPackDefinition`s. Since the sentence was doing gate work, it should read "50 authored
> packs (56 documents including six browser fixtures)".

## Deviations from design

**One.** `design/research/fun-mechanics-outside-roguelikes.md:1130-1133` states *"A variant node has
no grounded instrument behind it"*. §2 contradicts it for Chess960, on measurement: every detector,
the phase model, Syzygy and Stockfish survive Tier 1 intact. The dossier's sentence is correct for
Tiers 2 and 3 and is retained for them. No design document is amended by this RFC (law 5); the
correction belongs to the research tier and is recorded as a proposed ledger row.

## Acceptance criteria

Numeric criteria carry their computed numbers ([[D984]]); each names the wrong implementation it
rejects.

1. **The admission matrix is data, not prose.** §1's four surfaces × admitted-tier pairs exist as a
   single exported table with one entry per surface, and every surface that admits a start consults
   it. *Wrong implementation rejected:* a per-call `if (variant === "chess960")`, which passes any
   prose-only reading.

   > *Cross-review 2026-08-23 — under-specified three ways, all repairable by the author.* **(i)
   > §1 has no tiers.** Its cells are admission verbs ("Standard chess only", "Any variant, as an
   > option", "Accepted", "As far as we like"); "four surfaces × admitted-**tier** pairs" describes a
   > table §1 does not define. **(ii) The table cannot encode both §1 and §2.3 in one field.** §1's
   > Just Play cell is *any variant* (the owner's law); §2.3 admits *Tier 1 only* (v1's shipment).
   > A single-field table must contradict one of them — which is exactly how criterion 12's original
   > form went wrong. Specify two fields: the **law** per surface, and the **shipped member set**,
   > with only the latter narrowing over time. **(iii) It collides with the shipped surface
   > vocabulary.** `SURFACE_IDS` (`capabilities.ts:40-48`) has **seven** members — `play`, `review`,
   > `learn`, `live`, `create`, `justPlay`, `fromPosition` — and none of §1's four rows is a
   > `SurfaceId`. In particular **`fromPosition` has no row**, and per §3.6 item 4 that is the surface
   > a pasted 960 FEN actually starts on. Also worth stating plainly in §2: **no such table exists at
   > HEAD** — no `admissionMatrix`, no `*_ADMISSION_*` constant, and no surface consults any per-variant
   > table today (admission is the two hardcoded refusals plus the explorer literal). This is new
   > construction, not an extension. As written, "every surface that admits a start consults it"
   > has no assertion form and is passed by an exported table with one reader.
2. **A drill pack cannot carry a non-standard start.** The pack lint refuses a pack whose start FEN
   is not legal standard chess, with a fixture asserting the refusal fires. *Rejected:* silently
   accepting, since all 50 shipped packs are standard and would not notice.

   > **Cross-review 2026-08-23 — RETURN-CLASS (5b): UNSATISFIABLE BY IDENTITY, [[D984]]'s class.**
   > The lint's only start predicate is `Chess.fromSetup(parseFen(fen).unwrap()).unwrap()`
   > (`drill-pack/lint.ts:172-173`), and **a Chess960 start FEN *is* a legal standard-chess position
   > under it** — measured, both Shredder and X-FEN spellings (see §6's note (a)). So **no 960 fixture
   > can make this refusal fire**, and the criterion can only be discharged with a fixture unrelated
   > to variants (two kings, a pawn on the eighth), where it asserts behaviour that already ships and
   > rejects no wrong implementation *of this RFC*. This is the mirror of criterion 12: one criterion
   > nothing can pass, one nothing can fail, in the same document. The repair is not a better fixture
   > — it is deciding Open question 5 first, because the criterion is only meaningful if "standard
   > chess" is given a definition that excludes a 960 back rank, and the RFC's own §3.3 argues it does
   > not.
3. **A Chess960 FEN starts a Just Play run**, plays to a legal terminal position, and rewind, fork
   and compare all operate on it — asserted on a position with the king **off** the e-file, where
   the phantom-destination branch never fires (§3.5).
4. **The castling identity is the library's canonical form.** For a 960 start, a castling move round-trips
   `makeUci(normalizeMove(pos, parseUci(uci))) === uci` **where `uci` is the king-takes-rook form**,
   and its SAN renders `O-O`/`O-O-O`.
   *Rejected:* a c/g-file rewrite, which round-trips only on standard back ranks.

   > *Cross-review 2026-08-23 — the input dialect was unpinned, and the criterion's outcome depended
   > entirely on it; **"where `uci` is the king-takes-rook form" is added above**.* Measured at 0.15.1:
   > on a standard back rank `e1g1 → e1h1` (round-trip **false**) while `e1h1 → e1h1` (**true**); in
   > 960 with the king on b1, `b1c1 → b1h1` (**false**) while `b1h1 → b1h1` (**true**). So with a c/g
   > fixture input the **correct** implementation fails the criterion, and with an unspecified input an
   > implementer picks whichever passes. With the form now pinned, the named rejection works: a c/g
   > rewrite maps `b1h1 → b1g1` and fails. SAN half confirmed — `makeSan` renders `O-O` for `b1h1`
   > and `O-O-O` for `b1a1`.
5. **The three Maia-backed opponent modes are absent from a 960 start's offered set**, and the
   surface states why. *Rejected:* offering them and failing at selection time — the criterion asserts
   the offered set, not the failure.

   > **Cross-review 2026-08-23 — RETURN-CLASS (2): this criterion guards the wrong boundary and has
   > no mechanism to attach to.** See §3.7's note for the evidence. In short: `availableModes()` takes
   > no position argument, so there is no per-start offered set to assert; [[D1161]]'s named remedy
   > `policyUsesMaiaBand` is dead code; and **the offered set is not the boundary that matters** —
   > `rest.ts:1354-1358` and `service.ts:1201-1204` hardcode `human_common` and consult no offered
   > set, so a 960 run passing this criterion still sends its 960 FEN to Maia, which answers from a
   > **stale board**. The criterion must assert suppression at **request construction** — no
   > `position fen <960 fen>` is written to the Maia engine for any run whose start is not
   > standard-back-rank, asserted at `#maia`/`positionCommand` (`opponent-selector.ts:576-614`) and
   > covering the evidence endpoints — with the offered set as a second, weaker criterion for the UX
   > half. As written, the wrong implementation that passes is the *only* implementation currently
   > possible: filter the picker, leave every other Maia caller untouched.
6. **`strong_engine` in a 960 start returns a legal move** and the engine spec carries
   `UCI_Chess960`. *Rejected:* the option unset, which yields standard-castling moves that are
   illegal in the position.

   > *Cross-review 2026-08-23 — failable, but only on its second clause; the first is weak.* With the
   > option unset Stockfish still returns **legal non-castling** moves in almost every position, so
   > "returns a legal move" passes a wrong implementation unless the fixture position is one where
   > castling is forced or clearly best. Pin such a position, or lean on the spec assertion (which is
   > directly checkable and does fail today — `UCI_Chess960` appears nowhere outside
   > `capabilities.ts:133`; `strong-engine.ts:54-58` sets only `Threads`, `Hash`, `MultiPV`). Add the
   > consequence §3.6 item 2 now carries: assert the **standard**-run castling dialect after the flip,
   > since it changes from `e1g1` to `e1h1` repo-wide.
7. **A valid Chess960 PGN imports**, with a fixture carrying `[Variant "Chess960"]`, `[SetUp "1"]`
   and a `[FEN]` with a randomised back rank.
8. **A `Chess960` header with no `FEN`/`SetUp` is REFUSED** (§4.3), with the refusal asserted
   explicitly. *Rejected:* defaulting to the standard position, which passes criterion 7 while
   silently corrupting every downstream reading.
9. **The import guard admits exactly two new strings.** A fixture asserts that `Crazyhouse`,
   `Atomic`, `Antichess`, `Horde`, `Racing Kings`, `King of the Hill` and `Three-check` remain
   refused. *Rejected:* widening to `parseVariant`-knows-it, which passes criterion 7 and admits
   seven rulesets §2.2 forbids.

   > *Cross-review 2026-08-23 — this is the strongest criterion in the document and it survives, with
   > one dependency.* The seven strings are exactly the seven non-standard members of chessops'
   > `RULES` (`types.ts:78-89`: `antichess, kingofthehill, 3check, atomic, horde, racingkings,
   > crazyhouse` — 8 members, 7 non-standard), so the fixture is complete against the library. It also
   > does the protective work criterion 12 gestures at, and unlike criterion 12 it **can fail**. Its
   > one dependency: "exactly two new strings" must be reconciled with §4.4's note — the guard is a
   > case-sensitive exact match while §3.3's evidence base lowercases and accepts sixteen spellings,
   > so the criterion's number follows from a choice the author has not yet stated. Add the second
   > refusal too: **also assert `parseRepertoirePgn` refuses the same seven** (§3.6 item 3), or the
   > criterion measures one of the two clones.
10. **The capability row is amended, not deleted.** `capabilities.ts` contains a `UCI_Chess960` row
    whose disposition is no longer `refused` and whose reason cites the ruling. *Rejected:* deleting
    the row, which loses the published-refusal history §5 requires.

    > **Cross-review 2026-08-23 — RETURN-CLASS (4): passes on a lie.** All 44 disposition values are
    > static literals (§5's note), so "no longer `refused`" is satisfied by flipping one string to
    > `reached` on a deployment whose engine spec never sets the option — and the startup gate checks
    > row *existence*, not kind, so nothing catches the divergence. As written this criterion cannot
    > distinguish an honest amendment from a false advertisement, which is the failure mode §5's own
    > *"a published refusal that vanishes without an act"* paragraph exists to prevent. It becomes
    > failable under §5's option (ii): assert kind-vs-spec agreement at boot.
11. **No pack-schema and no run-schema lane are claimed.** `make register-check` is green with this
    RFC active, and the `tabiya-claims` block reads `none`.

    > *Cross-review 2026-08-23 — the decision is CORRECT, the criterion is near-vacuous.* Verified:
    > nothing in the body touches a versioned resource. `imported_games` (`storage.ts:4386-4396`) has
    > no variant column and no CHECK a 960 import violates, headers are stored as JSON, the capability
    > table is unversioned, and §3.4's no-new-field argument holds. `node tools/register-check.mjs`
    > (read-only; no write call in the tool) prints C1–C6 green over 26 active RFCs and 13 live claims.
    > But `none` contributes no claim, so **register-check is green repo-wide with or without this
    > RFC** — the criterion asserts nothing about this document beyond C1's block placement. Keep it,
    > but do not count it as coverage.
12. **No Tier-2 surface is REACHABLE BY A LEARNER YET.** A grep-able assertion that no *learner
    surface* offers a `Rules` value this RFC has not admitted — scoped to offering, never to the
    type. *Rejected, and this is the correction:* the original criterion asserted that **no code
    path admits a `Rules` value other than `'chess'`**, which would have **failed the moment anyone
    implemented [[D1042]]** — the owner's own ruling that Just Play offers *any* variant and the
    campaign is *unrestricted*. chessops already ships all seven Tier-2 rulesets (§2.2), so the
    criterion would have frozen a refusal the owner had already lifted, exactly as
    `capabilities.ts:133` froze the Chess960 refusal it took a year and an owner's temper to find.
    A criterion may bound what we *ship*; it may never bound what the owner has *ruled*.

    > **Cross-review 2026-08-23 — RETURN-CLASS (6). The correction is RIGHT IN DIRECTION AND OVERSHOT
    > INTO THE OPPOSITE ERROR: as rewritten, this criterion CANNOT FAIL.** The diagnosis is confirmed
    > — the original form *would* have failed the moment anyone implemented [[D1042]], chessops does
    > ship all seven Tier-2 rulesets, and the stated rule is the correct law. But the replacement is
    > [[D984]]'s other half, and it is the twin of criterion 2 in the same document.
    >
    > **Why it cannot fail.** The criterion asserts that no learner surface offers *"a `Rules` value
    > this RFC has not admitted"*. **There is no `Rules` value anywhere in this codebase.** chessops'
    > `Rules` type is imported by **zero** files (repo-wide grep over `packages/` and `apps/`); the
    > only `Rules` tokens are unrelated `sourceLabel: "Rules"` string literals at
    > `packages/runtime/src/branch-scale.ts:83` and `apps/web/src/lib/evidence-sentences.ts:26`. And
    > this RFC deliberately introduces none: §3.4 claims **no run-schema lane** on the grounds that a
    > 960 FEN is self-describing, and §6 reserves the `rules` field for Discharge D2. So the assertion
    > is **true by absence of its referent, before and after implementation, for every possible
    > implementation of this RFC**. Nothing an implementer could do would turn it red. The first
    > implementation that could fail it is D2's — which will carry its own criteria.
    >
    > **Two further defects.** (a) It has **no *"Rejected:"* clause naming a wrong implementation** —
    > its "Rejected, and this is the correction" paragraph rejects the *previous criterion*, which is
    > changelog material, not an acceptance test. That breaks the rule stated one line above the list:
    > *"each names the wrong implementation it rejects."* (b) It is **redundant with criterion 9**,
    > which does the same protective work at the only boundary a Tier-2 ruleset can currently cross,
    > and which **is** failable.
    >
    > **Suggested rebind, failable within this RFC's scope.** Assert that criterion 1's admission table
    > carries the **law** and the **v1 shipped member set** as two separate fields (per criterion 1's
    > note (ii)), that the law fields for Just Play and campaign read *any variant* / *as far as we
    > like*, and that a fixture requesting a Tier-2 start is refused by the **shipped-member** consult
    > with a message naming the tier. That fails against any implementation which collapses the two
    > fields — which is precisely what the original criterion 12 did — and it fails against an
    > implementation that hard-codes the law narrower than [[D1042]]. It bounds what we ship and
    > records what was ruled, in one test, and it can go red.
    >
    > **The rule this criterion states should be promoted out of it.** *"A criterion may bound what we
    > ship; it may never bound what the owner has ruled"* is a general guard worth more than the
    > criterion carrying it, and §1's campaign row failed it independently (see §1's note). It belongs
    > in the RFC template beside [[D984]]'s numeric guard, as a proposed ledger row.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Chess960 drill packs — the pack-lint widening and the pack-schema lane it needs | claude | the packs RFC's landing commit | |
| D2 | Tier 2 — the `rules` field and its run-schema lane, the instrument-suppression surface (§2.2), and the tablebase/explorer endpoint questions | claude | the Tier-2 RFC's landing commit | |
| D3 | Tier 3 — [[D328]]'s measurement of whether `Node.fen` and `transposeKey` are the only FEN-shaped types in the branch runtime, which decides whether xiangqi/shogi is an adapter or a second product | claude | `planning/variants/` | |
| D4 | The research-tier correction to `fun-mechanics-outside-roguelikes.md:1130-1133` (Deviations) | claude | the dossier's next edit | |
| D5 | Implementation of §3.6 and §4 | codex | the implementing commit | |

## Open questions

1. **⚖ OWNER, BLOCKING ACCEPTANCE — is a Maia-dark Chess960 acceptable?** In 960 the human-opponent
   modes are unavailable and Just Play offers `strong_engine` alone (§3.7). This is the fork
   [[D1030]] found was asserted rather than asked: `capabilities.ts:133`'s product rationale
   supplied an answer to a question nobody put. The mechanism in this RFC is fully determined either
   way — the ruling governs whether it ships, not what it says.

   > **Cross-review 2026-08-23 — RETURN-CLASS (1): THIS QUESTION IS STALE AND ITS LAST SENTENCE IS
   > FALSE.** The owner ruled on it the same day, before this RFC was drafted, and ruled *against* the
   > framing: [[D1153]] — *"well we just need 'bot capas'? Like don't we have special bots that consume
   > evidence and shit? So we can make some that don't consume maia-produced evidence? Like isn't
   > there Fairy-Stockfish as well?"* — i.e. **don't accept the gap; compose a bot that does not
   > depend on Maia.** That row records research commissioned, with *"the variants RFC's blocking open
   > question stays open until it returns"*. **It has returned**: [[D1160]],
   > `design/research/non-maia-bot-composition.md` (631 lines), measured 2026-08-23. Its findings
   > change this question's options rather than answering it in the old terms:
   > - **Fairy-Stockfish cannot fill the slot**, and the reason is structural, not a shortfall: the
   >   base-layer contract is a **distribution, not an engine** — `BotPolicyCandidateInput` requires
   >   `rawMass` per candidate with `completeness = Σ rawMass`
   >   (`bot-policy-catalog.ts:131-138,324`, floor at `:455`), and Fairy-Stockfish is alpha-beta +
   >   NNUE **evaluation** with nothing policy-shaped in its option table. (Cross-review caveat on the
   >   dossier's own wording: `BotPolicyInput` `:16-19` is **not** a closed union — its third arm is a
   >   template literal `` `evidence.${string}@${number}` `` — and `assertLayer` `:190-239` never checks
   >   which input a `human_policy_model` declares, so "only base provider" is vocabulary, not
   >   enforcement.)
   > - **The blocker is absent human-trained 960 *weights*, not an absent instrument** — Maia is an
   >   Lc0 net and lc0 has supported `UCI_Chess960` since v0.23/v0.25. A data problem with a known
   >   price, not a wall.
   > - **We do not need Fairy-Stockfish for 960 at all**: the shipped **Stockfish 18 already has
   >   `UCI_Chess960`** (confirmed here by handshake — `option name UCI_Chess960 type check default
   >   false`), so `capabilities.ts:133` is a product opinion and nothing more.
   > - **The recommendation on file** (`:511-514`), verbatim: *"960 ships with an engine-composed
   >   opponent, disclosed and labelled uncalibrated, with the human-likeness measurement (§5)
   >   commissioned in parallel and its result binding on what the card may say."* Engine choice
   >   `:551-553`: **Stockfish for Tier 1**; Fairy-Stockfish is a Tier-2 dependency. Enforcement is
   >   already free — `REFUSED_PERSONA_CLAIM` (`bot-policy-catalog.ts:172`) and the `uncalibrated`
   >   label (`:477`), with 960 results **unrated**, no strength number, no ladder, no difficulty dial
   >   (`:480-486`), and the measurement's five arms predeclared at `:356-410`.
   >
   > **And the last sentence — *"the mechanism in this RFC is fully determined either way"* — is
   > false.** The ruled direction is priced at `:505` as one new `BotPolicyInput` member, a cp→mass
   > base layer with its own sampler and positive control, and a `historyCapability` widening. None of
   > that is in §3.6. **Rewrite the question as the owner's actual fork** — *does 960 ship the composed
   > Stockfish profile now (and this RFC grows §3.6 accordingly), or does 960 wait for 960-trained
   > weights?* — and carry the dossier's recommendation as the recommended answer. As it stands the
   > document asks the owner to re-decide something he has already decided, which is [[D1030]]'s defect
   > with the polarity reversed.
2. **⚖ OWNER — is 960 opening-explorer data wanted?** One line at `explorer.ts:67` buys it, and 960's
   *point* is having no book. v1 declines it; the question is whether that is right.
3. **Is a 960 result rated?** Glicko-2's arithmetic works, but rating needs a *measured* opponent and
   Maia is dark, so no calibrated human opponent exists. `capabilities.ts` already refuses rating
   from engine-adjudicated outcomes. The recommended answer is **unrated, stated**; recorded here
   rather than decided, because it interacts with `learner-rating`'s accepted predicate.

   > *Cross-review 2026-08-23 — the recommendation is right and now over-determined, but the citation
   > does not carry it.* The row exists (`capabilities.ts:148`: *"rating from authored, engine- or
   > tablebase-adjudicated outcomes"*, `refused`) — but a 960 game against `strong_engine` reaches a
   > **rules-terminal** result, and `:146` marks rating from those `reached`. The refusal that
   > actually bites is `rfc/learner-rating.md:252` — `strong_engine` *"carries no band and no
   > calibration"* — which is prose, not a disposition. Cite that instead. The answer is independently
   > settled by [[D1160]]'s dossier, which makes **unrated** a consequence of the `uncalibrated` label
   > rather than a recommendation (`:480-486`: no strength number, no ladder, no difficulty dial), so
   > this question can be closed alongside Open question 1 rather than carried separately.
4. **[[D328]]'s cheap measurement** (Discharge D3) is one afternoon and decides whether westernised
   xiangqi/shogi is an adapter over SFEN or a second product sharing a shell. It should be taken
   independently of this RFC.
5. **⚖ OWNER — is Chess960 "standard chess" for the purposes of [[D1042]]'s drill-pack row?**
   *(Added by cross-review 2026-08-23; it was the derivation's gap 7 ⚖, resolved by the author rather
   than asked.)* §1 states the law as **drill packs: standard chess only**, and the owner's stated
   reason is evidence-darkness — *"a drill exists to say something grounded about a position, and
   outside standard chess the evidence stack has nothing true to say"* (`06-campaign.md:288`). **Tier
   1 is not evidence-dark**: §2 measures every detector, the phase model, Syzygy, the explorer and
   Stockfish as surviving intact, and §3.3 shows the library does not treat 960 as a separate ruleset
   at all. So the ruling's *rationale* does not reach Chess960 even though its *wording* might. The
   engineering answer is now known and is not a blocker either way: **a 960 pack needs no lint change,
   no schema change and no lane** (§6's note). [[D327]] asked for this directly — *"if we're going to
   add packs with ie fischer random"*. Recommended answer: **admit Chess960 packs**, since the
   evidence stack that justifies the standard-only rule is fully present, and keep the rule's teeth
   for Tiers 2–3 where it was aimed. Criterion 2 cannot be written until this is ruled.

## Ledger rows (proposed — renumber at landing; head D1120 at drafting)

- **D1121 (proposed)** — 🐞 the research dossier's *"a variant node has no grounded instrument
  behind it"* (`fun-mechanics-outside-roguelikes.md:1130-1133`) is **false for Chess960** and true
  only for Tiers 2–3; the over-broad form is why the lane sat unrouted for a week.
- **D1122 (proposed)** — 📊 the derivation's §4.4 latent-defect claim about `chessgroundDests`
  phantom castling destinations is **refuted at source**: the branch fires only for an e-file king
  whose a1/h1 rook square is a legal destination, and 960 castling lands the king on the c/g file by
  rule, so its output is correct whenever it fires (§3.5). One item leaves the cost list.
- **D1123 (proposed)** — 🐞 `startingPosition({Variant: "Chess960"})` with no FEN header returns the
  **standard** position, so lifting the import guard without requiring `FEN`/`SetUp` silently
  imports standard games as 960 (§4.3). *(Cross-review: confirmed by re-running at 0.15.1;
  `pgn.ts:697-703`, `parseVariant`→`'chess'` at `:698` then `defaultPosition` at `:702`. Contrast
  `Duck Chess`, which errors — the trap exists only for the spellings this RFC admits.)*

*(Rows proposed by cross-review 2026-08-23, for the author to renumber and land:)*

- **D1124 (proposed)** — 🐞 **`parsePgnMainline` is not the sole legality authority it is documented
  to be.** `repertoire-pgn.ts:42` runs a byte-identical `Variant` guard inside a separate parser with
  its own `parsePgn` and `startingPosition`, serving repertoire import from pasted PGN and Lichess
  study URLs (`repertoire.ts:81`). `rfc/live-sources.md:102` asserts the one-authority discipline
  ([[D523]]) and it is untrue at HEAD. Any variant-guard change must touch both sites or say why not.
- **D1125 (proposed)** — 🐞 **`policyUsesMaiaBand` is dead code** (`engine-band.ts:92-96`, zero call
  sites) and is nonetheless named as the remedy in [[D1161]]. Separately, **four paths send a FEN to
  Maia without consulting any offered mode set**, two of them hardcoding `human_common` regardless of
  the run's policy (`rest.ts:1354-1358`, `service.ts:1201-1204`; `rest.ts:1221,1738` take the mode
  from the request body, and `rest.ts` contains no `availableModes`/`validatePolicy` call at all).
  Any per-start opponent suppression must be built at request construction.
- **D1126 (proposed)** — 🐞 **The Maia sidecar's parser is unpinned.** `workers/maia/Dockerfile:19`
  installs `python-chess==1.999`, a shim distribution whose metadata requires `chess` with **no
  version constraint**, while `workers/maia/README.md:11` presents it as a pin. The library that
  parses every FEN Maia sees floats, and the 960 castling behaviour measured here depends on it.
- **D1127 (proposed)** — 📊 **`chessgroundDests` withholds a legal gesture in 960.** With the king on
  e1 and the rooks off a1/h1, chessops accepts the familiar two-square castle
  (`normalizeMove(e1c1) = e1b1`, `isLegal` true) but `chessgroundDests` never offers `c1` — the board
  offers less than the rules layer takes. Completeness/UX gap, not a correctness defect; distinct
  from D1122, which refutes the *opposite* claim.
- **D1128 (proposed)** — 🐞 **`tools/evidence-topology-harness/audit.test.ts:41` asserts
  `CAPABILITY_DISPOSITIONS` has 39 rows; it has 44.** Found incidentally while recounting for §5.
  Outside this RFC's scope, but it is a red guard nobody is reading.
- **D1129 (proposed)** — ⚖ **Promote the rule criterion 12 states into the RFC template**, beside
  [[D984]]'s numeric guard: *a criterion may bound what we ship; it may never bound what the owner has
  ruled.* It caught its own criterion here and §1's campaign row failed it independently, so it is a
  general guard rather than a one-off note. Its natural twin, also from this review: **a criterion
  that no implementation can turn red is the same defect as one no implementation can turn green.**

## Changelog

- 2026-08-23 — drafted from `planning/variants/rfc-derivation.md` under owner rulings [[D1093]]
  (drafting mandate), [[D1031]] (the lane is a family) and [[D1042]] (the surface-scoped balance
  law). Scoped to Chess960 in Just Play and import; packs and Tiers 2–3 deferred behind named
  discharges. Two derivation claims corrected at source (proposed rows D1122, D1121).
- 2026-08-23 — coordinator scope-audit correction to acceptance criterion 12 ([[D1231]]), replacing
  *"no code path admits a `Rules` value other than `'chess'`"* with a bound on what a learner surface
  *offers*.
- 2026-08-23 **cross-review (independent, first review this document has had): 97 claims re-derived
  at source, 27 failed.** Everything numeric was recounted and every chessops, chessground, Stockfish
  and python-chess behaviour was re-run rather than read.

  **The [[D1231]] correction is verified as far as it goes and does not land.** Its diagnosis is
  right — the original criterion 12 would have failed the moment anyone implemented [[D1042]],
  chessops does ship all seven Tier-2 rulesets (`RULES`, `types.ts:78-89`), and its stated rule is
  correct law. But the replacement **cannot fail**: the chessops `Rules` type is imported by zero
  files in this repo, and this RFC deliberately introduces no `rules` field (§3.4, §6), so the
  assertion is true by absence of its referent for every possible implementation. That is [[D984]]'s
  other half — and its twin sits four criteria away, where **criterion 2 cannot be satisfied**,
  because a 960 start FEN *is* a legal standard-chess position under the lint's only predicate
  (measured). One criterion nothing can pass and one nothing can fail, in one document.

  **Six return-class blockers, reported and not repaired:** (1) Open question 1 argues a fork
  [[D1153]] closed and [[D1160]]'s dossier has already answered, and its *"fully determined either
  way"* is false at a priced cost; (2) criterion 5 guards the offered set while two hardcoded
  `human_common` paths send the 960 FEN to Maia anyway, and its named remedy `policyUsesMaiaBand` is
  dead code; (3) the far-end failure is a **stale board answering `go`**, not weak play — 0 of 960
  arrangements raise, 858 lose all castling rights; (4) §5's deployment-conditional disposition does
  not exist — all 44 rows are static literals — and criterion 10 therefore passes on a false
  advertisement; (5) §6's drill-pack deferral asserted three blockers and all three fail at source,
  resolving an owner fork ([[D327]] asked for 960 packs by name) on reasoning that does not hold —
  now Open question 5; (6) criterion 12, above.

  **Repaired in place:** the §1 campaign row (*"Unrestricted, subject to §2"* → the design's *"As far
  as we like"* — the qualifier narrowed the owner's ruling inside the cell stating the law, failing
  criterion 12's own rule); the design-ref pin for the encounter-class table (§3 `:371-376` →
  `:439-444` in §5, drift inherited from a derivation that was correct at 14:26); §3.3's claim that
  `parseVariant` proves Tier 1 has *exactly one member* (the same function returns `'chess'` for
  sixteen spellings including `wild/0`–`wild/8a`); §3.4's false characterisation of
  `schedules.variant` as the blocked/varied column (that is `kind` at `:4152`) plus the unlisted
  `rules:` evidence-namespace collision; §3.5's branch conditions (the rook-square test gates the
  *push*, not the branch — measured 204/204 fires, 102 pushes); §3.6's item-2 pricing (enabling
  `UCI_Chess960` flips the castling dialect for **standard** runs too — measured `e1g1`→`e1h1` on
  Stockfish 18 — which incidentally discharges an `exact-legal-mobility` residue), item-3 scope (the
  uncounted clone at `repertoire-pgn.ts:42`) and item-5 pin (`:521-530` → `:515-524`); §3.7's reason
  for `theory_strict` (Maia health, not book depth) and the note that `PositionOpponentPolicy` is a
  compile-time interface; §4.2's *"sole legality authority for four paths"* (two live paths, one
  unimplemented symbol, one uncounted clone); §4.4's comparison discipline; §6's pack count (50
  authored / 56 by the validator's own corpus rule); criterion 4's unpinned input dialect, which
  decided the criterion's outcome; and five line pins re-derived at the installed versions
  (`fen.ts:86-110`, `pgn.ts:615-674`, `compat.ts:26-44`, `board.ts:81-108`, `pgn.ts:697-703`).

  **What survived untouched and is now measured rather than argued:** §4.3's trap (re-run:
  `startingPosition({Variant:"Chess960"})` returns the standard position, silently); §3.5's
  refutation of the derivation's `chessgroundDests` defect (8904 gestures driven through
  chessground's real `baseMove`/`tryAutoCastle`, **0 mismatches**); castling rights as a `SquareSet`
  of rook squares and `normalizeMove(e1g1) → e1h1`; the Shredder↔KQkq round trip's stability, which
  is stronger than §3.1 claims because `makeCastlingFen` never mis-spells the ambiguous case; the
  Tier-2 member list against chessops' `RULES`; criterion 9, the strongest criterion here; and the
  `none` claims decision, verified against `imported_games`' CHECK constraints and a read-only
  `register-check` run. Six ledger rows proposed (D1124–D1129).
