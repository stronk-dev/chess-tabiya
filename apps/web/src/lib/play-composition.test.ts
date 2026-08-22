import { describe, expect, it } from "vitest";

import { playBoardEdge, playViewportClass } from "./play-composition.js";

describe("play composition geometry", () => {
  it.each([
    [1440, 900, "desktop", 768],
    [1366, 768, "desktop", 640],
    [1280, 720, "desktop", 592],
    [768, 1024, "tablet", 688],
    [430, 932, "phone", 408],
    [390, 844, "phone", 368],
    [360, 680, "phone", 344],
  ] as const)("maps %d×%d to the %s %dpx board", (width, height, viewportClass, edge) => {
    expect(playViewportClass(width)).toBe(viewportClass);
    expect(playBoardEdge(width, height)).toBe(edge);
    expect(edge % 8).toBe(0);
  });
});
