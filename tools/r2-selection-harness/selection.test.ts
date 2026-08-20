// DISPOSABLE research harness — platform-alignment R2. Not production code.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import type { Move, Role } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  STRUCTURAL_FEATURE_KINDS,
  structuralReading,
  transitionReading,
  type StructuralObservation,
} from "@chess-tabiya/runtime";

import { transitions } from "../r1r2-primitives-harness/corpus.js";

const OUTPUT = new URL("./output.md", import.meta.url).pathname;
const SOURCE = process.env.TABIYA_LICHESS_GAMES;
const TARGET_PLIES = new Set([8, 16, 24, 32, 40, 48]);
const TOP_EIGHT = new Set([
  "named_structure",
  "doubled_pawn",
  "passed_pawn",
  "open_file",
  "piece_count",
  "isolated_pawn",
  "king_opposition",
  "king_zone",
]);
const REFUSED = new Set(["pawn_safe_square", "pawn_count"]);
const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];

interface Row {
  readonly id: string;
  readonly parentFen: string;
  readonly fen: string;
  readonly uci: string;
  readonly stratum: string;
}

interface Outcome {
  readonly uci: string;
  readonly fen: string;
  readonly rawGained: number;
  readonly families: ReadonlySet<string>;
  readonly critical: ReadonlySet<string>;
}

interface PopulationResult {
  readonly name: string;
  readonly rows: number;
  readonly alternatives: number;
  readonly raw: SurfaceMetric;
  readonly topEight: SurfaceMetric;
  readonly selected: SurfaceMetric;
  readonly sensitivity: readonly Sensitivity[];
  readonly criticalTotal: number;
  readonly criticalRetained: number;
  readonly avoidedCandidates: number;
  readonly selectedSigns: ReadonlyMap<string, number>;
  readonly selectedFamilies: ReadonlyMap<string, number>;
  readonly criticalFamilies: ReadonlyMap<string, number>;
  readonly playedKind: ReadonlyMap<string, number>;
  readonly altKind: ReadonlyMap<string, number>;
}

interface SurfaceMetric {
  readonly firing: number;
  readonly entries: number;
  readonly shares: readonly number[];
}

interface Sensitivity {
  readonly threshold: number;
  readonly cap: number;
  readonly firing: number;
  readonly entries: number;
  readonly shares: readonly number[];
  readonly criticalTotal: number;
  readonly criticalRetained: number;
}

function position(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

function legalOutcomes(fen: string): readonly { readonly uci: string; readonly fen: string }[] {
  const pos = position(fen);
  const result: { uci: string; fen: string }[] = [];
  for (const [from, dests] of pos.allDests()) {
    for (const to of dests) {
      const roles = pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56)
        ? PROMOTIONS
        : [undefined];
      for (const promotion of roles) {
        const move: Move = promotion === undefined ? { from, to } : { from, to, promotion };
        if (!pos.isLegal(move)) continue;
        const next = pos.clone();
        next.play(move);
        result.push({ uci: makeUci(move), fen: makeFen(next.toSetup()) });
      }
    }
  }
  return result;
}

function observationKey(value: StructuralObservation): string {
  return JSON.stringify(value);
}

function transitionLeaf(value: NonNullable<ReturnType<typeof transitionReading>>["observations"][number]): string {
  return "direction" in value ? `${value.kind}:${value.direction}` : `${value.kind}:${value.subkind}`;
}

function deriveOutcome(
  beforeFen: string,
  before: readonly StructuralObservation[],
  uci: string,
  afterFen: string,
): Outcome {
  const after = structuralReading(afterFen).features;
  const beforeKeys = new Set(before.map(observationKey));
  const afterKeys = new Set(after.map(observationKey));
  const families = new Set<string>();
  let rawGained = 0;
  for (const value of after) {
    const key = observationKey(value);
    if (!beforeKeys.has(key)) {
      rawGained += 1;
      families.add(`structure:gained:${value.kind}`);
    } else {
      families.add(`structure:preserved:${value.kind}`);
    }
  }
  for (const value of before) {
    if (!afterKeys.has(observationKey(value))) families.add(`structure:lost:${value.kind}`);
  }

  const transition = transitionReading(beforeFen, uci, afterFen);
  if (transition !== null) {
    for (const value of transition.observations) {
      // The independent rules event below canonicalizes castling across the two UCI encodings.
      if (value.kind === "move_irreversibility" && value.subkind === "castled") continue;
      families.add(`transition:${transitionLeaf(value)}`);
    }
  }

  const critical = new Set<string>();
  const beforePosition = position(beforeFen);
  const afterPosition = position(afterFen);
  if (afterPosition.isEnd() && afterPosition.isCheck()) {
    families.add("rules:checkmate");
    critical.add("rules:checkmate");
  }
  const move = parseUci(uci);
  if (move !== undefined && "promotion" in move && move.promotion !== undefined) {
    families.add("rules:promotion");
    critical.add("rules:promotion");
  }
  if (move !== undefined && "from" in move && beforePosition.board.getRole(move.from) === "king") {
    const color = beforePosition.board.getColor(move.from);
    const landed = color === undefined ? undefined : afterPosition.board.kingOf(color);
    if (landed !== undefined && Math.abs(landed % 8 - move.from % 8) === 2) {
      families.add("rules:castling");
      critical.add("rules:castling");
    }
  }
  for (const family of families) {
    if (family === "transition:move_irreversibility:last_of_role") {
      critical.add(family);
    }
  }
  return { uci, fen: afterFen, rawGained, families, critical };
}

