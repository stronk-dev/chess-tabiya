/**
 * Source authority attached to the sealed `rules.tactic.consequence.threat@1` value
 * (rfc/bounded-policy-targets.md §1.1, [[D2105]]).
 *
 * The threat payload names only the passed position; the source FEN it was computed from is not a
 * payload byte. The sole threat factory binds the exact `threatPassAnchor()` result to the exact
 * wrapper it minted, in the same synchronous call. `threatEvidencePassAnchor` succeeds only for
 * that object: a spread, JSON round trip, cast or separately sealed equal payload has no binding.
 */
import { evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { assertThreatPassAnchor, threats, type ThreatPassAnchorResult, type ThreatResult } from "./tactics.js";

export const THREAT_FACTORY_SYMBOL = "createRulesTacticConsequenceThreatV1Evidence";

const BOUND = new WeakMap<object, ThreatPassAnchorResult>();

/**
 * Called only by the threat factory immediately after minting. It re-derives the payload from the
 * anchor's source FEN, so even a stray call can bind nothing but the truth, and never rebinds.
 */
export function bindThreatEvidencePassAnchor(evidence: DeclaredEvidence<ThreatResult>, result: ThreatPassAnchorResult): void {
  if (BOUND.has(evidence)) throw new TypeError("Threat evidence is already bound to its pass anchor");
  const receipt = evidenceValueReceipt(evidence);
  if (receipt.factory !== THREAT_FACTORY_SYMBOL || evidence.projection.id !== "rules.tactic.consequence.threat" || evidence.projection.version !== 1) throw new TypeError("Only the sole threat factory's wrapper may carry a pass anchor");
  if (result.kind === "available") assertThreatPassAnchor(result.anchor);
  const sourceFen = result.kind === "available" ? result.anchor.sourceFen : result.sourceFen;
  if (evidenceDigest(threats(sourceFen)) !== receipt.payloadDigest) throw new TypeError("Threat payload is not the threat@1 reading of the anchored source");
  BOUND.set(evidence, result);
}

/** The exact pass-anchor result bound to a factory-minted threat wrapper, or a refusal. */
export function threatEvidencePassAnchor(evidence: DeclaredEvidence<ThreatResult>): ThreatPassAnchorResult {
  const result = BOUND.get(evidence);
  if (result === undefined) throw new TypeError("Threat evidence carries no source pass anchor (not minted by the sole threat factory)");
  return result;
}
