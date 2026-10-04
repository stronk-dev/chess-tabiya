import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { INITIAL_FEN } from "chessops/fen";
import { appendEvents, commitMove, createRun, fork, rewind, type DrillRun, type DrillRunEvent, type EvidenceAttachedEvent } from "./index.js";
import {
  assertResolvedRunSubject, digestRunEventHead, digestRunEvidenceItem, digestRunSubject,
  parseRunSubjectRef, resolveRunEvidenceItem, resolveRunSubject, resolveRunEventHead,
  type EvidenceAvailabilitySubject, type EvidenceAvailabilitySubjectRef, type ResolvedRunSubject,
} from "./run-subject.js";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

const at = "2026-10-04T10:00:00.000Z";
function run(): DrillRun {
  return createRun({ id: "run-subject", packId: "pack", packDigest: `sha256:${"a".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    startFen: INITIAL_FEN, seed: 1, createdAt: at });
}
function head(run: DrillRun, headSeq = run.events.length) {
  return digestRunEventHead({ runId: run.id, headSeq, events: run.events });
}
function reference(run: DrillRun, headSeq = run.events.length): EvidenceAvailabilitySubjectRef {
  return { kind: "run_prefix", runId: run.id, eventHeadDigest: head(run, headSeq) };
}
function expected(domain: string, image: unknown): string {
  return `sha256:${createHash("sha256").update(`tabiya/${domain}\u0000`).update(canonicalizeJson(image)).digest("hex")}`;
}
function evidence(run: DrillRun): DrillRun {
  return appendEvents(run, [{ type: "evidence.attached", at, data: {
    nodeId: run.activeCursor.nodeId, evidenceRefs: ["eval"],
    payload: { kind: "eval", source: "engine_validated", values: { centipawns: 31 } },
  } }]);
}

describe("exact run subject byte and occurrence authority", () => {
  it("agrees with independent SHA-256/RFC-8785 vectors for all three domains", () => {
    const current = evidence(commitMove(run(), "e2e4", { at }).run);
    const eventHeadDigest = head(current);
    expect(eventHeadDigest).toBe(expected("run.event_head.v1", { runId: current.id, headSeq: current.events.length, events: current.events }));
    const event = current.events.at(-1)! as EvidenceAttachedEvent;
    const item = { runId: current.id, eventHeadDigest, eventSeq: event.seq, event };
    expect(digestRunEvidenceItem(item)).toBe(expected("run.evidence_item.v1", item));
    const resolved = resolveRunSubject(current, reference(current));
    expect(resolved.subjectDigest).toBe(expected("run.subject.v1", { subject: resolved.subject }));
    expect(eventHeadDigest).not.toBe(resolved.subjectDigest);
    for (const [index] of current.events.entries()) expect(resolveRunEventHead({ runId: current.id, events: current.events, eventHeadDigest: head(current, index + 1) })).toBe(index + 1);
  });

  it("historical identity is independent of appended future events and the current cursor", () => {
    const initial = run();
    const moved = commitMove(initial, "e2e4", { at }).run;
    const current = commitMove(moved, "e7e5", { at }).run;
    expect(head(current, 1)).toBe(head(initial));
    const ref = { kind: "run_node" as const, runId: current.id, eventHeadDigest: head(current, 2), branchId: moved.activeCursor.branchId, nodeId: moved.activeCursor.nodeId };
    const resolved = resolveRunSubject(current, ref);
    expect(resolved.run.events).toHaveLength(2);
    expect(resolved.subject).toEqual({ ...ref, fen: moved.nodes.at(-1)!.fen });
    expect(resolved.run.activeCursor).toEqual(moved.activeCursor);
    expect(() => resolveRunSubject(current, { ...ref, nodeId: current.activeCursor.nodeId })).toThrow();
    expect(Object.isFrozen(resolved.run.events[0]!.data)).toBe(true);
  });

  it("equal positions and equal UCI retain distinct branch/node/event occurrence identities", () => {
    const initial = run();
    const first = commitMove(initial, "e2e4", { at }).run;
    const firstNode = first.nodes.at(-1)!;
    const forked = fork(rewind(first, initial.activeCursor.nodeId, at).run, initial.activeCursor.nodeId, { label: "alternative", at }).run;
    const second = commitMove(forked, "e2e4", { at }).run;
    const secondNode = second.nodes.at(-1)!;
    expect(firstNode.fen).toBe(secondNode.fen);
    const makeRef = (node: typeof firstNode) => ({ kind: "run_edge" as const, runId: second.id, eventHeadDigest: head(second), branchId: node.branchId, beforeNodeId: initial.activeCursor.nodeId, afterNodeId: node.id, moveEventSeq: second.events.find(e => e.type === "move.committed" && e.data.node.id === node.id)!.seq });
    const left = resolveRunSubject(second, makeRef(firstNode));
    const right = resolveRunSubject(second, makeRef(secondNode));
    expect(left.subjectDigest).not.toBe(right.subjectDigest);
    expect(() => resolveRunSubject(second, { ...makeRef(secondNode), moveEventSeq: makeRef(firstNode).moveEventSeq })).toThrow();
    expect(() => resolveRunSubject(second, { ...makeRef(firstNode), branchId: secondNode.branchId })).toThrow();
    const historical = { ...makeRef(secondNode), eventHeadDigest: head(first) };
    expect(() => resolveRunSubject(second, historical)).toThrow();
  });

  it("binds an attachment to its exact envelope, sequence, run and selected head", () => {
    const attached = evidence(run());
    const current = commitMove(attached, "e2e4", { at }).run;
    const event = attached.events.at(-1)! as EvidenceAttachedEvent;
    const selected = resolveRunSubject(current, reference(current, attached.events.length));
    const image = { runId: attached.id, eventHeadDigest: selected.subject.eventHeadDigest, eventSeq: event.seq, event };
    const item = digestRunEvidenceItem(image);
    expect(resolveRunEvidenceItem(selected, item)).toEqual(event);
    expect(() => resolveRunEvidenceItem(resolveRunSubject(current, reference(current)), item)).toThrow();
    expect(() => resolveRunEvidenceItem(resolveRunSubject(current, reference(current, 1)), item)).toThrow();
    expect(digestRunEvidenceItem({ ...image, runId: "another-run" })).not.toBe(item);
    expect(digestRunEvidenceItem({ ...image, event: { ...event, at: "2026-10-04T10:01:00.000Z" } })).not.toBe(item);
    expect(() => digestRunEvidenceItem({ ...image, eventSeq: 1 })).toThrow();
  });

  it("refuses empty/future heads, crossed runs, malformed sequences and complete nested-image corruption", () => {
    const initial = run();
    for (const headSeq of [0, 2, 1.5, NaN]) expect(() => head(initial, headSeq)).toThrow();
    expect(() => digestRunEventHead({ runId: initial.id, headSeq: 1, events: [] })).toThrow();
    expect(() => resolveRunSubject(initial, { ...reference(initial), runId: "another-run" })).toThrow();
    expect(() => resolveRunSubject(initial, { ...reference(initial), eventHeadDigest: `sha256:${"0".repeat(64)}` as ReturnType<typeof head> })).toThrow();
    const moved = commitMove(initial, "e2e4", { at }).run;
    for (const corrupt of [
      [{ ...initial.events[0]!, seq: 2 }],
      [initial.events[0]!, { ...moved.events[1]!, seq: 1 }],
      [{ ...initial.events[0]!, at: "not-a-timestamp" }],
      [{ ...initial.events[0]!, extra: true }],
      [{ ...initial.events[0]!, data: { ...initial.events[0]!.data, unexpected: true } }],
      [{ ...initial.events[0]!, data: { ...initial.events[0]!.data, rootNode: { ...(initial.events[0] as Extract<DrillRunEvent, { type: "run.started" }>).data.rootNode, ply: "0" } } }],
      [{ ...initial.events[0]!, data: { ...initial.events[0]!.data, sessionDigest: undefined } }],
    ]) expect(() => head({ ...initial, events: corrupt as unknown as DrillRunEvent[] })).toThrow();
    const corruptFuture = { ...moved, events: [initial.events[0]!, { ...moved.events[1]!, seq: 7 }] as DrillRunEvent[] };
    expect(() => resolveRunSubject(corruptFuture, reference(initial))).toThrow();
  });

  it("never accepts caller FENs, unknown fields, arbitrary subject grains or runtime seal forgeries", () => {
    const initial = run();
    const ref = reference(initial);
    for (const input of [{ ...ref, fen: INITIAL_FEN }, { ...ref, kind: "provider_request" }, { ...ref, eventHeadDigest: "sha256:bad" }, { ...ref, runId: "" }]) expect(() => parseRunSubjectRef(input)).toThrow();
    const resolved = resolveRunSubject(initial, ref);
    expect(() => assertResolvedRunSubject(resolved)).not.toThrow();
    expect(() => assertResolvedRunSubject({ ...resolved } as ResolvedRunSubject)).toThrow();
    expect(() => resolveRunEvidenceItem({ ...resolved } as ResolvedRunSubject, "forged" as ReturnType<typeof digestRunEvidenceItem>)).toThrow();
    expect(() => digestRunSubject({ subject: { ...resolved.subject, extra: true } as unknown as EvidenceAvailabilitySubject })).toThrow();
  });
});
