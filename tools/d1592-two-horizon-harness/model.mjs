// DISPOSABLE campaign RFC model. It specifies authoring semantics, not production code.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (path) => readFileSync(`${root}${path}`, "utf8");

const stable = (value) => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  return JSON.stringify(value);
};
export const digest = (value) => `sha256:${createHash("sha256").update(stable(value)).digest("hex")}`;
const clone = (value) => structuredClone(value);

function tuple(source, name) {
  const match = source.match(new RegExp(`export const ${name} = (?:Object\\.freeze\\()?\\[([\\s\\S]*?)\\]`));
  if (match === null) return [];
  return [...match[1].matchAll(/"([a-z0-9_-]+)"/g)].map((entry) => entry[1]);
}

export function authorityCensus() {
  const modules = tuple(read("packages/runtime/src/module-contract.ts"), "MODULE_IDS");
  const axes = read("apps/web/src/lib/theme/axes.ts");
  const schema = JSON.parse(read("schemas/campaign.schema.json"));
  return Object.freeze({
    campaignSchemaVersion: Number(schema.$id.split(":").at(-1)),
    currentNodeRewardKinds: Object.freeze([schema.$defs.reward.properties.kind.const]),
    moduleIds: Object.freeze(modules),
    serverRuntimeTheoryAuthority: [read("packages/runtime/src/index.ts"), read("apps/server/src/index.ts")]
      .some((source) => source.includes("TheoryPassageRef") || source.includes("TheoryBundle")),
    browserAppearanceIds: Object.freeze({ appTheme: tuple(axes, "APP_THEME_IDS"), boardTheme: tuple(axes, "BOARD_THEME_IDS"), pieceSet: tuple(axes, "PIECE_SET_IDS") }),
    sharedServerAppearanceAuthority: read("packages/runtime/src/index.ts").includes("APP_THEME_IDS"),
  });
}

export const CAMPAIGN_API_OPERATIONS = Object.freeze([
  "GET /campaigns",
  "POST /campaigns/:campaignId/runs",
  "GET /campaign-runs/:campaignRunId",
  "POST /campaign-runs/:campaignRunId/nodes/:nodeId/start",
  "PUT /campaign-runs/:campaignRunId/loadout",
  "POST /campaign-runs/:campaignRunId/nodes/:nodeId/submit",
  "POST /campaign-runs/:campaignRunId/abandon",
  "GET /campaign-runs/:campaignRunId/result",
  "GET /campaign-rewards",
  "GET /campaign-runs/:campaignRunId/nodes/:nodeId/review",
  "GET /campaigns/active",
]);

export function registerCampaignDocument(registry, document) {
  const key = `${document.id}@${document.version}`;
  const documentDigest = digest(document);
  const prior = registry.get(key);
  if (prior !== undefined && prior.digest !== documentDigest) throw new TypeError("CAMPAIGN_DOCUMENT_VERSION_MUTATED");
  const registered = Object.freeze({ id: document.id, version: document.version, digest: documentDigest, bytes: stable(document), document: clone(document) });
  registry.set(key, registered);
  return registered;
}

export function createCampaignRun(registered, input = {}) {
  if (digest(registered.document) !== registered.digest || stable(registered.document) !== registered.bytes) throw new TypeError("CAMPAIGN_DOCUMENT_DIGEST_MISMATCH");
  return {
    id: input.id ?? "campaign-run-1",
    learnerId: input.learnerId ?? "learner-1",
    campaignId: registered.id,
    campaignVersion: registered.version,
    campaignDocumentDigest: registered.digest,
    campaignDocument: registered.bytes,
    events: [{ seq: 1, kind: "campaign_created", commandId: input.commandId ?? "cmd-create-123456", expectedRevision: 0, payload: {} }],
    awards: [],
    status: "active",
  };
}

export function restoreCampaignRun(row) {
  const document = JSON.parse(row.campaignDocument);
  if (digest(document) !== row.campaignDocumentDigest) throw new TypeError("CAMPAIGN_DOCUMENT_DIGEST_MISMATCH");
  return { ...clone(row), document };
}

