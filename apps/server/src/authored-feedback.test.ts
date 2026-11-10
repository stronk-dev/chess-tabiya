import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  appendEvents,
  createRun,
  reachCheckpoint,
  rewind,
  type DrillRun,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import {
  projectAuthoredFeedback,
  revealedAuthoredItems,
} from "./authored-feedback.js";
import { PackRegistry, type PackRecord } from "./pack-registry.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { sha256 } from "./sourcing/canonical.js";
import { validateClaimBindings } from "./sourcing/claim-binding.js";
import type { EvidenceLedger, SourcingIssue } from "./sourcing/types.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { at, policyConfig, registered, newRun, play } from "./authored-feedback-test-support.js";

function smallPack(overrides: Record<string, unknown> = {}): DrillPackDefinition {
  return {
    id: "authored-small",
    version: "0.1.0",
    title: "Authored feedback test",
    mode: "plan",
    phase: "opening",
    start: {
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      side: "white",
    },
    objective: { type: "play_until_checkpoint", summary: "Exercise feedback projection without grading chess." },
    spine: [
      {
        id: "e4",
        moveUci: "e2e4",
        moveSan: "e4",
        annotations: ["King pawn"],
        children: [
          {
            id: "e5",
            moveUci: "e7e5",
            moveSan: "e5",
            annotations: ["Open game"],
            children: [],
          },
        ],
      },
    ],
    checkpoints: [{ id: "reveal", trigger: { atSpineNode: "e4" } }],
    opponentPolicy: { mode: "human_common", seedMode: "fixed" },
    feedbackPolicy: "delayed_checkpoint",
    provenance: { reviewStatus: "draft", sources: [], reviewers: [] },
    requires: [],
    ...overrides,
  } as DrillPackDefinition;
}

