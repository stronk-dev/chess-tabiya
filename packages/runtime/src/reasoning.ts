import type { ReasoningKeyPoint } from "@chess-tabiya/schema/drill-pack";
import { parseSan } from "chessops/san";
import { makeUci, parseUci } from "chessops/util";

import { positionFromFen } from "./chess.js";
import type { ReasoningDetection, ReasoningTranscript } from "./types.js";

const MOVE_TOKEN = /(?:\b[a-h][1-8][a-h][1-8][qrbn]?\b)|(?:\b(?:O-O(?:-O)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?)\b)/g;

export function normalizeReasoningText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replaceAll(/\s+/g, " ").trim();
}

function moveUci(token: string, fen: string): string | undefined {
  const position = positionFromFen(fen);
  const uci = parseUci(token.toLowerCase());
  if (uci !== undefined && position.isLegal(uci)) return makeUci(uci);
  const san = parseSan(position, token);
  return san === undefined ? undefined : makeUci(san);
}

function literalSpan(text: string, phrase: string): { readonly start: number; readonly end: number } | undefined {
  const escaped = phrase.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|[^\\p{L}\\p{N}_])(${escaped})(?=$|[^\\p{L}\\p{N}_])`, "iu").exec(text);
  if (match?.index === undefined || match[1] === undefined) return undefined;
  const prefix = match[0].indexOf(match[1]);
  return Object.freeze({ start: match.index + prefix, end: match.index + prefix + match[1].length });
}

function fields(transcript: ReasoningTranscript): readonly { readonly field: "candidates" | "plan" | "fears"; readonly index: number | null; readonly text: string }[] {
  return Object.freeze([
    ...transcript.candidates.map((text, index) => ({ field: "candidates" as const, index, text: normalizeReasoningText(text) })),
    { field: "plan" as const, index: null, text: normalizeReasoningText(transcript.plan) },
    { field: "fears" as const, index: null, text: normalizeReasoningText(transcript.fears) },
  ]);
}

export function matchKeyPoints(
  keyPoints: readonly ReasoningKeyPoint[],
  transcript: ReasoningTranscript,
  checkpointFen: string,
): readonly ReasoningDetection[] {
  const transcriptFields = fields(transcript);
  return Object.freeze(keyPoints.map((point) => {
    for (const phraseValue of point.phrases) {
      const phrase = normalizeReasoningText(phraseValue);
      const phraseMove = moveUci(phraseValue, checkpointFen);
      for (const candidate of transcriptFields) {
        if (phraseMove !== undefined) {
          for (const match of candidate.text.matchAll(MOVE_TOKEN)) {
            if (moveUci(match[0], checkpointFen) === phraseMove) {
              return Object.freeze({ keyPointId: point.id, status: "detected" as const, match: Object.freeze({ field: candidate.field, index: candidate.index, start: match.index, end: match.index + match[0].length }) });
            }
          }
        } else {
          const span = literalSpan(candidate.text, phrase);
          if (span !== undefined) return Object.freeze({ keyPointId: point.id, status: "detected" as const, match: Object.freeze({ field: candidate.field, index: candidate.index, ...span }) });
        }
      }
    }
    return Object.freeze({ keyPointId: point.id, status: "not_detected" as const });
  }));
}
