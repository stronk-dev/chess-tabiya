// DISPOSABLE provider runner — set D1023_MAIA=1 explicitly.
import { describe, expect, it } from "vitest";

import { runMaiaProbe } from "./maia-probe.mts";

describe("D1023 Maia policy arm", () => {
  const providerTest = process.env.D1023_MAIA === "1" ? it : it.skip;
  providerTest("runs the sealed sample at all four declared bands", async () => {
    const result = await runMaiaProbe();
    expect(result.rows).toBe(Number(process.env.D1023_SAMPLE_LIMIT ?? "0") || 96);
    expect(result.requests).toBeGreaterThan(0);
  }, 1_800_000);
});
