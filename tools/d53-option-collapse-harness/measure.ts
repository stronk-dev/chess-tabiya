// DISPOSABLE research harness — D53. Not production code.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import { classifyPhase } from "../../packages/runtime/src/phase.js";
import { exactLegalMoves } from "../../packages/runtime/src/legal-moves.js";
import { importedPopulation } from "../research-chess/populations.js";

export interface PathPosition {
  readonly id: string;
  readonly fen: string;
  readonly incomingUci?: string;
}

interface MeasuredPath {
  readonly id: string;
  readonly source: "authored" | "imported";
  readonly positions: readonly PathPosition[];
}

export interface CollapseConvention {
  readonly priorFloor: number;
  readonly firstCeiling: number;
  readonly secondCeiling: number;
  readonly promotionWeight: 1 | 4;
}

interface Span {
  readonly id: string;
  readonly path: MeasuredPath;
  readonly startIndex: number;
  readonly prior: PathPosition;
  readonly first: PathPosition;
  readonly second: PathPosition;
}

const CURRENT: CollapseConvention = Object.freeze({ priorFloor: 8, firstCeiling: 3, secondCeiling: 3, promotionWeight: 4 });
const DRAFTS = new URL("../../content/drafts/", import.meta.url).pathname;
const countCache = new Map<string, number>();
const destinationCountCache = new Map<string, number>();

function position(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

export function legalCount(fen: string, promotionWeight: 1 | 4): number {
  const cache = promotionWeight === 4 ? countCache : destinationCountCache;
  const cached = cache.get(fen);
  if (cached !== undefined) return cached;
  const moves = exactLegalMoves(fen);
  const count = promotionWeight === 4 ? moves.length : new Set(moves.map((move) => `${move.from}${move.to}`)).size;
  cache.set(fen, count);
  return count;
}

export function collapses(span: Pick<Span, "prior" | "first" | "second">, convention: CollapseConvention = CURRENT): boolean {
  return legalCount(span.prior.fen, convention.promotionWeight) >= convention.priorFloor
    && legalCount(span.first.fen, convention.promotionWeight) <= convention.firstCeiling
    && legalCount(span.second.fen, convention.promotionWeight) <= convention.secondCeiling;
}

function play(fen: string, uci: string): string {
  const board = position(fen);
  const move = parseUci(uci);
  if (move === undefined || !board.isLegal(move)) throw new Error(`illegal ${uci} from ${fen}`);
  board.play(move);
  return makeFen(board.toSetup());
}

function authoredPaths(): MeasuredPath[] {
  const paths: MeasuredPath[] = [];
  for (const file of readdirSync(DRAFTS).filter((name) => name.endsWith(".json") && !/\.(?:evidence|job|sources|browser)\.json$/u.test(name)).sort()) {
    const pack = JSON.parse(readFileSync(join(DRAFTS, file), "utf8")) as { id: string; start: { fen: string }; spine?: readonly any[] };
    const walk = (nodes: readonly any[], positions: readonly PathPosition[]): void => {
      for (const node of nodes ?? []) {
        const before = positions.at(-1)!;
        const after: PathPosition = Object.freeze({ id: String(node.id), fen: play(before.fen, String(node.moveUci)), incomingUci: String(node.moveUci) });
        const next = Object.freeze([...positions, after]);
        if ((node.children ?? []).length === 0) paths.push(Object.freeze({ id: `${pack.id}:${node.id}`, source: "authored", positions: next }));
        else walk(node.children, next);
      }
    };
    walk(pack.spine ?? [], [Object.freeze({ id: `${pack.id}:root`, fen: pack.start.fen })]);
  }
  return paths;
}

function importedPaths(): MeasuredPath[] {
  return importedPopulation().paths.map((path, index) => Object.freeze({
    id: `imported:${index}`,
    source: "imported" as const,
    positions: Object.freeze([
      Object.freeze({ id: `${path[0]!.id}:root`, fen: path[0]!.parentFen }),
      ...path.map((row) => Object.freeze({ id: row.id, fen: row.fen, incomingUci: row.uci })),
    ]),
  }));
}

function spans(paths: readonly MeasuredPath[]): Span[] {
  const unique = new Map<string, Span>();
  for (const path of paths) {
    for (let index = 0; index + 4 < path.positions.length; index += 1) {
      const prior = path.positions[index]!;
      const first = path.positions[index + 2]!;
      const second = path.positions[index + 4]!;
      const identity = path.source === "authored"
        ? `${path.positions[0]!.id}|${path.positions[index]!.id}|${path.positions[index + 2]!.id}|${path.positions[index + 4]!.id}`
        : `${path.id}:${index}`;
      if (!unique.has(identity)) unique.set(identity, Object.freeze({ id: identity, path, startIndex: index, prior, first, second }));
    }
  }
  return [...unique.values()];
}

function isCapture(fen: string, uci: string): boolean {
  const board = position(fen);
  const move = parseUci(uci);
  if (move === undefined || !("from" in move)) return false;
  const piece = board.board.get(move.from);
  return board.board.occupied.has(move.to) || (piece?.role === "pawn" && move.from % 8 !== move.to % 8);
}

function destination(uci: string | undefined): string | null {
  return uci === undefined ? null : uci.slice(2, 4);
}

function context(span: Span): Record<string, boolean | number | string> {
  const positions = span.path.positions;
  const firstIndex = span.startIndex + 2;
  const incoming = positions[firstIndex]!.incomingUci;
  const outgoing = positions[firstIndex + 1]!.incomingUci;
  const beforeIncoming = positions[firstIndex - 1]!.fen;
  const incomingWasCapture = incoming !== undefined && isCapture(beforeIncoming, incoming);
  const outgoingIsCapture = outgoing !== undefined && isCapture(span.first.fen, outgoing);
  const recapture = incomingWasCapture && outgoingIsCapture && destination(incoming) === destination(outgoing);
  const firstCount = legalCount(span.first.fen, 4);
  const secondCount = legalCount(span.second.fen, 4);
  return {
    phase: classifyPhase(span.first.fen).phase,
    priorCount: legalCount(span.prior.fen, 4),
    firstCount,
    secondCount,
    firstInCheck: position(span.first.fen).isCheck(),
    secondInCheck: position(span.second.fen).isCheck(),
    forcedAtFirst: firstCount === 1,
    forcedAtSecond: secondCount === 1,
    recaptureAtFirst: recapture,
  };
}

function alternativeContinuations(span: Span): Record<string, number | null> {
  const parent = span.path.positions[span.startIndex + 1]!.fen;
  const replies = exactLegalMoves(parent);
  let immediate = 0;
  let continuations = 0;
  let signalling = 0;
  for (const reply of replies) {
    const firstFen = play(parent, reply.uci);
    const firstLow = legalCount(firstFen, 4) <= CURRENT.firstCeiling;
    if (firstLow) immediate += 1;
    for (const sideMove of exactLegalMoves(firstFen)) {
      const afterSide = play(firstFen, sideMove.uci);
      for (const opponentMove of exactLegalMoves(afterSide)) {
        continuations += 1;
        const secondFen = play(afterSide, opponentMove.uci);
        if (firstLow && legalCount(secondFen, 4) <= CURRENT.secondCeiling) signalling += 1;
      }
    }
  }
  return {
    opponentReplies: replies.length,
    immediateLowReplies: immediate,
    immediateLowShare: replies.length === 0 ? null : immediate / replies.length,
    continuations,
    signallingContinuations: signalling,
    signallingShare: continuations === 0 ? null : signalling / continuations,
  };
}

function rounded(value: number | null, digits = 5): number | null {
  return value === null ? null : Number(value.toFixed(digits));
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

function percentile(values: readonly number[], fraction: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))]!;
}

