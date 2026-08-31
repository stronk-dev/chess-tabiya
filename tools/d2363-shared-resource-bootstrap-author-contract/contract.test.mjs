import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/shared-resource-register-bootstrap.md", "utf8");

test("D2363: catalogue replaces both hard-coded resource authorities", () => {
  assert.match(rfc, /`RESOURCE_NAMES` and `SCHEMA_SLUGS` are deleted as independent authority/);
  assert.match(rfc, /derives both sets/);
  assert.match(rfc, /fails C0 before claims are parsed/);
});

test("D2363: only an accepted process RFC may introduce an absent root", () => {
  assert.match(rfc, /authorized only by an accepted process RFC/);
  assert.match(rfc, /catalogue row, an `absent` register section,[\s\S]*?ledger closeout and[\s\S]*?log entry together/);
  assert.match(rfc, /A product RFC cannot add its own resource row/);
});

test("D2363: absent has one unique first-lane lifecycle and one-way landing", () => {
  assert.match(rfc, /head=absent/);
  assert.match(rfc, /at most one active RFC may claim `first lane 1`/);
  assert.match(rfc, /once non-absent, the resource can never return to `absent`/);
  assert.match(rfc, /first product implementation must atomically create[\s\S]*?head to `1`[\s\S]*?remove the live claim/);
});

test("D2363: release manifest handoff creates no premature product bytes", () => {
  assert.match(rfc, /adds the absent `release-manifest-schema` catalogue\/register root and no[\s\S]*?release schema bytes/);
  assert.match(rfc, /verifiable-runtime-distribution\.md` replace its `claims none`/);
  assert.match(rfc, /first lane 1/);
});

test("D2370: concept registry uses the same absent-root protocol without premature bytes", () => {
  assert.match(rfc, /`concept-registry-schema` catalogue\/register root and no[\s\S]*?concept schema, registry or product bytes/);
  assert.match(rfc, /`concept-registry\.md` claim `first lane 1`/);
  assert.match(rfc, /Skills and Campaign consume one compiled authority|`skills\.md` relinquishes direct[\s\S]*?Campaign does the same/);
});

test("D2401: source attribution uses a generic versioned-registry root without premature bytes", () => {
  assert.match(rfc, /`source-attribution-registry` catalogue\/register root and[\s\S]*?no runtime file, attribution row, resolver or product binding/u);
  assert.match(rfc, /`versioned_registry` root/u);
  assert.match(rfc, /`evidence-presentation\.md` replace `claims none`/u);
  assert.match(rfc, /source-attribution-registry \| first lane 1 \| SOURCE_ATTRIBUTION_REGISTRY_RESOURCE/u);
});

test("D2363: acceptance crosses bootstrap, partial landing and history", () => {
  assert.match(rfc, /duplicate first, ordinary lane on absent, first on landed/);
  assert.match(rfc, /file-before-claim, claim-without-root, partial landing/);
  assert.match(rfc, /attempted return to absent/);
});
