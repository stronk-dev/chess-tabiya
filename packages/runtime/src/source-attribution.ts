/**
 * Source-attribution registry (D3107).
 *
 * A versioned registry naming, per attached source projection, the attribution a citation may carry
 * and where each field's value comes from: a literal the registry itself asserts, or a named field of
 * the deployment receipt for the exact artifact that produced the evidence. Receipt metadata is never
 * guessed — a missing or mismatched receipt abstains with `source_attribution_absent`.
 *
 * Identity is issued only for the exact complete semantic image: `parseSourceAttributionRegistryImage`
 * accepts that image alone and brands the frozen value it returns; `sourceAttributionRegistryDigest`
 * refuses anything it did not brand (a partial `{ id, version, rows: [] }`, a spread or a JSON copy).
 */
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

import { sha256Hex } from "./assistance-exchange.js";

export const SOURCE_ATTRIBUTION_REGISTRY_ID = "source-attribution-registry" as const;
export const SOURCE_ATTRIBUTION_REGISTRY_VERSION = 1 as const;
export const SOURCE_ATTRIBUTION_ABSENT_REASON = "source_attribution_absent" as const;
export const SOURCE_ATTRIBUTION_MISSING_METADATA_POLICY = "abstain_source_attribution_absent" as const;
export const SOURCE_ATTRIBUTION_RESOLVER = Object.freeze({
  source: "packages/runtime/src/source-attribution.ts",
  symbol: "resolveSourceAttribution",
} as const);
const DIGEST_DOMAIN = "chess-tabiya/source-attribution-registry@1\u0000";

export const SOURCE_DEPLOYMENT_ARTIFACT_IDS = Object.freeze(["stockfish", "maia_model"] as const);
export type SourceDeploymentArtifactId = (typeof SOURCE_DEPLOYMENT_ARTIFACT_IDS)[number];
export const SOURCE_REMOTE_ENDPOINT_IDS = Object.freeze(["lichess_tablebase"] as const);
export type SourceRemoteEndpointId = (typeof SOURCE_REMOTE_ENDPOINT_IDS)[number];
export const SOURCE_DEPLOYMENT_RECEIPT_FIELDS = Object.freeze(["sha256", "spdx", "model_revision"] as const);
export type SourceDeploymentReceiptField = (typeof SOURCE_DEPLOYMENT_RECEIPT_FIELDS)[number];

export type SourceMetadataAuthority =
  | { readonly kind: "deployment_artifact"; readonly artifactId: SourceDeploymentArtifactId }
  | { readonly kind: "remote_endpoint"; readonly endpointId: SourceRemoteEndpointId };

/** A typed field resolver: a literal the registry asserts, or a named deployment-receipt field. */
export type SourceAttributionFieldResolver =
  | { readonly kind: "literal"; readonly value: string }
  | { readonly kind: "deployment_receipt"; readonly field: SourceDeploymentReceiptField };

export interface SourceAttributionRegistryRow {
  readonly sourceProjection: string;
  readonly metadataAuthority: SourceMetadataAuthority;
  readonly attribution: {
    readonly source: string;
    readonly title: string;
    readonly locator: string;
    readonly licence: SourceAttributionFieldResolver;
    readonly url?: string;
    readonly revision: SourceAttributionFieldResolver;
  };
  readonly unresolvedMetadata: typeof SOURCE_ATTRIBUTION_MISSING_METADATA_POLICY;
}

export interface SourceAttributionRegistryImage {
  readonly id: typeof SOURCE_ATTRIBUTION_REGISTRY_ID;
  readonly version: typeof SOURCE_ATTRIBUTION_REGISTRY_VERSION;
  readonly resolver: typeof SOURCE_ATTRIBUTION_RESOLVER;
  readonly rows: readonly SourceAttributionRegistryRow[];
  readonly missingReceiptField: typeof SOURCE_ATTRIBUTION_MISSING_METADATA_POLICY;
}

declare const parsedImageBrand: unique symbol;
/** A registry image this process parsed; only these values receive an identity digest. */
export type ParsedSourceAttributionRegistryImage = SourceAttributionRegistryImage & { readonly [parsedImageBrand]: true };

const PARSED_IMAGES = new WeakSet<object>();

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  const prototype = Object.getPrototypeOf(value) as unknown;
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, required: readonly string[], label: string, optional: readonly string[] = []): void {
  const keys = Reflect.ownKeys(value);
  for (const key of keys) {
    if (typeof key !== "string" || (!required.includes(key) && !optional.includes(key))) throw new TypeError(`${label} has unregistered key ${String(key)}`);
  }
  for (const key of required) if (!Object.hasOwn(value, key)) throw new TypeError(`${label} is missing ${key}`);
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0 || value !== value.trim()) throw new TypeError(`${label} must be a non-empty trimmed string`);
  return value;
}

