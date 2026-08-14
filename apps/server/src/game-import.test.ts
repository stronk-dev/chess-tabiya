import { afterEach, describe, expect, it } from "vitest";

import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { normalizeLichessGameUrl, resolveImportSource } from "./import-source.js";
import { createRestHandler } from "./rest.js";

const PGN = `[Event "Friendly"]
[Site "https://lichess.org/abcd1234"]
[Date "2026.08.14"]
[White "Alice"]
[Black "Bob"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 *`;

const policyConfig = {
  seedMode: "fixed" as const,
  locus: { executedAt: "server" as const, engineIds: [], modelIds: [] },
};

describe("own-game import", () => {
  const stores: SQLiteRunStorage[] = [];
  afterEach(() => { for (const store of stores.splice(0)) store.close(); });

  it("atomically imports a mainline as actor plies without fabricated opponent selections", async () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    stores.push(storage);
    const service = new RunService(storage);
    const imported = await service.importGame({
      id: "import-1",
      side: "white",
      opponentPolicy: { mode: "human_common", targetElo: 1700 },
      policyConfig,
      seed: 12,
      source: { kind: "pgn", pgn: PGN },
      createdAt: "2026-08-14T12:00:00.000Z",
    }, "writer-1");

    expect(imported.run).toMatchObject({ sessionKind: "imported", packId: null, packDigest: null });
    expect(imported.run.nodes.slice(1).map((node) => node.actor)).toEqual(["user", "system", "user", "system"]);
    expect(imported.run.events.some((event) => event.type === "opponent.move_selected")).toBe(false);
    expect(storage.importedGame("import-1")).toMatchObject({
      sourceKind: "pgn_paste",
      result: "*",
      headers: { White: "Alice", Black: "Bob" },
    });
    expect(storage.list(10, 0)[0]).toMatchObject({ title: "Alice – Bob (*)", sessionKind: "imported" });
  });

  it("rejects zero-move, varied, and oversized imports without persisting a run", async () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    stores.push(storage);
    const service = new RunService(storage);
    const base = { side: "white" as const, opponentPolicy: { mode: "human_common" as const }, policyConfig, seed: 1 };
    await expect(service.importGame({ ...base, id: "empty", source: { kind: "pgn", pgn: `[Result "*"]\n\n*` } }, "writer")).rejects.toMatchObject({ code: "IMPORT_INVALID_PGN" });
    await expect(service.importGame({ ...base, id: "varied", source: { kind: "pgn", pgn: `[Result "*"]\n\n1. e4 (1. d4) *` } }, "writer")).rejects.toMatchObject({ code: "IMPORT_INVALID_PGN" });
    await expect(service.importGame({ ...base, id: "large", source: { kind: "pgn", pgn: "x".repeat(65_537) } }, "writer")).rejects.toMatchObject({ code: "IMPORT_INVALID_PGN" });
    expect(storage.list(10, 0)).toEqual([]);
  });

  it("normalizes public lichess ids, fetches once without credentials, and rejects chess.com URLs", async () => {
    expect(normalizeLichessGameUrl("https://www.lichess.org/abcd1234WXYZ/black?foo=1#bar")).toEqual({ gameId: "abcd1234", url: "https://lichess.org/abcd1234" });
    const calls: { input: string; init?: RequestInit }[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      calls.push({ input: String(input), init });
      return new Response(PGN, { status: 200 });
    };
    const resolved = await resolveImportSource({ kind: "lichess", url: "https://lichess.org/abcd1234" }, fetchImpl);
    expect(resolved.sourceKind).toBe("lichess_url");
    expect(calls).toHaveLength(1);
    expect(calls[0]!.input).toContain("evals=false");
    expect(new Headers(calls[0]!.init?.headers).has("authorization")).toBe(false);
    await expect(resolveImportSource({ kind: "lichess", url: "https://chess.com/game/live/1" }, fetchImpl)).rejects.toMatchObject({ code: "IMPORT_SOURCE_UNSUPPORTED" });
  });

  it("binds the closed import and provenance read contracts with typed errors", async () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    stores.push(storage);
    const handler = createRestHandler(new RunService(storage));
    const body = {
      id: "rest-import",
      side: "white",
      opponentPolicy: { mode: "human_common" },
      policyConfig,
      seed: 4,
      source: { kind: "pgn", pgn: PGN },
    };
    const created = await handler(new Request("http://server.test/runs/import", {
      method: "POST",
      headers: { "content-type": "application/json", "x-writer-id": "writer" },
      body: JSON.stringify(body),
    }));
    expect(created.status).toBe(201);
    const record = await handler(new Request("http://server.test/runs/rest-import/import"));
    expect(record.status).toBe(200);
    expect(await record.json()).toMatchObject({ importRecord: { sourceKind: "pgn_paste", result: "*" } });

    const bad = await handler(new Request("http://server.test/runs/import", {
      method: "POST",
      headers: { "content-type": "application/json", "x-writer-id": "writer" },
      body: JSON.stringify({ ...body, id: "bad", extra: true }),
    }));
    expect(bad.status).toBe(400);
    expect(await bad.json()).toMatchObject({ error: { code: "INVALID_REQUEST", message: "Unknown field /extra" } });
  });
});
