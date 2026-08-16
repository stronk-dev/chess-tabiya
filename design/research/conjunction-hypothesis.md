# The conjunction hypothesis — does two of anything beat one of something?

**Question:** **R11**, *"does a conjunction of two independent primitives beat either alone on
R3's T/C/D gate?"* (`design/research/campaign-effect-vocabulary.md` §7). The mechanism it is
asking about is stated in §4 of the same dossier: *"If two primitives fire near-independently
at rates p and q, their conjunction fires at ≈pq — the specificity multiplies while each
component stays rung-0/rung-3 honest. That is the mechanism by which a **deck** beats a
**setting**: the value is in the intersection, which is exactly what a build is."* Flagged
there as the load-bearing `[M]` claim of the campaign's synergy argument, and listed as
runnable in `planning/work-register.md:139`.

**Instrument:** `tools/r11-conjunction-harness/` — a disposable research harness under
`rfc/0000-rfc-process.md` §Exploration gate, not referenced by `packages/` or `apps/` and not
part of `pnpm test`. It imports the R3 harness's `leaves.ts` **unmodified** and the R1/R2
corpus walk verbatim, so every single-primitive number in this dossier is R3's number
re-measured rather than a re-implementation. Raw output is committed beside it as
`r11-output.md`.

**Machine of record:** Apple M3 Max, Node v26.7.0 arm64, chessops 0.15.1 `[V]`. Whole pass:
**14.5 s**.

**Corpus state.** Measured at `1fea0da` with a working tree carrying a concurrent citation
pass over **22** pack documents. Those edits touch prose, provenance and attribution only:
comparing each edited pack's `start.fen` and full `moveUci` spine tree against its `HEAD`
version gives **0 differences in 22 files** `[V]`, so nothing this dossier measures moved
underneath it.

---

## 1. Verdict

**Refuted, and the premise fails before the conclusion does. A conjunction of two census
primitives does not beat either alone on any axis of R3's gate — it is worse on all three.**
Measured over **721 spine transitions from the 47 committed packs** and **19,099 legal
alternatives** enumerated from the same parent positions `[V]`:

- **Precision (axes T∧C).** The best single leaf:direction on this corpus reaches **69.4%**
  precision (`defended_duties_changed:released`). The best of all 55 pairwise conjunctions
  reaches **35.7%**. Exactly **1 of the 51 measurable pairs** beats both of its own components,
  and it does so at 19.2% — a quarter of the best single primitive `[V]` (§4).
- **Discrimination (axis D — the binding axis R3 established).** Only **7 of 55** pairs produce
  enough signalling witnesses to measure discrimination at all. Their **median lift against a
  random quiet move is 0.66×** — *worse* than not looking — and **5 of the 7 sit below 1.0×**.
  The best conjunction reaches 2.73×; the best single primitive reaches **12.64×** against the
  full alternative population — 3.31× among the leaves that fire on quiet moves at all `[V]`
  (§5).
- **Dominance.** **Zero** conjunctions beat the best single key on both axes at once, and
  **zero of the seven** beat even their own two components on both axes `[V]` (§5c).

**The premise is false too, and it is false in the direction that matters.** §4 assumes near-
independent firing. Over the 55 pairs the median firing lift observed/(p·q·n) is **1.136**, only
**17 of 55** land within ±10% of independence, **20 of 55** are positively coupled at ≥1.2×, and
the most coupled pair fires **5.26×** more often than independence predicts (φ = 0.456) `[V]`
(§3). But the fatal half is the second half of the sentence, not the first: **the false
positives multiply at the same rate the specificity does.** Given both leaves fired, the two
*signals* are close to independent — the observed joint precision is a median **1.18×** the
pure-independence prediction, with only 8 of 46 pairs even that close `[V]` — so
precision(A∧B) ≈ precision(A)·precision(B), which for two leaves at 45% and 50% is 22%, not 50%.
**§4 assumed the conjunction multiplies rarity while preserving informativeness. It multiplies
both.** R3 already established that rarity does not predict usefulness (ρ = −0.143); R11 is the
demonstration of what happens when you manufacture rarity on purpose.

**And the multiplication continues into unmeasurability, which is the second finding.** Of all
165 possible triples, **38 ever produce three simultaneous signals anywhere in the corpus**, the
most frequent does so **6 times in 721 transitions**, and **none reaches 10** `[V]` (§6). A
build assembled from three or more transition primitives has no witnesses to be right about.