function oneOf<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== "string" || !(values as readonly string[]).includes(value)) throw new TypeError(`${label} must be one of ${values.join(", ")}`);
  return value as T;
}

function parseMetadataAuthority(value: unknown, label: string): SourceMetadataAuthority {
  const item = record(value, label);
  const kind = oneOf(item.kind, ["deployment_artifact", "remote_endpoint"] as const, `${label}.kind`);
  if (kind === "deployment_artifact") {
    exactKeys(item, ["kind", "artifactId"], label);
    return Object.freeze({ kind, artifactId: oneOf(item.artifactId, SOURCE_DEPLOYMENT_ARTIFACT_IDS, `${label}.artifactId`) });
  }
  exactKeys(item, ["kind", "endpointId"], label);
  return Object.freeze({ kind, endpointId: oneOf(item.endpointId, SOURCE_REMOTE_ENDPOINT_IDS, `${label}.endpointId`) });
}

function parseResolver(value: unknown, label: string, authority: SourceMetadataAuthority): SourceAttributionFieldResolver {
  const item = record(value, label);
  const kind = oneOf(item.kind, ["literal", "deployment_receipt"] as const, `${label}.kind`);
  if (kind === "literal") {
    exactKeys(item, ["kind", "value"], label);
    return Object.freeze({ kind, value: text(item.value, `${label}.value`) });
  }
  exactKeys(item, ["kind", "field"], label);
  if (authority.kind !== "deployment_artifact") throw new TypeError(`${label} reads a deployment receipt for a source without a deployment artifact`);
  return Object.freeze({ kind, field: oneOf(item.field, SOURCE_DEPLOYMENT_RECEIPT_FIELDS, `${label}.field`) });
}

function parseRow(value: unknown, label: string): SourceAttributionRegistryRow {
  const item = record(value, label);
  exactKeys(item, ["sourceProjection", "metadataAuthority", "attribution", "unresolvedMetadata"], label);
  const sourceProjection = text(item.sourceProjection, `${label}.sourceProjection`);
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+@[1-9][0-9]*$/u.test(sourceProjection)) throw new TypeError(`${label}.sourceProjection must be a versioned projection id`);
  const metadataAuthority = parseMetadataAuthority(item.metadataAuthority, `${label}.metadataAuthority`);
  const attribution = record(item.attribution, `${label}.attribution`);
  exactKeys(attribution, ["source", "title", "locator", "licence", "revision"], `${label}.attribution`, ["url"]);
  const url = attribution.url === undefined ? undefined : text(attribution.url, `${label}.attribution.url`);
  if (url !== undefined && !/^https:\/\/[^\s]+$/u.test(url)) throw new TypeError(`${label}.attribution.url must be an https URL`);
  if (item.unresolvedMetadata !== SOURCE_ATTRIBUTION_MISSING_METADATA_POLICY) throw new TypeError(`${label}.unresolvedMetadata must be ${SOURCE_ATTRIBUTION_MISSING_METADATA_POLICY}`);
  return Object.freeze({
    sourceProjection,
    metadataAuthority,
    attribution: Object.freeze({
      source: text(attribution.source, `${label}.attribution.source`),
      title: text(attribution.title, `${label}.attribution.title`),
      locator: text(attribution.locator, `${label}.attribution.locator`),
      licence: parseResolver(attribution.licence, `${label}.attribution.licence`, metadataAuthority),
      ...(url === undefined ? {} : { url }),
      revision: parseResolver(attribution.revision, `${label}.attribution.revision`, metadataAuthority),
    }),
    unresolvedMetadata: SOURCE_ATTRIBUTION_MISSING_METADATA_POLICY,
  });
}

/**
 * Parse the exact complete semantic image of the source-attribution registry: exact keys at every
 * level, the registered id/version/resolver/policy, and a non-empty set of unique rows. The result is
 * a fresh deep-frozen value branded for this process; nothing else receives an identity.
 */
