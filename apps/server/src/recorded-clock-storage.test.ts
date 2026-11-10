import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { commitMove, fork } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readPortableAccountBundle, planAccountRestore } from "./account-import.js";
import { parseStoredClockDocument, recordedMovetextDigest } from "./recorded-clock-document.js";
import { parseRecordedClockGame } from "./pgn-import.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const AT = "2026-11-05T00:00:00.000Z";
const PGN = '[Event "Clocks"]\n[TimeControl "300+2"]\n\n1. e4 {private note [%clk 0:04:59.125]} e5 2. Nf3 {[%clk bad]} Nc6 {[%clk 0:04:57]} *';
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
const stores: SQLiteRunStorage[] = [], directories: string[] = [], databases: DatabaseSync[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  for (const db of databases.splice(0)) db.close();
  for (const store of stores.splice(0)) store.close();
  for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true });
});
function installation() {
  const dir = mkdtempSync(join(tmpdir(), "recorded-clock-")); directories.push(dir);
  const file = join(dir, "tabiya.sqlite"), storage = new SQLiteRunStorage(file, { onMigration: () => {}, now: () => AT }); stores.push(storage);
  storage.createLearner({ id: "owner", handle: "owner", passwordHash: "!", createdAt: AT });
  const sql = new DatabaseSync(file); databases.push(sql);
  return { file, storage, sql, service: new RunService(storage) };
}
async function imported(ctx: ReturnType<typeof installation>, pgn = PGN, id = "clock-run") {
  return ctx.service.importGame({ id, side: "white", source: { kind: "pgn", pgn }, opponentPolicy: { mode: "human_common" }, policyConfig, seed: 1, createdAt: AT }, { writerId: "writer", learnerId: "owner" });
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

describe("retained original clock document: actual SQL/account image", () => {
  it("upgrades an actual populated schema31 once, preserving every prior run byte and initializing only null", async () => {
    const source = installation(); await imported(source);
    const file = join(directories.at(-1)!, "schema31.sqlite");
    SQLiteRunStorage.materializeStorageVersion(file, 31);
    const old = new DatabaseSync(file);
    old.prepare("ATTACH DATABASE ? AS prior").run(source.file);
    for (const table of ["learners", "drill_runs", "run_grants"]) old.exec(`INSERT OR IGNORE INTO ${table} SELECT * FROM prior.${table}`);
    old.exec("INSERT INTO imported_games (run_id,source_kind,source_url,movetext_digest,headers_json,result,pgn,licence_note,imported_at) SELECT run_id,source_kind,source_url,movetext_digest,headers_json,result,pgn,licence_note,imported_at FROM prior.imported_games");
    const before = old.prepare("SELECT snapshot_json FROM drill_runs WHERE id='clock-run'").get()!.snapshot_json;
    expect(old.prepare("PRAGMA table_info(imported_games)").all().map(row => row.name)).not.toContain("clock_document_json");
    old.close();
    const migrations: number[] = [], upgraded = new SQLiteRunStorage(file, { onMigration: entry => migrations.push(entry.version) }); stores.push(upgraded);
    expect(migrations).toEqual([32, 33, 34, 35, 36]);
    expect(upgraded.importedGame("clock-run")!.clockDocument).toBeNull();
    const inspect = new DatabaseSync(file); databases.push(inspect);
    expect(inspect.prepare("SELECT snapshot_json FROM drill_runs WHERE id='clock-run'").get()!.snapshot_json).toBe(before);
    const repeated = new SQLiteRunStorage(file, { onMigration: entry => migrations.push(entry.version) }); stores.push(repeated);
    expect(migrations).toEqual([32, 33, 34, 35, 36]);
  });

  it.each(["paste", "fetch"] as const)("persists %s extraction atomically with every original node and no annotation prose", async kind => {
    const ctx = installation();
    const service = kind === "fetch" ? new RunService(ctx.storage, { importFetch: async () => new Response(PGN) }) : ctx.service;
    const result = await service.importGame({ id: "clock-run", side: "black", source: kind === "fetch" ? { kind: "lichess", url: "https://lichess.org/abcd1234" } : { kind: "pgn", pgn: PGN }, opponentPolicy: { mode: "human_common" }, policyConfig, seed: 1 }, { writerId: "writer", learnerId: "owner" });
    const record = ctx.storage.importedGame(result.run.id)!;
    expect(record.clockDocument).toEqual(result.importRecord.clockDocument);
    expect(record.clockDocument).toMatchObject({ status: "ready", retention: "extracted_before_strip", originalNodeIds: result.run.nodes.map(node => node.id),
      samples: [{ sourcePly: 1, side: "white", moveUci: "e2e4", remainingMs: 299125 }, { sourcePly: 4, side: "black", moveUci: "b8c6", remainingMs: 297000 }], issues: [{ sourcePly: 3, reason: "invalid_clock" }] });
    expect(record.pgn).not.toMatch(/%clk|private/);
    const row = ctx.sql.prepare("SELECT clock_document_json FROM imported_games").get()!;
    expect(String(row.clock_document_json)).not.toMatch(/%clk|private/);
    expect(ctx.sql.prepare("PRAGMA table_info(imported_games)").all().map(row => row.name)).not.toContain("timeControl");
  });

  it("rolls back run/grant/clock rows on insert failure and retries the same actual import", async () => {
    const ctx = installation();
    ctx.sql.exec("CREATE TRIGGER reject_clock BEFORE INSERT ON imported_games BEGIN SELECT RAISE(ABORT,'owned clock interruption'); END");
    await expect(imported(ctx)).rejects.toMatchObject({ code: "STORAGE_FAILURE" });
    for (const table of ["drill_runs", "run_grants", "imported_games"]) expect(ctx.sql.prepare(`SELECT count(*) AS n FROM ${table}`).get()!.n).toBe(0);
    expect(ctx.storage.read("clock-run")).toBeUndefined();
    ctx.sql.exec("DROP TRIGGER reject_clock");
    await expect(imported(ctx)).resolves.toHaveProperty("importRecord.clockDocument.status", "ready");
  });

  it("distinguishes complete extraction-empty from legacy null and parsed-empty unknown retention", async () => {
    const ctx = installation(), result = await imported(ctx, "1. e4 e5 *");
    expect(result.importRecord.clockDocument).toMatchObject({ status: "ready", retention: "extracted_before_strip", samples: [], issues: [] });
    ctx.sql.exec("UPDATE imported_games SET clock_document_json=NULL");
    expect(ctx.storage.importedGame(result.run.id)!.clockDocument).toBeNull();
    const before = ctx.sql.prepare("SELECT snapshot_json,updated_at FROM drill_runs").get();
    const filled = ctx.storage.ensureRecordedClockDocument(result.run.id);
    expect(filled.clockDocument).toMatchObject({ status: "ready", retention: "legacy_stored_pgn", samples: [], issues: [] });
    expect(ctx.storage.ensureRecordedClockDocument(result.run.id)).toEqual(filled);
    expect(ctx.sql.prepare("SELECT snapshot_json,updated_at FROM drill_runs").get()).toEqual(before);
  });

  it("backfills genuinely retained legacy annotations, leaves null on an interrupted commit and retries", async () => {
    const ctx = installation(); await imported(ctx);
    ctx.sql.prepare("UPDATE imported_games SET pgn=?,clock_document_json=NULL").run(PGN);
    ctx.sql.exec("CREATE TRIGGER reject_clock BEFORE UPDATE OF clock_document_json ON imported_games BEGIN SELECT RAISE(ABORT,'clock interruption'); END");
    expect(() => ctx.storage.ensureRecordedClockDocument("clock-run")).toThrow();
    expect(ctx.sql.prepare("SELECT clock_document_json FROM imported_games").get()!.clock_document_json).toBeNull();
    ctx.sql.exec("DROP TRIGGER reject_clock");
    expect(ctx.storage.ensureRecordedClockDocument("clock-run").clockDocument).toMatchObject({ retention: "legacy_stored_pgn", samples: [{ sourcePly: 1, remainingMs: 299125 }, { sourcePly: 4, remainingMs: 297000 }] });
  });

  it("retains a real second-connection winner published between the null read and CAS", async () => {
    const ctx = installation(), result = await imported(ctx), winner = result.importRecord.clockDocument;
    ctx.sql.exec("UPDATE imported_games SET clock_document_json=NULL");
    const read = ctx.storage.read.bind(ctx.storage);
    vi.spyOn(ctx.storage, "read").mockImplementationOnce(id => {
      // The other SQL connection publishes the actual earlier extraction, while this reader
      // is preparing its legacy candidate. Its real WHERE NULL must not overwrite the winner.
      ctx.sql.prepare("UPDATE imported_games SET clock_document_json=? WHERE run_id=? AND clock_document_json IS NULL").run(JSON.stringify(winner), id);
      return read(id);
    });
    expect(ctx.storage.ensureRecordedClockDocument("clock-run").clockDocument).toEqual(winner);
    expect(ctx.storage.ensureRecordedClockDocument("clock-run").clockDocument).toMatchObject({ retention: "extracted_before_strip" });
  });

  it("keeps corrupt persisted JSON documents as failures rather than empty rewrites", async () => {
    const ctx = installation(); await imported(ctx);
    ctx.sql.exec("UPDATE imported_games SET clock_document_json='{}'");
    expect(() => ctx.storage.importedGame("clock-run")).toThrow();
    expect(() => ctx.storage.ensureRecordedClockDocument("clock-run")).toThrow();
    expect(ctx.sql.prepare("SELECT clock_document_json FROM imported_games").get()!.clock_document_json).toBe("{}");
  });

  it("D4125 does not persist an unexpected internal TypeError as a terminal original-identity verdict", async () => {
    const ctx = installation(); await imported(ctx);
    ctx.sql.exec("UPDATE imported_games SET clock_document_json=NULL");
    const originalRead = ctx.storage.read.bind(ctx.storage), real = originalRead("clock-run")!;
    const failedNodes = new Proxy(real.run.nodes, { get(target, key, receiver) {
      if (key === "find") throw new TypeError("owned internal clock fault");
      return Reflect.get(target, key, receiver);
    } });
    vi.spyOn(ctx.storage, "read").mockReturnValueOnce({ ...real, run: { ...real.run, nodes: failedNodes } });
    expect(() => ctx.storage.ensureRecordedClockDocument("clock-run")).toThrow(/owned internal clock fault/);
    expect(ctx.sql.prepare("SELECT clock_document_json FROM imported_games").get()!.clock_document_json).toBeNull();
    expect(ctx.storage.ensureRecordedClockDocument("clock-run").clockDocument).toMatchObject({ status: "ready", retention: "legacy_stored_pgn" });
  });

  it.each(["source_too_large", "invalid_stored_pgn", "original_import_identity_unresolved"] as const)("persists terminal legacy %s without an invented successful sample population", async reason => {
    const ctx = installation(); await imported(ctx);
    const pgn = reason === "source_too_large" ? "x".repeat(65537) : reason === "invalid_stored_pgn" ? "1. e4 e4 *" : "1. d4 d5 *";
    ctx.sql.prepare("UPDATE imported_games SET pgn=?,clock_document_json=NULL").run(pgn);
    expect(ctx.storage.ensureRecordedClockDocument("clock-run").clockDocument).toEqual({ version: 1, status: "unavailable", retention: "legacy_stored_pgn", movetextDigest: ctx.storage.importedGame("clock-run")!.movetextDigest, reason });
  });

  it("exports/restores exact typed clocks and removes them with the run/account lifecycle", async () => {
    const ctx = installation(), result = await imported(ctx), bundle = ctx.storage.accountBundle("owner");
    expect(bundle.ownedRuns.value[0]!.importedGame!.clockDocument).toEqual(result.importRecord.clockDocument);
    const target = installation(), plan = planAccountRestore(readPortableAccountBundle(clone(bundle)));
    target.storage.restoreAccountBundle("owner", plan, { commit: true, at: AT });
    expect(target.storage.importedGame("clock-run")!.clockDocument).toEqual(result.importRecord.clockDocument);
    expect(target.storage.importedGame("clock-run")!.pgn).not.toMatch(/%clk|private/);
    const preview = target.storage.deletionPreview("owner", { kind: "run", runId: "clock-run" }, AT);
    target.storage.deleteOwnedRun("owner", "clock-run", AT, preview.digest);
    expect(target.storage.importedGame("clock-run")).toBeUndefined();
    const accountPreview = ctx.storage.deletionPreview("owner", { kind: "account" }, AT);
    ctx.storage.deleteLearner("owner", AT, accountPreview.digest);
    expect(ctx.sql.prepare("SELECT count(*) AS n FROM imported_games").get()!.n).toBe(0);
  });

  it("extracts old account clock bytes before restore strips them; absent legacy member is not new extraction-empty", async () => {
    const ctx = installation(); await imported(ctx);
    const old = clone(ctx.storage.accountBundle("owner"));
    const game = old.ownedRuns.value[0]!.importedGame!;
    const legacy = { ...game, pgn: PGN } as Record<string, unknown>; delete legacy.clockDocument;
    const input = { ...old, ownedRuns: { ...old.ownedRuns, value: [{ ...old.ownedRuns.value[0]!, importedGame: legacy }] } };
    const plan = planAccountRestore(readPortableAccountBundle(input));
    expect(plan.runs[0]!.importedGame!.clockDocument).toMatchObject({ status: "ready", retention: "legacy_stored_pgn", samples: [{ sourcePly: 1, remainingMs: 299125 }, { sourcePly: 4, remainingMs: 297000 }] });
    expect(plan.runs[0]!.importedGame!.pgn).not.toMatch(/private|%clk/);
  });

  it("refuses closed/numeric/cardinality/move/map corruptions before restore writes any row", async () => {
    const ctx = installation(), importedResult = await imported(ctx), record = importedResult.importRecord;
    const document = clone(record.clockDocument)!;
    if (document.status !== "ready") throw new Error("genuine extracted fixture required");
    const corruptions = [
      { ...document, extra: true }, { ...document, version: 2 }, { ...document, originalNodeIds: [...document.originalNodeIds].reverse() },
      { ...document, originalNodeIds: document.originalNodeIds.slice(1) }, { ...document, originalNodeIds: Array.from({length: 302}, (_, i) => String(i)) },
      { ...document, samples: [{ ...document.samples[0], remainingMs: -1 }] },
      { ...document, samples: [{ ...document.samples[0], remainingMs: Number.MAX_SAFE_INTEGER + 1 }] },
      { ...document, samples: [{ ...document.samples[0], side: "black" }] }, { ...document, samples: [{ ...document.samples[0], moveUci: "d2d4" }] },
      { ...document, samples: [document.samples[0], document.samples[0]] }, { ...document, issues: [{ sourcePly: 1, reason: "invalid_clock" }] },
      { ...document, issues: [{ sourcePly: 0, reason: "duplicate_clock" }] }, { ...document, issues: [{ sourcePly: 5, reason: "invalid_clock" }] },
    ];
    const bundle = ctx.storage.accountBundle("owner"), target = installation();
    for (const bad of corruptions) {
      expect(() => parseStoredClockDocument(bad, record, importedResult.run)).toThrow();
      const input = { ...bundle, ownedRuns: { ...bundle.ownedRuns, value: [{ ...bundle.ownedRuns.value[0]!, importedGame: { ...bundle.ownedRuns.value[0]!.importedGame!, clockDocument: bad } }] } };
      expect(() => planAccountRestore(readPortableAccountBundle(input))).toThrow();
      expect(target.sql.prepare("SELECT count(*) AS n FROM drill_runs").get()!.n).toBe(0);
    }
  });

  it("D4123 refuses a truncated or extended source even when its PGN, digest, samples and map agree", async () => {
    const ctx = installation(), result = await imported(ctx), bundle = ctx.storage.accountBundle("owner");
    const doc = result.importRecord.clockDocument!;
    if (doc.status !== "ready") throw new Error("genuine extraction required");
    const pgn = '1. e4 e5 *', digest = recordedMovetextDigest(parseRecordedClockGame(pgn).game);
    const shortened = { ...result.importRecord, pgn, movetextDigest: digest, clockDocument: { ...doc, movetextDigest: digest, originalNodeIds: doc.originalNodeIds.slice(0, 3), samples: doc.samples.filter(sample => sample.sourcePly <= 2), issues: [] } };
    const input = { ...bundle, ownedRuns: { ...bundle.ownedRuns, value: [{ ...bundle.ownedRuns.value[0]!, importedGame: (() => { const { runId: _run, ...record } = shortened; return record; })() }] } };
    expect(() => planAccountRestore(readPortableAccountBundle(input))).toThrow();
    expect(() => parseStoredClockDocument(shortened.clockDocument, shortened, result.run)).toThrow();
    const extendedRun = commitMove(result.run, "f1b5", { at: AT }).run;
    expect(parseStoredClockDocument(doc, result.importRecord, extendedRun)).toEqual(doc);
    const extendedPgn = "1. e4 e5 2. Nf3 Nc6 3. Bb5 *", extendedDigest = recordedMovetextDigest(parseRecordedClockGame(extendedPgn).game);
    const extendedDoc = { ...doc, movetextDigest: extendedDigest, originalNodeIds: [...doc.originalNodeIds, extendedRun.activeCursor.nodeId] };
    const extendedRecord = { ...result.importRecord, pgn: extendedPgn, movetextDigest: extendedDigest, clockDocument: extendedDoc };
    expect(() => parseStoredClockDocument(extendedDoc, extendedRecord, extendedRun)).toThrow(/session/);
    const { runId: _runId, ...exportedRecord } = extendedRecord;
    const extendedInput = { ...bundle, ownedRuns: { ...bundle.ownedRuns, value: [{ ...bundle.ownedRuns.value[0]!, snapshot: { kind: "parsed", value: extendedRun }, importedGame: exportedRecord }] } };
    expect(() => planAccountRestore(readPortableAccountBundle(extendedInput))).toThrow();
  });

  it("retains genuine original ancestors after a real fork and refuses equal-FEN alternate node mapping", async () => {
    const ctx = installation(), result = await imported(ctx), doc = result.importRecord.clockDocument!;
    if (doc.status !== "ready") throw new Error("genuine extraction required");
    const forked = fork(result.run, result.run.nodes[0]!.id, { label: "same move", at: AT }).run;
    const alternative = commitMove(forked, "e2e4", { at: AT }).run;
    const alt = alternative.nodes.find(node => node.id === alternative.activeCursor.nodeId)!;
    expect(alt.fen).toBe(result.run.nodes[1]!.fen);
    expect(alt.id).not.toBe(result.run.nodes[1]!.id);
    expect(parseStoredClockDocument(doc, result.importRecord, alternative)).toEqual(doc);
    const mapping = [...doc.originalNodeIds]; mapping[1] = alt.id;
    expect(() => parseStoredClockDocument({ ...doc, originalNodeIds: mapping }, result.importRecord, alternative)).toThrow(/mapping/);
  });

  it("D4124 rejects JSON arrays in literal unions through actual getters and account restore", async () => {
    const ctx = installation(), result = await imported(ctx), bundle = ctx.storage.accountBundle("owner"), doc = result.importRecord.clockDocument!;
    if (doc.status !== "ready") throw new Error("genuine extraction required");
    const corruptions = [
      { ...doc, retention: ["extracted_before_strip"] },
      { ...doc, issues: [{ sourcePly: 3, reason: ["invalid_clock"] }] },
      { version: 1, status: "unavailable", retention: "legacy_stored_pgn", movetextDigest: doc.movetextDigest, reason: ["source_too_large"] },
    ];
    for (const bad of corruptions) {
      ctx.sql.prepare("UPDATE imported_games SET clock_document_json=?").run(JSON.stringify(bad));
      expect(() => ctx.storage.importedGame("clock-run")).toThrow();
      const input = { ...bundle, ownedRuns: { ...bundle.ownedRuns, value: [{ ...bundle.ownedRuns.value[0]!, importedGame: { ...bundle.ownedRuns.value[0]!.importedGame!, clockDocument: bad } }] } };
      expect(() => planAccountRestore(readPortableAccountBundle(input))).toThrow();
    }
  });
});
