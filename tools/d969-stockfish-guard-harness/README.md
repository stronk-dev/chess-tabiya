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
