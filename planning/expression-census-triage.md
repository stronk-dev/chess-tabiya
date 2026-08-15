# Expression census — first real triage

- **Date:** 2026-08-15
- **Instrument:** `make expression-census` (`rfc/archive/expression-census.md`, implemented at
  `6d85a59`, archived at `4a893dc`). Report-only; nothing under `content/` was edited by this run
  or by me.
- **Job:** the drafting pass measured; this run re-measures and **triages**. It is the payback run
  for the ledger row at 7 attestations.
- **Evidence labels:** `[V]` = re-derived by running the shipped instrument during this pass;
  `[M]` = my inference from `[V]` measurements. Every `[V]` number below is reproducible with the
  commands in §0.

> **The distinction this document is organised around, restated because everything depends on it
> (`rfc/archive/expression-census.md` §1):** *fires on zero corpus positions* is a **coverage
> fact** and may be perfectly correct; *is unsatisfiable* is a **bug**. The instrument reports them
> separately. This run found **zero unsatisfiable expressions**, so **nothing in this document is a
> refutation**, and the fix list below is a list of coverage and authoring decisions, not a defect
> list. Law 8 applies throughout: I report where expressions fire and how they compare to their
> **own authored prose**. I nowhere judge whether a chess claim is true.

---

## §0. What was run

```
make expression-census OUT=/tmp/census-full.json                    # exit 0
node apps/server/dist/expression-census.js --corpus /tmp/nb/drafts \
     --out /tmp/census-nobrowser.json                               # exit 0  (D55, §2)
make shape-check FILE=content/shapes/opposite-castling-race.json CORPUS=content/drafts
make shape-check FILE=content/shapes/knight-vs-bishop.json CORPUS=content/drafts \
     PROBE="4k3/8/2p5/3n4/8/8/8/2B1K3 w - - 1 2"
node apps/server/dist/shape-check.js \
     "content/shapes/kid-chain-arrangement.json,content/shapes/carlsbad.json" "" "content/drafts"
```

All five exited **0** `[V]`. Per §7a of the RFC the census exits non-zero only on a proven
`UNSATISFIABLE`, a `WITNESS_LINE_ILLEGAL`, or a read failure — **never on a coverage number** — so
exit 0 with 36 zero-firing subjects is the contract working, not a silent pass.

Decomposition beyond the shipped report (per-arm firing counts, trigger∧signature conjunctions,
`named_structure` sweeps) was done by importing `runExpressionCensus` from the built bundle with
`{ expression }` — i.e. the same `EXPR=` path the Makefile exposes, driven in a loop. No new
evaluator was written; `matchesStructuralExpression` is the only oracle used anywhere in this
document `[V]`.

**Corpus freshness.** The corpus has **not** moved since the drafting pass: `git log 6d85a59..HEAD
-- content/` is empty, and the last content commit (`930b367`) precedes the census commit `[V]`.
`content/packs` is empty; all 43 packs live in `content/drafts`. Every headline figure therefore
reproduces exactly, which is the strongest possible determinism check on the instrument — two
independent bundles, same numbers.

---

## §1. Current numbers vs the drafting pass

| Measurement | Drafting pass (`rfc/archive/expression-census.md`) | This run | Δ |
|---|---|---|---|
| Packs | 43 | **43** | — |
| Authored spine positions | 694 | **694** | — |
| Transitions | 651 | **651** | — |
| Shape entries / plans / non-null signatures / nulls | 25 / 117 / 96 / 21 | **25 / 117 / 96 / 21** | — |
| Subjects | 159 | **159** | — |
| `neverFiresInCorpus` | 36 | **36** | — |
| — of which shape triggers | 8 of 25 | **8 of 25** | — |
| — of which signatures | 28 of 96 | **28 of 96** | — |
| — of which pack subjects (38 sites) | 0 | **0** | — |
| Signatures with non-empty in-shape denominator | 64 | **64** | — |
| — firing 0 times in-shape | 43 | **43** | — |
| — of those, firing elsewhere in the corpus | 30 | **30** | — |
| `inShapeDenominatorEmpty` | 40 | **40** | — |
| `firesOnMajority` | 2 signatures | **12 subjects** (2 signatures + 10 pack subjects) | see note |
| `firesOnDegenerate` | not headlined | **45** | new |
| **`unsatisfiable`** | **0** | **0** | — |
| `satisfiabilityUnknown` | 36 | **35** | **−1** |

