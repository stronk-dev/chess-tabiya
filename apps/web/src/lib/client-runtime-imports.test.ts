import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

it("keeps production browser imports on the client runtime boundary", () => {
  const source = fileURLToPath(new URL("../", import.meta.url));
  const offenders = readdirSync(source, { recursive: true }).filter((path): path is string =>
    typeof path === "string" && /\.(?:ts|svelte)$/.test(path) && !/\.test(?:-support)?\.ts$/.test(path),
  ).filter((path) => /["']@chess-tabiya\/runtime["']/.test(readFileSync(`${source}${path}`, "utf8")));
  expect(offenders).toEqual([]);
});
