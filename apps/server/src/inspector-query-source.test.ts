import { afterEach, describe, expect, it, vi } from "vitest";
import { compileAssistanceRequest, moduleDecisionStamp, revealFeedback, serverAvailabilityFromProviders } from "@chess-tabiya/runtime";
import { INSPECTOR_SOURCE_TOPICS, type InspectorQueryView, type InspectorSourceContext } from "../../../packages/runtime/src/inspector-query-contract.js";
import { assertDeclaredEvidence } from "../../../packages/runtime/src/evidence-contract.js";
import { recordedComparisonFixture } from "../../../packages/runtime/src/testing/recorded-comparison-fixture.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-02T22:00:00.000Z", principal = { learnerId: "query-dispatch-owner", handle: "query-dispatch-owner" };
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
function fixture(black = false) {
  const base = recordedComparisonFixture(black, "query-dispatch"), run = revealFeedback(base.run, at).run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  storage.create(run, { writerId: "query-dispatch-writer", learnerId: principal.learnerId });
  return { ...base, run, storage, service: new RunService(storage), signal: new AbortController().signal };
}
function sourceView(topic: (typeof INSPECTOR_SOURCE_TOPICS)[number], context: InspectorSourceContext): Exclude<InspectorQueryView, { kind: "inventory" }> {
  const projection = topic.projection;
  return projection === "rules.tactic.consequence.forced_mate_after_move@1" || projection === "rules.tactic.consequence.forced_mate_after_move@2"
    ? { kind: "source", projection, context, start: 0, collectionKey: null, parameters: { kind: "forced_mate", maxAttackerMoves: 1 } }
    : { kind: "source", projection, context, start: 0, collectionKey: null };
}

describe("actual complete Inspector query source composition (not Full2 registration)", () => {
  it.each([false, true])("dispatches all65 accepted topics lazily, mirrored=%s", async black => {
    const f = fixture(black), original = JSON.stringify(f.storage.read(f.run.id));
    const local = vi.spyOn(f.service, "acquireInspectorLocalSource"), model = vi.spyOn(f.service, "acquireInspectorMaiaSource"), explorer = vi.spyOn(f.service, "acquireInspectorExplorerSource");
    for (const topic of INSPECTOR_SOURCE_TOPICS) {
      local.mockClear(); model.mockClear(); explorer.mockClear();
      const kind = topic.contexts[0]!, nodeId = f.mainPath.at(-1)!.id;
      const context: InspectorSourceContext = kind === "branch" || kind === "recorded_review" ? { kind, throughNodeId: nodeId }
        : kind === "comparison" ? { kind, otherBranchId: f.peer, otherNodeId: f.peerPath.at(-1)!.id } : { kind };
      const grant = f.service.resolveInspectorRecordedContext(f.run.id, principal, requested, availability,
        { branchId: f.main, nodeId, decisionDigest: moduleDecisionStamp(f.run).digest, context }, f.signal);
      const source = await f.service.acquireInspectorQuerySource(grant, sourceView(topic, context), f.signal), result = source.read();
      expect(result.projection).toBe(topic.projection);
      expect(result.recordedCoverage).toBeNull(); // position sessions have no pack measurement ledger
      expect(result.outcome.kind === "available" ? result.occurrences.length : 0).toBe(result.outcome.kind === "available" ? result.outcome.collected : 0);
      expect(model).toHaveBeenCalledTimes(topic.family === "maia" ? 1 : 0);
      expect(explorer).toHaveBeenCalledTimes(topic.family === "explorer" ? 1 : 0);
      expect(local.mock.calls.length).toBeLessThanOrEqual(1);
      for (const row of result.occurrences) {
        assertDeclaredEvidence(row.evidence);
        expect(`${row.evidence.projection.id}@${row.evidence.projection.version}`).toBe(topic.projection);
      }
      expect(source.read()).toEqual(result);
      expect(JSON.stringify(f.storage.read(f.run.id))).toBe(original);
    }
  });

  it("does not treat a detail door as an acquisition topic or run a second collector family", async () => {
    const f = fixture(), topic = INSPECTOR_SOURCE_TOPICS.find(row => row.projection === "rules.square.reading.control@1")!;
    const context = { kind: "position" } as const, nodeId = f.mainPath[1]!.id;
    const grant = f.service.resolveInspectorRecordedContext(f.run.id, principal, requested, availability,
      { branchId: f.main, nodeId, decisionDigest: moduleDecisionStamp(f.run).digest, context }, f.signal);
    const acquire = vi.spyOn(f.service, "acquireInspectorLocalSource"), model = vi.spyOn(f.service, "acquireInspectorMaiaSource");
    const original = await f.service.acquireInspectorQuerySource(grant, sourceView(topic, context), f.signal);
    const detail = await f.service.acquireInspectorQuerySource(grant, { kind: "detail", projection: "rules.square.reading.control@1", context,
      sourceKey: original.read().sourceKey!, scope: { kind: "control_target", color: "white", mode: "legal", target: "e4" }, start: 0 }, f.signal);
    expect(detail.read()).toEqual(original.read());
    expect(acquire).toHaveBeenCalledTimes(2); expect(model).not.toHaveBeenCalled();
    acquire.mockClear();
    await expect(f.service.acquireInspectorQuerySource(grant, { kind: "source", projection: "derived.inspector.detail.square_control@1", context,
      start: 0, collectionKey: null } as unknown as Parameters<RunService["acquireInspectorQuerySource"]>[1], f.signal)).rejects.toThrow("source_contract_invalid");
    expect(acquire).not.toHaveBeenCalled();
  });
});
