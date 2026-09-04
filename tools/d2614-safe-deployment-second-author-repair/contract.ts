// DISPOSABLE author contract for D2614-D2618. Not production code.
import { createHash } from "node:crypto";
import { isIP } from "node:net";

export type Sha256 = string & { readonly __sha256: unique symbol };
export type DeploymentOperationId = string & { readonly __deploymentOperationId: unique symbol };
export type DeploymentProfile = "local" | "appliance" | "hosted";

const DIGEST = /^sha256:[0-9a-f]{64}$/u;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const HOST_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u;
const MOUNT_NAME = /^[a-z][a-z0-9_]{0,63}$/u;

export function parseSha256(value: unknown): Sha256 {
  if (typeof value !== "string" || !DIGEST.test(value)) throw new TypeError("DIGEST_INVALID");
  return value as Sha256;
}

export function sha256(bytes: string): Sha256 {
  return parseSha256(`sha256:${createHash("sha256").update(bytes).digest("hex")}`);
}

export function parseDeploymentOperationId(value: unknown): DeploymentOperationId {
  if (typeof value !== "string" || !UUID_V4.test(value)) throw new TypeError("OPERATION_ID_INVALID");
  return value as DeploymentOperationId;
}

function canonical(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
  }
  throw new TypeError("CANONICAL_VALUE_INVALID");
}

type Token = { readonly kind: "string"; readonly value: string } | { readonly kind: "punct"; readonly value: "{" | "}" | "[" | "]" | ":" | "," } | { readonly kind: "atom" };

function tokens(text: string): readonly Token[] {
  const out: Token[] = [];
  for (let index = 0; index < text.length;) {
    const char = text[index]!;
    if (/\s/u.test(char)) { index += 1; continue; }
    if ("{}[]:,".includes(char)) { out.push({ kind: "punct", value: char as Extract<Token, {kind:"punct"}>["value"] }); index += 1; continue; }
    if (char === '"') {
      const start = index++;
      let escaped = false;
      while (index < text.length) {
        const current = text[index++]!;
        if (escaped) { escaped = false; continue; }
        if (current === "\\") { escaped = true; continue; }
        if (current === '"') break;
      }
      out.push({ kind: "string", value: JSON.parse(text.slice(start, index)) as string });
      continue;
    }
    while (index < text.length && !/[\s{}\[\]:,]/u.test(text[index]!)) index += 1;
    out.push({ kind: "atom" });
  }
  return out;
}

function rejectDuplicateKeys(text: string): void {
  const stream = tokens(text);
  let at = 0;
  const value = (): void => {
    const token = stream[at++];
    if (token?.kind === "string" || token?.kind === "atom") return;
    if (token?.kind !== "punct") throw new TypeError("CONFIG_JSON_INVALID");
    if (token.value === "[") {
      if ((stream[at] as {value?:string}|undefined)?.value === "]") { at += 1; return; }
      for (;;) { value(); const separator = stream[at++] as {value?:string}|undefined; if (separator?.value === "]") return; if (separator?.value !== ",") throw new TypeError("CONFIG_JSON_INVALID"); }
    }
    if (token.value === "{") {
      const seen = new Set<string>();
      if ((stream[at] as {value?:string}|undefined)?.value === "}") { at += 1; return; }
      for (;;) {
        const key = stream[at++];
        if (key?.kind !== "string" || (stream[at++] as {value?:string}|undefined)?.value !== ":") throw new TypeError("CONFIG_JSON_INVALID");
        if (seen.has(key.value)) throw new TypeError("CONFIG_DUPLICATE_KEY");
        seen.add(key.value); value();
        const separator = stream[at++] as {value?:string}|undefined;
        if (separator?.value === "}") return;
        if (separator?.value !== ",") throw new TypeError("CONFIG_JSON_INVALID");
      }
    }
    throw new TypeError("CONFIG_JSON_INVALID");
  };
  value();
  if (at !== stream.length) throw new TypeError("CONFIG_JSON_INVALID");
}

