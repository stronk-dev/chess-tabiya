// DISPOSABLE D3847 declaration experiment. No production factory, source issuer or adoption.
import { EVIDENCE_CONTRACT_DECLARATIONS, PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { compileEvidenceManifest, type ProjectionDeclaration, type VersionedEvidenceId } from "../../packages/runtime/src/evidence-contract.js";
import { deriveProjectionConventionTable } from "../../packages/runtime/src/evidence-convention-closure.js";

const E = "run.record.edge@1", C = "rules.transition.event.capture@1";
const D = "rules.tactic.reading.defender_duty_set@1", K = "rules.tactic.event.check@1", X = "rules.exchange.predicate.legal_exchange@1";
const repeated = (ref: string, count: number) => Array<string>(count).fill(ref);
const captureCounts = (horizon: number, prefix: readonly string[], suffix: readonly string[]) =>
  Array.from({ length: horizon }, (_, index) => [...prefix, ...repeated(C, index + 1), ...suffix]);

// Complete upper-bounded literal members, not a family-union/set or a sample-only census.
// The unchanged semantic predicate still rejects physically impossible/nonmatching windows.
export const SEQUENCE_SUCCESSOR_MEMBERS: Readonly<Record<string, readonly (readonly string[])[]>> = {
  "derived.pawn.sequence.contact_timing": [repeated(E, 2), repeated(E, 3)],
  "derived.pawn.sequence.harassment_pressure": [repeated(E, 2)],
  "derived.tactic.sequence.defender_consequence": [repeated(E, 3)],
  "derived.tactic.square_clearance_observed": [repeated(E, 3)],
  "derived.tactic.line_blocker_clearance_observed": [[...repeated(E, 3), X]],
  "derived.tactic.interference_observed": [[...repeated(E, 3), D, X]],
  "derived.tactic.check_zwischenzug_observed": [[...repeated(E, 4), C, K, X]],
  "derived.tactic.overload_exploitation_observed": [[...repeated(E, 3), D, C, C, C, X]],
  "derived.tactic.deflection_observed": [
    ...captureCounts(3, [...repeated(E, 3), D], [X]),
    ...captureCounts(3, [...repeated(E, 3), D], [X, K]),
  ],
  "derived.tactic.attraction_observed": [
    ...captureCounts(3, repeated(E, 3), [K]),
    ...captureCounts(5, repeated(E, 5), []),
  ],
};
const ref = (key: string): VersionedEvidenceId => {
  const [id, version] = key.split("@");
  return { id: id!, version: Number(version) };
};
export const SEQUENCE_SOURCE_REBASES = Object.keys(SEQUENCE_SUCCESSOR_MEMBERS).map(id => [`${id}@2`, `${id}@3`] as const);
const direct = deriveProjectionConventionTable(PRIMARY_EVIDENCE_MANIFEST);
export const SEQUENCE_SUCCESSOR_DECLARATIONS: readonly ProjectionDeclaration[] = Object.entries(SEQUENCE_SUCCESSOR_MEMBERS).map(([id, tuples]) => {
  const old = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === id && row.version === 2);
  if (old === undefined) throw new TypeError(`Missing recorded predecessor ${id}@2`);
  const members = tuples.map(tuple => tuple.map(ref));
  // Third-version inheritance is not transitive: explicitly retain only old direct refs.
  const conventions = direct.get(`${id}@2`)!.refs.map(value => `${value.id}@${value.version}`);
  return { ...old, version: 3,
    semantics: `${old.semantics} Complete owned recorded window; retained direct conventions: ${conventions.join(", ") || "none"}.`,
    dependsOn: [...new Set(tuples.flat())].map(ref),
    derivation: members.length === 1 ? { inputs: members[0]! } : { anyOf: members },
    disposition: { kind: "inspector_only", reason: "UNACCEPTED D3847 isolated fixed-tuple feasibility, not source qualification" },
  };
});
export const SEQUENCE_SUCCESSOR_MANIFEST = compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS,
  producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer => ({ ...producer,
    outputs: [...producer.outputs, ...SEQUENCE_SUCCESSOR_DECLARATIONS.filter(row => row.producer.id === producer.id)],
  })),
});
