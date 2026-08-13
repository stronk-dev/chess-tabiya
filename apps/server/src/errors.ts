export type ServerErrorCode =
  | "FORBIDDEN"
  | "UNAUTHENTICATED"
  | "EVIDENCE_RESULT_NOT_FOUND"
  | "EVIDENCE_UNAVAILABLE"
  | "ENGINE_UNAVAILABLE"
  | "INVALID_REQUEST"
  | "FEEDBACK_WITHHELD"
  | "PACK_INVALID"
  | "PACK_NOT_FOUND"
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
  | "STORAGE_FAILURE";

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