function parseJson(text: string): unknown {
  let parsed: unknown;
  try { parsed = JSON.parse(text) as unknown; } catch { throw new TypeError("CONFIG_JSON_INVALID"); }
  rejectDuplicateKeys(text);
  return parsed;
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) throw new TypeError("CONFIG_UNKNOWN_OR_MISSING_KEY");
}

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("CONFIG_SHAPE_INVALID");
  return value as Record<string, unknown>;
}

function hostname(value: unknown): string {
  if (typeof value !== "string" || value.length > 253 || value.endsWith(".") || value.includes("_") || isIP(value) !== 0) throw new TypeError("HOSTNAME_INVALID");
  const labels = value.split(".");
  if (labels.length < 2 || labels.some((label) => !HOST_LABEL.test(label)) || value.endsWith(".local") || value.endsWith(".localhost")) throw new TypeError("HOSTNAME_INVALID");
  return value;
}

export interface ConfigFileAuthority { readonly absolute: boolean; readonly regular: boolean; readonly symlink: boolean; readonly sameInode: boolean; readonly mode: number }
export interface SecretObservation extends ConfigFileAuthority { readonly inode: string; readonly readable: boolean; readonly certificateMatchesKey?: boolean; readonly certificateSans?: readonly string[] }
export type SecretResolver = (absolutePath: string) => SecretObservation | undefined;

export interface DeploymentBoundary { readonly profile: DeploymentProfile; readonly listenHost: string; readonly listenPort: number; readonly publicOrigin: string; readonly behindBundledProxy: boolean; readonly secureCookie: boolean; readonly hostname: string | null; readonly tlsMode: "none" | "internal" | "acme" | "files" }
export interface CompiledDeploymentConfig { readonly configDigest: Sha256; readonly config: Readonly<Record<string, unknown>>; readonly boundary: Readonly<DeploymentBoundary> }
const compiledConfigs = new WeakSet<object>();

