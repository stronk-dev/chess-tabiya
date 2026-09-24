/**
 * Disposable validation instrument for the registered KRPKR setup conventions (D2495 follow-up).
 *
 * It (1) builds the named fixture set — published diagrams, colour mirrors, hard negatives and
 * one-operand near-misses — (2) draws a seeded uniform sample of legal positions matching each
 * registered convention by rejection sampling, (3) probes every position once against the Lichess
 * Syzygy tablebase HTTP API (recorded to a committed cache so reruns are offline), (4) re-runs the
 * production matcher over every KRPKR position in the draft corpus, and writes one report.
 *
 * Usage: node validate.mjs [--offline]
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { ENDGAME_SETUP_CONVENTIONS, endgameSetupMatch, endgameSetupMatches, krpkrPlacement, type EndgameTechnique } from "../../packages/runtime/src/endgame-setup.js";
import { ENDGAME_SETUP_FIXTURES } from "../../packages/runtime/src/endgame-setup.fixtures.js";
import { ENDGAME_METHOD_CONVENTIONS, replayEndgameMethod } from "../../packages/runtime/src/endgame-method.js";

const CACHE = resolve("packages/runtime/src/fixtures/endgame-setup-tablebase.json");
const REPORT = resolve("planning/endgame-setup-conventions/validation.json");
const SAMPLE_PER_TECHNIQUE = 100;
const offline = process.argv.includes("--offline");

type Category = string;
const cache: Record<string, Category> = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) as Record<string, Category> : {};

async function probe(fen: string): Promise<Category> {
  const key = canonicalFen(positionFromFen(fen));
  if (cache[key] !== undefined) return cache[key]!;
  if (offline) throw new Error(`offline and no recorded tablebase category for ${key}`);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(`https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(key)}`);
    if (response.status === 429) { await new Promise((done) => setTimeout(done, 60_000)); continue; }
    if (!response.ok) throw new Error(`tablebase ${response.status} for ${key}`);
    const body = await response.json() as { category: string };
    cache[key] = body.category;
    writeFileSync(CACHE, `${JSON.stringify(Object.fromEntries(Object.entries(cache).sort(([left], [right]) => left.localeCompare(right))), null, 2)}\n`);
    await new Promise((done) => setTimeout(done, 350));
    return body.category;
  }
  throw new Error(`tablebase rate-limited for ${key}`);
}

/** Exact: the side to move has a legal move that captures the opponent's rook. */
function rookCaptureAvailable(fen: string): boolean {
  const position = positionFromFen(fen);
  const enemy = position.turn === "white" ? "black" : "white";
  const target = [...position.board.pieces(enemy, "rook")][0];
  if (target === undefined) return false;
  for (const [, destinations] of position.allDests()) if (destinations.has(target)) return true;
  return false;
}

/** Side-to-move tablebase category re-oriented to the pawn side. */
function attackerOutcome(fen: string, category: Category): string {
  const placement = krpkrPlacement(positionFromFen(fen));
  if (placement === null) return `not_krpkr(side-to-move ${category})`;
  const toMove = positionFromFen(fen).turn;
  if (toMove === placement.attacker) return category;
  return ({ win: "loss", loss: "win", "maybe-win": "maybe-loss", "maybe-loss": "maybe-win", "cursed-win": "blessed-loss", "blessed-loss": "cursed-win" } as Record<string, string>)[category] ?? category;
}

// Seeded PRNG (mulberry32) so the sample is reproducible.
function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PAWN_RANKS: Readonly<Record<EndgameTechnique, readonly number[]>> = { lucena: [7], philidor: [2, 3, 4, 5], vancura: [2, 3, 4, 5, 6] };

function fenFrom(pieces: ReadonlyMap<number, string>, turn: "w" | "b"): string {
  const rows: string[] = [];
  for (let rank = 7; rank >= 0; rank -= 1) {
    let row = "", empty = 0;
    for (let file = 0; file < 8; file += 1) {
      const piece = pieces.get(rank * 8 + file);
      if (piece === undefined) { empty += 1; continue; }
      if (empty > 0) { row += String(empty); empty = 0; }
      row += piece;
    }
    rows.push(empty > 0 ? row + String(empty) : row);
  }
  return `${rows.join("/")} ${turn} - - 0 1`;
}

