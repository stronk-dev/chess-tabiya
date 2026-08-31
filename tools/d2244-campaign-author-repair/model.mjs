// DISPOSABLE author-contract model. This is an evidence instrument, not production code.
import { createHash } from "node:crypto";

const stable = (value) => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
const digest = (value) => `sha256:${createHash("sha256").update(stable(value)).digest("hex")}`;
const clone = (value) => structuredClone(value);

export function deriveCampaignParticipationWitness({ path, tipState, atAuthoredBoundary }) {
  const learnerMoves = path.filter((event) => event.type === "move.committed" && event.actor === "user");
  const learnerMove = learnerMoves.at(-1);
  if (learnerMove === undefined) throw new TypeError("CAMPAIGN_PARTICIPATION_REQUIRED");
  const completion = ["achieved", "failed", "transitioned"].includes(tipState)
    ? "objective_absorbing" : atAuthoredBoundary ? "authored_boundary" : null;
  const tip = path.at(-1);
  if (completion === null || tip === undefined || tip.seq < learnerMove.seq) {
    throw new TypeError("CAMPAIGN_PARTICIPATION_REQUIRED");
  }
  return Object.freeze({ learnerMoveEventSeq: learnerMove.seq, consequenceTipNodeId: tip.nodeId, completion });
}

function transaction(state, operation, failAt) {
  const draft = clone(state);
  const result = operation(draft, (point) => {
    if (point === failAt) throw new TypeError(`INJECTED_${point.toUpperCase()}`);
  });
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, draft);
  return result;
}

export function campaignStore() {
  return { campaignRuns: [], createReceipts: [], campaignEvents: [], playRuns: [], awards: [] };
}

function findCreate(store, input) {
  return store.createReceipts.find((row) => row.learnerId === input.learnerId
    && row.campaignId === input.campaignId && row.commandId === input.commandId);
}

export function createCampaignRunExactlyOnce(store, input, { failAt } = {}) {
  const prior = findCreate(store, input);
  const operandsDigest = digest({ campaignVersion: input.campaignVersion });
  if (prior !== undefined) {
    if (prior.operandsDigest !== operandsDigest) throw new TypeError("CAMPAIGN_COMMAND_REUSED");
    return Object.freeze({ kind: "replayed", ...clone(prior.result) });
  }
  if (store.campaignRuns.some((run) => run.learnerId === input.learnerId
    && run.campaignId === input.campaignId && run.status === "active")) {
    throw new TypeError("CAMPAIGN_RUN_ACTIVE_EXISTS");
  }
  return transaction(store, (draft, inject) => {
    const runId = input.generatedRunId;
    const run = { id: runId, learnerId: input.learnerId, campaignId: input.campaignId,
      campaignVersion: input.campaignVersion, documentDigest: input.documentDigest, status: "active",
      revision: 1, activeEncounterRunId: null };
    draft.campaignRuns.push(run);
    inject("run");
    const event = { campaignRunId: runId, seq: 1, kind: "campaign_created", commandId: input.commandId };
    draft.campaignEvents.push(event);
    inject("event");
    const result = { run: clone(run), event: clone(event) };
    draft.createReceipts.push({ learnerId: input.learnerId, campaignId: input.campaignId,
      commandId: input.commandId, campaignVersion: input.campaignVersion, operandsDigest,
      campaignRunId: runId, result: clone(result) });
    inject("receipt");
    return Object.freeze({ kind: "created", ...clone(result) });
  }, failAt);
}

function commandEvent(store, campaignRunId, commandId) {
  return store.campaignEvents.find((event) => event.campaignRunId === campaignRunId
    && event.commandId === commandId);
}

