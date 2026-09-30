// rfc/phase-source-composition.md — acceptance criteria for the source-retaining phase composer.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { commitMove, createRun, invokeRunRecordPosition, recordedReadingEvidence, type DrillRun } from "@chess-tabiya/runtime";

import { loadOpeningCatalogue, type OpeningCatalogueAvailability } from "./opening-catalogue.js";
import {
  PHASE_SOURCE_FORBIDDEN_KEYS,
  assertPhaseArc,
  assertPhaseSourcePoint,
  compilePhaseArc,
  compilePhaseSourcePoint,
  compileRecordedEvidenceSnapshot,
  resolveOpeningSources,
  resolveRecordedTablebase,
  type PhaseSourceDependencies,
  type RecordedPositionEvidence,
} from "./phase-source-composition.js";
import { ProviderExchangeScheduler } from "./provider-exchange.js";
import { providerOperationDescriptors } from "./provider-operations.js";

const ROOT = resolve(import.meta.dirname, "../../..");
const at = "2026-09-24T00:00:00.000Z";
const UNAVAILABLE: OpeningCatalogueAvailability = { kind: "unavailable", reason: "artifact_missing" };
const catalogue = await loadOpeningCatalogue(resolve(ROOT, "apps/server/artifacts/runtime-opening-catalogue.json"));
const NO_PACK = compileRecordedEvidenceSnapshot({ kind: "no_pack_source" });

