import { RuntimeError, assertActiveWriter } from "@chess-tabiya/runtime";

import { ServerError } from "./errors.js";
import { runRoleMayWrite } from "./storage.js";
import type {
  LeaseHolder,
  RunRole,
  RunStorage,
  StoredRun,
} from "./storage.js";

export interface Principal {
  readonly learnerId: string;
  readonly handle: string;
}

export function mayRead(_role: RunRole): boolean {
  return true;
}

export function mayWrite(role: RunRole): boolean {
  return runRoleMayWrite(role);
}

export function mayManageGrants(role: RunRole): boolean {
  return role === "host";
}

export function mayPropose(role: RunRole): boolean {
  return role === "host" || role === "participant";
}

export function mayVote(_role: RunRole): boolean {
  return true;
}

export function mayControlSession(role: RunRole): boolean {
  return role === "host";
}

export function requireRead(
  storage: RunStorage,
  runId: string,
  principal: Principal,
): { readonly stored: StoredRun; readonly role: RunRole } {
  const role = storage.runRole(runId, principal.learnerId);
  const stored = storage.read(runId);
  if (role === undefined || stored === undefined) {
    throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${runId}`);
  }
  return Object.freeze({ stored, role });
}

export function requireWrite(
  storage: RunStorage,
  runId: string,
  principal: Principal,
  writerId: string,
): { readonly stored: StoredRun; readonly role: RunRole; readonly lease: LeaseHolder } {
  const access = requireRead(storage, runId, principal);
  if (!mayWrite(access.role)) {
    throw new ServerError("FORBIDDEN", "This learner may not write this run");
  }
  if (access.stored.activeWriterLearnerId !== principal.learnerId) {
    throw new RuntimeError(
      "NOT_ACTIVE_WRITER",
      "This learner does not hold the run lease",
    );
  }
  assertActiveWriter(access.stored.activeWriterId, writerId);
  return Object.freeze({
    ...access,
    lease: Object.freeze({ writerId, learnerId: principal.learnerId }),
  });
}
