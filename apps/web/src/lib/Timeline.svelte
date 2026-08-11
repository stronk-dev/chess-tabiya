<script lang="ts">
  import type { TimelineEntry } from "./screen-model.js";

  interface Props {
    entries: readonly TimelineEntry[];
    activeNodeId: string;
    previewNodeId?: string | undefined;
    onPreview: (nodeId: string) => void;
    onConfirm: (nodeId: string) => void | Promise<void>;
  }

  let { entries, activeNodeId, previewNodeId, onPreview, onConfirm }: Props = $props();
</script>

<section class="timeline" aria-labelledby="timeline-title">
  <div class="timeline-heading">
    <h2 id="timeline-title">Active line</h2>
    <span>{entries.length} plies</span>
  </div>
  <ol>
    {#each entries as entry}
      <li class:checkpoint={entry.checkpointIds.length > 0}>
        <button
          type="button"
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
        </button>
      </li>
    {/each}
  </ol>
  {#if previewNodeId}
    <button class="confirm" type="button" onclick={() => onConfirm(previewNodeId)}>
      Rewind to preview <kbd>Enter</kbd>
    </button>
  {/if}
</section>

<style>
  .timeline {
    padding: 1rem;
    border: 1px solid var(--line);
    border-radius: 1rem;
    background: var(--panel);
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
    background: var(--paper-soft);
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
