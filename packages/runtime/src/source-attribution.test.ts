// D3107: the source-attribution registry issues identity only for its exact parsed semantic image.
import { createHash } from "node:crypto";

import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import {
  PRIMARY_EVIDENCE_MANIFEST,
  SOURCE_ATTRIBUTION_REGISTRY_IMAGE,
  SOURCE_ATTRIBUTION_REGISTRY_RESOURCE,
  parseSourceAttributionRegistryImage,
  resolveSourceAttribution,
  sourceAttributionRegistryDigest,
  type ParsedSourceAttributionRegistryImage,
} from "./index.js";
import * as sourceAttributionModule from "./source-attribution.js";

const json = (value: unknown): Record<string, unknown> => JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
const STOCKFISH_SHA = `sha256:${"1".repeat(64)}`;

/** Every leaf path of the image, so each semantic field can be mutated in turn. */
function leafPaths(value: unknown, path: readonly (string | number)[] = []): (readonly (string | number)[])[] {
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => leafPaths(item, [...path, Array.isArray(value) ? Number(key) : key]));
  }
  return [path];
}

function mutate(image: Record<string, unknown>, path: readonly (string | number)[], next: unknown): Record<string, unknown> {
  const copy = json(image);
  let cursor: Record<string | number, unknown> = copy;
  for (const key of path.slice(0, -1)) cursor = cursor[key] as Record<string | number, unknown>;
  cursor[path.at(-1)!] = next;
  return copy;
}

