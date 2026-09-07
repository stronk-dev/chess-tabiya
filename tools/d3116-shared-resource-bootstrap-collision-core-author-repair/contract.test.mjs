// DISPOSABLE bounded author repair contract — D3116-D3119.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/shared-resource-register-bootstrap.md");
const author = read("tools/d3034-shared-resource-bootstrap-collision-core-author-contract/contract.test.mjs");

test("D3116 canonical source identities are normative and executable in the author gate", () => {
  assert.match(rfc, /canonical source identity/u);
  assert.match(rfc, /realpath plus export/u);
  assert.match(author, /const sourceIdentity/u);
  assert.match(author, /fs\.realpathSync/u);
});

test("D3117 lane components have one canonical spelling", () => {
  assert.match(rfc, /no leading-zero component/u);
  assert.match(rfc, /leading-zero lane is refused/u);
});

test("D3118 one id grammar spans catalogue claims and README registers", () => {
  assert.match(rfc, /exported claim\/register id pattern/u);
  assert.match(rfc, /digit-bearing synthetic/u);
});

test("D3119 every live versionExport is joined to the schema index and schema version", () => {
  assert.match(author, /versionExport: match\[3\] === "null" \? null : match\[4\]/u);
  assert.match(author, /assert\.equal\(matches\.length, 1, row\.source\.versionExport\)/u);
  assert.match(author, /assert\.equal\(matches\[0\]\[1\], schema\[2\], row\.source\.versionExport\)/u);
});
