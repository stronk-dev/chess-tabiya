# Bot policy is a stack, not a personality slider

**Question:** platform-alignment R11 — which bot-policy layers can change a declared behavior
without destroying the human-policy signal or silently moving strength?

**Status:** mechanical and desk arms answered `[V]`; owner blind use remains under D649. Recruited
participant review is out of scope, so no population-level human-likeness claim is made.

## Verdict

Tabiya has a credible human-move **base model**, not yet a bot-personality system. The mechanical
experiment supports a layered contract:

1. a replaceable, history/time-capability-declared human-policy model;
2. its actual sampling profile, distinct from its raw display probabilities;
3. a bounded implausible-error guard;
4. an opening repertoire policy;
5. a small, mechanically named trait transform;
6. optional memory across games;
7. a separately measured presentation persona.

The first three can be evaluated mechanically. The remaining layers need game-length and/or human
evaluation. An avatar, biography or chat voice is not evidence that the move policy has a
personality.

On 837 position-band cells, reconstructing the shipped Maia temperature/top-p sampler predicts
**19.84 cp** mean depth-12 loss and **0.39%** mass at ≥250 cp loss; the one captured production
sample measures **19.57 cp** and **0.36%**. The agreement is the control the first run lacked.
The raw Maia probability vector instead predicts **59.13 cp** and **1.20%**: it is a useful model
output, but it is not the distribution the current bot plays. `[V]`

A 250 cp guard over the reconstructed production sampler removes all measured ≥250 cp mass,
strengthens the distribution by only **1.27 cp**, and retains **100.2%** of its explorer-match
proxy. A four-times pawn-move reweighting changes pawn-move rate by **+11.97 percentage points**
while shifting expected loss by **−1.01 cp** and retaining **98.8%** of explorer match. Both pass
their predeclared mechanical gates. Capture/check ×3 and quiet-move ×3 change their named rates by
only **+3.02 pp** and **+2.24 pp**, so both fail. `[V]`

These are distribution facts, not findings that a guarded or pawn-biased bot feels human, plans
coherently or is fun. H5 and C5 therefore remain unmet as population claims; their former external
review arm is not a blocker to the narrower policy-architecture decision.

## 1. What competitors actually document

