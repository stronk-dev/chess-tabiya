import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  appendOpponentPly,
  appendEvents,
  commitMove,
  compareBranches,
  createRun,
  fork,
  reachCheckpoint,
  rewind,
  rewindToCheckpoint,
  type DrillRun,
  type MutationResult,
  type OpponentSelection,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import type {
  Capabilities,
  CreateRunRequest,
  DrillClientApi,
  EventsPage,
  EvidencePage,
  ForkRequest,
  MoveOptions,
  PackSummary,
  PlayerMoveRequest,
  RewindRequest,
  RunSummary,
  SelectMoveRequest,
} from "./api.js";
import type { PollScheduler } from "./run-state.js";
import { DrillSessionController } from "./session-controller.js";
import {
  WriterSession,
  type KeyValueStorage,
} from "./writer-session.js";

const pack = JSON.parse(
  readFileSync(
    new URL("../../../../schemas/drill_pack.example.json", import.meta.url),
    "utf8",
  ),
) as DrillPackDefinition;
const blackToMovePack = JSON.parse(
  readFileSync(
    new URL("../../../../content/drafts/anti-caro-advance.json", import.meta.url),
    "utf8",
  ),
) as DrillPackDefinition;
const digest = `sha256:${"a".repeat(64)}`;
const at = "2026-08-11T20:00:00.000Z";
const capabilities: Capabilities = {
  engines: [
    {
      id: "maia",
      kind: "opponent",
      name: "Maia",
      version: "3",
      modelId: "maia-1800",
      seedHonored: true,
    },
  ],
  policyModes: ["human_common", "strong_engine", "theory_strict"],
  feedbackPolicies: ["delayed_checkpoint", "segment_end", "immediate_guard"],
  guardBasis: ["rules", "engine"],
  runSchemaVersion: "0.6",
  policyProfiles: {
    strong_engine: { movetimeMs: 100, threads: 1, hashMb: 16, multiPv: 1 },
  },
  providers: { opponent: "maia", judge: "stockfish", llm: "none", corpus: "none" },
  surfaces: {
    play: "available",
    review: "available",
    learn: "unavailable-here",
    live: "available",
    create: "unavailable-here",
    justPlay: "available",
    fromPosition: "available",
  },
};

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

class FakeScheduler implements PollScheduler {
  setInterval(): number {
    return 1;
  }
  clearInterval(): void {}
}

class ManualScheduler implements PollScheduler {
  readonly tasks: Array<() => void | Promise<void>> = [];
  setInterval(task: () => void | Promise<void>): number {
    this.tasks.push(task);
    return this.tasks.length;
  }
  clearInterval(): void {}
  async runAll(): Promise<void> {
    for (const task of [...this.tasks]) await task();
  }
}

class FakeApi implements DrillClientApi {
  run: DrillRun | undefined;
  created: CreateRunRequest | undefined;
  selected: SelectMoveRequest | undefined;
  writerIds: string[] = [];
  graphWriterIds: (string | undefined)[] = [];
  activeWriterId = "writer-a";
  authoredFeedbackCalls = 0;
  groupReplyCalls = 0;

  constructor(
    readonly document: DrillPackDefinition = pack,
    readonly opponentMove = "e7e6",
    readonly checkpointOpponentPly = true,
  ) {}

  async capabilities(): Promise<Capabilities> {
    return capabilities;
  }

  async packs(): Promise<readonly PackSummary[]> {
    return [
      {
        id: this.document.id,
        version: this.document.version,
        digest,
        title: this.document.title as string,
        mode: this.document.mode as string,
        phase: "opening",
        difficulty: this.document.difficulty,
        reviewStatus: "schema_example",
        channel: "official",
      },
    ];
  }

  async pack(): Promise<{ readonly document: DrillPackDefinition; readonly digest: string }> {
    return { document: this.document, digest };
  }

