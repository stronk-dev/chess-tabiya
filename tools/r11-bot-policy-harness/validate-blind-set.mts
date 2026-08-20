// DISPOSABLE research validator — platform-alignment R11. Not production code.
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { Chess } from "../../apps/server/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../apps/server/node_modules/chessops/dist/esm/fen.js";
import { makeSanAndPlay } from "../../apps/server/node_modules/chessops/dist/esm/san.js";
import { isNormal } from "../../apps/server/node_modules/chessops/dist/esm/types.js";
import { parseUci } from "../../apps/server/node_modules/chessops/dist/esm/util.js";

const ROOT = new URL("../../", import.meta.url).pathname;
const OUT = process.env.TABIYA_R11_BLIND_OUT
  ?? join(ROOT, "planning/platform-alignment/bot-policy/blind-review");

function sha(value: string): string { return createHash("sha256").update(value).digest("hex"); }
function pgn(line: any): string {
  const fields = line.startFen.split(" ");
  let turn = fields[1] === "b" ? "black" : "white";
  let fullmove = Number(fields[5] ?? 1);
  const tokens: string[] = [];
  for (const move of line.san as string[]) {
    if (turn === "white") tokens.push(`${fullmove}. ${move}`);
    else { tokens.push(tokens.length === 0 ? `${fullmove}... ${move}` : move); fullmove += 1; }
    turn = turn === "white" ? "black" : "white";
  }
  return `[Event "R11 blind branch"]\n[Site "Tabiya disposable research"]\n[Date "2026.08.20"]\n[Round "${line.blindId}"]\n[White "Bot A"]\n[Black "Bot B"]\n[Result "*"]\n[SetUp "1"]\n[FEN "${line.startFen}"]\n\n${tokens.join(" ")} *\n`;
}
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const keyText = await readFile(join(OUT, "blind-key.json"), "utf8");
const key = JSON.parse(keyText) as any;
const packet = JSON.parse(await readFile(join(OUT, "review-packet.json"), "utf8")) as any[];
const manifest = JSON.parse(await readFile(join(OUT, "manifest.json"), "utf8")) as any;
const localBookSummary = JSON.parse(await readFile(join(OUT, "local-book-summary.json"), "utf8")) as any;
const ids = new Set<string>();
const pgns: string[] = [];
const armRows = new Map<string, any[]>();

for (const line of key.lines as any[]) {
  assert(!ids.has(line.blindId), `duplicate blind id ${line.blindId}`);
  ids.add(line.blindId);
  assert(line.historyUci.length === line.san.length, `${line.blindId}: history/SAN length mismatch`);
  assert(line.historyUci.length === line.trace.length, `${line.blindId}: history/trace length mismatch`);
  const position = Chess.fromSetup(parseFen(line.startFen).unwrap()).unwrap();
  const replayedSan: string[] = [];
  for (let index = 0; index < line.historyUci.length; index += 1) {
    const uci = line.historyUci[index];
    const move = parseUci(uci);
    assert(move !== undefined && isNormal(move) && position.isLegal(move), `${line.blindId}: illegal ${uci} at ${index + 1}`);
    replayedSan.push(makeSanAndPlay(position, move));
    assert(line.trace[index].moveUci === uci, `${line.blindId}: trace/UCI mismatch at ${index + 1}`);
    if (line.trace[index].maiaSelected !== undefined) {
      assert(line.trace[index].maiaEngine !== undefined, `${line.blindId}: missing Maia engine identity at ${index + 1}`);
    }
    if (String(line.trace[index].applied).includes("fallback")) {
      assert(typeof line.trace[index].fallback === "string", `${line.blindId}: unrecorded fallback at ${index + 1}`);
    }
  }
  assert(JSON.stringify(replayedSan) === JSON.stringify(line.san), `${line.blindId}: SAN replay mismatch`);
  const rendered = pgn(line);
  assert(await readFile(join(OUT, "pgn", `${line.blindId}.pgn`), "utf8") === rendered, `${line.blindId}: PGN mismatch`);
  pgns.push(rendered);
  for (const row of line.trace.filter((row: any) => row.controlled)) {
    const rows = armRows.get(line.arm) ?? [];
    rows.push(row);
    armRows.set(line.arm, rows);
  }
}

assert(ids.size === manifest.branches, "manifest branch count mismatch");
assert(new Set(pgns).size === pgns.length, "duplicate PGN content");
const fileIds = (await readdir(join(OUT, "pgn"))).filter((name) => name.endsWith(".pgn")).map((name) => name.slice(0, -4));
assert(fileIds.length === ids.size && fileIds.every((id) => ids.has(id)), "PGN directory/key mismatch");
assert(`sha256:${sha(pgns.join("\n"))}` === manifest.pgnDigest, "PGN digest mismatch");
assert(`sha256:${sha(JSON.stringify(packet) + packet.map((row) => pgns[(key.lines as any[]).findIndex((line) => line.blindId === row.blindId)]).join("\n"))}` === manifest.packetDigest, "packet digest mismatch");
assert(`sha256:${sha(JSON.stringify(key))}` === manifest.keyDigest, "key digest mismatch");
assert(`sha256:${sha(JSON.stringify(localBookSummary))}` === manifest.localBookDigest, "local-book digest mismatch");

for (const [arm, expected] of Object.entries(manifest.armExercise) as Array<[string, any]>) {
  const rows = armRows.get(arm) ?? [];
  const fallbacks = rows.filter((row) => row.fallback !== undefined).length;
  const losses = rows.map((row) => row.stockfishLossCp).filter((value) => typeof value === "number") as number[];
  assert(rows.length === expected.controlledPlies, `${arm}: controlled-ply mismatch`);
  assert(fallbacks === expected.fallbackPlies, `${arm}: fallback mismatch`);
  assert(Math.abs(fallbacks / Math.max(1, rows.length) - expected.fallbackRate) < 1e-12, `${arm}: fallback-rate mismatch`);
  assert(Math.abs(losses.reduce((sum, value) => sum + value, 0) / Math.max(1, losses.length) - expected.meanLossCp) < 1e-12, `${arm}: mean-loss mismatch`);
  assert(Math.abs(losses.filter((value) => value >= 250).length / Math.max(1, losses.length) - expected.severe250Rate) < 1e-12, `${arm}: severe-loss mismatch`);
}

const packetIds = new Set(packet.map((row) => row.blindId));
assert(packetIds.size === packet.length && packet.every((row) => ids.has(row.blindId)), "packet ID mismatch");
assert(packet.length === manifest.reviewPacketBranches, "packet branch count mismatch");
for (const line of key.lines as any[]) {
  const expected = line.arm === "weakened_stockfish_control" || manifest.armExercise[line.arm].reviewEligible;
  assert(packetIds.has(line.blindId) === expected, `${line.blindId}: packet eligibility mismatch`);
}

process.stdout.write(`${JSON.stringify({ branches: ids.size, packetBranches: packet.length, arms: [...armRows.keys()], status: "valid" }, null, 2)}\n`);
