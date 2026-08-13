import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import {
  attachEvidence,
  engineEvidenceRef,
  reachCheckpoint,
  rulesEvidenceRef,
  transitionObjective,
  type EvidencePayload,
  type PolicyConfig,
} from "@chess-tabiya/runtime";
import { parsePgn } from "chessops/pgn";
import { afterEach, describe, expect, it } from "vitest";

import {
  EvidenceJobQueue,
  type EvidenceExecutor,
  type EvidenceJob,
} from "./evidence-queue.js";
import { PackRegistry } from "./pack-registry.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-08-12T20:00:00.000Z";
const fixture = JSON.parse(
  readFileSync(
    new URL("../../../schemas/drill_pack.example.json", import.meta.url),
    "utf8",
  ),
) as DrillPackDefinition;
const policyConfig: PolicyConfig = {
  seedMode: "fixed",
  locus: { executedAt: "server", engineIds: [], modelIds: [] },
};

function pack(overrides: Record<string, unknown> = {}): DrillPackDefinition {
  return { ...structuredClone(fixture), ...overrides };
}

class RecordingExecutor implements EvidenceExecutor {
  readonly jobs: EvidenceJob[] = [];

  async execute(job: EvidenceJob): Promise<EvidencePayload> {
    this.jobs.push(job);
    return {
      kind: "eval",
      source: "engine_validated",
      values: { centipawns: 18, requestedMovetimeMs: job.movetime },
    };
  }
}

