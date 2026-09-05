import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it } from "vitest";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/index.js";
import * as current from "../d2864-semantic-collectors-promotion-thirteenth-author-repair/model.js";

const MODEL_SOURCE = readFileSync(new URL("../d2864-semantic-collectors-promotion-thirteenth-author-repair/model.ts", import.meta.url), "utf8");
const roots: string[] = [];

afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

async function arbitraryInventory() {
  const root = await mkdtemp(resolve(tmpdir(), "tabiya-promotion-fourteenth-review-"));
  roots.push(root);
  const inventoryPath = resolve(root, "attacker-chosen.json");
  const value = {
    schema: "tabiya.promotion-installation.v1",
    generations: [{
      generationId: "missing-generation",
      directory: "does-not-exist",
      manifestDigest: `sha256:${"1".repeat(64)}`,
    }],
  };
  await writeFile(inventoryPath, `${canonicalizeJson(value)}\n`, "utf8");
  return { inventoryPath };
}

describe("D2892-D2896 promotion fourteenth fresh review", () => {
  it("D2892 renames the public raw-path issuer instead of restricting it to application composition", async () => {
    const fixture = await arbitraryInventory();
    const application = await current.openPromotionApplication(fixture.inventoryPath);
    expect(application.installation.inventoryPath).toBe(await realpath(fixture.inventoryPath));
    await expect(application.openRegistry()).resolves.toMatchObject({ application });
  });

  it("D2893 implements the current production path by invoking the predecessor test-only issuer", () => {
    expect(MODEL_SOURCE).toContain("prior.createTestInstalledPromotionInventoryAuthority(snapshot.inventoryPath)");
    expect(MODEL_SOURCE).toContain("const delegated = await prior.openPromotionInstallationRegistry(delegatedAuthority)");
  });

  it("D2894 publishes an installed registry while its only declared generation does not exist", async () => {
    const fixture = await arbitraryInventory();
    const application = await current.openPromotionApplication(fixture.inventoryPath);
    const registry = await application.openRegistry();
    expect(application.installation.entries).toHaveLength(1);
    await expect(registry.openGeneration("missing-generation")).rejects.toThrow();
  });

  it("D2895 one application issues multiple simultaneously valid current registries", async () => {
    const fixture = await arbitraryInventory();
    const application = await current.openPromotionApplication(fixture.inventoryPath);
    const [first, second] = await Promise.all([application.openRegistry(), application.openRegistry()]);
    expect(first).not.toBe(second);
    expect(first.application).toBe(application);
    expect(second.application).toBe(application);
  });

  it("D2896 generation caching is not single-flight across the first awaited read", () => {
    const body = MODEL_SOURCE.slice(MODEL_SOURCE.indexOf("async openGeneration(generationId: string)"), MODEL_SOURCE.indexOf("REGISTRIES.add(registry)"));
    expect(body.indexOf("const existing = stores.get(generationId)")).toBeLessThan(body.indexOf("await realpath(generationPath)"));
    expect(body.indexOf("await realpath(generationPath)")).toBeLessThan(body.indexOf("stores.set(generationId, store)"));
    expect(body).not.toContain("Map<string, Promise<PromotionArtifactStore>>");
  });
});
