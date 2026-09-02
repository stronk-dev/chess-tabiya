// DISPOSABLE D2420-D2427 Campaign author model. Not production code.
import { createHash } from "node:crypto";

export type Sha = `sha256:${string}`;
const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  return JSON.stringify(value);
};
export const digest = (value: unknown): Sha => `sha256:${createHash("sha256").update(stable(value)).digest("hex")}`;

export type CampaignEventKind = "campaign_created" | "node_entered" | "node_committed" |
  "loadout_changed" | "charge_spent" | "campaign_abandoned";
interface CampaignEventBase {
  readonly campaignRunId: string;
  readonly seq: number;
  readonly commandId: string;
  readonly operandsDigest: Sha;
  readonly resultPayload: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly at: string;
}
export type CampaignEventRow =
  | (CampaignEventBase & { readonly kind: "campaign_created"; readonly seq: 1; readonly expectedRevision: null })
  | (CampaignEventBase & { readonly kind: Exclude<CampaignEventKind, "campaign_created">; readonly expectedRevision: number });

const EVENT_KEYS = ["at", "campaignRunId", "commandId", "expectedRevision", "kind", "operandsDigest", "payload", "resultPayload", "seq"] as const;
export function parseCampaignEventRow(value: unknown): CampaignEventRow {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("CAMPAIGN_EVENT_INVALID");
  const row = value as Record<string, unknown>;
  if (Object.keys(row).sort().join("\0") !== [...EVENT_KEYS].sort().join("\0")) throw new TypeError("CAMPAIGN_EVENT_FIELDS_INVALID");
  if (typeof row.campaignRunId !== "string" || typeof row.commandId !== "string" || typeof row.at !== "string"
    || typeof row.operandsDigest !== "string" || !row.operandsDigest.startsWith("sha256:")
    || typeof row.resultPayload !== "string" || typeof row.payload !== "object" || row.payload === null
    || !Number.isInteger(row.seq)) throw new TypeError("CAMPAIGN_EVENT_INVALID");
  if (row.kind === "campaign_created") {
    if (row.seq !== 1 || row.expectedRevision !== null) throw new TypeError("CAMPAIGN_CREATION_REVISION_INVALID");
  } else {
    if (!["node_entered", "node_committed", "loadout_changed", "charge_spent", "campaign_abandoned"].includes(String(row.kind))
      || !Number.isInteger(row.expectedRevision) || (row.expectedRevision as number) < 1
      || row.seq !== (row.expectedRevision as number) + 1) throw new TypeError("CAMPAIGN_EVENT_REVISION_INVALID");
  }
  JSON.parse(row.resultPayload);
  return Object.freeze({ ...row, payload: Object.freeze({ ...(row.payload as Record<string, unknown>) }) }) as CampaignEventRow;
}

export function replayStoredCommand(row: CampaignEventRow, operandsDigest: Sha): unknown {
  if (row.operandsDigest !== operandsDigest) throw new TypeError("CAMPAIGN_COMMAND_REUSED");
  return JSON.parse(row.resultPayload);
}

export interface TheoryGate {
  readonly passageId: string;
  readonly authorizingModuleId: string;
  readonly sourceId: string;
  readonly applicability: Readonly<{ passageId: string; packDigest: Sha; applicable: boolean; digest: Sha }>;
  readonly disclosure: Readonly<{ passageId: string; allowed: boolean; digest: Sha }>;
}
export interface CampaignInventoryCut {
  readonly eventSeq: number;
  readonly ownedModules: readonly string[];
  readonly equippedModules: readonly string[];
  readonly ownedTheoryPassages: readonly string[];
}
export function compileCampaignAssistance(input: {
  readonly currentRevision: number;
  readonly inventoryAtEncounter: CampaignInventoryCut;
  readonly currentInventory: CampaignInventoryCut;
  readonly suppressedModules: readonly string[];
  readonly sourceAvailable: readonly string[];
  readonly requestedModules: readonly string[];
  readonly theory: readonly TheoryGate[];
}) {
  const atCut = input.inventoryAtEncounter;
  const effectiveModules = atCut.ownedModules.filter((id) => atCut.equippedModules.includes(id)
    && input.requestedModules.includes(id) && !input.suppressedModules.includes(id)
    && input.sourceAvailable.includes(id)).sort();
  const theory = input.theory.map((gate) => {
    if (!atCut.ownedTheoryPassages.includes(gate.passageId)) return Object.freeze({ passageId: gate.passageId, state: "not_owned" as const });
    if (gate.applicability.passageId !== gate.passageId || !gate.applicability.applicable) return Object.freeze({ passageId: gate.passageId, state: "not_applicable" as const });
    if (!effectiveModules.includes(gate.authorizingModuleId)) return Object.freeze({ passageId: gate.passageId, state: "authorizing_module_inactive" as const });
    if (gate.disclosure.passageId !== gate.passageId || !gate.disclosure.allowed) return Object.freeze({ passageId: gate.passageId, state: "disclosure_ceiling" as const });
    if (!input.sourceAvailable.includes(gate.sourceId)) return Object.freeze({ passageId: gate.passageId, state: "source_unavailable" as const });
    return Object.freeze({ passageId: gate.passageId, state: "authorized" as const });
  });
  return Object.freeze({
    currentRevision: input.currentRevision,
    inventoryEventSeq: atCut.eventSeq,
    effectiveModules: Object.freeze(effectiveModules),
    theory: Object.freeze(theory),
    applicabilityDigests: Object.freeze(input.theory.map((gate) => gate.applicability.digest)),
    disclosureDigests: Object.freeze(input.theory.map((gate) => gate.disclosure.digest)),
  });
}

