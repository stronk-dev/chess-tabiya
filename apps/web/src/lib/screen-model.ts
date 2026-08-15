import {
  CHECKPOINT_ACTIONS,
  type CheckpointAction,
  type DrillPackDefinition,
} from "@chess-tabiya/schema/drill-pack";
import {
  branchPaths,
  historyFrom,
  spineNodeIdFor,
  spinePositionIndex,
  type BranchComparison,
  type DrillRun,
  type EvidencePayload,
  type Node,
  type ObjectiveState,
} from "@chess-tabiya/runtime";

import { renderEvidenceRef, type EvidenceSentence } from "./evidence-sentences.js";

export interface TimelineEntry {
  readonly nodeId: string;
  readonly ply: number;
  readonly moveSan: string;
  readonly moveUci: string;
  readonly actor: Node["actor"];
  readonly checkpointIds: readonly string[];
  readonly spineNodeId?: string;
  readonly guardGenerated: boolean;
}

export interface BranchCard {
  readonly id: string;
  readonly label: string;
  readonly intent?: string;
  readonly firstMove: string;
  readonly leafNodeId: string;
  readonly leafPly: number;
  readonly objectiveState: ObjectiveState;
  readonly terminal: boolean;
  readonly forkNodeId: string;
  readonly origin: "played" | "simulated";
}

export interface CheckpointNotice {
  readonly id: string;
  readonly label: string;
  readonly eventSeq: number;
  readonly nodeId: string;
  readonly actions: readonly string[];
  readonly interaction?: { readonly type: "prediction"; readonly flipBoard?: boolean } | { readonly type: "stated_reasoning" };
}

export interface WhyBannerModel {
  readonly state: ObjectiveState;
  readonly sentences: readonly EvidenceSentence[];
  readonly eventSeq: number;
}

const TERMINAL_STATES: ReadonlySet<ObjectiveState> = new Set([
  "achieved",
  "failed",
  "transitioned",
]);

export function recognizedCheckpointActions(
  actions: readonly string[],
): Readonly<Record<CheckpointAction, boolean>> {
  const declared = new Set(actions);
  const recognized: Record<CheckpointAction, boolean> = {
    compare_branches: false,
  };
  for (const action of CHECKPOINT_ACTIONS) recognized[action] = declared.has(action);
  return Object.freeze(recognized);
}

export function packStartSide(pack: DrillPackDefinition): "white" | "black" {
  const side = pack.start.side;
  if (side !== "white" && side !== "black") {
    throw new TypeError(`Pack ${pack.id} has no valid start.side`);
  }
  return side;
}

export function packObjective(pack: DrillPackDefinition): string {
  const summary = pack.objective.summary;
  return typeof summary === "string" && summary.trim() !== ""
    ? summary
    : pack.objective.type.replaceAll("_", " ");
}

export function difficultyBand(value: unknown): string {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return "Unrated";
  }
  const difficulty = value as Record<string, unknown>;
  if (typeof difficulty.label === "string" && difficulty.label.trim() !== "") {
    return difficulty.label;
  }
  if (
    typeof difficulty.minOnlineRapid === "number" &&
    typeof difficulty.maxOnlineRapid === "number"
  ) {
    return `${difficulty.minOnlineRapid}–${difficulty.maxOnlineRapid}`;
  }
  return "Unrated";
}

export function activeNode(run: DrillRun): Node {
  const node = run.nodes.find((candidate) => candidate.id === run.activeCursor.nodeId);
  if (node === undefined) throw new TypeError("Run cursor points to an unknown node");
  return node;
}

export function timelineEntries(
  run: DrillRun,
  pack?: DrillPackDefinition,
): readonly TimelineEntry[] {
  const index = pack === undefined ? undefined : spinePositionIndex(pack);
  const guardNodes = new Set(
    run.events.flatMap((event) => event.type === "feedback.generated" ? [event.data.nodeId] : []),
  );
  return historyFrom(run, run.activeCursor.nodeId).flatMap((node) => {
    if (node.moveSan === null || node.moveUci === null) return [];
    const spineNodeId = index === undefined ? undefined : spineNodeIdFor(index, node);
    return [
      Object.freeze({
        nodeId: node.id,
        ply: node.ply,
        moveSan: node.moveSan,
        moveUci: node.moveUci,
        actor: node.actor,
        checkpointIds: node.checkpointRefs,
        guardGenerated: guardNodes.has(node.id),
        ...(spineNodeId === undefined ? {} : { spineNodeId }),
      }),
    ];
  });
}

