# Basic semantic tactics — Stage 0 population and proof boundary

**Question:** Are overload, defender removal/deflection, interference, clearance, zwischenzug,
mating patterns and promotion threats optional “deep” analysis, or missing basic classifier
foundation—and what evidence horizon do they require?

**Status:** partial `[V]`; external population/upstream tagger, exact observed sequences,
complete-one-reply boundary and exact next-mate/promotion consequences measured; external detector
agreement and deeper mating/race horizons remain.
**Instrument:** `tools/d872-semantic-tactics-harness/`  
**Authority:** D872 / evidence-foundation Wave C

## Verdict

These are **basic 1.0 semantic tactics**, not optional enrichment. The existing position and
one-edge collectors are their operands, not substitutes for them. `[M]`

The first measurement rejects the idea that they can be recovered by renaming snapshot geometry.
In a 250,587-record prefix of the official Lichess CC0 puzzle export, defender capture, deflection,
attraction, interference and clearance each have a median solution horizon of three or five plies;
their p90 is five or seven. Quiet-move and promotion records extend to a nine-ply p90. `[V]`
(`tools/d872-semantic-tactics-harness/output.md`; source/digests in its README)

The families are also not mutually exclusive. Capturing-defender, deflection, attraction,
interference and clearance are co-tagged with at least one other listed semantic family in
23.8–29.5% of their records. The largest pair is attraction+deflection at 1,014 records; deflection
also overlaps discovered attack 682 times. `[V]` (`tools/d872-semantic-tactics-harness/output.md`)

Therefore the production shape is a set of independently grounded, composable semantic events over
retained identities and bounded continuations. It is not a single tactic label or a ranking chosen
by an LLM. `[M]`

## 1. Method and limits

The disposable instrument reads every complete row in the same bounded 12 MiB compressed prefix
used by the detection-landscape study: 250,587 complete records plus one explicitly rejected
truncated tail. It records tag reach, solution-line length, phase labels, pair overlap and fixed
example ids for twelve families. `[V]` (`tools/d872-semantic-tactics-harness/README.md`)

