import { describe, expect, it } from "vitest";

import { graduationEntries, requiredFieldStates, splitValidationIssues } from "./pack-validation-presentation.js";

describe("pack validation presentation", () => {
  it("derives the required-field checklist from unsaved JSON", () => {
    const states = requiredFieldStates('{"id":"candidate","title":"Title"}');
    expect(states.filter((state) => state.present).map((state) => state.field)).toEqual(["id", "title"]);
    expect(states).toHaveLength(10);
    expect(requiredFieldStates("{" ).every((state) => !state.present)).toBe(true);
  });

  it("separates unfinished fields, wrong values, and warnings", () => {
    const sections = splitValidationIssues([
      { severity: "error", code: "SCHEMA_REQUIRED", path: "/title", message: "title is required" },
      { severity: "error", code: "SCHEMA_ENUM", path: "/mode", message: "mode is unknown" },
      { severity: "warning", code: "TRANSPOSE", path: "/spine", message: "transposition" },
    ]);
    expect(sections.incomplete.map((issue) => issue.path)).toEqual(["/title"]);
    expect(sections.wrong.map((issue) => issue.path)).toEqual(["/mode"]);
    expect(sections.warnings.map((issue) => issue.path)).toEqual(["/spine"]);
  });

  it("projects graduation state from unsaved bytes and fails legacy entries closed", () => {
    expect(graduationEntries("{")).toBeUndefined();
    expect(graduationEntries(JSON.stringify({ provenance: { graduationBlockers: [
      { id: "grounding", state: "resolved", statement: "Evidence attached." },
      "Legacy prose blocker",
      null,
    ] } }))).toEqual([
      { id: "grounding", state: "resolved", statement: "Evidence attached.", legacy: false },
      { id: "legacy-2", state: "blocking", statement: "Legacy prose blocker", legacy: true },
      { id: "invalid-3", state: "blocking", statement: "Malformed graduation entry; fix the document before publication.", legacy: true },
    ]);
  });
});
