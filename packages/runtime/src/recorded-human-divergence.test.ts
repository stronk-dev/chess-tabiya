import { describe, expect, it, vi } from "vitest";
import { branchPath } from "./branch-path.js";
import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { projectRun } from "./events.js";
import { createRecordedPivotalSource, pivotalMarkerPayloadsForKind, recordedPivotalData } from "./pivotal.js";
import * as pivotal from "./pivotal.js";
import * as recorded from "./recorded-inspector.js";
import { invokeEvidenceValueRoute, readRecordedHumanDivergenceInvocation } from "./internal/evidence-value-routes.js";
import { commitMove, fork, rewind } from "./runtime.js";
import * as subjects from "./run-subject.js";
import { humanObservationRun, recordHumanObservation, splitCandidates, HUMAN_AT as at } from "./testing/recorded-human-divergence-fixture.js";
import type { DrillRun } from "./types.js";

const route = "derived.pivotal.human_divergence@2";
const sourceFor = (run: DrillRun, branchId = run.activeCursor.branchId, throughNodeId = run.activeCursor.nodeId) => createRecordedPivotalSource({ run, branchId, throughNodeId, kind: "human_divergence" });
const prepare = (run: DrillRun) => { const source = sourceFor(run), items = invokeEvidenceValueRoute(route, { recordedPivotal: source }); return { source, items, proof: readRecordedHumanDivergenceInvocation(items, source) }; };

