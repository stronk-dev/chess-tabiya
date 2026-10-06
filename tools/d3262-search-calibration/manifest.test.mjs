import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { mock, test } from "node:test";
import { manifestIdentity, manifestRows, validateCarlsbadFixture } from "./manifest.mjs";

test("historical Carlsbad bytes preserve the original 66-root manifest and provenance", () => {
  const bytes = readFileSync(new URL("./fixtures/carlsbad-minority-attack.json", import.meta.url));
  assert.equal(validateCarlsbadFixture(bytes).digest, "b23c29b5d9136ba36f9f15cde34be831b7c13d990e5f3e51a0a84a25a86b7d52");
  assert.equal(manifestIdentity.manifestDigest, "sha256:244c750c432e0a73f37b32fcbfcc8158a6b511d980fcf9b0267d95f8506dff86");
  assert.equal(manifestRows.length, 66);
  assert.equal(manifestRows.find((row) => row.id === "quiet-plan:carlsbad-nf8").source,
    "content/drafts/carlsbad-minority-attack.json#nf8-regroup");
});

test("changed fixture bytes and the migrated live pack cannot replace the frozen input", () => {
  const bytes = readFileSync(new URL("./fixtures/carlsbad-minority-attack.json", import.meta.url));
  assert.throws(() => validateCarlsbadFixture(Buffer.concat([bytes, Buffer.from("\n")])), /control changed/u);
  const pack = JSON.parse(bytes);
  pack.start.fen = "changed";
  assert.throws(() => validateCarlsbadFixture(Buffer.from(JSON.stringify(pack))), /control changed/u);
  const implementation = readFileSync(new URL("./manifest.mjs", import.meta.url), "utf8");
  assert.ok(!implementation.includes('new URL("../../content/drafts/carlsbad-minority-attack.json"'));
});

test("fresh manifest construction cannot read a mutable live control", async () => {
  const original = fs.readFileSync;
  const live = new URL("../../content/drafts/carlsbad-minority-attack.json", import.meta.url).pathname;
  const guard = mock.method(fs, "readFileSync", (path, ...options) => {
    const resolved = path instanceof URL ? path.pathname : String(path);
    assert.notEqual(resolved, live, "Historical experiment read the mutable live pack");
    return original(path, ...options);
  });
  syncBuiltinESMExports();
  try {
    const fresh = await import("./manifest.mjs?mutable-source-denied");
    assert.equal(fresh.manifestIdentity.manifestDigest, manifestIdentity.manifestDigest);
    assert.ok(guard.mock.calls.length >= 2);
  } finally {
    guard.mock.restore();
    syncBuiltinESMExports();
  }
});
