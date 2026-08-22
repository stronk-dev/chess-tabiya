import { describe, expect, it } from "vitest";

import {
  BoardInputController,
  boardInputPosition,
  moveSanFromUci,
  semanticBoardRows,
  visualRows,
} from "./board-input.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function controller(
  fen = INITIAL,
  orientation: "white" | "black" = "white",
  disabled = false,
  showDests = true,
): BoardInputController {
  return new BoardInputController(boardInputPosition(fen, orientation, disabled, showDests));
}

describe("BoardInputController", () => {
  it("renders only legal UCI as SAN for ordinary chrome", () => {
    expect(moveSanFromUci(INITIAL, "e2e4")).toBe("e4");
    expect(moveSanFromUci("4k3/8/8/8/8/8/8/4K2R w - - 0 1", "h1h8")).toBe("Rh8+");
    expect(moveSanFromUci(INITIAL, "e2e5")).toBeUndefined();
    expect(moveSanFromUci("not a fen", "e2e4")).toBeUndefined();
  });

  it("uses one state machine for pointer and keyboard moves", () => {
    const pointer = controller();
    pointer.dispatch({ type: "pointer_origin", square: "e2" });
    const pointerMove = pointer.dispatch({ type: "pointer_destination", square: "e4" });

    const keyboard = controller();
    keyboard.dispatch({ type: "navigate", fileDelta: 0, rankDelta: -1 });
    keyboard.dispatch({ type: "activate" });
    keyboard.dispatch({ type: "navigate", fileDelta: 0, rankDelta: -1 });
    keyboard.dispatch({ type: "navigate", fileDelta: 0, rankDelta: -1 });
    const keyboardMove = keyboard.dispatch({ type: "activate" });

    const text = controller().dispatch({ type: "text_move", value: "e4" });
    expect(pointerMove.moveUci).toBe("e2e4");
    expect(keyboardMove.moveUci).toBe(pointerMove.moveUci);
    expect(text.moveUci).toBe(pointerMove.moveUci);
  });

  it("uses visual coordinates under both orientations and never wraps", () => {
    expect(visualRows("white")[0]).toEqual(["a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"]);
    expect(visualRows("black")[0]).toEqual(["h1", "g1", "f1", "e1", "d1", "c1", "b1", "a1"]);

    const white = controller();
    white.dispatch({ type: "navigate", fileDelta: -1, rankDelta: 0 });
    expect(white.state.activeSquare).toBe("d1");
    white.dispatch({ type: "navigate_edge", axis: "rank", edge: "first" });
    expect(white.state.activeSquare).toBe("d8");

    const black = controller(INITIAL, "black");
    black.dispatch({ type: "navigate", fileDelta: 1, rankDelta: 0 });
    expect(black.state.activeSquare).toBe("d1");
    black.dispatch({ type: "navigate_edge", axis: "file", edge: "first" });
    expect(black.state.activeSquare).toBe("h1");

    for (const orientation of ["white", "black"] as const) {
      for (const activeSquare of visualRows(orientation).flat()) {
        const allSquares = new BoardInputController(
          boardInputPosition(INITIAL, orientation, false, true),
          activeSquare,
        );
        allSquares.dispatch({ type: "navigate", fileDelta: -1, rankDelta: 0 });
        allSquares.dispatch({ type: "navigate", fileDelta: 1, rankDelta: 0 });
        allSquares.dispatch({ type: "navigate", fileDelta: 0, rankDelta: -1 });
        allSquares.dispatch({ type: "navigate", fileDelta: 0, rankDelta: 1 });
        expect(visualRows(orientation).flat()).toContain(allSquares.state.activeSquare);
      }
    }
  });

  it("keeps semantic destination information under the visible board ceiling", () => {
    const hidden = controller(INITIAL, "white", false, false);
    hidden.dispatch({ type: "pointer_origin", square: "e2" });
    expect(hidden.state.legalDestinations).toEqual(["e3", "e4"]);
    expect(hidden.state.lastAnnouncement).not.toContain("Legal destinations");
    const rows = semanticBoardRows(boardInputPosition(INITIAL, "white", false, false), hidden.state);
    expect(rows.flat().find((cell) => cell.square === "e3")!.label).not.toContain("legal destination");
    const illegal = hidden.dispatch({ type: "pointer_destination", square: "e5" });
    expect(illegal.state.lastAnnouncement).toContain("not a legal destination");
    expect(hidden.dispatch({ type: "cancel" }).state.phase).toBe("idle");
  });

  it("holds promotion for the shared promote action and accepts explicit text promotion", () => {
    const fen = "7k/P7/8/8/8/8/8/7K w - - 0 1";
    const pointer = controller(fen);
    pointer.dispatch({ type: "pointer_origin", square: "a7" });
    const waiting = pointer.dispatch({ type: "pointer_destination", square: "a8" });
    expect(waiting.moveUci).toBeUndefined();
    expect(waiting.state.phase).toBe("awaiting_promotion");
    expect(pointer.dispatch({ type: "navigate", fileDelta: 1, rankDelta: 0 }).state.phase).toBe("awaiting_promotion");
    expect(pointer.dispatch({ type: "promote", role: "knight" }).moveUci).toBe("a7a8n");
    for (const [role, suffix] of [["queen", "q"], ["rook", "r"], ["bishop", "b"], ["knight", "n"]] as const) {
      const promoted = controller(fen);
      promoted.dispatch({ type: "pointer_origin", square: "a7" });
      promoted.dispatch({ type: "pointer_destination", square: "a8" });
      expect(promoted.dispatch({ type: "promote", role }).moveUci).toBe(`a7a8${suffix}`);
    }
    expect(controller(fen).dispatch({ type: "text_move", value: "a8=Q" }).moveUci).toBe("a7a8q");
    expect(controller(fen).dispatch({ type: "text_move", value: "a7a8r" }).moveUci).toBe("a7a8r");
  });

  it("normalizes SAN and UCI without sending an ambiguous or illegal text move", () => {
    expect(controller().dispatch({ type: "text_move", value: " E2E4 " }).moveUci).toBe("e2e4");
    expect(controller("4k3/7p/8/8/8/8/8/4K2R w - - 0 1").dispatch({ type: "text_move", value: "Rxh7" }).moveUci).toBe("h1h7");
    expect(controller("4k3/8/8/8/8/8/8/4K2R w - - 0 1").dispatch({ type: "text_move", value: "Rh8+" }).moveUci).toBe("h1h8");
    const castle = controller("4k2r/8/8/8/8/8/8/4K2R w K - 0 1");
    expect(castle.dispatch({ type: "text_move", value: "0-0" }).moveUci).toBe("e1g1");
    const passant = controller("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1");
    expect(passant.dispatch({ type: "text_move", value: "exd6" }).moveUci).toBe("e5d6");
    const ambiguous = controller("4k3/8/8/8/8/2N3N1/8/4K3 w - - 0 1");
    const rejected = ambiguous.dispatch({ type: "text_move", value: "Ne4" });
    expect(rejected.moveUci).toBeUndefined();
    expect(rejected.state.lastAnnouncement).toContain("ambiguous");
    for (const [role, suffix] of [["Q", "q"], ["R", "r"], ["B", "b"], ["N", "n"]] as const) {
      expect(controller("7k/P7/8/8/8/8/8/7K w - - 0 1").dispatch({ type: "text_move", value: `a8=${role}` }).moveUci).toBe(`a7a8${suffix}`);
    }
  });

  it("has one inert submission reason while preserving position reading", () => {
    const disabled = controller(INITIAL, "white", true);
    const active = disabled.state.activeSquare;
    const reason = "This board is not accepting moves.";
    expect(disabled.dispatch({ type: "activate" }).state.lastAnnouncement).toBe(reason);
    expect(disabled.dispatch({ type: "pointer_origin", square: "e2" }).state.lastAnnouncement).toBe(reason);
    expect(disabled.dispatch({ type: "pointer_destination", square: "e4" }).state.lastAnnouncement).toBe(reason);
    expect(disabled.dispatch({ type: "text_move", value: "e4" }).state.lastAnnouncement).toBe(reason);
    expect(disabled.dispatch({ type: "promote", role: "queen" }).state.lastAnnouncement).toBe(reason);
    disabled.dispatch({ type: "navigate", fileDelta: 1, rankDelta: 0 });
    expect(disabled.state.activeSquare).not.toBe(active);
  });

  it("allows pointer and keyboard to finish one shared selection", () => {
    const pointerThenKeyboard = controller();
    pointerThenKeyboard.dispatch({ type: "pointer_origin", square: "e2" });
    pointerThenKeyboard.dispatch({ type: "navigate", fileDelta: 0, rankDelta: -1 });
    expect(pointerThenKeyboard.dispatch({ type: "activate" }).moveUci).toBe("e2e3");

    const keyboardThenPointer = controller();
    keyboardThenPointer.dispatch({ type: "navigate", fileDelta: 0, rankDelta: -1 });
    keyboardThenPointer.dispatch({ type: "activate" });
    expect(keyboardThenPointer.dispatch({ type: "pointer_destination", square: "e4" }).moveUci).toBe("e2e4");
  });

  it("keeps semantic rows complete, stable, and free of evaluation language", () => {
    const state = controller().state;
    const rows = semanticBoardRows(boardInputPosition(INITIAL, "white", false, true), state);
    expect(rows).toHaveLength(8);
    expect(rows.every((row) => row.length === 8)).toBe(true);
    expect(rows.flat().filter((cell) => cell.active)).toHaveLength(1);
    expect(rows.flat().map((cell) => cell.id)).toContain("board-square-e1");
    expect(rows.flat().map((cell) => cell.label).join(" ")).not.toMatch(/best|good|blunder|engine|detector/iu);
  });
});