export function compileDeploymentConfig(text: string, file: ConfigFileAuthority, secrets: SecretResolver = () => undefined): CompiledDeploymentConfig {
  if (!file.absolute || !file.regular || file.symlink || !file.sameInode || (file.mode & 0o022) !== 0) throw new TypeError("CONFIG_FILE_REFUSED");
  const root = record(parseJson(text));
  if (root.format !== "tabiya-deployment-config" || root.configVersion !== 1) throw new TypeError("CONFIG_VERSION_UNSUPPORTED");
  let config: Record<string, unknown>;
  let boundary: DeploymentBoundary;
  if (root.profile === "local") {
    const keys = root.port === undefined ? ["format", "configVersion", "profile"] : ["format", "configVersion", "profile", "port"];
    exactKeys(root, keys);
    const port = root.port ?? 3000;
    if (!Number.isInteger(port) || (port as number) < 1024 || (port as number) > 65535) throw new TypeError("PORT_INVALID");
    config = { format: root.format, configVersion: 1, profile: "local", port };
    boundary = { profile: "local", listenHost: "0.0.0.0", listenPort: 3000, publicOrigin: `http://127.0.0.1:${port}`, behindBundledProxy: false, secureCookie: false, hostname: null, tlsMode: "none" };
  } else if (root.profile === "appliance") {
    exactKeys(root, ["format", "configVersion", "profile", "hostname", "resolution"]);
    const name = hostname(root.hostname);
    const resolution = record(root.resolution);
    exactKeys(resolution, ["kind", "expectedAddresses"]);
    if (resolution.kind !== "operator_dns" || !Array.isArray(resolution.expectedAddresses) || resolution.expectedAddresses.length === 0) throw new TypeError("RESOLUTION_INVALID");
    const addresses = [...new Set(resolution.expectedAddresses.map((item) => {
      if (typeof item !== "string" || isIP(item) === 0) throw new TypeError("RESOLUTION_INVALID");
      return item;
    }))].sort();
    config = { format: root.format, configVersion: 1, profile: "appliance", hostname: name, resolution: { kind: "operator_dns", expectedAddresses: addresses } };
    boundary = { profile: "appliance", listenHost: "tabiya-proxy-origin", listenPort: 3000, publicOrigin: `https://${name}`, behindBundledProxy: true, secureCookie: true, hostname: name, tlsMode: "internal" };
  } else if (root.profile === "hosted") {
    exactKeys(root, ["format", "configVersion", "profile", "hostname", "tls"]);
    const name = hostname(root.hostname);
    const tls = record(root.tls);
    if (tls.kind === "acme") {
      exactKeys(tls, ["kind", "contactEmail"]);
      if (typeof tls.contactEmail !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/u.test(tls.contactEmail)) throw new TypeError("ACME_EMAIL_INVALID");
      config = { format: root.format, configVersion: 1, profile: "hosted", hostname: name, tls: { kind: "acme", contactEmail: tls.contactEmail } };
      boundary = { profile: "hosted", listenHost: "tabiya-proxy-origin", listenPort: 3000, publicOrigin: `https://${name}`, behindBundledProxy: true, secureCookie: true, hostname: name, tlsMode: "acme" };
    } else if (tls.kind === "files") {
      exactKeys(tls, ["kind", "certificate", "privateKey"]);
      const certRef = record(tls.certificate); const keyRef = record(tls.privateKey);
      exactKeys(certRef, ["sourceFile", "mountName"]); exactKeys(keyRef, ["sourceFile", "mountName"]);
      for (const ref of [certRef, keyRef]) if (typeof ref.sourceFile !== "string" || !ref.sourceFile.startsWith("/") || typeof ref.mountName !== "string" || !MOUNT_NAME.test(ref.mountName)) throw new TypeError("SECRET_PATH_INVALID");
      const cert = secrets(certRef.sourceFile as string); const key = secrets(keyRef.sourceFile as string);
      if (cert === undefined || key === undefined || !cert.absolute || !key.absolute || !cert.regular || !key.regular || cert.symlink || key.symlink || !cert.sameInode || !key.sameInode || !cert.readable || !key.readable || (cert.mode & 0o022) !== 0 || (key.mode & 0o077) !== 0 || cert.inode === key.inode || cert.certificateMatchesKey !== true || !cert.certificateSans?.includes(name)) throw new TypeError("SECRET_REFUSED");
      config = { format: root.format, configVersion: 1, profile: "hosted", hostname: name, tls: { kind: "files", certificate: certRef, privateKey: keyRef } };
      boundary = { profile: "hosted", listenHost: "tabiya-proxy-origin", listenPort: 3000, publicOrigin: `https://${name}`, behindBundledProxy: true, secureCookie: true, hostname: name, tlsMode: "files" };
    } else throw new TypeError("PROFILE_HYBRID_REFUSED");
  } else throw new TypeError("PROFILE_HYBRID_REFUSED");
  const frozen = Object.freeze({ configDigest: sha256(canonical(config)), config: Object.freeze(config), boundary: Object.freeze(boundary) });
  compiledConfigs.add(frozen);
  return frozen;
}

export interface CompiledDeploymentImage { readonly format: "tabiya-compiled-deployment"; readonly version: 1; readonly configDigest: Sha256; readonly boundary: Readonly<DeploymentBoundary>; readonly imageDigest: Sha256 }
const compiledImages = new WeakSet<object>();

export function renderCompiledDeploymentImage(config: CompiledDeploymentConfig): string {
  if (!compiledConfigs.has(config)) throw new TypeError("COMPILED_CONFIG_FORGED");
  return canonical({ format: "tabiya-compiled-deployment", version: 1, configDigest: config.configDigest, boundary: config.boundary });
}

