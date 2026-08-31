const BARE_UCI_MOVE = /^[a-h][1-8][a-h][1-8][qrbn]?$/u;

/**
 * Ordinary learner surfaces speak SAN. A missing or malformed SAN value must
 * fail closed to honest copy instead of exposing the runtime's UCI identity.
 */
export function learnerMoveLabel(
  san: string | null | undefined,
  fallback = "Move notation unavailable",
): string {
  const candidate = san?.trim();
  if (candidate === undefined || candidate === "" || BARE_UCI_MOVE.test(candidate)) {
    return fallback;
  }
  return candidate;
}
