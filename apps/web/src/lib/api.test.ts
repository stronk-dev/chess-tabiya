import { createRun, type DrillRun, type OpponentSelection } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { DrillApi, PLANNED_SURFACES } from "./api.js";

const run = createRun({
  id: "run / one",
  packId: "pack-one",
  packDigest: `sha256:${"a".repeat(64)}`,
  policyConfig: {
    seedMode: "fixed",
    locus: { executedAt: "server", engineIds: [], modelIds: [] },
  },
  startFen: "8/8/8/8/8/8/K6k/R7 w - - 0 1",
  seed: 7,
  createdAt: "2026-08-12T20:00:00.000Z",
});
const selection: OpponentSelection = {
  moveUci: "h2h1",
  policyModeApplied: "human_common",
  engine: {
    id: "mock",
    name: "Mock",
    version: "1",
    seedHonored: true,
  },
};

function json(value: unknown, init: ResponseInit = {}): Response {
  return Response.json(value, init);
}

describe("DrillApi", () => {
  it("binds invitations and raw PGN arena imports without losing their types", async () => {
    const calls: { readonly url: string; readonly init?: RequestInit }[] = [];
    const invitation = {
      id: "invite-one",
      sessionId: "session / one",
      leg: 2 as const,
      invitedHandle: "partner",
      invitedRole: "participant" as const,
      externalChallengeUrl: null,
      state: "open" as const,
      createdAt: "2026-08-13T12:00:00.000Z",
    };
    const leg = {
      sessionId: "session / one",
      leg: 2 as const,
      referencePlayerHandle: "partner",
      externalChallengeUrl: null,
      pgn: "[Result \"1/2-1/2\"]\n\n1. Ra2 1/2-1/2",
      result: "1/2-1/2" as const,
      branchId: "leg-two",
      importedAt: "2026-08-13T12:01:00.000Z",
    };
    const api = new DrillApi("http://tabiya.test", async (input, init) => {
      const url = String(input);
      calls.push({ url, ...(init === undefined ? {} : { init }) });
      return url.includes("/invitations") ? json({ invitation }) : json({ leg });
    });

    expect(await api.inviteToSession("session / one", { leg: 2, handle: "partner" })).toEqual(invitation);
    expect(await api.importArenaLeg("session / one", 2, leg.pgn, "writer-one", leg.result)).toEqual(leg);
    expect(calls[0]).toMatchObject({
      url: "http://tabiya.test/sessions/session%20%2F%20one/invitations",
      init: { method: "POST" },
    });
    expect(calls[1]).toMatchObject({
      url: "http://tabiya.test/sessions/session%20%2F%20one/legs/2/pgn?result=1%2F2-1%2F2",
      init: {
        method: "POST",
        body: leg.pgn,
        headers: { "content-type": "text/x-chess-pgn", "x-writer-id": "writer-one" },
      },
    });
  });

  it("types and binds the complete v1 REST surface", async () => {
    const calls: { readonly url: string; readonly init?: RequestInit }[] = [];
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, ...(init === undefined ? {} : { init }) });
      if (url.endsWith("/capabilities")) {
        return json({
          engines: [],
          policyModes: ["human_common"],
          runSchemaVersion: "0.6",
          policyProfiles: {
            strong_engine: {
              movetimeMs: 100,
              threads: 1,
              hashMb: 16,
              multiPv: 1,
            },
          },
          providers: { opponent: "mock", judge: "mock", llm: "none" },
          surfaces: {
            play: "available",
            review: "available",
            learn: "available",
            live: "available",
            create: "available",
            justPlay: "unavailable-here",
            fromPosition: "unavailable-here",
          },
        });
      }
      if (url.endsWith("/packs")) return json([]);
      if (url.endsWith("/packs/pack-one")) {
        return json(
          { id: "pack-one", version: "0.2", start: { fen: run.nodes[0]!.fen, side: "white" } },
          { headers: { "x-pack-digest": run.packDigest! } },
        );
      }
      if (url.endsWith("/runs") && init?.method === "POST") {
        return json({ run }, { status: 201 });
      }
      if (url.includes("/runs?")) return json({ runs: [] });
      if (url.endsWith("/select-move")) return json(selection);
      if (url.includes("/graph")) {
        return json({
          graph: {
            id: run.id,
            viewer: {
              role: "host",
              mayWrite: true,
              holdsLease: true,
              leaseHeldBy: { learnerId: "learner-one", handle: "one" },
            },
            nodes: run.nodes,
            branches: run.branches,
            activeCursor: run.activeCursor,
          },
        });
      }
      if (url.includes("/compare")) {
        return json({
          comparison: {
            forkNodeId: run.nodes[0]!.id,
            pairs: [],
            objectiveTimelines: { a: [], b: [] },
            checkpointHits: { a: [], b: [] },
          },
        });
      }
      if (url.includes("/events")) return json({ events: [], nextSeq: 1 });
      if (url.includes("/authored-feedback")) {
        return json({ items: [], hasWithheldAuthoredContent: true });
      }
      if (url.includes("/evidence") && init?.method !== "POST") {
        return json({ results: [], nextSeq: 0 });
      }
      if (url.includes("/pgn")) {
        return new Response("[Event \"Tabiya\"]\n", {
          headers: { "content-disposition": 'attachment; filename="run-one.pgn"' },
        });
      }
      return json({ run, emitted: [] });
    };
    const api = new DrillApi("http://tabiya.test/", fetcher);
    const createInput = {
      id: run.id,
      session: { kind: "pack" as const, packId: run.packId! },
      policyConfig: run.policyConfig,
      seed: 7,
    };

    expect(await api.capabilities()).toMatchObject({
      providers: { opponent: "mock", judge: "mock", llm: "none" },
      surfaces: { play: "available", learn: "available" },
    });
    expect(PLANNED_SURFACES).toEqual([
      "justPlay",
      "fromPosition",
    ]);
    await api.packs();
    expect((await api.pack("pack-one")).digest).toBe(run.packDigest);
    await api.createRun(createInput, "writer-one");
    await api.runs(20, 5);
    await api.selectMove({
      startFen: run.nodes[0]!.fen,
      historyUci: [],
      policy: { mode: "human_common", policyConfigDigest: run.packDigest! },
      seed: 7,
    });
    await api.move(run.id, { uci: "a2a3" }, "writer-one");
    await api.appendOpponentPly(run.id, selection, "writer-one");
    await api.rewind(run.id, { nodeId: run.nodes[0]!.id }, "writer-one");
    await api.fork(
      run.id,
      { nodeId: run.nodes[0]!.id, label: "alt-1" },
      "writer-one",
    );
    await api.graph(run.id);
    await api.compare(run.id, ["a", "b"]);
    await api.events(run.id, 1);
    await api.evidence(run.id, 2);
    await api.reveal(run.id, "writer-one");
    await api.applyEvidence(run.id, 3, "writer-one");
    expect(await api.authoredFeedback(run.id)).toEqual({
      items: [],
      hasWithheldAuthoredContent: true,
    });
    expect(await api.pgn(run.id, ["a", "b"])).toEqual({
      filename: "run-one.pgn",
      text: "[Event \"Tabiya\"]\n",
    });

    expect(calls.map((call) => new URL(call.url).pathname)).toEqual([
      "/capabilities",
      "/packs",
      "/packs/pack-one",
      "/runs",
      "/runs",
      "/select-move",
      "/runs/run%20%2F%20one/moves",
      "/runs/run%20%2F%20one/moves",
      "/runs/run%20%2F%20one/rewind",
      "/runs/run%20%2F%20one/fork",
      "/runs/run%20%2F%20one/graph",
      "/runs/run%20%2F%20one/compare",
      "/runs/run%20%2F%20one/events",
      "/runs/run%20%2F%20one/evidence",
      "/runs/run%20%2F%20one/reveal",
      "/runs/run%20%2F%20one/evidence",
      "/runs/run%20%2F%20one/authored-feedback",
      "/runs/run%20%2F%20one/pgn",
    ]);
    const writerCalls = calls.filter((call) =>
      ["/runs", "/moves", "/rewind", "/fork", "/evidence"].some((suffix) =>
        new URL(call.url).pathname.endsWith(suffix),
      ),
    );
    expect(
      writerCalls
        .filter((call) => call.init?.method === "POST")
        .every(
          (call) =>
            (call.init?.headers as Record<string, string>)["x-writer-id"] ===
            "writer-one",
        ),
    ).toBe(true);
  });

  it("surfaces structured server errors without losing the code", async () => {
    const api = new DrillApi("", async () =>
      json(
        {
          error: {
            code: "NOT_ACTIVE_WRITER",
            message: "Another client owns the run",
            reason: "lease held elsewhere",
          },
        },
        { status: 409 },
      ),
    );

    await expect(api.move("run", { uci: "e2e4" }, "writer-b")).rejects.toMatchObject({
      status: 409,
      code: "NOT_ACTIVE_WRITER",
      details: { reason: "lease held elsewhere" },
    });
  });
});
