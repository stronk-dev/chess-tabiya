<script lang="ts">
  // rfc/evidence-presentation.md §3.4 — a real plot: an SVG step line with a stated vertical extent
  // and a zero reference, whose pixels come only from the registered scale policy. Every value is
  // also in a keyboard-reachable point list (never only in a `title`). Nothing animates (§7d).
  import type { ComponentValue } from "@chess-tabiya/runtime";
  import { attribution, trailGeometry } from "../presented-view.js";

  interface Props { component: Extract<ComponentValue, { id: "magnitude_trail" }>; sentence: string }
  let { component, sentence }: Props = $props();
  const geometry = $derived(trailGeometry(component));
</script>

<figure class="trail" data-component="magnitude_trail">
  <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} role="img" aria-label={sentence} data-extent={geometry.extentLabel}>
    <line class="zero" x1="0" x2={geometry.width} y1={geometry.zeroY} y2={geometry.zeroY}></line>
    <path class="line" d={geometry.path}></path>
    {#each geometry.points as point (point.label)}<circle class="point" cx={point.x} cy={point.y} r="2.5"></circle>{/each}
  </svg>
  <ol class="points">
    {#each geometry.points as point (point.label)}<li tabindex="0">{point.label}</li>{/each}
  </ol>
  <figcaption class="convention">{attribution(component.operand.convention)} · scale {geometry.extentLabel}</figcaption>
</figure>

<style>
  .trail{margin:0;display:grid;gap:.3rem}
  svg{width:100%;max-width:18rem;height:auto;background:var(--surface);border:1px solid var(--line);border-radius:.35rem}
  .zero{stroke:var(--line);stroke-width:1}
  .line{fill:none;stroke:var(--accent);stroke-width:1.5}
  .point{fill:var(--accent)}
  .points{margin:0;padding-left:1.1rem;font-size:.72rem;font-variant-numeric:tabular-nums;color:var(--ink)}
  .convention{font-size:.7rem;color:var(--muted)}
</style>
