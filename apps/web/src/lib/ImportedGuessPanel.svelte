<script lang="ts">
  import Chessboard from "./Chessboard.svelte";
  import { importedGuessSentence } from "./learner-copy.js";
  import type { ImportedGuess } from "./session-controller.js";

  interface Props {
    fen: string;
    startSide: "white" | "black";
    lastMove: string | null;
    busy: boolean;
    guess: ImportedGuess | undefined;
    onGuess: (uci: string) => void | Promise<void>;
  }

  let { fen, startSide, lastMove, busy, guess, onGuess }: Props = $props();
</script>

<section class="imported-guess" aria-labelledby="imported-guess-title">
  <h3 id="imported-guess-title">Guess the game's next move</h3>
  {#if guess === undefined}
    <p>Play the move you think was played here. Your guess is recorded with this game; the game itself does not change.</p>
    <Chessboard {fen} {startSide} {lastMove} onMove={(uci) => { if (!busy) void onGuess(uci); }} />
    {#if busy}<p role="status">Recording your guess…</p>{/if}
  {:else}
    <p role="status">{importedGuessSentence(guess)}</p>
  {/if}
</section>

<style>
  .imported-guess {
    display: grid;
    gap: 0.5rem;
    max-width: 22rem;
  }
</style>
