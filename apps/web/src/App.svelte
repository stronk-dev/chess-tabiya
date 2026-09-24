<script lang="ts">
  import "./lib/theme/base.css";

  import { onDestroy, onMount, tick, untrack } from "svelte";
  import { DRILL_PACK_SCHEMA_VERSION } from "@chess-tabiya/schema";
  import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";

  import DrillScreen from "./lib/DrillScreen.svelte";
  import Chessboard from "./lib/Chessboard.svelte";
  import PackList from "./lib/PackList.svelte";
  import JustPlayStarter from "./lib/JustPlayStarter.svelte";
  import ReviewMapScreen from "./lib/ReviewMapScreen.svelte";
  import { learnerMoveCount, rehearsalTurnCount } from "./lib/chronology-copy.js";
  import { attemptVerdictLabel, chessSideLabel, corpusPopulationLabel, difficultRootCountSentence, difficultRootRuleSentence, DUE_FREQUENCY_ORDER_NOTE, dueFrequencySentence, dueVariationSentence, dueWaitingSentence, repertoireGapStateLabel, RETURN_STANDING_EXPLANATION } from "./lib/learner-copy.js";
  import { packPhaseCopy } from "./lib/pack-catalog.js";
  import { objectiveStateLabel } from "./lib/run-copy.js";
  import { validAuthenticatedLearner } from "./lib/auth-response.js";
  import { validDistilledDraft } from "./lib/distill-response.js";
  import { validPackDraftIdentity } from "./lib/pack-draft-response.js";
  import { validRegisteredShapeIdentity, validShapeDraftIdentity, validShapeValidation } from "./lib/shape-draft-response.js";
  import { progressRecommendationSentence } from "./lib/progress-response.js";
  import RatingScreen from "./lib/RatingScreen.svelte";
  import CohortStanding from "./lib/CohortStanding.svelte";
  import ShellFrame from "./lib/ShellFrame.svelte";
  import ShellKeyboardHelp from "./lib/ShellKeyboardHelp.svelte";
  import AssistanceSettings from "./lib/AssistanceSettings.svelte";
  import StatusAnnouncement from "./lib/StatusAnnouncement.svelte";
  import AppearanceSettings from "./lib/AppearanceSettings.svelte";
  import DistillDraftForm from "./lib/DistillDraftForm.svelte";
  import PackProvenanceEditor from "./lib/PackProvenanceEditor.svelte";
  import ShapePlanSignatureEditor from "./lib/ShapePlanSignatureEditor.svelte";
  import PackVocabularyEditor from "./lib/PackVocabularyEditor.svelte";
  import CreateSeedChooser from "./lib/CreateSeedChooser.svelte";
  import { authoringSlug, clonePackForAuthoring, positionPackScaffold } from "./lib/pack-authoring-seeds.js";
  import { ThemeController } from "./lib/theme/controller.js";
  import { provideTheme } from "./lib/theme/context.js";
  import {
    DrillApi,
    PLANNED_SURFACES,
    type Capabilities,
    type DrillClientApi,
    type PackSummary,
    type RunSummary,
    type RunPage,
    type SurfaceId,
    type Learner,
    type ProgressAttempt,
    type ProgressSchedule,
    type DueSchedule,
    type DifficultRootPage,
    type RelatedProgressAttempt,
    type PackDraft,
    type PackValidation,
    type ShapeDraft,
    type ShapeSummary,
    type PrincipleSummary,
    type LiveSession,
    type LiveSessionSummary,
    type LiveSessionDetail,
    type VoteTally,
    type SessionJournalEntry,
    type SessionKind,
    type BoardControl,
    type ReviewMap,
    type StoryShare,
    type CreatedStoryShare,
    type ProgressMilestone,
    type RunDerivationPage,
    type RepertoireSummary,
    type RepertoireGapPage,
    type ProgressRecommendation,
    type ProgressRecommendationPage,
    type ClassroomSummary,
    type ClassroomDetail,
    type AssignedPack,
    type DeletionPreview,
    ApiError,
  } from "./lib/api.js";
  import { HistoryRouter, routePath, routeTitle, type AppRoute } from "./lib/router.js";
  import { ShellKeyboardDispatcher } from "./lib/keyboard.js";
  import {
    DrillSessionController,
    type DrillSessionState,
  } from "./lib/session-controller.js";
  import { WriterSession, type KeyValueStorage } from "./lib/writer-session.js";
  import { assertStoryForkResponse, assertStoryRewindResponse } from "./lib/story-reentry-response.js";
  import { assertRunDeletionPreview } from "./lib/run-deletion-preview.js";
  import { assertRunPageResponse, legacyRunPage } from "./lib/run-page-response.js";
  import { assertCreatedStoryShare, assertRevokedStoryShare, assertStoryShares } from "./lib/story-response.js";
  import { assertReviewAnalysisResponse, assertReviewMapResponse } from "./lib/review-response.js";
  import { voteAttribution } from "./lib/live-vote.js";
  import { liveOverlayObjectiveCopy } from "./lib/live-overlay.js";
  import { LIVE_WORKFLOWS, liveBoardControlOptions, liveRunIneligibility, liveWorkflow, liveWorkflowOption, type LiveWorkflow } from "./lib/live-creation.js";
  import { repertoireEntryDecision } from "./lib/repertoire-entry.js";
  import { markAttribution, relayedMarkShapes } from "./lib/live-marks.js";
  import { clearAccountLocalData, clearRunLocalData } from "./lib/account-local-data.js";
  import { loadWorkflowPreference, requestedAssistanceConfig } from "./lib/assistance-preference.js";
  import { graduationEntries, requiredFieldStates, splitValidationIssues } from "./lib/pack-validation-presentation.js";
  import { importFailureCopy } from "./lib/import-presentation.js";
  import { assertFlipResponse } from "./lib/flip-response.js";
  import {
    arenaLegState,
    classroomRoleLabel,
    classroomStateLabel,
    invitationStateLabel,
    liveLegalMoveChoices,
    liveRoleLabel,
    proposalStateLabel,
    runSessionKindLabel,
    sessionJournalLabel,
    voteStateLabel,
  } from "./lib/live-copy.js";

  type ShapeCorpusMatch = NonNullable<ShapeDraft["validation"]["corpusPreview"]>["matches"][number];

  interface Props {
    api?: DrillClientApi;
    router?: HistoryRouter;
    storage?: KeyValueStorage;
  }

  let {
    api: apiProp,
    router: routerProp,
    storage: storageProp,
  }: Props = $props();

  const api = untrack(
    () => apiProp ?? new DrillApi(import.meta.env.VITE_API_URL ?? ""),
  );
  const router = untrack(() => routerProp ?? new HistoryRouter());
  const storage = untrack(() => storageProp);
  const FIRST_REHEARSAL_RUN_KEY = "tabiya.first-rehearsal.v1.run";
  function applicationStorage(): KeyValueStorage | undefined {
    if (storage !== undefined) return storage;
    try { return globalThis.localStorage; } catch { return undefined; }
  }
  function storedFirstRehearsalRunId(): string | undefined {
    const value = applicationStorage()?.getItem(FIRST_REHEARSAL_RUN_KEY);
    return value === null || value === undefined || value === "" ? undefined : value;
  }
  let firstRehearsalRunId: string | undefined = $state(storedFirstRehearsalRunId());
  let startingFirstRehearsal = false;
  const themeController = provideTheme(new ThemeController(storage));
  const MIN_LIVE_VOTE_OPTIONS = 2;
  const MAX_LIVE_VOTE_OPTIONS = 8;
  const MIN_LIVE_VOTE_SECONDS = 15;
  const MAX_LIVE_VOTE_SECONDS = 600;

  class LearnerRouteError extends Error {}

  const controller = new DrillSessionController(api, {
    ...(storage === undefined ? {} : { storage }),
    onRunStarted: ({ runId }) => {
      if (startingFirstRehearsal) {
        firstRehearsalRunId = runId;
        applicationStorage()?.setItem(FIRST_REHEARSAL_RUN_KEY, runId);
      }
      router.navigate(routePath({ name: "run", runId }));
    },
  });
  let route: AppRoute = $state(router.route);
  let session: DrillSessionState = $state(controller.state);
  let packs: readonly PackSummary[] = $state([]);
  let relatedPack: DrillPackDefinition | undefined = $state();
  let runs: readonly RunSummary[] = $state([]);
  let runDeletion = $state<{ readonly run: RunSummary; readonly preview: DeletionPreview } | undefined>();
  let runDeletionError = $state<string | undefined>();
  let runDeletionBusy: { readonly kind: "preview" | "confirm"; readonly runId: string } | undefined = $state();
  let runDeletionGeneration = 0;
  let runArtifactError: { readonly runId: string; readonly text: string } | undefined = $state();
  let runArtifactBusyId: string | undefined = $state();
  let runArtifactGeneration = 0;
  let attempts: readonly ProgressAttempt[] = $state([]);
  let dueSchedules: readonly DueSchedule[] = $state([]);
  const EMPTY_DUE_QUEUE = Object.freeze({ schedules: Object.freeze([]), waiting: 0, intakeLimit: 20 });
  const EMPTY_DIFFICULT_ROOTS: DifficultRootPage = Object.freeze({ threshold: 3, total: 0, roots: Object.freeze([]) });
  let dueWaiting = $state(0);
  let dueIntakeLimit = $state(20);
  let difficultRoots: DifficultRootPage = $state(EMPTY_DIFFICULT_ROOTS);
  let returnActionError: string | undefined = $state();
  let milestones: readonly ProgressMilestone[] = $state([]);
  let derivations: RunDerivationPage | undefined = $state();
  let drafts: readonly PackDraft[] = $state([]);
  let studioJson = $state("");
  let selectedDraftId: string | undefined = $state();
  let studioActionError: string | undefined = $state();
  let studioMutationBusy: { readonly kind: "create" | "save" | "playtest" | "register" | "withdraw"; readonly draftId?: string } | undefined = $state();
  let studioMutationGeneration = 0;
  let packBufferValidation: PackValidation | undefined = $state();
  let packLintState: "idle" | "waiting" | "checking" | "ready" | "invalid_json" | "error" | "unavailable" = $state("idle");
  let packLintError: string | undefined = $state();
  let packLintGeneration = 0;
  let withdrawConfirmId: string | undefined = $state();
  let createSeedBusy = $state(false);
  let createSeedError: string | undefined = $state();
  let createSeedPreparation: { readonly runId: string; readonly writerId: string; readonly packId: string; readonly title: string; readonly branchId: string } | undefined = $state();
  let createSeedGeneration = 0;
  let shapeDrafts: readonly ShapeDraft[] = $state([]);
  let authoringShapes: readonly ShapeSummary[] = $state([]);
  let authoringPrinciples: readonly PrincipleSummary[] = $state([]);
  let shapeStudioJson = $state("");
  let selectedShapeDraftId: string | undefined = $state();
  let shapeProbeFen = $state("");
  let shapeProbeResult: boolean | undefined = $state();
  let shapeBufferValidation: ShapeDraft["validation"] | undefined = $state();
  let shapeLintState: "idle" | "waiting" | "checking" | "ready" | "invalid_json" | "error" | "unavailable" = $state("idle");
  let shapeLintError: string | undefined = $state();
  let shapeLintGeneration = 0;
  let selectedShapeCorpusMatch: ShapeCorpusMatch | undefined = $state();
  let shapeActionError: string | undefined = $state();
  let shapeMutationBusy: { readonly kind: "create" | "save" | "probe" | "register"; readonly draftId?: string } | undefined = $state();
  let shapeMutationGeneration = 0;
  let selectedShapeDraft = $derived(shapeDrafts.find((candidate) => candidate.id === selectedShapeDraftId));
  let selectedShapeRegistrationBlock = $derived(shapeRegistrationBlockReason(selectedShapeDraft));
  let distillDraftRunId: string | undefined = $state();
  let distillDraftBusy = $state(false);
  let distillDraftError: string | undefined = $state();
  let distillGeneration = 0;
  let liveSessions: readonly LiveSessionSummary[] = $state([]);
  let classrooms: readonly ClassroomSummary[] = $state([]);
  let classroomDetail: ClassroomDetail | undefined = $state();
  let assignedPacks: readonly AssignedPack[] = $state([]);
  let assignmentRunSelection: Readonly<Record<string,string>> = $state({});
  let submissionIntent: {readonly assignmentId:string;readonly runId:string}|undefined = $state();
  let classroomName = $state("");
  let classroomInviteHandle = $state("");
  let classroomInviteRole: "teacher" | "learner" = $state("learner");
  let assignmentPackId = $state("");
  let assignmentNote = $state("");
  let assignmentDueAt = $state("");
  let classroomBusy: string | undefined = $state();
  let classroomActionError: string | undefined = $state();
  let assignmentBusy: string | undefined = $state();
  let assignmentActionError: string | undefined = $state();
  let classroomDetailGeneration = 0;
  let classroomActionGeneration = 0;
  let assignmentActionGeneration = 0;
  let liveDetail: LiveSessionDetail | undefined = $state();
  let activeLiveDetail: LiveSessionDetail | undefined = $state();
  let liveJournal: readonly SessionJournalEntry[] = $state([]);
  let liveKind: SessionKind = $state("academy");
  let liveBoardControl: BoardControl = $state("host_directed");
  let liveTitle = $state("Training session");
  let liveRotationHandles = $state("");
  let liveCreateBusy = $state(false);
  let liveCreateError: string | undefined = $state();
  let liveCreateUncertain = $state(false);
  let liveClassroomId = $state("");
  let liveScheduledFor = $state("");
  let liveProposalMove = $state("");
  let liveMoveFormNodeId: string | undefined = $state();
  let liveMemberHandle = $state("");
  let liveMemberRole: "participant" | "spectator" = $state("participant");
  let liveOfferHandle = $state("");
  let liveReclaimIntent = $state(false);
  let liveVotePrompt = $state("Which continuation?");
  let liveVoteDuration = $state(60);
  let liveVoteOptions = $state([{ moveUci: "", label: "" }, { moveUci: "", label: "" }]);
  let liveVoteAppliedMove = $state("");
  let liveVoteStatus: string | undefined = $state();
  let liveInviteHandle = $state("");
  let liveInviteUrl = $state("");
  let liveInviteLeg: 1 | 2 = $state(1);
  let liveArenaLeg: 1 | 2 = $state(1);
  let liveArenaPgn = $state("");
  let liveMatchWhite = $state("");
  let liveMatchBlack = $state("");
  let liveJoinHandle = $state("");
  let liveJoinSlot: "white" | "black" = $state("black");
  let liveJoinUrl = $state("");
  let liveWatchUrl = $state("");
  let liveSessionActionBusy: { readonly kind: "propose" | "resolve-proposal" | "member" | "offer-board" | "reclaim" | "advance-rotation" | "open-vote" | "cast-vote" | "close-vote" | "invite" | "import-leg" | "match" | "friend-link" | "watch-link"; readonly sessionId: string; readonly target?: string } | undefined = $state();
  let liveSessionActionError: string | undefined = $state();
  let liveSessionActionGeneration = 0;
  let activeMatchActionBusy: { readonly sessionId:string;readonly runId:string;readonly op:"propose_pause"|"accept_pause"|"withdraw_pause"|"pause"|"resume" } | undefined = $state();
  let activeMatchActionError:string|undefined=$state();
  let activeMatchActionGeneration=0;
  let liveAudiencePreview = $state(false);
  let liveOverlayCopyStatus: string | undefined = $state();
  let importPgn = $state("");
  let importUrl = $state("");
  let importSide: "white" | "black" = $state("white");
  let importError: string | undefined = $state();
  let importNotice: string | undefined = $state();
  let importBusy = $state(false);
  let importPreparation: { readonly runId: string; readonly writerId: string } | undefined = $state();
  let importGeneration = 0;
  let story: ReviewMap | undefined = $state();
  let storyShares: readonly StoryShare[] = $state([]);
  // rfc/review-map.md §4: a Compare handoff from the review, opened by the shipped N-way compare once
  // the run screen has loaded that run. Consumed exactly once.
  let pendingReviewCompare: { readonly runId: string; readonly branchIds: readonly string[] } | undefined;
  let capabilities: Capabilities | undefined = $state();
  let routeLoading = $state(true);
  let routeHasLoaded = false;
  let routeError: string | undefined = $state();
  let shellHelpOpen = $state(false);
  let learner: Learner | undefined = $state();
  let authLoading = $state(true);
  let authError: string | undefined = $state();
  let authHandle = $state("");
  let authPassword = $state("");
  let authRegister = $state(false);
  let authBusy = $state(false);
  let pendingPackId: string | undefined = $state();
  let authNotice: string | undefined = $state();
  let authGeneration = 0;
  let appMounted = true;
  let routerStarted = false;
  const onUnauthenticated = (): void => {
    controller.stopSession();
    learner = undefined;
    void loadPublicRoute(route);
  };
  let shellHelpReturnFocus: HTMLElement | undefined;
  let unsubscribeController: (() => void) | undefined;
  let unsubscribeRouter: (() => void) | undefined;
  let loadGeneration = 0;
  let liveRefreshGeneration = 0;
  let storyRefreshGeneration = 0;
  let storyShareGeneration = 0;
  let livePoll: ReturnType<typeof setInterval> | undefined;
  let storyPoll: ReturnType<typeof setInterval> | undefined;
  let autoClaimingMatch = false;
  let repertoires:readonly RepertoireSummary[]=$state([]);
  let repertoirePages:Record<string,RepertoireGapPage>=$state({});
  let repertoireName=$state("");
  let repertoireSide:"white"|"black"=$state("black");
  let repertoirePgn=$state("");
  let repertoireStudyUrl=$state("");
  let repertoireTargetElo=$state(1600);
  let repertoireCoverageDenominator=$state(100);
  let repertoireError:string|undefined=$state();
  let repertoireMutationBusy:string|undefined=$state();
  let repertoireScanBusy:string|undefined=$state();
  let repertoireEntryBusy:string|undefined=$state();
  let repertoireDeleteIntent:string|undefined=$state();
  let repertoireAnswerBusy:string|undefined=$state();
  let repertoireAnswerErrors:Record<string,string>=$state({});
  let repertoireScanErrors:Record<string,string>=$state({});
  let repertoireEntryErrors:Record<string,string>=$state({});
  let repertoireMutationGeneration=0;
  let repertoireScanGeneration=0;
  let repertoireEntryGeneration=0;
  let repertoireAnswerGeneration=0;
  let recommendations:readonly ProgressRecommendation[]=$state([]);
  let recommendationSelection:ProgressRecommendationPage["selection"]=$state({shown:0,total:0});
  let runSelection:RunPage["selection"]=$state({shown:0,total:0});
  let runPageBusy=$state(false);
  let runPageError:string|undefined=$state();
  let relatedAttempts: Record<string, { readonly status: "loading" | "loaded" | "error"; readonly items: readonly RelatedProgressAttempt[]; readonly message?: string }> = $state({});
  const relatedAttemptGenerations = new Map<string, number>();
  let scheduleDismissBusy: string | undefined = $state();
  let scheduleDismissErrors: Record<string, string> = $state({});
  let scheduleDismissGeneration = 0;

  let activeRepertoireGap = $derived.by(() => {
    const runId=session.runState?.run.id;
    if(runId===undefined)return undefined;
    for(const repertoire of repertoires){
      const page=repertoirePages[repertoire.id];
      const gap=page?.scan===null||page?.scan===undefined?undefined:[...page.scan.gaps,...page.scan.alternateGaps].find((candidate)=>candidate.runId===runId);
      if(gap!==undefined)return {repertoireId:repertoire.id,repertoireName:repertoire.name,repertoireDigest:repertoire.digest,gap};
    }
    return undefined;
  });

  const keyboardDispatcher = new ShellKeyboardDispatcher({
    navigate,
    focusPrimaryNavigation,
    openHelp: openShellHelp,
    closeHelp: closeShellHelp,
    helpIsOpen: () => shellHelpOpen,
  });

  let recentRun = $derived(runs[0]);
  let liveMoveChoices = $derived(liveDetail === undefined ? [] : liveLegalMoveChoices(liveDetail.activeFen));
  let phaseStarters = $derived(
    (["opening", "middlegame", "endgame"] as const).flatMap((phase) => {
      const pack = packs.find((candidate) => candidate.phase === phase);
      return pack === undefined ? [] : [pack];
    }),
  );
  let firstRehearsalPack = $derived(
    packs.find((pack) => pack.id === "conversion-up-a-piece") ?? phaseStarters[0],
  );
  let openAssignments = $derived(assignedPacks.filter((assignment) => assignment.withdrawnAt === null));
  let completedAssignmentOffers = $derived.by(() => {
    if (route.name !== "run" || session.viewer?.role !== "host" || session.runState === undefined) return [] as readonly AssignedPack[];
    const completed = session.runState.run.events.some((event) => event.type === "outcome.reached");
    if (!completed) return [] as readonly AssignedPack[];
    return assignedPacks.filter((assignment) =>
      assignment.withdrawnAt === null &&
      assignment.packId === session.runState!.run.packId &&
      !assignment.submissions.some((submission) => submission.runId === session.runState!.run.id && submission.withdrawnAt === null),
    );
  });
  let selectedPackDraft = $derived(drafts.find((candidate) => candidate.id === selectedDraftId));
  let displayedPackValidation = $derived(packBufferValidation ?? selectedPackDraft?.validation);
  let packRequiredFields = $derived(requiredFieldStates(studioJson));
  let packValidationSections = $derived(splitValidationIssues(displayedPackValidation?.issues ?? []));
  let packGraduationEntries = $derived(graduationEntries(studioJson));
  let blockingGraduationEntries = $derived(packGraduationEntries?.filter((entry) => entry.state === "blocking") ?? []);
  let selectedPackRegistrationBlock = $derived(registrationBlockReason(selectedPackDraft));
  let runContext = $derived(
    route.name === "run" && session.runState
      ? {
          title: (session.pack?.title as string | undefined) ?? "Just Play",
          access: session.runState.access,
          busy: session.busy,
        }
      : undefined,
  );

  $effect(() => {
    const nodeId = liveDetail?.activeNodeId;
    if (nodeId === liveMoveFormNodeId) return;
    liveMoveFormNodeId = nodeId;
    liveProposalMove = "";
    liveVoteOptions = [{ moveUci: "", label: "" }, { moveUci: "", label: "" }];
  });

  $effect(() => {
    const draft = selectedPackDraft;
    const documentText = studioJson;
    if (route.name !== "create" || draft?.state !== "draft") {
      packBufferValidation = undefined;
      packLintError = undefined;
      packLintState = "idle";
      return;
    }
    if (api.lintPackDraft === undefined) {
      packBufferValidation = undefined;
      packLintError = "Live validation is unavailable in this deployment.";
      packLintState = "unavailable";
      return;
    }
    const generation = ++packLintGeneration;
    packBufferValidation = undefined;
    packLintError = undefined;
    packLintState = "waiting";
    const timer = setTimeout(() => void (async () => {
      let document: unknown;
      try {
        document = JSON.parse(documentText);
      } catch (error) {
        if (generation !== packLintGeneration) return;
        packLintState = "invalid_json";
        packLintError = `JSON is not valid: ${error instanceof Error ? error.message : String(error)}`;
        return;
      }
      packLintState = "checking";
      try {
        const validation = await api.lintPackDraft!(draft.id, document);
        if (generation !== packLintGeneration) return;
        packBufferValidation = validation;
        packLintState = "ready";
      } catch (error) {
        if (generation !== packLintGeneration) return;
        packLintState = "error";
        packLintError = `Validation check failed: ${error instanceof Error ? error.message : String(error)}`;
      }
    })(), 300);
    return () => {
      clearTimeout(timer);
      if (generation === packLintGeneration) packLintGeneration += 1;
    };
  });

  $effect(() => {
    const draftId = selectedShapeDraftId;
    const documentText = shapeStudioJson;
    const probeFen = shapeProbeFen;
    if (route.name !== "create" || draftId === undefined) {
      shapeBufferValidation = undefined;
      shapeLintError = undefined;
      shapeLintState = "idle";
      selectedShapeCorpusMatch = undefined;
      return;
    }
    if (api.lintShapeDraft === undefined) {
      shapeBufferValidation = undefined;
      shapeLintError = "Live shape validation is unavailable in this deployment.";
      shapeLintState = "unavailable";
      return;
    }
    const generation = ++shapeLintGeneration;
    shapeBufferValidation = undefined;
    shapeLintError = undefined;
    shapeLintState = "waiting";
    const timer = setTimeout(() => void (async () => {
      let document: unknown;
      try {
        document = JSON.parse(documentText);
      } catch (error) {
        if (generation !== shapeLintGeneration) return;
        shapeLintState = "invalid_json";
        shapeLintError = `JSON is not valid: ${error instanceof Error ? error.message : String(error)}`;
        return;
      }
      shapeLintState = "checking";
      try {
        const validation = await api.lintShapeDraft!(draftId, document, probeFen);
        if (!validShapeValidation(validation)) throw new Error("Invalid shape validation response");
        if (generation !== shapeLintGeneration) return;
        shapeBufferValidation = validation;
        shapeProbeResult = validation.probeMatches;
        const current = selectedShapeCorpusMatch;
        if (current !== undefined && !validation.corpusPreview?.matches.some((match) => match.packId === current.packId && match.ply === current.ply && match.fen === current.fen)) selectedShapeCorpusMatch = undefined;
        shapeLintState = "ready";
      } catch {
        if (generation !== shapeLintGeneration) return;
        shapeLintState = "error";
        shapeLintError = "Shape validation could not finish. Your editor bytes are unchanged; try again.";
      }
    })(), 300);
    return () => {
      clearTimeout(timer);
      if (generation === shapeLintGeneration) shapeLintGeneration += 1;
    };
  });

  function navigate(path: string): void {
    if (shellHelpOpen) closeShellHelp();
    router.navigate(path);
  }

  async function startFirstRehearsal(packId: string): Promise<void> {
    startingFirstRehearsal = true;
    try {
      await controller.startPack(packId);
    } finally {
      startingFirstRehearsal = false;
    }
  }

  function completeFirstRehearsal(): void {
    firstRehearsalRunId = undefined;
    applicationStorage()?.setItem(FIRST_REHEARSAL_RUN_KEY, "");
  }

  function focusPrimaryNavigation(): void {
    document.querySelector<HTMLElement>("#primary-navigation a")?.focus();
  }

  function openShellHelp(): void {
    shellHelpReturnFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : undefined;
    shellHelpOpen = true;
  }

  function closeShellHelp(): void {
    shellHelpOpen = false;
    const target = shellHelpReturnFocus;
    shellHelpReturnFocus = undefined;
    void tick().then(() => target?.focus());
  }

  function boardStance(run: RunSummary): "you" | "someone-else" | "unclaimed" {
    if (run.leaseHeldBy.handle === "__legacy") return "unclaimed";
    return run.leaseHeldBy.learnerId === learner?.id ? "you" : "someone-else";
  }

  function readableDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
  }

  function packTitle(packId:string):string{return packs.find((pack)=>pack.id===packId)?.title??"Unavailable rehearsal";}
  function runTitle(run:RunSummary):string{return run.packId!==null&&run.title===run.packId?packTitle(run.packId):run.title;}
  function isOverdue(dueAt:string|null):boolean{return dueAt!==null&&Date.parse(dueAt)<Date.now();}
  function classroomMemberHandle(learnerId:string):string{return classroomDetail?.members.find((member)=>member.learnerId===learnerId)?.handle??"former member";}
  function assignmentSubmissions(assignmentId:string,learnerId:string){return classroomDetail?.submissions.filter((submission)=>submission.assignmentId===assignmentId&&submission.learnerId===learnerId)??[];}
  function chooseAssignmentRun(assignmentId:string,runId:string):void{assignmentRunSelection={...assignmentRunSelection,[assignmentId]:runId};}
  function prepareAssignedRun(assignmentId:string):void{const runId=assignmentRunSelection[assignmentId];if(runId)submissionIntent={assignmentId,runId};}
  async function confirmAssignedRun():Promise<void>{const intent=submissionIntent;if(!intent)return;const submitted=await submitAssignedRun(intent.assignmentId,intent.runId);if(submitted&&submissionIntent?.assignmentId===intent.assignmentId&&submissionIntent.runId===intent.runId)submissionIntent=undefined;}
  function reviewRailCopy(state: NonNullable<typeof session.viewer>["reviewRail"]): string {
    if (state === "open") return "This submitted attempt is complete. You receive the same disclosed evidence, human-model split, corpus and narration rail as its learner.";
    if (state === "closed_incomplete") return "Review tools open after this attempt reaches its recorded outcome. Read access remains available now.";
    if (state === "closed_live_session") return "Review tools are closed while this run has an open live session. Read access remains available; close the session to restore the submitted review rail.";
    if (state === "closed_shared_not_submitted") return "This run was shared directly, not submitted through an assignment. Read access is available, but the human-model split, corpus and narration review tools are not granted.";
    return "";
  }
  function liveTurnLabel(item: LiveSessionSummary): string {
    const player = item.board.players?.[item.board.sideToMove];
    return player === null || player === undefined
      ? `${item.board.sideToMove === "white" ? "White" : "Black"} to move`
      : `@${player.handle} to move`;
  }
  function liveKindLabel(kind: SessionKind): string {
    if (kind === "academy") return "Academy lesson";
    if (kind === "stream") return "Stream session";
    return "Match session";
  }
  function liveBoardControlLabel(control: BoardControl): string {
    if (control === "host_directed") return "Host directs the board";
    if (control === "free_claim") return "Participants may claim the board";
    if (control === "rotation") return "Board follows the rotation";
    return "Two players share the match board";
  }
  function liveSessionPurpose(kind: SessionKind): string {
    if (kind === "academy") return "Teach on one shared run: hand over the board, collect proposals and marks, then open the board to rewind, branch, compare, and return without discarding the original line.";
    if (kind === "stream") return "Commit a line, play its consequence, rewind, fork, and compare in front of your audience. Attributed marks, proposals, polls, and the viewer overlay stay attached to that shared rehearsal.";
    return "Play one preserved main line. Pause explicitly before opening rehearsal tools, then branch and compare without replacing the played game.";
  }

  function liveOverlayUrl(runId: string): string {
    const path = routePath({ name: "live-overlay", runId });
    return typeof location === "undefined" ? path : new URL(path, location.href).href;
  }

  async function copyLiveOverlayUrl(runId: string): Promise<void> {
    const url = liveOverlayUrl(runId);
    if (navigator.clipboard === undefined) {
      liveOverlayCopyStatus = "Clipboard access is unavailable here. Select and copy the URL above.";
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      liveOverlayCopyStatus = "Overlay URL copied.";
    } catch {
      liveOverlayCopyStatus = "The browser refused clipboard access. Select and copy the URL above.";
    }
  }

  function relatedAttemptKey(attempt: ProgressAttempt): string {
    return `${attempt.runId}\0${attempt.branchId}`;
  }

  function relatedAttemptLabel(relation: RelatedProgressAttempt["relation"]): string {
    if (relation === "same_position") return "Same position";
    if (relation === "same_pack") return "Same pack, different position";
    return "Same idea in this pack";
  }

  function relatedAttemptRequestIsCurrent(key:string,generation:number,action:number):boolean {
    return appMounted&&route.name==="learn"&&generation===loadGeneration&&relatedAttemptGenerations.get(key)===action;
  }

  function validRelatedProgress(value:unknown):value is readonly RelatedProgressAttempt[] {
    return Array.isArray(value)&&value.length<=3&&value.every((item)=>{
      if(typeof item!=="object"||item===null)return false;
      const candidate=item as Partial<RelatedProgressAttempt>;
      return (candidate.relation==="same_position"||candidate.relation==="same_pack"||candidate.relation==="same_concept_in_pack")
        &&typeof candidate.runId==="string"&&candidate.runId.length>0
        &&typeof candidate.branchId==="string"&&candidate.branchId.length>0
        &&Number.isInteger(candidate.attemptCount)&&candidate.attemptCount!==undefined&&candidate.attemptCount>=0;
    });
  }

  async function toggleRelatedAttempts(attempt: ProgressAttempt): Promise<void> {
    const key = relatedAttemptKey(attempt);
    const existing=relatedAttempts[key];
    if (existing?.status === "loading" || existing?.status === "loaded") {
      relatedAttemptGenerations.set(key,(relatedAttemptGenerations.get(key)??0)+1);
      const { [key]: _closed, ...remaining } = relatedAttempts;
      relatedAttempts = remaining;
      return;
    }
    const generation=loadGeneration;
    const action=(relatedAttemptGenerations.get(key)??0)+1;
    relatedAttemptGenerations.set(key,action);
    relatedAttempts = { ...relatedAttempts, [key]: { status: "loading", items: [] } };
    try {
      if (api.relatedProgress === undefined) throw new Error("Related attempts are unavailable");
      const graph = await api.graph(attempt.runId);
      if(!relatedAttemptRequestIsCurrent(key,generation,action))return;
      if(graph.id!==attempt.runId)throw new Error("Crossed run graph");
      const branch = graph.branches.find((candidate) => candidate.id === attempt.branchId);
      if (branch === undefined) throw new Error("The recorded branch is no longer available");
      const items = await api.relatedProgress(attempt.runId, branch.forkNodeId);
      if(!validRelatedProgress(items))throw new Error("Invalid related-attempt response");
      if(!relatedAttemptRequestIsCurrent(key,generation,action))return;
      relatedAttempts = { ...relatedAttempts, [key]: { status: "loaded", items } };
    } catch {
      if(!relatedAttemptRequestIsCurrent(key,generation,action))return;
      relatedAttempts = {
        ...relatedAttempts,
        [key]: { status: "error", items: [], message: "Related attempts could not be loaded. This attempt is unchanged; try again." },
      };
    }
  }

  async function dismissDueSchedule(schedule:ProgressSchedule):Promise<void>{
    if(scheduleDismissBusy!==undefined)return;
    const generation=loadGeneration;
    const action=++scheduleDismissGeneration;
    scheduleDismissBusy=schedule.id;
    const { [schedule.id]: _previous, ...remainingErrors }=scheduleDismissErrors;
    scheduleDismissErrors=remainingErrors;
    try{
      if(api.dismissSchedule===undefined)throw new Error("unavailable");
      await api.dismissSchedule(schedule.id);
      if(generation===loadGeneration&&route.name==="learn"&&action===scheduleDismissGeneration){
        dueSchedules=dueSchedules.filter((item)=>item.id!==schedule.id);
      }
    }catch{
      if(generation===loadGeneration&&route.name==="learn"&&action===scheduleDismissGeneration){
        scheduleDismissErrors={...scheduleDismissErrors,[schedule.id]:"This return could not be dismissed. It remains in your queue; try again."};
      }
    }finally{
      if(action===scheduleDismissGeneration&&scheduleDismissBusy===schedule.id)scheduleDismissBusy=undefined;
    }
  }

  async function startDueSchedule(schedule: ProgressSchedule): Promise<void> {
    returnActionError = undefined;
    if (schedule.packId !== null) {
      await controller.startPack(schedule.packId, schedule.id);
      return;
    }
    if (schedule.sourceRunId === null) {
      returnActionError = "This position return no longer has a source run to duplicate.";
      return;
    }
    await controller.startDuplicate(schedule.sourceRunId, schedule.id);
  }

  async function retryAttempt(attempt: ProgressAttempt): Promise<void> {
    returnActionError = undefined;
    await controller.startDuplicate(attempt.runId);
  }

  async function initialRunPage(limit = 50): Promise<RunPage> {
    try {
      const page = api.runPage !== undefined
        ? await api.runPage(limit, 0)
        : legacyRunPage(await api.runs(limit, 0), 0);
      assertRunPageResponse(page, { limit, offset: 0 });
      return page;
    } catch {
      throw new LearnerRouteError("Saved games could not be loaded. Reload this page to try again.");
    }
  }

  async function loadMoreRuns(): Promise<void> {
    if (runPageBusy || runs.length >= runSelection.total) return;
    const generation=loadGeneration;
    const offset=runs.length;
    const priorIds=new Set(runs.map((run)=>run.id));
    runPageBusy = true;
    runPageError = undefined;
    try {
      const page = api.runPage === undefined
        ? legacyRunPage(await api.runs(50, offset), offset)
        : await api.runPage(50, offset);
      if(generation!==loadGeneration)return;
      assertRunPageResponse(page,{limit:50,offset,priorIds});
      runs = [...runs,...page.runs];
      runSelection = page.selection;
    } catch {
      if(generation===loadGeneration)runPageError = "More saved games could not be loaded. Your current list is unchanged; try again.";
    } finally {
      if(generation===loadGeneration)runPageBusy = false;
    }
  }

  async function loadRepertoirePages(items:readonly RepertoireSummary[]):Promise<Record<string,RepertoireGapPage>>{
    if(api.repertoireGaps===undefined)return {};
    const pages=await Promise.all(items.map(async(item)=>[item.id,await api.repertoireGaps!(item.id)] as const));
    return Object.fromEntries(pages);
  }

  async function loadRoute(next: AppRoute): Promise<void> {
    const generation = ++loadGeneration;
    routeLoading = true;
    routeError = undefined;
    runPageError = undefined;
    runPageBusy = false;
    relatedPack = undefined;
    if (
      next.name !== "run" ||
      session.runState?.run.id !== next.runId
    ) {
      controller.stopSession();
    }
    try {
      if (next.name === "home") {
        const loaded = await Promise.all([
          initialRunPage(1),
          api.packs(),
          api.dueProgress?.() ?? Promise.resolve(EMPTY_DUE_QUEUE),
          api.assignments?.() ?? Promise.resolve([]),
        ]);
        if (generation !== loadGeneration) return;
        [packs, dueSchedules, dueWaiting, dueIntakeLimit, assignedPacks] = [loaded[1], loaded[2].schedules, loaded[2].waiting, loaded[2].intakeLimit, loaded[3]];
        runs = loaded[0].runs;
        runSelection = loaded[0].selection;
      } else if (next.name === "review") {
        if (!importBusy) importError = undefined;
        const page = await initialRunPage();
        if (generation !== loadGeneration) return;
        runs = page.runs; runSelection = page.selection;
      } else if (next.name === "story") {
        const refresh=++storyRefreshGeneration;
        const shareRefresh=++storyShareGeneration;
        const loaded = await Promise.all([
          fetchStory(next.runId, true),
          api.capabilities(),
          api.storyShares?.(next.runId) ?? Promise.resolve([]),
        ]);
        if (generation !== loadGeneration) return;
        assertStoryShares(loaded[2],next.runId);
        if(refresh===storyRefreshGeneration){
          story = loaded[0];
          if (story.ready && storyPoll !== undefined) { clearInterval(storyPoll); storyPoll = undefined; }
        }
        capabilities = loaded[1];
        if(shareRefresh===storyShareGeneration)storyShares = loaded[2];
      } else if (next.name === "play") {
        const nextPacks = await api.packs();
        if (generation !== loadGeneration) return;
        packs = nextPacks;
      } else if (next.name === "library") {
        const loaded = await Promise.all([api.packs(), initialRunPage()]);
        if (generation !== loadGeneration) return;
        packs = loaded[0]; runs = loaded[1].runs; runSelection = loaded[1].selection;
      } else if (next.name === "settings") {
        const nextCapabilities = await api.capabilities();
        if (generation !== loadGeneration) return;
        capabilities = nextCapabilities;
      } else if (next.name === "learn") {
        scheduleDismissGeneration += 1;
        scheduleDismissBusy=undefined;
        scheduleDismissErrors={};
        assignmentBusy = undefined;
        assignmentActionError = undefined;
        repertoireMutationBusy=undefined;
        repertoireScanBusy=undefined;
        repertoireEntryBusy=undefined;
        repertoireAnswerBusy=undefined;
        repertoireError=undefined;
        repertoireScanErrors={};
        repertoireEntryErrors={};
        repertoireAnswerErrors={};
        relatedAttempts = {};
        const loaded = await Promise.all([
          api.progress?.() ?? Promise.resolve([]),
          api.dueProgress?.() ?? Promise.resolve(EMPTY_DUE_QUEUE),
          api.milestones?.() ?? Promise.resolve([]),
          api.repertoires?.() ?? Promise.resolve([]),
          api.recommendations?.() ?? Promise.resolve({ recommendations: [], selection: { shown: 0, total: 0 } }),
          api.assignments?.() ?? Promise.resolve([]),
          initialRunPage(),
          api.packs(),
          api.capabilities(),
          api.difficultRoots?.() ?? Promise.resolve(EMPTY_DIFFICULT_ROOTS),
        ]);
        const nextRepertoirePages = await loadRepertoirePages(loaded[3]);
        if (generation !== loadGeneration) return;
        [attempts, dueSchedules, milestones, repertoires, assignedPacks, packs, capabilities] = [loaded[0], loaded[1].schedules, loaded[2], loaded[3], loaded[5], loaded[7], loaded[8]];
        [dueWaiting, dueIntakeLimit, difficultRoots] = [loaded[1].waiting, loaded[1].intakeLimit, loaded[9]];
        runs = loaded[6].runs;
        runSelection = loaded[6].selection;
        recommendations = loaded[4].recommendations;
        recommendationSelection = loaded[4].selection;
        repertoirePages=nextRepertoirePages;
      } else if (next.name === "create") {
        const loaded = await Promise.all([
          api.packDrafts?.() ?? Promise.resolve([]),
          api.shapeDrafts?.() ?? Promise.resolve([]),
          api.shapes(),
          api.principles?.() ?? Promise.resolve([]),
          api.capabilities(),
          api.packs(),
          initialRunPage(),
        ]);
        if (generation !== loadGeneration) return;
        [drafts, shapeDrafts, authoringShapes, authoringPrinciples, capabilities, packs] = loaded;
        runs = loaded[6].runs;
        runSelection = loaded[6].selection;
      } else if (next.name === "live") {
        ++classroomDetailGeneration;
        ++classroomActionGeneration;
        classroomDetail=undefined;
        classroomBusy=undefined;
        classroomActionError=undefined;
        liveCreateBusy=false;
        liveCreateError=undefined;
        liveCreateUncertain=false;
        const loaded=await Promise.all([api.liveSessions?.()??Promise.resolve([]),initialRunPage(),api.classrooms?.()??Promise.resolve([]),api.packs()]);
        if(generation!==loadGeneration)return;
        [liveSessions,classrooms,packs]=[loaded[0],loaded[2],loaded[3]];runs=loaded[1].runs;runSelection=loaded[1].selection;
      } else if (next.name === "live-session") {
        const refresh=++liveRefreshGeneration;
        if(liveDetail?.session.id!==next.sessionId)liveSessionActionError=undefined;
        if(liveSessionActionBusy!==undefined&&liveSessionActionBusy.sessionId!==next.sessionId){++liveSessionActionGeneration;liveSessionActionBusy=undefined;}
        liveReclaimIntent=false;
        liveVoteStatus=undefined;
        const loaded=await Promise.all([api.liveSession?.(next.sessionId),api.sessionJournal?.(next.sessionId).then((page)=>page.entries)??Promise.resolve([])]);
        if(generation!==loadGeneration||refresh!==liveRefreshGeneration)return;
        [liveDetail,liveJournal]=loaded;
      } else if (next.name === "live-overlay") {
        const refresh=++liveRefreshGeneration;
        const related=(await (api.liveSessions?.()??Promise.resolve([]))).find((item)=>item.runId===next.runId);
        const nextLiveDetail=related===undefined?undefined:await api.liveSession?.(related.id);
        if(generation!==loadGeneration)return;
        if(refresh===liveRefreshGeneration)activeLiveDetail=nextLiveDetail;
        const matchMode=activeLiveDetail?.match===undefined?undefined:activeLiveDetail.match.pausedAt===null?"live":"paused";
        await controller.resume(next.runId,{projectionOnly:true,...(matchMode===undefined?{}:{matchMode})});
        if(generation!==loadGeneration)return;
      } else if (next.name === "run") {
        const refresh=++liveRefreshGeneration;
        if(activeLiveDetail?.session.runId!==next.runId)activeMatchActionError=undefined;
        if(activeMatchActionBusy!==undefined&&activeMatchActionBusy.runId!==next.runId){++activeMatchActionGeneration;activeMatchActionBusy=undefined;}
        const [relatedSessions,nextAssignments,nextRepertoires,nextCapabilities]=await Promise.all([
          api.liveSessions?.()??Promise.resolve([]),
          api.assignments?.()??Promise.resolve([]),
          api.repertoires?.()??Promise.resolve([]),
          api.capabilities(),
        ]);
        const nextRepertoirePages=await loadRepertoirePages(nextRepertoires);
        const related=relatedSessions.find((item)=>item.runId===next.runId);
        const nextLiveDetail=related===undefined?undefined:await api.liveSession?.(related.id);
        if(generation!==loadGeneration)return;
        assignedPacks=nextAssignments;
        repertoires=nextRepertoires;
        capabilities=nextCapabilities;
        repertoirePages=nextRepertoirePages;
        if(refresh===liveRefreshGeneration)activeLiveDetail=nextLiveDetail;
        const matchMode=activeLiveDetail?.match===undefined?undefined:activeLiveDetail.match.pausedAt===null?"live":"paused";
        await controller.resume(next.runId,{...(matchMode===undefined?{}:{matchMode})});
        if(generation!==loadGeneration)return;
        const handoff = pendingReviewCompare?.runId === next.runId ? pendingReviewCompare : undefined;
        pendingReviewCompare = undefined;
        if (handoff !== undefined) {
          await controller.compare(handoff.branchIds);
          if(generation!==loadGeneration)return;
        }
        const relation = session.pack?.variantOf;
        if (relation !== undefined) {
          try {
            const document = (await api.pack(relation.packId)).document;
            if (generation === loadGeneration && session.pack?.variantOf?.packId === relation.packId) {
              relatedPack = document;
            }
          } catch {
            if (generation === loadGeneration) relatedPack = undefined;
          }
        }
        const nextDerivations = await (api.runDerivations?.(next.runId) ?? Promise.resolve(undefined));
        if(generation!==loadGeneration)return;
        derivations = nextDerivations;
      }
    } catch (error) {
      if (generation === loadGeneration) {
        routeError = error instanceof LearnerRouteError
          ? error.message
          : "This page could not be loaded. Check your connection and try again.";
      }
    } finally {
      if (generation === loadGeneration) {
        const moveFocus = routeHasLoaded;
        routeHasLoaded = true;
        routeLoading = false;
        if (moveFocus) {
          await tick();
          if (generation === loadGeneration) {
            const heading = document.querySelector<HTMLElement>("#main-content main h1");
            heading?.setAttribute("tabindex", "-1");
            heading?.focus();
          }
        }
      }
    }
  }

  async function loadPublicRoute(_next: AppRoute): Promise<void> {
    const generation = ++loadGeneration;
    routeLoading = true;
    routeError = undefined;
    controller.stopSession();
    if (livePoll !== undefined) { clearInterval(livePoll); livePoll = undefined; }
    if (storyPoll !== undefined) { clearInterval(storyPoll); storyPoll = undefined; }
    try {
      const loaded = await Promise.all([api.packs(), api.capabilities()]);
      if (generation !== loadGeneration) return;
      [packs, capabilities] = loaded;
    } catch {
      if (generation === loadGeneration) routeError = "Rehearsal positions could not be loaded. Check your connection and try again.";
    } finally {
      if (generation === loadGeneration) {
        routeHasLoaded = true;
        routeLoading = false;
      }
    }
  }

  function loadVisibleRoute(next: AppRoute): void {
    if (learner === undefined) void loadPublicRoute(next);
    else void loadRoute(next);
  }

  function retryVisibleRoute(): void {
    if (!routeLoading) loadVisibleRoute(route);
  }

  function startRouter(): void {
    if (routerStarted) return;
    routerStarted = true;
    router.start();
    loadVisibleRoute(router.route);
    if (learner !== undefined) {
      syncLivePolling(router.route);
      syncStoryPolling(router.route);
    }
  }

  function syncLivePolling(next:AppRoute):void{
    if(livePoll!==undefined){clearInterval(livePoll);livePoll=undefined;}
    if(next.name!=="live-session"&&next.name!=="live-overlay"&&next.name!=="run")return;
    livePoll=setInterval(()=>void (async()=>{
      const generation=loadGeneration;
      const refresh=++liveRefreshGeneration;
      const sessionId=next.name==="live-session"?next.sessionId:activeLiveDetail?.session.id;
      if(sessionId===undefined)return;
      const detail=await api.liveSession?.(sessionId);
      if(generation!==loadGeneration||refresh!==liveRefreshGeneration)return;
      if(detail!==undefined){if(next.name==="live-session")liveDetail=detail;else activeLiveDetail=detail;controller.setMatchMode(detail.match===undefined?undefined:detail.match.pausedAt===null?"live":"paused");}
      if(next.name==="live-session"){
        const journal=(await api.sessionJournal?.(sessionId)??{entries:[],nextSeq:0}).entries;
        if(generation!==loadGeneration||refresh!==liveRefreshGeneration)return;
        liveJournal=journal;
      }
    })().catch(()=>{}),2_000);
  }

  function syncStoryPolling(next: AppRoute): void {
    if (storyPoll !== undefined) { clearInterval(storyPoll); storyPoll = undefined; }
    if (next.name !== "story") return;
    storyPoll = setInterval(() => void refreshStory(next.runId, false), 1_000);
  }

  async function fetchStory(runId: string, allowReveal: boolean): Promise<ReviewMap> {
    if (api.review === undefined) throw new Error("Game reviews are unavailable");
    const writer = WriterSession.peek(runId, storage);
    const readReview = async (): Promise<ReviewMap> => {
      const value = await api.review!(runId);
      assertReviewMapResponse(value, { runId });
      return value;
    };
    let nextReview: ReviewMap;
    try {
      nextReview = await readReview();
    } catch (error) {
      if (!(allowReveal && error instanceof ApiError && error.code === "ASSISTANCE_WITHHELD" && writer !== undefined)) throw error;
      await api.reveal(runId, writer.writerId);
      nextReview = await readReview();
    }
    if (!nextReview.ready && api.story !== undefined) {
      // rfc/review-evidence-compiler.md §4.1: the story read reaches the Review coordinator's
      // bounded window (the Review Map read itself requests nothing); deliveries attach server-side
      // and the existing poll re-reads the map.
      await api.story(runId).catch(() => undefined);
    }
    return nextReview;
  }

  async function refreshStory(runId: string, allowReveal: boolean): Promise<void> {
    const generation=loadGeneration;
    const refresh=++storyRefreshGeneration;
    try{
      const nextStory=await fetchStory(runId,allowReveal);
      if(generation!==loadGeneration||refresh!==storyRefreshGeneration||route.name!=="story"||route.runId!==runId)return;
      story=nextStory;
      if (story.ready && storyPoll !== undefined) { clearInterval(storyPoll); storyPoll = undefined; }
    }catch{
      // Background refresh retains the last good Story. Initial load failures use routeError.
    }
  }

  function storyRouteIsCurrent(runId: string, generation: number): boolean {
    return generation === loadGeneration && route.name === "story" && route.runId === runId;
  }

  async function refreshStoryShares(runId: string, generation: number, refresh: number): Promise<void> {
    if (!storyRouteIsCurrent(runId, generation) || refresh !== storyShareGeneration || api.storyShares === undefined) return;
    const nextShares = await api.storyShares(runId);
    assertStoryShares(nextShares,runId);
    if (storyRouteIsCurrent(runId, generation) && refresh === storyShareGeneration) storyShares = nextShares;
  }

  async function createStoryShare(runId: string, branchId: string): Promise<CreatedStoryShare> {
    if (api.shareStory === undefined) throw new Error("Story sharing is unavailable");
    const generation = loadGeneration;
    const refresh = ++storyShareGeneration;
    const created = await api.shareStory(runId, branchId);
    assertCreatedStoryShare(created,{runId,branchId});
    if (storyRouteIsCurrent(runId, generation) && refresh === storyShareGeneration) {
      try { await refreshStoryShares(runId, generation, refresh); } catch { /* The created URL remains authoritative even if its list projection cannot refresh. */ }
    }
    return created;
  }

  async function revokeStoryShare(runId: string, tokenId: string): Promise<void> {
    if (api.revokeStoryShare === undefined) throw new Error("Story share revocation is unavailable");
    const generation = loadGeneration;
    const refresh = ++storyShareGeneration;
    const revoked = await api.revokeStoryShare(runId, tokenId);
    assertRevokedStoryShare(revoked,{runId,tokenId});
    if (storyRouteIsCurrent(runId, generation) && refresh === storyShareGeneration) {
      try { await refreshStoryShares(runId, generation, refresh); } catch { /* Revocation succeeded; a stale list must not turn it into a false failure. */ }
    }
  }

  async function importGame(): Promise<void> {
    if (importBusy) return;
    const generation = loadGeneration;
    const action = ++importGeneration;
    const pending = importPreparation;
    const stillOwnsReview = (): boolean => action === importGeneration
      && generation === loadGeneration
      && route.name === "review";
    importBusy = true;
    importError = undefined;
    importNotice = undefined;
    if (pending !== undefined) {
      try {
        await api.reveal(pending.runId, pending.writerId);
        if (action === importGeneration) importPreparation = undefined;
        if (stillOwnsReview()) navigate(routePath({ name: "story", runId: pending.runId }));
      } catch {
        if (stillOwnsReview()) importError = "The game is saved, but its Story could not be prepared. Try finishing Story setup again.";
      } finally {
        if (action === importGeneration) importBusy = false;
      }
      return;
    }
    const source = importUrl.trim() === ""
      ? { kind: "pgn" as const, pgn: importPgn }
      : { kind: "lichess" as const, url: importUrl };
    const side = importSide;
    try {
      if (api.importGame === undefined) throw new Error("Game import is unavailable");
      const runId = `import-${crypto.randomUUID()}`;
      const writer = WriterSession.observe(runId, storage);
      const result=await api.importGame({
        id: runId,
        side,
        opponentPolicy: { mode: "human_common", targetElo: 1800 },
        policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
        seed: Math.floor(Math.random() * 2_147_483_647),
        source,
      }, writer.writerId);
      if (result.run.id !== runId) {
        WriterSession.claimFor(runId, storage, () => writer.writerId);
        if (stillOwnsReview()) importError = "The game was imported, but its response could not be matched. Reload Review to find the saved game.";
        return;
      }
      WriterSession.claimFor(runId, storage, () => writer.writerId);
      if (action === importGeneration) importPreparation = { runId, writerId: writer.writerId };
      try {
        await api.reveal(runId, writer.writerId);
      } catch {
        if (stillOwnsReview()) importError = "The game is saved, but its Story could not be prepared. Try finishing Story setup again.";
        return;
      }
      if (action === importGeneration) importPreparation = undefined;
      if (action === importGeneration && source.kind === "pgn" && importPgn === source.pgn) importPgn = "";
      if (action === importGeneration && source.kind === "lichess" && importUrl === source.url) importUrl = "";
      if (stillOwnsReview()) {
        navigate(routePath({ name: "story", runId }));
      } else if (action === importGeneration) {
        importNotice = "The game is saved and its Story is ready. It will appear in Review history after the page reloads.";
      }
    } catch (error) {
      if (stillOwnsReview()) importError = importFailureCopy(error);
    } finally {
      if (action === importGeneration) importBusy = false;
    }
  }

  async function startRatedGame(band: 1000 | 1400 | 1800 | 2200, side: "white" | "black"): Promise<void> {
    if (api.createRatedGame === undefined) throw new Error("Rated games are unavailable");
    const generation = loadGeneration;
    const runId = `rated-${crypto.randomUUID()}`;
    const writer = WriterSession.observe(runId, storage);
    const run = await api.createRatedGame({
      id: runId,
      start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" },
      side,
      band,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: Math.floor(Math.random() * 2_147_483_647),
    }, writer.writerId);
    if (run.id !== runId) throw new Error("Rated-game response did not match its requested run");
    WriterSession.claimFor(runId, storage, () => writer.writerId);
    if (generation === loadGeneration && route.name === "rating") {
      navigate(routePath({ name: "run", runId: run.id }));
    }
  }

  async function enterStoryMoment(runId: string, nodeId: string): Promise<void> {
    const generation = loadGeneration;
    const subject = { runId, nodeId };
    const writer = WriterSession.observe(runId, storage);
    if (api.claimLease === undefined) throw new Error("Taking this game board is unavailable");
    await api.claimLease(runId, writer.writerId);
    WriterSession.claimFor(runId, storage, () => writer.writerId);
    const rewindResult = await api.rewind(runId, { nodeId }, writer.writerId);
    assertStoryRewindResponse(rewindResult, subject);
    const forkResult = await api.fork(runId, { nodeId, label: "story-reentry", intent: "Retry from this reviewed position" }, writer.writerId);
    assertStoryForkResponse(forkResult, subject);
    if (generation === loadGeneration && route.name === "story" && route.runId === runId) {
      navigate(routePath({ name: "run", runId }));
    }
  }

  function compareFromReview(runId: string, branchIds: readonly string[]): void {
    if (route.name !== "story" || route.runId !== runId) return;
    pendingReviewCompare = Object.freeze({ runId, branchIds: Object.freeze([...branchIds]) });
    navigate(routePath({ name: "run", runId }));
  }

  async function analyzeFromReview(runId: string, branchId: string, nodeId: string) {
    const page = await api.reviewAnalysis!(runId, nodeId, branchId);
    assertReviewAnalysisResponse(page, { runId, nodeId });
    return page;
  }

  async function exportStory(runId: string): Promise<void> {
    const download = await api.pgn(runId);
    const url = URL.createObjectURL(new Blob([download.text], { type: "text/x-chess-pgn;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = download.filename; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function flipRun(runId: string, nodeId: string): Promise<void> {
    if (api.flipRun === undefined) throw new Error("Opposite-side replay is unavailable");
    const generation = loadGeneration;
    const sourceRun = session.runState?.run;
    const sourceNode = sourceRun?.id === runId
      ? sourceRun.nodes.find((candidate) => candidate.id === nodeId)
      : undefined;
    if (sourceNode === undefined) throw new Error("Opposite-side replay source is unavailable");
    const subject = { runId, nodeId, branchId: sourceNode.branchId };
    const result = await api.flipRun(runId, nodeId);
    assertFlipResponse(result, subject);
    WriterSession.claimFor(result.run.id, storage, () => result.writerId);
    if (generation === loadGeneration && route.name === "run" && route.runId === runId) {
      navigate(routePath({ name: "run", runId: result.run.id }));
    }
  }

  function repertoireRouteIsCurrent(generation:number):boolean{return generation===loadGeneration;}
  function repertoireGapKey(id:string,gapKey:string):string{return `${id}\0${gapKey}`;}
  async function createRepertoire():Promise<void>{
    if(repertoireMutationBusy!==undefined)return;
    const input={name:repertoireName,side:repertoireSide,targetElo:repertoireTargetElo,coverageDenominator:repertoireCoverageDenominator,source:repertoireStudyUrl.trim()?{kind:"lichess_study" as const,url:repertoireStudyUrl}:{kind:"pgn" as const,pgn:repertoirePgn}};
    const generation=loadGeneration;const action=++repertoireMutationGeneration;
    repertoireMutationBusy="create";repertoireError=undefined;
    try{
      if(api.createRepertoire===undefined)throw new Error("unavailable");
      const created=await api.createRepertoire(input);
      if(generation===loadGeneration&&action===repertoireMutationGeneration&&route.name==="learn"){
        repertoires=[created,...repertoires.filter((item)=>item.id!==created.id)];
        if(repertoireName===input.name)repertoireName="";
        if(input.source.kind==="pgn"&&repertoirePgn===input.source.pgn)repertoirePgn="";
        if(input.source.kind==="lichess_study"&&repertoireStudyUrl===input.source.url)repertoireStudyUrl="";
      }
    }catch{if(generation===loadGeneration&&action===repertoireMutationGeneration&&route.name==="learn")repertoireError="The repertoire could not be imported. Check its source and try again.";}
    finally{if(generation===loadGeneration&&action===repertoireMutationGeneration&&route.name==="learn")repertoireMutationBusy=undefined;}
  }
  async function scanRepertoire(id:string):Promise<void>{
    if(repertoireScanBusy!==undefined)return;
    const before=repertoirePages[id]?.scan?.scannedAt;const generation=loadGeneration;const action=++repertoireScanGeneration;
    repertoireScanBusy=id;repertoireScanErrors={...repertoireScanErrors,[id]:""};
    let finished=false;
    try{
      if(api.scanRepertoire===undefined||api.repertoireGaps===undefined)throw new Error("unavailable");
      await api.scanRepertoire(id);
      for(let index=0;index<50&&repertoireRouteIsCurrent(generation)&&action===repertoireScanGeneration;index++){
        const page=await api.repertoireGaps(id);
        if(!repertoireRouteIsCurrent(generation)||action!==repertoireScanGeneration)return;
        if(page.repertoire.id!==id)throw new Error("crossed");
        repertoirePages={...repertoirePages,[id]:page};
        if(page.status==="ready"&&page.scan!==null&&(before===undefined||page.scan.scannedAt!==before)){finished=true;break;}
        await new Promise((resolve)=>setTimeout(resolve,100));
      }
      if(!repertoireRouteIsCurrent(generation)||action!==repertoireScanGeneration)return;
      if(!finished){repertoireScanErrors={...repertoireScanErrors,[id]:"The scan is still running. Try again to refresh its results."};return;}
      try{const next=await (api.repertoires?.()??Promise.resolve(repertoires));if(repertoireRouteIsCurrent(generation)&&action===repertoireScanGeneration)repertoires=next;}
      catch{if(repertoireRouteIsCurrent(generation)&&action===repertoireScanGeneration)repertoireScanErrors={...repertoireScanErrors,[id]:"The scan finished, but its summary could not refresh. Reload to see the current state."};}
    }catch{if(repertoireRouteIsCurrent(generation)&&action===repertoireScanGeneration)repertoireScanErrors={...repertoireScanErrors,[id]:"The repertoire scan could not finish. Try again."};}
    finally{if(repertoireRouteIsCurrent(generation)&&action===repertoireScanGeneration)repertoireScanBusy=undefined;}
  }
  function repertoireEntry(runId:string|null){return repertoireEntryDecision(capabilities?.policyModes??[],runId);}
  async function enterRepertoireGap(id:string,gapKey:string):Promise<void>{
    if(repertoireEntryBusy!==undefined)return;
    const existing=repertoirePages[id]?.scan!==null&&repertoirePages[id]?.scan!==undefined?[...repertoirePages[id]!.scan!.gaps,...repertoirePages[id]!.scan!.alternateGaps].find((gap)=>gap.key===gapKey)?.runId??null:null;
    const entry=repertoireEntry(existing);if(!entry.available)return;
    const generation=loadGeneration;const action=++repertoireEntryGeneration;const key=repertoireGapKey(id,gapKey);
    repertoireEntryBusy=key;repertoireEntryErrors={...repertoireEntryErrors,[key]:""};
    try{
      if(api.enterRepertoireGap===undefined)throw new Error("unavailable");
      const result=await api.enterRepertoireGap(id,gapKey,entry.resistance);
      if(result.writerId!==null)WriterSession.claimFor(result.runId,storage,()=>result.writerId!);
      if(generation===loadGeneration&&action===repertoireEntryGeneration&&route.name==="learn")navigate(routePath({name:"run",runId:result.runId}));
    }catch{if(generation===loadGeneration&&action===repertoireEntryGeneration&&route.name==="learn")repertoireEntryErrors={...repertoireEntryErrors,[key]:"This gap could not be opened for rehearsal. Try again."};}
    finally{if(generation===loadGeneration&&action===repertoireEntryGeneration&&route.name==="learn")repertoireEntryBusy=undefined;}
  }
  async function chooseRepertoireAnswer(id:string,gapKey:string,moveUci:string,ifMatch:string):Promise<void>{
    if(repertoireAnswerBusy!==undefined)return;
    const actionKey=`${id}:${gapKey}:${moveUci}`;const errorKey=repertoireGapKey(id,gapKey);const generation=loadGeneration;const action=++repertoireAnswerGeneration;
    repertoireAnswerBusy=actionKey;repertoireAnswerErrors={...repertoireAnswerErrors,[errorKey]:""};
    try{
      if(api.chooseRepertoireAnswer===undefined)throw new Error("unavailable");
      const updated=await api.chooseRepertoireAnswer(id,{positionKey:gapKey,moveUci,ifMatch});
      if(!repertoireRouteIsCurrent(generation)||action!==repertoireAnswerGeneration)return;
      repertoires=repertoires.map((item)=>item.id===id?updated:item);
    }catch{if(repertoireRouteIsCurrent(generation)&&action===repertoireAnswerGeneration)repertoireAnswerErrors={...repertoireAnswerErrors,[errorKey]:"That repertoire answer could not be saved. Nothing changed; try again."};}
    if(repertoireRouteIsCurrent(generation)&&action===repertoireAnswerGeneration&&!repertoireAnswerErrors[errorKey]&&api.repertoireGaps!==undefined){
      try{const page=await api.repertoireGaps(id);if(repertoireRouteIsCurrent(generation)&&action===repertoireAnswerGeneration&&page.repertoire.id===id)repertoirePages={...repertoirePages,[id]:page};}
      catch{if(repertoireRouteIsCurrent(generation)&&action===repertoireAnswerGeneration)repertoireAnswerErrors={...repertoireAnswerErrors,[errorKey]:"The answer was saved, but the gap list could not refresh. Reload to see the current state."};}
    }
    if(repertoireRouteIsCurrent(generation)&&action===repertoireAnswerGeneration)repertoireAnswerBusy=undefined;
  }
  async function deleteRepertoire(id:string):Promise<void>{
    if(api.deleteRepertoire===undefined||repertoireMutationBusy!==undefined)return;
    const generation=loadGeneration;const action=++repertoireMutationGeneration;
    repertoireMutationBusy=`delete:${id}`;repertoireError=undefined;
    try{
      await api.deleteRepertoire(id);
      if(generation===loadGeneration&&action===repertoireMutationGeneration&&route.name==="learn"){
        repertoires=repertoires.filter((item)=>item.id!==id);const {[id]:_removed,...remaining}=repertoirePages;repertoirePages=remaining;
        if(repertoireDeleteIntent===id)repertoireDeleteIntent=undefined;
        recommendations=recommendations.filter((item)=>item.kind!=="repertoire_gap"||item.repertoireId!==id);
      }
    }catch{if(generation===loadGeneration&&action===repertoireMutationGeneration&&route.name==="learn")repertoireError="The repertoire could not be deleted. Nothing changed; try again.";}
    finally{if(generation===loadGeneration&&action===repertoireMutationGeneration&&route.name==="learn")repertoireMutationBusy=undefined;}
  }
  function recommendationPacks(item:ProgressRecommendation):readonly PackSummary[]{return item.kind==="shape_encounter"?item.packIds.flatMap((packId)=>{const pack=packs.find((candidate)=>candidate.id===packId);return pack===undefined?[]:[pack];}):[];}
  async function distillActiveRun(title: string): Promise<void> {
    const run = session.runState?.run;
    if (distillDraftBusy || run === undefined || distillDraftRunId !== run.id) return;
    const action = ++distillGeneration;
    const generation = loadGeneration;
    const runId = run.id;
    const branchId = run.activeCursor.branchId;
    const packId = `distilled-${runId}`;
    distillDraftError = undefined;
    distillDraftBusy = true;
    try {
      if (api.distillRun === undefined) throw new Error("Session distillation is unavailable.");
      const result = await api.distillRun(runId, { packId, title, branchId });
      if (!appMounted || action !== distillGeneration || generation !== loadGeneration
        || route.name !== "run" || route.runId !== runId || distillDraftRunId !== runId) return;
      if (!validDistilledDraft(result, packId)) throw new Error("Invalid distillation response");
      drafts = [result.draft, ...drafts.filter((item) => item.id !== result.draft.id)];
      selectedDraftId = result.draft.id;
      studioJson = JSON.stringify(result.draft.document, null, 2);
      distillDraftRunId = undefined;
      navigate("/create");
    } catch {
      if (appMounted && action === distillGeneration && generation === loadGeneration
        && route.name === "run" && route.runId === runId && distillDraftRunId === runId) {
        distillDraftError = "The draft could not be created. Your completed run is unchanged; try again.";
      }
    } finally {
      if (appMounted && action === distillGeneration) distillDraftBusy = false;
    }
  }

  async function authenticate(): Promise<void> {
    if (authBusy) return;
    const action = ++authGeneration;
    const registering = authRegister;
    const handle = authHandle;
    const password = authPassword;
    const selectedPackId = pendingPackId;
    const requestedRoute = router.route.name === "not-found" ? router.route.pathname : routePath(router.route);
    authBusy = true;
    authError = undefined;
    try {
      const method = registering ? api.register : api.login;
      if (method === undefined) throw new Error("Authentication is not available");
      const authenticated = await method.call(api, handle, password);
      if (!appMounted || action !== authGeneration) return;
      if (!validAuthenticatedLearner(authenticated)) throw new Error("Invalid authentication response");
      learner = authenticated;
      if (authPassword === password) authPassword = "";
      authNotice = undefined;
      if (pendingPackId === selectedPackId) pendingPackId = undefined;
      if (!routerStarted) startRouter();
      else {
        await loadRoute(router.route);
        if (!appMounted || action !== authGeneration) return;
        syncLivePolling(router.route);
        syncStoryPolling(router.route);
      }
      const currentRoute = router.route.name === "not-found" ? router.route.pathname : routePath(router.route);
      if (selectedPackId !== undefined && currentRoute === requestedRoute) {
        await controller.startPack(selectedPackId);
      }
    } catch {
      if (appMounted && action === authGeneration && learner === undefined) {
        authError = registering
          ? "Your account could not be created. Check the handle and password, then try again."
          : "You could not be signed in. Check the handle and password, then try again.";
      }
    } finally {
      if (appMounted && action === authGeneration) authBusy = false;
    }
  }

  function activeTurn(): "white" | "black" | undefined {
    const run=session.runState?.run;
    if(run===undefined)return undefined;
    const node=run.nodes.find((candidate)=>candidate.id===run.activeCursor.nodeId);
    const turn=node?.fen.split(" ")[1];
    return turn==="w"?"white":turn==="b"?"black":undefined;
  }

  function learnerOwnsActiveMatchTurn(): boolean {
    const match=activeLiveDetail?.match;
    const turn=activeTurn();
    if(match===undefined||match.pausedAt!==null||turn===undefined||learner===undefined)return false;
    return (turn==="white"?match.whiteLearnerId:match.blackLearnerId)===learner.id;
  }

  async function signOut(): Promise<void> {
    await api.logout?.();
    controller.stopSession();
    learner = undefined;
    await loadPublicRoute(route);
  }

  async function deleteAccountWithPassword(password: string, previewDigest: string): Promise<void> {
    await api.deleteAccount?.(password, previewDigest);
    try { clearAccountLocalData(globalThis.localStorage); } catch { /* storage can be unavailable */ }
    controller.stopSession(); learner = undefined; await loadPublicRoute(route);
  }

  function choosePublicPack(packId: string): void {
    if (authBusy) return;
    pendingPackId = packId;
    authRegister = true;
    authError = undefined;
    authNotice = `Create an account or sign in to keep ${packTitle(packId)} and begin it immediately.`;
    void tick().then(() => {
      const access = document.getElementById("account-access");
      access?.scrollIntoView({ behavior: "smooth", block: "center" });
      access?.querySelector<HTMLInputElement>("input")?.focus();
    });
  }

  async function exportAccountWithPassword(password: string): Promise<void> {
    if (api.exportAccount === undefined) throw new Error("Account export is unavailable.");
    const generation = loadGeneration;
    const download = await api.exportAccount(password);
    if (generation !== loadGeneration || route.name !== "settings") return;
    const url = URL.createObjectURL(download.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = download.filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function reviewRunDeletion(run: RunSummary): Promise<void> {
    if (runDeletionBusy !== undefined) return;
    const generation = loadGeneration;
    const action = ++runDeletionGeneration;
    const subject = run;
    runDeletionBusy = { kind: "preview", runId: subject.id };
    runDeletionError = undefined;
    try {
      if (api.runDeletionPreview === undefined) throw new Error("Run deletion is unavailable.");
      const preview = await api.runDeletionPreview(subject.id);
      assertRunDeletionPreview(preview, subject.id);
      if (generation === loadGeneration && action === runDeletionGeneration && route.name === "library") {
        runDeletion = { run: subject, preview };
      }
    } catch {
      if (generation === loadGeneration && action === runDeletionGeneration && route.name === "library") {
        runDeletionError = "The deletion effects could not be loaded. The game is unchanged; try again.";
      }
    } finally {
      if (action === runDeletionGeneration) runDeletionBusy = undefined;
    }
  }

  async function confirmRunDeletion(): Promise<void> {
    if (runDeletion === undefined || api.deleteRun === undefined || runDeletionBusy !== undefined) return;
    const generation = loadGeneration;
    const action = ++runDeletionGeneration;
    const subject = runDeletion;
    runDeletionBusy = { kind: "confirm", runId: subject.run.id };
    runDeletionError = undefined;
    try {
      await api.deleteRun(subject.run.id, subject.preview.digest);
      try { clearRunLocalData(globalThis.localStorage, subject.run.id); } catch { /* storage can be unavailable */ }
      if (generation === loadGeneration && action === runDeletionGeneration && route.name === "library") {
        runs = runs.filter((candidate) => candidate.id !== subject.run.id);
        runSelection = { shown: runs.length, total: Math.max(0, runSelection.total - 1) };
        runDeletion = undefined;
      }
    } catch {
      if (generation === loadGeneration && action === runDeletionGeneration && route.name === "library" && runDeletion?.run.id === subject.run.id) {
        runDeletionError = "This game could not be deleted. It is unchanged; review the effects and try again.";
      }
    } finally {
      if (action === runDeletionGeneration) runDeletionBusy = undefined;
    }
  }

  function cancelRunDeletion(): void {
    if (runDeletionBusy !== undefined) return;
    runDeletionGeneration += 1;
    runDeletion = undefined;
    runDeletionError = undefined;
  }

  function savePgn(download: { readonly text: string; readonly filename: string }): void {
    const url = URL.createObjectURL(
      new Blob([download.text], { type: "text/x-chess-pgn;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = download.filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function exportPgn(branchIds?: readonly string[]): Promise<void> {
    savePgn(await controller.exportPgn(branchIds));
  }

  async function exportRunPgn(runId: string): Promise<void> {
    if (runArtifactBusyId !== undefined) return;
    const generation = loadGeneration;
    const action = ++runArtifactGeneration;
    runArtifactBusyId = runId;
    runArtifactError = undefined;
    try {
      const download = await api.pgn(runId);
      if (generation === loadGeneration && action === runArtifactGeneration && route.name === "library") {
        savePgn(download);
      }
    } catch {
      if (generation === loadGeneration && action === runArtifactGeneration && route.name === "library") {
        runArtifactError = { runId, text: "This PGN could not be prepared. The game is unchanged; try the download again." };
      }
    } finally {
      if (action === runArtifactGeneration) runArtifactBusyId = undefined;
    }
  }

  async function createDraft(): Promise<void> {
    if (studioMutationBusy !== undefined) return;
    const action = ++studioMutationGeneration;
    const generation = loadGeneration;
    const sourceJson = studioJson;
    const selection = selectedDraftId;
    studioMutationBusy = { kind: "create" };
    studioActionError = undefined;
    try {
      const document = JSON.parse(sourceJson) as unknown;
      const expectedPackId = typeof document === "object" && document !== null && "id" in document && typeof document.id === "string" ? document.id : "";
      if (api.createPackDraft === undefined || expectedPackId === "") throw new Error("Pack draft creation is unavailable");
      const draft = await api.createPackDraft(document);
      if (!validPackDraftIdentity(draft, expectedPackId)) throw new Error("Invalid pack draft response");
      if (appMounted && action === studioMutationGeneration && generation === loadGeneration && route.name === "create") {
        drafts = [draft, ...drafts.filter((candidate) => candidate.id !== draft.id)];
        if (selectedDraftId === selection && studioJson === sourceJson) {
          selectedDraftId = draft.id;
          studioJson = JSON.stringify(draft.document, null, 2);
        }
      }
    } catch {
      if (appMounted && action === studioMutationGeneration && generation === loadGeneration && route.name === "create") {
        studioActionError = "The draft could not be created. Check the JSON and try again.";
      }
    } finally {
      if (appMounted && action === studioMutationGeneration) studioMutationBusy = undefined;
    }
  }

  function studioActionIsCurrent(action: number, generation: number): boolean {
    return appMounted && action === studioMutationGeneration && generation === loadGeneration && route.name === "create";
  }

  function publishSavedDraft(saved: PackDraft, draftId: string, sourceJson: string): void {
    drafts = drafts.map((candidate) => candidate.id === draftId ? saved : candidate);
    if (selectedDraftId === draftId && studioJson === sourceJson) {
      studioJson = JSON.stringify(saved.document, null, 2);
    }
  }

  async function saveDraft(): Promise<void> {
    if (studioMutationBusy !== undefined) return;
    const draft = drafts.find((candidate) => candidate.id === selectedDraftId);
    if (draft === undefined || draft.state !== "draft") return;
    const action = ++studioMutationGeneration;
    const generation = loadGeneration;
    const sourceJson = studioJson;
    studioMutationBusy = { kind: "save", draftId: draft.id };
    studioActionError = undefined;
    try {
      if (api.updatePackDraft === undefined) throw new Error("Pack draft saving is unavailable");
      const saved = await api.updatePackDraft(draft.id, draft.digest, JSON.parse(sourceJson));
      if (!validPackDraftIdentity(saved, draft.packId) || saved.id !== draft.id) throw new Error("Invalid saved draft response");
      if (studioActionIsCurrent(action, generation)) publishSavedDraft(saved, draft.id, sourceJson);
    } catch {
      if (studioActionIsCurrent(action, generation)) studioActionError = "This draft could not be saved. Your editor bytes are unchanged; try again.";
    } finally {
      if (appMounted && action === studioMutationGeneration) studioMutationBusy = undefined;
    }
  }

  async function playtestDraft(): Promise<void> {
    if (studioMutationBusy !== undefined) return;
    const draft = drafts.find((candidate) => candidate.id === selectedDraftId);
    if (draft === undefined || draft.state !== "draft") return;
    const action = ++studioMutationGeneration;
    const generation = loadGeneration;
    const sourceJson = studioJson;
    studioMutationBusy = { kind: "playtest", draftId: draft.id };
    studioActionError = undefined;
    let saved = false;
    try {
      if (api.updatePackDraft === undefined || api.playtestPackDraft === undefined) throw new Error("Pack playtesting is unavailable");
      const updated = await api.updatePackDraft(draft.id, draft.digest, JSON.parse(sourceJson));
      if (!validPackDraftIdentity(updated, draft.packId) || updated.id !== draft.id) throw new Error("Invalid saved draft response");
      saved = true;
      if (studioActionIsCurrent(action, generation)) publishSavedDraft(updated, draft.id, sourceJson);
      if (!updated.validation.valid) throw new Error("Saved draft is not valid for playtesting");
      const writerId = `writer-${crypto.randomUUID()}`;
      const result = await api.playtestPackDraft(updated.id, writerId);
      if (result.run.id.trim() === "") throw new Error("Invalid playtest run response");
      WriterSession.claimFor(result.run.id, storage, () => writerId);
      if (result.url !== routePath({ name: "run", runId: result.run.id })) throw new Error("Invalid playtest route response");
      if (studioActionIsCurrent(action, generation)) navigate(result.url);
    } catch {
      if (studioActionIsCurrent(action, generation)) {
        studioActionError = saved
          ? "The draft was saved, but its playtest could not be opened. Try starting the playtest again."
          : "The draft could not be saved for playtesting. Your editor bytes remain here; try again.";
      }
    } finally {
      if (appMounted && action === studioMutationGeneration) studioMutationBusy = undefined;
    }
  }

  async function withdrawDraft(draftId: string): Promise<void> {
    if (studioMutationBusy !== undefined) return;
    const draft = drafts.find((candidate) => candidate.id === draftId);
    if (draft === undefined || draft.state !== "draft" || api.withdrawPackDraft === undefined) return;
    const action = ++studioMutationGeneration;
    const generation = loadGeneration;
    studioMutationBusy = { kind: "withdraw", draftId };
    studioActionError = undefined;
    try {
      await api.withdrawPackDraft(draftId);
      if (studioActionIsCurrent(action, generation)) {
        drafts = drafts.map((candidate) => candidate.id === draftId ? { ...candidate, state: "withdrawn" } : candidate);
        if (withdrawConfirmId === draftId) withdrawConfirmId = undefined;
      }
    } catch {
      if (studioActionIsCurrent(action, generation)) studioActionError = "This draft could not be withdrawn. Nothing changed; try again.";
    } finally {
      if (appMounted && action === studioMutationGeneration) studioMutationBusy = undefined;
    }
  }

  async function registerDraft(): Promise<void> {
    if (studioMutationBusy !== undefined) return;
    const draft = drafts.find((candidate) => candidate.id === selectedDraftId);
    if (draft === undefined || registrationBlockReason(draft) !== undefined || api.registerPackDraft === undefined) return;
    const action = ++studioMutationGeneration;
    const generation = loadGeneration;
    studioMutationBusy = { kind: "register", draftId: draft.id };
    studioActionError = undefined;
    let registered = false;
    try {
      const summary = await api.registerPackDraft(draft.id);
      registered = true;
      if (summary.id !== draft.packId) throw new Error("Invalid registered pack response");
      if (!studioActionIsCurrent(action, generation)) return;
      drafts = drafts.map((candidate) => candidate.id === draft.id ? { ...candidate, state: "registered" } : candidate);
      if (api.packDrafts !== undefined) {
        try {
          const refreshed = await api.packDrafts();
          if (studioActionIsCurrent(action, generation)) drafts = refreshed;
        } catch {
          if (studioActionIsCurrent(action, generation)) studioActionError = "The pack was registered, but the draft list could not refresh. Reload Create to see its current state.";
        }
      }
    } catch {
      if (studioActionIsCurrent(action, generation)) {
        studioActionError = registered
          ? "The pack was registered, but its response could not be matched. Reload Create before acting on it again."
          : "This pack could not be registered. The draft remains private; check its blockers and try again.";
      }
    } finally {
      if (appMounted && action === studioMutationGeneration) studioMutationBusy = undefined;
    }
  }

  async function openSeedDraft(expectedPackId: string, work: () => Promise<PackDraft>): Promise<boolean> {
    if (createSeedBusy) return false;
    const action = ++createSeedGeneration;
    const generation = loadGeneration;
    const selection = selectedDraftId;
    createSeedBusy = true;
    createSeedError = undefined;
    try {
      const draft = await work();
      if (!validPackDraftIdentity(draft, expectedPackId)) throw new Error("Invalid pack draft response");
      if (!appMounted || action !== createSeedGeneration) return false;
      if (generation !== loadGeneration || route.name !== "create") return true;
      drafts = [draft, ...drafts.filter((candidate) => candidate.id !== draft.id)];
      if (selectedDraftId === selection) {
        selectedDraftId = draft.id;
        studioJson = JSON.stringify(draft.document, null, 2);
        await tick();
        if (generation === loadGeneration && route.name === "create" && selectedDraftId === draft.id) {
          document.getElementById("pack-studio-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      return true;
    } catch {
      if (appMounted && action === createSeedGeneration && generation === loadGeneration && route.name === "create") {
        createSeedError = createSeedPreparation === undefined
          ? "This draft could not be created. Check the source and try again."
          : "The game is saved, but its draft could not be prepared. Try finishing draft setup again.";
      }
      return false;
    } finally {
      if (appMounted && action === createSeedGeneration) createSeedBusy = false;
    }
  }

  function seedSuffix(): string { return crypto.randomUUID().slice(0, 8); }

  async function createPositionSeed(input: { readonly title: string; readonly fen: string; readonly side: "white" | "black" }): Promise<void> {
    const document = positionPackScaffold({ ...input, suffix: seedSuffix() });
    await openSeedDraft(document.id, async () => {
      if (api.createPackDraft === undefined) throw new Error("Pack draft creation is unavailable.");
      return api.createPackDraft(document);
    });
  }

  async function createGameSeed(input: { readonly title: string; readonly side: "white" | "black"; readonly pgn: string; readonly url: string }): Promise<void> {
    const existing = createSeedPreparation;
    const requestedPackId = existing?.packId ?? `distilled-${seedSuffix()}`;
    const completed = await openSeedDraft(requestedPackId, async () => {
      if (api.importGame === undefined || api.distillRun === undefined) throw new Error("Game import and distillation are unavailable.");
      if (existing !== undefined) {
        return (await api.distillRun(existing.runId, { packId: existing.packId, title: existing.title, branchId: existing.branchId })).draft;
      }
      const runId = `author-import-${crypto.randomUUID()}`;
      const writer = WriterSession.observe(runId, storage);
      const imported = await api.importGame({
        id: runId,
        side: input.side,
        opponentPolicy: { mode: "human_common", targetElo: 1800 },
        policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
        seed: Math.floor(Math.random() * 2_147_483_647),
        source: input.url === "" ? { kind: "pgn", pgn: input.pgn } : { kind: "lichess", url: input.url },
      }, writer.writerId);
      WriterSession.claimFor(runId, storage, () => writer.writerId);
      if (imported.run.id !== runId) throw new Error("Imported run response did not match its request");
      createSeedPreparation = { runId, writerId: writer.writerId, packId: requestedPackId, title: input.title, branchId: imported.run.activeCursor.branchId };
      return (await api.distillRun(runId, { packId: requestedPackId, title: input.title, branchId: imported.run.activeCursor.branchId })).draft;
    });
    if (completed && createSeedPreparation?.packId === requestedPackId) createSeedPreparation = undefined;
  }

  async function createRunSeed(input: { readonly runId: string; readonly title: string }): Promise<void> {
    const packId = `distilled-${seedSuffix()}`;
    await openSeedDraft(packId, async () => {
      if (api.distillRun === undefined) throw new Error("Session distillation is unavailable.");
      return (await api.distillRun(input.runId, { packId, title: input.title })).draft;
    });
  }

  async function createPackSeed(packId: string): Promise<void> {
    const suffix = seedSuffix();
    const expectedPackId = `${authoringSlug(packId)}-copy-${authoringSlug(suffix)}`;
    await openSeedDraft(expectedPackId, async () => {
      if (api.exportPack === undefined || api.createPackDraft === undefined) throw new Error("Pack copying is unavailable.");
      const exported = await api.exportPack(packId);
      const document = clonePackForAuthoring(exported.document, suffix);
      return api.createPackDraft(document);
    });
  }


  function registrationBlockReason(draft: PackDraft | undefined): string | undefined {
    if (draft === undefined) return "Select a draft first.";
    if (draft.state !== "draft") return `This draft is ${draft.state} and cannot be changed.`;
    if (!draft.validation.valid) return "Fix the validation errors first.";
    const document = draft.document as Record<string, unknown>;
    const provenance = document.provenance as Record<string, unknown> | undefined;
    const blockers = provenance?.graduationBlockers;
    if (Array.isArray(blockers) && blockers.some((entry) => typeof entry === "object" && entry !== null && (entry as Record<string, unknown>).state === "blocking")) {
      return "Resolve the declared graduation blockers first.";
    }
    return undefined;
  }


  function shapeActionIsCurrent(action: number, generation: number): boolean {
    return appMounted && action === shapeMutationGeneration && generation === loadGeneration && route.name === "create";
  }

  function shapeRegistrationBlockReason(draft: ShapeDraft | undefined): string | undefined {
    if (draft === undefined) return "Select or create a shape draft first.";
    if (draft.state !== "draft") return `This shape is ${draft.state} and cannot be registered.`;
    if (shapeLintState !== "ready" || !shapeBufferValidation?.valid) return "Resolve the current validation issues before registering.";
    return undefined;
  }

  function publishSavedShapeDraft(saved: ShapeDraft, draftId: string, sourceJson: string): void {
    shapeDrafts = shapeDrafts.map((candidate) => candidate.id === draftId ? saved : candidate);
    if (selectedShapeDraftId === draftId && shapeStudioJson === sourceJson) {
      shapeBufferValidation = saved.validation;
    }
  }

  async function createShapeDraft(): Promise<void> {
    if (shapeMutationBusy !== undefined) return;
    const action = ++shapeMutationGeneration;
    const generation = loadGeneration;
    const sourceJson = shapeStudioJson;
    const selection = selectedShapeDraftId;
    shapeMutationBusy = { kind: "create" };
    shapeActionError = undefined;
    try {
      const document = JSON.parse(sourceJson) as unknown;
      const expectedShapeId = typeof document === "object" && document !== null && "id" in document && typeof document.id === "string" ? document.id : "";
      if (api.createShapeDraft === undefined || expectedShapeId === "") throw new Error("Shape draft creation is unavailable");
      const draft = await api.createShapeDraft(document);
      if (!validShapeDraftIdentity(draft, expectedShapeId)) throw new Error("Invalid shape draft response");
      if (shapeActionIsCurrent(action, generation)) {
        shapeDrafts = [draft, ...shapeDrafts.filter((candidate) => candidate.id !== draft.id)];
        if (selectedShapeDraftId === selection && shapeStudioJson === sourceJson) {
          selectedShapeDraftId = draft.id;
          shapeStudioJson = JSON.stringify(draft.document, null, 2);
          shapeBufferValidation = draft.validation;
        }
      }
    } catch {
      if (shapeActionIsCurrent(action, generation)) shapeActionError = "The shape draft could not be created. Check the JSON and try again.";
    } finally {
      if (appMounted && action === shapeMutationGeneration) shapeMutationBusy = undefined;
    }
  }

  async function saveShapeDraft(): Promise<void> {
    if (shapeMutationBusy !== undefined) return;
    const draft = shapeDrafts.find((candidate) => candidate.id === selectedShapeDraftId);
    if (draft === undefined || draft.state !== "draft") return;
    const action = ++shapeMutationGeneration;
    const generation = loadGeneration;
    const sourceJson = shapeStudioJson;
    shapeMutationBusy = { kind: "save", draftId: draft.id };
    shapeActionError = undefined;
    try {
      if (api.updateShapeDraft === undefined) throw new Error("Shape draft saving is unavailable");
      const saved = await api.updateShapeDraft(draft.id, draft.digest, JSON.parse(sourceJson));
      if (!validShapeDraftIdentity(saved, draft.shapeId) || saved.id !== draft.id) throw new Error("Invalid saved shape response");
      if (shapeActionIsCurrent(action, generation)) publishSavedShapeDraft(saved, draft.id, sourceJson);
    } catch {
      if (shapeActionIsCurrent(action, generation)) shapeActionError = "This shape could not be saved. Your editor bytes are unchanged; try again.";
    } finally {
      if (appMounted && action === shapeMutationGeneration) shapeMutationBusy = undefined;
    }
  }

  async function lintShapeDraft(): Promise<void> {
    if (shapeMutationBusy !== undefined) return;
    const draft = shapeDrafts.find((candidate) => candidate.id === selectedShapeDraftId);
    if (draft === undefined || draft.state !== "draft") return;
    const action = ++shapeMutationGeneration;
    const generation = loadGeneration;
    const sourceJson = shapeStudioJson;
    const probeFen = shapeProbeFen;
    shapeLintGeneration += 1;
    shapeMutationBusy = { kind: "probe", draftId: draft.id };
    shapeActionError = undefined;
    shapeProbeResult = undefined;
    try {
      if (api.lintShapeDraft === undefined) throw new Error("Shape validation is unavailable");
      const validation = await api.lintShapeDraft(draft.id, JSON.parse(sourceJson), probeFen);
      if (!validShapeValidation(validation)) throw new Error("Invalid shape validation response");
      if (shapeActionIsCurrent(action, generation) && selectedShapeDraftId === draft.id && shapeStudioJson === sourceJson && shapeProbeFen === probeFen) {
        shapeDrafts = shapeDrafts.map((candidate) => candidate.id === draft.id ? { ...candidate, validation } : candidate);
        shapeBufferValidation = validation;
        shapeProbeResult = validation.probeMatches;
        shapeLintState = "ready";
        const current = selectedShapeCorpusMatch;
        if (current !== undefined && !validation.corpusPreview?.matches.some((match) => match.packId === current.packId && match.ply === current.ply && match.fen === current.fen)) selectedShapeCorpusMatch = undefined;
      }
    } catch {
      if (shapeActionIsCurrent(action, generation)) shapeActionError = "The shape probe could not finish. Your editor bytes and FEN are unchanged; try again.";
    } finally {
      if (appMounted && action === shapeMutationGeneration) shapeMutationBusy = undefined;
    }
  }

  async function registerShapeDraft(): Promise<void> {
    if (shapeMutationBusy !== undefined) return;
    const draft = shapeDrafts.find((candidate) => candidate.id === selectedShapeDraftId);
    if (shapeRegistrationBlockReason(draft) !== undefined || draft === undefined || api.updateShapeDraft === undefined || api.registerShapeDraft === undefined) return;
    const action = ++shapeMutationGeneration;
    const generation = loadGeneration;
    const sourceJson = shapeStudioJson;
    shapeMutationBusy = { kind: "register", draftId: draft.id };
    shapeActionError = undefined;
    let saved: ShapeDraft | undefined;
    let registered = false;
    try {
      saved = await api.updateShapeDraft(draft.id, draft.digest, JSON.parse(sourceJson));
      if (!validShapeDraftIdentity(saved, draft.shapeId) || saved.id !== draft.id || !saved.validation.valid) throw new Error("Invalid saved shape response");
      if (shapeActionIsCurrent(action, generation)) publishSavedShapeDraft(saved, draft.id, sourceJson);
      const summary = await api.registerShapeDraft(saved.id);
      registered = true;
      if (!validRegisteredShapeIdentity(summary, saved)) throw new Error("Invalid registered shape response");
      if (!shapeActionIsCurrent(action, generation)) return;
      shapeDrafts = shapeDrafts.map((candidate) => candidate.id === draft.id ? { ...candidate, state: "registered" } : candidate);
      if (api.shapeDrafts !== undefined) {
        try {
          const refreshed = await api.shapeDrafts();
          if (shapeActionIsCurrent(action, generation)) shapeDrafts = refreshed;
        } catch {
          if (shapeActionIsCurrent(action, generation)) shapeActionError = "The shape was registered, but the draft list could not refresh. Reload Create to see its current state.";
        }
      }
    } catch {
      if (shapeActionIsCurrent(action, generation)) {
        shapeActionError = registered
          ? "The shape was registered, but its response could not be matched. Reload Create before acting on it again."
          : saved === undefined
            ? "This shape could not be saved for registration. Your editor bytes remain here; try again."
            : "The shape was saved, but could not be registered. Resolve any publication blocker and try registration again.";
      }
    } finally {
      if (appMounted && action === shapeMutationGeneration) shapeMutationBusy = undefined;
    }
  }

  function liveRotationMembers():readonly string[]{return [...new Set(liveRotationHandles.split(",").map((handle)=>handle.trim()).filter(Boolean))];}
  function selectedLiveWorkflow():LiveWorkflow{return liveWorkflow(liveKind,liveBoardControl);}
  function chooseLiveWorkflow(workflow:LiveWorkflow):void{const option=liveWorkflowOption(workflow);liveKind=option.kind;liveBoardControl=option.boardControl;liveCreateError=undefined;}
  function liveSourceIneligibility(run:RunSummary):string|undefined{return liveRunIneligibility(run,selectedLiveWorkflow());}
  function liveCreateDisabledReason(run:RunSummary):string|undefined{
    if(run.viewerRole!=="host")return "Only the run host can start a session.";
    const sourceReason=liveSourceIneligibility(run);if(sourceReason)return sourceReason;
    if(!liveTitle.trim())return "Give the session a title viewers will recognize.";
    if(liveBoardControl==="rotation"&&liveRotationMembers().length===0)return "Add at least one handle to the rotation.";
    if(liveBoardControl==="match"&&!liveMatchWhite.trim()&&!liveMatchBlack.trim())return "Name at least one player; the other seat may stay open for a friend link.";
    if(liveCreateBusy)return "Another session is being created.";
    if(liveCreateUncertain)return "Reload or reopen Live before creating another session.";
    return undefined;
  }
  type LiveCreateInput=Parameters<NonNullable<DrillClientApi["createLiveSession"]>>[0];
  function assertCreatedLiveSession(created:LiveSession,input:LiveCreateInput):void{
    const requestedRotation=input.rotationHandles;
    const validRotation=requestedRotation===undefined||created.rotation?.length===requestedRotation.length;
    if(created.id.trim()===""||created.runId!==input.runId||created.kind!==input.kind||created.title!==input.title||created.boardControl!==(input.boardControl??"host_directed")||created.classroomId!==input.classroomId||created.scheduledFor!==input.scheduledFor||created.closedAt!==undefined||created.createdBy.trim()===""||!Number.isInteger(created.rotationCursor)||created.rotationCursor<0||!Number.isFinite(Date.parse(created.createdAt))||!validRotation)throw new Error("Crossed live-session creation response");
  }
  async function createLive(run:RunSummary):Promise<void>{
    if(liveCreateDisabledReason(run)!==undefined)return;
    const generation=loadGeneration;
    const input:LiveCreateInput={runId:run.id,kind:liveKind,title:liveTitle.trim(),boardControl:liveBoardControl,...(liveClassroomId?{classroomId:liveClassroomId}:{}),...(liveScheduledFor?{scheduledFor:new Date(liveScheduledFor).toISOString()}:{}),...(liveBoardControl==="rotation"?{rotationHandles:liveRotationMembers()}:{}),...(liveBoardControl==="match"?{matchPlayers:{...(liveMatchWhite?{white:liveMatchWhite}:{}),...(liveMatchBlack?{black:liveMatchBlack}:{})}}:{})};
    liveCreateBusy=true;
    liveCreateError=undefined;
    liveCreateUncertain=false;
    try{
      if(api.createLiveSession===undefined)throw new Error("Live session creation is unavailable.");
      const created=await api.createLiveSession(input);
      if(generation!==loadGeneration||route.name!=="live")return;
      try{assertCreatedLiveSession(created,input);}
      catch{liveCreateUncertain=true;liveCreateError="A session may have been created, but its response could not be matched. Reload or reopen Live before creating another.";return;}
      navigate(routePath({name:"live-session",sessionId:created.id}));
    }catch{if(generation===loadGeneration&&route.name==="live")liveCreateError="This session could not be created. Your setup is unchanged; check it and try again.";}
    finally{if(generation===loadGeneration&&route.name==="live")liveCreateBusy=false;}
  }
  function classroomRouteIsCurrent(generation:number):boolean{return generation===loadGeneration&&route.name==="live";}
  function classroomIsCurrent(id:string,generation:number):boolean{return classroomRouteIsCurrent(generation)&&classroomDetail?.classroom.id===id;}
  async function createClassroom():Promise<void>{
    const name=classroomName.trim();
    if(!name||classroomBusy!==undefined)return;
    const generation=loadGeneration;const action=++classroomActionGeneration;
    classroomBusy="create";classroomActionError=undefined;
    try{
      if(api.createClassroom===undefined)throw new Error("unavailable");
      await api.createClassroom(name);
      if(classroomRouteIsCurrent(generation)&&action===classroomActionGeneration&&classroomName.trim()===name)classroomName="";
    }catch{if(classroomRouteIsCurrent(generation)&&action===classroomActionGeneration)classroomActionError="The classroom could not be created. Check the name and try again.";}
    if(classroomRouteIsCurrent(generation)&&action===classroomActionGeneration&&classroomActionError===undefined){
      try{const next=await (api.classrooms?.()??Promise.resolve([]));if(classroomRouteIsCurrent(generation)&&action===classroomActionGeneration)classrooms=next;}
      catch{if(classroomRouteIsCurrent(generation)&&action===classroomActionGeneration)classroomActionError="The classroom was created, but the list could not refresh. Reload to see it.";}
    }
    if(classroomRouteIsCurrent(generation)&&action===classroomActionGeneration)classroomBusy=undefined;
  }
  async function openClassroom(id:string):Promise<void>{
    if(classroomBusy!==undefined&&!classroomBusy.startsWith("open:"))return;
    const generation=loadGeneration;const request=++classroomDetailGeneration;
    classroomBusy=`open:${id}`;classroomActionError=undefined;
    try{
      if(api.classroom===undefined)throw new Error("unavailable");
      const next=await api.classroom(id);
      if(classroomRouteIsCurrent(generation)&&request===classroomDetailGeneration&&next.classroom.id===id)classroomDetail=next;
    }catch{if(classroomRouteIsCurrent(generation)&&request===classroomDetailGeneration)classroomActionError="That classroom could not be opened. Try again.";}
    finally{if(classroomRouteIsCurrent(generation)&&request===classroomDetailGeneration)classroomBusy=undefined;}
  }
  async function respondClassroom(id:string,op:"accept"|"decline"|"leave"):Promise<void>{
    if(classroomBusy!==undefined)return;
    const generation=loadGeneration;const action=++classroomActionGeneration;
    classroomBusy=`respond:${id}`;classroomActionError=undefined;
    try{
      if(api.respondClassroomInvite===undefined)throw new Error("unavailable");
      await api.respondClassroomInvite(id,op);
      if(classroomRouteIsCurrent(generation)&&action===classroomActionGeneration&&classroomDetail?.classroom.id===id)classroomDetail=undefined;
    }catch{if(classroomRouteIsCurrent(generation)&&action===classroomActionGeneration)classroomActionError=`The classroom ${op} action did not finish. Try again.`;}
    if(classroomRouteIsCurrent(generation)&&action===classroomActionGeneration&&classroomActionError===undefined){
      try{const next=await (api.classrooms?.()??Promise.resolve([]));if(classroomRouteIsCurrent(generation)&&action===classroomActionGeneration)classrooms=next;}
      catch{if(classroomRouteIsCurrent(generation)&&action===classroomActionGeneration)classroomActionError=`The classroom ${op} action finished, but the list could not refresh. Reload to see the current state.`;}
    }
    if(classroomRouteIsCurrent(generation)&&action===classroomActionGeneration)classroomBusy=undefined;
  }
  async function inviteClassroom():Promise<void>{
    const detail=classroomDetail;const handle=classroomInviteHandle.trim();const role=classroomInviteRole;
    if(detail===undefined||!handle||classroomBusy!==undefined)return;
    const id=detail.classroom.id;const generation=loadGeneration;const action=++classroomActionGeneration;
    classroomBusy=`invite:${id}`;classroomActionError=undefined;
    try{
      if(api.inviteClassroomMember===undefined||api.classroom===undefined)throw new Error("unavailable");
      await api.inviteClassroomMember(id,handle,role);
      if(!classroomIsCurrent(id,generation)||action!==classroomActionGeneration)return;
      if(classroomInviteHandle.trim()===handle)classroomInviteHandle="";
    }catch{if(classroomIsCurrent(id,generation)&&action===classroomActionGeneration)classroomActionError="The invitation could not be sent. Check the handle and try again.";}
    if(classroomIsCurrent(id,generation)&&action===classroomActionGeneration&&classroomActionError===undefined){
      try{const next=await api.classroom!(id);if(classroomIsCurrent(id,generation)&&action===classroomActionGeneration&&next.classroom.id===id)classroomDetail=next;}
      catch{if(classroomIsCurrent(id,generation)&&action===classroomActionGeneration)classroomActionError="The invitation was sent, but the classroom could not refresh. Reload to see the new member.";}
    }
    if(classroomRouteIsCurrent(generation)&&action===classroomActionGeneration)classroomBusy=undefined;
  }
  async function assignClassroomPack():Promise<void>{
    const detail=classroomDetail;const packId=assignmentPackId;const note=assignmentNote;const dueAt=assignmentDueAt;
    if(detail===undefined||!packId||classroomBusy!==undefined)return;
    const id=detail.classroom.id;const generation=loadGeneration;const action=++classroomActionGeneration;
    classroomBusy=`assign:${id}`;classroomActionError=undefined;
    try{
      if(api.createAssignment===undefined||api.classroom===undefined)throw new Error("unavailable");
      await api.createAssignment(id,{packId,...(note.trim()?{note}:{}),...(dueAt?{dueAt:new Date(dueAt).toISOString()}: {})});
      if(!classroomIsCurrent(id,generation)||action!==classroomActionGeneration)return;
      if(assignmentPackId===packId)assignmentPackId="";if(assignmentNote===note)assignmentNote="";if(assignmentDueAt===dueAt)assignmentDueAt="";
    }catch{if(classroomIsCurrent(id,generation)&&action===classroomActionGeneration)classroomActionError="The pack could not be assigned. Keep these details and try again.";}
    if(classroomIsCurrent(id,generation)&&action===classroomActionGeneration&&classroomActionError===undefined){
      try{const next=await api.classroom!(id);if(classroomIsCurrent(id,generation)&&action===classroomActionGeneration&&next.classroom.id===id)classroomDetail=next;}
      catch{if(classroomIsCurrent(id,generation)&&action===classroomActionGeneration)classroomActionError="The pack was assigned, but the classroom could not refresh. Reload to see the assignment.";}
    }
    if(classroomRouteIsCurrent(generation)&&action===classroomActionGeneration)classroomBusy=undefined;
  }
  async function submitAssignedRun(assignmentId:string,runId:string):Promise<boolean>{
    if(assignmentBusy!==undefined)return false;
    const generation=loadGeneration;const action=++assignmentActionGeneration;
    assignmentBusy=`submit:${assignmentId}:${runId}`;assignmentActionError=undefined;
    try{
      if(api.submitAssignment===undefined)throw new Error("unavailable");
      await api.submitAssignment(assignmentId,runId);
    }catch{if(generation===loadGeneration&&action===assignmentActionGeneration){assignmentActionError="This run could not be shared. Nothing changed; try again.";assignmentBusy=undefined;}return false;}
    if(generation!==loadGeneration||action!==assignmentActionGeneration)return true;
    try{const next=await (api.assignments?.()??Promise.resolve([]));if(generation===loadGeneration&&action===assignmentActionGeneration)assignedPacks=next;}
    catch{if(generation===loadGeneration&&action===assignmentActionGeneration)assignmentActionError="The run was shared, but the assignment list could not refresh. Reload to see the current state.";}
    finally{if(generation===loadGeneration&&action===assignmentActionGeneration)assignmentBusy=undefined;}
    return true;
  }
  async function withdrawAssignedRun(assignmentId:string,runId:string):Promise<void>{
    if(assignmentBusy!==undefined)return;
    const generation=loadGeneration;const action=++assignmentActionGeneration;
    assignmentBusy=`withdraw:${assignmentId}:${runId}`;assignmentActionError=undefined;
    try{
      if(api.withdrawSubmission===undefined)throw new Error("unavailable");
      await api.withdrawSubmission(assignmentId,runId);
    }catch{if(generation===loadGeneration&&action===assignmentActionGeneration){assignmentActionError="Teacher access could not be revoked. Nothing changed; try again.";assignmentBusy=undefined;}return;}
    if(generation!==loadGeneration||action!==assignmentActionGeneration)return;
    try{const next=await (api.assignments?.()??Promise.resolve([]));if(generation===loadGeneration&&action===assignmentActionGeneration)assignedPacks=next;}
    catch{if(generation===loadGeneration&&action===assignmentActionGeneration)assignmentActionError="Teacher access was revoked, but the assignment list could not refresh. Reload to see the current state.";}
    finally{if(generation===loadGeneration&&action===assignmentActionGeneration)assignmentBusy=undefined;}
  }
  function liveWriterId(runId:string):string|undefined{return WriterSession.peek(runId,storage)?.writerId;}
  function liveSessionIsCurrent(detail:LiveSessionDetail,generation:number):boolean{return generation===loadGeneration&&route.name==="live-session"&&route.sessionId===detail.session.id&&liveDetail?.session.id===detail.session.id;}
  function activeLiveSessionIsCurrent(detail:LiveSessionDetail,generation:number):boolean{return generation===loadGeneration&&activeLiveDetail?.session.id===detail.session.id&&((route.name==="run"&&route.runId===detail.session.runId)||(route.name==="live-overlay"&&route.runId===detail.session.runId));}
  async function refreshCurrentLiveSession(detail:LiveSessionDetail,generation:number):Promise<LiveSessionDetail|undefined>{
    if(!liveSessionIsCurrent(detail,generation)||api.liveSession===undefined)return undefined;
    const refresh=++liveRefreshGeneration;
    const next=await api.liveSession(detail.session.id);
    if(next.session.id!==detail.session.id||next.session.runId!==detail.session.runId)throw new Error("Crossed live-session response");
    if(liveSessionIsCurrent(detail,generation)&&refresh===liveRefreshGeneration)liveDetail=next;
    return next;
  }

  interface LiveSessionActionOptions<T> {
    readonly failure: string;
    readonly refreshFailure?: string;
    readonly completionFailure?: string;
    readonly refresh?: "session" | "session-and-journal" | false;
    readonly onCommitted?: (result: T) => void;
  }

  function liveSessionActionIsCurrent(detail:LiveSessionDetail,generation:number,action:number):boolean {
    return appMounted&&action===liveSessionActionGeneration&&liveSessionIsCurrent(detail,generation);
  }

  async function runLiveSessionAction<T>(
    detail:LiveSessionDetail,
    descriptor:NonNullable<typeof liveSessionActionBusy>,
    work:()=>Promise<T>,
    options:LiveSessionActionOptions<T>,
  ):Promise<boolean>{
    if(liveSessionActionBusy!==undefined)return false;
    const generation=loadGeneration;
    const action=++liveSessionActionGeneration;
    liveSessionActionBusy=descriptor;
    liveSessionActionError=undefined;
    try{
      let result:T;
      try{result=await work();}
      catch{if(liveSessionActionIsCurrent(detail,generation,action))liveSessionActionError=options.failure;return false;}
      if(!liveSessionActionIsCurrent(detail,generation,action))return true;
      try{options.onCommitted?.(result);}
      catch{if(liveSessionActionIsCurrent(detail,generation,action))liveSessionActionError=options.completionFailure??"The action finished, but its response could not be matched. Reload this session before acting again.";return true;}
      if(options.refresh!==false){
        try{
          if(options.refresh==="session-and-journal")await refreshCurrentLiveSessionWithJournal(detail,generation);
          else await refreshCurrentLiveSession(detail,generation);
        }
        catch{if(liveSessionActionIsCurrent(detail,generation,action))liveSessionActionError=options.refreshFailure??"The action finished, but this session could not refresh. Reload it to see the current state.";}
      }
      return true;
    }finally{
      finishLiveSessionAction(detail,action);
    }
  }

  function finishLiveSessionAction(detail:LiveSessionDetail,action:number):void {
    if(appMounted&&action===liveSessionActionGeneration&&liveSessionActionBusy?.sessionId===detail.session.id)liveSessionActionBusy=undefined;
  }
  async function refreshCurrentLiveSessionWithJournal(detail:LiveSessionDetail,generation:number):Promise<void>{
    if(!liveSessionIsCurrent(detail,generation)||api.liveSession===undefined||api.sessionJournal===undefined)return;
    const refresh=++liveRefreshGeneration;
    const [next,nextJournal]=await Promise.all([api.liveSession(detail.session.id),api.sessionJournal(detail.session.id)]);
    if(next.session.id!==detail.session.id||next.session.runId!==detail.session.runId)throw new Error("Crossed live-session response");
    if(liveSessionIsCurrent(detail,generation)&&refresh===liveRefreshGeneration){liveDetail=next;liveJournal=nextJournal.entries;}
  }
  function assertLiveVoteTally(result:VoteTally,detail:LiveSessionDetail,source:VoteTally,expectedState:"open"|"closed",expectedApplied:string|null):void{
    const sameOptions=result.window.options.length===source.window.options.length&&result.window.options.every((option,index)=>option.moveUci===source.window.options[index]?.moveUci&&option.label===source.window.options[index]?.label);
    const optionMoves=new Set(result.window.options.map((option)=>option.moveUci));
    const tallyMoves=new Set(result.tally.map((item)=>item.moveUci));
    const validCounts=result.tally.every((item,index)=>item.moveUci===result.window.options[index]?.moveUci&&item.label===result.window.options[index]?.label&&optionMoves.has(item.moveUci)&&Number.isInteger(item.count)&&item.count>=0);
    const total=result.tally.reduce((sum,item)=>sum+item.count,0);
    if(result.window.id!==source.window.id||result.window.sessionId!==detail.session.id||result.window.nodeId!==source.window.nodeId||result.window.prompt!==source.window.prompt||result.window.opensAt!==source.window.opensAt||result.window.closesAt!==source.window.closesAt||result.window.state!==expectedState||result.window.appliedOptionUci!==expectedApplied||!sameOptions||tallyMoves.size!==optionMoves.size||result.tally.length!==result.window.options.length||!validCounts||result.total!==total||!Number.isInteger(result.relayed)||result.relayed<0||result.relayed>result.total)throw new Error("Crossed vote response");
  }
  async function refreshCurrentActiveLiveSession(detail:LiveSessionDetail,generation:number):Promise<LiveSessionDetail|undefined>{
    if(!activeLiveSessionIsCurrent(detail,generation)||api.liveSession===undefined)return undefined;
    const refresh=++liveRefreshGeneration;
    const next=await api.liveSession(detail.session.id);
    if(next.session.id!==detail.session.id||next.session.runId!==detail.session.runId)throw new Error("Crossed active live-session response");
    if(activeLiveSessionIsCurrent(detail,generation)&&refresh===liveRefreshGeneration){
      activeLiveDetail=next;
      controller.setMatchMode(next?.match===undefined?undefined:next.match.pausedAt===null?"live":"paused");
    }
    return next;
  }
  async function submitLiveProposal():Promise<void>{
    const detail=liveDetail;const move=liveProposalMove;const nodeId=detail?.activeNodeId;
    if(detail===undefined||nodeId===undefined||!liveMoveChoices.some((choice)=>choice.uci===move))return;
    await runLiveSessionAction(detail,{kind:"propose",sessionId:detail.session.id,target:`${nodeId}:${move}`},async()=>{
      if(api.proposeMove===undefined)throw new Error("unavailable");
      return api.proposeMove(detail.session.id,nodeId,move);
    },{
      failure:"That proposal could not be sent. Your selected move remains here; try again.",
      refreshFailure:"The proposal was sent, but this session could not refresh. Reload it to see the proposal.",
      onCommitted:()=>{if(liveProposalMove===move)liveProposalMove="";},
    });
  }
  async function updateLiveMember(handle:string,operation:{readonly op:"grant";readonly role:"participant"|"spectator"}|{readonly op:"revoke"}):Promise<void>{
    const detail=liveDetail;const subject=handle.trim();const requested={...operation};
    if(detail===undefined||!subject)return;
    const writer=liveWriterId(detail.session.runId);
    if(writer===undefined)return;
    await runLiveSessionAction(detail,{kind:"member",sessionId:detail.session.id,target:`${requested.op}:${subject}`},async()=>{
      if(api.updateGrants===undefined)throw new Error("unavailable");
      return api.updateGrants(detail.session.runId,requested.op==="grant"?{op:"grant",handle:subject,role:requested.role}:{op:"revoke",handle:subject},writer);
    },{
      failure:"Session access could not be changed. Nothing changed; check the handle and try again.",
      refreshFailure:"Session access changed, but this session could not refresh. Reload it before changing access again.",
      onCommitted:()=>{if(liveMemberHandle.trim()===subject)liveMemberHandle="";},
    });
  }
  async function resolveLiveProposal(proposalId:string,op:"apply"|"decline"):Promise<void>{
    const detail=liveDetail;
    if(detail===undefined)return;
    await runLiveSessionAction(detail,{kind:"resolve-proposal",sessionId:detail.session.id,target:`${proposalId}:${op}`},async()=>{
      if(api.resolveProposal===undefined)throw new Error("unavailable");
      const writer=WriterSession.claimFor(detail.session.runId,storage);
      if(op==="apply"){
        if(api.claimLease===undefined)throw new Error("unavailable");
        await api.claimLease(detail.session.runId,writer.writerId);
      }
      return api.resolveProposal(detail.session.id,proposalId,op,writer.writerId);
    },{
      failure:op==="apply"?"The proposal could not be played. Reload the session before trying again; board possession may have changed.":"The proposal could not be declined. It remains open; try again.",
      refreshFailure:`The proposal was ${op==="apply"?"played":"declined"}, but this session could not refresh. Reload it to see the current state.`,
    });
  }
  async function offerLiveBoard():Promise<void>{
    const detail=liveDetail;const handle=liveOfferHandle.trim();if(detail===undefined||!handle)return;const writer=liveWriterId(detail.session.runId);if(!writer)return;
    await runLiveSessionAction(detail,{kind:"offer-board",sessionId:detail.session.id,target:handle},async()=>{if(api.boardControl===undefined)throw new Error("unavailable");return api.boardControl(detail.session.id,writer,"offer",handle);},{failure:"The board could not be offered. Possession is unchanged; check the handle and try again.",refreshFailure:"The board was offered, but this session could not refresh. Reload it before changing possession again.",onCommitted:()=>{if(liveOfferHandle.trim()===handle)liveOfferHandle="";}});
  }
  async function advanceLiveRotation():Promise<void>{
    const detail=liveDetail;if(detail===undefined)return;const writer=liveWriterId(detail.session.runId);if(!writer)return;
    await runLiveSessionAction(detail,{kind:"advance-rotation",sessionId:detail.session.id},async()=>{if(api.boardControl===undefined)throw new Error("unavailable");return api.boardControl(detail.session.id,writer,"advance");},{failure:"The rotation could not advance. Its order is unchanged; try again.",refreshFailure:"The rotation advanced, but this session could not refresh. Reload it before advancing again."});
  }
  async function confirmLiveReclaim():Promise<void>{
    const detail=liveDetail;
    if(detail===undefined)return;
    await runLiveSessionAction(detail,{kind:"reclaim",sessionId:detail.session.id,target:detail.leaseHeldBy.learnerId},async()=>{
      if(api.boardControl===undefined)throw new Error("unavailable");
      const writer=WriterSession.claimFor(detail.session.runId,storage);
      return api.boardControl(detail.session.id,writer.writerId,"reclaim");
    },{
      failure:"The board could not be taken back. Possession is unchanged; try again.",
      refreshFailure:"The board was taken back, but this session could not refresh. Reload it before changing possession again.",
      refresh:"session-and-journal",
      onCommitted:()=>{liveReclaimIntent=false;},
    });
  }
  function setLiveVoteMove(index:number,moveUci:string):void{const previous=liveVoteOptions[index]!;const previousDefault=liveMoveChoices.find((choice)=>choice.uci===previous.moveUci)?.san??previous.moveUci;const nextDefault=liveMoveChoices.find((choice)=>choice.uci===moveUci)?.san??"";liveVoteOptions=liveVoteOptions.map((option,candidate)=>candidate===index?{moveUci,label:previous.label===""||previous.label===previousDefault?nextDefault:previous.label}:option);}
  function setLiveVoteLabel(index:number,label:string):void{liveVoteOptions=liveVoteOptions.map((option,candidate)=>candidate===index?{...option,label}:option);}
  function liveVoteReady():boolean{const moves=liveVoteOptions.map((option)=>option.moveUci);return liveVoteOptions.length>=MIN_LIVE_VOTE_OPTIONS&&liveVoteOptions.length<=MAX_LIVE_VOTE_OPTIONS&&new Set(moves).size===moves.length&&liveVoteOptions.every((option)=>liveMoveChoices.some((choice)=>choice.uci===option.moveUci)&&option.label.trim().length>0)&&liveVotePrompt.trim().length>0&&liveVoteDuration>=MIN_LIVE_VOTE_SECONDS&&liveVoteDuration<=MAX_LIVE_VOTE_SECONDS;}
  async function openLiveVote():Promise<void>{
    const detail=liveDetail;if(detail===undefined||!liveVoteReady())return;
    const input={nodeId:detail.activeNodeId,prompt:liveVotePrompt.trim(),options:liveVoteOptions.map((option)=>({...option,label:option.label.trim()})),durationSeconds:liveVoteDuration};
    await runLiveSessionAction(detail,{kind:"open-vote",sessionId:detail.session.id,target:detail.activeNodeId},async()=>{if(api.openVote===undefined)throw new Error("unavailable");return api.openVote(detail.session.id,input);},{failure:"The vote could not be opened. Your prompt and options remain here; try again.",refreshFailure:"The vote opened, but this session could not refresh. Reload it to see the live tally."});
  }
  async function castLiveVote(choiceUci:string):Promise<void>{
    const detail=liveDetail;
    const vote=detail?.vote;
    if(detail===undefined||vote===undefined||vote.window.state!=="open"||!vote.window.options.some((option)=>option.moveUci===choiceUci))return;
    liveVoteStatus=undefined;
    await runLiveSessionAction(detail,{kind:"cast-vote",sessionId:detail.session.id,target:`${vote.window.id}:${choiceUci}`},async()=>{if(api.castVote===undefined)throw new Error("unavailable");return api.castVote(detail.session.id,vote.window.id,choiceUci);},{
      failure:"Your vote could not be recorded. The tally is unchanged; try again.",
      completionFailure:"Your vote may have been recorded, but its tally could not be matched. Reload before voting again.",
      refresh:false,
      onCommitted:(tally)=>{assertLiveVoteTally(tally,detail,vote,"open",vote.window.appliedOptionUci);++liveRefreshGeneration;liveDetail={...detail,vote:tally};const option=tally.window.options.find((candidate)=>candidate.moveUci===choiceUci);liveVoteStatus=`Vote recorded for ${option?.label??choiceUci}. You can change it while the vote is open.`;},
    });
  }
  async function closeLiveVote():Promise<void>{
    const detail=liveDetail;
    const vote=detail?.vote;
    if(detail===undefined||vote===undefined||vote.window.state!=="open")return;
    const applied=liveVoteAppliedMove||null;
    if(applied!==null&&!vote.window.options.some((option)=>option.moveUci===applied))return;
    liveVoteStatus=undefined;
    await runLiveSessionAction(detail,{kind:"close-vote",sessionId:detail.session.id,target:`${vote.window.id}:${applied??"none"}`},async()=>{if(api.closeVote===undefined)throw new Error("unavailable");return api.closeVote(detail.session.id,vote.window.id,applied??undefined);},{
      failure:"The vote could not be closed. It remains open; try again.",
      completionFailure:"The vote may have closed, but its tally could not be matched. Reload before acting again.",
      refresh:false,
      onCommitted:(tally)=>{assertLiveVoteTally(tally,detail,vote,"closed",applied);++liveRefreshGeneration;liveDetail={...detail,vote:tally};const selected=tally.window.options.find((option)=>option.moveUci===tally.window.appliedOptionUci);liveVoteStatus=selected===undefined?"Vote closed. No move was recorded as applied.":`Vote closed. Recorded ${selected.label} as applied; no move was played.`;},
    });
  }
  async function inviteLiveParticipant():Promise<void>{
    const detail=liveDetail;const handle=liveInviteHandle.trim();const url=liveInviteUrl.trim();const leg=liveInviteLeg;if(detail===undefined||(!handle&&!url))return;
    await runLiveSessionAction(detail,{kind:"invite",sessionId:detail.session.id,target:`${leg}:${handle}:${url}`},async()=>{if(api.inviteToSession===undefined)throw new Error("unavailable");return api.inviteToSession(detail.session.id,{...(detail.session.kind==="match"?{leg}:{}),...(handle?{handle}:{}),...(url?{externalChallengeUrl:url}:{})});},{failure:"The invitation could not be created. Your participant details remain here; check them and try again.",refreshFailure:"The invitation was created, but this session could not refresh. Reload it to see the invitation.",onCommitted:()=>{if(liveInviteHandle.trim()===handle&&liveInviteUrl.trim()===url){liveInviteHandle="";liveInviteUrl="";}}});
  }
  async function importLiveArenaLeg():Promise<void>{
    const detail=liveDetail;const pgn=liveArenaPgn;const leg=liveArenaLeg;if(detail===undefined||!pgn.trim())return;const writer=liveWriterId(detail.session.runId);if(!writer)return;
    await runLiveSessionAction(detail,{kind:"import-leg",sessionId:detail.session.id,target:String(leg)},async()=>{if(api.importArenaLeg===undefined)throw new Error("unavailable");return api.importArenaLeg(detail.session.id,leg,pgn,writer);},{failure:"That Arena leg could not be imported. The PGN remains here; check it and try again.",refreshFailure:"The Arena leg was imported, but this session could not refresh. Reload it to see the recorded leg.",onCommitted:()=>{if(liveArenaPgn===pgn)liveArenaPgn="";}});
  }
  function moveAuthorHandle(learnerId:string|null):string{return liveDetail?.grants.find((grant)=>grant.learnerId===learnerId)?.handle??"former member";}
  function liveMoveLabel(moveUci:string,nodeId:string):string{return nodeId===liveDetail?.activeNodeId?liveMoveChoices.find((choice)=>choice.uci===moveUci)?.san??"Legal move":"Move from an earlier position";}
  function journalActorLabel(learnerId:string|null):string{return learnerId===null?"System":`@${moveAuthorHandle(learnerId)}`;}
  async function operateMatch(op:"propose_pause"|"accept_pause"|"withdraw_pause"|"pause"|"resume"):Promise<void>{
    const detail=liveDetail;if(detail===undefined)return;
    await runLiveSessionAction(detail,{kind:"match",sessionId:detail.session.id,target:op},async()=>{
      if(api.matchOperation===undefined)throw new Error("unavailable");
      let writerId:string|undefined;
      if(op==="resume"){
        const writer=WriterSession.claimFor(detail.session.runId,storage);
        if(api.claimLease===undefined)throw new Error("unavailable");
        await api.claimLease(detail.session.runId,writer.writerId);
        writerId=writer.writerId;
      }
      return api.matchOperation(detail.session.id,op,writerId);
    },{failure:"The match action could not finish. Reload before trying again; board possession may have changed.",refreshFailure:"The match action finished, but this session could not refresh. Reload it to see the main-line state."});
  }
  async function operateActiveMatch(op:"propose_pause"|"accept_pause"|"withdraw_pause"|"pause"|"resume"):Promise<void>{
    const detail=activeLiveDetail;
    if(detail===undefined||activeMatchActionBusy!==undefined)return;
    const generation=loadGeneration;const action=++activeMatchActionGeneration;
    const runId=detail.session.runId;
    activeMatchActionBusy={sessionId:detail.session.id,runId,op};
    activeMatchActionError=undefined;
    let committed=false;
    try{
      try{
        if(api.matchOperation===undefined)throw new Error("unavailable");
        if(op==="resume"&&session.runState?.access==="read_only")await controller.claimLease();
        if(!activeLiveSessionIsCurrent(detail,generation)||action!==activeMatchActionGeneration)return;
        await api.matchOperation(detail.session.id,op,op==="resume"?liveWriterId(runId):undefined);
        committed=true;
      }catch{
        if(activeLiveSessionIsCurrent(detail,generation)&&action===activeMatchActionGeneration)activeMatchActionError="The match action could not finish. Reload before trying again; board possession may have changed.";
        return;
      }
      if(!activeLiveSessionIsCurrent(detail,generation)||action!==activeMatchActionGeneration)return;
      try{
        await refreshCurrentActiveLiveSession(detail,generation);
        if(op==="resume"&&activeLiveSessionIsCurrent(detail,generation)&&action===activeMatchActionGeneration)await controller.resume(runId,{matchMode:"live"});
      }catch{
        if(activeLiveSessionIsCurrent(detail,generation)&&action===activeMatchActionGeneration)activeMatchActionError="The match action finished, but the board could not refresh. Reload it to see the main-line state.";
      }
    }finally{
      if(action===activeMatchActionGeneration&&activeMatchActionBusy?.sessionId===detail.session.id)activeMatchActionBusy=undefined;
      if(!committed&&activeMatchActionError===undefined&&activeLiveSessionIsCurrent(detail,generation)&&action===activeMatchActionGeneration)activeMatchActionError="The match action could not finish. Reload before trying again.";
    }
  }
  async function mintJoinLink():Promise<void>{
    const detail=liveDetail;const handle=liveJoinHandle.trim();const slot=liveJoinSlot;if(detail===undefined)return;
    await runLiveSessionAction(detail,{kind:"friend-link",sessionId:detail.session.id,target:`${slot}:${handle}`},async()=>{if(api.mintSessionLink===undefined)throw new Error("unavailable");return api.mintSessionLink(detail.session.id,{matchSlot:slot,invitedRole:"participant",...(handle?{invitedHandle:handle}:{})});},{failure:"The friend link could not be created. Check the seat and try again.",completionFailure:"A friend link may have been created, but its response could not be matched. Reload before minting another.",refresh:false,onCommitted:(result)=>{if(typeof result.url!=="string"||result.url.trim()==="")throw new Error("invalid");liveJoinUrl=result.url;}});
  }
  async function mintWatchLink():Promise<void>{
    const detail=liveDetail;
    if(detail===undefined)return;
    await runLiveSessionAction(detail,{kind:"watch-link",sessionId:detail.session.id},async()=>{if(api.mintSessionLink===undefined)throw new Error("unavailable");return api.mintSessionLink(detail.session.id,{invitedRole:"spectator"});},{failure:"The watch link could not be created. Nothing was shown; try again.",completionFailure:"A watch link may have been created, but its response could not be matched. Reload before minting another.",refresh:false,onCommitted:(result)=>{if(typeof result.url!=="string"||result.url.trim()==="")throw new Error("invalid");liveWatchUrl=result.url;}});
  }

  onMount(() => {
    const stopTheme = themeController.start();
    window.addEventListener("tabiya:unauthenticated", onUnauthenticated);
    unsubscribeController = controller.subscribe((next) => (session = next));
    unsubscribeRouter = router.subscribe((next) => {
      route = next;
      document.title = routeTitle(next);
      if (authLoading) return;
      loadVisibleRoute(next);
      if (learner !== undefined) {
        syncLivePolling(next);
        syncStoryPolling(next);
      }
    });
    void (async () => {
      try {
        learner = api.session === undefined
          ? { id: "learner-test", handle: "test", createdAt: new Date(0).toISOString() }
          : await api.session();
        startRouter();
      } catch {
        learner = undefined;
      } finally {
        authLoading = false;
        startRouter();
      }
    })();
    return stopTheme;
  });

  $effect(() => {
    if(route.name!=="run"||session.runState?.access!=="read_only"||!learnerOwnsActiveMatchTurn()||autoClaimingMatch)return;
    autoClaimingMatch=true;
    void controller.claimLease().finally(()=>{autoClaimingMatch=false;});
  });

  onDestroy(() => {
    appMounted = false;
    authGeneration += 1;
    distillGeneration += 1;
    createSeedGeneration += 1;
    studioMutationGeneration += 1;
    shapeMutationGeneration += 1;
    liveSessionActionGeneration += 1;
    activeMatchActionGeneration += 1;
    scheduleDismissGeneration += 1;
    themeController.stop();
    window.removeEventListener("tabiya:unauthenticated", onUnauthenticated);
    unsubscribeController?.();
    unsubscribeRouter?.();
    controller.destroy();
    keyboardDispatcher.destroy();
    if(livePoll!==undefined)clearInterval(livePoll);
    if(storyPoll!==undefined)clearInterval(storyPoll);
    router.destroy();
  });
</script>

<svelte:window onkeydown={(event) => keyboardDispatcher.handle(event)} />

{#if authLoading}
  <main class="auth-gate" aria-busy="true"><p>Loading Tabiya…</p></main>
{:else if !learner}
  <div class="public-landing">
    <header class="public-hero">
      <div>
        <p class="eyebrow">Tabiya / play the consequence</p>
        <h1>Do not just learn the move. Rehearse the game it creates.</h1>
        <p>Choose a real opening, middlegame, or endgame position. Commit to a decision, play its consequence, rewind, branch, and compare both attempts.</p>
      </div>
      <ol aria-label="The rehearsal loop">
        <li><span>01</span> Commit</li>
        <li><span>02</span> Play the consequence</li>
        <li><span>03</span> Rewind and branch</li>
        <li><span>04</span> Compare and replay</li>
      </ol>
      <p class="public-boundary"><strong>Grounded feedback, not invented chess truth.</strong> Authored explanations and measured evidence keep their source.</p>
      <a class="browse-link" href="#position-catalogue">Browse rehearsal positions</a>
    </header>
    <section id="account-access" class="auth-gate" aria-labelledby="auth-title">
      <p class="eyebrow">Keep your rehearsals</p>
      <h2 id="auth-title">{authRegister ? "Create your learner account." : "Return to your rehearsals."}</h2>
      {#if authNotice}<p class="auth-notice" role="status" aria-live="polite" aria-atomic="true">{authNotice}</p>{/if}
      <form aria-busy={authBusy} onsubmit={(event) => { event.preventDefault(); void authenticate(); }}>
        <label>Handle <input autocomplete="username" bind:value={authHandle} disabled={authBusy} required /></label>
        <label>Password <input type="password" autocomplete={authRegister ? "new-password" : "current-password"} bind:value={authPassword} disabled={authBusy} minlength="10" maxlength="256" required /></label>
        <button class="primary" type="submit" disabled={authBusy} aria-describedby={authRegister ? `registration-data-disclosure registration-password-warning${authBusy ? " auth-submit-busy" : ""}` : authBusy ? "auth-submit-busy" : undefined}>{authBusy ? authRegister ? "Creating account…" : "Signing in…" : authRegister ? "Register" : "Sign in"}</button>
      </form>
      {#if authBusy}<p id="auth-submit-busy" role="status" aria-live="polite">{authRegister ? "Creating your account…" : "Signing you in…"}</p>{/if}
      {#if authError}<p role="alert">{authError}</p>{/if}
      <button type="button" disabled={authBusy} aria-describedby={authBusy ? "auth-submit-busy" : undefined} onclick={() => { authRegister = !authRegister; authError = undefined; }}>
        {authRegister ? "Use an existing account" : "Create an account"}
      </button>
      {#if authRegister}<p id="registration-data-disclosure" class="honest">Creating an account keeps the games and rehearsals you save, your learning progress, and anything you author or publish. After you confirm your password, Account settings lets you download your record and preview what deletion removes, anonymizes, or keeps as shared or published history.</p>{/if}
      <p id="registration-password-warning" class="honest">There is no password recovery yet. Keep your password somewhere safe.</p>
    </section>
    <PackList
      {packs}
      loading={routeLoading}
      error={routeError}
      actionLabel="Choose this rehearsal"
      onRetry={retryVisibleRoute}
      onSelect={choosePublicPack}
    />
  </div>
{:else}
<ShellFrame
  {route}
  {runContext}
  {learner}
  chrome={route.name !== "live-overlay" && route.name !== "run"}
  onNavigate={navigate}
  onSignOut={() => void signOut()}
>
  {#if routeLoading}
    <main class="shell-view" aria-busy="true"><p>Loading Tabiya…</p></main>
  {:else if routeError}
    <main class="shell-view"><h1>This page is temporarily unavailable.</h1><p role="alert">{routeError}</p><button class="primary" type="button" onclick={retryVisibleRoute}>Try again</button></main>
  {:else if route.name === "home"}
    <main class="shell-view home" aria-labelledby="home-title">
      <p class="eyebrow">Tabiya / play the consequence</p>
      <h1 id="home-title">Do not just learn the move. Rehearse the game it creates.</h1>
      <p class="home-lede">Play a position out. Rewind to the decision. Try it another way. Keep both attempts.</p>
      {#if recentRun}
        <section class="resume-card" aria-labelledby="resume-title">
          <p class="eyebrow">Continue</p>
          <h2 id="resume-title">{runTitle(recentRun)}</h2>
          <p>{recentRun.branchCount} {recentRun.branchCount === 1 ? "branch" : "branches"} · {objectiveStateLabel(recentRun.objectiveState)} · {readableDate(recentRun.updatedAt)}</p>
          <p class="access">
            {boardStance(recentRun) === "you" ? "You hold the board." : boardStance(recentRun) === "unclaimed" ? "No one holds the board." : `@${recentRun.leaseHeldBy.handle} holds the board.`}
            {recentRun.viewerRole === "spectator" ? " You can follow read-only." : " You may take the board."}
          </p>
          <button type="button" onclick={() => navigate(routePath({ name: "run", runId: recentRun.id }))}>Resume run</button>
        </section>
      {:else}
        <section class="start-card" aria-labelledby="start-title">
          <p class="eyebrow">Start here</p>
          <h2 id="start-title">Choose one real position. Your attempt begins immediately.</h2>
          {#if firstRehearsalPack}
            <p>{firstRehearsalPack.objectiveSummary}</p>
            <button class="primary" type="button" onclick={() => void startFirstRehearsal(firstRehearsalPack!.id)}>Start the first rehearsal</button>
          {:else}
            <p>No rehearsal pack is available from this deployment.</p>
          {/if}
        </section>
      {/if}
      <section class="home-status" aria-labelledby="home-status-title">
        <div><p class="eyebrow">Due and open</p><h2 id="home-status-title">What is waiting for you</h2></div>
        <p><strong>{dueSchedules.length + dueWaiting}</strong> {dueSchedules.length + dueWaiting === 1 ? "rehearsal is" : "rehearsals are"} due</p>
        <p><strong>{openAssignments.length}</strong> {openAssignments.length === 1 ? "coach assignment is" : "coach assignments are"} open</p>
      </section>
      <section class="how-it-works" aria-labelledby="how-it-works-title">
        <div class="how-it-works-heading">
          <p class="eyebrow">The rehearsal loop</p>
          <h2 id="how-it-works-title">How Tabiya works</h2>
          <p>Openings, middlegames, and endgames use the same loop: make a decision, live with it, then return with another idea.</p>
        </div>
        <ol class="rehearsal-loop">
          <li><span>01</span><h3>Commit</h3><p>Choose a real position and play the decision you want to understand.</p></li>
          <li><span>02</span><h3>Play the consequence</h3><p>Continue against resistance long enough for the decision to shape the game.</p></li>
          <li><span>03</span><h3>Rewind and branch</h3><p>Return to the decision and try another plan. Your first attempt stays intact.</p></li>
          <li><span>04</span><h3>Compare and replay</h3><p>Compare what followed, replay under different resistance, and return later.</p></li>
        </ol>
        <aside class="evidence-promise" aria-labelledby="evidence-promise-title">
          <div><p class="eyebrow">Evidence boundary</p><h3 id="evidence-promise-title">Grounded feedback, not invented chess truth.</h3></div>
          <p>Authored explanations and measured evidence keep their source. Generated wording may present those records; it does not invent strategy or grade your move.</p>
        </aside>
      </section>
      {#if phaseStarters.length > 0}
        <section class="phase-starters" aria-labelledby="phase-starters-title">
          <div><p class="eyebrow">Pick up a thread</p><h2 id="phase-starters-title">Start from the phase you are working on.</h2></div>
          {#each phaseStarters as pack}
            <article>
              <span>{packPhaseCopy(pack.phase)}</span>
              <h3>{pack.title}</h3>
              <p>{pack.objectiveSummary}</p>
              <button type="button" onclick={() => controller.startPack(pack.id)}>Start this {packPhaseCopy(pack.phase).toLocaleLowerCase()}</button>
            </article>
          {/each}
        </section>
      {/if}
      <button type="button" onclick={() => navigate("/play")}>Browse every position and opponent</button>
    </main>
  {:else if route.name === "play"}
    <div class="play-surface">
      <a class="surface-skip" href="#position-catalogue" onclick={(event) => { event.preventDefault(); document.getElementById("position-catalogue")?.focus(); }}>Skip to position catalogue</a>
      <JustPlayStarter busy={session.busy} onStart={(input) => controller.startPosition(input)} />
      <PackList
        {packs}
        loading={session.busy}
        error={session.error}
        onSelect={(packId) => controller.startPack(packId)}
      />
    </div>
  {:else if route.name === "run"}
    {#if session.runState}
      {#if session.runState.access === "read_only" && session.viewer?.mayWrite}
        <div class="claim-banner">
          <span>@{session.viewer.leaseHeldBy.handle} holds the board.</span>
          <button type="button" onclick={() => void controller.claimLease()}>Take the board on this device</button>
        </div>
      {/if}
      <DrillScreen
        pack={session.pack}
        {relatedPack}
        shapes={session.shapes}
        snapshot={session.runState}
        checkpoint={session.checkpoint}
        authoredFeedback={session.authoredFeedback}
        reasoning={session.reasoning}
        comparison={session.comparison}
        comparisonBranchIds={session.comparisonBranchIds}
        simulation={session.simulation}
        busy={session.busy}
        error={session.error}
        {capabilities}
        viewerRole={session.viewer?.role}
        boardSide={activeLiveDetail?.match===undefined||learner===undefined?undefined:activeLiveDetail.match.whiteLearnerId===learner.id?"white":activeLiveDetail.match.blackLearnerId===learner.id?"black":undefined}
        assistanceStorage={storage}
        liveSessionKind={activeLiveDetail?.session.kind}
        seatedInContest={session.viewer?.seatedInContest}
        reviewing={session.viewer?.reviewing}
        firstRehearsal={session.runState.run.id === firstRehearsalRunId}
        onMove={(uci) => controller.move(uci)}
        onReveal={() => controller.reveal()}
        onRewind={(target) => controller.rewind(target)}
        onFork={(label, intent) => controller.fork(label, intent)}
        onSwitchBranch={(nodeId, branchId) => controller.switchBranch(nodeId, branchId)}
        onCompare={(branchIds) => controller.compare(branchIds)}
        onReplayResistance={(input) => controller.startPosition({ ...input, mode: "human_common" })}
        onClassifyBranches={(branchIds) => api.branchDecidedness(session.runState!.run.id, branchIds)}
        onCloseCompare={() => controller.closeCompare()}
        onContinueCheckpoint={() => controller.continueCheckpoint()}
        onPrediction={(uci) => controller.recordPrediction(uci)}
        importedGuess={session.importedGuess}
        onGuessImportedMove={(uci) => controller.guessImportedMove(uci)}
        onReasoning={(input) => controller.recordReasoning(input)}
        onReasoningReview={capabilities?.providers.llm === "external" && api.reasoningReview !== undefined ? (checkpointEventSeq) => api.reasoningReview!(session.runState!.run.id, checkpointEventSeq) : undefined}
        onExport={exportPgn}
        onLoadMarks={api.marks === undefined ? undefined : () => api.marks!(session.runState!.run.id)}
        onSaveMarks={api.replaceMarks === undefined ? undefined : (input) => api.replaceMarks!(session.runState!.run.id, input)}
        onRescopeMarks={api.rescopeMarks === undefined ? undefined : (input) => api.rescopeMarks!(session.runState!.run.id,input)}
        onStop={() => navigate("/play")}
        onAssistanceQuery={api.assistance === undefined ? undefined : (request) => api.assistance!(session.runState!.run.id, request)}
        onHumanSplit={(nodeId) => api.humanSplit(session.runState!.run.id, nodeId)}
        onNudge={api.nudge === undefined ? undefined : (nodeId) => api.nudge!(session.runState!.run.id, nodeId)}
        onCorpus={(nodeId) => api.corpus(session.runState!.run.id, nodeId)}
        onVoice={(nodeId, scope) => api.voice(session.runState!.run.id, nodeId, scope)}
        onCompareVoice={capabilities?.providers.llm === "external" && session.comparisonBranchIds !== undefined ? () => api.compareVoice(session.runState!.run.id, session.comparisonBranchIds!) : undefined}
        onSpeech={(nodeId, scope) => api.speech(session.runState!.run.id, nodeId, scope)}
        onCreateGroup={(input) => controller.createGroup(input)}
        onAnalyzeMissing={(nodeIds) => controller.analyzeMissingEvidence(nodeIds)}
        onSimulate={() => controller.simulateAuthoredLines()}
        onEnterSimulation={(branchIndex) => controller.enterSimulation(branchIndex)}
        onCloseSimulation={() => controller.closeSimulation()}
        onStory={session.runState.run.events.some((event) => event.type === "outcome.reached") ? () => navigate(routePath({ name: "story", runId: session.runState!.run.id })) : undefined}
        onScheduleReturn={() => controller.scheduleReturn(session.runState!.run.activeCursor.nodeId)}
        onFlip={(nodeId) => flipRun(session.runState!.run.id, nodeId)}
        onSelectPack={(packId) => controller.startPack(packId)}
        onFirstRehearsalComplete={completeFirstRehearsal}
        assignmentOffers={completedAssignmentOffers}
        onSubmitAssignment={(assignmentId)=>submitAssignedRun(assignmentId,session.runState!.run.id)}
        repertoireAnswerOffer={activeRepertoireGap}
        {repertoireAnswerBusy}
        repertoireAnswerError={activeRepertoireGap===undefined?undefined:repertoireAnswerErrors[activeRepertoireGap.gap.key]}
        onChooseRepertoireAnswer={chooseRepertoireAnswer}
        registerKeyboardRegion={keyboardDispatcher.registerRegion}
      />
      {#if session.viewer?.role === "spectator"}
        <aside class="session-banner" aria-label="Review access"><strong>{session.viewer.reviewRail === "open" ? "Submitted review access" : "Review access limited"}</strong><span>{reviewRailCopy(session.viewer.reviewRail)}</span></aside>
      {/if}
      {#if activeLiveDetail}
        <aside class="session-banner" aria-label="Live session rail"><strong>{activeLiveDetail.session.title}</strong>{#if activeLiveDetail.match}{@const seated=learner?.id===activeLiveDetail.match.whiteLearnerId||learner?.id===activeLiveDetail.match.blackLearnerId}<span>{activeLiveDetail.match.pausedAt?"Paused — rehearsal is open":activeLiveDetail.match.pauseProposedBy?"Pause proposed":learnerOwnsActiveMatchTurn()?"Your move":"Their move"}</span><div class="row-actions">{#if activeLiveDetail.match.pausedAt}<button type="button" disabled={activeMatchActionBusy!==undefined} aria-describedby={activeMatchActionBusy!==undefined?"active-match-action-busy":undefined} onclick={()=>void operateActiveMatch("resume")}>Resume main line</button>{:else if seated}{#if activeLiveDetail.match.pauseProposedBy===learner?.id}<button type="button" disabled={activeMatchActionBusy!==undefined} aria-describedby={activeMatchActionBusy!==undefined?"active-match-action-busy":undefined} onclick={()=>void operateActiveMatch("withdraw_pause")}>Withdraw pause</button>{:else if activeLiveDetail.match.pauseProposedBy}<button type="button" disabled={activeMatchActionBusy!==undefined} aria-describedby={activeMatchActionBusy!==undefined?"active-match-action-busy":undefined} onclick={()=>void operateActiveMatch("accept_pause")}>Accept pause</button>{:else}<button type="button" disabled={activeMatchActionBusy!==undefined} aria-describedby={activeMatchActionBusy!==undefined?"active-match-action-busy":undefined} onclick={()=>void operateActiveMatch("propose_pause")}>Propose pause</button>{/if}{:else if activeLiveDetail.role==="host"}<button type="button" disabled={activeMatchActionBusy!==undefined} aria-describedby={activeMatchActionBusy!==undefined?"active-match-action-busy":undefined} onclick={()=>void operateActiveMatch("pause")}>Pause for coaching</button>{/if}</div>{#if activeMatchActionBusy!==undefined}<span id="active-match-action-busy" role="status">Updating the match…</span>{/if}{#if activeMatchActionError}<span role="alert">{activeMatchActionError}</span>{/if}{:else}<span>{liveRoleLabel(activeLiveDetail.role)} · {activeLiveDetail.proposals.filter((item)=>item.status==="open").length} open proposals{activeLiveDetail.vote ? ` · ${activeLiveDetail.vote.total} votes` : ""}</span>{/if}<button type="button" onclick={()=>navigate(routePath({name:"live-session",sessionId:activeLiveDetail!.session.id}))}>Session</button></aside>
      {/if}
      {#if session.runState.run.sessionKind === "imported"}
        <aside class="session-banner" aria-label="Imported game story"><strong>Imported game</strong><span>The original continuation and your branches share one run.</span><button type="button" onclick={() => navigate(routePath({ name: "story", runId: session.runState!.run.id }))}>Story</button></aside>
      {/if}
      {#if session.runState.run.sessionKind !== "imported" && session.runState.run.events.some((event) => event.type === "outcome.reached")}
        <aside class="session-banner" aria-label="Run story"><strong>Attempt complete</strong><span>Your recorded moments are ready to read and replay.</span><button type="button" onclick={() => navigate(routePath({ name: "story", runId: session.runState!.run.id }))}>Story</button></aside>
      {/if}
      {#if session.viewer?.role === "host" && session.runState.run.events.some((event) => event.type === "outcome.reached")}
        <aside class="session-banner" aria-label="Distill run"><strong>Authoring seed</strong><span>Turn these recorded branches into a blocked draft for human judgment.</span>{#if distillDraftRunId === session.runState.run.id}<DistillDraftForm busy={distillDraftBusy} error={distillDraftError} onSubmit={distillActiveRun} onCancel={() => { distillDraftRunId = undefined; distillDraftError = undefined; }} />{:else}<button type="button" onclick={() => { distillDraftRunId = session.runState!.run.id; distillDraftError = undefined; }}>Distill to draft</button>{/if}</aside>
      {/if}
      {#if derivations?.source}
        <aside class="session-banner" aria-label="Opposite-side replay source"><strong>Opposite-side replay</strong><span>Mirror of run {derivations.source.sourceRunId} from its recorded position.</span><button type="button" onclick={() => navigate(routePath({ name: "run", runId: derivations!.source!.sourceRunId }))}>Open source</button></aside>
      {:else if derivations && derivations.derived.length > 0}
        <aside class="session-banner" aria-label="Opposite-side replays"><strong>Mirrored attempts</strong><span>{derivations.derived.length} opposite-side {derivations.derived.length === 1 ? "run" : "runs"}.</span><button type="button" onclick={() => navigate(routePath({ name: "run", runId: derivations!.derived[0]!.derivedRunId }))}>Open replay</button></aside>
      {/if}
    {:else}
      <main class="shell-view"><h1>Run unavailable.</h1><p role="alert">{session.error ?? "The run could not be loaded."}</p></main>
    {/if}
  {:else if route.name === "story"}
    {@const storyRunId = (route as { readonly name: "story"; readonly runId: string }).runId}
    {#if story}<ReviewMapScreen review={story} shares={storyShares} onRetry={(nodeId) => enterStoryMoment(storyRunId, nodeId)} onExport={() => exportStory(storyRunId)} onShare={api.shareStory === undefined ? undefined : () => createStoryShare(storyRunId, story!.branchId)} onRevoke={api.revokeStoryShare === undefined ? undefined : (tokenId) => revokeStoryShare(storyRunId, tokenId)} onCompare={(branchIds) => compareFromReview(storyRunId, branchIds)} onAnalyze={api.reviewAnalysis === undefined ? undefined : (nodeId) => analyzeFromReview(storyRunId, story!.branchId, nodeId)} onVoice={capabilities?.providers.llm === "external" && requestedAssistanceConfig("imported", loadWorkflowPreference("imported", applicationStorage())).voice === "persona" ? async (nodeId) => (await api.voice(storyRunId, nodeId, "story")).text : undefined} />
    {:else}<main class="shell-view"><h1>Story unavailable.</h1><p role="alert">{routeError ?? "The imported game has no story payload."}</p></main>{/if}
  {:else if route.name === "review"}
    <main class="shell-view" aria-labelledby="review-title">
      <p class="eyebrow">Review & import</p><h1 id="review-title">Your games and rehearsals</h1>
      <p>Open a run to replay, branch, compare, or export it. Import one finished game when you want its moments to become rehearsal doors.</p>
      <form class="import-game" onsubmit={(event) => { event.preventDefault(); void importGame(); }}>
        <h2>Import one game</h2>
        <label>Lichess game URL <input type="url" placeholder="https://lichess.org/abcdefgh" disabled={importBusy||importPreparation!==undefined} bind:value={importUrl} /></label>
        <span>or paste PGN</span>
        <label>PGN <textarea rows="6" placeholder="[Event …]" disabled={importBusy||importPreparation!==undefined} bind:value={importPgn}></textarea></label>
        <label>Your side <select disabled={importBusy||importPreparation!==undefined} bind:value={importSide}><option value="white">White</option><option value="black">Black</option></select></label>
        <p id="import-storage-disclosure" class="honest">Import keeps the original PGN verbatim—including player names, tags, comments, and move annotations—alongside its parsed main line and the rehearsal branches you add. It is included in your account export and removed with this run or your account, subject to the stated backup limits.</p>
        {#if importPreparation}<p role="status">The game is saved. Finish preparing its Story without importing a duplicate.</p>{/if}
        <button class="primary" type="submit" aria-describedby="import-storage-disclosure import-source-guidance" disabled={importBusy||(importPreparation===undefined&&importUrl.trim()===""&&importPgn.trim()==="")}>{importBusy?"Preparing…":importPreparation?"Finish Story setup":"Build game story"}</button>
        {#if importNotice}<p role="status">{importNotice}</p>{/if}
        {#if importError}<p role="alert">{importError}</p>{/if}
        <p id="import-source-guidance" class="honest">Chess.com: export one completed game's PGN and paste it here. Export the game, not an analysis tree with variations. Tabiya never links or mines your account.</p>
      </form>
      <div class="item-list">
        {#each runs as run}
          <article>
            <div><h2>{runTitle(run)}</h2><p>{readableDate(run.updatedAt)} · {run.branchCount} {run.branchCount === 1 ? "branch" : "branches"} · {objectiveStateLabel(run.objectiveState)}</p></div>
            <button type="button" onclick={() => navigate(routePath({ name: run.sessionKind === "imported" ? "story" : "run", runId: run.id }))}>{run.sessionKind === "imported" ? "Open story" : "Open run"}</button>
          </article>
        {:else}<p>No runs to review yet.</p>{/each}
      </div>
      {#if runSelection.shown<runSelection.total}<p id="run-history-budget" class="honest">Showing {runSelection.shown} of {runSelection.total} saved games and rehearsals.</p><button type="button" disabled={runPageBusy} aria-describedby="run-history-budget" onclick={()=>void loadMoreRuns()}>{runPageBusy?"Loading…":"Load more"}</button>{/if}
      {#if runPageError}<p role="alert">{runPageError}</p>{/if}
    </main>
  {:else if route.name === "learn"}
    <main class="shell-view" aria-labelledby="learn-title">
      <p class="eyebrow">Learn / return loop</p>
      <h1 id="learn-title">Return to the positions that need another attempt.</h1>
      {#if session.busy}<p id="return-action-busy" role="status">Starting your rehearsal…</p>{/if}
      {#if returnActionError ?? session.error}<p role="alert">{returnActionError ?? session.error}</p>{/if}
      <section aria-labelledby="assigned-title">
        <h2 id="assigned-title">Assigned</h2>
        <div class="item-list">
          {#each assignedPacks as assignment}
            {@const eligibleRuns=runs.filter((run)=>run.packId===assignment.packId&&run.viewerRole==="host")}
            <article>
              <div>
                <h3>{packTitle(assignment.packId)}</h3>
                <p>{assignment.classroomName} · assigned by @{assignment.assignedByHandle}{assignment.dueAt ? ` · due ${readableDate(assignment.dueAt)}` : ""}{isOverdue(assignment.dueAt) ? " · overdue" : ""}</p>
                {#if assignment.note}<blockquote><p>{assignment.note}</p><footer>— @{assignment.assignedByHandle}, your teacher</footer></blockquote>{/if}
                {#each assignment.submissions as submission}<div class="submission-record"><p>{submission.withdrawnAt ? "Submission withdrawn" : `Submitted ${readableDate(submission.submittedAt)} · access until ${readableDate(submission.accessExpiresAt)}`}</p>{#if !submission.withdrawnAt}<p>{submission.grantedTeacherHandles.length>0?`Currently shared with ${submission.grantedTeacherHandles.map((handle)=>`@${handle}`).join(", ")}.`:"No teacher currently holds access."}</p><button type="button" disabled={assignmentBusy!==undefined} onclick={()=>void withdrawAssignedRun(assignment.id,submission.runId)}>{assignmentBusy===`withdraw:${assignment.id}:${submission.runId}`?"Revoking…":"Stop future teacher access"}</button><p class="honest">Revoking stops future reads. It cannot undo what a teacher already saw.</p>{/if}</div>{/each}
              </div>
              <div class="row-actions"><button type="button" onclick={()=>void controller.startPack(assignment.packId)}>Start pack</button>{#if eligibleRuns.length>0}<label>Completed run <select value={assignmentRunSelection[assignment.id]??""} onchange={(event)=>chooseAssignmentRun(assignment.id,event.currentTarget.value)}><option value="">Choose a run</option>{#each eligibleRuns as run}<option value={run.id}>{runTitle(run)} · {readableDate(run.updatedAt)} · {run.branchCount} {run.branchCount===1?"branch":"branches"}</option>{/each}</select></label><button type="button" disabled={!assignmentRunSelection[assignment.id]} aria-describedby={!assignmentRunSelection[assignment.id]?`submission-run-required-${assignment.id}`:undefined} onclick={()=>prepareAssignedRun(assignment.id)}>Share with teachers</button>{#if !assignmentRunSelection[assignment.id]}<p id={`submission-run-required-${assignment.id}`} class="honest">Choose one of your runs of this pack.</p>{/if}{:else}<p class="honest">Play this assignment before sharing an attempt.</p>{/if}</div>
            </article>
          {:else}<p>No open assignments.</p>{/each}
        </div>
        {#if submissionIntent}{@const assignment=assignedPacks.find((candidate)=>candidate.id===submissionIntent!.assignmentId)}{@const run=runs.find((candidate)=>candidate.id===submissionIntent!.runId)}{#if assignment&&run}<aside class="consent-card" aria-labelledby="submission-confirm-title"><h3 id="submission-confirm-title">Share {runTitle(run)}?</h3><p>{assignment.teacherHandles.length>0?`${assignment.teacherHandles.map((handle)=>`@${handle}`).join(", ")} will be able to read this run for up to 90 days.`:"No active teacher is available to receive this run."}</p><p class="honest">They receive this run only, including its moves and the evidence or reveals already recorded in it. They do not gain access to your other runs.</p><div class="row-actions"><button type="button" disabled={assignment.teacherHandles.length===0||assignmentBusy!==undefined} aria-describedby={assignment.teacherHandles.length===0?"submission-no-teacher":undefined} onclick={()=>void confirmAssignedRun()}>{assignmentBusy===`submit:${assignment.id}:${run.id}`?"Sharing…":"Confirm sharing"}</button><button type="button" disabled={assignmentBusy!==undefined} onclick={()=>submissionIntent=undefined}>Cancel</button></div>{#if assignment.teacherHandles.length===0}<p id="submission-no-teacher" class="honest">An active teacher must be present before this run can be shared.</p>{/if}</aside>{/if}{/if}
        {#if assignmentActionError}<p role="alert">{assignmentActionError}</p>{/if}
        {#if runSelection.shown<runSelection.total}<p id="assigned-run-budget" class="honest">Showing {runSelection.shown} of {runSelection.total} saved runs when matching completed assignments.</p><button type="button" disabled={runPageBusy} aria-describedby="assigned-run-budget" onclick={()=>void loadMoreRuns()}>{runPageBusy?"Loading…":"Load more saved runs"}</button>{/if}
        {#if runPageError}<p role="alert">{runPageError}</p>{/if}
      </section>
      {#if recommendations.length>0}
        <section aria-labelledby="recommended-title" aria-describedby={recommendationSelection.shown<recommendationSelection.total?"recommendation-budget":undefined}><h2 id="recommended-title">Recommended next</h2>{#if recommendationSelection.shown<recommendationSelection.total}<p id="recommendation-budget" class="honest">Showing {recommendationSelection.shown} of {recommendationSelection.total} grounded recommendations.</p>{/if}<div class="item-list">
          {#each recommendations as item}<article><div><p>{progressRecommendationSentence(item)}</p>{#if item.kind==="shape_encounter"}{@const matchingPacks=recommendationPacks(item)}{#if matchingPacks.length>0}<div class="recommendation-actions">{#each matchingPacks as pack}<button type="button" onclick={()=>void controller.startPack(pack.id)}>{packPhaseCopy(pack.phase)} · Rehearse {pack.title}</button>{/each}</div>{:else}<p class="honest">No matching rehearsal is currently served.</p>{/if}{/if}</div>{#if item.kind==="repertoire_gap"}{@const entry=repertoireEntry(null)}{@const entryKey=repertoireGapKey(item.repertoireId,item.gapKey)}<button type="button" disabled={!entry.available||repertoireEntryBusy!==undefined} aria-describedby={!entry.available?"recommendation-resistance-unavailable":undefined} onclick={()=>void enterRepertoireGap(item.repertoireId,item.gapKey)}>{repertoireEntryBusy===entryKey?"Opening rehearsal…":entry.label}</button>{#if repertoireEntryErrors[entryKey]}<p role="alert">{repertoireEntryErrors[entryKey]}</p>{/if}{/if}</article>{/each}
          {#if recommendations.some((item)=>item.kind==="repertoire_gap")&&!repertoireEntry(null).available}<p id="recommendation-resistance-unavailable" class="honest">{repertoireEntry(null).reason}</p>{/if}
        </div></section>
      {/if}
      <section aria-labelledby="repertoire-title">
        <h2 id="repertoire-title">Repertoire gaps</h2>
        <form class="repertoire-form" onsubmit={(event)=>{event.preventDefault();void createRepertoire();}}>
          <label>Name <input required disabled={repertoireMutationBusy!==undefined} bind:value={repertoireName} /></label>
          <label>Your side <select disabled={repertoireMutationBusy!==undefined} bind:value={repertoireSide}><option value="white">White</option><option value="black">Black</option></select></label>
          <label>Opponent rating band <input type="number" min="1000" max="2400" step="100" required disabled={repertoireMutationBusy!==undefined} bind:value={repertoireTargetElo} /></label>
          <label>Cover replies seen at least once in <input type="number" min="10" max="10000" required disabled={repertoireMutationBusy!==undefined} bind:value={repertoireCoverageDenominator} /> games</label>
          <label>Public Lichess study URL <input type="url" placeholder="https://lichess.org/study/abcdefgh" disabled={repertoireMutationBusy!==undefined} bind:value={repertoireStudyUrl} /></label>
          <span>or paste a multi-game, variation-bearing PGN</span>
          <label>Repertoire PGN <textarea rows="5" disabled={repertoireMutationBusy!==undefined} bind:value={repertoirePgn}></textarea></label>
          <button class="primary" type="submit" aria-describedby="repertoire-import-help" disabled={repertoireMutationBusy!==undefined||!repertoireName.trim()||(!repertoireStudyUrl.trim()&&!repertoirePgn.trim())}>{repertoireMutationBusy==="create"?"Importing…":"Import repertoire"}</button>
          <p id="repertoire-import-help" class="honest">Name the repertoire and provide either a public Lichess study or pasted PGN.</p>
          {#if repertoireError}<p role="alert">{repertoireError}</p>{/if}
        </form>
        <div class="item-list">
          {#each repertoires as repertoire}
            {@const page=repertoirePages[repertoire.id]}
            <article class="repertoire-card">
              <div><h3>{repertoire.name}</h3><p>{chessSideLabel(repertoire.side)} · {repertoire.targetElo} band · cover replies seen at least 1 in {repertoire.coverageDenominator} games</p></div>
              <div class="row-actions"><button type="button" disabled={repertoireScanBusy!==undefined} onclick={()=>void scanRepertoire(repertoire.id)}>{repertoireScanBusy===repertoire.id?"Scanning…":page?.status==="ready"?"Rescan":"Scan gaps"}</button><button type="button" disabled={repertoireMutationBusy!==undefined} onclick={()=>repertoireDeleteIntent=repertoire.id}>Delete repertoire</button></div>
              {#if repertoireDeleteIntent===repertoire.id}<aside class="consent-card" aria-label={`Delete ${repertoire.name}`}><h4>Delete {repertoire.name}?</h4><p>Its imported moves, scan results, and repertoire links will be removed. Rehearsal runs already created from gaps stay in your saved run history.</p><div class="row-actions"><button type="button" disabled={repertoireMutationBusy!==undefined} onclick={()=>void deleteRepertoire(repertoire.id)}>{repertoireMutationBusy===`delete:${repertoire.id}`?"Deleting…":"Confirm deletion"}</button><button type="button" disabled={repertoireMutationBusy!==undefined} onclick={()=>repertoireDeleteIntent=undefined}>Cancel</button></div></aside>{/if}
              {#if page?.status==="pending"}<p>Scanning…</p>{/if}
              {#if repertoireScanErrors[repertoire.id]}<p role="alert">{repertoireScanErrors[repertoire.id]}</p>{/if}
              {#if page?.scan}
                <div class="gap-results" aria-label={`Gaps for ${repertoire.name}`}>
                  <p>{corpusPopulationLabel(page.scan.population)}</p><p class="honest">{page.scan.guard}.</p>
                  {#if page.scan.partiality}<p class="honest">{page.scan.partiality}</p>{/if}
                  {#if page.stale}<p class="honest">These results predate your latest repertoire change. Answer states remain visible, but coverage and ranking need a rescan.</p>{/if}
                  <p>{page.scan.truncated?"At least":"About"} {(page.scan.uncoveredMass*100).toFixed(1)}% of games contain replies above your 1-in-{repertoire.coverageDenominator} bound that still need an answer.</p>
                  {#if page.scan.unreachedKeys>0}<p class="honest">{page.scan.unreachedKeys} repertoire {page.scan.unreachedKeys===1?"position was":"positions were"} not reached within this scan.</p>{/if}
                  {#each page.scan.gaps as gap,index}
                    <div class="gap-row">
                      <div><span>{gap.replySan||"First move"} · {gap.gamesUntilSeen?`about 1 in ${gap.gamesUntilSeen} games`:"frequency unavailable"} · {repertoireGapStateLabel(gap.state)}</span>
                        {#if gap.firstMoves.length>0}<div class="gap-answer"><span>Moves you tried:</span>{#each gap.firstMoves as move}{#if gap.answer?.moveUci===move.moveUci}<strong>Current repertoire answer: {move.moveSan}</strong>{:else}<button type="button" disabled={repertoireAnswerBusy!==undefined} aria-describedby={repertoireAnswerBusy!==undefined?`gap-answer-status-${gap.key}`:undefined} onclick={()=>void chooseRepertoireAnswer(repertoire.id,gap.key,move.moveUci,repertoire.digest)}>{repertoireAnswerBusy===`${repertoire.id}:${gap.key}:${move.moveUci}`?"Saving…":`Use ${move.moveSan} as my repertoire answer`}</button>{/if}{/each}</div>{/if}
                        {#if repertoireAnswerBusy!==undefined}<span id={`gap-answer-status-${gap.key}`} class="honest">Finish saving the current repertoire choice first.</span>{/if}
                        {#if repertoireAnswerErrors[repertoireGapKey(repertoire.id,gap.key)]}<p role="alert">{repertoireAnswerErrors[repertoireGapKey(repertoire.id,gap.key)]}</p>{/if}
                      </div>
                      {#if index===0}{@const entry=repertoireEntry(gap.runId)}{@const entryKey=repertoireGapKey(repertoire.id,gap.key)}<button type="button" disabled={!entry.available||repertoireEntryBusy!==undefined} aria-describedby={!entry.available?`gap-resistance-${repertoire.id}`:undefined} onclick={()=>void enterRepertoireGap(repertoire.id,gap.key)}>{repertoireEntryBusy===entryKey?"Opening rehearsal…":entry.label}</button>{#if repertoireEntryErrors[entryKey]}<p role="alert">{repertoireEntryErrors[entryKey]}</p>{/if}{/if}
                    </div>
                  {:else}<p>No ranked gaps above this bound.</p>{/each}
                  {#if page.scan.gaps[0]&&!repertoireEntry(page.scan.gaps[0].runId).available}<p id={`gap-resistance-${repertoire.id}`} class="honest">{repertoireEntry(page.scan.gaps[0].runId).reason}</p>{/if}
                  {#if page.scan.alternateGaps.length>0}<h4>Behind alternate repertoire answers</h4>{#each page.scan.alternateGaps as gap}<p>{gap.replySan||"First move"} after {gap.line.join(" ")} · frequency deliberately unranked · {repertoireGapStateLabel(gap.state)}</p>{/each}{/if}
                  {#if page.scan.unknown.length>0}<h4>Where the corpus abstained</h4>{#each page.scan.unknown as entry}<p>{entry.line.join(" ")||"Root position"}: {entry.detail}. You reach this position in about 1 in {entry.gamesUntilPosition} games; frequency beyond it is unknown.</p>{/each}{/if}
                </div>
              {/if}
              {#if repertoireError&&repertoireDeleteIntent===repertoire.id}<p role="alert">{repertoireError}</p>{/if}
            </article>
          {:else}<p>No repertoire imported yet.</p>{/each}
        </div>
      </section>
      <section aria-labelledby="milestones-title">
        <h2 id="milestones-title">Milestones</h2>
        <div class="item-list">
          {#each milestones as milestone}
            <article><div><h3>{milestone.sentence}</h3><p>{readableDate(milestone.occurredAt)}</p></div><button type="button" onclick={() => navigate(routePath({ name: "run", runId: milestone.link.runId }))}>Open run</button></article>
          {:else}<p>No milestones yet. They record revisitable events, never a mastery score.</p>{/each}
        </div>
      </section>
      <section aria-labelledby="due-title">
        <h2 id="due-title">Due now</h2>
        {#if dueSchedules.some((schedule) => schedule.frequency !== null)}<p class="honest">{DUE_FREQUENCY_ORDER_NOTE}</p>{/if}
        {#if dueWaitingSentence(dueWaiting, dueIntakeLimit)}<p class="honest" role="status">{dueWaitingSentence(dueWaiting, dueIntakeLimit)}</p>{/if}
        <div class="item-list">
          {#each dueSchedules as schedule}
            <article>
              <div>
                <h3>{schedule.packId === null ? "Position rehearsal" : packTitle(schedule.packId)}</h3>
                <p>{dueVariationSentence(schedule)} · {readableDate(schedule.dueAt)} · <span class="return-standing" data-return-standing={schedule.standing}><strong>{schedule.standing}</strong> <span class="honest">({RETURN_STANDING_EXPLANATION})</span></span></p>
                {#if dueFrequencySentence(schedule.frequency)}<p class="honest">{dueFrequencySentence(schedule.frequency)}</p>{/if}
              </div>
              <div class="row-actions">
                <button class="primary" type="button" disabled={session.busy||scheduleDismissBusy!==undefined||(schedule.packId===null&&schedule.sourceRunId===null)} aria-describedby={session.busy?"return-action-busy":scheduleDismissBusy!==undefined?`schedule-dismiss-busy-${scheduleDismissBusy}`:schedule.packId===null&&schedule.sourceRunId===null?`due-source-missing-${schedule.id}`:undefined} onclick={() => void startDueSchedule(schedule)}>Start due attempt</button>
                {#if schedule.packId === null && schedule.sourceRunId === null}<span id={`due-source-missing-${schedule.id}`} class="honest">This position return has no surviving source run.</span>{/if}
                {#if schedule.sourceRunId}<button type="button" onclick={() => navigate(routePath({ name: "run", runId: schedule.sourceRunId! }))}>Open source</button>{/if}
                <button type="button" disabled={session.busy||scheduleDismissBusy!==undefined} aria-describedby={session.busy?"return-action-busy":scheduleDismissBusy!==undefined?`schedule-dismiss-busy-${scheduleDismissBusy}`:undefined} onclick={()=>void dismissDueSchedule(schedule)}>Dismiss</button>
              </div>
              {#if scheduleDismissBusy===schedule.id}<p id={`schedule-dismiss-busy-${schedule.id}`} role="status">Dismissing this return…</p>{/if}
              {#if scheduleDismissErrors[schedule.id]}<p role="alert">{scheduleDismissErrors[schedule.id]}</p>{/if}
            </article>
          {:else}<p>{dueWaiting > 0 ? "Clear a return to see the next waiting one." : "Nothing is due yet. Played attempts create this queue."}</p>{/each}
        </div>
      </section>
      {#if difficultRoots.roots.length > 0}
        <section aria-labelledby="difficult-title">
          <h2 id="difficult-title">Positions with repeated unstable attempts</h2>
          <p class="honest">{difficultRootRuleSentence(difficultRoots.threshold)}</p>
          {#if difficultRoots.roots.length < difficultRoots.total}<p class="honest">Showing {difficultRoots.roots.length} of {difficultRoots.total} positions that meet this rule.</p>{/if}
          <div class="item-list">
            {#each difficultRoots.roots as root}
              <article>
                <div>
                  <h3>{root.packId === null ? "Position rehearsal" : packTitle(root.packId)}</h3>
                  <p>{difficultRootCountSentence(root.unstableCount)} · latest {readableDate(root.lastUnstableAt)}</p>
                </div>
                <div class="row-actions">
                  {#each root.runs as entry}<button type="button" onclick={() => navigate(routePath({ name: "run", runId: entry.runId }))}>Open run · {readableDate(entry.endedAt)}</button>{/each}
                </div>
              </article>
            {/each}
          </div>
        </section>
      {/if}
      <section aria-labelledby="recorded-title">
        <h2 id="recorded-title">What is recorded</h2>
        <div class="item-list">
          {#each attempts as attempt}
            {@const related = relatedAttempts[relatedAttemptKey(attempt)]}
            <article class="recorded-attempt">
              <div class="recorded-attempt-header">
                <div>
                  <h3>{attempt.packId === null ? "Position rehearsal" : packTitle(attempt.packId)} · attempt {attempt.attemptNo || "—"}</h3>
                  <p>{attempt.graded ? attemptVerdictLabel(attempt.verdict) : "Not graded"} · {learnerMoveCount(attempt.userPlyCount)} · {readableDate(attempt.endedAt)}</p>
                </div>
                <div class="row-actions">
                  <button type="button" aria-expanded={related !== undefined} onclick={() => void toggleRelatedAttempts(attempt)}>{related===undefined?"Related attempts":related.status==="error"?"Retry related attempts":related.status==="loading"?"Cancel related search":"Hide related"}</button>
                  <button type="button" onclick={() => navigate(routePath({ name: "run", runId: attempt.runId }))}>Open run</button>
                  <button type="button" disabled={session.busy} aria-describedby={session.busy?"return-action-busy":undefined} onclick={() => void retryAttempt(attempt)}>Try this again</button>
                </div>
              </div>
              {#if related?.status === "loading"}<p role="status">Finding your nearest related attempts…</p>
              {:else if related?.status === "error"}<p role="alert">{related.message}</p>
              {:else if related?.status === "loaded"}
                <ul class="related-attempts" aria-label={`Related attempts for ${attempt.packId === null ? "this position" : packTitle(attempt.packId)}`}>
                  {#each related.items as item}
                    <li><span><strong>{relatedAttemptLabel(item.relation)}</strong> · {item.attemptCount} {item.attemptCount === 1 ? "attempt" : "attempts"} on that material</span><button type="button" onclick={() => navigate(routePath({ name: "run", runId: item.runId }))}>Open</button></li>
                  {:else}<li>No other recorded attempts match this position or pack yet.</li>{/each}
                </ul>
              {/if}
            </article>
          {:else}<p>No attempts recorded yet.</p>{/each}
        </div>
      </section>
      <p class="honest">This is an attempt history and return queue, not a mastery score.</p>
    </main>
  {:else if route.name === "create"}
    <main class="shell-view studio" aria-labelledby="create-title">
      <p class="eyebrow">Create / Pack Studio</p>
      <h1 id="create-title">Author against the real validator.</h1>
      <CreateSeedChooser {packs} {runs} busy={createSeedBusy} error={createSeedError} savedGamePending={createSeedPreparation !== undefined} onPosition={createPositionSeed} onGame={createGameSeed} onRun={createRunSeed} onPack={createPackSeed} onClearError={() => createSeedError = undefined} />
      {#if !selectedDraftId}
      <aside class="resume-drafts" aria-label="Your drafts">
        <h2 id="resume-drafts-title">Resume one of your drafts</h2>
        <div class="row-actions">
          {#each drafts as draft}<button type="button" disabled={studioMutationBusy !== undefined} aria-describedby={studioMutationBusy !== undefined ? "studio-action-busy" : undefined} onclick={() => { selectedDraftId = draft.id; studioJson = JSON.stringify(draft.document, null, 2); studioActionError = undefined; withdrawConfirmId = undefined; }}>{draft.packId} · {draft.state}</button>{:else}<p>No saved pack drafts yet.</p>{/each}
        </div>
      </aside>
      {/if}
      {#if selectedDraftId}
      <section id="pack-studio-editor" aria-labelledby="pack-studio-editor-title">
      <h2 id="pack-studio-editor-title">Edit selected pack</h2>
      <div class="studio-grid pack-studio-grid">
        <aside aria-label="Your drafts">
          <h2>Your drafts</h2>
          {#each drafts as draft}
            <button type="button" disabled={studioMutationBusy !== undefined} aria-describedby={studioMutationBusy !== undefined ? "studio-action-busy" : undefined} onclick={() => { selectedDraftId = draft.id; studioJson = JSON.stringify(draft.document, null, 2); studioActionError = undefined; withdrawConfirmId = undefined; }}>
              {draft.packId} · {draft.state}
            </button>
          {:else}<p>No database drafts yet. Paste a v{DRILL_PACK_SCHEMA_VERSION} pack to begin.</p>{/each}
        </aside>
        <section>
          <label for="studio-json">Pack JSON</label>
          <textarea id="studio-json" bind:value={studioJson} disabled={studioMutationBusy !== undefined} spellcheck="false"></textarea>
          <div class="row-actions">
            <button type="button" disabled={studioMutationBusy !== undefined} aria-describedby={studioMutationBusy !== undefined ? "studio-action-busy" : undefined} onclick={() => void createDraft()}>Create draft</button>
            <button type="button" disabled={studioMutationBusy !== undefined || selectedPackDraft?.state !== "draft"} aria-describedby={studioMutationBusy !== undefined ? "studio-action-busy" : selectedPackDraft?.state !== "draft" ? "draft-action-disabled" : undefined} onclick={() => void saveDraft()}>Save</button>
            <button class="primary" type="button" disabled={studioMutationBusy !== undefined || selectedPackDraft?.state !== "draft" || packLintState !== "ready" || !packBufferValidation?.valid} aria-describedby={studioMutationBusy !== undefined ? "studio-action-busy" : selectedPackDraft?.state !== "draft" ? "draft-action-disabled" : packLintState !== "ready" || !packBufferValidation?.valid ? "playtest-disabled" : undefined} onclick={() => void playtestDraft()}>Save &amp; playtest</button>
            <button type="button" disabled={studioMutationBusy !== undefined || selectedPackRegistrationBlock !== undefined} aria-describedby={studioMutationBusy !== undefined ? "studio-action-busy" : selectedPackRegistrationBlock !== undefined ? "register-disabled" : "pack-publication-retention"} onclick={() => void registerDraft()}>Register community pack</button>
            <button type="button" disabled={studioMutationBusy !== undefined || selectedPackDraft?.state !== "draft"} aria-describedby={studioMutationBusy !== undefined ? "studio-action-busy" : selectedPackDraft?.state !== "draft" ? "draft-action-disabled" : undefined} onclick={() => { if (selectedPackDraft) withdrawConfirmId = selectedPackDraft.id; }}>Withdraw…</button>
          </div>
          {#if studioMutationBusy !== undefined}<p id="studio-action-busy" role="status">{studioMutationBusy.kind === "playtest" ? "Saving the retained draft and starting its playtest…" : studioMutationBusy.kind === "register" ? "Registering the retained draft…" : studioMutationBusy.kind === "withdraw" ? "Withdrawing the retained draft…" : studioMutationBusy.kind === "save" ? "Saving the retained draft…" : "Creating one draft from these retained bytes…"}</p>{/if}
          {#if selectedPackDraft?.state !== "draft"}<p id="draft-action-disabled" class="honest">{selectedPackDraft ? `This draft is ${selectedPackDraft.state}; its saved bytes remain read-only.` : "Select or create a draft first."}</p>{/if}
          {#if selectedPackDraft?.state === "draft" && (packLintState !== "ready" || !packBufferValidation?.valid)}<p id="playtest-disabled" class="honest">{packLintState === "waiting" ? "Waiting for you to pause typing…" : packLintState === "checking" ? "Checking these unsaved bytes…" : packLintState === "unavailable" ? "Live validation is unavailable; saving remains possible." : "Fix the listed validation errors before the real run can start."}</p>{/if}
          {#if selectedPackRegistrationBlock !== undefined}<p id="register-disabled" class="honest">{selectedPackRegistrationBlock}</p>{/if}
          {#if selectedPackDraft}<p id="pack-publication-retention" class="honest">Playtesting stays private and preserves the tested bytes. Registration publishes immutable document bytes, authored prose, licence, and attribution; those remain available with “deleted account” attribution if you later delete your account.</p>{/if}
          {#if selectedPackDraft && withdrawConfirmId === selectedPackDraft.id}<aside class="deletion-card"><h3>Withdraw this draft?</h3><p>It becomes read-only and cannot be registered. Existing private playtest runs keep their exact tested bytes.</p><div class="row-actions"><button type="button" disabled={studioMutationBusy !== undefined} aria-describedby={studioMutationBusy !== undefined ? "studio-action-busy" : undefined} onclick={() => void withdrawDraft(selectedPackDraft.id)}>Confirm withdrawal</button><button type="button" disabled={studioMutationBusy !== undefined} aria-describedby={studioMutationBusy !== undefined ? "studio-action-busy" : undefined} onclick={() => withdrawConfirmId = undefined}>Cancel</button></div></aside>{/if}
          {#if studioActionError}<p role="alert">{studioActionError}</p>{/if}
          {#if packLintError}<p role="alert">{packLintError}</p>{/if}
          <section class="validation-summary" aria-labelledby="required-pack-fields">
            <h3 id="required-pack-fields">Required fields</h3>
            <ul aria-label="Required pack fields">{#each packRequiredFields as item}<li class:missing={!item.present}><code>{item.field}</code> — {item.present ? "present" : "missing"}</li>{/each}</ul>
          </section>
          {#if selectedPackDraft && displayedPackValidation}
            <div class="validation-sections" aria-label="Pack validation results">
              {#if packValidationSections.incomplete.length > 0}<section><h3>Still needed</h3><ul>{#each packValidationSections.incomplete as issue}<li><code>{issue.path}</code> {issue.message}</li>{/each}</ul></section>{/if}
              {#if packValidationSections.wrong.length > 0}<section><h3>Needs correction</h3><ul>{#each packValidationSections.wrong as issue}<li><code>{issue.path}</code> {issue.code}: {issue.message}</li>{/each}</ul></section>{/if}
              {#if packValidationSections.warnings.length > 0}<section><h3>Warnings</h3><ul>{#each packValidationSections.warnings as issue}<li><code>{issue.path}</code> {issue.code}: {issue.message}</li>{/each}</ul></section>{/if}
              {#if displayedPackValidation.issues.length === 0}<p>{packLintState === "ready" ? "Unsaved bytes are validation clean." : "Saved bytes are validation clean."}</p>{/if}
            </div>
          {/if}
        </section>
        <aside class="graduation-column" aria-labelledby="graduation-column-title">
          <p class="eyebrow">Publication readiness</p>
          <h2 id="graduation-column-title">Graduation conditions</h2>
          {#if packGraduationEntries === undefined}
            <p>Fix the JSON syntax to inspect graduation conditions.</p>
          {:else if packGraduationEntries.length === 0}
            <p>No graduation conditions are declared in these bytes.</p>
          {:else}
            <p><strong>{blockingGraduationEntries.length}</strong> blocking · {packGraduationEntries.length - blockingGraduationEntries.length} discharged</p>
            <ol class="graduation-list">
              {#each packGraduationEntries as entry}
                <li class:blocking={entry.state === "blocking"}>
                  <span>{entry.state.replaceAll("_", " ")}</span>
                  <code>{entry.id}</code>
                  <p>{entry.statement}</p>
                  {#if entry.legacy}<small>Legacy or malformed entry; validation treats this as blocking.</small>{/if}
                </li>
              {/each}
            </ol>
          {/if}
          <p class="honest">Registration publishes immutable bytes. Resolve each blocking condition in the document before registering.</p>
        </aside>
      </div>
      <PackVocabularyEditor documentJson={studioJson} shapes={authoringShapes} principles={authoringPrinciples} onDocumentJson={(documentJson) => studioJson = documentJson} />
      <PackProvenanceEditor documentJson={studioJson} onDocumentJson={(documentJson) => studioJson = documentJson} />
      <p class="honest">Community registration does not make a pack official. Official packs enter through git and the deployment image.</p>
      </section>
      {/if}
      <section class="vocabulary-status" aria-labelledby="vocabulary-status-title">
        <p class="eyebrow">Authoring capabilities</p>
        <h2 id="vocabulary-status-title">Vocabulary status</h2>
        <p>These counts come from the packs served right now. An unused entry is available but has no pack consumer; an unavailable policy is declared by the runtime but cannot be selected.</p>
        <div class="vocabulary-status-grid">
          <section aria-labelledby="unused-principles-title">
            <h3 id="unused-principles-title">Unused principles</h3>
            <ul>{#each authoringPrinciples.filter((principle) => principle.usedByPacks === 0) as principle}<li><strong>{principle.name}</strong> <code>{principle.id}</code></li>{:else}<li>Every registered principle is used by a served pack.</li>{/each}</ul>
          </section>
          <section aria-labelledby="unused-shapes-title">
            <h3 id="unused-shapes-title">Unused shapes</h3>
            <ul>{#each authoringShapes.filter((shape) => shape.usedByPacks === 0) as shape}<li><strong>{shape.name}</strong> <code>{shape.id}</code></li>{:else}<li>Every registered shape is used by a served pack.</li>{/each}</ul>
          </section>
          <section aria-labelledby="unavailable-policies-title">
            <h3 id="unavailable-policies-title">Unavailable run policies</h3>
            <ul>{#each capabilities?.unsupportedPolicyModes ?? [] as policy}<li><code>{policy.mode}</code> — {policy.reason}</li>{:else}<li>No declared policy modes are unavailable.</li>{/each}</ul>
          </section>
        </div>
      </section>
      <h2>Shape library editor</h2>
      <div class="studio-grid">
        <aside aria-label="Your shape drafts">
          <h3>Your shape drafts</h3>
          {#each shapeDrafts as draft}<button type="button" disabled={shapeMutationBusy !== undefined} aria-describedby={shapeMutationBusy !== undefined ? "shape-action-busy" : undefined} onclick={() => { selectedShapeDraftId = draft.id; shapeStudioJson = JSON.stringify(draft.document, null, 2); shapeActionError = undefined; }}>{draft.shapeId} · {draft.state}</button>{:else}<p>No shape drafts yet.</p>{/each}
        </aside>
        <section>
          <fieldset class="shape-editor-fields" inert={shapeMutationBusy !== undefined} aria-busy={shapeMutationBusy !== undefined}>
            <legend>Shape definition</legend>
            <label for="shape-studio-json">Shape JSON</label><textarea id="shape-studio-json" bind:value={shapeStudioJson} disabled={shapeMutationBusy !== undefined} aria-describedby={shapeMutationBusy !== undefined ? "shape-action-busy" : undefined} spellcheck="false"></textarea>
            <ShapePlanSignatureEditor documentJson={shapeStudioJson} onDocumentJson={(documentJson) => shapeStudioJson = documentJson} />
            <label>Probe FEN <input bind:value={shapeProbeFen} disabled={shapeMutationBusy !== undefined} aria-describedby={shapeMutationBusy !== undefined ? "shape-action-busy" : undefined} placeholder="Optional position to test the trigger" /></label>
            <div class="row-actions">
              <button type="button" disabled={shapeMutationBusy !== undefined} aria-describedby={shapeMutationBusy !== undefined ? "shape-action-busy" : undefined} onclick={() => void createShapeDraft()}>Create shape draft</button>
              <button type="button" disabled={shapeMutationBusy !== undefined || selectedShapeDraft?.state !== "draft"} aria-describedby={shapeMutationBusy !== undefined ? "shape-action-busy" : selectedShapeDraft?.state !== "draft" ? "shape-selection-required" : undefined} onclick={() => void saveShapeDraft()}>Save shape</button>
              <button type="button" disabled={shapeMutationBusy !== undefined || selectedShapeDraft?.state !== "draft"} aria-describedby={shapeMutationBusy !== undefined ? "shape-action-busy" : selectedShapeDraft?.state !== "draft" ? "shape-selection-required" : undefined} onclick={() => void lintShapeDraft()}>Lint + probe</button>
              <button type="button" disabled={shapeMutationBusy !== undefined || selectedShapeRegistrationBlock !== undefined} aria-describedby={shapeMutationBusy !== undefined ? "shape-action-busy" : selectedShapeRegistrationBlock !== undefined ? "shape-register-disabled" : "shape-publication-retention"} onclick={() => void registerShapeDraft()}>Register community shape</button>
            </div>
          </fieldset>
          {#if shapeMutationBusy !== undefined}<p id="shape-action-busy" role="status">{shapeMutationBusy.kind === "register" ? "Registering the retained shape draft…" : shapeMutationBusy.kind === "probe" ? "Checking the retained shape bytes and FEN…" : shapeMutationBusy.kind === "save" ? "Saving the retained shape draft…" : "Creating one draft from these retained bytes…"}</p>{/if}
          {#if shapeProbeResult !== undefined}<p role="status">Probe trigger: {shapeProbeResult ? "matches" : "does not match"}</p>{/if}
          <section class="shape-corpus-preview" aria-labelledby="shape-corpus-preview-title">
            <h3 id="shape-corpus-preview-title">Served-position preview</h3>
            {#if shapeLintState === "waiting"}<p>Waiting for you to pause typing…</p>
            {:else if shapeLintState === "checking"}<p>Checking every authored position served by this deployment…</p>
            {:else if shapeLintError}<p role="alert">{shapeLintError}</p>
            {:else if shapeBufferValidation?.corpusPreview}
              <p><strong>{shapeBufferValidation.corpusPreview.fires}</strong> of <strong>{shapeBufferValidation.corpusPreview.of}</strong> authored positions match this trigger.</p>
              {#if shapeBufferValidation.corpusPreview.matches.length === 0}
                <p class="honest">This trigger never fires in the served corpus. It may describe a real pattern, but these packs provide no board witness.</p>
              {:else}
                <div class="shape-corpus-results">
                  <ul aria-label="Matching authored positions">
                    {#each shapeBufferValidation.corpusPreview.matches as match}
                      <li><button type="button" class:active={selectedShapeCorpusMatch?.packId === match.packId && selectedShapeCorpusMatch?.ply === match.ply && selectedShapeCorpusMatch?.fen === match.fen} onclick={() => selectedShapeCorpusMatch = match}>{match.packTitle} · ply {match.ply}</button></li>
                    {/each}
                  </ul>
                  {#if selectedShapeCorpusMatch}
                    <article aria-label="Selected matching position">
                      <h4>{selectedShapeCorpusMatch.packTitle}</h4>
                      <p><code>{selectedShapeCorpusMatch.packId}</code> · authored ply {selectedShapeCorpusMatch.ply}</p>
                      <div class="shape-corpus-board"><Chessboard fen={selectedShapeCorpusMatch.fen} startSide={selectedShapeCorpusMatch.startSide} disabled showDests={false} highlightMoves={false} onMove={() => false} /></div>
                    </article>
                  {:else}<p class="honest">Open any match to inspect the actual board.</p>{/if}
                </div>
              {/if}
            {:else}<p>Select a draft to check its trigger against served positions.</p>{/if}
          </section>
          {#if shapeActionError}<p role="alert">{shapeActionError}</p>{/if}
          {#if !selectedShapeDraftId}<p id="shape-selection-required" class="honest">Select or create a shape draft first.</p>{/if}
          {#if selectedShapeRegistrationBlock}<p id="shape-register-disabled" class="honest">{selectedShapeRegistrationBlock}</p>{/if}
          {#if selectedShapeDraftId}<p id="shape-publication-retention" class="honest">Registration publishes immutable shape bytes, authored prose, licence, and attribution. They remain available with “deleted account” attribution if you later delete your account.</p>{/if}
          {#if selectedShapeDraftId}{@const selectedShape=shapeDrafts.find((candidate)=>candidate.id===selectedShapeDraftId)}{@const displayedShapeValidation=shapeBufferValidation ?? selectedShape?.validation}{#if displayedShapeValidation}<ul>{#each displayedShapeValidation.issues as issue}<li><code>{issue.path}</code> {issue.code}: {issue.message}</li>{:else}<li>Validation clean.</li>{/each}</ul>{/if}{/if}
        </section>
      </div>
      <p class="honest">Shape entries name reusable patterns and plans. They do not prescribe a move in the current position.</p>
    </main>
  {:else if route.name === "live"}
    <main class="shell-view" aria-labelledby="live-title">
      <p class="eyebrow">Live / shared rehearsal</p><h1 id="live-title">Rehearse with other people.</h1>
      <section aria-labelledby="classrooms-title">
        <h2 id="classrooms-title">Classrooms</h2>
        <p>A classroom lets a teacher assign packs to you and schedule sessions. It does not let them see your runs — you share an attempt one at a time, and you can take it back.</p>
        <form class="row-actions" onsubmit={(event)=>{event.preventDefault();void createClassroom();}}><label>New classroom <input required disabled={classroomBusy!==undefined} bind:value={classroomName} /></label><button type="submit" disabled={classroomBusy!==undefined}>{classroomBusy==="create"?"Creating…":"Create"}</button></form>
        {#if classroomActionError}<p role="alert">{classroomActionError}</p>{/if}
        <div class="item-list">
          {#each classrooms as classroom}
            <article><div><h3>{classroom.name}</h3><p>{classroomRoleLabel(classroom.memberRole)} · {classroomStateLabel(classroom.memberState)}{classroom.archivedAt ? " · archived read-only" : ""}</p>{#if classroom.memberState==="invited"}<p>{classroom.invitation?.invitedBy ? `Invited by @${classroom.invitation.invitedBy.handle}` : "Invited by a classroom teacher"}{classroom.invitation ? ` · ${readableDate(classroom.invitation.invitedAt)}` : ""}</p>{#if classroom.memberRole==="teacher"}<p class="honest">Accepting makes you a classroom teacher: you can invite members, assign packs, and schedule sessions. It does not grant access to anyone's runs; learners share attempts one at a time and can withdraw them.</p>{:else}<p class="honest">Accepting lets teachers assign packs to you and schedule sessions. It does not let them see your runs; you share attempts one at a time and can withdraw them.</p>{/if}<p id={`classroom-retention-${classroom.id}`} class="honest">Accepting keeps your membership as shared classroom history. If other active members remain when you delete your account, that history can stay read-only with your identity removed.</p>{/if}</div>
              {#if classroom.memberState==="invited"}<div class="row-actions"><button type="button" disabled={classroomBusy!==undefined} aria-describedby={`classroom-retention-${classroom.id}`} onclick={()=>void respondClassroom(classroom.id,"accept")}>{classroomBusy===`respond:${classroom.id}`?"Working…":"Accept"}</button><button type="button" disabled={classroomBusy!==undefined} onclick={()=>void respondClassroom(classroom.id,"decline")}>Decline</button></div>{:else}<button type="button" disabled={classroomBusy!==undefined&&!classroomBusy.startsWith("open:")} onclick={()=>void openClassroom(classroom.id)}>{classroomBusy===`open:${classroom.id}`?"Opening…":"Open"}</button>{/if}
            </article>
          {:else}<p>No classrooms yet.</p>{/each}
        </div>
        {#if classroomDetail}
          <article class="classroom-detail">
            <div class="row-actions"><h3>{classroomDetail.classroom.name}{classroomDetail.classroom.archivedAt ? " · archived" : ""}</h3>{#if !classroomDetail.classroom.archivedAt}<button type="button" disabled={classroomBusy!==undefined} onclick={()=>void respondClassroom(classroomDetail!.classroom.id,"leave")}>{classroomBusy===`respond:${classroomDetail.classroom.id}`?"Leaving…":"Leave"}</button>{/if}</div>
            {#if classroomDetail.classroom.archivedAt}<p class="honest">This classroom remains as read-only shared history. Membership, assignments, submissions, and scheduling cannot be changed.</p>{/if}
            <h4>Members</h4><ul>{#each classroomDetail.members as member}<li>@{member.handle} — {classroomRoleLabel(member.memberRole)}, {classroomStateLabel(member.state)}</li>{/each}</ul>
            {#if classroomDetail.membership.memberRole==="teacher" && !classroomDetail.classroom.archivedAt}
              <form class="row-actions" onsubmit={(event)=>{event.preventDefault();void inviteClassroom();}}><label>Invite handle <input required disabled={classroomBusy!==undefined} bind:value={classroomInviteHandle}/></label><label>Role <select disabled={classroomBusy!==undefined} bind:value={classroomInviteRole}><option value="learner">Learner</option><option value="teacher">Teacher</option></select></label><button type="submit" disabled={classroomBusy!==undefined}>{classroomBusy===`invite:${classroomDetail.classroom.id}`?"Inviting…":"Invite"}</button></form>
              <form class="row-actions" onsubmit={(event)=>{event.preventDefault();void assignClassroomPack();}}><label>Pack <select required disabled={classroomBusy!==undefined} bind:value={assignmentPackId}><option value="">Choose a pack</option>{#each packs as pack}<option value={pack.id}>{pack.title}</option>{/each}</select></label><label>Teacher note <input disabled={classroomBusy!==undefined} bind:value={assignmentNote}/></label><label>Due <input type="datetime-local" disabled={classroomBusy!==undefined} bind:value={assignmentDueAt}/></label><button type="submit" disabled={classroomBusy!==undefined}>{classroomBusy===`assign:${classroomDetail.classroom.id}`?"Assigning…":"Assign"}</button></form>
            {/if}
            <h4>Assignments and submissions</h4><div class="item-list assignment-grid">{#each classroomDetail.assignments as assignment}<article><div><h5>{packTitle(assignment.packId)}</h5><p>Assigned by @{classroomMemberHandle(assignment.assignedBy)} · {readableDate(assignment.createdAt)}{assignment.dueAt?` · due ${readableDate(assignment.dueAt)}`:""}{isOverdue(assignment.dueAt)&&!assignment.withdrawnAt?" · overdue":""}{assignment.withdrawnAt?" · withdrawn":""}</p>{#if assignment.note}<blockquote><p>{assignment.note}</p><footer>— @{classroomMemberHandle(assignment.assignedBy)}, teacher note</footer></blockquote>{/if}</div>{#if classroomDetail.membership.memberRole==="teacher"}<ul aria-label={`Submission status for ${packTitle(assignment.packId)}`}>{#each classroomDetail.members.filter((member)=>member.memberRole==="learner"&&member.state==="active") as member}{@const submissions=assignmentSubmissions(assignment.id,member.learnerId)}<li><strong>@{member.handle}</strong>{#if submissions.length===0} — not submitted{:else}<ul>{#each submissions as submission}<li>{submission.withdrawnAt?`Withdrawn ${readableDate(submission.withdrawnAt)}`:`Submitted ${readableDate(submission.submittedAt)}`} · {submission.access==="available"?"access available":"access revoked or expired"}{#if submission.access==="available"} <button type="button" onclick={()=>navigate(routePath({name:"run",runId:submission.runId}))}>Review @{member.handle}'s run</button>{/if}</li>{/each}</ul>{/if}</li>{:else}<li>No active learners.</li>{/each}</ul>{/if}</article>{:else}<p>No assignments.</p>{/each}</div>
            {#if learner}<CohortStanding {api} classroomId={classroomDetail.classroom.id} learnerId={learner.id} role={classroomDetail.membership.memberRole} />{/if}
            <h4>Upcoming sessions</h4><ul>{#each classroomDetail.upcomingSessions as item}<li>{item.title} · {item.scheduledFor?readableDate(item.scheduledFor):"unscheduled"}</li>{:else}<li>No scheduled sessions.</li>{/each}</ul>
          </article>
        {/if}
      </section>
      <div class="row-actions">
        <label>Session title <input maxlength="120" bind:value={liveTitle} disabled={liveCreateBusy} aria-describedby={liveCreateBusy?"live-create-busy":undefined}/></label>
        <label>What do you want to do? <select value={selectedLiveWorkflow()} disabled={liveCreateBusy} aria-describedby={liveCreateBusy?"live-create-busy":undefined} onchange={(event)=>chooseLiveWorkflow(event.currentTarget.value as LiveWorkflow)}>{#each LIVE_WORKFLOWS as workflow}<option value={workflow.id}>{workflow.label}</option>{/each}</select></label>
        <p class="session-purpose">{liveWorkflowOption(selectedLiveWorkflow()).summary}</p>
        <details><summary>Advanced board handoff</summary><label>Board <select value={liveBoardControl} disabled={liveCreateBusy} aria-describedby={liveCreateBusy?"live-create-busy":undefined} onchange={(event)=>liveBoardControl=event.currentTarget.value as BoardControl}>{#each liveBoardControlOptions(liveKind) as option}<option value={option.id}>{option.label}</option>{/each}</select></label><p class="honest">The workflow above chooses a useful default. Change handoff only when the group needs free claim or a named rotation.</p></details>
        <label>Classroom (optional) <select bind:value={liveClassroomId} disabled={liveCreateBusy} aria-describedby={liveCreateBusy?"live-create-busy":undefined}><option value="">None</option>{#each classrooms.filter((item)=>item.memberRole==="teacher"&&item.memberState==="active") as classroom}<option value={classroom.id}>{classroom.name}</option>{/each}</select></label>
        <label>Schedule (optional) <input type="datetime-local" bind:value={liveScheduledFor} disabled={liveCreateBusy} aria-describedby={liveCreateBusy?"live-create-busy":undefined}/></label>
        {#if liveBoardControl==="rotation"}
          <label>Rotation handles <input bind:value={liveRotationHandles} placeholder="coach, student-one, student-two" disabled={liveCreateBusy} aria-describedby={liveCreateBusy?"live-create-busy":undefined}/></label>
          <p id="live-rotation-required" class="honest">Comma-separated handles in turn order. Each person must already have participant access to the run.</p>
        {/if}
        {#if liveBoardControl==="match"}
          <label>White handle<input bind:value={liveMatchWhite} placeholder="student-white" disabled={liveCreateBusy} aria-describedby={liveCreateBusy?"live-create-busy":undefined}/></label>
          <label>Black handle<input bind:value={liveMatchBlack} placeholder="or leave one seat open" disabled={liveCreateBusy} aria-describedby={liveCreateBusy?"live-create-busy":undefined}/></label>
          <p id="live-match-required" class="honest">Name at least one player; the other seat may stay open for a friend link.</p>
        {/if}
        {#if !liveTitle.trim()}<p id="live-title-required" class="honest">Give the session a title viewers will recognize.</p>{/if}
      </div>
      <section><h2>Your sessions</h2><p class="honest">Wall cards show rules facts and the pack's recorded objective state; they are never ordered or labelled by engine evaluation.</p><div class="item-list live-wall">{#each liveSessions as item}<article><div class="mini-board"><Chessboard fen={item.board.activeFen} startSide="white" disabled={true} onMove={()=>{}}/></div><div><h3>{item.title}</h3><p>{liveKindLabel(item.kind)} · {liveBoardControlLabel(item.boardControl)}</p>{#if item.classroom}<p>Classroom: <strong>{item.classroom.name}</strong></p>{/if}<p><strong>{liveTurnLabel(item)}</strong>{item.board.pausedAt ? ` · paused since ${readableDate(item.board.pausedAt)}` : ""}</p>{#if item.board.players}<p>{item.board.players.white?`@${item.board.players.white.handle}`:"open"} vs {item.board.players.black?`@${item.board.players.black.handle}`:"open"}</p>{/if}<p>Objective: {objectiveStateLabel(item.board.objectiveState)}</p><p>{item.board.lastMoveAt ? `Last move ${readableDate(item.board.lastMoveAt)}` : "No move committed yet"}</p><p>@{item.board.leaseHeldBy.handle} holds the board · {rehearsalTurnCount(item.board.plyCount)}</p></div><button type="button" onclick={()=>navigate(routePath({name:"live-session",sessionId:item.id}))}>Open</button></article>{:else}<p>No live sessions yet.</p>{/each}</div></section>
      <section><h2>Choose the source run</h2><div class="item-list">{#each runs as item}{@const disabledReason=liveCreateDisabledReason(item)}<article><div><h3>{item.title}</h3><p>{liveSourceIneligibility(item)??(item.viewerRole === "host" ? "Ready for this workflow" : "Only the run host can start a session")}</p><p class="honest">{runSessionKindLabel(item.sessionKind)} · {item.recordedMoveCount} recorded {item.recordedMoveCount===1?"move":"moves"}</p></div><button type="button" disabled={disabledReason!==undefined} aria-describedby={liveCreateBusy?"live-create-busy":disabledReason===undefined?undefined:`live-disabled-${item.id}`} onclick={()=>void createLive(item)}>{liveCreateBusy?"Creating…":`Create ${liveKind}`}</button>{#if disabledReason&&!liveCreateBusy}<span id={`live-disabled-${item.id}`} class="honest">{disabledReason}</span>{/if}</article>{/each}</div>{#if runSelection.shown<runSelection.total}<p id="live-run-budget" class="honest">Showing {runSelection.shown} of {runSelection.total} saved runs.</p><button type="button" disabled={runPageBusy} aria-describedby="live-run-budget" onclick={()=>void loadMoreRuns()}>{runPageBusy?"Loading…":"Load more source runs"}</button>{/if}{#if runPageError}<p role="alert">{runPageError}</p>{/if}{#if liveCreateBusy}<p id="live-create-busy" role="status">Creating the session…</p>{/if}{#if liveCreateError}<p role="alert">{liveCreateError}</p>{/if}</section>
      <p class="honest">Vote tallies are advisory. Chat identity is only as trustworthy as the configured adapter.</p>
    </main>
  {:else if route.name === "live-session"}
    <main class="shell-view" aria-labelledby="session-title">
      {#if liveDetail}<p class="eyebrow">Live / {liveKindLabel(liveDetail.session.kind)}</p><h1 id="session-title">{liveDetail.session.title}</h1>{#if liveDetail.classroom}<p class="session-context">Classroom: <strong>{liveDetail.classroom.name}</strong></p>{/if}<p>{liveBoardControlLabel(liveDetail.session.boardControl)} · your role: {liveRoleLabel(liveDetail.role)}</p><p class="session-purpose">{liveSessionPurpose(liveDetail.session.kind)}</p>
        {#if liveSessionActionBusy}<p id="live-session-action-busy" role="status">Updating this session…</p>{/if}
        {#if liveSessionActionError}<p role="alert">{liveSessionActionError}</p>{/if}
        {#if liveDetail.match}<section aria-labelledby="match-state-title"><h2 id="match-state-title">Match board</h2><p>{liveDetail.match.pausedAt ? "Paused for rehearsal" : liveDetail.match.pauseProposedBy ? "Pause proposed" : "Live — evidence and rehearsal are withheld"}</p><div class="row-actions">{#if liveDetail.match.pausedAt}<button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>void operateMatch("resume")}>Resume main line</button>{:else}<button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>void operateMatch("propose_pause")}>Propose pause</button>{#if liveDetail.match.pauseProposedBy}<button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>void operateMatch("accept_pause")}>Accept pause</button>{/if}{#if liveDetail.role==="host"}<button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>void operateMatch("pause")}>Coach pause</button>{/if}{/if}</div>{#if liveDetail.role==="host"}<div class="row-actions"><label>Open seat <select bind:value={liveJoinSlot} disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined}><option value="white">White</option><option value="black">Black</option></select></label><label>Optional handle<input bind:value={liveJoinHandle} disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined}/></label><button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>void mintJoinLink()}>Create friend link</button></div>{#if liveJoinUrl}<p role="status">Friend link: <code>{liveJoinUrl}</code></p>{/if}{/if}</section>{/if}
        <div class="studio-grid">
          <section>
            <h2>Members</h2>
            <p>@{liveDetail.leaseHeldBy.handle} holds the board.</p>
            <ul>{#each liveDetail.grants as grant}<li>@{grant.handle} — {liveRoleLabel(grant.role)}</li>{/each}</ul>
            {#if liveDetail.role === "host"}
              <label>Offer board to handle <input bind:value={liveOfferHandle} disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined}/></label>
              <button type="button" disabled={!liveOfferHandle||!liveWriterId(liveDetail.session.runId)||liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":!liveWriterId(liveDetail.session.runId)?"offer-readonly":undefined} onclick={()=>void offerLiveBoard()}>Offer board</button>
              {#if !liveWriterId(liveDetail.session.runId)}<p id="offer-readonly" class="honest">Open the shared board on this device before offering possession.</p>{/if}
              {#if liveDetail.leaseHeldBy.learnerId !== learner?.id}
                <div class="coach-interrupt"><p class="honest">A vote or proposal preserves the learner's turn. Taking the board ends it.</p><button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>{liveSessionActionError=undefined;liveReclaimIntent=true;}}>Take back board…</button>{#if liveReclaimIntent}<aside class="deletion-card" aria-labelledby="reclaim-title"><h3 id="reclaim-title">Take the board from @{liveDetail.leaseHeldBy.handle}?</h3><p>You become the only person who can move. @{liveDetail.leaseHeldBy.handle}'s current line stays in the branch rail, but their attempt-in-progress ends as an active learning turn.</p><p class="honest">Prefer a vote or proposal when a nudge is enough. Nothing in the learner's line is deleted.</p><div class="row-actions"><button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>void confirmLiveReclaim()}>{liveSessionActionBusy?.kind==="reclaim"?"Taking board…":"Confirm — take the board"}</button><button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>{liveReclaimIntent=false;liveSessionActionError=undefined;}}>Cancel</button></div></aside>{/if}</div>
              {/if}
            {/if}
            <h2>Move authorship</h2>
            <ol aria-label="Move authorship">{#each liveDetail.moveAuthorship as entry,index}<li>Move {index+1} · @{moveAuthorHandle(entry.learnerId)}</li>{:else}<li>No committed moves yet.</li>{/each}</ol>
            <h2>Board marks</h2>
            {#if markAttribution(liveDetail)}<p class="honest">{markAttribution(liveDetail)}</p>{:else}<p>No relayed marks at this position.</p>{/if}
            <h2>Proposals</h2>
            {#if liveDetail.role !== "spectator"}
              <div class="row-actions"><label>Move <select bind:value={liveProposalMove} disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined}><option value="">Choose a legal move</option>{#each liveMoveChoices as choice}<option value={choice.uci}>{choice.san}</option>{/each}</select></label><button type="button" disabled={!liveMoveChoices.some((choice)=>choice.uci===liveProposalMove)||liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":!liveProposalMove?"proposal-disabled":undefined} onclick={()=>void submitLiveProposal()}>Propose</button></div>
              {#if !liveProposalMove}<p id="proposal-disabled" class="honest">Choose a legal move from the active position.</p>{/if}
            {/if}
            <ul aria-label="Move proposals">{#each liveDetail.proposals as proposal}<li><strong>{liveMoveLabel(proposal.moveUci, proposal.nodeId)}</strong> · proposed by @{moveAuthorHandle(proposal.proposedBy)} · {proposalStateLabel(proposal.status)}{#if liveDetail.role==="host"&&proposal.status==="open"}<div class="row-actions"><button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>void resolveLiveProposal(proposal.id,"apply")}>Play proposal</button><button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>void resolveLiveProposal(proposal.id,"decline")}>Decline</button></div>{/if}</li>{:else}<li>No proposals yet.</li>{/each}</ul>
          </section>
          <section>
            <h2>Vote</h2>
            {#if liveDetail.role === "host"}
              <div class="vote-editor">
                <label>Prompt<input maxlength="120" bind:value={liveVotePrompt} disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined}/></label>
                {#each liveVoteOptions as option,index}<div class="row-actions"><label>Move <select value={option.moveUci} disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onchange={(event)=>setLiveVoteMove(index,event.currentTarget.value)}><option value="">Choose a legal move</option>{#each liveMoveChoices as choice}<option value={choice.uci}>{choice.san}</option>{/each}</select></label><label>Audience label<input maxlength="40" value={option.label} disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} oninput={(event)=>setLiveVoteLabel(index,event.currentTarget.value)}/></label><button type="button" disabled={liveVoteOptions.length<=MIN_LIVE_VOTE_OPTIONS||liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>liveVoteOptions=liveVoteOptions.filter((_,candidate)=>candidate!==index)}>Remove</button></div>{/each}
                <div class="row-actions"><button type="button" disabled={liveVoteOptions.length>=MAX_LIVE_VOTE_OPTIONS||liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>liveVoteOptions=[...liveVoteOptions,{moveUci:"",label:""}]}>Add option</button><label>Duration (seconds)<input type="number" min={MIN_LIVE_VOTE_SECONDS} max={MAX_LIVE_VOTE_SECONDS} bind:value={liveVoteDuration} disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined}/></label><button type="button" disabled={!liveVoteReady()||liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":!liveVoteReady()?"vote-disabled":undefined} onclick={()=>void openLiveVote()}>Open vote</button></div>
              </div>
              {#if !liveVoteReady()}<p id="vote-disabled" class="honest">Choose two to eight different legal moves, give each an audience label, and set a duration from 15 seconds to 10 minutes.</p>{/if}
            {/if}
            {#if liveDetail.vote}<p>{liveDetail.vote.window.prompt} · {voteStateLabel(liveDetail.vote.window.state)}</p>{#if liveDetail.vote.window.state==="open"}<div class="vote-options" role="group" aria-label={liveDetail.vote.window.prompt}>{#each liveDetail.vote.tally as item}<button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>void castLiveVote(item.moveUci)}>Vote for {item.label} <span aria-hidden="true">· {item.count}</span></button>{/each}</div>{:else}<ul>{#each liveDetail.vote.tally as item}<li>{item.label}: {item.count}</li>{/each}</ul>{/if}{#if liveVoteStatus}<p role="status">{liveVoteStatus}</p>{/if}<p class="honest">{voteAttribution(liveDetail)}</p>{:else}<p>No vote window is open.</p>{/if}
            <h2>Session history</h2>
            <ol>{#each liveJournal as entry}<li>{sessionJournalLabel(entry.kind)} · {journalActorLabel(entry.actorLearnerId)} · {readableDate(entry.at)}</li>{/each}</ol>
          </section>
        </div>
        {#if liveDetail.role==="host"}<section aria-labelledby="invite-title"><h2 id="invite-title">Invitations</h2><aside class="deletion-card" aria-labelledby="watch-link-title"><h3 id="watch-link-title">Invite someone to watch</h3><p>Create a single-use viewer link for this session. The viewer signs in as themselves and cannot move the board.</p><button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>void mintWatchLink()}>Create watch link</button>{#if liveWatchUrl}<p role="status">Watch link: <code>{liveWatchUrl}</code></p><p class="honest">Single use · expires after 14 days · grants spectator access only.</p>{/if}</aside><h3>Invite a participant</h3>{#if liveDetail.session.kind==="match"}<p class="honest">Either player may propose a coaching pause. Rehearsal opens only after the other player accepts; the played main line remains intact.</p>{/if}<div class="row-actions">{#if liveDetail.session.kind==="match"}<label>Leg <select bind:value={liveInviteLeg} disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined}><option value={1}>1</option><option value={2}>2</option></select></label>{/if}<label>Tabiya handle<input bind:value={liveInviteHandle} placeholder="training-partner" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined}/></label><label>External challenge URL<input type="url" bind:value={liveInviteUrl} placeholder="https://lichess.org/…" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined}/></label><button type="button" disabled={(!liveInviteHandle&&!liveInviteUrl)||liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":!liveInviteHandle&&!liveInviteUrl?"invite-disabled":undefined} onclick={()=>void inviteLiveParticipant()}>Create invitation</button></div>{#if !liveInviteHandle&&!liveInviteUrl}<p id="invite-disabled" class="honest">Enter a local handle, an external HTTPS challenge, or both.</p>{/if}<ul>{#each liveDetail.invitations as invitation}<li>{invitation.leg===null?"Session":`Leg ${invitation.leg}`} · {invitation.invitedHandle?`@${invitation.invitedHandle}`:invitation.externalChallengeUrl} · {invitationStateLabel(invitation.state)}</li>{:else}<li>No invitations yet.</li>{/each}</ul></section>{/if}
        {#if liveDetail.session.kind==="match"&&!liveDetail.match}<section aria-labelledby="arena-title"><h2 id="arena-title">Position Arena legs</h2><p class="honest">Import one mainline PGN per leg. Its starting position must exactly match this run.</p>{#if liveDetail.role==="host"}<label>Leg <select bind:value={liveArenaLeg} disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined}><option value={1}>1</option><option value={2}>2</option></select></label><label>PGN<textarea rows="8" bind:value={liveArenaPgn} placeholder={'[SetUp "1"]\n[FEN "…"]\n\n1. …'} disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined}></textarea></label><button type="button" disabled={!liveArenaPgn||!liveWriterId(liveDetail.session.runId)||liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":!liveWriterId(liveDetail.session.runId)?"arena-readonly":undefined} onclick={()=>void importLiveArenaLeg()}>Import leg</button>{#if !liveWriterId(liveDetail.session.runId)}<p id="arena-readonly" class="honest">Open the shared board on this device before importing a leg.</p>{/if}{/if}<ol>{#each liveDetail.legs as leg}<li>Leg {leg.leg}: {arenaLegState(leg.branchId, leg.result)}</li>{/each}</ol></section>{/if}
        {#if liveDetail.session.boardControl==="rotation"&&liveDetail.session.rotation}<section aria-labelledby="rotation-title"><h2 id="rotation-title">Rotation order</h2><ol>{#each liveDetail.session.rotation as learnerId,index}<li><strong>{index===liveDetail.session.rotationCursor?"Current: ":""}</strong>@{liveDetail.grants.find((grant)=>grant.learnerId===learnerId)?.handle??"former member"}</li>{/each}</ol>{#if liveDetail.role==="host"}<button type="button" disabled={!liveWriterId(liveDetail.session.runId)||liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":!liveWriterId(liveDetail.session.runId)?"rotation-readonly":undefined} onclick={()=>void advanceLiveRotation()}>Advance rotation</button>{#if !liveWriterId(liveDetail.session.runId)}<p id="rotation-readonly" class="honest">Open the shared board on this device before advancing the turn.</p>{/if}{/if}</section>{/if}
        {#if liveDetail.role==="host"}
          <section aria-labelledby="session-access-title">
            <h2 id="session-access-title">Session access</h2>
            <p>Grant access before adding someone to a rotation. Participants can propose and hold the board; spectators can watch and vote but cannot move.</p>
            <form class="row-actions" onsubmit={(event)=>{event.preventDefault();void updateLiveMember(liveMemberHandle,{op:"grant",role:liveMemberRole});}}>
              <label>Member handle <input bind:value={liveMemberHandle} placeholder="training-partner" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined}/></label>
              <label>Access <select value={liveMemberRole} disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onchange={(event)=>liveMemberRole=event.currentTarget.value as "participant"|"spectator"}><option value="participant">Participant</option><option value="spectator">Spectator</option></select></label>
              <button type="submit" disabled={!liveMemberHandle.trim()||liveSessionActionBusy!==undefined||!liveWriterId(liveDetail.session.runId)} aria-describedby={!liveWriterId(liveDetail.session.runId)?"member-access-readonly":!liveMemberHandle.trim()?"member-access-handle":liveSessionActionBusy!==undefined?"live-session-action-busy":undefined}>Add or update access</button>
            </form>
            {#if !liveWriterId(liveDetail.session.runId)}<p id="member-access-readonly" class="honest">Open the shared board on this device before changing access.</p>{/if}
            {#if !liveMemberHandle.trim()}<p id="member-access-handle" class="honest">Enter the person's Tabiya handle.</p>{/if}
            <ul aria-label="Session access list">{#each liveDetail.grants as grant}<li>@{grant.handle} — {liveRoleLabel(grant.role)}{#if grant.role!=="host"}<div class="row-actions"><button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>void updateLiveMember(grant.handle,{op:"grant",role:"participant"})}>Make participant</button><button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>void updateLiveMember(grant.handle,{op:"grant",role:"spectator"})}>Make spectator</button><button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>void updateLiveMember(grant.handle,{op:"revoke"})}>Remove access</button></div>{/if}</li>{/each}</ul>
          </section>
        {/if}
        {#if liveDetail.role==="host"&&liveDetail.vote?.window.state==="open"}
          <section aria-labelledby="close-vote-title">
            <h2 id="close-vote-title">Close the vote</h2>
            <p>The tally is advisory. Closing can record which option you used, but it never plays a move.</p>
            <div class="row-actions"><label>Applied option <select value={liveVoteAppliedMove} disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onchange={(event)=>liveVoteAppliedMove=event.currentTarget.value}><option value="">None recorded</option>{#each liveDetail.vote.window.options as option}<option value={option.moveUci}>{option.label}</option>{/each}</select></label><button type="button" disabled={liveSessionActionBusy!==undefined} aria-describedby={liveSessionActionBusy!==undefined?"live-session-action-busy":undefined} onclick={()=>void closeLiveVote()}>{liveSessionActionBusy?.kind==="close-vote"?"Closing…":"Close vote"}</button></div>
          </section>
        {/if}
        {#if liveDetail.role==="host"}
          <section class="audience-output" aria-labelledby="audience-output-title">
            <h2 id="audience-output-title">Audience output</h2>
            <p>The overlay is the spectator-safe board, objective, preserved attempts, marks, and vote tally—never the host's private evidence panels or controls.</p>
            <label>OBS browser-source URL <input readonly value={liveOverlayUrl(liveDetail.session.runId)} onclick={(event)=>event.currentTarget.select()}/></label>
            <div class="row-actions"><button type="button" onclick={()=>void copyLiveOverlayUrl(liveDetail!.session.runId)}>Copy overlay URL</button><button type="button" aria-expanded={liveAudiencePreview} aria-controls="audience-preview" onclick={()=>liveAudiencePreview=!liveAudiencePreview}>{liveAudiencePreview?"Hide audience preview":"See what your audience sees"}</button></div>
            {#if liveOverlayCopyStatus}<p role="status">{liveOverlayCopyStatus}</p>{/if}
            <p class="honest">In OBS, add this URL as a Browser Source, open that source's interaction window, and sign in once inside OBS. The page has a transparent background.</p>
            <p class="honest"><strong>No board delay:</strong> viewers see each move as you commit it. If you are showing a game still being played, set the delay in your streaming software. Vote duration only controls when a poll closes; it does not delay the board.</p>
            {#if liveAudiencePreview}<div id="audience-preview" class="audience-preview"><p><strong>Spectator-safe preview</strong> — this is the same projection the browser source renders.</p><iframe title="Audience overlay preview" src={routePath({name:"live-overlay",runId:liveDetail.session.runId})}></iframe></div>{/if}
          </section>
        {/if}
        <div class="row-actions"><button type="button" onclick={()=>navigate(routePath({name:"run",runId:liveDetail!.session.runId}))}>Open shared board</button><button type="button" onclick={()=>navigate(routePath({name:"live-overlay",runId:liveDetail!.session.runId}))}>Open overlay</button></div>
      {:else}<h1 id="session-title">Session unavailable.</h1>{/if}
    </main>
  {:else if route.name === "live-overlay"}
    <main class="live-overlay" aria-label="Live session overlay">
      {#if session.runState}
        {@const node=session.runState.run.nodes.find((candidate)=>candidate.id===session.runState!.run.activeCursor.nodeId)}
        {#if node}
          {@const objective=liveOverlayObjectiveCopy(session.pack,node.objectiveState)}
          {@const attribution=activeLiveDetail===undefined?"":markAttribution(activeLiveDetail)}
          <Chessboard fen={node.fen} startSide={session.runState.run.start.side} overlays={relayedMarkShapes(activeLiveDetail)} describedBy={attribution?"live-overlay-mark-attribution":undefined} disabled={true} onMove={()=>{}}/>
          <aside>
            <p class="eyebrow">Tabiya live</p>
            <h1>{objective.headline}</h1>
            <p>{objective.status} · {session.runState.run.branches.length} {session.runState.run.branches.length===1?"preserved attempt":"preserved attempts"}</p>
            {#if attribution}<p id="live-overlay-mark-attribution">{attribution}</p>{/if}
            {#if activeLiveDetail?.vote}<p>{activeLiveDetail.vote.window.prompt}</p><ul>{#each activeLiveDetail.vote.tally as item}<li>{item.label}: {item.count}</li>{/each}</ul><p>{voteAttribution(activeLiveDetail)}</p>{/if}
            {#if session.runState.withheld}<p>Host is ahead; evidence is withheld until this run discloses.</p>{/if}
          </aside>
        {/if}
      {:else}<p role="alert">Overlay run unavailable.</p>{/if}
    </main>
  {:else if route.name === "rating"}
    <RatingScreen {api} onStart={startRatedGame} />
  {:else if route.name === "library"}
    <main class="shell-view" aria-labelledby="library-title">
      <p class="eyebrow">Library</p><h1 id="library-title">Packs and run artifacts</h1>
      <section><h2>Rehearsal packs</h2><ul>{#each packs as pack}<li>{pack.title} <small>{pack.reviewStatus.replaceAll("_", " ")}</small></li>{:else}<li>No packs available.</li>{/each}</ul></section>
      <section><h2>My games</h2>
        <p>Download a game as standard PGN for chess tools, or open it to choose particular branches.</p>
        <p class="honest">Deleting a run removes Tabiya's live copy immediately. Shared runs may remain as read-only history for collaborators, and deployment backups may retain an older copy until their configured retention period ends.</p>
        <ul>{#each runs as run}<li><button class="link-button" type="button" onclick={() => navigate(routePath({ name: "run", runId: run.id }))}>{runTitle(run)}</button> <small>{run.branchCount} branches</small> <button type="button" disabled={runArtifactBusyId !== undefined} aria-describedby={runArtifactBusyId !== undefined ? "library-artifact-busy" : undefined} onclick={() => void exportRunPgn(run.id)}>{runArtifactBusyId === run.id ? "Preparing PGN…" : "Download PGN"}</button> {#if run.viewerRole === "host"}<button type="button" disabled={runDeletionBusy !== undefined} aria-describedby={runDeletionBusy !== undefined ? "library-deletion-busy" : undefined} onclick={() => void reviewRunDeletion(run)}>Delete this run</button>{/if}</li>{:else}<li>No saved games yet.</li>{/each}</ul>
        {#if runArtifactBusyId !== undefined}<p id="library-artifact-busy" role="status">Preparing one game download.</p>{/if}
        {#if runDeletionBusy !== undefined}<p id="library-deletion-busy" role="status">{runDeletionBusy.kind === "preview" ? "Loading the deletion effects…" : "Deleting this game…"}</p>{/if}
        {#if runSelection.shown<runSelection.total}<p id="library-run-budget" class="honest">Showing {runSelection.shown} of {runSelection.total} saved games and rehearsals.</p><button type="button" disabled={runPageBusy} aria-describedby="library-run-budget" onclick={()=>void loadMoreRuns()}>{runPageBusy?"Loading…":"Load more"}</button>{/if}
        {#if runPageError}<p role="alert">{runPageError}</p>{/if}
        {#if runArtifactError}<p role="alert">{runArtifactError.text}</p>{/if}
        {#if runDeletion}
          <aside class="deletion-card">
            <StatusAnnouncement message={`Deletion effects loaded for ${runTitle(runDeletion.run)}. Review the listed permanent, retained, and revoked records before confirming.`} />
            <h3>Delete {runTitle(runDeletion.run)}?</h3>
            {#each runDeletion.preview.hardDelete as effect}<p>{effect.label}</p>{/each}
            {#each runDeletion.preview.tombstone as effect}<p>{effect.label}</p>{/each}
            {#each runDeletion.preview.revoke as effect}<p>{effect.label}</p>{/each}
            <p class="honest">{runDeletion.preview.backupNotice}</p>
            <div class="row-actions"><button type="button" disabled={runDeletionBusy !== undefined} aria-describedby={runDeletionBusy !== undefined ? "library-deletion-busy" : undefined} onclick={() => void confirmRunDeletion()}>{runDeletionBusy?.kind === "confirm" ? "Deleting…" : "Confirm deletion"}</button><button type="button" disabled={runDeletionBusy !== undefined} aria-describedby={runDeletionBusy !== undefined ? "library-deletion-busy" : undefined} onclick={cancelRunDeletion}>Cancel</button></div>
          </aside>
        {/if}
        {#if runDeletionError}<p role="alert">{runDeletionError}</p>{/if}
      </section>
    </main>
  {:else if route.name === "settings"}
    <main class="shell-view" aria-labelledby="settings-title">
      <p class="eyebrow">Preferences and account</p><h1 id="settings-title">Settings</h1>
      <nav class="settings-toc" aria-label="Settings sections"><a href="#appearance-settings">Appearance</a><a href="#playing-settings">Playing</a>{#if learner}<a href="#account-settings">Account</a>{/if}<a href="#about-deployment">About</a></nav>
      <AppearanceSettings />
      <AssistanceSettings {capabilities} {learner} plannedSurfaceIds={PLANNED_SURFACES as readonly SurfaceId[]} onSignOut={signOut} onExport={exportAccountWithPassword} loadDeletionPreview={() => api.accountDeletionPreview?.() ?? Promise.reject(new Error("Deletion preview is unavailable."))} onDelete={deleteAccountWithPassword} />
    </main>
  {:else if route.name === "not-found"}
    <main class="shell-view empty-state" aria-labelledby="not-found-title">
      <p class="eyebrow">404</p><h1 id="not-found-title">This route is not part of Tabiya.</h1>
      <p>{route.pathname}</p><button type="button" onclick={() => navigate("/")}>Return home</button>
    </main>
  {:else}
    <main class="shell-view"><p role="alert">The route could not be rendered.</p></main>
  {/if}
</ShellFrame>
{/if}

{#if shellHelpOpen}<ShellKeyboardHelp onClose={closeShellHelp} />{/if}

<style>
  :global(*) { box-sizing: border-box; }
  :global(:root) {
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: var(--ink);
    background: var(--paper);
  }
  :global(html), :global(body), :global(#app) { height: 100%; overflow: hidden; }
  :global(body) {
    min-width: 20rem;
    min-height: 100vh;
    margin: 0;
    background: radial-gradient(circle at 12% 5%, color-mix(in srgb, var(--ink) 5%, transparent), transparent 30rem), linear-gradient(135deg, transparent 0 58%, color-mix(in srgb, var(--accent) 4%, transparent) 58% 100%), var(--paper);
  }
  .shell-view { width: min(70rem, calc(100% - 2rem)); height: 100%; margin: 0 auto; padding: clamp(2rem, 6vw, 5rem) 0; overflow: auto; }
  .play-surface{height:100%;overflow:auto;padding:1rem 0}.surface-skip{position:fixed;z-index:50;top:.35rem;left:.35rem;padding:.6rem .8rem;border-radius:.5rem;background:var(--ink);color:var(--paper);transform:translateY(-150%)}.surface-skip:focus{transform:translateY(0)}
  .public-landing { height: 100%; overflow: auto; }
  .public-hero { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(15rem, .6fr); gap: 1.5rem 3rem; width: min(76rem, calc(100% - 2rem)); margin: 0 auto; padding: clamp(3rem, 8vw, 7rem) 0 2rem; }
  .public-hero > div { max-width: 52rem; }
  .public-hero h1 { max-width: 15ch; margin: .5rem 0 1rem; font: 500 clamp(2.7rem, 7vw, 6.5rem)/.92 var(--display-font); letter-spacing: -.055em; }
  .public-hero > div > p:last-child { max-width: 42rem; color: var(--muted); font-size: 1.08rem; line-height: 1.55; }
  .public-hero ol { align-self: end; display: grid; gap: .65rem; margin: 0; padding: 0; list-style: none; }
  .public-hero li { display: flex; gap: .75rem; padding-top: .65rem; border-top: 1px solid var(--line); }
  .public-hero li span { color: var(--accent); font: 700 .7rem ui-monospace, monospace; }
  .public-boundary { grid-column: 1; max-width: 44rem; margin: 0; padding: 1rem; border-left: 3px solid var(--accent); background: var(--panel); color: var(--muted); }
  .public-boundary strong { display: block; color: var(--ink); }
  .browse-link { align-self: center; justify-self: start; color: var(--ink); font-weight: 700; }
  .auth-gate { width: min(76rem, calc(100% - 2rem)); margin: 2rem auto; padding: clamp(1.2rem, 4vw, 2rem); border: 1px solid var(--line); border-radius: 1rem; background: var(--panel); box-shadow: var(--shadow); }
  .auth-gate h2 { max-width: 18ch; margin: .35rem 0 0; font: 500 clamp(1.7rem, 4vw, 3rem)/1 var(--display-font); }
  .auth-gate form { display: grid; gap: 1rem; margin: 2rem 0 1rem; }
  .auth-gate label { display: grid; gap: 0.35rem; }
  .auth-gate input { padding: 0.7rem; border: 1px solid var(--line); border-radius: 0.5rem; }
  .auth-notice { max-width: 44rem; color: var(--ink); }
  .public-landing :global(#position-catalogue) { height: auto; min-height: 100%; overflow: visible; }
  .claim-banner { position: fixed; z-index: 20; top: 4rem; right: 1rem; display: flex; gap: 0.7rem; align-items: center; padding: 0.6rem; background: var(--panel); border: 1px solid var(--line); border-radius: 0.7rem; }
  .session-banner { position: fixed; z-index: 21; right: 1rem; bottom: 1rem; display: grid; gap: 0.25rem; padding: 0.7rem; max-width: 18rem; border: 1px solid var(--line); border-radius: 0.7rem; background: var(--panel); box-shadow: var(--shadow); font-size: 0.8rem; }
  .shell-view > h1 { max-width: 18ch; margin: 0.4rem 0 1rem; font: 500 clamp(2.3rem, 6vw, 5rem)/0.96 var(--display-font); letter-spacing: -0.045em; }
  .eyebrow { color: var(--accent); font: 700 0.72rem/1.2 ui-monospace, monospace; letter-spacing: 0.12em; text-transform: uppercase; }
  .settings-toc { position: sticky; z-index: 2; top: 0; display: flex; flex-wrap: wrap; gap: .45rem; padding: .65rem; border: 1px solid var(--line); border-radius: .75rem; background: color-mix(in srgb, var(--panel) 92%, transparent); backdrop-filter: blur(.5rem); }
  .settings-toc a { padding: .45rem .65rem; border-radius: .5rem; color: var(--ink); text-decoration: none; }
  .settings-toc a:hover, .settings-toc a:focus-visible { background: var(--accent-soft); }
  .home > h1 { max-width: 15ch; }
  .home-lede { max-width: 42rem; color: var(--muted); font-size: 1.1rem; }
  .resume-card, .start-card { max-width: 42rem; margin: 2.5rem 0 1rem; padding: 1.4rem; border: 1px solid var(--line); border-radius: 1rem; background: var(--panel); box-shadow: var(--shadow); }
  .start-card h2 { margin: .3rem 0 .6rem; font: 500 clamp(1.4rem, 3vw, 2rem) var(--display-font); }
  .resume-card h2, .item-list h2 { margin: 0.2rem 0; font: 500 1.5rem var(--display-font); }
  .resume-card p, .item-list p { color: var(--muted); }
  .home-status { display: grid; grid-template-columns: minmax(14rem, 1fr) auto auto; gap: 1rem; align-items: end; margin-top: 2rem; padding: 1rem 0; border-block: 1px solid var(--line); }
  .home-status h2, .phase-starters h2 { margin: .2rem 0; font: 500 1.5rem var(--display-font); }
  .home-status p { margin: 0; }
  .home-status strong { font: 500 2rem var(--display-font); }
  .how-it-works { margin: 3rem 0; padding: clamp(1.1rem, 3vw, 1.8rem); border: 1px solid var(--line); border-radius: 1rem; background: color-mix(in srgb, var(--panel) 88%, transparent); }
  .how-it-works-heading { max-width: 43rem; }
  .how-it-works-heading h2 { margin: .25rem 0 .6rem; font: 500 clamp(1.7rem, 4vw, 2.6rem) var(--display-font); }
  .how-it-works-heading > p:last-child, .rehearsal-loop p, .evidence-promise > p { color: var(--muted); }
  .rehearsal-loop { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; margin: 1.6rem 0; padding: 0; list-style: none; }
  .rehearsal-loop li { padding: .85rem 0 0; border-top: 2px solid var(--accent); }
  .rehearsal-loop span { color: var(--accent); font: 700 .7rem ui-monospace, monospace; letter-spacing: .1em; }
  .rehearsal-loop h3 { margin: .65rem 0 .35rem; font: 500 1.1rem var(--display-font); }
  .rehearsal-loop p { margin: 0; font-size: .85rem; line-height: 1.5; }
  .evidence-promise { display: grid; grid-template-columns: minmax(15rem, .8fr) minmax(18rem, 1.2fr); gap: 1rem; align-items: end; padding-top: 1rem; border-top: 1px solid var(--line); }
  .evidence-promise h3 { margin: .2rem 0 0; font: 500 1.25rem var(--display-font); }
  .evidence-promise > p { margin: 0; line-height: 1.55; }
  .phase-starters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; margin: 2rem 0 1rem; }
  .phase-starters > div { grid-column: 1 / -1; }
  .phase-starters article { display: flex; flex-direction: column; min-height: 15rem; padding: 1rem; border: 1px solid var(--line); border-radius: .9rem; background: var(--panel); }
  .phase-starters article > span { color: var(--accent); font: 700 .7rem ui-monospace, monospace; text-transform: uppercase; }
  .phase-starters h3 { margin: .75rem 0 .4rem; font: 500 1.25rem var(--display-font); }
  .phase-starters article p { color: var(--muted); font-size: .85rem; }
  .phase-starters article button { margin-top: auto; }
  @media (max-width: 60rem) { .rehearsal-loop { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 45rem) { .home-status, .phase-starters, .rehearsal-loop, .evidence-promise { grid-template-columns: 1fr; } .phase-starters > div { grid-column: 1; } }
  @media (max-width: 50rem) { .public-hero { grid-template-columns: 1fr; } .public-boundary { grid-column: 1; } }
  .repertoire-form{display:grid;gap:.65rem;max-width:44rem;padding:1rem;border:1px solid var(--line);border-radius:.8rem;background:var(--panel)}
  .repertoire-form label{display:grid;gap:.25rem}.repertoire-form input,.repertoire-form select,.repertoire-form textarea{padding:.6rem;border:1px solid var(--line);border-radius:.4rem;background:var(--paper);color:var(--ink)}
  .repertoire-card{display:grid;gap:.6rem}.gap-results{grid-column:1/-1;border-top:1px solid var(--line);padding-top:.6rem}.gap-row{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:.6rem 0}.gap-answer,.recommendation-actions{display:flex;flex-wrap:wrap;align-items:center;gap:.45rem;margin-top:.5rem}.gap-answer strong{color:var(--accent)}
  .access, .honest { font-size: 0.88rem; }
  button { padding: 0.72rem 0.9rem; border: 1px solid var(--line); border-radius: 0.65rem; background: var(--panel); color: var(--ink); cursor: pointer; }
  button:hover, button:focus-visible, button.primary { border-color: var(--accent); background: var(--accent); color: var(--on-accent); }
  button:disabled { cursor: not-allowed; opacity: 0.55; }
  .item-list { display: grid; gap: 0.7rem; max-height: min(55dvh, 36rem); margin-top: 2rem; overflow: auto; }
  .item-list article { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem; border: 1px solid var(--line); border-radius: 0.8rem; background: var(--panel); }
  .item-list article.recorded-attempt { display: grid; align-items: stretch; }
  .assignment-grid { max-height: none; overflow: visible; }
  .assignment-grid article { display: grid; grid-template-columns: minmax(0, 1fr) minmax(16rem, 1fr); align-items: start; }
  .assignment-grid h5 { margin: 0.2rem 0; font: 500 1.15rem var(--display-font); }
  .assignment-grid ul { margin: 0; padding-inline-start: 1.2rem; }
  .submission-record { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--line); }
  .submission-record p { margin: 0.35rem 0; }
  .recorded-attempt-header, .related-attempts li { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .recorded-attempt-header > div:first-child, .related-attempts span { min-width: 0; }
  .related-attempts { display: grid; gap: 0.5rem; margin: 0; padding: 0.75rem 0 0; border-top: 1px solid var(--line); list-style: none; }
  .related-attempts li + li { padding-top: 0.5rem; border-top: 1px solid var(--line); }
  .live-wall { grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); }
  .live-wall article { display: grid; grid-template-columns: 7rem minmax(0, 1fr) auto; }
  .mini-board { inline-size: 7rem; block-size: 7rem; overflow: hidden; }
  .import-game { display: grid; gap: 0.65rem; max-width: 48rem; margin: 1.5rem 0; padding: 1rem; border: 1px solid var(--line); border-radius: 0.8rem; background: var(--panel); }
  .import-game label { display: grid; gap: 0.3rem; }
  .import-game input, .import-game textarea { width: 100%; padding: 0.65rem; border: 1px solid var(--line); border-radius: 0.5rem; }
  .row-actions { display: flex; gap: 0.5rem; }
  .deletion-card { margin-top: 1rem; padding: 1rem; max-width: 42rem; border: 1px solid var(--line); border-radius: 0.8rem; background: var(--panel); }
  .consent-card { margin-top: 1rem; padding: 1rem; max-width: 42rem; border: 2px solid var(--accent); border-radius: 0.8rem; background: var(--panel); box-shadow: var(--shadow); }
  .consent-card h3 { margin-top: 0; }
  .row-actions label { display: grid; gap: 0.25rem; }
  select { padding: 0.65rem; border: 1px solid var(--line); border-radius: 0.55rem; background: var(--panel); }
  .live-overlay { width: 100%; height: 100%; display: grid; grid-template-columns: minmax(0, min(75vh, 70vw)) minmax(12rem, 1fr); gap: 1.5rem; align-items: center; padding: 1rem; overflow: hidden; background: transparent; }
  .live-overlay aside { padding: 1rem; border-radius: 0.8rem; background: var(--scrim-strong); color: var(--paper); }
  .audience-output > label { display: grid; gap: 0.35rem; }
  .audience-output input { width: 100%; }
  .audience-preview { margin-top: 1rem; padding: 0.75rem; border: 1px solid var(--line); border-radius: 0.8rem; background: var(--panel); }
  .audience-preview iframe { display: block; width: 100%; min-height: min(38rem, 72vh); border: 0; border-radius: 0.6rem; background: transparent; }
  .studio-grid { display: grid; grid-template-columns: minmax(12rem, 18rem) minmax(0, 1fr); gap: 1rem; }
  .resume-drafts { display: grid; gap: .6rem; margin-block: 1rem; padding-block: 1rem; border-block: 1px solid var(--line); }
  .resume-drafts h2, #pack-studio-editor > h2 { margin: 0; font: 600 1.25rem var(--display-font); }
  #pack-studio-editor { scroll-margin-top: 1rem; }
  .pack-studio-grid { grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr) minmax(16rem, 22rem); }
  .studio-grid aside { display: grid; align-content: start; gap: 0.5rem; overflow: auto; }
  .studio-grid section { display: grid; gap: 0.5rem; min-width: 0; }
  .shape-editor-fields { display: grid; gap: 0.5rem; min-width: 0; margin: 0; padding: 0; border: 0; }
  .shape-editor-fields > legend { font-weight: 700; margin-bottom: 0.25rem; }
  .studio-grid textarea { width: 100%; min-height: 42vh; padding: 0.8rem; font: 0.8rem/1.4 ui-monospace, monospace; }
  .validation-summary, .validation-sections > section { padding: 0.8rem; border: 1px solid var(--line); border-radius: 0.65rem; background: var(--panel); }
  .validation-summary h3, .validation-sections h3 { margin: 0; font: 600 1rem var(--display-font); }
  .validation-summary ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 0.3rem 0.8rem; margin: 0; padding: 0; list-style: none; }
  .validation-summary li { color: var(--muted); }
  .validation-summary li.missing { color: var(--danger); }
  .validation-sections { display: grid; gap: 0.6rem; }
  .validation-sections ul { margin: 0; padding-inline-start: 1.2rem; }
  .graduation-column { max-height: min(72dvh, 52rem); padding: 0.8rem; border: 1px solid var(--line); border-radius: 0.8rem; background: var(--panel); }
  .graduation-column h2 { margin: 0; font: 600 1.2rem var(--display-font); }
  .shape-corpus-preview { margin-block: 0.8rem; padding: 0.8rem; border: 1px solid var(--line); border-radius: 0.8rem; background: var(--panel); }
  .shape-corpus-preview h3, .shape-corpus-preview h4, .shape-corpus-preview p { margin-block: 0; }
  .shape-corpus-results { display: grid; grid-template-columns: minmax(12rem, 1fr) minmax(14rem, 1fr); gap: 0.8rem; align-items: start; }
  .shape-corpus-results ul { max-height: 22rem; margin: 0; padding: 0; overflow: auto; list-style: none; }
  .shape-corpus-results li { margin: 0; }
  .shape-corpus-results li + li { margin-top: 0.35rem; }
  .shape-corpus-results li button { width: 100%; text-align: left; }
  .shape-corpus-results li button.active { border-color: var(--accent); background: var(--accent-soft); color: var(--ink); }
  .shape-corpus-results article { display: grid; gap: 0.45rem; min-width: 0; }
  .shape-corpus-board { width: min(100%, 24rem); aspect-ratio: 1; }
  .vocabulary-status { margin-block: 1rem; padding: 1rem; border: 1px solid var(--line); border-radius: 0.8rem; background: var(--panel); }
  .vocabulary-status > h2, .vocabulary-status h3 { margin: 0; }
  .vocabulary-status-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
  .vocabulary-status-grid section { min-width: 0; }
  .vocabulary-status-grid ul { margin-bottom: 0; padding-left: 1.2rem; overflow-wrap: anywhere; }
  .graduation-list { display: grid; gap: 0.6rem; margin: 0; padding: 0; list-style: none; }
  .graduation-list li { display: grid; gap: 0.25rem; padding: 0.65rem; border: 1px solid var(--line); border-radius: 0.55rem; }
  .graduation-list li.blocking { border-color: var(--danger); }
  .graduation-list span { color: var(--muted); font: 700 0.68rem/1.2 ui-monospace, monospace; letter-spacing: 0.08em; text-transform: uppercase; }
  .graduation-list li.blocking span { color: var(--danger); }
  .graduation-list code, .graduation-list p { overflow-wrap: anywhere; }
  .graduation-list p { margin: 0; }
  .empty-state p { max-width: 42rem; color: var(--muted); font-size: 1.05rem; }
  section + section { margin-top: 2rem; }
  li { margin: 0.45rem 0; }
  small { color: var(--muted); }
  .link-button { padding: 0; border: 0; background: transparent; color: var(--accent); }
  .link-button:hover, .link-button:focus-visible { background: transparent; color: var(--ink); }
  @media (max-width: 719px) {
    :global(#app) { position: fixed; inset: 0; }
    .shell-view { width: min(100% - 1rem, 70rem); padding: 1rem 0; }
    .live-wall { grid-template-columns: 1fr; }
    .live-wall article { grid-template-columns: 5rem minmax(0, 1fr); }
    .live-wall article > button { grid-column: 1 / -1; }
    .mini-board { inline-size: 5rem; block-size: 5rem; }
    .studio-grid, .vocabulary-status-grid, .live-overlay, .shape-corpus-results { grid-template-columns: 1fr; }
    .assignment-grid article { grid-template-columns: 1fr; }
    .live-overlay :global(.board-shell) { width: calc(100% - 1rem); justify-self: center; }
    .row-actions { flex-wrap: wrap; }
  }
</style>
