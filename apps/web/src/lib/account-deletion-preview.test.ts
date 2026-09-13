import { describe, expect, it } from "vitest";

import type { DeletionPreview } from "./api.js";
import { assertAccountDeletionPreview } from "./account-deletion-preview.js";

const preview: DeletionPreview = Object.freeze({
  version: 1,
  scope: Object.freeze({ kind: "account" }),
  digest: `sha256:${"a".repeat(64)}`,
  hardDelete: Object.freeze([]),
  tombstone: Object.freeze([]),
  revoke: Object.freeze([]),
  retainedPublished: Object.freeze([]),
  backupNotice: "Live data is removed immediately.",
});

describe("account deletion preview validation", () => {
  it("admits only an account-scoped preview with a usable digest", () => {
    expect(() => assertAccountDeletionPreview(preview)).not.toThrow();
    expect(() => assertAccountDeletionPreview({ ...preview, scope: { kind: "run", runId: "run-one" } })).toThrow(/requested account/u);
    expect(() => assertAccountDeletionPreview({ ...preview, digest: "" })).toThrow(/requested account/u);
  });
});