async function request(
  handler: ReturnType<typeof createRestHandler>,
  method: string,
  path: string,
  body?: unknown,
  writerId = "writer-a",
): Promise<Response> {
  return handler(
    new Request(`http://server.test${path}`, {
      method,
      headers: {
        ...(writerId === "" ? {} : { "x-writer-id": writerId }),
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  );
}

async function setup(document: DrillPackDefinition) {
  const registry = await PackRegistry.fromDocuments([
    { source: "test-pack", value: document },
  ]);
  const executor = new RecordingExecutor();
  const queue = new EvidenceJobQueue(executor, { maxConcurrency: 1 });
  const storage = new SQLiteRunStorage();
  const service = new RunService(storage, {
    evidenceQueue: queue,
    packRegistry: registry,
  });
  return {
    registry,
    executor,
    queue,
    storage,
    service,
    handler: createRestHandler(service),
  };
}

function runBody(id: string, packId = fixture.id) {
  return { id, session: { kind: "pack" as const, packId }, policyConfig, seed: 42, createdAt: at };
}

describe("drill-client pack registry", () => {
  const stores: SQLiteRunStorage[] = [];

  afterEach(() => {
    for (const storage of stores.splice(0)) storage.close();
  });

  it("lints, digests, lists, and serves the living schema fixture", async () => {
    const environment = await setup(fixture);
    stores.push(environment.storage);
    const digest = await digestDrillPack(fixture);

    const list = await request(environment.handler, "GET", "/packs", undefined, "");
    expect(list.status).toBe(200);
    const expectedList = [
      {
        id: fixture.id,
        version: fixture.version,
        digest,
        title: fixture.title,
        mode: fixture.mode,
        phase: fixture.phase,
        difficulty: fixture.difficulty,
        reviewStatus: "schema_example",
      },
    ];
    expect(await list.text()).toBe(JSON.stringify(expectedList));

    const detail = await request(
      environment.handler,
      "GET",
      `/packs/${fixture.id}`,
      undefined,
      "",
    );
    expect(detail.status).toBe(200);
    expect(detail.headers.get("x-pack-digest")).toBe(digest);
    const projected = (await detail.json()) as Record<string, unknown>;
    expect(Object.keys(projected).sort()).toEqual(
      [
        "checkpoints",
        "difficulty",
        "feedbackPolicy",
        "id",
        "mode",
        "objective",
        "opponentPolicy",
        "phase",
        "provenance",
        "spine",
        "start",
        "title",
        "version",
      ].sort(),
    );
    expect(projected).not.toHaveProperty("deviations");
    expect(projected).not.toHaveProperty("feedbackClaims");
    expect(projected).not.toHaveProperty("planClasses");
    expect(projected).not.toHaveProperty("concepts");
    expect(projected.objective).toEqual({
      type: fixture.objective.type,
      summary: fixture.objective.summary,
    });
    expect(projected.provenance).toEqual(fixture.provenance);

    const spineNodes = (projected.spine as Record<string, unknown>[]).flatMap(
      function nodes(node): Record<string, unknown>[] {
        return [
          node,
          ...((node.children as Record<string, unknown>[] | undefined) ?? []).flatMap(
            nodes,
          ),
        ];
      },
    );
    expect(spineNodes.length).toBeGreaterThan(0);
    for (const node of spineNodes) expect(node).not.toHaveProperty("annotations");

    const checkpoints = projected.checkpoints as Record<string, unknown>[];
    expect(checkpoints).toHaveLength(fixture.checkpoints.length);
    for (const checkpoint of checkpoints) {
      expect(Object.keys(checkpoint).sort()).toEqual(["actions", "id", "label"]);
      expect(checkpoint).not.toHaveProperty("trigger");
      expect(checkpoint).not.toHaveProperty("interaction");
    }
    expect(detail.headers.get("x-pack-digest")).toBe(
      environment.registry.required(fixture.id).digest,
    );
  });

  it("loads the living schema fixture through the default boot registry", async () => {
    const registry = await PackRegistry.loadDefault();
    expect(registry.list()).toContainEqual(
      expect.objectContaining({
        id: fixture.id,
        reviewStatus: "schema_example",
      }),
    );
  });

  it("refuses semantic lint failures and unsupported v1 policies", async () => {
    const illegal = pack();
    (illegal.spine![0] as { moveUci: string }).moveUci = "a1a8";
    await expect(
      PackRegistry.fromDocuments([{ source: "illegal", value: illegal }]),
    ).rejects.toMatchObject({ code: "PACK_INVALID" });

    await expect(
      PackRegistry.fromDocuments([
        {
          source: "immediate",
          value: pack({
            id: "immediate-pack",
            feedbackPolicy: "immediate_blunder_guard",
          }),
        },
      ]),
    ).rejects.toMatchObject({
      code: "PACK_INVALID",
      message: expect.stringContaining("must be equal to one of the allowed values"),
    });

    await expect(
      PackRegistry.fromDocuments([
        {
          source: "unselectable-opponent",
          value: pack({
            id: "unselectable-opponent-pack",
            opponentPolicy: {
              ...(fixture.opponentPolicy as Record<string, unknown>),
              mode: "plan_defense",
            },
          }),
        },
      ]),
    ).rejects.toMatchObject({
      code: "PACK_INVALID",
      message: expect.stringContaining("is not selectable in v1"),
    });
  });
});

describe("pack-aware run orchestration", () => {
  const stores: SQLiteRunStorage[] = [];

  afterEach(() => {
    for (const storage of stores.splice(0)) storage.close();
  });

  it("keeps pack-owned start and policy fields authoritative at creation", async () => {
    const normal = await setup(fixture);
    stores.push(normal.storage);
    expect(
      (await request(normal.handler, "POST", "/runs", runBody("pack-reveal-run"))).status,
    ).toBe(201);
    const withoutQueue = new RunService(normal.storage, {
      packRegistry: normal.registry,
    });
    expect(() =>
      withoutQueue.move("pack-reveal-run", "writer-a", "c1e3", { at }),
    ).toThrow("Evidence queue is not configured");
    expect(normal.storage.read("pack-reveal-run")!.run.events).toHaveLength(1);
    const packReveal = await request(
      normal.handler,
      "POST",
      "/runs/pack-reveal-run/reveal",
      { at },
    );
    expect(packReveal.status).toBe(400);
    expect(await packReveal.json()).toMatchObject({
      error: {
        code: "INVALID_REQUEST",
        message: expect.stringContaining("delayed_checkpoint"),
      },
    });

    const withoutSide = pack({
      id: "missing-side-pack",
      start: { fen: fixture.start.fen, movesSan: fixture.start.movesSan },
    });
    await expect(setup(withoutSide)).rejects.toMatchObject({
      code: "PACK_INVALID",
      message: expect.stringContaining("side"),
    });

    const invalidPolicy = pack({
      id: "invalid-policy-pack",
      opponentPolicy: { mode: "human_common", temperature: -1 },
    });
    const badPolicy = await setup(invalidPolicy);
    stores.push(badPolicy.storage);
    const refusedPolicy = await request(
      badPolicy.handler,
      "POST",
      "/runs",
      runBody("invalid-policy-run", invalidPolicy.id),
    );
    expect(refusedPolicy.status).toBe(400);
    expect(await refusedPolicy.json()).toMatchObject({
      error: {
        code: "INVALID_REQUEST",
        message: expect.stringMatching(/invalid-policy-pack.*temperature/),
      },
    });
  });

  it("derives run inputs, evaluates checkpoints/objective atomically, and enqueues 100 ms evals", async () => {
    const environment = await setup(fixture);
    stores.push(environment.storage);
    const created = await request(
      environment.handler,
      "POST",
      "/runs",
      runBody("orchestrated-run"),
    );
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {
      run: { packDigest: string; nodes: { fen: string }[] };
    };
    expect(createdBody.run.packDigest).toBe(environment.registry.required(fixture.id).digest);
    expect(createdBody.run.nodes[0]!.fen).toBe(fixture.start.fen);

    const moves = [
      { uci: "c1e3" },
      {
        selection: {
          moveUci: "e7e6",
          policyModeApplied: "human_common",
          engine: {
            id: "mock-opponent",
            name: "Mock opponent",
            version: "1",
            seedHonored: true,
          },
        },
      },
      { uci: "f2f3" },
      {
        selection: {
          moveUci: "b7b5",
          policyModeApplied: "human_common",
          engine: {
            id: "mock-opponent",
            name: "Mock opponent",
            version: "1",
            seedHonored: true,
          },
        },
      },
    ];
    let finalMutation: {
      run: { nodes: { objectiveState: string }[] };
      emitted: { type: string; data: Record<string, unknown> }[];
    } | undefined;
    for (const move of moves) {
      const response = await request(
        environment.handler,
        "POST",
        "/runs/orchestrated-run/moves",
        { ...move, at },
      );
      expect(response.status).toBe(200);
      finalMutation = (await response.json()) as typeof finalMutation;
    }
    await environment.queue.whenIdle();

    expect(finalMutation!.emitted.map((event) => event.type)).toEqual([
      "opponent.move_selected",
      "move.committed",
      "checkpoint.reached",
      "segment.completed",
      "objective.state_changed",
    ]);
    expect(finalMutation!.emitted.at(-1)).toMatchObject({
      data: {
        to: "achieved",
        evidenceRefs: ["pack:timing-window"],
      },
    });
    expect(finalMutation!.run.nodes.at(-1)!.objectiveState).toBe("achieved");
    expect(environment.executor.jobs).toHaveLength(4);
    expect(environment.executor.jobs.every((job) => job.movetime === 100)).toBe(true);
    expect(environment.executor.jobs.every((job) => job.kind === "eval")).toBe(true);
  });

  it("exports a selected pack-merged branch as legal downloadable PGN", async () => {
    const environment = await setup(fixture);
    stores.push(environment.storage);
    await environment.service.create(runBody("pgn-route"), "writer-a");
    const mutation = environment.service.move("pgn-route", "writer-a", "c1e3", {
      at,
    });
    const branchId = mutation.run.branches[0]!.id;

    const response = await request(
      environment.handler,
      "GET",
      `/runs/pgn-route/pgn?branches=${encodeURIComponent(branchId)}`,
      undefined,
      "",
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/x-chess-pgn");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="pgn-route.pgn"',
    );
    const pgn = await response.text();
    expect(pgn).toContain("authored:najdorf-be2");
    expect(parsePgn(pgn)).toHaveLength(1);
  });
});

describe("server-side feedback withholding", () => {
  const stores: SQLiteRunStorage[] = [];

  afterEach(() => {
    for (const storage of stores.splice(0)) storage.close();
  });

  it("delayed_checkpoint hides engine feedback but not rules refs until a checkpoint", async () => {
    const delayed = pack({
      id: "delayed-pack",
      feedbackPolicy: "delayed_checkpoint",
      checkpoints: [{ id: "reveal", trigger: { atPly: 2 } }],
      objective: {
        type: "play_until_checkpoint",
        summary: "Reach reveal",
        successConditions: [{ kind: "reach_checkpoint", checkpointId: "reveal" }],
      },
    });
    const environment = await setup(delayed);
    stores.push(environment.storage);
    await environment.service.create(runBody("delayed-run", delayed.id), "writer-a");
    environment.service.move("delayed-run", "writer-a", "c1e3", { at });
    await environment.queue.whenIdle();

    const stored = environment.storage.read("delayed-run")!;
    const ruled = transitionObjective(
      stored.run,
      "preserved",
      [rulesEvidenceRef("material")],
      at,
    );
    const attached = attachEvidence(
      ruled.run,
      ruled.run.activeCursor.nodeId,
      [engineEvidenceRef("manual-eval")],
      { kind: "eval", source: "engine_validated", values: { centipawns: 18 } },
      at,
    );
    environment.storage.save(attached.run, "writer-a");

    const graphResponse = await request(
      environment.handler,
      "GET",
      "/runs/delayed-run/graph",
      undefined,
      "",
    );
    const graph = (await graphResponse.json()) as {
      graph: { nodes: { evidenceRefs: string[] }[] };
    };
    expect(graph.graph.nodes.at(-1)!.evidenceRefs).toEqual(["rules:material"]);
    const eventsResponse = await request(
      environment.handler,
      "GET",
      "/runs/delayed-run/events",
      undefined,
      "",
    );
    const events = (await eventsResponse.json()) as {
      events: { type: string }[];
    };
    expect(events.events.map((event) => event.type)).toEqual([
      "run.started",
      "move.committed",
      "objective.state_changed",
    ]);
    const hiddenEvidence = await request(
      environment.handler,
      "GET",
      "/runs/delayed-run/evidence",
      undefined,
      "",
    );
    expect(await hiddenEvidence.json()).toEqual({
      results: [],
      nextSeq: 0,
    });
    const forbiddenApply = await request(
      environment.handler,
      "POST",
      "/runs/delayed-run/evidence",
      { resultSeq: 1, at },
    );
    expect(forbiddenApply.status).toBe(409);
    expect(await forbiddenApply.json()).toMatchObject({
      error: { code: "FEEDBACK_WITHHELD" },
    });

    environment.service.move("delayed-run", "writer-a", "e7e6", { at });
    await environment.queue.whenIdle();
    const revealedEvidence = await request(
      environment.handler,
      "GET",
      "/runs/delayed-run/evidence",
      undefined,
      "",
    );
    const revealed = (await revealedEvidence.json()) as { results: unknown[] };
    expect(revealed.results).toHaveLength(2);
    expect(
      environment.service.events("delayed-run").events.some(
        (event) => event.type === "evidence.attached",
      ),
    ).toBe(true);
  });

  it("applies delayed feedback withholding to branch comparison", async () => {
    const delayed = pack({
      id: "delayed-compare-pack",
      feedbackPolicy: "delayed_checkpoint",
      checkpoints: [{ id: "reveal", trigger: { atPly: 4 } }],
      objective: {
        type: "play_until_checkpoint",
        summary: "Reach reveal",
        successConditions: [{ kind: "reach_checkpoint", checkpointId: "reveal" }],
      },
    });
    const environment = await setup(delayed);
    stores.push(environment.storage);
    const created = await environment.service.create(
      runBody("delayed-compare-run", delayed.id),
      "writer-a",
    );
    const rootNodeId = created.activeCursor.nodeId;

    let main = environment.service.move(
      "delayed-compare-run",
      "writer-a",
      "c1e3",
      { at },
    ).run;
    const mainNodeId = main.activeCursor.nodeId;
    main = attachEvidence(
      main,
      mainNodeId,
      [engineEvidenceRef("main-eval")],
      { kind: "eval", source: "engine_validated", values: { centipawns: 18 } },
      at,
    ).run;
    main = transitionObjective(
      main,
      "preserved",
      [rulesEvidenceRef("material"), engineEvidenceRef("main-eval")],
      at,
    ).run;
    environment.storage.save(main, "writer-a");

    environment.service.rewind(
      "delayed-compare-run",
      "writer-a",
      { nodeId: rootNodeId },
      at,
    );
    let alternative = environment.service.move(
      "delayed-compare-run",
      "writer-a",
      "f1e2",
      { at },
    ).run;
    const alternativeNodeId = alternative.activeCursor.nodeId;
    alternative = attachEvidence(
      alternative,
      alternativeNodeId,
      [engineEvidenceRef("alternative-eval")],
      { kind: "eval", source: "engine_validated", values: { mateIn: -3 } },
      at,
    ).run;
    alternative = transitionObjective(
      alternative,
      "degraded",
      [rulesEvidenceRef("material"), engineEvidenceRef("alternative-eval")],
      at,
    ).run;
    environment.storage.save(alternative, "writer-a");

    const [mainBranch, alternativeBranch] = alternative.branches;
    const withheld = environment.service.compare(
      alternative.id,
      mainBranch!.id,
      alternativeBranch!.id,
    );
    expect(withheld.objectiveTimelines.a[0]!.evidenceRefs).toEqual([
      rulesEvidenceRef("material"),
    ]);
    expect(withheld.objectiveTimelines.b[0]!.evidenceRefs).toEqual([
      rulesEvidenceRef("material"),
    ]);
    expect(withheld.evidence).toEqual({ a: [], b: [] });

    const revealed = reachCheckpoint(alternative, "reveal", at).run;
    environment.storage.save(revealed, "writer-a");
    const visible = environment.service.compare(
      revealed.id,
      mainBranch!.id,
      alternativeBranch!.id,
    );
    expect(visible.objectiveTimelines.a[0]!.evidenceRefs).toContain(
      engineEvidenceRef("main-eval"),
    );
    expect(visible.objectiveTimelines.b[0]!.evidenceRefs).toContain(
      engineEvidenceRef("alternative-eval"),
    );
    expect(visible.evidence.a).toEqual([
      expect.objectContaining({
        nodeId: mainNodeId,
        evidenceRefs: [engineEvidenceRef("main-eval")],
        score: { kind: "cp", value: 18 },
      }),
    ]);
    expect(visible.evidence.b).toEqual([
      expect.objectContaining({
        nodeId: alternativeNodeId,
        evidenceRefs: [engineEvidenceRef("alternative-eval")],
        score: { kind: "mate", movesTo: -3 },
      }),
    ]);
  });

  it("segment_end stays closed at the first checkpoint and opens on segment completion", async () => {
    const segment = pack({
      id: "segment-pack",
      feedbackPolicy: "segment_end",
      checkpoints: [
        { id: "segment-start", trigger: { atPly: 1 } },
        { id: "segment-finish", trigger: { atPly: 2 } },
      ],
      objective: {
        type: "play_until_checkpoint",
        summary: "Finish segment",
        successConditions: [
          { kind: "reach_checkpoint", checkpointId: "segment-finish" },
        ],
      },
    });
    const environment = await setup(segment);
    stores.push(environment.storage);
    await environment.service.create(runBody("segment-run", segment.id), "writer-a");

    environment.service.move("segment-run", "writer-a", "c1e3", { at });
    await environment.queue.whenIdle();
    const firstEvidence = await request(
      environment.handler,
      "GET",
      "/runs/segment-run/evidence",
      undefined,
      "",
    );
    expect((await firstEvidence.json()) as { results: unknown[] }).toMatchObject({
      results: [],
    });
    expect(
      environment.storage
        .read("segment-run")!
        .run.events.some((event) => event.type === "checkpoint.reached"),
    ).toBe(true);
    expect(
      environment.storage
        .read("segment-run")!
        .run.events.some((event) => event.type === "segment.completed"),
    ).toBe(false);

    environment.service.move("segment-run", "writer-a", "e7e6", { at });
    await environment.queue.whenIdle();
    const secondEvidence = await request(
      environment.handler,
      "GET",
      "/runs/segment-run/evidence",
      undefined,
      "",
    );
    expect(((await secondEvidence.json()) as { results: unknown[] }).results).toHaveLength(2);
    expect(
      environment.storage
        .read("segment-run")!
        .run.events.some((event) => event.type === "segment.completed"),
    ).toBe(true);
  });
});
