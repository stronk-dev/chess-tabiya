<script lang="ts">
  import "@lichess-org/chessground/assets/chessground.base.css";
  import "@lichess-org/chessground/assets/chessground.brown.css";
  import "@lichess-org/chessground/assets/chessground.cburnett.css";

  import { Chessground } from "@lichess-org/chessground";
  import type { Api } from "@lichess-org/chessground/api";
  import type { Config } from "@lichess-org/chessground/config";
  import type { DrawShape } from "@lichess-org/chessground/draw";
  import type { Key } from "@lichess-org/chessground/types";
  import { onMount, tick } from "svelte";

  import {
    boardModel,
    type PromotionRole,
    type StartSide,
  } from "./board-model.js";
  import {
    BoardInputController,
    boardInputPosition,
    promotionRoleLabel,
    semanticBoardRows,
    type BoardInputAction,
    type BoardInputResult,
    type BoardInputState,
    type Square,
  } from "./board-input.js";

  interface Props {
    fen: string;
    startSide: StartSide;
    lastMove?: string | null;
    disabled?: boolean;
    showDests?: boolean;
    highlightMoves?: boolean;
    overlays?: readonly DrawShape[];
    marks?: readonly DrawShape[];
    drawingEnabled?: boolean;
    onMarksChange?: (shapes: readonly DrawShape[]) => void;
    onSelect?: (square: Key) => void;
    onExitGrid?: () => void;
    activeSquare?: Square | undefined;
    onActiveSquareChange?: (square: Square) => void;
    lastMoveAnnouncement?: string | undefined;
    onMoveCommitted?: (announcement: string) => void;
    focusAfterMove?: boolean;
    onMoveSettled?: () => void;
    onFocusRestored?: () => void;
    onMove: (uci: string) => void | Promise<void>;
  }

  let {
    fen,
    startSide,
    lastMove = null,
    disabled = false,
    showDests = true,
    highlightMoves = true,
    overlays = [],
    marks = [],
    drawingEnabled = false,
    onMarksChange,
    onSelect,
    onExitGrid,
    activeSquare,
    onActiveSquareChange,
    lastMoveAnnouncement,
    onMoveCommitted,
    focusAfterMove = false,
    onMoveSettled,
    onFocusRestored,
    onMove,
  }: Props = $props();
  let boardElement: HTMLDivElement;
  let gridElement: HTMLDivElement;
  let promotionPicker = $state<HTMLDivElement>();
  let board: Api | undefined;
  let moveText = $state("");
  let escapeArmed = false;
  function newController(): BoardInputController {
    return new BoardInputController(
      boardInputPosition(
        fen,
        startSide,
        disabled || boardModel(fen, startSide, lastMove).turnColor !== startSide,
        showDests,
        lastMove,
      ),
      activeSquare,
      lastMoveAnnouncement,
    );
  }

  function controllerSquare(value: Key): Square {
    if (!/^[a-h][1-8]$/u.test(value)) throw new TypeError(`Invalid Chessground square: ${value}`);
    return value as Square;
  }

  let controller = newController();
  let inputState: BoardInputState = $state(controller.state);

  let boardState = $derived(boardModel(fen, startSide, lastMove));
  let inputDisabled = $derived(disabled || boardState.turnColor !== startSide);
  let inputPosition = $derived(boardInputPosition(fen, startSide, inputDisabled, showDests, lastMove));
  let semanticRows = $derived(semanticBoardRows(inputPosition, inputState));
  let boardLabel = $derived.by(() => {
    const moveNumber = fen.trim().split(/\s+/u)[5] ?? "unknown";
    const state = inputDisabled ? "read-only" : "playable";
    return `Board input. ${startSide} orientation. ${boardState.turnColor} to move. Move ${moveNumber}. ${state}.`;
  });

  function config(): Config {
    const model = boardModel(fen, startSide, lastMove);
    const canMove = !disabled && model.turnColor === startSide;
    return {
      fen: model.fen,
      orientation: model.orientation,
      turnColor: model.turnColor,
      check: model.check,
      ...(model.lastMove === undefined ? {} : { lastMove: [...model.lastMove] }),
      highlight: { lastMove: highlightMoves, check: true },
      drawable: {
        enabled: drawingEnabled,
        visible: true,
        autoShapes: [...overlays],
        shapes: [...marks],
        defaultSnapToValidMove: false,
        eraseOnMovablePieceClick: false,
        ...(onMarksChange === undefined ? {} : { onChange: onMarksChange }),
      },
      ...(onSelect === undefined ? {} : { events: { select: selected } }),
      movable: {
        free: false,
        color: canMove ? startSide : "both",
        dests: canMove ? model.dests : new Map(),
        showDests,
        events: { after: moved },
      },
    };
  }

  function apply(result: BoardInputResult): BoardInputResult {
    inputState = result.state;
    onActiveSquareChange?.(result.state.activeSquare);
    if (result.state.phase === "awaiting_promotion") {
      // The shared controller has accepted the origin/destination. Move the
      // keyboard path directly to the same labelled native choices a pointer
      // user receives instead of leaving it stranded on the grid.
      void tick().then(() => promotionPicker?.querySelector<HTMLButtonElement>("button")?.focus());
    }
    if (result.moveUci !== undefined) {
      onMoveCommitted?.(result.state.lastAnnouncement);
      void Promise.resolve(onMove(result.moveUci)).finally(() => {
        onMoveSettled?.();
      });
    }
    return result;
  }

  function dispatch(action: BoardInputAction): BoardInputResult {
    if (action.type !== "cancel") escapeArmed = false;
    return apply(controller.dispatch(action));
  }

  function moved(from: Key, to: Key): void {
    // Chessground reports both ends after click, drag, and touch. They all
    // enter the controller in the same order rather than owning a private UCI
    // or promotion path.
    dispatch({ type: "pointer_origin", square: controllerSquare(from) });
    dispatch({ type: "pointer_destination", square: controllerSquare(to) });
  }

  function redrawAfterLayout(): void {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (typeof board?.redrawAll === "function") board.redrawAll();
      }),
    );
  }

  function selected(square: Key): void {
    onSelect?.(square);
    dispatch({ type: "pointer_origin", square: controllerSquare(square) });
    // A selection can reveal structural captions in the parent drill screen.
    // That changes the board's position without changing any Chessground prop,
    // so refresh cached pointer bounds on the next rendered frame. Repeat once
    // to cover a second layout pass without leaving the first safe click stale.
    requestAnimationFrame(() => {
      if (typeof board?.redrawAll === "function") board.redrawAll();
      requestAnimationFrame(() => {
        if (typeof board?.redrawAll === "function") board.redrawAll();
      });
    });
  }

  function promote(role: PromotionRole): void {
    dispatch({ type: "promote", role });
  }

  function cancelPromotion(): void {
    dispatch({ type: "cancel" });
    void tick().then(() => gridElement?.focus());
  }

  function promotionKeydown(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    cancelPromotion();
  }

  function gridKeydown(event: KeyboardEvent): void {
    const navigate = (fileDelta: -1 | 0 | 1, rankDelta: -1 | 0 | 1): void => {
      event.preventDefault();
      event.stopPropagation();
      dispatch({ type: "navigate", fileDelta, rankDelta });
    };
    if (event.key === "ArrowRight") return navigate(1, 0);
    if (event.key === "ArrowLeft") return navigate(-1, 0);
    if (event.key === "ArrowUp") return navigate(0, -1);
    if (event.key === "ArrowDown") return navigate(0, 1);
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault(); event.stopPropagation();
      dispatch({ type: "navigate_edge", axis: "file", edge: event.key === "Home" ? "first" : "last" });
      return;
    }
    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault(); event.stopPropagation();
      dispatch({ type: "navigate_edge", axis: "rank", edge: event.key === "PageUp" ? "first" : "last" });
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault(); event.stopPropagation(); dispatch({ type: "activate" }); return;
    }
    if (event.key === "Escape") {
      event.preventDefault(); event.stopPropagation();
      if (inputState.phase !== "idle") {
        dispatch({ type: "cancel" });
        escapeArmed = true;
      } else if (escapeArmed) {
        onExitGrid?.();
        escapeArmed = false;
      } else {
        dispatch({ type: "cancel" });
        escapeArmed = true;
      }
    }
  }

  function submitText(event: SubmitEvent): void {
    event.preventDefault();
    const result = dispatch({ type: "text_move", value: moveText });
    if (result.moveUci !== undefined) moveText = "";
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
    showDests;
    highlightMoves;
    overlays;
    marks;
    drawingEnabled;
    onMarksChange;
    inputState = controller.replacePosition(inputPosition);
    escapeArmed = false;
    board?.set(config());
    // Objective/checkpoint banners can move the board without resizing it.
    // Chessground caches DOM bounds, so redraw after layout settles or the
    // next pointer move is interpreted against the board's former position.
    redrawAfterLayout();
  });

  $effect(() => {
    if (!focusAfterMove) return;
    void tick().then(() => {
      if (!gridElement?.isConnected) return;
      gridElement.focus();
      onFocusRestored?.();
    });
  });
