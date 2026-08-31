// DISPOSABLE author model for D2331-D2333. It specifies the RFC's type/lifecycle contract and is
// not the production semantic-validation implementation.
export type VersionedRef = Readonly<{ id: string; version: 1 }>;
export type EventRef = Readonly<{ id: string; version: number }>;
export type CaseArm = "positive" | "semantic_negative" | "orientation" | "counterfactual";
export type ProfileArm = CaseArm | "imported_population" | "external_label";

export type CaseRef = Readonly<{ kind: "case"; id: string; version: 1; event: EventRef; arm: CaseArm }>;
export type PopulationRef = Readonly<{ kind: "population_receipt"; id: string; version: 1; event: EventRef; inputVersion: 1; resultVersion: 1 }>;
export type ExternalRef = Readonly<{ kind: "external_disagreement_receipt"; id: string; version: 1; event: EventRef; datasetVersion: 1; resultVersion: 1 }>;
export type PresentRef = CaseRef | PopulationRef | ExternalRef;

export type Expectation = Readonly<{ kind: "emits" | "omits" }>;
export type OracleId = "rules.legal_successor" | "rules.attack_map";
export type OracleRequestMap = {
  readonly "rules.legal_successor": Readonly<{ kind: "legal_successor"; beforeFen: string; moveUci: string; afterFen: string }>;
  readonly "rules.attack_map": Readonly<{ kind: "attack_map"; fen: string; square: string; by: "white" | "black" }>;
};
export type OracleResultMap = {
  readonly "rules.legal_successor": Readonly<{ kind: "legal_successor"; legal: boolean; canonicalAfterFen: string; expectation: Expectation }>;
  readonly "rules.attack_map": Readonly<{ kind: "attack_map"; attacked: boolean; attackers: readonly string[]; expectation: Expectation }>;
};
export type OracleWitness<K extends OracleId = OracleId> = Readonly<{
  id: string; version: 1; oracle: Readonly<{ id: K; version: 1 }>;
  case: Readonly<{ id: string; version: 1 }>; event: EventRef; request: OracleRequestMap[K];
}>;

const sameEvent = (left: EventRef, right: EventRef): boolean => left.id === right.id && left.version === right.version;
export function assertBaseVersionedRef(ref: VersionedRef): void {
  if (ref.version !== 1) throw new TypeError("SEMANTIC_VALIDATION_REF_STALE");
  if (/@[0-9]+$/u.test(ref.id)) throw new TypeError("SEMANTIC_VALIDATION_ID_SUFFIX_FORBIDDEN");
}
export function assertPresentRef(arm: ProfileArm, event: EventRef, ref: PresentRef): void {
  assertBaseVersionedRef(ref);
  if (!sameEvent(event, ref.event)) throw new TypeError("SEMANTIC_VALIDATION_REF_EVENT_MISMATCH");
  if (arm === "imported_population" && ref.kind !== "population_receipt") throw new TypeError("SEMANTIC_VALIDATION_CELL_REF_KIND");
  if (arm === "external_label" && ref.kind !== "external_disagreement_receipt") throw new TypeError("SEMANTIC_VALIDATION_CELL_REF_KIND");
  if (arm !== "imported_population" && arm !== "external_label" && (ref.kind !== "case" || ref.arm !== arm)) throw new TypeError("SEMANTIC_VALIDATION_CELL_REF_KIND");
}
export function executeOracle<K extends OracleId>(input: Readonly<{
  oracle: Readonly<{ id: K; version: 1 }>;
  witness: OracleWitness<K>;
  caseRef: Readonly<{ id: string; version: 1; event: EventRef }>;
  expectation: Expectation;
  imports: readonly string[];
  run: (request: OracleRequestMap[K]) => OracleResultMap[K];
}>): OracleResultMap[K] {
  assertBaseVersionedRef(input.oracle);
  assertBaseVersionedRef(input.witness);
  if (input.witness.oracle.id !== input.oracle.id || input.witness.oracle.version !== input.oracle.version) throw new TypeError("SEMANTIC_VALIDATION_ORACLE_WITNESS_STALE");
  if (input.witness.case.id !== input.caseRef.id || input.witness.case.version !== input.caseRef.version || !sameEvent(input.witness.event, input.caseRef.event)) throw new TypeError("SEMANTIC_VALIDATION_ORACLE_WITNESS_MISMATCH");
  if (input.imports.some((value) => /semantic-(?:event|collector)|declareEvidence|compileSemanticEvidenceEvent/u.test(value))) throw new TypeError("SEMANTIC_VALIDATION_ORACLE_IMPORT_FORBIDDEN");
  const result = input.run(input.witness.request);
  if (JSON.stringify(result.expectation) !== JSON.stringify(input.expectation)) throw new TypeError("SEMANTIC_VALIDATION_ORACLE_EXPECTATION_MISMATCH");
  return result;
}
