# RFC: Variants — per-surface admission, declared rungs, and the full family

- **Status:** draft — **six blockers repaired and widened to the full family 2026-08-23, ready for
  re-review.** The cross-review's six return-class findings are resolved at source, and the document
  no longer ships the Chess960-only cut it was returned for. **What changed:** (1) **Open question 1
  is CLOSED, not re-asked** — [[D1153]] ruled *compose a bot that does not depend on Maia*, [[D1160]]
  returned the priced answer the same day, and [[D1271]] then **funded [[D810]]'s evidence-to-move
  selector**; §3.7 now carries the ruled position and cites the sibling RFC rather than putting the
  fork back to the owner. (2) **Suppression moved to request construction** — `positionCommand`
  (`opponent-selector.ts:310`) is the single site where `position fen` is written to an engine, so
  criterion 5 asserts there and covers the evidence paths, not the picker. (3) **The stale-board
  failure is normative body text**, not a review note. (4) **§5 adopts the boot-time kind-vs-spec
  assertion** — the only one of the three exits that makes criterion 10 failable. (5) **960 drill
  packs are ADMITTED** — the three asserted blockers all failed at source, [[D327]] asked for them by
  name, and the cut did not survive [[D1230]]. (6) **Criteria 2 and 12 are rebound to failable
  forms.** **And the widening, which is the larger repair:** the owner ruled a *family*
  ([[D1031]]/[[D1042]]) and the previous draft shipped one member. §7 now specifies **Tier 2 as
  evidence-dark play** in Just Play, import and campaign, and §8 specifies **Tier 3's reduced-army
  family**, which needs no variant machinery at all. *(Prior lines for history: returned to author
  2026-08-23 after a cross-review that re-derived 97 claims and failed 27; before that, draft —
  2026-08-23.)*
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
run-schema | lane 0.20 | DrillRun.rules (new, optional, closed union over chessops' RULES minus 'chess'; absent means standard chess — a Tier-2 run is not self-describing because its ruleset is not in the FEN)
```

## Summary

This RFC does two separable things.

**It states the admission law as a per-surface matrix** ([[D1042]]), so that "do we support
variant X" stops being a question with one answer. The same variant is refused in a drill pack,
optional in Just Play, accepted on import and analysis, and legitimate as a campaign run-modifier.
That structure — not a permitted-variants list — is the durable content here, and it is what lets
every later variant be admitted or refused without re-litigating the law.

**And it ships the family the owner ruled, not one member of it.** Tier 1 (Chess960) reaches every
surface including drill packs; **Tier 2 reaches Just Play, import/analysis and the campaign as
evidence-dark play** (§7); **Tier 3's reduced-army family reaches everything** because it is not a
variant at all — those are legal standard positions and the tablebase turns *on* below seven units
(§8). What v1 refuses, it refuses for a cited reason: fairy pieces and non-8×8 boards have no library
support at any price, and xiangqi/shogi is a measurement ([[D328]]) with a named owner.

**Chess960 is the member measured in most depth**, because it is the sole variant where the
rules *are* standard chess and only the starting arrangement differs — so every
detector, the phase model, Syzygy, the explorer and Stockfish all survive intact — measured, not
assumed (§3). The cost is unusually low because `chessops` was written for a 960-native server:
castling rights are already stored as a set of **rook squares** rather than `KQkq` flags, and
`normalizeMove` already converts the standard castling dialect *into* king-takes-rook, so
[[D1029]]'s ruling this morning is the form the library already uses internally.

**Maia goes dark outside standard chess, and the owner ruled that we do not accept it.** Maia is
trained on standard human games; a randomised back rank is out of distribution from move one, and
the far end is worse than weak play — the pinned sidecar cannot *parse* a 960 position and answers
`go` from a **stale board** (§3.7, measured). [[D1153]] ruled the response: *"we just need 'bot
capas'… make some that don't consume maia-produced evidence"*. The commissioned research returned
the same day ([[D1160]]) and [[D1271]] then **funded [[D810]]'s evidence-to-move selector**, which is
the durable, variant-portable answer and is being drafted as `rfc/evidence-move-selector.md`. **This
RFC therefore ships the interim the dossier recommends and does not re-open the fork**: a 960 or
Tier-2 start offers a **composed Stockfish opponent, disclosed and labelled uncalibrated, and its
results are unrated** (§3.7). What was Open question 1 is closed by ruling, not carried.

**Claims one run-schema lane, 0.20**, and it is the honest cost of shipping the family rather than
one member: a Chess960 FEN is self-describing (§3.4) but **a Tier-2 game is not** — Crazyhouse's
start *is* the standard FEN, so a run must record its ruleset or every downstream reader mis-reads
it as standard chess. **No pack-schema lane** — §6's admission of 960 packs needs none, because
`pack.start.fen` carries the arrangement exactly as a run's start FEN does, so **Gate F clause 1 is
untouched by this RFC** (it is a Boolean over pack-schema lanes, `plan.md:48`).

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
reads **"As far as we like"**, and §2.3 then admitted Tier 1 only — so the qualifier resolved the owner's
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

**§2.3 What v1 admits — the family, per surface.** The owner ruled a family ([[D1031]]) under a
per-surface law ([[D1042]]); v1 ships that, not one member of it. The admitted set is the
intersection of §1's law with what each tier's rungs can honestly support:

| | Drill packs | Just Play | Import / analysis | Campaign |
|---|---|---|---|---|
| **Tier 1** (Chess960) | ✅ **admitted** (§6) — every rung survives, so the standard-only law's own rationale does not reach it | ✅ admitted | ✅ admitted | ✅ admitted |
| **Tier 2** (7 chessops rulesets) | ❌ refused — evidence-dark, so a drill can ground nothing (§1's law, applied) | ✅ **admitted, evidence-dark** (§7) | ✅ **admitted, evidence-dark** | ✅ **admitted** as evidence-dark play nodes |
| **Tier 3a** (reduced armies, pawns-only) | ✅ **admitted** — not a variant at all (§8) | ✅ admitted | ✅ admitted | ✅ admitted |
| **Tier 3b** (fairy pieces, non-8×8) | ❌ refused | ❌ refused | ❌ refused | ❌ refused — **no library support at any price**, cited in §8 |
| **Tier 3c** (xiangqi, shogi) | — | — | — | — deferred to [[D328]]'s measurement, Discharge D3 |

**The one rule that makes Tier 2 shippable rather than dangerous is §2.2's**: its instruments are
**suppressed, not annotated**. A tier is admitted to a surface when the surface can be honest about
what it cannot say — not when every rung survives.

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

**§3.4 A Chess960 run needs no new persisted field, and this is what distinguishes Tier 1 from
Tier 2.** The FEN carries the arrangement and the castling rights; `transposeKey` and `canonicalFen`
are stable across the notation round-trip (§3.1). **A Tier-1 run therefore records nothing extra.**
The contrast is exactly why this RFC claims a run-schema lane once it admits Tier 2 (§7.5): a
Tier-2 game is *not* self-describing — its rules are not in the FEN, and Crazyhouse's start *is* the
standard position — so `DrillRun.rules` exists for that tier and is **absent** for Chess960.
**The term is `rules`** — chessops' own
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
| 1 | Amend the published refusal with a stated reason **and extend the startup gate to assert kind-vs-spec agreement** (§5.2) | `apps/server/src/capabilities.ts:133` + `assertAdvertisedCapabilityDispositions` `:167-188` | the row edit is 1 line; **the gate extension is the real work** and is what makes criterion 10 failable |
| 2 | Set `UCI_Chess960` on the engine spec; option pass-through is already generic | `apps/server/src/engine-supervisor.ts:330-332` | **not "config" — it changes the castling dialect for STANDARD runs too; see below** |
| 3 | Lift the import refusal for `Chess960`/`Fischerandom`, with the FEN requirement (§4) | `apps/server/src/pgn-import.ts:32-35` **and the uncounted clone at `apps/server/src/repertoire-pgn.ts:42`** | ~3 lines × 2 sites |
| 4 | Accept a pasted 960 FEN as a Just Play start | existing start path | none — v1 generates nothing |
| 5 | **Refuse a non-standard start at the Maia WRITE** (§3.7b), and filter the offered set as a second, weaker layer | `positionCommand` `apps/server/src/opponent-selector.ts:310` (the single write site); offered set at `:515-524` | **not "small"** — no per-position gate exists, and the guard must cover the evidence paths, not the picker |
| 6 | Widen the explorer `variant` param — **optional, and v1 declines it** (Open question 2) | `apps/server/src/sourcing/explorer.ts:67` | 1 line in the URL builder (`ExplorerQuery` carries no `variant` field, so a caller-controlled value also touches the type and `normalizeExplorerQuery` `:54-62`) |
| 7 | **Tier 2** (§7): `DrillRun.rules` on lane 0.20, producer-level instrument suppression (§7.2), and the import arm recording the ruleset (§4.4) | run schema + the story evidence pass + `pgn-import.ts` | **the largest item here — it is the widening, not a rider** |

Items 1–3, 5 and 7 are v1. Item 4 is deliberately *nothing*: a Scharnagl start generator is real new
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

**§3.7a — the far end, normative.** *(Was a cross-review note; it is body text because it is the
reason suppression must be a hard refusal rather than a filtered picker.)* At the pinned SHA
(`workers/maia/Dockerfile:3` → `1e13597…`), `maia3/uci.py:422` builds `chess.Board(fen)` **without
`chess960=True`**. Measured over all **960** Chess960 start positions: **0 raise**; **858 lose ALL
castling rights**, 84 lose some, 18 are unaffected, **0 fabricate** rights — `clean_castling_rights`
masks to `BB_A1|BB_H1`/`BB_A8|BB_H8` and requires the king on e1/e8. Then `uci.py:443-444` performs a
bare `return` when a replayed history move is illegal, leaving `self.board` at the **previous
position with no error channel**, while `opponent-selector.ts` waits only for `bestmove` — which it
duly receives, **for a different position**. The board self-reports `Status.BAD_CASTLING_RIGHTS` and
nothing asks. **The failure is silent and confident, which is why §3.7b guards the write and not the
menu.**

**§3.7b — suppression is at REQUEST CONSTRUCTION, and there is exactly one site.** The picker is the
wrong boundary: `availableModes()` (`opponent-selector.ts:515-524`) takes **no position argument** —
it is a function of engine health alone — and four paths reach Maia without consulting any offered
set, **two of them hardcoding `human_common` regardless of the run's policy**: `rest.ts:1354-1358`
(`GET /runs/:id/human-split`, the human-commonality **evidence** path) and `service.ts:1201-1204`
(`human_replies` group seeding); `rest.ts:1221` and `:1738` take the mode from the request body, and
`rest.ts` contains **no** `availableModes`/`validatePolicy` call at all. [[D1161]] named
`policyUsesMaiaBand` as the remedy; it is **dead code** (`engine-band.ts:92-96`, verified zero call
sites repo-wide).

**Normative:** every Maia request is written by exactly one function — `positionCommand`
(`opponent-selector.ts:310`), which emits `position fen ${request.startFen}…` and is called at
`:544`, `:601` and `:653`. **A non-standard start must be refused there**, typed, before any engine
write, so that no caller — picker, evidence endpoint, group seeding or request body — can route
around it. The offered set is *also* filtered (§2.1's declared-rungs obligation), but that is a UX
obligation layered on top of a guard, never the guard itself.

> *Cross-review 2026-08-23, absorbed into §3.7a/§3.7b above rather than left as a note.* Two smaller
> corrections it also made, kept here because they correct earlier prose: §3.7 originally said
> `theory_strict` fails for want of **opening-book depth** — at source it is gated on **Maia health**
> (`opponent-selector.ts:519`) like the other two, and the book-depth reason is a separate true fact
> that is not the mechanism; and `PositionOpponentPolicy` is a compile-time `interface`, not a
> runtime guard, so *"suppress visibly"* had no runtime home at that pin. Both are why §3.7b names
> `positionCommand` instead.
>
> *Incidental, outside this RFC and carried as a ledger row:* `workers/maia/Dockerfile:19` pins
> `python-chess==1.999`, a shim distribution requiring `chess` with **no version constraint**, so the
> parser this whole trap turns on is unpinned despite `workers/maia/README.md:11` presenting it as a
> pin.

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

**§4.4 The guard widens per tier, with the comparison discipline stated.** [[D1042]] accepts weird
games on import and analysis, so the guard admits **Tier 1 and Tier 2**, and refuses Tier 3b/3c for
the library-support reason §8 gives. It does **not** widen to *"any variant chessops knows"* by
accident — the widening is per tier and each tier's admission carries its own downstream contract.

**The comparison rule, normative** — because *"add two string literals"* is a choice masquerading as
an implementation detail. The guard is a **case-sensitive exact match** on the raw header
(`pgn-import.ts:33`) while `parseVariant` **lowercases** and accepts sixteen Tier-1-or-standard
spellings, so literal string-matching would refuse `Fischerrandom`, `Fischer Random`, `Chess 960`,
every lowercase form and the whole `wild/0`–`wild/8a` family — spellings §3.3 argues *are* standard
chess. **v1 therefore matches on `parseVariant(header)`, not on raw strings:**

- `parseVariant(h) === 'chess'` → **Tier 1**, admitted, subject to §4.3's `FEN`/`SetUp` requirement.
- `parseVariant(h)` ∈ the seven non-standard `RULES` members → **Tier 2**, admitted, and the run
  records `rules` (§7.5) so no downstream reader mistakes it for standard chess.
- `parseVariant(h) === undefined` → **refused**, which is exactly Tier 3b/3c and needs no separate
  list to maintain.

This also closes a loophole a literal allow-list leaves open: `[Variant "From Position"]` is
**already accepted today**, so a 960 game exported under that tag imports at HEAD unguarded by
§4.3's rule. Matching on `parseVariant` puts that path under the same requirement.

**The downstream contract Tier-2 import carries.** An imported Tier-2 game flows
`importGame` → `createRun` → the story evidence pass → Stockfish and Maia, which is §2.2's
prohibition reached through the back door. Admission is therefore conditional on the suppression
being enforced at the producer (§7.2) and on §3.7b's request-construction refusal, both of which this
RFC specifies — not on a promise that the evidence pass will behave.

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

**§5.1 The disposition is not deployment-conditional today, and this RFC does not pretend otherwise.**
Every one of the **44** rows in `CAPABILITY_DISPOSITIONS` (`capabilities.ts:120-165`) is a **static
string literal** — no ternary, no `??`, no variable, no call in any `disposition:` position, and the
frozen array passes through untouched at `:359`. Verified count: **17 `reached` / 19 `refused` / 7
`unmeasured` / 1 `impossible`**, matching [[D1077]]'s figures. What *is* computed from runtime state
in this file is a pointedly different set (`providers()` `:232-264`, `surfaces()` `:266-278`,
`policyModes` `:337-346`, the Maia band `:324-332`); dispositions are excluded by design.

**§5.2 Normative: the boot-time kind-vs-spec assertion.** The startup gate
`assertAdvertisedCapabilityDispositions` (`:167-188`) currently checks only that an advertised option
**has a row** — it is indifferent to the row's *kind* (`:180`). That indifference is what would let
§3.6 item 2 ship without item 1 and diverge **silently**: the engine running with `UCI_Chess960` set
while the published table still says `refused`, and nothing detecting it.

**This RFC extends that gate to assert kind-vs-spec agreement at boot**: if the engine spec sets
`UCI_Chess960`, the row's disposition may not be `refused`; if it does not, the row may not be
`reached`. This is [[D1077]]'s *"configured at startup or not"* expressed as a check rather than a
convention, and it is the reason criterion 10 can fail — under the alternatives (flip the literal
statically, or mark it `unmeasured` with a named experiment) criterion 10 would pass on a deployment
that never sets the option. Noted at source: `apps/server/src/strong-engine.ts:54-58` sets only
`Threads`, `Hash`, `MultiPV`, and `UCI_Chess960` appears nowhere in the repo outside
`capabilities.ts:133`, so the assertion is red until item 2 lands and green only when both do.

### §6 — Chess960 drill packs are ADMITTED

The previous draft deferred these. **The deferral does not survive [[D1230]]'s test — a cut needs a
real blocker — because all three blockers it asserted fail at source**, and [[D327]], quoted in this
RFC's own Motivation, asked for exactly this: *"if we're going to add **packs** with ie fischer
random or all these other variations"*.

**(a) The pack lint already admits one.** `lintDrillPack`'s only start predicate is
`startPosition(pack.start.fen)` = `Chess.fromSetup(parseFen(fen).unwrap()).unwrap()`
(`packages/schema/src/drill-pack/lint.ts:172-173`, called at `:296`, `INVALID_START_FEN` at
`:299-303`). Measured at 0.15.1: `bqnbnrkr/pppppppp/8/8/8/8/PPPPPPPP/BQNBNRKR w HFhf -` **and** its
`KQkq` spelling both parse as legal standard `Chess` positions. That is not an accident — it is
§3.1/§3.3's thesis. Admitting 960 packs is therefore not a lint change; it is the removal of a
prohibition that was never implemented.

**(b) No pack-schema lane is needed.** §3.4's argument applies verbatim to `pack.start.fen`: the
arrangement and the castling rights are both in the FEN. **Nothing in the pack schema changes, so
Gate F clause 1 is untouched.**

**(c) The Gate F reasoning the deferral leaned on was wrong twice.** Clause 1
(`planning/platform-alignment/plan.md:48`) reads *"no active RFC holds a drill-pack schema lane"* —
**a Boolean whose threshold is zero**, red continuously since `graduation-clearance` booked 0.28. It
does not count depth. The depth framing is a *schedule* proxy narrated at `design/BACKLOG.md:390`
([[D1058]]), and compressing it into "clause 1 counts lane depth" converts a scheduling argument into
a threshold the clause does not contain. The count was stale too: **four** lanes are held, not three
(`famous-games.md` booked 0.31 eighteen minutes after this RFC first landed; `register-check` prints
`pack-schema: head 0.27; next free 0.32`).

**What admission actually requires.** A 960 pack declares its rungs like any other admitted start
(§2.1) — and for Tier 1 that declaration is *"all of them"*, because §2 measures every detector, the
phase model, Syzygy, the explorer and Stockfish as surviving. The authoring surface gains a start
that is not the standard back rank; nothing else moves.

**The law's rationale reaches Tier 2, not Tier 1.** [[D1042]]'s drill-pack row says *standard chess
only*, and the owner's stated reason is evidence-darkness — *"a drill exists to say something
grounded about a position, and outside standard chess the evidence stack has nothing true to say"*
(`design/06-campaign.md:288`). **Tier 1 is not evidence-dark.** The rule keeps its full force
where it was aimed: Tier 2 drill packs stay refused (§7), for the reason the owner gave.

*(This resolves what cross-review raised as Open question 5 — resolved on the ruling's own rationale
rather than by re-asking the owner, since the engineering answer is now known and is not a blocker
in either direction.)*

**A count correction carried from cross-review, because the old row did gate work with it:**
`content/packs/` is empty and `content/drafts/` holds **56** pack documents; "50 authored packs" is
reached only by excluding six `*.browser.json` fixture packs, which the validator's own corpus rule
does **not** exclude (`packJsonFiles`, `apps/server/src/pack-check.ts:44-55`, filters only
`isSidecarName`) and which are real `DrillPackDefinition`s. The honest phrasing is *"50 authored
packs (56 documents including six browser fixtures)"*.

### §7 — Tier 2: admitted as evidence-dark play

[[D1042]] admits any variant to Just Play, accepts weird games on import and analysis, and lets the
campaign go *"as far as we like"*. The previous draft deferred all seven Tier-2 rulesets behind a
discharge; **§2.2's suppression rule is what makes them shippable, and it is specified here rather
than postponed.**

**§7.1 The members.** Exactly the seven non-standard members of chessops' `RULES`
(`dist/types/types.d.ts:54`, verified): `antichess`, `kingofthehill`, `3check`, `atomic`, `horde`,
`racingkings`, `crazyhouse`. The library ships all seven; move generation, legality and terminal
detection come free.

**§7.2 What a Tier-2 surface may show.** The branch runtime is FEN-shaped, not rules-shaped, so
**rewind, fork, compare and the whole consequence loop survive intact** — which is the product's
actual thesis and the reason Tier 2 is worth admitting at all. What must be **suppressed, not
annotated** (§2.2): engine evaluations, grades, Maia mass, tablebase verdicts, phase classification,
and every structural detector. A Tier-2 run renders the board, the move list, the branch tree and
the learner's own comparisons — and says nothing it cannot ground.

**§7.3 Why suppression rather than a caveat, restated because it is the whole safety argument.** In
Atomic, Antichess or Crazyhouse a standard-chess evaluator does not fail — it returns a **wrong
number carrying the full authority of a right one**. Annotating it produces exactly the
*"Stockfish: +0.54 / Maia: 31%"* dashboard `CLAUDE.md` names as the anti-pattern this product must
not become, with the aggravation that the number is also false. **No Tier-2 surface may display an
engine evaluation, a grade, a Maia mass or a tablebase verdict**, and the suppression is enforced at
the producer, not the renderer.

**§7.4 The opponent.** Maia is dark in Tier 2 for the same reason as Tier 1 and with the same
failure mode (§3.7a), so §3.7b's request-construction refusal covers it unchanged. `strong_engine`
is **also** unavailable in Tier 2 — Stockfish does not implement these rulesets, so its move would be
illegal rather than merely weak. **v1 Tier-2 play is therefore human-vs-human or solo**, and
[[D1271]]'s funded evidence-to-move selector is the path to a Tier-2 opponent, since a
feature-and-weights selector is the only base type that ports across rulesets ([[D1160]]).
Fairy-Stockfish is the engine that *does* implement them and is named there as the Tier-2
dependency; it is out of scope here and carried by Discharge D2.

**§7.5 The run must record its ruleset.** A Tier-2 game is **not self-describing**: Crazyhouse's
starting position *is* the standard FEN. Without a recorded ruleset every downstream reader treats
it as standard chess — which is §4.3's import trap, one layer deeper. Hence this RFC's single claim:
`DrillRun.rules`, run-schema **lane 0.20**, an optional closed union over the seven, absent meaning
standard chess. Absence-means-standard keeps every existing run valid with no migration.

**§7.6 Drill packs stay refused for Tier 2**, on [[D1042]]'s own rationale (§6): evidence-dark is
precisely the case the standard-only rule was aimed at. The pack schema gains nothing here, and
`pack.start.fen` cannot express a ruleset — which is the same fact stated from the other side.

### §8 — Tier 3: reduced armies admitted, fairy pieces refused, foreign games measured

**§8.1 Reduced armies and pawns-only are ADMITTED EVERYWHERE, and they are not a variant.**
A pawns-only or reduced-army position is a **legal standard-chess position**: standard rules,
standard board, standard pieces. Every rung survives unchanged, and the **tablebase turns *on***
below seven units rather than off — so these are the one member of the family where the evidence
stack gets *stronger*, not weaker. The derivation calls this *"the highest evidence-per-effort item
in the family"*, and it needs **nothing from this RFC**: no lint change, no schema change, no lane,
no admission entry. It is listed here so the family is complete and so nobody defers it again by
mistaking it for a variant. Drill packs may use it today.

**§8.2 Fairy pieces and non-8×8 boards are REFUSED, with the reason cited.** `parseVariant` returns
`undefined` for these (`pgn.ts:671-672`'s `default: return;`), and no chessops ruleset implements a
non-standard piece or a non-8×8 board. This is a **library-support refusal, not a product opinion**
— the distinction [[D1030]] exists to keep visible — and it is recorded rather than silent so that a
future library capability reopens it on evidence.

**§8.3 Duck Chess and Fog of War in literal form are REFUSED**, same ground: `parseVariant` returns
`undefined` for both (confirmed at 0.15.1, alongside Xiangqi, Shogi and Bughouse). Fog's *idea*
already ships better as the suppressor boss (`rfc/campaign-core.md:219-221`), which is a legibility
mechanic implemented in standard chess rather than a ruleset we cannot execute.

**§8.4 Xiangqi and shogi are a MEASUREMENT, not a deferral.** [[D328]] accepted degraded support in
advance; what is unknown is whether the branch runtime is FEN-shaped enough to adapt. The measurement
is one afternoon — whether `Node.fen` and `transposeKey` are the only FEN-shaped types in the branch
runtime — and it decides whether this is an adapter over SFEN or a second product sharing a shell.
Discharge D3 carries it with a named owner and a named artifact.

### §9 — What v1 still defers, and to whom

Each row names a home and an owner; per [[D1230]] a deferral without both is not a deferral.

| Deferred | Why — the actual blocker | Home and owner |
|---|---|---|
| **A Tier-2 opponent** | Stockfish cannot execute these rulesets; the portable base type is [[D1271]]'s funded selector, and Fairy-Stockfish is its Tier-2 engine dependency | `rfc/evidence-move-selector.md` (claude, in drafting) + Discharge D2 |
| **Xiangqi / shogi** | [[D328]]'s one-afternoon measurement has not been run (§8.4) | Discharge D3, `planning/variants/` (claude) |
| **A Scharnagl start generator** | Not needed: a pasted FEN reaches every downstream symbol (§3.6 item 4), so v1 generates nothing and loses nothing | Discharge D1 (codex), when a start picker wants it |
| **960 opening-explorer data** | One line at `explorer.ts:67` buys it, and 960's *point* is having no book — a product question, not a blocker | Open question 2 (OWNER) |
| **Solitaire chess** ([[D869]]) | Shares no code with the variant axis; its blocker is the law-8 seal reconciliation `campaign-core.md:489` already demands | its own lane, in parallel (claude) |
| **Fairy pieces, non-8×8, Duck, Fog** | **Refused, not deferred** — no library support at any price (§8.2, §8.3) | recorded refusal; reopens only on a library capability |

## Deviations from design

**One.** `design/research/fun-mechanics-outside-roguelikes.md:1130-1133` states *"A variant node has
no grounded instrument behind it"*. §2 contradicts it for Chess960, on measurement: every detector,
the phase model, Syzygy and Stockfish survive Tier 1 intact. The dossier's sentence is correct for
Tiers 2 and 3 and is retained for them. No design document is amended by this RFC (law 5); the
correction belongs to the research tier and is recorded as a proposed ledger row.

## Acceptance criteria

Numeric criteria carry their computed numbers ([[D984]]); each names the wrong implementation it
rejects.

1. **The admission matrix is data with TWO fields, not prose and not one field.** A single exported
   table carries, per surface, **(a) the law** — §1's admission verb, which only the owner changes —
   and **(b) the v1 shipped member set**, which narrows over time. Every surface that admits a start
   consults (b), and (a) is asserted equal to §1's table. *Wrong implementation rejected:* **collapsing
   the two fields into one**, which is exactly how the original criterion 12 went wrong — a
   single-field table must contradict either the owner's law (*Just Play: any variant*) or v1's
   shipment, and whichever it contradicts becomes machine-enforced. Also rejected: a per-call
   `if (variant === "chess960")`, which passes any prose-only reading.

   > *Cross-review 2026-08-23, now addressed by the two-field form above.* Three sub-findings the
   > author must still honour in the implementation. **(i)** §1's cells are admission **verbs**, not
   > tiers, so field (a) stores the verb and field (b) stores the tier set. **(ii)** **No such table
   > exists at HEAD** — no `admissionMatrix`, no `*_ADMISSION_*` constant, and no surface consults any
   > per-variant table today (admission is the two hardcoded refusals plus the explorer literal). This
   > is new construction, not an extension. **(iii)** It collides with the shipped surface vocabulary:
   > `SURFACE_IDS` (`capabilities.ts:40-48`) has **seven** members — `play`, `review`, `learn`, `live`,
   > `create`, `justPlay`, `fromPosition` — and none of §1's four rows is a `SurfaceId`. In particular
   > **`fromPosition` has no row**, and per §3.6 item 4 that is the surface a pasted 960 FEN actually
   > starts on. The table must either map onto `SurfaceId` or declare its own vocabulary and state the
   > mapping; "every surface consults it" is otherwise passed by a table with one reader.
2. **A drill pack may carry a Tier-1 start and may not carry a Tier-2 one.** Two arms, both failable:
   **(a)** a pack whose start FEN is a randomised back rank (`bqnbnrkr/pppppppp/8/8/8/8/PPPPPPPP/BQNBNRKR w HFhf -`)
   **lints clean and preserves its start** through `startPosition`; **(b)** a pack that declares a
   Tier-2 ruleset is **refused at the schema**, since `pack.start.fen` cannot express one and no pack
   field admits `rules` (§7.6). *Rejected by (a):* adding a back-rank check to the lint — the
   prohibition §6 removes, which would pass the old criterion and refuse the packs [[D327]] asked for.
   *Rejected by (b):* accepting a `rules`-bearing pack, which would route an evidence-dark game into
   the drill surface [[D1042]] reserves for standard chess.

   > *Cross-review 2026-08-23 — the previous form was **unsatisfiable by identity** ([[D984]]): it
   > asserted the lint **refuses** a non-standard start, but the lint's only start predicate is
   > `Chess.fromSetup(parseFen(fen).unwrap()).unwrap()` (`drill-pack/lint.ts:172-173`) and **a 960
   > start FEN IS a legal standard-chess position under it** — measured, in both spellings. No 960
   > fixture could make that refusal fire. The repair is not a better fixture: it was deciding whether
   > 960 packs are admitted, which §6 now does on [[D1042]]'s own rationale. With admission settled,
   > arm (a) asserts the behaviour that ships and arm (b) asserts the boundary that must hold, and
   > both can go red.*
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
5. **No non-standard start reaches Maia, asserted at the WRITE and not at the menu.** The strong
   arm: for a run whose start is not a standard back rank, **no `position fen …` command is written
   to the Maia engine by any path** — asserted at `positionCommand` (`opponent-selector.ts:310`, the
   single site, called at `:544`, `:601`, `:653`), with the fixture driving the two paths that
   hardcode `human_common`: `GET /runs/:id/human-split` (`rest.ts:1354-1358`) and `human_replies`
   group seeding (`service.ts:1201-1204`). The weak arm, additionally: the three Maia-backed modes are
   absent from the offered set and the surface says why. *Wrong implementation rejected — and it is
   the only implementation currently possible:* **filtering the picker and leaving every other Maia
   caller untouched**, which passes an offered-set criterion while the 960 FEN still reaches a sidecar
   that answers `go` from a stale board (§3.7a).

   > *Cross-review 2026-08-23 — the previous form guarded the offered set, which is the wrong
   > boundary and had nothing to attach to: `availableModes()` (`opponent-selector.ts:515-524`) takes
   > **no position argument**, [[D1161]]'s named remedy `policyUsesMaiaBand` (`engine-band.ts:92-96`)
   > is **dead code with zero call sites**, and four paths reach Maia without consulting any offered
   > set. Rebound above to the write site, per §3.7b.*
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
9. **The import guard matches on `parseVariant`, and Tier 3 stays refused.** Three arms: **(a)** a
   `[Variant "Chess960"]` game with `FEN`/`SetUp` imports (criterion 7) **and so do its alternate
   spellings** — `Fischerandom`, `Chess 960`, lowercase forms and `wild/0`–`wild/8a`, since
   `parseVariant` maps all sixteen to `'chess'` (§3.3); **(b)** the seven Tier-2 rulesets import **and
   the resulting run records `rules`** (§7.5); **(c)** `Duck Chess`, `Xiangqi`, `Shogi` and
   `Bughouse` are **refused**, because `parseVariant` returns `undefined` (§8.2/§8.3). *Rejected by
   (a):* a case-sensitive two-string allow-list, which refuses spellings §3.3 argues are standard
   chess and leaves `[Variant "From Position"]` as an unguarded 960 loophole. *Rejected by (b):*
   admitting a Tier-2 game **without** recording `rules`, which makes every downstream reader treat
   Crazyhouse as standard chess — §4.3's trap one layer deeper. *Rejected by (c):* widening to
   "anything chessops parses", since `undefined` is the library saying it cannot execute the game.
   **Both clones are asserted**: `parsePgnMainline` and `parseRepertoirePgn` (`repertoire-pgn.ts:42`),
   or the criterion measures one of two guards (§3.6 item 3).

   > *Cross-review 2026-08-23 called the previous form the strongest criterion in the document, with
   > one dependency: "exactly two new strings" followed from a comparison discipline the author had
   > not stated. §4.4 now states it, and the criterion follows it. The seven Tier-2 strings are exactly
   > the seven non-standard members of chessops' `RULES` (verified at
   > `dist/types/types.d.ts:54` — 8 members, 7 non-standard), so arm (b) is complete against the
   > library rather than against a hand-list.*
10. **The published disposition cannot disagree with the engine spec.** `capabilities.ts` contains a
    `UCI_Chess960` row whose reason cites the ruling, **and the startup gate asserts kind-vs-spec
    agreement** (§5.2): with the option set, the row may not be `refused`; without it, the row may not
    be `reached`. *Rejected:* flipping the literal to `reached` on a deployment whose engine spec never
    sets the option — which the previous form permitted, because all 44 dispositions are static
    literals and the gate checked row **existence**, not kind. *Also rejected:* deleting the row, which
    loses the published-refusal history §5 requires.

    > *Cross-review 2026-08-23 — the previous form **passed on a lie**: "no longer `refused`" was
    > satisfiable by a one-string edit with nothing asserting the engine actually had the option. Of
    > §5's three honest exits, the boot-time assertion is the only one that makes this criterion
    > failable, which is why §5.2 adopts it. It is red at HEAD in both directions —
    > `strong-engine.ts:54-58` sets only `Threads`, `Hash`, `MultiPV`, and `UCI_Chess960` appears
    > nowhere outside `capabilities.ts:133` — so it goes green only when item 1 and item 2 land
    > together.*
11. **The run-schema lane is claimed and no pack-schema lane is.** The `tabiya-claims` block declares
    `run-schema | lane 0.20` and nothing else; `make register-check` is green with this RFC active,
    and the declaration joins its Live-claims row byte-exactly (C3). *Rejected:* claiming a pack lane
    for 960 packs, which §6(b) shows is unnecessary and which would move Gate F clause 1 — a Boolean
    over pack-schema lanes — for no gain.

    > *Cross-review 2026-08-23 noted that the previous `none` made this criterion near-vacuous:
    > register-check was green repo-wide with or without the RFC. With a real claim it asserts
    > something about this document — C3's byte-exact join is a check the claim can fail.*
12. **A Tier-2 start is refused by the SHIPPED-MEMBER field, and the LAW field still reads the
    owner's words.** Two arms against criterion 1's two-field table: **(a)** a fixture requesting a
    Tier-2 start on a surface whose shipped set excludes it is refused **with a message naming the
    tier**; **(b)** the law fields for Just Play and campaign read *any variant* and *as far as we
    like* — [[D1042]]'s wording — regardless of what v1 ships. *Rejected by (a):* a surface that
    admits by law and forgets to consult the shipped set. *Rejected by (b), and this is the point:*
    **an implementation that hard-codes the law narrower than the owner ruled** — which is what the
    original criterion 12 did, asserting no code path may admit a non-`'chess'` ruleset and thereby
    freezing a refusal the owner had already lifted.

    > **Cross-review 2026-08-23 — the previous two forms were BOTH defective, in opposite
    > directions.** The original *"no code path admits a `Rules` value other than `'chess'`"* would
    > have failed the moment anyone implemented [[D1042]]. Its [[D1231]] replacement — a bound on what
    > a learner surface *offers* — **could not fail at all**: chessops' `Rules` type is imported by
    > **zero** files repo-wide (verified), and the RFC introduced no `rules` field, so the assertion
    > was true by absence of its referent for every possible implementation. One criterion nothing
    > could pass and one nothing could fail, in one document. The rebind above has a referent — `rules`
    > now exists (§7.5) — and both arms can go red.
    >
    > **The rule this criterion carries is promoted out of it** into the RFC template as a proposed
    > ledger row, with its twin: *a criterion may bound what we ship; it may never bound what the owner
    > has ruled* — and *a criterion no implementation can turn red is the same defect as one no
    > implementation can turn green.*
13. **A Tier-2 run renders no engine evaluation, grade, Maia mass or tablebase verdict**, asserted at
    the producer rather than the renderer (§7.2/§7.3), with a fixture driving a Crazyhouse import
    through the story evidence pass. *Rejected:* suppressing in the view layer while the producer
    still computes and stores a standard-chess centipawn for a position whose rules it does not
    implement — the wrong number is then one template change from being shown, and §2.2's whole
    argument is that a wrong number carries the authority of a right one.
14. **A Tier-2 run keeps its branch runtime.** Rewind, fork, compare and re-entry all operate on a
    Crazyhouse run, asserted end to end. *Rejected:* gating the consequence loop on evidence
    availability, which would make the product's own thesis unavailable exactly where §7 admits the
    tier for.
15. **A reduced-army position needs no variant machinery.** A pawns-only start (`8/pppppppp/8/8/8/8/PPPPPPPP/4K2k w - -`
    shape) starts a run, lints as a pack, and **carries no `rules` value** — it is standard chess
    (§8.1). *Rejected:* routing it through the variant admission path, which would suppress the
    evidence stack on a position where the tablebase is *more* available than usual, not less.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | A Scharnagl start generator, if a start picker ever wants one — v1 accepts pasted FENs and needs none (§3.6 item 4, §9) | codex | the implementing commit that adds a 960 start picker | |
| D2 | A **Tier-2 opponent** — Fairy-Stockfish as the engine that implements the seven rulesets, consumed through [[D1271]]'s funded selector; also the Tier-2 tablebase/explorer endpoint questions (§7.4) | claude | `rfc/evidence-move-selector.md`'s landing commit | |
| D3 | **Tier 3c** — [[D328]]'s one-afternoon measurement of whether `Node.fen` and `transposeKey` are the only FEN-shaped types in the branch runtime, which decides whether xiangqi/shogi is an adapter over SFEN or a second product sharing a shell (§8.4) | claude | `planning/variants/` | |
| D4 | The research-tier correction to `fun-mechanics-outside-roguelikes.md:1130-1133` (Deviations) | claude | the dossier's next edit | |
| D5 | Implementation of §3.6, §4, §5.2, §6 and §7 | codex | the implementing commit | |
| D6 | The [[D523]] one-authority repair — `parsePgnMainline` is documented as the sole legality authority and `repertoire-pgn.ts:42` is a byte-identical clone; either consolidate or amend the claim (§4.2) | codex | the implementing commit | |

## Open questions

**Nothing here blocks acceptance.** The two questions the previous draft marked blocking were both
already ruled; they are recorded as closed rather than re-asked, per [[D1150]]'s lesson.

1. **CLOSED by ruling — the Maia-dark opponent.** The previous draft carried this as
   *"⚖ OWNER, BLOCKING ACCEPTANCE — is a Maia-dark Chess960 acceptable?"*, and it should not have:
   **[[D1153]] ruled it the same day and ruled against the framing** — *"we just need 'bot capas'…
   make some that don't consume maia-produced evidence"*, i.e. **do not accept the gap**. The
   commissioned research returned that day ([[D1160]]) with the interim on file, and **[[D1271]] then
   funded [[D810]]'s evidence-to-move selector** as the durable answer. §3.7 carries the ruled
   position: a composed **Stockfish** opponent, disclosed, labelled uncalibrated, results unrated,
   with the human-likeness measurement binding on what the card may say — and the portable base type
   arrives in `rfc/evidence-move-selector.md`. Two corrections that came with the ruling and are
   folded into §3: **Fairy-Stockfish cannot fill the base-layer slot** (the contract is a
   *distribution*, not an engine — `BotPolicyCandidateInput` requires `rawMass` per candidate), and
   **the shipped Stockfish 18 already advertises `UCI_Chess960`** (confirmed by handshake), so
   `capabilities.ts:133` was never a capability limit.
2. **⚖ OWNER — is 960 opening-explorer data wanted?** One line at `explorer.ts:67` buys it, and 960's
   *point* is having no book. v1 declines it; the question is whether that is right. **Not
   acceptance-blocking** — declining is the conservative default and reversing it is one line.
3. **CLOSED — a 960 result is unrated, and it follows rather than being chosen.** [[D1160]]'s
   `uncalibrated` label carries it: no strength number, no ladder, no difficulty dial, so an unrated
   result is a consequence of the opponent's label rather than a separate policy. The citation that
   actually bites is `rfc/learner-rating.md:252` — `strong_engine` *"carries no band and no
   calibration"* — not `capabilities.ts:148`, since a 960 game against `strong_engine` reaches a
   **rules-terminal** result and `:146` marks rating from those `reached`.
4. **[[D328]]'s cheap measurement** (Discharge D3) is one afternoon and decides whether westernised
   xiangqi/shogi is an adapter over SFEN or a second product sharing a shell. It should be taken
   independently of this RFC and does not gate it.
5. **CLOSED — Chess960 drill packs are admitted (§6).** Cross-review raised this as an owner fork,
   and it is resolved on **[[D1042]]'s own rationale** rather than by re-asking: the ruling's reason
   is evidence-darkness, Tier 1 is not evidence-dark, and the three engineering blockers the deferral
   asserted all fail at source. [[D327]] asked for 960 packs by name. **If the owner reads the
   standard-only wording as reaching Tier 1 regardless of its rationale, that is a veto to state —
   but it is a veto of a ruled-in position, not an open question.**

## Ledger rows (proposed — id assigned at landing; head was **D1285** at repair)

Unnumbered per [[D1130]]'s convention as it stood; renumber from the head in the landing commit.

- 🐞 the research dossier's *"a variant node has no grounded instrument behind it"*
  (`fun-mechanics-outside-roguelikes.md:1130-1133`) is **false for Chess960** and true only for
  Tiers 2–3; the over-broad form is why the lane sat unrouted for a week.
- 📊 the derivation's §4.4 latent-defect claim about `chessgroundDests` phantom castling destinations
  is **refuted at source and now measured**: the branch fires only for an e-file king whose a1/h1
  rook square is a legal destination, and 8904 driven gestures produced **240 phantoms, 0
  mismatches** (§3.5).
- 🐞 `startingPosition({Variant: "Chess960"})` with no FEN header returns the **standard** position,
  so lifting the import guard without requiring `FEN`/`SetUp` silently imports standard games as 960
  (§4.3). Confirmed at 0.15.1; contrast `Duck Chess`, which errors — the trap exists **only** for the
  spellings this RFC admits.
- 🐞 **`parsePgnMainline` is not the sole legality authority it is documented to be.**
  `repertoire-pgn.ts:42` runs a byte-identical `Variant` guard inside a separate parser with its own
  `parsePgn` and `startingPosition`, serving repertoire import from pasted PGN and Lichess study
  URLs. `rfc/live-sources.md:102` asserts the one-authority discipline ([[D523]]) and it is untrue at
  HEAD. Carried as Discharge D6.
- 🐞 **`policyUsesMaiaBand` is dead code** (`engine-band.ts:92-96`, zero call sites repo-wide) and is
  nonetheless named as the remedy in [[D1161]]. Separately, **four paths send a FEN to Maia without
  consulting any offered mode set**, two hardcoding `human_common` regardless of the run's policy
  (`rest.ts:1354-1358`, `service.ts:1201-1204`; `rest.ts:1221,1738` take the mode from the request
  body, and `rest.ts` contains no `availableModes`/`validatePolicy` call at all). §3.7b builds the
  suppression at request construction because of this.
- 🐞 **The Maia sidecar's parser is unpinned.** `workers/maia/Dockerfile:19` installs
  `python-chess==1.999`, a shim distribution whose metadata requires `chess` with **no version
  constraint**, while `workers/maia/README.md:11` presents it as a pin. The library that parses every
  FEN Maia sees floats, and §3.7a's measured 960 castling behaviour depends on it.
- 📊 **`chessgroundDests` withholds a legal gesture in 960.** With the king on e1 and the rooks off
  a1/h1, chessops accepts the familiar two-square castle (`normalizeMove(e1c1) = e1b1`, `isLegal`
  true) but `chessgroundDests` never offers `c1` — the board offers less than the rules layer takes.
  Completeness gap, not a correctness defect.
- 🐞 **`tools/evidence-topology-harness/audit.test.ts:41` asserts `CAPABILITY_DISPOSITIONS` has 39
  rows; it has 44.** Found while recounting for §5. Outside this RFC's scope, but it is a red guard
  nobody is reading.
- ⚖ **Promote into the RFC template, beside [[D984]]'s numeric guard:** *a criterion may bound what
  we ship; it may never bound what the owner has ruled* — and its twin, **a criterion that no
  implementation can turn red is the same defect as one no implementation can turn green.** Both
  fired inside this document: criterion 12 in each direction across two drafts, criterion 2
  unsatisfiable, and §1's campaign row narrowing the ruling inside the cell stating it.
- 🐞 **Gate F clause 1 is a Boolean, not a depth count** (`planning/platform-alignment/plan.md:48`:
  *"no active RFC holds a drill-pack schema lane"*), red continuously since `graduation-clearance`
  booked 0.28. The depth framing is a **schedule proxy** narrated at `design/BACKLOG.md:390`
  ([[D1058]]); compressing it into "clause 1 counts lane depth" converts a scheduling argument into a
  threshold the clause does not contain, and it was used in this RFC and elsewhere to justify cuts.

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

- 2026-08-23 **repair + widening (this revision).** All six return-class blockers resolved at source,
  and the document no longer ships the Chess960-only cut it was returned for.

  **The six.** (1) **Open question 1 is closed by ruling, not re-asked** — [[D1153]] ruled *compose a
  bot that does not depend on Maia*, [[D1160]] priced it the same day, and [[D1271]] funded
  [[D810]]'s selector; §3.7 carries the ruled interim (composed Stockfish, disclosed, uncalibrated,
  unrated) and cites `rfc/evidence-move-selector.md` for the durable path. Asking again would have
  been [[D1150]]'s defect. (2) **Suppression moved from the picker to the write** — §3.7b names
  `positionCommand` (`opponent-selector.ts:310`), the single site that emits `position fen`, because
  `availableModes()` takes no position argument, `policyUsesMaiaBand` is dead code, and two paths
  hardcode `human_common`. (3) **§3.7a is body text** — the sidecar cannot *parse* a 960 position
  (858 of 960 arrangements lose all castling rights, 0 raise) and then answers `go` from a stale
  board; the guard exists because the failure is silent and confident. (4) **§5.2 adopts the
  boot-time kind-vs-spec assertion**, the only one of three exits that makes criterion 10 failable.
  (5) **§6 admits 960 drill packs** — the three asserted blockers all fail at source, [[D327]] asked
  for them by name, and the cut failed [[D1230]]; resolved on [[D1042]]'s own rationale
  (evidence-darkness, which does not reach Tier 1) rather than by re-asking the owner. (6)
  **Criteria 2 and 12 rebound to failable forms** — they were [[D984]]'s two halves in one document,
  one unsatisfiable and one unfailable, four criteria apart.

  **The widening, which is the larger repair.** The owner ruled a **family** ([[D1031]]) under a
  per-surface law ([[D1042]]) and the previous draft shipped one member with the rest behind
  discharges. §2.3 now states the admitted set per tier per surface; **§7 specifies Tier 2 as
  evidence-dark play** in Just Play, import and campaign — admitted because §2.2's suppression rule
  is specified here rather than postponed, and because the branch runtime is FEN-shaped, so the
  consequence loop survives where the instruments do not; **§8 specifies Tier 3**, admitting the
  reduced-army family everywhere (it is not a variant — legal standard positions, and the tablebase
  turns *on* below seven units), refusing fairy pieces and non-8×8 boards on a **library-support**
  ground rather than a product opinion, and carrying xiangqi/shogi as [[D328]]'s measurement with a
  named owner. §9's deferral table now gives every row a home **and** an owner, per [[D1230]].

  **Claims changed from `none` to `run-schema | lane 0.20`** — the honest cost of the widening. A
  Chess960 FEN is self-describing; **a Tier-2 game is not**, since Crazyhouse's start *is* the
  standard FEN, so `DrillRun.rules` records the ruleset and absence keeps every existing run valid.
  **No pack-schema lane**, so Gate F clause 1 is untouched — and that clause is a **Boolean at
  threshold zero**, not a depth count, a correction that removes the reasoning used to justify the
  pack deferral in the first place.

  **Criteria are now 15**, adding Tier-2 suppression at the producer (13), Tier-2 branch-runtime
  survival (14) and reduced-army admission without variant machinery (15).
