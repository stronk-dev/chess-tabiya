<script lang="ts">
  import HonestControl from "./HonestControl.svelte";
  import type { TimelineEntry } from "./screen-model.js";

  interface Props {
    entries: readonly TimelineEntry[];
    activeNodeId: string;
    previewNodeId?: string | undefined;
    onPreview: (nodeId: string) => void;
    onConfirm: (nodeId: string) => void | Promise<void>;
    canConfirm?: boolean;
    authoredSpineNodeIds?: ReadonlySet<string>;
    rootNodeId?: string | undefined;
    shapeMarkers?: readonly { readonly nodeId: string; readonly entryId: string; readonly label: string; readonly channel: "official" | "community" }[];
    onOpenShape?: (entryId: string) => void;
    pivotalMarkers?: readonly { readonly nodeId: string; readonly label: string }[];
    onOpenPivotal?: (nodeId: string) => void;
  }

  let {
    entries,
    activeNodeId,
    previewNodeId,
    onPreview,
    onConfirm,
    canConfirm = true,
    authoredSpineNodeIds = new Set<string>(),
    rootNodeId,
    shapeMarkers = [],
    onOpenShape = () => {},
    pivotalMarkers = [],
    onOpenPivotal = () => {},
  }: Props = $props();

  let rootMarkers = $derived(shapeMarkers.filter((marker) => marker.nodeId === rootNodeId));
  let rootPivotal = $derived(pivotalMarkers.some((marker) => marker.nodeId === rootNodeId));
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (only an empty timeline needs a focusable region) -->
<section class="timeline" aria-labelledby="timeline-title" tabindex={entries.length === 0 ? 0 : undefined}>
  <div class="timeline-heading">
    <h2 id="timeline-title">Active line</h2>
    <span>{entries.length} plies</span>
  </div>
  <ol>
    {#if rootMarkers.length > 0 && rootNodeId !== undefined}
      <li>
        <button type="button" aria-label="Start position" tabindex={previewNodeId === rootNodeId || (previewNodeId === undefined && activeNodeId === rootNodeId) ? 0 : -1} data-timeline-node={rootNodeId} class:preview={previewNodeId === rootNodeId} onclick={() => onPreview(rootNodeId)}>
          <span class="ply">0</span><span>Start</span>
        </button>
        {#each rootMarkers as marker}<button class="shape-marker" type="button" onclick={() => onOpenShape(marker.entryId)}>{marker.label}{marker.channel === "community" ? " · community" : ""}</button>{/each}
        {#if rootPivotal}<button class="pivotal-marker" type="button" aria-label="Open pivotal marker at ply 0" onclick={() => onOpenPivotal(rootNodeId)}><span aria-hidden="true"></span></button>{/if}
      </li>
    {/if}
    {#each entries as entry}
      <li class:checkpoint={entry.checkpointIds.length > 0}>
        <button
          type="button"
          tabindex={(previewNodeId ?? activeNodeId) === entry.nodeId ? 0 : -1}
          data-timeline-node={entry.nodeId}
          class:preview={previewNodeId === entry.nodeId}
          aria-current={activeNodeId === entry.nodeId ? "step" : undefined}
          aria-label={`Ply ${entry.ply}: ${entry.moveSan}${
            entry.checkpointIds.length > 0 ? `, checkpoint ${entry.checkpointIds.join(", ")}` : ""
          }`}
          onclick={() => onPreview(entry.nodeId)}
        >
          <span class="ply">{entry.ply}</span>
          <span>{entry.moveSan}</span>
          {#if entry.checkpointIds.length > 0}
            <span class="marker" aria-hidden="true"></span>
          {/if}
          {#if entry.spineNodeId && authoredSpineNodeIds.has(entry.spineNodeId)}
            <span class="authored-marker" aria-label="Authored commentary available">A</span>
          {/if}
          {#if entry.guardGenerated}
            <span class="guard-marker" aria-label="Post-commit guard recorded">G</span>
          {/if}
        </button>
        {#each shapeMarkers.filter((marker) => marker.nodeId === entry.nodeId) as marker}<button class="shape-marker" type="button" onclick={() => onOpenShape(marker.entryId)}>{marker.label}{marker.channel === "community" ? " · community" : ""}</button>{/each}
        {#if pivotalMarkers.some((marker) => marker.nodeId === entry.nodeId)}<button class="pivotal-marker" type="button" aria-label={`Open pivotal marker at ply ${entry.ply}`} onclick={() => onOpenPivotal(entry.nodeId)}><span aria-hidden="true"></span></button>{/if}
      </li>
    {/each}
  </ol>
  {#if previewNodeId}
    <div class="rewind-offer">
      <span>Your attempt is kept. Going back makes a second one.</span>
      <HonestControl
        disabled={!canConfirm}
        reasonId="timeline-rewind-readonly"
        reason="This read-only view can inspect earlier positions but cannot rewind the shared run."
      >
        {#snippet children(describedBy)}
          <button
            class="confirm"
            type="button"
            disabled={!canConfirm}
            aria-label="Rewind to preview"
            aria-describedby={describedBy}
            onclick={() => onConfirm(previewNodeId)}
          >Rewind to preview <kbd>Enter</kbd></button>
        {/snippet}
      </HonestControl>
    </div>
  {/if}
</section>

<style>
  .timeline {
    min-width: 0;
    min-height: 0;
    padding: 1rem;
    border: 1px solid var(--line);
    border-radius: 1rem;
    background: var(--panel);
    overflow: hidden;
  }

  .timeline-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  h2 {
    margin: 0;
    font: 600 1rem/1.2 var(--display-font);
  }

  .timeline-heading span {
    color: var(--muted);
    font-size: 0.75rem;
  }

  ol {
    display: flex;
    gap: 0.35rem;
    margin: 0.8rem 0 0;
    padding: 0 0 0.4rem;
    overflow-x: auto;
    list-style: none;
  }

  li {
    position: relative;
    flex: 0 0 auto;
  }

  li > button {
    min-width: 3.8rem;
    padding: 0.55rem 0.65rem;
    border: 1px solid transparent;
    border-radius: 0.65rem;
    background: var(--surface);
    color: var(--ink);
    cursor: pointer;
  }

  li > button:hover,
  li > button:focus-visible,
  li > button.preview {
    border-color: var(--accent);
  }

  li > button[aria-current="step"] {
    background: var(--ink);
    color: var(--paper);
  }

  .ply {
    display: block;
    margin-bottom: 0.15rem;
    color: var(--muted);
    font: 600 0.6rem/1 ui-monospace, monospace;
  }

  .marker {
    position: absolute;
    right: 0.35rem;
    top: 0.35rem;
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 50%;
    background: var(--warning);
  }

  .rewind-offer {
    display: grid;
    gap: 0.35rem;
  }

  .rewind-offer > span {
    color: var(--muted);
    font-size: 0.72rem;
    line-height: 1.3;
  }

  .authored-marker {
    display: block;
    margin-top: 0.2rem;
    color: var(--accent);
    font: 700 0.55rem/1 ui-monospace, monospace;
  }

  .guard-marker {
    display: block;
    margin-top: 0.2rem;
    color: var(--ink);
    font: 700 0.55rem/1 ui-monospace, monospace;
  }

  .shape-marker{display:block;margin-top:.25rem;width:100%;padding:.3rem .45rem;border:1px solid var(--accent);border-radius:.45rem;background:transparent;color:var(--accent);font:.65rem/1.2 var(--display-font)}
  .pivotal-marker{display:block!important;min-width:1.5rem;min-height:1.5rem;margin:.25rem auto 0;padding:0!important;border:0!important;background:transparent!important}.pivotal-marker span{display:block;width:.55rem;height:.55rem;margin:auto;border-radius:50%;background:var(--warning)}

  .confirm {
    margin-top: 0.5rem;
    padding: 0.55rem 0.75rem;
    border: 0;
    border-radius: 0.6rem;
    background: var(--accent);
    color: white;
    cursor: pointer;
  }

  kbd {
    margin-left: 0.5rem;
    opacity: 0.75;
  }
</style>