function familyKind(family: string): string {
  return family.startsWith("structure:") ? family.split(":")[2]! : family;
}

function familySign(family: string): string {
  if (family.startsWith("structure:")) return family.split(":")[1]!;
  if (family.startsWith("transition:")) return "transition";
  return "rule";
}

function eligible(family: string): boolean {
  return !REFUSED.has(familyKind(family));
}

function select(
  played: Outcome,
  alternatives: readonly Outcome[],
  threshold: number,
  cap: number,
): readonly { readonly family: string; readonly share: number }[] {
  const candidates = [...played.families].map((family) => ({
    family,
    share: alternatives.filter((alt) => alt.families.has(family)).length / alternatives.length,
    critical: played.critical.has(family),
  })).filter((candidate) => candidate.critical || (alternatives.length >= 8 && eligible(candidate.family) && candidate.share <= threshold));
  candidates.sort((left, right) => Number(right.critical) - Number(left.critical) || left.share - right.share || left.family.localeCompare(right.family));
  return candidates.slice(0, Math.max(cap, candidates.filter((candidate) => candidate.critical).length));
}

function metric(): { firing: number; entries: number; shares: number[] } {
  return { firing: 0, entries: 0, shares: [] };
}

function summarize(name: string, rows: readonly Row[]): PopulationResult {
  const raw = metric();
  const topEight = metric();
  const selected = metric();
  const settings = [
    { threshold: 0.1, cap: 2 },
    { threshold: 0.2, cap: 1 },
    { threshold: 0.2, cap: 2 },
    { threshold: 0.2, cap: 3 },
    { threshold: 0.3, cap: 2 },
  ];
  const sensitivity = settings.map((setting) => ({ ...setting, ...metric(), criticalTotal: 0, criticalRetained: 0 }));
  const selectedSigns = new Map<string, number>();
  const selectedFamilies = new Map<string, number>();
  const criticalFamilies = new Map<string, number>();
  const playedKind = new Map<string, number>();
  const altKind = new Map<string, number>();
  let alternativesTotal = 0;
  let criticalTotal = 0;
  let criticalRetained = 0;
  let avoidedCandidates = 0;

  for (const row of rows) {
    const before = structuralReading(row.parentFen).features;
    const all = legalOutcomes(row.parentFen);
    const playedPosition = position(row.parentFen);
    const parsedPlayed = parseUci(row.uci);
    if (parsedPlayed === undefined || !playedPosition.isLegal(parsedPlayed)) throw new Error(`played move ${row.uci} is not legal in ${row.id}`);
    playedPosition.play(parsedPlayed);
    const playedFen = makeFen(playedPosition.toSetup());
    const played = deriveOutcome(row.parentFen, before, row.uci, playedFen);
    // chessops internally encodes castling as king-takes-rook while authored packs use
    // destination-square UCI. Exclude the equivalent outcome by resulting position, not token.
    const alternatives = all.filter((item) => item.fen !== playedFen).map((item) => deriveOutcome(row.parentFen, before, item.uci, item.fen));
    if (alternatives.length === 0) continue;
    alternativesTotal += alternatives.length;

    const rawFamilies = [...played.families].filter((family) => family.startsWith("structure:gained:"));
    if (played.rawGained > 0) raw.firing += 1;
    raw.entries += played.rawGained;
    for (const family of rawFamilies) {
      const share = alternatives.filter((alt) => alt.families.has(family)).length / alternatives.length;
      const multiplicity = structuralReading(played.fen).features.filter((value) => family === `structure:gained:${value.kind}` && !new Set(before.map(observationKey)).has(observationKey(value))).length;
      for (let index = 0; index < multiplicity; index += 1) raw.shares.push(share);
    }

    const top = rawFamilies.filter((family) => TOP_EIGHT.has(familyKind(family)));
    if (top.length > 0) topEight.firing += 1;
    topEight.entries += top.length;
    for (const family of top) topEight.shares.push(alternatives.filter((alt) => alt.families.has(family)).length / alternatives.length);

    const chosen = select(played, alternatives, 0.2, 2);
    if (chosen.length > 0) selected.firing += 1;
    selected.entries += chosen.length;
    selected.shares.push(...chosen.map((item) => item.share));
    for (const item of chosen) {
      selectedSigns.set(familySign(item.family), (selectedSigns.get(familySign(item.family)) ?? 0) + 1);
      selectedFamilies.set(item.family, (selectedFamilies.get(item.family) ?? 0) + 1);
    }
    for (const family of played.critical) criticalFamilies.set(family, (criticalFamilies.get(family) ?? 0) + 1);
    criticalTotal += played.critical.size;
    criticalRetained += chosen.filter((item) => played.critical.has(item.family)).length;

    for (const setting of sensitivity) {
      const values = select(played, alternatives, setting.threshold, setting.cap);
      if (values.length > 0) setting.firing += 1;
      setting.entries += values.length;
      setting.shares.push(...values.map((item) => item.share));
      setting.criticalTotal += played.critical.size;
      setting.criticalRetained += values.filter((item) => played.critical.has(item.family)).length;
    }

    const alternativeCounts = new Map<string, number>();
    for (const alt of alternatives) for (const family of alt.families) alternativeCounts.set(family, (alternativeCounts.get(family) ?? 0) + 1);
    for (const [family, count] of alternativeCounts) {
      if (!played.families.has(family) && (family.startsWith("structure:gained:") || family.startsWith("structure:lost:")) && count / alternatives.length >= 0.3) avoidedCandidates += 1;
    }

    const playedKinds = new Set(rawFamilies.map(familyKind));
    for (const kind of playedKinds) playedKind.set(kind, (playedKind.get(kind) ?? 0) + 1);
    for (const alt of alternatives) {
      const kinds = new Set([...alt.families].filter((family) => family.startsWith("structure:gained:")).map(familyKind));
      for (const kind of kinds) altKind.set(kind, (altKind.get(kind) ?? 0) + 1);
    }
  }
  return {
    name,
    rows: rows.length,
    alternatives: alternativesTotal,
    raw,
    topEight,
    selected,
    sensitivity,
    criticalTotal,
    criticalRetained,
    avoidedCandidates,
    selectedSigns,
    selectedFamilies,
    criticalFamilies,
    playedKind,
    altKind,
  };
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

function importedRows(path: string): { readonly rows: readonly Row[]; readonly games: ReadonlyMap<string, number> } {
  const source = readFileSync(path, "utf8");
  const blocks = source.split(/\n(?=\[Event )/u);
  const accepted = new Map<string, number>();
  const rows: Row[] = [];
  const full = (): boolean => ["bullet", "blitz", "rapid"].every((time) => ["1000-1399", "1400-1799", "1800-2199"].every((elo) => (accepted.get(`${time}/${elo}`) ?? 0) >= 12));

  for (const block of blocks) {
    if (full()) break;
    let game;
    try {
      [game] = parsePgn(block);
    } catch {
      continue;
    }
    if (game === undefined || game.headers.get("Result") === "*" || game.headers.get("Variant") !== undefined && game.headers.get("Variant") !== "Standard") continue;
    const time = speed(game.headers.get("Event") ?? "");
    const white = Number(game.headers.get("WhiteElo"));
    const black = Number(game.headers.get("BlackElo"));
    const elo = band((white + black) / 2);
    if (time === undefined || elo === undefined) continue;
    const cell = `${time}/${elo}`;
    if ((accepted.get(cell) ?? 0) >= 12) continue;
    const pos = startingPosition(game.headers).unwrap();
    const candidates: Row[] = [];
    let ply = 0;
    let legal = true;
    for (const data of game.moves.mainline()) {
      const move = parseSan(pos, data.san);
      if (move === undefined || !pos.isLegal(move)) {
        legal = false;
        break;
      }
      ply += 1;
      const parentFen = makeFen(pos.toSetup());
      const uci = makeUci(move);
      pos.play(move);
      if (TARGET_PLIES.has(ply)) candidates.push({
        id: `${game.headers.get("Site") ?? cell}#${ply}`,
        parentFen,
        fen: makeFen(pos.toSetup()),
        uci,
        stratum: cell,
      });
    }
    if (!legal || candidates.length === 0) continue;
    accepted.set(cell, (accepted.get(cell) ?? 0) + 1);
    rows.push(...candidates);
  }
  if (!full()) throw new Error(`PGN prefix did not fill every stratum: ${JSON.stringify(Object.fromEntries(accepted))}`);
  return { rows, games: accepted };
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pct(numerator: number, denominator: number): string {
  return denominator === 0 ? "n/a" : `${(100 * numerator / denominator).toFixed(2)}%`;
}

function surfaceLine(metricValue: SurfaceMetric, rows: number): string {
  return `${pct(metricValue.firing, rows)} | ${(metricValue.entries / rows).toFixed(2)} | ${(100 * (1 - mean(metricValue.shares))).toFixed(2)}%`;
}

function rankMap(result: PopulationResult): ReadonlyMap<string, number> {
  const values = STRUCTURAL_FEATURE_KINDS.map((kind) => {
    const playedRate = (result.playedKind.get(kind) ?? 0) / result.rows;
    const altRate = (result.altKind.get(kind) ?? 0) / result.alternatives;
    return { kind, lift: altRate === 0 ? Number.POSITIVE_INFINITY : playedRate / altRate };
  }).filter((item) => (result.playedKind.get(item.kind) ?? 0) > 0).sort((left, right) => right.lift - left.lift || left.kind.localeCompare(right.kind));
  return new Map(values.map((item, index) => [item.kind, index + 1]));
}

function spearman(left: ReadonlyMap<string, number>, right: ReadonlyMap<string, number>): number {
  const keys = [...left.keys()].filter((key) => right.has(key));
  if (keys.length < 2) return Number.NaN;
  const l = keys.map((key) => left.get(key)!);
  const r = keys.map((key) => right.get(key)!);
  const lm = mean(l), rm = mean(r);
  const covariance = l.reduce((sum, value, index) => sum + (value - lm) * (r[index]! - rm), 0);
  const denominator = Math.sqrt(l.reduce((sum, value) => sum + (value - lm) ** 2, 0) * r.reduce((sum, value) => sum + (value - rm) ** 2, 0));
  return covariance / denominator;
}

function renderKinds(result: PopulationResult): readonly string[] {
  return STRUCTURAL_FEATURE_KINDS.map((kind) => {
    const played = result.playedKind.get(kind) ?? 0;
    const alt = result.altKind.get(kind) ?? 0;
    const playedRate = played / result.rows;
    const altRate = alt / result.alternatives;
    const lift = altRate === 0 ? Number.POSITIVE_INFINITY : playedRate / altRate;
    return `| \`${kind}\` | ${pct(played, result.rows)} | ${pct(alt, result.alternatives)} | ${played === 0 ? "n/a" : Number.isFinite(lift) ? `${lift.toFixed(2)}x` : "inf"} |`;
  });
}

describe("R2 selection, sign, and significance", () => {
  it("enumerates all four legal promotion outcomes", () => {
    const outcomes = legalOutcomes("8/P7/8/8/8/8/7k/4K3 w - - 0 1").map((item) => item.uci);
    expect(outcomes.filter((uci) => uci.startsWith("a7a8"))).toEqual(["a7a8q", "a7a8r", "a7a8b", "a7a8n"]);
  });

  it.skipIf(SOURCE === undefined || !existsSync(SOURCE))("measures transfer and the predeclared selector", () => {
    const authoredRows: Row[] = transitions().map((row) => ({
      id: `${row.pack}/${row.nodeId}`,
      parentFen: row.parentFen,
      fen: row.fen,
      uci: row.uci,
      stratum: row.phase,
    }));
    const imported = importedRows(SOURCE!);
    const authored = summarize("Authored spines", authoredRows);
    const ordinary = summarize("Imported games", imported.rows);
    const lines: string[] = [];
    const say = (line = "") => lines.push(line);
    const digest = createHash("sha256").update(readFileSync(SOURCE!)).digest("hex");

    say("# R2 selection harness output");
    say();
    say(`External PGN SHA-256: \`${digest}\`.`);
    say(`Imported selection: ${[...imported.games].sort().map(([cell, count]) => `${cell}=${count}`).join(", ")}; ${imported.rows.length} fixed-ply decisions.`);
    say(`Authored selection: ${authored.rows} transitions from ${new Set(authoredRows.map((row) => row.id.split("/")[0])).size} current draft packs.`);
    say();
    say("Counterfactual specificity is `1 - same signed-family share among legal alternatives`. It is not usefulness, correctness, or valence.");
    say();
    say("## Surface comparison");
    say();
    say("| population / surface | decisions firing | cards or entries / decision | mean counterfactual specificity |");
    say("|---|---:|---:|---:|");
    for (const result of [authored, ordinary]) {
      say(`| ${result.name} / shipped raw gained observations | ${surfaceLine(result.raw, result.rows)} |`);
      say(`| ${result.name} / authored top-eight kinds | ${surfaceLine(result.topEight, result.rows)} |`);
      say(`| ${result.name} / predeclared 20%, cap-two selector | ${surfaceLine(result.selected, result.rows)} |`);
    }
    say();
    say("## Selector sensitivity and critical-event retention");
    say();
    say("| population | max alternative share | cap | decisions firing | cards/decision | specificity | critical retained |");
    say("|---|---:|---:|---:|---:|---:|---:|");
    for (const result of [authored, ordinary]) for (const row of result.sensitivity) {
      say(`| ${result.name} | ${(100 * row.threshold).toFixed(0)}% | ${row.cap} | ${pct(row.firing, result.rows)} | ${(row.entries / result.rows).toFixed(2)} | ${(100 * (1 - mean(row.shares))).toFixed(2)}% | ${row.criticalRetained}/${row.criticalTotal} |`);
    }
    say();
    for (const result of [authored, ordinary]) {
      say(`- ${result.name}: ${result.avoidedCandidates} alternative-only structural relations met the 30% \`avoided\` threshold; none receives good/bad wording. Selected sign mix: ${[...result.selectedSigns].sort().map(([sign, count]) => `${sign}=${count}`).join(", ") || "none"}.`);
      say(`  Critical events: ${[...result.criticalFamilies].sort().map(([family, count]) => `${family}=${count}`).join(", ") || "none"}.`);
      say(`  Most-selected families: ${[...result.selectedFamilies].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).slice(0, 12).map(([family, count]) => `${family}=${count}`).join(", ") || "none"}.`);
    }
    say();
    say("## Per-kind transfer: gained structural relation");
    say();
    say(`Rank correlation across shared firing kinds: Spearman rho ${spearman(rankMap(authored), rankMap(ordinary)).toFixed(3)}.`);
    say();
    say("### Authored spines");
    say();
    say("| kind | played rate | legal-alternative rate | lift |");
    say("|---|---:|---:|---:|");
    lines.push(...renderKinds(authored));
    say();
    say("### Imported games");
    say();
    say("| kind | played rate | legal-alternative rate | lift |");
    say("|---|---:|---:|---:|");
    lines.push(...renderKinds(ordinary));
    say();
    say("## Machine-readable assertions");
    say();
    say(`- predeclared selector has fewer entries than raw on authored: ${authored.selected.entries < authored.raw.entries}`);
    say(`- predeclared selector has fewer entries than raw on imported: ${ordinary.selected.entries < ordinary.raw.entries}`);
    say(`- predeclared selector specificity exceeds raw on authored: ${mean(authored.selected.shares) < mean(authored.raw.shares)}`);
    say(`- predeclared selector specificity exceeds raw on imported: ${mean(ordinary.selected.shares) < mean(ordinary.raw.shares)}`);
    say(`- all critical low-frequency events retained: ${authored.criticalRetained + ordinary.criticalRetained}/${authored.criticalTotal + ordinary.criticalTotal}`);
    say("- valence output emitted: 0 (required abstention)");
    say();

    while (lines.at(-1) === "") lines.pop();
    writeFileSync(OUTPUT, `${lines.join("\n")}\n`, "utf8");
    expect(authored.selected.entries).toBeLessThan(authored.raw.entries);
    expect(ordinary.selected.entries).toBeLessThan(ordinary.raw.entries);
    expect(mean(authored.selected.shares)).toBeLessThan(mean(authored.raw.shares));
    expect(mean(ordinary.selected.shares)).toBeLessThan(mean(ordinary.raw.shares));
    expect(authored.criticalRetained + ordinary.criticalRetained).toBe(authored.criticalTotal + ordinary.criticalTotal);
  });
});
