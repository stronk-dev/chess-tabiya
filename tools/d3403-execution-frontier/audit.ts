/** Disposable D3403 research. Never imported by production or used as an availability authority. */
import {
  PRIMARY_EVIDENCE_MANIFEST,
  compileManifestExecution,
  compileProjectionExecution,
  compileEvidenceConsumerExecution,
  type CompiledEvidenceManifest,
  type VersionedEvidenceId,
} from "@chess-tabiya/runtime";

export const CATALOGUE = PRIMARY_EVIDENCE_MANIFEST;
const key = (ref: VersionedEvidenceId) => `${ref.id}@${ref.version}`;
const ordered = <T extends VersionedEvidenceId>(rows: readonly T[]) => [...rows].sort((a, b) => key(a).localeCompare(key(b)));
function attempt<T>(run: () => T) {
  try { return { kind: "compiled" as const, value: run() }; }
  catch (error) {
    if (!(error instanceof Error)) throw error;
    const code = "code" in error && typeof error.code === "string" ? error.code : null;
    return { kind: "refused" as const, code, message: error.message };
  }
}

export function auditExecutionFrontier(manifest: CompiledEvidenceManifest) {
  const projections = ordered(manifest.projections).map(projection => ({
    projection: key(projection),
    result: attempt(() => compileProjectionExecution(manifest, projection)),
  }));
  // Isolate a binding only to diagnose it. This is NOT approval of a filtered consumer.
  const bindings = [...manifest.bindings].sort((a, b) => key(a.adapter).localeCompare(key(b.adapter))).map(binding => ({
    adapter: key(binding.adapter), consumer: key(binding.consumer), projection: key(binding.projection),
    latency: binding.latency, sourceAbsence: binding.sourceAbsence ?? null,
    isolatedDiagnostic: attempt(() => {
      const result = compileEvidenceConsumerExecution({ ...manifest, bindings: [binding] }, binding.consumer);
      return { adapter: key(binding.adapter), admittedPathIds: result.bindings[0]!.paths.map(path => path.pathId) };
    }),
  }));
  const consumers = ordered(manifest.consumers).map(consumer => ({
    consumer: key(consumer), implementation: consumer.implementation,
    bindingCount: bindings.filter(row => row.consumer === key(consumer)).length,
    completeContract: attempt(() => {
      const result = compileEvidenceConsumerExecution(manifest, consumer);
      return { consumer: key(result.consumer), bindings: result.bindings.map(row => ({
        adapter: key(row.binding.adapter), projection: key(row.binding.projection),
        admittedPathIds: row.paths.map(path => path.pathId), sourceAbsence: row.sourceAbsence,
      })) };
    }),
    runtimeAdoption: "not_measured" as const,
  }));
  const projectionById = new Map(manifest.projections.map(row => [key(row), row]));
  const producers = new Map(manifest.producers.map(row => [key(row), row]));
  function literalReach(root: string, seen = new Set<string>()): Set<string> {
    if (seen.has(root)) return seen;
    seen.add(root);
    const declaration = projectionById.get(root)!;
    const members = declaration.derivation?.inputs === undefined ? declaration.derivation?.anyOf ?? [] : [declaration.derivation.inputs];
    for (const member of members) for (const input of member) literalReach(key(input), seen);
    return seen;
  }
  const reach = new Map(projections.map(row => [row.projection, literalReach(row.projection)]));
  const providerFrontier = projections.filter(row => {
    const declaration = projectionById.get(row.projection)!;
    return producers.get(key(declaration.producer))!.availability === "provider" && row.result.kind === "refused";
  }).map(row => ({
    projection: row.projection,
    payloadType: projectionById.get(row.projection)!.payloadType,
    refusal: row.result,
    affectedProjections: projections.filter(root => reach.get(root.projection)!.has(row.projection)).map(root => root.projection),
    affectedBindings: bindings.filter(binding => reach.get(binding.projection)!.has(row.projection)).map(binding => binding.adapter),
    affectedConsumers: [...new Set(bindings.filter(binding => reach.get(binding.projection)!.has(row.projection)).map(binding => binding.consumer))].sort(),
  }));
  const count = <T>(rows: readonly T[], status: (row: T) => { kind: string }) => ({
    total: rows.length, compiled: rows.filter(row => status(row).kind === "compiled").length,
    refused: rows.filter(row => status(row).kind === "refused").length,
  });
  const wholeManifest = attempt(() => compileManifestExecution(manifest));
  return {
    purpose: "Disposable migration research. Compilation diagnostics do not prove runtime adoption or exact-subject availability. No filtered executable manifest is constructed.",
    manifestDigest: manifest.digest,
    summary: {
      projections: count(projections, row => row.result),
      isolatedBindings: count(bindings, row => row.isolatedDiagnostic),
      completeConsumers: count(consumers, row => row.completeContract),
      refusedProviderDeclarations: providerFrontier.length,
    },
    wholeManifest: wholeManifest.kind === "compiled" ? { kind: wholeManifest.kind, projectionCount: wholeManifest.value.length } : wholeManifest,
    providerFrontier, projections, bindings, consumers,
  };
}
