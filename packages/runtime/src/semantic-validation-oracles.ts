/**
 * The import-isolated rules-oracle registry (rfc/semantic-validation-authority.md §4.1, R3).
 *
 * Each oracle receives only its sealed witness request and returns one neutral typed fact. It never
 * receives a case expectation or target subject, and its complete static import graph is chessops
 * plus this file and `semantic-validation.ts` type definitions: no semantic event operation, predicate
 * helper, case registry or evidence constructor. `semantic-validation.test.ts` enforces that closure.
 */
import { attacks } from "chessops/attacks";
import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { SquareSet } from "chessops/squareSet";
import type { Role, Square } from "chessops/types";
import { makeSquare, makeUci, parseSquare, parseUci } from "chessops/util";

import { evidenceDigest } from "./evidence-contract.js";
import { SemanticValidationError, type SemanticCompleteAlternativesInput, type SemanticEdgeInput, type SemanticValidationOracleId, type SemanticValidationOracleRef, type SemanticValidationSubject } from "./semantic-validation.js";

export type SemanticValidationOracleRequestMap = {
  readonly "rules.legal_successor": SemanticEdgeInput;
  readonly "rules.attack_map": { readonly kind: "attack_map"; readonly fen: string; readonly square: string; readonly by: "white" | "black" };
  readonly "rules.material_ledger": { readonly kind: "material_ledger"; readonly fen: string };
  readonly "rules.line_occupancy": { readonly kind: "line_occupancy"; readonly fen: string; readonly from: string; readonly to: string };
  readonly "rules.complete_legal_set": SemanticCompleteAlternativesInput;
  readonly "rules.tablebase_result": { readonly kind: "tablebase_result"; readonly fen: string; readonly tablebaseReceipt: { readonly id: string; readonly version: number } };
};

export type SemanticValidationOracleFactMap = {
  readonly "rules.legal_successor": { readonly kind: "legal_successor"; readonly legal: boolean; readonly canonicalAfterFen: string };
  readonly "rules.attack_map": { readonly kind: "attack_map"; readonly attacked: boolean; readonly attackers: readonly string[] };
  readonly "rules.material_ledger": { readonly kind: "material_ledger"; readonly pieces: readonly { readonly color: "white" | "black"; readonly role: string; readonly square: string }[] };
  readonly "rules.line_occupancy": { readonly kind: "line_occupancy"; readonly aligned: boolean; readonly blockers: readonly string[] };
  readonly "rules.complete_legal_set": { readonly kind: "complete_legal_set"; readonly legalUci: readonly string[]; readonly legalSetDigest: string };
  readonly "rules.tablebase_result": { readonly kind: "tablebase_result"; readonly category: "win" | "draw" | "loss"; readonly dtz: number | null };
};

export type SemanticValidationOracleWitnessFor<K extends SemanticValidationOracleId> = {
  readonly id: string;
  readonly version: 1;
  readonly oracle: SemanticValidationOracleRef<K>;
  readonly case: { readonly id: string; readonly version: 1 };
  readonly subject: SemanticValidationSubject;
  readonly request: SemanticValidationOracleRequestMap[K];
};

export type SemanticValidationOracleWitness = { readonly [K in SemanticValidationOracleId]: SemanticValidationOracleWitnessFor<K> }[SemanticValidationOracleId];

const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];

function position(fen: string): Chess {
  const setup = parseFen(fen);
  if (setup.isErr) throw new SemanticValidationError("SEMANTIC_VALIDATION_FIXTURE_INVALID", `oracle FEN is invalid: ${fen}`);
  const chess = Chess.fromSetup(setup.value);
  if (chess.isErr) throw new SemanticValidationError("SEMANTIC_VALIDATION_FIXTURE_INVALID", `oracle position is illegal: ${fen}`);
  return chess.value;
}

function square(name: string): Square {
  const parsed = parseSquare(name as never);
  if (parsed === undefined) throw new SemanticValidationError("SEMANTIC_VALIDATION_FIXTURE_INVALID", `oracle square ${name} is invalid`);
  return parsed;
}

