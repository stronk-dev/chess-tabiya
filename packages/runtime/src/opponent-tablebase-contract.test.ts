import { describe, expect, it } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { compileEvidenceConsumerExecution } from "./evidence-binding-execution.js";

describe("modern opponent tablebase consumer contract", () => {
  it("retains the complete v1 multi-provider contract beside exact v2 execution", () => {
    const ref = { id: "opponent.selection", version: 2 };
    const previous = PRIMARY_EVIDENCE_MANIFEST.consumers.find(row => row.id === ref.id && row.version === 1)!;
    const current = PRIMARY_EVIDENCE_MANIFEST.consumers.find(row => row.id === ref.id && row.version === ref.version)!;
    expect(previous.accepts).toEqual([
      "human.maia.uci_response", "live.stockfish.uci_response", "live.syzygy.probe_result", "derived.opponent.candidate_feature_vector",
    ].map(id => ({ id, version: 1 })).concat([{ id: "live.syzygy.position_result", version: 2 }]));
    const { version: _oldVersion, accepts: _oldInputs, implementation: _oldCallable, ...oldContract } = previous;
    const { version: _newVersion, accepts: _newInputs, implementation: _newCallable, ...newContract } = current;
    expect(newContract).toEqual(oldContract);
    expect(current.implementation).toBe("consumeOpponentTablebaseSelectionEvidence");
    expect(current.accepts).toEqual([{ id: "live.syzygy.position_result", version: 2 }]);
    expect(PRIMARY_EVIDENCE_MANIFEST.bindings.filter(row => row.consumer.id === ref.id && row.consumer.version === 1)).toHaveLength(5);
    expect(() => compileEvidenceConsumerExecution(PRIMARY_EVIDENCE_MANIFEST, previous)).toThrow(/EXECUTION_SOURCE_UNREGISTERED/u);
    const execution = compileEvidenceConsumerExecution(PRIMARY_EVIDENCE_MANIFEST, ref);
    expect(execution.bindings).toHaveLength(1);
    const binding = execution.bindings[0]!;
    expect(binding.binding.adapter).toEqual({ id: "adapter.opponent.selection.1", version: 2 });
    expect(binding.sourceAbsence).toEqual({ necessity: "required", whenNoPath: "operation_unavailable" });
    expect(binding.paths).toHaveLength(1);
    expect(binding.paths[0]!.sourceRequirements).toEqual([
      { occurrence: [], projection: { id: "live.syzygy.position_result", version: 2 }, availability: "provider", providerOperation: "syzygy.position@1" },
    ]);
  });
});
