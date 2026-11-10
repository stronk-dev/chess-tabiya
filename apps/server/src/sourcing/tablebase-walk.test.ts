import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { tablebaseWalk } from "./tablebase-walk.js";
import { fixtureTablebaseQuery, TABLEBASE_FIXTURE_FEN } from "./syzygy.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("tablebase authoring walker", () => {


  it("reuses immutable online answers without a second query", async () => {
    const cacheRoot = await mkdtemp(resolve(tmpdir(), "tabiya-tablebase-walk-"));
    temporaryDirectories.push(cacheRoot);
    let requests = 0;
    const query = async (fen: string) => {
      requests += 1;
      return fixtureTablebaseQuery(fen);
    };
    const options = {
      fens: [TABLEBASE_FIXTURE_FEN],
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
