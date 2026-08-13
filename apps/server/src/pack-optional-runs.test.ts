import {
  attachEvidence,
  type OpponentSelection,
} from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { EvidenceJobQueue, type EvidenceExecutor } from "./evidence-queue.js";
import { ServerError } from "./errors.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-08-12T12:00:00.000Z";
const executor: EvidenceExecutor = {
  async execute() {
    return { kind: "eval", source: "engine_validated", values: { centipawns: 24 } };
  },
};
const selection = (moveUci: string): OpponentSelection => ({
  moveUci,
  policyModeApplied: "human_common",
  engine: { id: "mock", name: "Mock", version: "1", seedHonored: true },
});

function body(id: string, targetElo = 1600) {
  return {
    id,
    session: {
      kind: "position" as const,
      start: { fen: FEN, side: "white" as const },
      feedbackPolicy: "attempt_end" as const,
      opponentPolicy: { mode: "human_common" as const, targetElo },
    },
    policyConfig: {
      seedMode: "per_branch" as const,
      locus: { executedAt: "server" as const, engineIds: [], modelIds: [] },
    },
    seed: 19,
    createdAt: at,
  };
}

function call(
  handler: ReturnType<typeof createRestHandler>,
  method: string,
  path: string,
  value?: unknown,
  writer = "writer-a",
): Promise<Response> {
  return handler(new Request(`http://tabiya.test${path}`, {
    method,
    headers: {
      "x-writer-id": writer,
      ...(value === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(value === undefined ? {} : { body: JSON.stringify(value) }),
  }));
}

describe("pack-optional position runs", () => {
  const stores: SQLiteRunStorage[] = [];

  afterEach(() => {
    for (const storage of stores.splice(0)) storage.close();
  });

  function setup(withQueue = true) {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    stores.push(storage);
    const queue = withQueue ? new EvidenceJobQueue(executor) : undefined;
    const service = new RunService(storage, queue === undefined ? {} : { evidenceQueue: queue });
    return { storage, queue, service, handler: createRestHandler(service) };
  }

  it("plays, reveals, re-closes, branches, compares, and exports a position session", async () => {
    const { queue, handler } = setup();
    const created = await call(handler, "POST", "/runs", body("position-loop"));
    expect(created.status).toBe(201);
    const initial = await created.json() as { run: { sessionKind: string; packId: null; sessionDigest: string; nodes: { id: string }[] } };
    expect(initial.run).toMatchObject({ sessionKind: "position", packId: null });
    expect(initial.run.sessionDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
    const rootId = initial.run.nodes[0]!.id;

    expect((await call(handler, "POST", "/runs/position-loop/moves", { uci: "e2e4", at })).status).toBe(200);
    await queue!.whenIdle();
    expect(await (await call(handler, "GET", "/runs/position-loop/evidence?sinceSeq=0")).json()).toEqual({ results: [], nextSeq: 0 });

    const foreignReveal = await call(
      handler,
      "POST",
      "/runs/position-loop/reveal",
      { at },
      "writer-b",
    );
    expect(foreignReveal.status).toBe(409);
    const revealed = await call(handler, "POST", "/runs/position-loop/reveal", { at });
    expect(revealed.status).toBe(200);
    expect((await revealed.json() as { emitted: { type: string }[] }).emitted.map((event) => event.type)).toEqual(["feedback.revealed"]);
    const evidence = await (await call(handler, "GET", "/runs/position-loop/evidence?sinceSeq=0")).json() as { results: { seq: number }[] };
    expect(evidence.results).toHaveLength(1);
    expect((await call(handler, "POST", "/runs/position-loop/evidence", { resultSeq: evidence.results[0]!.seq, at })).status).toBe(200);
    const appliedGraph = await (await call(handler, "GET", "/runs/position-loop/graph")).text();
    expect(appliedGraph).toContain("engine:evidence-job-1");
    const duplicateReveal = await call(handler, "POST", "/runs/position-loop/reveal", { at });
    expect((await duplicateReveal.json() as { emitted: unknown[] }).emitted).toEqual([]);

    expect((await call(handler, "POST", "/runs/position-loop/moves", { selection: selection("e7e5"), at })).status).toBe(200);
    await queue!.whenIdle();
    expect(await (await call(handler, "GET", "/runs/position-loop/evidence?sinceSeq=0")).json()).toEqual({ results: [], nextSeq: 0 });
    const closedApply = await call(handler, "POST", "/runs/position-loop/evidence", { resultSeq: 2, at });
    expect(closedApply.status).toBe(409);
    expect(await (await call(handler, "GET", "/runs/position-loop/graph")).text()).toContain("engine:evidence-job-1");

    expect((await call(handler, "POST", "/runs/position-loop/rewind", { nodeId: rootId, at })).status).toBe(200);
    expect((await call(handler, "POST", "/runs/position-loop/moves", { uci: "d2d4", at })).status).toBe(200);
    const graph = await (await call(handler, "GET", "/runs/position-loop/graph")).json() as { graph: { branches: { id: string }[] } };
    const compared = await call(handler, "POST", "/runs/position-loop/compare", {
      branchIds: graph.graph.branches.map((branch) => branch.id),
    });
    expect(compared.status).toBe(200);
    const authored = await call(handler, "GET", "/runs/position-loop/authored-feedback");
    expect(await authored.json()).toEqual({ items: [], hasWithheldAuthoredContent: false });
    const pgn = await (await call(handler, "GET", "/runs/position-loop/pgn")).text();
    expect(pgn).toContain('[Event "Tabiya session: position"]');
    expect(pgn).toContain(`[TabiyaSession "${initial.run.sessionDigest}"]`);
    expect(pgn).not.toContain("TabiyaPack");
  });

  it("withholds injected durable evidence at every read surface before reveal", async () => {
    const { storage, service, handler } = setup();
    const run = await service.create(body("leak-run"), "writer-a");
    const main = service.move("leak-run", "writer-a", "e2e4", { at }).run;
    service.rewind("leak-run", "writer-a", { nodeId: run.activeCursor.nodeId }, at);
    const alternative = service.move("leak-run", "writer-a", "d2d4", { at }).run;
    const injected = attachEvidence(
      alternative,
      main.activeCursor.nodeId,
      ["engine:injected"],
      { kind: "eval", source: "engine_validated", values: { centipawns: 99 } },
      at,
    ).run;
    storage.save(injected, "writer-a");

    const graph = await (await call(handler, "GET", "/runs/leak-run/graph")).json();
    expect(JSON.stringify(graph)).not.toContain("engine:injected");
    const events = await (await call(handler, "GET", "/runs/leak-run/events?sinceSeq=0")).json();
    expect(JSON.stringify(events)).not.toContain("engine:injected");
    expect(events).toMatchObject({ withheld: true });
    const comparison = await (await call(handler, "POST", "/runs/leak-run/compare", {
      branchIds: injected.branches.map((branch) => branch.id),
    })).json();
    expect(JSON.stringify(comparison)).not.toContain("engine:injected");
    const apply = await call(handler, "POST", "/runs/leak-run/evidence", { resultSeq: 1, at });
    expect(apply.status).toBe(409);
    expect(await apply.json()).toMatchObject({ error: { code: "FEEDBACK_WITHHELD" } });
  });

  it("rejects unknown create fields and unsupported position policy without persisting", async () => {
    const { storage, handler } = setup();
    const unknown = await call(handler, "POST", "/runs", {
      ...body("unknown-field"),
      policyConfigDigest: `sha256:${"3".repeat(64)}`,
    });
    expect(unknown.status).toBe(400);
    expect(await unknown.json()).toMatchObject({
      error: { code: "INVALID_REQUEST", message: "Unknown field /policyConfigDigest" },
    });
    const nestedUnknown = structuredClone(body("nested-unknown")) as Record<string, unknown>;
    const config = nestedUnknown.policyConfig as { locus: { engineIds: Record<string, unknown>[] } };
    config.locus.engineIds = [{ id: "engine", version: "1", zed: true, name: "extra" }];
    const nested = await call(handler, "POST", "/runs", nestedUnknown);
    expect(nested.status).toBe(400);
    expect(await nested.json()).toMatchObject({
      error: {
        message: "Unknown field /policyConfig/locus/engineIds/0/name",
      },
    });
    const positionWithPack = structuredClone(body("position-with-pack")) as Record<string, unknown>;
    (positionWithPack.session as Record<string, unknown>).packId = "not-authoritative";
    expect((await call(handler, "POST", "/runs", positionWithPack)).status).toBe(400);
    const packWithFeedback = {
      ...body("pack-with-feedback"),
      session: { kind: "pack", packId: "missing", feedbackPolicy: "attempt_end" },
    };
    expect((await call(handler, "POST", "/runs", packWithFeedback)).status).toBe(400);
    const theory = body("position-theory") as Record<string, unknown>;
    theory.session = {
      ...(theory.session as object),
      opponentPolicy: { mode: "theory_strict" },
    };
    const refused = await call(handler, "POST", "/runs", theory);
    expect(refused.status).toBe(400);
    expect(storage.read("unknown-field")).toBeUndefined();
    expect(storage.read("position-theory")).toBeUndefined();
    expect(storage.read("nested-unknown")).toBeUndefined();
  });

  it("fails a move loudly and atomically when no evidence queue is configured", async () => {
    const { storage, service } = setup(false);
    await service.create(body("no-evidence"), "writer-a");
    expect(() => service.move("no-evidence", "writer-a", "e2e4", { at })).toThrowError(
      expect.objectContaining<Partial<ServerError>>({ code: "EVIDENCE_UNAVAILABLE" }),
    );
    expect(storage.read("no-evidence")!.run.events).toHaveLength(1);
  });
});
