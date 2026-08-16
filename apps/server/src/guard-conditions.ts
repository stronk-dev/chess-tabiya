import type {
  DrillPackDefinition,
  EngineCondition,
} from "@chess-tabiya/schema/drill-pack";

type Guard = NonNullable<DrillPackDefinition["guard"]>;
type GuardOverride = NonNullable<Guard["overrides"]>[number];

export interface GuardConditionSettings {
  readonly conditions: readonly EngineCondition[];
  readonly rulesTier: boolean;
}

/** Resolve the authored condition grammar once for runtime and validation. */
export function baseGuardConditionSettings(
  guard: DrillPackDefinition["guard"],
): GuardConditionSettings {
  const declared = [...(guard?.conditions ?? [])];
  if (guard?.conditions === undefined) {
    const evalSwingCp = guard?.evalSwingCp === undefined ? 200 : guard.evalSwingCp;
    const fireOnMate = guard?.fireOnMate ?? true;
    return Object.freeze({
      conditions: Object.freeze([
        ...(evalSwingCp === null
          ? []
          : [{ kind: "engine_eval_swing" as const, cp: evalSwingCp }]),
        ...(fireOnMate ? [{ kind: "engine_mate_appears" as const }] : []),
      ]),
      rulesTier: guard?.rulesTier ?? true,
    });
  }

  // Explicit scalar shorthands remain authored input even beside conditions[].
  if (guard.evalSwingCp !== undefined && guard.evalSwingCp !== null) {
    declared.push({ kind: "engine_eval_swing", cp: guard.evalSwingCp });
  }
  if (guard.fireOnMate === true) declared.push({ kind: "engine_mate_appears" });
  return Object.freeze({
    conditions: Object.freeze(declared),
    rulesTier: guard.rulesTier ?? true,
  });
}

/** Apply a legacy scalar override without changing unrelated authored order. */
export function overrideGuardConditionSettings(
  base: GuardConditionSettings,
  override: GuardOverride | undefined,
): GuardConditionSettings {
  if (override === undefined) return base;
  let sawEval = false;
  let sawMate = false;
  const conditions: EngineCondition[] = [];
  for (const condition of base.conditions) {
    if (condition.kind === "engine_eval_swing" && override.evalSwingCp !== undefined) {
      sawEval = true;
      if (override.evalSwingCp !== null) {
        conditions.push({ kind: "engine_eval_swing", cp: override.evalSwingCp });
      }
      continue;
    }
    if (condition.kind === "engine_mate_appears" && override.fireOnMate !== undefined) {
      sawMate = true;
      if (override.fireOnMate) conditions.push(condition);
      continue;
    }
    conditions.push(condition);
  }
  if (!sawEval && override.evalSwingCp !== undefined && override.evalSwingCp !== null) {
    conditions.push({ kind: "engine_eval_swing", cp: override.evalSwingCp });
  }
  if (!sawMate && override.fireOnMate === true) {
    conditions.push({ kind: "engine_mate_appears" });
  }
  return Object.freeze({ conditions: Object.freeze(conditions), rulesTier: base.rulesTier });
}
