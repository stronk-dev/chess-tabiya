import { createHash } from "node:crypto";

const RECEIPT_SCHEMA = "tabiya.provider-obligations.v1";
const SOURCE_RFC = "provider-exchange-and-execution.md";
const DIGEST_DOMAIN = `${RECEIPT_SCHEMA}\0`;
const authorities = new WeakMap();

export function issueReceipt(operations, digestDomains) {
  const populations = canonicalPopulations(operations, digestDomains);
  return deepFreeze({
    schema: RECEIPT_SCHEMA,
    sourceRfc: SOURCE_RFC,
    obligationsDigest: obligationDigest(populations),
    ...populations,
  });
}

export function parseReceipt(value) {
  exactObject(value, ["schema", "sourceRfc", "obligationsDigest", "operations", "digestDomains"], "RECEIPT_SHAPE");
  if (value.schema !== RECEIPT_SCHEMA) fail("RECEIPT_SCHEMA");
  if (value.sourceRfc !== SOURCE_RFC) fail("RECEIPT_SOURCE");
  if (!/^sha256:[0-9a-f]{64}$/u.test(value.obligationsDigest)) fail("RECEIPT_DIGEST_GRAMMAR");
  const populations = canonicalPopulations(value.operations, value.digestDomains);
  if (canonical(value.operations) !== canonical(populations.operations)
      || canonical(value.digestDomains) !== canonical(populations.digestDomains)) fail("RECEIPT_ORDER");
  if (value.obligationsDigest !== obligationDigest(populations)) fail("RECEIPT_DIGEST");
  return issueReceipt(populations.operations, populations.digestDomains);
}

export function projectAcceptedAuthority(firstParentHistory) {
  if (!Array.isArray(firstParentHistory) || firstParentHistory.length === 0) fail("HISTORY_EMPTY");
  let previousStatus = "absent";
  let sawDraft = false;
  let accepted = null;
  const commits = new Set();
  for (const image of firstParentHistory) {
    exactObject(image, ["commit", "status", "receipt"], "HISTORY_IMAGE");
    nonempty(image.commit, "HISTORY_COMMIT");
    if (commits.has(image.commit)) fail("HISTORY_COMMIT_DUPLICATE");
    commits.add(image.commit);
    if (!["absent", "draft", "accepted"].includes(image.status)) fail("HISTORY_STATUS");
    if (image.status === "draft") sawDraft = true;
    if (previousStatus === "accepted" && image.status !== "accepted") fail("ACCEPTANCE_REGRESSION");
    if (previousStatus !== "accepted" && image.status === "accepted") {
      if (!sawDraft || previousStatus !== "draft") fail("ACCEPTANCE_TRANSITION_UNOBSERVED");
      if (accepted !== null) fail("ACCEPTANCE_DUPLICATE");
      accepted = { commit: image.commit, receipt: parseReceipt(image.receipt) };
    }
    previousStatus = image.status;
  }
  if (accepted === null) fail("ACCEPTANCE_ABSENT");
  const authority = deepFreeze({
    kind: "provider_obligations_acceptance",
    acceptedCommit: accepted.commit,
    receiptDigest: digestUtf8(canonical(accepted.receipt)),
  });
  authorities.set(authority, accepted);
  return authority;
}

export function issueResource(operations, digestDomains) {
  const payload = canonicalPopulations(operations, digestDomains);
  const body = { id: "provider-protocol", version: 1, payload };
  return deepFreeze({ ...body, digest: digestUtf8(canonical(body)) });
}

export function validateProductLanding(authority, currentReceipt, candidateResource) {
  const accepted = authorities.get(authority);
  if (accepted === undefined) fail("ACCEPTANCE_AUTHORITY");
  const current = parseReceipt(currentReceipt);
  if (digestUtf8(canonical(current)) !== authority.receiptDigest
      || canonical(current) !== canonical(accepted.receipt)) fail("ACCEPTED_RECEIPT_REPLACED");
  const candidate = parseResource(candidateResource);
  if (canonical(candidate.payload.operations) !== canonical(current.operations)
      || canonical(candidate.payload.digestDomains) !== canonical(current.digestDomains)) fail("OBLIGATION_ORDER_OR_MEMBER_MISMATCH");
  return true;
}

