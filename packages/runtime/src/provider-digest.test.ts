import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  PROVIDER_DIGEST_DOMAINS,
  canonicalProviderJson,
  digestEngineBinary,
  digestEngineContainer,
  digestEngineOptionImage,
  digestProviderActualImage,
  digestProviderCommands,
  digestProviderPath,
  digestProviderPending,
  digestProviderRequestImage,
  digestProviderResponse,
  digestProviderRetained,
  digestProviderSourceBytes,
  providerBase64,
  providerBase64Decode,
  providerUtf8,
  type ProviderActualDigest,
  type ProviderRequestDigest,
} from "./provider-digest.js";

const reference = (domain: string, json: string): string => `sha256:${createHash("sha256").update(Buffer.concat([Buffer.from(`tabiya/${domain}\u0000`, "utf8"), Buffer.from(json, "utf8")])).digest("hex")}`;

describe("§3.1 provider digest registry", () => {
  it("has exactly the ten closed domains", () => {
    expect(PROVIDER_DIGEST_DOMAINS).toEqual(["engine.binary.v1", "engine.option_image.v1", "engine.container.v1", "provider.commands.v1", "provider.request.v1", "provider.pending.v1", "provider.actual.v1", "provider.response.v1", "provider.retained.v1", "provider.path.v1"]);
  });

  it("hashes bytes exactly like SHA-256 across block boundaries", () => {
    for (const length of [0, 1, 55, 56, 63, 64, 65, 119, 120, 1000, 100_003]) {
      const bytes = new Uint8Array(length).map((_, index) => (index * 31 + 7) & 0xff);
      expect(digestProviderSourceBytes([bytes])).toBe(`sha256:${createHash("sha256").update(bytes).digest("hex")}`);
      const split = Math.floor(length / 3);
      expect(digestProviderSourceBytes([bytes.subarray(0, split), bytes.subarray(split)])).toBe(digestProviderSourceBytes([bytes]));
    }
  });

  it("prefixes each domain and canonical JSON exactly, independent of key order", () => {
    expect(digestProviderCommands(["go depth 8"])).toBe(reference("provider.commands.v1", "{\"commands\":[\"go depth 8\"]}"));
    const pending = { normalizedRequestDigest: "sha256:ab" as ProviderRequestDigest, operation: "syzygy.position@1" };
    expect(digestProviderPending(pending)).toBe(reference("provider.pending.v1", "{\"normalizedRequestDigest\":\"sha256:ab\",\"operation\":\"syzygy.position@1\"}"));
    const request = { operation: "syzygy.position@1", provider: "syzygy", requestedIdentity: { request: { fen: "x", timeoutMs: 1, rules: "chess", variant: "standard" } } };
    const reordered = { requestedIdentity: { request: { variant: "standard", rules: "chess", timeoutMs: 1, fen: "x" } }, provider: "syzygy", operation: "syzygy.position@1" };
    expect(digestProviderRequestImage(request)).toBe(digestProviderRequestImage(reordered));
    expect(digestProviderRequestImage({ ...request, operation: "maia.policy_page@1" })).not.toBe(digestProviderRequestImage(request));
    expect(digestProviderRequestImage({ ...request, provider: "maia" })).not.toBe(digestProviderRequestImage(request));
    expect(digestProviderRequestImage({ ...request, requestedIdentity: { request: { ...request.requestedIdentity.request, timeoutMs: 2 } } })).not.toBe(digestProviderRequestImage(request));
    expect(digestEngineBinary(providerUtf8("abc"))).toBe(`sha256:${createHash("sha256").update(Buffer.concat([Buffer.from("tabiya/engine.binary.v1\u0000"), Buffer.from("abc")])).digest("hex")}`);
    expect(digestProviderPath({ projection: "p@1", derivationChoices: [], sourceRequirements: [] })).toMatch(/^path:sha256:[0-9a-f]{64}$/u);
  });

  it("separates every domain even for equal images", () => {
    const actual = digestProviderActualImage("syzygy.position@1", "syzygy", { a: 1 });
    const retained = digestProviderRetained({ pending: { operation: "syzygy.position@1", normalizedRequestDigest: "sha256:ab" as ProviderRequestDigest }, actualIdentityDigest: actual as ProviderActualDigest, generation: null });
    const digests = new Set([actual, retained, digestProviderCommands([]), digestEngineOptionImage({ advertisedUciOptionLines: [], appliedSetoptionCommands: [] })]);
    expect(digests.size).toBe(4);
  });

  it("binds the response digest to status/ETag transport and the exact raw bytes", () => {
    const base = { operation: "syzygy.position@1", provider: "syzygy", contentEncoding: "http-body" as const, transport: { statusCode: 200 as const, headers: { etag: "\"a\"" } }, bodyBase64: providerBase64(providerUtf8("{}")) };
    expect(digestProviderResponse({ ...base, transport: { statusCode: 200, headers: { etag: "\"b\"" } } })).not.toBe(digestProviderResponse(base));
    expect(digestProviderResponse({ ...base, transport: { statusCode: 200, headers: { etag: null } } })).not.toBe(digestProviderResponse(base));
    expect(digestProviderResponse({ ...base, bodyBase64: providerBase64(providerUtf8("{ }")) })).not.toBe(digestProviderResponse(base));
  });

  it("follows RFC 8785 for numbers, keys and Unicode, and refuses non-JSON values", () => {
    expect(canonicalProviderJson({ b: 1, a: -0, c: 1e21, d: 0.1, e: 1e-7, f: 1.5 })).toBe("{\"a\":0,\"b\":1,\"c\":1e+21,\"d\":0.1,\"e\":1e-7,\"f\":1.5}");
    expect(canonicalProviderJson({ "\u{1F600}": 1, z: 2, "é": 3 })).toBe("{\"z\":2,\"é\":3,\"\u{1F600}\":1}");
    for (const bad of [{ a: undefined }, { a: Number.NaN }, { a: Number.POSITIVE_INFINITY }, { a: 1n }, { a: () => 1 }, { a: new Map() }, { a: new Date(0) }, { a: "\ud800" }, [1, , 3]]) {
      expect(() => canonicalProviderJson(bad), JSON.stringify(String(bad))).toThrow();
    }
  });

  it("validates engine artifact images and single-line option/command lists", () => {
    expect(() => digestEngineOptionImage({ advertisedUciOptionLines: ["a\nb"], appliedSetoptionCommands: [] })).toThrow(/single-line/u);
    expect(() => digestProviderCommands(["go\u0000"])).toThrow(/single-line/u);
    expect(() => digestEngineContainer({ runtime: "oci", imageId: "x", manifestDigest: "sha256:zz" as `sha256:${string}`, configDigest: `sha256:${"1".repeat(64)}` })).toThrow();
    expect(() => digestEngineBinary(new Uint8Array())).toThrow(/launched executable/u);
    expect(digestEngineOptionImage({ advertisedUciOptionLines: ["b", "a"], appliedSetoptionCommands: [] })).not.toBe(digestEngineOptionImage({ advertisedUciOptionLines: ["a", "b"], appliedSetoptionCommands: [] }));
  });

  it("round-trips canonical base64 and refuses non-canonical encodings", () => {
    for (const length of [0, 1, 2, 3, 4, 257]) {
      const bytes = new Uint8Array(length).map((_, index) => (index * 97) & 0xff);
      expect(providerBase64(bytes)).toBe(Buffer.from(bytes).toString("base64"));
      expect([...providerBase64Decode(providerBase64(bytes))]).toEqual([...bytes]);
    }
    expect(() => providerBase64Decode("QQ")).toThrow();
    expect(() => providerBase64Decode("QR==")).toThrow();
    expect(() => providerBase64Decode("QQ==\n")).toThrow();
  });
});
