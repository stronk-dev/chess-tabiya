// DISPOSABLE D2730-D2735 safe-deployment third-author model. Not production code.
import { DatabaseSync } from "node:sqlite";
import { closeSync, constants, existsSync, fsyncSync, mkdirSync, openSync, readFileSync,
  renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  loadCompiledDeploymentImage,
  parseDeploymentOperationId,
  parseSha256,
  renderCompiledDeploymentImage,
  requiredChecks,
  sha256,
  type CompiledDeploymentConfig,
  type CompiledDeploymentImage,
  type DeploymentOperation,
  type DeploymentOperationId,
  type DeploymentProfile,
  type Sha256,
} from "../d2614-safe-deployment-second-author-repair/contract.js";

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  }
  if (typeof value === "number" && !Number.isFinite(value)) throw new TypeError("CANONICAL_VALUE_INVALID");
  return JSON.stringify(value);
};
const record = (value: unknown, error: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(error);
  return value as Record<string, unknown>;
};
const exact = (value: Record<string, unknown>, keys: readonly string[], error: string): void => {
  if (Object.keys(value).sort().join("\0") !== [...keys].sort().join("\0")) throw new TypeError(error);
};
const text = (value: unknown, error: string): string => {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(error);
  return value;
};
const natural = (value: unknown, error: string): number => {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new TypeError(error);
  return value as number;
};
const instant = (value: unknown, error: string): string => {
  const parsed = text(value, error);
  let canonicalInstant: string;
  try { canonicalInstant = new Date(parsed).toISOString(); } catch { throw new TypeError(error); }
  if (canonicalInstant !== parsed) throw new TypeError(error);
  return parsed;
};
const strictJson = (bytes: string, error: string): Record<string, unknown> => {
  let parsed: Record<string, unknown>;
  try { parsed = record(JSON.parse(bytes) as unknown, error); } catch { throw new TypeError(error); }
  if (canonical(parsed) !== bytes) throw new TypeError(`${error}_NONCANONICAL`);
  return parsed;
};
const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

export function loadAuthorizedDeploymentImage(bytes: string, expectedDigest: Sha256): CompiledDeploymentImage {
  if (sha256(bytes) !== expectedDigest) throw new TypeError("COMPILED_IMAGE_DIGEST_MISMATCH");
  const image = loadCompiledDeploymentImage(bytes);
  const boundary = image.boundary;
  const commonProxy = boundary.listenHost === "tabiya-proxy-origin" && boundary.listenPort === 3000
    && boundary.behindBundledProxy && boundary.secureCookie && boundary.hostname !== null
    && boundary.publicOrigin === `https://${boundary.hostname}`;
  const valid = boundary.profile === "local"
    ? boundary.listenHost === "0.0.0.0" && boundary.listenPort === 3000
      && !boundary.behindBundledProxy && !boundary.secureCookie && boundary.hostname === null
      && boundary.tlsMode === "none" && /^http:\/\/127\.0\.0\.1:[0-9]+$/u.test(boundary.publicOrigin)
    : boundary.profile === "appliance"
      ? commonProxy && boundary.tlsMode === "internal"
      : boundary.profile === "hosted" && commonProxy && (boundary.tlsMode === "acme" || boundary.tlsMode === "files");
  if (!valid) throw new TypeError("COMPILED_IMAGE_RELATION_INVALID");
  return image;
}

export interface ValidatedTlsIdentity {
  readonly leafSha256: Sha256; readonly spkiSha256: Sha256; readonly chainSha256: Sha256;
  readonly trustRootSha256: Sha256; readonly hostname: string; readonly sans: readonly [string];
  readonly notBefore: string; readonly notAfter: string; readonly observedAt: string;
}
const tlsAuthorities = new WeakSet<object>();