function summarizePopulation(source: "authored" | "imported", sourcePaths: readonly MeasuredPath[]): Record<string, unknown> {
  const populationSpans = spans(sourcePaths);
  const current = populationSpans.filter((span) => collapses(span));
  const destination = populationSpans.filter((span) => collapses(span, { ...CURRENT, promotionWeight: 1 }));
  const baselineContexts = populationSpans.map(context);
  const contexts = current.map(context);
  const totalPlies = source === "authored"
    ? new Set(sourcePaths.flatMap((path) => path.positions.slice(1).map((entry) => `${path.positions[0]!.id}|${entry.id}`))).size
    : sourcePaths.reduce((sum, path) => sum + path.positions.length - 1, 0);
  const phaseCounts = Object.fromEntries([...new Set(contexts.map((entry) => String(entry.phase)))].sort().map((phase) => [phase, contexts.filter((entry) => entry.phase === phase).length]));
  const alternatives = source === "imported" ? current.map((span) => ({ id: span.id, ...alternativeContinuations(span) })) : [];
  const altShares = alternatives.map((entry) => entry.signallingShare).filter((value): value is number => typeof value === "number");
  const immediateShares = alternatives.map((entry) => entry.immediateLowShare).filter((value): value is number => typeof value === "number");
  const totalContinuations = alternatives.reduce((sum, entry) => sum + Number(entry.continuations), 0);
  const signallingContinuations = alternatives.reduce((sum, entry) => sum + Number(entry.signallingContinuations), 0);
  return {
    paths: sourcePaths.length,
    plies: totalPlies,
    sameSideSpans: populationSpans.length,
    currentFirings: current.length,
    firingsPerPlayedPly: rounded(current.length / totalPlies),
    destinationCountFirings: destination.length,
    promotionWeightSuppressed: destination.filter((span) => !collapses(span)).length,
    phaseCounts,
    baselineContexts: {
      checkAtEither: baselineContexts.filter((entry) => entry.firstInCheck || entry.secondInCheck).length,
      checkAtBoth: baselineContexts.filter((entry) => entry.firstInCheck && entry.secondInCheck).length,
      forcedAtEither: baselineContexts.filter((entry) => entry.forcedAtFirst || entry.forcedAtSecond).length,
      recaptureAtFirst: baselineContexts.filter((entry) => entry.recaptureAtFirst).length,
    },
    contexts: {
      firstInCheck: contexts.filter((entry) => entry.firstInCheck).length,
      secondInCheck: contexts.filter((entry) => entry.secondInCheck).length,
      checkAtEither: contexts.filter((entry) => entry.firstInCheck || entry.secondInCheck).length,
      forcedAtFirst: contexts.filter((entry) => entry.forcedAtFirst).length,
      forcedAtSecond: contexts.filter((entry) => entry.forcedAtSecond).length,
      forcedAtEither: contexts.filter((entry) => entry.forcedAtFirst || entry.forcedAtSecond).length,
      recaptureAtFirst: contexts.filter((entry) => entry.recaptureAtFirst).length,
      checkOrRecapture: contexts.filter((entry) => entry.firstInCheck || entry.secondInCheck || entry.recaptureAtFirst).length,
      quietNoncheckNonrecapture: contexts.filter((entry) => !entry.firstInCheck && !entry.secondInCheck && !entry.recaptureAtFirst).length,
    },
    alternatives: source === "imported" ? {
      measuredFirings: alternatives.length,
      immediateLowShareMedian: rounded(median(immediateShares)),
      immediateLowShareP90: rounded(percentile(immediateShares, 0.9)),
      continuationCoSignalShareMedian: rounded(median(altShares)),
      continuationCoSignalShareP90: rounded(percentile(altShares, 0.9)),
      continuationCoSignalAbove18_6Pct: altShares.filter((value) => value > 0.186).length,
      continuationCoSignalAbove50Pct: altShares.filter((value) => value > 0.5).length,
      totalContinuations,
      signallingContinuations,
      pooledContinuationCoSignalShare: totalContinuations === 0 ? null : rounded(signallingContinuations / totalContinuations),
    } : null,
    examples: current.slice(0, 12).map((span) => ({
      id: span.id,
      priorFen: span.prior.fen,
      firstFen: span.first.fen,
      secondFen: span.second.fen,
      ...context(span),
    })),
  };
}

