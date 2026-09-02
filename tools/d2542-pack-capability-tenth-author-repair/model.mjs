import crypto from "node:crypto";

function fail(message) {
  throw new TypeError(message);
}

function canonical(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  fail("outside canonical JSON domain");
}

function digest(prefix, value) {
  return `sha256:${crypto.createHash("sha256").update(`${prefix}\0`, "utf8").update(canonical(value), "utf8").digest("hex")}`;
}

export function jobRequestDigest(request) {
  return digest("chess-tabiya/evidence-job-request/v1", request);
}

export function batchRequestDigest(request) {
  return digest("chess-tabiya/evidence-batch-request/v1", request);
}

export function rewindState(state) {
  if (["admitted", "running", "retry_wait", "settled_success"].includes(state)) return "cancelled";
  if (["settled_empty", "settled_unavailable", "cancelled", "consumed"].includes(state)) return state;
  fail(`unknown durable job state ${state}`);
}

export function applicationReceipt({ jobId, runId, nodeId, fromRevision, toRevision, events }) {
  if (!Array.isArray(events) || events.length === 0) fail("application events required");
  const sequences = events.map((event) => event.seq);
  if (sequences.some((seq, index) => !Number.isSafeInteger(seq) || (index > 0 && seq !== sequences[index - 1] + 1))) {
    fail("application events must be contiguous");
  }
  return Object.freeze({
    schema: "evidence_application_receipt@1",
    jobId,
    runId,
    nodeId,
    fromRevision,
    toRevision,
    firstEventSeq: sequences[0],
    lastEventSeq: sequences.at(-1),
    eventDigest: digest("chess-tabiya/evidence-application/v1", events),
  });
}
