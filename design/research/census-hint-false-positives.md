# The false-positive rate of a census-only hint — what "useless" means, and how often it happens

**Question:** **R3**, *"What is the false-positive rate of a hint built only from transition
census? … count how many are true-but-useless ('this move attacks a defended pawn')"*
(`planning/campaign-research-queue.md:29`). Session-independent row of the campaign research
queue, and the row `rfc/transition-primitives.md` §5.4 makes its **live Just Play tier**
conditional on.

**Why it is not obvious.** A census hint is **true by construction** — it is set arithmetic
over two positions that both exist. The risk is not that it lies; the risk is that it is
useless, and a useless-but-true hint is still a bad hint. R2 already proved that failure mode
empirically for a neighbouring primitive: routing had perfect recall against author-declared
targets and a **98.7% false-positive rate** with a computed target set, which made it *"a
renderer, not a detector"* (`design/research/move-primitive-computability.md` §4d, §4f). R3
asks the same question of the hint surface itself.

**Instrument:** `tools/r3-census-hint-harness/` — a disposable research harness under
`rfc/0000-rfc-process.md` §Exploration gate, not referenced by `packages/` or `apps/` and not
part of `pnpm test`. It reuses the R1/R2 harness's corpus walk and substrate verbatim. Raw
output is committed beside it as `r3-output.md`.

**Machine of record:** Apple M3 Max, Node v26.7.0 arm64, chessops 0.15.1 `[V]`.

---

## 1. Verdict

**The false-positive rate of a census-only hint is high everywhere and catastrophic for four of
the six leaves. Measured over 634 spine transitions from the 37 committed packs, the complete
on-request census reading produces 6.18 observations per ply, of which 0.68 clear the necessary
conditions for being worth reading — an 89.0% false-positive rate at the observation level**
`[V]` (§5). Per leaf, the share of *firings* that fail at least one necessary condition:
`defended_squares_changed` **95.8%**, `attacked_squares_changed` **94.1%**,
`move_irreversibility` **89.1%**, `escape_squares_changed` **86.1%**,
`defended_duties_changed` **53.2%**, `slider_lines_changed` **41.7%**.

**The RFC's selectivity proxy does not survive testing.** `rfc/transition-primitives.md` §5.4
draws the live/on-request line at the measured firing-rate gap between 13.2% and 50.6% and
argues the partition is *"robust to the threshold"*. Over the six leaves, Spearman
ρ(firing rate, false-positive rate) = **−0.143** `[V]` — firing rate carries no information
about usefulness, and if anything points the wrong way. The single **least** false-positive
leaf, `slider_lines_changed` at 41.7%, has the second-**highest** firing rate (54.1%). Rarity
and informativeness are orthogonal axes, and `defended_duties_changed` is not informative
*because* it is rare — it is rare **and** 53.2% of its firings still fail (§6).

**The RFC's specific bet — exactly one live primitive, `defended_duty_acquired` — is not
supported, and it fails against the RFC's own stated bar rather than against one I invented**
`[V]` (§7). §5.4 requires *"that a reader judges a clear majority informative … at a rate
materially better than a random quiet move."* Both halves fail, and the first fails as a
matter of arithmetic rather than of taste:

- Of the **44** `defended_duties_changed(acquired)` witnesses over 42 firing transitions, **13
  (29.5%)** clear the mechanical necessary conditions. Because those conditions are
  *necessary*, 29.5% is an **upper bound** on what any reader could judge informative. A clear
  majority is therefore not reachable, and no reader study is needed to say so.
- Over the 14,980 quiet legal alternatives enumerated from the same 634 parent positions, the
  same leaf signals on **3.4%**; over the played spine moves it signals on **2.1%**. The
  marker is **0.61×** a random quiet move, not materially better than one.