**The one arm that returns a positive result is the one nobody proposed: a census leaf conjoined
with a shipped structural lens read on the position AFTER the move** `[V]` (§7b). Its best
combination — `defended_duties_changed:released ∧ isolated_pawn(after)` — reaches **8.77×**
against 2.74× for the leaf alone, and 25 of 72 combinations beat their own leaf's lift. It is
not free: the median is **0.79×**, so most of them are still noise, and this arm was not part of
the hypothesis.

**`DESIGN-GAP:` the mirror-image finding, and it is analytic rather than statistical. A lens read
on the position BEFORE the move is discrimination-inert by construction.** It takes the same
value for the played move and for every alternative from that position, so conjoining a
transition primitive with a pre-move lens cannot change *which move* is singled out — only *at
which positions the surface speaks*. All three of §4's worked triples conjoin with pre-move
lenses. Measured across 161 such combinations, precision moves by a median **+0.1 pp** and the
apparent axis-D lift moves only because the denominator population changed `[V]` (§7a). This
matters beyond R11: it is a general rule for the assistance ladder, and it says the shape
library's 96 authored signatures — which are pre-move predicates — buy *targeting*, not
*discrimination*.

**What this changes.** `campaign-effect-vocabulary.md` §4's synergy claim moves from `[M]` to
**`[V]`-refuted for the emergent half**; authored synergy (shape signatures) is untouched
because it was never the claim under test. `roguelike-run-design.md` §3 rank 6 named the
consequence in advance and it now applies: *"if it fails our loadouts are additive not
synergistic"* — the slot-budget design should keep optimising for the **smallest sufficient
set** (Into the Breach's shape, already the dossier's recommendation) and should **not** ship a
synergy-discovery mechanism, an unlock that pays off "in combination", or any deck framing that
promises the value is in the intersection. The lens pool remains worth having; the *combination*
of lenses is not where its value is.

**By-product, and it is the most useful number in the pass.** `move_irreversibility`'s single
T-passing subkind (`last_of_role`) is **the most discriminating primitive in the whole set**:
2.91% on played moves against 0.23% across all 19,099 alternatives — a **12.64×** lift `[V]`.
R3 could only record *"— (no quiet firings)"* for it because it never fires on a quiet move by
construction. It is a *single* primitive, it is rare, and it beats every conjunction measured
here by more than four times.

**R3's own headline still holds on the grown corpus.** Re-run at HEAD: **88.7%** false positives
at the observation level (6.43 observations per ply, 0.73 clearing T∧C) against R3's 89.0%
(6.18 / 0.68), with ρ(firing rate, FP rate) identical at **−0.143** `[V]` (§2c).

---

## 2. What R11 actually says, where it says it, and which reading was tested

### 2a. Where the statement lives — and it is not registered anywhere it should be

R11 is stated in exactly two places, both of them research dossiers, and named without a
statement in a third:

| Source | What it says |
|---|---|
| `design/research/campaign-effect-vocabulary.md` §7 | *"**R11 (proposed):** does a conjunction of two independent primitives beat either alone on R3's T/C/D gate? The one measurement that would convert §4 from `[M]` to `[V]`."* |
| `design/research/campaign-effect-vocabulary.md` §4 | The mechanism: *"If two primitives fire near-independently at rates p and q, their conjunction fires at ≈pq — the specificity multiplies while each component stays rung-0/rung-3 honest."* Plus three worked triples |
| `design/research/roguelike-run-design.md` §3 rank 6, §7 | Widens it to loadouts: *"synergy is what makes a deck a deck… if it fails our loadouts are additive not synergistic"* |
| `planning/work-register.md:139` | Name only: *"R11 (the conjunction hypothesis, runnable on the existing R3 harness)"* |

**It appears in `planning/exploration/plan.md`: no. In `design/BACKLOG.md`: no. In
`planning/campaign-research-queue.md`: no** — grep for `R11` returns zero hits in all three
`[V]`. R11 is the only lettered research question in the campaign series with no ledger row and
no queue row, which is a law-4 miss rather than a research finding; it is registered by this
pass (§10, `D286`).

### 2b. The drift, and which reading this pass tested

The three sources do not ask the same question, and the difference decides the answer:

