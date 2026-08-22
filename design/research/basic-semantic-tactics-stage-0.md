# Basic semantic tactics — Stage 0 population and proof boundary

**Question:** Are overload, defender removal/deflection, interference, clearance, zwischenzug,
mating patterns and promotion threats optional “deep” analysis, or missing basic classifier
foundation—and what evidence horizon do they require?

**Status:** partial `[V]`; external population/upstream tagger audited and exact observed-sequence
prerequisites measured; complete-reply/counterfactual semantics remain Stage 2.  
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

## 7. Next research

1. Compare the five externally represented observed families against Lichess as disagreement, reporting
   precision/recall only as agreement metrics.
2. Build overload's complete-reply form from cited canonical positions and synthetic controls;
   report it separately from the observed five-case convention.
3. Implement and price complete-reply/counterfactual variants for live Support.
4. Add mating-pattern and promotion-consequence arms; do not fold them into defender/line labels.
5. Admit, narrow or refuse every family independently; then update the Wave-C consumer matrix.

No production detector, learner sentence, content edit or RFC is authorized by this Stage-0 result.
