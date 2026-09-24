import { randomUUID } from "node:crypto";

import {
  MODULE_IDS,
  campaignModuleCeiling,
  campaignModuleShelf,
  campaignPrestigeEligible,
  campaignRunState,
  deriveCampaignParticipationWitness,
  issueCampaignEncounterReceipt,
  locateCampaignNodes,
  resolveBotProfileReference,
  type BotProfileCatalogEntry,
  type CampaignDocument,
  type CampaignEncounterReceipt,
  type CampaignEvent,
  type CampaignEventPayloads,
  type CampaignNode,
  type CampaignRunState,
  type DrillRun,
  type LocatedCampaignNode,
  type PolicyConfig,
  type UnlockableModuleId,
} from "@chess-tabiya/runtime";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

import { canonicalSha256 } from "./bot-profile-digest.js";
import { buildCampaignEventRow, campaignOperandsDigest, type AdmittedCampaignEvent, type CampaignEventRowImage } from "./campaign-events.js";
import type { CampaignRegistry } from "./campaign-registry.js";
import type { CampaignRunRow, CampaignStore } from "./campaign-store.js";
import { ServerError } from "./errors.js";
import type { Principal } from "./authorization.js";
import type { PackRecord, PackRegistry } from "./pack-registry.js";
import { ratedTerminalReason, type CampaignChargeGate, type CampaignChargedOutcome, type CampaignCommandInput, type RunService } from "./service.js";
import type { CampaignTransaction, LeaseHolder, SQLiteRunStorage } from "./storage.js";

// rfc/campaign-core.md §4–§7 (+ rfc/campaign-boss-games.md §3–§5): the ONE campaign service. Every
// learner identity comes from authentication; every mutation carries a durable command id and, after
// creation, the exact expected revision; every response-loss retry returns stored bytes.

type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };

const COMMAND_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
const EXHAUSTED_MESSAGE = "No earned rewinds remain in this campaign. Seal a node to earn more.";

function fail(code: ConstructorParameters<typeof ServerError>[0], message: string, details?: Readonly<Record<string, unknown>>): never {
  throw new ServerError(code, message, details === undefined ? undefined : { details });
}