1. **Narrow** — two of R3's six census leaves, judged on R3's own T/C/D gate. This is what §7's
   sentence literally says, and it is exactly measurable on the R3 harness.
2. **Mid** — one census leaf conjoined with a *position* lens. This is the shape all three of
   §4's worked triples actually have: `named_structure(carlsbad)` ∧ `overload` ∧ `plan class`;
   `passed_pawn` ∧ `king_opposition` ∧ `piece_distance`; `move_irreversibility(pawn_break)` ∧
   `human_divergence`. §4's own prose says "two independent primitives"; its examples are
   heterogeneous triples.
3. **Wide** — any two of the 49 lenses `campaign-effect-vocabulary.md` §2 counts, including the
   rung-3 `human_divergence` (a Maia policy split) that the third worked triple turns on.

**This pass tested reading 1 as primary (§3–§6) and reading 2 as a full second arm (§7), and
reports both.** Reading 3 is **not testable on this instrument**: `human_divergence` needs a
Maia policy probe per alternative move, i.e. ~19,099 probes against the container, which is an
R5/R10-class harness and not this one. §9 names it as the missing instrument and says what it
would cost.

The two testable readings agree on the verdict and disagree on the reason, which is why both are
here: reading 1 fails because the false positives multiply; reading 2 fails because a pre-move
lens is discrimination-inert by construction. Neither failure would have been visible from the
other.

### 2c. The instrument was verified before it was extended

`tools/r3-census-hint-harness/` runs clean at HEAD — 1 test, **1.14 s**, exit 0, no
modifications required `[V]`. No bit-rot cost was incurred. Running it regenerates its
committed `r3-output.md` with new numbers on the same code, which is the corpus having grown,
not the instrument having moved; **that file has been restored to its R3-era state** so the R3
dossier's citations keep pointing at the raw output R3 was written from. The replication below
is the R11 harness's own Leg 0, computed independently from the same unmodified `leaves.ts`.

The R3 headline re-measured:

| Figure | R3 (37 packs / 634 transitions) | this pass (47 packs / 721 transitions) |
|---|---|---|
| observations per ply | 6.18 | **6.43** |
| T∧C observations per ply | 0.68 | **0.73** |
| **observation-level false-positive rate** | **89.0%** | **88.7%** |
| ≥1 leaf fires | 96.8% | 97.2% |
| ≥1 leaf signals | 43.4% | 45.9% |
| Spearman ρ(firing rate, FP rate) | −0.143 | **−0.143** |

Raw: 4,634 observations, 524 of them T∧C `[V]`. **89.0% has not moved** — a 0.3-point drift
across a 25% larger corpus and a phase mix that changed substantially (§8a). Per-leaf rates are
equally stable: `slider_lines_changed` 41.7% → 43.2% FP, `escape_squares_changed` 86.1% → 84.6%,
`defended_duties_changed` 53.2% → 48.5%, `move_irreversibility` 89.1% → 88.1% `[V]`.

---

## 3. Is the premise true? Do two primitives fire near-independently?

§4's arithmetic needs joint firing at ≈ p·q. Over all 55 pairs of the 11 leaf:direction keys
`[V]` (`r11-output.md` §Leg 1):

| statistic | value |
|---|---|
| median firing lift observed/(p·q·n) | **1.136** |
| mean | 1.288 |
| min / max | 0.350 / **5.255** |
| pairs positively coupled at ≥1.20× | **20 / 55** |
| pairs within ±10% of independence | 17 / 55 |
| median φ | 0.072 |
| max φ | 0.456 |

The coupling is not random. The four most coupled pairs all pair an *attack* leaf with a *duty*
leaf — `attacked_squares_changed:lost ∧ defended_duties_changed:released` at **5.26×**,
`attacked_squares_changed:gained ∧ defended_duties_changed:acquired` at **2.69×** — which is
expected once stated: a duty is *defined* by an attack relation, so the two leaves are reading
overlapping arithmetic off the same board `[M]`. **Independence is not a property you get for
free by picking two differently-named primitives**; six leaves computed from one attack map are
six views of one object.

This alone weakens §4's mechanism (the conjunction is rarer than either component but not as
rare as p·q), and it is not what kills it. What kills it is §4.

---

## 4. Precision — does the conjunction beat either component on T∧C?

