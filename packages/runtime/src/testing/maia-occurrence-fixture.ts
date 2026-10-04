/** Test-only capture and stored-path builders; not a production evidence authority. */
import { INITIAL_FEN } from "chessops/fen";
import { commitMove, createRun } from "../runtime.js";
import { deriveMaiaRunMoveOccurrence, providerSourceEvidence, recordedEdgeEvidence } from "../evidence-operations.js";
import { PROVIDER_EXCHANGE_AUTHORITY } from "../provider-exchange.js";
import { normalizeProviderRequest } from "../provider-requests.js";
import { maiaCapture, maiaRequest, FIXTURE_AT } from "../provider-test-fixtures.js";
import { digestRunEventHead, resolveRunSubject } from "../run-subject.js";
import type { DrillRun, Node } from "../types.js";
import type { MaiaPolicyPageRequest } from "../provider-types.js";

export function occurrenceRun(moves: readonly string[] = ["e2e4"], id = "maia-occurrence-fixture", startFen = INITIAL_FEN): DrillRun {
  let run = createRun({ id, packId: "pack", packDigest: `sha256:${"a".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    startFen, seed: 1, createdAt: FIXTURE_AT });
  for (const move of moves) run = commitMove(run, move, { at: FIXTURE_AT }).run;
  return run;
}

export function occurrenceRef(run: DrillRun, node: Node = run.nodes.at(-1)!, headSeq = run.events.length) {
  if (node.parentId === null) throw new Error("Fixture occurrence needs a move");
  const event = run.events.find(event => event.type === "move.committed" && event.data.node.id === node.id);
  if (event === undefined) throw new Error("Fixture edge needs its recorded event");
  return { kind: "run_edge" as const, runId: run.id,
    eventHeadDigest: digestRunEventHead({ runId: run.id, headSeq, events: run.events }),
    branchId: node.branchId, beforeNodeId: node.parentId, afterNodeId: node.id, moveEventSeq: event.seq };
}

export function occurrencePage(position: MaiaPolicyPageRequest["position"], candidate = "e2e4") {
  const request = normalizeProviderRequest("maia.policy_page@1", maiaRequest(position, { requestedWidth: 1 }));
  const capture = maiaCapture(request, [`info depth 1 multipv 1 policy 0.4 pv ${candidate}`, `bestmove ${candidate}`]);
  const acquisition = PROVIDER_EXCHANGE_AUTHORITY.makeProviderAcquisitionReceipt({ operation: "maia.policy_page@1", requestedIdentity: request, capture, requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT });
  const { payload, payloadReceipt } = PROVIDER_EXCHANGE_AUTHORITY.makeProviderParsedPayload(acquisition);
  const delivery = PROVIDER_EXCHANGE_AUTHORITY.makeProviderDelivery({ kind: "live", acquisition, payload, payloadReceipt, servedAt: FIXTURE_AT });
  return providerSourceEvidence("maia.policy_page@1", delivery);
}

export function occurrenceFixture() {
  const run = occurrenceRun();
  const resolved = resolveRunSubject(run, occurrenceRef(run));
  const edge = recordedEdgeEvidence(run, run.nodes[0]!, run.nodes[1]!);
  const page = occurrencePage({ kind: "history_conditioned", startFen: run.start.fen, historyUci: [] });
  return { run, resolved, edge, page, evidence: deriveMaiaRunMoveOccurrence(page, resolved) };
}
