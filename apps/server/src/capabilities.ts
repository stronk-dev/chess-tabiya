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
import {
  RECORDED_READING_DISPOSITIONS,
  assertRecordedReadingDispositions,
  type RecordedReadingDisposition,
} from "./position-evidence.js";
import { ASSESSMENT_CATEGORIES, OBJECTIVE_ASSESSMENT_SETS, type TablebaseCategory } from "./tablebase.js";
import {
  resolveStrongEngineProfile,
  type StrongEngineProfile,
} from "./strong-engine.js";
import {
  evidenceManifestCapabilities,
  type EvidenceManifestCapabilities,
} from "./evidence-manifest.js";

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

export const HUMAN_COMMON_RESISTANCE_PROFILE = Object.freeze({
  basis: "measured" as const,
  metric: "dtz_percentile" as const,
  scope: "positions of at most seven pieces in which every legal move preserves the mover's tablebase category",
  corpus: Object.freeze({ dossier: "design/research/maia-endgame-fidelity.md#6", positions: 15 as const, probes: 270 as const, measuredAt: "2026-08-16" as const }),
  bands: Object.freeze([1100, 1500, 1900] as const),
  bandConditioned: false as const,
  dtzPercentile: Object.freeze({ min: 0.719 as const, max: 0.751 as const, uniformBaseline: 0.38 as const }),
  slowestLosingRate: Object.freeze({ min: 0.611 as const, max: 0.689 as const, uniformBaseline: 0.227 as const }),
  fastestLosingRate: Object.freeze({ value: 0.033 as const, uniformBaseline: 0.313 as const }),
});

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
  readonly costBasis: readonly ("material" | "engine" | "tablebase")[];
  readonly capabilityDispositions: readonly CapabilityDisposition[];
  readonly recordedReadingKinds: readonly RecordedReadingDisposition[];
  readonly assessmentCategories: readonly TablebaseCategory[];
  readonly objectiveAssessmentSets: Readonly<Record<"win" | "hold" | "save" | "resist", readonly TablebaseCategory[]>>;
  readonly runSchemaVersion: string;
  readonly policyProfiles: {
    readonly strong_engine: StrongEngineProfile;
    readonly human_common: {
      readonly elo: EngineBandProfile;
      readonly resistance: typeof HUMAN_COMMON_RESISTANCE_PROFILE;
    };
  };
  readonly providers: CapabilityProviders;
  readonly surfaces: SurfaceCapabilities;
  readonly evidenceManifest: EvidenceManifestCapabilities;
}

export type CapabilityDispositionKind = "reached" | "refused" | "unmeasured" | "impossible";
export interface CapabilityDisposition {
  readonly instrument: string;
  readonly capability: string;
  readonly disposition: CapabilityDispositionKind;
  readonly reason: string;
  readonly surface?: string;
  readonly experiment?: string;
  readonly advertisedOptions?: readonly string[];
  readonly evidence?: {
    readonly producerId: string;
    readonly consumerIds: readonly string[];
  };
}

