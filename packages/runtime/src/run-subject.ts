// rfc/provider-exchange-and-execution.md §2: pure exact-history resolution. The server calls
// requireRead before invoking this authority. No cache, provider, active cursor or caller FEN is read.
import { resolveBranchPath } from "./branch-path.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import { projectRun } from "./events.js";
import { recordedEdgePayload } from "./recorded-edge.js";
import {
  digestRunEvidenceItem, digestRunSubject, parseRunSubjectRef, resolveRunEventHead,
  type EvidenceAvailabilitySubject, type EvidenceAvailabilitySubjectRef,
  type RunEvidenceItemDigest, type RunSubjectDigest,
} from "./run-subject-digest.js";
import type { DrillRun, EvidenceAttachedEvent } from "./types.js";
export * from "./run-subject-digest.js";

declare const resolvedBrand: unique symbol;
export interface ResolvedRunSubject {
  readonly [resolvedBrand]: true;
  readonly subject: EvidenceAvailabilitySubject;
  readonly subjectDigest: RunSubjectDigest;
  readonly headSeq: number;
  /** Frozen projection of precisely the selected prefix, not the current stored snapshot. */
  readonly run: DrillRun;
}
const admitted = new WeakSet<object>();
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
export function assertResolvedRunSubject(value: ResolvedRunSubject): void {
  if (value === null || typeof value !== "object" || !admitted.has(value)) throw new TypeError("Unresolved run subject");
}

export function resolveRunSubject(storedRun: DrillRun, requested: EvidenceAvailabilitySubjectRef): ResolvedRunSubject {
  const ref = parseRunSubjectRef(requested);
  const events = structuredClone(storedRun.events);
  if (ref.runId !== storedRun.id) throw new TypeError("Run subject identity mismatch");
  const headSeq = resolveRunEventHead({ runId: storedRun.id, eventHeadDigest: ref.eventHeadDigest, events });
  const run = freeze(projectRun(events.slice(0, headSeq)));
  let subject: EvidenceAvailabilitySubject;
  if (ref.kind === "run_prefix") {
    subject = ref;
  } else {
    const path = resolveBranchPath(run, ref.branchId);
    if (path.kind !== "resolved") throw new TypeError("Run subject branch does not resolve");
    if (ref.kind === "run_node") {
      const node = path.nodes.find((node) => node.id === ref.nodeId);
      if (node === undefined || canonicalFen(positionFromFen(node.fen)) !== node.fen) throw new TypeError("Run subject node is absent or noncanonical");
      subject = Object.freeze({ ...ref, fen: node.fen });
    } else {
      const event = run.events[ref.moveEventSeq - 1];
      const before = path.nodes.find((node) => node.id === ref.beforeNodeId);
      const after = path.nodes.find((node) => node.id === ref.afterNodeId);
      if (event?.type !== "move.committed" || event.data.node.id !== ref.afterNodeId ||
          event.data.node.branchId !== ref.branchId || event.data.node.parentId !== ref.beforeNodeId ||
          before === undefined || after === undefined) throw new TypeError("Run subject edge identity mismatch");
      const edge = recordedEdgePayload(run, before, after);
      subject = Object.freeze({ ...ref, beforeFen: edge.beforeFen, moveUci: edge.moveUci, afterFen: edge.afterFen });
    }
  }
  const result = freeze({ subject, subjectDigest: digestRunSubject({ subject }), headSeq, run }) as ResolvedRunSubject;
  admitted.add(result);
  return result;
}

/** Only events in this sealed prefix participate, including the whole attachment envelope. */
export function resolveRunEvidenceItem(resolved: ResolvedRunSubject, itemDigest: RunEvidenceItemDigest): EvidenceAttachedEvent {
  assertResolvedRunSubject(resolved);
  const matches = resolved.run.events.filter((event): event is EvidenceAttachedEvent => event.type === "evidence.attached")
    .filter((event) => digestRunEvidenceItem({ runId: resolved.run.id, eventHeadDigest: resolved.subject.eventHeadDigest, eventSeq: event.seq, event }) === itemDigest);
  if (matches.length !== 1) throw new TypeError("Run evidence item is absent or ambiguous at this head");
  return matches[0]!;
}
