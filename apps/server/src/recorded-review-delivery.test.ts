// D3859: real RunService/SQLite/current-module and production REST Request/Response delivery.
// This does not prove default-application startup or a native browser/socket journey.
// These positions carry no engine report. Local evidence must not depend on an available grade.
import { resolve } from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { branchPath } from "../../../packages/runtime/src/branch-path.js";
import { commitMove, createRun, revealFeedback } from "../../../packages/runtime/src/runtime.js";
import { movePathFrames, parsePresentationReceipt, presentedSentence } from "../../../packages/runtime/src/presentation-contract.js";
import { readRecordedOpeningHistory } from "../../../packages/runtime/src/recorded-opening-history.js";
import * as histories from "../../../packages/runtime/src/recorded-opening-history.js";
import { admitInstalledOpeningCatalogue, type OpeningCatalogueAvailability } from "../../../packages/runtime/src/opening-catalogue.js";
import type { DrillRun } from "../../../packages/runtime/src/types.js";
import { reviewFixtureRun } from "../../../packages/runtime/src/testing/review-map-fixture.js";
import { loadOpeningCatalogue } from "./opening-catalogue.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { applyObjectiveEvidenceProposal } from "../../../packages/runtime/src/objective.js";
import { RecordedGradeSourceOwner } from "./recorded-grade-sources.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { IdentityService } from "./identity.js";
import { createRestHandler } from "./rest.js";
import { compileAssistanceRequest } from "../../../packages/runtime/src/assistance-exchange.js";
import { RECORDED_SEQUENCE_POSITIVES, RECORDED_ATTRACTION_FIVE, RECORDED_DEFLECTION_CHECK } from "../../../packages/runtime/src/testing/recorded-sequence-fixtures.js";
import type { ModuleQueryPage } from "../../../packages/runtime/src/module-query.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "../../../packages/runtime/src/semantic-validation.js";
import * as modulePackets from "../../../packages/runtime/src/module-packets.js";

const AT = "2026-11-02T00:00:00.000Z";
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const storage of stores.splice(0)) storage.close(); });

function recordedLine(id: string, side: "white" | "black", fen: string, moves: readonly string[]): DrillRun {
  let run = createRun({ id, session: { kind: "position", start: { fen, side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"c".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: AT });
  for (const move of moves) {
    const turn = run.nodes.find(node => node.id === run.activeCursor.nodeId)!.fen.split(" ")[1] === "w" ? "white" : "black";
    run = commitMove(run, move, { actor: turn === side ? "user" : "system", at: AT }).run;
  }
  return revealFeedback(run, AT).run;
}

function stored(run: DrillRun, opening?: OpeningCatalogueAvailability, rated = false) {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  const principal = { learnerId: "review-source-owner", handle: "review-source-owner" };
  storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: AT });
  const lease = { ...principal, writerId: "review-source-writer" };
  if (rated) storage.createRatedRun(run, lease, "Rated source refusal", {
    runId: run.id, learnerId: principal.learnerId, calibrationId: "maia3-5m-band-ladder-2026-08-16",
    opponentBand: 1400, opponentRating: 1500, opponentRd: 24.1, learnerSide: run.start.side,
    startPieceCount: 32, engineIdentityDigest: "1e13597c42d4858b7cfd7dae01e297263364b2", state: "open", startedAt: AT,
  });
  else storage.create(run, lease);
  return { storage, principal, service: new RunService(storage, opening === undefined ? {} : { openingCatalogue: opening }) };
}

function changeObjective(run: DrillRun, nodeId = run.activeCursor.nodeId): DrillRun {
  const node = run.nodes.find(item => item.id === nodeId)!;
  return applyObjectiveEvidenceProposal(run, { nodeId, from: node.objectiveState,
    to: node.objectiveState === "active" ? "preserved" : "active", evidenceRefs: ["recorded:original-objective"] }, AT).run;
}

function objectiveLine(side: "white" | "black"): DrillRun {
  let run = recordedLine(`review-objective-${side}`, side, START, ["e2e4", "e7e5"]);
  run = changeObjective(run, run.nodes[0]!.id);
  return changeObjective(changeObjective(changeObjective(run)));
}

function items(review: Awaited<ReturnType<RunService["review"]>>, id: string) {
  return review.rows.flatMap(row => parsePresentationReceipt(row.packet).filter(item => item.adapter.projection.id === id));
}