export function loadCompiledDeploymentImage(bytes: string): CompiledDeploymentImage {
  const parsed = record(parseJson(bytes));
  if (bytes !== canonical(parsed)) throw new TypeError("COMPILED_IMAGE_NONCANONICAL");
  exactKeys(parsed, ["format", "version", "configDigest", "boundary"]);
  if (parsed.format !== "tabiya-compiled-deployment" || parsed.version !== 1) throw new TypeError("COMPILED_IMAGE_VERSION");
  const boundary = record(parsed.boundary) as unknown as DeploymentBoundary;
  exactKeys(parsed.boundary as Record<string, unknown>, ["profile", "listenHost", "listenPort", "publicOrigin", "behindBundledProxy", "secureCookie", "hostname", "tlsMode"]);
  const expected = boundary.profile === "local"
    ? boundary.hostname === null && boundary.tlsMode === "none" && boundary.behindBundledProxy === false && boundary.secureCookie === false && /^http:\/\/127\.0\.0\.1:[0-9]+$/u.test(boundary.publicOrigin)
    : (boundary.profile === "appliance" || boundary.profile === "hosted") && typeof boundary.hostname === "string" && boundary.publicOrigin === `https://${boundary.hostname}` && boundary.behindBundledProxy === true && boundary.secureCookie === true;
  if (!expected) throw new TypeError("COMPILED_IMAGE_RELATION_INVALID");
  const image = Object.freeze({ format: "tabiya-compiled-deployment" as const, version: 1 as const, configDigest: parseSha256(parsed.configDigest), boundary: Object.freeze(boundary), imageDigest: sha256(bytes) });
  compiledImages.add(image);
  return image;
}

export interface TlsIdentity { readonly leafSha256: Sha256; readonly spkiSha256: Sha256; readonly chainSha256: Sha256; readonly hostname: string; readonly notBefore: string; readonly notAfter: string }
export function parseTlsIdentity(value: unknown, expectedHostname: string, now: string): TlsIdentity {
  const item = record(value); exactKeys(item, ["leafSha256", "spkiSha256", "chainSha256", "hostname", "notBefore", "notAfter"]);
  if (item.hostname !== expectedHostname || typeof item.notBefore !== "string" || typeof item.notAfter !== "string" || Number.isNaN(Date.parse(item.notBefore)) || Number.isNaN(Date.parse(item.notAfter)) || Date.parse(item.notBefore) > Date.parse(now) || Date.parse(item.notAfter) <= Date.parse(now)) throw new TypeError("TLS_IDENTITY_INVALID");
  return Object.freeze({ leafSha256: parseSha256(item.leafSha256), spkiSha256: parseSha256(item.spkiSha256), chainSha256: parseSha256(item.chainSha256), hostname: expectedHostname, notBefore: item.notBefore, notAfter: item.notAfter });
}

export type DeploymentOperation = "check" | "start" | "probe";
export type DeploymentCheck = "config" | "hostname_resolution" | "certificate" | "compose" | "proxy_config" | "image_pins" | "network_graph" | "origin" | "cookie" | "request_budgets" | "streaming" | "readiness" | "core_journey";
const LOCAL = Object.freeze({
  check: ["config", "compose", "image_pins", "network_graph"],
  start: ["config", "compose", "image_pins", "network_graph", "readiness"],
  probe: ["config", "compose", "image_pins", "network_graph", "origin", "cookie", "request_budgets", "streaming", "readiness", "core_journey"],
} as const);
const PROXIED = Object.freeze({
  check: ["config", "hostname_resolution", "compose", "proxy_config", "image_pins", "network_graph"],
  start: ["config", "hostname_resolution", "certificate", "compose", "proxy_config", "image_pins", "network_graph", "readiness"],
  probe: ["config", "hostname_resolution", "certificate", "compose", "proxy_config", "image_pins", "network_graph", "origin", "cookie", "request_budgets", "streaming", "readiness", "core_journey"],
} as const);

export function requiredChecks(profile: DeploymentProfile, operation: DeploymentOperation): readonly DeploymentCheck[] { return profile === "local" ? LOCAL[operation] : PROXIED[operation]; }

export type CheckInput =
  | { readonly kind: Exclude<DeploymentCheck, "hostname_resolution" | "certificate" | "origin" | "cookie" | "readiness">; readonly expected: Sha256; readonly actual: Sha256 }
  | { readonly kind: "hostname_resolution"; readonly expected: readonly string[]; readonly actual: readonly string[] }
  | { readonly kind: "certificate"; readonly identity: TlsIdentity; readonly hostname: string; readonly at: string }
  | { readonly kind: "origin" | "cookie"; readonly expected: string; readonly actual: string }
  | { readonly kind: "readiness"; readonly status: number; readonly ready: boolean; readonly imageDigest: Sha256; readonly expectedImageDigest: Sha256 };
