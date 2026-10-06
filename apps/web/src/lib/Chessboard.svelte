<script lang="ts">
  import "@lichess-org/chessground/assets/chessground.base.css";
  import "@lichess-org/chessground/assets/chessground.cburnett.css";
  import "./theme/board-skins/brown.css";
  import "./theme/board-skins/olive.css";
  import "./theme/board-skins/contrast.css";
  import "./theme/interaction-paint.css";
  import "./theme/piece-skins/mono.css";

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
  import { useTheme } from "./theme/context.js";
  import type { BoardThemeId, PieceSetId } from "./theme/axes.js";
  import { MARK_BRUSHES } from "./theme/catalog.js";
  import { animationConfig, type ResolvedTheme } from "./theme/controller.js";
  import BoardNotation from "./BoardNotation.svelte";

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
    onSelect?: (square: Key | undefined) => void;
    onExitGrid?: () => void;
    activeSquare?: Square | undefined;
    onActiveSquareChange?: (square: Square) => void;
    lastMoveAnnouncement?: string | undefined;
    describedBy?: string | undefined;
    onMoveCommitted?: (announcement: string) => void;
    focusAfterMove?: boolean;
    boardTheme?: BoardThemeId;
    pieceSet?: PieceSetId;
    selectedSquare?: Key;
    /** Re-assert the current position without replacing the board instance. */
    resetToken?: string | number;
    onMoveSettled?: () => void;
    onFocusRestored?: () => void;
    /** `false` means the candidate was handled without an authoritative commit. */
    onMove: (uci: string) => boolean | void | Promise<boolean | void>;
    /** Play seats the same controller's notation projection in its fixed timeline strip. */
    showControls?: boolean;
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
    describedBy,
    onMoveCommitted,
    focusAfterMove = false,
    boardTheme,
    pieceSet,
    selectedSquare,
    resetToken = 0,
    onMoveSettled,
    onFocusRestored,
    onMove,
    showControls = true,
  }: Props = $props();
  let boardElement: HTMLDivElement;
  let gridElement: HTMLDivElement;
  const semanticBoardId = $props.id();
  let promotionPicker = $state<HTMLDivElement>();
  let board: Api | undefined;
  let boundsTimer: ReturnType<typeof setTimeout> | undefined;
  let moveGeneration = 0;
  const theme = useTheme();
  let resolvedTheme: ResolvedTheme = $state(theme.current);
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
  let appliedInputIdentity = "";
  let semanticRows = $derived(semanticBoardRows(inputPosition, inputState, semanticBoardId));
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
      ...(selectedSquare === undefined ? {} : { selected: selectedSquare }),
      ...(model.lastMove === undefined ? {} : { lastMove: [...model.lastMove] }),
      highlight: { lastMove: highlightMoves, check: true },
      drawable: {
        enabled: drawingEnabled,
        visible: true,
        autoShapes: [...overlays],
        shapes: [...marks],
        defaultSnapToValidMove: false,
        eraseOnMovablePieceClick: false,
        brushes: MARK_BRUSHES,
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
      animation: animationConfig(resolvedTheme.animation),
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
      const generation = ++moveGeneration;
      void Promise.resolve(onMove(result.moveUci)).then((committed) => {
        if (generation !== moveGeneration) return;
        if (committed === false) {
          inputState = controller.announce("Move was not committed. The board position is unchanged.");
          board?.set(config());
          return;
        }
        const announcement = result.successAnnouncement ?? "Move committed.";
        inputState = controller.announce(announcement);
        onMoveCommitted?.(announcement);
      }, () => {
        if (generation !== moveGeneration) return;
        inputState = controller.announce("Move was not committed. The board position is unchanged.");
        board?.set(config());
      }).finally(() => {
        if (generation === moveGeneration) onMoveSettled?.();
      });
    }
    return result;
  }

  function dispatch(action: BoardInputAction): BoardInputResult {
    if (action.type !== "cancel") escapeArmed = false;
    const result = apply(controller.dispatch(action));
    if (action.type === "cancel") onSelect?.(undefined);
    if (action.type === "activate" && result.state.phase === "origin_selected" && result.state.origin !== null) {
      onSelect?.(result.state.origin);
    }
    return result;
  }

  function moved(from: Key, to: Key): void {
    // Chessground reports both ends after click, drag, and touch. They all
    // enter the controller in the same order rather than owning a private UCI
    // or promotion path.
    dispatch({ type: "pointer_origin", square: controllerSquare(from) });
    dispatch({ type: "pointer_destination", square: controllerSquare(to) });
  }

  function invalidatePointerBounds(): void {
    // Same invalidation Chessground uses on scroll: no DOM replacement, gesture cancellation,
    // or animation reset. Its next coordinate read derives the current rectangle.
    board?.state.dom.bounds.clear();
  }

  function refreshBoundsAfterLayout(): void {
    if (boundsTimer !== undefined) clearTimeout(boundsTimer);
    boundsTimer = setTimeout(() => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          invalidatePointerBounds();
        }),
      );
    }, 0);
  }

  function selected(square: Key): void {
    onSelect?.(square);
    dispatch({ type: "pointer_origin", square: controllerSquare(square) });
    // A selection can reveal structural captions in the parent drill screen.
    // That changes the board's position without changing any Chessground prop,
    // so refresh cached pointer bounds on the next rendered frame. Repeat once
    // to cover a second layout pass without leaving the first safe click stale.
    requestAnimationFrame(() => {
      invalidatePointerBounds();
      requestAnimationFrame(() => {
        invalidatePointerBounds();
        if (board === undefined) return;
        const settled = board.state.selected;
        if (settled === undefined && inputState.phase === "origin_selected") {
          apply(controller.dispatch({ type: "cancel" }));
        }
        onSelect?.(settled);
      });
    });
  }

  function promote(role: PromotionRole): void {
    dispatch({ type: "promote", role });
  }

  function cancelPromotion(): void {
    dispatch({ type: "cancel" });
    // Chessground paints a dragged pawn before the shared controller asks for
    // promotion. Cancel has no committed FEN change, so restore that FEN too.
    board?.set(config());
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

  export function submitNotation(value: string): BoardInputResult {
    return dispatch({ type: "text_move", value });
  }

  export function notationDisabled(): boolean { return inputDisabled; }
  export function notationAvailable(): boolean { return !disabled; }

  onMount(() => {
    const unsubscribeTheme = theme.subscribe((next) => {
      resolvedTheme = next;
      board?.set({ animation: animationConfig(next.animation) });
    });
    board = Chessground(boardElement, config());
    // Capture precedes Chessground's child listeners, including the very first gesture after
    // a layout change. Invalidate only its geometry cache, never the originating touch subtree.
    boardElement.addEventListener("mousedown", invalidatePointerBounds, { capture: true, passive: true });
    boardElement.addEventListener("touchstart", invalidatePointerBounds, { capture: true, passive: true });
    return () => {
      unsubscribeTheme();
      boardElement.removeEventListener("mousedown", invalidatePointerBounds, true);
      boardElement.removeEventListener("touchstart", invalidatePointerBounds, true);
      if (boundsTimer !== undefined) clearTimeout(boundsTimer);
      board?.destroy();
    };
  });

  $effect(() => {
    const inputIdentity = JSON.stringify([fen, startSide, lastMove, inputDisabled, showDests, resetToken]);
    fen;
    startSide;
    lastMove;
    disabled;
    showDests;
    highlightMoves;
    overlays;
    marks;
    drawingEnabled;
    selectedSquare;
    resetToken;
    onMarksChange;
    // Selection drives evidence overlays, but neither it nor another visual
    // configuration change is a new chess position. Resetting the shared
    // controller here used to erase the origin between two touch taps.
    if (inputIdentity !== appliedInputIdentity) {
      appliedInputIdentity = inputIdentity;
      inputState = controller.replacePosition(inputPosition);
      escapeArmed = false;
    }
    board?.set(config());
    // Objective/checkpoint banners can move the board without resizing it.
    // Chessground caches DOM bounds, so redraw after layout settles or the
    // next pointer move is interpreted against the board's former position.
    // Full redraw replaces the touch origin and resets interpolation. Geometry-only invalidation
    // can run immediately without interrupting either an in-flight gesture or visible movement.
    refreshBoundsAfterLayout();
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

<div class="board-shell" data-board-theme={boardTheme ?? resolvedTheme.preference.boardTheme} data-piece-set={pieceSet ?? resolvedTheme.preference.pieceSet} data-animation={resolvedTheme.animation}>
  <div class="board-surface">
    <!-- svelte-ignore a11y_no_static_element_interactions (Chessground owns the interactive board subtree) -->
    <div class="board" bind:this={boardElement} aria-label="Chessboard" aria-describedby={describedBy}></div>
    <div
      class="semantic-grid"
      bind:this={gridElement}
      role="grid"
      tabindex="0"
      aria-label={boardLabel}
      aria-rowcount="8"
      aria-colcount="8"
      aria-readonly={inputDisabled ? "true" : undefined}
      aria-describedby={describedBy}
      aria-activedescendant={`${semanticBoardId}-square-${inputState.activeSquare}`}
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
    <div class="input-status visually-hidden" aria-live="polite" aria-atomic="true" role="status">{inputState.lastAnnouncement}</div>
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
  {#if !disabled && showControls}
    <BoardNotation disabled={inputDisabled} onSubmit={submitNotation} />
  {/if}
</div>

<style>
  .board-shell {
    position: relative;
    width: 100%;
  }

  .board-surface,
  .board {
    position: relative;
    width: 100%;
    max-width: 100%;
    aspect-ratio: 1;
  }

  .board-surface {
    min-height: 0;
    margin-inline: auto;
  }

  .board { position:absolute; inset:0; }

  /* Vendor coordinates use fixed offsets for large boards. Keep each glyph in its edge
     square instead, including compact/reflow and comparison boards, without changing sizing. */
  .board :global(coords.ranks) { top:0; left:4px; }
  .board :global(coords.ranks coord) { transform:none; padding-top:2px; box-sizing:border-box; }
  .board :global(coords.files) { left:0; bottom:0; height:12.5%; }
  .board :global(coords.files coord) { display:flex; justify-content:flex-end; align-items:flex-end; padding:2px 4px; box-sizing:border-box; }

  .semantic-grid {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: grid;
    grid-template-rows: repeat(8, 1fr);
    pointer-events: none;
    outline: none;
  }

  .semantic-grid:focus-visible { box-shadow: inset 0 0 0 3px var(--ink); }
  .semantic-row { display: grid; grid-template-columns: repeat(8, 1fr); }
  .semantic-cell { min-width: 0; min-height: 0; display: grid; place-items: center; color: transparent; }
  .semantic-cell.active { color: var(--ink); outline: 3px solid var(--ink); outline-offset: -3px; background: color-mix(in srgb, var(--ink) 16%, transparent); }
  .semantic-cell span { font: 600 0.55rem/1 ui-monospace, monospace; }

  .promotion-picker {
    position: absolute;
    inset: 40% 8% auto;
    z-index: 2;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.25rem;
    padding: 0.5rem;
    background: var(--panel);
    border: 1px solid var(--line);
  }
  .promotion-picker button { min-width:0; min-height:2.75rem; padding:.35rem; font-size:.8rem; }
  .promotion-picker button:last-child { grid-column:1 / -1; }
</style>