export function parseCampaignCommandId(value: unknown): string {
  if (typeof value !== "string" || !COMMAND_ID.test(value)) fail("INVALID_REQUEST", "commandId must be 1-128 characters of [A-Za-z0-9._:-]");
  return value as string;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export interface CampaignServiceOptions {
  readonly storage: SQLiteRunStorage;
  readonly registry: CampaignRegistry;
  readonly runs: RunService;
  readonly packs: PackRegistry;
  /** The policy locus stamped on a new encounter run (the same capability-derived config the client uses). */
  readonly policyConfig: (pack: PackRecord | undefined) => Promise<PolicyConfig>;
  /** Whether a registered bot profile can start a game right now (bot-policy availability). */
  readonly botStartable?: (entry: BotProfileCatalogEntry) => boolean;
  readonly now?: () => string;
  readonly newId?: () => string;
}

interface Loaded {
  readonly row: CampaignRunRow;
  readonly document: CampaignDocument;
  readonly events: readonly AdmittedCampaignEvent[];
  readonly state: CampaignRunState;
}

/** Signal used to unwind RunService.create when a concurrent identical start already committed. */
class ReplayedStart extends Error {
  constructor(readonly stored: AdmittedCampaignEvent) { super("replayed"); }
}

export class CampaignService implements CampaignChargeGate {
  readonly #storage: SQLiteRunStorage;
  readonly #store: CampaignStore;
  readonly #registry: CampaignRegistry;
  readonly #runs: RunService;
  readonly #packs: PackRegistry;
  readonly #policyConfig: CampaignServiceOptions["policyConfig"];
  readonly #botStartable: (entry: BotProfileCatalogEntry) => boolean;
  readonly #now: () => string;
  readonly #newId: () => string;
  readonly #documents = new Map<string, CampaignDocument>();

  constructor(options: CampaignServiceOptions) {
    this.#storage = options.storage;
    this.#store = options.storage.campaigns;
    this.#registry = options.registry;
    this.#runs = options.runs;
    this.#packs = options.packs;
    this.#policyConfig = options.policyConfig;
    this.#botStartable = options.botStartable ?? (() => true);
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#newId = options.newId ?? (() => `campaign-run-${randomUUID()}`);
    options.runs.setCampaignGate(this);
  }

  // ---------------------------------------------------------------------------------------------
  // Loading: the pinned snapshot is re-hashed before every use; the fold is checked against the
  // materialized status/pointer (projection drift is corruption, never a second input).

  #document(row: CampaignRunRow): CampaignDocument {
    const cached = this.#documents.get(row.documentDigest);
    if (cached !== undefined && canonicalizeJson(cached) === row.document) return cached;
    let parsed: unknown;
    try { parsed = JSON.parse(row.document); } catch { return fail("STORAGE_FAILURE", "A campaign snapshot is not JSON"); }
    if (canonicalizeJson(parsed) !== row.document || canonicalSha256(parsed) !== row.documentDigest) fail("STORAGE_FAILURE", "A campaign snapshot does not match its pinned digest");
    const document = deepFreeze(parsed as CampaignDocument);
    this.#documents.set(row.documentDigest, document);
    return document;
  }

  #load(row: CampaignRunRow): Loaded {
    const document = this.#document(row);
    const events = this.#store.events(row.id);
    let state: CampaignRunState;
    try {
      state = campaignRunState(document, events.map((item) => item.event));
    } catch (error) {
      return fail("STORAGE_FAILURE", `A campaign event log does not fold: ${(error as Error).message}`);
    }
    if (state.status !== row.status || (state.activeEncounter?.playRunId ?? null) !== row.activeEncounterRunId) {
      fail("STORAGE_FAILURE", "A campaign run's materialized status or pointer drifted from its event log");
    }
    return { row, document, events, state };
  }

  #owned(principal: Principal, campaignRunId: string): Loaded {
    const row = this.#store.run(campaignRunId);
    // Another learner's run returns the same envelope as an absent id.
    if (row === undefined || row.learnerId !== principal.learnerId) fail("CAMPAIGN_NOT_FOUND", "Campaign run not found");
    return this.#load(row!);
  }

  // ---------------------------------------------------------------------------------------------
  // Projections

  #packTitle(packId: string): string | null {
    const record = this.#packs.get(packId);
    return typeof record?.summary.title === "string" ? record.summary.title : null;
  }

  #nodeCard(location: LocatedCampaignNode, state: CampaignRunState, current: boolean) {
    const node = location.node;
    const encounter = node.encounter;
    const seal = state.nodes[node.id];
    const packId = encounter.kind === "pack" ? encounter.packId : encounter.briefingRef.packId;
    const pack = this.#packs.get(packId);
    let unavailable: "pack_unavailable" | "opponent_unavailable" | null = pack === undefined ? "pack_unavailable" : null;
    let opponent: { readonly profileId: string; readonly band: number; readonly family: string } | null = null;
    if (encounter.kind === "boss_game") {
      try {
        const entry = resolveBotProfileReference(encounter.opponent.profile);
        opponent = { profileId: entry.reference.id, band: entry.reference.band, family: entry.reference.family };
        if (unavailable === null && !this.#botStartable(entry)) unavailable = "opponent_unavailable";
      } catch {
        unavailable = "opponent_unavailable";
      }
    }
    return deepFreeze({
      nodeId: node.id,
      kind: encounter.kind,
      title: pack?.summary.title ?? packId,
      packId,
      phase: pack?.summary.phase ?? null,
      objectiveSummary: pack?.summary.objectiveSummary ?? null,
      boss: node.boss === true,
      suppress: [...(node.suppress ?? [])],
      reward: node.reward ?? null,
      opponent,
      rating: encounter.kind === "boss_game" ? encounter.rating : null,
      seal: seal === undefined ? null : seal.kind === "pack"
        ? { kind: "pack", verdict: seal.verdict, playRunId: seal.playRunId }
        : { kind: "boss_game", outcome: seal.outcome, reason: seal.reason, playRunId: seal.playRunId },
      selectable: current && seal === undefined && state.activeEncounter === null && unavailable === null && state.status === "active",
      active: state.activeEncounter?.nodeId === node.id,
      unavailable,
    });
  }

  #projection(loaded: Loaded) {
    const { row, document, state } = loaded;
    const cursor = state.cursor;
    const locations = locateCampaignNodes(document);
    const acts = document.acts.map((act, actIndex) => ({
      id: act.id,
      layers: act.layers.map((layer, layerIndex) => {
        const sealed = layer.choices.some((node) => state.nodes[node.id] !== undefined);
        const current = cursor.kind === "active" && cursor.act === act.id && cursor.layer === layerIndex + 1;
        return {
          layer: layerIndex + 1,
          state: sealed ? "sealed" : current ? "current" : "locked",
          choices: layer.choices.map((node) => this.#nodeCard(locations.find((location) => location.node.id === node.id && location.actIndex === actIndex)!, state, current)),
        };
      }),
    }));
    const active = state.activeEncounter === null ? null : {
      nodeId: state.activeEncounter.nodeId,
      playRunId: state.activeEncounter.playRunId,
      title: this.#nodeTitle(document, state.activeEncounter.nodeId),
    };
    const nextNode = active === null ? undefined : locations.find((location) => location.node.id === active.nodeId)?.node;
    return deepFreeze({
      campaignRun: {
        id: row.id,
        campaignId: row.campaignId,
        campaignVersion: row.campaignVersion,
        title: document.title,
        channel: document.publication.channel,
        documentDigest: row.documentDigest,
        status: state.status,
        revision: state.revision,
        createdAt: row.createdAt,
      },
      cursor,
      activeEncounter: active,
      acts,
      charges: {
        balance: state.charges.balance,
        startingIncome: state.charges.startingIncome,
        actIncome: state.charges.actIncome,
        rewardIncome: state.charges.rewardIncome,
        spent: state.charges.spent,
      },
      economy: document.economy,
      kit: {
        owned: state.inventory.modules.owned,
        equipped: state.inventory.modules.equipped,
        ceiling: campaignModuleCeiling().filter((id) => id !== "rules_floor"),
        shelf: campaignModuleShelf({ owned: state.inventory.modules.owned, equipped: state.inventory.modules.equipped, suppressed: nextNode?.suppress ?? [] }),
        theoryOwned: state.inventory.theory.owned,
      },
      prestige: { eligible: campaignPrestigeEligible(state, document) },
      awards: this.#store.awardsForRun(row.id).map((award) => ({ durableRewardId: award.durableRewardId, reward: JSON.parse(award.rewardPayload) as Json, awardedAt: award.awardedAt })),
      abandonedEncounter: state.abandonedEncounter,
    });
  }

  #nodeTitle(document: CampaignDocument, nodeId: string): string {
    const node = locateCampaignNodes(document).find((location) => location.node.id === nodeId)?.node;
    if (node === undefined) return nodeId;
    const packId = node.encounter.kind === "pack" ? node.encounter.packId : node.encounter.briefingRef.packId;
    return this.#packTitle(packId) ?? packId;
  }

  // ---------------------------------------------------------------------------------------------
  // GET /campaigns, GET /campaigns/active, GET /campaign-rewards

  catalogue(principal: Principal) {
    const mine = this.#store.runsForLearner(principal.learnerId);
    const awards = this.#store.awardsForLearner(principal.learnerId);
    return deepFreeze({
      campaigns: this.#registry.list().map((summary) => {
        const record = this.#registry.required(summary.id, summary.version);
        const packIds = locateCampaignNodes(record.document).map((location) => location.node.encounter.kind === "pack" ? location.node.encounter.packId : location.node.encounter.briefingRef.packId);
        const missing = [...new Set(packIds.filter((id) => this.#packs.get(id) === undefined))].sort();
        const active = mine.find((run) => run.campaignId === summary.id && run.status === "active");
        return {
          id: summary.id,
          version: summary.version,
          title: summary.title,
          channel: summary.channel,
          digest: summary.digest,
          nodeCount: summary.nodeCount,
          available: missing.length === 0,
          unavailablePacks: missing,
          activeRunId: active?.id ?? null,
          completedRuns: mine.filter((run) => run.campaignId === summary.id && run.status === "completed").length,
          marks: awards.filter((award) => award.campaignId === summary.id).map((award) => award.durableRewardId),
        };
      }),
    });
  }

  active(principal: Principal) {
    return deepFreeze({
      runs: this.#store.runsForLearner(principal.learnerId).filter((row) => row.status === "active").map((row) => {
        const loaded = this.#load(row);
        const active = loaded.state.activeEncounter;
        return {
          campaignRunId: row.id,
          campaignId: row.campaignId,
          title: loaded.document.title,
          revision: loaded.state.revision,
          chargeBalance: loaded.state.charges.balance,
          activeEncounter: active === null ? null : { nodeId: active.nodeId, playRunId: active.playRunId, title: this.#nodeTitle(loaded.document, active.nodeId) },
        };
      }),
    });
  }

  rewards(principal: Principal) {
    return deepFreeze({
      awards: this.#store.awardsForLearner(principal.learnerId).map((award) => ({
        campaignRunId: award.campaignRunId,
        campaignId: award.campaignId,
        campaignVersion: award.campaignVersion,
        durableRewardId: award.durableRewardId,
        reward: JSON.parse(award.rewardPayload) as Json,
        awardedAt: award.awardedAt,
      })),
    });
  }

  read(principal: Principal, campaignRunId: string) {
    return this.#projection(this.#owned(principal, campaignRunId));
  }

  result(principal: Principal, campaignRunId: string) {
    const loaded = this.#owned(principal, campaignRunId);
    if (loaded.state.status === "active") fail("CAMPAIGN_NODE_UNAVAILABLE", "The run result exists once the campaign is completed or abandoned");
    return deepFreeze({
      campaign: this.#projection(loaded),
      path: loaded.state.seals.map((seal) => ({
        nodeId: seal.nodeId,
        act: seal.act,
        layer: seal.layer,
        title: this.#nodeTitle(loaded.document, seal.nodeId),
        playRunId: seal.playRunId,
        ...(seal.kind === "pack" ? { kind: "pack" as const, verdict: seal.verdict } : { kind: "boss_game" as const, outcome: seal.outcome, reason: seal.reason }),
      })),
      prestigeEligible: campaignPrestigeEligible(loaded.state, loaded.document),
      awards: this.#store.awardsForRun(campaignRunId).map((award) => ({ durableRewardId: award.durableRewardId, reward: JSON.parse(award.rewardPayload) as Json, awardedAt: award.awardedAt })),
    });
  }

  /** §6.3: the exact Review route, or an explicit typed unavailable/abandoned result. */
  review(principal: Principal, campaignRunId: string, nodeId: string) {
    const loaded = this.#owned(principal, campaignRunId);
    const seal = loaded.state.nodes[nodeId];
    const abandoned = loaded.state.abandonedEncounter?.nodeId === nodeId ? loaded.state.abandonedEncounter : null;
    const runId = seal?.playRunId ?? abandoned?.playRunId;
    if (runId === undefined) fail("CAMPAIGN_NODE_UNAVAILABLE", "This node has no sealed or abandoned encounter to review");
    const exists = this.#storage.read(runId!) !== undefined && this.#storage.ownerLearnerId(runId!) === principal.learnerId;
    const base = { runId: runId!, nodeId, campaignDocumentDigest: loaded.row.documentDigest };
    if (seal !== undefined) {
      return deepFreeze(exists ? { kind: "available" as const, ...base, route: `/play/run/${encodeURIComponent(runId!)}` } : { kind: "unavailable" as const, reason: "campaign_encounter_run_deleted" as const, ...base });
    }
    return deepFreeze(exists ? { kind: "abandoned" as const, reason: "campaign_encounter_abandoned" as const, ...base, route: `/play/run/${encodeURIComponent(runId!)}` } : { kind: "unavailable" as const, reason: "campaign_abandoned_run_deleted" as const, ...base });
  }

  // ---------------------------------------------------------------------------------------------
  // POST /campaigns/:campaignId/runs — createCampaignRunExactlyOnce (§6.0)

  create(principal: Principal, campaignId: string, input: { readonly campaignVersion: number; readonly commandId: string }) {
    const commandId = parseCampaignCommandId(input.commandId);
    if (!Number.isSafeInteger(input.campaignVersion) || input.campaignVersion < 1) fail("INVALID_REQUEST", "campaignVersion must be a positive integer");
    const operandsDigest = campaignOperandsDigest({ campaignVersion: input.campaignVersion });
    const replay = (): unknown => {
      const stored = this.#store.creation(principal.learnerId, campaignId, commandId);
      if (stored === undefined) return undefined;
      if (stored.operandsDigest !== operandsDigest) fail("CAMPAIGN_COMMAND_REUSED", "This command id was already used with different operands");
      return JSON.parse(stored.resultPayload);
    };
    const prior = replay();
    if (prior !== undefined) return this.#created(principal, prior);
    const record = this.#registry.get(campaignId, input.campaignVersion);
    if (record === undefined) fail("CAMPAIGN_NOT_FOUND", `Campaign ${campaignId}@${input.campaignVersion} is not installed`);
    const existing = this.#store.runsForLearner(principal.learnerId).find((row) => row.campaignId === campaignId && row.status === "active");
    if (existing !== undefined) fail("CAMPAIGN_RUN_ACTIVE_EXISTS", "An active run of this campaign already exists", { activeCampaignRunId: existing.id });
    const campaignRunId = this.#newId();
    const at = this.#now();
    const document = record!.document;
    const result = { kind: "campaign_created", campaignRunId, campaignId, campaignVersion: document.version, documentDigest: record!.digest };
    const committed = this.#storage.campaignTransaction((tx) => {
      const raced = replay();
      if (raced !== undefined) return raced;
      tx.store.insertRun({ id: campaignRunId, learnerId: principal.learnerId, campaignId, campaignVersion: document.version, documentDigest: record!.digest, document: record!.canonical, status: "active", activeEncounterRunId: null, createdAt: at });
      tx.step("campaign_runs");
      tx.store.insertEvent(buildCampaignEventRow({
        campaignRunId, seq: 1, kind: "campaign_created", commandId, expectedRevision: null, operandsDigest,
        payload: { campaignId, campaignVersion: document.version, documentDigest: record!.digest, startingCharges: document.economy.startingCharges },
        response: result, at,
      }));
      tx.step("campaign_events");
      tx.store.insertCreation({ learnerId: principal.learnerId, campaignId, commandId, campaignVersion: document.version, operandsDigest, campaignRunId, resultPayload: canonicalizeJson(result), createdAt: at });
      tx.step("campaign_run_creations");
      return result;
    });
    return this.#created(principal, committed);
  }

  #created(principal: Principal, result: unknown) {
    const campaignRunId = (result as { campaignRunId: string }).campaignRunId;
    return deepFreeze({ result: result as Json, campaign: this.read(principal, campaignRunId) });
  }

  // ---------------------------------------------------------------------------------------------
  // Shared command envelope

  #replayEvent(campaignRunId: string, commandId: string, operandsDigest: string): AdmittedCampaignEvent | undefined {
    const stored = this.#store.eventByCommand(campaignRunId, commandId);
    if (stored === undefined) return undefined;
    if (stored.operandsDigest !== operandsDigest) fail("CAMPAIGN_COMMAND_REUSED", "This command id was already used with different operands");
    return stored;
  }

  #respond(principal: Principal, campaignRunId: string, stored: { readonly result: unknown }, replayed: boolean) {
    return deepFreeze({ result: stored.result as Json, replayed, campaign: this.read(principal, campaignRunId) });
  }

  #guardRevision(loaded: Loaded, expectedRevision: unknown): number {
    if (!Number.isSafeInteger(expectedRevision) || (expectedRevision as number) < 1) fail("INVALID_REQUEST", "expectedRevision must be a positive integer");
    if (loaded.state.status !== "active") fail("CAMPAIGN_RUN_TERMINAL", `This campaign run is ${loaded.state.status}`);
    if (loaded.state.revision !== expectedRevision) fail("CAMPAIGN_REVISION_STALE", "The campaign changed since this view loaded; reload it", { revision: loaded.state.revision });
    return expectedRevision as number;
  }

  /** Inside the write transaction: the head must still be exactly the expected revision. */
  #holdRevision(tx: CampaignTransaction, campaignRunId: string, expectedRevision: number): void {
    const head = tx.store.revision(campaignRunId);
    if (head !== expectedRevision) fail("CAMPAIGN_REVISION_STALE", "The campaign changed since this view loaded; reload it", { revision: head });
  }

  #appendOne<K extends keyof CampaignEventPayloads>(principal: Principal, loaded: Loaded, input: {
    readonly kind: K;
    readonly commandId: string;
    readonly expectedRevision: number;
    readonly operandsDigest: string;
    readonly payload: CampaignEventPayloads[K];
    readonly response: Json;
    readonly materialize: { readonly status: "active" | "completed" | "abandoned"; readonly pointer: string | null };
    readonly awards?: readonly { readonly id: string; readonly reward: Json }[];
  }) {
    const at = this.#now();
    const campaignRunId = loaded.row.id;
    const seq = input.expectedRevision + 1;
    const image: CampaignEventRowImage = buildCampaignEventRow({
      campaignRunId, seq, kind: input.kind, commandId: input.commandId, expectedRevision: input.expectedRevision,
      operandsDigest: input.operandsDigest as `sha256:${string}`, payload: input.payload, response: input.response, at,
    });
    // Fold the proposed next state before writing: the writer never accepts what a rebuild refuses.
    try {
      campaignRunState(loaded.document, [...loaded.events.map((item) => item.event), { seq, kind: input.kind, commandId: input.commandId, expectedRevision: input.expectedRevision, at, payload: input.payload } as CampaignEvent]);
    } catch (error) {
      fail("CAMPAIGN_SUBMIT_INVALID", (error as Error).message);
    }
    const committed = this.#storage.campaignTransaction((tx) => {
      const raced = this.#replayEvent(campaignRunId, input.commandId, input.operandsDigest);
      if (raced !== undefined) return { stored: raced.result, replayed: true };
      this.#holdRevision(tx, campaignRunId, input.expectedRevision);
      tx.store.insertEvent(image);
      tx.step("campaign_events");
      tx.store.setMaterialized(campaignRunId, input.materialize.status, input.materialize.pointer);
      tx.step("campaign_runs");
      for (const award of input.awards ?? []) {
        tx.store.insertAward({ campaignRunId, durableRewardId: award.id, rewardPayload: canonicalizeJson(award.reward), awardedAt: at });
        tx.step(`campaign_reward_awards:${award.id}`);
      }
      return { stored: JSON.parse(image.resultPayload) as unknown, replayed: false };
    });
    return this.#respond(principal, campaignRunId, { result: committed.stored }, committed.replayed);
  }

  // ---------------------------------------------------------------------------------------------
  // POST /campaign-runs/:id/nodes/:nodeId/start — startCampaignEncounterExactlyOnce (§5.3)

  async start(principal: Principal, campaignRunId: string, nodeId: string, input: { readonly expectedRevision: unknown; readonly commandId: unknown }, writerId: string) {
    const commandId = parseCampaignCommandId(input.commandId);
    const loaded = this.#owned(principal, campaignRunId);
    const operandsDigest = campaignOperandsDigest({ nodeId, expectedRevision: input.expectedRevision });
    const prior = this.#replayEvent(campaignRunId, commandId, operandsDigest);
    if (prior !== undefined) return this.#respond(principal, campaignRunId, prior, true);
    const expectedRevision = this.#guardRevision(loaded, input.expectedRevision);
    const active = loaded.state.activeEncounter;
    if (active !== null) fail("CAMPAIGN_ACTIVE_ENCOUNTER_MISMATCH", "Another encounter of this campaign is still active; declare it done first", { activeNodeId: active.nodeId, playRunId: active.playRunId });
    const location = locateCampaignNodes(loaded.document).find((candidate) => candidate.node.id === nodeId);
    const cursor = loaded.state.cursor;
    if (location === undefined || cursor.kind !== "active" || location.act !== cursor.act || location.layer !== cursor.layer) {
      fail("CAMPAIGN_NODE_UNAVAILABLE", "This node is not on the current layer of the map");
    }
    const node = location!.node;
    const lease: LeaseHolder = Object.freeze({ writerId, learnerId: principal.learnerId });
    const playRunId = `run-${randomUUID()}`;
    const seed = Math.floor(Math.random() * 2 ** 31);
    let packDigest: string;
    let request: Parameters<RunService["create"]>[0];
    if (node.encounter.kind === "pack") {
      const pack = this.#packs.get(node.encounter.packId);
      if (pack === undefined) fail("CAMPAIGN_SOURCE_UNAVAILABLE", `Pack ${node.encounter.packId} is not installed here`);
      packDigest = pack!.digest;
      request = { id: playRunId, session: { kind: "pack", packId: pack!.document.id, packDigest: pack!.digest }, policyConfig: await this.#policyConfig(pack), seed };
    } else {
      const encounter = node.encounter;
      const entry = resolveBotProfileReference(encounter.opponent.profile);
      if (!this.#botStartable(entry)) fail("CAMPAIGN_SOURCE_UNAVAILABLE", `Bot ${entry.reference.id} cannot start a game right now`);
      packDigest = canonicalSha256(encounter);
      request = {
        id: playRunId,
        session: { kind: "position", start: { fen: encounter.start.fen, side: encounter.start.learnerSide }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", profile: entry.reference } },
        policyConfig: await this.#policyConfig(undefined),
        seed,
      };
    }
    const at = this.#now();
    const seq = expectedRevision + 1;
    const response = { nodeId, playRunId, kind: node.encounter.kind };
    const image = buildCampaignEventRow({
      campaignRunId, seq, kind: "node_entered", commandId, expectedRevision, operandsDigest,
      payload: { nodeId, playRunId, inventoryEventSeq: seq, packDigest: packDigest! }, response, at,
    });
    let replayed: AdmittedCampaignEvent | undefined;
    let run: DrillRun;
    try {
      run = await this.#runs.create(request!, lease, {
        persist: (created, title) => {
          this.#storage.campaignTransaction((tx) => {
            const raced = this.#replayEvent(campaignRunId, commandId, operandsDigest);
            if (raced !== undefined) throw new ReplayedStart(raced);
            this.#holdRevision(tx, campaignRunId, expectedRevision);
            if (tx.store.run(campaignRunId)?.activeEncounterRunId !== null) fail("CAMPAIGN_ACTIVE_ENCOUNTER_MISMATCH", "Another encounter of this campaign is still active");
            tx.insertRun(created, lease, title);
            tx.step("drill_runs");
            tx.store.insertEvent(image);
            tx.step("campaign_events");
            tx.store.setMaterialized(campaignRunId, "active", created.id);
            tx.step("campaign_runs");
          });
        },
      });
    } catch (error) {
      if (!(error instanceof ReplayedStart)) throw error;
      replayed = error.stored;
    }
    if (replayed !== undefined) return this.#respond(principal, campaignRunId, replayed, true);
    void run!;
    return this.#respond(principal, campaignRunId, { result: JSON.parse(image.resultPayload) as unknown }, false);
  }

  // ---------------------------------------------------------------------------------------------
  // PUT /campaign-runs/:id/loadout (§4.5)

  loadout(principal: Principal, campaignRunId: string, input: { readonly equippedModuleIds: unknown; readonly expectedRevision: unknown; readonly commandId: unknown }) {
    const commandId = parseCampaignCommandId(input.commandId);
    const loaded = this.#owned(principal, campaignRunId);
    if (!Array.isArray(input.equippedModuleIds)) fail("CAMPAIGN_LOADOUT_INVALID", "equippedModuleIds must be an array of module ids");
    const requested = input.equippedModuleIds as unknown[];
    for (const value of requested) {
      if (typeof value !== "string") fail("CAMPAIGN_LOADOUT_FAMILY_INVALID", "Only modules are equipable; theory passages and resources are not");
      if (value === "campaign_rewind_charge") fail("CAMPAIGN_LOADOUT_FAMILY_INVALID", "The rewind charge is a resource, not an equipable module");
      if (!(MODULE_IDS as readonly string[]).includes(value as string) || value === "rules_floor") fail("CAMPAIGN_LOADOUT_INVALID", `${String(value)} is not an equipable module`);
    }
    const set = new Set(requested as string[]);
    const equipped = MODULE_IDS.filter((id): id is UnlockableModuleId => id !== "rules_floor" && set.has(id));
    const operandsDigest = campaignOperandsDigest({ equippedModuleIds: equipped, expectedRevision: input.expectedRevision });
    const prior = this.#replayEvent(campaignRunId, commandId, operandsDigest);
    if (prior !== undefined) return this.#respond(principal, campaignRunId, prior, true);
    const expectedRevision = this.#guardRevision(loaded, input.expectedRevision);
    const ceiling = new Set<string>(campaignModuleCeiling());
    for (const id of equipped) {
      if (!loaded.state.inventory.modules.owned.includes(id)) fail("CAMPAIGN_LOADOUT_INVALID", `${id} has not been earned in this campaign`);
      if (!ceiling.has(id)) fail("CAMPAIGN_LOADOUT_INVALID", `${id} is outside the campaign ceiling`);
    }
    return this.#appendOne(principal, loaded, {
      kind: "loadout_changed", commandId, expectedRevision, operandsDigest,
      payload: { equippedModuleIds: equipped },
      response: { equippedModuleIds: equipped },
      materialize: { status: "active", pointer: loaded.row.activeEncounterRunId },
    });
  }

  // ---------------------------------------------------------------------------------------------
  // POST /campaign-runs/:id/nodes/:nodeId/submit (§4.1; boss games §5)

  submit(principal: Principal, campaignRunId: string, nodeId: string, input: { readonly runId: unknown; readonly branchId?: unknown; readonly expectedRevision: unknown; readonly commandId: unknown }) {
    const commandId = parseCampaignCommandId(input.commandId);
    if (typeof input.runId !== "string" || input.runId === "") fail("CAMPAIGN_SUBMIT_INVALID", "runId is required");
    if (input.branchId !== undefined && (typeof input.branchId !== "string" || input.branchId === "")) fail("CAMPAIGN_SUBMIT_INVALID", "branchId must be a branch id");
    const runId = input.runId as string;
    const loaded = this.#owned(principal, campaignRunId);
    const operandsDigest = campaignOperandsDigest({ nodeId, runId, branchId: input.branchId ?? null, expectedRevision: input.expectedRevision });
    const prior = this.#replayEvent(campaignRunId, commandId, operandsDigest);
    if (prior !== undefined) return this.#respond(principal, campaignRunId, prior, true);
    const expectedRevision = this.#guardRevision(loaded, input.expectedRevision);
    const active = loaded.state.activeEncounter;
    if (active === null || active.nodeId !== nodeId || active.playRunId !== runId) fail("CAMPAIGN_ACTIVE_ENCOUNTER_MISMATCH", "This run is not the active encounter for this node");
    const stored = this.#storage.read(runId);
    if (stored === undefined || this.#storage.ownerLearnerId(runId) !== principal.learnerId) fail("CAMPAIGN_SUBMIT_INVALID", "The submitted run is not available");
    const run = stored!.run;
    const location = locateCampaignNodes(loaded.document).find((candidate) => candidate.node.id === nodeId)!;
    const node = location.node;
    const actIncome = { source: "act_seal" as const, act: location.act, amount: loaded.document.economy.actGrants[location.act] };
    const reward = node.reward ?? null;
    const selectedLayers = loaded.document.acts.reduce((sum, act) => sum + act.layers.length, 0);
    const terminal = loaded.state.seals.length + 1 === selectedLayers ? "completed" as const : "continue" as const;

    if (node.encounter.kind === "pack") {
      const branchId = typeof input.branchId === "string" ? input.branchId : run.activeCursor.branchId;
      if (!run.branches.some((branch) => branch.id === branchId)) fail("CAMPAIGN_SUBMIT_INVALID", "The branch does not belong to this run");
      const pack = this.#packs.get(node.encounter.packId);
      if (pack === undefined || run.packDigest !== pack.digest) fail("CAMPAIGN_SOURCE_UNAVAILABLE", "The encounter pack's pinned bytes are unavailable");
      const witness = deriveCampaignParticipationWitness(run, branchId, pack!.document as { readonly authoredBoundary?: { readonly plyHorizon?: number } });
      if (witness.kind === "refused") fail("CAMPAIGN_PARTICIPATION_REQUIRED", witness.detail, { reason: witness.reason });
      const witnessed = witness as Extract<typeof witness, { kind: "witnessed" }>;
      const payload: CampaignEventPayloads["node_committed"] = { nodeId, playRunId: runId, branchId, verdict: witnessed.verdict, participation: witnessed.witness, actIncome, reward, terminal };
      return this.#commitSeal(principal, loaded, "node_committed", commandId, expectedRevision, operandsDigest, payload, { nodeId, kind: "pack", verdict: witnessed.verdict, reward, actIncome, terminal });
    }

    // boss_game: only a validated rules-terminal `outcome.reached` seals; no authored verdict exists.
    const outcome = [...run.events].reverse().find((event) => event.type === "outcome.reached");
    if (outcome === undefined || outcome.type !== "outcome.reached") fail("CAMPAIGN_SUBMIT_INVALID", "The boss game has not reached a rules-terminal result");
    const terminalEvent = outcome as Extract<DrillRun["events"][number], { type: "outcome.reached" }>;
    const payload: CampaignEventPayloads["boss_game_committed"] = {
      nodeId,
      playRunId: runId,
      terminal: { outcome: terminalEvent.data.outcome, reason: ratedTerminalReason(run, terminalEvent.data.nodeId), terminalNodeId: terminalEvent.data.nodeId, terminalEventSeq: terminalEvent.seq },
      rating: { kind: "unrated" },
      actIncome,
      reward,
      campaignTerminal: terminal,
    };
    return this.#commitSeal(principal, loaded, "boss_game_committed", commandId, expectedRevision, operandsDigest, payload, { nodeId, kind: "boss_game", outcome: payload.terminal.outcome, reason: payload.terminal.reason, reward, actIncome, terminal });
  }

  #commitSeal<K extends "node_committed" | "boss_game_committed">(principal: Principal, loaded: Loaded, kind: K, commandId: string, expectedRevision: number, operandsDigest: string, payload: CampaignEventPayloads[K], summary: Readonly<Record<string, unknown>>) {
    const at = this.#now();
    const next = campaignRunState(loaded.document, [...loaded.events.map((item) => item.event), { seq: expectedRevision + 1, kind, commandId, expectedRevision, at, payload } as CampaignEvent]);
    // §6.1: completion and prestige awards are part of the terminal transition itself.
    const awards: { id: string; reward: Json }[] = [];
    if (next.status === "completed") {
      const prestige = campaignPrestigeEligible(next, loaded.document);
      for (const grant of loaded.document.durableRewards) {
        if (grant.reward.kind === "cosmetic_unlock") continue;
        if (grant.when === "prestige" && !prestige) continue;
        awards.push({ id: `${grant.reward.kind}:${grant.reward.campaignId}@${grant.reward.campaignVersion}`, reward: grant.reward as unknown as Json });
      }
    }
    return this.#appendOne(principal, loaded, {
      kind, commandId, expectedRevision, operandsDigest, payload,
      response: { ...summary, awards: awards.map((award) => award.id) } as Json,
      materialize: { status: next.status, pointer: null },
      awards,
    });
  }

  // ---------------------------------------------------------------------------------------------
  // POST /campaign-runs/:id/abandon (§4.4)

  abandon(principal: Principal, campaignRunId: string, input: { readonly expectedRevision: unknown; readonly commandId: unknown }) {
    const commandId = parseCampaignCommandId(input.commandId);
    const loaded = this.#owned(principal, campaignRunId);
    const operandsDigest = campaignOperandsDigest({ expectedRevision: input.expectedRevision });
    const prior = this.#replayEvent(campaignRunId, commandId, operandsDigest);
    if (prior !== undefined) return this.#respond(principal, campaignRunId, prior, true);
    const expectedRevision = this.#guardRevision(loaded, input.expectedRevision);
    const active = loaded.state.activeEncounter;
    return this.#appendOne(principal, loaded, {
      kind: "campaign_abandoned", commandId, expectedRevision, operandsDigest,
      payload: { activeNodeId: active?.nodeId ?? null, activePlayRunId: active?.playRunId ?? null },
      response: { activeNodeId: active?.nodeId ?? null, activePlayRunId: active?.playRunId ?? null },
      materialize: { status: "abandoned", pointer: null },
    });
  }

  // ---------------------------------------------------------------------------------------------
  // CampaignChargeGate (§2.2, [[D2986]]/[[D2987]])

  isActiveEncounter(runId: string): boolean {
    const row = this.#store.activeByPlayRun(runId);
    return row !== undefined && row.status === "active";
  }

  #chargeOperandsDigest(runId: string, operation: string, operands: unknown): `sha256:${string}` {
    return campaignOperandsDigest({ playRunId: runId, operation, operands: JSON.parse(canonicalizeJson(operands ?? null)) as unknown });
  }

  #requireCommand(command: CampaignCommandInput | undefined): CampaignCommandInput {
    if (command === undefined) fail("CAMPAIGN_ACTIVE_ENCOUNTER_MISMATCH", "A campaign encounter's rewind, fork, group or line entry must carry campaignCommand");
    parseCampaignCommandId(command!.commandId);
    if (!Number.isSafeInteger(command!.expectedCampaignRevision) || !Number.isSafeInteger(command!.expectedPlayRevision)) fail("INVALID_REQUEST", "campaignCommand revisions must be integers");
    return command!;
  }

  #storedCharge(campaignRunId: string, runId: string, operation: string, operands: unknown, command: CampaignCommandInput): CampaignChargedOutcome | undefined {
    const stored = this.#store.mutationCommand(campaignRunId, command.commandId);
    if (stored === undefined) return undefined;
    if (stored.operandsDigest !== this.#chargeOperandsDigest(runId, operation, operands) || stored.playRunId !== runId || stored.operation !== operation) {
      fail("CAMPAIGN_COMMAND_REUSED", "This command id was already used with different operands");
    }
    const result = JSON.parse(stored.resultPayload) as Readonly<Record<string, unknown>>;
    if (result.kind === "provider_failed") {
      throw new ServerError("ENGINE_UNAVAILABLE", "The provider failed for this command; nothing was spent", { details: { engineId: "campaign-group", retryAfterMs: 0, campaign: result } });
    }
    const current = this.#storage.read(runId);
    if (current === undefined) fail("CAMPAIGN_SUBMIT_INVALID", "The encounter run is no longer available");
    return Object.freeze({ kind: "replayed", run: current!.run, emitted: Object.freeze([]), campaign: result });
  }

  replay(input: { readonly runId: string; readonly lease: LeaseHolder; readonly operation: "rewind" | "fork" | "group" | "simulate_enter"; readonly operands: unknown; readonly command: CampaignCommandInput | undefined }): CampaignChargedOutcome | undefined {
    if (input.command === undefined) return undefined;
    const origin = this.#store.originForPlayRun(input.runId);
    if (origin === undefined) return undefined;
    const row = this.#store.run(origin.campaignRunId);
    if (row === undefined || row.learnerId !== input.lease.learnerId) return undefined;
    return this.#storedCharge(row.id, input.runId, input.operation, input.operands, this.#requireCommand(input.command));
  }

  charge(input: Parameters<CampaignChargeGate["charge"]>[0]): CampaignChargedOutcome {
    const command = this.#requireCommand(input.command);
    const operandsDigest = this.#chargeOperandsDigest(input.runId, input.operation, input.operands);
    let replayed: CampaignChargedOutcome | undefined;
    let committed: { run: DrillRun; emitted: DrillRun["events"]; result: Readonly<Record<string, unknown>> } | undefined;
    this.#storage.commitCampaignChargedMutation(input.runId, input.lease, (before, store) => {
      const row = store.activeByPlayRun(input.runId);
      if (row === undefined || row.status !== "active" || row.learnerId !== input.lease.learnerId) fail("CAMPAIGN_ACTIVE_ENCOUNTER_MISMATCH", "This run is no longer the active campaign encounter");
      const prior = this.#storedCharge(row!.id, input.runId, input.operation, input.operands, command);
      if (prior !== undefined) { replayed = prior; return { write: false }; }
      const loaded = this.#load(row!);
      if (loaded.state.revision !== command.expectedCampaignRevision) fail("CAMPAIGN_REVISION_STALE", "The campaign changed since this view loaded; reload it", { revision: loaded.state.revision });
      const playRevision = before.events.at(-1)?.seq ?? 0;
      if (playRevision !== command.expectedPlayRevision) fail("CAMPAIGN_REVISION_STALE", "The run changed since this view loaded; reload it", { playRevision });
      if (loaded.state.charges.balance <= 0) fail("CAMPAIGN_REWIND_EXHAUSTED", EXHAUSTED_MESSAGE, { chargeBalance: 0 });
      const next = input.mutate(before);
      const seq = loaded.state.revision + 1;
      const result = {
        kind: "committed",
        campaignRevision: seq,
        playRevision: next.run.events.at(-1)?.seq ?? 0,
        chargeBalance: loaded.state.charges.balance - 1,
        operationResult: JSON.parse(canonicalizeJson(next.operationResult ?? null)) as unknown,
      };
      const image = buildCampaignEventRow({
        campaignRunId: row!.id, seq, kind: "charge_spent", commandId: command.commandId, expectedRevision: loaded.state.revision, operandsDigest,
        payload: { playRunId: input.runId, mutationCommandId: command.commandId, operation: input.operation, amount: 1 }, response: result, at: this.#now(),
      });
      committed = { run: next.run, emitted: next.run.events.slice(before.events.length), result };
      return {
        write: true, run: next.run, prunedNodeIds: next.prunedNodeIds ?? [], plans: next.plans ?? [],
        campaign: () => {
          store.insertEvent(image);
          store.insertMutationCommand({
            campaignRunId: row!.id, commandId: command.commandId, playRunId: input.runId,
            expectedCampaignRevision: command.expectedCampaignRevision, expectedPlayRevision: command.expectedPlayRevision,
            operation: input.operation, operandsDigest, resultPayload: canonicalizeJson(result), settledAt: this.#now(),
          });
        },
      };
    });
    if (replayed !== undefined) return replayed;
    if (committed === undefined) fail("STORAGE_FAILURE", "The charged command did not settle");
    return Object.freeze({ kind: "committed", run: committed!.run, emitted: Object.freeze([...committed!.emitted]), campaign: Object.freeze(committed!.result) });
  }

  settleProviderFailure(input: Parameters<CampaignChargeGate["settleProviderFailure"]>[0]): never {
    if (input.command === undefined) throw input.error;
    const command = this.#requireCommand(input.command);
    const row = this.#store.activeByPlayRun(input.runId);
    if (row === undefined) throw input.error;
    const operandsDigest = this.#chargeOperandsDigest(input.runId, input.operation, input.operands);
    const result = { kind: "provider_failed", code: input.error.code };
    this.#storage.settleCampaignCommandWithoutEvent((store) => {
      const prior = store.mutationCommand(row.id, command.commandId);
      if (prior !== undefined) return;
      // A terminal no-event result: no play mutation, no charge, no revision advance.
      store.insertMutationCommand({
        campaignRunId: row.id, commandId: command.commandId, playRunId: input.runId,
        expectedCampaignRevision: command.expectedCampaignRevision, expectedPlayRevision: command.expectedPlayRevision,
        operation: input.operation, operandsDigest, resultPayload: canonicalizeJson(result), settledAt: this.#now(),
      });
    });
    throw new ServerError(input.error.code, input.error.message, { cause: input.error, details: { ...(input.error.details ?? {}), campaign: result } });
  }

  // ---------------------------------------------------------------------------------------------
  // Assistance receipt (§5.1) and origin join (§5.3)

  origin(runId: string) {
    const origin = this.#store.originForPlayRun(runId);
    if (origin === undefined) return undefined;
    const row = this.#store.run(origin.campaignRunId);
    if (row === undefined) return undefined;
    const entered = this.#store.events(row.id).find((item) => item.event.seq === origin.seq)?.event;
    if (entered?.kind !== "node_entered") return undefined;
    return Object.freeze({ campaignRunId: row.id, nodeId: entered.payload.nodeId, campaignDocumentDigest: row.documentDigest });
  }

  assistanceReceipt(runId: string, learnerId: string): CampaignEncounterReceipt | undefined {
    const origin = this.#store.originForPlayRun(runId);
    if (origin === undefined) return undefined;
    const row = this.#store.run(origin.campaignRunId);
    if (row === undefined || row.learnerId !== learnerId) return undefined;
    const loaded = this.#load(row);
    const entered = loaded.events.find((item) => item.event.seq === origin.seq);
    if (entered?.event.kind !== "node_entered") return undefined;
    const payload = entered.event.payload;
    // Inventory is folded ONLY through the encounter's own node_entered cut: a later reward or
    // loadout change never widens an earlier encounter, active or sealed ([[D2424]]).
    const atCut = campaignRunState(loaded.document, loaded.events.map((item) => item.event), origin.seq);
    const node = locateCampaignNodes(loaded.document).find((location) => location.node.id === payload.nodeId)?.node as CampaignNode | undefined;
    if (node === undefined) return undefined;
    const sealed = loaded.state.nodes[payload.nodeId]?.playRunId === runId;
    return issueCampaignEncounterReceipt({
      subject: {
        learnerId,
        campaignRunId: row.id,
        campaignDocumentDigest: row.documentDigest,
        campaignRevision: loaded.state.revision,
        nodeId: payload.nodeId,
        playRunId: runId,
        packDigest: payload.packDigest,
        workflowContext: "campaign",
        disclosureCeiling: "campaign_context",
        inventoryEventSeq: origin.seq,
        nodeEnteredEventDigest: entered.result.digest,
      },
      phase: row.activeEncounterRunId === runId ? "active" : sealed ? "sealed" : "abandoned",
      owned: atCut.inventory.modules.owned,
      equipped: atCut.inventory.modules.equipped,
      suppressed: [...(node.suppress ?? [])],
      theoryOwned: atCut.inventory.theory.owned,
    });
  }
}
