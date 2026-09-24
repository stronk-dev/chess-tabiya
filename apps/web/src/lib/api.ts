import { parseConceptCatalogueView, type ConceptCatalogueView, type ConceptLabelView } from "@chess-tabiya/runtime";
import type {
  DrillPackDefinition,
  PackPhase,
} from "@chess-tabiya/schema/drill-pack";
import type { ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import type {
  BranchComparison,
  CorpusPopulation,
  CorpusResult,
  BranchGroup,
  DrillRun,
  DrillRunEvent,
  EvidenceKind,
  EvidenceForm,
  EvidencePayload,
  LiveSessionKind,
  MutationResult,
  Node,
  ObjectiveEvidenceProposal,
  ObjectiveState,
  OpponentSelection,
  PolicyConfig,
  ProviderOffBehavior,
  ReasoningDetection,
  ReasoningTranscript,
  RunMark,
  ReviewStoryReceipt,
  ReviewAnalysis,
  ReviewMapProjection,
  BotCardSourceId,
  BotCardStatementId,
  BotClassifierId,
  BotProfileFamily,
  BotProfileId,
  BotProfileReference,
  BotProfileStartability,
  BotOpponentPlyRequest,
  BotOpponentPlyResultRow,
  BotLayerId,
  BotDegradationReason,
  FinalizedAssistanceV1,
  RequestedAssistanceV1,
  ImportSourceKind,
  ImportSourceRequestKind,
} from "@chess-tabiya/runtime";
import { parseBotOpponentPlyResultRow, parseFinalizedAssistanceV1, parseHintResponse, parseReviewStoryReceipt, type HintResponse, type HintRung } from "@chess-tabiya/runtime";
import type { RatingPublication } from "@chess-tabiya/runtime/rating";

import { parsePackCatalog, parsePrincipleCatalog, parseShapeCatalog } from "./content-catalog-response.js";
import { parseCapabilities } from "./capability-response.js";
import {
  parseLearnerProfile,
  parseObservationDetail,
  parseOpeningDetail,
  parseProfileHistory,
  parseSharedCard,
  parseStyleCardPage,
  type LearnerProfileView,
  type ObservationDetail,
  type OpeningDetail,
  type ProfileHistoryRow,
  type ProfilePage,
  type SharedHabitCard,
  type StyleCardPage,
} from "./profile-response.js";
import { parseEvidencePage } from "./evidence-page-response.js";
import { parsePostcommitNudge, type PostcommitNudge } from "./nudge-response.js";
import { parseCorpusPage, parseHumanSplitPage } from "./human-evidence-response.js";
import { parseGroupReplyResult, parsePredictionResult } from "./opponent-path-response.js";
import { parseOpponentSelection } from "./opponent-selection-response.js";
import { parsePackDocument } from "./pack-response.js";
import { parseDifficultRoots, parseDueQueue, parseProgressAttempts, parseProgressMilestones, parseProgressRecommendations, parseRelatedProgress } from "./progress-response.js";
import { parseShapeDocument } from "./shape-response.js";
import {
  librarySearchPath,
  parseLibrarySearch,
  parseOpeningEntry,
  parsePackEntry,
  parsePrincipleEntry,
  parseShapeEntry,
  type LibrarySearchQuery,
  type LibrarySearchResult,
  type OpeningEntryView,
  type PackEntryView,
  type PrincipleEntryView,
  type ShapeEntryLibraryView,
} from "./theory-library.js";
import { parseVoicePage } from "./voice-response.js";

export interface PackSummary {
  readonly id: string;
  readonly version: string;
  readonly digest: string;
  readonly title: string;
  readonly mode: string;
  readonly phase: PackPhase | null;
  readonly difficulty: unknown;
  readonly objectiveSummary: string;
  readonly consequenceHorizon?: { readonly kind: "declared" | "authored"; readonly plies: number } | null;
  /** Registry-labelled concept references (rfc/concept-registry.md §6). */
  readonly concepts: readonly PackConceptLabel[];
  readonly reviewStatus: string;
  readonly channel: "official" | "community";
  readonly publisherHandle?: string;
}

/** One pack concept reference as the server's compiled registry labels it. */
export interface PackConceptLabel {
  readonly id: string;
  readonly label: string;
  readonly status: "active" | "retired" | "unregistered";
}

export type { ConceptCatalogueView, ConceptLabelView } from "@chess-tabiya/runtime";

export interface PackDocument {
  readonly document: DrillPackDefinition;
  readonly digest: string;
}

export interface ShapeSummary {
  readonly id: string;
  readonly version: string;
  readonly digest: string;
  readonly name: string;
  readonly phases: ShapeEntryDefinition["phases"];
  readonly licence: string;
  readonly channel: "official" | "community";
  readonly publisherHandle?: string;
  readonly usedByPacks: number;
}

export interface PrincipleSummary {
  readonly id: string;
  readonly version: string;
  readonly digest: string;
  readonly name: string;
  readonly statement: string;
  readonly phases: readonly ("opening" | "middlegame" | "endgame")[];
  readonly licence: string;
  readonly usedByPacks: number;
}

export type ShapeEntryView = ShapeEntryDefinition & {
  readonly channel: "official" | "community";
  readonly publisherHandle?: string;
};

export interface ShapeDocument {
  readonly document: ShapeEntryView;
  readonly digest: string;
}

export interface RunGraph {
  readonly id: string;
  readonly viewer: {
    readonly role: RunRole;
    readonly mayWrite: boolean;
    readonly holdsLease: boolean;
    readonly leaseHeldBy: LeaseIdentity;
    readonly seatedInContest: boolean;
    readonly reviewing: boolean;
    readonly reviewRail:
      | "not_applicable"
      | "open"
      | "closed_incomplete"
      | "closed_live_session"
      | "closed_shared_not_submitted";
  };
  readonly nodes: readonly Node[];
  readonly branches: DrillRun["branches"];
  readonly activeCursor: DrillRun["activeCursor"];
}

export interface RunSummary {
  readonly id: string;
  readonly title: string;
  readonly sessionKind: "pack" | "position" | "imported";
  readonly packId: string | null;
  readonly sessionDigest: string;
  readonly updatedAt: string;
  readonly objectiveState: ObjectiveState;
  readonly branchCount: number;
  readonly recordedMoveCount: number;
  readonly viewerRole: RunRole;
  readonly leaseHeldBy: LeaseIdentity;
}
export interface RunPage { readonly runs: readonly RunSummary[]; readonly selection: { readonly shown: number; readonly total: number }; }

export type RunRole = "host" | "participant" | "spectator";

export interface LeaseIdentity {
  readonly learnerId: string;
  readonly handle: string;
}

export interface Learner {
  readonly id: string;
  readonly handle: string;
  readonly displayName?: string;
  readonly createdAt: string;
}

export interface DeletionEffect {
  readonly kind: string;
  readonly count: number;
  readonly objectIds: readonly string[];
  readonly label: string;
}

/** `GET /auth/account-inventory`: one row per data class, counted from the export projection. */
export interface AccountInventory {
  readonly version: 1;
  readonly classes: readonly {
    readonly dataClass: string;
    readonly count: number;
    readonly stores: readonly {
      readonly store: string;
      readonly exportDisposition: "project" | "reference" | "metadata_only" | "exclude";
      readonly deletionDisposition: "hard_delete" | "classify_run" | "tombstone" | "retain" | "clear_browser";
      readonly count: number | null;
    }[];
  }[];
}

/** `POST /auth/import-preview` and `POST /auth/import`. */
export interface AccountImportReceipt {
  readonly version: 1;
  readonly mode: "preview" | "committed";
  readonly bundleDigest: string;
  readonly bundleFormatVersion: number;
  readonly sourceStorageVersion: number;
  readonly restored: readonly { readonly table: string; readonly count: number }[];
  readonly rederived: readonly string[];
  readonly notRestored: readonly { readonly kind: string; readonly count: number; readonly reason: string }[];
  readonly conflicts: readonly string[];
}

export interface AccountExportProgress {
  readonly receivedBytes: number;
  /** Null when the server did not state a length; the client then shows bytes only. */
  readonly totalBytes: number | null;
}

export interface DeletionPreview {
  readonly version: 1;
  readonly scope: { readonly kind: "account" } | { readonly kind: "run"; readonly runId: string };
  readonly digest: string;
  readonly hardDelete: readonly DeletionEffect[];
  readonly tombstone: readonly DeletionEffect[];
  readonly revoke: readonly DeletionEffect[];
  readonly retainedPublished: readonly DeletionEffect[];
  readonly backupNotice: string;
}

export interface RunGrant extends LeaseIdentity {
  readonly role: RunRole;
  readonly grantedAt: string;
}

export type GrantOperation =
  | { readonly op: "grant"; readonly handle: string; readonly role: RunRole }
  | { readonly op: "revoke"; readonly handle: string };

export interface EventsPage {
  readonly events: readonly DrillRunEvent[];
  readonly nextSeq: number;
  readonly withheld?: true;
}

export interface StagedEvidence {
  readonly seq: number;
  readonly jobId: string;
  readonly runId: string;
  readonly nodeId: string;
  readonly evidenceRefs: readonly [string, ...string[]];
  readonly payload: EvidencePayload;
  readonly objectiveProposal?: ObjectiveEvidenceProposal;
}

export interface EvidencePage {
  readonly results: readonly { readonly seq: number }[];
  readonly nextSeq: number;
}

export type RevealAttribution =
  | {
      readonly kind: "checkpoint";
      readonly checkpointId: string;
      readonly eventSeq: number;
    }
  | { readonly kind: "outcome"; readonly eventSeq: number };

export type AuthoredFeedbackItem =
  | {
      readonly kind: "annotation";
      readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor: { readonly spineNodeId: string };
      readonly text: string;
    }
  | {
      readonly kind: "deviation";
      readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor: { readonly spineNodeId: string; readonly moveUci: string };
      readonly note: string;
      readonly deviationClass?: string;
      readonly offObjective?: boolean;
    }
  | {
      readonly kind: "plan_class";
      readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor: { readonly checkpointId: string };
      readonly label: string;
      readonly description?: string;
      readonly shapePlan?: { readonly shape: string; readonly plan: string };
      readonly gradability: "graded" | "declared_uncheckable" | "unbound";
      readonly gradabilityNote?: string;
    }
  | {
      readonly kind: "theory_verdict";
      readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor: { readonly nodeId: string; readonly ply: number; readonly moveUci: string };
      readonly verdict: "on_line" | "classified_deviation" | "unknown";
      readonly spineNodeId?: string;
      readonly deviationClass?: string;
      readonly deviationMistakes?: readonly string[];
    }
  | {
      readonly kind: "claim";
      readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor: { readonly claimId: string };
      readonly text: string;
      readonly evidenceTypes: readonly string[];
      readonly earnedEvidenceTypes: readonly string[];
      readonly binding: "ledger_bound" | "author_attributed" | "self_declared";
      readonly authorSpans: readonly string[];
      readonly principles: readonly {
        readonly id: string;
        readonly name: string;
        readonly statement: string;
        readonly standsOn: string;
        readonly counterCase: string;
      }[];
    };

export interface AuthoredFeedbackPage {
  readonly items: readonly AuthoredFeedbackItem[];
  readonly hasWithheldAuthoredContent: boolean;
}

export interface ReasoningKeyPointView {
  readonly id: string;
  readonly label: string;
  readonly ground: import("@chess-tabiya/schema/drill-pack").ReasoningGround;
  readonly attribution: string;
}
export interface ReasoningOccurrenceView {
  readonly eventSeq: number;
  readonly checkpointEventSeq: number;
  readonly branchId: string;
  readonly skipped: boolean;
  readonly transcript: ReasoningTranscript | null;
  readonly detections?: readonly ReasoningDetection[];
  readonly keyPoints?: readonly ReasoningKeyPointView[];
}
export interface ReasoningPage {
  readonly checkpointId: string;
  readonly occurrences: readonly ReasoningOccurrenceView[];
  readonly previous: { readonly runId: string; readonly eventSeq: number; readonly skipped: boolean; readonly transcript: ReasoningTranscript | null; readonly detections: readonly ReasoningDetection[] } | null;
  readonly absenceSentence: string;
  readonly honestySentence: string;
}

export interface ReasoningReviewProposal {
  readonly keyPointId: string;
  readonly quotation: string;
  readonly text: string;
}

export interface ReasoningReviewPage {
  readonly provider: "external";
  readonly proposals: readonly ReasoningReviewProposal[];
}

export interface EngineCapability {
  readonly id: string;
  readonly kind: "opponent" | "judge";
  readonly name: string;
  readonly version: string;
  readonly modelId?: string;
  readonly containerDigest?: string;
  readonly seedHonored: boolean;
  readonly eloHonored?: boolean;
}

export type SurfaceId =
  | "play"
  | "review"
  | "learn"
  | "live"
  | "create"
  | "justPlay"
  | "fromPosition";

export type SurfaceAvailability = "available" | "unavailable-here";

/** Roadmap state is build-owned and deliberately never sent by the server. */
export const PLANNED_SURFACES: readonly SurfaceId[] = Object.freeze([
]);

export type SessionKind = LiveSessionKind;
export type BoardControl = "free_claim" | "host_directed" | "rotation" | "match";
export interface LiveSession {
  readonly id: string; readonly runId: string; readonly kind: SessionKind;
  readonly title: string; readonly boardControl: BoardControl; readonly scheduledFor?: string;
  readonly voteAdapterLearnerId?: string; readonly rotation?: readonly string[];
  readonly handoffLearnerId?: string; readonly rotationCursor: number;
  readonly createdBy: string; readonly createdAt: string; readonly closedAt?: string;
  readonly classroomId?: string;
}
export interface MatchState { readonly sessionId:string;readonly whiteLearnerId:string|null;readonly blackLearnerId:string|null;readonly pausedAt:string|null;readonly pauseProposedBy:string|null }
export interface LiveSessionSummary extends LiveSession { readonly classroom?:{readonly id:string;readonly name:string};readonly board:{readonly activeFen:string;readonly objectiveState:ObjectiveState;readonly sideToMove:"white"|"black";readonly plyCount:number;readonly pausedAt:string|null;readonly leaseHeldBy:LeaseIdentity;readonly lastMoveAt:string|null;readonly players?:{readonly white:LeaseIdentity|null;readonly black:LeaseIdentity|null}};readonly match?:MatchState }
export interface SessionProposal { readonly id:string;readonly sessionId:string;readonly nodeId:string;readonly moveUci:string;readonly proposedBy:string;readonly at:string;readonly status:"open"|"applied"|"declined"|"stale";readonly resolvedRunSeq:number|null }
export interface VoteOption { readonly moveUci:string;readonly label:string }
export interface VoteTally { readonly window:{readonly id:string;readonly sessionId:string;readonly nodeId:string;readonly prompt:string;readonly options:readonly VoteOption[];readonly opensAt:string;readonly closesAt:string;readonly state:"open"|"closed"|"stale";readonly appliedOptionUci:string|null};readonly tally:readonly (VoteOption&{readonly count:number})[];readonly total:number;readonly relayed:number }
export interface SessionJournalEntry { readonly sessionId:string;readonly seq:number;readonly at:string;readonly kind:string;readonly actorLearnerId:string|null;readonly runSeq:number|null;readonly payload:Readonly<Record<string,unknown>> }
export interface MoveAuthorship { readonly eventSeq:number;readonly nodeId:string;readonly learnerId:string|null }
export interface SessionInvitation { readonly id:string;readonly sessionId:string;readonly leg:1|2|null;readonly invitedHandle:string|null;readonly invitedRole:RunRole;readonly externalChallengeUrl:string|null;readonly state:"open"|"accepted"|"revoked";readonly createdAt:string }
export interface ArenaLeg { readonly sessionId:string;readonly leg:1|2;readonly referencePlayerHandle:string|null;readonly externalChallengeUrl:string|null;readonly pgn:string|null;readonly result:"1-0"|"0-1"|"1/2-1/2"|"*"|null;readonly branchId:string|null;readonly importedAt:string|null }
export interface RelayedMark { readonly scope:"position"|"branch";readonly brush:import("@chess-tabiya/runtime").MarkBrush;readonly orig:string;readonly dest?:string;readonly drawnBy?:LeaseIdentity;readonly at:string }
export interface LiveSessionDetail { readonly session:LiveSession;readonly classroom?:{readonly id:string;readonly name:string};readonly role:RunRole;readonly activeNodeId:string;readonly activeFen:string;readonly leaseHeldBy:LeaseIdentity;readonly voteAdapter?:LeaseIdentity;readonly grants:readonly RunGrant[];readonly moveAuthorship:readonly MoveAuthorship[];readonly proposals:readonly SessionProposal[];readonly vote?:VoteTally;readonly invitations:readonly SessionInvitation[];readonly legs:readonly ArenaLeg[];readonly match?:MatchState;readonly marks:readonly RelayedMark[];readonly marksTruncated?:true }
export interface SessionJoinLink {readonly id:string;readonly scope:"session_join";readonly sessionId:string;readonly matchSlot:"white"|"black"|null;readonly invitedRole:"participant"|"spectator";readonly invitedHandle:string|null;readonly expiresAt:string;readonly usesRemaining:number;readonly createdAt:string;readonly revokedAt:string|null}

export interface ClassroomSummary { readonly id:string;readonly ownerLearnerId:string;readonly name:string;readonly createdAt:string;readonly archivedAt:string|null;readonly memberRole:"teacher"|"learner";readonly memberState:"invited"|"active"|"left";readonly invitation?:{readonly invitedAt:string;readonly invitedBy:LeaseIdentity|null} }
export interface ClassroomMember { readonly classroomId:string;readonly learnerId:string;readonly handle:string;readonly memberRole:"teacher"|"learner";readonly state:"invited"|"active"|"left";readonly invitedBy:string|null;readonly invitedAt:string;readonly joinedAt:string|null;readonly leftAt:string|null }
export interface ClassroomAssignment { readonly id:string;readonly classroomId:string;readonly packId:string;readonly assignedBy:string;readonly note:string|null;readonly dueAt:string|null;readonly createdAt:string;readonly withdrawnAt:string|null }
export interface AssignmentSubmission { readonly assignmentId:string;readonly learnerId:string;readonly runId:string;readonly grantedLearnerIds:readonly string[];readonly submittedAt:string;readonly accessExpiresAt:string;readonly withdrawnAt:string|null;readonly access?:"available"|"revoked_or_expired" }
export interface ClassroomDetail { readonly classroom:Omit<ClassroomSummary,"memberRole"|"memberState">;readonly membership:ClassroomMember;readonly members:readonly ClassroomMember[];readonly assignments:readonly ClassroomAssignment[];readonly submissions:readonly AssignmentSubmission[];readonly upcomingSessions:readonly LiveSession[] }
export interface AssignedPackSubmission extends AssignmentSubmission { readonly grantedTeacherHandles:readonly string[] }
export interface AssignedPack extends ClassroomAssignment { readonly classroomName:string;readonly assignedByHandle:string;readonly teacherHandles:readonly string[];readonly submissions:readonly AssignedPackSubmission[] }

export interface RatingView {
  readonly rating?: RatingPublication | null;
  readonly disclosures: readonly string[];
}

export interface RatingPeriod {
  readonly periodNo: number;
  readonly calibrationId: string;
  readonly openedAt: string;
  readonly closedAt: string | null;
  readonly games: number;
  readonly ratingBefore: number;
  readonly rdBefore: number;
  readonly volatilityBefore: number;
  readonly ratingAfter: number | null;
  readonly rdAfter: number | null;
  readonly volatilityAfter: number | null;
}

export interface RatedGameHistoryItem {
  readonly runId: string;
  readonly calibrationId: string;
  readonly opponentBand: number;
  readonly learnerSide: "white" | "black";
  readonly state: "sealed" | "voided";
  readonly voidReason: "rewound" | "forked" | "assistance" | "engine_changed" | "calibration_retired" | "abandoned" | null;
  readonly result: "win" | "loss" | "draw" | null;
  readonly terminalReason: "checkmate" | "stalemate" | "insufficient_material" | "fifty_move" | "threefold" | null;
  readonly plyCount: number | null;
  readonly periodNo: number | null;
  readonly startedAt: string;
  readonly sealedAt: string | null;
}

export interface RatingHistoryPage {
  readonly periods: readonly RatingPeriod[];
  readonly games: readonly RatedGameHistoryItem[];
}

export interface LearnerMark {
  readonly mark: "bronze" | "silver" | "gold";
  readonly calibrationId: string;
  readonly runId: string;
  readonly earnedAt: string;
}

export interface CohortStandingRecord {
  readonly classroomId: string;
  readonly openedByLearnerId: string;
  readonly windowFrom: string;
  readonly windowTo: string | null;
  readonly openedAt: string;
  readonly closedAt: string | null;
}

export interface StandingRecord {
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
  readonly games: number;
  readonly points: number;
  readonly abandoned: number;
  readonly byOpponentBand: readonly {
    readonly opponentBand: number;
    readonly wins: number;
    readonly draws: number;
    readonly losses: number;
    readonly games: number;
    readonly points: number;
  }[];
}

export interface CohortStandingEntry {
  readonly learnerId: string;
  readonly handle: string;
  readonly marks: readonly {
    readonly mark: "bronze" | "silver" | "gold";
    readonly band: 1400 | 1800 | 2200;
    readonly calibrationId: string;
    readonly earnedAt: string;
  }[];
  readonly record?: StandingRecord;
  readonly rating?: RatingPublication & { readonly group: string | number };
}

export interface CohortStandingView {
  readonly standing: CohortStandingRecord;
  readonly limitation: string;
  readonly entries: readonly CohortStandingEntry[];
}

export interface BotCardWire {
  readonly profileId: BotProfileId;
  readonly profileDigest: `sha256:${string}`;
  readonly behaviorDigest: `sha256:${string}`;
  readonly family: BotProfileFamily;
  readonly band: number;
  readonly title: string;
  readonly controlledTraits: readonly BotClassifierId[];
  readonly statements: readonly { readonly id: BotCardStatementId; readonly text: string; readonly sources: readonly BotCardSourceId[] }[];
  readonly strength: { readonly kind: "uncalibrated" } | { readonly kind: "calibrated"; readonly humanLikeLabelAllowed: boolean; readonly [key: string]: unknown };
  readonly decorative: null;
}

export interface BotRosterRow {
  readonly reference: BotProfileReference;
  readonly behaviorDigest: `sha256:${string}`;
  readonly card: BotCardWire;
  readonly startable: BotProfileStartability;
}

export interface Capabilities {
  readonly engines: readonly EngineCapability[];
  readonly policyModes: readonly (
    | "human_common"
    | "strong_engine"
    | "theory_strict"
    | "perfect_tablebase"
    | "practical_resistance"
  )[];
  readonly unsupportedPolicyModes: readonly {
    readonly mode: string;
    readonly reason: string;
  }[];
  readonly feedbackPolicies: readonly (
    | "delayed_checkpoint"
    | "segment_end"
    | "immediate_guard"
  )[];
  readonly guardBasis: readonly ("rules" | "engine")[];
  readonly recordedReadingKinds: readonly {
    readonly kind: string;
    readonly disposition: "admitted" | "refused";
    readonly reason: string;
  }[];
  readonly assessmentCategories: readonly ("win" | "loss" | "draw" | "cursed-win" | "blessed-loss")[];
  readonly objectiveAssessmentSets: Readonly<Record<"win" | "hold" | "save" | "resist", readonly string[]>>;
  readonly runSchemaVersion: string;
  readonly policyProfiles: {
    readonly strong_engine: {
      readonly movetimeMs: number;
      readonly threads: number;
      readonly hashMb: number;
      readonly multiPv: number;
    };
    readonly human_common: {
      readonly elo: {
        readonly min: number | null;
        readonly max: number | null;
        readonly default: number | null;
        readonly source: "advertised" | "configured" | "advertised+configured" | "unpublished";
        readonly advertised: { readonly min: number | null; readonly max: number | null };
      };
      readonly resistance: {
        readonly basis: "measured";
        readonly metric: "dtz_percentile";
        readonly scope: string;
        readonly corpus: { readonly dossier: string; readonly positions: number; readonly probes: number; readonly measuredAt: string };
        readonly bands: readonly number[];
        readonly bandConditioned: boolean;
        readonly dtzPercentile: { readonly min: number; readonly max: number; readonly uniformBaseline: number };
        readonly slowestLosingRate: { readonly min: number; readonly max: number; readonly uniformBaseline: number };
        readonly fastestLosingRate: { readonly value: number; readonly uniformBaseline: number };
      };
      /** The registered `bot-profile-catalog@1` roster with grounded cards (rfc/bot-policy.md §8). */
      readonly profiles: readonly BotRosterRow[];
    };
  };
  readonly providers: {
    readonly opponent: "maia" | "mock" | "none";
    readonly judge: "stockfish" | "mock" | "none";
    readonly llm: "none" | "external";
    readonly corpus: "lichess-explorer" | "mock" | "none";
    readonly tts: "none" | "external";
    readonly tablebase: "lichess" | "mock" | "none";
  };
  readonly surfaces: Readonly<Record<SurfaceId, SurfaceAvailability>>;
  readonly evidenceManifest: {
    readonly digest: string;
    readonly counts: { readonly producers: number; readonly projections: number; readonly consumers: number; readonly bindings: number; readonly semanticEvents: number; readonly eligibility: number; readonly reasons: number; readonly selectionPolicies: number };
    readonly availability: readonly {
      readonly producerId: string;
      readonly version: number;
      readonly state: "available" | "honest_empty" | "unavailable";
      readonly reason: string;
    }[];
    readonly bindings: readonly {
      readonly consumerId: string;
      readonly consumerVersion: number;
      readonly projectionId: string;
      readonly projectionVersion: number;
      readonly forms: readonly EvidenceForm[];
      readonly providerOff: ProviderOffBehavior;
    }[];
  };
}

export interface HumanSplitPage {
  readonly nodeId: string;
  readonly engine: OpponentSelection["engine"];
  readonly targetElo: number | null;
  readonly candidates: readonly NonNullable<OpponentSelection["candidates"]>[number][];
}

export type { CorpusPopulation, CorpusResult } from "@chess-tabiya/runtime";
export interface CorpusPage { readonly nodeId: string; readonly result: CorpusResult; readonly committedMoveSan: string | null; }
export interface RepertoireSummary {readonly id:string;readonly name:string;readonly side:"white"|"black";readonly targetElo:number;readonly coverageDenominator:number;readonly digest:string;readonly updatedAt:string;readonly scan:null|{readonly scannedAt:string;readonly stale:boolean;readonly truncated:boolean;readonly gapCount:number}}
export interface RepertoireView extends RepertoireSummary {readonly rootFen:string;readonly sourceKind:"pgn_paste"|"lichess_study";readonly sourceUrl:string|null;readonly licenceNote:string;readonly moves:readonly {readonly positionKey:string;readonly moveUci:string;readonly moveSan:string;readonly representativeFen:string;readonly rank:number;readonly origin:"imported"|"chosen_from_attempt"}[]}
export interface RepertoireGap {readonly key:string;readonly representativeFen:string;readonly replySan:string;readonly replyUci:string;readonly line:readonly string[];readonly mass?:number;readonly gamesUntilSeen?:number;readonly state:"open"|"addressed"|"answered";readonly runId:string|null;readonly firstMoves:readonly {readonly moveUci:string;readonly moveSan:string}[];readonly answer:{readonly moveUci:string;readonly moveSan:string}|null}
export interface RepertoireGapPage {readonly status:"pending"|"never_scanned"|"ready";readonly stale?:boolean;readonly repertoire:RepertoireSummary;readonly scan:null|{readonly scannedAt:string;readonly population:CorpusPopulation;readonly gaps:readonly RepertoireGap[];readonly alternateGaps:readonly RepertoireGap[];readonly unknown:readonly {readonly key:string;readonly line:readonly string[];readonly reason:string;readonly detail:string;readonly gamesUntilPosition:number}[];readonly uncoveredMass:number;readonly truncated:boolean;readonly sourceFailures:number;readonly queriesUsed:number;readonly unreachedKeys:number;readonly guard:string;readonly partiality:string|null}}
export type ProgressRecommendation = {readonly kind:"repertoire_gap";readonly repertoireId:string;readonly repertoireName:string;readonly gapKey:string;readonly replySan:string;readonly line:readonly string[];readonly gamesUntilSeen:number}|{readonly kind:"shape_encounter";readonly shapeId:string;readonly shapeName:string;readonly runCount:number;readonly runIds:readonly string[];readonly packIds:readonly string[]};
export interface ProgressRecommendationPage { readonly recommendations: readonly ProgressRecommendation[]; readonly selection: { readonly shown: number; readonly total: number }; }
export interface DistillResult {readonly draft:PackDraft;readonly proposals:readonly Record<string,unknown>[];readonly dropped:readonly string[]}

export interface VoicePage { readonly text: string; readonly source: "provider" | "deterministic"; readonly scope: "marker" | "reading" | "steering" | "story" | "compare"; }

export interface ImportedGameRecord {
  readonly runId: string;
  readonly sourceKind: ImportSourceKind;
  readonly sourceUrl: string | null;
  readonly movetextDigest: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly result: "1-0" | "0-1" | "1/2-1/2" | "*";
  readonly pgn: string;
  readonly licenceNote: string;
  readonly importedAt: string;
}
export interface ImportGameRequest {
  readonly id: string;
  readonly side: "white" | "black";
  readonly opponentPolicy: { readonly mode: "human_common" | "strong_engine"; readonly targetElo?: number };
  readonly policyConfig: PolicyConfig;
  readonly seed: number;
  readonly source: { readonly kind: Extract<ImportSourceRequestKind, "pgn">; readonly pgn: string } | { readonly kind: Extract<ImportSourceRequestKind, "lichess">; readonly url: string };
}
/** The imported or native source summary carried by the Review Map header. */
export type ReviewSourceSummary = { readonly kind: "native" } | { readonly kind: ImportedGameRecord["sourceKind"]; readonly url?: string; readonly headers: Readonly<Record<string, string>>; readonly result: ImportedGameRecord["result"]; readonly importedAt: string };
export type ReviewOutcomeSummary =
  | { readonly kind: "board_terminal"; readonly result: "win" | "loss" | "draw" }
  | { readonly kind: "recorded_result"; readonly result: Exclude<ImportedGameRecord["result"], "*"> }
  | { readonly kind: "unfinished" };
/** rfc/review-evidence-compiler.md §4: `GET /runs/:id/story` is exactly the closed review-story@1 receipt. */
export type GameStory = ReviewStoryReceipt;
/** rfc/review-map.md: the whole-game Review Map payload from `GET /runs/:id/review`. */
export type ReviewMap = ReviewMapProjection & {
  readonly runId: string;
  readonly branchId: string;
  readonly side: "white" | "black";
  readonly ready: boolean;
  readonly pendingEvidence: number;
  readonly source: ReviewSourceSummary;
  readonly outcome: ReviewOutcomeSummary;
  readonly storyTitle: string;
  readonly viewer: { readonly mayWrite: boolean };
  readonly semanticPath: { readonly kind: "available"; readonly events: number } | { readonly kind: "refused"; readonly reason: string };
};
/** rfc/review-map.md §7 (O7.3): the explicit Analyze reveal from `GET /runs/:id/review-analysis`. */
export type ReviewAnalysisPage = ReviewAnalysis & { readonly runId: string; readonly branchId: string };
export interface StoryShare { readonly id: string; readonly scope: "story_read"; readonly runId: string; readonly branchId: string; readonly createdAt: string; readonly revokedAt: string | null; }
export interface CreatedStoryShare extends Omit<StoryShare, "revokedAt"> { readonly token: string; readonly url: string; readonly revokedAt: null; }
export interface RevokedStoryShare { readonly revoked: true; readonly runId: string; readonly tokenId: string; readonly revokedAt: string; }
export interface RunDerivation { readonly derivedRunId: string; readonly sourceRunId: string; readonly sourceBranchId: string; readonly sourceNodeId: string; readonly kind: "flip_sides"; readonly createdAt: string; }
export interface RunDerivationPage { readonly source: RunDerivation | null; readonly derived: readonly RunDerivation[]; }
export interface ProgressMilestone { readonly kind: "first_attempt" | "first_stable" | "first_objective_achieved" | "first_win" | "first_scheduled_return" | "ten_attempts_one_root" | "first_flip_sides"; readonly occurredAt: string; readonly sentence: string; readonly link: { readonly runId: string; readonly branchId: string }; }

export interface CreateRunRequest {
  readonly id: string;
  readonly session:
    | { readonly kind: "pack"; readonly packId: string; readonly packDigest?: string }
    | {
        readonly kind: "position";
        readonly start: { readonly fen: string; readonly side: "white" | "black" };
        readonly feedbackPolicy: "attempt_end";
        readonly opponentPolicy: {
          readonly mode: "human_common" | "strong_engine";
          readonly targetElo?: number;
          readonly temperature?: number;
          readonly topP?: number;
          readonly profile?: BotProfileReference;
        };
      };
  readonly policyConfig: PolicyConfig;
  readonly seed: number;
  readonly createdAt?: string;
  readonly intent?: {
    readonly origin: "fresh" | "duplicate";
    readonly scheduleId?: string;
    readonly derivedFromRunId?: string;
  };
}

export interface CreateRatedGameRequest {
  readonly id: string;
  readonly start: { readonly fen: string };
  readonly side: "white" | "black";
  readonly band: 1000 | 1400 | 1800 | 2200;
  readonly policyConfig: PolicyConfig;
  readonly seed: number;
  readonly createdAt?: string;
}

export interface ProgressAttempt {
  readonly runId: string;
  readonly branchId: string;
  readonly packId: string | null;
  readonly branchLabel: string;
  readonly attemptNo: number;
  readonly countable: boolean;
  readonly graded: boolean;
  readonly verdict: "stable" | "unstable" | "open";
  readonly result: "win" | "loss" | "draw" | null;
  readonly userPlyCount: number;
  readonly origin: "fresh" | "duplicate" | "scheduled" | "in_run_retry";
  readonly endedAt: string;
}

export interface ProgressSchedule {
  readonly id: string;
  readonly sessionKind: "pack" | "position";
  readonly packId: string | null;
  readonly kind: "blocked" | "varied";
  readonly variant: string | null;
  readonly dueAt: string;
  readonly sourceRunId: string | null;
}

/**
 * The coarse return standing (rfc/return-scheduling.md Discharge D2): a closed vocabulary word the
 * server derives from the return-ladder rung. It describes spaced-recall standing, never mastery.
 */
export const RETURN_STANDINGS = Object.freeze(["new", "learning", "established"] as const);
export type ReturnStanding = (typeof RETURN_STANDINGS)[number];

/** A served due return (rfc/return-scheduling.md §§4, 6): frequency is a population count that orders, never grades. */
export interface DueSchedule extends ProgressSchedule {
  readonly frequency: { readonly games: number; readonly population: CorpusPopulation } | null;
  readonly standing: ReturnStanding;
}

export interface DueQueuePage {
  readonly schedules: readonly DueSchedule[];
  readonly waiting: number;
  readonly intakeLimit: number;
}

/** Roots with at least `threshold` unstable graded attempts; counts only, never a ratio or level. */
export interface DifficultRoot {
  readonly sessionKind: "pack" | "position";
  readonly packId: string | null;
  readonly unstableCount: number;
  readonly lastUnstableAt: string;
  readonly runs: readonly { readonly runId: string; readonly endedAt: string }[];
}

export interface DifficultRootPage {
  readonly threshold: number;
  readonly total: number;
  readonly roots: readonly DifficultRoot[];
}

export interface ScheduledReturnResult {
  readonly schedule: ProgressSchedule;
  readonly result: MutationResult;
}

export interface RelatedProgressAttempt {
  readonly relation: "same_position" | "same_pack" | "same_concept";
  readonly runId: string;
  readonly branchId: string;
  readonly attemptCount: number;
  /** The shared registered concept, rendered from its exact revision (`same_concept` only). */
  readonly concept?: ConceptLabelView;
}

export interface PackDraft {
  readonly id: string;
  readonly packId: string;
  readonly document: unknown;
  readonly digest: string;
  readonly state: "draft" | "registered" | "withdrawn";
  readonly validation: { readonly valid: boolean; readonly issues: readonly { readonly severity?: "error" | "warning"; readonly code: string; readonly path: string; readonly message: string }[] };
}

export type PackValidation = PackDraft["validation"];

export interface ShapeDraft {
  readonly id: string;
  readonly shapeId: string;
  readonly document: unknown;
  readonly digest: string;
  readonly state: "draft" | "registered" | "withdrawn";
  readonly validation: {
    readonly valid: boolean;
    readonly issues: readonly { readonly severity?: "error" | "warning"; readonly code: string; readonly path: string; readonly message: string }[];
    readonly probeMatches?: boolean;
    readonly corpusPreview?: {
      readonly fires: number;
      readonly of: number;
      readonly matches: readonly { readonly packId: string; readonly packTitle: string; readonly ply: number; readonly fen: string; readonly startSide: "white" | "black" }[];
    };
  };
}

export interface SelectMoveRequest {
  readonly startFen: string;
  readonly historyUci: readonly string[];
  readonly policy: {
    readonly mode: string;
    readonly policyConfigDigest: string;
    readonly targetElo?: number;
    readonly temperature?: number;
    readonly topP?: number;
  };
  readonly seed: number;
  readonly packId?: string;
}

export interface PredictionRequest extends SelectMoveRequest {
  readonly checkpointId: string;
  readonly nodeId: string;
  readonly predictedUci: string;
  readonly at?: string;
}

export interface PredictionResult extends MutationResult {
  readonly selection: OpponentSelection;
}

export interface CreateGroupRequest {
  readonly source: "hand_picked" | "authored" | "human_replies" | "engine_top_n";
  readonly resistance?: "fixed" | "per_branch";
  readonly candidates?: readonly string[];
  readonly size?: number;
  readonly at?: string;
}

export interface CreateGroupResult extends MutationResult {
  readonly group: BranchGroup;
  readonly comparison: BranchComparison;
}

export interface GroupReplyResult {
  readonly selection: OpponentSelection;
  readonly reusedFromNodeId: string | null;
}

export interface SimulationBranch {
  readonly index: number;
  readonly label: string;
  readonly leafFen: string;
  readonly plies: number;
  readonly truncatedAt?: string;
  readonly subvariationsSkipped?: number;
}

export interface SimulationResult {
  readonly simulationId: string;
  readonly comparison: BranchComparison;
  readonly branches: readonly SimulationBranch[];
}

export interface MoveOptions {
  readonly at?: string;
  readonly clockState?: Readonly<Record<string, unknown>>;
}

export interface PlayerMoveRequest extends MoveOptions {
  readonly uci: string;
  readonly actor?: "user" | "system";
}

export type RewindRequest =
  | {
      readonly nodeId: string;
      readonly branchId?: string;
      readonly checkpointId?: never;
      readonly at?: string;
    }
  | {
      readonly checkpointId: string;
      readonly nodeId?: never;
      readonly branchId?: never;
      readonly at?: string;
    };

export interface ForkRequest {
  readonly nodeId: string;
  readonly label?: string;
  readonly intent?: string;
  readonly at?: string;
}

export interface PgnDownload {
  readonly filename: string;
  readonly text: string;
}

/** rfc/hint-distance.md §7: the POST body. It names a decision and a rung, never a ceiling or source. */
export interface HintRequestBody {
  readonly nodeId: string;
  readonly rung: HintRung;
  readonly decisionDigest: string;
  readonly assistance: RequestedAssistanceV1;
}

/** The Guided Hint seat's operations over one attached run (RunState.requestHint → ApiClient.hint). */
export interface GuidedHintClient {
  request(body: HintRequestBody): Promise<HintResponse>;
  poll(requestId: string): Promise<HintResponse>;
  cancel(requestId: string): Promise<HintResponse>;
}

function hintEnvelope(value: unknown): HintResponse {
  if (value === null || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== 1 || !("hint" in value)) throw new TypeError("Hint response is malformed");
  return parseHintResponse((value as { readonly hint: unknown }).hint);
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    status: number,
    code: string,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

/** What the browser learns from a committed/replayed bot reply (rfc/bot-policy.md §4.1). */
export interface BotOpponentPlyOperation {
  readonly requestId: string;
  readonly profileDigest: `sha256:${string}`;
  readonly derivationDigest: `sha256:${string}`;
  readonly operationDigest: `sha256:${string}`;
  readonly committedEventSequence: number;
  readonly chosenMoveUci: string;
  readonly layers: readonly { readonly id: BotLayerId; readonly action: "applied" | "abstained" | "degraded"; readonly reason?: BotDegradationReason }[];
}

export interface BotOpponentPlyResponse {
  readonly result: BotOpponentPlyResultRow;
  readonly run: DrillRun;
  readonly emitted: readonly DrillRunEvent[];
  readonly operation: BotOpponentPlyOperation;
}

/** A non-continue row of the closed eight-row table; the client acts on `result.action` only. */
export class BotOpponentPlyError extends ApiError {
  readonly result: BotOpponentPlyResultRow;
  constructor(result: BotOpponentPlyResultRow, message: string) {
    super(result.status, result.code ?? "OPPONENT_PLY_FAILED", message, { result });
    this.name = "BotOpponentPlyError";
    this.result = result;
  }
}

interface ErrorEnvelope {
  readonly error?: {
    readonly code?: unknown;
    readonly message?: unknown;
    readonly [key: string]: unknown;
  };
}

export interface RunApi {
  createRun(input: CreateRunRequest, writerId: string): Promise<DrillRun>;
  /** rfc/hint-distance.md §7: request, poll and cancel one exact Guided Hint operation. */
  hint?(runId: string, request: HintRequestBody, writerId: string): Promise<HintResponse>;
  hintPoll?(runId: string, requestId: string): Promise<HintResponse>;
  hintCancel?(runId: string, requestId: string): Promise<HintResponse>;
  move(
    runId: string,
    input: PlayerMoveRequest,
    writerId: string,
  ): Promise<MutationResult>;
  appendOpponentPly(
    runId: string,
    selection: OpponentSelection,
    writerId: string,
    options?: MoveOptions,
  ): Promise<MutationResult>;
  /** rfc/bot-policy.md §4.1: the server-owned reply of a bot-profile run (four request fields). */
  opponentPly?(runId: string, request: BotOpponentPlyRequest, writerId: string): Promise<BotOpponentPlyResponse>;
  rewind(
    runId: string,
    input: RewindRequest,
    writerId: string,
  ): Promise<MutationResult>;
  fork(
    runId: string,
    input: ForkRequest,
    writerId: string,
  ): Promise<MutationResult>;
  events(runId: string, sinceSeq?: number): Promise<EventsPage>;
  evidence(runId: string, sinceSeq?: number): Promise<EvidencePage>;
  applyEvidence(
    runId: string,
    resultSeq: number,
    writerId: string,
    at?: string,
  ): Promise<MutationResult>;
  reveal(runId: string, writerId: string, at?: string): Promise<MutationResult>;
  prediction(runId: string, input: PredictionRequest, writerId: string): Promise<PredictionResult>;
  recordReasoning(runId: string, input: { readonly nodeId: string; readonly checkpointEventSeq: number; readonly transcript?: ReasoningTranscript; readonly skipped?: true }, writerId: string): Promise<MutationResult & { readonly reasoning: ReasoningPage }>;
  createGroup(runId: string, input: CreateGroupRequest, writerId: string): Promise<CreateGroupResult>;
  groupReply(runId: string, groupId: string, writerId: string, request: SelectMoveRequest): Promise<GroupReplyResult>;
  analysis(runId: string, nodeIds: readonly string[], writerId: string): Promise<{ readonly jobs: readonly { readonly id: string }[] }>;
  scheduleReturn?(runId: string, input: { readonly nodeId: string; readonly kind: "blocked" | "varied"; readonly variant?: string; readonly dueAt?: string }, writerId: string): Promise<ScheduledReturnResult>;
  simulate?(runId: string, writerId: string): Promise<SimulationResult>;
  enterSimulation?(runId: string, simulationId: string, branchIndex: number, writerId: string): Promise<MutationResult>;
}

export interface DrillClientApi extends RunApi {
  marks?(runId: string): Promise<readonly RunMark[]>;
  replaceMarks?(runId: string, input: { readonly nodeId:string;readonly branchId:string;readonly scope:"position"|"branch";readonly shapes:readonly Pick<RunMark,"brush"|"orig"|"dest">[] }): Promise<readonly RunMark[]>;
  rescopeMarks?(runId:string,input:{readonly nodeId:string;readonly branchId:string;readonly fromScope:"position"|"branch";readonly toScope:"position"|"branch"}):Promise<readonly RunMark[]>;
  session?(): Promise<Learner>;
  register?(handle: string, password: string, displayName?: string): Promise<Learner>;
  login?(handle: string, password: string): Promise<Learner>;
  logout?(): Promise<void>;
  exportAccount?(password: string, onProgress?: (progress: AccountExportProgress) => void): Promise<{ readonly blob: Blob; readonly filename: string; readonly digest: string }>;
  accountInventory?(): Promise<AccountInventory>;
  previewAccountImport?(bundle: unknown): Promise<AccountImportReceipt>;
  importAccount?(password: string, bundle: unknown): Promise<AccountImportReceipt>;
  accountDeletionPreview?(): Promise<DeletionPreview>;
  deleteAccount?(password: string, previewDigest: string): Promise<void>;
  capabilities(): Promise<Capabilities>;
  packs(): Promise<readonly PackSummary[]>;
  pack(packId: string): Promise<PackDocument>;
  shapes(): Promise<readonly ShapeSummary[]>;
  principles?(): Promise<readonly PrincipleSummary[]>;
  conceptCatalogue?(): Promise<ConceptCatalogueView>;
  shape(shapeId: string): Promise<ShapeDocument>;
  /** The Library's `/theory` family (rfc/theory-drill-current-joins.md §4.3). */
  librarySearch?(query: LibrarySearchQuery): Promise<LibrarySearchResult>;
  principleEntry?(principleId: string): Promise<PrincipleEntryView>;
  shapeEntry?(shapeId: string): Promise<ShapeEntryLibraryView>;
  openingEntry?(positionKey: string): Promise<OpeningEntryView>;
  packEntry?(packId: string): Promise<PackEntryView>;
  runs(limit?: number, offset?: number): Promise<readonly RunSummary[]>;
  runPage?(limit?: number, offset?: number): Promise<RunPage>;
  runDeletionPreview?(runId: string): Promise<DeletionPreview>;
  deleteRun?(runId: string, previewDigest: string): Promise<void>;
  selectMove(input: SelectMoveRequest): Promise<OpponentSelection>;
  graph(runId: string, writerId?: string): Promise<RunGraph>;
  claimLease?(runId: string, writerId: string): Promise<void>;
  grants?(runId: string): Promise<readonly RunGrant[]>;
  updateGrants?(runId: string, operation: GrantOperation, writerId: string): Promise<readonly RunGrant[]>;
  compare(
    runId: string,
    branchIds: readonly string[],
  ): Promise<BranchComparison>;
  branchDecidedness(runId: string, branchIds: readonly string[]): Promise<Readonly<Record<string, import("@chess-tabiya/runtime").Decidedness>>>;
  authoredFeedback(runId: string): Promise<AuthoredFeedbackPage>;
  reasoning(runId: string, checkpointId: string): Promise<ReasoningPage>;
  reasoningReview?(runId: string, checkpointEventSeq: number): Promise<ReasoningReviewPage>;
  humanSplit(runId: string, nodeId: string): Promise<HumanSplitPage>;
  corpus(runId: string, nodeId: string): Promise<CorpusPage>;
  assistance?(runId: string, request: RequestedAssistanceV1): Promise<FinalizedAssistanceV1>;
  voice(runId: string, nodeId: string, scope: VoicePage["scope"]): Promise<VoicePage>;
  compareVoice(runId: string, branchIds: readonly string[]): Promise<VoicePage>;
  speech(runId: string, nodeId: string, scope: VoicePage["scope"]): Promise<Blob>;
  pgn(runId: string, branchIds?: readonly string[]): Promise<PgnDownload>;
  importGame?(input: ImportGameRequest, writerId: string): Promise<{ readonly run: DrillRun; readonly importRecord: ImportedGameRecord; readonly evidencePass: { readonly jobs: number } }>;
  importRecord?(runId: string): Promise<ImportedGameRecord>;
  story?(runId: string, branchId?: string): Promise<GameStory>;
  review?(runId: string, branchId?: string): Promise<ReviewMap>;
  /** rfc/module-registration.md §4.5: Post-commit Nudge for one committed learner move. */
  nudge?(runId: string, nodeId: string): Promise<PostcommitNudge>;
  reviewAnalysis?(runId: string, nodeId: string, branchId?: string): Promise<ReviewAnalysisPage>;
  shareStory?(runId: string, branchId: string): Promise<CreatedStoryShare>;
  storyShares?(runId: string): Promise<readonly StoryShare[]>;
  revokeStoryShare?(runId: string, tokenId: string): Promise<RevokedStoryShare>;
  flipRun?(runId: string, nodeId: string, resistance?: "human_common" | "strong_engine"): Promise<{ readonly run: DrillRun; readonly writerId: string; readonly derivation: RunDerivation }>;
  runDerivations?(runId: string): Promise<RunDerivationPage>;
  milestones?(): Promise<readonly ProgressMilestone[]>;
  recommendations?(): Promise<ProgressRecommendationPage>;
  distillRun?(runId:string,input:{readonly packId:string;readonly title:string;readonly branchId?:string}):Promise<DistillResult>;
  progress?(): Promise<readonly ProgressAttempt[]>;
  dueProgress?(): Promise<DueQueuePage>;
  difficultRoots?(): Promise<DifficultRootPage>;
  relatedProgress?(runId: string, nodeId: string): Promise<readonly RelatedProgressAttempt[]>;
  dismissSchedule?(scheduleId: string): Promise<void>;
  duplicateRun?(runId: string, input: { readonly id: string; readonly seed: number; readonly scheduleId?: string }, writerId: string): Promise<DrillRun>;
  packDrafts?(): Promise<readonly PackDraft[]>;
  createPackDraft?(document: unknown): Promise<PackDraft>;
  updatePackDraft?(draftId: string, digest: string, document: unknown): Promise<PackDraft>;
  lintPackDraft?(draftId: string, document: unknown): Promise<PackValidation>;
  playtestPackDraft?(draftId: string, writerId: string): Promise<{ readonly run: DrillRun; readonly url: string }>;
  registerPackDraft?(draftId: string): Promise<PackSummary>;
  withdrawPackDraft?(draftId: string): Promise<void>;
  exportPack?(packId: string): Promise<{ readonly document: unknown; readonly digest: string; readonly publisherHandle?: string }>;
  shapeDrafts?(): Promise<readonly ShapeDraft[]>;
  createShapeDraft?(document: unknown): Promise<ShapeDraft>;
  updateShapeDraft?(draftId: string, digest: string, document: unknown): Promise<ShapeDraft>;
  lintShapeDraft?(draftId: string, document: unknown, probeFen?: string): Promise<ShapeDraft["validation"]>;
  registerShapeDraft?(draftId: string): Promise<ShapeSummary>;
  liveSessions?(): Promise<readonly LiveSessionSummary[]>;
  liveSession?(sessionId:string):Promise<LiveSessionDetail>;
  createLiveSession?(input:{readonly runId:string;readonly kind:SessionKind;readonly title:string;readonly boardControl?:BoardControl;readonly rotationHandles?:readonly string[];readonly matchPlayers?:{readonly white?:string;readonly black?:string};readonly classroomId?:string;readonly scheduledFor?:string}):Promise<LiveSession>;
  classrooms?():Promise<readonly ClassroomSummary[]>;
  classroom?(id:string):Promise<ClassroomDetail>;
  createClassroom?(name:string):Promise<ClassroomSummary>;
  inviteClassroomMember?(id:string,handle:string,role:"teacher"|"learner"):Promise<ClassroomMember>;
  respondClassroomInvite?(id:string,op:"accept"|"decline"|"leave"):Promise<void>;
  removeClassroomMember?(id:string,handle:string):Promise<void>;
  createAssignment?(classroomId:string,input:{readonly packId:string;readonly note?:string;readonly dueAt?:string}):Promise<ClassroomAssignment>;
  assignments?():Promise<readonly AssignedPack[]>;
  submitAssignment?(id:string,runId:string,expiresInDays?:number):Promise<AssignmentSubmission>;
  withdrawSubmission?(id:string,runId:string):Promise<void>;
  rating?(): Promise<RatingView>;
  ratingHistory?(): Promise<RatingHistoryPage>;
  createRatedGame?(input: CreateRatedGameRequest, writerId: string): Promise<DrillRun>;
  learnerMarks?(): Promise<readonly LearnerMark[]>;
  learnerProfile?(): Promise<LearnerProfileView>;
  learnerProfileStyle?(metricId: string, offset?: number, limit?: number): Promise<StyleCardPage>;
  learnerProfileOpening?(key: string, offset?: number, limit?: number): Promise<OpeningDetail>;
  learnerProfileObservation?(key: string, offset?: number, limit?: number): Promise<ObservationDetail>;
  learnerProfileHistory?(offset?: number, limit?: number): Promise<ProfilePage<ProfileHistoryRow>>;
  shareProfileCard?(metricId: string, consent: true): Promise<SharedHabitCard>;
  cohortStanding?(classroomId: string): Promise<CohortStandingView>;
  updateCohortStanding?(classroomId: string, input:
    | { readonly op: "open"; readonly windowFrom: string; readonly windowTo?: string }
    | { readonly op: "close" }
    | { readonly op: "window"; readonly windowFrom: string; readonly windowTo?: string }
    | { readonly op: "publish" | "withdraw" | "showRating" | "hideRating" | "showRecord" | "hideRecord" }
  ): Promise<void>;
  sessionJournal?(sessionId:string,sinceSeq?:number):Promise<{readonly entries:readonly SessionJournalEntry[];readonly nextSeq:number}>;
  sessionProposals?(sessionId:string):Promise<readonly SessionProposal[]>;
  proposeMove?(sessionId:string,nodeId:string,moveUci:string):Promise<SessionProposal>;
  resolveProposal?(sessionId:string,proposalId:string,op:"apply"|"decline",writerId:string):Promise<SessionProposal>;
  boardControl?(sessionId:string,writerId:string,op:"offer"|"withdraw"|"advance"|"reclaim",handle?:string):Promise<LiveSession>;
  openVote?(sessionId:string,input:{readonly nodeId:string;readonly prompt:string;readonly options:readonly VoteOption[];readonly durationSeconds:number}):Promise<VoteTally>;
  castVote?(sessionId:string,windowId:string,choiceUci:string,voterKey?:string):Promise<VoteTally>;
  closeVote?(sessionId:string,windowId:string,appliedOptionUci?:string):Promise<VoteTally>;
  inviteToSession?(sessionId:string,input:{readonly leg?:1|2;readonly handle?:string;readonly externalChallengeUrl?:string}):Promise<SessionInvitation>;
  importArenaLeg?(sessionId:string,leg:1|2,pgn:string,writerId:string,result?:ArenaLeg["result"]):Promise<ArenaLeg>;
  matchOperation?(sessionId:string,op:"propose_pause"|"accept_pause"|"withdraw_pause"|"pause"|"resume",writerId?:string):Promise<MatchState>;
  sessionLinks?(sessionId:string):Promise<readonly SessionJoinLink[]>;
  mintSessionLink?(sessionId:string,input:{readonly matchSlot?:"white"|"black";readonly invitedRole:"participant"|"spectator";readonly invitedHandle?:string;readonly expiresInDays?:number}):Promise<{readonly id:string;readonly token:string;readonly url:string}>;
  revokeSessionLink?(sessionId:string,linkId:string):Promise<void>;
  redeemSessionLink?(token:string):Promise<{readonly session:LiveSession;readonly runId:string}>;
  repertoires?():Promise<readonly RepertoireSummary[]>;
  createRepertoire?(input:{readonly name:string;readonly side:"white"|"black";readonly targetElo:number;readonly coverageDenominator:number;readonly source:{readonly kind:"pgn";readonly pgn:string}|{readonly kind:"lichess_study";readonly url:string}}):Promise<RepertoireView>;
  deleteRepertoire?(id:string):Promise<void>;
  repertoireGaps?(id:string):Promise<RepertoireGapPage>;
  scanRepertoire?(id:string):Promise<void>;
  enterRepertoireGap?(id:string,gapKey:string,resistance?:"human_common"|"strong_engine"):Promise<{readonly runId:string;readonly writerId:string|null;readonly alreadyEntered:boolean}>;
  chooseRepertoireAnswer?(id:string,input:{readonly positionKey:string;readonly moveUci:string;readonly ifMatch:string}):Promise<RepertoireView>;
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function browserFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return globalThis.fetch(input, init);
}

function encoded(value: string): string {
  return encodeURIComponent(value);
}

function attachmentFilename(header: string | null, fallback: string): string {
  if (header === null) return fallback;
  const match = /filename="([^"]+)"/.exec(header);
  return match?.[1] ?? fallback;
}

