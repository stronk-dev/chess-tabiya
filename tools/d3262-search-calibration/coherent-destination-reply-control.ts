// Disposable D3262 exact-reply continuation for named minor destinations.
// A retained pawn attack is a bounded board fact, not an engine reason or a plan.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { attacks } from "../../packages/runtime/node_modules/chessops/dist/esm/attacks.js";
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseSquare, parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import type { SquareName } from "../../packages/runtime/node_modules/chessops/dist/esm/types.js";
import { legalExchangeForMove } from "../../packages/runtime/src/exchange.js";

const directory = "planning/semantic-consequence-search";
const names = ["d3262-coherent-target-comparison-frame.json", "d3262-coherent-exact-replies.json"];
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function sha(bytes: Buffer | string): string { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function square(value: SquareName): number {
  const parsed = parseSquare(value);
  check(parsed !== undefined, `Invalid target square ${value}`);
  return parsed;
}
function position(fen: string): Chess { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }

type Destination = {
  readonly minor: { readonly color: "white" | "black"; readonly role: "bishop" | "knight"; readonly square: SquareName };
  readonly controllingPawn: { readonly color: "white" | "black"; readonly role: "pawn"; readonly square: SquareName };
  readonly square: SquareName;
};
type MinorReply = "gone_before_reply" | "arrived_named_square" | "moved_elsewhere" | "stayed";
type ReplyReading = {
  readonly minorReply: MinorReply;
  readonly controllerRetained: boolean;
  readonly namedPawnWinsArrival: boolean | null;
};

function pawnControls(pos: Chess, target: Destination): boolean {
  const pawnSquare = square(target.controllingPawn.square);
  const pawn = pos.board.get(pawnSquare);
  return pawn?.color === target.controllingPawn.color && pawn.role === "pawn"
    && attacks(pawn, pawnSquare, pos.board.occupied).has(square(target.square));
}

export function classifyDestinationReply(afterCandidateFen: string, replyUci: string, replyFen: string, target: Destination): ReplyReading {
  const afterCandidate = position(afterCandidateFen);
  const minorSquare = square(target.minor.square);
  const minor = afterCandidate.board.get(minorSquare);
  const minorPresent = minor?.color === target.minor.color && minor.role === target.minor.role;
  const parsed = parseUci(replyUci);
  check(parsed !== undefined, `Invalid reply ${replyUci}`);
  const move = normalizeMove(afterCandidate, parsed);
  check(afterCandidate.isLegal(move), `Illegal reply ${replyUci}`);
  const minorMoved = minorPresent && "from" in move && move.from === minorSquare;
  const arrived = minorMoved && move.to === square(target.square);
  afterCandidate.play(move);
  check(makeFen(afterCandidate.toSetup()) === replyFen, `Reply FEN does not replay ${replyUci}`);
  const controllerRetained = pawnControls(afterCandidate, target);
  if (!minorPresent) return { minorReply: "gone_before_reply", controllerRetained, namedPawnWinsArrival: null };
  if (arrived) {
    if (!controllerRetained) return { minorReply: "arrived_named_square", controllerRetained, namedPawnWinsArrival: false };
    const capture = { from: square(target.controllingPawn.square), to: square(target.square) };
    return { minorReply: "arrived_named_square", controllerRetained,
      namedPawnWinsArrival: afterCandidate.isLegal(capture) && (legalExchangeForMove(afterCandidate, capture)?.resultUnits ?? 0) > 0 };
  }
  return { minorReply: minorMoved ? "moved_elsewhere" : "stayed", controllerRetained, namedPawnWinsArrival: null };
}

export function compileCoherentDestinationReplyControl(comparisons: any, graph: any): any {
  check(comparisons.profile === "d3262-coherent-target-comparison-v1"
    && graph.profile === "d3262-coherent-root-v1" && comparisons.manifest === graph.manifest,
  "Crossed corrected target/reply population");
  check(comparisons.comparisons.length === 182, "Corrected comparison denominator changed");
  const definitions = new Map(comparisons.definitions.map((row: any) => [row.id, row]));
  const roots = new Map(graph.roots.map((row: any) => [row.rootId, row]));
  const rows = comparisons.comparisons.flatMap((pair: any) => {
    const definition: any = definitions.get(pair.targetId);
    check(definition?.rootId === pair.rootId, `Missing or crossed target ${pair.targetId}`);
    if (definition.family !== "destination") return [];
    const root: any = roots.get(pair.rootId);
    const candidate = root?.candidates.find((row: any) => row.candidateUci === pair.candidateUci);
    check(candidate !== undefined && candidate.replyCount === candidate.replies.length,
      `Missing or incomplete legal replies ${pair.rootId}/${pair.candidateUci}`);
    const replies = candidate.replies.map((reply: any) => ({
      uci: reply.uci,
      ...classifyDestinationReply(candidate.afterFen, reply.uci, reply.fen, definition.target),
    }));
    return [{ rootId: pair.rootId, targetId: pair.targetId, candidateUci: pair.candidateUci,
      sourceObserved: pair.sourceObserved, legalReplyCount: candidate.replyCount, replies }];
  });
  check(rows.length === 88 && rows.filter((row: any) => row.sourceObserved).length === 32,
    "Corrected destination/source denominators changed");
  return { version: 1, profile: "d3262-coherent-destination-reply-control-v1",
    authority: "all_legal_immediate_replies_named_destination_only_not_long_horizon_or_engine_reason",
    manifest: comparisons.manifest, rows };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const inputs = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = {
    ...compileCoherentDestinationReplyControl(...inputs.map((bytes) => JSON.parse(bytes.toString())) as [any, any]),
    inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(inputs[index])])),
  };
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-destination-reply-control.json`;
  if (process.argv.includes("--write")) writeFileSync(target, bytes, { flag: "wx" });
  else check(readFileSync(target, "utf8") === bytes, "Destination reply-control output differs from sealed inputs");
  const summarize = (sourceObserved: boolean) => {
    const rows = artifact.rows.filter((row: any) => row.sourceObserved === sourceObserved);
    const replies = rows.flatMap((row: any) => row.replies);
    return { comparisons: rows.length, replies: replies.length,
      controllerRetained: replies.filter((reply: any) => reply.controllerRetained).length,
      minorArrivals: replies.filter((reply: any) => reply.minorReply === "arrived_named_square").length,
      namedPawnWinsArrival: replies.filter((reply: any) => reply.namedPawnWinsArrival === true).length,
      controllerRetainedForEveryReply: rows.filter((row: any) => row.replies.every((reply: any) => reply.controllerRetained)).length,
    };
  };
  process.stdout.write(`${JSON.stringify({ digest: sha(bytes), source: summarize(true), alternative: summarize(false) }, null, 2)}\n`);
}
