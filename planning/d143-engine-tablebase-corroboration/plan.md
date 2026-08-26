# D143 engine/tablebase corroboration — preregistration

Date: 2026-08-26

Status: complete; two full-population runs landed

Ledger owner: D143

## Question

When the committed Syzygy positions are evaluated through the repository's Stockfish
authoring profile, what relationship actually holds between exact side-to-move W/D/L and
the engine's bounded cp/mate output? This is a research instrument, not a production
collector and not authority to collapse the two evidence kinds.

## Fixed population and instruments

- Population: every distinct FEN carrying `tablebase_result` in
  `content/drafts/*.evidence.json`, deduplicated by exact FEN. The pre-run census is 288
  FENs from 341 records: 129 win, 129 loss, 83 draw records before deduplication.
- Exact reference: the already committed Syzygy `category`, `dtz`, `dtm`, terminal flags,
  and piece count. No new HTTP reading is taken.
- Bounded reading: local Stockfish through the authoring profile at depth 22, one thread,
  16 MB hash and MultiPV 1. The engine is reset between positions. Raw UCI scores are
  side-to-move; this is the same score the production executor later converts to White
  perspective.
- Environment and engine identity are recorded in the result artifact. FEN order is
  lexical so reruns address the same population in the same order.

## Able-to-fail controls

1. The harness refuses duplicate FENs whose committed tablebase payloads disagree.
2. It refuses any missing/unknown category or an engine result without a typed cp/mate
   score.
3. At least one exact win, loss and draw must be present after deduplication.
4. A perspective control checks that alternating win/loss positions from a mating line
   remain alternating when compared in the common side-to-move frame.
5. The report keeps mate and cp typed; it may not replace mate with a sentinel cp value.

## Measurements fixed before results

1. Typed result counts and engine/Syzygy confusion by exact category.
2. For exact wins/losses, directional agreement of positive/negative cp or mate sign.
3. For exact draws, the absolute cp distribution.
4. Threshold table for cp deadbands `[0, 25, 50, 100, 200, 500]`: values inside the
   deadband predict draw, positive values predict win and negative values predict loss.
   These thresholds are diagnostic; the run does not choose a new one post hoc.
5. The same results stratified by piece count, side to move, halfmove-clock bucket, and
   terminal/non-terminal state.
6. Named counterexamples: exact wins nearest zero, exact draws with the largest absolute
   score, sign contradictions, and typed-mate disagreements.

## Decision rule

No cp deadband is eligible as a lossless cross-source normalization unless, on this fixed
population, it classifies at least 95% of exact draws as draws **and** at least 95% of exact
wins/losses as decisive with the correct sign. Failure means cp/mate and WDL/DTZ remain
separate typed operands and any Review, bot, grade or pack consumer must state a
source-local rule. Passing would justify only a follow-up validation population, not a
production conversion by itself.

## Outputs and closeout

- Disposable harness: `tools/d143-engine-tablebase-corroboration-harness/`
- Raw result: `planning/d143-engine-tablebase-corroboration/results.json`
- Dossier: `design/research/engine-tablebase-corroboration.md`
- Required closeout: coverage-matrix row, D143 ledger update, any touched gate, and an
  append-only exploration-log entry.

## Result receipt

Both Stockfish 18 runs completed all 288 distinct FENs and produced byte-identical
observations. The preregistered ±25 cp screen separated the committed exact outcomes
perfectly, qualifying only a future independent validation population. Production
normalization remains refused; see `design/research/engine-tablebase-corroboration.md`.
