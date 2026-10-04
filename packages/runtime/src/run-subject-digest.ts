// rfc/provider-exchange-and-execution.md §2: the sole byte authority for run subjects.
import { assertRunEventImage } from "@chess-tabiya/schema/run-event";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "./chess.js";
import { projectRun } from "./events.js";
import { exactMoveIdentity } from "./legal-moves.js";
import { canonicalProviderJson, digestProviderSourceBytes, providerUtf8, PROVIDER_DIGEST_PATTERN } from "./provider-digest.js";
import type { DrillRunEvent, EvidenceAttachedEvent } from "./types.js";

export type RunEventHeadDigest = string & { readonly __runEventHeadDigest: unique symbol };
export type RunEvidenceItemDigest = string & { readonly __runEvidenceItemDigest: unique symbol };
export type RunSubjectDigest = string & { readonly __runSubjectDigest: unique symbol };

export type EvidenceAvailabilitySubjectRef =
  | Readonly<{ kind: "run_prefix"; runId: string; eventHeadDigest: RunEventHeadDigest }>
  | Readonly<{ kind: "run_node"; runId: string; eventHeadDigest: RunEventHeadDigest; branchId: string; nodeId: string }>
  | Readonly<{ kind: "run_edge"; runId: string; eventHeadDigest: RunEventHeadDigest; branchId: string; beforeNodeId: string; afterNodeId: string; moveEventSeq: number }>;
export type EvidenceAvailabilitySubject =
  | Extract<EvidenceAvailabilitySubjectRef, { kind: "run_prefix" }>
  | (Extract<EvidenceAvailabilitySubjectRef, { kind: "run_node" }> & Readonly<{ fen: string }>)
  | (Extract<EvidenceAvailabilitySubjectRef, { kind: "run_edge" }> & Readonly<{ beforeFen: string; moveUci: string; afterFen: string }>);

function closed(value: unknown, keys: readonly string[]): asserts value is Record<string, unknown> {
  canonicalProviderJson(value); // Refuse non-JSON values rather than silently dropping them.
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) {
    throw new TypeError(`Run image must contain exactly ${keys.join(", ")}`);
  }
}
function id(value: unknown): asserts value is string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError("Run identity must be a non-empty string");
}
function digest(value: unknown): asserts value is string {
  if (typeof value !== "string" || !PROVIDER_DIGEST_PATTERN.test(value)) throw new TypeError("Invalid run digest");
}
function sequence(value: unknown): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) throw new TypeError("Run sequence must be a positive safe integer");
}
function hash(domain: "run.event_head.v1" | "run.evidence_item.v1" | "run.subject.v1", image: unknown): string {
  return digestProviderSourceBytes([providerUtf8(`tabiya/${domain}\u0000`), providerUtf8(canonicalProviderJson(image))]);
}

/** Validate every supplied event, including corrupt sequences beyond a requested historical cut. */
export function assertRunEventSequence(runId: string, events: readonly DrillRunEvent[]): void {
  id(runId);
  canonicalProviderJson(events);
  if (!Array.isArray(events) || events.length === 0) throw new TypeError("A run head cannot be empty");
  for (const [index, event] of events.entries()) {
    assertRunEventImage(event);
    if (event.seq !== index + 1) throw new TypeError("Run events must be contiguous and one-based");
  }
  if (events[0]?.type !== "run.started" || events[0].data.id !== runId) throw new TypeError("Run head start identity mismatch");
  projectRun(events); // State-machine invariants are not replaced by JSON-schema admission.
}

export function digestRunEventHead(image: Readonly<{ runId: string; headSeq: number; events: readonly DrillRunEvent[] }>): RunEventHeadDigest {
  closed(image, ["runId", "headSeq", "events"]);
  sequence(image.headSeq);
  assertRunEventSequence(image.runId, image.events);
  if (image.headSeq > image.events.length) throw new TypeError("Run head is in the future");
  return hash("run.event_head.v1", { runId: image.runId, headSeq: image.headSeq, events: image.events.slice(0, image.headSeq) }) as RunEventHeadDigest;
}

