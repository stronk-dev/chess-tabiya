import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  workflowContextPolicy,
  type CampaignDocument,
  type ModuleId,
} from "@chess-tabiya/runtime";
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";

import type { PackValidationIssue } from "./pack-validation.js";

export interface CampaignPackLookup {
  get(id: string): unknown;
}

export interface CampaignValidationResult {
  readonly valid: boolean;
  readonly issues: readonly PackValidationIssue[];
  readonly document?: CampaignDocument;
}

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

export function validateCampaignDocument(value: unknown, packs: CampaignPackLookup): CampaignValidationResult {
  const validate = validator();
  if (!validate(value)) return Object.freeze({ valid: false, issues: Object.freeze((validate.errors ?? []).map(schemaIssue)) });

  const document = structuredClone(value) as CampaignDocument;
  const issues: PackValidationIssue[] = [];
  const nodeIds = new Set<string>();
  const campaignCeiling = new Set<ModuleId>(workflowContextPolicy("campaign").moduleCeiling);

  for (const [actIndex, act] of document.acts.entries()) {
    const bossNodes = act.layers.flatMap((layer) => layer.choices).filter((node) => node.boss === true);
    const finalChoices = act.layers[2].choices;
    if (bossNodes.length !== 1 || finalChoices.length !== 1 || finalChoices[0]?.boss !== true) {
      issues.push(issue("CAMPAIGN_BOSS_PLACEMENT", `/acts/${actIndex}/layers`, "each act must end in one unavoidable boss as the final layer's sole choice"));
    }
    for (const [layerIndex, layer] of act.layers.entries()) {
      if (layerIndex < 2 && layer.choices.length === 1) {
        issues.push(warning(
          "CAMPAIGN_PATH_WIDTH",
          `/acts/${actIndex}/layers/${layerIndex}/choices`,
          `act ${actIndex + 1} layer ${layerIndex + 1} offers one path; add alternatives unless this campaign is deliberately linear`,
        ));
      }
      for (const [choiceIndex, node] of layer.choices.entries()) {
        const path = `/acts/${actIndex}/layers/${layerIndex}/choices/${choiceIndex}`;
        if (nodeIds.has(node.id)) issues.push(issue("CAMPAIGN_NODE_ID_DUPLICATE", `${path}/id`, `duplicate campaign node id ${node.id}`));
        nodeIds.add(node.id);
        if (packs.get(node.encounter.packId) === undefined) issues.push(issue("CAMPAIGN_ENCOUNTER_PACK_UNKNOWN", `${path}/encounter/packId`, `unknown pack ${node.encounter.packId}`));
        if (node.reward !== undefined && !campaignCeiling.has(node.reward.moduleId)) issues.push(issue("CAMPAIGN_UNLOCK_OUTSIDE_CEILING", `${path}/reward/moduleId`, `module ${node.reward.moduleId} is outside the campaign context ceiling`));
      }
    }
  }

  for (const [index, moduleId] of document.startingModules.entries()) {
    if (!campaignCeiling.has(moduleId)) issues.push(issue("CAMPAIGN_UNLOCK_OUTSIDE_CEILING", `/startingModules/${index}`, `module ${moduleId} is outside the campaign context ceiling`));
  }

  const grants = document.economy.actGrants;
  if (!(grants.act1 >= grants.act2 && grants.act2 >= grants.act3)) {
    issues.push(issue("CAMPAIGN_ECONOMY_MONOTONE", "/economy/actGrants", "campaign grants must be non-increasing from act1 through act3"));
  }

  return Object.freeze({
    valid: issues.every((candidate) => candidate.severity !== "error"),
    issues: Object.freeze(issues),
    document,
  });
}
