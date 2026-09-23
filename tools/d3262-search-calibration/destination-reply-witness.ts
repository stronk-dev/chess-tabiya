// Disposable D3262 bounded destination witness. One named opponent arrival
// and, where declared, one exact pawn reply; never an all-defences proof.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { makeUci, parseSquare, parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import type { Color, Role, Square, SquareName } from "../../packages/runtime/node_modules/chessops/dist/esm/types.js";
import { legalCaptureMovesTo, legalExchangeForMove } from "../../packages/runtime/src/exchange.js";

type Piece = { readonly color: Color; readonly role: Role; readonly square: SquareName };
type Target = { readonly minor: Piece; readonly controllingPawn: Piece; readonly square: SquareName };
const path = (name: string) => `planning/semantic-consequence-search/${name}`;
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function square(name: SquareName): Square { const value = parseSquare(name); check(value !== undefined, `Invalid square ${name}`); return value; }
function position(fen: string): Chess { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function samePiece(pos: Chess, value: Piece): boolean {
  const piece = pos.board.get(square(value.square));
  return piece?.color === value.color && piece.role === value.role;
}

export function evaluateRecordedArrival(rootFen: string, candidateUci: string, candidate: any, target: Target, immediate: any) {
  check(candidate.candidateUci === candidateUci && candidate.afterFen === immediate.afterFen, `Crossed candidate reading ${candidateUci}`);
  const arrivalUci = `${target.minor.square}${target.square}`;
  const arrival = candidate.replies.find((reply: any) => reply.uci === arrivalUci);
  const afterCandidate = position(candidate.afterFen);
  if (immediate.cause === "minor_captured") {
    check(!samePiece(afterCandidate, target.minor) && arrival === undefined, `Captured minor was given a destination witness ${candidateUci}`);
    return { candidateUci, legalReplyCount: candidate.replyCount, status: "named_minor_absent", arrivalUci: null, namedPawnCaptureUci: null, positiveCaptureUcis: [], witnessPath: null };
  }
  check(immediate.cause === "available" || immediate.cause === "minor_move_losing", `Unrepresented destination cause ${immediate.cause}`);
  check(samePiece(afterCandidate, target.minor), `Named minor identity lost before reply ${candidateUci}`);
  check(arrival !== undefined, `Named arrival absent from complete legal replies ${candidateUci}/${arrivalUci}`);
  const move = parseUci(arrivalUci);
  check(move !== undefined && afterCandidate.isLegal(move), `Named arrival is not legal ${candidateUci}/${arrivalUci}`);
  afterCandidate.play(move);
  check(makeFen(afterCandidate.toSetup()) === arrival.fen && samePiece(afterCandidate, { ...target.minor, square: target.square }), `Named arrival FEN or minor identity crossed ${candidateUci}/${arrivalUci}`);
  const positiveCaptureUcis = legalCaptureMovesTo(afterCandidate, square(target.square))
    .filter((capture) => (legalExchangeForMove(afterCandidate, capture)?.resultUnits ?? 0) > 0)
    .map(makeUci);
  if (immediate.cause === "available") {
    check(positiveCaptureUcis.length === 0 && immediate.positiveReplyUci === null, `Locally safe arrival has a positive capture ${candidateUci}/${arrivalUci}`);
    return { candidateUci, legalReplyCount: candidate.replyCount, status: "locally_safe_arrival_witness", arrivalUci, namedPawnCaptureUci: null, positiveCaptureUcis, witnessPath: [candidateUci, arrivalUci] };
  }
  check(positiveCaptureUcis.length > 0 && positiveCaptureUcis.includes(immediate.positiveReplyUci), `Losing arrival has no retained positive capture ${candidateUci}/${arrivalUci}`);
  const beforeCandidate = position(rootFen), parsedCandidate = parseUci(candidateUci);
  check(parsedCandidate !== undefined, `Invalid source candidate ${candidateUci}`);
  const candidateMove = normalizeMove(beforeCandidate, parsedCandidate);
  check("from" in candidateMove && beforeCandidate.isLegal(candidateMove), `Illegal source candidate ${candidateUci}`);
  const candidateMover = beforeCandidate.board.get(candidateMove.from);
  check(candidateMover?.color === target.controllingPawn.color && candidateMover.role === "pawn" && candidateMove.to === square(target.controllingPawn.square), `Source candidate did not move the declared pawn ${candidateUci}`);
  check(immediate.sourceObserved === true && samePiece(afterCandidate, target.controllingPawn), `Declared source pawn absent from losing arrival ${candidateUci}/${arrivalUci}`);
  const namedPawnCaptureUci = `${target.controllingPawn.square}${target.square}`;
  check(positiveCaptureUcis.includes(namedPawnCaptureUci), `Declared pawn capture is not positive ${candidateUci}/${arrivalUci}/${namedPawnCaptureUci}`);
  return { candidateUci, legalReplyCount: candidate.replyCount, status: "named_pawn_punishment_witness", arrivalUci, namedPawnCaptureUci, positiveCaptureUcis, witnessPath: [candidateUci, arrivalUci, namedPawnCaptureUci] };
}

export function compileDestinationReplyWitness(comparisons: any, immediate: any, replyGraph: any, options: {
  replyAuthority?: string;
  expectedComparisons?: number;
} = {}): any {
  check(comparisons.authority === "target_candidate_comparison_population_not_outcome_or_move_grade", "Wrong comparison authority");
  check(immediate.authority === "exact_immediate_minor_destination_availability_not_move_grade" && immediate.manifest === comparisons.manifest, "Crossed immediate reading");
  check(replyGraph.authority === (options.replyAuthority ?? "complete_legal_opponent_reply_edges_not_a_semantic_proof") && replyGraph.manifest === comparisons.manifest, "Crossed exact reply graph");
  const targetById = new Map(comparisons.definitions.map((definition: any) => [definition.id, definition]));
  const repliesByRoot = new Map(replyGraph.roots.map((root: any) => [root.rootId, root]));
  const rows = immediate.rows.map((reading: any) => {
    const definition: any = targetById.get(reading.targetId);
    check(definition?.family === "destination" && definition.rootId === reading.rootId, `Crossed destination target ${reading.targetId}`);
    const candidate = (repliesByRoot.get(reading.rootId) as any)?.candidates.find((item: any) => item.candidateUci === reading.candidateUci);
    check(candidate !== undefined, `Missing exact candidate ${reading.rootId}/${reading.candidateUci}`);
    return { rootId: reading.rootId, targetId: reading.targetId, sourceObserved: reading.sourceObserved, genericFirstPositiveCaptureUci: reading.positiveReplyUci, ...evaluateRecordedArrival((repliesByRoot.get(reading.rootId) as any).fen, reading.candidateUci, candidate, definition.target, reading) };
  });
  check(rows.length === (options.expectedComparisons ?? 87), `Unexpected destination comparison count ${rows.length}`);
  return { version: 1, manifest: comparisons.manifest, authority: "named_exact_reply_witness_not_all_defences_or_move_grade", rows };
}

if (process.argv[1]?.endsWith("destination-reply-witness.mjs")) {
  const comparisonBytes = readFileSync(path("d3262-target-comparison-frame.json"));
  const immediateBytes = readFileSync(path("d3262-destination-immediate.json"));
  const replyBytes = readFileSync(path("d3262-exact-replies.json"));
  const artifact = {
    ...compileDestinationReplyWitness(JSON.parse(comparisonBytes.toString()), JSON.parse(immediateBytes.toString()), JSON.parse(replyBytes.toString())),
    inputDigests: {
      comparison: `sha256:${createHash("sha256").update(comparisonBytes).digest("hex")}`,
      immediate: `sha256:${createHash("sha256").update(immediateBytes).digest("hex")}`,
      exactReplies: `sha256:${createHash("sha256").update(replyBytes).digest("hex")}`,
    },
  };
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  const output = path("d3262-destination-reply-witness.json");
  if (process.argv.includes("--write")) writeFileSync(output, bytes, { flag: "wx" });
  else check(readFileSync(output, "utf8") === bytes, "D3262 destination witness differs from frozen inputs");
  const counts = Object.fromEntries([...new Set(artifact.rows.map((row: any) => row.status))].sort().map((status) => [status, artifact.rows.filter((row: any) => row.status === status).length]));
  const firstNotNamed = artifact.rows.filter((row: any) => row.namedPawnCaptureUci !== null && row.genericFirstPositiveCaptureUci !== row.namedPawnCaptureUci);
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, comparisons: artifact.rows.length, counts, genericFirstNotNamed: firstNotNamed.map((row: any) => ({ rootId: row.rootId, candidateUci: row.candidateUci, first: row.genericFirstPositiveCaptureUci, named: row.namedPawnCaptureUci })) }, null, 2)}\n`);
}
