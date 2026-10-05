import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { DatabaseSync } from "node:sqlite";
import { expect, it } from "vitest";
import { createApplication } from "./application.js";
import { longitudinalThreadEntryForTests } from "./longitudinal-test-support.js";
import { DrillApi } from "../../web/src/lib/api.js";
import { RunStateStore } from "../../web/src/lib/run-state.js";
import { WriterSession } from "../../web/src/lib/writer-session.js";

it("carries authenticated durable admission through the production client, mutation and exact result attachment", { timeout: 20_000 }, async () => {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-analysis-client-"));
  const databasePath = join(directory, "application.sqlite");
  const application = await createApplication({ development: true, engineMode: "mock", cookieSecure: false, databasePath, longitudinalWorkerEntry: longitudinalThreadEntryForTests() });
  let store: RunStateStore | undefined;
  try {
    await new Promise<void>((resolve, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", resolve); });
    const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "analysis_owner", password: "analysis-client-password" }) });
    expect(registered.status).toBe(201);
    const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
    const admissions: { batchId: string; jobs: { id: string; nodeId: string; kind: string }[] }[] = [];
    const admissionKeys: string[] = [];
    let loseResponse = true;
    const api = new DrillApi(origin, async (url, init) => {
      const headers = new Headers(init?.headers); headers.set("cookie", cookie);
      const response = await fetch(url, { ...init, headers });
      if (String(url).endsWith("/analysis") && init?.method === "POST") {
        expect(response.status).toBe(202);
        admissions.push(await response.clone().json());
        admissionKeys.push(headers.get("idempotency-key")!);
        if (loseResponse) { loseResponse = false; throw new TypeError("lost admitted response"); }
      }
      return response;
    });
    const values = new Map<string, string>();
    const session = WriterSession.claimFor("analysis-journey", { getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); } }, () => "analysis-writer");
    const run = await api.createRun({
      id: session.runId,
      session: { kind: "position", start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 7,
    }, session.writerId);
    store = new RunStateStore(api, session, run, { setInterval: () => 1, clearInterval: () => {} });
    await store.reveal();
    const rootId = run.nodes[0]!.id;
    await expect(store.analysis([rootId])).rejects.toThrow("lost admitted response");
    expect(store.snapshot.analysisJobs ?? []).toEqual([]);
    const admission = await store.analysis([rootId]);
    expect(admissions).toEqual([admission, admission]);
    expect(admissionKeys[1]).toBe(admissionKeys[0]);
    expect(admission.jobs).toEqual([{ id: expect.any(String), nodeId: rootId, kind: "bestline" }]);
    const database = new DatabaseSync(databasePath, { readOnly: true });
    try {
      const row = database.prepare("SELECT id,batch_id,node_id,origin FROM evidence_jobs WHERE id=?").get(admission.jobs[0]!.id);
      expect(row).toEqual({ id: admission.jobs[0]!.id, batch_id: admission.batchId, node_id: rootId, origin: "explicit_analysis" });
      expect(database.prepare("SELECT COUNT(*) AS count FROM evidence_job_batches WHERE run_id=? AND origin='explicit_analysis'").get(run.id)).toEqual({ count: 1 });
    } finally { database.close(); }
    await store.move({ uci: "e2e4" });
    expect(store.snapshot.analysisJobs).toEqual([{ ...admission.jobs[0], batchId: admission.batchId }]);
    expect(store.snapshot.pendingEvidence).toBe(2);
    await store.reveal();
    await expect.poll(async () => { await store!.pollEvidence(); return store!.snapshot.pendingEvidence; }).toBe(0);
    expect(store.snapshot.analysisJobs).toEqual([]);
    expect(store.snapshot.run.nodes.find(node => node.id === rootId)!.evidenceRefs).toContain(`engine:${admission.jobs[0]!.id}`);
    expect((await fetch(`${origin}/runs/${run.id}/evidence`)).status).toBe(401);
  } finally {
    store?.stop();
    await application.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
