// D4187: read-only authored inventory moved intact out of the software smoke. No pack migration
// or semantic endorsement. Exact paths strengthen the previous three-document count check.
import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import { expect, it } from "vitest";

function jsonFiles(path: string): readonly string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? jsonFiles(resolve(path, entry.name))
    : entry.isFile() && entry.name.endsWith(".json") ? [resolve(path, entry.name)] : []);
}

it("retains the exact authored outpost dependency inventory pending D3928 migration", { timeout: 5_000 }, () => {
  const paths = jsonFiles(resolve(process.cwd(), "content"))
    .filter(path => /"kind"\s*:\s*"outpost"/u.test(readFileSync(path, "utf8")))
    .map(path => relative(process.cwd(), path)).sort();
  expect(paths).toEqual(["content/shapes/knight-vs-bishop.json", "content/shapes/maroczy-bind.json", "content/shapes/open-centre.json"]);
});
