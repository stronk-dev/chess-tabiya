import { describe, expect, it } from "vitest";
import { assertDeclaredEvidence, declareEvidence, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { directProjectionConventions } from "./evidence-convention-closure.js";
import { createRulesTacticReadingMoverPieceRiskV1Evidence, createRulesTransitionReadingPhysicalSliderRaysV1Evidence } from "./evidence-factories.js";
import { invokeEvidenceValueRoute, readMoverPieceRiskInvocation, readPhysicalSliderRaysInvocation } from "./internal/evidence-value-routes.js";

const legal = (fen: string) => invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });
type Legal = ReturnType<typeof legal>;
const rays = (position: Legal) => invokeEvidenceValueRoute("rules.transition.reading.physical_slider_rays@1", { position });
const risk = (root: Legal, position = root, moveUci: string | null = null) =>
  invokeEvidenceValueRoute("rules.tactic.reading.mover_piece_risk@1", { root, position, moveUci });
function available<T>(result: { readonly kind: "available"; readonly value: T } | { readonly kind: "unavailable"; readonly reason: string }): T {
  if (result.kind !== "available") throw Error(result.reason); return result.value;
}
function reseal<T>(original: DeclaredEvidence<T>): DeclaredEvidence<T> {
  const receipt = evidenceValueReceipt(original);
  return declareEvidence(original.producer, original.projection, original.payload,
    { factory: receipt.factory, inputDigest: receipt.inputDigest, sourceDigests: receipt.sourceDigests,
      ...(receipt.convention === undefined ? {} : { convention: receipt.convention }) });
}
const board = "1k6/8/6p1/8/6P1/8/8/4K1R1 w - - 0 1";

describe("original total physical-ray source", () => {
  it("retains the complete both-color board, all directions and exact full occupied interiors", () => {
    const root = legal(board), value = rays(root);
    assertDeclaredEvidence(value);
    expect(value.payload.fen).toBe(board);
    expect(value.payload.rows).toHaveLength(40);
    expect(value.payload.rows.filter(row => row.direction.df === -1 && row.direction.dr === -1).map(row => row.piece)).toEqual([
      { color: "white", role: "king", square: "e1" }, { color: "white", role: "rook", square: "g1" },
      { color: "white", role: "pawn", square: "g4" }, { color: "black", role: "pawn", square: "g6" },
      { color: "black", role: "king", square: "b8" },
    ]);
    const rook = value.payload.rows.filter(row => row.piece.square === "g1");
    expect(rook.map(row => ({ ...row.direction, ray: row.ray }))).toEqual([
      { df: -1, dr: -1, ray: null },
      { df: -1, dr: 0, ray: { slider: { color: "white", role: "rook", square: "g1" }, endpoint: "a1",
        strictInterior: ["f1", "e1", "d1", "c1", "b1"], blockers: [{ color: "white", role: "king", square: "e1" }] } },
      { df: -1, dr: 1, ray: null }, { df: 0, dr: -1, ray: null },
      { df: 0, dr: 1, ray: { slider: { color: "white", role: "rook", square: "g1" }, endpoint: "g8",
        strictInterior: ["g2", "g3", "g4", "g5", "g6", "g7"], blockers: [{ color: "white", role: "pawn", square: "g4" }, { color: "black", role: "pawn", square: "g6" }] } },
      { df: 1, dr: -1, ray: null },
      { df: 1, dr: 0, ray: { slider: { color: "white", role: "rook", square: "g1" }, endpoint: "h1", strictInterior: [], blockers: [] } },
      { df: 1, dr: 1, ray: null },
    ]);
    expect(value.payload.rows.filter(row => row.piece.role !== "rook").every(row => row.ray === null)).toBe(true);
    const original = readPhysicalSliderRaysInvocation(value);
    expect(original.position).toBe(root); expect(original.inputs).toHaveLength(1); expect(original.inputs[0]).toBe(root);
    expect(evidenceValueReceipt(value).sourceDigests).toEqual([evidenceValueReceipt(root).payloadDigest]);
    expect(Object.isFrozen(rook[4]!.ray!.blockers)).toBe(true);
  });
  it("keeps a complete no-slider domain and original authority rather than an absent result", () => {
    const root = legal("7k/8/8/8/8/8/8/K7 w - - 0 1"), value = rays(root);
    expect(value.payload.rows).toHaveLength(16); expect(value.payload.rows.every(row => row.ray === null)).toBe(true);
    expect(readPhysicalSliderRaysInvocation(value).position).toBe(root);
  });
  it("retains an unchanged ray with no sparse event witness", () => {
    const root = legal(board), after = legal("1k6/8/6p1/8/6P1/8/8/3K2R1 b - - 1 1");
    const find = (value: ReturnType<typeof rays>) => value.payload.rows.find(row => row.piece.square === "g1" && row.direction.df === 0 && row.direction.dr === 1);
    expect(find(rays(root))).toEqual(find(rays(after)));
    const events = invokeEvidenceValueRoute("rules.transition.event.slider_ray@2", { beforeFen: board, moveUci: "e1d1", afterFen: after.payload.fen });
    expect(events.length).toBeGreaterThan(0); expect(events.some(row => row.payload.direction.df === 0 && row.payload.direction.dr === 1)).toBe(false);
  });
  it("refuses copied/resealed/wrong roots and cannot authenticate an equal-byte replacement output", () => {
    const root = legal(board), value = rays(root);
    for (const position of [{ ...root }, reseal(root), invokeEvidenceValueRoute("rules.structural.reading.pawn_connectivity@1", { fen: board })]) {
      expect(() => rays(position as Legal)).toThrow();
    }
    expect(() => readPhysicalSliderRaysInvocation(reseal(value))).toThrow();
    expect(() => readPhysicalSliderRaysInvocation({ ...value })).toThrow();
    for (const input of [{ position: root, rows: [] }, { position: root, fen: board }, { position: root, source: root }]) {
      expect(() => invokeEvidenceValueRoute("rules.transition.reading.physical_slider_rays@1", input as never)).toThrow();
    }
  });
});

