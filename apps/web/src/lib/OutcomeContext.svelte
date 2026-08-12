<script lang="ts">
  interface Props {
    assessment: string;
    resistance: readonly string[];
    grade?: string | undefined;
    resolution?: string | undefined;
  }

  let { assessment, resistance, grade, resolution }: Props = $props();
</script>

<section class="outcome-context" aria-label="Outcome grading context">
  <p>{assessment}</p>
  {#each resistance as line}<p>{line}</p>{/each}
  {#if resolution}<p class="resolution">{resolution}</p>{/if}
  {#if grade}<p class="grade">{grade}</p>{/if}
</section>

<style>
  .outcome-context {
    display: grid;
    gap: 0.25rem;
    padding: 0.75rem;
    border: 1px solid var(--line);
    border-radius: 0.75rem;
    background: color-mix(in srgb, var(--panel) 92%, var(--accent));
  }
  p { margin: 0; font-size: 0.78rem; color: var(--muted); }
  .resolution, .grade { color: inherit; font-weight: 700; }
</style>