function runFrom(fen: string, moves: readonly string[]): DrillRun {
  let run = createRun({ id: `phase-source:${moves.join("-")}:${fen}`, packId: "phase-source", packDigest: `sha256:${"0".repeat(64)}`, startFen: fen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
  for (const move of moves) run = commitMove(run, move, { at }).run;
  return run;
}

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const KRPKR = "8/8/8/4k3/8/3PK3/8/1r2R3 w - - 0 1";
const tip = (run: DrillRun) => invokeRunRecordPosition(run, run.activeCursor.nodeId) as RecordedPositionEvidence;
const deps = (opening: OpeningCatalogueAvailability = catalogue, recorded = NO_PACK): PhaseSourceDependencies => ({ opening, recorded });

describe("the exact point (§2, criteria 5–12)", () => {
  it("[3][11] keeps opening, rules phase and endgame as independent slots with no aggregate root key", () => {
    const run = runFrom(INITIAL, ["e2e4", "e7e5"]);
    const point = compilePhaseSourcePoint(tip(run), deps());
    expect(Object.keys(point).sort()).toEqual(["openingSources", "position", "rulesEndgame", "rulesPhase", "tablebase"]);
    for (const key of PHASE_SOURCE_FORBIDDEN_KEYS) expect(key in point).toBe(false);
    expect(point.openingSources.catalogueMembership.kind).toBe("member");
    expect(point.rulesPhase.projection).toEqual({ id: "rules.phase.reading", version: 2 });
    expect(point.rulesEndgame).toMatchObject({ kind: "not_applicable" });
    expect(point.tablebase).toMatchObject({ recorded: { kind: "source_unavailable", reason: "no_pack_source" }, live: { kind: "not_requested" } });
  });

  it("[5] retains two exact opening abstentions while the rules slots still compile", () => {
    const point = compilePhaseSourcePoint(tip(runFrom(INITIAL, ["e2e4"])), deps(UNAVAILABLE));
    expect(point.openingSources.currentEndpoint).toMatchObject({ kind: "abstained", reason: "artifact_missing" });
    expect(point.openingSources.catalogueMembership).toMatchObject({ kind: "abstained", reason: "artifact_missing" });
    expect(point.rulesPhase.payload.decision.kind).toBeDefined();
  });

  it("[8][9][10] retains the five-arm decision, classifies endgames only in the endgame arm and carries no technique bytes", () => {
    const point = compilePhaseSourcePoint(tip(runFrom(KRPKR, ["e1e2"])), deps());
    expect(point.rulesPhase.payload.phase).toBe("endgame");
    expect(point.rulesEndgame).toMatchObject({ kind: "classified" });
    const bytes = JSON.stringify(point);
    expect(bytes).not.toMatch(/lucena|philidor|vancura|techniqueCandidates/iu);
  });

  it("[12] refuses structural clones, JSON round trips and double assertions", () => {
    const point = compilePhaseSourcePoint(tip(runFrom(INITIAL, ["d2d4"])), deps());
    expect(() => assertPhaseSourcePoint(point)).not.toThrow();
    expect(() => assertPhaseSourcePoint({ ...point })).toThrow(/PHASE_SOURCE_VIEW_UNSEALED/u);
    expect(() => assertPhaseSourcePoint(JSON.parse(JSON.stringify(point)))).toThrow(/PHASE_SOURCE_VIEW_UNSEALED/u);
  });

  it("[6] refuses a position that is not the recorded run.record.position@1 authority", () => {
    const point = compilePhaseSourcePoint(tip(runFrom(INITIAL, ["d2d4"])), deps());
    expect(() => compilePhaseSourcePoint(point.rulesPhase as never, deps())).toThrow(/PHASE_SOURCE_POSITION_MISMATCH/u);
  });

  it("refuses forged or cloned position authorities at every position-consuming boundary", () => {
    const position = tip(runFrom(INITIAL, ["d2d4"]));
    const forged = { projection: position.projection, payload: position.payload } as RecordedPositionEvidence;
    for (const value of [forged, { ...position }, JSON.parse(JSON.stringify(position))]) {
      expect(() => compilePhaseSourcePoint(value, deps())).toThrow(/PHASE_SOURCE_POSITION_MISMATCH/u);
      expect(() => resolveOpeningSources(value, catalogue)).toThrow(/PHASE_SOURCE_POSITION_MISMATCH/u);
      expect(() => resolveRecordedTablebase(value, NO_PACK)).toThrow(/PHASE_SOURCE_POSITION_MISMATCH/u);
    }
  });
});

describe("recorded and live tablebase slots (§2.2, criterion 7)", () => {
  const reading = (fen: string) => recordedReadingEvidence({ kind: "tablebase_result", anchor: { fen }, sourceId: "s", retrievedAt: at, grounds: "machine_validation", values: { category: "draw", dtz: 0, precise_dtz: 0, dtm: null, pieceCount: 5, checkmate: false, stalemate: false, insufficient_material: false } })!;

  it("keeps no pack, unverified, invalid, recorded and absent as distinct arms", () => {
    const run = runFrom(KRPKR, ["e1e2"]);
    const position = tip(run);
    const index = new Map([["k", [reading(position.payload.fen)]]]) as never;
    const pack = (state: "verified" | "unverified" | "invalid") => compileRecordedEvidenceSnapshot({ kind: "pack", packId: "p", packDigest: "d", recordedEvidence: state === "verified" ? { state, ledgerDigest: "l" } : { state }, positionEvidence: index });
    expect(resolveRecordedTablebase(position, pack("unverified"))).toEqual({ kind: "source_unavailable", reason: "ledger_unverified" });
    expect(resolveRecordedTablebase(position, pack("invalid"))).toEqual({ kind: "source_unavailable", reason: "ledger_invalid" });
    expect(resolveRecordedTablebase(position, NO_PACK)).toEqual({ kind: "source_unavailable", reason: "no_pack_source" });
    expect(resolveRecordedTablebase(position, pack("verified"))).toMatchObject({ kind: "recorded", fen: position.payload.fen });
    expect(resolveRecordedTablebase(tip(runFrom(KRPKR, ["e1d1"])), pack("verified"))).toMatchObject({ kind: "absent" });
    const verified = pack("verified");
    if (verified.kind !== "snapshot") throw new Error("expected snapshot");
    expect(() => resolveRecordedTablebase(position, { kind: "snapshot", receipt: { ...verified.receipt } })).toThrow(/PHASE_SOURCE_RECORDED_SNAPSHOT/u);
  });

  it("refuses unsealed or cloned recorded readings before sealing a snapshot", () => {
    const item = reading(tip(runFrom(KRPKR, ["e1e2"])).payload.fen);
    for (const forged of [{ payload: item.payload }, { ...item }, JSON.parse(JSON.stringify(item))]) {
      expect(() => compileRecordedEvidenceSnapshot({ kind: "pack", packId: "p", packDigest: "d", recordedEvidence: { state: "verified", ledgerDigest: "l" }, positionEvidence: new Map([["k", [forged as never]]]) })).toThrow(/PHASE_SOURCE_RECORDED_SNAPSHOT/u);
    }
  });

  it("retains the provider's source-failure and local-domain arms exactly and refuses a crossed FEN", async () => {
    const scheduler = new ProviderExchangeScheduler({ descriptors: providerOperationDescriptors({ engines: null, tablebaseFetch: null, explorerFetch: null, explorerToken: null }), maxActive: 1, maxQueued: 4, maxRetainedEntries: 8, maxRetainedWeight: 64, retentionTtlMs: 1_000, monotonicNowMs: () => performance.now(), wallNow: () => new Date().toISOString() });
    const scope = { id: "test", budgetMs: 5_000 };
    const endgame = runFrom(KRPKR, ["e1e2"]);
    const fen = tip(endgame).payload.fen;
    const failureRequest = { rules: "chess" as const, variant: "standard" as const, fen, timeoutMs: 1_000 };
    const failure = await scheduler.get({ operation: "syzygy.position@1", request: failureRequest }, scope, new AbortController().signal);
    const withLive = (request: typeof failureRequest, result: typeof failure): PhaseSourceDependencies => ({ ...deps(), live: new Map([[endgame.activeCursor.nodeId, { request, result }]]) });
    expect(compilePhaseSourcePoint(tip(endgame), withLive(failureRequest, failure)).tablebase.live).toMatchObject({ kind: "source_failure", result: { reason: "provider_unavailable" } });
    const opening = runFrom(INITIAL, ["e2e4"]);
    const openingRequest = { ...failureRequest, fen: tip(opening).payload.fen };
    const domain = await scheduler.get({ operation: "syzygy.position@1", request: openingRequest }, scope, new AbortController().signal);
    const domainLive: PhaseSourceDependencies = { ...deps(), live: new Map([[opening.activeCursor.nodeId, { request: openingRequest, result: domain }]]) };
    expect(compilePhaseSourcePoint(tip(opening), domainLive).tablebase.live).toMatchObject({ kind: "local_domain_result", item: { projection: { id: "rules.endgame.tablebase_domain" } } });
    // The endgame node's result presented at the opening node is a crossed provider result.
    const crossed: PhaseSourceDependencies = { ...deps(), live: new Map([[opening.activeCursor.nodeId, { request: failureRequest, result: failure }]]) };
    expect(() => compilePhaseSourcePoint(tip(opening), crossed)).toThrow(/PHASE_SOURCE_TABLEBASE_RESULT/u);
  });
});

describe("the ordered arc (§3, criteria 4, 11, 12)", () => {
  it("compiles one point per exact path node with only source-local changes", () => {
    const run = runFrom(INITIAL, ["e2e4", "e7e5", "g1f3", "b8c6", "a2a4"]);
    const result = compilePhaseArc(run, run.activeCursor.branchId, deps());
    if (result.kind !== "arc") throw new Error("expected arc");
    assertPhaseArc(result.arc);
    expect(result.arc.points.map((point) => point.position.payload.ply)).toEqual(result.arc.path.pathNodeIds.map((_, index) => index));
    const kinds = new Set(result.arc.changes.map((change) => change.source));
    for (const kind of kinds) expect(["endpoint", "catalogue_membership", "rules_phase_decision", "endgame_classification", "tablebase_domain", "recorded_tablebase_availability", "live_tablebase_availability"]).toContain(kind);
    expect(JSON.stringify(result.arc.changes)).not.toMatch(/phase_transition|left_book|entered_endgame|opening_to_middlegame/u);
    for (const key of PHASE_SOURCE_FORBIDDEN_KEYS) expect(key in result.arc).toBe(false);
    expect(() => assertPhaseArc({ ...result.arc })).toThrow(/PHASE_SOURCE_VIEW_UNSEALED/u);
  });

  it("returns the recorded-path refusal unchanged for an unknown branch", () => {
    const run = runFrom(INITIAL, ["e2e4"]);
    expect(compilePhaseArc(run, "no-such-branch", deps())).toMatchObject({ kind: "refused", path: { kind: "refused", reason: "unknown_branch" } });
  });
});

describe("production handoffs (§5, criteria 13–16)", () => {
  it("[13] Support and Review invoke the compiled operation; no ad-hoc phase join survives there", () => {
    const guidance = readFileSync(resolve(ROOT, "apps/server/src/guidance.ts"), "utf8");
    expect(guidance).toMatch(/compilePhaseSourcePoint\(invokeRunRecordPosition\(input\.run, input\.node\.id\)/u);
    expect(guidance).not.toMatch(/\bclassifyPhase\(|\bendgameClassification\(/u);
    const service = readFileSync(resolve(ROOT, "apps/server/src/service.ts"), "utf8");
    expect(service).toMatch(/const phaseArc = compilePhaseArc\(context\.run, context\.branchId/u);
    const rest = readFileSync(resolve(ROOT, "apps/server/src/rest.ts"), "utf8");
    expect(rest.match(/phaseSources: phaseSourcesFor\(access\.pack\)/gu)).toHaveLength(3);
  });

  it("[16] keeps the view server-private: not exported from the runtime package and never serialized to the web", () => {
    const runtimeBarrel = readFileSync(resolve(ROOT, "packages/runtime/src/index.ts"), "utf8");
    expect(runtimeBarrel).not.toMatch(/PhaseSourcePoint|compilePhaseArc/u);
    const rest = readFileSync(resolve(ROOT, "apps/server/src/rest.ts"), "utf8");
    expect(rest).not.toMatch(/compilePhaseSourcePoint|compilePhaseArc|phaseArc/u);
  });
});