export function projectModuleInventory(input) {
  const ceiling = new Set(input.ceiling);
  const equipped = new Set(input.equipped);
  const resting = new Set(input.resting);
  const suppressed = new Set(input.suppressed);
  const available = new Set(input.available);
  return Object.freeze(input.owned.map((id) => {
    const reason = !ceiling.has(id) ? "honesty_ceiling" : resting.has(id) ? "resting_until_act"
      : suppressed.has(id) ? "boss_suppressed" : !available.has(id) ? "source_unavailable"
        : !equipped.has(id) ? "not_equipped" : null;
    return Object.freeze({ id, owned: true, equipped: equipped.has(id), effective: reason === null, unavailableReason: reason });
  }));
}

export function projectTheoryInventory(input) {
  const applicable = new Set(input.applicable);
  const authorized = new Set(input.authorized);
  const disclosable = new Set(input.disclosable);
  const available = new Set(input.available);
  return Object.freeze(input.owned.map((id) => {
    const reason = !applicable.has(id) ? "not_applicable" : !authorized.has(id) ? "authorizing_module_inactive"
      : !disclosable.has(id) ? "disclosure_ceiling" : !available.has(id) ? "source_unavailable" : null;
    return Object.freeze({ id, owned: true, effective: reason === null, unavailableReason: reason });
  }));
}

export function applyPresetPresentation(state, _presetId) {
  return Object.freeze({ modules: clone(state.modules), theory: clone(state.theory), charges: clone(state.charges) });
}

export function sealConsumerAuthority(kind, payload) {
  if (!['pack_capabilities', 'theory_applicability'].includes(kind)) throw new TypeError("CAMPAIGN_CONSUMER_AUTHORITY_UNAVAILABLE");
  return Object.freeze({ kind, payload: clone(payload), digest: digest({ kind, payload }) });
}
const CONSUMER_AUTHORITIES = new WeakSet();
export function admitConsumerAuthority(kind, payload) {
  const value = sealConsumerAuthority(kind, payload);
  CONSUMER_AUTHORITIES.add(value);
  return value;
}
export function compileCampaignConsumers(packAuthority, theoryAuthority, resourceAvailable) {
  if (!CONSUMER_AUTHORITIES.has(packAuthority) || !CONSUMER_AUTHORITIES.has(theoryAuthority)) throw new TypeError("CAMPAIGN_CONSUMER_AUTHORITY_UNAVAILABLE");
  return Object.freeze([
    ...packAuthority.payload.modules.map((moduleId) => `module:${moduleId}`),
    ...theoryAuthority.payload.passages.map((passageId) => `theory:${passageId}`),
    ...(resourceAvailable ? ["resource:campaign_rewind_charge"] : []),
  ].sort());
}

function layerIndex(node) { return node.act * 3 + node.layer; }
function cartesian(layers) { return layers.reduce((paths, choices) => paths.flatMap((path) => choices.map((choice) => [...path, choice])), [[]]); }
function consumes(node, rewardId) { return node.consumes?.includes(rewardId) === true && !node.suppresses?.includes(rewardId); }

export function rewardUseDiagnostics(document) {
  const layers = document.acts.flatMap((actDefinition, act) => actDefinition.layers.map((choices, layer) => choices.map((node) => ({ ...node, act, layer }))));
  return Object.freeze(layers.flat().filter((node) => node.reward !== undefined).map((source) => {
    const laterLayers = layers.slice(layerIndex(source) + 1);
    const paths = cartesian(laterLayers);
    return Object.freeze({ sourceNodeId: source.id, rewardId: source.reward.id,
      anyLaterUse: laterLayers.flat().some((node) => consumes(node, source.reward.id)),
      everyPathUses: paths.length > 0 && paths.every((path) => path.some((node) => consumes(node, source.reward.id))),
      anyBossUse: laterLayers.flat().some((node) => node.boss === true && consumes(node, source.reward.id)),
      everyPathHasBossUse: paths.length > 0 && paths.every((path) => path.some((node) => node.boss === true && consumes(node, source.reward.id))),
      continuationCount: paths.length });
  }));
}