function assertNoEngineFallback(review: Awaited<ReturnType<RunService["review"]>>) {
  expect(review.rows.every(row => row.grade === undefined)).toBe(true);
  expect(items(review, "derived.grade.move_quality")).toEqual([]);
  expect(review.evalGraph).toMatchObject({ kind: "abstained", evaluated: 0 });
  expect(review.accuracy.white.evaluated).toBe(0);
  expect(review.accuracy.black.evaluated).toBe(0);
  expect(review.rows.flatMap(row => row.facts).join(" ")).not.toMatch(/missing_eval|source_pending|derived\.|rules\.phase\.|theory\.endgame\./u);
}

describe("current recorded Review local-source delivery", () => {
  let opening: OpeningCatalogueAvailability;
  beforeAll(async () => {
    opening = await loadOpeningCatalogue(resolve("apps/server/artifacts/runtime-opening-catalogue.json"));
    if (opening.kind !== "available") throw new Error(`Installed opening fixture failed: ${opening.reason}`);
  });

  it.each(["white", "black"] as const)("delivers %s's complete installed opening history and phase without engine readings or writes", async side => {
    const run = recordedLine(`current-review-opening-${side}`, side, START,
      ["e2e4", "e7e5", "g1f3", "b8c6", "f3g1", "c6b8", "g1f3", "b8c6"]);
    const f = stored(run, opening), before = JSON.stringify(f.storage.read(run.id)!.run);
    const collect = vi.spyOn(histories, "collectRecordedOpeningHistory");
    const review = await f.service.review(run.id, f.principal);
    expect(collect).toHaveBeenCalledTimes(1);
    const history = readRecordedOpeningHistory(collect.mock.results[0]!.value);
    const path = branchPath(run, run.activeCursor.branchId);
    expect(history.rows.map(row => row.node.id)).toEqual(path.map(node => node.id));
    expect(history.rows).toHaveLength(9);
    expect(new Set(history.rows.map(row => row.node.fen.split(" ").slice(0, 4).join(" "))).size).toBeLessThan(9);
    const reached = items(review, "derived.opening.deepest_reached");
    expect(reached.length).toBeGreaterThan(0);
    expect(reached.every(item => item.adapter.projection.version === 2 && item.adapter.consumer.id === "module.review_map" && item.adapter.consumer.version === 2)).toBe(true);
    expect(reached.map(presentedSentence).join(" ")).toContain("deepest opening in the cited catalogue");
    for (const row of review.rows) expect(parsePresentationReceipt(row.packet).some(item => item.adapter.projection.id === "rules.phase.reading" && item.adapter.projection.version === 2)).toBe(true);
    assertNoEngineFallback(review);
    expect(JSON.stringify(f.storage.read(run.id)!.run)).toBe(before);
  });

  it.each(["missing", "unnamed"] as const)("retains local facts with an actually %s opening source instead of inventing an opening", async kind => {
    const run = kind === "missing" ? recordedLine("review-no-opening-installation", "white", START, ["e2e4"])
      : recordedLine("review-unnamed-position", "white", "4k3/7p/8/8/8/8/P7/4K3 w - - 0 1", ["a2a3"]);
    const f = stored(run, kind === "missing" ? admitInstalledOpeningCatalogue() : opening);
    const before = JSON.stringify(f.storage.read(run.id)!.run), collect = vi.spyOn(histories, "collectRecordedOpeningHistory");
    const review = await f.service.review(run.id, f.principal);
    expect(items(review, "derived.opening.deepest_reached")).toEqual([]);
    expect(items(review, "rules.phase.reading").length).toBeGreaterThan(0);
    if (kind === "missing") expect(collect).not.toHaveBeenCalled();
    else {
      expect(collect).toHaveBeenCalledTimes(1);
      expect(readRecordedOpeningHistory(collect.mock.results[0]!.value).rows.every(row => row.endpoints.length === 0)).toBe(true);
    }
    assertNoEngineFallback(review);
    expect(JSON.stringify(f.storage.read(run.id)!.run)).toBe(before);
  });

  it.each([
    { label: "white Lucena", side: "white" as const, fen: "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1", move: "c1c4", matches: true },
    { label: "black Lucena", side: "black" as const, fen: "2r5/R7/8/8/8/8/1p6/1k1K4 b - - 0 1", move: "c8c5", matches: true },
    { label: "pawn-sixth near miss", side: "white" as const, fen: "1K1k4/8/1P6/8/8/8/r7/2R5 w - - 0 1", move: "c1c4", matches: false },
  ])("delivers only the actually matched setup for $label without a synthesized grade", async row => {
    const run = recordedLine(`review-setup-${row.label}`, row.side, row.fen, [row.move]), f = stored(run);
    const before = JSON.stringify(f.storage.read(run.id)!.run), review = await f.service.review(run.id, f.principal);
    const setup = items(review, "theory.endgame.setup_match");
    if (row.matches) {
      expect(setup.length).toBeGreaterThan(0);
      expect(setup.map(presentedSentence).join(" ")).toContain("Lucena");
    } else expect(setup).toEqual([]);
    expect(items(review, "rules.phase.reading").length).toBeGreaterThan(0);
    expect(items(review, "rules.endgame.classification").length).toBeGreaterThan(0);
    assertNoEngineFallback(review);
    expect(JSON.stringify(f.storage.read(run.id)!.run)).toBe(before);
  });
});

