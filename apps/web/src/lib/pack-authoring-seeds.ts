import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

export const INITIAL_POSITION_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function authoringSlug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 48) || "untitled";
}

export function positionTurn(fen: string): "white" | "black" | undefined {
  try { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap().turn === "white" ? "white" : "black"; }
  catch { return undefined; }
}

export function playAuthoringMove(fen: string, uci: string): string | undefined {
  try {
    const chess = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
    const move = parseUci(uci);
    if (move === undefined || !chess.isLegal(move)) return undefined;
    chess.play(move);
    return makeFen(chess.toSetup());
  } catch { return undefined; }
}

function judgementBlockers(): readonly string[] {
  return Object.freeze([
    "AUTHORING TODO: state the intended consequence and replace the placeholder objective.",
    "AUTHORING TODO: play and review the legal authored line, checkpoint, and resistance policy.",
    "AUTHORING TODO: attach sources and attribution for every chess claim before publication.",
  ]);
}

export function positionPackScaffold(input: {
  readonly title: string;
  readonly fen: string;
  readonly side: "white" | "black";
  readonly suffix: string;
}): DrillPackDefinition {
  return {
    id: `${authoringSlug(input.title)}-${authoringSlug(input.suffix)}`,
    version: "0.1.0",
    title: input.title.trim(),
    mode: "line",
    start: { fen: input.fen.trim(), side: input.side },
    objective: { type: "play_until_checkpoint", summary: "AUTHORING TODO: describe the consequence this rehearsal should reach." },
    checkpoints: [{ id: "author-checkpoint", label: "AUTHORING TODO: choose the first meaningful checkpoint", trigger: { atPly: 1 }, actions: [] }],
    opponentPolicy: { mode: "human_common", targetElo: 1800 },
    feedbackPolicy: "delayed_checkpoint",
    provenance: {
      reviewStatus: "draft",
      sources: ["AUTHORING TODO: record the source of this position and every authored chess claim."],
      licence: "CC-BY-SA-4.0",
      attribution: [],
      graduationBlockers: [...judgementBlockers()],
    },
  };
}

export function clonePackForAuthoring(value: unknown, suffix: string): DrillPackDefinition {
  const source = structuredClone(value) as DrillPackDefinition;
  const raw = source as unknown as Record<string, unknown>;
  const provenance = structuredClone(raw.provenance ?? {}) as Record<string, unknown>;
  const existing = Array.isArray(provenance.graduationBlockers) ? provenance.graduationBlockers : [];
  raw.id = `${authoringSlug(String(raw.id ?? "pack"))}-copy-${authoringSlug(suffix)}`;
  raw.version = "0.1.0";
  raw.title = `${String(raw.title ?? "Untitled pack")} — copy`;
  raw.provenance = {
    ...provenance,
    reviewStatus: "draft",
    graduationBlockers: [...existing, "AUTHORING TODO: review every copied move, claim, source, and grading rule before publication."],
  };
  return source;
}
