// rfc/longitudinal-store.md §F — registry, parser, projector and source-identity acceptance
// (criteria 2, 3, 4, 9, 10, 12, 13-parser, 18, 19, 28). Storage/lifecycle criteria live in
// longitudinal-store.test.ts; worker reach in longitudinal-worker.test.ts.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { canonicalizeJson, type JsonValue } from "@chess-tabiya/schema/drill-pack";
import { appendEvents, fork, localSemanticEventClosure, rewind, type DrillRun } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import { rmSync } from "node:fs";
import { LongitudinalStore } from "./longitudinal-store.js";
import { fileFixture, learner } from "./longitudinal-test-fixtures.js";
import { OCCUPIED_TARGET_IDENTITY_CASES } from "../../../packages/runtime/src/testing/occupied-target-fixtures.js";

import {
  assertParsedLongitudinalReadQuery,
  parseDecisionRefs,
  parseLongitudinalJobRow,
  parseLongitudinalObservationRow,
  parseLongitudinalReadQuery,
} from "./longitudinal-contract.js";
import { decisionPopulation, normativeDecisions, projectObservations, RUNTIME_POPULATION_DEPENDENCIES } from "./longitudinal-projector.js";
import {
  LONGITUDINAL_ADMITTED_IDENTITIES,
  LONGITUDINAL_INGEST_REGISTRY,
  LONGITUDINAL_REGISTRY_DIGEST,
  OBSERVATION_DERIVATION_REV,
  ingestRegistryDigest,
  validateIngestRegistry,
  type LongitudinalConstructor,
} from "./longitudinal-registry.js";
import { LONGITUDINAL_SOURCE_DOMAIN, longitudinalSourceDigestV4, sealLongitudinalSourceImageV4, type MoveAuthorship } from "./longitudinal-source.js";
import { AT, FIXTURE_DEPENDENCIES, START_FEN, importedRun, play, positionRun, predict } from "./longitudinal-test-fixtures.js";
import { LONGITUDINAL_SUCCESSOR_FIXTURES, longitudinalRevisionFixtures } from "./longitudinal-revision-fixtures.js";

import { CANDIDATE_COLLECTOR_PROJECTION_KEYS } from "../../../packages/runtime/src/candidate-population-projections.generated.js";
import { NATIVE_SUBJECT_SOURCE_REFS } from "../../../packages/runtime/src/semantic-native-subject-types.js";
import { SUBJECT_OUTCOME_FAMILIES } from "../../../packages/runtime/src/semantic-subject-types.js";

const AUTHORITY = Object.freeze({ fixture: "contract" });

function image(run: DrillRun, options: { owner?: string; attribution?: "single_player" | "unattributable_shared" | "unattributable_legacy"; authorship?: (seq: number) => string | null; cut?: number } = {}) {
  const owner = options.owner ?? "owner";
  const cut = options.cut ?? run.events.length;
  const moveAuthorship: MoveAuthorship[] = run.events.slice(0, cut).flatMap((event) => event.type === "move.committed" && event.data.node.actor === "user"
    ? [{ eventSeq: event.seq, nodeId: event.data.node.id, learnerId: options.authorship === undefined ? owner : options.authorship(event.seq) }]
    : []);
  return sealLongitudinalSourceImageV4(AUTHORITY, {
    runId: run.id, requestedSeq: cut, storedEvents: run.events, ownerLearnerId: owner,
    moveAuthorship, structureAttribution: options.attribution ?? "single_player",
  });
}

