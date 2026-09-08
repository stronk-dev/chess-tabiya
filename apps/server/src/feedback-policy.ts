import {
  deriveSegments,
  eventsSince,
  feedbackDeliveryOpen,
  feedbackDisclosed,
  isMachineEvidenceRef,
  type DrillRun,
  type DrillRunEvent,
  type Node,
  type OpponentSelection,
  type SelectionCandidate,
} from "@chess-tabiya/runtime";

function eventEnvelope<TEvent extends DrillRunEvent>(event: TEvent, data: TEvent["data"]): TEvent {
  return Object.freeze({ seq: event.seq, type: event.type, at: event.at, data: Object.freeze(data) }) as TEvent;
}

function publicNode(node: Node): Node {
  return Object.freeze({
    id: node.id,
    parentId: node.parentId,
    fen: node.fen,
    transposeKey: node.transposeKey,
    moveUci: node.moveUci,
    moveSan: node.moveSan,
    ply: node.ply,
    actor: node.actor,
    branchId: node.branchId,
    checkpointRefs: Object.freeze([...node.checkpointRefs]),
    objectiveState: node.objectiveState,
    evidenceRefs: Object.freeze([...node.evidenceRefs]),
    createdAt: node.createdAt,
    ...(node.clockState === undefined ? {} : { clockState: Object.freeze({ ...node.clockState }) }),
  });
}

function publicSelection(selection: OpponentSelection): OpponentSelection {
  return Object.freeze({
    moveUci: selection.moveUci,
    policyModeApplied: selection.policyModeApplied,
    ...(selection.orderingBasis === undefined ? {} : { orderingBasis: selection.orderingBasis }),
    ...(selection.candidates === undefined ? {} : {
      candidates: Object.freeze(selection.candidates.map((candidate): SelectionCandidate => Object.freeze({
        moveUci: candidate.moveUci,
        rank: candidate.rank,
        ...(candidate.mass === undefined ? {} : { mass: candidate.mass }),
        ...(candidate.concessionRatio === undefined ? {} : { concessionRatio: candidate.concessionRatio }),
        ...(candidate.offWindow === undefined ? {} : { offWindow: candidate.offWindow }),
        ...(candidate.scoreCp === undefined ? {} : { scoreCp: candidate.scoreCp }),
        ...(candidate.wdl === undefined ? {} : { wdl: Object.freeze({ win: candidate.wdl.win, draw: candidate.wdl.draw, loss: candidate.wdl.loss }) }),
      }))),
    }),
    engine: Object.freeze({
      id: selection.engine.id,
      name: selection.engine.name,
      version: selection.engine.version,
      ...(selection.engine.modelId === undefined ? {} : { modelId: selection.engine.modelId }),
      ...(selection.engine.containerDigest === undefined ? {} : { containerDigest: selection.engine.containerDigest }),
      seedHonored: selection.engine.seedHonored,
      ...(selection.engine.eloHonored === undefined ? {} : { eloHonored: selection.engine.eloHonored }),
      ...(selection.engine.eloApplied === undefined ? {} : { eloApplied: selection.engine.eloApplied }),
      ...(selection.engine.searchBound === undefined ? {} : { searchBound: Object.freeze({ kind: selection.engine.searchBound.kind, value: selection.engine.searchBound.value }) }),
    }),
  });
}

