import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/digest.js";

const RECEIPT_PATH = "planning/provider-protocol-register/accepted-obligations.v1.json";
const SOURCE_PATH = "rfc/provider-exchange-and-execution.md";
const RECEIPT_SCHEMA = "tabiya.provider-obligations.v1";
const SOURCE_RFC = "provider-exchange-and-execution.md";
const DIGEST_DOMAIN = `${RECEIPT_SCHEMA}\0`;

type Endpoint =
  | Readonly<{ kind: "uci_supervisor"; engineId: "stockfish-analysis" | "maia-5m" }>
  | Readonly<{
      kind: "https";
      origin: "https://tablebase.lichess.org" | "https://explorer.lichess.ovh";
      path: "/standard" | "/lichess";
    }>;

export interface OperationRow {
  readonly operation: string;
  readonly provider: "stockfish" | "maia" | "syzygy" | "lichess_explorer";
  readonly endpoint: Endpoint;
  readonly parserId: string;
  readonly sourceProjection: string;
  readonly sourceFactoryId: string;
  readonly cliName: string;
}

export interface DomainRow {
  readonly domain: string;
  readonly constructorId: string;
}

interface Receipt {
  readonly schema: typeof RECEIPT_SCHEMA;
  readonly sourceRfc: typeof SOURCE_RFC;
  readonly obligationsDigest: string;
  readonly operations: readonly OperationRow[];
  readonly digestDomains: readonly DomainRow[];
}

interface Resource {
  readonly id: "provider-protocol";
  readonly version: 1;
  readonly payload: Readonly<{
    operations: readonly OperationRow[];
    digestDomains: readonly DomainRow[];
  }>;
  readonly digest: string;
}

interface AcceptanceState {
  readonly repoRoot: string;
  readonly acceptedCommit: string;
  readonly acceptedBytes: Uint8Array;
  readonly acceptedBytesDigest: string;
  readonly receipt: Receipt;
}

export interface AcceptedProviderObligationsAuthority {
  readonly kind: "provider_obligations_acceptance";
  readonly acceptedCommit: string;
  readonly receiptBytesDigest: string;
}

const authorities = new WeakMap<AcceptedProviderObligationsAuthority, AcceptanceState>();

export function issueReceiptBytes(
  operations: readonly OperationRow[],
  digestDomains: readonly DomainRow[],
): Uint8Array {
  const populations = canonicalPopulations(operations, digestDomains);
  const receipt: Receipt = {
    schema: RECEIPT_SCHEMA,
    sourceRfc: SOURCE_RFC,
    obligationsDigest: digestUtf8(`${DIGEST_DOMAIN}${canonicalizeJson(populations)}`),
    ...populations,
  };
  return Buffer.from(`${canonicalizeJson(receipt)}\n`, "utf8");
}

export function parseReceiptBytes(input: Uint8Array): Receipt {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(input);
  } catch {
    fail("RECEIPT_UTF8");
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    fail("RECEIPT_JSON");
  }
  const canonicalBytes = Buffer.from(`${canonicalizeJson(value)}\n`, "utf8");
  if (!Buffer.from(input).equals(canonicalBytes)) fail("RECEIPT_BYTES_NONCANONICAL");
  const object = exactObject(value, ["schema", "sourceRfc", "obligationsDigest", "operations", "digestDomains"], "RECEIPT_SHAPE");
  if (object.schema !== RECEIPT_SCHEMA) fail("RECEIPT_SCHEMA");
  if (object.sourceRfc !== SOURCE_RFC) fail("RECEIPT_SOURCE");
  if (typeof object.obligationsDigest !== "string" || !/^sha256:[0-9a-f]{64}$/u.test(object.obligationsDigest)) {
    fail("RECEIPT_DIGEST_GRAMMAR");
  }
  const populations = canonicalPopulations(object.operations, object.digestDomains);
  if (canonicalizeJson(object.operations) !== canonicalizeJson(populations.operations)
      || canonicalizeJson(object.digestDomains) !== canonicalizeJson(populations.digestDomains)) {
    fail("RECEIPT_ORDER");
  }
  const expected = digestUtf8(`${DIGEST_DOMAIN}${canonicalizeJson(populations)}`);
  if (object.obligationsDigest !== expected) fail("RECEIPT_DIGEST");
  return deepFreeze({
    schema: RECEIPT_SCHEMA,
    sourceRfc: SOURCE_RFC,
    obligationsDigest: object.obligationsDigest,
    ...populations,
  });
}

export function openRepositoryAcceptance(repoDirectory: string): AcceptedProviderObligationsAuthority {
  const repoRoot = realpathSync(gitText(repoDirectory, ["rev-parse", "--show-toplevel"]).trim());
  const headCommit = gitText(repoRoot, ["rev-parse", "--verify", "HEAD^{commit}"]).trim();
  const state = scanAcceptance(repoRoot, headCommit);
  const authority = deepFreeze({
    kind: "provider_obligations_acceptance" as const,
    acceptedCommit: state.acceptedCommit,
    receiptBytesDigest: state.acceptedBytesDigest,
  });
  authorities.set(authority, state);
  return authority;
}