export const CAPABILITY_DISPOSITIONS: readonly CapabilityDisposition[] = Object.freeze([
  { instrument: "Stockfish", capability: "score cp / mate", disposition: "reached", reason: "Engine evidence, guard conditions, and deviation cost binding", surface: "analysis and feedback", evidence: { producerId: "live.stockfish", consumerIds: ["runtime.guard_condition", "runtime.objective_condition", "runtime.evidence_ref", "compare.engine_trajectory"] } },
  { instrument: "Stockfish", capability: "UCI_ShowWDL", disposition: "reached", reason: "Recorded WDL evidence", surface: "analysis", advertisedOptions: ["UCI_ShowWDL"] },
  { instrument: "Stockfish", capability: "go nodes", disposition: "reached", reason: "Reproducible strong-engine search bound", surface: "opponent selection" },
  { instrument: "Stockfish", capability: "bestmove / MultiPV rank / bestline", disposition: "refused", reason: "Move verdicts are not condition measurements" },
  { instrument: "Stockfish", capability: "MultiPV > 1 outside enumerate", disposition: "refused", reason: "No attested authoring need outside the comparison enumerator", advertisedOptions: ["MultiPV"] },
  { instrument: "Stockfish", capability: "searchmoves", disposition: "unmeasured", reason: "No attested authoring consumer", experiment: "D87 concession-set validator experiment" },
  { instrument: "Stockfish", capability: "SyzygyPath / SyzygyProbeLimit / SyzygyProbeDepth / Syzygy50MoveRule", disposition: "refused", reason: "Hosted tablebase is the shipped path", advertisedOptions: ["SyzygyPath", "SyzygyProbeLimit", "SyzygyProbeDepth", "Syzygy50MoveRule"] },
  { instrument: "Stockfish", capability: "UCI_LimitStrength / UCI_Elo / Skill Level", disposition: "refused", reason: "Weakened Stockfish is rejected doctrine", advertisedOptions: ["UCI_LimitStrength", "UCI_Elo", "Skill Level"] },
  { instrument: "Stockfish", capability: "nodestime / Ponder / go mate", disposition: "refused", reason: "No product question asks for these controls", advertisedOptions: ["nodestime", "Ponder"] },
  { instrument: "Stockfish", capability: "Threads / Hash / Clear Hash", disposition: "reached", reason: "Request-scoped deterministic engine profile and reset", surface: "engine worker", advertisedOptions: ["Threads", "Hash", "Clear Hash"] },
  { instrument: "Stockfish", capability: "Debug Log File / NumaPolicy", disposition: "refused", reason: "Deployment diagnostics and topology are not product measurements", advertisedOptions: ["Debug Log File", "NumaPolicy"] },
  { instrument: "Stockfish", capability: "Move Overhead", disposition: "refused", reason: "Selections use explicit search bounds rather than an engine clock", advertisedOptions: ["Move Overhead"] },
  { instrument: "Stockfish", capability: "UCI_Chess960", disposition: "refused", reason: "The shipped drill format is standard chess only", advertisedOptions: ["UCI_Chess960"] },
  { instrument: "Stockfish", capability: "EvalFile / EvalFileSmall", disposition: "refused", reason: "Custom evaluation networks have no authorized product surface", advertisedOptions: ["EvalFile", "EvalFileSmall"] },
  { instrument: "Maia", capability: "policy mass", disposition: "reached", reason: "Recorded on opponent selections", surface: "human split", evidence: { producerId: "human.maia", consumerIds: ["inspector.human_split", "opponent.selection"] } },
  { instrument: "Maia", capability: "per-move wdl", disposition: "unmeasured", reason: "Recorded but not calibrated for grading", surface: "human split", experiment: "D87 compare Maia WDL with R9 ground truth" },
  { instrument: "Maia", capability: "per-move score cp", disposition: "reached", reason: "Recorded without grading", surface: "human split" },
  { instrument: "Maia", capability: "Elo", disposition: "reached", reason: "Applied band is recorded on every new Maia selection", surface: "opponent selection", advertisedOptions: ["Elo"] },
  { instrument: "Maia", capability: "TopP", disposition: "reached", reason: "Authored resistance setting applied to policy mass", surface: "opponent selection", advertisedOptions: ["TopP"] },
  { instrument: "Maia", capability: "MultiPV", disposition: "reached", reason: "Candidate window for policy-mass recording", surface: "human split", advertisedOptions: ["MultiPV"] },
  { instrument: "Maia", capability: "|DTZ| percentile of the selected move in a decided position", disposition: "reached", reason: "Measured 0.72-0.75 against 0.38 for a uniform legal move over 270 probes on 15 in-pack lost positions (design/research/maia-endgame-fidelity.md §6); recorded at mode scope, never rendered as a move verdict", surface: "opponent selection" },
  { instrument: "Maia", capability: "band-conditioned resistance", disposition: "refused", reason: "Measured flat across 1100/1500/1900 (fastest-losing 3.3% at every band, design/research/maia-endgame-fidelity.md §6); the band's game-level transfer ratio falls from 0.40 at full material to ~0.07 below ten pieces (design/research/maia-band-outcome-transfer.md §7, 16,660 games), so the flat endgame reading has a measured cause and a per-band resistance figure would assert a difference no instrument finds" },
  { instrument: "Maia", capability: "resistance above seven pieces", disposition: "unmeasured", reason: "No exact DTZ ground truth exists outside the Syzygy range; conversion-up-a-piece (17 pieces) and rook-4v3-same-side-hold (11) are outside it at every authored position", experiment: "D370-b realized-ply-count-to-conversion against a fixed converting opponent on the two out-of-range packs" },
  { instrument: "Maia", capability: "Temperature 0", disposition: "refused", reason: "A modal opponent is a different product", advertisedOptions: ["Temperature"] },
  { instrument: "Maia", capability: "asymmetric SelfElo / OppoElo", disposition: "unmeasured", reason: "Advertised but unmeasured", experiment: "RFC ledger row 5 asymmetric Elo experiment", advertisedOptions: ["SelfElo", "OppoElo"] },
  { instrument: "Syzygy", capability: "category", disposition: "reached", reason: "Opponent modes and category guard", surface: "feedback", evidence: { producerId: "live.syzygy", consumerIds: ["runtime.guard_condition", "runtime.objective_condition", "runtime.evidence_ref", "opponent.selection"] } },
  { instrument: "Syzygy", capability: "dtz / precise_dtz as a recorded measurement", disposition: "reached", reason: "Exact evidence payload and tablebase cost binding", surface: "feedback" },
  { instrument: "Syzygy", capability: "dtz as a condition threshold", disposition: "unmeasured", reason: "The first non-optimality threshold ships at three but its learning significance is unmeasured", experiment: "D87 category-preserving DTZ-delta distribution" },
  { instrument: "Syzygy", capability: "dtm", disposition: "refused", reason: "Not published for every position; category is total where DTM is not" },
  { instrument: "Explorer", capability: "position white / draws / black", disposition: "reached", reason: "Population result at the queried position", surface: "corpus panel", evidence: { producerId: "human.explorer", consumerIds: ["inspector.corpus", "runtime.repertoire_scan", "authoring.claim_binding"] } },
  { instrument: "Explorer", capability: "per-move white / draws / black", disposition: "reached", reason: "Population result attached to each move without grading", surface: "corpus panel" },
  { instrument: "Explorer", capability: "per-move averageRating", disposition: "unmeasured", reason: "No runtime consumer", experiment: "D87 within-band skew experiment" },
  { instrument: "Explorer", capability: "monthly history", disposition: "refused", reason: "Measured drift is below any actionable threshold" },
  { instrument: "Explorer", capability: "topGames / recentGames / masters database", disposition: "refused", reason: "Per-game scope and licence questions remain unresolved" },
  { instrument: "Explorer", capability: "moves beyond 12", disposition: "unmeasured", reason: "The response cap is unexamined", experiment: "D87 explorer move-cap experiment" },
  { instrument: "Supervisor", capability: "EngineHealth.options", disposition: "reached", reason: "Handshake advertisements drive the disposition coverage gate", surface: "capability contract" },
  { instrument: "Supervisor", capability: "stockfish-play identity", disposition: "refused", reason: "Opponent-engine identity has no authorized client surface" },
  { instrument: "Supervisor", capability: "EngineRequest.afterCommands", disposition: "refused", reason: "No production callers; request-scoped state replaced it" },
  { instrument: "Human population", capability: "measured middlegame difficulty", disposition: "impossible", reason: "R4 and R9 measured no total population ground truth at the required depth" },
]);

