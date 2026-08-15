# Move primitives — what is computable across a transition, at what cost, and what routing actually detects

**Questions:** **R1**, "Which move primitives are genuinely computable, and at what cost per
position?" and **R2**, "Does routing (distance-to-target-square) actually capture the
reposition case?" (`planning/campaign-research-queue.md:27-28`). Both are session-independent
rows of the campaign research queue, and both block the single design doc the campaign cluster
is owed (`planning/campaign-research-queue.md:53-56`).

**The owner's question behind them** (2026-08-15, ledgered as "Move primitives: what a move
DOES"): *"a move implies some of this… sometimes you take a knight back or to the side just so
that it can rotate into a nice slot 2 turns later… sometimes a move does 1 thing
(attack/defend/overload a piece), sometimes it's in the mission of your wider strategy."*

**Status before this dossier:** the primitive taxonomy existed only as `rfc/predicate-wave-3.md`
§7 F4's eight-row admissibility table — reasoned, unmeasured, and explicitly deferred. The
routing hypothesis (*"repositioning is graph distance, not intent"*) was claude's and untested;
the queue row says so in those words. No cost number for any primitive existed anywhere in the
repo.

**Instrument:** `tools/r1r2-primitives-harness/` — a disposable research harness under
`rfc/0000-rfc-process.md` §Exploration gate, not referenced by `packages/` or `apps/` and not
part of `pnpm test`. Raw output is committed beside it as `r1-output.md` and `r2-output.md`.

---

## 1. Verdict

**R1 — the transition category is real, cheap, and almost entirely an extraction. Nine of the
ten candidate primitives are censuses that cost single-digit microseconds; one ("tempo") is not
mechanical at all; and the single most expensive thing in the whole measurement is code that
already ships and is dead.**

All nine computable primitives, run together in one pass from two raw FEN strings, cost
**29.06 µs per ply** `[V]` (§3). The shipped-and-dead `structuralDelta`
(`packages/runtime/src/structure.ts:425-435`) costs **1721 µs per ply** on the same corpus
`[V]` — **59× the entire transition census**, for a function no production code path calls
(§3b). Cost was never the objection to the transition category and now it is measured as not
being one; the objection that remains is F4's, and it is about consumers, not machinery.

**R2 — the hypothesis fails in the form it was stated. Distance-to-target-square is exact
arithmetic and it is not a reposition detector.** Three measurements, in increasing order of
how badly they hurt:

1. **Given the author's own named arrival squares it is perfect**: **9 of 9** author-declared
   arrival repositions in the 35-pack corpus register a strictly reduced empty-board graph
   distance `[V]`, at **0.20 µs per ply**.
2. **Without an authored target it is noise.** With the target set computed from the shipped
   `pawn_safe_square` arithmetic, the primitive fires on **228 of 593 spine transitions
   (38.4%)**, and on **49.6% of quiet piece moves**. Against the authored label set that is a
   **98.7% false-positive rate**; under the sharpest filter available (quiet, non-developing,
   backward or lateral only) it is **100%** — 48 firings, none of them an authored reposition
   `[V]` (§4d).
3. **Even given the authored target it does not identify the move.** Averaged over the nine
   labeled instances, **52.8% of the moved piece's own legal alternatives also reduce distance
   to the same authored target** `[V]` (§4c). Every one of the nine is the same arithmetic
   event — distance 2 → 1 — which is what roughly half a knight's moves do toward any square.

**The correction the evidence makes:** the census is real, but **the target square set is the
judgment**, and the target set is exactly the part that is not computable. Routing is a
*renderer for an authored target*, not a *detector of intent* `[M]` (§4f). This directly
contradicts `rfc/predicate-wave-3.md:462-475` §4b, which reserves the static distance leaf and
routes the delta to the transition wave on the ground that "the owner's knight-repositioning
case is this metric's clearest use, and its useful form is the *delta* across a move". The
measurement says the opposite: the **static** half is the attested, discriminating half and
the **delta** is the half that fires on everything.