Lichess documents that its puzzle export is generated from analysed games, automatically tagged
and refined through player votes. The FEN precedes an opponent setup move, so this dossier reports
solution plies after that setup. Tags may describe any solver move in the supplied line. `[V]`
([official puzzle database and format](https://database.lichess.org/#puzzles))

The tags are a large disagreement population, not human-adjudicated ground truth. Their presence
cannot establish that a proposed definition is correct; their absence cannot prove it false. The
current upstream tagger is additionally not guaranteed to be the exact historical tagger that
created every retained database label. `[M]`

## 2. Measured population

| family | records | median / p90 solution plies | co-tagged with another listed family |
|---|---:|---:|---:|
| capturing defender | 1,642 | 3 / 5 | 28.9% |
| deflection | 10,915 | 5 / 7 | 25.1% |
| attraction | 9,088 | 5 / 7 | 23.8% |
| interference | 928 | 5 / 7 | 29.5% |
| clearance | 3,352 | 5 / 7 | 24.7% |
| intermezzo/zwischenzug | 2,891 | 3 / 5 | 15.3% |
| overloading | **0** | n/a | n/a |
| discovered attack | 12,668 | 3 / 5 | 14.2% |
| trapped piece | 2,827 | 3 / 5 | 9.4% |
| back-rank mate | 8,502 | 3 / 5 | 4.8% |
| quiet move | 10,381 | 5 / 9 | 15.7% |
| promotion | 5,867 | 5 / 9 | 30.3% |

`[V]` Full phase splits, minima, top overlaps and reproducible puzzle ids are in
`tools/d872-semantic-tactics-harness/output.md`.

Three consequences follow:

1. A one-reply collector is a useful primitive but not the semantic ceiling. A typical five-ply
   line contains solver move → reply → solver move → reply → solver move, which exceeds the current
   `reply_breadth@1` consequence horizon. `[M]`
2. A semantic event must retain piece/target identity across captures, promotions and relocation.
   Otherwise a later capture can be joined by square coincidence—the hard negative D772 already
   falsified. `[V]` (`design/research/identity-retaining-three-edge-consequences.md` §2)
3. The taxonomy must be multi-label. A rule forcing one classification would erase measured
   overlap before learner selection even begins. `[M]`

## 3. What the upstream tagger actually proves

The current Lichess tagger implements these names as line-level recognizers, not position
classifiers. Its `capturing_defender`, `deflection`, `interference`, `clearance` and `intermezzo`
functions inspect later solver moves and preceding opponent replies; `attraction` follows a moved
piece to a later attack/capture on the attracted square. `[V]`
([current tagger source](https://github.com/ornicar/lichess-puzzler/blob/master/tagger/cook.py),
locally fetched 2026-08-22 with SHA-256
`b21a0d179b710742010dde07e806eda0ecea0514412af9f5a1d04d053bc9859d`)

Most importantly, `overloading(puzzle)` is an unconditional `False`. The bounded export prefix
contains zero `overloading` rows, matching that source state. `[V]` (same source;
`tools/d872-semantic-tactics-harness/output.md`)

This means Lichess provides useful disagreement sets for several line motifs and **no oracle at all
for overload**. An overload detector needs cited canonical positions plus constructed controls and
its own reply-completeness proof; “agreement with Lichess” cannot be its admission criterion. `[M]`

The tagger also illustrates why its labels cannot be copied as our contract: several rules use
“hanging” and material-value helpers, inspect the authored solution line rather than all replies,
and sometimes infer a motif from the move order. Those are legitimate puzzle-tagging conventions,
not evidence that the motif was forced or that the same rule is suitable for live Support. `[V]`
(same source)

## 4. Honest minimum contracts for Stage 1

The following are candidate proof obligations, not yet admitted production semantics.

| event | minimum retained proof | explicit non-claim |
|---|---|---|
| `defender_removed` | exact defender→target duty before; exact defender capture; same target survives; target becomes positive legal exchange within horizon | not forced, best or intended |
| `defender_deflected` | exact duty before; same defender relocates under the initiating continuation; duty is lost; same target consequence within horizon | relocation alone is not deflection |
| `overload_consequence` | same defender has ≥2 exact duties; after a named challenge, complete declared replies cannot preserve both; at least one retained target consequence is live | duty count alone is not overload |
| `interference_consequence` | exact slider→target duty/ray before; named piece occupies the between-set; same target consequence within horizon | blocker appearance alone is not a tactic |
| `clearance_consequence` | named friendly blocker vacates an exact slider→target ray; same slider/target relation becomes live and has a bounded consequence | opened squares alone are not clearance |
| `zwischenzug_sequence` | an exact legal recapture existed; the mover plays a different forcing/consequence edge; after the reply, the retained recapture or stronger named consequence remains | no claim that the recapture was expected/best |

`[M]` These contracts compose the already verified exact authorities in
`legal-exchange-prerequisite.md`, `identity-retaining-three-edge-consequences.md` and
`bounded-reply-semantics.md`. Stage 1 must falsify each with canonical positives, hard negatives,
mirror/orientation controls and imported-population prevalence before an RFC may quote it.

## 5. Consumer boundary

- **Post-game Review:** observed identity-retaining sequences can ground factual cards at their
  literal level today; the named motif requires the Stage-1 semantic proof. `[M]`
- **Live post-commit Support:** may use a proved bounded consequence and show a defender/ray/target
  nudge. It may not infer the opponent's intention. `[M]`
- **Pre-commit prevention:** requires evaluating the learner candidate plus the declared reply
  population; an observed sequence cannot predict its own future reply. `[V]`
  (`identity-retaining-three-edge-consequences.md` §5)
- **Drills:** authored/cited lines may supply the semantic authority, while exact operands verify
  that the trigger still holds. `[M]`
- **Bots:** candidate policy may consume the same event ids, but its selection record—not the
  renderer—must say whether the bot saw/ignored them. `[M]`
- **Player habits:** only opportunity-normalized, versioned events with a sample floor may
  aggregate; raw motif counts are exposure. `[V]` (`design/research/player-analysis-and-skills.md`
  §§3–5)

## 6. Stage-1 exact observed-sequence result

The second disposable arm implemented six deliberately narrow line shapes over exact duties,
captured roles/squares, legal exchange and retained identities. Four positive/hard-negative fixture
groups pass: defender removal/relocation/overload are distinct; clearance and interference reject
an unrelated capture; and a check zwischenzug is separated from a merely delayed recapture. `[V]`
(`tools/d872-semantic-tactics-harness/sequence.test.ts`)

| population | triples | defender removed | defender relocated | overload exploited | clearance | interference |
|---|---:|---:|---:|---:|---:|---:|
| authored branch paths | 622 | 0 | 0 | 0 | 0 | 0 |
| sealed imported games | 6,775 | 26 | 13 | 5 | 23 | 3 |

Across 6,667 imported four-edge windows, seven preserve an exact check-zwischenzug shape: a legal
recapture exists, the player gives check elsewhere, the opponent answers, and the same recapturer
then makes a positive legal exchange on the retained capture square. `[V]`
(`tools/d872-semantic-tactics-harness/sequence-output.md`)

The defender-relocation predicate initially over-counted and became an internal falsifier. It
reproduced D772's established 13 only after enforcing three independent boundaries: the defender
was not already positively capturable, the mover-turn clone after the first edge was a legally
constructible position, and the original target survived the initiating edge with the same
color/role. `[V]` (`sequence.test.ts`;
`tools/d772-three-edge-harness/three-edge.test.ts`)

The five overload cases are **exact overload-exploitation sequences under the harness convention**:
one defender held at least two duties; the first target was captured; that defender recaptured on
the first target's square; a different retained target was then positively captured. They are not
an estimate of generic overload prevalence and do not show that the first capture forced the
recapture. `[V]` (`sequence.test.ts`)

This arm changes the implementation boundary:

- factual post-game forms of all six families are computable now as rare multi-edge events;
- the current authored corpus has zero witnesses and therefore cannot validate their learner copy;
- a pre-commit warning or the word “forced” remains unavailable until the complete-reply arm;
- the semantic event must compose lower-level identities rather than ask an LLM to name the line.

`[M]` These are foundation primitives because they feed Support, Review, drills and bots. Their
rarity only prevents default-volume assumptions; it does not demote the capability.

## 7. Stage-2 result: complete-reply survival is a strength modifier, not the tactic floor

The counterfactual arm detects exact defender-removal, clearance and interference **initiations**
on a played edge, enumerates every legal opponent reply, and asks whether the same retained target
is still positively capturable after every reply. A positive and a refutable canonical target pass.
`[V]` (`tools/d872-semantic-tactics-harness/counterfactual.test.ts`)

| population | family | initiating rows / witnesses | all-reply rows / witnesses |
|---|---|---:|---:|
| authored played edges | defender removed | 46 / 66 | **0 / 0** |
| authored played edges | clearance | 24 / 26 | **0 / 0** |
| authored played edges | interference | 0 / 0 | **0 / 0** |
| imported played edges | defender removed | 87 / 138 | **1 / 1** |
| imported played edges | clearance | 42 / 42 | **0 / 0** |
| imported played edges | interference | 3 / 3 | **0 / 0** |

`[V]` The sole imported all-reply witness is pinned in
`tools/d872-semantic-tactics-harness/counterfactual-output.md`.

This refutes **all-reply survival as a universal admission requirement for the basic semantic
name**. It would suppress every authored initiation and virtually the entire imported population.
That is the same error as requiring `fork_survives_reply@1` before saying an exact meaningful
double attack occurred. `[M]`

Instead, the semantic contract has two independent levels:

1. **Exact event:** the named relation and identities hold—e.g. this move captured a defender and
   removed its duty; this move vacated the only blocker on a named slider→target ray; this move
   entered the between-set and broke the named defence. This can ground factual post-commit and
   Review language without asserting inevitability.
2. **Reply-qualified consequence:** the exact target remains available under some/all declared
   replies. This earns stronger words such as persistent or unavoidable at that horizon and will be
   rare.

`[M]` Pre-commit Support can evaluate the candidate and display the exact relation at level 1
without giving a move or promising success. It may add level 2 only when the counterfactual
predicate holds. The module—not the collector—chooses whether that amount of information is allowed.

## 8. King/promotion arm: exact next-move facts are sparse and useful

The third rules arm separates:

- **mate on the mover's next turn after every legal reply**—an exhaustive two-edge consequence;
- **same-pawn promotion available under the disclosed pass convention**;
- **same-pawn promotion still legal after every opponent reply**.

A `mateIn2`-tagged Lichess record supplies the mate positive; a synthetic seventh-rank pawn pair
separates persistent promotion from a pawn the opponent can remove. `[V]`
(`tools/d872-semantic-tactics-harness/king-promotion.test.ts`; official puzzle id `000Zo` in the
bounded source prefix)

| population | played edges | mate next after every reply | seventh-rank pawn | promotion under pass | promotion after every reply |
|---|---:|---:|---:|---:|---:|
| authored | 754 | 4 | 17 | 13 | **1** |
| imported fixed sample | 579 | 0 | 2 | 1 | **0** |

All 13 authored pass-convention promotion rows are quiet, while only one is reply-persistent. The
sole persistent example is `pawn-breakthrough-convert/w-a7:a6a7`; the four mate examples come from
the authored mating-technique families. `[V]`
(`tools/d872-semantic-tactics-harness/king-promotion-output.md`)

The product contract mirrors Stage 2:

1. **promotion availability** may say the named pawn can promote next under the disclosed pass
   convention and show its path/blockers;
2. **reply-persistent promotion** may say every legal reply leaves that promotion;
3. **promotion race/outcome** remains tablebase authority in-domain and requires bounded
   engine/search outside it;
4. **mate-next** is exact at its two-edge horizon; a broader “mating net” needs a versioned deeper
   proof tree and must not be inferred from king-zone or escape counts.

`[M]` This result offers an evidence-backed repair for D832: `promotion_pressure@1` should retain
the exact availability and all-reply flags instead of exposing an underspecified
`rule-of-the-square verdict` as if it were an outcome. Distance, blockers and control balance remain
descriptive operands; Syzygy remains the outcome authority.

## 9. External disagreement: one near-identity and three semantic splits

Every row carrying one of seven source themes was evaluated, plus a deterministic 1/20 sample of
rows without each theme. The puzzle solution's side-to-move parity was preserved: defender/line
events begin on solver moves, while intermezzo begins with the interrupted opponent capture. All
selected lines parsed legally. `[V]`
(`tools/d872-semantic-tactics-harness/agreement.test.ts`;
`tools/d872-semantic-tactics-harness/agreement-output.md`)

| source theme | tagged | exact event also found | tag sensitivity | tag-negative controls | exact event in controls |
|---|---:|---:|---:|---:|---:|
| `capturingDefender` | 1,642 | 1,638 | **99.8%** | 12,442 | 283 (2.3%) |
| `deflection` → defender relocation hypothesis | 10,915 | 494 | **4.5%** | 11,989 | 150 (1.3%) |
| `attraction` → defender relocation hypothesis | 9,088 | 47 | **0.5%** | 12,094 | 171 (1.4%) |
| `clearance` → ray-vacating capture hypothesis | 3,352 | 36 | **1.1%** | 12,365 | 478 (3.9%) |
| `interference` | 928 | 345 | **37.2%** | 12,484 | 8 (0.1%) |
| `intermezzo` → check-zwischenzug subset | 2,891 | 1,980 | **68.5%** | 12,387 | 70 (0.6%) |
| `overloading` | 0 | 0 | n/a | 12,530 | 211 (1.7%) |

These are disagreement measures, not precision/recall against chess truth. The Lichess source tags
are generated heuristics and vote-refined labels; the control is a fixed sample, not a fully
adjudicated negative set. `[V]`
([upstream tagger](https://github.com/ornicar/lichess-puzzler/blob/master/tagger/cook.py);
fetched-file SHA-256 `b21a0d179b710742010dde07e806eda0ecea0514412af9f5a1d04d053bc9859d`;
`tools/d872-semantic-tactics-harness/README.md`)

Three conclusions are strong enough to constrain the RFC:

1. **Exact defender removal is the ready anchor.** Near-complete tag sensitivity plus a low
   tag-negative control rate supports the retained-duty definition without making the source an
   oracle.
2. **Exact interference and check-zwischenzug are conservative subsets.** Their lower sensitivity
   is expected: interference retains a specific duty/target and zwischenzug currently requires
   check, while the source tags broader families. Their .1%/.6% control rates make them useful exact
   facts rather than reasons to broaden the detector.
3. **The proposed aliases are refuted.** Defender relocation must not be emitted as generic
   `deflection` or `attraction`; those need separate exact contracts. The measured ray-vacating
   capture must not monopolize `clearance`: upstream clearance follows a vacated-square/ray-piece
   sequence, while this event follows a vacated blocker→opened ray→captured target. Register
   unambiguous event names (for example `defender_duty_relocated@1` and
   `line_blocker_vacated_capture@1`) and research any broader tactic separately. `[M]`

Overload retains no external-positive oracle because upstream returns false for every puzzle. Its
exact two-duty/exploitation fixture and observed corpus witnesses remain the authority until a
separately cited labelled set exists. `[V]` (same upstream tagger, `overloading()`)

The split contracts were then implemented as research predicates with canonical hard negatives and
re-run over the identical external population. `[V]`
(`tools/d872-semantic-tactics-harness/semantic-splits.ts`;
`tools/d872-semantic-tactics-harness/semantic-splits.test.ts`)

| source family | separately retained exact event | tag sensitivity | tag-negative control firing |
|---|---|---:|---:|
| `deflection` | defender had exact duty; bait capture/check displaced it; retained target then captured | **93.0%** | 371/11,989 (3.1%) |
| `attraction` | king/queen/rook captured bait onto square; king then checked or queen/rook later captured there | **99.9%** | 6/12,094 (0.05%) |
| `clearance` | exact square vacated; later same-side slider moves to/through it | **98.3%** | 331/12,365 (2.7%) |

The attraction correction demonstrates why the negative arm is mandatory. Its first exact-looking
form—any piece captures bait and is then attacked—reached 100% of tags but also fired on **19.0%**
of negative controls. Retaining the source family's heavy-piece role and consequence cut that to
six controls without sacrificing material sensitivity. A recall-only gate would have admitted the
noisy form. `[V]` (`tools/d872-semantic-tactics-harness/agreement-output.md`)

These three families now clear the research gate as distinct observed events. Their names do not
assert best play, intent or force. A later complete-reply projection may add “forced” or
“unavoidable”; it is not a prerequisite for naming what the committed sequence did. `[M]`

## 10. Bounded mating nets are exact through four; `mateIn5` is a capped bucket

A legal-tree solver fixes the exported candidate first move, treats later attacker moves as
existential, enumerates **every** defender reply, and returns proved/refuted/budget-exhausted at a
250,000-node cap. Adjacent deeper tags are the negative control: a mate-in-3 record must not prove
within two, and a mate-in-4 must not prove within three. Promotions are fully enumerated. `[V]`
(`tools/d872-semantic-tactics-harness/bounded-mate.test.ts`)

| arm | proved | refuted | cap abstention | proof nodes median / p90 / max |
|---|---:|---:|---:|---:|
| mate-in-2 positives | **240/240** | 0 | 0 | 3 / 8 / 18 |
| mate-in-3 tested at depth 2 | **0/240** | 240 | 0 | 36 / 46 / 204 |
| mate-in-3 positives | **240/240** | 0 | 0 | 32 / 118 / 3,032 |
| mate-in-4 tested at depth 3 | **0/240** | 240 | 0 | 906 / 1,783 / 3,317 |
| mate-in-4 positives | **120/120** | 0 | 0 | 635 / 4,716 / 87,255 |
| `mateIn5` tested at depth 4 | **0/120** | 120 | 0 | 15,284 / 39,084 / 88,912 |
| `mateIn5` tested at depth 5 | 19/24 | 2 | 3 | 19,191 / 178,345 / 250,001 |

`[V]` (`tools/d872-semantic-tactics-harness/bounded-mate-output.md`; deterministic hash samples
from the bounded official prefix)

The last row is not a detector defect. Upstream computes `moves_to_mate = len(mainline) // 2`,
emits exact tags for one through four, and returns `mateIn5` for **every remaining depth**. The two
refuted witnesses are source lines longer than five attacker moves; the three cap witnesses sit at
the declared computation boundary. `[V]`
([upstream `mate_in`](https://github.com/ornicar/lichess-puzzler/blob/master/tagger/cook.py);
fetched-file SHA-256 `b21a0d179b710742010dde07e806eda0ecea0514412af9f5a1d04d053bc9859d`)

The production contract handed to a Wave-C collector RFC is therefore:

- `forced_mate_after_move@1` proves a declared candidate within **1–4 attacker moves** by complete
  legal-tree enumeration;
- payload retains candidate, attacker, maximum moves, root check/reply breadth, proof horizon and a
  proof-tree digest/count; refutation retains at least one legal escaping branch;
- node/time exhaustion is `budget_exhausted`, never false and never an engine-derived guess;
- five-plus may use a separately declared offline budget or typed engine mate authority, but the
  external `mateIn5` string is not exact evidence;
- “mating net” is presentation vocabulary over a proved bounded tree. King-zone pressure, reduced
  escapes and a sequence of checks remain useful operands but cannot emit the name.

This is a basic Review/Support primitive with workflow-priced computation, not an optional advanced
concept. Pre-commit delivery still obeys the module answer-distance ceiling; proving a candidate
does not authorize showing its move. `[M]`

## 11. Promotion geometry cannot grade a race; Syzygy joins it

The repository's 12 Syzygy evidence sidecars contain 288 unique FENs after exact de-duplication.
The research join recomputes current-side pawn identity, seventh-rank state, legal promotion and
unblocked forward distance from each FEN, then compares the descriptive geometry with the recorded
tablebase category. `[V]`
(`tools/d872-semantic-tactics-harness/promotion-race-tablebase.test.ts`;
`tools/d872-semantic-tactics-harness/promotion-race-tablebase-output.md`)

| population/fact | result |
|---|---:|
| pawn-bearing unique tablebase FENs | 157 |
| kings-and-pawns-only | 49 |
| side-to-move seventh-rank pawn | 23: **11 win / 1 draw / 11 loss** |
| immediate legal promotion | 3: **2 win / 1 draw / 0 loss** |
| two-sided unblocked geometric race | 10 |
| naive stride/turn ordering agrees with Syzygy | **7/10 (70.0%)** |
| worst direction error | 2 geometric losses are exact Syzygy wins |

The geometric baseline is deliberately stronger than a raw distance count: it uses exact side to
move, occupied forward paths and the initial two-square push. It is still not outcome because it
omits control, captures, checks, king access and what each promotion does. Those omitted relations
are not edge cases—the baseline gets the outcome backwards on two of ten recorded races. `[V]`
(same output; first disagreement FENs and evidence files are retained there)

This closes D832's `ruleOfSquareVerdict` question by refusal. The versioned foundation should carry:

- `promotion_geometry@1`: exact named pawn, distance, forward path/blockers, control operands,
  side to move, pass-convention availability and complete-one-reply persistence;
- `promotion_race_geometry@1`: two or more named pawns with each exact arrival convention and
  ordering, explicitly **descriptive** and never `winning`/`losing`;
- `promotion_race_tablebase@1`: the same named participants joined to Syzygy category and available
  DTZ/precise-DTZ when the position is in range;
- `outside_tablebase_domain` / provider failure as outcome abstention while geometry remains.

Immediate promotion, promotion first and promotion with check/mate can be exact additional events;
none inherits a whole-position result without the joined authority. This lets Support say “both
pawns are racing” or reveal distance at the permitted answer level, while Review may add “Syzygy:
draw” and a bot may weight the exact tablebase moves. `[M]`

## 12. Next research

1. Carry the separately named attraction/deflection/square-clearance contracts into the Wave-C
   collector RFC alongside, not instead of, retained-duty relocation and line-blocker clearance.
2. Add a reply-qualified overload form separately from the observed five-case convention; do not
   make it the basic label's floor.
3. Carry exact mate-through-four into the collector RFC and measure typed engine-mate agreement as
   a separate C4 authority; do not call king-zone deltas a mating net.
4. Carry the split promotion geometry/tablebase join into the collector RFC; do not recreate a
   geometric winner field under another name.
5. Admit, narrow or refuse every family independently; then update the Wave-C consumer matrix.

No production detector, learner sentence, content edit or RFC is authorized by this Stage-0 result.
