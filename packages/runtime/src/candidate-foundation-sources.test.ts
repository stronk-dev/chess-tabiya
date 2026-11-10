import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CANDIDATE_EVENTS_SCOPE, CANDIDATE_READINGS_SCOPE, CANDIDATE_WIDE_SCOPE,
  assertCandidatePopulationReceipt, compileCandidatePopulation, compileCandidatePopulationForContract,
  projectCandidatePopulationReceipt, readCandidateCommonSources, readCandidateFoundationSources,
  type CandidatePacketScope, type CandidateWideScope, type CandidatePopulationReceipt,
} from "./candidate-population.js";
import * as routes from "./internal/evidence-value-routes.js";

function compile<S extends CandidatePacketScope>(fen: string, scope: S): CandidatePopulationReceipt<S> {
  const result = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope });
  if (result.kind !== "ready") throw Error(JSON.stringify(result.error)); return result.receipt;
}
const samples = [
  ["white", "1qr4k/8/8/8/1Q6/2n5/1P6/1R5K w - - 0 1", 29],
  ["black", "1r5k/1p6/2N5/1q6/8/8/8/1QR4K b - - 0 1", 29],
  ["same-file", "7k/2p5/2p5/1P6/3P4/8/8/7K w - - 0 1", 6],
  ["castle", "1k6/8/8/8/8/8/8/4K2R w K - 0 1", 15],
] as const;
afterEach(() => vi.restoreAllMocks());

