<script lang="ts">
  import { branchPath, type BranchGroup, type DrillRun } from "@chess-tabiya/runtime";

  import Chessboard from "./Chessboard.svelte";
  import type { StartSide } from "./board-model.js";

  type ZoomBand = "far" | "mid" | "near";
  type AdvanceMode = "sequential" | "lockstep";

  interface Props {
    run: DrillRun;
    group: BranchGroup;
    startSide: StartSide;
    advanceMode: AdvanceMode;
    onAdvanceMode: (mode: AdvanceMode) => void;
    onEnter: (leafNodeId: string) => void | Promise<void>;
    onCompare: () => void | Promise<void>;
    onAnalyze: (nodeIds: readonly string[]) => void | Promise<void>;
  }

  let { run, group, startSide, advanceMode, onAdvanceMode, onEnter, onCompare, onAnalyze }: Props = $props();
  let zoom: ZoomBand = $state("mid");

  let cells = $derived(group.members.map((member, index) => {
    const path = branchPath(run, member.branchId);
    const leaf = path.at(-1)!;
    const branch = run.branches.find((candidate) => candidate.id === member.branchId)!;
    const outcome = [...run.events].reverse().find((event) => event.type === "outcome.reached" && event.data.nodeId === leaf.id);
    return {
      member,
      index,
      leaf,
      branch,
      plyCount: Math.max(0, leaf.ply - run.nodes.find((node) => node.id === group.sourceNodeId)!.ply),
      checkpointCount: path.reduce((count, node) => count + node.checkpointRefs.length, 0),
      outcome: outcome?.type === "outcome.reached" ? outcome.data.outcome : undefined,
      hasEvidence: leaf.evidenceRefs.length > 0,
    };
  }));
  let missingNodeIds = $derived(cells.filter((cell) => !cell.hasEvidence).map((cell) => cell.leaf.id));

  function sourceSentence(): string {
    if (group.source === "human_replies") {
      const engine = group.distribution?.engine;
      return engine === undefined
        ? "Seeded from a recorded human-reply distribution."
        : `Seeded from recorded human replies (${engine.name}${engine.modelId === undefined ? "" : ` · ${engine.modelId}`}).`;
    }
    if (group.source === "engine_top_n") {
      const engine = group.distribution?.engine;
      return engine === undefined ? "Seeded from recorded engine lines." : `Seeded from recorded engine lines (${engine.name} ${engine.version}).`;
    }
    return group.source === "authored" ? "Seeded from authored variations." : "Moves chosen for this experiment.";
  }

  function resistanceSentence(): string {
    return group.resistance === "fixed"
      ? "Fixed resistance: within this group, the same position always receives the same reply."
      : "Varied resistance: each branch faces its own opponent draw.";
  }
</script>

<section class="group-panel" aria-labelledby={`group-${group.groupId}`}>
  <header>
    <div>
      <p>Branch group · {group.members.length} candidates</p>
      <h2 id={`group-${group.groupId}`}>{sourceSentence()}</h2>
      <span>{resistanceSentence()}</span>
    </div>
    <div class="controls">
      <label>Advance
        <select value={advanceMode} onchange={(event) => onAdvanceMode(event.currentTarget.value as AdvanceMode)}>
          <option value="sequential">Sequential</option>
          <option value="lockstep">Lockstep</option>
        </select>
      </label>
      <div class="zoom-control" aria-label="Group detail">
        <button type="button" aria-pressed={zoom === "far"} onclick={() => (zoom = "far")}>Overview</button>
        <button type="button" aria-pressed={zoom === "mid"} onclick={() => (zoom = "mid")}>Summary</button>
        <button type="button" aria-pressed={zoom === "near"} onclick={() => (zoom = "near")}>Boards</button>
      </div>
      <button type="button" onclick={onCompare}>Compare group</button>
    </div>
  </header>

  <div class="canvas" data-zoom={zoom} style={`--members:${group.members.length}`}>
    {#each cells as cell}
      <article data-group-member={cell.member.branchId} class:active={cell.member.branchId === run.activeCursor.branchId}>
        <button class="cell-heading" type="button" onclick={() => onEnter(cell.leaf.id)}>
          <strong>{cell.branch.label}</strong>
          <span>{cell.leaf.objectiveState}{cell.outcome === undefined ? "" : ` · ${cell.outcome}`}</span>
        </button>
        {#if zoom === "mid" || zoom === "near"}
          <dl>
            <div><dt>Last move</dt><dd>{cell.leaf.moveSan ?? "No move"}</dd></div>
            <div><dt>Plies</dt><dd>{cell.plyCount}</dd></div>
            <div><dt>Checkpoints</dt><dd>{cell.checkpointCount}</dd></div>
          </dl>
          {#if !cell.hasEvidence}<p class="absence">No recorded engine evidence for this branch leaf.</p>{/if}
        {/if}
        {#if zoom === "near"}
          <Chessboard fen={cell.leaf.fen} {startSide} lastMove={cell.leaf.moveUci} disabled onMove={() => {}} />
        {/if}
      </article>
    {/each}
  </div>

  {#if missingNodeIds.length > 0}
    <button class="analysis" type="button" onclick={() => onAnalyze(missingNodeIds)}>Analyze missing evidence</button>
  {/if}
</section>

<style>
  .group-panel{min-height:0;padding:.7rem;border:1px solid var(--line);border-radius:.9rem;background:var(--panel);overflow:hidden}.group-panel>header{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}.group-panel h2{margin:.1rem 0;font:600 1rem/1.2 var(--display-font)}.group-panel header p,.group-panel header span{margin:0;color:var(--muted);font-size:.72rem}.controls{display:flex;align-items:end;gap:.5rem;flex-wrap:wrap}.controls label{display:grid;gap:.2rem;font-size:.65rem;color:var(--muted)}select,button{padding:.45rem .55rem;border:1px solid var(--line);border-radius:.55rem;background:var(--paper);color:inherit}.zoom-control{display:flex;gap:.2rem}.zoom-control button[aria-pressed="true"]{border-color:var(--accent)}.canvas{display:grid;grid-template-columns:repeat(var(--members),minmax(9rem,1fr));gap:.55rem;margin-top:.65rem;overflow:auto;overscroll-behavior:contain}.canvas article{min-width:9rem;padding:.5rem;border:1px solid var(--line);border-radius:.65rem;background:var(--paper-soft)}.canvas article.active{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}.cell-heading{width:100%;display:flex;justify-content:space-between;gap:.4rem;text-align:left}.cell-heading span{font-size:.65rem;text-transform:uppercase;color:var(--muted)}dl{display:grid;gap:.2rem;margin:.45rem 0;font-size:.7rem}dl div{display:flex;justify-content:space-between;gap:.5rem}dt{color:var(--muted)}dd{margin:0}.absence{color:var(--muted);font-size:.7rem}.analysis{margin-top:.55rem}
</style>