describe("D3979 original-position paths through authenticated Review REST", () => {
  it.each([false, true])("retains the complete original line and enforces access without saved writes (mirrored=%s)", async black => {
    const sample = RECORDED_SEQUENCE_POSITIVES.find(row => row.projection === "derived.pawn.sequence.contact_timing")!;
    const fen = black ? mirrorSemanticFen(sample.fen, "color_and_vertical") : sample.fen;
    const moves = sample.moves.map(move => black ? mirrorSemanticUci(move, "color_and_vertical") : move);
    const run = recordedLine(`line-preview-rest-${black}`, black ? "black" : "white", fen, moves);
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    const identity = new IdentityService(storage, { cookieSecure: false }), service = new RunService(storage);
    const handler = createRestHandler(service, undefined, undefined, identity);
    const registration = await handler(new Request("http://localhost/auth/register", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle: `line-owner-${black}`, password: "recorded-line-preview-password" }) }));
    expect(registration.status).toBe(201);
    const owner = (await registration.json() as { learner: { id: string } }).learner;
    const cookie = registration.headers.get("set-cookie")!.split(";")[0]!;
    storage.create(run, { learnerId: owner.id, writerId: "line-preview-rest" });
    const saved = JSON.stringify(storage.read(run.id)!.run);
    const ask = (authenticated: boolean) => handler(new Request(`http://localhost/runs/${run.id}/review`, { headers: authenticated ? { cookie } : {} }));
    expect((await ask(false)).status).toBe(401);
    const response = await ask(true); expect(response.status).toBe(200);
    const review = await response.json() as Awaited<ReturnType<RunService["review"]>>;
    const paths = items(review, sample.projection).filter(item => item.component.id === "move_path");
    expect(paths.length).toBeGreaterThan(0);
    const complete = paths.find(item => item.component.id === "move_path" && item.component.operand.plies.length === moves.length)!;
    expect(complete).toBeDefined();
    if (complete.component.id !== "move_path") throw new Error("Missing original recorded path");
    expect(complete.component.operand.startFen).toBe(run.nodes[0]!.fen);
    expect(complete.component.operand.plies.map(ply => ply.uci)).toEqual(moves);
    expect(movePathFrames(complete.component.operand)).toEqual(branchPath(run, run.activeCursor.branchId).map(node => node.fen));
    expect(JSON.stringify(storage.read(run.id)!.run)).toBe(saved);
  });
});

