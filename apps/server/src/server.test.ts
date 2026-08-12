import { mkdtempSync, rmSync } from "node:fs";
import { once } from "node:events";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";

import {
  RuntimeError,
  type OpponentSelection,
} from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { createHttpServer, createRestHandler } from "./rest.js";
import { EvidenceJobQueue, type EvidenceExecutor } from "./evidence-queue.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-08-12T14:00:00.000Z";
const opponent = (moveUci: string): OpponentSelection => ({
  moveUci,
  engine: {
    id: "mock-opponent",
    name: "Mock opponent",
    version: "1",
    seedHonored: true,
  },
});
const evidenceExecutor: EvidenceExecutor = {
  async execute() {
    return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } };
  },
};

function service(storage: SQLiteRunStorage): RunService {
  return new RunService(storage, {
    evidenceQueue: new EvidenceJobQueue(evidenceExecutor),
  });
}

function createBody(id: string) {
  return {
    id,
    session: {
      kind: "position" as const,
      start: { fen: INITIAL_FEN, side: "white" as const },
      feedbackPolicy: "attempt_end" as const,
      opponentPolicy: { mode: "human_common" as const },
    },
    policyConfig: {
      seedMode: "per_branch" as const,
      locus: { executedAt: "server" as const, engineIds: [], modelIds: [] },
    },
    seed: 41,
    createdAt: at,
  };
}

