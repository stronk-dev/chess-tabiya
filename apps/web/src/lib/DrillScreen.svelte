<script lang="ts">
  import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
  import type { Capabilities, CorpusPage, HumanSplitPage, RunRole, ShapeEntryView, VoicePage } from "./api.js";
  import { SILENT_ASSISTANCE, branchPath, classifyPhase, endgameReading, feedbackDeliveryOpen, groupsFromEvents, historyFrom, permittedAssistance, pivotalMarkers, renderEndgameReading, renderPhaseReading, renderPivotalMarker, shapeFirings, structuralReading, trajectoryVerdict, type AssistanceConfig, type BranchComparison, type BranchGroup } from "@chess-tabiya/runtime";
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
  import { renderCorpusPage } from "./corpus-sentences.js";
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
  import { loadAssistance, saveAssistance, type PreferenceStorage } from "./assistance-preference.js";

  type RewindTarget =
    | { readonly nodeId: string }
    | { readonly checkpointId: string };

  interface Props {
    pack?: DrillPackDefinition | undefined;
    shapes?: readonly ShapeEntryView[] | undefined;
    snapshot: RunStateSnapshot;
    checkpoint?: CheckpointNotice | undefined;
    authoredFeedback?: AuthoredFeedbackPage | undefined;
    comparison?: BranchComparison | undefined;
    comparisonBranchIds?: readonly string[] | undefined;
    busy?: boolean;
    error?: string | undefined;
    capabilities?: Capabilities | undefined;
    viewerRole?: RunRole | undefined;
    boardSide?: "white" | "black" | undefined;
    assistanceStorage?: PreferenceStorage | undefined;
    onMove: (uci: string) => void | Promise<void>;
    onRewind: (target: RewindTarget) => void | Promise<void>;
    onFork: (label?: string, intent?: string) => void | Promise<void>;
    onSwitchBranch: (leafNodeId: string) => void | Promise<void>;
    onCompare: (branchIds: readonly string[]) => void | Promise<void>;
    onCloseCompare: () => void;
    onContinueCheckpoint: () => void | Promise<void>;
    onPrediction?: (uci: string) => void | Promise<void>;
    onExport: (branchIds?: readonly string[]) => void | Promise<void>;
    onStop: () => void;
    onHumanSplit?: (nodeId: string) => Promise<HumanSplitPage>;
    onCorpus?: (nodeId: string) => Promise<CorpusPage>;
    onVoice?: (nodeId: string, scope: VoicePage["scope"]) => Promise<VoicePage>;
    onCreateGroup?: (input: CreateGroupRequest) => void | Promise<unknown>;
    onAnalyzeMissing?: (nodeIds: readonly string[]) => void | Promise<void>;
    onStory?: (() => void) | undefined;
    onFlip?: ((nodeId: string) => void | Promise<void>) | undefined;
    registerKeyboardRegion: RegisterKeyboardRegion;
  }

  let {
    pack,
    shapes = [],
    snapshot,
    checkpoint,
    authoredFeedback,
    comparison,
    comparisonBranchIds,
    busy = false,
    error,
    capabilities,
    viewerRole = "host",
    boardSide,
    assistanceStorage,
    onMove,
    onRewind,
    onFork,
    onSwitchBranch,
    onCompare,
    onCloseCompare,
    onContinueCheckpoint,
    onPrediction = () => {},
    onExport,
    onStop,
    onHumanSplit,
    onCorpus,
    onVoice,
    onCreateGroup,
    onAnalyzeMissing,
    onStory,
    onFlip,
    registerKeyboardRegion,
  }: Props = $props();

  let previewNodeId: string | undefined = $state();
  let compareIds: string[] = $state([]);
  let compareStep = $state(0);
  let helpOpen = $state(false);
  let forkOpen = $state(false);
  let checkpointPickerOpen = $state(false);
  let replaying = $state(false);
  let structuralOpen = $state(false);
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

  let run = $derived(snapshot.run);
  let currentNode = $derived(activeNode(run));
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
      : resistanceSentences(run, currentNode.id),
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
  let structure = $derived(structuralReading(displayedNode.fen));
  let detectedPhase = $derived(classifyPhase(displayedNode.fen));
  let endgame = $derived(endgameReading(displayedNode.fen));
  let assistancePermission = $derived(permittedAssistance({ sessionKind: run.sessionKind, deliveryOpen: feedbackDeliveryOpen(run), role: viewerRole }));
  let projectedPivotal = $derived(assistance.markers === "live" ? pivotalMarkers(run, run.activeCursor.branchId) : []);
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
    saveAssistance(run.sessionKind, assistance, preferenceStorage());
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
    if (assistance.spoken !== "on" || !speechAvailable || sentences.length === 0) return;
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
    if (onCreateGroup === undefined) return;
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
    const target =
      event.target instanceof Node ? event.target : document.activeElement;
    return (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLButtonElement ||
      target instanceof HTMLAnchorElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    );
  }

  function selectedCompareIds(): readonly string[] | undefined {
    if (compareIds.length >= 2) return compareIds;
    const active = run.activeCursor.branchId;
    const other = cards.find((card) => card.id !== active)?.id;
    return other === undefined ? undefined : [active, other];
  }

  function openCompare(): void {
    const ids = selectedCompareIds();
    if (ids !== undefined) void onCompare(ids);
  }

  function closeCompare(): void {
    onCloseCompare();
    void tick().then(() => mainElement?.focus());
  }

  function closeHelp(): void {
    helpOpen = false;
    void tick().then(() => mainElement?.focus());
  }

  function closeFork(): void {
    forkOpen = false;
    void tick().then(() => mainElement?.focus());
  }

  function closeCheckpointPicker(): void {
    checkpointPickerOpen = false;
    void tick().then(() => mainElement?.focus());
  }

  function toggleCompare(branchId: string): void {
    if (compareIds.includes(branchId)) {
      compareIds = compareIds.filter((id) => id !== branchId);
    } else {
      if (compareIds.length < 8) compareIds = [...compareIds, branchId];
    }
  }

  function compareAllHere(forkNodeId: string): void {
    compareIds = cards.filter((card) => card.forkNodeId === forkNodeId || card.id === run.activeCursor.branchId).map((card) => card.id).slice(0, 8);
  }

  function preview(nodeId: string): void {
    previewNodeId = previewNodeId === nodeId ? undefined : nodeId;
  }

  async function confirmPreview(nodeId = previewNodeId): Promise<void> {
    if (nodeId === undefined) return;
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
          candidate.data.nodeId !== run.activeCursor.nodeId &&
          path.has(candidate.data.nodeId),
      );
    return event?.type === "checkpoint.reached" ? event.data.checkpointId : undefined;
  }

  async function submitFork(): Promise<void> {
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
      else helpOpen = true;
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
      if (event.shiftKey) {
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
    } else if (event.key === "Tab") {
      event.preventDefault();
      if (comparison === undefined) openCompare();
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
      void confirmPreview();
      return true;
    }
    return false;
  }

  onMount(() => {
    speechAvailable = typeof globalThis.speechSynthesis !== "undefined" && typeof globalThis.SpeechSynthesisUtterance !== "undefined" && globalThis.speechSynthesis.getVoices().length > 0;
    assistance = loadAssistance(run.sessionKind, preferenceStorage());
    if (regionElement === undefined) {
      throw new Error("Drill keyboard region did not mount");
    }
    unregisterKeyboard = registerKeyboardRegion(regionElement, keyboard);
    if (checkpoint === undefined) {
      mainElement?.focus();
    }
  });
  onDestroy(() => {
    unregisterKeyboard?.();
    if (replayTimer !== undefined) clearInterval(replayTimer);
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

<div class="drill-region" data-keyboard-region="drill" bind:this={regionElement}>

{#if comparison}
  <CompareView
    {run}
    {pack}
    {comparison}
    {startSide}
    step={compareStep}
    onStep={(step) => (compareStep = step)}
    onClose={closeCompare}
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
        <details class="assistance-control">
          <summary>Assistance</summary>
          <div class="assistance-grid">
            <label><input type="checkbox" checked={assistance.markers === "live"} onchange={(event) => setAssistance("markers", event.currentTarget.checked ? "live" : "off")} /> Passive pivotal markers</label>
            <label><input type="checkbox" checked={assistance.guided === "live"} onchange={(event) => setAssistance("guided", event.currentTarget.checked ? "live" : "off")} /> Named-pattern guidance</label>
            <label><input type="checkbox" checked={assistance.humanSplit === "on_request"} disabled={assistancePermission.humanSplit === "locked_off"} aria-describedby={assistancePermission.humanSplit === "locked_off" ? "human-split-locked" : undefined} onchange={(event) => setAssistance("humanSplit", event.currentTarget.checked ? "on_request" : "off")} /> Human move split on request</label>
            {#if assistancePermission.humanSplit === "locked_off"}<span id="human-split-locked" class="honest">Available only after this run opens feedback, and never to participants or spectators.</span>{/if}
            {#if capabilities?.providers.corpus !== "none"}<label><input type="checkbox" checked={assistance.corpus === "on_request"} disabled={assistancePermission.corpus === "locked_off"} aria-describedby={assistancePermission.corpus === "locked_off" ? "corpus-locked" : undefined} onchange={(event) => setAssistance("corpus", event.currentTarget.checked ? "on_request" : "off")} /> Corpus counts on request</label>{/if}
            {#if capabilities?.providers.corpus !== "none" && assistancePermission.corpus === "locked_off"}<span id="corpus-locked" class="honest">Available only after this run opens feedback, and never to participants or spectators.</span>{/if}
            {#if assistance.corpus === "on_request" && assistancePermission.corpus === "free" && capabilities?.providers.corpus !== "none" && onCorpus !== undefined}<button type="button" onclick={() => void requestCorpus()}>Show corpus counts</button>{/if}
            {#if corpusPage}<section aria-label="Corpus evidence">{#each renderCorpusPage(corpusPage) as sentence}<p class="guidance-sentence">{sentence}</p>{/each}</section>{/if}
            {#if capabilities?.providers.llm === "external"}<label><input type="checkbox" checked={assistance.voice === "persona"} onchange={(event) => setAssistance("voice", event.currentTarget.checked ? "persona" : "authored")} /> External voice</label>{/if}
            <label><input type="checkbox" checked={assistance.spoken === "on"} disabled={!speechAvailable} aria-describedby={!speechAvailable ? "spoken-unavailable" : undefined} onchange={(event) => setAssistance("spoken", event.currentTarget.checked ? "on" : "off")} /> Speak opened guidance</label>
            {#if !speechAvailable}<span id="spoken-unavailable" class="honest">Speech synthesis is unavailable in this browser.</span>{/if}
          </div>
        </details>
        <button class="help" type="button" aria-label="Keyboard shortcuts" onclick={() => (helpOpen = true)}>?</button>
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

    <div class="workspace">
      <section class="position-column" class:outcome={grading !== undefined || pack?.objective.type === "follow_theory"}>
        <div class="objective-copy">
          <p>Objective</p>
          <h1 id="drill-title">{pack === undefined ? "No pack is loaded. Nothing is claimed about this position." : packObjective(pack)}</h1>
        </div>
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
        <section class="structural-reading" aria-label="Structural reading">
          <button type="button" aria-expanded={structuralOpen} onclick={() => (structuralOpen = !structuralOpen)}>Structural reading</button>
          {#if structuralOpen}
            <div class="structural-facts">
              {#if structure.features.length === 0}<p>No rung-0 structural observations in this position.</p>{/if}
              {#each structure.features as observation}<p>{renderStructuralObservation(observation)}</p>{/each}
            </div>
          {/if}
        </section>
        <div class="board-slot">
          <div class="board-frame" class:previewing={previewNodeId !== undefined}>
            {#if previewNodeId}<span class="preview-label">Preview</span>{/if}
            {#key `${displayedNode.id}:${groupOpen ? groupCandidates.length : -1}`}
              <Chessboard
                fen={displayedNode.fen}
                startSide={boardSide ?? startSide}
                lastMove={displayedNode.moveUci}
                disabled={busy || snapshot.access === "read_only" || previewNodeId !== undefined || terminalEvent !== undefined}
                onMove={boardMove}
              />
            {/key}
          </div>
        </div>
      </section>

      <div class="rail-stack">
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
          onSwitch={onSwitchBranch}
          onToggleCompare={toggleCompare}
          onCompareAllHere={compareAllHere}
          {groupOrdinals}
        />
      </div>

      <div class="timeline-row">
        <Timeline
          {entries}
          activeNodeId={run.activeCursor.nodeId}
          {previewNodeId}
          onPreview={preview}
          onConfirm={confirmPreview}
          {authoredSpineNodeIds}
          rootNodeId={run.nodes[0]?.id}
          {shapeMarkers}
          onOpenShape={(entryId) => (openShapeId = entryId)}
          pivotalMarkers={pivotalRows}
          onOpenPivotal={openPivotalMarker}
        />
        <div class="quick-actions" aria-label="Run actions">
          <button type="button" onclick={() => (forkOpen = true)}>Fork <kbd>B</kbd></button>
          <button type="button" onclick={() => (groupOpen = !groupOpen)}>Branch group</button>
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
                onclick={openCompare}
              >Compare <kbd>Tab</kbd></button>
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

{#if checkpoint}
  <CheckpointSheet
    {run}
    node={currentNode}
    {startSide}
    {onPrediction}
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

{#if terminalEvent?.type === "outcome.reached"}
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

{#if helpOpen}<KeyboardHelp onClose={closeHelp} />{/if}

{#if forkOpen}
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

{#if checkpointPickerOpen}
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

{#if openShape}<ShapePanel entry={openShape} onClose={() => (openShapeId = undefined)} />{/if}
{#if openPivotalNodeId !== undefined}
  <div class="modal-backdrop">
    <div class="modal guidance-panel" role="dialog" aria-modal="true" aria-labelledby="pivotal-title">
      <p>Pivotal marker</p><h2 id="pivotal-title">Recorded change</h2>
      {#each openPivotal as marker}{#each renderPivotalMarker(marker) as sentence}<p class="guidance-sentence">{sentence}</p>{/each}{/each}
      {#each renderEndgameReading(endgame) as sentence}<p class="guidance-sentence">{sentence}</p>{/each}
      {#if assistance.guided === "live"}
        {#each guidedShapes as shape}<section><h3>{shape.name}</h3><p>Named plans for this structure — general to the kind of position, not advice for this one.</p><ul>{#each shape.plans as plan}<li>{plan.label}</li>{/each}</ul></section>{:else}<p class="guidance-sentence">No named structure entry matches this position.</p>{/each}
      {/if}
      {#if assistance.humanSplit === "on_request" && assistancePermission.humanSplit === "free" && onHumanSplit !== undefined}<button type="button" onclick={() => void requestHumanSplit()}>Show recorded human-model split</button>{/if}
      {#if humanSplit}<p class="guidance-sentence">{humanSplit.engine.name}, rating target {humanSplit.targetElo ?? "unrated"}: {humanSplit.candidates.map((candidate) => `${candidate.moveUci} ${candidate.mass === undefined ? "mass unavailable" : `${Math.round(candidate.mass * 100)}%`}`).join(" · ")}</p>{/if}
      {#if assistance.voice === "persona" && capabilities?.providers.llm === "external" && onVoice !== undefined}<button type="button" onclick={() => void requestVoice("marker")}>Revoice this packet</button>{/if}
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

  .position-column {
    width: 100%;
    min-height: 0;
    justify-self: center;
    display: grid;
    grid-template-rows: auto auto auto minmax(0, 1fr);
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
    margin: 0.25rem 0 0;
    font: 500 clamp(1.4rem, 3vw, 2.4rem) / 1.04 var(--display-font);
  }

  .structural-reading > button {
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
    height: 100%;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .board-frame {
    position: relative;
    width: min(100%, max(10rem, calc(100dvh - 34rem)), 40rem);
    height: auto;
    aspect-ratio: 1;
    justify-self: center;
    overflow: hidden;
    border-radius: 0.8rem;
    box-shadow: var(--shadow);
  }

  .position-column.outcome .board-frame {
    width: min(100%, max(10rem, calc(100dvh - 42rem)), 34rem);
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

  @media (max-width: 62rem) {
    .drill-region {
      overflow: auto;
    }

    .drill {
      height: auto;
      min-height: 100%;
      overflow: visible;
    }

    .workspace {
      grid-template-columns: 1fr;
      grid-template-rows: auto;
      overflow: visible;
    }

    .timeline-row {
      grid-column: 1;
      grid-template-columns: 1fr;
      max-height: none;
      overflow: visible;
    }

    .position-column { overflow: visible; }
    .board-frame { width: min(100%, 42rem); }
  }

  @media (max-width: 38rem) {
    .drill {
      width: min(100% - 1rem, 86rem);
    }

    .topbar {
      grid-template-columns: 1fr auto;
    }

    .status {
      grid-column: 1 / -1;
      grid-row: 2;
      margin-top: 0.5rem;
    }

    .help {
      grid-column: 2;
      grid-row: 1;
    }
  }
</style>
