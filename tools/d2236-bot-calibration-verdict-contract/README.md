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

**2026-10-06 correction (D3429):** named statistics and supplied pass/fail states are not an
executable numerical contract. The strings do not pin mixed cp/mate membership, likelihood bounds,
singular/zero-variance treatment, resampling seed/weights or adjusted-test construction. The
statistics remain author-held; this contract alone cannot establish a calibrated profile.

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

## Complete legal-root pricing (D3407)

```sh
make bot-calibration-engine
make bot-calibration-engine-check
make bot-calibration-evaluate
make bot-calibration-evaluation-report
```

The first command verifies and caches an isolated official Stockfish 18 artifact (Apple Silicon or
the existing pinned Linux installer). It never replaces a global/Homebrew installation. The explicit
evaluation command uses the pinned Node toolchain and the isolated engine, or an operator-supplied
`BOT_CALIBRATION_SF_CMD`. An actual version-19 handshake is refused, never stamped as version 18.
The offline fixture/type gate remains `make bot-calibration-population-check`; it does not download
an engine or run the expensive population.

Five explicit native controls check real reset reproducibility, complete castling/promotion
identities, positive/negative mate domains and whole delivery reload. They require Stockfish 18
and do not skip silently. `make bot-calibration-verify` runs those controls, the offline fixtures and
the ordinary software/content/governance CI lanes with this same version-18 binary through a
target-local Make selection. It does not change the global engine or inject command-line shell
prefixes; neither target evaluates the 24,000-row population.

Each decision traverses the production registered `stockfish.legal_root_table@1` scheduler,
descriptor and sealed parser. A dedicated engine executes `ucinewgame`, Clear Hash and a successful
ready barrier before **every** depth-8 root, with Threads 1/Hash 16 and all exact legal moves. The
standard descriptor's ordinary display-option reset alone is not a fresh-search proof. No retained
root substitutes for a search. Centipawns, positive mate and negative mate stay separate typed
domains; no scalar mate conversion or downstream grading occurs.

`.cache/bot-calibration/human-reference-pricing.jsonl` is an ordered, fsynced, hash-chained journal.
It carries exact selected-row identities, same-generation reset witnesses and **whole** provider
deliveries saved through `serializeProviderDelivery`, not detached candidate arrays. Resume and
report independently reparse every saved delivery through `parsePersistedProviderDelivery`, check
the exact population/manifest/executor/parser/binary/options identity, and recheck legal-set
completeness. A torn line, crossed root, changed executor or malformed source refuses without
overwriting prior evidence. The exclusive writer lock prevents concurrent appenders; an unexpected
stale lock requires checking the named process, not automatic deletion.

Only a fully verified 24,000-decision journal can publish a complete aggregate receipt.
`make bot-calibration-evaluation-report-update` explicitly saves that aggregate;
`…-report-check` compares it without writing. Raw decisions, engine captures and journal remain
ignored. Pricing supplies candidate values for later statistics, **not** a strength, distribution,
band-identity or human-like verdict. The original manifest and all production policies stay fixed.

## Production profile-arm bridge (D3408)

`profile-arm.ts` resolves all twelve frozen profile arms and both G1/G2 sides to the **whole**
registered catalogue reference and behavior digest. It accepts an existing service root authority,
derives legal/classifier views through the production compiler, and obtains the Maia request from
the production builder: width min(20, legal count), temperature 0.8, top-p 0.92. Complete Stockfish
pricing is independent and never widens that page. The bridge consumes shared scheduler results,
uses the sole production transform/draw, and saves whole provider deliveries. Reload resolves the
same manifest/arm/side/profile and reparses those sources before reconstructing the entire decision.

The normal offline gate tests every registered profile, both contrast bindings, history, castling,
below/above-20 roots, provider-off/guard abstention, copied authorities, valid but crossed pages,
and saved source/decision/binding mutations. Native C1/C2/N controls are deliberately not catalogue
profiles. This is an executable research bridge, not the complete game runner or a calibration
receipt; no native Maia experiment has run from these fixtures.

## Exact-opening capacity, before model output (D3409 / D3410)

```sh
make bot-calibration-opening-capacity
make bot-calibration-opening-report
```

The explicit census reads the same already-cached, checksum-pinned full PGN prefix, not the selected
24,000 decisions. It uses the unchanged full-game legality/eligibility function, then enumerates
**all** decisions in the declared opening window. Each exact six-field FEN/band counts a given
raw-byte game only once; fixed reference halves, clock/turn fields and all four bands survive.
Duplicate blocks cannot increase capacity, and the source's final partial block is excluded.
The command downloads nothing. Source drift refuses before atomic publication and leaves any
existing artifact untouched.

The complete FEN × band × fixed-half count inventory stays ignored in
`.cache/bot-calibration/opening-capacity.json`. The report recomputes every summary from that
inventory, checks source/manifest/instrument identities and census closure, and never selects
positions or queries a model. `…-report-update` publishes only an aggregate receipt;
`…-report-check` checks it without writing. Re-running the census checks reproducibility against
the original source; re-reading the cached inventory alone is not a second PGN replay.

The measured frozen source has **6 qualifying exact FENs**, against **128 required**, after
2,863,498 observations from 323,448 eligible opening games. This capacity experiment is complete;
the band-identity experiment is not. D3410 owns preregistered opening-population repair. Neither
lowering the 100-observation floor, stripping clocks, merging bands nor calibrating on six
positions is authorized. Distribution-reference selection and its priced journal remain unchanged.

## Complete descriptive score-domain audit (D3430)

```sh
make bot-calibration-population-check
make bot-calibration-score-domain-report
make bot-calibration-score-domain-report-check
```

The offline report reads every selected root and whole saved delivery, checks the ordered journal,
original search/reset authority, current sealed parser, fixed reference halves and all 24
band/window/half cells. It reports cp-only, mixed and all-mate roots; positive/negative mate
alternatives and played domains; flat cp-only tables; and exact shared-game cluster multiplicity.
It makes no scalar mate conversion, loss-statistic choice, grade or calibration verdict. Missing,
extra, partial, crossed and counterfeit evidence refuses before a receipt can be published.

The original experiment's executor is verified from immutable commit
`bb53301fb0dd3f3a65b24754c9aafe9eedf212a8`, including all seven original closure files and its
committed receipt. The final journal digest, complete acquisition/parser identity and per-cell
counts must match that original receipt. Later scheduler changes do not restamp historical
measurements or make them appear freshly generated. The audit's own code digest is separate.
Missing historical Git objects refuse; this command is local research, not a runtime/release gate.

The default and `…-report-check` are read-only. `…-report-update` explicitly publishes the small
aggregate receipt; raw decisions, game identifiers and the 1-GiB source journal stay ignored.
The existing evaluation report's stricter current-executor reproduction check is unchanged.
