// Installed-opening §3/3a prerequisite. This is a paired invocation, NOT the complete history
// source, a factory result-array receipt, a declared evidence value or an access grant.
import type { DeclaredEvidence } from "../evidence-contract.js";
import { readInstalledOpeningLookup, type InstalledOpeningCatalogue } from "../opening-catalogue.js";
import type { RecordedPosition } from "../review-points.js";
import { readRecordedPositionInvocation } from "./evidence-value-routes.js";

declare const lookupBrand: unique symbol;
export interface RecordedOpeningLookup { readonly [lookupBrand]: true }
interface LookupData {
  readonly source: InstalledOpeningCatalogue;
  readonly position: DeclaredEvidence<RecordedPosition>;
  readonly positionInvocation: ReturnType<typeof readRecordedPositionInvocation>;
  readonly lookup: ReturnType<typeof readInstalledOpeningLookup>;
}
const invocations = new WeakMap<object, LookupData>();
const pairs = new WeakMap<InstalledOpeningCatalogue, WeakMap<DeclaredEvidence<RecordedPosition>, RecordedOpeningLookup>>();

/** Only the original admitted source and exact sole-factory position may issue this token. */
export function recordedOpeningLookup(input: Readonly<{ source: InstalledOpeningCatalogue; position: DeclaredEvidence<RecordedPosition> }>): RecordedOpeningLookup {
  if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype
    || Reflect.ownKeys(input).length !== 2 || !["source", "position"].every(key => {
      const descriptor = Object.getOwnPropertyDescriptor(input, key);
      return descriptor !== undefined && descriptor.enumerable && "value" in descriptor;
    })) throw new TypeError("Recorded opening lookup requires exactly {source,position} data fields");
  const { source, position } = input, positionInvocation = readRecordedPositionInvocation(position);
  // Authenticate the source even on a memoized read. A copied handle is never another cache key.
  const retained = pairs.get(source)?.get(position);
  if (retained !== undefined) { readRecordedOpeningLookup(retained, source, position); return retained; }
  const lookup = readInstalledOpeningLookup(source, position.payload.fen, position.payload.ply);
  const value = Object.freeze({}) as RecordedOpeningLookup;
  invocations.set(value, Object.freeze({ source, position, positionInvocation, lookup }));
  let positions = pairs.get(source);
  if (positions === undefined) { positions = new WeakMap(); pairs.set(source, positions); }
  positions.set(position, value);
  return value;
}

/** Exact original source/position membership, including authentic successful negative lookups. */
export function readRecordedOpeningLookup(value: RecordedOpeningLookup, source: InstalledOpeningCatalogue, position: DeclaredEvidence<RecordedPosition>): LookupData {
  const data = value !== null && typeof value === "object" ? invocations.get(value) : undefined;
  if (data === undefined || data.source !== source || data.position !== position
    || data.positionInvocation !== readRecordedPositionInvocation(position)) throw new TypeError("Recorded opening lookup is not its original source/position invocation");
  return data;
}
