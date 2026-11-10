import { resolvePackPath } from "@chess-tabiya/schema/pack-path";
import { readFileSync } from "node:fs";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";
import { validatePackDocument } from "./pack-validation.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";

describe("Outcome Drill grading", { timeout: 5_000 }, () => {
  it("rejects Pack C v0.1's root-true checkpoint and accepts v0.2", () => {
    const current = withDerivedRequires(JSON.parse(readFileSync(new URL(resolvePackPath("rook-4v3-same-side"), import.meta.url), "utf8")) as DrillPackDefinition);
    const broken = structuredClone(current) as DrillPackDefinition;
    (broken as { version: string }).version = "0.1.0";
    (broken.checkpoints.find((checkpoint) => checkpoint.id === "still-holding") as any).trigger = {
      materialBalance: { perspective: "black", comparison: "atLeast", value: -1 },
    };
    expect(validatePackDocument(broken).issues).toContainEqual(expect.objectContaining({ code: "CHECKPOINT_TRUE_AT_ROOT" }));
    expect(validatePackDocument(current).valid).toBe(true);
  });
});
