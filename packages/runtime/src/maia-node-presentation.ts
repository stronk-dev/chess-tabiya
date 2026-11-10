// Narrow, closed operands shared by the registered renderer and transport receiver. No source mint.
import { FLOAT32_POLICY_MASS_TOLERANCE } from "./practical-difficulty.js";
import { PresentationSchemaError, s, type Parser } from "./presentation-schema.js";
import type { MaiaNodeDistribution, MaiaNodeCandidateWdl } from "./maia-node.js";
import type { PresentationReceipt } from "./presentation-contract.js";

export type MaiaNodeDistributionOperands = Pick<MaiaNodeDistribution, "nodeId" | "engine" | "requestedBand" | "appliedBand" | "coverage" | "candidates">;
export type MaiaNodeWdlOperands = Pick<MaiaNodeCandidateWdl, "nodeId" | "engine" | "requestedBand" | "appliedBand" | "candidates">;
export interface HumanSplitPageV2 extends MaiaNodeDistributionOperands {
  readonly protocol: "inspector.human_split@2";
  readonly status: "shown" | "empty_population";
  readonly presentation: PresentationReceipt;
}

const engine = s.obj({ id: s.str, name: s.str, version: s.str, modelId: s.str, containerDigest: s.digest,
  seedHonored: s.bool, eloHonored: s.lit(true), eloApplied: s.nat });
const mass: Parser<number> = (value, label) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1 + FLOAT32_POLICY_MASS_TOLERANCE) throw new PresentationSchemaError(`${label} is not a reported model share`);
  return value;
};
const distribution = s.obj({ nodeId: s.str, engine, requestedBand: s.nat, appliedBand: s.nat,
  coverage: s.lit("bounded_reported_window"), candidates: s.arr(s.obj({ moveUci: s.uci, rank: s.nat, mass: s.nullable(mass) })) });
const wdl = s.obj({ nodeId: s.str, engine, requestedBand: s.nat, appliedBand: s.nat,
  candidates: s.arr(s.obj({ moveUci: s.uci, rank: s.nat, wdl: s.obj({ win: s.nat, draw: s.nat, loss: s.nat }) })) });

function metadata(value: MaiaNodeDistributionOperands | MaiaNodeWdlOperands): void {
  if (value.engine.eloHonored !== true || value.engine.eloApplied !== value.appliedBand) throw new PresentationSchemaError("Maia node operands do not match their actual applied band");
  const moves = new Set<string>(); let rank = 0;
  for (const row of value.candidates) {
    if (row.rank <= rank || moves.has(row.moveUci)) throw new PresentationSchemaError("Maia node rows repeat moves or change reported rank order");
    rank = row.rank; moves.add(row.moveUci);
  }
}
export const parseMaiaNodeDistributionOperands: Parser<MaiaNodeDistributionOperands> = (input, label) => {
  const value = distribution(input, label); metadata(value);
  if (value.candidates.reduce((sum, row) => sum + (row.mass ?? 0), 0) > 1 + FLOAT32_POLICY_MASS_TOLERANCE) throw new PresentationSchemaError("Maia node reported mass exceeds one");
  return value;
};
export const parseMaiaNodeWdlOperands: Parser<MaiaNodeWdlOperands> = (input, label) => {
  const value = wdl(input, label); metadata(value);
  if (value.candidates.some(row => row.wdl.win + row.wdl.draw + row.wdl.loss !== 1000)) throw new PresentationSchemaError("Maia node WDL is not a reported per-mille row");
  return value;
};

export function maiaNodeBandSentence(value: Pick<MaiaNodeDistributionOperands, "engine" | "requestedBand" | "appliedBand">): string {
  return `${value.engine.name}: requested model band ${value.requestedBand}; applied model band ${value.appliedBand}. These are model settings, not your rating.`;
}
export function maiaNodeEmptySentence(value: Pick<MaiaNodeDistributionOperands, "engine" | "requestedBand" | "appliedBand">): string {
  return `${maiaNodeBandSentence(value)} No candidate rows were reported for this position.`;
}
