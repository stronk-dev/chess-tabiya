// F2 §2.4b. Concrete ShapeRegistry composition only; no browser/wire issuer or evaluator callback.
import { evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "../evidence-contract.js";
import { canonicalFen, positionFromFen } from "../position-cache.js";
import type { ExactLegalMoveMap } from "../legal-moves.js";
import { prepareRegisteredShapePredicatePreflight, assertRegisteredShapePredicatePreflight,
  captureRegisteredShapePredicatePopulation, readAuthoredPredicatePopulation,
  type AuthoredPredicatePopulation, type RegisteredShapePredicatePreflight } from "../authored-predicate-population.js";
import { readRegisteredShapeSource, registeredShapeRecordsImage, type RegisteredShapeSource, type RegisteredShapeRecordImage } from "../registered-shape-source.js";
import { assertRegisteredShapeTriggerSource, type AuthoredStructuralConditionSource } from "./authored-structural-source.js";
import { invokeEvidenceValueRoute, readAuthoredStructuralInput } from "./evidence-value-routes.js";

export type RegisteredShapePath = readonly Readonly<{ id: string; fen: string }>[];
declare const builderBrand: unique symbol;
export interface RegisteredShapeScanBuilder { readonly [builderBrand]: true }
declare const scanBrand: unique symbol;
export interface RegisteredShapeScan { readonly [scanBrand]: true }
/** Domain reader, implemented only by the actual server ShapeRegistry. */
export interface RegisteredShapeScanRegistry {
  capture(signal: AbortSignal): Promise<RegisteredShapeSource>;
  assertCurrent(source: RegisteredShapeSource): void;
  trigger(recordIdentity: object): AuthoredStructuralConditionSource;
}
interface Row {
  readonly record: RegisteredShapeRecordImage;
  readonly trigger: AuthoredStructuralConditionSource;
  readonly cells: readonly AuthoredPredicatePopulation[];
  readonly cellDigests: readonly string[];
}
interface ScanData {
  readonly source: RegisteredShapeSource;
  readonly path: RegisteredShapePath;
  readonly roots: readonly DeclaredEvidence<ExactLegalMoveMap>[];
  readonly rows: readonly Row[];
  readonly image: Readonly<{ records: ReturnType<typeof registeredShapeRecordsImage>; path: RegisteredShapePath; cells: readonly (readonly string[])[] }>;
  readonly inputDigest: string;
  readonly assertCurrent: () => void;
}
const SCANS = new WeakMap<object, ScanData>();
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child); Object.freeze(value);
  }
  return value;
}
export function registeredShapeReceiptImage(value: DeclaredEvidence<unknown>) {
  return Object.freeze({ producer: value.producer, projection: value.projection, receipt: evidenceValueReceipt(value) });
}
function cellImage(value: AuthoredPredicatePopulation) {
  const data = readAuthoredPredicatePopulation(value);
  return { observation: data.observation, condition: registeredShapeReceiptImage(data.condition),
    position: registeredShapeReceiptImage(data.position), leaves: data.leaves.map(row => ({ path: row.path, value: registeredShapeReceiptImage(row.value) })) };
}
function capturePath(path: RegisteredShapePath): RegisteredShapePath {
  if (!Array.isArray(path) || Object.getPrototypeOf(path) !== Array.prototype || path.length === 0
    || Reflect.ownKeys(path).length !== path.length + 1) throw new TypeError("Shape scan requires a complete ordinary path");
  const ids = new Set<string>();
  return Object.freeze(Array.from({ length: path.length }, (_, index) => {
    const field = Object.getOwnPropertyDescriptor(path, index);
    if (field === undefined || !("value" in field) || !field.enumerable) throw new TypeError("Shape path member is not own data");
    const node: unknown = field.value;
    if (node === null || typeof node !== "object" || Object.getPrototypeOf(node) !== Object.prototype
      || Reflect.ownKeys(node).length !== 2) throw new TypeError("Shape node must be exactly id/FEN");
    const id = Object.getOwnPropertyDescriptor(node, "id"), fen = Object.getOwnPropertyDescriptor(node, "fen");
    if (id === undefined || fen === undefined || !("value" in id) || !("value" in fen) || !id.enumerable || !fen.enumerable
      || typeof id.value !== "string" || id.value.trim() === "" || ids.has(id.value) || typeof fen.value !== "string"
      || canonicalFen(positionFromFen(fen.value)) !== fen.value) throw new TypeError("Shape node has invalid identity or canonical FEN");
    ids.add(id.value); return Object.freeze({ id: id.value, fen: fen.value });
  }));
}
export class RegisteredShapeScanUnavailable extends Error {
  readonly reason = "source_dependency_unavailable";
  constructor() { super("Registered shape scan has an unavailable visited dependency"); }
}
interface BuilderData {
  readonly source: RegisteredShapeSource;
  readonly path: RegisteredShapePath;
  readonly signal: AbortSignal;
  readonly preflight: RegisteredShapePredicatePreflight;
  readonly records: readonly RegisteredShapeRecordImage[];
  readonly triggers: readonly AuthoredStructuralConditionSource[];
  readonly roots: DeclaredEvidence<ExactLegalMoveMap>[];
  readonly rows: AuthoredPredicatePopulation[][];
  readonly cellDigests: string[][];
  nextCell: number;
  failed: boolean;
  completed?: RegisteredShapeScan;
}

