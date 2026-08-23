# D1163 — free engine-composed bot discriminator

**Status:** preregistered before reading the result.
**Question:** can a cp-derived engine distribution express rating-band-specific human choice, or
does it retain the known search-engine shape whose match rises with the human player's strength?

## Fixed population

Reuse the surviving R11/D815 capture without new engine or network calls: 279 positions × human/
Maia bands 1400, 1600 and 1800. The raw capture is not committed (D1166). Three surviving source
digests match `planning/platform-alignment/bot-policy/results.json`; the Stockfish source is
`sha256:890c…`, independently witnessed by the committed
`tools/d815-salience-harness/out/summary.json`, rather than R11's stale `sha256:3795…` claim. The
harness hard-fails unless all four exact digests match this declared lineage. Exclude a position from every arm when its
depth-12 Stockfish candidate set mixes mate and centipawn values; do not coerce mate to cp. Human
moves absent from the legal/candidate map retain zero mass rather than being redistributed.

## Arms

1. Positive control: each captured Maia band reconstructed with the production sampler
   (`T=0.8`, `topP=0.92`).
2. Engine argmax: one point mass on Stockfish's depth-12 best candidate.
3. Engine Boltzmann profiles over cp loss, after a 250-cp guard, with fixed temperatures
   20, 40, 80 and 160 cp. The intended diagnostic mapping is 20→1800, 40→1600, 80→1400;
   160 is sensitivity only. These are probes, not calibrated ratings or proposed product values.

For every model/profile, compute the full 3×3 expected move-match matrix against the three human
bands on the same positions. Report deterministic paired-bootstrap 95% intervals (10,000 samples,
fixed seed `0x1163`) for intended-band match minus each other band.

## Predeclared verdict

- Positive control is informative only if at least two of the three Maia profiles peak on their
  own human band. Otherwise the corpus cannot test band identity and the engine verdict abstains.
- The engine-composed band family passes this cheap screen only if all three intended profiles
  peak on their intended band and both paired differences for each profile are positive at their
  95% lower bound.
- It is **refuted as a banded human-policy head** if the positive control is informative and two or
  more intended engine profiles peak on the strongest (1800) human band rather than their intended
  band. It may still ship honestly as controlled, uncalibrated imperfection; this test does not
  judge fun or multi-ply coherence.
- Any other shape is inconclusive and routes to a better distribution model, not the 500–800-game
  ladder. The ladder is funded only after this screen passes.

No result licenses `human-like`, a persona adjective, or an Elo label.
