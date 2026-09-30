/**
 * Bounded target policy composition — the two reported derivations
 * (rfc/bounded-target-policy-composition.md §§2–3).
 *
 * Pure functions over sealed authorities: the exact local target facts (named target, immediate,
 * optional bounded return) plus the raw same-exchange provider receipts. They never call a
 * provider; the server operation fetches receipts through the shared scheduler and the two value
 * factories seal what these functions compute. No interpretation enters a raw receipt, no depth is
 * chosen when the category disagrees, and no Maia mass is renormalized, zeroed or summed.
 */
import { assertProviderDelivery } from "./provider-exchange.js";
import { exactLegalMoves } from "./legal-moves.js";
import type { DeclaredEvidence } from "./evidence-contract.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import type { LegalRootScore, MaiaPolicyPage, ProviderEvidenceDelivery, StockfishLegalRootTable } from "./provider-types.js";
import {
  fenAfterLine,
  targetAvailabilityAfterLine,
  type BoundedTargetImmediateEvidence,
  type BoundedTargetReturnEvidence,
  type ImmediateTargetOutcome,
  type NamedMaterialTargetEvidence,
} from "./bounded-target-chess.js";

export type StockfishTableEvidence = DeclaredEvidence<ProviderEvidenceDelivery<StockfishLegalRootTable, "stockfish.legal_root_table@1">>;
export type MaiaPageEvidence = DeclaredEvidence<ProviderEvidenceDelivery<MaiaPolicyPage, "maia.policy_page@1">>;

export const ENGINE_TARGET_POLICY_CONVENTION = "bounded-target-engine-policy@1" as const;
export const MAIA_TARGET_POLICY_CONVENTION = "bounded-target-maia-policy@1" as const;
export const ENGINE_POLICY_DEPTHS = Object.freeze([8, 10] as const);
export const MAIA_POLICY_PARAMETERS = Object.freeze({ temperature: 0.8, topP: 0.92, keptPerNode: 8, retainedMassFloor: 0.9 } as const);

export interface TargetPolicyCategory {
  readonly nextExecution: boolean;
  readonly secondOpportunityAvailable: boolean;
}

export interface EngineTargetPolicyReading {
  readonly convention: typeof ENGINE_TARGET_POLICY_CONVENTION;
  readonly target: NamedMaterialTargetEvidence;
  readonly immediate: BoundedTargetImmediateEvidence;
  readonly boundedReturn: BoundedTargetReturnEvidence | null;
  readonly candidateUci: string;
  readonly counterfactualUci: string;
  readonly pairKey: string;
  readonly depths: readonly [8, 10];
  readonly tables: readonly [StockfishTableEvidence, StockfishTableEvidence];
  readonly perDepth: readonly {
    readonly depth: 8 | 10;
    readonly category: TargetPolicyCategory;
    readonly bestMoveUci: string;
    readonly score: { readonly kind: "cp" | "mate"; readonly value: number };
  }[];
  readonly stableCategory: TargetPolicyCategory;
}

export interface ProbabilityInterval {
  readonly lower: number;
  readonly upper: number;
}

export interface BoundedTargetPolicyBounds {
  readonly convention: typeof MAIA_TARGET_POLICY_CONVENTION;
  readonly target: NamedMaterialTargetEvidence;
  readonly immediate: BoundedTargetImmediateEvidence;
  readonly boundedReturn: BoundedTargetReturnEvidence | null;
  readonly candidateUci: string;
  readonly counterfactualUci: string;
  readonly pairKey: string;
  readonly appliedBand: number;
  readonly temperature: 0.8;
  readonly topP: 0.92;
  readonly keptPerNode: 8;
  readonly retainedMassFloor: 0.9;
  readonly pages: readonly MaiaPageEvidence[];
  readonly nextExecutionMass: ProbabilityInterval;
  readonly nextExecutionAbsence: ImmediateTargetOutcome["cause"] | null;
  readonly secondOpportunityAvailableMass: ProbabilityInterval;
  readonly expandedSecondNodes: number;
  readonly minimumSecondKeptMass: number;
  readonly denominator: {
    readonly requestedNodes: number;
    readonly admittedNodes: number;
    readonly returnedMass: number;
    readonly keptMass: number;
    readonly candidateCount: number;
    readonly keptCount: number;
  };
}

