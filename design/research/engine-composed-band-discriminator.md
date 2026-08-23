# Engine-composed band discriminator

**Date:** 2026-08-23
**Question:** Can a centipawn-derived engine distribution distinguish human rating bands well
enough to justify an engine-composed bot ladder?
**Ledger:** D1163, D1166, D1183, D1184

## Verdict

**Abstain on the preregistered product verdict; do not fund the game ladder from this screen.**
The Maia positive control was not informative under the declared criterion: only two of its three
profiles peaked on their nominal band, and the reconstructed 1400 profile matched the 1600 human
distribution most closely. Because the criterion required at least two own-band peaks, the formal
engine verdict abstains. `[V]` (`planning/platform-alignment/bot-policy/d1163-engine-composed-plan.md`;
`planning/platform-alignment/bot-policy/d1163-engine-composed-results.json`)

The directional result is nevertheless unanimous and adverse. Stockfish argmax and every guarded
Boltzmann probe (20, 40, 80, and 160 cp) matched the 1800 human band most closely. Increasing the
temperature lowered absolute move match but did not create a lower-band peak: the 20-cp probe was
16.14% / 17.40% / 18.29% against 1400 / 1600 / 1800, and the 160-cp probe was 5.72% / 6.21% /
6.30%. `[V]` (`planning/platform-alignment/bot-policy/d1163-engine-composed-results.json`)

This refutes **temperature alone as evidence of band identity on this population**. It does not
license the stronger claim that every engine-composed opponent is non-human, and it does not
measure fun, multi-ply coherence, playing strength, or personality. `[V]` (same result; the
instrument computes one-ply distribution overlap only)

## Method

The disposable harness reconstructed three Maia distributions with the production sampler
(`T=0.8`, `topP=0.92`), compared Stockfish argmax, and formed guarded Boltzmann distributions over
Stockfish depth-12 candidate loss at 20/40/80/160 cp. It then computed expected move-match against
Lichess human move distributions for bands 1400, 1600, and 1800 on the same positions. Eleven
positions mixing mate and centipawn scores were excluded rather than numerically coercing mate;
268 positions remained. Paired differences use 10,000 deterministic bootstrap resamples with seed
`0x1163`. `[V]` (`tools/d1163-engine-composed-bot-harness/engine-composed.test.ts`;
`planning/platform-alignment/bot-policy/d1163-engine-composed-results.json`)

No engine, network, or game ladder ran. The result is a replay over captured data. `[V]`
(`tools/d1163-engine-composed-bot-harness/README.md`)

## Positive-control finding

The declared positive control exposed a measurement problem rather than validating the screen.
The Maia 1400/1600/1800 rows peaked at human 1600/1800/1800 respectively; thus nominal-band
identity is not separable by raw expected move-match on this 268-position population. The human
band distributions are sufficiently aligned that a stronger policy can match all of them while
still rising with band. `[V]` (`planning/platform-alignment/bot-policy/d1163-engine-composed-results.json`)

Therefore a future Gate 0 must not reuse “profile peaks on its own band” without a positive control
that actually demonstrates that property on the exact population and sampler. A contrastive or
chance-adjusted statistic may be researched, but choosing one after seeing this result would be a
new preregistered experiment, not a reinterpretation of D1163. `[M]`

## Reproducibility boundary

The run hard-pins all four input digests. Three surviving inputs match the R11 record; the
Stockfish input is `sha256:890c…`, independently named by the committed D815 summary rather than
R11's stale `sha256:3795…` value. The raw capture itself is not committed, so an independent clone
cannot reproduce the run yet. D1166 remains open for a snapshot or exact rebuild recipe. `[V]`
(`planning/platform-alignment/bot-policy/d1163-engine-composed-plan.md`;
`tools/d815-salience-harness/out/summary.json`)

## Consequence

- Do not launch the 500–800-game engine-composed ladder: D1163's own funding condition did not
  pass. `[V]`
- Keep engine + guard + traits labelled **controlled, uncalibrated imperfection**, never
  human-like, Elo-equivalent, or a personality. `[V]` (`design/research/non-maia-bot-composition.md`
  §5)
- Continue the independent evidence-to-move-selector research (D1162) if a variant-portable human
  policy head remains a 1.0 goal. This experiment did not exercise that architecture. `[M]`
- Reuse this harness as the roster's Gate 0 receipt; do not build or run a duplicate. `[V]`