export function parseSourceAttributionRegistryImage(value: unknown): ParsedSourceAttributionRegistryImage {
  const item = record(value, "source attribution registry");
  exactKeys(item, ["id", "version", "resolver", "rows", "missingReceiptField"], "source attribution registry");
  if (item.id !== SOURCE_ATTRIBUTION_REGISTRY_ID) throw new TypeError(`source attribution registry id must be ${SOURCE_ATTRIBUTION_REGISTRY_ID}`);
  if (item.version !== SOURCE_ATTRIBUTION_REGISTRY_VERSION) throw new TypeError(`source attribution registry version must be ${SOURCE_ATTRIBUTION_REGISTRY_VERSION}`);
  const resolver = record(item.resolver, "source attribution registry resolver");
  exactKeys(resolver, ["source", "symbol"], "source attribution registry resolver");
  if (resolver.source !== SOURCE_ATTRIBUTION_RESOLVER.source || resolver.symbol !== SOURCE_ATTRIBUTION_RESOLVER.symbol) {
    throw new TypeError("source attribution registry names an unknown resolver");
  }
  if (item.missingReceiptField !== SOURCE_ATTRIBUTION_MISSING_METADATA_POLICY) throw new TypeError("source attribution registry names an unknown missing-metadata policy");
  if (!Array.isArray(item.rows) || item.rows.length === 0) throw new TypeError("source attribution registry rows must be a non-empty array");
  const rows = item.rows.map((row, index) => parseRow(row, `source attribution registry rows[${index}]`));
  const projections = new Set(rows.map((row) => row.sourceProjection));
  if (projections.size !== rows.length) throw new TypeError("source attribution registry rows must name each source projection once");
  const image = Object.freeze({
    id: SOURCE_ATTRIBUTION_REGISTRY_ID,
    version: SOURCE_ATTRIBUTION_REGISTRY_VERSION,
    resolver: SOURCE_ATTRIBUTION_RESOLVER,
    rows: Object.freeze(rows),
    missingReceiptField: SOURCE_ATTRIBUTION_MISSING_METADATA_POLICY,
  });
  // canonicalizeJson refuses values that have no canonical JSON (lone surrogates, non-finite numbers).
  canonicalizeJson(image);
  PARSED_IMAGES.add(image);
  return image as ParsedSourceAttributionRegistryImage;
}

export function isParsedSourceAttributionRegistryImage(value: unknown): value is ParsedSourceAttributionRegistryImage {
  return value !== null && typeof value === "object" && PARSED_IMAGES.has(value);
}

/** Identity of a parsed registry image: domain-separated SHA-256 of its RFC 8785 canonical JSON. */
export function sourceAttributionRegistryDigest(image: ParsedSourceAttributionRegistryImage): string {
  if (!isParsedSourceAttributionRegistryImage(image)) {
    throw new TypeError("source attribution registry digest requires an image returned by parseSourceAttributionRegistryImage");
  }
  return `sha256:${sha256Hex(`${DIGEST_DOMAIN}${canonicalizeJson(image)}`)}`;
}

const stockfishRow = (sourceProjection: string) => ({
  sourceProjection,
  metadataAuthority: { kind: "deployment_artifact", artifactId: "stockfish" },
  attribution: {
    source: "Stockfish",
    title: "Stockfish engine reading",
    locator: "deployment-artifact:stockfish",
    licence: { kind: "literal", value: "GPL-3.0-only" },
    url: "https://stockfishchess.org/",
    revision: { kind: "deployment_receipt", field: "sha256" },
  },
  unresolvedMetadata: SOURCE_ATTRIBUTION_MISSING_METADATA_POLICY,
});

export const SOURCE_ATTRIBUTION_REGISTRY_IMAGE: ParsedSourceAttributionRegistryImage = parseSourceAttributionRegistryImage({
  id: SOURCE_ATTRIBUTION_REGISTRY_ID,
  version: SOURCE_ATTRIBUTION_REGISTRY_VERSION,
  resolver: { ...SOURCE_ATTRIBUTION_RESOLVER },
  rows: [
    stockfishRow("live.stockfish.eval@1"),
    stockfishRow("live.stockfish.wdl@1"),
    stockfishRow("live.stockfish.pv@1"),
    {
      sourceProjection: "live.syzygy.result@1",
      metadataAuthority: { kind: "remote_endpoint", endpointId: "lichess_tablebase" },
      attribution: {
        source: "Lichess tablebase API",
        title: "Syzygy tablebase result",
        locator: "https://tablebase.lichess.org/standard",
        licence: { kind: "literal", value: "computed-chess-facts/no-rights-asserted" },
        url: "https://tablebase.lichess.org/",
        revision: { kind: "literal", value: "standard-endpoint-contract@1" },
      },
      unresolvedMetadata: SOURCE_ATTRIBUTION_MISSING_METADATA_POLICY,
    },
    {
      sourceProjection: "human.maia.event@1",
      metadataAuthority: { kind: "deployment_artifact", artifactId: "maia_model" },
      attribution: {
        source: "Maia-3",
        title: "Maia human-move model output",
        locator: "deployment-artifact:maia_model",
        licence: { kind: "deployment_receipt", field: "spdx" },
        url: "https://github.com/CSSLab/maia3",
        revision: { kind: "deployment_receipt", field: "model_revision" },
      },
      unresolvedMetadata: SOURCE_ATTRIBUTION_MISSING_METADATA_POLICY,
    },
  ],
  missingReceiptField: SOURCE_ATTRIBUTION_MISSING_METADATA_POLICY,
});

