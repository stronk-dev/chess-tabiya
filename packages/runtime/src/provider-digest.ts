/**
 * The single byte authority for every provider digest and key
 * (rfc/provider-exchange-and-execution.md §3.1).
 *
 * It exports no generic caller-selected tag: ten closed digest domains, each with one constructor.
 * The hashed bytes are exactly `UTF8("tabiya/" + domain + "\u0000") || UTF8(canonicalProviderJson(image))`,
 * except `engine.binary.v1`, whose image is the launched executable's raw bytes (a JSON encoding of
 * a multi-megabyte binary would be neither exact nor affordable). The digest is SHA-256 rendered as
 * `sha256:` plus 64 lower-case hexadecimal characters; `provider.path.v1` adds `path:` after hashing.
 *
 * The runtime is browser-buildable, so SHA-256 is a dependency-free byte implementation here. No
 * other provider module may hash (`provider-protocol.test.ts` census).
 */
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

export type ProviderCommandsDigest = string & { readonly __providerCommandsDigest: unique symbol };
export type ProviderRequestDigest = string & { readonly __providerRequestDigest: unique symbol };
export type ProviderPendingDigest = string & { readonly __providerPendingDigest: unique symbol };
export type ProviderActualDigest = string & { readonly __providerActualDigest: unique symbol };
export type ProviderResponseDigest = string & { readonly __providerResponseDigest: unique symbol };
export type ProviderRetainedDigest = string & { readonly __providerRetainedDigest: unique symbol };
export type ProviderCacheIdentity = ProviderRetainedDigest;
export type EngineBinaryDigest = string & { readonly __engineBinaryDigest: unique symbol };
export type EngineOptionImageDigest = string & { readonly __engineOptionImageDigest: unique symbol };
export type EngineContainerDigest = string & { readonly __engineContainerDigest: unique symbol };
export type ProviderPayloadDigest = `sha256:${string}`;
export type ProviderPathDigest = `path:sha256:${string}`;

export const PROVIDER_DIGEST_DOMAINS = Object.freeze([
  "engine.binary.v1",
  "engine.option_image.v1",
  "engine.container.v1",
  "provider.commands.v1",
  "provider.request.v1",
  "provider.pending.v1",
  "provider.actual.v1",
  "provider.response.v1",
  "provider.retained.v1",
  "provider.path.v1",
] as const);
export type ProviderDigestDomain = (typeof PROVIDER_DIGEST_DOMAINS)[number];

export const PROVIDER_DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/u;

// ---------------------------------------------------------------------------------------------
// RFC 8785 canonical JSON over the repository's shipped canonicalizer
// ---------------------------------------------------------------------------------------------

function assertCanonicalizable(value: unknown, path: string): void {
  if (value === null || typeof value === "boolean" || typeof value === "string") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`Provider canonical JSON refuses non-finite number at ${path}`);
    return;
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) throw new TypeError(`Provider canonical JSON refuses an array hole at ${path}[${index}]`);
      assertCanonicalizable(value[index], `${path}[${index}]`);
    }
    return;
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`Provider canonical JSON refuses a non-plain object at ${path}`);
    if (Object.getOwnPropertySymbols(value).length > 0) throw new TypeError(`Provider canonical JSON refuses symbol keys at ${path}`);
    for (const [key, child] of Object.entries(value)) assertCanonicalizable(child, `${path}.${key}`);
    return;
  }
  throw new TypeError(`Provider canonical JSON refuses ${typeof value} at ${path}`);
}

/**
 * RFC 8785 JSON Canonicalization Scheme. Delegates serialization to the shipped canonicalizer
 * (UTF-16 key order, ECMAScript number spelling, lone-surrogate refusal) after refusing
 * `undefined`, holes, non-finite numbers, bigint, symbols, functions and non-plain objects.
 */
export function canonicalProviderJson(value: unknown): string {
  assertCanonicalizable(value, "$");
  return canonicalizeJson(value);
}