export function measure(output: string): Record<string, unknown> {
  const authored = authoredPaths();
  const imported = importedPaths();
  const allSpans = { authored: spans(authored), imported: spans(imported) };
  const thresholdGrid = [6, 8, 10, 12].flatMap((priorFloor) => [1, 2, 3, 4, 5].flatMap((ceiling) => [1, 4].map((promotionWeight) => {
    const convention: CollapseConvention = { priorFloor, firstCeiling: ceiling, secondCeiling: ceiling, promotionWeight: promotionWeight as 1 | 4 };
    const count = (source: keyof typeof allSpans) => allSpans[source].filter((span) => collapses(span, convention)).length;
    return { priorFloor, ceiling, promotionWeight, authoredFirings: count("authored"), importedFirings: count("imported") };
  })));
  const asymmetricCeilingGrid = [2, 3, 4].flatMap((firstCeiling) => [2, 3, 4].map((secondCeiling) => {
    const convention: CollapseConvention = { priorFloor: 8, firstCeiling, secondCeiling, promotionWeight: 4 };
    const count = (source: keyof typeof allSpans) => allSpans[source].filter((span) => collapses(span, convention)).length;
    return { firstCeiling, secondCeiling, authoredFirings: count("authored"), importedFirings: count("imported") };
  }));
  const fixture = JSON.parse(readFileSync(new URL("../r2-selection-harness/fixture.json", import.meta.url), "utf8")) as unknown;
  const result = {
    schema: "tabiya.research.option-collapse.v1",
    generatedAt: new Date().toISOString(),
    convention: CURRENT,
    populations: {
      imported: summarizePopulation("imported", imported),
      authored: summarizePopulation("authored", authored),
    },
    fixture,
    thresholdGrid,
    asymmetricCeilingGrid,
    limitations: [
      "The imported population is a deterministic chronological prefix stratified by speed and broad rating, not a representative sample of all players.",
      "Check, forced-move and recapture labels are mechanical contexts, not learner usefulness judgements.",
      "Legal-continuation enumeration weights every legal continuation equally and therefore overweights implausible play.",
      "Authored branch-path counts deduplicate shared spans but do not estimate production traffic.",
    ],
  };
  writeFileSync(output, `${JSON.stringify(result, null, 1)}\n`);
  return result;
}
