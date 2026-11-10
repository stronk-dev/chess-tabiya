// Real cookie REST → DrillApi strict receiver; no default-content/native release claim.
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it, vi } from "vitest";
import { commitMove, fork } from "@chess-tabiya/runtime";
import { factStatementOperand, presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import { evidenceDigest } from "../../../packages/runtime/src/evidence-contract.js";
import { recordedClockUsedSentence } from "../../../packages/runtime/src/recorded-clock-presentation.js";
import { phaseBandReading } from "../../../packages/runtime/src/phase.js";
import { parseRecordedClockView } from "../../../packages/runtime/src/recorded-clock-view.js";
import { DrillApi } from "../../web/src/lib/api.js";
import { IdentityService } from "./identity.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { LearnerProfileService } from "./learner-profile.js";
import { LongitudinalStore } from "./longitudinal-store.js";
import { runLongitudinalBatch } from "./longitudinal-worker-core.js";
import { LONGITUDINAL_WORKER_DEFAULTS } from "./longitudinal-worker-config.js";
import { SQLiteRunStorage } from "./storage.js";
import * as clocks from "./recorded-clock-operation.js";
import * as consumer from "../../../packages/runtime/src/recorded-clock-review.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";

const at = "2026-11-05T00:00:00.000Z", stores: SQLiteRunStorage[] = [], sqls: DatabaseSync[] = [], directories: string[] = [];
const pgn = '[TimeControl "300+2"]\n\n1. e4 {[%clk 0:04:59.123]} e5 {[%clk 0:04:57]} 2. Nf3 {[%clk 0:04:58]} Nc6 *';
afterEach(() => { vi.restoreAllMocks(); for (const sql of sqls.splice(0)) sql.close(); for (const storage of stores.splice(0)) storage.close(); for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true }); });
async function fixture(source = pgn) {
  const dir = mkdtempSync(join(tmpdir(), "clock-delivery-")); directories.push(dir);
  const file = join(dir, "tabiya.sqlite"), storage = new SQLiteRunStorage(file, { onMigration: () => {} }); stores.push(storage);
  const sql = new DatabaseSync(file); sqls.push(sql);
  const service = new RunService(storage), identity = new IdentityService(storage, { cookieSecure: false,
    derive: async (secret, salt) => createHash("sha256").update(salt).update(secret).digest() });
  const handler = createRestHandler(service, undefined, undefined, identity);
  async function register(handle: string) {
    const response = await handler(new Request("http://tabiya.test/auth/register", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle, password: "clock-test-password" }) }));
    expect(response.status).toBe(201);
    return { cookie: response.headers.get("set-cookie")!.split(";", 1)[0]!, learner: storage.learnerByHandle(handle)! };
  }
  const owner = await register("clock-http-owner"), stranger = await register("clock-http-stranger");
  const api = new DrillApi("http://tabiya.test", async (input, init) => {
    const headers = new Headers(init?.headers); headers.set("cookie", owner.cookie);
    return handler(new Request(input, { ...init, headers }));
  });
  const imported = await api.importGame({ id: "clock-http", side: "black", source: { kind: "pgn", pgn: source },
    opponentPolicy: { mode: "human_common" }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1 }, "clock-http-writer");
  const run = imported.run, branchId = run.branches[0]!.id;
  const selection = (ply: number, branch = branchId) => ({ runId: run.id, branchId: branch, nodeId: run.nodes[ply]!.id });
  const call = (query: string, cookie: string | null = owner.cookie, signal?: AbortSignal) => handler(new Request(`http://tabiya.test/runs/${run.id}/recorded-clock${query}`, {
    headers: cookie === null ? {} : { cookie }, ...(signal === undefined ? {} : { signal }) }));
  const query = (ply: number) => `?branchId=${encodeURIComponent(branchId)}&nodeId=${encodeURIComponent(run.nodes[ply]!.id)}`;
  return { storage, sql, service, handler, api, run, owner, stranger, selection, call, query };
}

