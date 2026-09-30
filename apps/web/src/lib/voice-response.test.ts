import { describe, expect, it } from "vitest";

import { parseVoicePage } from "./voice-response.js";

describe("voice response authority", () => {
  it("binds exact provider and deterministic text to the requested scope", () => {
    const provider = parseVoicePage({ text: "Look again at the pinned knight.", source: "provider", scope: "reading", recordedReadingsPresent: true }, "reading");
    const fallback = parseVoicePage({ text: "Recorded comparison evidence.", source: "deterministic", scope: "compare", recordedReadingsPresent: false }, "compare");
    expect(provider).toEqual({ text: "Look again at the pinned knight.", source: "provider", scope: "reading", recordedReadingsPresent: true });
    expect(fallback.scope).toBe("compare");
    expect(Object.isFrozen(provider)).toBe(true);
  });

  it.each([
    { text: "Grounded", source: "provider", scope: "story", recordedReadingsPresent: false, evidence: [] },
    { text: "", source: "provider", scope: "reading", recordedReadingsPresent: false },
    { text: "Grounded", source: "model", scope: "reading", recordedReadingsPresent: false },
    { text: "Grounded", source: "provider", scope: "story" },
    { text: ["Grounded"], source: "provider", scope: "reading", recordedReadingsPresent: false },
    { text: "Grounded", source: "provider", scope: "reading", recordedReadingsPresent: "yes" },
  ])("refuses malformed, unknown or crossed voice output", (value) => {
    expect(() => parseVoicePage(value, "reading")).toThrow(TypeError);
  });
});