**Definition.** The detector is *both keys fire*; the success criterion is *both keys produce a
T∧C witness* — §4's own "each component stays rung-honest". Pairs with fewer than 10 joint
firings are excluded (4 of 55) so that no verdict rests on three observations.

| statistic | value |
|---|---|
| pairs measured | 51 |
| pairs whose precision exceeds **both** components' | **1 / 51** |
| … by more than 5 points | 1 / 51 |
| **best single leaf:direction precision** | **69.4%** (`defended_duties_changed:released`) |
| **best conjunction precision** | **35.7%** (`slider_lines_changed:closed ∧ defended_duties_changed:released`) |

The top of the table, in full `[V]`:

| conjunction | fires (of 721) | precision | prec A | prec B | beats both? |
|---|---|---|---|---|---|
| `slider_lines_changed:closed ∧ defended_duties_changed:released` | 14 | 35.7% | 49.4% | 69.4% | no |
| `defended_duties_changed:released ∧ move_irreversibility:fired` | 22 | 31.8% | 69.4% | 11.9% | no |
| `slider_lines_changed:closed ∧ defended_duties_changed:acquired` | 30 | 30.0% | 49.4% | 36.2% | no |
| `slider_lines_changed:opened ∧ defended_duties_changed:released` | 41 | 24.4% | 44.3% | 69.4% | no |
| `escape_squares_changed:gained ∧ defended_duties_changed:released` | 43 | 23.3% | 15.3% | 69.4% | no |
| `slider_lines_changed:opened ∧ slider_lines_changed:closed` | 167 | 20.4% | 44.3% | 49.4% | no |
| **`defended_squares_changed:lost ∧ move_irreversibility:fired`** | 26 | **19.2%** | 6.0% | 11.9% | **yes** |

The single winner beats two components that are themselves near the floor. It is a real result
and it is not a useful one: 19.2% precision means four in five firings are still false positives,
and it is 50 points below the best single primitive in the same table.

### 4a. The arithmetic, which is the actual finding

Given both leaves fired, are the two *signals* independent? If so, precision multiplies
downward:

| statistic | value |
|---|---|
| pairs with a non-zero product | 46 |
| **median observed precision ÷ independent-signal prediction** | **1.18** (1.00 = independent) |
| pairs within ±25% of the independence prediction | 8 / 46 |
| min / max ratio | 0.00 / 14.14 |

A median of 1.18 says the signals are *slightly* mutually reinforcing and nowhere near the
regime §4 needed. For the conjunction to preserve the better component's precision, the ratio
would have to be 1/min(pA,pB) — typically 2–8. It is 1.18. **The specificity multiplies and so
does the error, which is why the conjunction is rarer *and* worse.**

### 4b. The filter form — adding a lens to a loadout

The deck reading of R11 is not "print a joint hint" but "having lens B changes what lens A shows
you". Measured as P(A signals | A fires ∧ B fires) − P(A signals | A fires), twice per pair:

| statistic | value |
|---|---|
| conditioned precisions measured | 102 |
| **median change** | **+0.6 pp** |
| raise precision at all | 58 / 102 |
| raise it by ≥10 pp | 10 / 102 |
| best / worst | +31.0 pp / −26.5 pp |

A median of six-tenths of a point, with 44 of 102 conditionings making it *worse*. **A second
lens in the loadout does not sharpen the first one.**

---

## 5. Axis D — discrimination, and why it is the binding axis

R3's third result binds this pass: *any "is this informative" test must compare against the moves
NOT played*. The population is the **19,099** legal alternatives enumerated from the same 721
parent positions, **17,906** of them quiet (non-capture, non-checking). Lift = P(signals | played
spine move) ÷ P(signals | random quiet alternative). R3's own calibration: it condemned
`slider_lines_changed` at **1.05×** and the shipped duty marker at **0.61×**.

### 5a. Only seven conjunctions can be measured at all

**Of 55 pairs, 7 produce ≥10 simultaneously-signalling spine moves.** That is the first result of
this section and it is structural, not a sample-size complaint: to co-signal often enough to
measure, a pair needs at least one *blunt* component, and **all 7 measurable pairs contain
`slider_lines_changed` or `escape_squares_changed`** — the two leaves whose single-key lifts are
0.99×, 0.66×, 1.00× and 0.60×, i.e. the two R3 diagnosed as describing the position rather than
the move `[V]`. The sharp primitives are too rare to intersect.

