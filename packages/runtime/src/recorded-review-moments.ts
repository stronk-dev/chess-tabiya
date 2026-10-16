// Accepted Review §4.5. Runtime-internal source, not the final public four-method authority.
import { evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import type { EvidenceReductionReceipt, ReductionResultItem } from "./evidence-reduction-types.js";
import type { ConventionReceipt } from "./evidence-conventions.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { lastLevelPopulationImage, readLastLevelReductionResult } from "./internal/last-level-reduction-authority.js";
import { assembleReviewMoments, orderedReviewEvidence, type UnrenderedReviewMoment } from "./internal/review-moment-assembly.js";
import { isClosedReviewSourceRecord, readRecordedReviewSourcePopulation, readRecordedReviewSourceOperands, type RecordedReviewSourceOperand, type RecordedReviewSourcePopulation, type RecordedLastLevelPopulation } from "./review-evidence.js";

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
export type RecordedReviewMomentOperand = RecordedReviewSourceOperand | Readonly<{ kind: "reduction"; value: DeclaredEvidence<unknown>;
  items: readonly ReductionResultItem[]; ordinal: number; population: RecordedLastLevelPopulation }>;
type OperandOrigin = Readonly<{ kind: "source"; slot: number; item: number }> | Readonly<{ kind: "last_level"; ordinal: number }>;
const SOURCES = new WeakMap<object, Readonly<{ population: RecordedReviewSourcePopulation; data: RecordedReviewMomentData;
  operands: readonly (readonly RecordedReviewMomentOperand[])[]; origins: readonly (readonly OperandOrigin[])[] }>>();
const GROUP_KEYS = ["ordinal", "nodeId", "decisionNodeId", "evidenceNodeId", "stopNodeId", "ply", "kinds", "evaluation", "evidence"].sort().join("|");

/** Complete real source population first; no caller evidence/groups/overrides or provider work. */
export function collectRecordedReviewMoments(input: Readonly<{ population: RecordedReviewSourcePopulation }>): RecordedReviewMomentSource {
  if (!isClosedReviewSourceRecord(input, ["population"])) throw new TypeError("Recorded Review moments require exactly {population}");
  const populationHandle = input.population, population = readRecordedReviewSourcePopulation(populationHandle);
  const items = invokeEvidenceValueRoute("derived.story.last_level@2", { population: population.lastLevelPopulation });
  const proof = readLastLevelReductionResult(items, population.lastLevelPopulation);
  const lastLevelReduction = Object.freeze({ items, receipt: proof.reduction, convention: proof.convention });
  readRecordedReviewSourcePopulation(populationHandle);
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
  const originalOperands = readRecordedReviewSourceOperands(populationHandle);
  const origins = Object.freeze(groups.map(group => {
    const used = new Set<string>();
    return Object.freeze(group.evidence.map((value): OperandOrigin => {
      const reduction = items.findIndex(item => item.evidence === value);
      if (reduction >= 0) return Object.freeze({ kind: "last_level", ordinal: reduction });
      for (const [slot, result] of population.results.entries()) if (result.slot.nodeId === group.nodeId) {
        for (const [item, original] of result.items.entries()) if (original === value && !used.has(`${slot}:${item}`)) {
          used.add(`${slot}:${item}`); return Object.freeze({ kind: "source", slot, item });
        }
      }
      throw new TypeError("Review moment evidence has no original source occurrence");
    }));
  }));
  const operands = Object.freeze(origins.map(group => Object.freeze(group.map((origin): RecordedReviewMomentOperand => origin.kind === "source"
    ? originalOperands[origin.slot]![origin.item]!
    : Object.freeze({ kind: "reduction", value: items[origin.ordinal]!.evidence, items, ordinal: origin.ordinal, population: population.lastLevelPopulation })))));
  const data = Object.freeze({ population, moments, groups, lastLevelReduction });
  const source = Object.freeze({}) as RecordedReviewMomentSource;
  SOURCES.set(source, Object.freeze({ population: populationHandle, data, operands, origins }));
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

/** Original group/item occurrences, not a value-only or payload/digest-based search. */
export function readRecordedReviewMomentOperands(source: RecordedReviewMomentSource): readonly (readonly RecordedReviewMomentOperand[])[] {
  const data = readRecordedReviewMoments(source), proof = SOURCES.get(source)!;
  const originals = readRecordedReviewSourceOperands(proof.population);
  if (proof.operands.length !== data.groups.length || proof.origins.length !== data.groups.length) throw new TypeError("Review operand groups are incomplete");
  for (const [groupIndex, group] of data.groups.entries()) {
    const operands = proof.operands[groupIndex]!, origins = proof.origins[groupIndex]!;
    if (operands.length !== group.evidence.length || origins.length !== operands.length) throw new TypeError("Review operand occurrences are incomplete");
    for (const [index, operand] of operands.entries()) {
      const origin = origins[index]!;
      if (operand.value !== group.evidence[index]) throw new TypeError("Review operand crosses its original group/item");
      if (origin.kind === "source") {
        const slot = data.population.results[origin.slot];
        if (operand !== originals[origin.slot]?.[origin.item] || slot?.slot.nodeId !== group.nodeId || slot.items[origin.item] !== operand.value) throw new TypeError("Review operand crosses its actual original source slot/item");
      } else {
        if (operand.kind !== "reduction" || operand.items !== data.lastLevelReduction.items || operand.population !== data.population.lastLevelPopulation
          || operand.ordinal !== origin.ordinal || operand.items[origin.ordinal]?.evidence !== operand.value
          || operand.items[origin.ordinal]!.nodeId !== group.nodeId || operand.items[origin.ordinal]!.plyOffset !== group.ply) throw new TypeError("Review nested reduction lost its original result ordinal/location");
        readLastLevelReductionResult(operand.items, operand.population);
      }
    }
  }
  readRecordedReviewMoments(source); return proof.operands;
}

const encodeValue = (value: DeclaredEvidence<unknown>) => Object.freeze({ producer: value.producer, projection: value.projection, payload: value.payload, receipt: evidenceValueReceipt(value) });
/** Explicit complete source/state/input encoder for rank. Never serialize nominal handles as {}. */
export function recordedReviewMomentSourceImage(source: RecordedReviewMomentSource) {
  const data = readRecordedReviewMoments(source), proof = SOURCES.get(source)!, operands = readRecordedReviewMomentOperands(source);
  const encode = (operand: RecordedReviewMomentOperand): unknown => operand.kind === "member"
    ? Object.freeze({ kind: operand.kind, value: encodeValue(operand.value), inputs: Object.freeze(operand.inputs.map(encode)) })
    : operand.kind === "leaf" ? Object.freeze({ kind: operand.kind, value: encodeValue(operand.value), availability: operand.availability, providerOperation: operand.providerOperation, image: operand.image })
      : Object.freeze({ kind: operand.kind, value: encodeValue(operand.value), ordinal: operand.ordinal,
        items: Object.freeze(operand.items.map(item => Object.freeze({ nodeId: item.nodeId, plyOffset: item.plyOffset, value: encodeValue(item.evidence) }))),
        population: lastLevelPopulationImage(operand.population), proof: readLastLevelReductionResult(operand.items, operand.population) });
  const image = Object.freeze({ boundary: data.population.boundary, shapes: data.population.shapes, plan: data.population.plan,
    results: Object.freeze(data.population.results.map(result => Object.freeze({ slot: result.slot, state: result.state, items: Object.freeze(result.items.map(encodeValue)) }))),
    capturedPoints: lastLevelPopulationImage(data.population.lastLevelPopulation),
    sourceOperands: Object.freeze(readRecordedReviewSourceOperands(proof.population).map(row => Object.freeze(row.map(encode)))),
    groups: Object.freeze(data.groups.map((group, index) => Object.freeze({ ...group, evidence: Object.freeze(group.evidence.map(encodeValue)), operands: Object.freeze(operands[index]!.map(encode)) }))),
    lastLevelReduction: Object.freeze({ items: Object.freeze(data.lastLevelReduction.items.map(item => Object.freeze({ nodeId: item.nodeId, plyOffset: item.plyOffset, value: encodeValue(item.evidence) }))),
      receipt: data.lastLevelReduction.receipt, convention: data.lastLevelReduction.convention }) });
  readRecordedReviewMoments(source); return image;
}
