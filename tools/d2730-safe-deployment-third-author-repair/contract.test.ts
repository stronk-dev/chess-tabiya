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
  loadAuthorizedDeploymentImage,
  parseDeploymentReceipt,
  passDeploymentCheck,
  sealIngressSwitch,
  serializeDeploymentReceipt,
  validateComposedReadiness,
  validateTlsHandshake,
  type ActiveProfileState,
  type DeploymentSubject,
  type ReadinessAuthority,
  type StrictDeploymentArtifacts,
  type ValidatedTlsIdentity,
} from "./contract.js";

const file = Object.freeze({ absolute: true, regular: true, symlink: false, sameInode: true, mode: 0o600 });
const operationId = parseDeploymentOperationId("123e4567-e89b-42d3-a456-426614174000");
const digest = (character: string) => parseSha256(`sha256:${character.repeat(64)}`);
const revision = "a".repeat(40);
const now = "2026-09-05T12:00:00.000Z";
const directories: string[] = [];

afterEach(() => {
  while (directories.length > 0) rmSync(directories.pop()!, { recursive: true, force: true });
});

function compile(profile: DeploymentProfile, hostname = "chess.example"): CompiledDeploymentConfig {
  if (profile === "local") return compileDeploymentConfig(
    '{"format":"tabiya-deployment-config","configVersion":1,"profile":"local"}', file);
  if (profile === "appliance") return compileDeploymentConfig(JSON.stringify({ format: "tabiya-deployment-config",
    configVersion: 1, profile, hostname, resolution: { kind: "operator_dns", expectedAddresses: ["192.0.2.1"] } }), file);
  return compileDeploymentConfig(JSON.stringify({ format: "tabiya-deployment-config", configVersion: 1,
    profile, hostname, tls: { kind: "acme", contactEmail: "owner@example.com" } }), file);
}

function tls(hostname = "chess.example"): ValidatedTlsIdentity {
  return validateTlsHandshake({ leafSha256: digest("1"), spkiSha256: digest("2"),
    chainSha256: digest("3"), trustRootSha256: digest("4"), chainTrusted: true, hostname,
    sans: [hostname], notBefore: "2026-09-01T00:00:00.000Z",
    notAfter: "2026-12-01T00:00:00.000Z", observedAt: now }, hostname);
}

