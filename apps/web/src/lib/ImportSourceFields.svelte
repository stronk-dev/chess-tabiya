<script lang="ts">
  interface Props {
    kind: "game" | "repertoire" | "arena";
    pgn: string;
    url?: string;
    disabled?: boolean;
    savedSource?: boolean;
    describedBy?: string | undefined;
    rows?: number;
  }

  let { kind, pgn = $bindable(), url = $bindable(""), disabled = false, savedSource = false, describedBy, rows = 6 }: Props = $props();
  const id = $props.id();
  const helpId = `${id}-source-help`;
  const choiceId = `${id}-source-choice`;
  let bothSources = $derived(kind !== "arena" && url.trim() !== "" && pgn.trim() !== "");
  let description = $derived([helpId, savedSource || bothSources ? choiceId : undefined, describedBy].filter(Boolean).join(" "));
</script>

<div class="import-source-fields" data-import-source={kind}>
  {#if kind !== "arena"}
    <label>{kind === "game" ? "Lichess game URL" : "Public Lichess study URL"}
      <input type="url" placeholder={kind === "game" ? "https://lichess.org/abcdefgh" : "https://lichess.org/study/abcdefgh"} {disabled} bind:value={url} aria-describedby={description} />
    </label>
    <span class="source-alternative">or paste PGN</span>
  {/if}
  <label>{kind === "repertoire" ? "Repertoire PGN" : "PGN"}
    <textarea {rows} {disabled} bind:value={pgn} aria-describedby={description} placeholder={kind === "arena" ? '[SetUp "1"]\n[FEN "…"]\n\n1. …' : kind === "game" ? "[Event …]" : "1. d4 d5 *"}></textarea>
  </label>
  <p id={helpId} class="honest">
    {#if kind === "game"}Use one public Lichess game or paste one played main line, without analysis variations. Several games and analysis trees belong in a repertoire.
    {:else if kind === "repertoire"}Use one public Lichess study or paste a repertoire PGN. Several games and analysis variations are kept as an opening tree.
    {:else}Paste one main line starting at this run's exact position. Include SetUp and FEN tags when it starts outside the usual starting position. URLs are not accepted here.
    {/if}
  </p>
  {#if savedSource}
    <p id={choiceId} class="honest" role="status">This game's source is already saved. The next action prepares that saved game without importing it again.</p>
  {:else if bothSources}
    <p id={choiceId} class="honest" role="status">The Lichess {kind === "game" ? "game" : "study"} URL will be used. Clear it to use your pasted PGN instead.</p>
  {/if}
</div>

<style>
  .import-source-fields, label { display: grid; gap: .45rem; min-width: 0; }
  input, textarea { width: 100%; min-width: 0; padding: .65rem; border: 1px solid var(--line); border-radius: .5rem; background: var(--paper); color: var(--ink); }
  textarea { resize: vertical; }
  p { margin: 0; }
  .honest { font-size: .88rem; }
  .source-alternative { color: var(--muted); }
</style>
