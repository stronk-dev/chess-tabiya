# D774 pawn-conversion probe

**DISPOSABLE RESEARCH INSTRUMENT — not production code.** It replaces vague “pawn break” prose
with identity-retaining passed-pawn transitions.

Pinned convention: a pawn is passed when no opposing pawn stands ahead of it on the same or either
adjacent file. A protected passer is a passed pawn attacked/defended by a same-color pawn. A
connected pair is two passed pawns on adjacent files; this probe imposes no rank-distance rule and
records that limitation.

The probes retain the moved pawn where applicable and never claim a passer is dangerous, favorable,
winning, intended or a majority conversion. Lift is played-vs-legal-alternative discrimination,
not quality. Besides the fixed-ply cross-population sample, the instrument reports all sealed
imported paths in disclosed ply bands 1–20, 21–40 and 41+ so endgame-heavy authored packs cannot
silently turn corpus composition into a universal prior. The bands are horizons, not phase truth.

Run only this instrument:

```sh
pnpm exec vitest run --config tools/d774-pawn-conversion-harness/vitest.config.ts
```

The run writes `output.md`.
