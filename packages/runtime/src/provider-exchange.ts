/**
 * Provider exchange seals, receipts and the durable save/reload boundary
 * (rfc/provider-exchange-and-execution.md §3).
 *
 * This module owns four module-private `WeakSet` seals — acquisition receipts, parsed-payload
 * receipts, deliveries and Syzygy local-domain results. The constructors that add to them are
 * exported only through `PROVIDER_EXCHANGE_AUTHORITY`, whose sole production importer is the
 * server scheduler (`apps/server/src/provider-exchange.ts`; census in `provider-protocol.test.ts`).
 * Every constructor re-derives what it seals: the acquisition recomputes request/response digests
 * and checks the operation/provider/endpoint/identity/generation chain; the payload receipt runs
 * the registered parser over the captured bytes itself, so no caller can pair other bytes with a
 * payload. A plain object, spread clone, JSON round-trip or double-cast never carries a seal.
 *
 * `serializeProviderDelivery` / `parsePersistedProviderDelivery` are the sole durable boundary:
 * the parser closes the stored image, re-normalizes the request, re-runs the operation's parser
 * over the stored bytes, recomputes every registered digest and only then mints fresh seals.
 */
import {
  PROVIDER_DIGEST_PATTERN,
  canonicalProviderJson,
  digestProviderActualImage,
  digestProviderPayload,
  digestProviderPending,
  digestProviderRequestImage,
  digestProviderResponse,
  digestProviderRetained,
  providerBase64,
  providerBase64Decode,
  type ProviderActualDigest,
  type ProviderCacheIdentity,
  type ProviderPendingDigest,
  type ProviderRequestDigest,
  type ProviderResponseDigest,
} from "./provider-digest.js";
import { PROVIDER_PARSER_IMPLEMENTATION } from "./provider-parser-implementation.generated.js";
import { PROVIDER_RESPONSE_PARSERS, ProviderResponseInvalid } from "./provider-parsers.js";
import { PROVIDER_PROTOCOL_RESOURCE, providerProtocolRow } from "./provider-protocol.js";
import { normalizeProviderRequest, syzygyPreflight } from "./provider-requests.js";
import type {
  ProviderAcquisitionReceipt,
  ProviderActualIdentityMap,
  ProviderDelivery,
  ProviderEvidenceDelivery,
  ProviderExecutionCapture,
  ProviderLocalDomainResult,
  ProviderOperationId,
  ProviderOperationProviderMap,
  ProviderOperationResultMap,
  ProviderParsedPayloadReceipt,
  ProviderPendingIdentity,
  ProviderRequestDigestImage,
  ProviderRequestedIdentityMap,
  ProviderResponseParserIdMap,
  ProviderRetainedIdentity,
  SyzygyOutsideDomain,
} from "./provider-types.js";

/** A capture, receipt or delivery whose operation-keyed identity chain does not agree. */
export class ProviderIdentityMismatch extends Error {
  readonly reason = "identity_mismatch" as const;
  constructor(message: string) {
    super(message);
    this.name = "ProviderIdentityMismatch";
  }
}

/** A value presented as a sealed provider receipt/delivery that this module never minted. */
export class ProviderSealRefused extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = "ProviderSealRefused";
  }
}

const mismatch = (message: string): never => { throw new ProviderIdentityMismatch(message); };
const refuse = (message: string): never => { throw new ProviderSealRefused(message); };

const ACQUISITIONS = new WeakSet<object>();
const PAYLOAD_RECEIPTS = new WeakSet<object>();
const DELIVERIES = new WeakSet<object>();
const LOCAL_DOMAIN_RESULTS = new WeakSet<object>();
interface CaptureImage {
  readonly contentEncoding: "uci-utf8" | "http-body";
  readonly transport: null | { readonly statusCode: 200; readonly headers: { readonly etag: string | null } };
  readonly bodyBase64: string;
}
const CAPTURE_IMAGES = new WeakMap<object, CaptureImage>();
const RECEIPT_PAYLOADS = new WeakMap<object, object>();

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => typeof value === "object" && value !== null && !Array.isArray(value);
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function deepCopy<T>(value: T): T {
  return JSON.parse(canonicalProviderJson(value)) as T;
}

