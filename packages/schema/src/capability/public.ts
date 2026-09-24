// rfc/pack-capability-contract.md §4.2 — the one closed wire authority for `GET /capabilities`'
// `packCapabilities`. The server is its sole producer and the web client parses it with exactly this
// function; neither side declares a local lookalike.
//
// Semantic disposition (`active`/`deprecated`) and deployment reachability
// (`supported`/`temporarily_unavailable`) never occupy each other's field. A transient row is only
// lawful for a `provider` capability.

import {
  capabilityKey,
  compareCapabilityIds,
  parseCapabilityRequirement,
  type CapabilityId,
  type CapabilityKey,
} from "./types.js";

export const PACK_CAPABILITIES_PROTOCOL = "tabiya.pack-capabilities" as const;
export const PACK_CAPABILITIES_PROTOCOL_VERSION = 1 as const;
export const PUBLIC_PROVIDER_FAMILIES = Object.freeze(["opponent", "analysis", "corpus", "tablebase", "voice", "tts"] as const);
export const PUBLIC_AVAILABILITY_MODES = Object.freeze(["local", "recorded", "provider", "build_time"] as const);
export const PUBLIC_DEPRECATION_REASONS = Object.freeze(["superseded", "scheduled_withdrawal"] as const);

export type PublicProviderFamily = (typeof PUBLIC_PROVIDER_FAMILIES)[number];
export type PublicAvailabilityMode = (typeof PUBLIC_AVAILABILITY_MODES)[number];

export type PublicCapabilitySemanticDispositionV1 =
  | { readonly kind: "active" }
  | { readonly kind: "deprecated"; readonly successor: CapabilityId; readonly reasonCode: (typeof PUBLIC_DEPRECATION_REASONS)[number] };

export type PublicCapabilityReachabilityV1 =
  | { readonly kind: "supported" }
  | { readonly kind: "temporarily_unavailable"; readonly providerFamily: PublicProviderFamily; readonly retryAfterMs?: number };

export interface PackCapabilityPublicRowV1 {
  readonly capability: CapabilityId;
  readonly semanticDisposition: PublicCapabilitySemanticDispositionV1;
  readonly availability: PublicAvailabilityMode;
  readonly reachability: PublicCapabilityReachabilityV1;
}

export interface PackCapabilitiesPublicProjectionV1 {
  readonly protocol: typeof PACK_CAPABILITIES_PROTOCOL;
  readonly protocolVersion: typeof PACK_CAPABILITIES_PROTOCOL_VERSION;
  readonly rows: readonly PackCapabilityPublicRowV1[];
}

export class PackCapabilitiesProjectionError extends TypeError {
  constructor(message: string) {
    super(`PACK_CAPABILITIES_PROJECTION_INVALID: ${message}`);
  }
}

type JsonObject = Readonly<Record<string, unknown>>;
const isObject = (value: unknown): value is JsonObject => typeof value === "object" && value !== null && !Array.isArray(value);

function exactKeys(value: JsonObject, required: readonly string[], optional: readonly string[], where: string): void {
  for (const key of required) if (!Object.hasOwn(value, key)) throw new PackCapabilitiesProjectionError(`${where} is missing ${key}`);
  for (const key of Object.keys(value)) if (!required.includes(key) && !optional.includes(key)) throw new PackCapabilitiesProjectionError(`${where} carries unknown field ${key}`);
}

function parseSemantic(value: unknown, where: string): PublicCapabilitySemanticDispositionV1 {
  if (!isObject(value)) throw new PackCapabilitiesProjectionError(`${where} is not an object`);
  if (value.kind === "active") {
    exactKeys(value, ["kind"], [], where);
    return Object.freeze({ kind: "active" });
  }
  if (value.kind === "deprecated") {
    exactKeys(value, ["kind", "successor", "reasonCode"], [], where);
    if (!(PUBLIC_DEPRECATION_REASONS as readonly unknown[]).includes(value.reasonCode)) throw new PackCapabilitiesProjectionError(`${where}.reasonCode is not a public reason code`);
    return Object.freeze({ kind: "deprecated", successor: parseCapabilityRequirement(value.successor), reasonCode: value.reasonCode as (typeof PUBLIC_DEPRECATION_REASONS)[number] });
  }
  throw new PackCapabilitiesProjectionError(`${where}.kind ${JSON.stringify(value.kind)} is not a published semantic disposition`);
}