describe("criterion 2 — literal registry closure", () => {
  it("matches current v3 artifacts with separate prevalence, native, complete-condition and deferred lanes", () => {
    const registryBytes = readFileSync(new URL("../../../rfc/contracts/longitudinal-ingest-registry-v3.json", import.meta.url));
    const signBytes = readFileSync(new URL("../../../rfc/contracts/longitudinal-sign-subsets-v3.json", import.meta.url));
    expect(JSON.parse(registryBytes.toString("utf8"))).toEqual(LONGITUDINAL_INGEST_REGISTRY);
    const signs = JSON.parse(signBytes.toString("utf8"));
    expect(signs).toEqual(Object.fromEntries(LONGITUDINAL_INGEST_REGISTRY.map(row => [`${row.projection.id}@${row.projection.version}`, row.signs])));
    expect(LONGITUDINAL_INGEST_REGISTRY).toHaveLength(65);
    expect(LONGITUDINAL_INGEST_REGISTRY.filter(row => row.kind === "edge")).toHaveLength(34);
    expect(LONGITUDINAL_INGEST_REGISTRY.filter(row => row.kind === "native")).toHaveLength(7);
    expect(LONGITUDINAL_INGEST_REGISTRY.filter(row => row.kind === "population")).toHaveLength(13);
    expect(LONGITUDINAL_INGEST_REGISTRY.filter(row => row.kind === "path")).toHaveLength(11);
    expect(LONGITUDINAL_INGEST_REGISTRY.find(row => row.projection.id === "derived.semantic_avoidance.loose_piece"))
      .toMatchObject({ kind: "population", projection: { version: 2 }, family: "loose_piece", sourceScope: "complete_factory_result", relations: ["false_to_true", "true_to_false", "true_to_true", "false_to_false"] });
    for (const identity of LONGITUDINAL_ADMITTED_IDENTITIES) {
      const row = LONGITUDINAL_INGEST_REGISTRY.find(row => row.projection.id === identity.projectionId)!;
      expect(row).toMatchObject({ kind: "edge", meaning: "event_prevalence", visibility: "operator_only" });
      expect([identity.matchProjectionId, identity.matchProjectionVersion]).toEqual([row.projection.id, row.projection.version]);
      expect(identity.semanticSign).toBe(identity.sourceSign);
    }
    expect(new Set(LONGITUDINAL_ADMITTED_IDENTITIES.map(row => row.projectionId)).size).toBe(34);
  });

  it("is set-equal to executed candidate event sources, native subjects and complete families", () => {
    const ref = (r: { projection: { id: string; version: number } }) => `${r.projection.id}@${r.projection.version}`;
    const candidate = Object.entries(CANDIDATE_COLLECTOR_PROJECTION_KEYS).filter(([group]) => group.startsWith("event.")).flatMap(([, refs]) => [...refs] as string[]);
    expect(candidate).toHaveLength(42);
    expect(candidate.filter(r => r === "derived.exchange.trade_completed@1")).toHaveLength(1);
    const local = LONGITUDINAL_INGEST_REGISTRY.filter(r => r.kind === "edge" || r.kind === "native");
    expect(new Set(local.map(ref))).toEqual(new Set(candidate.filter(r => r !== "derived.exchange.trade_completed@1")));
    expect(new Set(LONGITUDINAL_INGEST_REGISTRY.filter(r => r.kind === "native").map(ref))).toEqual(new Set(NATIVE_SUBJECT_SOURCE_REFS));
    expect(new Set(LONGITUDINAL_INGEST_REGISTRY.filter(r => r.kind === "population").map(ref))).toEqual(new Set(SUBJECT_OUTCOME_FAMILIES.map(f => `derived.semantic_avoidance.${f}@2`)));
    const paths = LONGITUDINAL_INGEST_REGISTRY.filter(r => r.kind === "path");
    expect(paths.every(r => r.kind === "path" && r.owner === "longitudinal-store:A.2" && r.reason.length > 0)).toBe(true);
    expect(paths.map(ref).sort()).toEqual([
      "derived.exchange.trade_completed@1", "derived.pawn.sequence.contact_timing@1", "derived.pawn.sequence.harassment_pressure@1",
      "derived.tactic.sequence.defender_consequence@1", "derived.tactic.deflection_observed@1", "derived.tactic.attraction_observed@1",
      "derived.tactic.line_blocker_clearance_observed@1", "derived.tactic.square_clearance_observed@1", "derived.tactic.interference_observed@1",
      "derived.tactic.check_zwischenzug_observed@1", "derived.tactic.overload_exploitation_observed@1",
    ].sort());
  });

  it("preserves the frozen v1/v2 contracts without treating their old absence joins as current admission", () => {
    const registryBytes = readFileSync(new URL("../../../rfc/contracts/longitudinal-ingest-registry-v2.json", import.meta.url));
    const signBytes = readFileSync(new URL("../../../rfc/contracts/longitudinal-sign-subsets-v2.json", import.meta.url));
    expect(createHash("sha256").update(registryBytes).digest("hex")).toBe("e77dd4a63c0da9780da32218c635dd3f93e078e5836f6ea8563eef0c6633b5f9");
    expect(createHash("sha256").update(signBytes).digest("hex")).toBe("26e21d4b686eb88d86389cf19d44bb8b04e79c6a95e64be80d6863b656647e31");
    const oldRegistryBytes = readFileSync(new URL("../../../rfc/contracts/longitudinal-ingest-registry-v1.json", import.meta.url));
    const oldSignBytes = readFileSync(new URL("../../../rfc/contracts/longitudinal-sign-subsets-v1.json", import.meta.url));
    expect(createHash("sha256").update(oldRegistryBytes).digest("hex")).toBe("e12147750b512c83872f61dd7dc333e94e20c151876a3c2d3ef5f91c7e7fc21a");
    expect(createHash("sha256").update(oldSignBytes).digest("hex")).toBe("4294461656e2da32106c6ba9e0753fe58e49ea74dcb907d41f9ab1e46476b32f");
    const replacements = ["derived.tactic.defender_exposure", "derived.material.event.role_asymmetry"];
    const original = JSON.parse(oldRegistryBytes.toString("utf8")) as readonly { readonly projection: { readonly id: string; readonly version: number } }[];
    expect(JSON.parse(registryBytes.toString("utf8"))).toEqual(original.map(row => ({ ...row, projection: { ...row.projection, version: replacements.includes(row.projection.id) ? 2 : 1 } })));
    const oldSigns = JSON.parse(oldSignBytes.toString("utf8")) as Record<string, readonly string[]>;
    expect(JSON.parse(signBytes.toString("utf8"))).toEqual(Object.fromEntries(original.map(row => [`${row.projection.id}@${replacements.includes(row.projection.id) ? 2 : 1}`, oldSigns[row.projection.id]])));
    expect(LONGITUDINAL_ADMITTED_IDENTITIES.some(row => row.projectionId.startsWith("derived.semantic_avoidance."))).toBe(false);
  });

  it("refuses missing, duplicate, order, exact-version, sign, subject contract and deferred mutations", () => {
    const rows = [...LONGITUDINAL_INGEST_REGISTRY];
    const population = rows.filter((row): row is Extract<LongitudinalConstructor, { kind: "population" }> => row.kind === "population");
    const edge = rows.find((row) => row.kind === "edge")!;
    const successor = rows.find(row => row.projection.id === "derived.material.event.role_asymmetry")!;
    const path = rows.find((row): row is Extract<LongitudinalConstructor, { kind: "path" }> => row.kind === "path")!;
    const mutations: readonly [string, readonly LongitudinalConstructor[], RegExp][] = [
      ["missing", rows.slice(1), /SET_MISMATCH/u],
      ["duplicate", [...rows, rows[0]!], /SET_MISMATCH/u],
      ["row order", [rows[1]!, rows[0]!, ...rows.slice(2)], /ORDER_MISMATCH/u],
      ["ghost", rows.map((row) => row === edge ? { ...edge, projection: { id: "rules.ghost.event", version: 1 as const } } : row), /SET_MISMATCH/u],
      ["retained predecessor", rows.map(row => row === successor ? { ...row, projection: { ...row.projection, version: 1 as const } } : row), /VERSION_MISMATCH/u],
      ["arbitrary successor", rows.map(row => row === edge ? { ...row, projection: { ...row.projection, version: 2 as const } } : row), /VERSION_MISMATCH/u],
      ["unaccepted third version", rows.map(row => row === successor ? { ...row, projection: { ...row.projection, version: 3 } } : row) as readonly LongitudinalConstructor[], /VERSION_MISMATCH/u],
      ["impossible sign", rows.map((row) => row === edge ? { ...edge, signs: [...edge.signs, "avoided" as const] } : row), /SIGN_SUBSET_MISMATCH/u],
      ["swapped families", rows.map(row => row === population[0] ? { ...population[0]!, family: population[1]!.family } : row), /CONTRACT_MISMATCH/u],
      ["wrong relation domain", rows.map(row => row === population[0] ? { ...population[0]!, relations: ["equal" as const] } : row), /CONTRACT_MISMATCH/u],
      ["changed deferred owner", rows.map(row => row === path ? { ...path, owner: "other" } : row) as readonly LongitudinalConstructor[], /CONTRACT_MISMATCH/u],
      ["changed deferred reason", rows.map(row => row === path ? { ...path, reason: "A new policy" } : row), /CONTRACT_MISMATCH/u],
    ];
    for (const [, mutated, error] of mutations) expect(() => validateIngestRegistry(mutated)).toThrow(error);
    expect(() => validateIngestRegistry(rows)).not.toThrow();
  });

  it("closes both parser boundaries over the compiled registry with no admission operand", () => {
    const base = {
      learnerId: "l", runId: "r", phase: "opening", decisionClass: "played", decisions: 1, observedAt: AT, derivedRev: 1,
      projectionId: "rules.structural.event.king_zone", projectionVersion: 1, semanticSign: "gained", sourceSign: "gained",
      sessionKind: "position", packId: null, opportunities: 1, occurred: 1, alternativeShareSum: 0.5,
      occurredRefs: [{ kind: "move", nodeId: "n1", eventSeq: 2 }], opportunityRefs: [{ kind: "move", nodeId: "n1", eventSeq: 2 }],
    };
    expect(parseLongitudinalObservationRow(base).projectionId).toBe("rules.structural.event.king_zone");
    for (const forged of [
      { ...base, projectionId: "rules.invented.event" },
      { ...base, projectionVersion: 2 },
      { ...base, sourceSign: "lost" },
      { ...base, projectionId: "derived.exchange.trade_completed" },
      { ...base, semanticSign: "avoided" },
    ]) expect(() => parseLongitudinalObservationRow(forged)).toThrow(/OBSERVATION_ROW_INVALID/u);
    const query = (projections: unknown) => ({ learnerId: "l", derivationRev: 1, through: { kind: "all_complete" }, filter: { projections } });
    expect(() => parseLongitudinalReadQuery(query([{ id: "rules.invented.event", version: 1 }]))).toThrow(/not admitted/u);
    expect(() => parseLongitudinalReadQuery(query([{ id: "derived.exchange.trade_completed", version: 1 }]))).toThrow(/not admitted/u);
    expect(() => parseLongitudinalReadQuery(query([{ id: "rules.structural.event.king_zone", version: 1, semanticSign: "avoided" }]))).toThrow(/no admitted sign pair/u);
    for (const projectionId of ["derived.material.event.role_asymmetry", "derived.tactic.defender_exposure"]) {
      const current = { ...base, derivedRev: 6, projectionId, projectionVersion: 2, semanticSign: "state", sourceSign: "state" };
      expect(parseLongitudinalObservationRow(current)).toMatchObject({ projectionId, projectionVersion: 2 });
      expect(parseLongitudinalReadQuery(query([{ id: projectionId, version: 2 }])).filter.projections).toEqual([{ id: projectionId, version: 2 }]);
      for (const projectionVersion of [1, 3]) {
        expect(() => parseLongitudinalObservationRow({ ...current, projectionVersion })).toThrow(/OBSERVATION_ROW_INVALID/u);
        expect(() => parseLongitudinalReadQuery(query([{ id: projectionId, version: projectionVersion }]))).toThrow(/not admitted/u);
      }
    }
    expect(parseLongitudinalReadQuery.length).toBe(1);
  });
});

