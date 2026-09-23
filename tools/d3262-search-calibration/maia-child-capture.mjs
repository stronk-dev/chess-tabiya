// Disposable D3262 Maia capture at every selected candidate's child position.
// Returned mass is the provider's raw model output, NOT the configured bot's
// temperature/top-p sampling distribution (D3276).
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";

const graphBytes = readFileSync(new URL("../../planning/semantic-consequence-search/d3262-exact-replies.json", import.meta.url));
const graph = JSON.parse(graphBytes.toString("utf8"));
const BASE_URL = process.env.D3262_BASE_URL ?? "http://127.0.0.1:3000";
const BAND = 1400, TEMPERATURE = 0.8, TOP_P = 0.92;
const POLICY_CONFIG_DIGEST = `sha256:${"3".repeat(64)}`;
const args = process.argv.slice(2);
function option(name) { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; }
function check(value, message) { if (!value) throw new Error(message); }
check(graph.authority === "complete_legal_opponent_reply_edges_not_a_semantic_proof", "Child capture needs complete legal candidate replies");
const positions = graph.roots.flatMap((root) => root.candidates.map((candidate) => ({ rootId: root.rootId, candidateUci: candidate.candidateUci, fen: candidate.afterFen, legalReplyUcis: candidate.replies.map((reply) => reply.uci) })));
check(positions.length === 196 && new Set(positions.map((row) => row.fen)).size === 196, "Unexpected child-position population");
const limit = option("--limit") === undefined ? positions.length : Number(option("--limit"));
check(Number.isSafeInteger(limit) && limit >= 1 && limit <= positions.length, "--limit must be a positive candidate prefix length");
const output = option("--out") ?? (limit === positions.length ? new URL("../../planning/semantic-consequence-search/d3262-maia-child-capture.json", import.meta.url) : undefined);
check(output !== undefined, "Partial capture requires --out");

