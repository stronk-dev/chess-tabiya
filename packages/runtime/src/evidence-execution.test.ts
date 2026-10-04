import { createHash } from "node:crypto";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST as EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import type { CompiledEvidenceManifest, ProducerDeclaration, ProjectionDeclaration } from "./evidence-contract.js";
import { compileManifestExecution, compileProjectionExecution } from "./evidence-execution.js";
import { PROVIDER_PROTOCOL_RESOURCE } from "./provider-protocol.js";

const ref = (id: string) => ({ id, version: 1 });
const SOURCE_ID = "live.stockfish.position_eval";
const source = EVIDENCE_MANIFEST.projections.find(value => value.id === SOURCE_ID)!;
function local(id: string, derivation?: ProjectionDeclaration["derivation"]): ProjectionDeclaration {
  return { ...source, ...ref(id), producer: ref("fixture.local"), plane: derivation === undefined ? "rules" : "derived", payloadType: "FixtureDerived", dependsOn: [], ...(derivation === undefined ? {} : { derivation }) };
}
function fixture(outputs: readonly ProjectionDeclaration[], otherProducers: readonly ProducerDeclaration[] = []): Pick<CompiledEvidenceManifest, "producers" | "projections"> {
  return {
    projections: [source, ...outputs, ...otherProducers.flatMap(producer => producer.outputs)],
    producers: [
      { ...EVIDENCE_MANIFEST.producers.find(value => value.id === source.producer.id)!, outputs: [source] },
      { id: "fixture.local", version: 1, plane: "derived", implementation: "fixture", availability: "local", latency: "sync", outputs },
      ...otherProducers,
    ],
  };
}

