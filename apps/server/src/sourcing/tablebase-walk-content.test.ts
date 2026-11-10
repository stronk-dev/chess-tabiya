import { resolvePackPath } from "@chess-tabiya/schema/pack-path";
import { readFileSync } from "node:fs";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";
import { tablebaseWalk } from "./tablebase-walk.js";
const philidor = JSON.parse(readFileSync(new URL(resolvePackPath("philidor-third-rank-hold"), import.meta.url), "utf8")) as DrillPackDefinition;

describe("tablebase authoring walker", { timeout: 5_000 }, () => {
  it("enumerates the Philidor root from the learner perspective with explicit fixture abstentions", async () => {
    const report = await tablebaseWalk({ pack: philidor, offline: true }) as any;
    expect(report.schema).toBe("tabiya.sourcing.walk.v1");
    expect(report.nodes[0].moves).toContainEqual(expect.objectContaining({ uci: "h6h8", learnerCategory: "loss" }));
    expect(report.abstentions.filter((item: any) => item.pointer.startsWith("/start/fen/moves/") && item.reason === "offline_fixture_missing")).toHaveLength(11);
  });

  it("fails closed at the query budget", async () => {
    await expect(tablebaseWalk({ pack: philidor, offline: true, maxQueries: 1 })).rejects.toMatchObject({ code: "WALK_QUERY_BUDGET_EXCEEDED" });
  });
});