function subject(profile: DeploymentProfile, operation: DeploymentOperation,
  hostname = "chess.example"): DeploymentSubject {
  const compiled = compile(profile, hostname); const bytes = renderCompiledDeploymentImage(compiled);
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

describe("safe deployment third author repair", () => {
  it("D2730 admits only the complete compiler relation under the expected mounted digest", () => {
    for (const profile of ["local", "appliance", "hosted"] as const) {
      const compiled = compile(profile); const bytes = renderCompiledDeploymentImage(compiled);
      expect(loadAuthorizedDeploymentImage(bytes, sha256(bytes)).boundary.profile).toBe(profile);
      expect(() => loadAuthorizedDeploymentImage(bytes, digest("f"))).toThrow(/DIGEST/);
    }
    const compiled = compile("appliance");
    const impossible = JSON.parse(renderCompiledDeploymentImage(compiled)) as { boundary: { tlsMode: string; listenPort: number } };
    impossible.boundary.tlsMode = "acme"; impossible.boundary.listenPort = 4444;
    const bytes = JSON.stringify(impossible);
    expect(() => loadAuthorizedDeploymentImage(bytes, sha256(bytes))).toThrow(/RELATION/);
  });

  it("D2731 seals every check and receipt field to one compiled deployment subject", () => {
    const first = subject("local", "probe"); const second = subject("local", "probe");
    const checks = allChecks(first);
    const receipt = compileDeploymentSuccess(first, checks, 12);
    expect(receipt).toMatchObject({ profile: "local", publicUrl: "http://127.0.0.1:3000",
      configDigest: first.configDigest, compiledConfigImageDigest: first.imageDigest, result: "succeeded" });
    expect(() => compileDeploymentSuccess(second, checks, 12)).toThrow(/PROOF/);
    expect(() => passDeploymentCheck(first, "config", digest("e"))).toThrow(/CHECK_FAILED/);
  });

  it("D2732 implements and strictly parses every terminal receipt arm", () => {
    const value = subject("hosted", "start");
    const receipts = [compileDeploymentSuccess(value, allChecks(value), 0),
      compileDeploymentTerminal(value, "refused", "CONFIG_REFUSED", 1),
      compileDeploymentTerminal(value, "failed", "READINESS_FAILED", 2, "readiness"),
      compileDeploymentTerminal(value, "cancelled", "OPERATION_CANCELLED", 3, "SIGTERM")];
    for (const receipt of receipts) expect(parseDeploymentReceipt(serializeDeploymentReceipt(receipt))).toEqual(receipt);
    const mutable = JSON.parse(serializeDeploymentReceipt(receipts[0]!)) as Record<string, unknown>;
    mutable.deploymentRevision = "latest";
    expect(() => parseDeploymentReceipt(JSON.stringify(mutable))).toThrow(/RECEIPT/);
    const unsafe = JSON.parse(serializeDeploymentReceipt(receipts[1]!)) as Record<string, unknown>;
    unsafe.elapsedMs = Number.MAX_SAFE_INTEGER + 1;
    expect(() => parseDeploymentReceipt(JSON.stringify(unsafe))).toThrow(/ELAPSED/);
    expect(() => parseDeploymentReceipt(`${serializeDeploymentReceipt(receipts[1]!)} `)).toThrow(/NONCANONICAL/);
  });

  it("D2733 requires live chain trust, canonical clock validity, and one exact SAN", () => {
    const base = { leafSha256: digest("1"), spkiSha256: digest("2"), chainSha256: digest("3"),
      trustRootSha256: digest("4"), chainTrusted: true, hostname: "chess.example", sans: ["chess.example"],
      notBefore: "2026-09-01T00:00:00.000Z", notAfter: "2026-12-01T00:00:00.000Z", observedAt: now };
    expect(() => validateTlsHandshake({ ...base, chainTrusted: false }, "chess.example")).toThrow(/VALIDATION/);
    expect(() => validateTlsHandshake({ ...base, sans: ["chess.example", "other.example"] }, "chess.example")).toThrow(/VALIDATION/);
    expect(() => validateTlsHandshake({ ...base, notBefore: "2026-10-01T00:00:00.000Z" }, "chess.example")).toThrow(/VALIDATION/);
    expect(() => validateTlsHandshake({ ...base, observedAt: "not-a-clock" }, "chess.example")).toThrow(/CLOCK/);
    const hosted = subject("hosted", "start");
    expect(() => passDeploymentCheck(hosted, "certificate", { ...hosted.artifacts.tlsIdentity! })).toThrow(/TLS_AUTHORITY/);
  });

  it("D2734 composes storage readiness with immutable deployment attestation", () => {
    const value = subject("local", "start");
    expect(() => validateComposedReadiness(value, { status: 200,
      body: '{"representativeData":false,"status":"ready","storageVersion":1}',
      deploymentRevision: revision, compiledConfigImageDigest: value.imageDigest })).toThrow(/STORAGE/);
    expect(() => validateComposedReadiness(value, { status: 200,
      body: '{"representativeData":true,"status":"ready","storageVersion":1}',
      deploymentRevision: "b".repeat(40), compiledConfigImageDigest: value.imageDigest })).toThrow(/ATTESTATION/);
    const authority = readiness(value);
    expect(passDeploymentCheck(value, "readiness", authority).subject).toBe(value);
    expect(() => passDeploymentCheck(subject("local", "start"), "readiness", authority)).toThrow(/READINESS_AUTHORITY/);
  });

  it("D2735 fsyncs a restart-resumable journal around durable database effects and ingress", () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-deployment-")); directories.push(directory);
    const database = join(directory, "tabiya.sqlite");
    const sourceSubject = subject("local", "start"); const targetSubject = subject("hosted", "start");
    const local: ActiveProfileState = { state: "active", generation: 1, profile: "local",
      publicOrigin: sourceSubject.publicUrl, configDigest: sourceSubject.configDigest,
      compiledConfigImageDigest: sourceSubject.imageDigest };
    const hosted: ActiveProfileState = { state: "active", generation: 2, profile: "hosted",
      publicOrigin: targetSubject.publicUrl, configDigest: targetSubject.configDigest,
      compiledConfigImageDigest: targetSubject.imageDigest };
    let store = new ProfileMigrationStore(directory, database); store.initialize(local);
    store.database.exec("INSERT INTO deployment_sessions VALUES ('s'); INSERT INTO deployment_public_tokens VALUES ('t')");
    expect(() => store.begin(operationId, { ...local, generation: -1 }, hosted)).toThrow(/STATE/);
    store.begin(operationId, local, hosted); expect(() => store.advance(operationId, "target_ready")).toThrow(/ORDER/);
    store.advance(operationId, "invalidate_sessions"); store.close();
    store = new ProfileMigrationStore(directory, database);
    expect((store.database.prepare("SELECT count(*) AS n FROM deployment_sessions").get() as { n: number }).n).toBe(0);
    expect(store.phase(operationId)).toBe("sessions_invalidated");
    store.advance(operationId, "revoke_public_tokens"); store.close();
    store = new ProfileMigrationStore(directory, database);
    expect((store.database.prepare("SELECT count(*) AS n FROM deployment_public_tokens").get() as { n: number }).n).toBe(0);
    const wrongTarget = subject("hosted", "start", "other.example");
    expect(() => store.advance(operationId, "target_ready", readiness(wrongTarget))).toThrow(/TARGET_READINESS/);
    store.advance(operationId, "target_ready", readiness(targetSubject)); store.close();
    store = new ProfileMigrationStore(directory, database);
    expect(() => store.advance(operationId, "commit", undefined, { ...sealIngressSwitch(hosted) })).toThrow(/INGRESS/);
    expect(store.advance(operationId, "commit", undefined, sealIngressSwitch(hosted))).toEqual(hosted);
    store.close(); store = new ProfileMigrationStore(directory, database);
    expect(store.state()).toEqual(hosted); store.close();
  });
});