export function validateTlsHandshake(input: Readonly<{ leafSha256: Sha256; spkiSha256: Sha256;
  chainSha256: Sha256; trustRootSha256: Sha256; chainTrusted: boolean; hostname: string;
  sans: readonly string[]; notBefore: string; notAfter: string; observedAt: string }>,
  expectedHostname: string): ValidatedTlsIdentity {
  for (const value of [input.leafSha256, input.spkiSha256, input.chainSha256, input.trustRootSha256]) parseSha256(value);
  const observedAt = instant(input.observedAt, "TLS_CLOCK_INVALID");
  const notBefore = instant(input.notBefore, "TLS_TIME_INVALID");
  const notAfter = instant(input.notAfter, "TLS_TIME_INVALID");
  if (!input.chainTrusted || input.hostname !== expectedHostname || input.sans.length !== 1
    || input.sans[0] !== expectedHostname || Date.parse(notBefore) > Date.parse(observedAt)
    || Date.parse(notAfter) <= Date.parse(observedAt)) throw new TypeError("TLS_VALIDATION_FAILED");
  const identity = deepFreeze({ leafSha256: input.leafSha256, spkiSha256: input.spkiSha256,
    chainSha256: input.chainSha256, trustRootSha256: input.trustRootSha256, hostname: expectedHostname,
    sans: [expectedHostname] as readonly [string], notBefore, notAfter, observedAt });
  tlsAuthorities.add(identity);
  return identity;
}

export interface StrictDeploymentArtifacts {
  readonly deploymentRevision: string; readonly serverImageDigest: Sha256;
  readonly caddyImageDigest: Sha256 | null; readonly composeDigest: Sha256;
  readonly caddyConfigDigest: Sha256 | null; readonly routeBudgetManifestDigest: Sha256;
  readonly compiledConfigImageDigest: Sha256; readonly tlsIdentity: ValidatedTlsIdentity | null;
}
const REVISION = /^[0-9a-f]{40}$/u;

function validateArtifacts(value: StrictDeploymentArtifacts, profile: DeploymentProfile,
  operation: DeploymentOperation): StrictDeploymentArtifacts {
  if (!REVISION.test(value.deploymentRevision)) throw new TypeError("DEPLOYMENT_REVISION_INVALID");
  for (const item of [value.serverImageDigest, value.composeDigest, value.routeBudgetManifestDigest,
    value.compiledConfigImageDigest]) parseSha256(item);
  if (profile === "local") {
    if (value.caddyImageDigest !== null || value.caddyConfigDigest !== null || value.tlsIdentity !== null) {
      throw new TypeError("ARTIFACT_PROFILE_MISMATCH");
    }
  } else {
    parseSha256(value.caddyImageDigest); parseSha256(value.caddyConfigDigest);
    if (operation === "check" ? value.tlsIdentity !== null
      : value.tlsIdentity === null || !tlsAuthorities.has(value.tlsIdentity)) throw new TypeError("TLS_AUTHORITY_INVALID");
  }
  return deepFreeze({ ...value });
}

export interface DeploymentSubject {
  readonly operationId: DeploymentOperationId; readonly operation: DeploymentOperation;
  readonly profile: DeploymentProfile; readonly configDigest: Sha256; readonly imageDigest: Sha256;
  readonly publicUrl: string; readonly artifacts: StrictDeploymentArtifacts;
}
const deploymentSubjects = new WeakSet<object>();

export function compileDeploymentSubject(operationId: DeploymentOperationId, operation: DeploymentOperation,
  compiled: CompiledDeploymentConfig, mountedBytes: string, expectedMountedDigest: Sha256,
  artifacts: StrictDeploymentArtifacts): DeploymentSubject {
  const expectedBytes = renderCompiledDeploymentImage(compiled);
  if (mountedBytes !== expectedBytes) throw new TypeError("MOUNTED_IMAGE_NOT_COMPILED_CONFIG");
  const image = loadAuthorizedDeploymentImage(mountedBytes, expectedMountedDigest);
  if (image.configDigest !== compiled.configDigest || artifacts.compiledConfigImageDigest !== image.imageDigest) {
    throw new TypeError("DEPLOYMENT_SUBJECT_IDENTITY_MISMATCH");
  }
  if (image.boundary.hostname !== null && artifacts.tlsIdentity !== null
    && artifacts.tlsIdentity.hostname !== image.boundary.hostname) throw new TypeError("DEPLOYMENT_TLS_HOSTNAME_MISMATCH");
  const subject = deepFreeze({ operationId, operation, profile: image.boundary.profile,
    configDigest: image.configDigest, imageDigest: image.imageDigest, publicUrl: image.boundary.publicOrigin,
    artifacts: validateArtifacts(artifacts, image.boundary.profile, operation) });
  deploymentSubjects.add(subject);
  return subject;
}

