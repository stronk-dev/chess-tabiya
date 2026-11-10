// DISPOSABLE historical R3 bridge. The frozen August prototype is not a current consumer.
import { PRIMARY_EVIDENCE_MANIFEST, assertEvidenceSelectionResult, type EvidenceSelectionResult } from "@chess-tabiya/runtime";
import type { EvidenceFact } from "./module-contract.js";

/** Shape of the frozen historical JSON, not a restored current selection or coverage proof. */
export interface RealResearchPacket {
  readonly id: string;
  readonly label: string;
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly population: { readonly legalAlternatives: number; readonly evaluatedAlternatives: number };
  readonly facts: readonly EvidenceFact[];
  readonly emptyReason?: string;
}

/** Current selections require source-local coverage and current subject-aware rendering. This
 * retired prototype cannot provide either; the saved historical replay remains read-only. */
export function adaptSelectedEvidence(_label: string, selection: EvidenceSelectionResult): RealResearchPacket {
  assertEvidenceSelectionResult(PRIMARY_EVIDENCE_MANIFEST, selection);
  throw new TypeError("R3_HISTORICAL_ADAPTER_RETIRED: current source-local selections require the current module pipeline");
}
