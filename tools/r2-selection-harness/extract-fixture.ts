// DISPOSABLE research harness helper — extracts the bounded R2 imported-game fixture.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { startingPosition } from "chessops/pgn";
import { parsePgn } from "chessops/pgn";
import { parseSan } from "chessops/san";

const source = process.argv[2];
const output = process.argv[3];
if (source === undefined || output === undefined) {
  throw new Error("usage: extract-fixture SOURCE.pgn OUTPUT.pgn");
}

function speed(event: string): "bullet" | "blitz" | "rapid" | undefined {
  if (/UltraBullet/u.test(event)) return undefined;
  if (/Bullet/u.test(event)) return "bullet";
  if (/Blitz/u.test(event)) return "blitz";
  if (/Rapid/u.test(event)) return "rapid";
  return undefined;
}

function band(rating: number): "1000-1399" | "1400-1799" | "1800-2199" | undefined {
  if (rating >= 1000 && rating <= 1399) return "1000-1399";
  if (rating >= 1400 && rating <= 1799) return "1400-1799";
  if (rating >= 1800 && rating <= 2199) return "1800-2199";
  return undefined;
}

const text = readFileSync(source, "utf8");
const blocks = text.split(/\n(?=\[Event )/u);
const accepted = new Map<string, number>();
const selected: string[] = [];
const cells = ["bullet", "blitz", "rapid"].flatMap((time) =>
  ["1000-1399", "1400-1799", "1800-2199"].map((elo) => `${time}/${elo}`),
);
const full = (): boolean => cells.every((cell) => (accepted.get(cell) ?? 0) >= 12);

for (const block of blocks) {
  if (full()) break;
  let game;
  try {
    [game] = parsePgn(block);
  } catch {
    continue;
  }
  if (game === undefined || game.headers.get("Result") === "*" ||
      game.headers.get("Variant") !== undefined && game.headers.get("Variant") !== "Standard") continue;
  const time = speed(game.headers.get("Event") ?? "");
  const elo = band((Number(game.headers.get("WhiteElo")) + Number(game.headers.get("BlackElo"))) / 2);
  if (time === undefined || elo === undefined) continue;
  const cell = `${time}/${elo}`;
  if ((accepted.get(cell) ?? 0) >= 12) continue;

  const position = startingPosition(game.headers).unwrap();
  let legal = true;
  let plies = 0;
  for (const data of game.moves.mainline()) {
    const move = parseSan(position, data.san);
    if (move === undefined || !position.isLegal(move)) {
      legal = false;
      break;
    }
    position.play(move);
    plies += 1;
  }
  if (!legal || plies < 8) continue;
  accepted.set(cell, (accepted.get(cell) ?? 0) + 1);
  selected.push(block.trim());
}

if (!full()) throw new Error(`prefix did not fill every stratum: ${JSON.stringify(Object.fromEntries(accepted))}`);
const fixture = `${selected.join("\n\n")}\n`;
writeFileSync(output, fixture, "utf8");
process.stdout.write(`${JSON.stringify({
  games: selected.length,
  strata: Object.fromEntries([...accepted].sort()),
  sha256: createHash("sha256").update(fixture).digest("hex"),
})}\n`);
