import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { describe, expect, it, vi } from "vitest";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { sha256Hex } from "./assistance-exchange-digest.js";
import * as synchronousDigest from "./assistance-exchange-digest.js";
import {
  admitInstalledOpeningCatalogue, admitInstalledOpeningCatalogueText, compileLoadedOpeningCatalogue, isInstalledOpeningCatalogue,
  readInstalledOpeningCatalogue, type RuntimeOpeningCatalogue,
} from "./opening-catalogue.js";

const raw = JSON.parse(await readFile(new URL("../../../apps/server/artifacts/runtime-opening-catalogue.json", import.meta.url), "utf8")) as RuntimeOpeningCatalogue;
const E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const UNNAMED = "rnbqkb1r/pppp1ppp/4pn2/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3";
function redigest(value: RuntimeOpeningCatalogue): RuntimeOpeningCatalogue {
  const { digest: _digest, ...body } = value;
  return { ...body, digest: `sha256:${sha256Hex(canonicalizeJson(body))}` };
}
function installed() {
  const value = admitInstalledOpeningCatalogue(raw);
  if (value.kind !== "available") throw new TypeError(`Installed fixture unavailable: ${value.reason}`);
  return value;
}

describe("the actual installed opening source", () => {
  it("owns startup JSON before awaiting built-in SHA-256, without redundant object cloning or a weaker source", async () => {
    const expected = installed(), input = structuredClone(raw);
    const synchronous = vi.spyOn(synchronousDigest, "sha256Hex"), native = vi.spyOn(globalThis.crypto.subtle, "digest"), clone = vi.spyOn(globalThis, "structuredClone");
    try {
      const pending = admitInstalledOpeningCatalogueText(JSON.stringify(input));
      expect(isInstalledOpeningCatalogue(pending)).toBe(false);
      Object.assign(input.namedEndpoints[0]!, { name: "changed while digest is pending" });
      const value = await pending;
      if (value.kind !== "available") throw new TypeError(`async source unavailable: ${value.reason}`);
      expect(native).toHaveBeenCalledTimes(1); expect(synchronous).not.toHaveBeenCalled(); expect(clone).not.toHaveBeenCalled();
      expect(value.catalogue.artifact).toEqual(expected.catalogue.artifact);
      expect(value.source.ref).toEqual(expected.source.ref); expect(value.source).not.toBe(expected.source);
      expect(isInstalledOpeningCatalogue(value.source)).toBe(true);
      expect(readInstalledOpeningCatalogue(value.source)).toBe(value.catalogue);
      expect(Object.isFrozen(value.catalogue.artifact.namedEndpoints[0])).toBe(true);
      expect(value.catalogue.openingIdentity(E4, 1)).toEqual(expected.catalogue.openingIdentity(E4, 1));
    } finally { synchronous.mockRestore(); native.mockRestore(); clone.mockRestore(); }
  });

  it.each(["missing", "shape", "name", "noncanonical-key", "duplicate", "missing-member", "accessor", "digest", "rewritten"] as const)("async admission preserves the actual %s refusal", async fault => {
    const input = structuredClone(raw);
    let value: unknown = input, reason = "artifact_invalid";
    if (fault === "missing") { value = undefined; reason = "artifact_missing"; }
    else if (fault === "shape") value = { ...input, extra: true };
    else if (fault === "name") Object.assign(input.namedEndpoints[0]!, { name: " " });
    else if (fault === "noncanonical-key") Object.assign(input.pathMembership[0]!, { key: "not a canonical key" });
    else if (fault === "duplicate") (input.namedEndpoints as RuntimeOpeningCatalogue["namedEndpoints"][number][]).push(input.namedEndpoints[0]!);
    else if (fault === "missing-member") Object.assign(input, { pathMembership: [] });
    else if (fault === "accessor") Object.defineProperty(input.namedEndpoints[0]!, "name", { get() { throw new Error("must not invoke a caller accessor"); }, enumerable: true });
    else if (fault === "digest") { Object.assign(input, { digest: `sha256:${"0".repeat(64)}` }); reason = "digest_mismatch"; }
    else { Object.assign(input.namedEndpoints[0]!, { name: "self-consistent but not installed" }); value = redigest(input); reason = "digest_mismatch"; }
    const text = value === undefined || fault === "accessor" ? value : JSON.stringify(value);
    expect(await admitInstalledOpeningCatalogueText(text as never)).toEqual({ kind: "unavailable", reason });
  });

  it("async admission refuses an extra caller-supplied registration instead of using it", async () => {
    await expect((admitInstalledOpeningCatalogueText as (...args: unknown[]) => Promise<unknown>)(JSON.stringify(raw), { artifactDigest: raw.digest })).rejects.toThrow(/only the artifact/u);
  });

  it.each(["", "not JSON", "{", "null", "false", "42", '"catalogue"'])("classifies malformed/wrong-shaped startup JSON as invalid: %s", async text => {
    expect(await admitInstalledOpeningCatalogueText(text)).toEqual({ kind: "unavailable", reason: "artifact_invalid" });
  });

  it("admits the pinned complete document, owns its maps once, and preserves named/unnamed meanings", () => {
    const value = installed(), owner = readInstalledOpeningCatalogue(value.source);
    expect(owner).toBe(value.catalogue); expect(readInstalledOpeningCatalogue(value.source)).toBe(owner);
    expect(Object.keys(value.source)).toEqual(["ref"]); expect(value.source.ref).toBe(owner.ref);
    expect(isInstalledOpeningCatalogue(value.source)).toBe(true);
    expect(owner.artifact.namedEndpoints).toHaveLength(3810); expect(owner.artifact.pathMembership).toHaveLength(7854);
    const named = owner.openingIdentity(E4, 1);
    expect(named.currentEndpoint).toMatchObject({ kind: "matched", eco: "B00", name: "King's Pawn Game", observedPly: 1 });
    expect(named.catalogueMembership).toMatchObject({ kind: "member", descendantEndpointCount: 2023 });
    const unnamed = owner.openingIdentity(UNNAMED, 4);
    expect(unnamed.currentEndpoint).toMatchObject({ kind: "absent", reason: "no_named_endpoint" });
    expect(unnamed.catalogueMembership).toMatchObject({ kind: "member", descendantEndpointCount: 304 });
    expect(unnamed.catalogueMembership).not.toHaveProperty("name"); expect(unnamed.catalogueMembership).not.toHaveProperty("eco");
    expect(owner.openingIdentity(E4, 7).currentEndpoint).toMatchObject({ observedPly: 7 });
  });

  it("detaches the document, freezes every retained layer, and permits independent acquisition of the exact installation", () => {
    const input = structuredClone(raw), value = admitInstalledOpeningCatalogue(input);
    if (value.kind !== "available") throw Error("valid installation");
    const owner = readInstalledOpeningCatalogue(value.source), before = owner.openingIdentity(E4, 1);
    Object.assign(input.namedEndpoints[0]!, { name: "caller replacement" });
    expect(owner.openingIdentity(E4, 1)).toEqual(before); expect(owner.artifact).not.toBe(input);
    for (const target of [value, value.source, value.source.ref, owner, owner.artifact, owner.artifact.source,
      owner.artifact.namedEndpoints, owner.artifact.namedEndpoints[0]!, owner.artifact.pathMembership,
      owner.artifact.pathMembership[0]!, owner.artifact.source.files, owner.artifact.source.files[0]!,
      owner.artifact.source.compilerFiles, owner.artifact.source.compilerFiles[0]!]) expect(Object.isFrozen(target)).toBe(true);
    const other = installed(); expect(other.source).not.toBe(value.source); expect(other.source.ref).toEqual(value.source.ref);
  });

  it.each(["spread", "json", "ref-only", "methods", "compiled", "subclass"] as const)("refuses a %s source lookalike instead of accepting a matching digest", kind => {
    const actual = installed(), lookup = vi.fn(() => actual.catalogue.openingIdentity(E4, 1));
    const forged = kind === "spread" ? { ...actual.source } : kind === "json" ? JSON.parse(JSON.stringify(actual.source))
      : kind === "ref-only" ? actual.source.ref : kind === "compiled" ? compileLoadedOpeningCatalogue(raw)
      : kind === "subclass" ? Object.create(actual.source) : { ref: actual.source.ref, openingIdentity: lookup };
    expect(isInstalledOpeningCatalogue(forged)).toBe(false);
    expect(() => readInstalledOpeningCatalogue(forged as never)).toThrow(/not admitted/u); expect(lookup).not.toHaveBeenCalled();
  });

  it.each(["name", "count", "source-file", "compiler-file", "compiler-digest"] as const)("rejects self-consistent rewritten %s at installed admission, not structural compilation", field => {
    const changed = structuredClone(raw);
    if (field === "name") Object.assign(changed.namedEndpoints[0]!, { name: "invented catalogue name" });
    else if (field === "count") Object.assign(changed.pathMembership[0]!, { descendantEndpointCount: 123456 });
    else if (field === "source-file") Object.assign(changed.source.files[0]!, { sha256: `sha256:${"0".repeat(64)}` });
    else if (field === "compiler-file") Object.assign(changed.source.compilerFiles[0]!, { sha256: `sha256:${"0".repeat(64)}` });
    else Object.assign(changed.source, { compilerDigest: `sha256:${"0".repeat(64)}` });
    const rewritten = redigest(changed);
    expect(() => compileLoadedOpeningCatalogue(rewritten)).not.toThrow();
    expect(admitInstalledOpeningCatalogue(rewritten)).toEqual({ kind: "unavailable", reason: "digest_mismatch" });
  });

  it("classifies missing, malformed, wrong-source and inconsistent-digest installations separately", () => {
    expect(admitInstalledOpeningCatalogue()).toEqual({ kind: "unavailable", reason: "artifact_missing" });
    for (const value of [null, false, {}, { ...raw, extra: true }, { ...raw, schemaVersion: 1 },
      { ...raw, source: { ...raw.source, commit: "foreign-source" } }]) {
      expect(admitInstalledOpeningCatalogue(value)).toEqual({ kind: "unavailable", reason: "artifact_invalid" });
    }
    expect(admitInstalledOpeningCatalogue({ ...raw, digest: `sha256:${"0".repeat(64)}` })).toEqual({ kind: "unavailable", reason: "digest_mismatch" });
    expect(() => (admitInstalledOpeningCatalogue as (...args: unknown[]) => unknown)(raw, { artifactDigest: raw.digest })).toThrow(/only the artifact/u);
  });

  it.each(["blank-name", "blank-eco", "unsafe-count", "fractional-ply", "bad-file", "bad-digest", "extra-row"] as const)("the shared schema rejects %s even after redigest", fault => {
    const changed = structuredClone(raw);
    if (fault === "blank-name") Object.assign(changed.namedEndpoints[0]!, { name: " \t " });
    else if (fault === "blank-eco") Object.assign(changed.namedEndpoints[0]!, { eco: " " });
    else if (fault === "unsafe-count") Object.assign(changed.pathMembership[0]!, { descendantEndpointCount: Number.MAX_SAFE_INTEGER + 1 });
    else if (fault === "fractional-ply") Object.assign(changed.namedEndpoints[0]!, { sourcePly: 1.5 });
    else if (fault === "bad-file") Object.assign(changed.namedEndpoints[0]!, { sourceFile: "foreign.tsv" });
    else if (fault === "bad-digest") Object.assign(changed.source.files[0]!, { sha256: "invalid" });
    else Object.assign(changed.pathMembership[0]!, { name: "not a membership operand" });
    expect(() => compileLoadedOpeningCatalogue(redigest(changed))).toThrow(TypeError);
    expect(admitInstalledOpeningCatalogue(redigest(changed))).toEqual({ kind: "unavailable", reason: "artifact_invalid" });
  });

  it.each(["duplicate-endpoint", "duplicate-member", "unsorted-endpoints", "unsorted-members", "missing-membership", "file-order", "compiler-inventory"] as const)("rejects the complete relational defect %s", fault => {
    const changed = structuredClone(raw);
    if (fault === "duplicate-endpoint") (changed.namedEndpoints as unknown[]).push(changed.namedEndpoints[0]!);
    else if (fault === "duplicate-member") (changed.pathMembership as unknown[]).push(changed.pathMembership[0]!);
    else if (fault === "unsorted-endpoints") (changed.namedEndpoints as unknown[]).reverse();
    else if (fault === "unsorted-members") (changed.pathMembership as unknown[]).reverse();
    else if (fault === "missing-membership") Object.assign(changed, { pathMembership: changed.pathMembership.filter(row => row.key !== changed.namedEndpoints[0]!.key) });
    else if (fault === "file-order") (changed.source.files as unknown[]).reverse();
    else Object.assign(changed.source.compilerFiles[0]!, { path: "caller/compiler.ts" });
    expect(admitInstalledOpeningCatalogue(changed)).toEqual({ kind: "unavailable", reason: "artifact_invalid" });
    expect(() => compileLoadedOpeningCatalogue(redigest(changed))).toThrow(TypeError);
    expect(admitInstalledOpeningCatalogue(redigest(changed))).toEqual({ kind: "unavailable", reason: "artifact_invalid" });
  });

  it.each(["arbitrary", "counter-fields", "extra-spaces", "noncanonical-castling", "malformed-fen"] as const)("rejects %s keys before either digest decision", fault => {
    const changed = structuredClone(raw), originalKey = changed.namedEndpoints[0]!.key;
    const badKey = fault === "arbitrary" ? "not a chess key" : fault === "counter-fields" ? `${originalKey} 0 1`
      : fault === "extra-spaces" ? originalKey.replace(" ", "  ") : fault === "noncanonical-castling"
      ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w QKqk -" : "8/8/8/8/8/8/8/8 w - -";
    Object.assign(changed.namedEndpoints[0]!, { key: badKey });
    Object.assign(changed.pathMembership.find(row => row.key === originalKey)!, { key: badKey });
    Object.assign(changed, {
      namedEndpoints: [...changed.namedEndpoints].sort((a, b) => a.key.localeCompare(b.key)),
      pathMembership: [...changed.pathMembership].sort((a, b) => a.key.localeCompare(b.key)),
    });
    for (const value of [changed, redigest(changed)]) expect(admitInstalledOpeningCatalogue(value)).toEqual({ kind: "unavailable", reason: "artifact_invalid" });
  });

  it("a RangeError from malformed caller data is not a catalogue digest mismatch", () => {
    const proxy = new Proxy({}, { getPrototypeOf() { throw new RangeError("not a digest decision"); } });
    expect(admitInstalledOpeningCatalogue(proxy)).toEqual({ kind: "unavailable", reason: "artifact_invalid" });
  });

  it.each(["symbol", "hidden", "getter", "array-hole", "array-extra", "array-getter", "prototype", "cycle"] as const)("refuses non-JSON %s before it can become authority", fault => {
    const changed = structuredClone(raw), getter = vi.fn(() => "injected");
    if (fault === "symbol") Object.defineProperty(changed, Symbol("source"), { value: {} });
    else if (fault === "hidden") Object.defineProperty(changed, "override", { value: {} });
    else if (fault === "getter") Object.defineProperty(changed.namedEndpoints[0]!, "name", { enumerable: true, get: getter });
    else if (fault === "array-hole") delete (changed.namedEndpoints as unknown[])[0];
    else if (fault === "array-extra") Object.assign(changed.namedEndpoints, { override: "extra" });
    else if (fault === "array-getter") Object.defineProperty(changed.namedEndpoints, "0", { enumerable: true, get: getter });
    else if (fault === "prototype") Object.setPrototypeOf(changed, { expectedDigest: raw.digest });
    else Object.assign(changed, { cycle: changed });
    expect(admitInstalledOpeningCatalogue(changed)).toEqual({ kind: "unavailable", reason: "artifact_invalid" });
    expect(getter).not.toHaveBeenCalled();
  });

  it("browser-bundles the real runtime source without Node modules, server paths or the complete table", async () => {
    const output = await build({ entryPoints: [new URL("./opening-catalogue.ts", import.meta.url).pathname], bundle: true,
      platform: "browser", format: "esm", write: false, logLevel: "silent", metafile: true });
    const inputs = Object.keys(output.metafile!.inputs);
    expect(inputs.some(input => input.includes("apps/server"))).toBe(false);
    expect(inputs.some(input => input.endsWith("runtime-opening-catalogue.json"))).toBe(false);
    expect(inputs.some(input => input.endsWith("opening-catalogue-registration.json"))).toBe(true);
  });
});