</script>

<div class="board-shell">
  <details class="text-move">
    <summary>Enter a move</summary>
    <form onsubmit={submitText}>
      <label>Move in SAN or UCI <input bind:value={moveText} disabled={inputDisabled} aria-describedby={inputDisabled ? "text-move-disabled" : undefined} autocomplete="off" /></label>
      <button type="submit" disabled={inputDisabled} aria-describedby={inputDisabled ? "text-move-disabled" : undefined}>Submit move</button>
      {#if inputDisabled}<span id="text-move-disabled">This board is not accepting moves.</span>{/if}
    </form>
  </details>
  <div class="board-surface">
    <div class="board" bind:this={boardElement} aria-label="Chessboard"></div>
    <div
      class="semantic-grid"
      bind:this={gridElement}
      role="grid"
      tabindex="0"
      aria-label={boardLabel}
      aria-rowcount="8"
      aria-colcount="8"
      aria-readonly={inputDisabled ? "true" : undefined}
      aria-activedescendant={`board-square-${inputState.activeSquare}`}
      data-board-input-grid
      onkeydown={gridKeydown}
    >
      {#each semanticRows as row}
        <div class="semantic-row" role="row">
          {#each row as cell}
            <div
              id={cell.id}
              class:active={cell.active}
              class="semantic-cell"
              role="gridcell"
              aria-label={cell.label}
              aria-selected={cell.active ? "true" : "false"}
            ><span aria-hidden="true">{cell.square}</span></div>
          {/each}
        </div>
      {/each}
    </div>
    <div class="input-status" aria-live="polite" role="status">{inputState.lastAnnouncement}</div>
    {#if inputState.pendingPromotion}
      <div
        class="promotion-picker"
        bind:this={promotionPicker}
        role="dialog"
        tabindex="-1"
        aria-label="Choose promotion piece"
        onkeydown={promotionKeydown}
      >
        {#each inputState.pendingPromotion.roles as role}
          <button type="button" onclick={() => promote(role)}>{promotionRoleLabel(role)}</button>
        {/each}
        <button type="button" onclick={cancelPromotion}>Cancel</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .board-shell {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .board-surface,
  .board {
    position: relative;
    height: 100%;
    max-width: 100%;
    aspect-ratio: 1;
  }

  .board-surface {
    min-height: 0;
    margin-inline: auto;
  }

  .semantic-grid {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: grid;
    grid-template-rows: repeat(8, 1fr);
    pointer-events: none;
    outline: none;
  }

  .semantic-grid:focus-visible { box-shadow: inset 0 0 0 3px CanvasText; }
  .semantic-row { display: grid; grid-template-columns: repeat(8, 1fr); }
  .semantic-cell { min-width: 0; min-height: 0; display: grid; place-items: center; color: transparent; }
  .semantic-cell.active { color: CanvasText; outline: 3px solid CanvasText; outline-offset: -3px; background: rgb(255 255 255 / 16%); }
  .semantic-cell span { font: 600 0.55rem/1 ui-monospace, monospace; }

  .input-status {
    position: absolute;
    left: 0;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .text-move {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 100%;
    padding: 0.3rem 0.45rem;
    border: 1px solid var(--line, CanvasText);
    border-radius: 0.4rem;
    background: var(--panel, Canvas);
    font-size: 0.72rem;
  }

  .text-move summary { cursor: pointer; }
  .text-move form { grid-template-columns: minmax(0, 1fr) auto; gap: 0.3rem; margin-top: 0.35rem; }
  .text-move[open] form { display: grid; }
  .text-move label { display: grid; gap: 0.15rem; }
  .text-move input, .text-move button { min-width: 0; padding: 0.25rem; color: inherit; background: Canvas; border: 1px solid CanvasText; }

  @media (min-width: 720px) and (max-height: 800px) {
    .board-shell {
      height: 100%;
      aspect-ratio: auto;
      grid-template-columns: minmax(0, 1fr) 8.5rem;
      grid-template-rows: minmax(0, 1fr);
      gap: 0.4rem;
    }

    .board-surface { grid-column: 1; grid-row: 1; }
    .text-move { grid-column: 2; grid-row: 1; align-self: start; }
    .text-move form { grid-template-columns: 1fr; }
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
