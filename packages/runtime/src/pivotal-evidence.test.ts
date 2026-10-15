import { describe, expect, it, vi } from "vitest";
import * as phaseSource from "./phase.js";
import * as transitionSource from "./transition.js";
import * as legalSource from "./legal-moves.js";

import { evidenceForConsumer, evidenceValueReceipt, identitySealedEvidenceWithoutValueReceipt } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { consumePivotalMarkers, pivotalMarkerEvidence, pivotalMarkerEvidenceItems, pivotalMarkerRecordedSelection, pivotalMarkers } from "./pivotal.js";
import { appendOpponentPly, commitMove, createRun, fork, rewind } from "./runtime.js";
import { branchPath } from "./branch-path.js";
import { assertReviewEvidencePacket, compileReviewPacketForSubject, createReviewPrefixAuthority } from "./review-evidence.js";

const at = "2026-09-24T00:00:00.000Z";
const created = (id: string, fen: string) => createRun({ id, packId: "p", packDigest: `sha256:${"a".repeat(64)}`, startFen: fen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
const reviewItems = (run: ReturnType<typeof created>) => {
  const authorize = createReviewPrefixAuthority({ loadRun: id => id === run.id ? run : undefined, loadImportRecord: () => undefined });
  const packet = compileReviewPacketForSubject(authorize({ runId: run.id, branchId: run.activeCursor.branchId }), { engine: new Map(), shapes: [] });
  assertReviewEvidencePacket(packet);
  return packet.nodes.flatMap(node => node.items);
};

describe("pivotal marker consumer boundary", () => {
  it("retains distinct recorded occurrences even when shared-node policy images are identical", () => {
    let run = commitMove(created("human-occurrences", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"), "e2e4", { at }).run;
    const nodeId = run.activeCursor.nodeId;
    const selection = { moveUci: "e7e5", policyModeApplied: "human_common" as const,
      candidates: ["e7e5", "c7c5", "e7e6", "c7c6", "d7d5"].map((moveUci, index) => ({ moveUci, rank: index + 1, mass: [.31, .24, .19, .16, .1][index]! })),
      engine: { id: "same-source", name: "Same synthetic source", version: "test", seedHonored: false } };
    run = appendOpponentPly(run, selection, { at }).run;
    const original = run.activeCursor.branchId;
    run = fork(rewind(run, nodeId, at).run, nodeId, { at }).run;
    run = appendOpponentPly(run, selection, { at }).run;
    const events = run.events.filter(event => event.type === "opponent.move_selected");
    expect(events).toHaveLength(2);
    expect(events[0]!.data.selection).toEqual(events[1]!.data.selection);
    expect(events[0]!.data.branchId).not.toBe(events[1]!.data.branchId);
    const saved = JSON.stringify(run);
    for (const branchId of [original, run.activeCursor.branchId]) {
      const markers = pivotalMarkers(run, branchId).filter(marker => marker.kind === "human_divergence");
      expect(markers).toHaveLength(2); // Preserve existing node-level, not chosen-branch semantics.
      for (const [index, marker] of markers.entries()) {
        const event = events[index]!;
        const retained = pivotalMarkerRecordedSelection(marker)!;
        expect(retained).toMatchObject({ occurrence: { runId: run.id, eventSeq: event.seq,
          branchId: event.data.branchId, nodeId: event.data.nodeId, moveUci: event.data.moveUci } });
        expect(Object.isFrozen(Object.getOwnPropertyDescriptor(retained, "occurrence")!.value)).toBe(true);
        expect(pivotalMarkerRecordedSelection({ ...marker })).toBeUndefined();
      }
      const values = invokeEvidenceValueRoute("derived.pivotal.human_divergence@1", { run, branchId });
      expect(values).toHaveLength(2);
      expect(values[0]!.evidence.payload).toEqual(values[1]!.evidence.payload);
      expect(evidenceValueReceipt(values[0]!.evidence)).toEqual(evidenceValueReceipt(values[1]!.evidence));
      expect(JSON.stringify(values)).not.toContain('"occurrence"'); // Internal source data does not widen old wire payloads.
    }
    expect(JSON.stringify(run)).toBe(saved);
  });

  it.each(["irreversibility", "phase_change", "human_divergence", "option_collapse"] as const)("prepares only the declared %s family without changing its output", (kind) => {
    let run;
    if (kind === "irreversibility") run = commitMove(created("family-queen", "4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1"), "e2e7", { at }).run;
    else if (kind === "phase_change") {
      run = created("family-phase", "r2qk2r/8/8/8/8/8/8/R2QK2R w - - 0 1");
      for (const move of ["d1d8", "e8d8"]) run = commitMove(run, move, { at }).run;
    } else if (kind === "option_collapse") {
      run = created("family-collapse", "8/3r3k/p3qr1p/1p5Q/8/P6R/1PP1p3/1K5R w - - 0 37");
      for (const move of ["h1e1", "d7d1", "e1d1", "e2d1q"]) run = commitMove(run, move, { at }).run;
    } else {
      run = commitMove(created("family-human", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"), "e2e4", { at }).run;
      run = appendOpponentPly(run, { moveUci: "e7e5", policyModeApplied: "human_common",
        candidates: ["e7e5", "c7c5", "e7e6", "c7c6", "d7d5"].map((moveUci, index) => ({ moveUci, rank: index + 1, mass: [.31, .24, .19, .16, .1][index]! })),
        engine: { id: "family-source", name: "Synthetic family control", version: "test", seedHonored: false } }, { at }).run;
    }
    const branchId = run.activeCursor.branchId, saved = JSON.stringify(run);
    const expected = pivotalMarkers(run, branchId).filter(marker => marker.kind === kind);
    expect(expected.length).toBeGreaterThan(0);
    const phase = vi.spyOn(phaseSource, "classifyPhase");
    const irreversible = vi.spyOn(transitionSource, "irreversibility");
    const legal = vi.spyOn(legalSource, "exactLegalMoves");
    try {
      const values = invokeEvidenceValueRoute(`derived.pivotal.${kind}@1`, { run, branchId });
      expect(values.map(item => item.evidence.payload)).toEqual(expected);
      for (const [wanted, source] of [["phase_change", phase], ["irreversibility", irreversible], ["option_collapse", legal]] as const) {
        if (kind === wanted) expect(source.mock.calls.length).toBeGreaterThan(0);
        else expect(source).not.toHaveBeenCalled();
      }
      expect(JSON.stringify(run)).toBe(saved);
      for (const malformed of [
        { ...run, nodes: [...run.nodes, run.nodes.at(-1)!] },
        { ...run, nodes: run.nodes.map(node => node.id === run.nodes.at(-1)!.id ? { ...node, parentId: node.id } : node) },
        { ...run, nodes: run.nodes.map(node => node.id === run.nodes.at(-1)!.id ? { ...node, fen: "invalid FEN" } : node) },
      ]) expect(() => invokeEvidenceValueRoute(`derived.pivotal.${kind}@1`, { run: malformed, branchId })).toThrow();
    } finally { vi.restoreAllMocks(); }
  });

  it("grounds each shared-node human marker in its own exact recorded selection", () => {
    let run = commitMove(created("human-inputs", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"), "e2e4", { at }).run;
    const shared = run.activeCursor.nodeId;
    const selected = (id: string, moveUci: string, masses: readonly number[]) => ({ moveUci, policyModeApplied: "human_common" as const,
      candidates: ["e7e5", "c7c5", "e7e6", "c7c6", "d7d5"].map((moveUci, index) => ({ moveUci, rank: index + 1, mass: masses[index]! })),
      engine: { id, name: id, version: "synthetic-test", seedHonored: false } });
    run = appendOpponentPly(run, selected("first-source", "e7e5", [.31, .24, .19, .16, .1]), { at }).run;
    const original = run.activeCursor.branchId;
    run = fork(rewind(run, shared, at).run, shared, { at }).run;
    run = appendOpponentPly(run, selected("second-source", "c7c5", [.4, .25, .2, .1, .05]), { at }).run;
    for (const branchId of [original, run.activeCursor.branchId]) {
      const values = invokeEvidenceValueRoute("derived.pivotal.human_divergence@1", { run, branchId });
      expect(values).toHaveLength(2); // Preserve current whole-tip node-level population semantics.
      for (const item of values) {
        const source = item.inputs.find(value => value.projection.id === "human.maia.policy")!.payload as { engine: { id: string }; candidates: readonly { mass: number }[] };
        const detail = item.evidence.payload.detail as { engine: { id: string }; masses: readonly number[] };
        expect(detail.engine).toEqual(source.engine);
        const total = source.candidates.reduce((sum, candidate) => sum + candidate.mass, 0);
        expect(detail.masses).toEqual(source.candidates.map(candidate => candidate.mass / total).sort((a, b) => b - a));
        expect(evidenceValueReceipt(item.evidence).sourceDigests).toEqual(item.inputs.map(value => evidenceValueReceipt(value).payloadDigest));
      }
    }
    const marker = pivotalMarkers(run, original).find(item => item.kind === "human_divergence")!;
    const retained = pivotalMarkerRecordedSelection(marker)!;
    expect(Object.isFrozen(retained)).toBe(true);
    expect(Object.isFrozen(retained.engine)).toBe(true);
    expect(Object.isFrozen(retained.candidates)).toBe(true);
    expect(pivotalMarkerRecordedSelection({ ...marker })).toBeUndefined();
    const delivered = reviewItems(run).filter(item => item.projection.id === "derived.pivotal.human_divergence");
    expect(delivered.map(item => ((item.payload as { detail: { engine: { id: string } } }).detail.engine.id)).sort()).toEqual(["first-source", "second-source"]);
  });

  it("retains both exact definite phase witnesses and their recorded nodes", () => {
    let run = created("phase-inputs", "r2qk2r/8/8/8/8/8/8/R2QK2R w - - 0 1");
    for (const move of ["d1d8", "e8d8"]) run = commitMove(run, move, { at }).run;
    const branchId = run.activeCursor.branchId;
    const values = invokeEvidenceValueRoute("derived.pivotal.phase_change@1", { run, branchId });
    const delivered = reviewItems(run).filter(item => item.projection.id === "derived.pivotal.phase_change");
    expect(values.length).toBeGreaterThan(0);
    expect(delivered.map(item => evidenceValueReceipt(item).sourceDigests)).toEqual(values.map(item => evidenceValueReceipt(item.evidence).sourceDigests));
    for (const item of values) {
      const readings = item.inputs.filter(value => value.projection.id === "rules.phase.reading");
      const positions = item.inputs.filter(value => value.projection.id === "run.record.position");
      expect(readings).toHaveLength(2);
      expect(positions).toHaveLength(2);
      expect(new Set(positions.map(value => (value.payload as { nodeId: string }).nodeId)).size).toBe(2);
      expect(readings.map(value => (value.payload as { fen: string }).fen)).toEqual(positions.map(value => (value.payload as { fen: string }).fen));
      expect(readings.map(value => (value.payload as { phase: string }).phase)).toEqual([(item.evidence.payload.detail as { from: string }).from, (item.evidence.payload.detail as { to: string }).to]);
      expect(evidenceValueReceipt(item.evidence).sourceDigests).toEqual(item.inputs.map(value => evidenceValueReceipt(value).payloadDigest));
    }
  });

  it("retains all three exact same-side mobility witnesses, including the later continuation", () => {
    // Legal four-ply CC0 fixture from the existing R2 population; no corpus read in software CI.
    let run = created("collapse-inputs", "8/3r3k/p3qr1p/1p5Q/8/P6R/1PP1p3/1K5R w - - 0 37");
    for (const move of ["h1e1", "d7d1", "e1d1", "e2d1q"]) run = commitMove(run, move, { at }).run;
    const branchId = run.activeCursor.branchId, path = branchPath(run, branchId);
    const values = invokeEvidenceValueRoute("derived.pivotal.option_collapse@1", { run, branchId });
    expect(values).toHaveLength(1);
    const item = values[0]!;
    expect(item.evidence.payload.nodeId).toBe(path[2]!.id);
    const readings = item.inputs.filter(value => value.projection.id === "rules.mobility.reading.legal_moves");
    const positions = item.inputs.filter(value => value.projection.id === "run.record.position");
    expect(readings).toHaveLength(3);
    expect(readings.map(value => (value.payload as { fen: string }).fen)).toEqual([path[0]!.fen, path[2]!.fen, path[4]!.fen]);
    expect(positions.map(value => (value.payload as { nodeId: string }).nodeId)).toEqual([path[0]!.id, path[2]!.id, path[4]!.id]);
    expect(evidenceValueReceipt(item.evidence).sourceDigests).toEqual(item.inputs.map(value => evidenceValueReceipt(value).payloadDigest));
    expect(pivotalMarkers(run, branchId)).toEqual(pivotalMarkerEvidenceItems(run, branchId).map(value => value.payload));
    const delivered = reviewItems(run).filter(value => value.projection.id === "derived.pivotal.option_collapse");
    expect(delivered).toHaveLength(1);
    expect(evidenceValueReceipt(delivered[0]!).sourceDigests).toEqual(evidenceValueReceipt(item.evidence).sourceDigests);
  });

  it("mints each pivotal kind under its own exact derived projection and authority inputs", () => {
    const queen = commitMove(created("queen", "4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1"), "e2e7", { at }).run;
    const branchId = queen.activeCursor.branchId;
    const items = pivotalMarkerEvidenceItems(queen, branchId);
    expect(items.map((item) => item.payload)).toEqual(pivotalMarkers(queen, branchId));
    const irreversible = items.find((item) => item.payload.kind === "irreversibility")!;
    expect(irreversible.projection).toEqual({ id: "derived.pivotal.irreversibility", version: 1 });
    expect(irreversible.producer).toEqual({ id: "derived.pivotal", version: 1 });
    const derived = invokeEvidenceValueRoute("derived.pivotal.irreversibility@1", { run: queen, branchId })[0]!;
    expect(derived.inputs.map((value) => `${value.projection.id}@${value.projection.version}`)).toEqual(["rules.transition.reading.move_irreversibility.last_of_role@1", "run.record.position@1"]);
    expect(evidenceValueReceipt(derived.evidence).sourceDigests).toEqual(derived.inputs.map((value) => evidenceValueReceipt(value).payloadDigest));

    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "board.pivotal_marker", version: 1 }, items);
    expect(consumePivotalMarkers(view)).toEqual(items.map((item) => item.payload));
    const free = { workflowContext: "position" as const, deliveryOpen: true, role: "solo" as const, seatedInContest: false, reviewing: false };
    expect(pivotalMarkerEvidence(queen, branchId, free).map((marker) => marker.kind)).toEqual(["irreversibility"]);
    if (false) {
      // @ts-expect-error Marker delivery rejects a bare marker list.
      consumePivotalMarkers(items.map((item) => item.payload));
    }
  });

  it("cannot relabel a rule marker as human-model evidence or a Maia split as a rule marker", () => {
    const queen = commitMove(created("queen", "4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1"), "e2e7", { at }).run;
    const branchId = queen.activeCursor.branchId;
    const rule = pivotalMarkerEvidenceItems(queen, branchId)[0]!;
    // The human-divergence factory computes from recorded model selections only: none exist here.
    expect(invokeEvidenceValueRoute("derived.pivotal.human_divergence@1", { run: queen, branchId })).toEqual([]);
    const relabelled = identitySealedEvidenceWithoutValueReceipt({ id: "derived.pivotal", version: 1 }, { id: "derived.pivotal.human_divergence", version: 1 }, rule.payload);
    expect(() => evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "board.pivotal_marker", version: 1 }, [relabelled])).toThrow(/value-authority receipt/u);
    // The retired single-projection v1 id cannot be minted or bound.
    expect(PRIMARY_EVIDENCE_MANIFEST.bindings.some((binding) => binding.projection.id === "rules.pivotal.marker")).toBe(false);
    const retired = identitySealedEvidenceWithoutValueReceipt({ id: "rules.pivotal", version: 1 }, { id: "rules.pivotal.marker", version: 1 }, rule.payload);
    expect(() => evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "board.pivotal_marker", version: 1 }, [retired])).toThrow(/value-authority receipt/u);
  });
});