function sameJson(left: unknown, right: unknown): boolean {
  try {
    return canonicalProviderJson(left) === canonicalProviderJson(right);
  } catch {
    return false;
  }
}

export function isCanonicalUtcIso(value: unknown): value is string {
  return typeof value === "string" && ISO.test(value) && new Date(value).toISOString() === value;
}

function exactKeys(value: unknown, keys: readonly string[], label: string): Readonly<Record<string, unknown>> {
  if (!isRecord(value) || (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) return refuse(`${label} must be a plain object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) return refuse(`${label} must have exactly ${expected.join(", ")}`);
  return value;
}

export function providerOf<K extends ProviderOperationId>(operation: K): ProviderOperationProviderMap[K] {
  return providerProtocolRow(operation).provider as ProviderOperationProviderMap[K];
}

function knownOperation(operation: unknown): ProviderOperationId {
  if (!PROVIDER_PROTOCOL_RESOURCE.payload.operations.some((row) => row.operation === operation)) return refuse(`unknown provider operation ${String(operation)}`);
  return operation as ProviderOperationId;
}

const isEngine = (operation: ProviderOperationId): boolean => providerProtocolRow(operation).endpoint.kind === "uci_supervisor";

// ---------------------------------------------------------------------------------------------
// Digest wrappers typed by the operation maps
// ---------------------------------------------------------------------------------------------

export function digestProviderRequest<K extends ProviderOperationId>(image: ProviderRequestDigestImage<K>): ProviderRequestDigest {
  if (image.provider !== providerOf(image.operation)) mismatch(`${image.operation} is not served by ${image.provider}`);
  return digestProviderRequestImage(image);
}

export function digestProviderActual<K extends ProviderOperationId>(operation: K, provider: ProviderOperationProviderMap[K], identity: ProviderActualIdentityMap[K]): ProviderActualDigest {
  if (provider !== providerOf(operation)) mismatch(`${operation} is not served by ${provider}`);
  return digestProviderActualImage(operation, provider, identity);
}

export function pendingKeyOf(identity: ProviderPendingIdentity): ProviderPendingDigest {
  return digestProviderPending(identity);
}

export function retainedIdentityOf<K extends ProviderOperationId>(acquisition: ProviderAcquisitionReceipt<K>): ProviderRetainedIdentity {
  return deepFreeze({
    pending: { operation: acquisition.operation, normalizedRequestDigest: acquisition.normalizedRequestDigest },
    actualIdentityDigest: digestProviderActual(acquisition.operation as K, acquisition.provider as ProviderOperationProviderMap[K], acquisition.actualIdentity as ProviderActualIdentityMap[K]),
    generation: acquisition.generation,
  });
}

export function cacheIdentityOf<K extends ProviderOperationId>(acquisition: ProviderAcquisitionReceipt<K>): ProviderCacheIdentity {
  return digestProviderRetained(retainedIdentityOf(acquisition));
}

/** The only request-digest authority: re-normalizes and hashes the closed operation-keyed image. */
export function normalizedProviderRequestDigest<K extends ProviderOperationId>(operation: K, requestedIdentity: ProviderRequestedIdentityMap[K]): ProviderRequestDigest {
  return digestProviderRequest({ operation, provider: providerOf(operation), requestedIdentity } as ProviderRequestDigestImage<K>);
}

export function parserImplementationDigest(parser: string): `sha256:${string}` {
  return digestProviderPayload({ parser, closureDigest: PROVIDER_PARSER_IMPLEMENTATION.closureDigest });
}

// ---------------------------------------------------------------------------------------------
// Actual identity closure
// ---------------------------------------------------------------------------------------------

const DIGEST_TEXT = (value: unknown, label: string): string => (typeof value === "string" && PROVIDER_DIGEST_PATTERN.test(value) ? value : mismatch(`${label} must be a sha256 digest`));
const TEXT = (value: unknown, label: string): string => (typeof value === "string" && value !== "" ? value : mismatch(`${label} must be a non-empty string`));

function checkActualIdentity<K extends ProviderOperationId>(operation: K, requested: ProviderRequestedIdentityMap[K], actual: unknown): ProviderActualIdentityMap[K] {
  const row = providerProtocolRow(operation);
  if (row.provider === "stockfish") {
    const value = exactKeys(actual, ["id", "name", "version", "binaryDigest", "uciOptionsDigest"], "Stockfish actual identity");
    const request = (requested as ProviderRequestedIdentityMap["stockfish.legal_root_table@1"]).request;
    TEXT(value.name, "name");
    DIGEST_TEXT(value.binaryDigest, "binaryDigest");
    DIGEST_TEXT(value.uciOptionsDigest, "uciOptionsDigest");
    if (value.id !== request.requestedEngine.id || value.version !== request.requestedEngine.version) mismatch(`captured engine ${String(value.id)} ${String(value.version)} is not the requested ${request.requestedEngine.id} ${request.requestedEngine.version}`);
    if (value.id !== (row.endpoint as { engineId: string }).engineId) mismatch(`captured engine ${String(value.id)} is not the ${row.operation} endpoint`);
  } else if (row.provider === "maia") {
    const value = exactKeys(actual, ["id", "kind", "name", "version", "modelId", "containerDigest", "seedHonored", "eloHonored", "optionImageDigest"], "Maia actual identity");
    const request = (requested as ProviderRequestedIdentityMap["maia.policy_page@1"]).request;
    if (value.kind !== "opponent") mismatch("Maia actual identity must be an opponent engine");
    if (value.eloHonored !== true) mismatch("Maia actual identity must honour Elo");
    if (typeof value.seedHonored !== "boolean") mismatch("seedHonored must be boolean");
    TEXT(value.name, "name");
    DIGEST_TEXT(value.containerDigest, "containerDigest");
    DIGEST_TEXT(value.optionImageDigest, "optionImageDigest");
    if (value.id !== (row.endpoint as { engineId: string }).engineId) mismatch(`captured engine ${String(value.id)} is not the Maia endpoint`);
    if (value.modelId !== request.requestedModel.id || value.version !== request.requestedModel.version) mismatch(`captured model ${String(value.modelId)} ${String(value.version)} is not the requested ${request.requestedModel.id} ${request.requestedModel.version}`);
  } else {
    const value = exactKeys(actual, ["source", "endpoint", "apiVersion"], "network actual identity");
    const expected = row.provider === "syzygy" ? { source: "lichess_syzygy", apiVersion: "standard-v1" } : { source: "lichess_explorer", apiVersion: "lichess-v1" };
    if (value.source !== expected.source || value.apiVersion !== expected.apiVersion || !sameJson(value.endpoint, row.endpoint)) mismatch(`${operation} actual source identity is not the literal endpoint`);
  }
  return deepFreeze(deepCopy(actual)) as ProviderActualIdentityMap[K];
}

function checkGeneration(operation: ProviderOperationId, generation: unknown): number | null {
  if (isEngine(operation)) {
    if (typeof generation !== "number" || !Number.isSafeInteger(generation) || generation < 1) mismatch(`${operation} requires a positive engine generation`);
    return generation as number;
  }
  if (generation !== null) mismatch(`${operation} is a network operation and carries generation null`);
  return null;
}

function checkTransport(operation: ProviderOperationId, contentEncoding: unknown, transport: unknown): CaptureImage["transport"] {
  if (isEngine(operation)) {
    if (contentEncoding !== "uci-utf8" || transport !== null) mismatch(`${operation} captures a uci-utf8 transcript with no transport`);
    return null;
  }
  if (contentEncoding !== "http-body") mismatch(`${operation} captures an http-body`);
  const value = exactKeys(transport, ["statusCode", "headers"], "transport");
  const headers = exactKeys(value.headers, ["etag"], "transport.headers");
  if (value.statusCode !== 200) mismatch("only status 200 is a capture");
  if (headers.etag !== null && (typeof headers.etag !== "string" || headers.etag === "")) mismatch("etag must be null or a non-empty string");
  return deepFreeze({ statusCode: 200, headers: { etag: headers.etag as string | null } });
}

function checkRequested<K extends ProviderOperationId>(operation: K, requested: unknown): ProviderRequestedIdentityMap[K] {
  if (!isRecord(requested) || !("request" in requested)) return mismatch("requested identity lacks its request");
  let normalized: ProviderRequestedIdentityMap[K];
  try {
    normalized = normalizeProviderRequest(operation, (requested as { request: never }).request);
  } catch (error) {
    return mismatch(`requested identity does not normalize: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!sameJson(normalized, requested)) mismatch("requested identity is not the normalized image of its request");
  return normalized;
}

// ---------------------------------------------------------------------------------------------
// Constructors (scheduler-only)
// ---------------------------------------------------------------------------------------------

interface AcquisitionInput<K extends ProviderOperationId> {
  readonly operation: K;
  readonly requestedIdentity: ProviderRequestedIdentityMap[K];
  readonly capture: ProviderExecutionCapture<K>;
  readonly requestedAt: string;
  readonly retrievedAt: string;
}

function makeProviderAcquisitionReceipt<K extends ProviderOperationId>(input: AcquisitionInput<K>): ProviderAcquisitionReceipt<K> {
  try {
    return sealAcquisition(input);
  } catch (error) {
    // Any capture/identity shape that does not inhabit the operation's arm is an identity mismatch.
    if (error instanceof ProviderSealRefused) throw new ProviderIdentityMismatch(error.message);
    throw error;
  }
}

function sealAcquisition<K extends ProviderOperationId>(input: AcquisitionInput<K>): ProviderAcquisitionReceipt<K> {
  const operation = knownOperation(input.operation) as K;
  const requestedIdentity = checkRequested(operation, input.requestedIdentity);
  const capture = exactKeys(input.capture, ["endpoint", "actualIdentity", "generation", "contentEncoding", "transport", "responseBytes"], "capture");
  const row = providerProtocolRow(operation);
  if (!sameJson(capture.endpoint, row.endpoint)) mismatch(`captured endpoint is not the literal ${operation} endpoint`);
  const actualIdentity = checkActualIdentity(operation, requestedIdentity, capture.actualIdentity);
  const generation = checkGeneration(operation, capture.generation);
  const transport = checkTransport(operation, capture.contentEncoding, capture.transport);
  if (!(capture.responseBytes instanceof Uint8Array)) mismatch("responseBytes must be the exact captured bytes");
  if (!isCanonicalUtcIso(input.requestedAt) || !isCanonicalUtcIso(input.retrievedAt)) mismatch("requestedAt/retrievedAt must be canonical UTC ISO timestamps");
  const provider = providerOf(operation);
  const bodyBase64 = providerBase64(capture.responseBytes as Uint8Array);
  const image: CaptureImage = deepFreeze({ contentEncoding: capture.contentEncoding as CaptureImage["contentEncoding"], transport, bodyBase64 });
  const receipt = deepFreeze({
    operation,
    provider,
    endpoint: deepCopy(row.endpoint),
    requestedIdentity,
    actualIdentity,
    generation,
    requestedAt: input.requestedAt,
    retrievedAt: input.retrievedAt,
    normalizedRequestDigest: normalizedProviderRequestDigest(operation, requestedIdentity),
    responseDigest: digestProviderResponse({ operation, provider, contentEncoding: image.contentEncoding, transport, bodyBase64 }),
  }) as unknown as ProviderAcquisitionReceipt<K>;
  ACQUISITIONS.add(receipt);
  CAPTURE_IMAGES.set(receipt, image);
  return receipt;
}

function captureOf<K extends ProviderOperationId>(acquisition: ProviderAcquisitionReceipt<K>): ProviderExecutionCapture<K> {
  const image = CAPTURE_IMAGES.get(acquisition) ?? refuse("acquisition has no sealed capture");
  return Object.freeze({
    endpoint: acquisition.endpoint,
    actualIdentity: acquisition.actualIdentity,
    generation: acquisition.generation,
    contentEncoding: image.contentEncoding,
    transport: image.transport,
    responseBytes: providerBase64Decode(image.bodyBase64),
  }) as unknown as ProviderExecutionCapture<K>;
}

/** Runs the one registered parser over the sealed capture and seals the payload receipt. */
function makeProviderParsedPayload<K extends ProviderOperationId>(acquisition: ProviderAcquisitionReceipt<K>): { readonly payload: ProviderOperationResultMap[K]; readonly payloadReceipt: ProviderParsedPayloadReceipt<K> } {
  assertProviderAcquisitionReceipt(acquisition.operation as K, acquisition);
  const operation = acquisition.operation as K;
  const parser = PROVIDER_RESPONSE_PARSERS[operation] as unknown as { readonly id: ProviderResponseParserIdMap[K]; parse(capture: ProviderExecutionCapture<K>, requested: ProviderRequestedIdentityMap[K]): ProviderOperationResultMap[K] };
  const payload = deepFreeze(deepCopy(parser.parse(captureOf(acquisition), acquisition.requestedIdentity as ProviderRequestedIdentityMap[K])));
  const payloadReceipt = deepFreeze({
    operation,
    parser: parser.id,
    parserImplementationDigest: parserImplementationDigest(parser.id),
    responseDigest: acquisition.responseDigest,
    payloadDigest: digestProviderPayload(payload),
  }) as ProviderParsedPayloadReceipt<K>;
  PAYLOAD_RECEIPTS.add(payloadReceipt);
  RECEIPT_PAYLOADS.set(payloadReceipt, payload as object);
  return Object.freeze({ payload, payloadReceipt });
}

interface DeliveryInput<K extends ProviderOperationId> {
  readonly kind: "live" | "retained_exact";
  readonly acquisition: ProviderAcquisitionReceipt<K>;
  readonly payload: ProviderOperationResultMap[K];
  readonly payloadReceipt: ProviderParsedPayloadReceipt<K>;
  readonly servedAt: string;
}

function makeProviderDelivery<K extends ProviderOperationId>(input: DeliveryInput<K>): ProviderDelivery<ProviderOperationResultMap[K], K> {
  const operation = input.acquisition.operation as K;
  assertProviderAcquisitionReceipt(operation, input.acquisition);
  assertProviderParsedPayloadReceipt(operation, input.payload, input.payloadReceipt);
  if (input.payloadReceipt.responseDigest !== input.acquisition.responseDigest) mismatch("payload receipt belongs to other response bytes");
  if (!isCanonicalUtcIso(input.servedAt)) mismatch("servedAt must be a canonical UTC ISO timestamp");
  let cacheIdentity: ProviderCacheIdentity | null;
  if (input.kind === "live") {
    if (input.servedAt !== input.acquisition.retrievedAt) mismatch("a live delivery is served at its retrieval time");
    cacheIdentity = null;
  } else if (input.kind === "retained_exact") {
    if (input.servedAt < input.acquisition.retrievedAt) mismatch("a retained delivery cannot be served before retrieval");
    cacheIdentity = cacheIdentityOf(input.acquisition);
  } else {
    return refuse("delivery kind must be live or retained_exact");
  }
  const delivery = Object.freeze({ kind: input.kind, servedAt: input.servedAt, cacheIdentity, acquisition: input.acquisition, payload: input.payload, payloadReceipt: input.payloadReceipt }) as ProviderDelivery<ProviderOperationResultMap[K], K>;
  DELIVERIES.add(delivery);
  return delivery;
}

function makeProviderLocalDomainResult(requestedIdentity: ProviderRequestedIdentityMap["syzygy.position@1"], observedAt: string): ProviderLocalDomainResult<"syzygy.position@1"> {
  const normalized = checkRequested("syzygy.position@1", requestedIdentity);
  const payload = syzygyPreflight(normalized) ?? mismatch("an in-domain Syzygy request has no local-domain result");
  if (!isCanonicalUtcIso(observedAt)) mismatch("observedAt must be a canonical UTC ISO timestamp");
  const result = deepFreeze({ kind: "local_domain_result", operation: "syzygy.position@1", normalizedRequestDigest: normalizedProviderRequestDigest("syzygy.position@1", normalized), observedAt, payload: payload as SyzygyOutsideDomain }) as ProviderLocalDomainResult<"syzygy.position@1">;
  LOCAL_DOMAIN_RESULTS.add(result);
  return result;
}

/**
 * The scheduler-private constructor authority. Its only production importer is
 * `apps/server/src/provider-exchange.ts` (census-enforced). It is absent from the package barrel.
 */
export const PROVIDER_EXCHANGE_AUTHORITY = Object.freeze({
  makeProviderAcquisitionReceipt,
  makeProviderParsedPayload,
  makeProviderDelivery,
  makeProviderLocalDomainResult,
});

// ---------------------------------------------------------------------------------------------
// Assertions (every source factory calls these before minting)
// ---------------------------------------------------------------------------------------------

export function assertProviderAcquisitionReceipt<K extends ProviderOperationId>(operation: K, value: unknown): asserts value is ProviderAcquisitionReceipt<K> {
  if (typeof value !== "object" || value === null || !ACQUISITIONS.has(value)) refuse("not a sealed provider acquisition receipt");
  const receipt = value as ProviderAcquisitionReceipt;
  if (receipt.operation !== operation || receipt.provider !== providerOf(operation)) refuse(`acquisition belongs to ${receipt.operation}, not ${operation}`);
}

export function assertProviderParsedPayloadReceipt<K extends ProviderOperationId>(operation: K, payload: ProviderOperationResultMap[K], value: unknown): asserts value is ProviderParsedPayloadReceipt<K> {
  if (typeof value !== "object" || value === null || !PAYLOAD_RECEIPTS.has(value)) refuse("not a sealed parsed-payload receipt");
  const receipt = value as ProviderParsedPayloadReceipt<K>;
  if (receipt.operation !== operation || receipt.parser !== PROVIDER_RESPONSE_PARSERS[operation].id) refuse(`payload receipt belongs to ${receipt.operation}/${receipt.parser}, not ${operation}`);
  if (RECEIPT_PAYLOADS.get(receipt) !== (payload as unknown)) refuse("payload is not the exact value its receipt parsed");
  if (receipt.parserImplementationDigest !== parserImplementationDigest(receipt.parser)) refuse("payload receipt was produced by another parser implementation");
}

export function assertProviderDelivery<K extends ProviderOperationId>(operation: K, value: unknown): asserts value is ProviderDelivery<ProviderOperationResultMap[K], K> {
  if (typeof value !== "object" || value === null || !DELIVERIES.has(value)) refuse("not a sealed provider delivery");
  const delivery = value as ProviderDelivery<ProviderOperationResultMap[K], K>;
  assertProviderAcquisitionReceipt(operation, delivery.acquisition);
  assertProviderParsedPayloadReceipt(operation, delivery.payload, delivery.payloadReceipt);
  if ((delivery.kind === "live") !== (delivery.cacheIdentity === null)) refuse("delivery kind and cache identity disagree");
}

export function assertProviderLocalDomainResult<K extends ProviderOperationId>(operation: K, value: unknown): asserts value is ProviderLocalDomainResult<K> {
  if (typeof value !== "object" || value === null || !LOCAL_DOMAIN_RESULTS.has(value)) refuse("not a sealed provider local-domain result");
  if ((value as { operation: unknown }).operation !== operation) refuse(`local-domain result belongs to ${String((value as { operation: unknown }).operation)}, not ${operation}`);
}

// ---------------------------------------------------------------------------------------------
// The durable save/reload boundary (D3030)
// ---------------------------------------------------------------------------------------------

export const PERSISTED_PROVIDER_DELIVERY_SCHEMA = "tabiya.provider-delivery.v1" as const;

export interface PersistedProviderDelivery {
  readonly schema: typeof PERSISTED_PROVIDER_DELIVERY_SCHEMA;
  readonly operation: ProviderOperationId;
  readonly kind: "live" | "retained_exact";
  readonly servedAt: string;
  readonly cacheIdentity: string | null;
  readonly acquisition: Readonly<Record<string, unknown>>;
  readonly response: CaptureImage;
  readonly payloadReceipt: Readonly<Record<string, unknown>>;
}

/** The sole save boundary: a sealed delivery becomes one closed, JSON-safe image with its bytes. */
export function serializeProviderDelivery<K extends ProviderOperationId>(operation: K, delivery: ProviderDelivery<ProviderOperationResultMap[K], K>): PersistedProviderDelivery {
  assertProviderDelivery(operation, delivery);
  const response = CAPTURE_IMAGES.get(delivery.acquisition) ?? refuse("delivery has no sealed capture");
  return deepFreeze(deepCopy({
    schema: PERSISTED_PROVIDER_DELIVERY_SCHEMA,
    operation,
    kind: delivery.kind,
    servedAt: delivery.servedAt,
    cacheIdentity: delivery.cacheIdentity,
    acquisition: delivery.acquisition,
    response,
    payloadReceipt: delivery.payloadReceipt,
  })) as unknown as PersistedProviderDelivery;
}

const ACQUISITION_KEYS = ["operation", "provider", "endpoint", "requestedIdentity", "actualIdentity", "generation", "requestedAt", "retrievedAt", "normalizedRequestDigest", "responseDigest"] as const;
const PAYLOAD_RECEIPT_KEYS = ["operation", "parser", "parserImplementationDigest", "responseDigest", "payloadDigest"] as const;

/**
 * The sole reload boundary for provider deliveries. Unknown bytes become a sealed delivery only when
 * the whole operation-keyed chain re-derives: request normalization, request digest, response bytes
 * and digest, the operation's own parser and payload digest, parser implementation, the literal
 * provider/endpoint/actual identity/generation relation and (retained) the cache identity.
 */
export function parsePersistedProviderDelivery<K extends ProviderOperationId>(operation: K, value: unknown): ProviderEvidenceDelivery<ProviderOperationResultMap[K], K> {
  knownOperation(operation);
  const stored = exactKeys(value, ["schema", "operation", "kind", "servedAt", "cacheIdentity", "acquisition", "response", "payloadReceipt"], "persisted provider delivery");
  if (stored.schema !== PERSISTED_PROVIDER_DELIVERY_SCHEMA) refuse("persisted provider delivery has an unknown schema");
  if (stored.operation !== operation) mismatch(`persisted delivery is ${String(stored.operation)}, not ${operation}`);
  const acquisition = exactKeys(stored.acquisition, ACQUISITION_KEYS, "persisted acquisition");
  if (acquisition.operation !== operation) mismatch("persisted acquisition crosses operations");
  if (acquisition.provider !== providerOf(operation)) mismatch("persisted acquisition crosses providers");
  const response = exactKeys(stored.response, ["contentEncoding", "transport", "bodyBase64"], "persisted response");
  let bytes: Uint8Array;
  try {
    bytes = providerBase64Decode(response.bodyBase64 as string);
  } catch (error) {
    return refuse(error instanceof Error ? error.message : String(error));
  }
  const receipt = makeProviderAcquisitionReceipt({
    operation,
    requestedIdentity: acquisition.requestedIdentity as ProviderRequestedIdentityMap[K],
    capture: {
      endpoint: acquisition.endpoint,
      actualIdentity: acquisition.actualIdentity,
      generation: acquisition.generation,
      contentEncoding: response.contentEncoding,
      transport: response.transport,
      responseBytes: bytes,
    } as unknown as ProviderExecutionCapture<K>,
    requestedAt: acquisition.requestedAt as string,
    retrievedAt: acquisition.retrievedAt as string,
  });
  if (!sameJson(receipt, acquisition)) mismatch("persisted acquisition does not re-derive from its request, identity and bytes");
  let parsed: { readonly payload: ProviderOperationResultMap[K]; readonly payloadReceipt: ProviderParsedPayloadReceipt<K> };
  try {
    parsed = makeProviderParsedPayload(receipt);
  } catch (error) {
    if (error instanceof ProviderResponseInvalid) return mismatch(`persisted bytes no longer parse: ${error.message}`);
    throw error;
  }
  const storedReceipt = exactKeys(stored.payloadReceipt, PAYLOAD_RECEIPT_KEYS, "persisted payload receipt");
  if (!sameJson(parsed.payloadReceipt, storedReceipt)) mismatch("persisted payload receipt does not re-derive (parser, parser implementation, response or payload digest)");
  if (stored.kind !== "live" && stored.kind !== "retained_exact") return refuse("persisted delivery kind must be live or retained_exact");
  const delivery = makeProviderDelivery({ kind: stored.kind, acquisition: receipt, payload: parsed.payload, payloadReceipt: parsed.payloadReceipt, servedAt: stored.servedAt as string });
  if (delivery.cacheIdentity !== stored.cacheIdentity) mismatch("persisted cache identity does not re-derive");
  return delivery;
}

export type { ProviderRetainedIdentity, ProviderPendingIdentity };
export type { ProviderRequestDigest, ProviderResponseDigest, ProviderCacheIdentity };
