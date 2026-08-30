import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/verifiable-runtime-distribution.md", "utf8");
const botCatalog = readFileSync("apps/server/src/bot-policy-catalog.ts", "utf8");

test("D2206: the release manifest has many readers but no versioned schema/register claim", () => {
  const artifactSet = rfc.match(/### 1\. Release artifact set[\s\S]*?### 2\. Immutable build inputs/)?.[0] ?? "";
  assert.match(artifactSet, /Compose,\s+release upload and the in-app About response consume it/);
  assert.match(rfc, /consumer drill that downloads only the release set/);
  assert.match(artifactSet, /release-local format owned by that one producer\/parser and claims no schema\/register lane/);
  assert.doesNotMatch(artifactSet, /(?:formatVersion|schemaVersion|releaseManifestVersion)/);
});

test("D2207: the image must embed the manifest that records the image digest", () => {
  assert.match(rfc, /server image contains only:[\s\S]*exact source\/release manifest/);
  assert.match(rfc, /each artifact's role[\s\S]*fully qualified digest/);
  assert.match(rfc, /push immutable platform manifests and multi-architecture index;[\s\S]*generate the canonical release manifest/);
});

test("D2208: FOSS eligibility has refusals but no closed accepted licence policy", () => {
  assert.match(rfc, /FOSS-eligible only after D1/);
  assert.match(rfc, /proprietary\/licence-ref component/);
  assert.doesNotMatch(rfc, /(?:FOSS_LICENSE|ACCEPTED_SPDX|AcceptedLicence|LicensePolicyVersion)/);
});

test("D2209: CPU resource proof requires bot selections while the production roster is empty", () => {
  const resourceContract = rfc.match(/### 5\. Numerical resource contract[\s\S]*?### 6\. SBOM and notices/)?.[0] ?? "";
  assert.match(resourceContract, /100\s+sequential opponent selections at the widest supported candidate window/);
  assert.match(botCatalog, /BOT_POLICY_PROFILES = compileBotPolicyCatalog\(\[\]\)/);
  assert.doesNotMatch(resourceContract, /BOT_POLICY_PROFILES|profileDigest|bot profile digest/);
});
