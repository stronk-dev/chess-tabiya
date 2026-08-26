import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = new URL("../../", import.meta.url);

function source(path: string): string {
  return readFileSync(new URL(path, ROOT), "utf8");
}

function balancedBody(text: string, anchor: string): string {
  const anchored = text.indexOf(anchor);
  if (anchored < 0) throw new Error(`Missing source anchor: ${anchor}`);
  const start = text.indexOf("{", anchored);
  if (start < 0) throw new Error(`Missing source body after: ${anchor}`);
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === "{") depth += 1;
    if (text[index] === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  throw new Error(`Unclosed source body after: ${anchor}`);
}

function productionTsFiles(directory: string): readonly string[] {
  return readdirSync(new URL(directory, ROOT), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".integration.ts"))
    .map((entry) => join(directory, entry.name));
}

describe("profile identity route at HEAD", () => {
  const runtimeTypes = source("packages/runtime/src/types.ts");
  const serverService = source("apps/server/src/service.ts");
  const serverSelector = source("apps/server/src/opponent-selector.ts");
  const serverCatalog = source("apps/server/src/bot-policy-catalog.ts");
  const serverCapabilities = source("apps/server/src/capabilities.ts");
  const webApi = source("apps/web/src/lib/api.ts");
  const webController = source("apps/web/src/lib/session-controller.ts");
  const runSchema = JSON.parse(source("schemas/drill_run.schema.json")) as { $defs: Record<string, { properties?: Record<string, unknown> }> };

  it("has the parser and cache-key entrance, but no run identity carrier", () => {
    expect(balancedBody(serverSelector, "function validateProfilePolicy(")).toContain("policy.profile");
    expect(balancedBody(serverSelector, "function selectionCacheKey(")).toContain("request.policy.profile?.digest");
    expect(balancedBody(runtimeTypes, "export interface RunOpponentPolicy")).not.toContain("profile");
    expect(Object.keys(runSchema.$defs.runOpponentPolicy!.properties ?? {})).not.toContain("profile");
  });

  it("drops profile identity from both public create-run contracts", () => {
    expect(balancedBody(serverService, "export interface CreateRunRequest")).not.toContain("profile");
    expect(balancedBody(webApi, "export interface CreateRunRequest")).not.toContain("profile");
  });

  it("drops profile identity from the client request type and both request builders", () => {
    expect(balancedBody(webApi, "export interface SelectMoveRequest")).not.toContain("profile");
    expect(balancedBody(serverService, "#selectionRequest(")).not.toContain("profile");
    expect(balancedBody(webController, "#selectionRequest()")).not.toContain("profile");
  });

  it("never composes the profile on the non-test human-common path", () => {
    expect(balancedBody(serverSelector, "async #humanCommon(")).not.toContain("composeBotPolicySelection");
    const production = productionTsFiles("apps/server/src").map(source).join("\n");
    expect(production.match(/composeBotPolicySelection\s*\(/gu)).toHaveLength(1);
    expect(serverCatalog.match(/export function composeBotPolicySelection\s*\(/gu)).toHaveLength(1);
  });

  it("has no persisted policy decision carrier on selection or its schema", () => {
    expect(balancedBody(runtimeTypes, "export interface OpponentSelection")).not.toMatch(/policy(?:Record|Decision|Receipt)/u);
    expect(Object.keys(runSchema.$defs.opponentSelection!.properties ?? {})).not.toMatchObject(expect.arrayContaining(["policy"]));
  });

  it("does not advertise the compiled roster through capabilities", () => {
    const capabilities = balancedBody(serverCapabilities, "export interface Capabilities");
    expect(capabilities).not.toMatch(/botProfiles|botRoster|policyCatalog/u);
    expect(balancedBody(serverCapabilities, "async get()")).not.toContain("BOT_POLICY_PROFILES");
  });
});

describe("production operation census", () => {
  it("names the exact twelve operations and their current closure", () => {
    const rows = [
      ["run.create.profile_ref", false],
      ["run.resume.profile_ref", false],
      ["client.selection_request.profile_ref", false],
      ["server.selection_request.profile_ref", true],
      ["selection.cache.profile_ref", true],
      ["maia.complete_vector", true],
      ["guard.receipt", false],
      ["trait.view", false],
      ["policy.compose", false],
      ["selection.persist.policy_record", false],
      ["capabilities.roster", false],
      ["card.projection", false],
    ] as const;
    expect(rows).toHaveLength(12);
    expect(rows.filter(([, present]) => present).map(([id]) => id)).toEqual([
      "server.selection_request.profile_ref",
      "selection.cache.profile_ref",
      "maia.complete_vector",
    ]);
    expect(rows.filter(([, present]) => !present)).toHaveLength(9);
  });
});