/** Historical lookup returns a cut, not another wire constructor or a caller-authored prefix. */
export function resolveRunEventHead(image: Readonly<{ runId: string; eventHeadDigest: RunEventHeadDigest; events: readonly DrillRunEvent[] }>): number {
  closed(image, ["runId", "eventHeadDigest", "events"]);
  digest(image.eventHeadDigest);
  assertRunEventSequence(image.runId, image.events);
  const matches: number[] = [];
  for (let headSeq = 1; headSeq <= image.events.length; headSeq += 1) {
    if (hash("run.event_head.v1", { runId: image.runId, headSeq, events: image.events.slice(0, headSeq) }) === image.eventHeadDigest) matches.push(headSeq);
  }
  if (matches.length !== 1) throw new TypeError("Run subject head is absent or ambiguous");
  return matches[0]!;
}

/**
 * Hash a complete evidence event, not its payload alone. This byte constructor is not access
 * authority: resolveRunEvidenceItem proves membership/ordering in the authorized selected head.
 */
export function digestRunEvidenceItem(image: Readonly<{ runId: string; eventHeadDigest: RunEventHeadDigest; eventSeq: number; event: EvidenceAttachedEvent }>): RunEvidenceItemDigest {
  closed(image, ["runId", "eventHeadDigest", "eventSeq", "event"]);
  id(image.runId); digest(image.eventHeadDigest); sequence(image.eventSeq);
  assertRunEventImage(image.event);
  if (image.event.type !== "evidence.attached" || image.event.seq !== image.eventSeq) throw new TypeError("Evidence item sequence/type mismatch");
  return hash("run.evidence_item.v1", image) as RunEvidenceItemDigest;
}

function subjectKeys(kind: unknown): readonly string[] {
  const common = ["kind", "runId", "eventHeadDigest"];
  if (kind === "run_prefix") return common;
  if (kind === "run_node") return [...common, "branchId", "nodeId"];
  if (kind === "run_edge") return [...common, "branchId", "beforeNodeId", "afterNodeId", "moveEventSeq"];
  throw new TypeError("Unknown run subject kind");
}

/** Wire parser only. A syntactically branded digest is never a resolved subject or access grant. */
export function parseRunSubjectRef(value: unknown): EvidenceAvailabilitySubjectRef {
  const kind = value !== null && typeof value === "object" ? (value as Record<string, unknown>).kind : undefined;
  closed(value, subjectKeys(kind));
  id(value.runId); digest(value.eventHeadDigest);
  if (kind !== "run_prefix") id(value.branchId);
  if (kind === "run_node") id(value.nodeId);
  if (kind === "run_edge") { id(value.beforeNodeId); id(value.afterNodeId); sequence(value.moveEventSeq); }
  return Object.freeze({ ...value }) as EvidenceAvailabilitySubjectRef;
}

export function digestRunSubject(image: Readonly<{ subject: EvidenceAvailabilitySubject }>): RunSubjectDigest {
  closed(image, ["subject"]);
  const subject = image.subject;
  const keys = subjectKeys(subject?.kind);
  closed(subject, subject.kind === "run_node" ? [...keys, "fen"] : subject.kind === "run_edge" ? [...keys, "beforeFen", "moveUci", "afterFen"] : keys);
  parseRunSubjectRef(Object.fromEntries(keys.map((key) => [key, (subject as unknown as Record<string, unknown>)[key]])));
  if (subject.kind === "run_node") {
    if (canonicalFen(positionFromFen(subject.fen)) !== subject.fen) throw new TypeError("Subject FEN is not canonical");
  } else if (subject.kind === "run_edge") {
    const position = positionFromFen(subject.beforeFen);
    if (canonicalFen(position) !== subject.beforeFen || exactMoveIdentity(subject.beforeFen, subject.moveUci) !== subject.moveUci) throw new TypeError("Subject edge is not canonical");
    const move = parseUci(subject.moveUci);
    if (move === undefined || !position.isLegal(normalizeMove(position, move))) throw new TypeError("Subject edge move is illegal");
    position.play(normalizeMove(position, move));
    if (canonicalFen(position) !== subject.afterFen) throw new TypeError("Subject edge FEN does not follow its move");
  }
  return hash("run.subject.v1", image) as RunSubjectDigest;
}
