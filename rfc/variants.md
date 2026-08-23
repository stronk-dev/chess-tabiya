# RFC: Variants — per-surface admission, declared rungs, and Chess960 as the v1 member

- **Status:** draft — 2026-08-23
- **Author:** claude (drafted from `planning/variants/rfc-derivation.md`)
- **Created:** 2026-08-23
- **Design refs:** `design/06-campaign.md` §3 (the surface-scoped balance law, [[D1042]], and the
  encounter-class table at `:371-376`); `design/00-thesis.md` (the play-the-consequence identity and
  the tactics-trainer prohibition); `CLAUDE.md` law 8
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
`strong_engine` alone. That is a real product degradation, it is not repairable by any work in this
RFC, and whether it is acceptable is Open question 1 — the fork [[D1030]] found was asserted rather
than asked.

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
| **Campaign** | **Unrestricted**, subject to §2 | A variant campaign is a **new-hero unlock** in the Slay-the-Spire sense — it changes the entire run structure, not a setting on the standard one |

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
`parseCastlingFen` (`src/fen.ts:86-109`) accepts both the `KQkq` X-FEN dialect and Shredder file
letters, round-tripping to `KQkq` when unambiguous — **lossy in notation, lossless in meaning**, so
`canonicalFen` and `transposeKey` (`chess.ts:12-19`) stay stable.

**§3.2 The castling convention is the library's own.** `normalizeMove`
(`chessops/src/chess.ts:614-622`) converts the standard dialect **into** king-takes-rook:
`normalizeMove(e1g1) → e1h1`. King-takes-rook is chessops' canonical internal form and `isLegal`
accepts both dialects. [[D1029]]'s ruling therefore costs nothing to honour and would cost a
rewrite to reverse. This RFC **consumes** that ruling and adds nothing to it; `exact-legal-mobility`
owns the identity/projection/display split.

**§3.3 Independent confirmation from the other direction.** `parseVariant`
(`chessops/src/pgn.ts:614-624`) maps **`Chess960` and `Fischerandom` to `'chess'`** — the library
asserts that 960 is not a separate ruleset at all. That is the strongest available confirmation
that Tier 1 has exactly one member and that it is not really a variant.

**§3.4 A Chess960 run needs no new persisted field.** The FEN carries the arrangement and the
castling rights; `transposeKey` and `canonicalFen` are stable across the notation round-trip
(§3.1). This RFC therefore claims **no run-schema lane**. Open question 3 records the condition
under which that changes: a Tier-2 variant is *not* self-describing (the rules are not in the FEN),
so the first Tier-2 RFC claims a lane for a `rules` field. **The term is `rules`** — chessops' own
word — because `variant` is taken three times already (`schedules.variant` at
`apps/server/src/storage.ts:4153`, which is the spaced-repetition blocked/varied column;
`retryVariants`; `variantOf`). [[D327]]'s claim that a chess-variant `variant` column already
exists is refuted ([[D1035]]).

**§3.5 The board layer needs no change, and this corrects the derivation.**
`chessgroundDests` (`chessops/src/compat.ts:26-43`) appends phantom `c1`/`g1` king destinations
only when `!opts?.chess960` **and** the king is on the e-file **and** the a1/h1 rook square is
itself a legal destination. In Chess960 the king's castling destination is fixed at the c- or
g-file by rule, so whenever that branch fires its output is **correct**, in 960 as in standard
chess. The derivation's §4.4 recorded this as a latent defect; verified at source, it is not one,
and the cost list loses an item. Two consequences worth pinning:

- With the king off the e-file — the common 960 case — the branch never fires and the king's
  destinations are the raw king-takes-rook set, which chessground's `tryAutoCastle`
  (`@lichess-org/chessground@10.1.1/src/board.ts:81-100`) castles correctly because it reads a rook
  at an **occupied** destination and skips its own e-file rewrite (`:90-93`, guarded on
  `!state.pieces.has(dest)`).
- The familiar two-square king gesture in standard chess is what those phantom destinations
  preserve, so they must **not** be removed globally. `rookCastles` is absent from
  `@lichess-org/chessground@10.1.1` (verified: no occurrence in the shipped package), but the
  destinations serve the *board's accepted gesture*, not that removed option.

**§3.6 What Chess960 actually requires.**

