// DISPOSABLE provider runner — set D1023_STOCKFISH=1 explicitly.
import { describe, expect, it } from "vitest";

import { runStockfishProbe } from "./stockfish-probe.mts";

describe("D1023 Stockfish policy arm", () => {
  const providerTest = process.env.D1023_STOCKFISH === "1" ? it : it.skip;
  providerTest("runs the sealed sample at both declared depths", async () => {
    const result = await runStockfishProbe();
    expect(result.rows).toBe(Number(process.env.D1023_SAMPLE_LIMIT ?? "0") || 96);
    expect(result.engine).not.toBe("unknown");
  }, 900_000);
});
