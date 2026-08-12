<script lang="ts">
  import "@lichess-org/chessground/assets/chessground.base.css";
  import "@lichess-org/chessground/assets/chessground.brown.css";
  import "@lichess-org/chessground/assets/chessground.cburnett.css";

  import { Chessground } from "@lichess-org/chessground";
  import type { Api } from "@lichess-org/chessground/api";
  import type { Config } from "@lichess-org/chessground/config";
  import type { Key } from "@lichess-org/chessground/types";
  import { onMount } from "svelte";

  import {
    boardModel,
    promotionRequest,
    promotionUci,
    type PromotionRequest,
    type PromotionRole,
    type StartSide,
  } from "./board-model.js";

  interface Props {
    fen: string;
    startSide: StartSide;
    lastMove?: string | null;
    disabled?: boolean;
    onMove: (uci: string) => void | Promise<void>;
  }

  let {
    fen,
    startSide,
    lastMove = null,
    disabled = false,
    onMove,
  }: Props = $props();
  let boardElement: HTMLDivElement;
  let board: Api | undefined;
  let pendingPromotion: PromotionRequest | undefined = $state();

  function config(): Config {
    const model = boardModel(fen, startSide, lastMove);
    const canMove = !disabled && model.turnColor === startSide;
    return {
      fen: model.fen,
      orientation: model.orientation,
      turnColor: model.turnColor,
      check: model.check,
      ...(model.lastMove === undefined ? {} : { lastMove: [...model.lastMove] }),
      highlight: { lastMove: true, check: true },
      movable: {
        free: false,
        color: canMove ? startSide : "both",
        dests: canMove ? model.dests : new Map(),
        showDests: true,
        events: { after: moved },
      },
    };
  }

  function moved(from: Key, to: Key): void {
    const promotion = promotionRequest(fen, from, to);
    if (promotion !== undefined) {
      pendingPromotion = promotion;
      board?.set({ movable: { dests: new Map() } });
      return;
    }
    void onMove(`${from}${to}`);
  }

  function promote(role: PromotionRole): void {
    if (pendingPromotion === undefined) return;
    const uci = promotionUci(pendingPromotion, role);
    pendingPromotion = undefined;
    void onMove(uci);
  }

  function cancelPromotion(): void {
    pendingPromotion = undefined;
    board?.set(config());
  }

  onMount(() => {
    board = Chessground(boardElement, config());
    return () => board?.destroy();
  });

  $effect(() => {
    fen;
    startSide;
    lastMove;
    disabled;
    pendingPromotion = undefined;
    board?.set(config());
    // Objective/checkpoint banners can move the board without resizing it.
    // Chessground caches DOM bounds, so redraw after layout settles or the
    // next pointer move is interpreted against the board's former position.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (typeof board?.redrawAll === "function") board.redrawAll();
      }),
    );
  });
</script>

<div class="board-shell">
  <div class="board" bind:this={boardElement} aria-label="Chessboard"></div>
  {#if pendingPromotion}
    <div class="promotion-picker" role="dialog" aria-label="Choose promotion piece">
      {#each pendingPromotion.roles as role}
        <button type="button" onclick={() => promote(role)}>{role}</button>
      {/each}
      <button type="button" onclick={cancelPromotion}>Cancel</button>
    </div>
  {/if}
</div>

<style>
  .board-shell,
  .board {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
  }

  .promotion-picker {
    position: absolute;
    inset: 40% 8% auto;
    z-index: 2;
    display: flex;
    gap: 0.25rem;
    padding: 0.5rem;
    background: Canvas;
    border: 1px solid CanvasText;
  }
</style>
