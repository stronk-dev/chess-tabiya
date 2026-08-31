import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/safe-deployment-profiles.md", "utf8");
const rest = readFileSync("apps/server/src/rest.ts", "utf8");

function section(from, to) {
  return rfc.match(new RegExp(`${from}[\\s\\S]*?${to}`))?.[0] ?? "";
}

test("D2214: one closed config union owns every profile and file-certificate input", () => {
  const config = section("### 1\\. Closed profile vocabulary", "### 2\\. Profile matrix");
  assert.match(config, /type DeploymentConfigV1 =/);
  assert.match(config, /profile: "local"/);
  assert.match(config, /profile: "appliance"; readonly hostname: string/);
  assert.match(config, /profile: "hosted"; readonly hostname: string;[\s\S]*?kind: "acme"/);
  assert.match(config, /kind: "files";[\s\S]*?certificate: SecretFileRef; readonly privateKey: SecretFileRef/);
  assert.match(config, /CONFIG_UNKNOWN_KEY/);
  assert.match(config, /compiler alone derives `publicOrigin`/);
  assert.match(config, /Canonical config digest is RFC-8785 SHA-256/);
});

test("D2215: appliance resolution uses literal operator DNS with setup and removal", () => {
  const appliance = section("### 4\\. Appliance profile", "### 5\\. Hosted profile");
  assert.match(appliance, /operator-managed LAN DNS/);
  assert.match(appliance, /Every returned address must be in the configured[\s\S]*?`expectedAddresses` set/);
  assert.match(appliance, /make appliance-name-check CONFIG=<file>/);
  assert.match(appliance, /sends no Host override/);
  assert.match(appliance, /Uninstalling\s+removes the LAN record and Caddy root from every client/);
  assert.match(appliance, /mDNS and per-device hosts files are\s+explicitly unsupported/);
});

test("D2216: the proxy authority is one closed three-edge graph with live bypass probes", () => {
  const topology = section("### 6\\. Public origin and proxy trust", "### 7\\. Browser mutation");
  assert.match(topology, /proxy_edge: \{ internal: true \}/);
  assert.match(topology, /provider_edge: \{ internal: true \}/);
  assert.match(topology, /public_edge: \{\}/);
  assert.match(topology, /`proxy_edge` contains exactly `app` and `caddy`/);
  assert.match(topology, /No service joins Compose `default`/);
  assert.match(topology, /host→app fails; public-edge[\s\S]*?provider-edge[\s\S]*?fails/);
  assert.match(topology, /client-supplied\s+forwarded headers[\s\S]*?replaced before app receipt/);
});

test("D2217: the route manifest is exhaustive by semantic operation, not parser folklore", () => {
  const budgets = section("### 8\\. Request budgets", "### 9\\. Streaming responses");
  const unsafeChecks = rest.match(/request\.method\s*===\s*"(?:POST|PUT|PATCH|DELETE)"/g) ?? [];
  assert.ok(unsafeChecks.length >= 30, `expected live unsafe route population, got ${unsafeChecks.length}`);
  for (const id of [
    "auth.{register,login,logout,export,deletion_preview,delete}",
    "shape_draft.{create,update,lint,register}",
    "pack_draft.{create,update,lint,playtest,register,withdraw}",
    "live.leg.import_pgn",
    "run_action.{marks_replace",
  ]) assert.ok(budgets.includes(id), `missing operation family ${id}`);
  assert.match(budgets, /“Every other” is computed as exact set difference at generation/);
  assert.match(budgets, /POST\s+\/auth\/:action[\s\S]*?auth\.\{register\|login/);
  assert.match(budgets, /POST\s+\/sessions\/:sessionId\/votes[\s\S]*?live\.vote\.\{open\|cast\|close\}/);
  assert.match(budgets, /POST\s+\/runs\/:runId\/:action[\s\S]*?run_action\.<normalized-action>/);
  assert.match(budgets, /`moves` splits to `move_user \| move_opponent`[\s\S]*?`grants` splits to `grant \| revoke`/);
  assert.match(budgets, /Unknown operation\/method resolves to the generated `none`\s+refusal descriptor/);
  assert.match(budgets, /adapter accepts only a compiled descriptor/);
});

test("D2217: document and ordinary command limits are explicit and crossed fixtures fail", () => {
  const budgets = section("### 8\\. Request budgets", "### 9\\. Streaming responses");
  assert.match(budgets, /document_8m:[\s\S]*?shape_draft\.create[\s\S]*?run\.import[\s\S]*?live\.leg\.import_pgn/);
  assert.match(budgets, /json_256k:[\s\S]*?every other literal unsafe operation/);
  assert.match(budgets, /Fixtures mislabel one document operation[\s\S]*?add an unsafe operation[\s\S]*?every mutation fails before listening/);
});

test("D2217: the proxy capability is digest-pinned and probed, while Node stays authoritative", () => {
  const budgets = section("### 8\\. Request budgets", "### 9\\. Streaming responses");
  assert.match(budgets, /caddy:2\.11\.4-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648/);
  assert.match(budgets, /actual 8 MiB\/8 MiB\+1 read through this exact digest on both[\s\S]*?architectures/);
  assert.match(budgets, /Node's per-route reader remains authoritative/);
});

test("D2218: one discriminated receipt binds check, start and probe to artifact identities", () => {
  const receipt = section("#### 13\\.1 One deployment operation and receipt protocol", "The release publishes:");
  assert.match(receipt, /type DeploymentAdminReceiptV1 = DeploymentReceiptBaseV1 &/);
  for (const operation of ["check", "start", "probe"]) {
    assert.match(receipt, new RegExp(`operation: "${operation}"; readonly result: "succeeded"`));
  }
  for (const identity of ["serverImageDigest", "caddyImageDigest", "composeDigest", "caddyConfigDigest", "routeBudgetManifestDigest"]) {
    assert.ok(receipt.includes(identity), `missing artifact identity ${identity}`);
  }
  assert.match(receipt, /live container\/image\/config identity[\s\S]*?preceding start\/check identity/);
});

test("D2218: stdout grammar, exit map and ownership are closed", () => {
  const receipt = section("#### 13\\.1 One deployment operation and receipt protocol", "The release publishes:");
  assert.match(receipt, /exactly one RFC-8785-canonical JSON value followed by one newline and no[\s\S]*?other stdout bytes/);
  assert.match(receipt, /Exit status is `0` only for `succeeded`, `2` for `refused`, `3`/);
  assert.match(receipt, /`4` only for `INTERNAL_ERROR`/);
  assert.match(receipt, /one server-owned, non-persisted CLI protocol/);
  assert.match(receipt, /persisted product schema, a non-server writer, or an independently[\s\S]*?shared-resource register/);
});