export interface StorageReadinessBody { readonly representativeData: true; readonly status: "ready";
  readonly storageVersion: number }
export interface ReadinessResponse { readonly status: 200; readonly body: string;
  readonly deploymentRevision: string; readonly compiledConfigImageDigest: Sha256 }
export interface ReadinessAuthority { readonly subject: DeploymentSubject; readonly body: StorageReadinessBody;
  readonly digest: Sha256 }
const readinessAuthorities = new WeakSet<object>();

export function validateComposedReadiness(subject: DeploymentSubject, response: ReadinessResponse): ReadinessAuthority {
  if (!deploymentSubjects.has(subject) || response.status !== 200
    || response.deploymentRevision !== subject.artifacts.deploymentRevision
    || response.compiledConfigImageDigest !== subject.imageDigest) throw new TypeError("DEPLOYMENT_READINESS_ATTESTATION_INVALID");
  const body = strictJson(response.body, "STORAGE_READINESS_INVALID");
  exact(body, ["representativeData", "status", "storageVersion"], "STORAGE_READINESS_FIELDS_INVALID");
  if (body.representativeData !== true || body.status !== "ready" || natural(body.storageVersion, "STORAGE_READINESS_INVALID") < 1) {
    throw new TypeError("STORAGE_READINESS_INVALID");
  }
  const authority = deepFreeze({ subject, body: body as unknown as StorageReadinessBody,
    digest: sha256(canonical({ subject: { operationId: subject.operationId, imageDigest: subject.imageDigest,
      deploymentRevision: subject.artifacts.deploymentRevision }, body })) });
  readinessAuthorities.add(authority);
  return authority;
}

export interface PassedSubjectCheck { readonly subject: DeploymentSubject; readonly check: string; readonly digest: Sha256 }
const passedChecks = new WeakMap<object, DeploymentSubject>();

export function expectedSubjectCheckDigest(subject: DeploymentSubject, check: string): Sha256 {
  if (!deploymentSubjects.has(subject)) throw new TypeError("DEPLOYMENT_SUBJECT_FORGED");
  return sha256(canonical({ subject: { operationId: subject.operationId,
    configDigest: subject.configDigest, imageDigest: subject.imageDigest,
    deploymentRevision: subject.artifacts.deploymentRevision }, check }));
}

export function passDeploymentCheck(subject: DeploymentSubject, check: string,
  observation: Sha256 | ReadinessAuthority | ValidatedTlsIdentity): PassedSubjectCheck {
  if (!deploymentSubjects.has(subject) || !requiredChecks(subject.profile, subject.operation).includes(check as never)) {
    throw new TypeError("DEPLOYMENT_CHECK_SUBJECT_INVALID");
  }
  if (check === "readiness") {
    if (!readinessAuthorities.has(observation as object) || (observation as ReadinessAuthority).subject !== subject) {
      throw new TypeError("DEPLOYMENT_READINESS_AUTHORITY_INVALID");
    }
  } else if (check === "certificate") {
    if (!tlsAuthorities.has(observation as object) || subject.artifacts.tlsIdentity !== observation) {
      throw new TypeError("DEPLOYMENT_TLS_AUTHORITY_INVALID");
    }
  } else {
    const expected = expectedSubjectCheckDigest(subject, check);
    if (observation !== expected) throw new TypeError("DEPLOYMENT_CHECK_FAILED");
  }
  const result = deepFreeze({ subject, check, digest: sha256(canonical({ check,
    subject: subject.operationId, observation: observation instanceof Object ? canonical(observation) : observation })) });
  passedChecks.set(result, subject);
  return result;
}

