<script lang="ts">
  import type { BranchCard } from "./screen-model.js";

  interface Props {
    branches: readonly BranchCard[];
    activeBranchId: string;
    compareIds: readonly string[];
    onSwitch: (nodeId: string) => void | Promise<void>;
    onToggleCompare: (branchId: string) => void;
    onCompareAllHere?: (forkNodeId: string) => void;
  }

  let { branches, activeBranchId, compareIds, onSwitch, onToggleCompare, onCompareAllHere }: Props =
    $props();
</script>

<aside class="rail" aria-labelledby="branch-title">
  <div class="heading">
    <h2 id="branch-title">Branches</h2>
    <span>{branches.length}</span>
  </div>
  <ol>
    {#each branches as branch, index}
      <li class:active={branch.id === activeBranchId}>
        <button
          class="branch-card"
          type="button"
          onclick={() => onSwitch(branch.leafNodeId)}
          aria-label={`Switch to branch ${index + 1}: ${branch.label}`}
        >
          <span class="number">{index + 1}</span>
          <span class="copy">
            <strong>{branch.label}</strong>
            <small>{branch.firstMove}{branch.intent ? ` · ${branch.intent}` : ""}</small>
          </span>
          <span class:terminal={branch.terminal} class="objective">
            {branch.objectiveState}
          </span>
          {#if branch.origin === "simulated"}<span>simulated</span>{/if}
        </button>
        <label>
          <input
            type="checkbox"
            checked={compareIds.includes(branch.id)}
            onchange={() => onToggleCompare(branch.id)}
          />
          compare
        </label>
      </li>
    {/each}
  </ol>
  {#if onCompareAllHere}
    <button type="button" onclick={() => onCompareAllHere(branches.find((branch) => branch.id === activeBranchId)?.forkNodeId ?? "")}>Compare all forked here</button>
  {/if}
</aside>

<style>
  .rail {
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
  }

  .heading {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.75rem;
  }

  h2 {
    margin: 0;
    font: 600 1rem/1.2 var(--display-font);
  }

  .heading span {
    color: var(--muted);
    font: 0.75rem ui-monospace, monospace;
  }

  ol {
    display: grid;
    gap: 0.55rem;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    list-style: none;
  }

  li {
    padding: 0.4rem;
    border: 1px solid var(--line);
    border-radius: 0.85rem;
    background: var(--panel);
  }

  li.active {
    border-color: var(--accent);
    box-shadow: inset 3px 0 0 var(--accent);
  }

  .branch-card {
    width: 100%;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.6rem;
    align-items: center;
    padding: 0.35rem;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .number {
    color: var(--muted);
    font: 0.68rem ui-monospace, monospace;
  }

  .copy {
    min-width: 0;
  }

  strong,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    margin-top: 0.2rem;
    color: var(--muted);
  }

  .objective {
    padding: 0.2rem 0.4rem;
    border-radius: 999px;
    background: var(--paper-soft);
    font: 600 0.6rem/1 ui-monospace, monospace;
    text-transform: uppercase;
  }

  .objective.terminal {
    background: var(--ink);
    color: var(--paper);
  }

  label {
    display: inline-flex;
    gap: 0.35rem;
    margin: 0.25rem 0.4rem 0.2rem;
    color: var(--muted);
    font-size: 0.7rem;
  }
</style>
