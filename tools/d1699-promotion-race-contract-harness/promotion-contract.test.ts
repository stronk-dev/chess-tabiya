// DISPOSABLE research harness — D1699/D1700. Not production code.
import { describe, expect, it } from "vitest";

import {
  EVIDENCE_CONTRACT_DECLARATIONS,
  PRIMARY_EVIDENCE_MANIFEST,
  compileEvidenceManifest,
  declareExactLegalMovesEvidence,
  declarePawnContactsEvidence,
  exactLegalMoveMap,
  pawnContactsReading,
  promotionRaceGeometry,
  promotionRaceTablebase,
  type DeclaredEvidence,
  type EvidenceContractDeclarations,
  type ExactLegalMoveMap,
  type PawnContactsReading,
  type ProducerDeclaration,
  type ProjectionDeclaration,
  type PromotionRaceGeometry,
  type PromotionRaceGeometryResult,
} from "@chess-tabiya/runtime";

type Latency = ProducerDeclaration["latency"];
type SourceKind = "recorded.tablebase.result" | "live.syzygy.position_result";

interface PositionTablebaseReceipt {
  readonly projection: SourceKind;
  readonly fen: string;
  readonly sourceId: string;
  readonly retrievedAt: string;
  readonly category: string;
  readonly dtz: number | null;
  readonly preciseDtz: number | null;
  readonly pieceCount: number;
}

function repairedGeometry(input: DeclaredEvidence<PawnContactsReading> | undefined): PromotionRaceGeometryResult {
  if (input === undefined) return Object.freeze({ kind: "unavailable", reason: "input_abstained" });
  if (input.projection.id !== "rules.pawn.reading.contacts") throw new TypeError("promotion race requires declared pawn contacts");
  const baseline = promotionRaceGeometry(input.payload.fen);
  if (baseline.kind === "unavailable") return baseline;
  const passed = new Set(input.payload.passed.filter((row) => row.passed).map((row) => `${row.pawn.piece.color}:${row.pawn.square}`));
  const pawns = baseline.value.pawns.filter((row) => passed.has(`${row.pawn.piece.color}:${row.pawn.square}`));
  if (!pawns.some((row) => row.pawn.piece.color === "white") || !pawns.some((row) => row.pawn.piece.color === "black")) {
    return Object.freeze({ kind: "unavailable", reason: "blocked_or_capturable_path_outside_convention" });
  }
  const byPly = new Map<number, typeof pawns>();
  for (const pawn of pawns) byPly.set(pawn.arrivalPly, Object.freeze([...(byPly.get(pawn.arrivalPly) ?? []), pawn]));
  const ordering = [...byPly].sort((left, right) => left[0] - right[0]).map(([arrivalPly, rows]) => Object.freeze({
    arrivalPly,
    pawns: Object.freeze(rows.map((row) => row.pawn).sort((left, right) => left.square.localeCompare(right.square))),
  }));
  const value: PromotionRaceGeometry = Object.freeze({
    ...baseline.value,
    pawns: Object.freeze(pawns),
    ordering: Object.freeze(ordering),
  });
  return Object.freeze({ kind: "available", value });
}

function repairedTablebaseJoin(
  geometry: PromotionRaceGeometryResult,
  legalMoves: DeclaredEvidence<ExactLegalMoveMap>,
  source: PositionTablebaseReceipt | undefined,
) {
  if (geometry.kind === "unavailable") return Object.freeze({ kind: "unavailable" as const, reason: "input_abstained" as const });
  if (legalMoves.projection.id !== "rules.mobility.reading.legal_moves" || legalMoves.payload.fen !== geometry.value.fen) {
    throw new TypeError("promotion geometry and exact legal-move positions differ");
  }
  if (source === undefined) return Object.freeze({ kind: "unavailable" as const, reason: "provider_unavailable" as const });
  if (source.fen !== geometry.value.fen) throw new TypeError("promotion geometry and tablebase source positions differ");
  return promotionRaceTablebase(geometry, {
    category: source.category,
    dtz: source.dtz,
    preciseDtz: source.preciseDtz,
    provider: source.sourceId,
    pieceCount: source.pieceCount,
  });
}

