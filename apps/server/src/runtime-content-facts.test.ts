import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { repositoryAnchorLine, repositoryPathExists, resetRuntimeContentFactsForTest } from "./runtime-content-facts.js";

const original = process.env.TABIYA_RUNTIME_CONTENT_FACTS;

afterEach(() => {
  if (original === undefined) delete process.env.TABIYA_RUNTIME_CONTENT_FACTS;
  else process.env.TABIYA_RUNTIME_CONTENT_FACTS = original;
  resetRuntimeContentFactsForTest();
});

function factsFile(value: unknown): string {
  const path = join(mkdtempSync(join(tmpdir(), "tabiya-facts-")), "facts.json");
  writeFileSync(path, JSON.stringify(value));
  return path;
}

describe("rfc/verifiable-runtime-distribution.md §7 compiled runtime facts", () => {
  it("answers from the checkout when no release bundle is configured", () => {
    delete process.env.TABIYA_RUNTIME_CONTENT_FACTS;
    resetRuntimeContentFactsForTest();
    expect(repositoryPathExists("package.json")).toBe(true);
    expect(repositoryPathExists("no/such/file.md")).toBe(false);
    expect(repositoryAnchorLine("package.json", 2)).toContain("\"name\"");
  });

  it("answers only from the compiled facts inside a release image, never from the tree", () => {
    process.env.TABIYA_RUNTIME_CONTENT_FACTS = factsFile({
      format: "tabiya-runtime-content-facts",
      formatVersion: 1,
      rulingRoots: ["docs/example.md"],
      rulingLines: { "docs/example.md#L3": "2026-08-15 owner ruling" },
      resolvedPaths: ["rfc/example.md"],
    });
    resetRuntimeContentFactsForTest();
    expect(repositoryPathExists("rfc/example.md")).toBe(true);
    expect(repositoryPathExists("package.json")).toBe(false);
    expect(repositoryAnchorLine("docs/example.md", 3)).toBe("2026-08-15 owner ruling");
    expect(repositoryAnchorLine("package.json", 2)).toBeUndefined();
  });

  it("fails closed on a configured but malformed facts file", () => {
    process.env.TABIYA_RUNTIME_CONTENT_FACTS = factsFile({ format: "tabiya-runtime-content-facts", formatVersion: 2 });
    resetRuntimeContentFactsForTest();
    expect(() => repositoryPathExists("rfc/example.md")).toThrow(/RUNTIME_CONTENT_FACTS_INVALID/u);
  });
});