describe("D3107 source-attribution registry identity", () => {
  it("refuses the partial three-field image the author model hashed", () => {
    const partial = { id: "source-attribution-registry", version: 1, rows: [] };
    expect(() => parseSourceAttributionRegistryImage(partial)).toThrow(TypeError);
    expect(() => sourceAttributionRegistryDigest(partial as unknown as ParsedSourceAttributionRegistryImage)).toThrow(/parseSourceAttributionRegistryImage/u);
    expect(() => parseSourceAttributionRegistryImage({ ...json(SOURCE_ATTRIBUTION_REGISTRY_IMAGE), rows: [] })).toThrow(/non-empty/u);
  });

  it("refuses spread and JSON copies of a parsed image; only the parser issues identity", () => {
    const spread = { ...SOURCE_ATTRIBUTION_REGISTRY_IMAGE } as ParsedSourceAttributionRegistryImage;
    const copy = json(SOURCE_ATTRIBUTION_REGISTRY_IMAGE) as unknown as ParsedSourceAttributionRegistryImage;
    expect(() => sourceAttributionRegistryDigest(spread)).toThrow(TypeError);
    expect(() => sourceAttributionRegistryDigest(copy)).toThrow(TypeError);
    const reparsed = parseSourceAttributionRegistryImage(copy);
    expect(reparsed).not.toBe(copy);
    expect(Object.isFrozen(reparsed) && Object.isFrozen(reparsed.rows[0]!.attribution.licence)).toBe(true);
    expect(sourceAttributionRegistryDigest(reparsed)).toBe(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.digest);
  });

  it("digests the domain-separated RFC 8785 image with SHA-256", () => {
    const expected = createHash("sha256").update(`chess-tabiya/source-attribution-registry@1\u0000${canonicalizeJson(SOURCE_ATTRIBUTION_REGISTRY_IMAGE)}`, "utf8").digest("hex");
    expect(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE).toEqual({ id: "source-attribution-registry", version: 1, digest: `sha256:${expected}` });
  });

  it("changes the digest when any semantic field changes, or refuses the changed image", () => {
    const base = json(SOURCE_ATTRIBUTION_REGISTRY_IMAGE);
    const paths = leafPaths(base);
    expect(paths.length).toBeGreaterThan(40);
    for (const path of paths) {
      const current = path.reduce<unknown>((cursor, key) => (cursor as Record<string | number, unknown>)[key], base);
      const next = typeof current === "number" ? current + 1 : `${String(current)}-changed`;
      let digest: string | undefined;
      try { digest = sourceAttributionRegistryDigest(parseSourceAttributionRegistryImage(mutate(base, path, next))); } catch { digest = undefined; }
      expect(digest, path.join(".")).not.toBe(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.digest);
    }
    // Free-text fields that still parse must yield a different identity (not merely a refusal).
    const retitled = parseSourceAttributionRegistryImage(mutate(base, ["rows", 0, "attribution", "title"], "Stockfish engine reading (retitled)"));
    expect(sourceAttributionRegistryDigest(retitled)).not.toBe(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.digest);
    const dropped = parseSourceAttributionRegistryImage({ ...base, rows: (base.rows as unknown[]).slice(1) });
    expect(sourceAttributionRegistryDigest(dropped)).not.toBe(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.digest);
  });

  it("refuses unknown keys, unknown resolvers, unknown policies and receipt fields on remote endpoints", () => {
    const base = json(SOURCE_ATTRIBUTION_REGISTRY_IMAGE);
    expect(() => parseSourceAttributionRegistryImage({ ...base, extra: 1 })).toThrow(/unregistered key/u);
    expect(() => parseSourceAttributionRegistryImage(mutate(base, ["resolver", "symbol"], "resolveAnything"))).toThrow(/unknown resolver/u);
    expect(() => parseSourceAttributionRegistryImage({ ...base, missingReceiptField: "guess" })).toThrow(/missing-metadata policy/u);
    expect(() => parseSourceAttributionRegistryImage(mutate(base, ["rows", 3, "attribution", "revision"], { kind: "deployment_receipt", field: "sha256" }))).toThrow(/deployment receipt/u);
    expect(() => parseSourceAttributionRegistryImage(mutate(base, ["rows", 0, "attribution", "licence"], { kind: "deployment_receipt", field: "guess" }))).toThrow(/field/u);
    expect(() => parseSourceAttributionRegistryImage({ ...base, rows: [...(base.rows as unknown[]), (base.rows as unknown[])[0]] })).toThrow(/once/u);
  });

  it("refuses values with no canonical JSON: lone surrogates and NaN", () => {
    const base = json(SOURCE_ATTRIBUTION_REGISTRY_IMAGE);
    expect(() => parseSourceAttributionRegistryImage(mutate(base, ["rows", 0, "attribution", "title"], "Stockfish \ud800"))).toThrow(/surrogate/u);
    expect(() => parseSourceAttributionRegistryImage({ ...base, version: Number.NaN })).toThrow(TypeError);
  });

  it("names live catalogue projections and a resolver that exists in the module", () => {
    const projections = new Set(PRIMARY_EVIDENCE_MANIFEST.projections.map((entry) => `${entry.id}@${entry.version}`));
    for (const row of SOURCE_ATTRIBUTION_REGISTRY_IMAGE.rows) expect(projections.has(row.sourceProjection), row.sourceProjection).toBe(true);
    const resolver = (sourceAttributionModule as Record<string, unknown>)[SOURCE_ATTRIBUTION_REGISTRY_IMAGE.resolver.symbol];
    expect(resolver).toBe(resolveSourceAttribution);
  });

  it("resolves complete attribution from the exact receipt and abstains when receipt metadata is missing", () => {
    const stockfish = resolveSourceAttribution("live.stockfish.eval@1", { kind: "deployment_artifact", artifactId: "stockfish", sha256: STOCKFISH_SHA });
    expect(stockfish).toEqual({
      kind: "attributed",
      sourceProjection: "live.stockfish.eval@1",
      registry: SOURCE_ATTRIBUTION_REGISTRY_RESOURCE,
      attribution: {
        source: "Stockfish", title: "Stockfish engine reading", locator: "deployment-artifact:stockfish",
        licence: { authority: "source-attribution-registry@1", value: "GPL-3.0-only" },
        url: "https://stockfishchess.org/",
        revision: { authority: "deployment-receipt@1", value: STOCKFISH_SHA },
      },
    });
    const absent = { kind: "absent", reason: "source_attribution_absent" };
    expect(resolveSourceAttribution("live.stockfish.eval@1", { kind: "deployment_artifact", artifactId: "stockfish" })).toEqual(absent);
    expect(resolveSourceAttribution("live.stockfish.eval@1", { kind: "deployment_artifact", artifactId: "stockfish", sha256: "not-a-digest" })).toEqual(absent);
    expect(resolveSourceAttribution("live.stockfish.eval@1", { kind: "deployment_artifact", artifactId: "maia_model", sha256: STOCKFISH_SHA })).toEqual(absent);
    expect(resolveSourceAttribution("live.stockfish.eval@1", null)).toEqual(absent);
    expect(resolveSourceAttribution("live.stockfish.uci_response@1", { kind: "deployment_artifact", artifactId: "stockfish", sha256: STOCKFISH_SHA })).toEqual(absent);

    // The Maia licence and revision are receipt fields: never guessed.
    expect(resolveSourceAttribution("human.maia.event@1", { kind: "deployment_artifact", artifactId: "maia_model", model_revision: "maia3-2026-05" })).toEqual(absent);
    expect(resolveSourceAttribution("human.maia.event@1", { kind: "deployment_artifact", artifactId: "maia_model", spdx: "GPL-3.0-only" })).toEqual(absent);
    const maia = resolveSourceAttribution("human.maia.event@1", { kind: "deployment_artifact", artifactId: "maia_model", spdx: "GPL-3.0-only", model_revision: "maia3-2026-05" });
    expect(maia.kind === "attributed" && maia.attribution.licence).toEqual({ authority: "deployment-receipt@1", value: "GPL-3.0-only" });
    expect(maia.kind === "attributed" && maia.attribution.revision).toEqual({ authority: "deployment-receipt@1", value: "maia3-2026-05" });

    const tablebase = resolveSourceAttribution("live.syzygy.result@1", { kind: "remote_endpoint", endpointId: "lichess_tablebase" });
    expect(tablebase.kind === "attributed" && tablebase.attribution.revision).toEqual({ authority: "source-attribution-registry@1", value: "standard-endpoint-contract@1" });
    expect(resolveSourceAttribution("live.syzygy.result@1", undefined)).toEqual(absent);
  });
});
