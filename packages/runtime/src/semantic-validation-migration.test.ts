// D3628: elevate existing nearby negatives, not new chess judgements.
// Fixtures are retained from breadth-semantic, semantic-tactics, semantic-tactic-sequences
// and D1714's harassment/defender-consequence assertions. Their original tests remain intact.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";
import { canonicalFen, positionFromFen } from "./chess.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT, SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { SEMANTIC_VALIDATION_OPERATIONS } from "./semantic-validation-operations.js";
import { assertSemanticTargetValueAuthority, executeSemanticValidationCase, selectSemanticTargets, subjectSemanticResult } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase, semanticRecordedPathDigest, type SemanticEdgeInput, type SemanticRecordedSequenceInput, type SemanticSequenceFamily, type SemanticValidationOperationId, type SemanticValidationSubject } from "./semantic-validation.js";
import { defenderRemovedEvents } from "./tactics.js";

function edges(fen: string, moves: readonly string[]): readonly SemanticEdgeInput[] {
  return moves.map(moveUci => {
    const beforeFen = fen, position = positionFromFen(fen);
    const move = normalizeMove(position, parseUci(moveUci)!);
    expect(position.isLegal(move)).toBe(true);
    position.play(move);
    fen = canonicalFen(position);
    return { kind: "edge", beforeFen, moveUci, afterFen: fen };
  });
}

function sequence(family: SemanticSequenceFamily, fen: string, moves: readonly string[], fromPly = 0): SemanticRecordedSequenceInput {
  const pathEdges = edges(fen, moves);
  return { kind: "recorded_sequence", family, fromPly, horizon: (moves.length - fromPly) as 2 | 3 | 4 | 5,
    path: { kind: "recorded_path", pathReceipt: { id: "run.record.edge", version: 1 }, edges: pathEdges, pathDigest: semanticRecordedPathDigest(pathEdges) } };
}

const cases = () => (JSON.parse(readFileSync(resolve(SEMANTIC_VALIDATION_REPOSITORY_ROOT, "packages/runtime/src/semantic-validation-cases.json"), "utf8")) as { cases: unknown[] }).cases.map(parseSemanticValidationCase);

async function checked(id: string | null, projection: string, version: number, operation: SemanticValidationOperationId,
  input: SemanticEdgeInput | SemanticRecordedSequenceInput, emits: boolean): Promise<void> {
  const subject: SemanticValidationSubject = { kind: "event", projection: { id: projection, version } };
  // The real registered operation must finish. Missing continuation or source abstention cannot
  // pass as zero target events, and an event for a different version cannot satisfy this case.
  const result = subjectSemanticResult(await SEMANTIC_VALIDATION_OPERATIONS[operation].invoke(input as never), subject);
  expect(result.kind).toBe("completed");
  const targets = selectSemanticTargets(result, subject);
  if (emits) expect(targets.length).toBeGreaterThan(0);
  else expect(targets).toHaveLength(0);
  for (const target of targets) expect(assertSemanticTargetValueAuthority(target).projection).toBe(`${projection}@${version}`);
  if (id === null) return;
  const registered = cases(), value = registered.find(value => value.id === id);
  expect(value, `missing canonical emitter case ${id}`).toBeDefined();
  // Canonical evidence qualification runs the entire recorded application path. The selected
  // window above independently proves completion; it is not a second path-minting authority.
  const caseInput = input.kind === "recorded_sequence" ? input.path : input;
  const caseOperation = input.kind === "recorded_sequence" ? "runtime.semantic.recorded_path" : operation;
  expect(value!.input).toEqual(caseInput);
  expect(value!.subject).toEqual(subject);
  expect(value!.operation).toEqual({ id: caseOperation, version: 1 });
  expect(value!.arm).toBe(emits ? "positive" : "semantic_negative");
  const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, new Map(registered.map(row => [row.id, row])));
  expect(receipt.failure).toBeNull();
  expect(receipt.status).toBe("passed");
  expect(receipt.invocations).toBe(1);
  expect(receipt.resultKind).toBe("completed");
}

async function pair(id: string, projection: string, family: SemanticSequenceFamily,
  positive: SemanticRecordedSequenceInput, negative: SemanticRecordedSequenceInput): Promise<void> {
  expect(positive.family).toBe(family); expect(negative.family).toBe(family);
  await checked(`migration.${id}.positive`, projection, 2, "runtime.semantic.recorded_sequence", positive, true);
  await checked(`migration.${id}.negative`, projection, 2, "runtime.semantic.recorded_sequence", negative, false);
}

