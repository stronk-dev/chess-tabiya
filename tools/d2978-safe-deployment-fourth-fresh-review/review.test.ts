import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  compileDeploymentConfig,
  parseDeploymentOperationId,
  parseSha256,
  renderCompiledDeploymentImage,
  requiredChecks,
  sha256,
  type CompiledDeploymentConfig,
  type DeploymentOperation,
  type DeploymentProfile,
} from "../d2614-safe-deployment-second-author-repair/contract.js";
import {
  ProfileMigrationStore,
  compileDeploymentSubject,
  compileDeploymentSuccess,
  compileDeploymentTerminal,
  expectedSubjectCheckDigest,
  parseDeploymentReceipt,
  passDeploymentCheck,
  sealIngressSwitch,
  serializeDeploymentReceipt,
  validateComposedReadiness,
  validateTlsHandshake,
  type ActiveProfileState,
  type DeploymentReceipt,
  type DeploymentSubject,
  type ReadinessAuthority,
  type StrictDeploymentArtifacts,
  type ValidatedTlsIdentity,
} from "../d2730-safe-deployment-third-author-repair/contract.js";

const configFile = Object.freeze({ absolute: true, regular: true, symlink: false, sameInode: true, mode: 0o600 });
const operationId = parseDeploymentOperationId("123e4567-e89b-42d3-a456-426614174000");
const digest = (character: string) => parseSha256(`sha256:${character.repeat(64)}`);
const revision = "a".repeat(40);
const directories: string[] = [];

afterEach(() => {
  while (directories.length > 0) rmSync(directories.pop()!, { recursive: true, force: true });
});

function compile(profile: DeploymentProfile, hostname = "chess.example"): CompiledDeploymentConfig {
  if (profile === "local") {
    return compileDeploymentConfig(
      '{"format":"tabiya-deployment-config","configVersion":1,"profile":"local"}',
      configFile,
    );
  }
  if (profile === "appliance") {
    return compileDeploymentConfig(JSON.stringify({ format: "tabiya-deployment-config", configVersion: 1,
      profile, hostname, resolution: { kind: "operator_dns", expectedAddresses: ["192.0.2.1"] } }), configFile);
  }
  return compileDeploymentConfig(JSON.stringify({ format: "tabiya-deployment-config", configVersion: 1,
    profile, hostname, tls: { kind: "acme", contactEmail: "owner@example.com" } }), configFile);
}

function tls(hostname = "chess.example"): ValidatedTlsIdentity {
  return validateTlsHandshake({ leafSha256: digest("1"), spkiSha256: digest("2"),
    chainSha256: digest("3"), trustRootSha256: digest("4"), chainTrusted: true, hostname,
    sans: [hostname], notBefore: "2026-09-01T00:00:00.000Z",
    notAfter: "2026-12-01T00:00:00.000Z", observedAt: "2026-09-05T12:00:00.000Z" }, hostname);
}

function subject(profile: DeploymentProfile, operation: DeploymentOperation,
  hostname = "chess.example"): DeploymentSubject {
  const compiled = compile(profile, hostname);
  const bytes = renderCompiledDeploymentImage(compiled);
  const identity = profile === "local" || operation === "check" ? null : tls(hostname);
  const artifacts: StrictDeploymentArtifacts = { deploymentRevision: revision,
    serverImageDigest: digest("5"), caddyImageDigest: profile === "local" ? null : digest("6"),
    composeDigest: digest("7"), caddyConfigDigest: profile === "local" ? null : digest("8"),
    routeBudgetManifestDigest: digest("9"), compiledConfigImageDigest: sha256(bytes), tlsIdentity: identity };
  return compileDeploymentSubject(operationId, operation, compiled, bytes, sha256(bytes), artifacts);
}

function readiness(value: DeploymentSubject): ReadinessAuthority {
  return validateComposedReadiness(value, { status: 200,
    body: '{"representativeData":true,"status":"ready","storageVersion":1}',
    deploymentRevision: value.artifacts.deploymentRevision,
    compiledConfigImageDigest: value.imageDigest });
}

function allChecks(value: DeploymentSubject) {
  return requiredChecks(value.profile, value.operation).map((check) => passDeploymentCheck(value, check,
    check === "readiness" ? readiness(value)
      : check === "certificate" ? value.artifacts.tlsIdentity!
        : expectedSubjectCheckDigest(value, check)));
}

function active(profile: DeploymentProfile, generation: number, subjectValue: DeploymentSubject): ActiveProfileState {
  return { state: "active", generation, profile, publicOrigin: subjectValue.publicUrl,
    configDigest: subjectValue.configDigest, compiledConfigImageDigest: subjectValue.imageDigest };
}

