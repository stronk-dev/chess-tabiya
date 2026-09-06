import { mkdtemp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it } from "vitest";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/index.js";
import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
import { openPromotionApplication } from "./model.js";
import { createTestInstalledPromotionConfiguration } from "./test-fixture.js";

const roots: string[] = [];
const MODEL_SOURCE = readFileSync(new URL("./model.ts", import.meta.url), "utf8");
const FEN = "8/7P/8/8/8/8/p7/4K2k w - - 0 1";

afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

async function canonical(path: string, value: unknown) {
  const bytes = `${canonicalizeJson(value)}\n`;
  await writeFile(path, bytes, "utf8");
  return Object.freeze({ bytes, digest: sha256(bytes) as `sha256:${string}` });
}

async function installation(generationIds: readonly string[] = ["generation-1"]) {
  const root = await mkdtemp(resolve(tmpdir(), "tabiya-promotion-fourteenth-author-"));
  roots.push(root);
  const entries = [];
  for (const generationId of generationIds) {
    const generationRoot = resolve(root, generationId);
    await mkdir(generationRoot);
    const pack = await canonical(resolve(generationRoot, "pack.json"), { id: generationId, start: { fen: FEN } });
    const sources = await canonical(resolve(generationRoot, "sources.json"), { schema: "fixture.sources", entries: [] });
    const evidence = await canonical(resolve(generationRoot, "evidence.json"), {
      schema: "fixture.evidence",
      records: [{
        kind: "tablebase_result",
        anchor: { fen: FEN },
        sourceId: "syzygy",
        retrievedAt: "2026-08-15T20:11:18.321Z",
        supports: ["/start/fen"],
      }],
    });
    const response = await canonical(resolve(generationRoot, "response.json"), { category: "win", dtz: 1 });
    const legal = await canonical(resolve(generationRoot, "legal.json"), { schema: "fixture.legal", fen: FEN, pieces: [] });
    const generation = {
      schema: "tabiya.promotion-generation.v1",
      generationId,
      pack: { path: "pack.json", digest: pack.digest },
      sources: { path: "sources.json", digest: sources.digest },
      evidence: { path: "evidence.json", digest: evidence.digest },
      responses: [{ fen: FEN, sourceId: "syzygy", retrievedAt: "2026-08-15T20:11:18.321Z", path: "response.json", digest: response.digest, bytes: Buffer.byteLength(response.bytes) }],
      legalMaps: [{ fen: FEN, status: "available", path: "legal.json", digest: legal.digest }],
    };
    const manifest = await canonical(resolve(generationRoot, "promotion-generation.json"), generation);
    entries.push({ generationId, directory: generationId, manifestDigest: manifest.digest });
  }
  const inventoryPath = resolve(root, "promotion-installation.json");
  await canonical(inventoryPath, { schema: "tabiya.promotion-installation.v1", generations: entries });
  return { root, inventoryPath };
}

describe("D2892-D2896 promotion fourteenth author repair", () => {
  it("D2892 accepts only a runtime-issued installed configuration, never a caller path or copy", async () => {
    const fixture = await installation();
    const configuration = await createTestInstalledPromotionConfiguration(fixture.inventoryPath);
    expect(() => openPromotionApplication(configuration)).not.toThrow();
    expect(() => openPromotionApplication({ ...configuration })).toThrow("INSTALLED_PROMOTION_CONFIGURATION_REQUIRED");
    expect(() => openPromotionApplication(fixture.inventoryPath as never)).toThrow("INSTALLED_PROMOTION_CONFIGURATION_REQUIRED");
  });

  it("D2893 keeps the raw-path test issuer and predecessor issuer out of the product model graph", () => {
    expect(MODEL_SOURCE).not.toContain("test-fixture");
    expect(MODEL_SOURCE).not.toMatch(/from ["']\.\.\/d\d+/u);
    expect(MODEL_SOURCE).not.toContain("createTestInstalledPromotionInventoryAuthority");
    expect(MODEL_SOURCE).not.toContain("openPromotionInstallationRegistry");
    expect(MODEL_SOURCE).not.toContain("openPromotionApplication(snapshot.inventoryPath)");
  });

  it("D2894 validates every listed generation before publishing any registry", async () => {
    const fixture = await installation(["generation-1", "generation-2"]);
    await rm(resolve(fixture.root, "generation-2", "legal.json"));
    const configuration = await createTestInstalledPromotionConfiguration(fixture.inventoryPath);
    const application = openPromotionApplication(configuration);
    await expect(application.openRegistry()).rejects.toThrow();
  });

  it("D2895 single-flights one current registry and evicts a failed construction", async () => {
    const fixture = await installation();
    const configuration = await createTestInstalledPromotionConfiguration(fixture.inventoryPath);
    const application = openPromotionApplication(configuration);
    const [first, second] = await Promise.all([application.openRegistry(), application.openRegistry()]);
    expect(first).toBe(second);

    const broken = await installation();
    const missing = resolve(broken.root, "generation-1", "legal.json");
    const parked = resolve(broken.root, "generation-1", "legal.parked.json");
    await rename(missing, parked);
    const retryApplication = openPromotionApplication(await createTestInstalledPromotionConfiguration(broken.inventoryPath));
    await expect(retryApplication.openRegistry()).rejects.toThrow();
    await rename(parked, missing);
    await expect(retryApplication.openRegistry()).resolves.toMatchObject({ generationIds: ["generation-1"] });
  });

  it("D2896 single-flights a generation store and evicts a failed first-open promise", async () => {
    const fixture = await installation();
    const application = openPromotionApplication(await createTestInstalledPromotionConfiguration(fixture.inventoryPath));
    const registry = await application.openRegistry();
    const [first, second] = await Promise.all([registry.openGeneration("generation-1"), registry.openGeneration("generation-1")]);
    expect(first).toBe(second);
    expect(first.registry).toBe(registry);

    const retryRegistry = await openPromotionApplication(
      await createTestInstalledPromotionConfiguration(fixture.inventoryPath),
    ).openRegistry();
    const response = resolve(fixture.root, "generation-1", "response.json");
    const parked = resolve(fixture.root, "generation-1", "response.parked.json");
    await rename(response, parked);
    await expect(retryRegistry.openGeneration("generation-1")).rejects.toThrow();
    await rename(parked, response);
    await expect(retryRegistry.openGeneration("generation-1")).resolves.toMatchObject({ generationId: "generation-1" });
  });
});