| conjunction | signalling spine moves | **lift vs quiet** | lift vs all | lift A alone | lift B alone | same-position alternatives that also signal |
|---|---|---|---|---|---|---|
| `escape_squares_changed:gained ∧ defended_duties_changed:released` | 10 | **2.73×** | 1.70× | 0.60× | 2.74× | 11.1% |
| `slider_lines_changed:opened ∧ defended_duties_changed:released` | 10 | **2.39×** | 1.99× | 0.99× | 2.74× | 19.3% |
| `slider_lines_changed:opened ∧ escape_squares_changed:lost` | 14 | 0.92× | 0.92× | 0.99× | 1.00× | 13.8% |
| `escape_squares_changed:gained ∧ defended_duties_changed:acquired` | 11 | 0.66× | 0.53× | 0.60× | 0.73× | 7.8% |
| `slider_lines_changed:opened ∧ slider_lines_changed:closed` | 34 | 0.65× | 0.69× | 0.99× | 0.66× | 10.7% |
| `slider_lines_changed:opened ∧ escape_squares_changed:gained` | 14 | 0.37× | 0.36× | 0.99× | 0.60× | 19.9% |
| `slider_lines_changed:closed ∧ escape_squares_changed:gained` | 12 | 0.26× | 0.28× | 0.60× | 0.66× | 11.5% |

**Median lift 0.66×. Five of seven below 1.0×.** The two that clear 2× do so entirely on the
strength of `defended_duties_changed:released` (2.74× alone) — and *both are below it*. The
conjunction inherits the blunt component's floor and pays the sharp component's rarity.

The within-position column is the one place a conjunction does help: a median **11.5%** of the
same position's alternatives also signal, against R3's 30.5–37.3% for the blunt leaves alone. So
a conjunction does narrow *how many moves in this position would have said the same thing* — but
it narrows it around a move that is *less* likely to be the played one, which is a sharper way of
being wrong.

### 5b. The single-primitive baseline, re-measured, with one correction to R3

| key | signal rate, played | signal rate, quiet alternatives | lift vs quiet | **lift vs all alternatives** |
|---|---|---|---|---|
| `move_irreversibility:fired` | 2.91% | 0.00% | ≥173.84× | **12.64×** |
| `defended_squares_changed:gained` | 0.28% | 0.08% | 3.31× | 3.53× |
| `defended_duties_changed:released` | 4.72% | 1.72% | 2.74× | 2.17× |
| `attacked_squares_changed:lost` | 1.25% | 0.63% | 1.98× | 1.82× |
| `attacked_squares_changed:gained` | 0.83% | 0.72% | 1.16× | 1.14× |
| `escape_squares_changed:lost` | 2.64% | 2.64% | 1.00× | 1.01× |
| `slider_lines_changed:opened` | 21.50% | 21.79% | 0.99× | 1.01× |
| `defended_duties_changed:acquired` | 2.91% | 3.99% | 0.73× | 0.62× |
| `slider_lines_changed:closed` | 15.81% | 24.08% | 0.66× | 0.70× |
| `escape_squares_changed:gained` | 12.48% | 20.92% | 0.60× | 0.53× |
| `defended_squares_changed:lost` | 1.25% | 3.86% | 0.32× | 0.31× |

**The correction.** R3 reported `move_irreversibility` as *"— (no quiet firings)"* and could say
no more. Two changes make it sayable here: where the alternative count is zero the rate is
replaced by its 95% one-sided upper bound (rule of three, 3/N) so the lift is a bound rather than
infinity; and a second lift is computed against **all** alternatives, because the quiet filter
excludes the leaf's only T-passing subkind by construction (`last_of_role` requires a capture).
Against all 19,099 alternatives it lifts **12.64×** `[V]` — the highest number in this dossier,
and it belongs to a single primitive with a 2.9% signal rate. R3's §7c pointed at a narrowing of
exactly this leaf; this is the number that supports it.

### 5c. The dominance test

| bar | value |
|---|---|
| best single-key precision | 69.4% |
| best single-key axis-D lift (excluding the bounded one) | 3.31× |
| conjunctions clearing **both** global bars | **0** |
| conjunctions clearing the weaker bar — beating **their own** two components on both axes | **0 / 7** |

Not one conjunction beats the pair of primitives it is made of. That is the answer to R11 as
asked.

