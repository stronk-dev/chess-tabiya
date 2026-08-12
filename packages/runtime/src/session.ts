import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

import { canonicalFen, positionFromFen } from "./chess.js";
import type {
  DrillRun,
  PositionOpponentPolicy,
  RunFeedbackPolicy,
  RunOpponentPolicy,
  RunStart,
} from "./types.js";

export type SessionSource =
  | { readonly kind: "pack"; readonly packId: string; readonly packDigest: string }
  | {
      readonly kind: "position";
      readonly start: RunStart;
      readonly feedbackPolicy: "attempt_end";
      readonly opponentPolicy: PositionOpponentPolicy;
    };

export type CreateRunSession =
  | {
      readonly kind: "pack";
      readonly packId: string;
      readonly packDigest: string;
      readonly start: RunStart;
      readonly feedbackPolicy: Exclude<RunFeedbackPolicy, "attempt_end">;
      readonly opponentPolicy: RunOpponentPolicy;
    }
  | {
      readonly kind: "position";
      readonly start: RunStart;
      readonly feedbackPolicy: "attempt_end";
      readonly opponentPolicy: PositionOpponentPolicy;
    };

export type PackRun = DrillRun & {
  readonly sessionKind: "pack";
  readonly packId: string;
  readonly packDigest: string;
  readonly feedbackPolicy: "delayed_checkpoint" | "segment_end";
};

export function canonicalRunStart(start: RunStart): RunStart {
  return Object.freeze({
    fen: canonicalFen(positionFromFen(start.fen)),
    side: start.side,
  });
}

export function isPackSession(run: DrillRun): run is PackRun {
  return run.sessionKind === "pack" && run.packId !== null && run.packDigest !== null;
}

export function sessionSource(from: DrillRun | CreateRunSession): SessionSource {
  if ("sessionKind" in from) {
    if (from.sessionKind === "pack") {
      if (from.packId === null || from.packDigest === null) {
        throw new TypeError("Pack session requires pack identity");
      }
      return Object.freeze({ kind: "pack", packId: from.packId, packDigest: from.packDigest });
    }
    if (from.opponentPolicy.mode === "theory_strict") {
      throw new TypeError("Position session cannot use theory_strict");
    }
    return Object.freeze({
      kind: "position",
      start: canonicalRunStart(from.start),
      feedbackPolicy: "attempt_end",
      opponentPolicy: Object.freeze({ ...from.opponentPolicy }) as PositionOpponentPolicy,
    });
  }
  if (from.kind === "pack") {
    if (from.packId === "" || from.packDigest === "") {
      throw new TypeError("Pack session requires pack identity");
    }
    return Object.freeze({ kind: "pack", packId: from.packId, packDigest: from.packDigest });
  }
  return Object.freeze({
    kind: "position",
    start: canonicalRunStart(from.start),
    feedbackPolicy: "attempt_end",
    opponentPolicy: Object.freeze({ ...from.opponentPolicy }) as PositionOpponentPolicy,
  });
}

export async function digestSessionSource(source: SessionSource): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalizeJson(source));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
}