describe("original wide candidate foundation sources", () => {
  it("retains quiet events-only original snapshots privately and preserves them on lawful projection", () => {
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const owner = compile("7k/8/8/8/8/8/8/K7 w - - 0 1", CANDIDATE_EVENTS_SCOPE);
    const original = readCandidateCommonSources(owner);
    expect(original.root[0]).toBe(owner.legalMovesInput);
    expect(original.root[3].payload.pawnDomain).toEqual([]);
    expect(original.root[4].payload.groups).toEqual([]);
    expect(original.root[5].payload.files.map(row => row.state)).toEqual(Array(8).fill("open"));
    expect(original.candidates).toHaveLength(owner.packet.legalMoves.length);
    original.candidates.forEach((child, index) => {
      expect(child.row).toBe(owner.packet.candidates[index]); expect(child.move).toBe(owner.packet.legalMoves[index]);
      expect(child.common[0].payload.fen).toBe(child.row.afterFen); expect(child.row.readings).toEqual([]);
    });
    expect(calls.mock.calls.some(([route]) => route === "rules.transition.reading.physical_slider_rays@1" || route === "rules.tactic.reading.mover_piece_risk@1")).toBe(false);
    const wide = compile(samples[2][1], CANDIDATE_WIDE_SCOPE), frame = readCandidateFoundationSources(wide);
    const projected = projectCandidatePopulationReceipt(wide, CANDIDATE_EVENTS_SCOPE);
    if (projected.kind !== "ready") throw Error("Expected lawful events projection");
    const retained = readCandidateCommonSources(projected.receipt);
    expect(retained.root).toBe(frame.root.common);
    retained.candidates.forEach((child, index) => expect(child.common).toBe(frame.candidates[index]!.position.common));
    expect(() => readCandidateCommonSources({ ...owner })).toThrow(/not minted/);
  });

  it("binds emitted current events to the same original root/child objects used by readings", () => {
    const owner = compile(samples[2][1], CANDIDATE_WIDE_SCOPE), common = readCandidateCommonSources(owner);
    const slots: Readonly<Record<string, number>> = {
      "rules.structural.event.king_opposition@2": 2, "rules.structural.event.backward_pawn@2": 3,
      "derived.structural.event.pawn_file_group@1": 4, "derived.activity.event.file_state@1": 5,
      "rules.structural.event.pawn_islands@2": 1,
    };
    let examined = 0;
    common.candidates.forEach(child => child.row.events.forEach(event => {
      const slot = slots[`${event.projection.id}@${event.projection.version}`]; if (slot === undefined) return;
      const invocation = routes.readFoundationEventInvocation(event.evidence);
      expect(invocation.inputs[0]).toBe(common.root[slot]); expect(invocation.inputs[1]).toBe(child.common[slot]);
      expect(child.row.readings).toContain(child.common[slot]); examined++;
    }));
    expect(examined).toBeGreaterThan(0);
  });

  it.each(samples)("%s at %s retains all %i original child source tuples", (_name, fen, count) => {
    const receipt = compile(fen, CANDIDATE_WIDE_SCOPE), frame = readCandidateFoundationSources(receipt);
    expect(frame.candidates).toHaveLength(count);
    expect(frame.root.common[0]).toBe(receipt.legalMovesInput);
    expect(routes.readPhysicalSliderRaysInvocation(frame.root.rays).position).toBe(receipt.legalMovesInput);
    const rootRisk = routes.readMoverPieceRiskInvocation(frame.root.risk);
    expect(rootRisk.root).toBe(receipt.legalMovesInput); expect(rootRisk.position).toBe(receipt.legalMovesInput);
    expect(rootRisk.moveUci).toBeNull();
    for (const [index, child] of frame.candidates.entries()) {
      expect(child.move).toBe(receipt.packet.legalMoves[index]); expect(child.row).toBe(receipt.packet.candidates[index]);
      expect(child.move.uci).toBe(child.row.moveUci); expect(child.position.common[0].payload.fen).toBe(child.row.afterFen);
      child.position.common.forEach(source => expect(child.row.readings.includes(source)).toBe(true));
      expect(routes.readPhysicalSliderRaysInvocation(child.position.rays).position).toBe(child.position.common[0]);
      const risk = routes.readMoverPieceRiskInvocation(child.position.risk);
      expect(risk.root).toBe(receipt.legalMovesInput); expect(risk.position).toBe(child.position.common[0]);
      expect(risk.moveUci).toBe(child.move.uci);
      expect(child.row.readings).not.toContain(child.position.rays);
      if (child.position.risk.kind === "available") expect(child.row.readings).not.toContain(child.position.risk.value);
      expect(Object.isFrozen(child.position)).toBe(true);
    }
    expect(Object.isFrozen(frame)).toBe(true); expect(Object.isFrozen(frame.candidates)).toBe(true);
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    assertCandidatePopulationReceipt(receipt); expect(readCandidateFoundationSources(receipt)).toBe(frame);
    expect(calls).not.toHaveBeenCalled();
  });

  it("captures the actual shortened root invocation without reminting its legal authority", () => {
    const raw = "7k/8/8/8/8/8/8/K7", receipt = compile(raw, CANDIDATE_WIDE_SCOPE);
    const frame = readCandidateFoundationSources(receipt);
    expect(routes.readLocalReadingInvocation(receipt.legalMovesInput)).toEqual({ kind: "fen", fen: raw });
    expect(frame.root.common[0]).toBe(receipt.legalMovesInput);
    expect(frame.root.common[2].payload.opposition).toBeNull();
    expect(frame.root.common[3].payload.pawnDomain).toEqual([]);
    expect(frame.root.common[4].payload.groups).toEqual([]);
    expect(frame.root.common[5].payload.files.map(row => row.state)).toEqual(Array(8).fill("open"));
    expect(frame.root.rays.payload.rows).toHaveLength(16);
    expect(frame.root.rays.payload.rows.every(row => row.ray === null)).toBe(true);
    expect(frame.root.risk.kind).toBe("available");
    if (frame.root.risk.kind === "available") expect(frame.root.risk.value.payload.pieces).toEqual([]);
  });

  it("keeps unavailable root risk distinct from the complete legal child population", () => {
    const receipt = compile("7k/8/8/8/8/8/8/r6K w - - 0 1", CANDIDATE_WIDE_SCOPE);
    const frame = readCandidateFoundationSources(receipt);
    expect(frame.root.risk).toEqual({ kind: "unavailable", reason: "invalid_turn_clone" });
    expect(frame.candidates.length).toBeGreaterThan(0);
    expect(frame.candidates).toHaveLength(receipt.packet.legalMoves.length);
    expect(routes.readMoverPieceRiskInvocation(frame.root.risk).root).toBe(receipt.legalMovesInput);
    frame.candidates.forEach(child => expect(child.position.risk.kind).toBe("available"));
  });

  it("retains every promotion role in the actual child's total sources", () => {
    const receipt = compile("7k/P7/8/8/8/8/8/7K w - - 0 1", CANDIDATE_WIDE_SCOPE);
    const frame = readCandidateFoundationSources(receipt);
    for (const [suffix, role] of [["q", "queen"], ["r", "rook"], ["b", "bishop"], ["n", "knight"]] as const) {
      const child = frame.candidates.find(row => row.move.uci === `a7a8${suffix}`)!;
      expect(child).toBeDefined(); expect(child.position.risk.kind).toBe("available");
      if (child.position.risk.kind !== "available") throw Error("Legal child risk is unavailable");
      expect(child.position.risk.value.payload.pieces).toHaveLength(1);
      expect(child.position.risk.value.payload.pieces[0]).toMatchObject({
        root: { color: "white", role: "pawn", square: "a7" }, current: { color: "white", role, square: "a8" },
      });
      const rays = child.position.rays.payload.rows.filter(row => row.piece.square === "a8");
      expect(rays).toHaveLength(8); expect(rays.every(row => row.piece.role === role)).toBe(true);
    }
  });

  it("retains the actual en-passant victim's absence and original mover identity", () => {
    const receipt = compile("7k/8/8/3pP3/8/8/8/7K w - d6 0 1", CANDIDATE_WIDE_SCOPE);
    const child = readCandidateFoundationSources(receipt).candidates.find(row => row.move.uci === "e5d6")!;
    expect(child).toBeDefined();
    expect(child.position.rays.payload.rows.some(row => row.piece.square === "d5")).toBe(false);
    expect(child.position.risk.kind).toBe("available");
    if (child.position.risk.kind !== "available") throw Error("Legal en-passant child unavailable");
    expect(child.position.risk.value.payload.pieces[0]).toMatchObject({
      root: { color: "white", role: "pawn", square: "e5" }, current: { color: "white", role: "pawn", square: "d6" },
    });
  });

  it("wide narrowing preserves originals without granting narrow receipts wide authority", () => {
    const receipt = compile(samples[2][1], CANDIDATE_WIDE_SCOPE), frame = readCandidateFoundationSources(receipt);
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    for (const scope of [CANDIDATE_EVENTS_SCOPE, CANDIDATE_READINGS_SCOPE, CANDIDATE_WIDE_SCOPE]) {
      const projected = projectCandidatePopulationReceipt(receipt, scope);
      expect(projected.kind).toBe("ready"); if (projected.kind !== "ready") throw Error("Expected lawful projection");
      assertCandidatePopulationReceipt(projected.receipt);
      if (scope === CANDIDATE_WIDE_SCOPE) {
        const retained = readCandidateFoundationSources(projected.receipt as CandidatePopulationReceipt<CandidateWideScope>);
        expect(retained.root).toBe(frame.root);
        retained.candidates.forEach((row, index) => expect(row.position).toBe(frame.candidates[index]!.position));
      } else expect(() => readCandidateFoundationSources(projected.receipt as CandidatePopulationReceipt<CandidateWideScope>)).toThrow(/wide/);
    }
    expect(calls).not.toHaveBeenCalled();
    expect(() => readCandidateFoundationSources({ ...receipt })).toThrow(/not minted/);
  });

  it.each([CANDIDATE_EVENTS_SCOPE, CANDIDATE_READINGS_SCOPE])("direct narrow scope %j does not acquire wide-only total sources", scope => {
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute"), receipt = compile(samples[2][1], scope);
    expect(calls.mock.calls.some(([route]) => route === "rules.transition.reading.physical_slider_rays@1" || route === "rules.tactic.reading.mover_piece_risk@1")).toBe(false);
    // @ts-expect-error Narrow receipts lack wide authority; runtime must refuse them too.
    expect(() => readCandidateFoundationSources(receipt)).toThrow(/wide/);
  });

  it("refuses reordered rows before they can claim the legal authority's source order", () => {
    const result = compileCandidatePopulationForContract({ beforeFen: samples[2][1], ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE }, { rows: rows => [...rows].reverse() });
    expect(result).toEqual({ kind: "failed", error: { code: "invariant_failed", invariant: "legal_set" } });
  });
});
