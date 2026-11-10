import { describe, expect, it } from "vitest";
import { presentationDigest, serializePresentedEvidence, FLOAT32_POLICY_MASS_TOLERANCE } from "@chess-tabiya/runtime";
import { digestRunEventHead, resolveRunSubject } from "../../../../packages/runtime/src/run-subject.js";
import { nodeTask, nodePageFixture, occurrenceRun } from "../../../../packages/runtime/src/testing/maia-occurrence-fixture.js";
import { parseHumanSplitPage } from "./human-split-response.js";
import { humanSplitEvidence, humanSplitPresentation } from "./inspector-evidence.js";

function fixture(lines?: readonly string[]) {
  const run = occurrenceRun([]), node = run.nodes[0]!;
  const resolved = resolveRunSubject(run, { kind: "run_node", runId: run.id, nodeId: node.id, branchId: node.branchId,
    eventHeadDigest: digestRunEventHead({ runId: run.id, headSeq: run.events.length, events: run.events }) });
  const task = nodeTask({ kind: "history_conditioned", startFen: run.start.fen, historyUci: [] }, lines);
  return { page: nodePageFixture(task, resolved), fen: node.fen };
}
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value));

describe("modern Maia requested-node wire and registered receipt admission", () => {
  it.each([
    ["info multipv 1 policy 0.4 pv e2e4", "info multipv 3 pv d2d4", "bestmove e2e4"],
    ["info multipv 1 pv e2e4", "info multipv 3 pv d2d4", "bestmove e2e4"],
    ["info multipv 1 policy 0 pv e2e4", "bestmove e2e4"],
    ["bestmove e2e4"],
  ])("retains complete numeric/unknown/zero/empty rows %j", (...lines) => {
    const f = fixture(lines), parsed = parseHumanSplitPage(json(f.page), f.page.nodeId, f.fen);
    expect(parsed).toEqual(f.page); expect(Object.isFrozen(parsed.candidates)).toBe(true);
    expect(humanSplitEvidence(json(f.page), f.fen)).toEqual(f.page);
    expect(humanSplitPresentation(f.page)).toHaveLength(f.page.status === "shown" ? 1 : 0);
  });

  it("keeps the existing measured float32 tolerance rather than tightening valid reports", () => {
    const { page, fen } = fixture([`info multipv 1 policy ${1 + FLOAT32_POLICY_MASS_TOLERANCE / 2} pv e2e4`, "bestmove e2e4"]);
    expect(parseHumanSplitPage(json(page), page.nodeId, fen)).toEqual(page);
  });

  it("dispatches supplied protocol first and never retries legacy on malformed modern bytes", () => {
    const { page } = fixture();
    const legacy = { nodeId: page.nodeId, engine: page.engine, targetElo: 1500, candidates: [{ moveUci: "e2e4", rank: 1, mass: 0.4 }] };
    expect(parseHumanSplitPage(legacy, page.nodeId)).toEqual(legacy);
    for (const value of [{ ...legacy, protocol: "inspector.human_split@2" }, { ...legacy, presentation: page.presentation },
      { ...page, protocol: "inspector.human_split@1" }, { ...page, protocol: null },
      { ...page, presentation: {} }, Object.assign(Object.create({ protocol: "inspector.human_split@2" }), legacy)]) {
      expect(() => parseHumanSplitPage(value, page.nodeId)).toThrow();
    }
  });

  it("refuses inherited/missing/extra fields throughout the closed modern envelope", () => {
    const { page } = fixture();
    for (const key of Object.keys(page)) {
      const value = { ...page } as Record<string, unknown>, prior = value[key]; delete value[key];
      // A missing discriminator intentionally means legacy-only, whose exact shape must also fail.
      expect(() => parseHumanSplitPage(value, page.nodeId)).toThrow();
      Object.setPrototypeOf(value, { [key]: prior }); expect(() => parseHumanSplitPage(value, page.nodeId)).toThrow();
    }
    for (const value of [{ ...page, task: {} }, { ...page, candidates: [{ ...page.candidates[0], scoreCp: 40 }] },
      { ...page, candidates: [{ ...page.candidates[0], offWindow: true }] }, { ...page, engine: { ...page.engine, optionImage: {} } },
      { ...page, candidates: [Object.create(page.candidates[0]!)] }]) expect(() => parseHumanSplitPage(value, page.nodeId)).toThrow();
  });

  it("refuses crossed subject, identity, bands, status and complete candidate rows", () => {
    const { page, fen } = fixture();
    const variants = [{ ...page, nodeId: "foreign" }, { ...page, engine: { ...page.engine, version: "foreign" } },
      { ...page, engine: { ...page.engine, eloHonored: false } }, { ...page, requestedBand: 1700 }, { ...page, appliedBand: 1700 },
      { ...page, coverage: "complete" }, { ...page, status: "empty_population" }, { ...page, candidates: [] },
      { ...page, candidates: [...page.candidates].reverse() }, { ...page, candidates: [{ ...page.candidates[0], rank: 0 }] },
      { ...page, candidates: [{ ...page.candidates[0], mass: -1 }] }, { ...page, candidates: [{ ...page.candidates[0], mass: Infinity }] },
      { ...page, candidates: [{ ...page.candidates[0], mass: 1 }, { ...page.candidates[1], mass: 0.1 }] },
      { ...page, candidates: [page.candidates[0], { ...page.candidates[1], moveUci: page.candidates[0]!.moveUci }] },
      { ...page, candidates: [{ ...page.candidates[0], moveUci: "e2e5" }] }];
    for (const value of variants) expect(() => parseHumanSplitPage(value, page.nodeId, fen)).toThrow();
    expect(() => parseHumanSplitPage(page, "wrong-node", fen)).toThrow();
    // Even a genuine legal-looking page is not usable at another requested board position.
    expect(() => parseHumanSplitPage(page, page.nodeId, "8/8/8/8/8/8/k7/7K w - - 0 1")).toThrow();
  });

  it("refuses recomputed receipt digests over crossed consumer/source/renderer tuples", () => {
    const { page } = fixture(), base = page.presentation.items[0]!;
    const receipt = (item: typeof base) => {
      const items = [item]; return { protocol: "presentation.receipt@1" as const, items, digest: presentationDigest("presentation.receipt@1", items) };
    };
    for (const adapter of [{ ...base.adapter, consumer: { id: "inspector.human_split", version: 1 } },
      { ...base.adapter, projection: { id: "human.maia.policy", version: 1 } },
      { ...base.adapter, consumer: { id: "module.full_inspector", version: 2 } }]) {
      const item = { ...base, adapter, evidenceRef: { ...base.evidenceRef!, projection: adapter.projection } };
      expect(() => parseHumanSplitPage({ ...page, presentation: receipt(item) }, page.nodeId)).toThrow();
    }
    expect(() => parseHumanSplitPage({ ...page, presentation: serializePresentedEvidence([]) }, page.nodeId)).toThrow();
  });

  it("refuses a recomputed same-value receipt with a different fact binding or convention", () => {
    const { page } = fixture(), base = page.presentation.items[0]!;
    if (base.component.id !== "fact_statement") throw new Error("Expected exact model fact");
    for (const changed of [{ binding: "recorded_run" }, { convention: "recorded-run@1" }]) {
      const component = { ...base.component, operand: { ...base.component.operand, ...changed } };
      const body = { evidenceRef: base.evidenceRef, adapter: base.adapter, component };
      const item = { ...body, componentDigest: presentationDigest("presentation.component@1", body) }, items = [item];
      const presentation = { protocol: "presentation.receipt@1", items, digest: presentationDigest("presentation.receipt@1", items) };
      expect(() => parseHumanSplitPage({ ...page, presentation }, page.nodeId)).toThrow();
    }
  });
});