describe("criterion 3 — declinable complete population ([[D2066]])", () => {
  const identity = LONGITUDINAL_ADMITTED_IDENTITIES.find((row) => row.projectionId === "rules.structural.event.king_zone" && row.semanticSign === "gained")!;
  const exhibits = (moves: readonly string[]) => ({ alternatives: FIXTURE_DEPENDENCIES.alternatives, events: (_b: string, uci: string) => moves.includes(uci) ? [{ projection: { id: "rules.structural.event.king_zone", version: 1 }, sign: "gained" }, { projection: { id: "rules.structural.event.king_zone", version: 1 }, sign: "gained" }] : [] });

  it("counts event prevalence for played true/false, all/none-exhibit, duplicate-operand, forced and unavailable", () => {
    const playedExhibits = decisionPopulation(START_FEN, "e2e4", [identity], exhibits(["e2e4", "d2d4"]));
    expect(playedExhibits.kind).toBe("available");
    const edgeRow = playedExhibits.kind === "available" ? playedExhibits.memberships.get(`${identity.projectionId}\0 1\0gained\0gained`.replace(" ", "")) : undefined;
    expect(edgeRow).toEqual({ opportunity: true, occurred: true, share: 1 / 19 });
    const playedDoesNotExhibit = decisionPopulation(START_FEN, "g1f3", [identity], exhibits(["e2e4", "d2d4"]));
    expect(playedDoesNotExhibit.kind === "available" ? [...playedDoesNotExhibit.memberships.values()] : []).toEqual([
      { opportunity: true, occurred: false, share: 2 / 19 },
    ]);
    const all = decisionPopulation(START_FEN, "e2e4", [identity], { alternatives: FIXTURE_DEPENDENCIES.alternatives, events: () => [{ projection: { id: "rules.structural.event.king_zone", version: 1 }, sign: "gained" }] });
    expect(all.kind === "available" ? all.memberships.size : -1).toBe(0);
    const none = decisionPopulation(START_FEN, "e2e4", [identity], { alternatives: FIXTURE_DEPENDENCIES.alternatives, events: () => [] });
    expect(none.kind === "available" ? none.memberships.size : -1).toBe(0);
    const forced = decisionPopulation("7k/8/8/8/8/8/6q1/7K w - - 0 1", "h1g2", [identity], exhibits(["h1g2"]));
    expect(forced).toEqual({ kind: "unavailable", reason: "forced_move" });
    const unavailable = decisionPopulation(START_FEN, "e2e4", [identity], { alternatives: FIXTURE_DEPENDENCIES.alternatives, events: (_b, uci) => uci === "a2a3" ? undefined : [] });
    expect(unavailable).toEqual({ kind: "unavailable", reason: "population_incomplete" });
  });

  it("uses the real legal-edge/event boundary by default and keeps every share in [0,1]", () => {
    const real = decisionPopulation("r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "f1b5");
    expect(real.kind).toBe("available");
    if (real.kind !== "available") return;
    expect(real.memberships.size).toBeGreaterThan(0);
    for (const membership of real.memberships.values()) {
      expect(membership.opportunity).toBe(true);
      expect(membership.share).toBeGreaterThanOrEqual(0);
      expect(membership.share).toBeLessThanOrEqual(1);
    }
  });

  it("enforces 0 < opportunities <= decisions, exact ref cardinality and occurred ⊆ opportunity", () => {
    const refs = [{ kind: "move", nodeId: "a", eventSeq: 2 }, { kind: "move", nodeId: "b", eventSeq: 4 }];
    const row = {
      learnerId: "l", runId: "r", phase: "opening", decisionClass: "played", decisions: 2, observedAt: AT, derivedRev: 1,
      projectionId: "rules.structural.event.king_zone", projectionVersion: 1, semanticSign: "gained", sourceSign: "gained",
      sessionKind: "position", packId: null, opportunities: 2, occurred: 1, alternativeShareSum: 0.25,
      occurredRefs: [refs[0]], opportunityRefs: refs,
    };
    expect(() => parseLongitudinalObservationRow(row)).not.toThrow();
    expect(() => parseLongitudinalObservationRow({ ...row, decisions: 1 })).toThrow(/crossed counts/u);
    expect(() => parseLongitudinalObservationRow({ ...row, opportunities: 0, opportunityRefs: [] })).toThrow();
    expect(() => parseLongitudinalObservationRow({ ...row, occurredRefs: [] })).toThrow(/cardinality/u);
    expect(() => parseLongitudinalObservationRow({ ...row, occurredRefs: [{ kind: "move", nodeId: "z", eventSeq: 3 }] })).toThrow(/not an opportunity/u);
    expect(() => parseLongitudinalObservationRow({ ...row, alternativeShareSum: 2.5 })).toThrow(/share/u);
    expect(() => parseLongitudinalObservationRow({ ...row, sessionKind: "pack" })).toThrow();
  });
});

describe("criteria 4, 9, 18, 19 — normative projector over real runtime events", () => {
  it("persists two prediction checkpoints on one node as distinct typed refs and refuses unsorted refs", () => {
    let run = positionRun("predictions");
    const root = run.nodes[0]!.id;
    run = predict(run, root, "c1", "e2e4");
    run = predict(run, root, "c2", "d2d4");
    run = predict(run, root, "c1", "g1f3");
    const decisions = normativeDecisions(image(run), run);
    expect(decisions.map((decision) => decision.ref)).toEqual([
      { kind: "prediction", nodeId: root, checkpointId: "c1", eventSeq: 2 },
      { kind: "prediction", nodeId: root, checkpointId: "c2", eventSeq: 3 },
    ]);
    expect(() => parseDecisionRefs([decisions[1]!.ref, decisions[0]!.ref])).toThrow(/unsorted/u);
    expect(() => parseDecisionRefs([decisions[0]!.ref, decisions[0]!.ref])).toThrow(/unsorted or duplicated/u);
  });

  it("keeps observed_at on run.started and every byte stable across later wall clocks", () => {
    const run = play(positionRun("clock"), "e2e4", "e7e5", "d2d4");
    const first = projectObservations(image(run), { dependencies: FIXTURE_DEPENDENCIES });
    const second = projectObservations(image(run), { dependencies: FIXTURE_DEPENDENCIES });
    expect(canonicalizeJson(first as unknown as JsonValue)).toBe(canonicalizeJson(second as unknown as JsonValue));
    expect(new Set(first.denominators.map((row) => row.observedAt))).toEqual(new Set([AT]));
  });

  it("reads family-independent denominators: a late first opportunity sees earlier decisions", () => {
    // g1f3 (no opportunity for the fixture family? it is a declinable non-exhibitor), then d2d4.
    const run = play(positionRun("late"), "a2a3", "h7h6", "e2e4", "g8f6", "h2h3");
    const projected = projectObservations(image(run), { dependencies: { alternatives: FIXTURE_DEPENDENCIES.alternatives, events: (before, uci) => before === run.nodes[2]!.fen && uci === "e2e4" ? [{ projection: { id: "rules.structural.event.king_zone", version: 1 }, sign: "gained" }] : [] } });
    const denominator = projected.denominators.find((row) => row.phase === "opening" && row.decisionClass === "played");
    expect(denominator?.decisions).toBe(5);
    const family = projected.observations.find((row) => row.projectionId === "rules.structural.event.king_zone");
    expect(family).toMatchObject({ decisions: 5, opportunities: 1, occurred: 1 });
    const prefix = projectObservations(image(run, { cut: 5 }), { dependencies: { alternatives: FIXTURE_DEPENDENCIES.alternatives, events: (before, uci) => before === run.nodes[2]!.fen && uci === "e2e4" ? [{ projection: { id: "rules.structural.event.king_zone", version: 1 }, sign: "gained" }] : [] } });
    expect(prefix.denominators[0]?.decisions).toBe(4);
  });

  it("carries opening, middlegame, endgame and unclear through the classifier without coercion", () => {
    const phases = [
      ["opening", START_FEN, "e2e4"],
      ["middlegame", "r2q1rk1/ppp2ppp/2np1n2/2b1p1B1/2B1P1b1/2NP1N2/PPP2PPP/R2Q1RK1 w - - 0 1", "a2a3"],
      ["endgame", "8/5k2/8/8/8/8/5K2/4R3 w - - 0 1", "e1e2"],
      ["unclear", "4k3/8/8/8/8/8/8/3QK2R w K - 0 1", "d1d2"],
    ] as const;
    for (const [phase, fen, move] of phases) {
      const run = play(positionRun(`phase-${phase}`, fen), move);
      const projected = projectObservations(image(run), { dependencies: FIXTURE_DEPENDENCIES });
      expect(projected.denominators.map((row) => row.phase)).toEqual([phase]);
    }
  });

  it("projects imported mainline/fork, owner/non-owner, first/duplicate prediction and five root counters", () => {
    let run = importedRun("history", ["e2e4", "e7e5", "g1f3", "b8c6"]);
    const mainlineRoot = run.nodes[0]!;
    run = rewind(run, run.nodes[2]!.id, AT).run; // back to after 1...e5
    run = play(run, "d2d4"); // an owner fork off the imported mainline
    const forkBranch = run.branches[1]!;
    run = predict(run, mainlineRoot.id, "cp", "d2d4");
    run = predict(run, mainlineRoot.id, "cp", "c2c4");
    const withGroup = run;
    const projected = normativeDecisions(image(withGroup), withGroup);
    expect(projected.map((decision) => [decision.ref.kind, decision.decisionClass])).toEqual([
      ["move", "game"], ["move", "game"], ["move", "played"], ["prediction", "predicted"],
    ]);
    expect(projected[2]!.ref).toMatchObject({ kind: "move" });
    expect(run.nodes.find((node) => node.id === projected[2]!.ref.nodeId)?.branchId).toBe(forkBranch.id);
    // Phase source: move → parent FEN, prediction → its node FEN.
    expect(projected[0]!.beforeFen).toBe(mainlineRoot.fen);
    expect(projected[3]!.beforeFen).toBe(mainlineRoot.fen);

    const counted = projectObservations(image(withGroup), { dependencies: FIXTURE_DEPENDENCIES });
    // The primary branch resolves to the run root; the fork resolves through its own forkNodeId.
    const byRoot = new Map(counted.structureStats.map((row) => [row.rootNodeId, row] as const));
    expect(byRoot.get(mainlineRoot.id)).toMatchObject({ branchCount: 1, rewoundCount: 1, forkedCount: 0, sessionKind: "imported", packId: null });
    expect(byRoot.get(forkBranch.forkNodeId)).toMatchObject({ branchCount: 1, rewoundCount: 0, forkedCount: 1 });

    // Owner-only attribution: every commit authored by another learner yields zero decisions and,
    // for the shared arm, zero structure rows.
    const foreign = image(withGroup, { attribution: "unattributable_shared", authorship: () => "other" });
    const foreignProjection = projectObservations(foreign, { dependencies: FIXTURE_DEPENDENCIES });
    expect(foreignProjection.denominators).toEqual([]);
    expect(foreignProjection.structureStats).toEqual([]);
    // Legacy journal-less arm: decisions admitted, structure withheld.
    const legacy = projectObservations(image(withGroup, { attribution: "unattributable_legacy" }), { dependencies: FIXTURE_DEPENDENCIES });
    expect(legacy.denominators.length).toBeGreaterThan(0);
    expect(legacy.structureStats).toEqual([]);
    // ...but a legacy run cannot prove it never shared write access, so its predictions abstain.
    expect(legacy.denominators.some((row) => row.decisionClass === "predicted")).toBe(false);
    expect(projectObservations(image(withGroup), { dependencies: FIXTURE_DEPENDENCIES }).denominators.some((row) => row.decisionClass === "predicted")).toBe(true);
  });

  it("counts group.created against the resolved root and every branch sharing that root", () => {
    let run = play(positionRun("roots"), "e2e4");
    const root = run.nodes[0]!;
    run = fork(run, root.id, { at: AT }).run;
    run = play(run, "d2d4");
    const [first, second] = run.branches;
    run = appendEvents(run, [{ type: "group.created", at: AT, data: { groupId: "g1", sourceNodeId: root.id, source: "hand_picked", resistance: "fixed", members: [{ branchId: first!.id, seedMoveUci: "e2e4" }, { branchId: second!.id, seedMoveUci: "d2d4" }] } }]);
    const projected = projectObservations(image(run), { dependencies: FIXTURE_DEPENDENCIES });
    expect(projected.structureStats).toHaveLength(1);
    expect(projected.structureStats[0]).toMatchObject({ rootNodeId: root.id, branchCount: 2, forkedCount: 1, groupCount: 1, rewoundCount: 0, outcomeCount: 0 });
    // Removing the group mapping mutates the expected row (able-to-fail control).
    const withoutGroup = projectObservations(image(run, { cut: run.events.length - 1 }), { dependencies: FIXTURE_DEPENDENCIES });
    expect(withoutGroup.structureStats[0]?.groupCount).toBe(0);
  });
});

describe("criterion 10 — observed import boundary", () => {
  it("persists imported source-mainline decisions only as game and never as played", () => {
    const run = importedRun("imported-boundary", ["e2e4", "e7e5", "d2d4"]);
    const projected = projectObservations(image(run), { dependencies: FIXTURE_DEPENDENCIES });
    expect(new Set(projected.denominators.map((row) => row.decisionClass))).toEqual(new Set(["game"]));
    expect(projected.observations.every((row) => row.decisionClass === "game")).toBe(true);
  });
});

describe("criterion 12 — revision pair", () => {
  const successorFixtures = LONGITUDINAL_SUCCESSOR_FIXTURES;

  it.each(successorFixtures)("keeps genuine complete current-source positive/negative: %s", (name, fen, move, side, projectionId, occurs) => {
    const run = play(positionRun(`revision-${name}`, fen, side), move);
    const events = RUNTIME_POPULATION_DEPENDENCIES.events(run.nodes[0]!.fen, move, run.nodes[1]!.fen);
    expect(events).toBeDefined();
    expect(events!.some(event => event.projection.id === projectionId && event.projection.version === 2)).toBe(occurs);
    const population = decisionPopulation(run.nodes[0]!.fen, move);
    expect(population.kind).toBe("available");
    const projected = projectObservations(image(run));
    expect(projected.denominators.reduce((sum, row) => sum + row.decisions, 0)).toBe(1);
    const rows = projected.observations.filter(row => row.projectionId === projectionId);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(row => row.projectionVersion === 2 && row.occurred === Number(occurs))).toBe(true);
  });

  it("pairs OBSERVATION_DERIVATION_REV with the registry digest and a fixture-output digest", () => {
    const f = fileFixture("tabiya-current-revision-image-"), owner = learner(f.storage, "owner");
    const db = new DatabaseSync(f.path); db.exec("PRAGMA foreign_keys=ON");
    const store = new LongitudinalStore(db, { now: () => f.clock.now });
    const actual = (run: DrillRun) => {
      f.storage.create(run, owner);
      const claim = store.claimBatch({ workerId: "revision9-fixture", scanLimit: 1, slots: 1, leaseMs: 60_000 })[0]!;
      if (claim.runId !== run.id) throw Error("Every preceding fixture must publish its own complete cut");
      const source = store.claimSourceImage(claim)!, scope = store.openClaimedGameSource(claim, source);
      try {
        const projection = projectObservations(source, { gameSource: scope });
        expect(store.publish(claim, projection)).toBe("published");
        return projection;
      } finally { store.closeGameSource(scope); }
    };
    try {
    const runs = longitudinalRevisionFixtures(), byId = new Map(runs.map(run => [run.id, run]));
    const fixed = (id: string): DrillRun => {
      const run = byId.get(id);
      if (run === undefined) throw new Error(`Missing original revision fixture ${id}`);
      return run;
    };
    expect(OBSERVATION_DERIVATION_REV).toBe(9);
    expect(ingestRegistryDigest(LONGITUDINAL_INGEST_REGISTRY)).toBe(LONGITUDINAL_REGISTRY_DIGEST);
    // A zero-incidence registry addition moves the registry digest even though no fixture row changes.
    const addition = [...LONGITUDINAL_INGEST_REGISTRY, { projection: { id: "rules.zero.incidence", version: 1 }, signs: ["gained"], kind: "edge", adapter: "local_semantic_event" }];
    const raw = `sha256:${createHash("sha256").update(canonicalizeJson(addition as unknown as JsonValue)).digest("hex")}`;
    expect(raw).not.toBe(LONGITUDINAL_REGISTRY_DIGEST);
    expect(() => ingestRegistryDigest(addition as readonly LongitudinalConstructor[])).toThrow(/SET_MISMATCH/u);
    // Actual corrected collector outputs, including a nearby retained-defence negative, are
    // included in the revision pair. Ordinary opening moves alone miss special-move repairs.
    const fixture = fixed("revision-fixture");
    const promotionRun = fixed("revision-promotion");
    const promotion = actual(promotionRun);
    const retainedRun = fixed("revision-retained");
    const retained = actual(retainedRun);
    const dutyId = "rules.tactic.event.defender_duty_relocated";
    // The committed source still proves the special-move fact, but another legal move makes
    // exposure unavailable. The whole decision must not publish any incomplete opportunity.
    expect(localSemanticEventClosure(promotionRun.nodes[0]!.fen, "b7b8n", promotionRun.nodes[1]!.fen).events.some(event => event.projection.id === dutyId)).toBe(true);
    expect(decisionPopulation(promotionRun.nodes[0]!.fen, "b7b8n")).toEqual({ kind: "unavailable", reason: "population_incomplete" });
    expect(promotion.denominators.reduce((sum, row) => sum + row.decisions, 0)).toBe(1);
    expect(promotion.observations).toEqual([]);
    expect(localSemanticEventClosure(retainedRun.nodes[0]!.fen, "b7b8r", retainedRun.nodes[1]!.fen).events.filter(event => event.projection.id === dutyId)).toEqual([]);
    expect(retained.observations.filter(row => row.projectionId === dutyId && row.occurred > 0)).toEqual([]);
    const castlingRun = fixed("revision-castling");
    const castling = actual(castlingRun);
    const castlingEvents = localSemanticEventClosure(castlingRun.nodes[0]!.fen, "e1h1", castlingRun.nodes[1]!.fen).events;
    expect(castlingEvents.some(event => event.projection.id === dutyId)).toBe(true);
    expect(castlingEvents.some(event => event.projection.id === "rules.mobility.event.piece_destinations")).toBe(true);
    expect(decisionPopulation(castlingRun.nodes[0]!.fen, "e1h1")).toEqual({ kind: "unavailable", reason: "population_incomplete" });
    expect(castling.denominators.reduce((sum, row) => sum + row.decisions, 0)).toBe(1);
    expect(castling.observations).toEqual([]);
    const enPassant = actual(fixed("revision-en-passant"));
    expect(enPassant.observations.find(row => row.projectionId === "rules.tactic.event.loose_piece" && row.semanticSign === "gained" && row.occurred > 0)).toMatchObject({ occurred: 1 });
    const pawnRuns = [fixed("revision-white-pawn"), fixed("revision-black-pawn")].map(run => actual(run));
    for (const pawn of pawnRuns) {
      const gains = pawn.observations.filter(row => row.projectionId === "rules.pawn.event.dynamics");
      expect(gains.length).toBeGreaterThan(0);
      expect(gains.every(row => row.occurred === 0)).toBe(true);
      expect(pawn.observations).toContainEqual(expect.objectContaining({ projectionId: "derived.pawn.event.transitions", occurred: 1 }));
    }
    const occupiedTargets = OCCUPIED_TARGET_IDENTITY_CASES.map(value => {
      const run = fixed(`revision-target-${value.name}`);
      const projected = actual(run);
      const defence = projected.observations.filter(row => row.projectionId === "rules.transition.event.occupied_defence");
      const source = localSemanticEventClosure(run.nodes[0]!.fen, value.uci, run.nodes[1]!.fen).events.filter(event => event.projection.id === "rules.transition.event.occupied_defence");
      if (value.sign === null) expect(source.filter(event => event.sign === "gained")).toEqual([]);
      else expect(source.some(event => event.sign === value.sign)).toBe(true);
      const population = decisionPopulation(run.nodes[0]!.fen, value.uci);
      // All twelve fixed occupied-target fixtures have a genuine checking alternative. Keep
      // their original source-sign assertions above; never count unavailable as negative.
      expect(population).toEqual({ kind: "unavailable", reason: "population_incomplete" });
      expect(projected.denominators.reduce((sum, row) => sum + row.decisions, 0)).toBe(1);
      expect(defence).toEqual([]);
      expect(projected.observations).toEqual([]);
      return projected;
    });
    const successors = successorFixtures.map(([name]) => actual(fixed(`revision-${name}`)));
    const output = [actual(fixture), promotion, retained, castling, enPassant, ...pawnRuns, ...occupiedTargets, ...successors];
    expect(output.map(row => row.denominators[0]?.runId)).toEqual(runs.map(run => run.id));
    for (const projected of output) for (const row of [...projected.denominators, ...projected.observations,
      ...projected.structureStats, ...projected.gameFacts, ...projected.choiceFacts, ...projected.subjectObservations]) expect(row.derivedRev).toBe(9);
    // A.2 changes the registry, subject grain and unavailable population policy. Retagging
    // current rows as revision7 cannot establish predecessor equality. Historical revision8 pin:
    // sha256:aa4d3483e07222cbbe4fc26604d8c44fb5f4d6b3b477eb5c26df3c55006ec5ff
    // Historical four-family revision7 pin:
    // sha256:5c04abdd3419f06f7745ac532aba51a459205f2e53c92ceb573339c5c9969f79
    // Current fingerprint below covers genuine scope/publication and ALL SIX families.
    expect(output.every(row => row.choiceFacts.length === 1)).toBe(true);
    expect(output[0]!.choiceFacts[0]).toMatchObject({ derivedRev: 9, cohort: { kind: "eligible", decisions:
      Array.from({ length: 3 }, () => ({ result: { kind: "available" } })) } });
    expect(output.slice(1).every(row => row.choiceFacts[0]!.cohort.kind === "ineligible")).toBe(true);
    const digest = `sha256:${createHash("sha256").update(canonicalizeJson(output as unknown as JsonValue)).digest("hex")}`;
    expect(digest).toBe(LONGITUDINAL_FIXTURE_OUTPUT_DIGEST);
    } finally { db.close(); f.storage.close(); rmSync(dirname(f.path), { recursive: true, force: true }); }
  }, 60_000);
});

