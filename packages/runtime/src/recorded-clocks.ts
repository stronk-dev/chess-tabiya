/** Numeric recorded facts. These types and parsers do not authenticate a clock source. */
export type ParsedTimeControl =
  | Readonly<{ kind: "supported"; baseMs: number; incrementMs: number; canonical: string }>
  | Readonly<{ kind: "absent" }>
  | Readonly<{ kind: "invalid"; reason: "syntax" | "unsafe_operand" | "nonpositive_budget" }>
  | Readonly<{ kind: "unsupported"; reason: "unknown" | "unlimited" | "staged_or_other" }>;

export interface RecordedClockMove {
  readonly sourcePly: number;
  readonly side: "white" | "black";
  readonly moveUci: string;
}
export interface RecordedClockSample extends RecordedClockMove { readonly remainingMs: number }
export interface ClockSampleIssue {
  readonly sourcePly: number;
  readonly reason: "invalid_clock" | "duplicate_clock" | "unsupported_precision" | "unsafe_operand" | "unassigned_root_clock";
}
export const RECORDED_CLOCK_USE_ABSTENTION_REASONS = [
  "current_sample_unavailable", "control_absent", "control_invalid", "control_unsupported",
  "previous_same_side_sample_unavailable", "initial_base_unproven", "nonpositive_available",
  "unsafe_arithmetic", "current_exceeds_available",
] as const;
export type RecordedClockUseAbstentionReason = typeof RECORDED_CLOCK_USE_ABSTENTION_REASONS[number];
export type StoredClockDocument =
  | Readonly<{
      version: 1; status: "ready";
      retention: "extracted_before_strip" | "legacy_stored_pgn";
      movetextDigest: string;
      originalNodeIds: readonly string[];
      samples: readonly RecordedClockSample[];
      issues: readonly ClockSampleIssue[];
    }>
  | Readonly<{
      version: 1; status: "unavailable"; retention: "legacy_stored_pgn";
      movetextDigest: string;
      reason: "invalid_stored_pgn" | "original_import_identity_unresolved" | "source_too_large";
    }>;

/** Only the simple declared Fischer form is supported; never infer it from clock samples. */
export function parseDeclaredTimeControl(header: string | undefined): ParsedTimeControl {
  const value = header?.trim() ?? "";
  if (value === "") return Object.freeze({ kind: "absent" });
  if (value === "?") return Object.freeze({ kind: "unsupported", reason: "unknown" });
  if (value === "-") return Object.freeze({ kind: "unsupported", reason: "unlimited" });
  const parts = /^([0-9]+)\+([0-9]+)$/u.exec(value);
  if (parts === null) return Object.freeze(value.includes("+") && !/[/:]/u.test(value)
    ? { kind: "invalid", reason: "syntax" }
    : { kind: "unsupported", reason: "staged_or_other" });
  // BigInt avoids overflow and decimal rounding before the safe-integer check.
  const base = BigInt(parts[1]!), increment = BigInt(parts[2]!);
  const baseMs = base * 1000n, incrementMs = increment * 1000n;
  if (baseMs + incrementMs > BigInt(Number.MAX_SAFE_INTEGER)) return Object.freeze({ kind: "invalid", reason: "unsafe_operand" });
  if (baseMs + incrementMs === 0n) return Object.freeze({ kind: "invalid", reason: "nonpositive_budget" });
  return Object.freeze({ kind: "supported", baseMs: Number(baseMs), incrementMs: Number(incrementMs), canonical: `${base}+${increment}` });
}
