# D969 Stockfish guard probe

Disposable research instrument for the open bot-policy guard blocker. It asks Stockfish 18 to
price each named root candidate both independently (`MultiPV=1`) and inside one shared candidate-set
search (`MultiPV=N`, `searchmoves <uci...>`) at a fixed `go nodes 50000` bound. Every request follows
`ucinewgame`, `Clear Hash`, `Threads=1`, and `Hash=16`.

It exists to answer the RFC amendment's mechanical questions: whether every candidate returns a
typed cp/mate score, whether root-candidate scores share one perspective, and what completeness
and budget record the production guard would need. It does not authorize a production request or
choose the mate-normalization rule.

Run:

```sh
node tools/d969-stockfish-guard-harness/probe.mjs
```

Override the executable with `SF_CMD`. The default bound is `LIMIT=nodes LIMIT_VALUE=50000`;
`LIMIT=depth LIMIT_VALUE=12` runs the comparison arm.

With a real-engine Tabiya server running at `http://127.0.0.1:3000`, the population arm obtains
production-shaped Maia vectors at every server-discoverable opening, middlegame, endgame and
cross-phase draft-pack root, then compares 25k nodes, 50k nodes and depths 8/10/12. The lower-depth
arms also report their ≥250 cp severe-mask agreement against depth 12:

```sh
node tools/d969-stockfish-guard-harness/population.mts
```

It emits aggregates only. Override the server with `TABIYA_D969_BASE_URL`; set
`TABIYA_D969_PER_PHASE` only when intentionally running a smaller deterministic sample.

To rerun the original R11 retention gates at literal fixed depths, use the retained R11 raw
population rather than substituting the smaller 50-root latency population:

```sh
TABIYA_R11_INPUT_DIR=/private/tmp/d815-bot.example \
  node tools/d969-stockfish-guard-harness/probe-r11-depths.mts

TABIYA_R11_INPUT_DIR=/private/tmp/d815-bot.example \
TABIYA_R11_SF_FILE=sf-d8.jsonl \
TABIYA_R11_MIXED_SCORE_POLICY=abstain \
TABIYA_R11_WRITE=1 \
TABIYA_R11_RESULT_FILE=planning/platform-alignment/bot-policy/d969-depth8-abstain-results.json \
TABIYA_R11_REPORT_FILE=planning/platform-alignment/bot-policy/d969-depth8-abstain-results.md \
  pnpm exec vitest run --config tools/r11-bot-policy-harness/vitest.config.ts
```

Repeat with `sf-d10.jsonl`. The probe takes the 279 FENs and exact legal-root sets from the
committed experiment's retained `sf-d12.jsonl`, but none of the depth-12 scores enter either
shallower run.
