// Pure reuse of the existing event digest, not a source/permission decision or a new format.
import { evidenceDigest } from "../evidence-contract.js";
import type { DrillRun } from "../types.js";
import { deeplyImmutableJson } from "./immutable-json.js";

const digests = new WeakMap<DrillRun["events"], string>();
export function recordedEventDigest(events: DrillRun["events"]): string {
  const previous = digests.get(events);
  if (previous !== undefined) return previous;
  const digest = evidenceDigest(events);
  if (deeplyImmutableJson(events)) digests.set(events, digest);
  return digest;
}
