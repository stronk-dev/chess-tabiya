import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

import {
  collectPromotionRaceTablebase as collectCurrent,
  createTestInstalledPromotionInventoryAuthority,
  parsePromotionGeneration,
  recordedAuthorityReceipt as receiptCurrent,
} from "../d2835-semantic-collectors-promotion-twelfth-author-repair/model.js";
import {
  collectPromotionRaceTablebase as collectPredecessor,
  recordedAuthorityReceipt as receiptPredecessor,
} from "../d2789-semantic-collectors-promotion-eleventh-author-repair/model.js";

const digest = `sha256:${"1".repeat(64)}` as const;

describe("semantic collectors promotion thirteenth fresh review", () => {
  test("D2864 the exported test issuer converts any caller path into installation authority", () => {
    const callerPath = resolve("caller-controlled/promotion-installation.json");
    const authority = createTestInstalledPromotionInventoryAuthority(callerPath);

    expect(authority.inventoryPath).toBe(callerPath);
    expect(authority.kind).toBe("application_installed_promotion_inventory");
  });

  test("D2865 issued authority binds a path but no expected inventory identity", () => {
    const authority = createTestInstalledPromotionInventoryAuthority("mutable/promotion-installation.json");

    expect(Object.keys(authority).sort()).toEqual(["inventoryPath", "kind"]);
    expect(authority).not.toHaveProperty("inventoryDigest");
    expect(authority).not.toHaveProperty("inventoryBytes");
  });

  test("D2866 registry construction joins entries from one read to digest and stores from another", async () => {
    const source = await readFile(
      resolve("tools/d2835-semantic-collectors-promotion-twelfth-author-repair/model.ts"),
      "utf8",
    );

    expect(source).toMatch(/const inventory = await canonicalFile\(inventoryPath\)/u);
    expect(source).toMatch(/const entries = parseInventory\(inventory\.value\)/u);
    expect(source).toMatch(/const prior = await openPriorRegistry\(inventoryPath\)/u);
    expect(source).toMatch(/inventoryDigest: prior\.inventoryDigest/u);
    expect(source).toMatch(/return prior\.openGeneration\(generationId\)/u);
    expect(source).not.toMatch(/prior\.inventoryDigest\s*!==\s*inventory\.digest/u);
  });

  test("D2867 current collection and receipt authority are the predecessor operations", () => {
    expect(collectCurrent).toBe(collectPredecessor);
    expect(receiptCurrent).toBe(receiptPredecessor);
  });

  test("D2868 an empty installed-generation population passes the new parser", () => {
    const parsed = parsePromotionGeneration({
      schema: "tabiya.promotion-generation.v1",
      generationId: "empty-generation",
      pack: { path: "pack.json", digest },
      sources: { path: "sources.json", digest },
      evidence: { path: "evidence.json", digest },
      responses: [],
      legalMaps: [],
    });

    expect(parsed.responses).toEqual([]);
    expect(parsed.legalMaps).toEqual([]);
  });
});
