<script lang="ts">
  import { onDestroy } from "svelte";

  import type { AccountImportReceipt } from "./api.js";
  import { formatBytes, restoredLine } from "./account-inventory-copy.js";

  interface Props {
    previewImport: (bundle: unknown) => Promise<AccountImportReceipt>;
    commitImport: (password: string, bundle: unknown) => Promise<AccountImportReceipt>;
    onImported?: () => void;
    maxBytes?: number;
  }

  let { previewImport, commitImport, onImported, maxBytes = 32 * 1024 * 1024 }: Props = $props();
  let bundle: unknown;
  let fileName = $state<string | undefined>();
  let receipt = $state<AccountImportReceipt | undefined>();
  let busy = $state<"reading" | "previewing" | "importing" | undefined>();
  let error = $state<string | undefined>();
  let status = $state<string | undefined>();
  let password = $state("");
  let request = 0;
  let mounted = true;
  const conflictSample = 5;

  onDestroy(() => { mounted = false; request += 1; });

  function reset(): void {
    request += 1;
    bundle = undefined;
    receipt = undefined;
    error = undefined;
    status = undefined;
    password = "";
    busy = undefined;
  }

  async function choose(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    reset();
    if (file === undefined) { fileName = undefined; return; }
    fileName = file.name;
    if (file.size > maxBytes) { error = `This file is ${formatBytes(file.size)}; an account import is limited to ${formatBytes(maxBytes)}.`; return; }
    const current = ++request;
    busy = "reading";
    try {
      let parsed: unknown;
      try { parsed = JSON.parse(await file.text()) as unknown; }
      catch { if (mounted && current === request) error = "This file is not a Tabiya account download."; return; }
      if (!mounted || current !== request) return;
      busy = "previewing";
      const previewed = await previewImport(parsed);
      if (!mounted || current !== request) return;
      bundle = parsed;
      receipt = previewed;
    } catch (failure) {
      if (mounted && current === request) error = refusal(failure, "This file could not be checked. Nothing was imported; choose the file again.");
    } finally {
      if (mounted && current === request) busy = undefined;
    }
  }

  function refusal(failure: unknown, fallback: string): string {
    const code = (failure as { code?: unknown } | undefined)?.code;
    if (code === "ACCOUNT_IMPORT_UNSUPPORTED_VERSION") return "This download comes from a newer Tabiya than this deployment can read. Nothing was imported.";
    if (code === "ACCOUNT_IMPORT_INVALID") return "This file is not a valid Tabiya account download. Nothing was imported.";
    if (code === "ACCOUNT_IMPORT_TOO_LARGE") return `This file is larger than the ${formatBytes(maxBytes)} import limit. Nothing was imported.`;
    if (code === "ACCOUNT_IMPORT_CONFLICT") return "Some records in this file already exist in this deployment, so nothing was imported.";
    if (code === "UNAUTHENTICATED") return "That password was not accepted. Nothing was imported.";
    return fallback;
  }

  async function commit(): Promise<void> {
    if (busy !== undefined || receipt === undefined || receipt.conflicts.length > 0) return;
    if (password.length === 0) { status = "Re-enter your password to import this file."; return; }
    const current = ++request;
    const submitted = password;
    const payload = bundle;
    password = "";
    busy = "importing";
    error = undefined;
    status = undefined;
    try {
      const committed = await commitImport(submitted, payload);
      if (!mounted || current !== request) return;
      const runs = committed.restored.find((item) => item.table === "drill_runs")?.count ?? 0;
      status = `Imported ${runs} run${runs === 1 ? "" : "s"} and the records that belong to them into this account.`;
      receipt = undefined;
      bundle = undefined;
      onImported?.();
    } catch (failure) {
      if (mounted && current === request) error = refusal(failure, "The import could not be completed. Nothing was imported; try again.");
    } finally {
      if (mounted && current === request) busy = undefined;
    }
  }
</script>

<form class="account-import" onsubmit={(event) => { event.preventDefault(); void commit(); }} aria-labelledby="account-import-title">
  <h3 id="account-import-title">Import a Tabiya account download</h3>
  <p class="honest">Adds the private records from a Tabiya account download to this account: runs, imported games, attempts, schedules, board marks, repertoires and drafts. Nothing that involves other people or a rating is recreated, and nothing is merged — if any record already exists here, nothing is imported.</p>
  <label>Account download file <input type="file" accept="application/json,.json" disabled={busy === "importing"} onchange={(event) => void choose(event)} /></label>
  {#if busy === "reading" || busy === "previewing"}<p role="status">Checking {fileName ?? "the file"}…</p>{/if}
  {#if receipt}
    <div class="import-preview" data-import-preview>
      <h4>What this file would add</h4>
      {#if receipt.restored.length > 0}
        <ul>{#each receipt.restored as item (item.table)}<li>{restoredLine(item)}</li>{/each}</ul>
      {:else}<p>This file holds no private records to import.</p>{/if}
      {#if receipt.rederived.length > 0}<p class="honest">Position statistics and play measurements are rebuilt from the imported runs rather than copied from the file.</p>{/if}
      {#if receipt.notRestored.length > 0}
        <h4>Not imported</h4>
        <ul>{#each receipt.notRestored as item (item.kind)}<li>{item.count} record{item.count === 1 ? "" : "s"}: {item.reason}</li>{/each}</ul>
      {/if}
      {#if receipt.conflicts.length > 0}
        <p role="alert">{receipt.conflicts.length} record{receipt.conflicts.length === 1 ? "" : "s"} in this file already exist in this deployment, so it cannot be imported here. Nothing was changed.</p>
        <ul class="conflicts">{#each receipt.conflicts.slice(0, conflictSample) as conflict (conflict)}<li><code>{conflict}</code></li>{/each}</ul>
        {#if receipt.conflicts.length > conflictSample}<p class="honest">and {receipt.conflicts.length - conflictSample} more.</p>{/if}
      {:else}
        <label>Password to confirm import <input type="password" autocomplete="current-password" bind:value={password} /></label>
        <button type="submit" disabled={busy !== undefined} aria-describedby={busy === "importing" ? "account-import-busy" : undefined}>{busy === "importing" ? "Importing…" : "Import into this account"}</button>
      {/if}
    </div>
  {/if}
  {#if busy === "importing"}<p id="account-import-busy" role="status">Importing the file into this account…</p>{/if}
  {#if status}<p role="status">{status}</p>{/if}
  {#if error}<p role="alert">{error}</p>{/if}
</form>

<style>
  .account-import{display:grid;gap:.6rem;max-width:36rem;margin-top:1rem}label{display:grid;gap:.25rem}.honest{color:var(--muted);font-size:.8rem}.import-preview{padding:.75rem;border:1px solid var(--line);border-radius:.6rem;background:var(--panel)}.import-preview h4{margin:.25rem 0}.conflicts code{overflow-wrap:anywhere}
</style>
