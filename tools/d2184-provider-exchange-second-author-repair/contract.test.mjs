// DISPOSABLE positive author contract for D2184-D2189. Not production code.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/provider-exchange-and-execution.md");
const registerRfc = read("rfc/provider-protocol-register.md");
const readme = read("rfc/README.md");

const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
};
const digest = (domain, image) => createHash("sha256").update(`tabiya/${domain}\0${canonical(image)}`).digest("hex");

test("D2184: prefix, node and edge subjects have exact runtime identity", () => {
  assert.match(rfc, /type EvidenceAvailabilitySubjectRef[\s\S]*?kind: "run_prefix"[\s\S]*?kind: "run_node"[\s\S]*?kind: "run_edge"/u);
  for (const field of ["branchId", "nodeId", "beforeNodeId", "afterNodeId", "moveEventSeq", "beforeFen", "moveUci", "afterFen"]) {
    assert.match(rfc, new RegExp(`readonly ${field}:`, "u"));
  }
  assert.match(rfc, /may\s+read no ambient cursor/u);
  assert.match(rfc, /occurrence `\[0\]` deterministically resolves the edge's `beforeFen` and `\[1\]` its\s+`afterFen`/u);

  const base = { runId: "r", eventHeadDigest: "h", branchId: "b", beforeNodeId: "n1", afterNodeId: "n2", moveEventSeq: 3, beforeFen: "f1", moveUci: "e2e4", afterFen: "f2" };
  const a = digest("run.subject.v1", { subject: { kind: "run_edge", ...base } });
  assert.notEqual(a, digest("run.subject.v1", { subject: { kind: "run_edge", ...base, moveEventSeq: 4 } }));
  assert.notEqual(a, digest("run.subject.v1", { subject: { kind: "run_edge", ...base, beforeNodeId: "n2", afterNodeId: "n1", beforeFen: "f2", afterFen: "f1" } }));
});

test("D2185: all three engine identities have exact domains, constructors and live capture", () => {
  for (const [domain, constructor] of [
    ["engine.binary.v1", "digestEngineBinary"],
    ["engine.option_image.v1", "digestEngineOptionImage"],
    ["engine.container.v1", "digestEngineContainer"],
  ]) {
    assert.match(rfc, new RegExp(domain.replaceAll(".", "\\."), "u"));
    assert.match(rfc, new RegExp(`function ${constructor}\\(`, "u"));
  }
  assert.match(rfc, /binaryDigest: EngineBinaryDigest \| null/u);
  assert.match(rfc, /optionImageDigest: EngineOptionImageDigest/u);
  assert.match(rfc, /same label with different executable bytes/u);

  assert.notEqual(digest("engine.binary.v1", [1, 2]), digest("engine.binary.v1", [1, 3]));
  const options = { advertisedUciOptionLines: ["A", "B"], appliedSetoptionCommands: ["X", "Y"] };
  assert.notEqual(digest("engine.option_image.v1", options), digest("engine.option_image.v1", { ...options, advertisedUciOptionLines: ["B", "A"] }));
});

test("D2186: descriptor returns capture only and registered parser receipt binds bytes to payload", () => {
  const descriptor = rfc.slice(rfc.indexOf("interface ProviderOperationDescriptor"), rfc.indexOf("type ProviderOperationDescriptors"));
  assert.match(descriptor, /Promise<ProviderExecutionCapture<K>>/u);
  const execute = descriptor.slice(descriptor.indexOf("execute("), descriptor.indexOf("retainedWeight("));
  assert.doesNotMatch(execute, /payload: ProviderOperationResultMap/u);
  assert.match(rfc, /type ProviderResponseParserIdMap/u);
  assert.match(rfc, /interface ProviderParsedPayloadReceipt/u);
  for (const field of ["parserImplementationDigest", "responseDigest", "payloadDigest"]) assert.match(rfc, new RegExp(`readonly ${field}:`, "u"));
  assert.match(rfc, /Same bytes with a changed payload, same payload\s+beside different bytes/u);

  const seal = new WeakSet();
  const makeReceipt = (response, payload, parser) => {
    const value = Object.freeze({ response: digest("provider.response.v1", response), payload: digest("provider.payload.v1", payload), parser });
    seal.add(value);
    return value;
  };
  const receipt = makeReceipt({ body: "A" }, { score: 1 }, "parse@1");
  assert.equal(seal.has(receipt), true);
  assert.notEqual(receipt.response, digest("provider.response.v1", { body: "B" }));
  assert.notEqual(receipt.payload, digest("provider.payload.v1", { score: 2 }));
  assert.equal(seal.has({ ...receipt }), false);
});

test("D2187: HTTP status and ETag are capture fields in the response identity", () => {
  assert.match(rfc, /interface ProviderHttpResponseMetadata[\s\S]*?statusCode: 200[\s\S]*?etag: string \| null/u);
  assert.match(rfc, /readonly transport: ProviderTransportMetadataMap\[K\]/u);
  assert.match(rfc, /response: `\{ operation, provider, contentEncoding, transport, bodyBase64 \}`/u);
  assert.match(rfc, /derives `ExplorerPositionPage\.source` from the sealed capture metadata/u);

  const body = { operation: "explorer", bodyBase64: "e30=" };
  assert.notEqual(digest("provider.response.v1", { ...body, transport: { statusCode: 200, headers: { etag: "a" } } }), digest("provider.response.v1", { ...body, transport: { statusCode: 200, headers: { etag: "b" } } }));
});

test("D2188: all five traversals end at exact source factories and preserve non-evidence arms", () => {
  assert.match(rfc, /type ProviderSourceProjectionMap/u);
  assert.match(rfc, /type ProviderSourceFactorySymbolMap/u);
  for (const id of ["live.stockfish.legal_root_table", "live.stockfish.position_eval", "human.maia.policy_page", "live.syzygy.position_result", "human.explorer.position_page"]) {
    assert.match(rfc, new RegExp(id.replaceAll(".", "\\."), "u"));
  }
  const composition = rfc.slice(rfc.indexOf("type ProviderSourceProjectionMap"), rfc.indexOf("### 10. Migration order"));
  assert.match(composition, /Promise<ProviderEvidenceTraversalResult/gmu);
  assert.doesNotMatch(composition, /Promise<TypedProviderResult/u);
  assert.match(composition, /source failure is returned unchanged and the Syzygy local\s+domain arm is returned unchanged, with no evidence object/u);

  const traverse = (result, factory) => result.kind === "success" ? { kind: "evidence_success", evidence: factory(result.delivery) } : result;
  let calls = 0;
  assert.equal(traverse({ kind: "success", delivery: {} }, () => { calls += 1; return {}; }).kind, "evidence_success");
  assert.equal(traverse({ kind: "source_failure" }, () => { calls += 1; }).kind, "source_failure");
  assert.equal(traverse({ kind: "local_domain_result" }, () => { calls += 1; }).kind, "local_domain_result");
  assert.equal(calls, 1);
});

test("D2189: unregistered protocol is routed to a fail-closed process prerequisite", () => {
  assert.match(registerRfc, /Register `provider-protocol`/u);
  assert.match(registerRfc, /provider-protocol \| lane 1/u);
  assert.match(registerRfc, /## 4\. C11 closure/u);
  assert.match(registerRfc, /copied runtime\/server\/CLI operation list fails/u);
  assert.match(rfc, /draft `rfc\/provider-protocol-register\.md` for \[\[D2189\]\]/u);
  assert.match(rfc, /This RFC cannot be accepted\s+or implemented while the claim is absent/u);
  assert.match(readme, /`provider-protocol-register\.md`[\s\S]*?fresh independent process\/buildability review required/u);
});
