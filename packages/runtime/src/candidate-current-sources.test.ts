// Accepted shared-candidate-evidence-packet §3.1a: real compiler/receipt boundaries, not a
// generated allow-list or chess qualification. Fixed fixtures exercise exact source operands.
import { describe, expect, it, vi } from "vitest";
import { CANDIDATE_EVENTS_SCOPE, CANDIDATE_PACKET_COMPILER_VERSION, CANDIDATE_READINGS_SCOPE, CANDIDATE_WIDE_SCOPE,
  assertCandidatePopulationReceipt, candidatePlayedRow, compileCandidatePopulation, projectCandidatePopulationReceipt } from "./candidate-population.js";
import { evidenceValueReceipt } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import * as valueRoutes from "./internal/evidence-value-routes.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { selectSemanticEvidence } from "./semantic-evidence.js";

const key = (item: { readonly projection: { readonly id: string; readonly version: number } }) => `${item.projection.id}@${item.projection.version}`;
function compile(fen: string, scope = CANDIDATE_WIDE_SCOPE) {
  const result = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope });
  if (result.kind !== "ready") throw new Error(`Current packet failed: ${JSON.stringify(result.error)}`);
  assertCandidatePopulationReceipt(result.receipt); return result.receipt;
}

describe("current candidate source adoption", () => {
  it("uses the sole current construction identity and does not convert an old receipt", () => {
    expect(CANDIDATE_PACKET_COMPILER_VERSION).toBe(8);
    const receipt = compile("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
    expect(receipt.packet.compilerVersion).toBe(8);
    for (const compilerVersion of [1, 2, 3, 4, 5, 6]) {
      expect(() => assertCandidatePopulationReceipt({ ...receipt, packet: { ...receipt.packet, compilerVersion } })).toThrow();
    }
  });

  it.each([
    ["white", "r3k3/1P6/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6"],
    ["black", "3k3r/8/8/8/5b2/6N1/6p1/3K3R b - - 0 1", "f4g3"],
  ])("retains %s's complete exposure/material sources and exact child readings", (_side, fen, move) => {
    const receipt = compile(fen), row = candidatePlayedRow(receipt, move);
    const exposure = row.events.find(item => key(item) === "derived.tactic.defender_exposure@2");
    expect(exposure).toBeDefined();
    expect(exposure!.derivationInputs.map(key)).toEqual(["rules.square.event.control@1", "rules.exchange.reading.landing_captures@1"]);
    const captures = exposure!.derivationInputs[1]!.payload as { captures: readonly { resultUnits: number }[] };
    expect((exposure!.operands as { captures: readonly unknown[] }).captures).toHaveLength(5);
    expect((exposure!.operands as { captures: readonly unknown[] }).captures).toEqual(captures.captures.filter(item => item.resultUnits > 0));
    const material = row.events.find(item => key(item) === "derived.material.event.role_asymmetry@2");
    expect(material).toBeDefined();
    expect(material!.derivationInputs.map(key)).toEqual(["derived.material.reading.role_signature@2", "derived.material.reading.role_signature@2", "rules.transition.event.capture@1"]);
    expect(row.events.map(key)).not.toContain("derived.tactic.defender_exposure@1");
    expect(row.events.map(key)).not.toContain("derived.material.event.role_asymmetry@1");
    for (const route of ["rules.tactic.reading.promotion_pressure@1", "derived.material.reading.role_signature@2"] as const) {
      const reading = row.readings.find(item => key(item) === route)!;
      expect(reading).toBeDefined();
      const direct = invokeEvidenceValueRoute(route, { fen: row.afterFen });
      expect(reading.payload).toEqual(direct.payload);
      expect(evidenceValueReceipt(reading)).toEqual(evidenceValueReceipt(direct));
    }
    expect(row.readings.map(key)).not.toContain("derived.tactic.promotion_pressure@1");
    expect(row.readings.map(key)).not.toContain("derived.material.reading.role_signature@1");
  });

  it.each([
    ["white", "R5rk/5Q2/6K1/8/8/8/8/8 w - - 0 1", "f7g7"],
    ["black", "8/8/8/8/8/6k1/5q2/r5RK b - - 0 1", "f2g2"],
  ])("makes %s's terminal double attack a real false fork reading, including readings-only scope", (_side, fen, move) => {
    for (const scope of [CANDIDATE_WIDE_SCOPE, CANDIDATE_READINGS_SCOPE]) {
      const result = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope });
      if (result.kind !== "ready") throw new Error("Expected complete packet");
      const row = candidatePlayedRow(result.receipt, move);
      expect(row.readings.map(key)).not.toContain("derived.tactic.fork_survives_reply@1");
      expect(row.readings.find(item => key(item) === "derived.tactic.nonterminal_fork_survival@1")?.payload)
        .toMatchObject({ matched: false, refutingReplies: [], replyBreadth: { terminal: true, count: 0, replies: [] } });
    }
  });

  it.each([
    ["white", "r2k4/1B6/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6"],
    ["black", "3k3r/8/8/8/5b2/6N1/6b1/4K2R b - - 0 1", "f4g3"],
  ])("keeps %s's unavailable exposure separate from no witness, through narrowing and partial selection", (_side, fen, move) => {
    const source = vi.spyOn(valueRoutes, "invokeEvidenceValueRoute");
    try {
      const receipt = compile(fen), row = candidatePlayedRow(receipt, move);
      const exposureCalls = source.mock.calls.map((args, index) => ({ args, result: source.mock.results[index] }))
        .filter(({ args }) => args[0] === "derived.tactic.defender_exposure@2");
      expect(exposureCalls).toHaveLength(receipt.packet.candidates.length);
      const original = exposureCalls.find(({ args }) => (args[1] as { moveUci?: string }).moveUci === move)!.result!;
      expect(original.type).toBe("return");
      expect(row.abstentions).toContainEqual({ projection: "derived.tactic.defender_exposure@2", reason: "invalid_turn_clone" });
      const owned = receipt.candidateInputs.find(item => item.moveUci === move)!;
      const outcome = owned.collectorOutcomes.find(item => item.projection === "derived.tactic.defender_exposure@2");
      expect(outcome).toMatchObject({ moveUci: move, result: { kind: "unavailable", reason: "invalid_turn_clone" } });
      expect(outcome!.result).toBe(original.value);
      const projected = projectCandidatePopulationReceipt(receipt, CANDIDATE_EVENTS_SCOPE);
      if (projected.kind !== "ready") throw new Error("Expected lawful event projection");
      expect(candidatePlayedRow(projected.receipt, move).abstentions).toBe(row.abstentions);
      expect(projected.receipt.candidateInputs.find(item => item.moveUci === move)!.collectorOutcomes.find(item => item.projection === outcome!.projection)).toBe(outcome);
      const readings = projectCandidatePopulationReceipt(receipt, CANDIDATE_READINGS_SCOPE);
      if (readings.kind !== "ready") throw new Error("Expected lawful reading projection");
      expect(candidatePlayedRow(readings.receipt, move).abstentions).toEqual([]);
      const selected = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, { id: "research.r2_candidate", version: 3 }, { receipt, moveUci: move });
      expect(selected.emptyReason).toBeUndefined();
      expect(selected.selected.length).toBeGreaterThan(0);
      expect(selected.selected.every(fact => fact.event.projection.id !== "derived.tactic.defender_exposure")).toBe(true);
      expect(selected.population).toEqual({ legalAlternatives: receipt.packet.candidates.length - 1 });
      expect(selected.coverage.unavailable).toContainEqual({ projection: { id: "derived.tactic.defender_exposure", version: 2 },
        cause: { kind: "candidate_collector", projection: { id: "derived.tactic.defender_exposure", version: 2 } }, reason: "invalid_turn_clone",
        members: receipt.packet.candidates.filter(candidate => candidate.abstentions.some(value => value.projection === "derived.tactic.defender_exposure@2"))
          .map(candidate => ({ kind: "child", moveUci: candidate.moveUci })) });
      // Projection and selection reuse collection; neither reruns a source to recover its outcome.
      expect(source.mock.calls.filter(args => args[0] === "derived.tactic.defender_exposure@2")).toHaveLength(exposureCalls.length);
    } finally { source.mockRestore(); }
  });
});