export type CampaignPhase = "opening" | "middlegame" | "endgame";
export interface CampaignCurriculumNodeFact {
  readonly nodeId: string;
  readonly packId: string;
  readonly packDigest: Sha;
  readonly phase: CampaignPhase;
  readonly form: "pack";
  readonly theoryPassageIds: readonly string[];
  readonly requirementIds: readonly string[];
}
export interface CampaignCurriculumMetadataProjection {
  readonly phaseCoverage: Readonly<Record<CampaignPhase, readonly string[]>>;
  readonly formCoverage: readonly Readonly<{ encounterKind: "pack"; nodeIds: readonly string[] }>[];
  readonly theoryProvenance: readonly Readonly<{ nodeId: string; passageId: string }>[];
  readonly dependencyAvailability: readonly Readonly<{ requirement: string; requiredAt: readonly string[] }>[];
}
const canonical = (values: readonly string[]): readonly string[] => [...new Set(values)].sort();
export function projectCampaignCurriculum(facts: readonly CampaignCurriculumNodeFact[]): CampaignCurriculumMetadataProjection {
  const phases = (phase: CampaignPhase) => canonical(facts.filter((fact) => fact.phase === phase).map((fact) => fact.nodeId));
  const requirements = canonical(facts.flatMap((fact) => fact.requirementIds));
  return Object.freeze({
    phaseCoverage: Object.freeze({ opening: phases("opening"), middlegame: phases("middlegame"), endgame: phases("endgame") }),
    formCoverage: Object.freeze([{ encounterKind: "pack" as const, nodeIds: canonical(facts.map((fact) => fact.nodeId)) }]),
    theoryProvenance: Object.freeze(facts.flatMap((fact) => fact.theoryPassageIds.map((passageId) => Object.freeze({ nodeId: fact.nodeId, passageId })))),
    dependencyAvailability: Object.freeze(requirements.map((requirement) => Object.freeze({ requirement,
      requiredAt: canonical(facts.filter((fact) => fact.requirementIds.includes(requirement)).map((fact) => fact.nodeId)) }))),
  });
}
export function validateCampaignCurriculum(metadata: CampaignCurriculumMetadataProjection, facts: readonly CampaignCurriculumNodeFact[]): readonly string[] {
  const expected = projectCampaignCurriculum(facts);
  const issues: string[] = [];
  for (const phase of ["opening", "middlegame", "endgame"] as const) {
    if (stable(metadata.phaseCoverage[phase]) !== stable(expected.phaseCoverage[phase])) issues.push("CAMPAIGN_CURRICULUM_PHASE_MISMATCH");
    if (metadata.phaseCoverage[phase].length === 0) issues.push("CAMPAIGN_CURRICULUM_PHASE_EMPTY");
  }
  if (stable(metadata.formCoverage) !== stable(expected.formCoverage)) issues.push("CAMPAIGN_CURRICULUM_FORM_MISMATCH");
  if (stable(metadata.theoryProvenance) !== stable(expected.theoryProvenance)) issues.push("CAMPAIGN_CURRICULUM_THEORY_MISMATCH");
  if (stable(metadata.dependencyAvailability) !== stable(expected.dependencyAvailability)) issues.push("CAMPAIGN_CURRICULUM_DEPENDENCY_MISMATCH");
  return Object.freeze([...new Set(issues)]);
}

export const CAMPAIGN_ACCOUNT_OPERATIONS = Object.freeze(["export", "hard_delete"] as const);
export const CAMPAIGN_APPLIANCE_OPERATIONS = Object.freeze(["backup_restore"] as const);

export type CampaignHistoryProjection =
  | Readonly<{ kind: "reviewable"; runId: string; nodeId: string }>
  | Readonly<{ kind: "abandoned"; reason: "campaign_encounter_abandoned"; runId: string; nodeId: string }>
  | Readonly<{ kind: "unavailable"; reason: "campaign_encounter_run_deleted" | "campaign_abandoned_run_deleted"; runId: string; nodeId: string }>;
export function campaignHistoryProjection(input: {
  readonly runId: string;
  readonly nodeId: string;
  readonly playRunExists: boolean;
  readonly activePointer: boolean;
  readonly nodeCommitted: boolean;
  readonly campaignAbandoned: boolean;
}): CampaignHistoryProjection {
  if (input.activePointer && !input.playRunExists) throw new TypeError("CAMPAIGN_ACTIVE_RUN_MISSING");
  if (input.nodeCommitted) return input.playRunExists
    ? Object.freeze({ kind: "reviewable", runId: input.runId, nodeId: input.nodeId })
    : Object.freeze({ kind: "unavailable", reason: "campaign_encounter_run_deleted", runId: input.runId, nodeId: input.nodeId });
  if (input.campaignAbandoned) return input.playRunExists
    ? Object.freeze({ kind: "abandoned", reason: "campaign_encounter_abandoned", runId: input.runId, nodeId: input.nodeId })
    : Object.freeze({ kind: "unavailable", reason: "campaign_abandoned_run_deleted", runId: input.runId, nodeId: input.nodeId });
  throw new TypeError("CAMPAIGN_HISTORY_CORRUPT");
}