describe("authored feedback projection", () => {
  it("persists an atStart checkpoint when a pack run is created", async () => {
    const document = smallPack({
      planClasses: [{ id: "root-plan", label: "Root plan" }],
      checkpoints: [
        {
          id: "root-intent",
          trigger: { atStart: true },
          actions: [],
          interaction: { type: "intent_capture", planClassIds: ["root-plan"] },
        },
      ],
    });
    const registry = await PackRegistry.fromDocuments([
      { source: "root-checkpoint", value: withDerivedRequires(document) },
    ]);
    const storage = new SQLiteRunStorage();
    try {
      const service = new RunService(storage, { packRegistry: registry });
      const run = await service.create(
        {
          id: "root-checkpoint",
          session: { kind: "pack", packId: document.id },
          policyConfig,
          seed: 23,
          createdAt: at,
        },
        "writer-a",
      );
      expect(run.events).toContainEqual(
        expect.objectContaining({
          type: "checkpoint.reached",
          data: expect.objectContaining({ checkpointId: "root-intent" }),
        }),
      );
      expect(storage.read("root-checkpoint")!.run.events).toContainEqual(
        expect.objectContaining({
          type: "checkpoint.reached",
          data: expect.objectContaining({ checkpointId: "root-intent" }),
        }),
      );
    } finally {
      storage.close();
    }
  });

  it("releases a root-anchored deviation note after a checkpoint reveal", async () => {
    const document = smallPack({ deviations: [{ at: { atStart: true }, moveUci: "e2e4", class: "interesting_deviation", note: "Root alternative fixture." }] });
    const pack = await registered(document);
    let run = play(newRun(pack, "root-note"), ["e2e4"]);
    run = reachCheckpoint(run, "reveal", at).run;
    expect(projectAuthoredFeedback(pack, run).items).toContainEqual(expect.objectContaining({ kind: "deviation", anchor: { atStart: true, moveUci: "e2e4" }, note: "Root alternative fixture." }));
  });



  it("uses checkpoint occurrence sequence to distinguish repeated ids on branches", async () => {
    const document = smallPack({
      spine: [
        {
          id: "e4",
          moveUci: "e2e4",
          moveSan: "e4",
          annotations: ["First branch"],
          children: [],
        },
        {
          id: "d4",
          moveUci: "d2d4",
          moveSan: "d4",
          annotations: ["Second branch"],
          children: [],
        },
      ],
      checkpoints: [{ id: "choice", trigger: { atPly: 1 } }],
    });
    const pack = await registered(document);
    let run = newRun(pack, "repeated-checkpoint");
    const rootId = run.activeCursor.nodeId;
    run = play(run, ["e2e4"]);
    run = reachCheckpoint(run, "choice", at).run;
    const firstSeq = run.events.at(-1)!.seq;
    run = rewind(run, rootId, at).run;
    run = play(run, ["d2d4"]);
    run = reachCheckpoint(run, "choice", at).run;
    const secondSeq = run.events.at(-1)!.seq;

    const items = projectAuthoredFeedback(pack, run).items;
    expect(items.find((item) => item.id === "e4#0")?.revealedBy).toEqual({
      kind: "checkpoint",
      checkpointId: "choice",
      eventSeq: firstSeq,
    });
    expect(items.find((item) => item.id === "d4#0")?.revealedBy).toEqual({
      kind: "checkpoint",
      checkpointId: "choice",
      eventSeq: secondSeq,
    });
  });

  it("reveals the whole root-to-end path only when a segment completes", async () => {
    const pack = await registered(
      smallPack({
        feedbackPolicy: "segment_end",
        checkpoints: [
          { id: "start", trigger: { atSpineNode: "e4" } },
          { id: "finish", trigger: { atSpineNode: "e5" } },
        ],
      }),
    );
    let run = play(newRun(pack, "segment"), ["e2e4"]);
    run = reachCheckpoint(run, "start", at).run;
    expect(projectAuthoredFeedback(pack, run).items).toEqual([]);
    run = play(run, ["e7e5"]);
    run = reachCheckpoint(run, "finish", at).run;
    const finish = run.events.find(
      (event) => event.type === "checkpoint.reached" && event.data.checkpointId === "finish",
    )!;

    expect(projectAuthoredFeedback(pack, run).items).toEqual([
      expect.objectContaining({ id: "e4#0", revealedBy: { kind: "checkpoint", checkpointId: "finish", eventSeq: finish.seq } }),
      expect.objectContaining({ id: "e5#0", revealedBy: { kind: "checkpoint", checkpointId: "finish", eventSeq: finish.seq } }),
    ]);
  });

  it("accepts a genuine pre-guard zero-length segment record", async () => {
    const pack = await registered(smallPack({
      feedbackPolicy: "segment_end",
      checkpoints: [
        { id: "start", trigger: { atSpineNode: "e4" } },
        { id: "finish", trigger: { atSpineNode: "e4" } },
      ],
    }));
    let run = play(newRun(pack, "legacy-zero-segment"), ["e2e4"]);
    run = reachCheckpoint(run, "start", at).run;
    run = reachCheckpoint(run, "finish", at).run;
    const checkpoints = run.events.filter((event) => event.type === "checkpoint.reached");
    const start = checkpoints[0]!;
    const finish = checkpoints[1]!;
    run = appendEvents(run, [{
      type: "segment.completed",
      at,
      data: {
        branchId: start.data.branchId,
        startCheckpointEventSeq: start.seq,
        endCheckpointEventSeq: finish.seq,
        startNodeId: start.data.nodeId,
        endNodeId: finish.data.nodeId,
      },
    }]);

    expect(projectAuthoredFeedback(pack, run).items).toEqual([
      expect.objectContaining({
        id: "e4#0",
        revealedBy: { kind: "checkpoint", checkpointId: "finish", eventSeq: finish.seq },
      }),
    ]);
  });

  it("delivers prose after the final checkpoint on the actual terminal path", async () => {
    const pack = await registered(smallPack({
      start: {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        side: "black",
      },
      spine: [
        {
          id: "f3", moveUci: "f2f3", moveSan: "f3", children: [
            {
              id: "e5", moveUci: "e7e5", moveSan: "e5", children: [
                {
                  id: "g4", moveUci: "g2g4", moveSan: "g4", annotations: ["After checkpoint"], children: [
                    { id: "qh4", moveUci: "d8h4", moveSan: "Qh4#", annotations: ["Terminal"], children: [] },
                  ],
                },
              ],
            },
          ],
        },
      ],
      checkpoints: [{ id: "final-checkpoint", trigger: { atSpineNode: "e5" } }],
    }));
    let run = play(newRun(pack, "post-checkpoint"), ["f2f3", "e7e5"]);
    run = reachCheckpoint(run, "final-checkpoint", at).run;
    run = play(run, ["g2g4", "d8h4"]);
    const outcome = run.events.at(-1)!;
    expect(outcome.type).toBe("outcome.reached");
    expect(projectAuthoredFeedback(pack, run).items).toEqual([
      expect.objectContaining({
        id: "g4#0",
        revealedBy: { kind: "outcome", eventSeq: outcome.seq },
      }),
      expect.objectContaining({
        id: "qh4#0",
        revealedBy: { kind: "outcome", eventSeq: outcome.seq },
      }),
    ]);
  });

  it("keeps unanchored claims withheld until the authored spine is exhausted", async () => {
    const pack = await registered(
      smallPack({
        concepts: ["break-timing"],
        planClasses: [{ id: "choice", label: "Choose me" }],
        checkpoints: [
          {
            id: "reveal",
            trigger: { atSpineNode: "e4" },
            interaction: { type: "intent_capture", planClassIds: ["choice"] },
          },
        ],
        deviations: [
          { at: { spineNodeId: "e4" }, moveUci: "c7c5", class: "interesting_deviation" },
        ],
        feedbackClaims: [
          { id: "unanchored", text: "Never deliver", evidenceTypes: ["hypothesis"] },
        ],
      }),
    );
    let run = play(newRun(pack, "extraction"), ["e2e4"]);
    run = reachCheckpoint(run, "reveal", at).run;

    const page = projectAuthoredFeedback(pack, run);
    expect(page.items.map((item) => item.kind)).toEqual(["annotation", "plan_class"]);
    expect(page.items.at(-1)).toMatchObject({ label: "Choose me" });
    expect(page.items.at(-1)).not.toHaveProperty("description");
    expect(page.hasWithheldAuthoredContent).toBe(true);
    expect(revealedAuthoredItems(pack, run)).toEqual(
      new Map(page.items.map((item) => [item.id, item.revealedBy])),
    );
  });

  it("delivers an admitted claim at the latest released occurrence, then withdraws it when play resumes", async () => {
    const pack = await registered(smallPack({
      checkpoints: [{ id: "finish", trigger: { atSpineNode: "e5" } }],
      feedbackClaims: [{ id: "whole-line", text: "The authored line has been rehearsed.", evidenceTypes: ["hypothesis"] }],
    }));
    let run = play(newRun(pack, "claim-exhaustion"), ["e2e4", "e7e5"]);
    run = reachCheckpoint(run, "finish", at).run;
    const checkpoint = run.events.at(-1)!;

    const page = projectAuthoredFeedback(pack, run);
    expect(page.items.filter((item) => item.kind === "claim")).toEqual([expect.objectContaining({
        kind: "claim",
        id: "claim#whole-line",
        revealedBy: { kind: "checkpoint", checkpointId: "finish", eventSeq: checkpoint.seq },
        anchor: { claimId: "whole-line" },
        evidenceTypes: ["hypothesis"],
        earnedEvidenceTypes: [],
        binding: "self_declared",
        authorSpans: [],
        principles: [],
      })]);
    expect(page.hasWithheldAuthoredContent).toBe(false);

    run = rewind(run, run.nodes[0]!.id, at).run;
    expect(projectAuthoredFeedback(pack, run).items.filter((item) => item.kind === "claim")).toEqual([]);
    expect(projectAuthoredFeedback(pack, run).hasWithheldAuthoredContent).toBe(true);
    run = play(run, ["d2d4"]);
    expect(projectAuthoredFeedback(pack, run).items.filter((item) => item.kind === "claim")).toEqual([]);
  });

  it("does not count a machine-labelled claim with no validating binding as withheld content", async () => {
    const pack = await registered(smallPack({
      checkpoints: [{ id: "finish", trigger: { atSpineNode: "e5" } }],
      feedbackClaims: [{ id: "unbacked", text: "A corpus assertion with no record.", evidenceTypes: ["corpus_observed"] }],
    }));
    let run = play(newRun(pack, "claim-fail-closed"), ["e2e4", "e7e5"]);
    run = reachCheckpoint(run, "finish", at).run;

    const page = projectAuthoredFeedback(pack, run);
    expect(page.items.filter((item) => item.kind === "claim")).toEqual([]);
    expect(page.hasWithheldAuthoredContent).toBe(false);
  });

  it("delivers exhausted claims under every run feedback policy without creating a new reveal", async () => {
    const base = await registered(smallPack({
      start: {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        side: "white",
      },
      spine: [{ id: "f3", moveUci: "f2f3", moveSan: "f3", children: [{ id: "e5", moveUci: "e7e5", moveSan: "e5", children: [{ id: "g4", moveUci: "g2g4", moveSan: "g4", children: [{ id: "mate", moveUci: "d8h4", moveSan: "Qh4#", children: [] }] }] }] }],
      checkpoints: [{ id: "first", trigger: { atSpineNode: "f3" } }],
      feedbackClaims: [{ id: "terminal-line", text: "The whole authored line was reached.", evidenceTypes: ["hypothesis"] }],
    }));
    for (const feedbackPolicy of ["delayed_checkpoint", "segment_end", "attempt_end", "immediate_guard"] as const) {
      const pack: PackRecord = feedbackPolicy === "attempt_end"
        ? base
        : { ...base, feedbackPolicy };
      const initial = feedbackPolicy === "attempt_end"
        ? createRun({
            id: `claim-${feedbackPolicy}`,
            session: {
              kind: "position",
              start: { fen: pack.document.start.fen, side: "white" },
              feedbackPolicy,
              opponentPolicy: { mode: "human_common" },
            },
            sessionDigest: pack.digest,
            policyConfig,
            seed: 23,
            createdAt: at,
          })
        : newRun(pack, `claim-${feedbackPolicy}`);
      let partial = play(initial, ["f2f3"]);
      partial = reachCheckpoint(partial, "first", at).run;
      expect(projectAuthoredFeedback(pack, partial).items.filter((item) => item.kind === "claim")).toEqual([]);
      const run = play(partial, ["e7e5", "g2g4", "d8h4"]);
      const outcome = run.events.at(-1)!;
      expect(outcome.type).toBe("outcome.reached");
      expect(projectAuthoredFeedback(pack, run).items.filter((item) => item.kind === "claim")).toEqual([
        expect.objectContaining({ revealedBy: { kind: "outcome", eventSeq: outcome.seq } }),
      ]);
    }
  });

  it("does not reveal a claim after an early terminal result under any policy, including after rewind", async () => {
    const base = await registered(smallPack({
      start: {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        side: "white",
      },
      spine: [
        { id: "f3", moveUci: "f2f3", moveSan: "f3", children: [{ id: "e5", moveUci: "e7e5", moveSan: "e5", children: [{ id: "g4", moveUci: "g2g4", moveSan: "g4", children: [{ id: "mate", moveUci: "d8h4", moveSan: "Qh4#", children: [] }] }] }] },
        { id: "d4", moveUci: "d2d4", moveSan: "d4", children: [] },
      ],
      checkpoints: [{ id: "first", trigger: { atSpineNode: "f3" } }],
      feedbackClaims: [{ id: "pack-wide", text: "This describes the authored tree.", evidenceTypes: ["hypothesis"] }],
    }));
    for (const feedbackPolicy of ["delayed_checkpoint", "segment_end", "attempt_end", "immediate_guard"] as const) {
      const pack: PackRecord = feedbackPolicy === "attempt_end" ? base : { ...base, feedbackPolicy };
      const initial = feedbackPolicy === "attempt_end"
        ? createRun({
            id: `claim-early-terminal-${feedbackPolicy}`,
            session: { kind: "position", start: pack.document.start, feedbackPolicy, opponentPolicy: { mode: "human_common" } },
            sessionDigest: pack.digest,
            policyConfig,
            seed: 23,
            createdAt: at,
          })
        : newRun(pack, `claim-early-terminal-${feedbackPolicy}`);
      const run = play(initial, ["f2f3", "e7e5", "g2g4", "d8h4"]);
      expect(run.events.at(-1)?.type).toBe("outcome.reached");
      expect(projectAuthoredFeedback(pack, run).items.filter((item) => item.kind === "claim")).toEqual([]);
      const rewound = rewind(run, run.nodes[0]!.id, at).run;
      expect(projectAuthoredFeedback(pack, rewound).items.filter((item) => item.kind === "claim")).toEqual([]);
    }
  });

  it("keeps both ledger-less registry fallbacks empty and fails machine labels closed", async () => {
    const seed = smallPack({ id: "registry-seed" });
    const registry = await PackRegistry.fromDocuments([{ source: "registry-seed", value: withDerivedRequires(seed) }]);
    const document = withDerivedRequires(smallPack({
      id: "registry-fallback",
      checkpoints: [{ id: "finish", trigger: { atSpineNode: "e5" } }],
      feedbackClaims: [{ id: "machine-only", text: "A machine-labelled assertion.", evidenceTypes: ["corpus_observed"] }],
    }));
    const records = [
      registry.addCommunity(document, `sha256:${"1".repeat(64)}`, "publisher"),
      registry.addPlaytest(document, `sha256:${"2".repeat(64)}`),
    ];
    for (const record of records) {
      expect(record.assessmentGrounding).toBe("unverified");
      expect([...record.boundClaimIds]).toEqual([]);
      expect([...record.claimBackings]).toEqual([]);
      let run = play(newRun(record, `fallback-${record.digest.slice(-1)}`), ["e2e4", "e7e5"]);
      run = reachCheckpoint(run, "finish", at).run;
      const page = projectAuthoredFeedback(record, run);
      expect(page.items.filter((item) => item.kind === "claim")).toEqual([]);
      expect(page.hasWithheldAuthoredContent).toBe(false);
    }
  });

  it("delivers a derived-feature-only claim through the explicit self-declared default", async () => {
    const pack = await registered(smallPack({
      checkpoints: [{ id: "finish", trigger: { atSpineNode: "e5" } }],
      feedbackClaims: [{ id: "derived-only", text: "An authored derived-feature claim.", evidenceTypes: ["derived_feature"] }],
    }));
    expect(pack.claimBackings.get("derived-only")).toEqual({
      binding: "self_declared",
      instrumentKinds: [],
      rendered: [],
      authorSpans: [],
      principles: [],
    });
    let run = play(newRun(pack, "claim-derived-default"), ["e2e4", "e7e5"]);
    run = reachCheckpoint(run, "finish", at).run;
    expect(projectAuthoredFeedback(pack, run).items).toContainEqual(expect.objectContaining({
      kind: "claim",
      id: "claim#derived-only",
      binding: "self_declared",
      earnedEvidenceTypes: [],
      authorSpans: [],
      principles: [],
    }));
  });

  it("withholds a bound claim after its index pointer rebounds onto a reordered claim", async () => {
    const machineText = "31.4%";
    const document = smallPack({
      checkpoints: [{ id: "finish", trigger: { atSpineNode: "e5" } }],
      feedbackClaims: [
        { id: "machine", text: machineText, evidenceTypes: ["corpus_observed"] },
        { id: "authored", text: "An author-declared companion.", evidenceTypes: ["hypothesis"] },
      ],
    });
    const ledger: EvidenceLedger = {
      schema: "tabiya.sourcing.evidence.v1",
      sourcedAt: at,
      records: [{
        kind: "explorer_position_census",
        anchor: { fen: document.start.fen },
        sourceId: "rebound-fixture",
        retrievedAt: at,
        grounds: "machine_validation",
        values: {
          fen: document.start.fen,
          total: 1000,
          whitePct: 50,
          drawPct: 20,
          blackPct: 30,
          topMoves: [{ san: "e4", uci: "e2e4", playedCount: 314, sharePct: 31.4 }],
          ratings: [1400],
          speeds: ["rapid"],
          since: "2024-01",
          until: "2026-07",
        },
        supports: ["/start/fen"],
      }],
      abstentions: [],
      claimBindings: [{
        claimId: "machine",
        pointer: "/feedbackClaims/0/text",
        textSha256: sha256(machineText),
        spans: [{ span: machineText, assertion: { kind: "explorer.moveSharePct@v1", args: { fen: document.start.fen, san: "e4" } } }],
      }],
    };
    const original = (await PackRegistry.fromDocuments([{ source: "rebound-original", value: withDerivedRequires(document), ledger }])).required(document.id);
    expect(original.boundClaimIds.has("machine")).toBe(true);

    const reorderedClaims = structuredClone(document.feedbackClaims!);
    const reordered = {
      ...structuredClone(document),
      feedbackClaims: [reorderedClaims[1]!, reorderedClaims[0]!],
    } as DrillPackDefinition;
    const issues: SourcingIssue[] = [];
    validateClaimBindings(reordered, ledger, issues);
    expect(issues.map((issue) => issue.code)).toContain("CLAIM_POINTER_REBOUND");
    const rebound = (await PackRegistry.fromDocuments([{ source: "rebound-reordered", value: withDerivedRequires(reordered), ledger }])).required(reordered.id);
    expect(rebound.boundClaimIds.has("machine")).toBe(false);

    let run = play(newRun(rebound, "claim-rebound"), ["e2e4", "e7e5"]);
    run = reachCheckpoint(run, "finish", at).run;
    const claims = projectAuthoredFeedback(rebound, run).items.filter((item) => item.kind === "claim");
    expect(claims.map((item) => item.anchor.claimId)).toEqual(["authored"]);
  });




});
