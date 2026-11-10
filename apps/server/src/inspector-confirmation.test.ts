// Genuine authenticated REST / SQLite confirmation, independent of installed chess content.
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { assistanceDigest, attachEvidence, branchPath, commitMove, compileAssistanceRequest, fork, moduleDecisionStamp, revealFeedback, rewind, serverAvailabilityFromProviders } from "@chess-tabiya/runtime";
import { historicalInspectorIntent, historicalInspectorTarget, parseInspectorAssistanceResponse } from "../../web/src/lib/historical-inspector.js";
import { DrillApi } from "../../web/src/lib/api.js";
import * as pages from "./inspector-query.js";
import { IdentityService } from "./identity.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-03T12:00:00.000Z", stores: SQLiteRunStorage[] = [];
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
async function fixture(side: "white" | "black" = "white") {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  const service = new RunService(storage), identity = new IdentityService(storage, { cookieSecure: false,
    derive: async (secret, salt) => createHash("sha256").update(salt).update(secret).digest() });
  const handler = createRestHandler(service, undefined, undefined, identity);
  const response = await handler(new Request("http://tabiya.test/auth/register", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ handle: "historical-inspector", password: "historical-inspector-password" }) }));
  expect(response.status).toBe(201);
  const cookie = response.headers.get("set-cookie")!.split(";", 1)[0]!, learner = storage.learnerByHandle("historical-inspector")!;
  const owner = { learnerId: learner.id, handle: learner.handle }, lease = { learnerId: learner.id, writerId: "historical-writer" };
  const imported = await service.importGame({ id: "historical-inspector-run", side, opponentPolicy: { mode: "human_common" },
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1,
    source: { kind: "pgn", pgn: '[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 1-0' }, createdAt: at }, lease);
  const original = revealFeedback(imported.run, at).run, branchId = original.branches[0]!.id, path = branchPath(original, branchId);
  let run = fork(rewind(original, path[2]!.id, at, undefined, branchId).run, path[2]!.id, { at }).run;
  run = commitMove(run, "f1c4", { at }).run; storage.save(run, lease);
  const assistance = compileAssistanceRequest({ contextHint: "imported", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
  const target = (nodeId = path[0]!.id) => ({ branchId, nodeId, decisionDigest: moduleDecisionStamp(run).digest });
  const call = (body: unknown, signal?: AbortSignal, authenticated = true) => handler(new Request(`http://tabiya.test/runs/${run.id}/assistance`, {
    method: "POST", headers: { "content-type": "application/json", ...(authenticated ? { cookie } : {}) }, body: JSON.stringify(body), ...(signal === undefined ? {} : { signal }) }));
  return { run, path, branchId, assistance, storage, service, owner, lease, call, target, cookie, handler };
}

describe("historical Inspector source-free confirmation", () => {
  it.each(["white", "black"] as const)("confirms genuine root, nonroot and shared-prefix history for %s while active retry is closed", async side => {
    const f = await fixture(side), before = JSON.stringify(f.storage.read(f.run.id));
    const acquire = vi.spyOn(f.service, "acquireInspectorQuerySource"), compiler = vi.spyOn(pages, "compileInspectorSourcePage");
    for (const node of [f.path[0]!, f.path[2]!, f.path[3]!]) {
      const response = await f.call({ assistance: f.assistance, inspector: f.target(node.id) }), body = await response.json();
      expect(response.status).toBe(200);
      expect(Object.keys(body).sort()).toEqual(["assistance", "inspector"]);
      expect(body.inspector).toEqual({ runId: f.run.id, branchId: f.branchId, nodeId: node.id, fen: node.fen, decision: moduleDecisionStamp(f.run) });
      expect(body.inspector.branchId).not.toBe(body.inspector.decision.cursor.branchId);
      expect(body.assistance).toMatchObject({ stage: "finalized", context: "imported", requestedDigest: f.assistance.requestDigest });
      expect(body.assistance.effects).toContainEqual({ effectId: "full_inspector:review:explicit_mode", moduleId: "full_inspector", timing: "review", arm: "explicit_mode" });
      expect(JSON.stringify(body)).not.toMatch(/"(?:nodes|events|evidence|movesUci|providerLineDelivery)":/u);
    }
    const inherited = await f.call({ assistance: f.assistance, inspector: { ...f.target(f.path[0]!.id), branchId: f.run.activeCursor.branchId } });
    // Current retry disclosure still refuses even though the root itself is inherited.
    expect(inherited.status).toBe(409);
    expect(acquire).not.toHaveBeenCalled(); expect(compiler).not.toHaveBeenCalled();
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
  });

  it.each(["extra", "combined", "target-extra", "stale", "off-branch", "wrong-context", "quiet", "bad-intent"])("refuses %s before source work", async kind => {
    const f = await fixture(), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource");
    const body: any = { assistance: f.assistance, inspector: f.target() };
    if (kind === "extra") body.fen = f.path[0]!.fen;
    if (kind === "combined") body.review = { ...body.inspector, entryNodeId: f.path[0]!.id };
    if (kind === "target-extra") body.inspector.role = "writer";
    if (kind === "stale") body.inspector.decisionDigest = `sha256:${"0".repeat(64)}`;
    if (kind === "off-branch") body.inspector.nodeId = f.run.activeCursor.nodeId;
    if (kind === "bad-intent") body.assistance = {};
    if (kind === "wrong-context" || kind === "quiet") body.assistance = compileAssistanceRequest({ contextHint: kind === "wrong-context" ? "position" : "imported",
      preference: { kind: "explicit", preset: kind === "quiet" ? "quiet" : "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
    const response = await f.call(body), result = await response.json();
    expect([400, 409, 503]).toContain(response.status);
    expect(["INVALID_REQUEST", "CONTEXT_MISMATCH", "ASSISTANCE_WITHHELD", "EVIDENCE_UNAVAILABLE"]).toContain(result.error.code);
    expect(acquire).not.toHaveBeenCalled();
  });

  it("does not execute target or nested intent getters", async () => {
    const f = await fixture(), get = vi.fn(() => f.assistance.preference);
    const intent = { ...f.assistance }; Object.defineProperty(intent, "preference", { enumerable: true, get });
    expect(() => f.service.confirmRecordedInspectorAssistance(f.run.id, f.owner, { assistance: intent, inspector: f.target() }, availability, new AbortController().signal)).toThrow();
    const inspector = { ...f.target() }; Object.defineProperty(inspector, "nodeId", { enumerable: true, get });
    expect(() => f.service.confirmRecordedInspectorAssistance(f.run.id, f.owner, { assistance: f.assistance, inspector }, availability, new AbortController().signal)).toThrow();
    expect(get).not.toHaveBeenCalled();
  });

  it("preserves authentication, cancellation and ordinary active assistance", async () => {
    const f = await fixture(), body = { assistance: f.assistance, inspector: f.target() };
    const before = await (await f.call(f.assistance)).json();
    expect((await f.call(body, undefined, false)).status).toBe(401);
    const controller = new AbortController(), reason = new DOMException("Historical target retired", "AbortError"); controller.abort(reason);
    await expect(f.call(body, controller.signal)).rejects.toBe(reason);
    const ordinary = await f.call(f.assistance), current = await ordinary.json();
    expect(ordinary.status).toBe(200); expect(Object.keys(current)).toEqual(["assistance"]);
    expect(current).toEqual(before);
  });

  it("D4057 also requires a typed wrong-workflow refusal from the original recorded Analyze arm", async () => {
    const f = await fixture(), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource");
    const assistance = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
    const response = await f.call({ assistance, review: { ...f.target(f.path[1]!.id), entryNodeId: f.path[0]!.id } });
    expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ error: { code: "INVALID_REQUEST" } });
    expect(acquire).not.toHaveBeenCalled();
  });

  it("real browser API transport confirms an old root and its strict receiver retains the actual current decision", async () => {
    const f = await fixture(), calls: Request[] = [];
    const api = new DrillApi("http://tabiya.test", async (input, init) => {
      const headers = new Headers(init?.headers); headers.set("cookie", f.cookie);
      const request = new Request(input, { ...init, headers }); calls.push(request); return f.handler(request);
    });
    const target = historicalInspectorTarget(f.run, f.branchId, f.path[0]!.id, "imported"), assistance = historicalInspectorIntent(target);
    const raw = await api.inspectorAssistance(f.run.id, { assistance, inspector: f.target() });
    expect(parseInspectorAssistanceResponse(raw, target, assistance).requestedDigest).toBe(assistance.requestDigest);
    expect(calls).toHaveLength(1); expect(calls[0]!.url).toBe(`http://tabiya.test/runs/${f.run.id}/assistance`);
    expect(target.decision.cursor.nodeId).not.toBe(target.nodeId);
  });

  it.each(["target", "fen", "decision", "context", "requested", "outer", "help", "config", "permission", "effect", "effect-forge", "effect-subset", "effect-missing", "effect-duplicate", "module-missing", "hint", "authority", "campaign", "campaign-wrong-context", "suppression", "suppression-field", "getter", "hidden", "symbol", "prototype", "cycle"])("strict receiver refuses %s including publicly redigested nested changes", async fault => {
    const f = await fixture(), target = historicalInspectorTarget(f.run, f.branchId, f.path[0]!.id, "imported"), intent = historicalInspectorIntent(target);
    const raw: any = await (await f.call({ assistance: intent, inspector: f.target() })).json();
    expect(() => parseInspectorAssistanceResponse(raw, target, intent)).not.toThrow();
    const get = vi.fn(() => "foreign");
    if (fault === "target") raw.inspector.nodeId = f.path[1]!.id;
    if (fault === "fen") raw.inspector.fen = f.path[1]!.fen;
    if (fault === "decision") raw.inspector.decision.cursor.nodeId = target.nodeId;
    if (fault === "context") raw.assistance.context = "position";
    if (fault === "requested") raw.assistance.requestedDigest = `sha256:${"0".repeat(64)}`;
    if (fault === "outer") raw.extra = true;
    if (fault === "help") raw.assistance.extra = true;
    if (fault === "config") raw.assistance.config.extra = true;
    if (fault === "permission") raw.assistance.permission.extra = true;
    if (fault === "effect") raw.assistance.effects[0].extra = true;
    if (fault === "effect-forge") raw.assistance.effects.find((item: any) => item.effectId === "full_inspector:review:explicit_mode").timing = "pre_commit";
    if (fault === "effect-subset") delete raw.assistance.effects.find((item: any) => item.subSurface === "raw_corpus").subSurface;
    if (fault === "effect-missing") raw.assistance.effects = raw.assistance.effects.filter((item: any) => item.effectId !== "full_inspector:review:explicit_mode");
    if (fault === "effect-duplicate") raw.assistance.effects.push({ ...raw.assistance.effects[0] });
    if (fault === "module-missing") raw.assistance.modules = raw.assistance.modules.filter((id: string) => id !== "full_inspector");
    if (fault === "hint") raw.assistance.hintCeiling.extra = true;
    if (fault === "authority") raw.assistance.sourceAuthority.extra = true;
    if (fault === "campaign") raw.assistance.campaignReceipt = { receiptDigest: `sha256:${"0".repeat(64)}`, inventoryEventSeq: 1, phase: "active", extra: true };
    if (fault === "campaign-wrong-context") raw.assistance.campaignReceipt = { receiptDigest: `sha256:${"0".repeat(64)}`, inventoryEventSeq: 1, phase: "active" };
    if (fault === "suppression") raw.assistance.suppressed = [{ kind: "preference_recovery", reason: "malformed", extra: true }];
    if (fault === "suppression-field") raw.assistance.suppressed = [{ kind: "field", field: "guided", requested: "live", effective: "off", by: "context_ceiling", reason: "context_clamped_field", extra: true }];
    const { finalDigest: _old, ...body } = raw.assistance; raw.assistance.finalDigest = assistanceDigest(body);
    if (fault === "getter") Object.defineProperty(raw.assistance.effects[0], "timing", { enumerable: true, get });
    if (fault === "hidden") Object.defineProperty(raw.assistance, "hidden", { value: true });
    if (fault === "symbol") raw.assistance[Symbol("hidden")] = true;
    if (fault === "prototype") Object.setPrototypeOf(raw.assistance, { foreign: true });
    if (fault === "cycle") raw.assistance.effects[0].loop = raw;
    expect(() => parseInspectorAssistanceResponse(raw, target, intent)).toThrow(); expect(get).not.toHaveBeenCalled();
  });

  it.each(["revoke", "role", "snapshot", "cancel"])("rechecks actual %s after the original context has been captured", async fault => {
    const f = await fixture(), reader = { learnerId: "historical-reader", handle: "historical-reader" };
    f.storage.createLearner({ id: reader.learnerId, handle: reader.handle, passwordHash: "!", createdAt: at });
    f.storage.grantRole(f.run.id, reader.learnerId, "host", f.lease, at);
    const controller = new AbortController(), original = f.service.resolveInspectorRecordedContext.bind(f.service), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource");
    vi.spyOn(f.service, "resolveInspectorRecordedContext").mockImplementationOnce((...args) => {
      const context = original(...args);
      if (fault === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
      if (fault === "role") f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, at);
      if (fault === "snapshot") f.storage.save(attachEvidence(f.run, f.path[0]!.id, ["recorded:later"], { kind: "eval", source: "engine_validated", values: { centipawns: 1 } }, at).run, f.lease);
      if (fault === "cancel") controller.abort();
      return context;
    });
    expect(() => f.service.confirmRecordedInspectorAssistance(f.run.id, reader, { assistance: f.assistance, inspector: f.target() }, availability, controller.signal)).toThrow();
    expect(acquire).not.toHaveBeenCalled();
  });
});
