<script lang="ts">
  import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
  import type {
    BranchComparison,
    ComparisonEvidenceEntry,
    DrillRun,
    ObjectiveTimelineEntry,
  } from "@chess-tabiya/runtime";
  import { onMount } from "svelte";

  import Chessboard from "./Chessboard.svelte";
  import HonestControl from "./HonestControl.svelte";
  import type { StartSide } from "./board-model.js";
  import { renderEvidenceRef, type EvidenceSentence } from "./evidence-sentences.js";
  import { comparisonNode } from "./screen-model.js";

  interface GroundedObjectiveEntry extends ObjectiveTimelineEntry {
    readonly grounds: readonly EvidenceSentence[];
  }

  interface Props {
    run: DrillRun;
    pack: DrillPackDefinition;
    comparison: BranchComparison;
    branchLabels: readonly [string, string];
    startSide: StartSide;
    step: number;
    onStep: (step: number) => void;
    onClose: () => void;
  }

  let {
    run,
    pack,
    comparison,
    branchLabels,
    startSide,
    step,
    onStep,
    onClose,
  }: Props = $props();
  let nodeA = $derived(comparisonNode(run, comparison, step, "a"));
  let nodeB = $derived(comparisonNode(run, comparison, step, "b"));
  let maxStep = $derived(comparison.pairs.length);
  let timelineA = $derived(groundedTimeline(comparison.objectiveTimelines.a));
  let timelineB = $derived(groundedTimeline(comparison.objectiveTimelines.b));
  let maximumEvidenceOffset = $derived(
    Math.max(
      comparison.pairs.length,
      0,
      ...comparison.evidence.a.map((entry) => entry.plyOffset),
      ...comparison.evidence.b.map((entry) => entry.plyOffset),
    ),
  );
  let trajectoryOffsets = $derived(
    Array.from({ length: maximumEvidenceOffset + 1 }, (_, offset) => offset),
  );
  let heading: HTMLHeadingElement;

  function groundedTimeline(
    entries: readonly ObjectiveTimelineEntry[],
  ): readonly GroundedObjectiveEntry[] {
    return entries.map((entry) => {
      if (entry.evidenceRefs.length === 0) {
        throw new TypeError(
          `Comparison objective transition at event ${entry.eventSeq} has no evidence references`,
        );
      }
      return {
        ...entry,
        grounds: entry.evidenceRefs.map((reference) =>
          renderEvidenceRef(reference, pack),
        ),
      };
    });
  }

  function evidenceAt(
    entries: readonly ComparisonEvidenceEntry[],
    plyOffset: number,
  ): readonly ComparisonEvidenceEntry[] {
    return entries.filter((entry) => entry.plyOffset === plyOffset);
  }

  function scoreLabel(entry: ComparisonEvidenceEntry): string {
    if (entry.score.kind === "mate") {
      return `M${entry.score.movesTo >= 0 ? "+" : ""}${entry.score.movesTo}`;
    }
    const pawns = entry.score.value / 100;
    return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(2)}`;
  }

  onMount(() => heading?.focus());
</script>

<section class="compare" aria-labelledby="compare-title">
  <header>
    <div>
      <p>Branch comparison</p>
      <h2 id="compare-title" tabindex="-1" bind:this={heading}>Same decision, two consequences.</h2>
    </div>
    <button type="button" onclick={onClose}>Close <kbd>Tab</kbd></button>
  </header>

  <div class="boards" aria-live="polite">
    <article class:absent={!nodeA}>
      <h3>{branchLabels[0]}</h3>
      {#if nodeA}
        <Chessboard
          fen={nodeA.fen}
          {startSide}
          lastMove={nodeA.moveUci}
          disabled
          onMove={() => {}}
        />
      {:else}
        <div class="line-ended">Line ended</div>
      {/if}
    </article>
    <article class:absent={!nodeB}>
      <h3>{branchLabels[1]}</h3>
      {#if nodeB}
        <Chessboard
          fen={nodeB.fen}
          {startSide}
          lastMove={nodeB.moveUci}
          disabled
          onMove={() => {}}
        />
      {:else}
        <div class="line-ended">Line ended</div>
      {/if}
    </article>
  </div>

  <div class="stepper">
    <HonestControl
      disabled={step === 0}
      reasonId="compare-previous-unavailable"
      reason="The comparison is already at its first aligned position."
    >
      {#snippet children(describedBy)}
        <button
          type="button"
          disabled={step === 0}
          aria-describedby={describedBy}
          onclick={() => onStep(step - 1)}
        >← Previous</button>
      {/snippet}
    </HonestControl>
    <span>Aligned ply {step} / {maxStep}</span>
    <HonestControl
      disabled={step === maxStep}
      reasonId="compare-next-unavailable"
      reason="The comparison is already at its last aligned position."
    >
      {#snippet children(describedBy)}
        <button
          type="button"
          disabled={step === maxStep}
          aria-describedby={describedBy}
          onclick={() => onStep(step + 1)}
        >Next →</button>
      {/snippet}
    </HonestControl>
  </div>

  <section class="trajectory" aria-labelledby="trajectory-title">
    <h3 id="trajectory-title">Recorded engine evaluation</h3>
    <p>Scores use White's perspective and align both branches on the fork.</p>
    <div
      class="trajectory-grid"
      style={`--trajectory-columns: ${trajectoryOffsets.length}`}
    >
      <span class="axis-corner">Aligned ply</span>
      {#each trajectoryOffsets as offset}
        <span
          class:fork-marker={offset === 0}
          class="axis-point"
          data-ply-offset={offset}
        >{offset === 0 ? "Fork" : `+${offset}`}</span>
      {/each}
      <span class="trajectory-label">{branchLabels[0]}</span>
      {#each trajectoryOffsets as offset}
        <div
          class:fork-cell={offset === 0}
          class="evidence-cell"
          data-side="a"
          data-ply-offset={offset}
        >
          {#each evidenceAt(comparison.evidence.a, offset) as entry}
            <span
              class="evidence-entry"
              title={`Ply ${entry.plyOffset}: engine-validated ${entry.kind}`}
            >{scoreLabel(entry)}</span>
          {:else}<span class="empty" aria-hidden="true">—</span>{/each}
        </div>
      {/each}
      <span class="trajectory-label">{branchLabels[1]}</span>
      {#each trajectoryOffsets as offset}
        <div
          class:fork-cell={offset === 0}
          class="evidence-cell"
          data-side="b"
          data-ply-offset={offset}
        >
          {#each evidenceAt(comparison.evidence.b, offset) as entry}
            <span
              class="evidence-entry"
              title={`Ply ${entry.plyOffset}: engine-validated ${entry.kind}`}
            >{scoreLabel(entry)}</span>
          {:else}<span class="empty" aria-hidden="true">—</span>{/each}
        </div>
      {/each}
    </div>
  </section>

  <div class="strips">
    <section aria-label={`${branchLabels[0]} objective and checkpoints`}>
      <h3>{branchLabels[0]}</h3>
      <div class="strip objective-strip">
        {#each timelineA as entry}
          <article title={`Ply ${entry.plyOffset}: ${entry.from} to ${entry.to}`}>
            <strong>{entry.from} → {entry.to}</strong>
            <ul>
              {#each entry.grounds as ground}
                <li><span>{ground.sourceLabel}</span>{ground.text}</li>
              {/each}
            </ul>
          </article>
        {:else}<small>No objective change</small>{/each}
      </div>
      <div class="strip checkpoint-strip">
        {#each comparison.checkpointHits.a as hit}
          <span title={`Ply ${hit.plyOffset}`}>{hit.checkpointId}</span>
        {:else}<small>No checkpoint</small>{/each}
      </div>
    </section>
    <section aria-label={`${branchLabels[1]} objective and checkpoints`}>
      <h3>{branchLabels[1]}</h3>
      <div class="strip objective-strip">
        {#each timelineB as entry}
          <article title={`Ply ${entry.plyOffset}: ${entry.from} to ${entry.to}`}>
            <strong>{entry.from} → {entry.to}</strong>
            <ul>
              {#each entry.grounds as ground}
                <li><span>{ground.sourceLabel}</span>{ground.text}</li>
              {/each}
            </ul>
          </article>
        {:else}<small>No objective change</small>{/each}
      </div>
      <div class="strip checkpoint-strip">
        {#each comparison.checkpointHits.b as hit}
          <span title={`Ply ${hit.plyOffset}`}>{hit.checkpointId}</span>
        {:else}<small>No checkpoint</small>{/each}
      </div>
    </section>
  </div>
</section>

<style>
  .compare {
    width: min(82rem, calc(100% - 2rem));
    height: 100%;
    margin: 0 auto;
    padding: 1rem 0;
    overflow: auto;
  }

  header,
  .stepper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  header p {
    margin: 0;
    color: var(--accent);
    font: 700 0.68rem ui-monospace, monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0.2rem 0 0;
    font: 500 clamp(1.8rem, 4vw, 3.2rem) / 1 var(--display-font);
  }

  button {
    padding: 0.65rem 0.8rem;
    border: 1px solid var(--line);
    border-radius: 0.65rem;
    background: var(--panel);
    color: inherit;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.4;
  }

  .boards,
  .strips {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 1.25rem;
  }

  .boards article,
  .strips > section {
    min-width: 0;
    padding: 0.8rem;
    border: 1px solid var(--line);
    border-radius: 1rem;
    background: var(--panel);
  }

  .boards article.absent {
    opacity: 0.45;
  }

  h3 {
    margin: 0 0 0.65rem;
    font: 600 0.9rem var(--display-font);
  }

  .line-ended {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    border: 1px dashed var(--line);
    color: var(--muted);
  }

  .stepper {
    margin-top: 1rem;
  }

  .trajectory {
    margin-top: 1.25rem;
    padding: 0.8rem;
    overflow-x: auto;
    border: 1px solid var(--line);
    border-radius: 1rem;
    background: var(--panel);
  }

  .trajectory h3,
  .trajectory p {
    margin: 0;
  }

  .trajectory p {
    margin-top: 0.25rem;
    color: var(--muted);
    font-size: 0.78rem;
  }

  .trajectory-grid {
    display: grid;
    grid-template-columns:
      minmax(7rem, max-content)
      repeat(var(--trajectory-columns), minmax(4.2rem, 1fr));
    min-width: max-content;
    margin-top: 0.75rem;
    align-items: stretch;
  }

  .trajectory-grid > * {
    padding: 0.4rem;
    border-bottom: 1px solid var(--line);
  }

  .axis-corner,
  .axis-point,
  .trajectory-label {
    font: 0.66rem ui-monospace, monospace;
  }

  .axis-point,
  .evidence-cell {
    text-align: center;
    border-left: 1px solid var(--line);
  }

  .fork-marker,
  .fork-cell {
    background: color-mix(in srgb, var(--accent) 12%, var(--paper-soft));
  }

  .fork-marker {
    color: var(--accent);
    font-weight: 700;
  }

  .trajectory-label {
    font-weight: 700;
  }

  .evidence-entry {
    display: inline-block;
    padding: 0.22rem 0.4rem;
    border-radius: 999px;
    background: var(--paper-soft);
    font: 700 0.7rem ui-monospace, monospace;
  }

  .empty {
    color: var(--muted);
  }

  .strip {
    min-height: 2rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
    margin-top: 0.4rem;
  }

  .strip > span,
  .strip small {
    padding: 0.3rem 0.45rem;
    border-radius: 999px;
    background: var(--paper-soft);
    font: 0.66rem ui-monospace, monospace;
  }

  .checkpoint-strip span {
    background: color-mix(in srgb, var(--warning) 18%, var(--paper-soft));
  }

  .objective-strip article {
    flex: 1 1 14rem;
    padding: 0.55rem;
    border: 1px solid var(--line);
    border-radius: 0.65rem;
    background: var(--paper-soft);
  }

  .objective-strip strong {
    font: 700 0.72rem ui-monospace, monospace;
  }

  .objective-strip ul {
    display: grid;
    gap: 0.3rem;
    margin: 0.45rem 0 0;
    padding: 0;
    list-style: none;
  }

  .objective-strip li {
    font-size: 0.76rem;
  }

  .objective-strip li span {
    margin-right: 0.4rem;
    color: var(--accent);
    font: 700 0.62rem ui-monospace, monospace;
    text-transform: uppercase;
  }

  @media (max-width: 48rem) {
    .boards,
    .strips {
      grid-template-columns: 1fr;
    }
  }
</style>