function request(
  handler: ReturnType<typeof createRestHandler>,
  method: string,
  path: string,
  value?: unknown,
  writer = "writer-a",
): Promise<Response> {
  return handler(new Request(`http://server.test${path}`, {
    method,
    headers: {
      ...(writer === "" ? {} : { "x-writer-id": writer }),
      ...(value === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(value === undefined ? {} : { body: JSON.stringify(value) }),
  }));
}

describe("branch-runtime REST binding", () => {
  const stores: SQLiteRunStorage[] = [];

  afterEach(() => {
    for (const store of stores.splice(0)) store.close();
  });

  function setup() {
    const storage = new SQLiteRunStorage();
    stores.push(storage);
    return { storage, handler: createRestHandler(service(storage)) };
  }

  it("binds create, moves, rewind, fork, graph, compare, and seq-cursor events", async () => {
    const { handler } = setup();
    const created = await request(handler, "POST", "/runs", createBody("rest-run"));
    expect(created.status).toBe(201);
    const createdBody = await created.json() as { run: { nodes: { id: string }[] } };
    const rootId = createdBody.run.nodes[0]!.id;

    expect((await request(handler, "POST", "/runs/rest-run/moves", {
      uci: "e2e4",
      at,
    })).status).toBe(200);
    expect((await request(handler, "POST", "/runs/rest-run/moves", {
      selection: opponent("e7e5"),
      at,
    })).status).toBe(200);

    const incremental = await request(handler, "GET", "/runs/rest-run/events?sinceSeq=2");
    expect(incremental.status).toBe(200);
    const page = await incremental.json() as {
      events: { seq: number; type: string }[];
      nextSeq: number;
    };
    expect(page.events.map((event) => [event.seq, event.type])).toEqual([
      [3, "opponent.move_selected"],
      [4, "move.committed"],
    ]);
    expect(page.nextSeq).toBe(4);

    expect((await request(handler, "POST", "/runs/rest-run/rewind", {
      nodeId: rootId,
      at,
    })).status).toBe(200);
    const alternative = await request(handler, "POST", "/runs/rest-run/moves", {
      uci: "d2d4",
      at,
    });
    expect(alternative.status).toBe(200);

    const graphResponse = await request(handler, "GET", "/runs/rest-run/graph");
    const graphBody = await graphResponse.json() as {
      graph: { viewer: { holdsLease: boolean }; branches: { id: string; label: string }[] };
    };
    expect(graphBody.graph.viewer.holdsLease).toBe(true);
    expect(JSON.stringify(graphBody)).not.toContain("activeWriterId");
    expect(graphBody.graph.branches.map((branch) => branch.label)).toEqual([
      "main",
      "alt-1",
    ]);

    const comparisonResponse = await request(handler, "POST", "/runs/rest-run/compare", {
      branchAId: graphBody.graph.branches[0]!.id,
      branchBId: graphBody.graph.branches[1]!.id,
    }, "");
    expect(comparisonResponse.status).toBe(200);
    const comparisonBody = await comparisonResponse.json() as {
      comparison: { forkNodeId: string; pairs: unknown[] };
    };
    expect(comparisonBody.comparison.forkNodeId).toBe(rootId);
    expect(comparisonBody.comparison.pairs).toHaveLength(2);

    const forked = await request(handler, "POST", "/runs/rest-run/fork", {
      nodeId: rootId,
      label: "named experiment",
      intent: "try another center",
      at,
    });
    expect(forked.status).toBe(200);
    const forkedBody = await forked.json() as {
      run: { branches: { label: string; intent?: string }[] };
    };
    expect(forkedBody.run.branches.at(-1)).toMatchObject({
      label: "named experiment",
      intent: "try another center",
    });
  });

  it("enforces one writer while leaving event reads open", async () => {
    const { storage, handler } = setup();
    expect((await request(handler, "POST", "/runs", createBody("lease-run"))).status).toBe(201);

    const conflict = await request(
      handler,
      "POST",
      "/runs/lease-run/moves",
      { uci: "e2e4", at },
      "writer-b",
    );
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toEqual({
      error: {
        code: "NOT_ACTIVE_WRITER",
        message: "Writer writer-b does not hold the run lease",
      },
    });

    const readable = await request(handler, "GET", "/runs/lease-run/events", undefined, "");
    expect(readable.status).toBe(200);
    expect((await readable.json() as { events: unknown[] }).events).toHaveLength(1);

    const stored = storage.read("lease-run")!;
    expect(() => storage.save(stored.run, "writer-b")).toThrowError(RuntimeError);
  });

  it("lists paginated run summaries with their active writer", async () => {
    const { handler } = setup();
    await request(handler, "POST", "/runs", createBody("list-a"), "writer-a");
    await request(handler, "POST", "/runs", createBody("list-b"), "writer-b");

    const response = await request(handler, "GET", "/runs?limit=2&offset=0", undefined, "");
    expect(response.status).toBe(200);
    const body = await response.json() as { runs: unknown[] };
    expect(body.runs).toHaveLength(2);
    expect(body.runs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "list-b",
          title: "Position session",
          sessionKind: "position",
          packId: null,
          objectiveState: "active",
          branchCount: 1,
          viewerRole: "host",
          leaseHeldBy: { learnerId: "__legacy", handle: "__legacy" },
        }),
      ]),
    );

    expect((await request(handler, "GET", "/runs?limit=101", undefined, "")).status)
      .toBe(400);
  });

  it("maps typed and boundary failures to structured HTTP errors", async () => {
    const { handler } = setup();
    await request(handler, "POST", "/runs", createBody("error-run"));

    const illegal = await request(handler, "POST", "/runs/error-run/moves", {
      uci: "not-uci",
    });
    expect(illegal.status).toBe(422);
    expect(await illegal.json()).toMatchObject({
      error: { code: "ILLEGAL_MOVE", reason: "malformed-UCI" },
    });

    const absent = await request(handler, "GET", "/runs/missing/graph", undefined, "");
    expect(absent.status).toBe(404);
    expect(await absent.json()).toEqual({
      error: { code: "RUN_NOT_FOUND", message: "Unknown run: missing" },
    });

    const malformedCursor = await request(
      handler,
      "GET",
      "/runs/error-run/events?sinceSeq=-1",
      undefined,
      "",
    );
    expect(malformedCursor.status).toBe(400);
    expect(await malformedCursor.json()).toMatchObject({
      error: { code: "INVALID_REQUEST" },
    });
  });

  it("persists snapshots and replays a cold SQLite load", async () => {
    const directory = mkdtempSync(join(tmpdir(), "chess-tabiya-server-"));
    const filename = join(directory, "runs.sqlite");
    try {
      const first = new SQLiteRunStorage(filename);
      const firstService = service(first);
      await firstService.create(createBody("persisted-run"), "writer-a");
      firstService.move("persisted-run", "writer-a", "e2e4", { at });
      firstService.opponentPly("persisted-run", "writer-a", opponent("e7e5"), { at });
      first.close();

      const reopened = new SQLiteRunStorage(filename);
      const restored = reopened.read("persisted-run")!;
      expect(restored.activeWriterId).toBe("writer-a");
      expect(restored.run.events.map((event) => event.type)).toEqual([
        "run.started",
        "move.committed",
        "opponent.move_selected",
        "move.committed",
      ]);
      reopened.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("serves the binding over Node HTTP", async () => {
    const { storage, handler } = setup();
    const server = createHttpServer(handler);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    try {
      const port = (server.address() as AddressInfo).port;
      const response = await fetch(`http://127.0.0.1:${port}/runs`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-writer-id": "writer-http" },
        body: JSON.stringify(createBody("http-run")),
      });
      expect(response.status).toBe(201);
      expect(storage.read("http-run")?.activeWriterId).toBe("writer-http");
    } finally {
      server.close();
      await once(server, "close");
    }
  });
});
