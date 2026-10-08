import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApplication, type ApplicationOptions, type ChessTabiyaApplication } from "./application.js";
import { applicationFixture } from "./application-fixture.test-support.js";
import { CampaignRegistry } from "./campaign-registry.js";
import { EvidenceJobQueue } from "./evidence-queue.js";
import { longitudinalThreadEntryForTests } from "./longitudinal-test-support.js";
import { ProviderRegistry } from "./provider-health.js";
import { ReviewEvidenceCoordinator } from "./review-evidence.js";
import { SharedEngineSupervisor } from "./shared-engine-supervisor.js";
import { SQLiteRunStorage } from "./storage.js";

const invalid = fileURLToPath(new URL("./fixtures/startup-invalid.json", import.meta.url));
const stockfish = process.env.SF_CMD?.trim();
if (!stockfish) throw new Error("Run this native startup contract through Make with its configured SF_CMD.");
const originalStart = SharedEngineSupervisor.prototype.start;
const originalStorageClose = SQLiteRunStorage.prototype.close;
const originalQueueClose = EvidenceJobQueue.prototype.close;
const originalReviewIdle = ReviewEvidenceCoordinator.prototype.whenIdle;
const originalCampaignLoad = CampaignRegistry.loadDefault;
type OwnedApplication = ReturnType<typeof applicationFixture<ChessTabiyaApplication>>;
let directory: string;
let options: ApplicationOptions;
let observedCampaignFailure: unknown;
const owners: OwnedApplication[] = [];
const supervisors = new Set<SharedEngineSupervisor>();
const ready = new Set<SharedEngineSupervisor>();
const closedStorage = new Set<SQLiteRunStorage>();
const released: string[] = [];

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  directory = mkdtempSync(join(tmpdir(), "tabiya-startup-cleanup-"));
  options = {
    databasePath: join(directory, "app.sqlite"),
    engineMode: "maia", stockfishCommand: stockfish!,
    // Port zero has no TCP listener; Maia is explicitly unavailable, not silently replaced.
    maiaHost: "127.0.0.1", maiaPort: 0, tablebaseSource: null,
    longitudinalWorkerEntry: longitudinalThreadEntryForTests(),
  };
  observedCampaignFailure = undefined;
  released.length = 0;
  const healthShutdown = ProviderRegistry.prototype.shutdown;
  vi.spyOn(ProviderRegistry.prototype, "shutdown").mockImplementation(function (this: ProviderRegistry) {
    healthShutdown.call(this);
    released.push("provider health");
  });
  vi.spyOn(EvidenceJobQueue.prototype, "close").mockImplementation(async function (this: EvidenceJobQueue) {
    await originalQueueClose.call(this);
    released.push("evidence queue");
  });
  vi.spyOn(ReviewEvidenceCoordinator.prototype, "whenIdle").mockImplementation(async function (this: ReviewEvidenceCoordinator) {
    await originalReviewIdle.call(this);
    released.push("review");
  });
  vi.spyOn(SharedEngineSupervisor.prototype, "start").mockImplementation(async function (this: SharedEngineSupervisor, id) {
    supervisors.add(this);
    const identity = await originalStart.call(this, id);
    if (id === "stockfish-analysis") ready.add(this);
    return identity;
  });
  vi.spyOn(SQLiteRunStorage.prototype, "close").mockImplementation(function (this: SQLiteRunStorage) {
    originalStorageClose.call(this);
    closedStorage.add(this);
    released.push("database");
  });
  vi.spyOn(CampaignRegistry, "loadDefault").mockImplementation(async (...args) => {
    try { return await originalCampaignLoad(...args); }
    catch (error) { observedCampaignFailure = error; throw error; }
  });
});

afterEach(async () => {
  // Restore the injected shutdown fault before emergency test-owned cleanup. Failed assertions
  // must not leave an actual native process behind, even on the predecessor.
  vi.restoreAllMocks();
  const closing = owners.splice(0);
  const engines = [...supervisors];
  supervisors.clear(); ready.clear(); closedStorage.clear();
  const removing = directory;
  try {
    for (const owner of closing) await owner.close();
  } finally {
    try { await Promise.all(engines.filter(engine => engine.health("stockfish-analysis").status !== "stopped" || engine.health("maia-5m").status !== "stopped").map(engine => engine.shutdown())); }
    finally { rmSync(removing, { recursive: true, force: true }); }
  }
});