describe("actual recorded clock historical delivery", () => {
  it("keeps native timing cards blocked while truthfully acknowledging retained imported clocks", async () => {
    const f = await fixture();
    const original = await f.api.recordedClock(f.run.id, f.run.branches[0]!.id, f.run.nodes[1]!.id, new AbortController().signal);
    expect(original.reading.kind).toBe("available");
    const store = new LongitudinalStore(f.sql);
    expect(runLongitudinalBatch(store, LONGITUDINAL_WORKER_DEFAULTS, "clock-profile-disclosure").failed).toBe(0);
    const profiles = new LearnerProfileService({ storage: f.storage, longitudinalStatus: () => "ready", openingCatalogue: { kind: "unavailable", reason: "artifact_missing" } });
    const cards = profiles.profile({ learnerId: f.owner.learner.id, handle: "clock-http-owner" }).style.cards.filter(card => card.metricId.startsWith("clock_spend_share:"));
    expect(cards).toHaveLength(3);
    for (const card of cards) expect(card).toMatchObject({ state: "abstained", abstention: { code: "blocked", blocked: "clock_readings_unrecorded", detail: expect.stringContaining("Timing cards are not available for your play yet") } });
    expect(cards.some(card => card.sentence.includes("No run records"))).toBe(false);
  });
  it("delivers both original movers independently of selected colour with exact milliseconds and no run/provider writes", async () => {
    const f = await fixture(), abort = new AbortController(), before = JSON.stringify(f.storage.read(f.run.id));
    const document = JSON.stringify(f.storage.importedGame(f.run.id));
    for (const ply of [1, 2, 3, 4]) {
      const q = f.selection(ply), page = await f.api.recordedClock(q.runId, q.branchId, q.nodeId, abort.signal);
      expect(page.subject).toMatchObject({ kind: "resolved", ...q, sourcePly: ply });
      if (page.reading.kind !== "available") throw new Error("original reading required");
      expect(page.reading.value.original.side).toBe(ply % 2 ? "white" : "black");
      if (ply === 1) {
        expect(page.use).toMatchObject({ kind: "available", value: { actor: { kind: "imported", side: "white" }, clockUsedMs: 2877 } });
        expect(JSON.stringify(page.presentation)).toContain("0:04:59.123 remaining after this move");
      }
      if (ply === 4) expect(page.use).toEqual({ kind: "unavailable", reason: "current_sample_unavailable" });
    }
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
    expect(JSON.stringify(f.storage.importedGame(f.run.id))).toBe(document);
  });

  it("authorizes before acquisition and refuses anonymous/foreign/unknown subjects without parsing or CAS", async () => {
    const f = await fixture(), collect = vi.spyOn(clocks, "recordedClockOperation"), backfill = vi.spyOn(f.storage, "ensureRecordedClockDocument");
    expect((await f.call(f.query(1), null)).status).toBe(401);
    expect((await f.call(f.query(1), f.stranger.cookie)).status).toBe(404);
    expect((await f.call(`?branchId=unknown&nodeId=${f.run.nodes[1]!.id}`)).status).toBe(404);
    expect((await f.call(`?branchId=${f.run.branches[0]!.id}&nodeId=unknown`)).status).toBe(404);
    expect(collect).not.toHaveBeenCalled(); expect(backfill).not.toHaveBeenCalled();
  });

  it("rejects duplicate, extra, missing and whitespace query authority before collecting", async () => {
    const f = await fixture(), collect = vi.spyOn(clocks, "recordedClockOperation");
    for (const query of ["", "?nodeId=x", `${f.query(1)}&nodeId=x`, `${f.query(1)}&branchId=x`, `${f.query(1)}&actor=learner`,
      "?branchId=%20&nodeId=x", "?branchId=x&nodeId=%00"]) expect((await f.call(query)).status).toBe(400);
    expect(collect).not.toHaveBeenCalled();
  });

  it("does not acquire when the actual complete consumer preflight refuses", async () => {
    const f = await fixture(), collect = vi.spyOn(clocks, "recordedClockOperation"), backfill = vi.spyOn(f.storage, "ensureRecordedClockDocument");
    vi.spyOn(consumer, "preflightRecordedClockConsumer").mockImplementation(() => { throw new TypeError("disabled exact clock binding"); });
    expect((await f.call(f.query(1))).status).toBe(500);
    expect(collect).not.toHaveBeenCalled(); expect(backfill).not.toHaveBeenCalled();
  });

  it.each(["run.record.clock_reading@1", "rules.phase.reading@2", "run.record.clock_decision@1"])("preserves a post-preflight %s route refusal as a contract failure", async failedRoute => {
    const f = await fixture(), original = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((route, input) => {
      if (route === failedRoute) throw new routes.EvidenceValueRouteLookupError(route);
      return original(route, input);
    });
    const response = await f.call(f.query(1)); expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("source_failed");
  });

  it("keeps root unresolved and inherited originals eligible without attaching clocks to equal-FEN alternatives", async () => {
    const f = await fixture(), abort = new AbortController(), root = f.selection(0);
    expect(await f.api.recordedClock(root.runId, root.branchId, root.nodeId, abort.signal)).toMatchObject({ subject: { kind: "unresolved" },
      reading: { kind: "unavailable", reason: "missing_context" }, presentation: { items: [] } });
    let changed = fork(f.run, f.run.nodes[1]!.id, { label: "Clock alternative", at }).run;
    const branchId = changed.activeCursor.branchId;
    changed = commitMove(changed, "e7e5", { at }).run;
    f.storage.save(changed, { writerId: "clock-http-writer", learnerId: f.owner.learner.id });
    expect((await f.api.recordedClock(f.run.id, branchId, f.run.nodes[1]!.id, abort.signal)).subject.kind).toBe("resolved");
    expect((await f.api.recordedClock(f.run.id, branchId, changed.activeCursor.nodeId, abort.signal)).subject.kind).toBe("unresolved");
  });

  it("strictly rejects crossed body/receipts and repaired outer hashes around altered source operands", async () => {
    const f = await fixture(), abort = new AbortController(), q = f.selection(1), first = await f.api.recordedClock(q.runId, q.branchId, q.nodeId, abort.signal);
    const second = await f.api.recordedClock(q.runId, q.branchId, f.run.nodes[2]!.id, abort.signal);
    for (const value of [{ ...first, extra: true }, { ...first, protocol: "recorded-clock-view@2" }, { ...first, presentation: second.presentation },
      { ...first, subject: { ...first.subject, nodeId: f.run.nodes[2]!.id } }, { ...first, use: { kind: "unavailable", reason: "source_failed" } },
      { ...first, reading: { kind: "unavailable", reason: "missing_context" } }, Object.create(first)]) expect(() => parseRecordedClockView(value, q)).toThrow();
    expect(() => parseRecordedClockView(first, { ...q, eventHeadSeq: first.subject.eventHead.seq - 1 })).toThrow();
    if (first.reading.kind !== "available" || first.reading.value.sample.kind !== "available") throw new Error("source fixture");
    const forged = JSON.parse(JSON.stringify(first)), row = forged.presentation.items[0];
    const operands = { ...first.reading.value, sample: { kind: "available" as const, sample: { ...first.reading.value.sample.sample, remainingMs: 298000 } } };
    row.component.operand = factStatementOperand("review.clock_remaining@1", "recorded_run", "recorded-run@1", operands);
    row.componentDigest = presentationDigest("presentation.component@1", { evidenceRef: row.evidenceRef, adapter: row.adapter, component: row.component });
    forged.presentation.digest = presentationDigest("presentation.receipt@1", forged.presentation.items);
    expect(() => parseRecordedClockView(forged, q)).toThrow(/complete source operands/);
  });

  it("forwards abort ownership through DrillApi and never publishes an already-aborted source", async () => {
    const f = await fixture(), abort = new AbortController(); abort.abort();
    const collect = vi.spyOn(clocks, "recordedClockOperation");
    await expect(f.api.recordedClock(f.run.id, f.run.branches[0]!.id, f.run.nodes[1]!.id, abort.signal)).rejects.toThrow();
    expect(collect).not.toHaveBeenCalled();
  });

  it("reports corrupt persisted documents and transient legacy ensure failures as source_failed without rewriting or caching", async () => {
    const f = await fixture(), q = f.selection(1), abort = new AbortController();
    const original = f.sql.prepare("SELECT clock_document_json FROM imported_games WHERE run_id=?").get(f.run.id)!.clock_document_json;
    if (typeof original !== "string") throw new Error("Original clock document fixture must exist");
    f.sql.prepare("UPDATE imported_games SET clock_document_json='[]' WHERE run_id=?").run(f.run.id);
    const corrupt = await f.api.recordedClock(q.runId, q.branchId, q.nodeId, abort.signal);
    expect(corrupt).toMatchObject({ subject: { kind: "unresolved" }, reading: { kind: "unavailable", reason: "source_failed" }, use: { kind: "unavailable", reason: "source_failed" }, presentation: { items: [] } });
    expect(f.sql.prepare("SELECT clock_document_json FROM imported_games WHERE run_id=?").get(f.run.id)!.clock_document_json).toBe("[]");
    f.sql.prepare("UPDATE imported_games SET clock_document_json=? WHERE run_id=?").run(original, f.run.id);
    expect((await f.api.recordedClock(q.runId, q.branchId, q.nodeId, abort.signal)).subject.kind).toBe("resolved");
    f.sql.prepare("UPDATE imported_games SET clock_document_json=NULL WHERE run_id=?").run(f.run.id);
    vi.spyOn(f.storage, "ensureRecordedClockDocument").mockImplementationOnce(() => { throw new TypeError("transient extraction failure"); });
    expect(await f.api.recordedClock(q.runId, q.branchId, q.nodeId, abort.signal)).toMatchObject({ reading: { kind: "unavailable", reason: "source_failed" }, presentation: { items: [] } });
    expect(f.sql.prepare("SELECT clock_document_json FROM imported_games WHERE run_id=?").get(f.run.id)!.clock_document_json).toBeNull();
    expect(await f.api.recordedClock(q.runId, q.branchId, q.nodeId, abort.signal)).toMatchObject({ reading: { kind: "available", value: { sample: { kind: "unknown_historical_retention" } } } });
  });

  it("rejects coherent rebuilt hashes around substituted initial roots/custom first decisions", async () => {
    const f = await fixture(), q = f.selection(1), page = await f.api.recordedClock(q.runId, q.branchId, q.nodeId, new AbortController().signal);
    const rewrite = (input: unknown) => {
      const changed = JSON.parse(JSON.stringify(input)), d = changed.use.value, row = changed.presentation.items[1];
      row.evidenceRef.evidenceDigest = `sha256:${evidenceDigest(d)}`;
      row.component.operand.operands = d;
      row.component.operand.sourceDigest = presentationDigest("presentation.fact.operands@1", d);
      row.component.operand.renderedText = recordedClockUsedSentence(d);
      row.componentDigest = presentationDigest("presentation.component@1", { evidenceRef: row.evidenceRef, adapter: row.adapter, component: row.component });
      changed.presentation.digest = presentationDigest("presentation.receipt@1", changed.presentation.items);
      return changed;
    };
    const root = JSON.parse(JSON.stringify(page)); root.use.value.previous.nodeId = "unrelated-original-root";
    expect(() => parseRecordedClockView(rewrite(root), q)).toThrow(/initial root/);
    const custom = JSON.parse(JSON.stringify(page)); custom.use.value.decision.beforeFen = custom.use.value.decision.beforeFen.replace(" 0 1", " 0 2");
    custom.use.value.phase = phaseBandReading(custom.use.value.decision.beforeFen);
    expect(() => parseRecordedClockView(rewrite(custom), q)).toThrow(/initial root/);
    const secondQ = f.selection(2), second = JSON.parse(JSON.stringify(await f.api.recordedClock(secondQ.runId, secondQ.branchId, secondQ.nodeId, new AbortController().signal)));
    second.use.value.previous.nodeId = "unrelated-root";
    expect(() => parseRecordedClockView(rewrite(second), { ...secondQ, rootNodeId: f.run.nodes[0]!.id })).toThrow(/known original root/);
  });

  it("rejects coherent reading-only receipts with impossible first/later/no-positive-budget absence reasons", async () => {
    const f = await fixture();
    for (const [ply, reason] of [[1, "previous_same_side_sample_unavailable"], [3, "initial_base_unproven"], [1, "nonpositive_available"]] as const) {
      const q = f.selection(ply), page = JSON.parse(JSON.stringify(await f.api.recordedClock(q.runId, q.branchId, q.nodeId, new AbortController().signal)));
      page.use = { kind: "unavailable", reason }; page.presentation.items = page.presentation.items.slice(0, 1);
      page.presentation.digest = presentationDigest("presentation.receipt@1", page.presentation.items);
      expect(() => parseRecordedClockView(page, q)).toThrow(/public source operands/);
    }
  });
});