/**
 * §D revision pair: every original opening/special-move/occupied-target fixture plus both-color
 * exact material/exposure successor positives and nearby negatives. Incomplete populations keep
 * their normative denominators and original source assertions, never manufactured opportunities.
 * Any semantic change to the projector, adapters or admitted registry moves this literal; the RFC that
 * owns that change owns the revision bump and the rebuild discharge in the same diff.
 */
const LONGITUDINAL_FIXTURE_OUTPUT_DIGEST = "sha256:375d8dc39d44e9c00b0360c0cba31af7c4b64544ddc28f09eff3a2190ea76187";

describe("criteria 13, 28 — branded query parser and sealed V4 source identity", () => {
  it("rejects empty, duplicate, unknown and contradictory filters and orders bytewise", () => {
    const base = { learnerId: "l", derivationRev: 1, through: { kind: "all_complete" }, filter: {} };
    expect(() => parseLongitudinalReadQuery({ ...base, filter: { phases: [] } })).toThrow(/non-empty/u);
    expect(() => parseLongitudinalReadQuery({ ...base, filter: { phases: ["opening", "opening"] } })).toThrow(/duplicate/u);
    expect(() => parseLongitudinalReadQuery({ ...base, filter: { phases: ["late"] } })).toThrow(/unknown value/u);
    expect(() => parseLongitudinalReadQuery({ ...base, filter: { sessionKinds: ["position"], packIds: ["p"] } })).toThrow(/contradict/u);
    expect(() => parseLongitudinalReadQuery({ ...base, extra: true })).toThrow(/unknown key/u);
    expect(() => parseLongitudinalReadQuery({ ...base, through: { kind: "runs", cuts: [{ runId: "a", requestedSeq: 1 }, { runId: "a", requestedSeq: 2 }] } })).toThrow(/duplicate/u);
    const parsed = parseLongitudinalReadQuery({ ...base, through: { kind: "runs", cuts: [{ runId: "b", requestedSeq: 2 }, { runId: "a", requestedSeq: 1 }] }, filter: { phases: ["unclear", "endgame", "opening"], decisionClasses: ["predicted", "game"] } });
    expect(parsed.through.kind === "runs" ? parsed.through.cuts.map((cut) => cut.runId) : []).toEqual(["a", "b"]);
    expect(parsed.filter.phases).toEqual(["endgame", "opening", "unclear"]);
    expect(parsed.filter.decisionClasses).toEqual(["game", "predicted"]);
    expect(() => assertParsedLongitudinalReadQuery({ ...parsed })).toThrow(/UNPARSED/u);
    expect(() => assertParsedLongitudinalReadQuery(parsed)).not.toThrow();
  });

  it("hashes only sealed images, invariant to insertion order, sensitive to every consumed input", () => {
    const run = play(positionRun("digest"), "e2e4", "e7e5");
    const sealed = image(run);
    const digest = longitudinalSourceDigestV4(sealed);
    expect(digest).toMatch(/^sha256:[0-9a-f]{64}$/u);
    expect(longitudinalSourceDigestV4(image(run))).toBe(digest);
    expect(LONGITUDINAL_SOURCE_DOMAIN).toBe("tabiya.longitudinal-source.v4\0");
    expect(sealed.version).toBe(4);
    expect(() => longitudinalSourceDigestV4({ ...sealed })).toThrow(/UNSEALED/u);
    expect(() => longitudinalSourceDigestV4(JSON.parse(JSON.stringify(sealed)) as typeof sealed)).toThrow(/UNSEALED/u);
    expect(Object.isFrozen(sealed.runPrefix.events[0])).toBe(true);
    expect(longitudinalSourceDigestV4(image(run, { owner: "someone" }))).not.toBe(digest);
    expect(longitudinalSourceDigestV4(image(run, { attribution: "unattributable_legacy" }))).not.toBe(digest);
    expect(longitudinalSourceDigestV4(image(run, { attribution: "unattributable_shared", authorship: () => null }))).not.toBe(digest);
    expect(longitudinalSourceDigestV4(image(run, { cut: 2 }))).not.toBe(digest);
    // Contradictory, incomplete and crossed inputs fail before hashing.
    expect(() => image(run, { authorship: () => "other" })).toThrow(/CONTRADICTION/u);
    expect(() => sealLongitudinalSourceImageV4(AUTHORITY, { runId: run.id, requestedSeq: 3, storedEvents: run.events, ownerLearnerId: "owner", moveAuthorship: [], structureAttribution: "single_player" })).toThrow(/POPULATION_MISMATCH/u);
    expect(() => sealLongitudinalSourceImageV4(AUTHORITY, { runId: "another", requestedSeq: 1, storedEvents: run.events, ownerLearnerId: "owner", moveAuthorship: [], structureAttribution: "single_player" })).toThrow(/SUBJECT_MISMATCH/u);
    expect(() => sealLongitudinalSourceImageV4(AUTHORITY, { runId: run.id, requestedSeq: 99, storedEvents: run.events, ownerLearnerId: "owner", moveAuthorship: [], structureAttribution: "single_player" })).toThrow(/CUT_INVALID/u);
    // Imported-mainline length comes from the replayed primary branch, never a caller operand.
    expect(image(importedRun("imp", ["e2e4", "e7e5"])).importedMainlinePlies).toBe(2);
    expect(sealed.importedMainlinePlies).toBeNull();
  });
});

