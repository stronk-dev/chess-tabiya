// Disposable D3262 exact target continuation on the separately frozen coherent frame.
// This preserves the D1023 quantifier order: opponent preparation exists,
// learner defence is universal, and the original opponent target can reappear.
// It does not grade the root move or attribute an engine recommendation.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { castlingSide, Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { kingCastlesTo, makeSquare, makeUci, parseSquare, parseUci, rookCastlesTo } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import type { Color, Move, Role, Square, SquareName } from "../../packages/runtime/node_modules/chessops/dist/esm/types.js";
import { exchangeCaptureAt, legalExchangeForMove } from "../../packages/runtime/src/exchange.js";

const directory = "planning/semantic-consequence-search";
const names = ["d3262-coherent-target-comparison-frame.json", "d3262-coherent-root-frame.json", "d3262-coherent-exact-replies.json"];
const sourcePath = "tools/d1023-bounded-policy-harness/provider-sample.json";
const nodeCap = 25_000;
const promotions: readonly Role[] = ["queen", "rook", "bishop", "knight"];
type Identity = { readonly color: Color; readonly role: Role; readonly square: Square };
type Material = { readonly kind: "material"; readonly attacker: Identity; readonly target: Identity };
type Destination = { readonly kind: "destination"; readonly minor: Identity; readonly controllingPawn?: Identity; readonly square: Square };
type Target = Material | Destination;
type Reading = {
  readonly kind: "result" | "budget_exhausted";
  readonly immediate: "preserved" | "removed" | "identity_lost";
  readonly reintroducedWithin3Ply: boolean;
  readonly preparationSurvivesEveryDefence: boolean;
  readonly witness: readonly string[] | null;
  readonly refutation: readonly string[] | null;
  readonly visited: number;
};
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function sha(bytes: Buffer | string): string { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function square(value: SquareName): Square {
  const parsed = parseSquare(value);
  check(parsed !== undefined, `Invalid target square ${value}`);
  return parsed;
}
function position(fen: string): Chess { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function legalMoves(pos: Chess): readonly Move[] {
  const moves: Move[] = [];
  for (const [from, dests] of pos.allDests()) for (const to of dests) {
    const roles: readonly (Role | undefined)[] = pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? promotions : [undefined];
    for (const promotion of roles) {
      const move: Move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (pos.isLegal(move)) moves.push(move);
    }
  }
  return moves.sort((left, right) => makeUci(left).localeCompare(makeUci(right)));
}
function externalUci(pos: Chess, move: Move): string {
  const side = castlingSide(pos, move);
  return side === undefined || !("from" in move)
    ? makeUci(move)
    : makeUci({ from: move.from, to: kingCastlesTo(pos.turn, side) });
}
function checkExactReplyBoundary(rootFen: string, candidateUci: string, graphRoot: any, graphCandidate: any): void {
  check(graphRoot.fen === rootFen, `Crossed exact-reply root ${candidateUci}`);
  const root = position(rootFen);
  const parsed = parseUci(candidateUci);
  check(parsed !== undefined, `Invalid exact-reply candidate ${candidateUci}`);
  const candidate = normalizeMove(root, parsed);
  check(root.isLegal(candidate) && externalUci(root, candidate) === candidateUci,
    `Illegal or noncanonical exact-reply candidate ${candidateUci}`);
  root.play(candidate);
  check(graphCandidate.afterFen === makeFen(root.toSetup()), `Crossed exact-reply after-FEN ${candidateUci}`);
  const expected = legalMoves(root).map((move) => externalUci(root, move)).sort();
  const recorded = graphCandidate.replies.map((reply: any) => reply.uci);
  check(graphCandidate.replyCount === expected.length && recorded.length === expected.length
    && new Set(recorded).size === expected.length && JSON.stringify(recorded) === JSON.stringify(expected),
  `Incomplete exact-reply boundary ${candidateUci}`);
}
function identity(value: { readonly color: Color; readonly role: Role; readonly square: SquareName }): Identity {
  return { color: value.color, role: value.role, square: square(value.square) };
}
function targetFrom(definition: any): Target {
  if (definition.family === "material") return { kind: "material", attacker: identity(definition.target.attacker), target: identity(definition.target.target) };
  check(definition.family === "destination" && definition.target.controllingPawn?.role === "pawn", "Invalid named destination target");
  return { kind: "destination", minor: identity(definition.target.minor), controllingPawn: identity(definition.target.controllingPawn), square: square(definition.target.square) };
}
function samePiece(pos: Chess, piece: Identity): boolean {
  const found = pos.board.get(piece.square);
  return found?.color === piece.color && found.role === piece.role;
}
function advanceIdentity(pos: Chess, move: Move, piece: Identity): Identity | undefined {
  const side = castlingSide(pos, move);
  if (side !== undefined && "from" in move) {
    const rookFrom = pos.castles.rook[pos.turn][side];
    if (move.from === piece.square) return { ...piece, square: kingCastlesTo(pos.turn, side) };
    if (rookFrom === piece.square) return { ...piece, square: rookCastlesTo(pos.turn, side) };
  }
  if (exchangeCaptureAt(pos, move)?.square === piece.square) return undefined;
  return "from" in move && move.from === piece.square ? { ...piece, role: move.promotion ?? piece.role, square: move.to } : piece;
}
function playTracking(pos: Chess, move: Move, target: Target): { readonly pos: Chess; readonly target: Target } | undefined {
  const first = advanceIdentity(pos, move, target.kind === "material" ? target.attacker : target.minor);
  const second = target.kind === "material" ? advanceIdentity(pos, move, target.target)
    : target.controllingPawn === undefined ? undefined : advanceIdentity(pos, move, target.controllingPawn);
  if (first === undefined) return undefined;
  const next = pos.clone();
  next.play(move);
  if (!samePiece(next, first) || second !== undefined && !samePiece(next, second)) return undefined;
  return target.kind === "material"
    ? second === undefined ? undefined : { pos: next, target: { ...target, attacker: first, target: second } }
    : { pos: next, target: { kind: "destination", minor: first, controllingPawn: second, square: target.square } };
}
function positiveTargetCapture(pos: Chess, target: Material): Move | undefined {
  if (pos.turn !== target.attacker.color || !samePiece(pos, target.attacker) || !samePiece(pos, target.target)) return undefined;
  const move: Move = { from: target.attacker.square, to: target.target.square };
  return pos.isLegal(move) && (legalExchangeForMove(pos, move)?.resultUnits ?? 0) > 0 ? move : undefined;
}
function locallyNonLosingQuiet(pos: Chess, move: Move): boolean {
  if (!pos.isLegal(move) || exchangeCaptureAt(pos, move) !== undefined) return false;
  const next = pos.clone();
  next.play(move);
  return !legalMoves(next).filter((capture) => "from" in capture && capture.to === move.to && exchangeCaptureAt(next, capture) !== undefined)
    .some((capture) => (legalExchangeForMove(next, capture)?.resultUnits ?? 0) > 0);
}
function destinationAvailable(pos: Chess, target: Destination): boolean {
  return pos.turn === target.minor.color && samePiece(pos, target.minor) && pos.board.get(target.square) === undefined
    && locallyNonLosingQuiet(pos, { from: target.minor.square, to: target.square });
}
function reading(immediate: Reading["immediate"], witness: readonly string[] | null, refutation: readonly string[] | null,
  universal: boolean, visited: number, kind: Reading["kind"] = "result"): Reading {
  return { kind, immediate, reintroducedWithin3Ply: immediate === "removed" && witness?.length === 4,
    preparationSurvivesEveryDefence: universal,
    witness, refutation, visited };
}

function controllerRemovedOnWitness(rootFen: string, witness: readonly string[] | null, definition: any): boolean {
  if (definition.family !== "destination" || witness === null || witness.length < 2) return false;
  const pos = position(rootFen);
  const candidate = parseUci(witness[0]);
  const preparation = parseUci(witness[1]);
  if (candidate === undefined || preparation === undefined) return false;
  const candidateMove = normalizeMove(pos, candidate);
  check(pos.isLegal(candidateMove), "Invalid mismatch candidate");
  pos.play(candidateMove);
  const pawn = identity(definition.target.controllingPawn);
  if (!samePiece(pos, pawn)) return false;
  const preparationMove = normalizeMove(pos, preparation);
  check(pos.isLegal(preparationMove), "Invalid mismatch preparation");
  return exchangeCaptureAt(pos, preparationMove)?.square === pawn.square;
}

export function evaluateBoundedTarget(rootFen: string, candidateUci: string, definition: any): Reading {
  const root = position(rootFen);
  const parsed = parseUci(candidateUci);
  check(parsed !== undefined, `Invalid candidate ${candidateUci}`);
  const candidate = normalizeMove(root, parsed);
  check(root.isLegal(candidate), `Illegal candidate ${candidateUci}`);
  const target = targetFrom(definition);
  check(target.kind === "material" ? samePiece(root, target.attacker) && samePiece(root, target.target)
    : samePiece(root, target.minor), "Named target identity absent at root");
  // A destination's named controlling pawn is a *post-candidate* identity.
  // Natural alternatives must not inherit its existence from the source move.
  const tracked = target.kind === "material" ? playTracking(root, candidate, target) : (() => {
    const next = root.clone();
    next.play(candidate);
    if (!samePiece(next, target.minor)) return undefined;
    return { pos: next, target: { ...target,
      controllingPawn: target.controllingPawn !== undefined && samePiece(next, target.controllingPawn)
        ? target.controllingPawn : undefined } };
  })();
  if (tracked === undefined) {
    if (target.kind === "material" && exchangeCaptureAt(root, candidate)?.square !== target.attacker.square) {
      return reading("identity_lost", null, null, false, 1);
    }
    return reading("removed", [candidateUci], null, false, 1);
  }
  const afterCandidate = tracked.pos;
  const updated = tracked.target;
  if (updated.kind === "material") {
    const direct = positiveTargetCapture(afterCandidate, updated);
    if (direct !== undefined) return reading("preserved", [candidateUci, makeUci(direct)], null, false, 1);
  } else if (destinationAvailable(afterCandidate, updated)) {
    return reading("preserved", [candidateUci, `${makeSquare(updated.minor.square)}${makeSquare(updated.square)}`], null, false, 1);
  }
  let visited = 1;
  let witness: readonly string[] | null = null;
  let firstRefutation: readonly string[] | null = null;
  for (const preparation of legalMoves(afterCandidate)) {
    visited += 1;
    if (visited > nodeCap) return reading("removed", witness, firstRefutation, false, visited, "budget_exhausted");
    const afterPreparation = playTracking(afterCandidate, preparation, updated);
    if (afterPreparation === undefined) continue;
    const replies = legalMoves(afterPreparation.pos);
    if (replies.length === 0) continue;
    let everyReply = true;
    let preparationWitness: readonly string[] | null = null;
    let preparationRefutation: readonly string[] | null = null;
    for (const reply of replies) {
      visited += 1;
      if (visited > nodeCap) return reading("removed", witness, firstRefutation, false, visited, "budget_exhausted");
      const afterReply = playTracking(afterPreparation.pos, reply, afterPreparation.target);
      const final = afterReply?.target;
      const follow = final?.kind === "material" ? positiveTargetCapture(afterReply!.pos, final)
        : final?.kind === "destination" && destinationAvailable(afterReply!.pos, final)
          ? { from: final.minor.square, to: final.square } : undefined;
      if (follow === undefined) {
        everyReply = false;
        preparationRefutation ??= [candidateUci, makeUci(preparation), makeUci(reply)];
        continue;
      }
      const line = [candidateUci, makeUci(preparation), makeUci(reply), makeUci(follow)];
      preparationWitness ??= line;
      witness ??= line;
    }
    if (everyReply && preparationWitness !== null) return reading("removed", preparationWitness, firstRefutation, true, visited);
    firstRefutation ??= preparationRefutation;
  }
  return reading("removed", witness, firstRefutation, false, visited);
}

export function compileCoherentBoundedTargets(comparisons: any, frame: any, graph: any, source: any): any {
  check(comparisons.profile === "d3262-coherent-target-comparison-v1"
    && frame.profile === "d3262-coherent-root-v1" && graph.profile === "d3262-coherent-root-v1"
    && comparisons.manifest === frame.manifest && frame.manifest === graph.manifest, "Crossed corrected target population");
  check(comparisons.comparisons.length === 182, "Corrected comparison denominator changed");
  const definitions = new Map(comparisons.definitions.map((item: any) => [item.id, item]));
  const roots = new Map(frame.roots.map((item: any) => [item.rootId, item]));
  const replyRoots = new Map(graph.roots.map((item: any) => [item.rootId, item]));
  const sourceRows = source.populations.flatMap((population: any) => population.rows);
  let sourceControls = 0;
  const sourceDisagreements: any[] = [];
  const checkedCandidates = new Set<string>();
  const rows = comparisons.comparisons.map((pair: any) => {
    const definition: any = definitions.get(pair.targetId);
    const root: any = roots.get(pair.rootId);
    const graphRoot: any = replyRoots.get(pair.rootId);
    const graphCandidate = graphRoot?.candidates.find((item: any) => item.candidateUci === pair.candidateUci);
    check(definition?.rootId === pair.rootId && root?.candidates.some((item: any) => item.moveUci === pair.candidateUci)
      && graphCandidate !== undefined, `Missing target/candidate ${pair.rootId}/${pair.candidateUci}`);
    const candidateKey = `${pair.rootId}/${pair.candidateUci}`;
    if (!checkedCandidates.has(candidateKey)) {
      checkExactReplyBoundary(root.fen, pair.candidateUci, graphRoot, graphCandidate);
      checkedCandidates.add(candidateKey);
    }
    const result = evaluateBoundedTarget(root.fen, pair.candidateUci, definition);
    if (pair.sourceObserved) {
      const matches = sourceRows.filter((item: any) => item.parentFen === root.fen && item.candidateUci === pair.candidateUci
        && item.targetFamily === definition.family && JSON.stringify(item.target) === JSON.stringify(definition.target));
      check(matches.length === 1, `Missing source control ${pair.rootId}/${pair.candidateUci}`);
      const expected = matches[0].exact;
      check(result.kind === "result" && result.immediate === expected.immediate,
        `D1023 immediate source control disagrees ${pair.rootId}/${pair.candidateUci}/${pair.targetId}`);
      if (result.reintroducedWithin3Ply !== expected.reintroducedWithin3Ply
        || result.preparationSurvivesEveryDefence !== expected.preparationSurvivesEveryDefence) {
        const controllerCapturedOnWitness = controllerRemovedOnWitness(root.fen, result.witness, definition);
        check(controllerCapturedOnWitness, `Unexplained D1023 bounded source disagreement ${pair.rootId}/${pair.candidateUci}/${pair.targetId}`);
        sourceDisagreements.push({ ...pair, family: definition.family, controllerCapturedOnWitness, actual: result, expected });
      }
      sourceControls += 1;
    }
    return { ...pair, family: definition.family, ...result };
  });
  check(sourceControls === 96, "Source control denominator changed");
  return { version: 1, profile: "d3262-coherent-bounded-targets-v1",
    authority: "exact_target_continuation_with_declared_quantifiers_not_engine_reason_or_root_move_grade",
    manifest: comparisons.manifest, sourceControls, sourceDisagreements, rows };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const inputs = names.map((name) => readFileSync(`${directory}/${name}`));
  const sourceBytes = readFileSync(sourcePath);
  const artifact = {
    ...compileCoherentBoundedTargets(...inputs.map((bytes) => JSON.parse(bytes.toString())) as [any, any, any], JSON.parse(sourceBytes.toString())),
    inputDigests: { ...Object.fromEntries(names.map((name, index) => [name, sha(inputs[index])])), [sourcePath]: sha(sourceBytes) },
  };
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-bounded-targets.json`;
  if (process.argv.includes("--write")) writeFileSync(target, bytes, { flag: "wx" });
  else check(readFileSync(target, "utf8") === bytes, "Bounded target output differs from sealed inputs");
  const summary = (family: string, observed: boolean) => {
    const rows = artifact.rows.filter((row: any) => row.family === family && row.sourceObserved === observed);
    return { cells: rows.length, immediatePreserved: rows.filter((row: any) => row.immediate === "preserved").length,
      reintroduced: rows.filter((row: any) => row.reintroducedWithin3Ply).length,
      survivesEveryDefence: rows.filter((row: any) => row.preparationSurvivesEveryDefence).length,
      budgetExhausted: rows.filter((row: any) => row.kind === "budget_exhausted").length };
  };
  process.stdout.write(`${JSON.stringify({ digest: sha(bytes), sourceDisagreements: artifact.sourceDisagreements.length,
    materialSource: summary("material", true),
    materialAlternative: summary("material", false), destinationSource: summary("destination", true),
    destinationAlternative: summary("destination", false) }, null, 2)}\n`);
}