function legalUci(chess: Chess): readonly string[] {
  const moves: string[] = [];
  for (const [from, dests] of chess.allDests()) for (const to of dests) {
    const roles: readonly (Role | undefined)[] = chess.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? PROMOTIONS : [undefined];
    for (const promotion of roles) {
      const move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (chess.isLegal(move)) moves.push(makeUci(move));
    }
  }
  return moves.sort();
}

const ORACLES: { readonly [K in SemanticValidationOracleId]: (request: SemanticValidationOracleRequestMap[K]) => SemanticValidationOracleFactMap[K] } = {
  "rules.legal_successor": (request) => {
    const chess = position(request.beforeFen);
    const parsed = parseUci(request.moveUci);
    const move = parsed === undefined ? undefined : normalizeMove(chess, parsed);
    const legal = move !== undefined && chess.isLegal(move);
    if (legal) chess.play(move!);
    return Object.freeze({ kind: "legal_successor", legal, canonicalAfterFen: legal ? makeFen(chess.toSetup()) : "" });
  },
  "rules.attack_map": (request) => {
    const chess = position(request.fen);
    const target = square(request.square);
    let attackers = SquareSet.empty();
    for (const from of chess.board[request.by]) {
      const piece = chess.board.get(from)!;
      if (attacks(piece, from, chess.board.occupied).has(target)) attackers = attackers.with(from);
    }
    const list = [...attackers].map((value) => makeSquare(value)).sort();
    return Object.freeze({ kind: "attack_map", attacked: list.length > 0, attackers: Object.freeze(list) });
  },
  "rules.material_ledger": (request) => {
    const chess = position(request.fen);
    const pieces = [...chess.board].map(([at, piece]) => Object.freeze({ color: piece.color, role: piece.role, square: makeSquare(at) }));
    return Object.freeze({ kind: "material_ledger", pieces: Object.freeze(pieces.sort((left, right) => left.square.localeCompare(right.square))) });
  },
  "rules.line_occupancy": (request) => {
    const chess = position(request.fen);
    const from = square(request.from);
    const to = square(request.to);
    const df = (to % 8) - (from % 8);
    const dr = Math.floor(to / 8) - Math.floor(from / 8);
    const aligned = from !== to && (df === 0 || dr === 0 || Math.abs(df) === Math.abs(dr));
    const blockers: string[] = [];
    if (aligned) {
      const step = Math.sign(dr) * 8 + Math.sign(df);
      for (let cursor = from + step; cursor !== to; cursor += step) if (chess.board.occupied.has(cursor as Square)) blockers.push(makeSquare(cursor as Square));
    }
    return Object.freeze({ kind: "line_occupancy", aligned, blockers: Object.freeze(blockers) });
  },
  "rules.complete_legal_set": (request) => {
    const moves = legalUci(position(request.rootFen));
    return Object.freeze({ kind: "complete_legal_set", legalUci: Object.freeze(moves), legalSetDigest: evidenceDigest({ domain: "tabiya:semantic-validation-legal-set@1", rootFen: request.rootFen, moves }) });
  },
  "rules.tablebase_result": () => {
    // No tablebase receipt validator is importable without the provider parser graph; the oracle
    // abstains rather than inventing a category.
    throw new SemanticValidationError("SEMANTIC_VALIDATION_AUTHORITY_INVALID", "rules.tablebase_result has no import-isolated receipt validator in v1");
  },
};

/** Executes the neutral oracle for a sealed witness; returns only the typed fact. */
export function executeSemanticValidationOracle(witness: SemanticValidationOracleWitness): SemanticValidationOracleFactMap[SemanticValidationOracleId] {
  const oracle = ORACLES[witness.oracle.id] as (request: unknown) => SemanticValidationOracleFactMap[SemanticValidationOracleId];
  const fact = oracle(witness.request);
  if (typeof fact === "object" && fact !== null && "expectation" in fact) throw new SemanticValidationError("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID", "an oracle result may not carry an expectation");
  return fact;
}

/** Sealed witness rows (§4.1). None is registered in Slice A; rules-backed cases stay required. */
export const SEMANTIC_VALIDATION_ORACLE_WITNESSES: readonly SemanticValidationOracleWitness[] = Object.freeze([]);
