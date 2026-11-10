// Genuine current source→registered adapter→JSON→strict client receipt; no seal/prose manufacture.
import { evidenceForConsumer, PRIMARY_EVIDENCE_MANIFEST, presentEvidenceItems, serializePresentedEvidence, parsePresentationReceipt } from "@chess-tabiya/runtime";
import { invokeEvidenceValueRoute } from "../../../../../packages/runtime/src/internal/evidence-value-routes.js";
import { createRecordedSequenceWindows, readRecordedSequenceWindow } from "../../../../../packages/runtime/src/recorded-sequence-window.js";
import { recordedSequenceRouteFixture, recordedSequenceWindowFixture } from "../../../../../packages/runtime/src/testing/recorded-sequence-window-fixture.js";

export function movePathFixture(one = false, black = false) {
  const route = "derived.pawn.sequence.contact_timing@3";
  const run = one ? recordedSequenceWindowFixture({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", moves: ["g1f3"] }, black)
    : recordedSequenceRouteFixture(route, black);
  const child = run.nodes.at(-1)!, parent = run.nodes.find(node => node.id === child.parentId)!;
  const values = one ? invokeEvidenceValueRoute("rules.mobility.event.piece_destinations@1", { beforeFen: parent.fen, moveUci: child.moveUci!, afterFen: child.fen })
    : invokeEvidenceValueRoute(route, { window: createRecordedSequenceWindows({ run, branchId: run.activeCursor.branchId, throughNodeId: child.id, route }).windows.find(window => readRecordedSequenceWindow(window, route).authority.horizon === 3)! });
  const receipt = serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: one ? "module.full_inspector" : "module.review_map", version: 2 }, values)));
  const owner = parsePresentationReceipt(JSON.parse(JSON.stringify(receipt))).find(item => item.component.id === "move_path");
  if (owner?.component.id !== "move_path") throw new Error("Genuine source emitted no recorded path");
  return { run, owner, component: owner.component, receipt };
}
