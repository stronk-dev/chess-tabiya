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

<form aria-label="Name distilled draft" onsubmit={(event) => { event.preventDefault(); void onSubmit(title.trim()); }}>
  <label for="distilled-draft-title">Draft title</label>
  <input id="distilled-draft-title" required maxlength="120" bind:value={title} placeholder="What does this rehearsal teach?" />
  <div class="actions">
    <button type="submit" disabled={busy || title.trim().length === 0}>{busy ? "Creating…" : "Create blocked draft"}</button>
    <button type="button" disabled={busy} onclick={onCancel}>Cancel</button>
  </div>
  {#if error}<p role="alert">{error}</p>{/if}
</form>

<style>
  form { display: grid; gap: 0.45rem; }
  label { font-weight: 650; }
  input { width: 100%; min-width: 0; padding: 0.55rem; border: 1px solid var(--line); border-radius: 0.45rem; }
  .actions { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  p { margin: 0; color: var(--danger); overflow-wrap: anywhere; }
</style>
