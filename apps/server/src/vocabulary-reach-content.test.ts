import { describe, expect, it } from "vitest";

import { constructReachReport } from "./pack-check.js";

describe("vocabulary reach over the committed corpus", () => {
  it("keeps a repo-level reach census for admitted constructs", async () => {
    const rows = await constructReachReport();
    expect(rows.map((row) => row.construct)).toEqual([
      "variantOf", "retryVariants", "plan_consequence", "tempo:in_time", "tempo:too_slow", "tempo:premature", "tempo:outpaced", "tempo:over_budget",
    ]);
    expect(rows.find((row) => row.construct === "variantOf")?.count).toBeGreaterThanOrEqual(2);
    expect(rows.every((row) => Number.isInteger(row.count) && row.count >= 0)).toBe(true);
  });
});
