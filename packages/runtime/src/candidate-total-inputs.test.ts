import { afterEach, describe, expect, it, vi } from "vitest";
import { CANDIDATE_EVENTS_SCOPE, CANDIDATE_READINGS_SCOPE, CANDIDATE_WIDE_SCOPE,
  compileCandidatePopulation, readCandidateFoundationSources, type CandidateFoundationSources } from "./candidate-population.js";
import { assertCandidateTotalInputs, type CandidateTotalInputs } from "./candidate-total-inputs.js";
import type { DeclaredEvidence } from "./evidence-contract.js";
import type { StructuralObservation } from "./structure.js";
import * as routes from "./internal/evidence-value-routes.js";

const quiet = "8/8/5k2/8/3K4/8/8/8 w - - 0 1";
const capture = "7k/8/8/3p4/2P5/8/8/7K w - - 0 1";
function frame(fen: string): CandidateFoundationSources {
  const result = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
  if (result.kind !== "ready") throw Error(JSON.stringify(result.error));
  return readCandidateFoundationSources(result.receipt);
}
function countMap(total: CandidateTotalInputs) {
  return Object.fromEntries(total.counts.map(item => [`${item.payload.color}:${item.payload.role}`, item.payload.count]));
}
afterEach(() => vi.restoreAllMocks());