export interface PassedDeploymentCheck { readonly operationId: DeploymentOperationId; readonly check: DeploymentCheck; readonly operandDigest: Sha256 }
const passedChecks = new WeakSet<object>();

export function executeDeploymentCheck(operationId: DeploymentOperationId, input: CheckInput): PassedDeploymentCheck {
  let operands: unknown = input;
  if ("expected" in input && "actual" in input && input.kind !== "origin" && input.kind !== "cookie" && input.kind !== "hostname_resolution") { if (input.expected !== input.actual) throw new TypeError("DEPLOYMENT_CHECK_FAILED"); }
  else if (input.kind === "hostname_resolution") { if (canonical([...input.expected].sort()) !== canonical([...input.actual].sort())) throw new TypeError("DEPLOYMENT_CHECK_FAILED"); }
  else if (input.kind === "certificate") { if (input.identity.hostname !== input.hostname || Date.parse(input.identity.notAfter) <= Date.parse(input.at)) throw new TypeError("DEPLOYMENT_CHECK_FAILED"); }
  else if (input.kind === "origin" || input.kind === "cookie") { if (input.expected !== input.actual) throw new TypeError("DEPLOYMENT_CHECK_FAILED"); }
  else if (input.kind === "readiness") { if (input.status !== 200 || !input.ready || input.imageDigest !== input.expectedImageDigest) throw new TypeError("DEPLOYMENT_CHECK_FAILED"); }
  const result = Object.freeze({ operationId, check: input.kind as DeploymentCheck, operandDigest: sha256(canonical(operands)) });
  passedChecks.add(result); return result;
}

export interface DeploymentArtifacts { readonly deploymentRevision: string; readonly serverImageDigest: Sha256; readonly caddyImageDigest: Sha256 | null; readonly composeDigest: Sha256; readonly caddyConfigDigest: Sha256 | null; readonly routeBudgetManifestDigest: Sha256; readonly compiledConfigImageDigest: Sha256; readonly tlsIdentity: TlsIdentity | null }
export function parseDeploymentArtifacts(value: DeploymentArtifacts, profile: DeploymentProfile, operation: DeploymentOperation): DeploymentArtifacts {
  for (const digest of [value.serverImageDigest, value.composeDigest, value.routeBudgetManifestDigest, value.compiledConfigImageDigest]) parseSha256(digest);
  if (value.deploymentRevision.length === 0) throw new TypeError("ARTIFACT_IDENTITY_INVALID");
  if (profile === "local") { if (value.caddyImageDigest !== null || value.caddyConfigDigest !== null || value.tlsIdentity !== null) throw new TypeError("ARTIFACT_PROFILE_MISMATCH"); }
  else {
    parseSha256(value.caddyImageDigest); parseSha256(value.caddyConfigDigest);
    if (operation === "check") { if (value.tlsIdentity !== null) throw new TypeError("ARTIFACT_OPERATION_MISMATCH"); }
    else if (value.tlsIdentity === null) throw new TypeError("TLS_IDENTITY_REQUIRED");
  }
  return Object.freeze(value);
}

