import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it, vi } from "vitest";
import { branchPath } from "./branch-path.js";
import { evidenceValueReceipt } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { attachEvidence } from "./evidence.js";
import { projectRun } from "./events.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { createRecordedPivotalSource, pivotalMarkers, recordedPivotalData, type PivotalKind } from "./pivotal.js";
import * as phase from "./phase.js";
import * as transition from "./transition.js";
import * as legal from "./legal-moves.js";
import { fork, rewind } from "./runtime.js";
import { recordedPivotalFixture, PIVOTAL_RULE_KINDS, RECORDED_PIVOTAL_AT as at } from "./testing/recorded-pivotal-fixture.js";

const routeFor = (kind: typeof PIVOTAL_RULE_KINDS[number]) => kind === "irreversibility" ? "derived.pivotal.irreversibility@1" : kind === "phase_change" ? "derived.pivotal.phase_change@2" : "derived.pivotal.option_collapse@2";
const sourceFor = (run: ReturnType<typeof recordedPivotalFixture>, kind: PivotalKind, throughNodeId = run.activeCursor.nodeId, branchId = run.activeCursor.branchId) => createRecordedPivotalSource({ run, branchId, throughNodeId, kind });

if (false) {
  // @ts-expect-error scoped phase_change@2 has no caller-run input arm.
  invokeEvidenceValueRoute("derived.pivotal.phase_change@2", { run: recordedPivotalFixture("phase_change"), branchId: "main" });
}

