import { SQLiteRunStorage } from "./storage.js";
import { serializeAccountBundle } from "./account-data.js";
import { readPortableAccountBundle, planAccountRestore } from "./account-import.js";
import { readProfileGameSource } from "./profile-game-source.js";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import { rmSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { appendOpponentPly, commitMove, type DrillRun } from "@chess-tabiya/runtime";
import * as execution from "../../../packages/runtime/src/evidence-binding-execution.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { consumeProfileGameFacts, joinProfileGameRights } from "./profile-game-facts.js";
import { collectProfileGameRights } from "../../../packages/runtime/src/internal/profile-game-facts.js";
import { assertProfileGameFactReferences } from "./profile-game-fact-references.js";
import { preflightProfileGameFacts } from "../../../packages/runtime/src/internal/profile-game-facts.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../../packages/runtime/src/evidence-catalog.js";
import { parseLongitudinalGameFactRow } from "./profile-game-facts-contract.js";
import { LONGITUDINAL_TABLES, LongitudinalStore } from "./longitudinal-store.js";
import { OBSERVATION_DERIVATION_REV } from "./longitudinal-registry.js";
import { parseLongitudinalReadQuery } from "./longitudinal-contract.js";
import { projectObservations } from "./longitudinal-projector.js";
import { runLongitudinalBatch } from "./longitudinal-worker-core.js";
import { LONGITUDINAL_WORKER_DEFAULTS } from "./longitudinal-worker-config.js";
import { AT, fileFixture, learner, positionRun, FIXTURE_DEPENDENCIES, type FileFixture } from "./longitudinal-test-fixtures.js";
const fixtures: FileFixture[] = [], databases: DatabaseSync[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const db of databases.splice(0)) db.close(); for (const f of fixtures.splice(0)) { f.storage.close(); rmSync(dirname(f.path), { recursive: true, force: true }); } });
const selection = (moveUci: string) => ({ moveUci, policyModeApplied: "enumerated" as const, engine: { id: "scripted-game-fixture", name: "Scripted test replay", version: "1", seedHonored: true } });
function native(side: "white" | "black", moves?: readonly string[]): DrillRun {
  let run = positionRun("game-facts", undefined, side);
  const line = moves ?? (side === "white" ? ["g2g3", "d7d5", "f1g2", "g8f6", "g1f3", "e7e6"] : ["e2e4", "g7g6", "g1f3", "f8g7", "g2g3", "g8f6"]);
  for (const [index, move] of line.entries()) run = ((index % 2 === 0) === (side === "white") ? commitMove(run, move, { at: AT }) : appendOpponentPly(run, selection(move), { at: AT })).run;
  return run;
}
function fixture(run = native("white")) {
  const f = fileFixture("tabiya-game-facts-"); fixtures.push(f);
  const lease = learner(f.storage, "game-facts-owner"); f.storage.create(run, lease);
  const db = new DatabaseSync(f.path); db.exec("PRAGMA foreign_keys=ON"); databases.push(db);
  const store = new LongitudinalStore(db, { now: () => f.clock.now });
  return { ...f, lease, db, store, run };
}
function source(f: ReturnType<typeof fixture>) {
  const claim = f.store.claimBatch({ workerId: "facts", scanLimit: 1, slots: 1, leaseMs: 60_000 })[0]!;
  const image = f.store.claimSourceImage(claim)!;
  return { claim, image, gameSource: f.store.openClaimedGameSource(claim, image) };
}
function batch(f: ReturnType<typeof fixture>) {
  return runLongitudinalBatch(f.store, LONGITUDINAL_WORKER_DEFAULTS, "facts", {
    project: (image, checkpoint, gameSource) => projectObservations(image, { checkpoint, gameSource, dependencies: FIXTURE_DEPENDENCIES }),
  });
}
function query(include = true, filter = {}) {
  return parseLongitudinalReadQuery({ learnerId: "game-facts-owner", derivationRev: OBSERVATION_DERIVATION_REV,
    through: { kind: "all_complete" }, filter, ...(include ? { includeGameFacts: true } : {}) });
}
describe("actual three-source GAME consumer", () => {
  for (const side of ["white", "black"] as const) it(`retains earliest ${side} setup/screen and the original first-owner BEFORE`, () => {
    const f = fixture(native(side)), s = source(f);
    const row = consumeProfileGameFacts(s.image, { gameSource: s.gameSource, derivedRev: OBSERVATION_DERIVATION_REV });
    const first = side === "white" ? 0 : 1, setup = side === "white" ? 3 : 4, screen = side === "white" ? 5 : 6;
    expect(row.game).toEqual({ kind: "eligible", firstOwnerDecision: { nodeId: f.run.nodes[first]!.id, eventSeq: first === 0 ? 1 : 3, sourcePly: first },
      fianchetto: { kind: "observed", first: expect.objectContaining({ nodeId: f.run.nodes[setup]!.id, sourcePly: setup }) },
      knightScreen: { kind: "observed", first: expect.objectContaining({ nodeId: f.run.nodes[screen]!.id, sourcePly: screen }) },
      castling: { kind: "observed", before: expect.objectContaining({ nodeId: f.run.nodes[first]!.id, sourcePly: first }), kingside: true, queenside: true } });
    f.store.closeGameSource(s.gameSource);
  });
  it("complete empty snapshots are observed-none, while missing worker context stays unavailable", () => {
    const f = fixture(native("white", ["e2e4", "e7e5"])), s = source(f);
    const actual = consumeProfileGameFacts(s.image, { gameSource: s.gameSource, derivedRev: OBSERVATION_DERIVATION_REV });
    expect(actual.game).toMatchObject({ fianchetto: { kind: "observed", first: null }, knightScreen: { kind: "observed", first: null } });
    const bare = consumeProfileGameFacts(s.image, { derivedRev: OBSERVATION_DERIVATION_REV });
    expect(bare.game).toMatchObject({ kind: "eligible", fianchetto: { kind: "unavailable", reason: "worker_context_unavailable" } });
    expect(() => consumeProfileGameFacts({ ...s.image }, { gameSource: s.gameSource, derivedRev: OBSERVATION_DERIVATION_REV })).toThrow(/identical/u);
  });
  it("same-side scripted actions stay in the old cohort without becoming proved negatives", () => {
    let run = positionRun("game-facts");
    for (const move of ["e2e3", "e7e6", "e1e2", "g8f6"]) run = appendOpponentPly(run, selection(move), { at: AT }).run;
    run = commitMove(run, "g1f3", { at: AT }).run;
    const f = fixture(run), s = source(f), row = consumeProfileGameFacts(s.image, { gameSource: s.gameSource, derivedRev: OBSERVATION_DERIVATION_REV });
    expect(row.game).toMatchObject({ kind: "eligible", firstOwnerDecision: { nodeId: run.nodes[4]!.id, sourcePly: 4 },
      castling: { kind: "unavailable", reason: "role_unavailable" }, fianchetto: { kind: "unavailable", reason: "role_unavailable" } });
    const baseline = collectProfileGameRights((readProfileGameSource(s.gameSource)).prefix);
    if (baseline.kind !== "available" || row.game.kind !== "eligible") throw Error("missing original source");
    expect(baseline.value.payload.firstDecisionNodeId).toBe(run.nodes[0]!.id);
    expect(joinProfileGameRights(baseline.value.payload, row.game.firstOwnerDecision)).toEqual({ kind: "unavailable", reason: "source_subject_mismatch" });
  });
  it("failed complete consumer preflight reads zero factories", () => {
    const f = fixture(), s = source(f), collect = vi.spyOn(routes, "invokeEvidenceValueRoute");
    vi.spyOn(execution, "compileEvidenceConsumerExecution").mockImplementation(() => { throw new TypeError("unavailable exact consumer"); });
    expect(() => consumeProfileGameFacts(s.image, { gameSource: s.gameSource, derivedRev: OBSERVATION_DERIVATION_REV })).toThrow(/exact consumer/u);
    expect(collect).not.toHaveBeenCalled();
  });
  it("rejects a crossed machine binding even when all three source refs still match", () => {
    const manifest = { ...PRIMARY_EVIDENCE_MANIFEST, bindings: PRIMARY_EVIDENCE_MANIFEST.bindings.map(binding => binding.consumer.id === "profile.game_facts"
      ? { ...binding, forms: ["panel" as const] } : binding) };
    expect(() => preflightProfileGameFacts(manifest)).toThrow();
  });
  it("rejects a genuine setup delivered for another original FEN", () => {
    const f = fixture(), s = source(f), invoke = routes.invokeEvidenceValueRoute;
    const foreign = invoke("rules.structural.reading.fianchetto_setup@1", { fen: "7k/8/8/8/8/8/8/K7 w - - 0 1" });
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) => route === "rules.structural.reading.fianchetto_setup@1" ? foreign : invoke(route as never, input)) as unknown as typeof invoke);
    expect(() => consumeProfileGameFacts(s.image, { gameSource: s.gameSource, derivedRev: OBSERVATION_DERIVATION_REV })).toThrow();
  });
  it("rejects a screen from a separately issued setup even at the same FEN", () => {
    const f = fixture(), s = source(f), invoke = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: { source?: { payload: { fen: string } } }) => {
      if (route !== "rules.structural.reading.fianchetto_knight_screen@1") return invoke(route as never, input as never);
      const duplicate = invoke("rules.structural.reading.fianchetto_setup@1", { fen: input.source!.payload.fen });
      return invoke("rules.structural.reading.fianchetto_knight_screen@1", { source: duplicate });
    }) as unknown as typeof invoke);
    expect(() => consumeProfileGameFacts(s.image, { gameSource: s.gameSource, derivedRev: OBSERVATION_DERIVATION_REV })).toThrow(/identical original setup/u);
  });
  it("rejects a genuine baseline from a different original prefix with the same board bytes", () => {
    const f = fixture(), s = source(f), other = fixture(), t = source(other), invoke = routes.invokeEvidenceValueRoute;
    const foreign = invoke("run.record.castling_eligibility@1", { prefix: readProfileGameSource(t.gameSource).prefix });
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) => route === "run.record.castling_eligibility@1" ? foreign : invoke(route as never, input)) as unknown as typeof invoke);
    expect(() => consumeProfileGameFacts(s.image, { gameSource: s.gameSource, derivedRev: OBSERVATION_DERIVATION_REV })).toThrow();
  });
  it("retains genuine first-decision absence on a prefix with no represented stored-color turn", () => {
    const f = fixture(native("black", [])), s = source(f);
    expect(collectProfileGameRights(readProfileGameSource(s.gameSource).prefix)).toEqual({ kind: "unavailable", reason: "first_decision_not_represented" });
    expect(consumeProfileGameFacts(s.image, { gameSource: s.gameSource, derivedRev: OBSERVATION_DERIVATION_REV }).game).toEqual({ kind: "ineligible", reason: "no_primary_played_decision" });
  });
  it("refuses a substituted known absence when the genuine prefix contains the baseline", () => {
    const f = fixture(), s = source(f), invoke = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) => route === "run.record.castling_eligibility@1"
      ? { kind: "unavailable", reason: "first_decision_not_represented" } : invoke(route as never, input)) as unknown as typeof invoke);
    expect(() => consumeProfileGameFacts(s.image, { gameSource: s.gameSource, derivedRev: OBSERVATION_DERIVATION_REV })).toThrow(/source absence/u);
  });
  it("source authority/execution faults fail the actual job, without publishing unavailable evidence", () => {
    const f = fixture(), invoke = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) => {
      if (route === "rules.structural.reading.fianchetto_setup@1") throw new TypeError("controlled source authority failure");
      return invoke(route as never, input);
    }) as unknown as typeof invoke);
    expect(batch(f).failed).toBe(1);
    expect(f.db.prepare("SELECT count(*) AS n FROM learner_game_facts").get()).toMatchObject({ n: 0 });
    expect(f.store.jobs()[0]).toMatchObject({ state: "retry_wait", failureCode: "derivation_failed" });
  });
});
// D4205: the complete source/storage lifecycle owns a 30s correctness integration budget.
// The preceding source-consumer unit group and dedicated performance gates keep their limits.
describe("atomic fourth derived family and strict read lane", { timeout: 30_000 }, () => {
  for (const changed of ["rights", "first snapshot"] as const) it(`refuses a copied original row with changed ${changed}`, () => {
    const f = fixture(), s = source(f), original = projectObservations(s.image, { gameSource: s.gameSource, dependencies: FIXTURE_DEPENDENCIES });
    const row = original.gameFacts[0]!;
    if (row.game.kind !== "eligible" || row.game.castling.kind !== "observed") throw Error("missing observed original");
    const game = changed === "rights" ? { ...row.game, castling: { ...row.game.castling, kingside: false } }
      : { ...row.game, fianchetto: { kind: "observed" as const, first: { nodeId: f.run.nodes[1]!.id, eventSeq: 2, sourcePly: 1 } } };
    expect(() => f.store.publish(s.claim, { ...original, gameFacts: Object.freeze([parseLongitudinalGameFactRow({ ...row, game })]) })).toThrow(/OWNER/u);
    expect(f.db.prepare("SELECT count(*) AS n FROM learner_game_facts").get()).toMatchObject({ n: 0 });
  });
  it("refuses context-free rows at production publication and rebuild", () => {
    const f = fixture(), s = source(f), direct = projectObservations(s.image, { dependencies: FIXTURE_DEPENDENCIES });
    expect(() => f.store.publish(s.claim, direct)).toThrow(/OWNER/u);
    const original = projectObservations(s.image, { gameSource: s.gameSource, dependencies: FIXTURE_DEPENDENCIES });
    expect(f.store.publish(s.claim, original)).toBe("published");
    for (const write of [false, true]) expect(() => f.store.rebuild({ write, project: image => projectObservations(image, { dependencies: FIXTURE_DEPENDENCIES }) })).toThrow(/OWNER/u);
  });
  it("publishes an original result across renewal, but rejects a same-byte foreign store row", () => {
    const f = fixture(), s = source(f), original = projectObservations(s.image, { gameSource: s.gameSource, dependencies: FIXTURE_DEPENDENCIES });
    const other = fixture(f.run), t = source(other), foreign = consumeProfileGameFacts(t.image, { gameSource: t.gameSource, derivedRev: OBSERVATION_DERIVATION_REV });
    expect(foreign).toEqual(original.gameFacts[0]);
    expect(() => f.store.publish(s.claim, { ...original, gameFacts: Object.freeze([foreign]) })).toThrow(/OWNER/u);
    f.clock.now += 1000;
    const renewed = f.store.renew(s.claim, 60_000)!;
    expect(f.store.publish(renewed, original)).toBe("published");
  });
  it("rebuild refuses an altered producer-row copy in both check and repair modes", () => {
    const f = fixture(); batch(f);
    const before = f.store.storedProjection(f.run.id);
    for (const write of [false, true]) expect(() => f.store.rebuild({ write, project: (image, options) => {
      const original = projectObservations(image, { ...options, dependencies: FIXTURE_DEPENDENCIES });
      return { ...original, gameFacts: Object.freeze([parseLongitudinalGameFactRow({ ...original.gameFacts[0]! })]) };
    } })).toThrow(/OWNER/u);
    expect(f.store.storedProjection(f.run.id)).toEqual(before);
  });
  it("publishes the actual row and keeps GAME independent of decision filters", () => {
    const f = fixture(); expect(batch(f).completed).toBe(1);
    const normal = f.store.readSnapshot(f.lease.learnerId, query());
    expect(normal.kind).toBe("complete"); if (normal.kind !== "complete") throw Error("incomplete");
    expect(normal.gameFacts).toHaveLength(1); expect(normal.gameFacts[0]).toMatchObject({ kind: "available", row: { game: { kind: "eligible", fianchetto: { kind: "observed" } } } });
    const filtered = f.store.readSnapshot(f.lease.learnerId, query(true, { phases: ["endgame"], decisionClasses: ["predicted"] }));
    expect(filtered).toMatchObject({ kind: "complete", observations: [], denominators: [], gameFacts: normal.gameFacts });
    expect(f.store.readSnapshot(f.lease.learnerId, query(false))).toMatchObject({ kind: "complete", gameFacts: [] });
    expect(() => parseLongitudinalReadQuery({ ...query(), includeGameFacts: false })).toThrow();
  });
  it("missing/malformed GAME rows preserve the original complete cut and decision rows; rebuild repairs", () => {
    const f = fixture(); batch(f);
    const original = f.store.storedProjection(f.run.id);
    f.db.prepare("UPDATE learner_game_facts SET game_json=? WHERE run_id=?").run(JSON.stringify({ ...original.gameFacts[0]!.game, extra: true }), f.run.id);
    expect(f.store.readSnapshot(f.lease.learnerId, query())).toMatchObject({ kind: "complete", denominators: original.denominators,
      gameFacts: [{ kind: "unavailable", reason: "game_facts_invalid" }] });
    const project = (image: Parameters<typeof projectObservations>[0], options: Parameters<typeof projectObservations>[1]) => projectObservations(image, { ...options, dependencies: FIXTURE_DEPENDENCIES });
    expect(f.store.rebuild({ write: false, project }).mismatches.length).toBeGreaterThan(0);
    f.store.rebuild({ write: true, project }); expect(f.store.storedProjection(f.run.id)).toEqual(original);
    f.db.prepare("DELETE FROM learner_game_facts WHERE run_id=?").run(f.run.id);
    expect(f.store.readSnapshot(f.lease.learnerId, query())).toMatchObject({ kind: "complete", observations: original.observations,
      gameFacts: [{ kind: "unavailable", reason: "game_facts_missing" }] });
  });
  it("wrong creation identity or a missing row refuses publication without changing any derived rows", () => {
    const f = fixture(), s = source(f), original = projectObservations(s.image, { gameSource: s.gameSource, dependencies: FIXTURE_DEPENDENCIES });
    const row = original.gameFacts[0]!; if (row.game.kind !== "eligible") throw Error("ineligible");
    const crossed = { ...row, game: { ...row.game, firstOwnerDecision: { ...row.game.firstOwnerDecision, eventSeq: 2 } } };
    expect(() => assertProfileGameFactReferences(crossed, s.image)).toThrow(/SOURCE_JOIN/u);
    expect(() => f.store.publish(s.claim, { ...original, gameFacts: Object.freeze([parseLongitudinalGameFactRow(crossed)]) })).toThrow(/OWNER/u);
    expect(() => f.store.publish(s.claim, { ...original, gameFacts: Object.freeze([]) })).toThrow(/CARDINALITY/u);
    for (const table of LONGITUDINAL_TABLES.filter(table => table !== "learner_observation_jobs")) expect(f.db.prepare(`SELECT count(*) AS n FROM ${table}`).get()).toMatchObject({ n: 0 });
    expect(f.store.publish(s.claim, original)).toBe("published");
  });
  it("strict data parser rejects extra fields, impossible scalar types and accessors without invoking them", () => {
    const f = fixture(), s = source(f), row = consumeProfileGameFacts(s.image, { gameSource: s.gameSource, derivedRev: OBSERVATION_DERIVATION_REV });
    expect(() => parseLongitudinalGameFactRow({ ...row, extra: true })).toThrow();
    expect(() => parseLongitudinalGameFactRow({ ...row, completedSeq: "1" })).toThrow();
    const get = vi.fn(() => row.game), accessor = { ...row }; Object.defineProperty(accessor, "game", { enumerable: true, get });
    expect(() => parseLongitudinalGameFactRow(accessor)).toThrow(); expect(get).not.toHaveBeenCalled();
  });
  it("an insert failure rolls back every family and the completion watermark", () => {
    const f = fixture(), s = source(f), original = projectObservations(s.image, { gameSource: s.gameSource, dependencies: FIXTURE_DEPENDENCIES });
    f.db.exec("CREATE TRIGGER refuse_game_row BEFORE INSERT ON learner_game_facts BEGIN SELECT RAISE(ABORT,'controlled GAME insert failure'); END");
    expect(() => f.store.publish(s.claim, original)).toThrow(/controlled GAME insert failure/u);
    for (const table of LONGITUDINAL_TABLES.filter(table => table !== "learner_observation_jobs")) expect(f.db.prepare(`SELECT count(*) AS n FROM ${table}`).get()).toMatchObject({ n: 0 });
    expect(f.store.jobs()[0]).toMatchObject({ state: "running", completedSeq: 0 });
    f.db.exec("DROP TRIGGER refuse_game_row");
    expect(f.store.publish(s.claim, original)).toBe("published");
  });
  it("upgrades schema32/revision6-shaped caches and rederives all six current families without rewriting play", () => {
    // Shaped predecessor cache, not a claim of genuinely executed revision6 output parity.
    const f = fixture(); batch(f);
    const snapshot = f.db.prepare("SELECT snapshot_json,summary_json FROM drill_runs WHERE id=?").get(f.run.id);
    const sourceBefore = f.storage.longitudinalSourceImageV4(f.run.id, f.run.events.length);
    f.db.exec("DROP TABLE learner_subject_observations; DROP TABLE learner_choice_facts; DROP TABLE learner_game_facts; UPDATE learner_observation_denominators SET derived_rev=6; UPDATE learner_observations SET derived_rev=6; UPDATE learner_structure_stats SET derived_rev=6; UPDATE learner_observation_jobs SET derived_rev=6; PRAGMA user_version=32");
    const migrations: number[] = [], upgraded = new SQLiteRunStorage(f.path, { onMigration: entry => migrations.push(entry.version) });
    try {
      expect(migrations).toEqual([33, 34, 35]);
      expect(upgraded.reconcileLongitudinalJobs().revisionReset).toBe(1);
      expect(f.store.jobs()[0]).toMatchObject({ state: "pending", completedSeq: 0, derivedRev: OBSERVATION_DERIVATION_REV });
      expect(batch(f).completed).toBe(1);
      expect(f.store.readSnapshot(f.lease.learnerId, query())).toMatchObject({ kind: "complete", gameFacts: [{ kind: "available", row: { derivedRev: OBSERVATION_DERIVATION_REV } }] });
      expect(f.db.prepare("SELECT snapshot_json,summary_json FROM drill_runs WHERE id=?").get(f.run.id)).toEqual(snapshot);
      expect(f.storage.longitudinalSourceImageV4(f.run.id, f.run.events.length)).toEqual(sourceBefore);
    } finally { upgraded.close(); }
    const reopened = new SQLiteRunStorage(f.path, { onMigration: () => {} });
    try { expect(reopened.reconcileLongitudinalJobs().revisionReset).toBe(0); expect(reopened.readLongitudinalSnapshot(f.lease.learnerId, query())).toMatchObject({ kind: "complete", gameFacts: [{ kind: "available" }] }); }
    finally { reopened.close(); }
  });
  it("account restore discards supplied GAME rows and rederives them for the actual restored owner", () => {
    const f = fixture(); batch(f);
    const exported = f.storage.accountBundle(f.lease.learnerId);
    const wire = JSON.parse(new TextDecoder().decode(serializeAccountBundle(exported).bytes));
    const supplied = wire.behavioralProfiles.value.find((record: { table: string }) => record.table === "learner_game_facts");
    expect(supplied).toBeDefined(); supplied.record.game_json = JSON.stringify({ kind: "ineligible", reason: "no_primary_played_decision" });
    const target = fixture(positionRun("unrelated-restore-run"));
    const restoredOwner = learner(target.storage, "restored-facts-owner");
    const plan = planAccountRestore(readPortableAccountBundle(wire));
    expect(target.storage.restoreAccountBundle(restoredOwner.learnerId, plan, { commit: true, at: AT })).toEqual([]);
    expect(target.db.prepare("SELECT * FROM learner_game_facts WHERE run_id=?").get(f.run.id)).toBeUndefined();
    expect(batch(target).failed).toBe(0);
    const row = target.store.storedProjection(f.run.id).gameFacts[0]!;
    expect(row).toMatchObject({ learnerId: restoredOwner.learnerId, game: { kind: "eligible", fianchetto: { kind: "observed" } } });
    expect(target.storage.foreignKeyViolationCount()).toBe(0);
  });
  it("exports the new private derived class and deletes it with its real account", () => {
    const f = fixture(); batch(f);
    const bundle = f.storage.accountBundle(f.lease.learnerId);
    expect(bundle.behavioralProfiles.value.filter(record => record.table === "learner_game_facts")).toHaveLength(1);
    f.storage.deleteLearner(f.lease.learnerId, AT);
    expect(f.db.prepare("SELECT count(*) AS n FROM learner_game_facts").get()).toMatchObject({ n: 0 });
  });
});
