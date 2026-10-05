import { describe, expect, it } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { compileEvidenceConsumerExecution } from "./evidence-binding-execution.js";
import { HINT_DISCLOSURE_PROJECTION_IDS } from "./hint-registry.js";

describe("complete Guided Hint execution contract", () => {
  it("requires search for every exact family/rung while retaining all 35 bindings", () => {
    const execution = compileEvidenceConsumerExecution(PRIMARY_EVIDENCE_MANIFEST, { id: "module.guided_hint", version: 1 });
    expect(execution.bindings).toHaveLength(35);
    const exact = (row: { readonly id: string; readonly version: number }) => `${row.id}@${row.version}`;
    expect(execution.bindings.map(row => exact(row.binding.projection)).sort()).toEqual(HINT_DISCLOSURE_PROJECTION_IDS.map(exact).sort());
    for (const row of execution.bindings) {
      expect(row.sourceAbsence).toEqual({ necessity: "required", whenNoPath: "operation_unavailable" });
      expect(row.paths).toHaveLength(1);
      expect(row.paths[0]!.sourceRequirements).toEqual([
        { occurrence: [0, 1], projection: { id: "live.stockfish.principal_variation", version: 1 }, availability: "provider", providerOperation: "stockfish.principal_variation@1" },
      ]);
    }
    // The independent local modules are not made dependent on Guided Hint's search.
    const theory = PRIMARY_EVIDENCE_MANIFEST.bindings.filter(row => row.consumer.id === "module.theory_breadcrumb");
    expect(theory.every(row => row.sourceAbsence?.necessity === "optional")).toBe(true);
    expect(PRIMARY_EVIDENCE_MANIFEST.bindings.filter(row => row.consumer.id === "module.structure_nudge")
      .every(row => row.sourceAbsence === undefined)).toBe(true);
  });
});
