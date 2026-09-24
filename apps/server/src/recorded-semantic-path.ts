// rfc/recorded-semantic-path §7: the one authenticated, server-owned recorded-path operation.
// It is injected into Review and longitudinal builders so both consume the same sealed event
// identity for the same run/branch. It deliberately has no public raw-evidence REST route.

import { recordedSemanticPath, type RecordedSemanticPathResult } from "@chess-tabiya/runtime";

import { requireRead, type Principal } from "./authorization.js";
import type { RunStorage } from "./storage.js";

export interface RecordedSemanticPathInput {
  readonly principal: Principal;
  readonly runId: string;
  readonly branchId: string;
}

export type CompileRecordedSemanticPath = (input: RecordedSemanticPathInput) => Promise<RecordedSemanticPathResult>;

/**
 * Builds the injected operation over one storage. It authenticates read authority, loads the stored
 * run and delegates unchanged to the pure runtime compiler: callers can supply neither nodes, FENs,
 * UCI strings, event payloads nor evidence.
 */
export function recordedSemanticPathOperation(storage: RunStorage): CompileRecordedSemanticPath {
  return async function compileRecordedSemanticPath(input: RecordedSemanticPathInput): Promise<RecordedSemanticPathResult> {
    const { stored } = requireRead(storage, input.runId, input.principal);
    return recordedSemanticPath(stored.run, input.branchId);
  };
}