function projectPublicEvent(event: DrillRunEvent): DrillRunEvent {
  switch (event.type) {
    case "run.started":
      return eventEnvelope(event, {
        id: event.data.id,
        sessionKind: event.data.sessionKind,
        packId: event.data.packId,
        packDigest: event.data.packDigest,
        sessionDigest: event.data.sessionDigest,
        start: Object.freeze({ fen: event.data.start.fen, side: event.data.start.side }),
        feedbackPolicy: event.data.feedbackPolicy,
        opponentPolicy: Object.freeze({
          mode: event.data.opponentPolicy.mode,
          ...(event.data.opponentPolicy.targetElo === undefined ? {} : { targetElo: event.data.opponentPolicy.targetElo }),
          ...(event.data.opponentPolicy.temperature === undefined ? {} : { temperature: event.data.opponentPolicy.temperature }),
          ...(event.data.opponentPolicy.topP === undefined ? {} : { topP: event.data.opponentPolicy.topP }),
        }),
        policyConfig: Object.freeze({
          seedMode: event.data.policyConfig.seedMode,
          locus: Object.freeze({
            executedAt: event.data.policyConfig.locus.executedAt,
            engineIds: Object.freeze(event.data.policyConfig.locus.engineIds.map((identity) => Object.freeze({ id: identity.id, version: identity.version }))),
            modelIds: Object.freeze(event.data.policyConfig.locus.modelIds.map((identity) => Object.freeze({ id: identity.id, version: identity.version }))),
          }),
        }),
        rootNode: publicNode(event.data.rootNode),
        branch: Object.freeze({
          id: event.data.branch.id,
          forkNodeId: event.data.branch.forkNodeId,
          label: event.data.branch.label,
          ...(event.data.branch.intent === undefined ? {} : { intent: event.data.branch.intent }),
          seed: event.data.branch.seed,
          origin: event.data.branch.origin,
        }),
        activeCursor: Object.freeze({ nodeId: event.data.activeCursor.nodeId, branchId: event.data.activeCursor.branchId }),
      });
    case "feedback.revealed":
      return eventEnvelope(event, { nodeId: event.data.nodeId });
    case "move.committed":
      return eventEnvelope(event, { node: publicNode(event.data.node) });
    case "opponent.move_selected":
      return eventEnvelope(event, { nodeId: event.data.nodeId, branchId: event.data.branchId, moveUci: event.data.moveUci, selection: publicSelection(event.data.selection) });
    case "checkpoint.reached":
      return eventEnvelope(event, { checkpointId: event.data.checkpointId, nodeId: event.data.nodeId, branchId: event.data.branchId });
    case "objective.state_changed":
      return eventEnvelope(event, { nodeId: event.data.nodeId, from: event.data.from, to: event.data.to, evidenceRefs: Object.freeze([...event.data.evidenceRefs]) });
    case "evidence.attached":
      return eventEnvelope(event, { nodeId: event.data.nodeId, evidenceRefs: Object.freeze([...event.data.evidenceRefs]), payload: Object.freeze({ kind: event.data.payload.kind, source: event.data.payload.source, values: Object.freeze({ ...event.data.payload.values }) }) });
    case "branch.forked":
      return eventEnvelope(event, { branch: Object.freeze({ id: event.data.branch.id, forkNodeId: event.data.branch.forkNodeId, label: event.data.branch.label, ...(event.data.branch.intent === undefined ? {} : { intent: event.data.branch.intent }), seed: event.data.branch.seed, origin: event.data.branch.origin }) });
    case "run.rewound":
      return eventEnvelope(event, { fromNodeId: event.data.fromNodeId, toNodeId: event.data.toNodeId, branchId: event.data.branchId });
    case "segment.completed":
      return eventEnvelope(event, { branchId: event.data.branchId, startCheckpointEventSeq: event.data.startCheckpointEventSeq, endCheckpointEventSeq: event.data.endCheckpointEventSeq, startNodeId: event.data.startNodeId, endNodeId: event.data.endNodeId });
    case "feedback.generated":
      return eventEnvelope(event, { nodeId: event.data.nodeId, evidenceRefs: Object.freeze([...event.data.evidenceRefs]) });
    case "outcome.reached":
      return eventEnvelope(event, { nodeId: event.data.nodeId, outcome: event.data.outcome });
    case "transfer.scheduled":
      return eventEnvelope(event, { nodeId: event.data.nodeId, scheduleId: event.data.scheduleId });
    case "prediction.recorded":
      return eventEnvelope(event, { nodeId: event.data.nodeId, checkpointId: event.data.checkpointId, predictedUci: event.data.predictedUci, predictedMass: event.data.predictedMass, predictedRank: event.data.predictedRank, candidateCount: event.data.candidateCount, distribution: publicSelection(event.data.distribution) });
    case "reasoning.recorded":
      return eventEnvelope(event, {
        nodeId: event.data.nodeId,
        checkpointId: event.data.checkpointId,
        checkpointEventSeq: event.data.checkpointEventSeq,
        skipped: event.data.skipped,
        transcript: event.data.transcript === null ? null : Object.freeze({ candidates: Object.freeze([...event.data.transcript.candidates]), plan: event.data.transcript.plan, fears: event.data.transcript.fears }),
        matcherVersion: event.data.matcherVersion,
        detections: Object.freeze(event.data.detections.map((detection) => Object.freeze({
          keyPointId: detection.keyPointId,
          status: detection.status,
          ...(detection.match === undefined ? {} : { match: Object.freeze({ field: detection.match.field, index: detection.match.index, start: detection.match.start, end: detection.match.end }) }),
        }))),
      });
    case "group.created":
      return eventEnvelope(event, {
        groupId: event.data.groupId,
        sourceNodeId: event.data.sourceNodeId,
        source: event.data.source,
        resistance: event.data.resistance,
        members: Object.freeze(event.data.members.map((member) => Object.freeze({ branchId: member.branchId, seedMoveUci: member.seedMoveUci }))),
        ...(event.data.distribution === undefined ? {} : { distribution: publicSelection(event.data.distribution) }),
      });
  }
}