Two deltas, both explained:

- **`satisfiabilityUnknown` 36 → 35.** The witness fixture is no longer empty:
  `apps/server/src/fixtures/expression-witnesses.json` carries **one** key,
  `content/shapes/knight-vs-bishop.json#/plans/3/success/signature`, with two witnesses (one
  `anchored`/`expect:true`, one `reference`/`expect:false`), both of which behave as declared
  `[V]`. That single subject is lifted `unknown → satisfiable` with `"basis": "witness"`. **The
  corpus did not move; the evidence base did.** This is exactly the number the RFC said would fall
  as witnesses are authored, moving for exactly the predicted reason.
- **`firesOnMajority` 2 → 12.** Not a change: the drafting pass reported the figure for
  *signatures* (`carlsbad/black-central-counter` 586/694, `lucena/white-build-the-bridge` 436/694 —
  both reproduce exactly `[V]`), while `totals` counts *subjects*. The other 10 are pack
  `successCondition` / `fenPredicate` sites. Same class of unit error the RFC's own §3d table
  records for three of its first-draft totals.

**Nothing regressed and nothing new broke.** The instrument is stable across two builds and the
content it measures is unchanged.

---

## §2. D55 — the `.browser` fixture question, both numbers stated

Two dossiers previously disagreed on denominators purely because of the six browser test fixtures.
Here are both, measured, so nothing downstream has to guess `[V]`:

| Convention | Packs | Positions | Transitions | Roots |
|---|---|---|---|---|
| **Census convention** (fixtures counted, reported separately as `corpus.fixturePacks`) | **43** | **694** | 651 | 43 |
| **R3 / `tools/r1r2-primitives-harness` convention** (`.browser.json` excluded by name) | **37** | **671** | **634** | 37 |

671 = 634 transitions + 37 roots; 694 = 671 + 23. The six fixtures are
`immediate-guard-browser`, `line-boundary-browser`, `outcome-hold-browser`, `outcome-resist-browser`,
`stated-reasoning-browser`, `trajectory-legs-browser`. This reproduces the RFC's reconciliation
table to the unit.

**The finding that settles the argument for triage purposes:** I ran the full census under both
conventions and diffed every subject `[V]`.

- `subjects`, `neverFiresInCorpus`, `firesOnlyOutsideShape`, `inShapeDenominatorEmpty`,
  `unsatisfiable`, `satisfiabilityUnknown` are **identical (159 / 36 / 30 / 40 / 0 / 35)** under
  both conventions.
- **Zero subjects flip zero-status.** No expression fires only because of a fixture; no expression's
  in-shape denominator becomes empty or non-empty when the fixtures leave.
- **Zero subjects are *hosted* in a `.browser.json` pack** — the six fixtures declare no
  `successCondition`, no `fenPredicate`, no structural expression at all `[V]`. This is why the
  subject count is convention-independent.
- **Zero subjects fire *only* in fixture packs** `[V]`.

**Conclusion for downstream consumers:** the fixtures move the *denominator* (694 vs 671) and
**one** numerator worth naming — D43's, §5 — and change **no verdict, no bucket, and no total**.
Quote 694/43 when citing the census, 671/37 when citing R3, and note that the choice is
presentational for every conclusion in this document. The RFC's open question 9 (should acceptance
criterion 1 be read against a fixture pack?) is unaffected by this run: `trajectory-legs-browser`
remains the only `packsWithoutSpine` entry and remains a test asset.

---

## §3. The three-bucket triage

Scope: **every zero-firing expression** — the 36 subjects labelled `NEVER_FIRES_IN_CORPUS`.
(The wider 43-subject `NEVER_FIRES_IN_SHAPE` set is triaged in §4; the two sets overlap in 13.)

