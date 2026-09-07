// DISPOSABLE bounded author repair contract — D3131-D3133.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(file, "utf8");
const rfc = read("rfc/shared-resource-register-bootstrap.md");
const author = read("tools/d3034-shared-resource-bootstrap-collision-core-author-contract/contract.test.mjs");

test("D3131 path-source identity is independent of reader kind", () => {
  assert.match(rfc, /root-resolved realpath plus export for\s+path sources, independent of which source reader claims it/u);
  assert.match(author, /`path:\$\{path\.relative\(process\.cwd\(\), fs\.realpathSync\(source\.path\)\)\}:\$\{source\.exportName \?\? source\.headExport\}`/u);
  assert.match(author, /new Set\(crossKindAlias\.map\(sourceIdentity\)\)\.size, 1/u);
});

test("D3132 catalogue admission receives its repository root explicitly", () => {
  assert.match(rfc, /parseResourceCatalogue\(value, \{ root \}\)/u);
  assert.doesNotMatch(rfc, /parseResourceCatalogue\(value\)(?!,)/u);
});

test("D3133 the synthetic extension really exercises the digit-bearing id grammar", () => {
  assert.match(author, /id: "synthetic2-schema"/u);
  assert.match(author, /assert\.match\(bySlug\.get\("synthetic"\), \/\\d\/u\)/u);
});
