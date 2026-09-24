<script lang="ts">
  import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
  import type { Capabilities, CorpusPage, HumanSplitPage, ReasoningPage, ReasoningReviewPage, RunRole, SessionKind, ShapeEntryView, SimulationResult, VoicePage } from "./api.js";
  import { BRANCH_COLLAPSE_FLOOR, MARK_BRUSHES, MAX_COMPARISON_BRANCHES, SILENT_ASSISTANCE, branchPath, classifyPhase, collapsedBranchIds, endgameClassification, endgameSetupMatches, renderEndgameSetupMatch, feedbackDeliveryOpen, groupsFromEvents, historyFrom, lineMembership, moveTransitionEvidence, permittedAssistance, pivotalMarkerEvidence, positionStructureEvidence, presetDeclaration, renderEndgameClassification, renderPhaseReading, renderPivotalMarker, selectedSquareSightEvidence, shapeFiringEvidence, structuralReading, transitionReading, trajectoryVerdict, type AssistanceConfig, type BranchComparison, type BranchGroup, type Decidedness, type PresetId, type RunMark } from "@chess-tabiya/runtime";
  import type { DrawShape } from "@lichess-org/chessground/draw";
  import { onDestroy, onMount, tick, untrack } from "svelte";

  import AssistanceControlFields from "./AssistanceControlFields.svelte";
  import BranchRail from "./BranchRail.svelte";
  import CheckpointSheet from "./CheckpointSheet.svelte";
  import Chessboard from "./Chessboard.svelte";
  import CompareView from "./CompareView.svelte";
  import HonestControl from "./HonestControl.svelte";
  import KeyboardHelp from "./KeyboardHelp.svelte";
  import { modalBoundary } from "./modal-boundary.js";
  import Timeline from "./Timeline.svelte";
  import TerminalSheet, { type AssignmentSubmissionOffer, type RepertoireAnswerOffer } from "./TerminalSheet.svelte";
  import WhyBanner from "./WhyBanner.svelte";
  import OutcomeContext from "./OutcomeContext.svelte";
  import ImportedGuessPanel from "./ImportedGuessPanel.svelte";
  import { importedNextMove, type ImportedGuess } from "./session-controller.js";
  import ShapePanel from "./ShapePanel.svelte";
  import StatusAnnouncement from "./StatusAnnouncement.svelte";
  import GroupPanel from "./GroupPanel.svelte";
  import { renderEvidenceRef } from "./evidence-sentences.js";
  import { renderStructuralExpressionSpec, renderStructuralObservation } from "./structural-sentences.js";
  import { renderTransitionObservation } from "./transition-sentences.js";
  import { renderCorpusPage } from "./corpus-sentences.js";
  import { corpusEvidence, humanSplitEvidence } from "./inspector-evidence.js";
  import type { PostcommitNudge } from "./nudge-response.js";
  import GuidedHintSeat from "./GuidedHintSeat.svelte";
  import type { GuidedHintClient } from "./api.js";
  import type { HintDeliveryMarks } from "@chess-tabiya/runtime";
  import { RECORDED_READING_GUARD } from "./recorded-reading-sentences.js";
  import type { CheckpointNotice } from "./screen-model.js";
  import {
    activeNode,
    branchCards,
    evidencePayloads,
    packObjective,
    packStartSide,
    timelineBranchCards,
    timelineEntries,
    whyBanner,
  } from "./screen-model.js";
  import type { RunStateSnapshot } from "./run-state.js";
  import type { AuthoredFeedbackPage, CreateGroupRequest, CreateGroupResult } from "./api.js";
  import type { RegisterKeyboardRegion } from "./keyboard.js";
  import {
    assessmentSentence,
    assessmentSummary,
    checkpointResolutionSentence,
    humanModelBandSentence,
    objectiveGradeSentence,
    projectedGrading,
    resistanceSentences,
    resistanceSummary,
  } from "./outcome-presentation.js";
  import { consequenceHorizon, phaseLabel, phaseSummary } from "./run-copy.js";
  import { assistanceProfile, loadWorkflowPreference, requestedAssistanceConfig, requestedPresetLabel, saveWorkflowPreference, workflowPreferenceKey, type AssistanceProfile, type PreferenceStorage } from "./assistance-preference.js";
  import { CONFIGURABLE_MODULE_IDS, MODULE_LABELS, ASSISTANCE_PREFERENCE_FIELDS, browserChannelReceipt, compileAssistanceRequest, compiledPresetDisclosure, narrowBrowserChannels, requestedModules, requestedPreset, selectNamedPreset, setPreferenceField, setPreferenceModule, workflowContextPolicy, type BrowserNarrowedAssistanceV1, type ConfigurableModuleId, type FinalizedAssistanceV1, type RequestedAssistanceV1, type WorkflowPreferenceReceipt, type WorkflowPreferenceV2 } from "@chess-tabiya/runtime";
  import { runViewportSupport, type RunViewportSupport } from "./viewport-support.js";
  import { playBoardEdge, playViewportClass } from "./play-composition.js";
  import { HUMAN_MODEL_RUNG_DISCLAIMER, humanModelMaterialLimit, runOpponentStatus } from "./opponent-copy.js";
  import { storyMomentLabel } from "./learner-copy.js";
  import { moveSanFromUci } from "./board-input.js";
  import { checkpointAuthoredItems as selectCheckpointAuthoredItems } from "./checkpoint-authored-items.js";
  import { rehearsalGuideStep } from "./rehearsal-guide.js";
  import { rehearsalStepLabel } from "./chronology-copy.js";
  import SimulationPreview from "./SimulationPreview.svelte";

  type RewindTarget =
    | { readonly nodeId: string; readonly branchId?: string }
    | { readonly checkpointId: string; readonly branchId?: never };

  interface MarkSaveInput {
    readonly nodeId: string;
    readonly branchId: string;
    readonly scope: "position" | "branch";
    readonly shapes: readonly Pick<RunMark, "brush" | "orig" | "dest">[];
  }

  interface MarkRescopeInput {
    readonly nodeId: string;
    readonly branchId: string;
    readonly fromScope: "position" | "branch";
    readonly toScope: "position" | "branch";
  }

  type FailedMarkOperation =
    | { readonly kind: "load"; readonly runId: string; readonly nodeId: string }
    | { readonly kind: "save"; readonly runId: string; readonly input: MarkSaveInput }
    | { readonly kind: "rescope"; readonly runId: string; readonly input: MarkRescopeInput };

  interface Props {
    pack?: DrillPackDefinition | undefined;
    relatedPack?: DrillPackDefinition | undefined;
    shapes?: readonly ShapeEntryView[] | undefined;
    snapshot: RunStateSnapshot;
    checkpoint?: CheckpointNotice | undefined;
    authoredFeedback?: AuthoredFeedbackPage | undefined;
    reasoning?: ReasoningPage | undefined;
    comparison?: BranchComparison | undefined;
    comparisonBranchIds?: readonly string[] | undefined;
    simulation?: SimulationResult | undefined;
    busy?: boolean;
    error?: string | undefined;
    capabilities?: Capabilities | undefined;
    viewerRole?: RunRole | undefined;
    boardSide?: "white" | "black" | undefined;
    assistanceStorage?: PreferenceStorage | undefined;
    liveSessionKind?: SessionKind | undefined;
    seatedInContest?: boolean | undefined;
    reviewing?: boolean | undefined;
    firstRehearsal?: boolean | undefined;
    onMove: (uci: string) => boolean | void | Promise<boolean | void>;
    onReveal?: (() => void | Promise<void>) | undefined;
    onRewind: (target: RewindTarget) => boolean | void | Promise<boolean | void>;
    onFork: (label?: string, intent?: string) => boolean | void | Promise<boolean | void>;
    onSwitchBranch: (leafNodeId: string, branchId: string) => boolean | void | Promise<boolean | void>;
    onCompare: (branchIds: readonly string[]) => boolean | void | Promise<boolean | void>;
    onClassifyBranches?: (branchIds: readonly string[]) => Promise<Readonly<Record<string, Decidedness>>>;
    onCloseCompare: () => void;
    onReplayResistance?: ((input: { readonly fen: string; readonly side: "white" | "black"; readonly targetElo: 1000 | 1400 | 1800 | 2200 }) => void | Promise<void>) | undefined;
    /** Rematch of a bot-profile run: a new run with the exact same profile and a new seed. */
    onRematch?: (() => void | Promise<void>) | undefined;
    onRetryOpponent?: (() => void | Promise<unknown>) | undefined;
    /** Layer actions of the last bot reply (degraded/abstained status only). */
    botReply?: { readonly layers: readonly { readonly id: string; readonly action: "applied" | "abstained" | "degraded"; readonly reason?: string }[] } | undefined;
    onContinueCheckpoint: () => boolean | void | Promise<boolean | void>;
    onPrediction?: (uci: string) => void | Promise<void>;
    importedGuess?: ImportedGuess | undefined;
    onGuessImportedMove?: ((uci: string) => void | Promise<void>) | undefined;
    onReasoning?: (input: { readonly transcript?: import("@chess-tabiya/runtime").ReasoningTranscript; readonly skipped?: true }) => void | Promise<void>;
    onReasoningReview?: ((checkpointEventSeq: number) => Promise<ReasoningReviewPage>) | undefined;
    onExport: (branchIds?: readonly string[]) => void | Promise<void>;
    onLoadMarks?: (() => Promise<readonly RunMark[]>) | undefined;
    onSaveMarks?: ((input: MarkSaveInput) => Promise<readonly RunMark[]>) | undefined;
    onRescopeMarks?: ((input: MarkRescopeInput) => Promise<readonly RunMark[]>) | undefined;
    onStop: () => void;
    onAssistanceQuery?: ((request: RequestedAssistanceV1) => Promise<FinalizedAssistanceV1>) | undefined;
    onHumanSplit?: (nodeId: string) => Promise<HumanSplitPage>;
    onNudge?: ((nodeId: string) => Promise<PostcommitNudge>) | undefined;
    /** rfc/hint-distance.md §7: the Guided Hint seat's request/poll/cancel operations. */
    hints?: GuidedHintClient | undefined;
    onCorpus?: (nodeId: string) => Promise<CorpusPage>;
    onVoice?: (nodeId: string, scope: VoicePage["scope"]) => Promise<VoicePage>;
    onCompareVoice?: (() => Promise<VoicePage>) | undefined;
    onSpeech?: (nodeId: string, scope: VoicePage["scope"]) => Promise<Blob>;
    onCreateGroup?: (input: CreateGroupRequest) => CreateGroupResult | undefined | Promise<CreateGroupResult | undefined>;
    onAnalyzeMissing?: (nodeIds: readonly string[]) => boolean | void | Promise<boolean | void>;
    onSimulate?: (() => boolean | Promise<boolean>) | undefined;
    onEnterSimulation?: ((branchIndex: number) => boolean | Promise<boolean>) | undefined;
    onCloseSimulation?: (() => void) | undefined;
    onStory?: (() => void) | undefined;
    onScheduleReturn?: (() => boolean | void | Promise<boolean | void>) | undefined;
    onFlip?: ((nodeId: string) => void | Promise<void>) | undefined;
    onSelectPack?: ((packId: string) => void | Promise<void>) | undefined;
    onFirstRehearsalComplete?: (() => void) | undefined;
    assignmentOffers?: readonly AssignmentSubmissionOffer[] | undefined;
    onSubmitAssignment?: ((assignmentId: string) => Promise<boolean | void>) | undefined;
    repertoireAnswerOffer?: RepertoireAnswerOffer | undefined;
    repertoireAnswerBusy?: string | undefined;
    repertoireAnswerError?: string | undefined;
    onChooseRepertoireAnswer?: ((repertoireId:string,gapKey:string,moveUci:string,ifMatch:string)=>Promise<void>) | undefined;
    registerKeyboardRegion: RegisterKeyboardRegion;
  }

  let {
    pack,
    relatedPack,
    shapes = [],
    snapshot,
    checkpoint,
    authoredFeedback,
    reasoning,
    comparison,
    comparisonBranchIds,
    simulation,
    busy = false,
    error,
    capabilities,
    viewerRole = "host",
    boardSide,
    assistanceStorage,
    liveSessionKind,
    seatedInContest = false,
    reviewing = false,
    firstRehearsal = false,
    onMove,
    onReveal,
    onRewind,
    onFork,
    onSwitchBranch,
    onCompare,
    onClassifyBranches,
    onCloseCompare,
    onReplayResistance,
    onRematch,
    botReply,
    onRetryOpponent,
    onContinueCheckpoint,
    onPrediction = () => {},
    importedGuess,
    onGuessImportedMove,
    onReasoning = () => {},
    onReasoningReview,
    onExport,
    onLoadMarks,
    onSaveMarks,
    onRescopeMarks,
    onStop,
    onAssistanceQuery,
    onHumanSplit,
    onNudge,
    hints,
    onCorpus,
    onVoice,
    onCompareVoice,
    onSpeech,
    onCreateGroup,
    onAnalyzeMissing,
    onSimulate,
    onEnterSimulation,
    onCloseSimulation,
    onStory,
    onScheduleReturn,
    onFlip,
    onSelectPack,
    onFirstRehearsalComplete,
    assignmentOffers = [],
    onSubmitAssignment,
    repertoireAnswerOffer,
    repertoireAnswerBusy,
    repertoireAnswerError,
    onChooseRepertoireAnswer,
    registerKeyboardRegion,
  }: Props = $props();

  let previewNodeId: string | undefined = $state();
  let compareIds: string[] = $state([]);
  let compareStep = $state(0);
  let helpOpen = $state(false);
  let helpInvoker: HTMLElement | undefined;
  let forkInvoker: HTMLElement | undefined;
  let checkpointPickerInvoker: HTMLElement | undefined;
  let compareInvoker: HTMLElement | undefined;
  let shapeInvoker: HTMLElement | undefined;
  let groupInvoker: HTMLElement | undefined;
  let forkOpen = $state(false);
  let checkpointPickerOpen = $state(false);
  let checkpointContinueBusy = $state(false);
  let checkpointContinueError: { readonly eventSeq: number; readonly text: string } | undefined = $state();
  let checkpointContinueRequest = 0;
  let replaying = $state(false);
  let structuralOpen = $state(false);
  let transitionOpen = $state(false);
  let inspectorOpen = $state(false);
  let objectiveOpen = $state(false);
  let sheetOpen = $state(false);
  let openShapeId: string | undefined = $state();
  let inspectedShapeId: string | undefined = $state();
  // rfc/intent-presets.md §5.2 — the one seat. The browser holds only the learner's typed receipt;
  // the effective config arrives from the server's authoritative/finalized stages and is narrowed
  // here only for browser speech. Pending/unavailable renders the silent floor, never a wider promise.
  let preference: WorkflowPreferenceReceipt = $state({ kind: "unset" });
  let compiledAssistance: BrowserNarrowedAssistanceV1 | undefined = $state();
  let assistanceQueryState: "pending" | "ready" | "unavailable" = $state("pending");
  let preferenceUnsaved = $state(false);
  let assistanceQuery = 0;
  let assistance: AssistanceConfig = $derived(compiledAssistance?.config ?? SILENT_ASSISTANCE);
  let assistanceMenuOpen = $state(false);
  let openPivotalNodeId: string | undefined = $state();
  let pivotalDialogOpen = $state(false);
  let humanSplit: HumanSplitPage | undefined = $state();
  let corpusPage: CorpusPage | undefined = $state();
  let humanSplitBusyNodeId: string | undefined = $state();
  let corpusBusyNodeId: string | undefined = $state();
  let humanSplitError: { readonly nodeId: string; readonly text: string } | undefined = $state();
  let corpusError: { readonly nodeId: string; readonly text: string } | undefined = $state();
  let humanSplitRequest = 0;
  let corpusRequest = 0;
  let voicePage: VoicePage | undefined = $state();
  let voiceNodeId: string | undefined = $state();
  let voiceBusy: { readonly nodeId: string; readonly scope: VoicePage["scope"] } | undefined = $state();
  let voiceError: { readonly nodeId: string; readonly scope: VoicePage["scope"]; readonly text: string } | undefined = $state();
  let voiceRequest = 0;
  let speechBusyNodeId: string | undefined = $state();
  let speechError: { readonly nodeId: string; readonly text: string } | undefined = $state();
  let speechRequest = 0;
  let spokenAudio: { readonly nodeId: string; readonly audio: HTMLAudioElement; readonly url: string } | undefined;
  let forkLabel = $state("");
  let forkIntent = $state("");
  let forkBusy = $state(false);
  let forkError: string | undefined = $state();
  let forkRequest = 0;
  let groupOpen = $state(false);
  let groupSource: CreateGroupRequest["source"] = $state("hand_picked");
  let groupResistance: "fixed" | "per_branch" = $state("fixed");
  let groupSize = $state(4);
  let groupCandidates: string[] = $state([]);
  let groupModes: Record<string, "sequential" | "lockstep"> = $state({});
  let groupBusy = $state(false);
  let groupError: string | undefined = $state();
  let groupOutcomeUncertain = $state(false);
  let groupRequest = 0;
  let groupOpenContext: { readonly runId: string; readonly nodeId: string } | undefined = $state();
  let replayTimer: ReturnType<typeof setInterval> | undefined;
  let mainElement = $state<HTMLElement>();
  let forkIntentInput = $state<HTMLTextAreaElement>();
  let pickerHeading = $state<HTMLHeadingElement>();
  let groupHeading = $state<HTMLHeadingElement>();
  let regionElement = $state<HTMLElement>();
  let unregisterKeyboard: (() => void) | undefined;
  let speechAvailable = $state(false);
  let dismissedGuardSeq: number | undefined = $state();
  let selectedSquare: string | undefined = $state();
  let boardActiveSquare: import("./board-input.js").Square | undefined = $state();
  let boardActiveRunId: string | undefined = $state();
  let boardMoveAnnouncement: string | undefined = $state();
  let boardFocusRequested = $state(false);
  let compactTab: "timeline" | "branches" | "evidence" = $state("evidence");
  let companionInvoker = $state<HTMLElement>();
  let companionElement = $state<HTMLElement>();
  let decidedness: Readonly<Record<string, Decidedness>> = $state({});
  let classificationBusy = $state(false);
  let classificationError: string | undefined = $state();
  let classificationRequest = 0;
  let classificationPopulation: string | undefined;
  let foldedBranchIds: string[] = $state([]);
  let pinnedExpanded: string[] = $state([]);
  let compareLimitNotice: string | undefined = $state();
  let compareBusy = $state(false);
  let compareError: string | undefined = $state();
  let compareRequest = 0;
  let rewindBusy = $state(false);
  let rewindFailure: { readonly targetKey: string; readonly text: string } | undefined = $state();
  let rewindRequest = 0;
  let branchSwitchBusy: { readonly branchId: string; readonly label: string } | undefined = $state();
  let branchSwitchError: string | undefined = $state();
  let branchSwitchRequest = 0;
  let viewportSupport: RunViewportSupport = $state({ supported: true, width: 0, height: 0, reason: null });
  let ownMarks: readonly RunMark[] = $state([]);
  let markScope: "position" | "branch" = $state("position");
  let markTimer: ReturnType<typeof setTimeout> | undefined;
  let markRequest = 0;
  let loadedMarksRunId: string | undefined;
  let markBusy: { readonly request: number; readonly kind: FailedMarkOperation["kind"] } | undefined = $state();
  let markError: { readonly text: string; readonly retryLabel: string } | undefined = $state();
  let failedMarkOperation: FailedMarkOperation | undefined = $state();
  let guideOpenedForRunId: string | undefined = $state();
  let analysisRequestedNodeId: string | undefined = $state();
  let analysisRequestError: { readonly nodeId: string; readonly text: string } | undefined = $state();
  let analysisRequest = 0;
  let groupAnalysisBusy: { readonly runId: string; readonly groupId: string; readonly nodeKey: string } | undefined = $state();
  let groupAnalysisError: { readonly runId: string; readonly groupId: string; readonly nodeKey: string; readonly text: string } | undefined = $state();
  let groupAnalysisRequest = 0;
  let simulationOpening: number | undefined = $state();
  let simulationOpenError: { readonly runId: string; readonly nodeId: string } | undefined = $state();
  let simulationRequest = 0;

  function measureViewport(): void {
    viewportSupport = runViewportSupport(globalThis.innerWidth, globalThis.innerHeight);
  }

  function openCompanion(tab: typeof compactTab, event?: Event): void {
    companionInvoker = event === undefined
      ? document.activeElement instanceof HTMLElement ? document.activeElement : mainElement
      : invoker(event);
    compactTab = tab;
    sheetOpen = true;
  }

  function closeCompanion(): void {
    sheetOpen = false;
    restoreFocus(companionInvoker);
    companionInvoker = undefined;
  }

  function openGroupCreator(event: Event): void {
    groupInvoker = invoker(event);
    groupOpenContext = Object.freeze({ runId: run.id, nodeId: displayedNode.id });
    groupError = undefined;
    groupOutcomeUncertain = false;
    groupOpen = true;
    if (phoneSheetModal) closeCompanion();
    void tick().then(() => groupHeading?.focus());
  }

  function closeGroupCreator(): void {
    groupRequest += 1;
    groupBusy = false;
    groupError = undefined;
    groupOutcomeUncertain = false;
    groupOpenContext = undefined;
    groupOpen = false;
    groupCandidates = [];
    restoreFocus(compactViewport ? mainElement : groupInvoker);
    groupInvoker = undefined;
  }

  function focusBoardForGroup(): void {
    mainElement?.querySelector<HTMLElement>("[data-board-input-grid]")?.focus();
  }

  function groupPaletteKeydown(event: KeyboardEvent): void {
    if (!groupOpen || event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    closeGroupCreator();
  }

  function openAssistance(event: Event): void {
    openCompanion("evidence", event);
  }

  function openAdvancedSupport(): void {
    assistanceMenuOpen = false;
    inspectorOpen = true;
  }

  let run = $derived(snapshot.run);
  // rfc/bot-policy.md §4.3: a bot reply whose guard stood aside or whose Maia page fell below the
  // profile floor keeps the bot's identity and says so; it never renames the opponent.
  let botReplyNote = $derived.by(() => {
    if (run.opponentPolicy.profile === undefined || botReply === undefined) return undefined;
    if (botReply.layers.some((layer) => layer.id === "guard.severe_error@1" && layer.action === "abstained")) return "The Stockfish check stood aside on the last reply";
    if (botReply.layers.some((layer) => layer.action === "degraded")) return "Maia returned a narrower page than this bot expects on the last reply";
    return undefined;
  });
  let compactViewport = $derived(playViewportClass(viewportSupport.width, viewportSupport.height) === "phone");
  let reflowViewport = $derived(compactViewport && viewportSupport.height > 0 && viewportSupport.height < 680);
  let boardEdge = $derived(playBoardEdge(viewportSupport.width, viewportSupport.height));
  let phoneSheetModal = $derived(viewportSupport.width > 0 && compactViewport && sheetOpen);
  let canWrite = $derived(snapshot.access === "writer");
  let currentNode = $derived(activeNode(run));
  let runEvidencePayloads = $derived(evidencePayloads(run));
  let recordedEngineEvidence = $derived(
    currentNode.evidenceRefs
      .map((reference) => renderEvidenceRef(reference, pack, runEvidencePayloads))
      .filter((sentence) => sentence.sourceLabel === "Engine"),
  );
  let analysisUnavailableReason = $derived.by(() => {
    if (!canWrite) return "This read-only view cannot request a new calculation.";
    if (onAnalyzeMissing === undefined || capabilities?.providers.judge === "none") {
      return "A calculation engine is not available from this deployment.";
    }
    if (!feedbackDeliveryOpen(run)) {
      return run.feedbackPolicy === "attempt_end"
        ? "Open support for this position before requesting a calculation."
        : "This rehearsal opens calculated evidence at its next feedback point.";
    }
    if (busy) return "Another run action is still finishing.";
    if (analysisRequestedNodeId === currentNode.id) return "The calculation is being prepared for this position.";
    return undefined;
  });

  async function requestCurrentAnalysis(): Promise<void> {
    if (analysisUnavailableReason !== undefined || onAnalyzeMissing === undefined) return;
    const nodeId = currentNode.id;
    const request = ++analysisRequest;
    analysisRequestedNodeId = nodeId;
    analysisRequestError = undefined;
    try {
      const accepted = await onAnalyzeMissing([nodeId]);
      if (request !== analysisRequest) return;
      if (accepted === false) {
        if (analysisRequestedNodeId === nodeId) analysisRequestedNodeId = undefined;
        analysisRequestError = { nodeId, text: "The calculation did not start. Try again." };
      }
    } catch {
      if (request !== analysisRequest) return;
      if (analysisRequestedNodeId === nodeId) analysisRequestedNodeId = undefined;
      analysisRequestError = { nodeId, text: "The calculation is unavailable right now. Try again." };
    }
  }

  function analysisNodeKey(nodeIds: readonly string[]): string {
    return [...nodeIds].sort().join("\u001f");
  }

  function missingGroupNodeIds(group: BranchGroup): readonly string[] {
    return group.members
      .map((member) => branchPath(run, member.branchId).at(-1)!)
      .filter((node) => node.evidenceRefs.length === 0)
      .map((node) => node.id);
  }

  async function requestGroupAnalysis(group: BranchGroup, nodeIds: readonly string[]): Promise<boolean> {
    if (onAnalyzeMissing === undefined || busy || groupAnalysisBusy !== undefined || nodeIds.length === 0) return false;
    const target = { runId: run.id, groupId: group.groupId, nodeKey: analysisNodeKey(nodeIds) };
    const request = ++groupAnalysisRequest;
    groupAnalysisBusy = target;
    groupAnalysisError = undefined;
    try {
      const accepted = await onAnalyzeMissing(nodeIds);
      if (request !== groupAnalysisRequest) return false;
      if (run.id !== target.runId || activeGroup?.groupId !== target.groupId) return false;
      if (accepted === false) {
        groupAnalysisError = { ...target, text: "The comparisons were not prepared. This group is unchanged; try again." };
        return false;
      }
      return true;
    } catch {
      if (request === groupAnalysisRequest && run.id === target.runId && activeGroup?.groupId === target.groupId) {
        groupAnalysisError = { ...target, text: "The comparisons are unavailable right now. This group is unchanged; try again." };
      }
      return false;
    } finally {
      if (request === groupAnalysisRequest) groupAnalysisBusy = undefined;
    }
  }
  let simulationInvoker = $state<HTMLElement>();
  function findSpineNode(nodes: NonNullable<DrillPackDefinition["spine"]>, id: string): NonNullable<DrillPackDefinition["spine"]>[number] | undefined {
    for (const node of nodes) {
      if (node.id === id) return node;
      const child = findSpineNode(node.children, id);
      if (child !== undefined) return child;
    }
    return undefined;
  }
  let simulationChoiceCount = $derived.by(() => {
    if (pack === undefined) return 0;
    if (currentNode.parentId === null) return pack.spine?.length ?? 0;
    const spineNodeId = lineMembership(pack, run, currentNode.id).at(-1)?.spineNodeId;
    return spineNodeId === undefined ? 0 : findSpineNode(pack.spine ?? [], spineNodeId)?.children.length ?? 0;
  });
  async function openSimulation(event: Event): Promise<void> {
    if (onSimulate === undefined || simulationOpening !== undefined) return;
    simulationInvoker = invoker(event);
    const runId = run.id;
    const nodeId = currentNode.id;
    const request = ++simulationRequest;
    simulationOpening = request;
    simulationOpenError = undefined;
    try {
      if (!await onSimulate() && request === simulationRequest && run.id === runId && currentNode.id === nodeId) {
        simulationOpenError = { runId, nodeId };
      }
    } catch {
      if (request === simulationRequest && run.id === runId && currentNode.id === nodeId) {
        simulationOpenError = { runId, nodeId };
      }
    } finally {
      if (simulationOpening === request) simulationOpening = undefined;
    }
  }
  function closeSimulation(): void {
    onCloseSimulation?.();
    void tick().then(() => simulationInvoker?.focus());
  }
  let comparisonForkNode = $derived(comparison === undefined ? undefined : run.nodes.find((node) => node.id === comparison.forkNodeId));
  let guide = $derived(firstRehearsal ? rehearsalGuideStep(run) : undefined);
  let objectiveSentence = $derived(
    pack === undefined
      ? "Nothing is authored about this position — Tabiya reads it as you play, and marks the moments worth returning to."
      : packObjective(pack),
  );
  let checkpointLabels: Readonly<Record<string, string>> = $derived.by(() => Object.freeze(Object.fromEntries(
    (pack?.checkpoints ?? []).flatMap((item): [string, string][] =>
      typeof item.label === "string" && item.label.trim() !== "" ? [[item.id, item.label]] : []),
  )));
  function checkpointDisplayLabel(checkpointId: string): string {
    return checkpointLabels[checkpointId] ?? "Recorded checkpoint";
  }

  async function loadMarks(): Promise<void> {
    if (onLoadMarks === undefined) return;
    const runId = run.id;
    const nodeId = displayedNode.id;
    const request = ++markRequest;
    markBusy = { request, kind: "load" };
    markError = undefined;
    failedMarkOperation = undefined;
    try {
      const marks = await onLoadMarks();
      if (request !== markRequest || run.id !== runId) return;
      ownMarks = marks;
      markBusy = undefined;
    } catch {
      if (request !== markRequest || run.id !== runId) return;
      markBusy = undefined;
      markError = { text: "Saved board marks are unavailable right now.", retryLabel: "Retry loading marks" };
      failedMarkOperation = { kind: "load", runId, nodeId };
    }
  }

  async function persistMarks(input: MarkSaveInput, runId: string, request = ++markRequest): Promise<void> {
    if (onSaveMarks === undefined || request !== markRequest || run.id !== runId) return;
    markBusy = { request, kind: "save" };
    markError = undefined;
    failedMarkOperation = undefined;
    try {
      const marks = await onSaveMarks(input);
      if (request !== markRequest || run.id !== runId) return;
      ownMarks = marks;
      markBusy = undefined;
    } catch {
      if (request !== markRequest || run.id !== runId) return;
      markBusy = undefined;
      markError = { text: "These board marks were not saved. They remain visible on this screen.", retryLabel: "Retry saving marks" };
      failedMarkOperation = { kind: "save", runId, input };
    }
  }

  async function rescopeMarks(input: MarkRescopeInput, runId: string, request = ++markRequest): Promise<void> {
    if (onRescopeMarks === undefined || request !== markRequest || run.id !== runId) return;
    markBusy = { request, kind: "rescope" };
    markError = undefined;
    failedMarkOperation = undefined;
    try {
      const marks = await onRescopeMarks(input);
      if (request !== markRequest || run.id !== runId) return;
      ownMarks = marks;
      markBusy = undefined;
      if (displayedNode.id === input.nodeId && run.activeCursor.branchId === input.branchId) {
        markScope = input.toScope;
        try { globalThis.localStorage?.setItem(`tabiya:mark-scope:${run.id}`, markScope); } catch { /* local preference only */ }
      }
    } catch {
      if (request !== markRequest || run.id !== runId) return;
      markBusy = undefined;
      markError = { text: "Those board marks could not be moved to the other scope.", retryLabel: "Retry moving marks" };
      failedMarkOperation = { kind: "rescope", runId, input };
    }
  }

  function retryMarkOperation(): void {
    const failed = failedMarkOperation;
    if (failed === undefined || failed.runId !== run.id) return;
    if (failed.kind === "load") {
      void loadMarks();
    } else if (failed.kind === "save") {
      void persistMarks(failed.input, failed.runId);
    } else {
      void rescopeMarks(failed.input, failed.runId);
    }
  }

  function changedMarks(shapes: readonly DrawShape[]): void {
    if (onSaveMarks === undefined || previewNodeId !== undefined) return;
    if (markTimer !== undefined) clearTimeout(markTimer);
    const nodeId = displayedNode.id;
    const branchId = run.activeCursor.branchId;
    const runId = run.id;
    const scope = markScope;
    const scopeKey = displayedMarkKey;
    const persistable: readonly Pick<RunMark,"brush"|"orig"|"dest">[] = shapes.slice(0,64).flatMap((shape) =>
      shape.brush !== undefined && MARK_BRUSHES.includes(shape.brush as RunMark["brush"])
        ? [{ brush:shape.brush as RunMark["brush"],orig:shape.orig,...(shape.dest===undefined?{}:{dest:shape.dest}) }]
        : []);
    const at = new Date().toISOString();
    ownMarks = [
      ...ownMarks.filter((mark) => mark.scope !== scope || mark.scopeKey !== scopeKey),
      ...persistable.map((shape) => ({ ...shape, scope, scopeKey, at })),
    ];
    const request = ++markRequest;
    markBusy = { request, kind: "save" };
    markError = undefined;
    failedMarkOperation = undefined;
    markTimer = setTimeout(() => {
      void persistMarks({ nodeId, branchId, scope, shapes: persistable }, runId, request);
    }, 400);
  }

  function setMarkScope(event: Event): void {
    if (markBusy !== undefined) return;
    markScope = (event.currentTarget as HTMLSelectElement).value as "position" | "branch";
    try { globalThis.localStorage?.setItem(`tabiya:mark-scope:${run.id}`, markScope); } catch { /* local preference only */ }
  }

  function rescopeVisibleMarks(): void {
    if (onRescopeMarks === undefined || displayedMarks.length === 0 || markBusy !== undefined) return;
    const input: MarkRescopeInput = {
      nodeId: displayedNode.id,
      branchId: run.activeCursor.branchId,
      fromScope: markScope,
      toScope: markScope === "position" ? "branch" : "position",
    };
    void rescopeMarks(input, run.id);
  }
  let guardEvent = $derived(
    [...run.events].reverse().find(
      (event) =>
        event.type === "feedback.generated" &&
        event.data.nodeId === currentNode.id &&
        event.seq !== dismissedGuardSeq,
    ),
  );
  let guardGrounds = $derived(
    guardEvent?.type === "feedback.generated"
      ? guardEvent.data.evidenceRefs.map((reference) => renderEvidenceRef(reference, pack, runEvidencePayloads))
      : [],
  );
  let guardRewindNodeId = $derived.by(() => {
    if (guardEvent?.type !== "feedback.generated") return undefined;
    const consequence = run.nodes.find((node) => node.id === guardEvent.data.nodeId);
    const learnerMove = run.nodes.find((node) => node.id === consequence?.parentId);
    return run.nodes.find((node) => node.id === learnerMove?.parentId)?.id;
  });
  let trajectory = $derived(pack?.legs === undefined
    ? undefined
    : trajectoryVerdict(pack, run, run.activeCursor.nodeId));
  let terminalEvent = $derived(
    [...run.events].reverse().find(
      (event) =>
        event.type === "outcome.reached" && event.data.nodeId === currentNode.id,
    ),
  );
  let timelineRewindNodeIds = $derived.by(() => {
    const ids = new Set<string>();
    for (const event of run.events) {
      if (event.type === "checkpoint.reached") ids.add(event.data.nodeId);
      if (event.type === "feedback.generated") {
        const consequence = run.nodes.find((node) => node.id === event.data.nodeId);
        const learnerMove = run.nodes.find((node) => node.id === consequence?.parentId);
        const decision = run.nodes.find((node) => node.id === learnerMove?.parentId);
        if (decision !== undefined) ids.add(decision.id);
      }
      if (event.type === "outcome.reached") {
        const outcomeNode = run.nodes.find((node) => node.id === event.data.nodeId);
        if (outcomeNode?.parentId !== null && outcomeNode?.parentId !== undefined) ids.add(outcomeNode.parentId);
      }
    }
    return ids;
  });
  let previousSupportRewindNodeId = $derived(
    [...historyFrom(run, run.activeCursor.nodeId)]
      .reverse()
      .find((node) => node.id !== run.activeCursor.nodeId && timelineRewindNodeIds.has(node.id))
      ?.id,
  );
  let entries = $derived(timelineEntries(run, pack));
  let path = $derived(historyFrom(run, run.activeCursor.nodeId));
  let firings = $derived(shapeFiringEvidence(shapes, path));
  let shapeMarkers = $derived((assistance.guided === "live" ? firings : []).map((firing) => {
    const entry = shapes.find((candidate) => candidate.id === firing.entryId)!;
    return { nodeId: firing.firstNodeId, entryId: entry.id, label: entry.name, channel: entry.channel };
  }));
  let openShape = $derived(shapes.find((entry) => entry.id === openShapeId));
  let inspectedShape = $derived(shapes.find((entry) => entry.id === inspectedShapeId));
  let authoredSpineNodeIds = $derived(
    new Set(
      (authoredFeedback?.items ?? []).flatMap((item) =>
        "spineNodeId" in item.anchor ? [item.anchor.spineNodeId] : [],
      ),
    ),
  );
  let checkpointAuthoredItems = $derived(
    checkpoint === undefined
      ? []
      : selectCheckpointAuthoredItems(checkpoint.eventSeq, authoredFeedback, run),
  );
  let terminalAuthoredItems = $derived(
    terminalEvent?.type !== "outcome.reached"
      ? []
      : (authoredFeedback?.items ?? []).filter(
          (item) =>
            item.revealedBy.kind === "outcome" &&
            item.revealedBy.eventSeq === terminalEvent.seq,
        ),
  );
  let terminalEvidence = $derived(
    currentNode.evidenceRefs.map((reference) => renderEvidenceRef(reference, pack, runEvidencePayloads)),
  );
  let cards = $derived(branchCards(run));
  let timelineCards = $derived(timelineBranchCards(run));
  let collapsedIds = $derived(collapsedBranchIds(run, decidedness, new Set(compareIds), new Set(pinnedExpanded)));
  let groups = $derived(groupsFromEvents(run));
  let activeGroup = $derived(groups.find((group) => group.members.some((member) => member.branchId === run.activeCursor.branchId)));
  let groupOrdinals = $derived(Object.fromEntries(groups.flatMap((group, groupIndex) => group.members.map((member) => [member.branchId, groupIndex + 1]))));
  let banner = $derived(pack === undefined ? undefined : whyBanner(pack, run));
  let grading = $derived(pack === undefined ? undefined : projectedGrading(pack));
  let assessment = $derived(
    grading === undefined ? undefined : assessmentSummary(grading),
  );
  let assessmentDetail = $derived(grading === undefined ? undefined : assessmentSentence(grading));
  let resistance = $derived([
    ...resistanceSummary(run, currentNode.id, pack),
    ...(() => { const limit = humanModelMaterialLimit(currentNode.fen, run.opponentPolicy.mode); return limit === undefined ? [] : [limit]; })(),
  ]);
  let resistanceDetail = $derived([
    ...resistanceSentences(run, currentNode.id, pack),
    ...(() => { const limit = humanModelMaterialLimit(currentNode.fen, run.opponentPolicy.mode); return limit === undefined ? [] : [limit]; })(),
  ]);
  let checkpointResolution = $derived.by(() => {
    if (
      grading?.resolveAt.kind !== "checkpoint" ||
      checkpoint?.id !== grading.resolveAt.checkpointId
    ) return undefined;
    const node = run.nodes.find((candidate) => candidate.id === checkpoint.nodeId);
    return checkpointResolutionSentence(
      checkpoint.label,
      node?.objectiveState ?? currentNode.objectiveState,
    );
  });
  let startSide = $derived(pack === undefined ? run.start.side : packStartSide(pack));
  let displayedNode = $derived(
    previewNodeId === undefined
      ? currentNode
      : (run.nodes.find((node) => node.id === previewNodeId) ?? currentNode),
  );
  let corpusQueryNodeId = $derived((() => {
    const decision = displayedNode.actor === "user" ? displayedNode : [...path].reverse().find((node) => node.actor === "user");
    return decision?.parentId ?? displayedNode.id;
  })());
  $effect(() => {
    if (spokenAudio !== undefined && spokenAudio.nodeId !== displayedNode.id) {
      spokenAudio.audio.pause();
      URL.revokeObjectURL(spokenAudio.url);
      spokenAudio = undefined;
    }
  });
  let displayedMarkKey = $derived(markScope === "position" ? displayedNode.transposeKey : `${run.activeCursor.branchId}:${displayedNode.id}`);
  let displayedMarks = $derived(ownMarks.filter((mark) => mark.scope === markScope && mark.scopeKey === displayedMarkKey).map((mark) => ({ orig:mark.orig as import("@lichess-org/chessground/types").Key,...(mark.dest===undefined?{}:{dest:mark.dest as import("@lichess-org/chessground/types").Key}),brush:mark.brush })));
  let rawStructure = $derived(structuralReading(displayedNode.fen));
  let structure = $derived({ ...rawStructure, features: positionStructureEvidence(rawStructure) });
  let sightFeatures = $derived(selectedSquareSightEvidence(rawStructure));
  let transition = $derived.by(() => {
    if (displayedNode.parentId === null || displayedNode.moveUci === null) return null;
    const parent = run.nodes.find((node) => node.id === displayedNode.parentId);
    if (parent === undefined) return null;
    const reading = transitionReading(parent.fen, displayedNode.moveUci, displayedNode.fen);
    return reading === null ? null : { ...reading, observations: moveTransitionEvidence(reading) };
  });
  let detectedPhase = $derived(classifyPhase(displayedNode.fen));
  let endgame = $derived(endgameClassification(displayedNode.fen));
  // theory.endgame.setup_match@1: a technique is named only when a registered, cited setup convention's
  // full operand intersection holds, together with its convention id@version; otherwise the line stays
  // at the material class (rfc/evidence-value-authority.md §3.4).
  let endgameSentences = $derived(endgame === null ? [] : [...renderEndgameClassification(endgame), ...endgameSetupMatches(displayedNode.fen).map(renderEndgameSetupMatch)]);
  let activeAssistanceProfile = $derived(assistanceProfile({ sessionKind: run.sessionKind, feedbackPolicy: run.feedbackPolicy, liveKind: liveSessionKind }));
  let assistanceContext = $derived({ workflowContext: activeAssistanceProfile, deliveryOpen: feedbackDeliveryOpen(run), role: viewerRole, seatedInContest, reviewing });
  // rfc/module-registration.md §4.5 + rfc/intent-presets.md Checkpoint B: Post-commit Nudge renders only
  // when the server-compiled result carries its automatic post-commit effect (preset ∩ ceiling ∩ access,
  // with `markers` governing it) and the run's durable feedback-delivery boundary is open.
  let nudgeEffectActive = $derived(compiledAssistance?.effects.some((effect) => effect.effectId === "postcommit_nudge:post_commit:proactive") === true);
  let latestLearnerMoveId = $derived.by(() => {
    const target = currentNode.actor === "user" ? currentNode : run.nodes.find((node) => node.id === currentNode.parentId);
    return target?.actor === "user" && target.moveUci !== null ? target.id : undefined;
  });
  // Criterion 9: raising the preset mid-run is not a learner request. The move already on the board when
  // the nudge effect switches on is held back; the next committed move is the first one nudged.
  let nudgeHeldNodeId: string | undefined = $state();
  let nudgeWasActive: boolean | undefined;
  $effect(() => {
    const active = nudgeEffectActive;
    if (compiledAssistance === undefined) return;
    if (nudgeWasActive === false && active) nudgeHeldNodeId = untrack(() => latestLearnerMoveId);
    nudgeWasActive = active;
  });
  let nudgeNodeId = $derived.by(() => {
    if (onNudge === undefined || !nudgeEffectActive || !feedbackDeliveryOpen(run)) return undefined;
    return latestLearnerMoveId === nudgeHeldNodeId ? undefined : latestLearnerMoveId;
  });
  let nudge: PostcommitNudge | undefined = $state();
  let nudgeRequest = 0;
  $effect(() => {
    const nodeId = nudgeNodeId;
    const load = onNudge;
    if (nodeId === undefined || load === undefined) { nudge = undefined; return; }
    if (nudge?.nodeId === nodeId) return;
    const request = ++nudgeRequest;
    void load(nodeId).then((page) => { if (request === nudgeRequest) nudge = page; }).catch(() => { if (request === nudgeRequest) nudge = undefined; });
  });
  // rfc/hint-distance.md §5/§7: the Guided Hint seat is shown exactly when the server-compiled preset
  // carries `guided_hint` under a non-off ceiling. The ceiling is the D1639 table, marked proposed.
  let hintCeiling = $derived(compiledAssistance?.modules.includes("guided_hint") === true ? compiledAssistance.hintCeiling.rung : "off");
  let hintMarks: HintDeliveryMarks | undefined = $state();
  function hintAssistanceRequest(): RequestedAssistanceV1 | undefined {
    try { return compileAssistanceRequest({ contextHint: activeAssistanceProfile, preference }); } catch { return undefined; }
  }
  const hintKey = (square: string): DrawShape["orig"] => square as DrawShape["orig"];
  let hintOverlays: readonly DrawShape[] = $derived(hintMarks === undefined || hintMarks.rung === "pattern" || displayedNode.id !== run.activeCursor.nodeId ? [] : [
    ...hintMarks.squares.map((square) => ({ orig: hintKey(square), brush: "yellow" })),
    ...(hintMarks.rung === "square" ? [] : [{ orig: hintKey(hintMarks.piece.square), brush: "green" }]),
    ...(hintMarks.rung === "move" ? [{ orig: hintKey(hintMarks.arrow.from), dest: hintKey(hintMarks.arrow.to), brush: "green" }] : []),
  ]);
  let assistancePermission = $derived(permittedAssistance(assistanceContext));
  let contextPolicy = $derived(workflowContextPolicy(activeAssistanceProfile));
  let requestedPresetId = $derived(requestedPreset(preference, activeAssistanceProfile) ?? contextPolicy.defaultPreset);
  let requestedConfig = $derived(requestedAssistanceConfig(activeAssistanceProfile, preference));
  let requestedModuleSet = $derived(requestedModules(preference, requestedPresetId));
  let offeredPresets = $derived(contextPolicy.allowedPresets.map(presetDeclaration));
  let presetDisclosure = $derived(compiledAssistance === undefined ? undefined : compiledPresetDisclosure(compiledAssistance));
  let presetPillLabel = $derived(presetDisclosure?.pillLabel ?? requestedPresetLabel(activeAssistanceProfile, preference));
  let presetHeadline = $derived(presetDisclosure?.headline ?? (assistanceQueryState === "pending" ? "Confirming help for this run. Legal moves stay visible meanwhile." : "Help settings could not be confirmed, so only legal moves are shown."));
  let presetSentences = $derived(presetDisclosure?.sentences ?? []);
  let effectiveLighting = $derived(assistance.boardLighting === "evidence" && assistancePermission.boardLighting !== "evidence" ? "sight" : assistance.boardLighting);
  let selectedObservations = $derived(selectedSquare === undefined ? [] : sightFeatures.filter((item) => item.squares.some((square) => square === selectedSquare)));
  let boardOverlays = $derived([...((effectiveLighting === "sight" || effectiveLighting === "evidence") ? selectedObservations.flatMap((item) => item.squares.map((square) => ({ orig: square, brush: "blue" }))) : []), ...hintOverlays]);
  let overlayCaption = $derived(selectedObservations.map(renderStructuralObservation));
  let projectedPivotal = $derived(assistance.markers === "live" ? pivotalMarkerEvidence(run, run.activeCursor.branchId, assistanceContext) : []);
  let pivotalRows = $derived(projectedPivotal.map((marker) => ({ nodeId: marker.nodeId, label: storyMomentLabel(marker.kind) })));
  let openPivotal = $derived(openPivotalNodeId === undefined ? [] : projectedPivotal.filter((marker) => marker.nodeId === openPivotalNodeId));
  let openPivotalNode = $derived(openPivotalNodeId === undefined ? undefined : run.nodes.find((node) => node.id === openPivotalNodeId));
  function preferenceStorage(): PreferenceStorage | undefined {
    if (assistanceStorage !== undefined) return assistanceStorage;
    if (import.meta.env.MODE === "test") return undefined;
    try { return globalThis.localStorage ?? undefined; } catch { return undefined; }
  }

  /** Only the v2 key recompiles; a stale tab's legacy write cannot change the in-memory receipt. */
  function refreshAssistancePreference(event: StorageEvent): void {
    if (event.key === null || event.key === workflowPreferenceKey(activeAssistanceProfile)) {
      preference = loadWorkflowPreference(activeAssistanceProfile, preferenceStorage());
    }
  }

  async function recompileAssistance(): Promise<void> {
    const request = ++assistanceQuery;
    const context = activeAssistanceProfile;
    let requested: RequestedAssistanceV1;
    try {
      requested = compileAssistanceRequest({ contextHint: context, preference });
    } catch {
      compiledAssistance = undefined;
      assistanceQueryState = "unavailable";
      return;
    }
    if (onAssistanceQuery === undefined) {
      compiledAssistance = undefined;
      assistanceQueryState = "unavailable";
      return;
    }
    assistanceQueryState = "pending";
    try {
      const finalized = await onAssistanceQuery(requested);
      if (request !== assistanceQuery) return;
      if (finalized.requestedDigest !== requested.requestDigest || finalized.context !== context) throw new TypeError("Assistance response answers a different request");
      compiledAssistance = narrowBrowserChannels(finalized, browserChannelReceipt(request, speechAvailable ? { state: "available" } : { state: "unavailable", reason: "no_browser_voice" }));
      assistanceQueryState = "ready";
    } catch {
      if (request !== assistanceQuery) return;
      compiledAssistance = undefined;
      assistanceQueryState = "unavailable";
    }
  }

  function commitPreference(next: WorkflowPreferenceV2): void {
    preference = next.intent;
    preferenceUnsaved = !saveWorkflowPreference(activeAssistanceProfile, next, preferenceStorage());
  }

  function choosePreset(preset: PresetId): void {
    commitPreference(selectNamedPreset(activeAssistanceProfile, preference, preset));
    assistanceMenuOpen = false;
  }

  /** Advanced: every changed raw field becomes a sparse explicit override (criterion 18). */
  function setAssistanceConfig(value: AssistanceConfig): void {
    let receipt: WorkflowPreferenceReceipt = preference;
    let next: WorkflowPreferenceV2 | undefined;
    for (const field of ASSISTANCE_PREFERENCE_FIELDS) {
      if (value[field] === requestedConfig[field]) continue;
      next = setPreferenceField(activeAssistanceProfile, receipt, field, value[field]);
      receipt = next.intent;
    }
    if (next !== undefined) commitPreference(next);
  }

  function setAssistanceModule(moduleId: ConfigurableModuleId, enabled: boolean): void {
    commitPreference(setPreferenceModule(activeAssistanceProfile, preference, moduleId, enabled));
  }

  $effect(() => {
    if (assistance.markers === "off") {
      openPivotalNodeId = undefined;
      pivotalDialogOpen = false;
    }
  });

  async function requestHumanSplit(): Promise<void> {
    if (onHumanSplit === undefined) return;
    const nodeId = displayedNode.id;
    const request = ++humanSplitRequest;
    humanSplitBusyNodeId = nodeId;
    humanSplitError = undefined;
    if (humanSplit?.nodeId === nodeId) humanSplit = undefined;
    try {
      const page = await onHumanSplit(nodeId);
      if (request !== humanSplitRequest || displayedNode.id !== nodeId) return;
      if (page.nodeId !== nodeId) {
        humanSplitError = { nodeId, text: "Those move choices no longer match this position. Load them again." };
        return;
      }
      humanSplit = humanSplitEvidence(page);
    } catch {
      if (request === humanSplitRequest && displayedNode.id === nodeId) {
        humanSplitError = { nodeId, text: "Human move choices are unavailable right now. Try again." };
      }
    } finally {
      if (request === humanSplitRequest) humanSplitBusyNodeId = undefined;
    }
  }

  async function requestCorpus(): Promise<void> {
    if (onCorpus === undefined) return;
    const nodeId = corpusQueryNodeId;
    const request = ++corpusRequest;
    corpusBusyNodeId = nodeId;
    corpusError = undefined;
    if (corpusPage?.nodeId === nodeId) corpusPage = undefined;
    try {
      const page = await onCorpus(nodeId);
      if (request !== corpusRequest || corpusQueryNodeId !== nodeId) return;
      if (page.nodeId !== nodeId) {
        corpusError = { nodeId, text: "Those game counts no longer match this position. Load them again." };
        return;
      }
      corpusPage = corpusEvidence(page);
    } catch {
      if (request === corpusRequest && corpusQueryNodeId === nodeId) {
        corpusError = { nodeId, text: "Human game counts are unavailable right now. Try again." };
      }
    } finally {
      if (request === corpusRequest) corpusBusyNodeId = undefined;
    }
  }

  function humanCandidateSentence(page: HumanSplitPage, candidate: HumanSplitPage["candidates"][number]): string {
    const fen = run.nodes.find((node) => node.id === page.nodeId)?.fen;
    const move = fen === undefined ? undefined : moveSanFromUci(fen, candidate.moveUci);
    const mass = candidate.mass === undefined ? "frequency unavailable" : `${Math.round(candidate.mass * 100)}%`;
    return `${move ?? "Move notation unavailable"} ${mass}`;
  }

  function humanCandidateSentences(page: HumanSplitPage): readonly string[] {
    return page.candidates
      .filter((candidate) => candidate.offWindow !== true)
      .map((candidate) => humanCandidateSentence(page, candidate));
  }

  async function requestVoice(scope: VoicePage["scope"]): Promise<void> {
    if (onVoice === undefined) return;
    const nodeId = scope === "marker" ? openPivotalNodeId : displayedNode.id;
    if (nodeId === undefined) return;
    const request = ++voiceRequest;
    voicePage = undefined;
    voiceNodeId = undefined;
    voiceBusy = { nodeId, scope };
    voiceError = undefined;
    try {
      const page = await onVoice(nodeId, scope);
      const currentNodeId = scope === "marker" ? openPivotalNodeId : displayedNode.id;
      if (request !== voiceRequest || currentNodeId !== nodeId) return;
      if (page.scope !== scope) {
        voiceError = { nodeId, scope, text: "That explanation no longer matches this view. Try again." };
        return;
      }
      voicePage = page;
      voiceNodeId = nodeId;
    } catch {
      const currentNodeId = scope === "marker" ? openPivotalNodeId : displayedNode.id;
      if (request === voiceRequest && currentNodeId === nodeId) {
        voiceError = { nodeId, scope, text: "This explanation is unavailable right now. Try again." };
      }
    } finally {
      if (request === voiceRequest) voiceBusy = undefined;
    }
  }

  async function speakSentences(sentences: readonly string[], scope: VoicePage["scope"] = "reading"): Promise<void> {
    if (sentences.length === 0 || assistance.spoken === "off") return;
    if (assistance.spoken === "provider" && onSpeech !== undefined) {
      const nodeId = displayedNode.id;
      const request = ++speechRequest;
      speechBusyNodeId = nodeId;
      speechError = undefined;
      if (spokenAudio !== undefined) {
        spokenAudio.audio.pause();
        URL.revokeObjectURL(spokenAudio.url);
        spokenAudio = undefined;
      }
      try {
        const blob = await onSpeech(nodeId, scope);
        if (request !== speechRequest || displayedNode.id !== nodeId) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        spokenAudio = { nodeId, audio, url };
        audio.addEventListener("ended", () => {
          URL.revokeObjectURL(url);
          if (spokenAudio?.audio === audio) spokenAudio = undefined;
        }, { once: true });
        try {
          await audio.play();
        } catch {
          URL.revokeObjectURL(url);
          if (spokenAudio?.audio === audio) spokenAudio = undefined;
          throw new Error("speech playback failed");
        }
      } catch {
        if (request === speechRequest && displayedNode.id === nodeId) {
          speechError = { nodeId, text: "Spoken guidance is unavailable right now. Try again." };
        }
      } finally {
        if (request === speechRequest) speechBusyNodeId = undefined;
      }
      return;
    }
    if (assistance.spoken !== "browser" || !speechAvailable) return;
    try {
      globalThis.speechSynthesis.cancel();
      globalThis.speechSynthesis.speak(new SpeechSynthesisUtterance(sentences.join(" ")));
    } catch {
      speechError = { nodeId: displayedNode.id, text: "Spoken guidance is unavailable right now. Try again." };
    }
  }

  function openPivotalMarker(nodeId: string): void {
    openPivotalNodeId = nodeId; humanSplit = undefined; voicePage = undefined; voiceNodeId = undefined; voiceError = undefined; voiceRequest += 1; voiceBusy = undefined;
    pivotalDialogOpen = true;
  }

  function groupPreference(groupId: string): "sequential" | "lockstep" {
    return groupModes[groupId] ?? "sequential";
  }

  function setGroupPreference(groupId: string, mode: "sequential" | "lockstep"): void {
    groupModes = { ...groupModes, [groupId]: mode };
    try { globalThis.localStorage?.setItem(`tabiya:branch-group:v1:${groupId}`, mode); } catch { /* Local preference only. */ }
  }

  function captureGroupMove(uci: string): void {
    if (groupBusy || groupCandidates.includes(uci)) return;
    if (groupCandidates.length < 8) groupCandidates = [...groupCandidates, uci];
  }

  async function boardMove(uci: string): Promise<boolean> {
    selectedSquare = undefined;
    if (groupOpen && groupSource === "hand_picked") {
      captureGroupMove(uci);
      return false;
    }
    const before = activeGroup;
    const beforeIndex = before?.members.findIndex((member) => member.branchId === run.activeCursor.branchId) ?? -1;
    const committed = await onMove(uci);
    if (committed === false) return false;
    await tick();
    if (before === undefined || groupPreference(before.groupId) !== "lockstep" || checkpoint !== undefined) return true;
    const next = before.members[(beforeIndex + 1) % before.members.length];
    if (next === undefined || next.branchId === run.activeCursor.branchId) return true;
    await switchRunBranch(branchPath(run, next.branchId).at(-1)!.id, next.branchId);
    return true;
  }

  async function createGroup(): Promise<void> {
    if (!canWrite || onCreateGroup === undefined || groupBusy || groupOpenContext === undefined) return;
    const context = groupOpenContext;
    const request = ++groupRequest;
    const input: CreateGroupRequest = {
      source: groupSource,
      resistance: groupResistance,
      ...(groupSource === "hand_picked" ? { candidates: groupCandidates } : { size: groupSize }),
    };
    groupBusy = true;
    groupError = undefined;
    try {
      const result = await onCreateGroup(input);
      if (request !== groupRequest) return;
      if (result === undefined) {
        groupError = "The branch group was not created. Your choices are still here; try again.";
        return;
      }
      if (result.run.id !== context.runId || result.group.sourceNodeId !== context.nodeId) {
        groupOutcomeUncertain = true;
        groupError = "The response did not match this run and position. Close this form and reopen the run before trying again.";
        return;
      }
      closeGroupCreator();
      compactTab = "branches";
      sheetOpen = !compactViewport;
    } catch {
      if (request === groupRequest && context === groupOpenContext) {
        groupError = "The branch group was not created. Your choices are still here; try again.";
      }
    } finally {
      if (request === groupRequest) groupBusy = false;
    }
  }

  async function nextGroupMember(group: BranchGroup): Promise<void> {
    const current = group.members.findIndex((member) => member.branchId === run.activeCursor.branchId);
    const next = group.members[(current + 1) % group.members.length];
    if (next !== undefined) await switchRunBranch(branchPath(run, next.branchId).at(-1)!.id, next.branchId);
  }
  function editingTarget(event: KeyboardEvent): boolean {
    return event.composedPath().some((target) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable),
    );
  }

  function boardInputTarget(event: KeyboardEvent): boolean {
    return event.composedPath().some((target) => target instanceof HTMLElement && target.dataset.boardInputGrid !== undefined);
  }

  function nativeSpaceTarget(event: KeyboardEvent): boolean {
    return event.composedPath().some((target) =>
      target instanceof HTMLButtonElement ||
      target instanceof HTMLAnchorElement ||
      (target instanceof HTMLElement && target.tagName === "SUMMARY"),
    );
  }

  function selectedCompareIds(): readonly string[] | undefined {
    if (compareIds.length >= 2) return compareIds;
    const active = run.activeCursor.branchId;
    const other = cards.find((card) => card.id !== active)?.id;
    return other === undefined ? undefined : [active, other];
  }

  function invoker(event: Event): HTMLElement | undefined {
    return event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined;
  }

  function keyboardInvoker(event: KeyboardEvent): HTMLElement | undefined {
    return event.target instanceof HTMLElement ? event.target : mainElement;
  }

  function restoreFocus(target: HTMLElement | undefined): void {
    void tick().then(() => (target?.isConnected ? target : mainElement)?.focus());
  }

  function showShape(entryId: string): void {
    shapeInvoker = document.activeElement instanceof HTMLElement ? document.activeElement : mainElement;
    inspectedShapeId = entryId;
    openShapeId = entryId;
  }

  function closeShape(): void {
    openShapeId = undefined;
    restoreFocus(shapeInvoker);
    shapeInvoker = undefined;
  }

  async function openCompare(requestedIds?: readonly string[]): Promise<void> {
    if (compareBusy) return;
    const ids = requestedIds ?? selectedCompareIds();
    if (ids === undefined) return;
    const population = branchClassificationIdentity();
    const request = ++compareRequest;
    compareBusy = true;
    compareError = undefined;
    try {
      const accepted = await onCompare(ids);
      if (accepted === false && request === compareRequest) {
        compareError = population === branchClassificationIdentity()
          ? "The comparison did not open. Your branches are unchanged, so you can try again."
          : "The branches changed before comparison was ready. Review them and try again.";
      }
    } catch {
      if (request === compareRequest) compareError = "The comparison did not open. Your branches are unchanged, so you can try again.";
    } finally {
      if (request === compareRequest) compareBusy = false;
    }
  }

  function closeCompare(): void {
    onCloseCompare();
    restoreFocus(compareInvoker);
  }

  function closeHelp(): void {
    helpOpen = false;
    restoreFocus(helpInvoker);
  }

  function closeFork(): void {
    forkRequest += 1;
    forkBusy = false;
    forkError = undefined;
    forkOpen = false;
    restoreFocus(forkInvoker);
  }

  function closeCheckpointPicker(): void {
    checkpointPickerOpen = false;
    restoreFocus(checkpointPickerInvoker);
  }

  function toggleCompare(branchId: string): void {
    if (compareIds.includes(branchId)) {
      compareIds = compareIds.filter((id) => id !== branchId);
    } else {
      if (compareIds.length < MAX_COMPARISON_BRANCHES) compareIds = [...compareIds, branchId];
      pinnedExpanded = [...new Set([...pinnedExpanded, branchId])];
    }
  }

  function compareAllHere(forkNodeId: string): void {
    const eligible = cards.filter((card) => card.forkNodeId === forkNodeId || card.id === run.activeCursor.branchId);
    const ordered = [...eligible].sort((left, right) => left.id === run.activeCursor.branchId ? -1 : right.id === run.activeCursor.branchId ? 1 : collapsedIds.has(left.id) === collapsedIds.has(right.id) ? 0 : collapsedIds.has(left.id) ? 1 : -1);
    compareIds = ordered.slice(0, MAX_COMPARISON_BRANCHES).map((card) => card.id);
    compareLimitNotice = eligible.length > MAX_COMPARISON_BRANCHES ? `${eligible.length} branches fork here. Comparison renders at most eight columns; the first eight in rail order are selected.` : undefined;
    pinnedExpanded = [...new Set([...pinnedExpanded, ...compareIds])];
  }

  function persistFolded(next: readonly string[]): void {
    foldedBranchIds = [...next];
    try { globalThis.localStorage?.setItem(`tabiya:branch-fold:v1:${run.id}`, JSON.stringify(foldedBranchIds)); } catch { /* Local view preference only. */ }
  }

  function foldBranch(branchId: string): void { persistFolded([...new Set([...foldedBranchIds, branchId])]); }
  function restoreBranch(branchId: string): void {
    persistFolded(foldedBranchIds.filter((id) => id !== branchId));
    pinnedExpanded = [...new Set([...pinnedExpanded, branchId])];
  }

  function branchClassificationIdentity(): string {
    return `${run.id}:${cards.map((card) => `${card.id}:${card.leafNodeId}`).join("|")}`;
  }

  async function classifyRemaining(): Promise<void> {
    if (onClassifyBranches === undefined || classificationBusy) return;
    const ids = cards.filter((card) => decidedness[card.id]?.state !== "decided").slice(0, MAX_COMPARISON_BRANCHES).map((card) => card.id);
    if (ids.length === 0) return;
    const population = branchClassificationIdentity();
    const request = ++classificationRequest;
    classificationBusy = true;
    classificationError = undefined;
    try {
      const result = await onClassifyBranches(ids);
      if (request !== classificationRequest) return;
      if (population !== branchClassificationIdentity()) {
        classificationError = "The branches changed while they were being checked. Classify them again.";
        return;
      }
      const requested = new Set(ids);
      const admitted = Object.fromEntries(Object.entries(result).filter(([id]) => requested.has(id)));
      decidedness = Object.freeze({ ...decidedness, ...admitted });
    } catch {
      if (request === classificationRequest) {
        classificationError = "Branch status is unavailable right now. Try again.";
      }
    } finally {
      if (request === classificationRequest) classificationBusy = false;
    }
  }
  async function switchVisibleBranch(nodeId: string, branchId: string): Promise<boolean> {
    pinnedExpanded = [...new Set([...pinnedExpanded, branchId])];
    return switchRunBranch(nodeId, branchId);
  }

  function preview(nodeId: string): void {
    selectedSquare = undefined;
    previewNodeId = previewNodeId === nodeId ? undefined : nodeId;
  }

  function rewindTargetKey(target: RewindTarget): string {
    return "nodeId" in target
      ? `node:${target.nodeId}:${target.branchId ?? "active"}`
      : `checkpoint:${target.checkpointId}`;
  }

  function rewindErrorFor(target: RewindTarget | undefined): string | undefined {
    if (target === undefined || rewindFailure?.targetKey !== rewindTargetKey(target)) return undefined;
    return rewindFailure.text;
  }

  async function rewindRun(target: RewindTarget): Promise<boolean> {
    if (rewindBusy) return false;
    const request = ++rewindRequest;
    const targetKey = rewindTargetKey(target);
    rewindBusy = true;
    rewindFailure = undefined;
    selectedSquare = undefined;
    try {
      const accepted = await onRewind(target);
      if (accepted === false) {
        if (request === rewindRequest) rewindFailure = { targetKey, text: "The rewind did not finish. Your current attempt and target are unchanged, so you can try again." };
        return false;
      }
      return true;
    } catch {
      if (request === rewindRequest) rewindFailure = { targetKey, text: "The rewind did not finish. Your current attempt and target are unchanged, so you can try again." };
      return false;
    } finally {
      if (request === rewindRequest) rewindBusy = false;
    }
  }

  function focusBoardFromSupport(): void {
    mainElement?.querySelector<HTMLElement>("[data-board-input-grid]")?.focus();
  }

  async function switchRunBranch(nodeId: string, branchId: string): Promise<boolean> {
    if (branchSwitchBusy !== undefined) return false;
    const label = cards.find((card) => card.id === branchId)?.label ?? "selected branch";
    const request = ++branchSwitchRequest;
    branchSwitchBusy = { branchId, label };
    branchSwitchError = undefined;
    selectedSquare = undefined;
    try {
      const accepted = await onSwitchBranch(nodeId, branchId);
      if (request !== branchSwitchRequest) return false;
      if (accepted === false) {
        branchSwitchError = run.activeCursor.branchId === branchId
          ? `${label} opened, but its next reply did not finish. Try opening this branch again.`
          : `${label} did not open. Your current branch is unchanged; try again.`;
        return false;
      }
      return true;
    } catch {
      if (request === branchSwitchRequest) {
        branchSwitchError = `${label} did not open. Your current branch is unchanged; try again.`;
      }
      return false;
    } finally {
      if (request === branchSwitchRequest) branchSwitchBusy = undefined;
    }
  }

  async function confirmPreview(nodeId = previewNodeId): Promise<void> {
    if (!canWrite || nodeId === undefined) return;
    if (await rewindRun({ nodeId })) previewNodeId = undefined;
  }

  async function rewindFirstRehearsal(): Promise<void> {
    if (!canWrite || guide?.rewindNodeId === undefined) return;
    await rewindRun({ nodeId: guide.rewindNodeId });
  }

  async function compareFirstRehearsal(): Promise<void> {
    if (guide?.compareBranchIds === undefined || guide.compareBranchIds.length < 2) return;
    await onCompare(guide.compareBranchIds);
    onFirstRehearsalComplete?.();
  }

  function stepTimeline(delta: number): void {
    if (comparison !== undefined) {
      compareStep = Math.max(
        0,
        Math.min(comparison.rows.length, compareStep + delta),
      );
      return;
    }
    if (entries.length === 0) return;
    const currentId = previewNodeId ?? run.activeCursor.nodeId;
    const currentIndex = entries.findIndex((entry) => entry.nodeId === currentId);
    const nextIndex = Math.max(
      0,
      Math.min(entries.length - 1, (currentIndex < 0 ? entries.length : currentIndex) + delta),
    );
    previewNodeId = entries[nextIndex]!.nodeId;
  }

  function focusTimelinePreview(): void {
    const nodeId = previewNodeId;
    if (nodeId === undefined) return;
    void tick().then(() => {
      const target = [...document.querySelectorAll<HTMLElement>("[data-timeline-node]")]
        .find((element) => element.dataset.timelineNode === nodeId);
      target?.focus();
    });
  }

  function toggleReplay(): void {
    replaying = !replaying;
    if (!replaying) {
      if (replayTimer !== undefined) clearInterval(replayTimer);
      replayTimer = undefined;
      return;
    }
    previewNodeId = entries[0]?.nodeId;
    replayTimer = setInterval(() => {
      const index = entries.findIndex((entry) => entry.nodeId === previewNodeId);
      if (index < 0 || index >= entries.length - 1) {
        replaying = false;
        if (replayTimer !== undefined) clearInterval(replayTimer);
        replayTimer = undefined;
      } else {
        previewNodeId = entries[index + 1]!.nodeId;
      }
    }, 700);
  }

  function latestCheckpointId(): string | undefined {
    const path = new Set(entries.map((entry) => entry.nodeId));
    const event = [...run.events]
      .reverse()
      .find(
        (candidate) =>
          candidate.type === "checkpoint.reached" &&
          (candidate.data.nodeId !== run.activeCursor.nodeId ||
            (run.nodes.find((node) => node.id === candidate.data.nodeId)?.parentId === null &&
              pack?.checkpoints.some((checkpoint) =>
                checkpoint.id === candidate.data.checkpointId &&
                !("windowOpens" in checkpoint.trigger) &&
                "atStart" in checkpoint.trigger,
              ))) &&
          path.has(candidate.data.nodeId),
      );
    return event?.type === "checkpoint.reached" ? event.data.checkpointId : undefined;
  }

  async function submitFork(): Promise<void> {
    if (!canWrite || forkBusy) return;
    const request = ++forkRequest;
    forkBusy = true;
    forkError = undefined;
    try {
      const created = await onFork(forkLabel, forkIntent);
      if (request !== forkRequest) return;
      if (created === false) {
        forkError = "The branch was not created. Your name and intent are still here; try again.";
        return;
      }
      forkOpen = false;
      forkLabel = "";
      forkIntent = "";
      compactTab = "branches";
      sheetOpen = !compactViewport;
      restoreFocus(compactViewport ? mainElement : forkInvoker);
      forkInvoker = undefined;
    } catch {
      if (request === forkRequest) {
        forkError = "The branch was not created. Your name and intent are still here; try again.";
      }
    } finally {
      if (request === forkRequest) forkBusy = false;
    }
  }

  async function continueFromCheckpoint(): Promise<void> {
    if (checkpointContinueBusy || checkpoint === undefined) return;
    const checkpointEventSeq = checkpoint.eventSeq;
    const request = ++checkpointContinueRequest;
    checkpointContinueBusy = true;
    checkpointContinueError = undefined;
    try {
      const continued = await onContinueCheckpoint();
      if (request !== checkpointContinueRequest) return;
      if (continued === false) {
        checkpointContinueError = { eventSeq: checkpointEventSeq, text: "This checkpoint did not continue. Your position is unchanged; try again." };
        return;
      }
      await tick();
      mainElement?.focus();
    } catch {
      if (request === checkpointContinueRequest) {
        checkpointContinueError = { eventSeq: checkpointEventSeq, text: "This checkpoint did not continue. Your position is unchanged; try again." };
      }
    } finally {
      if (request === checkpointContinueRequest) checkpointContinueBusy = false;
    }
  }

  function keyboard(event: KeyboardEvent): boolean {
    if (event.key === "?" || (event.key === "/" && event.shiftKey)) {
      event.preventDefault();
      if (helpOpen) closeHelp();
      else {
        helpInvoker = keyboardInvoker(event);
        helpOpen = true;
      }
      return true;
    }
    if (event.key === "Escape") {
      if (helpOpen) closeHelp();
      else if (forkOpen) closeFork();
      else if (groupOpen) closeGroupCreator();
      else if (checkpointPickerOpen) closeCheckpointPicker();
      else if (comparison !== undefined) closeCompare();
      else if (phoneSheetModal) closeCompanion();
      else if (checkpoint !== undefined) return false;
      else restoreFocus(mainElement);
      event.preventDefault();
      return true;
    }
    if (
      editingTarget(event) ||
      boardInputTarget(event) ||
      helpOpen ||
      forkOpen ||
      checkpointPickerOpen ||
      checkpoint !== undefined
    ) {
      return false;
    }
    if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      if (!canWrite) return true;
      if (event.shiftKey) {
        checkpointPickerInvoker = keyboardInvoker(event);
        checkpointPickerOpen = true;
        void tick().then(() => pickerHeading?.focus());
      }
      else {
        const checkpointId = latestCheckpointId();
        if (checkpointId !== undefined) void rewindRun({ checkpointId });
      }
      return true;
    } else if (event.key.toLowerCase() === "b") {
      event.preventDefault();
      if (!canWrite) return true;
      forkInvoker = keyboardInvoker(event);
      forkError = undefined;
      forkOpen = true;
      void tick().then(() => forkIntentInput?.focus());
      return true;
    } else if (/^[1-9]$/.test(event.key)) {
      const branch = cards[Number(event.key) - 1];
      if (branch !== undefined) {
        event.preventDefault();
        void switchRunBranch(branch.leafNodeId, branch.id);
        return true;
      }
    } else if (
      event.altKey &&
      event.code === "KeyC"
    ) {
      event.preventDefault();
      if (comparison === undefined) {
        compareInvoker = keyboardInvoker(event);
        openCompare();
      }
      else closeCompare();
      return true;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const fromTimeline = event.composedPath().some((target) => target instanceof HTMLElement && target.closest(".timeline") !== null);
      event.preventDefault();
      stepTimeline(event.key === "ArrowLeft" ? -1 : 1);
      if (fromTimeline) focusTimelinePreview();
      return true;
    } else if (event.key === " ") {
      if (nativeSpaceTarget(event)) return false;
      event.preventDefault();
      toggleReplay();
      return true;
    } else if (event.key.toLowerCase() === "e") {
      event.preventDefault();
      void onExport(comparisonBranchIds ?? (compareIds.length > 0 ? compareIds : undefined));
      return true;
    } else if (event.key === "Enter" && previewNodeId !== undefined) {
      event.preventDefault();
      if (!canWrite) return true;
      void confirmPreview();
      return true;
    }
    return false;
  }

  onMount(() => {
    measureViewport();
    globalThis.addEventListener("resize", measureViewport);
    globalThis.addEventListener("storage", refreshAssistancePreference);
    speechAvailable = typeof globalThis.speechSynthesis !== "undefined" && typeof globalThis.SpeechSynthesisUtterance !== "undefined" && globalThis.speechSynthesis.getVoices().length > 0;
    try { const saved=globalThis.localStorage?.getItem(`tabiya:mark-scope:${run.id}`);if(saved==="branch")markScope="branch"; } catch { /* local preference only */ }
    try {
      const stored = JSON.parse(globalThis.localStorage?.getItem(`tabiya:branch-fold:v1:${run.id}`) ?? "[]");
      if (Array.isArray(stored) && stored.every((value) => typeof value === "string")) foldedBranchIds = stored;
    } catch { foldedBranchIds = []; }
    if (regionElement === undefined) {
      throw new Error("Drill keyboard region did not mount");
    }
    unregisterKeyboard = registerKeyboardRegion(regionElement, keyboard);
    if (checkpoint === undefined) {
      mainElement?.focus();
    }
  });
  onDestroy(() => {
    globalThis.removeEventListener("resize", measureViewport);
    globalThis.removeEventListener("storage", refreshAssistancePreference);
    unregisterKeyboard?.();
    if (replayTimer !== undefined) clearInterval(replayTimer);
    if (markTimer !== undefined) clearTimeout(markTimer);
    markRequest += 1;
    groupRequest += 1;
    forkRequest += 1;
    checkpointContinueRequest += 1;
    simulationRequest += 1;
    compareRequest += 1;
    rewindRequest += 1;
    branchSwitchRequest += 1;
    analysisRequest += 1;
    groupAnalysisRequest += 1;
    if (spokenAudio !== undefined) {
      spokenAudio.audio.pause();
      URL.revokeObjectURL(spokenAudio.url);
    }
  });

  let loadedAssistanceProfile: AssistanceProfile | undefined;
  $effect(() => {
    if (loadedAssistanceProfile === activeAssistanceProfile) return;
    loadedAssistanceProfile = activeAssistanceProfile;
    preference = loadWorkflowPreference(activeAssistanceProfile, preferenceStorage());
  });

  // The server re-derives access; re-query whenever an access input or the receipt changes.
  let assistanceAccessKey = $derived(`${run.id}|${activeAssistanceProfile}|${feedbackDeliveryOpen(run)}|${viewerRole}|${seatedInContest}|${reviewing}|${JSON.stringify(preference)}`);
  let queriedAccessKey: string | undefined;
  $effect(() => {
    const key = assistanceAccessKey;
    if (key === queriedAccessKey) return;
    queriedAccessKey = key;
    void recompileAssistance();
  });

  $effect(() => {
    if (boardActiveRunId !== run.id) {
      boardActiveRunId = run.id;
      boardActiveSquare = undefined;
      boardMoveAnnouncement = undefined;
      boardFocusRequested = false;
    }
  });

  $effect(() => {
    const population = branchClassificationIdentity();
    if (classificationPopulation === population) return;
    classificationPopulation = population;
    classificationRequest += 1;
    classificationBusy = false;
    classificationError = undefined;
    decidedness = Object.freeze({});
  });

  $effect(() => {
    if (loadedMarksRunId === run.id) return;
    loadedMarksRunId = run.id;
    if (markTimer !== undefined) {
      clearTimeout(markTimer);
      markTimer = undefined;
    }
    markRequest += 1;
    ownMarks = [];
    markBusy = undefined;
    markError = undefined;
    failedMarkOperation = undefined;
    void loadMarks();
  });

  $effect(() => {
    if (firstRehearsal && guideOpenedForRunId !== run.id) {
      guideOpenedForRunId = run.id;
      compactTab = "evidence";
      sheetOpen = true;
    }
  });

  $effect(() => {
    if (guardEvent?.type !== "feedback.generated") return;
    compactTab = "evidence";
    sheetOpen = true;
  });

  $effect(() => {
    if (!phoneSheetModal) return;
    void tick().then(() => {
      if (companionElement !== undefined && !companionElement.contains(document.activeElement)) companionElement.focus();
    });
  });

  $effect(() => {
    comparison;
    compareStep = 0;
  });

  $effect(() => {
    for (const group of groups) {
      if (groupModes[group.groupId] !== undefined) continue;
      let mode: "sequential" | "lockstep" = "sequential";
      try { if (globalThis.localStorage?.getItem(`tabiya:branch-group:v1:${group.groupId}`) === "lockstep") mode = "lockstep"; } catch { /* Default remains sequential. */ }
      groupModes = { ...groupModes, [group.groupId]: mode };
    }
  });
