import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const SOURCE = new URL("./controls.css", import.meta.url);
const ROOT = new URL("../../", import.meta.url).pathname;

describe("shared native-control layer", () => {
  const css = readFileSync(SOURCE, "utf8");

  it("is loaded once at the application boundary", () => {
    const entry = readFileSync(resolve(ROOT, "main.ts"), "utf8");
    const shell = readFileSync(resolve(ROOT, "App.svelte"), "utf8");
    expect(entry.match(/theme\/controls\.css/gu)).toHaveLength(1);
    expect(shell).not.toMatch(/:global\((?:button|input|select|textarea)\)/u);
    expect(shell).not.toMatch(/:global\(:focus-visible\)|:global\(::selection\)/u);
  });

  it("gives every native control family a token-driven baseline", () => {
    for (const control of ["button", "input", "select", "textarea"]) expect(css).toContain(control);
    expect(css).toMatch(/input\[type="checkbox"\][\s\S]*input\[type="radio"\][\s\S]*accent-color:\s*var\(--accent\)/u);
    for (const token of ["ink", "muted", "line", "panel", "accent", "on-accent"]) expect(css).toContain(`var(--${token})`);
    expect(css).toMatch(/:disabled\s*\{[\s\S]*cursor:\s*not-allowed/u);
    expect(css).toMatch(/:focus-visible\)\s*\{[\s\S]*outline:/u);
  });
});
