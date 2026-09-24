import assert from "node:assert/strict";
import test from "node:test";

import { checkAgainstRegistry, checkAppendOnly, parseHistory } from "./semantic-convention-history-check.mjs";
import { BEGIN, END, parseInitialDeclarations, renderInitialDeclarations, spliceGeneratedRegion } from "./generate-initial-convention-declarations.mjs";

const digest = (fill) => `sha256:${fill.repeat(64)}`;
const row = (ref, semantic = "a", owner = "semantic-convention-provenance.md") => JSON.stringify({ ref, semanticDigest: digest(semantic), registryDigest: digest("f"), ownerRfc: owner });
const text = (...rows) => rows.map((line) => `${line}\n`).join("");

test("history rows are canonical, exactly keyed and newline-terminated", () => {
  assert.equal(parseHistory(text(row("space@1"), row("threat@1"))).length, 2);
  assert.throws(() => parseHistory(row("space@1")), /missing final newline/);
  assert.throws(() => parseHistory(text(`{"semanticDigest":"${digest("a")}","ref":"space@1","registryDigest":"${digest("f")}","ownerRfc":"x.md"}`)), /keys must be exactly/);
  assert.throws(() => parseHistory(text(row("space@1").replace("{", "{ "))), /not canonical/);
  assert.throws(() => parseHistory(text(JSON.stringify({ ref: "space@1", semanticDigest: "a".repeat(64), registryDigest: digest("f"), ownerRfc: "x.md" }))), /digests must be/);
  assert.throws(() => parseHistory(text(JSON.stringify({ ref: "space@1", semanticDigest: digest("a"), registryDigest: digest("f"), ownerRfc: "x.md", commit: "abc" }))), /keys must be exactly/);
  assert.throws(() => parseHistory(text(row("space@1"), row("space@1"))), /more than one row/);
});

test("history lineage advances one version at a time per base id", () => {
  assert.equal(parseHistory(text(row("space@1"), row("threat@1"), row("space@2"))).length, 3);
  assert.throws(() => parseHistory(text(row("space@2"))), /skips or backtracks/);
  assert.throws(() => parseHistory(text(row("space@1"), row("space@3"))), /skips or backtracks/);
});

test("a same-version meaning rewrite fails against the registry; a next version is lawful", () => {
  const rows = parseHistory(text(row("space@1", "a")));
  assert.deepEqual(checkAgainstRegistry(rows, [{ ref: "space@1", semanticDigest: digest("a") }]), []);
  assert.match(checkAgainstRegistry(rows, [{ ref: "space@1", semanticDigest: digest("b") }])[0], /changed at the same version.*declare space@2/);
  assert.match(checkAgainstRegistry(rows, [{ ref: "space@1", semanticDigest: digest("a") }, { ref: "space@2", semanticDigest: digest("b") }])[0], /space@2: declared but has no history row/);
  assert.match(checkAgainstRegistry(rows, [])[0], /names no current declaration/);
});

test("append-only: extension passes; rewrite, reorder and deletion fail", () => {
  const before = text(row("space@1"), row("threat@1"));
  assert.deepEqual(checkAppendOnly(before, before + text(row("space@2", "b")), "x"), []);
  assert.deepEqual(checkAppendOnly(null, before, "x"), []);
  assert.equal(checkAppendOnly(before, text(row("threat@1"), row("space@1")), "x").length, 1);
  assert.equal(checkAppendOnly(before, text(row("space@1")), "x").length, 1);
  assert.equal(checkAppendOnly(before, text(row("space@1", "b"), row("threat@1")), "x").length, 1);
});

test("the initial-declaration generator expands rows without paraphrase and refuses drift", () => {
  const envelope = {
    schemaVersion: 1, snapshotRef: "62a5731f", authorityKind: "landed_contract", disclosureKind: "definition_and_limitations",
    declarations: [{ ref: "space@1", definition: "Def \"quoted\".", limitations: ["Lim."], witnesses: ["rules.structural.reading.space@1"] }],
  };
  const region = renderInitialDeclarations(envelope);
  assert.ok(region.startsWith(`${BEGIN}\n`) && region.endsWith(`${END}\n`));
  assert.match(region, /definition: "Def \\"quoted\\"\.",/);
  assert.match(region, /ref: \{ id: "space", version: 1 \}/);
  const target = `before\n${BEGIN}\nstale\n${END}\nafter\n`;
  assert.equal(spliceGeneratedRegion(target, region), `before\n${region}after\n`);
  assert.throws(() => spliceGeneratedRegion("no markers\n", region), /exactly one generated region/);
  assert.throws(() => parseInitialDeclarations({ ...envelope, declarations: [{ ...envelope.declarations[0], limitations: [] }] }), /limitation/);
  assert.throws(() => parseInitialDeclarations({ ...envelope, declarations: [{ ...envelope.declarations[0], ref: "grade-convention@1/drill" }] }), /malformed ref/);
  assert.throws(() => parseInitialDeclarations({ ...envelope, declarations: [envelope.declarations[0], envelope.declarations[0]] }), /duplicate ref/);
  assert.throws(() => parseInitialDeclarations({ ...envelope, extra: true }), /malformed envelope/);
});