</script>

<svelte:window onkeydowncapture={groupPaletteKeydown} />

<div class="drill-region" class:reflow={reflowViewport} data-keyboard-region="drill" tabindex="-1" bind:this={regionElement}>

{#if !viewportSupport.supported}
  <section class="viewport-refusal" role="alert" aria-labelledby="viewport-refusal-title">
    <p>More room needed</p>
    <h1 id="viewport-refusal-title">This screen is too small for a playable board.</h1>
    <p>{viewportSupport.reason}</p>
    <button type="button" onclick={onStop}>Return to Play</button>
  </section>
{:else if comparison}
  <CompareView
    {run}
    {pack}
    {comparison}
    {startSide}
    step={compareStep}
    onStep={(step) => (compareStep = step)}
    onClose={closeCompare}
    onReplayResistance={onReplayResistance === undefined || comparisonForkNode === undefined ? undefined : (targetElo) => onReplayResistance({ fen: comparisonForkNode!.fen, side: startSide, targetElo })}
    onVoice={onCompareVoice === undefined ? undefined : async () => (await onCompareVoice()).text}
  />
{:else}
  <main class="drill" class:compact={compactViewport} class:reflow={reflowViewport} tabindex="-1" bind:this={mainElement} aria-labelledby="drill-title" style={`--board-edge: ${boardEdge}px`}>
    <header class="topbar">
      <button class="wordmark" type="button" onclick={onStop}>Tabiya</button>
      <StatusAnnouncement message={`${pack?.title ?? "Just Play"}. ${runOpponentStatus(run.opponentPolicy)}. ${run.opponentPolicy.mode === "human_common" && run.opponentPolicy.profile === undefined ? HUMAN_MODEL_RUNG_DISCLAIMER : ""}${botReplyNote === undefined ? "" : ` ${botReplyNote}.`} ${consequenceHorizon(pack)}. ${snapshot.access === "read_only" ? "Watching" : busy ? "Updating" : "Your move"}${authoredFeedback?.hasWithheldAuthoredContent ? ". Commentary opens at a checkpoint" : ""}`} />
      <div class="status visually-hidden-on-phone" aria-hidden="true">
        <span class="run-name">{pack?.title ?? "Just Play"}</span>
        <span>{runOpponentStatus(run.opponentPolicy)}</span>
        {#if botReplyNote !== undefined}<span class="bot-reply-note">{botReplyNote}</span>{/if}
        <span>{consequenceHorizon(pack)}</span>
        <span class:readonly={snapshot.access === "read_only"}>
          {snapshot.access === "read_only" ? "Watching" : busy ? "Updating…" : "Your move"}
        </span>
        {#if authoredFeedback?.hasWithheldAuthoredContent}
          <span>Commentary opens at a checkpoint</span>
        {/if}
      </div>
      <div class="topbar-actions">
        {#if run.opponentPolicy.profile !== undefined && onRematch !== undefined && snapshot.access !== "read_only"}<button class="rematch" type="button" onclick={() => void onRematch()}>Play this bot again</button>{/if}
        {#if assistance.ambient === "on"}<button class="ambient" type="button" aria-label="Open assistance" aria-controls="run-support-region" title={busy ? "Thinking…" : snapshot.withheld ? "Waiting for disclosure" : guardEvent ? "A consequence is ready" : "Present"} onclick={openAssistance}>♟</button>{/if}
        <details class="assistance-control" bind:open={assistanceMenuOpen}>
          <summary aria-label={`Support style: ${presetPillLabel}`}><span class="preset-pill" data-preset-mode={compiledAssistance?.displayMode ?? "pending"}>{presetPillLabel}</span></summary>
          <div class="support-menu">
            <p class="preset-menu-promise">{presetHeadline}</p>
            <fieldset class="preset-options">
              <legend>Help style</legend>
              {#each offeredPresets as option (option.id)}
                <label class="preset-option"><input type="radio" name={`help-style-${run.id}`} value={option.id} checked={compiledAssistance?.displayMode !== "custom" && preference.kind !== "migrated_snapshot" && requestedPresetId === option.id} onchange={() => choosePreset(option.id)} /><span><strong>{option.label}</strong><small>{option.promise}</small></span></label>
              {/each}
            </fieldset>
            {#if compiledAssistance?.displayMode === "custom"}<p class="honest">Custom help is active. Choosing a style above replaces it; Advanced support controls keep it.</p>{/if}
            {#if preferenceUnsaved}<p class="honest">This browser is not saving help settings, so this choice lasts only until you leave.</p>{/if}
            <p>Open the help available in this workflow. This does not reveal a move. Temporary position help must be opened explicitly and closes after your next move.</p>
            <button type="button" onclick={(event) => { assistanceMenuOpen = false; openAssistance(event); }}>Open support</button>
            <button type="button" onclick={openAdvancedSupport}>Advanced support controls</button>
          </div>
        </details>
        <button class="inspector-entry" type="button" aria-haspopup="dialog" onclick={() => (inspectorOpen = true)}>Inspector</button>
        <button class="help" type="button" aria-label="Keyboard shortcuts" onclick={(event) => { helpInvoker = invoker(event); helpOpen = true; }}>?</button>
      </div>
    </header>

    {#if error && branchSwitchError === undefined}<p class="error" role="alert">{error}{#if run.opponentPolicy.profile !== undefined && onRetryOpponent !== undefined && snapshot.access !== "read_only"} <button class="retry-opponent" type="button" onclick={() => void onRetryOpponent()}>Ask the bot again</button>{/if}</p>{/if}
    {#if branchSwitchBusy}<p id="branch-switch-status" class="operation-status" role="status">Opening {branchSwitchBusy.label}. Other branch navigation waits until it finishes.</p>{/if}
    {#if branchSwitchError}<p class="error" role="alert">{branchSwitchError}</p>{/if}
    {#if snapshot.access === "read_only"}
      <p class="readonly-banner" role="status">
        {snapshot.withheld ? "The latest moves are still arriving. Help will appear only when this run reaches a reveal point." : "This run is open on another browser. You can follow along, but moves and rewinds happen there."}
      </p>
    {/if}

    <div class="workspace" class:evidence-active={compactTab === "evidence"}>
      <section class="position-column" class:outcome={grading !== undefined || pack?.objective.type === "follow_theory"}>
        <div class="board-slot">
          <div class="board-frame" class:previewing={previewNodeId !== undefined} class:checkpoint-paused={checkpoint !== undefined}>
            {#if previewNodeId}<span class="preview-label">Preview</span>{/if}
              <Chessboard
                fen={displayedNode.fen}
                startSide={boardSide ?? startSide}
                lastMove={displayedNode.moveUci}
                disabled={busy || snapshot.access === "read_only" || previewNodeId !== undefined || terminalEvent !== undefined || checkpoint !== undefined}
                showDests={effectiveLighting !== "off"}
                highlightMoves={effectiveLighting !== "off"}
                overlays={boardOverlays}
                marks={displayedMarks}
                drawingEnabled={previewNodeId === undefined && checkpoint === undefined}
                describedBy={checkpoint !== undefined ? "checkpoint-board-paused" : undefined}
                onMarksChange={changedMarks}
                onSelect={(square) => selectedSquare = square}
                onExitGrid={() => regionElement?.focus()}
                activeSquare={boardActiveSquare}
                onActiveSquareChange={(square) => boardActiveSquare = square}
                lastMoveAnnouncement={boardMoveAnnouncement}
                onMoveCommitted={(announcement) => boardMoveAnnouncement = announcement}
                focusAfterMove={boardFocusRequested}
                resetToken={`${displayedNode.id}:${groupOpen ? groupCandidates.length : -1}`}
                onMoveSettled={() => boardFocusRequested = true}
                onFocusRestored={() => boardFocusRequested = false}
                onMove={boardMove}
              />
            {#if checkpoint !== undefined}
              <div class="checkpoint-pause" id="checkpoint-board-paused">
                <strong>Board paused</strong>
                <span>Choose a checkpoint action to continue.</span>
              </div>
            {/if}
          </div>
        </div>
        <div class="timeline-strip">
          <Timeline
            {entries}
            activeNodeId={run.activeCursor.nodeId}
            {previewNodeId}
            onPreview={preview}
            onConfirm={confirmPreview}
            confirming={rewindBusy}
            confirmError={previewNodeId === undefined ? undefined : rewindErrorFor({ nodeId: previewNodeId })}
            rewindPolicy="free"
            canConfirm={canWrite}
            rewindableNodeIds={timelineRewindNodeIds}
            {authoredSpineNodeIds}
            {checkpointLabels}
            rootNodeId={run.nodes[0]?.id}
            {shapeMarkers}
            onOpenShape={showShape}
            pivotalMarkers={pivotalRows}
            onOpenPivotal={openPivotalMarker}
            branches={timelineCards}
            onOpenBranch={switchVisibleBranch}
            openingBranch={branchSwitchBusy !== undefined}
          />
        </div>
        <button class="objective-line" type="button" onclick={() => (objectiveOpen = true)} title={objectiveSentence}>
          <span>Objective</span>
          <strong>{objectiveSentence}</strong>
          <small>{phaseLabel(detectedPhase.phase)} · {consequenceHorizon(pack)}</small>
        </button>
      </section>

      <!-- svelte-ignore a11y_no_noninteractive_tabindex (phone-only dialog needs a programmatic focus target; tabindex is absent outside that state) -->
      <aside
        class="rail-stack"
        class:sheet-open={sheetOpen}
        bind:this={companionElement}
        role={phoneSheetModal ? "dialog" : undefined}
        aria-modal={phoneSheetModal ? "true" : undefined}
        aria-label="Run companion"
        tabindex={phoneSheetModal ? -1 : undefined}
        use:modalBoundary={phoneSheetModal}
      >
        <div class="companion-identity">
          <!-- svelte-ignore a11y_no_noninteractive_tabindex (WCAG keyboard access for an overflow region) -->
          <div class="objective-copy" role="region" aria-labelledby="drill-title" tabindex="0">
            <p>Objective</p>
            <h1 id="drill-title">{objectiveSentence}</h1>
          </div>
          {#if pack?.variantOf !== undefined}
            <section class="variant-link" aria-label="Related rehearsal">
              <span>{pack.variantOf.relation.kind === "root_after_move" ? `After ${relatedPack === undefined ? "the related move" : moveSanFromUci(relatedPack.start.fen, pack.variantOf.relation.moveUci) ?? "the related move"}` : pack.variantOf.relation.kind === "same_root_other_side" ? "Same position, other side" : "Same position, other objective"}:</span>
              <button type="button" disabled={onSelectPack === undefined} onclick={() => onSelectPack?.(pack.variantOf!.packId)}>{relatedPack?.title ?? "Related rehearsal"}</button>
            </section>
          {/if}
          <section class="phase-reading" aria-label="Phase reading">
            <span>{phaseSummary(pack?.phase, detectedPhase.phase)}</span>
          </section>
        </div>

        <nav class="compact-tabs" aria-label="Run regions">
          <span class="sheet-handle" aria-hidden="true"></span>
          <button class:active={compactTab === "evidence"} aria-pressed={compactTab === "evidence"} onclick={(event) => openCompanion("evidence", event)}>Support</button>
          <button class:active={compactTab === "branches"} aria-pressed={compactTab === "branches"} onclick={(event) => openCompanion("branches", event)}>Branches</button>
          <button class:active={compactTab === "timeline"} aria-pressed={compactTab === "timeline"} onclick={(event) => openCompanion("timeline", event)}>Actions</button>
          <button class="sheet-close" type="button" aria-label="Collapse companion" onclick={closeCompanion}>Close</button>
        </nav>

        <div class="companion-scroll">
          <section id="run-support-region" class="companion-section evidence-seat" class:compact-active={compactTab === "evidence"} aria-label="Support">
            <footer class="preset-disclosure" aria-label="Active support promise" data-preset-state={assistanceQueryState}>
              <strong>{presetPillLabel}</strong>
              <span>{presetHeadline}</span>
              {#if presetSentences.length > 0}<ul class="preset-suppressions">{#each presetSentences as sentence}<li>{sentence}</li>{/each}</ul>{/if}
            </footer>
            {#if guide}
              <section class="rehearsal-guide" aria-labelledby="rehearsal-guide-title">
                <StatusAnnouncement message={`First rehearsal, step ${guide.ordinal} of 4. ${guide.title}. ${guide.body.join(" ")}`} />
                <div class="guide-progress" aria-label={`First rehearsal, step ${guide.ordinal} of 4`}>
                  {#each [1, 2, 3, 4] as step}
                    <span class:reached={step <= guide.ordinal}></span>
                  {/each}
                </div>
                <p>First rehearsal · {guide.ordinal} of 4</p>
                <h2 id="rehearsal-guide-title">{guide.title}</h2>
                {#each guide.body as sentence}<p class="guide-body">{sentence}</p>{/each}
                {#if guide.rewindNodeId !== undefined}
                  <button class="primary" type="button" disabled={!canWrite || busy || rewindBusy} onclick={() => void rewindFirstRehearsal()}>{rewindBusy ? "Going back…" : "Go back to the decision"}</button>
                  {#if rewindErrorFor({ nodeId: guide.rewindNodeId })}<p role="alert">{rewindErrorFor({ nodeId: guide.rewindNodeId })}</p>{/if}
                {:else if guide.compareBranchIds !== undefined}
                  <button class="primary" type="button" disabled={guide.compareBranchIds.length < 2 || busy} onclick={() => void compareFirstRehearsal()}>Compare both attempts</button>
                {/if}
              </section>
            {/if}
            {#if run.feedbackPolicy === "attempt_end" && canWrite && onReveal !== undefined}
              <section class="evidence-reveal" aria-label="Temporary help">
                <p id="temporary-help-cost">Opening this reveals grounded help for this position. It closes again after your next committed move.</p>
                <button type="button" disabled={feedbackDeliveryOpen(run) || busy} aria-describedby="temporary-help-cost" onclick={() => void onReveal?.()}>Show support for this position</button>
                {#if feedbackDeliveryOpen(run)}<p role="status">Support is available for this position until you commit your next move.</p>{/if}
              </section>
            {/if}
            <section class="analysis-request" aria-labelledby="analysis-request-title">
              <p>Deeper analysis</p>
              <h2 id="analysis-request-title">Calculate this position</h2>
              <p>Ask for one concrete continuation when the position is unclear. It stays optional: this does not grade your move or tell you what you must play.</p>
              <div class="analysis-request-actions">
                <HonestControl
                  disabled={analysisUnavailableReason !== undefined}
                  reasonId="analysis-request-unavailable"
                  reason={analysisUnavailableReason ?? ""}
                >
                  {#snippet children(describedBy)}
                    <button type="button" disabled={analysisUnavailableReason !== undefined} aria-describedby={describedBy} onclick={() => void requestCurrentAnalysis()}>
                      {analysisRequestedNodeId === currentNode.id ? "Preparing calculation…" : "Calculate this position"}
                    </button>
                  {/snippet}
                </HonestControl>
                {#if recordedEngineEvidence.length > 0}
                  <button type="button" onclick={() => (inspectorOpen = true)}>Inspect recorded calculation</button>
                {/if}
              </div>
              {#if analysisRequestError?.nodeId === currentNode.id}<p class="analysis-error" role="alert">{analysisRequestError.text}</p>{/if}
              {#if recordedEngineEvidence.length > 0}<p class="analysis-ready" role="status">A recorded calculation is available for this position.</p>{/if}
            </section>
            {#if guardEvent?.type === "feedback.generated"}
              <section class="guard-prompt" aria-label="Consequence to review">
                <StatusAnnouncement message="The consequence exposed something concrete. Your played line stays preserved. Play on, rewind, or inspect what changed." />
                <div>
                  <strong>The consequence exposed something concrete.</strong>
                  <p>Your played line stays preserved.</p>
                </div>
                <div class="guard-actions">
                  <button type="button" disabled={rewindBusy} onclick={() => (dismissedGuardSeq = guardEvent?.seq)}>Play on</button>
                  {#if guardGrounds.length > 0}<button type="button" onclick={() => (inspectorOpen = true)}>Inspect what changed</button>{/if}
                  <button class="primary" type="button" disabled={snapshot.access === "read_only" || guardRewindNodeId === undefined || rewindBusy} onclick={() => guardRewindNodeId === undefined ? undefined : rewindRun({ nodeId: guardRewindNodeId })}>{rewindBusy ? "Rewinding…" : guardRewindNodeId !== undefined && rewindErrorFor({ nodeId: guardRewindNodeId }) !== undefined ? "Try rewind again" : "Rewind"}</button>
                </div>
                {#if guardRewindNodeId !== undefined && rewindErrorFor({ nodeId: guardRewindNodeId })}<p role="alert">{rewindErrorFor({ nodeId: guardRewindNodeId })}</p>{/if}
              </section>
            {/if}
            {#if hints !== undefined && hintCeiling !== "off"}
              <GuidedHintSeat {run} ceiling={hintCeiling} {canWrite} client={hints} assistanceRequest={hintAssistanceRequest} onMarks={(marks) => hintMarks = marks} />
            {/if}
            {#if nudge?.kind === "packet" && nudge.nodeId === nudgeNodeId && nudge.facts.length > 0}
              <section class="module-seat" aria-label="Post-commit nudge" data-module="postcommit_nudge">
                <strong>{nudge.headline}</strong>
                {#each nudge.facts as fact (fact.projection)}<p data-projection={fact.projection}>{fact.sentence}</p>{/each}
                <p>{nudge.closing}</p>
              </section>
            {/if}
            {#if overlayCaption.length > 0}<div class="overlay-caption" role="status" aria-live="polite" aria-atomic="true" data-evidence-consumer="board.selected_square_sight">{#each overlayCaption as sentence}<p>{sentence}</p>{/each}</div>{/if}
            {#if assistance.boardLighting === "evidence" && !feedbackDeliveryOpen(run)}<p class="overlay-caption honest">No extra highlights are available here; basic board guidance remains available.</p>{/if}
            {#if rawStructure.structures.length === 0 && !firings.some((firing) => firing.openEnded && firing.lastNodeId === currentNode.id)}
              <section class="support-empty" aria-labelledby="support-empty-title">
                <p>Position pattern</p>
                <h2 id="support-empty-title">Nothing recognizes this structure yet</h2>
                <p>That is not a dead end. Play it and see what the consequence exposes, or return to an earlier decision and try another idea.</p>
                <div class="support-empty-actions">
                  <button class="primary" type="button" disabled={busy || rewindBusy || !canWrite || terminalEvent !== undefined} aria-describedby={busy || rewindBusy || !canWrite || terminalEvent !== undefined ? "support-keep-playing-disabled" : undefined} onclick={focusBoardFromSupport}>Keep playing</button>
                  {#if busy || rewindBusy || !canWrite || terminalEvent !== undefined}<span id="support-keep-playing-disabled" class="honest">{!canWrite ? "This read-only view cannot play a move." : terminalEvent !== undefined ? "This line has ended; rewind to keep exploring." : rewindBusy ? "Wait for this rewind to finish." : "Wait for the current move to finish."}</span>{/if}
                  {#if previousSupportRewindNodeId !== undefined}
                    <button type="button" disabled={busy || rewindBusy || !canWrite} aria-describedby={busy || rewindBusy || !canWrite ? "support-rewind-disabled" : undefined} onclick={() => void rewindRun({ nodeId: previousSupportRewindNodeId! })}>{rewindBusy ? "Rewinding…" : "Rewind to a decision"}</button>
                    {#if busy || rewindBusy || !canWrite}<span id="support-rewind-disabled" class="honest">{!canWrite ? "This read-only view cannot rewind the run." : rewindBusy ? "Wait for this rewind to finish." : "Wait for the current move to finish."}</span>{/if}
                    {#if rewindErrorFor({ nodeId: previousSupportRewindNodeId })}<p role="alert">{rewindErrorFor({ nodeId: previousSupportRewindNodeId })}</p>{/if}
                  {/if}
                </div>
              </section>
            {/if}
            <OutcomeContext {assessment} {resistance} grade={pack === undefined ? undefined : objectiveGradeSentence(pack.objective.type, currentNode.objectiveState)} />
            {#if banner !== undefined}<WhyBanner model={banner} />{/if}
            {#if run.sessionKind === "imported" && canWrite && onGuessImportedMove !== undefined && importedNextMove(run) !== undefined}
              <ImportedGuessPanel fen={currentNode.fen} {startSide} lastMove={currentNode.moveUci} {busy} guess={importedGuess?.nodeId === currentNode.id ? importedGuess : undefined} onGuess={onGuessImportedMove} />
            {/if}
          </section>

          <section class="companion-section branch-seat" class:compact-active={compactTab === "branches"} aria-label="Branches">
        {#if activeGroup}
          <GroupPanel
            {run}
            group={activeGroup}
            {startSide}
            advanceMode={groupPreference(activeGroup.groupId)}
            onAdvanceMode={(mode) => setGroupPreference(activeGroup!.groupId, mode)}
            onEnter={switchRunBranch}
            entering={branchSwitchBusy !== undefined}
            onCompare={() => openCompare(activeGroup!.members.map((member) => member.branchId))}
            onAnalyze={(nodeIds) => requestGroupAnalysis(activeGroup!, nodeIds)}
            analysisBusy={groupAnalysisBusy?.runId === run.id && groupAnalysisBusy.groupId === activeGroup.groupId && groupAnalysisBusy.nodeKey === analysisNodeKey(missingGroupNodeIds(activeGroup))}
            analysisError={groupAnalysisError?.runId === run.id && groupAnalysisError.groupId === activeGroup.groupId && groupAnalysisError.nodeKey === analysisNodeKey(missingGroupNodeIds(activeGroup)) ? groupAnalysisError.text : undefined}
          />
          <button class="next-member" type="button" disabled={branchSwitchBusy !== undefined || groupAnalysisBusy !== undefined} aria-describedby={branchSwitchBusy !== undefined ? "branch-switch-status" : groupAnalysisBusy !== undefined ? "group-analysis-status" : undefined} onclick={() => void nextGroupMember(activeGroup!)}>Next member</button>
        {/if}
        <BranchRail
          branches={cards}
          activeBranchId={run.activeCursor.branchId}
          {compareIds}
          onSwitch={switchVisibleBranch}
          switching={branchSwitchBusy !== undefined}
          onToggleCompare={toggleCompare}
          onCompareAllHere={compareAllHere}
          {groupOrdinals}
          {decidedness}
          collapsedBranchIds={collapsedIds}
          {foldedBranchIds}
          {compareLimitNotice}
          onFold={foldBranch}
          onRestore={restoreBranch}
          onRestoreAll={() => persistFolded([])}
          onClassify={onClassifyBranches === undefined ? undefined : classifyRemaining}
          {classificationBusy}
          {classificationError}
        />
          </section>

          <section class="companion-section action-seat" class:compact-active={compactTab === "timeline"} aria-label="Run actions">
        <div class="mark-controls" aria-label="Board marks">
          <label>Marks stay with <select value={markScope} disabled={markBusy !== undefined} onchange={setMarkScope}><option value="position">this position</option><option value="branch">this line</option></select></label>
          <span>{displayedMarks.length}/64 marks</span>
          <button type="button" disabled={displayedMarks.length === 0 || onRescopeMarks === undefined || markBusy !== undefined} aria-describedby={displayedMarks.length === 0 || onRescopeMarks === undefined ? "rescope-marks-disabled" : undefined} onclick={rescopeVisibleMarks}>{markBusy?.kind === "rescope" ? "Moving marks…" : "Move marks to the other scope"}</button>
          {#if displayedMarks.length === 0 || onRescopeMarks === undefined}<span id="rescope-marks-disabled">Draw a mark before moving it to another scope.</span>{/if}
          {#if markBusy?.kind === "load"}<span role="status">Loading saved marks…</span>{/if}
          {#if markBusy?.kind === "save"}<span role="status">Saving marks…</span>{/if}
          {#if markError !== undefined}
            <span role="alert">{markError.text}</span>
            <button type="button" onclick={retryMarkOperation}>{markError.retryLabel}</button>
          {/if}
        </div>
        <div class="quick-actions" aria-label="Run actions">
          <HonestControl disabled={!canWrite} reasonId="drill-fork-readonly" reason="This read-only view cannot create a branch.">
            {#snippet children(describedBy)}<button type="button" disabled={!canWrite} aria-label="Fork branch" aria-describedby={describedBy} onclick={(event) => { forkInvoker = invoker(event); forkError = undefined; forkOpen = true; }}>Fork <kbd>B</kbd></button>{/snippet}
          </HonestControl>
          <HonestControl disabled={!canWrite} reasonId="drill-group-readonly" reason="This read-only view cannot create a branch group.">
            {#snippet children(describedBy)}<button type="button" disabled={!canWrite} aria-describedby={describedBy} onclick={openGroupCreator}>Branch group</button>{/snippet}
          </HonestControl>
          <HonestControl
            disabled={cards.length < 2}
            reasonId="drill-compare-unavailable"
            reason="Create at least two branches before comparing."
          >
            {#snippet children(describedBy)}
              <button
                type="button"
                disabled={cards.length < 2 || compareBusy}
                aria-label="Compare branches"
                aria-describedby={compareBusy ? "drill-compare-opening" : compareError !== undefined ? "drill-compare-error" : describedBy}
                onclick={(event) => { compareInvoker = invoker(event); void openCompare(); }}
              >{compareBusy ? "Opening comparison…" : compareError !== undefined ? "Try comparison again" : "Compare"} <kbd>Alt+C</kbd></button>
            {/snippet}
          </HonestControl>
          {#if compareBusy}<span id="drill-compare-opening" class="action-state" role="status">Preparing the selected branch comparison.</span>{/if}
          {#if compareError !== undefined}<span id="drill-compare-error" class="action-state error" role="alert">{compareError}</span>{/if}
          {#if pack !== undefined}
            <HonestControl
              disabled={!canWrite || simulationChoiceCount < 2 || onSimulate === undefined}
              reasonId="drill-simulation-unavailable"
              reason={!canWrite ? "This read-only view cannot preview authored lines." : "This position needs at least two authored continuations before it can be previewed side by side."}
            >
              {#snippet children(describedBy)}
                <button
                  type="button"
                  disabled={!canWrite || simulationChoiceCount < 2 || onSimulate === undefined || simulationOpening !== undefined}
                  aria-describedby={simulationOpening !== undefined ? "drill-simulation-opening" : simulationOpenError?.runId === run.id && simulationOpenError.nodeId === currentNode.id ? "drill-simulation-error" : describedBy}
                  onclick={(event) => void openSimulation(event)}
                >{simulationOpening !== undefined ? "Opening authored lines…" : simulationOpenError?.runId === run.id && simulationOpenError.nodeId === currentNode.id ? "Try authored lines again" : "Preview authored lines"}</button>
              {/snippet}
            </HonestControl>
            {#if simulationOpening !== undefined}<span id="drill-simulation-opening" class="action-state" role="status">Preparing scratch lines from this position.</span>{/if}
            {#if simulationOpenError?.runId === run.id && simulationOpenError.nodeId === currentNode.id}<span id="drill-simulation-error" class="action-state error" role="alert">The preview did not open. Check this position and try again.</span>{/if}
          {/if}
          <button type="button" aria-label={replaying ? "Pause replay" : "Replay"} aria-pressed={replaying} onclick={toggleReplay}>
            {replaying ? "Pause" : "Replay"} <kbd>Space</kbd>
          </button>
          <button type="button" aria-label="Export" onclick={() => onExport(compareIds.length > 0 ? compareIds : undefined)}>Export <kbd>E</kbd></button>
        </div>
          </section>
        </div>
      </aside>
    </div>
    {#if groupOpen}
      <div class="group-creator" role="dialog" aria-modal="false" aria-labelledby="group-create-title" aria-describedby="group-create-description">
        <div><p>Parallel experiment</p><h2 id="group-create-title" tabindex="-1" bind:this={groupHeading}>Create a branch group</h2></div>
        <label>Source
          <select bind:value={groupSource} disabled={groupBusy || groupOutcomeUncertain} aria-describedby={groupBusy ? "group-create-busy" : groupOutcomeUncertain ? "group-create-error" : undefined}>
            <option value="hand_picked">My candidate moves</option>
            <option value="authored" disabled={pack === undefined}>Authored variations</option>
            <option value="human_replies" disabled={capabilities?.providers.opponent === "none" || assistancePermission.humanSplit === "locked_off"}>Recorded human replies</option>
            <option value="engine_top_n" disabled={!capabilities?.policyModes.includes("strong_engine") || assistancePermission.humanSplit === "locked_off"}>Engine lines</option>
          </select>
        </label>
        <label>Resistance
          <select bind:value={groupResistance} disabled={groupBusy || groupOutcomeUncertain} aria-describedby={groupBusy ? "group-create-busy" : groupOutcomeUncertain ? "group-create-error" : undefined}><option value="fixed">Fixed</option><option value="per_branch">Varied</option></select>
        </label>
        {#if groupSource === "hand_picked"}
          <p id="group-create-description" class="capture-help">Choose legal moves on the board. This palette stays open and the run is not changed until you create the group.</p>
          <button class="board-return" type="button" disabled={groupBusy || groupOutcomeUncertain} aria-describedby={groupBusy ? "group-create-busy" : groupOutcomeUncertain ? "group-create-error" : undefined} onclick={focusBoardForGroup}>Choose moves on the board</button>
          <div class="candidate-chips">{#each groupCandidates as uci}<button type="button" disabled={groupBusy || groupOutcomeUncertain} aria-describedby={groupBusy ? "group-create-busy" : groupOutcomeUncertain ? "group-create-error" : undefined} onclick={() => (groupCandidates = groupCandidates.filter((move) => move !== uci))}>{moveSanFromUci(displayedNode.fen, uci) ?? "Legal candidate"} ×</button>{:else}<span>No candidates captured yet.</span>{/each}</div>
        {:else}
          <p id="group-create-description" class="capture-help">Choose how this parallel experiment is populated. The run is not changed until you create the group.</p>
          <label>Members <input type="number" min="2" max="8" bind:value={groupSize} disabled={groupBusy || groupOutcomeUncertain} aria-describedby={groupBusy ? "group-create-busy" : groupOutcomeUncertain ? "group-create-error" : undefined} /></label>
        {/if}
        <div class="creator-actions"><button type="button" onclick={closeGroupCreator}>Cancel</button><button type="button" disabled={groupBusy || groupOutcomeUncertain || (groupSource === "hand_picked" && groupCandidates.length < 2)} aria-describedby={groupBusy ? "group-create-busy" : groupOutcomeUncertain ? "group-create-error" : groupSource === "hand_picked" && groupCandidates.length < 2 ? "group-candidates-needed" : undefined} onclick={() => void createGroup()}>{groupBusy ? "Creating group…" : "Create group"}</button></div>
        {#if groupSource === "hand_picked" && groupCandidates.length < 2}<span id="group-candidates-needed" class="honest">Capture at least two distinct legal moves.</span>{/if}
        {#if groupBusy}<span id="group-create-busy" class="honest" role="status">Creating this group from the current position.</span>{/if}
        {#if groupError}<span id="group-create-error" class="honest" role="alert">{groupError}</span>{/if}
      </div>
    {/if}
  </main>
{/if}

{#if simulation !== undefined && onEnterSimulation !== undefined}
  <SimulationPreview {simulation} {startSide} {busy} onEnter={onEnterSimulation} onClose={closeSimulation} />
{/if}

{#if viewportSupport.supported && checkpoint}
  <CheckpointSheet
    {run}
    node={currentNode}
    {startSide}
    {onPrediction}
    {onReasoning}
    {onReasoningReview}
    {...(reasoning === undefined ? {} : { reasoning })}
    {checkpoint}
    authoredItems={checkpointAuthoredItems}
    {shapes}
    {assessment}
    {resistance}
    resolution={checkpointResolution}
    canCompare={cards.length >= 2}
    onContinue={continueFromCheckpoint}
    continuing={checkpointContinueBusy}
    continueError={checkpointContinueError?.eventSeq === checkpoint.eventSeq ? checkpointContinueError.text : undefined}
    onRewind={() => rewindRun({ nodeId: checkpoint.nodeId })}
    rewinding={rewindBusy}
    rewindError={rewindErrorFor({ nodeId: checkpoint.nodeId })}
    onCompare={openCompare}
    comparing={compareBusy}
    {compareError}
    {onStop}
  />
{/if}

{#if viewportSupport.supported && terminalEvent?.type === "outcome.reached"}
  <TerminalSheet
    {run}
    outcome={terminalEvent.data.outcome}
    authoredItems={terminalAuthoredItems}
    {shapes}
    evidence={terminalEvidence}
    {assessment}
    {resistance}
    grade={pack === undefined ? undefined : objectiveGradeSentence(pack.objective.type, currentNode.objectiveState)}
    canRewind={snapshot.access === "writer" && currentNode.parentId !== null}
    onRewind={() => currentNode.parentId === null ? undefined : rewindRun({ nodeId: currentNode.parentId })}
    rewinding={rewindBusy}
    rewindError={currentNode.parentId === null ? undefined : rewindErrorFor({ nodeId: currentNode.parentId })}
    {onStory}
    onFlip={onFlip === undefined ? undefined : () => onFlip(run.nodes[0]!.id)}
    onInspectEvidence={() => (inspectorOpen = true)}
    canScheduleReturn={canWrite && run.sessionKind !== "imported" && onScheduleReturn !== undefined}
    scheduleUnavailableReason={!canWrite ? "This read-only view cannot change your return queue." : run.sessionKind === "imported" ? "Choose a story moment and start a rehearsal before scheduling its return." : "Return scheduling is unavailable from this deployment."}
    {onScheduleReturn}
    {assignmentOffers}
    {onSubmitAssignment}
    {repertoireAnswerOffer}
    {repertoireAnswerBusy}
    {repertoireAnswerError}
    {onChooseRepertoireAnswer}
    {onStop}
  />
{/if}

{#if viewportSupport.supported && helpOpen}<KeyboardHelp onClose={closeHelp} />{/if}

{#if viewportSupport.supported && objectiveOpen}
  <div class="modal-backdrop">
    <div class="modal objective-dialog" role="dialog" aria-modal="true" aria-labelledby="objective-dialog-title" use:modalBoundary>
      <p>Objective</p>
      <h2 id="objective-dialog-title">{objectiveSentence}</h2>
      <button type="button" onclick={() => (objectiveOpen = false)}>Return to the board</button>
    </div>
  </div>
{/if}

{#if viewportSupport.supported && inspectorOpen}
  <div class="modal-backdrop inspector-backdrop">
    <div class="inspector-surface" role="dialog" aria-modal="true" aria-labelledby="inspector-title" use:modalBoundary>
      <header><div><p>Analysis surface</p><h2 id="inspector-title">Evidence inspector</h2></div><button type="button" onclick={() => (inspectorOpen = false)}>Return to play</button></header>
      <div class="inspector-grid">
        <section aria-label="Advanced support controls" data-evidence-consumer="inspector.assistance_controls">
          <h3>Advanced support controls</h3>
          <p class="honest">These controls change individual evidence channels. Ordinary play uses the workflow's support defaults.</p>
          <div class="assistance-grid">
            <AssistanceControlFields
              config={requestedConfig}
              permissions={assistancePermission}
              {capabilities}
              lockedReasonId="advanced-support-locked"
              externalVoiceReasonId="advanced-support-external-voice-unavailable"
              {speechAvailable}
              onChange={setAssistanceConfig}
            />
            {#if assistance.humanSplit === "on_request" && assistancePermission.humanSplit === "free" && onHumanSplit !== undefined}<button type="button" disabled={humanSplitBusyNodeId === displayedNode.id} onclick={() => void requestHumanSplit()}>{humanSplitBusyNodeId === displayedNode.id ? "Loading human move choices…" : "Load human move-model evidence"}</button>{/if}
            {#if assistance.humanSplit === "on_request" && assistancePermission.humanSplit === "free" && onHumanSplit === undefined}<span class="honest">Recorded human-model splits are unavailable from this deployment.</span>{/if}
            {#if assistance.corpus === "on_request" && assistancePermission.corpus === "free" && capabilities?.providers.corpus !== "none" && onCorpus !== undefined}<button type="button" disabled={corpusBusyNodeId === corpusQueryNodeId} onclick={() => void requestCorpus()}>{corpusBusyNodeId === corpusQueryNodeId ? "Loading human game counts…" : "Load human-game corpus evidence"}</button>{/if}
            {#if assistancePermission.humanSplit === "locked_off" || assistancePermission.corpus === "locked_off"}<span id="advanced-support-locked" class="honest">Requested evidence is available only after this run opens feedback, and never to participants or spectators.</span>{/if}
            {#if capabilities?.providers.llm !== "external"}<span id="advanced-support-external-voice-unavailable" class="honest">External voice is unavailable from this deployment.</span>{/if}
            {#if !speechAvailable && capabilities?.providers.tts !== "external"}<span id="spoken-unavailable" class="honest">Speech synthesis is unavailable in this browser.</span>{/if}
          </div>
          <fieldset class="module-toggles" aria-describedby="advanced-module-note">
            <legend>Help modules</legend>
            <p id="advanced-module-note" class="honest">Starting from {presetDeclaration(requestedPresetId).label}. Adding or removing a module makes this workflow's help Custom; legal moves always stay.</p>
            <p id="advanced-module-ceiling" class="honest">Modules this workflow never shows are unavailable here.</p>
            {#each CONFIGURABLE_MODULE_IDS as moduleId (moduleId)}
              {@const admitted = contextPolicy.moduleCeiling.includes(moduleId)}
              <label><input type="checkbox" checked={requestedModuleSet.includes(moduleId)} disabled={!admitted} aria-describedby={admitted ? undefined : "advanced-module-ceiling"} onchange={(event) => setAssistanceModule(moduleId, event.currentTarget.checked)} /> {MODULE_LABELS[moduleId]}</label>
            {/each}
          </fieldset>
        </section>
        <section class="structural-reading" aria-label="Evidence inspector: position structure" data-evidence-consumer="inspector.position_structure">
          <button type="button" aria-expanded={structuralOpen} onclick={() => (structuralOpen = !structuralOpen)}>Position structure</button>
          {#if structuralOpen}<div class="structural-facts">{#if assistance.guided === "live" && firings.length === 0}<p>No named structure entry matches this line.</p>{/if}{#if structure.features.length === 0}<p>No rung-0 structural observations in this position.</p>{/if}{#each structure.features as observation}<p>{renderStructuralObservation(observation)}</p>{/each}</div>{/if}
        </section>
        <section class="transition-reading" aria-label="Evidence inspector: move transition" data-evidence-consumer="inspector.move_transition">
          <button type="button" aria-expanded={transitionOpen} onclick={() => (transitionOpen = !transitionOpen)}>Move transition</button>
          {#if transitionOpen}<div class="transition-facts">{#if transition === null || transition.observations.length === 0}<p>No rung-0 transition observations at this move.</p>{/if}{#each transition?.observations ?? [] as observation}<p>{renderTransitionObservation(observation)}</p>{/each}</div>{/if}
        </section>
        <section aria-label="Human-model evidence" data-evidence-consumer="inspector.human_split">
          <h3>Human move model</h3>
          {#if assistancePermission.humanSplit === "free" && onHumanSplit !== undefined}<button type="button" disabled={humanSplitBusyNodeId === displayedNode.id} onclick={() => void requestHumanSplit()}>{humanSplitBusyNodeId === displayedNode.id ? "Loading move choices…" : "Load model candidates"}</button>{/if}
          {#if humanSplitBusyNodeId === displayedNode.id}<p role="status">Loading human move choices for this position…</p>{/if}
          {#if humanSplitError?.nodeId === displayedNode.id}<p role="alert">{humanSplitError.text}</p>{/if}
          {#if humanSplit?.nodeId === displayedNode.id}
            <p class="honest">{humanModelBandSentence(humanSplit)}</p>
            <p class="honest">{HUMAN_MODEL_RUNG_DISCLAIMER}</p>
            <p class="guidance-sentence">{humanCandidateSentences(humanSplit).join(" · ")}</p>
          {:else if humanSplitBusyNodeId !== displayedNode.id && humanSplitError?.nodeId !== displayedNode.id}<p class="honest">No human-model page loaded for this position.</p>{/if}
        </section>
        <section aria-label="Corpus evidence" data-evidence-consumer="inspector.corpus">
          <h3>Human corpus</h3>
          {#if assistancePermission.corpus === "free" && capabilities?.providers.corpus !== "none" && onCorpus !== undefined}<button type="button" disabled={corpusBusyNodeId === corpusQueryNodeId} onclick={() => void requestCorpus()}>{corpusBusyNodeId === corpusQueryNodeId ? "Loading game counts…" : "Load corpus counts"}</button>{/if}
          {#if corpusBusyNodeId === corpusQueryNodeId}<p role="status">Loading human game counts for this position…</p>{/if}
          {#if corpusError?.nodeId === corpusQueryNodeId}<p role="alert">{corpusError.text}</p>{/if}
          {#if corpusPage?.nodeId === corpusQueryNodeId}{#each renderCorpusPage(corpusPage) as sentence}<p class="guidance-sentence">{sentence}</p>{/each}{:else if corpusBusyNodeId !== corpusQueryNodeId && corpusError?.nodeId !== corpusQueryNodeId}<p class="honest">No corpus page loaded for this position.</p>{/if}
        </section>
        <section aria-label="Recorded moment evidence" data-evidence-consumer="inspector.pivotal_marker">
          <h3>Recorded moment</h3>
          {#if openPivotalNodeId === undefined}
            <p class="honest">Open a timeline moment before inspecting its full evidence.</p>
          {:else}
            <p class="honest">{openPivotalNode?.moveSan ?? "Start position"} · {rehearsalStepLabel(openPivotalNode?.ply ?? 0).toLocaleLowerCase()}</p>
            {#each openPivotal as marker}{#each renderPivotalMarker(marker) as sentence}<p class="guidance-sentence">{sentence}</p>{/each}{/each}
            {#each renderEndgameClassification(endgame) as sentence}<p class="guidance-sentence">{sentence}</p>{/each}
            {#if assistance.voice === "persona" && capabilities?.providers.llm === "external" && onVoice !== undefined}<button type="button" disabled={voiceBusy?.nodeId === openPivotalNodeId && voiceBusy.scope === "marker"} onclick={() => void requestVoice("marker")}>{voiceBusy?.nodeId === openPivotalNodeId && voiceBusy.scope === "marker" ? "Explaining this moment…" : "Revoice this evidence"}</button>{/if}
            {#if voiceBusy?.nodeId === openPivotalNodeId && voiceBusy.scope === "marker"}<p role="status">Preparing an explanation of this moment…</p>{/if}
            {#if voiceError?.nodeId === openPivotalNodeId && voiceError.scope === "marker"}<p role="alert">{voiceError.text}</p>{/if}
            {#if voiceNodeId === openPivotalNodeId && voicePage?.text.includes("Recorded reading at this position:")}<p class="guidance-sentence">{RECORDED_READING_GUARD}</p>{/if}
            {#if voiceNodeId === openPivotalNodeId && voicePage?.scope === "marker"}<p class="guidance-sentence">{voicePage.text}</p>{/if}
          {/if}
        </section>
        <section aria-label="Current-position evidence rendering" data-evidence-consumer="inspector.current_position_voice">
          <h3>Current-position rendering</h3>
          <p class="honest">Render the evidence attached to the position now on the board. This does not require a pivotal marker.</p>
          {#if assistance.voice === "persona" && capabilities?.providers.llm === "external" && onVoice !== undefined}
            <button type="button" disabled={voiceBusy?.nodeId === displayedNode.id && voiceBusy.scope === "reading"} onclick={() => void requestVoice("reading")}>{voiceBusy?.nodeId === displayedNode.id && voiceBusy.scope === "reading" ? "Explaining this position…" : "Revoice current-position evidence"}</button>
          {:else}
            <p class="honest">External rewording is not enabled for this workflow.</p>
          {/if}
          {#if voiceBusy?.nodeId === displayedNode.id && voiceBusy.scope === "reading"}<p role="status">Preparing an explanation of this position…</p>{/if}
          {#if voiceError?.nodeId === displayedNode.id && voiceError.scope === "reading"}<p role="alert">{voiceError.text}</p>{/if}
          {#if voiceNodeId === displayedNode.id && voicePage?.scope === "reading"}
            {#if voicePage.text.includes("Recorded reading at this position:")}<p class="guidance-sentence">{RECORDED_READING_GUARD}</p>{/if}
            <p class="guidance-sentence">{voicePage.text}</p>
          {/if}
        </section>
        <section aria-label="Current-position endgame evidence" data-evidence-consumer="inspector.endgame_reading">
          <h3>Current-position endgame</h3>
          {#if endgame === null}
            <p class="honest">The position is not classified as an endgame.</p>
          {:else}
            {#each endgameSentences as sentence}<p class="guidance-sentence">{sentence}</p>{/each}
            {#if assistance.spoken !== "off"}
              <button type="button" disabled={speechBusyNodeId === displayedNode.id} onclick={() => void speakSentences(endgameSentences, "reading")}>{speechBusyNodeId === displayedNode.id ? "Preparing spoken guidance…" : "Speak current-position endgame evidence"}</button>
            {/if}
            {#if speechBusyNodeId === displayedNode.id}<p role="status">Preparing spoken guidance for this position…</p>{/if}
            {#if speechError?.nodeId === displayedNode.id}<p role="alert">{speechError.text}</p>{/if}
          {/if}
        </section>
        <section aria-label="Named structure evidence" data-evidence-consumer="inspector.shape_trigger">
          <h3>Named structure</h3>
          {#if inspectedShape === undefined}
            <p class="honest">Open a named structure before inspecting its trigger and sources.</p>
          {:else}
            <h4>{inspectedShape.name}</h4>
            <p class="guidance-sentence">{renderStructuralExpressionSpec(inspectedShape.trigger)}</p>
            <p class="honest">{inspectedShape.id}@{inspectedShape.version} · {inspectedShape.channel} · {inspectedShape.provenance.licence}</p>
            {#each inspectedShape.provenance.attribution as source}<p>{source.title} — {source.author} ({source.licence}){#if source.url} · <a href={source.url} rel="noreferrer">source</a>{/if}</p>{/each}
            {#each inspectedShape.provenance.sources as source}<p>{source}</p>{/each}
            {#each inspectedShape.plans.filter((plan) => plan.success.signature !== null) as plan}<p class="guidance-sentence">{plan.label}: {renderStructuralExpressionSpec(plan.success.signature!)}.</p>{/each}
          {/if}
        </section>
        <section aria-label="Run trajectory diagnostics">
          <h3>Run trajectory</h3>
          {#if trajectory}
            <div class="trajectory-status">
              {#each trajectory.legs as leg}<div class:active-leg={leg.legId === trajectory.activeLegId}><strong>{leg.legId}</strong><span>{leg.status === "not_entered" ? "not entered" : leg.state}</span></div>{/each}
            </div>
          {:else}<p class="honest">This run has no trajectory legs.</p>{/if}
        </section>
        {#if assessmentDetail !== undefined || resistanceDetail.length > 0}
          <section aria-label="Attempt conditions" data-evidence-consumer="inspector.attempt_conditions">
            <h3>Attempt conditions</h3>
            {#if assessmentDetail}<p>{assessmentDetail}</p>{/if}
            {#each resistanceDetail as sentence}<p>{sentence}</p>{/each}
          </section>
        {/if}
        {#if banner !== undefined}
          <section aria-label="Objective change evidence" data-evidence-consumer="inspector.objective_change">
            <h3>Objective change</h3>
            {#each banner.sentences as sentence}<p><strong>{sentence.sourceLabel}</strong> · {sentence.text}</p>{/each}
          </section>
        {/if}
        {#if guardGrounds.length > 0}
          <section aria-label="Post-commit guard evidence" data-evidence-consumer="inspector.postcommit_guard">
            <h3>Post-commit guard evidence</h3>
            {#each guardGrounds as sentence}
              <p><strong>{sentence.sourceLabel}</strong> · {sentence.text}</p>
            {/each}
          </section>
        {/if}
        {#if terminalEvidence.length > 0}
          <section aria-label="Evidence attached to this position" data-evidence-consumer="inspector.position_evidence">
            <h3>Evidence attached to this position</h3>
            {#each terminalEvidence as sentence}
              <p><strong>{sentence.sourceLabel}</strong> · {sentence.text}</p>
            {/each}
          </section>
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if viewportSupport.supported && forkOpen}
  <div class="modal-backdrop">
    <div role="dialog" aria-modal="true" aria-labelledby="fork-title" use:modalBoundary>
      <form class="modal" onsubmit={(event) => { event.preventDefault(); void submitFork(); }}>
        <p>Branch from here</p>
        <h2 id="fork-title">Name the experiment.</h2>
        <label>What are you trying? <textarea bind:this={forkIntentInput} bind:value={forkIntent} disabled={forkBusy} aria-describedby={forkBusy ? "fork-create-busy" : undefined} placeholder="For example: keep the knight and challenge the centre"></textarea></label>
        <label>Short name <input bind:value={forkLabel} disabled={forkBusy} aria-describedby={forkBusy ? "fork-create-busy" : undefined} placeholder="Optional — the move and intent name it automatically" /></label>
        <div><button type="button" onclick={closeFork}>Cancel</button><button class="primary" type="submit" disabled={forkBusy} aria-describedby={forkBusy ? "fork-create-busy" : undefined}>{forkBusy ? "Creating branch…" : "Create branch"}</button></div>
        {#if forkBusy}<span id="fork-create-busy" role="status">Creating this branch from the current position.</span>{/if}
        {#if forkError}<span role="alert">{forkError}</span>{/if}
      </form>
    </div>
  </div>
{/if}

{#if viewportSupport.supported && checkpointPickerOpen}
  <div class="modal-backdrop">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="picker-title" use:modalBoundary>
      <p>Rewind</p><h2 id="picker-title" tabindex="-1" bind:this={pickerHeading}>Choose a checkpoint.</h2>
      <div class="checkpoint-options">
        {#each [...run.events].reverse().filter((event) => event.type === "checkpoint.reached") as event}
          {#if event.type === "checkpoint.reached"}
            <button type="button" onclick={() => { checkpointPickerOpen = false; void rewindRun({ checkpointId: event.data.checkpointId }); }}>
              {checkpointDisplayLabel(event.data.checkpointId)}
            </button>
          {/if}
        {:else}<p>No checkpoint reached yet.</p>{/each}
      </div>
      <button type="button" onclick={closeCheckpointPicker}>Cancel</button>
    </div>
  </div>
{/if}

{#if viewportSupport.supported && openShape}<ShapePanel entry={openShape} onClose={closeShape} onInspect={() => { openShapeId = undefined; shapeInvoker = undefined; inspectorOpen = true; }} />{/if}
{#if viewportSupport.supported && openPivotalNodeId !== undefined && pivotalDialogOpen}
  <div class="modal-backdrop">
    <div class="modal guidance-panel" role="dialog" aria-modal="true" aria-labelledby="pivotal-title" data-evidence-consumer="board.pivotal_marker" use:modalBoundary>
      <p>Pivotal marker</p><h2 id="pivotal-title">Review {openPivotalNode?.moveSan ?? "this moment"}</h2>
      <p class="guidance-sentence">This move changed something concrete. Open the details when you want to inspect the underlying facts.</p>
      <div><button type="button" onclick={() => { pivotalDialogOpen = false; inspectorOpen = true; }}>Open in Inspector</button><button type="button" onclick={() => (pivotalDialogOpen = false)}>Close</button></div>
    </div>
  </div>
{/if}
</div>

<style>
  .drill-region {
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .drill-region.reflow { overflow-y: auto; }

  .viewport-refusal {
    width: min(32rem, calc(100% - 2rem));
    margin: auto;
    padding: 1.25rem;
    border: 1px solid var(--warning);
    border-radius: 1rem;
    background: var(--panel);
  }
  .viewport-refusal p:first-child { color: var(--ink); font: 700 .68rem ui-monospace, monospace; text-transform: uppercase; }
  .viewport-refusal h1 { margin: .35rem 0; font: 500 1.6rem/1.1 var(--display-font); }
  .viewport-refusal p { color: var(--muted); line-height: 1.45; }
  .viewport-refusal button { padding: .65rem .8rem; border: 1px solid var(--line); border-radius: .65rem; background: var(--accent); color: var(--on-accent); }

  .drill {
    --topbar-h: 56px;
    --strip-h: 40px;
    --objective-h: 32px;
    --band-h: 176px;
    --rim-h: 48px;
    --rail-w: 336px;
    --stage-pad: 16px;
    position: relative;
    width: min(90rem, 100%);
    height: 100%;
    margin: 0 auto;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    outline: none;
  }

  .drill.reflow { height: auto; min-height: 100%; overflow: visible; }

  .topbar {
    flex: 0 0 var(--topbar-h);
    height: var(--topbar-h);
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 0 1rem;
  }

  .wordmark,
  .inspector-entry,
  .help {
    width: fit-content;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .wordmark {
    padding: 0;
    font: 600 1.1rem var(--display-font);
  }

  .help {
    justify-self: end;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--line);
    border-radius: 50%;
  }

  .inspector-entry {
    padding: .4rem .65rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--panel);
  }

  .status {
    display: flex;
    gap: 0.5rem;
    color: var(--muted);
    font: 0.68rem ui-monospace, monospace;
    text-transform: uppercase;
  }

  .status span + span::before {
    content: "·";
    margin-right: 0.5rem;
  }

  .status .readonly {
    color: var(--ink);
  }

  .topbar-actions { position:relative; justify-self:end; display:flex; align-items:center; gap:.55rem; }

  .error,
  .operation-status,
  .readonly-banner {
    position: absolute;
    z-index: 12;
    top: calc(var(--topbar-h) + .35rem);
    left: 50%;
    width: min(42rem, calc(100% - 2rem));
    margin: 0;
    transform: translateX(-50%);
    padding: 0.7rem 0.9rem;
    border-radius: 0.7rem;
  }

  .error {
    background: color-mix(in srgb, var(--danger) 12%, var(--panel));
    color: var(--ink);
  }

  .operation-status {
    background: color-mix(in srgb, var(--accent) 12%, var(--panel));
    color: var(--ink);
  }

  .readonly-banner {
    background: color-mix(in srgb, var(--warning) 12%, var(--panel));
  }

  .workspace {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--rail-w);
    grid-template-rows: minmax(0, 1fr);
    gap: 0;
    overflow: hidden;
  }
  .compact-tabs { display: flex; flex: none; gap: .25rem; padding: .5rem; border-bottom: 1px solid var(--line); overflow-x: auto; }
  .compact-tabs button { padding: .4rem .55rem; border: 1px solid var(--line); border-radius: 999px; background: var(--paper); color: inherit; white-space: nowrap; }
  .compact-tabs button.active { border-color: var(--accent); color: var(--accent); }
  .sheet-handle, .sheet-close { display: none; }
  .overlay-caption { margin: 0; padding: 0.65rem; border-radius: 0.65rem; background: var(--surface); font-size: 0.78rem; }
  .overlay-caption p { margin: 0.1rem 0; }
  .ambient { width: 2rem; height: 2rem; border: 1px solid var(--line); border-radius: 999px; background: var(--panel); }

  .position-column {
    width: 100%;
    min-height: 0;
    justify-self: center;
    display: grid;
    grid-template-rows: var(--board-edge) var(--strip-h);
    justify-content: center;
    align-content: center;
    gap: 0;
    padding: var(--stage-pad);
    overflow: hidden;
  }

  .companion-identity { display: grid; gap: .55rem; padding: .75rem; border-bottom: 1px solid var(--line); }

  .objective-copy {
    max-height: 6rem;
    overflow: auto;
  }

  .objective-copy p {
    margin: 0;
    color: var(--accent);
    font: 700 0.65rem ui-monospace, monospace;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .objective-copy h1 {
    max-width: 32ch;
    margin: 0.25rem 0 0;
    font: 500 1.15rem/1.2 var(--display-font);
  }

  .objective-line { display: none; }

  .structural-reading > button,
  .transition-reading > button {
    padding: 0.45rem 0.65rem;
    border: 1px solid var(--line);
    border-radius: 0.55rem;
    background: var(--panel);
    color: inherit;
  }

  .phase-reading { display:flex; flex-wrap:wrap; gap:.35rem .8rem; color:var(--muted); font-size:.72rem; }
  .assistance-control { position:relative; z-index:6; padding:.35rem .55rem; border:1px solid var(--line); border-radius:.6rem; background:var(--panel); font-size:.75rem; }
  .guard-prompt { display:grid; gap:.65rem; margin:0; padding:.65rem; border:1px solid var(--accent); border-radius:.7rem; background:color-mix(in srgb,var(--accent) 9%,var(--panel)); }
  .guard-prompt p { margin:.2rem 0 0; font-size:.78rem; color:var(--muted); }
  .module-seat { display:grid; gap:.35rem; margin:0; padding:.65rem; border:1px solid var(--line); border-radius:.7rem; background:var(--panel); }
  .module-seat p { margin:0; font-size:.78rem; }
  .guard-actions { display:flex; flex:none; gap:.45rem; }
  .rehearsal-guide { display:grid; gap:.45rem; padding:.8rem; border:1px solid var(--accent); border-radius:.8rem; background:color-mix(in srgb,var(--accent) 7%,var(--panel)); }
  .rehearsal-guide > p, .rehearsal-guide h2 { margin:0; }
  .rehearsal-guide > p:first-of-type { color:var(--accent); font:700 .62rem ui-monospace,monospace; letter-spacing:.08em; text-transform:uppercase; }
  .rehearsal-guide h2 { font:600 1.05rem/1.2 var(--display-font); }
  .rehearsal-guide .guide-body { color:var(--muted); font-size:.8rem; line-height:1.4; }
  .rehearsal-guide button { justify-self:start; padding:.55rem .7rem; border:1px solid var(--accent); border-radius:.6rem; background:var(--accent); color:var(--on-accent); }
  .guide-progress { display:grid; grid-template-columns:repeat(4,1fr); gap:.25rem; }
  .guide-progress span { height:.2rem; border-radius:999px; background:var(--line); }
  .guide-progress span.reached { background:var(--accent); }
  .analysis-request { display:grid; gap:.45rem; padding:.75rem; border:1px solid var(--line); border-radius:.8rem; background:var(--panel); }
  .analysis-request > p, .analysis-request h2 { margin:0; }
  .analysis-request > p:first-child { color:var(--accent); font:700 .62rem ui-monospace,monospace; letter-spacing:.08em; text-transform:uppercase; }
  .analysis-request h2 { font:600 1rem/1.2 var(--display-font); }
  .analysis-request > p:not(:first-child) { color:var(--muted); font-size:.76rem; line-height:1.4; }
  .analysis-request-actions { display:flex; flex-wrap:wrap; gap:.4rem; }
  .analysis-request-actions button { padding:.5rem .65rem; border:1px solid var(--line); border-radius:.6rem; background:var(--paper); color:inherit; }
  .analysis-request-actions button:first-child:not(:disabled) { border-color:var(--accent); color:var(--accent); }
  .analysis-ready { color:var(--accent)!important; }
  .evidence-reveal, .support-empty { display:grid; gap:.45rem; padding:.75rem; border:1px solid var(--line); border-radius:.8rem; background:var(--panel); }
  .evidence-reveal p, .support-empty > p, .support-empty h2 { margin:0; }
  .evidence-reveal p, .support-empty > p:last-of-type { color:var(--muted); font-size:.76rem; line-height:1.4; }
  .support-empty > p:first-child { color:var(--accent); font:700 .62rem ui-monospace,monospace; letter-spacing:.08em; text-transform:uppercase; }
  .support-empty h2 { font:600 1rem/1.2 var(--display-font); }
  .support-empty-actions { display:flex; flex-wrap:wrap; gap:.4rem; }
  .evidence-reveal button, .support-empty-actions button { justify-self:start; padding:.5rem .65rem; border:1px solid var(--line); border-radius:.6rem; background:var(--paper); color:inherit; }
  .evidence-reveal button:not(:disabled), .support-empty-actions button.primary:not(:disabled) { border-color:var(--accent); color:var(--accent); }
  .support-menu { position:absolute; top:calc(100% + .4rem); right:0; z-index:4; display:grid; width:min(19rem,calc(100vw - 2rem)); gap:.45rem; padding:.7rem; border:1px solid var(--line); border-radius:.6rem; background:var(--panel); box-shadow:var(--shadow); }
  .support-menu p { margin:0; color:var(--muted); font-size:.75rem; }
  .assistance-control summary { list-style: none; cursor: pointer; }
  .assistance-control summary::-webkit-details-marker { display: none; }
  .preset-pill { display:inline-flex; align-items:center; min-height:2rem; padding:0 .7rem; border:1px solid var(--accent); border-radius:999px; color:var(--accent); font-size:.72rem; font-weight:700; white-space:nowrap; }
  .preset-menu-promise { padding-bottom:.45rem; border-bottom:1px solid var(--line); color:var(--ink) !important; }
  .preset-disclosure { position:sticky; top:0; z-index:2; display:grid; grid-template-columns:auto minmax(0,1fr); gap:.5rem; align-items:baseline; margin:-.65rem -.65rem 0; padding:.55rem .65rem; border-bottom:1px solid var(--line); background:var(--panel); }
  .preset-disclosure strong { color:var(--accent); font-size:.72rem; }
  .preset-disclosure span { min-width:0; color:var(--muted); font-size:.72rem; line-height:1.35; }
  .assistance-grid { display:grid; gap:.55rem; }
  .module-toggles { display:grid; gap:.35rem; margin:.75rem 0 0; padding:.6rem; border:1px solid var(--line); border-radius:.6rem; }
  .module-toggles legend { font-weight:700; font-size:.78rem; }
  .module-toggles .honest { color:var(--muted); font-size:.68rem; }
  .preset-options { display:grid; gap:.35rem; margin:0; padding:0 0 .45rem; border:0; border-bottom:1px solid var(--line); }
  .preset-options legend { padding:0; font-weight:700; font-size:.72rem; }
  .preset-option { display:grid; grid-template-columns:auto minmax(0,1fr); gap:.45rem; align-items:start; min-height:24px; }
  .preset-option span { display:grid; gap:.1rem; }
  .preset-option small { color:var(--muted); font-size:.68rem; line-height:1.3; }
  .preset-suppressions { grid-column:1 / -1; margin:.2rem 0 0; padding-left:1rem; color:var(--muted); font-size:.72rem; line-height:1.35; }
  .assistance-grid .honest { color:var(--muted); font-size:.68rem; }
  .guidance-panel { max-height:min(38rem,calc(100dvh - 2rem)); overflow:auto; }
  .guidance-sentence { color:var(--ink)!important; font:400 .85rem/1.45 var(--display-font)!important; text-transform:none!important; }

  .structural-facts {
    max-height: 8rem;
    margin-top: 0.35rem;
    overflow: auto;
    color: var(--muted);
    font-size: 0.78rem;
  }

  .structural-facts p { margin: 0.2rem 0; }

  .board-slot {
    min-width: 0;
    min-height: 0;
    width: var(--board-edge);
    height: var(--board-edge);
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .board-frame {
    position: relative;
    width: 100%;
    height: 100%;
    aspect-ratio: 1;
    justify-self: center;
    overflow: hidden;
    border-radius: 0.8rem;
    box-shadow: var(--shadow);
  }

  .position-column.outcome .board-frame {
    width: 100%;
    height: 100%;
  }

  .board-frame.previewing {
    opacity: 0.82;
    outline: 3px solid var(--warning);
  }

  .board-frame.checkpoint-paused {
    outline: 3px solid var(--accent);
  }

  .checkpoint-pause {
    position: absolute;
    z-index: 5;
    inset: 50% auto auto 50%;
    width: min(20rem, calc(100% - 2rem));
    transform: translate(-50%, -50%);
    display: grid;
    gap: 0.25rem;
    padding: 0.8rem 1rem;
    border: 1px solid color-mix(in srgb, var(--accent) 65%, var(--line));
    border-radius: 0.8rem;
    background: color-mix(in srgb, var(--panel) 92%, transparent);
    box-shadow: var(--shadow);
    text-align: center;
    pointer-events: none;
  }

  .checkpoint-pause strong {
    color: var(--accent);
    font: 700 0.72rem ui-monospace, monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .checkpoint-pause span {
    font-size: 0.78rem;
  }

  .preview-label {
    position: absolute;
    z-index: 4;
    top: 0.6rem;
    left: 0.6rem;
    padding: 0.3rem 0.5rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--warning) 25%, var(--panel));
    color: var(--ink);
    font: 700 0.65rem ui-monospace, monospace;
    text-transform: uppercase;
  }

  .timeline-strip { width: var(--board-edge); height: var(--strip-h); min-width: 0; overflow: hidden; }
  :global(.timeline-strip .timeline) { height: var(--strip-h); display: grid; grid-template-columns: auto minmax(0,1fr); align-items: center; padding: 0 .3rem; border: 0; border-radius: 0 0 .7rem .7rem; }
  :global(.timeline-strip .timeline-heading) { display: flex; gap: .25rem; align-items: baseline; padding: 0 .35rem; white-space: nowrap; }
  :global(.timeline-strip .timeline-heading h2) { font-size: .68rem; }
  :global(.timeline-strip .timeline-heading span) { font-size: .62rem; }
  :global(.timeline-strip .timeline ol) { height: 100%; margin: 0; padding: .2rem; align-items: center; }
  :global(.timeline-strip .timeline li > button) { min-width: 3rem; padding: .28rem .42rem; }
  :global(.timeline-strip .timeline .confirm) { position: absolute; right: .25rem; bottom: .25rem; margin: 0; padding: .25rem .4rem; }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(7rem, 1fr));
    gap: 0.45rem;
  }
  .quick-actions .action-state { grid-column:1/-1;margin:0;color:var(--muted);font-size:.7rem;line-height:1.35 }
  .quick-actions .action-state.error { color:var(--danger) }

  .rail-stack{min-width:0;min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr);overflow:hidden;border-left:1px solid var(--line);background:var(--panel)}
  .companion-scroll { min-height: 0; display: grid; padding: .65rem; overflow: hidden; }
  .companion-section { min-width: 0; min-height: 0; display: none; gap: .55rem; overflow-y: auto; overscroll-behavior: contain; }
  .companion-section.compact-active { display: grid; }
  .next-member{justify-self:start;padding:.4rem .55rem;border:1px solid var(--line);border-radius:.55rem;background:var(--panel);color:inherit}.group-creator{position:fixed;z-index:24;left:50%;bottom:1rem;width:min(60rem,calc(100% - 2rem));max-height:calc(100dvh - 2rem);transform:translateX(-50%);display:flex;align-items:end;align-content:start;gap:.65rem;flex-wrap:wrap;overflow:auto;overscroll-behavior:contain;padding:.65rem;border:1px solid var(--accent);border-radius:.75rem;background:var(--panel);box-shadow:var(--shadow)}.group-creator p,.group-creator h2{margin:0}.group-creator h2{font:600 1rem var(--display-font)}.group-creator label{display:grid;gap:.2rem;font-size:.7rem;color:var(--muted)}.group-creator select,.group-creator input,.group-creator button{min-height:2rem;padding:.45rem .55rem;border:1px solid var(--line);border-radius:.55rem;background:var(--paper);color:inherit}.capture-help{flex-basis:100%;color:var(--muted);font-size:.72rem}.board-return{flex-basis:auto}.candidate-chips{display:flex;gap:.35rem;flex-wrap:wrap}.creator-actions{display:flex;gap:.35rem}.group-creator .honest{flex-basis:100%;color:var(--muted);font-size:.68rem}
  .mark-controls { display: grid; gap: .35rem; padding: .55rem; border: 1px solid var(--line); border-radius: .65rem; color: var(--muted); font-size: .72rem; }
  .mark-controls label { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
  .mark-controls button, .mark-controls select { padding: .35rem .45rem; border: 1px solid var(--line); border-radius: .45rem; background: var(--paper); color: inherit; }

  .quick-actions button,
  .modal button,
  .modal input,
  .modal textarea {
    padding: 0.65rem 0.75rem;
    border: 1px solid var(--line);
    border-radius: 0.65rem;
    background: var(--panel);
    color: inherit;
  }

  .quick-actions button {
    cursor: pointer;
  }

  kbd {
    margin-left: 0.3rem;
    color: var(--muted);
    font: 0.62rem ui-monospace, monospace;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 25;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: var(--scrim);
    backdrop-filter: blur(6px);
  }

  .modal {
    width: min(30rem, 100%);
    display: grid;
    gap: 0.8rem;
    padding: 1.2rem;
    border-radius: 1rem;
    background: var(--panel);
  }

  .modal p,
  .modal h2 {
    margin: 0;
  }

  .modal p {
    color: var(--accent);
    font: 700 0.65rem ui-monospace, monospace;
    text-transform: uppercase;
  }

  .modal h2 {
    font: 500 1.8rem var(--display-font);
  }

  .modal label {
    display: grid;
    gap: 0.3rem;
    color: var(--muted);
    font-size: 0.8rem;
  }

  .modal textarea {
    min-height: 5rem;
    resize: vertical;
  }

  .modal > div:last-child {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .modal button {
    cursor: pointer;
  }

  .modal button.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
  }

  .checkpoint-options {
    display: grid !important;
    justify-content: stretch !important;
  }

  .trajectory-status {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    padding: 0.55rem;
    border: 1px solid var(--line);
    border-radius: 0.65rem;
  }

  .trajectory-status div { display: grid; padding: 0.3rem 0.5rem; color: var(--muted); }
  .trajectory-status .active-leg { color: var(--ink); background: var(--surface); }
  .trajectory-status span { font-size: 0.72rem; }

  .inspector-backdrop { align-items: stretch; }
  .inspector-surface { width: min(72rem, 100%); max-height: calc(100dvh - 2rem); margin: auto; display: grid; grid-template-rows: auto minmax(0,1fr); border-radius: 1rem; background: var(--panel); overflow: hidden; }
  .inspector-surface > header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--line); }
  .inspector-surface h2, .inspector-surface p { margin: 0; }
  .inspector-surface header p { color: var(--accent); font: 700 .65rem ui-monospace, monospace; text-transform: uppercase; }
  .inspector-surface button { padding: .5rem .65rem; border: 1px solid var(--line); border-radius: .55rem; background: var(--paper); color: inherit; }
  .inspector-grid { min-height: 0; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: .75rem; padding: .75rem; overflow-y: auto; }
  .inspector-grid > section { min-width: 0; padding: .75rem; border: 1px solid var(--line); border-radius: .75rem; background: var(--surface); }
  .inspector-grid h3 { margin: 0 0 .5rem; }

  @media (min-width: 720px) and (max-width: 1023px) {
    .drill {
      --stage-pad: 16px;
    }
    .workspace { grid-template-columns: 1fr; grid-template-rows: minmax(0,1fr) var(--band-h); }
    .position-column { grid-row: 1; grid-template-rows: var(--board-edge) var(--strip-h) var(--objective-h); padding: 0 var(--stage-pad); }
    .objective-line { width: var(--board-edge); height: var(--objective-h); display: grid; grid-template-columns: auto minmax(0,1fr) auto; gap: .5rem; align-items: center; padding: 0 .55rem; border: 0; background: var(--panel); color: inherit; text-align: left; }
    .objective-line span, .objective-line small { color: var(--muted); font: 600 .62rem ui-monospace,monospace; text-transform: uppercase; }
    .objective-line strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .rail-stack { grid-row: 2; grid-template-rows: auto minmax(0,1fr); border-left: 0; border-top: 1px solid var(--line); }
    .companion-identity { display: none; }
    .companion-scroll { overflow: hidden; }
    .companion-section { display: none; height: 100%; overflow-y: auto; }
    .companion-section.compact-active { display: grid; }
  }

  .drill.compact {
      --stage-pad: 8px;
      width: 100%;
  }

  .drill.compact .topbar {
      grid-template-columns: 1fr auto auto;
      padding: 0 .5rem;
  }

  .drill.compact .workspace {
      grid-template-columns: 1fr;
      grid-template-rows: minmax(0, 1fr) var(--rim-h);
  }
  .drill.compact .position-column {
      grid-row: 1;
      grid-template-rows: var(--board-edge) var(--strip-h) var(--objective-h);
      padding: 0 var(--stage-pad);
  }
  .drill.compact .objective-line { width: var(--board-edge); height: var(--objective-h); display: grid; grid-template-columns: auto minmax(0,1fr) auto; gap: .4rem; align-items: center; padding: 0 .45rem; border: 0; background: var(--panel); color: inherit; text-align: left; }
  .drill.compact .objective-line span, .drill.compact .objective-line small { color: var(--muted); font: 600 .58rem ui-monospace,monospace; text-transform: uppercase; }
  .drill.compact .objective-line strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .76rem; }
  .drill.compact .rail-stack { grid-row: 2; grid-template-rows: var(--rim-h) minmax(0,1fr); border: 0; border-top: 1px solid var(--line); }
  .drill.compact .rail-stack.sheet-open { position: fixed; z-index: 20; right: 0; bottom: 0; left: 0; height: min(68dvh, 38rem); grid-template-rows: var(--rim-h) minmax(0,1fr); border-radius: 1rem 1rem 0 0; box-shadow: var(--shadow); }
  .drill.compact .companion-identity { display: none; }
  .drill.compact .compact-tabs { height: var(--rim-h); align-items: center; justify-content: center; padding: .3rem .5rem; border: 0; }
  .drill.compact .sheet-handle { position: absolute; top: .25rem; left: 50%; width: 2.5rem; height: .2rem; transform: translateX(-50%); border-radius: 999px; background: var(--line); }
  .drill.compact .sheet-close { display: none; }
  .drill.compact .sheet-open .sheet-close { display: block; }
  .drill.compact .rail-stack:not(.sheet-open) .companion-scroll { display: none; }
  .drill.compact .companion-scroll { overflow: hidden; }
  .drill.compact .companion-section { display: none; height: 100%; overflow-y: auto; }
  .drill.compact .companion-section.compact-active { display: grid; }

  .drill.reflow .workspace {
    flex: none;
    min-height: calc(var(--board-edge) + var(--strip-h) + var(--objective-h) + var(--rim-h));
    grid-template-rows: auto var(--rim-h);
    overflow: visible;
  }
  .drill.reflow .position-column {
    min-height: calc(var(--board-edge) + var(--strip-h) + var(--objective-h));
    overflow: visible;
  }
  .drill.reflow .group-creator {
    position: static;
    width: calc(100% - 1rem);
    max-height: calc(100dvh - 1rem);
    margin: .5rem auto 1rem;
    transform: none;
  }

  @media (max-width: 719px) {
    .inspector-grid { grid-template-columns: 1fr; }
  }
</style>