---

## 6. Triples — the multiplication continues into nothing

If §4's mechanism worked, three primitives should beat two.

| statistic | value |
|---|---|
| distinct triples where all three keys **fire** ≥10 times | 115 |
| distinct triples where all three keys **signal**, at any count | **38** |
| **largest signalling-triple witness count anywhere in the corpus** | **6** of 721 transitions |
| triples with ≥10 signalling spine witnesses | **0** |

The most frequent signalling triple in the whole corpus fires six times. Second is four. `[V]`

This is §4's own arithmetic arriving at its conclusion: specificity really does multiply, and at
the third factor there is nothing left to be specific about. **Any campaign design that speaks of
a "build" combining three or more *transition* primitives is arithmetically empty on a
721-transition corpus** — not underpowered, empty. Position lenses do not have this property
(they co-occur freely, §7), which is where a slot budget has to come from if it comes from
anywhere.

---

## 7. The cross-family arm — a census leaf ∧ a shipped position lens

This is reading 2 (§2b) and the shape §4's three worked triples actually have. The lens
vocabulary is the **shipped** `structuralReading()` feature kinds plus named structures plus
`classifyPhase()`, imported from `packages/runtime/src/` rather than re-implemented — 25 lenses
present on the corpus, of which **4 are unconditional** (fire on >95% of parents:
`pawn_safe_square`, `piece_count`, `piece_distance`, `piece_reach_count`) and excluded per
`campaign-effect-vocabulary.md` §6 rule 4, leaving **17 usable** `[V]`.

### 7a. Pre-move lenses: discrimination-inert by construction

**A lens evaluated on the parent position takes the same value for the played move and for every
alternative from that position.** It therefore cannot change which move the surface distinguishes;
it can only change at which positions the surface speaks. This is analytic, not statistical, and
it holds for every pre-move predicate — including all 96 signed shape signatures.

Measured across 161 leaf ∧ lens combinations with ≥10 firings `[V]`:

| statistic | value |
|---|---|
| combinations that raise the leaf's precision | 89 / 161 |
| **median precision change** | **+0.1 pp** |
| max precision change | +42.3 pp |
| combinations that raise the leaf's apparent axis-D lift | 93 / 161 |
| **median axis-D lift change** | **+0.040×** |

The large precision gains are real and are all *population* effects, not *discrimination* effects.
`slider_lines_changed:opened ∧ phase:endgame` reaches **80.0%** precision on 25 firings
(+35.7 pp) because the endgame is where slider lines mean something; `escape_squares_changed:
gained ∧ structure:carlsbad` reaches **43.2%** (+27.9 pp) on 37. Both are worth having.
**Neither is synergy**: the conjunction has told you *where to speak*, and within those positions
the share of the same position's alternatives that also signal is **51.7%** and **39.7%**
respectively — i.e. the surface is still describing the position rather than the move `[V]`.

**This is the finding with the widest reach in the dossier.** §4's Triples 1 and 2 are both
pre-move conjunctions; so is the "boss by census" mechanism; so is every shape signature. They
are *selectors*, and selection is genuinely useful — it is what `campaign-effect-vocabulary.md`
means by targeting. It is not what "the value is in the intersection" claims.

### 7b. Post-move lenses: the one positive result in the pass

Reading the same lenses on the position *after* the move makes them vary across alternatives, so
they can discriminate. 72 combinations with ≥10 signalling spine moves `[V]`:

| statistic | value |
|---|---|
| **median axis-D lift** | **0.79×** |
| combinations beating their own leaf's lift | **25 / 72** |
| **max axis-D lift** | **8.77×** |

| leaf ∧ after-lens | signalling spine moves | quiet rate | lift | leaf alone |
|---|---|---|---|---|
| `defended_duties_changed:released ∧ after:isolated_pawn` | 12 | 0.19% | **8.77×** | 2.74× |
| `escape_squares_changed:gained ∧ after:passed_pawn` | 20 | 0.42% | **6.54×** | 0.60× |
| `defended_duties_changed:released ∧ after:backward_pawn` | 15 | 0.49% | 4.23× | 2.74× |
| `defended_duties_changed:released ∧ after:open_file` | 15 | 0.49% | 4.23× | 2.74× |
| `escape_squares_changed:gained ∧ after:phase:endgame` | 30 | 1.37% | 3.03× | 0.60× |

