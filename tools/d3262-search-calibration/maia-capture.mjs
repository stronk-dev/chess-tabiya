// Disposable D3262 Maia source capture. Retains the complete returned move
// distribution on the same frozen roots as Stockfish, without selecting hints.
import { createHash, randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";

import { manifestIdentity, manifestRows } from "./manifest.mjs";

const BASE_URL = process.env.D3262_BASE_URL ?? "http://127.0.0.1:3000";
const BAND = 1400;
const TEMPERATURE = 0.8;
const TOP_P = 0.92;
const POLICY_CONFIG_DIGEST = `sha256:${"3".repeat(64)}`;
const args = process.argv.slice(2);
function option(name) { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; }
const limit = option("--limit") === undefined ? manifestRows.length : Number(option("--limit"));
if (!Number.isSafeInteger(limit) || limit < 1 || limit > manifestRows.length) throw new Error("--limit must be a positive manifest prefix length");
const output = option("--out") ?? (limit === manifestRows.length ? new URL("../../planning/semantic-consequence-search/d3262-maia-capture.json", import.meta.url) : undefined);
if (output === undefined) throw new Error("A partial capture requires --out so it cannot masquerade as the full artifact");
const password = `d3262-${randomBytes(16).toString("hex")}`;
let cookie = "";
function seed(fen) { return Number.parseInt(createHash("sha256").update(`${fen}|${BAND}`).digest("hex").slice(0, 8), 16) & 0x7fff_ffff; }
async function api(path, init = {}) {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...(init.body === undefined ? {} : { "content-type": "application/json" }), ...(cookie === "" ? {} : { cookie }), ...init.headers },
    signal: AbortSignal.timeout(30_000),
  });
}
async function authenticate() {
  const response = await api("/auth/register", { method: "POST", body: JSON.stringify({ handle: `d3262-${randomBytes(6).toString("hex")}`, password }) });
  if (!response.ok) throw new Error(`Probe account registration failed: HTTP ${response.status}`);
  cookie = response.headers.get("set-cookie")?.split(";", 1)[0] ?? "";
  if (cookie === "") throw new Error("Probe account registration returned no session cookie");
}
async function deleteProbeAccount() {
  if (cookie === "") return;
  const preview = await api("/auth/deletion-preview", { method: "POST", body: "{}" });
  if (!preview.ok) throw new Error(`Probe account deletion preview failed: HTTP ${preview.status}`);
  const { digest } = await preview.json();
  if (typeof digest !== "string") throw new Error("Probe account deletion preview omitted digest");
  const removed = await api("/auth/delete", { method: "POST", body: JSON.stringify({ password, previewDigest: digest }) });
  if (!removed.ok) throw new Error(`Probe account deletion failed: HTTP ${removed.status}`);
  cookie = "";
}
function validateCandidates(root, candidates) {
  if (!Array.isArray(candidates)) throw new Error(`${root.id}: Maia omitted the candidates array`);
  const seenMoves = new Set(), seenRanks = new Set();
  let returnedMass = 0, missingCandidateMasses = 0;
  const values = candidates.map((value) => {
    if (typeof value.moveUci !== "string" || !Number.isSafeInteger(value.rank) || value.rank < 1) throw new Error(`${root.id}: invalid candidate identity/rank`);
    if (seenMoves.has(value.moveUci) || seenRanks.has(value.rank)) throw new Error(`${root.id}: duplicate candidate identity/rank`);
    seenMoves.add(value.moveUci); seenRanks.add(value.rank);
    if (value.mass === undefined) missingCandidateMasses += 1;
    else {
      if (!Number.isFinite(value.mass) || value.mass < 0 || value.mass > 1) throw new Error(`${root.id}: invalid candidate mass`);
      returnedMass += value.mass;
    }
    return { moveUci: value.moveUci, rank: value.rank, ...(value.mass === undefined ? {} : { mass: value.mass }), ...(value.offWindow === undefined ? {} : { offWindow: value.offWindow }) };
  }).sort((left, right) => left.rank - right.rank);
  if (returnedMass > 1.000_001) throw new Error(`${root.id}: returned mass exceeds one`);
  return { candidates: values, returnedMass, missingMass: Math.max(0, 1 - returnedMass), missingCandidateMasses };
}
async function capture(root) {
  const started = performance.now();
  try {
    const response = await api("/select-move", {
      method: "POST",
      body: JSON.stringify({ startFen: root.fen, historyUci: [], policy: { mode: "human_common", policyConfigDigest: POLICY_CONFIG_DIGEST, targetElo: BAND, temperature: TEMPERATURE, topP: TOP_P }, seed: seed(root.fen) }),
    });
    const body = await response.json();
    if (!response.ok) return { rootId: root.id, fen: root.fen, status: "source_off", httpStatus: response.status, errorCode: typeof body?.code === "string" ? body.code : null, elapsedMs: Number((performance.now() - started).toFixed(2)) };
    if (typeof body.engine !== "object" || body.engine === null) throw new Error(`${root.id}: Maia omitted source identity`);
    return { rootId: root.id, fen: root.fen, status: "captured", ...validateCandidates(root, body.candidates), engine: body.engine, elapsedMs: Number((performance.now() - started).toFixed(2)) };
  } catch (error) {
    if (error instanceof TypeError && /fetch failed/u.test(error.message)) return { rootId: root.id, fen: root.fen, status: "source_off", errorCode: "network_unavailable", elapsedMs: Number((performance.now() - started).toFixed(2)) };
    if (error instanceof Error && error.name === "TimeoutError") return { rootId: root.id, fen: root.fen, status: "source_off", errorCode: "request_timeout", elapsedMs: Number((performance.now() - started).toFixed(2)) };
    throw error;
  }
}

const rows = [];
await authenticate();
try {
  for (const root of manifestRows.slice(0, limit)) {
    rows.push(await capture(root));
    process.stderr.write(`D3262 Maia ${rows.length}/${limit}: ${root.id} ${rows.at(-1).status}\n`);
  }
} finally { await deleteProbeAccount(); }
const artifact = {
  version: 1,
  manifest: manifestIdentity.manifestDigest,
  partial: limit !== manifestRows.length,
  roots: rows.length,
  source: { mode: "human_common", band: BAND, temperature: TEMPERATURE, topP: TOP_P, policyConfigDigest: POLICY_CONFIG_DIGEST, seed: "sha256(fen|band).first32.and31", endpoint: "/select-move", engineIdentities: [...new Set(rows.filter((row) => row.status === "captured").map((row) => JSON.stringify(row.engine)))].map((item) => JSON.parse(item)) },
  rows,
};
await writeFile(output, `${JSON.stringify(artifact, null, 2)}\n`, { flag: "wx" });
process.stdout.write(`${JSON.stringify({ output: String(output), roots: rows.length, captured: rows.filter((row) => row.status === "captured").length, sourceOff: rows.filter((row) => row.status === "source_off").length, manifest: artifact.manifest, partial: artifact.partial })}\n`);