describe("scoped recorded human-choice evidence", () => {
  it.each([false, true])("retains exact reported facts, literal inputs and requested context, black=%s", black => {
    for (const targetElo of [undefined, 1450]) {
      const run = recordHumanObservation(humanObservationRun(black, targetElo), splitCandidates(black));
      const { source, items, proof } = prepare(run); expect(items).toHaveLength(1);
      const value = items[0]!, { selection, position, ...marker } = value.evidence.payload;
      expect(marker).toEqual(pivotalMarkerPayloadsForKind(run, run.activeCursor.branchId, "human_divergence")[0]);
      expect(value.inputs).toEqual([selection, position]); expect(selection.payload.event.data.selection.candidates).toEqual(splitCandidates(black));
      expect(position.payload).toEqual({ nodeId: run.nodes[0]!.id, ply: run.nodes[0]!.ply, fen: run.nodes[0]!.fen });
      expect(selection.payload.requestedTargetElo).toBe(targetElo ?? null);
      expect(evidenceValueReceipt(value.evidence).sourceDigests).toEqual(value.inputs.map(input => evidenceValueReceipt(input).payloadDigest));
      expect(evidenceValueReceipt(value.evidence).convention!.derivation).toEqual({
        kind: "derived", member: "recorded.inspector.maia_selection@1+run.record.position@1",
        inputs: value.inputs.map(input => ({
          projection: `${input.projection.id}@${input.projection.version}`,
          valueDigest: `sha256:${evidenceDigest({ producer: `${input.producer.id}@${input.producer.version}`,
            projection: `${input.projection.id}@${input.projection.version}`,
            payloadDigest: evidenceValueReceipt(input).payloadDigest, convention: evidenceValueReceipt(input).convention!.digest })}`,
        })).sort((a, b) => a.projection.localeCompare(b.projection) || a.valueDigest.localeCompare(b.valueDigest)),
      });
      const projection = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === value.evidence.projection.id && row.version === 2)!;
      expect(projection).toMatchObject({ grounding: "recorded_run", exactness: "measured", confidence: "reported" });
      expect(projection.derivation!.inputs).toEqual(value.inputs.map(input => input.projection));
      expect(proof.observations[0]!.disposition).toBe("matched");
      expect(recordedPivotalData(source).humanObservations![0]!.resolved).toBe(proof.observations[0]!.resolved);
      expect(Object.isFrozen(proof.observations)).toBe(true); expect(Object.isFrozen(selection.payload.event.data.selection.candidates)).toBe(true);
    }
  });

  const splitCases: readonly [string, readonly { mass?: number; offWindow?: boolean }[], boolean][] = [
    ["normalized positive", [{ mass: 0.2 }, { mass: 0.2 }, { mass: 0.2 }], true],
    ["maximum boundary", [{ mass: 0.5 }, { mass: 0.25 }, { mass: 0.25 }], true],
    ["maximum exceeded", [{ mass: 0.5001 }, { mass: 0.25 }, { mass: 0.2499 }], false],
    ["third boundary", [{ mass: 0.5 }, { mass: 0.35 }, { mass: 0.15 }], true],
    ["third below", [{ mass: 0.5 }, { mass: 0.3501 }, { mass: 0.1499 }], false],
    ["only two", [{ mass: 0.5 }, { mass: 0.5 }], false],
    ["zero total", [{ mass: 0 }, { mass: 0 }, { mass: 0 }], false],
    ["missing in-window mass", [{ mass: 0.4 }, { mass: 0.3 }, {}], false],
    ["omitted off-window mass", [{ mass: 0.4 }, { mass: 0.3 }, { mass: 0.3 }, { offWindow: true }], true],
    ["excluded off-window peak", [{ mass: 0.2 }, { mass: 0.2 }, { mass: 0.2 }, { mass: 0.9, offWindow: true }], true],
    ["all off-window", [{ mass: 0.3, offWindow: true }, { mass: 0.3, offWindow: true }], false],
    ["present row without mass", [{}], false],
  ];
  it.each(splitCases)("shares the unchanged reported-window arithmetic: %s", (_, cases, matches) => {
    const candidates = cases.map((entry, index) => ({ moveUci: ["e2e4", "d2d4", "g1f3", "b1c3"][index]!, rank: index + 1, ...entry }));
    const run = recordHumanObservation(humanObservationRun(), candidates), { items, proof } = prepare(run);
    expect(items).toHaveLength(matches ? 1 : 0); expect(proof.observations[0]!.disposition).toBe(matches ? "matched" : "nonmatch");
    expect(proof.observations[0]!.selection.kind).toBe("available");
    expect(pivotalMarkerPayloadsForKind(run, run.activeCursor.branchId, "human_divergence")).toHaveLength(items.length);
  });

  it("retains missing/present/mixed per-selection states without inventing a completed empty slot", () => {
    const initial = humanObservationRun(); expect(prepare(initial).proof.observations).toEqual([]);
    const absent = prepare(recordHumanObservation(initial, undefined));
    expect(absent.items).toEqual([]); expect(absent.proof.observations[0]).toMatchObject({ disposition: "source_absent", selection: { kind: "unavailable", reason: "source_absent" }, item: null });
    const complete = recordHumanObservation(initial, splitCandidates()), mixed = prepare(recordHumanObservation(complete, undefined));
    expect(mixed.items).toHaveLength(1); // Internal facts retained; the later node adapter must publish unavailable and no items.
    expect(mixed.proof.observations.map(row => row.disposition)).toEqual(["matched", "source_absent"]);
    expect(mixed.proof.observations.map(row => row.event.seq)).toEqual(mixed.proof.observations.map(row => row.resolved.run.events[row.event.seq - 1]!.seq));
    expect(mixed.proof.observations[0]!.item).toBe(mixed.items[0]);
  });

  it("keeps the actual schema empty-telemetry blocker visible instead of manufacturing source authority", () => {
    const run = recordHumanObservation(humanObservationRun(), []);
    // Event projection alone does not validate the canonical schema. The actual source
    // resolver must refuse the empty telemetry before issuing any recorded authority.
    expect(() => sourceFor(run)).toThrow(/fewer than 1 items/);
  });

  it.each([false, true])("uses current full-head observations at every granted prefix without an invented event cutoff, black=%s", black => {
    let run = humanObservationRun(black), root = run.nodes[0]!.id;
    run = commitMove(run, black ? "e7e5" : "e2e4", { at }).run; const middle = run.activeCursor.nodeId;
    run = commitMove(run, black ? "e2e4" : "e7e5", { at }).run; const tip = run.activeCursor.nodeId;
    // Observations are deliberately appended in reverse anchor order after all moves.
    run = recordHumanObservation(run, splitCandidates(black), tip);
    run = recordHumanObservation(run, splitCandidates(!black), middle);
    run = recordHumanObservation(run, splitCandidates(black), root);
    const branch = run.activeCursor.branchId;
    for (const endpoint of branchPath(run, branch)) {
      const source = sourceFor(run, branch, endpoint.id), items = invokeEvidenceValueRoute(route, { recordedPivotal: source });
      const path = branchPath(run, branch).slice(0, endpoint.ply + 1);
      expect(items.map(item => item.evidence.payload.nodeId)).toEqual(path.map(node => node.id));
      const proof = readRecordedHumanDivergenceInvocation(items, source);
      expect(proof.observations.every(row => row.resolved.headSeq === run.events.length)).toBe(true);
      expect(proof.observations.every(row => path.some(node => node.id === row.event.data.nodeId))).toBe(true);
    }
  });

  it("retains duplicate observations and actual sibling origin separately from the requested grant", () => {
    const initial = humanObservationRun(), root = initial.nodes[0]!.id, main = initial.activeCursor.branchId;
    let run = recordHumanObservation(initial, splitCandidates()); run = recordHumanObservation(run, splitCandidates());
    run = commitMove(run, "e2e4", { at }).run;
    run = fork(rewind(run, root, at).run, root, { at, label: "sibling" }).run; const origin = run.activeCursor.branchId;
    run = recordHumanObservation(run, splitCandidates(), root, origin); run = commitMove(run, "d2d4", { at }).run;
    const source = sourceFor(run, main, root), items = invokeEvidenceValueRoute(route, { recordedPivotal: source }), proof = readRecordedHumanDivergenceInvocation(items, source);
    expect(items).toHaveLength(3); expect(new Set(items.map(item => evidenceValueReceipt(item.evidence).inputDigest)).size).toBe(3);
    expect(proof.observations.map(row => row.event.data.branchId)).toEqual([main, main, origin]);
    expect(proof.observations[2]!.resolved.subject).toMatchObject({ branchId: origin, nodeId: root });
    expect(recordedPivotalData(source).authority).toMatchObject({ branchId: main, throughNodeId: root });
    expect(items.map(item => item.evidence.payload.selection.payload.event.seq)).toEqual(proof.observations.map(row => row.event.seq));
  });

  it("ignores other policies and off-grant anchors without resolving or acquiring their sources", () => {
    const initial = humanObservationRun(), root = initial.nodes[0]!.id;
    let run = recordHumanObservation(initial, splitCandidates(), root, initial.activeCursor.branchId, "strong_engine");
    run = commitMove(run, "e2e4", { at }).run;
    run = recordHumanObservation(run, splitCandidates(true));
    const resolve = vi.spyOn(subjects, "resolveRunSubject");
    try {
      const source = sourceFor(run, run.activeCursor.branchId, root), items = invokeEvidenceValueRoute(route, { recordedPivotal: source });
      expect(items).toEqual([]); expect(readRecordedHumanDivergenceInvocation(items, source).observations).toEqual([]); expect(resolve).not.toHaveBeenCalled();
    } finally { resolve.mockRestore(); }
  });

  it("rejects copied/wrong-kind sources, caller inputs and copied/foreign result arrays before shortcuts", () => {
    const run = recordHumanObservation(humanObservationRun(), splitCandidates()), { source, items } = prepare(run);
    for (const invalid of [{ ...source }, JSON.parse(JSON.stringify(source)), run, null]) expect(() => invokeEvidenceValueRoute(route, { recordedPivotal: invalid } as never)).toThrow();
    const wrongKind = createRecordedPivotalSource({ run, branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId, kind: "phase_change" });
    expect(() => invokeEvidenceValueRoute(route, { recordedPivotal: wrongKind })).toThrow(/kind/);
    for (const extra of [{ run }, { branchId: run.activeCursor.branchId }, { positions: [] }, { selection: [] }, { markers: [] }, { observations: [] }]) expect(() => invokeEvidenceValueRoute(route, { recordedPivotal: source, ...extra } as never)).toThrow();
    for (const copied of [[...items], items.slice(), Object.freeze(items.map(item => ({ ...item }))), JSON.parse(JSON.stringify(items))]) expect(() => readRecordedHumanDivergenceInvocation(copied, source)).toThrow(/original complete/);
    expect(() => readRecordedHumanDivergenceInvocation(items, sourceFor(run))).toThrow(/original complete/);
    const absent = prepare(humanObservationRun()); expect(() => readRecordedHumanDivergenceInvocation([], absent.source)).toThrow();
    expect(() => readRecordedHumanDivergenceInvocation(absent.items, sourceFor(humanObservationRun()))).toThrow();
  });

  it("keeps caller mutation out and repeated source/result reads free of reclassification", () => {
    const candidates = splitCandidates(), run = recordHumanObservation(humanObservationRun(), candidates), { source, items, proof } = prepare(run);
    const saved = evidenceDigest(proof), classify = vi.spyOn(pivotal, "reportedHumanSplit");
    try { readRecordedHumanDivergenceInvocation(items, source); assertDeclaredEvidence(items[0]!.evidence); expect(classify).not.toHaveBeenCalled(); } finally { classify.mockRestore(); }
    (candidates[0] as { mass: number }).mass = 1;
    expect(evidenceDigest(readRecordedHumanDivergenceInvocation(items, source))).toBe(saved);
    expect(Reflect.set(proof.observations[0]!, "disposition", "nonmatch")).toBe(false);
    expect(Reflect.set(recordedPivotalData(source).humanObservations![0]!.event.data.selection, "candidates", [])).toBe(false);
  });

  it.each(["foreign_head", "foreign_event", "foreign_context"] as const)("refuses genuine source-constructor corruption before split shortcuts: %s", fault => {
    const run = recordHumanObservation(humanObservationRun(), [{ moveUci: "e2e4", mass: 1, rank: 1 }]);
    const source = sourceFor(run), original = recorded.recordedInspectorSelectionValue, classify = vi.spyOn(pivotal, "reportedHumanSplit");
    const corrupt = vi.spyOn(recorded, "recordedInspectorSelectionValue").mockImplementation((resolved, seq) => {
      const value = original(resolved, seq)!;
      return fault === "foreign_head" ? { ...value, subject: { ...value.subject, eventHeadDigest: `sha256:${"b".repeat(64)}` as never } }
        : fault === "foreign_event" ? { ...value, event: { ...value.event, at: "2026-10-16T00:01:00.000Z" } }
        : { ...value, requestedTargetElo: 2999 };
    });
    try { expect(() => invokeEvidenceValueRoute(route, { recordedPivotal: source })).toThrow(/origin\/head\/event\/context/); expect(classify).not.toHaveBeenCalled(); }
    finally { corrupt.mockRestore(); classify.mockRestore(); }
  });

  it.each([true, false])("D3881 validates the entire original origin suffix before any source work, missing=%s", missing => {
    const initial = humanObservationRun(), root = initial.nodes[0]!.id, main = initial.activeCursor.branchId;
    let run = commitMove(initial, "e2e4", { at }).run;
    run = fork(rewind(run, root, at).run, root, { at, label: "observation origin" }).run;
    run = recordHumanObservation(run, missing ? undefined : splitCandidates(), root);
    run = commitMove(run, "d2d4", { at }).run; const later = run.activeCursor.nodeId;
    const events = run.events.map(event => event.type === "move.committed" && event.data.node.id === later
      ? { ...event, data: { ...event.data, node: { ...event.data.node, fen: "8/8/8/8/8/8/8/8 w - - 0 1" } } } : event);
    const malformed = projectRun(events); // Ordinary event replay really admits this sibling suffix.
    const resolve = vi.spyOn(subjects, "resolveRunSubject");
    try {
      expect(() => createRecordedPivotalSource({ run: malformed, branchId: main, throughNodeId: root, kind: "human_divergence" })).toThrow("Invalid chess FEN: 8/8/8/8/8/8/8/8 w - - 0 1");
      expect(resolve).not.toHaveBeenCalled();
    } finally { resolve.mockRestore(); }
  });
});
