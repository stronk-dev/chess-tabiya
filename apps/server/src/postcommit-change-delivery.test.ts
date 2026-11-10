// D3715: actual storage/service/cookie-auth REST/strict receivers, no content-startup waiver.
import { isDeepStrictEqual } from "node:util";
import { afterEach, describe, expect, it, vi } from "vitest";
import { branchPath, commitMove, fork, revealFeedback, compileAssistanceRequest, compileAuthoritativeAssistance, finalizeAssistanceEffects, MODULE_SOURCE_AUTHORITY, moduleDecisionStamp,
  parsePresentationReceipt, serverAvailabilityFromProviders, type DeclaredEvidence } from "@chess-tabiya/runtime";
import { postcommitChangeFixture } from "../../../packages/runtime/src/testing/postcommit-change-fixture.js";
import { hasKingZoneWitness, postcommitEdgeEvidence, POSTCOMMIT_STRUCTURAL_CHANGE_REFS } from "../../../packages/runtime/src/postcommit-nudge.js";
import { invokeEvidenceValueRoute } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import * as packets from "../../../packages/runtime/src/module-packets.js";
import { parseModuleQueryPage } from "../../web/src/lib/module-query-response.js";
import { parseInspectorQueryPage } from "../../web/src/lib/inspector-query-response.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { IdentityService } from "./identity.js";
import { createRestHandler } from "./rest.js";

const at = "2026-11-04T00:00:00.000Z";
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const analysis = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const refs: ReadonlySet<string> = new Set(POSTCOMMIT_STRUCTURAL_CHANGE_REFS);
const unchanged = (item: DeclaredEvidence<unknown>) => {
  if (!refs.has(`${item.projection.id}@${item.projection.version}`)) return false;
  const p = item.payload as { before: unknown; after: unknown }; return isDeepStrictEqual(p.before, p.after);
};
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
function stored(kind: Parameters<typeof postcommitChangeFixture>[0], black: boolean, inherited = false) {
  let { run } = postcommitChangeFixture(kind, black);
  if (inherited) {
    const path = branchPath(run, run.activeCursor.branchId);
    run = fork(run, path[1]!.id, { at }).run;
    for (const node of path.slice(2)) run = commitMove(run, node.moveUci!, { at, actor: node.actor! }).run;
    run = revealFeedback(run, at).run;
  }
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  const principal = { learnerId: "change-owner", handle: "change-owner" };
  storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  storage.create(run, { learnerId: principal.learnerId, writerId: "change-writer" });
  const service = new RunService(storage), assistance = finalizeAssistanceEffects(compileAuthoritativeAssistance(requested, { ...service.assistanceAuthority(run.id, principal), availability }), { authority: MODULE_SOURCE_AUTHORITY, availability });
  return { run, storage, principal, service, assistance };
}

