<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  import type { AccountInventory } from "./api.js";
  import { dataClassLabel, deletionFate, exportFate } from "./account-inventory-copy.js";

  interface Props {
    loadInventory: () => Promise<AccountInventory>;
  }

  let { loadInventory }: Props = $props();
  let inventory = $state<AccountInventory | undefined>();
  let loading = $state(false);
  let error = $state<string | undefined>();
  let request = 0;
  let mounted = true;

  onMount(() => { void load(); });
  onDestroy(() => { mounted = false; request += 1; });

  async function load(): Promise<void> {
    if (loading) return;
    const current = ++request;
    loading = true;
    error = undefined;
    try {
      const loaded = await loadInventory();
      if (!Array.isArray(loaded?.classes)) throw new Error("invalid inventory");
      if (mounted && current === request) inventory = loaded;
    } catch {
      if (mounted && current === request) error = "What Tabiya has recorded could not be loaded. Nothing was changed; try again.";
    } finally {
      if (mounted && current === request) loading = false;
    }
  }
</script>

<section class="account-inventory" aria-labelledby="account-inventory-title">
  <h3 id="account-inventory-title">What Tabiya has recorded</h3>
  <p class="honest">Every kind of record this deployment keeps for your account, counted from the same projection your download uses. Counts are records, not a judgement of your play.</p>
  {#if loading && inventory === undefined}
    <p role="status">Loading what Tabiya has recorded…</p>
  {:else if error}
    <p role="alert">{error}</p><button type="button" onclick={() => void load()}>Try loading again</button>
  {:else if inventory}
    <table>
      <caption class="visually-hidden">Account data by kind, with its download and deletion fate</caption>
      <thead><tr><th scope="col">Kind of record</th><th scope="col">Records</th><th scope="col">Download</th><th scope="col">Deletion</th></tr></thead>
      <tbody>
        {#each inventory.classes as item (item.dataClass)}
          <tr data-data-class={item.dataClass}>
            <th scope="row">{dataClassLabel(item.dataClass)}</th>
            <td>{item.stores.every((store) => store.count === null) ? "Not counted" : item.count}</td>
            <td>{exportFate(item)}</td>
            <td>{deletionFate(item)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <button type="button" disabled={loading} onclick={() => void load()}>{loading ? "Refreshing…" : "Refresh record counts"}</button>
  {/if}
</section>

<style>
  .account-inventory{margin-top:1rem}table{width:100%;border-collapse:collapse;font-size:.85rem}th,td{text-align:left;padding:.3rem .4rem;border-bottom:1px solid var(--line);vertical-align:top}thead th{font-size:.75rem;color:var(--muted)}.honest{color:var(--muted);font-size:.8rem}
  @media(max-width:719px){table,thead,tbody,tr,th,td{display:block}thead{display:none}tr{padding:.4rem 0;border-bottom:1px solid var(--line)}th,td{border:0;padding:.1rem 0}}
</style>