// ---------------------------------------------------------------------------------------------
// SHA-256 over bytes
// ---------------------------------------------------------------------------------------------

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function sha256Hex(chunks: readonly Uint8Array[]): string {
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64);
  const block = new Uint8Array(64);
  let filled = 0;
  let total = 0;
  const compress = (bytes: Uint8Array, offset: number): void => {
    for (let index = 0; index < 16; index += 1) {
      const at = offset + index * 4;
      w[index] = (bytes[at]! << 24) | (bytes[at + 1]! << 16) | (bytes[at + 2]! << 8) | bytes[at + 3]!;
    }
    for (let index = 16; index < 64; index += 1) {
      const a = w[index - 15]!;
      const b = w[index - 2]!;
      const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
      const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
      w[index] = (w[index - 16]! + s0 + w[index - 7]! + s1) | 0;
    }
    let a = h[0]!, b = h[1]!, c = h[2]!, d = h[3]!, e = h[4]!, f = h[5]!, g = h[6]!, hh = h[7]!;
    for (let index = 0; index < 64; index += 1) {
      const s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const choose = (e & f) ^ (~e & g);
      const t1 = (hh + s1 + choose + K[index]! + w[index]!) | 0;
      const s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (s0 + majority) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] = (h[0]! + a) | 0; h[1] = (h[1]! + b) | 0; h[2] = (h[2]! + c) | 0; h[3] = (h[3]! + d) | 0;
    h[4] = (h[4]! + e) | 0; h[5] = (h[5]! + f) | 0; h[6] = (h[6]! + g) | 0; h[7] = (h[7]! + hh) | 0;
  };
  for (const chunk of chunks) {
    total += chunk.length;
    let offset = 0;
    if (filled > 0) {
      const take = Math.min(64 - filled, chunk.length);
      block.set(chunk.subarray(0, take), filled);
      filled += take;
      offset = take;
      if (filled === 64) { compress(block, 0); filled = 0; }
    }
    while (offset + 64 <= chunk.length) { compress(chunk, offset); offset += 64; }
    if (offset < chunk.length) { block.set(chunk.subarray(offset), 0); filled = chunk.length - offset; }
  }
  block[filled] = 0x80;
  block.fill(0, filled + 1);
  if (filled + 1 > 56) { compress(block, 0); block.fill(0); }
  const bits = total * 8;
  const high = Math.floor(bits / 2 ** 32);
  const low = bits >>> 0;
  block[56] = high >>> 24; block[57] = (high >>> 16) & 0xff; block[58] = (high >>> 8) & 0xff; block[59] = high & 0xff;
  block[60] = low >>> 24; block[61] = (low >>> 16) & 0xff; block[62] = (low >>> 8) & 0xff; block[63] = low & 0xff;
  compress(block, 0);
  return [...h].map((word) => (word >>> 0).toString(16).padStart(8, "0")).join("");
}

const encoder = new TextEncoder();

/** UTF-8 bytes of a string; exported so the response image and parsers share one encoding. */
export function providerUtf8(value: string): Uint8Array {
  return encoder.encode(value);
}

function domainDigest(domain: ProviderDigestDomain, body: Uint8Array): `sha256:${string}` {
  return `sha256:${sha256Hex([encoder.encode(`tabiya/${domain}\u0000`), body])}`;
}

function jsonDigest(domain: ProviderDigestDomain, image: unknown): `sha256:${string}` {
  return domainDigest(domain, encoder.encode(canonicalProviderJson(image)));
}

/** Plain SHA-256 of canonical JSON, for the parsed-payload receipt and parser-implementation digests. */
export function digestProviderPayload(payload: unknown): ProviderPayloadDigest {
  return `sha256:${sha256Hex([encoder.encode(canonicalProviderJson(payload))])}`;
}

/** Plain SHA-256 over a byte sequence (parser implementation source bytes). */
export function digestProviderSourceBytes(chunks: readonly Uint8Array[]): ProviderPayloadDigest {
  return `sha256:${sha256Hex(chunks)}`;
}

// ---------------------------------------------------------------------------------------------
// Base64 (browser-safe, exact bytes)
// ---------------------------------------------------------------------------------------------

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function providerBase64(bytes: Uint8Array): string {
  let out = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index]!;
    const b = bytes[index + 1];
    const c = bytes[index + 2];
    out += ALPHABET[a >>> 2]! + ALPHABET[((a & 3) << 4) | ((b ?? 0) >>> 4)]!;
    out += b === undefined ? "=" : ALPHABET[((b & 15) << 2) | ((c ?? 0) >>> 6)]!;
    out += c === undefined ? "=" : ALPHABET[c & 63]!;
  }
  return out;
}

/** Strict canonical base64 decoding: refuses whitespace, bad padding and non-canonical trailing bits. */
export function providerBase64Decode(text: string): Uint8Array {
  if (typeof text !== "string" || text.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(text)) throw new TypeError("Provider response body is not canonical base64");
  const padding = text.endsWith("==") ? 2 : text.endsWith("=") ? 1 : 0;
  const bytes = new Uint8Array((text.length / 4) * 3 - padding);
  let at = 0;
  for (let index = 0; index < text.length; index += 4) {
    const values = [0, 1, 2, 3].map((offset) => text[index + offset] === "=" ? 0 : ALPHABET.indexOf(text[index + offset]!));
    const triple = (values[0]! << 18) | (values[1]! << 12) | (values[2]! << 6) | values[3]!;
    if (at < bytes.length) bytes[at++] = triple >>> 16;
    if (at < bytes.length) bytes[at++] = (triple >>> 8) & 0xff;
    if (at < bytes.length) bytes[at++] = triple & 0xff;
  }
  if (providerBase64(bytes) !== text) throw new TypeError("Provider response body is not canonical base64");
  return bytes;
}

// ---------------------------------------------------------------------------------------------
// The ten domain constructors
// ---------------------------------------------------------------------------------------------

export interface EngineOptionImage {
  readonly advertisedUciOptionLines: readonly string[];
  readonly appliedSetoptionCommands: readonly string[];
}

export interface EngineContainerImage {
  readonly runtime: "oci";
  readonly imageId: string;
  readonly manifestDigest: `sha256:${string}`;
  readonly configDigest: `sha256:${string}`;
}

