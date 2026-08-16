export type FormatDispositionKind =
  | "reached"
  | "refused"
  | "retired"
  | "unmeasured"
  | "impossible";

export interface FormatDisposition {
  readonly pointer: string;
  readonly value?: string;
  readonly disposition: FormatDispositionKind;
  readonly reason: string;
  readonly site?: { readonly module: string; readonly symbol: string };
  readonly successor?: string | null;
  readonly removedAt?: string;
  readonly experiment?: string;
}

const row = (value: FormatDisposition): FormatDisposition => Object.freeze(value);

/** Schema-version facts. Deliberately not part of the deployment capabilities payload. */
export const FORMAT_DISPOSITIONS: readonly FormatDisposition[] = Object.freeze([
  row({
    pointer: "/opponentPolicy/mode",
    value: "plan_defense",
    disposition: "refused",
    reason: "plan_defense is not selectable in v1; plan-defense selection is not implemented",
  }),
  row({
    pointer: "/opponentPolicy/mode",
    value: "human_external",
    disposition: "refused",
    reason: "human_external is not selectable in v1; external-human selection is not implemented",
  }),
  row({
    pointer: "assistance:arrows",
    disposition: "unmeasured",
    reason: "design/05 promises arrows-for-sight; no directed structural primitive exists (the reader emits square sets, not vectors). The evidence rung stays refused under law 8. Learner-drawn and host-relayed marks are board-annotation surfaces and are not this axis.",
    successor: null,
    experiment: "Measure and define a directed structural primitive before enabling system-drawn sight arrows",
  }),
  row({
    pointer: "error:SIMULATE_BUDGET_EXCEEDED",
    disposition: "retired",
    reason: "No simulation economy or budget exists; reintroduce a refusal with the economy that needs it",
    successor: null,
    removedAt: "0.25",
  }),
  row({
    pointer: "/retryVariants",
    disposition: "refused",
    reason: "retryVariants is a catalogue relation, not a run modifier; it names no executable referent and variantOf is not yet a superset",
    successor: "variantOf",
  }),
  row({
    pointer: "/opponentPolicy/mode",
    value: "practical_resistance",
    disposition: "reached",
    reason: "The selector either chooses by measured concession ratio or refuses by name",
    site: { module: "apps/server/src/opponent-selector.ts", symbol: "practicalResistance" },
  }),
  row({
    pointer: "/legs/*/opponentPolicy",
    disposition: "reached",
    reason: "The active trajectory leg resolves the requested opponent policy",
    site: { module: "packages/runtime/src/trajectory.ts", symbol: "legIndexAt" },
  }),
  row({
    pointer: "/legs/*/shapes",
    disposition: "reached",
    reason: "Leg shape references are validated as a subset of the pack shape set",
    site: { module: "apps/server/src/pack-validation.ts", symbol: "runtimeIssues" },
  }),
]);