| Bucket | Count | Definition | Evidence |
|---|---:|---|---|
| **(a) genuinely dead** | **0** | unsatisfiable, or satisfiable but unable to arise in the pack that declares it | see below |
| **(b) correct but uncovered** | **1** | satisfiable, verified against constructed witnesses, simply not in this corpus | witness fixture |
| **(c) unknown** | **35** | instrument returns `unknown`; no witness exists either way | census `satisfiability.basis` |

### Bucket (a) — genuinely dead: **empty**, and here is why that is a real finding, not a shrug

Three independent tests, all negative `[V]`:

1. **No refutation rule fires on any of the 159 subjects.** `totals.unsatisfiable = 0`. R1–R8 are
   sound-but-incomplete, so this proves nothing positive — it means no subject is *provably* dead.
2. **No signature is dead against its own shape.** I ran the refutation arm on
   `all[trigger, signature]` for **all 96** non-null signatures — the conjunction that would model
   "this plan can never be marked successful inside its own shape". Result: **21 satisfiable (by
   corpus), 75 unknown, 0 unsatisfiable** `[V]`. Not one signature contradicts its own trigger
   syntactically.
3. **No zero-firing expression is hosted by a pack that could refute it.** All 36 zero-firing
   subjects are shape-entry subjects. **All 38 pack-hosted subjects fire at least once corpus-wide**
   `[V]`, so the "cannot arise in the pack that declares it" clause has no instance among
   zero-firing expressions. The nearest live cases are the 20 pack subjects that fire 0 times *in
   their own pack* while firing corpus-wide — covered in §6, and expected rather than defective
   under RFC §9's evaluation-order rule.

Of the 8 zero-firing triggers, 7 are **orphans** (referenced by no pack at all — `doubled-c-pawns`,
`hanging-pawns`, `iqp-black`, `knight-vs-bishop`, `maroczy-bind`, `up-an-exchange`, `vancura`) and
the 8th (`opposite-castling-race`) is referenced only `prospective` `[V]`. An orphan entry cannot be
dead *in a declaring pack* because no pack declares it `[M]`.

### Bucket (b) — correct but uncovered: **1**

| Site | Coverage | Satisfiability |
|---|---|---|
| `content/shapes/knight-vs-bishop.json#/plans/3/success/signature` (`black-anchor-the-knight`) | 0 of 694; in-shape 0/0 | **`satisfiable`, `basis: "witness"`** — anchored witness fires `true`, reference witness fires `false`, both as declared |

This is the case the RFC built the witness arm for, and it is the only subject in the repo currently
carrying its own evidence. It is an 18-arm outpost enumeration that fires nowhere in 694 authored
positions and is nonetheless demonstrably satisfiable. **It needs no fix.** It is the template for
the other 35.

### Bucket (c) — unknown: **35**

`verdict: "unknown"`, `basis: "no refutation rule fired and no witness exhibited"`. Per RFC §5c the
remedy is identical for all of them: *write a witness first*. Sub-partitioned by what a content agent
would actually do, using per-arm decomposition I ran on each `[V]`:

| Sub-bucket | Count | Character | Action |
|---|---:|---|---|
| **c1 — dead arm located** | 8 | one specific arm fires 0 of 694 and pins the whole expression; the rest of the expression fires | witness the arm, or extend a spine to reach it |
| **c2 — every arm fires, the conjunction does not** | 12 | each arm is individually covered; the *combination* never occurs (in-shape or corpus-wide) | witness the combination |
| **c3 — derived zero under a zero-firing trigger** | 14 | the host entry's trigger fires 0, so the signature's zero carries no information (`inShape 0/0`) | fix (or ledger) the entry's coverage first; the signature is not separately actionable |
| **c4 — atomic detector never matches** | 2 | trigger is a bare `named_structure` feature that fires 0 of 694 | see §7 fix list |

(8 + 12 + 14 + 2 = 36, minus the 1 bucket-(b) subject which sits inside what would otherwise be
c3 = **35** `[V]`.)

---

## §4. The 43 in-shape zeros — where the headline number sits today