/** Uniform sample (rejection sampling, White attacker, random side to move) of legal matching positions. */
function samplePopulation(technique: EndgameTechnique, count: number, seed: number): readonly string[] {
  const convention = ENDGAME_SETUP_CONVENTIONS.find((candidate) => candidate.technique === technique)!;
  const random = rng(seed);
  const found = new Set<string>();
  let tries = 0;
  while (found.size < count && tries < 50_000_000) {
    tries += 1;
    const ranks = PAWN_RANKS[technique];
    const pawn = (ranks[Math.floor(random() * ranks.length)]! - 1) * 8 + Math.floor(random() * 8);
    const squares = [pawn];
    while (squares.length < 5) {
      const square = Math.floor(random() * 64);
      if (!squares.includes(square)) squares.push(square);
    }
    const pieces = new Map<number, string>([[squares[0]!, "P"], [squares[1]!, "K"], [squares[2]!, "R"], [squares[3]!, "k"], [squares[4]!, "r"]]);
    const fen = fenFrom(pieces, random() < 0.5 ? "w" : "b");
    let result;
    try { result = endgameSetupMatch(fen, convention); } catch { continue; }
    if (result.kind === "matched") found.add(result.value.fen);
  }
  return [...found].sort();
}

function play(fen: string, uci: string): string {
  const board = positionFromFen(fen);
  const move = parseUci(uci);
  if (move === undefined || !board.isLegal(move)) throw new TypeError(`illegal authored move ${uci}`);
  board.play(move);
  return canonicalFen(board);
}

interface SpineNode { readonly id: string; readonly moveUci: string; readonly children: readonly SpineNode[] }
function corpusPositions(root: string): readonly { packId: string; nodeId: string; fen: string }[] {
  const rows: { packId: string; nodeId: string; fen: string }[] = [];
  const files = readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !/\.(?:browser|evidence|job|sources)\.json$/u.test(entry.name)).map((entry) => resolve(root, entry.name)).sort();
  for (const file of files) {
    const pack = JSON.parse(readFileSync(file, "utf8")) as { id: string; start?: { fen: string }; spine?: readonly SpineNode[] };
    if (pack.start === undefined) continue;
    const add = (nodeId: string, fen: string): string => {
      const canonical = canonicalFen(positionFromFen(fen));
      if (krpkrPlacement(positionFromFen(canonical)) !== null) rows.push({ packId: pack.id, nodeId, fen: canonical });
      return canonical;
    };
    const walk = (children: readonly SpineNode[], parent: string): void => { for (const child of children) walk(child.children, add(child.id, play(parent, child.moveUci))); };
    walk(pack.spine ?? [], add("$start", pack.start.fen));
  }
  return rows;
}

interface PathStep { readonly nodeId: string; readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string }
/** Every authored root-to-leaf spine path, as exact steps. */
function corpusPaths(root: string): readonly { packId: string; steps: readonly PathStep[] }[] {
  const paths: { packId: string; steps: readonly PathStep[] }[] = [];
  const files = readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !/\.(?:browser|evidence|job|sources|graduation)\.json$/u.test(entry.name)).map((entry) => resolve(root, entry.name)).sort();
  for (const file of files) {
    const pack = JSON.parse(readFileSync(file, "utf8")) as { id: string; start?: { fen: string }; spine?: readonly SpineNode[] };
    if (pack.start === undefined) continue;
    const walk = (children: readonly SpineNode[], parent: string, steps: readonly PathStep[]): void => {
      if (children.length === 0) { paths.push({ packId: pack.id, steps }); return; }
      for (const child of children) {
        const after = play(parent, child.moveUci);
        walk(child.children, after, [...steps, { nodeId: child.id, beforeFen: parent, moveUci: child.moveUci, afterFen: after }]);
      }
    };
    walk(pack.spine ?? [], canonicalFen(positionFromFen(pack.start.fen)), []);
  }
  return paths;
}

/** Production replay: each method convention's window starts at the path's first matching setup. */
function methodEvents(paths: readonly { packId: string; steps: readonly PathStep[] }[]) {
  const events: { packId: string; convention: string; stage: string; nodeId: string; moveUci: string }[] = [];
  const arrivals: { packId: string; setup: string; nodeId: string }[] = [];
  for (const path of paths) {
    for (const convention of ENDGAME_METHOD_CONVENTIONS) {
      const start = path.steps.findIndex((step) => endgameSetupMatch(step.beforeFen, convention.setup).kind === "matched");
      const arrival = path.steps.findIndex((step) => endgameSetupMatch(step.beforeFen, convention.setup).kind !== "matched" && endgameSetupMatch(step.afterFen, convention.setup).kind === "matched");
      if (arrival >= 0) arrivals.push({ packId: path.packId, setup: `${convention.setup.id}@${convention.setup.version}`, nodeId: path.steps[arrival]!.nodeId });
      if (start < 0) continue;
      const window = path.steps.slice(start);
      for (const stage of replayEndgameMethod(convention, window)) events.push({ packId: path.packId, convention: `${convention.id}@${convention.version}`, stage: stage.stage, nodeId: window[stage.stepIndex]!.nodeId, moveUci: window[stage.stepIndex]!.moveUci });
    }
  }
  const unique = [...new Map(events.map((event) => [`${event.convention}|${event.stage}|${event.nodeId}`, event])).values()];
  const uniqueArrivals = [...new Map(arrivals.map((arrival) => [`${arrival.setup}|${arrival.nodeId}`, arrival])).values()];
  return { paths: paths.length, pathsWithStage: new Set(events.map((event) => `${event.packId}`)).size, distinctStageEvents: unique, witnessedSetupArrivals: uniqueArrivals };
}