export function issueResource(
  operations: readonly OperationRow[],
  digestDomains: readonly DomainRow[],
): Resource {
  const payload = canonicalPopulations(operations, digestDomains);
  const body = { id: "provider-protocol" as const, version: 1 as const, payload };
  return deepFreeze({ ...body, digest: digestUtf8(canonicalizeJson(body)) });
}

export function validateProductLanding(
  authority: AcceptedProviderObligationsAuthority,
  candidateResource: unknown,
): true {
  const opened = authorities.get(authority);
  if (opened === undefined) fail("ACCEPTANCE_AUTHORITY");

  const headCommit = gitText(opened.repoRoot, ["rev-parse", "--verify", "HEAD^{commit}"]).trim();
  const indexTree = gitText(opened.repoRoot, ["write-tree"]).trim();
  const current = scanAcceptance(opened.repoRoot, headCommit);
  if (current.acceptedCommit !== opened.acceptedCommit
      || current.acceptedBytesDigest !== opened.acceptedBytesDigest) {
    fail("ACCEPTANCE_HISTORY_CHANGED");
  }
  assertSameBytes(readGitObject(opened.repoRoot, `${headCommit}:${RECEIPT_PATH}`), opened.acceptedBytes, "HEAD_RECEIPT_CHANGED");
  assertSameBytes(readGitObject(opened.repoRoot, `${indexTree}:${RECEIPT_PATH}`), opened.acceptedBytes, "INDEX_RECEIPT_CHANGED");
  assertSameBytes(readFileBytes(join(opened.repoRoot, RECEIPT_PATH)), opened.acceptedBytes, "WORKTREE_RECEIPT_CHANGED");
  if (gitText(opened.repoRoot, ["rev-parse", "--verify", "HEAD^{commit}"]).trim() !== headCommit
      || gitText(opened.repoRoot, ["write-tree"]).trim() !== indexTree) {
    fail("CHECKOUT_CHANGED_DURING_VALIDATION");
  }

  const candidate = parseResource(candidateResource);
  if (canonicalizeJson(candidate.payload.operations) !== canonicalizeJson(opened.receipt.operations)
      || canonicalizeJson(candidate.payload.digestDomains) !== canonicalizeJson(opened.receipt.digestDomains)) {
    fail("OBLIGATION_ORDER_OR_MEMBER_MISMATCH");
  }
  return true;
}

function scanAcceptance(repoRoot: string, tipCommit: string): AcceptanceState {
  const commits = gitText(repoRoot, ["rev-list", "--first-parent", "--reverse", tipCommit])
    .trim()
    .split("\n")
    .filter(Boolean);
  if (commits.length === 0) fail("HISTORY_EMPTY");

  let previousStatus = "absent";
  let accepted: Omit<AcceptanceState, "repoRoot"> | null = null;
  for (const commit of commits) {
    const sourceBytes = readGitObject(repoRoot, `${commit}:${SOURCE_PATH}`);
    const status = sourceBytes === null ? "absent" : parseStatus(sourceBytes);
    const receiptBytes = readGitObject(repoRoot, `${commit}:${RECEIPT_PATH}`);

    if (accepted !== null) {
      if (status !== "accepted") fail("ACCEPTANCE_REGRESSION");
      assertSameBytes(receiptBytes, accepted.acceptedBytes, "ACCEPTED_RECEIPT_MUTATED");
    } else if (status === "accepted") {
      if (previousStatus !== "draft") fail("ACCEPTANCE_TRANSITION_UNOBSERVED");
      if (receiptBytes === null) fail("ACCEPTED_RECEIPT_MISSING");
      const receipt = parseReceiptBytes(receiptBytes);
      accepted = {
        acceptedCommit: commit,
        acceptedBytes: Buffer.from(receiptBytes),
        acceptedBytesDigest: digestBytes(receiptBytes),
        receipt,
      };
    } else if (receiptBytes !== null) {
      fail("RECEIPT_BEFORE_ACCEPTANCE");
    }
    previousStatus = status;
  }
  if (accepted === null) fail("ACCEPTANCE_ABSENT");
  return deepFreeze({ repoRoot, ...accepted });
}

function parseStatus(bytes: Uint8Array): "draft" | "accepted" {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("SOURCE_UTF8");
  }
  const match = /^- \*\*Status:\*\*\s+(?:\*\*)?(draft|accepted)\b/mu.exec(text);
  if (match?.[1] === "draft" || match?.[1] === "accepted") return match[1];
  fail("SOURCE_STATUS");
}

function parseResource(value: unknown): Resource {
  const object = exactObject(value, ["id", "version", "payload", "digest"], "RESOURCE_SHAPE");
  if (object.id !== "provider-protocol" || object.version !== 1) fail("RESOURCE_IDENTITY");
  const payloadObject = exactObject(object.payload, ["operations", "digestDomains"], "RESOURCE_PAYLOAD");
  const payload = canonicalPopulations(payloadObject.operations, payloadObject.digestDomains);
  if (canonicalizeJson(payloadObject) !== canonicalizeJson(payload)) fail("RESOURCE_ORDER");
  const body = { id: "provider-protocol" as const, version: 1 as const, payload };
  if (object.digest !== digestUtf8(canonicalizeJson(body))) fail("RESOURCE_DIGEST");
  return deepFreeze({ ...body, digest: object.digest as string });
}

