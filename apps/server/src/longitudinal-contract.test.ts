// rfc/longitudinal-store.md §F — registry, parser, projector and source-identity acceptance
// (criteria 2, 3, 4, 9, 10, 12, 13-parser, 18, 19, 28). Storage/lifecycle criteria live in
// longitudinal-store.test.ts; worker reach in longitudinal-worker.test.ts.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { canonicalizeJson, type JsonValue } from "@chess-tabiya/schema/drill-pack";
import { appendEvents, fork, rewind, type DrillRun } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import {
  assertParsedLongitudinalReadQuery,
  parseDecisionRefs,
  parseLongitudinalJobRow,
  parseLongitudinalObservationRow,
  parseLongitudinalReadQuery,
} from "./longitudinal-contract.js";
import { decisionPopulation, normativeDecisions, projectObservations } from "./longitudinal-projector.js";
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
  it("is row-equal to both published artifacts at their pinned raw-byte digests (46/13/8)", () => {
    const registryBytes = readFileSync(new URL("../../../rfc/contracts/longitudinal-ingest-registry-v1.json", import.meta.url));
    const signBytes = readFileSync(new URL("../../../rfc/contracts/longitudinal-sign-subsets-v1.json", import.meta.url));
    expect(createHash("sha256").update(registryBytes).digest("hex")).toBe("e12147750b512c83872f61dd7dc333e94e20c151876a3c2d3ef5f91c7e7fc21a");
    expect(createHash("sha256").update(signBytes).digest("hex")).toBe("4294461656e2da32106c6ba9e0753fe58e49ea74dcb907d41f9ab1e46476b32f");
    const signs = JSON.parse(signBytes.toString("utf8")) as Record<string, readonly string[]>;
    const published = (JSON.parse(registryBytes.toString("utf8")) as readonly Record<string, unknown>[]).map((row) => {
      const projection = row.projection as { readonly id: string };
      const base = row.baseProjection as { readonly id: string } | undefined;
      return { ...row, signs: signs[projection.id], ...(base === undefined ? {} : { baseSigns: signs[base.id] }) };
    });
    expect(published).toEqual(LONGITUDINAL_INGEST_REGISTRY);
    expect(Object.keys(signs).sort()).toEqual(LONGITUDINAL_INGEST_REGISTRY.map((row) => row.projection.id).sort());
    expect(LONGITUDINAL_INGEST_REGISTRY.filter((row) => row.kind === "edge")).toHaveLength(46);
    expect(LONGITUDINAL_INGEST_REGISTRY.filter((row) => row.kind === "population")).toHaveLength(13);
    expect(LONGITUDINAL_INGEST_REGISTRY.filter((row) => row.kind === "path")).toHaveLength(8);
    const loose = LONGITUDINAL_INGEST_REGISTRY.find((row) => row.projection.id === "derived.semantic_avoidance.loose_piece");
    expect(loose).toMatchObject({ kind: "population", baseProjection: { id: "rules.tactic.event.loose_piece", version: 1 } });
  });

  it("refuses missing, duplicate, ghost, impossible-sign, wrong-base and wrong-base-sign mutations", () => {
    const rows = [...LONGITUDINAL_INGEST_REGISTRY];
    const population = rows.filter((row): row is Extract<LongitudinalConstructor, { kind: "population" }> => row.kind === "population");
    const edge = rows.find((row) => row.kind === "edge")!;
    const mutations: readonly [string, readonly LongitudinalConstructor[], RegExp][] = [
      ["missing", rows.slice(1), /SET_MISMATCH/u],
      ["duplicate", [...rows, rows[0]!], /SET_MISMATCH/u],
      ["ghost", rows.map((row) => row === edge ? { ...edge, projection: { id: "rules.ghost.event", version: 1 as const } } : row), /SET_MISMATCH/u],
      ["impossible sign", rows.map((row) => row === edge ? { ...edge, signs: [...edge.signs, "avoided" as const] } : row), /SIGN_SUBSET_MISMATCH/u],
      ["swapped bases", rows.map((row) => row === population[0] ? { ...row, baseProjection: population[1]!.baseProjection } : row === population[1] ? { ...row, baseProjection: population[0]!.baseProjection } : row), /POPULATION_BASE_MISMATCH/u],
      ["wrong base signs", rows.map((row) => row === population[0] ? { ...population[0]!, baseSigns: ["gained" as const] } : row), /BASE_SIGN_SUBSET_MISMATCH/u],
    ];
    for (const [, mutated, error] of mutations) expect(() => validateIngestRegistry(mutated)).toThrow(error);
    expect(() => validateIngestRegistry(rows)).not.toThrow();
  });

  it("closes both parser boundaries over the compiled registry with no admission operand", () => {
    const base = {
      learnerId: "l", runId: "r", phase: "opening", decisionClass: "played", decisions: 1, observedAt: AT, derivedRev: 1,
      projectionId: "rules.structural.event.open_file", projectionVersion: 1, semanticSign: "gained", sourceSign: "gained",
      sessionKind: "position", packId: null, opportunities: 1, occurred: 1, alternativeShareSum: 0.5,
      occurredRefs: [{ kind: "move", nodeId: "n1", eventSeq: 2 }], opportunityRefs: [{ kind: "move", nodeId: "n1", eventSeq: 2 }],
    };
    expect(parseLongitudinalObservationRow(base).projectionId).toBe("rules.structural.event.open_file");
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
    expect(() => parseLongitudinalReadQuery(query([{ id: "rules.structural.event.open_file", version: 1, semanticSign: "avoided" }]))).toThrow(/no admitted sign pair/u);
    expect(parseLongitudinalReadQuery.length).toBe(1);
  });
});