Chessiverse describes the useful architecture more narrowly than its “personality” language first
suggests. Its neural net produces candidates; a “Move Curator” filters suspicious moves and uses a
stronger engine to consider them; an extreme example strongly discourages non-pawn moves. It also
gives bots human-derived opening repertoires and offers statistical-opening bots that follow rating-
conditioned human frequencies. `[V]` [Chessiverse, *How Chessiverse bots are created*](https://chessiverse.com/articles/how-chessiverse-bots-are-created)

Its Guardian→Savage play styles are mainly **classified after generation**: the vendor says it
currently does little to steer those traits and instead measures thousands of games. Its proposed
repeat-loss repertoire adaptation is explicitly future work, not a shipped mechanism. This matters:
output classification, controlled policy transformation and marketing persona are three different
contracts. `[V]` [same source](https://chessiverse.com/articles/how-chessiverse-bots-are-created)

The same article reports a perceptual asymmetry: users may call a bot's one-move piece drop
inhuman even when similarly rated people make large errors. Its stated response is to prefer errors
with a mitigating tactical circumstance. This is vendor experience, not a validated threshold, but
it demonstrates why population frequency plus centipawn loss cannot complete a human-likeness
claim. `[P]` [same source](https://chessiverse.com/articles/how-chessiverse-bots-are-created)

Otter is a 2026 preprint, not yet a replacement recommendation. Within its own ablation it reports
**+5.24 pp** top-1 accuracy from a 20-move history encoder over its position-only baseline and a
further **+2.38 pp** from time-control/clock conditioning. It reports 55.23% top-1 and 90.95% top-5
overall. Cross-model superiority claims are only `[P]` here because this pass did not reproduce the
training or control the test populations, but the ablation is sufficient evidence that history and
time belong in the **base-model capability contract**, not in a hand-written persona filter. `[P]`
[Otter paper §§1, 5.4](https://arxiv.org/html/2608.05206v1)

## 2. What Tabiya actually ships

`human_common` is Maia-3 at a requested Elo with optional temperature and top-p. The server always
sends the full move history, and the container starts Maia with `--use-uci-history`.
`design/research/maia-wdl-versus-human-outcome.md` §9.1 already measured this capability: for the
same 279 positions, history-conditioned and bare-FEN probes agreed exactly on only 281 of 5,222
shared move values, with median absolute difference 29 cp. Maia in Tabiya is therefore **not
position-only**. `[V]` `apps/server/src/opponent-selector.ts:221-243,510-547`;
`workers/maia/Dockerfile:31-32`; `design/research/maia-wdl-versus-human-outcome.md` §9.1.

The production selector has no repertoire identity, trait policy, error-shape guard, clock input,
cross-game memory or bot profile. Its policy request admits `targetElo`, `temperature` and `topP`;
the other executable modes are strong engine, authored-spine restriction and two tablebase modes.
`seed` is recorded/cached but Maia's internal sampler has no per-request seed. `[V]`
`apps/server/src/opponent-selector.ts:123-172,490-610`; `docs/engine-workers.md:168-193`.

That is a strong foundation: history-conditioned human policy, exact engine identity, recorded
selection and replay-by-readback already exist. It is not a personality system merely because
temperature and Elo can be changed.

## 3. Predeclared population and transforms

The disposable harness reuses the exact captures behind
`design/research/maia-wdl-versus-human-outcome.md` rather than introducing another source
population `[V]`:

- 279 corpus positions at plies 0–20;
- three bands, 1400/1600/1800, for 837 equally weighted cells;
- production-shape Maia-3 MultiPV-20 policy and WDL;
- Lichess explorer move/outcome counts at the same bands;
- Stockfish depth-12 scores for every legal move;
- SAN→UCI mapping verified with chessops.

The input digests are recorded in
`planning/platform-alignment/bot-policy/results.json`. Explorer match is the dot product between an
arm and recorded move frequency divided by the full position total; unlisted moves receive zero
rather than redistributed mass. Stockfish loss is a fixed-depth strength proxy, not a move grade.
Every transform is pure arithmetic over the captured rows.

The plan fixed a 250 cp guard, pawn ×4, forcing ×3, quiet ×3, repeat ×0.25, a listed human opening
book through ply 12 and sensitivity grids before reading the results. Carry-forward required a
10-point declared-trait change, ≤35 cp expected-loss shift, ≤1-point rise in ≥250 cp mass and ≥90%
relative explorer-match retention. `planning/platform-alignment/bot-policy/plan.md` contains the
complete declarations and refusals. `[V]`

## 4. Instrument correction: raw policy is not played policy

The first run was discarded. It treated Maia's emitted `policy` field as the sampling distribution.
Inspection of the pinned engine showed that `policy` is raw legal-masked softmax, while `bestmove`
is sampled from logits divided by temperature and then top-p truncated. The production defaults are
temperature 0.8 and top-p 0.92. `[V]`
[pinned Maia source](https://github.com/CSSLab/maia3/blob/1e13597c42d4858b7cfd7cfdae01e297263364b2/maia3/uci.py);
`design/research/maia-policy-scalar-stability.md` §4;
`apps/server/src/opponent-selector.ts:74-75,510-547`.

The repaired arm reconstructs `softmax(logits / 0.8)` from raw probability using
`p^(1/0.8)`, applies the pinned source's cumulative `<= 0.92` rule while forcing top-1, and
renormalizes. All wrappers now start from this `production_sampler`; raw policy remains a named
diagnostic.

The reconstruction operates on the returned MultiPV-20 window, not Maia's complete internal move
vector. On the same pinned image, prior measurement found median returned raw mass 0.999625 and
minimum 0.979540; temperature below one further suppresses omitted low-probability moves. This is a
bounded mechanical screen. Production implementation must transform inside the full-vector model
adapter, not reinterpret a truncated display payload. `[V]`
`design/research/maia-policy-scalar-stability.md` §§3-4.

The repair has a strong positive control: the reconstructed distribution and the captured
production samples agree to 0.27 cp expected loss and 0.03 percentage points of severe-loss mass.
The raw vector differs by 39.29 cp and 0.81 points. `[V]`

## 5. Mechanical results

| Arm | SF loss cp | ≥250 cp | explorer match | pawn | forcing | effective moves | repeat |
|---|---:|---:|---:|---:|---:|---:|---:|
| captured production sample | 19.57 | 0.36% | 31.80% | 33.69% | 20.43% | 1.00 | 100.0% |
| raw Maia policy | 59.13 | 1.20% | 25.64% | 34.27% | 20.59% | 4.73 | 41.1% |
| reconstructed production sampler | 19.84 | 0.39% | 31.23% | 32.76% | 21.65% | 2.43 | 62.2% |
| Maia argmax | 15.01 | 0.36% | 35.39% | 33.33% | 20.67% | 1.00 | 100.0% |
| 250 cp guard | 18.56 | 0.00% | 31.29% | 32.92% | 21.50% | 2.41 | 62.6% |
| pawn ×4 after guard | 18.83 | 0.00% | 30.85% | 44.89% | 22.44% | 2.30 | 64.9% |
| forcing ×3 after guard | 19.13 | 0.00% | 31.02% | 33.72% | 24.51% | 2.39 | 62.8% |
| quiet ×3 after guard | 18.31 | 0.00% | 31.29% | 32.41% | 19.26% | 2.39 | 63.1% |
| listed human book | 42.08 | 0.36% | 29.86% | 35.99% | 21.26% | 3.56 | 50.1% |
| book through ply 12, then guard | 41.17 | 0.30% | 29.00% | 34.71% | 21.37% | 3.23 | 53.5% |
| repeat ×0.25 | 22.02 | 0.57% | 29.14% | 32.67% | 21.91% | 2.72 | 46.4% |

`[V]` `planning/platform-alignment/bot-policy/results.json` and `results.md`.

### Gate outcomes

- **Guard 250 passes.** It removes 100% of measured severe mass, changes expected loss by
  −1.27 cp and retains 100.2% explorer match.
- **Pawn ×4 passes mechanically.** Pawn rate rises 11.97 pp, expected loss shifts −1.01 cp,
  severe mass falls 0.39 pp and explorer match retention is 98.8%.
- **Forcing ×3 and quiet ×3 fail their named-trait gate.** Their changes are only +3.02 and
  +2.24 pp. The ×8 forcing sensitivity reaches +5.94 pp relative to the guard in the corrected
  run, still below 10 pp; no post-hoc multiplier is promoted.
- **Repeat suppression is not a personality result.** It reduces same-policy repeat probability
  by 25.5%, shifts loss +2.18 cp and retains 93.3% explorer match, but the experiment models two
  draws at the same position, not memory over a game or repertoire adaptation after a loss.
- **The listed book is not a repertoire persona.** It is population frequency normalized at one
  position. Its greater entropy and different strength proxy make an opening-policy boundary
  visible; they do not establish coherent recurring choices.

## 6. What may proceed, and what is refused

The mechanical result supports carrying three **candidate interfaces** into owner/design work:

- `HumanPolicyModel`: model identity, supported rating range, history window, time/clock inputs,
  complete move distribution and value provenance;
- `MovePolicyLayer`: declared input facts, output transform, expected strength delta, trait metric,
  abstention/fallback and version;
- `RepertoirePolicy`: named immutable repertoire or population source, position/transposition key,
  adherence/deviation rule and cross-game memory scope.

It also supports an explicit distinction between `observedTraits` computed from games and
`controlledTraits` promised by a policy. Chessiverse's Guardian→Savage measurement belongs to the
first; this pass's pawn transform is evidence for the second, but only at one-move resolution.

The following remain refused from an RFC unless later owner use or a separately authorised
experiment supplies the missing evidence:

- “human-like,” “coherent,” “aggressive,” “solid,” “tricky” or similar product claims from these
  numbers alone;
- a prose/chat persona presented as move-policy personality;
- a hidden Stockfish guard without disclosure and re-calibration;
- a complete persona repertoire inferred from explorer counts;
- clock-pressure behavior without a model/data source that accepts clock state;
- a cross-game memory feature evaluated as same-position repeat arithmetic.

## 7. Retained owner-use instrument for H5/C5

D649 descopes recruited reviewers and keeps validation-by-owner-use. The prepared blinded
10–20-ply arm is therefore retained as an owner-use instrument, not an R11 completion blocker:

1. generate matched continuations from the same stratified starts under raw production Maia,
   guarded Maia, one mechanically retained trait arm, authored repertoire+guard, listed statistical
   book+guard and weakened Stockfish control;
2. swap colors and use recorded policy identities/seeds; separate openings, middlegames and reduced
   material because Maia's band transfer is material-dependent;
3. show reviewers board replay only, never bot name, avatar, chat or policy label;
4. score plan continuity, tactical sanity, objective relevance, repetition and human plausibility
   separately; collect the exact ply that breaks coherence;
5. report strength/outcome, latency, failure and trait expression from instruments, never reviewer
   intuition;
6. keep the declared ≥80% threshold as the boundary for any future population-level C5 claim;
   owner use may reject a profile but cannot clear that population claim.

The protocol already produced reviewable PGNs and a blind key. A single owner session can validate
or reject the proposed 1.0 roster by use, but cannot establish a population claim.

## 8. Blind-set preparation result

The preregistered generator produced 54 legal 12-ply branches over six fixed roots and three
strata. An offline validator replayed every UCI move, reproduced every SAN/PGN, checked all IDs and
digests, required Maia identity wherever its packet was used, and re-derived fallback and
Stockfish-loss aggregates. The final reviewer packet contains 42 branches: raw production Maia,
`guard_250`, `pawn_x4_guarded`, and the weakened-Stockfish negative control. No reviewer result
exists yet, so H5/C5 remain unmet as population claims. That is an explicit limitation, not a
remaining external dependency after D649. `[V]`

Two planned arms refused themselves before review. The authored-repertoire arm fell off the pack
spine on 57/72 controlled plies (79.2%). The statistical-book arm first exposed an instrument bug:
the live explorer returned HTTP 401 and its status was collapsed into an empty response. After
replacing that call with a frozen local book, the full pass parsed 2,519,503 eligible Lichess blitz
games, found 19,214 reaching a fixed root, and retained 58,147 rooted positions. Yet the arm still
fell back on 57/72 controlled plies. Both exceed the preregistered 25% exercise ceiling and are
excluded before a human can reward their labels. `[V]`

This narrows the architecture. A drill spine is authored consequence content, not an opponent
repertoire. A root-conditioned book through ply 24 is an opening layer with explicit fallthrough,
not a general continuation policy. Increasing the input from an 86 MB check to the 14 GB frozen
prefix did not change that conclusion. The artifacts, source digest, thresholds and correction are
in `planning/platform-alignment/bot-policy/blind-review-plan.md` and `blind-review/manifest.json`;
the disposable generator and validator live under `tools/r11-bot-policy-harness/`. `[V]`

## 9. Consequences for the 1.0 architecture

The bot lane and evidence lane should share **facts**, not ownership. A tactical event such as a
validated fork or discovered attack may support both a learner hint and an error-shape guard; the
guidance compiler selects what may be shown, while the bot policy separately declares what it may
use. Neither consumes raw classifier prose.

This is also the answer to “fun.” Fun bot identity can be composed from a stable repertoire,
measured move traits, memory and presentation. Each component remains inspectable and replaceable;
only the final presentation layer may use an LLM, and R5 requires deterministic fallback plus
conformance gating. The model or policy must earn the chess behavior before the avatar names it.

## 10. Limits

1. The 279 starts come from the current pack/R9 corpus and stop at ply 20; they do not represent
   full games, deep middlegames or all openings.
2. Stockfish depth 12 is a fixed strength proxy, not truth and not a learner-facing grade.
3. Explorer frequency measures population commonness, not coherence, quality or individual style.
4. Equal cell weighting treats each position-band pair equally; it is not traffic weighting.
5. No confidence interval is needed for deterministic expected transforms over this fixed
   population, but external generalization is unmeasured.
6. The complete Maia vector is not exposed past MultiPV 20; §4 bounds rather than removes that
   reconstruction error.
7. The blind packet is prepared but has zero human judgements. It cannot establish coherence,
   usefulness or human plausibility until the preregistered reviewer population completes it.
8. Otter's results are paper-reported and unreproduced here. It is a future adapter candidate, not
   a selected dependency.

## 11. Reproduction

The plan is `planning/platform-alignment/bot-policy/plan.md`. Run the disposable harness with:

```sh
pnpm exec vitest run --config tools/r11-bot-policy-harness/vitest.config.ts

TABIYA_R11_INPUT_DIR=/private/tmp/r12 TABIYA_R11_WRITE=1 \
  pnpm exec vitest run --config tools/r11-bot-policy-harness/vitest.config.ts
```

The raw directory is regenerable through `tools/maia-wdl-agreement-harness/README.md`; only input
digests and aggregates are committed.

The multi-ply artifact is generated and validated separately:

```sh
TABIYA_R11_BOOK_PGN=/private/tmp/r12-style-prefix-2g.pgn \
  node tools/r11-bot-policy-harness/build-local-book.mts
node tools/r11-bot-policy-harness/generate-blind-set.mts
node tools/r11-bot-policy-harness/validate-blind-set.mts
```