  async shapes(): Promise<readonly import("./api.js").ShapeSummary[]> { return []; }
  async shape(): Promise<import("./api.js").ShapeDocument> { throw new Error("no shapes in fake"); }
  async humanSplit(_runId: string, nodeId: string): Promise<import("./api.js").HumanSplitPage> { return { nodeId, engine: { id: "maia", name: "Maia", version: "3", seedHonored: true }, targetElo: 1800, candidates: [] }; }
  async corpus(_runId: string, nodeId: string): Promise<import("./api.js").CorpusPage> { return { nodeId, committedMoveSan: null, result: { kind: "abstention", reason: "no_data_at_band", detail: "total 37 < 100", population: { source: "lichess-explorer", ratings: [1400], speeds: ["rapid"], since: "2023-09", until: "2026-08" } } }; }
  async voice(_runId: string, _nodeId: string, scope: import("./api.js").VoicePage["scope"]): Promise<import("./api.js").VoicePage> { return { text: "fixture", source: "deterministic", scope }; }

  async runs(): Promise<readonly RunSummary[]> {
    return [];
  }

  async createRun(input: CreateRunRequest, writerId: string): Promise<DrillRun> {
    this.created = input;
    this.writerIds.push(writerId);
    this.activeWriterId = writerId;
    const isPack = input.session.kind === "pack";
    this.run = createRun({
      id: input.id,
      session: isPack ? {
        kind: "pack",
        packId: input.session.packId,
        packDigest: digest,
        start: { fen: this.document.start.fen, side: (this.document.start.side ?? "white") as "white" | "black" },
        feedbackPolicy: (this.document.feedbackPolicy ?? "delayed_checkpoint") as "delayed_checkpoint" | "segment_end",
        opponentPolicy: { mode: "human_common" },
      } : input.session,
      sessionDigest: digest,
      policyConfig: input.policyConfig,
      seed: input.seed,
      createdAt: at,
    });
    return this.run;
  }

  async reveal(): Promise<MutationResult> {
    throw new Error("position reveal is outside the pack-player fake");
  }

  async selectMove(input: SelectMoveRequest): Promise<OpponentSelection> {
    this.selected = input;
    return {
      moveUci: this.opponentMove,
      policyModeApplied: "human_common",
      engine: {
        id: "maia",
        name: "Maia",
        version: "3",
        modelId: "maia-1800",
        seedHonored: true,
      },
    };
  }

  async prediction(_runId: string, input: import("./api.js").PredictionRequest, writerId: string) {
    const selection = await this.selectMove(input);
    const before = this.requiredRun().events.length;
    const candidates = selection.candidates ?? [];
    const candidate = candidates.find((entry) => entry.moveUci === input.predictedUci);
    this.run = appendEvents(this.requiredRun(), [{
      type: "prediction.recorded",
      at,
      data: {
        nodeId: input.nodeId,
        checkpointId: input.checkpointId,
        predictedUci: input.predictedUci,
        predictedMass: candidate?.mass ?? null,
        predictedRank: candidate?.rank ?? null,
        candidateCount: candidates.length,
        distribution: selection,
      },
    }]);
    this.writerIds.push(writerId);
    return { selection, run: this.run, emitted: this.run.events.slice(before) };
  }

  async createGroup(_runId: string, input: import("./api.js").CreateGroupRequest, writerId: string) {
    const before = this.requiredRun().events.length;
    const source = this.requiredRun().activeCursor.nodeId;
    let next = this.requiredRun();
    const members: { branchId: string; seedMoveUci: string }[] = [];
    for (const moveUci of input.candidates ?? []) {
      next = fork(next, source, { label: moveUci, at }).run;
      next = commitMove(next, moveUci, { actor: "user", at }).run;
      members.push({ branchId: next.activeCursor.branchId, seedMoveUci: moveUci });
    }
    const firstLeaf = next.nodes.filter((node) => node.branchId === members[0]!.branchId).at(-1)!;
    next = rewind(next, firstLeaf.id, at).run;
    next = appendEvents(next, [{ type: "group.created", at, data: { groupId: `${next.id}:group:1`, sourceNodeId: source, source: input.source, resistance: input.resistance ?? "fixed", members } }]);
    this.run = next; this.writerIds.push(writerId);
    return { group: { ...next.events.at(-1)!.data, createdAtSeq: next.events.at(-1)!.seq }, run: next, emitted: next.events.slice(before), comparison: compareBranches(next, members.map((member) => member.branchId)) } as import("./api.js").CreateGroupResult;
  }
  async groupReply(): Promise<import("./api.js").GroupReplyResult> {
    this.groupReplyCalls += 1;
    return { selection: await this.selectMove({ startFen: "", historyUci: [], policy: { mode: "human_common", policyConfigDigest: digest }, seed: 1 }), reusedFromNodeId: null };
  }
  async analysis(): Promise<{ readonly jobs: readonly { readonly id: string }[] }> { return { jobs: [] }; }

