import type {
  CheckpointDefinition,
  DrillPackDefinition,
  PlanClass,
  SpineNode,
} from "@chess-tabiya/schema/drill-pack";
import {
  deriveSegments,
  historyFrom,
  lineMembership,
  spineNodeIdFor,
  spinePositionIndex,
  type CheckpointReachedEvent,
  type DrillRun,
} from "@chess-tabiya/runtime";
import { reachableAuthoredSpineIds } from "@chess-tabiya/schema/drill-pack";

import type { PackRecord } from "./pack-registry.js";
import type { PlanShapeLookup } from "./pack-orchestrator.js";

export type RevealAttribution =
  | {
      readonly kind: "checkpoint";
      readonly checkpointId: string;
      readonly eventSeq: number;
    }
  | { readonly kind: "outcome"; readonly eventSeq: number };

export type AuthoredFeedbackItem =
  | {
      readonly kind: "annotation";
      readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor: { readonly spineNodeId: string };
      readonly text: string;
    }
  | {
      readonly kind: "deviation";
      readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor:
        | { readonly spineNodeId: string; readonly moveUci: string }
        | { readonly atStart: true; readonly moveUci: string };
      readonly note: string;
      readonly deviationClass?: string;
      readonly offObjective?: boolean;
    }
  | {
      readonly kind: "plan_class";
      readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor: { readonly checkpointId: string };
      readonly label: string;
      readonly description?: string;
      readonly shapePlan?: { readonly shape: string; readonly plan: string };
      readonly gradability: "graded" | "declared_uncheckable" | "unbound";
      readonly gradabilityNote?: string;
    }
  | {
      readonly kind: "theory_verdict";
      readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor: { readonly nodeId: string; readonly ply: number; readonly moveUci: string };
      readonly verdict: "on_line" | "classified_deviation" | "unknown";
      readonly spineNodeId?: string;
      readonly deviationClass?: string;
    };

export interface AuthoredFeedbackPage {
  readonly items: readonly AuthoredFeedbackItem[];
  readonly hasWithheldAuthoredContent: boolean;
}

type NodeAuthoredSource =
  | Omit<Extract<AuthoredFeedbackItem, { kind: "annotation" }>, "revealedBy">
  | Omit<Extract<AuthoredFeedbackItem, { kind: "deviation" }>, "revealedBy">;

interface SpineIndexEntry {
  readonly node: SpineNode;
  readonly parentId?: string;
}

interface RevealEvent {
  readonly orderSeq: number;
  readonly nodeId: string;
  readonly attribution: RevealAttribution;
}

function reasoningRecorded(run: DrillRun, checkpointEventSeq: number): boolean {
  return run.events.some((event) => event.type === "reasoning.recorded" && event.data.checkpointEventSeq === checkpointEventSeq);
}

function revealIsReleased(pack: PackRecord, run: DrillRun, reveal: RevealEvent): boolean {
  const pathNodeIds = new Set(historyFrom(run, reveal.nodeId).map((node) => node.id));
  const occurrences = run.events.filter((event): event is CheckpointReachedEvent =>
    event.type === "checkpoint.reached" && event.seq <= reveal.orderSeq && pathNodeIds.has(event.data.nodeId)
  );
  if (pack.feedbackPolicy === "delayed_checkpoint") {
    const occurrence = reveal.attribution.kind === "checkpoint"
      ? occurrences.find((event) => event.seq === reveal.attribution.eventSeq)
      : undefined;
    const definition = occurrence === undefined ? undefined : checkpointDefinition(pack.document, occurrence.data.checkpointId);
    return definition?.interaction?.type !== "stated_reasoning" || reasoningRecorded(run, occurrence!.seq);
  }
  return occurrences.every((occurrence) => {
    const definition = checkpointDefinition(pack.document, occurrence.data.checkpointId);
    return definition?.interaction?.type !== "stated_reasoning" || reasoningRecorded(run, occurrence.seq);
  });
}

const KIND_ORDER: Readonly<Record<AuthoredFeedbackItem["kind"], number>> =
  Object.freeze({ annotation: 0, deviation: 1, plan_class: 2, theory_verdict: 3 });

function indexSpine(
  nodes: readonly SpineNode[],
  parentId: string | undefined,
  result: Map<string, SpineIndexEntry>,
): void {
  for (const node of nodes) {
    result.set(node.id, {
      node,
      ...(parentId === undefined ? {} : { parentId }),
    });
    indexSpine(node.children, node.id, result);
  }
}