/** The application drives chunks and checks its own current context around every yield. */
export function createRegisteredShapeScanOwner(registry: RegisteredShapeScanRegistry) {
  const builders = new WeakMap<object, BuilderData>(), ownedScans = new WeakSet<object>();
  const assert = (data: BuilderData) => {
    data.signal.throwIfAborted();
    if (data.failed) throw new TypeError("Shape scan already failed");
    registry.assertCurrent(data.source); assertRegisteredShapePredicatePreflight(data.preflight);
    for (const [index, record] of data.records.entries()) assertRegisteredShapeTriggerSource(data.triggers[index]!, record);
  };
  return Object.freeze({
    async begin(path: RegisteredShapePath, signal: AbortSignal): Promise<RegisteredShapeScanBuilder> {
      if (!(signal instanceof AbortSignal)) throw new TypeError("Shape scan requires an AbortSignal");
      signal.throwIfAborted(); const nodes = capturePath(path);
      const source = await registry.capture(signal); signal.throwIfAborted(); registry.assertCurrent(source);
      const records = readRegisteredShapeSource(source);
      if (records.some((row, index) => index > 0 && records[index - 1]!.document.id.localeCompare(row.document.id) >= 0)) throw new TypeError("Shape source is not in stable unique entry order");
      const triggers = records.map(row => {
        const trigger = registry.trigger(row.recordIdentity); assertRegisteredShapeTriggerSource(trigger, row); return trigger;
      });
      const data: BuilderData = { source, path: nodes, signal, preflight: prepareRegisteredShapePredicatePreflight(), records,
        triggers: Object.freeze(triggers), roots: [], rows: records.map(() => []), cellDigests: records.map(() => []), nextCell: 0, failed: false };
      assert(data); const builder = Object.freeze({}) as RegisteredShapeScanBuilder; builders.set(builder, data); return builder;
    },
    source(builder: RegisteredShapeScanBuilder): RegisteredShapeSource {
      const data = builders.get(builder);
      if (data === undefined) throw new TypeError("Shape scan builder belongs to another owner");
      assert(data); return data.source;
    },
    advance(builder: RegisteredShapeScanBuilder): Readonly<{ kind: "incomplete" } | { kind: "complete"; scan: RegisteredShapeScan }> {
      const data = builders.get(builder);
      if (data === undefined) throw new TypeError("Shape scan builder belongs to another owner");
      assert(data);
      if (data.completed !== undefined) return Object.freeze({ kind: "complete", scan: data.completed });
      const started = performance.now(), total = data.records.length * data.path.length;
      try {
        for (let count = 0; data.nextCell < total && count < 32; count++) {
          data.signal.throwIfAborted();
          const shape = Math.floor(data.nextCell / data.path.length), node = data.nextCell % data.path.length;
          const root = data.roots[node] ??= invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: data.path[node]!.fen });
          const result = captureRegisteredShapePredicatePopulation(data.triggers[shape]!, root, data.preflight);
          if (result.kind !== "available") throw new RegisteredShapeScanUnavailable();
          const cell = readAuthoredPredicatePopulation(result.value);
          assertRegisteredShapeTriggerSource(data.triggers[shape]!, data.records[shape]!);
          if (cell.position !== root || readAuthoredStructuralInput(cell.condition) !== data.triggers[shape]
            || cell.observation.policy !== "predicate" || cell.observation.fen !== data.path[node]!.fen) throw new TypeError("Shape cell crosses its original condition/node/root/policy");
          data.rows[shape]!.push(result.value); data.cellDigests[shape]!.push(evidenceDigest(cellImage(result.value))); data.nextCell++;
          if (performance.now() - started >= 8) break;
        }
        assert(data);
        if (data.nextCell !== total) return Object.freeze({ kind: "incomplete" });
        const rows = Object.freeze(data.records.map((record, index) => Object.freeze({ record, trigger: data.triggers[index]!,
          cells: Object.freeze(data.rows[index]!), cellDigests: Object.freeze(data.cellDigests[index]!) })));
        // Whole-image hashing/complete-population verification belongs to synchronous mint/read,
        // not to this finite evaluation chunk. These owned immutable bytes are computed once.
        let image: ScanData["image"] | undefined, inputDigest: string | undefined;
        const sourceImage = () => image ??= freeze({ records: registeredShapeRecordsImage(data.records), path: data.path, cells: rows.map(row => row.cellDigests) });
        const scan = Object.freeze({}) as RegisteredShapeScan;
        const complete: ScanData = Object.freeze({ source: data.source, path: data.path, roots: Object.freeze(data.roots), rows,
          get image() { return sourceImage(); }, get inputDigest() { return inputDigest ??= evidenceDigest(sourceImage()); }, assertCurrent: () => assert(data) });
        SCANS.set(scan, complete); ownedScans.add(scan); data.completed = scan;
        return Object.freeze({ kind: "complete", scan });
      } catch (error) { data.failed = true; throw error; }
    },
    assertCurrent(scan: RegisteredShapeScan): void {
      if (!ownedScans.has(scan)) throw new TypeError("Shape scan belongs to a foreign registry");
      readRegisteredShapeScan(scan);
    },
  });
}

/** Original complete rectangle, including negative cells and successful empty registries. */
export function readRegisteredShapeScan(scan: RegisteredShapeScan): ScanData {
  const data = scan !== null && typeof scan === "object" ? SCANS.get(scan) : undefined;
  if (data === undefined) throw new TypeError("Shape scan is not an original completed capture");
  data.assertCurrent();
  const records = readRegisteredShapeSource(data.source);
  if (data.rows.length !== records.length) throw new TypeError("Shape scan lost its complete registered population");
  for (const [shape, row] of data.rows.entries()) {
    if (row.record !== records[shape] || row.cells.length !== data.path.length || row.cellDigests.length !== data.path.length) throw new TypeError("Shape scan lost a positive or negative cell");
    assertRegisteredShapeTriggerSource(row.trigger, row.record);
    for (const [index, value] of row.cells.entries()) {
      const cell = readAuthoredPredicatePopulation(value);
      if (cell.position !== data.roots[index] || readAuthoredStructuralInput(cell.condition) !== row.trigger
        || cell.observation.fen !== data.path[index]!.fen || cell.observation.policy !== "predicate") throw new TypeError("Shape scan lost original condition/node membership");
    }
  }
  return data;
}