async function start(extra: ApplicationOptions = {}) {
  const owner = applicationFixture(createApplication({ ...options, ...extra }));
  owners.push(owner);
  await owner.ready;
  const application = owner.current();
  if (!application) throw new Error("Startup completed after fixture teardown");
  return application;
}

function assertReleased() {
  expect(supervisors.size).toBe(1);
  expect(ready.size).toBe(1); // An actual Stockfish handshake completed before the refusal.
  for (const engine of supervisors) {
    expect(engine.health("stockfish-analysis").status).toBe("stopped");
    expect(engine.health("stockfish-play").status).toBe("stopped");
    expect(engine.health("maia-5m").status).toBe("stopped");
    expect(engine.transcript("stockfish-analysis")).toContainEqual(expect.objectContaining({ direction: "sent", line: "quit" }));
  }
  expect(closedStorage.size).toBe(1);
  for (const storage of closedStorage) expect(() => storage.list(1, 0)).toThrow();
  expect(released.filter(name => name === "provider health")).toHaveLength(1);
  expect(released.filter(name => name === "review")).toHaveLength(1);
  expect(released.at(-1)).toBe("database");
}

describe("production startup owns acquired resources", { timeout: 15_000 }, () => {
  it("releases a real started engine when valence validation refuses startup", async () => {
    await expect(start({ valenceRegisterPath: invalid })).rejects.toThrow("VALENCE_REGISTER_INVALID");
    assertReleased();
  });

  it("preserves the exact Campaign refusal and stops engines before rejecting readiness", async () => {
    const failure = await start({ development: true, draftCampaignFiles: [invalid] }).catch(error => error);
    expect(failure).toBe(observedCampaignFailure);
    expect(failure).toMatchObject({ code: "CAMPAIGN_DOCUMENT_INVALID" });
    assertReleased();
  });

  it("continues unwinding after a shutdown error without replacing the validation error", async () => {
    const cleanupFailure = new Error("injected shutdown failure must not replace the original refusal");
    const reporting = vi.spyOn(console, "error").mockImplementation(() => {});
    const queueClose = vi.spyOn(EvidenceJobQueue.prototype, "close").mockImplementation(async function (this: EvidenceJobQueue) {
      await originalQueueClose.call(this);
      released.push("evidence queue");
      throw cleanupFailure;
    });
    const failure = await start({ development: true, draftCampaignFiles: [invalid] }).catch(error => error);
    expect(failure).toBe(observedCampaignFailure);
    expect(failure).toMatchObject({ code: "CAMPAIGN_DOCUMENT_INVALID" });
    expect(queueClose).toHaveBeenCalledTimes(1);
    expect(reporting).toHaveBeenCalledWith("application startup cleanup failed: evidence queue");
    assertReleased();
  });

  it("releases earlier services when the actual projection worker cannot start", async () => {
    await expect(start({ longitudinalWorkerEntry: new URL("./fixtures/nonexistent-startup-thread.js", import.meta.url) }))
      .rejects.toMatchObject({ name: "LongitudinalWorkerStartError", reason: "worker_start_failed" });
    assertReleased();
    expect(released).toEqual(["review", "evidence queue", "provider health", "database"]);
  });

  it("drains Review once before closing the real application's database", async () => {
    const application = await start();
    await owners.at(-1)!.close();
    expect(application.server.listening).toBe(false);
    expect(released.filter(name => name === "review")).toEqual(["review"]);
    expect(released.indexOf("review")).toBeLessThan(released.indexOf("database"));
  });

  it("starts the same native deployment and database successfully after a refused startup", async () => {
    await expect(start({ valenceRegisterPath: invalid })).rejects.toThrow("VALENCE_REGISTER_INVALID");
    assertReleased();
    const application = await start();
    await new Promise<void>((resolve, reject) => {
      application.server.once("error", reject);
      application.server.listen(0, "127.0.0.1", resolve);
    });
    const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    const health = await fetch(`${origin}/healthz`);
    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({ status: "ok", engineMode: "maia", longitudinal: { status: "ready" } });
    expect(supervisors.size).toBe(2);
    expect(ready.size).toBe(2);
    const [failed, recovered] = [...supervisors];
    expect(failed!.health("stockfish-analysis").status).toBe("stopped");
    expect(recovered!.health("stockfish-analysis").status).toBe("ready");
  });
});