describe("D3982 authenticated complete recorded-window Nudge delivery", () => {
  const families = ["derived.pawn.sequence.harassment_pressure", "derived.tactic.deflection_observed",
    "derived.tactic.attraction_observed", "derived.tactic.line_blocker_clearance_observed",
    "derived.tactic.square_clearance_observed", "derived.tactic.interference_observed",
    "derived.tactic.check_zwischenzug_observed", "derived.tactic.overload_exploitation_observed"];
  const samples = [...RECORDED_SEQUENCE_POSITIVES.filter(row => families.includes(row.projection)),
    { ...RECORDED_ATTRACTION_FIVE, projection: "derived.tactic.attraction_observed" },
    { ...RECORDED_DEFLECTION_CHECK, projection: "derived.tactic.deflection_observed" }];
  it.each([false, true])("delivers complete learner-ending captions, not future/opponent motifs (mirrored=%s)", async black => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    const identity = new IdentityService(storage, { cookieSecure: false });
    const service = new RunService(storage), handler = createRestHandler(service, undefined, undefined, identity);
    const registration = await handler(new Request("http://localhost/auth/register", { method: "POST",
      headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: `nudge-owner-${black}`, password: "nudge-complete-window-password" }) }));
    expect(registration.status).toBe(201);
    const owner = (await registration.json() as { learner: { id: string; handle: string } }).learner;
    const cookie = registration.headers.get("set-cookie")!.split(";")[0]!;
    const packetSpy = vi.spyOn(modulePackets, "compileModulePacket");
    const selected: string[] = [];
    for (const [index, sample] of samples.entries()) {
      const fen = black ? mirrorSemanticFen(sample.fen, "color_and_vertical") : sample.fen;
      const moves = sample.moves.map(move => black ? mirrorSemanticUci(move, "color_and_vertical") : move);
      const side = (fen.split(" ")[1] === "w") === (moves.length % 2 === 1) ? "white" : "black";
      const run = recordedLine(`nudge-${black}-${index}`, side, fen, moves);
      storage.create(run, { learnerId: owner.id, writerId: "nudge-http-writer" });
      const original = JSON.stringify(storage.read(run.id)!.run);
      const assistance = compileAssistanceRequest({ contextHint: "position", preference: {
        kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] },
      } });
      const ask = (subjectNodeId: string, authenticated = true) => handler(new Request(`http://localhost/runs/${run.id}/modules/query`, {
        method: "POST", headers: { "content-type": "application/json", ...(authenticated ? { cookie } : {}) },
        body: JSON.stringify({ assistance, query: { timing: "post_commit", subjectNodeId, requested: [] } }),
      }));
      const path = branchPath(run, run.activeCursor.branchId), subject = path.at(-1)!;
      expect(subject.actor).toBe("user");
      expect((await ask(subject.id, false)).status).toBe(401);
      packetSpy.mockClear();
      const response = await ask(subject.id);
      expect(response.status, `${sample.projection}/${black}/${index}`).toBe(200);
      const page = (await response.json() as { page: ModuleQueryPage }).page;
      expect(page.subjectNodeId).toBe(subject.id);
      const packet = page.packets.find(row => row.module === "postcommit_nudge")!;
      expect(packet).toBeDefined();
      const delivered = parsePresentationReceipt(packet.receipt);
      const current = packetSpy.mock.calls.find(([request]) => request.module === "postcommit_nudge" && request.mode !== "admit")![0];
      const originalSequence = current.evidence.filter(item => item.projection.id === sample.projection);
      expect(originalSequence, `${sample.projection}/${black}/${index} must reach the real reducer`).toHaveLength(1);
      const overlap = current.evidence.some(item => item.projection.id === "derived.tactic.overload_exploitation_observed")
        && current.evidence.some(item => item.projection.id === "derived.tactic.deflection_observed");
      const selectedProjection = overlap ? "derived.tactic.overload_exploitation_observed" : sample.projection;
      const caption = delivered.filter(item => item.adapter.projection.id === selectedProjection);
      expect(caption, `${selectedProjection}/${black}/${index}`).toHaveLength(1);
      if (caption.length !== 0) {
        selected.push(`${selectedProjection}/${sample.moves.length}`);
        expect(caption).toHaveLength(1);
        expect(caption[0]!.component.id).toBe("square_set");
        expect(caption[0]!.adapter.projection.version).toBe(3);
        expect(presentedSentence(caption[0]!)).not.toMatch(/derived\.|rules\.|@3|missing_eval/u);
      }
      expect(packet.budget.after.facts).toBeLessThanOrEqual(2);
      expect(packet.budget.after.words).toBeLessThanOrEqual(50);
      expect(packet.budget.after.marks).toBeLessThanOrEqual(2);
      expect(packet.budget.after.arrows).toBeLessThanOrEqual(1);
      if (overlap) {
        expect(delivered.some(item => item.adapter.projection.id === "derived.tactic.deflection_observed")).toBe(false);
        expect(delivered.some(item => item.adapter.projection.id === "rules.transition.event.last_of_role")).toBe(true);
        expect(packet.budget.dropped).toEqual([]); // Deflection loses the fact backstop, not a fabricated word deferral.
      }
      expect((await ask(path.at(-2)!.id)).status).toBe(400); // Actual automatic opponent node.
      if (path.length > 3) {
        const earlier = await ask(path.at(-3)!.id);
        expect(earlier.status).toBe(200);
        const prior = (await earlier.json() as { page: { packets: { receipt: unknown }[] } }).page;
        expect(prior.packets.flatMap(row => parsePresentationReceipt(row.receipt))
          .filter(item => item.adapter.projection.id === sample.projection)).toEqual([]);
      }
      expect(JSON.stringify(storage.read(run.id)!.run)).toBe(original);
    }
    expect(samples).toHaveLength(10);
    expect(selected).toEqual([
      "derived.pawn.sequence.harassment_pressure/8", "derived.tactic.overload_exploitation_observed/3",
      "derived.tactic.attraction_observed/3", "derived.tactic.line_blocker_clearance_observed/3",
      "derived.tactic.square_clearance_observed/3", "derived.tactic.interference_observed/3",
      "derived.tactic.check_zwischenzug_observed/4", "derived.tactic.overload_exploitation_observed/3",
      "derived.tactic.attraction_observed/5", "derived.tactic.deflection_observed/3",
    ]);
  });
});

