import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/safe-deployment-profiles.md", "utf8");
const rest = readFileSync("apps/server/src/rest.ts", "utf8");

function section(from, to) {
  return rfc.match(new RegExp(`${from}[\\s\\S]*?${to}`))?.[0] ?? "";
}

test("D2214: config file and hosted file-certificate mode have no closed input union", () => {
  const profile = section("### 1\\. Closed profile vocabulary", "### 2\\. Profile matrix");
  const hosted = section("### 5\\. Hosted profile", "### 6\\. Public origin");
  const surfaces = section("### 13\\. Operator surfaces", "### 14\\. Code-site inventory");
  assert.match(profile, /type DeploymentProfile = "local" \| "appliance" \| "hosted"/);
  assert.match(hosted, /declared `hosted-file-cert` variant/);
  assert.match(surfaces, /CONFIG=<file>/);
  assert.doesNotMatch(`${profile}\n${hosted}\n${surfaces}`, /interface DeploymentConfig|type DeploymentConfig|FileCertConfig|configVersion:/);
});

test("D2215: appliance requires hostname and CA trust but declares no resolver workflow", () => {
  const matrix = section("### 2\\. Profile matrix", "### 3\\. Local profile");
  const appliance = section("### 4\\. Appliance profile", "### 5\\. Hosted profile");
  assert.match(matrix, /exact hostname plus one-time CA trust on each device/);
  assert.match(appliance, /copies the public root certificate out for device trust/);
  assert.doesNotMatch(appliance, /name resolution|mDNS|hosts file|DNS server|resolver/);
});

test("D2216: proxy-only trust has no exact internal and egress network declaration", () => {
  const topology = section("### 4\\. Appliance profile", "### 7\\. Browser mutation");
  const inventory = section("### 14\\. Code-site inventory", "## Deviations from design");
  assert.match(topology, /bundled Caddy service is the only peer/);
  assert.match(inventory, /private app network/);
  assert.doesNotMatch(`${topology}\n${inventory}`, /internal:\s*true|dual[- ]network|egress network|networks:\s*\n/);
});

test("D2217: budget vocabulary has no assignment for the live unsafe-route population", () => {
  const budgets = section("### 8\\. Request budgets", "### 9\\. Streaming responses");
  const unsafeChecks = rest.match(/request\.method\s*===\s*"(?:POST|PUT|PATCH|DELETE)"/g) ?? [];
  assert.ok(unsafeChecks.length >= 30, `expected at least 30 explicit unsafe route checks, got ${unsafeChecks.length}`);
  assert.match(budgets, /type RequestBodyBudget = "none" \| "json_256k" \| "document_8m"/);
  assert.match(budgets, /Every production unsafe route appears exactly once in the registry/);
  assert.doesNotMatch(budgets, /\/auth\/register|\/runs\/import|\/packs\/drafts|\/shapes\/drafts|\/repertoires/);
});

test("D2218: deployment proof consumes an undeclared receipt", () => {
  const surfaces = section("### 13\\. Operator surfaces", "### 14\\. Code-site inventory");
  const criteria = section("## Acceptance criteria", "## Discharges");
  assert.match(surfaces, /print the exact public URL/);
  assert.match(criteria, /Caddy and server image digests\/config revisions appear in the receipt/);
  assert.doesNotMatch(`${surfaces}\n${criteria}`, /interface Deployment(?:Check|Operation)Receipt|type Deployment(?:Check|Operation)Receipt|receiptVersion:/);
});
