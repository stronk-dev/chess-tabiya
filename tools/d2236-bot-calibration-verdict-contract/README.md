# D2236 bot-calibration verdict contract

Disposable exploration instrument for `design/research/bot-calibration-verdict-contract.md`.

Run through the repository toolchain:

```sh
make bot-calibration-verdict-contract
```

The target does not play games or download data. It makes the preregistration able to fail before
the expensive run: exact 17-arm/13,200-game population, frozen CC0 human reference, complete
Stockfish score-domain authority, four named statistics, Holm multiplicity, and a typed verdict
that keeps relative strength, distribution equivalence, controlled divergence and band identity
separate.

This is research code, not a production bot-calibration implementation.

## Frozen human-reference population (D3406)

```sh
make bot-calibration-population-check
make bot-calibration-population
make bot-calibration-population-report
```

The first command runs offline fixtures, including the full 12-cell/24,000-decision population.
The second is explicit research acquisition: it downloads only the preregistered compressed range,
checks its checksum, streams the complete pinned decompressed prefix and checks that checksum before
atomically saving `.cache/bot-calibration/human-reference-population.json`. Both cached data and
selected decisions stay outside Git. Neither CI nor hint requests download this source.

Game identity hashes literal PGN block bytes, including line endings and trailing separators;
chunk boundaries do not affect identity. The final prefix block is discarded. Completed, rated,
standard, non-bot blitz games must replay legally in full before contributing any decision. Raw
result headers must agree with parsed movetext results. The smallest hash selects one eligible
decision per whole game/window, not one for each seat/band. Each cell then retains its smallest
2,000 keys; a game hash's first byte fixes its reference half before evaluation. Repeated identical
game blocks cannot count as new independent games. Moves use the application's existing exact
king-takes-rook identity, including castling. No player names or raw PGNs enter the decision artifact.

The read-only report independently checks the saved population's identity, cell sizes, duplicate
game/windows, reference halves and exact legal moves. `make bot-calibration-population-report-update`
explicitly refreshes the aggregate committed receipt; `…-report-check` compares it without writing.
Missing cells or source drift publish no population and cannot become an empty successful result.

This discharges **population selection only**. Stockfish pricing, four distribution metrics,
opening-identity population, 13,200-game ladder, exact-behavior receipts and all calibration verdicts
remain separate obligations. All twelve production bot cards remain uncalibrated.