export function startCampaignEncounterExactlyOnce(store, input, { failAt } = {}) {
  const run = store.campaignRuns.find((row) => row.id === input.campaignRunId
    && row.learnerId === input.learnerId);
  if (run === undefined) throw new TypeError("CAMPAIGN_NOT_FOUND");
  const prior = commandEvent(store, run.id, input.commandId);
  const operandsDigest = digest({ expectedRevision: input.expectedRevision, nodeId: input.nodeId });
  if (prior !== undefined) {
    if (prior.operandsDigest !== operandsDigest) throw new TypeError("CAMPAIGN_COMMAND_REUSED");
    return Object.freeze({ kind: "replayed", ...clone(prior.result) });
  }
  if (run.revision !== input.expectedRevision) throw new TypeError("CAMPAIGN_REVISION_STALE");
  if (run.activeEncounterRunId !== null) throw new TypeError("CAMPAIGN_ACTIVE_ENCOUNTER_MISMATCH");
  return transaction(store, (draft, inject) => {
    const campaignRun = draft.campaignRuns.find((row) => row.id === input.campaignRunId);
    const origin = { kind: "campaign_encounter", campaignRunId: campaignRun.id, nodeId: input.nodeId,
      campaignDocumentDigest: campaignRun.documentDigest };
    const playRun = { id: input.generatedPlayRunId, learnerId: input.learnerId, origin,
      started: { type: "run.started", origin: clone(origin) } };
    draft.playRuns.push(playRun);
    inject("play_run");
    inject("run_started");
    const event = { campaignRunId: campaignRun.id, seq: campaignRun.revision + 1,
      kind: "node_entered", commandId: input.commandId, operandsDigest,
      payload: { nodeId: input.nodeId, runId: playRun.id } };
    draft.campaignEvents.push(event);
    inject("node_entered");
    campaignRun.revision += 1;
    inject("revision");
    campaignRun.activeEncounterRunId = playRun.id;
    inject("pointer");
    event.result = { playRun: clone(playRun), event: clone(event) };
    return Object.freeze({ kind: "started", ...clone(event.result) });
  }, failAt);
}

export function deleteOwnedRunCampaignAware(store, { learnerId, playRunId }) {
  const index = store.playRuns.findIndex((run) => run.id === playRunId && run.learnerId === learnerId);
  if (index < 0) throw new TypeError("RUN_NOT_FOUND");
  const active = store.campaignRuns.find((run) => run.status === "active"
    && run.activeEncounterRunId === playRunId);
  if (active !== undefined) throw new TypeError("CAMPAIGN_ACTIVE_ENCOUNTER_DELETE");
  store.playRuns.splice(index, 1);
}

export function campaignReviewProjection(store, { campaignRunId, nodeId }) {
  const seal = store.campaignEvents.find((event) => event.campaignRunId === campaignRunId
    && event.kind === "node_committed" && event.payload.nodeId === nodeId);
  if (seal === undefined) throw new TypeError("CAMPAIGN_NODE_UNAVAILABLE");
  const playRun = store.playRuns.find((run) => run.id === seal.payload.runId);
  if (playRun === undefined) return Object.freeze({ kind: "unavailable",
    reason: "campaign_encounter_run_deleted", runId: seal.payload.runId, nodeId,
    campaignDocumentDigest: seal.payload.campaignDocumentDigest });
  return Object.freeze({ kind: "available", playRun: clone(playRun) });
}

export function campaignAssistanceAuthority(input) {
  const origin = input.playRun.origin;
  if (origin?.kind !== "campaign_encounter" || origin.campaignRunId !== input.campaignRun.id
    || origin.nodeId !== input.node.id || origin.campaignDocumentDigest !== input.campaignRun.documentDigest
    || input.playRun.id !== input.expectedPlayRunId || input.learnerId !== input.campaignRun.learnerId) {
    throw new TypeError("CAMPAIGN_ACTIVE_ENCOUNTER_MISMATCH");
  }
  const owned = new Set(input.campaignRun.modules.owned);
  const equipped = new Set(input.campaignRun.modules.equipped);
  const suppressed = new Set(input.node.suppress ?? []);
  const sourceAvailable = new Set(input.sourceAvailable);
  const preset = new Set(input.presetModules);
  const ceiling = new Set(input.contextCeiling);
  const effectiveModules = [...owned].filter((id) => equipped.has(id) && !suppressed.has(id)
    && sourceAvailable.has(id) && preset.has(id) && ceiling.has(id)).sort();
  const authorizedTheory = input.campaignRun.theory.owned.filter((passage) =>
    effectiveModules.includes(passage.authorizingModuleId) && sourceAvailable.has(passage.sourceId));
  return Object.freeze({ campaignRunId: input.campaignRun.id, revision: input.campaignRun.revision,
    nodeId: input.node.id, runId: input.playRun.id, documentDigest: input.campaignRun.documentDigest,
    effectiveModules: Object.freeze(effectiveModules), authorizedTheory: Object.freeze(clone(authorizedTheory)) });
}

