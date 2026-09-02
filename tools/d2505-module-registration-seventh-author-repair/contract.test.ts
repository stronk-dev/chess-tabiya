// DISPOSABLE seventh author-repair contract — D2505-D2508. Not production code.
import { readFileSync } from "node:fs";

import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { deflectionObservedOperands } from "../../packages/runtime/src/semantic-evidence.js";
import type { RecordedMoveAnchor } from "../../packages/runtime/src/pawn-dynamics.js";

const read = (path: string) => readFileSync(path, "utf8");
const execution = JSON.parse(read("rfc/contracts/module-execution-plan-v1.json"));
const bindings = JSON.parse(read("rfc/contracts/module-binding-plan-v1.json"));
const moduleRfc = read("rfc/module-registration.md");

const source = (id: string) => execution.sourceContracts.find((row: { id: string }) => row.id === id);
const projection = (id: string) => execution.rows.find((row: { projection: { id: string } }) => row.projection.id === id);

function anchors(fen: string, moves: readonly string[]): readonly RecordedMoveAnchor[] {
  let current = fen;
  return moves.map((moveUci, index) => {
    const position = positionFromFen(current);
    const move = normalizeMove(position, parseUci(moveUci)!);
    expect(position.isLegal(move)).toBe(true);
    position.play(move);
    const afterFen = canonicalFen(position);
    const anchor = { beforeNodeId: `n${index}`, afterNodeId: `n${index + 1}`, beforeFen: current, moveUci, afterFen };
    current = afterFen;
    return anchor;
  });
}

describe("module-registration seventh author repair", () => {
  it("D2505 records complete real source boundaries without invented aggregate assertions", () => {
    const recorded = source("recorded_semantic_path@1");
    expect(recorded.input).toBe("Readonly<{ principal: Principal; runId: string; branchId: string }>");
    expect(recorded.result).toBe("RecordedSemanticPathResult");
    expect(recorded.assertion).toBeNull();
    expect(recorded.itemAssertion).toBe("assertSemanticEvidenceEvent(value)");
    expect(recorded.status).toBe("blocked_upstream_missing_result_assertion");

    const review = source("review_evidence_packet@1");
    expect(review.input).toBeNull();
    expect(review.result).toBe("ReviewEvidencePacket");
    expect(review.assertion).toBeNull();
    expect(review.itemAssertion).toBe("assertDeclaredEvidence(value)");
    expect(review.status).toBe("blocked_upstream_incomplete_callable_abi");

    const catalogue = source("catalogue_evidence_packet@1");
    expect(catalogue).toMatchObject({
      input: "CatalogueEvidencePoolRequest",
      result: "CatalogueEvidencePoolResult",
      assertion: { callable: "assertCatalogueEvidencePoolReceipt(value)", appliesTo: "available.receipt" },
      seal: "CatalogueEvidencePoolReceipt",
    });
    for (const name of ["CatalogueEvidencePoolRequest", "CatalogueEvidencePoolResult", "CatalogueEvidencePoolReceipt", "assertCatalogueEvidencePoolReceipt"]) {
      expect(moduleRfc).toMatch(new RegExp(`(?:type|interface|function)\\s+${name}\\b`, "u"));
    }

    const provider = source("provider_evidence_packet@1");
    expect(provider.operation.successPipeline).toEqual([
      "assertProviderDelivery(request.operation, result.delivery)",
      "application.sourceFactories[request.operation].make(result.delivery)",
    ]);
    expect(provider.assertion.callable).toBe("assertProviderDelivery(request.operation, result.delivery)");
  });

  it("D2506 preserves consecutive same-branch eval delta semantics and operands", () => {
    const occurrence = projection("derived.compare.eval_delta").derivation.occurrenceContract;
    expect(occurrence.alternatives[0].operands[0]).toMatchObject({
      cardinality: 2,
      endpointRoles: ["before", "after"],
    });
    expect(occurrence.equality).toEqual([
      "same_recorded_branch",
      "consecutive_trail_order",
      "same_engine_id",
      "same_search_limit",
      "same_score_domain",
    ]);
    expect(occurrence.outputOperands).toEqual(["delta", "plyOffset"]);
  });

  it("D2507 retains bait-capture and check-induced deflection alternatives", () => {
    const occurrence = projection("derived.tactic.deflection_observed").derivation.occurrenceContract;
    expect(occurrence.alternatives.map((arm: { discriminator: string }) => arm.discriminator)).toEqual([
      "bait_capture",
      "check_induced",
    ]);
    const checkArm = occurrence.alternatives[1];
    expect(checkArm.operands.find((operand: { projection: string }) => operand.projection === "rules.tactic.event.check")).toMatchObject({ edgeOffsets: [1] });
    expect(checkArm.operands.find((operand: { projection: string }) => operand.projection === "rules.transition.event.capture")).toMatchObject({ edgeOffsets: [3] });

    const checkInduced = anchors("7k/4q1r1/8/8/8/8/8/R1K1R3 w - - 0 1", ["a1a8", "g7g8", "e1e7"]);
    expect(deflectionObservedOperands(checkInduced)).toHaveLength(1);
  });

  it("D2508 assigns every unresolved operation to one set-equal successor receipt", () => {
    expect(execution.exactOperationResolution).toEqual(bindings.exactOperationResolution);
    const resolution = execution.exactOperationResolution;
    expect(resolution).toMatchObject({
      owner: "module-registration",
      operation: "compileModuleExactOperationResolution(input)",
      receipt: "ModuleExactOperationResolutionReceipt",
      completion: "set_equal_non_null_operations_and_timing_intersections",
    });
    expect(new Set(resolution.requiredProjectionKeys).size).toBe(117);
    expect(new Set(resolution.requiredPairKeys).size).toBe(205);
    expect(bindings.rows).toHaveLength(205);
    expect(bindings.rows.every((row: any) =>
      row.occurrenceRequirement.exactProjectionOperation === null &&
      row.occurrenceRequirement.resolutionOwner.receipt === resolution.receipt &&
      row.timingRequirement.exactProjectionOperation === null &&
      row.timingRequirement.resolutionOwner.receipt === resolution.receipt &&
      row.status === "blocked_dependencies"
    )).toBe(true);
    expect(moduleRfc).toMatch(/\| D8 \| Exact source\/view\/timing\/presentation resolution/u);
  });
});
