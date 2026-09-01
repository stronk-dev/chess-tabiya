# D52 human-divergence measurement (disposable)

This is a disposable research instrument under the RFC-0000 exploration gate. It
measures the still-unmeasured `human_divergence` live marker from D52; production
code does not import it.

The instrument has two populations:

1. 136 recorded Lichess human-choice distributions from R9, at rating bands 1400,
   1600 and 1800. The exact SAN histories are replayed into the shipped Maia
   selector, so the external comparison does not silently erase Maia's history
   input.
2. Every unique decision position in the committed draft-pack corpus, probed at
   1100, 1500 and 1900. This estimates live volume, phase skew, band sensitivity
   and sensitivity to the detector's 0.50 / 0.15 / three-candidate constants.

Both arms call the production `OpponentSelector` in `human_common` mode. The
analysis applies the exact normalisation and `offWindow` exclusion from
`packages/runtime/src/pivotal.ts`.

Run the whole instrument with the repository command:

```sh
make human-divergence-measurement
```

It requires Docker and the repository's Maia image. The committed summary is
`planning/live-marker-quality/d52-human-divergence-results.json`; raw per-position
vectors stay in `/tmp/tabiya-d52-human-divergence/` because they are reproducible.