  async move(
    _runId: string,
    input: PlayerMoveRequest,
    writerId: string,
  ): Promise<MutationResult> {
    this.writerIds.push(writerId);
    const before = this.requiredRun().events.length;
    const moved = commitMove(this.requiredRun(), input.uci, { at });
    this.run =
      input.uci === "c1e3"
        ? reachCheckpoint(moved.run, "plan-commitment", at).run
        : moved.run;
    return { run: this.run, emitted: this.run.events.slice(before) };
  }

  async appendOpponentPly(
    _runId: string,
    selection: OpponentSelection,
    writerId: string,
    _options?: MoveOptions,
  ): Promise<MutationResult> {
    this.writerIds.push(writerId);
    const before = this.requiredRun().events.length;
    const moved = appendOpponentPly(this.requiredRun(), selection, { at });
    this.run = this.checkpointOpponentPly
      ? reachCheckpoint(moved.run, "predict-reply", at).run
      : moved.run;
    return { run: this.run, emitted: this.run.events.slice(before) };
  }

  async rewind(
    _runId: string,
    input: RewindRequest,
    writerId: string,
  ): Promise<MutationResult> {
    this.writerIds.push(writerId);
    const result =
      input.nodeId === undefined
        ? rewindToCheckpoint(this.requiredRun(), input.checkpointId, at)
        : rewind(this.requiredRun(), input.nodeId, at);
    this.run = result.run;
    return result;
  }

  async fork(
    _runId: string,
    input: ForkRequest,
    writerId: string,
  ): Promise<MutationResult> {
    this.writerIds.push(writerId);
    const result = fork(this.requiredRun(), input.nodeId, input);
    this.run = result.run;
    return result;
  }

  async graph(_runId: string, writerId?: string) {
    this.graphWriterIds.push(writerId);
    const run = this.requiredRun();
    return {
      id: run.id,
      viewer: {
        role: "host" as const,
        mayWrite: true,
        holdsLease: writerId === this.activeWriterId,
        leaseHeldBy: { learnerId: "learner-a", handle: "alice" },
      },
      nodes: run.nodes,
      branches: run.branches,
      activeCursor: run.activeCursor,
    };
  }

  async compare(_runId: string, branchIds: readonly string[]) {
    return compareBranches(this.requiredRun(), branchIds);
  }

  async events(_runId: string, sinceSeq = 0): Promise<EventsPage> {
    const events = this.requiredRun().events.filter((event) => event.seq > sinceSeq);
    return { events, nextSeq: this.requiredRun().events.at(-1)?.seq ?? 0 };
  }

  async evidence(): Promise<EvidencePage> {
    return { results: [], nextSeq: 0 };
  }

  async authoredFeedback() {
    this.authoredFeedbackCalls += 1;
    const outcome = this.run?.events.find((event) => event.type === "outcome.reached");
    return outcome === undefined
      ? { items: [], hasWithheldAuthoredContent: true }
      : {
          items: [{
            kind: "annotation" as const,
            id: "terminal#0",
            revealedBy: { kind: "outcome" as const, eventSeq: outcome.seq },
            anchor: { spineNodeId: "terminal" },
            text: "Terminal commentary",
          }],
          hasWithheldAuthoredContent: false,
        };
  }

  async applyEvidence(): Promise<MutationResult> {
    throw new Error("not used");
  }

  async pgn() {
    return { filename: "screen-run.pgn", text: "[Event \"Tabiya\"]\n" };
  }

