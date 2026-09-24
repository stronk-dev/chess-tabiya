// Test-only fixtures for rfc/review-map.md: a long, deterministic legal game with recorded
// evaluations shaped so that some plies cross a report threshold and most do not.

import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { parsePgn } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { attachEvidence } from "../evidence.js";
import { commitMove, createRun } from "../runtime.js";
import type { DrillRun } from "../types.js";

export const REVIEW_FIXTURE_AT = "2026-09-24T12:00:00.000Z";
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const DIGEST = `sha256:${"e".repeat(64)}`;
const CONFIG = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };

const SAMPLE = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../tools/r2-selection-harness/imported-sample.pgn");

/** The UCI mainline of the first recorded sample game with at least `plies` plies, truncated to `plies`. */
export function deterministicLine(plies: number): readonly string[] {
  for (const game of parsePgn(readFileSync(SAMPLE, "utf8"))) {
    const position = Chess.fromSetup(parseFen(START).unwrap()).unwrap();
    const line: string[] = [];
    for (const node of game.moves.mainline()) {
      const move = parseSan(position, node.san);
      if (move === undefined) break;
      line.push(makeUci(move));
      position.play(move);
    }
    if (line.length >= plies + 1) return Object.freeze(line.slice(0, plies));
  }
  throw new Error(`No sample game has ${plies} plies`);
}

/** White-perspective centipawn reading per node index: a smooth walk with a few sharp drops. */
export function fixtureCentipawns(index: number): number {
  return Math.round(260 * Math.sin(index * 0.9) + (index % 7 === 3 ? -420 : 0));
}

export interface ReviewFixtureOptions {
  readonly id?: string;
  readonly kind?: "imported" | "position";
  readonly plies?: number;
  /** Node indexes (0 = root) that receive a recorded evaluation; default every node. */
  readonly evaluated?: (index: number) => boolean;
  readonly extraValues?: Readonly<Record<string, unknown>>;
  /** The side the run follows (the importer's colour); default White. */
  readonly side?: "white" | "black";
}

export function reviewFixtureRun(options: ReviewFixtureOptions = {}): DrillRun {
  const kind = options.kind ?? "imported";
  const session = kind === "imported"
    ? { kind: "imported" as const, start: { fen: START, side: options.side ?? "white" }, movetextDigest: DIGEST, feedbackPolicy: "attempt_end" as const, opponentPolicy: { mode: "human_common" as const } }
    : { kind: "position" as const, start: { fen: START, side: options.side ?? "white" }, feedbackPolicy: "attempt_end" as const, opponentPolicy: { mode: "human_common" as const } };
  let run = createRun({ id: options.id ?? `review-${kind}`, session, sessionDigest: DIGEST, policyConfig: CONFIG, seed: 1, createdAt: REVIEW_FIXTURE_AT });
  for (const uci of deterministicLine(options.plies ?? 70)) {
    const node = run.nodes.find((candidate) => candidate.id === run.activeCursor.nodeId)!;
    run = commitMove(run, uci, { actor: node.fen.split(" ")[1] === "w" ? "user" : "system", at: REVIEW_FIXTURE_AT }).run;
  }
  const path = [...run.nodes].sort((left, right) => left.ply - right.ply);
  path.forEach((node, index) => {
    if (options.evaluated !== undefined && !options.evaluated(index)) return;
    run = attachEvidence(run, node.id, [`engine:${index}`], {
      kind: "eval", source: "engine_validated",
      values: { centipawns: fixtureCentipawns(index), perspective: "white", engineId: "stockfish-test", requestedMovetimeMs: 100, ...options.extraValues },
    }, REVIEW_FIXTURE_AT).run;
  });
  return run;
}