export type EnginePolicyAbstention = "input_abstained" | "position_or_target_mismatch" | "counterfactual_invalid" | "depth_category_unstable";
export type MaiaPolicyAbstention =
  | "input_abstained" | "position_or_target_mismatch" | "provider_unavailable" | "timeout" | "cancelled" | "identity_or_generation_mismatch"
  | "retained_mass_below_gate" | "massless_candidate" | "expansion_budget_exhausted";

export type PolicyDerivation<T, R extends string> = { readonly kind: "reading"; readonly payload: T } | { readonly kind: "abstained"; readonly reason: R };

export interface PolicyLocalInputs {
  readonly target: NamedMaterialTargetEvidence;
  readonly immediate: BoundedTargetImmediateEvidence;
  readonly boundedReturn: BoundedTargetReturnEvidence | null;
  readonly counterfactualUci: string;
}

// ---------------------------------------------------------------------------------------------
// Shared joins
// ---------------------------------------------------------------------------------------------

/** Exact joins shared by both arms; returns the after-candidate FEN or an abstention. */
function joinLocal(local: PolicyLocalInputs): { readonly kind: "joined"; readonly afterFen: string; readonly pairKey: string } | { readonly kind: "abstained"; readonly reason: "position_or_target_mismatch" | "counterfactual_invalid" } {
  const target = local.target.payload;
  const immediate = local.immediate.payload;
  if (immediate.target !== local.target) return { kind: "abstained", reason: "position_or_target_mismatch" };
  if ((immediate.outcome.result === "removed") !== (local.boundedReturn !== null)) return { kind: "abstained", reason: "position_or_target_mismatch" };
  if (local.boundedReturn !== null && local.boundedReturn.payload.immediate !== local.immediate) return { kind: "abstained", reason: "position_or_target_mismatch" };
  const legal = exactLegalMoves(target.passAnchor.sourceFen).map((move) => move.uci);
  if (local.counterfactualUci === immediate.candidateUci || !legal.includes(local.counterfactualUci)) return { kind: "abstained", reason: "counterfactual_invalid" };
  const afterFen = fenAfterLine(target, [immediate.candidateUci]);
  if (afterFen !== immediate.afterFen) return { kind: "abstained", reason: "position_or_target_mismatch" };
  const pairKey = `${target.passAnchor.sourceFen}|${target.captureUci}|${immediate.candidateUci}|${local.counterfactualUci}`;
  return { kind: "joined", afterFen, pairKey };
}

const tableOf = (evidence: StockfishTableEvidence) => evidence.payload.payload;

/** The table's selected root move: highest root-side-to-move score, first row on a tie. */
export function selectedRootRow(table: StockfishLegalRootTable): StockfishLegalRootTable["rows"][number] {
  const rank = (score: LegalRootScore): number => score.kind === "centipawns" ? score.value : score.outcome === "root_mates" ? 1_000_000 - score.distance : -1_000_000 + score.distance;
  return table.rows.reduce((best, row) => rank(row.score) > rank(best.score) ? row : best);
}

// ---------------------------------------------------------------------------------------------
// §2 Stockfish depth-stable category
// ---------------------------------------------------------------------------------------------

