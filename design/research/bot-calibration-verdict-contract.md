# Bot calibration needs three verdicts, not one “human-like” checkbox

**Question:** [[D2236]], with [[D2234]], [[D2235]] and [[D2237]] as consumers
**Date:** 2026-09-06
**Instrument:** `tools/d2236-bot-calibration-verdict-contract/`
**Status:** exploration gate answered; expensive game/evaluation runs not started

## Verdict

The bot-roster calibration plan can now be mechanically decided, but not with its old single pass
word. It was mixing three different claims:

1. **relative strength** — where an exact policy sits in the internal 1400-reference ladder;
2. **human-distribution equivalence** — whether its error shape resembles rating-binned human
   decisions under one declared source/time-control/instrument; and
3. **band identity** — whether its policy fits the moves of its own rating band better than the
   other three bands on identical positions.

All three must pass before the product may call an exact policy **human-like**. A guarded policy may
still ship with measured strength and a useful, fully disclosed behavior mechanism when its error
tail intentionally differs; its typed result is `controlled_divergence`, never a conveniently
weakened human-equivalence pass. `[M]` (product/statistical contract; executable in the instrument)

The expensive ladder population is also settled exactly: the RFC lists **17 arms and 13,200 games**,
not 16/12,400. One literal manifest now owns that count. `[V]`
(`tools/d2236-bot-calibration-verdict-contract/manifest.json`; [[D2235]])

This does not claim that any bot passes. It makes every favorable and unfavorable result
representable before the results exist.

## 1. What the sources establish—and what they do not