function assertLines(lines: unknown, label: string): asserts lines is readonly string[] {
  if (!Array.isArray(lines) || lines.some((line) => typeof line !== "string" || /[\r\n\0]/u.test(line))) {
    throw new TypeError(`${label} must be an array of single-line strings`);
  }
}

export function digestEngineBinary(bytes: Uint8Array): EngineBinaryDigest {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) throw new TypeError("Engine binary digest requires the launched executable bytes");
  return domainDigest("engine.binary.v1", bytes) as EngineBinaryDigest;
}

export function digestEngineOptionImage(image: EngineOptionImage): EngineOptionImageDigest {
  assertLines(image.advertisedUciOptionLines, "advertisedUciOptionLines");
  assertLines(image.appliedSetoptionCommands, "appliedSetoptionCommands");
  return jsonDigest("engine.option_image.v1", { advertisedUciOptionLines: [...image.advertisedUciOptionLines], appliedSetoptionCommands: [...image.appliedSetoptionCommands] }) as EngineOptionImageDigest;
}

export function digestEngineContainer(image: EngineContainerImage): EngineContainerDigest {
  if (image.runtime !== "oci" || typeof image.imageId !== "string" || image.imageId === ""
    || !PROVIDER_DIGEST_PATTERN.test(image.manifestDigest) || !PROVIDER_DIGEST_PATTERN.test(image.configDigest)) {
    throw new TypeError("Engine container image must be { runtime: oci, imageId, manifestDigest, configDigest }");
  }
  return jsonDigest("engine.container.v1", { runtime: "oci", imageId: image.imageId, manifestDigest: image.manifestDigest, configDigest: image.configDigest }) as EngineContainerDigest;
}

export function digestProviderCommands(commands: readonly string[]): ProviderCommandsDigest {
  assertLines(commands, "provider commands");
  return jsonDigest("provider.commands.v1", { commands: [...commands] }) as ProviderCommandsDigest;
}

/** `{ operation, provider, requestedIdentity }`; the typed image is declared in provider-exchange.ts. */
export function digestProviderRequestImage(image: { readonly operation: string; readonly provider: string; readonly requestedIdentity: unknown }): ProviderRequestDigest {
  return jsonDigest("provider.request.v1", { operation: image.operation, provider: image.provider, requestedIdentity: image.requestedIdentity }) as ProviderRequestDigest;
}

export function digestProviderPending(image: { readonly operation: string; readonly normalizedRequestDigest: ProviderRequestDigest }): ProviderPendingDigest {
  return jsonDigest("provider.pending.v1", { operation: image.operation, normalizedRequestDigest: image.normalizedRequestDigest }) as ProviderPendingDigest;
}

export function digestProviderActualImage(operation: string, provider: string, identity: unknown): ProviderActualDigest {
  return jsonDigest("provider.actual.v1", { operation, provider, actualIdentity: identity }) as ProviderActualDigest;
}

export interface ProviderResponseDigestImage {
  readonly operation: string;
  readonly provider: string;
  readonly contentEncoding: "uci-utf8" | "http-body";
  readonly transport: null | { readonly statusCode: 200; readonly headers: { readonly etag: string | null } };
  readonly bodyBase64: string;
}

export function digestProviderResponse(image: ProviderResponseDigestImage): ProviderResponseDigest {
  return jsonDigest("provider.response.v1", {
    operation: image.operation,
    provider: image.provider,
    contentEncoding: image.contentEncoding,
    transport: image.transport === null ? null : { statusCode: image.transport.statusCode, headers: { etag: image.transport.headers.etag } },
    bodyBase64: image.bodyBase64,
  }) as ProviderResponseDigest;
}

export interface ProviderRetainedIdentityImage {
  readonly pending: { readonly operation: string; readonly normalizedRequestDigest: ProviderRequestDigest };
  readonly actualIdentityDigest: ProviderActualDigest;
  readonly generation: number | null;
}

export function digestProviderRetained(image: ProviderRetainedIdentityImage): ProviderRetainedDigest {
  return jsonDigest("provider.retained.v1", {
    pending: { operation: image.pending.operation, normalizedRequestDigest: image.pending.normalizedRequestDigest },
    actualIdentityDigest: image.actualIdentityDigest,
    generation: image.generation,
  }) as ProviderRetainedDigest;
}

/** The §1 compiled-path image. §1 compilation is not yet implemented; the domain is reserved and exact. */
export interface CompiledProviderPathDigestImage {
  readonly projection: string;
  readonly derivationChoices: readonly { readonly projection: string; readonly occurrence: readonly number[]; readonly member: number; readonly inputs: readonly string[] }[];
  readonly sourceRequirements: readonly { readonly occurrence: readonly number[]; readonly projection: string; readonly availability: "recorded" | "provider" | "build_time"; readonly providerOperation: string | null }[];
}

export function digestProviderPath(image: CompiledProviderPathDigestImage): ProviderPathDigest {
  return `path:${jsonDigest("provider.path.v1", image)}`;
}
