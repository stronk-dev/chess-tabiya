import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";

import { historyFrom } from "./runtime.js";
import type { DrillRun, Node, ObjectiveState } from "./types.js";

const ABSORBING = new Set<ObjectiveState>(["achieved", "failed", "transitioned"]);

export interface TrajectoryLegSpan {
  readonly legId: string;
  readonly legIndex: number;
  readonly entryNodeId: string;
  readonly entryPly: number;
  readonly exitNodeId?: string;
  readonly exitPly?: number;
  readonly sealedState?: ObjectiveState;
}

export interface TrajectoryTransition {
  readonly fromLegId: string;
  readonly toLegId: string;
  readonly entryCheckpointId: string;
  readonly nodeId: string;
  readonly ply: number;
  readonly fromLegEntryNodeId: string;
  readonly sealedState: ObjectiveState;
  readonly producedBy: readonly string[];
  readonly skippedLegIds: readonly string[];
}

export interface TrajectoryLegOutcome {
  readonly legId: string;
  readonly legIndex: number;
  readonly status: "entered" | "not_entered";
  readonly objectiveType: string;
  readonly span?: TrajectoryLegSpan;
  readonly state?: ObjectiveState;
}

export interface TrajectoryVerdict {
  readonly legs: readonly TrajectoryLegOutcome[];
  readonly transitions: readonly TrajectoryTransition[];
  readonly activeLegId: string;
  readonly stopped: boolean;
}

function requiredLegs(pack: DrillPackDefinition) {
  if (pack.legs === undefined || pack.legs.length < 2) {
    throw new TypeError("Trajectory derivation requires at least two legs");
  }
  return pack.legs;
}

function checkpointIdsAt(run: DrillRun, node: Node): Set<string> {
  return new Set(run.events.flatMap((event) =>
    event.type === "checkpoint.reached" && event.data.nodeId === node.id
      ? [event.data.checkpointId]
      : [],
  ));
}

export function trajectoryLegSpans(
  pack: DrillPackDefinition,
  run: DrillRun,
  nodeId: string,
): readonly TrajectoryLegSpan[] {
  const legs = requiredLegs(pack);
  const path = historyFrom(run, nodeId);
  const spans: TrajectoryLegSpan[] = [{
    legId: legs[0]!.id,
    legIndex: 0,
    entryNodeId: path[0]!.id,
    entryPly: path[0]!.ply,
  }];
  let current = 0;
  for (const node of path.slice(1)) {
    if (ABSORBING.has(node.objectiveState)) break;
    const hits = checkpointIdsAt(run, node);
    let incoming = current;
    for (let index = current + 1; index < legs.length; index += 1) {
      if (hits.has(legs[index]!.entryCheckpointId ?? "")) incoming = index;
    }
    if (incoming === current) continue;
    const reset = run.events.find((event) =>
      event.type === "objective.state_changed" && event.data.nodeId === node.id && event.data.to === "active",
    );
    const previous = spans.at(-1)!;
    spans[spans.length - 1] = Object.freeze({
      ...previous,
      exitNodeId: node.id,
      exitPly: node.ply,
      sealedState: reset?.type === "objective.state_changed" ? reset.data.from : node.objectiveState,
    });
    spans.push(Object.freeze({
      legId: legs[incoming]!.id,
      legIndex: incoming,
      entryNodeId: node.id,
      entryPly: node.ply,
    }));
    current = incoming;
  }
  return Object.freeze(spans);
}

export function legIndexAt(pack: DrillPackDefinition, run: DrillRun, nodeId: string): number {
  return trajectoryLegSpans(pack, run, nodeId).at(-1)!.legIndex;
}

export function trajectoryVerdict(
  pack: DrillPackDefinition,
  run: DrillRun,
  nodeId: string,
): TrajectoryVerdict {
  const legs = requiredLegs(pack);
  const path = historyFrom(run, nodeId);
  const spans = trajectoryLegSpans(pack, run, nodeId);
  const transitions: TrajectoryTransition[] = spans.slice(0, -1).map((span, index) => {
    const incoming = spans[index + 1]!;
    const exit = path.find((node) => node.id === span.exitNodeId)!;
    const entryIndex = path.findIndex((node) => node.id === span.entryNodeId);
    const exitIndex = path.findIndex((node) => node.id === exit.id);
    return Object.freeze({
      fromLegId: span.legId,
      toLegId: incoming.legId,
      entryCheckpointId: legs[incoming.legIndex]!.entryCheckpointId!,
      nodeId: exit.id,
      ply: exit.ply,
      fromLegEntryNodeId: span.entryNodeId,
      sealedState: span.sealedState!,
      producedBy: Object.freeze(path.slice(entryIndex + 1, exitIndex + 1).map((node) => node.moveUci!).filter(Boolean)),
      skippedLegIds: Object.freeze(legs.slice(span.legIndex + 1, incoming.legIndex).map((leg) => leg.id)),
    });
  });
  const active = spans.at(-1)!;
  const tip = path.at(-1)!;
  return Object.freeze({
    legs: Object.freeze(legs.map((leg, index) => {
      const span = spans.find((candidate) => candidate.legIndex === index);
      return Object.freeze({
        legId: leg.id,
        legIndex: index,
        status: span === undefined ? "not_entered" as const : "entered" as const,
        objectiveType: leg.objective.type,
        ...(span === undefined ? {} : { span, state: span.sealedState ?? tip.objectiveState }),
      });
    })),
    transitions: Object.freeze(transitions),
    activeLegId: active.legId,
    stopped: ABSORBING.has(tip.objectiveState),
  });
}
