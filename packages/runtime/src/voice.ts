import type { PackPhase } from "@chess-tabiya/schema/drill-pack";

import type { AssessmentCategory } from "./branch-scale.js";
import type { EndgameReading } from "./endgame.js";
import type { DetectedPhase } from "./phase.js";
import type { PivotalMarker } from "./pivotal.js";
import type { StructuralObservation, StructureMatch } from "./structure.js";

export interface ShapeEntryRef { readonly id: string; readonly name: string; readonly attribution: string; }

export interface EngineReadingValues {
  readonly centipawns?: number;
  readonly mateIn?: number;
  readonly depth: number;
  readonly multiPv: 1;
  readonly perspective: "white";
  readonly engineId: string;
  readonly engineName: string;
  readonly engineVersion: string;
}

export interface TablebaseReadingValues {
  readonly category: AssessmentCategory;
  readonly dtz: number | null;
  readonly preciseDtz: number | null;
  readonly dtm: number | null;
  readonly pieceCount: number;
  readonly checkmate: boolean;
  readonly stalemate: boolean;
  readonly insufficientMaterial: boolean;
}

export type RecordedReading =
  | {
      readonly kind: "engine_eval";
      readonly fen: string;
      readonly sourceId: string;
      readonly retrievedAt: string;
      readonly values: EngineReadingValues;
    }
  | {
      readonly kind: "tablebase_result";
      readonly fen: string;
      readonly sourceId: string;
      readonly retrievedAt: string;
      readonly values: TablebaseReadingValues;
    };

export type PositionEvidenceIndex = ReadonlyMap<string, readonly RecordedReading[]>;

export interface EvidencePacket {
  readonly fen: string;
  readonly phase: { readonly source: "author"; readonly value: PackPhase } | { readonly source: "detector"; readonly value: DetectedPhase };
  readonly structures: readonly StructureMatch[];
  readonly observations: readonly StructuralObservation[];
  readonly markers: readonly PivotalMarker[];
  readonly endgame: EndgameReading | null;
  readonly plans: readonly ShapeEntryRef[];
  readonly authored: readonly { readonly id: string; readonly text: string; readonly attribution: string }[];
  readonly readings: readonly RecordedReading[];
  readonly sentences: readonly string[];
}

function recordedDate(retrievedAt: string): string {
  return retrievedAt.slice(0, 10);
}

function signedPawns(centipawns: number): string {
  const pawns = centipawns / 100;
  return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(2)}`;
}

/** Frozen prose over recorded values. There is deliberately no absence arm. */
export function renderRecordedReading(reading: RecordedReading): readonly string[] {
  const date = recordedDate(reading.retrievedAt);
  if (reading.kind === "engine_eval") {
    const prefix = `Recorded reading at this position: ${reading.values.engineName} ${reading.values.engineVersion} at depth ${reading.values.depth}, single line,`;
    const result = reading.values.mateIn === undefined
      ? `scored ${signedPawns(reading.values.centipawns!)} from White's side`
      : `reported mate in ${reading.values.mateIn} from White's side`;
    return Object.freeze([`${prefix} ${result} when this pack was authored on ${date}.`]);
  }
  const measures = [
    ...(reading.values.dtz === null ? [] : [`DTZ ${Math.abs(reading.values.dtz)}`]),
    ...(reading.values.dtm === null ? [] : [`DTM ${Math.abs(reading.values.dtm)}`]),
  ];
  return Object.freeze([
    `Recorded reading at this position: Syzygy, ${reading.values.pieceCount} pieces — ${reading.values.category} from White's side${measures.length === 0 ? "" : `, ${measures.join(", ")}`} — queried when this pack was authored on ${date}.`,
  ]);
}

export const BANNED_JUDGEMENTS = Object.freeze(["weak", "strong", "good", "bad", "better", "worse", "advantage", "winning", "losing", "should", "must", "best", "worst", "mistake", "blunder", "punish", "wins", "loses"]);
export const PRESCRIPTIVE_VERBS = Object.freeze(["play", "push", "trade", "take", "capture", "put", "place", "move", "develop", "castle", "promote", "advance", "retreat", "sacrifice", "exchange", "avoid", "prevent", "prepare", "aim", "attack", "defend", "target", "grab", "reroute"]);
export const CHESS_LEXICON = Object.freeze(["pawn", "knight", "bishop", "rook", "queen", "king", "opening", "middlegame", "endgame", "outpost", "carlsbad", "isolated", "backward", "passed", "file", "lucena", "philidor", "vancura"]);

const UCI = /\b[a-h][1-8][a-h][1-8][qrbn]?\b/gi;
const SAN = /\b(?:O-O(?:-O)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?)\b/g;
const SQUARE = /\b[a-h][1-8]\b/gi;

function tokens(pattern: RegExp, text: string): readonly string[] { return [...text.matchAll(new RegExp(pattern.source, pattern.flags))].map((match) => match[0]!.toLowerCase()); }
function absentWords(words: readonly string[], packet: string, output: string): readonly string[] { const allowed = packet.toLowerCase(); return words.filter((word) => new RegExp(`\\b${word}\\b`, "i").test(output) && !new RegExp(`\\b${word}\\b`, "i").test(allowed)); }

export interface VoiceCheckResult { readonly valid: boolean; readonly violations: readonly string[]; }
export function voiceCheck(packet: EvidencePacket, output: string): VoiceCheckResult {
  const source = packet.sentences.join("\n");
  const violations: string[] = [];
  for (const [label, pattern] of [["square", SQUARE], ["move", UCI], ["move", SAN]] as const) for (const token of tokens(pattern, output)) if (!source.toLowerCase().includes(token)) violations.push(`${label}:${token}`);
  for (const word of absentWords(CHESS_LEXICON, source, output)) violations.push(`noun:${word}`);
  for (const word of absentWords(BANNED_JUDGEMENTS, source, output)) violations.push(`judgement:${word}`);
  for (const word of absentWords(PRESCRIPTIVE_VERBS, source, output)) violations.push(`prescription:${word}`);
  return Object.freeze({ valid: violations.length === 0, violations: Object.freeze([...new Set(violations)].sort()) });
}
