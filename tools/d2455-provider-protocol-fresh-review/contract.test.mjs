// DISPOSABLE fresh independent buildability review — D2455-D2459.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/provider-protocol-register.md");
const bootstrap = read("rfc/shared-resource-register-bootstrap.md");
const workflow = read(".github/workflows/verify.yml");

function between(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing ${start}`);
  assert.notEqual(to, -1, `missing ${end}`);
  return text.slice(from, to);
}

test("D2455 provider and generic process RFCs prescribe incompatible authorities", () => {
  assert.match(rfc, /`RESOURCE_NAMES` gains `provider-protocol`/u);
  assert.match(rfc, /adds C11/u);
  assert.match(bootstrap, /`RESOURCE_NAMES` and `SCHEMA_SLUGS` are deleted as independent authority/u);
  assert.match(bootstrap, /Kind, rather than resource name, selects all semantics/u);
  assert.doesNotMatch(rfc, /Depends on:[^\n]*shared-resource-register-bootstrap/u);
});

test("D2456 all-literal rows require non-literal function witnesses and an undefined constructor", () => {
  const artifact = between(rfc, "The product landing creates", "The digest-domain tuple");
  assert.match(artifact, /requestType: \(value: Request\) => Request/u);
  assert.match(artifact, /resultType: \(value: Result\) => Result/u);
  assert.match(artifact, /localResultType: \(value: LocalResult\) => LocalResult/u);
  assert.match(rfc, /every operation field is literal and exact/u);
  assert.match(artifact, /defineProviderProtocol\(/u);
  assert.doesNotMatch(rfc, /(?:function|const|import[^\n]*\{[^}]*)(?:\s+)defineProviderProtocol\b/u);
});

test("D2457 the sole tuple has no independent authority that can refuse a coordinated swap", () => {
  assert.match(rfc, /no second operation list/u);
  assert.match(rfc, /no second domain list/u);
  assert.match(rfc, /provider-protocol \| first lane 1 \| packages\/runtime\/src\/provider-protocol\.ts#PROVIDER_PROTOCOL_DECLARATIONS; packages\/runtime\/src\/provider-protocol\.ts#PROVIDER_PROTOCOL_VERSION/u);
  assert.match(rfc, /runtime exported maps\/types, server descriptor\/parser mapped sets, value-authority factory map and\s+CLI dispatch derive from the tuple/u);
  assert.match(rfc, /count-preserving operation\/domain\/factory\/CLI swap fails/u);
});

test("D2458 prior-claim landing has no executable committed-history contract", () => {
  assert.match(rfc, /lane transition bytes match the previous claim owner\/symbols/u);
  assert.doesNotMatch(rfc, /HEAD\^1|fetch-depth|first parent|index.*HEAD|staged.*HEAD/iu);
  assert.doesNotMatch(workflow, /fetch-depth:\s*2/u);
});

test("D2459 missing version root does not forbid a partial declarations artifact", () => {
  const prelanding = between(rfc, "## 3. Pre-landing state", "## 4. C11 closure");
  assert.match(prelanding, /exact future root is\s+`packages\/runtime\/src\/provider-protocol\.ts#PROVIDER_PROTOCOL_VERSION`/u);
  assert.match(prelanding, /A missing root is legal only while/u);
  assert.doesNotMatch(prelanding, /PROVIDER_PROTOCOL_DECLARATIONS`? must not resolve|declarations(?: symbol| tuple)? (?:is|must be) absent/iu);
});
