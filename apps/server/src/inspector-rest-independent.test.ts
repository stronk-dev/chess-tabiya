// Authenticated low-level REST integration, not default app/content/deployment qualification.
import { createHash } from "node:crypto";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { compileAssistanceRequest, fork, moduleDecisionStamp, parsePresentationReceipt, revealFeedback, rewind } from "@chess-tabiya/runtime";
import { recordedInspectorRun } from "../../../packages/runtime/src/testing/recorded-inspector-fixture.js";
import { recordedSequenceWindowFixture } from "../../../packages/runtime/src/testing/recorded-sequence-window-fixture.js";
import * as evidenceRoutes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { parseInspectorDetailPayload, type InspectorDetailScope } from "../../../packages/runtime/src/inspector-detail.js";
import type { LegalExchangeBranch } from "../../../packages/runtime/src/exchange.js";
import type { InspectorQueryPage, InspectorQueryRequest, InspectorQueryView } from "../../../packages/runtime/src/inspector-query-contract.js";
import { DrillApi } from "../../web/src/lib/api.js";
import { parseInspectorQueryPage } from "../../web/src/lib/inspector-query-response.js";
import { IdentityService } from "./identity.js";
import { createHttpServer, createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-03T00:00:00.000Z", password = "independent-rest-test-password";
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
async function fixture(revealed = true, initial = recordedInspectorRun(undefined, "inspector-http-run")) {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  const service = new RunService(storage), identity = new IdentityService(storage, { cookieSecure: false,
    derive: async (secret, salt) => createHash("sha256").update(salt).update(secret).digest() });
  const handler = createRestHandler(service, undefined, undefined, identity);
  async function register(handle: string) {
    const response = await handler(new Request("http://tabiya.test/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password }) }));
    expect(response.status).toBe(201);
    return { cookie: response.headers.get("set-cookie")!.split(";", 1)[0]!, learner: storage.learnerByHandle(handle)! };
  }
  const owner = await register("inspector-http-owner"), stranger = await register("inspector-http-stranger");
  const run = revealed ? revealFeedback(initial, at).run : initial;
  storage.create(run, { writerId: "inspector-http-writer", learnerId: owner.learner.id });
  const request = (view: InspectorQueryView = { kind: "inventory", start: 0 }): InspectorQueryRequest => ({ protocol: "inspector.query_page@1",
    assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }),
    query: { branchId: run.activeCursor.branchId, nodeId: run.activeCursor.nodeId, decisionDigest: moduleDecisionStamp(run).digest, view } });
  const call = (body: unknown = request(), cookie: string | null = owner.cookie, signal?: AbortSignal) => handler(new Request(`http://tabiya.test/runs/${run.id}/inspector/query`, {
    method: "POST", headers: { "content-type": "application/json", ...(cookie === null ? {} : { cookie }) }, body: JSON.stringify(body), ...(signal === undefined ? {} : { signal }) }));
  return { storage, service, handler, run, owner, stranger, request, call };
}

describe("independent authenticated Inspector REST and client transport", () => {
  it.each([
    ["White two targets", "r3k3/3q4/1n6/2B5/8/8/8/R2RK3 w - - 0 1", "c5b6", ["a8", "d7"], "available"],
    ["Black two targets", "r2rk3/8/8/8/2b5/1N6/3Q4/R3K3 b - - 0 1", "c4b3", ["a1", "d2"], "available"],
    ["White quiet", "r3k3/8/1n6/2B5/8/8/8/4K3 w - - 0 1", "c5b6", [], "no_witness"],
    ["Black quiet", "3k4/8/8/8/5b2/6N1/8/3K3R b - - 0 1", "f4g3", [], "no_witness"],
    ["White checking", "r2k4/1B6/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6", [], "unavailable"],
    ["Black checking", "3k3r/8/8/8/5b2/6N1/6b1/4K2R b - - 0 1", "f4g3", [], "unavailable"],
  ] as const)("D4179 serves original defender exposure in factory order for %s", async (_name, fen, move, targets, kind) => {
    const f = await fixture(true, recordedSequenceWindowFixture({ fen, moves: [move] }));
    const dispatch = vi.spyOn(evidenceRoutes, "invokeEvidenceValueRoute"), before = JSON.stringify(f.storage.read(f.run.id));
    const projection = "derived.tactic.defender_exposure@2";
    const view = { kind: "source", projection, context: { kind: "incoming_edge" }, start: 0, collectionKey: null } as const;
    const read = async (body = f.request(view)) => {
      const response = await f.call(body), wire = await response.text();
      expect(response.status, wire).toBe(200);
      const page = JSON.parse(wire) as InspectorQueryPage;
      if (page.kind !== "page" || page.body.kind !== "source") throw new Error("Expected authenticated Inspector source");
      return { page, outcome: page.body.outcome };
    };
    const { page, outcome } = await read();
    const calls = dispatch.mock.calls.flatMap(([route], index) => route === projection ? [dispatch.mock.results[index]!.value] : []);
    expect(calls).toHaveLength(1);
    expect(outcome.kind).toBe(kind);
    if (outcome.kind === "available") {
      const original = calls[0] as evidenceRoutes.EvidenceValueRouteResults[typeof projection];
      if (original.kind !== "available") throw new Error("Expected available original result");
      expect(outcome).toMatchObject({ collected: targets.length, displayed: targets.length, deferred: 0 });
      expect(page.disclosure.sourceOrdinals).toEqual([0, 1]);
      const items = parsePresentationReceipt(outcome.presentation);
      expect(items.map(item => item.evidenceRef?.evidenceDigest)).toEqual(original.value.map(item => `sha256:${evidenceValueReceipt(item.evidence).payloadDigest}`));
      expect(items.map(item => {
        if (item.component.id !== "fact_statement" || item.component.operand.rendererId !== "inspector.defender_exposure@1") throw new Error("Expected bounded Inspector exposure");
        return item.component.operand.operands.target.square;
      })).toEqual(targets);
      const next = await read(f.request({ ...view, start: 1, collectionKey: outcome.collectionKey }));
      if (next.outcome.kind !== "available") throw new Error("Expected exact requested occurrence");
      expect(next.page.disclosure.sourceOrdinals).toEqual([1]);
      expect(next.page.disclosure.sourceKeys).toEqual([page.disclosure.sourceKeys[1]]);
      expect(parsePresentationReceipt(next.outcome.presentation)).toEqual(items.slice(1));
      expect(dispatch.mock.calls.filter(([route]) => route === projection)).toHaveLength(2);
    } else if (kind === "unavailable") {
      expect(outcome).toEqual({ kind, reason: "invalid_turn_clone" });
    } else {
      expect(outcome).toEqual({ kind: "no_witness" });
    }
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
  });

  it("D4179 refuses the reviewed edge at an open retry on its granted branch before acquisition", async () => {
    const original = recordedSequenceWindowFixture({ fen: "r3k3/3q4/1n6/2B5/8/8/8/R2RK3 w - - 0 1", moves: ["c5b6"] });
    const parent = original.nodes[0]!, child = original.nodes[1]!, reviewed = original.activeCursor.branchId;
    const retry = fork(rewind(original, parent.id, at).run, parent.id, { label: "open retry", at }).run;
    const f = await fixture(true, retry), dispatch = vi.spyOn(evidenceRoutes, "invokeEvidenceValueRoute");
    const projection = "derived.tactic.defender_exposure@2";
    const request = f.request({ kind: "source", projection, context: { kind: "incoming_edge" }, start: 0, collectionKey: null });
    const refused = await f.call({ ...request, query: { ...request.query, branchId: reviewed, nodeId: child.id } });
    expect(refused.status).toBe(403);
    expect(await refused.json()).toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "withheld" });
    const detailRequest = f.request({ kind: "detail", projection, context: { kind: "incoming_edge" },
      sourceKey: `sha256:${"0".repeat(64)}`, scope: { kind: "exposure_captures" }, start: 0 });
    const refusedDetail = await f.call({ ...detailRequest, query: { ...detailRequest.query, branchId: reviewed, nodeId: child.id } });
    expect(refusedDetail.status).toBe(403);
    expect(await refusedDetail.json()).toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "withheld" });
    expect(dispatch.mock.calls.filter(([route]) => route === projection)).toHaveLength(0);
    const root = await f.call(request);
    expect(root.status).toBe(200);
    expect(await root.json()).toMatchObject({ kind: "page", body: { outcome: { kind: "missing_context", reason: "no_incoming_edge" } } });
    expect(dispatch.mock.calls.filter(([route]) => route === projection)).toHaveLength(0);
  });

  it.each([false, true])("D4179 an inherited incoming edge loses its direct detail door during retry, black=%s", async black => {
    const original = recordedSequenceWindowFixture({ fen: "r3k3/3q4/1n6/2B5/8/8/8/R2RK3 w - - 0 1", moves: ["c5b6"] }, black);
    const [parent, child] = original.nodes;
    const inherited = fork(original, child!.id, { label: "inherited line", at }).run;
    const inheritedBranch = inherited.activeCursor.branchId;
    expect(inheritedBranch).not.toBe(child!.branchId);
    const available = await fixture(true, inherited);
    const projection = "derived.tactic.defender_exposure@2", context = { kind: "incoming_edge" } as const;
    const sourceView = { kind: "source", projection, context, start: 0, collectionKey: null } as const;
    const source = await available.call(available.request(sourceView));
    expect(source.status).toBe(200);
    const page = await source.json() as InspectorQueryPage;
    if (page.kind !== "page" || page.body.kind !== "source" || page.body.outcome.kind !== "available") {
      throw new Error("Expected the original exposure on the inherited branch");
    }
    const detailView = { kind: "detail", projection, context, scope: { kind: "exposure_captures" },
      sourceKey: page.body.outcome.facts[0]!.sourceKey, start: 0 } as const;
    const detail = await available.call(available.request(detailView));
    expect(detail.status).toBe(200);
    expect(await detail.json()).toMatchObject({ kind: "page", body: { kind: "detail" } });

    const retry = fork(rewind(inherited, parent!.id, at).run, parent!.id, { label: "open retry", at }).run;
    const held = await fixture(true, retry);
    const dispatch = vi.spyOn(evidenceRoutes, "invokeEvidenceValueRoute");
    for (const view of [sourceView, detailView]) {
      const request = held.request(view);
      const response = await held.call({ ...request, query: { ...request.query, branchId: inheritedBranch, nodeId: child!.id } });
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "withheld" });
    }
    expect(dispatch.mock.calls.filter(([route]) => route === projection)).toHaveLength(0);
  });

  it.each([
    ["White", "rN1rkN2/3q4/1n3n2/2B5/b5B1/8/8/R2RK3 w - - 0 1", "c5b6"],
    ["Black", "r2rk3/8/8/B5b1/2b5/1N3N2/3Q4/Rn1RKn2 b - - 0 1", "c4b3"],
  ] as const)("D4179 reconstructs every original %s exchange member from bounded Inspector REST pages", async (_side, fen, move) => {
    const f = await fixture(true, recordedSequenceWindowFixture({ fen, moves: [move] }));
    const projection = "derived.tactic.defender_exposure@2", context = { kind: "incoming_edge" } as const;
    const edge = { beforeFen: f.run.nodes[0]!.fen, moveUci: move, afterFen: f.run.nodes[1]!.fen };
    const original = evidenceRoutes.invokeEvidenceValueRoute(projection, edge);
    if (original.kind !== "available" || original.value.length !== 1) throw new Error("Expected the original stress occurrence");
    const dispatch = vi.spyOn(evidenceRoutes, "invokeEvidenceValueRoute");
    const first = await f.call(f.request({ kind: "source", projection, context, start: 0, collectionKey: null }));
    const source = await first.json() as InspectorQueryPage;
    if (source.kind !== "page" || source.body.kind !== "source" || source.body.outcome.kind !== "available") throw new Error("Expected actual exposure overview");
    const sourceKey = source.body.outcome.facts[0]!.sourceKey;
    expect(source.body.outcome.facts[0]!.detail).toBe("derived.inspector.detail.defender_exposure@1");
    let bytes = 0, largestPage = 0, detailCalls = 0;
    const detail = async (scope: InspectorDetailScope, start = 0) => {
      const request = f.request({ kind: "detail", projection, context, sourceKey, scope, start });
      const response = await f.call(request), wire = await response.text();
      expect(response.status, wire).toBe(200);
      bytes += Buffer.byteLength(wire); largestPage = Math.max(largestPage, Buffer.byteLength(wire)); detailCalls++;
      const parsed = parseInspectorQueryPage(JSON.parse(wire), { runId: f.run.id, request, fen: edge.afterFen,
        requestedDigest: source.requestedConfigDigest, finalDigest: source.effectiveConfigDigest });
      if (parsed.kind !== "page" || parsed.body.kind !== "detail" || parsed.items[0]?.component.id !== "fact_statement") throw new Error("Expected bounded detail statement");
      expect(parsed.items).toHaveLength(1);
      expect(parsed.body.range.count).toBeLessThanOrEqual(8);
      return parseInspectorDetailPayload("defender_exposure", parsed.items[0].component.operand.operands);
    };
    const { captures, controllerEvent } = original.value[0]!.evidence.payload;
    const headers = await detail({ kind: "exposure_captures" });
    expect(headers.context).toMatchObject({ ...edge, controllerEvent, captureCount: 4 });
    expect(headers.members.map(member => member.kind)).toEqual(Array(4).fill("foundation_capture_header"));
    const firstExchange = await detail({ kind: "exposure_exchange", captureIndex: 0 });
    expect(firstExchange.members.map(member => member.kind)).not.toContain("foundation_exchange_branch");
    const firstBranches = await detail({ kind: "exposure_branches", captureIndex: 0, parentPath: [] });
    expect(firstBranches.members.map(member => member.kind)).toEqual(Array(captures[0]!.branches.length).fill("foundation_exchange_branch"));
    const branch = firstBranches.members[0]!;
    if (branch.kind !== "foundation_exchange_branch") throw new Error("Expected a root recapture");
    const changed = { ...branch, value: { ...branch.value, path: [1] } };
    expect(() => parseInspectorDetailPayload("defender_exposure", { ...firstBranches, members: [changed, ...firstBranches.members.slice(1)] })).toThrow(/original edge, capture or scope/u);
    for (const scope of [{ kind: "exposure_exchange", captureIndex: 4 }, { kind: "exposure_branches", captureIndex: 0, parentPath: [999] }] as const) {
      const invalid = await f.call(f.request({ kind: "detail", projection, context, sourceKey, scope, start: 0 }));
      expect(invalid.status).toBe(422);
      expect(await invalid.json()).toMatchObject({ kind: "refused", code: "invalid_request" });
    }
    let current = await detail({ kind: "whole" });
    const members = [...current.members];
    while (current.range.next !== null) {
      current = await detail({ kind: "whole" }, current.range.next);
      members.push(...current.members);
    }
    expect(members.map(member => member.sourceOrdinal)).toEqual(members.map((_, index) => index));
    expect(members.filter(member => member.kind === "foundation_exchange_branch")).toHaveLength(696);
    for (const [captureIndex, capture] of captures.entries()) {
      const group = members.filter(member => member.value.captureIndex === captureIndex);
      const header = group.find(member => member.kind === "foundation_capture_header");
      if (header?.kind !== "foundation_capture_header") throw new Error("Original capture header missing");
      const { branchCount, chosenLineCount, stopDecisionCount, captureIndex: _ordinal, ...fields } = header.value;
      const branches = new Map(group.flatMap(member => member.kind === "foundation_exchange_branch" ? [[member.value.path.join("."), member.value] as const] : []));
      const branchAt = (path: readonly number[]): LegalExchangeBranch => {
        const { step, resultUnits, chosen, continuationCount } = branches.get(path.join("."))!;
        return { step, resultUnits, chosen, continuation: Array.from({ length: continuationCount }, (_, index) => branchAt([...path, index])) };
      };
      const chosenLine = group.flatMap(member => member.kind === "foundation_exchange_chosen" ? [member.value.step] : []);
      const stopDecisions = group.flatMap(member => member.kind === "foundation_exchange_stop"
        ? [{ ply: member.value.ply, color: member.value.color, stopped: member.value.stopped }] : []);
      expect(chosenLine).toHaveLength(chosenLineCount);
      expect(stopDecisions).toHaveLength(stopDecisionCount);
      expect({ ...fields, chosenLine, stopDecisions, branches: Array.from({ length: branchCount }, (_, index) => branchAt([index])) }).toEqual(capture);
    }
    const leaf = members.find(member => member.kind === "foundation_exchange_branch" && member.value.continuationCount === 0);
    if (leaf?.kind !== "foundation_exchange_branch") throw new Error("Expected a genuine leaf");
    const leafScope = { kind: "exposure_branches", captureIndex: leaf.value.captureIndex, parentPath: leaf.value.path } as const;
    expect((await detail(leafScope)).range).toEqual({ start: 0, count: 0, total: 0, next: null });
    const invalidLeafStart = await f.call(f.request({ kind: "detail", projection, context, sourceKey, scope: leafScope, start: 1 }));
    expect(invalidLeafStart.status).toBe(422);
    expect(dispatch.mock.calls.filter(([route]) => route === projection)).toHaveLength(detailCalls + 4);
    expect(largestPage).toBeLessThan(Buffer.byteLength(JSON.stringify(original.value[0]!.evidence.payload)));
    expect(bytes).toBeGreaterThan(largestPage);
  }, 30_000);

  it("uses real auth and returns a lazy inventory without changing persisted run bytes", async () => {
    const f = await fixture(), before = JSON.stringify(f.storage.read(f.run.id)), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource");
    const response = await f.call(), body = await response.json() as InspectorQueryPage;
    expect(response.status).toBe(200); expect(body.kind).toBe("page");
    if (body.kind !== "page" || body.body.kind !== "inventory") throw new Error("Expected actual authenticated inventory");
    expect(body.body.range).toEqual({ start: 0, count: 8, total: 89, next: 8 });
    expect(body.body.topics.every(topic => topic.state === "not_requested")).toBe(true);
    expect(acquire).not.toHaveBeenCalled(); expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
    const anonymous = await f.call(f.request(), null);
    expect(anonymous.status).toBe(401); expect(await anonymous.json()).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
    const foreign = await f.call(f.request(), f.stranger.cookie);
    expect(foreign.status).toBe(404); expect(await foreign.json()).toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "not_found" });
  });

  it("delivers an actual registered source presentation directly, not a modules/query envelope", async () => {
    const f = await fixture(), before = JSON.stringify(f.storage.read(f.run.id));
    const response = await f.call(f.request({ kind: "source", projection: "rules.castling.reading.rights@1", context: { kind: "position" }, start: 0, collectionKey: null }));
    const bytes = await response.text(), body = JSON.parse(bytes) as InspectorQueryPage;
    expect(response.status, bytes).toBe(200); expect(body.kind).toBe("page");
    expect(body).not.toHaveProperty("page");
    if (body.kind !== "page" || body.body.kind !== "source" || body.body.outcome.kind !== "available") throw new Error("Expected actual available source page");
    expect(body.body.outcome.collected).toBe(1); expect(body.body.outcome.displayed).toBe(1);
    expect(parsePresentationReceipt(body.body.outcome.presentation).length).toBeGreaterThan(0);
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
  });

  it("preserves closed invalid/stale/unsupported refusals and their exact HTTP status", async () => {
    const f = await fixture(), before = JSON.stringify(f.storage.read(f.run.id)), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource");
    const stale = f.request(), wrongVersion = { ...f.request(), protocol: "inspector.query_page@999" };
    const cases = [{ value: {}, status: 422, code: "invalid_request" }, { value: { ...stale, query: { ...stale.query, decisionDigest: `sha256:${"0".repeat(64)}` } }, status: 409, code: "stale" },
      { value: wrongVersion, status: 422, code: "unsupported_version" }];
    for (const test of cases) {
      const response = await f.call(test.value); expect(response.status).toBe(test.status);
      expect(await response.json()).toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: test.code });
    }
    expect(acquire).not.toHaveBeenCalled(); expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
  });

  it("returns exact403 closed withheld for an authenticated unrevealed owned run", async () => {
    const f = await fixture(false), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource"), response = await f.call();
    expect(response.status).toBe(403); expect(await response.json()).toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "withheld" });
    expect(acquire).not.toHaveBeenCalled();
  });

  it("preserves actual successful and non2xx closed response bodies through DrillApi.inspector", async () => {
    const f = await fixture(), controller = new AbortController(), seen: Request[] = [];
    const api = new DrillApi("http://tabiya.test", async (input, init) => {
      const headers = new Headers(init?.headers); headers.set("cookie", f.owner.cookie);
      const request = new Request(String(input), { ...init, headers }); seen.push(request);
      expect(request.signal.aborted).toBe(controller.signal.aborted);
      return f.handler(request);
    });
    const ok = await api.inspector(f.run.id, f.request(), controller.signal);
    expect(ok).toMatchObject({ protocol: "inspector.query_page@1", kind: "page", body: { kind: "inventory" } });
    const original = f.request(), stale = { ...original, query: { ...original.query, decisionDigest: `sha256:${"0".repeat(64)}` } };
    expect(await api.inspector(f.run.id, stale, controller.signal)).toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "stale" });
    expect(seen.every(request => request.method === "POST" && request.url.endsWith("/inspector/query"))).toBe(true);
    controller.abort();
    const acquire = vi.spyOn(f.service, "acquireInspectorQuerySource");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(api.inspector(f.run.id, f.request(), controller.signal)).rejects.toBeInstanceOf(Error);
    expect(seen.at(-1)!.signal.aborted).toBe(true); expect(acquire).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it("rejects a cancelled Request with its actual reason before authentication or route work", async () => {
    const f = await fixture(), controller = new AbortController(), reason = new Error("cancelled by caller");
    const query = vi.spyOn(f.service, "queryInspectorSources"), log = vi.spyOn(console, "error").mockImplementation(() => {});
    controller.abort(reason);
    await expect(f.call(f.request(), null, controller.signal)).rejects.toBe(reason);
    expect(query).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled();
  });

  it("does not turn cancellation during source acquisition into an internal-error response", async () => {
    const f = await fixture(), controller = new AbortController(), reason = new Error("retired inspector request");
    let entered!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    vi.spyOn(f.service, "queryInspectorSources").mockImplementation(async (_run, _principal, _value, _availability, signal) => {
      entered();
      await new Promise<void>((_resolve, reject) => signal!.addEventListener("abort", () => reject(signal!.reason), { once: true }));
      throw new Error("unreachable");
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {}), pending = f.call(f.request(), f.owner.cookie, controller.signal);
    const rejection = expect(pending).rejects.toBe(reason);
    await started; controller.abort(reason); await rejection;
    expect(log).not.toHaveBeenCalled();
  });

  it("still reports a provider AbortError when the actual HTTP request was not cancelled", async () => {
    const f = await fixture(), error = new DOMException("private provider abort", "AbortError");
    vi.spyOn(f.service, "queryInspectorSources").mockRejectedValue(error);
    const log = vi.spyOn(console, "error").mockImplementation(() => {}), response = await f.call();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
    expect(log).toHaveBeenCalledExactlyOnceWith("UNHANDLED_SERVER_ERROR", error);
  });

  it("cancels the actual Node HTTP request on disconnect without logging or publishing an error page", async () => {
    const f = await fixture(), log = vi.spyOn(console, "error").mockImplementation(() => {});
    let entered!: () => void, finished!: () => void, requestSignal!: AbortSignal;
    const started = new Promise<void>(resolve => { entered = resolve; }), settled = new Promise<void>(resolve => { finished = resolve; });
    vi.spyOn(f.service, "queryInspectorSources").mockImplementation(async (_run, _principal, _value, _availability, signal) => {
      requestSignal = signal!; entered();
      await new Promise<void>((_resolve, reject) => signal!.addEventListener("abort", () => reject(signal!.reason), { once: true }));
      throw new Error("unreachable");
    });
    const server = createHttpServer(async request => { try { return await f.handler(request); } finally { finished(); } });
    try {
      server.listen(0, "127.0.0.1"); await once(server, "listening");
      const controller = new AbortController(), origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      const pending = fetch(`${origin}/runs/${f.run.id}/inspector/query`, { method: "POST", headers: { "content-type": "application/json", cookie: f.owner.cookie }, body: JSON.stringify(f.request()), signal: controller.signal });
      const rejection = expect(pending).rejects.toMatchObject({ name: "AbortError" });
      await started; controller.abort(); await rejection; await settled;
      expect(requestSignal.aborted).toBe(true); expect(log).not.toHaveBeenCalled();
    } finally {
      server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