export function assertAdvertisedCapabilityDispositions(
  healthRows: readonly EngineHealth[],
  dispositions: readonly CapabilityDisposition[] = CAPABILITY_DISPOSITIONS,
): void {
  for (const health of healthRows) {
    if (health.status !== "ready" || health.identity === undefined) continue;
    if (health.options === undefined || health.options.length === 0) {
      throw new TypeError(`Engine ${health.id} published no option table for capability disposition coverage`);
    }
    const instrument = health.identity.name.toLowerCase().startsWith("maia") ? "Maia" : health.identity.name;
    const covered = new Set(dispositions.filter((row) => row.instrument === instrument).flatMap((row) => row.advertisedOptions ?? []));
    const missing = health.options.map((option) => option.name).filter((name) => !covered.has(name));
    if (missing.length > 0) {
      throw new TypeError(`Engine ${health.id} advertises capabilities with no disposition: ${missing.join(", ")}`);
    }
  }
  for (const row of dispositions) {
    if (row.disposition === "unmeasured" && (row.experiment === undefined || row.experiment.trim() === "")) {
      throw new TypeError(`${row.instrument} ${row.capability} is unmeasured without an experiment`);
    }
  }
}

export function assertRecordedReadingCapabilityDispositions(
  dispositions: readonly CapabilityDisposition[] = CAPABILITY_DISPOSITIONS,
): void {
  assertRecordedReadingDispositions();
  const required = [
    ["Stockfish", "score cp / mate"],
    ["Syzygy", "category"],
    ["Syzygy", "dtz / precise_dtz as a recorded measurement"],
  ] as const;
  for (const [instrument, capability] of required) {
    if (!dispositions.some((row) => row.instrument === instrument && row.capability === capability && row.disposition === "reached")) {
      throw new TypeError(`Recorded-reading admission lacks a reached capability disposition for ${instrument} ${capability}`);
    }
  }
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
    assertRecordedReadingCapabilityDispositions();
    return Object.freeze({
      engines,
      policyModes: Object.freeze(SUPPORTED_POLICY_MODES.filter((mode) =>
        mode === "human_common" || mode === "theory_strict"
          ? providerState.opponent !== "none"
          : mode === "strong_engine"
            ? providerState.judge !== "none"
        : mode === "perfect_tablebase"
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
      costBasis: Object.freeze([
        "material" as const,
        ...(providerState.judge === "none" ? [] : ["engine" as const]),
        ...(providerState.tablebase === "none" ? [] : ["tablebase" as const]),
      ]),
      capabilityDispositions: CAPABILITY_DISPOSITIONS,
      recordedReadingKinds: RECORDED_READING_DISPOSITIONS,
      assessmentCategories: ASSESSMENT_CATEGORIES,
      objectiveAssessmentSets: OBJECTIVE_ASSESSMENT_SETS,
      runSchemaVersion: runtimeBuildInfo.runSchemaVersion,
      policyProfiles: Object.freeze({
        strong_engine: this.#strongEngineProfile,
        human_common: Object.freeze({
          elo,
          resistance: HUMAN_COMMON_RESISTANCE_PROFILE,
        }),
      }),
      providers: providerState,
      surfaces: surfaces(providerState),
      evidenceManifest: evidenceManifestCapabilities(providerState),
    });
  }
}
