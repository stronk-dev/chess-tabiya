import { describe, expect, it } from "vitest";

import type { DeletionPreview } from "./api.js";
import { assertRunDeletionPreview } from "./run-deletion-preview.js";

const preview: DeletionPreview = Object.freeze({
  version: 1,
  scope: Object.freeze({ kind: "run", runId: "run-one" }),
  digest: `sha256:${"a".repeat(64)}`,
  hardDelete: Object.freeze([]),
  tombstone: Object.freeze([]),
  revoke: Object.freeze([]),
  retainedPublished: Object.freeze([]),
  backupNotice: "Live data is removed immediately.",
});

describe("run deletion preview validation", () => {
  it("admits only the requested run scope", () => {
    expect(() => assertRunDeletionPreview(preview, "run-one")).not.toThrow();
    expect(() => assertRunDeletionPreview(preview, "run-two")).toThrow(/requested game/u);
    expect(() => assertRunDeletionPreview({ ...preview, scope: { kind: "account" } }, "run-one")).toThrow(/requested game/u);
  });

  it("refuses a preview without a usable digest", () => {
    expect(() => assertRunDeletionPreview({ ...preview, digest: "" }, "run-one")).toThrow(/requested game/u);
  });
});