export function deriveEngineTargetPolicy(local: PolicyLocalInputs, tables: readonly [StockfishTableEvidence, StockfishTableEvidence]): PolicyDerivation<EngineTargetPolicyReading, EnginePolicyAbstention> {
  const joined = joinLocal(local);
  if (joined.kind === "abstained") return joined;
  const target = local.target.payload;
  const perDepth: EngineTargetPolicyReading["perDepth"][number][] = [];
  for (const [index, depth] of ENGINE_POLICY_DEPTHS.entries()) {
    const evidence = tables[index]!;
    assertProviderDelivery("stockfish.legal_root_table@1", evidence.payload);
    const table = tableOf(evidence);
    // The raw source already proved legal-set equality and reached depth; recheck FEN and depth only.
    if (canonicalFen(positionFromFen(table.request.fen)) !== joined.afterFen || table.request.bound.value !== depth) return { kind: "abstained", reason: "position_or_target_mismatch" };
    if (table.rows.length === 0) return { kind: "abstained", reason: "input_abstained" };
    const best = selectedRootRow(table);
    const nextExecution = local.immediate.payload.outcome.result === "preserved" && best.moveUci === local.immediate.payload.outcome.postCandidateExchange.captureUci;
    let secondOpportunityAvailable = false;
    if (!nextExecution) {
      const reply = best.pv[1];
      if (reply === undefined) return { kind: "abstained", reason: "input_abstained" };
      const availability = targetAvailabilityAfterLine(target, [local.immediate.payload.candidateUci, best.moveUci, reply]);
      if (availability.kind === "illegal" || availability.kind === "identity_lost") return { kind: "abstained", reason: "input_abstained" };
      secondOpportunityAvailable = availability.kind === "available";
    }
    perDepth.push(Object.freeze({
      depth,
      category: Object.freeze({ nextExecution, secondOpportunityAvailable }),
      bestMoveUci: best.moveUci,
      score: Object.freeze(best.score.kind === "centipawns" ? { kind: "cp" as const, value: best.score.value } : { kind: "mate" as const, value: best.score.outcome === "root_mates" ? best.score.distance : -best.score.distance }),
    }));
  }
  const [shallow, deep] = perDepth as [EngineTargetPolicyReading["perDepth"][number], EngineTargetPolicyReading["perDepth"][number]];
  if (shallow.category.nextExecution !== deep.category.nextExecution || shallow.category.secondOpportunityAvailable !== deep.category.secondOpportunityAvailable) return { kind: "abstained", reason: "depth_category_unstable" };
  return {
    kind: "reading",
    payload: Object.freeze({
      convention: ENGINE_TARGET_POLICY_CONVENTION,
      target: local.target,
      immediate: local.immediate,
      boundedReturn: local.boundedReturn,
      candidateUci: local.immediate.payload.candidateUci,
      counterfactualUci: local.counterfactualUci,
      pairKey: joined.pairKey,
      depths: Object.freeze([8, 10] as const),
      tables: Object.freeze([tables[0], tables[1]] as const),
      perDepth: Object.freeze(perDepth),
      stableCategory: deep.category,
    }),
  };
}

// ---------------------------------------------------------------------------------------------
// §3 Maia one-band bounds
// ---------------------------------------------------------------------------------------------

export interface MaiaExpansion {
  /** The exact-FEN root page at the after-candidate position. */
  readonly root: MaiaPageEvidence;
  /** One exact-FEN page per expanded root move (the top ≤8 by mass), joined by its exact child FEN. */
  readonly second: readonly MaiaPageEvidence[];
}

const massless = (page: MaiaPolicyPage): boolean => page.candidates.some((row) => !(row.probability > 0));
const pageOf = (evidence: MaiaPageEvidence): MaiaPolicyPage => evidence.payload.payload;

/**
 * The declared requested width at one position: `keptPerNode`, narrowed to the legal-move count
 * because the provider protocol refuses a width above it (changelog 2026-09-24).
 */
export function maiaRequestedWidth(fen: string): number {
  return Math.min(MAIA_POLICY_PARAMETERS.keptPerNode, exactLegalMoves(fen).length);
}

/** The root moves the declared expansion requests: the top `keptPerNode` rows by mass, then UCI. */
export function maiaExpansionMoves(root: MaiaPolicyPage): readonly string[] {
  return [...root.candidates].sort((left, right) => right.probability - left.probability || left.moveUci.localeCompare(right.moveUci)).slice(0, MAIA_POLICY_PARAMETERS.keptPerNode).map((row) => row.moveUci);
}

function checkPage(evidence: MaiaPageEvidence, fen: string, band: number): MaiaPolicyAbstention | undefined {
  assertProviderDelivery("maia.policy_page@1", evidence.payload);
  const page = pageOf(evidence);
  if (page.request.position.kind !== "exact_fen" || canonicalFen(positionFromFen(page.request.position.fen)) !== fen) return "position_or_target_mismatch";
  if (page.appliedBand !== band || page.temperature !== MAIA_POLICY_PARAMETERS.temperature || page.topP !== MAIA_POLICY_PARAMETERS.topP || page.requestedWidth !== maiaRequestedWidth(fen)) return "identity_or_generation_mismatch";
  if (massless(page)) return "massless_candidate";
  if (page.returnedProbabilityMass < MAIA_POLICY_PARAMETERS.retainedMassFloor) return "retained_mass_below_gate";
  return undefined;
}

const round = (value: number): number => Math.round(value * 1e9) / 1e9;

