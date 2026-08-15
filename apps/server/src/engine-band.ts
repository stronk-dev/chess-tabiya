import type { RunOpponentPolicy } from "@chess-tabiya/runtime";

import type { EngineHealth, EngineOption } from "./engine-supervisor.js";
import { ServerError } from "./errors.js";

export interface EngineBandProfile {
  readonly min: number | null;
  readonly max: number | null;
  readonly default: number | null;
  readonly source: "advertised" | "configured" | "advertised+configured" | "unpublished";
  readonly advertised: {
    readonly min: number | null;
    readonly max: number | null;
  };
}

function option(health: EngineHealth): EngineOption | undefined {
  if (health.bandOption === undefined) return undefined;
  return health.options?.find((candidate) =>
    candidate.name === health.bandOption && candidate.type === "spin",
  );
}

function integer(value: string | undefined): number | null {
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function engineBandProfile(health: EngineHealth): EngineBandProfile {
  const advertised = option(health);
  const advertisedMin = advertised?.min ?? null;
  const advertisedMax = advertised?.max ?? null;
  const configuredMin = health.bandRange?.min ?? null;
  const configuredMax = health.bandRange?.max ?? null;
  const hasAdvertised = advertisedMin !== null || advertisedMax !== null;
  const hasConfigured = configuredMin !== null || configuredMax !== null;
  const min = hasAdvertised || hasConfigured
    ? Math.max(advertisedMin ?? Number.NEGATIVE_INFINITY, configuredMin ?? Number.NEGATIVE_INFINITY)
    : null;
  const max = hasAdvertised || hasConfigured
    ? Math.min(advertisedMax ?? Number.POSITIVE_INFINITY, configuredMax ?? Number.POSITIVE_INFINITY)
    : null;
  if (min !== null && max !== null && min > max) {
    throw new TypeError(`Engine ${health.id} has an empty effective band range`);
  }
  const advertisedDefault = integer(advertised?.default);
  const defaultValue = advertisedDefault !== null
    && (min === null || advertisedDefault >= min)
    && (max === null || advertisedDefault <= max)
    ? advertisedDefault
    : null;
  return Object.freeze({
    min: min === Number.NEGATIVE_INFINITY ? null : min,
    max: max === Number.POSITIVE_INFINITY ? null : max,
    default: defaultValue,
    source: hasAdvertised && hasConfigured
      ? "advertised+configured"
      : hasAdvertised
        ? "advertised"
        : hasConfigured
          ? "configured"
          : "unpublished",
    advertised: Object.freeze({ min: advertisedMin, max: advertisedMax }),
  });
}

export function appliedTargetElo(
  health: EngineHealth,
  requested: number | undefined,
): number | undefined {
  if (health.identity?.eloHonored !== true) return undefined;
  const profile = engineBandProfile(health);
  const applied = requested ?? profile.default;
  if (applied === null) {
    throw new ServerError(
      "TARGET_ELO_REQUIRED",
      "This engine is band-calibrated and publishes no default band; the session must declare targetElo",
      { details: { engineId: health.id } },
    );
  }
  if ((profile.min !== null && applied < profile.min) || (profile.max !== null && applied > profile.max)) {
    throw new ServerError(
      "TARGET_ELO_OUT_OF_RANGE",
      `targetElo ${applied} is outside the published ${profile.source} range`,
      { details: { engineId: health.id, min: profile.min, max: profile.max, source: profile.source } },
    );
  }
  return applied;
}

export function policyUsesMaiaBand(policy: Pick<RunOpponentPolicy, "mode">): boolean {
  return policy.mode === "human_common"
    || policy.mode === "theory_strict"
    || policy.mode === "practical_resistance";
}
