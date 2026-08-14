<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from "svelte";

  import DrillScreen from "./lib/DrillScreen.svelte";
  import Chessboard from "./lib/Chessboard.svelte";
  import PackList from "./lib/PackList.svelte";
  import JustPlayStarter from "./lib/JustPlayStarter.svelte";
  import GameStoryScreen from "./lib/GameStoryScreen.svelte";
  import ShellFrame from "./lib/ShellFrame.svelte";
  import ShellKeyboardHelp from "./lib/ShellKeyboardHelp.svelte";
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
    type PackDraft,
    type ShapeDraft,
    type LiveSession,
    type LiveSessionDetail,
    type SessionJournalEntry,
    type SessionKind,
    type BoardControl,
    type GameStory,
    type ProgressMilestone,
    type RunDerivationPage,
    ApiError,
  } from "./lib/api.js";
  import { HistoryRouter, routePath, type AppRoute } from "./lib/router.js";
  import { ShellKeyboardDispatcher } from "./lib/keyboard.js";
  import {
    DrillSessionController,
    type DrillSessionState,
  } from "./lib/session-controller.js";
  import { WriterSession, type KeyValueStorage } from "./lib/writer-session.js";

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

  const controller = new DrillSessionController(api, {
    ...(storage === undefined ? {} : { storage }),
    onRunStarted: ({ runId }) => router.navigate(routePath({ name: "run", runId })),
  });
  let route: AppRoute = $state(router.route);
  let session: DrillSessionState = $state(controller.state);
  let packs: readonly PackSummary[] = $state([]);
  let runs: readonly RunSummary[] = $state([]);
  let attempts: readonly ProgressAttempt[] = $state([]);
  let dueSchedules: readonly ProgressSchedule[] = $state([]);
  let milestones: readonly ProgressMilestone[] = $state([]);
  let derivations: RunDerivationPage | undefined = $state();
  let drafts: readonly PackDraft[] = $state([]);
  let studioJson = $state("");
  let selectedDraftId: string | undefined = $state();
  let shapeDrafts: readonly ShapeDraft[] = $state([]);
  let shapeStudioJson = $state("");
  let selectedShapeDraftId: string | undefined = $state();
  let shapeProbeFen = $state("");
  let shapeProbeResult: boolean | undefined = $state();
  let liveSessions: readonly LiveSession[] = $state([]);
  let liveDetail: LiveSessionDetail | undefined = $state();
  let activeLiveDetail: LiveSessionDetail | undefined = $state();
  let liveJournal: readonly SessionJournalEntry[] = $state([]);
  let liveKind: SessionKind = $state("academy");
  let liveBoardControl: BoardControl = $state("host_directed");
  let liveProposalMove = $state("");
  let liveOfferHandle = $state("");
  let liveVoteMoveA = $state("");
  let liveVoteMoveB = $state("");
  let liveInviteHandle = $state("");
  let liveInviteUrl = $state("");
  let liveInviteLeg: 1 | 2 = $state(1);
  let liveArenaLeg: 1 | 2 = $state(1);
  let liveArenaPgn = $state("");
  let importPgn = $state("");
  let importUrl = $state("");
  let importSide: "white" | "black" = $state("white");
  let importError: string | undefined = $state();
  let story: GameStory | undefined = $state();
  let capabilities: Capabilities | undefined = $state();
  let routeLoading = $state(true);
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

  const keyboardDispatcher = new ShellKeyboardDispatcher({
    navigate,
    focusPrimaryNavigation,
    openHelp: openShellHelp,
    closeHelp: closeShellHelp,
    helpIsOpen: () => shellHelpOpen,
  });

  let recentRun = $derived(runs[0]);
  let runContext = $derived(
    route.name === "run" && session.runState
      ? {
          title: (session.pack?.title as string | undefined) ?? "Just Play",
          access: session.runState.access,
          busy: session.busy,
        }
      : undefined,
  );

  function navigate(path: string): void {
    if (shellHelpOpen) closeShellHelp();
    router.navigate(path);
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
      if (next.name === "home" || next.name === "review") {
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
        [attempts, dueSchedules, milestones] = await Promise.all([
          api.progress?.() ?? Promise.resolve([]),
          api.dueProgress?.() ?? Promise.resolve([]),
          api.milestones?.() ?? Promise.resolve([]),
        ]);
      } else if (next.name === "create") {
        [drafts, shapeDrafts] = await Promise.all([api.packDrafts?.() ?? Promise.resolve([]), api.shapeDrafts?.() ?? Promise.resolve([])]);
      } else if (next.name === "live") {
        [liveSessions,runs]=await Promise.all([api.liveSessions?.()??Promise.resolve([]),api.runs(50,0)]);
      } else if (next.name === "live-session") {
        [liveDetail,liveJournal]=await Promise.all([api.liveSession?.(next.sessionId),api.sessionJournal?.(next.sessionId).then((page)=>page.entries)??Promise.resolve([])]);
      } else if (next.name === "live-overlay" && session.runState?.run.id !== next.runId) {
        await controller.resume(next.runId);
        const related=(await (api.liveSessions?.()??Promise.resolve([]))).find((item)=>item.runId===next.runId);
        activeLiveDetail=related===undefined?undefined:await api.liveSession?.(related.id);
      } else if (
        next.name === "run" &&
        session.runState?.run.id !== next.runId
      ) {
        await controller.resume(next.runId);
        derivations = await (api.runDerivations?.(next.runId) ?? Promise.resolve(undefined));
        const related=(await (api.liveSessions?.()??Promise.resolve([]))).find((item)=>item.runId===next.runId);
        activeLiveDetail=related===undefined?undefined:await api.liveSession?.(related.id);
      }
    } catch (error) {
      if (generation === loadGeneration) {
        routeError = error instanceof Error ? error.message : String(error);
      }
    } finally {
      if (generation === loadGeneration) routeLoading = false;
    }
  }

  function startRouter(): void {
    if (routerStarted) return;
    routerStarted = true;
    router.start();
  }

  function syncLivePolling(next:AppRoute):void{
    if(livePoll!==undefined){clearInterval(livePoll);livePoll=undefined;}
    if(next.name!=="live-session"&&next.name!=="live-overlay")return;
    livePoll=setInterval(()=>void (async()=>{
      const sessionId=next.name==="live-session"?next.sessionId:activeLiveDetail?.session.id;
      if(sessionId===undefined)return;
      const detail=await api.liveSession?.(sessionId);if(detail!==undefined){if(next.name==="live-session")liveDetail=detail;else activeLiveDetail=detail;}
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

  async function enterStoryMoment(runId: string, nodeId: string): Promise<void> {
    const writer = WriterSession.peek(runId, storage);
    if (writer === undefined) throw new Error("This device does not hold the imported run writer session");
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

  async function signOut(): Promise<void> {
    await api.logout?.();
    controller.stopSession();
    learner = undefined;
    router.stop?.();
    routerStarted = false;
  }

  async function deleteAccount(): Promise<void> {
    const password = window.prompt("Re-enter your password. Runs are reassigned, not deleted.");
    if (password === null) return;
    await api.deleteAccount?.(password);
    controller.stopSession();
    learner = undefined;
    router.stop?.();
    routerStarted = false;
  }

  async function exportPgn(branchIds?: readonly string[]): Promise<void> {
    const download = await controller.exportPgn(branchIds);
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

  async function createDraft(): Promise<void> {
    const document = JSON.parse(studioJson) as unknown;
    const draft = await api.createPackDraft?.(document);
    if (draft !== undefined) {
      drafts = [draft, ...drafts];
      selectedDraftId = draft.id;
      studioJson = JSON.stringify(draft.document, null, 2);
    }
  }

  async function saveDraft(): Promise<void> {
    const draft = drafts.find((candidate) => candidate.id === selectedDraftId);
    if (draft === undefined) return;
    const saved = await api.updatePackDraft?.(draft.id, draft.digest, JSON.parse(studioJson));
    if (saved !== undefined) drafts = drafts.map((candidate) => candidate.id === saved.id ? saved : candidate);
  }

  async function registerDraft(): Promise<void> {
    const draft = drafts.find((candidate) => candidate.id === selectedDraftId);
    if (draft === undefined) return;
    await api.registerPackDraft?.(draft.id);
    drafts = await (api.packDrafts?.() ?? Promise.resolve([]));
  }

  async function createShapeDraft(): Promise<void> {
    const draft = await api.createShapeDraft?.(JSON.parse(shapeStudioJson));
    if (draft !== undefined) { shapeDrafts = [draft, ...shapeDrafts]; selectedShapeDraftId = draft.id; shapeStudioJson = JSON.stringify(draft.document, null, 2); }
  }
  async function saveShapeDraft(): Promise<void> {
    const draft = shapeDrafts.find((candidate) => candidate.id === selectedShapeDraftId); if (draft === undefined) return;
    const saved = await api.updateShapeDraft?.(draft.id, draft.digest, JSON.parse(shapeStudioJson));
    if (saved !== undefined) shapeDrafts = shapeDrafts.map((candidate) => candidate.id === saved.id ? saved : candidate);
  }
  async function lintShapeDraft(): Promise<void> {
    const draft = shapeDrafts.find((candidate) => candidate.id === selectedShapeDraftId); if (draft === undefined) return;
    const validation = await api.lintShapeDraft?.(draft.id, JSON.parse(shapeStudioJson), shapeProbeFen);
    shapeProbeResult = validation?.probeMatches;
  }
  async function registerShapeDraft(): Promise<void> {
    if (selectedShapeDraftId === undefined) return; await api.registerShapeDraft?.(selectedShapeDraftId);
    shapeDrafts = await (api.shapeDrafts?.() ?? Promise.resolve([]));
  }

  async function createLive(runId:string):Promise<void>{const created=await api.createLiveSession?.({runId,kind:liveKind,title:`${liveKind} session`,boardControl:liveBoardControl});if(created){liveSessions=[created,...liveSessions];navigate(routePath({name:"live-session",sessionId:created.id}));}}
  function liveWriterId(runId:string):string|undefined{return WriterSession.peek(runId,storage)?.writerId;}
  async function submitLiveProposal():Promise<void>{if(!liveDetail||!liveProposalMove)return;await api.proposeMove?.(liveDetail.session.id,liveDetail.activeNodeId,liveProposalMove);liveDetail=await api.liveSession?.(liveDetail.session.id);liveProposalMove="";}
  async function offerLiveBoard():Promise<void>{if(!liveDetail||!liveOfferHandle)return;const writer=liveWriterId(liveDetail.session.runId);if(!writer)return;await api.boardControl?.(liveDetail.session.id,writer,"offer",liveOfferHandle);liveDetail=await api.liveSession?.(liveDetail.session.id);}
  async function openLiveVote():Promise<void>{if(!liveDetail||!liveVoteMoveA||!liveVoteMoveB)return;await api.openVote?.(liveDetail.session.id,{nodeId:liveDetail.activeNodeId,prompt:"Which continuation?",options:[{moveUci:liveVoteMoveA,label:liveVoteMoveA},{moveUci:liveVoteMoveB,label:liveVoteMoveB}],durationSeconds:60});liveDetail=await api.liveSession?.(liveDetail.session.id);}
  async function inviteLiveParticipant():Promise<void>{if(!liveDetail||(!liveInviteHandle&&!liveInviteUrl))return;await api.inviteToSession?.(liveDetail.session.id,{...(liveDetail.session.kind==="match"?{leg:liveInviteLeg}:{}),...(liveInviteHandle?{handle:liveInviteHandle}:{}),...(liveInviteUrl?{externalChallengeUrl:liveInviteUrl}:{})});liveDetail=await api.liveSession?.(liveDetail.session.id);liveInviteHandle="";liveInviteUrl="";}
  async function importLiveArenaLeg():Promise<void>{if(!liveDetail||!liveArenaPgn)return;const writer=liveWriterId(liveDetail.session.runId);if(!writer)return;await api.importArenaLeg?.(liveDetail.session.id,liveArenaLeg,liveArenaPgn,writer);liveDetail=await api.liveSession?.(liveDetail.session.id);liveArenaPgn="";}

  onMount(() => {
    window.addEventListener("tabiya:unauthenticated", onUnauthenticated);
    unsubscribeController = controller.subscribe((next) => (session = next));
    unsubscribeRouter = router.subscribe((next) => {
      route = next;
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
  });

  onDestroy(() => {
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
<ShellFrame {route} {runContext} {learner} chrome={route.name !== "live-overlay"} onNavigate={navigate} onSignOut={() => void signOut()} onDeleteAccount={() => void deleteAccount()}>
  {#if routeLoading}
    <main class="shell-view" aria-busy="true"><p>Loading Tabiya…</p></main>
  {:else if routeError}
    <main class="shell-view"><h1>Something interrupted the route.</h1><p role="alert">{routeError}</p></main>
  {:else if route.name === "home"}
    <main class="shell-view home" aria-labelledby="home-title">
      <p class="eyebrow">Tabiya / rehearsal workspace</p>
      <h1 id="home-title">Return to the decision, not the answer.</h1>
      {#if recentRun}
        <section class="resume-card" aria-labelledby="resume-title">
          <p class="eyebrow">Resume</p>
          <h2 id="resume-title">{recentRun.title}</h2>
          <p>{recentRun.branchCount} {recentRun.branchCount === 1 ? "branch" : "branches"} · {recentRun.objectiveState} · {readableDate(recentRun.updatedAt)}</p>
          <p class="access">
            {boardStance(recentRun) === "you" ? "You hold the board." : boardStance(recentRun) === "unclaimed" ? "No one holds the board." : `@${recentRun.leaseHeldBy.handle} holds the board.`}
            {recentRun.viewerRole === "spectator" ? " You can follow read-only." : " You may take the board."}
          </p>
          <button type="button" onclick={() => navigate(routePath({ name: "run", runId: recentRun.id }))}>Resume run</button>
        </section>
      {:else}
        <p>No previous run yet. Start with a rehearsal pack.</p>
      {/if}
      <button class="primary" type="button" onclick={() => navigate("/play")}>Go to Play</button>
    </main>
  {:else if route.name === "play"}
    <div class="play-surface">
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
        comparison={session.comparison}
        comparisonBranchIds={session.comparisonBranchIds}
        busy={session.busy}
        error={session.error}
        {capabilities}
        viewerRole={session.viewer?.role}
        assistanceStorage={storage}
        onMove={(uci) => controller.move(uci)}
        onRewind={(target) => controller.rewind(target)}
        onFork={(label, intent) => controller.fork(label, intent)}
        onSwitchBranch={(nodeId) => controller.switchBranch(nodeId)}
        onCompare={(branchIds) => controller.compare(branchIds)}
        onCloseCompare={() => controller.closeCompare()}
        onContinueCheckpoint={() => controller.continueCheckpoint()}
        onPrediction={(uci) => controller.recordPrediction(uci)}
        onExport={exportPgn}
        onStop={() => navigate("/play")}
        onHumanSplit={(nodeId) => api.humanSplit(session.runState!.run.id, nodeId)}
        onCorpus={(nodeId) => api.corpus(session.runState!.run.id, nodeId)}
        onVoice={(nodeId, scope) => api.voice(session.runState!.run.id, nodeId, scope)}
        onCreateGroup={(input) => controller.createGroup(input)}
        onAnalyzeMissing={(nodeIds) => controller.analyzeMissingEvidence(nodeIds)}
        onStory={session.runState.run.events.some((event) => event.type === "outcome.reached") ? () => navigate(routePath({ name: "story", runId: session.runState!.run.id })) : undefined}
        onFlip={(nodeId) => flipRun(session.runState!.run.id, nodeId)}
        registerKeyboardRegion={keyboardDispatcher.registerRegion}
      />
      {#if activeLiveDetail}
        <aside class="session-banner" aria-label="Live session rail"><strong>{activeLiveDetail.session.title}</strong><span>{activeLiveDetail.role} · {activeLiveDetail.proposals.filter((item)=>item.status==="open").length} open proposals{activeLiveDetail.vote ? ` · ${activeLiveDetail.vote.total} votes` : ""}</span><button type="button" onclick={()=>navigate(routePath({name:"live-session",sessionId:activeLiveDetail!.session.id}))}>Session</button></aside>
      {/if}
      {#if session.runState.run.sessionKind === "imported"}
        <aside class="session-banner" aria-label="Imported game story"><strong>Imported game</strong><span>The original continuation and your branches share one run.</span><button type="button" onclick={() => navigate(routePath({ name: "story", runId: session.runState!.run.id }))}>Story</button></aside>
      {/if}
      {#if session.runState.run.sessionKind !== "imported" && session.runState.run.events.some((event) => event.type === "outcome.reached")}
        <aside class="session-banner" aria-label="Run story"><strong>Attempt complete</strong><span>Your recorded moments are ready to read and replay.</span><button type="button" onclick={() => navigate(routePath({ name: "story", runId: session.runState!.run.id }))}>Story</button></aside>
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
            <article>
              <div>
                <h3>{attempt.packId ?? "Position rehearsal"} · attempt {attempt.attemptNo || "—"}</h3>
                <p>{attempt.graded ? attempt.verdict : "not graded"} · {attempt.userPlyCount} learner plies · {readableDate(attempt.endedAt)}</p>
              </div>
              <button type="button" onclick={() => navigate(routePath({ name: "run", runId: attempt.runId }))}>Open run</button>
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
      <div class="studio-grid">
        <aside aria-label="Your drafts">
          <h2>Your drafts</h2>
          {#each drafts as draft}
            <button type="button" onclick={() => { selectedDraftId = draft.id; studioJson = JSON.stringify(draft.document, null, 2); }}>
              {draft.packId} · {draft.state}
            </button>
          {:else}<p>No database drafts yet. Paste a v0.8 pack to begin.</p>{/each}
        </aside>
        <section>
          <label for="studio-json">Pack JSON</label>
          <textarea id="studio-json" bind:value={studioJson} spellcheck="false"></textarea>
          <div class="row-actions">
            <button type="button" onclick={() => void createDraft()}>Create draft</button>
            <button type="button" disabled={!selectedDraftId} aria-describedby={!selectedDraftId ? "save-disabled" : undefined} onclick={() => void saveDraft()}>Save</button>
            <button type="button" disabled={!selectedDraftId} aria-describedby={!selectedDraftId ? "register-disabled" : undefined} onclick={() => void registerDraft()}>Register community pack</button>
          </div>
          {#if !selectedDraftId}<p id="save-disabled" class="honest">Select or create a draft before saving.</p><p id="register-disabled" class="honest">Select a valid draft before registration.</p>{/if}
          {#if selectedDraftId}
            {@const selected = drafts.find((candidate) => candidate.id === selectedDraftId)}
            {#if selected}<ul>{#each selected.validation.issues as issue}<li><code>{issue.path}</code> {issue.code}: {issue.message}</li>{:else}<li>Validation clean.</li>{/each}</ul>{/if}
          {/if}
        </section>
      </div>
      <p class="honest">Community registration does not make a pack official. Official packs enter through git and the deployment image.</p>
      <h2>Shape library editor</h2>
      <div class="studio-grid">
        <aside aria-label="Your shape drafts">
          <h3>Your shape drafts</h3>
          {#each shapeDrafts as draft}<button type="button" onclick={() => { selectedShapeDraftId = draft.id; shapeStudioJson = JSON.stringify(draft.document, null, 2); }}>{draft.shapeId} · {draft.state}</button>{:else}<p>No shape drafts yet.</p>{/each}
        </aside>
        <section>
          <label for="shape-studio-json">Shape JSON</label><textarea id="shape-studio-json" bind:value={shapeStudioJson} spellcheck="false"></textarea>
          <label>Probe FEN <input bind:value={shapeProbeFen} placeholder="Optional position to test the trigger" /></label>
          <div class="row-actions">
            <button type="button" onclick={() => void createShapeDraft()}>Create shape draft</button>
            <button type="button" disabled={!selectedShapeDraftId} aria-describedby={!selectedShapeDraftId ? "shape-selection-required" : undefined} onclick={() => void saveShapeDraft()}>Save shape</button>
            <button type="button" disabled={!selectedShapeDraftId} aria-describedby={!selectedShapeDraftId ? "shape-selection-required" : undefined} onclick={() => void lintShapeDraft()}>Lint + probe</button>
            <button type="button" disabled={!selectedShapeDraftId} aria-describedby={!selectedShapeDraftId ? "shape-selection-required" : undefined} onclick={() => void registerShapeDraft()}>Register community shape</button>
          </div>
          {#if shapeProbeResult !== undefined}<p role="status">Probe trigger: {shapeProbeResult ? "matches" : "does not match"}</p>{/if}
          {#if !selectedShapeDraftId}<p id="shape-selection-required" class="honest">Select or create a shape draft first.</p>{/if}
          {#if selectedShapeDraftId}{@const selectedShape=shapeDrafts.find((candidate)=>candidate.id===selectedShapeDraftId)}{#if selectedShape}<ul>{#each selectedShape.validation.issues as issue}<li><code>{issue.path}</code> {issue.code}: {issue.message}</li>{:else}<li>Validation clean.</li>{/each}</ul>{/if}{/if}
        </section>
      </div>
      <p class="honest">Shape entries name reusable patterns and plans. They do not prescribe a move in the current position.</p>
    </main>
  {:else if route.name === "live"}
    <main class="shell-view" aria-labelledby="live-title">
      <p class="eyebrow">Live / shared rehearsal</p><h1 id="live-title">Rehearse with other people.</h1>
      <div class="row-actions"><label>Kind <select bind:value={liveKind}><option value="stream">Stream</option><option value="academy">Academy</option><option value="match">Position Arena</option></select></label><label>Board <select bind:value={liveBoardControl}><option value="host_directed">Host directed</option><option value="free_claim">Free claim</option><option value="rotation">Rotation</option></select></label></div>
      <section><h2>Your sessions</h2><div class="item-list">{#each liveSessions as item}<article><div><h3>{item.title}</h3><p>{item.kind} · {item.boardControl}{item.scheduledFor ? ` · ${readableDate(item.scheduledFor)}` : ""}</p></div><button type="button" onclick={()=>navigate(routePath({name:"live-session",sessionId:item.id}))}>Open</button></article>{:else}<p>No live sessions yet.</p>{/each}</div></section>
      <section><h2>Start from a run</h2><div class="item-list">{#each runs as item}<article><div><h3>{item.title}</h3><p>{item.viewerRole === "host" ? "Ready to host" : "Only a host can create a session"}</p></div><button type="button" disabled={item.viewerRole!=="host"} aria-describedby={item.viewerRole!=="host"?`live-disabled-${item.id}`:undefined} onclick={()=>void createLive(item.id)}>Create {liveKind}</button>{#if item.viewerRole!=="host"}<span id={`live-disabled-${item.id}`} class="honest">Host role required.</span>{/if}</article>{/each}</div></section>
      <p class="honest">Vote tallies are advisory. Chat identity is only as trustworthy as the configured adapter.</p>
    </main>
  {:else if route.name === "live-session"}
    <main class="shell-view" aria-labelledby="session-title">
      {#if liveDetail}<p class="eyebrow">Live / {liveDetail.session.kind}</p><h1 id="session-title">{liveDetail.session.title}</h1><p>{liveDetail.session.boardControl} · your role: {liveDetail.role}</p>
        <div class="studio-grid"><section><h2>Members</h2><p>@{liveDetail.leaseHeldBy.handle} holds the board.</p><ul>{#each liveDetail.grants as grant}<li>@{grant.handle} — {grant.role}</li>{/each}</ul>{#if liveDetail.role==="host"}<label>Offer board to handle <input bind:value={liveOfferHandle}/></label><button type="button" disabled={!liveOfferHandle||!liveWriterId(liveDetail.session.runId)} aria-describedby={!liveWriterId(liveDetail.session.runId)?"offer-readonly":undefined} onclick={()=>void offerLiveBoard()}>Offer board</button>{#if !liveWriterId(liveDetail.session.runId)}<p id="offer-readonly" class="honest">Open the shared board on this device before offering possession.</p>{/if}{/if}<h2>Proposals</h2>{#if liveDetail.role!=="spectator"}<div class="row-actions"><label>Move (UCI)<input bind:value={liveProposalMove} placeholder="e2e4"/></label><button type="button" disabled={!liveProposalMove} aria-describedby={!liveProposalMove?"proposal-disabled":undefined} onclick={()=>void submitLiveProposal()}>Propose</button></div>{#if !liveProposalMove}<p id="proposal-disabled" class="honest">Enter a legal move from the active position.</p>{/if}{/if}<ul>{#each liveDetail.proposals as proposal}<li><code>{proposal.moveUci}</code> · {proposal.status}</li>{:else}<li>No proposals yet.</li>{/each}</ul></section><section><h2>Vote</h2>{#if liveDetail.role==="host"}<div class="row-actions"><label>Option A<input bind:value={liveVoteMoveA} placeholder="e2e4"/></label><label>Option B<input bind:value={liveVoteMoveB} placeholder="d2d4"/></label><button type="button" disabled={!liveVoteMoveA||!liveVoteMoveB} aria-describedby={!liveVoteMoveA||!liveVoteMoveB?"vote-disabled":undefined} onclick={()=>void openLiveVote()}>Open vote</button></div>{#if !liveVoteMoveA||!liveVoteMoveB}<p id="vote-disabled" class="honest">Two legal UCI moves are required.</p>{/if}{/if}{#if liveDetail.vote}<p>{liveDetail.vote.window.prompt} · {liveDetail.vote.window.state}</p><ul>{#each liveDetail.vote.tally as item}<li>{item.label}: {item.count}</li>{/each}</ul>{:else}<p>No vote window is open.</p>{/if}<h2>Possession journal</h2><ol>{#each liveJournal as entry}<li>{entry.kind} · run seq {entry.runSeq ?? "—"}</li>{/each}</ol></section></div>
        {#if liveDetail.role==="host"}<section aria-labelledby="invite-title"><h2 id="invite-title">Invitations</h2><div class="row-actions">{#if liveDetail.session.kind==="match"}<label>Leg <select bind:value={liveInviteLeg}><option value={1}>1</option><option value={2}>2</option></select></label>{/if}<label>Tabiya handle<input bind:value={liveInviteHandle} placeholder="training-partner"/></label><label>External challenge URL<input type="url" bind:value={liveInviteUrl} placeholder="https://lichess.org/…"/></label><button type="button" disabled={!liveInviteHandle&&!liveInviteUrl} aria-describedby={!liveInviteHandle&&!liveInviteUrl?"invite-disabled":undefined} onclick={()=>void inviteLiveParticipant()}>Create invitation</button></div>{#if !liveInviteHandle&&!liveInviteUrl}<p id="invite-disabled" class="honest">Enter a local handle, an external HTTPS challenge, or both.</p>{/if}<ul>{#each liveDetail.invitations as invitation}<li>{invitation.leg===null?"Session":`Leg ${invitation.leg}`} · {invitation.invitedHandle?`@${invitation.invitedHandle}`:invitation.externalChallengeUrl} · {invitation.state}</li>{:else}<li>No invitations yet.</li>{/each}</ul></section>{/if}
        {#if liveDetail.session.kind==="match"}<section aria-labelledby="arena-title"><h2 id="arena-title">Position Arena legs</h2><p class="honest">Import one mainline PGN per leg. Its starting position must exactly match this run.</p>{#if liveDetail.role==="host"}<label>Leg <select bind:value={liveArenaLeg}><option value={1}>1</option><option value={2}>2</option></select></label><label>PGN<textarea rows="8" bind:value={liveArenaPgn} placeholder={'[SetUp "1"]\n[FEN "…"]\n\n1. …'}></textarea></label><button type="button" disabled={!liveArenaPgn||!liveWriterId(liveDetail.session.runId)} aria-describedby={!liveWriterId(liveDetail.session.runId)?"arena-readonly":undefined} onclick={()=>void importLiveArenaLeg()}>Import leg</button>{#if !liveWriterId(liveDetail.session.runId)}<p id="arena-readonly" class="honest">Open the shared board on this device before importing a leg.</p>{/if}{/if}<ol>{#each liveDetail.legs as leg}<li>Leg {leg.leg}: {leg.branchId===null?"awaiting PGN":`${leg.result??"*"} · branch ${leg.branchId}`}</li>{/each}</ol></section>{/if}
        <div class="row-actions"><button type="button" onclick={()=>navigate(routePath({name:"run",runId:liveDetail!.session.runId}))}>Open shared board</button><button type="button" onclick={()=>navigate(routePath({name:"live-overlay",runId:liveDetail!.session.runId}))}>Open overlay</button></div>
      {:else}<h1 id="session-title">Session unavailable.</h1>{/if}
    </main>
  {:else if route.name === "live-overlay"}
    <main class="live-overlay" aria-label="Live session overlay">
      {#if session.runState}{@const node=session.runState.run.nodes.find((candidate)=>candidate.id===session.runState!.run.activeCursor.nodeId)}{#if node}<Chessboard fen={node.fen} startSide={session.runState.run.start.side} disabled={true} onMove={()=>{}}/><aside><p class="eyebrow">Tabiya live</p><h1>{node.objectiveState}</h1><p>{session.runState.run.branches.length} branches</p>{#if activeLiveDetail?.vote}<p>{activeLiveDetail.vote.window.prompt}</p><ul>{#each activeLiveDetail.vote.tally as item}<li>{item.label}: {item.count}</li>{/each}</ul>{/if}{#if session.runState.withheld}<p>Host is ahead; evidence is withheld until this run discloses.</p>{/if}</aside>{/if}{:else}<p role="alert">Overlay run unavailable.</p>{/if}
    </main>
  {:else if route.name === "library"}
    <main class="shell-view" aria-labelledby="library-title">
      <p class="eyebrow">Library</p><h1 id="library-title">Packs and run artifacts</h1>
      <section><h2>Rehearsal packs</h2><ul>{#each packs as pack}<li>{pack.title} <small>{pack.reviewStatus.replaceAll("_", " ")}</small></li>{:else}<li>No packs available.</li>{/each}</ul></section>
      <section><h2>Runs with exportable PGN</h2><ul>{#each runs as run}<li><button class="link-button" type="button" onclick={() => navigate(routePath({ name: "run", runId: run.id }))}>{run.title}</button> <small>{run.branchCount} branches</small></li>{:else}<li>No run artifacts yet.</li>{/each}</ul></section>
    </main>
  {:else if route.name === "settings"}
    <main class="shell-view" aria-labelledby="settings-title">
      <p class="eyebrow">Settings</p><h1 id="settings-title">This deployment</h1>
      {#if capabilities}
        <dl class="providers">
          <div><dt>Opponent</dt><dd>{capabilities.providers.opponent}</dd></div>
          <div><dt>Judge</dt><dd>{capabilities.providers.judge}</dd></div>
          <div><dt>LLM</dt><dd>{capabilities.providers.llm}</dd></div>
        </dl>
        <h2>Surface availability</h2>
        <ul>{#each Object.entries(capabilities.surfaces) as [id, availability]}<li>{id}: {PLANNED_SURFACES.includes(id as SurfaceId) ? "planned" : availability}</li>{/each}</ul>
      {/if}
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
    color-scheme: light;
    --ink: #171713;
    --paper: #eeeade;
    --paper-soft: #e5e0d2;
    --panel: #f8f5ec;
    --muted: #6f6b61;
    --line: #cbc4b4;
    --accent: #3858c8;
    --warning: #df9d32;
    --danger: #ad3c32;
    --display-font: Iowan Old Style, Palatino Linotype, Book Antiqua, Palatino, Georgia, serif;
    --shadow: 0 0.8rem 2.5rem rgb(40 35 25 / 10%);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: var(--ink);
    background: var(--paper);
  }
  :global(html), :global(body), :global(#app) { height: 100%; overflow: hidden; }
  :global(body) {
    min-width: 20rem;
    min-height: 100vh;
    margin: 0;
    background: radial-gradient(circle at 12% 5%, rgb(255 255 255 / 65%), transparent 30rem), linear-gradient(135deg, transparent 0 58%, rgb(56 88 200 / 4%) 58% 100%), var(--paper);
  }
  :global(button), :global(input), :global(textarea) { font: inherit; }
  :global(:focus-visible) { outline: 3px solid color-mix(in srgb, var(--accent) 65%, white); outline-offset: 2px; }
  :global(::selection) { background: color-mix(in srgb, var(--accent) 25%, white); }
  .shell-view { width: min(70rem, calc(100% - 2rem)); height: 100%; margin: 0 auto; padding: clamp(2rem, 6vw, 5rem) 0; overflow: auto; }
  .play-surface{height:100%;overflow:auto;padding:1rem 0}
  .auth-gate { width: min(32rem, calc(100% - 2rem)); margin: 10vh auto; }
  .auth-gate h1 { font: 500 clamp(2rem, 6vw, 4rem)/1 var(--display-font); }
  .auth-gate form { display: grid; gap: 1rem; margin: 2rem 0 1rem; }
  .auth-gate label { display: grid; gap: 0.35rem; }
  .auth-gate input { padding: 0.7rem; border: 1px solid var(--line); border-radius: 0.5rem; }
  .claim-banner { position: fixed; z-index: 20; top: 4rem; right: 1rem; display: flex; gap: 0.7rem; align-items: center; padding: 0.6rem; background: var(--panel); border: 1px solid var(--line); border-radius: 0.7rem; }
  .session-banner { position: fixed; z-index: 21; right: 1rem; bottom: 1rem; display: grid; gap: 0.25rem; padding: 0.7rem; max-width: 18rem; border: 1px solid var(--line); border-radius: 0.7rem; background: var(--panel); box-shadow: var(--shadow); font-size: 0.8rem; }
  .shell-view > h1 { max-width: 18ch; margin: 0.4rem 0 1rem; font: 500 clamp(2.3rem, 6vw, 5rem)/0.96 var(--display-font); letter-spacing: -0.045em; }
  .eyebrow { color: var(--accent); font: 700 0.72rem/1.2 ui-monospace, monospace; letter-spacing: 0.12em; text-transform: uppercase; }
  .home > h1 { max-width: 15ch; }
  .resume-card { max-width: 42rem; margin: 2.5rem 0 1rem; padding: 1.4rem; border: 1px solid var(--line); border-radius: 1rem; background: var(--panel); box-shadow: var(--shadow); }
  .resume-card h2, .item-list h2 { margin: 0.2rem 0; font: 500 1.5rem var(--display-font); }
  .resume-card p, .item-list p { color: var(--muted); }
  .access, .honest { font-size: 0.88rem; }
  button { padding: 0.72rem 0.9rem; border: 1px solid var(--line); border-radius: 0.65rem; background: var(--panel); color: var(--ink); cursor: pointer; }
  button:hover, button:focus-visible, button.primary { border-color: var(--accent); background: var(--accent); color: white; }
  button:disabled { cursor: not-allowed; opacity: 0.55; }
  .item-list { display: grid; gap: 0.7rem; max-height: min(55dvh, 36rem); margin-top: 2rem; overflow: auto; }
  .item-list article { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem; border: 1px solid var(--line); border-radius: 0.8rem; background: var(--panel); }
  .import-game { display: grid; gap: 0.65rem; max-width: 48rem; margin: 1.5rem 0; padding: 1rem; border: 1px solid var(--line); border-radius: 0.8rem; background: var(--panel); }
  .import-game label { display: grid; gap: 0.3rem; }
  .import-game input, .import-game textarea { width: 100%; padding: 0.65rem; border: 1px solid var(--line); border-radius: 0.5rem; }
  .row-actions { display: flex; gap: 0.5rem; }
  .row-actions label { display: grid; gap: 0.25rem; }
  select { padding: 0.65rem; border: 1px solid var(--line); border-radius: 0.55rem; background: var(--panel); }
  .live-overlay { width: 100%; height: 100%; display: grid; grid-template-columns: minmax(0, min(75vh, 70vw)) minmax(12rem, 1fr); gap: 1.5rem; align-items: center; padding: 1rem; overflow: hidden; background: transparent; }
  .live-overlay aside { padding: 1rem; border-radius: 0.8rem; background: rgb(23 23 19 / 88%); color: white; }
  .studio-grid { display: grid; grid-template-columns: minmax(12rem, 18rem) minmax(0, 1fr); gap: 1rem; }
  .studio-grid aside { display: grid; align-content: start; gap: 0.5rem; overflow: auto; }
  .studio-grid section { display: grid; gap: 0.5rem; min-width: 0; }
  .studio-grid textarea { width: 100%; min-height: 42vh; padding: 0.8rem; font: 0.8rem/1.4 ui-monospace, monospace; }
  .empty-state p { max-width: 42rem; color: var(--muted); font-size: 1.05rem; }
  section + section { margin-top: 2rem; }
  li { margin: 0.45rem 0; }
  small { color: var(--muted); }
  .link-button { padding: 0; border: 0; background: transparent; color: var(--accent); }
  .link-button:hover, .link-button:focus-visible { background: transparent; color: var(--ink); }
  .providers { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.8rem; max-width: 42rem; }
  .providers div { padding: 1rem; border: 1px solid var(--line); border-radius: 0.8rem; background: var(--panel); }
  .providers dt { color: var(--muted); font-size: 0.75rem; text-transform: uppercase; }
  .providers dd { margin: 0.3rem 0 0; font: 500 1.35rem var(--display-font); }
</style>
