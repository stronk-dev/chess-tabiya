import type { DeletionPreview } from "./api.js";

export function assertAccountDeletionPreview(preview: DeletionPreview): void {
  if (
    preview.version !== 1
    || preview.scope.kind !== "account"
    || typeof preview.digest !== "string"
    || preview.digest.length === 0
  ) {
    throw new Error("Account deletion preview did not match the requested account");
  }
}
