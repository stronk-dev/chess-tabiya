// Disposable D3512 source-boundary controls, not Stockfish/chess/latency evidence.
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { CostStockfish, SourceFailure } from "./cost-stockfish.mjs";

const fixture = fileURLToPath(new URL("cost-uci-fixture.mjs", import.meta.url));
const fen = "4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1";

for (const mode of ["silent", "crash", "invalid"]) {
  test(`${mode}: retain the distinction between a failed query and a failed adapter`, async () => {
    const source = new CostStockfish(process.execPath, { args: [fixture, mode], timeoutMs: 300 });
    try {
      await source.initialize();
      let writes = 0;
      const write = source.child.stdin.write.bind(source.child.stdin);
      source.child.stdin.write = (...args) => { writes += 1; return write(...args); };
      const operands = { provider: "stockfish", sourceDigest: source.sourceDigest, fen, budget: "depth8", multiPv: 1 };
      const failure = await source.execute(operands).then(() => assert.fail("fixture must fail"), error => error);
      assert.ok(failure instanceof SourceFailure);
      assert.equal(failure.state, mode === "silent" ? "timed_out" : mode === "crash" ? "unavailable" : "invalid");
      assert.ok(writes > 0, "the first query actually writes to the real subprocess");
      const before = writes;
      const next = await source.execute(operands).then(() => assert.fail("fixture must fail"), error => error);
      assert.ok(next instanceof SourceFailure);
      if (mode === "invalid") {
        assert.ok(writes > before, "a nonfatal parser refusal permits another real query");
        assert.equal(next.state, "invalid");
      } else {
        assert.equal(writes, before, "a terminal adapter refusal writes no new UCI command");
        assert.ok(["timed_out", "unavailable"].includes(next.state));
        // The inherited failure's elapsed time is not a new search-timeout sample.
        // Do not pin an absolute duration or make a production recovery decision.
      }
    } finally {
      await source.close();
    }
  });
}
