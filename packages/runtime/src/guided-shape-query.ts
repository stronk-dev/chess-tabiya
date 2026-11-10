// Accepted module-registration D4082: ordinary guided read, independent of Inspector/reveal.
import { parseRequestedAssistanceV1, type RequestedAssistanceV1 } from "./assistance-exchange.js";
import type { PresentationReceipt } from "./presentation-contract.js";
import { parseRegisteredShapeFiringOperands } from "./registered-shape-presentation.js";

export interface GuidedShapeQuery {
  readonly assistance: RequestedAssistanceV1;
  readonly query: Readonly<{ branchId: string; endpointId: string; decisionDigest: string }>;
}
export type GuidedShapeFiringValue = ReturnType<typeof parseRegisteredShapeFiringOperands>;
export interface GuidedShapePage {
  readonly runId: string;
  readonly branchId: string;
  readonly endpointId: string;
  readonly decisionDigest: string;
  readonly effectiveConfigDigest: string;
  readonly sourceKey: string;
  readonly outcome: Readonly<{ kind: "available" | "no_witness" }>
    | Readonly<{ kind: "unavailable"; reason: "authored_source_absent" | "source_dependency_unavailable" }>;
  readonly firings: readonly Readonly<{ value: GuidedShapeFiringValue; presentation: PresentationReceipt }>[];
}
function record(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype
    || Reflect.ownKeys(value).length !== keys.length || keys.some(key => {
      const field = Object.getOwnPropertyDescriptor(value, key); return field === undefined || !field.enumerable || !("value" in field);
    })) throw new TypeError("Guided shape query requires its exact data envelope");
  return value as Record<string, unknown>;
}
export function parseGuidedShapeQuery(value: unknown): GuidedShapeQuery {
  const body = record(value, ["assistance", "query"]), query = record(body.query, ["branchId", "endpointId", "decisionDigest"]);
  for (const key of ["branchId", "endpointId", "decisionDigest"] as const) if (typeof query[key] !== "string" || query[key].trim() === "") throw new TypeError("Guided shape query omitted its subject");
  if (!/^sha256:[a-f0-9]{64}$/u.test(query.decisionDigest as string)) throw new TypeError("Guided shape decision is not a decision digest");
  return Object.freeze({ assistance: parseRequestedAssistanceV1(body.assistance),
    query: Object.freeze({ branchId: query.branchId as string, endpointId: query.endpointId as string, decisionDigest: query.decisionDigest as string }) });
}
