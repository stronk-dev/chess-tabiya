/**
 * The compiled semantic-validation authority (rfc/semantic-validation-authority.md §§2, 6, 7).
 *
 * At import this module strictly parses the literal profile register, proves the four-way
 * root/declaration/profile/verdict equality against the live manifest and the generated receipt,
 * and exposes the only two consumer questions: "is this subject's profile passed?" and "may this
 * exact instance be admitted to a learner-role consumer?". It carries no case, fixture position or
 * production operation, so it is safe for the runtime barrel.
 */
import { PRIMARY_EVIDENCE_MANIFEST, SEMANTIC_EVENT_DECLARATIONS } from "./evidence-catalog.js";
import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence, type VersionedEvidenceId } from "./evidence-contract.js";
import { evidenceValueRouteRegistry } from "./internal/evidence-value-routes.js";
import profileDocument from "./semantic-validation-profiles.json" with { type: "json" };
import { SEMANTIC_VALIDATION_RECEIPT } from "./semantic-validation-receipt.generated.js";
import {
  SEMANTIC_READING_VALIDATION_DECLARATIONS,
  assertSemanticValidationFourWayEquality,
  parseSemanticValidationProfile,
  semanticValidationRoots,
  semanticValidationSubjectKey,
  semanticValidationVerdictFor,
  type SemanticValidationArm,
  type SemanticValidationProfile,
  type SemanticValidationSubject,
  type SemanticValidationVerdictSummary,
} from "./semantic-validation.js";

const refKey = (value: VersionedEvidenceId): string => `${value.id}@${value.version}`;

let soleFactories: ReadonlyMap<string, string> | undefined;
function soleFactory(projection: VersionedEvidenceId): string | undefined {
  soleFactories ??= new Map(evidenceValueRouteRegistry().map((meta) => [meta.route, meta.symbol]));
  return soleFactories.get(refKey(projection));
}

/** The literal profile register, strictly parsed. */
export const SEMANTIC_VALIDATION_PROFILES: readonly SemanticValidationProfile[] = Object.freeze((profileDocument as { readonly profiles: readonly unknown[] }).profiles.map(parseSemanticValidationProfile));

/** The live validation roots (§2), derived from the compiled manifest. */
export const SEMANTIC_VALIDATION_ROOTS: readonly SemanticValidationSubject[] = semanticValidationRoots(PRIMARY_EVIDENCE_MANIFEST, undefined, (projection) => soleFactory(projection) !== undefined);

const liveReadingDeclarations = SEMANTIC_READING_VALIDATION_DECLARATIONS.filter((declaration) => SEMANTIC_VALIDATION_ROOTS.some((root) => semanticValidationSubjectKey(root) === semanticValidationSubjectKey(declaration.subject)));

// Criterion 1 / §R2: four-way equality at import, each population proved unique first.
assertSemanticValidationFourWayEquality({
  roots: SEMANTIC_VALIDATION_ROOTS,
  declarations: [...SEMANTIC_EVENT_DECLARATIONS.map((declaration) => declaration.validation.profile), ...liveReadingDeclarations.map((declaration) => declaration.subject)],
  profiles: SEMANTIC_VALIDATION_PROFILES.map((profile) => profile.subject),
  verdicts: SEMANTIC_VALIDATION_RECEIPT.verdicts.map((row) => row.subject),
});

/** The generated verdict for an exact subject; a missing subject is never passed. */
export function semanticValidationVerdict(subject: SemanticValidationSubject): SemanticValidationVerdictSummary | undefined {
  return semanticValidationVerdictFor(SEMANTIC_VALIDATION_RECEIPT, subject);
}

export type SemanticValidationAdmission =
  | { readonly kind: "admitted"; readonly subject: SemanticValidationSubject; readonly factory: string; readonly payloadDigest: string }
  | { readonly kind: "refused"; readonly subject: SemanticValidationSubject; readonly reason: "event_unvalidated"; readonly open: readonly SemanticValidationArm[] }
  | { readonly kind: "refused"; readonly subject: SemanticValidationSubject; readonly reason: "event_value_unverified"; readonly detail: string };

/**
 * §7.1: the learner-role admission conjunction for one exact instance — the subject's generated
 * verdict is `passed` AND the instance carries the sole-factory value receipt for its exact
 * projection/version with a reproduced payload digest. There is no projection-wide waiver.
 */
export function admitValidatedSemanticInstance(kind: "event" | "reading", evidence: DeclaredEvidence<unknown>, table = SEMANTIC_VALIDATION_RECEIPT): SemanticValidationAdmission {
  const subject: SemanticValidationSubject = Object.freeze({ kind, projection: Object.freeze({ id: evidence.projection.id, version: evidence.projection.version }) });
  const verdict = semanticValidationVerdictFor(table, subject);
  if (verdict?.verdict !== "passed") return Object.freeze({ kind: "refused", subject, reason: "event_unvalidated", open: Object.freeze([...(verdict?.open ?? ["positive", "semantic_negative", "orientation", "counterfactual", "imported_population", "external_label"] as const)]) });
  try {
    assertDeclaredEvidence(evidence);
  } catch (error) {
    return Object.freeze({ kind: "refused", subject, reason: "event_value_unverified", detail: error instanceof Error ? error.message : String(error) });
  }
  const receipt = evidenceValueReceipt(evidence);
  const factory = soleFactory(subject.projection);
  if (factory === undefined || receipt.factory !== factory) return Object.freeze({ kind: "refused", subject, reason: "event_value_unverified", detail: `minted by ${receipt.factory}, not the sole factory ${factory ?? "(none)"}` });
  if (receipt.payloadDigest !== evidenceDigest(evidence.payload)) return Object.freeze({ kind: "refused", subject, reason: "event_value_unverified", detail: "payload digest does not reproduce" });
  return Object.freeze({ kind: "admitted", subject, factory, payloadDigest: receipt.payloadDigest });
}

/** Counts by family for documentation and the implementation log (never a blended percentage). */
export function semanticValidationSummary(): { readonly subjects: number; readonly passed: number; readonly openByArm: Readonly<Record<SemanticValidationArm, number>> } {
  const openByArm = { positive: 0, semantic_negative: 0, orientation: 0, counterfactual: 0, imported_population: 0, external_label: 0 } as Record<SemanticValidationArm, number>;
  for (const row of SEMANTIC_VALIDATION_RECEIPT.verdicts) for (const arm of row.open) openByArm[arm] += 1;
  return Object.freeze({ subjects: SEMANTIC_VALIDATION_RECEIPT.verdicts.length, passed: SEMANTIC_VALIDATION_RECEIPT.verdicts.filter((row) => row.verdict === "passed").length, openByArm: Object.freeze(openByArm) });
}
