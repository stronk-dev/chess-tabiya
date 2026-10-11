import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import {
  attachEvidence,
  engineEvidenceRef,
  reachCheckpoint,
  rulesEvidenceRef,
  readBackReplay,
  projectRun,
  transitionObjective,
  type EvidencePayload,
  type PolicyConfig,
} from "@chess-tabiya/runtime";
import { parsePgn } from "chessops/pgn";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  EvidenceJobQueue,
  type EvidenceExecutor,
  type EvidenceJob,
} from "./evidence-queue.js";
import { PackRegistry } from "./pack-registry.js";
import { OpponentSelector } from "./opponent-selector.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";

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
    { source: "test-pack", value: withDerivedRequires(document) },
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

  it.each([false, true])("D3700 measures public reasoning replay through admitted segment-end play (fork=%s)", async (branched) => {
    const document: DrillPackDefinition = {
      id: "reasoning-segment-replay", version: "0.1.0", title: "Reasoning transport fixture", requires: [],
      mode: "line", phase: "middlegame", start: { fen: "3rk3/8/8/8/8/8/7P/3Q2K1 w - - 0 1", side: "white" },
      objective: { type: "play_until_checkpoint", summary: "Record the fixture transcript.", successConditions: [{ kind: "reach_checkpoint", checkpointId: "reason" }] },
      spine: [{ id: "first", moveUci: "h2h3", moveSan: "h3", children: [{ id: "reply", moveUci: "e8f8", moveSan: "Kf8", children: [{ id: "last", moveUci: "h3h4", moveSan: "h4", children: [] }] }] }],
      checkpoints: [
        { id: "before", label: "First checkpoint", trigger: { atPly: 1 }, actions: [] },
        { id: "reason", label: "Record words", trigger: { atPly: 3 }, actions: [], interaction: { type: "stated_reasoning", keyPoints: [{ id: "words", label: "Fixture words", phrases: ["fixture words"], ground: { kind: "spine_move", spineNodeId: "last" } }] } },
      ],
      feedbackPolicy: "segment_end", opponentPolicy: { mode: "theory_strict" },
      provenance: { sources: ["Disposable transport fixture, not chess instruction."], licence: "CC0-1.0", reviewStatus: "draft" },
    };
    const environment = await setup(document);
    stores.push(environment.storage);
    const created = await request(environment.handler, "POST", "/runs", runBody(`reasoning-branch-${branched}`, document.id));
    expect(created.status, await created.clone().text()).toBe(201);
    const { run } = await created.json() as { run: import("@chess-tabiya/runtime").DrillRun };
    const first = environment.service.move(run.id, "writer-a", "h2h3", { at }).run;
    if (branched) environment.service.fork(run.id, "writer-a", first.activeCursor.nodeId, { label: "branch at checkpoint" });
    environment.service.opponentPly(run.id, "writer-a", {
      moveUci: "e8f8", policyModeApplied: "theory_strict",
      engine: { id: "fixture", name: "Fixture", version: "1", seedHonored: true },
    }, { at });
    const reached = environment.service.move(run.id, "writer-a", "h3h4", { at }).run;
    const checkpoint = [...reached.events].reverse().find(event => event.type === "checkpoint.reached")!;
    const response = await request(environment.handler, "POST", `/runs/${run.id}/reasoning`, {
      nodeId: reached.activeCursor.nodeId, checkpointEventSeq: checkpoint.seq,
      transcript: { candidates: [], plan: "fixture words", fears: "" },
    });
    expect(response.status, await response.clone().text()).toBe(200);
    const payload = await response.json() as import("@chess-tabiya/runtime").MutationResult;
    const saved = environment.storage.read(run.id)!.run;
    expect(projectRun(saved.events)).toEqual(saved);
    const event = [...payload.run.events].reverse().find(event => event.type === "reasoning.recorded")!;
    expect(event).toMatchObject({ data: { skipped: false, transcript: { plan: "fixture words" } } });
    if (branched) {
      expect(event).toMatchObject({ data: { detections: [] } });
      expect(() => projectRun(payload.run.events)).toThrow("inconsistent skip data");
    } else {
      expect(event).toMatchObject({ data: { detections: [{ keyPointId: "words", status: "detected" }] } });
      expect(projectRun(payload.run.events)).toEqual(payload.run);
    }
  });

  async function predictionFixture() {
    const environment = await setup(fixture);
    stores.push(environment.storage);
    const document = withDerivedRequires(pack({ id: "prediction-admission", checkpoints: fixture.checkpoints.map((checkpoint, index) => index === 0
      ? { ...checkpoint, interaction: { type: "prediction", flipBoard: true } } : checkpoint) }));
    const record = environment.registry.addPlaytest(document as DrillPackDefinition, await digestDrillPack(document as DrillPackDefinition));
    const run = await environment.service.createPlaytestRun(record, { writerId: "writer-a", learnerId: "__legacy" });
    const moved = environment.service.move(run.id, "writer-a", "c1e3", { at });
    const selector = new OpponentSelector({ execute: async () => { throw new Error("unused provider"); }, health: () => { throw new Error("unused health"); } });
    const selection = { moveUci: "e7e6", policyModeApplied: "theory_strict" as const,
      candidates: [{ moveUci: "e7e6", mass: 0.7, rank: 1 }, { moveUci: "e7e5", mass: 0.3, rank: 2 }],
      engine: { id: "fixture", name: "Recorded fixture", version: "1", seedHonored: true } };
    const select = vi.spyOn(selector, "select").mockResolvedValue(selection);
    const body = { startFen: document.start.fen, historyUci: ["c1e3"], seed: run.branches[0]!.seed,
      policy: { mode: "theory_strict", policyConfigDigest: run.sessionDigest }, packId: document.id,
      nodeId: moved.run.activeCursor.nodeId, checkpointId: "plan-commitment", predictedUci: "e7e6" };
    return { ...environment, run: moved.run, selector, select, selection, body, handler: createRestHandler(environment.service, selector) };
  }

  it.each(["writer", "missing-writer", "missing-run", "malformed-checkpoint", "unknown-node", "unreached-checkpoint", "start", "history", "seed", "digest", "missing-pack", "crossed-pack", "illegal-guess"])(
    "D3694 refuses %s before prediction provider execution", async (kind) => {
      const environment = await predictionFixture();
      const body: Record<string, unknown> = { ...environment.body };
      if (kind === "malformed-checkpoint") body.checkpointId = 1;
      if (kind === "unknown-node") body.nodeId = "another-node";
      if (kind === "unreached-checkpoint") body.checkpointId = "predict-reply";
      if (kind === "start") body.startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      if (kind === "history") body.historyUci = [];
      if (kind === "seed") body.seed = environment.body.seed + 1;
      if (kind === "digest") body.policy = { ...environment.body.policy, policyConfigDigest: `sha256:${"0".repeat(64)}` };
      if (kind === "missing-pack") delete body.packId;
      if (kind === "crossed-pack") body.packId = fixture.id;
      if (kind === "illegal-guess") body.predictedUci = "e7e4";
      const response = await request(environment.handler, "POST", `/runs/${kind === "missing-run" ? "absent" : environment.run.id}/prediction`, body,
        kind === "writer" ? "another-writer" : kind === "missing-writer" ? "" : "writer-a");
      expect(response.status, await response.clone().text()).toBe(kind === "writer" ? 409 : kind === "missing-run" ? 404 : 400);
      expect(environment.select).not.toHaveBeenCalled();
      expect(environment.storage.read(environment.run.id)!.run).toEqual(environment.run);
    });

  it("D3694 refuses a reached prediction on the learner's turn before selecting", async () => {
    const environment = await predictionFixture();
    const moved = environment.service.opponentPly(environment.run.id, "writer-a", environment.selection);
    const response = await request(environment.handler, "POST", `/runs/${environment.run.id}/prediction`, {
      ...environment.body, historyUci: ["c1e3", "e7e6"], nodeId: moved.run.activeCursor.nodeId,
      checkpointId: "predict-reply", predictedUci: "f2f3",
    });
    expect(response.status, await response.clone().text()).toBe(400);
    expect(environment.select).not.toHaveBeenCalled();
    expect(environment.storage.read(environment.run.id)!.run).toEqual(moved.run);
  });

  it("D3694 replays a committed guess after response loss but refuses a changed guess without another selection", async () => {
    const environment = await predictionFixture();
    const path = `/runs/${environment.run.id}/prediction`;
    const first = await request(environment.handler, "POST", path, environment.body);
    expect(first.status, await first.clone().text()).toBe(200);
    const receipt = await first.json();
    const retry = await request(environment.handler, "POST", path, environment.body);
    expect(retry.status, await retry.clone().text()).toBe(200);
    expect(await retry.json()).toEqual(receipt);
    const changed = await request(environment.handler, "POST", path, { ...environment.body, predictedUci: "e7e5" });
    expect(changed.status, await changed.clone().text()).toBe(400);
    expect(environment.select).toHaveBeenCalledTimes(1);
    expect(environment.storage.read(environment.run.id)!.run.events.filter(event => event.type === "prediction.recorded")).toHaveLength(1);
  });

  it.each(["cursor", "leave-and-return", "lease", "occurrence"])("D3694 rechecks %s after an asynchronous selection", async (kind) => {
    const environment = await predictionFixture();
    environment.select.mockImplementationOnce(async () => {
      if (kind === "lease") environment.storage.claimLease(environment.run.id, { learnerId: "__legacy", writerId: "new-device" });
      else if (kind === "occurrence") environment.storage.save(reachCheckpoint(environment.run, "plan-commitment").run, { learnerId: "__legacy", writerId: "writer-a" });
      else {
        environment.service.rewind(environment.run.id, "writer-a", { nodeId: environment.run.nodes[0]!.id });
        if (kind === "leave-and-return") environment.service.rewind(environment.run.id, "writer-a", { nodeId: environment.run.activeCursor.nodeId });
      }
      return environment.selection;
    });
    const response = await request(environment.handler, "POST", `/runs/${environment.run.id}/prediction`, environment.body);
    expect(response.status, await response.clone().text()).toBe(kind === "lease" ? 409 : 400);
    expect(environment.select).toHaveBeenCalledTimes(1);
    expect(environment.storage.read(environment.run.id)!.run.events.filter(event => event.type === "prediction.recorded")).toEqual([]);
  });

  it("D3694 keeps a later sibling checkpoint from shadowing the resumed original position", async () => {
    const environment = await predictionFixture();
    environment.service.fork(environment.run.id, "writer-a", environment.run.nodes[0]!.id, { label: "sibling" });
    const sibling = environment.service.move(environment.run.id, "writer-a", "c1e3");
    expect(sibling.run.events.at(-1)?.type).toBe("checkpoint.reached");
    environment.service.rewind(environment.run.id, "writer-a", { nodeId: environment.run.activeCursor.nodeId, branchId: environment.run.activeCursor.branchId });
    const response = await request(environment.handler, "POST", `/runs/${environment.run.id}/prediction`, environment.body);
    expect(response.status, await response.clone().text()).toBe(200);
    expect(environment.select).toHaveBeenCalledTimes(1);
  });

  it("D3694 concurrent identical guesses retain exactly one winning event and distribution", async () => {
    const environment = await predictionFixture();
    let entered!: () => void;
    const selecting = new Promise<void>(resolve => { entered = resolve; });
    let settle!: (selection: typeof environment.selection) => void;
    environment.select.mockImplementationOnce(() => { entered(); return new Promise(resolve => { settle = resolve; }); });
    const pending = request(environment.handler, "POST", `/runs/${environment.run.id}/prediction`, environment.body);
    await selecting;
    const winner = await request(environment.handler, "POST", `/runs/${environment.run.id}/prediction`, environment.body);
    expect(winner.status, await winner.clone().text()).toBe(200);
    const receipt = await winner.json();
    // The later-settling provider cannot replace the distribution that already committed.
    settle({ ...environment.selection, moveUci: "e7e5" });
    const completed = await pending;
    expect(completed.status, await completed.clone().text()).toBe(200);
    expect(await completed.json()).toEqual(receipt);
    expect(environment.storage.read(environment.run.id)!.run.events.filter(event => event.type === "prediction.recorded")).toHaveLength(1);
  });

  it("D3694 unrelated evidence arriving during selection does not invalidate the position", async () => {
    const environment = await predictionFixture();
    environment.select.mockImplementationOnce(async () => {
      const updated = attachEvidence(environment.run, environment.run.activeCursor.nodeId,
        [engineEvidenceRef("prediction-background")], { kind: "eval", source: "engine_validated", values: { centipawns: 20 } });
      environment.storage.save(updated.run, { learnerId: "__legacy", writerId: "writer-a" });
      return environment.selection;
    });
    const response = await request(environment.handler, "POST", `/runs/${environment.run.id}/prediction`, environment.body);
    expect(response.status, await response.clone().text()).toBe(200);
    const result = await response.json();
    expect(result.run.events.filter((event: { type: string }) => event.type === "evidence.attached")).toHaveLength(1);
    expect(result.emitted.map((event: { type: string }) => event.type)).toEqual(["prediction.recorded"]);
  });

  it.each([false, true])("D3696 resolves the prediction's immutable private playtest, refusing crossed ids (%s)", async (crossed) => {
    const environment = await setup(fixture);
    stores.push(environment.storage);
    const document = withDerivedRequires(pack({ id: "private-prediction", checkpoints: fixture.checkpoints.map((checkpoint, index) => index === 0
      ? { ...checkpoint, interaction: { type: "prediction", flipBoard: true } } : checkpoint) }));
    const record = environment.registry.addPlaytest(document as DrillPackDefinition, await digestDrillPack(document as DrillPackDefinition));
    expect(() => environment.registry.required(document.id)).toThrow();
    const run = await environment.service.createPlaytestRun(record, { writerId: "writer-a", learnerId: "__legacy" });
    const moved = environment.service.move(run.id, "writer-a", "c1e3", { at });
    const selector = new OpponentSelector({ execute: async () => { throw new Error("unused provider"); }, health: () => { throw new Error("unused health"); } });
    const select = vi.spyOn(selector, "select").mockResolvedValue({ moveUci: "e7e6", policyModeApplied: "theory_strict",
      engine: { id: "fixture", name: "Recorded fixture", version: "1", seedHonored: true } });
    const response = await request(createRestHandler(environment.service, selector), "POST", `/runs/${run.id}/prediction`, {
      startFen: document.start.fen, historyUci: ["c1e3"], seed: run.branches[0]!.seed,
      policy: { mode: "theory_strict", policyConfigDigest: run.sessionDigest },
      packId: crossed ? fixture.id : document.id, nodeId: moved.run.activeCursor.nodeId,
      checkpointId: "plan-commitment", predictedUci: "e7e6",
    });
    expect(response.status, await response.clone().text()).toBe(crossed ? 400 : 200);
    if (crossed) expect(select).not.toHaveBeenCalled();
    else {
      expect(select).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ policy: expect.objectContaining({ spine: record.document.spine }) }));
      const body = await response.json();
      expect(body.run.nodes).toEqual(moved.run.nodes);
      expect(body.emitted.at(-1)).toMatchObject({ type: "prediction.recorded", data: { predictedUci: "e7e6" } });
    }
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
        objectiveSummary: fixture.objective.summary ?? fixture.objective.type.replaceAll("_", " "),
        consequenceHorizon: { kind: "declared", plies: 4 },
        // rfc/concept-registry.md §6: the catalogue carries registry labels, never raw strings.
        concepts: [
          { id: "move-order-discipline", label: "Move order discipline", status: "active" },
          { id: "plan-continuity-across-phases", label: "Plan continuity across phases", status: "active" },
        ],
        reviewStatus: "schema_example",
        channel: "official",
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
        "channel",
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
    expect(projected.provenance).toEqual({ reviewStatus: "schema_example", sources: [] });
    expect(JSON.stringify(projected)).not.toContain("reviewers");

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
      const authored = fixture.checkpoints.find((candidate) => candidate.id === checkpoint.id);
      expect(Object.keys(checkpoint).sort()).toEqual(
        authored?.interaction?.type === "prediction"
          ? ["actions", "id", "interaction", "label"]
          : ["actions", "id", "label"],
      );
      expect(checkpoint).not.toHaveProperty("trigger");
      if (authored?.interaction?.type !== "prediction") expect(checkpoint).not.toHaveProperty("interaction");
    }
    expect(detail.headers.get("x-pack-digest")).toBe(
      environment.registry.required(fixture.id).digest,
    );
  });

  it("preserves an absent checkpoint label instead of exposing its storage id", async () => {
    const checkpoints = structuredClone(fixture.checkpoints).map((checkpoint) => {
      if (checkpoint.id !== "plan-commitment") return checkpoint;
      const { label: _label, ...withoutLabel } = checkpoint;
      return withoutLabel;
    });
    const document = pack({
      id: "copy-fallback-pack",
      checkpoints,
    });
    const environment = await setup(document);
    stores.push(environment.storage);

    const list = await request(environment.handler, "GET", "/packs", undefined, "");
    expect(await list.json()).toEqual([
      expect.objectContaining({
        id: "copy-fallback-pack",
        objectiveSummary: document.objective.summary,
      }),
    ]);

    const detail = await request(environment.handler, "GET", "/packs/copy-fallback-pack", undefined, "");
    const projected = (await detail.json() as { checkpoints: readonly Record<string, unknown>[] }).checkpoints;
    expect(projected.find((checkpoint) => checkpoint.id === "plan-commitment")).toEqual({
      id: "plan-commitment",
      actions: fixture.checkpoints[0]?.actions ?? [],
    });
  });

  it("refuses semantic lint failures and unsupported v1 policies", async () => {
    const illegal = pack();
    (illegal.spine![0] as { moveUci: string }).moveUci = "a1a8";
    await expect(
      PackRegistry.fromDocuments([{ source: "illegal", value: withDerivedRequires(illegal) }]),
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

  it("previews authored consequences without mutating the run, then enters exactly one line", async () => {
    const environment = await setup(fixture);
    stores.push(environment.storage);
    expect((await request(environment.handler, "POST", "/runs", runBody("simulation-run"))).status).toBe(201);
    for (const uci of ["c1e3", "e7e6"]) {
      const moved = await request(environment.handler, "POST", "/runs/simulation-run/moves", { uci, actor: "system", at });
      expect(moved.status, await moved.clone().text()).toBe(200);
    }

    const before = environment.storage.read("simulation-run")!.run;
    const beforeBytes = JSON.stringify(before);
    const evidenceJobCount = environment.executor.jobs.length;
    const preview = await request(environment.handler, "POST", "/runs/simulation-run/simulate", {});
    expect(preview.status, await preview.clone().text()).toBe(200);
    const simulation = await preview.json() as {
      simulationId: string;
      branches: { index: number; label: string; leafFen: string; plies: number }[];
      comparison: { columns: { label: string; origin: string }[] };
    };
    expect(simulation.branches).toEqual([
      expect.objectContaining({ index: 0, label: "f3", plies: 2, leafFen: expect.any(String) }),
      expect.objectContaining({ index: 1, label: "Be2", plies: 1, leafFen: expect.any(String) }),
    ]);
    expect(simulation.comparison.columns.map((column) => [column.label, column.origin])).toEqual([["f3", "simulated"], ["Be2", "simulated"]]);
    expect(JSON.stringify(environment.storage.read("simulation-run")!.run)).toBe(beforeBytes);
    expect(environment.executor.jobs).toHaveLength(evidenceJobCount);

    const entered = await request(environment.handler, "POST", "/runs/simulation-run/simulate-enter", {
      simulationId: simulation.simulationId,
      branchIndex: 1,
      at,
    });
    expect(entered.status, await entered.clone().text()).toBe(200);
    const result = await entered.json() as { run: import("@chess-tabiya/runtime").DrillRun };
    expect(result.run.branches.filter((branch) => branch.origin === "simulated")).toEqual([
      expect.objectContaining({ label: "Be2", origin: "simulated" }),
    ]);
    expect(result.run.activeCursor.branchId).toBe(result.run.branches.find((branch) => branch.origin === "simulated")!.id);
    expect(result.run.nodes.find((node) => node.id === result.run.activeCursor.nodeId)?.moveSan).toBe("Be2");
    expect(() => readBackReplay(result.run.events)).not.toThrow();
    expect(environment.executor.jobs).toHaveLength(evidenceJobCount);

    const reused = await request(environment.handler, "POST", "/runs/simulation-run/simulate-enter", {
      simulationId: simulation.simulationId,
      branchIndex: 0,
    });
    expect(reused.status).toBe(410);
    expect(await reused.json()).toMatchObject({ error: { code: "SIMULATION_EXPIRED" } });
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
        successConditions: [{ kind: "reach_checkpoint", checkpointId: "reveal", to: "preserved" }],
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
      [mainBranch!.id, alternativeBranch!.id],
    );
    expect(withheld.machineFeedback).toBe("withheld");
    expect(withheld.objectiveTimelines[mainBranch!.id]![0]!.evidenceRefs).toEqual([
      rulesEvidenceRef("material"),
    ]);
    expect(withheld.objectiveTimelines[alternativeBranch!.id]![0]!.evidenceRefs).toEqual([
      rulesEvidenceRef("material"),
    ]);
    expect(withheld.evidence).toEqual({ [mainBranch!.id]: [], [alternativeBranch!.id]: [] });
    expect(withheld.consequences[mainBranch!.id]!.deepestScore).toBeNull();
    expect(withheld.consequences[alternativeBranch!.id]!.deepestScore).toBeNull();

    const revealed = reachCheckpoint(alternative, "reveal", at).run;
    environment.storage.save(revealed, "writer-a");
    const visible = environment.service.compare(
      revealed.id,
      [mainBranch!.id, alternativeBranch!.id],
    );
    expect(visible.machineFeedback).toBe("available");
    expect(visible.objectiveTimelines[mainBranch!.id]![0]!.evidenceRefs).toContain(
      engineEvidenceRef("main-eval"),
    );
    expect(visible.objectiveTimelines[alternativeBranch!.id]![0]!.evidenceRefs).toContain(
      engineEvidenceRef("alternative-eval"),
    );
    expect(visible.evidence[mainBranch!.id]).toEqual([
      expect.objectContaining({
        nodeId: mainNodeId,
        evidenceRefs: [engineEvidenceRef("main-eval")],
        score: { kind: "cp", value: 18 },
      }),
    ]);
    expect(visible.evidence[alternativeBranch!.id]).toEqual([
      expect.objectContaining({
        nodeId: alternativeNodeId,
        evidenceRefs: [engineEvidenceRef("alternative-eval")],
        score: { kind: "mate", movesTo: -3 },
      }),
    ]);
    expect(visible.consequences[mainBranch!.id]!.deepestScore).toEqual({ plyOffset: 1, score: { kind: "cp", value: 18 } });
    expect(visible.consequences[alternativeBranch!.id]!.deepestScore).toEqual({ plyOffset: 1, score: { kind: "mate", movesTo: -3 } });
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
          { kind: "reach_checkpoint", checkpointId: "segment-finish", to: "preserved" },
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
