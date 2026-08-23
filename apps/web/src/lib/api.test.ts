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
  it("keeps account export opaque and binds both two-phase deletion flows", async () => {
    const calls: { readonly url: string; readonly init?: RequestInit }[] = [];
    const digest = `sha256:${"f".repeat(64)}`;
    const preview = { version: 1, scope: { kind: "account" }, digest, hardDelete: [], tombstone: [], revoke: [], retainedPublished: [], backupNotice: "deployment managed" };
    const api = new DrillApi("http://tabiya.test", async (input, init) => {
      const url = String(input);
      calls.push({ url, ...(init === undefined ? {} : { init }) });
      if (url.endsWith("/auth/export")) return new Response("opaque-account-bytes", { headers: { "content-type": "application/vnd.tabiya.account+json; version=1", "content-disposition": 'attachment; filename="tabiya-account-alice.json"', "x-tabiya-export-sha256": digest } });
      if (url.endsWith("/auth/deletion-preview")) return json(preview);
      if (url.includes("/deletion-preview")) return json({ ...preview, scope: { kind: "run", runId: "run / one" } });
      return json({});
    });

    const exported = await api.exportAccount("export-password");
    expect(exported.filename).toBe("tabiya-account-alice.json");
    expect(exported.digest).toBe(digest);
    expect(await exported.blob.text()).toBe("opaque-account-bytes");
    expect(await api.accountDeletionPreview()).toEqual(preview);
    expect(await api.runDeletionPreview("run / one")).toMatchObject({ scope: { kind: "run", runId: "run / one" } });
    await api.deleteAccount("delete-password", digest);
    await api.deleteRun("run / one", digest);
    expect(calls.map((call) => [call.url, call.init?.method, call.init?.body])).toEqual([
      ["http://tabiya.test/auth/export", "POST", JSON.stringify({ password: "export-password" })],
      ["http://tabiya.test/auth/deletion-preview", "POST", JSON.stringify({})],
      ["http://tabiya.test/runs/run%20%2F%20one/deletion-preview", "POST", JSON.stringify({})],
      ["http://tabiya.test/auth/delete", "POST", JSON.stringify({ password: "delete-password", previewDigest: digest })],
      ["http://tabiya.test/runs/run%20%2F%20one/delete", "POST", JSON.stringify({ previewDigest: digest })],
    ]);
  });

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
          providers: { opponent: "mock", judge: "mock", llm: "none", corpus: "mock", tts: "none" },
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
      if (url.endsWith("/shapes")) return json({ shapes: [] });
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
      if (url.includes("/human-split")) return json({ nodeId: run.nodes[0]!.id, engine: selection.engine, targetElo: 1600, candidates: [] });
      if (url.includes("/corpus")) return json({ nodeId: run.nodes[0]!.id, committedMoveSan: null, result: { kind: "abstention", reason: "no_data_at_band", detail: "total 37 < 100", population: { source: "lichess-explorer", ratings: [1400], speeds: ["rapid"], since: "2023-09", until: "2026-08" } } });
      if (url.includes("/voice")) return json({ text: "fixture", source: "deterministic", scope: "reading" });
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
      if (url.endsWith("/group")) {
        return json({
          group: { groupId: "g1", sourceNodeId: run.nodes[0]!.id, source: "hand_picked", resistance: "fixed", members: [], createdAtSeq: 1 },
          run, emitted: [], comparison: { forkNodeId: run.nodes[0]!.id, columns: [], rows: [], groups: [], consequences: {}, objectiveTimelines: {}, checkpointHits: {}, evidence: {} },
        });
      }
      if (url.endsWith("/group-reply")) return json({ selection, reusedFromNodeId: null });
      if (url.endsWith("/analysis")) return json({ jobs: [{ id: "analysis-one" }] }, { status: 202 });
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
      providers: { opponent: "mock", judge: "mock", llm: "none", corpus: "mock", tts: "none" },
      surfaces: { play: "available", learn: "available" },
    });
    expect((await api.corpus(run.id, run.nodes[0]!.id)).result.kind).toBe("abstention");
    expect(PLANNED_SURFACES).toEqual([]);
    await api.packs();
    await api.shapes();
    expect((await api.pack("pack-one")).digest).toBe(run.packDigest);
    await api.createRun(createInput, "writer-one");
    await api.runs(20, 5);
    await expect(api.selectMove({
      startFen: run.nodes[0]!.fen,
      historyUci: [],
      policy: { mode: "human_common", policyConfigDigest: run.packDigest! },
      seed: 7,
    })).resolves.toMatchObject({ policyModeApplied: "human_common" });
    await api.humanSplit(run.id, run.nodes[0]!.id);
    await api.voice(run.id, run.nodes[0]!.id, "reading");
    await api.move(run.id, { uci: "a2a3" }, "writer-one");
    await api.appendOpponentPly(run.id, selection, "writer-one");
    await api.rewind(run.id, { nodeId: run.nodes[0]!.id }, "writer-one");
    await api.fork(
      run.id,
      { nodeId: run.nodes[0]!.id, label: "alt-1" },
      "writer-one",
    );
    await api.createGroup(run.id, { source: "hand_picked", candidates: ["a2a3", "b2b3"] }, "writer-one");
    await api.groupReply(run.id, "group-one", "writer-one");
    await api.analysis(run.id, [run.nodes[0]!.id], "writer-one");
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

    const moveCalls = calls.filter((call) => new URL(call.url).pathname.endsWith("/moves"));
    expect(JSON.parse(String(moveCalls[1]!.init!.body)).selection).not.toHaveProperty("orderingBasis");

    expect(calls.map((call) => new URL(call.url).pathname)).toEqual([
      "/capabilities",
      "/runs/run%20%2F%20one/corpus",
      "/packs",
      "/shapes",
      "/packs/pack-one",
      "/runs",
      "/runs",
      "/select-move",
      "/runs/run%20%2F%20one/human-split",
      "/runs/run%20%2F%20one/voice",
      "/runs/run%20%2F%20one/moves",
      "/runs/run%20%2F%20one/moves",
      "/runs/run%20%2F%20one/rewind",
      "/runs/run%20%2F%20one/fork",
      "/runs/run%20%2F%20one/group",
      "/runs/run%20%2F%20one/group-reply",
      "/runs/run%20%2F%20one/analysis",
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
      ["/runs", "/moves", "/rewind", "/fork", "/group", "/group-reply", "/analysis", "/evidence"].some((suffix) =>
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

  it("binds related progress with encoded run and node identities", async () => {
    const calls: string[] = [];
    const related = [{ relation: "same_position" as const, runId: "other run", branchId: "main", attemptCount: 2 }];
    const api = new DrillApi("http://tabiya.test", async (input) => {
      calls.push(String(input));
      return json({ related });
    });

    await expect(api.relatedProgress("run / one", "node ? one")).resolves.toEqual(related);
    expect(calls).toEqual(["http://tabiya.test/progress/related?runId=run+%2F+one&nodeId=node+%3F+one"]);
  });

  it("keeps Pack Studio playtest assembly server-owned and binds withdrawal", async () => {
    const calls: { readonly url: string; readonly init?: RequestInit }[] = [];
    const api = new DrillApi("http://tabiya.test", async (input, init) => {
      calls.push({ url: String(input), ...(init === undefined ? {} : { init }) });
      return String(input).endsWith("/playtest") ? json({ run, url: `/play/run/${run.id}` }, { status: 201 }) : json({ withdrawn: true });
    });

    await expect(api.playtestPackDraft("draft / one", "writer-one")).resolves.toMatchObject({ url: `/play/run/${run.id}` });
    await api.withdrawPackDraft("draft / one");
    expect(calls).toEqual([
      { url: "http://tabiya.test/packs/drafts/draft%20%2F%20one/playtest", init: expect.objectContaining({ method: "POST", body: "{}", headers: expect.objectContaining({ "x-writer-id": "writer-one" }) }) },
      { url: "http://tabiya.test/packs/drafts/draft%20%2F%20one/withdraw", init: expect.objectContaining({ method: "POST", body: "{}" }) },
    ]);
  });

  it("binds reasoning review to the recorded checkpoint occurrence", async () => {
    const calls: { readonly url: string; readonly init?: RequestInit }[] = [];
    const response = {
      provider: "external" as const,
      proposals: [{
        keyPointId: "kp-one",
        quotation: "I would improve the knight",
        text: "Possible mention, proposed by the configured language model and not a detection: you wrote \"I would improve the knight\" — the author's point \"Improve the worst piece\".",
      }],
    };
    const api = new DrillApi("http://tabiya.test", async (input, init) => {
      calls.push({ url: String(input), ...(init === undefined ? {} : { init }) });
      return json(response);
    });

    await expect(api.reasoningReview("run / one", 37)).resolves.toEqual(response);
    expect(calls).toEqual([{
      url: "http://tabiya.test/runs/run%20%2F%20one/reasoning-review",
      init: expect.objectContaining({ method: "POST", body: JSON.stringify({ checkpointEventSeq: 37 }) }),
    }]);
  });
});
