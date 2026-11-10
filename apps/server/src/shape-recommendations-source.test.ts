import { attachEvidence, commitMove, createRun, fork, rewind } from "@chess-tabiya/runtime";
import { createHash } from "node:crypto";
import { projectAttempts } from "./progress.js";
import { readFileSync } from "node:fs";
import { STRUCTURAL_CONVENTION_REFS } from "@chess-tabiya/schema/drill-pack";
import { mirrorSemanticFen, mirrorSemanticUci } from "../../../packages/runtime/src/semantic-validation.js";
import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import * as execution from "../../../packages/runtime/src/evidence-binding-execution.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { DrillApi } from "../../web/src/lib/api.js";
import { progressRecommendationSentence } from "../../web/src/lib/progress-response.js";
import { IdentityService } from "./identity.js";
import { createRestHandler } from "./rest.js";
import { RepertoireService, repertoireDigest, scanRepertoire } from "./repertoire.js";
import { corpusPopulation, type CorpusSource } from "./corpus.js";
import { RegisteredShapeScanUnavailable } from "../../../packages/runtime/src/internal/registered-shape-scan.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registeredShapeFixture } from "../../../packages/runtime/src/testing/registered-shape-fixture.js";
import { ShapeRegistry } from "./shape-registry.js";
import { PackRegistry } from "./pack-registry.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-04T00:00:00.000Z", owner = { learnerId: "recommend-owner", handle: "recommend-owner" }, other = { learnerId: "recommend-other", handle: "recommend-other" };
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const storage of stores.splice(0)) storage.close(); });
function played(id: string, black = false) {
  const start = createRun({ id, session: { kind: "position", start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: black ? "black" : "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  const first = commitMove(start, "g1f3", { actor: black ? "system" : "user", at }).run;
  return black ? commitMove(first, "g8f6", { at }).run : first;
}
async function fixture(black = false) {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  for (const user of [owner, other]) storage.createLearner({ id: user.learnerId, handle: user.handle, passwordHash: "!", createdAt: at });
  const shapes = new ShapeRegistry(); await shapes.add(registeredShapeFixture(undefined, black), "community", "mechanical-author");
  const packs = await PackRegistry.fromDocuments([]);
  const service = new RunService(storage, { progressStorage: storage, shapeRegistry: shapes, packRegistry: packs });
  return { storage, shapes, packs, service };
}

function deferred() { let resolve!: () => void; const promise = new Promise<void>(done => { resolve = done; }); return { promise, resolve }; }
async function httpFixture(corpus?: CorpusSource) {
  const f = await fixture(); let now = new Date(at);
  const identity = new IdentityService(f.storage, { cookieSecure: false, now: () => now,
    derive: async (secret, salt) => createHash("sha256").update(salt).update(secret).digest() });
  const session = await identity.register({ handle: "recommend-auth", password: "recommend-password" });
  const principal = { learnerId: session.learner.id, handle: session.learner.handle }, run = played("http-owned");
  f.storage.create(run, { learnerId: principal.learnerId, writerId: "http-writer" });
  const repertoires = new RepertoireService(f.storage, f.service, corpus);
  const args: Parameters<typeof createRestHandler> = [f.service, undefined, undefined, identity]; args[11] = repertoires;
  const handler = createRestHandler(...args), cookie = session.cookie.split(";", 1)[0]!;
  const request = (authenticated = true, signal?: AbortSignal) => handler(new Request("http://tabiya.test/progress/recommendations", { headers: authenticated ? { cookie } : {}, ...(signal === undefined ? {} : { signal }) }));
  return { ...f, identity, principal, run, repertoires, handler, request, cookie, expire() { now = new Date(now.getTime() + 31 * 86400000); } };
}
async function rootGap(f: Awaited<ReturnType<typeof httpFixture>>) {
  const rootFen = f.run.start.fen, record = { id: "repertoire-before-await", ownerLearnerId: f.principal.learnerId, name: "Unanswered root", side: "white" as const,
    rootFen, targetElo: 1600, coverageDenominator: 10, sourceKind: "pgn_paste" as const, sourceUrl: null, originalPgn: "*", licenceNote: "Synthetic learner storage fixture",
    digest: repertoireDigest("white", rootFen, []), createdAt: at, updatedAt: at };
  f.storage.createRepertoire(record, []);
  const scan = await scanRepertoire(record, [], { stats: async () => { throw new Error("Root gap must not query a provider"); } }, new Date(at));
  f.storage.saveRepertoireScan(scan); expect(f.repertoires.recommendations(f.principal).recommendations).toHaveLength(1);
  return record;
}

describe("D4089 owned complete registered-shape recommendations", () => {
  it("D4099 independently excludes a current rank0 answer even when a stored old gap falsely claims the current digest", async () => {
    const f = await httpFixture(), record = await rootGap(f), scan = f.storage.repertoireScan(record.id)!;
    const key = (scan.gaps as { key: string }[])[0]!.key;
    const updated = f.repertoires.chooseAnswer(record.id, f.principal, { positionKey: key, moveUci: "e2e4", ifMatch: record.digest }, at);
    expect(f.storage.repertoireGapRun(record.id, key)).toBeUndefined();
    // An intentionally inconsistent stored scan isolates the answer guard from the stale guard.
    f.storage.saveRepertoireScan({ ...scan, repertoireDigest: updated.digest });
    const original = JSON.stringify(f.storage.repertoireScan(record.id));
    expect(f.repertoires.recommendations(f.principal)).toEqual({ recommendations: [], total: 0 });
    const response = await f.request(); expect(response.status).toBe(200);
    const body = await response.json() as { recommendations: { kind: string }[] };
    expect(body.recommendations.filter(row => row.kind === "repertoire_gap")).toEqual([]);
    expect(JSON.stringify(f.storage.repertoireScan(record.id))).toBe(original);
  });

  it("D4099 stops recommending an answered or stale scan without entering a gap run, and only explicit rescan restores current gaps", async () => {
    const start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const stats = vi.fn<CorpusSource["stats"]>(async query => {
      const { fen, ...window } = query, population = { ...corpusPopulation(1600), ...window };
      if (fen !== start) return { kind: "abstention", reason: "no_data_at_band", detail: "No further fixture population", population };
      return { kind: "stats", total: 1000, white: 500, draws: 200, black: 300, population, recency: { kind: "absent" },
        moves: [
          { san: "e4", uci: "e2e4", playedCount: 500, sharePct: 50, white: 250, draws: 100, black: 150 },
          { san: "c4", uci: "c2c4", playedCount: 300, sharePct: 30, white: 150, draws: 60, black: 90 },
          { san: "d4", uci: "d2d4", playedCount: 200, sharePct: 20, white: 100, draws: 40, black: 60 },
        ] };
    });
    const f = await httpFixture({ stats }), api = new DrillApi("http://tabiya.test", (input, init) => {
      const headers = new Headers(init?.headers); headers.set("cookie", f.cookie);
      return f.handler(new Request(input, { ...init, headers }));
    });
    const repertoire = await api.createRepertoire({ name: "Current black answers", side: "black", targetElo: 1600,
      coverageDenominator: 10, source: { kind: "pgn", pgn: "1. d4 d5 *" } });
    await api.scanRepertoire(repertoire.id); await f.repertoires.waitForScan(repertoire.id);
    const before = await api.recommendations(), gaps = before.recommendations.filter(row => row.kind === "repertoire_gap");
    expect(gaps).toHaveLength(2);
    const chosen = gaps.find(row => row.replySan === "e4")!;
    const scanBefore = JSON.stringify(f.storage.repertoireScan(repertoire.id));
    expect(f.storage.repertoireGapRun(repertoire.id, chosen.gapKey)).toBeUndefined();
    const updated = await api.chooseRepertoireAnswer(repertoire.id, { positionKey: chosen.gapKey, moveUci: "e7e5", ifMatch: repertoire.digest });
    const stale = await api.repertoireGaps(repertoire.id);
    expect(stale.stale).toBe(true); expect(stale.scan?.gaps.find(row => row.key === chosen.gapKey)?.state).toBe("answered");
    const calls = stats.mock.calls.length, runBefore = JSON.stringify(f.storage.read(f.run.id));
    const after = await api.recommendations();
    expect(after.recommendations.filter(row => row.kind === "repertoire_gap")).toEqual([]);
    expect(after.selection.total).toBe(before.selection.total - gaps.length);
    expect(stats).toHaveBeenCalledTimes(calls); expect(JSON.stringify(f.storage.repertoireScan(repertoire.id))).toBe(scanBefore);
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(runBefore);
    await api.scanRepertoire(repertoire.id); await f.repertoires.waitForScan(repertoire.id);
    const rescanned = await api.recommendations();
    expect(rescanned.recommendations.filter(row => row.kind === "repertoire_gap").map(row => row.replySan)).toEqual(["c4"]);
    expect(f.storage.repertoireScan(repertoire.id)!.repertoireDigest).toBe(updated.digest);
  });

  it("D4104 keeps actual root-gap server/client copy equal and distinct from sampled reply frequency", async () => {
    const f = await httpFixture(), record = await rootGap(f);
    const server = f.repertoires.recommendations(f.principal).recommendations[0]!;
    const api = new DrillApi("http://tabiya.test", (input, init) => f.handler(new Request(String(input), { ...init, headers: { cookie: f.cookie } })));
    const page = await api.recommendations(), root = page.recommendations.find(item => item.kind === "repertoire_gap")!;
    expect(root).toMatchObject({ repertoireId: record.id, replySan: "", line: [], gamesUntilSeen: 1 });
    expect(progressRecommendationSentence(root)).toBe(server.sentence);
    expect(server.sentence).toContain("has no answer recorded at its starting position.");
    expect(server.sentence).not.toMatch(/population reached|once every|after ;/u);
    expect(server.sentence).toContain("These counts say what this population played, not what is good");
  });
  it("counts owned runs once each and excludes real readable shared-host grants", async () => {
    const f = await fixture(), own = played("owned-encounter"), shared = played("shared-encounter");
    const ownLease = { learnerId: owner.learnerId, writerId: "owned-writer" }, sharedLease = { learnerId: other.learnerId, writerId: "other-writer" };
    const branched = commitMove(fork(rewind(own, own.nodes[0]!.id, at).run, own.nodes[0]!.id, { at }).run, "g1f3", { at }).run;
    f.storage.create(branched, ownLease); f.storage.create(shared, sharedLease);
    f.storage.grantRole(shared.id, owner.learnerId, "host", sharedLease, at);
    expect(f.storage.list(owner.learnerId, 100, 0).map(run => run.id).sort()).toEqual([own.id, shared.id].sort());
    const begin = vi.spyOn(f.shapes, "beginCurrentShapeScan"), before = [branched, shared].map(run => JSON.stringify(f.storage.read(run.id)));
    const page = await f.service.shapeRecommendations(owner);
    expect(page.total).toBe(1);
    expect(page.recommendations).toMatchObject([{ shapeId: registeredShapeFixture().id, runCount: 1, runIds: [own.id], packIds: [] }]);
    expect(begin).toHaveBeenCalledTimes(branched.branches.length);
    expect([branched, shared].map(run => JSON.stringify(f.storage.read(run.id)))).toEqual(before);
  });
  it("requires real configured sources rather than presenting an invented empty contribution", async () => {
    const f = await fixture(), service = new RunService(f.storage);
    await expect(Promise.resolve().then(() => service.shapeRecommendations(owner))).rejects.toMatchObject({ code: "EVIDENCE_UNAVAILABLE" });
  });
  it("D4098 never merges a deleted pre-await repertoire into the real authenticated response", async () => {
    const f = await httpFixture(), record = await rootGap(f), entered = deferred(), release = deferred();
    const begin = f.shapes.beginCurrentShapeScan.bind(f.shapes);
    vi.spyOn(f.shapes, "beginCurrentShapeScan").mockImplementation(async (...args) => { const builder = await begin(...args); entered.resolve(); await release.promise; return builder; });
    const pending = f.request(); await entered.promise;
    try { f.repertoires.remove(record.id, f.principal); } finally { release.resolve(); }
    const response = await pending; expect(response.status).toBe(200);
    const page = await response.json() as { recommendations: {kind:string}[]; selection: {shown:number;total:number} };
    expect(page.recommendations.map(row => row.kind)).toEqual(["shape_encounter"]);
    expect(page.selection).toEqual({ shown: 1, total: 1 });
  });

  it("keeps distinct-owned-run counts, count-descending/id ties, and total before the ten-item limit", async () => {
    const f = await fixture(), first = commitMove(played("count-first"), "a7a6", { actor: "system", at }).run, second = played("count-second");
    for (const run of [first, second]) f.storage.create(run, { learnerId: owner.learnerId, writerId: run.id });
    for (let index = 0; index < 11; index++) await f.shapes.add(registeredShapeFixture(`match-${String(index).padStart(2, "0")}`), "community", "mechanical-author");
    await f.shapes.add({ ...registeredShapeFixture("aaa-fewer"), trigger: { kind: "pieceOnSquare", square: "a6", piece: { color: "black", role: "pawn" } } }, "community", "mechanical-author");
    const page = await f.service.shapeRecommendations(owner), ids = [registeredShapeFixture().id, ...Array.from({ length: 11 }, (_, i) => `match-${String(i).padStart(2, "0")}`)].sort();
    expect(page.total).toBe(13); expect(page.recommendations.map(item => item.shapeId)).toEqual(ids.slice(0, 10));
    expect(page.recommendations.every(item => item.runCount === 2 && item.runIds.join() === [first.id, second.id].sort().join())).toBe(true);
  });
  it("retains an actually installed empty registry as a valid empty contribution", async () => {
    const f = await fixture(); f.storage.create(played("empty-source-run"), { learnerId: owner.learnerId, writerId: "writer" });
    const shapes = new ShapeRegistry(), service = new RunService(f.storage, { shapeRegistry: shapes, packRegistry: f.packs, progressStorage: f.storage });
    const begin = vi.spyOn(shapes, "beginCurrentShapeScan");
    expect(await service.shapeRecommendations(owner)).toEqual({ recommendations: [], total: 0 }); expect(begin).toHaveBeenCalledTimes(1);
  });
  it.each(["head", "branch", "new-run", "delete-run", "attempt", "account", "abort"] as const)("retires a real %s change after an incomplete source chunk before any firing mint", async fault => {
    const f = await fixture(), run = played("chunk-owned"), lease = { learnerId: owner.learnerId, writerId: "chunk-writer" };
    f.storage.create(run, lease); const controller = new AbortController();
    for (let i = 0; i < 17; i++) await f.shapes.add(registeredShapeFixture(`chunk-${i}`), "community", "mechanical-author");
    const advance = f.shapes.advanceCurrentShapeScan.bind(f.shapes), mint = vi.spyOn(routes, "invokeEvidenceValueRoute"); let changed = false;
    vi.spyOn(f.shapes, "advanceCurrentShapeScan").mockImplementation(builder => {
      const step = advance(builder);
      if (!changed && step.kind === "incomplete") {
        changed = true;
        if (fault === "head") f.storage.save(attachEvidence(run, run.activeCursor.nodeId, ["synthetic:changed-head"], { kind: "eval", source: "engine_validated", values: { centipawns: 1 } }, at).run, lease);
        if (fault === "branch") f.storage.save(commitMove(fork(rewind(run, run.nodes[0]!.id, at).run, run.nodes[0]!.id, { at }).run, "b1c3", { at }).run, lease);
        if (fault === "new-run") f.storage.create(played("new-owned"), { learnerId: owner.learnerId, writerId: "new-writer" });
        if (fault === "delete-run") { const preview = f.storage.deletionPreview(owner.learnerId, { kind: "run", runId: run.id }, at); f.storage.deleteOwnedRun(owner.learnerId, run.id, at, preview.digest); }
        if (fault === "attempt") { const projected = projectAttempts({ run, learnerId: owner.learnerId }); f.storage.upsertAttempts(projected.attempts, projected.conceptTags); }
        if (fault === "account") { const preview = f.storage.deletionPreview(owner.learnerId, { kind: "account" }, at); f.storage.deleteLearner(owner.learnerId, at, preview.digest); }
        if (fault === "abort") controller.abort();
      }
      return step;
    });
    await expect(f.service.shapeRecommendations(owner, controller.signal)).rejects.toThrow(); expect(changed).toBe(true);
    expect(mint.mock.calls.filter(([route]) => route === "theory.shapes.firing@3")).toEqual([]);
  });
  it.each(["registry", "pack"] as const)("retires an actual same-byte %s record replacement during owned capture", async fault => {
    const f = await fixture(), run = played("replace-owned"); f.storage.create(run, { learnerId: owner.learnerId, writerId: "writer" });
    const document = withDerivedRequires(JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8")));
    const digest = await digestDrillPack(document); f.packs.addCommunity(document, digest, "mechanical-author");
    const begin = f.shapes.beginCurrentShapeScan.bind(f.shapes); let changed = false;
    vi.spyOn(f.shapes, "beginCurrentShapeScan").mockImplementation(async (...args) => {
      const builder = await begin(...args);
      if (!changed) {
        changed = true;
        if (fault === "registry") { const record = f.shapes.required(registeredShapeFixture().id); await f.shapes.add(record.document, "community", "mechanical-author", record.digest); }
        else f.packs.addCommunity(document, digest, "mechanical-author");
      }
      return builder;
    });
    await expect(f.service.shapeRecommendations(owner)).rejects.toMatchObject({ code: "EVIDENCE_UNAVAILABLE" }); expect(changed).toBe(true);
  });
  it("refuses the whole page if a later branch dependency fails after an earlier real match", async () => {
    const f = await fixture(); for (const id of ["earlier", "later"]) f.storage.create(played(id), { learnerId: owner.learnerId, writerId: id });
    const advance = f.shapes.advanceCurrentShapeScan.bind(f.shapes), mint = vi.spyOn(routes, "invokeEvidenceValueRoute");
    let firstCompleted: Parameters<typeof advance>[0] | undefined;
    vi.spyOn(f.shapes, "advanceCurrentShapeScan").mockImplementation(builder => {
      if (firstCompleted !== undefined && builder !== firstCompleted) throw new RegisteredShapeScanUnavailable();
      const step = advance(builder); if (step.kind === "complete") firstCompleted ??= builder; return step;
    });
    await expect(f.service.shapeRecommendations(owner)).rejects.toMatchObject({ code: "EVIDENCE_UNAVAILABLE" });
    expect(mint.mock.calls.filter(([route]) => route === "theory.shapes.firing@3")).toHaveLength(1);
  });
  it("captures the complete paginated population and refuses a same-count owned replacement beyond the first100 rows", async () => {
    const f = await fixture();
    for (let i = 0; i < 101; i++) { const run = played(`page-${String(i).padStart(3, "0")}`); f.storage.create(run, { learnerId: owner.learnerId, writerId: run.id }); }
    const list = vi.spyOn(f.storage, "list"), begin = f.shapes.beginCurrentShapeScan.bind(f.shapes); let changed = false;
    vi.spyOn(f.shapes, "beginCurrentShapeScan").mockImplementation(async (...args) => {
      const builder = await begin(...args);
      if (!changed) {
        expect(list).toHaveBeenCalledWith(owner.learnerId, 100, 100); changed = true;
        const last = "page-100", preview = f.storage.deletionPreview(owner.learnerId, { kind: "run", runId: last }, at);
        f.storage.deleteOwnedRun(owner.learnerId, last, at, preview.digest);
        f.storage.create(played("page-replacement"), { learnerId: owner.learnerId, writerId: "replacement" });
        expect(f.storage.runCount(owner.learnerId)).toBe(101);
      }
      return builder;
    });
    await expect(f.service.shapeRecommendations(owner)).rejects.toMatchObject({ code: "EVIDENCE_UNAVAILABLE" }); expect(changed).toBe(true);
  });
  it("delivers the real authenticated closed recommendation DTO through DrillApi", async () => {
    const f = await httpFixture(), api = new DrillApi("http://tabiya.test", (input, init) => f.handler(new Request(String(input), { ...init, headers: { ...Object.fromEntries(new Headers(init?.headers).entries()), cookie: f.cookie } })));
    const page = await api.recommendations(); expect(page.selection).toEqual({ shown: 1, total: 1 });
    expect(page.recommendations).toEqual([{ kind: "shape_encounter", shapeId: registeredShapeFixture().id, shapeName: registeredShapeFixture().name, runCount: 1, runIds: [f.run.id], packIds: [] }]);
    const begin = vi.spyOn(f.shapes, "beginCurrentShapeScan"); expect((await f.request(false)).status).toBe(401); expect(begin).not.toHaveBeenCalled();
  });
  it.each(["logout", "expiry", "abort"] as const)("actual HTTP %s during a held original scan cannot publish a page", async fault => {
    const f = await httpFixture(), entered = deferred(), release = deferred(), controller = new AbortController(), begin = f.shapes.beginCurrentShapeScan.bind(f.shapes);
    vi.spyOn(f.shapes, "beginCurrentShapeScan").mockImplementation(async (...args) => { const builder = await begin(...args); entered.resolve(); await release.promise; return builder; });
    const pending = f.request(true, controller.signal).then(response => ({ kind: "response" as const, response }), error => ({ kind: "error" as const, error })); await entered.promise;
    try { if (fault === "logout") f.identity.logout(f.cookie); if (fault === "expiry") f.expire(); if (fault === "abort") controller.abort(); } finally { release.resolve(); }
    const result = await pending;
    if (fault === "abort") { expect(result.kind).toBe("error"); if (result.kind === "error") expect(result.error.name).toBe("AbortError"); }
    else { expect(result.kind).toBe("response"); if (result.kind === "response") { expect(result.response.status).toBe(401); expect(await result.response.json()).not.toHaveProperty("recommendations"); } }
  });
  it("never returns a repertoire-only successful merge when a later shape dependency is unavailable", async () => {
    const f = await httpFixture(); await rootGap(f);
    vi.spyOn(f.shapes, "advanceCurrentShapeScan").mockImplementation(() => { throw new RegisteredShapeScanUnavailable(); });
    const response = await f.request(); expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "EVIDENCE_UNAVAILABLE" } });
  });

  it("the authenticated endpoint excludes even a real shared-host run from another account", async () => {
    const f = await httpFixture(), guest = await f.identity.register({ handle: "recommend-guest", password: "recommend-guest-password" });
    f.storage.grantRole(f.run.id, guest.learner.id, "host", { learnerId: f.principal.learnerId, writerId: "http-writer" }, at);
    expect(f.storage.list(guest.learner.id, 100, 0).map(row => row.id)).toEqual([f.run.id]);
    const response = await f.handler(new Request("http://tabiya.test/progress/recommendations", { headers: { cookie: guest.cookie.split(";", 1)[0]! } }));
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ recommendations: [], selection: { shown: 0, total: 0 } });
  });
  it.each(["missing", "installed-empty"] as const)("actual HTTP %s shape source cannot invent a successful shape contribution", async source => {
    const f = await httpFixture(); await rootGap(f);
    const service = new RunService(f.storage, source === "missing" ? {} : { shapeRegistry: new ShapeRegistry(), packRegistry: f.packs, progressStorage: f.storage });
    const args: Parameters<typeof createRestHandler> = [service, undefined, undefined, f.identity]; args[11] = f.repertoires;
    const response = await createRestHandler(...args)(new Request("http://tabiya.test/progress/recommendations", { headers: { cookie: f.cookie } }));
    if (source === "missing") {
      expect(response.status).toBe(503); expect(await response.json()).toMatchObject({ error: { code: "EVIDENCE_UNAVAILABLE" } });
    } else {
      expect(response.status).toBe(200);
      const page = await response.json() as { recommendations: {kind:string}[]; selection: {shown:number;total:number} };
      expect(page.recommendations.map(row => row.kind)).toEqual(["repertoire_gap"]); expect(page.selection).toEqual({ shown: 1, total: 1 });
    }
  });

  it.each([false, true])("uses actual original owned paths for both learner colors, black=%s", async black => {
    const f = await fixture(black), run = played(`owned-color-${black}`, black);
    f.storage.create(run, { learnerId: owner.learnerId, writerId: "color-writer" });
    const begin = vi.spyOn(f.shapes, "beginCurrentShapeScan"), page = await f.service.shapeRecommendations(owner);
    expect(page.recommendations).toMatchObject([{ shapeId: registeredShapeFixture().id, runCount: 1, runIds: [run.id] }]);
    expect(begin.mock.calls[0]![0]).toEqual(run.nodes.map(node => ({ id: node.id, fen: node.fen })));
  });
  it("admits the complete current consumer before even registered source capture", async () => {
    const f = await fixture(), run = played("preflight-owned"); f.storage.create(run, { learnerId: owner.learnerId, writerId: "writer" });
    const capture = vi.spyOn(f.shapes, "captureRegisteredTriggers"), compile = execution.compileEvidenceConsumerExecution;
    vi.spyOn(execution, "compileEvidenceConsumerExecution").mockImplementation((manifest, consumer) => consumer.id === "theory.shape_firing" && consumer.version === 2
      ? compile({ ...manifest, bindings: manifest.bindings.filter(row => row.consumer.id !== consumer.id || row.consumer.version !== consumer.version) }, consumer)
      : compile(manifest, consumer));
    await expect(f.service.shapeRecommendations(owner)).rejects.toMatchObject({ code: "EVIDENCE_UNAVAILABLE" }); expect(capture).not.toHaveBeenCalled();
  });

  it.each([false, true])("uses current explicit-ref outpost truth while the actual absent-ref entry remains a nonmatch, black=%s", async black => {
    const f = await fixture(black), base = "7k/2p5/8/4N3/3P4/8/8/7K w - - 0 1";
    const start = createRun({ id: `recommend-outpost-${black}`, session: { kind: "position", start: { fen: black ? mirrorSemanticFen(base, "color_and_vertical") : base, side: black ? "black" : "white" },
      feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"a".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
    const run = commitMove(start, black ? mirrorSemanticUci("h1g1", "color_and_vertical") : "h1g1", { at }).run;
    f.storage.create(run, { learnerId: owner.learnerId, writerId: "outpost-writer" });
    const feature = { kind: "outpost" as const, color: black ? "black" as const : "white" as const, square: black ? "e4" as const : "e5" as const,
      conventionRef: STRUCTURAL_CONVENTION_REFS.outpost }, { conventionRef: _ref, ...legacy } = feature;
    for (const [id, selected] of [["explicit-outpost", feature], ["absent-ref-outpost", legacy]] as const) {
      await f.shapes.add({ ...registeredShapeFixture(id, black), trigger: { kind: "feature", feature: selected } }, "community", "mechanical-author");
    }
    const page = await f.service.shapeRecommendations(owner); expect(page.total).toBe(1);
    expect(page.recommendations.map(row => row.shapeId)).toEqual(["explicit-outpost"]);
  });

});