export interface DeploymentSuccessReceipt { readonly operationId: DeploymentOperationId; readonly operation: DeploymentOperation; readonly profile: DeploymentProfile; readonly configDigest: Sha256; readonly compiledConfigImageDigest: Sha256; readonly publicUrl: string; readonly elapsedMs: number; readonly artifacts: DeploymentArtifacts; readonly checks: readonly DeploymentCheck[]; readonly services?: readonly ("app" | "caddy")[] }
export function compileDeploymentSuccess(input: Omit<DeploymentSuccessReceipt, "checks"> & { readonly results: readonly PassedDeploymentCheck[] }): DeploymentSuccessReceipt {
  if (!Number.isInteger(input.elapsedMs) || input.elapsedMs < 0) throw new TypeError("ELAPSED_INVALID");
  const expected = requiredChecks(input.profile, input.operation);
  if (input.results.length !== expected.length || input.results.some((result, index) => !passedChecks.has(result) || result.operationId !== input.operationId || result.check !== expected[index])) throw new TypeError("SUCCESS_PROOF_INCOMPLETE");
  if (input.artifacts.compiledConfigImageDigest !== input.compiledConfigImageDigest) throw new TypeError("CONFIG_IMAGE_IDENTITY_MISMATCH");
  const services: readonly ("app" | "caddy")[] | undefined = input.operation === "start"
    ? (input.profile === "local" ? (["app"] as const) : (["app", "caddy"] as const))
    : undefined;
  if (input.operation === "start" && canonical(input.services) !== canonical(services)) throw new TypeError("SERVICE_SET_MISMATCH");
  if (input.operation !== "start" && input.services !== undefined) throw new TypeError("SERVICE_SET_MISMATCH");
  return Object.freeze({ operationId: input.operationId, operation: input.operation, profile: input.profile, configDigest: parseSha256(input.configDigest), compiledConfigImageDigest: parseSha256(input.compiledConfigImageDigest), publicUrl: new URL(input.publicUrl).toString().replace(/\/$/u, ""), elapsedMs: input.elapsedMs, artifacts: parseDeploymentArtifacts(input.artifacts, input.profile, input.operation), checks: expected, ...(services === undefined ? {} : { services }) });
}

export interface ActiveProfileState { readonly state: "active"; readonly generation: number; readonly profile: DeploymentProfile; readonly publicOrigin: string; readonly configDigest: Sha256; readonly compiledConfigImageDigest: Sha256 }
export type ProfileTransition = Readonly<{ state: "transition"; operationId: DeploymentOperationId; phase: "prepared" | "sessions_invalidated" | "tokens_revoked" | "target_ready"; from: ActiveProfileState; to: ActiveProfileState }>;

export function admitProfileStart(database: "empty" | "existing", current: ActiveProfileState | null, target: ActiveProfileState): "initialize" | "restart" {
  if (current === null) { if (database !== "empty") throw new TypeError("DEPLOYMENT_STATE_MISSING"); return "initialize"; }
  if (current.profile !== target.profile || current.publicOrigin !== target.publicOrigin) throw new TypeError("PROFILE_SWITCH_REFUSED");
  return "restart";
}

export function beginProfileTransition(operationId: DeploymentOperationId, from: ActiveProfileState, to: ActiveProfileState, confirmation: { readonly fromDigest: Sha256; readonly oldOrigin: string; readonly newOrigin: string }): ProfileTransition {
  if (from.profile === to.profile && from.publicOrigin === to.publicOrigin) throw new TypeError("PROFILE_TRANSITION_NOT_REQUIRED");
  if (confirmation.fromDigest !== from.configDigest || confirmation.oldOrigin !== from.publicOrigin || confirmation.newOrigin !== to.publicOrigin || to.generation !== from.generation + 1) throw new TypeError("PROFILE_TRANSITION_CONFIRMATION_REQUIRED");
  return Object.freeze({ state: "transition", operationId, phase: "prepared", from, to });
}

export function advanceProfileTransition(journal: ProfileTransition, effect: "invalidate_sessions" | "revoke_public_tokens" | "target_ready" | "commit"): ProfileTransition | ActiveProfileState {
  const expected = { prepared: "invalidate_sessions", sessions_invalidated: "revoke_public_tokens", tokens_revoked: "target_ready", target_ready: "commit" } as const;
  if (effect !== expected[journal.phase]) throw new TypeError("PROFILE_TRANSITION_ORDER_INVALID");
  if (effect === "commit") return journal.to;
  const next = { invalidate_sessions: "sessions_invalidated", revoke_public_tokens: "tokens_revoked", target_ready: "target_ready" } as const;
  return Object.freeze({ ...journal, phase: next[effect] });
}
