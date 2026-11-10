// D4018: actual source outcomes and exact-version joins, not an events-only empty fallback.
import { describe, expect, it, vi } from "vitest";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "../../../packages/runtime/src/chess.js";
import { localSemanticEventClosure, localSemanticCollectorOutcomes } from "../../../packages/runtime/src/semantic-evidence.js";
import { decisionPopulation, projectObservations, RUNTIME_POPULATION_DEPENDENCIES } from "./longitudinal-projector.js";
import { createSemanticMembershipReader } from "./longitudinal-membership-cache.js";
import { LONGITUDINAL_ADMITTED_IDENTITIES } from "./longitudinal-registry.js";
import { sealLongitudinalSourceImageV4 } from "./longitudinal-source.js";
import { AT, START_FEN, play, positionRun } from "./longitudinal-test-fixtures.js";

const exposure = "derived.tactic.defender_exposure@2";
function edge(fen: string, uci: string) {
  const position = positionFromFen(fen), beforeFen = canonicalFen(position), move = normalizeMove(position, parseUci(uci)!);
  if (!position.isLegal(move)) throw new Error("The source fixture must be a legal move");
  position.play(move);
  return { beforeFen, moveUci: uci, afterFen: canonicalFen(position) };
}
function projected(fen: string, move: string) {
  const run = play(positionRun("successor-population", fen), move);
  return projectObservations(sealLongitudinalSourceImageV4(Object.freeze({ fixture: "successor-population" }), {
    runId: run.id, requestedSeq: run.events.length, storedEvents: run.events, ownerLearnerId: "owner",
    structureAttribution: "single_player", moveAuthorship: run.events.flatMap(event => event.type === "move.committed"
      ? [{ eventSeq: event.seq, nodeId: event.data.node.id, learnerId: "owner" }] : []),
  }));
}

describe("longitudinal exact successor population", () => {
  it.each([
    ["r2k4/1B6/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6"],
    ["3k3r/8/8/8/5b2/6N1/6b1/4K2R b - - 0 1", "f4g3"],
  ])("preserves a genuine checking-edge unavailable result (%s)", (fen, move) => {
    const anchor = edge(fen, move), original = localSemanticEventClosure(anchor.beforeFen, move, anchor.afterFen);
    expect(localSemanticCollectorOutcomes(original)).toContainEqual({ projection: exposure, result: { kind: "unavailable", reason: "invalid_turn_clone" } });
    expect(() => localSemanticCollectorOutcomes({ ...original })).toThrow("original collected closure");
    expect(RUNTIME_POPULATION_DEPENDENCIES.events(anchor.beforeFen, move, anchor.afterFen)).toBeUndefined();
    expect(decisionPopulation(fen, move)).toEqual({ kind: "unavailable", reason: "population_incomplete" });
  });

  it("does not turn an unavailable alternative into a known non-exhibiting edge or erase the decision", () => {
    const fen = "r2k4/1B6/1n6/2B5/8/8/8/R3K3 w - - 0 1", move = "e1f1", committed = edge(fen, move);
    expect(RUNTIME_POPULATION_DEPENDENCIES.events(committed.beforeFen, move, committed.afterFen)).toBeDefined();
    const alternatives = RUNTIME_POPULATION_DEPENDENCIES.alternatives(fen, move);
    const checking = alternatives.find(candidate => candidate.moveUci === "c5b6")!;
    expect(checking).toBeDefined();
    expect(localSemanticCollectorOutcomes(localSemanticEventClosure(checking.beforeFen, checking.moveUci, checking.afterFen)))
      .toContainEqual({ projection: exposure, result: { kind: "unavailable", reason: "invalid_turn_clone" } });
    expect(decisionPopulation(fen, move)).toEqual({ kind: "unavailable", reason: "population_incomplete" });
    const projection = projected(fen, move);
    expect(projection.denominators).toHaveLength(1);
    expect(projection.denominators[0]).toMatchObject({ decisions: 1, observedAt: AT });
    expect(projection.observations).toEqual([]);
  });

  it("keeps a genuinely complete empty exposure cacheable and recollects genuine unavailable work", () => {
    const unavailable = edge("r2k4/1B6/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6");
    const available = edge(START_FEN, "e2e4"), collect = vi.fn(RUNTIME_POPULATION_DEPENDENCIES.events), read = createSemanticMembershipReader(collect);
    expect(read(unavailable)).toBeUndefined(); expect(read(unavailable)).toBeUndefined();
    expect(collect).toHaveBeenCalledTimes(2);
    const original = localSemanticEventClosure(available.beforeFen, available.moveUci, available.afterFen);
    expect(localSemanticCollectorOutcomes(original).filter(outcome => outcome.projection === exposure)).toEqual([]);
    expect(original.events.filter(event => event.projection.id === "derived.tactic.defender_exposure")).toEqual([]);
    const complete = read(available);
    expect(complete).toBeDefined(); expect(read(available)).toBe(complete);
    expect(collect).toHaveBeenCalledTimes(3);
    expect(decisionPopulation(START_FEN, "e2e4").kind).toBe("available");
  });

  // Mechanical algebra controls: injected event labels here establish no chess proposition.
  it.each([1, 2, 3])("joins material by exact version, not its base id: @%s", version => {
    const identity = LONGITUDINAL_ADMITTED_IDENTITIES.find(row => row.projectionId === "derived.material.event.role_asymmetry")!;
    const population = decisionPopulation(START_FEN, "e2e4", [identity], { ...RUNTIME_POPULATION_DEPENDENCIES,
      events: (_fen, move) => move === "e2e4" ? [{ projection: { id: identity.projectionId, version }, sign: "state" }] : [],
    });
    expect(population.kind).toBe("available");
    if (population.kind !== "available") throw new Error("Complete mechanical population expected");
    expect(population.memberships.size).toBe(version === 2 ? 1 : 0);
  });

  it("never admits the retired generic avoidance identities into operator prevalence", () => {
    expect(LONGITUDINAL_ADMITTED_IDENTITIES.filter(row => row.projectionId.startsWith("derived.semantic_avoidance."))).toEqual([]);
    expect(LONGITUDINAL_ADMITTED_IDENTITIES.some(row => row.projectionId === "rules.structural.event.open_file")).toBe(false);
    // Current condition relations are calculated from genuine complete factory tables in
    // longitudinal-subject-relations.test.ts; an injected label cannot establish them.
  });
});
