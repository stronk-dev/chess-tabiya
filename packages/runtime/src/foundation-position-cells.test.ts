import { afterEach, describe, expect, it, vi } from "vitest";
import { declareEvidence, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { foundationPositionCells } from "./foundation-position-cells.js";
import { candidateChildReadings } from "./candidate-population.js";
import * as routes from "./internal/evidence-value-routes.js";

const fen = "7k/8/8/8/8/8/PP1P4/7K w - - 0 1";
const legal = (position = fen) => routes.invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: position });
function reseal<T>(value: DeclaredEvidence<T>): DeclaredEvidence<T> {
  const receipt = evidenceValueReceipt(value);
  return declareEvidence(value.producer, value.projection, value.payload, { factory: receipt.factory,
    inputDigest: receipt.inputDigest, sourceDigests: receipt.sourceDigests,
    ...(receipt.convention === undefined ? {} : { convention: receipt.convention }) });
}
afterEach(() => vi.restoreAllMocks());

describe("finite original foundation position cells", () => {
  it("shares six actual source values and their exact inputs without eagerly widening demand", () => {
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute"), cells = foundationPositionCells(fen);
    expect(calls).not.toHaveBeenCalled();
    const groups = cells.groups();
    expect(calls.mock.calls.map(([route]) => route)).toEqual([
      "rules.structural.reading.pawn_connectivity@1", "derived.structural.reading.pawn_file_group@1",
    ]);
    expect(cells.groups()).toBe(groups);
    const file = cells.files(), opposition = cells.opposition(), backward = cells.backward();
    const values = cells.values();
    expect(cells.values()).toBe(values);
    expect(values).toEqual([cells.legal(), cells.connectivity(), opposition, backward, groups, file]);
    expect(Object.isFrozen(values)).toBe(true);
    expect(calls).toHaveBeenCalledTimes(6);
    for (const [route, input] of calls.mock.calls) {
      if (route === "rules.structural.reading.king_opposition@3" || route === "rules.structural.reading.backward_pawn@3") expect(input).toEqual({ position: values[0] });
      if (route === "derived.structural.reading.pawn_file_group@1" || route === "derived.activity.reading.file_state@1") {
        expect((input as { source: unknown }).source).toBe(values[1]);
      }
    }
    const snapshotInputs = calls.mock.calls.filter(([route]) => route === "rules.structural.reading.king_opposition@3" || route === "rules.structural.reading.backward_pawn@3");
    snapshotInputs.forEach(([, input]) => expect((input as { position: unknown }).position).toBe(values[0]));
  });

  it("retains the candidate owner's exact legal map without recollecting an equal FEN", () => {
    const original = legal(), calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const cells = foundationPositionCells(fen, original);
    expect(calls).not.toHaveBeenCalled();
    expect(cells.legal()).toBe(original);
    expect(cells.values()[0]).toBe(original);
    expect(calls.mock.calls.some(([route]) => route === "rules.mobility.reading.legal_moves@1")).toBe(false);
    expect(calls).toHaveBeenCalledTimes(5);
    for (const [route, input] of calls.mock.calls) if (route === "rules.structural.reading.king_opposition@3" || route === "rules.structural.reading.backward_pawn@3") {
      expect((input as { position: unknown }).position).toBe(original);
    }
  });

  it("retains a genuine raw-FEN invocation when its original source denotes this canonical position", () => {
    const raw = fen.replace(/ 0 1$/u, ""), original = legal(raw);
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(routes.readLocalReadingInvocation(original)).toEqual({ kind: "fen", fen: raw });
    const cells = foundationPositionCells(fen, original);
    expect(cells.values()[0]).toBe(original);
    expect(calls.mock.calls.some(([route]) => route === "rules.mobility.reading.legal_moves@1")).toBe(false);
    expect(routes.readLocalReadingInvocation(original)).toEqual({ kind: "fen", fen: raw });
  });

  it("refuses copied, resealed, wrong-projection and crossed-position sources before acquisition", () => {
    const original = legal(), crossed = legal("7k/8/8/8/8/8/P2P4/7K w - - 0 1");
    const wrongHalfmove = legal(fen.replace(" 0 1", " 1 1")), wrongFullmove = legal(fen.replace(" 0 1", " 0 2"));
    const connectivity = routes.invokeEvidenceValueRoute("rules.structural.reading.pawn_connectivity@1", { fen });
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    for (const source of [{ ...original }, reseal(original), crossed, wrongHalfmove, wrongFullmove, connectivity]) {
      expect(() => foundationPositionCells(fen, source as typeof original)).toThrow();
    }
    expect(calls).not.toHaveBeenCalled();
  });

  it("does not turn equal position bytes into cross-invocation source identity", () => {
    const first = foundationPositionCells(fen).values(), second = foundationPositionCells(fen).values();
    expect(first.map(value => value.payload)).toEqual(second.map(value => value.payload));
    first.forEach((value, index) => expect(value).not.toBe(second[index]));
    expect(routes.readFoundationPositionTuple(first)).toBe(first);
    expect(routes.readFoundationPositionTuple(second)).toBe(second);
    // Every swapped value is authentic and byte-equal, but has different original ancestry.
    for (const index of [0, 1, 2, 3, 4, 5]) {
      const crossed = [...first]; crossed[index] = second[index]!;
      expect(() => routes.readFoundationPositionTuple(Object.freeze(crossed) as typeof first)).toThrow(/original/);
    }
    expect(() => routes.readFoundationPositionTuple(Object.freeze(first.slice(1)) as unknown as typeof first)).toThrow();
    expect(() => routes.readFoundationPositionTuple([...first] as unknown as typeof first)).toThrow();
  });

  it("propagates a real required-source refusal even for an empty pawn domain", () => {
    const original = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) =>
      route === "rules.structural.reading.backward_pawn@3" ? { kind: "unavailable", reason: "input_abstained" }
        : original(route as never, input)) as typeof original);
    const cells = foundationPositionCells("7k/8/8/8/8/8/8/K7 w - - 0 1");
    expect(() => cells.values()).toThrow(/unavailable.*input_abstained/);
  });

  it("the actual retained candidate readings use those same original six inputs once", () => {
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute"), readings = candidateChildReadings(fen);
    const find = (key: string) => readings.find(value => `${value.projection.id}@${value.projection.version}` === key)!;
    const position = find("rules.mobility.reading.legal_moves@1"), connectivity = find("rules.structural.reading.pawn_connectivity@1");
    expect(position).toBeDefined(); expect(connectivity).toBeDefined();
    for (const route of ["rules.mobility.reading.legal_moves@1", "rules.structural.reading.pawn_connectivity@1",
      "rules.structural.reading.king_opposition@3", "rules.structural.reading.backward_pawn@3",
      "derived.structural.reading.pawn_file_group@1", "derived.activity.reading.file_state@1"]) {
      const invocations = calls.mock.calls.filter(([key]) => key === route);
      expect(invocations).toHaveLength(1);
      const args = invocations[0]![1];
      if (route.endsWith("@3")) expect((args as { position: unknown }).position).toBe(position);
      if (route.startsWith("derived.")) expect((args as { source: unknown }).source).toBe(connectivity);
    }
  });

  it("actual candidate acquisition refuses a genuine equal-byte snapshot from another legal source", () => {
    const replacement = foundationPositionCells(fen).opposition();
    const invoke = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) =>
      route === "rules.structural.reading.king_opposition@3" ? { kind: "available", value: replacement }
        : invoke(route as never, input)) as typeof invoke);
    expect(() => candidateChildReadings(fen)).toThrow(/original exact position prerequisite/);
  });
});
