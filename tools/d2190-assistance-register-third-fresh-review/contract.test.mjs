// DISPOSABLE third fresh independent review harness — D2190-D2193. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/assistance-config-register.md");
const author = read("tools/d2113-assistance-register-second-author-repair/contract.test.mjs");
const settings = read("apps/web/src/lib/AssistanceSettings.svelte");
const drill = read("apps/web/src/lib/DrillScreen.svelte");

function section(start, end) {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return rfc.slice(from, to);
}

test("D2190: bootstrap hard-fails the two computed writes that exist at v4", () => {
  assert.match(settings, /\[key\]: value/u);
  assert.match(drill, /\[key\]: value/u);
  assert.match(rfc, /dynamic computed assistance key[\s\S]{0,100}hard failure/u);
  assert.match(rfc, /Bootstrap v4 admits and seals the current/u);
  assert.doesNotMatch(author, /\\\[key\\\]/u);
  assert.match(author, /configs\\\[kind\\\]\\\[[^"']/u);
});

test("D2191: exact v5 claim omits the in-run hint consumer and preset clamp consumers", () => {
  const claim = section("On this RFC's implementation, `hint-distance.md` changes its block atomically to:", "`intent-presets.md` retains `none`");
  assert.match(claim, /AssistanceSettings\.svelte#AssistanceSettings\.hintDistance/u);
  assert.doesNotMatch(claim, /DrillScreen|presets\.ts|contextClamp|presetDeclaration/u);
  assert.match(rfc, /Advanced settings projection and the run-screen projection are mandatory/u);
  const hint = read("rfc/hint-distance.md");
  assert.match(hint, /pressing the button is the request/u);
  const presets = read("rfc/intent-presets.md");
  assert.match(presets, /one new\s+column in §4a's table and one in §3\.2/u);
});

test("D2192: the closed node vocabulary cannot represent the intermediate operations its closure follows", () => {
  const graph = section("type AssistanceAuthorityKind", "The graph is explicitly phase-aware");
  assert.match(graph, /follows imports, calls and property\s+reads\/writes in both directions until closed/u);
  assert.match(graph, /indirect alias around one/u);
  assert.doesNotMatch(graph, /\| "operation"|\| "import_alias"|\| "callable"|\| "component"/u);
  assert.match(read("packages/runtime/src/index.ts"), /type AssistanceConfig/u);
  assert.match(read("apps/web/src/lib/assistance-preference.ts"), /from "@chess-tabiya\/runtime"/u);
});

test("D2193: source discovery excludes production packages outside runtime and web", () => {
  assert.match(rfc, /under\s+`apps\/web\/src` and `packages\/runtime\/src`/u);
  assert.doesNotMatch(rfc, /all workspace production packages|apps\/server\/src.*authority graph/u);
  assert.match(read("apps/server/src/declaration-census.ts"), /AssistanceConfig/u);
  assert.match(rfc, /assistance-property consumer outside the graph fails closure/u);
});
