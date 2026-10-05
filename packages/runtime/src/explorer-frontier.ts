/** Provider-exchange §8: population frontier facts, not a sample policy or quality verdict. */
import type { DeclaredEvidence } from "./evidence-contract.js";
import type { ExplorerPositionPage, ExplorerPositionPageRequest, ExplorerMoveRow, ExplorerReportedHistory, ExplorerWdlCounts, ProviderEvidenceDelivery } from "./provider-types.js";

export interface ExplorerRepertoireFrontier {
  readonly page: DeclaredEvidence<ProviderEvidenceDelivery<ExplorerPositionPage, "lichess_explorer.position_page@1">>;
  readonly request: ExplorerPositionPageRequest;
  readonly totals: ExplorerWdlCounts & { readonly total: number };
  readonly moves: readonly ExplorerMoveRow[];
  readonly listed: number;
  readonly unlisted: number;
  readonly history: ExplorerReportedHistory;
}
