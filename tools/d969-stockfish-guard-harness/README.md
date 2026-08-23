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
