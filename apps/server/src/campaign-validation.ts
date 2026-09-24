import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";

import {
  campaignModuleCeiling,
  campaignRewardRef,
  campaignRewardRefKey,
  locateCampaignNodes,
  resolveBotProfileReference,
  type CampaignDocument,
  type CampaignNode,
  type CampaignRunRewardRef,
  type LocatedCampaignNode,
  type ModuleId,
} from "@chess-tabiya/runtime";
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";

import type { PackValidationIssue } from "./pack-validation.js";

// rfc/campaign-core.md §1–§3 (+ rfc/campaign-boss-games.md §1–§2): the complete document validator.
// [[D2990]]: the strict schema closes every object and member domain; the semantic pass below then
// checks every closed-foundation rule the schema cannot express. Nothing is cast past a check.

export interface CampaignPackRecordView {
  readonly start?: { readonly fen?: unknown; readonly side?: unknown };
  readonly authoredBoundary?: unknown;
  readonly title?: unknown;
}

export interface CampaignPackLookup {
  get(id: string): CampaignPackRecordView | undefined;
}

export interface CampaignValidationResult {
  readonly valid: boolean;
  readonly issues: readonly PackValidationIssue[];
  readonly document?: CampaignDocument;
}

/** learner-rating's calibrated material floor, counted on the exact start FEN (boss-games §2). */
export const BOSS_GAME_MATERIAL_FLOOR = 21;

let compiled: ValidateFunction | undefined;

function validator(): ValidateFunction {
  if (compiled !== undefined) return compiled;
  const path = fileURLToPath(new URL("../../../schemas/campaign.schema.json", import.meta.url));
  const schema = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  compiled = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  return compiled;
}