export function obligationDigest(populations) {
  return digestUtf8(`${DIGEST_DOMAIN}${canonical(populations)}`);
}

function parseResource(value) {
  exactObject(value, ["id", "version", "payload", "digest"], "RESOURCE_SHAPE");
  if (value.id !== "provider-protocol" || value.version !== 1) fail("RESOURCE_IDENTITY");
  exactObject(value.payload, ["operations", "digestDomains"], "RESOURCE_PAYLOAD");
  const populations = canonicalPopulations(value.payload.operations, value.payload.digestDomains);
  if (canonical(value.payload) !== canonical(populations)) fail("RESOURCE_ORDER");
  const body = { id: value.id, version: value.version, payload: populations };
  if (value.digest !== digestUtf8(canonical(body))) fail("RESOURCE_DIGEST");
  return deepFreeze({ ...body, digest: value.digest });
}

function canonicalPopulations(operations, digestDomains) {
  if (!Array.isArray(operations) || !Array.isArray(digestDomains)) fail("POPULATION_ARRAYS");
  const parsedOperations = operations.map(parseOperation).sort(rowOrder);
  const parsedDomains = digestDomains.map(parseDomain).sort(rowOrder);
  unique(parsedOperations, "OPERATION_DUPLICATE");
  unique(parsedDomains, "DOMAIN_DUPLICATE");
  return deepFreeze({ operations: parsedOperations, digestDomains: parsedDomains });
}

function parseOperation(value) {
  exactObject(value, ["operation", "provider", "endpoint", "parserId", "sourceProjection", "sourceFactoryId", "cliName"], "OPERATION_SHAPE");
  for (const key of ["operation", "parserId", "sourceProjection", "sourceFactoryId", "cliName"]) nonempty(value[key], `OPERATION_${key}`);
  if (!["stockfish", "maia", "syzygy", "lichess_explorer"].includes(value.provider)) fail("OPERATION_PROVIDER");
  exactObject(value.endpoint, value.endpoint?.kind === "uci_supervisor" ? ["kind", "engineId"] : ["kind", "origin", "path"], "ENDPOINT_SHAPE");
  if (value.endpoint.kind === "uci_supervisor") {
    if (!["stockfish-analysis", "maia-5m"].includes(value.endpoint.engineId)) fail("ENDPOINT_ENGINE");
  } else if (value.endpoint.kind === "https") {
    if (!["https://tablebase.lichess.org", "https://explorer.lichess.ovh"].includes(value.endpoint.origin)) fail("ENDPOINT_ORIGIN");
    if (!["/standard", "/lichess"].includes(value.endpoint.path)) fail("ENDPOINT_PATH");
  } else fail("ENDPOINT_KIND");
  return deepFreeze(copy(value));
}

function parseDomain(value) {
  exactObject(value, ["domain", "constructorId"], "DOMAIN_SHAPE");
  nonempty(value.domain, "DOMAIN_ID");
  nonempty(value.constructorId, "DOMAIN_CONSTRUCTOR");
  return deepFreeze(copy(value));
}

function unique(rows, code) {
  const keys = rows.map(canonical);
  if (new Set(keys).size !== keys.length) fail(code);
}

function rowOrder(left, right) {
  return Buffer.compare(Buffer.from(canonical(left), "utf8"), Buffer.from(canonical(right), "utf8"));
}

function canonical(value) {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

function digestUtf8(value) { return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`; }
function exactObject(value, keys, code) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (canonical(actual) !== canonical(expected)) fail(code);
}
function nonempty(value, code) { if (typeof value !== "string" || value.length === 0) fail(code); }
function copy(value) { return JSON.parse(JSON.stringify(value)); }
function deepFreeze(value) { if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value; for (const child of Object.values(value)) deepFreeze(child); return Object.freeze(value); }
function fail(code) { throw new TypeError(code); }