function disposition(reason: string) {
  return Object.freeze({ kind: "operator_only" as const, reason });
}

function sourceProjection(): ProjectionDeclaration {
  return Object.freeze({
    id: "live.syzygy.position_result", version: 1,
    producer: Object.freeze({ id: "live.syzygy", version: 1 }),
    role: "source_record", plane: "search", payloadType: "LiveSyzygyPositionReceipt",
    semantics: "Exact requested FEN joined to one parsed Syzygy position response and source receipt.",
    operands: Object.freeze(["fen", "sourceId", "retrievedAt", "result"]), signs: Object.freeze(["state"]),
    grounding: "tablebase_exact", exactness: "exact", confidence: "not_applicable",
    abstention: Object.freeze({ possible: true, reasons: Object.freeze(["outside_tablebase_domain", "provider_unavailable"]) }),
    answerContent: Object.freeze(["fact", "evaluation", "candidate_moves", "move"]),
    forms: Object.freeze(["list", "panel", "machine_condition"]), dependsOn: Object.freeze([]),
    limitations: Object.freeze(["A position result supplies exact tablebase facts only; it does not name a race or plan."]),
    disposition: disposition("Shared provider source awaits named Review/endgame consumers."),
  });
}

function geometryProjection(): ProjectionDeclaration {
  return Object.freeze({
    id: "derived.pawn.promotion_race_geometry", version: 1,
    producer: Object.freeze({ id: "derived.pawn", version: 1 }),
    role: "reading", plane: "derived", payloadType: "PromotionRaceGeometryResult",
    semantics: "race-arrival@1 orders opposing passed pawns with clear forward paths by alternating-turn arrival ply; it contains no outcome.",
    operands: Object.freeze(["fen", "pawns", "arrivalConvention", "ordering", "sideToMove"]), signs: Object.freeze(["state"]),
    grounding: "position_rules", exactness: "convention", confidence: "not_applicable",
    abstention: Object.freeze({ possible: true, reasons: Object.freeze(["blocked_or_capturable_path_outside_convention", "input_abstained"]) }),
    answerContent: Object.freeze(["fact"]), forms: Object.freeze(["list", "panel", "lit_squares", "machine_condition"]),
    dependsOn: Object.freeze([Object.freeze({ id: "rules.pawn.reading.contacts", version: 1 })]),
    derivation: Object.freeze({ inputs: Object.freeze([Object.freeze({ id: "rules.pawn.reading.contacts", version: 1 })]) }),
    limitations: Object.freeze(["Descriptive stride order is not a win/loss/draw verdict, recommendation or proof that promotion occurs."]),
    disposition: Object.freeze({ kind: "inspector_only", reason: "Geometry lands before module and bot eligibility." }),
  });
}

function tablebaseProjection(): ProjectionDeclaration {
  const geometry = Object.freeze({ id: "derived.pawn.promotion_race_geometry", version: 1 });
  const legalMoves = Object.freeze({ id: "rules.mobility.reading.legal_moves", version: 1 });
  const recorded = Object.freeze({ id: "recorded.tablebase.result", version: 1 });
  const live = Object.freeze({ id: "live.syzygy.position_result", version: 1 });
  return Object.freeze({
    id: "derived.pawn.promotion_race_tablebase", version: 1,
    producer: Object.freeze({ id: "derived.pawn", version: 1 }),
    role: "event", plane: "derived", payloadType: "PromotionRaceTablebaseResult",
    semantics: "Joins the exact same-position race participants to one recorded or live Syzygy source; only the source supplies outcome.",
    operands: Object.freeze(["geometry", "category", "dtz", "preciseDtz", "source", "immediatePromotion", "promotionFirst", "promotionWithCheck"]),
    signs: Object.freeze(["state"]), grounding: "declared_convention", exactness: "convention", confidence: "not_applicable",
    abstention: Object.freeze({ possible: true, reasons: Object.freeze(["outside_tablebase_domain", "provider_unavailable", "input_abstained"]) }),
    answerContent: Object.freeze(["fact", "evaluation"]), forms: Object.freeze(["list", "panel", "timeline_marker", "machine_condition"]),
    dependsOn: Object.freeze([geometry, legalMoves, recorded, live]),
    derivation: Object.freeze({ anyOf: Object.freeze([Object.freeze([geometry, legalMoves, recorded]), Object.freeze([geometry, legalMoves, live])]) }),
    limitations: Object.freeze(["Geometry does not grade the race; source absence is unavailable, never a refuted outcome."]),
    disposition: Object.freeze({ kind: "inspector_only", reason: "Exact outcome join lands before module and bot eligibility." }),
  });
}