export class DrillApi implements DrillClientApi {
  readonly #baseUrl: string;
  readonly #fetch: Fetcher;

  constructor(baseUrl = "", fetcher: Fetcher = browserFetch) {
    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#fetch = fetcher;
  }

  async session(): Promise<Learner> {
    const body = await this.#json<{ readonly learner: Learner }>("/auth/session");
    return body.learner;
  }

  async register(handle: string, password: string, displayName?: string): Promise<Learner> {
    const body = await this.#json<{ readonly learner: Learner }>("/auth/register", {
      method: "POST",
      body: { handle, password, ...(displayName === undefined ? {} : { displayName }) },
    });
    return body.learner;
  }

  async login(handle: string, password: string): Promise<Learner> {
    const body = await this.#json<{ readonly learner: Learner }>("/auth/login", {
      method: "POST",
      body: { handle, password },
    });
    return body.learner;
  }

  async logout(): Promise<void> {
    await this.#json("/auth/logout", { method: "POST", body: {} });
  }

  async exportAccount(password: string, onProgress?: (progress: AccountExportProgress) => void): Promise<{ readonly blob: Blob; readonly filename: string; readonly digest: string }> {
    const response = await this.#response("/auth/export", { method: "POST", body: { password } });
    const digest = response.headers.get("x-tabiya-export-sha256");
    if (digest === null || !/^sha256:[a-f0-9]{64}$/u.test(digest)) {
      throw new ApiError(502, "INVALID_RESPONSE", "Account export omitted its digest");
    }
    const declared = Number(response.headers.get("content-length") ?? Number.NaN);
    const totalBytes = Number.isSafeInteger(declared) && declared >= 0 ? declared : null;
    let blob: Blob;
    if (onProgress === undefined || response.body === null) {
      blob = await response.blob();
    } else {
      const reader = response.body.getReader();
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let receivedBytes = 0;
      onProgress(Object.freeze({ receivedBytes, totalBytes }));
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value as Uint8Array<ArrayBuffer>);
        receivedBytes += value.byteLength;
        onProgress(Object.freeze({ receivedBytes, totalBytes }));
      }
      blob = new Blob(chunks, { type: response.headers.get("content-type") ?? "application/json" });
    }
    return Object.freeze({
      blob,
      filename: attachmentFilename(response.headers.get("content-disposition"), "tabiya-account.json"),
      digest,
    });
  }

  accountInventory(): Promise<AccountInventory> {
    return this.#json("/auth/account-inventory");
  }

  async previewAccountImport(bundle: unknown): Promise<AccountImportReceipt> {
    return (await this.#json<{ readonly receipt: AccountImportReceipt }>("/auth/import-preview", { method: "POST", body: { bundle } })).receipt;
  }

  async importAccount(password: string, bundle: unknown): Promise<AccountImportReceipt> {
    return (await this.#json<{ readonly receipt: AccountImportReceipt }>("/auth/import", { method: "POST", body: { password, bundle } })).receipt;
  }

  accountDeletionPreview(): Promise<DeletionPreview> {
    return this.#json("/auth/deletion-preview", { method: "POST", body: {} });
  }

  async deleteAccount(password: string, previewDigest: string): Promise<void> {
    await this.#json("/auth/delete", { method: "POST", body: { password, previewDigest } });
  }

  runDeletionPreview(runId: string): Promise<DeletionPreview> {
    return this.#json(`/runs/${encoded(runId)}/deletion-preview`, { method: "POST", body: {} });
  }

  async deleteRun(runId: string, previewDigest: string): Promise<void> {
    await this.#json(`/runs/${encoded(runId)}/delete`, { method: "POST", body: { previewDigest } });
  }

  capabilities(): Promise<Capabilities> {
    return this.#json<unknown>("/capabilities").then(parseCapabilities);
  }

  packs(): Promise<readonly PackSummary[]> {
    return this.#json<unknown>("/packs").then(parsePackCatalog);
  }

  async pack(packId: string): Promise<PackDocument> {
    const response = await this.#response(`/packs/${encoded(packId)}`);
    const document = parsePackDocument(await response.json(), packId);
    const digest = response.headers.get("x-pack-digest");
    if (digest === null || !/^sha256:[a-f0-9]{64}$/u.test(digest)) throw new ApiError(502, "INVALID_RESPONSE", "Pack response omitted a valid digest");
    return Object.freeze({ document, digest });
  }

  async shapes(): Promise<readonly ShapeSummary[]> {
    return parseShapeCatalog(await this.#json<unknown>("/shapes"));
  }

  async principles(): Promise<readonly PrincipleSummary[]> {
    return parsePrincipleCatalog(await this.#json<unknown>("/principles"));
  }

  async librarySearch(query: LibrarySearchQuery): Promise<LibrarySearchResult> {
    return this.#theory(librarySearchPath(query), parseLibrarySearch);
  }

  async principleEntry(principleId: string): Promise<PrincipleEntryView> {
    return this.#theory(`/theory/principles/${encoded(principleId)}`, parsePrincipleEntry);
  }

  async shapeEntry(shapeId: string): Promise<ShapeEntryLibraryView> {
    return this.#theory(`/theory/shapes/${encoded(shapeId)}`, parseShapeEntry);
  }

  async openingEntry(positionKey: string): Promise<OpeningEntryView> {
    return this.#theory(`/theory/openings/${encoded(positionKey)}`, parseOpeningEntry);
  }

  async packEntry(packId: string): Promise<PackEntryView> {
    return this.#theory(`/theory/packs/${encoded(packId)}`, parsePackEntry);
  }

  async #theory<T>(path: string, parse: (value: unknown) => T): Promise<T> {
    const body = await this.#json<unknown>(path);
    try {
      return parse(body);
    } catch (error) {
      throw new ApiError(502, "INVALID_RESPONSE", error instanceof Error ? error.message : "Theory response is invalid");
    }
  }

  /** Consumer 6 of rfc/concept-registry.md §2: the registry's typed projection, strictly parsed. */
  async conceptCatalogue(): Promise<ConceptCatalogueView> {
    const envelope = await this.#json<unknown>("/packs/concepts");
    if (typeof envelope !== "object" || envelope === null || Array.isArray(envelope) || Object.keys(envelope).join(",") !== "concepts") throw new ApiError(502, "INVALID_RESPONSE", "Concept catalogue response has an invalid shape");
    try {
      return parseConceptCatalogueView((envelope as { readonly concepts: unknown }).concepts);
    } catch (error) {
      throw new ApiError(502, "INVALID_RESPONSE", error instanceof Error ? error.message : "Concept catalogue response is invalid");
    }
  }

  async shape(shapeId: string): Promise<ShapeDocument> {
    const response = await this.#response(`/shapes/${encoded(shapeId)}`);
    const document = parseShapeDocument(await response.json(), shapeId);
    const digest = response.headers.get("x-shape-digest");
    if (digest === null || !/^sha256:[a-f0-9]{64}$/u.test(digest)) {
      throw new ApiError(502, "INVALID_RESPONSE", "Shape response omitted its digest");
    }
    return Object.freeze({ document, digest });
  }

  async createRun(input: CreateRunRequest, writerId: string): Promise<DrillRun> {
    const body = await this.#json<{ readonly run: DrillRun }>("/runs", {
      method: "POST",
      writerId,
      body: input,
    });
    return body.run;
  }

  importGame(input: ImportGameRequest, writerId: string): Promise<{ readonly run: DrillRun; readonly importRecord: ImportedGameRecord; readonly evidencePass: { readonly jobs: number } }> {
    return this.#json("/runs/import", { method: "POST", writerId, body: input });
  }

  async importRecord(runId: string): Promise<ImportedGameRecord> {
    const body = await this.#json<{ readonly importRecord: ImportedGameRecord }>(`/runs/${encoded(runId)}/import`);
    return body.importRecord;
  }

  review(runId: string, branchId?: string): Promise<ReviewMap> {
    const query = branchId === undefined ? "" : `?branch=${encoded(branchId)}`;
    return this.#json(`/runs/${encoded(runId)}/review${query}`);
  }

  nudge(runId: string, nodeId: string): Promise<PostcommitNudge> {
    return this.#json<unknown>(`/runs/${encoded(runId)}/nudge?nodeId=${encoded(nodeId)}`).then((value) => parsePostcommitNudge(value, { runId, nodeId }));
  }

  reviewAnalysis(runId: string, nodeId: string, branchId?: string): Promise<ReviewAnalysisPage> {
    const branch = branchId === undefined ? "" : `&branch=${encoded(branchId)}`;
    return this.#json(`/runs/${encoded(runId)}/review-analysis?node=${encoded(nodeId)}${branch}`);
  }

  async story(runId: string, branchId?: string): Promise<GameStory> {
    const query = branchId === undefined ? "" : `?branch=${encoded(branchId)}`;
    // The exact recursive parser: nested presentation receipts are re-sealed client-side.
    return parseReviewStoryReceipt(await this.#json<unknown>(`/runs/${encoded(runId)}/story${query}`), { runId, ...(branchId === undefined ? {} : { branchId }) }).receipt;
  }

  shareStory(runId: string, branchId: string): Promise<CreatedStoryShare> { return this.#json(`/runs/${encoded(runId)}/share`, { method: "POST", body: { branchId } }); }
  async storyShares(runId: string): Promise<readonly StoryShare[]> { const body = await this.#json<{ readonly shares: readonly StoryShare[] }>(`/runs/${encoded(runId)}/share`); return body.shares; }
  revokeStoryShare(runId: string, tokenId: string): Promise<RevokedStoryShare> { return this.#json(`/runs/${encoded(runId)}/share/${encoded(tokenId)}`, { method: "DELETE" }); }
  flipRun(runId: string, nodeId: string, resistance?: "human_common" | "strong_engine"): Promise<{ readonly run: DrillRun; readonly writerId: string; readonly derivation: RunDerivation }> { return this.#json(`/runs/${encoded(runId)}/flip`, { method: "POST", body: { nodeId, ...(resistance === undefined ? {} : { resistance }) } }); }
  async runDerivations(runId: string): Promise<RunDerivationPage> { const body = await this.#json<{ readonly derivations: RunDerivationPage }>(`/runs/${encoded(runId)}/derivations`); return body.derivations; }
  async milestones(): Promise<readonly ProgressMilestone[]> { return parseProgressMilestones(await this.#json<unknown>("/progress/milestones")); }
  async repertoires():Promise<readonly RepertoireSummary[]>{const body=await this.#json<{readonly repertoires:readonly RepertoireSummary[]}>("/repertoires");return body.repertoires;}
  async createRepertoire(input:{readonly name:string;readonly side:"white"|"black";readonly targetElo:number;readonly coverageDenominator:number;readonly source:{readonly kind:"pgn";readonly pgn:string}|{readonly kind:"lichess_study";readonly url:string}}):Promise<RepertoireView>{const body=await this.#json<{readonly repertoire:RepertoireView}>("/repertoires",{method:"POST",body:input});return body.repertoire;}
  async deleteRepertoire(id:string):Promise<void>{await this.#json(`/repertoires/${encoded(id)}`,{method:"DELETE"});}
  repertoireGaps(id:string):Promise<RepertoireGapPage>{return this.#json(`/repertoires/${encoded(id)}/gaps`);}
  async scanRepertoire(id:string):Promise<void>{await this.#json(`/repertoires/${encoded(id)}/scan`,{method:"POST",body:{}});}
  enterRepertoireGap(id:string,gapKey:string,resistance?:"human_common"|"strong_engine"):Promise<{readonly runId:string;readonly writerId:string|null;readonly alreadyEntered:boolean}>{return this.#json(`/repertoires/${encoded(id)}/gaps/enter`,{method:"POST",body:{gapKey,...(resistance===undefined?{}:{resistance})}});}
  async chooseRepertoireAnswer(id:string,input:{readonly positionKey:string;readonly moveUci:string;readonly ifMatch:string}):Promise<RepertoireView>{const body=await this.#json<{readonly repertoire:RepertoireView}>(`/repertoires/${encoded(id)}/answers`,{method:"POST",body:input});return body.repertoire;}

  async runs(limit = 50, offset = 0): Promise<readonly RunSummary[]> {
    return (await this.runPage(limit, offset)).runs;
  }

  async runPage(limit = 50, offset = 0): Promise<RunPage> {
    const query = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return this.#json<RunPage>(`/runs?${query}`);
  }

  async progress(): Promise<readonly ProgressAttempt[]> {
    return parseProgressAttempts(await this.#json<unknown>("/progress"));
  }

  async dueProgress(): Promise<DueQueuePage> {
    return parseDueQueue(await this.#json<unknown>("/progress/due"));
  }

  async difficultRoots(): Promise<DifficultRootPage> {
    return parseDifficultRoots(await this.#json<unknown>("/progress/difficult"));
  }

  async relatedProgress(runId: string, nodeId: string): Promise<readonly RelatedProgressAttempt[]> {
    const query = new URLSearchParams({ runId, nodeId });
    return parseRelatedProgress(await this.#json<unknown>(`/progress/related?${query}`), runId);
  }

  async dismissSchedule(scheduleId: string): Promise<void> {
    await this.#json(`/progress/schedules/${encoded(scheduleId)}`, {
      method: "POST",
      body: { op: "dismiss" },
    });
  }

  async duplicateRun(
    runId: string,
    input: { readonly id: string; readonly seed: number; readonly scheduleId?: string },
    writerId: string,
  ): Promise<DrillRun> {
    const body = await this.#json<{ readonly run: DrillRun }>(`/runs/${encoded(runId)}/duplicate`, {
      method: "POST",
      writerId,
      body: input,
    });
    return body.run;
  }

  async packDrafts(): Promise<readonly PackDraft[]> {
    const body = await this.#json<{ readonly drafts: readonly PackDraft[] }>("/packs/drafts");
    return body.drafts;
  }

  async createPackDraft(document: unknown): Promise<PackDraft> {
    const body = await this.#json<{ readonly draft: PackDraft }>("/packs/drafts", {
      method: "POST", body: { document },
    });
    return body.draft;
  }

  async updatePackDraft(draftId: string, digest: string, document: unknown): Promise<PackDraft> {
    const response = await this.#response(`/packs/drafts/${encoded(draftId)}`, {
      method: "PUT",
      headers: { "if-match": digest },
      body: { document },
    });
    return (await response.json() as { readonly draft: PackDraft }).draft;
  }

  lintPackDraft(draftId: string, document: unknown): Promise<PackValidation> {
    return this.#json(`/packs/drafts/${encoded(draftId)}/lint`, {
      method: "POST",
      body: { document },
    });
  }

  playtestPackDraft(draftId: string, writerId: string): Promise<{ readonly run: DrillRun; readonly url: string }> {
    return this.#json(`/packs/drafts/${encoded(draftId)}/playtest`, {
      method: "POST", writerId, body: {},
    });
  }

  async registerPackDraft(draftId: string): Promise<PackSummary> {
    const body = await this.#json<{ readonly pack: { readonly summary: PackSummary } }>(`/packs/drafts/${encoded(draftId)}/register`, {
      method: "POST", body: {},
    });
    return body.pack.summary;
  }

  async withdrawPackDraft(draftId: string): Promise<void> {
    await this.#json(`/packs/drafts/${encoded(draftId)}/withdraw`, { method: "POST", body: {} });
  }

  exportPack(packId: string): Promise<{ readonly document: unknown; readonly digest: string; readonly publisherHandle?: string }> {
    return this.#json(`/packs/${encoded(packId)}/export`);
  }

  async shapeDrafts(): Promise<readonly ShapeDraft[]> {
    const body = await this.#json<{ readonly drafts: readonly ShapeDraft[] }>("/shapes/drafts");
    return body.drafts;
  }

  async createShapeDraft(document: unknown): Promise<ShapeDraft> {
    const body = await this.#json<{ readonly draft: ShapeDraft }>("/shapes/drafts", { method: "POST", body: { document } });
    return body.draft;
  }

  async updateShapeDraft(draftId: string, digest: string, document: unknown): Promise<ShapeDraft> {
    const response = await this.#response(`/shapes/drafts/${encoded(draftId)}`, { method: "PUT", headers: { "if-match": digest }, body: { document } });
    return ((await response.json()) as { readonly draft: ShapeDraft }).draft;
  }

  lintShapeDraft(draftId: string, document: unknown, probeFen?: string): Promise<ShapeDraft["validation"]> {
    return this.#json(`/shapes/drafts/${encoded(draftId)}/lint`, { method: "POST", body: { document, ...(probeFen === undefined || probeFen === "" ? {} : { probeFen }) } });
  }

  async registerShapeDraft(draftId: string): Promise<ShapeSummary> {
    const body = await this.#json<{ readonly shape: { readonly summary: ShapeSummary } }>(`/shapes/drafts/${encoded(draftId)}/register`, { method: "POST", body: {} });
    return body.shape.summary;
  }

  async liveSessions():Promise<readonly LiveSessionSummary[]>{const body=await this.#json<{sessions:readonly LiveSessionSummary[]}>("/sessions");return body.sessions;}
  liveSession(sessionId:string):Promise<LiveSessionDetail>{return this.#json(`/sessions/${encoded(sessionId)}`);}
  async createLiveSession(input:{readonly runId:string;readonly kind:SessionKind;readonly title:string;readonly boardControl?:BoardControl;readonly rotationHandles?:readonly string[];readonly matchPlayers?:{readonly white?:string;readonly black?:string};readonly classroomId?:string;readonly scheduledFor?:string}):Promise<LiveSession>{const body=await this.#json<{session:LiveSession}>("/sessions",{method:"POST",body:input});return body.session;}
  async classrooms():Promise<readonly ClassroomSummary[]>{const body=await this.#json<{classrooms:readonly ClassroomSummary[]}>("/classrooms");return body.classrooms;}
  classroom(id:string):Promise<ClassroomDetail>{return this.#json(`/classrooms/${encoded(id)}`);}
  async createClassroom(name:string):Promise<ClassroomSummary>{const body=await this.#json<{classroom:ClassroomSummary}>("/classrooms",{method:"POST",body:{name}});return body.classroom;}
  async inviteClassroomMember(id:string,handle:string,role:"teacher"|"learner"):Promise<ClassroomMember>{const body=await this.#json<{member:ClassroomMember}>(`/classrooms/${encoded(id)}/members`,{method:"POST",body:{op:"invite",handle,role}});return body.member;}
  async respondClassroomInvite(id:string,op:"accept"|"decline"|"leave"):Promise<void>{await this.#json(`/classrooms/${encoded(id)}/members`,{method:"POST",body:{op}});}
  async removeClassroomMember(id:string,handle:string):Promise<void>{await this.#json(`/classrooms/${encoded(id)}/members`,{method:"POST",body:{op:"remove",handle}});}
  async createAssignment(classroomId:string,input:{readonly packId:string;readonly note?:string;readonly dueAt?:string}):Promise<ClassroomAssignment>{const body=await this.#json<{assignment:ClassroomAssignment}>(`/classrooms/${encoded(classroomId)}/assignments`,{method:"POST",body:input});return body.assignment;}
  async assignments():Promise<readonly AssignedPack[]>{const body=await this.#json<{assignments:readonly AssignedPack[]}>("/assignments");return body.assignments;}
  async submitAssignment(id:string,runId:string,expiresInDays?:number):Promise<AssignmentSubmission>{const body=await this.#json<{submission:AssignmentSubmission}>(`/assignments/${encoded(id)}/submissions`,{method:"POST",body:{runId,...(expiresInDays===undefined?{}:{expiresInDays})}});return body.submission;}
  async withdrawSubmission(id:string,runId:string):Promise<void>{await this.#json(`/assignments/${encoded(id)}/submissions`,{method:"POST",body:{op:"withdraw",runId}});}
  rating():Promise<RatingView>{return this.#json("/rating");}
  ratingHistory():Promise<RatingHistoryPage>{return this.#json("/rating/history");}
  async createRatedGame(input:CreateRatedGameRequest,writerId:string):Promise<DrillRun>{const body=await this.#json<{readonly run:DrillRun}>("/rated-games",{method:"POST",writerId,body:input});return body.run;}
  async learnerMarks():Promise<readonly LearnerMark[]>{const body=await this.#json<{readonly marks:readonly LearnerMark[]}>("/marks");return body.marks;}
  async learnerProfile():Promise<LearnerProfileView>{return parseLearnerProfile(await this.#json<unknown>("/learner-profile"));}
  async learnerProfileStyle(metricId:string,offset=0,limit=50):Promise<StyleCardPage>{return parseStyleCardPage(await this.#json<unknown>(`/learner-profile/style/${encoded(metricId)}?offset=${offset}&limit=${limit}`));}
  async learnerProfileOpening(key:string,offset=0,limit=50):Promise<OpeningDetail>{return parseOpeningDetail(await this.#json<unknown>(`/learner-profile/openings/${encoded(key)}?offset=${offset}&limit=${limit}`));}
  async learnerProfileObservation(key:string,offset=0,limit=50):Promise<ObservationDetail>{return parseObservationDetail(await this.#json<unknown>(`/learner-profile/observations/${encoded(key)}?offset=${offset}&limit=${limit}`));}
  async learnerProfileHistory(offset=0,limit=50):Promise<ProfilePage<ProfileHistoryRow>>{return parseProfileHistory(await this.#json<unknown>(`/learner-profile/history?offset=${offset}&limit=${limit}`));}
  async shareProfileCard(metricId:string,consent:true):Promise<SharedHabitCard>{return parseSharedCard(await this.#json<unknown>("/learner-profile/share-card",{method:"POST",body:{metricId,consent}}));}
  cohortStanding(classroomId:string):Promise<CohortStandingView>{return this.#json(`/cohorts/${encoded(classroomId)}/standing`);}
  async updateCohortStanding(classroomId:string,input:
    | {readonly op:"open";readonly windowFrom:string;readonly windowTo?:string}
    | {readonly op:"close"}
    | {readonly op:"window";readonly windowFrom:string;readonly windowTo?:string}
    | {readonly op:"publish"|"withdraw"|"showRating"|"hideRating"|"showRecord"|"hideRecord"}
  ):Promise<void>{await this.#json(`/cohorts/${encoded(classroomId)}/standing`,{method:"POST",body:input});}
  sessionJournal(sessionId:string,sinceSeq=0):Promise<{readonly entries:readonly SessionJournalEntry[];readonly nextSeq:number}>{return this.#json(`/sessions/${encoded(sessionId)}/journal?sinceSeq=${sinceSeq}`);}
  async sessionProposals(sessionId:string):Promise<readonly SessionProposal[]>{const body=await this.#json<{proposals:readonly SessionProposal[]}>(`/sessions/${encoded(sessionId)}/proposals`);return body.proposals;}
  async proposeMove(sessionId:string,nodeId:string,moveUci:string):Promise<SessionProposal>{const body=await this.#json<{proposal:SessionProposal}>(`/sessions/${encoded(sessionId)}/proposals`,{method:"POST",body:{nodeId,moveUci}});return body.proposal;}
  async resolveProposal(sessionId:string,proposalId:string,op:"apply"|"decline",writerId:string):Promise<SessionProposal>{const body=await this.#json<{proposal:SessionProposal}>(`/sessions/${encoded(sessionId)}/proposals/${encoded(proposalId)}`,{method:"POST",writerId,body:{op}});return body.proposal;}
  async boardControl(sessionId:string,writerId:string,op:"offer"|"withdraw"|"advance"|"reclaim",handle?:string):Promise<LiveSession>{const body=await this.#json<{session:LiveSession}>(`/sessions/${encoded(sessionId)}/board`,{method:"POST",writerId,body:{op,...(handle===undefined?{}:{handle})}});return body.session;}
  openVote(sessionId:string,input:{readonly nodeId:string;readonly prompt:string;readonly options:readonly VoteOption[];readonly durationSeconds:number}):Promise<VoteTally>{return this.#json(`/sessions/${encoded(sessionId)}/votes`,{method:"POST",body:{op:"open",...input}});}
  castVote(sessionId:string,windowId:string,choiceUci:string,voterKey?:string):Promise<VoteTally>{return this.#json(`/sessions/${encoded(sessionId)}/votes`,{method:"POST",body:{op:"cast",windowId,choiceUci,...(voterKey===undefined?{}:{voterKey})}});}
  closeVote(sessionId:string,windowId:string,appliedOptionUci?:string):Promise<VoteTally>{return this.#json(`/sessions/${encoded(sessionId)}/votes`,{method:"POST",body:{op:"close",windowId,...(appliedOptionUci===undefined?{}:{appliedOptionUci})}});}
  async inviteToSession(sessionId:string,input:{readonly leg?:1|2;readonly handle?:string;readonly externalChallengeUrl?:string}):Promise<SessionInvitation>{const body=await this.#json<{invitation:SessionInvitation}>(`/sessions/${encoded(sessionId)}/invitations`,{method:"POST",body:input});return body.invitation;}
  async importArenaLeg(sessionId:string,leg:1|2,pgn:string,writerId:string,result?:ArenaLeg["result"]):Promise<ArenaLeg>{const query=result===undefined||result===null?"":`?${new URLSearchParams({result})}`;const response=await this.#response(`/sessions/${encoded(sessionId)}/legs/${leg}/pgn${query}`,{method:"POST",writerId,rawBody:pgn,headers:{"content-type":"text/x-chess-pgn"}});return ((await response.json()) as {leg:ArenaLeg}).leg;}
  async matchOperation(sessionId:string,op:"propose_pause"|"accept_pause"|"withdraw_pause"|"pause"|"resume",writerId?:string):Promise<MatchState>{const body=await this.#json<{match:MatchState}>(`/sessions/${encoded(sessionId)}/match`,{method:"POST",...(writerId===undefined?{}:{writerId}),body:{op}});return body.match;}
  async sessionLinks(sessionId:string):Promise<readonly SessionJoinLink[]>{const body=await this.#json<{links:readonly SessionJoinLink[]}>(`/sessions/${encoded(sessionId)}/links`);return body.links;}
  mintSessionLink(sessionId:string,input:{readonly matchSlot?:"white"|"black";readonly invitedRole:"participant"|"spectator";readonly invitedHandle?:string;readonly expiresInDays?:number}):Promise<{readonly id:string;readonly token:string;readonly url:string}>{return this.#json(`/sessions/${encoded(sessionId)}/links`,{method:"POST",body:input});}
  async revokeSessionLink(sessionId:string,linkId:string):Promise<void>{await this.#json(`/sessions/${encoded(sessionId)}/links/${encoded(linkId)}`,{method:"POST",body:{op:"revoke"}});}
  redeemSessionLink(token:string):Promise<{readonly session:LiveSession;readonly runId:string}>{return this.#json(`/api/shared/${encoded(token)}/join`,{method:"POST",body:{}});}

  selectMove(input: SelectMoveRequest): Promise<OpponentSelection> {
    return this.#json<unknown>("/select-move", { method: "POST", body: input }).then((value) => parseOpponentSelection(value, input));
  }

  humanSplit(runId: string, nodeId: string): Promise<HumanSplitPage> {
    return this.#json<unknown>(`/runs/${encoded(runId)}/human-split?nodeId=${encoded(nodeId)}`).then((value) => parseHumanSplitPage(value, nodeId));
  }

  corpus(runId: string, nodeId: string): Promise<CorpusPage> { return this.#json<unknown>(`/runs/${encoded(runId)}/corpus?nodeId=${encoded(nodeId)}`).then((value) => parseCorpusPage(value, nodeId)); }

  hint(runId: string, request: HintRequestBody, writerId: string): Promise<HintResponse> {
    return this.#json<unknown>(`/runs/${encoded(runId)}/hints`, { method: "POST", writerId, body: request }).then(hintEnvelope);
  }

  hintPoll(runId: string, requestId: string): Promise<HintResponse> {
    return this.#json<unknown>(`/runs/${encoded(runId)}/hints/${encoded(requestId)}`).then(hintEnvelope);
  }

  hintCancel(runId: string, requestId: string): Promise<HintResponse> {
    return this.#json<unknown>(`/runs/${encoded(runId)}/hints/${encoded(requestId)}`, { method: "DELETE" }).then(hintEnvelope);
  }

  assistance(runId: string, request: RequestedAssistanceV1): Promise<FinalizedAssistanceV1> {
    return this.#json<unknown>(`/runs/${encoded(runId)}/assistance`, { method: "POST", body: request }).then((value) => {
      if (value === null || typeof value !== "object" || !("assistance" in value)) throw new TypeError("Assistance response is malformed");
      return parseFinalizedAssistanceV1((value as { readonly assistance: unknown }).assistance);
    });
  }

  voice(runId: string, nodeId: string, scope: VoicePage["scope"]): Promise<VoicePage> {
    return this.#json<unknown>(`/runs/${encoded(runId)}/voice`, { method: "POST", body: { nodeId, scope } }).then((value) => parseVoicePage(value, scope));
  }

  compareVoice(runId: string, branchIds: readonly string[]): Promise<VoicePage> {
    return this.#json<unknown>(`/runs/${encoded(runId)}/voice`, { method: "POST", body: { branches: branchIds, scope: "compare" } }).then((value) => parseVoicePage(value, "compare"));
  }

  async speech(runId: string, nodeId: string, scope: VoicePage["scope"]): Promise<Blob> {
    const response = await this.#response(`/runs/${encoded(runId)}/speech`, { method: "POST", body: { nodeId, scope } });
    return response.blob();
  }

  recommendations():Promise<ProgressRecommendationPage>{return this.#json<unknown>("/progress/recommendations").then(parseProgressRecommendations);}
  distillRun(runId:string,input:{readonly packId:string;readonly title:string;readonly branchId?:string}):Promise<DistillResult>{return this.#json(`/runs/${encoded(runId)}/distill`,{method:"POST",body:input});}

  prediction(runId: string, input: PredictionRequest, writerId: string): Promise<PredictionResult> {
    return this.#json<unknown>(`/runs/${encoded(runId)}/prediction`, { method: "POST", writerId, body: input }).then((value) => parsePredictionResult(value, input));
  }

  recordReasoning(runId: string, input: { readonly nodeId: string; readonly checkpointEventSeq: number; readonly transcript?: ReasoningTranscript; readonly skipped?: true }, writerId: string): Promise<MutationResult & { readonly reasoning: ReasoningPage }> {
    return this.#json(`/runs/${encoded(runId)}/reasoning`, { method: "POST", writerId, body: input });
  }

  createGroup(runId: string, input: CreateGroupRequest, writerId: string): Promise<CreateGroupResult> {
    return this.#json(`/runs/${encoded(runId)}/group`, { method: "POST", writerId, body: input });
  }

  groupReply(runId: string, groupId: string, writerId: string, request: SelectMoveRequest): Promise<GroupReplyResult> {
    return this.#json<unknown>(`/runs/${encoded(runId)}/group-reply`, { method: "POST", writerId, body: { groupId } }).then((value) => parseGroupReplyResult(value, request));
  }

  /**
   * Durable analysis admission (rfc/evidence-job-durability.md §2): one idempotency key per
   * request, so a transport retry of the same call replays the stored batch instead of duplicating.
   */
  async analysis(runId: string, nodeIds: readonly string[], writerId: string, idempotencyKey: string = globalThis.crypto.randomUUID()): Promise<{ readonly batchId: string; readonly jobs: readonly { readonly id: string }[] }> {
    const response = await this.#response(`/runs/${encoded(runId)}/analysis`, {
      method: "POST", writerId, body: { nodeIds, kind: "bestline", multiPv: 1, movetime: 100 }, headers: { "idempotency-key": idempotencyKey },
    });
    return (await response.json()) as { readonly batchId: string; readonly jobs: readonly { readonly id: string }[] };
  }

  scheduleReturn(runId: string, input: { readonly nodeId: string; readonly kind: "blocked" | "varied"; readonly variant?: string; readonly dueAt?: string }, writerId: string): Promise<ScheduledReturnResult> {
    return this.#json(`/runs/${encoded(runId)}/schedule`, { method: "POST", writerId, body: input });
  }

  simulate(runId: string, writerId: string): Promise<SimulationResult> {
    return this.#json(`/runs/${encoded(runId)}/simulate`, { method: "POST", writerId, body: {} });
  }

  enterSimulation(runId: string, simulationId: string, branchIndex: number, writerId: string): Promise<MutationResult> {
    return this.#json(`/runs/${encoded(runId)}/simulate-enter`, {
      method: "POST", writerId, body: { simulationId, branchIndex },
    });
  }

  move(
    runId: string,
    input: PlayerMoveRequest,
    writerId: string,
  ): Promise<MutationResult> {
    return this.#json(`/runs/${encoded(runId)}/moves`, {
      method: "POST",
      writerId,
      body: input,
    });
  }

  appendOpponentPly(
    runId: string,
    selection: OpponentSelection,
    writerId: string,
    options: MoveOptions = {},
  ): Promise<MutationResult> {
    return this.#json(`/runs/${encoded(runId)}/moves`, {
      method: "POST",
      writerId,
      body: { selection, ...options },
    });
  }

  async opponentPly(runId: string, request: BotOpponentPlyRequest, writerId: string): Promise<BotOpponentPlyResponse> {
    let body: Readonly<Record<string, unknown>>;
    try {
      body = await this.#json<Readonly<Record<string, unknown>>>(`/runs/${encoded(runId)}/opponent-ply`, { method: "POST", writerId, body: request });
    } catch (error) {
      if (error instanceof ApiError && error.details.result !== undefined) {
        let row: BotOpponentPlyResultRow;
        try {
          row = parseBotOpponentPlyResultRow(error.details.result);
        } catch {
          throw new ApiError(502, "INVALID_RESPONSE", "Opponent reply returned an unknown result row");
        }
        throw new BotOpponentPlyError(row, error.message);
      }
      throw error;
    }
    const row = parseBotOpponentPlyResultRow(body.result);
    if (row.action !== "continue") throw new ApiError(502, "INVALID_RESPONSE", "A successful opponent reply carried a non-continue row");
    const operation = body.operation as BotOpponentPlyOperation | undefined;
    if (operation === undefined || typeof operation !== "object" || operation.requestId !== request.requestId) {
      throw new ApiError(502, "INVALID_RESPONSE", "Opponent reply does not name this request");
    }
    return Object.freeze({ result: row, run: body.run as DrillRun, emitted: (body.emitted ?? []) as readonly DrillRunEvent[], operation });
  }

  rewind(
    runId: string,
    input: RewindRequest,
    writerId: string,
  ): Promise<MutationResult> {
    return this.#json(`/runs/${encoded(runId)}/rewind`, {
      method: "POST",
      writerId,
      body: input,
    });
  }

  fork(
    runId: string,
    input: ForkRequest,
    writerId: string,
  ): Promise<MutationResult> {
    return this.#json(`/runs/${encoded(runId)}/fork`, {
      method: "POST",
      writerId,
      body: input,
    });
  }

  async graph(runId: string, writerId?: string): Promise<RunGraph> {
    const body = await this.#json<{ readonly graph: RunGraph }>(
      `/runs/${encoded(runId)}/graph`,
      writerId === undefined ? {} : { writerId },
    );
    return body.graph;
  }

  async claimLease(runId: string, writerId: string): Promise<void> {
    await this.#json(`/runs/${encoded(runId)}/lease`, {
      method: "POST",
      writerId,
      body: {},
    });
  }

  async grants(runId: string): Promise<readonly RunGrant[]> {
    const body = await this.#json<{ readonly grants: readonly RunGrant[] }>(
      `/runs/${encoded(runId)}/grants`,
    );
    return body.grants;
  }

  async updateGrants(runId: string, operation: GrantOperation, writerId: string): Promise<readonly RunGrant[]> {
    const body = await this.#json<{ readonly grants: readonly RunGrant[] }>(
      `/runs/${encoded(runId)}/grants`,
      { method: "POST", writerId, body: operation },
    );
    return body.grants;
  }

  async compare(
    runId: string,
    branchIds: readonly string[],
  ): Promise<BranchComparison> {
    const body = await this.#json<{ readonly comparison: BranchComparison }>(
      `/runs/${encoded(runId)}/compare`,
      { method: "POST", body: { branchIds } },
    );
    return body.comparison;
  }

  async branchDecidedness(runId: string, branchIds: readonly string[]): Promise<Readonly<Record<string, import("@chess-tabiya/runtime").Decidedness>>> {
    const body = await this.#json<{ readonly decidedness: Readonly<Record<string, import("@chess-tabiya/runtime").Decidedness>> }>(
      `/runs/${encoded(runId)}/branch-decidedness`,
      { method: "POST", body: { branchIds } },
    );
    return body.decidedness;
  }

  events(runId: string, sinceSeq = 0): Promise<EventsPage> {
    return this.#json(`/runs/${encoded(runId)}/events?sinceSeq=${sinceSeq}`);
  }

  evidence(runId: string, sinceSeq = 0): Promise<EvidencePage> {
    return this.#json<unknown>(`/runs/${encoded(runId)}/evidence?sinceSeq=${sinceSeq}`).then((value) => parseEvidencePage(value, sinceSeq));
  }

  async marks(runId: string): Promise<readonly RunMark[]> {
    const page = await this.#json<{ readonly marks: readonly RunMark[] }>(`/runs/${encoded(runId)}/marks`);
    return page.marks;
  }

  async replaceMarks(runId: string, input: { readonly nodeId:string;readonly branchId:string;readonly scope:"position"|"branch";readonly shapes:readonly Pick<RunMark,"brush"|"orig"|"dest">[] }): Promise<readonly RunMark[]> {
    const page = await this.#json<{ readonly marks: readonly RunMark[] }>(`/runs/${encoded(runId)}/marks`, { method:"PUT", body:input });
    return page.marks;
  }

  async rescopeMarks(runId:string,input:{readonly nodeId:string;readonly branchId:string;readonly fromScope:"position"|"branch";readonly toScope:"position"|"branch"}):Promise<readonly RunMark[]>{
    const page=await this.#json<{readonly marks:readonly RunMark[]}>(`/runs/${encoded(runId)}/marks`,{method:"PUT",body:{nodeId:input.nodeId,branchId:input.branchId,scope:input.toScope,rescopeFrom:input.fromScope}});return page.marks;
  }

  authoredFeedback(runId: string): Promise<AuthoredFeedbackPage> {
    return this.#json(`/runs/${encoded(runId)}/authored-feedback`);
  }

  reasoning(runId: string, checkpointId: string): Promise<ReasoningPage> {
    return this.#json(`/runs/${encoded(runId)}/reasoning?checkpointId=${encoded(checkpointId)}`);
  }

  reasoningReview(runId: string, checkpointEventSeq: number): Promise<ReasoningReviewPage> {
    return this.#json(`/runs/${encoded(runId)}/reasoning-review`, {
      method: "POST",
      body: { checkpointEventSeq },
    });
  }

  applyEvidence(
    runId: string,
    resultSeq: number,
    writerId: string,
    at?: string,
  ): Promise<MutationResult> {
    return this.#json(`/runs/${encoded(runId)}/evidence`, {
      method: "POST",
      writerId,
      body: { resultSeq, ...(at === undefined ? {} : { at }) },
    });
  }

  reveal(runId: string, writerId: string, at?: string): Promise<MutationResult> {
    return this.#json(`/runs/${encoded(runId)}/reveal`, {
      method: "POST",
      writerId,
      body: { ...(at === undefined ? {} : { at }) },
    });
  }

  async pgn(runId: string, branchIds?: readonly string[]): Promise<PgnDownload> {
    const query =
      branchIds === undefined
        ? ""
        : `?${new URLSearchParams({ branches: branchIds.join(",") })}`;
    const response = await this.#response(`/runs/${encoded(runId)}/pgn${query}`);
    return Object.freeze({
      filename: attachmentFilename(
        response.headers.get("content-disposition"),
        `${runId}.pgn`,
      ),
      text: await response.text(),
    });
  }

  async #response(
    path: string,
    options: {
      readonly method?: "GET" | "POST" | "PUT" | "DELETE";
      readonly writerId?: string;
      readonly body?: unknown;
      readonly rawBody?: string;
      readonly headers?: Readonly<Record<string, string>>;
    } = {},
  ): Promise<Response> {
    const response = await this.#fetch(`${this.#baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.writerId === undefined
          ? {}
          : { "x-writer-id": options.writerId }),
        ...(options.body === undefined || options.rawBody !== undefined ? {} : { "content-type": "application/json" }),
        ...options.headers,
      },
      ...(options.rawBody !== undefined
        ? { body: options.rawBody }
        : options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      credentials: "same-origin",
    });
    if (response.ok) return response;
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("tabiya:unauthenticated"));
    }

    let envelope: ErrorEnvelope = {};
    try {
      envelope = (await response.json()) as ErrorEnvelope;
    } catch {
      // A typed transport error is still returned when a proxy sends non-JSON.
    }
    const error = envelope.error;
    const code = typeof error?.code === "string" ? error.code : "HTTP_ERROR";
    const message =
      typeof error?.message === "string" ? error.message : `HTTP ${response.status}`;
    const { code: _code, message: _message, ...details } = error ?? {};
    throw new ApiError(response.status, code, message, details);
  }

  async #json<T>(
    path: string,
    options: {
      readonly method?: "GET" | "POST" | "PUT" | "DELETE";
      readonly writerId?: string;
      readonly body?: unknown;
    } = {},
  ): Promise<T> {
    return (await (await this.#response(path, options)).json()) as T;
  }
}

export function evidenceKindLabel(kind: EvidenceKind): string {
  return kind === "bestline" ? "best line" : kind;
}
