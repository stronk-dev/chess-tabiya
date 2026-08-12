import type {
  CheckpointDefinition,
  DrillPackDefinition,
  PlanClass,
  SpineNode,
} from "@chess-tabiya/schema/drill-pack";
import {
  deriveSegments,
  historyFrom,
  type CheckpointReachedEvent,
  type DrillRun,
} from "@chess-tabiya/runtime";

import type { PackRecord } from "./pack-registry.js";

export interface RevealAttribution {
  readonly checkpointId: string;
  readonly eventSeq: number;
}

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
      readonly anchor: { readonly spineNodeId: string; readonly moveUci: string };
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

const KIND_ORDER: Readonly<Record<AuthoredFeedbackItem["kind"], number>> =
  Object.freeze({ annotation: 0, deviation: 1, plan_class: 2 });

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

function reachableSpineIds(
  pack: DrillPackDefinition,
  spine: ReadonlyMap<string, SpineIndexEntry>,
): ReadonlySet<string> {
  if (pack.checkpoints.some((checkpoint) => !("atSpineNode" in checkpoint.trigger))) {
    return new Set(spine.keys());
  }
  const result = new Set<string>();
  for (const checkpoint of pack.checkpoints) {
    if (!("atSpineNode" in checkpoint.trigger)) continue;
    let nodeId: string | undefined = checkpoint.trigger.atSpineNode;
    while (nodeId !== undefined && !result.has(nodeId)) {
      result.add(nodeId);
      nodeId = spine.get(nodeId)?.parentId;
    }
  }
  return result;
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
    if (deviation.note === undefined || !("spineNodeId" in deviation.at)) continue;
    add(deviation.at.spineNodeId, {
      kind: "deviation",
      id: `deviation#${deviationIndex}`,
      anchor: {
        spineNodeId: deviation.at.spineNodeId,
        moveUci: deviation.moveUci,
      },
      note: deviation.note,
      deviationClass: deviation.class,
      ...(deviation.offObjective === undefined
        ? {}
        : { offObjective: deviation.offObjective }),
    });
  }
  return result;
}

function spineNodeIdForRunNode(
  pack: DrillPackDefinition,
  run: DrillRun,
  runNodeId: string,
): string | undefined {
  let candidates = pack.spine ?? [];
  let current: string | undefined;
  for (const runNode of historyFrom(run, runNodeId).slice(1)) {
    const authored = candidates.find((candidate) => candidate.moveUci === runNode.moveUci);
    if (authored === undefined) return undefined;
    current = authored.id;
    candidates = authored.children;
  }
  return current;
}

function revealEvents(pack: PackRecord, run: DrillRun): readonly RevealEvent[] {
  if (pack.feedbackPolicy === "delayed_checkpoint") {
    return run.events.flatMap((event) =>
      event.type === "checkpoint.reached"
        ? [
            {
              orderSeq: event.seq,
              nodeId: event.data.nodeId,
              attribution: {
                checkpointId: event.data.checkpointId,
                eventSeq: event.seq,
              },
            },
          ]
        : [],
    );
  }

  const segments = deriveSegments(run);
  return run.events.flatMap((event) => {
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
          checkpointId: checkpoint.data.checkpointId,
          eventSeq: checkpoint.seq,
        },
      },
    ];
  });
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
): AuthoredFeedbackPage {
  const spine = new Map<string, SpineIndexEntry>();
  indexSpine(pack.document.spine ?? [], undefined, spine);
  const reachable = reachableSpineIds(pack.document, spine);
  const sourcesByNode = nodeSources(pack.document);
  const deliverable = new Set<string>();
  for (const [nodeId, sources] of sourcesByNode) {
    if (!reachable.has(nodeId)) continue;
    for (const source of sources) deliverable.add(source.id);
  }
  for (const sourceId of planClassSourceIds(pack.document)) deliverable.add(sourceId);

  const definitions = planClasses(pack.document);
  const revealed = new Map<string, AuthoredFeedbackItem>();
  for (const reveal of revealEvents(pack, run)) {
    const path = historyFrom(run, reveal.nodeId);
    const pathRunNodeIds = new Set(path.map((node) => node.id));
    const pathSpineNodeIds = new Set(
      path.flatMap((node) => {
        const spineNodeId = spineNodeIdForRunNode(pack.document, run, node.id);
        return spineNodeId === undefined ? [] : [spineNodeId];
      }),
    );

    for (const spineNodeId of pathSpineNodeIds) {
      for (const source of sourcesByNode.get(spineNodeId) ?? []) {
        if (!deliverable.has(source.id) || revealed.has(source.id)) continue;
        revealed.set(source.id, Object.freeze({ ...source, revealedBy: reveal.attribution }));
      }
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
          Object.freeze({
            kind: "plan_class",
            id: sourceId,
            revealedBy: reveal.attribution,
            anchor: { checkpointId: checkpoint.id },
            label: definition.label,
            ...(definition.description === undefined
              ? {}
              : { description: definition.description }),
          }),
        );
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

/** Source item id -> the checkpoint occurrence that first disclosed it. */
export function revealedAuthoredItems(
  pack: PackRecord,
  run: DrillRun,
): ReadonlyMap<string, RevealAttribution> {
  return new Map(
    projectAuthoredFeedback(pack, run).items.map((item) => [item.id, item.revealedBy]),
  );
}
