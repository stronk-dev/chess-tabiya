// DISPOSABLE second fresh independent buildability review — D2614-D2618.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const rfc = readFileSync("rfc/safe-deployment-profiles.md", "utf8");
const protocol = readFileSync("tools/d2214-safe-deployment-author-repair/protocol.proposed.ts", "utf8");

function diagnosticsFor(source) {
  const filename = "/virtual/deployment-review.ts";
  const options = { strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext };
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, onError, shouldCreateNewSourceFile) =>
    name === filename ? ts.createSourceFile(filename, source, languageVersion, true) : original(name, languageVersion, onError, shouldCreateNewSourceFile);
  host.fileExists = (name) => name === filename || ts.sys.fileExists(name);
  host.readFile = (name) => name === filename ? source : ts.sys.readFile(name);
  return ts.getPreEmitDiagnostics(ts.createProgram([filename], options, host));
}

test("D2614 compiled config cannot cross the environment/container boundary as the same value", () => {
  assert.match(rfc, /same compiled `DeploymentConfigResult` is the sole[\s\S]{0,180}server environment/u);
  assert.match(rfc, /TABIYA_DEPLOYMENT_PROFILE=local[\s\S]*TABIYA_PUBLIC_ORIGIN=/u);
  assert.doesNotMatch(rfc, /mount(?:ed)? canonical (?:deployment )?config|verify(?:ing|ies)? configDigest inside (?:the )?app/u);
});

test("D2615 proposed algebra contains no unknown-input config compiler", () => {
  assert.doesNotMatch(protocol, /function (?:parse|compile)DeploymentConfig|DeploymentConfigResult|CONFIG_JSON_INVALID/u);
  assert.doesNotMatch(protocol, /JSON\.parse|lstat|fstat|RFC[- ]?8785|createHash/u);
});

test("D2616 hosted success typechecks with empty proof, services and malformed identities", () => {
  const impossible = `${protocol}\nvoid ({ protocol: "tabiya-deployment-admin-receipt", protocolVersion: 1, operationId: "x", operation: "start", profile: "hosted", configDigest: "sha256:", publicUrl: "not a url", elapsedMs: -4, result: "succeeded", artifacts: { deploymentRevision: "latest", serverImageDigest: "sha256:", caddyImageDigest: null, composeDigest: "sha256:", caddyConfigDigest: null, routeBudgetManifestDigest: "sha256:" }, services: [], checks: [] } satisfies Receipt);\n`;
  const diagnostics = diagnosticsFor(impossible).filter((entry) => entry.file?.fileName === "/virtual/deployment-review.ts");
  assert.deepEqual(diagnostics.map((entry) => ts.flattenDiagnosticMessageText(entry.messageText, "\n")), []);
});

test("D2617 artifact identity excludes certificate and public-key fingerprints", () => {
  const identity = rfc.match(/type DeploymentArtifactIdentityV1 = \{[\s\S]*?\n\};/u)?.[0] ?? "";
  assert.ok(identity.length > 0);
  assert.doesNotMatch(identity, /certificate|fingerprint|spki|serial|notAfter|subjectAltName/iu);
  assert.match(rfc, /Secret contents never enter config digests/u);
});

test("D2618 profile-switch refusal has no transition authority", () => {
  assert.match(rfc, /PROFILE_SWITCH_REFUSED/u);
  assert.match(rfc, /profile-switch refusal pass/u);
  assert.doesNotMatch(rfc, /(?:ProfileTransition|profile transition|currentProfileDigest|installed profile state)/u);
});
