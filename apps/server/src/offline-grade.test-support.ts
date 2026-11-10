// D3767/D4064 shared source-owned test fixture. In-memory synthetic pack + sidecars only: no existing
// pack/content/ruling mutation, live engine measurement, content endorsement or qualification.
import { digestDrillPack } from "../../../packages/schema/src/drill-pack/index.js";
import { createRun, commitMove } from "../../../packages/runtime/src/runtime.js";
import { branchPath } from "../../../packages/runtime/src/branch-path.js";
import { moduleDecisionStamp } from "../../../packages/runtime/src/module-decision.js";
import { deriveWorkflowContext } from "../../../packages/runtime/src/presets.js";
import { compileAssistanceRequest, compileAuthoritativeAssistance, finalizeAssistanceEffects, MODULE_SOURCE_AUTHORITY, serverAvailabilityFromProviders } from "../../../packages/runtime/src/assistance-exchange.js";
import { PackRegistry } from "./pack-registry.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-04T00:00:00.000Z";
export async function offlineGradeFixture(input: { black: boolean; before: string; after: string; bound: { kind: "depth"; requestedDepth: number } | { kind: "movetime"; requestedMs: number } }) {
  const side: "white" | "black" = input.black ? "black" : "white";
  const document = withDerivedRequires({ id: "d3767-offline-grade", version: "1.0.0", title: "Synthetic grade source only", mode: "outcome", phase: "opening",
    start: { fen: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${input.black ? "b" : "w"} KQkq - 0 1`, side },
    objective: { type: "hold", summary: "Synthetic source selection, not a chess lesson", grading: { assessedBy: { kind: "authored", note: "Synthetic fixture only" }, resolveAt: { kind: "checkpoint", checkpointId: "done" } }, successConditions: [] },
    checkpoints: [{ id: "done", trigger: { atStart: true }, actions: [] }], opponentPolicy: { mode: "human_common" }, feedbackPolicy: "immediate_guard", provenance: { reviewStatus: "schema_example", sources: [] } });
  const digest = await digestDrillPack(document);
  let run = createRun({ id: "d3767-offline-run", session: { kind: "pack", packId: document.id, packDigest: digest, start: document.start, feedbackPolicy: "immediate_guard", opponentPolicy: { mode: "human_common" } }, sessionDigest: digest,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  run = commitMove(run, input.black ? "e7e5" : "e2e4", { at, actor: "user" }).run;
  const path = branchPath(run, run.activeCursor.branchId);
  const reports = [input.before, input.after].map((score, index) => {
    const [kind, raw] = score.split(" "), fen = path[index]!.fen;
    const whiteValue = Number(raw) * (fen.split(" ")[1] === "w" ? 1 : -1);
    return { fen, values: kind === "cp" ? { centipawns: whiteValue } : { mateIn: whiteValue } };
  });
  const ledger = { schema: "tabiya.sourcing.evidence.v1", packId: document.id, packVersion: document.version, packDigest: digest, sourcedAt: at,
    records: reports.map((report, index) => ({ kind: "engine_eval", anchor: { fen: report.fen }, sourceId: `report-${index}`, retrievedAt: at, grounds: "machine_validation", supports: [],
      values: { fen: report.fen, ...report.values, depth: 35, multiPv: 1, perspective: "white", engineId: "stockfish-analysis", engineName: "Synthetic Stockfish report", engineVersion: "19" } })), abstentions: [] };
  const manifest = { schema: "tabiya.sourcing.manifest.v1", entries: reports.map((report, index) => ({ sourceId: `report-${index}`, retrievedAt: at,
    licence: { basis: "spdx", spdx: "CC0-1.0", noticeText: null, rationale: null }, origin: { kind: "engine", engineId: "stockfish-analysis", engineName: "Synthetic Stockfish report", engineVersion: "19", profile: { threads: 1, hashMb: 16, multiPv: 1 },
      budget: input.bound.kind === "depth" ? { depth: input.bound.requestedDepth } : { movetimeMs: input.bound.requestedMs }, fen: report.fen, evidenceKind: "engine_eval" } })) };
  const registry = await PackRegistry.fromDocuments([{ source: "D3767 in-memory synthetic fixture", value: document, ledger, manifest }]);
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
  try {
    const principal = { learnerId: "offline-grade-owner", handle: "offline-grade-owner" };
    storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
    storage.create(run, { learnerId: principal.learnerId, writerId: "offline-grade-writer" });
    const service = new RunService(storage, { packRegistry: registry });
    const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
    const authority = service.assistanceAuthority(run.id, principal);
    if (authority.origin.kind !== "run") throw Error("Actual offline run authority required");
    const workflow = deriveWorkflowContext(authority.origin);
    const request = compileAssistanceRequest({ contextHint: workflow, preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
    const assistance = finalizeAssistanceEffects(compileAuthoritativeAssistance(request, { ...authority, availability }), { authority: MODULE_SOURCE_AUTHORITY, availability });
    const signal = new AbortController().signal;
    const context = service.resolveGradeRecordedContext(run.id, principal, assistance, { branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId, decisionDigest: moduleDecisionStamp(run).digest, timing: "post_commit" }, signal);
    return { run, storage, workflow, registry, source: service.resolveGradeMoveSource(context, { nodeId: run.activeCursor.nodeId, signal }) };
  } catch (error) { storage.close(); throw error; }
}
