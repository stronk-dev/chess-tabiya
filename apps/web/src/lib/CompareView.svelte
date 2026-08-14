<script lang="ts">
  import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
  import { comparisonNarrative, comparisonStrips, structuralReading, type BranchComparison, type ComparisonEvidenceEntry, type DrillRun, type ObjectiveTimelineEntry } from "@chess-tabiya/runtime";
  import { onMount } from "svelte";
  import Chessboard from "./Chessboard.svelte";
  import HonestControl from "./HonestControl.svelte";
  import type { StartSide } from "./board-model.js";
  import { renderEvidenceRef } from "./evidence-sentences.js";
  import { comparisonNode } from "./screen-model.js";
  import { renderStructuralObservation } from "./structural-sentences.js";

  interface Props {
    run: DrillRun;
    pack?: DrillPackDefinition | undefined;
    comparison: BranchComparison;
    startSide: StartSide;
    step: number;
    onStep: (step: number) => void;
    onClose: () => void;
    onVoice?: (() => Promise<string>) | undefined;
  }
  let { run, pack, comparison, startSide, step, onStep, onClose, onVoice }: Props = $props();
  let maxStep = $derived(comparison.rows.length);
  let heading: HTMLHeadingElement;
  let narrativeOpen = $state(false);
  let personaText = $state<string | undefined>();
  let strips = $derived(comparisonStrips(run, comparison));
  let narrative = $derived(comparisonNarrative(run, comparison, strips));

  function timeline(entries: readonly ObjectiveTimelineEntry[]) {
    return entries.map((entry) => {
      if (entry.evidenceRefs.length === 0) throw new TypeError(`Comparison objective transition at event ${entry.eventSeq} has no evidence references`);
      return { ...entry, grounds: entry.evidenceRefs.map((ref) => renderEvidenceRef(ref, pack)) };
    });
  }
  function score(entry: ComparisonEvidenceEntry): string {
    if (entry.score.kind === "mate") return `M${entry.score.movesTo >= 0 ? "+" : ""}${entry.score.movesTo}`;
    const pawns = entry.score.value / 100;
    return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(2)}`;
  }
  onMount(() => heading?.focus());
</script>

<section class="compare" aria-labelledby="compare-title">
  <header>
    <div><p>Branch comparison</p><h2 id="compare-title" tabindex="-1" bind:this={heading}>Same decision, {comparison.columns.length === 2 ? "two" : comparison.columns.length} consequences.</h2></div>
    <button type="button" onclick={onClose}>Close <kbd>Tab</kbd></button>
  </header>

  <div class="boards" style={`--branches:${comparison.columns.length}`} aria-live="polite">
    {#each comparison.columns as column}
      {@const node = comparisonNode(run, comparison, step, column.branchId)}
      <article class:absent={!node} data-branch-id={column.branchId}>
        <h3>{column.label}{column.origin === "simulated" ? " · simulated" : ""}</h3>
        {#if node}<Chessboard fen={node.fen} {startSide} lastMove={node.moveUci} disabled onMove={() => {}} />
        {:else}<div class="line-ended">Line ended</div>{/if}
      </article>
    {/each}
  </div>

  <div class="stepper">
    <HonestControl disabled={step === 0} reasonId="compare-previous-unavailable" reason="The comparison is already at its first aligned position.">
      {#snippet children(describedBy)}<button type="button" disabled={step === 0} aria-describedby={describedBy} onclick={() => onStep(step - 1)}>← Previous</button>{/snippet}
    </HonestControl>
    <span>Aligned ply {step} / {maxStep}</span>
    <HonestControl disabled={step === maxStep} reasonId="compare-next-unavailable" reason="The comparison is already at its last aligned position.">
      {#snippet children(describedBy)}<button type="button" disabled={step === maxStep} aria-describedby={describedBy} onclick={() => onStep(step + 1)}>Next →</button>{/snippet}
    </HonestControl>
  </div>

  <section class="trajectory" aria-label="Recorded engine evaluation">
    <h3>Recorded engine evaluation</h3>
    <span class="fork-marker">Fork</span>
    {#each comparison.columns as column}
      <div class="trajectory-row">
        <strong>{column.label}</strong>
        <div class="evidence-cell" data-ply-offset="0">
          {#each (comparison.evidence[column.branchId] ?? []).filter((entry) => entry.plyOffset === 0) as entry}
            <span class="evidence-entry">{score(entry)}</span>
          {/each}
        </div>
      </div>
    {/each}
  </section>

  <section class="strip-band" aria-label="Per-branch difference strips">
    <h3>Recorded branch strips</h3>
    {#each comparison.columns as column}
      <article><strong>{column.label}</strong>
        <div class="sparkline" aria-label={`${column.label} recorded evaluation points`}>{#each strips[column.branchId]?.evalTrail ?? [] as point}<span data-ply-offset={point.plyOffset} title={score({ ...point, evidenceRefs: [], kind: "eval", source: "engine_validated" })}>●</span>{/each}</div>
        <details><summary>Structure and timing</summary>{#each strips[column.branchId]?.structure ?? [] as entry}<p>+{entry.plyOffset}: {entry.sentence} {entry.attribution}.</p>{/each}{#each strips[column.branchId]?.timing ?? [] as entry}<p>+{entry.plyOffset}: {entry.sentence} {entry.attribution}.</p>{/each}</details>
        <details><summary>Piece routes</summary>{#each strips[column.branchId]?.routes ?? [] as route}<p>{route.pieceId}: {route.squares.join(" → ")}</p>{:else}<p>No piece route past the fork.</p>{/each}</details>
      </article>
    {/each}
  </section>
  <section class="narrative" aria-label="Comparison narrative">
    <button type="button" aria-expanded={narrativeOpen} onclick={() => narrativeOpen = !narrativeOpen}>Narrative</button>
    {#if narrativeOpen}{#each narrative.groups as group}<div>{#each group.sentences as sentence}<p>{sentence}</p>{/each}</div>{/each}{#if onVoice}<button type="button" onclick={() => void onVoice().then((text) => personaText = text)}>Revoice narrative</button>{/if}{#if personaText}<p>{personaText}</p>{/if}{/if}
  </section>

  <section class="results" aria-label="Per-branch consequences">
    {#each comparison.columns as column}
      {@const consequence = comparison.consequences[column.branchId]}
      {@const entries = timeline(comparison.objectiveTimelines[column.branchId] ?? [])}
      <article>
        <h3>{column.label}</h3>
        <p>{consequence?.decision ? `Decision: ${consequence.decision.moveSan} at +${consequence.decision.plyOffset}.` : "No moves on this branch yet."}</p>
        <p>{consequence?.plies ?? 0} plies · objective {consequence?.objectiveState ?? "unknown"}</p>
        {#if consequence?.deepestScore}<p>Recorded engine evaluation at +{consequence.deepestScore.plyOffset}: {score({ ...consequence.deepestScore, nodeId: "", evidenceRefs: [], kind: "eval", source: "engine_validated" })}</p>{/if}
        {#each consequence?.checkpointsMissed ?? [] as checkpoint}<p>Checkpoint not reached on this branch: {checkpoint}.</p>{/each}
        {#each entries as entry}
          <div><strong>{entry.from} → {entry.to}</strong>{#each entry.grounds as ground}<p>{ground.sourceLabel}: {ground.text}</p>{/each}</div>
        {/each}
        <div class="scores" aria-label={`${column.label} recorded engine evaluations`}>
          {#each comparison.evidence[column.branchId] ?? [] as entry}<span data-ply-offset={entry.plyOffset}>+{entry.plyOffset}: {score(entry)}</span>{/each}
        </div>
        {#if consequence}
          <details><summary>Structural reading</summary>
            {#each structuralReading(run.nodes.find((node) => node.id === column.leafNodeId)?.fen ?? run.nodes[0]!.fen).features as observation}<p>{renderStructuralObservation(observation)}</p>{/each}
          </details>
        {/if}
      </article>
    {/each}
  </section>
</section>

<style>
  .compare{width:min(96rem,calc(100% - 2rem));height:100%;margin:auto;padding:1rem 0;overflow:auto}.compare>header,.stepper{display:flex;justify-content:space-between;align-items:center;gap:1rem}.compare header p{margin:0;color:var(--accent);font:700 .68rem ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em}h2{margin:.2rem 0 0;font:500 clamp(1.6rem,3vw,2.8rem)/1 var(--display-font)}button{padding:.65rem .8rem;border:1px solid var(--line);border-radius:.65rem;background:var(--panel);color:inherit}.boards,.results,.strip-band{display:grid;grid-template-columns:repeat(var(--branches,2),minmax(15rem,1fr));gap:.8rem;margin:1rem 0;overflow-x:auto}.strip-band>h3{grid-column:1/-1}.strip-band article,.boards article,.results>article{min-width:15rem;padding:.7rem;border:1px solid var(--line);border-radius:.8rem;background:var(--panel)}.sparkline{display:flex;gap:.2rem;color:var(--accent)}.narrative{padding:1rem;border:1px solid var(--line);border-radius:.8rem}.boards article.absent{opacity:.45}.line-ended{aspect-ratio:1;display:grid;place-items:center;background:var(--panel-soft)}.stepper{justify-content:center}.trajectory{margin:1rem 0}.trajectory-row{display:grid;grid-template-columns:12rem 1fr;gap:.5rem}.fork-marker{display:inline-block;color:var(--accent);font:700 .75rem ui-monospace,monospace}.evidence-entry{margin-right:.35rem}.results{grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))}.results p{margin:.35rem 0;color:var(--muted)}.scores{display:grid;gap:.25rem;font: .76rem ui-monospace,monospace}
</style>