type ReceiptBase = Readonly<{
  protocol: "tabiya-deployment-admin-receipt"; protocolVersion: 1; operationId: DeploymentOperationId;
  operation: DeploymentOperation; profile: DeploymentProfile; deploymentRevision: string;
  configDigest: Sha256; compiledConfigImageDigest: Sha256; publicUrl: string; elapsedMs: number;
}>;
export type DeploymentReceipt = ReceiptBase & (
  | Readonly<{ result: "succeeded"; artifacts: StrictDeploymentArtifacts; checks: readonly string[];
      services?: readonly ("app" | "caddy")[] }>
  | Readonly<{ result: "refused"; code: string }>
  | Readonly<{ result: "failed"; code: string; failedCheck: string | null }>
  | Readonly<{ result: "cancelled"; code: "OPERATION_CANCELLED"; signal: "SIGINT" | "SIGTERM" }>
);

function receiptBase(subject: DeploymentSubject, elapsedMs: number) {
  return { protocol: "tabiya-deployment-admin-receipt" as const, protocolVersion: 1 as const,
    operationId: subject.operationId, operation: subject.operation, profile: subject.profile,
    deploymentRevision: subject.artifacts.deploymentRevision, configDigest: subject.configDigest,
    compiledConfigImageDigest: subject.imageDigest, publicUrl: subject.publicUrl,
    elapsedMs: natural(elapsedMs, "ELAPSED_INVALID") };
}

export function compileDeploymentSuccess(subject: DeploymentSubject, results: readonly PassedSubjectCheck[],
  elapsedMs: number): DeploymentReceipt {
  if (!deploymentSubjects.has(subject)) throw new TypeError("DEPLOYMENT_SUBJECT_FORGED");
  const expected = requiredChecks(subject.profile, subject.operation);
  if (results.length !== expected.length || results.some((result, index) =>
    passedChecks.get(result) !== subject || result.check !== expected[index])) throw new TypeError("SUCCESS_PROOF_INCOMPLETE");
  const services = subject.operation === "start"
    ? subject.profile === "local" ? ["app"] as const : ["app", "caddy"] as const : undefined;
  return deepFreeze({ ...receiptBase(subject, elapsedMs), result: "succeeded" as const,
    artifacts: subject.artifacts, checks: expected,
    ...(services === undefined ? {} : { services }) });
}

export function compileDeploymentTerminal(subject: DeploymentSubject,
  result: "refused" | "failed" | "cancelled", code: string, elapsedMs: number,
  detail?: string | null): DeploymentReceipt {
  if (!deploymentSubjects.has(subject)) throw new TypeError("DEPLOYMENT_SUBJECT_FORGED");
  const parsedCode = text(code, "DEPLOYMENT_RESULT_CODE_INVALID");
  if (result === "failed") return deepFreeze({ ...receiptBase(subject, elapsedMs), result,
    code: parsedCode, failedCheck: detail === null || detail === undefined ? null : text(detail, "FAILED_CHECK_INVALID") });
  if (result === "cancelled") {
    if (parsedCode !== "OPERATION_CANCELLED" || (detail !== "SIGINT" && detail !== "SIGTERM")) {
      throw new TypeError("CANCELLATION_INVALID");
    }
    return deepFreeze({ ...receiptBase(subject, elapsedMs), result, code: "OPERATION_CANCELLED" as const,
      signal: detail as "SIGINT" | "SIGTERM" });
  }
  return deepFreeze({ ...receiptBase(subject, elapsedMs), result, code: parsedCode });
}

