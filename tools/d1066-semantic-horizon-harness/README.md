# D1066 semantic-horizon harness

Disposable research instrument. It replays the already-recorded D1061 PVs through the shipped
semantic event compiler and R2 selector. It does not query an engine and is not production code.

Run:

```sh
pnpm exec vitest run --config tools/d1066-semantic-horizon-harness/vitest.config.ts
```

The main pass writes the stageability/selection/latency census. The sequence pass independently
runs every registered 3–5-edge operand detector over the fixed depth-12 PVs.
