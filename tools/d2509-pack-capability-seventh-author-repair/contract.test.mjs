// DISPOSABLE seventh author contract. It validates RFC author bytes; it is not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const authority = JSON.parse(read("tools/d2509-pack-capability-seventh-author-repair/operation-authority.json"));
const rfc = read("rfc/pack-capability-contract.md");
const rest = read("apps/server/src/rest.ts");
const service = read("apps/server/src/service.ts");
const guidance = read("apps/server/src/guidance.ts");

const runBranches = authority.runRouteActions.flatMap((row) =>
  row.branches.map((branch) => ({ action: row.action, ...branch })),
);
const externalBranches = authority.boundedPopulation.externalRoutes;
const allBranches = [...externalBranches, ...runBranches];
const operations = allBranches.map((row) => row.operation);
const pair = (method, action) => `${method} ${action}`;

test("D2509: registration uses the live route and retains the fictional prefix as a negative", () => {
  const registration = externalBranches.filter((row) => row.operation === "pack.register");
  assert.deepEqual(registration, [{
    method: "POST",
    route: "/packs/drafts/:draftId/register",
    operation: "pack.register",
    source: "registered_pack_static",
  }]);
  assert.match(rest, /\^\\\/packs\\\/drafts/u);
  assert.doesNotMatch(rest, /\/studio\/drafts/u);
  const normative = rfc.slice(rfc.indexOf("The operation boundary is shared and typed."), rfc.indexOf("### §6."));
  assert.doesNotMatch(normative, /POST \/studio\/drafts\/.*register/u);
});

test("D2510: the author image closes the live run parser and every supported method branch", () => {
  const parser = rest.match(/function parseRunRoute[\s\S]*?\(moves\|([^)]*)\)\$\/\.exec/u);
  assert.ok(parser, "parseRunRoute action grammar must remain discoverable");
  const parsedActions = ["moves", ...parser[1].split("|")].sort();
  assert.deepEqual(authority.runRouteActions.map((row) => row.action).sort(), parsedActions);
  assert.equal(parsedActions.length, 36);

  const actualPairs = new Set();
  for (const match of rest.matchAll(/request\.method === "(GET|PUT)" && route\.action === "([^"]+)"/gu)) {
    actualPairs.add(pair(match[1], match[2]));
  }
  const postStart = rest.indexOf('if (request.method !== "POST")', rest.indexOf('route.action === "corpus"'));
  const post = rest.slice(postStart, rest.indexOf("    } catch (error)", postStart));
  for (const match of post.matchAll(/route\.action === "([^"]+)"/gu)) actualPairs.add(pair("POST", match[1]));
  const declaredPairs = new Set(runBranches.map((row) => pair(row.method, row.action)));
  assert.deepEqual([...declaredPairs].sort(), [...actualPairs].sort());
  assert.equal(runBranches.length, 48);
  assert.equal(externalBranches.length, 10);
  assert.equal(new Set(operations).size, 58);

  for (const method of ["GET", "POST", "PUT", "DELETE"]) assert.ok(allBranches.some((row) => row.method === method));
  for (const route of ["/rated-games", "/packs/drafts/:draftId/playtest", "/repertoires/:id/gaps/enter", "/api/shared/:token/story", "/runs/:runId/share/:token"]) {
    assert.ok(externalBranches.some((row) => row.route === route), `missing ${route}`);
  }
});