function nodeSources(pack: DrillPackDefinition): ReadonlyMap<string, readonly NodeAuthoredSource[]> {
  const result = new Map<string, NodeAuthoredSource[]>();
  const add = (spineNodeId: string, source: NodeAuthoredSource): void => {
    const sources = result.get(spineNodeId) ?? [];
    sources.push(source);
    result.set(spineNodeId, sources);
  };
  const visit = (nodes: readonly SpineNode[]): void => {
    for (const node of nodes) {
      for (const [annotationIndex, text] of (node.annotations ?? []).entries()) {
        add(node.id, {
          kind: "annotation",
          id: `${node.id}#${annotationIndex}`,
          anchor: { spineNodeId: node.id },
          text,
        });
      }
      visit(node.children);
    }
  };
  visit(pack.spine ?? []);
  for (const [deviationIndex, deviation] of (pack.deviations ?? []).entries()) {
    if (deviation.note === undefined || "fen" in deviation.at) continue;
    const sourceKey = "atStart" in deviation.at ? "/start" : deviation.at.spineNodeId;
    add(sourceKey, {
      kind: "deviation",
      id: `deviation#${deviationIndex}`,
      anchor: "atStart" in deviation.at
        ? { atStart: true, moveUci: deviation.moveUci }
        : { spineNodeId: deviation.at.spineNodeId, moveUci: deviation.moveUci },
      note: deviation.note,
      deviationClass: deviation.class,
      ...(deviation.offObjective === undefined
        ? {}
        : { offObjective: deviation.offObjective }),
    });
  }
  return result;
}

function revealEvents(pack: PackRecord, run: DrillRun): readonly RevealEvent[] {
  const outcomes: readonly RevealEvent[] = run.events.flatMap((event) =>
    event.type === "outcome.reached"
      ? [{
          orderSeq: event.seq,
          nodeId: event.data.nodeId,
          attribution: { kind: "outcome" as const, eventSeq: event.seq },
        }]
      : [],
  );
  if (pack.feedbackPolicy === "delayed_checkpoint") {
    return [...run.events.flatMap((event) =>
      event.type === "checkpoint.reached"
        ? [
            {
              orderSeq: event.seq,
              nodeId: event.data.nodeId,
              attribution: {
                kind: "checkpoint" as const,
                checkpointId: event.data.checkpointId,
                eventSeq: event.seq,
              },
            },
          ]
        : [],
    ), ...outcomes].sort((left, right) => left.orderSeq - right.orderSeq);
  }

  const segments = deriveSegments(run);
  return [...run.events.flatMap((event) => {
    if (event.type !== "segment.completed") return [];
    const segment = segments.find(
      (candidate) =>
        candidate.branchId === event.data.branchId &&
        candidate.startSeq === event.data.startCheckpointEventSeq &&
        candidate.endSeq === event.data.endCheckpointEventSeq,
    );
    const checkpoint = run.events.find(
      (candidate): candidate is CheckpointReachedEvent =>
        candidate.seq === event.data.endCheckpointEventSeq &&
        candidate.type === "checkpoint.reached",
    );
    if (segment === undefined || checkpoint === undefined) {
      throw new TypeError(`segment.completed ${event.seq} has no matching checkpoint segment`);
    }
    return [
      {
        orderSeq: event.seq,
        nodeId: segment.endNodeId,
        attribution: {
          kind: "checkpoint" as const,
          checkpointId: checkpoint.data.checkpointId,
          eventSeq: checkpoint.seq,
        },
      },
    ];
  }), ...outcomes].sort((left, right) => left.orderSeq - right.orderSeq);
}

function checkpointDefinition(
  pack: DrillPackDefinition,
  checkpointId: string,
): CheckpointDefinition | undefined {
  return pack.checkpoints.find((checkpoint) => checkpoint.id === checkpointId);
}

function planClasses(pack: DrillPackDefinition): ReadonlyMap<string, PlanClass> {
  return new Map((pack.planClasses ?? []).map((planClass) => [planClass.id, planClass]));
}

function planClassSourceIds(pack: DrillPackDefinition): ReadonlySet<string> {
  const definitions = planClasses(pack);
  const result = new Set<string>();
  for (const checkpoint of pack.checkpoints) {
    if (checkpoint.interaction?.type !== "intent_capture") continue;
    for (const planClassId of checkpoint.interaction.planClassIds) {
      if (definitions.has(planClassId)) result.add(`planClass#${planClassId}`);
    }
  }
  return result;
}