export function deriveMaiaPolicyBounds(local: PolicyLocalInputs, band: number, expansion: MaiaExpansion): PolicyDerivation<BoundedTargetPolicyBounds, MaiaPolicyAbstention> {
  const joined = joinLocal(local);
  if (joined.kind === "abstained") return { kind: "abstained", reason: joined.reason === "counterfactual_invalid" ? "position_or_target_mismatch" : joined.reason };
  const target = local.target.payload;
  const candidateUci = local.immediate.payload.candidateUci;
  const rootFailure = checkPage(expansion.root, joined.afterFen, band);
  if (rootFailure !== undefined) return { kind: "abstained", reason: rootFailure };
  const root = pageOf(expansion.root);
  const expanded = maiaExpansionMoves(root);
  const byFen = new Map<string, MaiaPageEvidence>();
  for (const page of expansion.second) {
    const request = pageOf(page).request.position;
    if (request.kind !== "exact_fen") return { kind: "abstained", reason: "position_or_target_mismatch" };
    const key = canonicalFen(positionFromFen(request.fen));
    if (byFen.has(key)) return { kind: "abstained", reason: "position_or_target_mismatch" };
    byFen.set(key, page);
  }
  const childFens = new Map(expanded.map((move) => [move, fenAfterLine(target, [candidateUci, move])] as const));
  if (byFen.size !== expanded.length || [...childFens.values()].some((fen) => !byFen.has(fen))) return { kind: "abstained", reason: "expansion_budget_exhausted" };
  // Next execution: three closed arms.
  const outcome = local.immediate.payload.outcome;
  const missingRootMass = round(1 - root.returnedProbabilityMass);
  let nextExecutionMass: ProbabilityInterval;
  let nextExecutionAbsence: BoundedTargetPolicyBounds["nextExecutionAbsence"] = null;
  if (outcome.result === "preserved") {
    const row = root.candidates.find((candidate) => candidate.moveUci === outcome.postCandidateExchange.captureUci);
    nextExecutionMass = row === undefined ? { lower: 0, upper: missingRootMass } : { lower: row.probability, upper: row.probability };
  } else {
    nextExecutionMass = { lower: 0, upper: 0 };
    nextExecutionAbsence = outcome.cause;
  }
  // Second opportunity: verified available path mass versus known failure; tail mass stays open.
  let available = 0;
  let knownFailure = 0;
  let minimumSecondKeptMass = 1;
  const pages: MaiaPageEvidence[] = [expansion.root];
  for (const move of expanded) {
    const rootRow = root.candidates.find((candidate) => candidate.moveUci === move)!;
    const childFen = childFens.get(move)!;
    const first = targetAvailabilityAfterLine(target, [candidateUci, move]);
    const evidence = byFen.get(childFen)!;
    const failure = checkPage(evidence, childFen, band);
    if (failure !== undefined) return { kind: "abstained", reason: failure };
    pages.push(evidence);
    const page = pageOf(evidence);
    minimumSecondKeptMass = Math.min(minimumSecondKeptMass, page.returnedProbabilityMass);
    if (first.kind === "identity_lost" || first.kind === "illegal") return { kind: "abstained", reason: "position_or_target_mismatch" };
    for (const reply of page.candidates) {
      const reached = targetAvailabilityAfterLine(target, [candidateUci, move, reply.moveUci]);
      if (reached.kind === "illegal" || reached.kind === "identity_lost") return { kind: "abstained", reason: "position_or_target_mismatch" };
      const mass = rootRow.probability * reply.probability;
      if (reached.kind === "available") available += mass;
      else knownFailure += mass;
    }
  }
  const returnedMass = root.returnedProbabilityMass;
  const keptMass = round(expanded.reduce((sum, move) => sum + root.candidates.find((candidate) => candidate.moveUci === move)!.probability, 0));
  return {
    kind: "reading",
    payload: Object.freeze({
      convention: MAIA_TARGET_POLICY_CONVENTION,
      target: local.target,
      immediate: local.immediate,
      boundedReturn: local.boundedReturn,
      candidateUci,
      counterfactualUci: local.counterfactualUci,
      pairKey: joined.pairKey,
      appliedBand: band,
      temperature: 0.8,
      topP: 0.92,
      keptPerNode: 8,
      retainedMassFloor: 0.9,
      pages: Object.freeze(pages),
      nextExecutionMass: Object.freeze({ lower: round(nextExecutionMass.lower), upper: round(nextExecutionMass.upper) }),
      nextExecutionAbsence,
      secondOpportunityAvailableMass: Object.freeze({ lower: round(available), upper: round(1 - knownFailure) }),
      expandedSecondNodes: expanded.length,
      minimumSecondKeptMass: round(expanded.length === 0 ? 0 : minimumSecondKeptMass),
      denominator: Object.freeze({
        requestedNodes: 1 + expanded.length,
        admittedNodes: pages.length,
        returnedMass: round(returnedMass),
        keptMass,
        candidateCount: root.candidates.length,
        keptCount: expanded.length,
      }),
    }),
  };
}
