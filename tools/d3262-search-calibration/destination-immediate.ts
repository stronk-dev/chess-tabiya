// Disposable D3262 minor-destination measurement. A square being unsafe is
// not, by itself, a claim that the named pawn caused it or that a move is good.
import { attacks } from "../../packages/runtime/node_modules/chessops/dist/esm/attacks.js";
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { makeUci, parseSquare, parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import type { Color, Move, Role, Square, SquareName } from "../../packages/runtime/node_modules/chessops/dist/esm/types.js";
import { legalCaptureMovesTo, legalExchangeForMove } from "../../packages/runtime/src/exchange.js";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

type Piece = { readonly color: Color; readonly role: Role; readonly square: SquareName };
type Destination = { readonly minor: Piece; readonly controllingPawn: Piece; readonly square: SquareName };
type Cause = "available" | "minor_captured" | "destination_occupied" | "minor_move_illegal" | "minor_move_losing";
const path = (name: string) => `planning/semantic-consequence-search/${name}`;
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function position(fen: string): Chess { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function square(name: SquareName): Square { const value = parseSquare(name); check(value !== undefined, `Invalid square ${name}`); return value; }
function samePiece(pos: Chess, piece: Piece): boolean {
  const found = pos.board.get(square(piece.square));
  return found?.color === piece.color && found.role === piece.role;
}
function result(afterFen: string, cause: Cause, positiveReplyUci: string | null) {
  return { afterFen, immediate: cause === "available" ? "preserved" as const : "removed" as const, cause, positiveReplyUci };
}

export function evaluateDestinationImmediate(fen: string, candidateUci: string, target: Destination) {
  const root = position(fen);
  check(samePiece(root, target.minor), `Declared minor absent at root ${fen}`);
  const parsed = parseUci(candidateUci);
  check(parsed !== undefined, `Invalid candidate ${candidateUci}`);
  const move = normalizeMove(root, parsed);
  check(root.isLegal(move), `Illegal candidate ${candidateUci}`);
  root.play(move);
  const afterFen = makeFen(root.toSetup());
  if (!samePiece(root, target.minor)) return result(afterFen, "minor_captured", null);
  if (root.board.get(square(target.square)) !== undefined) return result(afterFen, "destination_occupied", null);
  check(root.turn === target.minor.color, `Minor is not next to move at ${fen}/${candidateUci}`);
  const arrival: Move = { from: square(target.minor.square), to: square(target.square) };
  if (!root.isLegal(arrival)) return result(afterFen, "minor_move_illegal", null);
  const next = root.clone();
  next.play(arrival);
  const positive = legalCaptureMovesTo(next, square(target.square)).find((capture) => (legalExchangeForMove(next, capture)?.resultUnits ?? 0) > 0);
  return positive === undefined ? result(afterFen, "available", null) : result(afterFen, "minor_move_losing", makeUci(positive));
}

export function verifySourcePawn(fen: string, candidateUci: string, target: Destination): void {
  const root = position(fen);
  const parsed = parseUci(candidateUci);
  check(parsed !== undefined, `Invalid source pawn move ${candidateUci}`);
  const move = normalizeMove(root, parsed);
  check("from" in move && root.isLegal(move), `Illegal source pawn move ${candidateUci}`);
  const mover = root.board.get(move.from);
  check(mover?.color === target.controllingPawn.color && mover.role === "pawn" && move.to === square(target.controllingPawn.square), `Source candidate is not the declared controlling pawn ${candidateUci}`);
  root.play(move);
  check(samePiece(root, target.controllingPawn), `Declared controlling pawn absent after ${candidateUci}`);
  const pawnSquare = square(target.controllingPawn.square), destination = square(target.square);
  check(attacks(root.board.get(pawnSquare)!, pawnSquare, root.board.occupied).has(destination), `Declared pawn does not attack ${target.square}`);
  const arrival: Move = { from: square(target.minor.square), to: destination };
  check(root.isLegal(arrival), `Declared minor cannot legally reach ${target.square}`);
  root.play(arrival);
  const capture: Move = { from: pawnSquare, to: destination };
  check(root.isLegal(capture) && (legalExchangeForMove(root, capture)?.resultUnits ?? 0) > 0, `Declared pawn does not positively capture after minor arrival`);
}

export function compileDestinationImmediate(comparisons: any, frame: any, source: any, replyGraph: any): any {
  check(comparisons.authority === "target_candidate_comparison_population_not_outcome_or_move_grade", "Wrong comparison authority");
  check(frame.authority === "shared_candidate_population_not_move_grade" && frame.manifest === comparisons.manifest, "Crossed root frame");
  check(replyGraph.authority === "complete_legal_opponent_reply_edges_not_a_semantic_proof" && replyGraph.manifest === frame.manifest, "Crossed exact reply graph");
  const byTarget = new Map(comparisons.definitions.map((definition: any) => [definition.id, definition]));
  const byRoot = new Map(frame.roots.map((root: any) => [root.rootId, root]));
  const repliesByRoot = new Map(replyGraph.roots.map((root: any) => [root.rootId, root]));
  const sourceRows = source.populations.flatMap((population: any) => population.rows.map((row: any) => ({ ...row, population: population.population })));
  let sourceControls = 0, sourcePawnControls = 0;
  const rows = comparisons.comparisons.flatMap((pair: any) => {
    const definition: any = byTarget.get(pair.targetId);
    check(definition !== undefined, `Missing target ${pair.targetId}`);
    if (definition.family !== "destination") return [];
    const root: any = byRoot.get(pair.rootId);
    check(root !== undefined && root.candidates.some((candidate: any) => candidate.moveUci === pair.candidateUci), `Crossed candidate ${pair.rootId}/${pair.candidateUci}`);
    const reading = evaluateDestinationImmediate(root.fen, pair.candidateUci, definition.target);
    const exactCandidate = (repliesByRoot.get(pair.rootId) as any)?.candidates.find((candidate: any) => candidate.candidateUci === pair.candidateUci);
    check(exactCandidate?.afterFen === reading.afterFen, `Exact reply graph disagrees on candidate FEN ${pair.rootId}/${pair.candidateUci}`);
    if (pair.sourceObserved) {
      const matches = sourceRows.filter((row: any) => row.parentFen === root.fen && row.candidateUci === pair.candidateUci && row.targetFamily === "destination" && JSON.stringify(row.target) === JSON.stringify(definition.target));
      check(matches.length === 1 && matches[0].exact.immediate === reading.immediate, `D1023 destination source control disagrees at ${pair.rootId}/${pair.candidateUci}`);
      sourceControls += 1;
      verifySourcePawn(root.fen, pair.candidateUci, definition.target);
      sourcePawnControls += 1;
    }
    return [{ rootId: pair.rootId, targetId: pair.targetId, candidateUci: pair.candidateUci, sourceObserved: pair.sourceObserved, ...reading }];
  });
  return { version: 1, manifest: comparisons.manifest, authority: "exact_immediate_minor_destination_availability_not_move_grade", sourceControls, sourcePawnControls, rows };
}

if (process.argv[1]?.endsWith("destination-immediate.mjs")) {
  const comparisonBytes = readFileSync(path("d3262-target-comparison-frame.json"));
  const rootBytes = readFileSync(path("d3262-root-frame.json"));
  const sourceBytes = readFileSync("tools/d1023-bounded-policy-harness/provider-sample.json");
  const replyBytes = readFileSync(path("d3262-exact-replies.json"));
  const artifact = {
    ...compileDestinationImmediate(JSON.parse(comparisonBytes.toString()), JSON.parse(rootBytes.toString()), JSON.parse(sourceBytes.toString()), JSON.parse(replyBytes.toString())),
    inputDigests: {
      comparison: `sha256:${createHash("sha256").update(comparisonBytes).digest("hex")}`,
      roots: `sha256:${createHash("sha256").update(rootBytes).digest("hex")}`,
      source: `sha256:${createHash("sha256").update(sourceBytes).digest("hex")}`,
      exactReplies: `sha256:${createHash("sha256").update(replyBytes).digest("hex")}`,
    },
  };
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  const output = path("d3262-destination-immediate.json");
  if (process.argv.includes("--write")) writeFileSync(output, bytes, { flag: "wx" });
  else check(readFileSync(output, "utf8") === bytes, "D3262 destination immediate reading differs from frozen inputs");
  const causes = Object.fromEntries([...new Set(artifact.rows.map((row: any) => row.cause))].sort().map((cause) => [cause, artifact.rows.filter((row: any) => row.cause === cause).length]));
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, comparisons: artifact.rows.length, sourceControls: artifact.sourceControls, sourcePawnControls: artifact.sourcePawnControls, causes }, null, 2)}\n`);
}
