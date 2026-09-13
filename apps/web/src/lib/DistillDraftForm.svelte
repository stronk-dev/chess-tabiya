<script lang="ts">
  interface Props {
    busy?: boolean;
    error?: string | undefined;
    onSubmit: (title: string) => void | Promise<void>;
    onCancel: () => void;
  }

  let { busy = false, error, onSubmit, onCancel }: Props = $props();
  let title = $state("");
</script>

<form aria-label="Name distilled draft" aria-busy={busy} onsubmit={(event) => { event.preventDefault(); void onSubmit(title.trim()); }}>
  <label for="distilled-draft-title">Draft title</label>
  <input id="distilled-draft-title" required maxlength="120" disabled={busy} bind:value={title} placeholder="What does this rehearsal teach?" />
  <div class="actions">
    <button type="submit" disabled={busy || title.trim().length === 0} aria-describedby={busy ? "distill-submit-busy" : title.trim().length === 0 ? "distill-title-required" : undefined}>{busy ? "Creating…" : "Create blocked draft"}</button>
    <button type="button" disabled={busy} aria-describedby={busy ? "distill-submit-busy" : undefined} onclick={onCancel}>Cancel</button>
  </div>
  {#if busy}<p id="distill-submit-busy" class="visually-hidden" role="status">Creating this draft from the retained run.</p>{:else if title.trim().length === 0}<p id="distill-title-required" class="visually-hidden">Enter a title before creating the draft.</p>{/if}
  {#if error}<p role="alert">{error}</p>{/if}
</form>

<style>
  form { display: grid; gap: 0.45rem; }
  label { font-weight: 650; }
  input { width: 100%; min-width: 0; padding: 0.55rem; border: 1px solid var(--line); border-radius: 0.45rem; }
  .actions { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  p { margin: 0; color: var(--danger); overflow-wrap: anywhere; }
</style>
