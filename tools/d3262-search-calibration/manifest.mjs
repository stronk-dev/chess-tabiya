// Disposable D3262 preregistration input. No provider calls or chess judgements.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

// The monorepo installs chessops under package-local dependencies, not at root.
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseSan } from "../../packages/runtime/node_modules/chessops/dist/esm/san.js";
import { makeUci, parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";

const sampleBytes = readFileSync(new URL("../d1023-bounded-policy-harness/provider-sample.json", import.meta.url));
const sampleDigest = createHash("sha256").update(sampleBytes).digest("hex");
const EXPECTED_SAMPLE_DIGEST = "6cdddbffd72d8af93504f808bf012d5ea68b5f9103277bb493e2d1c92984748b";
const EXPECTED_MANIFEST_DIGEST = "244c750c432e0a73f37b32fcbfcc8158a6b511d980fcf9b0267d95f8506dff86";
if (sampleDigest !== EXPECTED_SAMPLE_DIGEST) throw new Error("The sealed D1023 source changed; D3262 requires a new preregistration");
const sample = JSON.parse(sampleBytes.toString("utf8"));
const roots = new Map();
for (const population of sample.populations) for (const row of population.rows) {
  const existing = roots.get(row.parentFen);
  if (existing !== undefined && existing.phase !== row.phase) throw new Error(`Conflicting source phases at ${row.parentFen}`);
  const item = existing ?? { id: `d1023:${createHash("sha256").update(row.parentFen).digest("hex").slice(0, 16)}`, fen: row.parentFen, phase: row.phase, sourceRows: [] };
  item.sourceRows.push({ population: population.population, sourceId: row.sourceId, candidateUci: row.candidateUci, targetFamily: row.targetFamily, played: row.played });
  roots.set(row.parentFen, item);
}

function legal(fen, uci) {
  const state = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const parsed = parseUci(uci);
  if (parsed === undefined) throw new Error(`Invalid UCI ${uci}`);
  const move = normalizeMove(state, parsed);
  if (!state.isLegal(move)) throw new Error(`Illegal UCI ${uci} from ${fen}`);
  return makeUci(move);
}
function sanLine(sans) {
  const state = Chess.default();
  const edges = [];
  for (const san of sans) {
    const before = makeFen(state.toSetup());
    const move = parseSan(state, san);
    if (move === undefined || !state.isLegal(move)) throw new Error(`Illegal SAN ${san}`);
    state.play(move);
    edges.push({ before, uci: makeUci(move), after: makeFen(state.toSetup()) });
  }
  return edges;
}
const carlsbadBytes = readFileSync(new URL("../../content/drafts/carlsbad-minority-attack.json", import.meta.url));
const carlsbadDigest = createHash("sha256").update(carlsbadBytes).digest("hex");
if (carlsbadDigest !== "b23c29b5d9136ba36f9f15cde34be831b7c13d990e5f3e51a0a84a25a86b7d52") {
  throw new Error("The authored Carlsbad control changed; D3262 requires a new preregistration");
}
const carlsbad = JSON.parse(carlsbadBytes.toString("utf8"));
if (carlsbad.spine?.[0]?.id !== "nf8-regroup" || carlsbad.spine[0].moveUci !== "d7f8") throw new Error("Carlsbad's authored route control changed");
const bishop = sanLine(["d4", "d5", "Nf3", "Nf6", "e3", "Bg4", "h3", "Bh5"]);
const specials = [
  { id: "quiet-plan:carlsbad-nf8", fen: carlsbad.start.fen, phase: "middlegame", focus: "quiet_plan", role: "authored_knight_route_positive_and_autonomous_detector_negative", candidateUci: "d7f8", source: "content/drafts/carlsbad-minority-attack.json#nf8-regroup" },
  { id: "pressure:bg4-h3-bh5", fen: bishop[6].before, phase: "opening", focus: "retained_pressure", role: "harassment_with_retained_pressure", candidateUci: bishop[6].uci, expectedReplyUci: bishop[7].uci, source: "tools/d723-breadth-harness/breadth.test.ts#relative-pressure" },
  { id: "tactical:fork-survives", fen: "r3k3/8/4N3/8/8/8/8/7K w - - 0 1", phase: "unclassified", focus: "tactical", role: "all_reply_fork_positive", candidateUci: "e6c7", source: "tools/d794-bounded-reply-harness/bounded-reply.test.ts#fork-survives" },
  { id: "tactical:fork-parried", fen: "r3r2k/8/4N3/8/8/6b1/8/7K w - - 0 1", phase: "unclassified", focus: "tactical", role: "all_reply_fork_negative", candidateUci: "e6c7", source: "tools/d794-bounded-reply-harness/bounded-reply.test.ts#fork-parried" },
];
for (const special of specials) {
  special.candidateUci = legal(special.fen, special.candidateUci);
  if (special.expectedReplyUci !== undefined) {
    const state = Chess.fromSetup(parseFen(special.fen).unwrap()).unwrap();
    state.play(normalizeMove(state, parseUci(special.candidateUci)));
    special.expectedReplyUci = legal(makeFen(state.toSetup()), special.expectedReplyUci);
  }
  if (roots.has(special.fen)) throw new Error(`Special fixture duplicates predecessor root: ${special.id}`);
}
const rows = [...roots.values()].map((row) => ({ ...row, sourceRows: row.sourceRows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) })).concat(specials).sort((a, b) => a.id.localeCompare(b.id));
if (roots.size !== 62 || rows.length !== 66) throw new Error(`Unexpected population: ${roots.size} predecessor roots, ${rows.length} total`);
const bytes = JSON.stringify(rows);
const manifestDigest = createHash("sha256").update(bytes).digest("hex");
if (manifestDigest !== EXPECTED_MANIFEST_DIGEST) throw new Error(`The D3262 root manifest changed to ${manifestDigest}; do not silently change the calibration population`);
const byPhase = Object.fromEntries([...new Set(rows.map((row) => row.phase))].sort().map((phase) => [phase, rows.filter((row) => row.phase === phase).length]));
export const manifestRows = Object.freeze(rows);
export const manifestIdentity = Object.freeze({ version: 1, sampleDigest: `sha256:${sampleDigest}`, carlsbadDigest: `sha256:${carlsbadDigest}`, rootCount: rows.length, predecessorRoots: roots.size, manifestDigest: `sha256:${manifestDigest}`, byPhase });
if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify({ ...manifestIdentity, ...(process.argv.includes("--rows") ? { rows: manifestRows } : {}) }, null, 2)}\n`);
}
