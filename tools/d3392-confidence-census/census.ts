/** Disposable contract instrument for D3391/D3392; not production confidence authority. */
import type { CompiledEvidenceManifest, ProjectionDeclaration, VersionedEvidenceId } from "../../packages/runtime/src/evidence-contract.js";

const key = (ref: VersionedEvidenceId) => `${ref.id}@${ref.version}`;
const members = (projection: ProjectionDeclaration): readonly (readonly VersionedEvidenceId[])[] => projection.derivation === undefined
  ? [] : projection.derivation.inputs === undefined ? projection.derivation.anyOf! : [projection.derivation.inputs];

/** Models only the two literal inheritance clauses; mixed/exact-only clauses are unresolved. */
export function confidenceCensus(manifest: Pick<CompiledEvidenceManifest, "projections">) {
  const proposed = new Map(manifest.projections.map(row => [key(row), row.confidence]));
  const corrections = new Map<string, { projection: string; declared: ProjectionDeclaration["confidence"]; required: ProjectionDeclaration["confidence"] }>();
  // Monotone downstream correction of the measured local chain. Conflicting alternatives
  // never get collapsed to the pessimistic union or assigned an invented confidence value.
  for (let iteration = 0; iteration <= manifest.projections.length; iteration += 1) {
    let changed = false;
    for (const row of manifest.projections) {
      const constraints = members(row).map(inputs => {
        const values = inputs.map(input => proposed.get(key(input)));
        if (values.some(value => value === undefined)) throw new TypeError("Census input is absent");
        return values.includes("reported") ? "reported" : values.every(value => value === "not_applicable") ? "not_applicable" : null;
      });
      const required = new Set(constraints.filter(value => value !== null));
      if (required.size !== 1) continue;
      const confidence = [...required][0]!;
      if (proposed.get(key(row)) === confidence) continue;
      proposed.set(key(row), confidence);
      corrections.set(key(row), { projection: key(row), declared: row.confidence, required: confidence });
      changed = true;
    }
    if (!changed) break;
    if (iteration === manifest.projections.length) throw new TypeError("Confidence census did not converge");
  }
  const conflicts = manifest.projections.flatMap(row => {
    const constraints = members(row).map((inputs, member) => {
      const values = inputs.map(input => proposed.get(key(input))!);
      return { member, inputs: inputs.map(key), inputConfidence: values,
        required: values.includes("reported") ? "reported" : values.every(value => value === "not_applicable") ? "not_applicable" : null };
    });
    const hard = new Set(constraints.map(member => member.required).filter(value => value !== null));
    return hard.size < 2 ? [] : [{ projection: key(row), declared: row.confidence, members: constraints }];
  });
  return { projections: manifest.projections.length, derivedProjections: manifest.projections.filter(row => row.derivation !== undefined).length,
    corrections: [...corrections.values()].sort((a, b) => a.projection.localeCompare(b.projection)),
    conflicts: conflicts.sort((a, b) => a.projection.localeCompare(b.projection)) };
}
