// Disposable D3262 exact first-reply event selector. The named target declaration
// determines an observable event; no source witness, evaluation or engine rank
// enters this compile step. An event is not proof that the candidate was good.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { makeFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseSquare } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import type { SquareName } from "../../packages/runtime/node_modules/chessops/dist/esm/types.js";
import { exchangeCaptureAt } from "../../packages/runtime/src/exchange.js";
import { played, position, trackedAfter, type Piece } from "./semantic-touch-first-layer.js";

type MaterialTarget = { readonly attacker: Piece; readonly target: Piece };
type DestinationTarget = { readonly minor: Piece; readonly controllingPawn: Piece; readonly square: SquareName };
type Definition = { readonly id: string; readonly rootId: string; readonly family: "material" | "destination"; readonly target: MaterialTarget | DestinationTarget; readonly sources: readonly { readonly candidateUci: string }[] };
type Pair = { readonly rootId: string; readonly targetId: string; readonly candidateUci: string };

const path = (name: string) => `planning/semantic-consequence-search/${name}`;
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function square(name: SquareName): number { const result = parseSquare(name); check(result !== undefined, `Invalid relation square ${name}`); return result; }
function samePieceAt(pos: ReturnType<typeof position>, piece: Piece): boolean {
  const found = pos.board.get(square(piece.square));
  return found?.color === piece.color && found.role === piece.role;
}
function destinationRootPawn(pos: ReturnType<typeof position>, definition: Definition, target: DestinationTarget): Piece {
  if (samePieceAt(pos, target.controllingPawn)) return target.controllingPawn;
  const origins = [...new Set(definition.sources.filter((source) => source.candidateUci.slice(2, 4) === target.controllingPawn.square).map((source) => source.candidateUci.slice(0, 2)))];
  check(origins.length === 1, `Ambiguous declared relation pawn ${definition.id}`);
  const rootPawn = { ...target.controllingPawn, square: origins[0] as SquareName };
  check(samePieceAt(pos, rootPawn), `Declared relation pawn absent at root ${definition.id}`);
  return rootPawn;
}

export function compileSemanticRelationEventFirstLayer(comparisons: any, graph: any): any {
  check(comparisons.authority === "target_candidate_comparison_population_not_outcome_or_move_grade", "Wrong relation-event comparison frame");
  check(graph.authority === "complete_legal_opponent_reply_edges_not_a_semantic_proof" && graph.manifest === comparisons.manifest, "Crossed relation-event legal graph");
  const definitions = new Map<string, Definition>(comparisons.definitions.map((value: Definition) => [value.id, value]));
  const roots = new Map<string, any>(graph.roots.map((value: any) => [value.rootId, value]));
  const rows = comparisons.comparisons.map((pair: Pair) => {
    const definition = definitions.get(pair.targetId), root = roots.get(pair.rootId);
    check(definition !== undefined && definition.rootId === pair.rootId && root !== undefined, `Missing relation target/root ${pair.rootId}/${pair.targetId}`);
    const candidate = root.candidates.find((value: any) => value.candidateUci === pair.candidateUci);
    check(candidate !== undefined, `Missing relation candidate ${pair.rootId}/${pair.candidateUci}`);
    const rootPos = position(root.fen), candidateMove = played(rootPos, pair.candidateUci);
    const target = definition.target;
    const operands = definition.family === "material"
      ? [(target as MaterialTarget).attacker, (target as MaterialTarget).target]
      : [(target as DestinationTarget).minor, destinationRootPawn(rootPos, definition, target as DestinationTarget)];
    const childOperands = operands.map((operand) => trackedAfter(rootPos, candidateMove, operand));
    rootPos.play(candidateMove);
    check(makeFen(rootPos.toSetup()) === candidate.afterFen, `Crossed relation candidate FEN ${pair.rootId}/${pair.candidateUci}`);
    if (childOperands.some((operand) => operand === null)) return { ...pair, family: definition.family, status: "operand_absent", legalReplies: candidate.replies.length, eventReplies: [] };
    const [actor, other] = childOperands as Piece[];
    check(samePieceAt(rootPos, actor) && samePieceAt(rootPos, other), `Relation child operand identity crossed ${pair.rootId}/${pair.candidateUci}`);
    const eventReplies = candidate.replies.flatMap((reply: any) => {
      const before = rootPos.clone(), move = played(before, reply.uci), after = before.clone();
      after.play(move);
      check(makeFen(after.toSetup()) === reply.fen, `Crossed relation reply FEN ${pair.rootId}/${pair.candidateUci}/${reply.uci}`);
      const isEvent = definition.family === "material"
        ? "from" in move && move.from === square(actor.square) && exchangeCaptureAt(before, move)?.square === square(other.square)
        : "from" in move && move.from === square(actor.square) && move.to === square((target as DestinationTarget).square);
      return isEvent ? [{ uci: reply.uci, kind: definition.family === "material" ? "named_attacker_captures_target" : "named_minor_arrives_on_square" }] : [];
    });
    return { ...pair, family: definition.family, status: eventReplies.length > 0 ? "event_available" : "no_legal_event", legalReplies: candidate.replies.length, eventReplies };
  });
  check(rows.length === 185, "Relation-event census lost named comparisons");
  return { version: 1, manifest: comparisons.manifest, authority: "source_blind_typed_relation_event_scheduling_not_profit_or_proof", rows };
}

if (process.argv[1]?.endsWith("semantic-relation-event-first-layer.mjs")) {
  const names = ["d3262-target-comparison-frame.json", "d3262-exact-replies.json"];
  const bytes = names.map((name) => readFileSync(path(name)));
  const artifact = { ...compileSemanticRelationEventFirstLayer(JSON.parse(bytes[0].toString()), JSON.parse(bytes[1].toString())), inputDigests: Object.fromEntries(names.map((name, index) => [name, `sha256:${createHash("sha256").update(bytes[index]).digest("hex")}`])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = path("d3262-semantic-relation-event-first-layer.json");
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 relation-event census differs from frozen source");
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(output).digest("hex")}`, statuses: Object.fromEntries(["event_available", "no_legal_event", "operand_absent"].map((status) => [status, artifact.rows.filter((row: any) => row.status === status).length])), events: artifact.rows.reduce((sum: number, row: any) => sum + row.eventReplies.length, 0) }, null, 2)}\n`);
}
