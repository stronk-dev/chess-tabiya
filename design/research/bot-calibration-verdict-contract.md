# Bot calibration needs three verdicts, not one “human-like” checkbox

**Question:** [[D2236]], with [[D2234]], [[D2235]] and [[D2237]] as consumers
**Date:** 2026-09-06
**Instrument:** `tools/d2236-bot-calibration-verdict-contract/`
**Status:** verdict vocabulary and frozen reference/pricing established; 2026-10-06 numerical-contract hold (D3429) sharpened by the 2026-10-07 primary-source counterexamples below; opening-identity population and game ladder remain pending

### 2026-10-07 primary-source numerical author inputs — D3429

Regan & Haworth's 2011 manuscript separates proxies `y_i = exp(-(delta_i/s)^c)` from
probabilities. Section 3, printed p4, prefers `p_i = p_0^(1/y_i)` with `sum p_i = 1`, not
`y_i/sum y`. However, §6's worked percentiling description, printed p7, writes the latter
normalization. Section 6 also says the reported fit uses percentiling, after rejecting MLE's
projections. Scaling and equal-top corrections are separate choices. This manuscript alone
therefore does not pin one implementation of our bounded-MLE contract. `[V]`
([author-hosted 2011 manuscript](https://cse.buffalo.edu/~regan/papers/pdf/ReHa11c.pdf), §§3–6).

The published AAAI version retains the same mapping and fitting distinction: §3 on p835
uses the implicit conversion, while §6 on p837 writes direct normalization in its percentiling
description and identifies percentiling as the method used. The ambiguity is not merely a
preprint-versus-publication substitution. `[V]`
([published proceedings PDF](https://ojs.aaai.org/index.php/AAAI/article/view/7951/7810), pp835–837).

The later Regan & Bispo paper gives MLE's objective as `sum_t ln(1/p_t,chosen)` in §IV.A,
alongside distinct fitting methods. It does not supply our Stockfish cp/mate admission,
parameter bounds, clustered bootstrap or adjusted-test construction. `[V]` for its fitting
methods ([author-hosted paper](https://cse.buffalo.edu/~regan/papers/pdf/ReBiNF13av.pdf), §IV);
`[M]` for the comparison with our incomplete §6 contract.

The disposable `make bot-calibration-numerical-author-check` uses **synthetic dimensionless
proxies only**, not priced human/bot rows. For `[1, 1/2]`, the implicit mapping solves
`p_0 + p_0^2 = 1`: approximately `[0.618034, 0.381966]`, versus direct normalization's
`[0.666667, 0.333333]`. Independent algebraic cases, equal/one-choice cases, permutation,
finite extreme proxies and invalid-input refusals make that distinction executable.
Changing to direct normalization must fail the closed-form controls. These are mathematical
counterexamples, **not a chosen fitter, reusable production implementation or new calibration**.
`[V]` (`tools/d2236-bot-calibration-verdict-contract/numerical-author-examples.test.mjs`).

R's official `p.adjust` documentation defines Holm on a family of **p-values**. Naming a
"Holm-adjusted q05" without a hypothesis/test or interval inversion does not specify the
calculation. `[V]` for the documented input
([R stats documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html));
`[M]` for the missing-contract consequence.

SciPy documents that paired resampling reuses indices and that degenerate BCa bootstrap
distributions can produce warnings and NaN interval endpoints. Neither is a policy for our
cross-window game clusters or singular Mahalanobis covariance. `[V]` for those library behaviors
([SciPy bootstrap documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.bootstrap.html));
`[M]` for the scope distinction. No library/version/default is adopted here.

**Required author repair before comparative results:** select and cite an exact model version,
including its probability mapping; specify score transformation/units and typed mate participation;
declare bounded MLE as an extension rather than reproduction if applicable, with objective,
bounds, starts, tolerances and convergence/refusal cases; fix whole-game resampling and degeneracy
semantics; define the hypotheses, p-value construction/family and any simultaneous interval
inversion. Those are algorithmic contract inputs, not a request for routine metadata approval.
`[M]` (D3429 author-input synthesis; existing obligations in `rfc/bot-roster.md` §6).

The manifest, 24,000-row reference, original pricing journal, required metrics/thresholds and
production profiles remain unchanged. D3429 stays blocked on numerical author repair, D3410
separately holds opening-source repair, and no numerical-fit, native ladder, rating or human-like
verdict follows. `[V]` (unchanged manifest/pricing sources and current work-state).

### 2026-10-06 numerical-contract and complete-source audit

[[D3429]] is author-held, not a lowered acceptance gate. The manifest fixes the metric names,
999 replicates, severe-tail cutoffs, Holm family and verdict vocabulary; it does not define
mixed-domain inclusion/normalization, the likelihood equation and numerical parameter bounds,
singular covariance/zero-variance treatment, resampling seed/weights or adjusted-test construction.
`validateManifest` checks textual descriptions and `classifyCalibration` consumes supplied metric
states. No implementation elsewhere in the D2236 harness computes those statistics. `[V]`
(`manifest.json`, `contract.mjs`, `contract.test.mjs` in the instrument; `rfc/bot-roster.md` §6).
The original statement that those descriptions made calibration mechanically decidable is
superseded; the independently defined verdict vocabulary is retained.

[[D3430]] audits every saved root without selecting a metric procedure. The complete stream
revalidates its original journal chain, ordered population, whole sealed provider delivery,
same-generation reset and exact legal-move set. All 24 fixed band/window/half cells are retained.
The small aggregate records: `[V]` (`planning/bot-roster/calibration-score-domains.json`;
`score-domain-audit.ts`, `score-domain-report.ts` and independent controls in the D2236 instrument).

| Literal source property | Count |
|---|---:|
| decisions / complete legal candidates | 24,000 / 756,370 |
| cp-only / mixed cp+mate / mate-only roots | 22,282 / 1,640 / 78 |
| root-mates / root-is-mated alternatives | 1,487 / 9,030 |
| played cp / root-mates / root-is-mated rows | 23,673 / 145 / 182 |
| cp-valued played moves in mixed roots | 1,391 |
| flat cp-only tables | 162 |
| distinct games / games in multiple windows | 22,908 / 1,056 |
| games contributing decisions in multiple rating bands | 30 |

There are 21,852 one-decision games, 1,020 two-decision games and 36 three-decision games. Both
fixed reference halves retain their own per-cell counts. The 81 cp-played roots with a root-mates
alternative and 1,317 with a root-is-mated alternative overlap; they must not be added as a unique
population. These are literal recorded-score counts, not deeper chess outcomes, blunder labels,
likelihood fits or calibrated-policy claims. `[V]` (same whole-source aggregate and counterexamples).

The first current-executor audit refused: scheduler changes since pricing changed that executor's
digest. Historical validation now verifies the seven original executor files and original receipt
from immutable commit `bb53301fb0dd3f3a65b24754c9aafe9eedf212a8`; the final source chain and every
original aggregate/cell count must match. Current source parsing must still reproduce the recorded
parser identity. The audit has a separate instrument digest. No original pricing/reference bytes
are restamped, and the existing current-executor reproduction guard is untouched. `[V]`
(`score-domain-report.ts`; `planning/bot-roster/calibration-score-domains.json`).

**Next author action:** pin the complete numerical procedure, including how every one of these
domain/cluster cases enters or explicitly abstains, before computing bot-versus-human verdicts.
Do not drop mate-bearing roots, pool correlated observations as independent, loosen a limit or
choose a fitter after observing comparative results. Opening-source repair remains independently
held by [[D3410]]. No game ladder, native Maia comparison or human-like card claim is discharged.

## Verdict

The bot-roster calibration verdict vocabulary separates three claims; the numerical procedure
cannot yet mechanically decide them. **2026-10-06 correction:** the original claim of an executable
metric contract was too strong. The manifest pins names and limits in prose, while `contract.mjs`
validates strings and combines supplied metric states. Mixed score domains, fitting bounds,
degenerate variance/covariance, deterministic resampling and adjusted-test construction remain
unresolved under [[D3429]]. `[V]` (`tools/d2236-bot-calibration-verdict-contract/manifest.json`,
`contract.mjs`; `rfc/bot-roster.md` §6). The three separate verdicts remain:

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

## 2026-10-05 — Human-reference population selection executed (D3406)

The offline sampler streamed the complete checksum-pinned prefix, replaying every admitted game in
full: 827,067 complete PGN blocks,
1,921,777,664 decompressed bytes, both source checksums matching the original manifest. It selected
24,000 decisions from 22,908 distinct games: exactly 2,000 distinct-game decisions in each of the
twelve band/window cells. The smallest eligible cell has 13,143 game/window decisions; both fixed
reference halves have observations in every selected cell. The aggregate receipt is
`planning/bot-roster/calibration-human-reference-population.json`; raw source and selected decisions
remain in ignored `.cache/bot-calibration/`. `[V]` (full source run and independent row/legality
validation through `make bot-calibration-population` and `make bot-calibration-population-report`)

The literal PGN block bytes, including line endings and separators, own game identity. One minimum
decision hash is selected per whole game/window before cell sampling; differently rated seats do
not manufacture two independent decisions from the same window. Invalid whole-game replay,
unfinished/mismatched result headers, non-blitz/non-rated/non-standard/BOT records and the final
partial source block contribute no rows. Streaming chunk boundaries, including split UTF-8, cannot
change identity. The parser can overwrite a raw unfinished result header from the movetext
terminator; permanent negative controls therefore require the raw and parsed results to agree.
`[V]` (`tools/d2236-bot-calibration-verdict-contract/population.ts` and `population.test.ts`)

This was **selection, not calibration**. The selection checkpoint did not price candidates; the
following D3407 checkpoint supplies those values. No metric comparison, opening identity population
or 13,200-game ladder ran. No production profile earns a strength, distribution,
band-identity or human-like claim. The existing representativeness, source-contract, native-sampler,
guard/clock/phase and owner-use limits remain. `[V]` (receipt's explicit `claims` and unchanged
`tools/d2236-bot-calibration-verdict-contract/manifest.json`)

## 2026-10-05 — Complete candidate pricing (D3407) and A2 scope residue (D3408)

All 24,000 frozen human decisions were priced through the production registered
`stockfish.legal_root_table@1` scheduler, descriptor and sealed parser. The original manifest remains
unchanged: actual Stockfish 18, depth 8, Threads 1, Hash 16, fresh `ucinewgame`/Clear Hash/ready barrier
before every root, and set-equal exact legal candidates. The complete saved journal independently
reloads each whole source through `parsePersistedProviderDelivery`, verifying population/selected-row
order, manifest, executor closure, parser implementation, actual binary/options and same-generation
reset witness. `[V]` (`tools/d2236-bot-calibration-verdict-contract/evaluation.ts`, `evaluate.ts`;
`planning/bot-roster/calibration-human-reference-pricing.json`)

The measured population contains **756,370 candidate rows: 745,853 centipawn and 10,517 mate**.
Played human choices contain 23,673 centipawn and 327 mate scores. No missing domain was replaced
with a zero, scalar mate surrogate or dropped decision. No candidate-loss metric or grading verdict
is computed by this instrument. The raw journal stays ignored; the committed aggregate identifies
the complete hash chain and original population. `[V]` (pricing receipt)

The offline gate passes 44 cases plus nine unchanged preregistration groups and strict research-tool
types. Five explicit native cases additionally prove real reset reproducibility across an unrelated
search, both castling identities, all four promotions, positive/negative mate domains and whole
delivery reload. Missing/duplicate/wrong-depth/bounded/illegal-PV tables, wrong engine/options,
reset/generation failures, crossed roots and mutated/torn resumptions refuse. Outer-chain-recomputed
corruption controls require the durable source parser itself to fail, not merely a journal checksum.
`[V]` (`evaluation.test.ts`, `evaluation-native.test.ts` in the same instrument; its normal Make gates)

The initial run refused the operator's actual Stockfish 19 rather than manufacturing an 18 label.
An isolated official release-18 binary was checksum-verified and captured; no global installation
or depth/band/selection authority changed. This does not license equivalence to other engine builds,
depths, speeds or a broader human population. `[V]` (`prepare-engine.sh`; actual identity/option image
in the pricing receipt; append-only `planning/exploration/log.md` entry)

D3408 is independent of that pricing. Bot-roster §6 calls A2's reconstruction full-width, but the
registered production sampler requests min(20, legal count) and the compiler admits exactly that
bounded page. Above twenty legal moves these are different policies; complete Stockfish pricing
cannot widen the Maia page. The eventual ladder must bind the actual catalogue behavior, not an
unregistered full-width variant. The correction is owned and queued; no production policy or frozen
manifest was altered here. `[V]` (`rfc/bot-roster.md` §6;
`packages/runtime/src/bot-profile-catalog.ts` BOT_SAMPLER/botEffectiveRequestedWidth;
`apps/server/src/bot-policy-compiler.ts` admitMaia; [[D3408]])

**No calibration claim follows.** Four-metric comparisons, the exact-position opening population,
the 17-arm/13,200-game ladder, strength/distribution/band-identity verdicts and full bot breadth remain
open. All twelve cards remain uncalibrated. `[V]` (receipt's explicit claims; unchanged manifest)

## 2026-10-05 — Production profile binding and full-source opening capacity (D3408–D3410)

D3408 corrects the prior checkpoint's source-policy mismatch without changing a production policy.
The executable disposable bridge resolves every frozen profile arm and both layer-contrast sides
to the whole production catalogue member and behavior digest. Requests use `botMaiaRequest`, with
width min(20, exact legality), temperature .8 and top-p .92. Decisions use the sole production
compiler, not copied sampling/guard/trait code. The bridge accepts existing service root authorities,
consumes shared scheduler results and persists/reloads whole deliveries before reconstructing the
complete saved decision. Valid sealed full-width, different-band/temperature/top-p and crossed-root
pages refuse. Every registered profile, history/castling/low-width root, missing provider/guard,
copied authority and mutated saved binding/source/decision is controlled. These fixtures exercise
the production path through scripted providers, **not a native Maia calibration**. `[V]`
(`tools/d2236-bot-calibration-verdict-contract/profile-arm.ts`, `profile-arm.test.ts`;
`rfc/bot-roster.md` §6 correction)

The selected reference contains only 8,000 opening decisions; the separate opening-band metric's
minimum is 128 × 100 × four bands = 51,200 observations. D3409 therefore scans the complete pinned
source, not those selected rows. The unchanged full-game admission function validates eligibility
and replay before all nine potential opening-window observations are considered. Exact six-field
FENs, moving-seat rating, raw-byte game identity and fixed reference halves are retained; duplicate
games cannot enlarge a position/band count. Source drift refuses before publication, and no model
outputs or statistical ranking select the inventory. `[V]` (`population.ts` gameDecisions;
`opening-capacity.ts`, `opening-capacity-stream.ts`, `opening-capacity.test.ts`, unchanged manifest)

The actual 827,067 complete source blocks contain 323,448 eligible opening games, contributing
2,863,498 observations over 1,677,685 exact FENs. Of these, 8,938 occur in every band at least once,
277 at least ten times, 72 at least 25, 19 at least 50, **six at least 100**, and one at least 200.
These are descriptive capacity strata, not replacement acceptance thresholds. Only six qualify
under the frozen 100-per-band rule; 128 are required. The capacity state is explicitly insufficient,
with zero selected positions, zero model queries and no band-identity/human-like claim. `[V]`
(`planning/bot-roster/calibration-opening-capacity.json`; full count inventory in ignored cache)

**D3410 is a contract hold, not a detector or bot failure.** The specified opening-band experiment
cannot run against this frozen prefix. A broader preregistered opening population needs author
repair before model outputs; the already-priced 24,000-decision distribution reference stays frozen.
No clock stripping, band merging, threshold reduction or six-position substitute is authorized.
The native ladder, all distribution statistics, source/seed contracts and full phase/clock/personality
breadth remain open. No capability, milestone, RFC or bot card graduates. `[V]` (manifest's literal
population; measured capacity; [[D3410]]; `rfc/bot-roster.md` §6 and §6.1)