describe("grounded semantic negatives through production evidence", () => {
  it("D3628 exposure: completes the legal edge without a positive target capture", async () => {
    await checked(null, "derived.tactic.defender_exposure", 1, "runtime.semantic.breadth_edge", edges("r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", ["c5b6"])[0]!, true);
    await checked("migration.exposure.negative", "derived.tactic.defender_exposure", 1, "runtime.semantic.breadth_edge", edges("3rk3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", ["c5b6"])[0]!, false);
  });

  it("D3628 open file: a stationary rook is not an occupancy move", async () => {
    await checked(null, "derived.activity.event.open_file_occupancy", 1, "runtime.semantic.breadth_edge", edges("4k3/8/8/8/8/8/P7/R3K3 w - - 0 1", ["a1d1"])[0]!, true);
    await checked("migration.open-file.negative", "derived.activity.event.open_file_occupancy", 1, "runtime.semantic.breadth_edge", edges("4k3/8/8/8/8/1p6/P7/R3K3 w - - 0 1", ["a2b3"])[0]!, false);
  });

  it("D3628 relocation: a knight move without a retained target loses no duty", async () => {
    const before = edges("r3k3/8/1n6/8/2P5/8/8/R3K3 w - - 0 1", ["c4c5"])[0]!.afterFen;
    await checked(null, "rules.tactic.event.defender_duty_relocated", 1, "runtime.semantic.duty_edge", edges(before, ["b6d7"])[0]!, true);
    await checked("migration.relocation.negative", "rules.tactic.event.defender_duty_relocated", 1, "runtime.semantic.duty_edge", edges("4k3/8/1n6/8/8/8/8/4K3 b - - 0 1", ["b6c8"])[0]!, false);
  });

  it("D3628 harassment: a completed retreat must retain the pressure", async () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    await pair("harassment", "derived.pawn.sequence.harassment_pressure", "harassment_pressure",
      sequence("harassment_pressure", fen, ["d2d4", "d7d5", "g1f3", "g8f6", "e2e3", "c8g4", "h2h3", "g4h5"], 6),
      sequence("harassment_pressure", fen, ["d2d4", "d7d5", "g1f3", "g8f6", "e2e3", "c8g4", "h2h3", "g4f5"], 6));
  });

  it("D3628 defender consequence: a moved target is not the retained target", async () => {
    const fen = "r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1";
    await pair("defender-consequence", "derived.tactic.sequence.defender_consequence", "defender_consequence",
      sequence("defender_consequence", fen, ["c5b6", "e8d7", "a1a8"]),
      sequence("defender_consequence", fen, ["c5b6", "a8a7", "a1a7"]));
  });

  it("D3628 deflection: the later capture must join the displaced defender's duty", async () => {
    await pair("deflection", "derived.tactic.deflection_observed", "deflection",
      sequence("deflection", "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]),
      sequence("deflection", "1B5k/r7/2n1q3/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e6"]));
  });

  it("D3628 attraction: the minor-piece sequence does not meet the retained role rule", async () => {
    await pair("attraction", "derived.tactic.attraction_observed", "attraction",
      sequence("attraction", "4k3/8/4B3/8/8/8/8/R5K1 w - - 0 1", ["e6d7", "e8d7", "a1d1"]),
      sequence("attraction", "4k3/8/1n6/8/2B5/8/8/R5K1 w - - 0 1", ["c4d5", "b6d5", "a1d1"]));
  });

  it("D3628 ray clearance: square reuse does not create the captured-ray motif", async () => {
    await pair("ray-clearance", "derived.tactic.line_blocker_clearance_observed", "line_clearance",
      sequence("line_clearance", "q3k3/8/8/8/N7/8/8/R3K3 w - - 0 1", ["a4b6", "e8f7", "a1a8"]),
      sequence("line_clearance", "4k3/8/8/8/8/8/8/RN2K3 w - - 0 1", ["b1c3", "e8d7", "a1b1"]));
  });

  it("D3628 square clearance: the ray capture does not reuse the vacated square", async () => {
    await pair("square-clearance", "derived.tactic.square_clearance_observed", "square_clearance",
      sequence("square_clearance", "4k3/8/8/8/8/8/8/RN2K3 w - - 0 1", ["b1c3", "e8d7", "a1b1"]),
      sequence("square_clearance", "q3k3/8/8/8/N7/8/8/R3K3 w - - 0 1", ["a4b6", "e8f7", "a1a8"]));
  });

  it("D3628 interference: an unrelated rook capture does not break the slider duty", async () => {
    const fen = "r3k3/8/1R6/q7/8/8/8/6K1 w - - 0 1";
    await pair("interference", "derived.tactic.interference_observed", "interference",
      sequence("interference", fen, ["b6a6", "e8d7", "a6a5"]),
      sequence("interference", fen, ["b6b5", "e8d7", "b5a5"]));
  });

  it("D3628 overload: the later capture alone does not establish multiple retained duties", async () => {
    await pair("overload", "derived.tactic.overload_exploitation_observed", "overload_exploitation",
      sequence("overload_exploitation", "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]),
      sequence("overload_exploitation", "1B5k/r3q3/1n6/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "b6a8", "e1e7"]));
  });

  it("D3628 zwischenzug: a quiet intervening move is not an intervening check", async () => {
    const fen = "4k3/8/8/8/1b6/2N5/1P6/3Q2K1 b - - 0 1";
    await pair("zwischenzug", "derived.tactic.check_zwischenzug_observed", "checking_zwischenzug",
      sequence("checking_zwischenzug", fen, ["b4c3", "d1h5", "e8f8", "b2c3"]),
      sequence("checking_zwischenzug", fen, ["b4c3", "d1g4", "e8f8", "b2c3"]));
  });

  it("keeps a missing capture operand separate from a legal defender-removal negative", async () => {
    const edge = edges("r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", ["c5b6"])[0]!;
    expect(defenderRemovedEvents(edge.beforeFen, edge.moveUci, edge.afterFen, undefined)).toEqual([]);
    await checked(null, "rules.tactic.event.defender_removed", 1, "runtime.semantic.duty_edge", edge, true);
  });
});