export function prestigeEligible({ status, selectedLayerCount, seals }) {
  return status === "completed" && seals.length === selectedLayerCount && seals.every((seal) => seal.verdict === "achieved");
}

function selectedLayerCount(document) {
  return document.acts.reduce((count, act) => count + act.layers.length, 0);
}

export function foldCampaign(run) {
  const document = JSON.parse(run.campaignDocument);
  if (digest(document) !== run.campaignDocumentDigest) throw new TypeError("CAMPAIGN_DOCUMENT_DIGEST_MISMATCH");
  const state = { status: "active", seals: [], modules: { owned: [...(document.startingModules ?? [])], equipped: [...(document.startingModules ?? [])] },
    theory: { owned: [] }, charges: { entries: [{ kind: "starting", amount: document.economy.startingCharges, campaignRunId: run.id }], startingIncome: document.economy.startingCharges, actIncome: 0, rewardIncome: 0, spent: 0, balance: document.economy.startingCharges } };
  for (const event of run.events) {
    if (event.kind === "campaign_created") continue;
    if (state.status !== "active") throw new TypeError("CAMPAIGN_LIFECYCLE_CONFLICT");
    if (event.kind === "node_committed") {
      const payload = event.payload;
      state.seals.push({ nodeId: payload.nodeId, verdict: payload.verdict });
      const expectedCount = selectedLayerCount(document);
      const expectedTerminal = state.seals.length === expectedCount ? "completed" : "continue";
      if (state.seals.length > expectedCount || payload.terminal !== expectedTerminal) {
        throw new TypeError("CAMPAIGN_TERMINAL_CURSOR_MISMATCH");
      }
      state.charges.entries.push({ kind: "act_seal", nodeId: payload.nodeId, act: payload.actIncome.act, amount: payload.actIncome.amount });
      state.charges.actIncome += payload.actIncome.amount;
      if (payload.reward?.kind === "module_unlock") {
        if (!state.modules.owned.includes(payload.reward.moduleId)) state.modules.owned.push(payload.reward.moduleId);
        if (!state.modules.equipped.includes(payload.reward.moduleId)) state.modules.equipped.push(payload.reward.moduleId);
      } else if (payload.reward?.kind === "theory_unlock") {
        const id = `${payload.reward.bundleId}/${payload.reward.passageId}`;
        if (!state.theory.owned.includes(id)) state.theory.owned.push(id);
      } else if (payload.reward?.kind === "resource_grant") {
        state.charges.entries.push({ kind: "reward_grant", nodeId: payload.nodeId, rewardIdentity: payload.reward.rewardIdentity, amount: payload.reward.amount });
        state.charges.rewardIncome += payload.reward.amount;
      }
      if (payload.terminal === "completed") state.status = "completed";
    } else if (event.kind === "loadout_changed") {
      if (event.payload.equippedModuleIds.some((id) => !state.modules.owned.includes(id))) throw new TypeError("CAMPAIGN_LOADOUT_INVALID");
      state.modules.equipped = [...event.payload.equippedModuleIds].sort();
    } else if (event.kind === "charge_spent") {
      state.charges.entries.push({ kind: "mutation_spend", ...event.payload });
      state.charges.spent += event.payload.amount;
    } else if (event.kind === "campaign_abandoned") state.status = "abandoned";
  }
  state.charges.balance = state.charges.startingIncome + state.charges.actIncome + state.charges.rewardIncome - state.charges.spent;
  if (state.charges.balance < 0) throw new TypeError("CAMPAIGN_REWIND_EXHAUSTED");
  return state;
}

const commandDigest = (command) => digest(command);
function priorCommand(run, commandId) { return run.events.find((event) => event.commandId === commandId); }

