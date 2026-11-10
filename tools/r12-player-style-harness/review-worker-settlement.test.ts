// DISPOSABLE D4202 research. Exact Review HTTP fixture and actual worker; no production deadline change.
import { expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import type { AddressInfo } from "node:net";
import { createApplication } from "../../apps/server/src/application.js";
import { installEmptyApplicationCatalogues } from "../../apps/server/src/empty-application-catalogues.test-support.js";
import { longitudinalThreadEntryForTests } from "../../apps/server/src/longitudinal-test-support.js";
import { REVIEW_GLYPHED_PGN } from "../../apps/server/src/testing/review-import-fixture.js";

it("D4202 measures the actual40-ply Review import through complete worker publication", async () => {
  installEmptyApplicationCatalogues();
  const directory = mkdtempSync(join(tmpdir(), "tabiya-review-settlement-research-"));
  const databasePath = join(directory, "review.sqlite");
  const started = performance.now(), phases: Record<string, number> = {};
  const elapsed = () => Math.round(performance.now() - started);
  const app = await createApplication({ development: true, engineMode: "mock", cookieSecure: false, databasePath,
    longitudinalWorkerEntry: longitudinalThreadEntryForTests() });
  const db = new DatabaseSync(databasePath, { readOnly: true });
  try {
    await new Promise<void>((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
    const origin = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
    const registered = await fetch(origin + "/auth/register", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle: "settlement_owner", password: "settlement-owner-password-long" }) });
    expect(registered.status).toBe(201);
    const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
    const post = (path: string, body: unknown) => fetch(origin + path, { method: "POST",
      headers: { "content-type": "application/json", cookie, "x-writer-id": "writer-review" }, body: JSON.stringify(body) });
    const imported = await post("/runs/import", { id: "review-import", side: "white", opponentPolicy: { mode: "human_common" },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 7,
      source: { kind: "pgn", pgn: REVIEW_GLYPHED_PGN } });
    expect(imported.status, await imported.clone().text()).toBe(201);
    phases.importedMs = elapsed();
    expect((await post("/runs/review-import/reveal", {})).status).toBe(200);
    let ready = false;
    for (let attempt = 0; attempt < 200 && !ready; attempt++) {
      const story = await (await fetch(origin + "/runs/review-import/story", { headers: { cookie } })).json() as { progress: { kind: string } };
      ready = story.progress.kind === "settled";
      if (!ready) await new Promise(resolve => setTimeout(resolve, 20));
    }
    expect(ready).toBe(true);
    phases.engineSettledMs = elapsed();
    const job = () => db.prepare("SELECT state, requested_seq, claimed_requested_seq, completed_seq, claim_generation FROM learner_observation_jobs WHERE run_id='review-import'").get()!;
    let last = "", settled = false;
    while (elapsed() < 110_000) {
      const row = job();
      const summary = JSON.stringify({ job: row, progress: app.longitudinal.progress() });
      if (summary !== last) { console.log(JSON.stringify({ question: "D4202", elapsedMs: elapsed(), ...JSON.parse(summary) })); last = summary; }
      if (row.state === "complete" && row.completed_seq === row.requested_seq) { settled = true; break; }
      expect(row.state).not.toBe("failed");
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    phases.workerSettledMs = elapsed();
    expect(settled, JSON.stringify({ phases, job: job(), progress: app.longitudinal.progress() })).toBe(true);
    const snapshot = () => Object.fromEntries((db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[])
      .map(({ name }) => [name, db.prepare(`SELECT count(*) AS n FROM "${name.replaceAll('"', '""')}"`).get()!.n]));
    const before = snapshot();
    for (let i = 0; i < 2; i++) {
      const review = await fetch(origin + "/runs/review-import/review", { headers: { cookie } });
      expect(review.status).toBe(200);
      expect((await review.json() as { rows: unknown[] }).rows).toHaveLength(40);
    }
    expect(snapshot()).toEqual(before);
    console.log(JSON.stringify({ question: "D4202", phases, job: job(), progress: app.longitudinal.progress(),
      reviewReadTableCountsUnchanged: true, limits: "Exact synthetic40-ply Review fixture, observed idle workstation; no product latency budget or isolated regression attribution." }));
  } finally { db.close(); await app.close(); rmSync(directory, { recursive: true, force: true }); vi.restoreAllMocks(); }
}, 120_000);