| # | Obligation | Home | Size |
|---|---|---|---|
| 1 | Amend the published refusal with a stated reason (§5) | `apps/server/src/capabilities.ts:133` | 1 line + the documented act |
| 2 | Set `UCI_Chess960` on the engine spec; option pass-through is already generic | `apps/server/src/engine-supervisor.ts:331` | config |
| 3 | Lift the import refusal for `Chess960`/`Fischerandom`, with the FEN requirement (§4) | `apps/server/src/pgn-import.ts:32-35` | ~3 lines |
| 4 | Accept a pasted 960 FEN as a Just Play start | existing start path | none — v1 generates nothing |
| 5 | Suppress the Maia-backed opponent modes for a 960 start, visibly (§3.7) | `packages/runtime/src/types.ts:76-78`, `apps/server/src/opponent-selector.ts:521-530` | small |
| 6 | Widen the explorer `variant` param — **optional, and v1 declines it** (Open question 2) | `apps/server/src/sourcing/explorer.ts:67` | 1 line |

Items 1–3 and 5 are v1. Item 4 is deliberately *nothing*: a Scharnagl start generator is real new
code and v1 does not need it, because a pasted FEN reaches every downstream symbol already.

**§3.7 Maia goes dark, and the surface says so.** `RUN_OPPONENT_MODES`
(`packages/runtime/src/types.ts:41-48`) has five members. In a Chess960 start, `human_common`,
`practical_resistance` and `theory_strict` are unavailable — the first two need Maia, the third
needs opening-book depth that 960 does not have by design. `strong_engine` and `perfect_tablebase`
survive. `PositionOpponentPolicy` (`types.ts:76-78`) restricts Just Play to
`human_common | strong_engine`, so **a Chess960 Just Play session offers `strong_engine` alone.**

Per §2.1 this is declared rather than discovered: the start surface states which opponent modes the
chosen start supports and why the others are absent, using the same *availability* vocabulary
`design/06-campaign.md` uses for difficulty labels. It does not offer a mode and fail later.

### §4 — Import: one allow-list entry, and its silent-wrong twin

**§4.1 The refusal.** `apps/server/src/pgn-import.ts:32-35` rejects any `Variant` header other than
`Standard` or `From Position`. A fully valid Chess960 PGN — correct `[FEN]`, `[SetUp "1"]`, legal
moves — is rejected **on the header alone**, though every downstream symbol would have handled it.

**§4.2 One edit fixes four paths.** `parsePgnMainline` is the sole legality authority for pasted
PGN, Lichess-URL import, `splitBroadcastRound` (`rfc/live-sources.md:98-103`), and `importLeg`
(`apps/server/src/live-session.ts:237,241`). Widening the guard once serves all four. Lichess runs
Chess960 broadcasts, which today fetch, split, and then fail per-board with an opaque message.

**§4.3 The trap, and the rule that closes it.** `startingPosition({Variant: "Chess960"})` with no
FEN header returns **the standard position** — measured. The arrangement lives in `[FEN]`, not in
the variant tag. **Normative: a `Chess960`/`Fischerandom` header without a `FEN`/`SetUp` pair is
REFUSED, not defaulted.** Without this rule, lifting the guard silently imports standard games
labelled as 960, and every detector downstream reads the mislabel as truth.

**§4.4 The guard widens per-tier, explicitly.** It must not widen to "any variant `chessops` knows".
A Tier-2 game admitted at import flows into `importGame` → `createRun` → the story evidence pass →
Stockfish and Maia, which is §2.2's prohibition reached through the back door. v1 adds exactly two
strings.

### §5 — The capability refusal is amended, not deleted

`capabilities.ts:133` currently reads `UCI_Chess960`, `disposition: "refused"`, reason *"The shipped
drill format is standard chess only"*.

**The refusal is amended with a stated reason and a ruling reference**, never quietly removed —
`design/research/fun-mechanics-outside-roguelikes.md:128` records it as a *published* refusal, and
a published refusal that vanishes without an act is how a decision loses its history.

Under [[D1077]]'s two-state model — *not configured at startup → outright unsupported; configured
but unreachable → temporarily unavailable* — Chess960 support is a **deployment fact**: it is
configured or it is not. The disposition therefore becomes `reached` on a deployment whose engine
spec sets the option (§3.6 item 2), and the row carries the ruling reference so the amendment is
traceable to [[D1093]]/[[D1031]] rather than appearing as an unexplained flip.

### §6 — What v1 defers, and to whom

