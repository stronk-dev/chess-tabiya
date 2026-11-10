// F2 §2.4a / D3833: exact registered documents over the granted point or complete prefix.
import { invokeEvidenceValueRoute, readRegisteredShapeFiringInvocation, readCurrentShapeFiringInvocation, type EvidenceValueRouteResults } from "./internal/evidence-value-routes.js";
import { readRegisteredShapeScan, type RegisteredShapeScan } from "./internal/registered-shape-scan.js";
import { readRegisteredShapeSource, type RegisteredShapeSource } from "./registered-shape-source.js";

export interface InspectorShapeCollection {
  readonly projection: "theory.shapes.firing@2";
  readonly source: RegisteredShapeSource;
  readonly path: readonly Readonly<{ id: string; fen: string }>[];
  readonly result: EvidenceValueRouteResults["theory.shapes.firing@2"];
  readonly proof: ReturnType<typeof readRegisteredShapeFiringInvocation>;
  readonly outcome: Readonly<{ kind: "available"; collected: number }> | Readonly<{ kind: "no_witness" }>;
}
const COLLECTIONS = new WeakSet<object>();
export function readInspectorShapeCollection(collection: InspectorShapeCollection) {
  if (collection === null || typeof collection !== "object" || !COLLECTIONS.has(collection)) throw new TypeError("Inspector shape source lacks its original collection");
  readRegisteredShapeSource(collection.source);
  if (readRegisteredShapeFiringInvocation(collection.result, collection.source, collection.path) !== collection.proof) throw new TypeError("Inspector shape source crosses its original invocation");
  return collection;
}
export function collectInspectorShapeSource(source: RegisteredShapeSource, path: InspectorShapeCollection["path"], signal: AbortSignal): InspectorShapeCollection {
  if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector shape source requires an AbortSignal");
  signal.throwIfAborted(); readRegisteredShapeSource(source);
  const result = invokeEvidenceValueRoute("theory.shapes.firing@2", { source, path });
  const proof = readRegisteredShapeFiringInvocation(result, source, path);
  signal.throwIfAborted();
  const collection = Object.freeze({ projection: "theory.shapes.firing@2" as const, source, path, result, proof,
    outcome: result.length === 0 ? Object.freeze({ kind: "no_witness" as const }) : Object.freeze({ kind: "available" as const, collected: result.length }) });
  COLLECTIONS.add(collection); return readInspectorShapeCollection(collection);
}

export interface CurrentInspectorShapeCollection {
  readonly projection: "theory.shapes.firing@3";
  readonly scan: RegisteredShapeScan;
  readonly source: RegisteredShapeSource;
  readonly path: InspectorShapeCollection["path"];
  readonly result: EvidenceValueRouteResults["theory.shapes.firing@3"];
  readonly proof: ReturnType<typeof readCurrentShapeFiringInvocation>;
  readonly outcome: InspectorShapeCollection["outcome"];
}
const CURRENT_COLLECTIONS = new WeakSet<object>();
export function readCurrentInspectorShapeCollection(collection: CurrentInspectorShapeCollection) {
  if (collection === null || typeof collection !== "object" || !CURRENT_COLLECTIONS.has(collection)) throw new TypeError("Current Inspector shape source lacks original collection");
  const scan = readRegisteredShapeScan(collection.scan);
  if (collection.source !== scan.source || collection.path !== scan.path
    || readCurrentShapeFiringInvocation(collection.result, collection.scan) !== collection.proof) throw new TypeError("Current Inspector shape collection crosses its original scan");
  return collection;
}
export function collectCurrentInspectorShapeSource(scan: RegisteredShapeScan, signal: AbortSignal): CurrentInspectorShapeCollection {
  signal.throwIfAborted(); const source = readRegisteredShapeScan(scan);
  const result = invokeEvidenceValueRoute("theory.shapes.firing@3", { scan });
  const proof = readCurrentShapeFiringInvocation(result, scan); signal.throwIfAborted();
  const collection: CurrentInspectorShapeCollection = Object.freeze({ projection: "theory.shapes.firing@3", scan, source: source.source, path: source.path, result, proof,
    outcome: result.length === 0 ? Object.freeze({ kind: "no_witness" }) : Object.freeze({ kind: "available", collected: result.length }) });
  CURRENT_COLLECTIONS.add(collection); return readCurrentInspectorShapeCollection(collection);
}