const tally = (values: readonly string[]): Record<string, number> => Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((candidate) => candidate === value).length]));

const fixtures = [];
for (const fixture of ENDGAME_SETUP_FIXTURES) {
  const category = await probe(fixture.fen);
  const fires = endgameSetupMatches(fixture.fen).map((match) => match.technique);
  fixtures.push({ ...fixture, fires, rookCaptureAvailable: rookCaptureAvailable(fixture.fen),tablebaseSideToMove: category, attackerOutcome: attackerOutcome(fixture.fen, category) });
}

const populations: Record<string, unknown> = {};
for (const [index, convention] of ENDGAME_SETUP_CONVENTIONS.entries()) {
  const sample = samplePopulation(convention.technique, SAMPLE_PER_TECHNIQUE, 20260924 + index);
  const rows = [];
  for (const fen of sample) {
    const category = await probe(fen);
    rows.push({ fen, sideToMove: fen.split(" ")[1] === "w" ? "attacker" : "defender", rookCaptureAvailable: rookCaptureAvailable(fen), tablebaseSideToMove: category, attackerOutcome: attackerOutcome(fen, category) });
  }
  populations[`${convention.id}@${convention.version}`] = {
    sampled: rows.length,
    attackerOutcome: tally(rows.map((row) => row.attackerOutcome)),
    attackerOutcomeByRookCapture: { available: tally(rows.filter((row) => row.rookCaptureAvailable).map((row) => row.attackerOutcome)), unavailable: tally(rows.filter((row) => !row.rookCaptureAvailable).map((row) => row.attackerOutcome)) },
    attackerOutcomeBySideToMove: { attacker: tally(rows.filter((row) => row.sideToMove === "attacker").map((row) => row.attackerOutcome)), defender: tally(rows.filter((row) => row.sideToMove === "defender").map((row) => row.attackerOutcome)) },
    rows,
  };
}

const corpus = corpusPositions(resolve("content/drafts"));
const corpusMatches = corpus.map((row) => ({ ...row, fires: endgameSetupMatches(row.fen).map((match) => match.technique) }));

const report = {
  schema: "tabiya.research.endgame-setup-conventions.validation.v1",
  boundary: "Static setup geometry under the registered conventions, checked against Syzygy WDL via the Lichess tablebase API. A tablebase category is the outcome authority; it is not part of the setup match.",
  tablebase: { api: "https://tablebase.lichess.ovh/standard", recordedCache: "packages/runtime/src/fixtures/endgame-setup-tablebase.json" },
  conventions: ENDGAME_SETUP_CONVENTIONS.map((convention) => `${convention.id}@${convention.version}`),
  fixtures,
  populations,
  corpus: {
    krpkrPositions: corpus.length,
    matches: tally(corpusMatches.flatMap((row) => row.fires)),
    rows: corpusMatches.filter((row) => row.fires.length > 0),
  },
  authoredMethodPaths: methodEvents(corpusPaths(resolve("content/drafts"))),
};

mkdirSync(dirname(REPORT), { recursive: true });
writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(CACHE, `${JSON.stringify(Object.fromEntries(Object.entries(cache).sort(([left], [right]) => left.localeCompare(right))), null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ fixtures: fixtures.map((row) => [row.id, row.fires, row.attackerOutcome]), populations: Object.fromEntries(Object.entries(populations).map(([key, value]) => [key, { bySide: (value as { attackerOutcomeBySideToMove: unknown }).attackerOutcomeBySideToMove, byRookCapture: (value as { attackerOutcomeByRookCapture: unknown }).attackerOutcomeByRookCapture }])), corpus: report.corpus.matches, corpusKrpkr: corpus.length, methodPaths: report.authoredMethodPaths.paths, stages: report.authoredMethodPaths.distinctStageEvents.map((event) => `${event.stage}@${event.packId}:${event.moveUci}`), arrivals: report.authoredMethodPaths.witnessedSetupArrivals }, null, 1)}\n`);
