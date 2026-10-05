import { describe, expect, it } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { compileEvidenceConsumerExecution } from "./evidence-binding-execution.js";

const contracts = [
  { id: "inspector.corpus", projection: "derived.explorer.inspector_population", legacy: "human.explorer.population", policy: { necessity: "required", whenNoPath: "honest_empty" } },
  { id: "runtime.repertoire_scan", projection: "derived.explorer.repertoire_frontier", legacy: "human.explorer.position_stats", policy: { necessity: "required", whenNoPath: "honest_empty" } },
  { id: "runtime.return_frequency", projection: "derived.explorer.position_frequency", legacy: "human.explorer.position_stats", policy: { necessity: "optional", whenNoPath: "omit_optional_item" } },
] as const;

describe("modern Explorer consumer contracts", () => {
  it.each(contracts)("$id retains v1 while compiling all v2 bindings", ({ id, projection, legacy, policy }) => {
    const old = PRIMARY_EVIDENCE_MANIFEST.consumers.find(row => row.id === id && row.version === 1);
    expect(old?.accepts).toEqual([{ id: legacy, version: 1 }, { id: projection, version: 1 }]);
    // The legacy image is not silently filtered just because a modern projection can execute.
    expect(() => compileEvidenceConsumerExecution(PRIMARY_EVIDENCE_MANIFEST, { id, version: 1 })).toThrow(/EXECUTION_SOURCE_UNREGISTERED/u);
    const modern = compileEvidenceConsumerExecution(PRIMARY_EVIDENCE_MANIFEST, { id, version: 2 });
    const successor = PRIMARY_EVIDENCE_MANIFEST.consumers.find(row => row.id === id && row.version === 2)!;
    const { version: _oldVersion, accepts: _oldAccepts, ...oldContract } = old!;
    const { version: _newVersion, accepts: _newAccepts, ...newContract } = successor;
    expect(newContract).toEqual(oldContract);
    expect(successor.accepts).toEqual([{ id: projection, version: 1 }]);
    expect(modern.consumer).toEqual({ id, version: 2 });
    expect(modern.bindings).toHaveLength(1);
    const binding = modern.bindings[0]!;
    expect(binding.binding.consumer).toEqual({ id, version: 2 });
    expect(binding.binding.adapter).toEqual({ id: `adapter.${id}.1`, version: 2 });
    expect(binding.binding.projection).toEqual({ id: projection, version: 1 });
    expect(binding.sourceAbsence).toEqual(policy);
    expect(binding.paths).toHaveLength(1);
    expect(binding.paths[0]!.sourceRequirements).toHaveLength(1);
    expect(binding.paths[0]!.sourceRequirements[0]).toMatchObject({ providerOperation: "lichess_explorer.position_page@1", projection: { id: "human.explorer.position_page", version: 1 } });
  });
});
