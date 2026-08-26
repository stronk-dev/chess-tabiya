<script lang="ts">
  import type { BranchCard } from "./screen-model.js";
  import { renderCollapseExplanation, type Decidedness } from "@chess-tabiya/runtime";
  import { objectiveStateLabel } from "./run-copy.js";

  interface Props {
    branches: readonly BranchCard[];
    activeBranchId: string;
    compareIds: readonly string[];
    onSwitch: (nodeId: string, branchId: string) => void | Promise<void>;
    onToggleCompare: (branchId: string) => void;
    onCompareAllHere?: (forkNodeId: string) => void;
    groupOrdinals?: Readonly<Record<string, number>>;
    decidedness?: Readonly<Record<string, Decidedness>>;
    collapsedBranchIds?: ReadonlySet<string>;
    foldedBranchIds?: readonly string[];
    compareLimitNotice?: string | undefined;
    onFold?: (branchId: string) => void;
    onRestore?: (branchId: string) => void;
    onRestoreAll?: () => void;
    onClassify?: (() => void | Promise<void>) | undefined;
  }

  let { branches, activeBranchId, compareIds, onSwitch, onToggleCompare, onCompareAllHere, groupOrdinals = {}, decidedness = {}, collapsedBranchIds = new Set(), foldedBranchIds = [], compareLimitNotice, onFold, onRestore, onRestoreAll, onClassify }: Props =
    $props();
  let folded = $derived(new Set(foldedBranchIds));
  let visible = $derived(branches.filter((branch) => !folded.has(branch.id) && !collapsedBranchIds.has(branch.id)));
  let settled = $derived(branches.filter((branch) => collapsedBranchIds.has(branch.id) && !folded.has(branch.id)));
  let hidden = $derived(branches.filter((branch) => folded.has(branch.id)));
  let unclassified = $derived(branches.filter((branch) => decidedness[branch.id]?.state !== "decided").length);
</script>

<aside class="rail" aria-labelledby="branch-title" data-active-branch-id={activeBranchId}>
  <div class="heading">
    <h2 id="branch-title">Branches</h2>
    <span>{branches.length} branches · {settled.length} settled · {hidden.length} hidden by you · {unclassified} still open</span>
  </div>
  <ol>
    {#each visible as branch, index}
      <li class:active={branch.id === activeBranchId}>
        <button
          class="branch-card"
          type="button"
          onclick={() => onSwitch(branch.leafNodeId, branch.id)}
          aria-label={`Switch to branch ${index + 1}: ${branch.label}`}
          aria-current={branch.id === activeBranchId ? "true" : undefined}
        >
          <span class="number">{index + 1}</span>
          <span class="copy">
            <strong>{branch.label}</strong>
            <small>{branch.firstMove}{branch.intent ? ` · ${branch.intent}` : ""}</small>
          </span>
          <span class:terminal={branch.terminal} class="objective">
            {objectiveStateLabel(branch.objectiveState)}
          </span>
          {#if branch.origin === "simulated"}<span>preview line</span>{/if}
          {#if groupOrdinals[branch.id] !== undefined}<span class="group-marker">group {groupOrdinals[branch.id]}</span>{/if}
        </button>
        <label>
          <input
            type="checkbox"
            checked={compareIds.includes(branch.id)}
            onchange={() => onToggleCompare(branch.id)}
          />
          compare
        </label>
        {#if onFold}<button class="fold" type="button" onclick={() => onFold?.(branch.id)}>Hide</button>{/if}
      </li>
    {/each}
  </ol>
  {#if onCompareAllHere}
    <button type="button" onclick={() => onCompareAllHere(branches.find((branch) => branch.id === activeBranchId)?.forkNodeId ?? "")}>Compare all forked here</button>
    {#if compareLimitNotice}<span class="reason" role="status" aria-live="polite" aria-atomic="true">{compareLimitNotice}</span>{/if}
  {/if}
  {#if onClassify && unclassified > 0}<button type="button" onclick={() => onClassify?.()}>Classify remaining</button>{/if}
  {#if settled.length > 0}
    <details><summary>Settled outcomes ({settled.length})</summary><ul>{#each settled as branch}{@const fact = decidedness[branch.id]}<li><button type="button" onclick={() => onRestore?.(branch.id)}>{branch.label}</button>{#if fact?.state === "decided"}<span>{renderCollapseExplanation(branch.id, fact, branch.leafPly).text}</span>{/if}</li>{/each}</ul></details>
  {/if}
  {#if hidden.length > 0}
    <details><summary>Hidden by you ({hidden.length})</summary><button type="button" onclick={() => onRestoreAll?.()}>Restore all</button><ul>{#each hidden as branch}<li><button type="button" onclick={() => onRestore?.(branch.id)}>{branch.label}</button></li>{/each}</ul></details>
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
    background: var(--surface);
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

  .fold{margin:.15rem .4rem;border:0;background:transparent;color:var(--muted);font-size:.7rem;text-decoration:underline;cursor:pointer}
  .reason,details span{display:block;color:var(--muted);font-size:.7rem;margin:.35rem 0}
  details{margin-top:.5rem;font-size:.75rem}
  details ul{list-style:none;padding:0;display:grid;gap:.35rem}

  .group-marker{grid-column:2;color:var(--accent);font:600 .62rem ui-monospace,monospace;text-transform:uppercase}
</style>
