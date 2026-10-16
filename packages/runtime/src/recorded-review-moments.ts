// Accepted Review §4.5. Runtime-internal source, not the final public four-method authority.
import type { DeclaredEvidence } from "./evidence-contract.js";
import type { EvidenceReductionReceipt, ReductionResultItem } from "./evidence-reduction-types.js";
import type { ConventionReceipt } from "./evidence-conventions.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { readLastLevelReductionResult } from "./internal/last-level-reduction-authority.js";
import { assembleReviewMoments, orderedReviewEvidence, type UnrenderedReviewMoment } from "./internal/review-moment-assembly.js";
import { isClosedReviewSourceRecord, readRecordedReviewSourcePopulation, type RecordedReviewSourcePopulation } from "./review-evidence.js";

declare const recordedReviewMomentSourceBrand: unique symbol;
export interface RecordedReviewMomentSource { readonly [recordedReviewMomentSourceBrand]: true }
export interface RecordedReviewMomentGroup {
  readonly ordinal: number;
  readonly nodeId: string;
  readonly decisionNodeId: string;
  readonly evidenceNodeId: string;
  readonly stopNodeId: string;
  readonly ply: number;
  readonly kinds: UnrenderedReviewMoment["kinds"];
  readonly evaluation: UnrenderedReviewMoment["evaluation"];
  readonly evidence: UnrenderedReviewMoment["evidence"];
}
interface RecordedReviewMomentData {
  readonly population: ReturnType<typeof readRecordedReviewSourcePopulation>;
  readonly moments: readonly UnrenderedReviewMoment[];
  readonly groups: readonly RecordedReviewMomentGroup[];
  readonly lastLevelReduction: Readonly<{ items: readonly ReductionResultItem[]; receipt: EvidenceReductionReceipt; convention: ConventionReceipt }>;
}
const SOURCES = new WeakMap<object, Readonly<{ population: RecordedReviewSourcePopulation; data: RecordedReviewMomentData }>>();
const GROUP_KEYS = ["ordinal", "nodeId", "decisionNodeId", "evidenceNodeId", "stopNodeId", "ply", "kinds", "evaluation", "evidence"].sort().join("|");

/** Complete real source population first; no caller evidence/groups/overrides or provider work. */
export function collectRecordedReviewMoments(input: Readonly<{ population: RecordedReviewSourcePopulation }>): RecordedReviewMomentSource {
  if (!isClosedReviewSourceRecord(input, ["population"])) throw new TypeError("Recorded Review moments require exactly {population}");
  const population = readRecordedReviewSourcePopulation(input.population);
  const items = invokeEvidenceValueRoute("derived.story.last_level@2", { population: population.lastLevelPopulation });
  const proof = readLastLevelReductionResult(items, population.lastLevelPopulation);
  const lastLevelReduction = Object.freeze({ items, receipt: proof.reduction, convention: proof.convention });
  readRecordedReviewSourcePopulation(input.population);
  const path = population.boundary.path.map(entry => entry.node);
  const byNode = new Map<string, DeclaredEvidence<unknown>[]>();
  for (const result of population.results) {
    const items = byNode.get(result.slot.nodeId) ?? [];
    items.push(...result.items); byNode.set(result.slot.nodeId, items);
  }
  const nodes = path.map(node => ({ nodeId: node.id, items: orderedReviewEvidence(byNode.get(node.id) ?? []) }));
  const moments = assembleReviewMoments(path, nodes, items);
  const groups = Object.freeze(moments.map((moment, ordinal): RecordedReviewMomentGroup => Object.freeze({ ordinal, nodeId: moment.nodeId,
    decisionNodeId: moment.decisionNodeId, evidenceNodeId: moment.evidenceNodeId, stopNodeId: moment.stopNodeId, ply: moment.ply,
    kinds: moment.kinds, evaluation: moment.evaluation, evidence: moment.evidence })));
  const data = Object.freeze({ population, moments, groups, lastLevelReduction });
  const source = Object.freeze({}) as RecordedReviewMomentSource;
  SOURCES.set(source, Object.freeze({ population: input.population, data }));
  readRecordedReviewMoments(source); // Recheck actual storage before publication, even empty/root-only.
  return source;
}

/** Authentic complete source/result/occurrences only. No reassembly, dispatch or new calculation. */
export function readRecordedReviewMoments(source: RecordedReviewMomentSource): RecordedReviewMomentData {
  const proof = source !== null && typeof source === "object" ? SOURCES.get(source) : undefined;
  if (proof === undefined) throw new TypeError("Recorded Review moment source was not issued by its owner");
  const { data } = proof, population = readRecordedReviewSourcePopulation(proof.population);
  if (population !== data.population || data.groups.length !== data.moments.length) throw new TypeError("Recorded Review moments lost their actual complete source population");
  const last = readLastLevelReductionResult(data.lastLevelReduction.items, population.lastLevelPopulation);
  if (last.reduction !== data.lastLevelReduction.receipt || last.convention !== data.lastLevelReduction.convention) throw new TypeError("Recorded Review moments lost their original last-level calculation");
  const nodes = new Map(population.boundary.path.map((entry, index) => [entry.node.id, { node: entry.node, index }]));
  for (const [ordinal, group] of data.groups.entries()) {
    const moment = data.moments[ordinal]!, original = nodes.get(group.nodeId), node = original?.node;
    if (original === undefined || original.index === 0 || node === undefined || group.ordinal !== ordinal || group.nodeId !== moment.nodeId || group.nodeId !== group.evidenceNodeId
      || group.decisionNodeId !== node.parentId || group.decisionNodeId !== moment.decisionNodeId || group.stopNodeId !== group.nodeId
      || group.ply !== node.ply || group.ply !== moment.ply || group.kinds !== moment.kinds || group.evaluation !== moment.evaluation || group.evidence !== moment.evidence
      || Object.keys(group).sort().join("|") !== GROUP_KEYS) throw new TypeError("Recorded Review rank group lost its original ordered moment/edge identity");
  }
  readRecordedReviewSourcePopulation(proof.population);
  return data;
}
