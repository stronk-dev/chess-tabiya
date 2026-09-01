# D53 option-collapse measurement (disposable)

This disposable RFC-0000 exploration instrument measures the shipped
`option_collapse` convention. Production code does not import it.

Populations:

- every full path in the 108-game CC0 Lichess fixture retained by the R2
  selection harness (Bullet/Blitz/Rapid × three rating strata); and
- every root-to-leaf path in the current non-browser draft-pack corpus.

It measures the exact 8→3→3 same-side legal-choice sequence, check/forced and
recapture context, sensitivity to the three thresholds, and the difference
between counting four promotion roles versus one from/to destination. For each
real-game firing it also enumerates legal three-ply continuations from the
position immediately before the first collapsed decision; this is the
continuation-shaped alternatives population required by live-marker-quality
L2(ii).

Run:

```sh
make option-collapse-measurement
```

The committed summary is
`planning/live-marker-quality/d53-option-collapse-results.json`.