describe("criterion 7 — closed job union", () => {
  const base = {
    run_id: "r", learner_id: "l", requested_seq: 3, requested_source_digest: `sha256:${"a".repeat(64)}`, completed_seq: 0, derived_rev: 1,
    state: "pending", claim_generation: 0, claimed_requested_seq: null, claimed_source_digest: null, claim_token: null, claimed_by: null,
    lease_expires_at: null, retry_count: 0, next_attempt_at: null, failure_code: null, updated_at: AT,
  };
  it("admits exactly the five closed shapes and rejects impossible combinations", () => {
    expect(parseLongitudinalJobRow(base).state).toBe("pending");
    expect(parseLongitudinalJobRow({ ...base, state: "complete", completed_seq: 3 }).state).toBe("complete");
    expect(parseLongitudinalJobRow({ ...base, state: "running", claimed_requested_seq: 3, claimed_source_digest: base.requested_source_digest, claim_token: "t", claimed_by: "w", lease_expires_at: AT }).state).toBe("running");
    expect(parseLongitudinalJobRow({ ...base, state: "retry_wait", retry_count: 1, failure_code: "derivation_failed", next_attempt_at: AT }).state).toBe("retry_wait");
    expect(parseLongitudinalJobRow({ ...base, state: "quarantined", retry_count: 1, failure_code: "snapshot_invalid" }).state).toBe("quarantined");
    for (const impossible of [
      { ...base, completed_seq: 2 },
      { ...base, retry_count: 1 },
      { ...base, state: "complete", completed_seq: 2 },
      { ...base, state: "retry_wait", retry_count: 0, failure_code: "derivation_failed", next_attempt_at: AT },
      { ...base, state: "retry_wait", retry_count: 1, failure_code: "snapshot_invalid", next_attempt_at: AT },
      { ...base, state: "retry_wait", retry_count: 3, failure_code: "derivation_failed", next_attempt_at: AT },
      { ...base, state: "quarantined", retry_count: 0, failure_code: "derivation_failed" },
      { ...base, state: "quarantined", retry_count: 2, failure_code: "derivation_failed" },
      { ...base, claim_token: "t" },
      { ...base, state: "running", claimed_requested_seq: 3, claimed_source_digest: base.requested_source_digest, claim_token: "t", claimed_by: "", lease_expires_at: AT },
      { ...base, state: "running", claimed_requested_seq: 2, claimed_source_digest: base.requested_source_digest, claim_token: "t", claimed_by: "w", lease_expires_at: AT },
      { ...base, state: "quarantined", retry_count: 1, failure_code: "unknown_code" },
      { ...base, updated_at: "2026-09-24T10:00:00Z" },
      { ...base, extra: 1 },
    ]) expect(() => parseLongitudinalJobRow(impossible)).toThrow(/JOB_ROW_INVALID/u);
  });
});
