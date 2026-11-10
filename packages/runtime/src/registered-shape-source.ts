// F2 §2.4a: domain-specific registered document authority. No server imports or wire constructor.
import { digestShapeEntry, type ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import { canonicalProviderJson } from "./provider-digest.js";
import { isImmutableOwnData } from "./internal/immutable-data.js";

export interface RegisteredShapeRecordImage {
  readonly recordIdentity: object;
  readonly document: ShapeEntryDefinition;
  readonly digest: string;
  readonly summary: Readonly<{ id: string; version: string; digest: string }>;
  readonly channel: "official" | "community";
  readonly publisherHandle: string | null;
}
export interface RegisteredShapeRegistryReader {
  capture(signal: AbortSignal): Promise<readonly RegisteredShapeRecordImage[]>;
  current(): readonly RegisteredShapeRecordImage[];
}
declare const registeredShapeSourceBrand: unique symbol;
export interface RegisteredShapeSource { readonly [registeredShapeSourceBrand]: true }
const SOURCES = new WeakMap<object, { readonly records: readonly RegisteredShapeRecordImage[]; readonly assertCurrent: () => void }>();
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => value !== null && typeof value === "object"
  && Object.getPrototypeOf(value) === Object.prototype && Reflect.ownKeys(value).length === keys.length
  && keys.every(key => { const field = Object.getOwnPropertyDescriptor(value, key); return field !== undefined && field.enumerable && "value" in field; });
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
}
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

/** Own JSON before an await; never clone/freeze the original registry identity. */
export function snapshotRegisteredShapeRecords(rows: readonly RegisteredShapeRecordImage[]): readonly RegisteredShapeRecordImage[] {
  if (!Array.isArray(rows) || Array.from({ length: rows.length }, (_, index) => !Object.hasOwn(rows, index)).some(Boolean)) throw new TypeError("Registered shape population is not a complete array");
  const ids = new Set<string>();
  return Object.freeze(rows.map((row: RegisteredShapeRecordImage) => {
    if (!exact(row, ["recordIdentity", "document", "digest", "summary", "channel", "publisherHandle"])
      || row.recordIdentity === null || typeof row.recordIdentity !== "object" || !exact(row.summary, ["id", "version", "digest"])
      || !/^sha256:[a-f0-9]{64}$/u.test(row.digest) || !["official", "community"].includes(row.channel)
      || row.publisherHandle !== null && !text(row.publisherHandle)) throw new TypeError("Registered shape record has invalid identity/metadata");
    const document = freeze(JSON.parse(canonicalProviderJson(row.document)) as ShapeEntryDefinition);
    if (!text(document.id) || !text(document.version) || !text(document.name) || document.trigger === null || typeof document.trigger !== "object"
      || row.summary.id !== document.id || row.summary.version !== document.version || row.summary.digest !== row.digest || ids.has(document.id)) throw new TypeError("Registered shape document/summary/population disagree");
    ids.add(document.id);
    return Object.freeze({ recordIdentity: row.recordIdentity, document, digest: row.digest,
      summary: Object.freeze({ ...row.summary }), channel: row.channel, publisherHandle: row.publisherHandle });
  }));
}
/** Encode full owned source data explicitly, never opaque identities as {}. */
export function registeredShapeRecordsImage(records: readonly RegisteredShapeRecordImage[]) {
  return Object.freeze(records.map(({ document, digest, summary, channel, publisherHandle }) => Object.freeze({ document, digest, summary, channel, publisherHandle })));
}
const IMMUTABLE_RECORD_IMAGES = new WeakMap<object, readonly RegisteredShapeRecordImage[]>();
interface PhysicalShapeRecord {
  readonly document: ShapeEntryDefinition; readonly digest: string;
  readonly summary: Readonly<{ id: string; version: string; digest: string }>;
  readonly channel: "official" | "community"; readonly publisherHandle?: string;
}
function sameRecordProjection(row: RegisteredShapeRecordImage, expected: RegisteredShapeRecordImage): boolean {
  return exact(row, ["recordIdentity", "document", "digest", "summary", "channel", "publisherHandle"])
    && exact(row.summary, ["id", "version", "digest"])
    && row.recordIdentity === expected.recordIdentity && row.digest === expected.digest
    && row.summary.id === expected.summary.id && row.summary.version === expected.summary.version && row.summary.digest === expected.summary.digest
    && row.channel === expected.channel && row.publisherHandle === expected.publisherHandle;
}
/** Verify snapshot bytes against the actual frozen record once; this is not admission. */
function immutableRecordImages(records: readonly RegisteredShapeRecordImage[]): readonly RegisteredShapeRecordImage[] | undefined {
  const cached = IMMUTABLE_RECORD_IMAGES.get(records);
  if (cached !== undefined) return cached;
  if (!isImmutableOwnData(records)) return undefined;
  // Opaque test/alternate readers need not expose a physical record; keep their full byte check.
  for (const row of records) {
    const record = row.recordIdentity as Partial<PhysicalShapeRecord>;
    if (record.document === null || typeof record.document !== "object" || record.summary === null || typeof record.summary !== "object") return undefined;
  }
  const checked = snapshotRegisteredShapeRecords(records), images: RegisteredShapeRecordImage[] = [];
  for (const row of checked) {
    const record = row.recordIdentity as PhysicalShapeRecord;
    const expected = Object.freeze({ recordIdentity: row.recordIdentity, document: record.document, digest: record.digest,
      summary: Object.freeze({ id: record.summary.id, version: record.summary.version, digest: record.summary.digest }),
      channel: record.channel, publisherHandle: record.publisherHandle ?? null });
    if (!sameRecordProjection(row, expected) || canonicalProviderJson(row.document) !== canonicalProviderJson(record.document)) return undefined;
    images.push(expected);
  }
  const image = Object.freeze(images); IMMUTABLE_RECORD_IMAGES.set(records, image); return image;
}
export function assertRegisteredShapeRecordsCurrent(records: readonly RegisteredShapeRecordImage[], current: readonly RegisteredShapeRecordImage[]): void {
  const immutable = immutableRecordImages(records);
  if (immutable !== undefined && Array.isArray(current) && current.length === immutable.length) {
    let equal = true;
    for (let index = 0; index < immutable.length; index++) {
      if (!Object.hasOwn(current, index) || !sameRecordProjection(current[index]!, immutable[index]!) || current[index]!.document !== immutable[index]!.document) { equal = false; break; }
    }
    if (equal) return;
  }
  const now = snapshotRegisteredShapeRecords(current);
  if (now.length !== records.length || now.some((row, index) => row.recordIdentity !== records[index]!.recordIdentity)
    || canonicalProviderJson(registeredShapeRecordsImage(now)) !== canonicalProviderJson(registeredShapeRecordsImage(records))) throw new TypeError("Registered shape source is no longer current");
}

