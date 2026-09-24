// rfc/pack-capability-contract.md §2.1 — one capability namespace, one spelling, the version as data.
//
// A capability names a unit of evaluator meaning a pack can depend on. Its identity is a structured
// `{id, version}` pair; the version is never a suffix inside `id`. Legacy `name@1` / `name@v1` wire
// strings are readable only through `parseLegacyCapability`, which marks them as compatibility
// input rather than authority (§2.1a).

export type CapabilityVersion =
  | { readonly kind: "integer"; readonly value: number }
  | { readonly kind: "semver"; readonly value: string };

export interface CapabilityId {
  readonly id: string;
  readonly version: CapabilityVersion;
}

/** The collision-free internal key `<id>@i:<integer>` or `<id>@s:<semver>`. */
export type CapabilityKey = string & { readonly __capabilityKey: unique symbol };

export const CAPABILITY_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*(?:[.:][A-Za-z0-9][A-Za-z0-9_-]*)*$/u;
export const CAPABILITY_SEMVER_PATTERN = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u;
const LEGACY_PATTERN = /^([A-Za-z][A-Za-z0-9_-]*(?:[.:][A-Za-z0-9][A-Za-z0-9_-]*)*)@(v?)([1-9][0-9]*)$/u;

export type CapabilityErrorCode =
  | "CAPABILITY_ID_INVALID"
  | "CAPABILITY_VERSION_INVALID"
  | "CAPABILITY_LEGACY_INVALID"
  | "CAPABILITY_REQUIREMENT_INVALID"
  | "PACK_CAPABILITY_DUPLICATE"
  | "PACK_CAPABILITY_ORDER";

