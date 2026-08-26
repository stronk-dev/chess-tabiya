// DISPOSABLE research harness — D1588/D1590. Not production code.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import {
  BoardInputController,
  boardInputPosition,
} from "../../apps/web/src/lib/board-input.js";
import {
  StagedMoveCoordinator,
  type InputRestoreReceipt,
  type MoveInputMode,
} from "./staged-move-prototype.js";

const root = process.cwd();
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function text(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function source(path: string): ts.SourceFile {
  return ts.createSourceFile(path, text(path), ts.ScriptTarget.Latest, true);
}

function interfaceMembers(path: string, name: string): readonly string[] {
  const file = source(path);
  for (const statement of file.statements) {
    if (!ts.isInterfaceDeclaration(statement) || statement.name.text !== name) continue;
    return Object.freeze(statement.members.map((member) => member.name?.getText(file) ?? "<unnamed>").sort());
  }
  throw new TypeError(`Missing interface ${name} in ${path}`);
}

function runActions(): readonly string[] {
  const rest = text("apps/server/src/rest.ts");
  const marker = "const match = /^\\/runs\\/([^/]+)\\/(";
  const start = rest.indexOf(marker);
  const end = start < 0 ? -1 : rest.indexOf(")$/.exec", start);
  if (start < 0 || end < 0) throw new TypeError("Could not read parseRunRoute action union");
  return Object.freeze(rest.slice(start + marker.length, end).split("|").sort());
}

function candidate(mode: MoveInputMode): { readonly uci: string; readonly restore: InputRestoreReceipt } {
  const controller = new BoardInputController(boardInputPosition(START, "white", false, true), "e2");
  if (mode === "text") {
    const before = controller.state;
    return {
      uci: controller.dispatch({ type: "text_move", value: "e4" }).moveUci!,
      restore: { mode, activeSquare: before.activeSquare, origin: before.origin, focus: "text", textValue: "e4" },
    };
  }
  if (mode === "keyboard_grid") {
    controller.dispatch({ type: "activate" });
    controller.dispatch({ type: "navigate", fileDelta: 0, rankDelta: -1 });
    controller.dispatch({ type: "navigate", fileDelta: 0, rankDelta: -1 });
    const before = controller.state;
    return {
      uci: controller.dispatch({ type: "activate" }).moveUci!,
      restore: { mode, activeSquare: before.activeSquare, origin: before.origin, focus: "keyboard_grid" },
    };
  }
  // Chessground reports click, drag and touch through the same `after` callback.
  controller.dispatch({ type: "pointer_origin", square: "e2" });
  const before = controller.state;
  return {
    uci: controller.dispatch({ type: "pointer_destination", square: "e4" }).moveUci!,
    restore: { mode, activeSquare: before.activeSquare, origin: before.origin, focus: "board" },
  };
}

describe("D1588 module delivery operation boundary", () => {
  it("proves the run route, client API, and async evidence page have no module operation", () => {
    const actions = runActions();
    expect(actions).toHaveLength(36);
    expect(actions).not.toContain("modules");
    expect(text("apps/web/src/lib/api.ts")).not.toMatch(/\bmodules\s*\(runId/u);
    expect(interfaceMembers("apps/web/src/lib/api.ts", "EvidencePage")).toEqual(["nextSeq", "results"]);
  });

  it("pins the current direct commit chain that a staged protocol must intercept", () => {
    const board = text("apps/web/src/lib/Chessboard.svelte");
    const drill = text("apps/web/src/lib/DrillScreen.svelte");
    const session = text("apps/web/src/lib/session-controller.ts");
    expect(board).toContain("void Promise.resolve(onMove(result.moveUci))");
    expect(drill).toContain("await onMove(uci);");
    expect(session).toContain("const result = await store.move({ uci });");
  });

  it("locates the post-commit module seam before the automatic opponent advances the cursor", () => {
    const session = text("apps/web/src/lib/session-controller.ts");
    const moveStart = session.indexOf("async move(uci: string)");
    const mutation = session.indexOf("const result = await store.move({ uci });", moveStart);
    const opponent = session.indexOf("await this.#playOpponentIfNeeded();", mutation);
    expect(moveStart).toBeGreaterThanOrEqual(0);
    expect(mutation).toBeGreaterThan(moveStart);
    expect(opponent).toBeGreaterThan(mutation);
    expect(interfaceMembers("packages/runtime/src/types.ts", "MutationResult")).toEqual(["emitted", "run"]);
  });
});

describe("D1590 shared staged-move handshake feasibility", () => {
  it("converges click, drag, touch, keyboard and text on one exact candidate before commit", () => {
    const modes: readonly MoveInputMode[] = ["click", "drag", "touch", "keyboard_grid", "text"];
    for (const mode of modes) {
      const coordinator = new StagedMoveCoordinator();
      const { uci, restore } = candidate(mode);
      expect(uci).toBe("e2e4");
      const request = coordinator.stage(mode, uci, restore);
      expect(coordinator.state).toEqual({ kind: "checking", generation: 1, mode, uci: "e2e4", restore });
      expect(request).toEqual({ generation: 1, uci: "e2e4" });
    }
  });

  it("commits an honest empty result exactly once and never calls a warning an all-clear", () => {
    const coordinator = new StagedMoveCoordinator();
    const request = coordinator.stage("touch", "e2e4", candidate("touch").restore);
    expect(coordinator.resolve(request, "empty")).toEqual({ accepted: true, commitUci: "e2e4" });
    expect(coordinator.confirm()).toEqual({ accepted: false });
    expect(coordinator.state.kind).toBe("committing");
  });

  it("holds a concrete risk for revise or exact-once confirm", () => {
    const coordinator = new StagedMoveCoordinator();
    const request = coordinator.stage("keyboard_grid", "e2e4", candidate("keyboard_grid").restore);
    expect(coordinator.resolve(request, "risk")).toEqual({ accepted: true });
    expect(coordinator.state.kind).toBe("warning");
    expect(coordinator.confirm()).toEqual({ accepted: true, commitUci: "e2e4" });
    expect(coordinator.confirm()).toEqual({ accepted: false });
  });

  it("states source failure and requires explicit confirm instead of treating it as safe", () => {
    const coordinator = new StagedMoveCoordinator();
    const request = coordinator.stage("drag", "e2e4", candidate("drag").restore);
    expect(coordinator.resolve(request, "unavailable")).toEqual({ accepted: true });
    expect(coordinator.state.kind).toBe("unavailable");
    expect(coordinator.confirm()).toEqual({ accepted: true, commitUci: "e2e4" });
  });

  it("invalidates a late response after revise or a newer gesture", () => {
    const coordinator = new StagedMoveCoordinator();
    const click = candidate("click");
    const stale = coordinator.stage("click", click.uci, click.restore);
    expect(coordinator.revise()).toEqual(click.restore);
    const textRestore: InputRestoreReceipt = { mode: "text", activeSquare: "d2", origin: null, focus: "text", textValue: "d4" };
    const current = coordinator.stage("text", "d2d4", textRestore);
    expect(coordinator.resolve(stale, "risk")).toEqual({ accepted: false });
    expect(coordinator.resolve(current, "empty")).toEqual({ accepted: true, commitUci: "d2d4" });
  });

  it("resolves promotion before creating the staged candidate", () => {
    const fen = "k7/4P3/8/8/8/8/8/4K3 w - - 0 1";
    const controller = new BoardInputController(boardInputPosition(fen, "white", false, true), "e7");
    controller.dispatch({ type: "pointer_origin", square: "e7" });
    const pending = controller.dispatch({ type: "pointer_destination", square: "e8" });
    expect(pending.state.phase).toBe("awaiting_promotion");
    expect(pending.moveUci).toBeUndefined();
    expect(controller.dispatch({ type: "promote", role: "queen" }).moveUci).toBe("e7e8q");
  });
});