export const SOURCE_ATTRIBUTION_REGISTRY_RESOURCE = Object.freeze({
  id: SOURCE_ATTRIBUTION_REGISTRY_ID,
  version: SOURCE_ATTRIBUTION_REGISTRY_VERSION,
  digest: sourceAttributionRegistryDigest(SOURCE_ATTRIBUTION_REGISTRY_IMAGE),
});

/** Metadata receipt for the exact source instance that produced a piece of evidence. */
export type SourceAttributionReceipt =
  | {
    readonly kind: "deployment_artifact";
    readonly artifactId: SourceDeploymentArtifactId;
    readonly sha256?: string;
    readonly spdx?: string;
    readonly model_revision?: string;
  }
  | { readonly kind: "remote_endpoint"; readonly endpointId: SourceRemoteEndpointId };

export interface SourceAttributionValue {
  readonly authority: string;
  readonly value: string;
}

export interface ResolvedSourceAttribution {
  readonly kind: "attributed";
  readonly sourceProjection: string;
  readonly registry: typeof SOURCE_ATTRIBUTION_REGISTRY_RESOURCE;
  readonly attribution: {
    readonly source: string;
    readonly title: string;
    readonly locator: string;
    readonly licence: SourceAttributionValue;
    readonly url?: string;
    readonly revision: SourceAttributionValue;
  };
}

export interface AbsentSourceAttribution {
  readonly kind: "absent";
  readonly reason: typeof SOURCE_ATTRIBUTION_ABSENT_REASON;
}

export type SourceAttributionResolution = ResolvedSourceAttribution | AbsentSourceAttribution;

const ABSENT: AbsentSourceAttribution = Object.freeze({ kind: "absent", reason: SOURCE_ATTRIBUTION_ABSENT_REASON });
const REGISTRY_AUTHORITY = `${SOURCE_ATTRIBUTION_REGISTRY_ID}@${SOURCE_ATTRIBUTION_REGISTRY_VERSION}`;
const RECEIPT_AUTHORITY = "deployment-receipt@1";
const SHA256_VALUE = /^sha256:[0-9a-f]{64}$/u;

function receiptMatches(authority: SourceMetadataAuthority, receipt: unknown): receipt is SourceAttributionReceipt {
  if (receipt === null || typeof receipt !== "object" || Array.isArray(receipt)) return false;
  const value = receipt as Record<string, unknown>;
  return authority.kind === "deployment_artifact"
    ? value.kind === "deployment_artifact" && value.artifactId === authority.artifactId
    : value.kind === "remote_endpoint" && value.endpointId === authority.endpointId;
}

function resolveField(resolver: SourceAttributionFieldResolver, receipt: SourceAttributionReceipt): SourceAttributionValue | undefined {
  if (resolver.kind === "literal") return Object.freeze({ authority: REGISTRY_AUTHORITY, value: resolver.value });
  if (receipt.kind !== "deployment_artifact" || !Object.hasOwn(receipt, resolver.field)) return undefined;
  const value = receipt[resolver.field];
  if (typeof value !== "string" || value.trim().length === 0 || value !== value.trim()) return undefined;
  if (resolver.field === "sha256" && !SHA256_VALUE.test(value)) return undefined;
  return Object.freeze({ authority: RECEIPT_AUTHORITY, value });
}

/**
 * Resolve the attribution a citation of `sourceProjection` may carry, from the registry row and the
 * receipt of the exact source instance. An unregistered projection, a missing or mismatched receipt,
 * or a missing/invalid receipt field abstains with `source_attribution_absent`; nothing is guessed.
 */
export function resolveSourceAttribution(sourceProjection: string, receipt: SourceAttributionReceipt | null | undefined): SourceAttributionResolution {
  const row = SOURCE_ATTRIBUTION_REGISTRY_IMAGE.rows.find((candidate) => candidate.sourceProjection === sourceProjection);
  if (row === undefined || !receiptMatches(row.metadataAuthority, receipt)) return ABSENT;
  const licence = resolveField(row.attribution.licence, receipt);
  const revision = resolveField(row.attribution.revision, receipt);
  if (licence === undefined || revision === undefined) return ABSENT;
  return Object.freeze({
    kind: "attributed",
    sourceProjection,
    registry: SOURCE_ATTRIBUTION_REGISTRY_RESOURCE,
    attribution: Object.freeze({
      source: row.attribution.source,
      title: row.attribution.title,
      locator: row.attribution.locator,
      licence,
      ...(row.attribution.url === undefined ? {} : { url: row.attribution.url }),
      revision,
    }),
  });
}
