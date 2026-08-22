export type ServerErrorCode =
  | "FORBIDDEN"
  | "UNAUTHENTICATED"
  | "EVIDENCE_RESULT_NOT_FOUND"
  | "EVIDENCE_UNAVAILABLE"
  | "ENGINE_UNAVAILABLE"
  | "INVALID_REQUEST"
  | "FEEDBACK_WITHHELD"
  | "ASSISTANCE_WITHHELD"
  | "VOICE_UNAVAILABLE"
  | "TTS_UNAVAILABLE"
  | "CORPUS_UNAVAILABLE"
  | "TABLEBASE_UNAVAILABLE"
  | "TABLEBASE_OUT_OF_RANGE"
  | "STORY_UNAVAILABLE"
  | "PACK_INVALID"
  | "PERFECT_TABLEBASE_OUT_OF_RANGE"
  | "PACK_NOT_FOUND"
  | "SHAPE_NOT_FOUND"
  | "SHAPE_ID_RESERVED"
  | "SHAPE_VERSION_EXISTS"
  | "SHAPE_VERSION_NOT_INCREASING"
  | "SHAPE_ID_NOT_YOURS"
  | "PACK_UNRESOLVABLE"
  | "PACK_ID_RESERVED"
  | "PACK_VERSION_EXISTS"
  | "PACK_VERSION_NOT_INCREASING"
  | "PACK_ID_NOT_YOURS"
  | "DRAFT_STALE"
  | "PROVENANCE_STATUS_NOT_WRITABLE"
  | "GRADUATION_BLOCKERS_OUTSTANDING"
  | "POLICY_MODE_UNSUPPORTED"
  | "RUN_ALREADY_EXISTS"
  | "RUN_NOT_FOUND"
  | "RATED_GAME_CLOSED"
  | "RATING_BAND_NOT_ON_LADDER"
  | "RATING_OPPONENT_UNCALIBRATED"
  | "RATING_MATERIAL_OUT_OF_RANGE"
  | "STORAGE_FAILURE"
  | "TOO_MANY_BRANCHES"
  | "NO_AUTHORED_VARIATIONS"
  | "GROUP_SEEDS_UNAVAILABLE"
  | "UNKNOWN_GROUP"
  | "SIMULATE_TOO_LARGE"
  | "SIMULATION_EXPIRED"
  | "BOARD_HELD"
  | "MATCH_LIVE"
  | "MATCH_MAINLINE_LOCKED"
  | "LEASE_MOVED"
  | "VOTE_WINDOW_CLOSED"
  | "VOTE_INTAKE_FULL"
  | "ARENA_ROOT_MISMATCH"
  | "IMPORT_INVALID_PGN"
  | "IMPORT_INVALID"
  | "IMPORT_SOURCE_UNSUPPORTED"
  | "IMPORT_SOURCE_NOT_FOUND"
  | "IMPORT_SOURCE_UNAVAILABLE"
  | "REPERTOIRE_NOT_FOUND"
  | "REPERTOIRE_STALE"
  | "REPERTOIRE_IMPORT_LIMIT"
  | "REPERTOIRE_SCAN_UNAVAILABLE"
  | "PRACTICAL_RESISTANCE_OUT_OF_RANGE"
  | "PRACTICAL_RESISTANCE_UNAVAILABLE"
  | "PRACTICAL_RESISTANCE_UNDECIDABLE"
  | "PRACTICAL_RESISTANCE_UNMEASURED"
  | "PRACTICAL_RESISTANCE_POLICY_MASS_INVALID"
  | "TARGET_ELO_REQUIRED"
  | "TARGET_ELO_OUT_OF_RANGE";

export class ServerError extends Error {
  readonly code: ServerErrorCode;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(
    code: ServerErrorCode,
    message: string,
    options?: ErrorOptions & {
      readonly details?: Readonly<Record<string, unknown>>;
    },
  ) {
    const { details, ...errorOptions } = options ?? {};
    super(message, errorOptions);
    this.name = "ServerError";
    this.code = code;
    if (details !== undefined) this.details = Object.freeze({ ...details });
  }
}

export function engineUnavailable(
  engineId: string,
  retryAfterMs: number,
  cause?: Error,
): ServerError {
  return new ServerError("ENGINE_UNAVAILABLE", `Engine unavailable: ${engineId}`, {
    ...(cause === undefined ? {} : { cause }),
    details: { engineId, retryAfterMs },
  });
}

export function policyModeUnsupported(policyMode: string): ServerError {
  return new ServerError(
    "POLICY_MODE_UNSUPPORTED",
    `Policy mode is not supported: ${policyMode}`,
    { details: { policyMode } },
  );
}
