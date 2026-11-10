// Synthetic reports with real registry/SQLite/RunService ownership. Test-only; not chess qualification.
import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { commitMove, createRun, reachCheckpoint } from "../../../packages/runtime/src/runtime.js";
import { attachDelivery, evaluationDelivery } from "../../../packages/runtime/src/testing/review-evidence-fixture.js";
import { moduleDecisionStamp } from "../../../packages/runtime/src/module-decision.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { PackRegistry } from "./pack-registry.js";
import { SQLiteRunStorage } from "./storage.js";
import { RunService } from "./service.js";
import type { EvidenceLedger, EvidenceRecord, SourceManifest } from "./sourcing/types.js";

const AT = "2026-11-02T00:00:00.000Z";
export async function recordedReviewLedgerFixture(side: "white" | "black" = "white", variant: "mixed" | "empty" | "absent" | "invalid" = "mixed", modern = true) {
  const document = withDerivedRequires({ id: "review-ledger-fixture", version: "1.0.0", title: "Synthetic Review source fixture",
    mode: "outcome", phase: "endgame", start: { fen: `4k3/7p/8/8/8/8/P7/4K3 ${side === "white" ? "w" : "b"} - - 0 1`, side },
    objective: { type: "hold", summary: "Synthetic contract fixture, not a chess lesson",
      grading: { assessedBy: { kind: "authored", note: "Synthetic fixture only" }, resolveAt: { kind: "checkpoint", checkpointId: "done" } }, successConditions: [] },
    checkpoints: [{ id: "done", trigger: { atPly: 2 }, actions: [] }], opponentPolicy: { mode: "human_common" }, feedbackPolicy: "delayed_checkpoint",
    provenance: { reviewStatus: "schema_example", sources: [] } });
  const digest = await digestDrillPack(document);
  let run = createRun({ id: `review-ledger-${side}-${variant}`, session: { kind: "pack", packId: document.id, packDigest: digest,
    start: document.start, feedbackPolicy: "delayed_checkpoint", opponentPolicy: { mode: "human_common" } }, sessionDigest: digest,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: AT });
  for (const [index, move] of (side === "white" ? ["a2a3", "h7h6"] : ["h7h6", "a2a3"]).entries()) run = commitMove(run, move, { actor: index === 0 ? "user" : "system", at: AT }).run;
  // Genuine modern attachments on every node prove historical source acquisition is independent
  // of the already selected modern grading endpoints, rather than their missing-value fallback.
  if (modern) for (const [index, node] of run.nodes.entries()) run = attachDelivery(run, node.id, evaluationDelivery(node.fen, `cp ${80 + index * 10}`));
  run = reachCheckpoint(run, "done", AT).run;
  const records: EvidenceRecord[] = run.nodes.flatMap(node => {
    const base = { anchor: { fen: node.fen }, retrievedAt: AT, supports: [] };
    const engine: EvidenceRecord = { ...base, kind: "engine_eval", sourceId: "measurement", grounds: "machine_validation",
      values: { fen: node.fen, centipawns: 20, depth: 8, multiPv: 1, perspective: "white", engineId: "fixture", engineName: "Synthetic fixture", engineVersion: "fixture" } };
    const tablebase: EvidenceRecord = { ...base, kind: "tablebase_result", sourceId: "measurement", grounds: "machine_validation",
      values: { fen: node.fen, category: "win", dtz: 1, precise_dtz: 1, dtm: null, pieceCount: 4, checkmate: false, stalemate: false, insufficient_material: false } };
    return [engine, structuredClone(engine), { ...engine, sourceId: "text", grounds: "citable_source" }, tablebase];
  });
  const ledger: EvidenceLedger = { schema: "tabiya.sourcing.evidence.v1", packId: document.id, packVersion: document.version, packDigest: digest, sourcedAt: AT,
    records: variant === "empty" ? [{ ...records[0]!, kind: "citable_text", sourceId: "text", grounds: "citable_source", values: { text: "Synthetic non-measurement record" } }] : records,
    abstentions: variant === "empty" ? [] : run.nodes.flatMap(node => (["engine_eval", "tablebase_result"] as const).map(kind => ({
      kind, anchor: { fen: node.fen }, sourceId: "text", retrievedAt: AT, reason: "source_unavailable" as const, detail: "Synthetic source abstention" }))) };
  const licence = { basis: "spdx", spdx: "CC0-1.0", noticeText: null, rationale: null } as const;
  const manifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries: (variant === "empty" ? ["text"] : ["text", "measurement"]).map(sourceId => ({ sourceId, retrievedAt: AT, licence,
    origin: { kind: "local-file" as const, path: "synthetic-records.json", sha256: digest, bytes: 1 } })) };
  const registry = await PackRegistry.fromDocuments([{ source: "synthetic-review", value: document,
    ...(variant === "absent" ? {} : { ledger: variant === "invalid" ? { ...ledger, packDigest: `sha256:${"f".repeat(64)}` } : ledger, manifest }) }]);
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
  const principal = { learnerId: "review-ledger-owner", handle: "review-ledger-owner" };
  storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: AT });
  const lease = { ...principal, writerId: "review-ledger-writer" };
  storage.create(run, lease);
  const service = new RunService(storage, { packRegistry: registry });
  const signal = new AbortController();
  const query = { branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId,
    decisionDigest: moduleDecisionStamp(run).digest, timing: "review" as const };
  const context = service.resolveGradeRecordedContext(run.id, principal, null, query, signal.signal);
  return { run, document, digest, registry, storage, principal, service, context, signal, lease, query };
}
