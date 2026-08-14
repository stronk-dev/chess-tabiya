import type { PackPhase } from "@chess-tabiya/schema/drill-pack";

import type { EndgameReading } from "./endgame.js";
import type { DetectedPhase } from "./phase.js";
import type { PivotalMarker } from "./pivotal.js";
import type { StructuralObservation, StructureMatch } from "./structure.js";

export interface ShapeEntryRef { readonly id: string; readonly name: string; readonly attribution: string; }
export interface EvidencePacket {
  readonly fen: string;
  readonly phase: { readonly source: "author"; readonly value: PackPhase } | { readonly source: "detector"; readonly value: DetectedPhase };
  readonly structures: readonly StructureMatch[];
  readonly observations: readonly StructuralObservation[];
  readonly markers: readonly PivotalMarker[];
  readonly endgame: EndgameReading | null;
  readonly plans: readonly ShapeEntryRef[];
  readonly authored: readonly { readonly id: string; readonly text: string; readonly attribution: string }[];
  readonly sentences: readonly string[];
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