export const serializeDeploymentReceipt = (receipt: DeploymentReceipt): string => canonical(receipt);
export function parseDeploymentReceipt(bytes: string): DeploymentReceipt {
  const row = strictJson(bytes, "DEPLOYMENT_RECEIPT_INVALID");
  const result = text(row.result, "DEPLOYMENT_RECEIPT_INVALID");
  const common = ["protocol", "protocolVersion", "operationId", "operation", "profile", "deploymentRevision",
    "configDigest", "compiledConfigImageDigest", "publicUrl", "elapsedMs", "result"];
  exact(row, result === "succeeded" ? [...common, "artifacts", "checks", ...(row.services === undefined ? [] : ["services"])]
    : result === "failed" ? [...common, "code", "failedCheck"]
      : result === "cancelled" ? [...common, "code", "signal"] : [...common, "code"],
  "DEPLOYMENT_RECEIPT_FIELDS_INVALID");
  if (row.protocol !== "tabiya-deployment-admin-receipt" || row.protocolVersion !== 1
    || !["succeeded", "refused", "failed", "cancelled"].includes(result)
    || !REVISION.test(text(row.deploymentRevision, "DEPLOYMENT_RECEIPT_INVALID"))) {
    throw new TypeError("DEPLOYMENT_RECEIPT_INVALID");
  }
  parseDeploymentOperationId(row.operationId);
  if (!["check", "start", "probe"].includes(text(row.operation, "DEPLOYMENT_RECEIPT_INVALID"))
    || !["local", "appliance", "hosted"].includes(text(row.profile, "DEPLOYMENT_RECEIPT_INVALID"))) {
    throw new TypeError("DEPLOYMENT_RECEIPT_INVALID");
  }
  const url = new URL(text(row.publicUrl, "DEPLOYMENT_RECEIPT_INVALID"));
  if (url.toString().replace(/\/$/u, "") !== row.publicUrl) throw new TypeError("DEPLOYMENT_RECEIPT_INVALID");
  natural(row.elapsedMs, "ELAPSED_INVALID"); parseSha256(row.configDigest); parseSha256(row.compiledConfigImageDigest);
  if (result === "succeeded") {
    if (!Array.isArray(row.checks) || row.checks.some((item) => typeof item !== "string")) throw new TypeError("DEPLOYMENT_RECEIPT_INVALID");
    const expected = requiredChecks(row.profile as DeploymentProfile, row.operation as DeploymentOperation);
    if (canonical(row.checks) !== canonical(expected)) throw new TypeError("DEPLOYMENT_RECEIPT_INVALID");
    const artifact = record(row.artifacts, "DEPLOYMENT_RECEIPT_INVALID");
    exact(artifact, ["deploymentRevision", "serverImageDigest", "caddyImageDigest", "composeDigest",
      "caddyConfigDigest", "routeBudgetManifestDigest", "compiledConfigImageDigest", "tlsIdentity"],
    "DEPLOYMENT_RECEIPT_INVALID");
    if (artifact.deploymentRevision !== row.deploymentRevision
      || artifact.compiledConfigImageDigest !== row.compiledConfigImageDigest) throw new TypeError("DEPLOYMENT_RECEIPT_INVALID");
    for (const value of [artifact.serverImageDigest, artifact.composeDigest,
      artifact.routeBudgetManifestDigest, artifact.compiledConfigImageDigest]) parseSha256(value);
    if (row.operation === "start") {
      const expectedServices = row.profile === "local" ? ["app"] : ["app", "caddy"];
      if (canonical(row.services) !== canonical(expectedServices)) throw new TypeError("DEPLOYMENT_RECEIPT_INVALID");
    } else if (row.services !== undefined) throw new TypeError("DEPLOYMENT_RECEIPT_INVALID");
  } else {
    text(row.code, "DEPLOYMENT_RECEIPT_INVALID");
    if (result === "failed" && row.failedCheck !== null) text(row.failedCheck, "DEPLOYMENT_RECEIPT_INVALID");
    if (result === "cancelled" && (row.code !== "OPERATION_CANCELLED"
      || (row.signal !== "SIGINT" && row.signal !== "SIGTERM"))) throw new TypeError("DEPLOYMENT_RECEIPT_INVALID");
  }
  return deepFreeze(row as unknown as DeploymentReceipt);
}

export interface ActiveProfileState { readonly state: "active"; readonly generation: number;
  readonly profile: DeploymentProfile; readonly publicOrigin: string; readonly configDigest: Sha256;
  readonly compiledConfigImageDigest: Sha256 }
