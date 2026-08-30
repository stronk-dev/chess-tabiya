// DISPOSABLE fresh independent review harness — D2113-D2117. Not production code.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/assistance-config-register.md");
const preference = read("apps/web/src/lib/assistance-preference.ts");
const assistance = read("packages/runtime/src/assistance.ts");
const hint = read("rfc/hint-distance.md");

function section(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return text.slice(from, to);
}

test("D2113: the process-only landing requires a post-v5 codec state absent at HEAD", () => {
  assert.equal(existsSync("packages/runtime/src/assistance-codec.ts"), false);
  assert.match(preference, /function validV4\(/u);
  assert.match(preference, /function migrate\(/u);
  assert.match(rfc, /must delegate parsed `unknown` to the one runtime codec export/u);
  assert.match(rfc, /may contain no\s+local `value is AssistanceConfig`, version switch or field-domain validation/u);
  const boundary = section(rfc, "### 6. Files and boundaries", "## Deviations from design");
  assert.match(boundary, /does \*\*not\*\* edit `packages\/runtime\/src\/assistance\.ts`, browser storage/u);
});

test("D2114: the claimed persistence census omits the production writer", () => {
  assert.match(preference, /export function saveAssistance[\s\S]{0,180}setItem\(assistanceKey/u);
  const roots = section(rfc, "The closed authority census has three roots", "The census scans every non-test production");
  assert.match(roots, /#loadAssistance/u);
  assert.doesNotMatch(roots, /#saveAssistance/u);
  assert.match(rfc, /sole production reader of the\s+`tabiya\.assistance\.` namespace/u);
});

test("D2115: same-head persistence semantics can drift without moving the registered digest", () => {
  const digest = section(rfc, "The normalized digest contains the resolved values", "The current derived shape");
  assert.match(digest, /normalized digest contains the resolved values/u);
  assert.match(digest, /encoded as canonical JSON together\s+with `head`/u);
  assert.doesNotMatch(digest, /assistanceKey|parseAssistanceConfig|loadAssistance|migration/u);
  assert.match(preference, /tabiya\.assistance\.v1\./u);
  for (const version of [1, 2, 3]) assert.match(preference, new RegExp(`item\\.version === ${version}`, "u"));
});

test("D2116: the four-token v5 claim omits unavoidable config constructors and consumers", () => {
  assert.match(hint, /SILENT_ASSISTANCE\.hintDistance === "off"/u);
  assert.match(assistance, /export const SILENT_ASSISTANCE: AssistanceConfig/u);
  assert.match(assistance, /Readonly<Record<keyof Omit<AssistanceConfig, "version">, AssistancePermission>>/u);
  const claim = section(rfc, "On this RFC's implementation, `hint-distance.md` changes its block atomically to:", "`intent-presets.md` retains");
  assert.doesNotMatch(claim, /SILENT_ASSISTANCE|permittedAssistance|AssistanceSettings|saveAssistance/u);
  assert.match(rfc, /complete census-derived assistance source changes are set-equal/u);
});

test("D2117: root tokens do not define the promised transitive source-change algorithm", () => {
  assert.match(rfc, /token\s+represents its complete reachable declaration\/import closure/u);
  assert.match(rfc, /indirect alias around one/u);
  assert.doesNotMatch(rfc, /interface AssistanceAuthorityNode|type AssistanceAuthorityEdge|canonical.*closure digest|Svelte.*preprocess/iu);
  const author = read("tools/d2037-assistance-register-final-review/contract.test.mts");
  assert.match(author, /const v5Authority = Object\.freeze\(\[/u);
  assert.doesNotMatch(author, /createProgram|TypeChecker|preprocess|readDirectory|sourceFile/iu);
});
