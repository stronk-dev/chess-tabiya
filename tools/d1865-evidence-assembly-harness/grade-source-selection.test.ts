// Disposable D3767 research. Synthetic engine scores exercise the real stored-run/authenticated
// REST/query/strict-client boundary. No detector quality, selected DOM or new priority is claimed.
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRun, commitMove, revealFeedback, fork } from "../../packages/runtime/src/runtime.js";
import { exactLegalMoves } from "../../packages/runtime/src/legal-moves.js";
import { branchPath } from "../../packages/runtime/src/branch-path.js";
import { canonicalRunStart } from "../../packages/runtime/src/session.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "../../packages/runtime/src/semantic-validation.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { MODULE_REGISTRY } from "../../packages/runtime/src/module-registry.js";
import { evidenceForConsumer } from "../../packages/runtime/src/evidence-contract.js";
import { presentEvidenceItems } from "../../packages/runtime/src/presentation-contract.js";
import { fitModulePresentation } from "../../packages/runtime/src/module-query.js";
import { admitModuleFacts, orderAdmittedFacts, dedupeByFactIdentity, applyDeclaredSubsumption, applyPositionNovelty, applyBackstop, POSTCOMMIT_OBSERVED_WINDOW_REFS } from "../../packages/runtime/src/module-reducers.js";
import * as packets from "../../packages/runtime/src/module-packets.js";
import { compileAssistanceRequest } from "../../packages/runtime/src/assistance-exchange.js";
import { attachDelivery, evaluationDelivery } from "../../packages/runtime/src/testing/review-evidence-fixture.js";
import { RECORDED_SEQUENCE_POSITIVES } from "../../packages/runtime/src/testing/recorded-sequence-fixtures.js";
import { RECORDED_SEQUENCE_HORIZONS } from "../../packages/runtime/src/recorded-sequence-window.js";
import { parseModuleQueryPage } from "../../apps/web/src/lib/module-query-response.js";
import { RunService } from "../../apps/server/src/service.js";
import { SQLiteRunStorage } from "../../apps/server/src/storage.js";
import { IdentityService } from "../../apps/server/src/identity.js";
import { createRestHandler } from "../../apps/server/src/rest.js";
import { RecordedGradeSourceOwner } from "../../apps/server/src/recorded-grade-sources.js";
import { readRecordedGradeSource, type RecordedGradeSource } from "../../packages/runtime/src/recorded-grade-source.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";