export type MigrationEffect = "invalidate_sessions" | "revoke_public_tokens" | "target_ready" | "commit";

function validateActiveState(state: ActiveProfileState): ActiveProfileState {
  if (state.state !== "active" || !Number.isSafeInteger(state.generation) || state.generation < 0
    || !["local", "appliance", "hosted"].includes(state.profile)) throw new TypeError("PROFILE_STATE_INVALID");
  parseSha256(state.configDigest); parseSha256(state.compiledConfigImageDigest);
  const url = new URL(state.publicOrigin);
  const validOrigin = state.profile === "local"
    ? url.protocol === "http:" && url.hostname === "127.0.0.1"
    : url.protocol === "https:" && url.hostname.length > 0;
  if (!validOrigin || url.toString().replace(/\/$/u, "") !== state.publicOrigin) throw new TypeError("PROFILE_STATE_INVALID");
  return deepFreeze({ ...state });
}

type DurableTransition = Readonly<{ state: "transition"; operationId: DeploymentOperationId;
  phase: "prepared" | "sessions_invalidated" | "tokens_revoked" | "target_ready";
  from: ActiveProfileState; to: ActiveProfileState; targetReadinessDigest: Sha256 | null }>;

export interface IngressSwitchAuthority { readonly target: ActiveProfileState; readonly digest: Sha256 }
const ingressAuthorities = new WeakSet<object>();
export function sealIngressSwitch(target: ActiveProfileState): IngressSwitchAuthority {
  const validated = validateActiveState(target);
  const authority = deepFreeze({ target: validated, digest: sha256(canonical(validated)) });
  ingressAuthorities.add(authority); return authority;
}