| Deferred | Why | Home |
|---|---|---|
| **Chess960 drill packs** | The pack lint requires *"parses the start as legal standard chess"* (`docs/drill-pack-format.md:171`) and all 50 authored packs are standard. Admitting 960 packs needs a pack-schema lane, and Gate F clause 1 counts lane depth — three are already held (0.28/0.29/0.30). Just Play and import need none | Discharge D1 |
| **Tiers 2 and 3** | §2.2's suppression rule must ship before any surface can host them | Discharges D2, D3 |
| **Solitaire chess** ([[D869]]) | Shares no code with the variant axis; its blocker is the law-8 seal reconciliation `campaign-core.md:489` (D2) already demands, not engineering | its own lane, running in parallel |
| **Reduced armies / pawns-only** ([[D873]]) | **Not a variant** — legal standard positions, full evidence, and the tablebase turns *on* below 8 units. The highest evidence-per-effort item in the family, and it needs nothing from this RFC | its own lane |
| **A `rules` field and a Scharnagl generator** | Neither is needed for a pasted-FEN 960 start (§3.4, §3.6) | Discharge D2 claims the lane when Tier 2 arrives |
| **Duck Chess and Fog of War in literal form** | No library support at any price (`parseVariant` returns `undefined` for both). Fog's *idea* already ships better as the suppressor boss (`rfc/campaign-core.md:219-221`) | refused, recorded |

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
2. **A drill pack cannot carry a non-standard start.** The pack lint refuses a pack whose start FEN
   is not legal standard chess, with a fixture asserting the refusal fires. *Rejected:* silently
   accepting, since all 50 shipped packs are standard and would not notice.
3. **A Chess960 FEN starts a Just Play run**, plays to a legal terminal position, and rewind, fork
   and compare all operate on it — asserted on a position with the king **off** the e-file, where
   the phantom-destination branch never fires (§3.5).
4. **The castling identity is the library's canonical form.** For a 960 start, a castling move round-trips
   `makeUci(normalizeMove(pos, parseUci(uci))) === uci`, and its SAN renders `O-O`/`O-O-O`.
   *Rejected:* a c/g-file rewrite, which round-trips only on standard back ranks.
5. **The three Maia-backed opponent modes are absent from a 960 start's offered set**, and the
   surface states why. *Rejected:* offering them and failing at selection time — the criterion asserts
   the offered set, not the failure.
6. **`strong_engine` in a 960 start returns a legal move** and the engine spec carries
   `UCI_Chess960`. *Rejected:* the option unset, which yields standard-castling moves that are
   illegal in the position.
7. **A valid Chess960 PGN imports**, with a fixture carrying `[Variant "Chess960"]`, `[SetUp "1"]`
   and a `[FEN]` with a randomised back rank.
8. **A `Chess960` header with no `FEN`/`SetUp` is REFUSED** (§4.3), with the refusal asserted
   explicitly. *Rejected:* defaulting to the standard position, which passes criterion 7 while
   silently corrupting every downstream reading.
9. **The import guard admits exactly two new strings.** A fixture asserts that `Crazyhouse`,
   `Atomic`, `Antichess`, `Horde`, `Racing Kings`, `King of the Hill` and `Three-check` remain
   refused. *Rejected:* widening to `parseVariant`-knows-it, which passes criterion 7 and admits
   seven rulesets §2.2 forbids.
10. **The capability row is amended, not deleted.** `capabilities.ts` contains a `UCI_Chess960` row
    whose disposition is no longer `refused` and whose reason cites the ruling. *Rejected:* deleting
    the row, which loses the published-refusal history §5 requires.
11. **No pack-schema and no run-schema lane are claimed.** `make register-check` is green with this
    RFC active, and the `tabiya-claims` block reads `none`.
12. **No Tier-2 surface exists.** A grep-able assertion that no code path admits a `Rules` value
    other than `'chess'`. *Rejected:* an unreferenced Tier-2 branch, which is how §2.2's prohibition
    would leak in ahead of its RFC.

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
2. **⚖ OWNER — is 960 opening-explorer data wanted?** One line at `explorer.ts:67` buys it, and 960's
   *point* is having no book. v1 declines it; the question is whether that is right.
3. **Is a 960 result rated?** Glicko-2's arithmetic works, but rating needs a *measured* opponent and
   Maia is dark, so no calibrated human opponent exists. `capabilities.ts` already refuses rating
   from engine-adjudicated outcomes. The recommended answer is **unrated, stated**; recorded here
   rather than decided, because it interacts with `learner-rating`'s accepted predicate.
4. **[[D328]]'s cheap measurement** (Discharge D3) is one afternoon and decides whether westernised
   xiangqi/shogi is an adapter over SFEN or a second product sharing a shell. It should be taken
   independently of this RFC.

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
  imports standard games as 960 (§4.3).

## Changelog

- 2026-08-23 — drafted from `planning/variants/rfc-derivation.md` under owner rulings [[D1093]]
  (drafting mandate), [[D1031]] (the lane is a family) and [[D1042]] (the surface-scoped balance
  law). Scoped to Chess960 in Just Play and import; packs and Tiers 2–3 deferred behind named
  discharges. Two derivation claims corrected at source (proposed rows D1122, D1121).
