<script lang="ts">
  // rfc/review-map.md §6 ([[D880]]): the eval graph over the durable evaluations. Every string is a
  // registered template or a payload sentence. Points are drawn only where a recorded evaluation
  // exists; every stretch without one is drawn as an abstention and stated in words. Every ply is a
  // keyboard stop (one tab stop, arrow keys between points) that selects that move in the list.
  import { reviewText, type ReviewEvalGraph } from "@chess-tabiya/runtime";
  import { tick } from "svelte";

  interface Props {
    graph: ReviewEvalGraph;
    selectedId: string | undefined;
    onSelect: (nodeId: string) => void;
  }
  let { graph, selectedId, onSelect }: Props = $props();

  const STEP = 10;
  const HEIGHT = 110;
  const MID = 55;
  let pointElements = $state<(SVGGElement | undefined)[]>([]);

  const width = $derived(Math.max(graph.points.length, 24) * STEP);
  const x = (index: number): number => STEP / 2 + index * STEP;
  const y = (percent: number): number => 5 + (100 - percent);
  const selectedIndex = $derived(graph.points.findIndex((point) => point.nodeId === selectedId));
  const focusIndex = $derived(selectedIndex < 0 ? 0 : selectedIndex);
  /** Maximal runs of drawn points: the line never bridges a stretch without a recorded evaluation. */
  const segments = $derived.by(() => {
    const out: string[] = [];
    let current: string[] = [];
    graph.points.forEach((point, index) => {
      if (point.kind === "evaluated") current.push(`${current.length === 0 ? "M" : "L"}${x(index)} ${y(point.percent)}`);
      else if (current.length > 0) { out.push(current.join(" ")); current = []; }
    });
    if (current.length > 0) out.push(current.join(" "));
    return out;
  });
  const gapRects = $derived(graph.gaps.map((gap) => {
    const from = graph.points.findIndex((point) => point.ply === gap.fromPly);
    const to = graph.points.findIndex((point) => point.ply === gap.toPly);
    return { key: `${gap.fromPly}-${gap.toPly}`, x: x(from) - STEP / 2, width: (to - from + 1) * STEP };
  }));

  async function move(index: number): Promise<void> {
    const point = graph.points[Math.max(0, Math.min(graph.points.length - 1, index))];
    if (point === undefined) return;
    onSelect(point.nodeId);
    await tick();
    pointElements[graph.points.indexOf(point)]?.focus();
  }

  function onKey(event: KeyboardEvent, index: number): void {
    const target = event.key === "ArrowRight" || event.key === "ArrowUp" ? index + 1
      : event.key === "ArrowLeft" || event.key === "ArrowDown" ? index - 1
        : event.key === "Home" ? 0
          : event.key === "End" ? graph.points.length - 1
            : event.key === "Enter" || event.key === " " ? index : undefined;
    if (target === undefined) return;
    event.preventDefault();
    void move(target);
  }
</script>

<section class="eval-graph" aria-labelledby="review-graph-title" data-graph={graph.kind} data-graph-side={graph.side}>
  <h2 id="review-graph-title">{reviewText("graph.title")}</h2>
  <p class="muted" id="review-graph-caption">{graph.caption}</p>
  <p class="graph-coverage">{graph.coverage}</p>
  {#if graph.points.length > 0}
    <svg viewBox={`0 0 ${width} ${HEIGHT}`} role="group" aria-label={reviewText("graph.label")} aria-describedby="review-graph-caption">
      <line class="midline" x1="0" x2={width} y1={MID} y2={MID} />
      {#each gapRects as gap (gap.key)}<rect class="gap" x={gap.x} y="0" width={gap.width} height={HEIGHT} />{/each}
      {#each segments as segment}<path class="series" d={segment} />{/each}
      {#each graph.points as point, index (point.nodeId)}
        <g
          bind:this={pointElements[index]}
          class="point"
          class:selected={index === selectedIndex}
          class:missing={point.kind === "missing"}
          data-node-id={point.nodeId}
          role="button"
          tabindex={index === focusIndex ? 0 : -1}
          aria-label={point.sentence}
          aria-pressed={index === selectedIndex}
          onclick={() => void move(index)}
          onkeydown={(event) => onKey(event, index)}
        >
          <rect class="hit" x={x(index) - STEP / 2} y="0" width={STEP} height={HEIGHT} />
          <circle cx={x(index)} cy={point.kind === "evaluated" ? y(point.percent) : MID} r={index === selectedIndex ? 3.6 : point.kind === "evaluated" ? 2.2 : 1.6} />
        </g>
      {/each}
    </svg>
  {/if}
  {#if graph.gaps.length > 0}
    <ul class="graph-gaps">{#each graph.gaps as gap (gap.fromPly)}<li>{gap.sentence}</li>{/each}</ul>
  {/if}
  {#if graph.points.length > 0}
    <details class="graph-text">
      <summary>{reviewText("graph.text")}</summary>
      <ol>{#each graph.points as point (point.nodeId)}<li>{point.sentence}</li>{/each}</ol>
    </details>
  {/if}
</section>

<style>
  .eval-graph{display:grid;gap:.3rem;padding:.7rem;border:1px solid color-mix(in srgb,var(--ink) 20%,transparent);border-radius:.6rem;background:var(--panel)}
  .eval-graph h2{font-size:1rem;margin:0}
  .eval-graph p{margin:0}
  .muted{color:var(--muted);font-size:.85rem}
  svg{width:100%;height:auto;max-height:9rem;display:block}
  .midline{stroke:color-mix(in srgb,var(--ink) 35%,transparent);stroke-width:.6;stroke-dasharray:2 2}
  .gap{fill:color-mix(in srgb,var(--muted) 14%,transparent)}
  .series{fill:none;stroke:var(--accent);stroke-width:1.4;stroke-linejoin:round;stroke-linecap:round}
  .point{cursor:pointer;outline:none}
  .point .hit{fill:transparent}
  .point circle{fill:var(--accent);stroke:var(--panel);stroke-width:.6}
  .point.missing circle{fill:var(--panel);stroke:var(--muted);stroke-width:.8}
  .point.selected circle{fill:var(--ink);stroke:var(--accent);stroke-width:1.2}
  .point:focus-visible .hit{fill:color-mix(in srgb,var(--accent) 18%,transparent)}
  .point:focus-visible circle{stroke:var(--ink);stroke-width:1.6}
  .graph-gaps{margin:0;padding-left:1.1rem;font-size:.85rem}
  .graph-text{font-size:.85rem}
  .graph-text ol{margin:.3rem 0 0;padding-left:1.4rem;max-height:12rem;overflow-y:auto}
</style>