The drafting pass's marquee figure reproduces exactly: **43 of the 64 signatures with a non-empty
in-shape denominator fire zero times in-shape, and 30 of those fire somewhere in the corpus but
never inside their own shape** (`FIRES_ONLY_OUTSIDE_SHAPE` — D43's pattern, 30 instances) `[V]`.

**This is not 30 defects, and the RFC says so at §9 in a sentence that must travel with the number:**
*a success signature is read at the end of a run, when the entry's own trigger may no longer hold.*
The named live instance reproduces: `lucena/white-build-the-bridge` fires 436 of 694 corpus-wide and
**0 of 14 in-shape**, because the Lucena trigger forbids a queen and the plan succeeds after the pawn
promotes `[V]`. The in-shape subset is a **diagnostic denominator, never a normative one**.

The 30, ranked by corpus firings (all `[V]`, in-shape denominator in brackets):

| Corpus | In-shape | Subject |
|---:|---|---|
| 586/694 | 0/41 | `carlsbad/black-central-counter` (also `FIRES_ON_MAJORITY`, fires on all 7 degenerate boards) |
| 436/694 | 0/14 | `lucena/white-build-the-bridge` — **RFC §9's named correct-by-construction case** |
| 283/694 | 0/19 | `queen-vs-pawn-on-seventh/white-zigzag-approach` |
| 234/694 | 0/1 | `open-centre/black-neutralize-and-level` — denominator is 1 |
| 202/694 | 0/8 | `bishop-good-bad/white-invade-the-other-colour` |
| 191/694 | 0/8 | `bishop-good-bad/black-free-or-trade` |
| 139/694 | 0/6 | `opposite-coloured-bishops/white-king-breaks-the-blockade` |
| 133/694 | 0/4 | `pawn-breakthrough-outside-passer/white-passer-as-decoy` |
| 109/694 | 0/77 | `closed-centre-chain/black-chip-the-head` |
| 99/694 | 0/10 | `advance-caro-dxc5-residue/black-regain-the-pawn` |
| 87/694 | 0/7 | `queenless-middlegame/white-king-into-the-game` |
| 58/694 | 0/4 | `pawn-breakthrough-outside-passer/black-blockade-cheaply` |
| 47/694 | 0/14 | `london-wedge/black-challenge-the-outside-bishop` |
| 44/694 | 0/14 | `london-wedge/black-trade-the-c-pawn-for-the-file` |
| 40/694 | 0/14 | `lucena/white-run-out-the-checks` — RFC §9's other named case |
| 32/694 | 0/41 | `rook-4v3-same-side/white-offer-rook-trades` |
| 31/694 | 0/7 | `queenless-middlegame/white-first-weakness` |
| 30/694 | 0/41 | `carlsbad/white-central-break` |
| 30/694 | 0/14 | `london-wedge/white-unlock-with-e4` |
| 28/694 | 0/14 | `london-wedge/white-recapture-toward-the-h-file` |
| 18/694 | 0/4 | `iqp-white/white-d5-break` |
| 16/694 | 0/1 | `open-centre/white-seize-the-file` |
| 16/694 | 0/17 | `philidor/white-king-before-pawn` |
| 13/694 | 0/14 | `london-wedge/black-free-the-light-bishop-first` |
| 7/694 | 0/41 | `carlsbad/black-piece-trades` |
| 6/694 | 0/44 | `fianchetto-g7/white-trade-the-fianchetto-bishop` |
| 2/694 | 0/14 | `london-wedge/black-send-the-bill-to-b2` |
| 1/694 | 0/10 | `advance-caro-dxc5-residue/black-undermine-with-a5` |
| 1/694 | 0/44 | `fianchetto-g7/white-h-file-lever` |
| 1/694 | 0/14 | `kid-chain-arrangement/black-slow-the-queenside` |

The remaining 13 of the 43 fire 0 corpus-wide as well and are the c1/c2 rows of §3 — they are listed
with their dead arm in §5.

**Structural note `[M]`:** 6 of the 30 belong to `london-wedge` and 3 to `carlsbad`, both of which
have large denominators (14 and 41). An entry whose trigger fires on many positions and whose plans
fire on none of them is the most diffable signal this census produces; it is what a second run after
a content wave should be compared against.

---

## §5. Where the 13 corpus-zero, non-empty-denominator signatures die

Per-arm decomposition, all `[V]`. "arm N" = index into the top-level `all`/`any`. Coverage numbers
are corpus-wide firings of that arm alone; `in-shape` is the arm conjoined with the entry trigger.

| Subject | Dead component | Rest of the expression | Class |
|---|---|---|---|
| `carlsbad/white-kingside-attack` | arm 0 = `pieceOnSquare h5 = white pawn` — **0/694** | arm 1 fires 102/694 (2 in-shape) | c1 |
| `closed-centre-chain/white-attack-where-the-chain-points` | arm 0 = `any[white pawn on f5, g5, h5]` — **0/694** | arms 1–2 (pawns e5, d4) fire 129 and 294, both 77/77 in-shape | c1 |
| `kid-chain-arrangement/white-blunt-the-f-pawn` | arm 2 = `any[white rook f2, white rook e1]` — **0/694** | arm 0 (pawn f3) 24, arm 1 (knight d3/d2) 39 | c1 |
| `kid-chain-arrangement/black-lock-with-f4-and-storm` | arm 0 = `pieceOnSquare f4 = black pawn` — **0/694** | arms 1–3 fire 150 / 22 / 73, each 14/14 in-shape | c1 |
| `london-wedge/black-fianchetto-the-light-bishop` | arm 0 = `pieceOnSquare b7 = black bishop` — **0/694** | arm 1 475/694, arm 2 144/694 (14/14 in-shape) | c1 |
| `open-centre/white-central-outpost` | `pieceOnSquare d5 = white knight` — **0/694**; second arm's `pieceOnSquare e5 = white knight` fires 3/694 | outpost features fire 47 and 29 | c1 |
| `open-centre/black-central-outpost` | `pieceOnSquare d4 = black knight` — **0/694** | `e4 black knight` 13/694, `outpost black e4` 1/694; the pair never co-occurs | c1/c2 |
| `fianchetto-g7/black-long-diagonal-pressure` | arm 1 = `mirrored(files, …)` ⇒ **black bishop on b7 with clear b7–h1** — **0/694** | arm 0: `Bg7` fires **44/44 in-shape**, `line_blockers g7→a1 = 0` fires 155/694 but **0 of 44 in-shape** | c1 + c2 |
| `iqp-white/black-convert-the-endgame` | conjunction only | `named_structure(iqp-white)` fires **4/4 in-shape**; "no white queen" 258/694 and "no black queen" 302/694 each fire **0 in-shape** | c2 |
| `kid-chain-arrangement/white-strike-the-base-with-c5` | conjunction only | arm 0 (`pawn c5`) fires 13/694 but **0 in-shape**; arms 1–2 fire 14/14 in-shape | c2 |
| `kid-chain-arrangement/white-cash-the-break-into-the-c-file` | conjunction only | arm 0 fires 399/694 but **0 in-shape**; arms 1–2 14/14 in-shape | c2 |
| `opposite-coloured-bishops/white-two-wings-two-passers` | conjunction only | queenside passer arm fires 24/694 (**6/6 in-shape**); kingside passer arm 5/694 (**0 in-shape**) | c2 |
| `rook-4v3-same-side/black-trade-pawns-not-rooks` | conjunction only | all four arms fire in-shape (17 / 24 / 41 / 41); see §7 item 1 — the in-shape black-pawn counts are **0 (×17) or 3 (×24)**, so the interval `[1,2]` is empty over this denominator | c2 |

**The dominant pattern `[M]`:** eight of thirteen die on a single **specific square occupancy** that
no authored spine ever reaches — a pawn on h5, on f5/g5/h5, on f4, on c5; a bishop on b7; a knight on
d5 or d4; a rook on f2/e1. In every one of those eight I checked the plan's own authored prose
against the expression, and **the expression says what its prose says** (e.g.
`kid-chain-arrangement/white-blunt-the-f-pawn`'s prose reads *"a pawn to f3 behind e4, the king's
knight rerouted to d3 or d2 …, and a rook stepping to f2 or e1"* — the expression is that sentence,
arm for arm). These are **coverage facts about short authored spines**, not authoring errors. That
is the single most important conclusion of this triage.

---

## §6. Findings about the instrument itself, produced by running it

Three things worth a ledger row (I did not write any — `design/BACKLOG.md` has a single writer):

1. **`inPack` zeros are computed but carry no observation label and no total.** `coverageRecord`
   emits `inPack` for all 38 pack subjects, and **20 of the 38 fire 0 times on their own pack's
   spine** while firing 118–436 times corpus-wide `[V]` — e.g.
   `mate-two-bishops#/objective/successConditions/0/feature` at 364/694 corpus, **0/18 in-pack**.
   `observations()` never inspects `coverage.inPack`, so there is no `NEVER_FIRES_IN_PACK` label and
   `totals` cannot see it. Under RFC §9 most of these are expected (a success condition is read at
   run end, off-spine), which is exactly why the *pack* analogue of `NEVER_FIRES_IN_SHAPE` deserves
   the same report-severity label the shape side has, rather than silence `[M]`.
2. **`FIRES_ON_DEGENERATE` is the largest single label at 45 subjects** (26 pack, 16 signature,
   3 trigger) and is not in `totals` either. 25 subjects fire on `bare_kings`. Three **triggers**
   fire on degenerate boards: `pawn-opposition-key-squares` (bare kings + both single-pawn boards),
   `rook-4v3-same-side` (`rooks_only`), `open-centre` (`queens_only`) `[V]`. §6 of the RFC calls this
   a warning that exists to make the author look; nobody has looked yet.
3. **`open-centre`'s in-shape denominator is 1.** Its trigger fires on exactly one corpus position
   (`trajectory-qgd-exchange-minority`), so all four of its signatures' in-shape results are
   statistically empty while still counting toward the 43 `[V]`. Worth flagging as a caveat wherever
   the 43 is quoted.

---

## §7. The fix list — specific, ordered, and for a content agent

**No expression below is refuted.** Each item names the site, the measurement, and what the content
agent has to decide. I do not prescribe chess content; where I say "should say", it is against the
entry's **own authored prose or id**, quoted.

### 1. `content/shapes/rook-4v3-same-side.json#/trigger` — the trigger does not mention pawns
**Highest value item in this run.** The trigger is `all[white rook ≥1, black rook ≥1, no
queens/bishops/knights, open a-file, open b-file, open c-file, open d-file]` — **no pawn constraint
at all** `[V]`. Consequence, measured: it fires 41 times, and the in-shape black-pawn distribution is
**17 positions with 0 black pawns and 24 with 3** `[V]`. The 17 are precisely the spines of
`philidor-passive-rook-convert` (3) and `philidor-third-rank-hold` (14) `[V]`. Those 17 are what make
`black-trade-pawns-not-rooks` (black pawns in `[1,2]`) fire **0 of 41 in-shape**, and the entry's
`white-offer-rook-trades` fires on the `king_and_one_white_pawn` degenerate board.
**What to decide:** whether an entry whose id is `rook-4v3-same-side` should have a trigger that
admits pawnless-for-Black rook endings. If not, the trigger needs a pawn-count constraint; the
in-shape denominator would fall from 41 toward 24 and three of its plans' in-shape zeros would
change meaning. **Do not** treat the plan signature as the bug — the decomposition puts the looseness
in the trigger.

### 2. `content/shapes/fianchetto-g7.json#/plans/0/success/signature` — the mirrored arm
Arm 1 is `mirrored(axis: files, all[black bishop g7, line_blockers g7→a1 = 0])`, which after the file
mirror asks for a **black bishop on b7 with a clear b7–h1 diagonal**. It fires **0 of 694** `[V]`,
inside an entry whose own trigger requires a bishop on g7 and fires 44 times, all 44 with `Bg7`
`[V]`. The plan's prose says *"the fianchetto bishop reaches across the board at full length"*
(singular, and the entry is `fianchetto-g7`).
**What to decide:** whether a file-mirrored arm belongs on a *plan* inside a side-specific entry, or
whether the `mirrored` wrapper was intended at entry level. Separately: arm 0's clear-diagonal
condition fires 155 times corpus-wide but **0 of the 44 in-shape** — the bishop is always there, the
open diagonal never is. That half is pure coverage.

### 3. `content/shapes/iqp-black.json#/trigger` and `content/shapes/maroczy-bind.json#/trigger`
Both are bare `named_structure` features (`iqp-black`, `maroczy-bind`) and both fire **0 of 694**.
For calibration I censused every `named_structure` id used anywhere in `content/`: `carlsbad`
**41/694**, `iqp-white` **4/694**, `iqp-black` **0/694**, `maroczy-bind` **0/694** `[V]` — so the
detector family does match content; these two ids do not.
**What to decide:** both entries are orphans (§3). Either a pack reaches them, or a witness settles
satisfiability, or they stay ledgered as uncovered. **A zero here is not evidence the detector is
wrong** and this document makes no such claim.

### 4. The eight c1 "one square never reached" signatures (§5 table)
`carlsbad/white-kingside-attack` (pawn h5), `closed-centre-chain/white-attack-where-the-chain-points`
(pawn f5/g5/h5), `kid-chain-arrangement/white-blunt-the-f-pawn` (rook f2/e1),
`kid-chain-arrangement/black-lock-with-f4-and-storm` (pawn f4),
`london-wedge/black-fianchetto-the-light-bishop` (bishop b7), `open-centre/white-central-outpost`
(knight d5), `open-centre/black-central-outpost` (knight d4), plus `fianchetto-g7`'s mirrored arm
above.
**What to do:** these are the **cheapest witnesses in the repo** — each is one placement away from a
positive, and a negative control is the same board with the piece elsewhere. Writing eight witnesses
moves eight subjects from bucket (c) to bucket (b) and drops `satisfiabilityUnknown` from 35 to 27
`[M]`. That is the highest ratio of evidence to effort available, and it is the pattern the
`knight-vs-bishop` witness already demonstrates.

### 5. The five c2 "combination never occurs" signatures
`iqp-white/black-convert-the-endgame`, `kid-chain-arrangement/white-strike-the-base-with-c5`,
`kid-chain-arrangement/white-cash-the-break-into-the-c-file`,
`opposite-coloured-bishops/white-two-wings-two-passers`, `rook-4v3-same-side/black-trade-pawns-not-rooks`.
Each has every arm covered and the conjunction uncovered — the clearest possible "author a line that
reaches it" signal. `iqp-white/black-convert-the-endgame` is the sharpest: its `named_structure` arm
fires on **4 of 4** in-shape positions and its two queenless arms fire on **0 of 4** `[V]`; the pack
spines carrying the IQP simply stop before the queens come off.

### 6. Not on this list, deliberately
- The 30 `FIRES_ONLY_OUTSIDE_SHAPE` subjects (§4). Thirty items with a documented
  correct-by-construction explanation (RFC §9) and no per-item evidence of error is a **watch list**,
  not a fix list. Re-run the census after the next content wave and diff.
- The seven orphan entries whose triggers fire zero. That is **D44**, already ledgered; the census
  reproduces it (7 of the 9 orphans fire zero today: `doubled-c-pawns`, `hanging-pawns`, `iqp-black`,
  `knight-vs-bishop`, `maroczy-bind`, `up-an-exchange`, `vancura`; the other two orphans,
  `open-centre` and `queenless-middlegame`, fire 1 and 7 `[V]`).
- Anything about whether a chess claim is correct. Law 8.

---

## §8. The two known cases — both classify correctly

### D43 — `knight-vs-bishop`'s `passed_pawn` fan: reproduced, still a coverage report

`content/shapes/knight-vs-bishop.json#/plans/1/success/signature` (`white-passer-outruns-the-knight`)
is a **12-arm** `any` over `passed_pawn(white, sq)` for `a2–a7` and `h2–h7` `[V]`.

| D43 as ledgered | This run `[V]` |
|---|---|
| 0 of 440 knight-bearing positions | **0** — `all[any-knight-present, fan]` fires 0; knight-bearing denominator is now **456 of 694** |
| 9 of 615 corpus-wide | **9 of 694** — `immediate-guard-browser` 3, `pawn-breakthrough-convert` 4, `stated-reasoning-browser` 2 |
| none containing a knight | **confirmed** — the conjunction with "a knight exists" is empty |

New detail this run adds: **5 of the 9 firings are in browser fixtures.** Under the R3 convention the
fan fires **4 of 671**, all in `pawn-breakthrough-convert` `[V]`. This is the **only** number in the
whole census that materially depends on the D55 convention, so cite it with the convention attached.

**Classification: coverage, correctly.** The census labels it `IN_SHAPE_DENOMINATOR_EMPTY` only —
its entry's trigger fires 0, so it gets no `NEVER_FIRES_IN_SHAPE` and no `FIRES_ONLY_OUTSIDE_SHAPE`;
verdict `satisfiable` with `basis: "corpus"`; no error, exit 0 `[V]`. The instrument reports it as
what it is: an expression that fires where its shape is not, with an undefined in-shape result rather
than a fake `0/0` failure. `all[trigger, fan]` is `unknown`, **not** refuted `[V]`.

### D49 — `opposite-castling-race`: reported as coverage, not as a bug ✓

**Confirmed on all four points `[V]`:**

1. Trigger fires **0 of 668→694** corpus positions; `verdict: "unknown"`; observations are exactly
   `NEVER_FIRES_IN_CORPUS`, `IN_SHAPE_DENOMINATOR_EMPTY`, `SATISFIABILITY_UNKNOWN`. **No error
   label, no refutation, `totals.unsatisfiable = 0`, census exits 0.**
2. `make shape-check FILE=content/shapes/opposite-castling-race.json CORPUS=content/drafts` emits
   `WARNING /trigger [SHAPE_TRIGGER_NEVER_FIRES_IN_CORPUS]` and prints **"Shape check passed"**,
   exit 0 — coverage at warning severity, exactly as §7b specifies.
3. Both referencing packs declare `relation: "prospective"`
   (`content/drafts/anti-sicilian-najdorf-english-attack.json`,
   `content/drafts/najdorf-english-attack-black.json` — `"shapes": [{"shape":
   "opposite-castling-race", "relation": "prospective"}]`) `[V]`, so `SHAPE_REFERENCE_NEVER_PRESENT`
   correctly does not fire (it is guarded on `relation === "present"`,
   `apps/server/src/pack-validation.ts:537`).
4. **D49 was withdrawn and this run supports the withdrawal.** The zero is located precisely: the
   trigger is `all[ any[white king c1, white king b1], any[black king g8, black king h8] ]`. Arm 1
   fires **189 of 694** (g8 169, h8 20). Arm 0 fires **0** — no authored spine position in the corpus
   has a white king on c1 or b1 `[V]`. A prospective reference means precisely *this shape may arise
   later, not on the authored spine*; an opposite-castled white king that never appears on 694
   opening-spine positions is the definition of a coverage fact `[M]`.

**Verdict: the census classifies both known cases correctly.** Neither is reported as a defect,
neither exits non-zero, and both are visible — which is the thing that was true of no instrument in
the repo before today.

---

## §9. Summary for the next wave

- **43 packs / 694 positions / 159 subjects / 0 unsatisfiable.** Nothing in `content/` is provably
  broken.
- **36 zero-firing subjects: 0 dead, 1 witnessed, 35 unknown.** The unknowns are unknown because the
  witness fixture has one key, not because anything is suspect.
- **The cheapest possible next action** is eight witnesses for the eight single-square c1 subjects
  (§7 item 4), which would take `satisfiabilityUnknown` from 35 to 27 and is a mechanical exercise
  `[M]`.
- **The one item that looks like content work rather than evidence work** is
  `rook-4v3-same-side`'s trigger (§7 item 1).
- **Both dossier denominators are stated (694/43 and 671/37) and neither changes any verdict.**
- This report is a diffable baseline: re-run `make expression-census OUT=…` after the next content
  wave and compare `totals` plus the §4 and §5 tables. Determinism was confirmed across two
  independent builds this session `[V]`.
