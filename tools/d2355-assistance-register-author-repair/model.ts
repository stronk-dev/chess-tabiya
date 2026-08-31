// DISPOSABLE executable author model for D2355-D2360. This specifies the process RFC; it is not
// the production register implementation.
export const WORKFLOW_V1_ROOT = "apps/web/src/lib/assistance-preference.ts#loadWorkflowPreset" as const;
export const EXCHANGE_ROOT = "packages/runtime/src/presets.ts#ASSISTANCE_EXCHANGE_VERSION" as const;

export const WORKFLOW_V1_AUTHORITY = Object.freeze([
  "apps/web/src/lib/assistance-preference.ts#loadWorkflowPreset",
  "apps/web/src/lib/assistance-preference.ts#saveWorkflowPreset",
  "apps/web/src/lib/assistance-preference.ts#workflowKey",
  "packages/runtime/src/presets.ts#PRESET_IDS",
  "packages/runtime/src/presets.ts#WORKFLOW_CONTEXT_POLICIES",
  "packages/runtime/src/presets.ts#workflowContextPolicy",
] as const);

export const WORKFLOW_V2_TRANSITION = Object.freeze([
  "apps/web/src/lib/assistance-preference.ts#loadWorkflowPreference",
  "apps/web/src/lib/assistance-preference.ts#loadWorkflowPreset",
  "apps/web/src/lib/assistance-preference.ts#saveWorkflowPreference",
  "apps/web/src/lib/assistance-preference.ts#saveWorkflowPreset",
  "apps/web/src/lib/assistance-preference.ts#workflowKey",
  "packages/runtime/src/presets.ts#WorkflowPreferenceV2",
  "packages/runtime/src/presets.ts#parseWorkflowPreferenceV2",
  "packages/runtime/src/presets.ts#serializeWorkflowPreferenceV2",
] as const);

export const EXCHANGE_V1_TRANSITION = Object.freeze([
  "packages/runtime/src/presets.ts#ASSISTANCE_EXCHANGE_VERSION",
  "packages/runtime/src/presets.ts#AuthoritativeAssistanceV1",
  "packages/runtime/src/presets.ts#BrowserNarrowedAssistanceV1",
  "packages/runtime/src/presets.ts#FinalizedAssistanceV1",
  "packages/runtime/src/presets.ts#RequestedAssistanceV1",
  "packages/runtime/src/presets.ts#compileAssistanceRequest",
  "packages/runtime/src/presets.ts#compileAuthoritativeAssistance",
  "packages/runtime/src/presets.ts#finalizeAssistanceEffects",
  "packages/runtime/src/presets.ts#narrowBrowserChannels",
  "packages/runtime/src/presets.ts#parseAssistanceExchange",
] as const);

export const PERMISSION_LEGAL_TRANSITION = Object.freeze([
  "packages/runtime/src/assistance.ts#AssistancePermission",
  "packages/runtime/src/assistance.ts#accessPermission",
  "packages/runtime/src/assistance.ts#permittedAssistance",
  "packages/runtime/src/presets.ts#compileAuthoritativeAssistance",
  "packages/runtime/src/presets.ts#contextClamp",
] as const);

export type SequentialState =
  | Readonly<{ kind: "absent"; history: readonly [] }>
  | Readonly<{ kind: "landed"; head: number; history: readonly number[] }>;
export type SequentialClaim = Readonly<{ kind: "first"; lane: 1; owner: string; changes: readonly string[] }>
  | Readonly<{ kind: "next"; lane: number; owner: string; changes: readonly string[] }>;

export function assertSortedUniqueChanges(changes: readonly string[]): void {
  if (changes.length === 0 || new Set(changes).size !== changes.length || changes.some((value, index) => value !== [...changes].sort()[index])) {
    throw new TypeError("RESOURCE_CHANGED_SYMBOLS_INVALID");
  }
}

export function assertSequentialSnapshot(state: SequentialState, claims: readonly SequentialClaim[]): void {
  if (state.kind === "absent") {
    if (claims.length !== 1 || claims[0]?.kind !== "first" || claims[0].lane !== 1) throw new TypeError("ABSENT_REQUIRES_ONE_FIRST_CLAIM");
  } else {
    if (state.head < 1 || state.history.length !== state.head || state.history.some((value, index) => value !== index + 1)) throw new TypeError("LANDED_HISTORY_INVALID");
    if (claims.some((claim) => claim.kind !== "next" || claim.lane !== state.head + 1)) throw new TypeError("LANDED_CLAIM_INVALID");
    if (claims.length > 1) throw new TypeError("MULTIPLE_RESOURCE_CLAIMS");
  }
  for (const claim of claims) assertSortedUniqueChanges(claim.changes);
}

export function assertSequentialTransition(previous: SequentialState, previousClaims: readonly SequentialClaim[], current: SequentialState, currentClaims: readonly SequentialClaim[], owner: string): void {
  assertSequentialSnapshot(previous, previousClaims);
  assertSequentialSnapshot(current, currentClaims);
  if (previous.kind === "landed" && current.kind === "absent") throw new TypeError("LANDED_RESOURCE_CANNOT_BECOME_ABSENT");
  if (previous.kind === "absent" && current.kind === "landed") {
    const claim = previousClaims[0];
    if (current.head !== 1 || current.history.length !== 1 || claim?.kind !== "first" || claim.owner !== owner || currentClaims.length !== 0) throw new TypeError("FIRST_LANDING_INVALID");
    return;
  }
  if (previous.kind === "landed" && current.kind === "landed" && current.head === previous.head + 1) {
    const claim = previousClaims[0];
    if (claim?.kind !== "next" || claim.lane !== current.head || claim.owner !== owner || currentClaims.length !== 0) throw new TypeError("NEXT_LANDING_INVALID");
    return;
  }
  if (previous.kind === "landed" && current.kind === "landed" && current.head === previous.head) return;
  if (previous.kind === "absent" && current.kind === "absent") return;
  throw new TypeError("RESOURCE_HEAD_TRANSITION_INVALID");
}

export const WORKFLOW_V1_GRAMMAR = Object.freeze({
  version: 1,
  unknownKeys: "ignored",
  presetMembership: "PRESET_IDS",
  contextAdmission: "WORKFLOW_CONTEXT_POLICIES[context].allowedPresets",
  invalidDisposition: "context_default",
} as const);