const password = `d3262-child-${randomBytes(16).toString("hex")}`;
let cookie = "";
function seed(fen) { return Number.parseInt(createHash("sha256").update(`${fen}|${BAND}`).digest("hex").slice(0, 8), 16) & 0x7fff_ffff; }
async function api(path, init = {}) {
  return fetch(`${BASE_URL}${path}`, { ...init, headers: { ...(init.body === undefined ? {} : { "content-type": "application/json" }), ...(cookie === "" ? {} : { cookie }), ...init.headers }, signal: AbortSignal.timeout(30_000) });
}
async function authenticate() {
  const response = await api("/auth/register", { method: "POST", body: JSON.stringify({ handle: `d3262-child-${randomBytes(6).toString("hex")}`, password }) });
  check(response.ok, `Child probe registration failed: HTTP ${response.status}`);
  cookie = response.headers.get("set-cookie")?.split(";", 1)[0] ?? "";
  check(cookie !== "", "Child probe registration omitted session cookie");
}
async function deleteProbeAccount() {
  if (cookie === "") return;
  const preview = await api("/auth/deletion-preview", { method: "POST", body: "{}" });
  check(preview.ok, `Child probe deletion preview failed: HTTP ${preview.status}`);
  const { digest } = await preview.json();
  check(typeof digest === "string", "Child probe deletion preview omitted digest");
  const removed = await api("/auth/delete", { method: "POST", body: JSON.stringify({ password, previewDigest: digest }) });
  check(removed.ok, `Child probe deletion failed: HTTP ${removed.status}`);
  cookie = "";
}
function validatedCandidates(position, values) {
  check(Array.isArray(values) && values.length > 0, `${position.rootId}/${position.candidateUci}: Maia returned no candidates`);
  const legal = new Set(position.legalReplyUcis), seen = new Set();
  let returnedMass = 0, missingCandidateMasses = 0;
  const candidates = values.map((value, index) => {
    check(typeof value.moveUci === "string" && value.rank === index + 1, `Bad child Maia rank/identity ${position.rootId}/${position.candidateUci}`);
    const normalized = legal.has(value.moveUci) ? value.moveUci : { e1h1: "e1g1", e1a1: "e1c1", e8h8: "e8g8", e8a8: "e8c8" }[value.moveUci];
    check(normalized !== undefined && legal.has(normalized) && !seen.has(normalized), `Illegal or duplicate child Maia move ${position.rootId}/${position.candidateUci}/${value.moveUci}`);
    seen.add(normalized);
    if (value.mass === undefined) missingCandidateMasses += 1;
    else { check(Number.isFinite(value.mass) && value.mass >= 0 && value.mass <= 1, "Invalid raw Maia mass"); returnedMass += value.mass; }
    check(value.offWindow === undefined || value.offWindow === true, "Invalid child Maia off-window state");
    return { moveUci: value.moveUci, legalUci: normalized, rank: value.rank, ...(value.mass === undefined ? {} : { mass: value.mass }), ...(value.offWindow === undefined ? {} : { offWindow: value.offWindow }) };
  });
  check(returnedMass <= 1.000_002, "Child Maia mass exceeds one");
  return { candidates, returnedMass, missingMass: Math.max(0, 1 - returnedMass), missingCandidateMasses, unreturnedLegalCount: legal.size - seen.size };
}
async function capture(position) {
  const started = performance.now();
  try {
    const response = await api("/select-move", { method: "POST", body: JSON.stringify({ startFen: position.fen, historyUci: [], policy: { mode: "human_common", policyConfigDigest: POLICY_CONFIG_DIGEST, targetElo: BAND, temperature: TEMPERATURE, topP: TOP_P }, seed: seed(position.fen) }) });
    const raw = await response.text();
    let body; try { body = JSON.parse(raw); } catch { body = null; }
    if (!response.ok) return { ...position, status: "source_off", httpStatus: response.status, errorCode: typeof body?.code === "string" ? body.code : null, elapsedMs: Number((performance.now() - started).toFixed(2)) };
    check(body !== null && typeof body.engine === "object" && body.engine !== null, "Child Maia response omitted source identity");
    return { ...position, status: "captured", ...validatedCandidates(position, body.candidates), engine: body.engine, elapsedMs: Number((performance.now() - started).toFixed(2)) };
  } catch (error) {
    if (error instanceof TypeError && /fetch failed/u.test(error.message)) return { ...position, status: "source_off", errorCode: "network_unavailable", elapsedMs: Number((performance.now() - started).toFixed(2)) };
    if (error instanceof Error && error.name === "TimeoutError") return { ...position, status: "source_off", errorCode: "request_timeout", elapsedMs: Number((performance.now() - started).toFixed(2)) };
    throw error;
  }
}

const rows = [];
await authenticate();
try {
  for (const position of positions.slice(0, limit)) {
    rows.push(await capture(position));
    process.stderr.write(`D3262 Maia child ${rows.length}/${limit}: ${position.rootId}/${position.candidateUci} ${rows.at(-1).status}\n`);
  }
} finally { await deleteProbeAccount(); }
const artifact = {
  version: 1,
  manifest: graph.manifest,
  exactReplyDigest: `sha256:${createHash("sha256").update(graphBytes).digest("hex")}`,
  partial: limit !== positions.length,
  positions: rows.length,
  source: { mode: "human_common", band: BAND, temperature: TEMPERATURE, topP: TOP_P, policyConfigDigest: POLICY_CONFIG_DIGEST, seed: "sha256(fen|band).first32.and31", endpoint: "/select-move", massMeaning: "raw_model_softmax_not_configured_sampling_probability", engineIdentities: [...new Set(rows.filter((row) => row.status === "captured").map((row) => JSON.stringify(row.engine)))].map((value) => JSON.parse(value)) },
  rows,
};
await writeFile(output, `${JSON.stringify(artifact, null, 2)}\n`, { flag: "wx" });
process.stdout.write(`${JSON.stringify({ output: String(output), positions: rows.length, captured: rows.filter((row) => row.status === "captured").length, sourceOff: rows.filter((row) => row.status === "source_off").length, partial: artifact.partial })}\n`);