describe("D2978-D2985 safe-deployment fourth fresh independent review", () => {
  it("D2978 brands a trusted live TLS handshake from caller-authored values with no server", () => {
    const identity = tls("absent.example");
    expect(identity).toMatchObject({ hostname: "absent.example", trustRootSha256: digest("4") });
  });

  it("D2979 compiles proxied probe success from eleven self-attested digest echoes", () => {
    const value = subject("hosted", "probe");
    const checks = allChecks(value);
    expect(checks).toHaveLength(13);
    expect(compileDeploymentSuccess(value, checks, 1)).toMatchObject({ result: "succeeded", checks: requiredChecks("hosted", "probe") });
  });

  it("D2980 brands readiness from a caller-written response with no application route", () => {
    const value = subject("local", "start");
    expect(readiness(value)).toMatchObject({ subject: value, body: { representativeData: true, status: "ready" } });
  });

  it("D2981 publishes a migrated profile after caller-only ingress sealing", () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-deploy-review-")); directories.push(directory);
    const source = subject("local", "start");
    const target = subject("hosted", "start");
    const from = active("local", 1, source);
    const to = active("hosted", 2, target);
    const store = new ProfileMigrationStore(directory, join(directory, "tabiya.sqlite"));
    store.initialize(from);
    store.begin(operationId, from, to);
    store.advance(operationId, "invalidate_sessions");
    store.advance(operationId, "revoke_public_tokens");
    store.advance(operationId, "target_ready", readiness(target));
    expect(store.advance(operationId, "commit", undefined, sealIngressSwitch(to))).toEqual(to);
    store.close();
  });

  it("D2982 advances past invalidation while product-named session and token rows remain live", () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-deploy-review-")); directories.push(directory);
    const source = subject("local", "start");
    const target = subject("hosted", "start");
    const from = active("local", 1, source);
    const to = active("hosted", 2, target);
    const store = new ProfileMigrationStore(directory, join(directory, "tabiya.sqlite"));
    store.database.exec(`CREATE TABLE learner_sessions (id TEXT PRIMARY KEY) STRICT;
      CREATE TABLE public_tokens (id TEXT PRIMARY KEY, revoked INTEGER NOT NULL DEFAULT 0) STRICT;
      INSERT INTO learner_sessions VALUES ('live-session');
      INSERT INTO public_tokens VALUES ('live-token', 0);`);
    store.initialize(from);
    store.begin(operationId, from, to);
    store.advance(operationId, "invalidate_sessions");
    store.advance(operationId, "revoke_public_tokens");
    expect(store.database.prepare("SELECT count(*) AS n FROM learner_sessions").get()).toEqual({ n: 1 });
    expect(store.database.prepare("SELECT revoked FROM public_tokens").get()).toEqual({ revoked: 0 });
    store.close();
  });

  it("D2983 initializes generation zero over an existing database without storage inspection", () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-deploy-review-")); directories.push(directory);
    const source = subject("local", "start");
    const store = new ProfileMigrationStore(directory, join(directory, "tabiya.sqlite"));
    store.database.exec("INSERT INTO deployment_sessions VALUES ('restored-session')");
    const zero = active("local", 0, source);
    store.initialize(zero);
    expect(store.state()).toEqual(zero);
    store.close();
  });

  it("D2984 parses crossed success artifacts and undeclared terminal codes", () => {
    const value = subject("local", "check");
    const success = compileDeploymentSuccess(value, allChecks(value), 1);
    const crossed = JSON.parse(serializeDeploymentReceipt(success)) as DeploymentReceipt & {
      publicUrl: string; artifacts: { caddyImageDigest: string; caddyConfigDigest: string };
    };
    crossed.publicUrl = "https://attacker.example/not-an-origin";
    crossed.artifacts.caddyImageDigest = digest("6");
    crossed.artifacts.caddyConfigDigest = digest("8");
    expect(parseDeploymentReceipt(serializeDeploymentReceipt(crossed))).toMatchObject({
      result: "succeeded", profile: "local", publicUrl: crossed.publicUrl,
      artifacts: { caddyImageDigest: digest("6") },
    });

    const refused = JSON.parse(serializeDeploymentReceipt(
      compileDeploymentTerminal(value, "refused", "CONFIG_REFUSED", 1),
    )) as DeploymentReceipt & { code: string };
    refused.code = "UNDECLARED_AUTHORITY";
    expect(parseDeploymentReceipt(serializeDeploymentReceipt(refused))).toMatchObject({ code: "UNDECLARED_AUTHORITY" });
  });

  it("D2985 compiles mounted-image authority entirely from bytes without a mount capability", () => {
    const compiled = compile("local");
    const bytes = renderCompiledDeploymentImage(compiled);
    const artifacts: StrictDeploymentArtifacts = { deploymentRevision: revision,
      serverImageDigest: digest("5"), caddyImageDigest: null, composeDigest: digest("7"),
      caddyConfigDigest: null, routeBudgetManifestDigest: digest("9"),
      compiledConfigImageDigest: sha256(bytes), tlsIdentity: null };
    expect(compileDeploymentSubject(operationId, "check", compiled, bytes, sha256(bytes), artifacts)).toMatchObject({
      profile: "local", imageDigest: sha256(bytes),
    });
  });
});