**Promotion trigger — not met** (§6). F4's trigger is "the first authoring wave to file a
transition claim as a format gap, **or** the RFC that ships the discovered-threat surface"
(`rfc/predicate-wave-3.md:815-819`). A research pass is neither. Counted directly: of **78
`signature: null` plans across 25 shape entries** `[V]`, **zero** file a one-move transition
claim; the closest (`fianchetto-g7`, "cannot tell a traded bishop from one that merely moved
away") is a *history* claim evaluated at an arbitrary later position, which F2 refuses for a
different and still-valid reason. What this dossier does change is the *content* the follow-on
should inherit, not its schedule.

---

## 2. Method and corpus

**Corpus.** All 35 committed drill packs in `content/drafts/` (the `.evidence`/`.job`/
`.sources`/`.browser` sidecars excluded). Each pack's spine tree is replayed from its
`start.fen`; every node yields one `(parentFen, moveUci, fen)` triple. **593 transitions**,
all legal under chessops — the harness throws on an illegal spine move and none fired `[V]`
(`tools/r1r2-primitives-harness/corpus.ts`). Distribution: 198 opening, 15 middlegame, 259
endgame, 121 cross-phase plies `[V]`.

**Cost protocol.** Each primitive is run over the whole corpus; the pass is repeated 25 times
after 3 warm-up passes; the reported figure is the **median pass, divided by 593**. Positions
are pre-parsed for the per-primitive rows so each row reads as *marginal* cost over a shared
substrate, and the two substrate costs (FEN parse, attack map) are reported as their own rows.
One bundled row re-measures everything end-to-end from raw FEN strings so the marginal rows
cannot be quietly summed into a wrong total. Machine of record: Apple M3 Max, Node v26.7.0
arm64, chessops 0.15.1. **The ratios are the finding; the absolute microseconds are one
machine** `[V]`.

**Law 8 boundary.** This dossier measures computability. Where it says a move *is* a
reposition, that is a transcription of an author's annotation in `content/drafts/`, quoted
inline, never a verdict of mine.

---

## 3. R1 — the primitive classification, with measured cost

### 3a. The table

Costs are µs/ply, median of 25 passes over 593 transitions
(`tools/r1r2-primitives-harness/r1-output.md`) `[V]`. "Fires" is the share of the 593
transitions on which the primitive reports anything at all.

| # | Primitive (owner's taxonomy) | Class | µs/ply | Fires | Where the work already exists |
|---|---|---|---|---|---|
| — | *substrate:* FEN parse ×2 | — | 5.37 | — | `packages/runtime/src/chess.ts:4` |
| — | *substrate:* attack map ×2 (per-piece attack sets, 64-square control counts) | — | 5.31 | — | new; 20 lines over `attacks()` |
| P1 | **Attacks created / removed** | **computable** | 2.98 | 50.6% | `pivotal.ts:52-54` does exactly this for pawns only; `structure.ts:175` (`directAttackCount`) does it for one square |
| P2 | **Defences created / removed** | **computable** | 4.74 | 74.9% | same substrate; the diff is new |
| P3 | **Lines opened / closed** | **computable** | 4.60 | 52.6% | `structure.ts:401-410` (`line_blockers`) verbatim; only the two-position diff is new |
| P4 | **Control delta** (per-square, both colours) | **computable** | 0.13 | mean 9.7 of 64 squares change per ply | `direct_attack_count` (`structure.ts:412`) is the single-square case |
| P5 | **Escape squares removed** | **computable** | 1.80 | 61.2% | new; board geometry only, no legality search |
| P6 | **Overload as a count** — a piece acquiring a second defensive duty | **computable** | 2.78 | **6.7%** | new; 25 lines |
| P7a | **Tempo — gives check** (proxy) | **computable** | 0.14 | 7.1% | chessops `isCheck()` |
| P7b | **Tempo — opponent reply count** (proxy) | **computable** | 2.08 | — | `pivotal.ts:23-30` (`legalCount`) |
| P7c | **Tempo — "does the move force a reply"** | **not mechanical** | — | — | see §3c |
| P8a | **Irreversibility — zeroing** | **computable, free** | 0.18 | 13.8% | the FEN's own halfmove-clock field |
| P8b | **Irreversibility — castled / last-of-role / pawn break** | **computable** | 0.19 | 13.2% | `pivotal.ts:41-57` verbatim, currently **private** |
| P9 | **Discovered consequence** (`vacationReading`) | **computable** | 5.28 | 48.7% | ships and is exported (`index.ts:55`); **dead** |
| P10 | **Feature delta** (`structuralDelta`) | **expensive** | **1721.48** | 93.3% | ships and is exported (`index.ts:52`); **dead** |
| P11 | **Routing — distance-to-square-set** | **computable** (see R2 for what it detects) | 0.20 | see §5 | new; a 5 × 64 × 64 BFS table built once |
| — | **BUNDLE — P1…P8b + P11, one pass, from two FEN strings** | | **29.06** | | |
| — | bundle on dense positions (≥24 pieces, n=293) | | 33.25 | | |
| — | bundle on sparse positions (≤8 pieces, n=229) | | 7.47 | | |

**Cost scales with piece count, not with search depth** `[V]` — 33.25 µs on middlegame-density
positions against 7.47 µs on ≤8-piece endgames. Nothing in the computable column touches an
engine, a tablebase, a legality search deeper than one ply, or a model.

**What that buys in product terms** `[M]`, arithmetic on the measured figure: a 20-ply branch
costs **0.58 ms** for the entire transition census; an eight-branch comparison at 20 plies each
costs **4.7 ms**. This is below the noise floor of anything the drill client already does.

### 3b. Expensive — one row, and it is already shipped

`structuralDelta` at **1721 µs/ply** is **326× the most expensive primitive** in the census
(P9's 5.28 µs) and 59× all of them together. The breakdown is measurable: its two `structuralReading`
calls cost **987.89 µs** together `[V]`, so the remaining **~734 µs** is the `evictionChanges`
loop at `structure.ts:429-432`, which calls `pawnSafety` **256 times** (64 squares × 2 colours
× 2 positions) and each call **re-parses the FEN** — a single `pawnSafety` call costs
**3.11 µs** `[V]`, and 256 × 3.11 ≈ 796 µs. The loop is density-independent, which is why
`structuralDelta` still costs **651.88 µs** on ≤8-piece endgames `[V]` where the whole
transition census costs 7.47.

Two consequences, stated without recommending an RFC (that is not this tier's job):

- **The dead-code defect (`design/BACKLOG.md:224`) is worse than "unused".** It is unused *and*
  it is the most expensive function measured here, and the cost is an implementation artefact
  (FEN re-parsing inside a 128-iteration loop) rather than anything intrinsic to the
  arithmetic.
- **"Feature delta across a move" belongs in the computable column on its merits.** Nothing
  about gained/lost structural observations is expensive; `structuralReading` is the price, and
  it is paid once per position and could be paid once per *node* rather than twice per
  *transition*.

### 3c. Not mechanical — exactly one row, and F9 already said why

**Tempo, in the sense of "does this move force a reply", is not a board fact.** Two cheap
proxies exist and were measured (check: 0.14 µs, fires on 7.1% of plies; opponent reply count:
2.08 µs), and neither is the thing. "Forcing" means *the opponent has no good alternative*,
which requires either a search (an engine) or an opponent model — and
`rfc/predicate-wave-3.md:799-806` §7 F9 has already ruled on the identical shape for
prophylaxis: *"the missing term is an opponent model, not a board fact"*, routed to
`rfc/resistance-spectrum.md`. The same routing applies here `[M]`. Tempo *accounting* is
separately claimed by `rfc/tempo-vocabulary.md`.

This is the one place where the owner's taxonomy contains a category error, and it is a small
one: "does the move force a reply" reads like a census and is not one.

### 3d. Extraction versus new code — the measured answer

F4 claims the category is "an extraction, not an invention"
(`rfc/predicate-wave-3.md:713-716`). Implementing all eleven primitives took **290 lines**
(`tools/r1r2-primitives-harness/primitives.ts`) `[V]`. Of those:

| Provenance | Primitives | Note |
|---|---|---|
| **Copied verbatim from the tree** (~70 lines) | P3's `lineBlockers` (`structure.ts:401-410`), P8b's `capturedRole`/`irreversibility` (`pivotal.ts:32-57`) | Both are **private**. They had to be copied because they cannot be imported — which is precisely F4's "trapped, not missing" |
| **Imported, already exported, already dead** | P9 `vacationReading`, P10 `structuralDelta` | Zero new lines |
| **Already shipped elsewhere in narrower form** | P1 (pawn-only at `pivotal.ts:52-54`), P4 (single-square `directAttackCount`), P7b (`legalCount`, `pivotal.ts:23-30`) | The generalisation is 10–25 lines each |
| **Genuinely new** (~135 lines) | the attack-map substrate, P2's diff, P5, P6, P11's BFS tables | No primitive exceeded 45 lines |
| **Also already shipped and private** | piece routes (`compare-strips.ts:40-46`) | Not re-implemented; used as-is conceptually for §5 |

So the claim holds `[V]`: the transition category is a lift. The honest qualifier is that the
*lift* is not free — four of the eleven live inside features that would have to be opened up,
and two of those four are the ones already dead.

### 3e. Cheap is not the same as informative

The firing census is the second half of R1's answer and it changes which primitives are worth
a surface `[V]`:

| Primitive | Fires on | Reading |
|---|---|---|
| `structuralDelta` | **93.3%** | Reports something on almost every move. As a hint trigger this is noise by construction |
| P2 defences | 74.9% | Same problem, softer |
| P5 escape squares | 61.2% | Same |
| P3 lines | 52.6% | Same |
| P1 attacks | 50.6% | Mean **0.75** attacks created per ply — half of all plies create or remove at least one attacking relation |
| P8a zeroing | 13.8% | Discriminating |
| P8b irreversibility | 13.2% | Discriminating — and already rendered on screen (`compare-strips.ts:38`) |
| P7a check | 7.1% | Discriminating |
| **P6 overload (second duty acquired)** | **6.7%** | **The most selective primitive measured, and it is one of the two the owner named explicitly** |

This is R3's question arriving early (`planning/campaign-research-queue.md:29`) and this
dossier does not answer it — a low firing rate is necessary for a useful hint, not sufficient.
But the ordering is now a measurement rather than an intuition, and it says the owner's
instinct about **overload** picked the sharpest instrument in the set.

---

## 4. R2 — routing, tested three ways

### 4a. The ground truth: what the authors actually wrote

A vocabulary sweep over all 35 packs
(`regroup|reroute|redeploy|manoeuv|maneuv|retreat|reposition|heads for|goes on to|via|…`)
returns **17 annotated spine nodes** that describe a move as a retreat, regroup or reroute
`[V]`. Transcribed — these are the authors' words, not my classification of chess:

| Author's stated reason | Count | Example |
|---|---|---|
| **Arrival** — names the square(s) the piece is going to | **9** | `anti-kid-classical-white/p17-ne1`: *"The knight clears f3's square for the pawn and heads for d3"* |
| **Attack set** — names the squares it will *cover*, not occupy | 2 | `mate-bishop-knight/p23-nf5`: *"From f5 it covers d6, e7 and g7"* |
| **Vacation** — the point is the square it *leaves* | 2 | `najdorf-english-attack-black/p13-nb3`: *"The main retreat, keeping f3 free for the pawn"* |
| **Safety** — the point is not being where it was | 2 | `caro-kann-advance-black/bg6-retreat`: *"Step back and let the pawns overextend"* |
| **Unspecified** — a reroute announced for a *later* move | 2 | `kid-classical-black/p14-nc6`: *"When it comes, the knight re-routes to e7"* |

**First finding, before any arithmetic:** routing explains **9 of 17** author-labeled
retreats/reroutes. The other eight are already covered by *different* primitives from §3 —
attack-set (P1), vacation (P9 `vacationReading`), and safety (P5) — or by nothing at all. A
"reposition primitive" that only implemented distance would silently mis-explain half the
cases the authors themselves flagged `[V]`.

### 4b. Given an authored target set: exact, and uninformative in a specific way

For each of the nine arrival cases, empty-board graph distance from the move's origin and
destination to the author's own named squares (BFS knight table, Chebyshev king, move-count
sliders — the metric `rfc/predicate-wave-3.md:466-472` specifies):

| Pack | Node | Move | Author's named target | Distance | Direction |
|---|---|---|---|---|---|
| anti-french-advance-white | nbd2-reroute | Nbd2 | {f1,g3} | 2 → 1 | advancing |
| anti-kid-classical-white | p17-ne1 | Ne1 | {d3} | 2 → 1 | **backward** |
| anti-kid-classical-white | p16-ne7 | Ne7 | {g6,f5} | 2 → 1 | **backward** |
| kid-classical-black | p16-ne7 | Ne7 | {g6} | 2 → 1 | **backward** |
| carlsbad-minority-attack | nf8-regroup | Nf8 | {e6,g6} | 2 → 1 | **backward** |
| carlsbad-minority-attack | ng3-kingside | Ng3 | {f5} | 2 → 1 | advancing |
| french-advance-black | nh6-knight | Nh6 | {f5} | 2 → 1 | advancing |
| italian-center-attack-white | p15-nbxd2 | Nbxd2 | {b3,f1} | 2 → 1 | advancing |
| mate-two-bishops | w-bb1 | Bb1 | {a2} | 2 → 1 | **backward** |

**9/9 fire** `[V]`. The two `attack_set` cases correctly do *not* fire (`p23-nf5`: 0 → 1,
moving *away* from the squares it will cover) — which is the arithmetic being right about a
case it does not cover, not a failure.

The column that matters is the third-from-last: **every single instance is 2 → 1**. The owner's
"nice slot 2 turns later" is literally a distance of two, and the move that starts the journey
reduces it to one `[V]`. That is a real regularity — and it is also why the primitive carries
almost no information, because *most* moves of a piece reduce its distance to *some* square by
one. §4c measures exactly how little.

### 4c. Discriminating power: it does not pick out the move

For each labeled instance, holding the author's target set fixed, how many of the *legal
alternatives in the same position* also reduce distance to that same target?

| Pack | Node | Move played | Target | Same piece's own moves that also close | All legal moves that close |
|---|---|---|---|---|---|
| anti-french-advance-white | nbd2-reroute | Nbd2 | {f1,g3} | 1/1 | 3/30 |
| anti-kid-classical-white | p17-ne1 | Ne1 | {d3} | 2/6 | 5/34 |
| anti-kid-classical-white | p16-ne7 | Ne7 | {g6,f5} | 2/5 | 11/31 |
| kid-classical-black | p16-ne7 | Ne7 | {g6} | 1/5 | 7/31 |
| carlsbad-minority-attack | nf8-regroup | Nf8 | {e6,g6} | 3/5 | 7/28 |
| carlsbad-minority-attack | ng3-kingside | Ng3 | {f5} | 1/3 | 6/46 |
| french-advance-black | nh6-knight | Nh6 | {f5} | 2/3 | 8/35 |
| italian-center-attack-white | p15-nbxd2 | Nbxd2 | {b3,f1} | 1/1 | 3/6 |
| mate-two-bishops | w-bb1 | Bb1 | {a2} | 2/9 | 4/25 |

**Mean: 52.8% of the moved piece's own legal moves also close the distance to the author's own
target; 23.3% of all legal moves in the position do** `[V]`.

So even in the maximally generous setting — the author has told the primitive where the piece
is going — the primitive cannot say *this* move was the reposition. It says "one of about half
of this knight's moves went toward d3". `carlsbad/nf8-regroup` is the clearest case: three of
the knight's five legal moves close toward {e6,g6}, and only one of them is the tabiya move the
pack is built around.

### 4d. Without an authored target: 98.7% false positives

The autonomous version replaces the author with a census. Target set = squares no enemy pawn
can ever attack (the shipped `pawn_safe_square` arithmetic, `structure.ts:140`, verified
equal to the shipped function on a strided sample inside the harness `[V]`), restricted to
the enemy half, minus squares the mover's own pieces occupy — i.e. "the nice slots".

| Population | Fires | Rate |
|---|---|---|
| All spine transitions | 228 / 593 | **38.4%** |
| Quiet piece moves (non-pawn, non-capture, non-check) | 185 / 373 | **49.6%** |
| Quiet, non-developing, **backward or lateral only** (the owner's literal case) | 48 / 165 | **29.1%** |
| Naive centre target set, all transitions | 122 / 593 | 20.6% |

Against the authored label set: **3 of the 228 firings are author-declared repositions** —
**precision 1.3%, false-positive rate 98.7%** `[V]`. Under the sharpest filter (quiet,
non-developing, backward/lateral) precision is **0.0%** across 48 firings.

By role, the firings are dominated by pieces nobody would describe as repositioning `[V]`:
knight 72.2% (70/97), bishop 60.0%, rook 55.9%, **king 39.4% (71/180)**, queen 18.8%, pawn 0%.
The sample of "quiet, non-developing, backward/lateral" firings is a list of endgame king
walks — `lucena-bridge-convert/w-kc7`, `mate-k-r-technique/w-ke6`,
`pawn-opposition-convert/w-ke5`, `queen-vs-pawn-seventh-convert/b-kd1` — every one of which is
a king approaching the enemy half, which the primitive is structurally unable to tell apart
from a knight beginning a manoeuvre `[V]`.

**Caveat, stated rather than buried:** absence of an author label is not proof a move is not a
reposition, so "98.7%" is an upper bound on precision loss and the true rate is unknown but
bounded below by the base rates. The argument does not depend on the exact figure. A primitive
that fires on **half of all quiet piece moves** is not a primitive, whatever the label coverage
`[M]`.

### 4e. What the authors did instead — and it already ships

Routing vocabulary is all over the shape library's plan *descriptions* — `carlsbad`
`white-kingside-attack` (*"Reroute a knight toward the kingside"*), `closed-centre-chain`
`white-attack-where-the-chain-points` (*"reroute pieces behind the chain head"*),
`kid-chain-arrangement` (*"the king's knight rerouted to d3 or d2"*, *"the knights reroute to
e7 and d7 or e8"*) `[V]`. Wherever an author had to make one of those *checkable*, they wrote
an **arrival predicate**, not a delta: `kid-chain-arrangement`'s
`black-strike-the-base-with-f5` signature is a conjunction of `pieceOnSquare` leaves `[V]`, and
`pieceOnSquare` appears in 7 of the 35 packs `[V]`.

A direct grep of the shape library for `distance|route` returns **six** notes naming distance
or routing as a gap the vocabulary cannot read, and **every one names the static quantity**
`[V]`: four for kings (`bishop-good-bad` and `opposite-coloured-bishops`, *"king routes are
outside this vocabulary"*; `queen-vs-pawn-on-seventh`, *"King distance is geometry outside this
vocabulary"*; `lucena`, *"King-to-rook distance is geometry outside this vocabulary"*) and two
for other roles (`up-an-exchange`/`white-stretch-two-wings`, *"Wing counts and switching
distance are outside this vocabulary"*; `knight-vs-bishop`/`white-passer-outruns-the-knight`,
*"the knight's actual travel distance is geometry the signature cannot count"*). The last is
one more non-king attestation than `rfc/predicate-wave-3.md:462-465` counted ("for other roles
once"), and its author worked around the gap with a static `passed_pawn` disjunction rather
than anything transitional `[V]`.

### 4f. R2 verdict

**No — routing does not capture the reposition case, and the failure is informative.**

- The arithmetic is exact, free (0.20 µs/ply), and reproduces the author's own claim **9/9**
  when the author supplies the target.
- The target set is not computable. Every autonomous target set tried produced a false-positive
  rate of **98.7%** or worse.
- Even with the target supplied, the delta does not identify the move: **52.8%** of the piece's
  own alternatives satisfy it.
- Routing explains only **9 of 17** author-labeled repositions; vacation, attack-set and safety
  primitives cover the rest.

**What survives:** *piece distance to a square set* as a **static leaf** — the `king_distance`
generalisation `rfc/predicate-wave-3.md:462-475` §4b explicitly opened and did not take. That
half is attested by authors (four king-distance/route notes plus two non-king ones, §4e) `[V]`, is a position
census (no predecessor needed), and is what the authors reach for when they have to be
checkable. **What does not survive** is the delta-as-detector: it belongs, if anywhere, as a
*rendering* of an author-declared destination ("this move brings the knight one move closer to
the d3 the pack named"), never as the thing that discovers the destination `[M]`.

This is a plain refutation of a claim that was claude's, and it is recorded as such per the
queue row's own framing.

---

## 5. The F4 promotion trigger — not met

`rfc/predicate-wave-3.md:815-819` states it exactly: *"the first authoring wave to file a
transition claim as a format gap, **or** the RFC that ships the discovered-threat surface,
whichever comes first."*

**Neither has happened, and this dossier is not a substitute for either** `[V]`:

| Trigger condition | State |
|---|---|
| An authoring wave files a transition claim as a format gap | **Not met.** 78 `signature: null` plans across 25 shape entries were re-counted this pass; none is a one-move transition claim. The nearest, `fianchetto-g7`/*"Detection cannot tell a traded bishop from one that merely moved away"*, is evaluated at an arbitrary later position and is therefore the **history** case F2 refuses (`rfc/predicate-wave-3.md:673-687`) — the RFC's own classification is correct and this pass confirms it |
| An RFC ships the discovered-threat surface | **Not met.** No RFC in `rfc/` claims it; `vacationReading` remains exported and dead |
| (This dossier) | A research pass. Not an authoring wave, ships no surface |

**What the evidence does change, for whoever inherits F4:**

1. **Cost is settled and is not an argument in either direction.** 29.06 µs/ply for the whole
   census. F4 said "agreed cheap" without a number; the number is now smaller than the
   sentence implied.
2. **F4's routing row needs amending before it is inherited.** Its table marks repositioning
   *"Admissible, and the owner is right that it is not judgment"*
   (`rfc/predicate-wave-3.md:738`), and §4b routes the delta to the transition wave as "this
   metric's clearest use". §4 above measures both claims false in the delta form: the target
   set is the judgment. The static leaf should be promoted on its own attestations; the delta
   should be demoted to a renderer of an authored target.
3. **The ordering of the remaining primitives is now measured, not assumed.** By selectivity:
   overload (6.7%) > check (7.1%) > irreversibility (13.2%) ≫ attacks (50.6%), lines (52.6%),
   escape squares (61.2%), defences (74.9%), feature delta (93.3%). The three cheapest to
   *lift* are also among the three most selective.
4. **`structuralDelta`'s cost is a defect, separate from its deadness.** 1721 µs/ply, 651 µs
   even on ≤8-piece endgames, ~43% of it in `evictionChanges`, whose 256 `pawnSafety` calls
   each re-parse the FEN.
   Anything that promotes the transition category will inherit this function; it should not
   inherit it in this state.

The standing reason for the deferral is untouched: F4 refused on **consumers**, not machinery,
and this dossier supplies no consumer.

---

## 6. Limits of this pass

- **One machine, one runtime.** Absolute microseconds are Apple M3 Max / Node 26.7.0 / chessops
  0.15.1. Ratios are the durable claim.
- **The reposition label set is a grep.** 17 instances from a vocabulary sweep of 35 packs. An
  author who described a reposition in words the sweep missed is invisible to it, and the
  corpus contains only **9** arrival-labeled repositions in total — a small denominator for the
  recall figure (§4b), though not for the firing-rate figure (§4d), which is measured over all
  593 transitions.
- **"False-positive rate" is measured against author labels, not against ground truth.** §4d
  states the caveat; the base rates carry the argument regardless.
- **Firing rate is not usefulness.** R3 (`planning/campaign-research-queue.md:29`) asks whether
  a census-only hint is *worth reading*; nothing here answers that. A 6.7% firing rate makes
  overload a candidate, not a good hint.
- **Two primitives were measured as shipped, not as they could be.** `structuralDelta` and
  `vacationReading` were timed as exported. A rewritten `structuralDelta` that parses each FEN
  once would land near `structuralReading`'s 494 µs per position, and that number is an
  inference from the measured decomposition, not a measurement `[M]`.
- **Tempo was not measured in its real form**, because its real form needs an opponent model
  (§3c). That routing to `rfc/resistance-spectrum.md` is inherited from F9, not established
  here.

---

## Appendix — raw output and reproduction

```
npx vitest run --config tools/r1r2-primitives-harness/vitest.config.ts
```

Writes `tools/r1r2-primitives-harness/r1-output.md` (cost table, firing census) and
`r2-output.md` (recall table, autonomous firing rates, discriminating-power table, per-role and
per-phase breakdowns, and the 40-row sample of quiet backward/lateral firings). Both are
committed alongside the harness. The harness README records its own known limits.