describe("literal provider projection execution", () => {
  it("uses the registered operation and whole delivery on all six actual source projections", () => {
    for (const row of PROVIDER_PROTOCOL_RESOURCE.payload.operations) {
      const [id, version] = row.sourceProjection.split("@");
      const execution = compileProjectionExecution(EVIDENCE_MANIFEST, { id: id!, version: Number(version) });
      expect(execution.own).toEqual({ availability: "provider", latency: "interactive", providerOperation: row.operation });
      expect(execution.paths).toHaveLength(1);
      expect(execution.paths[0]).toMatchObject({ derivationChoices: [], effectiveLatency: "interactive", sourceRequirements: [{ occurrence: [], projection: execution.projection, availability: "provider", providerOperation: row.operation }] });
      expect(Object.isFrozen(execution.paths[0]!.sourceRequirements[0]!.occurrence)).toBe(true);
    }
  });

  it("retains two occurrences of one source without aliasing them", () => {
    const graph = fixture([local("fixture.delta", { inputs: [ref(SOURCE_ID), ref(SOURCE_ID)] })]);
    const execution = compileProjectionExecution(graph, ref("fixture.delta"));
    expect(execution.own).toEqual({ availability: "local", latency: "sync", providerOperation: null });
    expect(execution.paths[0]!.sourceRequirements.map(source => source.occurrence)).toEqual([[0], [1]]);
    expect(execution.paths[0]!.derivationChoices[0]!.inputs).toEqual([ref(SOURCE_ID), ref(SOURCE_ID)]);
    expect(execution.worstCaseLatency).toBe("interactive");
  });

  it("keeps the actual Maia occurrence's recorded edge separate from its policy acquisition", () => {
    const execution = compileProjectionExecution(EVIDENCE_MANIFEST, ref("derived.maia.run_move_occurrence"));
    expect(execution.own).toEqual({ availability: "local", latency: "sync", providerOperation: null });
    expect(execution.paths[0]!.sourceRequirements).toEqual([
      { occurrence: [0], projection: ref("human.maia.policy_page"), availability: "provider", providerOperation: "maia.policy_page@1" },
      { occurrence: [1], projection: ref("run.record.edge"), availability: "recorded", providerOperation: null },
    ]);
    expect(execution.worstCaseLatency).toBe("interactive");
    const exact = compileProjectionExecution(EVIDENCE_MANIFEST, ref("derived.maia.exact_fen_move_occurrence"));
    expect(exact.paths[0]!.sourceRequirements).toEqual([execution.paths[0]!.sourceRequirements[0]]);
    expect(exact.paths[0]!.pathId).not.toBe(execution.paths[0]!.pathId);
  });

  it("does not misreport the integrated Explorer summary as provider-free or synchronous", () => {
    const execution = compileProjectionExecution(EVIDENCE_MANIFEST, ref("derived.explorer.population_summary"));
    expect(execution.own).toEqual({ availability: "local", latency: "sync", providerOperation: null });
    expect(execution.paths[0]!.sourceRequirements).toEqual([
      { occurrence: [0], projection: ref("human.explorer.position_page"), availability: "provider", providerOperation: "lichess_explorer.position_page@1" },
    ]);
    expect(execution.worstCaseLatency).toBe("interactive");
  });

  it("expands independent nested alternatives as Cartesian products, not one union", () => {
    const plain = local("fixture.plain");
    const alternative = local("fixture.choice", { anyOf: [[ref(SOURCE_ID)], [ref(plain.id)]] });
    const root = local("fixture.root", { inputs: [ref(alternative.id), ref(alternative.id)] });
    const execution = compileProjectionExecution(fixture([plain, alternative, root]), ref(root.id));
    expect(execution.paths).toHaveLength(4);
    expect(new Set(execution.paths.map(path => path.pathId)).size).toBe(4);
    expect(execution.paths.map(path => path.sourceRequirements.length).sort()).toEqual([0, 1, 1, 2]);
    expect(execution.paths.map(path => path.derivationChoices.map(choice => choice.occurrence))).toEqual(Array.from({ length: 4 }, () => [[], [0], [1]]));
    expect(execution.paths.filter(path => path.effectiveLatency === "sync")).toHaveLength(1);
  });

  it("does not conjoin semantic dependencies with an execution alternative", () => {
    const plain = { ...local("fixture.plain"), dependsOn: [ref(SOURCE_ID)] };
    const root = local("fixture.root", { anyOf: [[ref(plain.id)], [ref(SOURCE_ID)]] });
    const execution = compileProjectionExecution(fixture([plain, root]), ref(root.id));
    expect(execution.paths.map(path => path.sourceRequirements.length).sort()).toEqual([0, 1]);
  });

  it("preserves recorded and build-time leaves and respects all four latency levels", () => {
    const recorded = { ...local("fixture.record"), producer: ref("fixture.recorded") };
    const build = { ...local("fixture.build"), producer: ref("fixture.build_time") };
    const background = { ...local("fixture.background"), producer: ref("fixture.background_job") };
    const producers: ProducerDeclaration[] = [
      { id: "fixture.recorded", version: 1, plane: "record", implementation: "fixture", availability: "recorded", latency: "sync", outputs: [recorded] },
      { id: "fixture.build_time", version: 1, plane: "authored", implementation: "fixture", availability: "build_time", latency: "offline", outputs: [build] },
      { id: "fixture.background_job", version: 1, plane: "rules", implementation: "fixture", availability: "local", latency: "background", outputs: [background] },
    ];
    const root = local("fixture.root", { anyOf: [[ref(SOURCE_ID)], [ref(recorded.id)], [ref(build.id)], [ref(background.id)]] });
    const execution = compileProjectionExecution(fixture([root], producers), ref(root.id));
    expect(execution.paths.map(path => path.effectiveLatency).sort()).toEqual(["background", "interactive", "offline", "sync"]);
    expect(execution.worstCaseLatency).toBe("offline");
    expect(execution.paths.flatMap(path => path.sourceRequirements).map(source => source.availability).sort()).toEqual(["build_time", "provider", "recorded"]);
    expect(execution.paths.flatMap(path => path.sourceRequirements).filter(source => source.availability !== "provider").every(source => source.providerOperation === null)).toBe(true);
  });

  it("hashes the exact closed image with the registered domain and is insensitive to declaration order", () => {
    const left = local("fixture.left"), right = local("fixture.right");
    const root = local("fixture.root", { inputs: [ref(left.id), ref(right.id)] });
    const graph = fixture([left, right, root]);
    const execution = compileProjectionExecution(graph, ref(root.id));
    const path = execution.paths[0]!;
    const image = { projection: `${root.id}@1`, derivationChoices: path.derivationChoices.map(choice => ({ projection: `${choice.projection.id}@${choice.projection.version}`, occurrence: choice.occurrence, member: choice.member, inputs: choice.inputs.map(input => `${input.id}@${input.version}`) })), sourceRequirements: [] };
    // Independent domain framing, not an expectation built with digestProviderPath itself.
    const expected = "path:sha256:" + createHash("sha256").update("tabiya/provider.path.v1\0").update(canonicalizeJson(image)).digest("hex");
    expect(path.pathId).toBe(expected);
    expect(compileProjectionExecution({ ...graph, projections: [...graph.projections].reverse(), producers: [...graph.producers].reverse() }, ref(root.id))).toEqual(execution);
    const reversed = fixture([left, right, { ...root, derivation: { inputs: [ref(right.id), ref(left.id)] } }]);
    expect(compileProjectionExecution(reversed, ref(root.id)).paths[0]!.pathId).not.toBe(path.pathId);
  });

  it("sorts traversal addresses numerically, including more than ten literal inputs", () => {
    const root = local("fixture.root", { inputs: Array.from({ length: 12 }, () => ref(SOURCE_ID)) });
    expect(compileProjectionExecution(fixture([root]), ref(root.id)).paths[0]!.sourceRequirements.map(source => source.occurrence)).toEqual(Array.from({ length: 12 }, (_, index) => [index]));
  });

  it("refuses missing inputs, cycles, empty members and duplicate literal alternatives", () => {
    for (const outputs of [
      [local("fixture.root", { inputs: [ref("fixture.absent")] })],
      [local("fixture.root", { inputs: [ref("fixture.root")] })],
      [local("fixture.root", { inputs: [] })],
      [local("fixture.root", { anyOf: [[ref(SOURCE_ID)], [ref(SOURCE_ID)]] })],
    ]) expect(() => compileProjectionExecution(fixture(outputs), ref("fixture.root"))).toThrow(/EXECUTION_GRAPH_INVALID/u);
  });

  it("refuses crossed members, duplicate declarations, missing producers and invalid own execution", () => {
    const root = local("fixture.root", { inputs: [ref(SOURCE_ID)] });
    const graph = fixture([root]);
    const invalid = [
      { ...graph, projections: [...graph.projections, root] },
      { ...graph, producers: [...graph.producers, graph.producers[0]!] },
      { ...graph, producers: graph.producers.filter(producer => producer.id !== "fixture.local") },
      { ...graph, projections: [source, { ...root, derivation: { inputs: [ref(SOURCE_ID)], anyOf: [[ref(SOURCE_ID)]] } }] },
      { ...graph, producers: graph.producers.map(producer => producer.id === "fixture.local" ? { ...producer, latency: "immediate" } : producer) },
      { ...graph, producers: graph.producers.map(producer => producer.id === "fixture.local" ? { ...producer, availability: "sometimes" } : producer) },
    ];
    for (const image of invalid) expect(() => compileProjectionExecution(image as typeof graph, ref(root.id))).toThrow(/EXECUTION_GRAPH_INVALID/u);
    expect(() => compileProjectionExecution(graph, ref("fixture.absent"))).toThrow(/EXECUTION_GRAPH_INVALID/u);
  });

  it("rejects bare or crossed provider payloads instead of inventing an operation", () => {
    expect(() => compileProjectionExecution(EVIDENCE_MANIFEST, ref("live.stockfish.eval"))).toThrow(/EXECUTION_SOURCE_UNREGISTERED/u);
    const graph = fixture([]);
    for (const payloadType of ["EvidencePayload.eval", "ProviderEvidenceDelivery<MaiaPolicyPage,\"stockfish.position_evaluation@1\">", "ProviderEvidenceDelivery<FixedBoundPositionEvaluation,\"maia.policy_page@1\">"]) {
      expect(() => compileProjectionExecution({ ...graph, projections: [{ ...source, payloadType }] }, ref(SOURCE_ID))).toThrow(/EXECUTION_SOURCE_PAYLOAD/u);
    }
    expect(() => compileProjectionExecution({ ...graph, producers: graph.producers.map(producer => producer.id === source.producer.id ? { ...producer, availability: "local" } : producer) }, ref(SOURCE_ID))).toThrow(/EXECUTION_SOURCE_PAYLOAD/u);
  });

  it("compiles the whole valid image without silently excluding legacy rows", () => {
    const outputs = [local("fixture.root", { inputs: [ref(SOURCE_ID)] })];
    expect(compileManifestExecution(fixture(outputs)).map(row => row.projection.id)).toEqual(["fixture.root", SOURCE_ID]);
    expect(() => compileManifestExecution(EVIDENCE_MANIFEST)).toThrow(/EXECUTION_SOURCE_UNREGISTERED/u);
  });
});
