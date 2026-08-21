<script lang="ts">
  import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
  import type { Capabilities, CorpusPage, HumanSplitPage, ReasoningPage, RunRole, SessionKind, ShapeEntryView, VoicePage } from "./api.js";
  import { BRANCH_COLLAPSE_FLOOR, MARK_BRUSHES, MAX_COMPARISON_BRANCHES, SILENT_ASSISTANCE, branchPath, classifyPhase, collapsedBranchIds, endgameReading, feedbackDeliveryOpen, groupsFromEvents, historyFrom, liveMarkers, permittedAssistance, renderEndgameReading, renderPhaseReading, renderPivotalMarker, shapeFirings, structuralReading, transitionReading, trajectoryVerdict, type AssistanceConfig, type BranchComparison, type BranchGroup, type Decidedness, type RunMark } from "@chess-tabiya/runtime";
  import type { DrawShape } from "@lichess-org/chessground/draw";
  import { onDestroy, onMount, tick } from "svelte";

  import BranchRail from "./BranchRail.svelte";
  import CheckpointSheet from "./CheckpointSheet.svelte";
  import Chessboard from "./Chessboard.svelte";
  import CompareView from "./CompareView.svelte";
  import HonestControl from "./HonestControl.svelte";
  import KeyboardHelp from "./KeyboardHelp.svelte";
  import Timeline from "./Timeline.svelte";
  import TerminalSheet from "./TerminalSheet.svelte";
  import WhyBanner from "./WhyBanner.svelte";
  import OutcomeContext from "./OutcomeContext.svelte";
  import ShapePanel from "./ShapePanel.svelte";
  import GroupPanel from "./GroupPanel.svelte";
  import { renderEvidenceRef } from "./evidence-sentences.js";
  import { renderStructuralObservation } from "./structural-sentences.js";
  import { renderTransitionObservation } from "./transition-sentences.js";
  import { renderCorpusPage } from "./corpus-sentences.js";
  import { RECORDED_READING_GUARD } from "./recorded-reading-sentences.js";
  import type { CheckpointNotice } from "./screen-model.js";
  import {
    activeNode,
    branchCards,
    packObjective,
    packStartSide,
    timelineEntries,
    whyBanner,
  } from "./screen-model.js";
  import type { RunStateSnapshot } from "./run-state.js";
  import type { AuthoredFeedbackItem, AuthoredFeedbackPage, CreateGroupRequest } from "./api.js";
  import type { RegisterKeyboardRegion } from "./keyboard.js";
  import {
    assessmentSentence,
    checkpointResolutionSentence,
    objectiveGradeSentence,
    projectedGrading,
    resistanceSentences,
  } from "./outcome-presentation.js";
  import { assistanceProfile, loadAssistance, saveAssistance, type PreferenceStorage } from "./assistance-preference.js";
  import { runViewportSupport, type RunViewportSupport } from "./viewport-support.js";

  type RewindTarget =
    | { readonly nodeId: string }
    | { readonly checkpointId: string };

  interface Props {
    pack?: DrillPackDefinition | undefined;
    shapes?: readonly ShapeEntryView[] | undefined;
    snapshot: RunStateSnapshot;
    checkpoint?: CheckpointNotice | undefined;
    authoredFeedback?: AuthoredFeedbackPage | undefined;
    reasoning?: ReasoningPage | undefined;
    comparison?: BranchComparison | undefined;
    comparisonBranchIds?: readonly string[] | undefined;
    busy?: boolean;
    error?: string | undefined;
    capabilities?: Capabilities | undefined;
    viewerRole?: RunRole | undefined;
    boardSide?: "white" | "black" | undefined;
    assistanceStorage?: PreferenceStorage | undefined;
    liveSessionKind?: SessionKind | undefined;
    onMove: (uci: string) => void | Promise<void>;
    onRewind: (target: RewindTarget) => void | Promise<void>;
    onFork: (label?: string, intent?: string) => void | Promise<void>;
    onSwitchBranch: (leafNodeId: string) => void | Promise<void>;
    onCompare: (branchIds: readonly string[]) => void | Promise<void>;
    onClassifyBranches?: (branchIds: readonly string[]) => Promise<Readonly<Record<string, Decidedness>>>;
    onCloseCompare: () => void;
    onContinueCheckpoint: () => void | Promise<void>;
    onPrediction?: (uci: string) => void | Promise<void>;
    onReasoning?: (input: { readonly transcript?: import("@chess-tabiya/runtime").ReasoningTranscript; readonly skipped?: true }) => void | Promise<void>;
    onExport: (branchIds?: readonly string[]) => void | Promise<void>;
    onLoadMarks?: (() => Promise<readonly RunMark[]>) | undefined;
    onSaveMarks?: ((input: { readonly nodeId:string;readonly branchId:string;readonly scope:"position"|"branch";readonly shapes:readonly Pick<RunMark,"brush"|"orig"|"dest">[] }) => Promise<readonly RunMark[]>) | undefined;
    onRescopeMarks?: ((input:{readonly nodeId:string;readonly branchId:string;readonly fromScope:"position"|"branch";readonly toScope:"position"|"branch"})=>Promise<readonly RunMark[]>)|undefined;
    onStop: () => void;
    onHumanSplit?: (nodeId: string) => Promise<HumanSplitPage>;
    onCorpus?: (nodeId: string) => Promise<CorpusPage>;
    onVoice?: (nodeId: string, scope: VoicePage["scope"]) => Promise<VoicePage>;
    onCompareVoice?: (() => Promise<VoicePage>) | undefined;
    onSpeech?: (nodeId: string, scope: VoicePage["scope"]) => Promise<Blob>;
    onCreateGroup?: (input: CreateGroupRequest) => void | Promise<unknown>;
    onAnalyzeMissing?: (nodeIds: readonly string[]) => void | Promise<void>;
    onStory?: (() => void) | undefined;
    onFlip?: ((nodeId: string) => void | Promise<void>) | undefined;
    onSelectPack?: ((packId: string) => void | Promise<void>) | undefined;
    registerKeyboardRegion: RegisterKeyboardRegion;
  }

  let {
    pack,
    shapes = [],
    snapshot,
    checkpoint,
    authoredFeedback,
    reasoning,
    comparison,
    comparisonBranchIds,
    busy = false,
    error,
    capabilities,
    viewerRole = "host",
    boardSide,
    assistanceStorage,
    liveSessionKind,
    onMove,
    onRewind,
    onFork,
    onSwitchBranch,
    onCompare,
    onClassifyBranches,
    onCloseCompare,
    onContinueCheckpoint,
    onPrediction = () => {},
    onReasoning = () => {},
    onExport,
    onLoadMarks,
    onSaveMarks,
    onRescopeMarks,
    onStop,
    onHumanSplit,
    onCorpus,
    onVoice,
    onCompareVoice,
    onSpeech,
    onCreateGroup,
    onAnalyzeMissing,
    onStory,
    onFlip,
    onSelectPack,
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
  let forkOpen = $state(false);
  let checkpointPickerOpen = $state(false);
  let replaying = $state(false);
  let structuralOpen = $state(false);
  let transitionOpen = $state(false);
  let openShapeId: string | undefined = $state();
  let assistance: AssistanceConfig = $state(SILENT_ASSISTANCE);
  let openPivotalNodeId: string | undefined = $state();
  let humanSplit: HumanSplitPage | undefined = $state();
  let corpusPage: CorpusPage | undefined = $state();
  let voicePage: VoicePage | undefined = $state();
  let forkLabel = $state("");
  let forkIntent = $state("");
  let groupOpen = $state(false);
  let groupSource: CreateGroupRequest["source"] = $state("hand_picked");
  let groupResistance: "fixed" | "per_branch" = $state("fixed");
  let groupSize = $state(4);
  let groupCandidates: string[] = $state([]);
  let groupModes: Record<string, "sequential" | "lockstep"> = $state({});
  let replayTimer: ReturnType<typeof setInterval> | undefined;
  let mainElement = $state<HTMLElement>();
  let forkInput = $state<HTMLInputElement>();
  let pickerHeading = $state<HTMLHeadingElement>();
  let regionElement = $state<HTMLElement>();
  let unregisterKeyboard: (() => void) | undefined;
  let speechAvailable = $state(false);
  let dismissedGuardSeq: number | undefined = $state();
  let selectedSquare: string | undefined = $state();
  let boardActiveSquare: import("./board-input.js").Square | undefined = $state();
  let boardActiveRunId: string | undefined = $state();
  let boardMoveAnnouncement: string | undefined = $state();
  let boardFocusRequested = $state(false);
  let compactTab: "timeline" | "branches" | "evidence" = $state("timeline");
  let decidedness: Readonly<Record<string, Decidedness>> = $state({});
  let foldedBranchIds: string[] = $state([]);
  let pinnedExpanded: string[] = $state([]);
  let compareLimitNotice: string | undefined = $state();
  let viewportSupport: RunViewportSupport = $state({ supported: true, width: 0, height: 0, reason: null });
  let ownMarks: readonly RunMark[] = $state([]);
  let markScope: "position" | "branch" = $state("position");
  let markTimer: ReturnType<typeof setTimeout> | undefined;

  function measureViewport(): void {
    viewportSupport = runViewportSupport(globalThis.innerWidth, globalThis.innerHeight);
  }

  let run = $derived(snapshot.run);
  let canWrite = $derived(snapshot.access === "writer");
  let currentNode = $derived(activeNode(run));

  function changedMarks(shapes: readonly DrawShape[]): void {
    if (onSaveMarks === undefined || previewNodeId !== undefined) return;
    if (markTimer !== undefined) clearTimeout(markTimer);
    const nodeId = displayedNode.id;
    const branchId = run.activeCursor.branchId;
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
    markTimer = setTimeout(() => {
      void onSaveMarks({ nodeId, branchId, scope, shapes: persistable }).then((marks)=>ownMarks=marks);
    },400);
  }

  function setMarkScope(event: Event): void {
    markScope = (event.currentTarget as HTMLSelectElement).value as "position" | "branch";
    try { globalThis.localStorage?.setItem(`tabiya:mark-scope:${run.id}`, markScope); } catch { /* local preference only */ }
  }

  function rescopeVisibleMarks():void{
    if(onRescopeMarks===undefined||displayedMarks.length===0)return;
    const toScope=markScope==="position"?"branch":"position";
    void onRescopeMarks({nodeId:displayedNode.id,branchId:run.activeCursor.branchId,fromScope:markScope,toScope}).then((marks)=>{ownMarks=marks;markScope=toScope;try{globalThis.localStorage?.setItem(`tabiya:mark-scope:${run.id}`,markScope);}catch{/* local preference only */}});
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
      ? guardEvent.data.evidenceRefs.map((reference) => renderEvidenceRef(reference, pack))
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
  let entries = $derived(timelineEntries(run, pack));
  let path = $derived(historyFrom(run, run.activeCursor.nodeId));
  let firings = $derived(shapeFirings(shapes, path));
  let shapeMarkers = $derived(firings.map((firing) => {
    const entry = shapes.find((candidate) => candidate.id === firing.entryId)!;
    return { nodeId: firing.firstNodeId, entryId: entry.id, label: entry.name, channel: entry.channel };
  }));
  let openShape = $derived(shapes.find((entry) => entry.id === openShapeId));
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
      : (() => {
          const all = authoredFeedback?.items ?? [];
          const current = all.filter(
            (item) => item.revealedBy.eventSeq === checkpoint.eventSeq,
          );
          const verdicts = current.filter(
            (item): item is Extract<AuthoredFeedbackItem, { kind: "theory_verdict" }> =>
              item.kind === "theory_verdict" && item.verdict === "classified_deviation",
          );
          const supportingNotes = all.filter(
            (item) =>
              item.kind === "deviation" &&
              verdicts.some(
                (verdict) =>
                  verdict.anchor.moveUci === item.anchor.moveUci &&
                  verdict.deviationClass === item.deviationClass,
              ) &&
              !current.some((candidate) => candidate.id === item.id),
          );
          return [...current, ...supportingNotes];
        })(),
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
    currentNode.evidenceRefs.map((reference) => renderEvidenceRef(reference, pack)),
  );
  let cards = $derived(branchCards(run));
  let collapsedIds = $derived(collapsedBranchIds(run, decidedness, new Set(compareIds), new Set(pinnedExpanded)));
  let groups = $derived(groupsFromEvents(run));
  let activeGroup = $derived(groups.find((group) => group.members.some((member) => member.branchId === run.activeCursor.branchId)));
  let groupOrdinals = $derived(Object.fromEntries(groups.flatMap((group, groupIndex) => group.members.map((member) => [member.branchId, groupIndex + 1]))));
  let banner = $derived(pack === undefined ? undefined : whyBanner(pack, run));
  let grading = $derived(pack === undefined ? undefined : projectedGrading(pack));
  let assessment = $derived(
    grading === undefined ? undefined : assessmentSentence(grading),
  );
  let resistance = $derived(
    pack === undefined || (grading === undefined && pack.objective.type !== "follow_theory")
      ? []
      : resistanceSentences(run, currentNode.id, pack),
  );
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
  let displayedMarkKey = $derived(markScope === "position" ? displayedNode.transposeKey : `${run.activeCursor.branchId}:${displayedNode.id}`);
  let displayedMarks = $derived(ownMarks.filter((mark) => mark.scope === markScope && mark.scopeKey === displayedMarkKey).map((mark) => ({ orig:mark.orig as import("@lichess-org/chessground/types").Key,...(mark.dest===undefined?{}:{dest:mark.dest as import("@lichess-org/chessground/types").Key}),brush:mark.brush })));
  let structure = $derived(structuralReading(displayedNode.fen));
  let transition = $derived.by(() => {
    if (displayedNode.parentId === null || displayedNode.moveUci === null) return null;
    const parent = run.nodes.find((node) => node.id === displayedNode.parentId);
    return parent === undefined ? null : transitionReading(parent.fen, displayedNode.moveUci, displayedNode.fen);
  });
  let detectedPhase = $derived(classifyPhase(displayedNode.fen));
  let endgame = $derived(endgameReading(displayedNode.fen));
  let assistanceContext = $derived({ sessionKind: run.sessionKind, deliveryOpen: feedbackDeliveryOpen(run), role: viewerRole });
  let assistancePermission = $derived(permittedAssistance(assistanceContext));
  let effectiveLighting = $derived(assistance.boardLighting === "evidence" && assistancePermission.boardLighting !== "evidence" ? "sight" : assistance.boardLighting);
  let selectedObservations = $derived(selectedSquare === undefined ? [] : structure.features.filter((item) => item.squares.some((square) => square === selectedSquare)));
  let boardOverlays = $derived((effectiveLighting === "sight" || effectiveLighting === "evidence") ? selectedObservations.flatMap((item) => item.squares.map((square) => ({ orig: square, brush: "blue" }))) : []);
  let overlayCaption = $derived(selectedObservations.map(renderStructuralObservation));
  let projectedPivotal = $derived(assistance.markers === "live" ? liveMarkers(run, run.activeCursor.branchId, assistanceContext) : []);
  let pivotalRows = $derived(projectedPivotal.map((marker) => ({ nodeId: marker.nodeId, label: marker.kind.replaceAll("_", " ") })));
  let openPivotal = $derived(openPivotalNodeId === undefined ? [] : projectedPivotal.filter((marker) => marker.nodeId === openPivotalNodeId));
  let guidedShapes = $derived.by(() => {
    if (openPivotalNodeId === undefined || assistance.guided !== "live") return [];
    const target = path.findIndex((node) => node.id === openPivotalNodeId);
    return shapes.filter((entry) => firings.some((firing) => firing.entryId === entry.id && path.findIndex((node) => node.id === firing.firstNodeId) <= target && path.findIndex((node) => node.id === firing.lastNodeId) >= target));
  });

  function preferenceStorage(): PreferenceStorage | undefined {
    if (assistanceStorage !== undefined) return assistanceStorage;
    if (import.meta.env.MODE === "test") return undefined;
    try { return globalThis.localStorage ?? undefined; } catch { return undefined; }
  }

  function setAssistance<Key extends keyof Omit<AssistanceConfig, "version">>(key: Key, value: AssistanceConfig[Key]): void {
    assistance = Object.freeze({ ...assistance, [key]: value });
    saveAssistance(assistanceProfile({ sessionKind: run.sessionKind, feedbackPolicy: run.feedbackPolicy, liveKind: liveSessionKind }), assistance, preferenceStorage());
    if (key === "markers" && value === "off") openPivotalNodeId = undefined;
  }

  async function requestHumanSplit(): Promise<void> {
    if (onHumanSplit !== undefined) humanSplit = await onHumanSplit(displayedNode.id);
  }

  async function requestCorpus(): Promise<void> {
    if (onCorpus === undefined) return;
    const decision = displayedNode.actor === "user" ? displayedNode : [...path].reverse().find((node) => node.actor === "user");
    const queryNode = decision?.parentId ?? displayedNode.id;
    corpusPage = await onCorpus(queryNode);
  }

  async function requestVoice(scope: VoicePage["scope"]): Promise<void> {
    if (onVoice !== undefined) voicePage = await onVoice(displayedNode.id, scope);
  }

  function speakSentences(sentences: readonly string[]): void {
    if (sentences.length === 0 || assistance.spoken === "off") return;
    if (assistance.spoken === "provider" && onSpeech !== undefined) {
      void onSpeech(displayedNode.id, "marker").then((blob) => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
        void audio.play();
      });
      return;
    }
    if (assistance.spoken !== "browser" || !speechAvailable) return;
    globalThis.speechSynthesis.cancel();
    globalThis.speechSynthesis.speak(new SpeechSynthesisUtterance(sentences.join(" ")));
  }

  function openPivotalMarker(nodeId: string): void {
    openPivotalNodeId = nodeId; humanSplit = undefined; voicePage = undefined;
    const sentences = projectedPivotal.filter((marker) => marker.nodeId === nodeId).flatMap(renderPivotalMarker);
    speakSentences(sentences);
  }

  function groupPreference(groupId: string): "sequential" | "lockstep" {
    return groupModes[groupId] ?? "sequential";
  }

  function setGroupPreference(groupId: string, mode: "sequential" | "lockstep"): void {
    groupModes = { ...groupModes, [groupId]: mode };
    try { globalThis.localStorage?.setItem(`tabiya:branch-group:v1:${groupId}`, mode); } catch { /* Local preference only. */ }
  }

  function captureGroupMove(uci: string): void {
    if (groupCandidates.includes(uci)) return;
    if (groupCandidates.length < 8) groupCandidates = [...groupCandidates, uci];
  }

  async function boardMove(uci: string): Promise<void> {
    if (groupOpen && groupSource === "hand_picked") {
      captureGroupMove(uci);
      return;
    }
    const before = activeGroup;
    const beforeIndex = before?.members.findIndex((member) => member.branchId === run.activeCursor.branchId) ?? -1;
    await onMove(uci);
    await tick();
    if (before === undefined || groupPreference(before.groupId) !== "lockstep" || checkpoint !== undefined) return;
    const next = before.members[(beforeIndex + 1) % before.members.length];
    if (next === undefined || next.branchId === run.activeCursor.branchId) return;
    await onSwitchBranch(branchPath(run, next.branchId).at(-1)!.id);
  }

  async function createGroup(): Promise<void> {
    if (!canWrite || onCreateGroup === undefined) return;
    await onCreateGroup({
      source: groupSource,
      resistance: groupResistance,
      ...(groupSource === "hand_picked" ? { candidates: groupCandidates } : { size: groupSize }),
    });
    groupOpen = false;
    groupCandidates = [];
  }

  async function nextGroupMember(group: BranchGroup): Promise<void> {
    const current = group.members.findIndex((member) => member.branchId === run.activeCursor.branchId);
    const next = group.members[(current + 1) % group.members.length];
    if (next !== undefined) await onSwitchBranch(branchPath(run, next.branchId).at(-1)!.id);
  }
  function interactiveTarget(event: KeyboardEvent): boolean {
    return event.composedPath().some((target) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLButtonElement ||
      target instanceof HTMLAnchorElement ||
      (target instanceof HTMLElement && (
        target.tagName === "SUMMARY" ||
        target.isContentEditable ||
        target.dataset.boardInputGrid !== undefined
      )),
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

  function openCompare(): void {
    const ids = selectedCompareIds();
    if (ids !== undefined) void onCompare(ids);
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
  async function classifyRemaining(): Promise<void> {
    if (onClassifyBranches === undefined) return;
    const ids = cards.filter((card) => decidedness[card.id]?.state !== "decided").slice(0, MAX_COMPARISON_BRANCHES).map((card) => card.id);
    if (ids.length > 0) decidedness = Object.freeze({ ...decidedness, ...(await onClassifyBranches(ids)) });
  }
  async function switchVisibleBranch(nodeId: string, branchId: string): Promise<void> {
    pinnedExpanded = [...new Set([...pinnedExpanded, branchId])];
    await onSwitchBranch(nodeId);
  }

  function preview(nodeId: string): void {
    previewNodeId = previewNodeId === nodeId ? undefined : nodeId;
  }

  async function confirmPreview(nodeId = previewNodeId): Promise<void> {
    if (!canWrite || nodeId === undefined) return;
    previewNodeId = undefined;
    await onRewind({ nodeId });
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
    if (!canWrite) return;
    forkOpen = false;
    await onFork(forkLabel, forkIntent);
    forkLabel = "";
    forkIntent = "";
  }

  async function continueFromCheckpoint(): Promise<void> {
    await onContinueCheckpoint();
    await tick();
    mainElement?.focus();
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
      else if (checkpointPickerOpen) closeCheckpointPicker();
      else if (comparison !== undefined) closeCompare();
      else if (checkpoint === undefined) return false;
      event.preventDefault();
      return true;
    }
    if (
      interactiveTarget(event) ||
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
        if (checkpointId !== undefined) void onRewind({ checkpointId });
      }
      return true;
    } else if (event.key.toLowerCase() === "b") {
      event.preventDefault();
      if (!canWrite) return true;
      forkInvoker = keyboardInvoker(event);
      forkOpen = true;
      void tick().then(() => forkInput?.focus());
      return true;
    } else if (/^[1-9]$/.test(event.key)) {
      const branch = cards[Number(event.key) - 1];
      if (branch !== undefined) {
        event.preventDefault();
        void onSwitchBranch(branch.leafNodeId);
        return true;
      }
    } else if (
      event.altKey &&
      event.code === "KeyC" &&
      (event.target === mainElement || event.target === regionElement)
    ) {
      event.preventDefault();
      if (comparison === undefined) {
        compareInvoker = keyboardInvoker(event);
        openCompare();
      }
      else closeCompare();
      return true;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      stepTimeline(event.key === "ArrowLeft" ? -1 : 1);
      return true;
    } else if (event.key === " ") {
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
    speechAvailable = typeof globalThis.speechSynthesis !== "undefined" && typeof globalThis.SpeechSynthesisUtterance !== "undefined" && globalThis.speechSynthesis.getVoices().length > 0;
    assistance = loadAssistance(assistanceProfile({ sessionKind: run.sessionKind, feedbackPolicy: run.feedbackPolicy, liveKind: liveSessionKind }), preferenceStorage());
    if (onLoadMarks !== undefined) void onLoadMarks().then((marks)=>ownMarks=marks);
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
    unregisterKeyboard?.();
    if (replayTimer !== undefined) clearInterval(replayTimer);
    if (markTimer !== undefined) clearTimeout(markTimer);
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

<div class="drill-region" data-keyboard-region="drill" tabindex="-1" bind:this={regionElement}>

{#if !viewportSupport.supported}
  <section class="viewport-refusal" role="alert" aria-labelledby="viewport-refusal-title">
    <p>Run viewport unavailable</p>
    <h1 id="viewport-refusal-title">The chessboard cannot fit honestly here.</h1>
    <p>{viewportSupport.reason}</p>
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
    onVoice={onCompareVoice === undefined ? undefined : async () => (await onCompareVoice()).text}
  />
{:else}
  <main class="drill" tabindex="-1" bind:this={mainElement} aria-labelledby="drill-title">
    <header class="topbar">
      <button class="wordmark" type="button" onclick={onStop}>Tabiya</button>
      <div class="status" aria-live="polite">
        <span class:readonly={snapshot.access === "read_only"}>
          {snapshot.access === "read_only" ? "Read-only follower" : busy ? "Thinking…" : "Your move"}
        </span>
        {#if authoredFeedback?.hasWithheldAuthoredContent}
          <span role="status">Authored commentary withheld until checkpoints</span>
        {/if}
        {#if snapshot.pendingEvidence > 0}<span>{snapshot.pendingEvidence} evidence waiting</span>{/if}
      </div>
      <div class="topbar-actions">
        {#if assistance.ambient === "on"}<button class="ambient" type="button" aria-label="Open assistance" title={busy ? "Thinking…" : snapshot.withheld ? "Waiting for disclosure" : guardEvent ? "A consequence is ready" : "Present"}>♟</button>{/if}
        <details class="assistance-control">
          <summary>Assistance</summary>
          <div class="assistance-grid">
            <label><input type="checkbox" checked={assistance.markers === "live"} onchange={(event) => setAssistance("markers", event.currentTarget.checked ? "live" : "off")} /> Passive pivotal markers</label>
            <label><input type="checkbox" checked={assistance.guided === "live"} onchange={(event) => setAssistance("guided", event.currentTarget.checked ? "live" : "off")} /> Named-pattern guidance</label>
            <label><input type="checkbox" checked={assistance.humanSplit === "on_request"} disabled={assistancePermission.humanSplit === "locked_off"} aria-describedby={assistancePermission.humanSplit === "locked_off" ? "human-split-locked" : undefined} onchange={(event) => setAssistance("humanSplit", event.currentTarget.checked ? "on_request" : "off")} /> Evidence inspector: human move split</label>
            {#if assistancePermission.humanSplit === "locked_off"}<span id="human-split-locked" class="honest">Available only after this run opens feedback, and never to participants or spectators.</span>{/if}
            {#if assistance.humanSplit === "on_request" && assistancePermission.humanSplit === "free" && onHumanSplit !== undefined}<button type="button" onclick={() => void requestHumanSplit()}>Open human-model evidence inspector</button>{/if}
            {#if assistance.humanSplit === "on_request" && assistancePermission.humanSplit === "free" && onHumanSplit === undefined}<span class="honest">Recorded human-model splits are unavailable from this deployment.</span>{/if}
            {#if humanSplit}<section aria-label="Human-model evidence" data-evidence-consumer="inspector.human_split"><p class="guidance-sentence">{humanSplit.engine.name}, rating target {humanSplit.targetElo ?? "unrated"}: {humanSplit.candidates.filter((candidate) => candidate.offWindow !== true).map((candidate) => `${candidate.moveUci} ${candidate.mass === undefined ? "mass unavailable" : `${Math.round(candidate.mass * 100)}%`}`).join(" · ")}</p></section>{/if}
            {#if capabilities?.providers.corpus !== "none"}<label><input type="checkbox" checked={assistance.corpus === "on_request"} disabled={assistancePermission.corpus === "locked_off"} aria-describedby={assistancePermission.corpus === "locked_off" ? "corpus-locked" : undefined} onchange={(event) => setAssistance("corpus", event.currentTarget.checked ? "on_request" : "off")} /> Evidence inspector: corpus counts</label>{/if}
            {#if capabilities?.providers.corpus !== "none" && assistancePermission.corpus === "locked_off"}<span id="corpus-locked" class="honest">Available only after this run opens feedback, and never to participants or spectators.</span>{/if}
            {#if assistance.corpus === "on_request" && assistancePermission.corpus === "free" && capabilities?.providers.corpus !== "none" && onCorpus !== undefined}<button type="button" onclick={() => void requestCorpus()}>Open corpus evidence inspector</button>{/if}
            {#if corpusPage}<section aria-label="Corpus evidence" data-evidence-consumer="inspector.corpus">{#each renderCorpusPage(corpusPage) as sentence}<p class="guidance-sentence">{sentence}</p>{/each}</section>{/if}
            {#if capabilities?.providers.llm === "external"}<label><input type="checkbox" checked={assistance.voice === "persona"} onchange={(event) => setAssistance("voice", event.currentTarget.checked ? "persona" : "authored")} /> External voice</label>{/if}
            {#if speechAvailable}<label><input type="checkbox" checked={assistance.spoken === "browser"} onchange={(event) => setAssistance("spoken", event.currentTarget.checked ? "browser" : "off")} /> Speak opened guidance</label>{/if}
            {#if capabilities?.providers.tts === "external"}<label><input type="checkbox" checked={assistance.spoken === "provider"} onchange={(event) => setAssistance("spoken", event.currentTarget.checked ? "provider" : "off")} /> Use configured speech provider</label>{/if}
            {#if !speechAvailable && capabilities?.providers.tts !== "external"}<span id="spoken-unavailable" class="honest">Speech synthesis is unavailable in this browser.</span>{/if}
          </div>
        </details>
        <button class="help" type="button" aria-label="Keyboard shortcuts" onclick={(event) => { helpInvoker = invoker(event); helpOpen = true; }}>?</button>
      </div>
    </header>

    {#if error}<p class="error" role="alert">{error}</p>{/if}
    {#if snapshot.access === "read_only"}
      <p class="readonly-banner" role="status">
        {snapshot.withheld ? "The host is ahead; evidence is withheld until this run discloses." : "Another browser owns this run. You can follow its events, but this view cannot move or rewind."}
      </p>
    {/if}

    {#if guardEvent?.type === "feedback.generated"}
      <section class="guard-prompt" aria-label="Post-commit guard" aria-live="polite">
        <div>
          <strong>The consequence exposed something concrete.</strong>
          {#each guardGrounds as sentence}<p>{sentence.text}</p>{/each}
          <p>Your played line stays preserved on the branch rail.</p>
        </div>
        <div class="guard-actions">
          <button type="button" onclick={() => (dismissedGuardSeq = guardEvent?.seq)}>Play on</button>
          <button
            class="primary"
            type="button"
            disabled={snapshot.access === "read_only" || guardRewindNodeId === undefined}
            onclick={() => guardRewindNodeId === undefined ? undefined : onRewind({ nodeId: guardRewindNodeId })}
          >Rewind this decision</button>
        </div>
      </section>
    {/if}

    <div class="workspace" class:evidence-active={compactTab === "evidence"}>
      <nav class="compact-tabs" aria-label="Run regions">
        <button class:active={compactTab === "timeline"} onclick={() => compactTab = "timeline"}>Timeline</button>
        <button class:active={compactTab === "branches"} onclick={() => compactTab = "branches"}>Branches</button>
        <button class:active={compactTab === "evidence"} onclick={() => compactTab = "evidence"}>Evidence</button>
      </nav>
      <section class="position-column" class:outcome={grading !== undefined || pack?.objective.type === "follow_theory"}>
        <div class="objective-copy">
          <p>Objective</p>
          <h1 id="drill-title">{pack === undefined ? "No pack is loaded. Nothing is claimed about this position." : packObjective(pack)}</h1>
        </div>
        {#if pack?.variantOf !== undefined}
          <section class="variant-link" aria-label="Related rehearsal">
            <span>{pack.variantOf.relation.kind === "root_after_move" ? `After ${pack.variantOf.relation.moveUci}` : pack.variantOf.relation.kind === "same_root_other_side" ? "Same position, other side" : "Same position, other objective"}:</span>
            <button type="button" disabled={onSelectPack === undefined} onclick={() => onSelectPack?.(pack.variantOf!.packId)}>{pack.variantOf.packId}</button>
          </section>
        {/if}
        <section class="phase-reading" aria-label="Phase reading">
          {#if pack}<span>This pack declares: {pack.phase}.</span>{/if}
          <span>{renderPhaseReading(detectedPhase)}</span>
        </section>
        {#if trajectory}
          <section class="trajectory-status" aria-label="Trajectory legs">
            {#each trajectory.legs as leg}
              <div class:active-leg={leg.legId === trajectory.activeLegId}>
                <strong>{leg.legId}</strong>
                <span>{leg.status === "not_entered" ? "not entered" : leg.state}</span>
              </div>
            {/each}
            {#if trajectory.transitions.length > 0}
              <p>{trajectory.transitions.at(-1)!.fromLegId} → {trajectory.transitions.at(-1)!.toLegId} at ply {trajectory.transitions.at(-1)!.ply}; {trajectory.transitions.at(-1)!.producedBy.length} moves produced this position.</p>
            {/if}
          </section>
        {/if}
        {#if pack !== undefined && (assessment !== undefined || resistance.length > 0)}
          <OutcomeContext {assessment} {resistance} grade={objectiveGradeSentence(pack.objective.type, currentNode.objectiveState)} />
        {/if}
        {#if banner !== undefined}<WhyBanner model={banner} />{/if}
        <div class="reading-controls" class:compact-active={compactTab === "evidence"}>
          <section class="structural-reading" aria-label="Evidence inspector: position structure" data-evidence-consumer="inspector.position_structure">
            <button type="button" aria-expanded={structuralOpen} onclick={() => (structuralOpen = !structuralOpen)}>Evidence inspector: position structure</button>
            {#if structuralOpen}
              <div class="structural-facts">
                {#if structure.features.length === 0}<p>No rung-0 structural observations in this position.</p>{/if}
                {#each structure.features as observation}<p>{renderStructuralObservation(observation)}</p>{/each}
              </div>
            {/if}
          </section>
          <section class="transition-reading" aria-label="Evidence inspector: move transition" data-evidence-consumer="inspector.move_transition">
            <button type="button" aria-expanded={transitionOpen} onclick={() => (transitionOpen = !transitionOpen)}>Evidence inspector: what changed on this move?</button>
            {#if transitionOpen}
              <div class="transition-facts">
                {#if transition === null || transition.observations.length === 0}<p>No rung-0 transition observations at this move.</p>{/if}
                {#each transition?.observations ?? [] as observation}<p>{renderTransitionObservation(observation)}</p>{/each}
              </div>
            {/if}
          </section>
        </div>
        <div class="board-slot">
          <div class="board-frame" class:previewing={previewNodeId !== undefined}>
            {#if previewNodeId}<span class="preview-label">Preview</span>{/if}
            {#key `${displayedNode.id}:${groupOpen ? groupCandidates.length : -1}`}
              <Chessboard
                fen={displayedNode.fen}
                startSide={boardSide ?? startSide}
                lastMove={displayedNode.moveUci}
                disabled={busy || snapshot.access === "read_only" || previewNodeId !== undefined || terminalEvent !== undefined}
                showDests={effectiveLighting !== "off"}
                highlightMoves={effectiveLighting !== "off"}
                overlays={boardOverlays}
                marks={displayedMarks}
                drawingEnabled={previewNodeId === undefined}
                onMarksChange={changedMarks}
                onSelect={(square) => selectedSquare = square}
                onExitGrid={() => regionElement?.focus()}
                activeSquare={boardActiveSquare}
                onActiveSquareChange={(square) => boardActiveSquare = square}
                lastMoveAnnouncement={boardMoveAnnouncement}
                onMoveCommitted={(announcement) => boardMoveAnnouncement = announcement}
                focusAfterMove={boardFocusRequested}
                onMoveSettled={() => boardFocusRequested = true}
                onFocusRestored={() => boardFocusRequested = false}
                onMove={boardMove}
              />
            {/key}
            <div class="mark-controls" aria-label="Board marks">
              <label>Marks stay with <select value={markScope} onchange={setMarkScope}><option value="position">this position</option><option value="branch">this line</option></select></label>
              <span>{displayedMarks.length}/64 marks</span>
              <button type="button" disabled={displayedMarks.length===0||onRescopeMarks===undefined} aria-describedby={displayedMarks.length===0||onRescopeMarks===undefined?"rescope-marks-disabled":undefined} onclick={rescopeVisibleMarks}>Move these marks to the other scope</button>
              {#if displayedMarks.length===0||onRescopeMarks===undefined}<span id="rescope-marks-disabled">Draw a mark before moving this position's marks to another scope.</span>{/if}
            </div>
          </div>
          {#if overlayCaption.length > 0}<div class="overlay-caption" aria-live="polite" data-evidence-consumer="board.selected_square_sight">{#each overlayCaption as sentence}<p>{sentence}</p>{/each}</div>{/if}
          {#if assistance.boardLighting === "evidence" && !feedbackDeliveryOpen(run)}<p class="overlay-caption honest">No disclosed evidence exists here; structural sight remains available.</p>{/if}
        </div>
      </section>

      <div class="rail-stack" class:compact-active={compactTab === "branches"}>
        {#if activeGroup}
          <GroupPanel
            {run}
            group={activeGroup}
            {startSide}
            advanceMode={groupPreference(activeGroup.groupId)}
            onAdvanceMode={(mode) => setGroupPreference(activeGroup!.groupId, mode)}
            onEnter={onSwitchBranch}
            onCompare={() => onCompare(activeGroup!.members.map((member) => member.branchId))}
            onAnalyze={(nodeIds) => onAnalyzeMissing?.(nodeIds)}
          />
          <button class="next-member" type="button" onclick={() => void nextGroupMember(activeGroup!)}>Next member</button>
        {/if}
        <BranchRail
          branches={cards}
          activeBranchId={run.activeCursor.branchId}
          {compareIds}
          onSwitch={switchVisibleBranch}
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
        />
      </div>

      <div class="timeline-row" class:compact-active={compactTab === "timeline"}>
        <Timeline
          {entries}
          activeNodeId={run.activeCursor.nodeId}
          {previewNodeId}
          onPreview={preview}
          onConfirm={confirmPreview}
          canConfirm={canWrite}
          {authoredSpineNodeIds}
          rootNodeId={run.nodes[0]?.id}
          {shapeMarkers}
          onOpenShape={(entryId) => (openShapeId = entryId)}
          pivotalMarkers={pivotalRows}
          onOpenPivotal={openPivotalMarker}
        />
        <div class="quick-actions" aria-label="Run actions">
          <HonestControl disabled={!canWrite} reasonId="drill-fork-readonly" reason="This read-only view cannot create a branch.">
            {#snippet children(describedBy)}<button type="button" disabled={!canWrite} aria-describedby={describedBy} onclick={(event) => { forkInvoker = invoker(event); forkOpen = true; }}>Fork <kbd>B</kbd></button>{/snippet}
          </HonestControl>
          <HonestControl disabled={!canWrite} reasonId="drill-group-readonly" reason="This read-only view cannot create a branch group.">
            {#snippet children(describedBy)}<button type="button" disabled={!canWrite} aria-describedby={describedBy} onclick={() => (groupOpen = !groupOpen)}>Branch group</button>{/snippet}
          </HonestControl>
          <HonestControl
            disabled={cards.length < 2}
            reasonId="drill-compare-unavailable"
            reason="Create at least two branches before comparing."
          >
            {#snippet children(describedBy)}
              <button
                type="button"
                disabled={cards.length < 2}
                aria-describedby={describedBy}
                onclick={(event) => { compareInvoker = invoker(event); openCompare(); }}
              >Compare <kbd>Alt+C</kbd></button>
            {/snippet}
          </HonestControl>
          <button type="button" aria-pressed={replaying} onclick={toggleReplay}>
            {replaying ? "Pause" : "Replay"} <kbd>Space</kbd>
          </button>
          <button type="button" onclick={() => onExport(compareIds.length > 0 ? compareIds : undefined)}>Export <kbd>E</kbd></button>
        </div>
      </div>
    </div>
    {#if groupOpen}
      <section class="group-creator" aria-labelledby="group-create-title">
        <div><p>Parallel experiment</p><h2 id="group-create-title">Create a branch group</h2></div>
        <label>Source
          <select bind:value={groupSource}>
            <option value="hand_picked">My candidate moves</option>
            <option value="authored" disabled={pack === undefined}>Authored variations</option>
            <option value="human_replies" disabled={capabilities?.providers.opponent === "none" || assistancePermission.humanSplit === "locked_off"}>Recorded human replies</option>
            <option value="engine_top_n" disabled={!capabilities?.policyModes.includes("strong_engine") || assistancePermission.humanSplit === "locked_off"}>Engine lines</option>
          </select>
        </label>
        <label>Resistance
          <select bind:value={groupResistance}><option value="fixed">Fixed</option><option value="per_branch">Varied</option></select>
        </label>
        {#if groupSource === "hand_picked"}
          <p class="capture-help">Move pieces on the board to capture candidates. The run is not changed until Create group.</p>
          <div class="candidate-chips">{#each groupCandidates as uci}<button type="button" onclick={() => (groupCandidates = groupCandidates.filter((move) => move !== uci))}>{uci} ×</button>{:else}<span>No candidates captured yet.</span>{/each}</div>
        {:else}
          <label>Members <input type="number" min="2" max="8" bind:value={groupSize} /></label>
        {/if}
        <div class="creator-actions"><button type="button" onclick={() => { groupOpen = false; groupCandidates = []; }}>Cancel</button><button type="button" disabled={groupSource === "hand_picked" && groupCandidates.length < 2} aria-describedby={groupSource === "hand_picked" && groupCandidates.length < 2 ? "group-candidates-needed" : undefined} onclick={() => void createGroup()}>Create group</button></div>
        {#if groupSource === "hand_picked" && groupCandidates.length < 2}<span id="group-candidates-needed" class="honest">Capture at least two distinct legal moves.</span>{/if}
      </section>
    {/if}
  </main>
{/if}

{#if viewportSupport.supported && checkpoint}
  <CheckpointSheet
    {run}
    node={currentNode}
    {startSide}
    {onPrediction}
    {onReasoning}
    {...(reasoning === undefined ? {} : { reasoning })}
    {checkpoint}
    authoredItems={checkpointAuthoredItems}
    {shapes}
    {assessment}
    {resistance}
    resolution={checkpointResolution}
    canCompare={cards.length >= 2}
    onContinue={continueFromCheckpoint}
    onRewind={() => onRewind({ nodeId: checkpoint.nodeId })}
    onCompare={openCompare}
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
    onRewind={() => currentNode.parentId === null ? undefined : onRewind({ nodeId: currentNode.parentId })}
    {onStory}
    onFlip={onFlip === undefined ? undefined : () => onFlip(run.nodes[0]!.id)}
    {onStop}
  />
{/if}

{#if viewportSupport.supported && helpOpen}<KeyboardHelp onClose={closeHelp} />{/if}

{#if viewportSupport.supported && forkOpen}
  <div class="modal-backdrop">
    <div role="dialog" aria-modal="true" aria-labelledby="fork-title">
      <form class="modal" onsubmit={(event) => { event.preventDefault(); void submitFork(); }}>
        <p>Branch from here</p>
        <h2 id="fork-title">Name the experiment.</h2>
        <label>Label <input bind:this={forkInput} bind:value={forkLabel} placeholder="alt-{cards.length}" /></label>
        <label>Intent <textarea bind:value={forkIntent} placeholder="What are you testing?"></textarea></label>
        <div><button type="button" onclick={closeFork}>Cancel</button><button class="primary" type="submit">Create branch</button></div>
      </form>
    </div>
  </div>
{/if}

{#if viewportSupport.supported && checkpointPickerOpen}
  <div class="modal-backdrop">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="picker-title">
      <p>Rewind</p><h2 id="picker-title" tabindex="-1" bind:this={pickerHeading}>Choose a checkpoint.</h2>
      <div class="checkpoint-options">
        {#each [...run.events].reverse().filter((event) => event.type === "checkpoint.reached") as event}
          {#if event.type === "checkpoint.reached"}
            <button type="button" onclick={() => { checkpointPickerOpen = false; void onRewind({ checkpointId: event.data.checkpointId }); }}>
              {pack?.checkpoints.find((item) => item.id === event.data.checkpointId)?.label ?? event.data.checkpointId}
            </button>
          {/if}
        {:else}<p>No checkpoint reached yet.</p>{/each}
      </div>
      <button type="button" onclick={closeCheckpointPicker}>Cancel</button>
    </div>
  </div>
{/if}

{#if viewportSupport.supported && openShape}<ShapePanel entry={openShape} onClose={() => (openShapeId = undefined)} />{/if}
{#if viewportSupport.supported && openPivotalNodeId !== undefined}
  <div class="modal-backdrop">
    <div class="modal guidance-panel" role="dialog" aria-modal="true" aria-labelledby="pivotal-title" data-evidence-consumer="board.pivotal_marker">
      <p>Pivotal marker</p><h2 id="pivotal-title">Recorded change</h2>
      {#each openPivotal as marker}{#each renderPivotalMarker(marker) as sentence}<p class="guidance-sentence">{sentence}</p>{/each}{/each}
      {#each renderEndgameReading(endgame) as sentence}<p class="guidance-sentence">{sentence}</p>{/each}
      {#if assistance.guided === "live"}
        {#each guidedShapes as shape}<section><h3>{shape.name}</h3><p>Named plans for this structure — general to the kind of position, not advice for this one.</p><ul>{#each shape.plans as plan}<li>{plan.label}</li>{/each}</ul></section>{:else}<p class="guidance-sentence">No named structure entry matches this position.</p>{/each}
      {/if}
      {#if assistance.voice === "persona" && capabilities?.providers.llm === "external" && onVoice !== undefined}<button type="button" onclick={() => void requestVoice("marker")}>Revoice this packet</button>{/if}
      {#if voicePage?.text.includes("Recorded reading at this position:")}<p class="guidance-sentence">{RECORDED_READING_GUARD}</p>{/if}
      {#if voicePage}<p class="guidance-sentence">{voicePage.text}</p>{/if}
      <button type="button" onclick={() => (openPivotalNodeId = undefined)}>Close</button>
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

  .viewport-refusal {
    width: min(32rem, calc(100% - 2rem));
    margin: auto;
    padding: 1.25rem;
    border: 1px solid var(--warning);
    border-radius: 1rem;
    background: var(--panel);
  }
  .viewport-refusal p:first-child { color: var(--warning); font: 700 .68rem ui-monospace, monospace; text-transform: uppercase; }
  .viewport-refusal h1 { margin: .35rem 0; font: 500 1.6rem/1.1 var(--display-font); }
  .viewport-refusal p:last-child { margin: 0; color: var(--muted); line-height: 1.45; }

  .drill {
    width: min(86rem, calc(100% - 2rem));
    height: 100%;
    margin: 0 auto;
    padding: 0.6rem 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    outline: none;
  }

  .topbar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 0.4rem 0 1rem;
  }

  .wordmark,
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
    color: var(--warning);
  }

  .topbar-actions { position:relative; justify-self:end; display:flex; align-items:center; gap:.55rem; }

  .error,
  .readonly-banner {
    padding: 0.7rem 0.9rem;
    border-radius: 0.7rem;
  }

  .error {
    background: color-mix(in srgb, var(--danger) 12%, var(--panel));
    color: var(--danger);
  }

  .readonly-banner {
    background: color-mix(in srgb, var(--warning) 12%, var(--panel));
  }

  .workspace {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(15rem, 0.38fr);
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 1rem;
    overflow: hidden;
  }
  .compact-tabs { display: none; }
  .overlay-caption { max-width: 40rem; margin: 0.35rem auto 0; padding: 0.4rem 0.6rem; border-radius: 0.5rem; background: var(--panel); font-size: 0.72rem; }
  .overlay-caption p { margin: 0.1rem 0; }
  .ambient { width: 2rem; height: 2rem; border: 1px solid var(--line); border-radius: 999px; background: var(--panel); }

  .position-column {
    width: 100%;
    min-height: 0;
    justify-self: center;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    overflow: hidden;
  }

  .objective-copy p {
    margin: 0;
    color: var(--accent);
    font: 700 0.65rem ui-monospace, monospace;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .objective-copy h1 {
    max-width: 30ch;
    max-height: clamp(5.5rem, 16dvh, 10rem);
    margin: 0.25rem 0 0;
    overflow: auto;
    font: 500 clamp(1.25rem, min(3vw, 3dvh), 2.4rem) / 1.08 var(--display-font);
  }

  .reading-controls { display:flex; flex-wrap:wrap; gap:.5rem; align-items:start; }
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
  .guard-prompt { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin:.55rem .8rem 0; padding:.65rem .8rem; border:1px solid var(--accent); border-radius:.7rem; background:color-mix(in srgb,var(--accent) 9%,var(--panel)); }
  .guard-prompt p { margin:.2rem 0 0; font-size:.78rem; color:var(--muted); }
  .guard-actions { display:flex; flex:none; gap:.45rem; }
  .assistance-control summary { cursor:pointer; }
  .assistance-grid { position:absolute; top:calc(100% + .4rem); right:0; display:grid; width:min(23rem,calc(100vw - 2rem)); gap:.45rem; padding:.7rem; border:1px solid var(--line); border-radius:.6rem; background:var(--panel); box-shadow:var(--shadow); }
  .assistance-grid label { display:flex; gap:.4rem; align-items:center; }
  .assistance-grid .honest { color:var(--muted); font-size:.68rem; }
  .guidance-panel { max-height:min(38rem,calc(100dvh - 2rem)); overflow:auto; }
  .guidance-panel h3 { margin:.6rem 0 .2rem; }
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
    width: 100%;
    flex: 1 1 0;
    align-self: stretch;
    display: grid;
    place-items: center;
    overflow: hidden;
    container-type: size;
  }

  .board-frame {
    position: relative;
    width: min(100cqw, 100cqh);
    height: auto;
    aspect-ratio: 1;
    justify-self: center;
    overflow: hidden;
    border-radius: 0.8rem;
    box-shadow: var(--shadow);
  }

  .position-column.outcome .board-frame {
    width: min(100cqw, 100cqh);
    height: auto;
  }

  .board-frame.previewing {
    opacity: 0.82;
    outline: 3px solid var(--warning);
  }

  .preview-label {
    position: absolute;
    z-index: 4;
    top: 0.6rem;
    left: 0.6rem;
    padding: 0.3rem 0.5rem;
    border-radius: 999px;
    background: var(--warning);
    color: #20180d;
    font: 700 0.65rem ui-monospace, monospace;
    text-transform: uppercase;
  }

  .timeline-row {
    grid-column: 1 / -1;
    min-height: 0;
    max-height: 8.5rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
    overflow: hidden;
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(7rem, 1fr));
    gap: 0.45rem;
  }

  .rail-stack{min-width:0;min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr);gap:.45rem;overflow:hidden}.next-member{justify-self:start;padding:.4rem .55rem;border:1px solid var(--line);border-radius:.55rem;background:var(--panel);color:inherit}.group-creator{display:flex;align-items:end;gap:.65rem;flex-wrap:wrap;padding:.65rem;border:1px solid var(--accent);border-radius:.75rem;background:var(--panel)}.group-creator p,.group-creator h2{margin:0}.group-creator h2{font:600 1rem var(--display-font)}.group-creator label{display:grid;gap:.2rem;font-size:.7rem;color:var(--muted)}.group-creator select,.group-creator input,.group-creator button{padding:.45rem .55rem;border:1px solid var(--line);border-radius:.55rem;background:var(--paper);color:inherit}.capture-help{flex-basis:100%;color:var(--muted);font-size:.72rem}.candidate-chips{display:flex;gap:.35rem;flex-wrap:wrap}.creator-actions{display:flex;gap:.35rem}.group-creator .honest{flex-basis:100%;color:var(--muted);font-size:.68rem}

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
    background: rgb(20 18 14 / 55%);
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
    color: white;
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
  .trajectory-status .active-leg { color: var(--ink); background: var(--paper-soft); }
  .trajectory-status span { font-size: 0.72rem; }
  .trajectory-status p { flex-basis: 100%; margin: 0.25rem 0 0; font-size: 0.8rem; }

  @media (min-width: 720px) and (max-height: 800px) {
    .position-column { gap: 0.25rem; }
    .objective-copy h1 {
      max-height: 3rem;
      font-size: 1.25rem;
    }
    .board-frame,
    .position-column.outcome .board-frame {
      width: min(100cqw, calc(100cqh + 8.9rem));
      height: min(100cqh, calc(100cqw - 8.9rem));
      aspect-ratio: auto;
    }
  }

  @media (max-width: 719px) {
    .drill-region { overflow: hidden; }
    .drill {
      width: min(100% - 1rem, 86rem);
      height: 100%;
      padding: .3rem 0;
      overflow: hidden;
    }

    .topbar {
      grid-template-columns: 1fr auto;
      padding: .2rem 0 .5rem;
    }

    .status {
      grid-column: 1 / -1;
      grid-row: 2;
      margin-top: 0.25rem;
    }

    .help {
      grid-column: 2;
      grid-row: 1;
    }
    .workspace {
      grid-template-columns: 1fr;
      grid-template-rows: auto minmax(0, 1fr) clamp(4rem, 18dvh, 8rem);
      gap: .5rem;
      overflow: hidden;
    }
    .workspace.evidence-active { grid-template-rows: auto minmax(0, 1fr) 0; }
    .compact-tabs { display: flex; grid-column: 1; grid-row: 1; gap: 0.25rem; overflow: auto; }
    .compact-tabs button { padding: 0.4rem; border: 1px solid var(--line); border-radius: 0.45rem; background: var(--panel); }
    .compact-tabs button.active { border-color: var(--accent); color: var(--accent); }
    .position-column {
      display: grid;
      grid-column: 1;
      grid-row: 2;
      grid-template-rows: repeat(8, auto) minmax(0, 1fr);
      gap: .25rem;
      overflow: hidden;
    }
    .objective-copy h1 {
      max-height: 3.25rem;
      font-size: 1.1rem;
    }
    .board-slot {
      grid-row: -2 / -1;
      container-type: size;
      min-height: 12rem;
    }
    .rail-stack, .timeline-row, .reading-controls { display: none; }
    .rail-stack, .timeline-row { grid-column: 1; grid-row: 3; min-height: 4rem; overflow: auto; }
    .rail-stack.compact-active, .timeline-row.compact-active { display: grid; grid-template-columns: 1fr; }
    .reading-controls.compact-active { display: grid; }
    .board-frame,
    .position-column.outcome .board-frame { width: min(100cqw, 100cqh); }
  }
</style>