describe("recorded pivotal sources keep complete in-grant witnesses", () => {
  for (const kind of PIVOTAL_RULE_KINDS) for (const black of [false, true]) {
    it(`${kind} retains complete ordered witnesses and full-tip payloads, black=${black}`, () => {
      const run = recordedPivotalFixture(kind, black), saved = JSON.stringify(run), path = branchPath(run, run.activeCursor.branchId);
      const wanted = pivotalMarkers(run, run.activeCursor.branchId).filter(marker => marker.kind === kind);
      expect(wanted.length).toBeGreaterThan(0);
      const source = sourceFor(run, kind), values = invokeEvidenceValueRoute(routeFor(kind), { recordedPivotal: source });
      expect(values.map(value => value.evidence.payload)).toEqual(wanted);
      for (const value of values) {
        expect(value.inputs).toHaveLength(kind === "phase_change" ? 4 : kind === "option_collapse" ? 6 : 2);
        const pair = kind === "phase_change" ? ["rules.phase.reading@2", "run.record.position@1"] : kind === "option_collapse" ? ["rules.mobility.reading.legal_moves@1", "run.record.position@1"] : ["rules.transition.reading.move_irreversibility.last_of_role@1", "run.record.position@1"];
        expect(value.inputs.map(input => `${input.projection.id}@${input.projection.version}`)).toEqual(Array.from({ length: kind === "phase_change" ? 2 : kind === "option_collapse" ? 3 : 1 }, () => pair).flat());
        expect(evidenceValueReceipt(value.evidence).sourceDigests).toEqual(value.inputs.map(input => evidenceValueReceipt(input).payloadDigest));
        expect(value.inputs.filter(input => input.projection.id === "run.record.position").map(input => (input.payload as { nodeId: string }).nodeId))
          .toEqual(kind === "phase_change" ? [path[5]!.id, path[8]!.id] : kind === "option_collapse" ? [path[0]!.id, path[2]!.id, path[4]!.id] : [path.at(-1)!.id]);
        const legacy = invokeEvidenceValueRoute(`derived.pivotal.${kind}@1`, { run, branchId: run.activeCursor.branchId }).find(item => item.evidence.payload.nodeId === value.evidence.payload.nodeId)!;
        expect(evidenceValueReceipt(value.evidence).convention!.refs).toEqual(evidenceValueReceipt(legacy.evidence).convention!.refs);
      }
      expect(JSON.stringify(run)).toBe(saved);
    });

    it(`${kind} obeys every prefix instead of cropping a later marker array, black=${black}`, () => {
      const run = recordedPivotalFixture(kind, black), path = branchPath(run, run.activeCursor.branchId), full = pivotalMarkers(run, run.activeCursor.branchId).filter(marker => marker.kind === kind);
      for (let index = 0; index < path.length; index++) {
        const result = invokeEvidenceValueRoute(routeFor(kind), { recordedPivotal: sourceFor(run, kind, path[index]!.id) });
        const expected = full.filter(marker => {
          if (!path.slice(0, index + 1).some(node => node.id === marker.nodeId)) return false;
          return kind !== "option_collapse" || index >= 4;
        });
        expect(result.map(value => value.evidence.payload)).toEqual(expected);
      }
      if (kind === "option_collapse") {
        expect(full[0]!.nodeId).toBe(path[2]!.id);
        expect(invokeEvidenceValueRoute(routeFor(kind), { recordedPivotal: sourceFor(run, kind, path[2]!.id) })).toEqual([]);
        expect(invokeEvidenceValueRoute(routeFor(kind), { recordedPivotal: sourceFor(run, kind, path[3]!.id) })).toEqual([]);
      }
    });
  }

  it.each(PIVOTAL_RULE_KINDS)("%s rejects copied/wrong-kind sources and caller witness overrides before empty handling", kind => {
    const run = recordedPivotalFixture(kind), root = run.nodes[0]!.id, source = sourceFor(run, kind, root);
    expect(invokeEvidenceValueRoute(routeFor(kind), { recordedPivotal: source })).toEqual([]);
    for (const wrong of [{ ...source }, JSON.parse(JSON.stringify(source)), run]) expect(() => invokeEvidenceValueRoute(routeFor(kind), { recordedPivotal: wrong } as never)).toThrow();
    const wrongKind = sourceFor(run, kind === "phase_change" ? "irreversibility" : "phase_change", root);
    const classification = vi.spyOn(phase, "classifyPhase"), irreversible = vi.spyOn(transition, "irreversibility");
    expect(() => invokeEvidenceValueRoute(routeFor(kind), { recordedPivotal: wrongKind })).toThrow(/kind/u);
    expect(classification).not.toHaveBeenCalled(); expect(irreversible).not.toHaveBeenCalled(); vi.restoreAllMocks();
    for (const extra of [{ nodes: [] }, { markers: [] }, { positions: [] }, { throughNodeId: run.activeCursor.nodeId }]) expect(() => invokeEvidenceValueRoute(routeFor(kind), { recordedPivotal: source, ...extra } as never)).toThrow();
  });

  it("validates original later graph/FEN/edge corruption before narrowing and detector work", () => {
    const original = recordedPivotalFixture("phase_change"), later = original.activeCursor.nodeId, root = original.nodes[0]!.id;
    for (const fen of ["not-a-fen", "8/8/8/8/8/8/8/8 w - - 0 1", INITIAL_FEN]) {
      const events = original.events.map(event => event.type === "move.committed" && event.data.node.id === later ? { ...event, data: { ...event.data, node: { ...event.data.node, fen } } } : event);
      const run = projectRun(events); // Actual ordinary runtime replay admits all three strings.
      const classification = vi.spyOn(phase, "classifyPhase"), irreversible = vi.spyOn(transition, "irreversibility");
      for (const kind of PIVOTAL_RULE_KINDS) expect(() => sourceFor(run, kind, root)).toThrow();
      expect(classification).not.toHaveBeenCalled(); expect(irreversible).not.toHaveBeenCalled(); vi.restoreAllMocks();
    }
    for (const run of [{ ...original, nodes: [...original.nodes, original.nodes.at(-1)!] }, { ...original, nodes: original.nodes.map(node => node.id === later ? { ...node, parentId: node.id } : node) }]) expect(() => sourceFor(run, "phase_change", root)).toThrow();
  });

  it("refuses nonclosed/unknown/empty construction and off-path endpoints", () => {
    const run = recordedPivotalFixture("phase_change"), input = { run, branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId, kind: "phase_change" as const };
    for (const changed of [{ ...input, path: [] }, { ...input, kind: "unknown" }, { ...input, kind: { toString: () => "phase_change" } }, { ...input, branchId: "unknown" }, { ...input, branchId: "" }, { ...input, throughNodeId: "foreign" }, { ...input, throughNodeId: "" }]) expect(() => createRecordedPivotalSource(changed as never)).toThrow();
    expect(() => sourceFor(run, "human_divergence")).not.toThrow(); // Context construction does not pretend human@2/empty-source adoption shipped.
  });

  it("refuses a real replay-admitted noncanonical zero-edge root", () => {
    const original = recordedPivotalFixture("phase_change");
    const first = original.events[0]!;
    if (first.type !== "run.started") throw new Error("fixture needs a real start");
    const fen = INITIAL_FEN.replace("KQkq", "HAha"), run = projectRun([{ ...first, data: { ...first.data, start: { ...first.data.start, fen }, rootNode: { ...first.data.rootNode, fen } } }]);
    expect(branchPath(run, run.activeCursor.branchId)).toHaveLength(1);
    for (const kind of PIVOTAL_RULE_KINDS) expect(() => sourceFor(run, kind)).toThrow(/canonical/u);
  });

  it("retains distinct branch grants even when inherited marker and witness payloads are identical", () => {
    const original = recordedPivotalFixture("phase_change"), main = original.activeCursor.branchId;
    const run = fork(original, original.activeCursor.nodeId, { at }).run;
    const left = invokeEvidenceValueRoute("derived.pivotal.phase_change@2", { recordedPivotal: sourceFor(run, "phase_change", original.activeCursor.nodeId, main) });
    const right = invokeEvidenceValueRoute("derived.pivotal.phase_change@2", { recordedPivotal: sourceFor(run, "phase_change") });
    expect(left.map(item => item.evidence.payload)).toEqual(right.map(item => item.evidence.payload));
    expect(left[0]!.inputs.map(item => item.payload)).toEqual(right[0]!.inputs.map(item => item.payload));
    expect(evidenceValueReceipt(left[0]!.evidence).inputDigest).not.toBe(evidenceValueReceipt(right[0]!.evidence).inputDigest);
  });

  it.each(["phase_change", "option_collapse"] as const)("%s refuses detector output that contradicts its genuine computed readings", kind => {
    const run = recordedPivotalFixture(kind), source = sourceFor(run, kind), path = branchPath(run, run.activeCursor.branchId);
    try {
      if (kind === "phase_change") {
        const original = phase.classifyPhase;
        vi.spyOn(phase, "classifyPhase").mockImplementation(fen => ({ ...original(fen), ...(fen === path.at(-1)!.fen ? { phase: "endgame" as const } : {}) }));
      } else {
        const original = legal.exactLegalMoves;
        vi.spyOn(legal, "exactLegalMoves").mockImplementation(fen => fen === path[0]!.fen ? Object.freeze(original(fen).slice(1)) : original(fen));
      }
      expect(() => invokeEvidenceValueRoute(routeFor(kind), { recordedPivotal: source })).toThrow(/disagrees with its exact/u);
    } finally { vi.restoreAllMocks(); }
  });

  it("permits inherited endpoints before an attempt's own fork and refuses a sibling tip", () => {
    const original = recordedPivotalFixture("phase_change"), path = branchPath(original, original.activeCursor.branchId);
    const run = fork(rewind(original, path[5]!.id, at).run, path[5]!.id, { at }).run;
    const source = sourceFor(run, "phase_change", path[2]!.id);
    expect(recordedPivotalData(source).authority.path.map(node => node.id)).toEqual(path.slice(0, 3).map(node => node.id));
    expect(invokeEvidenceValueRoute("derived.pivotal.phase_change@2", { recordedPivotal: source })).toEqual([]);
    expect(() => sourceFor(run, "phase_change", path.at(-1)!.id)).toThrow(/endpoint/u);
  });

  it("isolates caller snapshots without freezing them and owns exact original occurrence/head", () => {
    const original = recordedPivotalFixture("phase_change"), run = structuredClone(original), input = { run, branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId, kind: "phase_change" as const };
    const source = createRecordedPivotalSource(input), before = invokeEvidenceValueRoute("derived.pivotal.phase_change@2", { recordedPivotal: source });
    expect(Object.isFrozen(run)).toBe(false); expect(Object.isFrozen(run.nodes[0])).toBe(false); expect(Object.isFrozen(input)).toBe(false);
    (run.nodes[0]! as { fen: string }).fen = "changed"; (run.events[0]! as { at: string }).at = "changed"; input.throughNodeId = "changed";
    expect(invokeEvidenceValueRoute("derived.pivotal.phase_change@2", { recordedPivotal: source })).toEqual(before);
    expect(Object.isFrozen(recordedPivotalData(source).run.events[0])).toBe(true);
    const changedHead = (centipawns: number) => attachEvidence(original, original.nodes[0]!.id, ["synthetic:equal-ref"], { kind: "eval", source: "engine_validated", values: { centipawns } }, at).run;
    const left = invokeEvidenceValueRoute("derived.pivotal.phase_change@2", { recordedPivotal: sourceFor(changedHead(1), "phase_change") });
    const right = invokeEvidenceValueRoute("derived.pivotal.phase_change@2", { recordedPivotal: sourceFor(changedHead(2), "phase_change") });
    expect(left[0]!.evidence.payload).toEqual(right[0]!.evidence.payload);
    expect(evidenceValueReceipt(left[0]!.evidence).inputDigest).not.toBe(evidenceValueReceipt(right[0]!.evidence).inputDigest);
  });

  it("keeps fixed tuple declarations exact and current consumers unchanged", () => {
    for (const kind of ["phase_change", "option_collapse"] as const) {
      const projection = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === `derived.pivotal.${kind}` && row.version === 2)!;
      expect(projection.derivation!.inputs).toHaveLength(kind === "phase_change" ? 4 : 6);
      expect(projection.derivation!.inputs!.filter(ref => ref.id === "run.record.position")).toHaveLength(kind === "phase_change" ? 2 : 3);
      expect(PRIMARY_EVIDENCE_MANIFEST.bindings.filter(binding => binding.projection.id === projection.id && binding.projection.version === 2)).toEqual([]);
    }
  });
});
