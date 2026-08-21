# R2 selection, sign, and significance harness

**Disposable exploration instrument.** This is not production code and does not authorize an
evidence compiler or presentation change. It answers platform-alignment R2 and D542-D545.

## Predeclared method

Two populations are evaluated:

1. every authored spine transition returned by `tools/r1r2-primitives-harness/corpus.ts`; and
2. the retained deterministic 108-game sample of rated standard Lichess games from the July 2026
   public PGN prefix (`imported-sample.pgn`, provenance in `fixture.json`).
   The sample takes the first 12 complete legal games in each Bullet/Blitz/Rapid x
   1000-1399/1400-1799/1800-2199 cell, then plies 8, 16, 24, 32, 40 and 48 when present. A game
   contributes at most six decisions, so long games cannot dominate. This is a chronological
   prefix and a behaviour sample, not a random or representative estimate of all chess players.

For every decision the harness enumerates every legal alternative, including all four promotion
roles. It derives four structural relations at exact observation identity: `gained`, `lost`,
`preserved`, and `avoided`. A relation's admission denominator is the legal-alternative set from
the same parent. Transition-census facts retain their declared direction/subkind. `Avoided` means
only that an alternative relation did not occur on the played move; it carries no good/bad
valence.

The predeclared selector is deliberately simple:

- at least eight legal alternatives;
- admit a played relation only when no more than 20% of alternatives emit the same signed family;
- refuse `pawn_safe_square` (D566) and dead `pawn_count` from selection;
- always retain the exact rule events checkmate, promotion, castling and last-of-role;
- group duplicate observations by signed family and show at most two families;
- abstain from positive/negative wording because the current evidence record has no validated
  valence.

The output also reports 10% and 30% threshold and one-/three-card sensitivity, the previously
measured authored top-eight structural kinds as a transfer baseline, and per-kind played-vs-legal
alternative lift on both populations. `1 - same-family alternative share` is called
*counterfactual specificity*, never usefulness or chess correctness. Existing conjunction results
are reconciled in the dossier rather than re-fit here: `design/research/conjunction-hypothesis.md`
already found that no measurable pair beat its components.

## Run

```sh
pnpm exec vitest run --config tools/r2-selection-harness/vitest.config.ts
```

The bounded CC0 input is committed because the original `/tmp` prefix vanished after the first
measurement. `extract-fixture.ts` replays the predeclared first-12-per-cell selection over a source
prefix. A 16 MiB compressed HTTP range from the official archive reproduced the same 108 games,
579 decisions and every report line after the input digest; `fixture.json` records both prefix and
fixture digests. `TABIYA_LICHESS_GAMES` may override the fixture for an explicit transfer run and
`TABIYA_R2_OUTPUT` may redirect output so a comparison does not dirty the recorded baseline.