Regan and Haworth model human move quality with two parameters, sensitivity `s` and consistency
`c`, fitted from engine-valued alternatives rather than game results. Their central result is that
one Elo coordinate does not determine one error shape. `[V]`
([AAAI paper and DOI](https://ojs.aaai.org/index.php/AAAI/article/view/7951))

Chabris and Hearst independently show that blunder frequency and magnitude change with playing
speed, even for the same grandmasters. That makes time-control identity part of a distribution
claim, not optional metadata. `[V]`
([Cognitive Science article](https://onlinelibrary.wiley.com/doi/abs/10.1207/s15516709cog2704_3))

The Lichess rated-game exports are CC0 and provide the game, ratings and clock-bearing PGN source
needed for a reproducible human reference. `[V]`
([official Lichess database](https://database.lichess.org/))

Those sources motivate the dimensions. They do **not** supply acceptance thresholds for our four
bands, our sampler, or our guard. In particular, Regan's published mileposts do not cover our lower
bands, and Chabris's grandmaster rates are not target rates for 1000–2200 Lichess players. Copying
either table into a pass/fail rule would be false precision. `[V]` (source scopes above;
`design/research/human-like-opponents.md` §§2.2, 5)

The replacement therefore derives each equivalence limit from a frozen, same-band human split
before comparing a bot. Published research selects the statistic; the exact repository population
supplies the reference distribution. `[M]` (contract choice)

## 2. Frozen human reference

The source is not hypothetical. D1329 already froze and measured the first 256 MiB compressed
range of the June 2026 Lichess standard-rated dump:

- official URL and range `bytes=0-268435455`;
- compressed digest `sha256:399d79…ff4d` and decompressed digest `sha256:89d444…81ea`;
- 827,067 complete games, 823,782 eligible legal replays and zero illegal replays;
- 48,470,810 eligible decisions with 100% rating and 99.9481% time-control/clock coverage; and
- every rating × speed × ply-window cell above 10,000 decisions, minimum 13,809.

`[V]` (`planning/platform-alignment/bot-policy/d1329-data-readiness-results.json`)

The calibration reference selects exactly **2,000 blitz decisions from distinct games** in each of
four rating bands and each of three ply windows: 24,000 decisions total. The windows remain named
`opening-8-16`, `middlegame-17-40` and `late-41-plus`; they are sampling strata, not chess-semantic
phase claims. Selection is minimum SHA-256 over game bytes plus ply and is fixed before engine
analysis. At most one decision per game/window prevents a long game from manufacturing precision.
`[M]` (predeclared sampling contract; source capacity `[V]` above)

The four bands are exactly the roster-derived cells already frozen by D1329:

| profile band | human reference interval |
|---:|---:|
| 1000 | 1000–1399 |
| 1400 | 1400–1799 |
| 1800 | 1800–2199 |
| 2200 | 2200–2599 |

Every game belongs to either reference half by the first byte of `sha256(game-bytes)`. That split is
made before any evaluation. No player name, result, selected move quality or later bot output can
choose the half. `[M]` (predeclared leakage boundary)

### Why one speed

The bot path has no clock input, and the internal game ladder is untimed. A single blitz human
reference does not turn either into a blitz Elo. It supplies one bounded comparison population and
prevents the old plan from pooling incompatible human speeds. A future rapid/classical claim needs
another exact manifest and cannot inherit this result. `[V]` for the missing clock input
(`design/research/human-like-opponents.md` §2.5); consequence `[M]`.

## 3. One analysis authority

Every human and bot decision is priced by the same Stockfish 18 operation: depth 8, Threads 1,
Hash 16, `ucinewgame` + Clear Hash + ready barrier per position, and one result for **every exact
legal move**. A missing, duplicate or extra candidate invalidates the decision. `[M]` (instrument
contract, reusing the proven reset/completeness boundaries from
`design/research/stockfish-candidate-guard-probe.md` and [[D1081]])

Centipawn and mate results remain distinct typed domains. A mate value is never mapped to an
arbitrary large centipawn number. The D1329 projection census already showed why this matters: all
317 missing candidate projections came from 11 roots with mate scores; treating the missing domain
as zero would have changed a 94.403% failure into a false pass. `[V]`
(`design/research/non-maia-selector-data-readiness.md`)

Depth 8 is an instrument identity, not perfect chess truth. The comparison remains meaningful
because target-human halves and bots traverse the identical operation. Changing engine, depth,
reset, legal-set compiler or score-domain parser creates a new reference receipt. `[M]`

## 4. Four exact metrics

### 4.1 Candidate-loss empirical distribution

The first metric is the two-sample Kolmogorov–Smirnov distance over candidate loss. It avoids a
post-hoc histogram bin choice. Its acceptance limit is the 95th percentile of 999 deterministic,
game-clustered distances between the two target-human halves. The tested quantity is the 95th
percentile of 999 bot-versus-target clustered replicates. It passes only when the latter is no
larger than the former. `[M]` (predeclared equivalence rule)

### 4.2 Regan `s,c` shape

Fit the published two-parameter choice family by bounded maximum likelihood over the complete
legal alternative table. Compare the bot's `(s,c)` vector with its target-human vector using
bootstrap covariance and Mahalanobis distance. The exact same human-split quantile construction
sets the limit. No 1600 parameter is extrapolated down to 1000/1400, and neither parameter can hide
the other's failure. `[V]` for the model family
([Regan & Haworth](https://ojs.aaai.org/index.php/AAAI/article/view/7951)); fitting/verdict `[M]`.

### 4.3 Severe-tail vector

Measure candidate-loss rates at `>=50`, `>=100`, `>=150` and `>=250` centipawns plus a distinct
mate-loss arm. Compare the whole vector with a simultaneous maximum standardized rate-difference;
the human-split 95th percentile is again the limit. This is one metric with an internal simultaneous
bound, not five opportunities to cherry-pick a favorable threshold. `[M]`

The 150-cp point retains the historical blunder boundary studied by Chabris and Hearst; 250 cp is
the roster guard's declared removal boundary. `[V]`
([article](https://onlinelibrary.wiley.com/doi/abs/10.1207/s15516709cog2704_3);
`design/research/stockfish-candidate-guard-probe.md`)

### 4.4 Exact-position opening band identity

Full-game error shape and policy-band identity are different experiments. The latter needs the
same positions across bands, so it is deliberately opening-scoped: 128 canonical FENs with at
least 100 observed moves in every rating band. Score the observed moves under the exact profile
distribution using mean negative log probability. The profile's target band must be the unique
minimum and the bootstrap lower bound against the runner-up must remain above zero after Holm
adjustment. If the fixed source cannot supply 128 positions, the result is `insufficient`; the
population is not silently narrowed. `[M]`

This replaces D1163's “which band has the highest raw move-match rate?” gate. That gate's Maia
positive control itself peaked on 1600/1800/1800 for models 1400/1600/1800, so it could not
distinguish a broken bot from a broken statistic. `[V]`
(`planning/platform-alignment/bot-policy/d1163-engine-composed-results.json`; [[D1184]])

## 5. Multiplicity and verdict algebra

Holm–Bonferroni at family-wise alpha .05 covers every claimed profile × required metric. Metrics
are declared in the manifest before results; removing the one that fails is invalid input, not a
new analysis. `[M]` (predeclared conservative multiplicity rule)

The result is three independent closed unions:

| axis | values | what it authorizes |
|---|---|---|
| strength | `calibrated_relative`, `unresolved`, `invalid` | only the first may print a band-relative result/CI; never an absolute human Elo |
| distribution | `human_reference_equivalent`, `controlled_divergence`, `rejected`, `insufficient` | only equivalence contributes to “human-like” |
| band identity | `supported`, `refuted`, `insufficient` | only supported permits “plays like its band” |

`humanLikeLabelAllowed` is true only for the conjunction
`calibrated_relative + human_reference_equivalent + supported`. The executable controls prove that
relative strength alone, a missing metric, failed band identity, or an insufficient reference all
refuse the label. `[V]` (`make bot-calibration-verdict-contract`, 9 able-to-fail groups)

### Controlled divergence is not a relaxed pass

The guard removes the severe tail by design. A guarded profile can therefore be a useful product
without being distribution-equivalent to the human reference. It receives
`controlled_divergence` only when:

- its family is declared eligible (`guarded-human` or `pawn-forward` in v1);
- every failed required metric is named exactly;
- the exact responsible policy layer is named; and
- the card uses mechanism-only language and forbids “human-like” or personality-equivalence copy.

Leaving one failed metric out makes the receipt invalid. `[V]` (negative contract fixture)

This prevents the product from repeating the competitor pattern the owner disliked: applying
engine tricks to Maia and calling the result human merely because it feels less engine-like. The
claim becomes exact: *human-policy source, with a disclosed safety transform that intentionally
changes its error distribution.* `[M]`

## 6. Exact game manifest and cost boundary

The old prose table contained C1, C2, N, A1–A4, B1–B4, P1–P4 and G1/G2. The executable manifest
derives:

- 17 arms;
- 12 exact `3 families x 4 bands` profile arms;
- 16 arms at 800 games and one sensitivity control at 400; and
- **13,200 games total**.

`[V]` (`manifest.json`; contract fixture)

G1/G2 remain layer-effect upper-bound experiments. Their 800 games must not be reported as proof of
zero strength effect merely because a confidence interval crosses zero. `[V]` for the prior measured
resolution (`design/research/maia-band-outcome-transfer.md`); reporting rule `[M]`.

The human reference adds 24,000 complete-legal-root evaluations. It is a separate cached artifact
with source and engine receipts; rerunning 13,200 games must not silently rebuild or change the
human comparator. `[M]`

## 7. Consequences for the roster and broader personality programme

1. [[D2236]] is research-answered: exact population, source, statistics, limits, uncertainty,
   abstention and multiplicity exist before results.
2. [[D2235]] has a literal population authority: the next RFC repair must delete 16/12,400 and
   consume 17/13,200 from the manifest.
3. [[D2234]]'s digest split remains mandatory. These measurements key the policy/behavior digest;
   name, avatar, translated tagline and other presentation bytes cannot invalidate chess behavior.
4. [[D2237]] is not solved by calibration. The evidence says the current 4×3 roster is four
   strength bands over only three behavior mechanisms. Five one-ply style atoms, one state target
   and two Maia-window route controllers failed; the separately identified route source passed its
   mechanism gate but not personality/human-distribution gates. `[V]`
   (`shared-style-atoms-as-bot-traits.md`, `state-directed-bot-profile.md`,
   `finite-state-bot-route-controller.md`, `monotone-bot-route-controller.md`,
   `generated-bot-route-source.md`)
5. A future route or evidence-driven personality enters this same manifest only after its exact
   policy is registered. It does not inherit a Maia profile's calibration, even if it shares a
   name, band or candidate source. `[M]`

The practical 1.0 implication is additive rather than reductive: ship only the bot claims each
policy earns, then keep building genuinely different registered policies until the personality
breadth target is met. Twelve decorative identities are not the target; twelve proven chess
behaviors are. `[M]`

## Limits

- No 13,200-game ladder or 24,000-decision evaluation has run in this pass.
- The June prefix covers about 9h46m of one day. Its size proves capacity, not month-wide
  representativeness. A release claim should repeat the frozen selection over a month-stratified
  source before treating the result as general Lichess behavior.
- Blitz is one comparator, not an absolute human rating or an intrinsic identity.
- Depth-8 Stockfish is a versioned measurement instrument, not perfect ground truth.
- The opening band-identity population may legitimately return insufficient.
- Statistical equivalence does not establish that a bot is enjoyable, coherent over many games or
  perceptually human. The existing blind owner-use packet may reject those claims; participant
  studies remain outside the ruled 1.0 process.
