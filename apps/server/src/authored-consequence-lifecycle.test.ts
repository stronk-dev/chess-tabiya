import { readFileSync, readdirSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { validatePackDocument, type PackShapeLookup } from "./pack-validation.js";
import { ShapeRegistry } from "./shape-registry.js";

function document(name: string): DrillPackDefinition {
  return JSON.parse(readFileSync(new URL(`../../../content/drafts/${name}.json`, import.meta.url), "utf8")) as DrillPackDefinition;
}

const chain = JSON.parse(readFileSync(
  new URL("../../../content/shapes/closed-centre-chain.json", import.meta.url),
  "utf8",
));
const shapes: PackShapeLookup = {
  get: (id) => id === "closed-centre-chain" ? { document: chain } : undefined,
};

describe("authored consequence lifecycle", () => {
  it("refuses an absorbing success before authored descendants and admits it at a leaf", () => {
    const migrated = document("closed-centre-chain-black-base-strike");
    expect(validatePackDocument(migrated, { shapes }).issues.some((issue) =>
      issue.code === "OBJECTIVE_ABSORBS_BEFORE_AUTHORED_BOUNDARY")).toBe(false);

    const blocked = structuredClone(migrated) as any;
    blocked.objective.successConditions[0].to = "achieved";
    expect(validatePackDocument(blocked, { shapes }).issues).toContainEqual(expect.objectContaining({
      code: "OBJECTIVE_ABSORBS_BEFORE_AUTHORED_BOUNDARY",
      path: "/objective/successConditions/0",
    }));

    const leaf = structuredClone(blocked) as any;
    leaf.spine[0].children[0].children = [];
    expect(validatePackDocument(leaf, { shapes }).issues.some((issue) =>
      issue.code === "OBJECTIVE_ABSORBS_BEFORE_AUTHORED_BOUNDARY")).toBe(false);
  });

  it("refuses duplicate type-owned tempo verdicts but permits another authored predicate", () => {
    const panov = document("iqp-white-panov-attack") as any;
    panov.objective.successConditions = [{
      kind: "timing_window",
      windowId: "arrangement-before-the-second-defender",
      verdict: "in_time",
      to: "achieved",
    }];
    expect(validatePackDocument(panov).issues).toContainEqual(expect.objectContaining({
      code: "PLAN_WINDOW_CONDITION_REDUNDANT",
      path: "/objective/successConditions/0",
    }));

    panov.objective.successConditions = [{
      kind: "structural_feature",
      feature: { kind: "feature", feature: { kind: "piece_count", color: "white", role: "king", basis: "count", comparison: "equal", count: 1 } },
      to: "preserved",
    }];
    expect(validatePackDocument(panov).issues.some((issue) =>
      issue.code === "PLAN_WINDOW_CONDITION_REDUNDANT")).toBe(false);
  });

  it("keeps all preserve-plan-window packs on their type-owned timing rules", () => {
    const drafts = new URL("../../../content/drafts/", import.meta.url);
    const duplicates = readdirSync(drafts)
      .filter((name) => name.endsWith(".json") && !name.endsWith(".browser.json") && !/\.(?:evidence|job|sources)\.json$/u.test(name))
      .flatMap((name) => {
        const pack = JSON.parse(readFileSync(new URL(name, drafts), "utf8")) as DrillPackDefinition;
        if (pack.objective.type !== "preserve_plan_window") return [];
        return (pack.objective.successConditions ?? []).filter((condition) => condition.kind === "timing_window").map(() => pack.id);
      });
    expect(duplicates).toEqual([]);
  });

  it("keeps every draft free of absorbing authored continuations", async () => {
    const drafts = new URL("../../../content/drafts/", import.meta.url);
    const registry = await ShapeRegistry.loadDefault();
    const blockers = readdirSync(drafts)
      .filter((name) => name.endsWith(".json") && !name.endsWith(".browser.json") && !/\.(?:evidence|job|sources)\.json$/u.test(name))
      .flatMap((name) => validatePackDocument(
        JSON.parse(readFileSync(new URL(name, drafts), "utf8")),
        { shapes: registry },
      ).issues
        .filter((issue) => issue.code === "OBJECTIVE_ABSORBS_BEFORE_AUTHORED_BOUNDARY")
        .map((issue) => `${name}: ${issue.message}`));
    expect(blockers).toEqual([]);
  });
});
