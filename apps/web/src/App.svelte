<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  import DrillScreen from "./lib/DrillScreen.svelte";
  import PackList from "./lib/PackList.svelte";
  import { DrillApi } from "./lib/api.js";
  import {
    DrillSessionController,
    type ClientScreenState,
    type ResumeTarget,
  } from "./lib/session-controller.js";

  const api = new DrillApi(import.meta.env.VITE_API_URL ?? "");
  const controller = new DrillSessionController(api, {
    onRunStarted: addressRun,
  });
  let state: ClientScreenState = $state(controller.state);
  let unsubscribe: (() => void) | undefined;

  function resumeTarget(): ResumeTarget | undefined {
    const parameters = new URLSearchParams(location.search);
    const runId = parameters.get("run");
    const packId = parameters.get("pack");
    return runId === null || packId === null ? undefined : { runId, packId };
  }

  function addressRun(target: ResumeTarget): void {
    const url = new URL(location.href);
    url.searchParams.set("run", target.runId);
    url.searchParams.set("pack", target.packId);
    history.replaceState(null, "", url);
  }

  function clearRunAddress(): void {
    const url = new URL(location.href);
    url.searchParams.delete("run");
    url.searchParams.delete("pack");
    history.replaceState(null, "", url);
  }

  function stop(): void {
    controller.stopSession();
    clearRunAddress();
  }

  async function exportPgn(): Promise<void> {
    const download = await controller.exportPgn();
    const url = URL.createObjectURL(
      new Blob([download.text], { type: "text/x-chess-pgn;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = download.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  onMount(() => {
    unsubscribe = controller.subscribe((next) => (state = next));
    void controller.load(resumeTarget());
  });

  onDestroy(() => {
    unsubscribe?.();
    controller.destroy();
  });
</script>

{#if state.phase === "drill" && state.pack && state.runState}
  <DrillScreen
    pack={state.pack}
    snapshot={state.runState}
    checkpoint={state.checkpoint}
    comparison={state.comparison}
    comparisonBranchIds={state.comparisonBranchIds}
    busy={state.busy}
    error={state.error}
    onMove={(uci) => controller.move(uci)}
    onRewind={(target) => controller.rewind(target)}
    onFork={(label, intent) => controller.fork(label, intent)}
    onSwitchBranch={(nodeId) => controller.switchBranch(nodeId)}
    onCompare={(branchIds) => controller.compare(branchIds)}
    onCloseCompare={() => controller.closeCompare()}
    onContinueCheckpoint={() => controller.continueCheckpoint()}
    onExport={exportPgn}
    onStop={stop}
  />
{:else}
  <PackList
    packs={state.packs}
    loading={state.phase === "loading" || state.busy}
    error={state.error}
    onSelect={(packId) => controller.startPack(packId)}
  />
{/if}

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(:root) {
    color-scheme: light;
    --ink: #171713;
    --paper: #eeeade;
    --paper-soft: #e5e0d2;
    --panel: #f8f5ec;
    --muted: #6f6b61;
    --line: #cbc4b4;
    --accent: #3858c8;
    --warning: #df9d32;
    --danger: #ad3c32;
    --display-font: Iowan Old Style, Palatino Linotype, Book Antiqua, Palatino,
      Georgia, serif;
    --shadow: 0 0.8rem 2.5rem rgb(40 35 25 / 10%);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
    color: var(--ink);
    background: var(--paper);
  }

  :global(body) {
    min-width: 20rem;
    min-height: 100vh;
    margin: 0;
    background:
      radial-gradient(circle at 12% 5%, rgb(255 255 255 / 65%), transparent 30rem),
      linear-gradient(135deg, transparent 0 58%, rgb(56 88 200 / 4%) 58% 100%),
      var(--paper);
  }

  :global(button),
  :global(input),
  :global(textarea) {
    font: inherit;
  }

  :global(:focus-visible) {
    outline: 3px solid color-mix(in srgb, var(--accent) 65%, white);
    outline-offset: 2px;
  }

  :global(::selection) {
    background: color-mix(in srgb, var(--accent) 25%, white);
  }
</style>