export class ProfileMigrationStore {
  readonly database: DatabaseSync;
  readonly directory: string;
  readonly statePath: string;
  constructor(directory: string, databasePath: string) {
    mkdirSync(directory, { recursive: true });
    this.directory = directory; this.statePath = join(directory, ".tabiya-deployment-state.json");
    this.database = new DatabaseSync(databasePath);
    this.database.exec(`CREATE TABLE IF NOT EXISTS deployment_sessions (id TEXT PRIMARY KEY) STRICT;
    CREATE TABLE IF NOT EXISTS deployment_public_tokens (id TEXT PRIMARY KEY) STRICT;`);
  }
  close(): void { this.database.close(); }
  initialize(state: ActiveProfileState): void {
    if (existsSync(this.statePath)) throw new TypeError("DEPLOYMENT_STATE_EXISTS");
    this.publish(validateActiveState(state));
  }
  begin(operationId: DeploymentOperationId, from: ActiveProfileState, to: ActiveProfileState): void {
    parseDeploymentOperationId(operationId); validateActiveState(from); validateActiveState(to);
    if (to.generation !== from.generation + 1
      || (from.profile === to.profile && from.publicOrigin === to.publicOrigin)) throw new TypeError("PROFILE_GENERATION_INVALID");
    const current = this.state();
    if (canonical(current) !== canonical(from)) throw new TypeError("PROFILE_SOURCE_STATE_MISMATCH");
    this.publish({ state: "transition", operationId, phase: "prepared", from, to, targetReadinessDigest: null });
  }
  phase(operationId: DeploymentOperationId): string {
    return this.readTransition(operationId).phase;
  }
  advance(operationId: DeploymentOperationId, effect: MigrationEffect, readiness?: ReadinessAuthority,
    ingress?: IngressSwitchAuthority): ActiveProfileState | string {
    const row = this.readTransition(operationId); const phase = row.phase;
    const expected: Record<string, MigrationEffect> = { prepared: "invalidate_sessions",
      sessions_invalidated: "revoke_public_tokens", tokens_revoked: "target_ready", target_ready: "commit" };
    if (expected[phase] !== effect) throw new TypeError("PROFILE_TRANSITION_ORDER_INVALID");
    if (effect === "invalidate_sessions") this.transaction("DELETE FROM deployment_sessions");
    if (effect === "revoke_public_tokens") this.transaction("DELETE FROM deployment_public_tokens");
    if (effect === "target_ready") {
      if (readiness === undefined || !readinessAuthorities.has(readiness)
        || readiness.subject.profile !== row.to.profile || readiness.subject.publicUrl !== row.to.publicOrigin
        || readiness.subject.configDigest !== row.to.configDigest
        || readiness.subject.imageDigest !== row.to.compiledConfigImageDigest) throw new TypeError("PROFILE_TARGET_READINESS_REQUIRED");
    }
    if (effect === "commit") {
      if (ingress === undefined || !ingressAuthorities.has(ingress)
        || canonical(ingress.target) !== canonical(row.to)) throw new TypeError("PROFILE_INGRESS_SWITCH_REQUIRED");
      this.publish(row.to); return row.to;
    }
    const next = { invalidate_sessions: "sessions_invalidated", revoke_public_tokens: "tokens_revoked",
      target_ready: "target_ready" } as const;
    const updated: DurableTransition = { ...row, phase: next[effect],
      targetReadinessDigest: effect === "target_ready" ? readiness!.digest : row.targetReadinessDigest };
    this.publish(updated); return next[effect];
  }
  state(): ActiveProfileState {
    const value = this.readState();
    if (value.state !== "active") throw new TypeError("PROFILE_TRANSITION_ACTIVE");
    return validateActiveState(value);
  }
  private transaction(sql: string): void {
    this.database.exec("BEGIN IMMEDIATE");
    try { this.database.exec(sql); this.database.exec("COMMIT"); }
    catch (error) { this.database.exec("ROLLBACK"); throw error; }
  }
  private publish(value: ActiveProfileState | DurableTransition): void {
    const bytes = canonical(value); const temporary = `${this.statePath}.tmp`;
    try { unlinkSync(temporary); } catch { /* absent is the normal case */ }
    const descriptor = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
    try { writeFileSync(descriptor, bytes, "utf8"); fsyncSync(descriptor); } finally { closeSync(descriptor); }
    renameSync(temporary, this.statePath);
    const directory = openSync(this.directory, constants.O_RDONLY);
    try { fsyncSync(directory); } finally { closeSync(directory); }
  }
  private readState(): ActiveProfileState | DurableTransition {
    if (!existsSync(this.statePath)) throw new TypeError("DEPLOYMENT_STATE_MISSING");
    const item = strictJson(readFileSync(this.statePath, "utf8"), "PROFILE_STATE_INVALID");
    if (item.state === "active") {
      exact(item, ["state", "generation", "profile", "publicOrigin", "configDigest", "compiledConfigImageDigest"], "PROFILE_STATE_INVALID");
      return validateActiveState(item as unknown as ActiveProfileState);
    }
    exact(item, ["state", "operationId", "phase", "from", "to", "targetReadinessDigest"], "PROFILE_TRANSITION_INVALID");
    if (item.state !== "transition" || !["prepared", "sessions_invalidated", "tokens_revoked", "target_ready"].includes(text(item.phase, "PROFILE_TRANSITION_INVALID"))) {
      throw new TypeError("PROFILE_TRANSITION_INVALID");
    }
    const from = validateActiveState(record(item.from, "PROFILE_TRANSITION_INVALID") as unknown as ActiveProfileState);
    const to = validateActiveState(record(item.to, "PROFILE_TRANSITION_INVALID") as unknown as ActiveProfileState);
    if (to.generation !== from.generation + 1) throw new TypeError("PROFILE_GENERATION_INVALID");
    if (item.targetReadinessDigest !== null) parseSha256(item.targetReadinessDigest);
    return deepFreeze({ state: "transition", operationId: parseDeploymentOperationId(item.operationId),
      phase: item.phase, from, to, targetReadinessDigest: item.targetReadinessDigest }) as DurableTransition;
  }
  private readTransition(operationId: DeploymentOperationId): DurableTransition {
    const row = this.readState();
    if (row.state !== "transition" || row.operationId !== operationId) throw new TypeError("PROFILE_TRANSITION_UNKNOWN");
    return row;
  }
}
