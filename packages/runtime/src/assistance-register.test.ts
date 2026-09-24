import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { ASSISTANCE_CONFIG_VERSIONS, SILENT_ASSISTANCE } from "./assistance.js";
import { WORKFLOW_PREFERENCE_VERSIONS, parseWorkflowPreferenceV2, serializeWorkflowPreferenceV2 } from "./presets.js";

const ROOT = new URL("../../../", import.meta.url);
const read = (path: string): string => readFileSync(new URL(path, ROOT), "utf8");

/** Members of one lineage tuple are `<prefix>_v<n>`, contiguous from the adopted baseline, in order. */
function lineage(members: readonly string[], prefix: string): readonly number[] {
  const versions = members.map((member) => {
    const match = member.match(new RegExp(`^${prefix}_v([1-9][0-9]*)$`, "u"));
    expect(match, member).not.toBeNull();
    return Number(match![1]);
  });
  for (let index = 1; index < versions.length; index += 1) expect(versions[index]).toBe(versions[index - 1]! + 1);
  return versions;
}

describe("assistance shared resources (rfc/assistance-config-register.md)", () => {
  it("binds the assistance-config head to the live AssistanceConfig version, adopted at v4 with no invented history", () => {
    expect(lineage(ASSISTANCE_CONFIG_VERSIONS, "assistance_config")).toEqual([4]);
    expect(ASSISTANCE_CONFIG_VERSIONS.at(-1)).toBe(`assistance_config_v${SILENT_ASSISTANCE.version}`);
  });

  it("binds the workflow-preference head to the sealed v2 value and keeps the adopted v1 baseline", () => {
    expect(lineage(WORKFLOW_PREFERENCE_VERSIONS, "workflow_preference")).toEqual([1, 2]);
    const sealed = parseWorkflowPreferenceV2({ version: 2, assistanceHead: 4, intent: { kind: "unset" } });
    expect(WORKFLOW_PREFERENCE_VERSIONS.at(-1)).toBe(`workflow_preference_v${sealed.version}`);
    expect(JSON.parse(serializeWorkflowPreferenceV2(sealed))).toMatchObject({ version: 2, assistanceHead: SILENT_ASSISTANCE.version });
    // v1 stays a landed member only while the web loader still reads the legacy `{ version: 1, preset }` value.
    expect(read("apps/web/src/lib/assistance-preference.ts")).toMatch(/item\.version !== 1/u);
  });

  it("registers both tuples as catalogue members read by the existing string_tuple reader", () => {
    const catalogue = JSON.parse(read("rfc/shared-resource-registers.json")) as { resources: readonly { id: string; claimKind: string; source: Record<string, unknown> }[] };
    expect(catalogue.resources.filter((row) => row.id === "assistance-config" || row.id === "workflow-preference")).toEqual([
      { id: "assistance-config", claimKind: "members", source: { kind: "string_tuple", path: "packages/runtime/src/assistance.ts", exportName: "ASSISTANCE_CONFIG_VERSIONS" } },
      { id: "workflow-preference", claimKind: "members", source: { kind: "string_tuple", path: "packages/runtime/src/presets.ts", exportName: "WORKFLOW_PREFERENCE_VERSIONS" } },
    ]);
  });
});
