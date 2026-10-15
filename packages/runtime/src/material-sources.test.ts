import { normalizeMove } from "chessops/chess";
import { makeUci, parseUci } from "chessops/util";
import { describe, expect, it, vi } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceConventionReceipt, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { materialSignatureValue, materialAsymmetryValue, assertMaterialCauses } from "./internal/material-sources.js";
import { materialRoleAsymmetryEvent, materialRoleSignatureReading } from "./material-state.js";
import * as structure from "./structure.js";
import * as semantic from "./semantic-evidence.js";
import type { StructuralObservation } from "./structure.js";

const SIGNATURE = "derived.material.reading.role_signature@2";
const EVENT = "derived.material.event.role_asymmetry@2";
const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const roles = ["pawn", "knight", "bishop", "rook", "queen"] as const;
const slots = ["white", "black"].flatMap(color => roles.map(role => ({ color, role })));
const edges = [
  ["7k/8/8/3pP3/8/8/8/K7 w - d6 0 1", "e5d6"],
  ["7k/8/8/8/3Pp3/8/8/K7 b - d3 0 1", "e4d3"],
  ["4k3/8/8/3q4/8/8/3Q4/4K3 w - - 0 1", "d2d5"],
  ["4k3/3q4/8/8/3Q4/8/8/4K3 b - - 0 1", "d7d4"],
  ["4k3/8/8/8/8/8/n7/R3K3 w - - 7 1", "a1a2"],
  ["r3k3/N7/8/8/8/8/8/4K3 b - - 7 1", "a8a7"],
  ...["q", "r", "b", "n"].flatMap(piece => [
    ["7k/P7/8/8/8/8/8/7K w - - 7 1", `a7a8${piece}`],
    ["7k/8/8/8/8/8/p7/7K b - - 7 1", `a2a1${piece}`],
    ["1r5k/P7/8/8/8/8/8/7K w - - 7 1", `a7b8${piece}`],
    ["7k/8/8/8/8/8/p7/1R5K b - - 7 1", `a2b1${piece}`],
  ]),
];
function edge(fen: string, uci: string) {
  const position = positionFromFen(fen), beforeFen = canonicalFen(position);
  const move = normalizeMove(position, parseUci(uci)!);
  if (!position.isLegal(move)) throw new Error("material fixture must be legal");
  position.play(move);
  return { beforeFen, moveUci: makeUci(move), afterFen: canonicalFen(position) };
}

