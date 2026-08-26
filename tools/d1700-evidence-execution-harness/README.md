# D1654/D1700 evidence-execution contract harness

Disposable exploration instrument under `rfc/0000-rfc-process.md` §Exploration gate. It measures
the complete compiled manifest rather than one proposed collector. It is not production code.

The harness expands every literal derivation alternative through its dependency graph, retaining
the exact nested choices, non-local source requirements and effective latency. It joins those paths
to bindings, reproduces the transitive provider-off bypass, and computes both the immediate and
fixed-point confidence repairs. Equal-cost alternatives remain distinct.

Run with the repository's Node 24 toolchain:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1700-evidence-execution-harness/vitest.config.ts
```