  requiredRun(): DrillRun {
    if (this.run === undefined) throw new Error("no run");
    return this.run;
  }
}

function controller(api = new FakeApi(), storage = new MemoryStorage()) {
  const started: { runId: string }[] = [];
  return {
    api,
    started,
    controller: new DrillSessionController(api, {
      storage,
      scheduler: new FakeScheduler(),
      runId: () => "screen-run",
      seed: () => 23,
      onRunStarted: (target) => started.push(target),
    }),
  };
}

describe("DrillSessionController", () => {
  it("does not select another opponent move after the learner delivers mate", async () => {
    const terminalPack = {
      ...pack,
      id: "mate-in-one",
      start: { fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1", side: "white" },
      spine: [{ id: "mate", moveUci: "g6g7", moveSan: "Qg7#", children: [] }],
      checkpoints: [],
    } as DrillPackDefinition;
    const api = new FakeApi(terminalPack, "h8g8", false);
    const environment = controller(api);

    await environment.controller.startPack(terminalPack.id);
    const callsBeforeMove = api.authoredFeedbackCalls;
    await environment.controller.move("g6g7");

    expect(api.selected).toBeUndefined();
    expect(api.requiredRun().events.at(-1)?.type).toBe("outcome.reached");
    expect(api.authoredFeedbackCalls).toBe(callsBeforeMove + 1);
    expect(environment.controller.state.authoredFeedback?.items[0]).toMatchObject({
      text: "Terminal commentary",
      revealedBy: { kind: "outcome" },
    });
  });

  it("refreshes authored feedback when a read-only follower polls an outcome", async () => {
    const terminalPack = {
      ...pack,
      id: "follower-mate",
      start: { fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1", side: "white" },
      spine: [{ id: "mate", moveUci: "g6g7", moveSan: "Qg7#", children: [] }],
      checkpoints: [],
    } as DrillPackDefinition;
    const api = new FakeApi(terminalPack, "h8g8", false);
    await api.createRun(
      {
        id: "follower-run",
        session: { kind: "pack", packId: terminalPack.id },
        policyConfig: {
          seedMode: "fixed",
          locus: { executedAt: "server", engineIds: [], modelIds: [] },
        },
        seed: 1,
      },
      "writer-a",
    );
    const scheduler = new ManualScheduler();
    const follower = new DrillSessionController(api, {
      storage: new MemoryStorage(),
      scheduler,
    });
    await follower.resume("follower-run");
    const before = api.authoredFeedbackCalls;
    api.run = commitMove(api.requiredRun(), "g6g7", { at }).run;

    await scheduler.runAll();
    await Promise.resolve();

    expect(follower.state.runState?.run.events.at(-1)?.type).toBe("outcome.reached");
    expect(api.authoredFeedbackCalls).toBeGreaterThan(before);
    expect(follower.state.authoredFeedback?.items[0]).toMatchObject({
      text: "Terminal commentary",
    });
  });

  it("starts a pack with server capabilities without owning screen routes", async () => {
    const environment = controller();
    expect("phase" in environment.controller.state).toBe(false);
    expect("packs" in environment.controller.state).toBe(false);
    await environment.controller.startPack(pack.id);
    expect(environment.controller.state.runState?.run.id).toBe("screen-run");
    expect(environment.api.created).toMatchObject({
      seed: 23,
      policyConfig: {
        seedMode: "per_branch",
        locus: {
          executedAt: "server",
          engineIds: [{ id: "maia", version: "3" }],
          modelIds: [{ id: "maia-1800", version: "3" }],
        },
      },
    });
    expect(environment.started).toEqual([{ runId: "screen-run" }]);
  });

  it("requests and writer-appends an initial opponent ply when the authored side does not move first", async () => {
    const api = new FakeApi(blackToMovePack, "c8f5", false);
    const environment = controller(api);

    await environment.controller.startPack(blackToMovePack.id);

    expect(api.selected).toMatchObject({ historyUci: [] });
    expect(environment.controller.state.runState?.run.nodes.at(-1)).toMatchObject({
      moveUci: "c8f5",
      actor: "opponent",
    });
  });

  it("pauses at checkpoints, then selects and writer-appends the opponent ply", async () => {
    const environment = controller();
    await environment.controller.startPack(pack.id);

    await environment.controller.move("c1e3");
    expect(environment.controller.state.checkpoint).toMatchObject({
      id: "plan-commitment",
    });
    expect(environment.api.selected).toBeUndefined();

    await environment.controller.continueCheckpoint();
    expect(environment.api.selected).toMatchObject({
      historyUci: ["c1e3"],
      policy: {
        mode: "human_common",
        policyConfigDigest: digest,
        targetElo: 1800,
      },
      seed: 23,
    });
    expect(environment.controller.state.checkpoint).toMatchObject({
      id: "predict-reply",
    });
    expect(
      environment.controller.state.runState?.run.events.map((event) => event.type),
    ).toContain("opponent.move_selected");
    expect(new Set(environment.api.writerIds).size).toBe(1);
  });

  it("forks, compares, rewinds, exports, and returns to the library", async () => {
    const environment = controller();
    await environment.controller.startPack(pack.id);
    await environment.controller.move("c1e3");
    await environment.controller.continueCheckpoint();
    await environment.controller.continueCheckpoint();
    await environment.controller.fork("second look", "test intent");
    const branches = environment.controller.state.runState!.run.branches;
    expect(branches).toHaveLength(2);

    await environment.controller.compare([branches[0]!.id, branches[1]!.id]);
    expect(environment.controller.state.comparison).toBeDefined();
    environment.controller.closeCompare();
    expect(environment.controller.state.comparison).toBeUndefined();
    await environment.controller.rewind({ checkpointId: "plan-commitment" });
    expect(environment.controller.state.runState?.run.activeCursor.nodeId).toBe(
      "screen-run:node:1",
    );
    expect(await environment.controller.exportPgn()).toMatchObject({
      filename: "screen-run.pgn",
    });

    environment.controller.stopSession();
    expect(environment.controller.state).toEqual({ busy: false });
  });

  it("creates a group and routes its opponent reply through the group journal seam", async () => {
    const environment = controller();
    await environment.controller.startPack(pack.id);
    const result = await environment.controller.createGroup({
      source: "hand_picked",
      candidates: ["c1e3", "f2f3"],
    });

    expect(result?.group.members).toHaveLength(2);
    expect(environment.api.groupReplyCalls).toBe(1);
    expect(environment.controller.state.runState?.run.events).toContainEqual(
      expect.objectContaining({ type: "group.created" }),
    );
    expect(environment.controller.state.runState?.run.nodes.at(-1)).toMatchObject({ actor: "opponent" });
  });

  it("loads a foreign URL-addressed run read-only without minting a writer", async () => {
    const api = new FakeApi();
    await api.createRun(
      {
        id: "screen-run",
        session: { kind: "pack", packId: pack.id },
        policyConfig: {
          seedMode: "fixed",
          locus: { executedAt: "server", engineIds: [], modelIds: [] },
        },
        seed: 1,
      },
      "writer-a",
    );
    const storage = new MemoryStorage();
    const environment = controller(api, storage);
    await environment.controller.resume("screen-run");

    expect(environment.controller.state).toMatchObject({
      runState: { access: "read_only", run: { id: "screen-run" } },
    });
    expect(storage.values.size).toBe(0);
  });

  it("resumes a position session read-only without minting or fetching pack state", async () => {
    const api = new FakeApi();
    api.run = createRun({
      id: "position-run",
      session: {
        kind: "position",
        start: { fen: pack.start.fen, side: "white" },
        feedbackPolicy: "attempt_end",
        opponentPolicy: { mode: "human_common" },
      },
      sessionDigest: `sha256:${"9".repeat(64)}`,
      policyConfig: {
        seedMode: "fixed",
        locus: { executedAt: "server", engineIds: [], modelIds: [] },
      },
      seed: 1,
      createdAt: at,
    });
    const storage = new MemoryStorage();
    const environment = controller(api, storage);

    await environment.controller.resume("position-run");

    expect(environment.controller.state).toMatchObject({ busy: false, runState: { access: "read_only", run: { id: "position-run" } }, shapes: [] });
    expect(environment.controller.state.pack).toBeUndefined();
    expect(storage.values.size).toBe(0);
  });

  it("starts Just Play from a position and requests an initial opponent move when needed", async () => {
    const api = new FakeApi(pack, "e2e4", false);
    const environment = controller(api);

    await environment.controller.startPosition({
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      side: "black",
      mode: "human_common",
    });

    expect(api.created?.session).toMatchObject({ kind: "position", feedbackPolicy: "attempt_end" });
    expect(api.selected).toMatchObject({ startFen: expect.stringContaining("rnbqkbnr"), historyUci: [], policy: { mode: "human_common", policyConfigDigest: digest } });
    expect(environment.controller.state.pack).toBeUndefined();
    expect(environment.controller.state.runState?.run.nodes.at(-1)).toMatchObject({ moveUci: "e2e4", actor: "opponent" });
  });

  it("does not request an initial opponent ply for a read-only follower", async () => {
    const api = new FakeApi(blackToMovePack, "c8f5", false);
    await api.createRun(
      {
        id: "screen-run",
        session: { kind: "pack", packId: blackToMovePack.id },
        policyConfig: {
          seedMode: "fixed",
          locus: { executedAt: "server", engineIds: [], modelIds: [] },
        },
        seed: 1,
      },
      "writer-a",
    );
    const environment = controller(api, new MemoryStorage());

    await environment.controller.resume("screen-run");

    expect(environment.controller.state.runState?.access).toBe("read_only");
    expect(api.selected).toBeUndefined();
    expect(api.requiredRun().nodes).toHaveLength(1);
  });

  it("resumes its stored writer claim in writer mode", async () => {
    const api = new FakeApi();
    await api.createRun(
      {
        id: "screen-run",
        session: { kind: "pack", packId: pack.id },
        policyConfig: {
          seedMode: "fixed",
          locus: { executedAt: "server", engineIds: [], modelIds: [] },
        },
        seed: 1,
      },
      "writer-a",
    );
    const storage = new MemoryStorage();
    WriterSession.claimFor("screen-run", storage, () => "writer-a");
    const environment = controller(api, storage);

    await environment.controller.resume("screen-run");

    expect(environment.controller.state.runState?.access).toBe("writer");
    expect(environment.api.graphWriterIds).toEqual(["writer-a"]);
  });

  it("requests an initial opponent ply when its writer resumes an unblocked root", async () => {
    const api = new FakeApi(blackToMovePack, "c8f5", false);
    await api.createRun(
      {
        id: "screen-run",
        session: { kind: "pack", packId: blackToMovePack.id },
        policyConfig: {
          seedMode: "fixed",
          locus: { executedAt: "server", engineIds: [], modelIds: [] },
        },
        seed: 1,
      },
      "writer-a",
    );
    const storage = new MemoryStorage();
    WriterSession.claimFor("screen-run", storage, () => "writer-a");
    const environment = controller(api, storage);

    await environment.controller.resume("screen-run");

    expect(api.selected).toMatchObject({ historyUci: [] });
    expect(api.requiredRun().nodes.at(-1)).toMatchObject({ moveUci: "c8f5" });
  });

  it("does not play the initial opponent ply through a blocking checkpoint on resume", async () => {
    const api = new FakeApi(blackToMovePack, "c8f5", false);
    await api.createRun(
      {
        id: "screen-run",
        session: { kind: "pack", packId: blackToMovePack.id },
        policyConfig: {
          seedMode: "fixed",
          locus: { executedAt: "server", engineIds: [], modelIds: [] },
        },
        seed: 1,
      },
      "writer-a",
    );
    api.run = reachCheckpoint(api.requiredRun(), "plan-commitment", at).run;
    const storage = new MemoryStorage();
    WriterSession.claimFor("screen-run", storage, () => "writer-a");
    const environment = controller(api, storage);

    await environment.controller.resume("screen-run");

    expect(environment.controller.state.checkpoint).toMatchObject({
      id: "plan-commitment",
    });
    expect(api.selected).toBeUndefined();
  });
});
