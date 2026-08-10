export type ServerErrorCode =
  | "INVALID_REQUEST"
  | "RUN_ALREADY_EXISTS"
  | "RUN_NOT_FOUND"
  | "STORAGE_FAILURE";

export class ServerError extends Error {
  readonly code: ServerErrorCode;

  constructor(code: ServerErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ServerError";
    this.code = code;
  }
}
