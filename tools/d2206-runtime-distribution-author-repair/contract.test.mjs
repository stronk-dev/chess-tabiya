import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/verifiable-runtime-distribution.md", "utf8");
const botCatalog = readFileSync("apps/server/src/bot-policy-catalog.ts", "utf8");

function topologicalOrder(edges) {
  const nodes = new Set(edges.flat());
  const incoming = new Map([...nodes].map((node) => [node, 0]));
  const outgoing = new Map([...nodes].map((node) => [node, []]));
  for (const [from, to] of edges) {
    incoming.set(to, incoming.get(to) + 1);
    outgoing.get(from).push(to);
  }
  const ready = [...nodes].filter((node) => incoming.get(node) === 0).sort();
  const result = [];
  while (ready.length) {
    const node = ready.shift();
    result.push(node);
    for (const next of outgoing.get(node)) {
      incoming.set(next, incoming.get(next) - 1);
      if (incoming.get(next) === 0) ready.push(next);
    }
    ready.sort();
  }
  if (result.length !== nodes.size) throw new Error("release graph contains a cycle");
  return result;
}

const accepted = new Set(["MIT", "Apache-2.0", "GPL-2.0-only"]);
const withPairs = new Set(["Apache-2.0 WITH LLVM-exception"]);
const texts = new Set(["MIT", "Apache-2.0", "GPL-2.0-only", "LLVM-exception"]);
function foss(node, selection = null) {
  if (node.kind === "leaf") return accepted.has(node.id) && texts.has(node.id);
  if (node.kind === "ref") return false;
  if (node.kind === "and") return foss(node.left, selection) && foss(node.right, selection);
  if (node.kind === "or") {
    if (selection !== "left" && selection !== "right") return false;
    return foss(node[selection], null);
  }
  if (node.kind === "with") return withPairs.has(`${node.license} WITH ${node.exception}`)
    && texts.has(node.license) && texts.has(node.exception);
  return false;
}

test("D2206: the release index has one closed v1 schema and generated reader surface", () => {
  assert.match(rfc, /interface ReleaseManifestV1/);
  assert.match(rfc, /format: "tabiya-release-manifest"/);
  assert.match(rfc, /additionalProperties: false/);
  assert.match(rfc, /generation, read-only[\s\S]*Compose generation, release upload, About\/API and the clean-host drill import that[\s\S]*validator\/projection/);
});

test("D2363: the author round exposes rather than bypasses register bootstrap", () => {
  assert.match(rfc, /required[\s\S]*shared-resource identity is `release-manifest-schema`, initial lane `1`/);
  assert.match(rfc, /register bootstrap resolution in \[\[D2363\]\]/);
  assert.match(rfc, /does not add schema\/checker production bytes early/);
});

test("D2207: the declared release graph is acyclic and the old embedding edge falsifies it", () => {
  const graph = [
    ["preimage", "image"], ["image", "sbom"], ["image", "resource"],
    ["image", "compose"], ["sbom", "manifest"], ["resource", "manifest"],
    ["compose", "manifest"], ["manifest", "checksums"], ["checksums", "attestations"],
  ];
  assert.equal(topologicalOrder(graph).length, 8);
  assert.throws(() => topologicalOrder([...graph, ["manifest", "image"]]), /cycle/);
  assert.match(rfc, /post-image `release-manifest\.json` is never copied into an image/);
  assert.match(rfc, /mounts the[\s\S]*file read-only at `\/run\/chess-tabiya\/release-manifest\.json`/);
});

test("D2208: the executable FOSS model crosses SPDX composition and refusal arms", () => {
  const mit = { kind: "leaf", id: "MIT" };
  const apache = { kind: "leaf", id: "Apache-2.0" };
  assert.equal(foss(mit), true);
  assert.equal(foss({ kind: "and", left: mit, right: apache }), true);
  assert.equal(foss({ kind: "or", left: mit, right: { kind: "ref", id: "LicenseRef-X" } }), false);
  assert.equal(foss({ kind: "or", left: mit, right: { kind: "ref", id: "LicenseRef-X" } }, "left"), true);
  assert.equal(foss({ kind: "with", license: "Apache-2.0", exception: "LLVM-exception" }), true);
  assert.equal(foss({ kind: "with", license: "MIT", exception: "LLVM-exception" }), false);
  assert.equal(foss({ kind: "ref", id: "LicenseRef-MAIA3-WEIGHTS-UNRESOLVED" }), false);
});

test("D2208: curated overrides cannot bless custom text or evade exact identity", () => {
  assert.match(rfc, /replacement must itself pass this policy/);
  assert.match(rfc, /custom `LicenseRef` text cannot be blessed by override in v1/);
  assert.match(rfc, /does not match every[\s\S]*component byte\/identity field is inapplicable/);
  assert.match(rfc, /D1 remains separate/);
});

test("D2209: CPU proof binds the maximal production profile and exact provider window", () => {
  assert.match(rfc, /compiled literal `pawn-forward\.1800@1`/);
  assert.match(rfc, /ordinary web\/API[\s\S]*`bot\.production_selection@1`/);
  assert.match(rfc, /`maia\.policy_page@1` at the profile's widest declared page \(v1: 20\)/);
  assert.match(rfc, /100\/100 committed results/);
});

test("D2209: today's empty catalog can measure research but cannot pass release", () => {
  assert.match(botCatalog, /BOT_POLICY_PROFILES = compileBotPolicyCatalog\(\[\]\)/);
  assert.match(rfc, /Catalog empty,[\s\S]*cannot satisfy the 1\.0 CPU gate/);
});