describe("original total mover risk source", () => {
  it("retains complete both-false states, original root/current identity and actual full state data", () => {
    const root = legal(board), after = legal("1k6/8/6p1/8/6P1/8/8/4K2R b - - 1 1");
    const beforeResult = risk(root), afterResult = risk(root, after, "g1h1");
    const before = available(beforeResult), value = available(afterResult);
    expect(before.payload).toMatchObject({ rootFen: board, fen: board, moveUci: null, actor: "white",
      evaluationFen: "1k6/8/6p1/8/6P1/8/8/4K1R1 b - - 0 1" });
    expect(value.payload).toMatchObject({ rootFen: board, fen: after.payload.fen, moveUci: "g1h1", actor: "white", evaluationFen: after.payload.fen });
    expect(value.payload.pieces.map(row => ({ root: row.root, current: row.current, enPrise: row.state.enPrise }))).toEqual([
      { root: { color: "white", role: "rook", square: "g1" }, current: { color: "white", role: "rook", square: "h1" }, enPrise: false },
      { root: { color: "white", role: "pawn", square: "g4" }, current: { color: "white", role: "pawn", square: "g4" }, enPrise: false },
    ]);
    const prior = invokeEvidenceValueRoute("rules.tactic.reading.loose_piece@1", { fen: value.payload.evaluationFen });
    for (const row of value.payload.pieces) expect(row.state).toEqual(prior.payload.pieces.find(state => state.piece.square === row.current.square));
    const original = readMoverPieceRiskInvocation(afterResult);
    expect(original.root).toBe(root); expect(original.position).toBe(after); expect(original.moveUci).toBe("g1h1");
    expect(original.inputs).toHaveLength(2); expect(original.inputs[0]).toBe(root); expect(original.inputs[1]).toBe(after);
    expect(original.result).toBe(afterResult); expect(evidenceValueReceipt(value).sourceDigests).toEqual([
      evidenceValueReceipt(root).payloadDigest, evidenceValueReceipt(after).payloadDigest,
    ]);
    const rootInvocation = readMoverPieceRiskInvocation(beforeResult);
    expect(rootInvocation.inputs[0]).toBe(root); expect(rootInvocation.inputs[1]).toBe(root);
  });
  it("distinguishes valid empty own risk from unavailable even on an empty own domain", () => {
    const quiet = legal("7k/8/8/8/8/8/8/K7 w - - 0 1");
    expect(available(risk(quiet)).payload.pieces).toEqual([]);
    const checked = legal("7k/8/8/8/8/8/8/r6K w - - 0 1"), result = risk(checked);
    expect(result).toEqual({ kind: "unavailable", reason: "invalid_turn_clone" });
    expect(readMoverPieceRiskInvocation(result).root).toBe(checked);
    expect(Object.isFrozen(result)).toBe(true);
    expect(() => readMoverPieceRiskInvocation({ ...result })).toThrow();
  });
  it("retains an actual profitable root capture and its safe child, without grading the move", () => {
    const root = legal("k7/8/8/2p5/3R4/8/8/7K w - - 0 1"), after = legal("k7/8/8/2p5/8/8/8/3R3K b - - 1 1");
    expect(available(risk(root)).payload.pieces[0]!.state).toMatchObject({ enPrise: true, legalCapturers: [{ captureUci: "c5d4" }] });
    expect(available(risk(root, after, "d4d1")).payload.pieces[0]).toMatchObject({ root: { square: "d4" }, current: { square: "d1" }, state: { enPrise: false } });
  });
  it("preserves actual en-passant landing/victim and clears only the hypothetical root EP", () => {
    const root = legal("7k/8/8/8/3p4/8/4P3/7K w - - 0 1"), after = legal("7k/8/8/8/3pP3/8/8/7K b - e3 0 1");
    const value = available(risk(root, after, "e2e4"));
    expect(value.payload.evaluationFen).toBe(after.payload.fen);
    expect(value.payload.pieces).toHaveLength(1);
    expect(value.payload.pieces[0]).toMatchObject({ root: { square: "e2", role: "pawn" }, current: { square: "e4", role: "pawn" },
      state: { enPrise: true, legalCapturers: [{ captureUci: "d4e3", square: "d4" }], piece: { square: "e4" } } });
    const epRoot = legal("7k/8/8/8/3pP3/8/8/7K b - e3 0 1"), baseline = available(risk(epRoot));
    expect(baseline.payload.fen).toBe(epRoot.payload.fen);
    expect(baseline.payload.evaluationFen).toBe("7k/8/8/8/3pP3/8/8/7K w - - 0 1");
  });
  it.each([
    ["q", "Q", "queen"], ["r", "R", "rook"], ["b", "B", "bishop"], ["n", "N", "knight"],
  ] as const)("%s promotion retains the root pawn and complete current-role risk", (suffix, letter, role) => {
    const root = legal("k7/7P/8/8/8/8/8/7K w - - 0 1"), after = legal(`k6${letter}/8/8/8/8/8/8/7K b - - 0 1`);
    const value = available(risk(root, after, `h7h8${suffix}`));
    expect(value.payload.pieces).toHaveLength(1);
    expect(value.payload.pieces[0]).toMatchObject({ root: { color: "white", role: "pawn", square: "h7" },
      current: { color: "white", role, square: "h8" }, state: { piece: { square: "h8", occupant: { color: "white", role } } } });
    const snapshot = rays(after);
    expect(snapshot.payload.rows.filter(row => row.piece.square === "h8" && row.ray !== null)).toHaveLength(role === "queen" ? 3 : role === "rook" ? 2 : role === "bishop" ? 1 : 0);
  });
  it("capture-promotion retires the enemy piece without losing the original own pawn", () => {
    const root = legal("r6k/1P6/8/8/8/8/8/7K w - - 0 1"), after = legal("Q6k/8/8/8/8/8/8/7K b - - 0 1");
    const value = available(risk(root, after, "b7a8q"));
    expect(value.payload.pieces).toHaveLength(1);
    expect(value.payload.pieces[0]).toMatchObject({ root: { square: "b7", role: "pawn" }, current: { square: "a8", role: "queen" } });
  });
  it.each([
    ["1k6/8/8/8/8/8/8/4K2R w K - 0 1", "e1h1", "1k6/8/8/8/8/8/8/5RK1 b - - 1 1", "h1", "f1", "white"],
    ["1k6/8/8/8/8/8/8/R3K3 w Q - 0 1", "e1a1", "1k6/8/8/8/8/8/8/2KR4 b - - 1 1", "a1", "d1", "white"],
    ["4k2r/8/8/8/8/8/8/1K6 b k - 0 1", "e8h8", "5rk1/8/8/8/8/8/8/1K6 w - - 1 2", "h8", "f8", "black"],
    ["1k6/8/8/8/8/8/8/6KR w K - 0 1", "g1h1", "1k6/8/8/8/8/8/8/5RK1 b - - 1 1", "h1", "f1", "white"],
    ["1k6/8/8/8/8/8/8/4KR2 w F - 0 1", "e1f1", "1k6/8/8/8/8/8/8/5RK1 b - - 1 1", "f1", "f1", "white"],
  ] as const)("castling retains original rook identity, including stationary pieces: %s", (before, move, next, from, to, color) => {
    const root = legal(before), after = legal(next), value = available(risk(root, after, move));
    expect(value.payload.pieces).toHaveLength(1);
    expect(value.payload.actor).toBe(color);
    expect(value.payload.pieces[0]).toMatchObject({ root: { color, role: "rook", square: from }, current: { color, role: "rook", square: to } });
  });
  it("rejects forged/resealed/cross-position/frame/alias inputs before a result can become absence", () => {
    const root = legal(board), sameBytes = legal(board), after = legal("1k6/8/6p1/8/6P1/8/8/4K2R b - - 1 1");
    const valid = risk(root, after, "g1h1");
    expect(() => readMoverPieceRiskInvocation({ ...valid })).toThrow();
    for (const input of [
      { root, position: sameBytes, moveUci: null }, { root: reseal(root), position: after, moveUci: "g1h1" },
      { root, position: reseal(after), moveUci: "g1h1" }, { root, position: root, moveUci: "g1h1" },
      { root, position: after, moveUci: "g1f1" }, { root, position: after, moveUci: "g1h1", actor: "black" },
      { root, position: after, moveUci: "g1h1", pieces: [] },
      { root, position: legal("1k6/8/6p1/8/6P1/8/8/4K2R b - - 2 1"), moveUci: "g1h1" },
    ]) expect(() => invokeEvidenceValueRoute("rules.tactic.reading.mover_piece_risk@1", input as never)).toThrow();
    const castle = legal("1k6/8/8/8/8/8/8/4K2R w K - 0 1"), castleAfter = legal("1k6/8/8/8/8/8/8/5RK1 b - - 1 1");
    expect(() => risk(castle, castleAfter, "e1g1")).toThrow(/exact original legal member/u);
  });
  it("direct factories refuse accessor input, while the dispatcher captures an authority field once", () => {
    const root = legal(board); let reads = 0;
    expect(() => createRulesTransitionReadingPhysicalSliderRaysV1Evidence({ get position() { reads++; return root; } })).toThrow();
    expect(() => createRulesTacticReadingMoverPieceRiskV1Evidence({ root, position: root, get moveUci() { reads++; return null; } })).toThrow();
    expect(reads).toBe(0);
    const value = invokeEvidenceValueRoute("rules.transition.reading.physical_slider_rays@1", { get position() { reads++; return root; } });
    expect(reads).toBe(1); expect(readPhysicalSliderRaysInvocation(value).position).toBe(root);
  });
});

it("registers two private sources without activating semantic roots, public slots or learner bindings", () => {
  for (const key of ["rules.transition.reading.physical_slider_rays@1", "rules.tactic.reading.mover_piece_risk@1"]) {
    const projection = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => `${row.id}@${row.version}` === key)!;
    expect(projection.disposition?.kind).toBe("inspector_only");
    expect(PRIMARY_EVIDENCE_MANIFEST.bindings.some(row => `${row.projection.id}@${row.projection.version}` === key)).toBe(false);
    expect(PRIMARY_EVIDENCE_MANIFEST.semanticEvents.some(row => `${row.projection.id}@${row.projection.version}` === key)).toBe(false);
  }
  expect(directProjectionConventions("rules.transition.reading.physical_slider_rays@1").map(row => `${row.id}@${row.version}`)).toContain("line-blocker-membership@1");
  expect(directProjectionConventions("rules.tactic.reading.mover_piece_risk@1").map(row => `${row.id}@${row.version}`)).toContain("legal-exchange@1");
});
