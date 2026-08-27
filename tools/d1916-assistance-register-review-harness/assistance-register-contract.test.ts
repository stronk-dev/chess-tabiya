// DISPOSABLE process/buildability harness — D1916 plus two D1629 controls. Not production code.
import { readFileSync } from "node:fs";

import { SILENT_ASSISTANCE } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { loadAssistance } from "../../apps/web/src/lib/assistance-preference.js";

function proposedC9Allows(input: {
  readonly registeredHead: number;
  readonly treeHead: number;
  readonly digestMatches: boolean;
  readonly claimLanes: readonly number[];
}): boolean {
  if (input.registeredHead !== input.treeHead) return false; // C9.2
  if (!input.digestMatches && input.claimLanes.length === 0) return false; // C9.3
  if (!input.digestMatches && input.claimLanes.length !== 1) return false; // C9.4
  return input.claimLanes.every((lane) => lane === input.registeredHead + 1); // C9.4/C9.5
}

describe("assistance-config register draft against the persisted boundary", () => {
  it("allows a future lane-5 claim to mask a same-head v4 shape mutation", () => {
    expect(proposedC9Allows({
      registeredHead: 4,
      treeHead: 4,
      digestMatches: false,
      claimLanes: [5],
    })).toBe(true);
  });

  it("shows the live v4 parser accepts and returns unknown persisted fields", () => {
    const persisted = { ...SILENT_ASSISTANCE, futureBypass: "live" };
    const loaded = loadAssistance("position", {
      getItem: () => JSON.stringify(persisted),
      setItem() {},
    }) as unknown as Record<string, unknown>;
    expect(loaded.futureBypass).toBe("live");
  });

  it("shows the proposed tree digest excludes the browser parser and migrations", () => {
    const rfc = readFileSync("rfc/assistance-config-register.md", "utf8");
    expect(rfc).toContain("packages/runtime/src/assistance.ts");
    expect(rfc).toMatch(/It does \*\*not\*\* edit `packages\/runtime\/src\/assistance\.ts`, browser storage/u);
    const treeShape = rfc.match(/interface AssistanceConfigTree \{[\s\S]*?\n\}/u)?.[0] ?? "";
    expect(treeShape).toContain("head: number");
    expect(treeShape).toContain("fields:");
    expect(treeShape).not.toMatch(/migration|parser|storage/u);
  });
});