export class CapabilityError extends TypeError {
  readonly code: CapabilityErrorCode;
  constructor(code: CapabilityErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.code = code;
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isCapabilityIdString(value: unknown): value is string {
  return typeof value === "string" && CAPABILITY_ID_PATTERN.test(value);
}

export function parseCapabilityVersion(value: unknown): CapabilityVersion {
  if (!isRecord(value)) throw new CapabilityError("CAPABILITY_VERSION_INVALID", "a capability version is a {kind, value} object");
  const keys = Object.keys(value).sort();
  if (keys.length !== 2 || keys[0] !== "kind" || keys[1] !== "value") {
    throw new CapabilityError("CAPABILITY_VERSION_INVALID", `a capability version has exactly kind and value; received ${keys.join(", ")}`);
  }
  if (value.kind === "integer") {
    if (typeof value.value !== "number" || !Number.isSafeInteger(value.value) || value.value < 1) {
      throw new CapabilityError("CAPABILITY_VERSION_INVALID", "an integer capability version is a safe integer >= 1");
    }
    return Object.freeze({ kind: "integer", value: value.value });
  }
  if (value.kind === "semver") {
    if (typeof value.value !== "string" || !CAPABILITY_SEMVER_PATTERN.test(value.value)) {
      throw new CapabilityError("CAPABILITY_VERSION_INVALID", "a semver capability version has three numeric components, no leading zero and no prerelease/build arm");
    }
    return Object.freeze({ kind: "semver", value: value.value });
  }
  throw new CapabilityError("CAPABILITY_VERSION_INVALID", `unknown capability version kind ${JSON.stringify(value.kind)}`);
}

/** The structured object form, and only that form (§2.1). */
export function parseCapabilityRequirement(value: unknown): CapabilityId {
  if (!isRecord(value)) throw new CapabilityError("CAPABILITY_REQUIREMENT_INVALID", "a capability requirement is an {id, version} object");
  const keys = Object.keys(value).sort();
  if (keys.length !== 2 || keys[0] !== "id" || keys[1] !== "version") {
    throw new CapabilityError("CAPABILITY_REQUIREMENT_INVALID", `a capability requirement has exactly id and version; received ${keys.join(", ")}`);
  }
  if (!isCapabilityIdString(value.id)) throw new CapabilityError("CAPABILITY_ID_INVALID", `invalid capability id ${JSON.stringify(value.id)}`);
  return Object.freeze({ id: value.id, version: parseCapabilityVersion(value.version) });
}

/** Constructs an integer-arm identity. Never accepts a suffixed id. */
export function capabilityId(id: string, version = 1): CapabilityId {
  if (!isCapabilityIdString(id)) throw new CapabilityError("CAPABILITY_ID_INVALID", `invalid capability id ${JSON.stringify(id)}`);
  return Object.freeze({ id, version: parseCapabilityVersion({ kind: "integer", value: version }) });
}

/** Constructs a semver-arm identity (generated `shape.<id>` / `principle.<id>` capabilities). */
export function semverCapabilityId(id: string, version: string): CapabilityId {
  if (!isCapabilityIdString(id)) throw new CapabilityError("CAPABILITY_ID_INVALID", `invalid capability id ${JSON.stringify(id)}`);
  return Object.freeze({ id, version: parseCapabilityVersion({ kind: "semver", value: version }) });
}

/**
 * Reads exactly the shipped `name@1` / `name@v1` wire forms into an integer arm. A semver suffix,
 * whitespace, a slash, an empty segment or a second `@` is refused rather than guessed.
 */
export function parseLegacyCapability(value: string): CapabilityId {
  const match = LEGACY_PATTERN.exec(value);
  if (match === null) throw new CapabilityError("CAPABILITY_LEGACY_INVALID", `not a legacy capability string: ${JSON.stringify(value)}`);
  return capabilityId(match[1]!, Number(match[3]));
}

/**
 * The one sanctioned way for a test or reader to hold old suffixed bytes (§2.1a): the value is
 * parsed as compatibility input and never becomes authority by assignment.
 */
export function legacyCapabilityFixture(value: string): CapabilityId {
  return parseLegacyCapability(value);
}

export function capabilityKey(value: CapabilityId): CapabilityKey {
  return `${value.id}@${value.version.kind === "integer" ? "i" : "s"}:${value.version.value}` as CapabilityKey;
}

/** Display spelling: the short legacy `id@N` form for an integer arm, `id@semver` otherwise. Never parsed back. */
export function formatCapability(value: CapabilityId): string {
  return `${value.id}@${value.version.value}`;
}

export function capabilityEquals(left: CapabilityId, right: CapabilityId): boolean {
  return left.id === right.id && left.version.kind === right.version.kind && left.version.value === right.version.value;
}

/**
 * Bytewise order of NFC ids. `CAPABILITY_ID_PATTERN` admits ASCII only, where UTF-16 code-unit order
 * equals UTF-8 byte order, so the comparison needs no encoding.
 */
function compareBytes(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function compareCapabilityVersions(left: CapabilityVersion, right: CapabilityVersion): number {
  if (left.kind !== right.kind) return left.kind === "integer" ? -1 : 1;
  if (left.kind === "integer" && right.kind === "integer") return left.value - right.value;
  const a = String(left.value).split(".").map(Number);
  const b = String(right.value).split(".").map(Number);
  for (let index = 0; index < 3; index += 1) if (a[index] !== b[index]) return a[index]! - b[index]!;
  return 0;
}

/** §4.1: bytewise ascending NFC id; integer before semver; integers numerically; semver by component. */
export function compareCapabilityIds(left: CapabilityId, right: CapabilityId): number {
  const byId = compareBytes(left.id, right.id);
  return byId !== 0 ? byId : compareCapabilityVersions(left.version, right.version);
}

/** Canonicalizes a set: sorts and removes exact duplicates. Writers call this before digesting. */
export function canonicalCapabilityRequirements(values: readonly CapabilityId[]): readonly CapabilityId[] {
  const unique = new Map<CapabilityKey, CapabilityId>();
  for (const value of values) unique.set(capabilityKey(value), Object.freeze({ id: value.id, version: Object.freeze({ ...value.version }) }));
  return Object.freeze([...unique.values()].sort(compareCapabilityIds));
}

/**
 * Validates an authored `requires` array at a parse/validation boundary: every row is a structured
 * requirement, no key repeats (`PACK_CAPABILITY_DUPLICATE`) and the order is canonical
 * (`PACK_CAPABILITY_ORDER`). A reordered equivalent set is invalid, never silently accepted.
 */
export function parseCanonicalRequirements(value: unknown): readonly CapabilityId[] {
  if (!Array.isArray(value)) throw new CapabilityError("CAPABILITY_REQUIREMENT_INVALID", "requires must be an array");
  const parsed = value.map(parseCapabilityRequirement);
  const seen = new Set<CapabilityKey>();
  for (const [index, row] of parsed.entries()) {
    const key = capabilityKey(row);
    if (seen.has(key)) throw new CapabilityError("PACK_CAPABILITY_DUPLICATE", `requires/${index} repeats ${key}`);
    seen.add(key);
    if (index > 0 && compareCapabilityIds(parsed[index - 1]!, row) >= 0) {
      throw new CapabilityError("PACK_CAPABILITY_ORDER", `requires/${index} (${key}) is out of canonical order`);
    }
  }
  return Object.freeze(parsed);
}
