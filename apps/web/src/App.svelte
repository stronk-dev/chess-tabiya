<script lang="ts">
  import "./lib/theme/base.css";

  import { onDestroy, onMount, tick, untrack } from "svelte";
  import { DRILL_PACK_SCHEMA_VERSION } from "@chess-tabiya/schema";

  import DrillScreen from "./lib/DrillScreen.svelte";
  import Chessboard from "./lib/Chessboard.svelte";
  import PackList from "./lib/PackList.svelte";
  import JustPlayStarter from "./lib/JustPlayStarter.svelte";
  import GameStoryScreen from "./lib/GameStoryScreen.svelte";
  import { attemptVerdictLabel, corpusPopulationLabel } from "./lib/learner-copy.js";
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
  import { ThemeController } from "./lib/theme/controller.js";
  import { provideTheme } from "./lib/theme/context.js";
  import {
    DrillApi,
    PLANNED_SURFACES,
    type Capabilities,
    type DrillClientApi,
    type PackSummary,
    type RunSummary,
    type SurfaceId,
    type Learner,
    type ProgressAttempt,
    type ProgressSchedule,
    type RelatedProgressAttempt,
    type PackDraft,
    type PackValidation,
    type ShapeDraft,
    type ShapeSummary,
    type PrincipleSummary,
    type LiveSessionSummary,
    type LiveSessionDetail,
    type SessionJournalEntry,
    type SessionKind,
    type BoardControl,
    type GameStory,
    type ProgressMilestone,
    type RunDerivationPage,
    type RepertoireSummary,
    type RepertoireGapPage,
    type ProgressRecommendation,
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
  import { voteAttribution } from "./lib/live-vote.js";
  import { markAttribution, relayedMarkShapes } from "./lib/live-marks.js";
  import { clearAccountLocalData, clearRunLocalData } from "./lib/account-local-data.js";
  import { graduationEntries, requiredFieldStates, splitValidationIssues } from "./lib/pack-validation-presentation.js";

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
  function firstRehearsalStorage(): KeyValueStorage | undefined {
    if (storage !== undefined) return storage;
    try { return globalThis.localStorage; } catch { return undefined; }
  }
  function storedFirstRehearsalRunId(): string | undefined {
    const value = firstRehearsalStorage()?.getItem(FIRST_REHEARSAL_RUN_KEY);
    return value === null || value === undefined || value === "" ? undefined : value;
  }
  let firstRehearsalRunId: string | undefined = $state(storedFirstRehearsalRunId());
  let startingFirstRehearsal = false;
  const themeController = provideTheme(new ThemeController(storage));
  const MIN_LIVE_VOTE_OPTIONS = 2;
  const MAX_LIVE_VOTE_OPTIONS = 8;
  const MIN_LIVE_VOTE_SECONDS = 15;
  const MAX_LIVE_VOTE_SECONDS = 600;

  const controller = new DrillSessionController(api, {
    ...(storage === undefined ? {} : { storage }),
    onRunStarted: ({ runId }) => {
      if (startingFirstRehearsal) {
        firstRehearsalRunId = runId;
        firstRehearsalStorage()?.setItem(FIRST_REHEARSAL_RUN_KEY, runId);
      }
      router.navigate(routePath({ name: "run", runId }));
    },
  });
  let route: AppRoute = $state(router.route);
  let session: DrillSessionState = $state(controller.state);
  let packs: readonly PackSummary[] = $state([]);
  let runs: readonly RunSummary[] = $state([]);
  let runDeletion = $state<{ readonly run: RunSummary; readonly preview: DeletionPreview } | undefined>();
  let runDeletionError = $state<string | undefined>();
  let runArtifactError = $state<string | undefined>();
  let attempts: readonly ProgressAttempt[] = $state([]);
  let dueSchedules: readonly ProgressSchedule[] = $state([]);
  let milestones: readonly ProgressMilestone[] = $state([]);
  let derivations: RunDerivationPage | undefined = $state();
  let drafts: readonly PackDraft[] = $state([]);
  let studioJson = $state("");
  let selectedDraftId: string | undefined = $state();
  let studioActionError: string | undefined = $state();
  let packBufferValidation: PackValidation | undefined = $state();
  let packLintState: "idle" | "waiting" | "checking" | "ready" | "invalid_json" | "error" | "unavailable" = $state("idle");
  let packLintError: string | undefined = $state();
  let packLintGeneration = 0;
  let withdrawConfirmId: string | undefined = $state();
  let shapeDrafts: readonly ShapeDraft[] = $state([]);
  let authoringShapes: readonly ShapeSummary[] = $state([]);
  let authoringPrinciples: readonly PrincipleSummary[] = $state([]);
  let shapeStudioJson = $state("");
  let selectedShapeDraftId: string | undefined = $state();
  let shapeProbeFen = $state("");
  let shapeProbeResult: boolean | undefined = $state();
  let shapeActionError: string | undefined = $state();
  let distillDraftRunId: string | undefined = $state();
  let distillDraftBusy = $state(false);
  let distillDraftError: string | undefined = $state();
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
  let liveDetail: LiveSessionDetail | undefined = $state();
  let activeLiveDetail: LiveSessionDetail | undefined = $state();
  let liveJournal: readonly SessionJournalEntry[] = $state([]);
  let liveKind: SessionKind = $state("academy");
  let liveBoardControl: BoardControl = $state("host_directed");
  let liveClassroomId = $state("");
  let liveScheduledFor = $state("");
  let liveProposalMove = $state("");
  let liveProposalError: string | undefined = $state();
  let liveOfferHandle = $state("");
  let liveVotePrompt = $state("Which continuation?");
  let liveVoteDuration = $state(60);
  let liveVoteOptions = $state([{ moveUci: "", label: "" }, { moveUci: "", label: "" }]);
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
  let importPgn = $state("");
  let importUrl = $state("");
  let importSide: "white" | "black" = $state("white");
  let importError: string | undefined = $state();
  let story: GameStory | undefined = $state();
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
  let routerStarted = false;
  const onUnauthenticated = (): void => {
    controller.stopSession();
    learner = undefined;
    router.stop();
    routerStarted = false;
  };
  let shellHelpReturnFocus: HTMLElement | undefined;
  let unsubscribeController: (() => void) | undefined;
  let unsubscribeRouter: (() => void) | undefined;
  let loadGeneration = 0;
  let livePoll: ReturnType<typeof setInterval> | undefined;
  let storyPoll: ReturnType<typeof setInterval> | undefined;
  let autoClaimingMatch = false;
  let repertoires:readonly RepertoireSummary[]=$state([]);
  let repertoirePages:Record<string,RepertoireGapPage>=$state({});
  let repertoireName=$state("");
  let repertoireSide:"white"|"black"=$state("black");
  let repertoirePgn=$state("");
  let repertoireStudyUrl=$state("");
  let repertoireError:string|undefined=$state();
  let recommendations:readonly ProgressRecommendation[]=$state([]);
  let relatedAttempts: Record<string, { readonly status: "loading" | "loaded" | "error"; readonly items: readonly RelatedProgressAttempt[]; readonly message?: string }> = $state({});

  const keyboardDispatcher = new ShellKeyboardDispatcher({
    navigate,
    focusPrimaryNavigation,
    openHelp: openShellHelp,
    closeHelp: closeShellHelp,
    helpIsOpen: () => shellHelpOpen,
  });

  let recentRun = $derived(runs[0]);
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
    firstRehearsalStorage()?.setItem(FIRST_REHEARSAL_RUN_KEY, "");
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

  function packTitle(packId:string):string{return packs.find((pack)=>pack.id===packId)?.title??packId;}
  function isOverdue(dueAt:string|null):boolean{return dueAt!==null&&Date.parse(dueAt)<Date.now();}
  function classroomMemberHandle(learnerId:string):string{return classroomDetail?.members.find((member)=>member.learnerId===learnerId)?.handle??"former member";}
  function assignmentSubmissions(assignmentId:string,learnerId:string){return classroomDetail?.submissions.filter((submission)=>submission.assignmentId===assignmentId&&submission.learnerId===learnerId)??[];}
  function chooseAssignmentRun(assignmentId:string,runId:string):void{assignmentRunSelection={...assignmentRunSelection,[assignmentId]:runId};}
  function prepareAssignedRun(assignmentId:string):void{const runId=assignmentRunSelection[assignmentId];if(runId)submissionIntent={assignmentId,runId};}
  async function confirmAssignedRun():Promise<void>{if(!submissionIntent)return;await submitAssignedRun(submissionIntent.assignmentId,submissionIntent.runId);submissionIntent=undefined;}
  function reviewRailCopy(state: NonNullable<typeof session.viewer>["reviewRail"]): string {
    if (state === "open") return "This submitted attempt is complete. You receive the same disclosed evidence, human-model split, corpus and narration rail as its learner.";
    if (state === "closed_incomplete") return "Review tools open after this attempt reaches its recorded outcome. Read access remains available now.";
    if (state === "closed_live_session") return "Review tools are closed while this run has an open live session. Read access remains available; close the session to restore the submitted review rail.";
    if (state === "closed_shared_not_submitted") return "This run was shared directly, not submitted through an assignment. Read access is available, but the human-model split, corpus and narration review tools are not granted.";
    return "";
  }

  function relatedAttemptKey(attempt: ProgressAttempt): string {
    return `${attempt.runId}\0${attempt.branchId}`;
  }

  function relatedAttemptLabel(relation: RelatedProgressAttempt["relation"]): string {
    if (relation === "same_position") return "Same position";
    if (relation === "same_pack") return "Same pack, different position";
    return "Same idea in this pack";
  }

  async function toggleRelatedAttempts(attempt: ProgressAttempt): Promise<void> {
    const key = relatedAttemptKey(attempt);
    if (relatedAttempts[key] !== undefined) {
      const { [key]: _closed, ...remaining } = relatedAttempts;
      relatedAttempts = remaining;
      return;
    }
    relatedAttempts = { ...relatedAttempts, [key]: { status: "loading", items: [] } };
    try {
      if (api.relatedProgress === undefined) throw new Error("Related attempts are unavailable");
      const graph = await api.graph(attempt.runId);
      const branch = graph.branches.find((candidate) => candidate.id === attempt.branchId);
      if (branch === undefined) throw new Error("The recorded branch is no longer available");
      const items = await api.relatedProgress(attempt.runId, branch.forkNodeId);
      relatedAttempts = { ...relatedAttempts, [key]: { status: "loaded", items } };
    } catch (error) {
      relatedAttempts = {
        ...relatedAttempts,
        [key]: { status: "error", items: [], message: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  async function loadRoute(next: AppRoute): Promise<void> {
    const generation = ++loadGeneration;
    routeLoading = true;
    routeError = undefined;
    if (
      next.name !== "run" ||
      session.runState?.run.id !== next.runId
    ) {
      controller.stopSession();
    }
    try {
      if (next.name === "home") {
        [runs, packs, dueSchedules, assignedPacks] = await Promise.all([
          api.runs(50, 0),
          api.packs(),
          api.dueProgress?.() ?? Promise.resolve([]),
          api.assignments?.() ?? Promise.resolve([]),
        ]);
      } else if (next.name === "review") {
        runs = await api.runs(50, 0);
      } else if (next.name === "story") {
        const loaded = await Promise.all([refreshStory(next.runId, true), api.capabilities()]);
        capabilities = loaded[1];
      } else if (next.name === "play") {
        packs = await api.packs();
      } else if (next.name === "library") {
        [packs, runs] = await Promise.all([api.packs(), api.runs(50, 0)]);
      } else if (next.name === "settings") {
        capabilities = await api.capabilities();
      } else if (next.name === "learn") {
        relatedAttempts = {};
        [attempts, dueSchedules, milestones, repertoires, recommendations, assignedPacks, runs, packs] = await Promise.all([
          api.progress?.() ?? Promise.resolve([]),
          api.dueProgress?.() ?? Promise.resolve([]),
          api.milestones?.() ?? Promise.resolve([]),
          api.repertoires?.() ?? Promise.resolve([]),
          api.recommendations?.() ?? Promise.resolve([]),
          api.assignments?.() ?? Promise.resolve([]),
          api.runs(50, 0),
          api.packs(),
        ]);
        const pages=await Promise.all(repertoires.map(async(item)=>[item.id,await api.repertoireGaps?.(item.id)] as const));repertoirePages=Object.fromEntries(pages.filter((entry)=>entry[1]!==undefined)) as Record<string,RepertoireGapPage>;
      } else if (next.name === "create") {
        [drafts, shapeDrafts, authoringShapes, authoringPrinciples, capabilities] = await Promise.all([
          api.packDrafts?.() ?? Promise.resolve([]),
          api.shapeDrafts?.() ?? Promise.resolve([]),
          api.shapes(),
          api.principles?.() ?? Promise.resolve([]),
          api.capabilities(),
        ]);
      } else if (next.name === "live") {
        [liveSessions,runs,classrooms,packs]=await Promise.all([api.liveSessions?.()??Promise.resolve([]),api.runs(50,0),api.classrooms?.()??Promise.resolve([]),api.packs()]);
      } else if (next.name === "live-session") {
        [liveDetail,liveJournal]=await Promise.all([api.liveSession?.(next.sessionId),api.sessionJournal?.(next.sessionId).then((page)=>page.entries)??Promise.resolve([])]);
      } else if (next.name === "live-overlay") {
        const related=(await (api.liveSessions?.()??Promise.resolve([]))).find((item)=>item.runId===next.runId);
        activeLiveDetail=related===undefined?undefined:await api.liveSession?.(related.id);
        const matchMode=activeLiveDetail?.match===undefined?undefined:activeLiveDetail.match.pausedAt===null?"live":"paused";
        await controller.resume(next.runId,{projectionOnly:true,...(matchMode===undefined?{}:{matchMode})});
      } else if (next.name === "run") {
        const related=(await (api.liveSessions?.()??Promise.resolve([]))).find((item)=>item.runId===next.runId);
        activeLiveDetail=related===undefined?undefined:await api.liveSession?.(related.id);
        const matchMode=activeLiveDetail?.match===undefined?undefined:activeLiveDetail.match.pausedAt===null?"live":"paused";
        await controller.resume(next.runId,{...(matchMode===undefined?{}:{matchMode})});
        derivations = await (api.runDerivations?.(next.runId) ?? Promise.resolve(undefined));
      }
    } catch (error) {
      if (generation === loadGeneration) {
        routeError = error instanceof Error ? error.message : String(error);
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

  function startRouter(): void {
    if (routerStarted) return;
    routerStarted = true;
    router.start();
    void loadRoute(router.route);
    syncLivePolling(router.route);
    syncStoryPolling(router.route);
  }

  function syncLivePolling(next:AppRoute):void{
    if(livePoll!==undefined){clearInterval(livePoll);livePoll=undefined;}
    if(next.name!=="live-session"&&next.name!=="live-overlay"&&next.name!=="run")return;
    livePoll=setInterval(()=>void (async()=>{
      const sessionId=next.name==="live-session"?next.sessionId:activeLiveDetail?.session.id;
      if(sessionId===undefined)return;
      const detail=await api.liveSession?.(sessionId);if(detail!==undefined){if(next.name==="live-session")liveDetail=detail;else activeLiveDetail=detail;controller.setMatchMode(detail.match===undefined?undefined:detail.match.pausedAt===null?"live":"paused");}
      if(next.name==="live-session")liveJournal=(await api.sessionJournal?.(sessionId)??{entries:[],nextSeq:0}).entries;
    })(),2_000);
  }

  function syncStoryPolling(next: AppRoute): void {
    if (storyPoll !== undefined) { clearInterval(storyPoll); storyPoll = undefined; }
    if (next.name !== "story") return;
    storyPoll = setInterval(() => void refreshStory(next.runId, false), 1_000);
  }

  async function refreshStory(runId: string, allowReveal: boolean): Promise<void> {
    if (api.story === undefined) throw new Error("Game stories are unavailable");
    const writer = WriterSession.peek(runId, storage);
    try {
      story = await api.story(runId);
    } catch (error) {
      if (!(allowReveal && error instanceof ApiError && error.code === "ASSISTANCE_WITHHELD" && writer !== undefined)) throw error;
      await api.reveal(runId, writer.writerId);
      story = await api.story(runId);
    }
    if (writer !== undefined && story !== undefined && !story.ready) {
      const page = await api.evidence(runId, 0);
      for (const result of page.results) await api.applyEvidence(runId, result.seq, writer.writerId);
      story = await api.story(runId);
    }
    if (story?.ready && storyPoll !== undefined) { clearInterval(storyPoll); storyPoll = undefined; }
  }

  async function importGame(): Promise<void> {
    importError = undefined;
    try {
      if (api.importGame === undefined) throw new Error("Game import is unavailable");
      const runId = `import-${crypto.randomUUID()}`;
      const writer = WriterSession.claimFor(runId, storage);
      await api.importGame({
        id: runId,
        side: importSide,
        opponentPolicy: { mode: "human_common", targetElo: 1800 },
        policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
        seed: Math.floor(Math.random() * 2_147_483_647),
        source: importUrl.trim() === "" ? { kind: "pgn", pgn: importPgn } : { kind: "lichess", url: importUrl },
      }, writer.writerId);
      await api.reveal(runId, writer.writerId);
      navigate(routePath({ name: "story", runId }));
    } catch (error) { importError = error instanceof Error ? error.message : String(error); }
  }

  async function startRatedGame(band: 1000 | 1400 | 1800 | 2200, side: "white" | "black"): Promise<void> {
    if (api.createRatedGame === undefined) throw new Error("Rated games are unavailable");
    const runId = `rated-${crypto.randomUUID()}`;
    const writer = WriterSession.claimFor(runId, storage);
    const run = await api.createRatedGame({
      id: runId,
      start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" },
      side,
      band,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: Math.floor(Math.random() * 2_147_483_647),
    }, writer.writerId);
    navigate(routePath({ name: "run", runId: run.id }));
  }

  async function enterStoryMoment(runId: string, nodeId: string): Promise<void> {
    const writer = WriterSession.claimFor(runId, storage);
    if (api.claimLease === undefined) throw new Error("Taking this game board is unavailable");
    await api.claimLease(runId, writer.writerId);
    await api.rewind(runId, { nodeId }, writer.writerId);
    await api.fork(runId, { nodeId, label: "story-reentry", intent: "Play a different continuation from this story moment" }, writer.writerId);
    navigate(routePath({ name: "run", runId }));
  }

  async function exportStory(runId: string): Promise<void> {
    const download = await api.pgn(runId);
    const url = URL.createObjectURL(new Blob([download.text], { type: "text/x-chess-pgn;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = download.filename; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function flipRun(runId: string, nodeId: string): Promise<void> {
    if (api.flipRun === undefined) throw new Error("Opposite-side replay is unavailable");
    const result = await api.flipRun(runId, nodeId);
    WriterSession.claimFor(result.run.id, storage, () => result.writerId);
    navigate(routePath({ name: "run", runId: result.run.id }));
  }

  async function createRepertoire():Promise<void>{repertoireError=undefined;try{if(api.createRepertoire===undefined)throw new Error("Repertoire import is unavailable");const created=await api.createRepertoire({name:repertoireName,side:repertoireSide,targetElo:1600,coverageDenominator:100,source:repertoireStudyUrl.trim()?{kind:"lichess_study",url:repertoireStudyUrl}:{kind:"pgn",pgn:repertoirePgn}});repertoires=[created,...repertoires];repertoireName="";repertoirePgn="";repertoireStudyUrl="";}catch(error){repertoireError=error instanceof Error?error.message:String(error);}}
  async function scanRepertoire(id:string):Promise<void>{await api.scanRepertoire?.(id);for(let index=0;index<50;index++){const page=await api.repertoireGaps?.(id);if(page!==undefined){repertoirePages={...repertoirePages,[id]:page};if(page.status==="ready")break;}await new Promise((resolve)=>setTimeout(resolve,100));}repertoires=await(api.repertoires?.()??Promise.resolve(repertoires));}
  async function enterRepertoireGap(id:string,gapKey:string):Promise<void>{const result=await api.enterRepertoireGap?.(id,gapKey);if(result===undefined)return;if(result.writerId!==null)WriterSession.claimFor(result.runId,storage,()=>result.writerId!);navigate(routePath({name:"run",runId:result.runId}));}
  async function distillActiveRun(title: string): Promise<void> {
    const run = session.runState?.run;
    if (run === undefined || distillDraftRunId !== run.id) return;
    distillDraftError = undefined;
    distillDraftBusy = true;
    try {
      if (api.distillRun === undefined) throw new Error("Session distillation is unavailable.");
      const result = await api.distillRun(run.id, { packId: `distilled-${run.id}`, title, branchId: run.activeCursor.branchId });
      drafts = [result.draft, ...drafts.filter((item) => item.id !== result.draft.id)];
      selectedDraftId = result.draft.id;
      studioJson = JSON.stringify(result.draft.document, null, 2);
      distillDraftRunId = undefined;
      navigate("/create");
    } catch (error) {
      distillDraftError = error instanceof Error ? error.message : String(error);
    } finally {
      distillDraftBusy = false;
    }
  }

  async function authenticate(): Promise<void> {
    authError = undefined;
    try {
      const method = authRegister ? api.register : api.login;
      if (method === undefined) throw new Error("Authentication is not available");
      learner = authRegister
        ? await method.call(api, authHandle, authPassword)
        : await method.call(api, authHandle, authPassword);
      authPassword = "";
      startRouter();
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error);
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
    router.stop?.();
    routerStarted = false;
  }

  async function deleteAccountWithPassword(password: string, previewDigest: string): Promise<void> {
    await api.deleteAccount?.(password, previewDigest);
    try { clearAccountLocalData(globalThis.localStorage); } catch { /* storage can be unavailable */ }
    controller.stopSession(); learner = undefined; router.stop?.(); routerStarted = false;
  }

  async function exportAccountWithPassword(password: string): Promise<void> {
    if (api.exportAccount === undefined) throw new Error("Account export is unavailable.");
    const download = await api.exportAccount(password);
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
    runDeletionError = undefined;
    try {
      if (api.runDeletionPreview === undefined) throw new Error("Run deletion is unavailable.");
      runDeletion = { run, preview: await api.runDeletionPreview(run.id) };
    } catch (error) { runDeletionError = error instanceof Error ? error.message : String(error); }
  }

  async function confirmRunDeletion(): Promise<void> {
    if (runDeletion === undefined || api.deleteRun === undefined) return;
    runDeletionError = undefined;
    try {
      await api.deleteRun(runDeletion.run.id, runDeletion.preview.digest);
      try { clearRunLocalData(globalThis.localStorage, runDeletion.run.id); } catch { /* storage can be unavailable */ }
      runs = runs.filter((run) => run.id !== runDeletion!.run.id);
      runDeletion = undefined;
    } catch (error) { runDeletionError = error instanceof Error ? error.message : String(error); }
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
    runArtifactError = undefined;
    try {
      savePgn(await api.pgn(runId));
    } catch (error) {
      runArtifactError = error instanceof Error ? error.message : String(error);
    }
  }

  async function createDraft(): Promise<void> {
    studioActionError = undefined;
    try {
      const document = JSON.parse(studioJson) as unknown;
      const draft = await api.createPackDraft?.(document);
      if (draft !== undefined) {
        drafts = [draft, ...drafts];
        selectedDraftId = draft.id;
        studioJson = JSON.stringify(draft.document, null, 2);
      }
    } catch (error) { studioActionError = error instanceof Error ? error.message : String(error); }
  }

  async function persistSelectedDraft(): Promise<PackDraft | undefined> {
    const draft = drafts.find((candidate) => candidate.id === selectedDraftId);
    if (draft === undefined || draft.state !== "draft") return undefined;
    const saved = await api.updatePackDraft?.(draft.id, draft.digest, JSON.parse(studioJson));
    if (saved !== undefined) drafts = drafts.map((candidate) => candidate.id === saved.id ? saved : candidate);
    return saved;
  }

  async function saveDraft(): Promise<void> {
    studioActionError = undefined;
    try { await persistSelectedDraft(); }
    catch (error) { studioActionError = error instanceof Error ? error.message : String(error); }
  }

  async function playtestDraft(): Promise<void> {
    studioActionError = undefined;
    try {
      const draft = await persistSelectedDraft();
      if (draft === undefined) throw new Error("Select a mutable draft before playtesting");
      if (!draft.validation.valid) throw new Error("Fix the validation errors before playtesting");
      if (api.playtestPackDraft === undefined) throw new Error("Pack playtesting is unavailable");
      const writerId = `writer-${crypto.randomUUID()}`;
      const result = await api.playtestPackDraft(draft.id, writerId);
      WriterSession.claimFor(result.run.id, storage, () => writerId);
      navigate(result.url);
    } catch (error) { studioActionError = error instanceof Error ? error.message : String(error); }
  }

  async function withdrawDraft(draftId: string): Promise<void> {
    const draft = drafts.find((candidate) => candidate.id === draftId);
    if (draft === undefined || api.withdrawPackDraft === undefined) return;
    studioActionError = undefined;
    try {
      await api.withdrawPackDraft(draft.id);
      drafts = drafts.map((candidate) => candidate.id === draft.id ? { ...candidate, state: "withdrawn" } : candidate);
      withdrawConfirmId = undefined;
    } catch (error) { studioActionError = error instanceof Error ? error.message : String(error); }
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

  async function registerDraft(): Promise<void> {
    const draft = drafts.find((candidate) => candidate.id === selectedDraftId);
    if (draft === undefined) return;
    studioActionError = undefined;
    try {
      await api.registerPackDraft?.(draft.id);
      drafts = await (api.packDrafts?.() ?? Promise.resolve([]));
    } catch (error) { studioActionError = error instanceof Error ? error.message : String(error); }
  }

  async function createShapeDraft(): Promise<void> {
    shapeActionError = undefined;
    try {
      if (api.createShapeDraft === undefined) throw new Error("Shape draft creation is unavailable.");
      const draft = await api.createShapeDraft(JSON.parse(shapeStudioJson));
      shapeDrafts = [draft, ...shapeDrafts]; selectedShapeDraftId = draft.id; shapeStudioJson = JSON.stringify(draft.document, null, 2);
    } catch (error) { shapeActionError = error instanceof Error ? error.message : String(error); }
  }
  async function saveShapeDraft(): Promise<void> {
    const draft = shapeDrafts.find((candidate) => candidate.id === selectedShapeDraftId); if (draft === undefined) return;
    shapeActionError = undefined;
    try {
      if (api.updateShapeDraft === undefined) throw new Error("Shape draft saving is unavailable.");
      const saved = await api.updateShapeDraft(draft.id, draft.digest, JSON.parse(shapeStudioJson));
      shapeDrafts = shapeDrafts.map((candidate) => candidate.id === saved.id ? saved : candidate);
    } catch (error) { shapeActionError = error instanceof Error ? error.message : String(error); }
  }
  async function lintShapeDraft(): Promise<void> {
    const draft = shapeDrafts.find((candidate) => candidate.id === selectedShapeDraftId); if (draft === undefined) return;
    shapeActionError = undefined;
    shapeProbeResult = undefined;
    try {
      if (api.lintShapeDraft === undefined) throw new Error("Shape validation is unavailable.");
      const validation = await api.lintShapeDraft(draft.id, JSON.parse(shapeStudioJson), shapeProbeFen);
      shapeDrafts = shapeDrafts.map((candidate) => candidate.id === draft.id ? { ...candidate, validation } : candidate);
      shapeProbeResult = validation.probeMatches;
    } catch (error) { shapeActionError = error instanceof Error ? error.message : String(error); }
  }
  async function registerShapeDraft(): Promise<void> {
    if (selectedShapeDraftId === undefined) return;
    shapeActionError = undefined;
    try {
      if (api.registerShapeDraft === undefined) throw new Error("Shape registration is unavailable.");
      await api.registerShapeDraft(selectedShapeDraftId);
      shapeDrafts = await (api.shapeDrafts?.() ?? Promise.resolve([]));
    } catch (error) { shapeActionError = error instanceof Error ? error.message : String(error); }
  }

  async function createLive(runId:string):Promise<void>{const created=await api.createLiveSession?.({runId,kind:liveKind,title:`${liveKind} session`,boardControl:liveBoardControl,...(liveClassroomId?{classroomId:liveClassroomId}:{}),...(liveScheduledFor?{scheduledFor:new Date(liveScheduledFor).toISOString()}:{}),...(liveBoardControl==="match"?{matchPlayers:{...(liveMatchWhite?{white:liveMatchWhite}:{}),...(liveMatchBlack?{black:liveMatchBlack}:{})}}:{})});if(created){navigate(routePath({name:"live-session",sessionId:created.id}));}}
  async function createClassroom():Promise<void>{if(!classroomName.trim()||api.createClassroom===undefined)return;await api.createClassroom(classroomName.trim());classroomName="";classrooms=await (api.classrooms?.()??Promise.resolve([]));}
  async function openClassroom(id:string):Promise<void>{classroomDetail=await api.classroom?.(id);}
  async function respondClassroom(id:string,op:"accept"|"decline"|"leave"):Promise<void>{await api.respondClassroomInvite?.(id,op);classrooms=await (api.classrooms?.()??Promise.resolve([]));classroomDetail=undefined;}
  async function inviteClassroom():Promise<void>{if(!classroomDetail||!classroomInviteHandle.trim())return;await api.inviteClassroomMember?.(classroomDetail.classroom.id,classroomInviteHandle.trim(),classroomInviteRole);classroomInviteHandle="";await openClassroom(classroomDetail.classroom.id);}
  async function assignClassroomPack():Promise<void>{if(!classroomDetail||!assignmentPackId)return;await api.createAssignment?.(classroomDetail.classroom.id,{packId:assignmentPackId,...(assignmentNote.trim()?{note:assignmentNote}:{}),...(assignmentDueAt?{dueAt:new Date(assignmentDueAt).toISOString()}: {})});assignmentNote="";assignmentDueAt="";await openClassroom(classroomDetail.classroom.id);}
  async function submitAssignedRun(assignmentId:string,runId:string):Promise<void>{await api.submitAssignment?.(assignmentId,runId);assignedPacks=await (api.assignments?.()??Promise.resolve([]));}
  async function withdrawAssignedRun(assignmentId:string,runId:string):Promise<void>{await api.withdrawSubmission?.(assignmentId,runId);assignedPacks=await (api.assignments?.()??Promise.resolve([]));}
  function liveWriterId(runId:string):string|undefined{return WriterSession.peek(runId,storage)?.writerId;}
  async function submitLiveProposal():Promise<void>{if(!liveDetail||!liveProposalMove)return;await api.proposeMove?.(liveDetail.session.id,liveDetail.activeNodeId,liveProposalMove);liveDetail=await api.liveSession?.(liveDetail.session.id);liveProposalMove="";}
  async function resolveLiveProposal(proposalId:string,op:"apply"|"decline"):Promise<void>{
    if(!liveDetail)return;
    liveProposalError=undefined;
    try{
      if(api.resolveProposal===undefined)throw new Error("Proposal resolution is unavailable.");
      const writer=WriterSession.claimFor(liveDetail.session.runId,storage);
      if(op==="apply"){
        if(api.claimLease===undefined)throw new Error("Board possession is unavailable.");
        await api.claimLease(liveDetail.session.runId,writer.writerId);
      }
      await api.resolveProposal(liveDetail.session.id,proposalId,op,writer.writerId);
      liveDetail=await api.liveSession?.(liveDetail.session.id);
    }catch(error){liveProposalError=error instanceof Error?error.message:String(error);}
  }
  async function offerLiveBoard():Promise<void>{if(!liveDetail||!liveOfferHandle)return;const writer=liveWriterId(liveDetail.session.runId);if(!writer)return;await api.boardControl?.(liveDetail.session.id,writer,"offer",liveOfferHandle);liveDetail=await api.liveSession?.(liveDetail.session.id);}
  function setLiveVoteMove(index:number,moveUci:string):void{const previous=liveVoteOptions[index]!;liveVoteOptions=liveVoteOptions.map((option,candidate)=>candidate===index?{moveUci,label:previous.label===""||previous.label===previous.moveUci?moveUci:previous.label}:option);}
  function setLiveVoteLabel(index:number,label:string):void{liveVoteOptions=liveVoteOptions.map((option,candidate)=>candidate===index?{...option,label}:option);}
  function liveVoteReady():boolean{return liveVoteOptions.length>=MIN_LIVE_VOTE_OPTIONS&&liveVoteOptions.length<=MAX_LIVE_VOTE_OPTIONS&&liveVoteOptions.every((option)=>option.moveUci.length>0&&option.label.length>0)&&liveVotePrompt.length>0&&liveVoteDuration>=MIN_LIVE_VOTE_SECONDS&&liveVoteDuration<=MAX_LIVE_VOTE_SECONDS;}
  async function openLiveVote():Promise<void>{if(!liveDetail||!liveVoteReady())return;await api.openVote?.(liveDetail.session.id,{nodeId:liveDetail.activeNodeId,prompt:liveVotePrompt,options:liveVoteOptions,durationSeconds:liveVoteDuration});liveDetail=await api.liveSession?.(liveDetail.session.id);}
  async function inviteLiveParticipant():Promise<void>{if(!liveDetail||(!liveInviteHandle&&!liveInviteUrl))return;await api.inviteToSession?.(liveDetail.session.id,{...(liveDetail.session.kind==="match"?{leg:liveInviteLeg}:{}),...(liveInviteHandle?{handle:liveInviteHandle}:{}),...(liveInviteUrl?{externalChallengeUrl:liveInviteUrl}:{})});liveDetail=await api.liveSession?.(liveDetail.session.id);liveInviteHandle="";liveInviteUrl="";}
  async function importLiveArenaLeg():Promise<void>{if(!liveDetail||!liveArenaPgn)return;const writer=liveWriterId(liveDetail.session.runId);if(!writer)return;await api.importArenaLeg?.(liveDetail.session.id,liveArenaLeg,liveArenaPgn,writer);liveDetail=await api.liveSession?.(liveDetail.session.id);liveArenaPgn="";}
  function moveAuthorHandle(learnerId:string|null):string{return liveDetail?.grants.find((grant)=>grant.learnerId===learnerId)?.handle??"former member";}
  async function operateMatch(op:"propose_pause"|"accept_pause"|"withdraw_pause"|"pause"|"resume"):Promise<void>{if(!liveDetail)return;let writerId:string|undefined;if(op==="resume"){const writer=WriterSession.claimFor(liveDetail.session.runId,storage);await api.claimLease?.(liveDetail.session.runId,writer.writerId);writerId=writer.writerId;}await api.matchOperation?.(liveDetail.session.id,op,writerId);liveDetail=await api.liveSession?.(liveDetail.session.id);}
  async function operateActiveMatch(op:"propose_pause"|"accept_pause"|"withdraw_pause"|"pause"|"resume"):Promise<void>{
    if(!activeLiveDetail)return;
    const runId=activeLiveDetail.session.runId;
    if(op==="resume"&&session.runState?.access==="read_only")await controller.claimLease();
    await api.matchOperation?.(activeLiveDetail.session.id,op,op==="resume"?liveWriterId(activeLiveDetail.session.runId):undefined);
    activeLiveDetail=await api.liveSession?.(activeLiveDetail.session.id);
    controller.setMatchMode(activeLiveDetail?.match===undefined?undefined:activeLiveDetail.match.pausedAt===null?"live":"paused");
    if(op==="resume")await controller.resume(runId,{matchMode:"live"});
  }
  async function mintJoinLink():Promise<void>{if(!liveDetail)return;const result=await api.mintSessionLink?.(liveDetail.session.id,{matchSlot:liveJoinSlot,invitedRole:"participant",...(liveJoinHandle?{invitedHandle:liveJoinHandle}:{})});if(result)liveJoinUrl=result.url;}

  onMount(() => {
    const stopTheme = themeController.start();
    window.addEventListener("tabiya:unauthenticated", onUnauthenticated);
    unsubscribeController = controller.subscribe((next) => (session = next));
    unsubscribeRouter = router.subscribe((next) => {
      route = next;
      document.title = routeTitle(next);
      if (learner === undefined) return;
      void loadRoute(next);
      syncLivePolling(next);
      syncStoryPolling(next);
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
  <main class="auth-gate" aria-labelledby="auth-title">
    <p class="eyebrow">Tabiya / hosted rehearsal</p>
    <h1 id="auth-title">{authRegister ? "Create your learner account." : "Return to your rehearsals."}</h1>
    <form onsubmit={(event) => { event.preventDefault(); void authenticate(); }}>
      <label>Handle <input autocomplete="username" bind:value={authHandle} required /></label>
      <label>Password <input type="password" autocomplete={authRegister ? "new-password" : "current-password"} bind:value={authPassword} minlength="10" maxlength="256" required /></label>
      <button class="primary" type="submit">{authRegister ? "Register" : "Sign in"}</button>
    </form>
    {#if authError}<p role="alert">{authError}</p>{/if}
    <button type="button" onclick={() => { authRegister = !authRegister; authError = undefined; }}>
      {authRegister ? "Use an existing account" : "Create an account"}
    </button>
    <p class="honest">There is no password recovery yet. Keep your password somewhere safe.</p>
  </main>
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
    <main class="shell-view"><h1>Something interrupted the route.</h1><p role="alert">{routeError}</p></main>
  {:else if route.name === "home"}
    <main class="shell-view home" aria-labelledby="home-title">
      <p class="eyebrow">Tabiya / play the consequence</p>
      <h1 id="home-title">Do not just learn the move. Rehearse the game it creates.</h1>
      <p class="home-lede">Play a position out. Rewind to the decision. Try it another way. Keep both attempts.</p>
      {#if recentRun}
        <section class="resume-card" aria-labelledby="resume-title">
          <p class="eyebrow">Continue</p>
          <h2 id="resume-title">{recentRun.title}</h2>
          <p>{recentRun.branchCount} {recentRun.branchCount === 1 ? "branch" : "branches"} · {recentRun.objectiveState} · {readableDate(recentRun.updatedAt)}</p>
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
        <p><strong>{dueSchedules.length}</strong> {dueSchedules.length === 1 ? "rehearsal is" : "rehearsals are"} due</p>
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
              <span>{pack.phase?.replaceAll("_", " ")}</span>
              <h3>{pack.title}</h3>
              <p>{pack.objectiveSummary}</p>
              <button type="button" onclick={() => controller.startPack(pack.id)}>Start {pack.phase}</button>
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
        shapes={session.shapes}
        snapshot={session.runState}
        checkpoint={session.checkpoint}
        authoredFeedback={session.authoredFeedback}
        reasoning={session.reasoning}
        comparison={session.comparison}
        comparisonBranchIds={session.comparisonBranchIds}
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
        onReasoning={(input) => controller.recordReasoning(input)}
        onReasoningReview={capabilities?.providers.llm === "external" && api.reasoningReview !== undefined ? (checkpointEventSeq) => api.reasoningReview!(session.runState!.run.id, checkpointEventSeq) : undefined}
        onExport={exportPgn}
        onLoadMarks={api.marks === undefined ? undefined : () => api.marks!(session.runState!.run.id)}
        onSaveMarks={api.replaceMarks === undefined ? undefined : (input) => api.replaceMarks!(session.runState!.run.id, input)}
        onRescopeMarks={api.rescopeMarks === undefined ? undefined : (input) => api.rescopeMarks!(session.runState!.run.id,input)}
        onStop={() => navigate("/play")}
        onHumanSplit={(nodeId) => api.humanSplit(session.runState!.run.id, nodeId)}
        onCorpus={(nodeId) => api.corpus(session.runState!.run.id, nodeId)}
        onVoice={(nodeId, scope) => api.voice(session.runState!.run.id, nodeId, scope)}
        onCompareVoice={capabilities?.providers.llm === "external" && session.comparisonBranchIds !== undefined ? () => api.compareVoice(session.runState!.run.id, session.comparisonBranchIds!) : undefined}
        onSpeech={(nodeId, scope) => api.speech(session.runState!.run.id, nodeId, scope)}
        onCreateGroup={(input) => controller.createGroup(input)}
        onAnalyzeMissing={(nodeIds) => controller.analyzeMissingEvidence(nodeIds)}
        onStory={session.runState.run.events.some((event) => event.type === "outcome.reached") ? () => navigate(routePath({ name: "story", runId: session.runState!.run.id })) : undefined}
        onFlip={(nodeId) => flipRun(session.runState!.run.id, nodeId)}
        onSelectPack={(packId) => controller.startPack(packId)}
        onFirstRehearsalComplete={completeFirstRehearsal}
        registerKeyboardRegion={keyboardDispatcher.registerRegion}
      />
      {#if session.viewer?.role === "spectator"}
        <aside class="session-banner" aria-label="Review access"><strong>{session.viewer.reviewRail === "open" ? "Submitted review access" : "Review access limited"}</strong><span>{reviewRailCopy(session.viewer.reviewRail)}</span></aside>
      {/if}
      {#if activeLiveDetail}
        <aside class="session-banner" aria-label="Live session rail"><strong>{activeLiveDetail.session.title}</strong>{#if activeLiveDetail.match}{@const seated=learner?.id===activeLiveDetail.match.whiteLearnerId||learner?.id===activeLiveDetail.match.blackLearnerId}<span>{activeLiveDetail.match.pausedAt?"Paused — rehearsal is open":activeLiveDetail.match.pauseProposedBy?"Pause proposed":learnerOwnsActiveMatchTurn()?"Your move":"Their move"}</span><div class="row-actions">{#if activeLiveDetail.match.pausedAt}<button type="button" onclick={()=>void operateActiveMatch("resume")}>Resume main line</button>{:else if seated}{#if activeLiveDetail.match.pauseProposedBy===learner?.id}<button type="button" onclick={()=>void operateActiveMatch("withdraw_pause")}>Withdraw pause</button>{:else if activeLiveDetail.match.pauseProposedBy}<button type="button" onclick={()=>void operateActiveMatch("accept_pause")}>Accept pause</button>{:else}<button type="button" onclick={()=>void operateActiveMatch("propose_pause")}>Propose pause</button>{/if}{:else if activeLiveDetail.role==="host"}<button type="button" onclick={()=>void operateActiveMatch("pause")}>Pause for coaching</button>{/if}</div>{:else}<span>{activeLiveDetail.role} · {activeLiveDetail.proposals.filter((item)=>item.status==="open").length} open proposals{activeLiveDetail.vote ? ` · ${activeLiveDetail.vote.total} votes` : ""}</span>{/if}<button type="button" onclick={()=>navigate(routePath({name:"live-session",sessionId:activeLiveDetail!.session.id}))}>Session</button></aside>
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
    {#if story}<GameStoryScreen {story} onEnter={(nodeId) => enterStoryMoment(storyRunId, nodeId)} onExport={() => exportStory(storyRunId)} onShare={api.shareStory === undefined ? undefined : async () => (await api.shareStory!(storyRunId, story!.branchId)).url} onVoice={capabilities?.providers.llm === "external" ? async (nodeId) => (await api.voice(storyRunId, nodeId, "story")).text : undefined} />
    {:else}<main class="shell-view"><h1>Story unavailable.</h1><p role="alert">{routeError ?? "The imported game has no story payload."}</p></main>{/if}
  {:else if route.name === "review"}
    <main class="shell-view" aria-labelledby="review-title">
      <p class="eyebrow">Review</p><h1 id="review-title">Run history</h1>
      <p>Open a run to replay, branch, compare, or export it. Import one finished game when you want its moments to become rehearsal doors.</p>
      <form class="import-game" onsubmit={(event) => { event.preventDefault(); void importGame(); }}>
        <h2>Import one game</h2>
        <label>Lichess game URL <input type="url" placeholder="https://lichess.org/abcdefgh" bind:value={importUrl} /></label>
        <span>or paste PGN</span>
        <label>PGN <textarea rows="6" placeholder="[Event …]" bind:value={importPgn}></textarea></label>
        <label>Your side <select bind:value={importSide}><option value="white">White</option><option value="black">Black</option></select></label>
        <button class="primary" type="submit" disabled={importUrl.trim() === "" && importPgn.trim() === ""}>Build game story</button>
        {#if importError}<p role="alert">{importError}</p>{/if}
        <p class="honest">Chess.com: download or copy the PGN from the game page and paste it here. Tabiya never links or mines your account.</p>
      </form>
      <div class="item-list">
        {#each runs as run}
          <article>
            <div><h2>{run.title}</h2><p>{readableDate(run.updatedAt)} · {run.branchCount} {run.branchCount === 1 ? "branch" : "branches"} · {run.objectiveState}</p></div>
            <button type="button" onclick={() => navigate(routePath({ name: run.sessionKind === "imported" ? "story" : "run", runId: run.id }))}>{run.sessionKind === "imported" ? "Open story" : "Open run"}</button>
          </article>
        {:else}<p>No runs to review yet.</p>{/each}
      </div>
    </main>
  {:else if route.name === "learn"}
    <main class="shell-view" aria-labelledby="learn-title">
      <p class="eyebrow">Learn / return loop</p>
      <h1 id="learn-title">Return to the positions that need another attempt.</h1>
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
                {#each assignment.submissions as submission}<div class="submission-record"><p>{submission.withdrawnAt ? "Submission withdrawn" : `Submitted ${readableDate(submission.submittedAt)} · access until ${readableDate(submission.accessExpiresAt)}`}</p>{#if !submission.withdrawnAt}<p>{submission.grantedTeacherHandles.length>0?`Currently shared with ${submission.grantedTeacherHandles.map((handle)=>`@${handle}`).join(", ")}.`:"No teacher currently holds access."}</p><button type="button" onclick={()=>void withdrawAssignedRun(assignment.id,submission.runId)}>Stop future teacher access</button><p class="honest">Revoking stops future reads. It cannot undo what a teacher already saw.</p>{/if}</div>{/each}
              </div>
              <div class="row-actions"><button type="button" onclick={()=>void controller.startPack(assignment.packId)}>Start pack</button>{#if eligibleRuns.length>0}<label>Completed run <select value={assignmentRunSelection[assignment.id]??""} onchange={(event)=>chooseAssignmentRun(assignment.id,event.currentTarget.value)}><option value="">Choose a run</option>{#each eligibleRuns as run}<option value={run.id}>{run.title} · {readableDate(run.updatedAt)} · {run.branchCount} {run.branchCount===1?"branch":"branches"}</option>{/each}</select></label><button type="button" disabled={!assignmentRunSelection[assignment.id]} aria-describedby={!assignmentRunSelection[assignment.id]?`submission-run-required-${assignment.id}`:undefined} onclick={()=>prepareAssignedRun(assignment.id)}>Share with teachers</button>{#if !assignmentRunSelection[assignment.id]}<p id={`submission-run-required-${assignment.id}`} class="honest">Choose one of your runs of this pack.</p>{/if}{:else}<p class="honest">Play this assignment before sharing an attempt.</p>{/if}</div>
            </article>
          {:else}<p>No open assignments.</p>{/each}
        </div>
        {#if submissionIntent}{@const assignment=assignedPacks.find((candidate)=>candidate.id===submissionIntent!.assignmentId)}{@const run=runs.find((candidate)=>candidate.id===submissionIntent!.runId)}{#if assignment&&run}<aside class="consent-card" aria-labelledby="submission-confirm-title"><h3 id="submission-confirm-title">Share {run.title}?</h3><p>{assignment.teacherHandles.length>0?`${assignment.teacherHandles.map((handle)=>`@${handle}`).join(", ")} will be able to read this run for up to 90 days.`:"No active teacher is available to receive this run."}</p><p class="honest">They receive this run only, including its moves and the evidence or reveals already recorded in it. They do not gain access to your other runs.</p><div class="row-actions"><button type="button" disabled={assignment.teacherHandles.length===0} aria-describedby={assignment.teacherHandles.length===0?"submission-no-teacher":undefined} onclick={()=>void confirmAssignedRun()}>Confirm sharing</button><button type="button" onclick={()=>submissionIntent=undefined}>Cancel</button></div>{#if assignment.teacherHandles.length===0}<p id="submission-no-teacher" class="honest">An active teacher must be present before this run can be shared.</p>{/if}</aside>{/if}{/if}
      </section>
      {#if recommendations.length>0}
        <section aria-labelledby="recommended-title"><h2 id="recommended-title">Recommended next</h2><div class="item-list">
          {#each recommendations as item}<article><p>{item.sentence}</p>{#if item.kind==="repertoire_gap"}<button type="button" onclick={()=>void enterRepertoireGap(item.repertoireId,item.gapKey)}>Enter gap</button>{:else if item.packIds[0]}<button type="button" onclick={()=>navigate("/play")}>Find {item.packIds[0]}</button>{/if}</article>{/each}
        </div></section>
      {/if}
      <section aria-labelledby="repertoire-title">
        <h2 id="repertoire-title">Repertoire gaps</h2>
        <form class="repertoire-form" onsubmit={(event)=>{event.preventDefault();void createRepertoire();}}>
          <label>Name <input required bind:value={repertoireName} /></label>
          <label>Your side <select bind:value={repertoireSide}><option value="white">White</option><option value="black">Black</option></select></label>
          <label>Public Lichess study URL <input type="url" placeholder="https://lichess.org/study/abcdefgh" bind:value={repertoireStudyUrl} /></label>
          <span>or paste a multi-game, variation-bearing PGN</span>
          <label>Repertoire PGN <textarea rows="5" bind:value={repertoirePgn}></textarea></label>
          <button class="primary" type="submit" aria-describedby="repertoire-import-help" disabled={!repertoireName.trim()||(!repertoireStudyUrl.trim()&&!repertoirePgn.trim())}>Import repertoire</button>
          <p id="repertoire-import-help" class="honest">Name the repertoire and provide either a public Lichess study or pasted PGN.</p>
          {#if repertoireError}<p role="alert">{repertoireError}</p>{/if}
        </form>
        <div class="item-list">
          {#each repertoires as repertoire}
            {@const page=repertoirePages[repertoire.id]}
            <article class="repertoire-card">
              <div><h3>{repertoire.name}</h3><p>{repertoire.side} · {repertoire.targetElo} band · cover replies seen at least 1 in {repertoire.coverageDenominator} games</p></div>
              <button type="button" onclick={()=>void scanRepertoire(repertoire.id)}>{page?.status==="ready"?"Rescan":"Scan gaps"}</button>
              {#if page?.status==="pending"}<p>Scanning…</p>{/if}
              {#if page?.scan}
                <div class="gap-results" aria-label={`Gaps for ${repertoire.name}`}>
                  <p>{corpusPopulationLabel(page.scan.population)}</p><p class="honest">{page.scan.guard}.</p>
                  {#if page.scan.partiality}<p class="honest">{page.scan.partiality}</p>{/if}
                  {#each page.scan.gaps as gap,index}
                    <div class="gap-row"><span>{gap.replySan||"First move"} · {gap.gamesUntilSeen?`about 1 in ${gap.gamesUntilSeen} games`:"frequency unavailable"} · {gap.state}</span>{#if index===0}<button type="button" onclick={()=>void enterRepertoireGap(repertoire.id,gap.key)}>Go to biggest gap</button>{/if}</div>
                  {:else}<p>No ranked gaps above this bound.</p>{/each}
                </div>
              {/if}
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
        <div class="item-list">
          {#each dueSchedules as schedule}
            <article>
              <div>
                <h3>{schedule.packId ?? "Position rehearsal"}</h3>
                <p>{schedule.kind === "blocked" ? "Repeat the blocked attempt" : "Try a varied repetition"} · {readableDate(schedule.dueAt)}</p>
              </div>
              <div class="row-actions">
                {#if schedule.sourceRunId}<button type="button" onclick={() => navigate(routePath({ name: "run", runId: schedule.sourceRunId! }))}>Open source</button>{/if}
                <button type="button" onclick={async () => { await api.dismissSchedule?.(schedule.id); dueSchedules = dueSchedules.filter((item) => item.id !== schedule.id); }}>Dismiss</button>
              </div>
            </article>
          {:else}<p>Nothing is due yet. Played attempts create this queue.</p>{/each}
        </div>
      </section>
      <section aria-labelledby="recorded-title">
        <h2 id="recorded-title">What is recorded</h2>
        <div class="item-list">
          {#each attempts as attempt}
            {@const related = relatedAttempts[relatedAttemptKey(attempt)]}
            <article class="recorded-attempt">
              <div class="recorded-attempt-header">
                <div>
                  <h3>{attempt.packId ?? "Position rehearsal"} · attempt {attempt.attemptNo || "—"}</h3>
                  <p>{attempt.graded ? attemptVerdictLabel(attempt.verdict) : "Not graded"} · {attempt.userPlyCount} learner plies · {readableDate(attempt.endedAt)}</p>
                </div>
                <div class="row-actions">
                  <button type="button" aria-expanded={related !== undefined} onclick={() => void toggleRelatedAttempts(attempt)}>{related === undefined ? "Related attempts" : "Hide related"}</button>
                  <button type="button" onclick={() => navigate(routePath({ name: "run", runId: attempt.runId }))}>Open run</button>
                </div>
              </div>
              {#if related?.status === "loading"}<p role="status">Finding your nearest related attempts…</p>
              {:else if related?.status === "error"}<p role="alert">{related.message}</p>
              {:else if related?.status === "loaded"}
                <ul class="related-attempts" aria-label={`Related attempts for ${attempt.packId ?? "this position"}`}>
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
      <div class="studio-grid pack-studio-grid">
        <aside aria-label="Your drafts">
          <h2>Your drafts</h2>
          {#each drafts as draft}
            <button type="button" onclick={() => { selectedDraftId = draft.id; studioJson = JSON.stringify(draft.document, null, 2); studioActionError = undefined; withdrawConfirmId = undefined; }}>
              {draft.packId} · {draft.state}
            </button>
          {:else}<p>No database drafts yet. Paste a v{DRILL_PACK_SCHEMA_VERSION} pack to begin.</p>{/each}
        </aside>
        <section>
          <label for="studio-json">Pack JSON</label>
          <textarea id="studio-json" bind:value={studioJson} spellcheck="false"></textarea>
          <div class="row-actions">
            <button type="button" onclick={() => void createDraft()}>Create draft</button>
            <button type="button" disabled={selectedPackDraft?.state !== "draft"} aria-describedby={selectedPackDraft?.state !== "draft" ? "draft-action-disabled" : undefined} onclick={() => void saveDraft()}>Save</button>
            <button class="primary" type="button" disabled={selectedPackDraft?.state !== "draft" || packLintState !== "ready" || !packBufferValidation?.valid} aria-describedby={selectedPackDraft?.state !== "draft" ? "draft-action-disabled" : packLintState !== "ready" || !packBufferValidation?.valid ? "playtest-disabled" : undefined} onclick={() => void playtestDraft()}>Save &amp; playtest</button>
            <button type="button" disabled={selectedPackRegistrationBlock !== undefined} aria-describedby={selectedPackRegistrationBlock !== undefined ? "register-disabled" : "pack-publication-retention"} onclick={() => void registerDraft()}>Register community pack</button>
            <button type="button" disabled={selectedPackDraft?.state !== "draft"} aria-describedby={selectedPackDraft?.state !== "draft" ? "draft-action-disabled" : undefined} onclick={() => { if (selectedPackDraft) withdrawConfirmId = selectedPackDraft.id; }}>Withdraw…</button>
          </div>
          {#if selectedPackDraft?.state !== "draft"}<p id="draft-action-disabled" class="honest">{selectedPackDraft ? `This draft is ${selectedPackDraft.state}; its saved bytes remain read-only.` : "Select or create a draft first."}</p>{/if}
          {#if selectedPackDraft?.state === "draft" && (packLintState !== "ready" || !packBufferValidation?.valid)}<p id="playtest-disabled" class="honest">{packLintState === "waiting" ? "Waiting for you to pause typing…" : packLintState === "checking" ? "Checking these unsaved bytes…" : packLintState === "unavailable" ? "Live validation is unavailable; saving remains possible." : "Fix the listed validation errors before the real run can start."}</p>{/if}
          {#if selectedPackRegistrationBlock !== undefined}<p id="register-disabled" class="honest">{selectedPackRegistrationBlock}</p>{/if}
          {#if selectedPackDraft}<p id="pack-publication-retention" class="honest">Playtesting stays private and preserves the tested bytes. Registration publishes immutable document bytes, authored prose, licence, and attribution; those remain available with “deleted account” attribution if you later delete your account.</p>{/if}
          {#if selectedPackDraft && withdrawConfirmId === selectedPackDraft.id}<aside class="deletion-card"><h3>Withdraw this draft?</h3><p>It becomes read-only and cannot be registered. Existing private playtest runs keep their exact tested bytes.</p><div class="row-actions"><button type="button" onclick={() => void withdrawDraft(selectedPackDraft.id)}>Confirm withdrawal</button><button type="button" onclick={() => withdrawConfirmId = undefined}>Cancel</button></div></aside>{/if}
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
          {#each shapeDrafts as draft}<button type="button" onclick={() => { selectedShapeDraftId = draft.id; shapeStudioJson = JSON.stringify(draft.document, null, 2); shapeActionError = undefined; }}>{draft.shapeId} · {draft.state}</button>{:else}<p>No shape drafts yet.</p>{/each}
        </aside>
        <section>
          <label for="shape-studio-json">Shape JSON</label><textarea id="shape-studio-json" bind:value={shapeStudioJson} spellcheck="false"></textarea>
          <ShapePlanSignatureEditor documentJson={shapeStudioJson} onDocumentJson={(documentJson) => shapeStudioJson = documentJson} />
          <label>Probe FEN <input bind:value={shapeProbeFen} placeholder="Optional position to test the trigger" /></label>
          <div class="row-actions">
            <button type="button" onclick={() => void createShapeDraft()}>Create shape draft</button>
            <button type="button" disabled={!selectedShapeDraftId} aria-describedby={!selectedShapeDraftId ? "shape-selection-required" : undefined} onclick={() => void saveShapeDraft()}>Save shape</button>
            <button type="button" disabled={!selectedShapeDraftId} aria-describedby={!selectedShapeDraftId ? "shape-selection-required" : undefined} onclick={() => void lintShapeDraft()}>Lint + probe</button>
            <button type="button" disabled={!selectedShapeDraftId} aria-describedby={!selectedShapeDraftId ? "shape-selection-required" : "shape-publication-retention"} onclick={() => void registerShapeDraft()}>Register community shape</button>
          </div>
          {#if shapeProbeResult !== undefined}<p role="status">Probe trigger: {shapeProbeResult ? "matches" : "does not match"}</p>{/if}
          {#if shapeActionError}<p role="alert">{shapeActionError}</p>{/if}
          {#if !selectedShapeDraftId}<p id="shape-selection-required" class="honest">Select or create a shape draft first.</p>{/if}
          {#if selectedShapeDraftId}<p id="shape-publication-retention" class="honest">Registration publishes immutable shape bytes, authored prose, licence, and attribution. They remain available with “deleted account” attribution if you later delete your account.</p>{/if}
          {#if selectedShapeDraftId}{@const selectedShape=shapeDrafts.find((candidate)=>candidate.id===selectedShapeDraftId)}{#if selectedShape}<ul>{#each selectedShape.validation.issues as issue}<li><code>{issue.path}</code> {issue.code}: {issue.message}</li>{:else}<li>Validation clean.</li>{/each}</ul>{/if}{/if}
        </section>
      </div>
      <p class="honest">Shape entries name reusable patterns and plans. They do not prescribe a move in the current position.</p>
    </main>
  {:else if route.name === "live"}
    <main class="shell-view" aria-labelledby="live-title">
      <p class="eyebrow">Live / shared rehearsal</p><h1 id="live-title">Rehearse with other people.</h1>
      <section aria-labelledby="classrooms-title">
        <h2 id="classrooms-title">Classrooms</h2>
        <form class="row-actions" onsubmit={(event)=>{event.preventDefault();void createClassroom();}}><label>New classroom <input required bind:value={classroomName} /></label><button type="submit">Create</button></form>
        <div class="item-list">
          {#each classrooms as classroom}
            <article><div><h3>{classroom.name}</h3><p>{classroom.memberRole} · {classroom.memberState}{classroom.archivedAt ? " · archived read-only" : ""}</p></div>
              {#if classroom.memberState==="invited"}<div class="row-actions"><button type="button" onclick={()=>void respondClassroom(classroom.id,"accept")}>Accept</button><button type="button" onclick={()=>void respondClassroom(classroom.id,"decline")}>Decline</button></div>{:else}<button type="button" onclick={()=>void openClassroom(classroom.id)}>Open</button>{/if}
            </article>
          {:else}<p>No classrooms yet.</p>{/each}
        </div>
        {#if classroomDetail}
          <article class="classroom-detail">
            <div class="row-actions"><h3>{classroomDetail.classroom.name}{classroomDetail.classroom.archivedAt ? " · archived" : ""}</h3>{#if !classroomDetail.classroom.archivedAt}<button type="button" onclick={()=>void respondClassroom(classroomDetail!.classroom.id,"leave")}>Leave</button>{/if}</div>
            {#if classroomDetail.classroom.archivedAt}<p class="honest">This classroom remains as read-only shared history. Membership, assignments, submissions, and scheduling cannot be changed.</p>{/if}
            <h4>Members</h4><ul>{#each classroomDetail.members as member}<li>@{member.handle} — {member.memberRole}, {member.state}</li>{/each}</ul>
            {#if classroomDetail.membership.memberRole==="teacher" && !classroomDetail.classroom.archivedAt}
              <form class="row-actions" onsubmit={(event)=>{event.preventDefault();void inviteClassroom();}}><label>Invite handle <input required bind:value={classroomInviteHandle}/></label><label>Role <select bind:value={classroomInviteRole}><option value="learner">Learner</option><option value="teacher">Teacher</option></select></label><button type="submit">Invite</button></form>
              <form class="row-actions" onsubmit={(event)=>{event.preventDefault();void assignClassroomPack();}}><label>Pack <select required bind:value={assignmentPackId}><option value="">Choose a pack</option>{#each packs as pack}<option value={pack.id}>{pack.title}</option>{/each}</select></label><label>Teacher note <input bind:value={assignmentNote}/></label><label>Due <input type="datetime-local" bind:value={assignmentDueAt}/></label><button type="submit">Assign</button></form>
            {/if}
            <h4>Assignments and submissions</h4><div class="item-list assignment-grid">{#each classroomDetail.assignments as assignment}<article><div><h5>{packTitle(assignment.packId)}</h5><p>Assigned by @{classroomMemberHandle(assignment.assignedBy)} · {readableDate(assignment.createdAt)}{assignment.dueAt?` · due ${readableDate(assignment.dueAt)}`:""}{isOverdue(assignment.dueAt)&&!assignment.withdrawnAt?" · overdue":""}{assignment.withdrawnAt?" · withdrawn":""}</p>{#if assignment.note}<blockquote><p>{assignment.note}</p><footer>— @{classroomMemberHandle(assignment.assignedBy)}, teacher note</footer></blockquote>{/if}</div>{#if classroomDetail.membership.memberRole==="teacher"}<ul aria-label={`Submission status for ${packTitle(assignment.packId)}`}>{#each classroomDetail.members.filter((member)=>member.memberRole==="learner"&&member.state==="active") as member}{@const submissions=assignmentSubmissions(assignment.id,member.learnerId)}<li><strong>@{member.handle}</strong>{#if submissions.length===0} — not submitted{:else}<ul>{#each submissions as submission}<li>{submission.withdrawnAt?`Withdrawn ${readableDate(submission.withdrawnAt)}`:`Submitted ${readableDate(submission.submittedAt)}`} · {submission.access==="available"?"access available":"access revoked or expired"}{#if submission.access==="available"} <button type="button" onclick={()=>navigate(routePath({name:"run",runId:submission.runId}))}>Review @{member.handle}'s run</button>{/if}</li>{/each}</ul>{/if}</li>{:else}<li>No active learners.</li>{/each}</ul>{/if}</article>{:else}<p>No assignments.</p>{/each}</div>
            {#if learner}<CohortStanding {api} classroomId={classroomDetail.classroom.id} learnerId={learner.id} role={classroomDetail.membership.memberRole} />{/if}
            <h4>Upcoming sessions</h4><ul>{#each classroomDetail.upcomingSessions as item}<li>{item.title} · {item.scheduledFor?readableDate(item.scheduledFor):"unscheduled"}</li>{:else}<li>No scheduled sessions.</li>{/each}</ul>
          </article>
        {/if}
      </section>
      <div class="row-actions"><label>Kind <select bind:value={liveKind}><option value="stream">Stream</option><option value="academy">Academy</option><option value="match">Match / Arena</option></select></label><label>Board <select bind:value={liveBoardControl}><option value="host_directed">Host directed</option><option value="free_claim">Free claim</option><option value="rotation">Rotation</option><option value="match">Native two-player match</option></select></label><label>Classroom (optional) <select bind:value={liveClassroomId}><option value="">None</option>{#each classrooms.filter((item)=>item.memberRole==="teacher"&&item.memberState==="active") as classroom}<option value={classroom.id}>{classroom.name}</option>{/each}</select></label><label>Schedule (optional) <input type="datetime-local" bind:value={liveScheduledFor}/></label>{#if liveBoardControl==="match"}<label>White handle<input bind:value={liveMatchWhite} placeholder="student-white"/></label><label>Black handle<input bind:value={liveMatchBlack} placeholder="or leave one seat open"/></label>{/if}</div>
      <section><h2>Your sessions</h2><div class="item-list live-wall">{#each liveSessions as item}<article><div class="mini-board"><Chessboard fen={item.board.activeFen} startSide="white" disabled={true} onMove={()=>{}}/></div><div><h3>{item.title}</h3><p>{item.kind} · {item.boardControl} · {item.board.sideToMove} to move{item.board.pausedAt ? " · paused" : ""}</p>{#if item.board.players}<p>{item.board.players.white?`@${item.board.players.white.handle}`:"open"} vs {item.board.players.black?`@${item.board.players.black.handle}`:"open"}</p>{/if}<p>@{item.board.leaseHeldBy.handle} holds the board · {item.board.plyCount} plies</p></div><button type="button" onclick={()=>navigate(routePath({name:"live-session",sessionId:item.id}))}>Open</button></article>{:else}<p>No live sessions yet.</p>{/each}</div></section>
      <section><h2>Start from a run</h2><div class="item-list">{#each runs as item}<article><div><h3>{item.title}</h3><p>{item.viewerRole === "host" ? "Ready to host" : "Only a host can create a session"}</p></div><button type="button" disabled={item.viewerRole!=="host"} aria-describedby={item.viewerRole!=="host"?`live-disabled-${item.id}`:undefined} onclick={()=>void createLive(item.id)}>Create {liveKind}</button>{#if item.viewerRole!=="host"}<span id={`live-disabled-${item.id}`} class="honest">Host role required.</span>{/if}</article>{/each}</div></section>
      <p class="honest">Vote tallies are advisory. Chat identity is only as trustworthy as the configured adapter.</p>
    </main>
  {:else if route.name === "live-session"}
    <main class="shell-view" aria-labelledby="session-title">
      {#if liveDetail}<p class="eyebrow">Live / {liveDetail.session.kind}</p><h1 id="session-title">{liveDetail.session.title}</h1><p>{liveDetail.session.boardControl} · your role: {liveDetail.role}</p>
        {#if liveDetail.match}<section aria-labelledby="match-state-title"><h2 id="match-state-title">Match board</h2><p>{liveDetail.match.pausedAt ? "Paused for rehearsal" : liveDetail.match.pauseProposedBy ? "Pause proposed" : "Live — evidence and rehearsal are withheld"}</p><div class="row-actions">{#if liveDetail.match.pausedAt}<button type="button" onclick={()=>void operateMatch("resume")}>Resume main line</button>{:else}<button type="button" onclick={()=>void operateMatch("propose_pause")}>Propose pause</button>{#if liveDetail.match.pauseProposedBy}<button type="button" onclick={()=>void operateMatch("accept_pause")}>Accept pause</button>{/if}{#if liveDetail.role==="host"}<button type="button" onclick={()=>void operateMatch("pause")}>Coach pause</button>{/if}{/if}</div>{#if liveDetail.role==="host"}<div class="row-actions"><label>Open seat <select bind:value={liveJoinSlot}><option value="white">White</option><option value="black">Black</option></select></label><label>Optional handle<input bind:value={liveJoinHandle}/></label><button type="button" onclick={()=>void mintJoinLink()}>Create friend link</button></div>{#if liveJoinUrl}<p role="status">Friend link: <code>{liveJoinUrl}</code></p>{/if}{/if}</section>{/if}
        <div class="studio-grid"><section><h2>Members</h2><p>@{liveDetail.leaseHeldBy.handle} holds the board.</p><ul>{#each liveDetail.grants as grant}<li>@{grant.handle} — {grant.role}</li>{/each}</ul>{#if liveDetail.role==="host"}<label>Offer board to handle <input bind:value={liveOfferHandle}/></label><button type="button" disabled={!liveOfferHandle||!liveWriterId(liveDetail.session.runId)} aria-describedby={!liveWriterId(liveDetail.session.runId)?"offer-readonly":undefined} onclick={()=>void offerLiveBoard()}>Offer board</button>{#if !liveWriterId(liveDetail.session.runId)}<p id="offer-readonly" class="honest">Open the shared board on this device before offering possession.</p>{/if}{/if}<h2>Move authorship</h2><ol aria-label="Move authorship">{#each liveDetail.moveAuthorship as entry,index}<li>Move {index+1} · @{moveAuthorHandle(entry.learnerId)}</li>{:else}<li>No committed moves yet.</li>{/each}</ol><h2>Board marks</h2>{#if markAttribution(liveDetail)}<p class="honest">{markAttribution(liveDetail)}</p>{:else}<p>No relayed marks at this position.</p>{/if}<h2>Proposals</h2>{#if liveDetail.role!=="spectator"}<div class="row-actions"><label>Move (UCI)<input bind:value={liveProposalMove} placeholder="e2e4"/></label><button type="button" disabled={!liveProposalMove} aria-describedby={!liveProposalMove?"proposal-disabled":undefined} onclick={()=>void submitLiveProposal()}>Propose</button></div>{#if !liveProposalMove}<p id="proposal-disabled" class="honest">Enter a legal move from the active position.</p>{/if}{/if}<ul aria-label="Move proposals">{#each liveDetail.proposals as proposal}<li><code>{proposal.moveUci}</code> · proposed by @{moveAuthorHandle(proposal.proposedBy)} · {proposal.status}{#if liveDetail.role==="host"&&proposal.status==="open"}<div class="row-actions"><button type="button" onclick={()=>void resolveLiveProposal(proposal.id,"apply")}>Play proposal</button><button type="button" onclick={()=>void resolveLiveProposal(proposal.id,"decline")}>Decline</button></div>{/if}</li>{:else}<li>No proposals yet.</li>{/each}</ul>{#if liveProposalError}<p role="alert">{liveProposalError}</p>{/if}</section><section><h2>Vote</h2>{#if liveDetail.role==="host"}<div class="vote-editor"><label>Prompt<input maxlength="120" bind:value={liveVotePrompt}/></label>{#each liveVoteOptions as option,index}<div class="row-actions"><label>Move (UCI)<input value={option.moveUci} placeholder="e2e4" oninput={(event)=>setLiveVoteMove(index,event.currentTarget.value)}/></label><label>Label<input maxlength="40" value={option.label} oninput={(event)=>setLiveVoteLabel(index,event.currentTarget.value)}/></label><button type="button" disabled={liveVoteOptions.length<=MIN_LIVE_VOTE_OPTIONS} onclick={()=>liveVoteOptions=liveVoteOptions.filter((_,candidate)=>candidate!==index)}>Remove</button></div>{/each}<div class="row-actions"><button type="button" disabled={liveVoteOptions.length>=MAX_LIVE_VOTE_OPTIONS} onclick={()=>liveVoteOptions=[...liveVoteOptions,{moveUci:"",label:""}]}>Add option</button><label>Duration (seconds)<input type="number" min={MIN_LIVE_VOTE_SECONDS} max={MAX_LIVE_VOTE_SECONDS} bind:value={liveVoteDuration}/></label><button type="button" disabled={!liveVoteReady()} aria-describedby={!liveVoteReady()?"vote-disabled":undefined} onclick={()=>void openLiveVote()}>Open vote</button></div></div>{#if !liveVoteReady()}<p id="vote-disabled" class="honest">Two to eight legal UCI moves are required.</p>{/if}{/if}{#if liveDetail.vote}<p>{liveDetail.vote.window.prompt} · {liveDetail.vote.window.state}</p><ul>{#each liveDetail.vote.tally as item}<li>{item.label}: {item.count}</li>{/each}</ul><p class="honest">{voteAttribution(liveDetail)}</p>{:else}<p>No vote window is open.</p>{/if}<h2>Possession journal</h2><ol>{#each liveJournal as entry}<li>{entry.kind} · run seq {entry.runSeq ?? "—"}</li>{/each}</ol></section></div>
        {#if liveDetail.role==="host"}<section aria-labelledby="invite-title"><h2 id="invite-title">Invitations</h2><div class="row-actions">{#if liveDetail.session.kind==="match"}<label>Leg <select bind:value={liveInviteLeg}><option value={1}>1</option><option value={2}>2</option></select></label>{/if}<label>Tabiya handle<input bind:value={liveInviteHandle} placeholder="training-partner"/></label><label>External challenge URL<input type="url" bind:value={liveInviteUrl} placeholder="https://lichess.org/…"/></label><button type="button" disabled={!liveInviteHandle&&!liveInviteUrl} aria-describedby={!liveInviteHandle&&!liveInviteUrl?"invite-disabled":undefined} onclick={()=>void inviteLiveParticipant()}>Create invitation</button></div>{#if !liveInviteHandle&&!liveInviteUrl}<p id="invite-disabled" class="honest">Enter a local handle, an external HTTPS challenge, or both.</p>{/if}<ul>{#each liveDetail.invitations as invitation}<li>{invitation.leg===null?"Session":`Leg ${invitation.leg}`} · {invitation.invitedHandle?`@${invitation.invitedHandle}`:invitation.externalChallengeUrl} · {invitation.state}</li>{:else}<li>No invitations yet.</li>{/each}</ul></section>{/if}
        {#if liveDetail.session.kind==="match"&&!liveDetail.match}<section aria-labelledby="arena-title"><h2 id="arena-title">Position Arena legs</h2><p class="honest">Import one mainline PGN per leg. Its starting position must exactly match this run.</p>{#if liveDetail.role==="host"}<label>Leg <select bind:value={liveArenaLeg}><option value={1}>1</option><option value={2}>2</option></select></label><label>PGN<textarea rows="8" bind:value={liveArenaPgn} placeholder={'[SetUp "1"]\n[FEN "…"]\n\n1. …'}></textarea></label><button type="button" disabled={!liveArenaPgn||!liveWriterId(liveDetail.session.runId)} aria-describedby={!liveWriterId(liveDetail.session.runId)?"arena-readonly":undefined} onclick={()=>void importLiveArenaLeg()}>Import leg</button>{#if !liveWriterId(liveDetail.session.runId)}<p id="arena-readonly" class="honest">Open the shared board on this device before importing a leg.</p>{/if}{/if}<ol>{#each liveDetail.legs as leg}<li>Leg {leg.leg}: {leg.branchId===null?"awaiting PGN":`${leg.result??"*"} · branch ${leg.branchId}`}</li>{/each}</ol></section>{/if}
        <div class="row-actions"><button type="button" onclick={()=>navigate(routePath({name:"run",runId:liveDetail!.session.runId}))}>Open shared board</button><button type="button" onclick={()=>navigate(routePath({name:"live-overlay",runId:liveDetail!.session.runId}))}>Open overlay</button></div>
      {:else}<h1 id="session-title">Session unavailable.</h1>{/if}
    </main>
  {:else if route.name === "live-overlay"}
    <main class="live-overlay" aria-label="Live session overlay">
      {#if session.runState}{@const node=session.runState.run.nodes.find((candidate)=>candidate.id===session.runState!.run.activeCursor.nodeId)}{#if node}<Chessboard fen={node.fen} startSide={session.runState.run.start.side} overlays={relayedMarkShapes(activeLiveDetail)} disabled={true} onMove={()=>{}}/><aside><p class="eyebrow">Tabiya live</p><h1>{node.objectiveState}</h1><p>{session.runState.run.branches.length} branches</p>{#if activeLiveDetail && markAttribution(activeLiveDetail)}<p>{markAttribution(activeLiveDetail)}</p>{/if}{#if activeLiveDetail?.vote}<p>{activeLiveDetail.vote.window.prompt}</p><ul>{#each activeLiveDetail.vote.tally as item}<li>{item.label}: {item.count}</li>{/each}</ul><p>{voteAttribution(activeLiveDetail)}</p>{/if}{#if session.runState.withheld}<p>Host is ahead; evidence is withheld until this run discloses.</p>{/if}</aside>{/if}{:else}<p role="alert">Overlay run unavailable.</p>{/if}
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
        <ul>{#each runs as run}<li><button class="link-button" type="button" onclick={() => navigate(routePath({ name: "run", runId: run.id }))}>{run.title}</button> <small>{run.branchCount} branches</small> <button type="button" onclick={() => void exportRunPgn(run.id)}>Download PGN</button> {#if run.viewerRole === "host"}<button type="button" onclick={() => void reviewRunDeletion(run)}>Delete this run</button>{/if}</li>{:else}<li>No saved games yet.</li>{/each}</ul>
        {#if runArtifactError}<p role="alert">{runArtifactError}</p>{/if}
        {#if runDeletion}
          <aside class="deletion-card">
            <StatusAnnouncement message={`Deletion effects loaded for ${runDeletion.run.title}. Review the listed permanent, retained, and revoked records before confirming.`} />
            <h3>Delete {runDeletion.run.title}?</h3>
            {#each runDeletion.preview.hardDelete as effect}<p>{effect.label}</p>{/each}
            {#each runDeletion.preview.tombstone as effect}<p>{effect.label}</p>{/each}
            {#each runDeletion.preview.revoke as effect}<p>{effect.label}</p>{/each}
            <p class="honest">{runDeletion.preview.backupNotice}</p>
            <div class="row-actions"><button type="button" onclick={() => void confirmRunDeletion()}>Confirm deletion</button><button type="button" onclick={() => runDeletion = undefined}>Cancel</button></div>
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
  .auth-gate { width: min(32rem, calc(100% - 2rem)); margin: 10vh auto; }
  .auth-gate h1 { font: 500 clamp(2rem, 6vw, 4rem)/1 var(--display-font); }
  .auth-gate form { display: grid; gap: 1rem; margin: 2rem 0 1rem; }
  .auth-gate label { display: grid; gap: 0.35rem; }
  .auth-gate input { padding: 0.7rem; border: 1px solid var(--line); border-radius: 0.5rem; }
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
  .repertoire-form{display:grid;gap:.65rem;max-width:44rem;padding:1rem;border:1px solid var(--line);border-radius:.8rem;background:var(--panel)}
  .repertoire-form label{display:grid;gap:.25rem}.repertoire-form input,.repertoire-form select,.repertoire-form textarea{padding:.6rem;border:1px solid var(--line);border-radius:.4rem;background:var(--paper);color:var(--ink)}
  .repertoire-card{display:grid;gap:.6rem}.gap-results{grid-column:1/-1;border-top:1px solid var(--line);padding-top:.6rem}.gap-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.4rem 0}
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
  .studio-grid { display: grid; grid-template-columns: minmax(12rem, 18rem) minmax(0, 1fr); gap: 1rem; }
  .pack-studio-grid { grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr) minmax(16rem, 22rem); }
  .studio-grid aside { display: grid; align-content: start; gap: 0.5rem; overflow: auto; }
  .studio-grid section { display: grid; gap: 0.5rem; min-width: 0; }
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
    .studio-grid, .vocabulary-status-grid, .live-overlay { grid-template-columns: 1fr; }
    .assignment-grid article { grid-template-columns: 1fr; }
    .live-overlay :global(.board-shell) { width: calc(100% - 1rem); justify-self: center; }
    .row-actions { flex-wrap: wrap; }
  }
</style>
