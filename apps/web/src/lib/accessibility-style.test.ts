import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = new URL("../../../../", import.meta.url).pathname;
const SOURCE = resolve(ROOT, "apps/web/src");

function styleSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return styleSources(path);
    return /\.(?:css|svelte)$/u.test(entry.name) ? [path] : [];
  });
}

describe("accessibility style primitives", () => {
  it("keeps visually-hidden geometry in one shared stylesheet", () => {
    const utility = resolve(SOURCE, "accessibility.css");
    const duplicates = styleSources(SOURCE)
      .filter((path) => path !== utility)
      .filter((path) => /clip\s*:\s*rect|clip-path\s*:\s*inset\(50%\)/u.test(readFileSync(path, "utf8")));
    expect(duplicates).toEqual([]);
    const css = readFileSync(utility, "utf8");
    for (const name of [".visually-hidden", ".visually-hidden-on-phone", ".visually-hidden-below-rail"]) expect(css).toContain(name);
  });
});