function prospectiveDeclarations(): EvidenceContractDeclarations {
  return Object.freeze({
    ...EVIDENCE_CONTRACT_DECLARATIONS,
    producers: Object.freeze(EVIDENCE_CONTRACT_DECLARATIONS.producers.map((producer) => {
      if (producer.id === "live.syzygy") return Object.freeze({ ...producer, outputs: Object.freeze([...producer.outputs, sourceProjection()]) });
      if (producer.id === "derived.pawn") return Object.freeze({ ...producer, outputs: Object.freeze([...producer.outputs, geometryProjection(), tablebaseProjection()]) });
      return producer;
    })),
  });
}

const latencyRank: Readonly<Record<Latency, number>> = Object.freeze({ sync: 0, interactive: 1, background: 2, offline: 3 });
function memberLatency(projection: ProjectionDeclaration, producers: ReadonlyMap<string, ProducerDeclaration>, projections: ReadonlyMap<string, ProjectionDeclaration>): readonly Latency[] {
  const derivation = projection.derivation;
  if (derivation === undefined) return Object.freeze([producers.get(projection.producer.id)!.latency]);
  const members = "inputs" in derivation ? [derivation.inputs!] : derivation.anyOf;
  return Object.freeze(members.map((member) => member.reduce<Latency>((slowest, ref) => {
    const dependency = projections.get(ref.id)!;
    const candidates = memberLatency(dependency, producers, projections);
    const dependencyWorst = [...candidates].sort((left, right) => latencyRank[right] - latencyRank[left])[0]!;
    return latencyRank[dependencyWorst] > latencyRank[slowest] ? dependencyWorst : slowest;
  }, producers.get(projection.producer.id)!.latency)));
}

describe("D1699 exact geometry authority", () => {
  it("reproduces the raw-FEN false positive and refuses it through declared passed-pawn evidence", () => {
    const mutuallyCapturable = "4k3/1p6/8/8/8/8/P7/4K3 w - - 0 1";
    expect(promotionRaceGeometry(mutuallyCapturable).kind).toBe("available");
    const contacts = pawnContactsReading(mutuallyCapturable);
    expect(contacts.passed.map((row) => row.passed)).toEqual([false, false]);
    expect(repairedGeometry(declarePawnContactsEvidence(contacts))).toEqual({ kind: "unavailable", reason: "blocked_or_capturable_path_outside_convention" });
  });

  it("retains the established opposing-passed-pawn race and typed input abstention", () => {
    const race = "4k3/7p/8/8/8/8/P7/4K3 w - - 0 1";
    expect(repairedGeometry(declarePawnContactsEvidence(pawnContactsReading(race)))).toMatchObject({
      kind: "available", value: { ordering: [{ arrivalPly: 9 }, { arrivalPly: 10 }] },
    });
    expect(repairedGeometry(undefined)).toEqual({ kind: "unavailable", reason: "input_abstained" });
  });
});

