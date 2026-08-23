# Non-Maia selector model family — what is materially different after D1297/D1312?

**Question:** after a proper conditional-logit evidence head and its fixed 250-cp guarded
composition both fail their preregistered development gates, is there a technically distinct
model family worth researching, or does “try a bigger model” merely spend the untouched population
on a third post-hoc retry?

**Feeds:** [[D1271]], [[D1320]], [[D1328]], `rfc/evidence-move-selector.md`, F8, H5/C5

**Method:** primary-source architecture survey plus a re-read of the committed D1162/D1297/D1312
measurements. No new population was opened, no model was fitted, and no production implementation
is licensed by this dossier.

## Verdict

There is one materially different evidence-originated family worth keeping: a **set-dependent
choice model** whose score for one legal move depends on the other legal moves available in that
position. D1297's conditional logit cannot represent that interaction: after projection, each
candidate receives an independent linear utility and the softmax only normalizes those utilities.
Set-dependent aggregation was designed for choice problems where alternatives interact, while set
architectures give the required permutation symmetry over a variable-size legal set `[V]`
([Rosenfeld, Oshiba & Singer 2020](https://proceedings.mlr.press/v119/rosenfeld20a.html),
[Lee et al. 2019](https://proceedings.mlr.press/v97/lee19d.html)).

That is an **architecture admission, not a training authorization**. Current successful human-policy
comparators are full neural training programmes, not small heads over a few hundred choices. Otter
reports 6.1 billion positions from 117 million rapid games; Maia-3 is a released transformer family
whose chess-specific architecture reports 57.1% move match `[P]`
([Otter](https://arxiv.org/abs/2608.05206),
[Chessformer/Maia-3](https://arxiv.org/abs/2605.19091)). Tabiya's exposed development population is
515 decisions. It can falsify a compact model and verify plumbing; it cannot support a credible
claim that a higher-capacity interaction model learned human choice.

**Therefore the next bounded generation is data readiness, not model fitting.** Freeze a compact,
registered evidence projection contract; price a reproducible human-choice training corpus by
rating, time control, phase and ruleset; measure feature-production throughput; and publish a
learning curve before choosing a sample floor. The reserved third D1297 population remains sealed.
After that census, the owner/RFC fork is honest: fund the new training programme, defer it beyond
1.0 while shipping the measured Maia-3 roster, or refuse the non-Maia 1.0 goal. Research does not
choose among those product outcomes ([[D1320]]).

## 1. What the failed family could and could not express

The D1297 repair assigns candidate (i) a utility from that candidate's fixed evidence vector and
engine loss, then applies one position-level softmax. Its virtue is statistical efficiency and a
proper log-loss objective. Its hard limit is that the utility of `Nf3` is unchanged when a legal
alternative appears or disappears unless that change also changes `Nf3`'s own projected features
`[V]` (`planning/platform-alignment/bot-policy/d1297-proper-score-repair-plan.md` §§Proper
conditional-choice fit, Development measures).

Chess choices are legal sets, not independent binary labels. The meaning of a feature such as
“creates a passed pawn”, “preserves castling”, “allows a forcing reply”, or “continues the route”
depends partly on what the other legal candidates offer. Set-dependent aggregation explicitly
models choice using both an alternative and an aggregation of its choice set; its authors motivate
the family as a balance between expressive choice patterns and statistical efficiency `[V]`
([paper abstract and PDF](https://proceedings.mlr.press/v119/rosenfeld20a.html)). A Set Transformer
is a more general interaction encoder over unordered instances and may reduce attention cost from
quadratic to linear using inducing points `[V]`
([PMLR](https://proceedings.mlr.press/v97/lee19d.html)).

This distinction is architectural and able to fail:

| Family | Candidate score sees | D1297/D1312 result | Disposition |
|---|---|---|---|
| diagonal / independent feature weight | one flattened feature at a time | non-proper gate hid CE 6.451 | refused |
| conditional logit | one candidate's projected vector | proper loss; unstable safety/guard gates | refused |
| set-dependent aggregation | candidate vector **and aggregate of the legal set** | never built or measured | research-admissible |
| full set attention | pairwise interactions across legal candidates | never built or measured; highest capacity | no first experiment until data readiness |

Adding hidden layers to the same per-candidate input is **not** sufficient to earn a new generation.
It adds capacity but not choice-set dependence. Relaxing the 250-cp boundary, changing the exposed
folds, or recursively flattening more leaves are also retries of the refused mechanism, not new
families.

## 2. The chess field says data and context matter more than a clever small head

The strongest current human-policy systems do not support the premise that 515 decisions plus a
larger local head is enough:

- Maia-3 uses an encoder-only chess transformer with board-square tokens, geometric attention bias
  and a source-destination policy head. The official implementation releases 5M, 23M and 79M
  checkpoints and conditions its UCI policy on player/opponent Elo, sampling parameters and optional
  history `[V]` ([paper](https://arxiv.org/abs/2605.19091),
  [official repository](https://github.com/CSSLab/maia3)). Tabiya already pins and serves its 5M
  family; “use Chessformer” is not a non-Maia alternative (R42/R52).
- Otter reports that its last-20-move history encoder and clock conditioning improve human move
  prediction; its 15.3M model was trained on 6.1 billion positions and reports 55.23% top-1 / 90.95%
  top-5 accuracy `[P]` ([preprint](https://arxiv.org/abs/2608.05206)). Those results remain
  unreproduced here, as R51 already records.
- ChessMimic likewise conditions small per-rating transformers on recent history and clock state,
  and reports held-out move, time and outcome results `[P]`
  ([preprint](https://arxiv.org/abs/2606.04473)). It strengthens the case for declared context
  inputs; it is not evidence that Tabiya should copy its per-band training scheme.
- Allie models move sequences, pondering time and resignation and then adds time-adaptive search;
  its online study reports a mean 49-Elo gap against opponents from 1000–2600 `[P]`
  ([paper](https://arxiv.org/abs/2410.03893)). This is evidence that human-shaped play is a
  multi-input, sequence-level claim—not that any one-ply move-match model is sufficient.

These sources do **not** prove a set-dependent evidence model will beat Maia-3. They show why the
next evidence-originated attempt is a model-training programme with declared population and context,
not an implementation task attached to the present 515-row experiment.

## 3. The model contract owed before any corpus is opened

A future experiment must freeze all seven clauses before sampling its training population:

1. **Registered compact projections.** Each evidence producer exports an explicitly versioned,
   bounded model projection. Generic recursive payload flattening is forbidden: D1299 measured that
   producer verbosity gave the largest five projections 43.5% of the 2,516-name plane.
2. **Set equivariance.** Reordering legal moves may only reorder their output probabilities. No
   input or output depends on generator order, SAN order or UCI lexical order.
3. **Full legal-set closure.** Every legal move enters exactly once. Missing candidates are an
   instrument failure, never synthesized probability mass.
4. **Proper objective.** Training and selection use position-level negative log likelihood (or an
   equivalently declared proper scoring rule). Top-1 and mean played-move probability are secondary.
5. **Context is declared, not smuggled in.** Rating, clock, time control, move history, phase,
   ruleset and opening identity are separate versioned inputs. An absent input is recorded as absent.
6. **Policy and safety stay separable.** The base policy is evaluated before and after any engine
   guard against identical-mask controls; excluded observed moves remain explicit adverse events.
7. **No explanation laundering.** Attention, coefficients and selected features are not causal
   explanations. Review may state only the exact registered evidence that accompanied the selected
   candidate. It may not say the bot chose a move *because* of a learned weight.

For variants, the training population must be declared separately by ruleset. Code portability is
not human-policy validity: a model that can encode a Chess960 or Atomic board but has only orthodox
human games may offer an **engine-shaped, uncalibrated** policy, never a human-shaped label. This
keeps D1293's Fairy-Stockfish ruling and D1271's longer-term variant-portable goal distinct.

## 4. Bounded next generation: data-readiness census

The next research instrument may inspect corpus metadata and pipeline cost, but it may not fit a
selector or inspect the reserved third population's move labels. It must answer:

1. What licensed, reproducible source can supply independent human decisions with game identity,
   rating, time control, clock (if available), full history and ruleset?
2. After exact deduplication by game and position, how many decisions remain in each declared
   rating × speed × phase × ruleset cell?
3. What fraction has a complete legal set and every mandatory registered projection? Missingness is
   reported per producer; no zero-fill may convert absence into a feature value.
4. At measured throughput, what wall time and storage do 10k, 100k and 1m decisions cost? Report
   current generic projection and proposed compact projection separately.
5. Does a game-grouped learning curve still improve out-of-game log loss from 10k→100k→1m? The
   curve chooses the sample floor; this dossier does not invent one.
6. Can standard chess be funded while variant cells remain honestly empty? A zero-cell answer is a
   valid refusal of the variant human-policy claim, not permission to pool rulesets.

Only if that census passes may a preregistered pilot compare conditional logit against one compact
set-dependent model. The untouched D1297 population then remains a final confirmatory set; it is not
used for architecture choice, encoder choice, regularization or guard thresholds.

## 5. Consequence for 1.0

The evidence foundation remains mandatory for Support, Review, drills, pack authoring, analysis and
longitudinal style—even if no evidence-originated bot ships in 1.0. D1162 proves the representation
carries human-choice signal; D1297/D1312 say the two small selectors did not convert that signal into
a stable base policy. Those are compatible findings.

For standard chess, the already-integrated and measured Maia-3 roster remains the only production
base with a human-policy claim. Evidence can safely curate candidates, implement declared traits,
record route progress, and explain exact observed facts after selection; it cannot inherit the word
“human” merely by influencing a move. For Tier-2 variants, Fairy-Stockfish provides honest engine
play under D1293 while a separately trained human-policy population is absent.

The RFC must now present a priced owner fork rather than silently mark the goal done or dead:

- **Defer the new training programme beyond 1.0** and ship Maia-3 standard / disclosed engine
  variants. This is the lowest-risk 1.0 posture.
- **Fund the data-readiness census now**, then decide whether its measured corpus and compute cost
  justify a set-dependent pilot.
- **Refuse the non-Maia human-policy goal for 1.0** explicitly. This closes D1271 only by owner
  ruling, not by citing the failed small models.

## Limits

- This is desk research plus synthesis over committed measurements. No external paper result was
  reproduced.
- Set-dependent aggregation and Set Transformer were not evaluated on chess in the cited papers.
  Their relevance is the variable-set choice structure; effectiveness here is unknown.
- Reported Maia-3, Otter, ChessMimic and Allie metrics use different populations and tasks and are
  not a leaderboard comparison.
- No training-data sample floor is asserted. It must come from the learning curve in §4.
- This dossier does not amend `rfc/evidence-move-selector.md` or protected design intent.
