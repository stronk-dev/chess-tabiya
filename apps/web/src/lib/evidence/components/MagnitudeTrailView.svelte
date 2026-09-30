<script lang="ts">
  // rfc/evidence-presentation.md §3.4 — a real plot: an SVG step line with a stated vertical extent
  // and a zero reference, whose pixels come only from the registered scale policy. Every value is
  // also in a keyboard-reachable point list (never only in a `title`). Nothing animates (§7d).
  import type { ComponentValue } from "@chess-tabiya/runtime";
  import { attribution, trailGeometry } from "../presented-view.js";

  interface Props { component: Extract<ComponentValue, { id: "magnitude_trail" }>; sentence: string }
  let { component, sentence }: Props = $props();
  const geometry = $derived(trailGeometry(component));
  let activePoint = $state<number | null>(null);
</script>

<figure class="trail" data-component="magnitude_trail">
  <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} role="img" aria-label={sentence} data-extent={geometry.extentLabel}>
    <line class="zero" x1="0" x2={geometry.width} y1={geometry.zeroY} y2={geometry.zeroY}></line>
    <path class="line" d={geometry.path}></path>
    {#each geometry.points as point, index (point.label)}<circle class="point" class:active={activePoint === index} data-active={activePoint === index} cx={point.x} cy={point.y} r="2.5"></circle>{/each}
  </svg>
  <ol class="points">
    {#each geometry.points as point, index (point.label)}<li><button type="button" class="point-label" onfocus={() => { activePoint = index; }} onclick={() => { activePoint = index; }} onblur={() => { activePoint = null; }}>{point.label}</button></li>{/each}
  </ol>
  <figcaption class="convention">{attribution(component.operand.convention)} · scale {geometry.extentLabel}</figcaption>
</figure>

<style>
  .trail{margin:0;display:grid;gap:.3rem}
  svg{width:100%;max-width:18rem;height:auto;background:var(--surface);border:1px solid var(--line);border-radius:.35rem}
  .zero{stroke:var(--line);stroke-width:1}
  .line{fill:none;stroke:var(--accent);stroke-width:1.5}
  .point{fill:var(--accent)}
  .point.active{stroke:var(--ink);stroke-width:2}
  .points{margin:0;padding-left:1.1rem;font-size:.72rem;font-variant-numeric:tabular-nums;color:var(--ink)}
  .point-label{padding:.125rem 0;border:0;background:none;font:inherit;color:inherit;text-align:left;cursor:pointer}
  .point-label:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .convention{font-size:.7rem;color:var(--muted)}
</style>
