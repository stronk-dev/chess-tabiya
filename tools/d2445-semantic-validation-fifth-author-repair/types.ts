type VersionedEvidenceId = { readonly id: string; readonly version: 1 };
type SemanticValidationSubject =
  | { readonly kind: "event"; readonly projection: VersionedEvidenceId }
  | { readonly kind: "reading"; readonly projection: VersionedEvidenceId };
type SemanticValidationExpectation =
  | { readonly kind: "emits"; readonly minimum: 1 }
  | { readonly kind: "omits" };
type SemanticCanonicalScalar = string | number | boolean | null;
type SemanticCanonicalValue = SemanticCanonicalScalar | readonly SemanticCanonicalValue[] |
  { readonly [key: string]: SemanticCanonicalValue };
interface SemanticValidationFactConstraint {
  readonly path: readonly string[];
  readonly comparison: "scalar" | "ordered" | "canonical_multiset";
  readonly equals: SemanticCanonicalValue;
}
interface SemanticValidationPropositionRecord {
  readonly subject: SemanticValidationSubject;
  readonly case: { readonly id: string; readonly version: 1 };
  readonly factConstraint: readonly SemanticValidationFactConstraint[];
  readonly factConstraintSha256: string;
  readonly expectation: SemanticValidationExpectation;
}
interface SemanticValidationExistingAssertionAuthority {
  readonly kind: "existing_assertion"; readonly matrixRow: string; readonly testSite: `${string}.test.ts#${string}`;
  readonly sourceSha256: string; readonly frozenExpectationSha256: string;
}
interface SemanticValidationCitedPropositionAuthority {
  readonly kind: "cited_proposition"; readonly sourceId: string; readonly sourceRevision: string;
  readonly licence: string; readonly span: { readonly start: number; readonly end: number; readonly textSha256: string };
  readonly propositionSha256: string;
}
interface SemanticValidationOwnerAuthorityRef {
  readonly kind: "owner_authored"; readonly id: string; readonly version: 1;
}
interface SemanticValidationResolvedExistingAssertionAuthority {
  readonly kind: "existing_assertion"; readonly ref: SemanticValidationExistingAssertionAuthority;
  readonly proposition: SemanticValidationPropositionRecord;
}
interface SemanticValidationResolvedCitedPropositionAuthority {
  readonly kind: "cited_proposition"; readonly ref: SemanticValidationCitedPropositionAuthority;
  readonly proposition: SemanticValidationPropositionRecord;
}
interface SemanticValidationResolvedOwnerAuthority {
  readonly kind: "owner_authored"; readonly ref: SemanticValidationOwnerAuthorityRef;
  readonly rowSha256: string; readonly proposition: SemanticValidationPropositionRecord;
}
type SemanticValidationPropositionAuthority = SemanticValidationExistingAssertionAuthority |
  SemanticValidationCitedPropositionAuthority | SemanticValidationOwnerAuthorityRef;
type SemanticValidationResolvedPropositionAuthority = SemanticValidationResolvedExistingAssertionAuthority |
  SemanticValidationResolvedCitedPropositionAuthority | SemanticValidationResolvedOwnerAuthority;
declare function parseSemanticValidationExistingAssertionAuthority(value: unknown): SemanticValidationExistingAssertionAuthority;
declare function parseSemanticValidationCitedPropositionAuthority(value: unknown): SemanticValidationCitedPropositionAuthority;
declare function parseSemanticValidationOwnerAuthorityRef(value: unknown): SemanticValidationOwnerAuthorityRef;
declare function resolveSemanticValidationExistingAssertionAuthority(ref: SemanticValidationExistingAssertionAuthority): SemanticValidationResolvedExistingAssertionAuthority;
declare function resolveSemanticValidationCitedPropositionAuthority(ref: SemanticValidationCitedPropositionAuthority): SemanticValidationResolvedCitedPropositionAuthority;
declare function resolveSemanticValidationOwnerAuthority(ref: SemanticValidationOwnerAuthorityRef): SemanticValidationResolvedOwnerAuthority;

declare const resolved: SemanticValidationResolvedPropositionAuthority;
const record: SemanticValidationPropositionRecord = resolved.proposition;
const reference: SemanticValidationPropositionAuthority = resolved.ref;
void record;
void reference;
void parseSemanticValidationExistingAssertionAuthority;
void parseSemanticValidationCitedPropositionAuthority;
void parseSemanticValidationOwnerAuthorityRef;
void resolveSemanticValidationExistingAssertionAuthority;
void resolveSemanticValidationCitedPropositionAuthority;
void resolveSemanticValidationOwnerAuthority;
