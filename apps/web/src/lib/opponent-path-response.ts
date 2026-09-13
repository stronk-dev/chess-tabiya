import type { GroupReplyResult, PredictionResult, SelectMoveRequest } from "./api.js";
import { parseOpponentSelection } from "./opponent-selection-response.js";

type RecordValue = Readonly<Record<string, unknown>>;

function record(value: unknown, label: string): RecordValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as RecordValue;
}

function exact(value: RecordValue, keys: readonly string[], label: string): void {
  const allowed = new Set(keys);
  if (keys.some((key) => !(key in value)) || Object.keys(value).some((key) => !allowed.has(key))) {
    throw new TypeError(`${label} has an invalid shape`);
  }
}

export function parsePredictionResult(value: unknown, request: SelectMoveRequest): PredictionResult {
  const result = record(value, "prediction-response");
  exact(result, ["selection", "run", "emitted"], "prediction-response");
  if (result.run === null || typeof result.run !== "object" || Array.isArray(result.run)) {
    throw new TypeError("prediction-response/run must be an object");
  }
  if (!Array.isArray(result.emitted)) throw new TypeError("prediction-response/emitted must be an array");
  return Object.freeze({
    selection: parseOpponentSelection(result.selection, request),
    run: result.run,
    emitted: result.emitted,
  }) as unknown as PredictionResult;
}

export function parseGroupReplyResult(value: unknown, request: SelectMoveRequest): GroupReplyResult {
  const result = record(value, "group-reply-response");
  exact(result, ["selection", "reusedFromNodeId"], "group-reply-response");
  if (result.reusedFromNodeId !== null && (typeof result.reusedFromNodeId !== "string" || result.reusedFromNodeId.trim() === "")) {
    throw new TypeError("group-reply-response/reusedFromNodeId must be null or a non-empty string");
  }
  return Object.freeze({
    selection: parseOpponentSelection(result.selection, request),
    reusedFromNodeId: result.reusedFromNodeId,
  }) as GroupReplyResult;
}