test("D2510: creation call sites and nested creation operations are a separate closed population", () => {
  const sites = authority.runCreationSites;
  assert.equal(sites.length, 8);
  assert.equal((rest.match(/await service\.create\(/gu) ?? []).length, 2);
  assert.equal((service.match(/\bcreateRun\(/gu) ?? []).length, 5);
  assert.equal((service.match(/return this\.create\(/gu) ?? []).length, 1);
  const created = new Set(sites.flatMap((site) => site.operations));
  assert.deepEqual([...created].sort(), operations.filter((id) => id.startsWith("run.create.")).sort());
  assert.ok(runBranches.some((row) => row.operation === "run.create.flip" && row.source === "session_create.position"));
  assert.deepEqual(
    runBranches.filter((row) => row.action === "duplicate").map((row) => row.branch).sort(),
    ["loaded session.kind=pack", "loaded session.kind=position"],
  );
});

test("D2511: group is total over four source values and only two arms reach a provider", () => {
  const group = runBranches.filter((row) => row.action === "group");
  assert.deepEqual(group.map((row) => row.branch).sort(), [
    "source=authored", "source=engine_top_n", "source=hand_picked", "source=human_replies",
  ]);
  assert.deepEqual(
    group.filter((row) => row.source === "run_session_operation").map((row) => row.branch).sort(),
    ["source=engine_top_n", "source=human_replies"],
  );
  const createGroup = service.slice(service.indexOf("async createGroup("), service.indexOf("async groupReply("));
  for (const source of ["hand_picked", "authored", "human_replies"]) assert.match(createGroup, new RegExp(`input\\.source === "${source}"`, "u"));
  assert.match(rest, /source !== "hand_picked" && source !== "authored" && source !== "human_replies" && source !== "engine_top_n"/u);
  assert.match(createGroup, /input\.source === "human_replies" \? "human_common" : "strong_engine"/u);
  assert.ok(createGroup.indexOf("await selector.select(request)") < createGroup.indexOf("this.#storage.save(scratch, lease)"));
  assert.ok(createGroup.indexOf("await selector.enumerate(request, requestedSize)") < createGroup.indexOf("this.#storage.save(scratch, lease)"));
});

test("D2512: provider calls are source-derived and every non-local operation joins a compiled effect", () => {
  const callCounts = new Map();
  for (const site of authority.providerCallSites) {
    const key = `${site.file}:${site.call}`;
    callCounts.set(key, (callCounts.get(key) ?? 0) + 1);
  }
  const sourceByFile = new Map([
    ["apps/server/src/rest.ts", rest],
    ["apps/server/src/service.ts", service],
    ["apps/server/src/guidance.ts", guidance],
  ]);
  for (const [key, expected] of callCounts) {
    const split = key.lastIndexOf(":");
    const file = key.slice(0, split);
    const call = key.slice(split + 1);
    const escaped = call.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    assert.equal((sourceByFile.get(file).match(new RegExp(`${escaped}\\(`, "gu")) ?? []).length, expected, key);
  }
  assert.deepEqual([...new Set(Object.values(authority.providerConsumers))].sort(), ["available", "honest_empty", "unavailable"]);
  for (const row of allBranches.filter((candidate) => candidate.source !== "none" && candidate.source !== "registered_pack_static")) {
    assert.equal(typeof row.consumer, "string", `${row.operation} lacks consumer`);
    assert.ok(row.consumer in authority.providerConsumers, `${row.operation} has no compiled consumer effect`);
    assert.equal(Object.hasOwn(row, "providerOff"), false, `${row.operation} copied providerOff`);
  }
  assert.match(rfc, /routes never pass either a behavior or a\s+capability list/u);
  assert.match(rfc, /An `honest_empty` consumer returns its typed empty/u);
  assert.match(rfc, /An `available` consumer follows\s+its declared deterministic\/local fallback/u);
});

test("D2513: run-session operations do not require a fictitious pack", () => {
  for (const operation of ["run.human_split", "run.corpus", "run.story", "run.branch_decidedness", "run.analysis", "run.prediction", "run.voice", "run.speech"]) {
    assert.ok(allBranches.some((row) => row.operation === operation && row.source === "run_session_operation"), operation);
  }
  assert.doesNotMatch(rfc.slice(rfc.indexOf("## Seventh author repair")), /registered_pack_operation/u);
  assert.match(rfc, /Position and imported sessions therefore remain first-class/u);
});
