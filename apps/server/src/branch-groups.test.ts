import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  groupsFromEvents,
  type DrillRun,
  type EvidencePayload,
  type OpponentSelection,
} from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import type { EngineHealth, EngineIdentity, EngineRequest } from "./engine-supervisor.js";
import { EvidenceJobQueue, type EvidenceExecutor, type EvidenceJob } from "./evidence-queue.js";
import { OpponentSelector, type SelectorEngineClient } from "./opponent-selector.js";
import { PackRegistry } from "./pack-registry.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-08-14T12:00:00.000Z";
const digest = `sha256:${"8".repeat(64)}`;
const fixture = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8")) as DrillPackDefinition;

const maia: EngineIdentity = {
  id: "maia-5m", kind: "opponent", name: "Maia3", version: "test",
  modelId: "maia3-test", seedHonored: false,
};
const stockfish: EngineIdentity = {
  id: "stockfish-play", kind: "opponent", name: "Stockfish", version: "18",
  seedHonored: false,
};

class ScriptedEngines implements SelectorEngineClient {
  readonly calls: { readonly engineId: string; readonly request: EngineRequest }[] = [];
  readonly #maiaMoves: string[];

  constructor(maiaMoves: readonly string[] = ["g8f6", "e7e5", "g8f6"]) {
    this.#maiaMoves = [...maiaMoves];
  }

  async execute(engineId: string, request: EngineRequest): Promise<readonly string[]> {
    this.calls.push({ engineId, request });
    if (engineId === "stockfish-play") {
      return [
        "info depth 8 multipv 1 score cp 30 pv e2e4",
        "info depth 8 multipv 2 score cp 20 pv d2d4",
        "info depth 8 multipv 3 score cp 10 pv g1f3",
        "bestmove e2e4",
      ];
    }
    const move = this.#maiaMoves.shift() ?? "e7e5";
    const alternative = move[1] === "2" ? "d2d4" : "c7c5";
    return [
      `info depth 1 multipv 1 score cp 0 policy 0.6 pv ${move}`,
      `info depth 1 multipv 2 score cp 0 policy 0.4 pv ${alternative}`,
      `bestmove ${move}`,
    ];
  }

  health(engineId: string): EngineHealth {
    const identity = engineId === "stockfish-play" ? stockfish : maia;
    return { id: engineId, status: "ready", restartCount: 0, identity };
  }
}

class RecordingEvidence implements EvidenceExecutor {
  readonly jobs: EvidenceJob[] = [];
  async execute(job: EvidenceJob): Promise<EvidencePayload> {
    this.jobs.push(job);
    return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } };
  }
}

function body(id: string, side: "white" | "black" = "white") {
  return {
    id,
    session: {
      kind: "position" as const,
      start: { fen: INITIAL_FEN, side },
      feedbackPolicy: "attempt_end" as const,
      opponentPolicy: { mode: "human_common" as const },
    },
    policyConfig: { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } },
    seed: 41,
    createdAt: at,
  };
}

async function request(handler: ReturnType<typeof createRestHandler>, method: string, path: string, value?: unknown): Promise<Response> {
  return handler(new Request(`http://server.test${path}`, {
    method,
    headers: { "x-writer-id": "writer-a", ...(value === undefined ? {} : { "content-type": "application/json" }) },
    ...(value === undefined ? {} : { body: JSON.stringify(value) }),
  }));
}

async function setup(pack?: DrillPackDefinition, maiaMoves?: readonly string[]) {
  const storage = new SQLiteRunStorage();
  const engines = new ScriptedEngines(maiaMoves);
  const selector = new OpponentSelector(engines);
  const evidence = new RecordingEvidence();
  const queue = new EvidenceJobQueue(evidence, { maxConcurrency: 1 });
  const registry = pack === undefined ? undefined : await PackRegistry.fromDocuments([{ source: "group-pack", value: pack }]);
  const service = new RunService(storage, { evidenceQueue: queue, opponentSelector: selector, ...(registry === undefined ? {} : { packRegistry: registry }) });
  return { storage, engines, evidence, queue, service, handler: createRestHandler(service, selector) };
}

async function runFrom(response: Response): Promise<DrillRun> {
  return ((await response.json()) as { readonly run: DrillRun }).run;
}

