import { unknownNode } from "./errors.js";
import { appendEvents } from "./events.js";
import type { DrillRun, EvidencePayload, MutationResult } from "./types.js";

export function attachEvidence(
  run: DrillRun,
  nodeId: string,
  evidenceRefs: readonly string[],
  payload: EvidencePayload,
  at = new Date().toISOString(),
): MutationResult {
  if (!run.nodes.some((node) => node.id === nodeId)) throw unknownNode(nodeId);
  if (evidenceRefs.length === 0) {
    throw new TypeError("Evidence attachment requires at least one evidence reference");
  }
  const next = appendEvents(run, [
    {
      type: "evidence.attached",
      at,
      data: { nodeId, evidenceRefs, payload },
    },
  ]);
  return { run: next, emitted: next.events.slice(run.events.length) };
}
