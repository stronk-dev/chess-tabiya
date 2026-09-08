import { isPackDocumentFileName } from "@chess-tabiya/schema/pack-path";
import { describe, expect, it } from "vitest";

describe("feedback-delivery harness package resolution", () => {
  it("loads the shared pack-path authority through the public schema subpath", () => {
    expect(isPackDocumentFileName("example.json")).toBe(true);
    expect(isPackDocumentFileName("example.evidence.json")).toBe(false);
  });
});