`escape_squares_changed:gained ∧ after:passed_pawn` is the striking row: a leaf with a **0.60×**
lift — one R3 would condemn outright — becomes **6.54×** when the resulting position has a passed
pawn. That is a genuine conjunction effect on the binding axis, and the honest reading of it is
narrow `[M]`: a passed pawn in the child position is partly a *restatement of the move* for pawn
moves, which is axis T's own concern, and 12–30 witnesses is thin. **The claim this dossier makes
is that the arm is worth an instrument, not that the number is worth shipping.**

Note what separates 7a from 7b: it is not the lens and not the leaf, it is **when the lens is
read**. That distinction is not present anywhere in the design tier.

---

## 8. Population — stated, and what a different one would have done

**The primary population is the 721 authored spine transitions**: moves an author endorsed,
replayed from each pack's `start.fen`. Every precision figure is conditioned on it. The
alternative population — 19,099 legal moves from the same parents, 17,906 quiet — is a proxy for
*moves a learner might play*, not a model of one, and it is the only reason axis D exists.

### 8a. By phase, and the corpus's centre of gravity moved

| phase | transitions | obs/ply | T∧C/ply | observation-level FP | ≥1 leaf signals |
|---|---|---|---|---|---|
| opening | 236 | 8.74 | 0.75 | **91.4%** | 52.1% |
| middlegame | **105** | 8.39 | 1.17 | **86.0%** | 65.7% |
| endgame | 259 | 2.60 | 0.28 | 89.3% | 22.8% |
| cross-phase | 121 | 8.40 | 1.26 | 85.0% | 66.1% |

**R3's limit 3 is discharged.** R3 said *"the corpus's middlegame sample is 18 plies, which is
far too small to carry a rate"*. It is now **105 plies from 11 packs**, and it carries one: the
middlegame is the **least** false-positive phase in the corpus (86.0%) and the one where the most
leaves signal (65.7%) `[V]`. This is the phase R4 and R9 jointly proved has no engine or
human-outcome oracle — so it is worth recording plainly that the census layer works *best*
exactly where the measured layers work worst, and still at 86% false positives.

The endgame is the mirror: 2.60 observations per ply against 8.74 in the opening. **A corpus
weighted toward endgames would report a third of the observation volume** and a different leaf
mix, so the headline "6.43 observations per ply" is a property of a corpus that is 33% opening
and 36% endgame, not of the census.

### 8b. Middlegame only — the verdict does not move

| figure | middlegame only (n = 105) | whole corpus (n = 721) |
|---|---|---|
| best single-key precision | **80.0%** | 69.4% |
| best conjunction precision | 46.2% | 35.7% |
| pairs measurable (≥10 joint firings) | 37 | 51 |

Both numbers rise; the gap between them does not close. On the phase most favourable to the
census the best single primitive still beats the best conjunction by 34 points `[V]`.

### 8c. The population that would have flattered the hypothesis, and does not

The authored spine is the **generous** population for R11 — it is a curated set of good moves, so
any primitive that correlates with "a strong player chose this" gets credit. Re-running the
precision test with the 17,906 quiet legal alternatives as the population instead:

| figure | spine population | quiet-alternative population |
|---|---|---|
| pairs measured | 51 | 55 |
| pairs whose precision beats both components | **1 (2.0%)** | **0 (0.0%)** |

Swapping to the harsher population removes the single winner. **The hypothesis fails on both
populations, and it fails harder on the one that resembles a learner.**

