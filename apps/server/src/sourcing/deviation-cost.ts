import type { DeviationCost, DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import { learnerCategory, CATEGORY_RANK } from "./tablebase-category.js";
import type { EvidenceRecord } from "./types.js";
import { SourcingError } from "./types.js";
import type { TablebaseCategory } from "../tablebase.js";

function position(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

function afterFen(fen: string, moveUci: string): string | undefined {
  try {
    const board = position(fen);
    const move = parseUci(moveUci);
    if (move === undefined || !board.isLegal(move)) return undefined;
    board.play(move);
    return makeFen(board.toSetup());
  } catch {
    return undefined;
  }
}

function spineFens(pack: DrillPackDefinition): ReadonlyMap<string, string> {
  const result = new Map<string, string>();
  const walk = (nodes: readonly import("@chess-tabiya/schema/drill-pack").SpineNode[], parentFen: string): void => {
    for (const node of nodes) {
      const fen = afterFen(parentFen, node.moveUci);
      if (fen === undefined) continue;
      result.set(node.id, fen);
      walk(node.children, fen);
    }
  };
  walk(pack.spine ?? [], pack.start.fen);
  return result;
}

function anchorFen(pack: DrillPackDefinition, index: number): string | undefined {
  const deviation = pack.deviations?.[index];
  if (deviation === undefined) return undefined;
  if ("atStart" in deviation.at) return pack.start.fen;
  if ("fen" in deviation.at) return deviation.at.fen;
  return spineFens(pack).get(deviation.at.spineNodeId);
}

function machinePair(
  pack: DrillPackDefinition,
  records: readonly EvidenceRecord[],
  index: number,
  kind: "engine_eval" | "tablebase_result",
): readonly [EvidenceRecord, EvidenceRecord] | undefined {
  const beforeFen = anchorFen(pack, index);
  if (beforeFen === undefined) return undefined;
  const after = records.find((record) => record.kind === kind && record.supports.includes(`/deviations/${index}/moveUci`));
  if (after === undefined) return undefined;
  const before = records.find((record) => record.kind === kind && record.anchor.fen === beforeFen);
  if (before === undefined || before.sourceId !== after.sourceId) return undefined;
  if (kind === "engine_eval") {
    for (const key of ["engineId", "engineVersion", "depth", "multiPv"] as const) {
      if (before.values[key] !== after.values[key]) return undefined;
    }
  }
  return [before, after];
}

function mateAgainstLearner(mateIn: number, learner: "white" | "black"): boolean {
  return learner === "white" ? mateIn < 0 : mateIn > 0;
}

export function deriveDeviationCost(
  pack: DrillPackDefinition,
  records: readonly EvidenceRecord[],
  index: number,
  basis: "engine" | "tablebase",
): DeviationCost | undefined {
  const pair = machinePair(pack, records, index, basis === "engine" ? "engine_eval" : "tablebase_result");
  if (pair === undefined) return undefined;
  const [before, after] = pair;
  if (basis === "engine") {
    const beforeCp = before.values.centipawns;
    const afterCp = after.values.centipawns;
    const beforeMate = before.values.mateIn;
    const afterMate = after.values.mateIn;
    if (Number.isSafeInteger(beforeCp) && Number.isSafeInteger(afterCp)) {
      const sign = pack.start.side === "white" ? 1 : -1;
      const loss = Math.max(0, sign * (Number(beforeCp) - Number(afterCp)));
      if (loss > 30_000) throw new SourcingError("DEVIATION_COST_OUT_OF_RANGE", `derived deviation cost ${loss} exceeds 30000`);
      return { kind: "cp", loss, basis: "engine" };
    }
    if (Number.isSafeInteger(beforeCp) && Number.isSafeInteger(afterMate)) {
      return mateAgainstLearner(Number(afterMate), pack.start.side)
        ? { kind: "mate", against: "learner", basis: "engine" }
        : undefined;
    }
    if (Number.isSafeInteger(beforeMate)) {
      if (mateAgainstLearner(Number(beforeMate), pack.start.side)) return undefined;
      if (Number.isSafeInteger(afterCp)) {
        return { kind: "unmeasurable", reason: "a forced mate at the anchor is not comparable to a centipawn score after the deviation" };
      }
    }
    return undefined;
  }
  const beforeCategory = before.values.category;
  const afterCategory = after.values.category;
  if (
    !Number.isSafeInteger(before.values.pieceCount) ||
    !Number.isSafeInteger(after.values.pieceCount) ||
    Number(before.values.pieceCount) > 7 ||
    Number(after.values.pieceCount) > 7
  ) return undefined;
  const beforeFen = before.anchor.fen;
  const afterFenValue = after.anchor.fen;
  if (typeof beforeCategory !== "string" || typeof afterCategory !== "string" || typeof beforeFen !== "string" || typeof afterFenValue !== "string") return undefined;
  const beforeLearner = learnerCategory(position(beforeFen).turn, beforeCategory as TablebaseCategory, pack.start.side);
  const afterLearner = learnerCategory(position(afterFenValue).turn, afterCategory as TablebaseCategory, pack.start.side);
  const admitted = new Set(["win", "loss", "draw", "cursed-win", "blessed-loss"]);
  if (!admitted.has(beforeLearner) || !admitted.has(afterLearner)) return undefined;
  const beforeKey = beforeLearner as Exclude<TablebaseCategory, "unknown">;
  const afterKey = afterLearner as Exclude<TablebaseCategory, "unknown">;
  if (CATEGORY_RANK[afterKey] >= CATEGORY_RANK[beforeKey]) return undefined;
  return { kind: "category", from: beforeLearner as Extract<DeviationCost, { kind: "category" }>["from"], to: afterLearner as Extract<DeviationCost, { kind: "category" }>["to"], basis: "tablebase" };
}

function comparable(left: DeviationCost, right: DeviationCost): boolean {
  if (left.kind !== right.kind) return false;
  if (left.kind === "cp" && right.kind === "cp") return left.basis === right.basis && Math.round(left.loss / 10) === Math.round(right.loss / 10);
  if (left.kind === "mate" && right.kind === "mate") {
    return left.against === right.against && left.basis === right.basis;
  }
  if (left.kind === "category" && right.kind === "category") {
    return left.from === right.from && left.to === right.to && left.basis === right.basis;
  }
  return left.kind === "unmeasurable" && right.kind === "unmeasurable" &&
    left.reason === right.reason;
}

export function stampDeviationCosts(
  pack: DrillPackDefinition,
  produced: readonly EvidenceRecord[],
  basis: "engine" | "tablebase",
): number {
  let stamped = 0;
  for (const [index, deviation] of (pack.deviations ?? []).entries()) {
    if (deviation.cost?.kind === "unmeasurable") continue;
    if (
      deviation.cost !== undefined &&
      deviation.cost.basis !== basis
    ) continue;
    const derived = deriveDeviationCost(pack, produced, index, basis);
    if (derived === undefined) continue;
    if (deviation.cost !== undefined && (deviation.cost.kind === "cp" || deviation.cost.kind === "mate" || deviation.cost.kind === "category") && !comparable(deviation.cost, derived)) {
      throw new SourcingError("VERIFY_DEVIATION_COST_CONTRADICTED", `/deviations/${index}/cost contradicts the measured ${JSON.stringify(derived)}`);
    }
    (deviation as { cost?: DeviationCost }).cost = derived;
    stamped += 1;
  }
  return stamped;
}

export function deviationCostMatches(declared: DeviationCost, derived: DeviationCost): boolean {
  return comparable(declared, derived);
}
