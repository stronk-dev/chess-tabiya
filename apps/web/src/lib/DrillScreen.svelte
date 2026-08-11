<script lang="ts">
  import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
  import type { BranchComparison } from "@chess-tabiya/runtime";
  import { onDestroy, onMount, tick } from "svelte";

  import BranchRail from "./BranchRail.svelte";
  import CheckpointSheet from "./CheckpointSheet.svelte";
  import Chessboard from "./Chessboard.svelte";
  import CompareView from "./CompareView.svelte";
  import KeyboardHelp from "./KeyboardHelp.svelte";
  import Timeline from "./Timeline.svelte";
  import WhyBanner from "./WhyBanner.svelte";
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

  type RewindTarget =
    | { readonly nodeId: string }
    | { readonly checkpointId: string };

  interface Props {
    pack: DrillPackDefinition;
    snapshot: RunStateSnapshot;
    checkpoint?: CheckpointNotice | undefined;
    comparison?: BranchComparison | undefined;
    comparisonBranchIds?: readonly [string, string] | undefined;
    busy?: boolean;
    error?: string | undefined;
    onMove: (uci: string) => void | Promise<void>;
    onRewind: (target: RewindTarget) => void | Promise<void>;
    onFork: (label?: string, intent?: string) => void | Promise<void>;
    onSwitchBranch: (leafNodeId: string) => void | Promise<void>;
    onCompare: (branchIds: readonly [string, string]) => void | Promise<void>;
    onCloseCompare: () => void;
    onContinueCheckpoint: () => void | Promise<void>;
    onExport: () => void | Promise<void>;
    onStop: () => void;
  }

  let {
    pack,
    snapshot,
    checkpoint,
    comparison,
    comparisonBranchIds,
    busy = false,
    error,
    onMove,
    onRewind,
    onFork,
    onSwitchBranch,
    onCompare,
    onCloseCompare,
    onContinueCheckpoint,
    onExport,
    onStop,
  }: Props = $props();

  let previewNodeId: string | undefined = $state();
  let compareIds: string[] = $state([]);
  let compareStep = $state(0);
  let helpOpen = $state(false);
  let forkOpen = $state(false);
  let checkpointPickerOpen = $state(false);
  let replaying = $state(false);
  let forkLabel = $state("");
  let forkIntent = $state("");
  let replayTimer: ReturnType<typeof setInterval> | undefined;
  let mainElement = $state<HTMLElement>();
  let forkInput = $state<HTMLInputElement>();
  let pickerHeading = $state<HTMLHeadingElement>();

  let run = $derived(snapshot.run);
  let currentNode = $derived(activeNode(run));
  let entries = $derived(timelineEntries(run));
  let cards = $derived(branchCards(run));
  let banner = $derived(whyBanner(pack, run));
  let startSide = $derived(packStartSide(pack));
  let displayedNode = $derived(
    previewNodeId === undefined
      ? currentNode
      : (run.nodes.find((node) => node.id === previewNodeId) ?? currentNode),
  );
  let compareLabels = $derived.by((): readonly [string, string] => {
    const ids = comparisonBranchIds;
    if (ids === undefined) return ["Branch A", "Branch B"];
    return [
      cards.find((card) => card.id === ids[0])?.label ?? "Branch A",
      cards.find((card) => card.id === ids[1])?.label ?? "Branch B",
    ];
  });

  function interactiveTarget(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLButtonElement ||
      target instanceof HTMLAnchorElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    );
  }

  function defaultCompareIds(): readonly [string, string] | undefined {
    if (compareIds.length === 2) return [compareIds[0]!, compareIds[1]!];
    const active = run.activeCursor.branchId;
    const other = cards.find((card) => card.id !== active)?.id;
    return other === undefined ? undefined : [active, other];
  }

  function openCompare(): void {
    const ids = defaultCompareIds();
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

  function toggleCompare(branchId: string): void {
    if (compareIds.includes(branchId)) {
      compareIds = compareIds.filter((id) => id !== branchId);
    } else {
      compareIds = [...compareIds.slice(-1), branchId];
    }
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
        Math.min(comparison.pairs.length, compareStep + delta),
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

  function keyboard(event: KeyboardEvent): void {
    if (event.key === "?" || (event.key === "/" && event.shiftKey)) {
      event.preventDefault();
      if (helpOpen) closeHelp();
      else helpOpen = true;
      return;
    }
    if (event.key === "Escape") {
      helpOpen = false;
      forkOpen = false;
      checkpointPickerOpen = false;
      return;
    }
    if (
      interactiveTarget(event.target) ||
      helpOpen ||
      forkOpen ||
      checkpointPickerOpen ||
      checkpoint !== undefined
    ) {
      return;
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
    } else if (event.key.toLowerCase() === "b") {
      event.preventDefault();
      forkOpen = true;
      void tick().then(() => forkInput?.focus());
    } else if (/^[1-9]$/.test(event.key)) {
      const branch = cards[Number(event.key) - 1];
      if (branch !== undefined) {
        event.preventDefault();
        void onSwitchBranch(branch.leafNodeId);
      }
    } else if (event.key === "Tab") {
      event.preventDefault();
      if (comparison === undefined) openCompare();
      else closeCompare();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      stepTimeline(event.key === "ArrowLeft" ? -1 : 1);
    } else if (event.key === " ") {
      event.preventDefault();
      toggleReplay();
    } else if (event.key.toLowerCase() === "e") {
      event.preventDefault();
      void onExport();
    } else if (event.key === "Enter" && previewNodeId !== undefined) {
      event.preventDefault();
      void confirmPreview();
    }
  }

  onMount(() => {
    if (checkpoint === undefined) {
      mainElement?.focus();
    }
  });
  onDestroy(() => {
    if (replayTimer !== undefined) clearInterval(replayTimer);
  });

  $effect(() => {
    comparison;
    compareStep = 0;
  });
</script>

<svelte:window onkeydown={keyboard} />

{#if comparison}
  <CompareView
    {run}
    {comparison}
    branchLabels={compareLabels}
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
        {#if snapshot.pendingEvidence > 0}<span>{snapshot.pendingEvidence} evidence waiting</span>{/if}
      </div>
      <button class="help" type="button" aria-label="Keyboard shortcuts" onclick={() => (helpOpen = true)}>?</button>
    </header>

    {#if error}<p class="error" role="alert">{error}</p>{/if}
    {#if snapshot.access === "read_only"}
      <p class="readonly-banner" role="status">
        Another browser owns this run. You can follow its events, but this view cannot move or rewind.
      </p>
    {/if}

    <div class="workspace">
      <section class="position-column">
        <div class="objective-copy">
          <p>Objective</p>
          <h1 id="drill-title">{packObjective(pack)}</h1>
        </div>
        <WhyBanner model={banner} />
        <div class="board-frame" class:previewing={previewNodeId !== undefined}>
          {#if previewNodeId}<span class="preview-label">Preview</span>{/if}
          <Chessboard
            fen={displayedNode.fen}
            {startSide}
            lastMove={displayedNode.moveUci}
            disabled={busy || snapshot.access === "read_only" || previewNodeId !== undefined}
            {onMove}
          />
        </div>
      </section>

      <BranchRail
        branches={cards}
        activeBranchId={run.activeCursor.branchId}
        {compareIds}
        onSwitch={onSwitchBranch}
        onToggleCompare={toggleCompare}
      />

      <div class="timeline-row">
        <Timeline
          {entries}
          activeNodeId={run.activeCursor.nodeId}
          {previewNodeId}
          onPreview={preview}
          onConfirm={confirmPreview}
        />
        <div class="quick-actions" aria-label="Run actions">
          <button type="button" onclick={() => (forkOpen = true)}>Fork <kbd>B</kbd></button>
          <button type="button" disabled={cards.length < 2} onclick={openCompare}>Compare <kbd>Tab</kbd></button>
          <button type="button" aria-pressed={replaying} onclick={toggleReplay}>
            {replaying ? "Pause" : "Replay"} <kbd>Space</kbd>
          </button>
          <button type="button" onclick={onExport}>Export <kbd>E</kbd></button>
        </div>
      </div>
    </div>
  </main>
{/if}

{#if checkpoint}
  <CheckpointSheet
    {checkpoint}
    canCompare={cards.length >= 2}
    onContinue={onContinueCheckpoint}
    onRewind={() => onRewind({ nodeId: checkpoint.nodeId })}
    onCompare={openCompare}
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
        <div><button type="button" onclick={() => (forkOpen = false)}>Cancel</button><button class="primary" type="submit">Create branch</button></div>
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
              {pack.checkpoints.find((item) => item.id === event.data.checkpointId)?.label ?? event.data.checkpointId}
            </button>
          {/if}
        {:else}<p>No checkpoint reached yet.</p>{/each}
      </div>
      <button type="button" onclick={() => (checkpointPickerOpen = false)}>Cancel</button>
    </div>
  </div>
{/if}

<style>
  .drill {
    width: min(86rem, calc(100% - 2rem));
    margin: 0 auto;
    padding: 0.75rem 0 2rem;
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
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(15rem, 0.38fr);
    gap: 1rem;
    align-items: start;
  }

  .position-column {
    width: min(100%, 46rem);
    justify-self: center;
    display: grid;
    gap: 0.8rem;
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

  .board-frame {
    position: relative;
    overflow: hidden;
    border-radius: 0.8rem;
    box-shadow: var(--shadow);
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
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(7rem, 1fr));
    gap: 0.45rem;
  }

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

  @media (max-width: 62rem) {
    .workspace {
      grid-template-columns: 1fr;
    }

    .timeline-row {
      grid-column: 1;
      grid-template-columns: 1fr;
    }
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