export function validateOfficialCampaign(document, authorities) {
  const issues = [];
  if (document.publication?.channel !== "official") return Object.freeze(issues);
  const curriculum = document.publication.curriculum;
  if (curriculum === undefined) return Object.freeze(["CAMPAIGN_OFFICIAL_CURRICULUM_REQUIRED"]);
  const nodeIds = new Set(document.nodeIds);
  for (const phase of ["opening", "middlegame", "endgame"]) {
    const ids = curriculum.phaseCoverage?.[phase] ?? [];
    if (ids.length === 0 || ids.some((id) => !nodeIds.has(id))) issues.push(`CAMPAIGN_PHASE_COVERAGE_${phase.toUpperCase()}`);
  }
  if (!authorities.brackets.has(curriculum.targetLearner.bracketId)) issues.push("CAMPAIGN_TARGET_LEARNER_UNKNOWN");
  if (!(curriculum.expectedEnvelope.minimumMinutes > 0
    && curriculum.expectedEnvelope.maximumMinutes >= curriculum.expectedEnvelope.minimumMinutes)) {
    issues.push("CAMPAIGN_EXPECTED_ENVELOPE_INVALID");
  }
  if (curriculum.formCoverage.length === 0 || curriculum.formCoverage.some((row) => row.nodeIds.length === 0
    || row.nodeIds.some((id) => !nodeIds.has(id)))) issues.push("CAMPAIGN_FORM_COVERAGE_INVALID");
  if (curriculum.theoryProvenance.some((row) => !authorities.passages.has(row.passage)
    || row.evidenceRefs.some((ref) => !authorities.evidence.has(ref)))) issues.push("CAMPAIGN_THEORY_PROVENANCE_UNKNOWN");
  if (curriculum.dependencyAvailability.some((row) => !authorities.requirements.has(row.requirement)
    || (row.fallbackOperation !== undefined && !authorities.operations.has(row.fallbackOperation)))) {
    issues.push("CAMPAIGN_DEPENDENCY_UNKNOWN");
  }
  if (curriculum.reviewReceipt.authority !== "owner_human_chess_review"
    || curriculum.reviewReceipt.documentDigest !== digest({ ...document, publication: { channel: "official",
      curriculum: { ...curriculum, reviewReceipt: { ...curriculum.reviewReceipt, documentDigest: "sha256:pending" } } } })) {
    issues.push("CAMPAIGN_REVIEW_DIGEST_MISMATCH");
  }
  return Object.freeze(issues);
}

export function officialDocument() {
  const base = { id: "official-1", version: 1, nodeIds: ["o1", "m1", "e1"] };
  const curriculum = { targetLearner: { bracketId: "club", prerequisites: [] },
    expectedEnvelope: { minimumMinutes: 30, maximumMinutes: 60 },
    phaseCoverage: { opening: ["o1"], middlegame: ["m1"], endgame: ["e1"] },
    formCoverage: [{ encounterKind: "pack", nodeIds: ["o1", "m1", "e1"] }],
    theoryProvenance: [{ nodeId: "o1", passage: "bundle/p1", evidenceRefs: ["ev1"] }],
    dependencyAvailability: [{ requirement: "module.guided_hint", requiredAt: ["m1"],
      unavailableAction: "honest_degradation", fallbackOperation: "module.guided_hint@1" }],
    reviewReceipt: { authority: "owner_human_chess_review", documentDigest: "sha256:pending",
      reviewedAt: "2026-08-31T00:00:00.000Z" } };
  const pending = { ...base, publication: { channel: "official", curriculum } };
  curriculum.reviewReceipt.documentDigest = digest(pending);
  return pending;
}
