// TEST FIXTURE ONLY. This file is deliberately absent from the product model's import graph.
import { readFile, realpath } from "node:fs/promises";
import { dirname } from "node:path";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/index.js";
import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
import {
  INSTALLED_CONFIGURATIONS,
  type Digest,
  type InstalledPromotionConfiguration,
  type InstalledPromotionSnapshot,
  type InventoryEntry,
} from "./configuration-state.js";

type JsonObject = Record<string, unknown>;

export async function createTestInstalledPromotionConfiguration(
  inventoryPath: string,
): Promise<InstalledPromotionConfiguration> {
  const exactPath = await realpath(inventoryPath);
  const inventoryBytes = await readFile(exactPath, "utf8");
  const value = JSON.parse(inventoryBytes) as unknown;
  if (inventoryBytes !== `${canonicalizeJson(value)}\n`) fail("PROMOTION_ARTIFACT_NONCANONICAL");
  const row = object(value, "PROMOTION_INSTALLATION_INVALID");
  exact(row, ["schema", "generations"], "PROMOTION_INSTALLATION_INVALID");
  if (row.schema !== "tabiya.promotion-installation.v1" || !Array.isArray(row.generations) || row.generations.length === 0) {
    fail("PROMOTION_INSTALLATION_INVALID");
  }
  const entries = row.generations.map((candidate) => {
    const item = object(candidate, "PROMOTION_INSTALLATION_INVALID");
    exact(item, ["generationId", "directory", "manifestDigest"], "PROMOTION_INSTALLATION_INVALID");
    if (!nonempty(item.generationId) || !relative(item.directory) || !digest(item.manifestDigest)) fail("PROMOTION_INSTALLATION_INVALID");
    return immutable({ generationId: item.generationId, directory: item.directory, manifestDigest: item.manifestDigest }) as InventoryEntry;
  });
  if (new Set(entries.map((entry) => entry.generationId)).size !== entries.length) fail("PROMOTION_INSTALLATION_INVALID");
  const snapshot = immutable({
    kind: "installed_promotion_configuration_snapshot" as const,
    inventoryPath: exactPath,
    inventoryRoot: dirname(exactPath),
    inventoryBytes,
    inventoryDigest: sha256(inventoryBytes) as Digest,
    entries: Object.freeze(entries),
  }) as InstalledPromotionSnapshot;
  const authority = Object.freeze({ kind: "installed_promotion_configuration" as const });
  INSTALLED_CONFIGURATIONS.set(authority, snapshot);
  return authority;
}

function object(value: unknown, code: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(code);
  return value as JsonObject;
}
function exact(value: JsonObject, keys: readonly string[], code: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
}
function nonempty(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function relative(value: unknown): value is string { return nonempty(value) && !value.startsWith("/") && !value.split("/").includes(".."); }
function digest(value: unknown): value is Digest { return typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value); }
function immutable<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  if (Array.isArray(value)) return Object.freeze(value.map(immutable)) as T;
  return Object.freeze(Object.fromEntries(Object.entries(value as JsonObject).map(([key, child]) => [key, immutable(child)]))) as T;
}
function fail(code: string): never { throw new TypeError(code); }
