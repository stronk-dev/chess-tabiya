// The production access boundary for provider-exchange §2. There is deliberately no provider or
// cache argument: missing/crossed/unauthorized run identity must settle before source state is read.
import {
  parseRunSubjectRef, resolveRunEvidenceItem, resolveRunSubject,
  type EvidenceAvailabilitySubjectRef, type ResolvedRunSubject, type RunEvidenceItemDigest,
} from "@chess-tabiya/runtime/run-subject";
import { requireRead, type Principal } from "./authorization.js";
import { ServerError } from "./errors.js";
import type { RunStorage } from "./storage.js";

export function requireRunSubject(storage: RunStorage, principal: Principal, requested: EvidenceAvailabilitySubjectRef): ResolvedRunSubject {
  let ref: EvidenceAvailabilitySubjectRef;
  try { ref = parseRunSubjectRef(requested); }
  catch { throw new ServerError("INVALID_REQUEST", "Invalid run subject reference"); }
  const { stored } = requireRead(storage, ref.runId, principal);
  try { return resolveRunSubject(stored.run, ref); }
  catch { throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${ref.runId}`); }
}

export function requireRunEvidenceItem(storage: RunStorage, principal: Principal, requested: EvidenceAvailabilitySubjectRef, itemDigest: RunEvidenceItemDigest) {
  const resolved = requireRunSubject(storage, principal, requested);
  try { return resolveRunEvidenceItem(resolved, itemDigest); }
  catch { throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${resolved.run.id}`); }
}
