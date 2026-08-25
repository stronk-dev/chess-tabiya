import { afterEach, describe, expect, it } from "vitest";
import type { OpponentSelection } from "@chess-tabiya/runtime";

import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { normalizeLichessGameUrl, normalizeLichessStudyUrl, resolveImportSource, resolveStudySource, stripPgnAnnotations } from "./import-source.js";
import { createRestHandler } from "./rest.js";
import { EvidenceJobQueue, type EvidenceExecutor } from "./evidence-queue.js";

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

  it("seals the imported source tip while preserving rewind-and-branch rehearsal", async () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    stores.push(storage);
    const executor: EvidenceExecutor = { async execute() { return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } }; } };
    const service = new RunService(storage, { evidenceQueue: new EvidenceJobQueue(executor, { maxConcurrency: 1 }) });
    const imported = await service.importGame({
      id: "import-sealed",
      side: "white",
      opponentPolicy: { mode: "human_common" },
      policyConfig,
      seed: 13,
      source: { kind: "pgn", pgn: PGN },
    }, "writer-sealed");
    const selection: OpponentSelection = {
      moveUci: "d2d4",
      policyModeApplied: "human_common",
      engine: { id: "maia", name: "Maia", version: "3", seedHonored: true },
    };

    expect(() => service.move("import-sealed", "writer-sealed", "d2d4")).toThrow(/source mainline is immutable/u);
    expect(() => service.opponentPly("import-sealed", "writer-sealed", selection)).toThrow(/source mainline is immutable/u);
    expect(storage.read("import-sealed")!.run.nodes).toHaveLength(imported.run.nodes.length);

    service.rewind("import-sealed", "writer-sealed", { nodeId: imported.run.nodes[0]!.id });
    const branched = service.move("import-sealed", "writer-sealed", "d2d4");
    expect(branched.run.branches).toHaveLength(2);
    expect(branched.run.branches[0]!.id).toBe(imported.run.branches[0]!.id);
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
      calls.push({ input: String(input), ...(init === undefined ? {} : { init }) });
      return new Response(PGN, { status: 200 });
    };
    const resolved = await resolveImportSource({ kind: "lichess", url: "https://lichess.org/abcd1234" }, fetchImpl);
    expect(resolved.sourceKind).toBe("lichess_url");
    expect(calls).toHaveLength(1);
    expect(calls[0]!.input).toContain("evals=false");
    expect(new Headers(calls[0]!.init?.headers).has("authorization")).toBe(false);
    await expect(resolveImportSource({ kind: "lichess", url: "https://chess.com/game/live/1" }, fetchImpl)).rejects.toMatchObject({ code: "IMPORT_SOURCE_UNSUPPORTED" });
  });

  it("fetches one explicit public study through the credential-free export contract",async()=>{
    expect(normalizeLichessStudyUrl("https://lichess.org/study/Ab12cd34/chapter")).toEqual({studyId:"Ab12cd34",url:"https://lichess.org/study/Ab12cd34"});
    const calls:string[]=[];const fetchImpl:typeof fetch=async(input,init)=>{calls.push(String(input));expect(new Headers(init?.headers).has("authorization")).toBe(false);return new Response(PGN,{status:200});};
    await expect(resolveStudySource("https://lichess.org/study/Ab12cd34",fetchImpl)).resolves.toMatchObject({sourceKind:"lichess_study",sourceUrl:"https://lichess.org/study/Ab12cd34"});expect(calls).toEqual(["https://lichess.org/api/study/Ab12cd34.pgn"]);
    await expect(resolveStudySource("https://chess.com/study/Ab12cd34",fetchImpl)).rejects.toMatchObject({code:"IMPORT_SOURCE_UNSUPPORTED"});
  });

  it("strips study prose, glyphs, and graphical annotations while preserving its move tree", async () => {
    const annotated = `[Event "Imported study"]\n[Result "*"]\n\n{chapter introduction} 1. e4! {main prose [%cal Ge2e4]} e5 (1... c5?! {variation prose}) 2. Nf3 $1 *`;
    const stripped = stripPgnAnnotations(annotated);
    expect(stripped).toContain('[Event "Imported study"]');
    expect(stripped).toContain("1. e4 e5");
    expect(stripped).toContain("1... c5");
    expect(stripped).not.toMatch(/chapter introduction|main prose|variation prose|%cal|\$1|e4!|c5\?/);

    const fetchImpl: typeof fetch = async () => new Response(annotated, { status: 200 });
    const resolved = await resolveStudySource("https://lichess.org/study/Ab12cd34", fetchImpl);
    expect(resolved.pgn).toBe(stripped);
    expect(resolved.licenceNote).toContain("annotations stripped");
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

  it("completes the N+1 evidence pass durably and makes story reads idempotent", async () => {
    let score = 0;
    const executor: EvidenceExecutor = { async execute(job) { score -= 200; return { kind: "eval", source: "engine_validated", values: { centipawns: score, engineId: "mock-judge", requestedMovetimeMs: job.movetime } }; } };
    const queue = new EvidenceJobQueue(executor, { maxConcurrency: 1 });
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    stores.push(storage);
    const service = new RunService(storage, { evidenceQueue: queue });
    const imported = await service.importGame({ id: "story-import", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "story-writer");
    expect(imported.evidencePass.jobs).toBe(imported.run.nodes.length);
    await queue.whenIdle();
    service.reveal(imported.run.id, "story-writer");
    for (const result of queue.page(imported.run.id).results) service.applyEvidence(imported.run.id, "story-writer", result.seq);
    const principal = { learnerId: "__legacy", handle: "__legacy" } as const;
    const story = service.story(imported.run.id, principal);
    expect(story).toMatchObject({ ready: true, pendingEvidence: 0, side: "white", outcome: { kind: "unfinished" } });
    expect(story.moments.some((moment) => moment.kinds.includes("eval_pivot"))).toBe(true);
    expect(queue.outstanding(imported.run.id)).toEqual([]);
    expect(service.story(imported.run.id, principal).pendingEvidence).toBe(0);
  });

  it("does not let a tablebase failure suppress story eval evidence for the same node", async () => {
    const executor: EvidenceExecutor = { async execute() { return { kind: "eval", source: "engine_validated", values: { centipawns: 12 } }; } };
    const queue = new EvidenceJobQueue(executor, { maxConcurrency: 1 });
    queue.enqueue({
      runId: "story-kind-isolation",
      nodeId: "story-kind-isolation:node:0",
      fen: "8/8/8/8/8/8/4K3/6k1 w - - 0 1",
      kind: "tablebase",
    });
    await queue.whenIdle();
    expect(queue.failures("story-kind-isolation")).toEqual([
      expect.objectContaining({ nodeId: "story-kind-isolation:node:0", kind: "tablebase" }),
    ]);

    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    stores.push(storage);
    const service = new RunService(storage, { evidenceQueue: queue });
    const imported = await service.importGame({
      id: "story-kind-isolation",
      side: "white",
      opponentPolicy: { mode: "human_common" },
      policyConfig,
      seed: 4,
      source: { kind: "pgn", pgn: PGN },
    }, "story-writer");

    expect(imported.evidencePass.jobs).toBe(imported.run.nodes.length);
    expect(queue.outstanding(imported.run.id)).toEqual(expect.arrayContaining([
      expect.objectContaining({ nodeId: imported.run.nodes[0]!.id, kind: "eval" }),
    ]));
  });
});