const at = "2026-11-04T00:00:00.000Z", module = MODULE_REGISTRY.byId.get("postcommit_nudge")!;
if (module.accepts.kind !== "manifest") throw Error("Actual Nudge image unavailable");
const windows = module.accepts.projections.map(ref => `${ref.projection.id}@${ref.projection.version}`).filter(ref => ref === "derived.exchange.trade_completed@2" || Object.hasOwn(RECORDED_SEQUENCE_HORIZONS, ref));
const inputs = [
  { name: "e-pawn", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", moves: ["e2e4"] },
  { name: "quiet-knight", fen: "7k/p7/8/8/8/2P1PN2/6P1/K7 w - - 0 1", moves: ["f3d4"] },
  { name: "quiet-repeated-grade", fen: "7k/p7/8/8/8/2P1PN2/6P1/K7 w - - 0 1", moves: ["f3d4", "h8g8", "d4f3"] },
  ...windows.map(ref => {
    const setup = RECORDED_SEQUENCE_POSITIVES.find(value => value.projection === ref.split("@")[0]);
    if (setup === undefined) throw Error(`Missing original positive ${ref}`);
    return { name: ref, fen: setup.fen, moves: setup.moves };
  }),
  { name: "critical-checkmate", fen: "7k/8/5K2/6Q1/8/8/8/8 w - - 0 1", moves: ["g5g7"] },
  { name: "critical-promotion", fen: "7k/P7/8/8/8/8/8/K7 w - - 0 1", moves: ["a7a8q"] },
  { name: "critical-castled", fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", moves: ["e1g1"] },
  { name: "critical-last_of_role", fen: "4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1", moves: ["e2e7"] },
  ...["missing-before", "missing-after", "incomparable", "below-threshold"].map(reason => ({ name: `quiet-${reason}`, fen: "7k/p7/8/8/8/2P1PN2/6P1/K7 w - - 0 1", moves: ["f3d4"] })),
];
const rows: unknown[] = [], stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const storage of stores.splice(0)) storage.close(); });
const projectionNames = (facts: readonly { projection: { id: string; version: number } }[]) => facts.map(fact => `${fact.projection.id}@${fact.projection.version}`);
describe("D3767 original canonical Nudge selection and whole-bundle fit", () => {
  it("derives exactly the original eight priority families and nonpriority trade", () => {
    expect([...windows].sort()).toEqual([...POSTCOMMIT_OBSERVED_WINDOW_REFS, "derived.exchange.trade_completed@2"].sort());
  });
  for (const black of [false, true]) for (const inherited of [false, true]) for (const [index, setup] of inputs.entries()) {
    it(`${setup.name}, mirrored=${black}, inherited=${inherited}, through actual cookie REST and strict client`, async () => {
      const fen = black ? mirrorSemanticFen(setup.fen, "color_and_vertical") : setup.fen;
      const moves = setup.moves.map(move => black ? mirrorSemanticUci(move, "color_and_vertical") : move);
      const startsWhite = fen.split(" ")[1] === "w", lastWhite = moves.length % 2 === 1 ? startsWhite : !startsWhite;
      const side = lastWhite ? "white" : "black";
      let run = createRun({ id: `grade-selection-${index}-${black}`, session: { kind: "position", start: canonicalRunStart({ fen, side }), feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
        sessionDigest: `sha256:${"c".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
      for (const move of moves) {
        const node = run.nodes.find(node => node.id === run.activeCursor.nodeId)!;
        run = commitMove(run, move, { at, actor: node.fen.split(" ")[1] === side[0] ? "user" : "system" }).run;
      }
      const path = branchPath(run, run.activeCursor.branchId);
      const terminal = exactLegalMoves(path.at(-1)!.fen).length === 0;
      for (const [ordinal, node] of path.entries()) {
        if (ordinal === path.length - 1 && terminal) continue; // No fabricated terminal engine report.
        if (setup.name === "quiet-missing-before" && ordinal === path.length - 2 || setup.name === "quiet-missing-after" && ordinal === path.length - 1) continue;
        const loss = setup.name === "quiet-repeated-grade" ? ordinal % 2 === 1 : ordinal === path.length - 1 && setup.name !== "quiet-below-threshold";
        run = attachDelivery(run, node.id, evaluationDelivery(node.fen, loss ? "cp 200" : "cp 0",
          { generation: setup.name === "quiet-incomparable" && ordinal === path.length - 1 ? 2 : 1 }));
      }
      run = revealFeedback(run, at).run;
      if (inherited) {
        run = fork(run, run.activeCursor.nodeId, { at }).run;
        expect(run.nodes.find(node => node.id === run.activeCursor.nodeId)!.branchId).not.toBe(run.activeCursor.branchId);
      }
      const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
      const service = new RunService(storage), identity = new IdentityService(storage, { cookieSecure: false, derive: async (secret, salt) => createHash("sha256").update(salt).update(secret).digest() });
      const handler = createRestHandler(service, undefined, undefined, identity);
      const registered = await handler(new Request("http://tabiya.test/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "grade_research", password: "grade-research-password" }) }));
      expect(registered.status).toBe(201);
      const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!, learner = storage.learnerByHandle("grade_research")!;
      storage.create(run, { learnerId: learner.id, writerId: "grade-research-writer" });
      const saved = JSON.stringify(storage.read(run.id));
      const ownedSources: RecordedGradeSource[] = [], capture = RecordedGradeSourceOwner.prototype.postcommitSources;
      vi.spyOn(RecordedGradeSourceOwner.prototype, "postcommitSources").mockImplementation(function(this: RecordedGradeSourceOwner, context) {
        const result = capture.call(this, context); ownedSources.push(result.grade); return result;
      });
      const original = packets.compileModulePacket, observed: { request: packets.ModulePacketRequest; result: packets.ModulePacket }[] = [];
      vi.spyOn(packets, "compileModulePacket").mockImplementation(request => { const result = original(request); if (request.module === "postcommit_nudge") observed.push({ request, result }); return result; });
      const assistance = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
      const response = await handler(new Request(`http://tabiya.test/runs/${run.id}/modules/query`, { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ assistance, query: { timing: "post_commit", subjectNodeId: run.activeCursor.nodeId, requested: [] } }) }));
      const body = await response.json(); expect(response.status, JSON.stringify(body)).toBe(200);
      const received = parseModuleQueryPage(body, { runId: run.id, subjectNodeId: run.activeCursor.nodeId, finalDigest: body.page.effectiveConfigDigest });
      const delivered = received.packets.find(packet => packet.module === "postcommit_nudge"); expect(delivered).toBeDefined();
      const currentSources = ownedSources.filter(source => readRecordedGradeSource(source).authority.subject.child.node.id === run.activeCursor.nodeId);
      expect(currentSources).toHaveLength(1);
      const currentSource = readRecordedGradeSource(currentSources[0]!);
      expect(currentSource.authority.subject).toMatchObject({ branchId: run.activeCursor.branchId, parent: { node: { id: path.at(-2)!.id } }, child: { node: { id: path.at(-1)!.id } } });
      const factory = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: currentSources[0]! });
      const current = observed.filter(row => row.request.mode !== "admit"); expect(current).toHaveLength(1);
      const { request, result } = current[0]!; if (result.kind !== "packet") throw Error("Actual current Nudge packet refused");
      const ungraded = terminal || ["quiet-missing-before", "quiet-missing-after", "quiet-incomparable", "quiet-below-threshold"].includes(setup.name);
      const grade = request.evidence.filter(value => value.projection.id === "derived.grade.move_quality"); expect(grade).toHaveLength(ungraded ? 0 : 1);
      if (terminal || setup.name === "quiet-missing-before" || setup.name === "quiet-missing-after" || setup.name === "quiet-incomparable") {
        const reason = setup.name === "quiet-incomparable" ? "unequal_instrument" : "missing_eval";
        expect(factory).toEqual({ kind: "unavailable", reason });
        expect(delivered!.unavailable.filter(row => row.projection === "derived.grade.move_quality@2")).toEqual([{ projection: "derived.grade.move_quality@2", reason }]);
      } else {
        expect(factory.kind).toBe("available");
        if (factory.kind !== "available") throw Error("Original comparable grade source became unavailable");
        expect(factory.value).toHaveLength(setup.name === "quiet-below-threshold" ? 0 : 1);
        expect(delivered!.unavailable.filter(row => row.projection === "derived.grade.move_quality@2")).toEqual([]);
      }
      const admitted = admitModuleFacts(module, PRIMARY_EVIDENCE_MANIFEST, evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, module.consumer!, request.evidence), "post_commit");
      const ordered = orderAdmittedFacts(module, admitted), deduped = dedupeByFactIdentity(ordered), subsumed = applyDeclaredSubsumption(deduped), novelty = applyPositionNovelty(module, subsumed, request.ancestorFacts);
      const kept = applyBackstop(module, novelty.facts, admitted.length, novelty.abstained);
      expect(kept).toEqual(result.facts); expect(novelty.abstained).toBe(result.noveltyAbstained);
      if (setup.name === "quiet-repeated-grade") expect(request.ancestorFacts?.some(facts => facts.some(fact => fact.projection.id === "derived.grade.move_quality"))).toBe(true);
      const presented = kept.length === 0 ? [] : presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, module.consumer!, kept.map(fact => fact.evidence)));
      const fitted = fitModulePresentation("postcommit_nudge", presented);
      expect(fitted.items).toEqual(delivered!.items); expect(fitted.budget).toEqual(delivered!.budget);
      if (windows.includes(setup.name)) expect(projectionNames(admitted)).toContain(setup.name);
      if (setup.name.startsWith("critical-")) expect(projectionNames(admitted)).toContain(`rules.transition.event.${setup.name.slice("critical-".length)}@1`);
      const gradeStatus = (facts: readonly { projection: { id: string; version: number } }[]) => ({ count: facts.length, gradeIndex: facts.findIndex(fact => fact.projection.id === "derived.grade.move_quality") });
      const rival = kept.find(fact => fact.projection.id !== "derived.grade.move_quality");
      const pairFit = grade.length === 0 || rival === undefined ? null : [false, true].map(gradeFirst => {
        const pair = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, module.consumer!, gradeFirst ? [grade[0]!, rival.evidence] : [rival.evidence, grade[0]!]));
        const fit = fitModulePresentation("postcommit_nudge", pair);
        expect(fit.budget.before.facts).toBe(2);
        return { gradeFirst, cost: fit.budget.before, kept: fit.items.map(item => `${item.adapter.projection.id}@${item.adapter.projection.version}`), exceeded: fit.budget.dropped.map(row => row.exceeded) };
      });
      rows.push({ setup: setup.name, mirrored: black, inherited, learner: side, terminal, syntheticScores: true, boundary: "cookie_rest_strict_client", selectedDom: false,
        originalMoves: moves, gradeSource: grade[0] === undefined ? null : { klass: (grade[0].payload as { klass: string }).klass, arm: (grade[0].payload as { arm: string }).arm },
        originalSource: { branchId: currentSource.authority.subject.branchId, parentId: currentSource.authority.subject.parent.node.id, childId: currentSource.authority.subject.child.node.id,
          factory: factory.kind === "available" ? { kind: factory.kind, count: factory.value.length } : factory },
        stages: { admitted: gradeStatus(admitted), ordered: gradeStatus(ordered), deduped: gradeStatus(deduped), subsumed: gradeStatus(subsumed), novelty: { ...gradeStatus(novelty.facts), abstained: novelty.abstained }, backstop: gradeStatus(kept) },
        actualAncestorPackets: request.ancestorFacts?.map(facts => gradeStatus(facts)) ?? [],
        backstop: projectionNames(kept), delivered: delivered!.items.map(item => `${item.adapter.projection.id}@${item.adapter.projection.version}`),
        budget: { before: delivered!.budget.before, after: delivered!.budget.after, dropped: delivered!.budget.dropped.map(row => row.exceeded) },
        hypotheticalPairFitOnly: pairFit,
        unavailableGrade: delivered!.unavailable.filter(row => row.projection === "derived.grade.move_quality@2") });
      expect(JSON.stringify(storage.read(run.id))).toBe(saved);
    });
  }
  it("writes the ignored compact source/class census", () => {
    expect(rows).toHaveLength(inputs.length * 4);
    mkdirSync(new URL("../../.cache/", import.meta.url), { recursive: true });
    writeFileSync(new URL("../../.cache/d3767-grade-selection.json", import.meta.url), JSON.stringify({ research: "D3767", syntheticScores: true, detectorQualification: "none", rows }, null, 2) + "\n");
  });
});