describe("complete original candidate total inputs", () => {
  it("retains four real false king predicates, twelve counts including zeros and complete pseudo control", () => {
    const source = frame(quiet), total = source.root.totals;
    expect(total.kingZones.map(item => item.payload)).toEqual([
      { fen: quiet, feature: { kind: "king_zone", color: "white", zone: "edge" }, matched: false },
      { fen: quiet, feature: { kind: "king_zone", color: "white", zone: "corner" }, matched: false },
      { fen: quiet, feature: { kind: "king_zone", color: "black", zone: "edge" }, matched: false },
      { fen: quiet, feature: { kind: "king_zone", color: "black", zone: "corner" }, matched: false },
    ]);
    expect(total.counts).toHaveLength(12);
    expect(countMap(total)).toEqual({
      "white:pawn": 0, "white:knight": 0, "white:bishop": 0, "white:rook": 0, "white:queen": 0, "white:king": 1,
      "black:pawn": 0, "black:knight": 0, "black:bishop": 0, "black:rook": 0, "black:queen": 0, "black:king": 1,
    });
    expect(total.pawns).toEqual([]);
    expect(total.control.payload.colors.map(row => [row.color, row.pseudo.length])).toEqual([["white", 64], ["black", 64]]);
    expect(total.control.payload.colors[0]!.pseudo.find(row => row.target === "e5")!.controllers).toEqual([
      { square: "d4", piece: { color: "white", role: "king", promoted: false } },
    ]);
    expect(Object.isFrozen(total)).toBe(true);
    expect(Object.isFrozen(total.pawns)).toBe(true);
    expect(() => assertCandidateTotalInputs(total, source.root.risk)).not.toThrow();
  });

  it("keeps the complete original count collection in producer order and the exact retained child control", () => {
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute"), source = frame(capture);
    for (const position of [source.root, ...source.candidates.map(row => row.position)]) {
      const fen = position.common[0].payload.fen;
      const callsAtFen = calls.mock.calls.flatMap(([route, input], index) =>
        route === "rules.structural.reading.piece_count@1" && (input as { fen: string }).fen === fen
          ? [calls.mock.results[index]!.value] : []);
      expect(callsAtFen).toHaveLength(1); expect(position.totals.counts).toBe(callsAtFen[0]);
      expect(routes.readStructuralPopulationInvocation(position.totals.counts, "rules.structural.reading.piece_count@1", fen).items).toBe(position.totals.counts);
    }
    for (const child of source.candidates) {
      expect(child.row.readings.includes(child.position.totals.control)).toBe(true);
      expect(child.row.readings.some(item => child.position.totals.counts.includes(item as typeof child.position.totals.counts[number]))).toBe(false);
      child.position.totals.kingZones.forEach(item => expect(child.row.readings.includes(item)).toBe(false));
    }
  });

  it("records a real king corner transition without dropping the other three parameter slots", () => {
    const source = frame("7k/8/8/8/8/8/K7/8 w - - 0 1"), child = source.candidates.find(row => row.move.uci === "a2a1")!;
    expect(source.root.totals.kingZones.map(item => item.payload.matched)).toEqual([true, false, true, true]);
    expect(child.position.totals.kingZones.map(item => item.payload.matched)).toEqual([true, true, true, true]);
  });

  it("distinguishes original non-passed pawns from a genuine passer and a captured original pawn", () => {
    const source = frame(capture), child = source.candidates.find(row => row.move.uci === "c4d5")!;
    expect(source.root.totals.pawns.map(row => row.kind === "present" ? [row.root.square, row.source.payload.matched] : row.kind)).toEqual([["c4", false], ["d5", false]]);
    expect(child.position.totals.pawns).toHaveLength(2);
    const [mover, victim] = child.position.totals.pawns;
    expect(mover).toMatchObject({ kind: "present", root: { color: "white", role: "pawn", square: "c4" }, current: { color: "white", role: "pawn", square: "d5" } });
    if (mover!.kind !== "present") throw Error("Expected retained mover");
    expect(mover!.source.payload).toEqual({ fen: child.row.afterFen, feature: { kind: "passed_pawn", color: "white", square: "d5" }, matched: true });
    expect(victim).toEqual({ kind: "removed", root: { color: "black", role: "pawn", square: "d5" } });
    expect(Object.hasOwn(victim!, "source")).toBe(false);
  });

  it.each([
    ["7k/8/8/3pP3/8/8/8/7K w - d6 0 1", "e5d6", "d5", "e5", "d6", "white"],
    ["7k/8/8/8/3pP3/8/8/7K b - e3 0 1", "d4e3", "e4", "d4", "e3", "black"],
  ] as const)("%s retains the actual en-passant victim and mover: %s", (fen, move, victim, root, current, color) => {
    const source = frame(fen), child = source.candidates.find(row => row.move.uci === move)!;
    const pawn = child.position.totals.pawns.find(row => row.root.square === root)!;
    expect(pawn).toMatchObject({ kind: "present", current: { color, role: "pawn", square: current } });
    if (pawn.kind !== "present") throw Error("Expected actual EP mover");
    expect(pawn.source.payload.feature).toEqual({ kind: "passed_pawn", color, square: current });
    const removed = child.position.totals.pawns.find(row => row.root.square === victim)!;
    expect(removed.kind).toBe("removed"); expect(Object.hasOwn(removed, "source")).toBe(false);
  });

  it("keeps both colors in root-square order and never turns promotion into false membership", () => {
    const source = frame("7k/1P6/8/8/8/8/p7/7K w - - 0 1");
    expect(source.root.totals.pawns.map(row => [row.root.square, row.root.color])).toEqual([["a2", "black"], ["b7", "white"]]);
    for (const [suffix, role] of [["q", "queen"], ["r", "rook"], ["b", "bishop"], ["n", "knight"]] as const) {
      const child = source.candidates.find(row => row.move.uci === `b7b8${suffix}`)!;
      const [black, promoted] = child.position.totals.pawns;
      expect(black).toMatchObject({ kind: "present", root: { color: "black", square: "a2" } });
      expect(promoted).toEqual({ kind: "promoted", root: { color: "white", role: "pawn", square: "b7" }, current: { color: "white", role, square: "b8" } });
      expect(Object.hasOwn(promoted!, "source")).toBe(false);
      expect(countMap(child.position.totals)).toMatchObject({ "white:pawn": 0, "black:pawn": 1, [`white:${role}`]: 1 });
    }
  });

  it("a king capture retains an opponent pawn removal even when own-piece risk is empty", () => {
    const source = frame("7k/8/8/3p4/3K4/8/8/8 w - - 0 1"), child = source.candidates.find(row => row.move.uci === "d4d5")!;
    expect(source.root.risk.kind).toBe("available");
    if (source.root.risk.kind === "available") expect(source.root.risk.value.payload.pieces).toEqual([]);
    expect(child.position.totals.pawns).toEqual([{ kind: "removed", root: { color: "black", role: "pawn", square: "d5" } }]);
  });

  it("keeps risk unavailable and legal-control unavailable alongside complete independent pseudo facts", () => {
    const source = frame("7k/8/8/8/8/8/8/r6K w - - 0 1");
    expect(source.root.risk).toEqual({ kind: "unavailable", reason: "invalid_turn_clone" });
    expect(source.root.totals.kingZones).toHaveLength(4); expect(source.root.totals.counts).toHaveLength(12);
    expect(source.root.totals.control.payload.colors.map(row => [row.color, row.legal.kind, row.pseudo.length])).toEqual([
      ["white", "available", 64], ["black", "unavailable", 64],
    ]);
  });

  it("rejects partial/reordered/rewrapped count collections and missing/permuted false king predicates", () => {
    const { root } = frame(quiet), total = root.totals;
    for (const counts of [Object.freeze([...total.counts]), Object.freeze([...total.counts].reverse()), Object.freeze(total.counts.slice(1)), Object.freeze([])]) {
      expect(() => assertCandidateTotalInputs({ ...total, counts }, root.risk)).toThrow();
    }
    for (const kingZones of [Object.freeze(total.kingZones.slice(1)), Object.freeze([...total.kingZones].reverse()),
      Object.freeze([total.kingZones[0], total.kingZones[0], total.kingZones[2], total.kingZones[3]])]) {
      expect(() => assertCandidateTotalInputs({ ...total, kingZones } as CandidateTotalInputs, root.risk)).toThrow();
    }
  });

  it("refuses wrong pawn subjects, omitted original subjects and fabricated lifecycle predicates", () => {
    const source = frame(capture), total = source.root.totals, [first, second] = total.pawns;
    if (first?.kind !== "present" || second?.kind !== "present") throw Error("Expected real total pawn sources");
    for (const pawns of [Object.freeze(total.pawns.slice(1)), Object.freeze([...total.pawns].reverse()),
      Object.freeze([{ ...first, source: second.source }, second])]) {
      expect(() => assertCandidateTotalInputs({ ...total, pawns }, source.root.risk)).toThrow();
    }
    const child = source.candidates.find(row => row.move.uci === "c4d5")!;
    const manufactured = child.position.totals.pawns.map(row => row.kind === "removed" ? { ...row, source: second.source } : row);
    expect(() => assertCandidateTotalInputs({ ...child.position.totals, pawns: manufactured }, child.position.risk)).toThrow(/false passed predicate/);
  });

  it("authenticates original full-FEN counters for the reused control and predicate sources", () => {
    const { root } = frame(quiet), total = root.totals, other = quiet.replace(" 0 1", " 1 1");
    const otherTotal = frame(other).root.totals, control = otherTotal.control;
    expect(() => assertCandidateTotalInputs({ ...total, control }, root.risk)).toThrow(/original complete/);
    const changed = otherTotal.kingZones[0];
    expect(() => assertCandidateTotalInputs({ ...total, kingZones: [changed, total.kingZones[1], total.kingZones[2], total.kingZones[3]] }, root.risk)).toThrow(/original position/);
  });

  it("actual wide acquisition refuses a trimmed genuine producer collection", () => {
    const invoke = routes.invokeEvidenceValueRoute;
    const observed: { original: readonly DeclaredEvidence<StructuralObservation>[]; trimmed: readonly DeclaredEvidence<StructuralObservation>[] }[] = [];
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) => {
      const result = invoke(route as never, input);
      if (route !== "rules.structural.reading.piece_count@1") return result;
      const original = result as readonly DeclaredEvidence<StructuralObservation>[], trimmed = Object.freeze(original.slice(1));
      observed.push({ original, trimmed }); return trimmed;
    }) as typeof invoke);
    expect(() => frame(quiet)).toThrow(/complete exact factory invocation/);
    expect(observed).toHaveLength(1);
    expect(observed[0]!.original).toHaveLength(12); expect(observed[0]!.trimmed).toHaveLength(11);
    expect(observed[0]!.trimmed[0]).toBe(observed[0]!.original[1]);
    expect(() => routes.readStructuralPopulationInvocation(observed[0]!.original, "rules.structural.reading.piece_count@1", quiet)).not.toThrow();
  });

  it.each([CANDIDATE_EVENTS_SCOPE, CANDIDATE_READINGS_SCOPE])("direct narrow %j does not acquire the total predicate/count complements", scope => {
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const result = compileCandidatePopulation({ beforeFen: quiet, ruleset: "standard", scope });
    expect(result.kind).toBe("ready");
    expect(calls.mock.calls.some(([route]) => route === "rules.structural.predicate.king_zone@1"
      || route === "rules.structural.predicate.passed_pawn@1" || route === "rules.structural.reading.piece_count@1")).toBe(false);
  });
});
