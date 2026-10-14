// DISPOSABLE D3819 actual HTTP/SQLite/compiled-source observation, not an Inspector endpoint,
// scoped supplier, policy override or source qualification. Mock providers are explicitly labelled.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  assertDeclaredEvidence, assertReviewEvidencePacket, compileAssistanceRequest,
  parseFinalizedAssistanceV1, type DrillRun, type ModuleQueryPage,
} from "../../packages/runtime/src/index.js";
import { evidenceValueReceipt } from "../../packages/runtime/src/evidence-contract.js";
import { assertRecordedNodesPreserved } from "../../packages/runtime/src/testing/recorded-play.js";
import { createApplication } from "../../apps/server/src/application.js";
import { takeObservedReviews, type ObservedReview } from "./review-observer.js";

const directory = mkdtempSync(join(tmpdir(), "tabiya-d3819-review-scope-"));
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const writer = "d3819-source-writer";
type Row = { name: string; status: number; outcome?: string; rankItems?: number; moments?: number;
  inspectorRequested: boolean; inspectorEffect?: boolean; inspectorQueryStatus?: number;
  inspectorPacketPresent?: boolean; inspectorQueryReason?: string; wholeSource: boolean };
const rows: Row[] = [];
let application: Awaited<ReturnType<typeof createApplication>> | undefined;
let checks = 0;
const check = (callback: () => void) => { callback(); checks++; };
try {
  application = await createApplication({ development: true, engineMode: "mock", cookieSecure: false,
    databasePath: join(directory, "fixture.sqlite"),
    draftPackFiles: [resolve("content/drafts/line-boundary.browser.json"), resolve("schemas/fixtures/drill-pack/campaign-boss.browser.json")],
    draftCampaignFiles: [resolve("tests/browser/fixtures/campaign.browser.json")], providerHealthLog: () => {},
  });
  await new Promise<void>((res, reject) => { application!.server.once("error", reject); application!.server.listen(0, "127.0.0.1", res); });
  const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
  async function register(handle: string): Promise<string> {
    const response = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle, password: "owned-d3819-research-password" }) });
    assert.equal(response.status, 201);
    return response.headers.get("set-cookie")!.split(";", 1)[0]!;
  }
  const owner = await register("d3819-source-owner"), stranger = await register("d3819-source-stranger");
  async function call(method: string, path: string, body?: unknown, cookie: string | undefined = owner) {
    return fetch(`${origin}${path}`, { method, headers: { ...(cookie === undefined ? {} : { cookie }),
      "x-writer-id": writer, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  }
  async function post(path: string, body: unknown, expected = 200) {
    const response = await call("POST", path, body);
    assert.equal(response.status, expected, `${path}: ${await response.clone().text()}`);
    return response.json() as Promise<Record<string, unknown>>;
  }
  async function graph(id: string) {
    const response = await call("GET", `/runs/${id}/graph`);
    assert.equal(response.status, 200);
    return (await response.json() as { graph: Pick<DrillRun, "nodes" | "branches" | "activeCursor"> }).graph;
  }
  function source(captures: readonly ObservedReview[], id: string, branch: string): ObservedReview {
    assert.equal(captures.length, 1, "one actual read must capture exactly one private context");
    const context = captures[0]!;
    assert.equal(context.run.id, id); assert.equal(context.branchId, branch);
    assert.equal(context.packet.subject.branchId, branch);
    assertReviewEvidencePacket(context.packet);
    const rank = context.projection.evidence.filter(item => item.projection.id === "derived.story.rank" && item.projection.version === 2);
    assert.equal(rank.length, 1);
    assertDeclaredEvidence(rank[0]!); assert(evidenceValueReceipt(rank[0]!));
    assert.deepEqual((rank[0]!.payload as { rank: readonly string[] }).rank, context.projection.rank);
    return context;
  }
  async function measure(name: string, id: string, branch: string, expected: number, outcome?: string, cookie = owner) {
    takeObservedReviews();
    const response = await call("GET", `/runs/${id}/review?branch=${encodeURIComponent(branch)}`, undefined, cookie);
    assert.equal(response.status, expected, `${name}: ${await response.clone().text()}`);
    const captures = takeObservedReviews();
    if (expected !== 200) {
      check(() => assert.equal(captures.length, 0, `${name} acquired a private source before refusal`));
      rows.push({ name, status: expected, inspectorRequested: true, wholeSource: false }); return undefined;
    }
    const value = await response.json() as { rows: { nodeId: string }[]; outcome: { kind: string }; campaignOrigin: unknown };
    assert(outcome !== undefined, "an admitted case must declare its expected outcome");
    const observed = source(captures, id, branch);
    check(() => { assert.equal(value.outcome.kind, outcome); assert.equal(observed.packet.subject.outcome.kind, outcome);
      assert.deepEqual(observed.packet.subject.pathNodeIds.slice(1), value.rows.map(row => row.nodeId)); });
    const campaign = value.campaignOrigin !== undefined && value.campaignOrigin !== null;
    const assistance = compileAssistanceRequest({
      contextHint: campaign ? "campaign" : observed.run.sessionKind === "imported" ? "imported" : "position",
      preference: { kind: "explicit", preset: campaign ? "campaign_kit" : "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } },
    });
    const effectResponse = await call("POST", `/runs/${id}/assistance`, assistance, cookie);
    assert.equal(effectResponse.status, 200, `${name} assistance: ${await effectResponse.clone().text()}`);
    const finalized = parseFinalizedAssistanceV1((await effectResponse.json() as { assistance: unknown }).assistance);
    const inspectorEffect = finalized.effects.some(effect => effect.moduleId === "full_inspector" && effect.timing === "review");
    const query = await call("POST", `/runs/${id}/modules/query`, { assistance,
      query: { timing: "review", nodeId: observed.packet.subject.tipNodeId, requested: ["full_inspector"] },
    }, cookie);
    const page = await query.json() as { page?: ModuleQueryPage; error?: { code: string } };
    check(() => {
      assert([200, 409].includes(query.status), `${name} unexpected Inspector response: ${JSON.stringify(page.error)}`);
      if (query.status === 200) { assert(page.page); assert.equal(page.page.subjectNodeId, observed.packet.subject.tipNodeId); }
      else assert.equal(page.error?.code, "ASSISTANCE_WITHHELD");
    });
    rows.push({ name, status: 200, outcome, rankItems: observed.projection.rank.length,
      moments: observed.projection.moments.length, inspectorRequested: true, inspectorEffect,
      inspectorQueryStatus: query.status, inspectorPacketPresent: page.page?.packets.some(packet => packet.module === "full_inspector") ?? false,
      ...(page.error === undefined ? {} : { inspectorQueryReason: page.error.code }), wholeSource: true });
    return observed;
  }
  async function native(id: string, moves: readonly string[]) {
    await post("/runs", { id, session: { kind: "position", start: { fen: initial, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig, seed: 1 }, 201);
    for (const uci of moves) await post(`/runs/${id}/moves`, { uci });
    return graph(id);
  }
  const empty = await native("d3819-native-empty", ["e2e4", "e7e5"]);
  await post("/runs/d3819-native-empty/reveal", {});
  const emptySource = (await measure("native revealed empty Story", "d3819-native-empty", empty.branches[0]!.id, 200, "unfinished"))!;
  check(() => assert.equal(emptySource.projection.rank.length, 0));
  const open = await native("d3819-native", ["e2e4", "e7e5", "d2d4", "e5d4"]), main = open.branches[0]!.id;
  await measure("native unrevealed", "d3819-native", main, 409);
  await post("/runs/d3819-native/reveal", {});
  const partial = (await measure("native revealed unfinished", "d3819-native", main, 200, "unfinished"))!;
  check(() => assert(partial.projection.moments.length > 0, "unfinished positive must contain actual admitted moments"));
  await measure("native foreign account", "d3819-native", main, 404, undefined, stranger);
  await measure("native unknown branch", "d3819-native", "not-a-branch", 409);
  const terminal = await native("d3819-terminal", ["f2f3", "e7e5", "g2g4", "d8h4"]);
  await post("/runs/d3819-terminal/reveal", {});
  await measure("native actual terminal", "d3819-terminal", terminal.branches[0]!.id, 200, "board_terminal");

  for (const result of ["*", "1-0"] as const) {
    const id = result === "*" ? "d3819-import-open" : "d3819-import-result";
    await post("/runs/import", { id, side: "black", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 1,
      source: { kind: "pgn", pgn: `[White "Source White"]\n[Black "Source Black"]\n[Result "${result}"]\n\n1. e4 e5 2. d4 exd4 ${result}` } }, 201);
    await post(`/runs/${id}/reveal`, {});
    const before = await graph(id), importedMain = before.branches[0]!.id;
    await measure(`imported ${result} mainline`, id, importedMain, 200, result === "*" ? "unfinished" : "recorded_result");
    const root = before.nodes.find(node => node.parentId === null)!;
    await post(`/runs/${id}/rewind`, { nodeId: root.id });
    await post(`/runs/${id}/fork`, { nodeId: root.id, label: "source-context-retry" });
    for (const uci of ["d2d4", "d7d5", "c2c4", "d5c4"]) await post(`/runs/${id}/moves`, { uci });
    const retry = (await graph(id)).activeCursor.branchId;
    // Completed/imported authority and current Play disclosure are deliberately different axes.
    await measure(`imported ${result} original after live retry`, id, importedMain, 200, result === "*" ? "unfinished" : "recorded_result");
    await measure(`imported ${result} unrevealed retry`, id, retry, 409);
    await post(`/runs/${id}/reveal`, {});
    await measure(`imported ${result} revealed retry`, id, retry, 200, "unfinished");
    const after = await graph(id);
    check(() => assertRecordedNodesPreserved(before.nodes, after.nodes.filter(node => before.nodes.some(previous => previous.id === node.id))));
  }

  const created = await post("/campaigns/browser-fixture-campaign/runs", { campaignVersion: 1, commandId: `research-${randomUUID()}` }, 201);
  const campaignId = (created.result as { campaignRunId: string }).campaignRunId;
  const current = async () => (await (await call("GET", `/campaign-runs/${campaignId}`)).json()) as { campaignRun: { revision: number } };
  const started = await post(`/campaign-runs/${campaignId}/nodes/f1-a/start`, {
    expectedRevision: (await current()).campaignRun.revision, commandId: `research-${randomUUID()}`,
  }, 201);
  const playId = (started.result as { response: { playRunId: string } }).response.playRunId;
  await post(`/runs/${playId}/moves`, { uci: "c1e3" });
  await post(`/runs/${playId}/moves`, { uci: "e7e6", actor: "system" });
  const campaignLine = await graph(playId), campaignBranch = campaignLine.branches[0]!.id;
  await measure("Campaign before submission", playId, campaignBranch, 409);
  await post(`/campaign-runs/${campaignId}/nodes/f1-a/submit`, { runId: playId,
    expectedRevision: (await current()).campaignRun.revision, commandId: `research-${randomUUID()}` });
  await measure("Campaign exact submitted consequence", playId, campaignBranch, 200, "unfinished");

  // Never equate an actual source context with a new scoped/complete Inspector permission.
  check(() => assert(rows.some(row => row.outcome === "unfinished" && row.wholeSource && (row.rankItems ?? 0) > 0)));
  check(() => assert(rows.some(row => row.wholeSource && row.inspectorEffect === false)));
  check(() => assert(rows.some(row => row.wholeSource && row.inspectorEffect && row.inspectorQueryStatus === 409)));
  const output = JSON.stringify({ scope: "D3819 actual authenticated Review/source/effect observations; NOT a production scoped supplier or source qualification",
    providers: "labelled application mocks; not live Stockfish/Maia research", checks, rows });
  assert(Buffer.byteLength(output) < 8 * 1024);
  console.log(output);
} finally {
  takeObservedReviews();
  try { await application?.close(); } finally { rmSync(directory, { recursive: true, force: true }); }
}
