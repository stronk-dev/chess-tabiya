// Module registration §2.5.2: metadata-only whole-branch planning. These values are not
// evidence, access grants or presentation receipts. Collection still requires its original
// storage-owned boundary and the service's live authorization.
import { assistanceDigest } from "./assistance-exchange-digest.js";
import { readRecordedReviewBoundary, type RecordedReviewBoundary } from "./recorded-review-boundary.js";

export interface ModuleReviewCursor {
  readonly afterEventSeq: number;
  readonly afterBranchId: string;
  readonly afterNodeId: string;
}
export interface ModuleReviewSubject {
  readonly id: string;
  readonly nodeId: string;
  readonly fromNodeId: string | null;
  readonly creationEventSeq: number;
  /** Original node's branch; inherited nodes keep their original identity. */
  readonly sourceBranchId: string;
  readonly cursor: ModuleReviewCursor;
}
export interface ModuleReviewPrefixPlan {
  readonly runId: string;
  readonly branchId: string;
  readonly eventHeadSeq: number;
  readonly orderedSubjectIds: readonly string[];
  readonly prefixDigest: string;
  readonly subjects: readonly ModuleReviewSubject[];
}

/** Resolve the full original recorded branch, without semantic collection or provider work. */
export function planModuleReviewPrefix(boundary: RecordedReviewBoundary): ModuleReviewPrefixPlan {
  const image = readRecordedReviewBoundary(boundary);
  if (image.path.length !== image.originalPath.length
    || image.request.throughNodeId !== image.originalPath.at(-1)!.node.id) {
    throw new TypeError("MODULE_REVIEW_PREFIX_STALE: Review jobs require the complete original branch");
  }
  const branchId = image.request.branchId;
  const subjects = Object.freeze(image.originalPath.map((entry, index): ModuleReviewSubject => {
    const { node, creationEvent } = entry;
    return Object.freeze({
      id: JSON.stringify([branchId, node.id, creationEvent.seq]),
      nodeId: node.id,
      fromNodeId: index === 0 ? null : image.originalPath[index - 1]!.node.id,
      creationEventSeq: creationEvent.seq,
      sourceBranchId: node.branchId,
      cursor: Object.freeze({ afterEventSeq: creationEvent.seq, afterBranchId: branchId, afterNodeId: node.id }),
    });
  }));
  const orderedSubjectIds = Object.freeze(subjects.map(subject => subject.id));
  const prefix = { runId: image.run.id, eventHeadSeq: image.eventHead.seq, orderedSubjectIds };
  return Object.freeze({ ...prefix, branchId, subjects, prefixDigest: assistanceDigest(prefix) });
}

/** Pure metadata slicing. A job owner must additionally enforce its exact expected cursor. */
export function moduleReviewPrefixPage(plan: ModuleReviewPrefixPlan, cursor: ModuleReviewCursor | undefined, limit: number): Readonly<{
  subjects: readonly ModuleReviewSubject[];
  nextCursor: ModuleReviewCursor | null;
  complete: boolean;
}> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 32) {
    throw new TypeError("MODULE_QUERY_INVALID: Review page limit must be an integer from 1 to 32");
  }
  let start = 0;
  if (cursor !== undefined) {
    const index = plan.subjects.findIndex(subject => subject.cursor.afterEventSeq === cursor.afterEventSeq
      && subject.cursor.afterBranchId === cursor.afterBranchId && subject.cursor.afterNodeId === cursor.afterNodeId);
    if (index < 0) throw new TypeError("MODULE_REVIEW_PREFIX_STALE: cursor does not address an original subject");
    start = index + 1;
    if (start === plan.subjects.length) throw new TypeError("MODULE_REVIEW_PREFIX_STALE: completed prefix has no continuation");
  }
  const subjects = Object.freeze(plan.subjects.slice(start, start + limit));
  const complete = start + subjects.length === plan.subjects.length;
  return Object.freeze({ subjects, nextCursor: complete ? null : subjects.at(-1)!.cursor, complete });
}