function parseReachability(value: unknown, availability: PublicAvailabilityMode, where: string): PublicCapabilityReachabilityV1 {
  if (!isObject(value)) throw new PackCapabilitiesProjectionError(`${where} is not an object`);
  if (value.kind === "supported") {
    exactKeys(value, ["kind"], [], where);
    return Object.freeze({ kind: "supported" });
  }
  if (value.kind === "temporarily_unavailable") {
    exactKeys(value, ["kind", "providerFamily"], ["retryAfterMs"], where);
    if (availability !== "provider") throw new PackCapabilitiesProjectionError(`${where}: only a provider capability can be temporarily unavailable (availability ${availability})`);
    if (!(PUBLIC_PROVIDER_FAMILIES as readonly unknown[]).includes(value.providerFamily)) throw new PackCapabilitiesProjectionError(`${where}.providerFamily is not a public provider family`);
    if (value.retryAfterMs !== undefined && (typeof value.retryAfterMs !== "number" || !Number.isSafeInteger(value.retryAfterMs) || value.retryAfterMs < 0)) {
      throw new PackCapabilitiesProjectionError(`${where}.retryAfterMs is not a non-negative integer`);
    }
    return Object.freeze({
      kind: "temporarily_unavailable",
      providerFamily: value.providerFamily as PublicProviderFamily,
      ...(value.retryAfterMs === undefined ? {} : { retryAfterMs: value.retryAfterMs as number }),
    });
  }
  throw new PackCapabilitiesProjectionError(`${where}.kind ${JSON.stringify(value.kind)} is not a deployment reachability`);
}

/**
 * Parses the published projection. Rejects unknown/missing fields, versions and enum members,
 * duplicates, non-canonical order, a transient non-provider row and a successor absent from the
 * published set.
 */
export function parsePackCapabilitiesPublicProjectionV1(value: unknown): PackCapabilitiesPublicProjectionV1 {
  if (!isObject(value)) throw new PackCapabilitiesProjectionError("projection is not an object");
  exactKeys(value, ["protocol", "protocolVersion", "rows"], [], "projection");
  if (value.protocol !== PACK_CAPABILITIES_PROTOCOL) throw new PackCapabilitiesProjectionError(`unknown protocol ${JSON.stringify(value.protocol)}`);
  if (value.protocolVersion !== PACK_CAPABILITIES_PROTOCOL_VERSION) throw new PackCapabilitiesProjectionError(`unsupported protocolVersion ${JSON.stringify(value.protocolVersion)}`);
  if (!Array.isArray(value.rows)) throw new PackCapabilitiesProjectionError("rows is not an array");
  const rows = value.rows.map((row, index): PackCapabilityPublicRowV1 => {
    const where = `rows/${index}`;
    if (!isObject(row)) throw new PackCapabilitiesProjectionError(`${where} is not an object`);
    exactKeys(row, ["capability", "semanticDisposition", "availability", "reachability"], [], where);
    if (!(PUBLIC_AVAILABILITY_MODES as readonly unknown[]).includes(row.availability)) throw new PackCapabilitiesProjectionError(`${where}.availability is not a public availability mode`);
    const availability = row.availability as PublicAvailabilityMode;
    return Object.freeze({
      capability: parseCapabilityRequirement(row.capability),
      semanticDisposition: parseSemantic(row.semanticDisposition, `${where}.semanticDisposition`),
      availability,
      reachability: parseReachability(row.reachability, availability, `${where}.reachability`),
    });
  });
  const keys = new Set<CapabilityKey>();
  rows.forEach((row, index) => {
    const key = capabilityKey(row.capability);
    if (keys.has(key)) throw new PackCapabilitiesProjectionError(`rows/${index} duplicates ${key}`);
    keys.add(key);
    if (index > 0 && compareCapabilityIds(rows[index - 1]!.capability, row.capability) >= 0) throw new PackCapabilitiesProjectionError(`rows/${index} is out of canonical order`);
  });
  for (const [index, row] of rows.entries()) {
    if (row.semanticDisposition.kind === "deprecated" && !keys.has(capabilityKey(row.semanticDisposition.successor))) {
      throw new PackCapabilitiesProjectionError(`rows/${index} names successor ${capabilityKey(row.semanticDisposition.successor)} absent from the published set`);
    }
  }
  return Object.freeze({ protocol: PACK_CAPABILITIES_PROTOCOL, protocolVersion: PACK_CAPABILITIES_PROTOCOL_VERSION, rows: Object.freeze(rows) });
}