describe("branch-group service and REST contract", () => {
  const stores: SQLiteRunStorage[] = [];
  afterEach(() => { for (const storage of stores.splice(0)) storage.close(); });

  it("creates and adopts hand-picked members atomically without duplicate evidence", async () => {
    const environment = await setup(); stores.push(environment.storage);
    let run = await runFrom(await request(environment.handler, "POST", "/runs", body("group-hand")));
    const rootId = run.activeCursor.nodeId;
    await request(environment.handler, "POST", "/runs/group-hand/moves", { uci: "e2e4", at });
    await request(environment.handler, "POST", "/runs/group-hand/rewind", { nodeId: rootId, at });
    const before = environment.evidence.jobs.length;

    const response = await request(environment.handler, "POST", "/runs/group-hand/group", {
      source: "hand_picked", candidates: ["e2e4", "d2d4", "g1f3"], at,
    });
    expect(response.status).toBe(200);
    const result = await response.json() as { readonly run: DrillRun; readonly group: { readonly members: readonly { readonly branchId: string }[] }; readonly comparison: { readonly columns: readonly unknown[] } };
    expect(result.group.members).toHaveLength(3);
    expect(result.comparison.columns).toHaveLength(3);
    expect(result.run.activeCursor.branchId).toBe(result.group.members[0]!.branchId);
    expect(result.run.events.filter((event) => event.type === "group.created")).toHaveLength(1);
    expect(result.run.events.filter((event) => event.type === "move.committed" && event.data.node.parentId === rootId).map((event) => event.data.node.actor)).toEqual(["user", "user", "user"]);
    expect(environment.evidence.jobs.length - before).toBe(2);
    expect(groupsFromEvents(result.run)).toHaveLength(1);

    await request(environment.handler, "POST", "/runs/group-hand/rewind", { nodeId: rootId, at });
    const repeated = await request(environment.handler, "POST", "/runs/group-hand/group", {
      source: "hand_picked", candidates: ["e2e4", "a2a3"], at,
    });
    expect(repeated.status).toBe(400);
  });

  it("enumerates machine seeds with honest applied mode and maps closed-route errors", async () => {
    const environment = await setup(undefined, ["e2e4"]); stores.push(environment.storage);
    await request(environment.handler, "POST", "/runs", body("group-machine", "black"));
    await request(environment.handler, "POST", "/runs/group-machine/reveal", { at });
    const response = await request(environment.handler, "POST", "/runs/group-machine/group", {
      source: "human_replies", size: 2, at,
    });
    expect(response.status).toBe(200);
    const result = await response.json() as { readonly run: DrillRun };
    const group = groupsFromEvents(result.run)[0]!;
    expect(group.source).toBe("human_replies");
    expect(group.distribution).toMatchObject({ policyModeApplied: "human_common", engine: { id: "maia-5m" } });
    expect(result.run.events.filter((event) => event.type === "opponent.move_selected").map((event) => event.data.selection.policyModeApplied)).toEqual(["enumerated", "enumerated"]);

    const unknown = await request(environment.handler, "POST", "/runs/group-machine/group-reply", { groupId: "missing" });
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toMatchObject({ error: { code: "UNKNOWN_GROUP" } });
    const injected = await request(environment.handler, "POST", "/runs/group-machine/group-reply", { groupId: group.groupId, startFen: INITIAL_FEN });
    expect(injected.status).toBe(400);
  });

  it("reuses one fixed reply after sibling paths transpose and varies per-branch seeds", async () => {
    const environment = await setup(); stores.push(environment.storage);
    await request(environment.handler, "POST", "/runs", body("group-journal"));
    const created = await request(environment.handler, "POST", "/runs/group-journal/group", {
      source: "hand_picked", resistance: "fixed", candidates: ["g1f3", "b1c3"], at,
    });
    const first = await created.json() as { readonly run: DrillRun; readonly group: { readonly groupId: string; readonly members: readonly { readonly branchId: string }[] } };
    const [memberA, memberB] = first.group.members;
    const firstReply = await request(environment.handler, "POST", "/runs/group-journal/group-reply", { groupId: first.group.groupId });
    const firstSelection = (await firstReply.json()) as { readonly selection: OpponentSelection };
    expect((await request(environment.handler, "POST", "/runs/group-journal/moves", { selection: firstSelection.selection, at })).status).toBe(200);
    expect((await request(environment.handler, "POST", "/runs/group-journal/moves", { uci: "b1c3", at })).status).toBe(200);
    const recorded = await request(environment.handler, "POST", "/runs/group-journal/group-reply", { groupId: first.group.groupId });
    const recordedBody = await recorded.json() as { readonly selection: OpponentSelection };
    expect((await request(environment.handler, "POST", "/runs/group-journal/moves", { selection: recordedBody.selection, at })).status).toBe(200);

    const stored = environment.storage.read("group-journal")!.run;
    const memberBLeaf = stored.nodes.filter((node) => node.branchId === memberB!.branchId).at(-1)!;
    await request(environment.handler, "POST", "/runs/group-journal/rewind", { nodeId: memberBLeaf.id, at });
    const secondFirstReply = await request(environment.handler, "POST", "/runs/group-journal/group-reply", { groupId: first.group.groupId });
    const secondFirst = await secondFirstReply.json() as { readonly selection: OpponentSelection };
    expect((await request(environment.handler, "POST", "/runs/group-journal/moves", { selection: secondFirst.selection, at })).status).toBe(200);
    expect((await request(environment.handler, "POST", "/runs/group-journal/moves", { uci: "g1f3", at })).status).toBe(200);
    const reused = await request(environment.handler, "POST", "/runs/group-journal/group-reply", { groupId: first.group.groupId });
    expect(reused.status).toBe(200);
    expect(await reused.json()).toEqual({ selection: recordedBody.selection, reusedFromNodeId: expect.any(String) });
    expect(environment.engines.calls.filter((call) => call.engineId === "maia-5m")).toHaveLength(3);
    expect(memberA).toBeDefined();
  });

  it("resolves authored roots and strong-engine MultiPV from server-owned pack state", async () => {
    const authored = structuredClone(fixture);
    authored.id = "group-authored";
    authored.spine = [
      authored.spine![0]!,
      { id: "najdorf-f3-root", moveUci: "f2f3", moveSan: "f3", children: [] },
    ];
    authored.authoredBoundary = { ...authored.authoredBoundary, spineNodeIds: [...authored.authoredBoundary!.spineNodeIds, "najdorf-f3-root"] };
    const environment = await setup(authored); stores.push(environment.storage);
    const created = await request(environment.handler, "POST", "/runs", {
      id: "group-authored-run", session: { kind: "pack", packId: authored.id },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 41, createdAt: at,
    });
    expect(created.status).toBe(201);
    const grouped = await request(environment.handler, "POST", "/runs/group-authored-run/group", { source: "authored", size: 2, at });
    expect(grouped.status).toBe(200);
    expect(groupsFromEvents(((await grouped.json()) as { readonly run: DrillRun }).run)[0]?.members).toHaveLength(2);
  });
});