describe("D1699 same-position Syzygy join", () => {
  it("shows the current piece-count join accepts another position and the repaired join refuses it", () => {
    const fen = "4k3/P7/8/8/8/8/7p/4K3 w - - 0 1";
    const geometry = repairedGeometry(declarePawnContactsEvidence(pawnContactsReading(fen)));
    const legal = declareExactLegalMovesEvidence(exactLegalMoveMap(fen));
    expect(promotionRaceTablebase(geometry, { category: "win", dtz: 1, preciseDtz: 1, provider: "wrong-position", pieceCount: 4 }).kind).toBe("available");
    const wrong: PositionTablebaseReceipt = Object.freeze({
      projection: "recorded.tablebase.result", fen: "4k3/8/P7/8/8/7p/8/4K3 b - - 0 1",
      sourceId: "wrong-position", retrievedAt: "2026-08-26T00:00:00.000Z", category: "win",
      dtz: 1, preciseDtz: 1, pieceCount: 4,
    });
    expect(() => repairedTablebaseJoin(geometry, legal, wrong)).toThrow(/positions differ/u);
  });

  it("admits both source kinds only at the same position and preserves absence as unavailable", () => {
    const fen = "4k3/P7/8/8/8/8/7p/4K3 w - - 0 1";
    const geometry = repairedGeometry(declarePawnContactsEvidence(pawnContactsReading(fen)));
    const legal = declareExactLegalMovesEvidence(exactLegalMoveMap(fen));
    for (const projection of ["recorded.tablebase.result", "live.syzygy.position_result"] as const) {
      expect(repairedTablebaseJoin(geometry, legal, {
        projection, fen, sourceId: projection, retrievedAt: "2026-08-26T00:00:00.000Z",
        category: "draw", dtz: 0, preciseDtz: 0, pieceCount: 4,
      })).toMatchObject({ kind: "available", value: { category: "draw", geometry: { fen } } });
    }
    expect(repairedTablebaseJoin(geometry, legal, undefined)).toEqual({ kind: "unavailable", reason: "provider_unavailable" });
  });
});

describe("D963 literal F1 graph", () => {
  it("compiles geometry from one exact pawn authority and tablebase from literal live-or-recorded alternatives", () => {
    const manifest = compileEvidenceManifest(prospectiveDeclarations());
    const geometry = manifest.projections.find((row) => row.id === "derived.pawn.promotion_race_geometry")!;
    const outcome = manifest.projections.find((row) => row.id === "derived.pawn.promotion_race_tablebase")!;
    expect(geometry.derivation).toEqual({ inputs: [{ id: "rules.pawn.reading.contacts", version: 1 }] });
    expect(outcome.derivation).toEqual({ anyOf: [
      [{ id: "derived.pawn.promotion_race_geometry", version: 1 }, { id: "rules.mobility.reading.legal_moves", version: 1 }, { id: "recorded.tablebase.result", version: 1 }],
      [{ id: "derived.pawn.promotion_race_geometry", version: 1 }, { id: "rules.mobility.reading.legal_moves", version: 1 }, { id: "live.syzygy.position_result", version: 1 }],
    ] });
  });
});

describe("D1700 projection-effective latency", () => {
  it("proves one producer-wide sync label cannot describe local geometry and a live-or-recorded outcome", () => {
    const declarations = prospectiveDeclarations();
    const producers = new Map(declarations.producers.map((row) => [row.id, row]));
    const projections = new Map(declarations.producers.flatMap((row) => row.outputs.map((output) => [output.id, output] as const)));
    const geometry = projections.get("derived.pawn.promotion_race_geometry")!;
    const outcome = projections.get("derived.pawn.promotion_race_tablebase")!;
    expect(producers.get("derived.pawn")!.latency).toBe("sync");
    expect(memberLatency(geometry, producers, projections)).toEqual(["sync"]);
    expect(memberLatency(outcome, producers, projections)).toEqual(["sync", "interactive"]);
    expect(PRIMARY_EVIDENCE_MANIFEST.producers.find((row) => row.id === "derived.pawn")!.latency).toBe("sync");
  });
});