export function submitNode(run, input, options = {}) {
  const prior = priorCommand(run, input.commandId);
  const operands = commandDigest(input);
  if (prior !== undefined) {
    if (prior.operandsDigest !== operands) throw new TypeError("CAMPAIGN_COMMAND_REUSED");
    return Object.freeze({ kind: "replayed", event: clone(prior), awards: clone(run.awards.filter((award) => award.commandId === input.commandId)) });
  }
  if (input.expectedRevision !== run.events.length) throw new TypeError("CAMPAIGN_REVISION_STALE");
  const before = foldCampaign(run);
  if (before.status !== "active") throw new TypeError("CAMPAIGN_RUN_TERMINAL");
  const document = JSON.parse(run.campaignDocument);
  const terminal = before.seals.length + 1 === selectedLayerCount(document);
  const event = { seq: run.events.length + 1, kind: "node_committed", commandId: input.commandId,
    expectedRevision: input.expectedRevision, operandsDigest: operands,
    payload: { nodeId: input.nodeId, runId: input.playRunId, branchId: input.branchId, verdict: input.verdict,
      actIncome: { source: "act_seal", act: input.act, amount: input.actIncome }, reward: input.reward ?? null,
      terminal: terminal ? "completed" : "continue" } };
  const next = clone(run);
  next.events.push(event);
  const state = foldCampaign(next);
  const awards = terminal ? (input.durableRewards ?? []).filter((reward) => reward.when === "completed" || (reward.when === "prestige" && prestigeEligible({ status: state.status, selectedLayerCount: selectedLayerCount(document), seals: state.seals }))).map((reward) => ({ commandId: input.commandId, reward: reward.reward, key: digest([run.learnerId, run.id, reward.reward]) })) : [];
  if (options.failAt === "event" || options.failAt === "fold" || options.failAt === "award") throw new TypeError(`INJECTED_${options.failAt.toUpperCase()}`);
  run.events.push(event);
  run.awards.push(...awards);
  run.status = state.status;
  return Object.freeze({ kind: "committed", event: clone(event), awards: clone(awards), state });
}

export function changeLoadout(run, input) {
  if (input.equippedModuleIds.some((id) => id.startsWith("theory:") || id.startsWith("resource:"))) throw new TypeError("CAMPAIGN_LOADOUT_FAMILY_INVALID");
  const state = foldCampaign(run);
  if (input.equippedModuleIds.some((id) => !state.modules.owned.includes(id))) throw new TypeError("CAMPAIGN_LOADOUT_INVALID");
  const prior = priorCommand(run, input.commandId);
  const operands = commandDigest(input);
  if (prior !== undefined) {
    if (prior.operandsDigest !== operands) throw new TypeError("CAMPAIGN_COMMAND_REUSED");
    return clone(prior);
  }
  if (input.expectedRevision !== run.events.length) throw new TypeError("CAMPAIGN_REVISION_STALE");
  const event = { seq: run.events.length + 1, kind: "loadout_changed", commandId: input.commandId,
    expectedRevision: input.expectedRevision, operandsDigest: operands,
    payload: { equippedModuleIds: [...new Set(input.equippedModuleIds)].sort() } };
  run.events.push(event);
  return clone(event);
}

export function makeCampaignRunOrigin(run, nodeId) {
  return Object.freeze({ kind: "campaign_encounter", campaignRunId: run.id, nodeId, campaignDocumentDigest: run.campaignDocumentDigest });
}

export function fixtureCampaign({ deadBranch = false, bossesSuppress = false, lateReward = false } = {}) {
  const document = JSON.parse(read("tools/campaign-two-horizon-author-contract/fixtures/campaign-contract.json"));
  if (deadBranch) document.acts[0].layers[1].push({ id: "dead-branch", consumes: [], act: 0, layer: 1 });
  if (bossesSuppress) {
    for (const act of document.acts) {
      for (const boss of act.layers[2]) {
        boss.consumes = [];
        boss.suppresses = ["module:guided_hint"];
      }
    }
  }
  if (lateReward) {
    delete document.acts[0].layers[0][0].reward;
    document.acts[2].layers[2][0].reward = { id: "module:guided_hint" };
  }
  return Object.freeze(document);
}
