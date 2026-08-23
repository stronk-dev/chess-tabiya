import { describe, expect, it } from "vitest";

import type { CampaignDocument, CampaignNode, UnlockableModuleId } from "@chess-tabiya/runtime";

import { validateCampaignDocument } from "./campaign-validation.js";

const PACK_ID = "registered-pack";
const packs = Object.freeze({ get: (id: string) => id === PACK_ID ? Object.freeze({ id }) : undefined });

function node(id: string, options: { readonly boss?: true; readonly reward?: UnlockableModuleId } = {}): CampaignNode {
  return Object.freeze({
    id,
    encounter: Object.freeze({ kind: "pack" as const, packId: PACK_ID }),
    ...(options.boss === true ? { boss: true as const, suppress: Object.freeze(["guided_hint" as const]) } : {}),
    ...(options.reward === undefined ? {} : { reward: Object.freeze({ kind: "module_unlock" as const, moduleId: options.reward }) }),
  });
}

function campaign(): CampaignDocument {
  return Object.freeze({
    id: "seed-endgames",
    title: "Seed endgames",
    version: 1,
    economy: Object.freeze({ startingCharges: 3, actGrants: Object.freeze({ act1: 3, act2: 2, act3: 1 }), validation: "candidate" as const }),
    startingModules: Object.freeze(["sight_on_request" as const]),
    acts: Object.freeze([
      Object.freeze({ id: "act1" as const, layers: Object.freeze([
        Object.freeze({ choices: Object.freeze([node("a1-l1", { reward: "postcommit_nudge" })]) }),
        Object.freeze({ choices: Object.freeze([node("a1-l2")]) }),
        Object.freeze({ choices: Object.freeze([node("a1-boss", { boss: true })]) }),
      ] as const) }),
      Object.freeze({ id: "act2" as const, layers: Object.freeze([
        Object.freeze({ choices: Object.freeze([node("a2-l1", { reward: "structure_nudge" })]) }),
        Object.freeze({ choices: Object.freeze([node("a2-l2")]) }),
        Object.freeze({ choices: Object.freeze([node("a2-boss", { boss: true })]) }),
      ] as const) }),
      Object.freeze({ id: "act3" as const, layers: Object.freeze([
        Object.freeze({ choices: Object.freeze([node("a3-l1", { reward: "theory_breadcrumb" })]) }),
        Object.freeze({ choices: Object.freeze([node("a3-l2")]) }),
        Object.freeze({ choices: Object.freeze([node("a3-boss", { boss: true })]) }),
      ] as const) }),
    ] as const),
  });
}

function codes(value: unknown): readonly string[] {
  return validateCampaignDocument(value, packs).issues.map((issue) => issue.code);
}

describe("campaign document validation", () => {
  it("accepts the closed three-act, nine-node seed shape", () => {
    const result = validateCampaignDocument(campaign(), packs);
    expect(result.valid, JSON.stringify(result.issues)).toBe(true);
    expect(result.document?.acts.flatMap((act) => act.layers.flatMap((layer) => layer.choices))).toHaveLength(9);
  });

  it("refuses unknown packs", () => {
    const value = structuredClone(campaign()) as unknown as { acts: { layers: { choices: { encounter: { packId: string } }[] }[] }[] };
    value.acts[0]!.layers[0]!.choices[0]!.encounter.packId = "missing-pack";
    expect(codes(value)).toContain("CAMPAIGN_ENCOUNTER_PACK_UNKNOWN");
  });

  it("refuses a dodgeable or misplaced boss", () => {
    const value = structuredClone(campaign()) as unknown as { acts: { layers: { choices: Record<string, unknown>[] }[] }[] };
    value.acts[0]!.layers[2]!.choices.push(structuredClone(value.acts[0]!.layers[0]!.choices[0]!));
    expect(codes(value)).toContain("CAMPAIGN_BOSS_PLACEMENT");
  });

  it("refuses an economy that grows more generous in later acts", () => {
    const value = structuredClone(campaign()) as { economy: { actGrants: { act1: number; act2: number; act3: number } } };
    value.economy.actGrants.act2 = 4;
    expect(codes(value)).toContain("CAMPAIGN_ECONOMY_MONOTONE");
  });

  it("refuses unlock inventory outside the registered campaign ceiling", () => {
    const value = structuredClone(campaign()) as unknown as { acts: { layers: { choices: { reward?: { moduleId: string } }[] }[] }[] };
    value.acts[0]!.layers[0]!.choices[0]!.reward!.moduleId = "blunder_prevention";
    expect(codes(value)).toContain("CAMPAIGN_UNLOCK_OUTSIDE_CEILING");
  });

  it("refuses duplicate node ids and schema-open additions", () => {
    const duplicate = structuredClone(campaign()) as unknown as { acts: { layers: { choices: { id: string }[] }[] }[] };
    duplicate.acts[1]!.layers[0]!.choices[0]!.id = "a1-l1";
    expect(codes(duplicate)).toContain("CAMPAIGN_NODE_ID_DUPLICATE");
    expect(codes({ ...campaign(), invented: true })).toContain("SCHEMA_ADDITIONALPROPERTIES");
  });
});
