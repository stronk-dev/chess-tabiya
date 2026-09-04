import { CHECK_TUPLES, generateStorageOperationId, type PassedStorageCheck, type StorageOperationId } from "./contract.js";

const operationId: StorageOperationId = generateStorageOperationId(new Uint8Array(16));
const checks: typeof CHECK_TUPLES.prepare_fresh = ["compatibility"];
void operationId;
void checks;

// @ts-expect-error readiness cannot be inserted into prepare-fresh
const invalidPrepare: typeof CHECK_TUPLES.prepare_fresh = ["compatibility", "readiness"];
void invalidPrepare;

// @ts-expect-error a plain string is not a parsed operation id
const invalidId: StorageOperationId = "backup-1";
void invalidId;

// @ts-expect-error callers cannot omit an operand digest from a passed result
const invalidCheck: PassedStorageCheck = { operationId, check: "digest", passed: true };
void invalidCheck;
