# R11 bot-policy harness

Disposable platform-alignment R11 instrument. It applies predeclared distribution transforms to
the exact Maia/explorer/Stockfish captures behind
`design/research/maia-wdl-versus-human-outcome.md`. It neither starts an engine nor adds a product
policy.

Ordinary runs execute synthetic controls only:

```sh
pnpm exec vitest run --config tools/r11-bot-policy-harness/vitest.config.ts
```

The measured pass uses the regenerable raw directory from the earlier harness:

```sh
TABIYA_R11_INPUT_DIR=/private/tmp/r12 TABIYA_R11_WRITE=1 \
  pnpm exec vitest run --config tools/r11-bot-policy-harness/vitest.config.ts
```

Committed results contain input digests and aggregates, not raw captures.

The blinded multi-ply arm is preregistered in
`planning/platform-alignment/bot-policy/blind-review-plan.md`. With the real engine profile running,
generate its review package using:

```sh
node tools/r11-bot-policy-harness/generate-blind-set.mts
```

Build the frozen statistical opening book first:

```sh
TABIYA_R11_BOOK_PGN=/private/tmp/r12-style-prefix-2g.pgn \
  node tools/r11-bot-policy-harness/build-local-book.mts
```

The source is the decompressed 2 GiB compressed prefix frozen by R12; regenerate it through
`tools/r12-player-style-harness/README.md`. A smaller PGN may check the instrument but may not
replace the committed full-prefix population claim.

The generator uses the shipped `/select-move` Maia path, an independent local Stockfish 18 process
for declared guard/strength measurements, current pack-root objectives/spines and that frozen
Lichess PGN-derived opening book. It writes randomized PGNs, a reviewer packet, separate blind key,
book source/population summary and scorecard
under `planning/platform-alignment/bot-policy/blind-review/`. It is disposable research code, not a
production bot-policy implementation.

Validate the generated artifact without contacting either engine:

```sh
node tools/r11-bot-policy-harness/validate-blind-set.mts
```
