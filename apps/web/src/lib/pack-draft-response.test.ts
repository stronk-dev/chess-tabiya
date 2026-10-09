import { describe, expect, it } from "vitest";

import type { PackDraft } from "./api.js";
import { packRegistrationBlockReason, parsePackPublicationIssues, validPackDraftIdentity } from "./pack-draft-response.js";

function draft(overrides: Partial<PackDraft> = {}): PackDraft {
  return {
    id: "draft-1",
    packId: "pack-1",
    document: { id: "pack-1" },
    digest: "sha256:digest",
    state: "draft",
    validation: { valid: false, issues: [] },
    ...overrides,
  };
}

describe("pack draft response identity", () => {
  it("accepts the requested mutable draft", () => {
    expect(validPackDraftIdentity(draft(), "pack-1")).toBe(true);
  });

  it.each([
    { id: "" },
    { packId: "pack-2" },
    { document: { id: "pack-2" } },
    { digest: "" },
    { state: "registered" as const },
  ])("refuses a crossed or unusable draft %#", (overrides) => {
    expect(validPackDraftIdentity(draft(overrides), "pack-1")).toBe(false);
  });
});

describe("pack publication readiness", () => {
  it("admits only structured publication errors, without carrying arbitrary diagnostic fields", () => {
    const source = { code: "SOURCE_MISSING", path: "/provenance/sources", message: "Attach a source.", severity: "error", diagnostic: "private" };
    expect(parsePackPublicationIssues([source, { code: "WARN", path: "", message: "Warning", severity: "warning" }])).toEqual([
      { code: "SOURCE_MISSING", path: "/provenance/sources", message: "Attach a source.", severity: "error" },
    ]);
  });

  it.each([undefined, null, {}, [], [null], [{ code: "X", path: "/field", message: 3 }], [{ code: "X", path: "private-file", message: "x" }], [{ code: "X", path: "", message: "x", severity: "fatal" }], [{ code: "W", path: "", message: "Warning only", severity: "warning" }]].map(value => ({ value })))("refuses malformed publication details %#", ({ value }) => {
    expect(parsePackPublicationIssues(value)).toBeUndefined();
  });

  it("compares JSON content rather than formatting or object key order", () => {
    const saved = draft({ document: { id: "pack-1", nested: { a: 1, b: [2, 3] } }, validation: { valid: true, issues: [] } });
    expect(packRegistrationBlockReason(saved, ' { "nested": { "b": [2, 3], "a": 1 }, "id": "pack-1" } ')).toBeUndefined();
    expect(packRegistrationBlockReason(saved, JSON.stringify({ id: "pack-1", nested: { a: 1, b: [3, 2] } }))).toContain("Save");
  });

  it.each([
    { graduationBlockers: ["Legacy source debt"] },
    { graduationBlockers: [{ id: "source", state: "blocking", statement: "Attach the source" }] },
  ])("retains a blocking condition in either supported grammar %#", ({ graduationBlockers }) => {
    const document = { id: "pack-1", provenance: { graduationBlockers } };
    expect(packRegistrationBlockReason(draft({ document, validation: { valid: true, issues: [] } }), JSON.stringify(document))).toContain("Resolve the declared graduation blockers");
  });

  it("does not turn resolved or explicitly accepted conditions into new blockers", () => {
    const document = { id: "pack-1", provenance: { graduationBlockers: [
      { id: "resolved", state: "resolved", statement: "Resolved condition" },
      { id: "accepted", state: "accepted", statement: "Accepted condition" },
    ] } };
    expect(packRegistrationBlockReason(draft({ document, validation: { valid: true, issues: [] } }), JSON.stringify(document))).toBeUndefined();
  });

  it("retains draft selection, state and saved validation gates", () => {
    expect(packRegistrationBlockReason(undefined, "{}")).toContain("Select");
    expect(packRegistrationBlockReason(draft({ state: "registered" }), "{}")).toContain("registered");
    expect(packRegistrationBlockReason(draft({ state: "withdrawn" }), "{}")).toContain("withdrawn");
    expect(packRegistrationBlockReason(draft(), '{"id":"pack-1"}')).toContain("validation errors");
    expect(packRegistrationBlockReason(draft(), "{")).toContain("JSON");
    expect(packRegistrationBlockReason(draft(), '{"id":"pack-1","number":1e400}')).toContain("JSON");
  });
});
