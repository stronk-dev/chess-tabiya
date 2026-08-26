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

  it("defines meaningful fallbacks for every system display preference", () => {
    const css = readFileSync(resolve(SOURCE, "accessibility.css"), "utf8");
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\)[\s\S]*color-scheme:\s*dark/u);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*transition-duration:\s*0\.001ms/u);
    expect(css).toMatch(/@media \(prefers-contrast: more\)[\s\S]*outline-style:\s*double/u);
    expect(css).toMatch(/@media \(forced-colors: active\)[\s\S]*outline:\s*6px double Mark/u);
  });
});