**The fallback the RFC pre-authorised should be taken, but the better disposition is one step
short of it.** Removing `"defended_duty_acquired"` from `PivotalKind` is correct for the leaf
*as specified*. A strictly narrower variant — the same threshold crossing, conjoined with the
two structural conditions this dossier measures — has a 2.1% firing rate, a 0% false-positive
rate by construction, and a live volume of roughly one marker per 25 moves of ordinary play.
Whether that conjunction is admissible under the RFC's own rule 2 (*no threshold the detector
chooses*) and rule 5 (*a leaf's quantity is a property of the pairing*) is an RFC question,
not a research one; the measurement is offered so the RFC can answer it (§7c).

**By-product, as commissioned: the corrected firing rates are lower than the published upper
bounds for the leaves the correction touches, and the RFC's "37-point empty band" does not
survive the correction** `[V]` (§4). Like-for-like on this corpus, target-keying plus the
both-occupied conjunct moves attacks **51.3% → 37.5%** and defences **76.5% → 34.1%**; lines
move **55.0% → 54.1%**; duties and irreversibility are unchanged in the directions the R1 pass
measured. But the RFC's §2.3 table reads six single numbers off leaves that are parameterised
by **colour and direction**, and the union over those parameters is much higher than the
published figure for two of them: `escape_squares_changed` is **94.0%**, not 61.2%, and
`move_irreversibility` is **24.6%**, not 13.2%. Resolved by direction, the corrected ordering
is 6.2 / 6.6 / 12.1 / 17.0 / 20.7 / 24.6 / 30.1 / 31.5 / 46.5 / 80.8 / 81.1 — and **the band of
thresholds that reproduces the RFC's intended live set is 5.5 points wide, not 37**. The
partition still selects the same set; the claim that the choice is forced rather than tuned no
longer holds.

---

## 2. Method and corpus

**Corpus.** All **37** committed drill packs in `content/drafts/` (the `.evidence`/`.job`/
`.sources`/`.browser` sidecars excluded), replayed from each pack's `start.fen` through its
spine tree. **634 transitions** `[V]`, every one legal under chessops — the shared corpus
walker throws on an illegal spine move and none fired
(`tools/r1r2-primitives-harness/corpus.ts`). Phase distribution: **236** opening, **18**
middlegame, **259** endgame, **121** cross-phase `[V]`.

This is the same instrument R1/R2 used, on a corpus that has grown by two packs and 41
transitions since that pass (35 packs / 593 transitions → 37 / 634) `[V]`. §4 re-runs R1's own
keying on the new corpus so that no correction in this dossier can be confused with corpus
drift.

**Leaf semantics.** The six leaves are implemented to `rfc/transition-primitives.md` §2.3 —
**target-keyed, colour-keyed, with the both-occupied conjunct** — which is the semantics §2.4
specifies and which the R1 harness did not have. §4 quantifies the difference.

**The alternative-move population.** For each of the 634 parent positions the harness
enumerates every legal move (**15,989** total, **14,980** of them quiet — non-capture,
non-checking) and evaluates every leaf on it `[V]`. This population serves three jobs: the
discrimination axis (§3b, axis D), the control the RFC's bar names (*"a random quiet move"*),
and a rough stand-in for *moves a learner might actually play*, since the spine is a curated
corpus of moves an author endorsed. Pawn moves reaching the last rank are promoted to a queen;
that is a simplification, stated here and in the harness README.

**Law 8 boundary, and it is unusually live here.** This dossier judges whether a hint is
*useful*, which is adjacent to a chess judgment. Everything reported as a number is a
mechanical predicate over attack maps and occupancy, defined in §3 and implemented in
`tools/r3-census-hint-harness/leaves.ts`. Where a sentence says a hint *is* worth reading, it
is either (a) a mechanical predicate firing, labelled as such, or (b) explicitly flagged as a
judgment `[M]`. No move is graded, no position is evaluated, and no engine, tablebase, corpus
or model was consulted anywhere in this pass.

---

## 3. What "useless" means — the definition, and why this one

This is the dossier's load-bearing section. A bad definition makes every number downstream
meaningless, so the definition is stated, justified against repo sources, and shown working on
real transitions before any rate is quoted.

### 3a. Why the obvious definitions are not enough

Three candidate axes were named in the framing of R3. Taken alone, each fails:

- **"It fires on nearly every move, so it carries no information."** This is base rate, and it
  is the axis `rfc/transition-primitives.md` §5.4 already uses. It is necessary but visibly not
  sufficient: `defended_duties_changed` fires on 6.6% of transitions, and §7 shows most of
  those firings are still not worth reading. A rare hint can be rare *and* vacuous.
- **"It restates something a rules-sighted player already sees."** True, but "already sees" is
  the part that needs grounding, and the naive reading — *anything derivable from the rules* —
  would condemn the whole of rung 0, which by construction is nothing but rules arithmetic
  (`design/05-in-run-experience.md` §3, rung 0).
- **"It names a change with no bearing on the position's problem."** The right instinct, and
  the queue row itself supplies the exemplar: *"this move attacks a defended pawn"*
  (`planning/campaign-research-queue.md:29`). But "the position's problem" is a chess
  judgment and law 8 forbids manufacturing one.

There is also a fourth axis the framing does not name, and R2 proved it is the sharpest of all:
**a hint that also describes most of the moves you did not play is describing the position, not
the move.** That is exactly what killed routing — 52.8% of the moved piece's own legal
alternatives satisfied the same predicate even with the target supplied
(`design/research/move-primitive-computability.md` §4c). Any definition of usefulness that
cannot catch that failure has not learned R2's lesson.

### 3b. The definition — three mechanical necessary conditions

> A census firing is **useful only if** it is **(T)** not a restatement of the move, **(C)** about
> something contested under the rules alone, and **(D)** not equally true of the moves that were
> not played. A firing failing any one of the three is a **false positive**: true, and not worth
> reading.

**Axis T — the observation is a side effect, not the foreground of the move.**

*Operational:* the observation fails T when it is fully explained by what the moved piece does
from the square it landed on. It passes when its cause is a departure, a discovery, a block, a
capture, or a third piece.

*Grounding, and it is the repo's own:* `rfc/transition-primitives.md`'s design refs cite
`design/05-in-run-experience.md` §5 as *"detection is cheap, significance is not — **what is
the moved piece no longer doing**"*, and `05` §3 lists **discovered consequence** among the
rung-0 sights that are *"underused"*. Both of those are, precisely, side effects. Neither
design source anywhere proposes surfacing *what the piece you just moved now does from where
you just put it* — because the learner chose the square and was looking at it. So T is not my
taxonomy: it is the boundary the design tier already drew between the transition facts it
names as valuable and the one it never mentions.

*Two variants are reported, because the boundary is fuzzy in exactly one place.* **T1**
(primary) counts departure effects as side effects: *"the knight that left f3 was defending
e5"* passes. **T0** (a lower bound) additionally requires a piece that did **not** move to have
changed what it does — pure discovered effects only. The two differ only for the attack and
defence leaves, and both are in every table so the reader can see the bracket. Where they
differ, §5 quotes both.

**Axis C — the observation names something contested.**

*Operational, per leaf, all of it attack-map arithmetic:*

| Leaf | C fires when |
|---|---|
| `attacked_squares_changed` | the target piece has **no defender of its own colour** in the position where the attack exists |
| `defended_squares_changed` | the piece whose defended-status changed **is attacked by the enemy** in the resulting position |
| `slider_lines_changed` | the ray **crossed the zero-blocker line** (opened to fully clear, or closed from fully clear) |
| `escape_squares_changed` | the piece whose destination set changed **is attacked by the enemy** in the resulting position |
| `defended_duties_changed` | the defender is the **sole defender** of at least one of its wards |
| `move_irreversibility` | always (it is a moment marker, not a claim about a piece — T does all the work) |

*Grounding:* the first row is the queue's own useless exemplar inverted — R3 asks how many
hints are *"this move attacks a defended pawn"*, so C is definitionally *"and the pawn is not
defended"* (`planning/campaign-research-queue.md:29`). The fourth row is
`design/05-in-run-experience.md` §3b, which names *"that knight has no retreat square"* as the
canonical permitted rung-0 fact — retreat presupposes a threat. The fifth row is the leaf's own
logic taken seriously: a duty that three other pieces also cover is not a duty. The second and
third rows are the same status-change principle: a defence added to a piece nobody attacks, or
a ray going from three blockers to two, states a quantity nobody can act on.

**C is deliberately not a value comparison.** It never asks whether the attacked piece is worth
more than the attacker, and never compares attacker and defender counts, because
`design/05-in-run-experience.md` §3's own 2026-08-14 scope correction says attacker/defender
*counts* are exact but *"pressure balance" as a conclusion depends on pins and legal
recaptures*. C therefore only ever reads a 0-versus-nonzero status, which is the part rung 0 is
allowed to assert.

**Axis D — the observation distinguishes the move that was played.**

*Operational:* for every transition where a leaf signalled, every legal move from the same
parent position is evaluated with the same leaf, and the share that also signal is recorded.
High share = the hint is a property of the position, and would have been shown whatever the
learner did. This is R2's method transplanted (`move-primitive-computability.md` §4c), and §6
shows it is the axis that catches the one leaf T and C let through.

D is reported as a rate rather than folded into the pass/fail composite, because a single
firing cannot pass or fail it — it is a property of the primitive in a position, not of the
witness.

### 3c. What this definition explicitly does not claim

**The conditions are necessary, not sufficient.** Passing T, C and D does not make a hint
useful; it makes it *not disqualified*. Whether a 1500-rated player finds *"the white knight on
d2 is now the sole defender of two attacked pieces"* worth reading is a question about a person
and this pass did not ask one. **Therefore every "signal rate" in this dossier is an upper
bound on usefulness and every "false-positive rate" is a lower bound** `[V]` — which is the
useful direction for a go/no-go, because a lower bound that already exceeds a threshold settles
the question without a reader study (§7a).

**The corpus is authored spine moves.** These are moves an author endorsed and wrote a claim
about. They are not a sample of learner play, and §5's rates should be read as *"over the moves
the packs teach"*. The 15,989-alternative population is the closest available proxy for the
other case and every table carries it.

**Where I am reporting a judgment rather than a measurement, it says so.** Two places: the
choice of the C predicates themselves (defensible, grounded, and still a choice `[M]`), and the
reading of the `slider_lines_changed` result in §6, where I argue that a weak C predicate
inflates that leaf's apparent quality `[M]`.

### 3d. The definition working — real transitions, both verdicts

All FENs are the parent position; the move is from the pack's spine
(`tools/r3-census-hint-harness/r3-output.md` §7) `[V]`.

**Called useful:**

| Firing | Why it passes |
|---|---|
| `anti-italian-center-attack-black` ply 11, `...d5`, `r1bqk2r/pppp1ppp/2n2n2/8/2BPP3/5N2/PP1N1PPP/R2QK2R b KQkq - 0 8` — *"the white knight on d2 now defends 2 attacked white pieces"* | T: the new ward is not the square Black just moved to. C: the knight is the sole defender. The author's own annotation independently says the move *"attacks the c4 bishop, so White has no time to push past or build"* |
| `conversion-up-a-piece` ply 1, `Rxd8+`, `3rk3/pp3ppp/4p3/8/8/2N1P3/PP3PPP/3RK3 w - - 0 1` — *"irreversible (last_of_role)"* | T: the fact is about the board's remaining material, not about the move — the last rook has left. The author writes *"when both are gone, your knight is the only …"* |
| `anti-caro-advance-early-c5` ply 6, `...e6`, `r2qkbnr/pp2pppp/2n5/2PpP3/6b1/2P2N2/PP3PPP/RNBQKB1R b KQkq - 0 6` — *"black now attacks the white pawn on c5"* | T: the attacker is not the pawn that moved (the e-pawn unblocked the f8 bishop's diagonal). C: c5 has no white defender |

**Called useless:**

| Firing | Why it fails |
|---|---|
| `anti-caro-advance-early-c5` ply 4, `...Bg4`, `r1bqkbnr/pp2pppp/2n5/2PpP3/8/5N2/PPP2PPP/RNBQKB1R b KQkq - 2 5` — *"black now attacks the white knight on f3"* | **T+C.** The learner moved the bishop to g4; that it attacks f3 is the move. And f3 is defended. This is the queue's exemplar almost verbatim |
| `anti-caro-advance-early-c5` ply 3, `Nf3`, `r1bqkbnr/pp2pppp/2n5/2PpP3/8/8/PPP2PPP/RNBQKBNR w KQkq - 1 5` — *"the white rook on a1 opened its line toward h1 (6→5 blockers)"* | **C.** Six blockers became five on the first rank. Nothing on the board changed that anyone can act on |
| `anti-kid-classical-white` ply 7, `d5`, `r1bq1rk1/ppp2pbp/2np1np1/4p3/2PPP3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 2 8` — *"the white knight on c3 now defends 2 attacked white pieces"* | **T.** The second ward is the pawn White just pushed to d5. The learner put it there |
| `anti-caro-advance-early-c5` ply 1, `dxc5` — *"irreversible (pawn_break)"* | **T.** The learner played the pawn capture. The marker restates the move |

---

## 4. By-product — the corrected firing rates, and what the correction costs the RFC

`rfc/transition-primitives.md` §2.4 flags that the R1 harness keys attack and defence by
`(attackerSquare, targetSquare)`, so *"a rook moving d1→e1 while still defending c1 reports one
removed relation and one created one"*, and states that the published rates are therefore
**strict upper bounds** whose corrected values *"are unmeasured"*. Measured here.

**Step 1 — the same keying R1 used, re-run on the 37-pack corpus,** so nothing below is corpus
drift `[V]`:

| R1 primitive | R1 published (35 packs, 593 tr) | this corpus, R1's keying |
|---|---|---|
| P1 attacks created/removed | 50.6% | **51.3%** |
| P2 defences created/removed | 74.9% | **76.5%** |
| P3 lines opened/closed | 52.6% | **55.0%** |
| P5 escape squares removed (non-mover colour, `lost` only) | 61.2% | **60.6%** |
| P6 duty acquired | 6.7% | **6.9%** |
| P8b irreversibility (classification) | 13.2% | **13.4%** |
| P8a clock zeroed | 13.8% | **14.0%** |

**Step 2 — the corrected leaves** `[V]`:

| Leaf (RFC §2.3) | corrected, union over colour and direction | corrected, per direction | RFC §2.3's published "upper bound" |
|---|---|---|---|
| `attacked_squares_changed` | **37.5%** | gained 31.5%, lost 12.1% | 50.6% |
| `defended_squares_changed` | **34.1%** | gained 17.0%, lost 20.7% | 74.9% |
| `slider_lines_changed` | **54.1%** | opened 46.5%, closed 30.1% | 52.6% |
| `escape_squares_changed` | **94.0%** | lost 80.8%, gained 81.1% | 61.2% |
| `defended_duties_changed` | **12.1%** | acquired 6.6%, released 6.2% | 6.7% |
| `move_irreversibility` | **24.6%** | (incl. `clock_zeroed`) | 13.2% |

**Three findings, in order of consequence.**

1. **The upper-bound claim holds, and the correction is large where the RFC said it would be.**
   Attacks fall **51.3% → 37.5%** and defences **76.5% → 34.1%** on identical inputs `[V]`. The
   defence figure is the load-bearing one: target-keying alone removes 42 points, which is
   exactly the artefact §2.4 describes — a piece that moves and still covers the square is no
   longer scored as having stopped covering it. `slider_lines_changed` falls 55.0% → 54.1%
   (the ray-survival requirement barely bites), and duties/irreversibility are unchanged in the
   directions R1 measured (**6.6%** vs 6.9%, and the classification half is untouched).

2. **Two of the six published figures are not the leaf's rate.** The leaves are parameterised
   by colour *and* direction, and §2.3's table quotes one number each. For four leaves that
   number is close to the union. For `escape_squares_changed` it is not — R1's P5 measured only
   `lost`, only for the colour opposite the mover, which reproduces exactly (**60.6%**
   corrected, matching the uncorrected figure to the decimal), while the union over both
   colours and both directions is **94.0%** `[V]`. `move_irreversibility` similarly reads 13.2%
   for the classification alone and **24.6%** once `clock_zeroed` — a subkind §2.3 lists — is
   included. Neither is an error in R1; both are a mismatch between what was measured and what
   the RFC's table implies.

3. **`DESIGN-GAP:`-adjacent, for the RFC rather than for design: the "37-point empty band" does
   not survive.** §5.4 justifies the live/on-request partition on a bimodal gap —
   *"6.7 < 7.1 < 13.2 ≪ 50.6 < 52.6 < 61.2 < 74.9, and there is a **37-point empty band**…
   Any threshold in (13.2, 50.6) picks the same set, so the partition is robust to the
   threshold."* Resolved by direction on corrected arithmetic, the eleven rates are **6.2, 6.6,
   12.1, 17.0, 20.7, 24.6, 30.1, 31.5, 46.5, 80.8, 81.1** `[V]`, and the successive gaps below
   46.5% are **0.4, 5.5, 4.9, 3.7, 3.9, 5.5, 1.4, 15.0**. The distribution is not bimodal. The
   only threshold band that reproduces the RFC's intended live set `{defended_duties_changed}`
   is **(6.6, 12.1) — 5.5 points wide**; the band that also admits the already-live
   `move_irreversibility` is **(24.6, 30.1) — also 5.5 points**. The one large gap that does
   exist below 46.5% is the 15-point band (31.5, 46.5), and a threshold *there* would put eight
   of the eleven leaf-directions on the live surface, which is the opposite of what §5.4 wants.
   So the *membership* the RFC wants is reachable, but the claim that it is forced by an empty
   band is no longer true. §6 argues the band was never the right instrument anyway.

---

## 5. The decisive number — per-primitive signal rate

Share of the 634 transitions on which each leaf fires, and on which it produces at least one
witness clearing T and C `[V]` (`r3-output.md` §3). "FP rate" is the share of *firings* that
produce no such witness.

| Leaf:direction | fires | ≥1 T1 | ≥1 T0 | ≥1 C | **SIGNAL (T1∧C)** | SIGNAL (T0∧C) | **FP rate (T1)** | FP rate (T0) |
|---|---|---|---|---|---|---|---|---|
| `attacked_squares_changed:gained` | 31.5% | 3.8% | 3.8% | 13.6% | **0.9%** | 0.9% | **97.0%** | 97.0% |
| `attacked_squares_changed:lost` | 12.1% | 12.1% | 3.0% | 1.3% | **1.3%** | 0.2% | **89.6%** | 98.7% |
| `defended_squares_changed:gained` | 17.0% | 2.5% | 2.5% | 3.3% | **0.3%** | 0.3% | **98.1%** | 98.1% |
| `defended_squares_changed:lost` | 20.7% | 20.7% | 0.3% | 1.1% | **1.1%** | 0.0% | **94.7%** | 100.0% |
| `slider_lines_changed:opened` | 46.5% | 46.5% | 46.5% | 21.3% | **21.3%** | 21.3% | **54.2%** | 54.2% |
| `slider_lines_changed:closed` | 30.1% | 30.1% | 30.1% | 15.0% | **15.0%** | 15.0% | **50.3%** | 50.3% |
| `escape_squares_changed:lost` | 80.8% | 17.4% | 17.4% | 15.9% | **2.5%** | 2.5% | **96.9%** | 96.9% |
| `escape_squares_changed:gained` | 81.1% | 81.1% | 81.1% | 11.2% | **11.2%** | 11.2% | **86.2%** | 86.2% |
| `defended_duties_changed:acquired` | 6.6% | 4.6% | 4.6% | 3.3% | **2.1%** | 2.1% | **69.0%** | 69.0% |
| `defended_duties_changed:released` | 6.2% | 6.2% | 6.2% | 3.8% | **3.8%** | 3.8% | **38.5%** | 38.5% |
| `move_irreversibility` | 24.6% | 2.7% | 2.7% | 24.6% | **2.7%** | 2.7% | **89.1%** | 89.1% |

Rolled up per leaf (union over directions):

| Leaf | fires | **SIGNAL** | **FP rate** |
|---|---|---|---|
| `attacked_squares_changed` | 37.5% | 2.2% | **94.1%** |
| `defended_squares_changed` | 34.1% | 1.4% | **95.8%** |
| `slider_lines_changed` | 54.1% | 31.5% | **41.7%** |
| `escape_squares_changed` | 94.0% | 13.1% | **86.1%** |
| `defended_duties_changed` | 12.1% | 5.7% | **53.2%** |
| `move_irreversibility` | 24.6% | 2.7% | **89.1%** |

**Whole-surface figure, and this is the answer to R3 as asked.** At least one leaf fires on
**96.8%** of transitions; at least one signals on **43.4%**. The complete on-request reading
would print **6.18 observations per ply**, of which **0.68** clear T and C — an **89.0%
false-positive rate at the observation level**, i.e. **roughly nine in ten sentences in a
census-only reading are true and not worth reading** `[V]`.

**Which axis does the killing, per leaf, because the answer differs and matters:**

- `attacked_squares_changed:gained` fires 31.5% and only **3.8%** clear T `[V]`. Nearly nine in
  ten "your move attacks X" firings *are* the move. This is the pure tautology case and the
  queue row named it correctly.
- `escape_squares_changed:lost` fires **80.8%** and only 15.9% clear C `[V]`. Almost every move
  changes some piece's uncontested-destination count; almost none of those pieces are under
  any threat. This is the base-rate case.
- `move_irreversibility` clears C by construction and only **2.7%** clear T `[V]` — the
  `last_of_role` subkind. `castled`, `pawn_break` and `clock_zeroed` all restate the move the
  learner just played. This matters beyond this RFC, because `irreversibility` is **already a
  shipped live marker** (`packages/runtime/src/pivotal.ts:83`).
- `defended_squares_changed` is killed twice over: 95.8% FP under T1, **99.1%** under T0 `[V]`.
  It is the worst leaf in the set on every axis except raw firing rate.

**Phase split** `[V]`, which is a genuine constraint on where any of this can be used:

| Leaf | opening (n=236) | middlegame (n=18) | endgame (n=259) | cross-phase (n=121) |
|---|---|---|---|---|
| `attacked_squares_changed` | 1.7% | 5.6% | 1.5% | 4.1% |
| `defended_squares_changed` | 0.8% | 5.6% | 0.4% | 4.1% |
| `slider_lines_changed` | 43.6% | 55.6% | 11.6% | 47.1% |
| `escape_squares_changed` | 9.7% | 38.9% | 11.2% | 19.8% |
| `defended_duties_changed` | 7.2% | 22.2% | **0.0%** | 12.4% |
| `move_irreversibility` | 0.0% | 0.0% | 1.2% | 11.6% |

**`defended_duties_changed` signals on zero of 259 endgame transitions** `[V]`. Overload needs
enough pieces for one to be doing two jobs; the endgame packs do not have them. The live marker
the RFC proposes is structurally an opening-and-middlegame instrument, and the corpus's
middlegame sample is **18 plies**, which is far too small to carry a rate. That thinness is a
standing property of the pack corpus rather than something this pass introduced —
`design/research/move-primitive-computability.md` §2 recorded the same shape at 35 packs
(198 opening / **15 middlegame** / 259 endgame / 121 cross-phase) `[V]`.

---

## 6. Is selectivity a valid proxy for usefulness? No

The RFC leans on selectivity because it is the only thing that had been measured. R3 was
commissioned partly to test that lean, and the test fails.

| Leaf | firing rate | FP rate | signal rate |
|---|---|---|---|
| `defended_duties_changed` | 12.1% | 53.2% | 5.7% |
| `move_irreversibility` | 24.6% | 89.1% | 2.7% |
| `defended_squares_changed` | 34.1% | 95.8% | 1.4% |
| `attacked_squares_changed` | 37.5% | 94.1% | 2.2% |
| `slider_lines_changed` | 54.1% | **41.7%** | **31.5%** |
| `escape_squares_changed` | 94.0% | 86.1% | 13.1% |

**Spearman ρ(firing rate, FP rate) = −0.143** `[V]`. A valid proxy would be strongly positive.
The rarest leaf is not the cleanest, and the cleanest leaf is the second-commonest.
ρ(firing rate, signal rate) = **+0.429** — firing rate weakly predicts *more* signal, which is
what you would expect if firing rate mostly measured how often the arithmetic has anything to
chew on. **Rarity and informativeness are orthogonal**, and the 37-point band §5.4 relies on
was measuring the wrong quantity even before §4 dissolved it.

**But `slider_lines_changed` is not actually the best primitive, and axis D is what shows it.**
This is the most important internal check in the pass, because T and C alone would have
recommended putting *lines* on the live surface — a leaf that fires on more than half of all
moves.

| Leaf:direction | signals, played spine moves | signals, all 15,989 alternatives | signals, 14,980 quiet alternatives | **lift vs quiet** |
|---|---|---|---|---|
| `slider_lines_changed:opened` | 21.3% | 19.8% | 20.3% | **1.05×** |
| `slider_lines_changed:closed` | 15.0% | 22.6% | 24.0% | **0.62×** |
| `escape_squares_changed:gained` | 11.2% | 22.0% | 19.4% | **0.58×** |
| `escape_squares_changed:lost` | 2.5% | 2.1% | 2.1% | **1.19×** |
| `defended_duties_changed:acquired` | 2.1% | 4.0% | 3.4% | **0.61×** |
| `defended_duties_changed:released` | 3.8% | 2.1% | 1.7% | **2.19×** |
| `attacked_squares_changed:lost` | 1.3% | 0.7% | 0.7% | **1.89×** |
| `attacked_squares_changed:gained` | 0.9% | 0.6% | 0.6% | **1.54×** |
| `defended_squares_changed:gained` | 0.3% | 0.1% | 0.1% | **3.15×** |
| `defended_squares_changed:lost` | 1.1% | 3.9% | 3.7% | **0.30×** |
| `move_irreversibility` | 2.7% | 0.2% | 0.0% | — (no quiet firings) |

And the within-position form of the same test — given that the played move signalled, what
share of the *same position's* other legal moves would also have signalled `[V]`:

| Leaf:direction | n signalling | alternatives that also fire | **alternatives that also signal** |
|---|---|---|---|
| `slider_lines_changed:opened` | 135 | 63.6% | **32.5%** |
| `slider_lines_changed:closed` | 95 | 58.8% | **30.8%** |
| `escape_squares_changed:gained` | 71 | 85.2% | **37.3%** |
| `defended_duties_changed:released` | 24 | 31.9% | **30.5%** |
| `move_irreversibility` | 17 | 21.4% | **9.9%** |
| `escape_squares_changed:lost` | 16 | 86.9% | **12.2%** |
| `defended_duties_changed:acquired` | 13 | 23.8% | **18.6%** |

`slider_lines_changed:opened` signals on 21.3% of played moves and on 20.3% of random quiet
moves — a lift of **1.05×**, and within a signalling position a third of the alternatives
signal too `[V]`. It is R2's diagnosis in a new costume: *a renderer, not a detector.* Its low
FP rate is an artefact of C being weakest for this leaf — a ray crossing zero blockers is a
routine consequence of developing a piece, as the worked example *"the black queen on d8 opened
its line toward a8 (1→0 blockers)"* after a normal `...Bg4` shows `[M]`. **Every primitive with
a signal rate above 10% has a lift at or below 1.2×** `[V]`; the leaves that do distinguish the
played move (`move_irreversibility` at 2.7% vs 0.2%, `defended_squares_changed:gained` at
3.15×) are the ones that almost never fire. That is the real trade in this category, and it is
not the one §5.4 modelled.

---

## 7. The RFC's specific bet — one live primitive

`rfc/transition-primitives.md` §5.4 puts exactly one leaf on the live surface,
`defended_duty_acquired`, and states its own bar:

> **What R3 must show for the live tier to stay:** over the corpus's live firings, that a
> reader judges a clear majority *informative* — i.e. that the marker names something the
> reader had not already seen, at a rate materially better than a random quiet move.

Both halves are answerable from this pass. Both fail.

### 7a. "A clear majority informative" — 29.5% is an upper bound, so no

`defended_duties_changed(acquired)` produces **44 witnesses over 42 firing transitions** (6.6%
of the corpus) `[V]`. Decomposed:

| | count | share of witnesses |
|---|---|---|
| total witnesses | 44 | 100% |
| about a piece of the **opponent's** colour | 28 | 63.6% |
| about a piece of the **mover's** colour | 16 | 36.4% |
| clear **T** (the new ward is not the square the move itself created) | 31 | 70.5% |
| clear **C** (sole defender of at least one ward) | 21 | 47.7% |
| **clear both** | **13** | **29.5%** |

The 13 that clear both are the marker's entire possible informative set, because T and C are
*necessary* conditions checked mechanically. A reader could judge some of those 13 worthless;
they cannot judge any of the other 31 informative, because those 31 either restate a square the
learner just occupied or name a "duty" that other pieces already cover. **So no reader study
can produce a clear majority, and none is needed to answer the question** `[V]`. The bar is
unreachable at 29.5%.

The 13 that survive are real, and the corpus's own authors independently corroborate several of
them — `anti-italian-center-attack-black` ply 11 (*"…so White has no time to push past or
build"*), `anti-london-black` ply 7 (*"Either answer costs White something"*),
`anti-scandinavian-white` ply 13 `[V]` (§3d). The category is not empty. It is 3 parts noise to
1 part signal.

### 7b. "Materially better than a random quiet move" — 0.61×, so no

Over the 14,980 quiet legal alternatives from the same 634 parent positions, the leaf signals
on **3.4%**; over the played spine moves, **2.1%** `[V]`. Ratio **0.61×**. Firing (as opposed
to signalling) shows the same direction: **9.4%** of all alternatives against 6.6% of played
moves `[V]`.

The sign is not an accident and it is worth stating plainly `[M]`: overload is something *bad
moves create*. The spine is a corpus of moves an author endorsed, so the leaf fires *less* on
it than on arbitrary legal moves. That cuts both ways for the product — in real Just Play the
learner's moves are closer to the alternative population than to the spine, so the live volume
would be **~4.0% of moves signalling, ~0.8 markers per 20-ply branch** rather than 0.4 — but it
does not rescue the bar as written, which asks for the marker to be *better* than a random
quiet move and gets the opposite.

**Discrimination is the one axis where the leaf does well, and it is worth recording against
R2's number.** Given a signal, **18.6%** of the same position's alternatives also signal `[V]`
— against routing's 52.8% (`move-primitive-computability.md` §4c) and 98.7% false positives.
`defended_duties_changed` is a substantially better instrument than routing was. It is still
not good enough for an unasked marker.

### 7c. What the fallback should be

**The RFC's stated fallback is correct for the leaf as specified.** Remove
`"defended_duty_acquired"` from `PivotalKind`; keep the primitive in the on-request reading,
where §5.2's own argument holds untouched (*"a true answer to a question the learner asked is
not noise; the learner chose the cost"*) and where this dossier's 89% observation-level FP rate
is a cost the learner elected to pay. One enum member, as §5.4 promised.

**But the measurement supports a narrower live marker rather than none, and the RFC should
decide which it wants.** The T∧C-gated variant — *the same threshold crossing, restricted to
cases where the acquired ward is not a square the move itself created and the defender is the
sole defender of at least one ward* — has, on this corpus:

- firing rate **2.1%** of played moves, **4.0%** of arbitrary legal moves `[V]`;
- false-positive rate **0%** against these axes, by construction;
- live volume ≈ **0.4 markers per 20-ply branch** on authored spines, **0.8** on the
  learner-proxy population `[V]`;
- **zero firings in 259 endgame transitions** — it is an opening/middlegame instrument only
  `[V]`;
- within-position discrimination unchanged at 18.6% `[V]`.

Two RFC-tier objections to it, stated rather than resolved, because they are not research
questions:

1. **Rule 2.** The sole-defender conjunct is a structural predicate (`|defenders| = 1`), not a
   tuned threshold — but on the Just Play surface there is no author to supply the ward square,
   so the *detector* is choosing what to look at. §5.4's own worry about *"a free parameter
   that encodes taste"* applies, and the honest answer is that this conjunct is grounded in the
   leaf's semantics rather than fitted to the corpus (it was written before any rate was
   computed, and it is the same predicate applied to all six leaves' C axis).
2. **Rule 5.** Whether "sole defender of a ward" is a property of the *pairing* or of the
   *after* position matters, because if it is the latter it is expressible as a `position` node
   and belongs in composition rather than in the leaf. It is a property of `after` alone. That
   suggests the live marker, if it survives, is a **conjunction** the surface applies, not a new
   leaf — which costs the grammar nothing.

**One further observation the RFC did not ask for.** `defended_duties_changed(**released**)` —
the direction the RFC does *not* put live — has a lower false-positive rate (**38.5%** vs
69.0%), a higher signal rate (**3.8%** vs 2.1%) and the only positive lift of the two
(**2.19×** vs 0.61×) `[V]`. The reason is the mirror of §7b: releasing a duty is what a *good*
move does, and the corpus is made of good moves. Whether "your overload just resolved" is
hint-worthy is a product question `[M]`; the arithmetic says it is the sharper half of the
leaf, and §5.4 picked the other one.

**And a finding that lands outside this RFC.** `move_irreversibility` as the RFC's §2.3 leaf
defines it (four subkinds, `clock_zeroed` included) clears T on **2.7%** of its 24.6% firings —
an **89.1%** false-positive rate. Restricted to the three subkinds the **shipped** live marker
actually renders (`irreversibility` at `packages/runtime/src/pivotal.ts:83`, rendered at
`:103-105`; `design/05-in-run-experience.md` §5a lists it *first* among the honest detectors),
it fires on **13.4%** of transitions and clears T on 2.7% — a **79.9%** false-positive rate
`[V]`, because `castled` and `pawn_break` restate the move the learner just played and only
`last_of_role` names a fact about the board. That is not this RFC's to fix and this dossier
does not propose fixing it — but the figure is on the record now, and the already-shipped
surface has the same shape of problem the RFC is being careful about in a new one.

---

## 8. Limits of this pass

1. **No reader was asked.** Every rate is a mechanical necessary condition. §3c states the
   direction of the resulting bias: signal rates are upper bounds, FP rates lower bounds. §7a
   turns that into a decisive answer only because the upper bound already fails the bar; it
   could not have produced a *pass*.
2. **The C predicates are a defensible choice, not a derivation** `[M]`. Each is grounded in a
   repo source (§3b) and each was fixed before any rate was computed, but a different grounding
   — say, admitting attacked-and-underdefended targets rather than only loose ones — would move
   the numbers. The one place this visibly matters is `slider_lines_changed`, where C is
   weakest and where §6 argues axis D catches what C let through.
3. **The corpus is 37 authored packs, and the middlegame sample is 18 plies.** Every
   phase-resolved figure for the middlegame is indicative only. The endgame zero for
   `defended_duties_changed` rests on 259 transitions and is solid; the middlegame 22.2% rests
   on 18 and is not.
4. **The alternative-move population is a proxy for learner play, not a model of it.** It
   over-weights bad moves (it includes every legal blunder) and under-weights the
   human-plausible ones. A Maia policy-weighted population would be the honest instrument and
   is a rung-3 dependency this rung-0 pass deliberately avoided.
5. **Promotions in the alternative sweep are always to a queen**, and castling is handled
   through the occupancy-diff rather than through UCI parsing (which is why the T axis is
   correct for castling and en passant, but the alternative population contains no
   underpromotions).
6. **T1 versus T0 brackets a boundary rather than settling it.** Whether *"the knight that left
   f3 was defending e5"* is a fact a 1500 already sees is exactly the kind of claim this pass
   cannot ground, so both readings are in every table. The `defended_squares_changed:lost`
   row is where they diverge most: 94.7% FP under T1, **100%** under T0.
7. **`slider_lines_changed`'s ray enumeration** counts (slider, board-edge) rays that survive
   the move with the same colour and role on the same square. A slider that moves contributes
   nothing, which is why the leaf is 100% "remote" by construction — verified rather than
   assumed (`r3-output.md` §3: `≥1 T1` equals `fires` exactly for both directions).

---

## Appendix — raw output and reproduction

```
npx vitest run --config tools/r3-census-hint-harness/vitest.config.ts
```

Writes `tools/r3-census-hint-harness/r3-output.md`: the pair-keyed re-run, the corrected rates,
the full T/C table with both T variants, the discrimination and lift sweeps, the phase split,
the `defended_duties_changed(acquired)` decomposition, and up to four worked examples of each
verdict for each of the eleven leaf-directions, each with the parent FEN and the author's own
annotation where the pack carries one.
