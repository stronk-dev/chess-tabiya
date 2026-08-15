import {
  RUN_OPPONENT_MODES,
  TEMPO_GRADEABLE_VERDICTS,
  TEMPO_VERDICTS,
  UNAUTHORED_TEMPO_DEFAULTS,
  runtimeBuildInfo,
  type RunOpponentMode,
} from "@chess-tabiya/runtime";
import { FEEDBACK_POLICIES, type FeedbackPolicy } from "@chess-tabiya/schema/drill-pack";

import type { EngineHealth, EngineIdentity } from "./engine-supervisor.js";
import { engineBandProfile, type EngineBandProfile } from "./engine-band.js";
import type { OpponentPolicyMode } from "./opponent-selector.js";
import { ASSESSMENT_CATEGORIES, OBJECTIVE_ASSESSMENT_SETS, type TablebaseCategory } from "./tablebase.js";
import {
  resolveStrongEngineProfile,
  type StrongEngineProfile,
} from "./strong-engine.js";

export const SUPPORTED_POLICY_MODES: readonly OpponentPolicyMode[] = RUN_OPPONENT_MODES;

export const DECLARED_UNIMPLEMENTED_POLICY_MODES = Object.freeze([
  { mode: "plan_defense", reason: "plan_defense is not selectable in v1; plan-defense selection is not implemented" },
  { mode: "human_external", reason: "human_external is not selectable in v1; external-human selection is not implemented" },
] as const);

export function isRunOpponentMode(value: unknown): value is RunOpponentMode {
  return RUN_OPPONENT_MODES.some((mode) => mode === value);
}

export const SURFACE_IDS = Object.freeze([
  "play",
  "review",
  "learn",
  "live",
  "create",
  "justPlay",
  "fromPosition",
] as const);

export type SurfaceId = (typeof SURFACE_IDS)[number];
export type SurfaceAvailability = "available" | "unavailable-here";
export type CapabilityEngineMode = "mock" | "maia";

export interface CapabilityProviders {
  readonly opponent: "maia" | "mock" | "none";
  readonly judge: "stockfish" | "mock" | "none";
  readonly llm: "none" | "external";
  readonly corpus: "lichess-explorer" | "mock" | "none";
  readonly tts: "none" | "external";
  readonly tablebase: "lichess" | "mock" | "none";
}

export type SurfaceCapabilities = Readonly<
  Record<SurfaceId, SurfaceAvailability>
>;

export interface Capabilities {
  readonly engines: readonly EngineIdentity[];
  readonly policyModes: readonly OpponentPolicyMode[];
  readonly feedbackPolicies: readonly FeedbackPolicy[];
  readonly tempoVerdicts: readonly string[];
  readonly tempoGradeable: readonly string[];
  readonly tempoDefaults: typeof UNAUTHORED_TEMPO_DEFAULTS;
  readonly guardBasis: readonly ("rules" | "engine")[];
  readonly assessmentCategories: readonly TablebaseCategory[];
  readonly objectiveAssessmentSets: Readonly<Record<"win" | "hold" | "save" | "resist", readonly TablebaseCategory[]>>;
  readonly runSchemaVersion: string;
  readonly policyProfiles: {
    readonly strong_engine: StrongEngineProfile;
    readonly human_common: {
      readonly elo: EngineBandProfile;
    };
  };
  readonly providers: CapabilityProviders;
  readonly surfaces: SurfaceCapabilities;
}

export interface CapabilitiesProvider {
  get(): Promise<Capabilities>;
}

export interface CapabilityEngineClient {
  health(engineId: string): EngineHealth;
}

export function assertSurfaceCapabilities(
  value: Readonly<Record<string, unknown>>,
): asserts value is SurfaceCapabilities {
  for (const id of SURFACE_IDS) {
    const status = value[id];
    if (status !== "available" && status !== "unavailable-here") {
      throw new TypeError(
        `Surface ${id} must be available or unavailable-here; received ${String(status)}`,
      );
    }
  }
  for (const id of Object.keys(value)) {
    if (!(SURFACE_IDS as readonly string[]).includes(id)) {
      throw new TypeError(`Unknown capability surface: ${id}`);
    }
  }
}

