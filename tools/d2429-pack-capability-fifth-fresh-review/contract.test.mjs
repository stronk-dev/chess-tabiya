// DISPOSABLE fifth fresh independent buildability review. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/pack-capability-contract.md");
const rest = read("apps/server/src/rest.ts");
const session = read("packages/runtime/src/session.ts");
const operationBlock = rfc.match(/type CapabilityOperationId =[\s\S]*?interface OperationCapabilityBinding \{[\s\S]*?\n\}/u)?.[0] ?? "";
const operationSection = rfc.slice(rfc.indexOf("type CapabilityOperationId ="), rfc.indexOf("**Gate F clause 5"));
const publicBlock = rfc.match(/export type PublicCapabilitySemanticDispositionV1 =[\s\S]*?export interface PackCapabilitiesPublicProjectionV1 \{[\s\S]*?\n\}/u)?.[0] ?? "";

test("D2429 run.create cannot be registered-pack-only because the live contract creates position runs", () => {
  assert.match(rfc, /`pack\.register` and\s+`run\.create` use `registered_pack\/static_admission`/u);
  assert.match(rfc, /they internally resolve the parsed\/registered\s+pack/u);
  assert.match(rest, /kind === "position"[\s\S]*?kind: "position" as const/u);
  assert.match(session, /readonly kind: "position"[\s\S]*?readonly kind: "imported"/u);
  assert.match(session, /run\.packId !== null/u);
  assert.doesNotMatch(operationSection, /(?:position|pack-less|packless)/iu);
});

test("D2430 no-provider action identities are outside the closed operation union and lack a route projection", () => {
  const operationIds = new Set([...operationBlock.matchAll(/"([a-z][a-z_.]+)"/gu)].map((match) => match[1]));
  const noProvider = ["marks_replace", "marks_rescope", "move_user", "move_opponent", "grant", "revoke"];
  for (const id of noProvider) assert.equal(operationIds.has(id), false, `${id} unexpectedly entered CapabilityOperationId`);
  assert.match(rfc, /Every other current mutating run action is mechanically set-equal to an explicit no-provider set/u);
  assert.match(rest, /route\.action === "moves"[\s\S]*?value\.selection[\s\S]*?service\.opponentPly[\s\S]*?service\.move/u);
  assert.match(rest, /route\.action === "marks"[\s\S]*?rescopeFrom[\s\S]*?rescopeMarks[\s\S]*?replaceMarks/u);
  assert.doesNotMatch(rfc, /(?:RouteOperation|routeBranch|methodRoute|routeAction).*CapabilityOperation/iu);
});

test("D2431 the public row cannot prove the availability mode needed by its semantic rejection", () => {
  assert.match(rfc, /parsePackCapabilitiesPublicProjectionV1` rejects[\s\S]{0,260}transient local\/build-time capability/u);
  assert.doesNotMatch(publicBlock, /availability/u);
  assert.match(rfc, /interface CapabilityDeploymentBinding[\s\S]{0,260}availability: "local" \| "recorded" \| "provider" \| "build_time"/u);

  const sameWire = Object.freeze({
    capability: Object.freeze({ id: "example", version: Object.freeze({ kind: "integer", value: 1 }) }),
    semanticDisposition: Object.freeze({ kind: "active" }),
    reachability: Object.freeze({ kind: "temporarily_unavailable", providerFamily: "analysis" }),
  });
  const admissible = (availability) => sameWire.reachability.kind !== "temporarily_unavailable" || availability === "provider";
  assert.equal(admissible("provider"), true);
  assert.equal(admissible("local"), false);
  assert.deepEqual(sameWire, sameWire);
});