function canonicalPopulations(operationsValue: unknown, domainsValue: unknown): Readonly<{
  operations: readonly OperationRow[];
  digestDomains: readonly DomainRow[];
}> {
  if (!Array.isArray(operationsValue) || !Array.isArray(domainsValue)) fail("POPULATION_ARRAYS");
  const operations = operationsValue.map(parseOperation).sort(rowOrder);
  const digestDomains = domainsValue.map(parseDomain).sort(rowOrder);
  unique(operations, "OPERATION_DUPLICATE");
  unique(digestDomains, "DOMAIN_DUPLICATE");
  return deepFreeze({ operations, digestDomains });
}

function parseOperation(value: unknown): OperationRow {
  const object = exactObject(value, ["operation", "provider", "endpoint", "parserId", "sourceProjection", "sourceFactoryId", "cliName"], "OPERATION_SHAPE");
  for (const key of ["operation", "parserId", "sourceProjection", "sourceFactoryId", "cliName"] as const) {
    nonempty(object[key], `OPERATION_${key}`);
  }
  if (object.provider !== "stockfish" && object.provider !== "maia"
      && object.provider !== "syzygy" && object.provider !== "lichess_explorer") fail("OPERATION_PROVIDER");
  const endpoint = parseEndpoint(object.endpoint);
  return deepFreeze({
    operation: object.operation as string,
    provider: object.provider,
    endpoint,
    parserId: object.parserId as string,
    sourceProjection: object.sourceProjection as string,
    sourceFactoryId: object.sourceFactoryId as string,
    cliName: object.cliName as string,
  });
}

function parseEndpoint(value: unknown): Endpoint {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail("ENDPOINT_SHAPE");
  const kind = (value as Record<string, unknown>).kind;
  if (kind === "uci_supervisor") {
    const object = exactObject(value, ["kind", "engineId"], "ENDPOINT_SHAPE");
    if (object.engineId !== "stockfish-analysis" && object.engineId !== "maia-5m") fail("ENDPOINT_ENGINE");
    return deepFreeze({ kind, engineId: object.engineId });
  }
  if (kind === "https") {
    const object = exactObject(value, ["kind", "origin", "path"], "ENDPOINT_SHAPE");
    if (object.origin !== "https://tablebase.lichess.org" && object.origin !== "https://explorer.lichess.ovh") fail("ENDPOINT_ORIGIN");
    if (object.path !== "/standard" && object.path !== "/lichess") fail("ENDPOINT_PATH");
    return deepFreeze({ kind, origin: object.origin, path: object.path });
  }
  fail("ENDPOINT_KIND");
}

function parseDomain(value: unknown): DomainRow {
  const object = exactObject(value, ["domain", "constructorId"], "DOMAIN_SHAPE");
  nonempty(object.domain, "DOMAIN_ID");
  nonempty(object.constructorId, "DOMAIN_CONSTRUCTOR");
  return deepFreeze({ domain: object.domain as string, constructorId: object.constructorId as string });
}

function exactObject(value: unknown, keys: readonly string[], code: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (canonicalizeJson(actual) !== canonicalizeJson(expected)) fail(code);
  return value as Record<string, unknown>;
}

function rowOrder(left: unknown, right: unknown): number {
  return Buffer.compare(Buffer.from(canonicalizeJson(left), "utf8"), Buffer.from(canonicalizeJson(right), "utf8"));
}

function unique(rows: readonly unknown[], code: string): void {
  const keys = rows.map(canonicalizeJson);
  if (new Set(keys).size !== keys.length) fail(code);
}

function nonempty(value: unknown, code: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0) fail(code);
  canonicalizeJson(value);
}

function readGitObject(repoRoot: string, spec: string): Buffer | null {
  const probe = spawnSync("git", ["-C", repoRoot, "cat-file", "-e", spec], { stdio: "ignore" });
  if (probe.status === 1 || probe.status === 128) return null;
  if (probe.status !== 0) fail("GIT_OBJECT_PROBE");
  return execFileSync("git", ["-C", repoRoot, "show", spec], { encoding: "buffer" });
}

function readFileBytes(path: string): Buffer | null {
  try {
    return readFileSync(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function assertSameBytes(actual: Uint8Array | null, expected: Uint8Array, code: string): void {
  if (actual === null || !Buffer.from(actual).equals(Buffer.from(expected))) fail(code);
}

function gitText(root: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function digestBytes(value: Uint8Array): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function digestUtf8(value: string): string {
  return digestBytes(Buffer.from(value, "utf8"));
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  if (ArrayBuffer.isView(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function fail(code: string): never {
  throw new TypeError(code);
}
