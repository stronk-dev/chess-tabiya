import { describe, expect, it } from "vitest";

import { parseEvidencePage } from "./evidence-page-response.js";

describe("evidence receipt page authority", () => {
  it("accepts and freezes an ordered cursor page", () => {
    const page = parseEvidencePage({ results: [{ seq: 4 }, { seq: 7 }], nextSeq: 8 }, 3);
    expect(page).toEqual({ results: [{ seq: 4 }, { seq: 7 }], nextSeq: 8 });
    expect(Object.isFrozen(page)).toBe(true); expect(Object.isFrozen(page.results)).toBe(true); expect(Object.isFrozen(page.results[0])).toBe(true);
  });

  it.each([
    [{ results: [{ seq: 4, payload: { kind: "eval" } }], nextSeq: 4 }, 3],
    [{ results: [{ seq: 3 }], nextSeq: 3 }, 3],
    [{ results: [{ seq: 5 }, { seq: 4 }], nextSeq: 5 }, 3],
    [{ results: [{ seq: 6 }], nextSeq: 5 }, 3],
    [{ results: [], nextSeq: 2 }, 3],
    [{ results: [], nextSeq: 3, runId: "crossed" }, 3],
  ] as const)("refuses leaked payloads and crossed or regressing cursor arithmetic", (value, sinceSeq) => {
    expect(() => parseEvidencePage(value, sinceSeq)).toThrow(TypeError);
  });
});
