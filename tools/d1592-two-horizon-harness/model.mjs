import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (path) => readFileSync(`${root}${path}`, "utf8");

function tuple(source, name) {
  const match = source.match(new RegExp(`export const ${name} = (?:Object\\.freeze\\()?\\[([\\s\\S]*?)\\]`));
  if (match === null) return [];
  return [...match[1].matchAll(/"([a-z0-9_-]+)"/g)].map((entry) => entry[1]);
}

export function authorityCensus() {
  const modules = tuple(read("packages/runtime/src/module-contract.ts"), "MODULE_IDS");
  const axes = read("apps/web/src/lib/theme/axes.ts");
  const schema = JSON.parse(read("schemas/campaign.schema.json"));
  const theoryRuntimeHits = [
    read("packages/runtime/src/index.ts"),
    read("apps/server/src/index.ts"),
  ].filter((source) => source.includes("TheoryPassageRef") || source.includes("TheoryBundle")).length;
  return Object.freeze({
    campaignSchemaVersion: Number(schema.$id.split(":").at(-1)),
    currentNodeRewardKinds: Object.freeze([schema.$defs.reward.properties.kind.const]),
    moduleIds: Object.freeze(modules),
    serverRuntimeTheoryAuthority: theoryRuntimeHits > 0,
    browserAppearanceIds: Object.freeze({
      appTheme: tuple(axes, "APP_THEME_IDS"),
      boardTheme: tuple(axes, "BOARD_THEME_IDS"),
      pieceSet: tuple(axes, "PIECE_SET_IDS"),
    }),
    sharedServerAppearanceAuthority: read("packages/runtime/src/index.ts").includes("APP_THEME_IDS"),
  });
}

export function projectInventory(input) {
  const ceiling = new Set(input.ceiling);
  const equipped = new Set(input.equipped);
  const resting = new Set(input.resting);
  const suppressed = new Map(input.suppressed.map((entry) => [entry.id, entry.reason]));
  const available = new Set(input.available);
  return Object.freeze(input.owned.map((id) => {
    const reason = !ceiling.has(id) ? "honesty_ceiling"
      : resting.has(id) ? "resting_until_act"
        : suppressed.has(id) ? suppressed.get(id)
          : !available.has(id) ? "source_unavailable"
            : !equipped.has(id) ? "not_equipped"
              : null;
    return Object.freeze({ id, owned: true, equipped: equipped.has(id), effective: reason === null, unavailableReason: reason });
  }));
}

export function applyPresetPresentation(state, _presetId) {
  // A preset may change presentation defaults. It is intentionally absent from the ownership and
  // equipment projection: campaign loadout changes are explicit inventory commands.
  return Object.freeze({ ...state, owned: Object.freeze([...state.owned]), equipped: Object.freeze([...state.equipped]) });
}

function layerIndex(node) {
  return node.act * 3 + node.layer;
}

function cartesian(layers) {
  return layers.reduce((paths, choices) => paths.flatMap((path) => choices.map((choice) => [...path, choice])), [[]]);
}

function consumes(node, rewardId) {
  return node.consumes?.includes(rewardId) === true && !node.suppresses?.includes(rewardId);
}

export function rewardUseDiagnostics(document) {
  const layers = document.acts.flatMap((actDefinition, act) => actDefinition.layers.map((choices, layer) => choices.map((node) => ({ ...node, act, layer }))));
  const rewards = layers.flat().filter((node) => node.reward !== undefined);
  return Object.freeze(rewards.map((source) => {
    const laterLayers = layers.slice(layerIndex(source) + 1);
    const paths = cartesian(laterLayers);
    const everyPathUses = paths.length > 0 && paths.every((path) => path.some((node) => consumes(node, source.reward.id)));
    const everyPathHasBossUse = paths.length > 0 && paths.every((path) => path.some((node) => node.boss === true && consumes(node, source.reward.id)));
    const anyLaterUse = laterLayers.flat().some((node) => consumes(node, source.reward.id));
    const anyBossUse = laterLayers.flat().some((node) => node.boss === true && consumes(node, source.reward.id));
    return Object.freeze({ sourceNodeId: source.id, rewardId: source.reward.id, anyLaterUse, everyPathUses, anyBossUse, everyPathHasBossUse, continuationCount: paths.length });
  }));
}

export function prestigeEligible({ status, selectedLayerCount, seals }) {
  return status === "completed" && seals.length === selectedLayerCount && seals.every((seal) => seal.verdict === "achieved");
}

export function lifecycle(events, selectedLayerCount) {
  let status = "active";
  let seals = 0;
  for (const event of events) {
    if (status !== "active") throw new TypeError("CAMPAIGN_LIFECYCLE_CONFLICT");
    if (event.kind === "node_sealed") seals += 1;
    if (event.kind === "campaign_abandoned") status = "abandoned";
    if (seals === selectedLayerCount) status = "completed";
  }
  return Object.freeze({ status, cursor: status === "active" ? { kind: "layer", ordinal: seals + 1 } : { kind: status } });
}

export function awardKey(command) {
  return [command.learnerId, command.campaignId, command.campaignVersion, command.runId, command.rewardId].join("|");
}

export function applyAward(store, command) {
  if (command.runStatus !== "completed") throw new TypeError("CAMPAIGN_AWARD_RUN_INCOMPLETE");
  const key = awardKey(command);
  if (store.has(key)) return Object.freeze({ inserted: false, award: store.get(key) });
  const award = Object.freeze({ ...command, key });
  store.set(key, award);
  return Object.freeze({ inserted: true, award });
}

export function fixtureCampaign({ deadBranch = false, bossesSuppress = false, lateReward = false } = {}) {
  let n = 0;
  const node = (act, layer, extra = {}) => ({ id: `n${++n}`, consumes: ["module:guided_hint"], ...extra, act, layer });
  const acts = Array.from({ length: 3 }, (_, act) => ({
    layers: [
      [node(act, 0, act === 0 && !lateReward ? { reward: { id: "module:guided_hint" } } : {})],
      [node(act, 1), ...(deadBranch && act === 0 ? [node(act, 1, { consumes: [] })] : [])],
      [node(act, 2, { boss: true, consumes: bossesSuppress ? [] : ["module:guided_hint"], suppresses: bossesSuppress ? ["module:guided_hint"] : [] })],
    ],
  }));
  if (lateReward) acts[2].layers[2][0].reward = { id: "module:guided_hint" };
  return Object.freeze({ acts });
}