**What population would have changed the answer, honestly stated `[M]`:** a Maia-policy-weighted
alternative set (R3's own limit 4). Our quiet-alternative population contains every legal blunder
with equal weight, which *deflates* the alternative signal rate for primitives that only fire on
plausible moves — and therefore **inflates** every lift in this dossier. That direction favours
the hypothesis, and the hypothesis still lost. A population weighted toward moves a 1500 would
actually consider would make the lifts smaller, not larger.

---

## 9. What would settle the part this instrument cannot reach

**§4's Triple 3 — `move_irreversibility(pawn_break)` ∧ `human_divergence` at a declared band —
is the one conjunction with a *rung-3* component, and it is the only one whose two halves are
genuinely independent** (one is set arithmetic over two positions; the other is a Maia policy
split). It is the strongest form of the hypothesis and it is untested.

**The instrument that would settle it**, specified so it can be costed rather than admired:

- Take the 721 spine parents and, for each, the ~26 legal alternatives (19,099 total).
- Probe Maia policy at one band for each **parent** — 721 probes, not 19,099, because the policy
  is a distribution over the parent's moves. R5 measured the policy vector as **bit-identical
  across 20 repeats** and R10 measured a full 68-point band grid at 5,080 probes / 0 errors, so
  721 probes is well inside a single harness run.
- `human_divergence` as shipped then classifies *the decision point*, not a move: it fires when
  no candidate holds >0.5 of the mass and at least three hold ≥0.15 (`pivotal.ts:30-40`) `[V]`.
  That makes it a **pre-move lens**, and §7a's analytic result applies to it before a single
  probe is run: **it can select where to speak; it cannot discriminate which move.**
- The discriminating form would have to be *per-move policy mass* — "the move you played is one
  the band rarely chooses" — which is a different predicate from `human_divergence` and is
  already shipped in `humanConcessionMass` (`opponent-selector.ts`).

So the honest statement is: **the Maia arm is measurable at low cost, and §7a predicts its
outcome for the predicate as specified.** The interesting version is not R11's conjunction at
all; it is per-move policy mass as a *single* primitive, and it is the natural successor
question. Naming it here rather than smuggling it into this verdict.

---

## 10. Limits of this pass

1. **Every R3 limit is inherited.** The axes are mechanical **necessary** conditions, so signal
   rates are upper bounds and FP rates lower bounds; no reader was asked; promotions in the
   alternative sweep are always to a queen; T1/T0 brackets a boundary rather than settling it.
   `tools/r3-census-hint-harness/README.md` and `census-hint-false-positives.md` §8 state them at
   length and none of them changed.
2. **Seven measurable conjunctions is a thin base for a median.** The 0.66× median rests on 7
   pairs with 10–34 witnesses each. The *verdict* does not rest on the median — it rests on 0 of
   7 clearing their own components and 0 of 51 clearing the global precision bar — but the
   median should not be quoted as a precise quantity.
3. **The ≥10-witness floor is a choice.** It was fixed before any conjunction number was
   computed, and lowering it would add pairs whose rates are noise. Leg 5's triples are reported
   *below* the floor precisely so the reader can see the floor doing work rather than hiding a
   result.
4. **The lens vocabulary is the shipped structural reading, not the full 49-lens pool.**
   `campaign-effect-vocabulary.md` counts 49 nameable lenses across 18 structural kinds, 6
   transition kinds and 25 shapes. This pass covers the structural kinds and phase; the 25 shape
   entries are *authored* pre-move signatures and §7a's analytic result covers them without a
   measurement.
5. **The rule-of-three substitution is a convention.** Where an alternative-population count is
   zero the rate is replaced by 3/N, so the reported lift is a 95% lower bound. It appears once
   (`move_irreversibility` vs quiet), and the all-alternatives column is given beside it
   precisely so the bound is not the only number available.
6. **One harness bug was found and fixed mid-pass, and it is recorded because it is a reusable
   trap.** The first run keyed pairs alphabetically on the alternative population and by leaf
   order on the spine population, so seven conjunctions reported a zero denominator and an
   infinite lift. The fix is a single canonicalising `comboKey()`. **An infinite lift is what a
   keying bug looks like** — the first draft of this dossier would have reported seven
   conjunctions with unbounded discrimination, which is the exact shape of result R11 was hoping
   for.
7. **No engine, tablebase, corpus or model was consulted.** Law 8: everything reported as a
   number is a mechanical predicate over attack maps, occupancy and the shipped structural
   reader. Where a sentence interprets, it carries `[M]`.

---

## Appendix — raw output and reproduction

```
npx vitest run --config tools/r3-census-hint-harness/vitest.config.ts    # R3, unmodified, 1.14 s
npx vitest run --config tools/r11-conjunction-harness/vitest.config.ts   # R11, 14.5 s
```

`tools/r11-conjunction-harness/r11-output.md` carries all six legs in full: the R3 replication,
the independence sweep over all 55 pairs, both precision forms with the signal-multiplication
check, the complete axis-D table with per-pair alternative counts, the 161 pre-move and 72
post-move cross-family combinations, the triple census, and the three population re-runs.
