// rfc/pack-training-forms.md §1–§4 (pack-schema lane 0.32) — validation of the training-set sibling
// artefact. A set is its own document with its own `formatVersion` 0.1; its grammar is
// `$defs/trainingSet` in the pack schema so the set and the packs it orders share one vocabulary, but
// no pack field names a set and `digestDrillPack` never sees one (criterion 4).

import Ajv2020, { type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import type { DrillPackDefinition, TrainingSetDefinition } from "@chess-tabiya/schema/drill-pack";

import { livingPackSchema } from "./pack-schema.js";

export interface TrainingSetIssue {
  readonly severity: "error";
  readonly code:
    | "SCHEMA_INVALID"
    | "TRAINING_SET_ORDINAL_DUPLICATE"
    | "TRAINING_SET_ORDINAL_MISSING"
    | "TRAINING_SET_MEMBER_DUPLICATE"
    | "TRAINING_SET_PASS_MARK_SCOPE"
    | "TRAINING_SET_CYCLE_ORDINAL_INVALID"
    | "TRAINING_SET_TEMPO_WITHOUT_WINDOWS"
    | "TRAINING_SET_PACK_UNREGISTERED";
  readonly path: string;
  readonly message: string;
}

export interface TrainingSetValidation {
  readonly valid: boolean;
  readonly issues: readonly TrainingSetIssue[];
  readonly document?: TrainingSetDefinition;
}

export interface TrainingSetPackLookup {
  get(id: string): Pick<DrillPackDefinition, "id"> & { readonly timingWindows?: readonly unknown[] } | undefined;
}

let validator: ValidateFunction | undefined;
function setValidator(): ValidateFunction {
  if (validator !== undefined) return validator;
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const schema = livingPackSchema();
  ajv.addSchema(schema);
  validator = ajv.compile({ $ref: `${String(schema.$id)}#/$defs/trainingSet` });
  return validator;
}

/**
 * Structural and semantic validation. With `packs`, tempo members are checked for authored timing
 * windows; with `publication: true`, every member must be a registered pack (criterion 3: refused at
 * publication, not at read time).
 */
export function validateTrainingSet(value: unknown, options: { readonly packs?: TrainingSetPackLookup; readonly publication?: boolean } = {}): TrainingSetValidation {
  const validate = setValidator();
  if (!validate(value)) {
    return Object.freeze({ valid: false, issues: Object.freeze((validate.errors ?? []).map((error) => Object.freeze({ severity: "error" as const, code: "SCHEMA_INVALID" as const, path: error.instancePath || "/", message: error.message ?? "invalid" }))) });
  }
  const set = value as TrainingSetDefinition;
  const issues: TrainingSetIssue[] = [];
  const push = (code: TrainingSetIssue["code"], path: string, message: string): void => { issues.push(Object.freeze({ severity: "error", code, path, message })); };
  const byOrdinal = new Map<number, string>();
  const seenPacks = new Set<string>();
  set.members.forEach((member, index) => {
    const previous = byOrdinal.get(member.ordinal);
    if (previous !== undefined) push("TRAINING_SET_ORDINAL_DUPLICATE", `/members/${index}/ordinal`, `${member.packId} repeats ordinal ${member.ordinal} already held by ${previous}`);
    else byOrdinal.set(member.ordinal, member.packId);
    if (seenPacks.has(member.packId)) push("TRAINING_SET_MEMBER_DUPLICATE", `/members/${index}/packId`, `${member.packId} is listed twice`);
    seenPacks.add(member.packId);
  });
  for (let ordinal = 1; ordinal <= set.members.length; ordinal += 1) {
    if (!byOrdinal.has(ordinal)) {
      const after = [...byOrdinal].filter(([candidate]) => candidate > ordinal).sort(([left], [right]) => left - right)[0];
      push("TRAINING_SET_ORDINAL_MISSING", "/members", `ordinal ${ordinal} is missing${after === undefined ? "" : ` before ${after[1]} (ordinal ${after[0]})`}`);
    }
  }
  if (set.passMark !== undefined) {
    const scope = set.passMark.of === "all" ? [...seenPacks] : set.passMark.of;
    const outside = scope.filter((packId) => !seenPacks.has(packId));
    if (outside.length > 0) push("TRAINING_SET_PASS_MARK_SCOPE", "/passMark/of", `the pass mark names non-members: ${outside.join(", ")}`);
    if (set.passMark.require > scope.length) push("TRAINING_SET_PASS_MARK_SCOPE", "/passMark/require", `require ${set.passMark.require} exceeds the ${scope.length} members it counts`);
  }
  if (set.tempo !== undefined) {
    const ordinals = set.tempo.cycles.map((cycle) => cycle.ordinal);
    if (new Set(ordinals).size !== ordinals.length || ordinals.some((ordinal, index) => ordinal !== index + 1)) push("TRAINING_SET_CYCLE_ORDINAL_INVALID", "/tempo/cycles", "cycle ordinals must be 1..n in order");
    if (options.packs !== undefined) {
      const bare = set.members.filter((member) => {
        const pack = options.packs!.get(member.packId);
        return pack !== undefined && (pack.timingWindows === undefined || pack.timingWindows.length === 0);
      }).map((member) => member.packId);
      if (bare.length > 0) push("TRAINING_SET_TEMPO_WITHOUT_WINDOWS", "/tempo", `a tempo cycle scales authored luxury budgets; these members declare no timingWindows: ${bare.join(", ")}`);
    }
  }
  if (options.publication === true) {
    const unregistered = set.members.filter((member) => options.packs?.get(member.packId) === undefined).map((member) => member.packId);
    if (unregistered.length > 0) push("TRAINING_SET_PACK_UNREGISTERED", "/members", `members are not registered packs: ${unregistered.join(", ")}`);
  }
  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze(issues), document: set });
}
