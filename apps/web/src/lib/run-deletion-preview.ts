import type { DeletionPreview } from "./api.js";

export function assertRunDeletionPreview(preview: DeletionPreview, runId: string): void {
  if (
    preview.version !== 1
    || preview.scope.kind !== "run"
    || preview.scope.runId !== runId
    || typeof preview.digest !== "string"
    || preview.digest.length === 0
  ) {
    throw new Error("Run deletion preview did not match its requested game");
  }
}