/** Sole production composition: the actual server ShapeRegistry's concrete record reader. */
export function createRegisteredShapeSourceOwner(reader: RegisteredShapeRegistryReader) {
  const owned = new WeakSet<object>();
  return Object.freeze({
    async capture(signal: AbortSignal): Promise<RegisteredShapeSource> {
      if (!(signal instanceof AbortSignal)) throw new TypeError("Registered shape capture requires an AbortSignal");
      signal.throwIfAborted();
      const records = snapshotRegisteredShapeRecords(await reader.capture(signal)); signal.throwIfAborted();
      const current = () => assertRegisteredShapeRecordsCurrent(records, reader.current());
      current();
      for (const row of records) {
        const digest = await digestShapeEntry(row.document); signal.throwIfAborted(); current();
        if (digest !== row.digest) throw new TypeError("Registered shape document digest mismatch");
      }
      current(); signal.throwIfAborted();
      const source = Object.freeze({}) as RegisteredShapeSource;
      SOURCES.set(source, Object.freeze({ records, assertCurrent: current })); owned.add(source); return source;
    },
    assertCurrent(source: RegisteredShapeSource): void {
      if (!owned.has(source)) throw new TypeError("Registered shape source belongs to a foreign registry");
      readRegisteredShapeSource(source);
    },
  });
}

export function readRegisteredShapeSource(source: RegisteredShapeSource): readonly RegisteredShapeRecordImage[] {
  const data = source !== null && typeof source === "object" ? SOURCES.get(source) : undefined;
  if (data === undefined) throw new TypeError("Registered shape source was not issued by its owner");
  data.assertCurrent(); return data.records;
}
