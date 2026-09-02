// DISPOSABLE fresh independent buildability review for rfc/pack-capability-contract.md.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/pack-capability-contract.md");
const rest = read("apps/server/src/rest.ts");
const service = read("apps/server/src/service.ts");
const evidenceContract = read("packages/runtime/src/evidence-contract.ts");

const routeTable = rfc.slice(
  rfc.indexOf("| method + route | body branch | operation id | capability source |"),
  rfc.indexOf("The table has 32 route rows"),
);
const routeShape = rfc.slice(
  rfc.indexOf("interface CapabilityRouteBranch"),
  rfc.indexOf("`CAPABILITY_ROUTE_BRANCHES` is one literal typed table"),
);

test("D2509: the sole pack-registration row names a route absent from production", () => {
  assert.match(routeTable, /POST \/studio\/drafts\/:draftId\/register/u);
  assert.doesNotMatch(rest, /\/studio\/drafts/u);
  assert.match(rest, /\^\\\/packs\\\/drafts\\\/\(\[\^\/\]\+\).*register/u);
  assert.match(rest, /action === "register"\) return json\(201, \{ pack: studio\.register/u);
  assert.doesNotMatch(routeTable, /POST \/packs\/drafts\/:draftId\/register/u);
});

test("D2510: the typed census excludes live creation, provider-read, and delete branches", () => {
  assert.match(routeShape, /readonly method: "POST" \| "PUT"/u);
  assert.doesNotMatch(routeShape, /"GET"|"DELETE"/u);

  for (const liveNeedle of [
    'url.pathname === "/rated-games"',
    'action === "playtest"',
    'resource==="gaps"&&tail==="enter"',
    'route.action === "human-split"',
    'route.action === "corpus"',
    'route.action === "story"',
    'request.method === "DELETE" && shareDelete !== null',
  ]) assert.match(rest, new RegExp(liveNeedle.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));

  for (const omitted of ["/rated-games", "playtest", "gaps/enter", "human-split", "corpus", "story", "share/:token"]) {
    assert.doesNotMatch(routeTable, new RegExp(omitted.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  }
  assert.match(service, /async createRatedGame\(/u);
  assert.match(service, /async createRepertoireGapRun\(/u);
  assert.match(service, /async flip\([\s\S]*?createRun\(/u);
  assert.match(service, /async duplicate\([\s\S]*?return this\.create\(/u);
  assert.match(routeTable, /run\.flip` \| `none`/u);
  assert.match(routeTable, /run\.duplicate` \| `none`/u);
});

test("D2511: run.group collapses two provider branches into source:none", () => {
  assert.match(routeTable, /POST \/runs\/:runId\/group` \| — \| `run\.group` \| `none`/u);
  assert.doesNotMatch(routeTable, /\/source|human_replies|engine_top_n/u);
  const createGroup = service.slice(service.indexOf("async createGroup("), service.indexOf("async groupReply("));
  assert.match(createGroup, /input\.source === "human_replies"/u);
  assert.match(createGroup, /await selector\.select\(request\)/u);
  assert.match(createGroup, /await selector\.enumerate\(request, requestedSize\)/u);
  assert.match(createGroup, /this\.#storage\.save\(scratch, lease\)/u);
});

test("D2512: the two-cause model erases the shipped honest-empty effect", () => {
  assert.match(evidenceContract, /export type ProviderOffBehavior = "available" \| "honest_empty" \| "unavailable"/u);
  assert.match(rfc, /miss returns HTTP 503/u);
  assert.match(rfc, /ProviderOffBehavior[\s\S]{0,180}"honest_empty"/u);
  assert.doesNotMatch(rfc.slice(rfc.indexOf("interface OperationCapabilityBinding"), rfc.indexOf("### §6.")), /providerOff/u);
  assert.match(service, /unresolved\[branchId\] = "provider_unavailable"/u);
});
