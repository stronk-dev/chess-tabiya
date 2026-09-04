import {
  APPLICATION_OPERATIONS,
  compileApplicationOperations,
  type ApplicationOperationOutcome,
  type StageSettlement,
} from "./contract.js";

compileApplicationOperations(APPLICATION_OPERATIONS);
const settlement: StageSettlement = { kind: "skipped", stageId: "audio", reason: "condition_false" };
const outcome: ApplicationOperationOutcome<string> = { kind: "fallback", value: "text", settlements: [settlement], source: "browser_speech_or_text" };
void outcome;

// @ts-expect-error a stage may not invent an unregistered exchange operation
const invalid: StageSettlement = { kind: "success", stageId: "x", delivery: { operation: "voice.unknown@1", normalizedRequestDigest: "r", generation: "g", payload: "x" } };
void invalid;
