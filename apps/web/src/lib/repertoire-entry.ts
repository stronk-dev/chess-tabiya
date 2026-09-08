export interface RepertoireEntryDecision {
  readonly available: boolean;
  readonly resistance?: "human_common" | "strong_engine";
  readonly label: string;
  readonly reason?: string;
}

export function repertoireEntryDecision(
  policyModes: readonly string[],
  linkedRunId: string | null,
): RepertoireEntryDecision {
  if (linkedRunId !== null) {
    return Object.freeze({ available: true, label: "Open existing gap run" });
  }
  if (policyModes.includes("human_common")) {
    return Object.freeze({ available: true, resistance: "human_common", label: "Enter with human-like resistance" });
  }
  if (policyModes.includes("strong_engine")) {
    return Object.freeze({ available: true, resistance: "strong_engine", label: "Enter with Stockfish resistance" });
  }
  return Object.freeze({
    available: false,
    label: "Gap rehearsal unavailable",
    reason: "This deployment has neither a human-model nor Stockfish opponent available.",
  });
}
