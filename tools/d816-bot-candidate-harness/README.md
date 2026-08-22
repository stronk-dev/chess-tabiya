# D816 bot-candidate sharpness harness

**Disposable research instrument.** This harness is permitted by RFC-0000's exploration gate and
answers D816. It does not ship in production, grade a learner move, or create chess prose.

It joins three already-established instruments on the fixed R9/R11 279-position population:

- the committed Lichess explorer snapshot used by R9;
- the repo's SAN→UCI mapping through chessops; and
- R4's unmodified full-legal-move Stockfish depth-12 probe.

For each position it measures engine-price geometry (best/second gap, the fraction of legal moves
at least 250 cp behind the best, the fraction within 50 cp, and loss quantiles). For each explorer
band it measures the listed human mass assigned to those engine-priced moves. The analyser reports
both a lower bound over the explorer's full total and a conditional value over listed moves; it
never invents engine values for the explorer's unlisted tail.

Run after regenerating the inputs according to
`tools/maia-wdl-agreement-harness/README.md`:

```sh
node tools/d816-bot-candidate-harness/analyze.mjs \
  /tmp/d816/probe-set.json \
  /tmp/d816/san-map.json \
  /tmp/d816/sf-d12.jsonl \
  tools/d816-bot-candidate-harness/out/summary.json
```

The committed summary is the audit record. Raw engine JSONL is regenerable and is not committed.