for (const side of ["white", "black"] as const) describe(`complete current Review service source for ${side}`, () => {
  let run: DrillRun, f: ReturnType<typeof stored>;
  beforeEach(() => {
    run = revealFeedback(reviewFixtureRun({ id: `current-review-long-${side}`, kind: "position", side, plies: 70 }), AT).run;
    f = stored(run);
  });
  it("retains all70 decisions, original fixed endpoints and both accuracy denominators", async () => {
    const before = JSON.stringify(f.storage.read(run.id)!.run), review = await f.service.review(run.id, f.principal);
    expect(review.rows).toHaveLength(70);
    expect(review.coverage).toMatchObject({ evaluated: 71, positions: 71 });
    expect(review.evalGraph).toMatchObject({ kind: "complete", evaluated: 70 });
    for (const colour of ["white", "black"] as const) expect(review.accuracy[colour]).toMatchObject({ kind: "rendered", decisions: 35, evaluated: 35 });
    expect(items(review, "derived.grade.move_quality").length).toBeGreaterThan(0);
    expect(JSON.stringify(f.storage.read(run.id)!.run)).toBe(before);
  });
});

describe("D3927 actual single-line Review objective delivery", () => {
  it.each(["white", "black"] as const)("retains %s's repeated source occurrences but never retargets its root event", async side => {
    const run = objectiveLine(side), f = stored(run), before = JSON.stringify(f.storage.read(run.id)!.run);
    const collect = vi.spyOn(RecordedGradeSourceOwner.prototype, "reviewObjectives");
    const review = await f.service.review(run.id, f.principal);
    expect(run.branches).toHaveLength(1);
    expect(collect).toHaveBeenCalledTimes(1);
    const acquired = collect.mock.results[0]!.value as ReturnType<RecordedGradeSourceOwner["reviewObjectives"]>;
    expect(acquired.items.map(item => item.plyOffset)).toEqual([0, 2, 2, 2]);
    expect(parsePresentationReceipt(review.rows[0]!.packet).filter(item => item.adapter.projection.id === "run.record.objective_transition")).toEqual([]);
    const objectives = items(review, "run.record.objective_transition");
    expect(objectives).toHaveLength(3);
    expect(objectives.every(item => item.adapter.projection.version === 2 && item.adapter.consumer.id === "module.review_map" && item.adapter.consumer.version === 2)).toBe(true);
    expect(objectives.map(presentedSentence)).toEqual([
      "The rehearsal goal changed from in progress to preserved.",
      "The rehearsal goal changed from preserved to in progress.",
      "The rehearsal goal changed from in progress to preserved.",
    ]);
    assertNoEngineFallback(review);
    expect(JSON.stringify(f.storage.read(run.id)!.run)).toBe(before);
  });

  for (const side of ["white", "black"] as const) for (const timing of ["before", "after"] as const) {
    it.each(["stale", "revoked", "cancelled", "rated"] as const)(`refuses ${side}'s %s request ${timing} source collection, without publishing`, async reason => {
      const run = objectiveLine(side), f = stored(run, undefined, reason === "rated"), controller = new AbortController();
      const lease = { ...f.principal, writerId: "review-source-writer" };
      const reader = { learnerId: "objective-reader", handle: "objective-reader" };
      f.storage.createLearner({ id: reader.learnerId, handle: reader.handle, passwordHash: "!", createdAt: AT });
      f.storage.grantRole(run.id, reader.learnerId, "spectator", lease, AT);
      // A read barrier models a race to an actually persisted open rated declaration. It does
      // not invent a rating record or claim that switching an ordinary game to rated is a UI flow.
      let exposeRating = false;
      const ratedGame = f.storage.ratedGame.bind(f.storage);
      if (reason === "rated") vi.spyOn(f.storage, "ratedGame").mockImplementation(id => exposeRating ? ratedGame(id) : undefined);
      const mutate = () => {
        if (reason === "stale") f.storage.save(changeObjective(run), lease);
        if (reason === "revoked") f.storage.revokeGrant(run.id, reader.learnerId, lease);
        if (reason === "cancelled") controller.abort();
        if (reason === "rated") exposeRating = true;
      };
      const acquire = RecordedGradeSourceOwner.prototype.reviewObjectives;
      const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute");
      vi.spyOn(RecordedGradeSourceOwner.prototype, "reviewObjectives").mockImplementation(function (this: RecordedGradeSourceOwner, context) {
        if (timing === "before") mutate();
        const result = acquire.call(this, context);
        if (timing === "after") mutate();
        return result;
      });
      await expect(f.service.review(run.id, reader, undefined, controller.signal)).rejects.toThrow();
      expect(invoke.mock.calls.filter(([route]) => route === "run.record.objective_transition@2")).toHaveLength(timing === "before" ? 0 : 1);
      if (reason === "rated") expect(ratedGame(run.id)?.state).toBe("open");
    });
  }

  it.each(["copied", "reordered", "empty"] as const)("refuses a %s factory population as source failure, not empty success", async kind => {
    const run = objectiveLine("white"), f = stored(run), invoke = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((route, input) => {
      const result = invoke(route, input);
      if (route !== "run.record.objective_transition@2") return result;
      if (!Array.isArray(result)) throw new Error("objective factory did not return its declared population");
      return Object.freeze(kind === "empty" ? [] : kind === "reordered" ? [...result].reverse() : [...result]);
    });
    await expect(f.service.review(run.id, f.principal)).rejects.toMatchObject({ code: "EVIDENCE_UNAVAILABLE" });
  });

  it.each(["white", "black"] as const)("delivers %s's source through real cookie authentication and the production REST route", async side => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    const identity = new IdentityService(storage, { cookieSecure: false });
    const handler = createRestHandler(new RunService(storage), undefined, undefined, identity);
    const register = async (handle: string) => {
      const response = await handler(new Request("http://localhost/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: "recorded-review-test-password" }) }));
      expect(response.status).toBe(201);
      const value = await response.json() as { learner: { id: string; handle: string } };
      return { principal: { learnerId: value.learner.id, handle: value.learner.handle }, cookie: response.headers.get("set-cookie")!.split(";")[0]! };
    };
    const owner = await register(`objective-owner-${side}`), reader = await register(`objective-reader-${side}`);
    const run = objectiveLine(side), lease = { ...owner.principal, writerId: "objective-http-writer" };
    storage.create(run, lease);
    const request = (cookie?: string) => handler(new Request(`http://localhost/runs/${run.id}/review`, { headers: cookie === undefined ? {} : { cookie } }));
    expect((await request()).status).toBe(401);
    expect((await request(reader.cookie)).status).toBe(404);
    storage.grantRole(run.id, reader.principal.learnerId, "spectator", lease, AT);
    const response = await request(reader.cookie);
    expect(response.status).toBe(200);
    const review = await response.json() as Awaited<ReturnType<RunService["review"]>>;
    expect(items(review, "run.record.objective_transition").map(presentedSentence)).toHaveLength(3);
    expect(items(review, "run.record.objective_transition").every(item => item.adapter.projection.version === 2)).toBe(true);
    storage.revokeGrant(run.id, reader.principal.learnerId, lease);
    expect((await request(reader.cookie)).status).toBe(404);
    expect((await request(owner.cookie)).status).toBe(200);
  });
});
