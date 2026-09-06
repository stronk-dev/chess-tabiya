import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { parseTablebasePosition } from "../../apps/server/src/tablebase.js";
import { validatePackDocument } from "../../apps/server/src/pack-validation.js";
import { canonicalizeJson } from "../../packages/schema/src/drill-pack/index.js";
import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
import {
  INSTALLED_CONFIGURATIONS,
  type Digest,
  type InstalledPromotionConfiguration,
  type InstalledPromotionSnapshot,
} from "../d2892-semantic-collectors-promotion-fourteenth-author-repair/configuration-state.js";
import {
  openPromotionApplication,
} from "../d2892-semantic-collectors-promotion-fourteenth-author-repair/model.js";
import { createTestInstalledPromotionConfiguration } from "../d2892-semantic-collectors-promotion-fourteenth-author-repair/test-fixture.js";

const roots: string[] = [];
const MODEL_SOURCE = readFileSync(
  new URL("../d2892-semantic-collectors-promotion-fourteenth-author-repair/model.ts", import.meta.url),
  "utf8",
);
const CONFIGURATION_SOURCE = readFileSync(
  new URL("../d2892-semantic-collectors-promotion-fourteenth-author-repair/configuration-state.ts", import.meta.url),
  "utf8",
);
const FIXTURE_SOURCE = readFileSync(
  new URL("../d2892-semantic-collectors-promotion-fourteenth-author-repair/test-fixture.ts", import.meta.url),
  "utf8",
);
const FEN = "8/7P/8/8/8/8/p7/4K2k w - - 0 1";

afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

async function canonical(path: string, value: unknown) {
  const bytes = `${canonicalizeJson(value)}\n`;
  await writeFile(path, bytes, "utf8");
  return Object.freeze({ bytes, digest: sha256(bytes) as Digest });
}

async function semanticallyInvalidInstallation() {
  const root = await mkdtemp(resolve(tmpdir(), "tabiya-promotion-fifteenth-review-"));
  roots.push(root);
  const generationRoot = resolve(root, "generation-1");
  await mkdir(generationRoot);

  const packValue = { id: "not-a-pack", start: { fen: FEN } };
  const responseValue = { category: "invented-outcome", dtz: "soon" };
  const pack = await canonical(resolve(generationRoot, "pack.json"), packValue);
  const sources = await canonical(resolve(generationRoot, "sources.json"), { schema: "not-a-source-registry", entries: "anything" });
  const evidence = await canonical(resolve(generationRoot, "evidence.json"), {
    records: [{
      kind: "tablebase_result",
      anchor: { fen: FEN },
      sourceId: "syzygy",
      retrievedAt: "2026-08-15T20:11:18.321Z",
      supports: ["/start/fen"],
    }],
  });
  const response = await canonical(resolve(generationRoot, "response.json"), responseValue);
  const legal = await canonical(resolve(generationRoot, "legal.json"), { schema: "not-a-legal-map", moves: "anything" });
  const manifest = await canonical(resolve(generationRoot, "promotion-generation.json"), {
    schema: "tabiya.promotion-generation.v1",
    generationId: "generation-1",
    pack: { path: "pack.json", digest: pack.digest },
    sources: { path: "sources.json", digest: sources.digest },
    evidence: { path: "evidence.json", digest: evidence.digest },
    responses: [{
      fen: FEN,
      sourceId: "syzygy",
      retrievedAt: "2026-08-15T20:11:18.321Z",
      path: "response.json",
      digest: response.digest,
      bytes: Buffer.byteLength(response.bytes),
    }],
    legalMaps: [{ fen: FEN, status: "available", path: "legal.json", digest: legal.digest }],
  });
  const inventoryPath = resolve(root, "promotion-installation.json");
  await canonical(inventoryPath, {
    schema: "tabiya.promotion-installation.v1",
    generations: [{ generationId: "generation-1", directory: "generation-1", manifestDigest: manifest.digest }],
  });
  return Object.freeze({ inventoryPath, packValue, responseValue });
}

describe("held promotion collectors fifteenth fresh review", () => {
  it("D2929 exports the mutable issuer map, so any same-package importer can mint accepted authority", () => {
    const configuration = Object.freeze({ kind: "installed_promotion_configuration" }) as InstalledPromotionConfiguration;
    const snapshot = Object.freeze({
      kind: "installed_promotion_configuration_snapshot" as const,
      inventoryPath: "/attacker/inventory.json",
      inventoryRoot: "/attacker",
      inventoryBytes: "{}\n",
      inventoryDigest: `sha256:${"0".repeat(64)}` as Digest,
      entries: Object.freeze([]),
    }) satisfies InstalledPromotionSnapshot;
    INSTALLED_CONFIGURATIONS.set(configuration, snapshot);

    expect(openPromotionApplication(configuration).installation).toBe(snapshot);
  });

  it("D2930 has no product composition issuer; only the explicitly test-only fixture can create authority", () => {
    expect(MODEL_SOURCE).not.toContain("INSTALLED_CONFIGURATIONS.set");
    expect(CONFIGURATION_SOURCE).not.toContain("INSTALLED_CONFIGURATIONS.set");
    expect(FIXTURE_SOURCE).toContain("createTestInstalledPromotionConfiguration");
    expect(FIXTURE_SOURCE).toContain("INSTALLED_CONFIGURATIONS.set");
  });

  it("D2931 publishes a registry over a pack and provider response rejected by production validators", async () => {
    const fixture = await semanticallyInvalidInstallation();
    expect(validatePackDocument(fixture.packValue).valid).toBe(false);
    expect(() => parseTablebasePosition(fixture.responseValue)).toThrow();

    const application = openPromotionApplication(
      await createTestInstalledPromotionConfiguration(fixture.inventoryPath),
    );
    await expect(application.openRegistry()).resolves.toMatchObject({ generationIds: ["generation-1"] });
  });

  it("D2932 replaces the recorded/legal artifact store with declarations that expose no lookup operations", async () => {
    const fixture = await semanticallyInvalidInstallation();
    const registry = await openPromotionApplication(
      await createTestInstalledPromotionConfiguration(fixture.inventoryPath),
    ).openRegistry();
    const store = await registry.openGeneration("generation-1");

    expect(Object.keys(store).sort()).toEqual(["application", "generation", "generationId", "registry"]);
    expect("lookup" in store).toBe(false);
    expect("legalStatus" in store).toBe(false);
  });

  it("D2933 deletes the sealed request, collection, result assertion and current receipt operations", () => {
    expect(MODEL_SOURCE).not.toContain("createPromotionRaceTablebaseRequest");
    expect(MODEL_SOURCE).not.toContain("collectPromotionRaceTablebase");
    expect(MODEL_SOURCE).not.toContain("assertPromotionRaceTablebaseResult");
    expect(MODEL_SOURCE).not.toContain("recordedAuthorityReceipt");
  });
});