function token(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function issue(code: string, path: string, message: string, source: PackValidationIssue["source"] = "runtime"): PackValidationIssue {
  return Object.freeze({ severity: "error", source, code, path, message });
}

function warning(code: string, path: string, message: string): PackValidationIssue {
  return Object.freeze({ severity: "warning", source: "runtime", code, path, message });
}

function schemaIssue(error: ErrorObject): PackValidationIssue {
  const missing = error.keyword === "required" ? error.params.missingProperty : undefined;
  const path = typeof missing === "string" ? `${error.instancePath}/${token(missing)}` : error.instancePath || "/";
  return issue(`SCHEMA_${error.keyword.toUpperCase()}`, path || "/", error.message ?? `failed ${error.keyword}`, "schema");
}

function nodePath(location: LocatedCampaignNode, document: CampaignDocument): string {
  const choice = document.acts[location.actIndex]!.layers[location.layer - 1]!.choices.indexOf(location.node);
  return `/acts/${location.actIndex}/layers/${location.layer - 1}/choices/${choice}`;
}

/**
 * The compiled consumer set of one node, from the same runtime registries used during play
 * (§3.4). A module is consumable where the campaign ceiling admits it and the node does not
 * suppress it; the rewind charge is consumable in every encounter (every encounter kind exposes the
 * four charged gestures). Theory has no accepted applicability export yet, so no node consumes it.
 * Pack-capability narrowing joins when `derivePackCapabilityRequirements` is accepted and landed.
 */
export function compiledNodeConsumers(node: CampaignNode): (ref: CampaignRunRewardRef) => boolean {
  const ceiling = new Set<ModuleId>(campaignModuleCeiling());
  const suppressed = new Set<ModuleId>(node.suppress ?? []);
  return (ref) => ref.kind === "module_unlock"
    ? ceiling.has(ref.moduleId) && !suppressed.has(ref.moduleId)
    : ref.kind === "resource_grant";
}

function startPieceCount(fen: string): number {
  return fen.split(" ")[0]!.replace(/[^a-zA-Z]/gu, "").length;
}

export function validateCampaignDocument(value: unknown, packs: CampaignPackLookup): CampaignValidationResult {
  const validate = validator();
  if (!validate(value)) return Object.freeze({ valid: false, issues: Object.freeze((validate.errors ?? []).map(schemaIssue)) });

  const document = structuredClone(value) as CampaignDocument;
  const issues: PackValidationIssue[] = [];
  const nodeIds = new Set<string>();
  const ceiling = new Set<ModuleId>(campaignModuleCeiling());
  const locations = locateCampaignNodes(document);

  if (document.publication.channel === "official") {
    // [[D2991]]/[[D2992]]: the official channel needs an authenticated, durable owner chess-review
    // decision and the owning curriculum registries (target brackets, theory passages, evidence,
    // provider operations). Neither exists, so no local factory can mint the official badge.
    issues.push(issue("CAMPAIGN_OFFICIAL_AUTHORITY_UNAVAILABLE", "/publication", "official publication needs the owner review store and curriculum registries, which have not landed"));
  }

  for (const [actIndex, act] of document.acts.entries()) {
    const bossNodes = act.layers.flatMap((layer) => layer.choices).filter((node) => node.boss === true);
    const finalChoices = act.layers[2].choices;
    if (bossNodes.length !== 1 || finalChoices.length !== 1 || finalChoices[0]?.boss !== true) {
      issues.push(issue("CAMPAIGN_BOSS_PLACEMENT", `/acts/${actIndex}/layers`, "each act must end in one unavoidable boss as the final layer's sole choice"));
    }
    for (const [layerIndex, layer] of act.layers.entries()) {
      if (layerIndex < 2 && layer.choices.length === 1) {
        issues.push(warning("CAMPAIGN_PATH_WIDTH", `/acts/${actIndex}/layers/${layerIndex}/choices`, `act ${actIndex + 1} layer ${layerIndex + 1} offers one path; add alternatives unless this campaign is deliberately linear`));
      }
    }
  }

  for (const location of locations) {
    const { node } = location;
    const path = nodePath(location, document);
    if (nodeIds.has(node.id)) issues.push(issue("CAMPAIGN_NODE_ID_DUPLICATE", `${path}/id`, `duplicate campaign node id ${node.id}`));
    nodeIds.add(node.id);
    const encounter = node.encounter;
    if (encounter.kind === "pack") {
      if (packs.get(encounter.packId) === undefined) issues.push(issue("CAMPAIGN_ENCOUNTER_PACK_UNKNOWN", `${path}/encounter/packId`, `unknown pack ${encounter.packId}`));
    } else {
      // rfc/campaign-boss-games.md §2 CAMPAIGN_BOSS_GAME_PLACEMENT.
      if (location.act !== "act2" || location.layer !== 3 || node.boss !== true) {
        issues.push(issue("CAMPAIGN_BOSS_GAME_PLACEMENT", `${path}/encounter`, "only the Act-II layer-3 sole-choice boss may be a boss_game"));
      }
      let position: Chess | undefined;
      try {
        position = Chess.fromSetup(parseFen(encounter.start.fen).unwrap()).unwrap();
      } catch {
        issues.push(issue("CAMPAIGN_BOSS_GAME_PLACEMENT", `${path}/encounter/start/fen`, "the boss start FEN is not a legal standard-chess position"));
      }
      if (position !== undefined) {
        if (position.turn !== encounter.start.learnerSide) issues.push(issue("CAMPAIGN_BOSS_GAME_PLACEMENT", `${path}/encounter/start/learnerSide`, "the learner side must be the side to move"));
        if (position.isEnd()) issues.push(issue("CAMPAIGN_BOSS_GAME_PLACEMENT", `${path}/encounter/start/fen`, "the boss start position is already terminal"));
        if (startPieceCount(encounter.start.fen) < BOSS_GAME_MATERIAL_FLOOR) issues.push(issue("CAMPAIGN_BOSS_GAME_PLACEMENT", `${path}/encounter/start/fen`, `the boss start carries fewer than ${BOSS_GAME_MATERIAL_FLOOR} pieces`));
      }
      try {
        resolveBotProfileReference(encounter.opponent.profile);
      } catch (error) {
        issues.push(issue("CAMPAIGN_BOSS_PROFILE_UNKNOWN", `${path}/encounter/opponent/profile`, error instanceof Error ? error.message : "the bot profile is not registered"));
      }
      if (encounter.rating === "rated_when_clean") {
        // No bot-profile calibration authority has landed; a rated boss cannot resolve its operands.
        issues.push(issue("CAMPAIGN_BOSS_CALIBRATION_UNAVAILABLE", `${path}/encounter/rating`, "rated_when_clean needs an admitted exact-digest calibration receipt, and none exists"));
      } else if (encounter.opponent.calibration !== undefined) {
        issues.push(issue("CAMPAIGN_BOSS_CALIBRATION_UNAVAILABLE", `${path}/encounter/opponent/calibration`, "an unrated boss carries no calibration reference"));
      }
      const briefing = packs.get(encounter.briefingRef.packId);
      if (briefing === undefined) {
        issues.push(issue("CAMPAIGN_ENCOUNTER_PACK_UNKNOWN", `${path}/encounter/briefingRef/packId`, `unknown briefing pack ${encounter.briefingRef.packId}`));
      } else if (briefing.start?.fen !== encounter.start.fen || briefing.start?.side !== encounter.start.learnerSide) {
        issues.push(issue("CAMPAIGN_BOSS_BRIEFING_MISMATCH", `${path}/encounter/briefingRef`, "the briefing pack's authored start must equal the boss start FEN and learner side"));
      }
    }
    if (node.reward?.kind === "module_unlock" && !ceiling.has(node.reward.moduleId)) {
      issues.push(issue("CAMPAIGN_UNLOCK_OUTSIDE_CEILING", `${path}/reward/moduleId`, `module ${node.reward.moduleId} is outside the campaign context ceiling`));
    }
    if (node.reward?.kind === "theory_unlock") {
      issues.push(issue("CAMPAIGN_SOURCE_UNAVAILABLE", `${path}/reward`, "theory passages need the theory-knowledge-pipeline authority, which has not landed"));
    }
  }

  for (const [index, moduleId] of document.startingModules.entries()) {
    if (!ceiling.has(moduleId)) issues.push(issue("CAMPAIGN_UNLOCK_OUTSIDE_CEILING", `/startingModules/${index}`, `module ${moduleId} is outside the campaign context ceiling`));
  }

  const grants = document.economy.actGrants;
  if (!(grants.act1 >= grants.act2 && grants.act2 >= grants.act3)) {
    issues.push(issue("CAMPAIGN_ECONOMY_MONOTONE", "/economy/actGrants", "campaign grants must be non-increasing from act1 through act3"));
  }

  // §3.6 durable grants: exactly one completion mark (completed) and one prestige mark (prestige)
  // naming this exact document; cosmetics need the shared appearance catalog ([[D1696]]).
  const identities = new Set<string>();
  let completion = 0;
  let prestige = 0;
  for (const [index, grant] of document.durableRewards.entries()) {
    const path = `/durableRewards/${index}`;
    const reward = grant.reward;
    const identity = reward.kind === "cosmetic_unlock" ? `cosmetic:${reward.target.kind}:${reward.target.id}` : `${reward.kind}:${reward.campaignId}@${reward.campaignVersion}`;
    if (identities.has(identity)) issues.push(issue("CAMPAIGN_DURABLE_REWARD_DUPLICATE", path, `duplicate durable reward ${identity}`));
    identities.add(identity);
    if (reward.kind === "cosmetic_unlock") {
      issues.push(issue("CAMPAIGN_SOURCE_UNAVAILABLE", path, "cosmetic unlocks need the shared server-readable appearance catalog, which has not landed"));
      continue;
    }
    if (reward.campaignId !== document.id || reward.campaignVersion !== document.version) issues.push(issue("CAMPAIGN_DURABLE_REWARD_FOREIGN", path, "a mark must name this exact campaign id and version"));
    if (reward.kind === "completion_mark") {
      completion += 1;
      if (grant.when !== "completed") issues.push(issue("CAMPAIGN_DURABLE_REWARD_GATE", `${path}/when`, "a completion mark is gated on completion"));
    } else {
      prestige += 1;
      if (grant.when !== "prestige") issues.push(issue("CAMPAIGN_DURABLE_REWARD_GATE", `${path}/when`, "a prestige mark is gated on prestige"));
    }
  }
  if (completion !== 1 || prestige !== 1) issues.push(issue("CAMPAIGN_DURABLE_REWARD_GATE", "/durableRewards", "exactly one completion mark and one prestige mark are required"));

  checkRewardOpportunity(document, locations, issues);

  return Object.freeze({
    valid: issues.every((candidate) => candidate.severity !== "error"),
    issues: Object.freeze(issues),
    document,
  });
}

/**
 * §3.4: declared `consumes` must set-equal the compiled consumer set of rewards reachable before the
 * node, and every reward needs a later consumer AND a later boss consumer on EVERY continuation.
 * The result proves opportunity only — never usefulness, learning or cause.
 */
function checkRewardOpportunity(document: CampaignDocument, locations: readonly LocatedCampaignNode[], issues: PackValidationIssue[]): void {
  const layers: LocatedCampaignNode[][] = [];
  for (const location of locations) (layers[location.layerOrdinal] ??= []).push(location);
  for (const location of locations) {
    const path = nodePath(location, document);
    const earlier = layers.slice(0, location.layerOrdinal).flat().flatMap((candidate) => candidate.node.reward === undefined ? [] : [campaignRewardRef(candidate.node.reward)]);
    if (location.node.consumes !== undefined) {
      const consumes = compiledNodeConsumers(location.node);
      const compiled = new Set(earlier.filter(consumes).map(campaignRewardRefKey));
      const declared = location.node.consumes.map(campaignRewardRefKey);
      const declaredSet = new Set(declared);
      if (declared.length !== declaredSet.size || compiled.size !== declaredSet.size || [...compiled].some((key) => !declaredSet.has(key))) {
        issues.push(issue("CAMPAIGN_CONSUMER_DECLARATION_MISMATCH", `${path}/consumes`, `declared consumers [${[...declaredSet].sort().join(", ")}] differ from the compiled set [${[...compiled].sort().join(", ")}]`));
      }
    }
    const reward = location.node.reward;
    if (reward === undefined || reward.kind === "theory_unlock") continue;
    const ref = campaignRewardRef(reward);
    const later = layers.slice(location.layerOrdinal + 1);
    // A continuation without any later consumer exists iff every later layer has a non-consumer.
    const deadContinuation = later.length === 0 || later.every((layer) => layer.some((candidate) => !compiledNodeConsumers(candidate.node)(ref)));
    if (deadContinuation) {
      const witness = later.map((layer) => layer.find((candidate) => !compiledNodeConsumers(candidate.node)(ref))!.node.id);
      issues.push(issue("CAMPAIGN_REWARD_NO_LATER_USE", `${path}/reward`, `reward ${campaignRewardRefKey(ref)} has a continuation with no later consumer${witness.length === 0 ? " (it is on the final boss)" : `: ${witness.join(" → ")}`}`));
      continue;
    }
    const laterBosses = later.flat().filter((candidate) => candidate.node.boss === true);
    if (!laterBosses.some((candidate) => compiledNodeConsumers(candidate.node)(ref))) {
      issues.push(issue("CAMPAIGN_REWARD_NO_BOSS_USE", `${path}/reward`, `reward ${campaignRewardRefKey(ref)} reaches no later boss consumer (every later boss suppresses it)`));
    }
  }
}
