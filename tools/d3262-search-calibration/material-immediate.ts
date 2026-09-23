// Disposable D3262 material-target measurement. This is one exact immediate
// relation, not a move grade, a forced line, or the five-arm search result.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { castlingSide, Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { kingCastlesTo, makeSquare, parseSquare, parseUci, rookCastlesTo } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import type { Color, Move, Role, SquareName } from "../../packages/runtime/node_modules/chessops/dist/esm/types.js";
import { exchangeCaptureAt, legalExchangeForMove } from "../../packages/runtime/src/exchange.js";

type Piece = { readonly color: Color; readonly role: Role; readonly square: SquareName };
type Target = { readonly attacker: Piece; readonly target: Piece; readonly baselineMoveUci: string };
type Cause = "preserved" | "attacker_captured" | "target_moved" | "capture_illegal" | "exchange_neutralized" | "identity_lost";

const path = (name: string) => `planning/semantic-consequence-search/${name}`;
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function position(fen: string): Chess { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function square(name: SquareName): number { const result = parseSquare(name); check(result !== undefined, `Invalid square ${name}`); return result; }
function samePiece(pos: Chess, identity: Piece): boolean {
  const piece = pos.board.get(square(identity.square));
  return piece?.color === identity.color && piece.role === identity.role;
}
function advance(pos: Chess, move: Move, identity: Piece): Piece | undefined {
  const tracked = square(identity.square);
  if (exchangeCaptureAt(pos, move)?.square === tracked) return undefined;
  const side = castlingSide(pos, move);
  if (side !== undefined && "from" in move) {
    const rookFrom = pos.castles.rook[pos.turn][side];
    if (move.from === tracked) return { ...identity, square: makeSquare(kingCastlesTo(pos.turn, side)) };
    if (rookFrom === tracked) return { ...identity, square: makeSquare(rookCastlesTo(pos.turn, side)) };
  }
  if ("from" in move && move.from === tracked) return { ...identity, role: move.promotion ?? identity.role, square: makeSquare(move.to) };
  return identity;
}
function positiveCapture(pos: Chess, attacker: Piece, victim: Piece): string | null {
  if (pos.turn !== attacker.color || !samePiece(pos, attacker) || !samePiece(pos, victim)) return null;
  const move: Move = { from: square(attacker.square), to: square(victim.square) };
  if (!pos.isLegal(move) || (legalExchangeForMove(pos, move)?.resultUnits ?? 0) <= 0) return null;
  return `${attacker.square}${victim.square}`;
}

export function evaluateMaterialImmediate(fen: string, candidateUci: string, target: Target): { immediate: "preserved" | "removed" | "identity_lost"; cause: Cause; positiveCaptureUci: string | null; afterFen: string } {
  const root = position(fen);
  check(samePiece(root, target.attacker) && samePiece(root, target.target), `Declared material identities absent at root ${fen}`);
  const parsed = parseUci(candidateUci);
  check(parsed !== undefined, `Invalid candidate ${candidateUci}`);
  const move = normalizeMove(root, parsed);
  check(root.isLegal(move), `Illegal candidate ${candidateUci}`);
  const attackerCaptured = exchangeCaptureAt(root, move)?.square === square(target.attacker.square);
  const attacker = advance(root, move, target.attacker);
  const victim = advance(root, move, target.target);
  root.play(move);
  const afterFen = makeFen(root.toSetup());
  if (attackerCaptured) return { immediate: "removed", cause: "attacker_captured", positiveCaptureUci: null, afterFen };
  if (attacker === undefined || victim === undefined || !samePiece(root, attacker) || !samePiece(root, victim)) return { immediate: "identity_lost", cause: "identity_lost", positiveCaptureUci: null, afterFen };
  const capture = positiveCapture(root, attacker, victim);
  if (capture !== null) return { immediate: "preserved", cause: "preserved", positiveCaptureUci: capture, afterFen };
  if (victim.square !== target.target.square) return { immediate: "removed", cause: "target_moved", positiveCaptureUci: null, afterFen };
  const attempt: Move = { from: square(attacker.square), to: square(victim.square) };
  return { immediate: "removed", cause: root.isLegal(attempt) ? "exchange_neutralized" : "capture_illegal", positiveCaptureUci: null, afterFen };
}

export function compileMaterialImmediate(comparisons: any, frame: any, source: any, replyGraph: any, options: {
  rootAuthority?: string;
  replyAuthority?: string;
} = {}): any {
  check(comparisons.authority === "target_candidate_comparison_population_not_outcome_or_move_grade", "Wrong comparison authority");
  check(frame.authority === (options.rootAuthority ?? "shared_candidate_population_not_move_grade") && frame.manifest === comparisons.manifest, "Crossed root frame");
  check(replyGraph.authority === (options.replyAuthority ?? "complete_legal_opponent_reply_edges_not_a_semantic_proof") && replyGraph.manifest === frame.manifest, "Crossed exact reply graph");
  const byTarget = new Map(comparisons.definitions.map((definition: any) => [definition.id, definition]));
  const byRoot = new Map(frame.roots.map((root: any) => [root.rootId, root]));
  const repliesByRoot = new Map(replyGraph.roots.map((root: any) => [root.rootId, root]));
  const sourceRows = source.populations.flatMap((population: any) => population.rows.map((row: any) => ({ ...row, population: population.population })));
  let sourceControls = 0;
  const rows = comparisons.comparisons.flatMap((pair: any) => {
    const definition: any = byTarget.get(pair.targetId);
    check(definition !== undefined, `Missing target ${pair.targetId}`);
    if (definition.family !== "material") return [];
    const root: any = byRoot.get(pair.rootId);
    check(root !== undefined && root.candidates.some((candidate: any) => candidate.moveUci === pair.candidateUci), `Crossed candidate ${pair.rootId}/${pair.candidateUci}`);
    const result = evaluateMaterialImmediate(root.fen, pair.candidateUci, definition.target);
    const exactCandidate = (repliesByRoot.get(pair.rootId) as any)?.candidates.find((candidate: any) => candidate.candidateUci === pair.candidateUci);
    check(exactCandidate?.afterFen === result.afterFen, `Exact reply graph disagrees on candidate FEN ${pair.rootId}/${pair.candidateUci}`);
    if (pair.sourceObserved) {
      const matches = sourceRows.filter((sourceRow: any) => sourceRow.parentFen === root.fen && sourceRow.candidateUci === pair.candidateUci && sourceRow.targetFamily === "material" && JSON.stringify(sourceRow.target) === JSON.stringify(definition.target));
      check(matches.length === 1 && matches[0].exact.immediate === result.immediate, `D1023 source control disagrees at ${pair.rootId}/${pair.candidateUci}/${pair.targetId}`);
      sourceControls += 1;
    }
    return [{ rootId: pair.rootId, targetId: pair.targetId, candidateUci: pair.candidateUci, sourceObserved: pair.sourceObserved, ...result }];
  });
  return { version: 1, manifest: comparisons.manifest, authority: "exact_immediate_material_relation_not_move_grade_or_search_result", sourceControls, rows };
}

if (process.argv[1]?.endsWith("material-immediate.mjs")) {
  const comparisonBytes = readFileSync(path("d3262-target-comparison-frame.json"));
  const rootBytes = readFileSync(path("d3262-root-frame.json"));
  const sourceBytes = readFileSync("tools/d1023-bounded-policy-harness/provider-sample.json");
  const replyBytes = readFileSync(path("d3262-exact-replies.json"));
  const artifact = {
    ...compileMaterialImmediate(JSON.parse(comparisonBytes.toString()), JSON.parse(rootBytes.toString()), JSON.parse(sourceBytes.toString()), JSON.parse(replyBytes.toString())),
    inputDigests: {
      comparison: `sha256:${createHash("sha256").update(comparisonBytes).digest("hex")}`,
      roots: `sha256:${createHash("sha256").update(rootBytes).digest("hex")}`,
      source: `sha256:${createHash("sha256").update(sourceBytes).digest("hex")}`,
      exactReplies: `sha256:${createHash("sha256").update(replyBytes).digest("hex")}`,
    },
  };
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  const output = path("d3262-material-immediate.json");
  if (process.argv.includes("--write")) writeFileSync(output, bytes, { flag: "wx" });
  else check(readFileSync(output, "utf8") === bytes, "D3262 material immediate reading differs from frozen inputs");
  const causes = Object.fromEntries([...new Set(artifact.rows.map((row: any) => row.cause))].sort().map((cause) => [cause, artifact.rows.filter((row: any) => row.cause === cause).length]));
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, comparisons: artifact.rows.length, sourceControls: artifact.sourceControls, causes }, null, 2)}\n`);
}
