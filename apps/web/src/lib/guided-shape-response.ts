import { evidenceDigest } from "../../../../packages/runtime/src/evidence-contract.js";
import { parseGuidedShapeQuery, type GuidedShapePage, type GuidedShapeQuery } from "../../../../packages/runtime/src/guided-shape-query.js";
import { parseRegisteredShapeFiringOperands } from "../../../../packages/runtime/src/registered-shape-presentation.js";
import { parsePresentationReceipt, type PresentedEvidenceItem } from "../../../../packages/runtime/src/presentation-contract.js";

export interface GuidedShapeExpectation {
  readonly effectiveConfigDigest: string;
  readonly nodeIds: readonly string[];
}
export type ParsedGuidedShapePage = Omit<GuidedShapePage, "firings"> & {
  readonly firings: readonly Readonly<{ value: GuidedShapePage["firings"][number]["value"]; presentation: readonly PresentedEvidenceItem[] }>[];
};
function fail(message: string): never { throw new TypeError(`Invalid guided pattern response: ${message}`); }
function row(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype
    || Reflect.ownKeys(value).length !== keys.length || keys.some(key => {
      const field = Object.getOwnPropertyDescriptor(value, key); return field === undefined || !field.enumerable || !("value" in field);
    })) return fail("closed data envelope");
  return value as Record<string, unknown>;
}
export function parseGuidedShapePage(value: unknown, runId: string, request: GuidedShapeQuery, expected: GuidedShapeExpectation): ParsedGuidedShapePage {
  const requested = parseGuidedShapeQuery(request), raw = row(value,
    ["runId", "branchId", "endpointId", "decisionDigest", "effectiveConfigDigest", "sourceKey", "outcome", "firings"]);
  if (raw.runId !== runId || raw.branchId !== requested.query.branchId || raw.endpointId !== requested.query.endpointId
    || raw.decisionDigest !== requested.query.decisionDigest || raw.effectiveConfigDigest !== expected.effectiveConfigDigest
    || typeof raw.sourceKey !== "string" || !/^sha256:[a-f0-9]{64}$/u.test(raw.sourceKey)) return fail("request/configuration correlation");
  const ids = [...expected.nodeIds], positions = new Map(ids.map((id, index) => [id, index]));
  if (ids.length === 0 || positions.size !== ids.length || ids.at(-1) !== requested.query.endpointId) return fail("original requested prefix");
  const kind = raw.outcome !== null && typeof raw.outcome === "object" ? Object.getOwnPropertyDescriptor(raw.outcome, "kind") : undefined;
  const outcome = row(raw.outcome, kind !== undefined && "value" in kind && kind.value === "unavailable" ? ["kind", "reason"] : ["kind"]);
  if (typeof outcome.kind !== "string" || !["available", "no_witness", "unavailable"].includes(outcome.kind)
    || outcome.kind === "unavailable" && (typeof outcome.reason !== "string" || !["authored_source_absent", "source_dependency_unavailable"].includes(outcome.reason))) return fail("outcome");
  if (!Array.isArray(raw.firings) || Object.getPrototypeOf(raw.firings) !== Array.prototype
    || Reflect.ownKeys(raw.firings).length !== raw.firings.length + 1
    || Array.from({ length: raw.firings.length }, (_, index) => {
      const field = Object.getOwnPropertyDescriptor(raw.firings, index); return field === undefined || !field.enumerable || !("value" in field);
    }).some(Boolean) || (raw.firings.length > 0) !== (outcome.kind === "available")) return fail("complete outcome/population");
  const lastByShape = new Map<string, number>(); let previousShape = "";
  const firings = raw.firings.map(candidate => {
    const item = row(candidate, ["value", "presentation"]), value = parseRegisteredShapeFiringOperands(item.value, "guided pattern");
    const first = positions.get(value.firstNodeId), last = positions.get(value.lastNodeId), previous = lastByShape.get(value.entryId);
    if (first === undefined || last === undefined || first > last || value.openEnded !== (last === ids.length - 1)
      || previous !== undefined && first <= previous + 1 || previousShape.localeCompare(value.entryId) > 0) return fail("recorded interval membership/order");
    previousShape = value.entryId; lastByShape.set(value.entryId, last);
    const presentation = parsePresentationReceipt(item.presentation);
    if (presentation.length !== 1) return fail("complete registered presentation");
    const presented = presentation[0]!, ref = presented.evidenceRef;
    if (presented.adapter.consumer.id !== "theory.shape_firing" || presented.adapter.consumer.version !== 2
      || presented.adapter.projection.id !== "theory.shapes.firing" || presented.adapter.projection.version !== 3
      || ref === null || ref.producer.id !== "theory.shapes" || ref.producer.version !== 1
      || ref.projection.id !== "theory.shapes.firing" || ref.projection.version !== 3
      || ref.evidenceDigest !== `sha256:${evidenceDigest(value)}` || presented.component.id !== "fact_statement"
      || presented.component.operand.rendererId !== "inspector.registered_shape_firing@2"
      || evidenceDigest(presented.component.operand.operands) !== evidenceDigest(value)) return fail("exact value/presentation binding");
    return Object.freeze({ value, presentation });
  });
  return Object.freeze({ runId, ...requested.query, effectiveConfigDigest: expected.effectiveConfigDigest,
    sourceKey: raw.sourceKey as string, outcome: Object.freeze(outcome) as GuidedShapePage["outcome"], firings: Object.freeze(firings) });
}
