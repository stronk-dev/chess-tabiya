# D894 runtime opening-identity instrument

Disposable Wave-C C3 research instrument. It builds an exact terminal-position index from the five
TSV files at the repository's pinned `lichess-org/chess-openings` commit and measures exact runtime
reach over the sealed imported-game population. It does not implement the product adapter.

Source commit: `4b8622759e7ae6f93f011cc6c83a3823401ab45e` (the value pinned in
`apps/server/src/sourcing/openings.ts`). Files fetched 2026-08-22:

| file | SHA-256 |
|---|---|
| `a.tsv` | `41722fa3d44f294357326fe2ca1b956d9e56490b30efcfa68db61114c9df7e10` |
| `b.tsv` | `310f0997d5a26ac0284e56349b44ff39ce508a53b1a04bfbe57318470844b168` |
| `c.tsv` | `b2e64f32e42e6418b327d03a55af65f3a18e762f7cbc0efffc7e9d1ed3aa7343` |
| `d.tsv` | `58cad40b886bd499717eabcce281d4bfcf00eeadbdc00552f42042cf4aac50d2` |
| `e.tsv` | `f1f8494f488f660e284f23527d5acfbeccdbbc3acc76e74f05d125f39d2f8a74` |

Run with a directory containing files named `tabiya-openings-{a..e}.tsv`:

```sh
TABIYA_OPENINGS_DIR=/path/to/directory \
  pnpm exec vitest run --config tools/d894-opening-runtime-harness/vitest.config.ts
```

The output distinguishes source rows, unique named-endpoint keys, all-prefix catalogue keys,
exact per-node reach and stale-last-match exposure. The pre-registered endpoint-ambiguity
expectation is allowed to fail: the source may prove its named endpoints unique while its prefixes
fan out to many descendant names. FTS/LLM matching is deliberately absent.
