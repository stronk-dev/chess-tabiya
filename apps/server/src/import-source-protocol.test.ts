import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { IMPORT_SOURCE_KINDS, IMPORT_SOURCE_PROTOCOL_MEMBERS, IMPORT_SOURCE_REQUEST_KINDS } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { resolveImportSource } from "./import-source.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };

/** A paste carrying every annotation family a third party writes: prose, engine verdicts, glyphs, arrows and clocks. */
const ANNOTATED = `[Event "Club night"]
[White "Alice"]
[Black "Bob"]
[Result "1-0"]

{Annotated by a coach} 1. e4 {[%eval 0.3] [%clk 0:05:00]} e5?! {Stockfish: inaccuracy, best was c5} 2. Nf3 $1 {[%cal Gg1f3]} Nc6 3. Bb5! a6 $6 1-0`;

describe("import-source-protocol register (rfc/import-source-protocol-register.md)", () => {
  it("the one tuple owns exactly the request and durable-source faces, and each face is non-empty", () => {
    expect([...IMPORT_SOURCE_PROTOCOL_MEMBERS].sort()).toEqual([...IMPORT_SOURCE_PROTOCOL_MEMBERS]);
    expect(IMPORT_SOURCE_PROTOCOL_MEMBERS.every((member) => /^(request|source)_[a-z][a-z0-9_]*$/.test(member))).toBe(true);
    expect([...IMPORT_SOURCE_REQUEST_KINDS]).toEqual(["lichess", "pgn"]);
    expect([...IMPORT_SOURCE_KINDS]).toEqual(["lichess_url", "pgn_paste"]);
  });

  it("the running imported_games CHECK admits exactly the durable source members", () => {
    const directory = mkdtempSync(join(tmpdir(), "import-source-protocol-"));
    try {
      const file = join(directory, "tabiya.sqlite");
      new SQLiteRunStorage(file, { onMigration: () => {} }).close();
      const database = new DatabaseSync(file);
      const sql = String((database.prepare("SELECT sql FROM sqlite_schema WHERE name='imported_games'").get() as { sql: string }).sql);
      database.close();
      const check = /source_kind TEXT NOT NULL CHECK \(source_kind IN \(([^)]*)\)\)/.exec(sql);
      expect(check).not.toBeNull();
      const members = check![1]!.split(",").map((item) => item.trim().replace(/^'|'$/g, "")).sort();
      expect(members).toEqual([...IMPORT_SOURCE_KINDS].sort());
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("the REST parser admits every request member and refuses a kind outside the tuple", async () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    try {
      const handler = createRestHandler(new RunService(storage, { importFetch: async () => new Response("", { status: 404 }) }));
      const post = (source: Record<string, unknown>) => handler(new Request("http://tabiya.test/runs/import", {
        method: "POST",
        headers: { "content-type": "application/json", "x-writer-id": "writer" },
        body: JSON.stringify({ id: `r-${String(source.kind)}`, side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 1, source }),
      }));
      const statuses = await Promise.all(IMPORT_SOURCE_REQUEST_KINDS.map((kind) => post(kind === "pgn" ? { kind, pgn: ANNOTATED } : { kind, url: "https://lichess.org/abcd1234" })));
      // pgn imports; lichess reaches the resolver and returns the stubbed upstream 404 — neither is a parse refusal.
      expect(statuses.map((response) => response.status)).toEqual([404, 201]);
      const refused = await post({ kind: "broadcast", url: "https://lichess.org/broadcast/x/y/z" });
      expect(refused.status).toBe(400);
    } finally {
      storage.close();
    }
  });
});

describe("[[D959]] pasted PGN is stripped at the record boundary", () => {
  it("resolves a paste to headers and moves only, with the licence note saying so", async () => {
    const resolved = await resolveImportSource({ kind: "pgn", pgn: ANNOTATED });
    expect(resolved.sourceKind).toBe("pgn_paste");
    expect(resolved.pgn).toContain('[White "Alice"]');
    expect(resolved.pgn).toMatch(/1\. e4 e5 2\. Nf3 Nc6 3\. Bb5 a6/);
    expect(resolved.pgn).not.toMatch(/coach|Stockfish|inaccuracy|%eval|%clk|%cal|\$1|\$6|\?!|Bb5!/);
    expect(resolved.licenceNote).toContain("annotations stripped");
  });

  it("stores and exports no third-party annotation from a pasted game", async () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    try {
      const service = new RunService(storage);
      const imported = await service.importGame({ id: "paste", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 1, source: { kind: "pgn", pgn: ANNOTATED } }, "writer");
      expect(imported.run.nodes).toHaveLength(7);
      const record = storage.importedGame("paste")!;
      expect(record.pgn).not.toMatch(/coach|Stockfish|%eval|%clk|\$1/);
      expect(record.headers).toMatchObject({ White: "Alice", Black: "Bob" });
      expect(record.result).toBe("1-0");
    } finally {
      storage.close();
    }
  });
});