function providers(
  engineMode: CapabilityEngineMode,
  identities: readonly EngineIdentity[],
  llmAvailable: boolean,
  corpus: CapabilityProviders["corpus"],
  tts: CapabilityProviders["tts"],
  tablebase: CapabilityProviders["tablebase"],
): CapabilityProviders {
  if (engineMode === "mock") {
    const opponentReady = identities.some((identity) => identity.kind === "opponent");
    return Object.freeze({
      opponent: opponentReady ? "mock" : "none",
      // Mock mode wires MockEvidenceExecutor even though it has no UCI identity.
      judge: "mock",
      llm: llmAvailable ? "external" : "none",
      corpus,
      tts,
      tablebase,
    });
  }
  return Object.freeze({
    opponent: identities.some((identity) => identity.kind === "opponent")
      ? "maia"
      : "none",
    judge: identities.some((identity) => identity.kind === "judge")
      ? "stockfish"
      : "none",
    llm: llmAvailable ? "external" : "none",
    corpus,
    tts,
    tablebase,
  });
}

function surfaces(providerState: CapabilityProviders): SurfaceCapabilities {
  const value: Readonly<Record<string, unknown>> = Object.freeze({
    play: providerState.opponent === "none" ? "unavailable-here" : "available",
    review: "available",
    learn: "available",
    live: "available",
    create: "available",
    justPlay: providerState.opponent === "none" ? "unavailable-here" : "available",
    fromPosition: providerState.opponent === "none" ? "unavailable-here" : "available",
  });
  assertSurfaceCapabilities(value);
  return value;
}

export class EngineCapabilities implements CapabilitiesProvider {
  readonly #client: CapabilityEngineClient;
  readonly #engineIds: readonly string[];
  readonly #engineMode: CapabilityEngineMode;
  readonly #strongEngineProfile: StrongEngineProfile;
  readonly #llmAvailable: boolean;
  readonly #corpus: CapabilityProviders["corpus"];
  readonly #tts: CapabilityProviders["tts"];
  readonly #tablebase: CapabilityProviders["tablebase"];

  constructor(
    client: CapabilityEngineClient,
    engineIds: readonly string[],
    options: {
      readonly engineMode: CapabilityEngineMode;
      readonly strongEngineProfile?: Partial<StrongEngineProfile>;
      readonly llmAvailable?: boolean;
      readonly corpus?: CapabilityProviders["corpus"];
      readonly tts?: CapabilityProviders["tts"];
      readonly tablebase?: CapabilityProviders["tablebase"];
    },
  ) {
    this.#client = client;
    this.#engineIds = Object.freeze([...engineIds]);
    this.#engineMode = options.engineMode;
    this.#llmAvailable = options.llmAvailable === true;
    this.#corpus = options.corpus ?? "none";
    this.#tts = options.tts ?? "none";
    this.#tablebase = options.tablebase ?? "none";
    this.#strongEngineProfile = resolveStrongEngineProfile(
      options.strongEngineProfile,
    );
  }

  async get(): Promise<Capabilities> {
    const healthRows = this.#engineIds.map((engineId) => this.#client.health(engineId));
    const engines = Object.freeze(
      healthRows.flatMap((health) => {
        return health.status === "ready" && health.identity !== undefined
          ? [health.identity]
          : [];
      }),
    );
    const opponentHealth = healthRows.find((health) => health.identity?.kind === "opponent");
    const elo = opponentHealth?.identity?.eloHonored === true
      ? engineBandProfile(opponentHealth)
      : Object.freeze({
          min: null,
          max: null,
          default: null,
          source: "unpublished" as const,
          advertised: Object.freeze({ min: null, max: null }),
        });
    const providerState = providers(this.#engineMode, engines, this.#llmAvailable, this.#corpus, this.#tts, this.#tablebase);
    return Object.freeze({
      engines,
      policyModes: Object.freeze(SUPPORTED_POLICY_MODES.filter((mode) =>
        mode === "perfect_tablebase"
          ? providerState.tablebase !== "none"
          : mode === "practical_resistance"
            ? providerState.tablebase !== "none" && providerState.opponent !== "none"
            : true)),
      feedbackPolicies: FEEDBACK_POLICIES,
      tempoVerdicts: TEMPO_VERDICTS,
      tempoGradeable: TEMPO_GRADEABLE_VERDICTS,
      tempoDefaults: UNAUTHORED_TEMPO_DEFAULTS,
      guardBasis: providerState.judge === "none"
        ? Object.freeze(["rules"] as const)
        : Object.freeze(["rules", "engine"] as const),
      assessmentCategories: ASSESSMENT_CATEGORIES,
      objectiveAssessmentSets: OBJECTIVE_ASSESSMENT_SETS,
      runSchemaVersion: runtimeBuildInfo.runSchemaVersion,
      policyProfiles: Object.freeze({
        strong_engine: this.#strongEngineProfile,
        human_common: Object.freeze({ elo }),
      }),
      providers: providerState,
      surfaces: surfaces(providerState),
    });
  }
}
