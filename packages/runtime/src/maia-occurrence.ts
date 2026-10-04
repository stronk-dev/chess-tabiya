/** Exact occurrence values, not policy rankings or player diagnoses (provider RFC §6). */
import { resolveBranchPath } from "./branch-path.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import { assertDeclaredEvidence, type DeclaredEvidence } from "./evidence-contract.js";
import { exactMoveIdentity } from "./legal-moves.js";
import { assertProviderDelivery } from "./provider-exchange.js";
import { assertRecordedEdgeEvidence, recordedEdgePayload, type RecordedEdge } from "./recorded-edge.js";
import { assertResolvedRunSubject, type ResolvedRunSubject, type RunEventHeadDigest } from "./run-subject.js";
import type { MaiaPolicyPage, ProviderEvidenceDelivery } from "./provider-types.js";

export type MaiaOccurrencePageEvidence = DeclaredEvidence<ProviderEvidenceDelivery<MaiaPolicyPage, "maia.policy_page@1">>;
export interface MaiaRunMoveOccurrence {
  readonly page: MaiaOccurrencePageEvidence;
  readonly run: {
    readonly runId: string;
    readonly eventHeadDigest: RunEventHeadDigest;
    readonly startFen: string;
    readonly historyUci: readonly string[];
    readonly reachedFen: string;
    readonly playedMoveUci: string;
  };
}
export interface MaiaExactFenMoveOccurrence {
  readonly page: MaiaOccurrencePageEvidence;
  readonly position: { readonly fen: string; readonly observedMoveUci: string };
}

function pagePosition(page: MaiaOccurrencePageEvidence): MaiaPolicyPage["request"]["position"] {
  assertDeclaredEvidence(page);
  if (page.projection.id !== "human.maia.policy_page" || page.projection.version !== 1) throw new TypeError("Maia occurrence requires human.maia.policy_page@1");
  assertProviderDelivery("maia.policy_page@1", page.payload);
  return page.payload.payload.request.position;
}

/** Computes from the selected historical edge, never the present run cursor. */
export function maiaRunOccurrencePayload(page: MaiaOccurrencePageEvidence, resolved: ResolvedRunSubject, edge: DeclaredEvidence<RecordedEdge>): MaiaRunMoveOccurrence {
  assertResolvedRunSubject(resolved);
  const subject = resolved.subject;
  if (subject.kind !== "run_edge") throw new TypeError("Maia run move occurrence requires an exact historical edge");
  assertRecordedEdgeEvidence(edge);
  const actual = edge.payload;
  if (actual.runId !== subject.runId || actual.edgeBranchId !== subject.branchId ||
      actual.beforeNodeId !== subject.beforeNodeId || actual.afterNodeId !== subject.afterNodeId ||
      actual.beforeFen !== subject.beforeFen || actual.moveUci !== subject.moveUci || actual.afterFen !== subject.afterFen) {
    throw new TypeError("Maia run occurrence edge identity mismatch");
  }
  const request = pagePosition(page);
  if (request.kind !== "history_conditioned") throw new TypeError("Maia run occurrence requires a history-conditioned page");
  const path = resolveBranchPath(resolved.run, subject.branchId);
  if (path.kind !== "resolved") throw new TypeError("Maia occurrence path does not resolve");
  const beforeIndex = path.nodes.findIndex(node => node.id === subject.beforeNodeId);
  if (beforeIndex < 0 || path.nodes[beforeIndex + 1]?.id !== subject.afterNodeId) throw new TypeError("Maia occurrence edge is not consecutive on its path");
  const startFen = resolved.run.start.fen;
  if (path.nodes[0]?.fen !== startFen || canonicalFen(positionFromFen(startFen)) !== startFen) throw new TypeError("Maia occurrence start position mismatch");
  const historyUci: string[] = [];
  for (let i = 1; i <= beforeIndex; i += 1) {
    // Each boundary replays through the same exact recorded-edge authority used by run subjects.
    historyUci.push(recordedEdgePayload(resolved.run, path.nodes[i - 1]!, path.nodes[i]!).moveUci);
  }
  if (request.startFen !== startFen || request.historyUci.length !== historyUci.length ||
      request.historyUci.some((move, i) => move !== historyUci[i])) throw new TypeError("Maia occurrence history identity mismatch");
  return Object.freeze({ page, run: Object.freeze({
    runId: subject.runId, eventHeadDigest: subject.eventHeadDigest, startFen,
    historyUci: Object.freeze(historyUci), reachedFen: subject.beforeFen, playedMoveUci: subject.moveUci,
  }) });
}

/** An explicitly observed legal move at the page FEN; this arm has no run/history claim. */
export function maiaExactFenOccurrencePayload(page: MaiaOccurrencePageEvidence, observedMoveUci: string): MaiaExactFenMoveOccurrence {
  const request = pagePosition(page);
  if (request.kind !== "exact_fen") throw new TypeError("Maia exact-FEN occurrence requires an exact-FEN page");
  const fen = request.fen;
  if (canonicalFen(positionFromFen(fen)) !== fen || exactMoveIdentity(fen, observedMoveUci) !== observedMoveUci) throw new TypeError("Maia observed move is illegal or noncanonical");
  return Object.freeze({ page, position: Object.freeze({ fen, observedMoveUci }) });
}
