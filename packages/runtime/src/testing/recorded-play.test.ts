import { describe, expect, it } from "vitest";
import { attachEvidence } from "../evidence.js";
import { commitMove, createRun } from "../runtime.js";
import { assertOnlyEvidenceAppended, assertRecordedNodesPreserved } from "./recorded-play.js";

const run = createRun({
  id: "snapshot-control", packId: "snapshot", packDigest: `sha256:${"a".repeat(64)}`,
  policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
  startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  seed: 1, createdAt: "2026-10-08T10:00:00.000Z",
});
const recorded = commitMove(run, "e2e4").run;
const delivered = attachEvidence(recorded, recorded.activeCursor.nodeId, ["engine:control"], {
  kind: "eval", source: "engine_validated", values: { cp: 10 },
}).run;

describe("recorded-play browser assertions", () => {
  it("accepts only additive evidence while preserving every recorded play field", () => {
    expect(() => assertRecordedNodesPreserved(recorded.nodes, delivered.nodes)).not.toThrow();
    expect(() => assertOnlyEvidenceAppended(recorded.events, delivered.events)).not.toThrow();
  });

  it.each([
    ["id", "changed"], ["parentId", "changed"], ["fen", run.nodes[0]!.fen],
    ["transposeKey", "changed"], ["moveUci", "d2d4"], ["moveSan", "d4"],
    ["ply", 9], ["actor", "opponent"], ["branchId", "changed"],
    ["checkpointRefs", ["invented"]], ["objectiveState", "achieved"],
    ["createdAt", "changed"], ["clockState", { white: 10 }],
  ])("rejects changed %s even when evidence also arrives", (field, value) => {
    const changed = delivered.nodes.map((node, index) => index === 1 ? { ...node, [field]: value } : node);
    expect(() => assertRecordedNodesPreserved(recorded.nodes, changed)).toThrow();
  });

  it("rejects missing, extra or reordered nodes and lost/duplicate evidence", () => {
    expect(() => assertRecordedNodesPreserved(recorded.nodes, delivered.nodes.slice(1))).toThrow();
    expect(() => assertRecordedNodesPreserved(recorded.nodes, [...delivered.nodes, delivered.nodes[1]!])).toThrow();
    expect(() => assertRecordedNodesPreserved(recorded.nodes, [...delivered.nodes].reverse())).toThrow();
    expect(() => assertRecordedNodesPreserved(delivered.nodes, recorded.nodes)).toThrow();
    const duplicated = delivered.nodes.map(node => ({ ...node, evidenceRefs: [...node.evidenceRefs, ...node.evidenceRefs] }));
    expect(() => assertRecordedNodesPreserved(recorded.nodes, duplicated)).toThrow();
  });

  it("rejects event deletion, rewriting, and an extra played move", () => {
    expect(() => assertOnlyEvidenceAppended(recorded.events, recorded.events.slice(1))).toThrow();
    expect(() => assertOnlyEvidenceAppended(recorded.events, recorded.events.map(event => ({ ...event, at: "changed" })))).toThrow();
    const extraMove = commitMove(delivered, "e7e5").run;
    expect(() => assertOnlyEvidenceAppended(recorded.events, extraMove.events)).toThrow();
  });
});