describe("D3715 canonical Nudge service preservation boundaries", () => {
  for (const kind of ["locked", "capture", "pawn_free", "quiet_passer"] as const) for (const black of [false, true]) for (const inherited of kind === "locked" || kind === "quiet_passer" ? [false, true] : [false]) {
    it(`${kind}/${black}/inherited=${inherited} filters current+ancestor before admission, while exact Review events and original Inspector readings survive`, async () => {
      const f = stored(kind, black, inherited), saved = JSON.stringify(f.storage.read(f.run.id)!.run), capture = vi.spyOn(packets, "compileModulePacket");
      const path = branchPath(f.run, f.run.activeCursor.branchId);
      if (inherited) expect(path[1]!.branchId).not.toBe(f.run.activeCursor.branchId);
      const page = await f.service.queryModules(f.run.id, f.principal, f.assistance, { timing: "post_commit", subjectNodeId: f.run.activeCursor.nodeId, requested: [] });
      const nudgeCalls = capture.mock.calls.filter(([request]) => request.module === "postcommit_nudge");
      expect(nudgeCalls.filter(([request]) => request.mode === "admit")).toHaveLength(1);
      expect(nudgeCalls.filter(([request]) => request.mode !== "admit")).toHaveLength(1);
      for (const [request] of nudgeCalls) {
        expect(request.evidence.filter(unchanged)).toEqual([]);
        for (const facts of request.ancestorFacts ?? []) expect(facts.map(fact => fact.evidence).filter(unchanged)).toEqual([]);
      }
      const received = parseModuleQueryPage(JSON.parse(JSON.stringify({ page })), { runId: f.run.id, subjectNodeId: f.run.activeCursor.nodeId, finalDigest: f.assistance.finalDigest });
      expect(received.packets.find(packet => packet.module === "postcommit_nudge")).toBeDefined();
      // Grade absence stays attributed; removing noise cannot manufacture a grade or backfill.
      expect(page.packets.find(packet => packet.module === "postcommit_nudge")!.unavailable.some(item => item.projection === "derived.grade.move_quality@2")).toBe(true);
      capture.mockClear(); const review = await f.service.review(f.run.id, f.principal);
      const reviewCalls = capture.mock.calls.filter(([request]) => request.module === "review_map");
      expect(reviewCalls.length).toBeGreaterThan(0);
      const original = postcommitEdgeEvidence(f.run, f.run.nodes[0]!, f.run.nodes[1]!);
      const unchangedReview = reviewCalls.flatMap(([request]) => request.evidence).filter(unchanged);
      if (kind === "quiet_passer") expect(unchangedReview.some(item => item.projection.id === "rules.structural.event.passed_pawn")).toBe(true);
      else if (kind !== "capture") expect(unchangedReview).toEqual([]);
      const identity = (item: DeclaredEvidence<unknown>) => `${item.projection.id}@${item.projection.version}#sha256:${evidenceValueReceipt(item).payloadDigest}`;
      // Independent original factories, not the shared helper that this boundary must preserve.
      const originalFactoryEvents = path.slice(1).map((node, index) => {
        const edge = { beforeFen: path[index]!.fen, moveUci: node.moveUci!, afterFen: node.fen };
        return [...POSTCOMMIT_STRUCTURAL_CHANGE_REFS]
          .flatMap<DeclaredEvidence<unknown>>(ref => invokeEvidenceValueRoute(ref, edge)).filter(hasKingZoneWitness);
      });
      const expectedEvents = originalFactoryEvents.flat();
      // The one whole-path relation admission carries one phase reading per committed edge,
      // even when this branch has no retained generic structural event at all.
      const branchAdmissions = reviewCalls.filter(([request]) => request.evidence.filter(item => item.projection.id === "rules.phase.reading").length === path.length - 1);
      expect(branchAdmissions).toHaveLength(1);
      const offeredEvents = branchAdmissions[0]![0].evidence.filter(item => refs.has(`${item.projection.id}@${item.projection.version}`));
      expect(offeredEvents.map(identity).sort()).toEqual(expectedEvents.map(identity).sort());
      for (const [index, row] of review.rows.entries()) {
        const returnedEvents = parsePresentationReceipt(row.packet).flatMap(item => {
          const ref = item.evidenceRef;
          return ref !== null && refs.has(`${ref.projection.id}@${ref.projection.version}`)
            ? [`${ref.projection.id}@${ref.projection.version}#${ref.evidenceDigest}`] : [];
        });
        // Sorted arrays, not sets: missing/duplicated equal original occurrences must both fail.
        expect(returnedEvents.sort()).toEqual(originalFactoryEvents[index]!.map(identity).sort());
      }
      const islandItems = review.rows[0]!.packet.items.filter(item => item.component.id === "fact_statement" && item.component.operand.rendererId === "play.pawn_island_topology_change@1");
      const exact = original.filter(item => item.projection.id === "rules.structural.event.pawn_islands");
      expect(exact).toHaveLength(kind === "capture" ? 2 : 0); expect(islandItems).toHaveLength(exact.length);
      for (const item of exact) expect(parsePresentationReceipt(review.rows[0]!.packet).some(shown => shown.evidenceRef?.evidenceDigest === `sha256:${evidenceValueReceipt(item).payloadDigest}`)).toBe(true);
      const node = f.run.nodes.at(-1)!;
      const request = { protocol: "inspector.query_page@1" as const, assistance: analysis, query: { branchId: f.run.activeCursor.branchId, nodeId: node.id, decisionDigest: moduleDecisionStamp(f.run).digest,
        view: { kind: "source" as const, projection: "rules.structural.reading.pawn_connectivity@1" as const, context: { kind: "position" as const }, start: 0, collectionKey: null } } };
      const source = vi.spyOn(f.service, "readInspectorLocalSource");
      const value = await f.service.queryInspectorSources(f.run.id, f.principal, request, availability, new AbortController().signal);
      if (value.kind !== "page") throw new Error("Actual Inspector source refused");
      const parsed = parseInspectorQueryPage(JSON.parse(JSON.stringify(value)), { runId: f.run.id, request, fen: node.fen,
        requestedDigest: value.requestedConfigDigest, finalDigest: value.effectiveConfigDigest });
      expect(parsed.kind).toBe("page");
      const images = source.mock.results.filter(result => result.type === "return").map(result => result.value);
      expect(images.length).toBeGreaterThan(0);
      const expected = invokeEvidenceValueRoute("rules.structural.reading.pawn_connectivity@1", { fen: node.fen });
      expect(images.at(-1)!.values.map(item => item.payload)).toEqual([expected.payload]);
      expect(parsed.kind === "page" && parsed.items.length > 0).toBe(true);
      expect(JSON.stringify(f.storage.read(f.run.id)!.run)).toBe(saved);
    });
  }
  it.each([false, true])("cookie-authenticated actual query preserves selected delivery and refuses anonymous source work (mirrored=%s)", async black => {
    const { run } = postcommitChangeFixture("locked", black), storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    const identity = new IdentityService(storage, { cookieSecure: false }), handler = createRestHandler(new RunService(storage), undefined, undefined, identity);
    const response = await handler(new Request("http://localhost/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: `change-http-${black}`, password: "change-witness-http-password" }) }));
    expect(response.status).toBe(201);
    const owner = (await response.json() as { learner: { id: string } }).learner, cookie = response.headers.get("set-cookie")!.split(";")[0]!;
    storage.create(run, { learnerId: owner.id, writerId: "change-http-writer" }); const saved = JSON.stringify(storage.read(run.id)!.run);
    const capture = vi.spyOn(packets, "compileModulePacket");
    const ask = (auth: boolean) => handler(new Request(`http://localhost/runs/${run.id}/modules/query`, { method: "POST", headers: { "content-type": "application/json", ...(auth ? { cookie } : {}) },
      body: JSON.stringify({ assistance: requested, query: { timing: "post_commit", subjectNodeId: run.activeCursor.nodeId, requested: [] } }) }));
    expect((await ask(false)).status).toBe(401); expect(capture).not.toHaveBeenCalled();
    const actual = await ask(true); expect(actual.status).toBe(200);
    const value = await actual.json() as { page: Awaited<ReturnType<RunService["queryModules"]>> };
    const parsed = parseModuleQueryPage(value, { runId: run.id, subjectNodeId: run.activeCursor.nodeId, finalDigest: value.page.effectiveConfigDigest });
    expect(parsed.packets.find(packet => packet.module === "postcommit_nudge")).toBeDefined();
    for (const [request] of capture.mock.calls.filter(([request]) => request.module === "postcommit_nudge")) expect(request.evidence.filter(unchanged)).toEqual([]);
    expect(JSON.stringify(storage.read(run.id)!.run)).toBe(saved);
  });
});
