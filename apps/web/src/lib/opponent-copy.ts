import { BOT_FAMILY_LABELS, type RunOpponentPolicy } from "@chess-tabiya/runtime/client";

export const HUMAN_MODEL_RUNG_DISCLAIMER =
  "Maia band numbers are model settings. They are not FIDE, Lichess, or Chess.com ratings. A bot's strength is shown only after that exact profile is measured.";

export function opponentStatus(
  mode: "human_common" | "strong_engine" | string,
  targetElo?: number,
): string {
  if (mode === "strong_engine") return "Engine test · outside the human-like ladder";
  if (mode !== "human_common") return "Specialized resistance";
  return targetElo === undefined
    ? "Human-move model · band not recorded"
    : `Human-move model · band ${targetElo}`;
}

export function humanModelMaterialLimit(
  fen: string,
  mode: string,
): string | undefined {
  if (mode !== "human_common") return undefined;
  const placement = fen.split(" ", 1)[0] ?? "";
  const pieces = [...placement].filter((token) => /[prnbqk]/iu.test(token)).length;
  return pieces <= 10
    ? "With ten pieces or fewer, changing the Maia rung has very little effect; endgame choices converge."
    : undefined;
}

/**
 * The in-run identity of a run's opponent. A bot-profile run names its exact catalogue member by
 * the runtime's family label and model band (the same words its card title uses); owner display
 * names are not chosen yet (D1610), so no persona name is invented.
 */
export function runOpponentStatus(policy: Pick<RunOpponentPolicy, "mode" | "targetElo" | "profile">, sessionMode?: RunOpponentPolicy["mode"]): string {
  // The in-memory recovery carries a mode, not the current selection's band/profile receipt.
  // Name that mode without borrowing the recorded policy's band or calibrated identity.
  if (sessionMode !== undefined) return sessionMode === "human_common"
    ? "Human-move model · this session" : opponentStatus(sessionMode);
  if (policy.profile !== undefined) return `Bot · ${BOT_FAMILY_LABELS[policy.profile.family]} · model band ${policy.profile.band}`;
  return opponentStatus(policy.mode, policy.targetElo);
}