export function projectAuthoredFeedback(
  pack: PackRecord,
  run: DrillRun,
  shapes?: PlanShapeLookup,
): AuthoredFeedbackPage {
  const spine = new Map<string, SpineIndexEntry>();
  indexSpine(pack.document.spine ?? [], undefined, spine);
  const reachable = new Set(reachableAuthoredSpineIds(pack.document));
  const positionIndex = spinePositionIndex(pack.document);
  for (const event of run.events) {
    if (event.type !== "outcome.reached") continue;
    for (const runNode of historyFrom(run, event.data.nodeId)) {
      const spineNodeId = spineNodeIdFor(positionIndex, runNode);
      if (spineNodeId !== undefined) reachable.add(spineNodeId);
    }
  }
  const sourcesByNode = nodeSources(pack.document);
  const deliverable = new Set<string>();
  for (const [nodeId, sources] of sourcesByNode) {
    if (nodeId !== "/start" && !reachable.has(nodeId)) continue;
    for (const source of sources) deliverable.add(source.id);
  }
  for (const sourceId of planClassSourceIds(pack.document)) deliverable.add(sourceId);

  const definitions = planClasses(pack.document);
  const revealed = new Map<string, AuthoredFeedbackItem>();
  for (const reveal of revealEvents(pack, run)) {
    if (!revealIsReleased(pack, run, reveal)) continue;
    const path = historyFrom(run, reveal.nodeId);
    const pathRunNodeIds = new Set(path.map((node) => node.id));
    const pathSpineNodeIds = new Set(
      path.flatMap((node) => {
        const spineNodeId = spineNodeIdFor(positionIndex, node);
        return spineNodeId === undefined ? [] : [spineNodeId];
      }),
    );

    for (const spineNodeId of pathSpineNodeIds) {
      for (const source of sourcesByNode.get(spineNodeId) ?? []) {
        if (!deliverable.has(source.id) || revealed.has(source.id)) continue;
        revealed.set(source.id, Object.freeze({ ...source, revealedBy: reveal.attribution }));
      }
    }
    for (const source of sourcesByNode.get("/start") ?? []) {
      if (!deliverable.has(source.id) || revealed.has(source.id)) continue;
      revealed.set(source.id, Object.freeze({ ...source, revealedBy: reveal.attribution }));
    }

    const checkpointEvents = run.events.filter(
      (event): event is CheckpointReachedEvent =>
        event.seq <= reveal.orderSeq &&
        event.type === "checkpoint.reached" &&
        pathRunNodeIds.has(event.data.nodeId),
    );
    for (const checkpointEvent of checkpointEvents) {
      const checkpoint = checkpointDefinition(
        pack.document,
        checkpointEvent.data.checkpointId,
      );
      if (checkpoint?.interaction?.type !== "intent_capture") continue;
      for (const planClassId of checkpoint.interaction.planClassIds) {
        const sourceId = `planClass#${planClassId}`;
        const definition = definitions.get(planClassId);
        if (
          definition === undefined ||
          !deliverable.has(sourceId) ||
          revealed.has(sourceId)
        ) {
          continue;
        }
        revealed.set(
          sourceId,
          Object.freeze((() => {
            const plan = definition.shapePlan === undefined ? undefined : shapes?.get(definition.shapePlan.shape)?.document.plans.find((candidate) => candidate.id === definition.shapePlan!.plan);
            const gradability = definition.shapePlan === undefined ? "unbound" as const : plan?.success.signature === null ? "declared_uncheckable" as const : plan?.success.signature === undefined ? "unbound" as const : "graded" as const;
            return {
            kind: "plan_class" as const,
            id: sourceId,
            revealedBy: reveal.attribution,
            anchor: { checkpointId: checkpoint.id },
            label: definition.label,
            ...(definition.description === undefined
              ? {}
              : { description: definition.description }),
            ...(definition.shapePlan === undefined ? {} : { shapePlan: definition.shapePlan }),
            gradability,
            ...(gradability === "declared_uncheckable" ? { gradabilityNote: plan!.success.note } : {}),
          }; })()),
        );
      }
    }

    if (pack.document.objective.type === "follow_theory") {
      for (const entry of lineMembership(pack.document, run, reveal.nodeId)) {
        const id = `theory#${entry.nodeId}`;
        if (revealed.has(id)) continue;
        revealed.set(id, Object.freeze({
          kind: "theory_verdict",
          id,
          revealedBy: reveal.attribution,
          anchor: { nodeId: entry.nodeId, ply: entry.ply, moveUci: entry.moveUci },
          verdict: entry.verdict,
          ...(entry.spineNodeId === undefined ? {} : { spineNodeId: entry.spineNodeId }),
          ...(entry.deviationClass === undefined ? {} : { deviationClass: entry.deviationClass }),
        }));
      }
    }
  }

  const items = [...revealed.values()].sort(
    (left, right) =>
      left.revealedBy.eventSeq - right.revealedBy.eventSeq ||
      KIND_ORDER[left.kind] - KIND_ORDER[right.kind] ||
      left.id.localeCompare(right.id),
  );
  return Object.freeze({
    items: Object.freeze(items),
    hasWithheldAuthoredContent: [...deliverable].some((id) => !revealed.has(id)),
  });
}

/** Source item id -> the reveal occurrence that first disclosed it. */
export function revealedAuthoredItems(
  pack: PackRecord,
  run: DrillRun,
): ReadonlyMap<string, RevealAttribution> {
  return new Map(
    projectAuthoredFeedback(pack, run).items.map((item) => [item.id, item.revealedBy]),
  );
}