export function branchCards(run: DrillRun): readonly BranchCard[] {
  const paths = branchPaths(run);
  return run.branches.map((branch) => {
    const path = paths.get(branch.id)!;
    const leaf = path.at(-1)!;
    const first = path.find(
      (node) => node.parentId === branch.forkNodeId && node.branchId === branch.id,
    );
    return Object.freeze({
      id: branch.id,
      label: branch.label,
      ...(branch.intent === undefined ? {} : { intent: branch.intent }),
      firstMove: first?.moveSan ?? "At fork",
      leafNodeId: leaf.id,
      leafPly: leaf.ply,
      objectiveState: leaf.objectiveState,
      terminal: TERMINAL_STATES.has(leaf.objectiveState),
      forkNodeId: branch.forkNodeId,
      origin: branch.origin,
    });
  });
}

export function latestCheckpoint(
  pack: DrillPackDefinition,
  run: DrillRun,
  afterSeq = 0,
): CheckpointNotice | undefined {
  const pathIds = new Set(
    historyFrom(run, run.activeCursor.nodeId).map((node) => node.id),
  );
  const event = [...run.events]
    .reverse()
    .find(
      (candidate) =>
        candidate.type === "checkpoint.reached" &&
        candidate.seq > afterSeq &&
        pathIds.has(candidate.data.nodeId),
    );
  if (event?.type !== "checkpoint.reached") return undefined;
  const definition = pack.checkpoints.find(
    (checkpoint) => checkpoint.id === event.data.checkpointId,
  );
  const label = definition?.label;
  const actions = definition?.actions;
  return Object.freeze({
    id: event.data.checkpointId,
    label:
      typeof label === "string" && label.trim() !== ""
        ? label
        : event.data.checkpointId,
    eventSeq: event.seq,
    nodeId: event.data.nodeId,
    actions: Array.isArray(actions)
      ? Object.freeze(actions.filter((action): action is string => typeof action === "string"))
      : Object.freeze([]),
    ...(definition?.interaction?.type === "prediction" ? {
      interaction: {
        type: "prediction" as const,
        ...(definition.interaction.flipBoard === undefined ? {} : { flipBoard: definition.interaction.flipBoard }),
      },
    } : definition?.interaction?.type === "stated_reasoning" ? { interaction: { type: "stated_reasoning" as const } } : {}),
  });
}

function evidencePayloads(run: DrillRun): ReadonlyMap<string, EvidencePayload> {
  const payloads = new Map<string, EvidencePayload>();
  for (const event of run.events) {
    if (event.type !== "evidence.attached") continue;
    for (const reference of event.data.evidenceRefs) {
      if (!payloads.has(reference)) payloads.set(reference, event.data.payload);
    }
  }
  return payloads;
}

export function whyBanner(
  pack: DrillPackDefinition,
  run: DrillRun,
): WhyBannerModel | undefined {
  const pathIds = new Set(
    historyFrom(run, run.activeCursor.nodeId).map((node) => node.id),
  );
  const event = [...run.events]
    .reverse()
    .find(
      (candidate) =>
        candidate.type === "objective.state_changed" &&
        pathIds.has(candidate.data.nodeId),
    );
  if (event?.type !== "objective.state_changed") return undefined;
  if (event.data.evidenceRefs.length === 0) {
    throw new TypeError(
      `Objective state change at event ${event.seq} has no renderable evidence refs`,
    );
  }
  const payloads = evidencePayloads(run);
  const sentences = event.data.evidenceRefs.map((reference) =>
    renderEvidenceRef(reference, pack, payloads),
  );
  if (sentences.some((sentence) => sentence.text.trim() === "")) {
    throw new TypeError(`Objective state change at event ${event.seq} rendered bare`);
  }
  return Object.freeze({ state: event.data.to, sentences, eventSeq: event.seq });
}

export function comparisonNode(
  run: DrillRun,
  comparison: BranchComparison,
  step: number,
  branchId: string,
): Node | undefined {
  const nodeId =
    step === 0
      ? comparison.forkNodeId
      : comparison.rows[step - 1]?.nodes[branchId]?.id;
  return nodeId === undefined
    ? undefined
    : run.nodes.find((node) => node.id === nodeId);
}