describe("material sources derive from actual count and capture/promotion inputs", () => {
  it.each([INITIAL, INITIAL.replace(" w ", " b "), "4k3/8/8/8/8/8/8/4K3 w - - 0 1", "4k3/8/8/8/8/8/8/4K3 b - - 0 1"])("retains ten real ordered inputs, including zeros: %s", fen => {
    const value = invokeEvidenceValueRoute(SIGNATURE, { fen });
    const population = invokeEvidenceValueRoute("rules.structural.reading.piece_count@1", { fen });
    const counts = slots.map(slot => population.find(item => item.payload.color === slot.color && item.payload.role === slot.role)!);
    expect(value.payload).toEqual(materialRoleSignatureReading(fen));
    expect(evidenceValueReceipt(value).sourceDigests).toEqual(counts.map(item => evidenceValueReceipt(item).payloadDigest));
    expect(evidenceValueReceipt(value).sourceDigests).toHaveLength(10);
    expect(value.payload.colors.map(color => Object.keys(color.counts))).toEqual([roles, roles]);
    expect(value.payload.asymmetry).toEqual({ pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0 });
    expect(value.payload.magnitude).toBe(0);
    expect(Object.isFrozen(value.payload.colors[0]!.sources)).toBe(true);
    expect(evidenceConventionReceipt(value)!.refs).toEqual([{ id: "material-role-signature", version: 1 }]);
  });

  it.each(edges)("preserves all vector changes and exact causes: %s %s", (fen, move) => {
    const anchor = edge(fen!, move!), items = invokeEvidenceValueRoute(EVENT, anchor);
    expect(items).toHaveLength(1);
    const item = items[0]!;
    expect(item.evidence.payload).toEqual(materialRoleAsymmetryEvent(anchor.beforeFen, anchor.moveUci, anchor.afterFen));
    expect(item.inputs.slice(0, 2).map(input => input.projection)).toEqual([
      { id: "derived.material.reading.role_signature", version: 2 }, { id: "derived.material.reading.role_signature", version: 2 },
    ]);
    expect(evidenceValueReceipt(item.evidence).sourceDigests).toEqual(item.inputs.map(input => evidenceValueReceipt(input).payloadDigest));
    const payload = item.evidence.payload;
    expect(payload.increased).toBe(payload.after.magnitude > payload.before.magnitude);
    expect(payload.changedRoles).toEqual(roles.filter(role => payload.before.vector[role] !== payload.after.vector[role]));
    expect(payload.sourceEvents.every(source => !Object.hasOwn(source, "before_fen") && !Object.hasOwn(source, "after_fen") && !Object.hasOwn(source, "move_uci"))).toBe(true);
    expect(Object.isFrozen(payload.sourceEvents)).toBe(true);
    for (const fen of [anchor.beforeFen, anchor.afterFen]) expect(invokeEvidenceValueRoute(SIGNATURE, { fen }).payload).toEqual(materialRoleSignatureReading(fen));
  });

  it("retains decreases and unchanged-magnitude role changes instead of selecting only increases", () => {
    const directions = { rise: 0, fall: 0, same: 0 }, arms = new Set<string>();
    for (const [fen, move] of edges) {
      const item = invokeEvidenceValueRoute(EVENT, edge(fen!, move!))[0]!, payload = item.evidence.payload;
      directions[payload.after.magnitude > payload.before.magnitude ? "rise" : payload.after.magnitude < payload.before.magnitude ? "fall" : "same"]++;
      arms.add(item.inputs.slice(2).map(input => input.projection.id).join(","));
    }
    expect(directions).toEqual({ rise: 4, fall: 10, same: 8 });
    expect(arms).toEqual(new Set(["rules.transition.event.capture", "rules.transition.event.promotion", "rules.transition.event.capture,rules.transition.event.promotion"]));
  });

  it.each([[INITIAL, "e2e4"], [INITIAL.replace(" w ", " b "), "e7e5"],
    ["r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 7 1", "e1h1"],
    ["r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 7 1", "e8h8"]])("quiet and castling edges succeed empty: %s %s", (fen, move) => {
    expect(invokeEvidenceValueRoute(EVENT, edge(fen!, move!))).toEqual([]);
  });

  it("accepts only closed raw source arms, not caller-selected counts, causes or outputs", () => {
    for (const extra of [{ counts: [] }, { inputs: [] }, { payload: {} }]) expect(() => invokeEvidenceValueRoute(SIGNATURE, { fen: INITIAL, ...extra })).toThrow();
    for (const extra of [{ causes: [] }, { inputs: [] }, { increased: true }]) expect(() => invokeEvidenceValueRoute(EVENT, { ...edge(INITIAL, "e2e4"), ...extra })).toThrow();
    expect(() => invokeEvidenceValueRoute(SIGNATURE, { fen: "invalid" })).toThrow();
    expect(() => invokeEvidenceValueRoute(EVENT, { ...edge(INITIAL, "e2e4"), afterFen: INITIAL })).toThrow();
  });

  function counts(fen = INITIAL) {
    const population = invokeEvidenceValueRoute("rules.structural.reading.piece_count@1", { fen });
    return slots.map(slot => population.find(value => value.payload.color === slot.color && value.payload.role === slot.role)!);
  }

  it("rejects genuine wrong-slot, missing, extra, duplicate, king and foreign-FEN count inputs", () => {
    const own = counts(), foreign = counts(INITIAL.replace(" w ", " b "));
    expect(own.map(value => value.payload)).toEqual(foreign.map(value => value.payload));
    expect(evidenceValueReceipt(own[0]!).inputDigest).not.toBe(evidenceValueReceipt(foreign[0]!).inputDigest);
    const king = invokeEvidenceValueRoute("rules.structural.reading.piece_count@1", { fen: INITIAL }).find(value => value.payload.role === "king")!;
    for (const inputs of [own.slice(1), [...own, own[0]!], [own[0]!, own[0]!, ...own.slice(2)], [...own].reverse(),
      [king, ...own.slice(1)], [...own.slice(0, 9), foreign[9]!], foreign]) expect(() => materialSignatureValue(INITIAL, inputs)).toThrow();
    for (const value of [{ ...own[0]! }, JSON.parse(JSON.stringify(own[0]!))]) {
      expect(() => materialSignatureValue(INITIAL, [value, ...own.slice(1)])).toThrow();
    }
    const wrongRef = invokeEvidenceValueRoute("rules.structural.reading.pawn_connectivity@1", { fen: INITIAL });
    expect(() => materialSignatureValue(INITIAL, [wrongRef as unknown as DeclaredEvidence<StructuralObservation>, ...own.slice(1)])).toThrow();
  });

  it("rejects incomplete capture-promotion arms and genuine causes/signatures from another edge", () => {
    const anchor = edge("1r5k/P7/8/8/8/8/8/7K w - - 7 1", "a7b8q");
    const other = edge("1r5k/P7/8/8/8/8/8/7K w - - 7 1", "a7b8n");
    const before = invokeEvidenceValueRoute(SIGNATURE, { fen: anchor.beforeFen });
    const after = invokeEvidenceValueRoute(SIGNATURE, { fen: anchor.afterFen });
    const capture = invokeEvidenceValueRoute("rules.transition.event.capture@1", anchor)[0]!;
    const promotion = invokeEvidenceValueRoute("rules.transition.event.promotion@1", anchor)[0]!;
    for (const causes of [[], [capture], [promotion], [promotion, capture], [capture, capture], [capture, promotion, promotion],
      [invokeEvidenceValueRoute("rules.transition.event.capture@1", other)[0]!, promotion]]) {
      expect(() => materialAsymmetryValue(anchor, before, after, causes)).toThrow();
    }
    expect(() => materialAsymmetryValue(anchor, before, invokeEvidenceValueRoute(SIGNATURE, { fen: other.afterFen }), [capture, promotion])).toThrow();
    for (const cause of [{ ...capture }, JSON.parse(JSON.stringify(capture))]) expect(() => materialAsymmetryValue(anchor, before, after, [cause, promotion])).toThrow();
    const foreignTurn = invokeEvidenceValueRoute(SIGNATURE, { fen: anchor.beforeFen.replace(" w ", " b ") });
    expect(foreignTurn.payload.colors).toEqual(before.payload.colors);
    expect(() => materialAsymmetryValue(anchor, foreignTurn, after, [capture, promotion])).toThrow();
    expect(() => assertMaterialCauses(edge(INITIAL, "e2e4"), [capture])).toThrow();
  });

  it.each(["negative", "fractional", "wrong_kind"] as const)("checks genuinely issued %s count metadata, not only seals", fault => {
    // Distinct uncached valid positions ensure the real source factory observes the injected fault.
    const fen = INITIAL.replace("0 1", fault === "negative" ? "31 12" : fault === "fractional" ? "32 12" : "33 12");
    const original = structure.structuralReading;
    const source = vi.spyOn(structure, "structuralReading").mockImplementation(input => {
      const reading = original(input);
      return { ...reading, features: reading.features.map(value => value.kind === "piece_count" && value.color === "white" && value.role === "pawn"
        ? { ...value, ...(fault === "wrong_kind" ? { kind: "pawn_count" as const } : { count: fault === "negative" ? -1 : 1.5 }) } : value) };
    });
    try { expect(() => invokeEvidenceValueRoute(SIGNATURE, { fen })).toThrow(); }
    finally { source.mockRestore(); }
  });

  it("validates bad FEN/edge before acquiring count or transition sources", () => {
    const counts = vi.spyOn(structure, "structuralReading"), causes = vi.spyOn(semantic, "transitionSemanticEventPayloads");
    try {
      expect(() => invokeEvidenceValueRoute(SIGNATURE, { fen: "invalid" })).toThrow();
      expect(() => invokeEvidenceValueRoute(EVENT, { ...edge(INITIAL, "e2e4"), afterFen: INITIAL })).toThrow();
      expect(counts).not.toHaveBeenCalled(); expect(causes).not.toHaveBeenCalled();
    } finally { counts.mockRestore(); causes.mockRestore(); }
  });

  it.each(["missing_capture", "duplicate_promotion"] as const)("rejects genuinely issued incomplete/duplicated cause populations: %s", fault => {
    const anchor = edge(`1r5k/P7/8/8/8/8/8/7K w - - ${fault === "missing_capture" ? 41 : 42} 14`, "a7b8q");
    const original = semantic.transitionSemanticEventPayloads;
    const source = vi.spyOn(semantic, "transitionSemanticEventPayloads").mockImplementation((before, move, after) => {
      const population = original(before, move, after);
      return fault === "missing_capture" ? population.filter(value => value.family !== "capture")
        : [...population, population.find(value => value.family === "promotion")!];
    });
    try { expect(() => invokeEvidenceValueRoute(EVENT, anchor)).toThrow(); }
    finally { source.mockRestore(); }
  });

  it("has independent hand-count arithmetic for capture-promotion and keeps sources immutable", () => {
    const anchor = edge("1r5k/P7/8/8/8/8/8/7K w - - 7 1", "a7b8n"), result = invokeEvidenceValueRoute(EVENT, anchor)[0]!;
    expect(result.evidence.payload.before).toEqual({ vector: { pawn: 1, knight: 0, bishop: 0, rook: 1, queen: 0 }, magnitude: 2 });
    expect(result.evidence.payload.after).toEqual({ vector: { pawn: 0, knight: 1, bishop: 0, rook: 0, queen: 0 }, magnitude: 1 });
    expect(result.evidence.payload.changedRoles).toEqual(["pawn", "knight", "rook"]);
    expect(() => { (result.evidence.payload.after.vector as { knight: number }).knight = 99; }).toThrow();
    expect(invokeEvidenceValueRoute(EVENT, anchor)[0]!.evidence.payload.after.vector.knight).toBe(1);
  });

  it("registers the exact fixed ten-count tuple and three complete event arms without partial consumer cutover", () => {
    for (const key of [SIGNATURE, EVENT]) {
      const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(value => `${value.id}@${value.version}` === key)!;
      expect(declaration).toMatchObject({ grounding: "position_rules", exactness: "exact", confidence: "not_applicable", answerContent: ["fact"], disposition: { kind: "experimental" } });
      expect(PRIMARY_EVIDENCE_MANIFEST.bindings.some(value => `${value.projection.id}@${value.projection.version}` === key)).toBe(false);
      expect(PRIMARY_EVIDENCE_MANIFEST.semanticEvents.some(value => `${value.projection.id}@${value.projection.version}` === key)).toBe(false);
    }
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.find(value => `${value.id}@${value.version}` === SIGNATURE)!.derivation).toEqual({ inputs: Array.from({ length: 10 }, () => ({ id: "rules.structural.reading.piece_count", version: 1 })) });
  });
});