function reasoningDeliveryOpen(run: DrillRun, event: Extract<DrillRunEvent, { readonly type: "reasoning.recorded" }>): boolean {
  if (run.feedbackPolicy === "delayed_checkpoint" || run.feedbackPolicy === "immediate_guard") return true;
  if (run.feedbackPolicy === "attempt_end") return feedbackDeliveryOpen(run);
  return deriveSegments(run).some((segment) => segment.startSeq <= event.data.checkpointEventSeq && segment.endSeq >= event.data.checkpointEventSeq);
}

function publicReasoningEvent(run: DrillRun, event: DrillRunEvent): DrillRunEvent {
  if (event.type !== "reasoning.recorded" || reasoningDeliveryOpen(run, event)) return event;
  return Object.freeze({ ...event, data: Object.freeze({ ...event.data, detections: Object.freeze([]) }) }) as DrillRunEvent;
}

function publicSelectionEvent(run: DrillRun, event: DrillRunEvent): DrillRunEvent {
  if (event.type !== "opponent.move_selected" || feedbackDisclosed(run)) return event;
  const candidates = event.data.selection.candidates;
  if (candidates === undefined) return event;
  return Object.freeze({
    ...event,
    data: Object.freeze({
      ...event.data,
      selection: Object.freeze({
        ...event.data.selection,
        candidates: Object.freeze(candidates.map((candidate): SelectionCandidate => Object.freeze({
          moveUci: candidate.moveUci,
          rank: candidate.rank,
          ...(candidate.mass === undefined ? {} : { mass: candidate.mass }),
          ...(candidate.concessionRatio === undefined ? {} : { concessionRatio: candidate.concessionRatio }),
          ...(candidate.offWindow === undefined ? {} : { offWindow: candidate.offWindow }),
        }))),
      }),
    }),
  }) as DrillRunEvent;
}

function publicEvent(run: DrillRun, event: DrillRunEvent): DrillRunEvent {
  const projected = projectPublicEvent(event);
  return publicSelectionEvent(run, publicReasoningEvent(run, projected));
}

export function publicRunSnapshot(run: DrillRun): DrillRun {
  return Object.freeze({ ...run, events: Object.freeze(run.events.map((event) => publicEvent(run, event))) });
}

export function publicMutationPayload<T>(value: T): T {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  const candidate = record.run;
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) return value;
  const run = candidate as DrillRun;
  if (!Array.isArray(run.events) || !Array.isArray(run.nodes)) return value;
  return Object.freeze({
    ...record,
    run: publicRunSnapshot(run),
    ...(Array.isArray(record.emitted) ? { emitted: Object.freeze((record.emitted as DrillRunEvent[]).map((event) => publicEvent(run, event))) } : {}),
  }) as T;
}

export function publicNodes(
  run: DrillRun,
): readonly Node[] {
  if (feedbackDisclosed(run)) return run.nodes;
  return Object.freeze(
    run.nodes.map((node) =>
      Object.freeze({
        ...node,
        evidenceRefs: Object.freeze(
          node.evidenceRefs.filter((reference) => !isMachineEvidenceRef(reference)),
        ),
      }),
    ),
  );
}

function engineFeedbackEvent(event: DrillRunEvent): boolean {
  if (event.type === "evidence.attached") return true;
  return (
    event.type === "objective.state_changed" &&
    event.data.evidenceRefs.some(isMachineEvidenceRef)
  );
}

export function publicEvents(
  run: DrillRun,
  sinceSeq: number,
): { readonly events: readonly DrillRunEvent[]; readonly nextSeq: number; readonly withheld?: true } {
  const candidates = eventsSince(run, sinceSeq);
  if (feedbackDisclosed(run)) {
    return Object.freeze({
      events: Object.freeze(candidates.map((event) => publicEvent(run, event))),
      nextSeq: run.events.at(-1)?.seq ?? 0,
    });
  }
  const barrier = candidates.findIndex(engineFeedbackEvent);
  const events = barrier === -1 ? candidates : candidates.slice(0, barrier);
  return Object.freeze({
    events: Object.freeze(events.map((event) => publicEvent(run, event))),
    nextSeq: events.at(-1)?.seq ?? sinceSeq,
    ...(barrier === -1 ? {} : { withheld: true as const }),
  });
}
