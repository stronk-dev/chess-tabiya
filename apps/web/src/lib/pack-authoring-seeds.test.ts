import { describe, expect, it } from "vitest";

import { INITIAL_POSITION_FEN, authoringSlug, clonePackForAuthoring, playAuthoringMove, positionPackScaffold, positionTurn } from "./pack-authoring-seeds.js";

describe("pack authoring seeds", () => {
  it("builds all ten required top-level fields with explicit judgement debt", () => {
    const pack = positionPackScaffold({ title: "  Queenside Space  ", fen: INITIAL_POSITION_FEN, side: "white", suffix: "A 1" });
    expect(Object.keys(pack)).toEqual(expect.arrayContaining(["id", "version", "title", "mode", "start", "objective", "checkpoints", "opponentPolicy", "feedbackPolicy", "provenance"]));
    expect(pack).toMatchObject({ id: "queenside-space-a-1", title: "Queenside Space", provenance: { reviewStatus: "draft", licence: "CC-BY-SA-4.0" } });
    expect(pack.provenance.graduationBlockers).toHaveLength(3);
  });

  it("plays only legal board moves and follows the side to move", () => {
    expect(positionTurn(INITIAL_POSITION_FEN)).toBe("white");
    const after = playAuthoringMove(INITIAL_POSITION_FEN, "e2e4")!;
    expect(positionTurn(after)).toBe("black");
    expect(playAuthoringMove(after, "e2e5")).toBeUndefined();
    expect(positionTurn("not a fen")).toBeUndefined();
  });

  it("clones without mutating source identity and records a fresh review obligation", () => {
    const source = positionPackScaffold({ title: "Source", fen: INITIAL_POSITION_FEN, side: "white", suffix: "one" });
    const clone = clonePackForAuthoring(source, "two");
    expect(clone.id).toBe("source-one-copy-two");
    expect(clone.version).toBe("0.1.0");
    expect(clone.title).toBe("Source — copy");
    expect(clone.provenance.graduationBlockers).toHaveLength(4);
    expect(source.id).toBe("source-one");
    expect(authoringSlug("♟")).toBe("untitled");
  });
});