describe("criterion 3 — declinable complete population ([[D2066]])", () => {
  const identity = LONGITUDINAL_ADMITTED_IDENTITIES.find((row) => row.projectionId === "rules.structural.event.open_file" && row.semanticSign === "gained")!;
  const avoidance = LONGITUDINAL_ADMITTED_IDENTITIES.find((row) => row.kind === "population" && row.matchProjectionId === "rules.structural.event.open_file" && row.matchSign === "gained")!;
  const exhibits = (moves: readonly string[]) => ({ alternatives: FIXTURE_DEPENDENCIES.alternatives, events: (_b: string, uci: string) => moves.includes(uci) ? [{ projection: { id: "rules.structural.event.open_file", version: 1 }, sign: "gained" }, { projection: { id: "rules.structural.event.open_file", version: 1 }, sign: "gained" }] : [] });

  it("crosses played-exhibits, played-avoids, all/none-exhibit, duplicate-operand, forced and unavailable", () => {
    const playedExhibits = decisionPopulation(START_FEN, "e2e4", [identity, avoidance], exhibits(["e2e4", "d2d4"]));
    expect(playedExhibits.kind).toBe("available");
    const edgeRow = playedExhibits.kind === "available" ? playedExhibits.memberships.get(`${identity.projectionId}\0 1\0gained\0gained`.replace(" ", "")) : undefined;
    expect(edgeRow).toEqual({ opportunity: true, occurred: true, share: 1 / 19 });
    const avoided = playedExhibits.kind === "available" ? playedExhibits.memberships.get(`derived.semantic_avoidance.open_file\x001\0avoided\0gained`) : undefined;
    expect(avoided).toEqual({ opportunity: true, occurred: false, share: 1 / 19 });
    const playedAvoids = decisionPopulation(START_FEN, "g1f3", [identity, avoidance], exhibits(["e2e4", "d2d4"]));
    // The committed edge avoids the family: the edge row does not occur, the avoidance row does.
    expect(playedAvoids.kind === "available" ? [...playedAvoids.memberships.values()] : []).toEqual([
      { opportunity: true, occurred: false, share: 2 / 19 },
      { opportunity: true, occurred: true, share: 2 / 19 },
    ]);
    const all = decisionPopulation(START_FEN, "e2e4", [identity], { alternatives: FIXTURE_DEPENDENCIES.alternatives, events: () => [{ projection: { id: "rules.structural.event.open_file", version: 1 }, sign: "gained" }] });
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
      projectionId: "rules.structural.event.open_file", projectionVersion: 1, semanticSign: "gained", sourceSign: "gained",
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
    const projected = projectObservations(image(run), { dependencies: { alternatives: FIXTURE_DEPENDENCIES.alternatives, events: (before, uci) => before === run.nodes[2]!.fen && uci === "e2e4" ? [{ projection: { id: "rules.structural.event.open_file", version: 1 }, sign: "gained" }] : [] } });
    const denominator = projected.denominators.find((row) => row.phase === "opening" && row.decisionClass === "played");
    expect(denominator?.decisions).toBe(5);
    const family = projected.observations.find((row) => row.projectionId === "rules.structural.event.open_file");
    expect(family).toMatchObject({ decisions: 5, opportunities: 1, occurred: 1 });
    const prefix = projectObservations(image(run, { cut: 5 }), { dependencies: { alternatives: FIXTURE_DEPENDENCIES.alternatives, events: (before, uci) => before === run.nodes[2]!.fen && uci === "e2e4" ? [{ projection: { id: "rules.structural.event.open_file", version: 1 }, sign: "gained" }] : [] } });
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
  it("pairs OBSERVATION_DERIVATION_REV with the registry digest and a fixture-output digest", () => {
    expect(OBSERVATION_DERIVATION_REV).toBe(1);
    expect(ingestRegistryDigest(LONGITUDINAL_INGEST_REGISTRY)).toBe(LONGITUDINAL_REGISTRY_DIGEST);
    // A zero-incidence registry addition moves the registry digest even though no fixture row changes.
    const addition = [...LONGITUDINAL_INGEST_REGISTRY, { projection: { id: "rules.zero.incidence", version: 1 }, signs: ["gained"], kind: "edge", adapter: "local_semantic_event" }];
    const raw = `sha256:${createHash("sha256").update(canonicalizeJson(addition as unknown as JsonValue)).digest("hex")}`;
    expect(raw).not.toBe(LONGITUDINAL_REGISTRY_DIGEST);
    expect(() => ingestRegistryDigest(addition as readonly LongitudinalConstructor[])).toThrow(/SET_MISMATCH/u);
    // Digest 1: the canonical derivation-fixture output over the real semantic boundary.
    const fixture = play(positionRun("revision-fixture"), "e2e4", "e7e5", "g1f3");
    const output = projectObservations(image(fixture));
    const digest = `sha256:${createHash("sha256").update(canonicalizeJson(output as unknown as JsonValue)).digest("hex")}`;
    expect(digest).toBe(LONGITUDINAL_FIXTURE_OUTPUT_DIGEST);
  }, 60_000);
});

/**
 * §D revision pair, digest 1: the canonical derivation-fixture output at OBSERVATION_DERIVATION_REV.
 * Any semantic change to the projector, adapters or admitted registry moves this literal; the RFC that
 * owns that change owns the revision bump and the rebuild discharge in the same diff.
 */
const LONGITUDINAL_FIXTURE_OUTPUT_DIGEST = "sha256:8ef1f076c157f90dbb54663ec01e877579b94f29acd8bb7bfa62c75930919484";

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
