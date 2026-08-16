import { resolvePackPath } from "@chess-tabiya/schema/pack-path";

import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { afterEach, describe, expect, it } from "vitest";

import { tablebaseWalk } from "./tablebase-walk.js";
import { fixtureTablebaseQuery } from "./syzygy.js";

const philidor = JSON.parse(readFileSync(new URL(resolvePackPath("philidor-third-rank-hold"), import.meta.url), "utf8")) as DrillPackDefinition;
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("tablebase authoring walker", () => {
  it("enumerates the Philidor root from the learner perspective with explicit fixture abstentions", async () => {
    const report = await tablebaseWalk({ pack: philidor, offline: true }) as any;
    expect(report.schema).toBe("tabiya.sourcing.walk.v1");
    expect(report.nodes[0].moves).toContainEqual(expect.objectContaining({ uci: "h6h8", learnerCategory: "loss" }));
    expect(report.abstentions.filter((item: any) => item.pointer.startsWith("/start/fen/moves/") && item.reason === "offline_fixture_missing")).toHaveLength(11);
  });

  it("fails closed at the query budget", async () => {
    await expect(tablebaseWalk({ pack: philidor, offline: true, maxQueries: 1 })).rejects.toMatchObject({ code: "WALK_QUERY_BUDGET_EXCEEDED" });
  });

  it("reuses immutable online answers without a second query", async () => {
    const cacheRoot = await mkdtemp(resolve(tmpdir(), "tabiya-tablebase-walk-"));
    temporaryDirectories.push(cacheRoot);
    let requests = 0;
    const query = async (fen: string) => {
      requests += 1;
      return fixtureTablebaseQuery(fen);
    };
    const options = {
      fens: [philidor.start.fen],
      enumerate: "none" as const,
      cacheRoot,
      query,
    };
    await tablebaseWalk(options);
    expect(requests).toBe(1);
    await tablebaseWalk(options);
    expect(requests).toBe(1);
  });
});
